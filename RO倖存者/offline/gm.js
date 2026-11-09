/* RO 倖存者離線版：GM 模式（只在「以GM模式開始遊戲.bat」時載入）
   - 物品欄、卡片頁多一個「＋ 創造」按鈕；右下角「GM」按鈕開啟 GM 面板
   - 可以創造裝備、卡片，修改等級、素質、卡普拉點數，遊戲局中可以改金幣（zeny）
   - 修改的是瀏覽器裡的離線存檔（http://127.0.0.1:8382/），跟官網帳號完全無關
   遊戲每次改版變數名稱都會變，所以這裡用「資料長相」去找遊戲的資料表。 */
(function () {
  'use strict';
  const K_CHARS = 'ro-survivors.characters.v1';
  const K_ACCT = 'ro-survivors.account.v1';
  const K_REENTER = 'rs-gm-reenter';
  const LIMIT = { level: 99, stat: 99, refine: 10, kafra: 99999999, zeny: 99999999 };
  const STATS = [['str', 'STR'], ['agi', 'AGI'], ['vit', 'VIT'], ['int', 'INT'], ['dex', 'DEX'], ['luk', 'LUK']];
  let D = null;          // 遊戲資料
  let pending = [];      // 等待套用的物品／卡片
  let status = {};       // 伺服器修補結果

  /* ---------- 小工具 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => Array.from({ length: 16 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.random() * 36 | 0]).join('');
  // 用 getClientRects 判斷看不看得到（position:fixed 的元素 offsetParent 一定是 null）
  const isVisible = el => !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  const inRun = () => { const h = document.getElementById('hud'); return !!(h && !h.classList.contains('hidden') && isVisible(h)); };

  /* ---------- 找遊戲資料 ---------- */
  async function loadData() {
    if (D) return D;
    let core = null;
    for (let i = 0; i < 120 && !core; i++) {
      core = performance.getEntriesByType('resource').map(e => e.name).find(n => /\/build\/soul_linker-[\w-]+\.js$/.test(n));
      if (!core) await sleep(500);
    }
    if (!core) throw new Error('找不到遊戲資料檔');
    const V = Object.values(await import(core));
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const find = pred => V.find(v => { try { return pred(v); } catch (e) { return false; } });
    const items = find(v => isObj(v) && v[1101] && 'slot' in v[1101] && 'cardSlots' in v[1101]) || {};
    const cards = find(v => isObj(v) && v[4001] && v[4001].monster) || {};
    // 素材清單（物品名稱、圖示）是遊戲啟動後才下載的，等它載完
    const holder = find(v => isObj(v) && 'manifest' in v && 'icons' in v);
    let man = {};
    for (let i = 0; i < 240; i++) {
      man = (holder && holder.manifest) || {};
      if (man.items && Object.keys(man.items).length) break;
      await sleep(500);
    }
    if (!man.items || !Object.keys(man.items).length) throw new Error('遊戲還沒載入完成，請等標題畫面載完再開 GM 面板');
    const qualities = find(v => Array.isArray(v) && v.length >= 4 && v.every(q => q && 'mult' in q && 'name' in q)) || [];
    const gearSlots = find(v => Array.isArray(v) && v.length >= 8 && v.every(s => s && s.id && s.name && s.gear)) || [];
    const jobCap = find(v => isObj(v) && v[1] === 50 && v[2] === 50 && typeof v[3] === 'number') || { 1: 50, 2: 50, 3: 70 };
    const jobs = [].concat(...V.filter(v => Array.isArray(v) && v.length > 3 && v.every(j => j && j.id && j.name && 'scaling' in j)));
    const settings = find(v => isObj(v) && 'lang' in v && 'master' in v);
    const fnBySrc = part => find(v => typeof v === 'function' && String(v).includes(part));
    const wtypeName = fnBySrc('"otra arma"');     // 武器種類 → 中文（單手劍、短劍…）
    const signature = fnBySrc('★ ');               // 裝備專屬加成（★ 開頭）
    const texts = list => (list || []).map(b => { try { return b.text(1); } catch (e) { return ''; } }).filter(Boolean);
    const slotName = {};
    for (const s of gearSlots) slotName[s.gear] = slotName[s.gear] || s.name;
    const slotOf = s => slotName[s] || (/^acc/.test(s) ? (slotName.acc || slotName.acc1 || '飾品') : /^head/.test(s) ? '頭部' : s);
    const iconOf = id => (man.items && man.items[id] && man.items[id].icon) ? 'assets/' + man.items[id].icon : '';
    // 名稱：GM 面板一律中文（zh.js 的譯名表）；原文留著給搜尋用，打中文或英文都找得到
    const enOf = m => m.nameEN || m.name || '';
    const zhOf = en => (window.__rsZh && en) ? window.__rsZh.name(en) : en;
    const itemList = Object.values(items).map(i => {
      const m = (man.items || {})[i.id] || {};
      // 能力：固定加成＋★ 專屬加成。不顯示 ATK／DEF：遊戲不用資料表的數字，
      // 而是依物品等階、品質、精煉另外算（初始裝備是 0），列出來反而不準。
      const stats = texts(i.bonuses);
      try { if (signature) stats.push(...texts(signature(i.id, 0))); } catch (e) { /* 沒有專屬加成 */ }
      const type = i.wtype && wtypeName ? wtypeName(i.wtype) : slotOf(i.slot);
      const en = enOf(m);
      return { id: i.id, name: zhOf(en) || ('#' + i.id), en, icon: iconOf(i.id), slot: i.slot, slotName: slotOf(i.slot), type, stats };
    }).sort((a, b) => a.id - b.id);
    const cardList = Object.values(cards).map(c => {
      const m = (man.cards || {})[c.id] || {};
      const en = enOf(m);
      return { id: c.id, name: zhOf(en) || ('#' + c.id), en, icon: iconOf(c.id) || (m.image ? 'assets/' + m.image : ''),
        stats: texts(c.bonuses), on: slotOf(c.compound) };
    }).sort((a, b) => a.id - b.id);
    // 物品等階（1～3，越高攻防越高；遊戲的 [{tier, mult, weaponMult}]）
    const tierTable = find(v => Array.isArray(v) && v.length >= 2 && v.every(t => t && typeof t.tier === 'number' && 'weaponMult' in t));
    const tiers = tierTable ? tierTable.map(t => t.tier).sort((a, b) => a - b) : [1, 2, 3];
    D = { itemList, cardList, qualities, jobCap, jobs, settings, slotName, tiers };
    return D;
  }

  /* ---------- 存檔 ---------- */
  const chars = () => (read(K_CHARS) || []).filter(c => c && c.id);
  const acct = () => Object.assign({ inventory: [], cards: {}, kafra: 0, materials: {}, unlocks: [] }, read(K_ACCT) || {});
  function currentCharId() {
    const list = chars();
    const sel = $('#gm-char');
    if (sel && sel.value) return sel.value;
    const top = (document.body.innerText || '').slice(0, 300);
    const hit = list.find(c => top.includes(c.name));
    return (hit || list[0] || {}).id;
  }
  function jobMax(c) {
    const j = D.jobs.find(x => x.id === (c.promotion || c.job)) || D.jobs.find(x => x.id === c.job);
    return D.jobCap[(j && j.rank) || 1] || 50;
  }
  function applyAndReload(mutate) {
    if (inRun()) return alert('遊戲局進行中不能改存檔，請先結束這局、回到城鎮再改。（金幣可以在遊戲局中改）');
    const a = acct(), cs = chars();
    mutate(a, cs);
    write(K_ACCT, a);
    write(K_CHARS, cs);
    try { sessionStorage.setItem(K_REENTER, currentCharId() || '1'); } catch (e) { /* 無痕模式 */ }
    location.reload();
  }

  /* ---------- 樣式 ---------- */
  const css = `
#gm-fab{position:fixed;right:14px;bottom:14px;z-index:2147483000;background:#c0392b;color:#fff;border:2px solid #fff;border-radius:50%;width:52px;height:52px;font:800 15px/1 sans-serif;cursor:pointer;box-shadow:0 2px 10px #0008}
#gm-fab:hover{background:#e74c3c}
.gm-inline{margin-left:8px;background:#c0392b;color:#fff;border:1px solid #fff8;border-radius:6px;padding:1px 8px;font:700 12px sans-serif;cursor:pointer;vertical-align:middle}
#gm-panel{position:fixed;inset:0;z-index:2147483001;background:#0009;display:flex;align-items:center;justify-content:center;font:14px/1.5 "Segoe UI","Microsoft JhengHei",sans-serif;color:#eef3fb}
#gm-panel .box{background:#1b2740;border:2px solid #c0392b;border-radius:12px;width:min(760px,96vw);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 6px 30px #000a}
#gm-panel .hd{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #34476e}
#gm-panel .hd b{font-size:17px;color:#ff8a7a}
#gm-panel .hd .x{margin-left:auto;background:none;border:0;color:#fff;font-size:22px;cursor:pointer}
#gm-panel .tabs{display:flex;gap:4px;padding:8px 14px 0;flex-wrap:wrap}
#gm-panel .tabs button{background:#24345a;color:#cfe0ff;border:1px solid #34476e;border-bottom:0;border-radius:8px 8px 0 0;padding:6px 14px;cursor:pointer;font:inherit}
#gm-panel .tabs button.on{background:#c0392b;color:#fff;border-color:#c0392b}
#gm-panel .bd{padding:12px 14px;overflow:auto;flex:1;border-top:1px solid #34476e}
#gm-panel .ft{padding:10px 14px;border-top:1px solid #34476e;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#gm-panel input,#gm-panel select{background:#0f182b;color:#fff;border:1px solid #3b5282;border-radius:6px;padding:5px 8px;font:inherit}
#gm-panel input[type=number]{width:90px}
#gm-panel .btn{background:#2f6fd6;color:#fff;border:0;border-radius:6px;padding:7px 14px;cursor:pointer;font:700 14px sans-serif}
#gm-panel .btn.red{background:#c0392b}#gm-panel .btn.gray{background:#4a5878}
#gm-panel .btn:disabled{opacity:.45;cursor:not-allowed}
#gm-panel .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}
#gm-panel .list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px;max-height:42vh;overflow:auto;margin-top:8px}
#gm-panel .it{display:flex;gap:8px;align-items:center;padding:4px 6px;border:1px solid #2c3d63;border-radius:6px;cursor:pointer;background:#16213a}
#gm-panel .it:hover{border-color:#6f9cff}#gm-panel .it.on{border-color:#ff8a7a;background:#3a2330}
#gm-panel .it img{width:28px;height:28px;object-fit:contain;image-rendering:pixelated}
#gm-panel .it small{display:block;color:#93a6c9;font-size:12px}
#gm-panel input.power{width:150px;background:#0b1220;border-color:#2c3d63;color:#ffd77a;font-weight:700;cursor:default}
#gm-panel .muted{color:#93a6c9;font-size:13px}
#gm-panel .warn{color:#ffcf5c}
#gm-panel .pend{display:flex;gap:6px;flex-wrap:wrap}
#gm-panel .pend span{background:#24345a;border-radius:6px;padding:2px 8px;font-size:13px}
#gm-panel .pend span button{background:none;border:0;color:#ff8a7a;cursor:pointer;margin-left:4px}
#gm-panel table{border-collapse:collapse}#gm-panel td{padding:4px 8px}
@media (max-width:600px){#gm-panel .list{grid-template-columns:1fr}}
`;

  /* ---------- 面板 ---------- */
  let tab = 'items', pick = null, pickCard = null;
  const opt = { tier: 1, quality: 0, refine: 0, count: 1 };   // 創造裝備的選項（重畫時保留）

  function charSelect() {
    const id = currentCharId();
    return `<label>角色 <select id="gm-char">${chars().map(c => `<option value="${esc(c.id)}"${c.id === id ? ' selected' : ''}>${esc(c.name)}（Lv ${c.level}）</option>`).join('')}</select></label>`;
  }

  function renderItems() {
    const q = ($('#gm-q') || {}).value || '';
    const slot = ($('#gm-slot') || {}).value || '';
    const kw = q.trim().toLowerCase();
    const list = D.itemList.filter(i => (!slot || i.slotName === slot) && (!kw || [i.name, i.en, i.id, i.type, ...i.stats].join(' ').toLowerCase().includes(kw)));
    const slots = [...new Set(D.itemList.map(i => i.slotName))];
    return `
<div class="row"><input id="gm-q" placeholder="搜尋名稱（中英文都可以）、能力或種類（例如 太刀、Katana、爆擊、短劍）" value="${esc(q)}" style="flex:1;min-width:180px">
<select id="gm-slot"><option value="">全部部位</option>${slots.map(s => `<option${s === slot ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
<div class="list">${list.map(i => `<div class="it${pick === i.id ? ' on' : ''}" data-item="${i.id}">${i.icon ? `<img src="${esc(i.icon)}" alt="">` : ''}<div>${esc(i.name)}<small>${[...i.stats, i.type].map(esc).join(' / ')}</small></div></div>`).join('') || '<div class="muted">找不到</div>'}</div>
<div class="row" style="margin-top:10px">
  <b>${pick ? esc((D.itemList.find(i => i.id === pick) || {}).name) : '先點上面的物品'}</b>
  <label>等階 <select id="gm-tier">${D.tiers.map(t => `<option value="${t}"${t === opt.tier ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
  <label>品質 <select id="gm-quality">${D.qualities.map((x, i) => `<option value="${i}"${i === opt.quality ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
  <label>精煉 +<input id="gm-refine" type="number" min="0" max="${LIMIT.refine}" value="${opt.refine}"></label>
  <label>數量 <input id="gm-count" type="number" min="1" max="50" value="${opt.count}"></label>
  <label>攻／防 <input id="gm-power" class="power" readonly tabindex="-1" value="${esc(powerText())}"></label>
</div>
<div class="row"><button class="btn" id="gm-add-item"${pick ? '' : ' disabled'}>加入待創造清單</button></div>
<p class="muted">攻／防是用遊戲本身的公式依等階、品質、精煉算出來的（初始裝備固定是 0）。附加能力（詞綴）會由遊戲依等階和品質自動產生。卡片請到「卡片」分頁創造，再用遊戲內的鑲嵌功能裝上。</p>`;
  }

  /* 攻／防：呼叫遊戲自己的計算函式（GM 模式由伺服器把它交出來，見 rs_offline.py 的 GM_PATCHES） */
  function powerText() {
    if (!pick) return '';
    const calc = window.__gmHa;
    if (typeof calc !== 'function') return '這版遊戲無法計算';
    try {
      const r = calc({ uid: 'gm', itemId: pick, cards: [], quality: opt.quality, tier: opt.tier, refine: opt.refine }, opt.refine);
      const it = D.itemList.find(i => i.id === pick) || {};
      if (it.slot === 'weapon') return 'ATK ' + r.atk + (r.matk ? ' / MATK ' + r.matk : '');
      return 'DEF ' + r.def;
    } catch (e) {
      return '無法計算';
    }
  }

  function renderCards() {
    const q = ($('#gm-cq') || {}).value || '';
    const kw = q.trim().toLowerCase();
    const list = D.cardList.filter(c => !kw || [c.name, c.en, c.id, c.on, ...c.stats].join(' ').toLowerCase().includes(kw));
    return `
<div class="row"><input id="gm-cq" placeholder="搜尋卡片名稱（中英文都可以）、能力或部位（例如 波利、Poring、爆擊、護甲）" value="${esc(q)}" style="flex:1"></div>
<div class="list">${list.map(c => `<div class="it${pickCard === c.id ? ' on' : ''}" data-card="${c.id}">${c.icon ? `<img src="${esc(c.icon)}" alt="">` : ''}<div>${esc(c.name)}<small>${[...c.stats, c.on].filter(Boolean).map(esc).join(' / ')}</small></div></div>`).join('') || '<div class="muted">找不到</div>'}</div>
<div class="row" style="margin-top:10px"><b>${pickCard ? esc((D.cardList.find(c => c.id === pickCard) || {}).name) : '先點上面的卡片'}</b>
<label>數量 <input id="gm-ccount" type="number" min="1" max="99" value="1"></label>
<button class="btn" id="gm-add-card"${pickCard ? '' : ' disabled'}>加入待創造清單</button></div>`;
  }

  function renderStats() {
    const c = chars().find(x => x.id === currentCharId());
    if (!c) return '<p class="muted">還沒有角色，請先在遊戲裡建立角色。</p>';
    const jm = jobMax(c);
    return `
<div class="row">${charSelect()}</div>
<table>
<tr><td>Base Lv</td><td><input id="gm-lv" type="number" min="1" max="${LIMIT.level}" value="${c.level}"> <span class="muted">1～${LIMIT.level}</span></td></tr>
<tr><td>職業 Lv</td><td><input id="gm-jlv" type="number" min="1" max="${jm}" value="${c.jobLevel}"> <span class="muted">1～${jm}（天賦點數跟著職業等級）</span></td></tr>
${STATS.map(([k, n]) => `<tr><td>${n}</td><td><input class="gm-st" data-k="${k}" type="number" min="1" max="${LIMIT.stat}" value="${(c.stats || {})[k] || 1}"></td></tr>`).join('')}
</table>
<div class="row"><button class="btn gray" id="gm-all99">素質全部 99</button><button class="btn gray" id="gm-max">等級全滿</button></div>
<p class="muted">素質上限 ${LIMIT.stat}（遊戲本身的上限）。${status.statCheck ? 'GM 模式已解除「素質點數不夠就重置」的檢查，可以超過正常可分配的點數。' : '<span class="warn">這版遊戲找不到素質點數檢查，超過可分配點數時遊戲可能會把素質重置。</span>'}</p>
<div class="row"><button class="btn red" id="gm-apply-stats">套用（會重新載入）</button></div>`;
  }

  function renderMoney() {
    const a = acct();
    const g = window.__gmGame;
    const run = inRun() && g && typeof g.zeny === 'number';
    return `
<h3 style="margin:4px 0">卡普拉點數</h3>
<div class="row"><input id="gm-kafra" type="number" min="0" max="${LIMIT.kafra}" value="${a.kafra || 0}"><button class="btn red" id="gm-apply-kafra">套用（會重新載入）</button></div>
<p class="muted">帳號共用的點數（寵物飾品、重置天賦等都用它）。</p>
<h3 style="margin:16px 0 4px">金幣（zeny，遊戲局中）</h3>
${run ? `<div class="row"><input id="gm-zeny" type="number" min="0" max="${LIMIT.zeny}" value="${g.zeny}"><button class="btn" id="gm-apply-zeny">立即修改</button></div>
<p class="muted">金幣只在這一局有效，用來開寶箱；馬上生效，不用重新載入。</p>`
    : `<p class="muted">金幣是每一局重新計算的，${status.game ? '進入遊戲局之後再打開 GM 面板就能修改。' : '<span class="warn">這版遊戲找不到遊戲局的資料，無法修改金幣。</span>'}</p>`}`;
  }

  function render() {
    const p = $('#gm-panel');
    if (!p) return;
    const body = tab === 'items' ? renderItems() : tab === 'cards' ? renderCards() : tab === 'stats' ? renderStats() : renderMoney();
    $('.bd', p).innerHTML = body;
    p.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const pend = $('#gm-pend', p);
    pend.innerHTML = pending.length ? pending.map((x, i) => `<span>${esc(x.label)}<button data-del="${i}" title="移除">✕</button></span>`).join('') : '<span class="muted" style="background:none">待創造清單是空的</span>';
    $('#gm-create', p).disabled = !pending.length;
    bind(p);
  }

  function bind(p) {
    const on = (sel, ev, fn) => { const el = $(sel, p); if (el) el[ev] = fn; };
    on('#gm-q', 'oninput', () => { const pos = $('#gm-q').selectionStart; render(); const q = $('#gm-q'); q.focus(); q.setSelectionRange(pos, pos); });
    on('#gm-cq', 'oninput', () => { const pos = $('#gm-cq').selectionStart; render(); const q = $('#gm-cq'); q.focus(); q.setSelectionRange(pos, pos); });
    on('#gm-slot', 'onchange', render);
    on('#gm-char', 'onchange', render);
    p.querySelectorAll('[data-item]').forEach(el => el.onclick = () => { pick = Number(el.dataset.item); keep(render); });
    p.querySelectorAll('[data-card]').forEach(el => el.onclick = () => { pickCard = Number(el.dataset.card); keep(render); });
    p.querySelectorAll('[data-del]').forEach(el => el.onclick = () => { pending.splice(Number(el.dataset.del), 1); render(); });
    // 等階／品質／精煉／數量：記住選擇，攻防即時更新（不整個重畫，免得輸入框失焦）
    const readOpt = () => {
      opt.tier = clamp(($('#gm-tier', p) || {}).value, D.tiers[0], D.tiers[D.tiers.length - 1]);
      opt.quality = clamp(($('#gm-quality', p) || {}).value, 0, D.qualities.length - 1);
      opt.refine = clamp(($('#gm-refine', p) || {}).value, 0, LIMIT.refine);
      opt.count = clamp(($('#gm-count', p) || {}).value, 1, 50);
      const pw = $('#gm-power', p);
      if (pw) pw.value = powerText();
    };
    ['#gm-tier', '#gm-quality', '#gm-refine', '#gm-count'].forEach(s => { on(s, 'onchange', readOpt); on(s, 'oninput', readOpt); });
    on('#gm-add-item', 'onclick', () => {
      const it = D.itemList.find(i => i.id === pick); if (!it) return;
      readOpt();
      const { tier, quality, refine, count } = opt;
      pending.push({ kind: 'item', id: it.id, tier, quality, refine, count,
        label: `${refine ? '+' + refine + ' ' : ''}${it.name}（等階 ${tier}・${(D.qualities[quality] || {}).name || ''}）×${count}` });
      keep(render);
    });
    on('#gm-add-card', 'onclick', () => {
      const c = D.cardList.find(x => x.id === pickCard); if (!c) return;
      const count = clamp($('#gm-ccount').value, 1, 99);
      pending.push({ kind: 'card', id: c.id, count, label: `${c.name} ×${count}` });
      keep(render);
    });
    on('#gm-all99', 'onclick', () => p.querySelectorAll('.gm-st').forEach(i => i.value = LIMIT.stat));
    on('#gm-max', 'onclick', () => { $('#gm-lv').value = LIMIT.level; $('#gm-jlv').value = $('#gm-jlv').max; });
    on('#gm-apply-stats', 'onclick', () => {
      const id = currentCharId();
      const lv = clamp($('#gm-lv').value, 1, LIMIT.level);
      const jlv = clamp($('#gm-jlv').value, 1, Number($('#gm-jlv').max) || 50);
      const st = {};
      p.querySelectorAll('.gm-st').forEach(i => st[i.dataset.k] = clamp(i.value, 1, LIMIT.stat));
      applyAndReload((a, cs) => {
        const c = cs.find(x => x.id === id); if (!c) return;
        c.level = lv; c.exp = 0; c.jobLevel = jlv; c.jobExp = 0;
        c.stats = Object.assign({}, c.stats, st);
      });
    });
    on('#gm-apply-kafra', 'onclick', () => {
      const v = clamp($('#gm-kafra').value, 0, LIMIT.kafra);
      applyAndReload(a => { a.kafra = v; });
    });
    on('#gm-apply-zeny', 'onclick', () => {
      const g = window.__gmGame;
      if (!g || !inRun()) return alert('現在不在遊戲局中。');
      g.zeny = clamp($('#gm-zeny').value, 0, LIMIT.zeny);
      toast('金幣已改成 ' + g.zeny);
    });
  }

  /* 重畫時保留清單捲動位置 */
  function keep(fn) {
    const l = $('#gm-panel .list'); const y = l ? l.scrollTop : 0;
    fn();
    const l2 = $('#gm-panel .list'); if (l2) l2.scrollTop = y;
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483002;background:#c0392b;color:#fff;padding:8px 16px;border-radius:8px;font:700 14px sans-serif';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  async function open(which) {
    if (which) tab = which;
    try { await loadData(); } catch (e) { return alert('GM 模式載入失敗：' + e.message); }
    let p = $('#gm-panel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'gm-panel';
      p.innerHTML = `<div class="box">
<div class="hd"><b>GM 模式</b><span class="muted">只改離線存檔，跟官網帳號無關</span><button class="x" title="關閉">✕</button></div>
<div class="tabs"><button data-tab="items">創造裝備</button><button data-tab="cards">創造卡片</button><button data-tab="stats">等級與素質</button><button data-tab="money">點數與金幣</button></div>
<div class="bd"></div>
<div class="ft"><b>待創造：</b><div class="pend" id="gm-pend" style="flex:1"></div><button class="btn red" id="gm-create">創造（會重新載入）</button></div>
</div>`;
      document.body.appendChild(p);
      // 面板裡打字不要觸發遊戲快捷鍵（C、空白鍵等）
      ['keydown', 'keyup', 'keypress'].forEach(t => p.addEventListener(t, e => { if (e.key !== 'Escape') e.stopPropagation(); else close(); }));
      ['pointerdown', 'mousedown', 'wheel'].forEach(t => p.addEventListener(t, e => e.stopPropagation()));
      p.addEventListener('click', e => { if (e.target === p) close(); });
      $('.x', p).onclick = close;
      p.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
      $('#gm-create', p).onclick = () => {
        if (!pending.length) return;
        const list = pending.slice();
        applyAndReload(a => {
          for (const x of list) {
            for (let i = 0; i < x.count; i++) {
              if (x.kind === 'item') {
                const it = { uid: uid(), itemId: x.id, cards: [], isNew: true };
                if (x.quality) it.quality = x.quality;
                if (x.refine) it.refine = x.refine;
                if (x.tier) it.tier = x.tier;
                a.inventory.push(it);
              } else {
                a.cards[x.id] = (a.cards[x.id] || 0) + 1;
              }
            }
          }
          pending = [];
        });
      };
    }
    p.style.display = 'flex';
    render();
  }
  function close() { const p = $('#gm-panel'); if (p) p.style.display = 'none'; }

  /* ---------- 掛按鈕 ---------- */
  function addInline(boxSel, label, which) {
    const title = $(boxSel + ' .box-title');
    if (!title || title.querySelector('.gm-inline')) return;
    const b = document.createElement('button');
    b.className = 'gm-inline';
    b.textContent = label;
    b.onclick = e => { e.stopPropagation(); open(which); };
    title.appendChild(b);
  }
  function hook() {
    addInline('#cp-tab-inv', '＋ 創造', 'items');
    addInline('#cp-tab-cards', '＋ 創造', 'cards');
    const st = $('#cp-tab-stats');
    if (st && !st.querySelector('.gm-inline')) {
      const b = document.createElement('button');
      b.className = 'gm-inline';
      b.textContent = 'GM 修改等級與素質';
      b.style.margin = '6px 0';
      b.onclick = e => { e.stopPropagation(); open('stats'); };
      st.prepend(b);
    }
  }

  /* ---------- 重新載入後自動回到角色 ---------- */
  async function reenter() {
    let id = null;
    try { id = sessionStorage.getItem(K_REENTER); sessionStorage.removeItem(K_REENTER); } catch (e) { return; }
    if (!id) return;
    const c = chars().find(x => x.id === id);
    const clickText = (t, root = document) => {
      const el = [...root.querySelectorAll('button,div,span')].filter(x => x.textContent.trim() === t && isVisible(x)).pop();
      if (el) el.click();
      return !!el;
    };
    for (let i = 0; i < 120 && !clickText('開始遊戲！') && !clickText('¡Jugar!') && !clickText('Play!'); i++) await sleep(500);
    await sleep(800);
    if (c) {
      const cs = $('#charselect') || document;
      const el = [...cs.querySelectorAll('*')].filter(x => isVisible(x) && x.children.length <= 3 && x.textContent.trim().startsWith(c.name)).pop();
      if (el) el.click();
      await sleep(400);
    }
    clickText('開始') || clickText('Empezar') || clickText('Start');
    toast('GM 修改已套用');
  }

  /* ---------- 啟動 ---------- */
  function start() {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
    const fab = document.createElement('button');
    fab.id = 'gm-fab';
    fab.textContent = 'GM';
    fab.title = 'GM 面板';
    fab.onclick = () => open();
    document.body.appendChild(fab);
    let queued = false;   // 遊戲畫面一直在變，合併成每個畫格最多檢查一次
    new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; hook(); }); } })
      .observe(document.body, { childList: true, subtree: true });
    hook();
    fetch('/__gm_status.json').then(r => r.json()).then(j => { status = j || {}; }).catch(() => {});
    loadData().catch(() => {});
    reenter();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
