// ============================================================
// 諸神放置錄 — 手機化書籤工具 loader.js
// 由書籤 import() 動態載入：javascript:import('https://.../loader.js?v='+Date.now())
// 之後要更新介面，直接改這支檔案、推上 GitHub 即可，玩家的書籤本身不用重新產生。
//
// 設計原則：
// - 手機化樣式一律包在 @media (pointer: coarse) 裡，電腦滑鼠環境完全不受影響。
// - 頂部的「編輯工具」輸入框不分裝置，一律顯示（之後要接存檔修改工具用）。
// ============================================================

// 版本號：每次改這支檔案就 +1。修改器頁面（editor/index.html）自己右上角有
// V幾號可以看，但 loader.js 這邊本來沒地方顯示，兩邊各自更新容易忘記同步——
// 忘記重新上傳 loader.js、只上傳了修改器，結果修改器要的新欄位（例如某次
// 新增的成就資料）沒送過來，畫面看起來就是空的，卻很難第一時間看出是哪邊沒更新。
// 這個版本號會透過 init 訊息送給修改器，修改器畫面上會顯示「loader Lxx」，
// 兩邊版本號同時看得到，比對得出來是不是漏傳了。
const LOADER_VERSION = 'L10';

const STYLE_ID = 'ro-idle-mobile-ui-style';
const isTouch = window.matchMedia('(pointer: coarse)').matches;

const CSS = `
/* 以下規則只在觸控裝置（手機/平板）生效，滑鼠環境的電腦完全不受影響 */
@media (pointer: coarse) {

  html, body { touch-action: manipulation; } /* 關閉雙擊縮放手勢 */
  /* 關閉「捲到最頂端再往下拉」時瀏覽器原生的下拉重整手勢。
     overscroll-behavior 是現代瀏覽器的正規做法，但舊版 iOS Safari 不一定吃，
     下面 bindPullToRefreshGuard() 另外用 touchmove 擋一層當備案。 */
  html, body { overscroll-behavior-y: contain; }

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
  .hud-right { gap: 8px; row-gap: 8px; flex-wrap: wrap; }
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
  /* 齒輪展開鈕後面強制換行：鋅幣／儲存／匯出／返回…那一整串不夠寬時本來會被
     裁到螢幕外，塞一個 flex-basis:100% 的隱形項目，逼它們換到下一行顯示。 */
  #ro-tools-break { flex-basis: 100%; height: 0; }

  /* 分頁列：改成底部固定的圖示條，拇指容易點到 */
  .tab-nav {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 90;
    display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch;
    background: linear-gradient(180deg, var(--bg-panel-2), var(--bg-panel));
    border-top: 2px solid var(--gold);
    padding-bottom: env(safe-area-inset-bottom, 0);
    /* 手機捏合縮放（pinch-zoom）時，position:fixed 的元素在 iOS Safari 上常會
       暫時消失，要等縮放手勢結束、畫面縮回去才會重新出現——這是已知的瀏覽器
       算圖問題。強制把這個元素獨立成一層合成圖層（GPU layer），可以大幅緩解
       這個問題。不是 100% 保證所有機型都沒事，但這是業界公認的解法。 */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    will-change: transform;
  }
  .tab-btn {
    flex: 0 0 auto; min-width: 76px; min-height: 46px;
    border-right: none; border-bottom: none; font-size: 12px; padding: 10px 14px;
  }
  .tab-btn.active { box-shadow: inset 0 2px 0 var(--gold); }

  /* 底部分頁列只留 4 顆：地圖／自動戰鬥／角色相關／其他。
     左右滑動生硬主要是按鈕塞太多，原本 9+1 顆縮到 4 顆之後窄螢幕也不用再橫捲。
     其餘原生分頁鈕從列上隱藏（功能都還在，收進「角色相關」「其他」彈出清單裡，
     見下面 #ro-group-popup），只是 display:none，原本 switchTab() 邏輯完全沒動。 */
  .tab-nav [data-tab="character"], .tab-nav [data-tab="skills"], .tab-nav [data-tab="inventory"],
  .tab-nav [data-tab="equip"], .tab-nav [data-tab="jobtree"], .tab-nav [data-tab="codex"],
  .tab-nav [data-tab="achievements"], .tab-nav #tab-btn-forge {
    display: none !important;
  }
  .ro-group-btn.active { box-shadow: inset 0 2px 0 var(--gold); }
  #ro-group-popup {
    position: fixed; left: 8px; right: 8px; z-index: 95;
    background: var(--bg-panel-2); border: 1px solid var(--gold); border-radius: 12px;
    padding: 8px; max-height: 60vh; overflow-y: auto; -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    transform: translateY(12px); opacity: 0;
    transition: transform .18s ease, opacity .18s ease;
    pointer-events: none;
  }
  #ro-group-popup.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
  .ro-group-item {
    display: flex; align-items: center; gap: 10px; padding: 13px 12px;
    border-radius: 8px; font-size: 14px; min-height: 46px; cursor: pointer;
  }
  .ro-group-item:active { background: var(--bg-panel); }
  .ro-group-item .ic { font-size: 18px; width: 26px; text-align: center; flex-shrink: 0; }

  /* 分頁內容改成獨立彈出的滿版視窗，不再跟地圖黏在同一個長頁面裡滑——
     點下方分頁鈕（地圖／自動戰鬥／角色／…／裝備）之後，這裡會整片蓋住畫面，
     內容自己捲動，跟戰鬥畫面完全分開，武器/防具清單也不會被擠到更下層。
     預設收在畫面下方（translateY(100%)），body.ro-tabcontent-open 時才滑上來。
     z-index 特意比 .tab-nav（90）低，讓底部分頁列永遠浮在這片視窗上面，
     隨時點得到、切得到；加 !important 是防止遊戲本體自己的 CSS 選擇器
     特異度比這裡高，把 position:fixed 蓋掉導致整片內容變回卡在頁面裡。 */
  .tab-content {
    position: fixed !important; left: 0 !important; right: 0 !important;
    top: 0 !important; bottom: 0 !important; z-index: 65 !important;
    /* 遊戲本體原本的版面是桌機側欄設計，裡面的分頁內容自己可能帶著固定
       高度／max-height（設計成配合桌機側欄的既有高度）。只設 top/bottom
       沒用，任何一邊被明確的 height 卡住，畫面就會停在半路留一片黑，
       所以連 height 系列全部強制 reset 掉。 */
    height: auto !important; min-height: 0 !important; max-height: none !important;
    background: var(--bg-panel-2) !important;
    padding: 0 14px calc(78px + env(safe-area-inset-bottom, 0)) 14px !important;
    overflow-y: auto !important; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    transform: translateY(100%) !important;
    transition: transform .22s ease !important;
    pointer-events: none !important;
  }
  body.ro-tabcontent-open .tab-content {
    transform: translateY(0) !important;
    pointer-events: auto !important;
  }
  .tab-panel { height: auto !important; min-height: 0 !important; max-height: none !important; }
  /* 關閉鈕改成貼在彈出視窗「自己內部」捲動範圍最上方（position:sticky），
     不是另外獨立一個 fixed 元素——這樣它一定跟視窗本身同一層堆疊，
     不用再去猜跟其他元素的 z-index 高低關係，一定會顯示、一定按得到。 */
  #ro-tabcontent-closebar {
    position: sticky; top: 0; z-index: 5;
    margin: 0 -14px 10px -14px; padding: 10px 14px;
    background: var(--bg-panel-2); border-bottom: 1px solid var(--gold);
    display: flex; justify-content: flex-end;
  }
  #ro-tabcontent-close {
    min-height: 40px; padding: 6px 16px; border-radius: 8px;
    background: var(--bg-panel); border: 1px solid var(--gold);
    color: var(--gold-soft); font-size: 14px; cursor: pointer;
  }

  /* 裝備分頁第二層彈窗：點武器／防具／遺物才跳出，專門用來選要換上的東西，
     跟上面裝備欄格狀總覽分開，不會再被擠在同一片捲動區域裡看不到。
     z-index 故意比 .tab-nav（90）還高，選裝備這件事優先於底部導覽。 */
  #ro-equip-pick-popup {
    position: fixed !important; inset: 0 !important; z-index: 120 !important;
    background: var(--bg-panel-2) !important;
    display: flex !important; flex-direction: column !important;
  }
  #ro-equip-pick-popup.hidden { display: none !important; }
  #ro-equip-pick-popup-bar {
    flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
    gap: 8px; flex-wrap: wrap;
    padding: 12px 14px; border-bottom: 1px solid var(--gold); background: var(--bg-panel-2);
    padding-top: calc(12px + env(safe-area-inset-top, 0));
  }
  #ro-equip-pick-popup-title { color: var(--gold-soft); font-size: 15px; font-weight: 700; }
  #ro-equip-pick-popup-close {
    min-height: 40px; padding: 6px 14px; border-radius: 8px; white-space: nowrap;
    background: var(--bg-panel); border: 1px solid var(--gold);
    color: var(--gold-soft); font-size: 13.5px; cursor: pointer;
  }
  #ro-equip-pick-popup-body {
    flex: 1 1 auto; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    padding: 14px calc(14px) calc(24px + env(safe-area-inset-bottom, 0)) 14px;
  }

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
  /* 掛機收益／隊友這兩個浮動面板的關閉鈕原本太小，加大觸控熱區 */
  #idle-report-panel .ally-panel-close,
  #ally-panel .ally-panel-close {
    min-width: 44px; min-height: 44px; font-size: 20px;
  }

  /* 彈窗：貼齊螢幕寬度，按鈕加高減少誤觸；內容過長時視窗本身不超出螢幕，
     改成視窗內部自己捲動，底部的確認鈕永遠看得到、按得到，不用縮放頁面。 */
  .modal-box { width: 92vw; padding: 20px; }
  .modal-confirm .btn, .consent-row .btn { min-height: 46px; }
  .modal-box-tall {
    max-height: 82vh; display: flex; flex-direction: column;
  }
  #about-modal-body, #consent-modal-body {
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    flex: 1 1 auto; min-height: 0;
  }

  /* 怪物血條文字：小螢幕字級加大 */
  @media (max-width: 480px) {
    .monster-hp-text, .monster-slot .monster-name { font-size: 12px; }
  }
}

/* 編輯工具輸入框：不分裝置一律套用同一套外觀 */
#ro-editor-box {
  display: flex; gap: 6px; align-items: center; position: relative;
}
#ro-editor-input {
  background: var(--bg-panel-2); border: 1px solid var(--line); border-radius: 6px;
  color: var(--ink); font-size: 12px; padding: 6px 8px; width: 130px;
}
#ro-editor-input[readonly] { cursor: pointer; caret-color: transparent; }
#ro-editor-open {
  background: var(--bg-panel-2); border: 1px solid var(--gold); border-radius: 6px;
  color: var(--gold-soft); font-size: 12px; padding: 6px 10px; cursor: pointer;
}
#ro-editor-hint {
  background: none; border: none; color: var(--ink-dim, #a99bc4); font-size: 14px;
  padding: 2px 4px; cursor: pointer; line-height: 1;
}
#ro-slot-picker-list {
  position: fixed; z-index: 500; display: none;
  background: var(--bg-panel-2); border: 1px solid var(--gold); border-radius: 8px;
  max-height: 60vh; overflow-y: auto; box-shadow: 0 10px 24px rgba(0,0,0,.45);
}
#ro-slot-picker-list.open { display: block; }
.ro-slot-item {
  padding: 9px 12px; font-size: 12.5px; cursor: pointer; white-space: nowrap;
  border-bottom: 1px solid var(--line); color: var(--ink);
}
.ro-slot-item:last-child { border-bottom: none; }
.ro-slot-item:hover, .ro-slot-item:active { background: var(--bg-panel); }
.ro-slot-item.freeform { color: var(--gold-soft); font-weight: 700; }
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
    const brk = document.getElementById('ro-tools-break');
    if (brk) brk.remove();
    document.body.classList.remove('ro-tools-open');
    // 底部分頁列瘦身用的「角色相關／其他」按鈕跟彈出清單也是動態插入的，
    // 沒清掉的話關閉工具後會跟遊戲原本的分頁鈕重複顯示、擠成一團。
    const charBtn = document.getElementById('ro-group-btn-character');
    if (charBtn) charBtn.remove();
    const otherBtn = document.getElementById('ro-group-btn-other');
    if (otherBtn) otherBtn.remove();
    const groupPopup = document.getElementById('ro-group-popup');
    if (groupPopup) groupPopup.remove();
    window.__roBottomNavGroupsBound = false; // 允許下次重新開啟工具時再插回去
  }

  const editorBox = document.getElementById('ro-editor-box');
  if (editorBox) editorBox.remove();
  const slotPicker = document.getElementById('ro-slot-picker-list');
  if (slotPicker) slotPicker.remove();

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
      // 強制在齒輪後面換行，鋅幣／儲存／匯出…那一串固定從下一行開始，
      // 不會再被裁到螢幕外（見上面 CSS 的 #ro-tools-break）。
      if (!document.getElementById('ro-tools-break')) {
        const brk = document.createElement('div');
        brk.id = 'ro-tools-break';
        brk.setAttribute('aria-hidden', 'true');
        toggleBtn.insertAdjacentElement('afterend', brk);
      }
    }
  }

  // 編輯工具輸入框：電腦／手機都會出現，放在最前面（跟展開鈕同一個位置）
  // 除了原本「打開啟修改器」，現在多一個「選存檔」下拉（見 buildSlotPickerList）
  // 跟「直接打數字切角色」的捷徑（見 handleEditorInputAction）。
  if (hudRight && !document.getElementById('ro-editor-box')) {
    const box = document.createElement('div');
    box.id = 'ro-editor-box';

    const input = document.createElement('input');
    input.id = 'ro-editor-input';
    input.type = 'text';
    input.placeholder = '讀取存檔';
    // 預設唯讀：手機上點下去不會跳鍵盤，先跳出下拉選單給玩家選；
    // 選單裡選「自己輸入」才會拿掉唯讀、真的把游標放進去、跳鍵盤讓玩家打字。
    input.readOnly = true;
    input.addEventListener('click', function () {
      if (!input.readOnly) { input.focus(); return; } // 已經在自由輸入模式，順便補一次 focus 當保險
      toggleSlotPickerList(input);
    });

    const openBtn = document.createElement('button');
    openBtn.id = 'ro-editor-open';
    openBtn.type = 'button';
    openBtn.textContent = '開啟';
    openBtn.addEventListener('click', function () {
      handleEditorInputAction(input.value);
    });

    const hintBtn = document.createElement('button');
    hintBtn.id = 'ro-editor-hint';
    hintBtn.type = 'button';
    hintBtn.textContent = 'ⓘ';
    hintBtn.title = '可選擇存檔或是自行輸入存檔數字編號開啟存檔';
    hintBtn.addEventListener('click', function () {
      if (typeof showToast === 'function') showToast('可選擇存檔或是自行輸入存檔數字編號開啟存檔');
    });

    box.appendChild(input);
    box.appendChild(openBtn);
    box.appendChild(hintBtn);
    hudRight.insertBefore(box, hudRight.firstChild);
  }

  console.log('[RO 工具] 已套用' + (isTouch ? '（觸控裝置，含手機化版面）' : '（電腦環境，僅新增編輯工具輸入框）') + '，再點一次書籤可關閉');
}

// 修改器正式網址：跟書籤工具放在同一個 repo/資料夾下的 editor/ 子目錄。
const EDITOR_URL = 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO/editor/';
// 物品清理工具：獨立新頁面，跟修改器分開，密語「刪除物品」才會開。
const ITEM_TOOL_URL = 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO/item-tool/';
// postMessage 只信任這個 origin 送來的訊息（protocol+host，不含路徑）——
// 修改器跟物品清理工具都在同一個 GitHub Pages 網域下，共用同一個 origin 檢查。
const EDITOR_ORIGIN = 'https://jtnhrbpvvm-spec.github.io';
// 同分頁廣播用（提醒「其他分頁剛好也開著同一個角色」的情境，見下方 broadcastSlotChanged）。
const EDITOR_CHANNEL = 'ro-idle-editor-sync';

// 輸入框按「開啟」時的總入口：判斷這次輸入到底是「開啟修改器」的密語、
// 純數字（直接切到那個存檔欄位），還是下拉選單帶出來的「N.存檔N...」格式
// （一樣取開頭數字切欄位）。其餘輸入一律不做事，跟原本的行為一致。
function handleEditorInputAction(raw) {
  const v = String(raw).trim();
  if (v === '開啟修改器') { openEditTool(v); return; }
  if (v === '刪除物品') { openItemTool(); return; }
  const m = v.match(/^(\d+)/); // 純數字，或「2.存檔2 ...」這種下拉選單帶出來的格式，都吃開頭數字
  if (m) { switchToSaveSlot(parseInt(m[1], 10) - 1); return; } // 玩家看到的是 1-based，內部欄位是 0-based
}

// 切換到另一個存檔欄位（跟標題畫面選欄位是同一件事，只是從遊戲中直接做，
// 不用先回標題）。切之前一定要先存檔，不然目前角色這段時間的進度會不見。
function switchToSaveSlot(idx) {
  const total = (typeof MAX_SLOTS === 'number') ? MAX_SLOTS : 15;
  if (!Number.isInteger(idx) || idx < 0 || idx >= total) {
    if (typeof showToast === 'function') showToast('⚠️ 沒有這個存檔欄位');
    return;
  }
  if (typeof state !== 'undefined' && state && idx === currentSlot) {
    if (typeof showToast === 'function') showToast('已經是目前這個角色了');
    return;
  }
  if (!localStorage.getItem(getSlotKey(idx))) {
    if (typeof showToast === 'function') showToast('⚠️ 欄位 ' + (idx + 1) + ' 沒有存檔');
    return;
  }
  if (typeof state !== 'undefined' && state) {
    if (typeof saveGame === 'function') saveGame(); // 先把目前角色這段時間的進度存起來
    if (typeof stopLoop === 'function') stopLoop();
  }
  currentSlot = idx;
  if (typeof continueGame === 'function') continueGame(); // 讀取＋進場都在這支裡面做完
}

// 存檔選單：列出「自己輸入」＋所有有存檔的欄位。編號用真正的欄位序號（1-based），
// 不是清單裡的第幾行——不然欄位 3 是空的時候，後面的編號會對不起來，
// 玩家直接打數字切欄位就會切錯人。
function buildSlotPickerRows() {
  const rows = [];
  const total = (typeof MAX_SLOTS === 'number') ? MAX_SLOTS : 15;
  for (let i = 0; i < total; i++) {
    const raw = localStorage.getItem(getSlotKey(i));
    if (!raw) continue;
    let s = null;
    try { s = JSON.parse(raw); } catch (e) { continue; }
    if (!s) continue;
    const jd = (typeof JOB_TREE === 'object' && JOB_TREE && JOB_TREE[s.jobId]) || {};
    const label = (i + 1) + '.存檔' + (i + 1) + ' ' + (s.name || '無名') + ' Lv.' + (s.baseLevel || '?') + ' ' + (jd.name || s.jobId || '');
    rows.push(label);
  }
  return rows;
}
function ensureSlotPickerList() {
  let list = document.getElementById('ro-slot-picker-list');
  if (list) return list;
  list = document.createElement('div');
  list.id = 'ro-slot-picker-list';
  document.body.appendChild(list);
  document.addEventListener('click', function (e) {
    if (!list.classList.contains('open')) return;
    if (list.contains(e.target)) return;
    if (e.target && e.target.id === 'ro-editor-input') return; // 輸入框自己的點擊另外處理，這裡不要搶
    closeSlotPickerList();
  });
  return list;
}
function closeSlotPickerList() {
  const list = document.getElementById('ro-slot-picker-list');
  if (list) list.classList.remove('open');
}
function toggleSlotPickerList(input) {
  const list = ensureSlotPickerList();
  if (list.classList.contains('open')) { closeSlotPickerList(); return; }

  list.innerHTML = '';
  const freeform = document.createElement('div');
  freeform.className = 'ro-slot-item freeform';
  freeform.textContent = '✏️ 自己輸入';
  freeform.addEventListener('click', function () {
    input.value = '';
    input.readOnly = false; // 拿掉唯讀，才有機會跳鍵盤
    closeSlotPickerList();
    // 手機瀏覽器（尤其 iOS）對「點 A 元素、卻要 B 元素跳鍵盤」這種跨元素觸發
    // 通常不認帳，一定要留一點時間差、而且要是使用者手勢剛結束那個當下才會生效，
    // 直接同步呼叫 focus() 常常沒反應。用 setTimeout 讓瀏覽器先處理完
    // readonly 被拿掉這件事，再補一次 focus。
    setTimeout(function () {
      input.focus();
      // 部分機型光 focus() 還是不夠，額外補一次 click() 當保險。
      if (typeof input.click === 'function') input.click();
    }, 50);
  });
  list.appendChild(freeform);

  buildSlotPickerRows().forEach(function (label) {
    const row = document.createElement('div');
    row.className = 'ro-slot-item';
    row.textContent = label;
    row.addEventListener('click', function () {
      input.value = label;
      input.readOnly = true; // 選單選出來的文字不用手動編輯，維持唯讀，下次點還是先跳選單
      closeSlotPickerList();
    });
    list.appendChild(row);
  });

  const rect = input.getBoundingClientRect();
  list.style.left = rect.left + 'px';
  list.style.top = (rect.bottom + 4) + 'px';
  list.style.minWidth = Math.max(200, rect.width) + 'px';
  list.classList.add('open');
}

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

// 物品清理工具：獨立頁面，密語「刪除物品」開。開關／凍結邏輯跟修改器
// 幾乎一模一樣（同一套 freezeGame/unfreezeGame），只是視窗參考跟監聽器
// 各自用自己的旗標，兩個工具的視窗開關不會互相干擾。
function openItemTool() {
  if (window.__roItemToolWin && !window.__roItemToolWin.closed) {
    window.__roItemToolWin.focus();
    return;
  }
  const win = window.open(ITEM_TOOL_URL, 'ro-item-tool', 'width=480,height=760');
  if (!win) return;
  window.__roItemToolWin = win;
  if (!window.__roItemToolMsgBound) {
    window.addEventListener('message', handleItemToolMessage);
    window.__roItemToolMsgBound = true;
  }
  freezeGame();
  if (window.__roItemToolWatchTimer) clearInterval(window.__roItemToolWatchTimer);
  window.__roItemToolWatchTimer = setInterval(function () {
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
  if (window.__roItemToolWatchTimer) { clearInterval(window.__roItemToolWatchTimer); window.__roItemToolWatchTimer = null; }
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
// 額外帶上 armorType/weaponCat/headPos，讓 B 頁能照裝備欄位類型過濾建議清單
// （不然武器欄位會連紅色藥水都建議出來，跟 head_top/mid/bottom 分不出來）。
function computeHeadPos(desc) {
  const d = desc || '';
  const out = [];
  if (d.indexOf('頭上') !== -1) out.push('head_top');
  if (d.indexOf('頭中') !== -1) out.push('head_mid');
  if (d.indexOf('頭下') !== -1) out.push('head_bottom');
  if (!out.length) out.push('head_top'); // 沒寫位置的舊資料，保底當頭上
  return out;
}
function buildItemMeta() {
  const out = {};
  if (typeof ITEMS === 'object' && ITEMS) {
    for (const id in ITEMS) {
      const it = ITEMS[id];
      const m = { name: it.name, icon: it.icon, type: it.type };
      if (it.type === 'armor') {
        m.armorType = it.armorType || null;
        if (it.armorType === 'headgear') m.headPos = computeHeadPos(it.desc);
      } else if (it.type === 'weapon') {
        m.weaponCat = it.weaponCat || it.weaponType || null;
      } else if (it.type === 'relic') {
        m.relicSlot = it.relicSlot || null;
        m.relicSet = it.relicSet || null;
      }
      out[id] = m;
    }
  }
  return out;
}
// 8 個遺物欄位（順序＝畫面排列順序），跟名稱/圖示一起送給修改器，
// 不在修改器那邊寫死一份，遊戲本體以後改欄位/名稱這裡會自動跟著變。
function buildRelicSlotList() {
  if (typeof RELIC_SLOTS === 'undefined') return [];
  return RELIC_SLOTS.map(function (s) {
    return {
      key: s,
      name: (typeof RELIC_SLOT_NAMES !== 'undefined' && RELIC_SLOT_NAMES[s]) || s,
      icon: (typeof RELIC_SLOT_ICONS !== 'undefined' && RELIC_SLOT_ICONS[s]) || '🏺'
    };
  });
}
// 套裝名稱對照表（短名，跟遊戲本體「騎士的遺物」→「騎士」的縮寫規則一致），
// 讓修改器能在遺物格子上顯示「這格穿的是哪一套」，不用只看道具全名。
function buildRelicSetMeta() {
  const out = {};
  if (typeof RELIC_SETS === 'object' && RELIC_SETS) {
    for (const id in RELIC_SETS) {
      const s = RELIC_SETS[id];
      out[id] = { name: (s.name || id).replace('的遺物', ''), icon: s.icon || '🏺' };
    }
  }
  return out;
}
function buildJobMeta() {
  const out = {};
  if (typeof JOB_TREE === 'object' && JOB_TREE) {
    for (const id in JOB_TREE) {
      // parent/tier 讓修改器能自己沿著職業鏈往回走，畫出「新手→一轉→二轉…」
      // 這種依階段分開的技能點輸入框，不用另外問遊戲要一次。
      out[id] = { name: JOB_TREE[id].name, parent: JOB_TREE[id].parent || null, tier: JOB_TREE[id].tier || 1 };
    }
  }
  return out;
}
// 精簡版卡片對照表，讓修改器能顯示插卡的名稱／效果說明（點開個體裝備時的小視窗要用）。
function buildCardMeta() {
  const out = {};
  if (typeof CARDS === 'object' && CARDS) {
    for (const id in CARDS) {
      const c = CARDS[id];
      out[id] = { name: c.name, icon: c.icon, desc: c.desc || '' };
    }
  }
  return out;
}
// 圖鑑目錄（怪物／卡片／道具的完整清單＋圖片）。直接借用遊戲本體的
// getCodexPool()（已經幫忙算好「哪些怪物/道具真的算進圖鑑」，含快取），
// 不自己重寫一份判斷邏輯，保證跟遊戲畫面上看到的圖鑑範圍一致。
// 圖片網址用 new URL(...).href 轉成完整絕對網址——修改器在別的網域，
// 直接塞相對路徑（images/xxx.png）會抓到修改器自己網域下（不存在的）圖檔。
function absImgUrl(relPath) {
  try { return new URL(relPath, document.baseURI).href; } catch (e) { return relPath; }
}
// 分類判斷跟遊戲本體 CODEX_CATS 的 test 函式邏輯一致（照抄那幾條規則），
// 直接在這裡算好存進每筆資料的 cat 欄位，修改器那邊就不用重複一份判斷邏輯、
// 也不用把整份 ITEMS/CARDS 明細送過去。
function codexMonCat(id) {
  // MVP 與迷你王是兩種分開的怪（#147）：MVP 開的是 mvpMode 挑戰、迷你王是 miniMode，
  // 跟遊戲本體 CODEX_CATS 的判斷順序完全一致——先看 isMvp，其餘有 isBoss 的才算迷你王。
  const m = MONSTERS[id];
  if (!m) return 'normal';
  if (m.isMvp) return 'mvp';
  if (m.isBoss) return 'mini';
  return 'normal';
}
function codexCardCat(id) {
  return (CARDS[id] && CARDS[id].slot) || 'other';
}
function codexItemCat(id) {
  const d = ITEMS[id];
  if (!d) return 'material';
  const ticketId = (typeof RELIC_TICKET_ID !== 'undefined') ? RELIC_TICKET_ID : '';
  if (d.type === 'weapon') return 'weapon';
  if (d.type === 'armor') return d.armorType === 'accessory' ? 'accessory' : 'armor';
  if (d.type === 'consumable' || d.type === 'ammo') return 'consumable';
  if (d.type === 'relic' || id === ticketId) return 'relic';
  return 'material';
}
// 分類的中文標籤（跟遊戲本體 CODEX_CATS 的 label 一致），修改器拿這份來畫分類鈕，
// 不用自己寫死一份，以後遊戲改分類這裡會自動跟著變。
function buildCodexCatLabels() {
  return {
    mon: [{ k: 'all', label: '全部' }, { k: 'normal', label: '普通怪' }, { k: 'mvp', label: 'MVP' }, { k: 'mini', label: '迷你王' }],
    card: [
      { k: 'all', label: '全部' }, { k: 'weapon', label: '武器' }, { k: 'armor', label: '鎧甲' },
      { k: 'shield', label: '盾牌' }, { k: 'headgear', label: '頭飾' }, { k: 'garment', label: '肩披' },
      { k: 'footgear', label: '鞋子' }, { k: 'accessory', label: '飾品' }
    ],
    item: [
      { k: 'all', label: '全部' }, { k: 'weapon', label: '武器' }, { k: 'armor', label: '防具' },
      { k: 'accessory', label: '飾品' }, { k: 'consumable', label: '消耗品' },
      { k: 'relic', label: '遺物' }, { k: 'material', label: '素材' }
    ]
  };
}
function buildCodexPayload() {
  if (typeof getCodexPool !== 'function') return { mon: [], card: [], item: [] };
  const pool = getCodexPool();
  const elemIcons = (typeof ELEMENT_ICONS === 'object' && ELEMENT_ICONS) ? ELEMENT_ICONS : {};
  const mon = (pool.monsters || []).map(function (id) {
    const d = MONSTERS[id];
    return {
      id: id, name: d.name, img: absImgUrl(monsterImgSrc(id)), cat: codexMonCat(id),
      level: d.level || 0, elemIcon: elemIcons[d.element] || '⚪'
    };
  });
  const card = (pool.cards || []).map(function (id) {
    const d = CARDS[id] || ITEMS[id];
    return { id: id, name: d.name, img: absImgUrl(itemImgSrc(id)), cat: codexCardCat(id) };
  });
  const item = (pool.items || []).map(function (id) {
    const d = ITEMS[id];
    return { id: id, name: d.name, img: absImgUrl(itemImgSrc(id)), cat: codexItemCat(id) };
  });
  return { mon: mon, card: card, item: item, catLabels: buildCodexCatLabels() };
}
// 成就目錄：只送顯示需要的欄位（id/分類/圖示/名稱/說明/目標值/階級/獎勵），
// progress 是函式沒辦法透過 postMessage 送過去，也用不到——修改器不重算「目前進度」，
// 只負責直接改 state.achievements.done，跟遊戲本體 checkAchievements() 的效果一致。
function buildAchievementsCatalog() {
  if (typeof ACHIEVEMENTS === 'undefined') return [];
  return ACHIEVEMENTS.map(function (a) {
    return {
      id: a.id, cat: a.cat, icon: a.icon, name: a.name, desc: a.desc,
      goal: a.goal, tier: a.tier || 1,
      reward: { gold: (a.reward && a.reward.gold) || 0, point: (a.reward && a.reward.point) || 0 }
    };
  });
}
function buildAchievementCatMeta() {
  const out = {};
  if (typeof ACHIEVEMENT_CATEGORIES === 'object' && ACHIEVEMENT_CATEGORIES) {
    for (const k in ACHIEVEMENT_CATEGORIES) {
      out[k] = { name: ACHIEVEMENT_CATEGORIES[k].name, icon: ACHIEVEMENT_CATEGORIES[k].icon };
    }
  }
  return out;
}
// 技能目錄：整個遊戲全部職業的技能樹一次送過去（不是只送某個角色的），
// 修改器那邊自己依存檔的職業鏈（跟屬性/技能點分頁同一套 jobChainForSlot()
// 邏輯）挑要顯示哪些——這樣不用每次選好角色都再跟遊戲要一次資料。
// 只送顯示/判斷用得到的欄位：progress 是函式沒辦法送，requiresWeapon 只影響
// 技能能不能「施放」不影響能不能「學」，故意不送，省 payload。
function buildSkillCatalog() {
  const jobs = {};
  if (typeof JOB_TREE === 'object' && JOB_TREE) {
    for (const jobId in JOB_TREE) {
      const job = JOB_TREE[jobId];
      if (!job || !Array.isArray(job.skills)) continue;
      jobs[jobId] = {
        name: job.name, icon: job.icon || '', tier: job.tier || 1,
        borrowedFrom: job.borrowedFrom || {},
        skills: job.skills.map(function (sk) {
          return {
            id: sk.id, name: sk.name, maxLv: sk.maxLv, desc: sk.desc || '',
            isQuest: !!sk.isQuest, autoGrant: !!sk.autoGrant,
            requires: sk.requires || null
          };
        })
      };
    }
  }
  return jobs;
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

// 這個職業（含整條職業鏈）＋這個等級，能裝備哪些道具。直接借用遊戲本體的
// jobCanUseWeapon()（官方攻速表判斷），不自己重寫一份武器分類邏輯，
// 確保跟遊戲實際規則永遠一致，不會兩邊兜不起來。
// 只判斷 reqLevel／reqJob／武器攻速表，不碰 state，所以可以幫任何一個存檔欄位
// （不只是目前正在玩的那個）算，不用真的把角色切過去。
function jobChainFor(jobId) {
  const chain = [];
  const seen = {};
  let cur = jobId;
  while (cur && !seen[cur]) {
    seen[cur] = true;
    chain.push(cur);
    cur = (typeof JOB_TREE === 'object' && JOB_TREE[cur]) ? JOB_TREE[cur].parent : null;
  }
  return chain;
}
function buildJobCompatSet(jobId, baseLevel) {
  const out = [];
  if (typeof ITEMS !== 'object' || !ITEMS) return out;
  const chain = jobChainFor(jobId);
  for (const id in ITEMS) {
    const d = ITEMS[id];
    if (d.type !== 'weapon' && d.type !== 'armor') continue; // 只有這兩類才有職業/等級限制
    if (d.reqLevel && (typeof baseLevel !== 'number' || baseLevel < d.reqLevel)) continue;
    if (d.reqJob && d.reqJob.length && !chain.some(function (j) { return d.reqJob.indexOf(j) !== -1; })) continue;
    if (d.type === 'weapon' && typeof jobCanUseWeapon === 'function' && !jobCanUseWeapon(jobId, id)) continue;
    out.push(id);
  }
  return out;
}
function buildInitPayload() {
  return {
    type: 'ro-editor:init',
    slots: buildAllSlotsSummary(),
    warehouse: (typeof loadWarehouse === 'function') ? loadWarehouse() : { items: [], gold: 0 },
    currentSlot: currentSlot,
    itemMeta: buildItemMeta(),
    jobMeta: buildJobMeta(),
    cardMeta: buildCardMeta(),
    relicSlots: buildRelicSlotList(),
    relicSetMeta: buildRelicSetMeta(),
    codex: buildCodexPayload(),
    achievements: buildAchievementsCatalog(),
    achievementCats: buildAchievementCatMeta(),
    skillCatalog: buildSkillCatalog(),
    loaderVersion: LOADER_VERSION
  };
}

// 套用到指定存檔欄位。如果剛好是「目前正在玩的這欄」，直接改記憶體裡的 state
// 再 saveGame()（state 比 localStorage 新，localStorage 有節流可能落後）；
// 如果是別的欄位，重新讀一次 localStorage 最新內容再 merge 寫回，
// 絕對不去動 currentSlot（不能用現成的 importSaveToSlot()，它會把 currentSlot
// 永久切走，等於把玩家正在玩的分頁弄壞）。
// 解鎖成就時，「達成紀錄」（state.achievements.done）跟「進度條實際讀的來源數值」
// 是兩件事——只改前者，畫面會出現「打勾了但進度條沒滿」這種矛盾。這裡照
// achievements.js 每個成就 progress() 讀哪個欄位，反查回去把來源數值也灌到目標值，
// 讓進度條看起來跟打勾狀態一致。只保證「至少達標」，不會把已經更高的數值往下調。
const ACV_RACE_MAP = {
  race_undead_1000: 'undead', race_demon_1000: 'demon',
  race_dragon_300: 'dragon', race_angel_100: 'angel'
};
function fillAchievementUnderlying(o, id, goal) {
  if (!o.codex) o.codex = { mon: {}, seen: {}, item: {}, maps: {} };
  ['mon', 'seen', 'item', 'maps'].forEach(function (k) { if (!o.codex[k]) o.codex[k] = {}; });
  if (!o.stats) o.stats = {};
  if (!o.refinement) o.refinement = {};
  if (!o.equippedCards) o.equippedCards = {};
  if (!o.jobLevelHistory) o.jobLevelHistory = {};

  function firstMonsterId(filterFn) {
    if (typeof MONSTERS !== 'object' || !MONSTERS) return null;
    for (const k in MONSTERS) { if (!filterFn || filterFn(MONSTERS[k])) return k; }
    return null;
  }
  function bumpMon(mid) {
    if (!mid) return;
    o.codex.mon[mid] = Math.max(o.codex.mon[mid] || 0, goal);
  }
  function fillCount(bucket, sourceTable, extraSkip) {
    if (typeof sourceTable !== 'object' || !sourceTable) return;
    let n = 0;
    for (const k in bucket) if (bucket[k]) n++;
    for (const k in sourceTable) {
      if (n >= goal) break;
      if (extraSkip && extraSkip(k)) continue;
      if (!bucket[k]) { bucket[k] = 1; n++; }
    }
  }

  if (id.indexOf('kill_') === 0 || id.indexOf('grudge_') === 0) {
    bumpMon(firstMonsterId(null));
  } else if (id.indexOf('mvp_') === 0) {
    bumpMon(firstMonsterId(function (m) { return m.isBoss; }));
  } else if (ACV_RACE_MAP[id]) {
    bumpMon(firstMonsterId(function (m) { return m.race === ACV_RACE_MAP[id]; }));
  } else if (id.indexOf('death_') === 0) {
    o.deaths = Math.max(o.deaths || 0, goal);
  } else if (id.indexOf('mon_') === 0) {
    fillCount(o.codex.seen, MONSTERS);
  } else if (id.indexOf('card_eq_') === 0) {
    for (let i = 0; i < goal; i++) o.equippedCards['_acv_fill_' + i] = true;
  } else if (id.indexOf('card_') === 0) {
    fillCount(o.codex.item, CARDS);
  } else if (id.indexOf('item_') === 0) {
    fillCount(o.codex.item, ITEMS, function (k) { return typeof CARDS === 'object' && CARDS && CARDS[k]; });
  } else if (id.indexOf('blv_') === 0) {
    o.baseLevel = Math.max(o.baseLevel || 1, goal);
  } else if (id.indexOf('jlv_') === 0) {
    o.jobLevel = Math.max(o.jobLevel || 1, goal);
  } else if (id === 'job_change_1' || id === 'job_change_2') {
    if (typeof JOB_TREE === 'object' && JOB_TREE) {
      let n = Object.keys(o.jobLevelHistory).length;
      for (const k in JOB_TREE) {
        if (n >= goal) break;
        if (!o.jobLevelHistory[k]) { o.jobLevelHistory[k] = 1; n++; }
      }
    }
  } else if (id.indexOf('stat_') === 0) {
    o.stats.str = Math.max(o.stats.str || 1, goal);
  } else if (id.indexOf('gold_') === 0) {
    o.gold = Math.max(o.gold || 0, goal);
  } else if (id.indexOf('map_') === 0) {
    fillCount(o.codex.maps, (typeof MAPS === 'object' && MAPS) ? MAPS : null);
  } else if (id.indexOf('refine_') === 0) {
    o.refinement._acv_fill = Math.max(o.refinement._acv_fill || 0, goal);
  }
  // equip_full（裝備滿 10 部位）沒有在這裡處理：要湊出「合理」的裝備得挑選正確道具
  // 塞進正確欄位，風險比其他項目高很多，這項先只標記達成，欄位本身不會自動幫你穿裝備。
}

function applyEditorPatchToSlot(slot, patch, fillAchievementIds) {
  if (!Number.isInteger(slot) || !patch || typeof patch !== 'object') return false;
  const fillIds = Array.isArray(fillAchievementIds) ? fillAchievementIds : [];
  if (slot === currentSlot && typeof state !== 'undefined' && state) {
    Object.assign(state, patch);
    if (fillIds.length && typeof ACHIEVEMENTS_BY_ID === 'object') {
      fillIds.forEach(function (id) {
        const a = ACHIEVEMENTS_BY_ID[id];
        if (a) fillAchievementUnderlying(state, id, a.goal);
      });
    }
    if (typeof saveGame === 'function') saveGame();
    if (typeof renderAll === 'function') { try { renderAll(); } catch (e) { /* 畫面重繪失敗不影響存檔已經寫入 */ } }
    if (typeof showToast === 'function') showToast('🛠️ 修改器已套用到目前角色');
  } else {
    const raw = localStorage.getItem(getSlotKey(slot));
    let obj = null;
    try { obj = raw ? JSON.parse(raw) : null; } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object') return false; // 目標欄位沒有存檔，不無中生有建立
    Object.assign(obj, patch);
    if (fillIds.length && typeof ACHIEVEMENTS_BY_ID === 'object') {
      fillIds.forEach(function (id) {
        const a = ACHIEVEMENTS_BY_ID[id];
        if (a) fillAchievementUnderlying(obj, id, a.goal);
      });
    }
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

/* ============================================================
   彈窗／浮動面板的「點外面關閉」與「彈窗配合手機螢幕」
   （只在觸控裝置套用，滑鼠環境維持原樣不受影響）
   ============================================================ */
function bindAboutModalOutsideClose() {
  if (window.__roAboutModalBound) return;
  window.__roAboutModalBound = true;
  const modal = document.getElementById('about-modal');
  if (!modal) return;
  modal.addEventListener('click', function (e) {
    // 只有點在遮罩本身（灰色背景，不是白色內容框）才關閉；
    // 首次同意聲明那個 #consent-modal 是強制閱讀用的，故意不裝這個，不能點外面關掉。
    if (e.target === modal && typeof closeAboutModal === 'function') closeAboutModal();
  });
}
function bindIdleReportOutsideClose() {
  if (window.__roIdleReportBound) return;
  window.__roIdleReportBound = true;
  document.addEventListener('click', function (e) {
    const panel = document.getElementById('idle-report-panel');
    const openBtn = document.getElementById('btn-idle-report');
    if (!panel || panel.classList.contains('hidden')) return;
    if (panel.contains(e.target)) return;              // 點在面板裡面，不關
    if (openBtn && openBtn.contains(e.target)) return;  // 開關鈕本身已經有自己的 toggle，這裡不要重複處理
    if (typeof toggleIdleReport === 'function') toggleIdleReport();
  }, true);
}

/* ============================================================
   下拉重整手勢防呆（CSS 的 overscroll-behavior-y 是主力，這裡是備案）
   只在「不是在我們自己的可捲動容器裡」而且「頁面本身已經在最頂端」時
   才擋掉往下拉的手勢——這樣裝備清單彈窗、分頁彈出視窗、戰鬥紀錄這些
   自己會捲動的區塊完全不受影響，只有背景／戰鬥地圖那一塊被拉到底時
   會被攔下來，不會誤觸瀏覽器整頁重新整理把玩家踢出目前畫面。
   ============================================================ */
/* ============================================================
   倉庫畫面補畫鎖定圖示
   遊戲本體 renderWarehouseInner() 裡，鎖頭判斷寫成
   `locked = side === 'bag' && isItemLocked(...)`——只有背包那一側會檢查
   鎖定狀態，物品存進倉庫之後那一側完全沒判斷，鎖頭圖示就消失了。
   不是資料遺失（鎖定狀態本身還在），純粹是畫面漏畫。
   做法：包一層 renderWarehouseInner()，渲染完之後掃一次倉庫列表的 DOM，
   從每一列的 onclick 屬性反查道具 ID，真的有鎖定的話手動補畫上去，
   不改動遊戲本體任何一行程式碼。這是通用的顯示修正，不分觸控/滑鼠環境。
   ============================================================ */
function addWarehouseLockIcons() {
  const body = document.getElementById('warehouse-body');
  if (!body) return;
  body.querySelectorAll('.wh-row').forEach(function (row) {
    const onclick = row.getAttribute('onclick') || '';
    let itemId = null;
    let m = onclick.match(/^whWithdrawInstance\('([^']+)'\)$/);
    if (m) {
      const inst = (typeof state !== 'undefined' && state && state.instances) ? state.instances[m[1]] : null;
      itemId = inst ? inst.item : null;
    } else {
      m = onclick.match(/^whWithdraw\('([^']+)'/);
      if (m) itemId = m[1];
    }
    if (!itemId) return; // 抓不到 id，或這是「存入」那一側（遊戲本體自己就有畫鎖頭），不用管
    if (typeof isItemLocked !== 'function' || !isItemLocked(itemId)) return;
    const nameEl = row.querySelector('.wh-row-name');
    if (!nameEl || nameEl.querySelector('.ro-wh-lock')) return; // 已經補過了，不要重複疊加
    const lockSpan = document.createElement('span');
    lockSpan.className = 'ro-wh-lock';
    lockSpan.textContent = '🔒 ';
    nameEl.insertBefore(lockSpan, nameEl.firstChild);
  });
}
function bindWarehouseLockFix() {
  if (window.__roWhLockBound) return;
  if (typeof window.renderWarehouseInner !== 'function') return;
  window.__roWhLockBound = true;
  const original = window.renderWarehouseInner;
  window.renderWarehouseInner = function () {
    original.apply(this, arguments);
    try { addWarehouseLockIcons(); } catch (e) { /* 這個小補丁出錯也不能拖累倉庫畫面正常顯示 */ }
  };
}

function bindPullToRefreshGuard() {
  if (window.__roPullGuardBound) return;
  window.__roPullGuardBound = true;
  let startY = 0;
  // 提醒：以後只要再新增一個會自己捲動、或蓋在畫面上的彈出視窗／面板，
  // 記得把它的容器（或至少含按鈕的外層）加進這份名單，不然滑動會被
  // 底下的 preventDefault 誤擋，感覺變得很容易誤觸下拉重新整理。
  const scrollableSelector = '.tab-content, #ro-equip-pick-popup, #ro-group-popup, #ro-editor-box, #ro-slot-picker-list, ' +
    '.combat-log, .log-pane-body, .idle-report-panel, #idle-report-body, .ally-panel, #ally-panel-body, ' +
    'input, textarea, select, button, a';
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 1) return;
    if (e.target.closest(scrollableSelector)) return; // 自己會捲動的區塊，不插手
    const y = e.touches[0].clientY;
    const atTop = (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    if (atTop && y > startY) e.preventDefault();
  }, { passive: false });
}

/* ============================================================
   裝備分頁第二層彈窗：點武器／防具／遺物才跳出來選要換的東西
   （見上面 CSS 的 #ro-equip-pick-popup）

   原本 renderEquipTab() 是把「裝備欄總覽 + 這個分類的清單」全部塞進同一片
   #tab-equip，清單一長就把裝備欄總覽往下擠，在手機的彈出視窗裡還是會被
   擋住。做法：包一層 renderEquipTab()，渲染完之後把「裝備欄總覽」之後的
   內容（也就是清單本體）整段搬到另一個獨立彈窗裡；再包一層
   setEquipPickCat()（武器／防具／遺物那三顆分頁鈕按下去呼叫的函式），
   讓「切分類」這個動作額外觸發「打開清單彈窗」。
   遺物分類走的是完全不同的版面（renderRelicPageHtml()，沒有清單可搬），
   直接跳過不處理，讓它照原本樣子顯示在 #tab-equip 裡。
   ============================================================ */
function ensureEquipPickPopup() {
  let pop = document.getElementById('ro-equip-pick-popup');
  if (pop) return pop;
  pop = document.createElement('div');
  pop.id = 'ro-equip-pick-popup';
  pop.className = 'hidden';
  pop.innerHTML =
    '<div id="ro-equip-pick-popup-bar">' +
      '<span id="ro-equip-pick-popup-title">選擇裝備</span>' +
      '<button type="button" id="ro-equip-pick-popup-close">← 回到裝備欄位</button>' +
    '</div>' +
    '<div id="ro-equip-pick-popup-body"></div>';
  document.body.appendChild(pop);
  document.getElementById('ro-equip-pick-popup-close').addEventListener('click', function () {
    pop.classList.add('hidden');
  });
  return pop;
}
// 把 .equip-sticky（裝備欄總覽＋分類鈕）之後的所有內容搬進彈窗；
// 回傳 true 代表真的有搬到東西（武器/防具分類），false 代表這次是遺物分類，沒有可搬的清單。
function relocateEquipPickList() {
  const tabEquip = document.getElementById('tab-equip');
  if (!tabEquip) return false;
  const sticky = tabEquip.querySelector('.equip-sticky');
  if (!sticky) return false;
  const popup = ensureEquipPickPopup();
  const body = document.getElementById('ro-equip-pick-popup-body');
  body.innerHTML = '';
  let node = sticky.nextSibling;
  while (node) {
    const next = node.nextSibling;
    body.appendChild(node);
    node = next;
  }
  return true;
}
function showEquipPickPopup(cat) {
  const popup = ensureEquipPickPopup();
  const titleMap = { weapon: '⚔️ 選擇武器', armor: '🛡️ 選擇防具', relic: '🏺 遺物' };
  document.getElementById('ro-equip-pick-popup-title').textContent = titleMap[cat] || '選擇裝備';
  popup.classList.remove('hidden');
}
function hideEquipPickPopup() {
  const popup = document.getElementById('ro-equip-pick-popup');
  if (popup) popup.classList.add('hidden');
}
function bindEquipPickPopup() {
  if (window.__roEquipPopupBound) return;
  if (typeof window.renderEquipTab !== 'function' || typeof window.setEquipPickCat !== 'function') return;
  window.__roEquipPopupBound = true;

  const originalRender = window.renderEquipTab;
  window.renderEquipTab = function () {
    originalRender.apply(this, arguments);
    relocateEquipPickList(); // 每次重繪（含裝備完自動重繪）都重新搬一次，清單內容才會是最新的
  };

  const originalSetCat = window.setEquipPickCat;
  window.setEquipPickCat = function (c) {
    originalSetCat.apply(this, arguments); // 內部本來就會呼叫 renderEquipTab()，清單已經搬進彈窗了
    showEquipPickPopup(c); // 武器／防具／遺物三個分類都用同一個 .equip-sticky 結構，統一處理
  };
}

/* ============================================================
   分頁內容改成獨立彈出視窗（見上面 CSS 的 .tab-content 覆寫）
   做法：包一層 switchTab()，讓「切分頁」這件事額外觸發「彈出視窗」；
   不改動遊戲本體任何切分頁的邏輯，該做的事還是全部交給原本的 switchTab 做。
   ============================================================ */
function ensureTabCloseBtn() {
  if (document.getElementById('ro-tabcontent-closebar')) return;
  const tabContent = document.querySelector('.tab-content');
  if (!tabContent) return;
  const bar = document.createElement('div');
  bar.id = 'ro-tabcontent-closebar';
  const btn = document.createElement('button');
  btn.id = 'ro-tabcontent-close';
  btn.type = 'button';
  btn.textContent = '✕ 關閉';
  btn.addEventListener('click', closeTabOverlay);
  bar.appendChild(btn);
  tabContent.insertBefore(bar, tabContent.firstChild);
}
function openTabOverlay() {
  ensureTabCloseBtn();
  document.body.classList.add('ro-tabcontent-open');
}
function closeTabOverlay() {
  document.body.classList.remove('ro-tabcontent-open');
  hideEquipPickPopup(); // 裝備分頁的第二層選擇彈窗如果還開著，跟著一起收掉，不留在畫面上浮空
}
let _roLastTabClicked = null;
function bindTabContentOverlay() {
  if (window.__roTabOverlayBound) return;
  if (typeof window.switchTab !== 'function') return; // ui.js 還沒載入完成就先不處理，不影響原本功能
  window.__roTabOverlayBound = true;
  const originalSwitchTab = window.switchTab;
  window.switchTab = function (name) {
    const wasOpen = document.body.classList.contains('ro-tabcontent-open');
    const isRepeatTap = wasOpen && _roLastTabClicked === name;
    originalSwitchTab.apply(this, arguments);
    _roLastTabClicked = name;
    if (isRepeatTap) {
      closeTabOverlay(); // 同一顆分頁鈕再點一次＝關閉，跟大部分手機 App 的底部導覽習慣一致
    } else {
      openTabOverlay();
    }
    updateGroupBtnActiveState(); // 角色相關／其他 這兩顆的金色底線要跟著目前分頁走
  };
}

/* ============================================================
   底部分頁列瘦身：只留地圖／自動戰鬥／角色相關／其他 4 顆
   角色／技能／背包／裝備／轉職樹收進「角色相關」彈出清單；
   圖鑑／成就收進「其他」彈出清單；鍛造鈕（依職業動態顯示）也塞進角色相關，
   跟著它原本 .hidden 的顯示狀態走。
   點清單裡任何一項，一律呼叫原本的 switchTab()／openForge()，
   不重寫任何分頁渲染邏輯，單純只是換個入口。
   ============================================================ */
const GROUP_CHARACTER = [
  { tab: 'character', icon: '🧍', label: '角色' },
  { tab: 'skills', icon: '📖', label: '技能' },
  { tab: 'inventory', icon: '🎒', label: '背包' },
  { tab: 'equip', icon: '🎽', label: '裝備' },
  { tab: 'jobtree', icon: '🌳', label: '轉職樹' }
];
const GROUP_OTHER = [
  { tab: 'codex', icon: '📕', label: '圖鑑' },
  { tab: 'achievements', icon: '🏆', label: '成就' }
];
let _roGroupOpenKey = null;
function ensureGroupPopup() {
  let pop = document.getElementById('ro-group-popup');
  if (pop) return pop;
  pop = document.createElement('div');
  pop.id = 'ro-group-popup';
  document.body.appendChild(pop);
  // 點清單外面關閉；開關鈕自己的點擊已經有獨立的 handler，這裡要排除掉，
  // 不然按鈕本身那次點擊會「先關掉、又立刻打開」互相打架。
  document.addEventListener('click', function (e) {
    if (!_roGroupOpenKey) return;
    if (pop.contains(e.target)) return;
    if (e.target.closest('.ro-group-btn')) return;
    closeGroupPopup();
  }, true);
  return pop;
}
function closeGroupPopup() {
  const pop = document.getElementById('ro-group-popup');
  if (pop) pop.classList.remove('open');
  _roGroupOpenKey = null;
  updateGroupBtnActiveState();
}
function openGroupPopup(key) {
  const list = (key === 'character' ? GROUP_CHARACTER : GROUP_OTHER).slice();
  if (key === 'character') {
    const forgeBtn = document.getElementById('tab-btn-forge');
    if (forgeBtn && !forgeBtn.classList.contains('hidden')) {
      list.push({ tab: null, icon: '🔨', label: '鍛造', action: 'forge' });
    }
  }
  const pop = ensureGroupPopup();
  pop.innerHTML = list.map(function (it) {
    return '<div class="ro-group-item" data-tab="' + (it.tab || '') + '" data-action="' + (it.action || '') + '">' +
      '<span class="ic">' + it.icon + '</span><span>' + it.label + '</span></div>';
  }).join('');
  pop.querySelectorAll('.ro-group-item').forEach(function (row) {
    row.addEventListener('click', function () {
      closeGroupPopup();
      if (row.dataset.action === 'forge') {
        if (typeof openForge === 'function') openForge();
      } else if (row.dataset.tab && typeof switchTab === 'function') {
        switchTab(row.dataset.tab);
      }
    });
  });
  const tabNav = document.querySelector('.tab-nav');
  const navHeight = tabNav ? tabNav.getBoundingClientRect().height : 60;
  pop.style.bottom = (navHeight + 8) + 'px';
  pop.classList.add('open');
  _roGroupOpenKey = key;
  updateGroupBtnActiveState();
}
function toggleGroupPopup(key) {
  if (_roGroupOpenKey === key) closeGroupPopup();
  else openGroupPopup(key);
}
function updateGroupBtnActiveState() {
  const charBtn = document.getElementById('ro-group-btn-character');
  const otherBtn = document.getElementById('ro-group-btn-other');
  const active = (typeof activeTab !== 'undefined') ? activeTab : null;
  const inChar = GROUP_CHARACTER.some(function (i) { return i.tab === active; });
  const inOther = GROUP_OTHER.some(function (i) { return i.tab === active; });
  if (charBtn) charBtn.classList.toggle('active', inChar || _roGroupOpenKey === 'character');
  if (otherBtn) otherBtn.classList.toggle('active', inOther || _roGroupOpenKey === 'other');
}
function bindBottomNavGroups() {
  if (window.__roBottomNavGroupsBound) return;
  const tabNav = document.querySelector('.tab-nav');
  if (!tabNav) return;
  window.__roBottomNavGroupsBound = true;

  const charBtn = document.createElement('button');
  charBtn.type = 'button';
  charBtn.id = 'ro-group-btn-character';
  charBtn.className = 'tab-btn ro-group-btn';
  charBtn.innerHTML = '🧍 角色相關';
  charBtn.addEventListener('click', function () { toggleGroupPopup('character'); });

  const otherBtn = document.createElement('button');
  otherBtn.type = 'button';
  otherBtn.id = 'ro-group-btn-other';
  otherBtn.className = 'tab-btn ro-group-btn';
  otherBtn.innerHTML = '☰ 其他';
  otherBtn.addEventListener('click', function () { toggleGroupPopup('other'); });

  // 插在「自動戰鬥」後面，維持「地圖／自動戰鬥／角色相關／其他」這個順序
  const autobattleBtn = tabNav.querySelector('[data-tab="autobattle"]');
  if (autobattleBtn) {
    tabNav.insertBefore(charBtn, autobattleBtn.nextSibling);
    tabNav.insertBefore(otherBtn, charBtn.nextSibling);
  } else {
    tabNav.appendChild(charBtn);
    tabNav.appendChild(otherBtn);
  }
  updateGroupBtnActiveState();
}

function handleEditorMessage(ev) {
  if (ev.origin !== EDITOR_ORIGIN) return; // 只信任修改器自己的網域
  const win = window.__roEditorWin;
  if (!win || ev.source !== win) return;   // 只信任我們自己開的那個視窗
  const data = ev.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'ro-editor:ready' || data.type === 'ro-editor:refresh') {
    win.postMessage(buildInitPayload(), EDITOR_ORIGIN);
  } else if (data.type === 'ro-editor:apply') {
    const ok = applyEditorPatchToSlot(data.slot, data.patch, data.fillAchievementIds);
    win.postMessage({ type: 'ro-editor:applied', ok: ok, slot: data.slot }, EDITOR_ORIGIN);
  } else if (data.type === 'ro-editor:apply-warehouse') {
    const ok = applyEditorPatchToWarehouse(data.patch);
    win.postMessage({ type: 'ro-editor:applied-warehouse', ok: ok }, EDITOR_ORIGIN);
  } else if (data.type === 'ro-editor:job-items') {
    const ids = buildJobCompatSet(data.jobId, data.baseLevel);
    win.postMessage({ type: 'ro-editor:job-items', jobId: data.jobId, ids: ids }, EDITOR_ORIGIN);
  }
}

// 物品清理工具用的初始資料：只需要選欄位＋背包/倉庫篩選要用的東西，
// 不用職業/遺物/圖鑑/成就那些，payload 故意跟修改器分開、盡量精簡。
function buildItemToolInitPayload() {
  return {
    type: 'ro-itemtool:init',
    slots: buildAllSlotsSummary(),
    warehouse: (typeof loadWarehouse === 'function') ? loadWarehouse() : { items: [], gold: 0 },
    currentSlot: currentSlot,
    itemMeta: buildItemMeta(),
    cardMeta: buildCardMeta(),
    loaderVersion: LOADER_VERSION
  };
}
function handleItemToolMessage(ev) {
  if (ev.origin !== EDITOR_ORIGIN) return; // 只信任修改器/物品工具共用的網域
  const win = window.__roItemToolWin;
  if (!win || ev.source !== win) return;   // 只信任我們自己開的那個視窗
  const data = ev.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'ro-itemtool:ready' || data.type === 'ro-itemtool:refresh') {
    win.postMessage(buildItemToolInitPayload(), EDITOR_ORIGIN);
  } else if (data.type === 'ro-itemtool:apply') {
    // 背包跟倉庫是兩個獨立目標，這次套用可能只動到其中一個、也可能兩個都動到，
    // 各自呼叫已經在修改器那邊驗證過的套用函式，不用重寫一份邏輯。
    let ok = true;
    if (Array.isArray(data.inventory) && Number.isInteger(data.slot)) {
      ok = applyEditorPatchToSlot(data.slot, { inventory: data.inventory }) && ok;
    }
    if (Array.isArray(data.warehouseItems)) {
      ok = applyEditorPatchToWarehouse({ items: data.warehouseItems }) && ok;
    }
    win.postMessage({ type: 'ro-itemtool:applied', ok: ok }, EDITOR_ORIGIN);
  }
}

// 所有 isTouch 專屬的行為綁定放在檔案最後才呼叫，確保上面用到的函式／
// 常數（例如 GROUP_CHARACTER 這種 const 陣列）都已經宣告完成，
// 不會因為呼叫點在宣告之前而在 TDZ 階段就出錯。
if (isTouch) {
  bindAboutModalOutsideClose();
  bindIdleReportOutsideClose();
  bindTabContentOverlay();
  bindEquipPickPopup();
  bindPullToRefreshGuard();
  bindBottomNavGroups();
}
// 倉庫鎖頭圖示是畫面正確性問題，不分觸控/滑鼠環境都要修，不放進上面 isTouch 判斷式裡。
bindWarehouseLockFix();
