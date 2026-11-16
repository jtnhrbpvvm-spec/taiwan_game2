#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Crawler,args,assertOutput}=require('./l1stw_crawler.cjs');
const {defaultGameRoot,sha,isSource404,annotateFailure,printFailureSummary}=require('./update-common.cjs');
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
 c.musicMissing=(c.musicIds||[]).filter(id=>!c.musicMap[id]);c.patch();
 c.retrySummary={started:c.started,previousMissing:failures.length,attempted:attempted.length,recovered:failures.filter(f=>c.records.has(f.path)).length};
 const report=c.report();report.retry=c.retrySummary;fs.writeFileSync(path.join(root,'download-report.json'),JSON.stringify(report,null,2));
 console.log('本次補回',c.retrySummary.recovered,'個；其餘項目已依原站 404 與連線錯誤分開記錄');return report;
}
function sourceFingerprint(html){
 const scripts=[];for(const m of html.matchAll(/<script\b[^>]*src\s*=\s*["']([^"']+)["']/gi))try{const u=new URL(m[1],'https://l1stw.com/');if(u.origin==='https://l1stw.com')scripts.push(u.pathname+u.search);}catch{}
 if(!scripts.some(s=>/^\/game\.js(?:\?|$)/.test(s)))throw Error('原站頁面格式不符，稍後再檢查');return sha(JSON.stringify(scripts));
}
async function startupCheck({output=defaultGameRoot(),fetcher=fetch,performRetry=retry,read=p=>fs.readFileSync(p,'utf8'),write=(p,b)=>{fs.writeFileSync(p+'.tmp',b);fs.renameSync(p+'.tmp',p);},log=console.log}={}){
 const root=path.resolve(output);assertOutput(root);let report;
 try{report=JSON.parse(read(path.join(root,'download-report.json')));}catch{log('尚無待補資源清單，使用現有離線版。');return {status:'no-report'};}
 const failures=[...(report.requiredFailures||[]),...(report.optionalFailures||[])];
 if(!failures.length){log('沒有待補資源。');return {status:'complete'};}
 if(failures.some(f=>f.note!==annotateFailure(f).note||f.status!==annotateFailure(f).status))try{report={...report,requiredFailures:(report.requiredFailures||[]).map(annotateFailure),optionalFailures:(report.optionalFailures||[]).map(annotateFailure)};write(path.join(root,'download-report.json'),JSON.stringify(report,null,2));}catch(e){log('無法保存缺檔備註：'+e.message);}
 printFailureSummary(failures,log);
 const statePath=path.join(root,'.asset-retry-state.json');let state={};try{state=JSON.parse(read(statePath));}catch{}
 try{
  const baseline=state.fingerprint||sourceFingerprint(read(path.join(root,'source','index.html')));
  const response=await fetcher('https://l1stw.com/index.html',{redirect:'manual',signal:AbortSignal.timeout(5000),headers:{'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 L1STW-Personal-Offline-Archive/1.0'}});
  if(!response.ok){await response.body?.cancel();throw Error('原站更新檢查 HTTP '+response.status);}
  const html=await response.text();if(Buffer.byteLength(html)>2*1048576)throw Error('原站頁面大小不符');const fingerprint=sourceFingerprint(html),changed=fingerprint!==baseline,transient=failures.some(f=>!isSource404(f));let result=report;
  if(changed||transient){log(changed?'偵測到原站版本更新，正在自動補抓待補檔案。':'正在重試先前連線失敗的資源。');result=await performRetry({output:root,concurrency:8,refresh:false,only:changed?'all':'transient'});}
  else log('原站版本未變；已知 404 保留為待補，原站更新後啟動時再補抓。');
  const remaining=[...(result.requiredFailures||[]),...(result.optionalFailures||[])].map(annotateFailure);
  write(statePath,JSON.stringify({schema:1,fingerprint,checkedAt:new Date().toISOString(),pending404:remaining.filter(isSource404).length},null,2));
  return {status:changed?'retried-update':transient?'retried-network':'unchanged',remaining:remaining.length};
 }catch(e){log('原站更新檢查或補抓未完成：'+e.message+'；繼續使用現有離線版。');return {status:'unavailable',error:e.message};}
}
if(require.main===module){try{const argv=process.argv.slice(2),startup=argv.includes('--startup'),o=args(argv.filter(a=>a!=='--startup'));(startup?startupCheck(o):retry(o)).catch(e=>{console.error(e);process.exitCode=1;});}catch(e){console.error(e);process.exitCode=1;}}
module.exports={retry,sourceFingerprint,startupCheck};
