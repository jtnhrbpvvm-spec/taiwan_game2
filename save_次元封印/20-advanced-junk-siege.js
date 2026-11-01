
// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════
// 第五段：進階面板邏輯
// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════


// ════════════════════════════════════════════════
//  進階面板 — 載入 UI
// ════════════════════════════════════════════════
function loadAdvancedUI(){
  const p = G.p;

  // ── 攻城
  const sg = p.siege || {};
  setVal('adv_siegeCity',    sg.city        || '');
  setVal('adv_victoryCity',  sg.victoryCity || '');
  setVal('adv_siegeKills',   sg.kills       ?? 0);
  setVal('adv_siegeResult',  sg.result      || '');
  setBool('adv_siegeActive',        sg.active        || false);
  setBool('adv_siegeGateKilled',    sg.gateKilled    || false);
  setBool('adv_siegeTowerKilled',   sg.towerKilled   || false);
  setBool('adv_siegeRewardPending', sg.rewardPending || false);

  // ── Pandora
  const pm = p.pandoraMarket || {};
  setVal('adv_pandoraId',     pm.id     || '');
  setVal('adv_pandoraPrice',  pm.price  ?? 0);
  setVal('adv_pandoraWeight', pm.weight ?? 0);

  // ── 套裝旗標
  const FLAGS = [
    'RedLion5','WhiteBird5','Iron3','Iron5','Beauty5',
    'Gale5','Moon5','Apprentice5','Witch5',
    'Shadow3','Shadow5',
    'Illusion2','Illusion3','Illusion5',
    'Dragonblood2','Dragonblood3','Dragonblood5',
    'Fury5',
  ];
  FLAGS.forEach(f => {
    setBool(`adv_set${f}`, p[`_set${f}`] || false);
  });

  // ── 垃圾偏好摘要
  renderJunkPrefsSummary();
}

// ════════════════════════════════════════════════
//  進階面板 — 儲存到 G
// ════════════════════════════════════════════════
function saveAdvancedToG(){
  const p = G.p;

  // ── 攻城
  if(!p.siege) p.siege = {};
  p.siege.city          = getStr('adv_siegeCity')   || 'kent';
  p.siege.victoryCity   = getStr('adv_victoryCity') || null;
  p.siege.kills         = getNum('adv_siegeKills');
  const resVal          = getStr('adv_siegeResult');
  p.siege.result        = resVal || null;
  p.siege.active        = getBool('adv_siegeActive');
  p.siege.gateKilled    = getBool('adv_siegeGateKilled');
  p.siege.towerKilled   = getBool('adv_siegeTowerKilled');
  p.siege.rewardPending = getBool('adv_siegeRewardPending');

  // ── Pandora
  if(!p.pandoraMarket) p.pandoraMarket = {};
  p.pandoraMarket.id     = getStr('adv_pandoraId');
  p.pandoraMarket.price  = getNum('adv_pandoraPrice');
  p.pandoraMarket.weight = getNum('adv_pandoraWeight');

  // ── 套裝旗標：唯讀顯示，不再從畫面寫回（由裝備自動判定，不可手動覆蓋）
}

// ════════════════════════════════════════════════
//  垃圾偏好（junkPrefs）
// ════════════════════════════════════════════════
// junkPrefs 的 key 是 itemSig：id|en|bless|anc|attr|seteff（不是純物品 id）
function _parseItemSig(sig){
  const parts = String(sig).split('|');
  return {
    id:     parts[0] || '',
    en:     parseInt(parts[1]) || 0,
    bless:  parts[2] || '0',
    anc:    parts[3] || '0',
    attr:   parts[4] || '',
    seteff: parts[5] || '',
  };
}
// 🔽 垃圾偏好清單排序：依使用者指定的優先順位分類，數字越小排越前面。
// 若同一件裝備符合多個分類（例如：又是遺物、又強化過），一律取「順位最高（數字最小）」的那個分類，
// 不會重複計算或疊加，也就是每件裝備最終只落在一個分類裡。
// 1.遺物  2.附加屬性(依階級排列)  3.祝福及遠古等屬性  4.強化過的  5.boss裝備(紅字裝備)  6.一般雜物
const JUNK_PREF_RANK_LABEL = {
  1: '🏺 遺物', 2: '✨ 附加屬性', 3: '🙏 祝福/遠古', 4: '⚒️ 強化裝備', 5: '👹 Boss裝備', 6: '🗑️ 一般雜物',
};
function _junkPrefRank(p, db){
  if(db.relic) return 1;                                                   // 1. 遺物
  if(p.attr && ATTR_AFFIX[attrCanon(p.attr)]) return 2;                    // 2. 附加屬性（下面依tier再排一次階級高低）
  if((p.bless && p.bless !== '0') || (p.anc && p.anc !== '0')) return 3;   // 3. 祝福/詛咒 或 遠古/永恆/不朽/太初
  if(p.en > 0) return 4;                                                   // 4. 強化過的（+1以上）
  if(db.legend) return 5;                                                  // 5. boss裝備（紅字/傳說裝備，db.legend）
  return 6;                                                                // 6. 一般雜物（其餘都不符合）
}

// 🔽 垃圾偏好清單「裝備部位」下拉篩選：把 ITEM_DB 的 type/slot 組合，歸類成使用者看得懂的部位選項。
// wpn 沒有slot欄位(武器本身自成一類)；skillbk(魔法書/技術書/精靈水晶等)獨立一類；
// misc/etc/pot/use/scroll，以及完全沒有type欄位的材料/任務道具/卷軸，全部歸入「一般道具」。
const JUNK_PREF_SLOT_LABEL = {
  '':         '全部部位',
  wpn:        '⚔️ 武器',
  helm:       '⛑️ 頭盔',
  armor:      '🥋 盔甲',
  shield:     '🛡️ 盾牌/臂甲',
  cloak:      '🧥 披風',
  tshirt:     '👕 T恤',
  gloves:     '🧤 手套',
  boots:      '👢 靴子',
  shin:       '🦵 脛甲',
  ring:       '💍 戒指',
  amulet:     '📿 項鍊',
  ear:        '👂 耳環',
  belt:       '🎗️ 腰帶',
  eye:        '👁️ 魔眼',
  doll:       '🪆 魔法娃娃',
  petarm:     '🐾 寵物防具',
  petwpn:     '🐾 寵物武器',
  rem:        '🦴 席琳遺骸',
  skillbk:    '📖 技能書',
  general:    '📦 一般道具',
};
function _itemSlotCategory(db){
  if(!db) return 'general';
  if(db.type === 'skillbk') return 'skillbk';
  if(db.type === 'wpn') return 'wpn';
  if(db.slot && String(db.slot).startsWith('rem_')) return 'rem';
  if(db.slot && JUNK_PREF_SLOT_LABEL[db.slot] !== undefined) return db.slot;
  return 'general';   // misc/etc/pot/use/scroll，以及完全沒有type/slot欄位的材料類道具
}

// 🔽 垃圾偏好清單「排序分類」篩選按鈕：勾選時只顯示該分類，預設全選（等同不過濾）。
let _junkPrefRankFilter = new Set([1, 2, 3, 4, 5, 6]);
function _renderJunkPrefRankFilterButtons(){
  const el = document.getElementById('junkPrefsRankFilter');
  if(!el) return;
  el.innerHTML = Object.keys(JUNK_PREF_RANK_LABEL).map(rankStr => {
    const rank = Number(rankStr);
    const active = _junkPrefRankFilter.has(rank);
    return `<button type="button" class="junk-rank-btn${active ? ' active' : ''}" onclick="_toggleJunkPrefRankFilter(${rank})">${JUNK_PREF_RANK_LABEL[rank]}</button>`;
  }).join('');
}
function _toggleJunkPrefRankFilter(rank){
  if(_junkPrefRankFilter.has(rank)) _junkPrefRankFilter.delete(rank);
  else _junkPrefRankFilter.add(rank);
  // 全部取消勾選等同沒有意義的篩選（清單會整個消失），直接視為「回到全選」比較符合直覺
  if(_junkPrefRankFilter.size === 0) _junkPrefRankFilter = new Set([1, 2, 3, 4, 5, 6]);
  _renderJunkPrefRankFilterButtons();
  renderJunkPrefsList();
}
function renderJunkPrefsSummary(){
  const el = document.getElementById('junkPrefsSummary');
  if(!el) return;
  const prefs = G.p.junkPrefs || {};
  const keys  = Object.keys(prefs);
  if(!keys.length){
    el.textContent = '目前無垃圾設定（所有物品都會保留）';
  } else {
    el.innerHTML = `<span style="color:var(--yellow)">共 ${keys.length} 筆垃圾設定</span>`;
  }
  renderJunkPrefsList();
}

function renderJunkPrefsList(){
  const el = document.getElementById('junkPrefsList');
  if(!el) return;
  _renderJunkPrefRankFilterButtons();   // 每次渲染清單時同步刷新篩選按鈕的勾選外觀
  const prefs = G.p.junkPrefs || {};
  const keys  = Object.keys(prefs);
  if(!keys.length){
    el.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;font-size:12px">目前無垃圾設定</div>';
    return;
  }

  const q = (document.getElementById('junkPrefsSearch')?.value || '').toLowerCase().trim();
  const slotFilter = document.getElementById('junkPrefsSlotFilter')?.value || '';
  const TYPE_LABEL = {
    wpn:'武器', arm:'防具', acc:'飾品', helm:'頭盔', shield:'盾', glove:'手套',
    boot:'鞋', belt:'腰帶', cloak:'披風', pot:'藥水', scroll:'卷軸', misc:'雜物',
    card:'卡片', relic:'遺物', etc:'其他'
  };

  const rows = keys.map(sig => {
    const p  = _parseItemSig(sig);
    const db = ITEM_DB[p.id] || {};
    const rank = _junkPrefRank(p, db);
    const attrTier = (ATTR_AFFIX[attrCanon(p.attr)] || {}).tier || 0;
    return { sig, p, db, name: db.n || p.id, rank, attrTier };
  })
    .filter(r => !q || r.name.toLowerCase().includes(q) || r.p.id.toLowerCase().includes(q))
    .filter(r => _junkPrefRankFilter.has(r.rank))
    .filter(r => !slotFilter || _itemSlotCategory(r.db) === slotFilter);

  // 依優先順位排序：1遺物→2附加屬性(階級高到低)→3祝福/遠古→4強化→5boss裝備→6一般雜物
  rows.sort((a, b) => {
    if(a.rank !== b.rank) return a.rank - b.rank;
    if(a.rank === 2 && a.attrTier !== b.attrTier) return b.attrTier - a.attrTier;   // 附加屬性同順位時，階級(tier)高的排前面
    return 0;   // 其餘同順位維持原本清單順序（穩定排序）
  });

  if(!rows.length){
    el.innerHTML = '<div style="color:var(--text3);padding:12px;text-align:center;font-size:12px">沒有符合目前搜尋/篩選條件的物品</div>';
    return;
  }

  el.innerHTML = rows.map((r, idx) => {
    const { p, db, name, rank } = r;
    const groupHeader = (idx === 0 || rows[idx - 1].rank !== rank)
      ? `<div style="font-size:11px;font-weight:700;color:var(--accent2);margin:${idx===0?'0':'10px'} 0 2px 2px;">${JUNK_PREF_RANK_LABEL[rank] || ''}</div>`
      : '';
    const badges = [];
    if(p.en > 0) badges.push(`+${p.en}`);
    if(p.bless === 'B') badges.push('祝福');
    else if(p.bless === 'C') badges.push('詛咒');
    if(p.anc === 'A') badges.push('遠古');
    else if(p.anc && p.anc !== '0') badges.push(`遠古:${p.anc}`);
    if(p.attr) badges.push(`屬性:${p.attr}`);
    if(p.seteff) badges.push(`套裝:${p.seteff}`);

    const info = [];
    if(db.dmgS !== undefined) info.push(`傷害 ${db.dmgS}~${db.dmgL || db.dmgS}`);
    if(db.hit  !== undefined) info.push(`命中${db.hit > 0 ? '+' : ''}${db.hit}`);
    if(db.ac   !== undefined) info.push(`防禦${db.ac > 0 ? '+' : ''}${db.ac}`);
    if(db.spd) info.push(`速度 ${db.spd}`);
    if(db.p !== undefined) info.push(`價格 ${db.p}`);
    if(db.d && typeof db.d === 'string') info.push(db.d);

    return groupHeader + `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;font-size:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:var(--text)">
          ${name}${db.type ? ` <span style="color:var(--text3);font-weight:400;font-size:11px">[${TYPE_LABEL[db.type] || db.type}]</span>` : ''}
          ${badges.length ? `<span style="color:var(--yellow);font-weight:400;font-size:11px;margin-left:4px">${badges.join('、')}</span>` : ''}
        </div>
        <div style="color:var(--text3);font-size:10px;margin:2px 0">ID: ${p.id}</div>
        ${info.length ? `<div style="color:var(--text2);line-height:1.5">${info.join('　')}</div>` : ''}
      </div>
      <button class="btn btn-sm btn-danger" style="flex-shrink:0" onclick="removeJunkPref(this.dataset.sig)" data-sig="${r.sig.replace(/"/g,'&quot;')}">移除</button>
    </div>`;
  }).join('');
}

function removeJunkPref(sig){
  if(!G.p.junkPrefs) return;
  delete G.p.junkPrefs[sig];
  renderJunkPrefsSummary();
}

function clearJunkPrefs(){
  if(!confirm('確定清空全部垃圾偏好設定？\n清空後遊戲將不自動丟棄任何物品。')) return;
  G.p.junkPrefs = {};
  renderJunkPrefsSummary();
  toast('垃圾偏好已清空', 'ok');
}

// ════════════════════════════════════════════════
//  攻城快捷按鈕（進階面板補充）
// ════════════════════════════════════════════════

// 在進階面板 HTML 中可呼叫此函式快速設定勝利狀態
function siegeSetWin(){
  setBool('adv_siegeActive',        false);
  setBool('adv_siegeGateKilled',    true);
  setBool('adv_siegeTowerKilled',   true);
  setBool('adv_siegeRewardPending', true);
  setVal('adv_siegeResult', 'win');
  setVal('adv_siegeKills',  17);
  toast('攻城狀態已設為：勝利', 'ok');
}

function siegeSetReset(){
  setBool('adv_siegeActive',        false);
  setBool('adv_siegeGateKilled',    false);
  setBool('adv_siegeTowerKilled',   false);
  setBool('adv_siegeRewardPending', false);
  setVal('adv_siegeResult', '');
  setVal('adv_siegeKills',  0);
  toast('攻城狀態已重置', 'info');
}

// ════════════════════════════════════════════════
//  套裝旗標 — 一鍵全開 / 全關
// ════════════════════════════════════════════════
