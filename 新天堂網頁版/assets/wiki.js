// 小百科：資料來自 data/wiki-data.js（tools/build-data.cjs 產生，只含目前拿得到的東西）
(()=>{
const W=window.WIKI;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('zh-TW');
const pct=p=>p>=100?'必掉':p>=1?(+p.toFixed(2))+'%':p>=0.01?(+p.toFixed(3))+'%':(+p.toFixed(5))+'%';
const range=(a,b)=>a===b?num(a):num(a)+'～'+num(b);
const XP=W.rates.RateXp||1,XPW=W.rates.WeekendRateXp||XP;

const items=new Map(W.items.map(i=>[i.id,i]));
const mobs=new Map(W.monsters.map(m=>[m.id,m]));
const maps=new Map(W.maps.map(m=>[m.id,m]));
const recipes=new Map(W.recipes.map(r=>[r.id,r]));
const quests=new Map(W.quests.map(q=>[q.id,q]));
const skills=new Map(W.skills.map(s=>[s.id,s]));
const dolls=new Map(W.dolls.map(d=>[d.id,d]));
const teleByMap=new Map();for(const t of W.teleports)if(!teleByMap.has(t.map))teleByMap.set(t.map,t);
const mapName=id=>id==='all'?'全部地圖':maps.get(id)?.name||W.npcs[Object.keys(W.npcs).find(k=>W.npcs[k].places.some(p=>p.map===id))]?.places.find(p=>p.map===id)?.mapName||('地圖 '+id);
const npcName=id=>W.npcs[id]?.name||('NPC '+id);

const TYPE={dagger:'匕首',sword:'單手劍',tohandsword:'雙手劍',claw:'鋼爪',edoryu:'雙刀',spear:'長矛',singlespear:'單手矛',staff:'魔杖',tohandstaff:'雙手魔杖',blunt:'鈍器',bow:'弓',singlebow:'單手弓',kiringku:'奇古獸',chainsword:'鎖鏈劍',parasol:'油傘',
 helm:'頭盔',cloak:'斗篷',tshirt:'內衣',armor:'盔甲',glove:'手套',boots:'長靴',shield:'盾牌',necklace:'項鍊',ring:'戒指',belt:'腰帶',guarder:'臂甲',earring:'耳環',runeword_left:'符文',talisman:'符石',talisman2:'符石',pants:'褲子',
 other:'其他',scroll:'卷軸',gem:'寶石／魔石',treasure_box:'寶箱',light:'照明',wand:'魔杖道具',potion:'藥水',food:'食物',totem:'圖騰',firecracker:'煙火',material:'材料',spellbook:'技能書',questitem:'任務道具',arrow:'箭',petitem:'寵物道具'};
const KIND={weapon:'武器',armor:'防具',etcitem:'道具'};
const STAT={str:'力量',dex:'敏捷',con:'體質',int:'智力',wis:'精神',cha:'魅力',hp:'HP',mp:'MP'};
const RULE={safenchant:'安定值',m_def:'魔防',damage_reduction:'傷害減免',haste_item:'加速效果',range:'射程',hitmodifier:'命中',dmgmodifier:'額外傷害'};
const CLASSES=['王族','騎士','法師','妖精','黑妖','龍騎士','幻術師','戰士','油傘女'];
const CAT={weapon:'武器',armor:'防具',acc:'飾品',rune:'符石',arrow:'箭矢',potion:'藥品',scroll:'卷軸',gem:'魔石',material:'材料',item:'道具',wuhun:'武魂',box:'寶箱',pet:'寵物',doll:'娃娃'};
const SRC={drop:'怪物掉落',map:'地圖掉落',shop:'商店',craft:'製作',box:'寶箱',quest:'任務',starter:'新手背包',other:'其他'};
const respawnText=r=>{if(!r)return '任務期間';const [a,b]=r;const f=s=>s>=3600?(+(s/3600).toFixed(1))+' 小時':s>=60?Math.round(s/60)+' 分':s+' 秒';return a===b?f(a):f(a)+'～'+f(b);};

const icon=(src,big)=>src?`<img src="${esc(src)}" alt="" loading="lazy">`:`<span style="color:var(--dim);font-size:${big?22:16}px">◆</span>`;
const chip=(hash,label,extra='',img='')=>`<a class="chip" href="#${hash}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:''}${esc(label)}${extra?` <em>${esc(extra)}</em>`:''}</a>`;
const itemChip=(id,extra)=>{const i=items.get(id);return i?chip('items:'+id,i.name,extra,i.icon):`<span class="chip">#${id}${extra?' <em>'+esc(extra)+'</em>':''}</span>`;};
const mobChip=(id,extra)=>{const m=mobs.get(id);return m?chip('monsters:'+id,m.name+' Lv'+m.level,extra):'';};
const mapChip=(id,extra)=>maps.has(id)?chip('maps:'+id,mapName(id),extra):`<span class="chip">${esc(mapName(id))}${extra?' <em>'+esc(extra)+'</em>':''}</span>`;
const kv=pairs=>'<dl class="kv">'+pairs.filter(p=>p&&p[1]!==undefined&&p[1]!==''&&p[1]!==null).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')+'</dl>';
const section=(title,html)=>html?`<h3>${esc(title)}</h3>${html}`:'';
const chips=list=>list.length?'<div class="chips">'+list.join('')+'</div>':'';

// ---------- 分頁定義 ----------
const itemTypeOptions=kind=>[...new Set(W.items.filter(i=>!kind||i.kind===kind).map(i=>i.type))].sort((a,b)=>(TYPE[a]||a).localeCompare(TYPE[b]||b,'zh-Hant'));
const TABS=[
 {id:'classes',name:'職業',count:Object.keys(W.classes).length,
  filters:()=>'',rows:f=>Object.keys(W.classes).filter(c=>match(f.q,c+W.classes[c].intro)),
  row:c=>[CLASS_ART[c],c,W.classes[c].intro,'classes:'+c,'',true],
  detail:classDetail},
 {id:'items',name:'道具',count:W.items.length,
  filters:()=>`<select data-f="kind"><option value="">全部種類</option>${Object.entries(KIND).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
   <select data-f="type"><option value="">全部類型</option>${itemTypeOptions().map(t=>`<option value="${t}">${esc(TYPE[t]||t)}</option>`).join('')}</select>
   <select data-f="cls"><option value="">全部職業</option>${CLASSES.map(c=>`<option>${c}</option>`).join('')}</select>
   <select data-f="src"><option value="">全部取得方式</option>${Object.entries(SRC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>`,
  rows:f=>W.items.filter(i=>(!f.kind||i.kind===f.kind)&&(!f.type||i.type===f.type)&&(!f.cls||!(i.eq||i.cls)||(i.eq||i.cls).includes(f.cls))&&(!f.src||i.src[f.src])&&match(f.q,i.name)),
  row:i=>[i.icon,i.name,[KIND[i.kind],TYPE[i.type]||i.type,i.dmg?'傷害 '+i.dmg.join('/'):'',i.kind==='armor'&&i.ac?'防禦 '+(-i.ac):''].filter(Boolean).join(' · '),'items:'+i.id],
  detail:itemDetail},
 {id:'monsters',name:'怪物',count:W.monsters.length,
  filters:()=>`<label>等級 <input data-f="lv1" type="number" min="1" max="200" placeholder="最低" style="width:80px"> ～ <input data-f="lv2" type="number" min="1" max="200" placeholder="最高" style="width:80px"></label>
   <select data-f="map"><option value="">全部地圖</option>${W.maps.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>
   <label><input type="checkbox" data-f="boss"> 只看 BOSS</label>`,
  rows:f=>W.monsters.filter(m=>(!f.lv1||m.level>=+f.lv1)&&(!f.lv2||m.level<=+f.lv2)&&(!f.boss||m.boss)&&(!f.map||m.places.some(p=>p.map===+f.map))&&match(f.q,m.name)),
  row:m=>['',m.name,`Lv ${m.level} · HP ${num(m.hp)} · 經驗 ${num(m.exp*XP)}${m.boss?' · BOSS':''}${m.quest?' · 任務怪':''}`,'monsters:'+m.id,m.boss?'👑':m.quest?'❗':'🐾'],
  detail:mobDetail},
 {id:'bosses',name:'BOSS',count:W.monsters.filter(m=>m.boss).length,
  filters:()=>'',rows:f=>W.monsters.filter(m=>m.boss&&match(f.q,m.name+m.places.map(p=>mapName(p.map)).join())),
  row:m=>['',m.name,`Lv ${m.level} · ${[...new Set(m.places.map(p=>mapName(p.map)))].join('、')} · 重生 ${respawnText(m.places[0]?.respawn)}`,'monsters:'+m.id,'👑'],
  detail:mobDetail},
 {id:'maps',name:'地圖',count:W.maps.length,
  filters:()=>'',rows:f=>W.maps.filter(m=>match(f.q,m.name)).sort((a,b)=>(a.lv?.[0]??999)-(b.lv?.[0]??999)),
  row:m=>['',m.name,`${m.lv?'怪物 Lv '+m.lv[0]+'～'+m.lv[1]:'只有任務怪'} · ${Object.keys(m.mobs).length} 種${m.boss.length?' · BOSS '+m.boss.length:''}`,'maps:'+m.id,'🗺'],
  detail:mapDetail},
 {id:'hunt',name:'狩獵場傳送',count:W.teleports.length,
  filters:()=>`<select data-f="cat"><option value="">全部分類</option><option value="village">村莊</option><option value="field">外圍</option><option value="island">島嶼</option><option value="tower">高塔</option><option value="dungeon">地監</option></select>`,
  rows:f=>W.teleports.filter(t=>(!f.cat||t.cat===f.cat)&&match(f.q,t.name+t.group+t.mobs.map(m=>m.name).join())),
  row:t=>['',t.name,`${{village:'村莊',field:'外圍',island:'島嶼',tower:'高塔',dungeon:'地監'}[t.cat]||''}${t.group&&t.group!==t.name?' · '+t.group:''} · ${num(t.price)} 金幣${t.mobs.length?' · 怪物 Lv '+Math.min(...t.mobs.map(m=>m.level))+'～'+Math.max(...t.mobs.map(m=>m.level)):''}`,'hunt:'+t.id,'🌀'],
  detail:huntDetail},
 {id:'skills',name:'技能',count:W.skills.length,
  filters:()=>`<select data-f="cls"><option value="">全部職業</option>${CLASSES.map(c=>`<option>${c}</option>`).join('')}</select>`,
  rows:f=>W.skills.filter(s=>(!f.cls||s.learn[f.cls])&&match(f.q,s.name)).sort((a,b)=>f.cls?a.learn[f.cls].lv-b.learn[f.cls].lv||a.id-b.id:a.id-b.id),
  row:s=>[s.icon,s.name,Object.entries(s.learn).map(([c,l])=>c+' '+l.lv).join(' · '),'skills:'+s.id],
  detail:skillDetail},
 {id:'craft',name:'製作',count:W.recipes.length,
  filters:()=>`<select data-f="cat"><option value="">全部分類</option>${[...new Set(W.recipes.map(r=>r.elf?'elf':r.cat))].map(c=>`<option value="${c}">${c==='elf'?'精靈製作':CAT[c]||c}</option>`).join('')}</select>`,
  rows:f=>W.recipes.filter(r=>(!f.cat||(f.cat==='elf'?r.elf:!r.elf&&r.cat===f.cat))&&match(f.q,(items.get(r.out)?.name||'')+r.mats.map(m=>items.get(m.id)?.name).join())),
  row:r=>[items.get(r.out)?.icon,(r.outEnchant?'+'+r.outEnchant+' ':'')+(items.get(r.out)?.name||r.out)+(r.n>1?' ×'+r.n:''),`成功率 ${r.rate}%${r.level?' · Lv '+r.level:''}${r.cls?' · 限'+r.cls:''} · ${r.mats.length} 種材料`,'craft:'+r.id],
  detail:craftDetail},
 {id:'shops',name:'商店',count:W.shops.length,
  filters:()=>'',rows:f=>W.shops.filter(s=>match(f.q,s.name+s.places.map(p=>mapName(p.map)).join()+s.items.map(i=>items.get(i.id)?.name).join())),
  row:s=>['',s.name,`${[...new Set(s.places.map(p=>mapName(p.map)))].join('、')} · ${new Set(s.items.map(i=>i.id)).size} 種商品`,'shops:'+s.npc,'🛒'],
  detail:shopDetail},
 {id:'quests',name:'等級任務',count:W.quests.length,
  filters:()=>`<select data-f="cls"><option value="">全部職業</option>${CLASSES.map(c=>`<option>${c}</option>`).join('')}</select>`,
  rows:f=>W.quests.filter(q=>(!f.cls||q.roles.includes(f.cls))&&match(f.q,q.name)).sort((a,b)=>a.roles[0].localeCompare(b.roles[0],'zh-Hant')||a.level-b.level),
  row:q=>['',q.name,`${q.roles.join('、')} · Lv ${q.level}`,'quests:'+q.id,'📜'],
  detail:questDetail},
 {id:'cards',name:'變身卡',count:W.cards.length,
  filters:()=>`<select data-f="g"><option value="">全部稀有度</option>${Object.keys(W.cardRates).map(g=>`<option>${g}</option>`).join('')}</select>`,
  rows:f=>W.cards.filter(c=>(!f.g||c.g===f.g)&&match(f.q,c.n+c.fx.join())).sort((a,b)=>b.gi-a.gi||a.lv-b.lv),
  row:c=>[c.icon,c.n,`<span class="g-${c.g}">${c.g}</span> · ${c.fx.slice(0,2).join('、')}`,'cards:'+encodeURIComponent(c.n),'',true],
  detail:cardDetail},
 {id:'dolls',name:'魔法娃娃',count:W.dolls.length,
  filters:()=>`<select data-f="tier"><option value="">全部稀有度</option>${['一般','高級','稀有','英雄','傳說','神話','超越'].map(g=>`<option>${g}</option>`).join('')}</select>`,
  rows:f=>W.dolls.filter(d=>(!f.tier||d.tier===f.tier)&&match(f.q,d.name+d.fx.join())),
  row:d=>[d.img,d.name,`<span class="g-${d.tier}">${d.tier}</span>${d.stage>1?' · 第 '+d.stage+' 階':''} · ${d.fx.slice(0,2).join('、')}`,'dolls:'+d.id,'',true],
  detail:dollDetail},
 {id:'wuhun',name:'武魂',count:W.wuhun.length,
  filters:()=>'',rows:f=>W.wuhun.filter(w=>match(f.q,w.name+w.fx.join())),
  row:w=>['',w.name,`<span class="t-${w.tier}">${w.tier}</span> · ${w.fx.join('、')}`,'wuhun:'+w.id,'👻'],
  detail:wuhunDetail},
 {id:'enchant',name:'BOSS 附魔石',count:W.enchants.filter(e=>items.has(e.id)).length,
  filters:()=>'',rows:f=>W.enchants.filter(e=>items.has(e.id)&&match(f.q,e.stone+e.boss)),
  row:e=>[items.get(e.id)?.icon,e.stone,e.fx,'enchant:'+e.id],
  detail:enchantDetail},
 {id:'exp',name:'經驗表',count:W.expTable.length,filters:()=>'',rows:()=>[],custom:expTable}
];
const tabById=new Map(TABS.map(t=>[t.id,t]));
function match(q,text){if(!q)return true;q=q.trim().toLowerCase();return String(text).toLowerCase().includes(q);}

// ---------- 職業 ----------
const CLASS_ART={騎士:'img/site/class-knight.jpg',法師:'img/site/class-mage.jpg',王族:'img/site/class-royal.jpg',妖精:'img/site/class-elf.jpg',黑妖:'img/site/class-darkelf.jpg',龍騎士:'img/site/class-dragonknight.jpg',幻術師:'img/site/class-illusionist.jpg',戰士:'img/site/class-warrior.jpg',油傘女:'img/site/class-oilparasol.jpg'};
const SRC_SHORT={drop:'打怪',map:'地圖掉落',shop:'商店',craft:'製作',box:'寶箱',quest:'任務',starter:'新手',other:'扭蛋／每日'};
const srcTags=i=>Object.keys(i.src||{}).filter(k=>SRC_SHORT[k]).map(k=>SRC_SHORT[k]);
const canUse=(i,c)=>!(i.eq||i.cls)||(i.eq||i.cls).includes(c);
const STAT_ORDER=[['str','力量'],['dex','敏捷'],['con','體質'],['int','智力'],['wis','精神'],['cha','魅力']];
function howToGet(itemId){
 const i=items.get(itemId);if(!i)return '';const s=i.src,out=[];
 if(s.starter)out.push('新手背包');
 if(s.quest)out.push('任務：'+s.quest.map(q=>`<a href="#quests:${q}">${esc(quests.get(q)?.name||q)}</a>`).join('、'));
 if(s.shop)out.push('商店 '+num(s.shop[0][1])+' 金幣');
 if(s.craft)out.push(`<a href="#craft:${s.craft[0]}">製作</a>`);
 if(s.drop)out.push('打怪：'+s.drop.slice(0,3).map(([m,p])=>`<a href="#monsters:${m}">${esc(mobs.get(m)?.name||m)}</a> ${pct(p)}`).join('、')+(s.drop.length>3||s.dropMore?' 等':''));
 if(s.map)out.push('地圖掉落');
 if(s.box)out.push('開寶箱：'+s.box.slice(0,2).map(([b])=>`<a href="#items:${b}">${esc(items.get(b)?.name||b)}</a>`).join('、'));
 if(s.other)out.push(s.other.map(esc).join('、'));
 return out.join('；');
}
function gearGroups(list){
 const groups=new Map();for(const i of list){const k=TYPE[i.type]||i.type;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);}
 return [...groups].map(([k,arr])=>`<h4 style="margin:12px 0 6px;color:var(--muted);font-size:14px">${esc(k)}（${arr.length}）</h4>`+chips(arr.map(i=>itemChip(i.id,srcTags(i).join('・'))))).join('');
}
function classDetail(name){
 const c=W.classes[name];if(!c)return null;
 const kit=[...(W.starterKit.common||[]).filter(([id])=>!((W.starterNoShield||[]).includes(name)&&id===20232)),...(W.starterKit[name]||[])];
 const qs=W.quests.filter(q=>q.roles.includes(name)).sort((a,b)=>a.level-b.level);
 const sk=W.skills.filter(s=>s.learn[name]).sort((a,b)=>a.learn[name].lv-b.learn[name].lv||a.id-b.id);
 const weapons=W.items.filter(i=>i.kind==='weapon'&&canUse(i,name));
 const armors=W.items.filter(i=>i.kind==='armor'&&canUse(i,name));
 const exclusive=armors.filter(i=>i.eq&&i.eq.length<=3);
 let html=`<div class="dhead"><div class="ic" style="width:96px;height:126px;flex-basis:96px;overflow:hidden"><img src="${CLASS_ART[name]||''}" alt="" style="max-width:none;max-height:none;width:100%;height:100%;object-fit:cover;object-position:top"></div><div><h2>${esc(name)}</h2>${c.gender===1?'<span class="tag purple">限女性</span> ':''}<p style="margin:6px 0 0">${esc(c.intro)}</p></div></div>`;
 html+=kv([...STAT_ORDER.map(([k,l])=>[l+'（基礎）',c.base[k]]),['擲骰額外點數',c.points],['初始 HP',c.hp]]);
 html+=`<p class="small muted">建立角色時能力值是擲骰產生的，六項總和 75、單項最高 20。</p>`;
 html+=section('新手背包',chips(kit.map(([id,n])=>itemChip(id,n>1?'×'+num(n):''))));
 html+=section('等級任務',qs.length?chips(qs.map(q=>chip('quests:'+q.id,'Lv'+q.level+' '+q.name,q.reward.map(r=>items.get(r.id)?.name).filter(Boolean).join(q.choice?' 或 ':'、')))):'<p class="muted small">目前沒有這個職業的等級任務。</p>');
 html+=section('技能（'+sk.length+'）',`<div class="tbl-wrap"><table><thead><tr><th class="num">等級</th><th>技能</th><th class="num">MP</th><th>取得方式</th></tr></thead><tbody>${sk.map(s=>{const l=s.learn[name];return `<tr><td class="num">${l.lv}</td><td><a href="#skills:${s.id}">${s.icon?`<img src="${esc(s.icon)}" alt="" width="18" height="18" style="vertical-align:-4px;margin-right:4px">`:''}${esc(s.name)}</a></td><td class="num">${s.mp||0}</td><td class="small">${l.how==='auto'?'等級到自動學會':`<a href="#items:${l.book}">${esc(items.get(l.book)?.name||l.book)}</a>${l.element?'（'+esc(l.element)+'屬性）':''}<br>${howToGet(l.book)}`}</td></tr>`;}).join('')}</tbody></table></div>`);
 html+=section('可用武器（'+weapons.length+'）',weapons.length?gearGroups(weapons):'<p class="muted small">目前沒有可取得的武器。</p>');
 html+=section('職業專屬防具（'+exclusive.length+'）',exclusive.length?gearGroups(exclusive):'<p class="muted small">沒有只限少數職業的防具。</p>');
 html+=`<p class="small">這個職業可穿的防具共 ${armors.length} 件（含所有職業共用的）。<a href="#items?kind=armor&cls=${encodeURIComponent(name)}">在道具清單查看全部 →</a>　<a href="#items?kind=weapon&cls=${encodeURIComponent(name)}">武器清單 →</a></p>`;
 html+=`<p class="small muted">只列出目前拿得到的裝備；標籤是取得方式（打怪、商店、製作、寶箱、任務、扭蛋／每日等），點進去看詳細來源。</p>`;
 return html;
}
// ---------- 詳細頁 ----------
function itemDetail(id){
 const i=items.get(+id);if(!i)return null;const s=i.src;
 const stats=[['種類',KIND[i.kind]+' · '+(TYPE[i.type]||i.type)],i.dmg&&['傷害（小／大）',i.dmg.join(' / ')],i.two&&['雙手','是'],i.kind==='armor'&&['防禦',-(i.ac||0)],i.w&&['重量',i.w],
  ...Object.entries(i.r||{}).map(([k,v])=>[RULE[k]||k,v]),...Object.entries(i.b||{}).map(([k,v])=>[STAT[k]||k,(v>0?'+':'')+v])];
 let html=`<div class="dhead"><div class="ic">${icon(i.icon,true)}</div><div><h2>${esc(i.name)}</h2><div class="muted small">#${i.id}${i.cls?' · 限 '+i.cls.join('、'):''}</div></div></div>`+kv(stats);
 html+=section('怪物掉落',s.drop?chips(s.drop.map(([m,p])=>mobChip(m,pct(p))))+(s.dropMore?`<p class="small muted">另有 ${s.dropMore} 種怪物會掉，機率較低。</p>`:''):'');
 html+=section('地圖掉落',s.map?chips(s.map.map(([m,p])=>m==='all'?`<span class="chip">全部地圖的怪物 <em>${pct(p)}</em></span>`:mapChip(m,pct(p)))):'');
 html+=section('商店購買',s.shop?chips(s.shop.map(([n,price])=>chip('shops:'+n,npcName(n),num(price)+' 金幣'))):'');
 html+=section('製作',s.craft?chips(s.craft.map(r=>chip('craft:'+r,'配方 · 成功率 '+(recipes.get(r)?.rate??'?')+'%'))):'');
 html+=section('開寶箱',s.box?chips(s.box.map(([b,p])=>itemChip(b,p>=100?'固定':pct(p)))):'');
 html+=section('任務',s.quest?chips(s.quest.map(q=>chip('quests:'+q,quests.get(q)?.name||q))):'');
 html+=section('新手背包',s.starter?`<p>${s.starter.map(r=>r==='common'?'所有職業':r).join('、')}建立角色時就有。</p>`:'');
 html+=section('其他',s.other?`<p>${s.other.map(esc).join('、')}</p>`:'');
 html+=section('可用來製作',i.use?chips(i.use.map(r=>{const o=items.get(recipes.get(r)?.out);return o?chip('craft:'+r,o.name,'',o.icon):'';})):'');
 return html;
}
function mobDetail(id){
 const m=mobs.get(+id);if(!m)return null;
 let html=`<h2>${esc(m.name)}</h2><div class="muted small">#${m.id}${m.boss?' · <span class="tag red">BOSS</span>':''}${m.quest?' · <span class="tag gold">任務怪</span>':''}${m.aggressive?' · <span class="tag red">主動攻擊</span>':''}</div>`;
 html+=kv([['等級',m.level],['HP',num(m.hp)],['MP',num(m.mp)],['防禦',-m.ac],['魔防',m.mr],['經驗',num(m.exp*XP)+(XPW!==XP?'（週末 '+num(Math.floor(m.exp*XPW))+'）':'')],['正義值',m.lawful<0?'+'+(-m.lawful):'0'],['攻擊距離',m.ranged>1?m.ranged+' 格（遠程）':'近戰']]);
 html+=section('出現地點',chips(m.places.map(p=>mapChip(p.map,(p.zone&&p.zone!=='任務'?p.zone+' · ':'')+(p.quest?'任務期間 ':'')+'×'+p.count+(m.boss&&p.respawn?' · 重生 '+respawnText(p.respawn):'')))));
 const q=W.quests.filter(q=>q.targets.some(t=>t.mobs.includes(m.id)));
 html+=section('相關等級任務',q.length?chips(q.map(x=>chip('quests:'+x.id,x.name,x.roles.join('、')+' Lv'+x.level))):'');
 html+=section('掉落物',m.drops.length?chips(m.drops.map(d=>itemChip(d.id,(d.max>1?range(d.min,d.max)+' 個 · ':'')+(d.kill?'擊殺獎勵':pct(d.p))))):'<p class="muted">沒有掉落物。</p>');
 return html;
}
function mapDetail(id){
 const m=maps.get(+id);if(!m)return null;
 const list=Object.entries(m.mobs).map(([id,n])=>[mobs.get(+id),n]).filter(x=>x[0]).sort((a,b)=>a[0].level-b[0].level);
 const t=teleByMap.get(m.id);
 let html=`<h2>${esc(m.name)}</h2><div class="muted small">地圖 ${m.id}</div>`;
 html+=kv([['怪物等級',m.lv?m.lv[0]+'～'+m.lv[1]:'—'],['怪物種類',list.length],['BOSS',m.boss.length||'無'],t&&['狩獵場傳送',num(t.price)+' 金幣'],m.exp&&['經驗加成',m.exp.map(e=>`Lv${e.min}～${e.max} ×${e.x}`).join('、')]]);
 html+=section('BOSS',m.boss.length?chips(m.boss.map(b=>mobChip(b))):'');
 html+=section('怪物',`<div class="tbl-wrap"><table><thead><tr><th>怪物</th><th class="num">等級</th><th class="num">HP</th><th class="num">經驗</th><th class="num">數量</th></tr></thead><tbody>${list.map(([x,n])=>`<tr><td><a href="#monsters:${x.id}">${esc(x.name)}</a>${x.boss?' <span class="tag red">BOSS</span>':''}${x.quest?' <span class="tag gold">任務</span>':''}</td><td class="num">${x.level}</td><td class="num">${num(x.hp)}</td><td class="num">${num(x.exp*XP)}</td><td class="num">${n}</td></tr>`).join('')}</tbody></table></div>`);
 html+=section('這張地圖額外掉落',m.drops.length?chips(m.drops.map(d=>itemChip(d.id,(d.max>1?range(d.min,d.max)+' 個 · ':'')+pct(d.p)+(d.fallback?' · 怪物本身沒掉金幣時才掉':'')))):'');
 html+=`<p class="small muted">全部地圖的怪物另外都會掉：${W.globalDrops.map(d=>`<a href="#items:${d.id}">${esc(items.get(d.id)?.name)}</a>（${pct(d.p)}）`).join('、')}。</p>`;
 return html;
}
function huntDetail(id){
 const t=W.teleports.find(x=>x.id===+id);if(!t)return null;
 let html=`<h2>${esc(t.name)}</h2><div class="muted small">${esc(t.group||'')}</div>`;
 html+=kv([['傳送費用',num(t.price)+' 金幣'],['地圖',maps.has(t.map)?`<a href="#maps:${t.map}">${esc(mapName(t.map))}</a>`:esc(mapName(t.map))]]);
 html+=section('怪物',t.mobs.length?chips(t.mobs.map(m=>mobChip(m.id,'×'+m.count))):'<p class="muted">沒有怪物（村莊或休息點）。</p>');
 html+=section('掉落物（名稱）',t.drops.length?'<p class="small">'+t.drops.map(esc).join('、')+'</p>':'');
 return html;
}
function skillDetail(id){
 const s=skills.get(+id);if(!s)return null;
 let html=`<div class="dhead"><div class="ic">${icon(s.icon,true)}</div><div><h2>${esc(s.name)}</h2><div class="muted small">技能 #${s.id}</div></div></div>`;
 html+=kv([['消耗 MP',s.mp||0],s.hp&&['消耗 HP',s.hp],s.mat&&['材料',`<a href="#items:${s.mat.id}">${esc(items.get(s.mat.id)?.name||s.mat.id)}</a> ×${s.mat.n}`],s.dur&&['持續',s.dur>=60?Math.round(s.dur/60)+' 分鐘':s.dur+' 秒'],s.range>0&&['距離',s.range+' 格'],s.target==='attack'&&s.dmg&&['傷害骰',s.dmg[0]+'～'+s.dmg[1]]]);
 html+=section('學習方式',`<div class="tbl-wrap"><table><thead><tr><th>職業</th><th class="num">等級</th><th>方式</th></tr></thead><tbody>${Object.entries(s.learn).map(([c,l])=>`<tr><td>${c}</td><td class="num">${l.lv}</td><td>${l.how==='auto'?'等級到自動學會':`閱讀 <a href="#items:${l.book}">${esc(items.get(l.book)?.name||l.book)}</a>${l.element?'（'+esc(l.element)+'屬性）':''}`}</td></tr>`).join('')}</tbody></table></div>`);
 const books=[...new Set(Object.values(s.learn).filter(l=>l.book).map(l=>l.book))];
 for(const b of books){const it=items.get(b);if(it?.src.drop)html+=section(it.name+' 掉落怪物',chips(it.src.drop.slice(0,12).map(([m,p])=>mobChip(m,pct(p)))));if(it?.src.shop)html+=section(it.name+' 商店',chips(it.src.shop.map(([n,p])=>chip('shops:'+n,npcName(n),num(p)+' 金幣'))));}
 return html;
}
function craftDetail(id){
 const r=recipes.get(+id);if(!r)return null;const o=items.get(r.out);
 let html=`<div class="dhead"><div class="ic">${icon(o?.icon,true)}</div><div><h2>${r.outEnchant?'+'+r.outEnchant+' ':''}${esc(o?.name||r.out)}${r.n>1?' ×'+r.n:''}</h2><div class="muted small">${r.elf?'精靈製作 · ':''}${CAT[r.cat]||r.cat}</div></div></div>`;
 html+=kv([['成功率',r.rate+'%'],r.level&&['需要等級',r.level],r.cls&&['限定職業',r.cls],r.hp&&['消耗 HP',r.hp],r.mp&&['消耗 MP',r.mp]]);
 html+=section('材料',chips(r.mats.map(m=>itemChip(m.id,(m.e?'+'+m.e+' ':'')+'×'+num(m.n)))));
 html+=section('成功另得',r.bonus?chips([itemChip(r.bonus.id,'×'+r.bonus.n)]):'');
 html+=section('失敗退回',r.residue?chips([itemChip(r.residue.id,'×'+r.residue.n)]):'');
 html+=`<p class="small muted">在遊戲「目錄 → 製作」隨時隨地都能做，不用找 NPC。</p><p><a class="lnk" href="#items:${r.out}">查看成品詳細 →</a></p>`;
 return html;
}
function shopDetail(id){
 const s=W.shops.find(x=>x.npc===+id);if(!s)return null;
 const seen=new Map();for(const it of s.items){const u=it.price/(it.pack||1);if(!seen.has(it.id)||u<seen.get(it.id).u)seen.set(it.id,{...it,u});}
 let html=`<h2>${esc(s.name)}</h2>`+section('位置',chips(s.places.map(p=>mapChip(p.map,p.x?p.x+','+p.y:''))));
 html+=section('商品',`<div class="tbl-wrap"><table><thead><tr><th>商品</th><th class="num">價格（金幣）</th></tr></thead><tbody>${[...seen.values()].map(it=>`<tr><td><a href="#items:${it.id}">${esc((it.enchant?'+'+it.enchant+' ':'')+(items.get(it.id)?.name||it.id))}</a>${it.pack>1?' ×'+it.pack:''}</td><td class="num">${num(it.price)}</td></tr>`).join('')}</tbody></table></div>`);
 return html;
}
function questDetail(id){
 const q=quests.get(+id);if(!q)return null;
 let html=`<h2>${esc(q.name)}</h2><div class="muted small">${q.roles.join('、')} · 等級 ${q.level} 自動接取</div>`;
 html+=`<ol class="steps">`+q.targets.map(t=>`<li>打倒 ${t.mobs.map(m=>`<a href="#monsters:${m}">${esc(mobs.get(m)?.name||m)}</a>`).join(' 或 ')}，收集 <a href="#items:${t.item}">${esc(items.get(t.item)?.name||t.item)}</a> ×${t.count}${t.p?'（掉率 '+pct(t.p)+'）':''}</li>`).join('')+`<li>道具湊齊會自動完成任務${q.choice?'，到「目錄 → 任務」按「領取」選一樣獎勵':''}。</li></ol>`;
 html+=section('任務怪出現地點',q.spawns.length?chips(q.spawns.map(s=>mapChip(s.map,(mobs.get(s.npc)?.name||'')+' ×'+s.count))):'<p class="small muted">任務怪本來就在地圖上，點上面的怪物名稱看出現地點。</p>');
 html+=section(q.choice?'獎勵（二選一）':'獎勵',chips(q.reward.map(r=>itemChip(r.id,'×'+r.n))));
 if(q.note)html+=`<p class="small muted">${esc(q.note)}</p>`;
 return html;
}
function cardDetail(n){
 const c=W.cards.find(x=>x.n===decodeURIComponent(n));if(!c)return null;
 let html=`<div class="dhead"><div class="ic">${icon(c.icon,true)}</div><div><h2>${esc(c.n)}</h2><div class="small"><span class="g-${c.g}">${c.g}</span>${c.lv?' · 變身等級 '+c.lv:''}</div></div></div>`;
 html+=section('能力',`<ul class="fx">${[...c.fx,...c.pb].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`);
 html+=kv([['可攻擊',c.atk?'可以':'不行'],['可施法',c.cast?'可以':'不行']]);
 const r=W.cardRates[c.g];html+=`<p class="small muted">取得：鑽石百貨公司「造型一番賞」免費抽。${r?`${c.g}卡合計機率 ${r.rate}%（${r.count} 張平分）。`:''}</p>`;
 return html;
}
function dollDetail(id){
 const d=dolls.get(+id);if(!d)return null;
 let html=`<div class="dhead"><div class="ic">${icon(d.img,true)}</div><div><h2>${esc(d.name)}</h2><div class="small"><span class="g-${d.tier}">${d.tier}</span>${d.stage>1?' · 第 '+d.stage+' 階':''}</div></div></div>`;
 html+=section('能力',`<ul class="fx">${d.fx.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>無</li>'}</ul>`);
 html+=kv([['召喚時間',Math.round(d.time/60)+' 分鐘'],d.mats.length&&['召喚消耗',d.mats.map(m=>`<a href="#items:${m.id}">${esc(items.get(m.id)?.name||m.id)}</a> ×${m.n}`).join('、')]]);
 const how=[];if(d.gacha)how.push(`魔法娃娃扭蛋機（${d.gacha}，目前免費）`);if(d.prev)how.push(`由 <a href="#dolls:${d.prev}">${esc(dolls.get(d.prev)?.name)}</a> 進化`);
 html+=section('取得方式',`<p>${how.join('；')||'—'}</p>`);
 if(d.next)html+=section('下一階',chips([chip('dolls:'+d.next,dolls.get(d.next)?.name||d.next,'',dolls.get(d.next)?.img)]));
 return html;
}
function wuhunDetail(id){
 const w=W.wuhun.find(x=>x.id===+id);if(!w)return null;
 let html=`<h2>${esc(w.name)}</h2><div class="small"><span class="t-${w.tier}">${w.tier}</span></div>`;
 html+=section('能力（裝備時）',`<ul class="fx">${w.fx.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`);
 const how=[];if(w.gacha)how.push('武魂扭蛋機（目前免費）');if(w.craft)how.push('製作：武魂結晶 ×1000');
 html+=section('取得方式',`<p>${how.join('；')}</p>`);
 return html;
}
function enchantDetail(id){
 const e=W.enchants.find(x=>x.id===+id);if(!e)return null;const it=items.get(e.id);
 let html=`<div class="dhead"><div class="ic">${icon(it?.icon,true)}</div><div><h2>${esc(e.stone)}</h2><div class="muted small">${esc(e.boss)}的靈魂</div></div></div>`;
 html+=section('發動效果',`<p>${esc(e.fx)}</p>`);
 html+=section('等級',`<div class="tbl-wrap"><table><thead><tr><th>等級</th><th class="num">附魔成功率</th><th class="num">攻擊發動率</th></tr></thead><tbody>${e.levels.map(l=>`<tr><td>${esc(l.name)}</td><td class="num">${l.rate}%</td><td class="num">${l.proc}%</td></tr>`).join('')}</tbody></table></div>`);
 if(it?.src.drop)html+=section('掉落',chips(it.src.drop.map(([m,p])=>mobChip(m,pct(p)))));
 html+=`<p class="small muted">附魔是附在武器上：換武器就不發動，裝回來恢復；武器賣掉或丟掉，附魔也一起消失。</p>`;
 return html;
}
function expTable(box){
 const rows=W.expTable.map(([lv,need],i)=>{const next=W.expTable[i+1];return `<tr><td class="num">${lv}</td><td class="num">${num(need)}</td><td class="num">${next?num(next[1]-need):'—'}</td></tr>`;}).join('');
 box.innerHTML=`<p class="small muted">「累積經驗」是到達該等級需要的總經驗。打怪經驗平日 ×${XP}、週末 ×${XPW}（週五 19:00～週一 07:00）。</p><div class="tbl-wrap" style="max-height:70vh"><table><thead><tr><th class="num">等級</th><th class="num">累積經驗</th><th class="num">升下一級還要</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ---------- 畫面 ----------
const tabsEl=$('#tabs'),filtersEl=$('#filters'),listEl=$('#list'),countEl=$('#count'),sheet=$('#sheet'),pane=$('#pane'),moreEl=$('#more');
moreEl.onclick=e=>{if(e.target.closest('button')){limit+=240;render();}};
let current='classes',state={},limit=120;
tabsEl.innerHTML=TABS.map(t=>`<button role="tab" data-tab="${t.id}">${t.name}<small>${t.count}</small></button>`).join('');
tabsEl.onclick=e=>{const b=e.target.closest('button');if(b)location.hash=b.dataset.tab;};
function setTab(id){
 if(current===id&&filtersEl.dataset.tab===id)return;
 current=id;state={};limit=120;const t=tabById.get(id);
 for(const b of tabsEl.children)b.setAttribute('aria-selected',b.dataset.tab===id);
 filtersEl.dataset.tab=id;
 filtersEl.innerHTML=t.custom?'':`<input type="search" data-f="q" placeholder="搜尋${t.name}名稱…" aria-label="搜尋">${t.filters()}<span class="count" id="count"></span>`;
 render();
}
filtersEl.oninput=e=>{const f=e.target.dataset.f;if(!f)return;state[f]=e.target.type==='checkbox'?e.target.checked:e.target.value;limit=120;render();};
function render(){
 const t=tabById.get(current);
 if(t.custom){listEl.className='';moreEl.innerHTML='';t.custom(listEl);return;}
 listEl.className='list';
 const rows=t.rows(state),shown=rows.slice(0,limit);
 $('#count')&&($('#count').textContent='共 '+num(rows.length)+' 筆');
 listEl.innerHTML=shown.length?shown.map(r=>{const [img,title,sub,hash,emoji,big]=t.row(r);return `<a class="row" href="#${hash}"><span class="ic${big?' big':''}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:`<span>${emoji||'◆'}</span>`}</span><span class="t"><b>${esc(title)}</b><span>${sub}</span></span></a>`;}).join(''):'<div class="empty">找不到符合的資料</div>';
 moreEl.innerHTML=rows.length>limit?'<button class="btn more" type="button">顯示更多（還有 '+num(rows.length-limit)+' 筆）</button>':'';
}
function openDetail(tab,id){
 const t=tabById.get(tab);const html=t?.detail?.(id);
 if(!html){sheet.hidden=true;return;}
 pane.innerHTML=`<button class="close" aria-label="關閉" onclick="history.length>1?history.back():(location.hash='${tab}')">×</button>`+html;
 sheet.hidden=false;pane.scrollTop=0;document.title=(pane.querySelector('h2')?.textContent||'')+'｜新天堂網頁版小百科';
}
sheet.addEventListener('click',e=>{if(e.target===sheet)location.hash=current;});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)location.hash=current;});
function route(){
 const h=decodeURIComponent(location.hash.slice(1));const [main,qs]=h.split('?');const [tab,...rest]=main.split(':');const id=rest.join(':');
 const target=tabById.has(tab)?tab:'classes';
 const listTab=id&&target==='monsters'&&current==='bosses'?'bosses':target;
 setTab(listTab);
 if(qs){const params=new URLSearchParams(qs);for(const [k,v] of params){state[k]=v;const el=filtersEl.querySelector(`[data-f="${k}"]`);if(el)el.value=v;}limit=120;render();}
 if(id)openDetail(target,id);else{sheet.hidden=true;document.title='小百科｜新天堂網頁版';}
}addEventListener('hashchange',route);
// 首頁搜尋框帶過來的 ?q=
route();
const q0=new URLSearchParams(location.search).get('q');
if(q0){const inp=filtersEl.querySelector('[data-f=q]');if(inp){inp.value=q0;state.q=q0;render();}}
})();