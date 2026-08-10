
// 職業搜尋：把關鍵字（中文職業名或英文代碼）對應到職業代碼，讓「搜尋騎士」列出 req 含 knight 的裝備。
const _CLASS_KW_MAP = {
  '法師':'mage','mage':'mage',
  '騎士':'knight','knight':'knight',
  '妖精':'elf','elf':'elf',
  '黑暗妖精':'dark','黑暗':'dark','dark':'dark',
  '王族':'royal','royal':'royal',
  '龍騎士':'dragon','龍騎':'dragon','dragon':'dragon',
  '幻術師':'illusion','幻術':'illusion','illusion':'illusion',
  '戰士':'warrior','warrior':'warrior',
};
function _classCodeFromKeyword(kw){ return kw ? (_CLASS_KW_MAP[kw] || '') : ''; }
// req（逗號分隔職業代碼，或 'all'）是否「明確包含」指定職業。'all' 不視為特定職業（否則 494 件通用裝備會全被灌進來）。
function _reqIncludesClass(req, clsCode){
  if(!req || !clsCode) return false;
  return String(req).toLowerCase().split(',').map(function(x){return x.trim();}).includes(clsCode);
}
// 「該職業是否可裝備」：req 為 'all'（全職業）或 req 明確含該職業都算。用於「騎士可裝備的○○」這種職業搜尋。
// 沒有 req 欄位者（多半是藥水/材料/卡片等非裝備）不算，避免職業 token 把消耗品也一起撈進來。
function _classCanEquip(req, clsCode){
  if(!clsCode || !req) return false;
  if(String(req).toLowerCase() === 'all') return true;
  return _reqIncludesClass(req, clsCode);
}

// 武器細分：遊戲沒有「單手劍/雙手劍」這種欄位，改用機制旗標推導 —— 弓/遠程(isBow/ranged)、雙手(w2h)、其餘為單手。
function _weaponSub(v){
  if(v.isBow || v.ranged) return 'bow';
  if(v.w2h) return '2h';
  return '1h';
}
// 下拉篩選比對：一般部位用 _itemSlotCategory；'wpn:1h/2h/bow' 為武器細分（先確認是武器，再比對細分）。
function _matchSlotFilter(v, filter){
  if(!filter) return true;
  if(filter.indexOf('wpn:') === 0){
    return _itemSlotCategory(v) === 'wpn' && _weaponSub(v) === filter.slice(4);
  }
  return _itemSlotCategory(v) === filter;
}
// 多重關鍵字（以空白切成多個 token，需「同時」全部命中＝AND）。
// 單一 token 命中條件（任一）：① 職業名/代碼 → req 含該職業；② 「遺物」→ v.relic；③ 名稱或 ID 含該字串。
// 例：「騎士 遺物」→ 需同時「req 含 knight」且「是遺物」→ 列出騎士可裝備的遺物類裝備。
function _itemMatchesTokens(v, id, kwRaw){
  const tokens = String(kwRaw || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(tokens.length === 0) return true;
  const nameLc = (v.n || '').toLowerCase();
  const idLc   = id.toLowerCase();
  return tokens.every(tok => {
    const cls = _classCodeFromKeyword(tok);
    if(cls) return _classCanEquip(v.req, cls);             // 職業 token：該職業可裝備（req 含該職業 或 req=all）
    if(isRelicKeyword(tok)) return !!v.relic;               // 遺物 token
    return nameLc.includes(tok) || idLc.includes(tok);      // 名稱／ID token
  });
}

function renderEquipSearch(){
  const kw = (document.getElementById('equipSearchInput')?.value || '').trim().toLowerCase();
  const slotFilter = document.getElementById('equipSearchSlotFilter')?.value || '';
  const wrap = document.getElementById('equipSearchResults');
  if(!wrap) return;

  // 🪄 魔眼欄位全遊戲只有「地龍之魔眼」這一件固定物品，不透過搜尋新增，避免跟裝備面板底部的專用勾選格產生兩套裝備方式。
  if(slotFilter === 'eye'){
    wrap.innerHTML = '<div style="color:var(--yellow); grid-column:1/-1; padding:20px; text-align:center; line-height:1.7;">🪄 魔眼欄位全遊戲只有「地龍之魔眼」這一件固定物品，不開放搜尋新增。<br>請到上方「裝備」分頁最底端的「魔眼（地龍之魔眼）」小格，勾選「已裝備」即可。</div>';
    return;
  }

  if(!kw && !slotFilter){
    wrap.innerHTML = '<div style="color:var(--text3); grid-column:1/-1; padding:20px; text-align:center;">輸入關鍵字搜尋裝備。可用空白分隔多個條件（需同時符合），例如「騎士 遺物」＝騎士可裝備的遺物；「龍騎士 雙手」＝龍騎士的雙手武器。也可只用右側下拉選單依部位／武器細分列出</div>';
    return;
  }
  
  const matched = Object.entries(ITEM_DB).filter(([id, v]) => {
    if(!v.type || !['wpn','arm','acc','helm','shield','glove','boot','belt','cloak'].includes(v.type)) return false;
    if(slotFilter && !_matchSlotFilter(v, slotFilter)) return false;
    if(!kw) return true;
    return _itemMatchesTokens(v, id, kw);   // 多重關鍵字 AND（職業／遺物／名稱可混搭）
  });
  
  if(matched.length === 0){
    wrap.innerHTML = '<div style="color:var(--text3); grid-column:1/-1; padding:20px; text-align:center;">找不到符合的裝備</div>';
    return;
  }
  
  wrap.innerHTML = matched.map(([id, v]) => {
    const isGenieWish = id === GENIE_WISH_ID;
    return `
    <div class="equip-search-card" style="background:var(--bg); border:1px solid ${isGenieWish?'var(--yellow)':'var(--border)'}; border-radius:6px; padding:10px; font-size:13px; ${isGenieWish?'cursor:not-allowed; opacity:0.85;':'cursor:pointer;'}"
         ${isGenieWish ? '' : `onclick="openEquipSlotPicker('${id.replace(/'/g,"\\'")}')"`}
         title="${isGenieWish ? '此戒指禁止直接搜尋新增，請改用「裝備」分頁下方的專用產生器' : '點擊選擇要裝備到哪個欄位'}">
      <div style="font-weight:600; color:var(--text); margin-bottom:4px;">${v.n || id}</div>
      <div style="color:var(--text2); font-size:11px; margin-bottom:6px;">ID: <code style="background:var(--bg3); padding:1px 5px; border-radius:3px; user-select:all;">${id}</code></div>
      <div style="color:var(--text2); line-height:1.5;">
        ${v.dmgS ? `傷害 ${v.dmgS}~${v.dmgL || v.dmgS} ` : ''}
        ${v.hit !== undefined ? `命中${v.hit>0?'+':''}${v.hit} ` : ''}
        ${v.spd ? `速度${v.spd} ` : ''}
        ${v.req ? `<br>需求: ${reqLabel(v.req)}` : ''}
        ${v.p ? `<br>價格: ${v.p}` : ''}
      </div>
      ${isGenieWish ? `<div style="margin-top:6px; padding-top:6px; border-top:1px dashed var(--yellow); color:var(--yellow); font-size:12px;">🧞 此戒指禁止在此直接新增（會產生無效果的空白戒指）。請改用下方「巨靈的三個願望」專用產生器。</div>` : relicInfoHTML(v, id)}
    </div>
  `;
  }).join('');
}

// ── 點擊搜尋結果 → 彈出欄位選單，可無視原始裝備部位限制，任意裝備到指定欄位
let _pendingEquipItemId = null;
// ════════════════════════════════════════════════
//  🧞 巨靈的三個願望（relic_genie_wishes）專用產生器
//  這只戒指需要額外的 gw 陣列（3項不重複的隨機能力），一般搜尋新增只會給空白戒指（無效果）。
// ════════════════════════════════════════════════
const GENIE_WISH_ID   = 'relic_genie_wishes';
const GENIE_WISH_POOL = ['hp60','mp30','md3','rd3','mdmg2','sp6','hpr10','mpr5','dr3','ac3','mr6','str1','dex1','int1','wis1','con1','cha1'];
// 能力代碼 → 中文顯示（依常見命名慣例推測，僅供勾選介面顯示用）
const GENIE_WISH_LABELS = {
  hp60:'生命上限 +60', mp30:'魔力上限 +30', md3:'近戰傷害 +3', mdmg2:'魔法傷害 +2',
  rd3:'遠程傷害 +3', sp6:'額外魔法點數 +6', hpr10:'生命回復 +10', mpr5:'魔力回復 +5',
  dr3:'減傷 +3', ac3:'護甲 +3', mr6:'魔防 +6', str1:'力量 +1', dex1:'敏捷 +1',
  int1:'智力 +1', wis1:'精神 +1', con1:'體質 +1', cha1:'魅力 +1',
};
function _genGenieWishes(){   // 保留：找不到手動選擇結果時的備援隨機抽法
  const pool = GENIE_WISH_POOL.slice();
  const picked = [];
  for(let i = 0; i < 3; i++){
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

let _pendingGenieWish = false;
let _pendingGenieWishManual = null;
let _genieWishSelected = [];

// 點「產生並裝備」→ 先跳出勾選3項願望能力的視窗（不可重複，須剛好選滿3項才能確定）
function openGenieWishEquipPicker(){
  _genieWishSelected = [];
  renderGenieWishPickGrid();
  updateGenieWishPickCount();
  const modal = document.getElementById('genieWishPickModal');
  if(modal) modal.classList.add('show');
}
function closeGenieWishPickModal(){
  const modal = document.getElementById('genieWishPickModal');
  if(modal) modal.classList.remove('show');
}
function renderGenieWishPickGrid(){
  const grid = document.getElementById('genieWishPickGrid');
  if(!grid) return;
  grid.innerHTML = GENIE_WISH_POOL.map(code => {
    const checked = _genieWishSelected.includes(code);
    return `<label style="display:flex; align-items:center; gap:6px; padding:7px 9px; background:${checked?'var(--bg4)':'var(--bg)'}; border:1px solid ${checked?'var(--accent)':'var(--border)'}; border-radius:6px; cursor:pointer; font-size:13px;">
      <input type="checkbox" ${checked?'checked':''} onchange="toggleGenieWishPick('${code}')" style="accent-color:var(--accent); cursor:pointer;">
      ${GENIE_WISH_LABELS[code] || code}
    </label>`;
  }).join('');
}
function toggleGenieWishPick(code){
  const i = _genieWishSelected.indexOf(code);
  if(i >= 0){
    _genieWishSelected.splice(i, 1);
  } else {
    if(_genieWishSelected.length >= 3){
      if(typeof toast === 'function') toast('⚠️ 最多只能選3項，請先取消勾選其他項目', 'warn', 2500);
      renderGenieWishPickGrid();
      return;
    }
    _genieWishSelected.push(code);
  }
  renderGenieWishPickGrid();
  updateGenieWishPickCount();
}
function updateGenieWishPickCount(){
  const el = document.getElementById('genieWishPickCount');
  if(el) el.textContent = _genieWishSelected.length;
  const btn = document.getElementById('genieWishConfirmBtn');
  if(btn) btn.disabled = _genieWishSelected.length !== 3;
}
// 確定選好3項 → 關閉勾選視窗，接著跳出「選擇要裝備到哪個欄位」的介面
function confirmGenieWishPick(){
  if(_genieWishSelected.length !== 3) return;
  _pendingGenieWish = true;
  _pendingGenieWishManual = _genieWishSelected.slice();
  closeGenieWishPickModal();
  openEquipSlotPicker(GENIE_WISH_ID);
}

function openEquipSlotPicker(itemId){
  _pendingEquipItemId = itemId;
  const db = (typeof ITEM_DB !== 'undefined' && ITEM_DB[itemId]) || {};
  const nameEl = document.getElementById('equipSlotPickerItemName');
  if(nameEl) nameEl.innerHTML = `${db.n || itemId}　<code style="background:var(--bg3); padding:1px 5px; border-radius:3px;">${itemId}</code>`;

  const gridEl = document.getElementById('equipSlotPickerGrid');
  if(gridEl && typeof EQ_SLOTS !== 'undefined'){
    gridEl.innerHTML = EQ_SLOTS
      .filter(sl => !sl.hidden && !sl.spacer && !sl.isRemains)
      .map(sl => `<button class="btn btn-sm" style="width:100%" onclick="assignEquipToSlot('${sl.id}')">${sl.label}</button>`)
      .join('');
  }

  const modal = document.getElementById('equipSlotPickerModal');
  if(modal) modal.classList.add('show');
}
function closeEquipSlotPicker(){
  _pendingEquipItemId = null;
  _pendingGenieWish = false;
  _pendingGenieWishManual = null;
  const modal = document.getElementById('equipSlotPickerModal');
  if(modal) modal.classList.remove('show');
}
function assignEquipToSlot(slotId){
  const itemId = _pendingEquipItemId;
  if(!itemId) return;

  // 確保裝備面板 DOM 已渲染（若尚未渲染過欄位輸入框，先渲染一次）
  if(!document.getElementById(`eq_${slotId}_id`) && typeof renderEqPanel === 'function'){
    renderEqPanel();
  }

  const idInput = document.getElementById(`eq_${slotId}_id`);
  if(!idInput){
    if(typeof toast === 'function') toast('⚠️ 找不到該裝備欄位，請先切換到「裝備」分頁', 'err');
    closeEquipSlotPicker();
    return;
  }

  idInput.value = itemId;
  if(typeof onEqFieldChange === 'function') onEqFieldChange(slotId);

  let wishNote = '';
  if(_pendingGenieWish && itemId === GENIE_WISH_ID){
    const wishes = (_pendingGenieWishManual && _pendingGenieWishManual.length === 3) ? _pendingGenieWishManual : _genGenieWishes();
    if(G.p.eq[slotId]) G.p.eq[slotId].gw = wishes;
    wishNote = `　🧞 願望：${wishes.map(w => GENIE_WISH_LABELS[w] || w).join('、')}`;
  }
  _pendingGenieWish = false;
  _pendingGenieWishManual = null;

  const slotLabel = (typeof EQ_SLOTS !== 'undefined' && EQ_SLOTS.find(sl => sl.id === slotId)?.label) || slotId;
  const db = (typeof ITEM_DB !== 'undefined' && ITEM_DB[itemId]) || {};
  if(typeof toast === 'function') toast(`✅ 已將「${db.n || itemId}」裝備到「${slotLabel}」${wishNote}`, 'ok', wishNote ? 5000 : 2500);

  closeEquipSlotPicker();

  idInput.scrollIntoView({ behavior:'smooth', block:'center' });
  const slotBox = idInput.closest('.eq-slot');
  if(slotBox){
    slotBox.style.transition = 'box-shadow .3s ease';
    slotBox.style.boxShadow = '0 0 0 2px var(--accent, #4ade80)';
    setTimeout(() => { slotBox.style.boxShadow = ''; }, 1200);
  }
}

// ── 選欄位彈窗新增：直接放入背包／倉庫（不裝備），沿用搜尋或巨靈願望產生器產生的裝備
function sendPendingEquipTo(type){
  const itemId = _pendingEquipItemId;
  if(!itemId) return;

  const item = {
    id: itemId, uid: genUID(),
    cnt: 1, en: 0,
    bless: false, lock: false, junk: false,
    attr: false, anc: false, seteff: false,
    attrMagic: false, attrMagicStar: 1,
  };

  let wishNote = '';
  if(_pendingGenieWish && itemId === GENIE_WISH_ID){
    const wishes = (_pendingGenieWishManual && _pendingGenieWishManual.length === 3) ? _pendingGenieWishManual : _genGenieWishes();
    item.gw = wishes;
    wishNote = `　🧞 願望：${wishes.map(w => GENIE_WISH_LABELS[w] || w).join('、')}`;
  }
  _pendingGenieWish = false;
  _pendingGenieWishManual = null;

  if(type === 'inv') G.p.inv.push(item);
  else               G.wh.items.push(item);

  if(typeof renderItemTable === 'function') renderItemTable(type);

  const db = (typeof ITEM_DB !== 'undefined' && ITEM_DB[itemId]) || {};
  const destLabel = type === 'inv' ? '背包' : '倉庫';
  if(typeof toast === 'function') toast(`✅ 已將「${db.n || itemId}」放入「${destLabel}」${wishNote}`, 'ok', wishNote ? 5000 : 2500);

  closeEquipSlotPicker();
}

// 動態產生「裝備／背包／倉庫」搜尋欄位旁的部位下拉選單選項，統一從 JUNK_PREF_SLOT_LABEL 取得標籤文字，避免多處維護不同步。
// 裝備搜尋只涉及可裝備的 wpn/arm/acc 類型物品，所以不列出技能書/一般道具這兩個選項（列了也永遠是空清單）；
// 背包/倉庫搜尋涵蓋整個 ITEM_DB，所以列出全部20種分類。
function _initSlotFilterDropdowns(){
  const equipOrder = ['', 'wpn', 'helm', 'armor', 'shield', 'cloak', 'tshirt', 'gloves', 'boots', 'shin',
                       'ring', 'amulet', 'ear', 'belt', 'eye', 'doll', 'petarm', 'petwpn', 'rem'];
  const fullOrder  = equipOrder.concat(['skillbk', 'general']);
  // 武器細分子選項（縮排顯示；值為 wpn:1h / wpn:2h / wpn:bow，由 _matchSlotFilter 處理）
  const WPN_SUB = [
    ['wpn',     JUNK_PREF_SLOT_LABEL['wpn'] || '武器'],
    ['wpn:1h',  '　├ 單手武器'],
    ['wpn:2h',  '　├ 雙手武器'],
    ['wpn:bow', '　└ 弓／遠程'],
  ];
  const buildOptions = order => order.map(k => {
    if(k === 'wpn') return WPN_SUB.map(([val, lbl]) => `<option value="${val}">${lbl}</option>`).join('');
    return `<option value="${k}">${JUNK_PREF_SLOT_LABEL[k] || k}</option>`;
  }).join('');
  const eqEl = document.getElementById('equipSearchSlotFilter');
  if(eqEl) eqEl.innerHTML = buildOptions(equipOrder);
  ['invRefSlotFilter', 'whRefSlotFilter'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = buildOptions(fullOrder);
  });
}

setTimeout(() => {
  _initSlotFilterDropdowns();
  const input = document.getElementById('equipSearchInput');
  if(input){
    input.addEventListener('input', renderEquipSearch);
    renderEquipSearch();
  }
}, 100);

// 通用物品資料庫搜尋（背包/倉庫共用；不限裝備類型，搜尋全部 ITEM_DB）
function renderItemRefSearch(inputId, resultId, slotFilterId){
  const kw = (document.getElementById(inputId)?.value || '').trim().toLowerCase();
  const slotFilter = (slotFilterId && document.getElementById(slotFilterId)?.value) || '';
  const wrap = document.getElementById(resultId);
  if(!wrap) return;

  if(!kw && !slotFilter){
    wrap.innerHTML = '<div style="color:var(--text3); grid-column:1/-1; padding:20px; text-align:center;">輸入關鍵字搜尋物品資料庫。可用空白分隔多個條件（需同時符合），例如「騎士 遺物」＝騎士可裝備的遺物。也可用右側下拉選單依部位／武器細分列出</div>';
    return;
  }

  const TYPE_LABEL = {
    wpn:'武器', arm:'防具', acc:'飾品', helm:'頭盔', shield:'盾', glove:'手套',
    boot:'鞋', belt:'腰帶', cloak:'披風', misc:'雜物', card:'卡片', relic:'遺物'
  };

  const matched = Object.entries(ITEM_DB).filter(([id, v]) => {
    if(slotFilter && !_matchSlotFilter(v, slotFilter)) return false;
    if(!kw) return true;
    return _itemMatchesTokens(v, id, kw);   // 多重關鍵字 AND（職業／遺物／名稱可混搭）
  });

  if(matched.length === 0){
    wrap.innerHTML = '<div style="color:var(--text3); grid-column:1/-1; padding:20px; text-align:center;">找不到符合的物品</div>';
    return;
  }

  const LIMIT = 150;
  const shown = matched.slice(0, LIMIT);

  wrap.innerHTML = shown.map(([id, v]) => `
    <div style="background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:10px; font-size:13px;">
      <div style="font-weight:600; color:var(--text); margin-bottom:4px;">${v.n || id} ${v.type ? `<span style="color:var(--text3); font-weight:400; font-size:11px">[${TYPE_LABEL[v.type] || v.type}]</span>` : ''}</div>
      <div style="color:var(--text2); font-size:11px; margin-bottom:6px;">ID: <code style="background:var(--bg3); padding:1px 5px; border-radius:3px; user-select:all;">${id}</code></div>
      <div style="color:var(--text2); line-height:1.5;">
        ${v.dmgS ? `傷害 ${v.dmgS}~${v.dmgL || v.dmgS} ` : ''}
        ${v.hit !== undefined ? `命中${v.hit>0?'+':''}${v.hit} ` : ''}
        ${v.ac !== undefined ? `防禦${v.ac>0?'+':''}${v.ac} ` : ''}
        ${v.spd ? `速度${v.spd} ` : ''}
        ${v.req ? `<br>需求: ${reqLabel(v.req)}` : ''}
        ${v.p !== undefined ? `<br>價格: ${v.p}` : ''}
      </div>
      ${relicInfoHTML(v, id)}
    </div>
  `).join('') + (matched.length > LIMIT ? `<div style="color:var(--text3); grid-column:1/-1; padding:8px; text-align:center; font-size:12px;">僅顯示前 ${LIMIT} 筆，共符合 ${matched.length} 筆，請輸入更精確的關鍵字</div>` : '');
}
