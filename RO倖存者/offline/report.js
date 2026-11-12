/* RO 倖存者離線版：載入卡住的錯誤回報（rs_offline.py 在 index.html 的 <head> 載入，比遊戲程式早執行）
 * 載入畫面（#loading）連續顯示超過 1 分鐘 → 右下角跳出「回報問題」按鈕。
 * 按下後自動檢查：本機伺服器、WebGL／硬體加速、載入失敗的檔案、程式錯誤、cache 缺檔，
 * 先把偵測結果和建議給玩家看，玩家按「送出」才傳到 Google 表單（不含帳號、存檔）。
 */
(function () {
  'use strict';
  if (window.__rsReport) return;
  var FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdfZFclRK43E-t1mOUAkHNE-6Se2jxW7ZrzpoiWudGvrM3ang/formResponse';
  var F = { ver: 'entry.2071557836', screen: 'entry.1953270717', diag: 'entry.630176839', detail: 'entry.825329811', note: 'entry.1761794307' };
  var STUCK_MS = 60000;
  var HELP = 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO%E5%80%96%E5%AD%98%E8%80%85/offline/#stuck';
  var T0 = Date.now();
  var errors = [], badFiles = [], slowFiles = {}, sent = false;

  function push(list, item, max) { if (list.length < max) list.push(item); }
  function sec() { return Math.round((Date.now() - T0) / 1000); }

  // ---------- 從一開始就記錄：程式錯誤、載入失敗的檔案 ----------
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) {
      push(badFiles, { url: String(t.src || t.href).replace(location.origin, ''), how: t.tagName.toLowerCase(), t: sec() }, 30);
    } else {
      push(errors, { msg: String(e.message || e.error || '').slice(0, 300), at: (e.filename || '').replace(location.origin, '') + ':' + (e.lineno || 0), t: sec() }, 20);
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    push(errors, { msg: 'Promise: ' + String((r && (r.stack || r.message)) || r).slice(0, 300), t: sec() }, 20);
  });
  var oldErr = console.error;
  console.error = function () {
    try { push(errors, { msg: 'console: ' + [].map.call(arguments, function (a) { return a && a.stack ? a.stack : String(a); }).join(' ').slice(0, 300), t: sec() }, 20); } catch (x) {}
    return oldErr.apply(this, arguments);
  };
  // fetch：記錄失敗（/api/ 離線本來就會失敗，不算）
  if (window.fetch) {
    var oldFetch = window.fetch;
    window.fetch = function (input) {
      var url = String((input && input.url) || input).replace(location.origin, '');
      var api = /^\/api\/|docs\.google\.com|\/__/.test(url);
      var p = oldFetch.apply(this, arguments);
      if (!api) {
        var start = Date.now();
        slowFiles[url] = start;
        p.then(function (r) {
          delete slowFiles[url];
          if (!r.ok) push(badFiles, { url: url, how: 'fetch ' + r.status, t: sec() }, 30);
        }, function (err) {
          delete slowFiles[url];
          push(badFiles, { url: url, how: 'fetch 失敗 ' + String(err && err.message || err).slice(0, 80), t: sec() }, 30);
        });
      }
      return p;
    };
  }

  // ---------- 偵測載入畫面卡住 ----------
  var shownAt = 0, btn = null, panel = null;
  function loadingEl() { return document.getElementById('loading'); }
  function isLoading() {
    var el = loadingEl();
    if (!el) return document.readyState === 'complete' && Date.now() - T0 > STUCK_MS && !document.querySelector('canvas');
    return !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
  }
  function loadingText() {
    var el = document.querySelector('#loading .loading-text');
    return el ? el.textContent.trim() : (loadingEl() ? '' : '（找不到載入畫面）');
  }
  setInterval(function () {
    if (isLoading()) {
      if (!shownAt) shownAt = Date.now();
      if (Date.now() - shownAt >= STUCK_MS && !btn && !sent) showButton();
    } else {
      shownAt = 0;
      if (btn && !panel) { btn.remove(); btn = null; }
    }
  }, 2000);

  // ---------- 畫面 ----------
  var CSS = '#rsr-btn,#rsr-panel{position:fixed;z-index:2147483646;font:15px/1.6 "Segoe UI","Microsoft JhengHei",sans-serif;color:#e8eef9}' +
    '#rsr-btn{right:18px;bottom:18px;background:#e0533d;border:0;border-radius:12px;padding:12px 18px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px #0008}' +
    '#rsr-btn:hover{background:#c8432f}' +
    '#rsr-panel{right:18px;bottom:18px;width:min(440px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;background:#18263f;border:1px solid #2b3f63;border-radius:14px;padding:16px 18px;box-shadow:0 6px 24px #000a}' +
    '#rsr-panel h3{margin:0 0 8px;font-size:17px}#rsr-panel ul{margin:6px 0;padding-left:20px}#rsr-panel li{margin:3px 0}' +
    '#rsr-panel .bad{color:#ff9a8a}#rsr-panel .ok{color:#8fe0a5}#rsr-panel .muted{color:#9fb0cc;font-size:13px}' +
    '#rsr-panel textarea{width:100%;box-sizing:border-box;min-height:60px;background:#0b1424;color:#e8eef9;border:1px solid #2b3f63;border-radius:8px;padding:6px 8px;font:inherit}' +
    '#rsr-panel .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
    '#rsr-panel button,#rsr-panel a.b{border:0;border-radius:8px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none;color:#fff;background:#4ea1ff}' +
    '#rsr-panel button.g,#rsr-panel a.b{background:transparent;border:1px solid #4ea1ff;color:#7cc4ff}';
  function style() {
    if (document.getElementById('rsr-css')) return;
    var s = document.createElement('style'); s.id = 'rsr-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function showButton() {
    style();
    btn = document.createElement('button');
    btn.id = 'rsr-btn';
    btn.textContent = '⚠ 卡住了嗎？回報問題';
    btn.onclick = openPanel;
    document.body.appendChild(btn);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function openPanel() {
    if (btn) btn.style.display = 'none';
    panel = document.createElement('div');
    panel.id = 'rsr-panel';
    panel.innerHTML = '<h3>正在檢查問題…</h3><div class="muted">大約 5 秒</div>';
    document.body.appendChild(panel);
    collect().then(function (info) {
      var list = info.findings.map(function (f) { return '<li class="' + (f.bad ? 'bad' : 'ok') + '">' + esc(f.text) + (f.fix ? '<br><span class="muted">→ ' + esc(f.fix) + '</span>' : '') + '</li>'; }).join('');
      panel.innerHTML = '<h3>載入卡住 ' + Math.round((Date.now() - shownAt) / 1000) + ' 秒：' + esc(info.screen || '載入畫面') + '</h3>' +
        '<b>偵測結果</b><ul>' + list + '</ul>' +
        '<div class="muted">可以先照上面的建議試試看。還是不行就按「送出回報」，會傳給工具作者：版本、偵測結果、瀏覽器與顯示卡型號、出錯的檔案。<b>不會</b>傳帳號、存檔或個人資料。</div>' +
        '<textarea id="rsr-note" placeholder="（選填）補充說明：例如你做了什麼、用什麼瀏覽器…" maxlength="1000"></textarea>' +
        '<div class="row"><button id="rsr-send">送出回報</button><a class="b" href="' + HELP + '" target="_blank" rel="noopener">排除步驟</a>' +
        '<button class="g" id="rsr-reload">重新整理</button><button class="g" id="rsr-close">關閉</button></div><div id="rsr-msg" class="muted"></div>';
      panel.querySelector('#rsr-close').onclick = closePanel;
      panel.querySelector('#rsr-reload').onclick = function () { location.reload(); };
      panel.querySelector('#rsr-send').onclick = function () { send(info, this); };
    });
  }
  function closePanel() {
    if (panel) panel.remove();
    panel = null;
    if (btn) btn.style.display = '';
  }

  // ---------- 檢查 ----------
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, no) { setTimeout(function () { no(new Error('逾時')); }, ms); })]);
  }
  function webgl() {
    var r = { ok: false };
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) {
        r.v = 'none';
      } else {
        r.ok = true;
        r.v = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ? 2 : 1;
        var d = gl.getExtension('WEBGL_debug_renderer_info');
        r.gpu = d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        r.vendor = d ? gl.getParameter(d.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        r.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        r.lost = gl.isContextLost();
        var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
      var c2 = document.createElement('canvas');
      r.perfCaveat = !c2.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    } catch (e) { r.err = String(e); }
    return r;
  }
  function getJSON(url) {
    return withTimeout(fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }), 5000);
  }
  function collect() {
    var gl = webgl();
    var res = [];
    try {
      res = performance.getEntriesByType('resource').map(function (e) { return { n: e.name.replace(location.origin, ''), d: Math.round(e.duration), s: e.transferSize || 0, end: Math.round(e.responseEnd) }; });
    } catch (e) {}
    var pending = Object.keys(slowFiles).map(function (u) { return { url: u, waiting: Math.round((Date.now() - slowFiles[u]) / 1000) }; });
    return Promise.all([
      getJSON('/__diag.json').catch(function (e) { return { error: String(e.message || e) }; }),
      (navigator.storage && navigator.storage.estimate ? withTimeout(navigator.storage.estimate(), 2000).catch(function () { return null; }) : Promise.resolve(null))
    ]).then(function (r) {
      var server = r[0], storage = r[1];
      var info = {
        screen: loadingText(),
        stuckSec: Math.round((Date.now() - shownAt) / 1000),
        pageSec: sec(),
        server: server,
        webgl: gl,
        ua: navigator.userAgent,
        lang: navigator.language,
        screenSize: screen.width + 'x' + screen.height + ' @' + (window.devicePixelRatio || 1) + ' 視窗 ' + innerWidth + 'x' + innerHeight,
        cpu: navigator.hardwareConcurrency, mem: navigator.deviceMemory,
        online: navigator.onLine, visible: document.visibilityState,
        url: location.pathname + location.search,
        storage: storage ? { usedMB: Math.round(storage.usage / 1048576), quotaMB: Math.round(storage.quota / 1048576) } : null,
        lsOk: (function () { try { localStorage.setItem('__rsr', '1'); localStorage.removeItem('__rsr'); return true; } catch (e) { return false; } })(),
        errors: errors, badFiles: badFiles, pending: pending,
        resCount: res.length,
        lastRes: res.sort(function (a, b) { return b.end - a.end; }).slice(0, 8),
        slowRes: res.filter(function (e) { return e.d > 10000; }).slice(0, 8)
      };
      info.findings = analyse(info);
      return info;
    });
  }
  function analyse(i) {
    var out = [], s = i.server || {}, g = i.webgl || {};
    if (s.error) out.push({ bad: 1, code: 'server', text: '本機伺服器沒有回應（' + s.error + '）', fix: '黑色視窗是不是被關掉了？重新雙擊「開始遊戲.bat」，黑色視窗要一直開著。' });
    if (!g.ok) out.push({ bad: 1, code: 'webgl', text: '瀏覽器無法使用 WebGL（3D 繪圖）', fix: '開啟瀏覽器設定的「使用硬體加速」，或更新顯示卡驅動程式；也可以換 Chrome／Edge 試試。' });
    else if (/swiftshader|llvmpipe|basic render|software/i.test(g.gpu || '') || g.perfCaveat)
      out.push({ bad: 1, code: 'softgl', text: '用軟體模擬 3D（' + (g.gpu || '效能不足') + '），可能非常慢或載不起來', fix: '開啟瀏覽器的「使用硬體加速」後重新開瀏覽器，或更新顯示卡驅動程式。' });
    if (g.lost) out.push({ bad: 1, code: 'glLost', text: '3D 繪圖被系統中斷（WebGL context lost）', fix: '關掉其他吃顯示卡的程式，重新整理頁面。' });
    if (i.badFiles.length) out.push({ bad: 1, code: 'files', text: '有 ' + i.badFiles.length + ' 個檔案載入失敗，例如 ' + i.badFiles.slice(0, 2).map(function (f) { return f.url; }).join('、'), fix: '可能是 cache 不完整：關掉黑色視窗，刪掉離線版資料夾裡的 cache 資料夾後重新開始遊戲（第一次會重新下載約 3 分鐘）。' });
    if (s.missing > 0) out.push({ bad: 1, code: 'cache', text: '圖片音效還有 ' + s.missing + ' 個沒下載（共 ' + s.assets + ' 個）', fix: s.online ? '網路可能不穩，重新開始遊戲讓它補下載。' : '這次啟動連不上官網，所以沒辦法補檔；確認網路後重新開始遊戲。' });
    if (i.pending.length) out.push({ bad: 1, code: 'pending', text: '有 ' + i.pending.length + ' 個檔案一直等不到回應，例如 ' + i.pending[0].url, fix: '防毒軟體或防火牆可能擋住了，暫時關掉再試，或重新開始遊戲。' });
    if (i.errors.length) out.push({ bad: 1, code: 'error', text: '遊戲程式出錯：' + i.errors[0].msg.split('\n')[0].slice(0, 120), fix: '重新整理一次；還是一樣請送出回報。' });
    if (s.patches) {
      var off = Object.keys(s.patches).filter(function (k) { return !s.patches[k]; });
      if (off.length) out.push({ bad: 0, code: 'patch', text: '這版遊戲有 ' + off.length + ' 個離線修補對不上（' + off.join('、') + '），通常不影響進入遊戲' });
    }
    if (i.visible !== 'visible') out.push({ bad: 0, code: 'hidden', text: '頁面在背景時遊戲會暫停，請把遊戲分頁切到前面' });
    if (!i.lsOk) out.push({ bad: 1, code: 'storage', text: '瀏覽器不允許存資料（無痕模式或封鎖網站資料）', fix: '不要用無痕視窗；允許 127.0.0.1 儲存網站資料。' });
    if (!out.some(function (f) { return f.bad; })) out.push({ bad: 0, code: 'none', text: '沒有偵測到明顯原因（伺服器、3D 繪圖、檔案都正常）', fix: '先按「重新整理」；還是卡住請送出回報，作者會看詳細資料。' });
    return out;
  }

  // ---------- 送出 ----------
  function send(info, button) {
    var msg = panel.querySelector('#rsr-msg');
    button.disabled = true; button.textContent = '傳送中…';
    var s = info.server || {};
    var detail = JSON.stringify(info, null, 1);
    if (detail.length > 20000) { info.lastRes = info.lastRes.slice(0, 3); info.errors = info.errors.slice(0, 5); detail = JSON.stringify(info).slice(0, 20000); }
    var body = new URLSearchParams();
    body.append(F.ver, '工具 v' + (s.tool || '?') + (s.gm ? ' GM' : '') + '／遊戲 ' + (s.game || '?'));
    body.append(F.screen, (info.screen || '?') + '（' + info.stuckSec + ' 秒）');
    body.append(F.diag, info.findings.map(function (f) { return (f.bad ? '✗ ' : '・') + f.text; }).join('\n'));
    body.append(F.detail, detail);
    body.append(F.note, (panel.querySelector('#rsr-note').value || '').slice(0, 1000));
    fetch(FORM, { method: 'POST', mode: 'no-cors', body: body }).then(function () {
      sent = true;
      button.textContent = '已送出';
      msg.innerHTML = '<span class="ok">已送出，謝謝回報！</span>';
    }, function (e) {
      button.disabled = false; button.textContent = '再試一次';
      msg.innerHTML = '<span class="bad">送不出去（' + esc(e.message || e) + '），請確認電腦有連上網路。</span>';
    });
  }

  window.__rsReport = { collect: collect, open: openPanel, STUCK_MS: STUCK_MS };
})();
