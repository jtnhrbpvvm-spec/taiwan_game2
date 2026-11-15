'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||require('./update-common.cjs').defaultGameRoot());
const r=JSON.parse(fs.readFileSync(path.join(root,'download-report.json'),'utf8'));
let bad=[];
for(const f of r.records){const modified=['index.html','cloud.js','game.js','audio.js'].includes(f.path);const p=path.join(root,modified?'source':'public',f.path);try{const b=fs.readFileSync(p);if(crypto.createHash('sha256').update(b).digest('hex')!==f.sha256)bad.push(f.path);}catch{bad.push(f.path);}}
for(const f of r.generated||[])try{if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',f.path))).digest('hex')!==f.sha256)bad.push('離線檔案 '+f.path);}catch{bad.push('離線檔案 '+f.path);}
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8'),cloud=fs.readFileSync(path.join(root,'public/cloud.js'),'utf8');
if(!html.includes('window.L1S_API="";')||!html.includes('offline-runtime.js')||!cloud.includes('if(window.__L1STW_OFFLINE||'))bad.push('離線轉換未完成');
console.log('檢查',r.files,'個檔案；異常',bad.length,'；下載時必要失敗',r.requiredFailures.length);
if(bad.length)console.log(bad);
process.exitCode=bad.length||r.requiredFailures.length?2:0;
