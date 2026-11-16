#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {sha,save,validateManifest,TOOL_FILES}=require('./update-common.cjs');
function readTool(file){const b=fs.readFileSync(file);if(!file.toLowerCase().endsWith('.bat'))return b;const s=b.toString('utf8');if(/[^\x00-\x7f]/.test(s))throw Error('Batch entry points must contain ASCII commands only: '+path.basename(file));return Buffer.from(s.replace(/\r?\n/g,'\r\n'),'ascii');}
function build({source,output,tools=__dirname,keyPath=path.join(os.homedir(),'Desktop','天堂倖存者','.publisher','update-private.pem')}){
 if(source!==undefined)throw Error('Tool-only publishing does not accept a game source directory');
 output=path.resolve(output);tools=path.resolve(tools);
 if(keyPath.toLowerCase().startsWith(output.toLowerCase()+path.sep)||keyPath.toLowerCase().startsWith(tools.toLowerCase()+path.sep))throw Error('Signing key must stay outside the repository/tool directory');
 let privateKey;if(fs.existsSync(keyPath))privateKey=crypto.createPrivateKey(fs.readFileSync(keyPath));else{const pair=crypto.generateKeyPairSync('ed25519');privateKey=pair.privateKey;save(keyPath,privateKey.export({type:'pkcs8',format:'pem'}));console.log('已建立本機簽章金鑰；不會放入 GitHub 資料夾。');}
 const publicKey=crypto.createPublicKey(privateKey).export({type:'spki',format:'pem'});
 const pinned=path.join(tools,'trusted-key.pem');if(fs.existsSync(pinned)&&fs.readFileSync(pinned,'utf8')!==publicKey)throw Error('Signing key differs from pinned public key');save(pinned,publicKey);
 const files=[];
 for(const name of [...TOOL_FILES].sort())if(fs.existsSync(path.join(tools,name))){if(fs.lstatSync(path.join(tools,name)).isSymbolicLink())throw Error('Symlinks cannot be published');files.push({area:'tool',path:name,local:path.join(tools,name)});}
 const buckets=Array.from({length:256},()=>[]);for(const f of files){const b=readTool(f.local);f.bytes=b.length;f.sha256=sha(b);if(f.bytes>64*1048576)throw Error('File exceeds pack limit: '+f.path);buckets[parseInt(sha(f.area+'/'+f.path).slice(0,2),16)].push(f);}
 const packs=[],entries=[];
 function pack(group){if(!group.length)return;let offset=0;const buffers=[];for(const f of group){const b=readTool(f.local);buffers.push(b);f.offset=offset;offset+=b.length;}const zipped=zlib.gzipSync(Buffer.concat(buffers),{level:6}),id=sha(zipped),dest=path.join(output,'objects',id+'.gz');if(!fs.existsSync(dest)||sha(fs.readFileSync(dest))!==id)save(dest,zipped);packs.push({id,bytes:zipped.length,unpackedBytes:offset});for(const f of group)entries.push({area:f.area,path:f.path,bytes:f.bytes,sha256:f.sha256,offset:f.offset,pack:id});}
 for(const bucket of buckets){bucket.sort((a,b)=>(a.area+'/'+a.path).localeCompare(b.area+'/'+b.path));let group=[],size=0;for(const f of bucket){if(group.length&&size+f.bytes>16*1048576){pack(group);group=[];size=0;}group.push(f);size+=f.bytes;}pack(group);}
 entries.sort((a,b)=>(a.area+'/'+a.path).localeCompare(b.area+'/'+b.path));packs.sort((a,b)=>a.id.localeCompare(b.id));
 const version=sha(JSON.stringify(entries.map(f=>[f.area,f.path,f.sha256]))),manifest=validateManifest({schema:2,kind:'tools-only',version,created:new Date().toISOString(),files:entries,packs});
 const data=Buffer.from(JSON.stringify(manifest)),envelope=Buffer.from(JSON.stringify({payload:data.toString('base64'),signature:crypto.sign(null,data,privateKey).toString('base64')}));
 save(path.join(output,'latest.json.new'),envelope);fs.renameSync(path.join(output,'latest.json.new'),path.join(output,'latest.json'));
 const summary={kind:'tools-only',version,files:entries.length,packs:packs.length,bytes:packs.reduce((n,p)=>n+p.bytes,0),publicKeyFingerprint:sha(Buffer.from(publicKey))};save(path.join(output,'build-summary.json'),JSON.stringify(summary,null,2));console.log('工具更新包準備完成',summary);return {manifest,summary};
}
if(require.main===module){const a=process.argv.slice(2),value=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;try{build({source:value('--source',undefined),output:value('--output',path.join(__dirname,'updates')),tools:__dirname,keyPath:value('--key',undefined)});}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={build,readTool};
