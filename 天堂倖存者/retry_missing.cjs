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
 const report=c.finalize();report.retry=c.retrySummary;fs.writeFileSync(path.join(root,'download-report.json'),JSON.stringify(report,null,2));
 console.log('本次補回',c.retrySummary.recovered,'個；其餘項目已依原站 404 與連線錯誤分開記錄');return report;
}
function sourceFingerprint(html){
 const scripts=[];for(const m of html.matchAll(/<script\b[^>]*src\s*=\s*["']([^"']+)["']/gi))try{const u=new URL(m[1],'https://l1stw.com/');if(u.origin==='https://l1stw.com')scripts.push(u.pathname+u.search);}catch{}
 if(!scripts.some(s=>/^\/game\.js(?:\?|$)/.test(s)))throw Error('原站頁面格式不符，稍後再檢查');return sha(JSON.stringify(scripts));
}
// 原站改版時更新遊戲本體：先備份目前可玩的程式文字檔，再完整下載（已存在的圖片、音效沿用不重抓）。
// 任何一步失敗都還原備份，保留舊版可玩；新增的素材檔只是多出來，不影響舊版。
const GAME_TEXT=/\.(?:html|js|json|css|webmanifest)$/i;
function listTextFiles(dir,base=dir,out=[]){if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())listTextFiles(p,base,out);else if(GAME_TEXT.test(e.name))out.push(path.relative(base,p));}return out;}
async function updateGame({output=defaultGameRoot(),concurrency=8,makeCrawler=o=>new Crawler(o),log=console.log}={}){
 const root=path.resolve(output);assertOutput(root);
 const backup=path.join(root,'.game-update-backup');fs.rmSync(backup,{recursive:true,force:true});
 const areas=['public','source'],rootFiles=['download-report.json','catalog.json','crawl-progress.json','.asset-retry-state.json'];
 const saved=[];for(const a of areas)for(const rel of listTextFiles(path.join(root,a)))saved.push(path.join(a,rel));for(const f of rootFiles)if(fs.existsSync(path.join(root,f)))saved.push(f);
 for(const rel of saved){const d=path.join(backup,rel);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(path.join(root,rel),d);}
 const keep=new Set(saved.map(s=>s.toLowerCase()));
 try{
  const report=await makeCrawler({output:root,concurrency,refresh:false}).run();
  offlineCheck(path.join(root,'public'));
  fs.rmSync(backup,{recursive:true,force:true});return report;
 }catch(e){
  for(const a of areas)for(const rel of listTextFiles(path.join(root,a))){const r=path.join(a,rel);if(!keep.has(r.toLowerCase()))fs.rmSync(path.join(root,r),{force:true});}
  for(const rel of saved){const d=path.join(root,rel);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(path.join(backup,rel),d);}
  fs.rmSync(backup,{recursive:true,force:true});
  log('遊戲本體更新失敗，已還原為更新前的版本：'+e.message);throw e;
 }
}
async function startupCheck({output=defaultGameRoot(),fetcher=fetch,performRetry=retry,performUpdate=updateGame,read=p=>fs.readFileSync(p,'utf8'),write=(p,b)=>{fs.writeFileSync(p+'.tmp',b);fs.renameSync(p+'.tmp',p);},log=console.log}={}){
 const root=path.resolve(output);assertOutput(root);let report;
 try{report=JSON.parse(read(path.join(root,'download-report.json')));}catch{log('尚無待補資源清單，使用現有離線版。');return {status:'no-report'};}
 const failures=[...(report.requiredFailures||[]),...(report.optionalFailures||[])];
 if(failures.some(f=>f.note!==annotateFailure(f).note||f.status!==annotateFailure(f).status))try{report={...report,requiredFailures:(report.requiredFailures||[]).map(annotateFailure),optionalFailures:(report.optionalFailures||[]).map(annotateFailure)};write(path.join(root,'download-report.json'),JSON.stringify(report,null,2));}catch(e){log('無法保存缺檔備註：'+e.message);}
 if(failures.length)printFailureSummary(failures,log);
 const statePath=path.join(root,'.asset-retry-state.json');let state={};try{state=JSON.parse(read(statePath));}catch{}
 try{
  const baseline=state.fingerprint||sourceFingerprint(read(path.join(root,'source','index.html')));
  const response=await fetcher('https://l1stw.com/index.html',{redirect:'manual',signal:AbortSignal.timeout(5000),headers:{'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 L1STW-Personal-Offline-Archive/1.0'}});
  if(!response.ok){await response.body?.cancel();throw Error('原站更新檢查 HTTP '+response.status);}
  const html=await response.text();if(Buffer.byteLength(html)>2*1048576)throw Error('原站頁面大小不符');const fingerprint=sourceFingerprint(html),changed=fingerprint!==baseline,transient=failures.some(f=>!isSource404(f));let result=report;
  if(changed){log('偵測到原站版本更新，正在更新遊戲本體（已下載的素材會沿用，只抓新增與變更的檔案）…');result=await performUpdate({output:root,concurrency:8,log});log('遊戲本體已更新到原站目前版本。');}
  else if(transient){log('正在重試先前連線失敗的資源。');result=await performRetry({output:root,concurrency:8,refresh:false,only:'transient'});}
  else if(!failures.length){log('原站版本未變，沒有待補資源。');}
  else log('原站版本未變；已知 404 保留為待補，原站更新後啟動時再補抓。');
  const remaining=[...(result.requiredFailures||[]),...(result.optionalFailures||[])].map(annotateFailure);
  write(statePath,JSON.stringify({schema:1,fingerprint,checkedAt:new Date().toISOString(),pending404:remaining.filter(isSource404).length},null,2));
  return {status:changed?'updated-game':transient?'retried-network':failures.length?'unchanged':'complete',remaining:remaining.length};
 }catch(e){log('原站更新檢查或遊戲更新未完成：'+e.message+'；繼續使用現有離線版。');return {status:'unavailable',error:e.message};}
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
if(require.main===module){try{const argv=process.argv.slice(2),startup=argv.includes('--startup'),o=args(argv.filter(a=>a!=='--startup'));(startup?startupCheck(o):retry(o)).catch(e=>{console.error(e);process.exitCode=1;});}catch(e){console.error(e);process.exitCode=1;}}
module.exports={retry,sourceFingerprint,startupCheck,checkDailyTasks,updateGame};
