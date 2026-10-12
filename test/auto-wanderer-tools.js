javascript:(() => {
  /*
   * 自走勇者 Auto Wanderer 小工具（書籤版）
   *   1. 背景運行：分頁切到背景時遊戲照常跑，不會變成離線收益
   *   2. BOSS 血條：打 BOSS 時在畫面最上方顯示名稱／生命／護盾／剩餘時間
   *   3. 技能冷卻：技能拼圖上每顆主動技能寶石顯示實際冷卻秒數
   *   4. 配置模擬：用存檔裡持有的寶石試排技能盤、即時算 DPS，
   *      按「確定並套用」把配置寫回指定的構築分頁
   *
   *   5. 物品管理：分頁列出裝備、石板、符文、技能寶石，用關鍵字和數值比較搜尋，批次分解／鎖定／解鎖
   *   6. 生命明細：角色分頁的「最大生命」下面顯示算式和各項來源
   *   7. 存檔備份：備份到瀏覽器或下載成檔案，可以還原；套用匯入的計畫前會自動備份
   *   8. 物品持有無上限：背包、石板、符文的數量上限拿掉；獨特裝備可以只保留指定階級以上
   *   9. 禁止自動更新：遊戲出新版時不會自己重新整理
   *  10. 單格模式：技能分頁的開關，開啟後寶石只佔一格、輔助寶石不用相鄰就生效
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
  const VERSION = 'V3';

  /* ===== 設定 ===== */
  const CFG = {
    keepAlive: true,        /* 背景運行 */
    bossBar: true,          /* BOSS 血條 */
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
    uqKeepHi: 2,            /* 獨特裝備這個階級以上一律保留（0 一般、1 高階、2 終局、3 守護者、4 終焉）；設 0 關閉 */
    saveWarnKB: 800,        /* 存檔超過這個大小（KB）就跳警告 */
    noUpdate: true          /* 禁止遊戲自動更新（自動重新整理） */
  };

  /* 所有功能只在第一次點書籤時安裝 */
  const first = !window.__awTools;
  window.__awTools = 1;

  /* ===== 1. 背景運行 =====
   * 遊戲主迴圈靠 requestAnimationFrame 驅動，分頁在背景時瀏覽器不會呼叫它，
   * 中斷超過 60 秒就會改用離線收益。這裡在背景時改由 Web Worker 計時器推動。
   */
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
      /* 背景時每一步的時間比較長，飛向角色的掉落物會一直飛過頭、撿不起來，
       * 所以定時呼叫遊戲自己的 grabDrops()（遊戲在分頁被隱藏時也是用它把地上的東西收起來） */
      if (CFG.bgGrabMs && t - lastGrab >= CFG.bgGrabMs) {
        lastGrab = t;
        try { if (typeof grabDrops === 'function' && typeof G !== 'undefined' && G && !G.dead) grabDrops(); } catch (e) {}
      }
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
    if (typeof S === 'undefined' || !S || !S.gems || !PS) { alert('請先進入遊戲再開啟配置模擬'); return; }

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
        '</div>' +
        '<div data-r="copy" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap"></div>' +
        '<div data-r="gear"></div>' +
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
    const elGrid = q('grid'), elHeld = q('held'), elStat = q('stat'), elPal = q('pal'), elPages = q('pages'), elCopy = q('copy'), elGear = q('gear');

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
    const copyEquip = () => {
      const eq = eqOf(src);
      if (!eq || !Object.keys(eq).length) { alert('構築 ' + (src + 1) + ' 沒有記錄裝備（還沒切換過的構築不會有記錄）'); return; }
      const pool = [...SLOTS.map(sl => S.equip[sl]).filter(Boolean), ...S.bag];
      const names = SLOTS.filter(sl => eq[sl]).map(sl => {
        const it = pool.find(o => o.u === eq[sl]);
        return SLOT_NAME[sl] + '：' + (it ? itemName(it) : '（找不到，可能已分解）');
      });
      if (!confirm('把構築 ' + (src + 1) + ' 的裝備複製到構築 ' + (page + 1) + '？\n\n' + names.join('\n') + '\n\n這會立刻寫入存檔。')) return;
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
      const now = PS.dps || 0;
      const diff = now ? (total / now - 1) * 100 : 0;
      const rows = gems.map(g => ({ g, d: total - dpsOf(gems.filter(o => o !== g)) })).sort((a, b) => b.d - a.d);
      let h =
        '<div style="background:#1a1410;padding:8px;border-radius:4px">' +
          '<div>模擬 DPS</div><div style="font:bold 22px/1.3 monospace;color:#ffd84a">' + fmt(Math.round(total)) + '</div>' +
          '<div style="color:#a89a84">目前遊戲內：' + fmt(Math.round(now)) + '　<b style="color:' + (diff >= 0 ? '#7dffc8' : '#ff5a6a') + '">' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%</b></div>' +
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
    /* 執行裝備計畫。全部先檢查過才動手；回傳 false 代表使用者取消或檢查沒過（這時什麼都沒改）。
     * 多構築計畫一律穿在使用中的構築上，其他構築之後再照抄；單一構築則穿在選定的目標構築 */
    const runGear = () => {
      const tp = multi ? S.gp : page;
      for (const f of gear.fuse) {
        const err = fuseCheck(f);
        if (err) { alert('裝備計畫無法執行，沒有做任何變更。\n鑲嵌 #' + f.u + '：' + err); return false; }
      }
      const fuseItems = gear.fuse.map(f => S.bag.find(o => o.u === f.u));
      const ashNeed = fuseItems.reduce((n, it) => n + ALCH_ASH.f(it.ilvl), 0);
      if ((S.mat.i3 || 0) < fuseItems.length) { alert('灌注石 Lv3 不夠：需要 ' + fuseItems.length + ' 顆，你有 ' + (S.mat.i3 || 0) + ' 顆。沒有做任何變更。'); return false; }
      if (S.ash < ashNeed) { alert('符文灰燼不夠：需要 ' + ashNeed + '。沒有做任何變更。'); return false; }
      for (const u of gear.equip) {
        const it = allItems().find(o => o.u === u);
        if (!it) { alert('裝備計畫無法執行，沒有做任何變更。\n找不到要換上的裝備 #' + u); return false; }
        if (!canWear(it)) { alert('裝備計畫無法執行，沒有做任何變更。\n等級不足，穿不上 ' + itemName(it)); return false; }
      }
      if (!confirm('即將執行（裝備穿在構築 ' + (tp + 1) + '）：\n\n' + planLines().join('\n') +
        '\n\n鑲嵌會消耗 ' + fuseItems.length + ' 顆灌注石 Lv3、' + ashNeed + ' 灰燼和上面列出的符文，鑲嵌後無法取下、無法復原。\n確定執行？')) return false;

      for (let i = 0; i < gear.fuse.length; i++) {
        const it = fuseItems[i];
        it.sock.st = gear.fuse[i].runes.slice();
        fuse(it);
        if (it.sock) { it.sock.st = []; alert('鑲嵌 ' + itemName(it) + ' 沒有成功，已停止後續步驟。'); return false; }
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
    const buyGems = str => {
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
      if (S.ash < cost) { alert('這份配置需要先買寶石：' + list + '，共 ' + cost + ' 灰燼，但你的灰燼不夠。'); return; }
      if (!confirm('這份配置需要先向商店購買寶石：\n\n' + list + '\n\n共 ' + cost + ' 灰燼（你有 ' + fmt(S.ash) + '）。現在購買？\n按取消的話不會購買，缺的寶石會排不上去。')) return;
      for (const x of todo) for (let i = 0; i < x[1]; i++) { S.ash -= CFG.gemPrice; giveGem(x[0]); }
      markDirty();
      saveNow();
      ui.render();
    };
    const importCode = code => {
      const allParts = String(code).split('|').map(t => t.trim()).filter(Boolean);
      /* 先確認貼進來的真的是配置代碼，再動模擬盤。
       * 不然貼錯東西（例如拾取規則的代碼）會把模擬盤清空，接著按確定就會把所有寶石取下 */
      const GEM_RE = /^[a-zA-Z]+\*?(?:#\d+)?:-?\d+,-?\d+,\d$/;
      const looksValid = allParts.some(part => /^[FEB]:/i.test(part) ||
        part.replace(/^G\d:/i, '').split(';').some(t => GEM_RE.test(t.trim())));
      if (!looksValid) {
        alert('這不像是技能配置的代碼，沒有做任何變更。\n\n如果你貼的是拾取規則（開頭是 {"auto":…），它要貼在「背包」分頁 →「物品管理」→「拾取規則」。');
        return;
      }
      let miss = [];
      held = null;
      gear = null;
      multi = null;
      let single = null;
      /* B 段要最先處理：先把缺的寶石買齊，後面排配置時才找得到 */
      for (const part of allParts) if (/^B:/i.test(part)) buyGems(part.slice(2));
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
      if (miss.length) alert('有 ' + miss.length + ' 項放不上去（沒有這顆寶石，或位置超出、重疊、尚未解鎖）：' + miss.join('、'));
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
    const apply = () => {
      if (multi && multi[page]) multi[page] = gems;
      const lists = multi ? multi : { [page]: gems };
      const pages = Object.keys(lists).map(Number);
      if (pages.some(p => lists[p].some(g => gemCells(g).some(([x, y]) => !realOpen.has(x + ',' + y))))) {
        alert('有寶石放在尚未解鎖的格子上，無法套用。請先移開，或取消「預覽全部 36 格」。');
        return;
      }
      /* 要寫入的配置是空的、而那個構築原本有寶石：很可能是誤操作，先問清楚 */
      const emptied = pages.filter(p => !lists[p].length && load(p).length);
      if (emptied.length && !confirm('構築 ' + emptied.map(p => p + 1).join('、') + ' 的模擬盤是空的，套用後那個構築的寶石會全部被取下。\n\n確定要這樣做嗎？')) return;
      /* 執行匯入的計畫前先自動備份一份，做錯了可以到「存檔備份」還原 */
      if (CFG.autoBackup && (gear || multi)) { saveNow(); backupNow('套用計畫前自動備份'); }
      /* 有裝備計畫就先做（使用者取消或檢查沒過就整個不套用）；沒有裝備計畫的多構築寫入也先確認 */
      if (gear) { if (!runGear()) { refresh(); return; } }
      else if (multi && !confirm('即將執行：\n\n' + planLines().join('\n') + '\n\n確定執行？')) return;

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
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') { close(); return; }
      if (a === 'apply') { apply(); return; }
      if (a === 'open') { allOpen = b.checked; drawGrid(); return; }
      if (a === 'rot') { rotate(); return; }
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
        prompt('配置代碼（已嘗試複製到剪貼簿，也可以在這裡全選複製）', code);
        return;
      }
      if (a === 'imp') {
        const code = prompt('貼上配置代碼。匯入後只會改模擬盤和顯示裝備計畫，按「確定並套用」才寫入存檔。');
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
    if (typeof S === 'undefined' || !S || !S.bag) { alert('請先進入遊戲再開啟物品管理'); return; }

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
    const editRules = () => {
      const cur = JSON.stringify({ auto: S.set.auto, keep: S.set.keep || [], xr: S.set.xr || [] });
      const text = prompt('裝備的拾取規則。\n這一串就是目前的設定（可以複製起來備份）；要改的話貼上新的再按確定，按取消就不變。', cur);
      if (text == null || text.trim() === cur) return;
      let r = null;
      try { r = JSON.parse(text); } catch (e) {}
      const err = rulesCheck(r);
      if (err) { alert('沒有套用：' + err); return; }
      r = { auto: r.auto.map(x => (x ? 1 : 0)), keep: r.keep.map(g => ({ on: g.on ? 1 : 0, c: g.c })), xr: r.xr ? r.xr.map(g => ({ on: g.on ? 1 : 0, c: g.c })) : null };
      if (!confirm('要把裝備的規則改成這樣嗎？\n\n' + rulesText(r) + '\n\n之後撿到不符合保留規則、又在自動分解範圍內的裝備會直接變成灰燼。' + (r.xr ? '' : '\n（這串沒有帶萃取規則，萃取規則維持原樣）'))) return;
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
    root.addEventListener('click', e => {
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
        if (!list.length) { alert('選取的物品都不能分解（裝備中、使用中、配置中、已鎖定、神話獨特、一般技能寶石都會跳過）'); return; }
        const ash = list.reduce((n, it) => n + K.ash(it), 0);
        if (!confirm('確定分解 ' + list.length + ' 件' + K.label + '？可得 ' + ash + ' 符文灰燼。' + (skip ? ' 另有 ' + skip + ' 件不能分解，會跳過。' : '') + ' 分解後無法復原。')) return;
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
   */
  const BK_KEY = 'awtools.backups';
  const bkList = () => { try { return JSON.parse(localStorage.getItem(BK_KEY)) || []; } catch (e) { return []; } };
  const bkSave = list => {
    try { localStorage.setItem(BK_KEY, JSON.stringify(list)); return true; }
    catch (e) { alert('瀏覽器的儲存空間不夠，備份沒有存成功。請先刪掉舊的備份，或改用下載成檔案。'); return false; }
  };
  const bkStamp = t => {
    const d = new Date(t), z = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
  };
  /* 把目前的進度備份到瀏覽器裡，回傳是否成功 */
  const backupNow = label => {
    if (typeof S === 'undefined' || !S) return false;
    const list = bkList();
    list.unshift({ t: Date.now(), label: label || '手動備份', name: S.name || '', lvl: S.lvl, data: JSON.stringify(S) });
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
  const restoreSave = (text, when) => {
    let o = null;
    try { o = JSON.parse(text); } catch (e) {}
    if (!o || !o.cls || !Array.isArray(o.gems) || !Array.isArray(o.bag)) { alert('這不是有效的自走勇者存檔。'); return; }
    if (!confirm('要還原成這份存檔嗎？\n\n角色：' + (o.name || '（未命名）') + '　LV' + o.lvl + (when ? '\n備份時間：' + when : '') +
      '\n\n目前的進度會被覆蓋（還原前會先自動備份一份），頁面會重新整理。')) return;
    if (!backupNow('還原前自動備份') && !confirm('目前的進度沒有備份成功，仍然要還原嗎？')) return;
    o.t = Date.now();
    TAB.gone = true;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); }
    catch (e) { TAB.gone = false; alert('寫入存檔失敗，沒有還原。'); return; }
    location.reload();
  };

  const openBackup = () => {
    if (document.querySelector('#awBackup')) return;
    if (typeof S === 'undefined' || !S) { alert('請先進入遊戲再開啟存檔備份'); return; }
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
          '還原會覆蓋目前的進度並重新整理頁面；還原前會先自動備份目前的進度。' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    const elList = root.querySelector('[data-r="list"]');

    const draw = () => {
      const list = bkList();
      elList.innerHTML = list.length ? list.map((b, i) =>
        '<div style="display:flex;gap:8px;align-items:center;padding:4px 6px;border-bottom:1px solid #3a3026;background:#1a1410">' +
          '<div style="flex:1"><b>' + bkStamp(b.t) + '</b> <small style="color:#a89a84">' + String(b.label).replace(/</g, '&lt;') + '</small><br>' +
          '<small style="color:#c8bca8">' + String(b.name || '（未命名）').replace(/</g, '&lt;') + '　LV' + b.lvl + '　' + Math.round(b.data.length / 1024) + ' KB</small></div>' +
          '<button data-a="restore" data-i="' + i + '" style="' + BTN + '">還原</button>' +
          '<button data-a="dl" data-i="' + i + '" style="' + BTN + '">下載</button>' +
          '<button data-a="del" data-i="' + i + '" style="' + BTN + '">刪除</button>' +
        '</div>').join('') : '<div style="padding:10px;color:#a89a84;background:#1a1410">瀏覽器裡還沒有備份</div>';
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
    root.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a, list = bkList(), it = list[+b.dataset.i];
      if (a === 'close') { close(); return; }
      if (a === 'save') { saveNow(); if (backupNow('手動備份')) toast('已備份目前進度', 'lvl'); draw(); return; }
      if (a === 'dlNow') { saveNow(); bkDownload(JSON.stringify(S), S.name, S.lvl, Date.now()); return; }
      if (!it) return;
      if (a === 'dl') { bkDownload(it.data, it.name, it.lvl, it.t); return; }
      if (a === 'del') { if (confirm('刪除 ' + bkStamp(it.t) + ' 的備份？')) { list.splice(+b.dataset.i, 1); bkSave(list); draw(); } return; }
      if (a === 'restore') { restoreSave(it.data, bkStamp(it.t)); }
    });
    draw();
  };

  /* ===== 8. 物品持有無上限 =====
   * 遊戲的上限是寫死的常數（背包 BAG_MAX 500、石板 500、符文 1000），常數本身改不了，
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
    const N = String(CFG.itemMax), NS = String(CFG.slateMax);
    const RULES = [];
    if (CFG.noLimit) {
      RULES.push(
        [/\bBAG_MAX\b/g, N],
        [/\bRUNE_MAX\b/g, N],
        [/S\.runes\.length>=1e3/g, 'S.runes.length>=' + N],
        [/\$\{S\.runes\.length\}\/1000/g, '${S.runes.length}/' + N],
        [/\bSLATE_MAX\b/g, NS],
        [/S\.slates\.length>=500/g, 'S.slates.length>=' + NS],
        [/\$\{S\.slates\.length\}\/500/g, '${S.slates.length}/' + NS]
      );
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
     * 遊戲每次存檔和每次離開無限之塔都會呼叫 lbSend()，它用 S.lb.sent（已上傳的最高層數）判斷要不要上傳。
     * 這裡除了直接擋掉，還把 S.lb.sent 補到目前的最高層數，這樣單格模式打出來的層數
     * 之後也不會被上傳（包含關掉開關、或沒點書籤的時候），要等正常玩法打到更高層才會再上傳。 */
    const realLbSend = window.lbSend;
    const lbMask = () => {
      try {
        if (!S || !S.lb || !S.tw) return;
        if (S.tw.best > (S.lb.sent || 0)) S.lb.sent = S.tw.best;
        S.lb.sn = S.name;
        S.lb.sb = S.tal.asc || '';
      } catch (e) {}
    };
    if (typeof realLbSend === 'function') window.lbSend = () => { if (window.__awOne) { lbMask(); return; } return realLbSend(); };
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
    oneCellToggle = () => {
      if (!window.__awOne) {
        if (!confirm('【單格模式】\n\n開啟後每顆技能寶石只佔一格，輔助寶石不用相鄰就會生效。\n\n' +
          '這是直接修改遊戲規則，傷害會遠高於正常玩法，修改【可能】被作者封鎖。開啟期間不會上傳排行榜，但雲端存檔仍看得到異常的數值。\n\n' +
          '可能導致遊戲存檔或遊戲出問題，請備份存檔後再試。\n\n' +
          '另外：沒有點書籤時遊戲會照原本的形狀計算；之後關閉這個開關，放不下的寶石會退回寶石欄。\n\n確定要開啟嗎？')) return;
        window.__awOne = true;
        try { localStorage.setItem(ONE_KEY, '1'); } catch (e) {}
        lbMask();
        redraw();
        try { toast('單格模式已開啟', 'lvl'); } catch (e) {}
        return;
      }
      window.__awOne = false;
      const bad = misfits();
      if (bad.length && !confirm('關閉單格模式後，有 ' + bad.length + ' 顆寶石照原本的形狀放不下，會退回寶石欄。\n\n確定要關閉嗎？')) { window.__awOne = true; return; }
      for (const g of bad) g.x = g.y = -1;
      try { localStorage.removeItem(ONE_KEY); } catch (e) {}
      try { markDirty(); } catch (e) {}
      redraw();
      try { toast('單格模式已關閉' + (bad.length ? '，' + bad.length + ' 顆寶石退回寶石欄' : ''), 'lvl'); } catch (e) {}
    };
    let was = false;
    try { was = localStorage.getItem(ONE_KEY) === '1'; } catch (e) {}
    if (was) { window.__awOne = true; redraw(); }
  }

  /* ===== 入口按鈕 =====
   * 「配置模擬」按鈕放在技能分頁的標題旁，「物品管理」按鈕放在背包分頁的工具列
   * （拾取篩選／批次分解／保留規則那一列）最後面。
   * 遊戲會不斷重畫面板，所以定時檢查按鈕還在不在，不在就補回去。
   * 按鈕沿用遊戲的 btn sm 樣式；不加 data-act，遊戲自己的點擊處理就不會理它。
   */
  if (first && (CFG.planner || CFG.items || CFG.backup || CFG.oneCell)) {
    const addBtn = (host, cls, label, fn, margin) => {
      if (!host || host.querySelector('.' + cls)) return;
      const b = document.createElement('button');
      b.className = 'btn sm ' + cls;
      b.textContent = label;
      if (margin) b.style.marginLeft = margin;
      b.addEventListener('click', e => { e.stopPropagation(); fn(); });
      host.appendChild(b);
    };
    setInterval(() => {
      if (typeof S === 'undefined' || !S || typeof ui === 'undefined') return;
      const panel = document.querySelector('#panel');
      if (!panel) return;
      if (CFG.planner && ui.tab === 'skill') addBtn(panel.querySelector('h2'), 'awBtnPlan', '配置模擬', openPlanner, '8px');
      if (oneCellToggle && ui.tab === 'skill') addBtn(panel.querySelector('h2'), 'awBtnOne', '單格模式：' + (window.__awOne ? '開' : '關'), oneCellToggle, '8px');
      if (CFG.backup && ui.tab === 'more') addBtn(panel.querySelector('h2'), 'awBtnBackup', '存檔備份', openBackup, '8px');
      if (CFG.items && ui.tab === 'bag') addBtn(panel.querySelector('.row.tools') || panel.firstElementChild, 'awBtnItems', '物品管理', openItems);
    }, CFG.btnRefreshMs);
  }

  if (!first) { try { toast('小工具已經啟用：配置模擬在「技能」分頁，物品管理在「背包」分頁的保留規則旁邊', 'lvl'); } catch (e) {} }
})();
