/* 繪製與主迴圈：renderDeskChar() 電腦版第一區塊、renderAll()、tickSecond()、loop()
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
/* ===== 電腦版第一區塊：角色與能力值（手機版隱藏，功能內容仍在第二區塊） ===== */
function renderDeskChar(){
 const box=$('deskChar');if(!box)return;
 if(!G.selected||!classData()){box.innerHTML='';return}
 ensureStats();const p=G.player,s=p.stats;
 const rows=[['攻擊',fmt(s.atk)],['防禦',fmt(s.def)],['出手',(Number(s.speed)||0).toFixed(1)],['暴擊',((Number(s.critRate)||0)*100).toFixed(1)+'%'],['氣血',fmt(s.maxHp)],['法力',fmt(s.maxMp)]];
 const attrs=['狠','快','穩','智','準'].map(k=>[k,Math.floor(Number(s.attr?.[k])||0)]);
 box.innerHTML=`<div class="card dk-card">
  <div class="dk-head"><div class="role-avatar dk-ava">${classEmblem(p.classKey)}</div>
   <div class="dk-id"><div class="dk-name">${G.name||'少俠'}</div>
    <div class="dk-sub">${p.classKey} · Lv.${p.level} · ${currentMap().name}${isQiyuan()?' · 奇緣模式':''}</div></div></div>
  <div class="statgrid dk-stats">${rows.map(([k,v])=>`<div class="stat"><span>${k}</span><em>${v}</em></div>`).join('')}</div>
  <div class="statgrid dk-attrs">${attrs.map(([k,v])=>`<div class="stat"><span>${k}</span><em>${v}</em></div>`).join('')}</div>
 </div>`;
}
function renderAll(){ensureStats();renderDeskChar();const views={home:renderHome,character:renderCharacter,hunt:renderWorld,inventory:renderInventory,skill:renderSkills,shop:renderShop,forge:renderForge,boss:renderBoss,system:renderSystem};$('content').innerHTML=(views[activePanel]||renderHome)();renderSide();syncStrategyUI();if(activePanel==='inventory')setTimeout(bindInventoryTooltips,0);syncHud();paintLog();const ni=$('nameInput');if(ni)ni.onchange=e=>{G.name=G.player.name=e.target.value.slice(0,16)||'少俠';syncHud();save(true)}}
function tickSecond(){ensureStats();const s=G.player.stats;if(!battle?.active){s.hp=Math.min(s.maxHp,s.hp+Math.max(1,Math.round(s.maxHp*.018)));s.mp=Math.min(s.maxMp,s.mp+Math.max(1,Math.round(s.maxMp*.03)));if(G.auto.autoAdvance)autoAdvance();if(G.auto.autoDungeon&&G.auto.enabled&&Math.random()<.018){const ready=DUNGEONS.filter(d=>G.player.level>=d.need&&['tower','trial','soul','dense'].includes(d.kind));if(ready.length&&Math.random()<.25)dungeonEnter(ready[Math.floor(Math.random()*ready.length)].id,false)}}else{s.mp=Math.min(s.maxMp,s.mp+Math.max(1,Math.round(s.maxMp*.008)))}levelUp();renderDeskChar();if(Date.now()%5000<1000)save(true);if(activePanel==='home'||activePanel==='boss')renderAll()}
function loop(){if(!GAME_ACTIVE)return;const now=Date.now();if(G.auto.enabled&&!G.selected){G.auto.enabled=false;return}if(battle?.active)combatTick(now);else if(G.auto.enabled&&!pendingBoss&&now>=nextSpawnAt)spawnEncounter();if(now-lastSecond>=1000){lastSecond=now;tickSecond()}syncHud();if(battle?.active&&$('battleScreen').classList.contains('show'))syncBattle()}
function manualStart(){const pick=pickWeighted(mapPool());if(pick)startEncounter(pick.name,pick.level,currentMap().id,true)}
