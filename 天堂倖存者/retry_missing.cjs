#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Crawler,args,assertOutput}=require('./l1stw_crawler.cjs');
const {defaultGameRoot,sha,isSource404,annotateFailure,printFailureSummary,offlineCheck}=require('./update-common.cjs');
async function retry(options){
 const root=path.resolve(options.output),old=JSON.parse(fs.readFileSync(path.join(root,'download-report.json'),'utf8'));
 assertOutput(root);
 const c=new Crawler(options),failures=[...old.requiredFailures,...old.optionalFailures];
 for(const r of old.records){c.records.set(r.path,r);c.seen.set(r.path,'https://l1stw.com/'+r.path);}
 for(const f of failures){c.failed.set(f.path,f);if(f.optional)c.optional.add(f.path);if(options.only==='transient'&&isSource404(f))c.seen.set(f.path,f.url);else c.add(f.url,undefined,f.optional);}
 function read(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())read(p);else if(/\.(js|json|html|css)$/.test(p))c.texts.set(path.relative(c.raw,p).replaceAll('\\','/'),fs.readFileSync(p,'utf8'));}}
 read(c.raw);const attempted=failures.filter(f=>options.only!=='transient'||!isSource404(f));console.log('重新嘗試待補資源',attempted.length);await c.drain();
 c.evaluateData();c.discover();await c.drain();
 c.musicMap={};for(const id of c.musicIds||[])for(const rel of [`assets/mus/${id}.mp3`,`assets/mus/${id}.ogg`,`assets/mus/${id}.wav`,`assets/mus/music${id}.mp3`,`assets/snd/music${id}.mp3`])if(c.records.has(rel)){c.musicMap[id]=rel;break;}
 c.musicMissing=(c.musicIds||[]).filter(id=>!c.musicMap[id]);
 c.retrySummary={started:c.started,previousMissing:failures.length,attempted:attempted.length,recovered:failures.filter(f=>c.records.has(f.path)).length};
 // noPatch：背景補檔時不在遊玩中改寫遊戲程式，下次開啟時由啟動器重新離線化。
 const report=options.noPatch?c.report():c.finalize();report.retry=c.retrySummary;fs.writeFileSync(path.join(root,'download-report.json'),JSON.stringify(report,null,2));
 console.log('本次補回',c.retrySummary.recovered,'個；其餘項目已依原站 404 與連線錯誤分開記錄');return report;
}
function sourceFingerprint(html){
 const scripts=[];for(const m of html.matchAll(/<script\b[^>]*src\s*=\s*["']([^"']+)["']/gi))try{const u=new URL(m[1],'https://l1stw.com/');if(u.origin==='https://l1stw.com')scripts.push(u.pathname+u.search);}catch{}
 if(!scripts.some(s=>/^\/game\.js(?:\?|$)/.test(s)))throw Error('原站頁面格式不符，稍後再檢查');return sha(JSON.stringify(scripts));
}
// 遊戲本體更新分兩段，玩家不必等待：
// 1. 背景（玩家登入後）：原站改版時把新版下載到暫存資料夾 .pending-game。新素材直接放進 public（只新增檔案），
//    程式文字檔與離線化結果留在暫存區，正在玩的版本完全不受影響。
// 2. 下次開啟：先套用暫存的新版並重新離線化；任何一步失敗都還原，舊版照常可玩。
const PENDING='.pending-game',GAME_TEXT=/\.(?:html|js|json|css|webmanifest)$/i,ROOT_FILES=['download-report.json','catalog.json','crawl-progress.json','.asset-retry-state.json'];
function listTextFiles(dir,base=dir,out=[]){if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())listTextFiles(p,base,out);else if(GAME_TEXT.test(e.name))out.push(path.relative(base,p));}return out;}
function copyTree(from,to){for(const rel of listTextFiles(from)){const d=path.join(to,rel);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(path.join(from,rel),d);}}
function snapshot(root){
 const backup=path.join(root,'.game-update-backup');fs.rmSync(backup,{recursive:true,force:true});
 const saved=[];for(const a of ['public','source'])for(const rel of listTextFiles(path.join(root,a)))saved.push(path.join(a,rel));for(const f of ROOT_FILES)if(fs.existsSync(path.join(root,f)))saved.push(f);
 for(const rel of saved){const d=path.join(backup,rel);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(path.join(root,rel),d);}
 const keep=new Set(saved.map(s=>s.toLowerCase()));
 return {restore(){for(const a of ['public','source'])for(const rel of listTextFiles(path.join(root,a))){const r=path.join(a,rel);if(!keep.has(r.toLowerCase()))fs.rmSync(path.join(root,r),{force:true});}for(const f of ROOT_FILES)if(!keep.has(f.toLowerCase()))fs.rmSync(path.join(root,f),{force:true});for(const rel of saved){const d=path.join(root,rel);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(path.join(backup,rel),d);}this.drop();},drop(){fs.rmSync(backup,{recursive:true,force:true});}};
}
async function stageGameUpdate({output=defaultGameRoot(),fingerprint,concurrency=3,pace=150,makeCrawler=o=>new Crawler(o),log=console.log}={}){
 const root=path.resolve(output);assertOutput(root);const stage=path.join(root,PENDING);fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage,{recursive:true});
 try{
  const report=await makeCrawler({output:root,concurrency,pace,refresh:false,stage}).run();
  offlineCheck(path.join(stage,'public'));
  fs.writeFileSync(path.join(stage,'ready.json'),JSON.stringify({fingerprint,created:new Date().toISOString()}));
  return report;
 }catch(e){fs.rmSync(stage,{recursive:true,force:true});throw e;}
}
function applyPendingGame({output=defaultGameRoot(),repatchFn=r=>require('./repatch_local.cjs').repatch(r),log=console.log}={}){
 const root=path.resolve(output);assertOutput(root);const stage=path.join(root,PENDING),readyFile=path.join(stage,'ready.json');
 if(!fs.existsSync(readyFile)){if(fs.existsSync(stage))fs.rmSync(stage,{recursive:true,force:true});return {status:'none'};}
 let ready;try{ready=JSON.parse(fs.readFileSync(readyFile,'utf8'));}catch{fs.rmSync(stage,{recursive:true,force:true});return {status:'none'};}
 log('正在套用背景下載好的新版遊戲…');const snap=snapshot(root);
 try{
  copyTree(path.join(stage,'public'),path.join(root,'public'));copyTree(path.join(stage,'source'),path.join(root,'source'));
  for(const f of ['download-report.json','catalog.json'])if(fs.existsSync(path.join(stage,f)))fs.copyFileSync(path.join(stage,f),path.join(root,f));
  repatchFn(root);
  fs.writeFileSync(path.join(root,'.asset-retry-state.json'),JSON.stringify({schema:1,fingerprint:ready.fingerprint,checkedAt:new Date().toISOString()},null,2));
  snap.drop();fs.rmSync(stage,{recursive:true,force:true});log('新版遊戲已套用。');return {status:'applied'};
 }catch(e){snap.restore();fs.rmSync(stage,{recursive:true,force:true});log('新版遊戲套用失敗，已還原為原本的版本：'+e.message);return {status:'restored',error:e.message};}
}
async function backgroundCheck({output=defaultGameRoot(),fetcher=fetch,performRetry=retry,performStage=stageGameUpdate,read=p=>fs.readFileSync(p,'utf8'),write=(p,b)=>{fs.writeFileSync(p+'.tmp',b);fs.renameSync(p+'.tmp',p);},log=console.log}={}){
 const root=path.resolve(output);assertOutput(root);let report;
 try{report=JSON.parse(read(path.join(root,'download-report.json')));}catch{log('尚無下載紀錄，略過背景更新。');return {status:'no-report'};}
 const failures=[...(report.requiredFailures||[]),...(report.optionalFailures||[])];
 const statePath=path.join(root,'.asset-retry-state.json');let state={};try{state=JSON.parse(read(statePath));}catch{}
 let pending={};try{pending=JSON.parse(read(path.join(root,PENDING,'ready.json')));}catch{}
 try{
  const baseline=state.fingerprint||sourceFingerprint(read(path.join(root,'source','index.html')));
  const response=await fetcher('https://l1stw.com/index.html',{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 L1STW-Personal-Offline-Archive/1.0'}});
  if(!response.ok){await response.body?.cancel();throw Error('原站更新檢查 HTTP '+response.status);}
  const html=await response.text();if(Buffer.byteLength(html)>2*1048576)throw Error('原站頁面大小不符');
  const fingerprint=sourceFingerprint(html),changed=fingerprint!==baseline,transient=failures.some(f=>!isSource404(f));
  if(changed&&pending.fingerprint===fingerprint){log('新版遊戲已下載完成，下次開啟遊戲時自動套用。');return {status:'ready'};}
  if(changed){log('偵測到原站新版本，開始在背景慢慢下載，不影響目前遊玩…');await performStage({output:root,fingerprint,log});log('新版遊戲已下載完成，下次開啟遊戲時自動套用。');return {status:'staged'};}
  // 原站未改版：重試連線失敗的檔案，並用最新的工具規則找出以前漏抓的素材，慢慢補齊。已知的原站 404 不重抓。
  log(transient?'遊戲已是原站最新版本；背景重試先前連線失敗的資源並補齊漏抓的素材…':'遊戲已是原站最新版本；背景檢查是否有漏抓的素材…');
  const r=await performRetry({output:root,concurrency:3,pace:150,refresh:false,only:'transient',noPatch:true});const left=[...(r.requiredFailures||[]),...(r.optionalFailures||[])];
  write(statePath,JSON.stringify({schema:1,fingerprint,checkedAt:new Date().toISOString(),pending404:left.filter(isSource404).length},null,2));
  log('背景補檔完成。'+(left.filter(isSource404).length?'原站沒有的檔案（404）等原站改版後再補抓。':''));
  return {status:transient?'retried-network':left.length?'unchanged':'complete'};
 }catch(e){log('背景更新未完成：'+e.message+'；下次登入時會再試，目前遊玩不受影響。');return {status:'unavailable',error:e.message};}
}
async function checkDailyTasks({output=defaultGameRoot(),fetcher=fetch,log=console.log,read=p=>fs.readFileSync(p,'utf8'),write=(p,b)=>{fs.writeFileSync(p+'.tmp',b);fs.renameSync(p+'.tmp',p);}}={}){
 const root=path.resolve(output);assertOutput(root);const statePath=path.join(root,'.daily-task-check.json');let state={};try{state=JSON.parse(read(statePath));}catch{}
 const headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 L1STW-Offline-Task-Check/1.0'};
 try{
  const page=await fetcher('https://l1stw.com/index.html',{redirect:'manual',signal:AbortSignal.timeout(5000),headers});if(!page.ok){await page.body?.cancel();throw Error('HTTP '+page.status);}const html=await page.text();if(Buffer.byteLength(html)>2*1048576)throw Error('首頁大小不符');
  let gameURL='https://l1stw.com/game.js';for(const m of html.matchAll(/<script\b[^>]*src\s*=\s*["']([^"']+)["']/gi)){const u=new URL(m[1],'https://l1stw.com/');if(u.origin==='https://l1stw.com'&&u.pathname==='/game.js')gameURL=u.href;}
  const h={...headers};if(state.gameURL===gameURL&&state.etag)h['If-None-Match']=state.etag;
  const response=await fetcher(gameURL,{redirect:'manual',signal:AbortSignal.timeout(5000),headers:h});
  if(response.status!==304){if(!response.ok){await response.body?.cancel();throw Error('HTTP '+response.status);}const code=await response.text();if(Buffer.byteLength(code)>4*1048576||!code.includes('function dailyList'))throw Error('每日任務格式已變更，保留本機任務');state={gameURL,etag:response.headers?.get?.('etag')||'',fingerprint:sha(code),status:code.includes("srvDo('dqGet'")?'requires-login':'changed-needs-review'};}
  state.checkedAt=new Date().toISOString();state.offlineFallback=true;write(statePath,JSON.stringify(state,null,2));
  log(state.status==='requires-login'?'已檢查線上每日任務：原站任務資料仍需正式登入；使用本機每日任務。':'已檢查線上每日任務：原站格式有變更，保留本機每日任務，等待相容更新。');return state;
 }catch(e){log('線上每日任務檢查未完成：'+e.message+'；本機每日任務仍可使用。');return {status:'unavailable',error:e.message};}
}
// --startup：開啟遊戲前套用背景已下載好的新版（不連網路）。--background：玩家登入後由本機伺服器啟動的背景更新。
if(require.main===module){try{const argv=process.argv.slice(2),startup=argv.includes('--startup'),background=argv.includes('--background'),o=args(argv.filter(a=>a!=='--startup'&&a!=='--background'));(startup?Promise.resolve(applyPendingGame(o)):background?backgroundCheck(o):retry(o)).catch(e=>{console.error(e);process.exitCode=1;});}catch(e){console.error(e);process.exitCode=1;}}
module.exports={retry,sourceFingerprint,backgroundCheck,applyPendingGame,stageGameUpdate,checkDailyTasks,PENDING};
