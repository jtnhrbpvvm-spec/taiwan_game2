/* 共用小工具：$／fmt／clamp、toast、log／hlog、deepMerge
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const $=id=>document.getElementById(id);const fmt=n=>Math.floor(Number(n)||0).toLocaleString('zh-TW');const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;$('toastHost').appendChild(d);setTimeout(()=>d.remove(),2400)}
function log(t,cls='lg-sys'){const s=new Date().toLocaleTimeString('zh-TW',{hour12:false})+' '+t;G.log.unshift(s);if(G.log.length>150)G.log.length=150;hlog(t,cls)}
function hlog(t,cls='lg-sys'){huntLog.unshift({t,cls});if(huntLog.length>80)huntLog.length=80;paintLog()}
function deepMerge(base,src){if(!src||typeof src!=='object')return base;for(const k of Object.keys(src)){if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&base[k]&&typeof base[k]==='object')deepMerge(base[k],src[k]);else base[k]=src[k]}return base}
