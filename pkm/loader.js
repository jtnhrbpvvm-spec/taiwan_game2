(function () {
  'use strict';

  // ====== 0. 防止重複載入造成的疊加問題 ======
  // 如果之前已經載入過，先呼叫舊版的 cleanup 還原原生函式，
  // 避免 Date.now / setTimeout 被重複包裝、時間越跑越快的 bug。
  if (window.__pokechillCleanup) {
    try { window.__pokechillCleanup(); } catch (e) { /* 忽略 */ }
  }

  const oldUI = document.getElementById('pokechill-helper-ui');
  if (oldUI) oldUI.remove();

  // ====== 1. 備份原生函式，供之後還原 ======
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const originalSetTimeout = window.setTimeout.bind(window);
  const originalSetInterval = window.setInterval.bind(window);
  const originalDateNow = Date.now.bind(Date);
  const originalPerfNow = performance.now.bind(performance);

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

  // ====== 3. UI 面板 ======
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
    cursor: move;
  `;

  // --- 拖曳邏輯（滑鼠 + 觸控），事件掛在 ui 本身而非 document，避免重複載入時監聽器疊加 ---
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function getPointerPos(e) {
    return e.touches ? e.touches[0] : e;
  }

  function onStart(e) {
    if (e.target.tagName.toLowerCase() === 'button') return;
    isDragging = true;
    const pos = getPointerPos(e);
    offsetX = pos.clientX - ui.offsetLeft;
    offsetY = pos.clientY - ui.offsetTop;
  }

  function onMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const pos = getPointerPos(e);
    ui.style.left = `${pos.clientX - offsetX}px`;
    ui.style.top = `${pos.clientY - offsetY}px`;
  }

  function onEnd() {
    isDragging = false;
  }

  ui.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  ui.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);

  // ====== 4. 自動戰鬥區塊 ======
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

  // 優化：只掃描按鈕類元素，而不是整個 DOM 的 '*'，大幅降低每次輪詢的成本
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

  ui.appendChild(autoBtn);

  // ====== 5. 加速器區塊 ======
  const label = document.createElement('div');
  label.innerText = '⏱️ 遊戲變速器 (目前: 1x)';
  label.style.marginBottom = '8px';
  label.style.fontWeight = 'bold';
  label.style.fontSize = '13px';
  label.style.color = '#ddd';
  ui.appendChild(label);

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

  ui.appendChild(speedContainer);

  // ====== 6. 卸載按鈕：完整還原所有被 hook 的原生函式與監聽器 ======
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
  ui.appendChild(unloadBtn);

  document.body.appendChild(ui);

  // ====== 7. 全域 cleanup，供重新載入或手動卸載時呼叫 ======
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
