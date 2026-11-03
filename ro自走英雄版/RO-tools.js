javascript:(function awTools() {
  /*
   * 流浪仙境小工具（書籤版，配合 2026-11 重做的新版遊戲 https://www.xianjing.dev/ 重寫）
   *
   * 新版遊戲是打包成一支 ES module，裡面的東西不是全域變數，頁面開好之後書籤碰不到。
   * 所以沿用舊版的常駐模式，而且多做一步：
   *   1. 點書籤時先讓外層的遊戲存檔並停下來
   *   2. 開一個全螢幕的同網域框架（iframe），載入 version.json（只是為了拿到這個網址，不會跑遊戲）
   *   3. 在框架裡寫入遊戲的首頁，主程式最前面加上一行 window.__XJ，才啟動遊戲
   * 遊戲自己重新整理時只會重新載入框架，框架載入完成又會再做一次第 3 步，所以小工具會自己回來。
   * 按瀏覽器的重新整理（F5）是重新載入外層頁面，要再點一次書籤。
   *
   * 功能（遊戲「選單」視窗標題列的「修改」按鈕打開面板，可以開關）：
   *   - 背景運行：分頁在背景時遊戲照常跑，不會變成離線收益；背景時不畫畫面
   *   - 節能模式：降低畫面更新次數、不畫傷害數字和受擊特效；只影響畫面，不改存檔裡的設定
   *   - 禁止自動更新：遊戲出新版時只提示，不會倒數或自己重新整理
   *   - BOSS 血條（預設關閉）：畫面最上方顯示 BOSS 名稱、生命、護盾、剩餘時間
   *   - 技能冷卻：技能列每顆技能顯示實際冷卻秒數
   *   - 收益統計：每小時的 Zeny、經驗、擊殺、裝備、卡片，以及還要多久升級
   *   - 自動精煉：在煉金工坊選好裝備，代替你一直按精煉，到目標或材料不夠就停
   *   - 冷卻提醒：組隊副本的冷卻結束時提示一次
   *   - 配裝配技能推薦：從背包的裝備和持有的技能寶石找預估 DPS 最高的組合，看過結果再按套用，可以復原
   *   - 置頂視窗：把遊戲搬進永遠在最上層的小視窗（電腦版 Chrome／Edge）
   *   - 使用書籤時一律不上傳排行榜（POST /api/rank）、不能在聊天室發言（POST /api/chat）
   *   - 修改功能開著時不能使用協力（POST /api/coop/create、join 和協力的 WebSocket），見 modsOn
   *
   * 會修改遊戲的功能：
   *   - 單格模式（技能盤視窗的勾選框）：每顆技能寶石只佔一格、輔助寶石不用相鄰就生效；開啟前有風險提示（confirmRisk）
   *   - 精煉失敗不退階（煉金工坊精煉分頁的勾選框）：失敗時精煉值不變（遊戲的精煉本來就不會讓裝備消失，只有 +6 以上失敗會退一階）；
   *     開啟前有風險提示
   *   - 隨時取出卡片（「修改」面板）：把裝備上的卡片取出，不用回城鎮、不花素材、一定成功
   *   - 自訂天氣（「修改」面板）：直接換成指定的天氣，重新計時 4 小時；也可以清除
   *   - 購買時選擇變異（商人的技能寶石）：點購買先選一般、變異或多重變異和數值；有附加能力時再跳視窗選
   * 「不上榜」這類訊息只在開啟前兩項時提示，其他地方不要出現。
   *
   * 遊戲的名稱每次打包都會換（X、Q 這些），所以這裡不寫死名稱：
   * 用不會換的方法名稱、元素 id 找 class，再用 instanceof 確認，見 findObjects。
   * 找不到就只停用用到它的功能，遊戲照常跑。
   *
   * 修改注意：
   *   - 註解只能用這種區塊註解，不要用雙斜線註解（貼進書籤時換行會消失，後面的程式會被吃掉）
   *   - 每個敘述結尾都要加分號
   *   - 百分比符號後面不要直接接兩個十六進位字元（會被瀏覽器當成網址編碼）
   */

  /* 書籤版本號：每次修改這個檔案就加 1，會顯示在面板標題旁 */
  const VERSION = 'V25';

  const CFG_KEY = 'xjtools.cfg';
  const NOTE_KEY = 'xjtools.notes';
  const CFG_DEF = {
    keepAlive: true,    /* 背景運行 */
    tickMs: 100,        /* 背景時每幾毫秒推動一次遊戲迴圈 */
    eco: false,         /* 節能模式 */
    ecoFps: 15,         /* 節能模式每秒更新幾次畫面 */
    noUpdate: true,     /* 禁止自動更新 */
    bossBar: false,     /* BOSS 血條（遊戲本身已有血條，這個多了生命數字，預設關閉） */
    skillCd: true,      /* 技能列顯示實際冷卻 */
    cdNote: true,       /* 冷卻提醒 */
    oneCell: false,     /* 單格模式（會修改遊戲，開啟前有提示） */
    noDown: false       /* 精煉失敗不退階（會修改遊戲，開啟前有提示） */
  };
  const loadCfg = () => {
    try { return Object.assign({}, CFG_DEF, JSON.parse(localStorage.getItem(CFG_KEY)) || {}); }
    catch (e) { return Object.assign({}, CFG_DEF); }
  };
  const cfg = loadCfg();
  const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} };

  /* ===== 找到遊戲的首頁和主程式 =====
   * 網址帶參數：網站的 service worker 會把 ./ 快取起來，帶參數才會拿到最新的。
   * 網站找不到檔案時回的是 200 + 首頁，所以主程式要確認不是網頁。 */
  const fetchGame = async () => {
    const htmlRes = await fetch('./?xjt=' + Date.now(), { cache: 'no-store' });
    const html = await htmlRes.text();
    const m = html.match(/<script\b[^>]*type="module"[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
    if (!m) throw new Error('首頁裡找不到主程式');
    const jsRes = await fetch(m[1]);
    const type = jsRes.headers.get('content-type') || '';
    if (!jsRes.ok || type.indexOf('javascript') < 0) throw new Error('主程式抓不到：' + m[1]);
    return { html: html, js: await jsRes.text() };
  };

  const toastOuter = text => {
    const d = document.createElement('div');
    d.textContent = text;
    d.style.cssText = 'position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:2147483647;background:#16294a;color:#fff;padding:10px 16px;border-radius:8px;font:14px/1.6 sans-serif;max-width:90vw';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 6000);
  };

  /* ===== 外層頁面：停掉原本的遊戲、開框架 ===== */
  const SELF = awTools.toString();
  let inHost = false;
  try { inHost = window !== window.top && !!window.top.__xjHost; } catch (e) {}

  if (!inHost) {
    const runIn = w => {
      try {
        const d = w.document;
        const s = d.createElement('script');
        s.textContent = '(' + SELF + ')();';
        (d.body || d.documentElement).appendChild(s);
        s.remove();
      } catch (e) {}
    };
    // 使用次數統計（GoatCounter，和網站同一個帳號；匿名，只記「這個工具被執行一次」。網站擋掉也不影響工具）
    try { if (!window.__tg2Count) { window.__tg2Count = 1; var __tg2u = 'https://taiwangame2.goatcounter.com/count?p=' + encodeURIComponent('/書籤/ro自走英雄版') + '&t=' + encodeURIComponent('書籤：ro自走英雄版') + '&e=true&rnd=' + Math.random().toString(36).slice(2); if (navigator.sendBeacon) navigator.sendBeacon(__tg2u); else new Image().src = __tg2u; } } catch (__tg2e) {}
    /* 再點一次書籤：打開框架裡的面板 */
    if (window.__xjHost) {
      try { window.__xjHost.contentWindow.__xjShow(); } catch (e) {}
      return;
    }
    if (window.__xjStarting) return;
    window.__xjStarting = true;

    /* 讓遊戲以為分頁切到背景：遊戲自己會存檔、上傳雲端、把音樂停掉。
     * 上傳完才能開框架，不然框架裡的遊戲會讀到舊的雲端存檔。 */
    const stopOuter = async () => {
      const realFetch = window.fetch;
      let pending = 0;
      window.fetch = function (input) {
        const url = String(input && input.url || input);
        const p = realFetch.apply(this, arguments);
        if (url.indexOf('/api/') >= 0) {
          pending++;
          const done = () => { pending--; };
          p.then(done, done);
        }
        return p;
      };
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      /* 等幾個畫面（音樂要在畫面更新時才會停）和上傳，上傳最多等 5 秒。遊戲的上傳要先壓縮，所以至少等 0.6 秒 */
      const t0 = Date.now();
      await new Promise(r => setTimeout(r, 600));
      while (pending > 0 && Date.now() - t0 < 5000) await new Promise(r => setTimeout(r, 100));
      /* 外層的遊戲不准再存檔、再連線，之後關分頁時它存的舊進度才不會蓋掉框架裡的新進度 */
      const realSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k) {
        if (String(k).indexOf('xianjing') === 0) return undefined;
        return realSet.apply(this, arguments);
      };
      window.fetch = function (input) {
        const url = String(input && input.url || input);
        if (url.indexOf('/api/') >= 0) return Promise.reject(new Error('stopped'));
        return realFetch.apply(this, arguments);
      };
      window.requestAnimationFrame = () => 0;
      const last = setTimeout(() => {}, 0);
      for (let i = 0; i <= last; i++) { clearTimeout(i); clearInterval(i); }
    };

    const openHost = () => {
      const f = document.createElement('iframe');
      window.__xjHost = f;
      f.allow = 'autoplay; fullscreen; clipboard-read; clipboard-write; identity-credentials-get';
      f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483646;background:#000';
      f.addEventListener('load', () => { runIn(f.contentWindow); try { f.contentWindow.focus(); } catch (e) {} });
      f.src = new URL('version.json', location.href).href;
      document.body.appendChild(f);
      /* 置頂視窗：把框架搬進瀏覽器的「文件子母畫面」視窗。框架一搬動裡面就會重新載入，
       * 所以這段放在外層執行；再呼叫一次是關閉，關閉時把框架搬回來。 */
      window.__xjPin = async () => {
        const api = window.documentPictureInPicture;
        if (!api) return 'nosupport';
        if (api.window) { api.window.close(); return 'closed'; }
        const pip = await api.requestWindow({ width: Math.max(360, Math.min(window.innerWidth, 1000)), height: Math.max(480, Math.min(window.innerHeight, 900)) });
        pip.document.title = document.title;
        pip.document.body.style.cssText = 'margin:0;background:#000;overflow:hidden';
        pip.__xjHost = f;
        pip.__xjPin = window.__xjPin;
        const note = document.createElement('div');
        note.style.cssText = 'position:fixed;inset:0;z-index:2147483645;background:#16294a;color:#fff;display:flex;align-items:center;justify-content:center;font:16px/1.8 sans-serif;text-align:center';
        note.textContent = '遊戲正在置頂的小視窗裡進行。關掉那個小視窗就會回到這裡。這個分頁請不要關。';
        document.body.appendChild(note);
        pip.document.body.appendChild(f);
        pip.addEventListener('pagehide', () => { note.remove(); document.body.appendChild(f); });
        return 'ok';
      };
    };

    /* 先確定抓得到遊戲才停掉外層，抓不到的話原本的遊戲還能繼續玩 */
    fetchGame().then(() => stopOuter()).then(openHost).catch(e => {
      window.__xjStarting = false;
      toastOuter('小工具啟動失敗（遊戲繼續正常跑）：' + e.message);
    });
    return;
  }

  /* ===== 以下都在框架裡執行 ===== */
  if (window.__xjBooted) return;
  window.__xjBooted = true;

  /* ===== 遊戲啟動前要先裝好的攔截 ===== */
  let bootBuild = '';
  let toast = text => { window.__xjEarlyNotes = (window.__xjEarlyNotes || []).concat(text); };

  /* 協力：修改功能開著時不能進房間，改過的角色才不會跟其他玩家一起玩。
   * 開房間、加入、斷線重連都走 /api/coop/create、join（下面的 fetch 擋），連線本身是 WebSocket。
   * 隨時取出卡片、自訂天氣、買變異寶石是一次性的動作，用過之後這次載入遊戲都算有用。 */
  const COOP_MSG = '修改功能開著時不能使用協力：請把單格模式、精煉失敗不退階關閉（取出過卡片、改過天氣、買過變異寶石要重新載入遊戲）';
  const modsOn = () => !!(window.__xjOne || window.__xjNoDown || window.__xjCardUsed || window.__xjWxUsed || window.__xjGemUsed);
  const coopSockets = new Set();
  const RealWS = window.WebSocket;
  window.WebSocket = new Proxy(RealWS, {
    construct(T, args) {
      const isCoop = String(args[0]).indexOf('/api/coop/') >= 0;
      if (isCoop && modsOn()) throw new Error(COOP_MSG);
      const ws = new T(...args);
      if (isCoop) {
        coopSockets.add(ws);
        ws.addEventListener('close', () => coopSockets.delete(ws));
      }
      return ws;
    }
  });
  /* 已經在協力房間裡就不能開修改功能，要先離開 */
  const inCoop = () => {
    if (coopSockets.size === 0) return false;
    toast('正在協力房間裡：請先離開房間，才能使用修改功能');
    return true;
  };

  /* 排行榜、聊天室、協力、版本檢查都走 fetch */
  const realFetch = window.fetch.bind(window);
  const denied = msg => new Response(JSON.stringify({ msg: msg }), { status: 403, headers: { 'content-type': 'application/json' } });
  window.fetch = async function (input, init) {
    const url = String(input && input.url || input);
    const method = String(init && init.method || input && input.method || 'GET').toUpperCase();
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    if (method === 'POST' && path === '/api/rank') return denied('');
    if (method === 'POST' && path === '/api/chat') return denied('使用小工具時不能在聊天室發言');
    if (method === 'POST' && /^\/api\/coop\/(create|join)$/.test(path) && modsOn()) return denied(COOP_MSG);
    if (/(^|\/)version\.json/.test(url) && cfg.noUpdate) {
      const res = await realFetch(input, init);
      try {
        const build = (await res.clone().json()).build;
        if (bootBuild && build && build !== bootBuild) {
          if (!window.__xjUpdateNoted) { window.__xjUpdateNoted = true; toast('遊戲出新版了：要更新時自己重新整理頁面，再點一次書籤'); }
          return new Response(JSON.stringify({ build: bootBuild }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
      } catch (e) {}
      return res;
    }
    return realFetch(input, init);
  };

  /* 背景運行：瀏覽器在背景時不會呼叫 requestAnimationFrame，一般的計時器也會被放慢，
   * 所以用 Worker 的計時器（不會被放慢）代替它呼叫遊戲迴圈。
   * 節能模式也在這裡：還沒到時間的畫面就往後延。 */
  const realRAF = window.requestAnimationFrame.bind(window);
  const waiting = new Set();
  let lastFrame = 0;
  window.requestAnimationFrame = cb => {
    const job = { cb: cb, done: false };
    waiting.add(job);
    const run = t => {
      if (job.done) return;
      if (cfg.eco && t - lastFrame < 1000 / cfg.ecoFps) { realRAF(run); return; }
      lastFrame = t;
      job.done = true;
      waiting.delete(job);
      cb(t);
    };
    return realRAF(run);
  };
  try {
    const url = URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),' + cfg.tickMs + ');'], { type: 'text/javascript' }));
    new Worker(url).onmessage = () => {
      if (!cfg.keepAlive || !document.hidden) return;
      for (const job of Array.from(waiting)) {
        job.done = true;
        waiting.delete(job);
        job.cb(performance.now());
      }
    };
  } catch (e) {}

  /* ===== 單格模式：改主程式 =====
   * 要在遊戲讀檔之前就生效：遊戲讀檔時會把重疊的寶石從技能盤卸下（名稱換掉的那個 Dc），
   * 等遊戲跑起來才改的話，每次重新載入單格模式排的盤面都會被拆掉。所以直接改主程式的文字，開關看 window.__xjOne。
   *   - 寶石形狀：e=>e.sh??gn(e.id) 這個函式回傳寶石佔哪些格子，開著時一律回傳一格
   *   - 輔助連結：遊戲本來就有「所有輔助都連結」的效果（v70sup），開著時當作有這個效果
   * 兩個地方都要改得到才算成功；遊戲改版對不上就不提供單格模式，window.__xjOneOk 是結果。 */
  const patchOneCell = js => {
    let shape = 0, link = 0;
    const out = js
      .replace(/([\w$]+)=e=>e\.sh\?\?([\w$]+)\(e\.id\)/g, (m, a, b) => { shape++; return a + '=e=>window.__xjOne?[`0,0`]:e.sh??' + b + '(e.id)'; })
      .replace(/([\w$]+)\(t,`v70sup`\)>0\?/g, (m, a) => { link++; return '(window.__xjOne||' + a + '(t,`v70sup`)>0)?'; });
    window.__xjOneOk = shape === 1 && link === 1;
    if (!window.__xjOneOk) return js;
    window.__xjOne = !!cfg.oneCell;
    return out;
  };

  /* ===== 精煉失敗不退階：改主程式 =====
   * 遊戲失敗時是 o?成功:!i.guard&&i.target>=6&&(n.ref=a-1)，開著時不執行退階那段。
   * 遊戲的說明文字「失敗時精煉值 −1」也跟著換；文字沒換到不影響功能，所以只看退階那段有沒有改到。 */
  const patchNoDown = js => {
    let down = 0;
    const out = js
      .replace(/:!([\w$]+)\.guard&&\1\.target>=6&&\(/g, (m, a) => { down++; return ':!window.__xjNoDown&&!' + a + '.guard&&' + a + '.target>=6&&('; })
      .replace(/`失敗時精煉值 −1`/g, '(window.__xjNoDown?`失敗時精煉值不變（小工具）`:`失敗時精煉值 −1`)');
    window.__xjNoDownOk = down === 1;
    if (!window.__xjNoDownOk) return js;
    window.__xjNoDown = !!cfg.noDown;
    return out;
  };

  /* ===== 啟動遊戲 ===== */
  const startGame = async () => {
    const g = await fetchGame();
    try { bootBuild = (await (await realFetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json()).build; } catch (e) {}
    /* 首頁裡的 script 都拿掉（主程式下面自己放、統計腳本不要） */
    const html = g.html.replace(/<script\b[\s\S]*?<\/script>/g, '');
    document.open();
    document.write(html);
    document.close();
    /* 寫完之後 body 不一定馬上出現（實測 version.json 這種 JSON 文件會晚一點） */
    for (let i = 0; i < 500 && !document.body; i++) await new Promise(r => setTimeout(r, 10));
    const s = document.createElement('script');
    s.type = 'module';
    /* eval 要放在主程式裡面才碰得到它的變數；放最前面是因為主程式中途會等雲端存檔（top-level await） */
    s.textContent = 'window.__XJ={eval:s=>eval(s)};\n' + patchNoDown(patchOneCell(g.js));
    document.body.appendChild(s);
    return g.js;
  };

  /* ===== 找遊戲的主要物件 =====
   * 同一個 class 在函式裡也常常 new 一份（區域變數），所以找到的每個名稱都用 instanceof 確認，
   * 區域變數的名稱在最上層不是那個 class 的實例，會被濾掉。 */
  const findObjects = src => {
    const ev = s => { try { return window.__XJ.eval(s); } catch (e) { return undefined; } };
    const check = (name, cls) => ev('(' + name + ' instanceof ' + cls + ')') === true;
    const byMethod = method => {
      const m = new RegExp('[{}; ]' + method + '\\([^)]*\\)\\{').exec(src);
      if (!m) return null;
      let cls = null;
      const re = /\bclass ([\w$]+)|([\w$]+)=class\b/g;
      let c;
      while ((c = re.exec(src)) && c.index < m.index) cls = c[1] || c[2];
      if (!cls) return null;
      const esc = cls.replace(/\$/g, '\\$');
      const inst = new RegExp('([\\w$]+)=new ' + esc + '\\(', 'g');
      let i;
      while ((i = inst.exec(src))) if (check(i[1], cls)) return ev(i[1]);
      return null;
    };
    const byElem = id => {
      const re = new RegExp('([\\w$]+)=new ([\\w$]+)\\(document\\.getElementById\\(`' + id + '`\\)', 'g');
      let i;
      while ((i = re.exec(src))) if (check(i[1], i[2])) return ev(i[1]);
      return null;
    };
    return { game: byMethod('collectLoot'), panels: byMethod('gotoNpc'), hud: byElem('hud'), windows: byElem('windows'), renderer: byElem('field') };
  };

  /* ===== 小工具的畫面 ===== */
  const installStyle = () => {
    const st = document.createElement('style');
    st.textContent = [
      '.xjToggle{display:block;margin:0 0 8px;cursor:pointer;font-size:13px}',
      '.xjToggle small{opacity:.75}',
      '#xjPanel .xjClose{margin-left:auto;background:none;border:0;font-size:18px;line-height:1;padding:0 4px}',
      '#xjPanel{position:fixed;z-index:2147483001;top:48px;right:8px;width:min(340px,calc(100vw - 16px));max-height:calc(100vh - 64px);overflow:auto;background:#16294a;color:#eef2f8;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:12px 14px;font:13px/1.7 "Noto Sans TC",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45)}',
      '#xjPanel h3{margin:0 0 6px;font-size:15px;display:flex;align-items:center;gap:8px}',
      '#xjPanel h4{margin:12px 0 4px;font-size:13px;color:#ffd97a}',
      '#xjPanel small{color:#aebbd0}',
      '#xjPanel label{display:block;cursor:pointer}',
      '#xjPanel button{font:inherit;color:#fff;background:#2c4a7c;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:2px 10px;cursor:pointer;margin:2px 4px 2px 0}',
      '#xjPanel button:disabled{opacity:.5;cursor:default}',
      '#xjPanel select{font:inherit}',
      '#xjPanel table{width:100%;border-collapse:collapse}',
      '#xjPanel td,#xjPanel th{padding:1px 4px;text-align:right;font-weight:normal}',
      '#xjPanel td:first-child,#xjPanel th:first-child{text-align:left}',
      '#xjToast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:2147483002;display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none}',
      '#xjToast div{background:#16294a;color:#fff;border:1px solid rgba(255,255,255,.25);padding:6px 14px;border-radius:8px;font:13px/1.6 "Noto Sans TC",sans-serif;max-width:90vw}',
      '#xjBoss{position:fixed;top:2px;left:8px;right:8px;height:16px;z-index:2147482999;background:rgba(0,0,0,.6);border-radius:4px;overflow:hidden;pointer-events:none;font:11px/16px sans-serif;color:#fff;text-align:center;text-shadow:0 0 2px #000}',
      '#xjBoss i{position:absolute;left:0;top:0;bottom:0;background:#c8323c}',
      '#xjBoss b{position:relative;font-weight:normal}',
      '#xjRisk{position:fixed;inset:0;z-index:2147483003;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}',
      '#xjRisk>div{width:min(420px,100%);background:#16294a;color:#eef2f8;border:1px solid #e0a040;border-radius:10px;padding:16px;font:14px/1.7 "Noto Sans TC",sans-serif}',
      '#xjRisk h3{margin:0 0 8px;font-size:16px;color:#ffd97a}',
      '#xjRisk p{margin:0 0 8px}',
      '#xjRisk b{color:#ff9d9d}',
      '#xjRisk small{display:block;color:#aebbd0;margin-bottom:4px}',
      '#xjRisk .btns{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}',
      '#xjRisk button{font:inherit;color:#fff;background:#2c4a7c;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:4px 14px;cursor:pointer}',
      '#xjRisk button.go{background:#a8552a}',
      '.xjPick{position:fixed;inset:0;z-index:2147483003;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}',
      '.xjPick>div{width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;background:#16294a;color:#eef2f8;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:14px 16px;font:14px/1.6 "Noto Sans TC",sans-serif}',
      '.xjPick h3{margin:0 0 6px;font-size:16px;color:#ffd97a;display:flex;align-items:center;gap:6px}',
      '.xjPick h3 img{width:24px;height:24px}',
      '.xjPick h4{margin:12px 0 4px;font-size:13px;color:#ffd97a}',
      '.xjPick small{color:#aebbd0;font-weight:normal}',
      '.xjPick button{font:inherit;color:#fff;background:#2c4a7c;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:4px 14px;cursor:pointer}',
      '.xjPick button:disabled{opacity:.5;cursor:default}',
      '.xjPick button.go{background:#a8552a}',
      '.xjPick .xjX{margin-left:auto;background:none;border:0;font-size:18px;line-height:1;padding:0 4px}',
      '.xjPick .rows{display:flex;flex-direction:column;gap:6px;margin-top:6px}',
      '.xjPick .row{text-align:left;padding:6px 10px}',
      '.xjPick .row b{display:block}',
      '.xjPick .row small{display:block}',
      '.xjPick .num{display:block;margin:2px 0}',
      '.xjPick input[type=number]{width:64px;font:inherit}',
      '.xjPick .chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}',
      '.xjPick .chip{display:flex;align-items:center;gap:4px;padding:2px 8px;font-size:12px}',
      '.xjPick .chip.on{background:#a8552a}',
      '.xjPick .shape-ico rect{fill:#dbe7ff}',
      '.xjPick .opts label{display:block;cursor:pointer}',
      '.xjPick .opts .pas{margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.2)}',
      '.xjPick .prev{margin:8px 0 0;color:#ffd97a;font-size:13px}',
      '.xjPick .btns{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}',
      '#xjCards .it{margin:4px 0;padding-top:4px;border-top:1px dashed rgba(255,255,255,.2)}',
      '#xjAdv label{display:inline-block;margin-right:8px}',
      '#xjAdv .row{margin:4px 0}',
      '#xjAdv .res{margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.2)}',
      '#xjAdv .gold{color:#ffd97a}',
      '#xjAdv svg.board{display:block;width:200px;height:200px;margin:4px 0}',
      '.xjCd{position:absolute;right:1px;top:0;font-size:10px;line-height:1.2;color:#ffe9a8;text-shadow:0 0 2px #000,0 0 2px #000;pointer-events:none}'
    ].join('');
    document.head.appendChild(st);
  };

  const installToast = () => {
    const box = document.createElement('div');
    box.id = 'xjToast';
    document.body.appendChild(box);
    toast = (text, ms) => {
      const d = document.createElement('div');
      d.textContent = text;
      box.appendChild(d);
      setTimeout(() => d.remove(), ms || 6000);
    };
    (window.__xjEarlyNotes || []).forEach(t => toast(t));
    window.__xjEarlyNotes = [];
  };

  /* ===== 收益統計 =====
   * 每 5 秒記一筆累計值，最近 10 分鐘的速度就是現在減掉 10 分鐘前。
   * 經驗用百分比算（升級時加 100），不用知道每級要多少經驗。 */
  const earnStart = O => {
    const sum = { zeny: 0, pct: 0, kill: 0, gear: 0, card: 0 };
    const samples = [];
    const start = Date.now();
    const pctNow = () => {
      const el = document.querySelector('#hud-exp');
      const w = el ? parseFloat(el.style.width) : NaN;
      return Number.isFinite(w) ? w : 0;
    };
    /* lastPct 第一筆才記：剛啟動時經驗條還沒畫，讀到的是 0，會把現有的經驗算成賺到的 */
    let lastZeny = O.game.char.zeny, lastPct = null, lastLv = O.game.char.lv, lastId = O.game.char.id;
    const realDrain = O.game.drainEvents;
    O.game.drainEvents = function () {
      const list = realDrain.apply(this, arguments);
      for (const e of list) {
        if (e.t === 'kill') sum.kill++;
        else if (e.t === 'card') sum.card++;
        else if (e.t === 'loot' && e.take && e.take.kept) sum.gear++;
      }
      return list;
    };
    const tick = () => {
      const c = O.game.char;
      if (c.id !== lastId) { lastId = c.id; lastZeny = c.zeny; lastPct = pctNow(); lastLv = c.lv; }
      /* 花錢（zeny 變少）不算收益 */
      if (c.zeny > lastZeny) sum.zeny += c.zeny - lastZeny;
      lastZeny = c.zeny;
      const p = pctNow();
      if (lastPct === null) lastPct = p;
      sum.pct += (c.lv - lastLv) * 100 + p - lastPct;
      lastPct = p;
      lastLv = c.lv;
      samples.push(Object.assign({ at: Date.now() }, sum));
      while (samples.length > 130) samples.shift();
    };
    setInterval(tick, 5000);
    return {
      html: () => {
        const num = v => Math.round(v).toLocaleString();
        const now = Date.now();
        const rate = (k, from) => {
          const sec = (now - from.at) / 1000;
          return sec > 0 ? (sum[k] - from[k]) / sec * 3600 : 0;
        };
        const zero = Object.assign({ at: start }, { zeny: 0, pct: 0, kill: 0, gear: 0, card: 0 });
        const old = samples.find(s => now - s.at <= 600000) || zero;
        const row = (name, k, fmt) => '<tr><td>' + name + '</td><td>' + (fmt || num)(rate(k, old)) + '</td><td>' + (fmt || num)(rate(k, zero)) + '</td></tr>';
        const pct = v => v.toFixed(1) + '％';
        const pr = rate('pct', old);
        const left = 100 - pctNow();
        const eta = pr > 0 ? (left / pr * 60 < 120 ? Math.ceil(left / pr * 60) + ' 分鐘' : (left / pr).toFixed(1) + ' 小時') : '—';
        return '<table><tr><th>每小時</th><th>最近10分</th><th>開始以來</th></tr>' +
          row('Zeny', 'zeny') + row('經驗', 'pct', pct) + row('擊殺', 'kill') + row('裝備', 'gear') + row('卡片', 'card') +
          '</table><small>照最近的速度，再 ' + eta + ' 升級；統計 ' + Math.round((now - start) / 60000) + ' 分鐘</small>';
      }
    };
  };

  /* ===== 自動精煉 =====
   * 直接按遊戲的精煉按鈕，規則、保護、扣素材都是遊戲自己處理。材料不夠時按鈕會變成不能按，就停下來。 */
  const refineCtl = (O, src) => {
    const maxMatch = /精煉到 \+\$\{([\w$]+)\.max\}/.exec(src);
    if (maxMatch) window.__xjRefMax = Number(window.__XJ.eval(maxMatch[1] + '.max')) || undefined;
    const ctl = { on: false, target: 9, msg: '' };
    const forge = () => O.panels && O.panels.forge;
    const current = () => {
      const f = forge();
      if (!f || f.selected == null) return null;
      const c = O.game.char;
      return c.bag.concat(Object.values(c.equip)).find(i => i && i.uid === f.selected) || null;
    };
    ctl.stop = msg => { ctl.on = false; ctl.msg = msg; };
    ctl.start = () => {
      if (!current()) { ctl.msg = '先在煉金工坊的「精煉」分頁選一件裝備'; return; }
      ctl.on = true;
      ctl.msg = '精煉中…';
    };
    setInterval(() => {
      if (!ctl.on) return;
      const it = current();
      if (!it) return ctl.stop('找不到這件裝備（可能分解或存進倉庫了），已停止');
      if (it.ref >= ctl.target) return ctl.stop('已達到 +' + it.ref + '，已停止');
      const b = document.querySelector('[data-fdo="refine"]');
      if (!b) return ctl.stop('煉金工坊的精煉分頁被關掉了，已停止');
      if (b.disabled) return ctl.stop(b.textContent.trim() + '，已停止');
      b.click();
    }, 400);
    return ctl;
  };

  /* ===== 會修改遊戲的功能：使用前的風險提示 =====
   * 回傳 Promise：按「我了解，繼續」是 true，其他（取消、點外面、Esc）都是 false。 */
  const confirmRisk = (title, lines) => new Promise(resolve => {
    const box = document.createElement('div');
    box.id = 'xjRisk';
    const inner = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = '⚠️ ' + title;
    const warn = document.createElement('p');
    warn.innerHTML = '這個功能會修改遊戲。<b>修改後可能會無法上榜，並被封鎖發言。</b>請自行評估後再決定要不要使用。';
    inner.append(h, warn);
    lines.forEach(t => {
      const s = document.createElement('small');
      s.textContent = t;
      inner.appendChild(s);
    });
    const btns = document.createElement('div');
    btns.className = 'btns';
    const no = document.createElement('button');
    no.textContent = '取消';
    const yes = document.createElement('button');
    yes.textContent = '我了解，繼續';
    yes.className = 'go';
    btns.append(no, yes);
    inner.appendChild(btns);
    box.appendChild(inner);
    const done = v => {
      document.removeEventListener('keydown', onKey, true);
      box.remove();
      resolve(v);
    };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); done(false); } };
    document.addEventListener('keydown', onKey, true);
    no.addEventListener('click', () => done(false));
    yes.addEventListener('click', () => done(true));
    box.addEventListener('click', e => { if (e.target === box) done(false); });
    document.body.appendChild(box);
    no.focus();
  });
  const RISK_SAVE = '修改的結果會存進存檔；有登入 Google 的話也會上傳雲端。遊戲的雲端存檔有伺服器檢查，沒通過時會改回雲端上的存檔，帳號之後也不能上線上排行。建議先到「選單」下載一份備份。';

  const RISK_COOP = '開著的時候不能使用協力（開房間、加入都會被擋下）。';

  /* ===== 單格模式的開關 =====
   * 開：畫面馬上生效。關：存檔後重新載入框架，讓遊戲讀檔時自己把重疊的寶石卸下（只是回到背包，不會消失）。 */
  const setOneCell = async (O, on) => {
    if (on) {
      if (inCoop()) return false;
      const ok = await confirmRisk('開啟單格模式', ['開啟後每顆技能寶石只佔一格、輔助寶石不用相鄰就生效。', RISK_SAVE, RISK_COOP, '關閉單格模式、或沒有用書籤玩的時候，盤面上重疊的寶石會自動卸下回到背包。']);
      if (!ok || inCoop()) return false;
    }
    cfg.oneCell = on;
    saveCfg();
    window.__xjOne = on;
    if (on) {
      O.game.refresh();
      O.panels.host.changed();
      toast('單格模式已開啟');
    } else {
      O.panels.host.save();
      location.reload();
    }
    return true;
  };

  /* ===== 精煉失敗不退階的開關：主程式啟動時就改好了，這裡只切換開關，馬上生效 ===== */
  const setNoDown = async (O, on) => {
    if (on) {
      if (inCoop()) return false;
      const ok = await confirmRisk('開啟精煉失敗不退階', ['開啟後精煉失敗時精煉值不變，素材和 Zeny 照扣。遊戲的精煉本來就不會讓裝備消失。', RISK_SAVE, RISK_COOP]);
      if (!ok || inCoop()) return false;
    }
    cfg.noDown = on;
    saveCfg();
    window.__xjNoDown = on;
    O.panels.host.changed();
    toast(on ? '精煉失敗不退階已開啟' : '精煉失敗不退階已關閉');
    return true;
  };

  /* ===== 隨時取出卡片 =====
   * 遊戲的「拆卸」要到城鎮的鐵匠、花魔力礦石和 Zeny、失敗時卡片消失；這裡直接取出，一定成功，不花東西。
   * 卡片名稱和「把卡片加回去」的函式用遊戲自己的（加回去時會處理持有上限、圖鑑紀錄），名稱每次打包都會換，從主程式文字找。 */
  const cardTool = (O, src) => {
    const ev = window.__XJ.eval;
    const nameMatch = /let n=([\w$]+)\[a\],i=[\w$]+\(t,e,o,this\.opts\)/.exec(src);
    const addMatch = /return ([\w$]+)&&([\w$]+)\(e,o\),\{ok:\1,id:o,plan:a\}/.exec(src);
    const itemMatch = /獲得 \$\{([\w$]+)\(e\)\}（\$\{[\w$]+\(e\)\}）/.exec(src);
    if (!nameMatch || !addMatch) throw new Error('找不到卡片的函式');
    const table = ev(nameMatch[1]);
    const addCard = ev(addMatch[2]);
    const nameFn = itemMatch ? ev(itemMatch[1]) : null;
    const itemName = it => {
      try { const n = nameFn && nameFn(it); if (n) return n; } catch (e) {}
      return it.base || ('裝備 ' + it.uid);
    };
    if (typeof addCard !== 'function' || !table) throw new Error('找不到卡片的函式');
    const items = () => O.panels.forge.all().filter(it => it && it.cards && it.cards.some(Boolean));
    const fill = box => {
      box.textContent = '';
      const worn = new Set(Object.values(O.game.char.equip));
      const list = items();
      if (!list.length) {
        const none = document.createElement('small');
        none.textContent = '身上和背包的裝備都沒有鑲卡片。';
        box.appendChild(none);
        return;
      }
      for (const it of list) {
        const row = document.createElement('div');
        row.className = 'it';
        const title = document.createElement('small');
        title.textContent = (worn.has(it) ? '身上・' : '') + itemName(it);
        row.appendChild(title);
        row.appendChild(document.createElement('br'));
        it.cards.forEach((id, slot) => {
          if (!id) return;
          const b = document.createElement('button');
          b.textContent = '取出 ' + (table[id] ? table[id].n : id);
          b.dataset.xjcardItem = it.uid;
          b.dataset.xjcardSlot = slot;
          row.appendChild(b);
        });
        box.appendChild(row);
      }
    };
    const take = (uid, slot, box) => {
      const it = O.panels.forge.all().find(i => i && i.uid === uid);
      const id = it && it.cards[slot];
      if (!id) { fill(box); return; }
      if (inCoop()) return;
      window.__xjCardUsed = true;
      it.cards[slot] = null;
      addCard(O.game.char, id);
      O.game.refresh();
      O.panels.host.save();
      O.panels.host.changed();
      toast('已取出卡片：' + (table[id] ? table[id].n : id));
      fill(box);
    };
    return { fill: fill, take: take };
  };

  /* ===== 自訂天氣 =====
   * 存檔裡的天氣只有 char.wx = {k: 種類, t: 開始時間}，時間用遊戲的 clock，這樣剩餘時間的計算都照遊戲自己的。
   * 天氣表從「隨機挑一種天氣」的函式找；這種寫法不只天氣用，所以再看內容是不是天氣（有 color 和 lines）。 */
  const wxTool = (O, src) => {
    let list = null;
    const re = /=e=>e\.weighted\(([\w$]+),e=>e\.w\)/g;
    let m;
    while (!list && (m = re.exec(src))) {
      let v = null;
      try { v = window.__XJ.eval(m[1]); } catch (e) {}
      if (Array.isArray(v) && v.length && v.every(w => w && w.id && w.name && w.color && Array.isArray(w.lines))) list = v;
    }
    if (!list) throw new Error('找不到天氣表');
    return {
      list: list,
      current: () => O.game.wx || null,
      apply: id => {
        if (inCoop()) return false;
        const c = O.game.char;
        const w = list.find(x => x.id === id);
        if (!w && id) return false;
        window.__xjWxUsed = true;
        c.wx = w ? { k: w.id, t: O.game.clock } : null;
        O.game.refresh();
        O.panels.host.save();
        O.panels.host.changed();
        toast(w ? '天氣已改成' + w.name + '（持續 4 小時）' : '天氣已清除');
        return true;
      }
    };
  };

  /* ===== 商人賣的技能寶石：購買時選擇變異 =====
   * 點「購買」先跳視窗選一般、變異或多重變異；有附加能力可選的，再跳第二個視窗選。
   * 價錢和能不能買都照遊戲自己的購買流程（呼叫原本的 click），買到之後才把變異寫到新寶石上。
   * 能選的東西跟遊戲掉落的變異相同（見遊戲裡產生變異的函式），數值也在遊戲的範圍內，存檔讀回來不會被改掉：
   *   - 傷害技能：變異可以多 1 種元素或失去原本的元素；多重變異多 2 種元素
   *   - 沒傷害的技能：變異可以有 1 種詛咒；多重變異 2 種詛咒，大多數可以再加「被動：常駐生效」
   *   - 輔助：只有變異，有標籤限制的可以選「泛用」
   *   - 被動寶石沒有變異，照舊直接買
   * 遊戲的變異可能帶「失敗」的代價（反噬、扣生命），這裡不提供。形狀只能和遊戲一樣多一格或少一格。 */
  const gemShop = (O, src) => {
    const ev = window.__XJ.eval;
    const find = re => {
      const m = re.exec(src);
      if (!m) throw new Error('找不到變異寶石的資料');
      return m.slice(1).map(n => ev(n));
    };
    const [, skills, noDmg, sups] = find(/function ([\w$]+)\(e\)\{return ([\w$]+)\[e\]\?([\w$]+)\.has\(e\)\?`nodmg`:`dmg`:([\w$]+)\[e\]\?`support`:`other`\}/);
    const [noPas, N] = find(/!([\w$]+)\.has\(t\)&&e\.chance\(([\w$]+)\.passive\)/);
    const [elName] = find(/失去\$\{([\w$]+)\[n\]\}/);
    const [curseName] = find(/詛咒：\$\{r\.cs\.map\(e=>([\w$]+)\[e\]\?\?e\)/);
    const [shapeIcon, shapeOf, gemIcon] = find(/title="寶石形狀">\$\{([\w$]+)\(([\w$]+)\(t\),0\)\}<\/span>\$\{([\w$]+)\(t,`gem-li-ic`\)\}/);
    const [gemName] = find(/購買寶石：\$\{([\w$]+)\(n\.sgem\)\}/);
    const [describe] = find(/let n=([\w$]+)\(e\);t\+=`（\$\{e\.mu\?\.m/);
    const fns = [shapeIcon, shapeOf, gemIcon, gemName, describe];
    const tables = [skills, sups, elName, curseName];
    if (fns.some(f => typeof f !== 'function') || tables.some(t => !t || typeof t !== 'object') || !noDmg || !noDmg.has || !noPas || !noPas.has) throw new Error('找不到變異寶石的資料');
    const shop = O.panels.shop;
    const realClick = shop.click;
    const range = key => (N && N[key]) || 50;
    const maxCells = () => (N && N.maxCells) || 6;
    const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

    /* 形狀：字串 "x,y" 的陣列，正規化方式跟遊戲一樣（由上而下、由左而右排序，第一格當原點） */
    const toCells = sh => sh.map(c => { const p = c.split(',').map(Number); return { x: p[0], y: p[1] }; });
    const toShape = cells => {
      const t = cells.slice().sort((a, b) => a.y - b.y || a.x - b.x);
      return t.map(c => (c.x - t[0].x) + ',' + (c.y - t[0].y));
    };
    const linked = cells => {
      if (!cells.length) return false;
      const all = new Set(cells.map(c => c.x + ',' + c.y));
      const seen = new Set([cells[0].x + ',' + cells[0].y]);
      const todo = [cells[0]];
      while (todo.length) {
        const c = todo.pop();
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const k = (c.x + dx) + ',' + (c.y + dy);
          if (all.has(k) && !seen.has(k)) { seen.add(k); todo.push({ x: c.x + dx, y: c.y + dy }); }
        }
      }
      return seen.size === all.size;
    };
    /* 旋轉後相同的算同一種，寶石放上盤面時本來就能轉 */
    const shapeKey = sh => {
      let best = '';
      let cells = toCells(sh);
      for (let i = 0; i < 4; i++) {
        const k = toShape(cells).slice().sort().join('|');
        if (!best || k < best) best = k;
        cells = cells.map(c => ({ x: -c.y, y: c.x }));
      }
      return best;
    };
    const shapeChoices = id => {
      const base = [...shapeOf(id)];
      const cells = toCells(base);
      const out = [base];
      const seen = new Set([shapeKey(base)]);
      const add = sh => { const k = shapeKey(sh); if (!seen.has(k)) { seen.add(k); out.push(sh); } };
      if (cells.length > 1) cells.forEach(c => { const rest = cells.filter(o => o !== c); if (linked(rest)) add(toShape(rest)); });
      if (cells.length < maxCells()) {
        const raw = new Set(cells.map(c => c.x + ',' + c.y));
        cells.forEach(c => [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
          const k = (c.x + dx) + ',' + (c.y + dy);
          if (!raw.has(k)) add(toShape(cells.concat([{ x: c.x + dx, y: c.y + dy }])));
        }));
      }
      return out;
    };

    /* 這顆寶石、這種變異可以選的附加能力。沒得選時回傳 fixed（直接買，內容固定） */
    const addons = (id, multi) => {
      if (sups[id]) return sups[id].req ? { pick: 1, opts: [{ label: '不附加', val: {} }, { label: '泛用：不限標籤', val: { free: 1 } }] } : { fixed: {} };
      if (noDmg.has(id)) {
        const cs = Object.keys(curseName);
        if (!multi) return { pick: 1, opts: [{ label: '不附加', val: {} }].concat(cs.map(c => ({ label: '詛咒：' + curseName[c], val: { cs: [c] } }))) };
        return { pick: 2, field: 'cs', opts: cs.map(c => ({ label: '詛咒：' + curseName[c], key: c })), pas: !noPas.has(id) };
      }
      const own = elName[skills[id].ail] ? skills[id].ail : null;
      const others = Object.keys(elName).filter(e => e !== own);
      if (multi) {
        if (own) return { fixed: { el: [own].concat(others) } };
        return { pick: 2, field: 'el', opts: others.map(e => ({ label: '+' + elName[e], key: e })) };
      }
      const opts = [{ label: '不附加', val: {} }].concat(others.map(e => ({ label: '+' + elName[e], val: { el: own ? [own, e] : [e] } })));
      if (own) opts.push({ label: '失去' + elName[own], val: { el: [] } });
      return { pick: 1, opts: opts };
    };

    /* 屬性順序跟遊戲一樣，掉落的寶石數值相同時才會疊在一起 */
    const makeMu = (id, st, multi, add) => {
      const mu = { d: st.d / 100 };
      if (multi) mu.m = 1;
      if (skills[id] && skills[id].cd > 0) mu.cd = st.cd / 100;
      for (const k of ['el', 'free', 'cs', 'pas']) if (add[k] !== undefined) mu[k] = add[k];
      return mu;
    };

    /* 跳出來的視窗，可以疊兩層；Esc、點外面、× 只關最上面那層 */
    const stack = [];
    const onKey = e => {
      if (e.key !== 'Escape' || !stack.length) return;
      e.stopPropagation();
      e.preventDefault();
      stack[stack.length - 1]();
    };
    const popup = (title, html) => {
      const box = document.createElement('div');
      box.className = 'xjPick';
      box.innerHTML = '<div><h3>' + title + '<button class="xjX" aria-label="關閉">×</button></h3>' + html + '</div>';
      const close = () => {
        const i = stack.indexOf(close);
        if (i >= 0) stack.splice(i, 1);
        box.remove();
        if (!stack.length) document.removeEventListener('keydown', onKey, true);
      };
      if (!stack.length) document.addEventListener('keydown', onKey, true);
      stack.push(close);
      /* 在輸入框打字時不要觸發遊戲的快捷鍵 */
      box.addEventListener('keydown', e => e.stopPropagation());
      box.addEventListener('click', e => { if (e.target === box || e.target.closest('.xjX')) close(); });
      document.body.appendChild(box);
      return { box: box, close: close };
    };
    const closeAll = () => { while (stack.length) stack[stack.length - 1](); };

    const buy = (id, mu, sh) => {
      if (mu && inCoop()) return;
      const c = O.game.char;
      const before = c.gems.length;
      realClick.call(shop, { closest: () => ({ dataset: { sgem: id } }) });
      closeAll();
      if (!mu || c.gems.length <= before) return;
      window.__xjGemUsed = true;
      const gem = c.gems[c.gems.length - 1];
      gem.mu = mu;
      gem.sh = sh;
      gem.nw = 1;
      O.panels.host.save();
      O.panels.host.changed();
      toast((mu.m ? '多重變異' : '變異') + '：' + (describe(gem) || '數值不變'));
    };

    const openAddon = (id, st, multi, spec) => {
      const list = spec.opts.map((o, i) => '<label><input type="' + (spec.pick === 1 ? 'radio' : 'checkbox') + '" name="xjAddon" value="' + i + '"' + (spec.pick === 1 && i === 0 ? ' checked' : '') + '> ' + esc(o.label) + '</label>').join('');
      const pas = spec.pas ? '<label class="pas"><input type="checkbox" data-pas> 被動：常駐生效</label>' : '';
      const head = esc(gemName(id)) + '・' + (multi ? '多重變異' : '變異');
      const w = popup('選擇附加能力', '<small>' + head + (spec.pick === 2 ? '：選 2 個' : '：選 1 個') + '</small><div class="opts">' + list + pas + '</div><p class="prev"></p><div class="btns"><button data-back>上一步</button><button class="go" data-ok>購買 200 Zeny</button></div>');
      const picked = [];
      const current = () => {
        if (spec.pick === 1) return spec.opts[Number(w.box.querySelector('[name=xjAddon]:checked').value)].val;
        const add = {};
        if (picked.length === 2) add[spec.field] = picked.map(i => spec.opts[i].key);
        const p = w.box.querySelector('[data-pas]');
        if (p && p.checked) add.pas = 1;
        return add;
      };
      const update = () => {
        const add = current();
        const ok = spec.pick === 1 || picked.length === 2;
        w.box.querySelector('[data-ok]').disabled = !ok;
        w.box.querySelector('.prev').textContent = ok ? (describe({ id: id, mu: makeMu(id, st, multi, add), sh: st.sh }) || '數值不變') : '還要選 ' + (2 - picked.length) + ' 個';
      };
      w.box.addEventListener('change', e => {
        if (spec.pick === 2 && e.target.name === 'xjAddon') {
          const i = Number(e.target.value);
          if (e.target.checked) {
            picked.push(i);
            /* 超過 2 個時取消最早選的 */
            if (picked.length > 2) w.box.querySelector('[name=xjAddon][value="' + picked.shift() + '"]').checked = false;
          } else picked.splice(picked.indexOf(i), 1);
        }
        update();
      });
      w.box.addEventListener('click', e => {
        if (e.target.closest('[data-back]')) w.close();
        else if (e.target.closest('[data-ok]')) buy(id, makeMu(id, st, multi, current()), st.sh);
      });
      update();
    };

    const open = id => {
      const isDmg = !!skills[id] && !noDmg.has(id);
      const hasCd = !!skills[id] && skills[id].cd > 0;
      const dMax = sups[id] ? range('supRange') : isDmg ? range('dmgRange') : range('effRange');
      const cdMax = range('cdRange');
      const shapes = shapeChoices(id);
      const st = { d: dMax, cd: hasCd ? -cdMax : 0, sh: shapes[0] };
      const num = (key, name, min, max, val) => '<label class="num">' + name + ' <input type="number" data-num="' + key + '" min="' + min + '" max="' + max + '" step="1" value="' + val + '">％ <small>' + min + '～+' + max + '</small></label>';
      const chips = shapes.map((sh, i) => '<button class="chip' + (i ? '' : ' on') + '" data-shape="' + i + '" title="' + sh.length + ' 格"><span class="shape-ico">' + shapeIcon(sh, 0) + '</span>' + sh.length + ' 格</button>').join('');
      const row = (kind, name) => '<button class="row" data-kind="' + kind + '"><b>' + name + '</b><small></small></button>';
      const w = popup(gemIcon(id, 'gem-li-ic') + esc(gemName(id)) + ' <small>200 Zeny</small>',
        '<h4>變異的數值和形狀</h4>' + num('d', isDmg ? '傷害' : '效果', -dMax, dMax, st.d) + (hasCd ? num('cd', '冷卻時間', -cdMax, cdMax, st.cd) : '') +
        '<div class="chips">' + chips + '</div>' +
        '<h4>選要買的樣子</h4><div class="rows">' + row('plain', '一般') + row('mut', '變異') + (skills[id] ? row('multi', '多重變異') : '') + '</div>');
      const update = () => {
        w.box.querySelector('[data-kind=plain] small').textContent = '和原本商店賣的一樣，沒有變異';
        for (const [kind, multi] of [['mut', false], ['multi', true]]) {
          const el = w.box.querySelector('[data-kind=' + kind + '] small');
          if (!el) continue;
          const spec = addons(id, multi);
          const text = describe({ id: id, mu: makeMu(id, st, multi, spec.fixed || {}), sh: st.sh });
          el.textContent = (text || '數值不變') + (spec.fixed ? '' : '；接著選附加能力');
        }
      };
      w.box.addEventListener('input', e => {
        const key = e.target.dataset && e.target.dataset.num;
        if (!key) return;
        const max = key === 'd' ? dMax : cdMax;
        const v = Math.round(Number(e.target.value));
        st[key] = Number.isFinite(v) ? Math.max(-max, Math.min(max, v)) : 0;
        update();
      });
      w.box.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.num) e.target.value = st[e.target.dataset.num]; });
      w.box.addEventListener('click', e => {
        const chip = e.target.closest('[data-shape]');
        if (chip) {
          st.sh = shapes[Number(chip.dataset.shape)];
          w.box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === chip));
          update();
          return;
        }
        const b = e.target.closest('[data-kind]');
        if (!b) return;
        if (b.dataset.kind === 'plain') { buy(id); return; }
        const multi = b.dataset.kind === 'multi';
        const spec = addons(id, multi);
        if (spec.fixed) buy(id, makeMu(id, st, multi, spec.fixed), st.sh);
        else openAddon(id, st, multi, spec);
      });
      update();
    };

    shop.click = function (el) {
      const b = el.closest('[data-sgem]');
      if (b && (skills[b.dataset.sgem] || sups[b.dataset.sgem])) {
        open(b.dataset.sgem);
        return true;
      }
      return realClick.apply(this, arguments);
    };
  };

  /* ===== 配裝、配技能推薦 =====
   * 比較的數字是遊戲自己的預估 DPS 和生存（背包「建議更換」用的同一套）。把角色淺複製一份，換上別的裝備或排法再算，
   * 算的時候不會動到存檔；要按「套用」才會真的換。單格模式開著時形狀和連結會照單格規則算。
   *   - 裝備：一個部位一個部位試，同部位每一件都換上去算，留分數最高的；整輪最多做兩次。雙手武器和盾牌的衝突用遊戲的穿裝函式處理。
   *   - 技能盤：模擬退火。從目前的排法出發，每一步隨機放上、拿下、移動或替換一顆，變好就接受，變差也有機率接受，
   *     越到後面機率越低；全程記住最好的一份。
   *   - 裝備和技能盤會互相影響，兩個都要算時做「裝備、技能盤、裝備」。
   * 分數 = DPS，生存低於底線時大幅扣分；再加一點點生存和寶石數的比重，傷害相同時挑比較耐打、寶石比較少的。
   * 預估 DPS 只算技能傷害和普攻，沒有傷害的技能會被當成沒用，所以預設留在盤上（keep）。
   * 卡片不列入：鑲卡要到鐵匠、花素材，而且可能失敗。 */
  const advisor = (O, src) => {
    const ev = window.__XJ.eval;
    const est = /dps:([\w$]+)\(\w+,\w+\.char\),surv:([\w$]+)\(\w+,([\w$]+)\[\w+\.char\.cls\],\w+\)/.exec(src);
    const find = re => { const m = re.exec(src); if (!m) throw new Error('找不到 ' + re); return ev(m[1]); };
    if (!est) throw new Error('找不到預估 DPS');
    const dpsOf = ev(est[1]), survOf = ev(est[2]), classes = ev(est[3]);
    const equipFn = find(/new Set\(\w+\.bag\.map\(\w+=>\w+\.uid\)\),\w+=([\w$]+)\(\w+,\w+\.uid\)/);
    const fitFn = find(/function ([\w$]+)\(\w,\w\)\{\s*let \w=[\w$]+\(\w,\w\.uid\);\s*if\(!\w\)return`nogem`/);
    const drawFn = find(/([\w$]+)\(\w+,\{linked:\w+,held:/);
    const skillsFn = find(/\w+=this\.fake\(\w+\),\w+=new Map\(\w+\.gems\.map\(\w+=>\[\w+\.uid,\w+\]\)\),\w+=([\w$]+)\(\w+\)/);
    const gemName = find(/function ([\w$]+)\(\w\)\{\s*let \w=[\w$]+\(\w\.id\);\s*if\(\w\.sx&&\(\w\+=`（穿梭）`/);
    const itemName = find(/獲得 \$\{([\w$]+)\(e\)\}（\$\{[\w$]+\(e\)\}）/);
    const slotNames = find(/<small>\$\{([\w$]+)\[\w\]\}<\/small>\$\{\w\?`<span class="eq-nm">/);
    if (![dpsOf, survOf, equipFn, fitFn, drawFn, skillsFn, gemName, itemName].every(f => typeof f === 'function') || !classes[O.game.char.cls] || !slotNames.weapon) throw new Error('找不到比較用的函式');
    if (typeof O.panels.bag.base !== 'function') throw new Error('找不到背包面板');

    const slots = Object.keys(slotNames);
    const opt = { gear: true, gems: true, keep: true, surv: 100, secs: 6, slots: {} };
    for (const sl of slots) opt.slots[sl] = true;
    let run = 0, busy = false, msg = '', res = null, undo = null;
    const esc = t => String(t).replace(/[&<>"]/g, ch => '&#' + ch.charCodeAt(0) + ';');
    const num = v => Math.round(v).toLocaleString();
    const box = () => document.getElementById('xjAdv');

    /* 每產生一次值就是算完一步，值是目前進度的文字；call 的人決定什麼時候把控制權還給瀏覽器 */
    const solve = function* () {
      const c = O.game.char;
      const mob = O.panels.bag.base().mobLv;
      const measure = n => {
        const d = O.game.deriveFor(n);
        return { d: d, dps: dpsOf(d, n), surv: survOf(d, classes[n.cls], mob) };
      };
      let s = Object.assign({}, c, { equip: Object.assign({}, c.equip), bag: [], board: c.board.map(b => Object.assign({}, b)) });
      const before = measure(s);
      const floor = before.surv * opt.surv / 100;
      const score = m => {
        let v = (m.dps + 1e-6) * Math.pow(m.surv / before.surv, 0.02);
        if (m.surv < floor) v *= Math.pow(m.surv / floor, 8);
        return v;
      };

      const gearPass = function* () {
        const pool = {};
        let total = 0, done = 0;
        for (const sl of slots) {
          if (!opt.slots[sl]) continue;
          pool[sl] = c.bag.concat(Object.values(c.equip)).filter(t => t.slot === sl);
          total += pool[sl].length;
        }
        for (let pass = 0; pass < 2; pass++) {
          let changed = false;
          for (const sl of Object.keys(pool)) {
            let best = null, bestV = score(measure(s));
            for (const t of pool[sl]) {
              done++;
              if (s.equip[sl] === t) continue;
              const n = Object.assign({}, s, { equip: Object.assign({}, s.equip), bag: [t] });
              if (equipFn(n, t.uid)) continue;
              n.bag = [];
              const v = score(measure(n));
              if (v > bestV * (1 + 1e-6)) { bestV = v; best = n; }
              yield '比較裝備… ' + Math.min(99, Math.round(done / (total * 2) * 100)) + '%';
            }
            if (best) { s = best; changed = true; }
          }
          if (!changed) break;
        }
      };

      const boardPass = function* () {
        const rnd = n => Math.floor(Math.random() * n);
        const keep = new Set();
        if (opt.keep) for (const k of skillsFn(s, before.d.mods)) if (!(k.def.mult > 0)) keep.add(k.uid);
        const value = b => score(measure(Object.assign({}, s, { board: b }))) * (1 - 0.0005 * b.length);
        const fits = (b, g) => fitFn(Object.assign({}, s, { board: b }), g) === null;
        /* 形狀旋轉後錨點可能在盤面外，所以範圍比 0～5 大一點；放不下的很快就會被排除 */
        const at = uid => ({ uid: uid, rot: rnd(4), ox: rnd(10) - 2, oy: rnd(10) - 2 });
        let cur = s.board, curV = value(cur), best = cur, bestV = curV;
        const t0 = Date.now(), total = opt.secs * 1000;
        const step = T => {
          const free = c.gems.filter(g => !cur.some(b => b.uid === g.uid));
          const movable = cur.filter(b => !keep.has(b.uid));
          const next = cur.slice();
          const r = Math.random();
          if (r < 0.4 || !cur.length) {
            if (!free.length) return;
            const g = at(free[rnd(free.length)].uid);
            if (!fits(next, g)) return;
            next.push(g);
          } else if (r < 0.55) {
            if (!movable.length) return;
            next.splice(next.indexOf(movable[rnd(movable.length)]), 1);
          } else if (r < 0.85) {
            const i = rnd(next.length), g = at(next[i].uid);
            next.splice(i, 1);
            if (!fits(next, g)) return;
            next.push(g);
          } else {
            if (!free.length || !movable.length) return;
            const old = movable[rnd(movable.length)];
            const g = { uid: free[rnd(free.length)].uid, rot: rnd(4), ox: old.ox, oy: old.oy };
            next.splice(next.indexOf(old), 1);
            if (!fits(next, g)) return;
            next.push(g);
          }
          const v = value(next);
          if (v >= curV || Math.random() < Math.exp((v - curV) / (Math.max(curV, 1e-9) * T))) {
            cur = next; curV = v;
            if (v > bestV) { best = next; bestV = v; }
          }
        };
        while (Date.now() - t0 < total) {
          const frac = (Date.now() - t0) / total;
          step(0.08 * Math.pow(0.01, frac));
          yield '排技能盤… ' + Math.round(frac * 100) + '%';
        }
        /* 收尾：拿掉也不影響分數的寶石就拿掉 */
        for (const b of best.slice()) {
          if (keep.has(b.uid)) continue;
          const rest = best.filter(o => o !== b);
          const v = value(rest);
          if (v >= bestV) { best = rest; bestV = v; }
        }
        s = Object.assign({}, s, { board: best });
      };

      if (opt.gear) yield* gearPass();
      if (opt.gems) yield* boardPass();
      if (opt.gear && opt.gems) yield* gearPass();

      const after = measure(s);
      const key = b => b.uid + ':' + b.rot + ':' + b.ox + ':' + b.oy;
      const list = b => b.map(key).sort().join();
      const gemOf = uid => c.gems.find(g => g.uid === uid);
      const had = new Set(c.board.map(b => b.uid)), has = new Set(s.board.map(b => b.uid));
      const skills = skillsFn(s, after.d.mods);
      const linked = new Set();
      for (const k of skills) for (const u of k.supports) linked.add(u);
      return {
        char: c, before: before, after: after,
        eq: Object.fromEntries(slots.filter(sl => s.equip[sl]).map(sl => [sl, s.equip[sl].uid])),
        board: s.board.map(b => Object.assign({}, b)),
        gear: slots.filter(sl => (s.equip[sl] && s.equip[sl].uid) !== (c.equip[sl] && c.equip[sl].uid))
          .map(sl => slotNames[sl] + '：' + (c.equip[sl] ? itemName(c.equip[sl]) : '（空）') + ' → ' + (s.equip[sl] ? itemName(s.equip[sl]) : '（空）')),
        boardChanged: list(s.board) !== list(c.board),
        put: [...has].filter(u => !had.has(u)).map(u => gemName(gemOf(u))),
        off: [...had].filter(u => !has.has(u) && gemOf(u)).map(u => gemName(gemOf(u))),
        links: skills.map(k => k.def.name + (k.supports.length ? ' ← ' + k.supports.map(u => gemName(gemOf(u))).join('、') : '')),
        svg: opt.gems ? drawFn(s, { linked: linked }) + '</svg>' : ''
      };
    };

    /* 把角色改成指定的裝備和排法。武器排在部位最前面，雙手武器和盾牌的衝突會先處理掉 */
    const applyTo = t => {
      const c = O.game.char;
      const fails = [];
      for (const sl of slots) {
        const want = t.eq[sl], cur = c.equip[sl];
        if ((cur && cur.uid) === want) continue;
        if (want === undefined) {
          c.bag.push(cur);
          delete c.equip[sl];
          continue;
        }
        const err = equipFn(c, want);
        if (err) fails.push(slotNames[sl] + '：' + err);
      }
      const test = Object.assign({}, c, { board: [] });
      for (const b of t.board) {
        if (fitFn(test, b) === null) test.board.push(Object.assign({}, b));
        else fails.push('有寶石放不下');
      }
      O.panels.board.reset();
      c.board = test.board;
      O.panels.board.apply();
      O.panels.bag.apply();
      O.panels.host.save();
      return fails;
    };

    const fill = () => {
      const el = box();
      if (!el) return;
      const check = (key, name) => '<label><input type="checkbox" data-adv="' + key + '"' + (opt[key] ? ' checked' : '') + '> ' + name + '</label>';
      let h = '<div class="row">' + check('gear', '配裝備') + check('gems', '配技能') + '</div>' +
        '<div class="row"><small>可以換的部位</small><br>' + slots.map(sl => '<label><input type="checkbox" data-advslot="' + sl + '"' + (opt.slots[sl] ? ' checked' : '') + '> ' + esc(slotNames[sl]) + '</label>').join('') + '</div>' +
        '<div class="row">生存不低於目前的 <select data-adv="surv">' + [100, 90, 80, 50, 0].map(v => '<option value="' + v + '"' + (opt.surv === v ? ' selected' : '') + '>' + (v ? v + '％' : '不限') + '</option>').join('') + '</select></div>' +
        '<div class="row">' + check('keep', '盤上沒有傷害的技能不要拿掉') + '</div>' +
        '<div class="row">技能盤計算時間 <select data-adv="secs">' + [3, 6, 15, 30].map(v => '<option value="' + v + '"' + (opt.secs === v ? ' selected' : '') + '>' + v + ' 秒</option>').join('') + '</select></div>' +
        (busy ? '<button id="xjAdvStop">停止</button>' : '<button id="xjAdvGo">開始計算</button>') +
        (undo && !busy ? '<button id="xjAdvUndo">復原成套用前</button>' : '') +
        '<br><small id="xjAdvMsg">' + esc(msg) + '</small>';
      if (res) {
        const pct = (res.after.dps / Math.max(res.before.dps, 1e-9) - 1) * 100;
        const row = (name, a, b) => '<tr><td>' + name + '</td><td>' + num(a) + '</td><td>' + num(b) + '</td></tr>';
        h += '<div class="res">' +
          '<table><tr><th></th><th>目前</th><th>推薦</th></tr>' +
          row('預估 DPS', res.before.dps, res.after.dps) +
          row('生命', res.before.d.maxHp, res.after.d.maxHp) +
          row('護甲', res.before.d.armor, res.after.d.armor) +
          row('閃避', res.before.d.eva, res.after.d.eva) + '</table>' +
          '<div class="gold">DPS ' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '％</div>';
        if (!res.gear.length && !res.boardChanged) h += '<small>目前的組合已經是找到最好的，沒有要換的。</small>';
        else {
          if (res.gear.length) h += '<small>' + res.gear.map(esc).join('<br>') + '</small><br>';
          if (res.put.length) h += '<small>放上：' + esc(res.put.join('、')) + '</small><br>';
          if (res.off.length) h += '<small>拿下：' + esc(res.off.join('、')) + '</small><br>';
          if (res.boardChanged) h += res.svg + '<small>' + res.links.map(esc).join('<br>') + '</small><br>';
          h += '<button id="xjAdvUse">套用</button>';
        }
        h += '</div>';
      }
      el.innerHTML = h + '<small>數字是遊戲自己的單體預估，不含範圍傷害、擊中或擊殺時觸發的效果，帶這類效果的部位建議取消勾選。每次結果可能略有不同。</small>';
    };
    const read = () => {
      const el = box();
      if (!el) return;
      el.querySelectorAll('[data-advslot]').forEach(b => { opt.slots[b.dataset.advslot] = b.checked; });
      el.querySelectorAll('[data-adv]').forEach(b => { opt[b.dataset.adv] = b.type === 'checkbox' ? b.checked : Number(b.value); });
    };
    const start = () => {
      read();
      if (!opt.gear && !opt.gems) { msg = '「配裝備」和「配技能」至少要勾一個'; fill(); return; }
      const my = ++run;
      const it = solve();
      busy = true; res = null; msg = '計算中…';
      fill();
      const loop = () => {
        if (my !== run) return;
        let r;
        try {
          const end = Date.now() + 30;
          do { r = it.next(); } while (!r.done && Date.now() < end);
        } catch (e) {
          console.warn('[小工具] 配裝推薦計算失敗', e);
          busy = false; msg = '計算失敗，沒有做任何變更';
          fill();
          return;
        }
        if (r.done) {
          busy = false; res = r.value; msg = '';
          fill();
          return;
        }
        msg = r.value;
        const m = document.getElementById('xjAdvMsg');
        if (m) m.textContent = msg;
        setTimeout(loop, 0);
      };
      setTimeout(loop, 0);
    };
    const click = t => {
      if (t.id === 'xjAdvGo') start();
      if (t.id === 'xjAdvStop') { run++; busy = false; msg = '已停止，沒有做任何變更'; fill(); }
      if (t.id === 'xjAdvUse' && res) {
        const c = O.game.char;
        if (res.char !== c) { res = null; msg = '角色換了，請重新計算'; fill(); return; }
        undo = { char: c, eq: Object.fromEntries(slots.filter(sl => c.equip[sl]).map(sl => [sl, c.equip[sl].uid])), board: c.board.map(b => Object.assign({}, b)) };
        const fails = applyTo(res);
        res = null;
        msg = fails.length ? '已套用，但有些沒成功（可能在計算時裝備變了）：' + fails.join('；') : '已套用';
        fill();
      }
      if (t.id === 'xjAdvUndo' && undo) {
        if (undo.char !== O.game.char) { undo = null; msg = '角色換了，不能復原'; fill(); return; }
        const fails = applyTo(undo);
        undo = null;
        msg = fails.length ? '復原時有些沒成功：' + fails.join('；') : '已復原';
        fill();
      }
    };
    return { fill: fill, read: read, click: click };
  };

  /* ===== 開關放在該功能的視窗裡 =====
   * 遊戲會一直重畫視窗內容，所以包產生內容的函式，勾選框才會跟著畫出來，打勾的狀態看 cfg。
   * 取消開啟時要把勾選框改回來；這段期間視窗可能重畫過，舊的勾選框就算改了也沒差。 */
  const installToggles = O => {
    const label = (attr, on, name, note) => '<label class="xjToggle"><input type="checkbox" ' + attr + (on ? ' checked' : '') + '> ' + name + ' <small>' + note + '</small></label>';
    if (window.__xjOneOk) {
      const realBoard = O.panels.board.html;
      O.panels.board.html = function () {
        return label('data-xjone', cfg.oneCell, '單格模式', '寶石佔一格、輔助不用相鄰') + realBoard.apply(this, arguments);
      };
    }
    if (window.__xjNoDownOk) {
      const realRefine = O.panels.forge.refineHtml;
      O.panels.forge.refineHtml = function () {
        return label('data-xjnodown', cfg.noDown, '精煉失敗不退階', '失敗時精煉值不變') + realRefine.apply(this, arguments);
      };
    }
    document.addEventListener('change', e => {
      const t = e.target;
      if (!t.dataset) return;
      if (t.dataset.xjone !== undefined) {
        e.stopPropagation();
        setOneCell(O, t.checked).then(done => { if (!done) t.checked = cfg.oneCell; });
      } else if (t.dataset.xjnodown !== undefined) {
        e.stopPropagation();
        setNoDown(O, t.checked).then(done => { if (!done) t.checked = cfg.noDown; });
      }
    }, true);
    for (const id of ['board', 'forge']) if (O.windows.isOpen(id)) O.windows.render(id);
  };

  /* ===== 面板 ===== */
  const installPanel = (O, earn, refine, cards, wx, adv) => {
    const panel = document.createElement('div');
    panel.id = 'xjPanel';
    panel.hidden = true;
    document.body.appendChild(panel);

    const live = () => {
      const e = panel.querySelector('#xjEarn');
      if (e && earn) e.innerHTML = earn.html();
      const r = panel.querySelector('#xjRefMsg');
      if (r) r.textContent = refine ? refine.msg : '';
      const g = panel.querySelector('#xjRefGo');
      if (g && refine) g.textContent = refine.on ? '停止' : '開始自動精煉';
      const n = panel.querySelector('#xjWxNow');
      if (n && wx) {
        const w = wx.current();
        n.textContent = '目前：' + (w ? w.name + '（' + w.lines.join('、') + '）' : '沒有天氣');
      }
    };
    const render = () => {
      const opt = (key, name, note) => '<label><input type="checkbox" data-cfg="' + key + '"' + (cfg[key] ? ' checked' : '') + '> ' + name + (note ? ' <small>' + note + '</small>' : '') + '</label>';
      const canPin = 'documentPictureInPicture' in window.top;
      let tgt = '';
      for (let i = 1; i <= (window.__xjRefMax || 15); i++) tgt += '<option value="' + i + '"' + (refine && refine.target === i ? ' selected' : '') + '>+' + i + '</option>';
      panel.innerHTML = '<h3>修改 <small>' + VERSION + '</small><button class="xjClose" aria-label="關閉">×</button></h3>' +
        '<h4>設定</h4>' +
        opt('keepAlive', '背景運行', '切到背景時照常跑') +
        opt('eco', '節能模式', '只影響畫面') +
        opt('noUpdate', '禁止自動更新') +
        opt('bossBar', 'BOSS 血條', '') +
        opt('skillCd', '技能列顯示實際冷卻') +
        opt('cdNote', '組隊副本冷卻提醒') +
        (earn ? '<h4>收益統計</h4><div id="xjEarn"></div>' : '') +
        (refine ? '<h4>自動精煉</h4><small>在煉金工坊選好裝備和保護選項，視窗開著</small><br>目標 <select id="xjRefTgt">' + tgt + '</select> <button id="xjRefGo"></button><br><small id="xjRefMsg"></small>' : '') +
        (adv ? '<h4>配裝配技能推薦</h4><div id="xjAdv"></div>' : '') +
        (wx ? '<h4>自訂天氣</h4><select id="xjWx"><option value="">沒有天氣</option>' + wx.list.map(w => '<option value="' + w.id + '"' + (wx.current() === w ? ' selected' : '') + '>' + w.name + '</option>').join('') + '</select> <button id="xjWxGo">套用</button><br><small id="xjWxNow"></small>' : '') +
        (cards ? '<h4>取出卡片 <button id="xjCardsReload">重新整理</button></h4><div id="xjCards"></div>' : '<br><small>取出卡片跟這一版遊戲對不上，已停用</small>') +
        (canPin ? '<h4>其他</h4><button id="xjPin">置頂視窗</button>' : '');
      live();
      const cardBox = panel.querySelector('#xjCards');
      if (cardBox && cards) cards.fill(cardBox);
      if (adv) adv.fill();
    };
    panel.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset && t.dataset.cfg) { cfg[t.dataset.cfg] = t.checked; saveCfg(); }
      if (t.id === 'xjRefTgt' && refine) refine.target = Number(t.value);
      if (adv && t.closest('#xjAdv')) adv.read();
    });
    panel.addEventListener('click', e => {
      if (e.target.classList.contains('xjClose')) { panel.hidden = true; return; }
      if (e.target.id === 'xjRefGo' && refine) {
        if (refine.on) refine.stop('已停止'); else refine.start();
        live();
      }
      if (e.target.id === 'xjWxGo' && wx) {
        wx.apply(panel.querySelector('#xjWx').value);
        live();
      }
      if (adv && e.target.closest('#xjAdv')) adv.click(e.target);
      const cardBox = panel.querySelector('#xjCards');
      if (e.target.id === 'xjCardsReload' && cards && cardBox) cards.fill(cardBox);
      if (e.target.dataset && e.target.dataset.xjcardItem && cards && cardBox) cards.take(Number(e.target.dataset.xjcardItem), Number(e.target.dataset.xjcardSlot), cardBox);
      if (e.target.id === 'xjPin') {
        window.top.__xjPin().then(r => { if (r === 'nosupport') toast('這個瀏覽器不支援置頂視窗'); }).catch(() => toast('置頂視窗開不起來'));
      }
    });
    /* 「修改」按鈕放在選單視窗的標題列，「說明」旁邊。標題列遊戲只建立一次，不會被重畫。
     * 樣式沿用「說明」鈕；遊戲是在視窗上統一處理點擊，所以這裡不讓點擊傳上去，才不會被當成按說明。 */
    const title = document.getElementById('win-title-opts');
    const tools = title && title.parentNode.querySelector('.win-tools');
    if (!tools) throw new Error('找不到選單視窗的標題列');
    const help = tools.querySelector('.win-help-btn');
    const btn = document.createElement('button');
    btn.id = 'xjBtn';
    btn.className = 'win-help-btn';
    btn.textContent = '修改';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      if (!panel.hidden) render();
    });
    tools.insertBefore(btn, help || tools.firstChild);
    setInterval(() => { if (!panel.hidden) live(); }, 1000);
    window.__xjShow = () => { panel.hidden = false; render(); };
  };

  /* ===== BOSS 血條 ===== */
  const installBossBar = O => {
    const bar = document.createElement('div');
    bar.id = 'xjBoss';
    bar.hidden = true;
    bar.innerHTML = '<i></i><b></b>';
    document.body.appendChild(bar);
    const fill = bar.firstChild, text = bar.lastChild;
    const num = v => Math.max(0, Math.round(v)).toLocaleString();
    setInterval(() => {
      const f = cfg.bossBar && O.game.fight;
      const mob = f && f.mob;
      if (!mob || !(mob.maxHp > 0)) { bar.hidden = true; return; }
      bar.hidden = false;
      fill.style.width = Math.max(0, mob.hp / mob.maxHp * 100) + '%';
      const left = Number.isFinite(f.end) ? Math.max(0, f.end - O.game.time) : NaN;
      text.textContent = f.name + '  ' + num(mob.hp) + ' / ' + num(mob.maxHp) + '（' + (mob.hp / mob.maxHp * 100).toFixed(1) + '％）' +
        (f.shield > 0 ? '  護盾 ' + num(f.shield) : '') + (Number.isFinite(left) ? '  剩 ' + left.toFixed(0) + ' 秒' : '');
    }, 100);
  };

  /* ===== 技能列的實際冷卻 ===== */
  const installSkillCd = O => {
    setInterval(() => {
      for (const slot of document.querySelectorAll('.hotbar [data-tip]')) {
        let tag = slot.querySelector('.xjCd');
        if (!cfg.skillCd) { if (tag) tag.remove(); continue; }
        const sk = O.game.skills.find(s => s.uid === Number(slot.dataset.tip));
        if (!sk) continue;
        const sec = O.hud.totalCd(sk);
        const text = sec > 0 ? (sec < 10 ? sec.toFixed(1) : sec.toFixed(0)) + 's' : '';
        if (!tag) {
          tag = document.createElement('span');
          tag.className = 'xjCd';
          slot.appendChild(tag);
        }
        if (tag.textContent !== text) tag.textContent = text;
      }
    }, 500);
  };

  /* ===== 冷卻提醒：提示過的結束時間記起來，同一次冷卻只提示一次 ===== */
  const installCdNote = O => {
    const tick = () => {
      if (!cfg.cdNote) return;
      const cd = O.game.char.party && +O.game.char.party.cd || 0;
      if (!(cd > 0) || O.game.clock < cd) return;
      let notes = {};
      try { notes = JSON.parse(localStorage.getItem(NOTE_KEY)) || {}; } catch (e) {}
      const key = O.game.char.id;
      if (notes[key] === cd) return;
      notes[key] = cd;
      try { localStorage.setItem(NOTE_KEY, JSON.stringify(notes)); } catch (e) {}
      toast('組隊副本的冷卻結束了，可以再挑戰', 15000);
    };
    setTimeout(tick, 5000);
    setInterval(tick, 30000);
  };

  /* 背景不畫畫面、節能模式不畫數字和受擊特效。遊戲每個畫面都會從存檔的設定蓋回 opts，
   * 所以在畫之前才改，存檔裡的設定不會動 */
  const installDraw = O => {
    const realDraw = O.renderer.draw;
    O.renderer.draw = function () {
      if (document.hidden) return undefined;
      if (cfg.eco) { this.opts.nonum = true; this.opts.nohit = true; this.opts.low = true; }
      return realDraw.apply(this, arguments);
    };
  };

  /* ===== 主流程 ===== */
  const safely = (name, fn) => {
    try { return fn(); } catch (e) {
      console.warn('[小工具] ' + name + ' 啟用失敗', e);
      toast('小工具的「' + name + '」跟這一版遊戲對不上，已停用');
      return null;
    }
  };

  startGame().then(src => {
    const t0 = Date.now();
    const wait = setInterval(() => {
      let O = null;
      try { if (window.__XJ) O = findObjects(src); } catch (e) {}
      const ready = O && O.game && O.hud;
      if (!ready && Date.now() - t0 < 60000) return;
      clearInterval(wait);
      installStyle();
      installToast();
      if (!ready) {
        toast('小工具認不出這一版遊戲（可能改版了），遊戲可以照常玩，但小工具的功能無法使用', 15000);
        return;
      }
      window.__xjGame = O;
      if (O.renderer) safely('節能模式', () => installDraw(O));
      const earn = safely('收益統計', () => earnStart(O));
      const refine = O.panels ? safely('自動精煉', () => refineCtl(O, src)) : null;
      const cards = O.panels ? safely('取出卡片', () => cardTool(O, src)) : null;
      const wx = O.panels ? safely('自訂天氣', () => wxTool(O, src)) : null;
      const adv = O.panels ? safely('配裝配技能推薦', () => advisor(O, src)) : null;
      if (O.panels) safely('購買時選擇變異', () => gemShop(O, src));
      safely('面板', () => installPanel(O, earn, refine, cards, wx, adv));
      if (O.panels && O.windows) safely('單格模式、精煉失敗不退階', () => installToggles(O));
      safely('BOSS 血條', () => installBossBar(O));
      safely('技能冷卻', () => installSkillCd(O));
      safely('冷卻提醒', () => installCdNote(O));
      toast('小工具 ' + VERSION + ' 已啟用：功能在「選單」視窗標題列的「修改」');
      if (window.__xjOne) toast('單格模式開啟中，可以在技能盤關閉');
      if (window.__xjNoDown) toast('精煉失敗不退階開啟中，可以在煉金工坊的精煉分頁關閉');
    }, 500);
  }).catch(e => {
    console.error('[小工具] 啟動失敗', e);
    document.documentElement.textContent = '小工具啟動失敗：' + e.message + '。請重新整理頁面（不點書籤就是原本的遊戲）。';
  });
})();
