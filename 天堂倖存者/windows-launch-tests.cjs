'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {launch}=require('./repatch_local.cjs'),{readTool}=require('./publish_update.cjs');
const entries={'開啟離線版.bat':['repatch_local.cjs',['--launch']],'更新下載.bat':['l1stw_crawler.cjs',[]],'重新補抓缺檔.bat':['retry_missing.cjs',['--concurrency','8']],'產生GitHub更新包.bat':['publish_update.cjs',[]],'檢查更新.bat':['update_client.cjs',['--repair']]};
entries['GM模式.bat']=['repatch_local.cjs',['--launch']];
test('every Windows batch entry point is ASCII and CRLF',()=>{
 for(const name of Object.keys(entries)){const b=fs.readFileSync(path.join(__dirname,name)),s=b.toString('utf8');assert(!/[^\x00-\x7f]/.test(s),name);assert(!/(?<!\r)\n/.test(s),name);assert(s.endsWith('\r\n'),name);assert(s.includes('cd /d "%~dp0"'),name);}
});
test('cmd executes all six batch files from a path with spaces and Chinese characters',{skip:process.platform!=='win32'},()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-launch-test-')),dir=path.join(base,'空白 測試 folder');fs.mkdirSync(dir);
 try{
  for(const [name,[module,args]]of Object.entries(entries)){let s=fs.readFileSync(path.join(__dirname,name),'ascii');if(s.includes('function Show-GameModeDialog'))s=s.replace('# RUN_BOOTSTRAP',"function Show-GameModeDialog { return 'normal' }\r\n# RUN_BOOTSTRAP");fs.writeFileSync(path.join(dir,name),s,'ascii');fs.writeFileSync(path.join(dir,module),`console.log('ENTRY_OK '+JSON.stringify({file:${JSON.stringify(module)},args:process.argv.slice(2)}));`);const r=cp.spawnSync(process.env.ComSpec||'cmd.exe',['/d','/c',name],{cwd:dir,input:'\r\n',encoding:'utf8',windowsHide:true,timeout:60000});assert.equal(r.error,undefined,name);assert.equal(r.status,0,name+' '+r.stderr);assert.equal(r.stderr,'',name);assert(r.stdout.includes('ENTRY_OK '+JSON.stringify({file:module,args})),name+' '+r.stdout);}
 }finally{if(path.resolve(base).startsWith(path.resolve(os.tmpdir())+path.sep+'l1stw-launch-test-'))fs.rmSync(base,{recursive:true,force:true});}
});
test('launch preserves offline fallback and stops on missing data or a failed patch',async()=>{
 const calls=[],run=async(file,args=[])=>{calls.push([file,args]);return file==='update_client.cjs'?1:0;};assert.equal(await launch({run,exists:()=>true}),0);assert.deepEqual(calls,[['update_client.cjs',[]],['retry_missing.cjs',['--startup']],['repatch_local.cjs',[]],['offline_server.cjs',['--open']]]);
 const missing=[];await assert.rejects(launch({exists:()=>false,run:async f=>{missing.push(f);return 0;}}),/尚未下載/);assert.deepEqual(missing,['update_client.cjs']);
 const failed=[];await assert.rejects(launch({exists:()=>true,run:async f=>{failed.push(f);return f==='repatch_local.cjs'?2:0;}}),/準備失敗/);assert.deepEqual(failed,['update_client.cjs','retry_missing.cjs','repatch_local.cjs']);
 const local=[];await launch({checkUpdate:false,checkAssets:false,open:false,exists:()=>true,run:async(f,a=[])=>{local.push([f,a]);return 0;}});assert.deepEqual(local,[['repatch_local.cjs',[]],['offline_server.cjs',[]]]);
});
test('published batch files are normalized to CRLF and reject non-ASCII commands',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-batch-test-')),p=path.join(dir,'entry.bat');try{fs.writeFileSync(p,'@echo off\nnode entry.cjs\n');assert.equal(readTool(p).toString('ascii'),'@echo off\r\nnode entry.cjs\r\n');fs.writeFileSync(p,'@echo off\necho 中文\n');assert.throws(()=>readTool(p),/ASCII/);}finally{if(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'l1stw-batch-test-'))fs.rmSync(dir,{recursive:true,force:true});}
});
