javascript:(() => {
  /*
   * 自走勇者 Auto Wanderer 小工具（書籤版）
   *   1. 背景運行：分頁切到背景時遊戲照常跑，不會變成離線收益
   *   2. BOSS 血條：打 BOSS 時在畫面最上方顯示名稱／生命／護盾／剩餘時間
   *
   * 用法：整個檔案全選複製，貼到書籤的「網址」欄位即可（第一行的 javascript: 要保留）。
   * 修改注意：
   *   - 註解只能用這種區塊註解，不要用雙斜線註解（貼進書籤時換行會消失，後面的程式會被吃掉）
   *   - 每個敘述結尾都要加分號
   *   - 百分比符號後面不要直接接兩個十六進位字元（會被瀏覽器當成網址編碼）
   */

  /* ===== 設定 ===== */
  const CFG = {
    keepAlive: true,        /* 背景運行 */
    bossBar: true,          /* BOSS 血條 */
    tickMs: 100,            /* 背景時每幾毫秒推動一次遊戲迴圈 */
    barTop: 2,              /* 血條距離畫面頂端（px） */
    barSide: 8,             /* 血條左右留白（px） */
    barHeight: 14,          /* 血條高度（px） */
    barFont: 11,            /* 血條文字大小（px） */
    hpColor: '#c8323c',     /* 生命顏色 */
    shieldColor: '#9ab0ff', /* 護盾顏色 */
    barRefreshMs: 100       /* 血條更新間隔 */
  };

  if (window.__awTools) { alert('小工具已經啟用'); return; }
  window.__awTools = 1;

  /* ===== 1. 背景運行 =====
   * 遊戲主迴圈靠 requestAnimationFrame 驅動，分頁在背景時瀏覽器不會呼叫它，
   * 中斷超過 60 秒就會改用離線收益。這裡在背景時改由 Web Worker 計時器推動。
   */
  if (CFG.keepAlive) {
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

    const fire = () => {
      if (!document.hidden) return;
      const t = performance.now();
      [...pending.values()].forEach(f => f(t));
    };

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
  if (CFG.bossBar) {
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

  document.title = '▶ ' + document.title;
})();
