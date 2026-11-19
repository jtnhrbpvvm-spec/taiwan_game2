#!/usr/bin/env node
'use strict';
// 天堂倖存者公開客戶端備份。Node 18+，不需 npm、不讀取 GitHub。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {defaultGameRoot,annotateFailure,printFailureSummary,isSource404}=require('./update-common.cjs');
const ORIGIN = 'https://l1stw.com';
const EXT = /\.(?:html|js|json|css|png|webp|jpe?g|gif|svg|ico|mp3|ogg|wav|woff2?|webmanifest)$/i;
const TEXT = /\.(?:html|js|json|css|webmanifest)$/i;
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const dataValues = o => Object.values(Object.getOwnPropertyDescriptors(o)).filter(d=>Object.hasOwn(d,'value')).map(d=>d.value);
function args(argv) {
  const o = {output:defaultGameRoot(), concurrency:4, refresh:false};
  for(let i=0;i<argv.length;i++) {
    const a=argv[i];
    if(a==='--output'||a==='--cache') {if(!argv[i+1])throw Error(a+' 需要路徑');o[a.slice(2)]=path.resolve(argv[++i]);}
    else if(a==='--concurrency') {o.concurrency=+argv[++i];if(!Number.isInteger(o.concurrency)||o.concurrency<1||o.concurrency>16)throw Error('concurrency 必須為 1–16');}
    else if(a==='--refresh')o.refresh=true;
    else if(a==='--help')o.help=true;
    else throw Error('未知參數：'+a);
  }
  return o;
}
function localPath(root, rel) {
  if(/[:*?"<>|\x00-\x1f]/.test(rel)||rel.split(/[\\/]/).some(p=>/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))throw Error('拒絕不安全檔名 '+rel);
  const p=path.resolve(root,rel);
  if(!p.startsWith(path.resolve(root)+path.sep))throw Error('拒絕越界路徑 '+rel);
  return p;
}
function save(p,b) {fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}
// 從原始碼文字補找資料分析看不到的素材：
// 1. 以敘述加入的道具，例如 ITEMS[40079]={id:40079,...,kind:'etc'} 或 Object.assign(ITEMS,{...})。
// 2. 小工具函式組出的圖片，例如 const pic=(img,...)=>'<img src="assets/codex/'+img+'.png">' 及 pic('6022',...)。
function discoverTextAssets(texts){
  const out=new Set();
  for(const s of texts){
    if(typeof s!=='string')continue;
    for(const m of s.matchAll(/\{\s*["']?id["']?\s*:\s*(\d+)\s*,[^{}]*?["']?kind["']?\s*:\s*["'](?:weapon|armor|etc|item|material)["']/g))out.add('assets/icons/'+m[1]+'.png');
    // 3. 以敘述補上的動畫，例如 FXMETA[2127]={"0":{...}}（升級特效）。
    for(const m of s.matchAll(/\b(FXMETA|META|CLSMETA|DOLLMETA|SUMMETA|DOGMETA)\[\s*["']?(\w+)["']?\s*\]\s*=\s*(\{[^\n;]*\})\s*;/g)){let v;try{v=JSON.parse(m[3]);}catch{continue;}const g=m[2];for(const f of Object.keys(v))if(/^\d+$/.test(f))out.add(m[1]==='FXMETA'?`assets/fx/${g}/${g}-${f}.png`:`assets/${g}/${g}-${f}.png`);}
    for(const m of s.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*\(\s*(\w+)[^)]*\)\s*=>[^\n]*?["']assets\/([\w/-]+\/)["']\s*\+\s*\2\s*\+\s*["'](\.(?:png|webp|jpe?g|gif))["']/g)){
      const [,fn,,dir,ext]=m;
      for(const c of s.matchAll(new RegExp('\\b'+fn+'\\(\\s*["\']([\\w-]+)["\']','g')))out.add('assets/'+dir+c[1]+ext);
    }
  }
  return [...out];
}
// 移除離線版的 LINE 討論區按鈕。以 lineBtn 所在的頂層 IIFE 定位，不依賴原站可能刪改的註解標題。
function removeCommunityLink(game){
  const id="b.id='lineBtn'",at=game.indexOf(id);
  if(at<0)return game;
  const fail=()=>{throw Error('LINE 連結區塊格式變更，請檢查後再套用更新');};
  if(game.indexOf(id,at+1)>=0)fail();
  const open=game.lastIndexOf('\n(function(){',at),close=game.indexOf('\n})();',at);
  if(open<0||close<0||game.lastIndexOf('\n})();',at)>open)fail();
  let start=open+1;const end=close+'\n})();'.length;
  const prevStart=game.lastIndexOf('\n',open-1)+1,prev=game.slice(prevStart,open).replace(/\r$/,'');
  if(/^\/\/ ---- LINE 討論區：/.test(prev))start=prevStart;
  const block=game.slice(start,end);
  if(!block.includes('https://line.me/'))fail();
  return game.slice(0,start)+'// OFFLINE_COMMUNITY_LINK_REMOVED_V1'+game.slice(end);
}
function assertOutput(output){const root=path.dirname(defaultGameRoot()),dest=path.resolve(output);if(dest.toLowerCase()!==root.toLowerCase()&&!dest.toLowerCase().startsWith(root.toLowerCase()+path.sep))throw Error('下載資料只能存到桌面「天堂倖存者」資料夾');}
async function request(url) {
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(35000),headers:{'User-Agent':'Mozilla/5.0 L1STW-Personal-Offline-Archive/1.0'}});
      if(!r.ok) {await r.body?.cancel();const e=Error('HTTP '+r.status);e.status=r.status;throw e;}
      const b=Buffer.from(await r.arrayBuffer());
      if(!b.length)throw Error('空檔案');
      if(!/\.html(?:\?|$)/i.test(url)&&/text\/html/i.test(r.headers.get('content-type')||''))throw Error('預期資源卻收到 HTML');
      return b;
    } catch(e) {if(e.status===404||e.status===403||attempt===2)throw e;await new Promise(r=>setTimeout(r,600*(attempt+1)));}
  }
}
// 擷取常數右側表達式；只交給無 Node/網路/檔案 API 的資料沙盒。
function expression(s,start) {
  let stack=[],q='',comment='',i=start;
  for(;i<s.length;i++) {
    const c=s[i],n=s[i+1];
    if(comment==='line'){if(c==='\n')comment='';continue;}
    if(comment==='block'){if(c==='*'&&n==='/'){comment='';i++;}continue;}
    if(q){if(c==='\\')i++;else if(c===q)q='';continue;}
    if(c==='/'&&n==='/'){comment='line';i++;continue;}
    if(c==='/'&&n==='*'){comment='block';i++;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if('([{'.includes(c))stack.push(c);
    else if(')]}'.includes(c)){if(!stack.length)break;stack.pop();}
    else if(!stack.length&&(c===';'||c===','||c==='\n'))break;
  }
  return s.slice(start,i).trim();
}
class Crawler {
  constructor(options) {
    this.o=options;this.root=path.resolve(options.output);this.pub=path.join(this.root,'public');this.raw=path.join(this.root,'source');
    this.queue=[];this.seen=new Map();this.records=new Map();this.failed=new Map();this.optional=new Set();this.texts=new Map();this.values={};this.warnings=[];
    this.ctx={};this.ctx.window=this.ctx;this.evaluated=new Set();
    vm.createContext(this.ctx,{codeGeneration:{strings:false,wasm:false}});
    this.started=new Date().toISOString();this.count=0;
  }
  // 暫存模式（options.stage）：圖片、音效等素材直接存入 public（只會新增檔案，不影響正在玩的版本）；
  // 程式文字檔、離線化結果與下載報告存到暫存資料夾，下次開啟時才一次套用。
  get textPub(){return this.o.stage?path.join(this.o.stage,'public'):this.pub;}
  get textRaw(){return this.o.stage?path.join(this.o.stage,'source'):this.raw;}
  get reportRoot(){return this.o.stage||this.root;}
  add(input,base=ORIGIN+'/',optional=false) {
    try {
      const u=new URL(input,base);
      if(u.origin!==ORIGIN||!EXT.test(u.pathname)||/[${}<>\\]/.test(u.pathname))return;
      const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');
      localPath(this.pub,rel);
      if(this.seen.has(rel)) {if(!optional)this.optional.delete(rel);return;}
      this.seen.set(rel,u.href);if(optional)this.optional.add(rel);this.queue.push({rel,url:u.href});
    } catch {}
  }
  scan(text,base) {
    for(const m of text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g))this.add(m[1],base);
    for(const m of text.matchAll(/(?:assets\/|(?:\.\.\/)?maps\/)[\w./-]+\.(?:js|json|css|png|webp|jpe?g|gif|svg|ico|mp3|ogg|wav|woff2?)(?:\?[^\s"'`<>)]*)?/g))this.add(m[0],ORIGIN+'/');
    for(const m of text.matchAll(/url\(\s*["']?([^\s'"()]+)["']?\s*\)/g))this.add(m[1],base);
    // lg_new.js 等不以 assets/ 起頭的延遲腳本。
    for(const m of text.matchAll(/["']([\w./-]+\.js(?:\?[^\s"']*)?)["']/g))this.add(m[1],base,true);
  }
  async download(job) {
    const {rel,url}=job,text=TEXT.test(rel),dest=localPath(text?this.textPub:this.pub,rel);let b,from='network';
    try {
      if(!text&&!this.o.refresh) {
        if(fs.existsSync(dest)){b=fs.readFileSync(dest);from='existing';}
        else if(this.o.cache){const p=localPath(this.o.cache,rel);if(fs.existsSync(p)){b=fs.readFileSync(p);from='cache';}}
      }
      if(!b?.length){b=await request(url);if(this.o.pace)await new Promise(r=>setTimeout(r,this.o.pace));}
      if(from!=='existing')save(dest,b);
      this.records.set(rel,{path:rel,bytes:b.length,sha256:hash(b),from});
      this.failed.delete(rel);
      if(text){save(localPath(this.textRaw,rel),b);this.texts.set(rel,b.toString('utf8'));this.scan(b.toString('utf8'),url);}
    }catch(e){this.failed.set(rel,{path:rel,url,error:e.message,optional:this.optional.has(rel)});}
    if(++this.count%200===0){console.log('已處理',this.count,'已保存',this.records.size,'待處理',this.queue.length);printFailureSummary([...this.failed.values()]);save(path.join(this.reportRoot,'crawl-progress.json'),JSON.stringify({time:new Date().toISOString(),done:this.count,queued:this.queue.length,files:this.records.size,failed:[...this.failed.values()].map(annotateFailure)},null,2));}
  }
  async drain() {
    // 任一工作完成立即接下一個，避免一個慢檔案拖住整批下載。
    await Promise.all(Array.from({length:this.o.concurrency},async()=>{while(this.queue.length)await this.download(this.queue.shift());}));
  }
  evaluateData() {
    const skipped=/^(?:game|cloud|lg|lg_new|audio|patchnotes|craft|levelup|stats|anta|plevel|itemuse)\.js$/;
    const names=new Set();
    // 保留 HTML 中的載入順序，META 依賴 DATA，其他資料又依賴 META。
    const html=this.texts.get('index.html');
    const order=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/g)].map(m=>new URL(m[1],ORIGIN).pathname.slice(1));
    for(const rel of new Set([...order,...this.texts.keys()])) {
      if(!rel.endsWith('.js')||skipped.test(rel))continue;
      const s=this.texts.get(rel);if(!s||this.evaluated.has(rel))continue;this.evaluated.add(rel);
      try{vm.runInContext(s,this.ctx,{timeout:2000});}catch(e){this.warnings.push({path:rel,stage:'data',error:e.message});}
      for(const m of s.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g))names.add(m[1]);
    }
    // 遊戲閉包裡的圖示、視窗、天賦等常數，不執行遊戲主程式。
    for(const rel of ['index.html','game.js','lg.js','lg_new.js','audio.js','ground.js','levelup.js','anta.js','plevel.js']) {
      const s=this.texts.get(rel)||'';
      for(const m of s.matchAll(/(?:(?:const|let|var)\s+|,\s*)([A-Z][A-Z0-9_]*)\s*=/g)) {
        const name=m[1];names.add(name);const ex=expression(s,m.index+m[0].length);
        if(!ex||ex.length>4000000)continue;
        try{const v=vm.runInContext('('+ex+')',this.ctx,{timeout:150});if(v!==undefined){this.ctx[name]=v;this.values[name]=v;}}catch{}
      }
    }
    for(const name of names)try{const v=vm.runInContext(name,this.ctx,{timeout:200});if(v&&typeof v==='object')this.values[name]=v;}catch{}
    for(const [k,v]of Object.entries(this.ctx))if(k!=='window'&&v&&typeof v==='object')this.values[k]=v;
  }
  discover() {
    const visited=new WeakSet();
    const walk=(o,dir='',depth=0)=>{
      if(!o||typeof o!=='object'||depth>35||visited.has(o))return;visited.add(o);
      const d=typeof o.dir==='string'?o.dir:dir;
      if(Array.isArray(o.files)&&d)for(const f of o.files)if(typeof f==='string')this.add(d+f);
      if(/^(?:weapon|armor|etc|item|material)$/.test(o.kind||'')&&o.id!=null)this.add('assets/icons/'+o.id+'.png',undefined,true);
      if(o.sid)this.add('assets/spell/'+o.sid+'.png',undefined,true);
      if(o.src&&typeof o.src==='string'&&/^(?:ui\d*|old|title|codex)\/[\w/-]+$/.test(o.src))this.add('assets/'+o.src+'.png',undefined,true);
      if(o.img&&typeof o.img==='string')this.add('assets/ui/'+o.img+'.png',undefined,true);
      if(Array.isArray(o.close)&&typeof o.close[4]==='string')this.add('assets/ui2/'+o.close[4]+'.png',undefined,true);
      for(const v of dataValues(o)){if(typeof v==='string'&&EXT.test(v)){if(/^(?:assets|\.\.?\/|\/|https?:)/.test(v))this.add(v);else if(d)this.add(d+v);}else walk(v,d,depth+1);}
    };
    walk(this.values);
    for(const name of ['META','CLSMETA','DOLLMETA','SUMMETA','DOGMETA','FXMETA']) {
      const meta=this.values[name]||{};
      for(const [g,frames]of Object.entries(meta))for(const f of Object.keys(frames||{}))if(/^\d+$/.test(f))this.add(name==='FXMETA'?`assets/fx/${g}/${g}-${f}.png`:`assets/${g}/${g}-${f}.png`);
    }
    const nums=(o,set=new Set())=>{if(typeof o==='number'&&o>0)set.add(o);else if(o&&typeof o==='object')for(const v of Object.values(o))nums(v,set);return set;};
    for(const name of ['AUDIO_PLAYER','AUDIO_MON','AUDIO_SPELL','CARD_SND','CKSND','DOGSND'])for(const id of nums(this.values[name]))this.add(`assets/snd/${id}.wav`,undefined,true);
    for(const text of this.texts.values())for(const m of text.matchAll(/SND\.(?:play|pre)\(\s*(\d+)/g))this.add(`assets/snd/${m[1]}.wav`,undefined,true);
    this.musicIds=[...nums(this.values.AUDIO_MUSIC)];
    // 所有技能及狀態圖示；原站有些刻意沒有圖片並使用文字替代。
    for(const name of ['SKILLS','MAGIC'])for(const id of Object.keys(this.values[name]||{})){this.add(`assets/spell/${id}.png`,undefined,true);this.add(`assets/spell/${id}x.png`,undefined,true);}
    for(const [name,obj]of Object.entries(this.values))if(/^(?:UIC|NEWIC|NEWPASS|CODEX_BTN|DOGPORT|DLGSK|DQCAT|CARD_TIER|WIN)/.test(name)) {
      const flatten=o=>{if(typeof o==='string'||typeof o==='number'){if(o!=='u_orb'&&/^[\w-]+$/.test(String(o))){let dir=/CODEX/.test(name)?'codex':/UIC|NEWIC|NEWPASS/.test(name)?'spell':/DOGPORT/.test(name)?'dog':/CLS/.test(name)?'old':null;if(dir)this.add(`assets/${dir}/${dir==='dog'?'dog':''}${o}.png`,undefined,true);}}else if(o&&typeof o==='object')for(const v of Object.values(o))flatten(v);};flatten(obj);
    }
    for(const id of Object.keys(this.values.GRD||{}))this.add('assets/ground/'+this.values.GRD[id]+'.png',undefined,true);
    for(const p of discoverTextAssets([...this.texts.values()]))this.add(p,undefined,true);
    // 舊版登入 UI 以 I(編號)、B([編號]) 及靜態常數組合檔名。
    const lg=this.texts.get('lg.js')||'';
    const game=this.texts.get('game.js')||'',optStart=game.indexOf("const IMG=n=>");
    if(optStart>=0)for(const m of game.slice(optStart,optStart+12000).matchAll(/["'](10[89]\d\d)["']/g))this.add(`assets/ui2/o${m[1]}.png`,undefined,true);
    for(const m of lg.matchAll(/\b(?:I|bg)\(\s*(\d+|["'][\w-]+["'])/g))this.add('assets/old/'+m[1].replace(/["']/g,'')+'.png',undefined,true);
    for(const m of lg.matchAll(/["']([\w-]+)["']/g))if(/^\d+[ch]$|^(?:accn|hporb|xpgem)$/.test(m[1]))this.add('assets/old/'+m[1]+'.png',undefined,true);
    // 以陣列逐一產生的按鈕，例如性別按鈕 [[306,307,0],[304,305,1]].forEach(...)。
    for(const m of lg.matchAll(/\[\s*(\[[\d,\s]+\](?:\s*,\s*\[[\d,\s]+\])*)\s*\]\s*\.forEach/g))for(const n of m[1].matchAll(/\d{3,}/g))this.add(`assets/old/${n[0]}.png`,undefined,true);
    for(const m of lg.matchAll(/\bB\(\s*\[([^\]]+)\]/g))for(const n of m[1].matchAll(/(?:^|,)\s*(\d+)\s*(?=,|$)/g))this.add(`assets/old/${n[1]}.png`,undefined,true);
    for(const row of this.values.CLS||[]) {
      for(const id of row.slice(1,3))this.add(`assets/old/${id}.png`);
      for(const base of row[5]||[])for(let f=base;f<base+24;f++)this.add(`assets/old/f${f}.png`);
    }
    for(const rows of Object.values(this.values.NEWFIG||{}))for(const [first,last]of rows)for(let f=first;f<=last;f++)this.add(`assets/old/n${f}.png`);
    for(const name of ['SLC','SLH'])for(const id of this.values[name]||[])this.add(`assets/old/${id}.png`);
    for(const t of Object.values(this.values.CARD_TIER||{}))if(t.i)this.add(`assets/cardicon/${t.i}.png`,undefined,true);
    for(const g of this.values.PORTRAIT_SET||[])this.add(`assets/portrait/${g}.png`,undefined,true);
    for(const id of Object.keys(this.values.TALN||{}))this.add(`assets/ui3/tal_${id}.png`,undefined,true);
    for(const id of Object.values(this.values.DQCAT||{}))this.add(`assets/ui3/dq_${id}.png`,undefined,true);
    for(let n=119;n<=137;n++)this.add(`assets/dice/${n}.png`,undefined,true);
    for(const id of Object.keys(this.values.DLGSK||{}))this.add(`assets/ui3/d3_${id}.png`,undefined,true);
    for(let n=1;n<=3;n++)this.add(`assets/ui3/lb_r${n}.png`,undefined,true);
    for(const b of ['G','A','S','T','C'])this.add(`assets/ui3/tal_${b}.png`,undefined,true);
  }
  async music() {
    const formats=id=>[`assets/mus/${id}.mp3`,`assets/mus/${id}.ogg`,`assets/mus/${id}.wav`,`assets/mus/music${id}.mp3`,`assets/snd/music${id}.mp3`];
    this.musicMap={};this.musicMissing=[];
    const ids=[...(this.musicIds||[])];
    await Promise.all(Array.from({length:Math.min(4,this.o.concurrency)},async()=>{
      while(ids.length){const id=ids.shift();
        for(const rel of formats(id)) {
          if(!this.seen.has(rel)){const url=ORIGIN+'/'+rel;this.seen.set(rel,url);this.optional.add(rel);await this.download({rel,url});}
          if(this.records.has(rel)){this.musicMap[id]=rel;break;}
        }
        if(!this.musicMap[id])this.musicMissing.push(id);
      }
    }));
  }
  patch() {
    let html=this.texts.get('index.html');
    if(!html)throw Error('沒有下載到 index.html');
    const api=/window\.L1S_API\s*=\s*["']https:\/\/l1stw\.com\/?["']\s*;/g;
    if(!api.test(html))throw Error('網站的 API 設定格式變更，停止離線轉換，原始碼已保留');
    html=html.replace(api,'window.L1S_API="";');
    html=html.replace(/<head([^>]*)>/i,'<head$1>\n<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob:; connect-src \'self\' blob: data:; worker-src \'none\'">\n<script src="offline-runtime.js"></script>');
    html=html.replace(/<title>(.*?)<\/title>/i,'<title>$1（離線版）</title>');
    save(path.join(this.textPub,'index.html'),html);
    let cloud=this.texts.get('cloud.js');
    const marker="if(!API&&location.protocol==='file:')return;";
    if(!cloud?.includes(marker))throw Error('cloud.js 的本機模式格式變更，請檢查');
    cloud=cloud.replace(marker,'if(window.__L1STW_OFFLINE||(!API&&location.protocol===\'file:\'))return;');
    save(path.join(this.textPub,'cloud.js'),cloud);
    const runtime=`'use strict';\n// LOCAL_ONLY_V1\nif(!['127.0.0.1','localhost','[::1]','::1'].includes(location.hostname)){document.documentElement.innerHTML='';throw Error('LOCAL_ONLY_V1');}\nwindow.__L1STW_OFFLINE=true;\n// Initial audio preferences.\ntry{const k='l1s_opt';const o=JSON.parse(localStorage.getItem(k)||'{}');if(!localStorage.getItem('l1stw_offline_initialized')){o.musOn=false;o.sfxOn=false;localStorage.setItem(k,JSON.stringify(o));localStorage.setItem('l1stw_offline_initialized','1');}}catch{}\n`;
    save(path.join(this.textPub,'offline-runtime.js'),runtime);
    let game=this.texts.get('game.js');
    if(!game?.includes('function netURL(){'))throw Error('game.js 的村莊連線格式變更，請檢查');
    game=game.replace('function netURL(){','function netURL(){if(window.__L1STW_OFFLINE)return "";');
    game=game.replace('function mresFetch(){','function mresFetch(){if(window.__L1STW_OFFLINE)return;');
    game=removeCommunityLink(game);
    save(path.join(this.textPub,'game.js'),game);
    // 音樂首選改為確實下載成功的格式，避免離線時依序測試不存在的格式。
    let audio=this.texts.get('audio.js');
    if(audio&&audio.includes('a.src=musUrl(id,exts[0]);')){audio=audio.replace('a.src=musUrl(id,exts[0]);',`a.src=(${JSON.stringify(this.musicMap)})[id]||musUrl(id,exts[0]);`);save(path.join(this.textPub,'audio.js'),audio);}
    save(path.join(this.textPub,'lg.js'),accountOnlyLogin(this.texts.get('lg.js')));
    require('./repatch_local.cjs').installOfflineTrades(this.textPub);
    require('./repatch_local.cjs').installGM(this.textPub);
    require('./policy.cjs').applyPolicy(this.textPub);
  }
  report({patchError=null}={}) {
    const failures=[...this.failed.values()].map(r=>annotateFailure({...r,optional:this.optional.has(r.path)}));
    const records=[...this.records.values()];
    // 網站同時列出舊、新地圖路徑：新路徑存在時，舊路徑的 404 是可忽略的替代來源。
    for(const f of failures)if(/^assets\/map(\d+)\/map\.js$/.test(f.path)){const id=/^assets\/map(\d+)/.exec(f.path)[1];if(this.records.has(`maps/map${id}/map.js`)){f.optional=true;f.reason='已下載另一個地圖來源 maps/map'+id+'/map.js';}}
    const generated=patchError?[]:['index.html','cloud.js','game.js','audio.js','lg.js','offline-runtime.js','offline-gm.js','.ai-policy.json','AGENTS.md'].filter(p=>fs.existsSync(path.join(this.textPub,p))).map(p=>{const b=fs.readFileSync(path.join(this.textPub,p));return {path:p,bytes:b.length,sha256:hash(b)};});
    const report={source:ORIGIN,started:this.started,finished:new Date().toISOString(),files:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),network:records.filter(r=>r.from==='network').length,requiredFailures:failures.filter(r=>!r.optional),optionalFailures:failures.filter(r=>r.optional),musicMissing:this.musicMissing,warnings:this.warnings,records,generated,patchStatus:patchError?'failed':'complete',...(patchError?{patchError}:{}),...(this.retrySummary?{retry:this.retrySummary}:{})};
    save(path.join(this.reportRoot,'download-report.json'),JSON.stringify(report,null,2));
    save(path.join(this.reportRoot,'catalog.json'),JSON.stringify(Object.fromEntries(Object.entries(this.values).map(([k,v])=>[k,typeof v==='object'&&v?Object.keys(v).length:typeof v])),null,2));
    console.log(patchError?'下載檔案已保留：':'完成：已保存',report.files,'個檔案，',(report.bytes/1048576).toFixed(1),'MB');
    printFailureSummary(failures);
    console.log('下載報告：',path.join(this.reportRoot,'download-report.json'));
    if(report.requiredFailures.some(f=>!isSource404(f)))process.exitCode=2;
    return report;
  }
  finalize(){
    try{this.patch();}catch(e){this.report({patchError:e.message});throw Error(e.message+'；下載紀錄與素材已保留，更新工具後可直接再次啟動，不必重新下載全部素材。',{cause:e});}
    return this.report();
  }
  async run() {
    assertOutput(this.root);
    const extra=path.join(__dirname,'extra-resources.json');
    if(fs.existsSync(extra))for(const p of JSON.parse(fs.readFileSync(extra,'utf8')))this.add(p,ORIGIN+'/',true);
    this.add('/index.html');await this.drain();
    if(!this.texts.has('index.html'))throw Error('首頁下載失敗');
    this.evaluateData();this.discover();
    // 小型介面與角色素材優先，較大的地圖塊排在後面。
    const priority=r=>/^assets\/(?:old|ui\d*|icons|spell|cardicon|portrait|codex)\//.test(r)?0:r.endsWith('.webp')?2:1;
    this.queue.sort((a,b)=>priority(a.rel)-priority(b.rel));
    await this.drain();
    // 新下載的延遲地圖描述檔需再解析一次。
    this.evaluateData();this.discover();await this.drain();
    await this.music();return this.finalize();
  }
}
if(require.main===module) {
  try {const o=args(process.argv.slice(2));if(o.help)console.log('node l1stw_crawler.cjs [--output 路徑] [--cache 舊資源路徑] [--refresh] [--concurrency 1-16]');else new Crawler(o).run().catch(e=>{console.error(e);process.exitCode=1;});}catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={Crawler,args,expression,localPath,assertOutput,accountOnlyLogin,offlineLogin,removeCommunityLink,discoverTextAssets};

function accountOnlyLogin(source){
 if(typeof source!=='string')throw Error('缺少原始 lg.js，請先重新下載遊戲程式');
 const start=source.indexOf('function login(){'),end=source.indexOf('// ---------- 2. 選擇角色',start);
 if(start<0||end<0)throw Error('登入程式格式變更，請檢查後再套用更新');
 return (source.slice(0,start)+'// OFFLINE_ACCOUNT_ONLY_V1\n'+offlineLogin.toString().replace('function offlineLogin(){','function login(){')+'\n\n'+source.slice(end)).replace('if(/[?&]ui=new/.test(location.search))','if(!window.__L1STW_OFFLINE&&/[?&]ui=new/.test(location.search))');
}
function offlineLogin(){
 if(!window.__L1STW_OFFLINE||window.L1S_API)throw Error('LOCAL_ONLY_V1');
 if(!AGREED){disclaimer();return;}
 clear();const lk=Math.min(Math.max(innerHeight/476,1.6),innerWidth/200),hy=innerHeight/2/lk;view('login',lk,495,Math.max(hy,Math.min(346,478-hy)));I(310,0,0);
 const info=E('div','',PTV()?392:34,PTV()?30:80);info.style.cssText+='width:172px;color:#c8d9e9;text-align:center;font:13px/1.7 "Microsoft JhengHei",sans-serif;text-shadow:1px 1px #000;pointer-events:none';
 info.innerHTML='<div style="color:#ffd98e;font-size:18px;margin-bottom:12px">天堂倖存者</div>輸入帳號即可開始遊玩。<br>新帳號會自動建立。<br><br>不同帳號分開保存角色，<br>輸入原帳號即可繼續。';
 const card=E('div','',390,250);card.style.cssText+='width:218px;height:190px;box-sizing:border-box;border:1px solid #a28350;border-radius:8px;background:rgba(20,16,10,.94);box-shadow:0 5px 24px #0009;color:#f3deb0;font:13px "Microsoft JhengHei",sans-serif';
 T('存檔帳號',16,15,card,'font-size:15px;color:#f3deb0');
 const idI=E('input','lgin',16,47,card);idI.id='offlineAccount';idI.setAttribute('aria-label','存檔帳號');idI.style.cssText+='width:184px;height:32px;background:#090a08;border:1px solid #826d45;border-radius:4px;padding:4px 8px';idI.maxLength=14;idI.autocomplete='off';idI.spellcheck=false;
 try{idI.value=localStorage.getItem('l1s_lastacct')||'';}catch{}
 T('2～14 個英文字母、數字或底線',16,86,card,'font-size:11px;color:#b9aa8e');
 const doLogin=()=>{
  const id=idI.value.trim();if(!/^[A-Za-z0-9_]{2,14}$/.test(id)){msg('帳號請輸入 2～14 個\n英文字母、數字或底線。');return;}
  const d=DB.get();if(!Object.prototype.hasOwnProperty.call(d,id)){
   Object.defineProperty(d,id,{value:{pw:'',chars:[]},enumerable:true,writable:true,configurable:true});DB.set(d);
   if(!Object.prototype.hasOwnProperty.call(DB.get(),id)){msg('無法保存新帳號，請檢查瀏覽器儲存空間。');return;}
  }
  acct=id;try{localStorage.setItem('l1s_lastacct',id);}catch{}
  // 通知本機伺服器玩家已登入，開始在背景檢查並下載更新（只連本機，不連外網）。
  try{fetch('/__offline/session',{method:'POST',keepalive:true}).catch(()=>{});}catch{}
  selIdx=0;select();
 };
 function button(text,x,width,fn,id){const b=E('button','lgb',x,112,card);b.type='button';if(id)b.id=id;b.textContent=text;b.style.cssText+='width:'+width+'px;height:32px;border:1px solid #a28350;border-radius:4px;background:#4b3820;color:#ffe9b9;font:14px "Microsoft JhengHei",sans-serif';b.onclick=fn;return b;}
 button('開始遊玩',16,112,doLogin,'offlineLogin');button('離開',138,62,()=>{try{window.close();}catch{}location.href='about:blank';});
 T('同一瀏覽器保留各帳號的遊戲進度',16,157,card,'font-size:11px;color:#b9aa8e');
 idI.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();doLogin();}};setTimeout(()=>idI.focus(),50);
 try{if(sessionStorage.getItem('l1s_idlekick')){sessionStorage.removeItem('l1s_idlekick');setTimeout(()=>msg('已保存遊戲進度，輸入原帳號即可繼續。'),300);}}catch{}
}
