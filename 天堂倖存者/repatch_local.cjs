#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Crawler,assertOutput}=require('./l1stw_crawler.cjs'),{defaultGameRoot,save,sha,offlineCheck}=require('./update-common.cjs');
function repatch(root=defaultGameRoot()){
 root=path.resolve(root);assertOutput(root);const reportFile=path.join(root,'download-report.json');
 if(!fs.existsSync(reportFile))throw Error('請先執行更新下載，取得桌面的遊戲原始檔。');
 const r=JSON.parse(fs.readFileSync(reportFile,'utf8')),temp=fs.mkdtempSync(path.join(root,'.patch-stage-')),pub=path.join(root,'public'),names=['index.html','cloud.js','game.js','audio.js','offline-runtime.js','.ai-policy.json','AGENTS.md'];let applied=[];
 try{
  const c=new Crawler({output:root,concurrency:4});c.pub=path.join(temp,'new');fs.mkdirSync(c.pub);
  for(const p of ['index.html','cloud.js','game.js','audio.js'])c.texts.set(p,fs.readFileSync(path.join(root,'source',p),'utf8'));
  c.musicMap={};for(const f of r.records){const m=/^assets\/(?:mus\/(?:music)?(\d+)\.(?:mp3|ogg|wav)|snd\/music(\d+)\.mp3)$/.exec(f.path);if(m)c.musicMap[m[1]||m[2]]=f.path;}
  c.patch();offlineCheck(c.pub);
  for(const n of names)if(fs.existsSync(path.join(pub,n)))save(path.join(temp,'backup',n),fs.readFileSync(path.join(pub,n)));
  const generated=names.map(p=>{const b=fs.readFileSync(path.join(c.pub,p));return {path:p,bytes:b.length,sha256:sha(b)};});
  for(const n of names){applied.push(n);fs.renameSync(path.join(c.pub,n),path.join(pub,n));}
  save(path.join(temp,'report.json'),JSON.stringify({...r,generated},null,2));fs.renameSync(path.join(temp,'report.json'),reportFile);console.log('已從桌面原始檔套用最新離線化程式。');return {files:names.length};
 }catch(e){for(const n of applied){const b=path.join(temp,'backup',n),p=path.join(pub,n);if(fs.existsSync(b))fs.copyFileSync(b,p);else if(fs.existsSync(p))fs.unlinkSync(p);}throw e;}
 finally{if(path.resolve(temp).startsWith(root+path.sep+'.patch-stage-'))fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)try{repatch();}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={repatch};
