/* 裝備系統：品質倍率與升品、奇緣模式掉落、穿脫裝備、裝備評分、詞綴、裝備比較
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const BOSS_RESPAWN_MS=5*60*1000;
/* ===== 裝備品質：品質倍率直接乘進該件裝備的攻／防／HP／MP／屬性（qBaked=true），升品時依倍率差重算 ===== */
const QUALITY_ORDER=['white','green','blue','purple','gold'];
const QUALITY_MUL={white:1,green:1.08,blue:1.18,purple:1.32,gold:1.5};
/* qExact 保存未四捨五入的值，連續升品不會累積誤差；若數值已被強化等改動（四捨五入後不相符），改以目前數值為準 */
function scaleEquipStats(it,f){if(!it||!f||f===1)return;const ex=it.qExact=it.qExact||{};const step=(key,cur,dec)=>{const e=Number(ex[key]),m=dec?10:1;const src=(Number.isFinite(e)&&Math.round(e*m)/m===cur)?e:cur;const v=src*f;ex[key]=v;return Math.round(v*m)/m};for(const k of ['baseAtk','baseDef','hp','mp'])if(Number(it[k]))it[k]=step(k,Number(it[k]),false);if(it.attr)for(const k of Object.keys(it.attr))if(Number(it.attr[k]))it.attr[k]=step('attr.'+k,Number(it.attr[k]),true)}
function bakeEquipQuality(it,q){if(!it||it.qBaked)return it;q=QUALITY_MUL[q]?q:(QUALITY_MUL[it.quality]?it.quality:'white');scaleEquipStats(it,QUALITY_MUL[q]);it.quality=q;it.qBaked=true;return it}
/* 舊存檔一次性轉換：沿用舊版實際生效的品質（同名品質優先），轉換後清除裝備的同名品質，避免之後掉落直接繼承升品 */
function migrateEquipQuality(){const all=[];Object.values(G.equipment||{}).forEach(it=>it&&all.push(it));Object.values(G.inventoryInstances||{}).forEach(arr=>Array.isArray(arr)&&arr.forEach(it=>it&&all.push(it)));all.forEach(it=>{if(EQUIP_DB[it.name])bakeEquipQuality(it,G.inventoryQuality?.[it.name]||it.quality)});for(const n of Object.keys(G.inventoryQuality||{}))if(EQUIP_DB[n])delete G.inventoryQuality[n]}
/* ===== 奇緣模式：只能靠打怪掉落取得品階、強度與強化值；不能以任何方式強化裝備 ===== */
function isQiyuan(){return G.mode==='qiyuan'}
function qiyuanBlock(){if(!isQiyuan())return false;toast('奇緣模式無法強化／精煉／洗煉／升品，只能靠打怪掉落更好的裝備（開孔與鑲嵌可使用）');return true}
function applyEnhanceSteps(it,n){for(let i=0;i<n;i++){it.baseAtk=Math.round((it.baseAtk||0)*1.06+2);it.baseDef=Math.round((it.baseDef||0)*1.06+1);if(it.hp)it.hp=Math.round(it.hp*1.045)}it.enhance=(it.enhance||0)+n}
function rollQiyuanEquip(name,lv=1,boss=false){const d=EQUIP_DB[name];if(!d)return null;const it=JSON.parse(JSON.stringify(d));it.enhance=0;it.refine=0;it.sockets=0;it.gems=[];it.affix=randomAffix(it.level);
 const w=boss?{white:8,green:27,blue:33,purple:22,gold:10}:{white:46,green:30,blue:15,purple:7,gold:2};let r=Math.random()*Object.values(w).reduce((a,b)=>a+b,0),q='white';for(const k of QUALITY_ORDER){r-=w[k];if(r<=0){q=k;break}}
 const pct=boss?95+Math.floor(Math.random()*36):85+Math.floor(Math.random()*41);scaleEquipStats(it,pct/100);bakeEquipQuality(it,q);
 const maxE=Math.min(15,3+Math.floor((Number(lv)||1)/12)+(boss?2:0)),p=boss?.62:.5;let e=0;while(e<maxE&&Math.random()<p)e++;if(e)applyEnhanceSteps(it,e);
 it.rollPct=pct;it.qiyuan=true;return it}
/* 所有「打怪／副本掉落裝備」都走這裡：一般模式照舊只加數量；奇緣模式產生隨機裝備實體 */
function gainEquipDrop(name,lv=1,boss=false){if(isQiyuan()&&EQUIP_DB[name]){ensureInventoryInstances();const it=rollQiyuanEquip(name,lv,boss);if(it){G.inventoryInstances[name]=G.inventoryInstances[name]||[];G.inventoryInstances[name].push(it);G.inventory[name]=(G.inventory[name]||0)+1;return it}}G.inventory[name]=(G.inventory[name]||0)+1;return null}
function equipTag(it){if(!it)return '';return `${it.enhance?' +'+it.enhance:''}${it.rollPct?` · 強度${it.rollPct}%`:''}`}
function makeEquip(name){const d=EQUIP_DB[name];if(!d)return null;const it=JSON.parse(JSON.stringify(d));it.quality=it.quality||'white';it.enhance=0;it.refine=0;it.sockets=0;it.gems=[];it.affix=randomAffix(it.level);return bakeEquipQuality(it,it.quality)}
function equipScore(it){if(!it)return 0;const qMul=it.qBaked?1:({white:1,green:1.15,blue:1.35,purple:1.6,gold:2}[it.quality]||1);const attrSum=Object.values(it.attr||{}).reduce((a,v)=>a+(Number(v)||0),0);let s=(Number(it.baseAtk)||0)*2+(Number(it.baseDef)||0)*1.5+(Number(it.hp)||0)*.25+(Number(it.mp)||0)*.5+attrSum*3;s*=qMul;s*=1+(Number(it.enhance)||0)*.08;s*=1+(Number(it.refine)||0)*.02;s+=(it.gems?.length||0)*15;return Math.round(s)}
function randomAffix(lv){const arr=[['狠',Math.max(1,Math.round(lv*.12))],['快',Math.max(1,Math.round(lv*.10))],['穩',Math.max(1,Math.round(lv*.14))],['智',Math.max(1,Math.round(lv*.10))],['準',Math.max(1,Math.round(lv*.12))]];const x=arr[Math.floor(Math.random()*arr.length)];return {key:x[0],value:x[1]}}
function equipItem(name,quiet=false,force=false){const inv=G.inventory[name]||0;if(!inv||!EQUIP_DB[name])return false;const reqLv=Number(EQUIP_DB[name].level)||1;if(G.player.level<reqLv){if(!quiet)toast(`需要 Lv.${reqLv} 才能裝備 ${name}`);return false;}let it=null;const stack=G.inventoryInstances?.[name];if(stack&&stack.length)it=stack.pop();else it=makeEquip(name);if(!it)return false;const slot=it.slot,old=G.equipment[slot];if(old&&!force&&equipScore(old)>=equipScore(it)){if(stack)stack.push(it);return false}if(old){const oldName=old.name||'';if(oldName){G.inventory[oldName]=(G.inventory[oldName]||0)+1;G.inventoryInstances[oldName]=G.inventoryInstances[oldName]||[];G.inventoryInstances[oldName].push(old)}}G.equipment[slot]=it;G.inventory[name]=Math.max(0,(G.inventory[name]||0)-1);ensureStats();if(!quiet)toast(`裝備：${name}`);save(true);return true}
function unequipItem(slot){const it=G.equipment[slot];if(!it)return toast('該部位沒有裝備');const name=it.name;G.inventory[name]=(G.inventory[name]||0)+1;G.inventoryInstances[name]=G.inventoryInstances[name]||[];G.inventoryInstances[name].push(it);G.equipment[slot]=null;ensureStats();save(true);toast(`卸下：${name}`);renderAll()}
function compareEquip(name,inst){const d=EQUIP_DB[name];if(!d)return null;const cur=G.equipment[d.slot];const _ca=G.inventoryInstances?.[name];const candidate=inst||(_ca&&_ca.length?_ca[_ca.length-1]:null)||makeEquip(name);if(!candidate)return null;const keys=[['baseAtk','攻'],['baseDef','防'],['hp','HP'],['mp','MP']];const lines=keys.map(([k,label])=>{const a=Number(cur?.[k]||0),b=Number(candidate?.[k]||d[k]||0),diff=b-a;return `${label}:${diff>0?'+':''}${fmt(diff)}`}).filter(x=>!/:0$/.test(x));for(const k of ['狠','準','穩','快','智']){const diff=Number(candidate?.attr?.[k]||d.attr?.[k]||0)-Number(cur?.attr?.[k]||0);if(diff)lines.push(`${k}:${diff>0?'+':''}${fmt(diff)}`)}return {slot:d.slot,cur,candidate,text:lines.join(' · ')||'主要數值無變化'} }
function equipCompareHtml(name,inst){const c=compareEquip(name,inst);if(!c)return '';return `<div class="desc">對比 ${c.cur?`目前：${c.cur.name} · `:'目前：空 · '} ${c.text}</div>`}

