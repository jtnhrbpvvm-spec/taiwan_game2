'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Crawler,expression,localPath,args,assertOutput}=require('./l1stw_crawler.cjs');
test('only download same-origin static resources; keep cache-busting URLs',()=>{
 const c=new Crawler({output:'.test-output'});
 c.add('https://example.com/steal.js');c.add('/api/private');c.add('/assets/a.png?v=42');c.add('/assets/a.png?v=43');c.add('/assets/${id}.png');
 assert.equal(c.queue.length,1);assert.equal(c.queue[0].url,'https://l1stw.com/assets/a.png?v=42');
 assert.throws(()=>localPath('C:/offline','../outside'));assert.throws(()=>args(['--concurrency','0']));
 assert.throws(()=>localPath('C:/offline','assets/a:stream.png'));assert.throws(()=>localPath('C:/offline','assets/CON.png'));
 assert.equal(args([]).output,require('./update-common.cjs').defaultGameRoot());assert.throws(()=>assertOutput('C:/Users/a2095/Documents/GitHub/taiwan_game2/天堂倖存者/離線遊戲'));
});
test('constant extraction retains nested arrays, objects and quoted punctuation',()=>{
 const s='[{dir:"assets/map0/",files:["a.webp","b.webp"],x:{q:";,}"}}],ignored=2;';
 assert.equal(expression(s,0),'[{dir:"assets/map0/",files:["a.webp","b.webp"],x:{q:";,}"}}]');
});
test('lexical metadata and lazy maps produce generated asset paths; getters are not invoked',()=>{
 const c=new Crawler({output:'.test-output'});
 c.texts.set('index.html','<script src="data.js"></script><script src="assets/map1/map.js"></script>');
 c.texts.set('data.js','const DATA={};const META={37:{0:{frames:4}}};');
 c.texts.set('assets/map1/map.js','window.MAPS={1:{info:{dir:"../maps/map1/",files:["1_2.webp"]}}};');
 c.texts.set('game.js','const BAD={get event(){throw Error("must not execute")}}; const DOGMETA={7:{3:{frames:4}}};const PORTRAIT_SET=new Set([37]);const CREDIT={src:"not-an-image-credit"};const NPC={kind:"shop",id:70908};');
 c.evaluateData();c.discover();const paths=new Set(c.queue.map(j=>j.rel));
 assert(paths.has('assets/37/37-0.png'));assert(paths.has('assets/7/7-3.png'));assert(paths.has('maps/map1/1_2.webp'));assert.equal(c.warnings.length,0);
 assert(paths.has('assets/portrait/37.png'));assert(!paths.has('assets/portrait/7.png'));assert(!paths.has('assets/not-an-image-credit.png'));assert(!paths.has('assets/icons/70908.png'));assert(!paths.has('assets/dice/142.png'));
});
test('offline server serves files and byte ranges, rejects unsafe paths and has no cloud API',async()=>{
 const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net');
 const dir=fs.mkdtempSync(path.join(__dirname,'server-test-'));
 fs.writeFileSync(path.join(dir,'index.html'),'offline-test');
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const child=cp.spawn(process.execPath,[path.join(__dirname,'offline_server.cjs'),dir],{windowsHide:true,env:{...process.env,L1STW_PORT:String(port)},stdio:'ignore'});
 try{
  const base='http://127.0.0.1:'+port;
  let ready=false;for(let i=0;i<30;i++){try{await fetch(base);ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}
  assert(ready,'server did not start');
  const home=await fetch(base);assert.equal(await home.text(),'offline-test');assert.match(home.headers.get('content-type'),/text\/html/);
  const range=await fetch(base,{headers:{Range:'bytes=0-2'}});assert.equal(range.status,206);assert.equal(await range.text(),'off');
  assert.equal((await fetch(base+'/api/health')).status,503);
  assert.equal((await fetch(base+'/%00')).status,400);
  assert.equal((await fetch(base+'/missing.js')).status,404);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  assert.equal((await fetch(base,{method:'HEAD'})).headers.get('content-length'),'12');
 }finally{
  child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));
  if(path.resolve(dir).startsWith(path.resolve(__dirname)+path.sep+'server-test-'))fs.rmSync(dir,{recursive:true,force:true});
 }
});
