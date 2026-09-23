/* 介面核心：戰鬥紀錄繪製、門派徽記 SVG、syncHud() 上方角色列、血條打擊感與傷害飄字、syncBattle() 戰鬥畫面
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
/* ---------- UI ---------- */
function paintLog(){const h=huntLog.map(x=>`<div class="${x.cls}">${x.t}</div>`).join('');if($('huntLog'))$('huntLog').innerHTML=h;if($('fightLog'))$('fightLog').innerHTML=h}
/* ===== 門派徽記：火焰＋武器造型（取代原本的單字圖示） ===== */
let __embSeq=0;
function classEmblem(key){
 const id='e'+(++__embSeq);
 const weapon={
  劍宗:`<path d="M32 4.5 35.6 14.5 35.6 38.5 32 44 28.4 38.5 28.4 14.5Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M32 9.2V41.2" stroke="#fffdf2" stroke-width="1" opacity=".8"/>
        <path d="M19 44.2h26l-3.4 3.6H22.4Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5" stroke-linejoin="round"/>
        <rect x="30.1" y="47.8" width="3.8" height="9" rx="1.6" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>
        <circle cx="32" cy="58.6" r="2.8" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>`,
  戟門:`<path d="M32 6.5 34.9 14.5 34.9 40 32 45 29.1 40 29.1 14.5Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M34.9 16.5c6 1 9 5.2 8 10.6-2.6-3.4-5-4.8-8-5Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5" stroke-linejoin="round"/>
        <path d="M29.1 19.5c-4.6.9-6.8 4-6.2 8.2 2-2.7 3.9-3.8 6.2-4Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5" stroke-linejoin="round"/>
        <rect x="30.2" y="45" width="3.6" height="12" rx="1.6" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>
        <circle cx="32" cy="58.6" r="2.6" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>`,
  詭流:`<path d="M32 7.5 34.6 14.6 34.6 38 32 42.5 29.4 38 29.4 14.6Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".6" stroke-linejoin="round"/>
        <path d="M24.6 12.8c-1.4 5.4-.7 9.4 2 12.6" stroke="url(#b${id})" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M39.4 12.8c1.4 5.4.7 9.4-2 12.6" stroke="url(#b${id})" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M21 43.6h22l-3 3.4H24Z" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5" stroke-linejoin="round"/>
        <rect x="30.2" y="47" width="3.6" height="10" rx="1.6" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>`,
  幻道:`<circle cx="32" cy="11.5" r="5.4" fill="url(#b${id})" stroke="#fff6da" stroke-width=".7"/>
        <circle cx="30.4" cy="9.8" r="1.5" fill="#fffdf0" opacity=".85"/>
        <rect x="30.3" y="17" width="3.4" height="39" rx="1.7" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>
        <path d="M25.6 24.5h12.8" stroke="url(#b${id})" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="32" cy="58.2" r="2.6" fill="url(#b${id})" stroke="#fff6da" stroke-width=".5"/>`
 }[key]||null;
 if(!weapon)return '<span class="emb-none">✦</span>';
 return `<svg class="emb" viewBox="0 0 64 64" aria-hidden="true">
  <defs>
   <linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset=".45" stop-color="#f4d68c"/><stop offset="1" stop-color="#9a7327"/></linearGradient>
   <linearGradient id="f${id}" x1="0" y1="1" x2=".2" y2="0"><stop offset="0" stop-color="#ff5a12"/><stop offset=".45" stop-color="#ffab35"/><stop offset=".8" stop-color="#ffe089"/><stop offset="1" stop-color="#fff6d0"/></linearGradient>
   <filter id="g${id}" x="-45%" y="-45%" width="190%" height="190%"><feGaussianBlur stdDeviation="1.7"/></filter>
  </defs>
  <g class="emb-flame">
   <g filter="url(#g${id})" opacity=".85">
    <path d="M16.5 47C10 37 13 24.5 25 18.5 19.5 27.5 18 36 22 44Z" fill="url(#f${id})"/>
    <path d="M47.5 47C54 37 51 24.5 39 18.5 44.5 27.5 46 36 42 44Z" fill="url(#f${id})"/>
   </g>
   <path d="M16.5 47C10 37 13 24.5 25 18.5 19.5 27.5 18 36 22 44Z" fill="url(#f${id})" opacity=".95"/>
   <path d="M47.5 47C54 37 51 24.5 39 18.5 44.5 27.5 46 36 42 44Z" fill="url(#f${id})" opacity=".95"/>
   <path d="M13.5 42C11.5 36 12.5 29 16.5 24.5 14.5 30.5 14 35.5 16 40Z" fill="#fff0bd" opacity=".55"/>
   <path d="M50.5 42C52.5 36 51.5 29 47.5 24.5 49.5 30.5 50 35.5 48 40Z" fill="#fff0bd" opacity=".55"/>
  </g>
  <g class="emb-weapon">${weapon}</g>
 </svg>`;
}
function syncHud(){ensureStats();const p=G.player,s=p.stats,c=classData();const set=(id,v)=>{const el=$(id);if(el&&el.textContent!==String(v))el.textContent=String(v)};set('pname',G.name||'少俠');set('prealm',c?`${G.player.classKey}${isQiyuan()?' · 奇緣':''} · Lv.${p.level}`:`Lv.${p.level}`);set('lv',String(p.level));set('className',c?G.player.classKey:'未選門派');const av=$('avatar');if(av)av.innerHTML=c?classEmblem(G.player.classKey):'<span class="emb-none">✦</span>';set('realmText',fmt(p.exp)+'/'+fmt(expNeed()));set('power',fmt(power()));set('powerRate','+'+fmt(powerRate())+'/s');set('stone',fmt(p.spiritStone));set('hereMap',currentMap().name);set('autoState',pendingBoss?'Boss對峙':battle?.active?(G.auto.enabled?'自動戰鬥':'手動戰鬥'):(G.auto.enabled?'搜敵中':'閒置'));const hp=clamp(s.hp/s.maxHp,0,1),mp=clamp(s.mp/s.maxMp,0,1);if($('hpFill'))$('hpFill').style.width=hp*100+'%';if($('mpFill'))$('mpFill').style.width=mp*100+'%';set('hpText','氣血 '+fmt(s.hp)+' / '+fmt(s.maxHp));set('mpText','法力 '+fmt(s.mp)+' / '+fmt(s.maxMp));if($('powerFill'))$('powerFill').style.width=clamp(p.exp/expNeed(),0,1)*100+'%';set('powerText',fmt(p.exp)+' / '+fmt(expNeed()));const ab=$('autoBtn');if(ab)ab.classList.toggle('on',G.auto.enabled);if($('huntFoe')){if(battle?.active){$('huntFoe').textContent=(battle.enemy.isBoss?'★ ':'')+battle.enemy.name+' Lv.'+battle.enemy.level;$('huntFoe').className='foe '+(battle.enemy.isBoss?'lv-boss':'lv-even');setBarPair('huntBarFill','huntBarTrail',clamp(battle.enemy.hp/battle.enemy.maxHp,0,1)*100);$('huntMeta').textContent=`${elementName(battle.enemy.element)} · HP ${fmt(battle.enemy.hp)}/${fmt(battle.enemy.maxHp)} · 攻 ${fmt(battle.enemy.atk)} · 防 ${fmt(battle.enemy.def)}`}else{$('huntFoe').textContent=G.auto.enabled?'搜尋對手…':'尚未開戰';$('huntFoe').className='foe lv-easy';setBarPair('huntBarFill','huntBarTrail',0);$('huntMeta').textContent=currentMap().name+' · '+currentMap().zone}}set('tkKill',fmt(G.auto.stats.kills));set('tkStone',fmt(G.auto.stats.stones));set('tkDrop',fmt(G.auto.stats.drops));if($('huntBuffs'))$('huntBuffs').textContent=`${G.player.classKey||'未選'} · 五行 ${elementName(p.preferredElement)} · 五屬 ${Object.entries(s.attr||{}).map(([k,v])=>k+Math.floor(v)).join(' ')}`}
/* ===== 打擊感：即時扣血（hpfill）＋延遲尾條（hptrail）＋傷害飄字 ===== */
function setBarPair(fillId,trailId,pct){const f=$(fillId),tr=$(trailId);if(f)f.style.width=pct+'%';if(tr)tr.style.width=pct+'%'}
function flashBar(el){if(!el)return;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),450)}
function showDmg(value,who,kind){
 if(!Number(value))return;
 const hosts=[];const bs=$('battleScreen');
 if(bs&&bs.classList.contains('show')){const fs=bs.querySelectorAll('.fighter');const host=who==='player'?fs[0]:fs[1];if(host){hosts.push(host);flashBar(host.querySelector('.hpbar'))}}
 if(who==='enemy'){const hb=$('huntBox');if(hb&&document.body.contains(hb)){hosts.push(hb);flashBar(hb.querySelector('.foebar'))}}
 hosts.forEach(h=>{const d=document.createElement('span');d.className='dmg-float'+(kind?' '+kind:'');d.textContent=(kind==='heal'?'+':'-')+fmt(Math.abs(value));d.style.left=(46+Math.random()*26)+'%';h.appendChild(d);setTimeout(()=>d.remove(),1000)});
}
function syncBattle(){if(!battle)return;const s=G.player.stats,e=battle.enemy;const pp=clamp(s.hp/s.maxHp,0,1)*100,ep=clamp(e.hp/e.maxHp,0,1)*100,mp=clamp(s.mp/s.maxMp,0,1)*100;$('bfPlayerPct').textContent=Math.round(pp)+'%';$('bfEnemyPct').textContent=Math.round(ep)+'%';setBarPair('bfPHP','bfPHPTrail',pp);setBarPair('bfEHP','bfEHPTrail',ep);{const a=$('bfPHPNum'),b=$('bfEHPNum');if(a)a.textContent=fmt(s.hp)+' / '+fmt(s.maxHp);if(b)b.textContent=fmt(e.hp)+' / '+fmt(e.maxHp)}$('bfPMP').style.width=mp+'%';$('bfPlayer').textContent=G.name;$('bfEnemy').textContent=(e.isBoss?'★ ':'')+e.name;$('battleTitle').textContent=e.name+' Lv.'+e.level;$('battleStatus').textContent=`${G.player.classKey||'門派'} · ${battle.turn} 回 · 傷害 ${fmt(battle.damageTotal)}${battle.manualOnly?' · 沙魔巢穴禁止自動出招':''}`;$('bfPStatus').textContent=`HP ${fmt(s.hp)} · MP ${fmt(s.mp)} · 狠${Math.floor(s.attr.狠)} 快${Math.floor(s.attr.快)} 穩${Math.floor(s.attr.穩)} 智${Math.floor(s.attr.智)} 準${Math.floor(s.attr.準)}${buffText()}`;$('bfEStatus').textContent=`${elementName(e.element)} · ${e.race||'獸'}${battle.status.burn?' · 灼燒':''}${battle.status.freeze?' · 凍結':''}${battle.status.shock?' · 感電':''}${battle.status.break?' · 破防':''}`;const btns=G.skills.equipped.map((id,i)=>{const sk=Object.values(SKILLS).find(x=>x.id===id);if(!sk)return `<button class="smallbtn" disabled>連招${i+1}<br>空槽</button>`;const ready=skillReady(sk)&&G.player.stats.mp>=(sk.mp||0);return `<button class="smallbtn" ${ready?'':'disabled'} onclick="manualSkill('${sk.id}')">連招${i+1} · ${sk.name}<br><span style="font-size:9px">${elementName(sk.element)} · MP ${sk.mp||0}</span></button>`}).join('');$('battleActions').innerHTML=btns+`<button class="smallbtn good" onclick="manualAttack()">普通攻擊</button><button class="smallbtn" onclick="manualPotion('hp')">凡品靈草 ×${potionCount('hpPotion')}</button><button class="smallbtn" onclick="manualPotion('mp')">聚靈丹 ×${potionCount('mpPotion')}</button><button class="smallbtn danger" onclick="flee()">離開</button>`}
function manualAttack(){if(battle?.active){playerAttack();battle.pAt=Date.now()+700;if(battle.enemy.hp<=0)onKill();syncBattle()}}
function manualSkill(id){if(battle?.active){const sk=Object.values(SKILLS).find(x=>x.id===id);if(castSkill(sk,true))battle.pAt=Date.now()+700;if(battle.enemy.hp<=0)onKill();syncBattle()}}
function manualPotion(t){usePotion(t);syncBattle();syncHud()}
