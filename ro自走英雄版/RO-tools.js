javascript:(function awTools() {
  /*
   * 流浪仙境 Ragnarok Wanderer 小工具（書籤版，從自走勇者小工具 V36 改來）
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
   *  15. 省資源：背景時不畫畫面；節能模式（畫面上可拖曳、可收起的「🔋 節能」小按鈕，單格模式開著時也會啟用）降低畫面更新次數、不產生粒子和傷害數字
   *  16. 卡片進度：地圖分頁的按鈕，列出每張地圖怪物卡片的階數、擊殺數和還差多少
   *  17. 小工具設定：選單分頁的按鈕，在遊戲裡改下面這些設定，不用改檔案
   *  10. 單格模式：技能分頁的開關，開啟後寶石只佔一格、輔助寶石不用相鄰就生效
   *  18. 不上傳雲端存檔：小工具設定裡的選項（預設關閉）；自動刷神話進行中也一律不上傳
   *  19. 商人選變異：在商人買技能寶石時跳出視窗，選要原本的形狀或哪一種變異形狀（能力相同）；
   *      商人的「主動技能」也賣自己職業的傳說技能寶石、「輔助技能」也賣穿梭寶石（價格固定，不能自己調整）
   *  20. 指定萃取、指定灌注：煉金的萃取／灌注視窗裡，每條詞綴旁有按鈕，指定萃取這條、或指定用哪顆符文取代這條
   *
   * 流浪仙境版和自走勇者版的差別（遊戲拿掉的系統，功能關閉並從小工具設定裡隱藏，程式留著方便同步，見 RO_GONE）：
   *   - 沒有：11 解鎖三神器、12 無限君主連續挑戰、13 自動刷神話、18 不上傳雲端存檔、19 的傳說寶石、20 指定萃取／灌注
   *   - 物品管理：沒有石板、符文分頁；裝備多顯示精煉、品質、卡片；寶石名稱寫出變異內容；沒放上盤面的寶石都能分解
   *   - 物品持有無上限：遊戲包過的撿裝備 takeItem 改從外層處理（見第 8 項）
   *   - 禁止自動更新：改擋流浪仙境自己的更新檢查（v63／v64／v91）
   *   - 使用書籤時一律不上傳排行榜（無限武鬥場的線上排行 /api/rank，以及引擎原本的 lbSend），不只單格模式
   *   - 商人：穿梭寶石用遊戲的 v5SxPool；變異形狀只有多 1 格、少 1 格（和遊戲的變異規則相同）
   *   - 遊戲的程式是排版過的（有空白），改寫遊戲函式的規則都容許空白；遊戲修補檔包過的函式不重建
   *   - 配置模擬拿掉「建議配裝」（遊戲背包已經有裝備建議）；BOSS 血條的名稱照遊戲上方挑戰按鈕的規則
   *  21. 精煉計算、自動精煉（煉金分頁）  22. 天賦樹搜尋（遊戲的共用天賦樹裡）  23. 收益統計（地圖分頁）
   *  24. 地圖掉落清單（點戰鬥畫面左下角的地圖名稱）——只有流浪仙境版有
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
  const VERSION = 'V9';

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
    gemPrice: 200,          /* 商店一顆技能寶石的Zeny價格（匯入代碼自動補買時用） */
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
    refCalc: true,          /* 煉金分頁加上「精煉計算」按鈕（到目標精煉值的期望花費、自動精煉） */
    refAutoMs: 150,         /* 自動精煉每次之間等幾毫秒 */
    treeFind: true,         /* 遊戲的共用天賦樹標題列加上搜尋框（符合的節點畫粉紅圈，點結果移過去） */
    dropList: true,         /* 點戰鬥畫面左下角的地圖名稱，開啟目前地圖的掉落清單（會掉什麼、機率多少） */
    earn: true,             /* 地圖分頁加上「收益統計」按鈕（每小時 Zeny、經驗、卡片、裝備） */
    eco: true,              /* 省資源（下面幾項的總開關） */
    bgNoDraw: true,         /* 分頁在背景或被蓋住時不畫畫面（看不到，省下繪圖的資源） */
    ecoBtn: true,           /* 畫面上加一顆可拖曳、可收起的「節能模式」小按鈕（降低畫面更新次數、不產生粒子和傷害數字） */
    ecoFps: 15,             /* 節能模式時，畫面每秒更新幾次（0 = 不限制）；遊戲運算速度不受影響 */
    arts: true,             /* 選單分頁加上「解鎖三神器」按鈕 */
    pin: true,              /* 選單分頁加上「置頂視窗」按鈕（把遊戲搬進永遠在最上層的小視窗；要開常駐模式） */
    monAuto: true,          /* 地圖分頁的無限君主加上「打贏後自動接著打」勾選框 */
    monAutoMs: 3000,        /* 打贏無限君主後等幾毫秒再自動挑戰下一場 */
    monLoop: true,          /* 無限君主加上「自動刷神話」按鈕（沒掉神話獨特就自動讀回挑戰前的存檔） */
    monLoopLootMs: 2500,    /* 自動刷神話：打贏後等幾毫秒讓掉落物落地，再收起來檢查 */
    monLoopBatch: 1,        /* 自動刷神話：「每打幾場才讀一次檔」的預設值（開始時還可以再改） */
    shopMut: true,          /* 商人買技能寶石時先選形狀（原形狀或任一種合法的變異形狀） */
    legShop: true,          /* 商人的「主動技能」也賣自己職業的傳說技能寶石（價格固定，見第 19 項的 LEG_PRICE） */
    sxShop: true,           /* 商人的「輔助技能」也賣穿梭寶石（其他職業的輔助寶石；價格固定，見第 19 項的 SX_PRICE） */
    afPick: true,           /* 萃取、灌注視窗的每條詞綴旁加上按鈕：指定萃取這條、指定用哪顆符文取代這條 */
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
  /* 流浪仙境拿掉的系統，對應的功能一律關閉，也不出現在小工具設定裡（程式留著，方便之後跟自走勇者版同步）：
   *   arts      解鎖三神器         v7.9 移除神器欄位
   *   monAuto   無限君主連續挑戰   沒有無限君主（改成無限武鬥場、MVP 武道場，遊戲自己就有自動挑戰）
   *   monLoop   自動刷神話         同上
   *   legShop   商人賣傳說寶石     v7.2 移除傳說寶石（不再掉落，舊的自動分解）
   *   afPick    指定萃取、灌注     v6.2 移除符文石、萃取、灌注（煉金改成精煉、鑲嵌卡片、卡片合成）
   *   noCloud   不上傳雲端存檔     流浪仙境沒有 Google 雲端存檔（GC_ID 是空的）
   *   slateMax  石板上限           v6.2 移除石板 */
  const RO_GONE = ['arts', 'monAuto', 'monLoop', 'monAutoMs', 'monLoopLootMs', 'monLoopBatch', 'legShop', 'afPick', 'noCloud', 'slateMax'];
  for (const k of RO_GONE) { if (typeof CFG[k] === 'boolean') CFG[k] = false; delete CFG_DEF[k]; }

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
    /* 這次是使用者自己點的書籤：框架裡那份看到這個記號才跳出排行榜警告（框架自己重新載入時不跳） */
    window.__awAsk = 1;
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

  /* 小工具視窗裡的按鈕配色。
   * 流浪仙境的按鈕樣式是淺黃底、白字，小工具視窗裡沒有自己寫顏色的按鈕會吃到它，字幾乎看不到（重新讀取、清空、取消…）。
   * 這裡統一給深底淺字；有自己寫顏色的按鈕（黃底深字的「確定」「套用」、選中的構築分頁、寶石按鈕）寫在按鈕上的樣式優先，不受影響。 */
  if (!document.querySelector('#awBtnCss')) {
    const ids = ['awDlg', 'awPlan', 'awItems', 'awBackup', 'awCards', 'awCfg', 'awShopMut', 'awXtrPick', 'awInfPick', 'awRef', 'awEarn', 'awLoopBar'];
    const sel = s => ids.map(id => '#' + id + ' ' + s).join(',');
    const st = document.createElement('style');
    st.id = 'awBtnCss';
    /* 配置模擬的技能盤格子（data-x）也是按鈕，要沿用遊戲的已解鎖／未解鎖樣式，不能改 */
    st.textContent = sel('button:not([data-x])') + '{background:#3a3026;color:#f0e6d2;border:1px solid #8a7a5a;border-radius:4px;text-shadow:none;box-shadow:none;font-family:sans-serif}' +
      sel('button:hover:not(:disabled):not([data-x])') + '{filter:brightness(1.2)}' +
      sel('button:disabled') + '{opacity:.45;cursor:default}' +
      sel('select') + ',' + sel('input:not([type=checkbox]):not([type=radio]):not([type=color])') + '{background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a}' +
      sel('select option') + '{background:#1a1410;color:#f0e6d2}';
    (document.head || document.documentElement).appendChild(st);
  }

  /* 所有功能只在第一次點書籤時安裝 */
  const first = !window.__awTools;
  window.__awTools = 1;

  /* 點書籤時的警告視窗（使用者 2026-10-22 要求）。
   * 常駐模式下，遊戲自己重新整理後小工具會自動重新放進框架，那時候不跳；只有使用者點書籤（外層留下 __awAsk）才跳 */
  let askNow = !inHost;
  try { if (inHost && window.top.__awAsk) { window.top.__awAsk = 0; askNow = true; } } catch (e) {}
  if (askNow) uiAlert('本書簽有封鎖上傳排行榜\n開始單格技能模式請不要試著上榜\n作者有封鎖該ip遊玩的權力!');

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

    /* 最後一次真的由瀏覽器叫到畫面更新的時間。有些情況分頁沒有被標成「隱藏」，瀏覽器卻停止更新畫面
     * （實測：內建瀏覽器的面板收起來時 document.hidden 是 false，requestAnimationFrame 卻完全不會被呼叫），
     * 超過 1 秒沒有畫面更新就當成在背景，改由下面的計時器推動 */
    let lastRaf = performance.now();
    window.requestAnimationFrame = cb => {
      const i = ++id;
      const run = t => { pending.delete(i) && cb(t); };
      pending.set(i, run);
      nativeRaf(t => { lastRaf = performance.now(); run(t); });
      return i;
    };
    window.cancelAnimationFrame = i => { pending.delete(i) || nativeCaf(i); };

    let lastGrab = 0;
    const fire = () => {
      const t = performance.now();
      if (!document.hidden && t - lastRaf < 1000) return;
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

    /* G.boss 有時是頭目本身、有時只是「正在打頭目」的旗標，所以優先找場上帶 boss 標記、還活著的怪 */
    const findBoss = () => {
      try {
        if (!G) return null;
        if (G.boss && typeof G.boss === 'object' && G.boss.hp > 0) return G.boss;
        return G.mobs.find(m => m.boss && m.hp > 0) || null;
      } catch (e) { return null; }
    };

    /* 名稱照遊戲畫面上方「挑戰中」那顆按鈕的規則（engine.js 的頂部列）：
     * 武鬥場顯示「場地名 第幾層」；守護者、試煉用它們自己的名字；其餘用頭目自己的名字（MVP、魔王都會設 bn），
     * 沒有的話用目前地圖的 Boss */
    const bossName = b => {
      try {
        if (G.arena && G.arena.ar) return G.arena.ar.n + (G.tw ? ' 第 ' + G.tw.f + ' 層' : '');
        if (G.guard != null) return gdef(G.guard).n;
        if (G.trial != null) return TRIAL[G.trial].boss;
        return (b && b.bn) || G.bn || curMap().boss;
      } catch (e) { return 'BOSS'; }
    };
    const clockTxt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

    setInterval(() => {
      const b = findBoss();
      if (!b || b.hp <= 0) { bar.style.display = 'none'; return; }

      const pct = Math.max(0, b.hp / b.max);
      hpFill.style.width = pct * 100 + '%';
      shieldFill.style.width = Math.min(1, (b.sh || 0) / b.max) * 100 + '%';

      let text = bossName(b) + '  ' + fmt(Math.ceil(b.hp)) + ' / ' + fmt(b.max) +
        '（' + (pct * 100).toFixed(1) + '%）';
      if (G.boss && G.bossT > 0) text += '  ' + clockTxt(G.bossT);
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
      /* 遊戲設定「不普攻」（S.set.nob）時普攻和普攻上的毒都是 0 */
      const noBasic = !!(S.set && S.set.nob);
      /* 重拳出擊：普攻換成砸拳，另乘一個倍率（遊戲裡先除掉一般暴擊再乘上砸拳自己的暴擊） */
      const pm = n('punch') && typeof punchMods === 'function' ? punchMods() : null;
      const fist = pm ? uv('fist', 0, U.fist) / 100 * (1 + pm.dmg) * (1 + PUNCH.x * pm.extra) * (1 + Math.min(100, M.critRaw + pm.crit) / 100 * ((M.critm + pm.critm) / 100 - 1)) / G0 : 1;
      let basic = noBasic ? 0 : fixedHit ? M.aps : fist * C * M.dmgMul * M.aps * G0 *
        (has('dance') ? (1 + .05 * mom) * (n('actFromMove') ? 1 + .03 * mom : 1) * (1 + mom * n('momDmg')) : 1);
      const p = M.psnHit;
      const stackUnit = C * M.dmgMul * G0 * PSN_K * M.psn * (1 + n('psnRate'));
      let basicStacks = noBasic ? 0 : p.some(t => t >= 1) ? 1 : n('psnHit') ? Math.min(M.psnMax, M.aps * n('psnHit') * PSN_T) : 0;
      const king = fix && U.kingr && acts.filter(g => !SKILLS[g.id].aura).length === 1;
      /* 召喚物的暴擊：沒有 minCrit 天賦時只吃輔助寶石的暴擊，基礎暴傷 150% */
      const minCritF = s => 1 + Math.min(95, (n('minCrit') ? M.crit : 0) + s.crit) / 100 * (((n('minCrit') ? M.critm : 150) + s.critm) / 100 - 1);
      let T = 0;
      const rows = [];
      for (const g of acts) {
        const a = SKILLS[g.id], s = gemMods(g);
        if (a.sus) { if (a.sdps) T += a.sdps(M, s) * M.skillMul * critF2(M, s); continue; }
        if (g.id === 'guard') {
          T += C * M.minMul * GSP.k * (1 + .6 * s.extra) / GSP.atk * M.minRate * (GSP.n + M.minion + s.minion) * (1 + s.dmg) * (1 + n('minDmg')) * minCritF(s);
          continue;
        }
        if (g.id === 'summon') {
          T += C * M.minMul * MIN.k * (1 + .6 * s.extra) / MIN.atk * M.minRate * (MIN.n + M.minion + s.minion) * (1 + s.dmg) * (1 + n('minDmg')) * (1 + n('spell')) * minCritF(s);
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
          HIT_MUL.reduce((t, h) => h.estSk ? t * h.estSk(M, n, a) : t, 1) *
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
      T += basic + stackUnit * basicStacks;
      const cdOfGem = g => SKILLS[g.id].cd * (1 - gemMods(g).cd) * (1 - M.cdr / 100);
      const gChain = acts.find(g => g.id === 'chain');
      if (gChain) { const al = M.ail * (1 + gemMods(gChain).ail); T *= 1 + AIL.shk.v * al * Math.min(1, AIL.shk.t * al / cdOfGem(gChain)); }
      const gVul = acts.find(g => g.id === 'cvul');
      if (gVul) T *= 1 + CRS.vu.v * M.crs * Math.min(1, CRS.vu.t / cdOfGem(gVul));
      /* 詛咒之戒：易傷詛咒變成光環，放在盤上（不一定要啟用）就一直有效 */
      else if (n('crsRing') && placed().some(t => t.id === 'cvul')) T *= 1 + CRS.vu.v * M.crs;
      const gTnt = acts.find(g => g.id === 'taunt');
      if (gTnt && n('tntVul')) T *= 1 + n('tntVul') * Math.min(1, (TNT_T + n('tntT')) / cdOfGem(gTnt));
      if (n('psnVul') && (p.length || acts.some(g => SKILLS[g.id].tg.includes('psn')))) T *= 1 + n('psnVul');
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
     * fuse() 會自己扣灌注石 Lv3 和Zeny、消耗符文、把插槽裝備變成一般裝備。
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
      if (S.ash < ashNeed) { uiAlert('Zeny不夠：需要 ' + ashNeed + '。沒有做任何變更。'); return false; }
      for (const u of gear.equip) {
        const it = allItems().find(o => o.u === u);
        if (!it) { uiAlert('裝備計畫無法執行，沒有做任何變更。\n找不到要換上的裝備 #' + u); return false; }
        if (!canWear(it)) { uiAlert('裝備計畫無法執行，沒有做任何變更。\n等級不足，穿不上 ' + itemName(it)); return false; }
      }
      if (!await uiConfirm('即將執行（裝備穿在構築 ' + (tp + 1) + '）：\n\n' + planLines().join('\n') +
        '\n\n鑲嵌會消耗 ' + fuseItems.length + ' 顆灌注石 Lv3、' + ashNeed + ' Zeny和上面列出的符文，鑲嵌後無法取下、無法復原。\n確定執行？')) return false;

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
     * 所以同一串代碼重複匯入不會重複購買。做法和遊戲商店的購買按鈕相同：扣Zeny、呼叫 giveGem()。 */
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
      if (S.ash < cost) { uiAlert('這份配置需要先買寶石：' + list + '，共 ' + cost + ' Zeny，但你的Zeny不夠。'); return; }
      if (!await uiConfirm('這份配置需要先向商店購買寶石：\n\n' + list + '\n\n共 ' + cost + ' Zeny（你有 ' + fmt(S.ash) + '）。現在購買？\n按取消的話不會購買，缺的寶石會排不上去。')) return;
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
   * 分頁列出裝備、石板、符文、技能寶石，可用關鍵字與數值比較搜尋，再批次分解／鎖定／解鎖；
   * 可切換看「身上」或「共用倉庫」，批次存入或取出。
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
        /* 流浪仙境的裝備另外有基底素質 bx（[{ k 詞綴代號, v 數值 }]），一起當成詞綴，搜尋數值時也比得到 */
        af: it => [...(it.bx || []).map(x => ({ a: x.k, v: x.v })), ...(it.af || [])],
        lines: it => {
          const out = [];
          if (it.wd) out.push('傷害 ' + it.wd[0] + '-' + it.wd[1] + '・攻速 ' + it.wd[2] + '・暴擊 ' + it.wd[3] + '%');
          if (it.arm) out.push('護甲 ' + it.arm);
          if (it.eva) out.push('閃避 ' + it.eva);
          /* 流浪仙境：精煉、品質、卡片插槽和鑲嵌的卡片 */
          const ro = [];
          if (it.ref) ro.push('精煉 +' + it.ref);
          if (it.q != null) ro.push('品質 ' + it.q + '%');
          if (it.cs) ro.push('卡片插槽 ' + (it.cards || []).filter(Boolean).length + '/' + it.cs);
          if (ro.length) out.push(ro.join('・'));
          for (const c of (it.cards || []).filter(Boolean)) {
            let n = c;
            try { const d = V5_CARDS.find(o => o.id === c); if (d) n = d.n; } catch (e) {}
            out.push('卡片：' + n);
          }
          if (it.sock) out.push('插槽 ' + it.sock.n + ' 孔');
          if (it.uq) out.push(uqLine(it));
          for (const x of (it.bx || [])) out.push(afText({ a: x.k, v: x.v }));
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
        /* 流浪仙境的變異除了形狀（sh），還有傷害、冷卻、元素等（mu）；名稱用遊戲的 roGemName（會寫出變異內容） */
        name: it => { try { if (typeof roGemName === 'function') return roGemName(it); } catch (e) {} return SKILLS[it.id].n + (it.sh ? '（變異）' : ''); },
        color: it => SKILLS[it.id].col,
        meta: it => (SKILLS[it.id].leg ? '傳說・' : '') + (it.sx ? '穿梭・' : '') + (SKILLS[it.id].act ? '主動技能' : '輔助寶石'),
        tags: it => [it.x >= 0 ? '配置中' : '未配置', it.sh || it.mu ? '變異' : '一般'],
        af: () => [],
        lines: it => [SKILLS[it.id].d || ''],
        /* 遊戲現在的「分解寶石」（gsMats）沒放上盤面的寶石都能分解，每顆一樣 MUT.ash */
        prot: it => it.x >= 0 ? '配置中' : '',
        ash: () => MUT.ash,
        rank: it => (SKILLS[it.id].leg ? 4 : 0) + (it.sh || it.mu ? 2 : 0) + (SKILLS[it.id].act ? 1 : 0),
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

    /* 流浪仙境 v6.2 拿掉了石板和符文石（舊存檔的會換成 Zeny），這兩個分頁不顯示 */
    if (typeof v62Migrate === 'function') { delete KINDS.slate; delete KINDS.rune; }

    /* ----- 共用倉庫（遊戲 v0.2.730 起）-----
     * 倉庫存在 STASH_KEY，stLoad() 讀出 { it: [{ s: 倉庫編號, k: 'bag'/'slates'/'runes'/'gems', o: 物品本身 }…] }。
     * 切到「倉庫」時清單改列倉庫的物品：每件複製一份、把 u 換成倉庫編號 s（不同角色的物品 u 可能重複），
     * 原本的倉庫紀錄放在 __e。顯示和搜尋沿用 KINDS 的設定，只換掉列出、狀態、保護和分解。
     * 改倉庫一律透過遊戲的 stDo(異動, 改倉庫的函式)：它會寫回倉庫、記異動紀錄（S.sx）、套用到角色並存檔，
     * 戰鬥中（挑戰 BOSS 等）會拒絕。分解倉庫物品得到的Zeny放在異動的 ash 欄位，由遊戲加到角色身上。
     * 存入用 stPut()、取出用 stTake()，和遊戲倉庫頁的按鈕一樣（職業限定、身上空間不足都由遊戲判斷）。 */
    const hasStash = typeof stLoad === 'function' && typeof stDo === 'function' && typeof stPut === 'function' && typeof stTake === 'function';
    const ST_OF = { equip: 'bag', slate: 'slates', rune: 'runes', gem: 'gems' };
    let src = 'me';
    const stashKind = k => {
      const base = KINDS[k], sk = ST_OF[k];
      return Object.assign({}, base, {
        all: () => stLoad().it.filter(e => e.k === sk).map(e => Object.assign({}, e.o, { u: e.s, __e: e })),
        tags: it => ['倉庫', it.lk ? '已鎖定' : '未鎖定'].concat(typeof stCan === 'function' && !stCan(it.__e) ? ['其他職業限定'] : []),
        prot: it => it.lk ? '已鎖定' : it.my ? '神話獨特' : '',
        remove: list => {
          const ids = new Set(list.map(it => it.u)), ash = list.reduce((n, it) => n + base.ash(it), 0);
          return stDo({ ash: ash }, s => { s.it = s.it.filter(e => !ids.has(e.s)); }) ? list.length : 0;
        },
        equip: false
      });
    };
    const kindOf = k => (src === 'stash' ? stashKind(k) : KINDS[k]);
    /* 倉庫物品的鎖定／解鎖：改倉庫裡那份物品的 lk */
    const stashLock = (list, on) => {
      const ids = new Set(list.map(it => it.u));
      return stDo({}, s => { for (const e of s.it) if (ids.has(e.s)) { if (on) e.o.lk = 1; else delete e.o.lk; } });
    };

    let kind = 'equip';
    let K = kindOf(kind);
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
      if (f === '灰燼' || f === 'zeny') return cmp(K.ash(it));
      if (f === '精煉') return cmp(it.ref || 0);
      if (f === '品質') return it.q != null && cmp(it.q);
      if (f === '卡片插槽') return cmp(it.cs || 0);
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
          '<b style="font-size:15px;white-space:nowrap">物品管理</b><span data-r="src"></span><span data-r="tabs"></span><span style="flex:1"></span>' +
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
          '數值：詞綴名稱或 等級／LV、T（階級，越小越好）、Zeny（分解可得）、精煉、品質、卡片插槽、詞綴數、基礎護甲、基礎閃避、武器傷害上限，後面接 &gt; &lt; &gt;= &lt;= = 和數字。' +
        '</details>' +
      '</div>';
    document.body.appendChild(root);
    const q = k => root.querySelector('[data-r="' + k + '"]');
    const elList = q('list'), elSum = q('sum'), elKw = q('kw'), elTabs = q('tabs'), elBar = q('bar'), elSrc = q('src');

    const draw = () => {
      const on = 'background:#ffd84a;color:#2a2118;font-weight:bold';
      elSrc.innerHTML = hasStash ? [['me', '身上'], ['stash', '倉庫']].map(([v, t]) =>
        '<button data-a="src" data-v="' + v + '" style="' + BTN + ';' + (v === src ? on : '') + '">' + t + '</button>').join('') + '<span style="margin:0 4px;color:#6a5a4a">|</span>' : '';
      elTabs.innerHTML = Object.keys(KINDS).map(k =>
        '<button data-a="tab" data-v="' + k + '" style="' + BTN + ';margin-left:3px;' +
        (k === kind ? on : '') + '">' + KINDS[k].label + ' ' + kindOf(k).all().length + '</button>').join('');
      elBar.innerHTML =
        '<button data-a="all" style="' + BTN + '">全選搜尋結果</button>' +
        '<button data-a="none" style="' + BTN + '">取消全選</button>' +
        '<span style="flex:1"></span>' +
        (hasStash ? (src === 'stash' ? '<button data-a="take" style="' + BTN + '">取出到身上</button>' : '<button data-a="put" style="' + BTN + '">存入倉庫</button>') : '') +
        (K.lock ? '<button data-a="lock" style="' + BTN + '">鎖定選取</button><button data-a="unlock" style="' + BTN + '">解鎖選取</button>' : '') +
        '<button data-a="salv" style="' + BTN + ';background:#c8323c;color:#fff;border:1px solid #000;font-weight:bold">分解選取</button>';

      const everything = K.all();
      const list = shown();
      /* 清掉已經不存在的選取 */
      const alive = new Set(everything.map(it => it.u));
      for (const u of [...sel]) if (!alive.has(u)) sel.delete(u);
      const picked = everything.filter(it => sel.has(it.u));
      const ash = picked.filter(it => !K.prot(it)).reduce((n, it) => n + K.ash(it), 0);
      elSum.innerHTML = '顯示 <b>' + list.length + '</b> / 共 ' + everything.length + ' 件　已選 <b style="color:#ffd84a">' + picked.length + '</b> 件，分解可得Zeny <b style="color:#ffd84a">' + fmt(ash) + '</b>　目前Zeny ' + fmt(S.ash);
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
          '<div style="text-align:right;white-space:nowrap">' + (K.ash(it) ? '<small style="color:#a89a84">Zeny ' + K.ash(it) + '</small><br>' : '') +
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
      if (!await uiConfirm('要把裝備的規則改成這樣嗎？\n\n' + rulesText(r) + '\n\n之後撿到不符合保留規則、又在自動分解範圍內的裝備會直接變成Zeny。' + (r.xr ? '' : '\n（這串沒有帶萃取規則，萃取規則維持原樣）'))) return;
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
      if (a === 'tab') { kind = b.dataset.v; K = kindOf(kind); sel.clear(); draw(); return; }
      if (a === 'src') { src = b.dataset.v; K = kindOf(kind); sel.clear(); draw(); return; }
      if (a === 'all') { for (const it of shown()) sel.add(it.u); draw(); return; }
      if (a === 'none') { sel.clear(); draw(); return; }
      const STASH_BUSY = '現在不能動倉庫（挑戰 BOSS 等戰鬥中，或這個分頁已經被其他分頁接手）。';
      if (a === 'lock' || a === 'unlock') {
        if (src === 'stash') { if (!stashLock(picked(), a === 'lock')) uiAlert(STASH_BUSY); draw(); return; }
        for (const it of picked()) { if (a === 'lock') it.lk = 1; else delete it.lk; }
        done(); return;
      }
      if (a === 'put' || a === 'take') {
        const list = picked();
        if (!list.length) { uiAlert('請先勾選要' + (a === 'put' ? '存入' : '取出') + '的物品'); return; }
        const n = a === 'put' ? stPut(ST_OF[kind], list.map(it => it.u)) : stTake(list.map(it => it.u));
        sel.clear(); ui.render(); draw();
        if (n) toast('已' + (a === 'put' ? '存入倉庫 ' : '取出 ') + n + ' 件' + (n < list.length ? '（' + (list.length - n) + ' 件沒辦法' + (a === 'put' ? '存入' : '取出') + '）' : ''), 'lvl');
        else uiAlert(a === 'put' ? '沒有存入任何物品。裝備中、使用中的石板、配置中的寶石、已放入插槽的符文不能存入；戰鬥中也不能動倉庫。'
          : '沒有取出任何物品。其他職業限定的物品不能取出；身上空間不足或戰鬥中也不能取出。');
        return;
      }
      if (a === 'equip') { equipItem(b.dataset.u); saveNow(); ui.render(); draw(); return; }
      if (a === 'salv') {
        const list = picked().filter(it => !K.prot(it));
        const skip = picked().length - list.length;
        if (!list.length) { uiAlert('選取的物品都不能分解（裝備中、使用中、配置中、已鎖定、神話獨特、一般技能寶石都會跳過）'); return; }
        const ash = list.reduce((n, it) => n + K.ash(it), 0);
        if (!await uiConfirm('確定分解 ' + list.length + ' 件' + K.label + '？可得 ' + ash + ' Zeny。' + (skip ? ' 另有 ' + skip + ' 件不能分解，會跳過。' : '') + ' 分解後無法復原。')) return;
        const n = K.remove(list);
        sel.clear();
        done();
        if (n) toast('已分解 ' + n + ' 件，獲得 ' + ash + ' Zeny', 'lvl');
        else uiAlert(src === 'stash' ? STASH_BUSY : '沒有分解任何物品。');
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
   * 備份：把整個存檔物件 S 轉成文字，存一份在瀏覽器（IndexedDB 的 awtools 資料庫），也可以下載成檔案。
   * 還原：把備份寫回遊戲的存檔位置（SAVE_KEY），再重新整理頁面讓遊戲重新載入。
   *   - 寫回前把 TAB.gone 設為 true，遊戲離開頁面時的自動存檔就不會把備份蓋掉。
   *   - 把備份裡的時間改成現在，這樣重新載入時不會被當成離線很久而發放離線收益，
   *     也不會被比較舊的雲端存檔蓋回去。
   *   - 還原前會先把目前的進度自動備份一份，還原錯了可以再還原回來。
   * 瀏覽器裡的備份只留最新的幾份（CFG.backupKeep），清除瀏覽器資料時會一起消失，重要的請下載成檔案。
   * 共用倉庫（遊戲 v0.2.730 起）另外存在 STASH_KEY（ro-wanderer.v3.stash），裡面有倉庫物品、離線角色的Zeny／材料，
   * 以及配合存檔序號 S.sx 的異動紀錄。備份時一起存一份（瀏覽器備份放在 stash 欄位，下載的檔案放在 awStash 欄位，
   * 配裝程式讀檔時會忽略它），還原時另外問要不要連倉庫一起還原。
   *
   * 為什麼用 IndexedDB：localStorage 整個網站只有約 5 MB，而且和遊戲自己的存檔共用。
   * 以前備份放在 localStorage，存檔一大、備份一多就把空間吃光，連遊戲本身都存不進去（遊戲會跳「存檔失敗：儲存空間不足」）。
   * IndexedDB 的空間依硬碟大小而定（通常是好幾 GB），不會和遊戲搶。
   * 舊版留在 localStorage 的備份、自動刷神話的起點、臨時備份，第一次用到時會自動搬過來並從 localStorage 刪掉。
   *
   * 遊戲 v0.2.9xx 起存檔改成「先壓縮再寫入」（lsZip，非同步），寫回存檔時也照它的方式壓縮，
   * 並把它的寫入序號 lsSeq 加一，讓遊戲還沒寫完的那次自動存檔作廢，不會在重新整理前把還原的存檔蓋掉。
   */
  const BK_KEY = 'awtools.backups';
  const EXTRA_BAK = SAVE_KEY + '.bak-claude';
  const STASH_LS = typeof STASH_KEY === 'string' ? STASH_KEY : 'ro-wanderer.v3.stash';
  const stashRaw = () => { try { return localStorage.getItem(STASH_LS); } catch (e) { return null; } };
  const stashN = raw => { try { const o = JSON.parse(raw); return o && Array.isArray(o.it) ? o.it.length : 0; } catch (e) { return 0; } };
  /* 下載用的文字：存檔本身，有倉庫的話多一個 awStash 欄位 */
  const bkFile = (data, stash) => {
    if (!stash) return data;
    try { const o = JSON.parse(data); o.awStash = JSON.parse(stash); return JSON.stringify(o); } catch (e) { return data; }
  };
  /* IndexedDB：一個鍵值表（awtools / kv）。
   * 每份備份各存一筆（鍵是 'bk:' + 備份時間），另外一筆 'bkidx' 只放清單要顯示的資料（時間、標籤、角色、等級、大小、倉庫件數）。
   * 不把所有備份放在同一筆：存檔很大時（物品無上限、背包上萬件），整份清單會超過瀏覽器單筆資料的上限（實測約 100 MB）而整個寫不進去。
   * 存檔內容用 gzip 壓縮後才存（實測 10 MB 的存檔剩 1～2 MB），讀的時候再解開。 */
  let idbP = null;
  const idbOpen = () => idbP || (idbP = new Promise((res, rej) => {
    const r = indexedDB.open('awtools', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => { idbP = null; rej(r.error); };
  }));
  const idbDo = (mode, fn) => idbOpen().then(db => new Promise((res, rej) => {
    const tx = db.transaction('kv', mode), q = fn(tx.objectStore('kv'));
    tx.oncomplete = () => res(q && q.result);
    tx.onerror = tx.onabort = () => rej(tx.error);
  }));
  const idbGet = k => idbDo('readonly', s => s.get(k)).catch(() => undefined);
  const idbSet = (k, v) => idbDo('readwrite', s => s.put(v, k)).then(() => true, () => false);
  const idbDel = k => idbDo('readwrite', s => s.delete(k)).then(() => true, () => false);
  /* 請瀏覽器把這個網站的資料標成「不要自動清掉」（不保證會答應，沒答應也照樣能用） */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
  /* 壓縮成 { gz: 位元組 }；瀏覽器不支援壓縮時就存原本的文字。解開時兩種都認 */
  const zPipe = (data, ts) => new Response(new Blob([data]).stream().pipeThrough(ts)).arrayBuffer();
  const pack = async str => {
    if (typeof CompressionStream !== 'function') return str;
    try { return { gz: new Uint8Array(await zPipe(str, new CompressionStream('gzip'))) }; } catch (e) { return str; }
  };
  const unpack = async v => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    try { return v.gz ? new TextDecoder().decode(await zPipe(v.gz, new DecompressionStream('gzip'))) : null; } catch (e) { return null; }
  };
  /* 把舊版放在 localStorage 的東西壓縮後搬進 IndexedDB，搬成功才從 localStorage 刪掉 */
  const lsMove = async (lsKey, idbKey) => {
    let raw = null;
    try { raw = localStorage.getItem(lsKey); } catch (e) {}
    if (raw === null) return;
    if (await idbSet(idbKey, await pack(raw))) { try { localStorage.removeItem(lsKey); } catch (e) {} }
  };
  const bkMeta = (t, label, name, lvl, data, stash) =>
    ({ t: t, label: label, name: name, lvl: lvl, kb: Math.round((data.length + (stash ? stash.length : 0)) / 1024), st: stash ? stashN(stash) : -1 });
  const bkIdx = async () => { const l = await idbGet('bkidx'); return Array.isArray(l) ? l : []; };
  /* 新增一份備份（rec 是已經壓縮好的 { data, stash }），並刪掉超過 CFG.backupKeep 份的舊備份。
   * 資料、清單、刪舊備份在同一個交易裡做，要嘛全部成功、要嘛全部沒做，不會只寫一半 */
  const bkAdd = async (meta, rec) => {
    const list = await bkIdx();
    while (list.some(x => x.t === meta.t)) meta.t++;
    list.push(meta);
    list.sort((a, b) => b.t - a.t);
    const drop = list.splice(Math.max(1, CFG.backupKeep));
    return idbDo('readwrite', s => {
      s.put(rec, 'bk:' + meta.t);
      for (const d of drop) s.delete('bk:' + d.t);
      s.put(list, 'bkidx');
    }).then(() => true, () => false);
  };
  /* 讀出一份備份的內容（解壓縮後的文字） */
  const bkLoad = async t => {
    const rec = await idbGet('bk:' + t);
    return rec ? { data: await unpack(rec.data), stash: await unpack(rec.stash) } : null;
  };
  /* 舊格式的備份清單（整份清單放在同一筆的陣列）逐份轉成新格式，全部轉完才算成功 */
  const bkImport = async old => {
    for (const o of old) {
      if (!o || typeof o.data !== 'string') continue;
      if ((await bkIdx()).some(x => x.t === o.t)) continue;
      const rec = { data: await pack(o.data) };
      if (o.stash) rec.stash = await pack(o.stash);
      if (!await bkAdd(bkMeta(o.t, o.label || '備份', o.name || '', o.lvl, o.data, o.stash), rec)) return false;
    }
    return true;
  };
  /* 搬家：localStorage 的 awtools.backups（V30 以前），以及 IndexedDB 裡整份放在 backups 的清單（V31 測試版）。
   * 舊清單如果已經壞掉（不是有效的 JSON），裡面的東西本來就讀不出來，一樣刪掉，把空間還給遊戲 */
  let bkMoved = null;
  const bkMigrate = () => bkMoved || (bkMoved = (async () => {
    let raw = null;
    try { raw = localStorage.getItem(BK_KEY); } catch (e) {}
    if (raw !== null) {
      let old = [];
      try { old = JSON.parse(raw); } catch (e) {}
      if (await bkImport(Array.isArray(old) ? old : [])) { try { localStorage.removeItem(BK_KEY); } catch (e) {} }
    }
    const v31 = await idbGet('backups');
    if (v31 !== undefined && (!Array.isArray(v31) || await bkImport(v31))) await idbDel('backups');
    await lsMove(EXTRA_BAK, 'extra');
    await lsMove('awtools.monbase', 'monbase');
  })());
  /* 臨時備份（請 Claude 直接改存檔時留下的）可能之後又被寫進 localStorage，每次讀之前都先搬一次 */
  const extraGet = async () => { await lsMove(EXTRA_BAK, 'extra'); return unpack(await idbGet('extra')); };
  const bkList = async () => { await bkMigrate(); return bkIdx(); };
  /* 備份的新增和刪除都排隊一個一個做，同時進行時清單才不會互相蓋掉 */
  let bkQueue = Promise.resolve();
  const bkRun = fn => (bkQueue = bkQueue.catch(() => {}).then(fn));
  const bkDel = t => bkRun(async () => {
    const list = (await bkIdx()).filter(x => x.t !== t);
    return idbDo('readwrite', s => { s.delete('bk:' + t); s.put(list, 'bkidx'); }).then(() => true, () => false);
  });
  /* 照遊戲的方式寫回存檔：能壓縮就壓縮，並讓遊戲還在進行中的自動存檔作廢。呼叫前要先把 TAB.gone 設成 true */
  const putSave = async o => {
    let v = JSON.stringify(o);
    try { if (typeof lsZip === 'function') v = await lsZip(v); } catch (e) {}
    try { if (typeof lsSeq === 'object' && lsSeq) lsSeq[SAVE_KEY] = (lsSeq[SAVE_KEY] || 0) + 1; } catch (e) {}
    localStorage.setItem(SAVE_KEY, v);
  };
  const bkStamp = t => {
    const d = new Date(t), z = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
  };
  /* 把目前的進度備份到瀏覽器裡，回傳 Promise（是否成功）。
   * 存檔內容在呼叫的當下就先抓好，之後才非同步寫入，所以呼叫完馬上改存檔也不會影響這份備份 */
  const backupNow = label => {
    if (typeof S === 'undefined' || !S) return Promise.resolve(false);
    const data = JSON.stringify(S), stash = stashRaw();
    const meta = bkMeta(Date.now(), label || '手動備份', S.name || '', S.lvl, data, stash);
    return bkRun(async () => {
      await bkMigrate();
      const rec = { data: await pack(data) };
      if (stash) rec.stash = await pack(stash);
      if (await bkAdd(meta, rec)) return true;
      uiAlert('備份沒有存成功（瀏覽器拒絕寫入）。請改用下載成檔案。');
      return false;
    });
  };
  const bkDownload = (text, name, lvl, t) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = 'ro-wanderer_' + (name || 'save') + '_LV' + lvl + '_' + bkStamp(t).replace(/[: ]/g, '-') + '.json';
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
    if (!o || !o.cls || !Array.isArray(o.gems) || !Array.isArray(o.bag)) { uiAlert('這不是有效的流浪仙境存檔。'); return; }
    if (o.awStash) { if (!stash && typeof o.awStash === 'object') stash = JSON.stringify(o.awStash); delete o.awStash; }
    if (!await uiConfirm('要還原成這份存檔嗎？\n\n角色：' + (o.name || '（未命名）') + '　LV' + o.lvl + (when ? '\n備份時間：' + when : '') +
      '\n\n目前的進度會被覆蓋（還原前會先自動備份一份），頁面會重新整理。')) return;
    let withStash = false;
    if (stash && stash !== stashRaw()) {
      withStash = await uiConfirm('這份備份裡也有共用倉庫（' + stashN(stash) + ' 件，現在倉庫有 ' + stashN(stashRaw()) + ' 件）。\n\n' +
        '要連倉庫一起還原嗎？\n・按「確定」（建議）：倉庫也回到備份時的樣子，和這個角色對得起來；但其他角色在備份之後存進倉庫的東西會不見\n' +
        '・按「取消」：只還原這個角色，倉庫維持現在的樣子；備份之後從倉庫拿到這個角色身上的東西會不見，存進倉庫的則會變成兩份');
    }
    if (!await backupNow('還原前自動備份') && !await uiConfirm('目前的進度沒有備份成功，仍然要還原嗎？')) return;
    o.t = Date.now();
    TAB.gone = true;
    const oldStash = stashRaw();
    try {
      if (withStash) localStorage.setItem(STASH_LS, stash);
      await putSave(o);
    } catch (e) {
      try { if (withStash && oldStash !== null) localStorage.setItem(STASH_LS, oldStash); } catch (e2) {}
      TAB.gone = false; uiAlert('寫入存檔失敗（瀏覽器給遊戲存檔的空間不夠），沒有還原，目前的進度也沒有被改動。'); return;
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

    let shown = [];
    const draw = async () => {
      const list = await bkList();
      const extra = await extraGet();
      shown = list;
      elList.innerHTML = list.length ? list.map((b, i) =>
        '<div style="display:flex;gap:8px;align-items:center;padding:4px 6px;border-bottom:1px solid #3a3026;background:#1a1410">' +
          '<div style="flex:1"><b>' + bkStamp(b.t) + '</b> <small style="color:#a89a84">' + String(b.label).replace(/</g, '&lt;') + '</small><br>' +
          '<small style="color:#c8bca8">' + String(b.name || '（未命名）').replace(/</g, '&lt;') + '　LV' + b.lvl + '　' + b.kb + ' KB' +
            (b.st >= 0 ? '　含倉庫 ' + b.st + ' 件' : '') + '</small></div>' +
          '<button data-a="restore" data-i="' + i + '" style="' + BTN + '">還原</button>' +
          '<button data-a="dl" data-i="' + i + '" style="' + BTN + '">下載</button>' +
          '<button data-a="del" data-i="' + i + '" style="' + BTN + '">刪除</button>' +
        '</div>').join('') : '<div style="padding:10px;color:#a89a84;background:#1a1410">瀏覽器裡還沒有備份</div>';
      /* 書籤以外留下的臨時備份（例如請 Claude 直接改存檔時，它在修改前留的那一份），列出來讓使用者自己刪 */
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
      const a = b.dataset.a, it = shown[+b.dataset.i];
      if (a === 'close') { close(); return; }
      if (a === 'save') { saveNow(); if (await backupNow('手動備份')) toast('已備份目前進度', 'lvl'); draw(); return; }
      if (a === 'dlNow') { saveNow(); bkDownload(bkFile(JSON.stringify(S), stashRaw()), S.name, S.lvl, Date.now()); return; }
      if (a === 'xDel') { if (await uiConfirm('刪除這份臨時備份？')) { await idbDel('extra'); try { localStorage.removeItem(EXTRA_BAK); } catch (err) {} draw(); } return; }
      if (a === 'xRestore') { const x = await extraGet(); if (x) restoreSave(x, '臨時備份'); return; }
      if (!it) return;
      /* 用時間認備份（畫面上的順序可能已經跟資料庫不同，例如剛好跑了一次自動備份） */
      if (a === 'del') { if (await uiConfirm('刪除 ' + bkStamp(it.t) + ' 的備份？')) { await bkDel(it.t); draw(); } return; }
      const rec = await bkLoad(it.t);
      if (!rec || !rec.data) { uiAlert('這份備份讀不出來（可能已經被刪掉或損壞）。'); draw(); return; }
      if (a === 'dl') { bkDownload(bkFile(rec.data, rec.stash), it.name, it.lvl, it.t); return; }
      if (a === 'restore') { restoreSave(rec.data, bkStamp(it.t), rec.stash); }
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
      /* 只改有名字的函式（function 名稱(…)）。流浪仙境的修補檔很多是「名稱 = function (…) { … 原本的函式 … }」，
       * 這種沒名字的函式會用到它那支檔案裡的區域變數（例如先存起來的原本函式），重新建立後就找不到那些變數了 */
      if (src.indexOf('[native code]') >= 0 || !/^(async\s+)?function\s*\*?\s*[A-Za-z_$]/.test(src)) continue;
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
        /* 修補檔包過的方法是「function (...a) { … 原本的方法 … }」或箭頭函式，同樣會用到區域變數，不能重建 */
        if (/^(async\s+)?function\s*\(/.test(src) || /^(async\s*)?(\([^)]*\)|[\w$]+)\s*=>/.test(src)) continue;
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
        /* 流浪仙境的程式是排版過的（運算子前後有空格，例如 S.runes.length >= 5e3），所以每條都容許空白 */
        [/(S\.runes\.length(?:\s*\+\s*[\w.]+)?\s*)>=(\s*)(?:1e3|5e3)/g, '$1>=$2' + N],
        [/(?:1e3|5e3)(\s*)-(\s*)S\.runes\.length/g, N + '$1-$2S.runes.length'],
        [/\$\{S\.runes\.length\}\/(?:5000|1000)/g, '${S.runes.length}/' + N],
        [/\bSLATE_MAX\b/g, NS],
        [/(S\.slates\.length\s*)>=(\s*)(?:5e3|500)\b/g, '$1>=$2' + NS],
        [/\$\{S\.slates\.length\}\/(?:5000|500)\b/g, '${S.slates.length}/' + NS],
        /* 共用倉庫（v0.2.730 起）：存入的上限 500 直接寫數字，有「目前件數 stCnt()」和「倉庫物件 .it.length」
         * 兩種寫法，另外還有顯示用的「x/500」和提示文字 */
        [/(stCnt\(\)(?:\s*\+\s*[\w.]+)?\s*)(>=|<=|>)(\s*)500\b/g, '$1$2$3' + NT],
        [/(\.it\.length(?:\s*\+\s*[\w.]+)?\s*)(>=|<=|>)(\s*)500\b/g, '$1$2$3' + NT],
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

    /* 流浪仙境的修補檔把撿裝備 takeItem()、撿石板 takeSlate() 包了一層（分解時多給素材、取回卡片），
     * 原本的函式被收在修補檔自己的變數裡，上面的改寫碰不到，所以在最外面再包一層：
     *   - 背包／石板滿了：呼叫期間先換成空陣列，判斷「滿了沒」時就不會滿，撿到的東西再搬回原本的陣列
     *   - 獨特裝備的階級規則：高階的暫時標成神話（遊戲不會自動分解神話），低階的暫時拿掉「獨特一律保留」那條規則
     * 呼叫完一定換回來。 */
    const wrapTake = (name, list, max) => {
      const inner = window[name];
      if (typeof inner !== 'function') return;
      window[name] = function (t) {
        let bag = null, tmpMy = false, keep = null;
        try {
          if (name === 'takeItem' && CFG.uqKeepHi && t && t.uq && !t.my && UNIQUE[t.uq]) {
            if ((UNIQUE[t.uq].hi || 0) >= CFG.uqKeepHi) { t.my = 1; tmpMy = true; }
            else if (S.set.auto[4] && !t.sock && !t.lk) {
              keep = S.set.keep;
              S.set.keep = (keep || []).filter(g => !(g.c.length === 1 && g.c[0].k === 'uq' && !g.c[0].not && !(g.c[0].u && g.c[0].u.length)));
            }
          }
          if (CFG.noLimit && S[list].length >= max() && S[list].length < +N) { bag = S[list]; S[list] = []; }
        } catch (e) {}
        try { return inner.apply(this, arguments); }
        finally {
          if (bag) { const got = S[list]; S[list] = bag; for (const x of got) bag.push(x); }
          if (tmpMy) delete t.my;
          if (keep) S.set.keep = keep;
        }
      };
      window.__awPatched.push(name + '（外層）');
    };
    wrapTake('takeItem', 'bag', () => (typeof BAG_MAX === 'number' ? BAG_MAX : 5e3));
    wrapTake('takeSlate', 'slates', () => (typeof SLATE_MAX === 'number' ? SLATE_MAX : 5e3));

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
    /* 流浪仙境自己另外做了一套更新檢查（ro-v63／v64／v75／v91）：每 10 分鐘比對 index.html 和 ro-content.js，
     * 有變就倒數（v91 起 30 秒），倒數完停止所有自動挑戰（v91Hold），等這輪打完就存檔並 v63UpdGo() 重新整理。
     * 這裡的做法：
     *   - 檢查照常做（v63UpdCheck），發現新版時把 v64 的倒數標成「已經在處理」（v64Upd.going），它就不會再倒數、也不會叫 v63UpdGo
     *   - v63UpdTick（v91 的倒數）、v63UpdGo（存檔並重新整理）換成只顯示提示
     *   - v91Hold 一律維持 false，不會因為有新版就停掉自動挑戰
     * 提示用遊戲自己的 v63UpdBanner()，要更新時自己重新整理頁面（記得再點一次書籤）。 */
    const updHold = () => {
      try { if (typeof v64Upd === 'object' && v64Upd) v64Upd.going = true; } catch (e) {}
      try { v91Hold = false; } catch (e) {}
      try { if (typeof v63Upd === 'object' && v63Upd) clearTimeout(v63Upd.timer); } catch (e) {}
      try { if (typeof v63UpdBanner === 'function') v63UpdBanner('遊戲有新版本（小工具已擋下自動更新）：方便時請自己重新整理頁面，再點一次書籤'); } catch (e) {}
    };
    if (typeof window.v63UpdGo === 'function') window.v63UpdGo = async () => updHold();
    if (typeof window.v63UpdTick === 'function') window.v63UpdTick = () => { try { if (v63Upd.found) updHold(); } catch (e) {} };
    const realCheck = window.v63UpdCheck;
    if (typeof realCheck === 'function') {
      window.v63UpdCheck = async function () {
        const r = await realCheck.apply(this, arguments);
        try { if (v63Upd.found) updHold(); } catch (e) {}
        return r;
      };
    }
    /* 小工具是在遊戲啟動後才放進來的，如果那之前已經發現新版、開始倒數了，馬上擋下來 */
    try { if (typeof v63Upd === 'object' && v63Upd && v63Upd.found) updHold(); } catch (e) {}
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
   * 佇列放在記憶體的 stQ 和瀏覽器的 ro-wanderer.v3.stq，之後由 stSend() 一次送出。
   * 這裡的處理：
   *   - 開著單格模式（__awOne）或自動刷神話進行中（__awNoStat）時，stEv() 不記錄、stSend() 不送出，並把佇列清空
   *   - 「每日統計」是隔天才結算前一天的總數，所以開過單格模式的那一天會記下來（awtools.stday），
   *     那一天的每日統計就算之後關掉開關也不送
   * 清空佇列只動 ro-wanderer.v3.stq 這一個項目，不會碰存檔（ro-wanderer.v3.v1）。
   * 注意：遊戲啟動時用 setInterval(stSend, 60 秒) 拿走的是原本的 stSend，換不掉；
   * 但它只會送佇列裡的東西，佇列在這裡被擋住、清空，所以送不出東西。 */
  const ST_QUEUE = typeof ST_QK === 'string' ? ST_QK : 'ro-wanderer.v3.stq', ST_TAINT = 'awtools.stday';
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

  /* ===== 封鎖排行榜上傳（流浪仙境版，使用者 2026-10-21 要求：使用書籤時一律不上傳）=====
   * 不管有沒有開單格模式、也沒有設定可以關，小工具裝上之後就不把任何成績和構築傳到排行榜：
   *   - 流浪仙境的線上排行（無限武鬥場，ro-v6 的 v6RkSubmit、ro-v66 的 v66RkPush）直接 fetch('/api/rank') 上傳，
   *     開關 v6RkOn 是常數換不掉，所以在 fetch 這一層擋：往 /api/rank 送資料（POST）一律不送出，
   *     回給遊戲「沒上傳」的結果（打完武鬥場時遊戲會提示「線上排行上傳失敗：小工具已封鎖排行上傳」）。
   *     讀排行（GET）不受影響，排行頁照樣看得到別人的成績。
   *   - 引擎原本的排行榜 lbSend()（無限之塔，流浪仙境已移除，保險起見一起擋）：直接不送，
   *     並把 S.lb 補成「已經傳過了」，之後沒點書籤時也不會補傳這段期間的層數和構築快照。
   * 注意：沒點書籤的時候（例如自己按 F5 後忘了再點）擋不到，那段期間打的武鬥場還是會上傳。 */
  const lbMask = () => {
    try {
      if (!S || !S.lb || !S.tw) return;
      if (S.tw.best > (S.lb.sent || 0)) S.lb.sent = S.tw.best;
      S.lb.sn = S.name;
      S.lb.sb = S.tal.asc || '';
      S.lb.ss = 1;
    } catch (e) {}
  };
  if (first) {
    const realLbSend = window.lbSend;
    if (typeof realLbSend === 'function') window.lbSend = () => { lbMask(); };
    const realFetch = window.fetch;
    if (typeof realFetch === 'function') {
      window.fetch = function (input, init) {
        try {
          const url = typeof input === 'string' ? input : input && input.url;
          const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
          if (method !== 'GET' && method !== 'HEAD' && /\/api\/rank\b/.test(String(url || ''))) {
            return Promise.resolve(new Response(JSON.stringify({ ok: false, error: '小工具已封鎖排行上傳' }), { status: 200, headers: { 'content-type': 'application/json' } }));
          }
        } catch (e) {}
        return realFetch.apply(this, arguments);
      };
    }
    /* 保險：sendBeacon 也擋（遊戲現在沒用它傳排行，但之後改版可能會） */
    try {
      const realBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
      if (realBeacon) navigator.sendBeacon = (url, data) => /\/api\/rank\b/.test(String(url || '')) ? true : realBeacon(url, data);
    } catch (e) {}
  }

  const ONE_KEY = 'awtools.onecell';
  let oneCellToggle = null;
  if (first && CFG.oneCell) {
    window.__awOne = false;
    window.__awShape = g => window.__awOne ? [[0, 0]] : (g.sh || SKILLS[g.id].shape);
    window.__awOnePatched = patchAll([
      [/\bgemShape\(/g, '__awShape('],
      /* gemArt() 畫寶石圖示時直接讀形狀，也要跟著變成一格 */
      [/\((\w+)\s*\|\|\s*(\w+)\.shape\)\.map/g, '(window.__awOne?[[0,0]]:($1||$2.shape)).map']
    ]);
    /* 流浪仙境自己重寫了 gemArt()（上面的改寫碰不到），它的第 4 個參數就是形狀，直接傳一格進去 */
    const realArt = window.gemArt;
    if (typeof realArt === 'function') window.gemArt = function (id, rot, size, shape, sx) { return realArt.call(this, id, rot, size, window.__awOne ? [[0, 0]] : shape, sx); };
    const realLink = window.linkRule;
    if (typeof realLink === 'function') window.linkRule = () => window.__awOne ? 'all' : realLink();
    /* 排行榜的攔截在上面（使用書籤時一律不上傳，不只單格模式）；匿名遊玩統計的攔截也在上面（和自動刷神話共用） */
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
          '這是直接修改遊戲規則，傷害會遠高於正常玩法，修改【可能】被作者封鎖。（使用書籤時本來就一律不上傳線上排行。）\n\n' +
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
  /* 起點放在 IndexedDB 的 monbase（舊版在 localStorage 的 awtools.monbase，第一次用到時搬過來）；
   * 進度 monloop 很小，而且小工具一裝上就要同步讀，所以留在 localStorage */
  const LOOP_KEY = 'awtools.monloop';
  const loopGet = () => { try { return JSON.parse(localStorage.getItem(LOOP_KEY)) || null; } catch (e) { return null; } };
  const loopSet = o => { try { if (o) localStorage.setItem(LOOP_KEY, JSON.stringify(o)); else localStorage.removeItem(LOOP_KEY); } catch (e) {} };
  const mythCount = () => ({ sl: S.slates.filter(t => t.my).length, uq: S.bag.filter(t => t.my).length });
  /* 把目前進度存成起點；回傳 Promise（是否成功）。存檔內容在呼叫當下就抓好 */
  const baseWrite = async () => {
    let data;
    try { saveNow(); data = JSON.stringify(S); } catch (e) { return false; }
    await bkMigrate();
    return idbSet('monbase', await pack(data));
  };
  /* 把起點寫回存檔並重新載入，回傳 Promise（是否成功）。不經過「存檔備份」，所以不會產生自動備份、也不會擠掉原有的備份 */
  const baseRestore = async () => {
    await bkMigrate();
    let o = null;
    try { o = JSON.parse(await unpack(await idbGet('monbase'))); } catch (e) {}
    if (!o || !o.cls || !Array.isArray(o.bag) || !Array.isArray(o.gems)) return false;
    o.t = Date.now();
    TAB.gone = true;
    try { await putSave(o); } catch (e) { TAB.gone = false; return false; }
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
    if (!await baseWrite()) { uiAlert('起點存不進去（瀏覽器拒絕寫入），沒有開始。'); return; }
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
     *     結束的那一刻再清一次，才恢復正常記錄。只動 ro-wanderer.v3.stq，不碰存檔。
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
        baseRestore().then(ok => { if (!ok) stop('讀不到起點存檔，自動刷神話已停止'); });
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
          L.baseM = m; L.seenM = m; L.done = 0; L.baseSl = c.sl; L.baseUq = c.uq;
          if (L.gotSl >= L.goalSl && L.gotAll >= L.goalAll) { stop('自動刷神話達標：神話石板 ' + L.gotSl + ' 塊、合計 ' + L.gotAll + ' 件，共打了 ' + L.tries + ' 場'); return; }
          /* 起點寫完之前先停在 wait，不然下一輪讀回的會是舊起點，剛拿到的神話就沒了 */
          phase = 'wait';
          baseWrite().then(saved => {
            if (!saved) { stop('拿到神話獨特了，但起點更新失敗，為了不弄丟它已停止'); return; }
            loopSet(L); phase = 'start'; at = Date.now() + 1500;
            try { toast('拿到神話獨特！已更新起點，繼續刷', 'lvl', 1); } catch (e) {}
          });
          return;
        }
        next();
      }
    }, 700);
  }

  /* ===== 19、20 共用：小視窗 =====
   * 和存檔備份一樣蓋一層全螢幕的底，內容自己畫。回傳 { root, box, close }。 */
  const awSheet = (id, width) => {
    const old = document.querySelector('#' + id);
    if (old) old.remove();
    const root = document.createElement('div');
    root.id = id;
    root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font:13px/1.5 sans-serif;color:#f0e6d2';
    const box = document.createElement('div');
    box.style.cssText = 'background:#2a2118;border:2px solid #6a5a4a;border-radius:6px;padding:12px;box-sizing:border-box;width:min(' + width + 'px,96vw);max-height:94%;overflow:auto';
    root.appendChild(box);
    const close = () => root.remove();
    root.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); }, true);
    root.addEventListener('click', e => { e.stopPropagation(); if (e.target === root) close(); });
    document.body.appendChild(root);
    return { root: root, box: box, close: close };
  };
  const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const AW_BTN = 'padding:2px 8px;cursor:pointer';
  const AW_GO = 'padding:4px 14px;cursor:pointer;font-weight:bold;background:#ffd84a;color:#2a2118;border:1px solid #000';

  /* ===== 19. 商人選變異 =====
   * 遊戲的商人只賣原本形狀的寶石（購買按鈕 data-act="buy"、data-k="gem:寶石代號"、data-c=價格，按下去呼叫 giveGem）。
   * 這裡在按鈕被遊戲處理之前攔下來，改成跳出視窗讓玩家選形狀：
   *   - 原本的形狀
   *   - 遊戲變異規則（mutShape）可能變出來的所有形狀：同格數換一個形狀、多 1 格（最多 MUT.max 格）、少 1 格（要連在一起）
   * 形狀用遊戲的 polyKey 判斷是不是同一種（只算旋轉，鏡像算不同形狀，和遊戲一樣），座標也照 mutShape 的方式擺正。
   * 買變異形狀時寶石帶 sh（形狀），能力和原本的寶石完全相同，價格照商人的價格。
   * 注意：變異寶石本來只能靠掉落或合成取得，這是直接把寶石加進存檔，修改【可能】被作者封鎖。 */
  const shapeNorm = c => { const o = c.slice().sort((p, q) => p[1] - q[1] || p[0] - q[0])[0]; return c.map(([x, y]) => [x - o[0], y - o[1]]); };
  /* 在形狀旁邊多長一格的所有結果 */
  const shapeGrow = c => {
    const has = new Set(c.map(p => p + '')), out = [];
    for (const [x, y] of c) for (const n of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) if (!has.has(n + '')) { has.add(n + ''); out.push([...c, n]); }
    return out;
  };
  /* 某個格數的所有形狀（以 polyKey 去重），回傳 Map(polyKey → 形狀) */
  const shapeAll = n => {
    let lv = new Map([[polyKey([[0, 0]]), [[0, 0]]]]);
    for (let k = 1; k < n; k++) {
      const nx = new Map();
      for (const c of lv.values()) for (const g of shapeGrow(c)) { const key = polyKey(g); if (!nx.has(key)) nx.set(key, shapeNorm(g)); }
      lv = nx;
    }
    return lv;
  };
  /* 某顆寶石可以選的形狀，分成四組：[標題, [形狀或 null（null 代表原本的形狀）]] */
  const mutChoices = id => {
    const base = SKILLS[id].shape, n = base.length, bk = polyKey(base), max = typeof MUT === 'object' && MUT.max ? MUT.max : 6;
    /* 流浪仙境的變異（ro-mutation.js 的 roMutShapeStep）只有「多 1 格」或「少 1 格」，沒有同格數換形狀 */
    const roMut = typeof roMutShapeStep === 'function';
    const same = roMut ? [] : [...shapeAll(n).entries()].filter(([k]) => k !== bk).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(e => e[1]);
    const uniq = list => { const m = new Map(); for (const c of list) { const k = polyKey(c); if (!m.has(k)) m.set(k, shapeNorm(c)); } return [...m.values()]; };
    const plus = n < max ? uniq(shapeGrow(base)) : [];
    const minus = n > 1 ? uniq(base.map((_, i) => base.filter((p, j) => j !== i)).filter(polyConn)) : [];
    return [['原本的形狀（' + n + ' 格）', [null]], ['同格數換形狀（' + n + ' 格）', same], ['多 1 格（' + (n + 1) + ' 格）', plus], ['少 1 格（' + (n - 1) + ' 格）', minus]].filter(g => g[1].length);
  };
  /* 已經持有幾顆這個形狀；sx 為真時只算穿梭寶石，否則只算一般寶石 */
  const shapeOwned = (id, sh, sx) => {
    const k = polyKey(sh || SKILLS[id].shape);
    return S.gems.filter(g => g.id === id && !g.sx === !sx && polyKey(g.sh || SKILLS[id].shape) === k).length;
  };
  const shapeIcon = (id, sh, px, sx) => {
    try { const a = gemArt(id, 0, 4, sh || undefined, sx ? 1 : undefined); return '<span style="display:inline-block;width:' + (a.W * px) + 'px;height:' + (a.H * px) + 'px">' + a.svg.replace('<svg', '<svg style="display:block;width:100%;height:100%"') + '</span>'; }
    catch (e) { return ''; }
  };
  /* sx 為真：賣的是穿梭寶石（和遊戲掉落的一樣帶 sx:1，外框銀白，可連結自己職業的主動寶石） */
  const openShopMut = (id, price, sx) => {
    const sk = SKILLS[id];
    if (!sk) return false;
    /* 傳說寶石、穿梭寶石遊戲都不會讓它變異（掉落和合成都沒有變異的），所以只賣原本的形狀 */
    const groups = sk.leg || sx ? [['原本的形狀（' + sk.shape.length + ' 格）', [null]]] : mutChoices(id);
    const flat = [];
    for (const g of groups) for (const sh of g[1]) flat.push(sh);
    let pick = 0;
    const { box, close } = awSheet('awShopMut', 600);
    const draw = () => {
      let i = 0;
      box.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:15px">購買 ' + escH(sk.n) + (sx ? '（穿梭）' : sk.leg ? '（傳說）' : '') + '</b>' +
          (groups.length > 1 || groups[0][1].length > 1 ? '<span style="color:#a89a84">選擇形狀（能力都相同）</span>' : '') +
          '<span style="flex:1"></span><button data-a="close" style="' + AW_BTN + '">關閉</button></div>' +
        groups.map(g => '<div style="margin:6px 0 2px;color:#ffd84a">' + g[0] + '</div><div style="display:flex;flex-wrap:wrap;gap:4px">' +
          g[1].map(sh => {
            const k = i++, own = shapeOwned(id, sh, sx);
            return '<button data-a="pick" data-i="' + k + '" title="已持有 ' + own + ' 顆" style="cursor:pointer;padding:4px;min-width:52px;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:' + (k === pick ? '#5a4a20' : '#1a1410') + ';border:2px solid ' + (k === pick ? '#ffd84a' : '#3a3026') + ';color:#f0e6d2">' +
              shapeIcon(id, sh, 2, sx) + '<small style="color:#a89a84">' + (own ? '持有 ' + own : '&nbsp;') + '</small></button>';
          }).join('') + '</div>').join('') +
        '<div style="display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap">' +
          '<span>數量</span><input data-r="n" type="number" min="1" value="1" style="width:70px;padding:3px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a">' +
          '<span>單價 ' + fmt(price) + ' Zeny・你有 ' + fmt(S.ash) + '</span><span style="flex:1"></span>' +
          '<button data-a="buy" style="' + AW_GO + '">購買</button></div>' +
        (sx ? '<div style="color:#ffb070;font-size:12px;margin-top:6px">穿梭寶石是其他職業的輔助寶石，可連結你職業的主動寶石；本來只能從怪物身上極少量掉落（一般怪約 1/15000、菁英 1/2500、頭目 1/150），商人賣穿梭寶石是小工具加的，修改【可能】被作者封鎖。</div>' :
          sk.leg ? '<div style="color:#ffb070;font-size:12px;margin-top:6px">傳說寶石本來只能從 90 級以上的菁英、Boss 掉落，商人賣傳說寶石是小工具加的，修改【可能】被作者封鎖。</div>' :
          flat[pick] ? '<div style="color:#ffb070;font-size:12px;margin-top:6px">變異寶石本來只能靠掉落或合成取得，買變異形狀是小工具直接把寶石加進存檔，修改【可能】被作者封鎖。</div>' : '');
    };
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { close(); return; }
      if (a === 'pick') { pick = +b.dataset.i; const n = box.querySelector('[data-r="n"]').value; draw(); box.querySelector('[data-r="n"]').value = n; return; }
      if (a === 'buy') {
        const n = Math.max(1, Math.floor(+box.querySelector('[data-r="n"]').value || 1));
        const can = Math.min(n, Math.floor(S.ash / price));
        if (can < 1) { uiAlert('Zeny不夠（需要 ' + fmt(price) + '，你有 ' + fmt(S.ash) + '）。'); return; }
        const sh = flat[pick];
        for (let k = 0; k < can; k++) {
          S.ash -= price;
          if (sx) S.gems.push({ u: uid(), id: id, x: -1, y: -1, rot: 0, sx: 1 });
          else if (sh) S.gems.push({ u: uid(), id: id, x: -1, y: -1, rot: 0, sh: sh.map(p => p.slice()) });
          else giveGem(id);
        }
        try { ui.badge('skill', 1); } catch (err) {}
        markDirty();
        try { ui.render(); } catch (err) {}
        toast('購買成功：' + sk.n + (sx ? '（穿梭）' : sh ? '（變異 ' + sh.length + ' 格）' : '') + ' ×' + can + (can < n ? '（Zeny只夠買 ' + can + ' 顆）' : ''), 'lvl');
        draw();
      }
    });
    draw();
    return true;
  };
  if (first && CFG.shopMut) {
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest && e.target.closest('[data-act="buy"]');
      if (!b || b.disabled || !/^gem:/.test(b.dataset.k || '')) return;
      const id = b.dataset.k.slice(4), price = +b.dataset.c;
      if (typeof SKILLS === 'undefined' || !SKILLS[id] || !(price >= 0)) return;
      e.stopPropagation(); e.preventDefault();
      openShopMut(id, price);
    }, true);
  }
  /* 商人加賣的寶石：
   *   - 「主動技能」最前面：自己職業的傳說技能寶石（SKILLS 裡有 leg 的；遊戲新增傳說寶石會自動出現）
   *   - 「輔助技能」最前面：穿梭寶石，也就是其他職業的輔助寶石（遊戲的 sxPool(職業)；和掉落的一樣帶 sx:1）
   * 價格是故意設高的固定值，寫死在這裡，不放進小工具設定（設定會存在瀏覽器裡，玩家改得到）。
   * 按鈕不用遊戲的購買按鈕（data-act="buy" 會照按鈕上寫的 data-c 扣Zeny，改網頁就能改價格），
   * 而是自己的按鈕，按下去一律用這裡的價格，開購買視窗（數量、Zeny不夠時只買得起的份）。
   * 商品的樣子照抄遊戲商人的格式（.ware）。遊戲每次重畫商人頁面都會把格子換掉，所以每隔一下檢查一次，不見了就再加。 */
  const LEG_PRICE = 1000000, SX_PRICE = 1000000;
  /* 穿梭寶石的清單：流浪仙境掉落用的是自己的 v5SxPool(職業)（依職業的主動技能挑效果不重複的輔助），
   * 和引擎原本的 sxPool 完全不同，有它就用它，才會跟遊戲掉落的一樣 */
  const sxList = () => {
    try { if (typeof v5SxPool === 'function') return v5SxPool(S.cls); } catch (e) {}
    try { if (typeof sxPool === 'function') return sxPool(S.cls); } catch (e) {}
    return [];
  };
  if (first && (CFG.legShop || CFG.sxShop)) {
    const exWare = (id, sx) => {
      /* 商人格子是淺色底，字要用深一點的顏色：外框用亮色，文字用同色系的深色 */
      const sk = SKILLS[id], price = sx ? SX_PRICE : LEG_PRICE, ok = S.ash >= price, col = sx ? '#8a9ab8' : '#e8b030', txt = sx ? '#3a4a6a' : '#9a6400';
      let art = '';
      try { const a = gemArt(id, 0, 5, undefined, sx ? 1 : undefined), k = Math.max(1, Math.min(3, Math.floor(56 / Math.max(a.W, a.H)))); art = '<span class="shape" style="width:' + (a.W * k) + 'px;height:' + (a.H * k) + 'px">' + a.svg + '</span>'; } catch (e) {}
      let tip = sk.d || '';
      try { tip = tagText(sk) + (sk.cd ? '・冷卻 ' + sk.cd + ' 秒' : '') + '・' + sk.d; } catch (e) {}
      const own = S.gems.filter(g => g.id === id && !g.sx === !sx).length;
      const sub = sx ? '穿梭・' + (sk.cls && CLASS[sk.cls] ? CLASS[sk.cls].n : '其他職業') : '傳說';
      return '<div class="ware awExWare" style="box-shadow:0 0 0 2px ' + col + ' inset">' +
        '<div class="wwell">' + art + (own ? '<span class="own px">×' + own + '</span>' : '') + '</div>' +
        '<div class="wn"><span class="tip" tabindex="0" data-tip="' + escH(tip) + '">' + escH(sk.n) + '</span></div>' +
        '<div class="ws"><span style="color:' + txt + ';font-weight:bold">' + sub + '</span></div>' +
        '<button class="btn sm awExBuy ' + (ok ? 'primary' : '') + '" data-id="' + id + '" data-sx="' + (sx ? 1 : 0) + '" ' + (ok ? '' : 'disabled') + ' aria-label="' + price + ' Zeny購買">' +
          '<img class="ashI" src="' + shopIcon('ash') + '" alt="Zeny"><span class="px">' + fmt(price) + '</span></button></div>';
    };
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest && e.target.closest('.awExBuy');
      if (!b) return;
      e.stopPropagation(); e.preventDefault();
      if (b.disabled) return;
      const id = b.dataset.id, sx = b.dataset.sx === '1';
      if (typeof SKILLS === 'undefined' || !SKILLS[id]) return;
      if (sx ? !CFG.sxShop || !sxList().includes(id) : !CFG.legShop || !SKILLS[id].leg || SKILLS[id].cls !== S.cls) return;
      openShopMut(id, sx ? SX_PRICE : LEG_PRICE, sx);
    }, true);
    const exList = v => {
      if (v === 'act' && CFG.legShop) return Object.keys(SKILLS).filter(k => SKILLS[k].leg && SKILLS[k].cls === S.cls).map(k => [k, false]);
      if (v === 'sup' && CFG.sxShop) return sxList().filter(k => SKILLS[k]).map(k => [k, true]);
      return [];
    };
    const exSig = (v, list) => v + '|' + list.map(([k, sx]) => k + ':' + S.gems.filter(g => g.id === k && !g.sx === !sx).length).join(',') + '|' + (S.ash >= LEG_PRICE ? 1 : 0) + (S.ash >= SX_PRICE ? 1 : 0);
    /* 遊戲重畫商人頁面（打怪時 Zeny、掉落一直變，常常重畫）會把加上去的格子洗掉，計時器補回來之前會閃一下不見。
     * 所以直接包住產生商人頁面的 ui.m_shop()，在遊戲產生的內容裡就先放好；下面的計時器只是包不到時的後備 */
    try {
      const realShop = ui.m_shop;
      if (typeof realShop === 'function') {
        ui.m_shop = function () {
          const html = realShop.apply(this, arguments);
          try {
            if (typeof html !== 'string' || typeof S === 'undefined' || !S) return html;
            const v = this.shopV || 'pot', list = exList(v), at = html.indexOf('<div class="shopG">');
            if (!list.length || at < 0) return html;
            const open = '<div class="shopG" data-aw-ex="' + escH(exSig(v, list)) + '">';
            return html.slice(0, at) + open + list.map(([k, sx]) => exWare(k, sx)).join('') + html.slice(at + '<div class="shopG">'.length);
          } catch (e) { return html; }
        };
      }
    } catch (e) {}
    setInterval(() => {
      try {
        if (typeof S === 'undefined' || !S || ui.tab !== 'more' || ui.moreView !== 'shop') return;
        const v = ui.shopV || 'pot';
        const grid = document.querySelector('#panel .shopG');
        if (!grid) return;
        const list = exList(v);
        const sig = exSig(v, list);
        if (grid.dataset.awEx === sig && (!list.length || grid.querySelector('.awExWare'))) return;
        grid.querySelectorAll('.awExWare').forEach(el => el.remove());
        grid.insertAdjacentHTML('afterbegin', list.map(([k, sx]) => exWare(k, sx)).join(''));
        grid.dataset.awEx = sig;
      } catch (e) {}
    }, CFG.btnRefreshMs);
  }

  /* ===== 20. 指定萃取、指定灌注 =====
   * 遊戲的萃取（xtrOne）會依詞綴權重隨機取出一條；灌注（doInfuse）會隨機挑一條詞綴被符文取代。
   * 這裡在萃取、灌注視窗的每條詞綴旁加按鈕，讓玩家指定那一條。做法是把遊戲的這兩個函式改一小段：
   *   - xtrOne：隨機挑詞綴的 pickW(裝備.af, …) 前面先看 __awXtrAf（指定第幾條），有指定就用那條
   *   - doInfuse：「可以被取代的詞綴清單」infLines(…) 在有指定 __awInfLine 時換成只有那一條
   * 其餘全部照遊戲自己的程式跑：扣萃取石／灌注石和Zeny、成功率、升階機率、取出獨特效果的機率、保護石、奇蹟、
   * 同一件裝備的隨機序列（rngItem），結果視窗也是遊戲自己的。指定完就清掉，批次萃取等其他地方不受影響。
   * 萃取的機率（遊戲常數 XTR、PROT_KEEP）：
   *   成功率 Lv1 50%、Lv2 以上 100%；失敗時裝備一樣會消失、拿不到符文（保護石有機會保留裝備）
   *   升階（取出的符文高一階，數值照原本在區間裡的位置換算）只有 Lv4 有，25%；奇蹟狀態加 Lv4 必定升階；T0 不能再升
   *   獨特裝備用 Lv3、Lv4 時有 5% 改成取出獨特效果（不是指定的詞綴）；奇蹟狀態的獨特裝備必定取出獨特效果
   * 注意：這是改變遊戲的隨機規則，修改【可能】被作者封鎖。 */
  if (first && CFG.afPick) {
    const patchOne = (name, re, to) => {
      const f = window[name];
      if (typeof f !== 'function') return false;
      const src = Function.prototype.toString.call(f), out = src.replace(re, to);
      if (out === src) return false;
      try { window[name] = (0, eval)('(' + out + ')'); return true; } catch (e) { return false; }
    };
    window.__awAfPatch = {
      xtr: patchOne('xtrOne', /pickW\((\w+)\.af,(\w+)=>AFFIX\[\2\.a\]\.w\)/, '(window.__awXtrAf!=null&&$1.af[window.__awXtrAf]||pickW($1.af,$2=>AFFIX[$2.a].w))'),
      inf: patchOne('doInfuse', /(\w+)=infLines\((\w+),(\w+),!!\2\.mir\)/, '$1=(window.__awInfLine!=null&&window.__awInfLine<$2.af.length?[window.__awInfLine]:infLines($2,$3,!!$2.mir))')
    };
    const afText = a => { try { return AFFIX[a.a].f(a.v); } catch (e) { return a.a; } };
    const pct = v => (Math.round(v * 10) / 10) + '%';
    /* 目前萃取／灌注視窗裡的那件裝備 */
    const axItem = () => { try { const md = ui.alchMd(); return ui.alchAll(md).find(t => t.u === ui.alchSel) || null; } catch (e) { return null; } };
    /* 換算升階後的數值：照原本在區間裡的位置（和遊戲 xtrOne 一樣） */
    const upValue = a => {
      const [r, c] = tierRange(a.a, a.t), d = c > r ? (a.v - r) / (c - r) : 1, [f, p] = tierRange(a.a, a.t - 1);
      return Math.round(f + d * (p - f));
    };
    /* 執行完遊戲的動作後重畫畫面，並把遊戲記下的結果（ui.alchRes）用小視窗講清楚。
     * 萃取完裝備通常會消失，遊戲的萃取視窗會直接關掉，不另外說明的話玩家看不到拿到什麼 */
    const showGameResult = before => {
      try { ui.render(); } catch (e) {}
      try { ui.axOpen(); } catch (e) {}
      const r = ui.alchRes;
      if (!r || r === before) { uiAlert('沒有執行（材料、Zeny不夠，或裝備狀態不符合）。'); return; }
      const lines = [r.msg || ''];
      if (r.k === 'x') {
        for (const g of r.got || []) { try { lines.push('獲得：' + (g.uq ? '獨特 ' : 'T' + g.t + ' ') + runeDesc(g)); } catch (e) {} }
        for (const n of r.notes || []) lines.push(n);
      } else if (r.k === 'i') {
        if (r.old) lines.push('取代：T' + r.old.t + ' ' + afText(r.old));
        if (r.nw) lines.push('變成：T' + r.nw.t + ' ' + afText(r.nw));
        if (r.uq) { try { lines.push('獲得獨特效果：' + UNIQUE[r.uq].n); } catch (e) {} }
        if (r.mir) lines.push('奇蹟生效');
      }
      uiAlert(lines.filter(Boolean).join('\n'));
    };

    const openXtrPick = j => {
      const t = axItem();
      if (!t || !t.af[j]) return;
      const a = t.af[j], uqHas = uqKey(t) && !t.my, mir = !!t.mir, cost = ALCH_ASH.x(t.ilvl);
      const stones = ['x1', 'x2', 'x3', 'x4'];
      let st = stones.find(k => S.mat[k] > 0 && k === ui.alchOpt.x) || stones.slice().reverse().find(k => S.mat[k] > 0) || null;
      let prot = ui.alchOpt.p && S.mat[ui.alchOpt.p] > 0 ? ui.alchOpt.p : '';
      const { box, close } = awSheet('awXtrPick', 520);
      const draw = () => {
        const lv = st ? MATS[st].l : 0, ok = XTR.ok[lv] || 0;
        const upP = a.t >= 1 ? (mir && lv === 4 ? 100 : XTR.up[lv] || 0) : 0;
        const uqP = uqHas ? (mir ? 100 : XTR.uq[lv] || 0) : 0;
        const getP = ok * (1 - uqP / 100);
        const runesFull = S.runes.length >= Math.max(5000, (CFG.noLimit ? CFG.itemMax : 0));
        box.innerHTML =
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:15px">指定萃取</b><span style="flex:1"></span><button data-a="close" style="' + AW_BTN + '">關閉</button></div>' +
          '<div style="background:#1a1410;padding:6px 8px;border-radius:4px">' + escH(itemName(t)) + '<br><b style="color:#7dffc8">T' + a.t + '　' + escH(afText(a)) + '</b></div>' +
          '<div style="margin:8px 0 2px;color:#ffd84a">萃取石</div>' +
          stones.map(k => {
            const l = MATS[k].l, has = S.mat[k] || 0;
            const desc = ['成功率 ' + XTR.ok[l] + '%'];
            if (XTR.up[l] || (mir && l === 4)) desc.push(a.t >= 1 ? ((mir && l === 4) ? '奇蹟：必定升階' : XTR.up[l] + '% 升階') : '已是 T0，不會升階');
            if (uqHas && (XTR.uq[l] || mir)) desc.push((mir ? '100' : XTR.uq[l]) + '% 改取出獨特效果');
            return '<label style="display:flex;gap:6px;align-items:center;padding:3px 6px;margin:2px 0;background:' + (st === k ? '#3a3020' : '#1a1410') + ';cursor:' + (has ? 'pointer' : 'not-allowed') + ';opacity:' + (has ? 1 : 0.45) + '">' +
              '<input type="radio" name="awxs" data-a="st" data-k="' + k + '" ' + (st === k ? 'checked' : '') + ' ' + (has ? '' : 'disabled') + '>' +
              '<b>Lv' + l + '</b><span style="flex:1">' + desc.join('・') + '</span><span>X' + has + '</span></label>';
          }).join('') +
          '<div style="margin:8px 0 2px;color:#ffd84a">保護石（失敗或萃取後保留裝備）</div>' +
          [['', '不用', '', 1], ['p1', MATS.p1.n, '保留 ' + PROT_KEEP.p1 + '%', S.mat.p1 || 0], ['p2', MATS.p2.n, '保留 ' + PROT_KEEP.p2 + '%', S.mat.p2 || 0]].map(([k, n, d, has]) =>
            '<label style="display:flex;gap:6px;align-items:center;padding:3px 6px;margin:2px 0;background:' + (prot === k ? '#3a3020' : '#1a1410') + ';opacity:' + (has ? 1 : 0.45) + '">' +
              '<input type="radio" name="awxp" data-a="pr" data-k="' + k + '" ' + (prot === k ? 'checked' : '') + ' ' + (has ? '' : 'disabled') + '>' +
              '<span style="flex:1">' + n + (d ? '・' + d : '') + '</span>' + (k ? '<span>X' + has + '</span>' : '') + '</label>').join('') +
          (st ? '<div style="background:#1a1410;padding:6px 8px;border-radius:4px;margin-top:8px;font-size:12px;line-height:1.7">' +
            '取出這條：<b style="color:#7dffc8">' + pct(getP * (1 - upP / 100)) + '</b>　T' + a.t + ' ' + escH(afText(a)) + '<br>' +
            (upP ? '取出並升階：<b style="color:#ffd84a">' + pct(getP * upP / 100) + '</b>　T' + (a.t - 1) + ' ' + escH(afText({ a: a.a, v: upValue(a) })) + '<br>' : '') +
            (uqP ? '改取出獨特效果：<b style="color:#ffb070">' + pct(ok * uqP / 100) + '</b><br>' : '') +
            (ok < 100 ? '失敗（裝備消失、沒有符文）：<b style="color:#ff5a6a">' + pct(100 - ok) + '</b><br>' : '') +
            (prot ? '不論成功失敗，' + PROT_KEEP[prot] + '% 機率保留裝備' : '萃取後裝備會消失') +
          '</div>' : '<div style="color:#ff5a6a;margin-top:8px">沒有萃取石，可到「合成」製作。</div>') +
          (mir ? '<div style="color:#e8f0ff;font-size:12px;margin-top:4px">這件裝備有奇蹟狀態，這次萃取會用掉。</div>' : '') +
          (runesFull ? '<div style="color:#ff5a6a;font-size:12px;margin-top:4px">符文石已滿，不能萃取。</div>' : '') +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span>消耗 ' + fmt(cost) + ' Zeny（你有 ' + fmt(S.ash) + '）</span><span style="flex:1"></span>' +
            '<button data-a="go" style="' + AW_GO + '" ' + (st && S.ash >= cost && !runesFull && !t.lk ? '' : 'disabled') + '>萃取這條</button></div>' +
          (t.lk ? '<div style="color:#ff5a6a;font-size:12px">裝備已鎖定，請先解鎖。</div>' : '') +
          '<div style="color:#a89a84;font-size:12px;margin-top:6px">指定詞綴是小工具改變遊戲的隨機規則，修改【可能】被作者封鎖。</div>';
      };
      box.addEventListener('change', e => {
        const r = e.target;
        if (r.dataset.a === 'st') { st = r.dataset.k; draw(); }
        if (r.dataset.a === 'pr') { prot = r.dataset.k; draw(); }
      });
      box.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        if (b.dataset.a === 'close') { close(); return; }
        if (b.dataset.a !== 'go') return;
        const t2 = axItem();
        if (t2 !== t || t.af[j] !== a) { uiAlert('裝備已經變了，請重新開啟。'); close(); return; }
        ui.alchOpt.x = st;
        ui.alchOpt.p = prot || 0;
        ui.mirPick = false;
        const before = ui.alchRes;
        window.__awXtrAf = j;
        try { doAlch(); } catch (err) {} finally { window.__awXtrAf = null; }
        close();
        showGameResult(before);
      });
      draw();
    };

    const openInfPick = j => {
      const t = axItem();
      if (!t || !t.af[j]) return;
      const a = t.af[j], cost = ALCH_ASH.i(t.ilvl);
      const all = S.runes.filter(r => !isStaged(r.u) && (r.uq ? uqInfFit(t, r) : AFFIX[r.a] && AFFIX[r.a].s.includes(t.slot))).sort(runeByTier);
      let sel = null, q = '';
      /* 遊戲的符文說明（runeDesc）不含階級，前面補上 T 幾或「獨特」，清單和搜尋都用這個 */
      const runeLabel = x => { let d = ''; try { d = runeDesc(x); } catch (e) {} return (x.uq ? '獨特 ' : 'T' + x.t + ' ') + d; };
      const { box, close } = awSheet('awInfPick', 560);
      const LIMIT = 300;
      const draw = () => {
        const r = all.find(x => x.u === sel) || null;
        const stone = r ? (r.uq ? 'i4' : infStone(t)) : null;
        const dv = r && !r.uq && AFFIX[r.a].dv != null && t.af.some((x, k) => k !== j && AFFIX[x.a].dv != null);
        const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const list = all.filter(x => { const s = runeLabel(x).toLowerCase(); return words.every(w => s.indexOf(w) >= 0); });
        box.innerHTML =
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:15px">指定灌注</b><span style="flex:1"></span><button data-a="close" style="' + AW_BTN + '">關閉</button></div>' +
          '<div style="background:#1a1410;padding:6px 8px;border-radius:4px">' + escH(itemName(t)) + '<br>要被取代：<b style="color:#ff9a8a">T' + a.t + '　' + escH(afText(a)) + '</b></div>' +
          '<div style="display:flex;gap:6px;align-items:center;margin:8px 0 4px"><span style="color:#ffd84a">選擇符文石</span><span style="color:#a89a84">（' + list.length + ' / ' + all.length + ' 顆可灌注到這個部位）</span></div>' +
          '<input data-r="q" placeholder="搜尋，例如：暴擊 T1" value="' + escH(q) + '" style="width:100%;box-sizing:border-box;padding:4px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a">' +
          '<div data-r="list" style="max-height:min(320px,40vh);overflow:auto;margin-top:4px;border:1px solid #3a3026">' +
            (list.length ? list.slice(0, LIMIT).map(x =>
              '<button data-a="sel" data-u="' + x.u + '" style="display:block;width:100%;text-align:left;cursor:pointer;padding:3px 6px;border:0;border-bottom:1px solid #3a3026;background:' + (x.u === sel ? '#5a4a20' : '#1a1410') + ';color:#f0e6d2">' +
              escH(runeLabel(x)) + '</button>').join('') + (list.length > LIMIT ? '<div style="padding:4px 6px;color:#a89a84">還有 ' + (list.length - LIMIT) + ' 顆，請用搜尋縮小範圍</div>' : '')
            : '<div style="padding:6px;color:#a89a84">沒有符合的符文石。</div>') +
          '</div>' +
          (r ? '<div style="background:#1a1410;padding:6px 8px;border-radius:4px;margin-top:8px;font-size:12px;line-height:1.7">' +
              'T' + a.t + ' ' + escH(afText(a)) + '　→　<b style="color:#7dffc8">' + escH(runeLabel(r)) + '</b><br>' +
              '必定取代這一條（遊戲原本是隨機挑一條）' +
              (r.uq ? '<br>獨特效果符文：這條詞綴會被拿掉，裝備獲得獨特效果' : '') +
            '</div>' : '') +
          (dv ? '<div style="color:#ff5a6a;font-size:12px;margin-top:4px">一件裝備最多一條神眷詞綴。</div>' : '') +
          (r && !stone ? '<div style="color:#ff5a6a;font-size:12px;margin-top:4px">' + (t.uq ? '獨特裝備需要灌注石 Lv2 以上。' : '沒有灌注石，可到「合成」製作。') + '</div>' : '') +
          (r && r.uq && !(S.mat.i4 > 0) ? '<div style="color:#ff5a6a;font-size:12px;margin-top:4px">獨特效果需要灌注石 Lv4。</div>' : '') +
          (t.mir ? '<div style="color:#e8f0ff;font-size:12px;margin-top:4px">這件裝備有奇蹟狀態，這次灌注會用掉（指定取代時奇蹟沒有額外效果）。</div>' : '') +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span>' + (stone ? '消耗 ' + MATS[stone].n + '（X' + (S.mat[stone] || 0) + '）、' : '') + fmt(cost) + ' Zeny（你有 ' + fmt(S.ash) + '）</span><span style="flex:1"></span>' +
            '<button data-a="go" style="' + AW_GO + '" ' + (r && stone && S.mat[stone] > 0 && S.ash >= cost && !dv ? '' : 'disabled') + '>灌注到這條</button></div>' +
          '<div style="color:#a89a84;font-size:12px;margin-top:6px">指定詞綴是小工具改變遊戲的隨機規則，修改【可能】被作者封鎖。</div>';
      };
      box.addEventListener('input', e => {
        if (e.target.dataset.r !== 'q') return;
        q = e.target.value;
        const pos = e.target.selectionStart;
        draw();
        const inp = box.querySelector('[data-r="q"]');
        inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (err) {}
      });
      box.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        const act = b.dataset.a;
        if (act === 'close') { close(); return; }
        if (act === 'sel') { const sc = box.querySelector('[data-r="list"]').scrollTop; sel = +b.dataset.u; draw(); box.querySelector('[data-r="list"]').scrollTop = sc; return; }
        if (act !== 'go') return;
        const t2 = axItem();
        if (t2 !== t || t.af[j] !== a) { uiAlert('裝備已經變了，請重新開啟。'); close(); return; }
        ui.infR = sel;
        ui.sealJ = null;
        ui.sealPick = false;
        ui.mirPick = false;
        const before = ui.alchRes;
        window.__awInfLine = j;
        try { doInfuse(); } catch (err) {} finally { window.__awInfLine = null; }
        close();
        showGameResult(before);
      });
      draw();
    };

    /* 在萃取、灌注視窗的詞綴列旁加按鈕。詞綴列是 #sheet.axs 裡的 .affix，前面幾列依序對應裝備的 af（後面的獨特效果列不加） */
    const addAfBtns = () => {
      const sheet = document.querySelector('#sheet.axs');
      if (!sheet || sheet.querySelector('.awAfBtn') || document.querySelector('#awXtrPick,#awInfPick')) return;
      let md;
      try { md = ui.alchMd(); } catch (e) { return; }
      if (md !== 'x' && md !== 'i') return;
      const t = axItem();
      if (!t || !t.af || !t.af.length) return;
      if (md === 'x' ? !canAlch(t) : !canInfuse(t)) return;
      if (!window.__awAfPatch || !window.__awAfPatch[md === 'x' ? 'xtr' : 'inf']) return;
      const rows = [...sheet.querySelectorAll('.affix')].filter(r => !r.querySelector('.tag') || !/獨特/.test(r.querySelector('.tag').textContent));
      rows.slice(0, t.af.length).forEach((row, j) => {
        const b = document.createElement('button');
        b.className = 'awAfBtn';
        b.textContent = md === 'x' ? '萃取這條' : '灌注這條';
        b.title = md === 'x' ? '指定萃取這一條詞綴，可選萃取石並看升階機率' : '指定用哪一顆符文石取代這一條詞綴';
        b.style.cssText = 'margin-left:6px;padding:0 6px;font-size:11px;line-height:18px;cursor:pointer;background:#ffd84a;color:#2a2118;border:1px solid #000;border-radius:3px;flex:none;white-space:nowrap';
        b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); if (md === 'x') openXtrPick(j); else openInfPick(j); }, true);
        row.appendChild(b);
      });
    };
    setInterval(() => { try { addAfBtns(); } catch (e) {} }, CFG.btnRefreshMs);
  }

  /* ===== 18. 不上傳雲端存檔 =====
   * 兩種情況不把存檔傳到 Google 雲端存檔：
   *   - 小工具設定開了「不上傳雲端存檔」（CFG.noCloud）
   *   - 自動刷神話進行中（不然作者那邊會看到存檔反覆回到同一個狀態）
   * 單格模式不擋雲端（玩家可能跨裝置玩），只擋排行榜和統計。
   * 光把 gcUpload() 包起來不夠：遊戲每次開網頁、重新載入（自動刷神話每次讀檔都會）一啟動就存一次檔，
   * 存檔時發現「這次開網頁還沒上傳過」就馬上上傳，這時小工具常常還沒回來（實測離線版晚了約 0.2 秒）。
   * 所以要擋的期間，把遊戲記在 ro-wanderer.v3.cloud 的 Google 登入憑證先收起來（放到 awtools.gctok），
   * 遊戲重新載入時讀不到憑證，就當成沒登入，不會上傳、也不會去問雲端。不用擋了再放回去。
   * 中途關掉網頁的話，下次點書籤時（不用擋）也會自動放回去。
   * 擋的期間在遊戲裡重新登入 Google 也沒關係：計時器會再把新的憑證收起來。 */
  const GC_STASH = 'awtools.gctok', GC_NAG_LS = typeof GC_NAG === 'string' ? GC_NAG : 'ro-wanderer.v3.gcNag';
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
   * 節能模式：畫面上可以拖曳的「🔋 節能」小按鈕，點一下就切換、馬上生效，狀態記在瀏覽器的 awtools.eco；按 × 可以收起按鈕。
   * 單格模式開著時不管開關怎麼設都會啟用。
   * 做法是把遊戲的 draw()（畫場景）、eliteTags()（菁英頭上的標籤）、burst()、streak()、num() 各包一層。
   * 有些粒子是遊戲直接塞進 G.parts 的，包不到，所以畫之前順手清掉。
   */
  const ECO_KEY = 'awtools.eco';
  let ecoUser = false;
  try { ecoUser = localStorage.getItem(ECO_KEY) === '1'; } catch (e) {}
  if (first && CFG.eco) {
    const ecoOn = () => ecoUser || !!window.__awOne;
    /* 開關是一顆浮在畫面上的小按鈕（以前放在左下角那一排標籤裡，吃到遊戲標籤的半透明樣式，看不清楚）：
     *   - 深色底、白字，右邊的「開／關」用綠底／灰底，一眼看得出狀態
     *   - 按住拖曳可以移動，位置記在瀏覽器的 awtools.ecopos（下次還在同一個地方）；沒拖動就放開才算點擊（切換節能）
     *   - 右邊的 × 把按鈕整個收起來，節能模式維持原狀；下次點書籤（包含重新載入後小工具自己回來）、
     *     或是打開單格模式時才會再出現。收起來的狀態只記在記憶體，不存檔
     * 點擊要擋住往外傳，不然會被當成點了戰鬥畫面。 */
    if (CFG.ecoBtn) {
      const ECO_POS = 'awtools.ecopos';
      let ecoHidden = false, lastOne = !!window.__awOne;
      window.__awEcoShow = () => { ecoHidden = false; };
      const ecoLabel = b => {
        const on = ecoOn(), forced = on && !ecoUser;
        const st = b.querySelector('.awEcoSt');
        const txt = on ? '開' : '關';
        if (st.textContent !== txt) st.textContent = txt;
        st.style.background = on ? '#1f9d63' : '#5a5048';
        b.title = (forced ? '單格模式開著時一定會節能。' : '') + '點一下切換節能模式（降低畫面更新次數、不產生粒子和傷害數字，只影響畫面，不影響戰鬥結果）；按住拖曳可以移動；× 收起按鈕';
      };
      const ecoPlace = b => {
        let p = null;
        try { p = JSON.parse(localStorage.getItem(ECO_POS)); } catch (e) {}
        const w = window.innerWidth, h = window.innerHeight, bw = b.offsetWidth || 110, bh = b.offsetHeight || 26;
        const x = p && isFinite(p.x) ? p.x : 8, y = p && isFinite(p.y) ? p.y : h - bh - 140;
        b.style.left = Math.max(0, Math.min(w - bw, x)) + 'px';
        b.style.top = Math.max(0, Math.min(h - bh, y)) + 'px';
      };
      const ecoMake = () => {
        const b = document.createElement('div');
        b.className = 'awEcoBtn';
        /* z-index 比遊戲的對話框背景（#sheetBg 是 20）低，對話框打開時會蓋住按鈕 */
        b.style.cssText = 'position:fixed;z-index:15;display:flex;align-items:center;gap:6px;padding:3px 4px 3px 8px;border-radius:14px;' +
          'background:rgba(16,12,10,.92);border:1px solid #c9b07a;box-shadow:0 2px 6px rgba(0,0,0,.45);color:#fff;font:bold 12px/1.4 sans-serif;' +
          'cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;white-space:nowrap';
        b.innerHTML = '<span>🔋 節能</span><span class="awEcoSt" style="padding:0 7px;border-radius:9px;color:#fff"></span>' +
          '<span class="awEcoX" title="收起按鈕（下次點書籤或打開單格模式時再出現）" style="padding:0 5px;color:#c8bca8;cursor:pointer;font-size:14px;line-height:1">×</span>';
        let drag = null;
        b.addEventListener('pointerdown', e => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          e.stopPropagation();
          /* 按住後指標會綁在按鈕上（setPointerCapture），放開時的 target 一律是按鈕本身，所以按下時就先記住是不是按在 × 上 */
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY, l: b.offsetLeft, t: b.offsetTop, moved: false, onX: !!e.target.closest('.awEcoX') };
          try { b.setPointerCapture(e.pointerId); } catch (err) {}
        });
        b.addEventListener('pointermove', e => {
          if (!drag || drag.id !== e.pointerId) return;
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (!drag.moved && Math.hypot(dx, dy) < 5) return;
          drag.moved = true;
          b.style.cursor = 'grabbing';
          b.style.left = Math.max(0, Math.min(window.innerWidth - b.offsetWidth, drag.l + dx)) + 'px';
          b.style.top = Math.max(0, Math.min(window.innerHeight - b.offsetHeight, drag.t + dy)) + 'px';
        });
        const end = e => {
          if (!drag || drag.id !== e.pointerId) return;
          const d = drag;
          drag = null;
          b.style.cursor = 'grab';
          e.stopPropagation();
          if (d.moved) { try { localStorage.setItem(ECO_POS, JSON.stringify({ x: b.offsetLeft, y: b.offsetTop })); } catch (err) {} return; }
          if (e.type !== 'pointerup') return;
          if (d.onX) { ecoHidden = true; b.remove(); try { toast('節能按鈕已收起：下次點書籤或打開單格模式時再出現', 'lvl'); } catch (err) {} return; }
          if (window.__awOne && ecoUser) { ecoUser = false; }
          else if (window.__awOne) { try { toast('單格模式開著時一定會節能，關掉單格模式才能關閉', 'lvl'); } catch (err) {} return; }
          else ecoUser = !ecoUser;
          try { if (ecoUser) localStorage.setItem(ECO_KEY, '1'); else localStorage.removeItem(ECO_KEY); } catch (err) {}
          ecoLabel(b);
          try { toast('節能模式已' + (ecoUser ? '開啟' : '關閉'), 'lvl'); } catch (err) {}
        };
        b.addEventListener('pointerup', end);
        b.addEventListener('pointercancel', end);
        b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
        return b;
      };
      every(() => {
        /* 單格模式從關變開：收起來的按鈕再出現 */
        const one = !!window.__awOne;
        if (one && !lastOne) ecoHidden = false;
        lastOne = one;
        let b = document.querySelector('.awEcoBtn');
        if (ecoHidden || typeof S === 'undefined' || !S) { if (b) b.remove(); return; }
        if (!b) {
          b = ecoMake();
          document.body.appendChild(b);
          ecoLabel(b);
          ecoPlace(b);
        }
        ecoLabel(b);
      }, 500);
      /* 視窗變小時把按鈕拉回畫面裡 */
      window.addEventListener('resize', () => { const b = document.querySelector('.awEcoBtn'); if (b) ecoPlace(b); });
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

  /* ===== 21. 精煉計算、自動精煉（流浪仙境） =====
   * 煉金分頁的「精煉計算」按鈕。選一件裝備和目標精煉值，算出平均要花多少；也可以讓小工具代替你一直按精煉。
   * 規則全部讀遊戲自己的資料和函式，遊戲改數字時這裡跟著變：
   *   成功率 V79_REF.ok、素材 v5RefMat、Zeny v5RefZeny、這次要不要消耗神工匠的祝福 v79Need
   *   失敗：+5 以下精煉值不變；+6 以上降 1（勾選保護、而且這次不必消耗神工匠的祝福時不變）；裝備不會損毀
   *   保護：+5 以上、這次不必消耗神工匠的祝福時才能用，優先用鐵匠的祝福（v82）
   *   傳說的魔力礦石：必定成功，每次 1 顆（必須消耗的神工匠的祝福照樣要）
   * 期望值是把「從每個精煉值到目標還要花多少」列成方程式解出來（最多十幾個未知數，直接消去法）；
   * 中位數和 9 成機率的花費用模擬 3000 次估計。
   * 自動精煉就是一次一次呼叫遊戲的 v5Refine(u)（和按精煉按鈕完全一樣），每次之間等 CFG.refAutoMs 毫秒；
   * 到目標、素材／Zeny／祝福不夠、按停止、關掉視窗或達到最多次數就停。
   * 保護和傳說礦石的勾選只在自動精煉期間套用（遊戲的 ui.v5prot、ui.v64lg），結束後還原成原本的。 */
  const refMax = () => (typeof V79_REF === 'object' && V79_REF ? V79_REF.max : 10);
  const refRate = lv => ((typeof V79_REF === 'object' && V79_REF ? V79_REF.ok[lv] : typeof V5_REF_OK !== 'undefined' ? V5_REF_OK[lv] : 0) || 0);
  const refNeed = (it, L) => { try { return typeof v79Need === 'function' && !!v79Need({ slot: it.slot, ref: L }); } catch (e) { return false; } };
  const matName = k => (typeof MATS === 'object' && MATS[k] ? MATS[k].n : k);
  /* 從精煉值 L 往上精煉一次：成功率、花費、失敗後的精煉值 */
  const refStep = (it, L, opt) => {
    const lv = L + 1, need = refNeed(it, L), lg = !!opt.lg;
    const prot = !need && !lg && !!opt.prot && lv >= 5;
    return { L: L, lv: lv, need: need, prot: prot, lg: lg, q: lg ? 1 : refRate(lv) / 100, mat: v5RefMat(it, lv), z: v5RefZeny(it, lv), fail: prot || lv <= 5 ? L : L - 1 };
  };
  /* 解 E[L] = 花費 + q·E[L+1] + (1−q)·E[失敗後]，E[目標] = 0；回傳從 from 出發的期望值 */
  const refExpect = (steps, lo, T, from, costOf) => {
    const n = T - lo, A = [], b = [];
    for (let i = 0; i < n; i++) {
      const s = steps[lo + i], row = new Array(n).fill(0);
      row[i] += 1;
      if (s.L + 1 < T) row[s.L + 1 - lo] -= s.q;
      row[s.fail - lo] -= 1 - s.q;
      A.push(row); b.push(costOf(s));
    }
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      if (Math.abs(A[c][c]) < 1e-12) return Infinity;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        if (!f) continue;
        for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    return b[from - lo] / A[from - lo][from - lo];
  };
  /* 模擬：回傳 Zeny 和嘗試次數的排序陣列 */
  const refSim = (steps, T, from, runs) => {
    const zs = [], ns = [];
    for (let r = 0; r < runs; r++) {
      let L = from, z = 0, k = 0;
      while (L < T && k < 200000) { const s = steps[L]; z += s.z; k++; L = Math.random() < s.q ? L + 1 : s.fail; }
      zs.push(z); ns.push(k);
    }
    zs.sort((a, b) => a - b); ns.sort((a, b) => a - b);
    return { zs: zs, ns: ns };
  };
  const pctOf = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0;
  const openRefCalc = () => {
    if (typeof S === 'undefined' || !S || typeof v5RefMat !== 'function' || typeof v5Refine !== 'function') { uiAlert('請先進入遊戲（這個功能只有流浪仙境有）'); return; }
    const { root, box, close } = awSheet('awRef', 640);
    const allGear = () => (typeof v5AllGear === 'function' ? v5AllGear() : [...SLOTS.map(s => S.equip[s]).filter(Boolean), ...S.bag]).filter(t => t && t.slot);
    const worn = it => SLOTS.some(s => S.equip[s] === it);
    const findIt = u => allGear().find(t => t.u === u) || null;
    const list = () => allGear().filter(t => (t.ref || 0) < refMax())
      .sort((a, b) => worn(b) - worn(a) || (b.ref || 0) - (a.ref || 0) || (b.my ? 7 : b.uq ? 6 : b.rar) - (a.my ? 7 : a.uq ? 6 : a.rar) || b.ilvl - a.ilvl);
    let sel = findIt(ui.v5sel) && (findIt(ui.v5sel).ref || 0) < refMax() ? ui.v5sel : ((list()[0] || {}).u);
    let target = 0;
    let prot = !!ui.v5prot, lg = false, maxTries = 300;
    let timer = null, running = false, logs = [], tally = null;
    const keep = { prot: ui.v5prot, lg: ui.v64lg };
    const lab = it => escH(itemName(it)) + '（' + escH(SLOT_NAME[it.slot] || it.slot) + (worn(it) ? '・裝備中' : '') + '）';
    /* 同樣的條件只算一次（自動精煉每一步都會重畫，模擬 3000 次不要每次都重跑） */
    let memoKey = '', memo = null;
    const calcNow = it => {
      const key = [it.u, it.ref || 0, target, prot, lg, S.mat && S.mat.p2 > 0].join('|');
      if (key !== memoKey) { memoKey = key; memo = calcRaw(it); }
      return memo;
    };
    const calcRaw = it => {
      const cur = it.ref || 0, T = Math.max(cur + 1, Math.min(refMax(), target || cur + 1)), lo = Math.min(cur, 4), opt = { prot: prot, lg: lg };
      const steps = {};
      for (let L = lo; L < T; L++) steps[L] = refStep(it, L, opt);
      const ex = f => refExpect(steps, lo, T, cur, f);
      const mats = {};
      for (let L = lo; L < T; L++) mats[steps[L].mat] = 1;
      const out = { cur: cur, T: T, steps: steps, tries: ex(() => 1), z: ex(s => s.z), mat: {}, p2: ex(s => (s.need ? 1 : 0)), prot: ex(s => (s.prot ? 1 : 0)), lg: ex(s => (s.lg ? 1 : 0)) };
      for (const k of Object.keys(mats)) out.mat[k] = ex(s => (s.mat === k ? 1 : 0));
      out.sim = refSim(steps, T, cur, 3000);
      return out;
    };
    const num = v => (!isFinite(v) ? '∞' : v >= 100 ? fmt(Math.round(v)) : (Math.round(v * 10) / 10).toString());
    const have = k => (S.mat && S.mat[k]) || 0;
    const draw = () => {
      const it = findIt(sel);
      const opts = list().map(t => '<option value="' + t.u + '"' + (t.u === sel ? ' selected' : '') + '>+' + (t.ref || 0) + ' ' + lab(t) + '</option>').join('');
      let h = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:15px">精煉計算</b><span style="color:#a89a84">' + VERSION + '</span><span style="flex:1"></span><button data-a="close" style="' + AW_BTN + '">關閉</button></div>';
      if (!it) { box.innerHTML = h + '<div style="color:#a89a84">沒有還能精煉的裝備。</div>'; return; }
      const cur = it.ref || 0;
      /* 自動精煉進行中不能動目標（不然到達目標的那一刻會被改成下一級，一直精煉下去） */
      if (!running && (!target || target <= cur)) target = Math.min(refMax(), Math.max(cur + 1, 7));
      const r = calcNow(it);
      h += '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<label>裝備 <select data-r="it" style="max-width:100%;padding:3px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a"' + (running ? ' disabled' : '') + '>' + opts + '</select></label>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">' +
          '<label>目標 <select data-r="t" style="padding:3px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a"' + (running ? ' disabled' : '') + '>' +
            Array.from({ length: refMax() - cur }, (_, i) => cur + 1 + i).map(v => '<option value="' + v + '"' + (v === r.T ? ' selected' : '') + '>+' + v + '</option>').join('') + '</select></label>' +
          '<label style="cursor:pointer"><input type="checkbox" data-r="prot"' + (prot ? ' checked' : '') + (running ? ' disabled' : '') + '> 使用保護（失敗不降）</label>' +
          '<label style="cursor:pointer"><input type="checkbox" data-r="lg"' + (lg ? ' checked' : '') + (have('lg1') && !running ? '' : ' disabled') + '> 使用傳說的魔力礦石（必定成功，持有 ' + have('lg1') + '）</label>' +
        '</div></div>';
      h += '<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px"><tr style="color:#ffd84a;text-align:left"><th>精煉</th><th>成功率</th><th>素材</th><th style="text-align:right">Zeny</th><th>失敗時</th></tr>';
      for (let L = cur; L < r.T; L++) {
        const s = r.steps[L];
        h += '<tr style="border-top:1px solid #3a3026"><td>+' + L + ' → +' + s.lv + '</td><td>' + Math.round(s.q * 100) + '%</td><td>' + escH(matName(s.mat)) + (s.need ? '＋' + escH(matName('p2')) : '') + '</td><td style="text-align:right">' + fmt(s.z) + '</td><td>' +
          (s.lg ? '（必定成功）' : s.prot ? '不降（用祝福保護）' : s.lv <= 5 ? '不降' : '降為 +' + (L - 1)) + '</td></tr>';
      }
      h += '</table>';
      const zMed = pctOf(r.sim.zs, 0.5), z90 = pctOf(r.sim.zs, 0.9), nMed = pctOf(r.sim.ns, 0.5), n90 = pctOf(r.sim.ns, 0.9);
      const lack = (need, k) => (need > have(k) + 1e-9 ? ' <b style="color:#ff5a6a">持有 ' + fmt(have(k)) + '，可能不夠</b>' : ' <small style="color:#a89a84">持有 ' + fmt(have(k)) + '</small>');
      h += '<div style="background:#1a1410;border-radius:4px;padding:8px;margin-top:8px;line-height:1.8">' +
        '<b>+' + cur + ' → +' + r.T + ' 平均要花</b><br>' +
        '嘗試 <b style="color:#ffd84a">' + num(r.tries) + '</b> 次（一半的機率在 ' + fmt(nMed) + ' 次內、9 成在 ' + fmt(n90) + ' 次內）<br>' +
        'Zeny <b style="color:#ffd84a">' + num(r.z) + '</b>（一半的機率在 ' + fmt(zMed) + ' 內、9 成在 ' + fmt(z90) + ' 內）' + (r.z > S.ash ? ' <b style="color:#ff5a6a">你有 ' + fmt(S.ash) + '，可能不夠</b>' : ' <small style="color:#a89a84">你有 ' + fmt(S.ash) + '</small>') + '<br>' +
        Object.keys(r.mat).map(k => escH(matName(k)) + ' <b>' + num(r.mat[k]) + '</b>' + lack(r.mat[k], k)).join('<br>') +
        (r.p2 > 0.001 ? '<br>' + escH(matName('p2')) + '（必須消耗）<b>' + num(r.p2) + '</b>' + lack(r.p2, 'p2') : '') +
        (r.prot > 0.001 ? '<br>保護用的祝福（優先' + escH(matName('p1')) + '）<b>' + num(r.prot) + '</b> <small style="color:#a89a84">持有 ' + fmt(have('p1')) + '／' + fmt(have('p2')) + '</small>' : '') +
        (r.lg > 0.001 ? '<br>' + escH(matName('lg1')) + ' <b>' + num(r.lg) + '</b>' + lack(r.lg, 'lg1') : '') +
        '<br><small style="color:#a89a84">素材不夠時遊戲會自動改用更高一階的（1 個抵 1 個）。祝福不夠時，保護會自動失效、必須消耗的那幾次會精煉不了。</small></div>';
      h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">' +
        '<label>最多嘗試 <input data-r="max" type="number" min="1" value="' + maxTries + '" style="width:70px;padding:3px;background:#1a1410;color:#f0e6d2;border:1px solid #6a5a4a"' + (running ? ' disabled' : '') + '> 次</label><span style="flex:1"></span>' +
        (running ? '<button data-a="stop" style="' + AW_BTN + ';background:#c8323c;color:#fff;border:1px solid #000;font-weight:bold">停止</button>'
          : '<button data-a="go" style="' + AW_GO + '">自動精煉到 +' + r.T + '</button>') + '</div>';
      if (tally) h += '<div style="margin-top:6px;font-size:12px;color:#c8bca8">本次自動精煉：嘗試 ' + tally.n + ' 次、成功 ' + tally.ok + '、失敗 ' + (tally.n - tally.ok) + '，花費 Zeny ' + fmt(tally.z) + '</div>';
      if (logs.length) h += '<div data-r="logs" style="margin-top:4px;max-height:140px;overflow:auto;background:#1a1410;padding:4px 6px;font:12px/1.5 monospace">' + logs.slice(-200).map(escH).join('<br>') + '</div>';
      h += '<div style="color:#a89a84;font-size:12px;margin-top:6px">自動精煉和按遊戲的精煉按鈕一樣（會消耗素材、Zeny、祝福），隨時可以按停止或關掉視窗。</div>';
      box.innerHTML = h;
      const lg2 = box.querySelector('[data-r="logs"]');
      if (lg2) lg2.scrollTop = lg2.scrollHeight;
    };
    let lastMsg = '';
    let realToast = null;
    const stop = why => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (running) {
        running = false;
        ui.v5prot = keep.prot; ui.v64lg = keep.lg;
        if (realToast) { window.toast = realToast; realToast = null; }
        if (why) logs.push('■ ' + why);
        try { saveNow(); } catch (e) {}
        try { ui.render(); } catch (e) {}
      }
      if (document.body.contains(root)) draw();
    };
    const step = () => {
      if (!running) return;
      if (!document.body.contains(root)) { stop('視窗關閉，已停止'); return; }
      const it = findIt(sel);
      if (!it) { stop('找不到這件裝備'); return; }
      const before = it.ref || 0;
      if (before >= target) { stop('完成：已達 +' + target); return; }
      if (tally.n >= maxTries) { stop('已達最多嘗試次數 ' + maxTries + ' 次'); return; }
      const ash0 = S.ash, mat0 = JSON.stringify(S.mat);
      lastMsg = '';
      ui.v5prot = prot; ui.v64lg = lg;
      try { v5Refine(it.u); } catch (e) { stop('精煉時發生錯誤：' + e.message); return; }
      const after = it.ref || 0;
      if (S.ash === ash0 && JSON.stringify(S.mat) === mat0 && after === before) { stop('停止：' + (lastMsg || '素材、Zeny 或祝福不足')); return; }
      tally.n++; tally.z += ash0 - S.ash;
      if (after > before) tally.ok++;
      logs.push('+' + before + ' → ' + (after > before ? '成功 +' + after : after < before ? '失敗，降為 +' + after : '失敗（精煉值不變）'));
      if (after >= target) { stop('完成：已達 +' + target); return; }
      draw();
      timer = setTimeout(step, Math.max(0, CFG.refAutoMs));
    };
    box.addEventListener('change', e => {
      const k = e.target.dataset.r;
      if (k === 'it') { sel = +e.target.value; target = 0; logs = []; tally = null; }
      if (k === 't') target = +e.target.value;
      if (k === 'prot') prot = e.target.checked;
      if (k === 'lg') lg = e.target.checked;
      if (k === 'max') maxTries = Math.max(1, Math.floor(+e.target.value || 1));
      draw();
    });
    box.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { stop(''); close(); return; }
      if (a === 'stop') { stop('手動停止'); return; }
      if (a === 'go') {
        const it = findIt(sel);
        if (!it) return;
        if (!await uiConfirm('自動精煉「' + itemName(it) + '」到 +' + target + '？\n\n每次和按遊戲的精煉按鈕一樣，會消耗素材、Zeny' + (prot ? '、保護用的祝福' : '') + (lg ? '、傳說的魔力礦石' : '') + '；+6 以上失敗會降 1。\n最多嘗試 ' + maxTries + ' 次，隨時可以按停止。')) return;
        if (CFG.autoBackup) { try { saveNow(); backupNow('自動精煉前自動備份'); } catch (err) {} }
        running = true; tally = { n: 0, ok: 0, z: 0 };
        logs.push('▶ 開始：+' + (it.ref || 0) + ' → +' + target);
        realToast = window.toast;
        window.toast = function (m) { lastMsg = String(m || ''); return realToast.apply(this, arguments); };
        step();
      }
    });
    draw();
  };

  /* ===== 22. 天賦樹搜尋（流浪仙境） =====
   * 在遊戲自己的共用天賦樹（v1.0.6 起可以雙指縮放、放大到 1000%，v1.0.15 起有模擬器）的標題列加一個搜尋框，
   * 取代以前自己做的「天賦樹大視窗」（遊戲的天賦樹已經有縮放、模擬器，大視窗只剩搜尋比較多，所以拿掉）：
   *   - 搜尋名稱、效果、取向、素質（例如「暴擊」「範圍」「力量」），符合的節點在星圖上畫粉紅色外圈
   *   - 點搜尋框時列出結果（素質節點太多，只算數量不列出），點結果就選取那個節點並移到畫面中間
   *   - 職業獨特天賦只找目前職業的，點了切到「職業獨特」頁
   * 做法：包一層 roTreeRender（遊戲每次重畫天賦樹都會叫它，模擬器、唯讀星圖也是），重畫完把搜尋框放進標題列、外圈畫進星圖；
   * 打字時只改外圈和結果清單，不重畫整個天賦樹。關掉天賦樹再打開，上次的搜尋字還在。 */
  if (first && CFG.treeFind && typeof roTreeRender === 'function' && typeof RO_TREE_NODES === 'object') {
    if (!document.querySelector('#awTFCss')) {
      const st = document.createElement('style');
      st.id = 'awTFCss';
      st.textContent = '#awTF{position:relative;flex:1 1 180px;max-width:340px;margin:0 10px;align-self:center}' +
        '#awTF input{width:100%;box-sizing:border-box;padding:5px 8px;border:1px solid #c9b07a;border-radius:6px;background:#fffdf6;color:#3a2a18;font:13px/1.4 sans-serif}' +
        '#awTF .awTFL{display:none;position:absolute;top:100%;left:0;right:0;z-index:20;margin-top:2px;max-height:min(50vh,360px);overflow:auto;background:#fffdf6;border:1px solid #c9b07a;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.25);color:#3a2a18;font:13px/1.4 sans-serif;text-align:left}' +
        '#awTF.open .awTFL{display:block}' +
        '#awTF .awTFL button{display:block;width:100%;text-align:left;padding:5px 8px;border:0;border-bottom:1px solid #eadfc4;border-radius:0;background:none;color:inherit;cursor:pointer;font:inherit;box-shadow:none;text-shadow:none}' +
        '#awTF .awTFL button:hover{background:#f6ecd2}' +
        '#awTF .awTFL small{color:#8a7a5a}' +
        '#awTF .awTFN{padding:5px 8px;color:#8a7a5a}' +
        '#sheet .awHit{fill:none;stroke:#ff2d87;stroke-width:5;pointer-events:none}';
      document.head.appendChild(st);
    }
    let kw = '';
    const catOf = n => (typeof RO_TREE_CAT === 'object' && RO_TREE_NODE_CAT[n.id] && RO_TREE_CAT[RO_TREE_NODE_CAT[n.id]] ? RO_TREE_CAT[RO_TREE_NODE_CAT[n.id]][0] : '');
    const findHits = () => {
      const k = kw.trim().toLowerCase();
      if (!k) return [];
      return Object.values(RO_TREE_NODES).filter(n => {
        if (n.kind === 'unique' && n.cls !== S.cls) return false;
        const t = (n.name + ' ' + (n.desc || '') + ' ' + catOf(n) + ' ' + (RO_KIND_NAME[n.kind] || '') +
          (n.stat != null && roStats[n.stat] ? ' ' + roStats[n.stat][0] + ' ' + roStats[n.stat][1] : '') +
          (n.kind === 'unique' && SKILLS[n.skill] ? ' ' + SKILLS[n.skill].n : '')).toLowerCase();
        return t.includes(k);
      });
    };
    /* 星圖上的粉紅外圈和結果清單；open 是 true／false 時順便打開／收起清單 */
    const paint = open => {
      const sh = document.querySelector('#sheet.ro-tree-sheet'), box = sh && sh.querySelector('#awTF');
      if (!box) return;
      const hits = findHits(), svg = sh.querySelector('.tree-map svg');
      if (svg) {
        svg.querySelectorAll('.awHit').forEach(e => e.remove());
        for (const n of hits) {
          if (n.kind === 'unique' || !n.where) continue;
          const p = roTreePoint(n), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
          c.setAttribute('r', (typeof roTreeR === 'function' ? roTreeR(n) : 14) + 8);
          c.setAttribute('class', 'awHit');
          svg.appendChild(c);
        }
      }
      const big = hits.filter(n => n.kind !== 'attribute'), attr = hits.length - big.length, r = roTreeDraft || {};
      box.querySelector('.awTFL').innerHTML = !kw.trim() ? '<div class="awTFN">輸入名稱或效果，例如：暴擊、範圍、力量</div>' :
        '<div class="awTFN">找到 ' + big.length + ' 個' + (attr ? '＋素質節點 ' + attr + ' 個（只在星圖上畫圈）' : '') + '</div>' +
        big.slice(0, 80).map(n => '<button data-id="' + escH(n.id) + '">' + (r[n.id] ? '✓ ' : '') + escH(n.name) +
          ' <small>' + escH(RO_KIND_NAME[n.kind] || '') + (catOf(n) ? '・' + escH(catOf(n)) : '') + '</small></button>').join('');
      if (open != null) box.classList.toggle('open', open);
    };
    /* 選取節點並移到畫面中間（置中用遊戲 v1.0.6 的 v96CenterOn） */
    const go = id => {
      const n = RO_TREE_NODES[id];
      if (!n) return;
      roTreeSelected = id;
      roTreeView = n.kind === 'unique' ? 'unique' : 'tree';
      roTreeRender();
      if (n.kind !== 'unique' && typeof v96CenterOn === 'function') { try { v96CenterOn(id); } catch (e) {} }
    };
    const mount = () => {
      const sh = document.querySelector('#sheet.ro-tree-sheet'), head = sh && sh.querySelector('.tree-header');
      if (!head || head.querySelector('#awTF')) return;
      const box = document.createElement('div');
      box.id = 'awTF';
      box.innerHTML = '<input type="search" placeholder="🔍 搜尋天賦（名稱、效果）" autocomplete="off"><div class="awTFL"></div>';
      head.insertBefore(box, head.querySelector('[data-act="close"]'));
      const inp = box.querySelector('input');
      inp.value = kw;
      let t = 0;
      inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { kw = inp.value; paint(true); }, 150); });
      inp.addEventListener('focus', () => paint(true));
      inp.addEventListener('blur', () => setTimeout(() => box.classList.remove('open'), 200));
      /* 打字時不要觸發遊戲的快捷鍵；Esc 清掉搜尋（不會關掉天賦樹） */
      for (const ev of ['keydown', 'keyup', 'keypress']) {
        inp.addEventListener(ev, e => {
          e.stopPropagation();
          if (ev === 'keydown' && e.key === 'Escape') { e.preventDefault(); inp.value = kw = ''; paint(false); inp.blur(); }
        });
      }
      /* 按結果時先不要讓搜尋框失去焦點，不然清單會先收起來 */
      box.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
      box.addEventListener('click', e => {
        e.stopPropagation();
        const b = e.target.closest('button[data-id]');
        if (b) go(b.dataset.id);
      });
      paint(false);
    };
    const realRender = roTreeRender;
    roTreeRender = function () {
      const r = realRender.apply(this, arguments);
      try { mount(); } catch (e) {}
      return r;
    };
  }

  /* ===== 23. 收益統計（流浪仙境） =====
   * 地圖分頁的「收益統計」按鈕。小工具裝上之後每 5 秒記一次 Zeny、經驗、擊殺數，
   * 另外在撿東西時記卡片（依階級）和裝備（進背包／自動分解），算出「最近 10 分鐘」和「這次開始以來」的每小時收益，
   * 以及照最近的經驗速度，還要多久升級。背景時也會記（用第 1 項的背景計時器）。
   * Zeny 是淨增加：精煉、購買等花掉的會扣掉。切換角色時重新計算。資料只在記憶體，重新載入就重來。 */
  const EARN = { cid: null, t0: 0, hist: [], cards: {}, bag: 0, salv: 0 };
  const xpTotal = () => { let s = S.xp || 0; try { for (let l = 1; l < S.lvl; l++) s += xpNeed(l); } catch (e) {} return s; };
  const killTotal = () => { let s = 0; for (const v of Object.values(S.kills || {})) s += +v || 0; return s; };
  const earnReset = () => { EARN.cid = S.cid; EARN.t0 = Date.now(); EARN.hist = []; EARN.cards = {}; EARN.bag = 0; EARN.salv = 0; };
  const earnSnap = () => ({ t: Date.now(), ash: S.ash, xp: xpTotal(), kill: killTotal(), card: Object.values(EARN.cards).reduce((a, b) => a + b, 0), bag: EARN.bag, salv: EARN.salv, cards: Object.assign({}, EARN.cards) });
  if (first && CFG.earn) {
    every(() => {
      if (typeof S === 'undefined' || !S) return;
      if (EARN.cid !== S.cid) earnReset();
      EARN.hist.push(earnSnap());
      if (EARN.hist.length > 900) EARN.hist.shift();
    }, 5000);
    const realPick = window.pickup;
    if (typeof realPick === 'function') {
      window.pickup = function (d) {
        try { if (d && d.cd && typeof V5_CARD === 'object' && V5_CARD[d.cd]) { const t = V5_CARD[d.cd].t; EARN.cards[t] = (EARN.cards[t] || 0) + 1; } } catch (e) {}
        return realPick.apply(this, arguments);
      };
    }
    const realTake = window.takeItem;
    if (typeof realTake === 'function') {
      window.takeItem = function () {
        const r = realTake.apply(this, arguments);
        if (r === 'bag') EARN.bag++; else if (r === 'salv' || r === 'full') EARN.salv++;
        return r;
      };
    }
  }
  const openEarn = () => {
    if (typeof S === 'undefined' || !S) { uiAlert('請先進入遊戲'); return; }
    if (EARN.cid !== S.cid) earnReset();
    const { root, box, close } = awSheet('awEarn', 560);
    const dur = ms => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h ? h + ' 小時 ' + m + ' 分' : m ? m + ' 分 ' + (s % 60) + ' 秒' : s + ' 秒'; };
    const rateOf = (a, b, k) => { const hr = (b.t - a.t) / 3600000; return hr > 0 ? (b[k] - a[k]) / hr : 0; };
    const draw = () => {
      const now = earnSnap(), h = EARN.hist;
      const first0 = h.length ? h[0] : now, recent = h.find(x => now.t - x.t <= 600000) || first0;
      const cols = [['最近 10 分鐘', recent], ['這次開始以來（' + dur(now.t - EARN.t0) + '）', first0]];
      const ok = a => now.t - a.t >= 30000;
      const cell = (a, k) => (ok(a) ? fmt(Math.round(rateOf(a, now, k))) : '—');
      const row = (name, k) => '<tr style="border-top:1px solid #3a3026"><td>' + name + '</td>' + cols.map(c => '<td style="text-align:right">' + cell(c[1], k) + '</td>').join('') + '</tr>';
      const tiers = Object.keys(Object.assign({}, now.cards)).sort();
      const tierName = t => (typeof V5_TIER !== 'undefined' && V5_TIER[t] ? V5_TIER[t].n : t + ' 階');
      let html = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:15px">收益統計</b><span style="color:#a89a84">每小時</span><span style="flex:1"></span>' +
        '<button data-a="reset" style="' + AW_BTN + '">重新計算</button><button data-a="close" style="' + AW_BTN + '">關閉</button></div>' +
        '<table style="width:100%;border-collapse:collapse"><tr style="color:#ffd84a"><th style="text-align:left">項目</th>' + cols.map(c => '<th style="text-align:right">' + c[0] + '</th>').join('') + '</tr>' +
        row('Zeny（淨增加）', 'ash') + row('經驗', 'xp') + row('擊殺', 'kill') + row('卡片', 'card') + row('裝備進背包', 'bag') + row('裝備自動分解', 'salv') + '</table>';
      if (tiers.length) {
        html += '<div style="margin-top:6px;font-size:12px">這次撿到的卡片：' + tiers.map(t => escH(tierName(t)) + ' ' + now.cards[t] + ' 張').join('、') + '</div>';
      }
      const need = (typeof xpNeed === 'function' ? xpNeed(S.lvl) : 0) - (S.xp || 0);
      const xr = ok(recent) ? rateOf(recent, now, 'xp') : 0;
      html += '<div style="background:#1a1410;border-radius:4px;padding:6px 8px;margin-top:8px">LV' + S.lvl + '・目前地圖 ' + escH((curMap() || {}).n || '') +
        (S.lvl >= (typeof LV_CAP === 'number' ? LV_CAP : 999) ? '<br>已達等級上限' : '<br>升到 LV' + (S.lvl + 1) + ' 還差經驗 ' + fmt(Math.max(0, Math.round(need))) + (xr > 0 ? '，照最近的速度約 <b style="color:#ffd84a">' + dur(need / xr * 3600000) + '</b>' : '（資料還不夠，過一陣子再看）')) + '</div>' +
        '<div style="color:#a89a84;font-size:12px;margin-top:6px">每 5 秒記一次，至少累積 30 秒才顯示。Zeny 是淨增加（花掉的會扣掉）。打頭目、切地圖時速度會變，看「最近 10 分鐘」比較準。重新載入或切換角色會重新計算。</div>';
      box.innerHTML = html;
    };
    const timer = setInterval(() => { if (!document.body.contains(root)) { clearInterval(timer); return; } draw(); }, 2000);
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'close') { clearInterval(timer); close(); return; }
      if (b.dataset.a === 'reset') { earnReset(); draw(); }
    });
    draw();
  };

  /* ===== 24. 地圖掉落清單（流浪仙境） =====
   * 點戰鬥畫面左下角的地圖名稱（下面有一行小字「點此查看本地圖掉落」），列出在目前地圖打一般怪、菁英、頭目各會掉什麼、機率多少：
   *   - 裝備：掉落機率、稀有度比例；每件 0.5% 改成隨機獨特裝備；頭目另外 15% 掉獨特裝備（都從依等級決定的獨特裝備池平均抽）
   *   - 卡片：掉卡機率、各階級的比例，以及每一階可能出現的卡片（抽到那一階後平均分配）
   *   - 素材：精煉素材、魔力礦石、鐵匠的祝福等（解鎖煉金後才會掉）
   *   - 變異寶石、穿梭寶石、神工匠的祝福（Lv90 以上的頭目）
   * 機率盡量直接拿遊戲當下的數值算（V5_DROP、v5DropTiers、UQ_P、RO_MUT、V5_SX、V77_BLESS、V87…），作者改數值會跟著變。
   * 素材和一般怪／菁英的裝備件數被很多修補檔層層包住（ro-v62、v63、v64、v97 都改過 rollMats），
   * 這兩項直接呼叫遊戲的 rollMats／rollKillDrops 抽很多次來統計（這兩個函式只擲骰子、不改存檔），所以會有一點點誤差。
   * 抽的時候暫時把 S.map 換成要看的地圖、假裝已解鎖煉金、不在武鬥場／魔王戰／試煉，抽完馬上換回來（同一段程式裡做完，遊戲不會看到）。
   * 只算一般模式：深淵（掉落加成、信物）、活動地圖、魔王、武鬥場、MVP 武道場另有規則，不在這個清單裡；
   * 天賦或卡片的「額外掉落」（dropX）也沒算進去。
   * 規則出處（遊戲 v1.1.7）：engine.js killMob（頭目 2 件裝備＋15% 地圖獨特）、ro-progression rollKillDrops（一般怪 5%、菁英 35%＋8%）、
   * makeItem（稀有度權重，Lv83 以上傳奇加權 legF）、ro-v5 v5OnKill／v5DropTiers（卡片）、ro-v87（Lv78 以後新地圖頭目 3% 隨機傳說卡）、
   * ro-v77（Lv90 以上頭目 3% 神工匠的祝福，直接進背包）、ro-mutation rollMut、ro-v5 rollSx、ro-v4 roBossUnique／roUqPool（獨特裝備池）。 */
  const DROP_BOSS_UQ = 0.15;
  const DROP_RW = { mob: [45, 35, 16, 4], elite: [30, 40, 24, 6], boss: [0, 35, 45, 20] };
  const dropPct = p => {
    const v = p * 100;
    return (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v >= 0.1 ? v.toFixed(2) : v >= 0.001 ? v.toFixed(3) : v.toPrecision(2)) + '%';
  };
  /* 用遊戲的函式抽 N 次：回傳平均每隻掉幾件裝備（一般怪、菁英）、每種素材平均幾個 */
  const dropSim = (mi, kind, N) => {
    const M = MAPS[mi], lo = M.lv[0], hi = M.lv[1];
    const keep = { map: S.map, alch: S.alchOn, arena: G.arena, tw: G.tw, guard: G.guard, trial: G.trial };
    const out = { gear: 0, mats: {} };
    try {
      S.map = mi; S.alchOn = 1; G.arena = null; G.tw = null; G.guard = null; G.trial = null;
      for (let i = 0; i < N; i++) {
        const L = kind === 'boss' ? hi : lo + Math.floor(RAND() * (hi - lo + 1));
        if (kind !== 'boss') out.gear += rollKillDrops(kind === 'elite').length;
        for (const k of rollMats(L, kind === 'boss', kind === 'elite')) out.mats[k] = (out.mats[k] || 0) + 1;
        /* engine 的 dropMats：Lv83 以上的一般怪另外有機會掉高純度鋁 */
        if (kind === 'mob' && L >= 83 && typeof I4_P === 'number' && RAND() < I4_P) out.mats.i4 = (out.mats.i4 || 0) + 1;
      }
    } catch (e) {
    } finally {
      S.map = keep.map; S.alchOn = keep.alch; G.arena = keep.arena; G.tw = keep.tw; G.guard = keep.guard; G.trial = keep.trial;
    }
    out.gear /= N;
    for (const k of Object.keys(out.mats)) out.mats[k] /= N;
    return out;
  };
  const dropTiers = (mi, kind) => {
    const keep = S.map;
    try { S.map = mi; return v5DropTiers(kind); } catch (e) { return []; } finally { S.map = keep; }
  };
  /* 掉落清單的樣式：用遊戲自己的對話框（#sheet，和點素材、說明跳出來的是同一個），配色照遊戲的 CSS 變數，看起來和遊戲一樣 */
  const DROP_CSS = '#sheet.awDrop{width:min(620px,94vw);max-width:94vw;max-height:88vh;overflow:auto;box-sizing:border-box}' +
    '#sheet.awDrop .awDH{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
    '#sheet.awDrop .awDH h2{margin:0}' +
    '#sheet.awDrop .awDLv{color:var(--muted)}' +
    '#sheet.awDrop .awDS{margin-top:12px;background:var(--paper-hi,#fff);border:1px solid var(--paper-dk,#ccd5df);border-radius:6px;overflow:hidden}' +
    '#sheet.awDrop .awDS>h3{margin:0;padding:6px 10px;font-size:14px;color:#416a89;background:var(--cell,#dce5ed);border-bottom:1px solid var(--paper-dk,#ccd5df)}' +
    '#sheet.awDrop table{width:100%;border-collapse:collapse}' +
    '#sheet.awDrop td{padding:5px 10px;border-top:1px solid #e8eef3;vertical-align:top}' +
    '#sheet.awDrop tr:first-child td{border-top:0}' +
    '#sheet.awDrop td.v{text-align:right;white-space:nowrap;font-weight:bold;color:var(--ember,#497da2)}' +
    '#sheet.awDrop td .n{color:var(--muted);font-size:12px;line-height:1.5}' +
    '#sheet.awDrop details{padding:6px 10px;border-top:1px solid #e8eef3}' +
    '#sheet.awDrop .awDS>details:first-of-type{border-top:0}' +
    '#sheet.awDrop summary{cursor:pointer;color:var(--text)}' +
    '#sheet.awDrop .awDL{font-size:12px;line-height:1.9;padding:4px 0 2px 14px;color:var(--text)}' +
    '#sheet.awDrop .awDL .own{color:#2f9a3a}' +
    '#sheet.awDrop .awDWarn{margin:6px 0 0;padding:6px 10px;border-radius:6px;background:#fff4e0;color:#a5651a;border:1px solid #f0d2a0}' +
    '#sheet.awDrop .awDF{display:flex;justify-content:flex-end;margin-top:12px}';
  const openDrops = mi => {
    const sh = document.querySelector('#sheet'), bg = document.querySelector('#sheetBg');
    if (typeof S === 'undefined' || !S || typeof MAPS === 'undefined' || !MAPS[mi] || !sh || !bg) { uiAlert('請先進入遊戲'); return; }
    if (!document.querySelector('#awDropCss')) {
      const st = document.createElement('style');
      st.id = 'awDropCss';
      st.textContent = DROP_CSS;
      document.head.appendChild(st);
    }
    const M = MAPS[mi], lv = M.lv || [1, 1];
    sh.className = 'awDrop';
    sh.innerHTML = '<h2>' + escH(M.n) + ' 掉落清單</h2><p class="note">計算中…</p>';
    bg.hidden = false;
    setTimeout(() => {
      if (!sh.classList.contains('awDrop') || bg.hidden) return;
      const mul = typeof V5 === 'object' && V5.dropMul ? V5.dropMul : 1;
      const tierN = t => (typeof V5_TIER !== 'undefined' && V5_TIER[t] ? V5_TIER[t].n : t + ' 階');
      const tierC = t => (typeof V5_TIER !== 'undefined' && V5_TIER[t] ? V5_TIER[t].c : 'inherit');
      const tierS = t => '<b style="color:' + tierC(t) + '">' + escH(tierN(t)) + '</b>';
      const rarN = r => { try { return rarLabel({ rar: r }); } catch (e) { return ['普通', '魔法', '稀有', '傳奇'][r]; } };
      const matN = k => (MATS[k] ? MATS[k].n : k);
      const usedTiers = new Set();
      /* 獨特裝備池：遊戲 ro-v4 把頭目的 15% 和每件 0.5% 的隨機獨特都改成從 roUqPool('map', 等級) 平均抽
       * （Lv60 以上加入高階、Lv83 以上加入終局獨特）；這裡用地圖最高等級，也就是頭目的等級 */
      let uqPool = [];
      try { uqPool = roUqPool('map', lv[1]).filter(k => UNIQUE[k]); } catch (e) {}
      /* 一列：左邊名稱（下面一行小字說明），右邊數字；手機上也不會擠成三欄 */
      const row = (name, val, note) => '<tr><td>' + name + (note ? '<div class="n">' + note + '</div>' : '') + '</td><td class="v">' + val + '</td></tr>';
      const block = (kind, title) => {
        const N = kind === 'boss' ? 30000 : 120000;
        const sim = dropSim(mi, kind, N);
        let h = '<div class="awDS"><h3>' + title + '</h3><table>';
        /* 裝備（傳奇的權重照地圖最高等級加權） */
        const rw = DROP_RW[kind].slice();
        rw[3] *= typeof legF === 'function' ? legF(lv[1]) : 1;
        const sum = rw.reduce((a, b) => a + b, 0);
        const rarTxt = rw.map((w, r) => (w ? rarN(r) + ' ' + dropPct(w / sum) : '')).filter(Boolean).join('・');
        const uqp = typeof UQ_P === 'number' ? UQ_P : 0.005;
        if (kind === 'boss') {
          h += row('裝備', '2 件', rarTxt + '；每件 ' + dropPct(uqp) + ' 改成隨機獨特');
          if (uqPool.length) h += row('獨特裝備', dropPct(DROP_BOSS_UQ), '從下面的獨特裝備池平均抽 1 件（每件 ' + dropPct(DROP_BOSS_UQ / uqPool.length) + '）');
        } else {
          h += row('裝備', '平均 ' + sim.gear.toFixed(3) + ' 件', (kind === 'elite' ? '第 1 件 ' : '') + rarTxt + '；每件 ' + dropPct(uqp) + ' 改成隨機獨特' + (kind === 'elite' ? '（第 2 件照一般怪的比例）' : ''));
        }
        /* 卡片 */
        if (typeof V5_DROP === 'object') {
          const p = kind === 'boss' ? V5_DROP.boss * mul : V5_DROP.mob * (kind === 'elite' ? V5_DROP.elite : 1) * mul;
          const ts = dropTiers(mi, kind), ws = ts.reduce((a, r) => a + r[1], 0) || 1;
          ts.forEach(r => usedTiers.add(r[0]));
          h += row('卡片', dropPct(p), ts.map(r => tierS(r[0]) + ' ' + dropPct(r[1] / ws)).join('・'));
          if (kind === 'boss' && typeof V87 === 'object' && mi >= V87.from && mi < MAP_N) {
            usedTiers.add(5);
            h += row('隨機' + tierS(5) + '卡片', dropPct(V87.p * mul), 'Lv78 以後的新地圖頭目另外掉落');
          }
        }
        /* 素材 */
        const mk = Object.keys(sim.mats).sort((a, b) => sim.mats[b] - sim.mats[a]);
        for (const k of mk) {
          const v = sim.mats[k];
          h += row(escH(matN(k)), kind === 'boss' ? (v >= 1 ? '平均 ' + v.toFixed(2) + ' 個' : '約 ' + dropPct(v)) : '約 ' + dropPct(v), kind === 'boss' ? '' : '每 1000 隻約 ' + (v * 1000).toFixed(v * 1000 >= 10 ? 0 : 1) + ' 個');
        }
        if (!mk.length) h += row('素材', '—', '這種怪不掉素材');
        /* 寶石、祝福 */
        if (typeof RO_MUT === 'object' && typeof MUT === 'object') h += row('變異技能寶石', dropPct(RO_MUT.base * (kind === 'boss' ? MUT.b : kind === 'elite' ? MUT.e : 1)), '');
        if (typeof V5_SX === 'object') {
          let n = 0;
          try { n = v5SxPool(S.cls).length; } catch (e) {}
          if (n) h += row('穿梭寶石', dropPct(kind === 'boss' ? V5_SX.b : kind === 'elite' ? V5_SX.e : V5_SX.n), '目前職業可用的 ' + n + ' 種隨機');
        }
        if (kind === 'boss' && typeof V77_BLESS === 'object' && lv[1] >= V77_BLESS.lv) h += row(escH(matN('p2')), dropPct(V77_BLESS.p), '直接進背包');
        return h + '</table></div>';
      };
      const mons = (M.m || []).map(t => (MON[t] ? MON[t].n : t));
      let html = '<div class="awDH"><h2>' + escH(M.n) + ' 掉落清單</h2><span class="awDLv">LV' + lv[0] + '–' + lv[1] + '</span></div>' +
        '<p class="note" style="margin:4px 0 0">怪物：' + mons.map(escH).join('、') + '（每種都可能是菁英）・頭目：' + escH(M.boss || '') + '</p>';
      if (!S.alchOn) html += '<div class="awDWarn">你還沒解鎖煉金：下面的素材要解鎖煉金後才會掉（目前打怪不會掉）。</div>';
      html += block('mob', '一般怪（每隻）') + block('elite', '菁英（每隻）') + block('boss', '頭目 ' + escH(M.boss || '') + '（每次擊敗）');
      /* 獨特裝備池、卡片池：放在同一個區塊，各自可以展開 */
      const tiers = [...usedTiers].sort((a, b) => a - b);
      let pools = '';
      if (uqPool.length) {
        pools += '<details><summary>獨特裝備池 ' + uqPool.length + ' 件<span class="note">（頭目的 15% 和每件裝備 ' + dropPct(typeof UQ_P === 'number' ? UQ_P : 0.005) + ' 的隨機獨特都從這裡平均抽）</span></summary><div class="awDL">' +
          uqPool.map(k => escH(UNIQUE[k].n) + (typeof SLOT_NAME === 'object' && SLOT_NAME[UNIQUE[k].slot] ? '<span class="note">（' + escH(SLOT_NAME[UNIQUE[k].slot]) + '）</span>' : '')).join('、') +
          (lv[0] < 83 ? '<div class="note">一般怪和菁英掉的隨機獨特照怪物自己的等級抽：Lv60 以下沒有高階獨特、Lv83 以下沒有終局獨特，所以低等的怪可抽的會比這裡少。</div>' : '') + '</div></details>';
      }
      if (tiers.length && typeof V5_CARDS !== 'undefined') {
        const seen = (S.v5 && S.v5.seen) || {};
        for (const t of tiers) {
          const pool = V5_CARDS.filter(c => c.t === t && !c.ex);
          pools += '<details><summary>' + tierS(t) + '卡片 ' + pool.length + ' 張' + (pool.length ? '<span class="note">（抽到這一階時每張 ' + dropPct(1 / pool.length) + '）</span>' : '') + '</summary><div class="awDL">' +
            pool.map(c => (seen[c.id] ? '<span class="own">✓' + escH(c.n) + '</span>' : escH(c.n))).join('、') + '</div></details>';
        }
      }
      if (pools) html += '<div class="awDS"><h3>獨特裝備池、卡片池<span class="note" style="font-weight:normal;font-size:12px">　點開看內容，綠色 ✓ 是已經拿過的卡</span></h3>' + pools + '</div>';
      html += '<p class="note" style="font-size:12px;margin:10px 0 0">只算一般模式。深淵（掉落加成、信物）、活動地圖、魔王、武鬥場、MVP 武道場另有規則；天賦或卡片的額外掉落沒算進去。' +
        '素材和一般怪、菁英的裝備件數是用遊戲的掉落函式實際抽很多次統計的，每次打開數字會有一點點不同。</p>' +
        '<div class="awDF"><button class="btn primary" data-act="close">知道了</button></div>';
      sh.innerHTML = html;
    }, 30);
  };
  /* 入口：戰鬥畫面左下角的地圖名稱（#mapChip）整塊都可以點，下面多一行小字「點此查看本地圖掉落」。
   * 遊戲每次更新畫面都會重寫 #mapChip 的內容，所以小字用 CSS 的 ::after 加（跟著 class 走，內容被重寫也不會不見），
   * 點擊掛在 #mapChip 本身（元素不會換掉，只換內容）。左下角那一排本來不接收點擊，這塊要另外打開。
   * 只在一般地圖顯示：城鎮、活動地圖、武鬥場、魔王戰、試煉、轉職試煉時拿掉。 */
  if (first && CFG.dropList) {
    const st = document.createElement('style');
    st.textContent = '#mapChip.awDropOn{pointer-events:auto;cursor:pointer}' +
      '#mapChip.awDropOn::after{content:"點此查看本地圖掉落";display:block;font-size:.78em;line-height:1.4;color:var(--ember,#497da2);font-weight:normal}' +
      '#mapChip.awDropOn:hover{filter:brightness(1.05)}';
    document.head.appendChild(st);
    const dropOk = () => {
      try {
        if (typeof S === 'undefined' || !S || !(S.map >= 0 && S.map < MAP_N)) return false;
        if (G.arena || G.tw || G.guard != null || G.trial != null || G.trn) return false;
        if (typeof v113Town === 'function' && v113Town()) return false;
        if (typeof ssMap === 'function' && ssMap()) return false;
        return true;
      } catch (e) { return false; }
    };
    every(() => {
      const c = document.querySelector('#mapChip');
      if (!c) return;
      const on = dropOk();
      if (c.classList.contains('awDropOn') !== on) c.classList.toggle('awDropOn', on);
      if (on) c.title = '點此查看本地圖掉落';
      else if (c.title) c.title = '';
    }, 500);
    document.addEventListener('click', e => {
      const c = e.target && e.target.closest && e.target.closest('#mapChip.awDropOn');
      if (!c || !dropOk()) return;
      e.stopPropagation(); e.preventDefault();
      openDrops(S.map);
    }, true);
  }

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
      ['noUpdate', '禁止遊戲自動更新', '有新版時只顯示提示，不會倒數、停止自動挑戰或自己重新整理；要更新請自己重新整理頁面'],
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
      ['cards', '卡片進度', '地圖分頁'], ['earn', '收益統計', '地圖分頁'], ['refCalc', '精煉計算、自動精煉', '煉金分頁'],
      ['treeFind', '天賦樹搜尋', '遊戲的共用天賦樹標題列'], ['dropList', '地圖掉落清單', '點戰鬥畫面左下角的地圖名稱'], ['monAuto', '無限君主「打贏後自動接著打」', '地圖分頁'], ['monLoop', '自動刷神話', '地圖分頁'],
      ['backup', '存檔備份', '選單分頁'], ['arts', '解鎖三神器', '選單分頁'], ['pin', '置頂視窗', '選單分頁；只有電腦版 Chrome／Edge 會出現'],
      ['shopMut', '商人買寶石時選變異形狀', '選單 → 商人'], ['legShop', '商人賣傳說技能寶石', '選單 → 商人 → 主動技能'], ['sxShop', '商人賣穿梭寶石', '選單 → 商人 → 輔助技能'], ['afPick', '指定萃取、指定灌注', '煉金的萃取、灌注視窗']
    ]],
    ['物品上限', [
      ['noLimit', '物品持有無上限', '背包、共用倉庫'],
      ['itemMax', '背包的上限'], ['slateMax', '石板的上限'],
      ['stashMax', '共用倉庫的上限', '遊戲原本 500；倉庫存在瀏覽器裡，太大可能存不進去（遊戲會提示「儲存空間不足」）'],
      ['uqKeepHi', '獨特裝備這個階級以上一律保留', '0 一般、1 高階、2 終局、3 守護者、4 終焉；填 0 關閉這個功能'],
      ['saveWarnKB', '存檔超過幾 KB 就提醒']
    ]],
    ['省資源', [
      ['eco', '省資源', '下面幾項的總開關'],
      ['bgNoDraw', '背景時不畫畫面'],
      ['ecoBtn', '節能模式開關', '畫面上的「🔋 節能」小按鈕：點一下切換、按住拖曳移動、× 暫時收起（下次點書籤或打開單格模式再出現）；關掉這項就完全不顯示'],
      ['ecoFps', '節能模式時畫面每秒更新幾次', '0 = 不限制；只影響畫面，不影響遊戲速度']
    ]],
    ['無限君主', [
      ['monAutoMs', '打贏後等幾毫秒再自動挑戰'],
      ['monLoopLootMs', '自動刷神話：打贏後等幾毫秒再檢查掉落'],
      ['monLoopBatch', '自動刷神話：每打幾場讀一次檔的預設值']
    ]],
    ['其他', [
      ['autoBackup', '套用匯入的計畫前自動備份'], ['backupKeep', '瀏覽器裡最多保留幾份備份'],
      ['planCell', '配置模擬的格子大小（px）'], ['gemPrice', '商店一顆技能寶石的 Zeny 價格', '匯入代碼自動補買時用'],      ['tickMs', '背景時每幾毫秒推動一次遊戲', '太小會吃資源，太大遊戲會變慢'],
      ['refAutoMs', '自動精煉每次之間等幾毫秒'],
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
      if (!grp[1].some(row => CFG_DEF[row[0]] !== undefined)) continue;
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
          const items = list();
          for (const it of items) btnFns[it[0]] = it[2];
          if (!items.length) return html;
          const btns = items.map(it => '<button class="btn sm ' + it[0] + '" style="margin-left:8px">' + it[1] + '</button>').join('');
          /* 有標題（例如選單裡的商人、倉庫頁）就放在標題的結尾前面，和計時器補的位置一樣；
           * 直接寫進內容裡，遊戲重畫（打怪時很常）時按鈕才不會閃一下不見 */
          const h2 = html.search(/<h2[\s>]/);
          if (h2 >= 0) { const end = html.indexOf('</h2>', h2); return end < 0 ? html : html.slice(0, end) + btns + html.slice(end); }
          return '<div class="awBar" style="' + BAR_CSS + '">' + btns + '</div>' + html;
        };
      } catch (e) {}
    };
    wrapPanel('p_map', () => [].concat(CFG.cards ? [['awBtnCards', '卡片進度', openCards]] : [], CFG.earn ? [['awBtnEarn', '收益統計', openEarn]] : []));
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
      if (CFG.earn && ui.tab === 'map') addBtn(barOf(panel), 'awBtnEarn', '收益統計', openEarn, '8px');
      /* 煉金分頁（流浪仙境）：精煉計算 */
      if (CFG.refCalc && ui.tab === 'alch' && typeof v5Refine === 'function' && panel.textContent.indexOf('精煉') >= 0) addBtn(barOf(panel), 'awBtnRef', '精煉計算', openRefCalc, '8px');
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

  /* 再點一次書籤：收起來的節能按鈕（第 15 項）再出現 */
  if (!first) { try { if (window.__awEcoShow) window.__awEcoShow(); } catch (e) {} }
  if (!first) { try { toast('小工具已經啟用：配置模擬在「技能」分頁，物品管理在「背包」分頁的保留規則旁邊', 'lvl'); } catch (e) {} }
})();
