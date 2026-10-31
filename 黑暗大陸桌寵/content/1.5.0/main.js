// 黑暗大陸桌寵：遊戲本體在藏起來的視窗裡照常掛機，桌面上只留會走動的角色。
// 做法照「放置希望桌寵」（desktop_pet），拿掉說話、撫摸，以及只有放置希望才有的功能（黑店、線上GM、書籤工具、收益）。
//
// 每一隻桌寵是一個獨立的程式（使用者 2026-10-31 指定：別隻縮小、關閉、結束、當掉都不影響這隻）：
//   - 不帶參數打開（桌面捷徑、開機自動啟動）＝啟動器：把上次開著的那幾隻（settings.openPets）各開成一個程式，然後自己結束；
//     全部都已經在跑的話，當成「救回來」的按鈕（見 launch）
//   - 帶 --pet=N 的＝第 N 隻桌寵本體（ME＝N-1）。每個編號同時只能有一個程式、最多 10 隻，靠 peers.js 的具名管道擋住，
//     桌寵之間也用它傳話（專注模式、結束全部、收入總覽看別隻…）
//   - 設定檔 pet-settings.json 大家共用：改的時候先重讀再寫（changeSettings），別隻改了這邊照著更新（watchSettings）
//
// 每一隻桌寵有自己的遊戲視窗，登入狀態、存檔各自獨立（照帳號分的資料夾，見 sessionOf），
// 所以每隻可以掛不同的帳號：右鍵選單「帳號」點一下就自動登入那個帳號、按「繼續冒險」開始掛機。帳號存在 accounts.json（accounts.js）。
//
//   games[ME] = 這隻桌寵的遊戲視窗，平常不顯示；對牠點兩下叫出來操作，再點兩下藏回去（陣列其他位置是空的）
//   petWin    = 貼在工作區底部的透明長條，上面畫這隻桌寵；滑鼠不在桌寵身上時整條都是穿透的
const { app, BrowserWindow, Menu, Notification, Tray, globalShortcut, ipcMain, nativeImage, net, screen, session, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { parseSave } = require("./save-reader");
const accounts = require("./accounts");
const updates = require("./updates");
const income = require("./income");
const diagnostics = require("./diagnostics");
const peers = require("./peers");
const names = require("./names.json");

const GAME_URL = "https://k559610142-art.github.io/-username-.github.io-/%E5%B1%A0%E9%BE%8D%E5%8B%87%E8%80%85/";
// 遊戲的存檔 key（遊戲 config.js 的 SAVE_KEY／SLOT_KEY；save.js 的 slotKey）
const SAVE_KEY = "dragonSlayer_save_v2";
const SLOT_KEY = "dragonSlayer_slot";
const TOGGLE_KEY = "Control+Alt+D";
const CLICK_THROUGH_KEY = "Control+Alt+P";
const MAX_LOOT_SHOWN = 4; // 一次存檔之間撿到很多種東西時，桌寵頭上最多冒幾個
const POLL_MS = 3000;
const PET_STRIP_HEIGHT = 320; // 要放得下拉到最大的桌寵＋頭上的提示框
const GAME_WIDTH = 480; // 「自動尺寸」「全螢幕」時的遊戲視窗大小（藏起來時大小不變，遊戲才不用一直重排版面）
const GAME_HEIGHT = 860;
// 遊戲設定 →「🖥️ 畫面尺寸」存在遊戲自己的 localStorage（遊戲 ui-frame.js 的 DISPLAY_KEY），桌寵照它調整遊戲視窗大小，見 gameSize
const DISPLAY_KEY = "dragonSlayer_display";
const DISPLAY_POLL_MS = 1000; // 遊戲叫出來時多久看一次畫面尺寸有沒有換
const PC_GAME_WIDTH = 1280; // 「PC 16:9」遊戲區寬度（螢幕放不下就縮小）
const PC_RATIO = 1116 / 2000; // 遊戲 PC 外框的高寬比（ui-frame.js 的 PC_H / PC_W）
const DEFAULT_MODEL = "knight"; // 還沒有角色時先放騎士
const MAX_PETS = 10; // 桌面上最多同時幾隻桌寵（＝最多同時掛幾個帳號）
const LOGIN_TIMEOUT_MS = 30000; // 按了登入這麼久還沒登入成功就當作失敗
const NO_SAVE_WAIT_MS = 15000; // 登入後等雲端角色下載這麼久，還是沒有角色才把遊戲叫出來讓使用者建角色
const SELFTEST = process.argv.includes("--selftest");
// 自我測試用全新的暫存資料夾：不碰平常的設定、帳號和遊戲存檔
// （從外殼 boot.js 啟動的話外殼已經換好了，這裡只管直接跑 main.js 的情況）
if (SELFTEST && !global.petShell) app.setPath("userData", path.join(app.getPath("temp"), `dark-pet-selftest-${Date.now()}`));

// 這個程式是第幾隻桌寵（0 起算）；-1＝啟動器（見開頭說明）。自我測試沒帶的話當第 1 隻
const PET_ARG = process.argv.find((a) => /^--pet=\d+$/.test(a));
const ME = PET_ARG ? Number(PET_ARG.slice(6)) - 1 : SELFTEST ? 0 : -1;
const LAUNCHER = ME < 0;
// 每個程式各自的瀏覽器資料（快取、桌寵視窗自己的 localStorage）分開放，同一個資料夾不能兩個程式同時開。
// 遊戲的登入資料、存檔不在這裡，見 sessionOf
app.setPath("sessionData", path.join(app.getPath("userData"), "pets", LAUNCHER ? "launcher" : String(ME + 1)));

// 視窗被蓋住／藏起來時 Chromium 會把分頁當成背景分頁放慢計時器，掛機會變慢，全部關掉
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

const games = []; // 每隻桌寵一個，見 createGame
let petWin;
let tray;
let quitting = false;
let clickThrough = false; // 專注模式：桌寵完全不吃滑鼠
let helpWin;
let pickerWin;
let accountsWin;
let petsWin; // 選擇要開的桌寵
let incomeWin;
let pickerTarget = 0; // 選外觀視窗現在是在幫第幾隻桌寵挑
// 使用者設定（所有桌寵共用一個檔，陣列的第 i 格是第 i 隻的）。openPets＝上次開著的是哪幾隻（啟動器照這個開）；
// petCount＝舊版（同一個程式裡開好幾隻）的桌寵數量，只用來換算成 openPets；
// petAccounts[i]＝第 i 隻用哪個帳號（accounts.json 的 id），null＝不登入（訪客，存檔只在這隻自己的遊戲視窗裡）；
// petModels[i]＝第 i 隻自己選的外觀（職業 key，或變身外觀「morph:MORPHS 的 key」），沒選（null）就跟著牠那個角色（變身中就是變身的樣子）
let settings = { petCount: 1, petAccounts: [], petModels: [], petColors: [], helpSeen: false, stayPets: [],
  // 打開桌寵時自動登入、自動按標題畫面的「繼續冒險」，進上次玩的角色
  autoContinue: true,
  // 角色用變形卷軸變身時，桌寵也換成變身的樣子（自己選了外觀的那幾隻照自己選的）
  followMorph: true,
  // 節約效能模式：遊戲視窗藏著時降低遊戲畫面解析度（邏輯、掉寶照常），桌寵動畫也放慢。見 game-preload.js
  powerSave: false,
  // 專注模式下桌寵頭上還要飄哪些字。預設全關，專注模式就是完全安靜
  focusShow: { exp: false, loot: false },
  // 一般模式下桌寵頭上要飄哪些字
  normalShow: { exp: true, loot: true },
  // gameWindows[i]＝第 i 隻的遊戲視窗上次怎麼開：keepTaskbar（右鍵「保持狀態列」）、x／y（叫出來時的位置）。下次打開桌寵照上次的
  gameWindows: [],
  // 右鍵選單的「回報效能異常」打開了沒（操作說明標題連點 20 下，見 ui/help.js）
  reportUnlocked: false,
  // petFps[i]＝第 i 隻的畫面每秒最多幾格（FPS_CHOICES，0＝不限制，沒設＝DEFAULT_FPS）；
  // fpsApplyAll＝右鍵選更新率時全部桌寵一起換（不勾＝只換按右鍵的那一隻）
  petFps: [],
  fpsApplyAll: false,
  openPets: undefined,
  // 桌寵大小（%），全部桌寵一起；沒設過就用各自桌寵視窗記的
  petSize: undefined };
const settingsFile = () => path.join(app.getPath("userData"), "pet-settings.json");

function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
    settings = { ...settings, ...saved, focusShow: { ...settings.focusShow, ...saved.focusShow },
      normalShow: { ...settings.normalShow, ...saved.normalShow } };
    for (const key of ["petAccounts", "petModels", "petColors", "stayPets", "gameWindows", "petFps"]) if (!Array.isArray(settings[key])) settings[key] = [];
    settings.petCount = Math.min(MAX_PETS, Math.max(1, Math.floor(Number(settings.petCount)) || 1));
  } catch {}
  // 舊版只有數量：第 1～petCount 隻
  const open = Array.isArray(settings.openPets) ? settings.openPets.filter((i) => Number.isInteger(i) && i >= 0 && i < MAX_PETS) : [];
  settings.openPets = open.length ? [...new Set(open)].sort((a, b) => a - b) : Array.from({ length: settings.petCount }, (_, i) => i);
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error("設定存不進去：", e.message);
  }
}

/** 改設定：別隻可能剛改過，先重讀檔案、改完馬上寫回去，才不會把別隻改的蓋掉。 */
function changeSettings(change) {
  loadSettings();
  change(settings);
  saveSettings();
}

/** 別隻（或這隻）改了設定檔：重讀，照新的設定更新這隻。 */
function watchSettings() {
  fs.watchFile(settingsFile(), { interval: 700 }, () => {
    loadSettings();
    applySettings();
  });
}

function applySettings() {
  const g = games[ME];
  // 這隻的帳號被換掉了（別隻搶走、或帳號管理視窗改的）：整個程式重開，舊帳號的資料夾才會放掉，別隻才用得到
  if (g && g.partition !== partitionOf(ME)) {
    if (!SELFTEST) return relaunchSelf();
    destroyGame(g); // 自我測試只有一個程式，直接換一個遊戲視窗
    games[ME] = createGame(ME);
    sendState(games[ME]);
  }
  sendStay();
  sendPets();
  sendPetFps();
  setGameFps(g);
  setGameHidden(g);
  petWin?.webContents.send("pet:focus-show", settings.focusShow);
  petWin?.webContents.send("pet:normal-show", settings.normalShow);
  petWin?.webContents.send("pet:power-save", settings.powerSave);
  if (settings.petSize) petWin?.webContents.send("pet:size", settings.petSize);
  if (accountsWin && !accountsWin.isDestroyed()) accountsWin.webContents.send("accounts:changed");
}

/** 這隻重開（帳號換了、或「立即更新桌寵」）：照原本的參數再開一次，自己正常結束（遊戲存檔才會好好寫進去）。 */
function relaunchSelf() {
  if (quitting) return;
  app.relaunch();
  app.quit();
}

// ── 遊戲視窗（每隻桌寵一個）─────────────────────────────────

/** 第 i 隻現在用的帳號 id（帳號被刪掉了就當作沒有）。 */
const accountOf = (i) => (accounts.find(settings.petAccounts[i]) ? settings.petAccounts[i] : null);

/** 登入資料、存檔放哪：有帳號的照帳號分（換給別隻用也帶著走），訪客照第幾隻分。 */
const partitionOf = (i) => (accountOf(i) ? `persist:acct-${accountOf(i)}` : `persist:guest-${i}`);

/**
 * 遊戲視窗的 session：就放在舊版（同一個程式開好幾隻）的 partition 資料夾（使用者資料夾/Partitions/acct-…），
 * 所以從舊版更新過來不用重新登入、存檔也都在。每個程式自己的 sessionData 不同，不能直接用 partition 名稱，要指定路徑。
 * 同一個資料夾同時只能一個程式開，所以同一個帳號只能一隻用（setPetAccount），換帳號時整個程式重開（applySettings）。
 */
const sessionOf = (i) => session.fromPath(path.join(app.getPath("userData"), "Partitions", partitionOf(i).replace(/^persist:/, "")));

const accountLabel = (g) => (g.accountId ? accounts.nameOf(g.accountId) : "訪客（不登入）");

/** 第 i 隻上次的遊戲視窗選項（見 settings.gameWindows）。位置不對（舊設定、手改壞）就當沒記。 */
function savedGameWindow(index) {
  const w = settings.gameWindows[index] ?? {};
  const bounds = Number.isFinite(w.x) && Number.isFinite(w.y) ? { x: w.x, y: w.y } : undefined;
  return { keepTaskbar: !!w.keepTaskbar, bounds };
}

function rememberGameWindow(g) {
  changeSettings((s) => {
    const list = Array.from({ length: MAX_PETS }, (_, i) => s.gameWindows[i] ?? null);
    list[g.index] = { keepTaskbar: g.keepTaskbar, ...g.bounds };
    s.gameWindows = list;
  });
}

function createGame(index) {
  const { keepTaskbar, bounds } = savedGameWindow(index);
  const g = { index, accountId: accountOf(index), partition: partitionOf(index), win: undefined, shown: false, bounds,
    lastRaw: undefined, lastState: undefined, continued: false, noSaveSince: 0, login: { state: "idle", at: 0 },
    retryTimer: undefined, failures: 0, mode: "auto", frame: { dw: 0, dh: 0 }, keepTaskbar, parkedAt: 0 };
  g.win = new BrowserWindow({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    show: false,
    skipTaskbar: true,
    title: `黑暗大陸（第 ${index + 1} 隻・${accountLabel(g)}）`,
    autoHideMenuBar: true,
    webPreferences: {
      session: sessionOf(index),
      backgroundThrottling: false,
      preload: path.join(__dirname, "game-preload.js"),
    },
  });
  g.win.webContents.setAudioMuted(true);
  // 工作列上每隻自己一個按鈕（同一個程式的視窗 Windows 會照 App ID 合併成一組，對那組「最小化所有視窗」會一起縮小）
  if (process.platform === "win32") g.win.setAppDetails({ appId: `com.darkcontinent.desktoppet.pet${index + 1}`, appIconPath: process.execPath, appIconIndex: 0 });
  // 視窗邊框＋標題列多大：手機 9:16、PC 16:9 要讓「遊戲區」剛好是那個比例
  const outer = g.win.getBounds(), inner = g.win.getContentBounds();
  g.frame = { dw: outer.width - inner.width, dh: outer.height - inner.height };
  parkGame(g);
  g.displayTimer = setInterval(() => g.shown && syncDisplayMode(g), DISPLAY_POLL_MS);
  // 關視窗＝藏起來，遊戲繼續跑；真的要關從桌寵右鍵或系統匣「結束」
  g.win.on("close", (e) => {
    if (quitting || g.closing) return;
    e.preventDefault();
    showGame(g, false);
  });
  // 縮到最小化的話 Chromium 會把畫面停掉（跟沒顯示一樣），當成藏起來：放回螢幕外繼續跑
  g.win.on("minimize", () => {
    g.win.restore();
    showGame(g, false);
  });
  // 「保持狀態列」藏起來的遊戲：在工作列上點它的按鈕（視窗拿到焦點）就叫出來。
  // 剛藏起來那一下 restore()／切換焦點可能也會送 focus，略過
  g.win.on("focus", () => {
    if (!g.shown && g.keepTaskbar && Date.now() - g.parkedAt > 500) showGame(g, true);
  });
  // 遊戲網頁的程序當掉（掛很久記憶體不夠、顯示卡驅動出錯…）：視窗會變成整片白、遊戲也停了，重新載入
  g.win.webContents.on("render-process-gone", (_e, d) => {
    if (g.closing || quitting) return;
    logGame(g, `遊戲網頁當掉（${d.reason}，代碼 ${d.exitCode}），重新載入`);
    setTimeout(() => !g.win.isDestroyed() && loadGame(g), 1000);
  });
  // 卡住沒回應（白畫面、按不動）超過 HANG_RELOAD_MS 也重新載入；先把卡住的程序結束掉，再由上面的 render-process-gone 重載
  g.win.webContents.on("unresponsive", () => {
    clearTimeout(g.hangTimer);
    g.hangTimer = setTimeout(() => {
      if (g.win.isDestroyed()) return;
      logGame(g, `遊戲網頁卡住 ${HANG_RELOAD_MS / 1000} 秒沒回應，重新載入`);
      g.win.webContents.forcefullyCrashRenderer();
    }, HANG_RELOAD_MS);
  });
  g.win.webContents.on("responsive", () => clearTimeout(g.hangTimer));
  // 遊戲會把標題改成遊戲名稱，蓋回來才分得出是哪一隻、哪個帳號
  g.win.on("page-title-updated", (e) => e.preventDefault());
  g.win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // 每次載入都重新來一次：自動登入、自動繼續冒險。順便記下載入的是哪一版，檢查遊戲更新時比對（updates.js）
  g.win.webContents.on("did-finish-load", async () => {
    g.continued = false;
    g.noSaveSince = 0;
    g.login = { state: "idle", at: 0 };
    g.version = await inGame(g, `document.querySelector('script[src*="data/game.js?v="], script[src*="data/config.js?v="]')?.src.match(/v=([\\w.-]+)/)?.[1]`);
    setGameHidden(g);
    setGameFps(g);
    syncDisplayMode(g);
  });
  loadGame(g);
  return g;
}

function destroyGame(g) {
  clearTimeout(g.retryTimer);
  clearTimeout(g.hangTimer);
  clearInterval(g.displayTimer);
  g.closing = true;
  if (!g.win.isDestroyed()) g.win.destroy();
}

/** 這個程式只開這隻（ME）的遊戲視窗。 */
const liveGames = () => games.filter(Boolean);

function syncGames() {
  if (games[ME]) return;
  games[ME] = createGame(ME);
}

/**
 * 「藏起來」＝把遊戲視窗停在螢幕外面（只留 1 像素在角落）、幾乎透明、不在工作列、滑鼠穿過去，但它還是「顯示中」的視窗。
 * 不能用 hide()／show:false：沒顯示的視窗 Chromium 不畫畫面，遊戲的地圖迴圈（requestAnimationFrame）一秒只跑 1～2 次
 * （2026-10-26 實測，顯示中是 165 次），大地圖找怪、走過去打的節奏就跟玩家看著時不一樣——
 * 遊戲在背景時大地圖不會掉東西（使用者回報），所以要讓它跟真的開在畫面上一模一樣。安卓版也是用同樣的方法（1 像素懸浮視窗）。
 */
function parkGame(g) {
  // 全螢幕中的視窗搬不動，先退出全螢幕再停到螢幕外
  if (g.win.isFullScreen()) {
    leaveFullScreen(g);
    setTimeout(() => !g.shown && !g.win.isDestroyed() && parkGame(g), 800);
    return;
  }
  const area = screen.getPrimaryDisplay().workArea;
  const { width, height } = gameSize(g);
  g.parkedAt = Date.now();
  // 「保持狀態列」：工作列上留著按鈕（看起來像縮小到工作列），要能拿焦點，點按鈕才叫得出來（見 createGame 的 focus）。
  // 不能真的最小化：最小化的視窗 Chromium 不畫畫面，跟沒顯示一樣，找怪節奏會不對
  g.win.setSkipTaskbar(!g.keepTaskbar);
  g.win.setIgnoreMouseEvents(true);
  g.win.setFocusable(g.keepTaskbar);
  g.win.setOpacity(0.01);
  g.win.setBounds({ x: area.x - width + 1, y: area.y - height + 1, width, height });
  if (!g.win.isVisible()) g.win.showInactive();
}

/**
 * 遊戲視窗（含邊框）該多大，照這隻遊戲自己的「🖥️ 畫面尺寸」設定（g.mode，見 syncDisplayMode）：
 *   auto 自動尺寸、full 全螢幕 → 原本的直式 480×860（全螢幕是叫出來時再整個放大，見 placeShownGame）
 *   phone 手機 9:16 → 遊戲區剛好 9:16，不留黑邊
 *   pc    PC 16:9 → 橫式，遊戲區寬 1280（螢幕放不下就縮小），比例跟遊戲 PC 外框一樣
 */
function gameSize(g) {
  const area = screen.getPrimaryDisplay().workArea;
  const { dw, dh } = g.frame;
  const maxW = area.width - dw - 40, maxH = area.height - dh - 40; // 四周留一點邊
  let w, h;
  if (g.mode === "phone") {
    h = Math.min(GAME_HEIGHT - dh, maxH);
    w = Math.round((h * 9) / 16);
  } else if (g.mode === "pc") {
    w = Math.min(PC_GAME_WIDTH, maxW);
    h = Math.round(w * PC_RATIO);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h / PC_RATIO);
    }
  } else return { width: GAME_WIDTH, height: GAME_HEIGHT };
  return { width: w + dw, height: h + dh };
}

/** 叫出來的遊戲視窗擺到上次的位置（第一次放螢幕中間），大小照畫面尺寸；換成比較大的尺寸時往內推，不跑出螢幕。 */
function placeShownGame(g) {
  if (g.win.isFullScreen()) return;
  const area = screen.getPrimaryDisplay().workArea;
  // 只記位置、大小每次重算（螢幕縮放比例會讓 getBounds 多 1～2 像素，記整個的話每開關一次就變大一點）
  const { width, height } = gameSize(g);
  const at = g.bounds ?? { x: area.x + Math.round((area.width - width) / 2), y: area.y + Math.round((area.height - height) / 2) };
  const x = Math.max(area.x, Math.min(at.x, area.x + area.width - width));
  const y = Math.max(area.y, Math.min(at.y, area.y + area.height - height));
  g.win.setBounds({ x, y, width, height });
}

/** 「全螢幕」跟在瀏覽器裡一樣用網頁全螢幕（按 Esc 可以退出，退出後還是原本的視窗大小）。要在視窗顯示之後才叫。 */
function enterFullScreen(g) {
  if (g.mode !== "full" || g.win.isFullScreen()) return;
  g.win.webContents.executeJavaScript("document.documentElement.requestFullscreen().catch(() => {})", true).catch(() => {});
}

function leaveFullScreen(g) {
  inGame(g, "document.fullscreenElement && document.exitFullscreen().catch(() => {})");
  g.win.setFullScreen(false);
}

/**
 * 讀這隻遊戲現在的畫面尺寸設定（遊戲載入完、叫出來時每秒一次），換了就照新的尺寸重擺遊戲視窗。
 * 每隻的遊戲各有自己的 localStorage，所以每隻可以用不同的畫面尺寸。
 */
async function syncDisplayMode(g) {
  const saved = await inGame(g, `localStorage.getItem(${JSON.stringify(DISPLAY_KEY)})`);
  const mode = ["phone", "pc", "full"].includes(saved) ? saved : "auto";
  if (g.win.isDestroyed() || mode === g.mode) return;
  g.mode = mode;
  if (!g.shown) return parkGame(g);
  // 從全螢幕換成別的：遊戲自己會退出網頁全螢幕，等視窗真的退出來再調大小
  if (g.win.isFullScreen() && mode !== "full") {
    g.win.once("leave-full-screen", () => g.shown && placeShownGame(g));
    leaveFullScreen(g);
    return;
  }
  placeShownGame(g);
  enterFullScreen(g);
}

function showGame(g, on) {
  if (!g || g.win.isDestroyed()) return;
  if (on === g.shown) {
    if (on) g.win.focus();
    return;
  }
  g.shown = on;
  if (on) {
    // 叫出來時遊戲沒在跑（網頁當掉、或沒網路載入失敗正在等重試）：畫面會是整片白，馬上重新載入
    const wc = g.win.webContents;
    if (wc.isCrashed() || (!g.loading && !wc.getURL().startsWith(GAME_URL))) {
      logGame(g, `叫出遊戲時畫面沒在跑（${wc.isCrashed() ? "網頁當掉" : `網址 ${wc.getURL() || "空白"}`}），重新載入`);
      loadGame(g);
    }
    // 叫出來：恢復成一般視窗
    placeShownGame(g);
    g.win.setOpacity(1);
    g.win.setIgnoreMouseEvents(false);
    g.win.setFocusable(true);
    g.win.setSkipTaskbar(false);
    g.win.show();
    g.win.focus();
    enterFullScreen(g);
  } else {
    if (!g.win.isFullScreen()) {
      const { x, y } = g.win.getBounds();
      g.bounds = { x, y };
      rememberGameWindow(g);
    }
    parkGame(g);
  }
  // 遊戲以為自己一直看得見（見 game-preload.js），藏起來時背景音樂不會自己停，這裡幫它靜音
  g.win.webContents.setAudioMuted(!on);
  setGameHidden(g);
}

/**
 * 節約效能模式：遊戲視窗藏著時把遊戲的畫面解析度降低（地圖畫布要畫的像素少很多），叫出來或關掉這個模式時恢復。
 * 遊戲一律以為自己看得見（回報在背景的話大地圖不會找怪、不會掉東西），邏輯完全照常。見 game-preload.js。
 */
function setGameHidden(g) {
  if (!g || g.win.isDestroyed()) return;
  const lowRes = settings.powerSave && !g.shown;
  inGame(g, `window.__petLowRes ? __petLowRes(${lowRes}) : null`);
}

function setPowerSave(on) {
  changeSettings((s) => (s.powerSave = on));
  liveGames().forEach(setGameHidden);
  petWin?.webContents.send("pet:power-save", on);
}

// 畫面更新率（右鍵「節約效能模式 › 畫面更新率」）：遊戲畫面每秒最多畫幾格，越快越吃 CPU。0＝不限制（跟著螢幕更新率）。
// 遊戲那邊見 game-preload.js 的 __petMaxFps；桌寵動畫全部畫在同一個視窗，照所有桌寵裡最快的那個
const FPS_CHOICES = [48, 55, 60, 120, 144, 0];
const DEFAULT_FPS = 60;
const fpsOf = (i) => (FPS_CHOICES.includes(settings.petFps[i]) ? settings.petFps[i] : DEFAULT_FPS);

function setGameFps(g) {
  if (!g || g.win.isDestroyed()) return;
  inGame(g, `window.__petMaxFps ? __petMaxFps(${fpsOf(g.index)}) : null`);
}

const sendPetFps = () => petWin?.webContents.send("pet:max-fps", fpsOf(ME));

/** 換畫面更新率：勾了「套用到全部桌寵」就全部一起換（之後才加進來的也是），不然只換第 petIndex 隻。 */
function setPetFps(fps, petIndex) {
  changeSettings((s) => (s.petFps = Array.from({ length: MAX_PETS }, (_, i) => (s.fpsApplyAll || i === petIndex ? fps : s.petFps[i] ?? null))));
  liveGames().forEach(setGameFps);
  sendPetFps();
}

const toggleGame = (g = games[ME]) => g && showGame(g, !g.shown);

/** 從右鍵選單叫出遊戲：keepTaskbar＝這次之後關掉（藏起來）時工作列上留著按鈕，點一下就叫回來；一般的「顯示遊戲視窗」恢復成完全藏起來。 */
function openGame(g, keepTaskbar) {
  if (!g || g.win.isDestroyed()) return;
  g.keepTaskbar = keepTaskbar;
  rememberGameWindow(g);
  showGame(g, true);
}

const inGame = (g, code) => (g.win.isDestroyed() ? Promise.resolve(undefined) : g.win.webContents.executeJavaScript(code).catch(() => undefined));

const GAME_RETRY_MS = 30000;
const HANG_RELOAD_MS = 20000;
const GAME_LOG_MAX = 200 * 1024;

/**
 * 遊戲視窗出狀況（載入失敗、網頁當掉、卡住）記到 %APPDATA%\黑暗大陸桌寵\game-log.txt，玩家回報白畫面時可以請他傳這個檔。
 * 超過 GAME_LOG_MAX 就只留後半段。
 */
function logGame(g, text) {
  const line = `${new Date().toLocaleString("zh-TW", { hour12: false })} 第 ${g.index + 1} 隻：${text}\n`;
  console.error(line.trim());
  try {
    const file = path.join(app.getPath("userData"), "game-log.txt");
    if (fs.existsSync(file) && fs.statSync(file).size > GAME_LOG_MAX) fs.writeFileSync(file, fs.readFileSync(file, "utf8").slice(-GAME_LOG_MAX / 2));
    fs.appendFileSync(file, line);
  } catch {}
}

/** 載入遊戲，失敗（沒網路、遊戲站暫時連不上）就每隔一段時間再試，直到成功。 */
async function loadGame(g) {
  clearTimeout(g.retryTimer);
  g.lastRaw = undefined;
  g.loading = true;
  try {
    await g.win.loadURL(GAME_URL);
  } catch (e) {
    g.loading = false;
    if (g.win.isDestroyed()) return;
    logGame(g, `遊戲載入失敗，${g.failures === 0 ? 1 : GAME_RETRY_MS / 1000} 秒後再試：${e.message}`);
    // 上次不正常結束有可能把遊戲的離線快取弄壞，把快取清掉讓它重新下載；存檔在 localStorage，不在清除範圍內
    await g.win.webContents.session.clearStorageData({ storages: ["serviceworkers", "cachestorage"] }).catch(() => {});
    g.retryTimer = setTimeout(() => loadGame(g), g.failures++ === 0 ? 1000 : GAME_RETRY_MS);
    return;
  }
  g.loading = false;
  g.failures = 0;
}

// ── 自動登入、自動繼續冒險 ──────────────────────────────────
// 跟玩家自己在標題畫面操作一樣：按「☁️ 登入／註冊」→ 填 Email、密碼 → 按「登入」；登入後遊戲會下載雲端角色，再按「繼續冒險」。
// 每次載入遊戲各只幫忙做一次，之後使用者自己回標題、登出、換角色就不再插手。

/** 填好登入表單按「登入」。email、密碼只在這台電腦的兩個視窗之間傳，不經過其他地方。 */
const SUBMIT_LOGIN = (email, pass) => `(() => {
  const open = document.getElementById("btn-cloud");
  if (!open || open.classList.contains("hidden")) return false;
  open.click();
  const em = document.getElementById("cloud-email"), pw = document.getElementById("cloud-pass");
  if (!em || !pw) return false;
  em.value = ${JSON.stringify(email)};
  pw.value = ${JSON.stringify(pass)};
  const btn = [...document.querySelectorAll("#dialog-layer .dialog-btns button")].find((b) => b.textContent.trim() === "登入");
  if (!btn) return false;
  btn.click();
  return true;
})()`;

const PRESS_CONTINUE = `(() => {
  const btn = document.getElementById("btn-continue");
  if (!btn || btn.classList.contains("hidden")) return false;
  btn.click();
  return true;
})()`;

/** 登入失敗：告訴使用者是哪一隻、為什麼，把那隻的遊戲叫出來讓使用者自己處理。 */
function loginFailed(g, why) {
  g.login = { state: "failed", at: Date.now() };
  logGame(g, `自動登入 ${accountLabel(g)} 失敗：${why}`);
  petWin?.webContents.send("pet:notice", g.index, `${accountLabel(g)} 登入失敗：${why}`);
  showGame(g, true);
}

/** 回傳 true＝已經登入好了（或這隻不用登入），可以繼續冒險。 */
async function autoLogin(g, r) {
  if (!g.accountId) return true;
  if (r.screen !== "screen-title") return true; // 已經在遊戲裡了
  const acct = accounts.find(g.accountId);
  const cloud = r.cloud ?? "";
  if (cloud.toLowerCase().includes(acct.email.toLowerCase())) {
    g.login.state = "done";
    return true;
  }
  if (g.login.state === "failed" || g.login.state === "done" || !cloud || cloud.includes("連線中")) return false;
  if (g.login.state === "trying") {
    const msg = (r.cloudMsg ?? "").trim();
    if (msg && !msg.includes("中…")) loginFailed(g, msg);
    else if (Date.now() - g.login.at > LOGIN_TIMEOUT_MS) loginFailed(g, "等太久沒有回應");
    return false;
  }
  if (cloud.includes("雲端帳號")) {
    loginFailed(g, "這個遊戲視窗已經登入了別的帳號，請先在遊戲裡登出");
    return false;
  }
  if (r.dialog) return false; // 遊戲正跳著別的對話框（公告等），等使用者看完
  const pass = accounts.password(g.accountId);
  if (!pass) {
    loginFailed(g, "帳號檔裡沒有這個帳號的密碼（或換了電腦解不開），請到「帳號管理…」重新輸入");
    return false;
  }
  if (await inGame(g, SUBMIT_LOGIN(acct.email, pass))) g.login = { state: "trying", at: Date.now() };
  return false;
}

async function autoContinue(g, r) {
  if (g.continued || !settings.autoContinue) return;
  if (r.screen && r.screen !== "screen-title") {
    g.continued = true;
    return;
  }
  if (r.screen !== "screen-title" || r.dialog || !(await autoLogin(g, r))) return;
  if (r.canContinue) {
    if (await inGame(g, PRESS_CONTINUE)) g.continued = true;
    return;
  }
  // 沒有角色：剛登入的話雲端角色可能還在下載，等一下；還是沒有就把遊戲叫出來讓使用者建角色
  g.noSaveSince ||= Date.now();
  if (!g.accountId || Date.now() - g.noSaveSince > NO_SAVE_WAIT_MS) {
    g.continued = true;
    showGame(g, true);
  }
}

// ── 桌寵視窗 ──────────────────────────────────────────────

function createPetWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  petWin = new BrowserWindow({
    x: area.x,
    y: area.y + area.height - PET_STRIP_HEIGHT,
    width: area.width,
    height: PET_STRIP_HEIGHT,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, "pet-preload.js") },
  });
  petWin.setAlwaysOnTop(true, "screen-saver");
  // 「顯示桌面」（Win+D）有時會把桌寵也一起縮小。桌寵沒有工作列按鈕，縮小了就點不回來，所以一被縮小就馬上放回去
  petWin.on("minimize", () => {
    petWin.restore();
    petWin.setAlwaysOnTop(true, "screen-saver");
  });
  petWin.setIgnoreMouseEvents(true, { forward: true });
  petWin.loadFile(path.join(__dirname, "pet", "index.html"));
  petWin.webContents.on("did-finish-load", () => {
    sendPets();
    sendStay();
    petWin.webContents.send("pet:focus-show", settings.focusShow);
    petWin.webContents.send("pet:normal-show", settings.normalShow);
    petWin.webContents.send("pet:power-save", settings.powerSave);
    sendPetFps();
    if (settings.petSize) petWin.webContents.send("pet:size", settings.petSize);
    liveGames().forEach(sendState);
  });
}

/** petIndex＝對第幾隻桌寵按的右鍵。 */
/** 先問一下現在活著幾隻（選單上的「第幾隻」「新增一隻」要用），再跳出選單。 */
async function popupMenu() {
  await refreshAlive();
  buildMenu().popup({ window: petWin });
}

/** 專注模式是全部桌寵一起的：這隻切換時也叫別隻一起切（tell＝false 是別隻叫的，不用再轉告）。 */
function setClickThrough(on, tell = true) {
  if (tell) for (const i of alive) if (i !== ME) peers.request(i, { type: "click-through", on });
  clickThrough = on;
  if (on) petWin.setIgnoreMouseEvents(true, { forward: true });
  petWin.webContents.send("pet:click-through", on);
  // 勿擾（專注模式）期間沒講的提醒，解除後補講最後那一句
  if (!on && pendingSay) {
    const text = pendingSay;
    pendingSay = undefined;
    setTimeout(() => say(text), 2500); // 等「專注模式已解除」的提示先飄完
  }
}

// ── 桌寵提醒 ──────────────────────────────────────────────
// 只用在更新提醒：桌寵頭上跳出對話框講一句。勿擾（專注模式）時不跳，記著等解除再講；
// 桌寵被藏起來時改用系統通知，不然提醒就白講了。
let pendingSay;

function say(text) {
  if (clickThrough) pendingSay = text;
  else if (petShown()) petWin.webContents.send("pet:say", text);
  else if (Notification.isSupported()) new Notification({ title: "黑暗大陸桌寵", body: text }).show();
}

/** 桌寵現在看不看得到（被「顯示桌寵」藏起來、或被系統縮小都算看不到）。 */
const petShown = () => !!petWin && petWin.isVisible() && !petWin.isMinimized();

/** 把桌寵叫出來，但不搶走使用者正在用的視窗的焦點。 */
function showPet() {
  if (petWin.isMinimized()) petWin.restore();
  petWin.showInactive();
  petWin.setAlwaysOnTop(true, "screen-saver");
}

/** 桌寵被藏起來或開著專注模式時，一律恢復成看得到、點得到。 */
function restorePet() {
  if (!petShown()) showPet();
  if (clickThrough) setClickThrough(false);
}

/** 專注模式的快捷鍵。桌寵被藏起來時按它是先把桌寵叫回來，不然會變成怎麼按都看不到效果。 */
function toggleClickThrough() {
  if (!petShown()) restorePet();
  else setClickThrough(!clickThrough);
}

/** 大小是全部桌寵共用的（拉的時候存進設定，別隻跟著變，見 pet:size）；拉條開在這隻頭上。 */
function openSizer(petIndex = 0) {
  if (clickThrough) setClickThrough(false);
  if (!petShown()) showPet();
  petWin.webContents.send("pet:open-sizer", petIndex);
}

/** 說明、選外觀這種一般的小視窗：同一種只開一個，已經開著就拉到前面。 */
function openPanel(current, file, options) {
  if (current && !current.isDestroyed()) {
    current.show();
    current.focus();
    return current;
  }
  const win = new BrowserWindow({ autoHideMenuBar: true, resizable: false, minimizable: false, maximizable: false, ...options });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "ui", file));
  return win;
}

function openHelp() {
  helpWin = openPanel(helpWin, "help.html", { width: 480, height: 620, title: "黑暗大陸桌寵・操作說明",
    webPreferences: { preload: path.join(__dirname, "help-preload.js") } });
}

function openAccounts() {
  accountsWin = openPanel(accountsWin, "accounts.html", {
    width: 520,
    height: 640,
    title: "帳號管理",
    webPreferences: { preload: path.join(__dirname, "accounts-preload.js") },
  });
}

function openPetsWin() {
  petsWin = openPanel(petsWin, "pets.html", {
    width: 480,
    height: 640,
    resizable: true,
    title: "選擇要開的桌寵",
    webPreferences: { preload: path.join(__dirname, "pets-preload.js") },
  });
}

ipcMain.handle("pets:get", async () => {
  await refreshAlive();
  return { accounts: accounts.list(), pets: alive.map((i) => ({ index: i, account: accountOf(i) })), max: MAX_PETS, autoContinue: settings.autoContinue };
});
ipcMain.handle("pets:apply", (_e, choice) => applyPetChoice(choice));

/** 幫第 petIndex 隻桌寵挑外觀。視窗已經開著、這次換了一隻的話，重新載入讓它標出那一隻目前選的。 */
function openPicker(petIndex = 0) {
  const retarget = pickerWin && !pickerWin.isDestroyed() && pickerTarget !== petIndex;
  pickerTarget = petIndex;
  pickerWin = openPanel(pickerWin, "picker.html", {
    width: 440,
    height: 640,
    title: "選擇桌寵外觀",
    webPreferences: { preload: path.join(__dirname, "picker-preload.js") },
  });
  if (retarget) pickerWin.webContents.reload();
}

/**
 * 這個桌寵視窗裡每個位置該長什麼樣（只有這隻 ME 有，別隻的位置是 null）：
 * 使用者幫那一隻選的優先；沒選的話角色變身中就是變身的樣子（可以在選單關掉），不然跟著角色職業。
 */
function resolveModels() {
  return Array.from({ length: ME + 1 }, (_, i) => {
    if (i !== ME) return null; // 別隻是別的程式畫的，這個視窗不畫（pet.js）
    const raw = games[i]?.lastRaw;
    const picked = settings.petModels[i];
    if (picked && spriteDef(picked)) return picked;
    if (settings.followMorph && raw?.morph) return `morph:${raw.morph}`;
    return names.classes[raw?.cls]?.sprite ? raw.cls : DEFAULT_MODEL;
  });
}

/** 外觀 key → 動作圖規格：職業 key 用 classes，「morph:xxx」用變身外觀 morphs。 */
function spriteDef(model) {
  if (typeof model !== "string") return null;
  const sprite = model.startsWith("morph:") ? names.morphs?.[model.slice(6)]?.sprite : names.classes[model]?.sprite;
  return sprite?.walk ? sprite : null;
}

// 每隻桌寵可以整隻調色：hue＝色相轉幾度、sat＝鮮豔度 %、light＝亮度 %。[最小, 最大, 預設]
const COLOR_RANGE = { hue: [0, 360, 0], sat: [0, 200, 100], light: [50, 150, 100] };

/** 把選外觀視窗送來的顏色整理成合法的數字；全部都是預設值就回傳 null（＝不調色）。 */
function cleanColor(color) {
  const out = {};
  let changed = false;
  for (const [key, [min, max, normal]] of Object.entries(COLOR_RANGE)) {
    const value = Number(color?.[key]);
    out[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : normal;
    if (out[key] !== normal) changed = true;
  }
  return changed ? out : null;
}

const sendColors = () => petWin?.webContents.send("pet:colors", Array.from({ length: ME + 1 }, (_, i) => settings.petColors[i] ?? null));

function sendPets() {
  sendColors(); // 先送，新加進來的桌寵一出現就是調好的顏色
  petWin?.webContents.send("pet:pets", resolveModels());
}

/** 滑鼠移上去的提示框內容：還沒讀到角色時至少顯示這隻是哪個帳號。 */
function sendState(g) {
  const state = g.lastState ?? { account: accountLabel(g), place: g.accountId ? "登入中" : "等待進入遊戲", doing: "" };
  petWin?.webContents.send("pet:state", g.index, state);
}

// ── 每隻一個程式：開新的、結束 ────────────────────────────

let alive = []; // 現在活著的是哪幾隻（含這隻），每幾秒問一次（refreshAlive）
// 剛開、還在啟動中的那幾隻（編號 → 開的時間）：連按好幾次「新增」時，還沒開好的不能再被挑一次
const starting = new Map();
const STARTING_MS = 30000;

async function refreshAlive() {
  const list = await peers.scan(MAX_PETS);
  alive = [...new Set([...list, ...(LAUNCHER ? [] : [ME])])].sort((a, b) => a - b);
  for (const [i, at] of starting) if (alive.includes(i) || Date.now() - at > STARTING_MS) starting.delete(i); // 開好了（或開不起來）
  return alive;
}

/** 開第 index 隻：同一個程式帶 --pet=N 再開一次（開發版要多帶程式資料夾）。 */
function spawnPet(index) {
  const args = [...(process.defaultApp ? [app.getAppPath()] : []), ...process.argv.filter((a) => a === "--no-sandbox"), `--pet=${index + 1}`];
  spawn(process.execPath, args, { detached: true, stdio: "ignore" }).unref();
}

const freeSlots = () => Array.from({ length: MAX_PETS }, (_, i) => i).filter((i) => !alive.includes(i) && !starting.has(i));

/**
 * 「選擇要開的桌寵」按確認（ui/pets.*）：勾幾個帳號就開幾隻、各自登入那個帳號。
 * choice＝{ accounts:[要開的帳號 id], guests:[要留著的訪客是第幾隻], newGuest：再開一隻訪客 }。
 * 已經開著、還勾著的不動；新勾的帳號開一隻新的（優先用上次掛這個帳號的編號，牠的外觀等設定還在，沒有就用最小的空號）；
 * 取消勾選的那隻結束（下次打開也不開）。
 */
async function applyPetChoice(choice) {
  await refreshAlive();
  const wantAccounts = [...new Set(Array.isArray(choice?.accounts) ? choice.accounts : [])].filter((id) => accounts.find(id));
  const keepGuests = (Array.isArray(choice?.guests) ? choice.guests : []).filter((i) => alive.includes(i) && !accountOf(i));
  const total = wantAccounts.length + keepGuests.length + (choice?.newGuest ? 1 : 0);
  if (total === 0) return { error: "至少要勾一隻" };
  if (total > MAX_PETS) return { error: `最多 ${MAX_PETS} 隻` };

  const keep = alive.filter((i) => (accountOf(i) ? wantAccounts.includes(accountOf(i)) : keepGuests.includes(i)));
  const stop = alive.filter((i) => !keep.includes(i));
  const newAccounts = wantAccounts.filter((id) => !keep.some((i) => accountOf(i) === id));
  const need = newAccounts.length + (choice?.newGuest ? 1 : 0);
  const others = stop.filter((i) => i !== ME);
  // 空號不夠（例如 10 隻全開著、換掉幾隻）：先讓要結束的結束，等牠們的編號空出來
  if (freeSlots().length < need) {
    await Promise.all(others.map((i) => peers.request(i, { type: "quit" })));
    for (let tries = 0; tries < 30 && others.some((i) => alive.includes(i)); tries++) {
      await new Promise((r) => setTimeout(r, 500));
      await refreshAlive();
    }
    if (freeSlots().length < need) {
      return { error: stop.includes(ME) && freeSlots().length + 1 >= need
        ? `已經開滿 ${MAX_PETS} 隻：要把這隻換成別的帳號，請到別隻桌寵按右鍵操作（這隻要先結束才空得出位置）`
        : "有桌寵還沒結束，請稍等一下再按一次確認" };
    }
  }

  // 分配編號：上次掛這個帳號的那個編號優先；訪客優先用上次就是訪客的編號（訪客的存檔照編號放）
  const free = freeSlots().filter((i) => i !== ME);
  const take = (prefer) => {
    const i = free.find(prefer) ?? free[0];
    free.splice(free.indexOf(i), 1);
    return i;
  };
  const plan = newAccounts.map((id) => [take((i) => settings.petAccounts[i] === id), id]);
  if (choice?.newGuest) plan.push([take((i) => !settings.petAccounts[i]), null]);

  changeSettings((s) => {
    const list = Array.from({ length: MAX_PETS }, (_, i) => s.petAccounts[i] ?? null);
    for (const [slot, id] of plan) {
      if (id) list.forEach((other, i) => other === id && (list[i] = null)); // 同一個帳號只給一隻
      list[slot] = id;
    }
    s.petAccounts = list;
    s.openPets = [...keep, ...plan.map(([slot]) => slot)].sort((a, b) => a - b);
  });
  await Promise.all(others.map((i) => peers.request(i, { type: "quit" })));
  for (const [slot] of plan) {
    starting.set(slot, Date.now());
    spawnPet(slot);
  }
  if (stop.includes(ME)) setTimeout(() => app.quit(), 1500); // 這隻也被取消了：等視窗顯示完結果再結束
  return { ok: true, started: plan.length, stopped: stop.length };
}

/** 右鍵「結束這隻」：只關這個程式。還有別隻在跑的話，下次打開就不再開這隻；最後一隻結束時照舊記著，下次打開還是牠。 */
async function endSelf() {
  await refreshAlive();
  if (alive.some((i) => i !== ME)) changeSettings((s) => (s.openPets = s.openPets.filter((i) => i !== ME)));
  app.quit();
}

/** 右鍵「結束全部桌寵」：叫別隻都結束，自己也結束。下次打開還是這幾隻。 */
async function quitAll() {
  await refreshAlive();
  await Promise.all(alive.filter((i) => i !== ME).map((i) => peers.request(i, { type: "quit" })));
  app.quit();
}

/** 別隻（或啟動器）傳來的話，見 peers.js。 */
function onPeerMessage(msg) {
  switch (msg?.type) {
    case "ping":
      return { ok: true, index: ME, pid: process.pid };
    case "info": // 這隻現在開著哪個帳號的資料夾（見 waitAccountFree）
      return { ok: true, account: games[ME]?.accountId ?? null };
    case "restore": // 再點一次捷徑：救回來
      restorePet();
      if (msg.showGame) showGame(games[ME], true);
      return;
    case "click-through":
      setClickThrough(!!msg.on, false);
      return;
    case "reload-game":
      if (games[ME]) loadGame(games[ME]);
      return;
    case "income-reset":
      income.reset(ME);
      return;
    case "quit":
      setTimeout(() => app.quit(), 100); // 先回覆再結束
      return;
    case "relaunch":
      setTimeout(relaunchSelf, 100);
      return;
  }
  return { ok: false };
}

/**
 * 啟動器：把上次開著的那幾隻開起來。全部都已經在跑的話，當成「救回來」的按鈕：
 * 每隻都叫出來、解除專注模式，最前面那隻的遊戲視窗打開（跟以前再點一次捷徑一樣）。
 */
async function launch() {
  await refreshAlive();
  const missing = settings.openPets.filter((i) => !alive.includes(i));
  if (missing.length) missing.forEach(spawnPet);
  else if (alive.length) await Promise.all(alive.map((i) => peers.request(i, { type: "restore", showGame: i === alive[0] })));
  else spawnPet(0);
}

/**
 * 同一個帳號的資料夾同時只能一個程式開。帳號剛從別隻換過來時，那隻可能還沒重開完，等牠放掉（最多 20 秒）。
 * 帳號只會在設定檔裡指給一隻，所以這裡只是等時間差。
 */
async function waitAccountFree() {
  const mine = accountOf(ME);
  if (!mine) return;
  for (let tries = 0; tries < 40; tries++) {
    await refreshAlive();
    const replies = await Promise.all(alive.filter((i) => i !== ME).map((i) => peers.request(i, { type: "info" })));
    if (!replies.some((r) => r?.account === mine)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * 換第 petIndex 隻的帳號（null＝訪客）：那隻的遊戲視窗換一個新的，自動登入、繼續冒險。
 * 同一個帳號不能兩隻同時用（遊戲同一個帳號只能在一個地方上線），原本用這個帳號的那隻改回訪客。
 */
function setPetAccount(petIndex, accountId) {
  changeSettings((s) => {
    const list = Array.from({ length: MAX_PETS }, (_, i) => s.petAccounts[i] ?? null);
    if (accountId) list.forEach((id, i) => id === accountId && i !== petIndex && (list[i] = null));
    list[petIndex] = accountId;
    s.petAccounts = list;
  });
  // 帳號有變的那幾隻（這隻、或被搶走帳號的別隻）自己看到設定檔變了會重開，見 applySettings
  applySettings();
}

/** 飄字子選單裡的一個勾選項。group＝"focusShow"（專注模式）或 "normalShow"（一般模式），key＝哪一類飄字。 */
function showItem(group, key, label) {
  return {
    label,
    type: "checkbox",
    checked: !!settings[group][key],
    click: (item) => {
      changeSettings((s) => (s[group] = { ...s[group], [key]: item.checked }));
      petWin.webContents.send(group === "focusShow" ? "pet:focus-show" : "pet:normal-show", settings[group]);
    },
  };
}

const stays = (petIndex) => !!settings.stayPets[petIndex];
const allStay = () => alive.every(stays);
const sendStay = () => petWin?.webContents.send("pet:stay", Array.from({ length: ME + 1 }, (_, i) => stays(i)));

/** 原地不走動。有給 petIndex 就只改那一隻；沒給就是全部（連之後才加進來的也一起）。 */
function setStay(on, petIndex) {
  changeSettings((s) => (s.stayPets = Array.from({ length: MAX_PETS }, (_, i) => (petIndex === undefined || i === petIndex ? on : !!s.stayPets[i]))));
  sendStay();
}

/** 「帳號」子選單：點一個帳號就讓這隻登入那個帳號。別隻正在用的帳號後面註明是第幾隻（點了會搶過來）。 */
function accountMenu(petIndex) {
  const mine = accountOf(petIndex);
  const usedBy = (id) => settings.petAccounts.findIndex((a, i) => a === id && i !== petIndex && alive.includes(i));
  return {
    label: `帳號（第 ${petIndex + 1} 隻）：${mine ? accounts.nameOf(mine) : "訪客"}`,
    submenu: [
      { label: "訪客（不登入）", type: "radio", checked: !mine, click: () => mine && setPetAccount(petIndex, null) },
      ...accounts.list().map((a) => {
        const other = usedBy(a.id);
        return {
          label: `${a.label ? `${a.label}（${a.email}）` : a.email}${other >= 0 ? `　← 第 ${other + 1} 隻在用` : ""}`,
          type: "radio",
          checked: a.id === mine,
          click: () => a.id !== mine && setPetAccount(petIndex, a.id),
        };
      }),
      { type: "separator" },
      { label: "帳號管理…（新增、修改帳號密碼）", click: openAccounts },
    ],
  };
}

/** petIndex＝這次是對第幾隻桌寵按的右鍵（從系統匣開的話當作第一隻）。 */
function buildMenu() {
  const petIndex = ME;
  const g = games[petIndex];
  const many = alive.length > 1;
  const updateItems = updates.menuItems();
  return Menu.buildFromTemplate([
    ...updateItems,
    ...(updateItems.length ? [{ type: "separator" }] : []),
    g?.shown
      ? { label: `隱藏${many ? `第 ${petIndex + 1} 隻的` : ""}遊戲視窗`, accelerator: petIndex === 0 ? TOGGLE_KEY : undefined, click: () => toggleGame(g) }
      : { label: `顯示${many ? `第 ${petIndex + 1} 隻的` : ""}遊戲視窗`, accelerator: petIndex === 0 ? TOGGLE_KEY : undefined, click: () => openGame(g, false) },
    // 關掉遊戲視窗時只縮到工作列（底部狀態列），點工作列按鈕就叫回來
    ...(g?.shown ? [] : [{ label: `顯示${many ? `第 ${petIndex + 1} 隻的` : ""}遊戲視窗（保持狀態列）`, click: () => openGame(g, true) }]),
    accountMenu(petIndex),
    { type: "separator" },
    {
      label: "專注模式",
      submenu: [
        { label: "開啟專注模式（桌寵不擋滑鼠）", type: "checkbox", checked: clickThrough, accelerator: CLICK_THROUGH_KEY, click: toggleClickThrough },
        { type: "separator" },
        { label: "專注模式下，桌寵頭上還要顯示（可複選）：", enabled: false },
        showItem("focusShow", "exp", "顯示經驗值、升級"),
        showItem("focusShow", "loot", "顯示金幣、物品取得"),
      ],
    },
    {
      label: "一般模式飄字",
      submenu: [
        { label: "一般模式下，桌寵頭上要顯示（可複選）：", enabled: false },
        showItem("normalShow", "exp", "顯示經驗值、升級"),
        showItem("normalShow", "loot", "顯示金幣、物品取得"),
      ],
    },
    { label: "顯示桌寵", type: "checkbox", checked: petShown(), click: () => (petShown() ? petWin.hide() : showPet()) },
    // 只有一隻時是單純的開關；有好幾隻時展開成「這一隻」和「全部」
    many
      ? {
          label: "原地不走動",
          submenu: [
            { label: `這一隻（第 ${petIndex + 1} 隻）`, type: "checkbox", checked: stays(petIndex), click: (item) => setStay(item.checked, petIndex) },
            { label: "全部桌寵", type: "checkbox", checked: allStay(), click: (item) => setStay(item.checked) },
          ],
        }
      : { label: "原地不走動", type: "checkbox", checked: stays(petIndex), click: (item) => setStay(item.checked) },
    // 每隻是獨立的程式（每隻一個帳號）：在視窗裡勾帳號決定開哪幾隻，最多 MAX_PETS 隻
    { label: `選擇要開的桌寵…（目前 ${alive.length} 隻，最多 ${MAX_PETS} 隻）`, click: openPetsWin },
    { label: many ? "調整大小…（全部一起）" : "調整大小…", click: () => openSizer(petIndex) },
    { label: many ? `選擇這隻桌寵的外觀…（第 ${petIndex + 1} 隻）` : "選擇桌寵外觀…", click: () => openPicker(petIndex) },
    { label: "帳號管理…", click: openAccounts },
    { label: "收入總覽…（這次啟動以來）", click: openIncome },
    { type: "separator" },
    {
      label: "節約效能模式",
      submenu: [
        { label: `畫面更新率${many ? `（第 ${petIndex + 1} 隻）` : ""}：越快越吃 CPU，請斟酌切換`, enabled: false },
        ...FPS_CHOICES.map((fps) => ({
          label: fps ? `${fps}Hz${fps === DEFAULT_FPS ? "（預設）" : ""}` : "不限制（跟著螢幕更新率）",
          type: "radio",
          checked: fpsOf(petIndex) === fps,
          click: () => setPetFps(fps, petIndex),
        })),
        { type: "separator" },
        {
          label: "套用到全部桌寵（不勾＝只改這一隻）",
          type: "checkbox",
          checked: settings.fpsApplyAll,
          click: (item) => changeSettings((s) => (s.fpsApplyAll = item.checked)),
        },
        { type: "separator" },
        {
          label: "節約效能模式（遊戲藏著時降低畫面解析度，照常掛機掉寶）",
          type: "checkbox",
          checked: settings.powerSave,
          click: (item) => setPowerSave(item.checked),
        },
      ],
    },
    {
      label: "變身時桌寵跟著變",
      type: "checkbox",
      checked: settings.followMorph,
      click: (item) => {
        changeSettings((s) => (s.followMorph = item.checked));
        sendPets();
      },
    },
    {
      label: "開啟時自動登入並繼續冒險",
      type: "checkbox",
      checked: settings.autoContinue,
      click: (item) => changeSettings((s) => (s.autoContinue = item.checked)),
    },
    // 開機自動啟動只有安裝版有意義（開發版登記的會是 electron.exe 本身）
    ...(app.isPackaged
      ? [{ label: "開機自動啟動", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
          click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) }]
      : []),
    { label: many ? `重新載入第 ${petIndex + 1} 隻的遊戲` : "重新載入遊戲", click: () => g && loadGame(g) },
    // 平常藏起來，操作說明的標題連點 20 下才出現（見 ui/help.js）
    ...(settings.reportUnlocked ? [{ label: "回報效能異常（CPU 偏高）…", click: reportPerformance }] : []),
    { label: "操作說明", click: openHelp },
    updates.checkItem(),
    { type: "separator" },
    // 每隻是獨立的程式：「結束這隻」只關這隻，別隻照常掛機
    { label: many ? `結束這隻（第 ${petIndex + 1} 隻）` : "結束", click: endSelf },
    ...(many ? [{ label: `結束全部桌寵（${alive.length} 隻）`, click: quitAll }] : []),
  ]);
}

// ── 人物動作圖 ────────────────────────────────────────────

async function fetchBytes(relPath) {
  const res = await net.fetch(GAME_URL + relPath);
  if (!res.ok) throw new Error(`${relPath} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const SPRITE_KEEP_MS = 7 * 24 * 60 * 60 * 1000; // 圖檔在本機留 7 天，過了才重新下載一次

/**
 * 抓遊戲站上的檔案，存一份在本機；之後斷網也拿得到上次那份。
 * keepMs 有給的話：本機那份還沒超過這麼久就直接用，不再連網路下載。
 */
async function cachedBytes(relPath, keepMs = 0) {
  const file = path.join(app.getPath("userData"), "game-cache", relPath);
  if (keepMs > 0) {
    try {
      if (Date.now() - fs.statSync(file).mtimeMs < keepMs) return fs.readFileSync(file);
    } catch {}
  }
  try {
    const bytes = await fetchBytes(relPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
    return bytes;
  } catch (e) {
    if (fs.existsSync(file)) return fs.readFileSync(file);
    throw e;
  }
}

// 桌寵用得到的動作：走路（走動、站著）、攻擊（有進帳時揮一下）、施法（升級時）
const PET_ACTIONS = ["walk", "attack", "cast"];

// walkOnly：選外觀視窗的縮圖只要走路圖，不用等另外兩張下載
ipcMain.handle("pet:sprite", async (_e, model, walkOnly) => {
  const sprite = spriteDef(model);
  if (!sprite) return null;
  try {
    const actions = {};
    await Promise.all((walkOnly ? ["walk"] : PET_ACTIONS).filter((a) => sprite[a]).map(async (a) => {
      const def = sprite[a];
      actions[a] = { cellW: def.cellW, cellH: def.cellH, frames: def.frames, ms: def.ms, image: await cachedBytes(def.src, SPRITE_KEEP_MS) };
    }));
    // foot：變身圖的腳底在格子裡的位置（職業圖沒有，腳底貼格子底部）
    return { charH: sprite.charH, foot: sprite.foot ?? null, actions };
  } catch (e) {
    console.error(`動作圖 ${model} 載入失敗：`, e.message);
    return null;
  }
});
ipcMain.on("pet:interactive", (_e, on) => petWin?.setIgnoreMouseEvents(!on, { forward: true }));
ipcMain.handle("picker:list", () => ({
  entries: [
    ...Object.entries(names.classes).filter(([, c]) => c.sprite?.walk).map(([model, c]) => ({ model, name: c.name, group: "職業" })),
    ...Object.entries(names.morphs ?? {}).filter(([, m]) => m.sprite?.walk).map(([key, m]) => ({ model: `morph:${key}`, name: m.name, group: "變身" })),
  ],
  current: settings.petModels[pickerTarget] ?? null,
  color: settings.petColors[pickerTarget] ?? null,
  colorRange: COLOR_RANGE,
  title: alive.length > 1 ? `選擇桌寵外觀（第 ${pickerTarget + 1} 隻）` : "選擇桌寵外觀",
}));
ipcMain.on("picker:choose", (_e, model) => {
  changeSettings((s) => {
    const models = Array.from({ length: MAX_PETS }, (_, i) => s.petModels[i] ?? null);
    models[pickerTarget] = spriteDef(model) ? model : null;
    s.petModels = models;
  });
  sendPets();
});
// 拉條拖動的過程一直送過來，桌寵馬上跟著變；放開（save）才寫進設定檔
ipcMain.on("picker:color", (_e, color, save) => {
  const set = (s) => {
    const colors = Array.from({ length: MAX_PETS }, (_, i) => s.petColors[i] ?? null);
    colors[pickerTarget] = cleanColor(color);
    s.petColors = colors;
  };
  if (save) changeSettings(set);
  else set(settings);
  sendColors();
});
ipcMain.on("pet:toggle-game", (_e, index) => toggleGame(games[index]));
ipcMain.on("pet:menu", () => popupMenu());
// 調整大小：拉的時候這隻馬上變，放開（save）才存進設定，別隻看到設定變了跟著變
ipcMain.on("pet:size", (_e, percent, save) => {
  const value = Math.round(Number(percent));
  if (save && Number.isFinite(value)) changeSettings((s) => (s.petSize = value));
});

// 帳號管理視窗
ipcMain.handle("accounts:get", () => ({
  accounts: accounts.list(),
  pets: alive,
  petAccounts: Array.from({ length: MAX_PETS }, (_, i) => (alive.includes(i) ? accountOf(i) : null)),
  encrypted: accounts.canEncrypt(),
}));
ipcMain.handle("accounts:save", (_e, account) => {
  const r = accounts.save(account ?? {});
  // 改了正在用的帳號的密碼：那隻重新登入一次
  if (r.id && account?.password) liveGames().filter((g) => g.accountId === r.id && g.login.state === "failed").forEach(loadGame);
  return r;
});
ipcMain.handle("accounts:remove", (_e, id) => {
  accounts.remove(id);
  settings.petAccounts.forEach((a, i) => a === id && setPetAccount(i, null));
  return true;
});
ipcMain.on("accounts:assign", (_e, petIndex, id) => {
  if (alive.includes(petIndex)) setPetAccount(petIndex, id && accounts.find(id) ? id : null);
});
ipcMain.on("accounts:open-folder", () => shell.showItemInFolder(accounts.file()));

// ── 讀遊戲狀態 ────────────────────────────────────────────
// 線上版是混淆過的，player 不在 window 上；改讀遊戲自己每 20 秒寫一次的本機存檔（加密的，save-reader.js 解開）。
// 所以事件是一批一批來的，不是每一刀都有。標題畫面上的按鈕狀態也一起讀，自動登入、自動繼續冒險要用。

// ── 掉落紀錄（收入總覽的「拿到／賣出的東西」）──────────────
// 遊戲沒有把「自動賣出了什麼」存進存檔，只寫在左下角訊息框的「掉落紀錄」分頁（最近 120 行），而且那個分頁開著才會畫出來。
// 所以遊戲視窗藏著的時候，桌寵幫忙把訊息框打開、切到掉落紀錄（按遊戲自己的按鈕函式 toggleLogDrawer／setLogPopTab，
// 跟玩家點一樣），每次讀狀態時把新出現的那幾行抄下來、拆成 { kind, name, n, gold }（使用者 2026-10-26 選的做法）。
// 叫出遊戲時看到訊息框開著是這個原因，自己關掉也沒關係，下次藏起來會再打開。
// 遊戲每次重畫都是整份最近 120 行，用「舊的結尾＝新的開頭」對齊，只拿後面多出來的。
const LOOT_COLLECTOR = `(() => {
  if (window.__petLoot) return;
  let prev = [];
  const queue = [];
  const num = (s) => Number(String(s).replace(/,/g, "")) || 0;
  function parse(line) {
    let m;
    if ((m = line.match(/^🪙 自動賣出 (.+) ×([\\d,]+)（\\+([\\d,]+)）/))) return [{ kind: "sold", name: m[1], n: num(m[2]), gold: num(m[3]) }];
    if ((m = line.match(/^🎁 獲得 (.+) ×([\\d,]+)$/))) return [{ kind: "got", name: m[1], n: num(m[2]) }];
    if ((m = line.match(/^🗺️ \\S+ (.+) ×([\\d,]+)$/))) return [{ kind: "got", name: m[1], n: num(m[2]) }];
    if ((m = line.match(/^📜 獲得任務道具「(.+)」 ×([\\d,]+)/))) return [{ kind: "got", name: m[1], n: num(m[2]) }];
    if ((m = line.match(/^🌙 離線撿到：(.+)$/))) return m[1].split("、").map((part) => part.match(/^(.+) ×([\\d,]+)$/)).filter(Boolean).map((x) => ({ kind: "got", name: x[1], n: num(x[2]) }));
    return [];
  }
  function sync() {
    const box = document.getElementById("hunt-loot");
    if (!box) return;
    const lines = [...box.querySelectorAll(".log-line")].map((e) => e.textContent);
    let add = lines;
    for (let o = 0; o < prev.length; o++) {
      const tail = prev.slice(o);
      if (tail.length <= lines.length && tail.every((v, i) => v === lines[i])) { add = lines.slice(tail.length); break; }
    }
    if (lines.length === prev.length && lines.every((v, i) => v === prev[i])) add = [];
    prev = lines;
    for (const line of add) queue.push(...parse(line));
  }
  window.__petLoot = {
    // hidden：遊戲視窗藏著，可以幫忙打開掉落紀錄
    take(hidden) {
      try {
        if (hidden && document.querySelector(".screen.active")?.id === "screen-game") {
          if (!document.getElementById("log-pop")?.classList.contains("open") && typeof toggleLogDrawer === "function") toggleLogDrawer();
          if (typeof setLogPopTab === "function") setLogPopTab("loot"); // 也會讓遊戲馬上重畫一次掉落紀錄
        }
        sync();
      } catch (e) {}
      return queue.splice(0);
    },
  };
})()`;

const READ_STATE = (hidden) => `(() => {
  try {
    ${LOOT_COLLECTOR};
    const slot = parseInt(localStorage.getItem(${JSON.stringify(SLOT_KEY)}), 10) || 0;
    const shown = (id) => { const el = document.getElementById(id); return !!el && !el.classList.contains("hidden"); };
    return {
      slot,
      raw: localStorage.getItem(slot ? ${JSON.stringify(SAVE_KEY)} + "_s" + slot : ${JSON.stringify(SAVE_KEY)}),
      screen: document.querySelector(".screen.active")?.id ?? "",
      cloud: shown("btn-cloud") ? document.getElementById("btn-cloud").textContent : "",
      cloudMsg: document.getElementById("cloud-msg")?.textContent ?? "",
      dialog: !!document.getElementById("dialog-layer")?.classList.contains("active"),
      canContinue: shown("btn-continue"),
      loot: window.__petLoot.take(${hidden ? "true" : "false"}),
    };
  } catch { return null; }
})()`;

// 遊戲的經驗表（遊戲 config.js 的 expToNext）：存檔的 exp 是「這一級裡的經驗」，跨過升級時要換算成總經驗才能相減
const EXP_TABLE_LOW = [0, 125, 175, 200, 250, 546];
const EXP_TABLE_HIGH = { 45: 729360, 46: 1508416, 47: 3495263, 48: 9912189 };
function expToNext(lv) {
  if (lv < EXP_TABLE_LOW.length) return EXP_TABLE_LOW[lv];
  if (lv <= 44) return (lv + 1) ** 4 - lv ** 4;
  return EXP_TABLE_HIGH[lv] || 36065092;
}
function totalExp(level, exp) {
  let sum = exp;
  for (let lv = 1; lv < level; lv++) sum += expToNext(lv);
  return sum;
}

/**
 * 變身中的話回傳用哪一套變身圖（names.morphs 的 key），不然 null。跟遊戲 ui-scene.js 的 playerMorph 一樣：
 * 變身對象有專屬圖用專屬圖，沒有就用變形卷軸的統一外觀。遊戲每一下都會清掉過期的增益，所以存檔裡有就是還在變身。
 */
function morphOf(p, savedAt) {
  const b = p.buffs?.morph;
  if (!b || (savedAt && b.until && b.until <= savedAt)) return null;
  const key = names.morphForms?.[b.form]?.sprite || names.defaultMorph;
  return names.morphs?.[key] ? key : null;
}

/** 存檔物件 → 桌寵要的摘要。 */
function summarize(slot, data) {
  const p = data?.player;
  if (!p || typeof p.lv !== "number") return null;
  const bag = {};
  for (const it of p.inv ?? []) if (it?.id) bag[it.id] = (bag[it.id] ?? 0) + (Number(it.n) || 1);
  const exp = Number(p.exp) || 0;
  return { id: `${slot}:${p.created ?? p.name}`, t: data.t, name: p.name, cls: p.cls, level: p.lv, exp, totalExp: totalExp(p.lv, exp),
    gold: Number(p.gold) || 0, kills: Number(p.kills) || 0, deaths: Number(p.deaths) || 0, morph: morphOf(p, data.t),
    loc: p.loc ?? {}, hunting: !!p.hunting, mapRun: !!p.mapRun, bag };
}

/** 角色現在人在哪、在做什麼。 */
function describePlace(s, screenId) {
  if (screenId && screenId !== "screen-game") return { place: "標題畫面", doing: "等待進入遊戲" };
  const { type, id, floor } = s.loc;
  // 在村莊：桌寵睡覺（頭上冒 Z、完全不動），見 pet.js 的 sleeping
  if (type === "town") return { place: names.towns[id] ?? "村莊", doing: "休息中", sleeping: true };
  let place = names.zones[id] ?? `地圖 #${id ?? "?"}`;
  if (floor) place += ` ${floor}F`;
  if (s.mapRun) place = `異界地圖（${place}）`;
  return { place, doing: s.hunting ? "掛機中" : "待機中" };
}

/** 比對前後兩次存檔，整理成桌寵要演出來的事件。 */
function diffEvents(prev, next) {
  const events = [];
  if (next.level > prev.level) events.push({ kind: "levelup", level: next.level });
  else if (next.exp > prev.exp) events.push({ kind: "exp", n: next.exp - prev.exp });
  if (next.gold > prev.gold) events.push({ kind: "gold", n: next.gold - prev.gold });
  const loot = [];
  for (const [itemId, count] of Object.entries(next.bag)) {
    const gained = count - (prev.bag[itemId] ?? 0);
    const name = names.items[itemId];
    if (gained > 0 && name) loot.push({ kind: "loot", n: gained, name });
  }
  return events.concat(loot.slice(0, MAX_LOOT_SHOWN));
}

async function pollGame(g) {
  const r = await inGame(g, READ_STATE(!g.shown));
  if (!r || g.win.isDestroyed()) return;
  await autoContinue(g, r);
  income.recordLoot(g.index, r.loot);
  const s = summarize(r.slot, parseSave(r.raw));
  if (!s) {
    if (!g.lastState) sendState(g);
    return;
  }
  // 換角色之後第一筆只當基準，不然整個背包都會被當成「剛撿到」
  if (g.lastRaw && g.lastRaw.id === s.id && g.lastRaw.t !== s.t) {
    const events = diffEvents(g.lastRaw, s);
    if (events.length) petWin?.webContents.send("pet:events", g.index, events);
  }
  if (!g.lastRaw || g.lastRaw.t !== s.t || g.lastRaw.id !== s.id) income.recordSave(g.index, s);
  const changedLook = g.lastRaw?.cls !== s.cls || g.lastRaw?.morph !== s.morph;
  g.lastRaw = s;
  const { bag, loc, ...rest } = s;
  g.lastState = { ...rest, account: accountLabel(g), ...describePlace(s, r.screen) };
  sendState(g);
  income.setHere(g.index, g.lastState.place === "標題畫面" ? null : s.loc ?? null);
  if (changedLook) sendPets();
}

// ── 收入總覽 ──────────────────────────────────────────────

// 收入總覽「目前地圖」的攻略連結：用瀏覽器開（只開攻略網站）
ipcMain.on("income:open-guide", (_e, url) => {
  if (typeof url === "string" && url.startsWith("https://jtnhrbpvvm-spec.github.io/taiwan_game2/")) shell.openExternal(url);
});

function openIncome() {
  incomeWin = openPanel(incomeWin, "income.html", {
    width: 560,
    height: 720,
    resizable: true,
    title: "收入總覽",
    webPreferences: { preload: path.join(__dirname, "income-preload.js") },
  });
}

ipcMain.handle("income:get", () => ({
  // here：每隻現在在哪（存檔的 loc；標題畫面時是 null），收入總覽畫「目前地圖」用
  // 活著的每一隻：這隻用自己記的，別隻讀牠們寫的檔（income.js）
  pets: alive.map((i) => ({ index: i, account: accountOf(i) ? accounts.nameOf(accountOf(i)) : "訪客（不登入）", ...(i === ME ? income.snapshot(i) : income.peek(i)) })),
  classes: Object.fromEntries(Object.entries(names.classes).map(([k, c]) => [k, c.name])),
}));

ipcMain.handle("income:reset", (_e, index) => {
  if (index === ME) income.reset(ME);
  else if (alive.includes(index)) return peers.request(index, { type: "income-reset" });
});

// ── 回報效能異常 ──────────────────────────────────────────
// 玩家回報桌寵一直佔很高 CPU 時，請他按這個：收集 15 秒效能資料，看過摘要後上傳（見 diagnostics.js、report-worker/）

const diagnosticsContext = () => ({ games: liveGames(), petWin, settings, clickThrough });
const reportPerformance = () => diagnostics.start(diagnosticsContext(), (text) => petWin?.webContents.send("pet:notice", ME, text));

// 選單項目平常藏起來（玩家用不到），開發者請玩家回報時才叫他打開：操作說明的標題連點 20 下。說明裡不寫
ipcMain.on("help:unlock", () => {
  changeSettings((s) => (s.reportUnlocked = true));
  petWin?.webContents.send("pet:notice", ME, "右鍵選單已經多出「回報效能異常」");
});

// ── 啟動 ──────────────────────────────────────────────────

async function createTray() {
  try {
    const icon = nativeImage.createFromBuffer(await cachedBytes("images/icon-192.png")).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    tray.setToolTip(`黑暗大陸桌寵（第 ${ME + 1} 隻）`);
    tray.on("click", () => toggleGame());
    tray.on("right-click", () => tray.popUpContextMenu(buildMenu()));
  } catch (e) {
    console.error("系統匣圖示建立失敗（不影響使用）：", e.message);
  }
}

app.whenReady().then(async () => {
  loadSettings();
  peers.init(app.getPath("userData"));
  if (LAUNCHER) {
    changeSettings(() => {}); // 舊版的 petCount 換算成 openPets 寫回去
    await launch();
    app.quit();
    return;
  }
  // 佔下這隻的編號；已經有程式在當這隻了（例如連點兩下新增）：叫牠出來，自己結束
  if (ME >= MAX_PETS || !(await peers.listen(ME, onPeerMessage))) {
    if (ME < MAX_PETS) await peers.request(ME, { type: "restore", showGame: true });
    app.quit();
    return;
  }
  if (!settings.openPets.includes(ME)) changeSettings((s) => (s.openPets = [...new Set([...s.openPets, ME])].sort((a, b) => a - b)));
  accounts.load();
  income.start(app.getPath("userData"), ME); // 收入總覽每次啟動從頭記，蓋掉這隻上一次的
  await refreshAlive();
  setInterval(refreshAlive, 5000);
  createPetWindow();
  createTray();
  watchSettings();
  // 快捷鍵整台電腦只能有一個程式佔用：顯示遊戲視窗是第 1 隻的；專注模式誰佔到都行（會叫全部一起切），
  // 佔著的那隻結束後別隻補上
  const grabKeys = () => {
    if (ME === 0 && !globalShortcut.isRegistered(TOGGLE_KEY)) globalShortcut.register(TOGGLE_KEY, () => toggleGame());
    if (!globalShortcut.isRegistered(CLICK_THROUGH_KEY)) globalShortcut.register(CLICK_THROUGH_KEY, toggleClickThrough);
  };
  grabKeys();
  setInterval(grabKeys, 5000);
  // 第一次開：先告訴使用者怎麼操作（之後從右鍵選單「操作說明」再看）
  if (!settings.helpSeen && !SELFTEST) {
    openHelp();
    changeSettings((s) => (s.helpSeen = true));
  }
  await waitAccountFree(); // 帳號剛從別隻換過來的話，等那隻放掉
  syncGames();
  setInterval(() => liveGames().forEach(pollGame), POLL_MS);
  updates.start({ notify: say, floater: (text) => petWin?.webContents.send("pet:notice", ME, text), gameUrl: GAME_URL,
    loadedGameVersions: () => liveGames().map((g) => g.version),
    // 套用遊戲更新：這隻重新載入，也叫別隻一起
    reloadGames: () => {
      liveGames().forEach(loadGame);
      for (const i of alive) if (i !== ME) peers.request(i, { type: "reload-game" });
    },
    // 桌寵自己的更新只讓最前面那隻檢查、下載（大家共用同一個下載資料夾）；立即更新時叫別隻一起重開／結束
    canCheck: () => ME === alive[0],
    others: () => alive.filter((i) => i !== ME),
    tell: (i, msg) => peers.request(i, msg) });
  // 走到這裡代表視窗都開好了：告訴外殼這份內容是能跑的（新下載的內容靠這個通過試用，不然會被退回上一份）
  global.petShell?.markHealthy();
  if (SELFTEST) require("./selftest").run({ games, petWin, inGame, diffEvents, buildMenu, openPicker, getPicker: () => pickerWin, openHelp, getHelp: () => helpWin,
    openAccounts, getAccountsWin: () => accountsWin, openPetsWin, getPetsWin: () => petsWin, accounts, setPetAccount, setStay, settings: () => settings, changeSettings, updates, say, setClickThrough,
    income, totalExp, summarize, sendPets, openIncome, getIncomeWin: () => incomeWin, setPowerSave, showGame, diagnostics, diagnosticsContext, setPetFps,
    quit: () => app.quit() });
});

// 測試用（設了 DARK_PET_TEST 才有）：從外面（node --inspect）按右鍵選單的功能，測好幾個程式之間的行為
if (process.env.DARK_PET_TEST) global.petTest = { ME, applyPetChoice, openPetsWin, petsWin: () => petsWin, endSelf, quitAll, buildMenu, refreshAlive, alive: () => alive, settings: () => settings,
  setPetAccount, setStay, changeSettings, games, income, petWin: () => petWin };

app.on("before-quit", () => (quitting = true));
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
