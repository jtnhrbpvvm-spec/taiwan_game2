const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const offline = path.resolve('C:/Users/a2095/Desktop/爬蟲/d2s_10221227');
const fd = fs.openSync('C:/Program Files/D2 Survivors/resources/app.asar', 'r');
const head = Buffer.alloc(16); fs.readSync(fd, head, 0, 16, 0);
const buf = Buffer.alloc(head.readUInt32LE(12)); fs.readSync(fd, buf, 0, buf.length, 16);
const tree = JSON.parse(buf);
const inject = fs.readFileSync(path.join(root,'desktop/d2zh-inject.cjs'),'utf8').replace(/\r\n/g,'\n');
const addExports = require('node:vm').runInNewContext(inject.slice(inject.indexOf('const EXPORT_PATTERNS ='), inject.indexOf('\ntry {\n  const handle = protocol.handle;'))+'\naddExports');
function asar(name) {
  const node = name.split('/').reduce((a, k) => a?.files?.[k], tree);
  if (!node || node.files) return null;
  const b = Buffer.alloc(Number(node.size)); fs.readSync(fd, b, 0, b.length, 8 + head.readUInt32LE(4) + Number(node.offset)); return b;
}
const meta = fs.readFileSync(path.join(offline,'play/index.html'),'utf8').match(/<script[^>]*id="d2-files"[^>]*>[\s\S]*?<\/script>/)[0];
const boot = meta + `<script>
window.__tg2Count=1;
localStorage.setItem('d2s:files','hosted');
for(const v of ['v1','v2'])localStorage.setItem('d2-survivors/audio/'+v,JSON.stringify({sfx:0,music:0,muted:true}));
localStorage.setItem('d2zh:editUnlocked','1');
const realFetch=window.fetch;window.fetch=function(input,options){const u=new URL(typeof input==='string'?input:input.url,location.href);if(u.origin!==location.origin)return Promise.reject(new Error('Offline test: external request blocked'));return realFetch.apply(this,arguments)};
window.__portalErrors=[];addEventListener('error',e=>__portalErrors.push({message:e.message,stack:e.error?.stack}));addEventListener('unhandledrejection',e=>__portalErrors.push({message:String(e.reason),stack:e.reason?.stack}));
</script><script type="module" src="/__test.js"></script>`;
http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p==='/__d2zh.js'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(path.join(root,'d2_zh.js')))}
  if(p==='/__test.js'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(path.join(__dirname,'red-portal-harness.js')))}
  let data=asar('desktop/dist/web'+p+(p.endsWith('/')?'index.html':''));
  if(!data)try{const f=path.resolve(offline,'.'+p);if(f.startsWith(offline))data=fs.readFileSync(f)}catch{}
  if(!data){console.log('MISSING',p);res.statusCode=404;return res.end('missing')}
  if(p.endsWith('.js') && data.includes('strModEnhancedDamage')) data=Buffer.from(addExports(data.toString()) || data);
  if(p==='/play/'||p==='/play/index.html')data=Buffer.from(data.toString().replace('<head>','<head>'+boot));
  const ext=path.extname(p);res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4'})[ext]||(p.endsWith('/')||ext==='.html'?'text/html; charset=utf-8':'application/octet-stream'));
  res.end(data);
}).listen(8879,'127.0.0.1',()=>console.log('Offline test on http://127.0.0.1:8879/play/?smoke'));
