// ============================================================
// 諸神放置錄 — 手機化書籤工具 loader.js
// 由書籤 import() 動態載入：javascript:import('https://.../loader.js?v='+Date.now())
// 之後要更新手機介面，直接改這支檔案、推上 GitHub 即可，
// 玩家的書籤本身完全不用重新產生。
//
// CSS 直接寫在這支檔案裡（不再另外 fetch 一份 .css），
// 避免 GitHub Pages 對跨網域 fetch 的 CORS 限制導致載入失敗。
// ============================================================

const STYLE_ID = 'ro-idle-mobile-ui-style';

const CSS = `
/* ---------------- 頂部狀態列：固定不動 ---------------- */
.hud-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-wrap: wrap;
  padding: 10px 14px;
}
.hud-gold, .hud-lv, .hud-job-tag { font-size: 13px; }

/* 音量控制在手機上占位又不常用，先收起來 */
.volume-controls { display: none; }

/* 頂部右側一整排功能鈕（儲存/匯出/返回/關於/掛機收益/轉職提醒），
   一起加大熱區、統一間距，避免手指誤觸到隔壁按鈕 */
.hud-right { gap: 8px; row-gap: 8px; }
.btn-save, #btn-idle-report, .btn-jobchange {
  min-height: 46px;
  min-width: 46px;
  padding: 8px 12px;
}

/* ---------------- 分頁列：改成底部固定的圖示條 ----------------
   拇指容易點到，內容捲動也不會被蓋住 */
.tab-nav {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 60;
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(180deg, var(--bg-panel-2), var(--bg-panel));
  border-top: 2px solid var(--gold);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.tab-btn {
  flex: 0 0 auto;
  min-width: 76px;
  min-height: 46px;
  border-right: none;
  border-bottom: none;
  font-size: 12px;
  padding: 10px 14px;
}
.tab-btn.active { box-shadow: inset 0 2px 0 var(--gold); }

/* 分頁列改 fixed 之後，內容區要補回底部安全距離，避免最後一項被蓋住 */
.tab-content { padding-bottom: calc(70px + env(safe-area-inset-bottom, 0)); }

@media (max-width: 860px) {
  .side-panel { max-height: 60vh; }
}

/* ---------------- 觸控熱區加大 ---------------- */
.btn-small, .btn-tiny, .yield-reset-btn, .map-item, .region-item,
.inv-actions .btn-small, .skill-row .btn-small {
  min-height: 46px;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 13px;
}
.btn-tiny { min-width: 46px; }

/* ---------------- 戰鬥區右上角浮動按鈕：窄螢幕分開排列避免疊在一起 ---------------- */
@media (max-width: 480px) {
  .btn-mute { top: 8px; right: 8px; width: 40px; height: 40px; }
  .btn-ally { top: 56px; right: 8px; left: auto; padding: 8px 10px; font-size: 13px; }
  .gm-panel { top: 104px; right: 8px; width: 100px; }
  .ally-panel { top: 8px; right: 8px; left: 8px; width: auto; max-height: calc(100% - 16px); }
}

/* ---------------- 戰鬥紀錄：實際是「戰鬥／技能／隊友」三欄並排，
   窄螢幕硬擠三欄字會小到看不清楚，改成可橫向滑動、每欄給足最小寬度 ---------------- */
@media (max-width: 480px) {
  .combat-log {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    height: 140px;
    scroll-snap-type: x mandatory;
  }
  .log-pane { flex: 0 0 78%; min-width: 78%; scroll-snap-align: start; }
}

/* ---------------- 掛機收益面板：結構跟隊友面板類似，窄螢幕同樣改成
   貼齊螢幕邊緣的全寬浮層，避免疊在靜音/隊友/GM 按鈕上 ---------------- */
@media (max-width: 480px) {
  #idle-report-panel {
    position: fixed;
    left: 8px; right: 8px; top: 8px;
    width: auto; max-width: none;
    max-height: calc(100vh - 86px);
    z-index: 65;
  }
}

/* ---------------- 彈窗：貼齊螢幕寬度，按鈕加高減少誤觸 ---------------- */
.modal-box { width: 92vw; padding: 20px; }
.modal-confirm .btn, .consent-row .btn { min-height: 46px; }

/* ---------------- 怪物血條文字：小螢幕字級加大 ---------------- */
@media (max-width: 480px) {
  .monster-hp-text, .monster-slot .monster-name { font-size: 12px; }
}
`;

const existing = document.getElementById(STYLE_ID);
if (existing) {
  existing.remove();
  console.log('[RO 手機化] 已關閉');
} else {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
  console.log('[RO 手機化] 已套用，再點一次書籤可關閉');
}
