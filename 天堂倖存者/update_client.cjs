#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),net=require('node:net');
const {sha,safePath,save,readSigned,TOOL_FILES,inRepository}=require('./update-common.cjs');
const STATE='.installed-update.json',JOURNAL='.pending-update.json';
function target(root,f){if(f.area!=='tool'||!TOOL_FILES.has(f.path))throw Error('Invalid tool target');return safePath(root,f.path);}
function noLinks(root,dest){let p=dest;while(p.length>=path.resolve(root).length){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Symbolic links are not supported for updates');if(p===path.resolve(root))break;p=path.dirname(p);}}
function cleanStage(root,stage){const base=path.resolve(root,'.update-stage')+path.sep;if(!path.resolve(stage).startsWith(base))throw Error('Unsafe staging path');fs.rmSync(stage,{recursive:true,force:true});}
function recover(root){const p=path.join(root,JOURNAL);if(!fs.existsSync(p))return;const j=JSON.parse(fs.readFileSync(p,'utf8')),stage=safePath(root,j.stage);if(!stage.startsWith(path.join(root,'.update-stage')+path.sep)||!Array.isArray(j.files))throw Error('Invalid recovery journal');for(const f of j.files){const dest=target(root,f);noLinks(root,dest);if(f.existed){const backup=safePath(path.join(stage,'backup',f.area),f.path);if(!fs.existsSync(backup))throw Error('Recovery backup missing');save(dest,fs.readFileSync(backup));}else if(fs.existsSync(dest))fs.unlinkSync(dest);}if(j.previousState===true)save(path.join(root,STATE),fs.readFileSync(path.join(stage,'previous-state.json')));else if(j.previousState===false&&fs.existsSync(path.join(root,STATE)))fs.unlinkSync(path.join(root,STATE));if(fs.existsSync(path.join(root,STATE)+'.new'))fs.unlinkSync(path.join(root,STATE)+'.new');fs.unlinkSync(p);cleanStage(root,stage);console.log('已還原先前中斷的更新。');}
function busy(port){return new Promise(resolve=>{const s=net.connect({host:'127.0.0.1',port});const done=v=>{s.destroy();resolve(v);};s.once('connect',()=>done(true));s.once('error',()=>done(false));s.setTimeout(400,()=>done(false));});}
async function get(url,maxBytes,fetcher,timeout=35000){
 const r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(timeout),headers:{'Cache-Control':'no-cache'}});if(!r.ok){await r.body?.cancel();throw Error('HTTP '+r.status);}
 if(+(r.headers.get('content-length')||0)>maxBytes)throw Error('Update response too large');let length=0;const chunks=[];
 for await(const c of r.body){length+=c.length;if(length>maxBytes)throw Error('Update response too large');chunks.push(c);}return Buffer.concat(chunks);
}
function stateFor(root,m){return {version:m.version,installed:new Date().toISOString(),files:m.files.map(f=>{const s=fs.statSync(target(root,f));return {area:f.area,path:f.path,sha256:f.sha256,bytes:s.size,mtimeMs:s.mtimeMs};})};}
async function performUpdate({root=__dirname,fetcher=fetch,allowLoopback=false,ignoreBusy=false,repair=false,checkOnly=false,onBeforeCommit}={}){
 root=path.resolve(root);let port=8379;try{port=JSON.parse(fs.readFileSync(path.join(root,'update-config.json'),'utf8')).port||8379;}catch{}
 if(!ignoreBusy&&await busy(port)){console.log('遊戲執行中，請關閉遊戲與伺服器後再更新。');return {status:'busy'};}
 recover(root);
 const config=JSON.parse(fs.readFileSync(path.join(root,'update-config.json'),'utf8')),url=new URL(config.manifestUrl);if(!(url.protocol==='https:'&&url.hostname==='raw.githubusercontent.com')&&!(allowLoopback&&url.protocol==='http:'&&url.hostname==='127.0.0.1'))throw Error('Invalid update origin');
 const m=readSigned(await get(url.href,16*1048576,fetcher,8000),fs.readFileSync(path.join(root,'trusted-key.pem')));
 let previous={files:[]};try{previous=JSON.parse(fs.readFileSync(path.join(root,STATE),'utf8'));}catch{}
 if(checkOnly){console.log('可用更新版本',m.version.slice(0,12));return {status:'checked',version:m.version};}
 if(!repair&&previous.version===m.version){console.log('目前已是最新離線版本。');return {status:'current',version:m.version};}
 const old=new Map((previous.files||[]).map(f=>[f.area+'/'+f.path,f])),changed=[];
 for(const f of m.files){const dest=target(root,f);noLinks(root,dest);let valid=false;try{const st=fs.statSync(dest),before=old.get(f.area+'/'+f.path);valid=st.isFile()&&st.size===f.bytes&&(!repair&&before?.sha256===f.sha256&&before.mtimeMs===st.mtimeMs||sha(fs.readFileSync(dest))===f.sha256);}catch{}if(!valid)changed.push(f);}
 if(!changed.length){save(path.join(root,STATE),JSON.stringify(stateFor(root,m)));console.log('檔案已符合最新版本。');return {status:'current',version:m.version};}
 const stage=path.join(root,'.update-stage',crypto.randomUUID());fs.mkdirSync(stage,{recursive:true});let journalWritten=false;
 try{
  const needed=[...new Set(changed.map(f=>f.pack))],packs=new Map(m.packs.map(p=>[p.id,p]));let count=0;
  const workers=Array.from({length:Math.min(4,needed.length)},async()=>{while(needed.length){const id=needed.shift(),p=packs.get(id),u=new URL('objects/'+id+'.gz',url),compressed=await get(u.href,p.bytes,fetcher);if(compressed.length!==p.bytes||sha(compressed)!==id)throw Error('Update pack checksum mismatch');const raw=zlib.gunzipSync(compressed,{maxOutputLength:p.unpackedBytes});if(raw.length!==p.unpackedBytes)throw Error('Update pack size mismatch');for(const f of changed.filter(f=>f.pack===id)){const b=raw.subarray(f.offset,f.offset+f.bytes);if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Update file checksum mismatch');save(safePath(path.join(stage,'new',f.area),f.path),b);}console.log('已驗證更新包',++count,'/',new Set(changed.map(f=>f.pack)).size);}});
  // Wait for every worker, even when one fails, before cleaning the staging directory.
  const results=await Promise.allSettled(workers),failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
  if(onBeforeCommit)onBeforeCommit();
  const journal={stage:path.relative(root,stage).replaceAll('\\','/'),previousState:fs.existsSync(path.join(root,STATE)),files:changed.map(f=>({...f,existed:fs.existsSync(target(root,f))}))};
  for(const f of journal.files)if(f.existed)save(safePath(path.join(stage,'backup',f.area),f.path),fs.readFileSync(target(root,f)));
  if(journal.previousState)save(path.join(stage,'previous-state.json'),fs.readFileSync(path.join(root,STATE)));
  save(path.join(root,JOURNAL),JSON.stringify(journal));journalWritten=true;
  for(const f of changed){const dest=target(root,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.renameSync(safePath(path.join(stage,'new',f.area),f.path),dest);}
  save(path.join(root,STATE)+'.new',JSON.stringify(stateFor(root,m)));fs.renameSync(path.join(root,STATE)+'.new',path.join(root,STATE));
  fs.unlinkSync(path.join(root,JOURNAL));journalWritten=false;cleanStage(root,stage);console.log('更新完成，已套用',changed.length,'個檔案。');return {status:'updated',version:m.version,changed:changed.length};
 }catch(e){if(journalWritten)recover(root);else cleanStage(root,stage);throw e;}
}
async function update(options={}){
 const root=path.resolve(options.root||__dirname),lock=path.join(root,'.update.lock');let fd;
 if(inRepository(root)){console.log('儲存庫內不套用更新；請使用桌面的工具。');return {status:'source-checkout'};}
 for(let i=0;i<2;i++)try{fd=fs.openSync(lock,'wx');fs.writeFileSync(fd,String(process.pid));break;}catch(e){if(e.code!=='EEXIST')throw e;let live=true;try{const pid=Number(fs.readFileSync(lock,'utf8'));if(!Number.isInteger(pid)||pid<=0)throw Error('Invalid lock');process.kill(pid,0);}catch(e){if(e.code==='ESRCH')live=false;}if(live){console.log('另一個更新程序正在執行。');return {status:'busy'};}fs.unlinkSync(lock);}
 if(fd===undefined)throw Error('Cannot acquire update lock');
 try{return await performUpdate({...options,root});}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
if(require.main===module)update({repair:process.argv.includes('--repair'),checkOnly:process.argv.includes('--check')}).catch(e=>{console.log('更新未套用：'+e.message+'。可繼續使用本機離線版本。');if(!fs.existsSync(path.join(__dirname,'離線遊戲','public','index.html')))process.exitCode=1;});
module.exports={update,recover,stateFor};
