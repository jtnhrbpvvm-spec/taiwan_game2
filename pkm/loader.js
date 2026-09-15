(function () {
  'use strict';

  // ====== 0. 防止重複載入造成的疊加問題 ======
  if (window.__pokechillCleanup) {
    try { window.__pokechillCleanup(); } catch (e) { /* 忽略 */ }
  }

  const oldUI = document.getElementById('pokechill-helper-ui');
  if (oldUI) oldUI.remove();

  // ====== 1. 備份原生函式，供之後還原 / 供內部真實計時使用 ======
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const originalSetTimeout = window.setTimeout.bind(window);
  const originalSetInterval = window.setInterval.bind(window);
  const originalDateNow = Date.now.bind(Date);
  const originalPerfNow = performance.now.bind(performance);
  // 注意：Date.now / performance.now 底下會被整頁 hook 成假時間，
  // 所以 UI 內部（例如拖曳/點擊的計時判斷）一律要用 originalPerfNow()，
  // 不能用被 hook 過的版本，否則開高倍速時點擊判斷會全部跑掉。

  // ====== 2. 加速變數與時間掛鉤 ======
  let speedMultiplier = 1;
  let fakeTime = originalDateNow();
  let lastRealTime = originalDateNow();
  let fakePerfTime = originalPerfNow();
  let lastRealPerfTime = originalPerfNow();

  Date.now = function () {
    const now = originalDateNow();
    fakeTime += (now - lastRealTime) * speedMultiplier;
    lastRealTime = now;
    return Math.floor(fakeTime);
  };

  performance.now = function () {
    const now = originalPerfNow();
    fakePerfTime += (now - lastRealPerfTime) * speedMultiplier;
    lastRealPerfTime = now;
    return fakePerfTime;
  };

  window.setTimeout = function (callback, delay, ...args) {
    return originalSetTimeout(callback, (delay || 0) / speedMultiplier, ...args);
  };

  window.setInterval = function (callback, delay, ...args) {
    return originalSetInterval(callback, (delay || 0) / speedMultiplier, ...args);
  };

  // ====== 3. UI 容器 ======
  const ui = document.createElement('div');
  ui.id = 'pokechill-helper-ui';
  ui.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.85);
    padding: 14px;
    border-radius: 10px;
    color: #fff;
    font-family: sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border: 1px solid #444;
    user-select: none;
    touch-action: none;
    width: 220px;
    box-sizing: border-box;
    cursor: move;
    transition: width 0.15s ease, height 0.15s ease, padding 0.15s ease, border-radius 0.15s ease;
  `;

  // --- 標題列（含縮小按鈕） ---
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  `;
  const title = document.createElement('span');
  title.innerText = '⚙️ Pokechill 助手';
  title.style.cssText = 'font-size: 13px; font-weight: bold; color: #ddd;';
  const minimizeBtn = document.createElement('button');
  minimizeBtn.innerText = '－';
  minimizeBtn.title = '縮小成圓形';
  minimizeBtn.style.cssText = `
    width: 22px;
    height: 22px;
    line-height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #333;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
  `;
  header.appendChild(title);
  header.appendChild(minimizeBtn);
  ui.appendChild(header);

  // --- 內容區（縮小時整塊隱藏） ---
  const contentWrapper = document.createElement('div');
  ui.appendChild(contentWrapper);

  // --- 縮小後顯示的圖示（展開時隱藏） ---
  const circleIcon = document.createElement('div');
  circleIcon.innerText = '🎮';
  circleIcon.style.cssText = `
    display: none;
    font-size: 24px;
    line-height: 1;
  `;
  ui.appendChild(circleIcon);

  // ====== 4. 拖曳邏輯（滑鼠 + 觸控通用），並區分「拖曳」與「點一下」 ======
  // 手機用觸控、電腦用滑鼠，判斷方式不同，但只要統一用座標位移 + 真實耗時
  // 來分辨「使用者是在拖曳」還是「只是點一下想切換大小」，兩種輸入方式都適用。
  let isDragging = false;
  let hasMoved = false;
  let offsetX = 0;
  let offsetY = 0;
  let pressStartX = 0;
  let pressStartY = 0;
  let pressStartTime = 0;
  const DRAG_THRESHOLD_PX = 8;   // 超過這個位移量才算「拖曳」，不算單純點擊
  const TAP_MAX_DURATION_MS = 400; // 按著超過這個時間也不算單純點擊

  function getPointerPos(e) {
    return e.touches ? e.touches[0] : e;
  }

  function clampToViewport() {
    const rect = ui.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;
    let left = parseFloat(ui.style.left) || 0;
    let top = parseFloat(ui.style.top) || 0;
    left = Math.min(Math.max(left, 0), Math.max(maxLeft, 0));
    top = Math.min(Math.max(top, 0), Math.max(maxTop, 0));
    ui.style.left = `${left}px`;
    ui.style.top = `${top}px`;
  }

  function onStart(e) {
    // 點到真正的 <button>（自動戰鬥／變速／卸載／縮小鈕）時，交給按鈕自己的 onclick 處理，不啟動拖曳
    if (e.target.closest('button')) return;
    isDragging = true;
    hasMoved = false;
    const pos = getPointerPos(e);
    offsetX = pos.clientX - ui.offsetLeft;
    offsetY = pos.clientY - ui.offsetTop;
    pressStartX = pos.clientX;
    pressStartY = pos.clientY;
    pressStartTime = originalPerfNow(); // 用真實時間，不受變速影響
  }

  function onMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const pos = getPointerPos(e);
    const dx = pos.clientX - pressStartX;
    const dy = pos.clientY - pressStartY;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
      hasMoved = true;
    }
    ui.style.left = `${pos.clientX - offsetX}px`;
    ui.style.top = `${pos.clientY - offsetY}px`;
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    clampToViewport();

    const elapsed = originalPerfNow() - pressStartTime;
    // 縮小成圓形時，沒有明顯拖曳位移、按壓時間又短 → 視為「點一下」，展開面板
    if (minimized && !hasMoved && elapsed < TAP_MAX_DURATION_MS) {
      toggleMinimize();
    }
  }

  ui.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  ui.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);

  // ====== 5. 縮小 / 展開切換 ======
  let minimized = false;

  function toggleMinimize() {
    minimized = !minimized;
    if (minimized) {
      header.style.display = 'none';
      contentWrapper.style.display = 'none';
      circleIcon.style.display = 'flex';
      ui.style.width = '56px';
      ui.style.height = '56px';
      ui.style.padding = '0';
      ui.style.borderRadius = '50%';
      ui.style.display = 'flex';
      ui.style.alignItems = 'center';
      ui.style.justifyContent = 'center';
    } else {
      header.style.display = 'flex';
      contentWrapper.style.display = 'block';
      circleIcon.style.display = 'none';
      ui.style.width = '220px';
      ui.style.height = 'auto';
      ui.style.padding = '14px';
      ui.style.borderRadius = '10px';
      // 展開時要把縮小模式加上的 flex 置中樣式還原，
      // 不然 header / contentWrapper 會被當成橫向排列的 flex 項目，版面就亂了
      ui.style.display = 'block';
      ui.style.alignItems = '';
      ui.style.justifyContent = '';
    }
    clampToViewport();
  }

  minimizeBtn.onclick = toggleMinimize;

  // ====== 6. 自動戰鬥區塊 ======
  let autoTimer = null;
  const autoBtn = document.createElement('button');
  autoBtn.innerText = '🤖 自動戰鬥：關閉';
  autoBtn.style.cssText = `
    width: 100%;
    padding: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: bold;
    color: white;
    background-color: #ff4d4f;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  `;

  const REMATCH_TEXTS = new Set(['再次战斗', '再次戰鬥', 'Rematch']);
  function findRematchButton() {
    const candidates = document.querySelectorAll('button, a, div[role="button"], span[role="button"]');
    for (const el of candidates) {
      const text = (el.innerText || '').trim();
      if (REMATCH_TEXTS.has(text) && el.offsetWidth > 0) {
        return el;
      }
    }
    return null;
  }

  function startAutoClick() {
    autoTimer = nativeSetInterval(() => {
      const targetBtn = findRematchButton();
      if (targetBtn) {
        targetBtn.click();
      }
    }, 800);
  }

  autoBtn.onclick = function () {
    if (autoTimer) {
      nativeClearInterval(autoTimer);
      autoTimer = null;
      autoBtn.innerText = '🤖 自動戰鬥：關閉';
      autoBtn.style.backgroundColor = '#ff4d4f';
    } else {
      startAutoClick();
      autoBtn.innerText = '⚡ 自動戰鬥：開啟中';
      autoBtn.style.backgroundColor = '#52c41a';
    }
  };

  contentWrapper.appendChild(autoBtn);

  // ====== 7. 加速器區塊 ======
  const label = document.createElement('div');
  label.innerText = '⏱️ 遊戲變速器 (目前: 1x)';
  label.style.marginBottom = '8px';
  label.style.fontWeight = 'bold';
  label.style.fontSize = '13px';
  label.style.color = '#ddd';
  contentWrapper.appendChild(label);

  const speedContainer = document.createElement('div');
  speedContainer.style.display = 'flex';
  speedContainer.style.gap = '4px';
  speedContainer.style.marginBottom = '10px';

  const speeds = [1, 30, 50, 100, 200];
  const speedBtnMap = [];

  speeds.forEach((s) => {
    const btn = document.createElement('button');
    btn.innerText = s + 'x';
    btn.style.cssText = `
      flex: 1;
      padding: 5px 0;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      background: ${s === 1 ? '#4CAF50' : '#333'};
      color: white;
      font-weight: bold;
      font-size: 12px;
    `;

    btn.onclick = () => {
      speedMultiplier = s;
      label.innerText = `⏱️ 遊戲變速器 (目前: ${s}x)`;
      speedBtnMap.forEach((item) => {
        item.btn.style.background = item.speed === s ? '#4CAF50' : '#333';
      });
    };

    speedBtnMap.push({ speed: s, btn });
    speedContainer.appendChild(btn);
  });

  contentWrapper.appendChild(speedContainer);

  // ====== 8. 卸載按鈕 ======
  const unloadBtn = document.createElement('button');
  unloadBtn.innerText = '🗑️ 卸載腳本';
  unloadBtn.style.cssText = `
    width: 100%;
    padding: 6px 0;
    cursor: pointer;
    border: none;
    border-radius: 4px;
    background: #555;
    color: #ddd;
    font-size: 12px;
  `;
  unloadBtn.onclick = () => window.__pokechillCleanup();
  contentWrapper.appendChild(unloadBtn);

  document.body.appendChild(ui);

  // ====== 9. 全域 cleanup ======
  window.__pokechillCleanup = function () {
    if (autoTimer) nativeClearInterval(autoTimer);
    Date.now = originalDateNow;
    performance.now = originalPerfNow;
    window.setTimeout = originalSetTimeout;
    window.setInterval = originalSetInterval;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
    const el = document.getElementById('pokechill-helper-ui');
    if (el) el.remove();
    delete window.__pokechillCleanup;
    console.log('%c🗑️ Pokechill 輔助腳本已卸載，原生函式已還原。', 'color: #ff4d4f; font-weight: bold;');
  };

  console.log('%c✅ Pokechill 支援手機拖曳版本已成功載入！', 'color: #52c41a; font-size: 14px; font-weight: bold;');
})();
