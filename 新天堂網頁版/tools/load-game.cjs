// 把天堂網頁版 index.html 的 data/*.js 依載入順序放進 Node vm 執行（DOM 用萬用假物件代替），
// 讓產生攻略資料的腳本可以直接讀遊戲執行後的全域資料（含移除道具、娃娃去重等後處理）。
// 用法：const {load}=require('./load-game.cjs'); const ctx=load(遊戲資料夾); ctx.run('killRewardData')
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

function anything(name,overrides){
  const fn=function(){};
  if(overrides)fn.__c={...overrides};
  return new Proxy(fn,{
    get(t,k){
      if(k===Symbol.toPrimitive)return()=>'';
      if(k===Symbol.iterator)return function*(){};
      if(k==='then')return undefined;
      if(k==='length')return 0;
      if(k in t&&k!=='name'&&k!=='prototype')return t[k];
      if(!t.__c)t.__c={};
      if(!(k in t.__c))t.__c[k]=anything(String(k));
      return t.__c[k];
    },
    set(t,k,v){if(!t.__c)t.__c={};t.__c[k]=v;return true;},
    apply(){return anything(name+'()');},
    construct(){return anything('new '+name);},
    has(){return true;}
  });
}

function load(gameDir,{skip=[],quiet=true}={}){
  const html=fs.readFileSync(path.join(gameDir,'index.html'),'utf8');
  const files=[...html.matchAll(/src="(data\/[^"?]+)/g)].map(m=>m[1]).filter(f=>!skip.includes(f));
  const store=new Map();
  const ready=[];
  const listen=(type,fn)=>{if(/DOMContentLoaded|^load$|readystatechange/.test(type)&&typeof fn==='function')ready.push(fn);};
  const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear(),key:()=>null,length:0};
  const sandbox={console:quiet?{log(){},warn(){},error(){},info(){},debug(){}}:console,
    setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
    requestAnimationFrame:()=>0,cancelAnimationFrame(){},queueMicrotask(){},
    localStorage,sessionStorage:localStorage,
    document:anything('document',{addEventListener:listen,readyState:'loading',currentScript:{src:'http://localhost/data/x.js'}}),navigator:{userAgent:'node',language:'zh-TW',serviceWorker:undefined},
    location:{href:'http://localhost/',protocol:'http:',search:'',hash:'',pathname:'/',host:'localhost',origin:'http://localhost'},
    fetch:()=>new Promise(()=>{}),Image:function(){return anything('img');},Audio:function(){return anything('audio');},
    MutationObserver:function(){return {observe(){},disconnect(){}};},ResizeObserver:function(){return {observe(){},disconnect(){}};},
    IntersectionObserver:function(){return {observe(){},disconnect(){}};},
    Worker:function(){return anything('worker');},matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
    addEventListener:listen,removeEventListener(){},dispatchEvent(){},getComputedStyle:()=>anything('style'),
    CustomEvent:function(){},Event:function(){},HTMLElement:function(){},Element:function(){},Node:function(){},
    performance:{now:()=>Date.now()},innerWidth:1280,innerHeight:720,devicePixelRatio:1,screen:{width:1280,height:720},
    URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,crypto:globalThis.crypto,atob,btoa,
    createImageBitmap:()=>new Promise(()=>{}),OffscreenCanvas:function(){return anything('canvas');},
    indexedDB:anything('indexedDB'),caches:anything('caches'),history:anything('history'),
    alert(){},confirm:()=>false,prompt:()=>null,open(){},scrollTo(){}};
  sandbox.window=sandbox;sandbox.self=sandbox;sandbox.globalThis=sandbox;sandbox.top=sandbox;sandbox.parent=sandbox;
  const ctx=vm.createContext(sandbox);
  const errors=[];
  for(const f of files){
    const file=path.join(gameDir,f);
    if(!fs.existsSync(file)){errors.push([f,'missing']);continue;}
    try{vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:f});}
    catch(e){errors.push([f,String(e&&e.message||e).slice(0,160)]);}
  }
  for(const fn of ready){try{fn.call(sandbox,{type:'DOMContentLoaded'});}catch(e){errors.push(['(ready)',String(e&&e.message||e).slice(0,160)]);}}
  return {ctx,errors,files,run:code=>vm.runInContext(code,ctx)};
}
module.exports={load};

if(require.main===module){
  const dir=process.argv[2]||path.resolve(__dirname,'../../../idle-lineage-class/-username-.github.io-/天堂網頁版');
  const t=Date.now(),g=load(dir);
  console.log('loaded',g.files.length,'files in',Date.now()-t,'ms');
  for(const e of g.errors)console.log('ERR',e[0],e[1]);
}
