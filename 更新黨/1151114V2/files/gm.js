/* 網頁奇岩城（Lineage 3.5C）離線版：GM 模式面板（只在「以GM模式開始遊戲.bat」載入）
   - 右下角紅色「GM」懸浮按鈕開啟 GM 控制面板
   - 支援創造任何武器、防具、飾品、藥水、卷軸與材料（可自訂強化 +0～+15、祝福狀態、數量）
   - 支援修改角色等級、六圍屬性（STR/DEX/CON/INT/WIS/CHA）、金幣、一鍵學會全魔法、一鍵解鎖全魔法娃娃
   - 支援戰鬥作弊開關：無敵模式（不扣血＋衝裝 100% 過）、一擊必殺、經驗倍率（1x～100x）、掉寶倍率（1x～50x）
   - 支援在遊戲內聊天框直接輸入「.道具名稱」（例如 .克特之劍）呼叫遊戲內建的建立物品視窗 */
(function () {
  'use strict';
  window.__GM_ENABLED = true;

  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));

  const STATS = [
    ['str', '力量 STR'], ['dex', '敏捷 DEX'], ['con', '體質 CON'],
    ['int', '智力 INT'], ['wis', '精神 WIS'], ['cha', '魅力 CHA']
  ];

  // 尺寸配合遊戲的 4:3 舞台（js/stage.js）：電腦版 body 排成 800×600 再整個等比例放大，
  //   所以這裡的 px 都是「舞台像素」（跟遊戲內視窗一樣大小），寬高不能用 vw／vh（那是真實視窗，會超出舞台、被放大兩次），
  //   改用 calc(var(--vw1, 1vw) * N)、calc(var(--vh1, 1vh) * N)：鎖舞台時＝800／600 的 1%，手機直式沒鎖時＝原本的 vw／vh
  const css = `
#gm-fab{position:fixed;right:8px;bottom:64px;z-index:2147483000;background:linear-gradient(135deg,#c0392b,#8e1e14);color:#ffd77a;border:1px solid #ffd77a;border-radius:50%;width:32px;height:32px;padding:0;font:800 11px/1 "Microsoft JhengHei",sans-serif;cursor:pointer;box-shadow:0 2px 6px #000b;transition:transform .15s}
#gm-fab:hover{transform:scale(1.08);background:linear-gradient(135deg,#e74c3c,#a82315)}
#gm-panel{position:fixed;inset:0;z-index:2147483001;background:#000a;display:flex;align-items:center;justify-content:center;font:12px/1.4 "Segoe UI","Microsoft JhengHei",sans-serif;color:#f3ece0}
#gm-panel .box{background:#161311;border:1px solid #c89b3c;border-radius:8px;width:min(580px,calc(var(--vw1,1vw)*96));max-height:calc(var(--vh1,1vh)*94);display:flex;flex-direction:column;box-shadow:0 4px 20px #000e;box-sizing:border-box}
#gm-panel .hd{display:flex;align-items:center;gap:8px;padding:5px 10px;border-bottom:1px solid #3c3123;background:#211c17;border-radius:7px 7px 0 0}
#gm-panel .hd b{font-size:13px;color:#ffd77a;letter-spacing:.3px}
#gm-panel .hd .x{margin-left:auto;background:none;border:0;color:#d4c4a8;font-size:16px;line-height:1;padding:0 2px;cursor:pointer}
#gm-panel .tabs{display:flex;gap:4px;padding:5px 10px 0;background:#1b1713;flex-wrap:wrap}
#gm-panel .tabs button{background:#28221c;color:#c7b698;border:1px solid #443726;border-bottom:0;border-radius:6px 6px 0 0;padding:3px 9px;cursor:pointer;font:700 11.5px "Microsoft JhengHei",sans-serif}
#gm-panel .tabs button.on{background:#8e2a1d;color:#ffd77a;border-color:#c89b3c}
#gm-panel .bd{padding:8px 10px;overflow:auto;flex:1;min-height:0;border-top:1px solid #443726}
#gm-panel input,#gm-panel select{background:#0e0c0a;color:#fff;border:1px solid #574631;border-radius:4px;padding:2px 5px;font:inherit}
#gm-panel input[type=number]{width:62px}
#gm-panel input[type=checkbox]{padding:0;margin:0 2px 0 0;vertical-align:-2px}
#gm-panel .btn{background:#295ea8;color:#fff;border:1px solid #5288d4;border-radius:4px;padding:3px 8px;cursor:pointer;font:700 11.5px "Microsoft JhengHei",sans-serif}
#gm-panel .btn:hover{filter:brightness(1.12)}
#gm-panel .btn.gold{background:linear-gradient(180deg,#b8862d,#7d5614);border-color:#e6bd64;color:#fff8e6}
#gm-panel .btn.red{background:linear-gradient(180deg,#b83227,#7c1c14);border-color:#e06358}
#gm-panel .btn.green{background:linear-gradient(180deg,#268246,#16522b);border-color:#52b874}
#gm-panel .row{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin:5px 0}
#gm-panel .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px;max-height:calc(var(--vh1,1vh)*34);overflow:auto;margin-top:5px;padding:1px}
#gm-panel .it{display:flex;gap:6px;align-items:center;padding:3px 6px;border:1px solid #382e22;border-radius:4px;cursor:pointer;background:#1e1915}
#gm-panel .it:hover{border-color:#c89b3c;background:#29221b}
#gm-panel .it.on{border-color:#ffd77a;background:#3b2818;box-shadow:inset 0 0 6px #ffd77a33}
#gm-panel .it small{display:block;color:#a8987d;font-size:10.5px}
#gm-panel .card{background:#1f1a15;border:1px solid #3c3123;border-radius:6px;padding:6px 8px;margin-bottom:6px}
#gm-panel .card h4{margin:0 0 3px;color:#ffd77a;font-size:12px}
#gm-panel .muted{color:#9e8f77;font-size:11px}
#gm-panel .toast{margin-left:auto;color:#7ee787;font-weight:700;font-size:11.5px}
`;

  let tab = 'cheat';
  let pickId = 54; // 預設克特之劍
  let opt = { q: '', cat: 'all', ench: 9, count: 1, bless: 0 };
  let toastText = '';
  let toastTimer = 0;

  function srv() { return window.__offlineServer || null; }
  function ch() { const s = srv(); return s ? s.curChar : null; }

  function showMsg(msg) {
    toastText = msg;
    clearTimeout(toastTimer);
    const el = $('#gm-toast');
    if (el) el.textContent = msg;
    toastTimer = setTimeout(() => {
      toastText = '';
      const e2 = $('#gm-toast');
      if (e2) e2.textContent = '';
    }, 3500);
  }

  function getItemCatalog() {
    const s = srv();
    if (!s || !s.data || !s.data.itemsById) return [];
    const out = [];
    for (const [id, info] of s.data.itemsById.entries()) {
      const t = info.tpl || {};
      const cat = t.k === 'w' ? 'w' : t.k === 'a' ? 'a' : 'e';
      const catName = t.k === 'w' ? '武器' : t.k === 'a' ? '防具/飾品' : '道具/卷軸/藥水';
      out.push({ id, name: info.name || ('#' + id), cat, catName, tpl: t });
    }
    return out;
  }

  function renderCheat() {
    const s = srv(), c = ch();
    if (!s || !c) {
      return '<div class="card"><h4>請先登入並選擇角色進入遊戲世界</h4><p class="muted">進入奇岩城或銀騎士村後，即可隨時即時修改角色等級、金幣、技能、裝備強化與倍率。</p></div>';
    }
    const r = s.gmRates;
    return `
<div class="card">
  <h4>⚡ 快速作弊捷徑（目前角色：${esc(c.name)} Lv.${c.level}）</h4>
  <div class="row">
    <button class="btn gold" data-act="lv1">升 1 級</button>
    <button class="btn gold" data-act="lv10">升 10 級</button>
    <button class="btn gold" data-act="lv99">直升 Lv.99</button>
    <button class="btn green" data-act="heal">滿血滿魔</button>
    <button class="btn" data-act="buff">全套神級狀態 (30分)</button>
  </div>
  <div class="row">
    <button class="btn gold" data-act="gold100w">金幣 +100萬</button>
    <button class="btn gold" data-act="gold1000w">金幣 +1,000萬</button>
    <button class="btn" data-act="allmagic">一鍵學會全魔法 (145種)</button>
    <button class="btn" data-act="alldolls">解鎖全魔法娃娃圖鑑</button>
  </div>
</div>

<div class="card">
  <h4>🛡️ 戰鬥與衝裝特權開關</h4>
  <div class="row">
    <label style="cursor:pointer"><input type="checkbox" id="gm-god" ${r.godMode ? 'checked' : ''}> <b>無敵模式</b>（怪物打不痛＋卷軸強化 100% 成功）</label>
    <label style="cursor:pointer;margin-left:14px"><input type="checkbox" id="gm-onehit" ${r.oneHit ? 'checked' : ''}> <b>一擊必殺</b>（普攻／技能秒殺怪物）</label>
  </div>
  <div class="row">
    <label>經驗倍率 <select id="gm-exp">${[1, 2, 5, 10, 20, 50, 100].map(v => `<option value="${v}"${r.exp === v ? ' selected' : ''}>${v} 倍</option>`).join('')}</select></label>
    <label>掉寶倍率 <select id="gm-drop">${[1, 2, 5, 10, 20, 50].map(v => `<option value="${v}"${r.drop === v ? ' selected' : ''}>${v} 倍</option>`).join('')}</select></label>
    <label>金幣倍率 <select id="gm-goldrate">${[1, 2, 5, 10, 20, 50].map(v => `<option value="${v}"${r.gold === v ? ' selected' : ''}>${v} 倍</option>`).join('')}</select></label>
  </div>
</div>

<div class="card">
  <h4>⚔️ 全身已穿戴裝備一鍵強化</h4>
  <div class="row">
    <button class="btn" data-ench-all="6">全身 +6</button>
    <button class="btn" data-ench-all="9">全身 +9</button>
    <button class="btn gold" data-ench-all="12">全身 +12</button>
    <button class="btn red" data-ench-all="15">全身 +15 (祝福)</button>
  </div>
  <div class="muted">點擊後會直接把目前穿在身上的武器、防具與飾品改為指定強化值並賦予祝福光效。</div>
</div>`;
  }

  function renderItems() {
    const s = srv(), c = ch();
    if (!s || !c) return '<div class="card"><h4>請先進入遊戲世界再發送道具</h4></div>';
    const all = getItemCatalog();
    const kw = opt.q.trim().toLowerCase();
    const filtered = all.filter(x => (opt.cat === 'all' || x.cat === opt.cat) && (!kw || x.name.toLowerCase().includes(kw) || String(x.id) === kw)).slice(0, 120);
    const picked = all.find(x => x.id === pickId) || filtered[0];
    if (picked) pickId = picked.id;

    return `
<div class="row">
  <input id="gm-q" placeholder="搜尋道具名稱或編號（例：克特、執行、卷軸、藥水、40087）" value="${esc(opt.q)}" style="flex:1;min-width:200px">
  <select id="gm-cat">
    <option value="all"${opt.cat === 'all' ? ' selected' : ''}>全部類別</option>
    <option value="w"${opt.cat === 'w' ? ' selected' : ''}>武器</option>
    <option value="a"${opt.cat === 'a' ? ' selected' : ''}>防具／飾品</option>
    <option value="e"${opt.cat === 'e' ? ' selected' : ''}>道具／卷軸／藥水</option>
  </select>
</div>
<div class="grid">
  ${filtered.map(x => `<div class="it${x.id === pickId ? ' on' : ''}" data-item="${x.id}"><div><b>${esc(x.name)}</b><small>#${x.id}・${esc(x.catName)}</small></div></div>`).join('') || '<div class="muted">找不到符合的道具</div>'}
</div>
<div class="card" style="margin-top:10px;margin-bottom:0">
  <div class="row">
    <b>已選：${picked ? esc(picked.name) + ' (#' + picked.id + ')' : '請先點選上方道具'}</b>
    <label>強化 +<input id="gm-ench" type="number" min="0" max="15" value="${opt.ench}"></label>
    <label>狀態 <select id="gm-bless"><option value="0"${opt.bless === 0 ? ' selected' : ''}>祝福的</option><option value="1"${opt.bless === 1 ? ' selected' : ''}>一般</option></select></label>
    <label>數量 <input id="gm-cnt" type="number" min="1" max="99999" value="${opt.count}"></label>
    <button class="btn gold" id="gm-give"${picked ? '' : ' disabled'}>立即發送到背包</button>
  </div>
  <div class="muted">提示：也可以直接在遊戲聊天框輸入「<b>.道具名稱</b>」（例如 <code>.裁決之劍</code>）開啟遊戲原生的建立物品視窗！</div>
</div>`;
  }

  function renderStats() {
    const s = srv(), c = ch();
    if (!s || !c) return '<div class="card"><h4>請先進入遊戲世界再修改能力值</h4></div>';
    return `
<div class="card">
  <h4>📊 角色等級與六圍素質修改（立即生效，無須重載）</h4>
  <div class="row">
    <label>等級 Lv <input id="gm-st-lv" type="number" min="1" max="99" value="${c.level}"></label>
    <label>最大 HP <input id="gm-st-hp" type="number" min="50" max="30000" value="${c.baseMaxHp || c.maxHp}"></label>
    <label>最大 MP <input id="gm-st-mp" type="number" min="20" max="30000" value="${c.baseMaxMp || c.maxMp}"></label>
    <label>正義值 <input id="gm-st-law" type="number" min="-32768" max="32767" value="${c.lawful || 0}"></label>
  </div>
  <div class="row">
    ${STATS.map(([k, label]) => `<label>${label} <input class="gm-stat-in" data-k="${k}" type="number" min="8" max="9999" value="${c[k] || 12}"></label>`).join('')}
  </div>
  <div class="row" style="margin-top:12px">
    <button class="btn" id="gm-stat-35">六圍全 35</button>
    <button class="btn gold" id="gm-stat-50">六圍全滿 50</button>
    <button class="btn red" id="gm-stat-save">套用素質修改</button>
  </div>
</div>`;
  }

  function render() {
    const p = $('#gm-panel');
    if (!p) return;
    $('.bd', p).innerHTML = tab === 'cheat' ? renderCheat() : tab === 'items' ? renderItems() : renderStats();
    p.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    bind(p);
  }

  function bind(p) {
    const s = srv(), c = ch();
    p.querySelectorAll('[data-act]').forEach(btn => {
      btn.onclick = () => {
        if (!s || !c) return;
        const act = btn.dataset.act;
        if (act === 'lv1') { s.levelUpTo(Math.min(99, c.level + 1)); showMsg('已升 1 級！'); }
        else if (act === 'lv10') { s.levelUpTo(Math.min(99, c.level + 10)); showMsg('已升 10 級！'); }
        else if (act === 'lv99') { s.levelUpTo(99); showMsg('已直升 Lv.99！'); }
        else if (act === 'heal') {
          c.hp = c.maxHp; c.mp = c.maxMp;
          s.sendOwnStatus();
          s.emit('effect', { id: c.id, gfx: 830 });
          showMsg('體力與魔力已完全恢復！');
        } else if (act === 'buff') {
          for (const sid of [43, 79, 151, 158, 160, 115, 148, 149]) s.addEffect(sid, 1800);
          s.addEffect(1027, 1800);
          s.emit('haste', { id: c.id, type: 1, time: 1800 });
          s.emit('liquor', { id: c.id, type: 8 });
          s.emit('effect', { id: c.id, gfx: 830 });
          showMsg('已施加全套神級增益＋三段加速！');
        } else if (act === 'gold100w') {
          s.giveItem(40308, 1000000); s.save(); showMsg('已發送 100 萬金幣！');
        } else if (act === 'gold1000w') {
          s.giveItem(40308, 10000000); s.save(); showMsg('已發送 1,000 萬金幣！');
        } else if (act === 'allmagic') {
          s.learnAllMagic(); showMsg('已學會全部 145 種魔法！');
        } else if (act === 'alldolls') {
          if (!c.dolls) c.dolls = { worn: 1, bag: 20, box: 10, bag2: 10, own: {}, seen: [] };
          for (const d of s.data.dolls) {
            c.dolls.own[d.id] = Math.max(2, c.dolls.own[d.id] || 0);
            if (!c.dolls.seen.includes(d.id)) c.dolls.seen.push(d.id);
          }
          c.dolls.bag = (c.dolls.bag || 0) + 20;
          c.dolls.box = (c.dolls.box || 0) + 10;
          s.sendDolls(); s.save();
          showMsg('已解鎖全 50 種魔法娃娃與圖鑑！');
        }
        render();
      };
    });

    p.querySelectorAll('[data-ench-all]').forEach(btn => {
      btn.onclick = () => {
        if (!s || !c) return;
        const lv = +btn.dataset.enchAll;
        for (const it of c.inv || []) {
          if (it.equipped) {
            it.ench = lv;
            it.bless = 0;
            it.name = s.formatItemName(it);
            s.emit('invUpdate', Object.assign({}, it));
            s.emit('itemColor', { id: it.id, bless: 0 });
          }
        }
        s.recalcStats();
        s.sendOwnStatus();
        s.sendSpMr();
        s.save();
        showMsg('全身穿戴裝備已強化至 +' + lv + '（祝福）！');
      };
    });

    const godEl = $('#gm-god', p);
    if (godEl) godEl.onchange = e => { if (s) { s.gmRates.godMode = e.target.checked; showMsg(e.target.checked ? '無敵模式已開啟' : '無敵模式已關閉'); } };
    const ohEl = $('#gm-onehit', p);
    if (ohEl) ohEl.onchange = e => { if (s) { s.gmRates.oneHit = e.target.checked; showMsg(e.target.checked ? '一擊必殺已開啟' : '一擊必殺已關閉'); } };
    const expEl = $('#gm-exp', p);
    if (expEl) expEl.onchange = e => { if (s) { s.gmRates.exp = +e.target.value; showMsg('經驗倍率設為 ' + e.target.value + 'x'); } };
    const dropEl = $('#gm-drop', p);
    if (dropEl) dropEl.onchange = e => { if (s) { s.gmRates.drop = +e.target.value; showMsg('掉寶倍率設為 ' + e.target.value + 'x'); } };
    const grEl = $('#gm-goldrate', p);
    if (grEl) grEl.onchange = e => { if (s) { s.gmRates.gold = +e.target.value; showMsg('金幣倍率設為 ' + e.target.value + 'x'); } };

    // 道具頁綁定
    const qIn = $('#gm-q', p);
    if (qIn) {
      qIn.oninput = () => {
        opt.q = qIn.value;
        const pos = qIn.selectionStart;
        render();
        const q2 = $('#gm-q', p);
        if (q2) { q2.focus(); q2.setSelectionRange(pos, pos); }
      };
    }
    const catIn = $('#gm-cat', p);
    if (catIn) catIn.onchange = () => { opt.cat = catIn.value; render(); };

    p.querySelectorAll('[data-item]').forEach(el => {
      el.onclick = () => { pickId = +el.dataset.item; render(); };
    });

    const giveBtn = $('#gm-give', p);
    if (giveBtn) {
      giveBtn.onclick = () => {
        if (!s || !c || !pickId) return;
        opt.ench = clamp(($('#gm-ench', p) || {}).value, 0, 15);
        opt.bless = +($('#gm-bless', p) || {}).value || 0;
        opt.count = clamp(($('#gm-cnt', p) || {}).value, 1, 99999);
        const inst = s.giveItem(pickId, opt.count, opt.ench, opt.bless);
        s.save();
        if (inst) showMsg('已發送：+' + opt.ench + ' ' + (s.data.itemsById.get(pickId) || {}).name + ' ×' + opt.count);
      };
    }

    // 素質頁綁定
    const st35 = $('#gm-stat-35', p);
    if (st35) st35.onclick = () => { p.querySelectorAll('.gm-stat-in').forEach(inp => { inp.value = 35; }); };
    const st50 = $('#gm-stat-50', p);
    if (st50) st50.onclick = () => { p.querySelectorAll('.gm-stat-in').forEach(inp => { inp.value = 50; }); };
    const stSave = $('#gm-stat-save', p);
    if (stSave) {
      stSave.onclick = () => {
        if (!s || !c) return;
        c.level = clamp(($('#gm-st-lv', p) || {}).value, 1, 99);
        c.baseMaxHp = clamp(($('#gm-st-hp', p) || {}).value, 50, 30000);
        c.baseMaxMp = clamp(($('#gm-st-mp', p) || {}).value, 20, 30000);
        c.lawful = clamp(($('#gm-st-law', p) || {}).value, -32768, 32767);
        p.querySelectorAll('.gm-stat-in').forEach(inp => {
          c[inp.dataset.k] = clamp(inp.value, 8, 9999);   // 51 級起配點不設上限（2026-11-14），這裡不能再壓回 50
        });
        s.recalcStats();
        c.hp = c.maxHp;
        c.mp = c.maxMp;
        s.sendOwnStatus();
        s.sendSpMr();
        s.save();
        showMsg('已套用角色等級與六圍能力修改！');
      };
    }
  }

  function openPanel(defaultTab) {
    if (defaultTab) tab = defaultTab;
    let p = $('#gm-panel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'gm-panel';
      p.innerHTML = `<div class="box">
        <div class="hd"><b>🔧 網頁奇岩城 GM 修改器</b><span class="toast" id="gm-toast">${esc(toastText)}</span><button class="x" title="關閉">✕</button></div>
        <div class="tabs">
          <button data-tab="cheat">⚡ 快速作弊與倍率</button>
          <button data-tab="items">🗡️ 創造道具／神武</button>
          <button data-tab="stats">📊 等級與六圍能力</button>
        </div>
        <div class="bd"></div>
      </div>`;
      p.addEventListener('click', e => {
        if (e.target === p || e.target.classList.contains('x')) p.remove();
      });
      p.querySelectorAll('.tabs button').forEach(b => {
        b.onclick = () => { tab = b.dataset.tab; render(); };
      });
      document.body.appendChild(p);
    }
    render();
  }

  function init() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'gm-fab';
    fab.title = '開啟 GM 修改面板';
    fab.textContent = 'GM';
    fab.onclick = () => openPanel();
    document.body.appendChild(fab);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
