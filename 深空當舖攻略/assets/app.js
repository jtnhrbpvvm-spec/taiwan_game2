// 兩個版本共用的閱讀程式。版本資訊在這裡改。
window.PS_VERSIONS = {
  release: {
    title: '正式版攻略',
    badge: '✅ 正式版 1.0（2026/10/28 發售後）',
    intro: '新手建議路線：<a href="#basics">共通基礎</a> → <a href="#trading">倒賣</a>＋<a href="#scavenge">拾荒</a> 撐過第一週 → 主力 <a href="#water">賣水</a> → 副業 <a href="#wine">釀酒</a> / <a href="#rats">養鼠</a> → 後期 <a href="#vending">販賣機</a>。'
  },
  demo: {
    title: '試玩版攻略',
    badge: '🧪 試玩版 Demo / Update 049（正式版數值可能不同）',
    intro: '這裡是試玩版時期的攻略，有些更細的公式和數據只出現在這時期。先看 <a href="#overview">試玩版總覽與版本差異</a>。'
  }
};
(function () {
  var S = window.PS_STRATEGIES = window.PS_STRATEGIES || [];
  var GROUPS = ['基礎', '買賣', '生產', '灰色', '黑色'];
  var STAT_LABEL = { capital: '起手資金', difficulty: '上手難度', risk: '風險', speed: '回本速度' };
  var state = { group: '全部', q: '', sortKey: 'order', sortDir: 1 };
  var app = document.getElementById('app');
  var tabs = document.getElementById('vtabs');
  if (tabs) tabs.innerHTML = '<a href="index.html">🏠 首頁</a>' + ['release', 'demo'].map(function (v) {
    return '<a href="' + v + '.html"' + (v === (document.body.dataset.ver || 'release') ? ' class="on"' : '') + '>' + window.PS_VERSIONS[v].title + '</a>';
  }).join('');

  // 主題切換（記住選擇；localStorage 不能用時照樣運作）
  var root = document.documentElement;
  try { var saved = localStorage.getItem('ps-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  document.getElementById('theme').onclick = function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('ps-theme', root.dataset.theme); } catch (e) {}
  };

  // 依 manifest 依序載入每個流派檔
  // 這一頁是哪個版本：<body data-ver="release|demo">
  var VER = document.body.dataset.ver || 'release';
  var VINFO = window.PS_VERSIONS[VER];
  var dir = 'strategies/' + VER + '/';
  var m = document.createElement('script');
  m.src = dir + 'manifest.js';
  m.onload = loadAll;
  m.onerror = function () { app.innerHTML = '<p class="empty">找不到 ' + dir + 'manifest.js</p>'; };
  document.body.appendChild(m);

  function loadAll() {
  var list = window.PS_MANIFEST || [];
  var left = list.length;
  if (!left) start();
  list.forEach(function (f) {
    var s = document.createElement('script');
    s.src = dir + f;
    s.async = false;
    s.onload = function () { if (--left === 0) start(); };
    s.onerror = function () { console.warn('載入失敗：' + f); if (--left === 0) start(); };
    document.body.appendChild(s);
  });
  }

  function start() {
    S.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    addEventListener('hashchange', route);
    route();
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function arr(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }
  function gcolor(g) { return 'var(--g-' + g + ', var(--muted))'; }
  function dots(n, risk) { n = n || 0; return '<span class="dots" style="color:' + (risk ? 'var(--bad)' : 'var(--accent)') + '">' + '●'.repeat(n) + '<span style="opacity:.25">' + '●'.repeat(5 - n) + '</span></span>'; }
  function bars(st) {
    st = st || {};
    return '<div class="bars">' + Object.keys(STAT_LABEL).map(function (k) {
      return '<span>' + STAT_LABEL[k] + '</span><div class="bar' + (k === 'risk' ? ' risk' : '') + '"><i style="width:' + ((st[k] || 0) * 20) + '%"></i></div>';
    }).join('') + '</div>';
  }

  function route() {
    var id = decodeURIComponent(location.hash.slice(1));
    var s = S.filter(function (x) { return x.id === id; })[0];
    if (s) renderDetail(s); else renderHome();
    if (!s || !id) document.title = VINFO.title + '｜深空當舖攻略';
  }

  function textOf(s) { return JSON.stringify(s).toLowerCase(); }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return S.filter(function (s) {
      return (state.group === '全部' || s.group === state.group) && (!q || textOf(s).indexOf(q) >= 0);
    });
  }

  function renderHome() {
    var groups = ['全部'].concat(GROUPS.filter(function (g) { return S.some(function (s) { return s.group === g; }); }));
    app.innerHTML =
      '<span class="verbadge">' + VINFO.badge + '</span><p>收錄 <b>' + S.length + '</b> 個流派。' + VINFO.intro + '</p>' +
      '<div class="controls"><input id="q" type="search" placeholder="搜尋流派、物品、關鍵字（例：濾芯、魚子醬、房租）" value="' + esc(state.q) + '">' +
      groups.map(function (g) { return '<button type="button" class="chip' + (g === state.group ? ' on' : '') + '" data-g="' + g + '">' + g + '</button>'; }).join('') + '</div>' +
      '<div class="grid" id="cards"></div>' +
      '<h2>流派比較</h2><p style="font-size:14px;color:var(--muted);margin-top:0">●越多＝越高。回本速度越高越快。點欄位標題排序。</p>' +
      '<div class="tbl" id="cmp"></div>';
    var q = document.getElementById('q');
    q.oninput = function () { state.q = q.value; drawList(); };
    app.querySelectorAll('[data-g]').forEach(function (b) {
      b.onclick = function () { state.group = b.dataset.g; renderHome(); };
    });
    drawList();
  }

  function drawList() {
    var items = filtered();
    document.getElementById('cards').innerHTML = items.length ? items.map(function (s) {
      return '<a class="card" href="#' + encodeURIComponent(s.id) + '">' +
        '<span class="grp" style="color:' + gcolor(s.group) + '">' + esc(s.group) + '</span>' +
        '<h3>' + s.icon + ' ' + esc(s.name) + '</h3><p>' + s.tagline + '</p>' + bars(s.stats) + '</a>';
    }).join('') : '<p class="empty">找不到符合的流派。</p>';

    var cols = [['name', '流派'], ['group', '分類'], ['capital', '資金'], ['difficulty', '難度'], ['risk', '風險'], ['speed', '回本'], ['unlock', '解鎖']];
    var rows = items.slice().sort(function (a, b) {
      var k = state.sortKey;
      var va = k in STAT_LABEL ? (a.stats || {})[k] || 0 : k === 'order' ? a.order : String(a[k] || '');
      var vb = k in STAT_LABEL ? (b.stats || {})[k] || 0 : k === 'order' ? b.order : String(b[k] || '');
      return (va > vb ? 1 : va < vb ? -1 : 0) * state.sortDir;
    });
    document.getElementById('cmp').innerHTML = '<table><thead><tr>' + cols.map(function (c) {
      return '<th data-k="' + c[0] + '">' + c[1] + (state.sortKey === c[0] ? (state.sortDir > 0 ? ' ▲' : ' ▼') : '') + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.map(function (s) {
      var st = s.stats || {};
      return '<tr><td><a href="#' + encodeURIComponent(s.id) + '">' + s.icon + ' ' + esc(s.name) + '</a></td><td style="color:' + gcolor(s.group) + '">' + esc(s.group) + '</td>' +
        '<td>' + dots(st.capital) + '</td><td>' + dots(st.difficulty) + '</td><td>' + dots(st.risk, true) + '</td><td>' + dots(st.speed) + '</td><td>' + (s.unlock || '') + '</td></tr>';
    }).join('') + '</tbody></table>';
    document.querySelectorAll('#cmp th[data-k]').forEach(function (th) {
      th.onclick = function () {
        var k = th.dataset.k;
        state.sortDir = state.sortKey === k ? -state.sortDir : 1;
        state.sortKey = k;
        drawList();
      };
    });
  }

  function renderSection(sec, i) {
    var h = '<section class="sec"><h2 id="sec-' + i + '">' + esc(sec.title || '') + '</h2>';
    arr(sec.p).forEach(function (t) { h += '<p>' + t + '</p>'; });
    if (sec.steps) h += '<ol>' + sec.steps.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>';
    if (sec.list) h += '<ul>' + sec.list.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    if (sec.table) {
      h += '<div class="tbl"><table><thead><tr>' + sec.table.head.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
        sec.table.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    arr(sec.note).forEach(function (t) { h += '<div class="note">💡 ' + t + '</div>'; });
    return h + '</section>';
  }

  function renderDetail(s) {
    document.title = s.name + '｜' + VINFO.title;
    var idx = S.indexOf(s), prev = S[idx - 1], next = S[idx + 1];
    var secs = s.sections || [];
    app.innerHTML = '<p><a href="#">← 回到流派總覽</a></p><article class="detail">' +
      '<span class="grp" style="color:' + gcolor(s.group) + '">' + esc(s.group) + '</span>' +
      '<h1>' + s.icon + ' ' + esc(s.name) + '</h1><p class="lead">' + s.tagline + '</p>' +
      '<div class="meta">' + bars(s.stats) + '<div class="unlock" style="flex:1;min-width:220px"><b>解鎖：</b>' + (s.unlock || '—') + '</div></div>' +
      '<div class="tags">' + arr(s.tags).map(function (t) { return '<span class="tag" data-t="' + esc(t) + '">#' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<nav class="toc">' + secs.map(function (x, i) { return '<a href="javascript:void 0" data-sec="' + i + '">' + esc(x.title) + '</a>'; }).join('') + '</nav>' +
      secs.map(renderSection).join('') +
      '<div class="two">' +
      (s.tips && s.tips.length ? '<section class="sec good"><h2>✅ 小技巧</h2><ul>' + s.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></section>' : '<div></div>') +
      (s.pitfalls && s.pitfalls.length ? '<section class="sec bad"><h2>⚠️ 常見地雷</h2><ul>' + s.pitfalls.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></section>' : '<div></div>') +
      '</div>' +
      (s.sources && s.sources.length ? '<section class="sec src"><h2>📚 資料來源</h2><ul>' + s.sources.map(function (x) { return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a></li>'; }).join('') + '</ul></section>' : '') +
      '<p style="font-size:13px;color:var(--muted)">最後更新：' + esc(s.updated || '—') + '</p>' +
      '</article><div class="nav">' +
      (prev ? '<a class="btn" href="#' + encodeURIComponent(prev.id) + '">← ' + prev.icon + ' ' + esc(prev.name) + '</a>' : '<span></span>') +
      (next ? '<a class="btn" href="#' + encodeURIComponent(next.id) + '">' + next.icon + ' ' + esc(next.name) + ' →</a>' : '<span></span>') + '</div>';
    app.querySelectorAll('[data-sec]').forEach(function (a) {
      a.onclick = function () { document.getElementById('sec-' + a.dataset.sec).scrollIntoView({ behavior: 'smooth' }); };
    });
    app.querySelectorAll('[data-t]').forEach(function (t) {
      t.onclick = function () { state.q = t.dataset.t; state.group = '全部'; location.hash = ''; };
    });
    scrollTo(0, 0);
  }
})();
