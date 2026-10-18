javascript:(function awTools() {
  /*
   * 自走勇者 Auto Wanderer 小工具（書籤版）
   *   1. 背景運行：分頁切到背景時遊戲照常跑，不會變成離線收益
   *   2. BOSS 血條（預設關閉）：打 BOSS 時在畫面最上方顯示名稱／生命／護盾／剩餘時間
   *   3. 技能冷卻：技能拼圖上每顆主動技能寶石顯示實際冷卻秒數
   *   4. 配置模擬：用存檔裡持有的寶石試排技能盤、即時算 DPS，
   *      按「確定並套用」把配置寫回指定的構築分頁
   *
   *   5. 物品管理：分頁列出裝備、石板、符文、技能寶石，用關鍵字和數值比較搜尋，批次分解／鎖定／解鎖
   *   6. 生命明細：角色分頁的「最大生命」下面顯示算式和各項來源
   *   7. 存檔備份：備份到瀏覽器或下載成檔案，可以還原；套用匯入的計畫前會自動備份
   *   8. 物品持有無上限：背包、石板、符文的數量上限拿掉；獨特裝備可以只保留指定階級以上
   *   9. 禁止自動更新：遊戲出新版時不會自己重新整理
   *   0. 常駐模式：遊戲自己重新整理（更新、還原備份）後，小工具會自動重新啟用
   *  11. 解鎖三神器：選單分頁的按鈕，把還沒有的神器直接加進存檔（1 級）
   *  12. 無限君主連續挑戰：地圖分頁無限君主旁的勾選框，打贏後自動再挑戰
   *  13. 自動刷神話：無限君主旁的按鈕，沒掉神話獨特就自動讀回挑戰前的存檔再打
   *  14. 置頂視窗：選單分頁的按鈕，把遊戲搬進永遠在最上層的小視窗
   *  15. 省資源：背景時不畫畫面；節能模式（戰鬥畫面左下角的開關，單格模式開著時也會啟用）降低畫面更新次數、不產生粒子和傷害數字
   *  16. 卡片進度：地圖分頁的按鈕，列出每張地圖怪物卡片的階數、擊殺數和還差多少
   *  17. 小工具設定：選單分頁的按鈕，在遊戲裡改下面這些設定，不用改檔案
   *  10. 單格模式：技能分頁的開關，開啟後寶石只佔一格、輔助寶石不用相鄰就生效
   *  18. 不上傳雲端存檔：小工具設定裡的選項（預設關閉）；自動刷神話進行中也一律不上傳
   *
   * 點一次書籤就全部啟用。配置模擬的按鈕在「技能」分頁標題旁，
   * 物品管理的按鈕在「背包」分頁的工具列（保留規則旁邊），
   * 存檔備份的按鈕在「選單」分頁的標題旁。
   *
   * 用法：整個檔案全選複製，貼到書籤的「網址」欄位即可（第一行的 javascript: 要保留）。
   * 修改注意：
   *   - 註解只能用這種區塊註解，不要用雙斜線註解（貼進書籤時換行會消失，後面的程式會被吃掉）
   *   - 每個敘述結尾都要加分號
   *   - 百分比符號後面不要直接接兩個十六進位字元（會被瀏覽器當成網址編碼）
   */

  /* 書籤版本號：每次修改這個檔案就加 1，會顯示在「技能配置模擬」視窗的標題旁，
   * 用來確認書籤裡貼的是不是最新版 */
  const VERSION = 'V29';

  /* ===== 設定 ===== */
  const CFG = {
    keepAlive: true,        /* 背景運行 */
    bossBar: false,         /* BOSS 血條（遊戲本身已有血條和倒數，含塔王層；這個多了名稱和生命數字，預設關閉） */
    tickMs: 100,            /* 背景時每幾毫秒推動一次遊戲迴圈 */
    bgGrabMs: 2000,         /* 背景時每幾毫秒把地上的掉落物收起來一次（0 = 不收，等回到畫面才撿） */
    barTop: 2,              /* 血條距離畫面頂端（px） */
    barSide: 8,             /* 血條左右留白（px） */
    barHeight: 14,          /* 血條高度（px） */
    barFont: 11,            /* 血條文字大小（px） */
    hpColor: '#c8323c',     /* 生命顏色 */
    shieldColor: '#9ab0ff', /* 護盾顏色 */
    barRefreshMs: 100,      /* 血條更新間隔 */
    skillCd: true,          /* 技能寶石顯示冷卻時間（盤面上的寶石） */
    trayCd: true,           /* 未放置的寶石清單也顯示冷卻時間（要先開 skillCd） */
    cdFont: 10,             /* 冷卻文字大小（px） */
    cdColor: '#ffe08a',     /* 冷卻文字顏色 */
    cdRefreshMs: 100,       /* 冷卻文字更新間隔 */
    planner: true,          /* 技能分頁加上「配置模擬」按鈕 */
    oneCell: true,          /* 技能分頁加上「單格模式」開關（寶石只佔一格、輔助不用相鄰） */
    items: true,            /* 背包分頁加上「物品管理」按鈕 */
    btnRefreshMs: 300,      /* 檢查入口按鈕是否還在的間隔 */
    hpDetail: true,         /* 角色分頁顯示生命來源明細 */
    hpFont: 11,             /* 生命明細文字大小（px） */
    hpRefreshMs: 300,       /* 生命明細更新間隔 */
    planCell: 46,           /* 配置模擬的格子大小（px） */
    gemPrice: 200,          /* 商店一顆技能寶石的灰燼價格（匯入代碼自動補買時用） */
    backup: true,           /* 選單分頁加上「存檔備份」按鈕 */
    backupKeep: 5,          /* 瀏覽器裡最多保留幾份備份 */
    autoBackup: true,       /* 配置模擬執行匯入的計畫（鑲嵌、多構築）前自動備份 */
    noLimit: true,          /* 物品持有無上限（背包、石板、符文） */
    itemMax: 99999,         /* 背包和符文的新上限；想保留一個上限就改小 */
    slateMax: 999999,       /* 石板的新上限 */
    stashMax: 2000,         /* 共用倉庫的新上限（遊戲原本 500）；倉庫整個存在瀏覽器一格裡，太大會存不進去 */
    uqKeepHi: 2,            /* 獨特裝備這個階級以上一律保留（0 一般、1 高階、2 終局、3 守護者、4 終焉）；設 0 關閉 */
    saveWarnKB: 800,        /* 存檔超過這個大小（KB）就跳警告 */
    noUpdate: true,         /* 禁止遊戲自動更新（自動重新整理） */
    cards: true,            /* 地圖分頁加上「卡片進度」按鈕 */
    eco: true,              /* 省資源（下面幾項的總開關） */
    bgNoDraw: true,         /* 分頁在背景或被蓋住時不畫畫面（看不到，省下繪圖的資源） */
    ecoBtn: true,           /* 戰鬥畫面左下角加上「節能模式」開關（降低畫面更新次數、不產生粒子和傷害數字） */
    ecoFps: 15,             /* 節能模式時，畫面每秒更新幾次（0 = 不限制）；遊戲運算速度不受影響 */
    arts: true,             /* 選單分頁加上「解鎖三神器」按鈕 */
    pin: true,              /* 選單分頁加上「置頂視窗」按鈕（把遊戲搬進永遠在最上層的小視窗；要開常駐模式） */
    monAuto: true,          /* 地圖分頁的無限君主加上「打贏後自動接著打」勾選框 */
    monAutoMs: 3000,        /* 打贏無限君主後等幾毫秒再自動挑戰下一場 */
    monLoop: true,          /* 無限君主加上「自動刷神話」按鈕（沒掉神話獨特就自動讀回挑戰前的存檔） */
    monLoopLootMs: 2500,    /* 自動刷神話：打贏後等幾毫秒讓掉落物落地，再收起來檢查 */
    monLoopBatch: 1,        /* 自動刷神話：「每打幾場才讀一次檔」的預設值（開始時還可以再改） */
    noCloud: false,         /* 不上傳 Google 雲端存檔（開啟期間遊戲會顯示沒登入 Google，關掉後自動恢復） */
    host: true              /* 常駐模式：遊戲重新整理（更新、還原備份）後自動重新啟用小工具 */
  };
  /* 上面是預設值。在遊戲裡的「小工具設定」（第 17 項）改過的項目存在瀏覽器的 awtools.cfg，
   * 這裡把它們蓋到 CFG 上；只接受上面有的項目，而且型別要一樣（開關對開關、數字對數字）。
   * 所以平常不用再改這個檔案，改檔案只是改「預設值」。 */
  const CFG_KEY = 'awtools.cfg';
  const CFG_DEF = Object.assign({}, CFG);
  try {
    const saved = JSON.parse(localStorage.getItem(CFG_KEY)) || {};
    for (const k of Object.keys(saved)) if (k in CFG_DEF && typeof saved[k] === typeof CFG_DEF[k]) CFG[k] = saved[k];
  } catch (e) {}

  /* ===== 0. 常駐模式 =====
   * 書籤的程式只活在當下這個頁面，頁面一重新整理就沒了。
   * 常駐模式的做法：第一次點書籤時不直接安裝，而是在原本的頁面上蓋一個全螢幕的框架（iframe），
   * 在框架裡重新載入遊戲，再把這整份小工具放進框架裡執行。
   * 之後遊戲自己重新整理（自動更新、選單裡的更新按鈕、還原備份）只會重新載入框架，
   * 外層頁面還在，所以每次框架載入完成就再放一次小工具。
   * 外層原本那份遊戲不用特別處理：遊戲本來就規定同時只能有一個分頁在玩，
   * 框架裡的遊戲啟動時，外層那份會自己存檔並停下來。
   * 注意：按瀏覽器的重新整理（F5）是重新載入外層頁面，小工具還是會消失，要再點一次書籤。
   */
  const SELF = awTools.toString();
  let inHost = false;
  try { inHost = window !== window.top && !!window.top.__awHost; } catch (e) {}
  if (CFG.host && !inHost && window === window.top) {
    const runIn = w => {
      try {
        const d = w.document;
        const s = d.createElement('script');
        s.textContent = '(' + SELF + ')();';
        (d.body || d.documentElement).appendChild(s);
        s.remove();
      } catch (e) {}
    };
    /* 已經是常駐模式：再點一次書籤就轉給框架裡的那一份處理（它會提示已經啟用） */
    if (window.__awHost) { runIn(window.__awHost.contentWindow); return; }
    if (!window.__awTools) {
      const f = document.createElement('iframe');
      window.__awHost = f;
      f.allow = 'autoplay; fullscreen; clipboard-read; clipboard-write';
      f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;background:#000';
      f.addEventListener('load', () => { runIn(f.contentWindow); try { f.contentWindow.focus(); } catch (e) {} });
      /* 先把地上的東西收起來並存檔，框架裡的遊戲才會讀到最新進度 */
      try { if (typeof S !== 'undefined' && S && typeof saveNow === 'function') { if (typeof grabDrops === 'function') grabDrops(); saveNow(); } } catch (e) {}
      f.src = location.href;
      document.body.appendChild(f);
      /* 置頂視窗（第 14 項）：把遊戲的框架搬進瀏覽器的「文件子母畫面」視窗，那種視窗永遠在最上層。
       * 這段要放在外層頁面執行，因為框架一搬動，裡面的遊戲就會重新載入，寫在框架裡的程式跑到一半會被中斷。
       * 再呼叫一次是關閉；關閉（或使用者自己關掉小視窗）時把框架搬回原本的頁面。 */
      window.__awPin = async () => {
        const api = window.documentPictureInPicture;
        if (!api) return 'nosupport';
        if (api.window) { api.window.close(); return 'closed'; }
        const pip = await api.requestWindow({ width: Math.max(360, Math.min(window.innerWidth, 1000)), height: Math.max(480, Math.min(window.innerHeight, 900)) });
        pip.document.title = document.title;
        pip.document.body.style.cssText = 'margin:0;background:#000;overflow:hidden';
        pip.__awHost = f;
        pip.__awPin = window.__awPin;
        pip.__awPinned = 1;
        const note = document.createElement('div');
        note.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#1a1410;color:#f0e6d2;display:flex;align-items:center;justify-content:center;font:16px/1.8 sans-serif;text-align:center';
        note.textContent = '遊戲正在置頂的小視窗裡進行。關掉那個小視窗就會回到這裡。這個分頁請不要關。';
        document.body.appendChild(note);
        pip.document.body.appendChild(f);
        pip.addEventListener('pagehide', () => { note.remove(); document.body.appendChild(f); });
        return 'ok';
      };
      return;
    }
  }

  /* ===== 對話框 =====
   * 提示、確認、輸入都用這裡自己畫的對話框，不用瀏覽器內建的 alert／confirm／prompt。原因：
   *   - 內建的視窗一跳出來整個頁面就停住，遊戲也跟著暫停
   *   - 置頂的小視窗裡，內建視窗不一定跳得出來
   *   - 內建的輸入框只有一行，貼長的代碼很不方便，也沒辦法一次問好幾個欄位
   * 這些函式都是「非同步」的：uiConfirm() 回傳的是之後才會有結果的 Promise，
   * 所以呼叫的地方要寫 await，外層的函式要加 async。uiAlert() 不用等，可以直接呼叫。
   * 同時有好幾個對話框時會排隊，一次只顯示一個。
   *   uiAlert(文字)                      只有「確定」
   *   uiConfirm(文字)                    回傳 true／false
   *   uiPrompt(文字, 預設值, 是否多行)    回傳輸入的文字，取消是 null
   *   uiForm(文字, [{ label, value, type, multiline }])  回傳每個欄位的文字陣列，取消是 null
   */
  const dlgQueue = [];
  let dlgBusy = false;
  const dlgNext = () => {
    if (dlgBusy || !dlgQueue.length) return;
    dlgBusy = true;
    const job = dlgQueue.shift(), opt = job.opt;
    const root = document.createElement('div');
    root.id = 'awDlg';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font:14px/1.6 sans-serif;color:#f0e6d2';
    const box = document.createElement('div');
    box.style.cssText = 'background:#2a2118;border:2px solid #ffd84a;border-radius:6px;padding:14px;box-sizing:border-box;width:min(520px,94vw);max-height:92%;display:flex;flex-direction:column;gap:10px';
    const msg = document.createElement('div');
    msg.style.cssText = 'white-space:pre-wrap;overflow:auto;word-break:break-word;min-height:1.6em';
    msg.textContent = opt.msg;
    box.appendChild(msg);
    const inputs = [];
    for (const f of (opt.fields || [])) {
      const lab = document.createElement('label');
      lab.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0';
      if (f.label) {
        const sp = document.createElement('span');
        sp.style.cssText = 'white-space:pre-wrap;font-size:13px';
        sp.textContent = f.label;
        lab.appendChild(sp);
      }
      const el = document.createElement(f.multiline ? 'textarea' : 'input');
      if (f.multiline) el.rows = 5; else el.type = f.type || 'text';
      el.value = f.value == null ? '' : String(f.value);
      el.style.cssText = 'padding:6px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a;font:13px/1.4 monospace;box-sizing:border-box;width:100%';
      lab.appendChild(el);
      box.appendChild(lab);
      inputs.push(el);
    }
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;flex-shrink:0';
    const done = v => { root.remove(); dlgBusy = false; job.resolve(v); dlgNext(); };
    const ok = () => done(opt.kind === 'alert' ? undefined : opt.kind === 'confirm' ? true : inputs.map(i => i.value));
    const cancel = () => done(opt.kind === 'alert' ? undefined : opt.kind === 'confirm' ? false : null);
    const mk = (text, cls, primary, fn) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.className = cls;
      b.style.cssText = 'padding:4px 16px;cursor:pointer' + (primary ? ';font-weight:bold;background:#ffd84a;color:#2a2118;border:1px solid #000' : '');
      b.addEventListener('click', fn);
      row.appendChild(b);
      return b;
    };
    if (opt.kind !== 'alert') mk('取消', 'awDlgNo', false, cancel);
    const okBtn = mk('確定', 'awDlgOk', true, ok);
    box.appendChild(row);
    root.appendChild(box);
    root.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      else if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); ok(); }
    }, true);
    root.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(root);
    try { (inputs[0] || okBtn).focus(); if (inputs[0]) inputs[0].select(); } catch (e) {}
  };
  const dlgShow = opt => new Promise(resolve => { dlgQueue.push({ opt: opt, resolve: resolve }); dlgNext(); });
  const uiAlert = msg => dlgShow({ kind: 'alert', msg: String(msg) });
  const uiConfirm = msg => dlgShow({ kind: 'confirm', msg: String(msg) });
  const uiForm = (msg, fields) => dlgShow({ kind: 'form', msg: String(msg), fields: fields });
  const uiPrompt = (msg, def, multiline) => uiForm(msg, [{ value: def, multiline: !!multiline }]).then(v => (v ? v[0] : null));

  /* 所有功能只在第一次點書籤時安裝 */
  const first = !window.__awTools;
  window.__awTools = 1;

  /* ===== 1. 背景運行 =====
   * 遊戲主迴圈靠 requestAnimationFrame 驅動，分頁在背景時瀏覽器不會呼叫它，
   * 中斷超過 60 秒就會改用離線收益。這裡在背景時改由 Web Worker 計時器推動。
   */
  /* 背景也照常跑的計時器。瀏覽器會把背景（包含被其他視窗蓋住）分頁的 setInterval 放慢，
   * 一開始是每秒一次，超過五分鐘後可能變成每分鐘一次；需要在背景持續運作的功能
   * （無限君主連續挑戰、自動刷神話）用 every() 註冊，背景時改由下面的 Worker 計時器來叫。 */
  const bgTimers = [];
  const bgRun = () => {
    const now = Date.now();
    for (const e of bgTimers) {
      if (now - e.last < e.ms) continue;
      e.last = now;
      try { e.fn(); } catch (err) {}
    }
  };
  const every = (fn, ms) => {
    const e = { fn: fn, ms: ms, last: 0 };
    bgTimers.push(e);
    setInterval(() => { if (Date.now() - e.last >= ms * 0.8) { e.last = Date.now(); try { fn(); } catch (err) {} } }, ms);
  };

  if (first && CFG.keepAlive) {
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeCaf = window.cancelAnimationFrame.bind(window);
    const pending = new Map();
    let id = 1e9;

    window.requestAnimationFrame = cb => {
      const i = ++id;
      const run = t => { pending.delete(i) && cb(t); };
      pending.set(i, run);
      nativeRaf(run);
      return i;
    };
    window.cancelAnimationFrame = i => { pending.delete(i) || nativeCaf(i); };

    let lastGrab = 0;
    const fire = () => {
      if (!document.hidden) return;
      const t = performance.now();
      [...pending.values()].forEach(f => f(t));
      bgRun();
      /* 背景時每一步的時間比較長，飛向角色的掉落物會一直飛過頭、撿不起來，
       * 所以定時呼叫遊戲自己的 grabDrops()（遊戲在分頁被隱藏時也是用它把地上的東西收起來） */
      if (CFG.bgGrabMs && t - lastGrab >= CFG.bgGrabMs) {
        lastGrab = t;
        try { if (typeof grabDrops === 'function' && typeof G !== 'undefined' && G && !G.dead) grabDrops(); } catch (e) {}
      }
    };

    /* 把遊戲的主迴圈接到上面的包裝上。
     * 遊戲啟動時就用原本的 requestAnimationFrame 排了第一次 frame()，那一次不在 pending 裡；
     * 如果小工具是在背景被放進來的（常駐模式下遊戲在背景重新載入，例如自動刷神話讀檔），
     * 那一次永遠等不到，整個遊戲會停住，直到切回畫面才被當成「離線」結算、Boss 戰也跟著中斷。
     * 所以這裡自己再排一次。為了避免原本那一次之後也跑起來變成兩條迴圈（遊戲會變兩倍速），
     * 把 frame() 包一層：同一個時間點只執行一次，多出來的那條就不會再往下排。 */
    try {
      const realFrame = window.frame;
      if (typeof realFrame === 'function') {
        let lastT = -1;
        window.frame = t => { if (t === lastT) return; lastT = t; return realFrame(t); };
        window.requestAnimationFrame(window.frame);
      }
    } catch (e) {}

    try {
      /* Worker 的計時器不會被背景分頁節流 */
      const src = 'setInterval(()=>postMessage(0),' + CFG.tickMs + ')';
      const worker = new Worker(URL.createObjectURL(new Blob([src])));
      worker.onmessage = fire;
    } catch (e) {
      /* 退而求其次：一般計時器在背景會被節流到約每秒一次 */
      setInterval(fire, CFG.tickMs);
    }
  }

  /* ===== 2. BOSS 血條 =====
   * 直接讀遊戲的全域變數：G（戰鬥狀態）、fmt（數字格式化）、
   * gdef / TRIAL / curMap（用來查 BOSS 名稱）。
   */
  if (first && CFG.bossBar) {
    const bar = document.createElement('div');
    bar.style.cssText =
      'position:absolute;z-index:9;pointer-events:none;display:none;overflow:hidden;' +
      'top:' + CFG.barTop + 'px;left:' + CFG.barSide + 'px;right:' + CFG.barSide + 'px;' +
      'height:' + CFG.barHeight + 'px;' +
      'background:#1a1016;border:2px solid #000;box-shadow:0 0 0 1px #6a5a4a;' +
      'font:bold ' + CFG.barFont + 'px/' + CFG.barHeight + 'px monospace;' +
      'color:#fff;text-shadow:1px 1px 0 #000';
    bar.innerHTML =
      '<i style="position:absolute;inset:0 auto 0 0;background:' + CFG.hpColor + '"></i>' +
      '<i style="position:absolute;inset:0 auto 0 0;background:' + CFG.shieldColor + ';opacity:.6"></i>' +
      '<span style="position:absolute;inset:0;text-align:center;white-space:nowrap"></span>';
    document.querySelector('#stageWrap').appendChild(bar);
    const [hpFill, shieldFill, label] = bar.children;

    const findBoss = () => {
      try { return G && (G.boss || G.mobs.find(m => m.boss)); } catch (e) { return null; }
    };

    const bossName = () => {
      try {
        if (G.tw) return '無限之塔 ' + G.tw.f + ' 層';
        if (G.guard != null) return gdef(G.guard).n;
        if (G.trial != null) return TRIAL[G.trial].boss;
        return G.bn || curMap().boss;
      } catch (e) { return 'BOSS'; }
    };

    setInterval(() => {
      const b = findBoss();
      if (!b || b.hp <= 0) { bar.style.display = 'none'; return; }

      const pct = Math.max(0, b.hp / b.max);
      hpFill.style.width = pct * 100 + '%';
      shieldFill.style.width = Math.min(1, (b.sh || 0) / b.max) * 100 + '%';

      let text = bossName() + '  ' + fmt(Math.ceil(b.hp)) + ' / ' + fmt(b.max) +
        '（' + (pct * 100).toFixed(1) + '%）';
      if (G.boss && G.bossT > 0) text += '  ⏱' + Math.ceil(G.bossT) + 's';
      label.textContent = text;

      bar.style.display = 'block';
    }, CFG.barRefreshMs);
  }

  /* ===== 3. 技能冷卻顯示 =====
   * 在「技能」分頁的拼圖上，每顆主動技能寶石右下角顯示實際冷卻秒數
   * （已算入輔助寶石、冷卻縮減、血誓鎧甲、神王之戒）；冷卻中會顯示「剩餘/總冷卻」。
   * 讀遊戲全域：placed / SKILLS / gemMods / tal / PS / OATH / kingCd / G.pl.cds。
   * 遊戲會不斷重畫面板，所以每次更新都要檢查標籤還在不在。
   */
  if (first && CFG.skillCd) {
    const effCd = g => {
      const sk = SKILLS[g.id];
      /* 輔助寶石、光環、持續技能沒有冷卻 */
      if (!sk || !sk.act || sk.sus || sk.aura || !sk.cd) return null;
      const m = gemMods(g);
      if (m.trig) return '暴擊觸發';
      if (tal('endb')) return '普攻觸發';
      if (tal('oath')) return OATH.cd;
      return sk.cd * (1 - m.cd) * (1 - PS.cdr / 100) * kingCd();
    };

    setInterval(() => {
      let gems;
      try { gems = placed(); } catch (e) { return; }

      document.querySelectorAll('#sgrid .gname[data-u]').forEach(el => {
        const g = gems.find(x => String(x.u) === el.dataset.u);
        if (!g) return;
        let cd;
        try { cd = effCd(g); } catch (e) { return; }
        if (cd == null) return;

        let badge = el.querySelector('.awcd');
        if (!badge) {
          badge = document.createElement('i');
          badge.className = 'awcd';
          badge.style.cssText =
            'position:absolute;right:1px;bottom:0;padding:0 2px;border-radius:2px;' +
            'font:bold ' + CFG.cdFont + 'px/' + (CFG.cdFont + 2) + 'px monospace;font-style:normal;' +
            'color:' + CFG.cdColor + ';background:rgba(0,0,0,.65);' +
            'pointer-events:none;white-space:nowrap';
          el.appendChild(badge);
        }

        let text;
        if (typeof cd === 'string') {
          text = cd;
        } else {
          const left = (G && G.pl && G.pl.cds && G.pl.cds[g.u]) || 0;
          text = (left > 0.05 ? left.toFixed(1) + '/' : '') + cd.toFixed(2) + 's';
        }
        if (badge.textContent !== text) badge.textContent = text;
      });

      /* 下方「未放置的寶石」清單：在說明文字最前面補上冷卻時間。
       * 還沒放上盤面所以吃不到輔助寶石，這裡算的是只含冷卻縮減的秒數。 */
      if (CFG.trayCd) {
        document.querySelectorAll('#tray button.gem[data-u]').forEach(el => {
          const small = el.querySelector('small');
          if (!small || small.querySelector('.awtcd')) return;
          const g = S.gems.find(x => String(x.u) === el.dataset.u);
          if (!g) return;
          let cd;
          try { cd = effCd(g); } catch (e) { return; }
          if (cd == null) return;
          const tag = document.createElement('i');
          tag.className = 'awtcd';
          tag.style.cssText = 'font-style:normal;color:' + CFG.cdColor;
          tag.textContent = '冷卻 ' + (typeof cd === 'string' ? cd : cd.toFixed(2) + ' 秒') + '・';
          small.insertBefore(tag, small.firstChild);
        });
      }
    }, CFG.cdRefreshMs);
  }

  if (first) document.title = '▶ ' + document.title;

  /* ===== 4. 配置模擬 =====
   * 模擬盤上的寶石是存檔寶石的「複本」，不會動到遊戲，直到按下「確定並套用」。
   * DPS 用遊戲自己的 calc()：暫時把 S.gems 換成模擬配置、算完立刻換回來。
   * 讀遊戲全域：S / PS / SKILLS / calc / gemCells / gemMods / linkedSupports /
   *            openSet / canPlace / afterGrid / markDirty / saveNow / ui / toast / fmt，
   *            以及畫圖用的 gemArt / gemOverlay 和遊戲的 sgrid 樣式。
   * 存檔結構：S.gems 是所有寶石（x 小於 0 代表沒放），S.gp 是使用中的構築分頁，
   *          S.gpages[i] 是其他分頁的快照，格式為 [寶石編號, x, y, 旋轉] 的陣列。
   */
  const openPlanner = () => {
    if (document.querySelector('#awPlan')) return;
    if (typeof S === 'undefined' || !S || !S.gems || !PS) { uiAlert('請先進入遊戲再開啟配置模擬'); return; }

    const N = 6;
    /* 窄螢幕（手機）時把格子縮小到整個技能盤放得進畫面；43 是外框、內距和技能盤邊框的寬度 */
    const CELL = Math.max(28, Math.min(CFG.planCell, Math.floor((window.innerWidth * 0.96 - 43) / N)));
    const clone = (g, x, y, rot) => { const c = { u: g.u, id: g.id, x: x, y: y, rot: rot || 0 }; if (g.sh) c.sh = g.sh; return c; };
    let realOpen = openSet();
    let page = S.gp;
    let src = -1;
    /* 匯入代碼帶進來的裝備計畫：{ fuse: [{ u, runes: [符文編號] }], equip: [裝備編號] }，按確定時才執行 */
    let gear = null;
    /* 匯入代碼帶進來的多構築計畫：{ 構築索引: 寶石配置 }，按確定時一次寫入 */
    let multi = null;
    let gems = [];
    let held = null;
    let hover = null;
    let allOpen = false;
    const isOpen = (x, y) => allOpen || realOpen.has(x + ',' + y);

    /* 從存檔讀出指定構築分頁的配置：使用中的分頁讀寶石本身的位置，其他分頁讀快照 */
    const load = p => {
      if (p === S.gp) return S.gems.filter(g => g.x >= 0).map(g => clone(g, g.x, g.y, g.rot));
      const out = [];
      for (const [u, x, y, rot] of (S.gpages[p] || [])) {
        const g = S.gems.find(o => o.u === u);
        if (g) out.push(clone(g, x, y, rot));
      }
      return out;
    };
    gems = load(page);

    const occupied = () => {
      const m = new Map();
      for (const g of gems) for (const [x, y] of gemCells(g)) m.set(x + ',' + y, g);
      return m;
    };
    const fits = (g, x, y) => {
      const occ = occupied();
      return gemCells(g, x, y, g.rot).every(([cx, cy]) =>
        cx >= 0 && cy >= 0 && cx < N && cy < N && isOpen(cx, cy) && !occ.has(cx + ',' + cy));
    };
    /* 還沒放進模擬盤的持有寶石 */
    const tray = () => S.gems.filter(g => !gems.some(o => o.u === g.u) && !(held && held.u === g.u));

    /* 暫時把模擬配置換進遊戲存檔，呼叫遊戲自己的算式，再立刻換回來 */
    const withGems = (list, fn) => {
      const keep = S.gems;
      try { S.gems = list; return fn(); } catch (e) { return null; } finally { S.gems = keep; }
    };
    const dpsOf = list => { const r = withGems(list, () => calc()); return r ? r.dps : 0; };

    /* ----- 修正後的 DPS 估計 -----
     * 遊戲面板的 DPS（calc().dps）有幾件事沒算，自動排盤和建議配裝如果只看面板會挑錯：
     *   1. 神王之戒：盤上只有一顆主動技能時，那顆技能傷害加倍、冷卻再縮短（面板完全沒算）
     *   2. 施放動畫：每次施放後約 0.19 秒內不能再施放（動畫 0.3 秒的前六成），「連發」的額外施放
     *      每次再佔 0.22 秒；冷卻比這還短也沒用，技能一多還會互相排擠
     *   3. 普通攻擊：每次施放會讓普攻延後 0.2 秒，技能放得很密時普攻幾乎打不出去
     *   4. 中毒層數：劇毒箭矢的毒層上限是 psnMax 加毒素累積的層數，命中夠密時是上限在決定傷害；
     *      普攻上的毒和它共用同一隻怪身上的層數
     * modelDps(M, false) 照抄遊戲 calc() 裡算 DPS 的那一段，結果應該和面板一樣；
     * modelDps(M, true) 是加上以上修正的版本。
     * 因為是照抄，遊戲改公式後會對不上，所以 fixDps() 會定期拿「不修正」的結果和面板比，
     * 差超過 1% 就認定這份公式過期，之後一律改回面板數字（fixBad 會變成 true，畫面上會提示）。
     * 沒有處理的：神眷詞綴、擊中或擊殺時觸發的獨特效果、多目標。 */
    const ANIM_LOCK = 0.19, EXTRA_GAP = 0.22, ATK_LOCK = 0.2;
    let fixBad = false, fixChecks = 0;
    const modelDps = (M, fix) => {
      const n = k => M.T[k] || 0, U = M.U;
      const acts = activeGems();
      const has = id => acts.some(g => g.id === id);
      const C = (M.mn + M.mx) / 2, G0 = 1 + M.crit / 100 * (M.critm / 100 - 1);
      const fixedHit = n('fixedHit');
      const mom = STK.mom.max + n('momMax');
      let basic = fixedHit ? M.aps : C * M.dmgMul * M.aps * G0 * (has('dance') ? (1 + .05 * mom) * (1 + mom * n('momDmg')) : 1);
      const p = M.psnHit;
      const stackUnit = C * M.dmgMul * G0 * PSN_K * M.psn * (1 + n('psnRate'));
      let basicStacks = p.some(t => t >= 1) ? 1 : n('psnHit') ? Math.min(M.psnMax, M.aps * n('psnHit') * PSN_T) : 0;
      const king = fix && U.kingr && acts.filter(g => !SKILLS[g.id].aura).length === 1;
      let T = 0;
      const rows = [];
      for (const g of acts) {
        const a = SKILLS[g.id], s = gemMods(g);
        if (a.sus) { if (a.sdps) T += a.sdps(M, s) * M.skillMul * critF2(M, s); continue; }
        if (g.id === 'summon') {
          /* v0.2.487 起召喚物攻速改成讀 M.minAs 和 M.minAsX（萬軍統御把自己的攻速加成分給召喚物）；舊版沒有這兩個欄位 */
          T += C * M.minMul * MIN.k / MIN.atk * (1 + (M.minAs != null ? M.minAs + (M.minAsX || 0) : n('minAs'))) * (MIN.n + M.minion + s.minion) * (1 + s.dmg) * (1 + n('minDmg')) * (1 + n('spell')) *
            (1 + Math.min(95, (n('minCrit') ? M.crit : 0) + s.crit) / 100 * (((n('minCrit') ? M.critm : 150) + s.critm) / 100 - 1));
          continue;
        }
        const plain = !s.trig && !n('endb') && !n('oath');
        let e = s.trig ? Math.max(TRIG.cd * (1 - n('trigCd')), 1 / (1.5 * M.aps * M.crit / 100 + .01))
          : n('endb') ? uv('endb', 0, U.endb) * acts.filter(t => !SKILLS[t.id].sus).length / M.aps
          : n('oath') ? OATH.cd : a.cd * (1 - s.cd) * (1 - M.cdr / 100);
        if (king && plain) e *= 1 - n('kingCd');
        rows.push({ g: g, a: a, s: s, e: e });
      }
      /* 施放動畫的排擠：所有技能佔用的時間加起來超過 1，就一起等比例變慢 */
      let slow = 1, castRate = 0;
      if (fix) {
        let util = 0;
        for (const r of rows) util += (ANIM_LOCK + EXTRA_GAP * r.s.extra) / r.e;
        slow = Math.max(1, util);
        for (const r of rows) castRate += (1 + r.s.extra) / (r.e * slow);
      }
      let skillStacks = 0;
      for (const r of rows) {
        if (fixedHit) break;
        const a = r.a, s = r.s, e = r.e * slow;
        const mul = (s.trig && !n('trigFull') ? TRIG.k : 1) * (1 + s.dmg) * (a.tg.includes('proj') ? 1 + n('projDmg') : 1) * (a.tg.includes('spell') ? 1 + n('spell') : 1) *
          (king && !a.tg.includes('minion') ? 1 + uv('kingr', 0, U.kingr) / 100 : 1);
        const unit = C * (a.tg.includes('minion') ? M.minMul : M.skillMul) * critF2(M, s);
        if (fix && r.g.id === 'varrow') {
          const hps = (1 + s.extra) / e, nst = Math.min(M.psnMax + s.pstk, PSN_T * hps);
          skillStacks = Math.max(skillStacks, nst);
          T += unit * mul * a.hit * ((1 + .6 * s.extra) / e + (1 + .6 * s.extra) / (1 + s.extra) * PSN_K * M.psn * (1 + n('psnRate')) * nst);
        } else {
          T += unit * mul * (a.est ? a.est(s, M, e) : a.hit || 0) * (1 + .6 * s.extra) / e;
        }
      }
      if (fix) {
        const k = Math.max(0, 1 - castRate * ATK_LOCK);
        basic *= k;
        basicStacks = Math.min(basicStacks * k, Math.max(0, M.psnMax - skillStacks));
      }
      T += basic + (fixedHit ? 0 : stackUnit * basicStacks);
      const cdOfGem = g => SKILLS[g.id].cd * (1 - gemMods(g).cd) * (1 - M.cdr / 100);
      const gChain = acts.find(g => g.id === 'chain');
      if (gChain) { const al = M.ail * (1 + gemMods(gChain).ail); T *= 1 + AIL.shk.v * al * Math.min(1, AIL.shk.t * al / cdOfGem(gChain)); }
      const gVul = acts.find(g => g.id === 'cvul');
      if (gVul) T *= 1 + CRS.vu.v * M.crs * Math.min(1, CRS.vu.t / cdOfGem(gVul));
      const gTnt = acts.find(g => g.id === 'taunt');
      if (gTnt && n('tntVul')) T *= 1 + n('tntVul') * Math.min(1, (TNT_T + n('tntT')) / cdOfGem(gTnt));
      if (n('psnVul') && (p.length || has('varrow'))) T *= 1 + n('psnVul');
      if (!fixedHit && has('frenzy')) T *= 1.35 + n('frz');
      for (const h of HIT_MUL) if (h.est) T *= h.est(M, n);
      return T;
    };
    /* 要在 withGems() 裡面呼叫（它會讀盤上的寶石） */
    const fixDps = M => {
      if (fixBad) return M.dps;
      try {
        if (fixChecks++ % 200 === 0) {
          const raw = modelDps(M, false);
          if (!(Math.abs(raw - M.dps) <= 0.01 * Math.max(1, M.dps))) { fixBad = true; return M.dps; }
        }
        const v = modelDps(M, true);
        return isFinite(v) ? v : M.dps;
      } catch (e) { fixBad = true; return M.dps; }
    };
    const fixOf = list => withGems(list, () => fixDps(calc())) || 0;
    /* 除錯用：在主控台可以用 __awFix.model(calc(), false) 和面板數字對照，確認照抄的公式還對得上 */
    window.__awFix = { model: modelDps, bad: () => fixBad };
    const cdOf = g => withGems(gems, () => {
      const sk = SKILLS[g.id];
      if (!sk.act || sk.sus || sk.aura || !sk.cd) return '';
      const m = gemMods(g);
      if (m.trig) return '暴擊觸發';
      if (tal('endb')) return '普攻觸發';
      const cd = tal('oath') ? OATH.cd : sk.cd * (1 - m.cd) * (1 - PS.cdr / 100) * kingCd();
      return cd.toFixed(2) + 's';
    }) || '';
    const linksOf = g => withGems(gems, () => linkedSupports(g).map(s => SKILLS[s.id].n)) || [];

    const BTN = 'padding:2px 8px;cursor:pointer';
    const root = document.createElement('div');
    root.id = 'awPlan';
    root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font:13px/1.5 sans-serif;color:#f0e6d2';
    root.innerHTML =
      '<div style="background:#2a2118;border:2px solid #6a5a4a;border-radius:6px;padding:12px;box-sizing:border-box;max-width:96vw;max-height:94%;overflow:auto">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">' +
          '<b style="font-size:15px">技能配置模擬</b><span style="color:#a89a84;font-size:12px">' + VERSION + '</span><span data-r="pages"></span><span style="flex:1"></span>' +
          '<label style="cursor:pointer"><input type="checkbox" data-a="open"> 預覽全部 36 格</label>' +
          '<button data-a="reset" style="' + BTN + '">重新讀取</button><button data-a="clear" style="' + BTN + '">清空</button>' +
          '<button data-a="imp" style="' + BTN + '">匯入配置</button><button data-a="exp" style="' + BTN + '">匯出配置</button>' +
          '<button data-a="sug" style="' + BTN + '">建議配裝</button>' +
          '<button data-a="auto" style="' + BTN + '">自動排盤</button>' +
        '</div>' +
        '<div data-r="copy" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap"></div>' +
        '<div data-r="gear"></div>' +
        '<div data-r="sug"></div>' +
        '<div data-r="auto"></div>' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">' +
          '<div>' +
            '<div data-r="grid" class="sgrid" style="width:' + (N * CELL + 15) + 'px;max-width:none;user-select:none"></div>' +
            '<div data-r="held" style="margin-top:6px;min-height:26px"></div>' +
            '<div style="color:#a89a84;font-size:12px">點下方寶石拿起 → 點格子放下；點已放的寶石可拿起<br>R 旋轉、右鍵放回、Esc 取消（手機請用拿起後出現的「旋轉」「放回」按鈕）</div>' +
          '</div>' +
          '<div data-r="stat" style="min-width:min(270px,100%);max-width:340px"></div>' +
        '</div>' +
        '<div data-r="pal" style="margin-top:10px;max-width:' + (N * CELL + 370) + 'px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
          '<button data-a="close" style="' + BTN + '">取消</button>' +
          '<button data-a="apply" style="' + BTN + ';font-weight:bold;background:#ffd84a;color:#2a2118;border:1px solid #000">確定並套用</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    const q = k => root.querySelector('[data-r="' + k + '"]');
    const elGrid = q('grid'), elHeld = q('held'), elStat = q('stat'), elPal = q('pal'), elPages = q('pages'), elCopy = q('copy'), elGear = q('gear'), elSug = q('sug'), elAuto = q('auto');

    const drawPages = () => {
      elPages.innerHTML = '套用到構築：' + S.gpages.map((_, i) =>
        '<button data-a="page" data-v="' + i + '" style="' + BTN + ';margin-left:3px;' +
        (i === page ? 'background:#ffd84a;color:#2a2118;font-weight:bold' : '') + '">' + (i + 1) + (i === S.gp ? '（使用中）' : '') + '</button>').join('');

      /* 複製列：來源不能和目標是同一個構築 */
      if (src < 0 || src === page) src = S.gpages.findIndex((_, i) => i !== page);
      elCopy.innerHTML = src < 0 ? '' :
        '從構築 <select data-r="src" style="padding:2px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a">' +
        S.gpages.map((_, i) => i === page ? '' : '<option value="' + i + '"' + (i === src ? ' selected' : '') + '>' + (i + 1) + (i === S.gp ? '（使用中）' : '') + '</option>').join('') +
        '</select> 複製到構築 ' + (page + 1) + '：' +
        '<button data-a="cpGems" style="' + BTN + '">複製技能組</button>' +
        '<button data-a="cpEquip" style="' + BTN + '">複製裝備</button>' +
        '<small style="color:#a89a84">技能組先複製到模擬盤，按「確定並套用」才寫入；裝備會立刻寫入</small>';
    };

    /* 某個構築綁定的裝備（部位 → 物品編號）：使用中的讀身上，其他讀 S.bld 的記錄 */
    const eqOf = p => {
      if (p === S.gp) { const m = {}; for (const sl of SLOTS) if (S.equip[sl]) m[sl] = S.equip[sl].u; return m; }
      return S.bld[p] ? S.bld[p].eq : null;
    };
    /* 把來源構築的裝備複製給目標構築。
     * 目標是使用中的構築：用遊戲的 equipItem() 真的穿上；
     * 目標是其他構築：只改 S.bld 裡的記錄（天賦和神器沿用目標原本的，沒有記錄就用目前的） */
    const copyEquip = async () => {
      const eq = eqOf(src);
      if (!eq || !Object.keys(eq).length) { uiAlert('構築 ' + (src + 1) + ' 沒有記錄裝備（還沒切換過的構築不會有記錄）'); return; }
      const pool = [...SLOTS.map(sl => S.equip[sl]).filter(Boolean), ...S.bag];
      const names = SLOTS.filter(sl => eq[sl]).map(sl => {
        const it = pool.find(o => o.u === eq[sl]);
        return SLOT_NAME[sl] + '：' + (it ? itemName(it) : '（找不到，可能已分解）');
      });
      if (!await uiConfirm('把構築 ' + (src + 1) + ' 的裝備複製到構築 ' + (page + 1) + '？\n\n' + names.join('\n') + '\n\n這會立刻寫入存檔。')) return;
      let fail = 0;
      if (page === S.gp) {
        for (const sl of SLOTS) {
          const u = eq[sl];
          if (!u || (S.equip[sl] && S.equip[sl].u === u)) continue;
          const it = S.bag.find(o => o.u === u);
          if (!it || !canWear(it)) { fail++; continue; }
          equipItem(u);
        }
        realOpen = openSet();
      } else {
        const cur = S.bld[page];
        S.bld[page] = {
          eq: Object.assign({}, eq),
          asc: cur ? cur.asc : S.tal.asc,
          p: cur ? [...cur.p] : [...S.tal.p],
          art: cur ? cur.art : S.art.on
        };
        markDirty();
      }
      saveNow();
      ui.render();
      refresh();
      toast('已把構築 ' + (src + 1) + ' 的裝備複製到構築 ' + (page + 1) + (fail ? '（' + fail + ' 件無法穿上）' : ''), 'lvl');
    };

    /* 小圖示：用遊戲畫寶石的 gemArt()（和技能分頁下方清單同一張圖） */
    const icon = (g, rot) => {
      const a = gemArt(g.id, rot, 5, g.sh);
      return '<span class="awart" style="display:inline-block;vertical-align:middle;width:' + 2 * a.W + 'px;height:' + 2 * a.H + 'px">' + a.svg + '</span>';
    };
    const fitArt = el => el.querySelectorAll('.awart svg').forEach(v => { v.style.display = 'block'; v.style.width = '100%'; v.style.height = '100%'; });

    /* 盤面直接沿用遊戲的外觀：容器掛上遊戲的 sgrid 樣式，格子用遊戲的 open／lock 樣式，
     * 寶石圖和名稱用遊戲的 gemOverlay() 產生，放得下／放不下的提示用遊戲的 drop／ghost 樣式 */
    const drawGrid = () => {
      const prev = new Map();
      if (held && hover) {
        const ok = fits(held, hover[0], hover[1]);
        for (const [x, y] of gemCells(held, hover[0], hover[1], held.rot)) prev.set(x + ',' + y, ok);
      }
      let h = '';
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const k = x + ',' + y, open = realOpen.has(k);
        let cls = open || allOpen ? 'open' : 'lock';
        if (prev.has(k)) cls += prev.get(k) ? ' drop' : ' ghost';
        h += '<button data-x="' + x + '" data-y="' + y + '" class="' + cls + '" style="cursor:pointer' + (!open && allOpen ? ';opacity:.55' : '') + '"></button>';
      }
      for (const g of gems) h += gemOverlay(g, false);
      elGrid.innerHTML = h;
    };

    const drawHeld = () => {
      elHeld.innerHTML = held
        ? '手上：' + icon(held, held.rot) + ' <b style="color:' + SKILLS[held.id].col + '">' + SKILLS[held.id].n + '</b> <button data-a="rot" style="' + BTN + '">旋轉</button> <button data-a="drop" style="' + BTN + '">放回</button>'
        : '<span style="color:#a89a84">手上沒有寶石</span>';
      fitArt(elHeld);
    };
    /* 右側數據：總 DPS，以及每顆寶石「拿掉它會少多少」的貢獻 */
    const drawStat = () => {
      const total = dpsOf(gems);
      const fixed = fixOf(gems);
      const now = PS.dps || 0;
      const diff = now ? (total / now - 1) * 100 : 0;
      const rows = gems.map(g => ({ g, d: total - dpsOf(gems.filter(o => o !== g)) })).sort((a, b) => b.d - a.d);
      let h =
        '<div style="background:#1a1410;padding:8px;border-radius:4px">' +
          '<div>模擬 DPS</div><div style="font:bold 22px/1.3 monospace;color:#ffd84a">' + fmt(Math.round(total)) + '</div>' +
          '<div style="color:#a89a84">目前遊戲內：' + fmt(Math.round(now)) + '　<b style="color:' + (diff >= 0 ? '#7dffc8' : '#ff5a6a') + '">' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%</b></div>' +
          (fixBad
            ? '<div style="color:#ffb070;font-size:12px">修正公式和目前的遊戲版本對不上，自動排盤和建議配裝暫時改用面板數字</div>'
            : '<div title="把神王之戒、施放動畫的上限、普攻被技能排擠、中毒層數上限算進去的估計值；自動排盤和建議配裝用這個數字比較">修正後估計：<b style="color:#7dffc8;font-family:monospace">' + fmt(Math.round(fixed)) + '</b></div>') +
          (page !== S.gp ? '<div style="color:#ffb070;font-size:12px">以目前穿著的裝備與天賦計算</div>' : '') +
        '</div>' +
        '<div style="margin:8px 0 4px;color:#a89a84">每顆寶石的貢獻（拿掉它會少多少）</div>';
      for (const r of rows) {
        const sk = SKILLS[r.g.id];
        const pct = total ? r.d / total * 100 : 0;
        const cd = cdOf(r.g);
        const links = sk.act && !sk.aura ? linksOf(r.g) : [];
        h += '<div style="display:flex;gap:6px;border-bottom:1px solid #3a3026;padding:2px 0">' +
          '<span style="flex:1"><b style="color:' + sk.col + '">' + sk.n + '</b>' + (cd ? ' <small style="color:#a89a84">' + cd + '</small>' : '') +
          (links.length ? '<br><small style="color:#a89a84">← ' + links.join('、') + '</small>' : '') + '</span>' +
          '<span style="text-align:right;font-family:monospace">' + fmt(Math.round(r.d)) + '<br><small style="color:#a89a84">' + pct.toFixed(1) + '%</small></span></div>';
      }
      if (!rows.length) h += '<div style="color:#a89a84">尚未放置寶石</div>';
      elStat.innerHTML = h;
    };

    /* 寶石清單：只列存檔裡持有、且還沒放上模擬盤的寶石，同名同形狀疊在一起 */
    const drawPal = () => {
      const groups = new Map();
      for (const g of tray()) {
        const k = g.id + '|' + JSON.stringify(g.sh || 0);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(g);
      }
      const btn = list => {
        const g = list[0], sk = SKILLS[g.id];
        return '<button data-a="pick" data-u="' + g.u + '" title="' + String(sk.d || '').replace(/"/g, '&quot;') + '" style="margin:2px;padding:2px 6px;border:1px solid ' + sk.col + ';background:#1a1410;color:#f0e6d2;cursor:pointer">' +
          icon(g, 0) + ' ' + sk.n + (g.sh ? '（變異）' : '') + (list.length > 1 ? ' ×' + list.length : '') + '</button>';
      };
      const all = [...groups.values()];
      const act = all.filter(l => SKILLS[l[0].id].act), sup = all.filter(l => !SKILLS[l[0].id].act);
      elPal.innerHTML =
        '<div><b>主動技能</b>　' + (act.map(btn).join('') || '<span style="color:#a89a84">沒有剩餘</span>') + '</div>' +
        '<div style="margin-top:4px"><b>輔助寶石</b>　' + (sup.map(btn).join('') || '<span style="color:#a89a84">沒有剩餘</span>') + '</div>' +
        '<div style="color:#a89a84;font-size:12px">只列出你存檔裡持有的寶石；滑鼠停在按鈕上可看說明</div>';
      fitArt(elPal);
    };

    const refresh = () => { drawPages(); drawGear(); drawGrid(); drawHeld(); drawStat(); drawPal(); };
    const rotate = () => { if (held) { held.rot = (held.rot + 1) % 4; drawGrid(); drawHeld(); } };
    const close = () => { window.removeEventListener('keydown', onKey, true); root.remove(); };
    const onKey = e => {
      /* 對話框開著、或正在輸入框裡打字時，不要把按鍵當成快速鍵（不然打不出 r，按 Esc 會連模擬視窗一起關掉） */
      if (document.querySelector('#awDlg') || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return;
      if (e.key === 'Escape') { close(); } else if (e.key === 'r' || e.key === 'R') { rotate(); } else { return; }
      e.stopPropagation(); e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);

    /* ----- 裝備計畫（鑲嵌 + 換裝） -----
     * 鑲嵌的做法和遊戲相同：把符文編號放進 裝備.sock.st，再呼叫遊戲的 fuse()；
     * fuse() 會自己扣灌注石 Lv3 和灰燼、消耗符文、把插槽裝備變成一般裝備。
     * 規則（照遊戲的鑲嵌視窗）：裝備要在背包裡；獨特效果要同部位且最多一顆；石板詞綴不能放；
     * 武器專屬詞綴只能放武器；「異種」插槽不能重複同一種詞綴；神眷詞綴最多一條。 */
    const allItems = () => [...SLOTS.map(sl => S.equip[sl]).filter(Boolean), ...S.bag];
    const runeText = r => r.uq ? '獨特：' + UNIQUE[r.uq].n : AFFIX[r.a].f(r.v);
    /* 檢查一筆鑲嵌能不能做，回傳原因；空字串代表可以 */
    const fuseCheck = f => {
      const it = S.bag.find(o => o.u === f.u);
      if (!it) return '找不到這件裝備（要放在背包裡）';
      if (!it.sock) return '這件沒有插槽（可能已經鑲嵌過）';
      if (!f.runes.length || f.runes.length > it.sock.n) return '符文數量不對（這件是 ' + it.sock.n + ' 孔）';
      if (new Set(f.runes).size !== f.runes.length) return '同一顆符文重複了';
      const rs = f.runes.map(u => S.runes.find(r => r.u === u));
      if (rs.some(r => !r)) return '有符文找不到（可能已經用掉或分解）';
      if (rs.some(r => isStaged(r.u) && !it.sock.st.includes(r.u))) return '有符文已經放在別件裝備的插槽裡';
      if (rs.filter(r => r.uq).length > 1) return '獨特效果最多一顆';
      for (const r of rs) {
        if (r.uq) { if (UNIQUE[r.uq].slot !== it.slot) return '獨特效果的部位不符'; continue; }
        if (isSlateAf(r.a)) return '石板詞綴不能放進裝備';
        if (AFFIX[r.a].loc && it.slot !== 'weapon') return '武器專屬詞綴只能放武器';
      }
      const kinds = rs.filter(r => !r.uq).map(r => r.a);
      if (it.sock.mode !== 'a' && new Set(kinds).size !== kinds.length) return '異種插槽不能放重複的詞綴';
      if (rs.filter(r => !r.uq && AFFIX[r.a].dv != null).length > 1) return '神眷詞綴最多一條';
      return '';
    };
    /* 計畫內容的文字說明，顯示在紅框和確認視窗裡 */
    const planLines = () => {
      const out = [];
      if (gear) {
        for (const f of gear.fuse) {
          const it = allItems().find(o => o.u === f.u);
          const rs = f.runes.map(u => S.runes.find(r => r.u === u));
          out.push('鑲嵌 ' + (it ? itemName(it) + '（' + SLOT_NAME[it.slot] + '）' : '#' + f.u) + ' ← ' + rs.map(r => r ? runeText(r) : '（找不到）').join('、'));
        }
        for (const u of gear.equip) {
          const it = allItems().find(o => o.u === u);
          out.push('換上 ' + (it ? SLOT_NAME[it.slot] + '：' + itemName(it) : '#' + u));
        }
      }
      if (multi) {
        for (const k of Object.keys(multi)) {
          const p = +k;
          out.push('構築 ' + (p + 1) + '：寫入 ' + multi[k].length + ' 顆寶石的配置' +
            (p === S.gp ? '（使用中）' : '，裝備和天賦改成和使用中的構築 ' + (S.gp + 1) + ' 相同'));
        }
      }
      return out;
    };
    const drawGear = () => {
      elGear.innerHTML = !gear && !multi ? '' :
        '<div style="background:#1a1410;border:1px solid #c8323c;border-radius:4px;padding:6px 8px;margin-bottom:8px">' +
        '<b style="color:#ffb070">匯入的計畫</b>（按「確定並套用」時執行' + (gear ? '，鑲嵌無法復原' : '') + '） <button data-a="gearClear" style="' + BTN + '">取消計畫</button>' +
        planLines().map(l => '<div style="font-size:12px">' + l.replace(/</g, '&lt;') + '</div>').join('') + '</div>';
    };
    /* ----- 建議配裝（簡易版） -----
     * 以模擬盤上的技能配置為準，從背包挑出讓遊戲面板 DPS 最高的裝備，結果寫成上面的裝備計畫。
     * 算法：
     *   1. 現成裝備：一個部位一個部位試，把背包裡同部位的每一件換上去算分數，留最高的；整輪做兩次。
     *   2. 插槽裝備（要勾選才會用）：每個部位取孔數最多的兩件，從持有的符文裡一顆一顆挑
     *      「放上去分數提升最多」的，放滿後如果比現成裝備好超過 1% 就改用它。
     * 分數 = 面板 DPS，生命或護甲減傷低於設定的底線時會被大幅扣分。
     * DPS 直接用遊戲的 calc()，所以單格模式開著時會自動照單格規則算；
     * 但面板沒算進去的效果（神王之戒、神眷詞綴、各種擊中／擊殺時觸發的獨特效果）這裡也不會算。
     * 計算時會暫時改 S.equip，算完一定換回來，不會動到存檔。 */
    let sugOpt = null;
    let sugRes = null;
    const suggest = opt => {
      const keepEq = Object.assign({}, S.equip);
      const evalNow = () => withGems(gems, () => { const m = calc(); m.fix = fixDps(m); return m; });
      const score = () => {
        const m = evalNow();
        if (!m) return 0;
        /* 傷害相同時挑防禦比較好的（例如胸甲通常不加傷害），所以防禦只佔很小的比重 */
        let s = m.fix * (1 + 0.001 * (m.maxhp / 1000 + m.armRed / 25 + m.dodge / 25));
        if (opt.minHp > 0 && m.maxhp < opt.minHp) s *= Math.pow(m.maxhp / opt.minHp, 8);
        if (opt.minArm > 0 && m.armRed < opt.minArm) s *= Math.pow((m.armRed + 1) / (opt.minArm + 1), 3);
        return s;
      };
      try {
        const before = evalNow();
        const slots = SLOTS.filter(sl => opt.slots[sl]);
        /* 第 1 步：現成裝備 */
        const pool = {};
        for (const sl of slots) pool[sl] = S.bag.filter(t => t.slot === sl && !t.sock && canWear(t));
        for (let pass = 0; pass < 2; pass++) {
          for (const sl of slots) {
            let best = S.equip[sl], bestS = score();
            for (const t of pool[sl]) {
              S.equip[sl] = t;
              const s = score();
              if (s > bestS) { bestS = s; best = t; }
            }
            if (best) S.equip[sl] = best; else delete S.equip[sl];
          }
        }
        /* 第 2 步：插槽裝備 */
        const fuseOf = {};
        if (opt.sock) {
          const used = new Set();
          const byAf = {};
          for (const r of S.runes) {
            if (r.uq || isSlateAf(r.a) || AFFIX[r.a].dv != null || isStaged(r.u)) continue;
            (byAf[r.a] = byAf[r.a] || []).push(r);
          }
          for (const a of Object.keys(byAf)) byAf[a].sort((x, y) => x.t - y.t || y.v - x.v);
          const top = a => byAf[a].find(r => !used.has(r.u));
          for (const sl of slots) {
            const cands = S.bag.filter(t => t.slot === sl && t.sock && !t.sl && canWear(t))
              .sort((x, y) => y.sock.n - x.sock.n || (y.sock.mode === 'a') - (x.sock.mode === 'a')).slice(0, 2);
            const cur = S.equip[sl];
            let bestS = score(), bestIt = null, bestRunes = null;
            for (const it of cands) {
              const picked = [];
              const virt = Object.assign({}, it, { af: [] });
              delete virt.sock;
              S.equip[sl] = virt;
              let curS = score();
              while (picked.length < it.sock.n) {
                let pick = null, pickS = -1;
                for (const a of Object.keys(byAf)) {
                  if (AFFIX[a].loc && sl !== 'weapon') continue;
                  if (it.sock.mode !== 'a' && picked.some(r => r.a === a)) continue;
                  const r = top(a);
                  if (!r || picked.includes(r)) continue;
                  virt.af.push({ a: r.a, t: r.t, v: r.v });
                  const s = score();
                  virt.af.pop();
                  if (s > pickS) { pickS = s; pick = r; }
                }
                if (!pick || pickS < curS) break;
                picked.push(pick); used.add(pick.u);
                virt.af.push({ a: pick.a, t: pick.t, v: pick.v });
                curS = pickS;
              }
              for (const r of picked) used.delete(r.u);
              if (picked.length && curS > bestS * 1.01) { bestS = curS; bestIt = virt; bestRunes = picked; }
            }
            if (bestIt) {
              S.equip[sl] = bestIt;
              for (const r of bestRunes) used.add(r.u);
              fuseOf[sl] = { u: bestIt.u, runes: bestRunes.map(r => r.u) };
            } else if (cur) { S.equip[sl] = cur; } else { delete S.equip[sl]; }
          }
        }
        const after = evalNow();
        const changes = [];
        for (const sl of slots) {
          const now = S.equip[sl], old = keepEq[sl];
          if (now && (!old || now.u !== old.u)) changes.push({ sl: sl, u: now.u, name: fuseOf[sl] ? '鑲嵌・' + now.base : itemName(now), old: old ? itemName(old) : '（空）', fuse: fuseOf[sl] || null });
        }
        return { before: before, after: after, changes: changes };
      } catch (e) {
        return null;
      } finally {
        for (const sl of SLOTS) { if (keepEq[sl]) S.equip[sl] = keepEq[sl]; else delete S.equip[sl]; }
      }
    };
    const drawSug = () => {
      if (!sugOpt) { elSug.innerHTML = ''; return; }
      const o = sugOpt;
      let h = '<div style="background:#1a1410;border:1px solid #6a5a4a;border-radius:4px;padding:6px 8px;margin-bottom:8px">' +
        '<b style="color:#ffd84a">建議配裝</b>　<span style="color:#a89a84;font-size:12px">以模擬盤上的技能和修正後的 DPS 估計為準' + (window.__awOne ? '（單格模式）' : '') + '</span>' +
        '<div style="margin:4px 0">可以更換的部位：' + SLOTS.map(sl => '<label style="margin-right:8px;white-space:nowrap;cursor:pointer"><input type="checkbox" data-sg="slot" data-v="' + sl + '"' + (o.slots[sl] ? ' checked' : '') + '> ' + SLOT_NAME[sl] + '</label>').join('') + '</div>' +
        '<div style="margin:4px 0">生命不低於 <input data-sg="hp" type="number" value="' + o.minHp + '" style="width:70px;background:#2a2118;color:#f0e6d2;border:1px solid #6a5a4a">　' +
        '<label style="white-space:nowrap;cursor:pointer"><input type="checkbox" data-sg="arm"' + (o.keepArm ? ' checked' : '') + '> 護甲減傷不低於目前</label></div>' +
        '<div style="margin:4px 0"><label style="cursor:pointer"><input type="checkbox" data-sg="sock"' + (o.sock ? ' checked' : '') + '> 也考慮插槽裝備（會用掉符文，鑲嵌無法復原）</label></div>' +
        '<button data-a="sugRun" style="' + BTN + ';font-weight:bold">開始計算</button> <button data-a="sugClose" style="' + BTN + '">關閉</button>';
      if (sugRes === 'busy') h += '<div style="margin-top:6px">計算中…</div>';
      else if (sugRes === 'fail') h += '<div style="margin-top:6px;color:#ff5a6a">計算失敗，沒有做任何變更。</div>';
      else if (sugRes) {
        const b = sugRes.before, a = sugRes.after;
        const pct = b.fix ? (a.fix / b.fix - 1) * 100 : 0;
        h += '<div style="margin-top:6px;border-top:1px solid #3a3026;padding-top:6px">';
        if (!sugRes.changes.length) h += '<div>目前穿的已經是最好的組合，沒有建議更換的部位。</div>';
        else {
          for (const c of sugRes.changes) {
            h += '<div style="font-size:12px">' + SLOT_NAME[c.sl] + '：' + String(c.old).replace(/</g, '&lt;') + ' → <b>' + String(c.name).replace(/</g, '&lt;') + '</b>' +
              (c.fuse ? '<br><span style="color:#a89a84">　鑲嵌：' + c.fuse.runes.map(u => runeText(S.runes.find(r => r.u === u))).join('、').replace(/</g, '&lt;') + '</span>' : '') + '</div>';
          }
          h += '<div style="margin-top:4px">' + (fixBad ? '面板 DPS ' : '修正後估計 ') + fmt(Math.round(b.fix)) + ' → <b style="color:#ffd84a">' + fmt(Math.round(a.fix)) + '</b>（' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%）　' +
            (fixBad ? '' : '面板 DPS ' + fmt(Math.round(b.dps)) + ' → ' + fmt(Math.round(a.dps)) + '　') +
            '生命 ' + Math.round(b.maxhp) + ' → ' + Math.round(a.maxhp) + '　護甲減傷 ' + Math.round(b.armRed) + '% → ' + Math.round(a.armRed) + '%　閃避 ' + Math.round(b.dodge) + '% → ' + Math.round(a.dodge) + '%</div>' +
            '<button data-a="sugUse" style="' + BTN + ';margin-top:4px;background:#ffd84a;color:#2a2118;border:1px solid #000">加入計畫</button>' +
            ' <span style="color:#a89a84;font-size:12px">加入後按「確定並套用」才會真的換裝' + (sugRes.changes.some(c => c.fuse) ? '和鑲嵌' : '') + '</span>';
        }
        h += '<div style="color:#a89a84;font-size:12px;margin-top:4px">' + (fixBad ? '修正公式和目前的遊戲版本對不上，這次是用面板數字比較的。' : '已算入神王之戒、施放動畫上限和中毒層數上限。') + '神眷詞綴、擊中或擊殺時觸發的獨特效果不在比較範圍內，帶這類效果的部位建議取消勾選。</div></div>';
      }
      elSug.innerHTML = h + '</div>';
    };
    /* 把畫面上的勾選和數字讀回 sugOpt */
    const readSug = () => {
      if (!sugOpt) return;
      elSug.querySelectorAll('[data-sg="slot"]').forEach(c => { sugOpt.slots[c.dataset.v] = c.checked; });
      const hp = elSug.querySelector('[data-sg="hp"]'), arm = elSug.querySelector('[data-sg="arm"]'), sock = elSug.querySelector('[data-sg="sock"]');
      if (hp) sugOpt.minHp = Math.max(0, +hp.value || 0);
      if (arm) sugOpt.keepArm = arm.checked;
      if (sock) sugOpt.sock = sock.checked;
    };

    /* ----- 自動排盤 -----
     * 從持有的寶石裡找出讓遊戲面板 DPS 最高的技能盤配置，結果只放到模擬盤，要按「確定並套用」才寫入。
     * 算法是「模擬退火」：從目前的模擬盤出發，每一步隨機做一個小改動
     * （放一顆新的、拿掉一顆、移動或旋轉一顆、把一顆換成另一顆），變好就接受，
     * 變差也有機率接受（越到後面機率越低），避免卡在不夠好的排法；全程記住看過最好的一份。
     * 形狀和連結規則都用遊戲自己的 gemCells() 和 calc()，所以單格模式開著時會自動照單格規則排。
     * 分數是面板 DPS 扣掉一點點「盤上寶石數」，這樣沒有作用的寶石會被拿掉。
     * 每次只算 40 毫秒就把控制權還給瀏覽器，畫面不會卡住。結果有隨機性，每次跑出來可能略有不同。 */
    let autoOpt = null;
    let autoMsg = '';
    let autoUndo = null;
    let autoRun = 0;
    const autoSolve = (opt, onTick, onDone) => {
      const open = [...realOpen].map(k => k.split(',').map(Number));
      const banned = id => (opt.noSacr && id === 'sacr') || (opt.noCot && id === 'cot');
      const isAct = g => SKILLS[g.id].act && !SKILLS[g.id].aura;
      const occOf = list => { const s = new Set(); for (const g of list) for (const c of gemCells(g)) s.add(c[0] + ',' + c[1]); return s; };
      const fitsIn = (occ, g, x, y, rot) => gemCells(g, x, y, rot).every(c => realOpen.has(c[0] + ',' + c[1]) && !occ.has(c[0] + ',' + c[1]));
      const value = list => fixOf(list) * (1 - 0.0005 * list.length);
      const okSet = list => !opt.oneAct || list.filter(isAct).length <= 1;
      const rnd = n => Math.floor(Math.random() * n);
      /* 起點：目前模擬盤上放得下、沒被排除的寶石 */
      let cur = [];
      for (const g of gems) {
        if (banned(g.id)) continue;
        if (opt.oneAct && isAct(g) && cur.some(isAct)) continue;
        if (fitsIn(occOf(cur), g, g.x, g.y, g.rot)) cur.push(clone(g, g.x, g.y, g.rot));
      }
      let curV = value(cur), best = cur.slice(), bestV = curV;
      const t0 = Date.now(), total = opt.secs * 1000;
      const step = () => {
        const frac = Math.min(1, (Date.now() - t0) / total);
        const T = 0.08 * Math.pow(0.01, frac);
        const next = cur.slice();
        const trayL = S.gems.filter(g => !banned(g.id) && !cur.some(o => o.u === g.u));
        const r = Math.random();
        if (r < 0.4 || !cur.length) {
          if (!trayL.length) return;
          const g = trayL[rnd(trayL.length)], c = open[rnd(open.length)], rot = rnd(4);
          if (!fitsIn(occOf(cur), g, c[0], c[1], rot)) return;
          next.push(clone(g, c[0], c[1], rot));
        } else if (r < 0.55) {
          next.splice(rnd(next.length), 1);
        } else if (r < 0.85) {
          const i = rnd(next.length), g = next[i];
          next.splice(i, 1);
          const c = open[rnd(open.length)], rot = rnd(4);
          if (!fitsIn(occOf(next), g, c[0], c[1], rot)) return;
          next.push(clone(g, c[0], c[1], rot));
        } else {
          if (!trayL.length) return;
          const i = rnd(next.length), old = next[i];
          next.splice(i, 1);
          const g = trayL[rnd(trayL.length)], rot = rnd(4);
          if (!fitsIn(occOf(next), g, old.x, old.y, rot)) return;
          next.push(clone(g, old.x, old.y, rot));
        }
        if (!okSet(next)) return;
        const v = value(next);
        if (v >= curV || Math.random() < Math.exp((v - curV) / (Math.max(curV, 1e-9) * T))) {
          cur = next; curV = v;
          if (v > bestV) { best = next.slice(); bestV = v; }
        }
      };
      const my = ++autoRun;
      const loop = () => {
        if (my !== autoRun || !document.body.contains(root)) return;
        const end = Date.now() + 40;
        while (Date.now() < end) step();
        if (Date.now() - t0 < total) { onTick((Date.now() - t0) / total, fixOf(best)); setTimeout(loop, 0); return; }
        /* 收尾：拿掉也不影響分數的寶石就拿掉 */
        for (let i = best.length - 1; i >= 0; i--) {
          const rest = best.filter((g, j) => j !== i);
          if (value(rest) >= bestV) { best = rest; bestV = value(rest); }
        }
        onDone(best);
      };
      loop();
    };
    const drawAuto = () => {
      if (!autoOpt) { elAuto.innerHTML = ''; return; }
      const o = autoOpt, busy = o.busy;
      elAuto.innerHTML = '<div style="background:#1a1410;border:1px solid #6a5a4a;border-radius:4px;padding:6px 8px;margin-bottom:8px">' +
        '<b style="color:#ffd84a">自動排盤</b>　<span style="color:#a89a84;font-size:12px">從持有的寶石找修正後 DPS 估計最高的排法' + (window.__awOne ? '（單格模式）' : '') + '</span>' +
        '<div style="margin:4px 0">' +
          '<label style="margin-right:10px;white-space:nowrap;cursor:pointer"><input type="checkbox" data-au="one"' + (o.oneAct ? ' checked' : '') + '> 只放一顆主動技能（神王之戒）</label>' +
          '<label style="margin-right:10px;white-space:nowrap;cursor:pointer"><input type="checkbox" data-au="sacr"' + (o.noSacr ? ' checked' : '') + '> 不使用血祭</label>' +
          '<label style="margin-right:10px;white-space:nowrap;cursor:pointer"><input type="checkbox" data-au="cot"' + (o.noCot ? ' checked' : '') + '> 不使用暴擊觸發</label>' +
          '<label style="white-space:nowrap">計算時間 <select data-au="secs" style="background:#2a2118;color:#f0e6d2;border:1px solid #6a5a4a">' +
            [3, 6, 15, 30].map(s => '<option value="' + s + '"' + (o.secs === s ? ' selected' : '') + '>' + s + ' 秒</option>').join('') + '</select></label>' +
        '</div>' +
        (busy ? '<button data-a="autoStop" style="' + BTN + '">停止</button>' : '<button data-a="autoRun" style="' + BTN + ';font-weight:bold">開始計算</button>') +
        ' <button data-a="autoClose" style="' + BTN + '">關閉</button>' +
        (autoUndo && !busy ? ' <button data-a="autoUndo" style="' + BTN + '">復原成計算前的盤面</button>' : '') +
        (autoMsg ? '<div style="margin-top:6px">' + autoMsg + '</div>' : '') +
        '<div style="color:#a89a84;font-size:12px;margin-top:4px">結果只會放到模擬盤，按「確定並套用」才寫入。從目前的模擬盤開始找，每次結果可能略有不同；神眷詞綴、觸發型獨特效果和多目標不在比較範圍內。</div></div>';
    };
    const readAuto = () => {
      if (!autoOpt) return;
      const g = k => elAuto.querySelector('[data-au="' + k + '"]');
      if (g('one')) autoOpt.oneAct = g('one').checked;
      if (g('sacr')) autoOpt.noSacr = g('sacr').checked;
      if (g('cot')) autoOpt.noCot = g('cot').checked;
      if (g('secs')) autoOpt.secs = +g('secs').value || 6;
    };

    /* 執行裝備計畫。全部先檢查過才動手；回傳 false 代表使用者取消或檢查沒過（這時什麼都沒改）。
     * 多構築計畫一律穿在使用中的構築上，其他構築之後再照抄；單一構築則穿在選定的目標構築 */
    const runGear = async () => {
      const tp = multi ? S.gp : page;
      for (const f of gear.fuse) {
        const err = fuseCheck(f);
        if (err) { uiAlert('裝備計畫無法執行，沒有做任何變更。\n鑲嵌 #' + f.u + '：' + err); return false; }
      }
      const fuseItems = gear.fuse.map(f => S.bag.find(o => o.u === f.u));
      const ashNeed = fuseItems.reduce((n, it) => n + ALCH_ASH.f(it.ilvl), 0);
      if ((S.mat.i3 || 0) < fuseItems.length) { uiAlert('灌注石 Lv3 不夠：需要 ' + fuseItems.length + ' 顆，你有 ' + (S.mat.i3 || 0) + ' 顆。沒有做任何變更。'); return false; }
      if (S.ash < ashNeed) { uiAlert('符文灰燼不夠：需要 ' + ashNeed + '。沒有做任何變更。'); return false; }
      for (const u of gear.equip) {
        const it = allItems().find(o => o.u === u);
        if (!it) { uiAlert('裝備計畫無法執行，沒有做任何變更。\n找不到要換上的裝備 #' + u); return false; }
        if (!canWear(it)) { uiAlert('裝備計畫無法執行，沒有做任何變更。\n等級不足，穿不上 ' + itemName(it)); return false; }
      }
      if (!await uiConfirm('即將執行（裝備穿在構築 ' + (tp + 1) + '）：\n\n' + planLines().join('\n') +
        '\n\n鑲嵌會消耗 ' + fuseItems.length + ' 顆灌注石 Lv3、' + ashNeed + ' 灰燼和上面列出的符文，鑲嵌後無法取下、無法復原。\n確定執行？')) return false;

      for (let i = 0; i < gear.fuse.length; i++) {
        const it = fuseItems[i];
        it.sock.st = gear.fuse[i].runes.slice();
        fuse(it);
        if (it.sock) { it.sock.st = []; uiAlert('鑲嵌 ' + itemName(it) + ' 沒有成功，已停止後續步驟。'); return false; }
      }
      for (const u of gear.equip) {
        const it = allItems().find(o => o.u === u);
        if (tp === S.gp) {
          if (S.bag.includes(it)) equipItem(u);
        } else {
          const cur = S.bld[tp];
          const eq = Object.assign({}, cur ? cur.eq : eqOf(S.gp));
          eq[it.slot] = u;
          S.bld[tp] = { eq: eq, asc: cur ? cur.asc : S.tal.asc, p: cur ? [...cur.p] : [...S.tal.p], art: cur ? cur.art : S.art.on };
        }
      }
      gear = null;
      realOpen = openSet();
      markDirty();
      return true;
    };

    /* 配置代碼：每顆寶石一段，用分號隔開，格式是「寶石代號[*][#編號]:x,y,旋轉」。
     *   寶石代號是遊戲內部的英文代號（例如 varrow 是劇毒箭矢），* 代表變異寶石，
     *   #編號 是存檔裡那顆寶石的編號，可以省略；x、y 從 0 開始，旋轉是 0 到 3。
     *   例：varrow:4,3,1;multi*:3,2,3;prec:2,2,2
     * 進階用法（只有匯入支援，匯出不會帶），各段用直線符號隔開：
     *   F:裝備編號等號符文編號,符文編號;...   鑲嵌
     *   E:裝備編號;裝備編號                   換上
     *   G1:寶石配置   G2:寶石配置             一次指定多個構築的配置（數字是構築編號）
     *   B:寶石代號等號數量;...                向商店補買寶石到指定的持有數量（匯入當下就會詢問並購買）
     *   例：G1:varrow:4,3,1|G2:pierce:0,0,1|F:19963=13149,19709|E:19963
     * 用了 G1／G2 這種多構築寫法時，裝備一律穿在使用中的構築，
     * 其他有指定配置的構築，裝備和天賦會改成和使用中的構築相同。 */
    const exportCode = () => gems.map(g => g.id + (g.sh ? '*' : '') + '#' + g.u + ':' + g.x + ',' + g.y + ',' + g.rot).join(';');
    /* 把一段寶石配置排進模擬盤（會先清空），回傳放不上去的清單 */
    const parseGems = str => {
      const miss = [];
      gems = [];
      for (const tok of String(str).split(';').map(t => t.trim()).filter(Boolean)) {
        const m = /^([a-zA-Z]+)(\*?)(?:#(\d+))?:(-?\d+),(-?\d+),(\d)$/.exec(tok);
        if (!m) { miss.push(tok); continue; }
        const id = m[1], mut = !!m[2], u = m[3] ? +m[3] : null, x = +m[4], y = +m[5], rot = +m[6] % 4;
        const free = g => g.id === id && !gems.some(o => o.u === g.u);
        /* 先找編號相同的那一顆，再找同樣是（或不是）變異的，最後才用任何一顆同名的 */
        const cand = [...S.gems.filter(g => free(g) && g.u === u), ...S.gems.filter(g => free(g) && !!g.sh === mut), ...S.gems.filter(free)];
        let ok = null;
        for (const g of cand) {
          const c = clone(g, x, y, rot);
          if (fits(c, x, y)) { ok = c; break; }
        }
        if (ok) gems.push(ok);
        else miss.push((SKILLS[id] ? SKILLS[id].n : id) + (mut ? '（變異）' : ''));
      }
      return miss;
    };
    /* 向商店補買寶石。寫法是「寶石代號=需要持有的數量」，只補不足的部分（變異寶石不算在內），
     * 所以同一串代碼重複匯入不會重複購買。做法和遊戲商店的購買按鈕相同：扣灰燼、呼叫 giveGem()。 */
    const buyGems = async str => {
      const todo = [];
      for (const t of String(str).split(';').map(x => x.trim()).filter(Boolean)) {
        const kv = t.split('=');
        const id = kv[0], want = +kv[1] || 0;
        if (!SKILLS[id] || !CLASS[S.cls].gems.includes(id)) continue;
        const own = S.gems.filter(g => g.id === id && !g.sh).length;
        if (want > own) todo.push([id, want - own]);
      }
      if (!todo.length) return;
      const count = todo.reduce((n, x) => n + x[1], 0);
      const cost = count * CFG.gemPrice;
      const list = todo.map(x => SKILLS[x[0]].n + ' ×' + x[1]).join('、');
      if (S.ash < cost) { uiAlert('這份配置需要先買寶石：' + list + '，共 ' + cost + ' 灰燼，但你的灰燼不夠。'); return; }
      if (!await uiConfirm('這份配置需要先向商店購買寶石：\n\n' + list + '\n\n共 ' + cost + ' 灰燼（你有 ' + fmt(S.ash) + '）。現在購買？\n按取消的話不會購買，缺的寶石會排不上去。')) return;
      for (const x of todo) for (let i = 0; i < x[1]; i++) { S.ash -= CFG.gemPrice; giveGem(x[0]); }
      markDirty();
      saveNow();
      ui.render();
    };
    const importCode = async code => {
      const allParts = String(code).split('|').map(t => t.trim()).filter(Boolean);
      /* 先確認貼進來的真的是配置代碼，再動模擬盤。
       * 不然貼錯東西（例如拾取規則的代碼）會把模擬盤清空，接著按確定就會把所有寶石取下 */
      const GEM_RE = /^[a-zA-Z]+\*?(?:#\d+)?:-?\d+,-?\d+,\d$/;
      const looksValid = allParts.some(part => /^[FEB]:/i.test(part) ||
        part.replace(/^G\d:/i, '').split(';').some(t => GEM_RE.test(t.trim())));
      if (!looksValid) {
        uiAlert('這不像是技能配置的代碼，沒有做任何變更。\n\n如果你貼的是拾取規則（開頭是 {"auto":…），它要貼在「背包」分頁 →「物品管理」→「拾取規則」。');
        return;
      }
      let miss = [];
      held = null;
      gear = null;
      multi = null;
      let single = null;
      /* B 段要最先處理：先把缺的寶石買齊，後面排配置時才找得到 */
      for (const part of allParts) if (/^B:/i.test(part)) await buyGems(part.slice(2));
      for (const part of allParts) {
        if (/^B:/i.test(part)) continue;
        const gm = /^G(\d):/i.exec(part);
        if (gm) {
          const p = +gm[1] - 1;
          if (p < 0 || p >= S.gpages.length) { miss.push('沒有構築 ' + gm[1]); continue; }
          if (!multi) multi = {};
          miss = miss.concat(parseGems(part.slice(3)).map(n => '構築 ' + gm[1] + ' 的 ' + n));
          multi[p] = gems;
        } else if (/^F:/i.test(part)) {
          if (!gear) gear = { fuse: [], equip: [] };
          for (const t of part.slice(2).split(';').map(x => x.trim()).filter(Boolean)) {
            const kv = t.split('=');
            gear.fuse.push({ u: +kv[0], runes: (kv[1] || '').split(',').filter(Boolean).map(Number) });
          }
        } else if (/^E:/i.test(part)) {
          if (!gear) gear = { fuse: [], equip: [] };
          for (const t of part.slice(2).split(';').map(x => x.trim()).filter(Boolean)) gear.equip.push(+t);
        } else {
          single = part;
        }
      }
      if (gear && !gear.fuse.length && !gear.equip.length) gear = null;
      if (multi) {
        /* 模擬盤先顯示使用中的構築（有的話），否則顯示計畫裡的第一個 */
        if (!multi[page]) page = multi[S.gp] ? S.gp : +Object.keys(multi)[0];
        gems = multi[page];
      } else if (single != null) {
        miss = parseGems(single);
      } else {
        gems = load(page);
      }
      refresh();
      if (miss.length) uiAlert('有 ' + miss.length + ' 項放不上去（沒有這顆寶石，或位置超出、重疊、尚未解鎖）：' + miss.join('、'));
    };

    /* 把一份配置寫進某個構築：使用中的直接改寶石位置，其他的只改快照。回傳放不下的數量 */
    const writeLayout = (p, list) => {
      if (p !== S.gp) { S.gpages[p] = list.map(g => [g.u, g.x, g.y, g.rot]); return 0; }
      let miss = 0;
      for (const g of S.gems) g.x = g.y = -1;
      for (const c of list) {
        const g = S.gems.find(o => o.u === c.u);
        if (g && canPlace(g, c.x, c.y, c.rot)) { g.x = c.x; g.y = c.y; g.rot = c.rot; } else { miss++; }
      }
      ui.selGem = null; ui.ghost = null;
      return miss;
    };

    /* 把模擬盤（或匯入的多構築計畫）寫回存檔 */
    const apply = async () => {
      if (multi && multi[page]) multi[page] = gems;
      const lists = multi ? multi : { [page]: gems };
      const pages = Object.keys(lists).map(Number);
      if (pages.some(p => lists[p].some(g => gemCells(g).some(([x, y]) => !realOpen.has(x + ',' + y))))) {
        uiAlert('有寶石放在尚未解鎖的格子上，無法套用。請先移開，或取消「預覽全部 36 格」。');
        return;
      }
      /* 要寫入的配置是空的、而那個構築原本有寶石：很可能是誤操作，先問清楚 */
      const emptied = pages.filter(p => !lists[p].length && load(p).length);
      if (emptied.length && !await uiConfirm('構築 ' + emptied.map(p => p + 1).join('、') + ' 的模擬盤是空的，套用後那個構築的寶石會全部被取下。\n\n確定要這樣做嗎？')) return;
      /* 執行匯入的計畫前先自動備份一份，做錯了可以到「存檔備份」還原 */
      if (CFG.autoBackup && (gear || multi)) { saveNow(); backupNow('套用計畫前自動備份'); }
      /* 有裝備計畫就先做（使用者取消或檢查沒過就整個不套用）；沒有裝備計畫的多構築寫入也先確認 */
      if (gear) { if (!(await runGear())) { refresh(); return; } }
      else if (multi && !await uiConfirm('即將執行：\n\n' + planLines().join('\n') + '\n\n確定執行？')) return;

      let miss = 0;
      for (const p of pages) {
        miss += writeLayout(p, lists[p]);
        /* 多構築計畫：其他構築的裝備、天賦、神器照抄使用中的構築 */
        if (multi && p !== S.gp) S.bld[p] = { eq: Object.assign({}, eqOf(S.gp)), asc: S.tal.asc, p: [...S.tal.p], art: S.art.on };
      }
      if (pages.includes(S.gp)) afterGrid(); else markDirty();
      saveNow();
      ui.render();
      close();
      toast('已套用到構築 ' + pages.map(p => p + 1).join('、') + (miss ? '（' + miss + ' 顆放不下）' : ''), 'lvl');
    };

    const cellOf = e => { const c = e.target.closest('[data-x]'); return c ? [+c.dataset.x, +c.dataset.y] : null; };
    elGrid.addEventListener('mousemove', e => {
      const c = cellOf(e);
      if (String(c) !== String(hover)) { hover = c; if (held) drawGrid(); }
    });
    elGrid.addEventListener('mouseleave', () => { hover = null; if (held) drawGrid(); });
    elGrid.addEventListener('click', e => {
      const c = cellOf(e); if (!c) return;
      if (held) {
        if (!fits(held, c[0], c[1])) return;
        held.x = c[0]; held.y = c[1]; gems.push(held); held = null;
      } else {
        const g = occupied().get(c[0] + ',' + c[1]); if (!g) return;
        gems = gems.filter(o => o !== g); held = g; hover = c;
      }
      refresh();
    });
    elGrid.addEventListener('contextmenu', e => {
      e.preventDefault();
      const c = cellOf(e); if (!c) return;
      const g = occupied().get(c[0] + ',' + c[1]); if (!g) return;
      gems = gems.filter(o => o !== g); refresh();
    });
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { close(); return; }
      if (a === 'apply') { apply(); return; }
      if (a === 'open') { allOpen = b.checked; drawGrid(); return; }
      if (a === 'rot') { rotate(); return; }
      if (a === 'sug') {
        if (page !== S.gp) { uiAlert('建議配裝是用目前穿著的裝備來比較，請先把「套用到構築」切到使用中的構築。'); return; }
        if (!sugOpt) {
          const sl = {};
          for (const s of SLOTS) sl[s] = true;
          sugOpt = { slots: sl, minHp: Math.floor(PS.maxhp), keepArm: true, sock: false };
        }
        sugRes = null; drawSug(); return;
      }
      if (a === 'auto') {
        if (!autoOpt) autoOpt = { oneAct: !!(PS.U && PS.U.kingr), noSacr: false, noCot: false, secs: 6, busy: false };
        autoMsg = ''; drawAuto(); return;
      }
      if (a === 'autoClose') { autoRun++; autoOpt = null; autoMsg = ''; drawAuto(); return; }
      if (a === 'autoStop') { autoRun++; autoOpt.busy = false; autoMsg = '已停止，盤面沒有變更。'; drawAuto(); return; }
      if (a === 'autoUndo') { if (autoUndo) { gems = autoUndo; autoUndo = null; held = null; autoMsg = '已復原。'; refresh(); drawAuto(); } return; }
      if (a === 'autoRun') {
        readAuto();
        const before = fixOf(gems), prev = gems;
        const label = fixBad ? '面板 DPS ' : '修正後估計 ';
        held = null;
        autoOpt.busy = true; autoMsg = '計算中… 0%'; drawAuto();
        autoSolve(autoOpt, (frac, d) => {
          autoMsg = '計算中… ' + Math.round(frac * 100) + '%　目前最好：' + fmt(Math.round(d));
          drawAuto();
        }, best => {
          const after = fixOf(best);
          autoOpt.busy = false;
          if (after > before * 1.0001) {
            autoUndo = prev; gems = best;
            autoMsg = '找到更好的排法：' + label + fmt(Math.round(before)) + ' → <b style="color:#ffd84a">' + fmt(Math.round(after)) + '</b>（+' + ((after / (before || 1) - 1) * 100).toFixed(1) + '%），已放到模擬盤。';
          } else {
            autoMsg = '沒有找到比目前模擬盤更好的排法（' + label + fmt(Math.round(before)) + '）。';
          }
          refresh(); drawAuto();
        });
        return;
      }
      if (a === 'sugClose') { sugOpt = null; sugRes = null; drawSug(); return; }
      if (a === 'sugRun') {
        readSug();
        if (page !== S.gp) { uiAlert('請先把「套用到構築」切到使用中的構築。'); return; }
        sugRes = 'busy'; drawSug();
        /* 先讓「計算中」畫出來再開始算 */
        setTimeout(() => {
          const cur = withGems(gems, () => calc());
          const r = suggest({ slots: sugOpt.slots, minHp: sugOpt.minHp, minArm: sugOpt.keepArm && cur ? cur.armRed : 0, sock: sugOpt.sock });
          sugRes = r || 'fail'; drawSug();
        }, 30);
        return;
      }
      if (a === 'sugUse') {
        if (!sugRes || !sugRes.changes) return;
        gear = { fuse: sugRes.changes.filter(c => c.fuse).map(c => ({ u: c.fuse.u, runes: c.fuse.runes.slice() })), equip: sugRes.changes.map(c => c.u) };
        sugOpt = null; sugRes = null; drawSug(); drawGear(); return;
      }
      if (a === 'page') {
        /* 多構築計畫中切換分頁：先把目前盤面存回計畫，再顯示另一個構築的計畫內容 */
        if (multi && multi[page]) multi[page] = gems;
        page = +b.dataset.v;
        gems = multi && multi[page] ? multi[page] : load(page);
        held = null;
      }
      if (a === 'reset') { gems = load(page); held = null; }
      if (a === 'cpGems') { gems = load(src); held = null; }
      if (a === 'cpEquip') { copyEquip(); return; }
      if (a === 'gearClear') { gear = null; multi = null; drawGear(); return; }
      if (a === 'exp') {
        const code = exportCode();
        try { navigator.clipboard.writeText(code); } catch (err) {}
        await uiPrompt('配置代碼（已嘗試複製到剪貼簿，也可以在這裡全選複製）', code, true);
        return;
      }
      if (a === 'imp') {
        const code = await uiPrompt('貼上配置代碼。匯入後只會改模擬盤和顯示裝備計畫，按「確定並套用」才寫入存檔。', '', true);
        if (code) importCode(code);
        return;
      }
      if (a === 'clear') { gems = []; held = null; }
      if (a === 'drop') { held = null; }
      if (a === 'pick') { const g = S.gems.find(o => String(o.u) === b.dataset.u); if (g) held = clone(g, -1, -1, 0); }
      refresh();
    });

    root.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.r === 'src') src = +e.target.value; });

    refresh();
  };

  /* ===== 5. 物品管理 =====
   * 分頁列出裝備、石板、符文、技能寶石，可用關鍵字與數值比較搜尋，再批次分解／鎖定／解鎖。
   * 每種物品在 KINDS 裡有一組設定（怎麼列出、怎麼顯示、什麼情況不能分解、怎麼分解），
   * 要加新種類或改顯示內容，改 KINDS 就好。
   * 分解的做法都照遊戲自己的按鈕：裝備呼叫 salvage()，石板加 slateAsh()，符文加 runeAsh()，
   * 變異寶石加 MUT.ash；一般技能寶石在遊戲裡本來就不能分解。
   * 物品結構：ilvl 等級、rar 稀有度、af 詞綴陣列（a 詞綴代號、v 數值、t 階級，數字越小越好）、
   *          uq 獨特代號、my 神話獨特、sock 插槽、lk 已鎖定、wd 武器數值、arm／eva 基礎護甲閃避；
   *          石板另有 b 種類、v 主數值、dg 危險詞綴；符文只有一條 a／t／v 或 uq；
   *          技能寶石有 id、x／y（小於 0 代表沒放）、sh（變異形狀）。
   */
  const openItems = () => {
    if (document.querySelector('#awItems')) return;
    if (typeof S === 'undefined' || !S || !S.bag) { uiAlert('請先進入遊戲再開啟物品管理'); return; }

    const BTN = 'padding:2px 8px;cursor:pointer';
    const esc2 = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const isWorn = it => SLOTS.some(s => S.equip[s] === it);
    /* 已經插在地圖上的石板 */
    const slotted = () => {
      const out = [];
      for (const k in (S.slt || {})) for (const sl of ((S.slt[k] && S.slt[k].s) || [])) if (sl) out.push(sl);
      return out;
    };
    const isSlotted = it => slotted().includes(it);
    const afText = a => { try { return (a.t != null ? 'T' + a.t + ' ' : '') + AFFIX[a.a].f(a.v); } catch (e) { return ''; } };
    const uqLine = it => { try { return '獨特：' + uqText(it.uq, it.cm || 1); } catch (e) { return ''; } };

    const KINDS = {
      equip: {
        label: '裝備',
        all: () => [...SLOTS.map(s => S.equip[s]).filter(Boolean), ...S.bag],
        name: it => itemName(it),
        color: it => rarColor(it),
        meta: it => rarLabel(it) + '・' + (SLOT_NAME[it.slot] || '') + '・LV' + it.ilvl,
        tags: it => [isWorn(it) ? '裝備中' : '背包', it.lk ? '已鎖定' : '未鎖定'],
        af: it => it.af || [],
        lines: it => {
          const out = [];
          if (it.wd) out.push('傷害 ' + it.wd[0] + '-' + it.wd[1] + '・攻速 ' + it.wd[2] + '・暴擊 ' + it.wd[3] + '%');
          if (it.arm) out.push('護甲 ' + it.arm);
          if (it.eva) out.push('閃避 ' + it.eva);
          if (it.sock) out.push('插槽 ' + it.sock.n + ' 孔');
          if (it.uq) out.push(uqLine(it));
          for (const a of (it.af || [])) out.push(afText(a));
          return out;
        },
        /* 回傳不能分解的原因；空字串代表可以分解 */
        prot: it => isWorn(it) ? '裝備中' : it.lk ? '已鎖定' : it.my ? '神話獨特' : '',
        ash: it => salvageValue(it),
        rank: it => it.my ? 7 : it.uq ? 6 : it.sock ? 5 : it.rar,
        group: it => SLOTS.indexOf(it.slot),
        remove: list => { let n = 0; for (const it of list) if (salvage(it.u) >= 0) n++; return n; },
        lock: true,
        equip: true
      },
      slate: {
        label: '石板',
        all: () => [...slotted(), ...(S.slates || [])],
        name: it => it.name || SLATE[it.b].n,
        color: it => rarColor(it),
        meta: it => rarLabel(it) + '・石板・LV' + it.ilvl,
        tags: it => [isSlotted(it) ? '使用中' : '未使用', it.lk ? '已鎖定' : '未鎖定'],
        af: it => slLines(it),
        lines: it => {
          const out = [SLATE[it.b].f(it.v)];
          if (it.sock) out.push('插槽 ' + it.sock.n + ' 孔');
          for (const a of (it.af || [])) out.push(afText(a));
          for (const a of (it.dg || [])) out.push('危險 ' + afText(a));
          return out;
        },
        prot: it => isSlotted(it) ? '使用中' : it.lk ? '已鎖定' : it.my ? '神話獨特' : '',
        ash: it => slateAsh(it),
        rank: it => it.my ? 7 : it.sock ? 5 : it.rar,
        group: it => it.b,
        remove: list => {
          for (const it of list) S.ash += slateAsh(it);
          S.slates = S.slates.filter(o => !list.includes(o));
          return list.length;
        }
      },
      rune: {
        label: '符文',
        all: () => S.runes || [],
        name: it => it.uq ? UNIQUE[it.uq].n : AFFIX[it.a].n,
        color: it => it.uq ? '#ff5a82' : '#f0e6d2',
        meta: it => it.uq ? '獨特效果符文' : (isSlateAf(it.a) ? '石板詞綴符文' : '符文石') + '・T' + it.t,
        tags: it => [isStaged(it.u) ? '已放入插槽' : '未使用'],
        af: it => it.a ? [it] : [],
        lines: it => it.uq ? [uqLine(it)] : [afText(it)],
        prot: it => isStaged(it.u) ? '已放入插槽' : '',
        ash: it => runeAsh(it),
        rank: it => it.uq ? 99 : 20 - it.t,
        group: it => it.uq ? '~' : AFFIX[it.a].n,
        remove: list => {
          for (const it of list) S.ash += runeAsh(it);
          S.runes = S.runes.filter(o => !list.includes(o));
          return list.length;
        }
      },
      gem: {
        label: '技能寶石',
        all: () => S.gems || [],
        name: it => SKILLS[it.id].n + (it.sh ? '（變異）' : ''),
        color: it => SKILLS[it.id].col,
        meta: it => (SKILLS[it.id].leg ? '傳說・' : '') + (SKILLS[it.id].act ? '主動技能' : '輔助寶石'),
        tags: it => [it.x >= 0 ? '配置中' : '未配置', it.sh ? '變異' : '一般'],
        af: () => [],
        lines: it => [SKILLS[it.id].d || ''],
        prot: it => it.x >= 0 ? '配置中' : !it.sh ? '一般寶石不能分解' : '',
        ash: it => it.sh ? MUT.ash : 0,
        rank: it => (SKILLS[it.id].leg ? 4 : 0) + (it.sh ? 2 : 0) + (SKILLS[it.id].act ? 1 : 0),
        group: it => SKILLS[it.id].n,
        remove: list => {
          for (const it of list) {
            const i = S.gems.indexOf(it);
            if (i >= 0) { S.ash += MUT.ash; S.gems.splice(i, 1); }
          }
          ui.selGem = null;
          return list.length;
        }
      }
    };

    let kind = 'equip';
    let K = KINDS[kind];
    const sel = new Set();
    let kw = '';
    let sort = 'rar';

    const textOf = it => [K.name(it), K.meta(it), ...K.tags(it), ...K.lines(it)].join(' ').toLowerCase();

    /* 數值比較：欄位 運算子 數字，例如 暴擊率>8、等級>=60、T<=2 */
    const compare = (it, field, op, num) => {
      const cmp = v => op === '>' ? v > num : op === '<' ? v < num : op === '>=' ? v >= num : op === '<=' ? v <= num : v === num;
      const f = field.toLowerCase();
      const af = K.af(it);
      if (f === 'lv' || f === '等級') return cmp(it.ilvl || 0);
      if (f === '灰燼') return cmp(K.ash(it));
      if (f === '詞綴數') return cmp(af.length);
      if (f === '孔' || f === '插槽') return cmp(it.sock ? it.sock.n : 0);
      if (f === '基礎護甲') return cmp(it.arm || 0);
      if (f === '基礎閃避') return cmp(it.eva || 0);
      if (f === '武器傷害上限') return !!it.wd && cmp(it.wd[1]);
      if (f === 't' || f === '階級') return af.some(a => a.t != null && cmp(a.t));
      /* 其餘當成詞綴名稱：有完全同名的詞綴就只比那一種，否則比名稱或文字包含這個詞的詞綴 */
      const exact = Object.keys(AFFIX).some(k => AFFIX[k].n.toLowerCase() === f);
      return af.some(a => {
        const d = AFFIX[a.a]; if (!d) return false;
        const hit = exact ? d.n.toLowerCase() === f : (d.n.toLowerCase().includes(f) || String(d.f(a.v)).toLowerCase().includes(f));
        return hit && cmp(a.v);
      });
    };

    /* 關鍵字：空白分隔代表全部都要符合；前面加減號代表排除；含比較符號的當成數值條件 */
    const CMP_RE = /^(.+?)(>=|<=|>|<|=)(-?\d+(?:\.\d+)?)$/;
    const match = it => {
      const toks = kw.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!toks.length) return true;
      const text = textOf(it);
      return toks.every(tok => {
        const neg = tok[0] === '-' && tok.length > 1;
        const t = neg ? tok.slice(1) : tok;
        const m = CMP_RE.exec(t);
        const ok = m ? compare(it, m[1], m[2], +m[3]) : text.includes(t);
        return neg ? !ok : ok;
      });
    };
    const byGroup = (a, b) => String(K.group(a)).localeCompare(String(K.group(b)), undefined, { numeric: true });
    const shown = () => {
      const list = K.all().filter(match);
      if (sort === 'rar') list.sort((a, b) => K.rank(b) - K.rank(a) || (b.ilvl || 0) - (a.ilvl || 0));
      if (sort === 'lv') list.sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0) || K.rank(b) - K.rank(a));
      if (sort === 'slot') list.sort((a, b) => byGroup(a, b) || K.rank(b) - K.rank(a));
      return list;
    };

    const root = document.createElement('div');
    root.id = 'awItems';
    root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font:13px/1.5 sans-serif;color:#f0e6d2';
    root.innerHTML =
      '<div style="background:#2a2118;border:2px solid #6a5a4a;border-radius:6px;padding:12px;box-sizing:border-box;width:min(760px,96vw);max-height:94%;display:flex;flex-direction:column">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<b style="font-size:15px;white-space:nowrap">物品管理</b><span data-r="tabs"></span><span style="flex:1"></span>' +
          '<button data-a="rules" style="' + BTN + '">拾取規則</button>' +
          '<button data-a="close" style="' + BTN + '">關閉</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<input data-r="kw" placeholder="例如：戒指 暴擊率>8 等級>=60 -已鎖定" style="flex:1;min-width:160px;padding:4px 6px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a">' +
          '<select data-r="sort" style="padding:3px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a">' +
            '<option value="rar">依稀有度／階級</option><option value="lv">依等級</option><option value="slot">依種類</option><option value="new">原本順序</option></select>' +
        '</div>' +
        '<div data-r="bar" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap"></div>' +
        '<div data-r="sum" style="color:#a89a84;margin-bottom:4px"></div>' +
        '<div data-r="list" style="overflow:auto;flex:1;min-height:120px;background:#1a1410"></div>' +
        /* 搜尋說明：畫面矮（手機）時預設收起來，把空間留給清單 */
        '<details' + (window.innerHeight >= 700 ? ' open' : '') + ' style="color:#a89a84;font-size:12px;margin-top:4px"><summary style="cursor:pointer">搜尋說明</summary>' +
          '空白分隔多個條件（全部都要符合），前面加 - 代表排除。<br>' +
          '文字：名稱、部位、稀有度、詞綴文字，以及裝備中、已鎖定、使用中、配置中、變異等狀態。<br>' +
          '數值：詞綴名稱或 等級／LV、T（階級，越小越好）、灰燼、詞綴數、孔、基礎護甲、基礎閃避、武器傷害上限，後面接 &gt; &lt; &gt;= &lt;= = 和數字。' +
        '</details>' +
      '</div>';
    document.body.appendChild(root);
    const q = k => root.querySelector('[data-r="' + k + '"]');
    const elList = q('list'), elSum = q('sum'), elKw = q('kw'), elTabs = q('tabs'), elBar = q('bar');

    const draw = () => {
      elTabs.innerHTML = Object.keys(KINDS).map(k =>
        '<button data-a="tab" data-v="' + k + '" style="' + BTN + ';margin-left:3px;' +
        (k === kind ? 'background:#ffd84a;color:#2a2118;font-weight:bold' : '') + '">' + KINDS[k].label + ' ' + KINDS[k].all().length + '</button>').join('');
      elBar.innerHTML =
        '<button data-a="all" style="' + BTN + '">全選搜尋結果</button>' +
        '<button data-a="none" style="' + BTN + '">取消全選</button>' +
        '<span style="flex:1"></span>' +
        (K.lock ? '<button data-a="lock" style="' + BTN + '">鎖定選取</button><button data-a="unlock" style="' + BTN + '">解鎖選取</button>' : '') +
        '<button data-a="salv" style="' + BTN + ';background:#c8323c;color:#fff;border:1px solid #000;font-weight:bold">分解選取</button>';

      const everything = K.all();
      const list = shown();
      /* 清掉已經不存在的選取 */
      const alive = new Set(everything.map(it => it.u));
      for (const u of [...sel]) if (!alive.has(u)) sel.delete(u);
      const picked = everything.filter(it => sel.has(it.u));
      const ash = picked.filter(it => !K.prot(it)).reduce((n, it) => n + K.ash(it), 0);
      elSum.innerHTML = '顯示 <b>' + list.length + '</b> / 共 ' + everything.length + ' 件　已選 <b style="color:#ffd84a">' + picked.length + '</b> 件，分解可得灰燼 <b style="color:#ffd84a">' + fmt(ash) + '</b>　目前灰燼 ' + fmt(S.ash);
      elList.innerHTML = list.map(it => {
        const why = K.prot(it);
        return '<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 6px;border-bottom:1px solid #3a3026;' + (sel.has(it.u) ? 'background:#3a3026;' : '') + '">' +
          '<input type="checkbox" data-a="pick" data-u="' + it.u + '"' + (sel.has(it.u) ? ' checked' : '') + ' style="margin-top:3px">' +
          '<div style="flex:1;min-width:0">' +
            '<b style="color:' + K.color(it) + '">' + esc2(K.name(it)) + '</b> ' +
            '<small style="color:#a89a84">' + esc2(K.meta(it)) + '</small>' +
            (why ? ' <small style="color:#ffb070">' + esc2(why) + '</small>' : '') +
            '<div style="color:#c8bca8;font-size:12px">' + K.lines(it).filter(Boolean).map(esc2).join('　') + '</div>' +
          '</div>' +
          '<div style="text-align:right;white-space:nowrap">' + (K.ash(it) ? '<small style="color:#a89a84">灰燼 ' + K.ash(it) + '</small><br>' : '') +
            (K.equip && !isWorn(it) ? '<button data-a="equip" data-u="' + it.u + '" style="' + BTN + '">裝備</button>' : '') + '</div>' +
        '</div>';
      }).join('') || '<div style="padding:12px;color:#a89a84">沒有符合的物品</div>';
    };

    /* ----- 拾取規則（裝備）的匯出／匯入 -----
     * 遊戲的設定存在 S.set：
     *   auto  0／1 的陣列，依序是 普通、魔法、稀有、傳奇、獨特、插槽 要不要自動分解
     *         （插槽是 v0.2.410 才加的第六格，舊格式只有五格也可以）
     *   keep  保留規則的陣列；每條規則 { on: 是否啟用, c: [條件…] }，同一條裡的條件要全部符合，
     *         符合任何一條啟用中的規則就不會被自動分解
     *   xr    批次萃取規則，格式和 keep 一樣，但意思相反：符合任何一條的裝備會被「批次萃取」選中
     *         （神話、已鎖定、神話獨特遊戲本來就不會批次萃取）；代碼裡沒寫 xr 就不動它
     * 條件的寫法（k 是種類）：
     *   any  任何詞綴階級 ≤ t            af   指定詞綴 a 階級 ≤ t（v 是最低數值）
     *   cnt  清單 a 裡的詞綴至少 n 條階級 ≤ t（a 留空代表任何詞綴）
     *   rar  稀有度 ≥ r（0 普通 … 3 傳奇、4 獨特或插槽）
     *   slot 部位在 s 裡    lv 物品等級 ≥ l    dv 神眷詞綴階級 ≤ t    sock 插槽數在 h 裡
     *   uq   獨特裝備；u 是指定的獨特代號清單，留空代表任何獨特（v0.2.415 起可以指定）
     *   條件加上 not: 1 代表反過來
     * 神話裝備、神話獨特、插槽裝備本來就不會被自動分解，不用寫規則。 */
    const RAR5 = ['普通', '魔法', '稀有', '傳奇', '獨特', '插槽'];
    const afName = a => (AFFIX[a] ? AFFIX[a].n : a);
    const condText = c => {
      const tier = 'T' + c.t + ' 以上';
      let t = '';
      if (c.k === 'any') t = '有任何 ' + tier + ' 的詞綴';
      else if (c.k === 'af') t = '有 ' + tier + ' 的「' + afName(c.a) + '」' + (c.v > 0 ? '（數值 ≥ ' + c.v + '）' : '');
      else if (c.k === 'cnt') t = '至少 ' + (c.n || 1) + ' 條 ' + tier + ' 的詞綴' + (c.a && c.a.length ? '，限：' + c.a.map(afName).join('、') : '');
      else if (c.k === 'rar') t = '稀有度 ≥ ' + (['普通', '魔法', '稀有', '傳奇', '獨特／插槽'][c.r] || c.r);
      else if (c.k === 'slot') t = '部位是 ' + (c.s || []).map(x => SLOT_NAME[x] || x).join('、');
      else if (c.k === 'lv') t = '物品等級 ≥ ' + c.l;
      else if (c.k === 'uq') t = '獨特裝備' + (c.u && c.u.length ? '：' + c.u.map(x => (UNIQUE[x] ? UNIQUE[x].n : x)).join('、') : '（任何一件）');
      else if (c.k === 'dv') t = '有 T' + (c.t == null ? 99 : c.t) + ' 以上的神眷詞綴';
      else if (c.k === 'sock') t = '插槽裝備' + (c.h ? '（' + c.h.join('／') + ' 孔）' : '');
      else t = '（不認得的條件 ' + c.k + '）';
      return (c.not ? '不是：' : '') + t;
    };
    const rulesText = r => {
      const out = ['自動分解：' + (RAR5.filter((_, i) => r.auto[i]).join('、') || '都不分解'), '', '保留規則（符合任何一條就留下）：'];
      r.keep.forEach((g, i) => out.push((i + 1) + '. ' + (g.on ? '' : '［停用］') + g.c.map(condText).join(' 而且 ')));
      if (!r.keep.length) out.push('（沒有）');
      if (r.xr) {
        out.push('', '批次萃取規則（符合任何一條就會被萃取；神話、已鎖定的不會）：');
        r.xr.forEach((g, i) => out.push((i + 1) + '. ' + (g.on ? '' : '［停用］') + g.c.map(condText).join(' 而且 ')));
        if (!r.xr.length) out.push('（沒有）');
      }
      return out.join('\n');
    };
    /* 檢查匯入的內容，回傳錯誤訊息；空字串代表沒問題 */
    const rulesCheck = r => {
      if (!r || !Array.isArray(r.auto) || r.auto.length < 5 || r.auto.length > 6 || !Array.isArray(r.keep)) return '格式不對，要有 auto（5 或 6 個數字）和 keep（陣列）';
      if (r.xr != null && !Array.isArray(r.xr)) return 'xr（萃取規則）要是陣列';
      if (r.keep.length > KEEP_MAXG || (r.xr || []).length > KEEP_MAXG) return '每一組規則最多 ' + KEEP_MAXG + ' 條';
      for (const g of r.keep.concat(r.xr || [])) {
        if (!g || !Array.isArray(g.c) || !g.c.length) return '每條規則都要有條件';
        if (g.c.length > KEEP_MAXC) return '每條規則最多 ' + KEEP_MAXC + ' 個條件';
        for (const c of g.c) {
          if (!c || !KEEP_K[c.k]) return '不認得的條件種類：' + (c && c.k);
          const ids = c.k === 'af' ? [c.a] : c.k === 'cnt' ? (c.a || []) : [];
          for (const id of ids) if (!AFFIX[id]) return '不認得的詞綴代號：' + id;
          if (c.k === 'uq') for (const id of (c.u || [])) if (!UNIQUE[id]) return '不認得的獨特裝備代號：' + id;
        }
      }
      return '';
    };
    const editRules = async () => {
      const cur = JSON.stringify({ auto: S.set.auto, keep: S.set.keep || [], xr: S.set.xr || [] });
      const text = await uiPrompt('裝備的拾取規則。\n這一串就是目前的設定（可以複製起來備份）；要改的話貼上新的再按確定，按取消就不變。', cur, true);
      if (text == null || text.trim() === cur) return;
      let r = null;
      try { r = JSON.parse(text); } catch (e) {}
      const err = rulesCheck(r);
      if (err) { uiAlert('沒有套用：' + err); return; }
      r = { auto: r.auto.map(x => (x ? 1 : 0)), keep: r.keep.map(g => ({ on: g.on ? 1 : 0, c: g.c })), xr: r.xr ? r.xr.map(g => ({ on: g.on ? 1 : 0, c: g.c })) : null };
      if (!await uiConfirm('要把裝備的規則改成這樣嗎？\n\n' + rulesText(r) + '\n\n之後撿到不符合保留規則、又在自動分解範圍內的裝備會直接變成灰燼。' + (r.xr ? '' : '\n（這串沒有帶萃取規則，萃取規則維持原樣）'))) return;
      backupNow('改拾取規則前自動備份');
      S.set.auto = r.auto;
      S.set.keep = r.keep;
      if (r.xr) S.set.xr = r.xr;
      markDirty(); saveNow(); ui.render();
      toast('拾取規則已更新', 'lvl');
    };

    const done = () => { recalc(); markDirty(); saveNow(); ui.render(); draw(); };
    const close = () => { root.remove(); };
    root.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
    elKw.addEventListener('input', () => { kw = elKw.value; draw(); });
    q('sort').addEventListener('change', e => { sort = e.target.value; draw(); });
    root.addEventListener('change', e => {
      const b = e.target.closest('[data-a="pick"]'); if (!b) return;
      const u = +b.dataset.u;
      if (b.checked) sel.add(u); else sel.delete(u);
      draw();
    });
    root.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a;
      const picked = () => K.all().filter(it => sel.has(it.u));
      if (a === 'close') { close(); return; }
      if (a === 'rules') { editRules(); return; }
      if (a === 'tab') { kind = b.dataset.v; K = KINDS[kind]; sel.clear(); draw(); return; }
      if (a === 'all') { for (const it of shown()) sel.add(it.u); draw(); return; }
      if (a === 'none') { sel.clear(); draw(); return; }
      if (a === 'lock') { for (const it of picked()) it.lk = 1; done(); return; }
      if (a === 'unlock') { for (const it of picked()) delete it.lk; done(); return; }
      if (a === 'equip') { equipItem(b.dataset.u); saveNow(); ui.render(); draw(); return; }
      if (a === 'salv') {
        const list = picked().filter(it => !K.prot(it));
        const skip = picked().length - list.length;
        if (!list.length) { uiAlert('選取的物品都不能分解（裝備中、使用中、配置中、已鎖定、神話獨特、一般技能寶石都會跳過）'); return; }
        const ash = list.reduce((n, it) => n + K.ash(it), 0);
        if (!await uiConfirm('確定分解 ' + list.length + ' 件' + K.label + '？可得 ' + ash + ' 符文灰燼。' + (skip ? ' 另有 ' + skip + ' 件不能分解，會跳過。' : '') + ' 分解後無法復原。')) return;
        const n = K.remove(list);
        sel.clear();
        done();
        toast('已分解 ' + n + ' 件，獲得 ' + ash + ' 符文灰燼', 'lvl');
      }
    });

    draw();
    elKw.focus();
  };

  /* ===== 6. 生命來源明細 =====
   * 在「角色」分頁的「最大生命」下面多顯示一行算式和各項來源。
   * 遊戲的算式：最大生命 = (職業基礎 + 固定生命) × (1 + 生命%) × 獨立乘區 + 護甲轉生命
   *   職業基礎 = (60 + 13 × 等級) × 職業係數
   * 來源取自 PS.mods（每筆有 s 屬性、v 數值、src 來源、x 為 more 代表獨立乘區）。
   */
  if (first && CFG.hpDetail) {
    const num = v => String(Math.round(v * 10) / 10);
    const build = () => {
      const base = (60 + 13 * S.lvl) * CLASS[S.cls].hp;
      const group = (stat, more) => {
        const m = {};
        for (const e of PS.mods) {
          if (e.s !== stat || !e.v || (more ? e.x !== 'more' : !!e.x)) continue;
          const n = srcName(e.src);
          m[n] = (m[n] || 0) + e.v;
        }
        return m;
      };
      const flat = group('life'), pct = group('lifep'), more = group('life', true);
      const flatSum = PS.st.life || 0, pctSum = PS.st.lifep || 0;
      const moreMul = Object.keys(more).reduce((a, k) => a * (1 + more[k] / 100), 1);
      const core = (base + flatSum) * (1 + pctSum / 100) * moreMul;
      const extra = PS.maxhp - Math.round(core);
      const list = (o, f) => Object.keys(o).map(k => k + ' ' + f(o[k])).join('・');
      const C = 'color:#a89a84';
      let h = '<b>(' + num(base) + ' + ' + num(flatSum) + ') × (1 + ' + num(pctSum) + '%)' +
        (moreMul !== 1 ? ' × ' + num(moreMul * 100) / 100 : '') +
        (Math.abs(extra) > 1 ? ' + ' + extra : '') + ' = ' + PS.maxhp + '</b>';
      h += '<div style="' + C + '">職業基礎 ' + num(base) + '：(60 + 13 × 等級 ' + S.lvl + ') × 職業係數 ' + CLASS[S.cls].hp + '</div>';
      if (flatSum) h += '<div style="' + C + '">固定生命 ' + num(flatSum) + '：' + list(flat, v => '+' + num(v)) + '</div>';
      if (pctSum) h += '<div style="' + C + '">生命% ' + num(pctSum) + '%：' + list(pct, v => '+' + num(v) + '%') + '</div>';
      if (moreMul !== 1) h += '<div style="' + C + '">獨立乘區：' + list(more, v => '×' + num(100 + v) / 100) + '</div>';
      if (Math.abs(extra) > 1) h += '<div style="' + C + '">護甲轉生命（血肉堡壘）：+' + extra + '</div>';
      return h;
    };

    setInterval(() => {
      if (typeof S === 'undefined' || !S || !PS || !PS.mods) return;
      for (const dt of document.querySelectorAll('#panel dl.kv dt')) {
        if (dt.textContent.trim() !== '最大生命') continue;
        const dd = dt.nextElementSibling;
        if (!dd) continue;
        let box = dd.nextElementSibling;
        if (!box || !box.classList.contains('awhp')) {
          box = document.createElement('div');
          box.className = 'awhp';
          box.style.cssText = 'grid-column:1/-1;font-size:' + CFG.hpFont + 'px;line-height:1.5;padding:2px 0 4px;text-align:left';
          dd.after(box);
        }
        let html;
        try { html = build(); } catch (e) { continue; }
        if (box.__h !== html) { box.__h = html; box.innerHTML = html; }
      }
    }, CFG.hpRefreshMs);
  }

  /* ===== 7. 存檔備份 =====
   * 備份：把整個存檔物件 S 轉成文字，存一份在瀏覽器（localStorage 的 awtools.backups），也可以下載成檔案。
   * 還原：把備份寫回遊戲的存檔位置（SAVE_KEY），再重新整理頁面讓遊戲重新載入。
   *   - 寫回前把 TAB.gone 設為 true，遊戲離開頁面時的自動存檔就不會把備份蓋掉。
   *   - 把備份裡的時間改成現在，這樣重新載入時不會被當成離線很久而發放離線收益，
   *     也不會被比較舊的雲端存檔蓋回去。
   *   - 還原前會先把目前的進度自動備份一份，還原錯了可以再還原回來。
   * 瀏覽器裡的備份只留最新的幾份（CFG.backupKeep），清除瀏覽器資料時會一起消失，重要的請下載成檔案。
   * 共用倉庫（遊戲 v0.2.730 起）另外存在 STASH_KEY（autowanderer.stash），裡面有倉庫物品、離線角色的灰燼／材料，
   * 以及配合存檔序號 S.sx 的異動紀錄。備份時一起存一份（瀏覽器備份放在 stash 欄位，下載的檔案放在 awStash 欄位，
   * 配裝程式讀檔時會忽略它），還原時另外問要不要連倉庫一起還原。
   */
  const BK_KEY = 'awtools.backups';
  const EXTRA_BAK = 'autowanderer.v1.bak-claude';
  const STASH_LS = typeof STASH_KEY === 'string' ? STASH_KEY : 'autowanderer.stash';
  const stashRaw = () => { try { return localStorage.getItem(STASH_LS); } catch (e) { return null; } };
  const stashN = raw => { try { const o = JSON.parse(raw); return o && Array.isArray(o.it) ? o.it.length : 0; } catch (e) { return 0; } };
  /* 下載用的文字：存檔本身，有倉庫的話多一個 awStash 欄位 */
  const bkFile = (data, stash) => {
    if (!stash) return data;
    try { const o = JSON.parse(data); o.awStash = JSON.parse(stash); return JSON.stringify(o); } catch (e) { return data; }
  };
  const bkList = () => { try { return JSON.parse(localStorage.getItem(BK_KEY)) || []; } catch (e) { return []; } };
  const bkSave = list => {
    try { localStorage.setItem(BK_KEY, JSON.stringify(list)); return true; }
    catch (e) { uiAlert('瀏覽器的儲存空間不夠，備份沒有存成功。請先刪掉舊的備份，或改用下載成檔案。'); return false; }
  };
  const bkStamp = t => {
    const d = new Date(t), z = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
  };
  /* 把目前的進度備份到瀏覽器裡，回傳是否成功 */
  const backupNow = label => {
    if (typeof S === 'undefined' || !S) return false;
    const list = bkList();
    const e = { t: Date.now(), label: label || '手動備份', name: S.name || '', lvl: S.lvl, data: JSON.stringify(S) };
    const st = stashRaw();
    if (st) e.stash = st;
    list.unshift(e);
    return bkSave(list.slice(0, CFG.backupKeep));
  };
  const bkDownload = (text, name, lvl, t) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = 'auto-wanderer_' + (name || 'save') + '_LV' + lvl + '_' + bkStamp(t).replace(/[: ]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  /* 用一份備份文字還原存檔，成功的話頁面會重新整理 */
  /* stash：瀏覽器備份裡的倉庫文字；從檔案還原時改讀檔案裡的 awStash 欄位 */
  const restoreSave = async (text, when, stash) => {
    let o = null;
    try { o = JSON.parse(text); } catch (e) {}
    if (!o || !o.cls || !Array.isArray(o.gems) || !Array.isArray(o.bag)) { uiAlert('這不是有效的自走勇者存檔。'); return; }
    if (o.awStash) { if (!stash && typeof o.awStash === 'object') stash = JSON.stringify(o.awStash); delete o.awStash; }
    if (!await uiConfirm('要還原成這份存檔嗎？\n\n角色：' + (o.name || '（未命名）') + '　LV' + o.lvl + (when ? '\n備份時間：' + when : '') +
      '\n\n目前的進度會被覆蓋（還原前會先自動備份一份），頁面會重新整理。')) return;
    let withStash = false;
    if (stash && stash !== stashRaw()) {
      withStash = await uiConfirm('這份備份裡也有共用倉庫（' + stashN(stash) + ' 件，現在倉庫有 ' + stashN(stashRaw()) + ' 件）。\n\n' +
        '要連倉庫一起還原嗎？\n・按「確定」（建議）：倉庫也回到備份時的樣子，和這個角色對得起來；但其他角色在備份之後存進倉庫的東西會不見\n' +
        '・按「取消」：只還原這個角色，倉庫維持現在的樣子；備份之後從倉庫拿到這個角色身上的東西會不見，存進倉庫的則會變成兩份');
    }
    if (!backupNow('還原前自動備份') && !await uiConfirm('目前的進度沒有備份成功，仍然要還原嗎？')) return;
    o.t = Date.now();
    TAB.gone = true;
    const oldStash = stashRaw();
    try {
      if (withStash) localStorage.setItem(STASH_LS, stash);
      localStorage.setItem(SAVE_KEY, JSON.stringify(o));
    } catch (e) {
      try { if (withStash && oldStash !== null) localStorage.setItem(STASH_LS, oldStash); } catch (e2) {}
      TAB.gone = false; uiAlert('寫入存檔失敗，沒有還原。'); return;
    }
    location.reload();
  };

  const openBackup = () => {
    if (document.querySelector('#awBackup')) return;
    if (typeof S === 'undefined' || !S) { uiAlert('請先進入遊戲再開啟存檔備份'); return; }
    const BTN = 'padding:2px 8px;cursor:pointer';
    const root = document.createElement('div');
    root.id = 'awBackup';
    root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font:13px/1.5 sans-serif;color:#f0e6d2';
    root.innerHTML =
      '<div style="background:#2a2118;border:2px solid #6a5a4a;border-radius:6px;padding:12px;box-sizing:border-box;width:min(560px,96vw);max-height:94%;overflow:auto">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<b style="font-size:15px">存檔備份</b><span style="flex:1"></span><button data-a="close" style="' + BTN + '">關閉</button>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
          '<button data-a="save" style="' + BTN + ';font-weight:bold;background:#ffd84a;color:#2a2118;border:1px solid #000">立即備份（存在瀏覽器）</button>' +
          '<button data-a="dlNow" style="' + BTN + '">把目前進度下載成檔案</button>' +
          '<label style="' + BTN + ';border:1px solid #6a5a4a;background:#1a1410">從檔案還原…<input type="file" data-r="file" accept=".json,application/json" style="display:none"></label>' +
        '</div>' +
        '<div data-r="list"></div>' +
        '<div style="color:#a89a84;font-size:12px;margin-top:8px">' +
          '瀏覽器裡最多保留 ' + CFG.backupKeep + ' 份，超過會刪掉最舊的；清除瀏覽器資料時也會一起消失，重要的備份請下載成檔案。<br>' +
          '還原會覆蓋目前的進度並重新整理頁面；還原前會先自動備份目前的進度。<br>' +
          '備份和下載的檔案會連共用倉庫一起存；還原時可以選擇要不要連倉庫一起還原。' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    const elList = root.querySelector('[data-r="list"]');

    const draw = () => {
      const list = bkList();
      elList.innerHTML = list.length ? list.map((b, i) =>
        '<div style="display:flex;gap:8px;align-items:center;padding:4px 6px;border-bottom:1px solid #3a3026;background:#1a1410">' +
          '<div style="flex:1"><b>' + bkStamp(b.t) + '</b> <small style="color:#a89a84">' + String(b.label).replace(/</g, '&lt;') + '</small><br>' +
          '<small style="color:#c8bca8">' + String(b.name || '（未命名）').replace(/</g, '&lt;') + '　LV' + b.lvl + '　' + Math.round((b.data.length + (b.stash ? b.stash.length : 0)) / 1024) + ' KB' +
            (b.stash ? '　含倉庫 ' + stashN(b.stash) + ' 件' : '') + '</small></div>' +
          '<button data-a="restore" data-i="' + i + '" style="' + BTN + '">還原</button>' +
          '<button data-a="dl" data-i="' + i + '" style="' + BTN + '">下載</button>' +
          '<button data-a="del" data-i="' + i + '" style="' + BTN + '">刪除</button>' +
        '</div>').join('') : '<div style="padding:10px;color:#a89a84;background:#1a1410">瀏覽器裡還沒有備份</div>';
      /* 書籤以外留下的臨時備份（例如請 Claude 直接改存檔時，它在修改前留的那一份），列出來讓使用者自己刪 */
      let extra = null;
      try { extra = localStorage.getItem(EXTRA_BAK); } catch (e) {}
      if (extra) {
        elList.innerHTML += '<div style="display:flex;gap:8px;align-items:center;padding:4px 6px;margin-top:6px;border:1px dashed #6a5a4a;background:#1a1410">' +
          '<div style="flex:1"><b>臨時備份</b> <small style="color:#a89a84">Claude 修改存檔前留下的</small><br><small style="color:#c8bca8">' + Math.round(extra.length / 1024) + ' KB</small></div>' +
          '<button data-a="xRestore" style="' + BTN + '">還原</button><button data-a="xDel" style="' + BTN + '">刪除</button></div>';
      }
    };

    const close = () => root.remove();
    root.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
    root.querySelector('[data-r="file"]').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => restoreSave(String(rd.result), '檔案 ' + f.name);
      rd.readAsText(f);
      e.target.value = '';
    });
    root.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a, list = bkList(), it = list[+b.dataset.i];
      if (a === 'close') { close(); return; }
      if (a === 'save') { saveNow(); if (backupNow('手動備份')) toast('已備份目前進度', 'lvl'); draw(); return; }
      if (a === 'dlNow') { saveNow(); bkDownload(bkFile(JSON.stringify(S), stashRaw()), S.name, S.lvl, Date.now()); return; }
      if (a === 'xDel') { if (await uiConfirm('刪除這份臨時備份？')) { try { localStorage.removeItem(EXTRA_BAK); } catch (err) {} draw(); } return; }
      if (a === 'xRestore') { let x = null; try { x = localStorage.getItem(EXTRA_BAK); } catch (err) {} if (x) restoreSave(x, '臨時備份'); return; }
      if (!it) return;
      if (a === 'dl') { bkDownload(bkFile(it.data, it.stash), it.name, it.lvl, it.t); return; }
      if (a === 'del') { if (await uiConfirm('刪除 ' + bkStamp(it.t) + ' 的備份？')) { list.splice(+b.dataset.i, 1); bkSave(list); draw(); } return; }
      if (a === 'restore') { restoreSave(it.data, bkStamp(it.t), it.stash); }
    });
    draw();
  };

  /* ===== 8. 物品持有無上限 =====
   * 遊戲的上限是寫死的常數（v0.2.555 起背包 BAG_MAX、石板、符文都是 5000），常數本身改不了，
   * 所以改的是「用到這些上限的函式」：把函式的原始碼取出來，把上限換成 CFG.itemMax，
   * 再重新建立成同名的函式蓋回去。這樣不用照抄遊戲的程式，遊戲改版後只要寫法沒變就還有效。
   * 會處理兩種：最上層的函式（撿裝備、撿石板、卸下裝備、萃取、切換構築…），
   * 以及 ui 物件裡的方法（按鈕會不會因為「滿了」而變成不能按）。
   * 注意：存檔會跟著物品數量變大。瀏覽器的儲存空間和雲端存檔都有大小限制，
   * 遊戲存檔失敗時不會提示，所以另外每分鐘檢查一次存檔大小，太大就跳警告。
   */
  /* 第 8、10 項共用：把遊戲裡原始碼符合規則的函式改寫後蓋回去，回傳改到的函式名稱。
   * RULES 是 [正規表示式, 取代成的文字] 的陣列。 */
  const patchAll = RULES => {
    const patchSrc = src => { let out = src; for (const r of RULES) out = out.replace(r[0], r[1]); return out; };
    const srcOf = f => Function.prototype.toString.call(f);
    const patched = [];
    for (const name of Object.getOwnPropertyNames(window)) {
      let f;
      try { f = window[name]; } catch (e) { continue; }
      if (typeof f !== 'function') continue;
      const src = srcOf(f);
      if (src.indexOf('[native code]') >= 0 || !/^(async\s+)?function\b/.test(src)) continue;
      const out = patchSrc(src);
      if (out === src) continue;
      try { window[name] = (0, eval)('(' + out + ')'); patched.push(name); } catch (e) {}
    }
    if (typeof ui !== 'undefined') {
      for (const name of Object.keys(ui)) {
        const f = ui[name];
        if (typeof f !== 'function') continue;
        const src = srcOf(f), out = patchSrc(src);
        if (out === src) continue;
        /* 先當成一般函式或箭頭函式重建；失敗的話就是「名稱(){}」這種方法寫法，包進物件裡再取出來 */
        try { ui[name] = (0, eval)('(' + out + ')'); patched.push('ui.' + name); }
        catch (e) { try { ui[name] = (0, eval)('({' + out + '})')[name]; patched.push('ui.' + name); } catch (e2) {} }
      }
    }
    return patched;
  };

  if (first && (CFG.noLimit || CFG.uqKeepHi)) {
    const N = String(CFG.itemMax), NS = String(CFG.slateMax), NT = String(CFG.stashMax);
    const RULES = [];
    if (CFG.noLimit) {
      RULES.push(
        [/\bBAG_MAX\b/g, N],
        [/\bRUNE_MAX\b/g, N],
        /* 符文上限在程式裡是直接寫數字的（v0.2.555 以前 1e3，之後 5e3），有三種寫法：單獨比較、
         * 加上「這一批要萃取的數量」再比較（批次萃取和它的提示文字）、以及「還剩幾格」的上限減掉目前數量。
         * 石板也一樣（以前 500，之後 5e3）。新舊寫法都認，遊戲再改數字時只要補在這裡。 */
        [/(S\.runes\.length(?:\+[\w.]+)?)>=(?:1e3|5e3)/g, '$1>=' + N],
        [/(?:1e3|5e3)-S\.runes\.length/g, N + '-S.runes.length'],
        [/\$\{S\.runes\.length\}\/(?:5000|1000)/g, '${S.runes.length}/' + N],
        [/\bSLATE_MAX\b/g, NS],
        [/S\.slates\.length>=(?:5e3|500)\b/g, 'S.slates.length>=' + NS],
        [/\$\{S\.slates\.length\}\/(?:5000|500)\b/g, '${S.slates.length}/' + NS],
        /* 共用倉庫（v0.2.730 起）：存入的上限 500 直接寫數字，有「目前件數 stCnt()」和「倉庫物件 .it.length」
         * 兩種寫法，另外還有顯示用的「x/500」和提示文字 */
        [/(stCnt\(\)(?:\+[\w.]+)?)(>=|<=|>)500\b/g, '$1$2' + NT],
        [/(\.it\.length(?:\+[\w.]+)?)(>=|<=|>)500\b/g, '$1$2' + NT],
        [/(\.it\.length\}\/)500\b/g, '$1' + NT],
        [/上限 500）/g, '上限 ' + NT + '）']
      );
      /* 從倉庫取出時看的是常數物件 ST_CAP（角色身上每類最多幾件），它不是函式改不到原始碼，直接改裡面的數字 */
      try {
        if (typeof ST_CAP === 'object' && ST_CAP) { ST_CAP.bag = +N; ST_CAP.runes = +N; ST_CAP.slates = +NS; }
      } catch (e) {}
      /* 倉庫說明（HELP.stash）裡的「最多 500 件」也跟著改 */
      try {
        for (const r of (HELP.stash && HELP.stash[1]) || []) if (r[0] === '上限') r[1] = '最多 ' + NT + ' 件（小工具改的）。';
      } catch (e) {}
    }
    /* 獨特裝備依階級決定留不留（階級：0 一般、1 高階、2 終局、3 守護者、4 終焉）。
     * 遊戲的保留規則只能設「是不是獨特」，分不出階級，所以把撿裝備時問「要不要自動分解」的那一步
     * 換成這裡的版本：
     *   - CFG.uqKeepHi 以上的獨特：一律不分解
     *   - 低於這個階級的獨特：當成沒有「獨特一律保留」那條規則，照其餘的保留規則判斷
     *     （前提是遊戲設定裡「獨特自動分解」有打開）
     * 建議遊戲的保留規則裡留著「獨特一律保留」那一條：這樣哪天忘了點書籤，
     * 最壞只是低階獨特塞進背包，不會把終局裝備分解掉。 */
    if (CFG.uqKeepHi) {
      window.__awSalv = t => {
        const hi = t.uq && UNIQUE[t.uq] ? (UNIQUE[t.uq].hi || 0) : -1;
        if (t.uq && hi >= CFG.uqKeepHi) return false;
        if (autoSalv(t)) return true;
        if (!t.uq || t.my || t.sock || t.lk || t.rar >= 4 || !S.set.auto[4]) return false;
        const others = (S.set.keep || []).filter(g => !(g.c.length === 1 && g.c[0].k === 'uq' && !g.c[0].not && !(g.c[0].u && g.c[0].u.length)));
        return !keepMatch(t, others);
      };
      RULES.push([/\bautoSalv\(/g, '__awSalv(']);
    }
    window.__awPatched = patchAll(RULES);

    let lastWarn = 0;
    setInterval(() => {
      if (typeof S === 'undefined' || !S) return;
      let kb = 0;
      try { kb = Math.round(JSON.stringify(S).length / 1024); } catch (e) { return; }
      if (kb >= CFG.saveWarnKB && Date.now() - lastWarn > 600000) {
        lastWarn = Date.now();
        try { toast('存檔已經 ' + kb + ' KB，再大可能會存不進去（雲端存檔尤其容易失敗），建議清掉一些物品', 'bad', 1); } catch (e) {}
      }
    }, 60000);
  }

  /* ===== 9. 禁止自動更新 =====
   * 遊戲每 10 分鐘檢查一次新版，有新版就倒數 5 秒自動重新整理（書籤會跟著失效）。
   * 遊戲用 upd.tried 記「這個版本已經試著更新過了」，是 true 就不會再自動更新；
   * 這裡把它固定成 true，並把負責重新整理的 updNow() 換成空的。
   * 「有新版本」的提示和選單裡手動更新的按鈕不受影響，要更新時自己重新整理頁面即可。
   */
  if (first && CFG.noUpdate) {
    try { Object.defineProperty(upd, 'tried', { get: () => true, set: () => {}, configurable: true }); } catch (e) {}
    window.updNow = () => {};
  }
  /* ===== 10. 單格模式 =====
   * 技能分頁標題旁的開關。開啟後：
   *   - 每顆技能寶石（包含變異寶石）在技能盤上只佔一格
   *   - 輔助寶石不用相鄰，放在盤上就對所有符合條件的主動技能生效
   * 做法：遊戲用 gemShape() 取寶石形狀、用 linkRule() 決定連結方式（遊戲本來就有「全部連結」的 all 規則），
   * 這裡把用到 gemShape() 的函式改成呼叫 __awShape()，並把 linkRule() 包一層，兩者都看 __awOne 這個開關。
   * 不改 SKILLS 裡的形狀資料，因為掉落變異寶石時會拿它當底，改了會產生永久變形的寶石。
   * 開關狀態記在瀏覽器裡，下次點書籤會自動恢復。
   * 注意：沒有點書籤時（例如剛開網頁、離線收益結算）遊戲會照原本的形狀計算，
   * 重疊的寶石連結會亂掉；關閉開關時，放不下的寶石會退回寶石欄。
   */
  /* 「匿名遊玩統計」（遊戲 v0.2.457 加入）的攔截，單格模式和自動刷神話（第 13 項）共用，
   * 所以只要其中一個有開就裝上（之前放在單格模式裡面，關掉單格模式時自動刷神話就擋不到統計）。
   * 遊戲用 stEv() 把事件（打 Boss 花幾秒、無限之塔到幾層、每日擊殺數…）先排進佇列，
   * 佇列放在記憶體的 stQ 和瀏覽器的 autowanderer.stq，之後由 stSend() 一次送出。
   * 這裡的處理：
   *   - 開著單格模式（__awOne）或自動刷神話進行中（__awNoStat）時，stEv() 不記錄、stSend() 不送出，並把佇列清空
   *   - 「每日統計」是隔天才結算前一天的總數，所以開過單格模式的那一天會記下來（awtools.stday），
   *     那一天的每日統計就算之後關掉開關也不送
   * 清空佇列只動 autowanderer.stq 這一個項目，不會碰存檔（autowanderer.v1）。
   * 注意：遊戲啟動時用 setInterval(stSend, 60 秒) 拿走的是原本的 stSend，換不掉；
   * 但它只會送佇列裡的東西，佇列在這裡被擋住、清空，所以送不出東西。 */
  const ST_QUEUE = 'autowanderer.stq', ST_TAINT = 'awtools.stday';
  const stClear = () => {
    try { if (typeof stQ !== 'undefined' && stQ && stQ.length) stQ = []; } catch (e) {}
    try { const q = localStorage.getItem(ST_QUEUE); if (q !== null && q !== '[]') localStorage.setItem(ST_QUEUE, '[]'); } catch (e) {}
  };
  const stMark = () => { try { if (S && S.st && S.st.d) localStorage.setItem(ST_TAINT, S.st.d); } catch (e) {} };
  if (first && (CFG.oneCell || CFG.monLoop)) {
    const realStEv = window.stEv, realStSend = window.stSend;
    if (typeof realStEv === 'function') {
      window.stEv = (t, a) => {
        if (window.__awOne || window.__awNoStat) { stMark(); return; }
        let bad = null;
        try { bad = localStorage.getItem(ST_TAINT); } catch (e) {}
        if (t === 'day' && a && bad && a.d === bad) return;
        return realStEv(t, a);
      };
    }
    if (typeof realStSend === 'function') window.stSend = () => { if (window.__awOne || window.__awNoStat) { stClear(); return; } return realStSend(); };
  }

  const ONE_KEY = 'awtools.onecell';
  let oneCellToggle = null;
  if (first && CFG.oneCell) {
    window.__awOne = false;
    window.__awShape = g => window.__awOne ? [[0, 0]] : (g.sh || SKILLS[g.id].shape);
    window.__awOnePatched = patchAll([
      [/\bgemShape\(/g, '__awShape('],
      /* gemArt() 畫寶石圖示時直接讀形狀，也要跟著變成一格 */
      [/\((\w+)\|\|(\w+)\.shape\)\.map/g, '(window.__awOne?[[0,0]]:($1||$2.shape)).map']
    ]);
    const realLink = window.linkRule;
    if (typeof realLink === 'function') window.linkRule = () => window.__awOne ? 'all' : realLink();
    /* 單格模式開啟時不上傳排行榜。
     * 遊戲每次存檔和每次離開無限之塔都會呼叫 lbSend()。它在下面三個條件都成立時才「不」上傳：
     * 最高層數沒超過 S.lb.sent（已上傳的層數）、角色名稱等於 S.lb.sn、S.lb.ss 是 1（伺服器已經收過構築快照）。
     * 遊戲 v0.2.578 起上傳時會附上構築快照（裝備、技能拼圖位置、天賦，v0.2.722 再加上角色面板數值），
     * 單格模式的寶石會疊在一起，傳上去一看就知道。
     * 這裡除了直接擋掉，還把這三個欄位補成「已經傳過了」，這樣單格模式打出來的層數和構築
     * 之後也不會被上傳（包含關掉開關、或沒點書籤的時候），要等正常玩法打到更高層才會再上傳。
     * 只補 ss 而不補的話，舊存檔沒有 ss，一關掉開關遊戲就會把單格模式的層數連同快照傳上去。 */
    const realLbSend = window.lbSend;
    const lbMask = () => {
      try {
        if (!S || !S.lb || !S.tw) return;
        if (S.tw.best > (S.lb.sent || 0)) S.lb.sent = S.tw.best;
        S.lb.sn = S.name;
        S.lb.sb = S.tal.asc || '';
        S.lb.ss = 1;
      } catch (e) {}
    };
    if (typeof realLbSend === 'function') window.lbSend = () => { if (window.__awOne) { lbMask(); return; } return realLbSend(); };
    /* 匿名遊玩統計的攔截在上面（和自動刷神話共用） */
    setInterval(() => { if (window.__awOne) stMark(); }, 60000);
    /* 寶石圖示有快取，切換後要清掉才會重畫 */
    const redraw = () => {
      try { for (const k of Object.keys(GEM_ART)) delete GEM_ART[k]; } catch (e) {}
      try { recalc(); ui.selGem = null; ui.ghost = null; ui.render(); } catch (e) {}
    };
    /* 用原本的形狀檢查：超出技能盤、放在未解鎖的格子、或和前面的寶石重疊的，都算放不下 */
    const misfits = () => {
      const open = openSet(), used = new Set(), bad = [];
      for (const g of placed()) {
        const cs = gemCells(g).map(c => c[0] + ',' + c[1]);
        if (cs.every(c => open.has(c) && !used.has(c))) cs.forEach(c => used.add(c)); else bad.push(g);
      }
      return bad;
    };
    oneCellToggle = async () => {
      if (!window.__awOne) {
        if (!await uiConfirm('【單格模式】\n\n開啟後每顆技能寶石只佔一格，輔助寶石不用相鄰就會生效。\n\n' +
          '這是直接修改遊戲規則，傷害會遠高於正常玩法，修改【可能】被作者封鎖。開啟期間不會上傳排行榜和匿名遊玩統計，但雲端存檔仍看得到異常的數值。\n\n' +
          '可能導致遊戲存檔或遊戲出問題，請備份存檔後再試。\n\n' +
          '另外：沒有點書籤時遊戲會照原本的形狀計算；之後關閉這個開關，放不下的寶石會退回寶石欄。\n\n確定要開啟嗎？')) return;
        window.__awOne = true;
        try { localStorage.setItem(ONE_KEY, '1'); } catch (e) {}
        lbMask();
        stMark();
        stClear();
        redraw();
        try { toast('單格模式已開啟', 'lvl'); } catch (e) {}
        return;
      }
      window.__awOne = false;
      const bad = misfits();
      if (bad.length && !await uiConfirm('關閉單格模式後，有 ' + bad.length + ' 顆寶石照原本的形狀放不下，會退回寶石欄。\n\n確定要關閉嗎？')) { window.__awOne = true; return; }
      for (const g of bad) g.x = g.y = -1;
      try { localStorage.removeItem(ONE_KEY); } catch (e) {}
      try { markDirty(); } catch (e) {}
      redraw();
      try { toast('單格模式已關閉' + (bad.length ? '，' + bad.length + ' 顆寶石退回寶石欄' : ''), 'lvl'); } catch (e) {}
    };
    let was = false;
    try { was = localStorage.getItem(ONE_KEY) === '1'; } catch (e) {}
    if (was) { window.__awOne = true; stMark(); stClear(); redraw(); }
  }

  /* ===== 11. 解鎖三神器 =====
   * 選單分頁標題旁的按鈕。神器記在存檔的 S.art.has 裡（代號對應 { lv 等級, xp 經驗 }），
   * 這裡把還沒有的神器直接加進去，等級 1、經驗 0；已經有的不會動。
   * 神器的種類從遊戲的 ARTS 讀，之後遊戲多出新神器也會一起解鎖。
   */
  const unlockArts = async () => {
    if (typeof S === 'undefined' || !S || typeof ARTS === 'undefined') { uiAlert('請先進入遊戲'); return; }
    const miss = Object.keys(ARTS).filter(k => !(S.art && S.art.has && S.art.has[k]));
    if (!miss.length) { toast('神器都已經有了', 'lvl'); return; }
    const names = miss.map(k => ARTS[k].n).join('、');
    if (!await uiConfirm('【解鎖三神器】\n\n會把還沒有的神器直接加進存檔（1 級）：\n' + names + '\n\n' +
      '這是直接修改存檔，修改【可能】被作者封鎖（雲端存檔看得到）。\n可能導致遊戲存檔或遊戲出問題，請備份存檔後再試。\n\n確定要解鎖嗎？')) return;
    if (CFG.autoBackup) { try { saveNow(); backupNow('解鎖神器前自動備份'); } catch (e) {} }
    if (!S.art) S.art = { on: '', has: {} };
    if (!S.art.has) S.art.has = {};
    for (const k of miss) S.art.has[k] = { lv: 1, xp: 0 };
    try { recalc(); markDirty(); saveNow(); ui.badge('char', 1); ui.render(); } catch (e) {}
    try { toast('已解鎖神器：' + names + '（到角色分頁點一下戴上）', 'lvl', 1); } catch (e) {}
  };

  /* ===== 12. 無限君主連續挑戰 =====
   * 地圖分頁「無限君主」標題旁的勾選框。勾選後，每次打贏無限君主，等幾秒就自動再挑戰一次，
   * 直到無限印記不夠、打輸或陣亡為止。只在「剛打贏」之後接著打，不會平白自己開打。
   * 判斷打贏：存檔裡的擊敗次數 S.gd.m 增加。開打用遊戲自己的 startGuard(4)（4 是無限君主），
   * 它會自己檢查並扣無限印記、把地上的掉落物收起來。勾選狀態記在瀏覽器裡。
   */
  const MON_KEY = 'awtools.monauto';
  let monAuto = false;
  try { monAuto = localStorage.getItem(MON_KEY) === '1'; } catch (e) {}
  /* 勾選框直接加進遊戲產生「無限君主」那一塊畫面的函式（ui.monBoard）輸出的內容裡。
   * 地圖分頁打怪時會一直重畫，如果等畫完才用計時器補上去，勾選框會一閃一閃；
   * 包在輸出裡就會跟著畫面一起出現。包不到（遊戲改版）時 monWrapped 維持 false，退回用計時器補。 */
  let monWrapped = false;
  const setMonAuto = on => {
    monAuto = !!on;
    try { if (monAuto) localStorage.setItem(MON_KEY, '1'); else localStorage.removeItem(MON_KEY); } catch (e) {}
  };
  if (first && CFG.monAuto) {
    try {
      const realBoard = ui.monBoard;
      if (typeof realBoard === 'function') {
        ui.monBoard = function () {
          const html = realBoard.apply(this, arguments);
          return String(html).replace('</h3>', '<label class="awMonAuto" style="margin-left:8px;font-size:12px;font-weight:normal;cursor:pointer;white-space:nowrap">' +
            '<input type="checkbox"' + (monAuto ? ' checked' : '') + '> 打贏後自動接著打</label>' +
            (CFG.monLoop ? '<button class="btn sm awMonLoopBtn" style="margin-left:8px">自動刷神話</button>' : '') + '</h3>');
        };
        document.addEventListener('change', e => {
          const t = e.target;
          if (t && t.closest && t.closest('.awMonAuto')) setMonAuto(t.checked);
        }, true);
        monWrapped = true;
        if (ui.tab === 'map') ui.render();
      }
    } catch (e) {}
    let lastM = -1, due = 0;
    every(() => {
      if (typeof S === 'undefined' || !S || !S.gd || typeof G === 'undefined' || !G) return;
      const m = S.gd.m || 0;
      if (lastM < 0) { lastM = m; return; }
      /* 自動刷神話進行中時由它自己決定什麼時候開打 */
      if (window.__awNoStat) { lastM = m; due = 0; return; }
      if (m > lastM && monAuto) due = Date.now() + CFG.monAutoMs;
      lastM = m;
      if (!due || Date.now() < due) return;
      /* 陣亡、取消勾選，或等了半分鐘還不能開打（例如使用者自己去打別的），就放棄這一次 */
      if (!monAuto || G.dead || Date.now() > due + 30000) { due = 0; return; }
      if (G.boss || G.tw) return;
      due = 0;
      if (!canMonarch()) { try { toast('無限印記不夠了，連續挑戰結束', 'lvl'); } catch (e) {} return; }
      try { startGuard(4); } catch (e) {}
    }, 500);
  }

  /* ===== 13. 自動刷神話（無限君主存讀檔） =====
   * 地圖分頁「無限君主」標題旁的按鈕。無限君主每次打贏有 0.1% 機率掉神話獨特（裝備或石板）。
   * 這個功能自動重複「打一場 → 沒掉就讀回打之前的存檔」：
   *   1. 開始時把目前進度存成「起點」（放在 awtools.monbase，和存檔備份的 5 份分開，不會被擠掉）
   *   2. 挑戰無限君主。打贏後等掉落物落地、全部收起來，數背包和石板裡的神話獨特有沒有變多
   *   3. 沒有變多（或打輸）：把起點寫回存檔並重新載入，印記回到打之前的數量，再打一次
   *   4. 有變多：把「現在的進度」存成新的起點（東西留下，印記少 5 個），還沒達標就繼續
   * 所以印記只有在真的掉出神話時才會被用掉。達標、印記不夠或按停止時結束。
   * 一場一場檢查，而不是把印記打完才檢查，是因為這樣每一場都能重來，不用賭同一批裡掉兩件。
   * 也可以設定「每打幾場才讀一次檔」（batch）：每場打完照樣立刻檢查，沒掉就接著打，
   * 打滿這一批（或印記不夠）才讀回起點。讀檔次數變少所以比較快，
   * 代價是掉出神話、更新起點的那一刻，這一批已經打掉的印記不會回來。
   * 進度裡的 done 是這一批已經打了幾場，seenM 是已經檢查過的擊敗次數（用來認出還沒檢查的勝場）。
   * 進度記在瀏覽器的 awtools.monloop，重新載入後（要開常駐模式，小工具才會自己回來）會接著跑。
   * 進行中不記錄、不上傳匿名遊玩統計。讀回起點時，起點之後拿到的其他東西（神話裝備、材料、經驗）都會消失。
   */
  const LOOP_KEY = 'awtools.monloop', BASE_KEY = 'awtools.monbase';
  const loopGet = () => { try { return JSON.parse(localStorage.getItem(LOOP_KEY)) || null; } catch (e) { return null; } };
  const loopSet = o => { try { if (o) localStorage.setItem(LOOP_KEY, JSON.stringify(o)); else localStorage.removeItem(LOOP_KEY); } catch (e) {} };
  const mythCount = () => ({ sl: S.slates.filter(t => t.my).length, uq: S.bag.filter(t => t.my).length });
  /* 把目前進度存成起點；回傳是否成功 */
  const baseWrite = () => {
    try { saveNow(); localStorage.setItem(BASE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
  };
  /* 把起點寫回存檔並重新載入。不經過「存檔備份」，所以不會產生自動備份、也不會擠掉原有的備份 */
  const baseRestore = () => {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(BASE_KEY)); } catch (e) {}
    if (!o || !o.cls || !Array.isArray(o.bag) || !Array.isArray(o.gems)) return false;
    o.t = Date.now();
    TAB.gone = true;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) { TAB.gone = false; return false; }
    location.reload();
    return true;
  };
  const loopStart = async () => {
    if (typeof S === 'undefined' || !S || typeof G === 'undefined' || !G) { uiAlert('請先進入遊戲'); return; }
    if (loopGet()) { if (await uiConfirm('自動刷神話正在進行中，要停止嗎？\n\n停止後會留在目前的進度。')) loopSet(null); return; }
    if (!canMonarch()) { uiAlert('無限印記不足 ' + MONARCH.mk + ' 個，沒辦法開始。'); return; }
    if (G.boss || G.tw || G.dead) { uiAlert('請先結束目前的挑戰再開始。'); return; }
    const keys = mythKeys().length;
    const maxBatch = Math.max(1, Math.floor(S.tw.mk / MONARCH.mk));
    /* 說明和三個設定放在同一個對話框裡，一次填完 */
    const ans = await uiForm('【自動刷神話】\n\n會自動重複：挑戰無限君主 → 沒掉神話獨特就讀回挑戰前的存檔 → 再挑戰。\n' +
      '掉出神話獨特時才會保留進度（用掉 ' + MONARCH.mk + ' 個印記），然後繼續刷到達標或印記不夠為止。\n\n' +
      '機率：每次打贏 0.1% 掉神話獨特，共 ' + keys + ' 種（其中 1 種是石板），所以平均要打約 1000 場才有一件，指定石板約 ' + (1000 * keys) + ' 場。\n\n' +
      '注意：\n・讀回存檔時，這一場拿到的其他東西（神話裝備、奇蹟石、材料）都會消失\n・進行中請不要自己操作角色或切換地圖\n' +
      '・要開著常駐模式，重新載入後才會自動接著跑\n・進行中不會記錄或上傳遊玩統計、排行榜和雲端存檔（進行中遊戲會顯示沒登入 Google），結束後自動恢復\n・這是反覆讀檔，修改【可能】被作者封鎖；可能導致存檔出問題，開始前會先自動備份一份', [
      { label: '新拿到的「神話石板」至少幾塊才算達標（不指定石板就填 0）', value: '1', type: 'number' },
      { label: '新拿到的「神話獨特」（裝備和石板合計）至少幾件才算達標', value: '2', type: 'number' },
      { label: '每打幾場才讀一次檔（1 = 每場都讀，最省印記；數字越大越省時間，但掉出神話時那一批打掉的印記不會回來）\n你現在有 ' + S.tw.mk + ' 個印記，最多可以填 ' + maxBatch, value: String(Math.min(CFG.monLoopBatch, maxBatch)), type: 'number' }
    ]);
    if (!ans) return;
    const goalSl = Math.max(0, Math.floor(+ans[0] || 0)), goalAll = Math.max(goalSl, Math.floor(+ans[1] || 0));
    if (goalAll < 1) { uiAlert('目標至少要 1 件。'); return; }
    const batch = Math.max(1, Math.min(maxBatch, Math.floor(+ans[2] || 1)));
    /* 填設定的時候遊戲還在跑，狀況可能變了，開始前再確認一次 */
    if (loopGet() || !canMonarch() || G.boss || G.tw || G.dead) { uiAlert('目前的狀況沒辦法開始（正在挑戰中，或印記不夠），請稍後再試。'); return; }
    try { saveNow(); backupNow('自動刷神話前自動備份'); } catch (e) {}
    if (!baseWrite()) { uiAlert('瀏覽器的儲存空間不夠，起點存不進去，沒有開始。請先到「存檔備份」刪掉一些舊備份。'); return; }
    const c = mythCount();
    loopSet({ on: 1, goalSl: goalSl, goalAll: goalAll, gotSl: 0, gotAll: 0, baseM: S.gd.m || 0, seenM: S.gd.m || 0, baseSl: c.sl, baseUq: c.uq, tries: 0, batch: batch, done: 0, t0: Date.now() });
    try { toast('自動刷神話開始', 'lvl'); } catch (e) {}
  };
  if (first && CFG.monLoop) {
    document.addEventListener('click', e => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.awMonLoopBtn')) { e.stopPropagation(); e.preventDefault(); loopStart(); return; }
      if (t.closest('.awLoopStop')) { e.stopPropagation(); loopSet(null); try { toast('自動刷神話已停止，留在目前的進度', 'lvl'); } catch (err) {} }
    }, true);
    /* 進行中在畫面上方顯示狀態列 */
    const drawBar = L => {
      let el = document.querySelector('#awLoopBar');
      if (!L) { if (el) el.remove(); return; }
      if (!el) {
        el = document.createElement('div');
        el.id = 'awLoopBar';
        el.style.cssText = 'position:fixed;left:50%;top:22px;transform:translateX(-50%);z-index:99998;background:rgba(26,20,16,.92);border:1px solid #ffd84a;border-radius:4px;padding:3px 8px;font:12px/1.5 sans-serif;color:#f0e6d2;white-space:nowrap;max-width:96vw;overflow:hidden';
        document.body.appendChild(el);
      }
      const min = Math.round((Date.now() - L.t0) / 60000);
      const txt = '自動刷神話：第 ' + (L.tries + 1) + ' 場' + (L.batch > 1 ? '（這批 ' + ((L.done || 0) + 1) + '/' + L.batch + '）' : '') + '　石板 ' + L.gotSl + '/' + L.goalSl + '　合計 ' + L.gotAll + '/' + L.goalAll + '　已 ' + min + ' 分鐘 ';
      if (el.dataset.t !== txt) { el.dataset.t = txt; el.innerHTML = txt.replace(/</g, '&lt;') + '<button class="awLoopStop" style="padding:0 6px;cursor:pointer">停止</button>'; }
    };
    /* 進行中不留下、也不送出任何紀錄：
     *   - 匿名遊玩統計：第 10 項包過的 stEv()／stSend() 看到 __awNoStat 就不記錄、不送出。
     *     但每次重新載入時，遊戲會在小工具回來之前先記一筆「開始遊玩」，所以這裡每一輪都把待送佇列清空，
     *     結束的那一刻再清一次，才恢復正常記錄。只動 autowanderer.stq，不碰存檔。
     *   - 排行榜：進行中 lbSend() 直接不送。
     *   - Google 雲端存檔：進行中不上傳（不然作者那邊會看到存檔反覆回到同一個狀態），做法在第 18 項。 */
    const statWipe = stClear;
    /* 小工具一裝上就馬上判斷，不等第一次計時器（計時器 0.7 秒才跑第一次，遊戲啟動時記的事件會比它早） */
    {
      const L0 = loopGet();
      window.__awNoStat = !!(L0 && L0.on);
      if (window.__awNoStat) statWipe();
    }
    const loopLbSend = window.lbSend;
    if (typeof loopLbSend === 'function') {
      window.lbSend = function () {
        const L = loopGet();
        if (window.__awNoStat || (L && L.on)) return;
        return loopLbSend.apply(this, arguments);
      };
    }
    let phase = 'start', at = 0, startTry = 0, wasOn = false;
    const stop = msg => { loopSet(null); statWipe(); window.__awNoStat = false; wasOn = false; drawBar(null); if (msg) { try { toast(msg, 'lvl', 1); } catch (e) {} } };
    every(() => {
      const L = loopGet();
      const on = !!(L && L.on);
      /* 剛結束（包含按狀態列的停止）：先把佇列清乾淨，再恢復記錄 */
      if (on || wasOn) statWipe();
      wasOn = on;
      window.__awNoStat = on;
      drawBar(L);
      if (!L || !L.on) { phase = 'start'; startTry = 0; return; }
      if (typeof S === 'undefined' || !S || !S.gd || typeof G === 'undefined' || !G || TAB.gone || phase === 'wait') return;
      const now = Date.now(), m = S.gd.m || 0;
      /* 舊版留下的進度沒有這幾個欄位，補上預設值（每場都讀檔） */
      if (!L.batch) L.batch = 1;
      if (L.done == null) L.done = 0;
      if (L.seenM == null) L.seenM = L.baseM;
      /* 讀回起點：這一批從頭算起 */
      const reload = () => {
        L.done = 0; L.seenM = L.baseM; loopSet(L); phase = 'wait';
        if (!baseRestore()) stop('讀不到起點存檔，自動刷神話已停止');
      };
      /* 一場打完（沒掉神話）之後：這一批打滿了、或印記不夠再打，就讀回起點；否則接著打下一場 */
      const next = () => {
        L.done++; L.seenM = m;
        if (L.done >= L.batch || !canMonarch()) { reload(); return; }
        loopSet(L); phase = 'start'; at = now + 500;
      };
      if (phase === 'start') {
        if (G.dead || G.boss || G.tw || now < at) return;
        /* 有一場打贏了還沒檢查（例如打贏之後、檢查之前頁面被重新載入）：直接去檢查掉落 */
        if (m > L.seenM) { phase = 'loot'; at = now + CFG.monLoopLootMs; return; }
        if (m < L.baseM) { stop('目前的進度和起點對不上，自動刷神話已停止'); return; }
        if (!canMonarch()) {
          if (L.done > 0) reload(); else stop('無限印記不足 ' + MONARCH.mk + ' 個，自動刷神話結束');
          return;
        }
        try { startGuard(4); } catch (e) {}
        if (G.boss && G.guard === 4) { phase = 'fight'; startTry = 0; }
        else if (++startTry > 30) stop('一直無法開始挑戰，自動刷神話已停止');
        return;
      }
      if (phase === 'fight') {
        if (G.boss) return;
        if (m > L.seenM) { phase = 'loot'; at = now + CFG.monLoopLootMs; return; }
        /* 打輸或超時：算打完一場 */
        L.tries++; next();
        return;
      }
      if (phase === 'loot') {
        if (now < at) return;
        try { grabDrops(); } catch (e) {}
        const c = mythCount(), nSl = Math.max(0, c.sl - L.baseSl), nUq = Math.max(0, c.uq - L.baseUq);
        L.tries++;
        if (nSl + nUq > 0) {
          /* 掉了：把現在的進度存成新的起點，這一批已經用掉的印記就不拿回來了 */
          L.gotSl += nSl; L.gotAll += nSl + nUq;
          const saved = baseWrite();
          L.baseM = m; L.seenM = m; L.done = 0; L.baseSl = c.sl; L.baseUq = c.uq;
          if (L.gotSl >= L.goalSl && L.gotAll >= L.goalAll) { stop('自動刷神話達標：神話石板 ' + L.gotSl + ' 塊、合計 ' + L.gotAll + ' 件，共打了 ' + L.tries + ' 場'); return; }
          if (!saved) { stop('拿到神話獨特了，但瀏覽器儲存空間不夠、起點更新失敗，為了不弄丟它已停止'); return; }
          loopSet(L); phase = 'start'; at = now + 1500;
          try { toast('拿到神話獨特！已更新起點，繼續刷', 'lvl', 1); } catch (e) {}
          return;
        }
        next();
      }
    }, 700);
  }

  /* ===== 18. 不上傳雲端存檔 =====
   * 兩種情況不把存檔傳到 Google 雲端存檔：
   *   - 小工具設定開了「不上傳雲端存檔」（CFG.noCloud）
   *   - 自動刷神話進行中（不然作者那邊會看到存檔反覆回到同一個狀態）
   * 單格模式不擋雲端（玩家可能跨裝置玩），只擋排行榜和統計。
   * 光把 gcUpload() 包起來不夠：遊戲每次開網頁、重新載入（自動刷神話每次讀檔都會）一啟動就存一次檔，
   * 存檔時發現「這次開網頁還沒上傳過」就馬上上傳，這時小工具常常還沒回來（實測離線版晚了約 0.2 秒）。
   * 所以要擋的期間，把遊戲記在 autowanderer.cloud 的 Google 登入憑證先收起來（放到 awtools.gctok），
   * 遊戲重新載入時讀不到憑證，就當成沒登入，不會上傳、也不會去問雲端。不用擋了再放回去。
   * 中途關掉網頁的話，下次點書籤時（不用擋）也會自動放回去。
   * 擋的期間在遊戲裡重新登入 Google 也沒關係：計時器會再把新的憑證收起來。 */
  const GC_STASH = 'awtools.gctok', GC_NAG_LS = 'autowanderer.gcNag';
  const gcStash = () => {
    try {
      if (typeof GC === 'undefined' || !GC.tok) return;
      const o = { tok: GC.tok, acc: GC.acc };
      /* 遊戲看到沒登入，可能會跳一次「重新綁定 Google」的提醒，先標成看過，放回時再拿掉
       * （擋的期間重新登入、又收一次憑證時，沿用上一次的標記） */
      let old = null;
      try { old = JSON.parse(localStorage.getItem(GC_STASH)); } catch (e) {}
      if (old && old.nag) o.nag = 1;
      else if (localStorage.getItem(GC_NAG_LS) === null) { o.nag = 1; localStorage.setItem(GC_NAG_LS, '1'); }
      localStorage.setItem(GC_STASH, JSON.stringify(o));
      GC.tok = '';
      gcPut();
    } catch (e) {}
  };
  const gcUnstash = () => {
    try {
      const raw = localStorage.getItem(GC_STASH);
      if (!raw || typeof GC === 'undefined') return;
      const o = JSON.parse(raw) || {};
      /* 使用者中途自己重新登入過的話，留著新的憑證 */
      if (o.tok && !GC.tok) { GC.tok = o.tok; GC.acc = o.acc || String(o.tok).split('.')[0]; gcPut(); }
      if (o.nag) localStorage.removeItem(GC_NAG_LS);
      localStorage.removeItem(GC_STASH);
    } catch (e) {}
  };
  const cloudOff = () => { const L = loopGet(); return CFG.noCloud || !!(L && L.on); };
  if (first) {
    /* 小工具一裝上就馬上處理，不等計時器 */
    if (cloudOff()) gcStash(); else gcUnstash();
    const realGcUpload = window.gcUpload;
    if (typeof realGcUpload === 'function') {
      window.gcUpload = function () { if (cloudOff()) return Promise.resolve(false); return realGcUpload.apply(this, arguments); };
    }
    /* 被遊戲鎖住的分頁（TAB.gone，例如另一個分頁開了遊戲）不動憑證：
     * 那邊的設定和進度可能是舊的，實測會把正在玩的分頁收起來的憑證又放回去 */
    every(() => {
      try { if (typeof TAB !== 'undefined' && TAB.gone) return; } catch (e) {}
      if (cloudOff()) gcStash(); else gcUnstash();
    }, 700);
  }

  /* ===== 14. 置頂視窗 =====
   * 選單分頁標題旁的按鈕。網頁沒有辦法叫瀏覽器視窗「永遠在最上層」，
   * 但電腦版 Chrome／Edge（116 以上）有「文件子母畫面」：一個永遠在最上層的小視窗，裡面可以放網頁內容。
   * 這裡把遊戲搬進那個小視窗（實際的搬動寫在第 0 項的 __awPin，因為要在外層頁面執行）。
   * 小視窗不會被其他視窗蓋住，也就不會被瀏覽器當成背景而暫停。
   * 搬進去和搬回來時遊戲都會重新載入一次（先存檔），小工具靠常駐模式自己回來。
   * 需要常駐模式；手機和其他瀏覽器不支援。
   */
  const pinnedNow = () => { try { return !!window.parent.__awPinned; } catch (e) { return false; } };
  /* 按鈕只在真的能用的時候才顯示：要有常駐模式的外層頁面，而且瀏覽器有「文件子母畫面」功能。
   * 手機、Firefox、Safari、舊版 Chrome 沒有這個功能，按鈕就不會出現，免得使用者按了只看到錯誤訊息。
   * 已經在小視窗裡的時候，外層是那個小視窗（它身上有 __awPinned），按鈕要留著才能取消置頂。 */
  const pinOk = () => {
    try {
      const t = window.top;
      return typeof t.__awPin === 'function' && (!!t.__awPinned || 'documentPictureInPicture' in t);
    } catch (e) { return false; }
  };
  const pinToggle = () => {
    let top = null;
    try { top = window.top; } catch (e) {}
    if (!top || typeof top.__awPin !== 'function') { uiAlert('「置頂視窗」需要常駐模式。請確認檔案開頭的 host 是 true，重新整理頁面後再點一次書籤。'); return; }
    try { if (typeof S !== 'undefined' && S) { grabDrops(); saveNow(); } } catch (e) {}
    top.__awPin().then(r => {
      if (r === 'nosupport') uiAlert('這個瀏覽器不支援置頂小視窗（需要電腦版 Chrome 或 Edge 116 以上）。');
    }).catch(e => { uiAlert('開不了置頂視窗：' + (e && e.message ? e.message : e)); });
  };

  /* ===== 15. 省資源 =====
   * 遊戲每一個畫面都會把整個場景重畫一次，還會產生一堆粒子（擊中的火花、拖尾）和傷害數字。
   * 這些只是視覺效果，不影響戰鬥結果，但技能一多就很吃資源，單格模式尤其明顯。這裡做三件事：
   *   - 分頁在背景（或被蓋住）時完全不畫：反正看不到（bgNoDraw，不管有沒有開單格模式都生效）
   *   - 節能模式時，畫面更新降到每秒 ecoFps 次（遊戲本身的運算速度不變，只是畫得比較少次）
   *   - 節能模式時，不產生粒子、拖尾和傷害數字
   * 節能模式：戰鬥畫面左下角（地圖名稱上面）的開關，點一下就切換、馬上生效，狀態記在瀏覽器的 awtools.eco。
   * 單格模式開著時不管開關怎麼設都會啟用。
   * 做法是把遊戲的 draw()（畫場景）、eliteTags()（菁英頭上的標籤）、burst()、streak()、num() 各包一層。
   * 有些粒子是遊戲直接塞進 G.parts 的，包不到，所以畫之前順手清掉。
   */
  const ECO_KEY = 'awtools.eco';
  let ecoUser = false;
  try { ecoUser = localStorage.getItem(ECO_KEY) === '1'; } catch (e) {}
  if (first && CFG.eco) {
    const ecoOn = () => ecoUser || !!window.__awOne;
    /* 開關沿用遊戲畫面上標籤（chip）的樣式，放進左下角那一排（#lstack）的最上面。
     * 關閉時用黃色、開啟時用綠色，比較顯眼。那一排本身不接收點擊（pointer-events:none），所以按鈕自己要打開；
     * 點擊要擋住往外傳，不然會被當成點了戰鬥畫面。 */
    if (CFG.ecoBtn) {
      const ecoLabel = b => {
        const on = ecoOn();
        const txt = '🔋 節能模式：' + (on ? '開' : '關') + (on && !ecoUser ? '（單格模式）' : '');
        if (b.textContent !== txt) b.textContent = txt;
        b.style.color = on ? '#7dffc8' : '#ffd84a';
        b.style.borderColor = on ? '#7dffc8' : '#ffd84a';
      };
      every(() => {
        const stack = document.querySelector('#lstack');
        if (!stack) return;
        let b = stack.querySelector('.awEcoBtn');
        if (!b) {
          b = document.createElement('button');
          b.className = 'chip awEcoBtn';
          b.title = '降低畫面更新次數、不產生粒子和傷害數字，比較不會卡；只影響畫面，不影響戰鬥結果';
          /* 遊戲用 zoom:var(--uz) 依螢幕大小放大這一排標籤，這裡跟著用，大小才會一致 */
          b.style.cssText = 'pointer-events:auto;cursor:pointer;zoom:var(--uz,1);padding:1px 6px;border-width:1px;background:rgba(20,14,28,.8)';
          b.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            if (window.__awOne && ecoUser) { ecoUser = false; }
            else if (window.__awOne) { try { toast('單格模式開著時一定會節能，關掉單格模式才能關閉', 'lvl'); } catch (err) {} return; }
            else ecoUser = !ecoUser;
            try { if (ecoUser) localStorage.setItem(ECO_KEY, '1'); else localStorage.removeItem(ECO_KEY); } catch (err) {}
            ecoLabel(b);
            try { toast('節能模式已' + (ecoUser ? '開啟' : '關閉'), 'lvl'); } catch (err) {}
          });
          stack.insertBefore(b, stack.firstChild);
        }
        ecoLabel(b);
      }, 500);
    }
    let lastDraw = 0, skipped = false;
    const realDraw = window.draw, realTags = window.eliteTags;
    if (typeof realDraw === 'function') {
      window.draw = function () {
        skipped = false;
        if (CFG.bgNoDraw && document.hidden) { skipped = true; return; }
        if (ecoOn()) {
          try { if (G.parts.length) G.parts.length = 0; } catch (e) {}
          if (CFG.ecoFps > 0) {
            const now = performance.now();
            if (now - lastDraw < 1000 / CFG.ecoFps) { skipped = true; return; }
            lastDraw = now;
          }
        }
        return realDraw.apply(this, arguments);
      };
    }
    if (typeof realTags === 'function') window.eliteTags = function () { if (skipped) return; return realTags.apply(this, arguments); };
    for (const name of ['burst', 'streak', 'num']) {
      const real = window[name];
      if (typeof real !== 'function') continue;
      window[name] = function () { if (ecoOn()) return; return real.apply(this, arguments); };
    }
  }

  /* ===== 16. 卡片進度 =====
   * 地圖分頁標題旁的按鈕，列出每張地圖的怪物卡片：目前幾階、加成是什麼、擊殺數和離下一階還差多少，
   * 以及那張地圖每種怪各殺了幾隻。資料全部讀遊戲自己的：
   *   MAPS[i].card = [加成的詞綴代號, [一階, 二階, 三階的數值]]，MAPS[i].m 是那張地圖的怪物代號
   *   S.kills['地圖編號_怪物代號'] 是擊殺數，cardKills(i) 是整張地圖的合計，cardTier(i) 是目前階數
   *   CARD_N 是三階各自的門檻，CARD_LOOK 是解鎖外觀特效的門檻
   * 只有在線上實際打死的怪才會算，離線收益不算。
   */
  const openCards = () => {
    if (document.querySelector('#awCards')) return;
    if (typeof S === 'undefined' || !S) { uiAlert('請先進入遊戲'); return; }
    const BTN = 'padding:2px 8px;cursor:pointer';
    const root = document.createElement('div');
    root.id = 'awCards';
    root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font:13px/1.5 sans-serif;color:#f0e6d2';
    root.innerHTML =
      '<div style="background:#2a2118;border:2px solid #6a5a4a;border-radius:6px;padding:12px;box-sizing:border-box;width:min(620px,96vw);max-height:94%;display:flex;flex-direction:column">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<b style="font-size:15px;white-space:nowrap">怪物卡片進度</b><span data-r="sum" style="color:#a89a84"></span><span style="flex:1"></span>' +
          '<button data-a="close" style="' + BTN + '">關閉</button>' +
        '</div>' +
        '<div data-r="list" style="overflow:auto;flex:1;min-height:120px;background:#1a1410"></div>' +
        '<div style="color:#a89a84;font-size:12px;margin-top:6px">只有在線上實際打死的怪才會算，離線收益的擊殺不算。每張地圖看的是那張地圖所有怪物的擊殺合計。</div>' +
      '</div>';
    document.body.appendChild(root);
    const elList = root.querySelector('[data-r="list"]'), elSum = root.querySelector('[data-r="sum"]');
    const esc = t => String(t).replace(/</g, '&lt;');
    const draw = () => {
      let h = '', full = 0, count = 0;
      MAPS.forEach((mp, i) => {
        if (!mp.card) return;
        count++;
        const k = cardKills(i), tier = cardTier(i), max = CARD_N.length;
        if (tier >= max) full++;
        const af = AFFIX[mp.card[0]];
        const val = n => (af && af.f ? af.f(mp.card[1][n]) : mp.card[0] + ' ' + mp.card[1][n]);
        const next = tier < max ? CARD_N[tier] : (k < CARD_LOOK ? CARD_LOOK : 0);
        const prev = tier > 0 ? CARD_N[tier - 1] : 0;
        const pct = next ? Math.max(0, Math.min(100, (k - (tier < max ? prev : CARD_N[max - 1])) / (next - (tier < max ? prev : CARD_N[max - 1])) * 100)) : 100;
        const locked = i > S.unlocked && !(typeof ssMap === 'function' && ssMap(i));
        let eta = '';
        if (next && i === S.map && S.kpm > 0) eta = '　以目前每分鐘 ' + Math.round(S.kpm) + ' 隻估計，約 ' + Math.ceil((next - k) / S.kpm) + ' 分鐘';
        const mons = mp.m.map(id => esc(MON[id] ? MON[id].n : id) + ' ' + fmt(S.kills[i + '_' + id] || 0)).join('　');
        h += '<div style="padding:6px 8px;border-bottom:1px solid #3a3026' + (i === S.map ? ';background:#2a2118' : '') + (locked ? ';opacity:.5' : '') + '">' +
          '<div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><b>' + esc(mp.n) + '</b>' + (i === S.map ? '<small style="color:#7dffc8">目前所在</small>' : '') + (locked ? '<small>尚未解鎖</small>' : '') +
          '<span style="flex:1"></span><span style="color:' + (tier >= max ? '#ffd84a' : '#f0e6d2') + '">' + (tier >= max ? '已滿階' : tier + ' / ' + max + ' 階') + '</span></div>' +
          '<div style="font-size:12px">目前加成：' + (tier > 0 ? '<b style="color:#7dffc8">' + esc(val(tier - 1)) + '</b>' : '<span style="color:#a89a84">還沒有</span>') +
          (tier < max ? '　下一階：' + esc(val(tier)) : '') + '</div>' +
          '<div style="height:8px;background:#0e0b08;border:1px solid #6a5a4a;margin:3px 0"><div style="height:100%;width:' + pct.toFixed(1) + '%;background:' + (tier >= max ? '#ffd84a' : '#7dffc8') + '"></div></div>' +
          '<div style="font-size:12px">擊殺 <b>' + fmt(k) + '</b>' + (next ? ' / ' + fmt(next) + (tier >= max ? '（外觀特效）' : '') + '　還差 <b>' + fmt(next - k) + '</b>' + eta : '　外觀特效已解鎖') + '</div>' +
          '<div style="font-size:12px;color:#a89a84">' + mons + '</div></div>';
      });
      const top = elList.scrollTop;
      elList.innerHTML = h || '<div style="padding:10px;color:#a89a84">沒有卡片資料</div>';
      elList.scrollTop = top;
      elSum.textContent = '已滿階 ' + full + ' / ' + count + ' 張';
    };
    const timer = setInterval(() => { if (!document.body.contains(root)) { clearInterval(timer); return; } draw(); }, 2000);
    const close = () => { clearInterval(timer); root.remove(); };
    root.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
    root.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (b && b.dataset.a === 'close') close(); });
    draw();
  };

  /* ===== 17. 小工具設定 =====
   * 選單分頁的按鈕。把檔案開頭 CFG 的每個項目列出來讓使用者在遊戲裡改，不用改檔案。
   * 改過的項目（只存和預設值不同的）記在瀏覽器的 awtools.cfg，下次載入時蓋到 CFG 上。
   * 大部分功能是在小工具啟動時依設定決定要不要安裝的，所以儲存後要重新載入遊戲才會生效
   * （開著常駐模式的話，重新載入後小工具會自己回來）。
   * CFG_UI 決定畫面上的分組、順序和說明文字；之後 CFG 多了新項目，要在這裡也加一行才會出現在畫面上。
   * 欄位的種類看預設值：true／false 是勾選框、數字是數字框、# 開頭的文字是顏色。
   */
  const CFG_UI = [
    ['基本', [
      ['host', '常駐模式', '遊戲重新載入後小工具自動回來。關掉的話，每次重新載入都要再點一次書籤'],
      ['keepAlive', '背景運行', '分頁在背景或被蓋住時遊戲照常跑，不會變成離線收益'],
      ['bgGrabMs', '背景時每幾毫秒收一次掉落物', '0 = 不收，等回到畫面才撿'],
      ['noUpdate', '禁止遊戲自動更新', '有新版時不會自己重新整理，要更新請用遊戲選單裡的更新按鈕'],
      ['noCloud', '不上傳雲端存檔', '開啟期間遊戲會顯示沒登入 Google、不會上傳也不會讀雲端存檔；關掉後自動恢復登入。自動刷神話進行中不管這項都不上傳']
    ]],
    ['畫面顯示', [
      ['bossBar', 'BOSS 血條', '遊戲本身已有血條（只有紅條和倒數）；打開後在畫面最上方另外顯示 BOSS 名稱、生命數字和百分比'],
      ['barHeight', '血條高度（px）'], ['barFont', '血條文字大小（px）'], ['barTop', '血條離頂端的距離（px）'], ['barSide', '血條左右留白（px）'],
      ['hpColor', '血條生命顏色'], ['shieldColor', '血條護盾顏色'],
      ['skillCd', '技能盤上顯示冷卻秒數'], ['trayCd', '未放置的寶石也顯示冷卻秒數'],
      ['cdFont', '冷卻文字大小（px）'], ['cdColor', '冷卻文字顏色'],
      ['hpDetail', '角色分頁顯示生命來源明細'], ['hpFont', '生命明細文字大小（px）']
    ]],
    ['功能按鈕', [
      ['planner', '配置模擬', '技能分頁'], ['oneCell', '單格模式開關', '技能分頁'], ['items', '物品管理', '背包分頁'],
      ['cards', '卡片進度', '地圖分頁'], ['monAuto', '無限君主「打贏後自動接著打」', '地圖分頁'], ['monLoop', '自動刷神話', '地圖分頁'],
      ['backup', '存檔備份', '選單分頁'], ['arts', '解鎖三神器', '選單分頁'], ['pin', '置頂視窗', '選單分頁；只有電腦版 Chrome／Edge 會出現']
    ]],
    ['物品上限', [
      ['noLimit', '物品持有無上限', '背包、石板、符文、共用倉庫'],
      ['itemMax', '背包和符文的上限'], ['slateMax', '石板的上限'],
      ['stashMax', '共用倉庫的上限', '遊戲原本 500；倉庫存在瀏覽器裡，太大可能存不進去（遊戲會提示「儲存空間不足」）'],
      ['uqKeepHi', '獨特裝備這個階級以上一律保留', '0 一般、1 高階、2 終局、3 守護者、4 終焉；填 0 關閉這個功能'],
      ['saveWarnKB', '存檔超過幾 KB 就提醒']
    ]],
    ['省資源', [
      ['eco', '省資源', '下面幾項的總開關'],
      ['bgNoDraw', '背景時不畫畫面'],
      ['ecoBtn', '節能模式開關', '戰鬥畫面左下角，點一下切換；關掉這項就不顯示開關'],
      ['ecoFps', '節能模式時畫面每秒更新幾次', '0 = 不限制；只影響畫面，不影響遊戲速度']
    ]],
    ['無限君主', [
      ['monAutoMs', '打贏後等幾毫秒再自動挑戰'],
      ['monLoopLootMs', '自動刷神話：打贏後等幾毫秒再檢查掉落'],
      ['monLoopBatch', '自動刷神話：每打幾場讀一次檔的預設值']
    ]],
    ['其他', [
      ['autoBackup', '套用匯入的計畫、解鎖神器前自動備份'], ['backupKeep', '瀏覽器裡最多保留幾份備份'],
      ['planCell', '配置模擬的格子大小（px）'], ['gemPrice', '商店一顆技能寶石的灰燼價格', '匯入代碼自動補買時用'],
      ['tickMs', '背景時每幾毫秒推動一次遊戲', '太小會吃資源，太大遊戲會變慢'],
      ['barRefreshMs', '血條更新間隔（毫秒）'], ['cdRefreshMs', '冷卻文字更新間隔（毫秒）'], ['hpRefreshMs', '生命明細更新間隔（毫秒）'], ['btnRefreshMs', '檢查按鈕是否還在的間隔（毫秒）']
    ]]
  ];
  const openSettings = () => {
    if (document.querySelector('#awCfg')) return;
    const BTN = 'padding:2px 8px;cursor:pointer';
    const root = document.createElement('div');
    root.id = 'awCfg';
    root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font:13px/1.5 sans-serif;color:#f0e6d2';
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    let h = '';
    for (const grp of CFG_UI) {
      h += '<div style="margin:8px 0 2px;color:#ffd84a;font-weight:bold">' + esc(grp[0]) + '</div>';
      for (const row of grp[1]) {
        const k = row[0], def = CFG_DEF[k], cur = CFG[k];
        if (def === undefined) continue;
        const changed = cur !== def;
        let field;
        if (typeof def === 'boolean') field = '<input type="checkbox" data-k="' + k + '"' + (cur ? ' checked' : '') + '>';
        else if (typeof def === 'number') field = '<input type="number" data-k="' + k + '" value="' + cur + '" style="width:84px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a">';
        else field = '<input type="color" data-k="' + k + '" value="' + esc(cur) + '" style="width:44px;height:22px;padding:0;border:1px solid #6a5a4a;background:#1a1410">';
        h += '<label style="display:flex;gap:8px;align-items:center;padding:3px 6px;border-bottom:1px solid #3a3026;cursor:pointer">' +
          '<span style="flex:1"><span' + (changed ? ' style="color:#7dffc8"' : '') + '>' + esc(row[1]) + '</span>' +
          (row[2] ? '<br><small style="color:#a89a84">' + esc(row[2]) + '</small>' : '') + '</span>' + field + '</label>';
      }
    }
    root.innerHTML =
      '<div style="background:#2a2118;border:2px solid #6a5a4a;border-radius:6px;padding:12px;box-sizing:border-box;width:min(560px,96vw);max-height:94%;display:flex;flex-direction:column">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<b style="font-size:15px;white-space:nowrap">小工具設定</b><span style="color:#a89a84">' + VERSION + '</span><span style="flex:1"></span>' +
          '<button data-a="reset" style="' + BTN + '">全部恢復預設</button><button data-a="close" style="' + BTN + '">取消</button>' +
        '</div>' +
        '<div data-r="list" style="overflow:auto;flex:1;min-height:120px;background:#1a1410;padding:0 4px 6px">' + h + '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">' +
          '<span style="flex:1;color:#a89a84;font-size:12px">綠色的是改過的項目。儲存後要重新載入遊戲才會生效。</span>' +
          '<button data-a="save" style="' + BTN + ';font-weight:bold;background:#ffd84a;color:#2a2118;border:1px solid #000">儲存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    const close = () => root.remove();
    /* 存好之後問要不要馬上重新載入 */
    const reloadAsk = async () => {
      close();
      let hosted = false;
      try { hosted = window !== window.top; } catch (e) { hosted = true; }
      if (!await uiConfirm('設定已儲存，重新載入遊戲後生效。\n\n現在重新載入嗎？（會先存檔' + (hosted && CFG.host ? '，小工具會自己回來）' : '；重新載入後要再點一次書籤）'))) return;
      try { if (typeof S !== 'undefined' && S) { grabDrops(); saveNow(); } } catch (e) {}
      location.reload();
    };
    root.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
    root.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { close(); return; }
      if (a === 'reset') {
        if (!await uiConfirm('把所有設定恢復成預設值？')) return;
        try { localStorage.removeItem(CFG_KEY); } catch (err) {}
        reloadAsk();
        return;
      }
      if (a === 'save') {
        const diff = {};
        for (const el of root.querySelectorAll('[data-k]')) {
          const k = el.dataset.k, def = CFG_DEF[k];
          let v;
          if (typeof def === 'boolean') v = el.checked;
          else if (typeof def === 'number') {
            v = +el.value;
            if (el.value === '' || !isFinite(v) || v < 0) { uiAlert('「' + (el.closest('label').querySelector('span span') || {}).textContent + '」要填 0 以上的數字。'); return; }
          } else v = String(el.value);
          if (v !== def) diff[k] = v;
        }
        if (diff.host === false && !await uiConfirm('你關掉了常駐模式。\n\n關掉之後，遊戲每次重新載入（包含等一下這一次）小工具都會消失，要再點一次書籤；自動刷神話和置頂視窗也會不能用。\n\n確定要關掉嗎？')) return;
        try { localStorage.setItem(CFG_KEY, JSON.stringify(diff)); } catch (err) { uiAlert('瀏覽器的儲存空間不夠，設定沒有存成功。'); return; }
        /* 「不上傳雲端存檔」馬上生效，不等重新載入：不然重新載入時遊戲一啟動就會先傳一次 */
        CFG.noCloud = diff.noCloud === true;
        if (cloudOff()) gcStash(); else gcUnstash();
        reloadAsk();
      }
    });
  };

  /* ===== 入口按鈕 =====
   * 「配置模擬」按鈕放在技能分頁的標題旁，「物品管理」按鈕放在背包分頁的工具列
   * （拾取篩選／批次分解／保留規則那一列）最後面。
   * 遊戲會不斷重畫面板，所以定時檢查按鈕還在不在，不在就補回去。
   * 按鈕沿用遊戲的 btn sm 樣式；不加 data-act，遊戲自己的點擊處理就不會理它。
   */
  if (first) {
    const addBtn = (host, cls, label, fn, margin) => {
      if (!host || host.querySelector('.' + cls)) return;
      const b = document.createElement('button');
      b.className = 'btn sm ' + cls;
      b.textContent = label;
      if (margin) b.style.marginLeft = margin;
      btnFns[cls] = fn;
      host.appendChild(b);
    };
    /* 按鈕的點擊統一在這裡處理（看按鈕的 class 找對應的功能），
     * 這樣不管按鈕是用 addBtn() 補上去的，還是直接寫在畫面內容裡的（見下面的 wrapPanel），都按得到 */
    const btnFns = {};
    document.addEventListener('click', e => {
      const t = e.target;
      if (!t || !t.closest) return;
      for (const cls of Object.keys(btnFns)) {
        if (t.closest('.' + cls)) { e.stopPropagation(); e.preventDefault(); btnFns[cls](); return; }
      }
    }, true);
    const BAR_CSS = 'display:flex;flex-wrap:wrap;gap:6px 0;margin:0 0 6px -8px';
    /* 「地圖」和「選單」分頁沒有標題可以掛按鈕，而且地圖分頁打怪時會一直重畫，
     * 用計時器補按鈕會一閃一閃。所以把遊戲產生這兩個分頁內容的函式包一層，
     * 直接在內容最前面加一列按鈕，跟著畫面一起出現。list() 回傳這一列要放的 [class, 文字, 功能]。 */
    const wrapPanel = (name, list) => {
      try {
        const real = ui[name];
        if (typeof real !== 'function') return;
        ui[name] = function () {
          const html = String(real.apply(this, arguments));
          if (/<h2[\s>]/.test(html)) return html;
          const items = list();
          for (const it of items) btnFns[it[0]] = it[2];
          return items.length ? '<div class="awBar" style="' + BAR_CSS + '">' + items.map(it => '<button class="btn sm ' + it[0] + '" style="margin-left:8px">' + it[1] + '</button>').join('') + '</div>' + html : html;
        };
      } catch (e) {}
    };
    wrapPanel('p_map', () => CFG.cards ? [['awBtnCards', '卡片進度', openCards]] : []);
    wrapPanel('p_more', () => {
      const a = [];
      if (CFG.backup) a.push(['awBtnBackup', '存檔備份', openBackup]);
      if (CFG.arts) a.push(['awBtnArts', '解鎖三神器', unlockArts]);
      if (CFG.pin && pinOk()) a.push(['awBtnPin', pinnedNow() ? '取消置頂' : '置頂視窗', pinToggle]);
      a.push(['awBtnCfg', '小工具設定', openSettings]);
      return a;
    });
    /* 「技能」和「背包」分頁的按鈕也用同樣的方式直接寫進畫面內容，不靠計時器補：
     * 技能分頁插在標題（h2）的結尾前面；背包分頁插在工具列（class 是 row tools 的那一列，
     * 裡面只有按鈕，所以它後面第一個 </div> 就是這一列的結尾）的結尾前面。
     * 找不到插入的位置（遊戲改版）就原樣輸出，下面的計時器會當後備把按鈕補上。 */
    const wrapHtml = (name, edit) => {
      try {
        const real = ui[name];
        if (typeof real !== 'function') return;
        ui[name] = function () {
          const html = String(real.apply(this, arguments));
          try { return edit(html); } catch (e) { return html; }
        };
      } catch (e) {}
    };
    const btnHtml = (items, margin) => {
      for (const it of items) btnFns[it[0]] = it[2];
      return items.map(it => '<button class="btn sm ' + it[0] + '"' + (margin ? ' style="margin-left:' + margin + '"' : '') + '>' + it[1] + '</button>').join('');
    };
    const insertAt = (html, i, add) => (i < 0 || !add ? html : html.slice(0, i) + add + html.slice(i));
    wrapHtml('p_skill', html => {
      const a = [];
      if (CFG.planner) a.push(['awBtnPlan', '配置模擬', openPlanner]);
      if (oneCellToggle) a.push(['awBtnOne', '單格模式：' + (window.__awOne ? '開' : '關'), oneCellToggle]);
      return insertAt(html, html.indexOf('</h2>'), btnHtml(a, '8px'));
    });
    wrapHtml('p_bag', html => {
      if (!CFG.items) return html;
      const t = html.indexOf('class="row tools"');
      return insertAt(html, t < 0 ? -1 : html.indexOf('</div>', t), btnHtml([['awBtnItems', '物品管理', openItems]], ''));
    });
    try { ui.render(); } catch (e) {}
    /* 按鈕要掛在哪裡：分頁有標題（h2）就掛在標題旁；
     * v0.2.458 之後「地圖」和「選單」分頁沒有標題了，就在分頁最上面自己放一列（awBar）來裝按鈕 */
    const barOf = panel => {
      const h2 = panel.querySelector('h2');
      if (h2) return h2;
      let bar = panel.querySelector('.awBar');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'awBar';
        bar.style.cssText = BAR_CSS;
        panel.insertBefore(bar, panel.firstChild);
      }
      return bar;
    };
    setInterval(() => {
      if (typeof S === 'undefined' || !S || typeof ui === 'undefined') return;
      const panel = document.querySelector('#panel');
      if (!panel) return;
      if (CFG.planner && ui.tab === 'skill') addBtn(panel.querySelector('h2'), 'awBtnPlan', '配置模擬', openPlanner, '8px');
      if (oneCellToggle && ui.tab === 'skill') addBtn(panel.querySelector('h2'), 'awBtnOne', '單格模式：' + (window.__awOne ? '開' : '關'), oneCellToggle, '8px');
      /* 這四個平常已經由 wrapPanel 寫進畫面裡了；這裡是包不到的時候（舊版有標題、或遊戲又改版）的後備 */
      if (CFG.backup && ui.tab === 'more') addBtn(barOf(panel), 'awBtnBackup', '存檔備份', openBackup, '8px');
      if (CFG.cards && ui.tab === 'map') addBtn(barOf(panel), 'awBtnCards', '卡片進度', openCards, '8px');
      if (CFG.arts && ui.tab === 'more') addBtn(barOf(panel), 'awBtnArts', '解鎖三神器', unlockArts, '8px');
      if (CFG.pin && pinOk() && ui.tab === 'more') addBtn(barOf(panel), 'awBtnPin', pinnedNow() ? '取消置頂' : '置頂視窗', pinToggle, '8px');
      if (ui.tab === 'more') addBtn(barOf(panel), 'awBtnCfg', '小工具設定', openSettings, '8px');
      if (CFG.monAuto && !monWrapped && ui.tab === 'map' && typeof MONARCH !== 'undefined') {
        const h3 = [...panel.querySelectorAll('h3')].find(h => h.textContent.indexOf(MONARCH.n) === 0);
        if (h3 && !h3.querySelector('.awMonAuto')) {
          const lab = document.createElement('label');
          lab.className = 'awMonAuto';
          lab.style.cssText = 'margin-left:8px;font-size:12px;font-weight:normal;cursor:pointer;white-space:nowrap';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = monAuto;
          cb.addEventListener('change', () => setMonAuto(cb.checked));
          lab.addEventListener('click', e => e.stopPropagation());
          lab.appendChild(cb);
          lab.appendChild(document.createTextNode(' 打贏後自動接著打'));
          h3.appendChild(lab);
        }
      }
      if (CFG.items && ui.tab === 'bag') addBtn(panel.querySelector('.row.tools') || panel.firstElementChild, 'awBtnItems', '物品管理', openItems);
    }, CFG.btnRefreshMs);
  }

  if (!first) { try { toast('小工具已經啟用：配置模擬在「技能」分頁，物品管理在「背包」分頁的保留規則旁邊', 'lvl'); } catch (e) {} }
})();
