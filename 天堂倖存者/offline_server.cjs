#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const argv=process.argv.slice(2),ROOT=path.resolve(argv.find(x=>!x.startsWith('--'))||path.join(require('./update-common.cjs').defaultGameRoot(),'public')),GM_MODE=argv.includes('--gm');
const PORT=Number(process.env.L1STW_PORT||8379),HOST='127.0.0.1';
const {isSource404,MISSING_404_NOTE}=require('./update-common.cjs');
let knownFailures=new Map();try{const r=JSON.parse(fs.readFileSync(path.join(ROOT,'..','download-report.json'),'utf8'));knownFailures=new Map([...(r.requiredFailures||[]),...(r.optionalFailures||[])].map(f=>[f.path,f]));}catch{}
const missingLogged=new Set();
// 玩家登入後在背景依序：檢查工具更新 → 檢查原站新版並慢慢下載。每次開啟伺服器只執行一次。
let backgroundStarted=false;
function startBackgroundUpdate(){
 if(backgroundStarted||process.env.L1STW_NO_BACKGROUND)return;backgroundStarted=true;
 const step=(file,args)=>new Promise(resolve=>{const p=require('node:child_process').spawn(process.execPath,[path.join(__dirname,file),...args],{cwd:__dirname,windowsHide:true,stdio:'inherit'});p.once('error',()=>resolve());p.once('exit',()=>resolve());});
 console.log('玩家已登入，開始在背景檢查更新（不影響遊玩）…');
 step('update_client.cjs',['--background']).then(()=>step('retry_missing.cjs',['--background','--output',path.dirname(ROOT)])).then(()=>console.log('背景更新程序結束。'));
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg','.ico':'image/x-icon','.woff2':'font/woff2'};
if(!fs.existsSync(path.join(ROOT,'index.html'))){console.error('尚未下載遊戲。請先執行「更新下載.bat」。');process.exit(1);}
const server=http.createServer((req,res)=>{
  if(!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/i.test(req.headers.host||'')){res.writeHead(403);res.end();return;}
  if(req.method==='POST'&&req.url==='/__offline/session'){res.writeHead(204);res.end();startBackgroundUpdate();return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  let name;
  try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  if(name.includes('\0')||name.includes('\\')){res.writeHead(400);res.end();return;}
  if(name==='/offline-mode.js'){const b=Buffer.from('window.__L1STW_GM_MODE='+JSON.stringify(GM_MODE)+';\n');res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','Content-Length':b.length});res.end(req.method==='HEAD'?undefined:b);return;}
  // 原站以 maint.json 公告維護狀態（目前內容為 {"on":false}）；離線版永遠不進維護畫面，由本機直接回應。
  if(name==='/maint.json'){const b=Buffer.from('{"on":false}\n');res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':b.length});res.end(req.method==='HEAD'?undefined:b);return;}
  // skx_test.js：遊戲在沒有連線 API 時才會載入的開發者測試腳本，原站沒有公開。線上版不會載入它，離線版回應空腳本即可。
  if(name==='/skx_test.js'){const b=Buffer.from('// 原站開發測試腳本，離線版不需要。\n');res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','Content-Length':b.length});res.end(req.method==='HEAD'?undefined:b);return;}
  // talk.png：原站也沒有這張對話游標，線上版一樣改用 CSS 裡的備用游標（手形指標）。維持 404 讓瀏覽器使用備用游標，但不顯示缺檔提示。
  if(name==='/assets/cursor/talk.png'&&!fs.existsSync(path.join(ROOT,'assets','cursor','talk.png'))){res.writeHead(404);res.end();return;}
  if(name.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"ok":false,"error":"Offline mode"}');return;}
  if(name==='/')name='/index.html';
  const dest=path.resolve(ROOT,'.'+name);
  if(!dest.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
  fs.stat(dest,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end();const alt=/^\/assets\/(map\d+)\/map\.js$/.exec(name);if(alt&&fs.existsSync(path.join(ROOT,'maps',alt[1],'map.js')))return;// 原站也是 404，遊戲會改用 maps/ 路徑，不必提示
    if(!name.endsWith('favicon.ico')&&!missingLogged.has(name)){missingLogged.add(name);const f=knownFailures.get(name.replace(/^\//,''));console.log('缺少資源',name,isSource404(f)?`（原站 404：${MISSING_404_NOTE}）`:'（尚未取得，請檢查下載報告）');}return;}
    let start=0,end=stat.size-1,status=200;
    const headers={'Content-Type':types[path.extname(dest).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
    if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416);res.end();return;}if(m[1]){start=+m[1];if(m[2])end=+m[2];}else{start=Math.max(0,stat.size-(+m[2]));}if(start>end||end>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=fs.createReadStream(dest,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
  });
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`連接埠 ${PORT} 已使用中。請先關閉舊的離線伺服器，或設定 L1STW_PORT。`:e.message);process.exitCode=1;});
server.listen(PORT,HOST,()=>{
 console.log(`天堂倖存者${GM_MODE?' GM模式':'離線版'}：http://${HOST}:${PORT}/\n請在瀏覽器開啟上面網址。結束時關閉分頁並在此按 Ctrl+C。\n固定使用相同網址與瀏覽器，才能讀取原本的本機存檔。`);
 if(argv.includes('--open')){const child=require('node:child_process').spawn('cmd.exe',['/c','start','',`http://${HOST}:${PORT}/`],{windowsHide:true,stdio:'ignore'});child.on('error',()=>console.log('請手動開啟上方網址。'));}
});
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
