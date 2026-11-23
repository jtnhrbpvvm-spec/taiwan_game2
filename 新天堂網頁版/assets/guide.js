// 攻略頁的動態表格（資料來自 data/wiki-data.js）
(()=>{
const W=window.WIKI;if(!W)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('zh-TW');
const items=new Map(W.items.map(i=>[i.id,i])),mobs=new Map(W.monsters.map(m=>[m.id,m])),maps=new Map(W.maps.map(m=>[m.id,m]));
const XP=W.rates.RateXp||1;
const itemLink=(id,n)=>{const i=items.get(id);return i?`<a href="wiki.html#items:${id}">${esc(i.name)}</a>${n>1?' ×'+num(n):''}`:'#'+id;};
const table=(head,rows)=>`<div class="tbl-wrap"><table><thead><tr>${head.map(h=>`<th${/^[#＃]|數|費|等級|經驗|HP|重生/.test(h)?' class="num"':''}>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const GEN={
 // 職業
 classes(){
  const pics={騎士:'knight',法師:'mage',王族:'royal',妖精:'elf',黑妖:'darkelf',龍騎士:'dragonknight',幻術師:'illusionist',戰士:'warrior'};
  const lab={str:'力',dex:'敏',con:'體',wis:'精',cha:'魅',int:'智'};
  return '<div class="grid2">'+Object.entries(W.classes).map(([k,c])=>`<div class="box" style="display:flex;gap:12px"><img src="img/site/class-${pics[k]}.jpg" alt="" width="84" height="110" style="object-fit:cover;object-position:top;border-radius:8px;border:1px solid var(--line2);flex:0 0 84px"><div><h4>${k}</h4><p>${esc(c.intro)}</p><p class="small muted" style="margin-top:6px">基礎：${Object.entries(c.base).map(([s,v])=>lab[s]+v).join(' ')} · 擲骰額外 ${c.points} 點 · 初始 HP ${c.hp}</p></div></div>`).join('')+'</div>';
 },
 // 新手背包
 starter(){
  const common=W.starterKit.common.map(([id,n])=>itemLink(id,n)).join('、');
  const per=Object.entries(W.starterKit).filter(([k])=>k!=='common').map(([k,l])=>`<tr><td>${k}</td><td>${l.map(([id,n])=>itemLink(id,n)).join('、')}</td></tr>`);
  return `<p><b>所有職業：</b>${common}</p>`+table(['職業','職業武器'],per);
 },
 // 練功地圖：依怪物等級分段
 leveling(){
  const bands=[[10,20],[20,30],[30,40],[40,50],[50,60],[60,75],[75,99],[99,999]];
  // 地監／島嶼／高塔用整張地圖的實際生怪；大陸、說話之島（Map 0／4）上的野外點用傳送點附近的怪
  const seen=new Set();
  const hunts=W.teleports.filter(t=>t.cat!=='village').map(t=>{
   const whole=t.map!==0&&t.map!==4&&maps.get(t.map);
   let list=whole?Object.entries(whole.mobs).map(([id,n])=>({m:mobs.get(+id),n})):t.mobs.map(x=>({m:mobs.get(x.id),n:x.count}));
   list=list.filter(x=>x.m&&!x.m.boss&&!x.m.quest&&x.m.exp>0&&x.n>0);
   if(!list.length)return null;
   const key=whole?'map'+t.map:'t'+t.id;if(seen.has(key))return null;seen.add(key);
   const lv=list.flatMap(x=>Array(Math.min(x.n,50)).fill(x.m.level)).sort((a,b)=>a-b);
   const total=list.reduce((s,x)=>s+x.n,0),exp=list.reduce((s,x)=>s+x.m.exp*x.n,0)/total;
   return {...t,mid:lv[Math.floor(lv.length/2)],lo:lv[0],hi:lv.at(-1),exp:exp*XP};
  }).filter(Boolean);
  const rows=[];
  for(const [a,b] of bands){
   const pick=hunts.filter(h=>h.mid>=a&&h.mid<b).sort((x,y)=>y.exp-x.exp).slice(0,6);
   if(!pick.length)continue;
   rows.push(`<tr><td class="num"><b>${b>200?a+' 以上':a+'～'+b}</b></td><td>${pick.map(h=>`<a href="wiki.html#hunt:${h.id}">${esc(h.name)}</a> <span class="small muted">怪物 Lv${h.lo}～${h.hi}・平均經驗 ${num(Math.round(h.exp))}・傳送 ${num(h.price)} 金</span>`).join('<br>')}</td></tr>`);
  }
  return table(['等級','推薦狩獵場（平均經驗高的在前）'],rows);
 },
 // 等級任務
 quests(){
  const order=['王族','騎士','法師','妖精','黑妖','龍騎士','幻術師','戰士'];
  const list=[...W.quests].sort((a,b)=>order.indexOf(a.roles[0])-order.indexOf(b.roles[0])||a.level-b.level);
  return table(['職業','等級','任務','要打的怪','獎勵'],list.map(q=>`<tr><td>${q.roles.join('、')}</td><td class="num">${q.level}</td><td><a href="wiki.html#quests:${q.id}">${esc(q.name)}</a></td><td>${[...new Set(q.targets.flatMap(t=>t.mobs))].map(id=>esc(mobs.get(id)?.name||id)).join('、')}</td><td>${q.reward.map(r=>itemLink(r.id,r.n)).join(q.choice?' 或 ':'、')}</td></tr>`));
 },
 // BOSS
 bosses(){
  const f=s=>s>=3600?(+(s/3600).toFixed(1))+' 小時':Math.round(s/60)+' 分';
  const list=W.monsters.filter(m=>m.boss&&!m.quest).sort((a,b)=>a.level-b.level);
  return table(['BOSS','等級','HP','地點','重生'],list.map(m=>{const p=m.places[0];return `<tr><td><a href="wiki.html#monsters:${m.id}">${esc(m.name)}</a></td><td class="num">${m.level}</td><td class="num">${num(m.hp)}</td><td>${[...new Set(m.places.map(p=>maps.get(p.map)?.name||p.map))].map(esc).join('、')}</td><td class="num">${p?.respawn?(p.respawn[0]===p.respawn[1]?f(p.respawn[0]):f(p.respawn[0])+'～'+f(p.respawn[1])):'—'}</td></tr>`;}));
 },
 // 機率
 dollRates(){return table(['稀有度','合計機率','數量'],W.dollRates.map(r=>`<tr><td class="g-${r.tier}">${r.tier}</td><td class="num">${r.rate}%</td><td class="num">${r.count}</td></tr>`));},
 wuhunRates(){return table(['品階','合計機率','數量'],W.wuhunRates.map(r=>`<tr><td class="t-${r.tier}">${r.tier}</td><td class="num">${r.rate}%</td><td class="num">${r.count}</td></tr>`));},
 cardRates(){return table(['稀有度','合計機率','張數'],Object.entries(W.cardRates).map(([g,r])=>`<tr><td class="g-${g}">${g}</td><td class="num">${r.rate}%</td><td class="num">${r.count}</td></tr>`));},
 globalDrops(){return W.globalDrops.map(d=>`${itemLink(d.id)}（${d.p}%）`).join('、');},
 counts(){
  const n=[['道具',W.items.length],['怪物',W.monsters.length],['BOSS',W.monsters.filter(m=>m.boss).length],['地圖',W.maps.length],['技能',W.skills.length],['製作配方',W.recipes.length],['變身卡',W.cards.length],['魔法娃娃',W.dolls.length]];
  return n.map(([k,v])=>`<div class="stat"><b>${num(v)}</b><span>${k}</span></div>`).join('');
 }
};
for(const el of document.querySelectorAll('[data-gen]')){const f=GEN[el.dataset.gen];if(f)el.innerHTML=f();}
for(const el of document.querySelectorAll('[data-built]'))el.textContent=W.built;
if(location.hash.length>1){const t=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(t)t.scrollIntoView();}
// 目錄高亮
const links=[...document.querySelectorAll('.toc a')];
if(links.length&&'IntersectionObserver' in window){
 const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id));}},{rootMargin:'-80px 0px -70% 0px'});
 document.querySelectorAll('.article h2[id]').forEach(h=>io.observe(h));
}
})();
