// 黑暗大陸桌寵：遊戲本體在藏起來的視窗裡照常掛機，桌面上只留會走動的角色。
// 做法照「放置希望桌寵」（desktop_pet），拿掉說話、撫摸，以及只有放置希望才有的功能（黑店、線上GM、書籤工具、收益）。
//
// 每一隻桌寵各有一個自己的遊戲視窗，登入狀態、存檔各自獨立（不同的 session partition），
// 所以每隻可以掛不同的帳號：右鍵選單「帳號」點一下就自動登入那個帳號、按「繼續冒險」開始掛機。帳號存在 accounts.json（accounts.js）。
//
//   games[i] = 第 i 隻桌寵的遊戲視窗，平常不顯示；對那隻點兩下叫出來操作，再點兩下藏回去
//   petWin   = 貼在工作區底部的透明長條，上面畫所有桌寵；滑鼠不在桌寵身上時整條都是穿透的
const { app, BrowserWindow, Menu, Notification, Tray, globalShortcut, ipcMain, nativeImage, net, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { parseSave } = require("./save-reader");
const accounts = require("./accounts");
const updates = require("./updates");
const income = require("./income");
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
const GAME_WIDTH = 480; // 遊戲視窗大小（藏起來時大小不變，遊戲才不用一直重排版面）
const GAME_HEIGHT = 860;
const DEFAULT_MODEL = "knight"; // 還沒有角色時先放騎士
const MAX_PETS = 10; // 桌面上最多同時幾隻桌寵（＝最多同時掛幾個帳號）
const LOGIN_TIMEOUT_MS = 30000; // 按了登入這麼久還沒登入成功就當作失敗
const NO_SAVE_WAIT_MS = 15000; // 登入後等雲端角色下載這麼久，還是沒有角色才把遊戲叫出來讓使用者建角色
const SELFTEST = process.argv.includes("--selftest");
// 自我測試用全新的暫存資料夾：不碰平常的設定、帳號和遊戲存檔
// （從外殼 boot.js 啟動的話外殼已經換好了，這裡只管直接跑 main.js 的情況）
if (SELFTEST && !global.petShell) app.setPath("userData", path.join(app.getPath("temp"), `dark-pet-selftest-${Date.now()}`));

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
let incomeWin;
let pickerTarget = 0; // 選外觀視窗現在是在幫第幾隻桌寵挑
// 使用者設定。petCount＝桌面上幾隻桌寵；
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
  normalShow: { exp: true, loot: true } };
const settingsFile = () => path.join(app.getPath("userData"), "pet-settings.json");

function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
    settings = { ...settings, ...saved, focusShow: { ...settings.focusShow, ...saved.focusShow },
      normalShow: { ...settings.normalShow, ...saved.normalShow } };
    for (const key of ["petAccounts", "petModels", "petColors", "stayPets"]) if (!Array.isArray(settings[key])) settings[key] = [];
    settings.petCount = Math.min(MAX_PETS, Math.max(1, Math.floor(Number(settings.petCount)) || 1));
  } catch {}
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error("設定存不進去：", e.message);
  }
}

if (!app.requestSingleInstanceLock()) app.quit();
// 桌寵已經在跑的時候再點一次捷徑：當成「救回來」的按鈕，把桌寵叫出來、解除專注模式、打開第一隻的遊戲視窗
app.on("second-instance", () => {
  restorePet();
  showGame(games[0], true);
});

// ── 遊戲視窗（每隻桌寵一個）─────────────────────────────────

/** 第 i 隻現在用的帳號 id（帳號被刪掉了就當作沒有）。 */
const accountOf = (i) => (accounts.find(settings.petAccounts[i]) ? settings.petAccounts[i] : null);

/** 登入資料、存檔放哪：有帳號的照帳號分（換給別隻用也帶著走），訪客照第幾隻分。 */
const partitionOf = (i) => (accountOf(i) ? `persist:acct-${accountOf(i)}` : `persist:guest-${i}`);

const accountLabel = (g) => (g.accountId ? accounts.nameOf(g.accountId) : "訪客（不登入）");

function createGame(index) {
  const g = { index, accountId: accountOf(index), partition: partitionOf(index), win: undefined, shown: false, bounds: undefined,
    lastRaw: undefined, lastState: undefined, continued: false, noSaveSince: 0, login: { state: "idle", at: 0 },
    retryTimer: undefined, failures: 0 };
  g.win = new BrowserWindow({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    show: false,
    skipTaskbar: true,
    title: `黑暗大陸（第 ${index + 1} 隻・${accountLabel(g)}）`,
    autoHideMenuBar: true,
    webPreferences: {
      partition: g.partition,
      backgroundThrottling: false,
      preload: path.join(__dirname, "game-preload.js"),
    },
  });
  g.win.webContents.setAudioMuted(true);
  parkGame(g);
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
  });
  loadGame(g);
  return g;
}

function destroyGame(g) {
  clearTimeout(g.retryTimer);
  g.closing = true;
  if (!g.win.isDestroyed()) g.win.destroy();
}

/** 遊戲視窗數量跟著桌寵數量；帳號換了的那幾隻換一個新的遊戲視窗（不同的登入資料）。 */
function syncGames() {
  while (games.length > settings.petCount) destroyGame(games.pop());
  for (let i = 0; i < settings.petCount; i++) {
    if (games[i] && games[i].partition === partitionOf(i)) continue;
    if (games[i]) destroyGame(games[i]);
    games[i] = createGame(i);
  }
}

/**
 * 「藏起來」＝把遊戲視窗停在螢幕外面（只留 1 像素在角落）、幾乎透明、不在工作列、滑鼠穿過去，但它還是「顯示中」的視窗。
 * 不能用 hide()／show:false：沒顯示的視窗 Chromium 不畫畫面，遊戲的地圖迴圈（requestAnimationFrame）一秒只跑 1～2 次
 * （2026-10-26 實測，顯示中是 165 次），大地圖找怪、走過去打的節奏就跟玩家看著時不一樣——
 * 遊戲在背景時大地圖不會掉東西（使用者回報），所以要讓它跟真的開在畫面上一模一樣。安卓版也是用同樣的方法（1 像素懸浮視窗）。
 */
function parkGame(g) {
  const area = screen.getPrimaryDisplay().workArea;
  g.win.setSkipTaskbar(true);
  g.win.setIgnoreMouseEvents(true);
  g.win.setFocusable(false);
  g.win.setOpacity(0.01);
  g.win.setBounds({ x: area.x - GAME_WIDTH + 1, y: area.y - GAME_HEIGHT + 1, width: GAME_WIDTH, height: GAME_HEIGHT });
  if (!g.win.isVisible()) g.win.showInactive();
}

function showGame(g, on) {
  if (!g || g.win.isDestroyed()) return;
  if (on === g.shown) {
    if (on) g.win.focus();
    return;
  }
  g.shown = on;
  if (on) {
    // 叫出來：放回上次的位置（第一次放螢幕中間），恢復成一般視窗
    const area = screen.getPrimaryDisplay().workArea;
    // 只記位置、大小一律用固定值（螢幕縮放比例會讓 getBounds 多 1～2 像素，記整個的話每開關一次就變大一點）
    const at = g.bounds ?? { x: area.x + Math.round((area.width - GAME_WIDTH) / 2), y: area.y + Math.round((area.height - GAME_HEIGHT) / 2) };
    g.win.setBounds({ x: at.x, y: at.y, width: GAME_WIDTH, height: GAME_HEIGHT });
    g.win.setOpacity(1);
    g.win.setIgnoreMouseEvents(false);
    g.win.setFocusable(true);
    g.win.setSkipTaskbar(false);
    g.win.show();
    g.win.focus();
  } else {
    const { x, y } = g.win.getBounds();
    g.bounds = { x, y };
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
  settings.powerSave = on;
  saveSettings();
  games.forEach(setGameHidden);
  petWin?.webContents.send("pet:power-save", on);
}

const toggleGame = (g = games[0]) => g && showGame(g, !g.shown);

const inGame = (g, code) => (g.win.isDestroyed() ? Promise.resolve(undefined) : g.win.webContents.executeJavaScript(code).catch(() => undefined));

const GAME_RETRY_MS = 30000;

/** 載入遊戲，失敗（沒網路、遊戲站暫時連不上）就每隔一段時間再試，直到成功。 */
async function loadGame(g) {
  clearTimeout(g.retryTimer);
  g.lastRaw = undefined;
  try {
    await g.win.loadURL(GAME_URL);
  } catch (e) {
    if (g.win.isDestroyed()) return;
    console.error(`第 ${g.index + 1} 隻的遊戲載入失敗，${GAME_RETRY_MS / 1000} 秒後再試：`, e.message);
    // 上次不正常結束有可能把遊戲的離線快取弄壞，把快取清掉讓它重新下載；存檔在 localStorage，不在清除範圍內
    await g.win.webContents.session.clearStorageData({ storages: ["serviceworkers", "cachestorage"] }).catch(() => {});
    g.retryTimer = setTimeout(() => loadGame(g), g.failures++ === 0 ? 1000 : GAME_RETRY_MS);
    return;
  }
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
  console.error(`第 ${g.index + 1} 隻登入 ${accountLabel(g)} 失敗：${why}`);
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
    games.forEach(sendState);
  });
}

/** petIndex＝對第幾隻桌寵按的右鍵。 */
function popupMenu(petIndex) {
  buildMenu(petIndex).popup({ window: petWin });
}

function setClickThrough(on) {
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

/** 大小是全部桌寵共用的；拉條開在被按右鍵的那一隻頭上。 */
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
  helpWin = openPanel(helpWin, "help.html", { width: 480, height: 620, title: "黑暗大陸桌寵・操作說明" });
}

function openAccounts() {
  accountsWin = openPanel(accountsWin, "accounts.html", {
    width: 520,
    height: 640,
    title: "帳號管理",
    webPreferences: { preload: path.join(__dirname, "accounts-preload.js") },
  });
}

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
 * 每一隻桌寵現在該長什麼樣（陣列長度＝桌寵數量）：
 * 使用者幫那一隻選的優先；沒選的話角色變身中就是變身的樣子（可以在選單關掉），不然跟著角色職業。
 */
function resolveModels() {
  return Array.from({ length: settings.petCount }, (_, i) => {
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

const sendColors = () => petWin?.webContents.send("pet:colors", Array.from({ length: settings.petCount }, (_, i) => settings.petColors[i] ?? null));

function sendPets() {
  sendColors(); // 先送，新加進來的桌寵一出現就是調好的顏色
  petWin?.webContents.send("pet:pets", resolveModels());
}

/** 滑鼠移上去的提示框內容：還沒讀到角色時至少顯示這隻是哪個帳號。 */
function sendState(g) {
  const state = g.lastState ?? { account: accountLabel(g), place: g.accountId ? "登入中" : "等待進入遊戲", doing: "" };
  petWin?.webContents.send("pet:state", g.index, state);
}

function setPetCount(count) {
  settings.petCount = count;
  saveSettings();
  syncGames();
  sendStay(); // 先送，新加進來的桌寵一出現就套上牠的設定
  sendPets();
  games.forEach(sendState);
  // 正在幫牠挑外觀的那一隻被收掉了，視窗跟著關
  if (pickerTarget >= count && pickerWin && !pickerWin.isDestroyed()) pickerWin.close();
}

/**
 * 換第 petIndex 隻的帳號（null＝訪客）：那隻的遊戲視窗換一個新的，自動登入、繼續冒險。
 * 同一個帳號不能兩隻同時用（遊戲同一個帳號只能在一個地方上線），原本用這個帳號的那隻改回訪客。
 */
function setPetAccount(petIndex, accountId) {
  const list = Array.from({ length: MAX_PETS }, (_, i) => settings.petAccounts[i] ?? null);
  if (accountId) list.forEach((id, i) => id === accountId && i !== petIndex && (list[i] = null));
  list[petIndex] = accountId;
  settings.petAccounts = list;
  saveSettings();
  syncGames();
  sendPets();
  games.forEach(sendState);
  accountsWin?.isDestroyed() === false && accountsWin.webContents.send("accounts:changed");
}

/** 飄字子選單裡的一個勾選項。group＝"focusShow"（專注模式）或 "normalShow"（一般模式），key＝哪一類飄字。 */
function showItem(group, key, label) {
  return {
    label,
    type: "checkbox",
    checked: !!settings[group][key],
    click: (item) => {
      settings[group] = { ...settings[group], [key]: item.checked };
      saveSettings();
      petWin.webContents.send(group === "focusShow" ? "pet:focus-show" : "pet:normal-show", settings[group]);
    },
  };
}

const stays = (petIndex) => !!settings.stayPets[petIndex];
const allStay = () => Array.from({ length: settings.petCount }, (_, i) => stays(i)).every(Boolean);
const sendStay = () => petWin?.webContents.send("pet:stay", Array.from({ length: settings.petCount }, (_, i) => stays(i)));

/** 原地不走動。有給 petIndex 就只改那一隻；沒給就是全部（連之後才加進來的也一起）。 */
function setStay(on, petIndex) {
  settings.stayPets = Array.from({ length: MAX_PETS }, (_, i) => (petIndex === undefined || i === petIndex ? on : stays(i)));
  saveSettings();
  sendStay();
}

/** 「帳號」子選單：點一個帳號就讓這隻登入那個帳號。別隻正在用的帳號後面註明是第幾隻（點了會搶過來）。 */
function accountMenu(petIndex) {
  const mine = accountOf(petIndex);
  const usedBy = (id) => settings.petAccounts.findIndex((a, i) => a === id && i !== petIndex && i < settings.petCount);
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
function buildMenu(petIndex = 0) {
  if (!(petIndex >= 0 && petIndex < settings.petCount)) petIndex = 0;
  const g = games[petIndex];
  const many = settings.petCount > 1;
  const updateItems = updates.menuItems();
  return Menu.buildFromTemplate([
    ...updateItems,
    ...(updateItems.length ? [{ type: "separator" }] : []),
    { label: `${g?.shown ? "隱藏" : "顯示"}${many ? `第 ${petIndex + 1} 隻的` : ""}遊戲視窗`, accelerator: petIndex === 0 ? TOGGLE_KEY : undefined, click: () => toggleGame(g) },
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
      : { label: "原地不走動", type: "checkbox", checked: stays(0), click: (item) => setStay(item.checked) },
    {
      label: "桌寵數量（每隻一個帳號）",
      submenu: Array.from({ length: MAX_PETS }, (_, i) => ({
        label: `${i + 1} 隻`,
        type: "radio",
        checked: settings.petCount === i + 1,
        click: () => setPetCount(i + 1),
      })),
    },
    { label: many ? "調整大小…（全部一起）" : "調整大小…", click: () => openSizer(petIndex) },
    { label: many ? `選擇這隻桌寵的外觀…（第 ${petIndex + 1} 隻）` : "選擇桌寵外觀…", click: () => openPicker(petIndex) },
    { label: "帳號管理…", click: openAccounts },
    { label: "收入總覽…（這次啟動以來）", click: openIncome },
    { type: "separator" },
    {
      label: "節約效能模式（遊戲藏著時降低畫面解析度，照常掛機掉寶）",
      type: "checkbox",
      checked: settings.powerSave,
      click: (item) => setPowerSave(item.checked),
    },
    {
      label: "變身時桌寵跟著變",
      type: "checkbox",
      checked: settings.followMorph,
      click: (item) => {
        settings.followMorph = item.checked;
        saveSettings();
        sendPets();
      },
    },
    {
      label: "開啟時自動登入並繼續冒險",
      type: "checkbox",
      checked: settings.autoContinue,
      click: (item) => {
        settings.autoContinue = item.checked;
        saveSettings();
      },
    },
    // 開機自動啟動只有安裝版有意義（開發版登記的會是 electron.exe 本身）
    ...(app.isPackaged
      ? [{ label: "開機自動啟動", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
          click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) }]
      : []),
    { label: many ? `重新載入第 ${petIndex + 1} 隻的遊戲` : "重新載入遊戲", click: () => g && loadGame(g) },
    { label: "操作說明", click: openHelp },
    updates.checkItem(),
    { type: "separator" },
    { label: "結束", click: () => app.quit() },
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
  title: settings.petCount > 1 ? `選擇桌寵外觀（第 ${pickerTarget + 1} 隻）` : "選擇桌寵外觀",
}));
ipcMain.on("picker:choose", (_e, model) => {
  const models = Array.from({ length: MAX_PETS }, (_, i) => settings.petModels[i] ?? null);
  models[pickerTarget] = spriteDef(model) ? model : null;
  settings.petModels = models;
  saveSettings();
  sendPets();
});
// 拉條拖動的過程一直送過來，桌寵馬上跟著變；放開（save）才寫進設定檔
ipcMain.on("picker:color", (_e, color, save) => {
  const colors = Array.from({ length: MAX_PETS }, (_, i) => settings.petColors[i] ?? null);
  colors[pickerTarget] = cleanColor(color);
  settings.petColors = colors;
  if (save) saveSettings();
  sendColors();
});
ipcMain.on("pet:toggle-game", (_e, index) => toggleGame(games[index]));
ipcMain.on("pet:menu", (_e, index) => popupMenu(index));

// 帳號管理視窗
ipcMain.handle("accounts:get", () => ({
  accounts: accounts.list(),
  petCount: settings.petCount,
  petAccounts: Array.from({ length: settings.petCount }, (_, i) => accountOf(i)),
  encrypted: accounts.canEncrypt(),
}));
ipcMain.handle("accounts:save", (_e, account) => {
  const r = accounts.save(account ?? {});
  // 改了正在用的帳號的密碼：那隻重新登入一次
  if (r.id && account?.password) games.filter((g) => g.accountId === r.id && g.login.state === "failed").forEach(loadGame);
  return r;
});
ipcMain.handle("accounts:remove", (_e, id) => {
  accounts.remove(id);
  settings.petAccounts.forEach((a, i) => a === id && i < settings.petCount && setPetAccount(i, null));
  return true;
});
ipcMain.on("accounts:assign", (_e, petIndex, id) => {
  if (petIndex >= 0 && petIndex < settings.petCount) setPetAccount(petIndex, id && accounts.find(id) ? id : null);
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
  if (type === "town") return { place: names.towns[id] ?? "村莊", doing: "休息中" };
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
  pets: income.summary(settings.petCount, games.map(accountLabel)).map((p, i) => ({ ...p, here: games[i]?.lastState?.place === "標題畫面" ? null : games[i]?.lastRaw?.loc ?? null })),
  classes: Object.fromEntries(Object.entries(names.classes).map(([k, c]) => [k, c.name])),
}));

// ── 啟動 ──────────────────────────────────────────────────

async function createTray() {
  try {
    const icon = nativeImage.createFromBuffer(await cachedBytes("images/icon-192.png")).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    tray.setToolTip("黑暗大陸桌寵");
    tray.on("click", () => toggleGame());
    tray.on("right-click", () => tray.popUpContextMenu(buildMenu()));
  } catch (e) {
    console.error("系統匣圖示建立失敗（不影響使用）：", e.message);
  }
}

app.whenReady().then(async () => {
  loadSettings();
  accounts.load();
  income.start(app.getPath("userData")); // 收入總覽每次啟動從頭記，蓋掉上一次的
  createPetWindow();
  syncGames();
  createTray();
  if (!globalShortcut.register(TOGGLE_KEY, () => toggleGame())) console.error(`快捷鍵 ${TOGGLE_KEY} 被別的程式佔用了`);
  if (!globalShortcut.register(CLICK_THROUGH_KEY, toggleClickThrough)) console.error(`快捷鍵 ${CLICK_THROUGH_KEY} 被別的程式佔用了`);
  // 第一次開：先告訴使用者怎麼操作（之後從右鍵選單「操作說明」再看）
  if (!settings.helpSeen && !SELFTEST) {
    openHelp();
    settings.helpSeen = true;
    saveSettings();
  }
  setInterval(() => games.forEach(pollGame), POLL_MS);
  updates.start({ notify: say, floater: (text) => petWin?.webContents.send("pet:notice", 0, text), gameUrl: GAME_URL,
    loadedGameVersions: () => games.map((g) => g.version), reloadGames: () => games.forEach(loadGame) });
  // 走到這裡代表視窗都開好了：告訴外殼這份內容是能跑的（新下載的內容靠這個通過試用，不然會被退回上一份）
  global.petShell?.markHealthy();
  if (SELFTEST) require("./selftest").run({ games, petWin, inGame, diffEvents, buildMenu, openPicker, getPicker: () => pickerWin, openHelp, getHelp: () => helpWin,
    openAccounts, getAccountsWin: () => accountsWin, accounts, setPetCount, setPetAccount, setStay, settings: () => settings, updates, say, setClickThrough,
    income, totalExp, summarize, sendPets, openIncome, getIncomeWin: () => incomeWin, setPowerSave, showGame,
    quit: () => app.quit() });
});

app.on("before-quit", () => (quitting = true));
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
