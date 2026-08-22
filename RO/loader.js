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

// TODO：之後接存檔修改工具的實際行為（例如開新視窗載入編輯頁、
// 或用 postMessage / 剪貼簿跟編輯頁互通存檔資料）
function openEditTool(code) {
  console.log('[RO 工具] 開啟編輯工具，輸入值：', code);
}
