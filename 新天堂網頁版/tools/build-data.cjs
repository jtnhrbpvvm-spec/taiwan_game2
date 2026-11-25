// 產生攻略／小百科資料：node tools/build-data.cjs [天堂網頁版資料夾]
// 只收「目前遊戲裡拿得到」的東西：地圖上真的有生的怪、有出現的商人、可製作配方（材料也拿得到）、寶箱內容、任務獎勵、扭蛋獎池。
// 輸出 data/wiki-data.js（window.WIKI）並把用到的圖示複製到 img/。
const fs=require('node:fs'),path=require('node:path');
const {load}=require('./load-game.cjs');
const SITE=path.resolve(__dirname,'..');
const GAME=process.argv[2]||path.resolve(SITE,'../../idle-lineage-class/-username-.github.io-/天堂網頁版');
const g=load(GAME);
for(const e of g.errors)if(!/login-video|character-actions/.test(e[0]))throw new Error('遊戲資料載入失敗，停止更新：'+e.join(' '));
const R=c=>g.run(c);

const CATALOG=R('INTERFACE_CATALOG.items');
const byId=new Map(CATALOG.map(i=>[i.id,i]));
const spawns=R('islandMonsterSpawns');
const templates=R('islandMonsterTemplates');
const drops=R('killRewardData.drops');
const rates=R('killRewardData.rates');
const thresholds=R('killRewardData.thresholds');
const dialogs=R('NATIVE_NPC_DIALOGS');
const dungeonMaps=R('NATIVE_DUNGEON_MAPS');
const DB=R('DBGameRules');
const rows=n=>DB.rows(n);
const removed=R('REMOVED_ITEM_IDS'),dropRemoved=R('DROP_ONLY_REMOVED_IDS');
const skillData=R('playerSkillData');
const skillIcons=new Map(R('INTERFACE_CATALOG.skills').map(s=>[s.id,s]));
const QUESTS=R('LEVEL_QUESTS');
const routes=R('PORTABLE_TELEPORT_ROUTES');
const classes=R('CreationRules.classes');
const dolls=R('gameCatalogData.dolls');
const dollTier=R('dollTier');
const DollEvolution=R('DollEvolution');
const DOLL_GACHA=R('DOLL_GACHA'),WUHUN_GACHA=R('WUHUN_GACHA');
const wuhunData=R('wuhunData');
const bossEnchantData=R('bossEnchantData');
const cardBook=R('TransformCards.book');
const gradeWeights=R('TransformCards.gradeWeights');
const TowerScrolls=R('TowerScrolls');
const setGlobal=(k,v)=>{g.ctx[k]=v;};

const nameOf=id=>byId.get(id)?.name||('#'+id);
const usable=R('ITEM_USE_RULES.definitions');
const available=id=>{const it=byId.get(id);return !!it&&!removed.has(id)&&!!usable[it.kind+':'+id];};
const blocked=id=>id===39288||removed.has(id)||dropRemoved.has(id)||/娃娃/.test(byId.get(id)?.name||'');

// ---------- 地圖 ----------
const BASE_MAPS={0:'說話之島',4:'亞丁大陸'};
const mapName=id=>BASE_MAPS[id]||dungeonMaps[id]?.name?.replace(/\s+/g,'')||('地圖 '+id);
const zoneOf=s=>{const m=/^\[([^\]]+)\]/.exec(s.zone||'');return m?m[1]:'';};

// ---------- 怪物與 NPC ----------
const npcOf=s=>s.npc||templates[s.npcId];
const monsters=new Map(),residents=new Map();
const isBoss=(s,n)=>!!s.boss||/BOSS/i.test(n.name)||(s.count===1&&n.hp>=1500);
for(const s of spawns){
  if(!(s.count>0))continue;
  const n=npcOf(s);if(!n)continue;
  if(s.resident||n.kind!=='L1Monster'){
    if(!residents.has(s.npcId))residents.set(s.npcId,{id:s.npcId,name:n.name.replace(/\^/g,' '),kind:n.kind,places:[]});
    residents.get(s.npcId).places.push({map:s.mapId,x:s.point?.[0]||s.bounds?.[0],y:s.point?.[1]||s.bounds?.[1]});
    continue;
  }
  if(!(n.level>0)&&!(n.hp>0))continue;
  let m=monsters.get(s.npcId);
  if(!m){m={id:s.npcId,name:n.name.replace(/^\s+|\s+$/g,''),level:n.level,hp:n.hp,mp:n.mp,ac:n.ac,mr:n.mr,exp:n.exp,lawful:n.raw?.lawful||0,
    str:n.str,dex:n.dex,con:n.con,int:n.int,wis:n.wis,ranged:n.ranged,aggressive:!!n.aggressive,undead:n.raw?.undead||0,weak:n.raw?.weakAttr||0,
    boss:false,quest:false,places:[]};monsters.set(s.npcId,m);}
  if(isBoss(s,n))m.boss=true;
  m.places.push({map:s.mapId,zone:zoneOf(s),count:s.count,respawn:s.respawn});
}
// 等級任務才會出現的任務怪
for(const q of QUESTS)for(const sp of q.spawns||[]){
  const n=templates[sp.npcId];if(!n)continue;
  let m=monsters.get(sp.npcId);
  if(!m){m={id:sp.npcId,name:n.name,level:n.level,hp:n.hp,mp:n.mp,ac:n.ac,mr:n.mr,exp:n.exp,lawful:n.raw?.lawful||0,str:n.str,dex:n.dex,con:n.con,int:n.int,wis:n.wis,ranged:n.ranged,aggressive:!!n.aggressive,undead:0,weak:0,boss:false,quest:true,places:[]};monsters.set(sp.npcId,m);}
  m.places.push({map:sp.mapId,zone:'任務',count:sp.count,respawn:null,quest:q.id});
}

// 同地圖同區域的出生點合併
for(const m of monsters.values()){const merged=new Map();for(const p of m.places){const k=p.map+'|'+p.zone+'|'+(p.quest||'');const e=merged.get(k);if(e)e.count+=p.count||0;else merged.set(k,{...p});}m.places=[...merged.values()];}
// ---------- 取得來源（反查用）----------
const sources=new Map(); // itemId -> {drop:[], shop:[], craft:[], box:[], quest:[], starter:[], gacha:[], other:[]}
const src=id=>{if(!sources.has(id))sources.set(id,{drop:[],mapdrop:[],shop:[],craft:[],box:[],quest:[],starter:[],other:[]});return sources.get(id);};
const obtain=new Set();
const give=(id,kind,info)=>{if(!available(id))return false;src(id)[kind].push(info);const fresh=!obtain.has(id);obtain.add(id);return fresh;};

// 怪物掉落
const pct=c=>c/10000; // 百萬分率 → %
for(const m of monsters.values()){
  m.drops=[];
  for(const d of drops[m.id]||[]){
    if(blocked(d.id)||!available(d.id)||!(d.chance>0)||!(d.max>0)||!(rates.RateDropItems>0)&&d.id!==40308)continue;
    const coin=d.id===40308;
    const chance=Math.min(1000000,d.chance*(coin?1:rates.RateDropItems));
    const row={id:d.id,min:Math.floor(Math.min(d.min,d.max)*(coin?rates.RateDropAdena:1)),max:Math.floor(Math.max(d.min,d.max)*(coin?rates.RateDropAdena:1)),p:pct(chance)};
    m.drops.push(row);give(d.id,'drop',{mob:m.id,p:row.p});
  }
  // 擊殺獎勵系統
  for(const row of rows('怪物擊殺獎勵系統'))if(row['Npc編號']===m.id)for(const id of [row['一般攻擊者獎勵道具編號'],row['最後攻擊者獎勵道具編號']])
    if(id>0&&!blocked(id)&&byId.has(id)){m.drops.push({id,min:1,max:1,p:100,kill:true});give(id,'drop',{mob:m.id,p:100});}
  // 傲慢之塔卷軸
  const towerMap=m.places.find(p=>(p.map>=101&&p.map<=110)||(p.map>=3301&&p.map<=3310));
  if(towerMap){
    setGlobal('activeMapId',towerMap.map);
    const M=R('Math'),oldRandom=M.random;M.random=()=>0;
    try{for(const l of TowerScrolls.drop({spawn:{npcId:m.id,mapId:towerMap.map,npc:{name:m.name}},mapId:towerMap.map})||[]){const id=+String(l.key).split(':')[1];if(byId.has(id)){const p=/傳送符/.test(nameOf(id))?0.1:1;m.drops.push({id,min:1,max:1,p});give(id,'drop',{mob:m.id,p});}}}catch(e){}
    M.random=oldRandom;
  }
  // 魔法娃娃成長藥劑：BOSS 必掉 1～3、一般怪 0.3%
  if(byId.has(60219)){const p=m.boss?100:0.3;m.drops.push({id:60219,min:1,max:m.boss?3:1,p});give(60219,'drop',{mob:m.id,p});}
  m.drops.sort((a,b)=>b.p-a.p);
}
// 全圖／地圖掉落
const globalDrops=rows('怪物掉落全圖設置').filter(r=>!blocked(r['道具'])&&available(r['道具'])&&r['機率']>0&&r['最大量']>0).map(r=>({id:r['道具'],min:r['最小量'],max:r['最大量'],p:pct(r['道具']===39287?50000:r['機率'])}));
for(const d of globalDrops)give(d.id,'mapdrop',{map:'all',p:d.p});
const spawnMaps=new Set([...monsters.values()].flatMap(m=>m.places.map(p=>p.map)));
const mapDrops={};
for(const r of rows('droplist_map')){if(!spawnMaps.has(r.mapid)||blocked(r.itemid)||!available(r.itemid)||!(r.chance*rates.RateDropItems>0)||!(r.max>0))continue;(mapDrops[r.mapid]??=[]).push({id:r.itemid,min:r.min,max:r.max,p:pct(r.chance*rates.RateDropItems)});give(r.itemid,'mapdrop',{map:r.mapid,p:pct(r.chance)});}
for(const [map,ids] of [[19,[40515,40503,40505,40519]],[20,[3,19,20]],[21,[89,100,41351]]])if(spawnMaps.has(map))for(const id of ids){if(blocked(id))continue;(mapDrops[map]??=[]).push({id,min:1,max:1,p:2});give(id,'mapdrop',{map,p:2});}

// 新手背包
const starterKit={common:[[990103,1],[40308,100000],[40013,50],[40010,1000],[40079,10],[20028,1],[20082,1],[20126,1],[20173,1],[20206,1],[20232,1],[20282,1]],
  '黑妖':[[73,1]],'王族':[[7,1]],'騎士':[[7,1]],'法師':[[7,1]],'妖精':[[175,1],[7,1],[40743,1000]],'戰士':[[147,1]],'龍騎士':[[35,1]],'幻術師':[[120,1]]};
// 跟遊戲比對（避免日後改了沒跟上）
try{const src=fs.readFileSync(path.join(GAME,'data/db-game-rules.js'),'utf8');if(!src.includes('common:[[990103,1],[40308,100000],[40013,50],[40010,1000],[40079,10]'))console.warn('注意：新手背包設定可能已變更，請更新 build-data.cjs 的 starterKit');}catch{}
for(const [role,list] of Object.entries(starterKit))for(const [id] of list)give(id,'starter',{role});

// 商店（只算地圖上有出現、收金幣的商人）
const shops=[];
for(const [npc,list] of Object.entries(dialogs.shops)){
  const id=+npc;if(id===70089||!residents.has(id)||!list.length)continue;
  const cur=dialogs.actions[npc]?.currency||40308;if(cur!==40308)continue;
  const r=residents.get(id),items=[];
  for(const [item,,price,pack,,enchant] of list){if(!byId.has(item)||removed.has(item))continue;
    items.push({id:item,price,pack:pack||1,enchant:enchant||0});give(item,'shop',{npc:id,price,pack:pack||1});}
  if(items.length)shops.push({npc:id,name:r.name,places:r.places,items});
}

// 等級任務
const quests=QUESTS.map(q=>{
  for(const [id] of q.reward||[])give(id,'quest',{quest:q.id});
  for(const t of q.targets||[])if(t.item)give(t.item,'quest',{quest:q.id,target:true});
  return {id:q.id,name:q.name,roles:q.roles,level:q.level,choice:!!q.choice,note:q.note||'',
    targets:(q.targets||[]).map(t=>({mobs:t.mobs||[],item:t.item,count:t.count||1,p:t.drop?pct(t.drop):null})),
    reward:(q.reward||[]).map(([id,n])=>({id,n})),spawns:(q.spawns||[]).map(s=>({npc:s.npcId,map:s.mapId,count:s.count}))};
});

// 每日任務獎勵箱
for(const id of [990101,49138,44104,990102])give(id,'other',{text:'每日任務'});

// 扭蛋（目前免費）
for(const t of DOLL_GACHA.tiers)if(t.rate>0)for(const id of t.ids)give(id,'other',{text:'魔法娃娃扭蛋機（'+t.tier+'）'});
for(const t of WUHUN_GACHA.tiers)if(t.rate>0)for(const id of t.ids)give(id,'other',{text:'武魂扭蛋機（'+t.tier+'）'});

// 寶箱與製作：反覆展開直到沒有新東西
const boxFixed=rows('etcitem_boxs'),boxRandom=rows('etcitem_box');
const recipes=[];{
  const seen=new Set(),split=v=>String(v??'').split(',').filter(Boolean).map(Number);
  for(const r of DB.craftRecipes()){
    const item=byId.get(+r.new_item),mats=split(r.materials);
    if(!item||!available(item.id)||!(r.rnd>0)||!(r.new_item_counts>0)||!mats.length||mats.some(id=>!available(id)))continue;
    const sig=JSON.stringify(Object.keys(r).sort().filter(k=>!['id','action','note','npcname'].includes(k)).map(k=>[k,r[k]]));if(seen.has(sig))continue;seen.add(sig);
    const counts=split(r.materials_count),ench=split(r.materials_enchants);
    recipes.push({id:r.id,out:+r.new_item,n:r.new_item_counts||1,outEnchant:r.new_item_Enchantlvl||0,rate:r.rnd,level:r.checkLevel||0,cls:r.checkClass?'黑妖':'',hp:r.hpConsume||0,mp:r.mpConsume||0,
      elf:DB.isElvenCraft(r),cat:item.type==='arrow'?'arrow':DB.craftCategory(item),
      mats:mats.map((id,i)=>({id,n:counts[i]||1,e:ench[i]||0})),bonus:r.bonus_item&&r.bonus_item_count>0&&available(+r.bonus_item)?{id:+r.bonus_item,n:r.bonus_item_count}:null,residue:r.rnd<100&&r.residue_item&&r.residue_count>0&&available(+r.residue_item)?{id:+r.residue_item,n:r.residue_count}:null});
  }
}
let changed=true;
while(changed){
  changed=false;
  for(const b of boxFixed)if(b.count>0&&(b.use_type&31)!==0&&obtain.has(b.box_item_id)&&!src(b.get_item_id).box.some(x=>x.box===b.box_item_id))changed=give(b.get_item_id,'box',{box:b.box_item_id,n:b.count,fixed:true})||changed;
  const groups={};for(const b of boxRandom)(groups[b.box_item_id]??=[]).push(b);
  for(const [box,list] of Object.entries(groups)){if(!obtain.has(+box))continue;const total=list[0].randomint||1000000;
    let sum=0;
    for(const b of list.filter(b=>!removed.has(b.get_item_id))){const weight=Math.max(0,Math.min(total,sum+b.random)-sum);sum+=b.random;if(weight>0&&b.max_count>0&&!src(b.get_item_id).box.some(x=>x.box===+box))changed=give(b.get_item_id,'box',{box:+box,p:weight/total*100,min:b.min_count,max:b.max_count})||changed;}}
  for(const r of recipes){if(r.ok||!r.mats.every(m=>obtain.has(m.id)))continue;r.ok=true;changed=true;
    give(r.out,'craft',{recipe:r.id});if(r.bonus)give(r.bonus.id,'craft',{recipe:r.id,bonus:true});if(r.residue)give(r.residue.id,'craft',{recipe:r.id,residue:true});}
}
const okRecipes=recipes.filter(r=>r.ok);

// ---------- 技能 ----------
const roleCode={'王族':0,'騎士':1,'法師':2,'妖精':3,'黑妖':4};
const auto={};for(const row of rows('自動學習技能設置'))for(const role of Object.keys(roleCode))if(row['職業代號']===roleCode[role])
  for(const id of String(row['技能編號']).split(',').filter(Boolean).map(Number))if(skillData.skills[id]){(auto[id]??={})[role]=Math.min(auto[id]?.[role]??999,row['等級']);}
const skills=[];
for(const s of Object.values(skillData.skills)){
  const books=Object.entries(skillData.books).filter(([,b])=>b.skill===s.id).map(([id,b])=>({id:+id,min:b.min,element:b.element||''}));
  const learn={};
  for(const [role,lv] of Object.entries(auto[s.id]||{}))learn[role]={lv,how:'auto'};
  // auto-magic.js：1～2 階魔法（非屬性）等級到直接學會，不用書
  if(s.circle===1||s.circle===2)for(const b of books)if(!b.element)for(const [role,lv] of Object.entries(b.min))if(!learn[role]||learn[role].lv>lv)learn[role]={lv,how:'auto'};
  for(const b of books)if(obtain.has(b.id))for(const [role,lv] of Object.entries(b.min))if(!learn[role]||learn[role].how!=='auto')learn[role]={lv,how:'book',book:b.id,element:b.element};
  if(!Object.keys(learn).length)continue;
  const ic=skillIcons.get(s.id);
  skills.push({id:s.id,name:s.name,circle:s.circle,mp:s.mp,hp:s.hp,mat:s.material&&s.materialCount?{id:s.material,n:s.materialCount}:null,reuse:s.reuse,dur:s.duration,target:s.target,dmg:s.damage,range:s.range,icon:ic?.icon||'',learn});
}

// ---------- 變身卡、娃娃、武魂、附魔 ----------
const GRADES=['','一般','高級','稀有','英雄','傳說','神話','超越','唯一'];
const portraitUrl=c=>{try{return R('TransformCards.portrait')(c)}catch{return ''}};
const cards=cardBook.filter(c=>!c.unavailable&&(gradeWeights[c.g]||0)>0).map(c=>({n:c.dn||c.n,g:GRADES[c.g],gi:c.g,lv:c.p?.lv??c.lv??0,fx:c.fx||[],pb:c.pb?.fx||[],icon:portraitUrl(c)||'',atk:!c.noAttack,cast:c.p?.m!==0}));
const cardRates={};for(const [gi,w] of Object.entries(gradeWeights)){const n=cards.filter(c=>c.gi===+gi).length;if(n&&w>0)cardRates[GRADES[gi]]={rate:w,count:n};}
const dollGacha=new Map();for(const t of DOLL_GACHA.tiers)if(t.rate>0)for(const id of t.ids)if(available(id))dollGacha.set(id,t.tier);
const fam=id=>{try{return DollEvolution.family(id)}catch{return null}};
const reachableDolls=new Set(dollGacha.keys());
if(obtain.has(60219))for(const d of dolls){const f=fam(d.id);for(const p of f?.paths||[])for(let i=1;i<p.length;i++)if(reachableDolls.has(p[i-1]))reachableDolls.add(p[i]);}
const dollList=dolls.filter(d=>reachableDolls.has(d.id)).map(d=>{const f=fam(d.id),pathOf=f?.paths?.find(p=>p.includes(d.id));const stage=pathOf?pathOf.indexOf(d.id):0;
  return {id:d.id,name:d.name,tier:dollTier(d.id),fx:d.effects||[],mats:(d.materials||[]).map(([id,n])=>({id,n})),time:d.time||1800,
    img:d.img?'assets/interface/catalog-portraits/'+d.img:'',gacha:dollGacha.get(d.id)||'',stage:stage+1,root:pathOf?pathOf[0]:d.id,prev:stage>0?pathOf[stage-1]:null,next:pathOf&&stage<pathOf.length-1?pathOf[stage+1]:null};});
const wuhunGacha=new Map();for(const t of WUHUN_GACHA.tiers)if(t.rate>0)for(const id of t.ids)wuhunGacha.set(id,t.tier);
const craftWuhun=new Set(okRecipes.map(r=>r.out));
const wuhun=wuhunData.filter(w=>wuhunGacha.has(w.id)||craftWuhun.has(w.id)).map(w=>({id:w.id,name:w.name,tier:w.tier,core:w.core,fx:w.fx||[],gacha:wuhunGacha.has(w.id),craft:craftWuhun.has(w.id)}));
const ENCHANT_FX={惡魔:'風刃 2 段，各 20～35 傷害',不死鳥:'40～80 傷害，自己血量低於 30% 時傷害 ×2',古代巨人:'50～90 傷害',巨蟻女皇:'中毒：每秒 10，持續 6 秒',
  冰之女王:'目標周圍 2 格內每隻 25～45 傷害',傑尼斯女王:'30～50 傷害，並讓目標 5 秒內受到的傷害 +10%',幻象眼魔:'35～60 傷害',吸血鬼:'25～65 傷害並回血 15',
  殭屍王:'20～40 傷害並回魔 5',黑豹:'再普攻 2 次',木乃伊王:'疾病：每秒 6，持續 10 秒＋破壞盔甲 10 秒',艾莉絲:'30～50 傷害，怪物血量低於 30% 時 ×3',
  騎士范德:'40～70 傷害＋暈眩 0.5 秒',巫妖:'扣目標目前血量 3%（BOSS 最多 300）',鐮刀死神:'目標身邊 1 格內每隻 35～60 傷害',死亡騎士:'60～100 傷害'};
const enchants=bossEnchantData.filter(e=>obtain.has(e.id)).map(e=>({id:e.id,stone:e.stone,boss:e.boss,fx:ENCHANT_FX[e.boss]||e.skill,levels:e.levels.map(l=>({name:l.name,rate:l.rate,proc:l.proc}))}));

// ---------- 傳送點 ----------
const obtainableNames=new Set([...obtain].map(id=>byId.get(id).name));
const teleports=routes.map(r=>({id:r.id,name:r.name,group:r.group||'',cat:r.category,map:r.mapId,price:r.price,minLv:r.minLevel,levels:r.levels,
  mobs:(r.monsterDetails||[]).map(d=>({id:d.id,name:d.name,level:d.level,count:d.count})),drops:(r.drops||[]).filter(n=>obtainableNames.has(n))}));

// ---------- 道具輸出 ----------
const usedMobs=new Set();
const items=[];
for(const id of obtain){
  const it=byId.get(id),s=sources.get(id);
  const o={id,name:it.name,kind:it.kind,type:it.type,icon:it.icon||'',w:Math.round((it.weight||0)/1000)};
  if(it.kind==='weapon'){o.dmg=it.damage;o.two=!!it.twoHand;}
  if(it.kind==='armor'||it.ac)o.ac=it.ac;
  if(it.allowed&&it.allowed.length<8)o.cls=it.allowed;
  const b=Object.entries(it.bonuses||{}).filter(([,v])=>v);if(b.length)o.b=Object.fromEntries(b);
  const sr=it.sourceRules||{};const keep={};for(const k of ['safenchant','range','hitmodifier','dmgmodifier','m_def','damage_reduction','sp','hpr','mpr','exp_point','min_lvl','max_lvl','defense_water','defense_wind','defense_fire','defense_earth','regist_stone','regist_sleep','regist_freeze','regist_sustain','regist_stun','regist_blind','bowhitrate','bowdmgrate','double_dmg_chance','magicdmgmodifier','haste_item','weight_reduction'])if(sr[k]!==undefined&&sr[k]!==0&&sr[k]!=='')keep[k]=sr[k];
  if(Object.keys(keep).length)o.r=keep;
  o.src={};
  if(s.drop.length){o.src.drop=s.drop.sort((a,b)=>b.p-a.p).slice(0,40).map(d=>[d.mob,d.p]);for(const d of o.src.drop)usedMobs.add(d[0]);if(s.drop.length>40)o.src.dropMore=s.drop.length-40;}
  if(s.mapdrop.length)o.src.map=s.mapdrop.map(d=>[d.map,d.p]);
  if(s.shop.length){const best=new Map();for(const d of s.shop){const u=d.price/(d.pack||1);if(!best.has(d.npc)||u<best.get(d.npc))best.set(d.npc,u);}o.src.shop=[...best].sort((a,b)=>a[1]-b[1]).map(([npc,u])=>[npc,Math.round(u*100)/100]);}
  if(s.craft.length)o.src.craft=[...new Set(s.craft.map(d=>d.recipe))];
  if(s.box.length)o.src.box=s.box.map(d=>[d.box,d.p??100]);
  if(s.quest.length)o.src.quest=[...new Set(s.quest.map(d=>d.quest))];
  if(s.starter.length)o.src.starter=[...new Set(s.starter.map(d=>d.role))];
  if(s.other.length)o.src.other=[...new Set(s.other.map(d=>d.text))];
  items.push(o);
}
items.sort((a,b)=>a.kind.localeCompare(b.kind)||a.id-b.id);

// 物品是否也被當作材料
const usedIn={};for(const r of okRecipes)for(const m of r.mats)(usedIn[m.id]??=[]).push(r.id);
for(const it of items)if(usedIn[it.id])it.use=[...new Set(usedIn[it.id])].slice(0,60);

// 地圖彙整
const maps={};
for(const m of monsters.values())for(const p of m.places){
  const e=maps[p.map]??={id:p.map,name:mapName(p.map),mobs:{},boss:[]};
  if(!e.mobs[m.id])e.mobs[m.id]=0;e.mobs[m.id]+=p.count||0;if(m.boss&&!e.boss.includes(m.id))e.boss.push(m.id);
}
for(const e of Object.values(maps)){const lv=Object.keys(e.mobs).map(id=>monsters.get(+id)).filter(m=>!m.quest).map(m=>m.level);e.lv=lv.length?[Math.min(...lv),Math.max(...lv)]:null;e.drops=mapDrops[e.id]||[];const x=rows('mapids_exp').filter(r=>r.mapid===e.id&&r.exp&&r.exp!==1);if(x.length)e.exp=x.map(r=>({min:r.min,max:r.max,x:r.exp}));}

// NPC（商人／傳送／旅館）
const npcs={};for(const r of residents.values())npcs[r.id]={id:r.id,name:r.name,kind:r.kind,places:r.places.slice(0,4).map(p=>({map:p.map,mapName:mapName(p.map),x:p.x,y:p.y}))};

// 經驗表（只到 99）
const expTable=thresholds.filter(([lv])=>lv<=99);

// ---------- 圖示 ----------
const icons=new Set();
for(const it of items)if(it.icon)icons.add(it.icon.split('?')[0]);
for(const s of skills)if(s.icon)icons.add(s.icon.split('?')[0]);
for(const c of cards)if(c.icon)icons.add(c.icon.split('?')[0]);
for(const d of dollList)if(d.img)icons.add(d.img);
let copied=0,missing=0;
for(const rel of icons){
  const from=path.join(GAME,decodeURIComponent(rel)),to=path.join(SITE,'img',decodeURIComponent(rel).replace(/^assets\//,''));
  if(!fs.existsSync(from)){missing++;continue;}
  if(!fs.existsSync(to)||fs.statSync(to).size!==fs.statSync(from).size){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);copied++;}
}
const fixIcon=p=>p?'img/'+decodeURIComponent(p.split('?')[0]).replace(/^assets\//,''):'';
const iconExists=p=>p&&fs.existsSync(path.join(SITE,p));
for(const it of items){it.icon=fixIcon(it.icon);if(!iconExists(it.icon))it.icon='';}
for(const s of skills){s.icon=fixIcon(s.icon);if(!iconExists(s.icon))s.icon='';}
for(const c of cards){c.icon=fixIcon(c.icon);if(!iconExists(c.icon))c.icon='';}
for(const d of dollList){d.img=fixIcon(d.img);if(!iconExists(d.img))d.img='';}

// 版本
const ver=(fs.readFileSync(path.join(GAME,'index.html'),'utf8').match(/\?v=([\w.-]+)/)||[])[1]||'';

const monsterList=[...monsters.values()].sort((a,b)=>a.level-b.level||a.id-b.id);
const WIKI={
  built:new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }),gameVer:ver,rates,
  classes:Object.fromEntries(Object.entries(classes).map(([k,c])=>[k,{base:c.base,points:c.points,hp:c.hp,intro:c.intro}])),
  starterKit,expTable,
  items,monsters:monsterList,maps:Object.values(maps).sort((a,b)=>a.id-b.id),globalDrops,npcs,shops,
  recipes:okRecipes.map(({ok,...r})=>r),skills,quests,cards,cardRates,dolls:dollList,dollRates:DOLL_GACHA.tiers.map(t=>({tier:t.tier,rate:t.rate,count:t.ids.length})),
  wuhun,wuhunRates:WUHUN_GACHA.tiers.map(t=>({tier:t.tier,rate:t.rate,count:t.ids.length})),enchants,teleports
};
// 公開資料中的每個道具參照都必須有正常取得來源；檢查失敗時保留上次資料。
const visibleIds=new Set(items.map(i=>i.id));
const checkItem=id=>{if(id!=null&&!visibleIds.has(id))throw new Error('道具取得來源尚未確認，停止更新（ID '+id+'）');};
for(const m of monsterList)for(const d of m.drops)checkItem(d.id);
for(const d of globalDrops)checkItem(d.id);
for(const m of Object.values(maps))for(const d of m.drops)checkItem(d.id);
for(const s of shops)for(const i of s.items)checkItem(i.id);
for(const r of okRecipes){checkItem(r.out);for(const m of r.mats)checkItem(m.id);checkItem(r.bonus?.id);checkItem(r.residue?.id);}
for(const q of quests){for(const r of q.reward)checkItem(r.id);for(const t of q.targets)checkItem(t.item);}
for(const s of skills)checkItem(s.mat?.id);
for(const d of dollList)for(const m of d.mats)checkItem(m.id);
for(const e of enchants)checkItem(e.id);
fs.mkdirSync(path.join(SITE,'data'),{recursive:true});
const json=JSON.stringify(WIKI);
fs.writeFileSync(path.join(SITE,'data/wiki-data.js'),'// 由 tools/build-data.cjs 自動產生，請勿手改\nwindow.WIKI='+json+';\n');
console.log(`道具 ${items.length}／${CATALOG.length}、怪物 ${monsterList.length}（BOSS ${monsterList.filter(m=>m.boss).length}）、地圖 ${Object.keys(maps).length}、商店 ${shops.length}、配方 ${okRecipes.length}／${recipes.length}、技能 ${skills.length}、任務 ${quests.length}`);
console.log(`變身卡 ${cards.length}、娃娃 ${dollList.length}、武魂 ${wuhun.length}、附魔石 ${enchants.length}、傳送點 ${teleports.length}`);
console.log(`圖示 ${icons.size}（新複製 ${copied}、缺檔 ${missing}）；資料 ${(json.length/1024/1024).toFixed(2)} MB；版本 ${ver}`);
