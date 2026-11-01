

// ════════════════════════════════════════════════
//  圖鑑面板
// ════════════════════════════════════════════════
let _dexTab = 'equip';

function switchDexTab(tab, el){
  _dexTab = tab;
  document.querySelectorAll('#dexTabBar .skill-filter-btn')
    .forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('dex-equip').style.display = tab==='equip' ? '' : 'none';
  document.getElementById('dex-card').style.display  = tab==='card'  ? '' : 'none';
  document.getElementById('dex-misc').style.display  = tab==='misc'  ? '' : 'none';
  document.getElementById('dex-relic').style.display = tab==='relic' ? '' : 'none';
  if(tab==='misc')  renderDexMisc();
  if(tab==='relic') renderDexRelic();
}

// ── 裝備/遺物分類系統（來源：10-ui-tabs.js WEAPON_TAGS + 16-equip-book.js EQUIP_CATEGORIES/equipCatKey）
function isWandWeapon(d){ return !!(d && d.isWand); }
const WEAPON_TAGS = GAME_DATA.weaponTags;
const EQUIP_CATEGORIES = GAME_DATA.equipCategories;
// 分類結果由遊戲自己算好（更新遊戲資料.py），不再維護一份副本
function equipCatKey(id, d){ return d ? (GAME_DATA.equipCat[id] || null) : null; }
function getWeaponTags(id){ return WEAPON_TAGS[id] || []; }

// ---- 建立索引：部位 → [itemId,...]（裝備收集冊排除遺物；遺物另建於下方遺物圖鑑）----
const EQUIP_CAT_ITEMS = {};
const EQUIP_ITEM_CAT  = {};
let _equipIndexBuilt = false;
function _ensureEquipIndex(){
  if(_equipIndexBuilt) return;
  _equipIndexBuilt = true;
  EQUIP_CATEGORIES.forEach(c => EQUIP_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    if(!d || (d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc')) return;
    if(isRelicItem(d)) return;   // 遺物不進裝備收集冊，改進遺物收集冊
    const ck = equipCatKey(id, d);
    if(!ck || !EQUIP_CAT_ITEMS[ck]) return;
    EQUIP_CAT_ITEMS[ck].push(id);
    EQUIP_ITEM_CAT[id] = ck;
  });
  Object.keys(EQUIP_CAT_ITEMS).forEach(k => {
    EQUIP_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
}
function _equipCatOptionsHTML(){
  let lastGroup = '';
  let html = '<option value="">全部部位</option>';
  EQUIP_CATEGORIES.forEach(c => {
    if(c.group !== lastGroup){
      if(lastGroup) html += '</optgroup>';
      html += `<optgroup label="${c.group}">`;
      lastGroup = c.group;
    }
    html += `<option value="${c.key}">${c.name}</option>`;
  });
  html += '</optgroup>';
  return html;
}

// ── 裝備圖鑑（比照 16-equip-book.js：僅收錄真正裝備，依 27 部位分類，排除遺物）
function renderDexEquip(){
  _ensureEquipIndex();
  const grid = document.getElementById('dexEquipGrid');
  const cnt  = document.getElementById('dexEquipCount');
  if(!grid) return;

  const catSel = document.getElementById('dexEquipCatSel');
  if(catSel && !catSel.dataset.filled){
    catSel.innerHTML = _equipCatOptionsHTML();
    catSel.dataset.filled = '1';
  }

  const q   = (document.getElementById('dexEquipSearch')?.value||'').toLowerCase();
  const cat = catSel?.value || '';
  const owned = G.p.equipDex || {};

  let ids = cat ? (EQUIP_CAT_ITEMS[cat]||[]) : Object.keys(EQUIP_ITEM_CAT);
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = Object.keys(EQUIP_ITEM_CAT).length;
  const ownedAll = Object.keys(EQUIP_ITEM_CAT).filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已解鎖 ${ownedAll} / ${totalAll}`;

  const CAT_NAME = {}; EQUIP_CATEGORIES.forEach(c => CAT_NAME[c.key]=c.name);

  grid.innerHTML = ids.map(id=>{
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexEquip('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;${v.legend?'color:var(--legend)':''};
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_NAME[EQUIP_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexEquip(id){
  if(!G.p.equipDex) G.p.equipDex={};
  if(G.p.equipDex[id]) delete G.p.equipDex[id];
  else G.p.equipDex[id]=true;
  renderDexEquip();
}


function dexUnlockAll(type){
  if(type==='equip'){
    _ensureEquipIndex();
    if(!G.p.equipDex) G.p.equipDex = {};
    const ids = Object.keys(EQUIP_ITEM_CAT);
    ids.forEach(id=>{ G.p.equipDex[id]=true; });
    renderDexEquip();
    toast(`裝備圖鑑全部解鎖（${ids.length} 件）`,'ok');
  } else if(type==='misc'){
    _ensureMiscIndex();
    if(!G.p.miscDex) G.p.miscDex = {};
    MISC_DEX_ALL_IDS.forEach(id=>{ G.p.miscDex[id]=true; });
    renderDexMisc();
    toast(`道具圖鑑全部解鎖（${MISC_DEX_ALL_IDS.length} 件）`,'ok');
  } else if(type==='relic'){
    _ensureRelicIndex();
    if(!G.p.relicDex) G.p.relicDex = {};
    const ids = Object.keys(RELIC_ITEM_CAT);
    ids.forEach(id=>{ G.p.relicDex[id]=true; });
    renderDexRelic();
    toast(`遺物圖鑑全部解鎖（${ids.length} 件）`,'ok');
  } else {
    const cnt = parseInt(document.getElementById('dexCardCntSel')?.value)||100;
    CARD_DEX_LIST.forEach(m=>{ G.p.cardDex[m.n]=cnt; });
    renderDexCard();
    toast(`卡片圖鑑全部解鎖（數量 ${cnt}）`,'ok');
  }
}

function dexClearAll(type){
  if(!confirm('確定清除全部圖鑑？')) return;
  if(type==='equip'){
    G.p.equipDex={};
    renderDexEquip();
    toast('裝備圖鑑已全部清除','info');
  } else if(type==='misc'){
    G.p.miscDex={};
    renderDexMisc();
    toast('道具圖鑑已全部清除','info');
  } else if(type==='relic'){
    G.p.relicDex={};
    renderDexRelic();
    toast('遺物圖鑑已全部清除','info');
  } else {
    G.p.cardDex={};
    renderDexCard();
    toast('卡片圖鑑已全部清除','info');
  }
}

// ── 卡片圖鑑（怪物收集冊）
// 收集對象來自遊戲的 CARD_MOB_INFO（更新遊戲資料.py）
const CARD_DEX_LIST = GAME_DATA.cards;
function _cardTierInfo(score){
  score = score || 0;
  if(score >= 10000) return {label:'鑽石卡', cls:'tier-gold'};
  if(score >= 1000)  return {label:'白金卡', cls:'tier-gold'};
  if(score >= 100) return {label:'金卡（已開通）', cls:'tier-gold'};
  if(score >= 10)  return {label:'銀卡', cls:'tier-silver'};
  if(score >= 1)   return {label:'普卡', cls:'tier-bronze'};
  return {label:'未收集', cls:''};
}

function renderDexCard(){
  const grid = document.getElementById('dexCardGrid');
  const cnt  = document.getElementById('dexCardCount');
  if(!grid) return;
  const q     = (document.getElementById('dexCardSearch')?.value||'').toLowerCase();
  const owned = G.p.cardDex || {};
  const items = CARD_DEX_LIST.filter(m=>!q||m.n.toLowerCase().includes(q));

  const ownedNames = Object.keys(owned).filter(n=>owned[n]>0);
  const diaCnt    = ownedNames.filter(n=>owned[n]>=10000).length;
  const platCnt   = ownedNames.filter(n=>owned[n]>=1000 && owned[n]<10000).length;
  const goldCnt   = ownedNames.filter(n=>owned[n]>=100 && owned[n]<1000).length;
  const silverCnt = ownedNames.filter(n=>owned[n]>=10 && owned[n]<100).length;
  const bronzeCnt = ownedNames.filter(n=>owned[n]>=1  && owned[n]<10).length;
  if(cnt) cnt.textContent =
    `已收錄 ${ownedNames.length} / ${CARD_DEX_LIST.length}　（鑽 ${diaCnt}／白金 ${platCnt}／金 ${goldCnt}／銀 ${silverCnt}／普 ${bronzeCnt}）`;

  grid.innerHTML = items.map(m=>{
    const score = owned[m.n] || 0;
    const tier  = _cardTierInfo(score);
    const safeName = m.n.replace(/'/g,"\\'");
    return `
    <div class="dex-item ${score>0?'owned':''} ${tier.cls}">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${m.n}">
          ${m.n}
        </div>
        <div style="font-size:10px;color:var(--text3)">Lv.${m.lv}　${tier.label}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end;flex-shrink:0">
        <input type="number" class="dex-card-score" min="0" max="10000"
               value="${score||''}" placeholder="0"
               onchange="setDexCardScore('${safeName}', this.value)">
        <div style="display:flex;gap:2px">
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',1)">普</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',10)">銀</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',100)">金</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',1000)">白</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',10000)">鑽</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function setDexCardScore(name, val){
  if(!G.p.cardDex) G.p.cardDex={};
  let n = Math.max(0, Math.min(10000, parseInt(val)||0));
  if(n > 0) G.p.cardDex[name] = n;
  else delete G.p.cardDex[name];
  renderDexCard();
}

// ── 道具圖鑑（miscDex）── 分類邏輯比照 18-misc-book.js 的 miscCatKey()
const MISC_CATEGORIES = GAME_DATA.miscCategories;
function miscCatKey(id, d){ return d ? (GAME_DATA.miscCat[id] || null) : null; }
const MISC_CAT_ITEMS = {};
const MISC_ITEM_CAT  = {};
let MISC_DEX_ALL_IDS = [];
let _miscIndexBuilt = false;
function _ensureMiscIndex(){
  if(_miscIndexBuilt) return;
  _miscIndexBuilt = true;
  MISC_CATEGORIES.forEach(c => MISC_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    const ck = miscCatKey(id, d);
    if(!ck || !MISC_CAT_ITEMS[ck]) return;
    MISC_CAT_ITEMS[ck].push(id);
    MISC_ITEM_CAT[id] = ck;
  });
  Object.keys(MISC_CAT_ITEMS).forEach(k => {
    MISC_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
  MISC_DEX_ALL_IDS = Object.keys(MISC_ITEM_CAT);
}

function renderDexMisc(){
  _ensureMiscIndex();
  const grid = document.getElementById('dexMiscGrid');
  const cnt  = document.getElementById('dexMiscCount');
  if(!grid) return;
  const q   = (document.getElementById('dexMiscSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('dexMiscCatSel')?.value || '';
  const owned = G.p.miscDex || {};

  let ids = cat ? (MISC_CAT_ITEMS[cat] || []) : MISC_DEX_ALL_IDS;
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = MISC_DEX_ALL_IDS.length;
  const ownedAll = MISC_DEX_ALL_IDS.filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已收錄 ${ownedAll} / ${totalAll}`;

  const CAT_LABEL = {}; MISC_CATEGORIES.forEach(c => CAT_LABEL[c.key] = c.name);

  grid.innerHTML = ids.map(id => {
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexMisc('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_LABEL[MISC_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexMisc(id){
  if(!G.p.miscDex) G.p.miscDex = {};
  if(G.p.miscDex[id]) delete G.p.miscDex[id];
  else G.p.miscDex[id] = true;
  renderDexMisc();
}

// ── 遺物圖鑑（relicDex）── 來源：ITEM_DB 中 relic:true 的物品，分類沿用裝備圖鑑的 EQUIP_CATEGORIES/equipCatKey（21-relic-book.js）
function isRelicItem(d){ return !!(d && d.relic); }
const RELIC_CAT_ITEMS = {};
const RELIC_ITEM_CAT  = {};
let _relicIndexBuilt = false;
function _ensureRelicIndex(){
  if(_relicIndexBuilt) return;
  _relicIndexBuilt = true;
  EQUIP_CATEGORIES.forEach(c => RELIC_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    if(!isRelicItem(d)) return;
    if(d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc') return;
    const ck = equipCatKey(id, d);
    if(!ck || !RELIC_CAT_ITEMS[ck]) return;
    RELIC_CAT_ITEMS[ck].push(id);
    RELIC_ITEM_CAT[id] = ck;
  });
  Object.keys(RELIC_CAT_ITEMS).forEach(k => {
    RELIC_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
}

function renderDexRelic(){
  _ensureRelicIndex();
  const grid = document.getElementById('dexRelicGrid');
  const cnt  = document.getElementById('dexRelicCount');
  if(!grid) return;

  const catSel = document.getElementById('dexRelicCatSel');
  if(catSel && !catSel.dataset.filled){
    catSel.innerHTML = _equipCatOptionsHTML();
    catSel.dataset.filled = '1';
  }

  const q   = (document.getElementById('dexRelicSearch')?.value || '').toLowerCase();
  const cat = catSel?.value || '';
  const owned = G.p.relicDex || {};

  let ids = cat ? (RELIC_CAT_ITEMS[cat]||[]) : Object.keys(RELIC_ITEM_CAT);
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = Object.keys(RELIC_ITEM_CAT).length;
  const ownedAll = Object.keys(RELIC_ITEM_CAT).filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已收錄 ${ownedAll} / ${totalAll}`;

  const CAT_NAME = {}; EQUIP_CATEGORIES.forEach(c => CAT_NAME[c.key]=c.name);

  grid.innerHTML = ids.map(id => {
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexRelic('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:#5ec8e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_NAME[RELIC_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexRelic(id){
  if(!G.p.relicDex) G.p.relicDex = {};
  if(G.p.relicDex[id]) delete G.p.relicDex[id];
  else G.p.relicDex[id] = true;
  renderDexRelic();
}