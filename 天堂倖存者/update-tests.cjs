'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build}=require('./publish_update.cjs'),{update,recover}=require('./update_client.cjs'),{readSigned,safePath,validateManifest}=require('./update-common.cjs');
const put=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
function fixture(){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-update-test-')),tools=path.join(base,'tools'),output=path.join(base,'output'),root=path.join(base,'client');fs.mkdirSync(tools);fs.mkdirSync(root);
 put(path.join(tools,'update_client.cjs'),'// client fixture');put(path.join(tools,'l1stw_crawler.cjs'),'// crawler fixture');put(path.join(tools,'更新下載.bat'),'@echo off\necho TEST\n');
 put(path.join(tools,'離線遊戲/public/game.js'),'DOWNLOADED_GAME_MUST_NOT_BE_PUBLISHED');put(path.join(tools,'assets/image.png'),Buffer.from([1,2,3,4]));
 build({output,tools,keyPath:path.join(base,'private.pem')});fs.copyFileSync(path.join(tools,'trusted-key.pem'),path.join(root,'trusted-key.pem'));put(path.join(root,'update-config.json'),JSON.stringify({manifestUrl:'https://raw.githubusercontent.com/unit/test/main/updates/latest.json'}));
 const fetcher=async url=>{const name=new URL(url).pathname.split('/').at(-1),b=fs.readFileSync(name==='latest.json'?path.join(output,name):path.join(output,'objects',name));return new Response(b,{headers:{'Content-Length':String(b.length)}});};
 const cleanup=()=>{if(path.resolve(base).startsWith(path.resolve(os.tmpdir())+path.sep+'l1stw-update-test-'))fs.rmSync(base,{recursive:true,force:true});};return {base,tools,output,root,fetcher,cleanup};
}
test('signed tool updates support UTF-8 filenames and preserve downloaded games and saves',async()=>{const f=fixture();try{
 put(path.join(f.root,'owner-save.json'),'keep-me');put(path.join(f.root,'離線遊戲/public/game.js'),'my-local-game');
 assert.equal((await update({root:f.root,fetcher:f.fetcher,ignoreBusy:true})).status,'updated');assert.equal(fs.readFileSync(path.join(f.root,'更新下載.bat'),'utf8'),'@echo off\r\necho TEST\r\n');assert.equal(fs.readFileSync(path.join(f.root,'離線遊戲/public/game.js'),'utf8'),'my-local-game');assert.equal(fs.readFileSync(path.join(f.root,'owner-save.json'),'utf8'),'keep-me');
 let requests=0;assert.equal((await update({root:f.root,fetcher:async u=>{requests++;return f.fetcher(u);},ignoreBusy:true})).status,'current');assert.equal(requests,1);
 put(path.join(f.root,'l1stw_crawler.cjs'),'broken');assert.equal((await update({root:f.root,fetcher:f.fetcher,ignoreBusy:true,repair:true})).status,'updated');
}finally{f.cleanup();}});
test('invalid signatures and damaged packs cannot replace existing tools',async()=>{const f=fixture();try{
 put(path.join(f.root,'update_client.cjs'),'old-tool');const key=fs.readFileSync(path.join(f.root,'trusted-key.pem')),signed=fs.readFileSync(path.join(f.output,'latest.json'));let bad=JSON.parse(signed);bad.signature=Buffer.alloc(64).toString('base64');assert.throws(()=>readSigned(Buffer.from(JSON.stringify(bad)),key),/signature/);
 await assert.rejects(update({root:f.root,ignoreBusy:true,fetcher:async u=>u.endsWith('latest.json')?new Response(JSON.stringify(bad)):f.fetcher(u)}),/signature/);
 await assert.rejects(update({root:f.root,ignoreBusy:true,fetcher:async u=>{if(u.endsWith('latest.json'))return f.fetcher(u);const r=await f.fetcher(u),b=Buffer.from(await r.arrayBuffer());b[0]^=1;return new Response(b);}}),/checksum/);assert.equal(fs.readFileSync(path.join(f.root,'update_client.cjs'),'utf8'),'old-tool');
}finally{f.cleanup();}});
test('network failure and interrupted transactions preserve tools and repository checkouts',async()=>{const f=fixture();try{
 put(path.join(f.root,'offline_server.cjs'),'new-interrupted');const stage=path.join(f.root,'.update-stage','test');put(path.join(stage,'backup/tool/offline_server.cjs'),'old-restored');put(path.join(f.root,'.installed-update.json'),'incorrect-new-state');put(path.join(f.root,'.pending-update.json'),JSON.stringify({stage:'.update-stage/test',previousState:false,files:[{area:'tool',path:'offline_server.cjs',existed:true}]}));recover(f.root);assert.equal(fs.readFileSync(path.join(f.root,'offline_server.cjs'),'utf8'),'old-restored');assert(!fs.existsSync(path.join(f.root,'.installed-update.json')));
 await assert.rejects(update({root:f.root,ignoreBusy:true,fetcher:async()=>{throw Error('offline');}}),/offline/);assert(!fs.existsSync(path.join(f.root,'.update.lock')));
 fs.mkdirSync(path.join(f.root,'.git'));assert.equal((await update({root:f.root,fetcher:async()=>{throw Error('must not fetch');}})).status,'source-checkout');
 assert.throws(()=>safePath(f.root,'../save.json'));assert.throws(()=>safePath(f.root,'assets/a:stream.png'));
}finally{f.cleanup();}});
test('publisher excludes all game resources and rejects old full-game manifests',()=>{const f=fixture();try{
 const key=fs.readFileSync(path.join(f.tools,'trusted-key.pem')),m=readSigned(fs.readFileSync(path.join(f.output,'latest.json')),key);assert.equal(m.kind,'tools-only');assert(m.files.every(x=>x.area==='tool'&&!/assets|game\.js/.test(x.path)));
 const b=build({output:f.output,tools:f.tools,keyPath:path.join(f.base,'private.pem')}).summary.version;assert.equal(m.version,b);assert(!fs.readdirSync(f.output).includes('private.pem'));
 assert.throws(()=>build({source:f.base,output:f.output,tools:f.tools,keyPath:path.join(f.base,'private.pem')}),/Tool-only/);
 assert.throws(()=>validateManifest({...m,schema:1}),/tool-only/);assert.throws(()=>validateManifest({...m,files:[...m.files,{...m.files[0],area:'game',path:'index.html'}]}),/not allowed/);
}finally{f.cleanup();}});
test('a signed older remote release cannot overwrite a newer local launcher fix',async()=>{const f=fixture();try{
 const m=readSigned(fs.readFileSync(path.join(f.output,'latest.json')),fs.readFileSync(path.join(f.tools,'trusted-key.pem')));
 const version='f'.repeat(64);put(path.join(f.root,'update_client.cjs'),'new-local-fix');put(path.join(f.root,'.installed-update.json'),JSON.stringify({version,releaseCreated:new Date(Date.parse(m.created)+1000).toISOString(),files:[]}));let packs=0;
 const result=await update({root:f.root,ignoreBusy:true,fetcher:async u=>{if(!u.endsWith('latest.json'))packs++;return f.fetcher(u);}});
 assert.equal(result.status,'older');assert.equal(result.version,version);assert.equal(packs,0);assert.equal(fs.readFileSync(path.join(f.root,'update_client.cjs'),'utf8'),'new-local-fix');
}finally{f.cleanup();}});
