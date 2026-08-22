// ============================================================
// 諸神放置錄 — 手機化書籤工具 loader.js
// 由書籤 import() 動態載入：javascript:import('https://.../loader.js?v='+Date.now())
// 之後要更新介面，直接改這支檔案、推上 GitHub 即可，玩家的書籤本身不用重新產生。
//
// 設計原則：
// - 手機化樣式一律包在 @media (pointer: coarse) 裡，電腦滑鼠環境完全不受影響。
// - 頂部的「編輯工具」輸入框不分裝置，一律顯示（之後要接存檔修改工具用）。
// ============================================================

const STYLE_ID = 'ro-idle-mobile-ui-style';
const isTouch = window.matchMedia('(pointer: coarse)').matches;

const CSS = `
/* 以下規則只在觸控裝置（手機/平板）生效，滑鼠環境的電腦完全不受影響 */
@media (pointer: coarse) {

  html, body { touch-action: manipulation; } /* 關閉雙擊縮放手勢 */

  /* 戰鬥區：窄螢幕下原本被強制 320px 最小高度，內容填不滿就留一截空白，改成貼齊內容高度 */
  @media (max-width: 860px) {
    .battle-panel { min-height: auto; }
    .side-panel { max-height: 60vh; }
  }

  /* 頂部狀態列：固定不動 */
  .hud-bar { position: sticky; top: 0; z-index: 50; flex-wrap: wrap; padding: 10px 14px; }
  .hud-gold, .hud-lv, .hud-job-tag { font-size: 13px; }

  /* 音量控制在手機上占位又不常用，先收起來 */
  .volume-controls { display: none; }

  /* 頂部右側一整排功能鈕，改成預設收起，只留一顆展開鈕（#ro-tools-toggle） */
  .hud-right { gap: 8px; row-gap: 8px; }
  .hud-right .btn-save,
  .hud-right #btn-idle-report,
  .hud-right .btn-jobchange {
    display: none;
  }
  body.ro-tools-open .hud-right .btn-save,
  body.ro-tools-open .hud-right #btn-idle-report,
  body.ro-tools-open .hud-right .btn-jobchange {
    display: inline-flex;
    min-height: 46px;
    min-width: 46px;
    padding: 8px 12px;
  }
  /* 編輯工具輸入框：縮起存檔等按鈕時一起隱藏，只在展開時跟著出現（僅觸控裝置） */
  .hud-right #ro-editor-box { display: none; }
  body.ro-tools-open .hud-right #ro-editor-box { display: flex; }
  #ro-tools-toggle {
    min-height: 46px; min-width: 46px; padding: 8px 12px;
    background: var(--bg-panel-2); border: 1px solid var(--gold);
    border-radius: 8px; color: var(--gold-soft); font-size: 17px;
    cursor: pointer; line-height: 1;
  }
  body.ro-tools-open #ro-tools-toggle { border-color: var(--gold-soft); background: #2a2f4e; }

  /* 分頁列：改成底部固定的圖示條，拇指容易點到 */
  .tab-nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
    display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch;
    background: linear-gradient(180deg, var(--bg-panel-2), var(--bg-panel));
    border-top: 2px solid var(--gold);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .tab-btn {
    flex: 0 0 auto; min-width: 76px; min-height: 46px;
    border-right: none; border-bottom: none; font-size: 12px; padding: 10px 14px;
  }
  .tab-btn.active { box-shadow: inset 0 2px 0 var(--gold); }
  .tab-content { padding-bottom: calc(70px + env(safe-area-inset-bottom, 0)); }

  /* 觸控熱區加大 */
  .btn-small, .btn-tiny, .yield-reset-btn, .map-item, .region-item,
  .inv-actions .btn-small, .skill-row .btn-small {
    min-height: 46px; padding-top: 10px; padding-bottom: 10px; font-size: 13px;
  }
  .btn-tiny { min-width: 46px; }

  /* 戰鬥區右上角浮動按鈕：窄螢幕分開排列避免疊在一起 */
  @media (max-width: 480px) {
    .btn-mute { top: 8px; right: 8px; width: 40px; height: 40px; }
    .btn-ally { top: 56px; right: 8px; left: auto; padding: 8px 10px; font-size: 13px; }
    .gm-panel { top: 104px; right: 8px; width: 100px; }
    .ally-panel { top: 8px; right: 8px; left: 8px; width: auto; max-height: calc(100% - 16px); }
  }

  /* 戰鬥紀錄：戰鬥／技能／隊友三欄並排，窄螢幕改成可橫向滑動 */
  @media (max-width: 480px) {
    .combat-log { overflow-x: auto; -webkit-overflow-scrolling: touch; height: 140px; scroll-snap-type: x mandatory; }
    .log-pane { flex: 0 0 78%; min-width: 78%; scroll-snap-align: start; }
  }

  /* 掛機收益面板：窄螢幕改成貼齊螢幕邊緣的全寬浮層 */
  @media (max-width: 480px) {
    #idle-report-panel {
      position: fixed; left: 8px; right: 8px; top: 8px;
      width: auto; max-width: none; max-height: calc(100vh - 86px); z-index: 65;
    }
  }

  /* 彈窗：貼齊螢幕寬度，按鈕加高減少誤觸 */
  .modal-box { width: 92vw; padding: 20px; }
  .modal-confirm .btn, .consent-row .btn { min-height: 46px; }

  /* 怪物血條文字：小螢幕字級加大 */
  @media (max-width: 480px) {
    .monster-hp-text, .monster-slot .monster-name { font-size: 12px; }
  }
}

/* 編輯工具輸入框：不分裝置一律套用同一套外觀 */
#ro-editor-box {
  display: flex; gap: 6px; align-items: center;
}
#ro-editor-input {
  background: var(--bg-panel-2); border: 1px solid var(--line); border-radius: 6px;
  color: var(--ink); font-size: 12px; padding: 6px 8px; width: 130px;
}
#ro-editor-open {
  background: var(--bg-panel-2); border: 1px solid var(--gold); border-radius: 6px;
  color: var(--gold-soft); font-size: 12px; padding: 6px 10px; cursor: pointer;
}
`;

// 原本 index.html 裡的 viewport 設定，關閉時要還原成這個
const ORIGINAL_VIEWPORT = 'width=device-width, initial-scale=1.0';
const MOBILE_VIEWPORT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

const existing = document.getElementById(STYLE_ID);
if (existing) {
  existing.remove();

  if (isTouch) {
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', ORIGINAL_VIEWPORT);
    const toggleBtn = document.getElementById('ro-tools-toggle');
    if (toggleBtn) toggleBtn.remove();
    document.body.classList.remove('ro-tools-open');
  }

  const editorBox = document.getElementById('ro-editor-box');
  if (editorBox) editorBox.remove();

  console.log('[RO 工具] 已關閉');
} else {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);

  const hudRight = document.querySelector('.hud-right');

  if (isTouch) {
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', MOBILE_VIEWPORT);

    // 頂部展開鈕：點一下顯示/隱藏 儲存・匯出・返回・關於・掛機收益 這些按鈕（只在觸控裝置出現）
    if (hudRight && !document.getElementById('ro-tools-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'ro-tools-toggle';
      toggleBtn.type = 'button';
      toggleBtn.textContent = '⚙';
      toggleBtn.title = '顯示／隱藏 儲存・匯出等功能';
      toggleBtn.addEventListener('click', function () {
        document.body.classList.toggle('ro-tools-open');
      });
      hudRight.insertBefore(toggleBtn, hudRight.firstChild);
    }
  }

  // 編輯工具輸入框：電腦／手機都會出現，放在最前面（跟展開鈕同一個位置）
  // 目前只是先建好 UI，openEditTool() 之後接存檔修改工具的實際邏輯
  if (hudRight && !document.getElementById('ro-editor-box')) {
    const box = document.createElement('div');
    box.id = 'ro-editor-box';

    const input = document.createElement('input');
    input.id = 'ro-editor-input';
    input.type = 'text';
    input.placeholder = '尚未開放';

    const openBtn = document.createElement('button');
    openBtn.id = 'ro-editor-open';
    openBtn.type = 'button';
    openBtn.textContent = '開啟';
    openBtn.addEventListener('click', function () {
      openEditTool(input.value);
    });

    box.appendChild(input);
    box.appendChild(openBtn);
    hudRight.insertBefore(box, hudRight.firstChild);
  }

  console.log('[RO 工具] 已套用' + (isTouch ? '（觸控裝置，含手機化版面）' : '（電腦環境，僅新增編輯工具輸入框）') + '，再點一次書籤可關閉');
}

// 修改器正式網址：跟書籤工具放在同一個 repo/資料夾下的 editor/ 子目錄。
const EDITOR_URL = 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO/editor/';
// postMessage 只信任這個 origin 送來的訊息（protocol+host，不含路徑）。
const EDITOR_ORIGIN = 'https://jtnhrbpvvm-spec.github.io';
// 同分頁廣播用（提醒「其他分頁剛好也開著同一個角色」的情境，見下方 broadcastSlotChanged）。
const EDITOR_CHANNEL = 'ro-idle-editor-sync';

// 在輸入框打「開啟修改器」再按開啟，才會跳出修改器視窗；其他輸入一律不做事。
// window.open 是在按鈕點擊事件內同步呼叫的，瀏覽器彈窗攔截不會擋。
function openEditTool(code) {
  if (String(code).trim() !== '開啟修改器') return;
  // 視窗已經開著就只是把它拉到前面，不要重複開、更不要重複凍結。
  if (window.__roEditorWin && !window.__roEditorWin.closed) {
    window.__roEditorWin.focus();
    return;
  }
  const win = window.open(EDITOR_URL, 'ro-save-editor', 'width=480,height=760');
  if (!win) return;
  window.__roEditorWin = win;
  // 訊息監聽只綁一次：書籤是用 import() 每次重新載入整支 loader.js，
  // 用 window.__roEditorMsgBound 這個旗標避免每次開關書籤都疊加一份監聽器。
  if (!window.__roEditorMsgBound) {
    window.addEventListener('message', handleEditorMessage);
    window.__roEditorMsgBound = true;
  }
  freezeGame();
  // 用輪詢偵測修改器視窗被關掉（postMessage 沒有「視窗關閉」事件可以聽），
  // 關掉的當下自動解凍，玩家不用自己按什麼按鈕。
  if (window.__roEditorWatchTimer) clearInterval(window.__roEditorWatchTimer);
  window.__roEditorWatchTimer = setInterval(function () {
    if (win.closed) unfreezeGame();
  }, 600);
}

/* ============================================================
   凍結／解凍（防止修改器開著的期間，掛機進度跟修改互相覆蓋）

   做法不是額外發明一套機制，而是直接借用遊戲本來就有、也已經跑過實戰的
   「切分頁離開」流程（見 ui.js 的 visibilitychange 監聽器、#135）：
   凍結＝當作分頁被切走（stopLoop + 記錄 lastActiveAt + 存檔），
   解凍＝當作切回分頁（computeOfflineProgress 結算這段「離線」時間 + startLoop）。
   這樣不用重新驗證一套新邏輯，行為跟玩家平常切分頁回來時完全一致。

   另外會疊一層半透明遮罩，蓋住整個畫面並擋掉點擊，這樣就算某個操作
   不是靠主迴圈（例如手動按按鈕），凍結期間也點不到。
   ============================================================ */

const EDITOR_FREEZE_STYLE_ID = 'ro-editor-freeze-style';
const EDITOR_FREEZE_OVERLAY_ID = 'ro-editor-freeze-overlay';

function ensureFreezeStyle() {
  if (document.getElementById(EDITOR_FREEZE_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = EDITOR_FREEZE_STYLE_ID;
  s.textContent = `
    #${EDITOR_FREEZE_OVERLAY_ID} {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(10, 8, 20, 0.72); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    #${EDITOR_FREEZE_OVERLAY_ID} .ro-freeze-box {
      background: #211a33; border: 1px solid #c9a227; border-radius: 12px;
      padding: 22px 26px; max-width: 320px; text-align: center;
      font-family: -apple-system, "Microsoft JhengHei", "Noto Sans TC", sans-serif;
      color: #ece6f5;
    }
    #${EDITOR_FREEZE_OVERLAY_ID} .ro-freeze-icon { font-size: 30px; margin-bottom: 8px; }
    #${EDITOR_FREEZE_OVERLAY_ID} .ro-freeze-title { font-size: 15px; font-weight: 700; color: #e0c15a; margin-bottom: 6px; }
    #${EDITOR_FREEZE_OVERLAY_ID} .ro-freeze-desc { font-size: 12.5px; color: #a99bc4; line-height: 1.6; }
    #${EDITOR_FREEZE_OVERLAY_ID} .ro-freeze-force {
      margin-top: 14px; background: none; border: 1px solid #3c2f5c; color: #a99bc4;
      border-radius: 8px; padding: 6px 12px; font-size: 11.5px; cursor: pointer;
    }
    body.ro-editor-frozen { overflow: hidden; }
  `;
  document.head.appendChild(s);
}

function showFreezeOverlay() {
  ensureFreezeStyle();
  if (document.getElementById(EDITOR_FREEZE_OVERLAY_ID)) return;
  const ov = document.createElement('div');
  ov.id = EDITOR_FREEZE_OVERLAY_ID;
  ov.innerHTML =
    '<div class="ro-freeze-box">' +
      '<div class="ro-freeze-icon">🧊</div>' +
      '<div class="ro-freeze-title">遊戲已暫停</div>' +
      '<div class="ro-freeze-desc">修改器視窗開啟中，為了避免掛機進度跟修改互相覆蓋，這個分頁暫時凍結。<br>改完直接關掉修改器的視窗，就會自動恢復。</div>' +
      '<button class="ro-freeze-force" type="button" id="ro-editor-force-unfreeze">修改器視窗不見了？點這裡強制恢復</button>' +
    '</div>';
  document.body.appendChild(ov);
  document.body.classList.add('ro-editor-frozen');
  document.getElementById('ro-editor-force-unfreeze').addEventListener('click', function () {
    unfreezeGame();
  });
}
function hideFreezeOverlay() {
  const ov = document.getElementById(EDITOR_FREEZE_OVERLAY_ID);
  if (ov) ov.remove();
  document.body.classList.remove('ro-editor-frozen');
}

function freezeGame() {
  if (window.__roEditorFrozen) return;
  window.__roEditorFrozen = true;
  if (typeof state !== 'undefined' && state && typeof stopLoop === 'function') {
    stopLoop();
    state.lastActiveAt = Date.now();
    if (typeof saveGame === 'function') saveGame();
  }
  showFreezeOverlay();
}

function unfreezeGame() {
  if (window.__roEditorWatchTimer) { clearInterval(window.__roEditorWatchTimer); window.__roEditorWatchTimer = null; }
  if (!window.__roEditorFrozen) { hideFreezeOverlay(); return; } // 已經不是凍結狀態，只確保遮罩沒殘留
  window.__roEditorFrozen = false;
  hideFreezeOverlay();
  if (typeof state === 'undefined' || !state || typeof startLoop !== 'function') return;
  // 分頁本身還在背景（玩家凍結期間切去別的分頁）：不要在這裡搶著重啟，
  // 交給 ui.js 的 visibilitychange 邏輯，等玩家真的切回來時處理，行為才會一致。
  if (document.hidden) return;
  let off = null;
  try {
    off = (typeof computeOfflineProgress === 'function')
      ? computeOfflineProgress(typeof IDLE_SETTLE_MIN_MS === 'number' ? IDLE_SETTLE_MIN_MS : 5000)
      : null;
  } catch (e) { /* 結算失敗就走一般重啟，不中斷遊戲 */ }
  if (!off) {
    state.lastAttackTime = Date.now();
    state.attackAccumulator = 0;
    state.lastMonsterAttackTime = Date.now();
    (state.monsters || []).forEach(function (m) { m.lastAttackTime = Date.now(); });
    state._lastSlowTick = Date.now();
  }
  startLoop();
  if (typeof deliverOfflineResult === 'function') { try { deliverOfflineResult(off); } catch (e) { /* 忽略 */ } }
  if (typeof renderAll === 'function') { try { renderAll(); } catch (e) { /* 忽略 */ } }
}

/* ============================================================
   修改器橋接（A 頁這邊）
   B 頁（修改器）用 window.open 開啟後，靠 postMessage 溝通：
     B → A  'ro-editor:ready'         B 頁載入完成，要資料
     A → B  'ro-editor:init'          A 回傳全部存檔欄位/倉庫/道具與職業對照表
     B → A  'ro-editor:apply'         玩家在 B 編輯完，送回 {slot, patch}
     A → B  'ro-editor:applied'       A 套用完的結果
     B → A  'ro-editor:apply-warehouse'  倉庫是跨角色的，另外處理
     A → B  'ro-editor:applied-warehouse'
     B → A  'ro-editor:refresh'       B 想重新拿一份最新資料（例如編輯拖太久怕過期）

   設計原則：只送「玩家實際改過的欄位」（patch），套用時用 Object.assign
   淺層覆蓋，不是整包存檔覆蓋——避免修改器編輯期間，玩家分頁仍在背景
   掛機賺的東西被一份舊快照蓋掉。
   ============================================================ */

// 精簡版道具/職業對照表：只留修改器 UI 需要顯示的欄位，
// 不把整份 8MB+ 的 ITEMS/JOB_TREE 塞進 postMessage。
function buildItemMeta() {
  const out = {};
  if (typeof ITEMS === 'object' && ITEMS) {
    for (const id in ITEMS) {
      const it = ITEMS[id];
      out[id] = { name: it.name, icon: it.icon, type: it.type };
    }
  }
  return out;
}
function buildJobMeta() {
  const out = {};
  if (typeof JOB_TREE === 'object' && JOB_TREE) {
    for (const id in JOB_TREE) {
      out[id] = { name: JOB_TREE[id].name };
    }
  }
  return out;
}
function buildAllSlotsSummary() {
  const total = (typeof MAX_SLOTS === 'number') ? MAX_SLOTS : 15;
  const slots = {};
  for (let i = 0; i < total; i++) {
    const raw = localStorage.getItem(getSlotKey(i));
    if (!raw) { slots[i] = null; continue; }
    try { slots[i] = JSON.parse(raw); } catch (e) { slots[i] = null; }
  }
  return slots;
}
function buildInitPayload() {
  return {
    type: 'ro-editor:init',
    slots: buildAllSlotsSummary(),
    warehouse: (typeof loadWarehouse === 'function') ? loadWarehouse() : { items: [], gold: 0 },
    currentSlot: currentSlot,
    itemMeta: buildItemMeta(),
    jobMeta: buildJobMeta()
  };
}

// 套用到指定存檔欄位。如果剛好是「目前正在玩的這欄」，直接改記憶體裡的 state
// 再 saveGame()（state 比 localStorage 新，localStorage 有節流可能落後）；
// 如果是別的欄位，重新讀一次 localStorage 最新內容再 merge 寫回，
// 絕對不去動 currentSlot（不能用現成的 importSaveToSlot()，它會把 currentSlot
// 永久切走，等於把玩家正在玩的分頁弄壞）。
function applyEditorPatchToSlot(slot, patch) {
  if (!Number.isInteger(slot) || !patch || typeof patch !== 'object') return false;
  if (slot === currentSlot && typeof state !== 'undefined' && state) {
    Object.assign(state, patch);
    if (typeof saveGame === 'function') saveGame();
    if (typeof renderAll === 'function') { try { renderAll(); } catch (e) { /* 畫面重繪失敗不影響存檔已經寫入 */ } }
    if (typeof showToast === 'function') showToast('🛠️ 修改器已套用到目前角色');
  } else {
    const raw = localStorage.getItem(getSlotKey(slot));
    let obj = null;
    try { obj = raw ? JSON.parse(raw) : null; } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object') return false; // 目標欄位沒有存檔，不無中生有建立
    Object.assign(obj, patch);
    localStorage.setItem(getSlotKey(slot), JSON.stringify(obj));
  }
  broadcastSlotChanged(slot);
  return true;
}

// 倉庫跨角色、不綁 currentSlot，永遠讀寫同一把 WAREHOUSE_KEY。
function applyEditorPatchToWarehouse(patch) {
  if (!patch || typeof patch !== 'object') return false;
  if (typeof loadWarehouse !== 'function' || typeof saveWarehouse !== 'function') return false;
  const wh = loadWarehouse();
  Object.assign(wh, patch);
  saveWarehouse(wh);
  broadcastSlotChanged(null); // null 代表「倉庫變動」，不對應特定欄位
  return true;
}

// 用 BroadcastChannel 通知同瀏覽器、同源的其他分頁：
// 「這個欄位／倉庫被修改器改過了」。B 頁沒辦法直接連到其他分頁（window.open
// 只拿得到自己開的那一個），所以改成廣播 + 各分頁自己比對是不是正在玩那一欄。
let _editorBC = null;
function broadcastSlotChanged(slot) {
  try {
    if (!('BroadcastChannel' in window)) return;
    if (!_editorBC) _editorBC = new BroadcastChannel(EDITOR_CHANNEL);
    _editorBC.postMessage({ type: 'ro-editor-changed', slot: slot, at: Date.now() });
  } catch (e) { /* 忽略，不影響修改器本身的套用結果 */ }
}
// 監聽其他分頁的廣播；用 window.__roEditorSyncBC 避免每次開關書籤重複註冊。
function listenForEditorSync() {
  try {
    if (!('BroadcastChannel' in window)) return;
    if (window.__roEditorSyncBC) return;
    const bc = new BroadcastChannel(EDITOR_CHANNEL);
    bc.onmessage = function (ev) {
      const msg = ev.data;
      if (!msg || msg.type !== 'ro-editor-changed') return;
      if (msg.slot === null) {
        if (typeof showToast === 'function') showToast('🛠️ 倉庫已被修改器變更，若正在查看倉庫請重新整理分頁');
        return;
      }
      if (typeof currentSlot === 'number' && msg.slot === currentSlot && typeof state !== 'undefined' && state) {
        if (typeof showToast === 'function') showToast('🛠️ 這個角色已在其他分頁被修改器修改，建議重新整理再繼續操作，避免自動存檔互相覆蓋');
      }
    };
    window.__roEditorSyncBC = bc;
  } catch (e) { /* 忽略 */ }
}
listenForEditorSync();

function handleEditorMessage(ev) {
  if (ev.origin !== EDITOR_ORIGIN) return; // 只信任修改器自己的網域
  const win = window.__roEditorWin;
  if (!win || ev.source !== win) return;   // 只信任我們自己開的那個視窗
  const data = ev.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'ro-editor:ready' || data.type === 'ro-editor:refresh') {
    win.postMessage(buildInitPayload(), EDITOR_ORIGIN);
  } else if (data.type === 'ro-editor:apply') {
    const ok = applyEditorPatchToSlot(data.slot, data.patch);
    win.postMessage({ type: 'ro-editor:applied', ok: ok, slot: data.slot }, EDITOR_ORIGIN);
  } else if (data.type === 'ro-editor:apply-warehouse') {
    const ok = applyEditorPatchToWarehouse(data.patch);
    win.postMessage({ type: 'ro-editor:applied-warehouse', ok: ok }, EDITOR_ORIGIN);
  }
}
