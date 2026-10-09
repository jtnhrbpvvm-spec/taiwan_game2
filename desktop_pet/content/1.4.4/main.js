// 放置希望桌寵：遊戲本體在一個藏起來的視窗裡照常掛機，桌面上只留一隻會走動的角色。
//
// 兩個視窗：
//   gameWin = 官方遊戲網頁，平常不顯示；Ctrl+Alt+H（或對桌寵點兩下）叫出來操作，再按一次藏回去
//   petWin  = 貼在工作區底部的透明長條，上面畫桌寵；滑鼠不在桌寵身上時整條都是穿透的
const { app, BrowserWindow, Menu, Notification, Tray, dialog, globalShortcut, ipcMain, nativeImage, net, powerMonitor, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");
// 外殼（boot.js）提供的功能：自動更新、回報這份內容能正常跑
const petShell = global.petShell;
const mall = require("./mall");
const income = require("./income");
const gm = require("./gm");

const GAME_URL = "https://idle-seal.pp771007.workers.dev/";
// 同網域的純文字檔。要動 localStorage／sessionStorage 時先開這個，不要開遊戲本身：
// 遊戲一開就會佔住「這個分頁正在玩」的鎖，接著重新整理會被自己擋在「另一個分頁正在玩」。
const STORAGE_URL = GAME_URL + "manifest.webmanifest";
const SAVE_KEY = "idle-seal.save";
const ENTER_KEY = "idle-seal.enter"; // 遊戲自己的「載入後直接進這個角色」記號（sessionStorage）
const TAB_LOCK_KEY = "idle-seal.tab";
const TOGGLE_KEY = "Control+Alt+H";
const CLICK_THROUGH_KEY = "Control+Alt+P";
const MAX_LOOT_SHOWN = 4; // 一次存檔之間撿到很多種東西時，桌寵頭上最多冒幾個
const POLL_MS = 3000;
const PET_STRIP_HEIGHT = 320; // 要放得下拉到最大的桌寵＋頭上的提示框
const DEFAULT_MODEL = "t_by"; // 咕咕
const MAX_PETS = 10; // 桌面上最多同時幾隻桌寵
const SELFTEST = process.argv.includes("--selftest");

// 遊戲的 session 物件（這次掛機的收支累計、目前位置都在裡面）沒有掛在 window 上，要從 Vue 的元件樹裡找：
// 幾乎每個畫面元件都有 props.session。做法跟書籤工具 loader.js 的 findGameRefs 一樣。
// 這段是要塞進遊戲頁面執行的程式碼片段，會定義一個 findSession()。
const FIND_SESSION = `
  const findSession = () => {
    let root = document.getElementById("app");
    if (!root?._vnode) root = [...document.querySelectorAll("*")].find((el) => el._vnode);
    let found;
    const walk = (vnode) => {
      if (!vnode || found) return;
      if (vnode.component) {
        const session = vnode.component.props?.session;
        if (session && typeof session.enhance === "function") found = session;
        else walk(vnode.component.subTree);
      } else if (Array.isArray(vnode.children)) vnode.children.forEach(walk);
    };
    walk(root?._vnode?.component?.subTree);
    return found;
  };`;

// 視窗被蓋住／藏起來時 Chromium 會把分頁當成背景分頁放慢計時器，掛機會變慢，全部關掉
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");



let gameWin;
let petWin;
let tray;
let quitting = false;
let pendingSave; // 等下一次 bootGame 寫進去的存檔文字
// 從遊戲資料檔整理出來的對照表，全部是 id → 需要的那幾個欄位
const game = { monster: new Map(), map: new Map(), town: new Map(), dungeon: new Map(), item: new Map(), battlePets: [], iconIndex: {}, iconAtlas: undefined };
let lastState;
let lastRaw; // 上一次讀到的存檔摘要，用來比出「這段時間多了什麼」
let lastDamage; // 上一次讀到的累計傷害 { id, total }
let clickThrough = false; // 專注模式：桌寵完全不吃滑鼠
let helpWin;
let incomeWin;
let savesWin;
let mapInfoWin;
let pickerWin;
let pickerTarget = 0; // 選外觀視窗現在是在幫第幾隻桌寵挑
// 使用者設定。petCount＝桌面上幾隻桌寵（都顧同一個角色，只是熱鬧）；
// petModels[i]＝第 i 隻自己選的外觀，沒選（null）就跟著目前在打的怪物
let settings = { petCount: 1, petModels: [], helpSeen: false, mallReminder: true, gmReminder: true, stayPut: false, bookmarkTool: true,
  // 專注模式下桌寵頭上還要飄哪些字。預設全關，專注模式就是完全安靜
  focusShow: { damage: false, exp: false, loot: false } };
let mallFormulaOk = true; // 黑店匯率公式跟遊戲畫面對不上時變 false，之後不再提醒
let lastMallKey; // 上一次講過黑店提醒的那個小時
let lastGmKey; // 上一次講過的線上GM提醒（快出現／出現中，各只講一次）
const settingsFile = () => path.join(app.getPath("userData"), "pet-settings.json");

function loadSettings() {
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
    settings = { ...settings, ...saved, focusShow: { ...settings.focusShow, ...saved.focusShow } };
    // 1.4.3 以前只有一隻，外觀記在 petModel
    if (!Array.isArray(settings.petModels)) settings.petModels = [];
    if (saved.petModel && !saved.petModels) settings.petModels = [saved.petModel];
    delete settings.petModel;
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
// 桌寵已經在跑的時候再點一次捷徑：當成「救回來」的按鈕，把桌寵叫出來、解除專注模式、打開遊戲視窗
app.on("second-instance", () => {
  restorePet();
  showGame(true);
});

// ── 遊戲視窗 ──────────────────────────────────────────────

function createGameWindow() {
  gameWin = new BrowserWindow({
    width: 440,
    height: 820,
    show: false,
    title: "放置希望",
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      preload: path.join(__dirname, "game-preload.js"),
    },
  });
  gameWin.webContents.setAudioMuted(true);
  // 關視窗＝藏起來，遊戲繼續跑；真的要關從桌寵右鍵或系統匣「結束」
  gameWin.on("close", (e) => {
    if (quitting) return;
    e.preventDefault();
    showGame(false);
  });
  gameWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
}

function showGame(on) {
  if (!gameWin) return;
  if (on) gameWin.show();
  else gameWin.hide();
  // 遊戲以為自己一直看得見（見 game-preload.js），藏起來時背景音樂不會自己停，這裡幫它靜音
  gameWin.webContents.setAudioMuted(!on);
}

const toggleGame = () => showGame(!gameWin.isVisible());

const inGame = (code) => gameWin.webContents.executeJavaScript(code).catch(() => undefined);

/** 載入遊戲並直接進上次玩的角色。有 pendingSave 的話先把它寫進去。 */
async function bootGame() {
  const wc = gameWin.webContents;
  await gameWin.loadURL(STORAGE_URL);
  const hasSave = await wc.executeJavaScript(`(() => {
    const incoming = ${JSON.stringify(pendingSave ?? null)};
    if (incoming !== null) localStorage.setItem(${JSON.stringify(SAVE_KEY)}, incoming);
    localStorage.removeItem(${JSON.stringify(TAB_LOCK_KEY)});
    try {
      const id = JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)})).lastPlayedId;
      if (id) sessionStorage.setItem(${JSON.stringify(ENTER_KEY)}, id);
      return true;
    } catch { return false; }
  })()`);
  pendingSave = undefined;
  lastRaw = undefined;
  income.rebaseline();
  await gameWin.loadURL(GAME_URL);
  if (!hasSave) showGame(true); // 還沒有存檔：把遊戲叫出來讓使用者自己建角色或匯入
}

const GAME_RETRY_MS = 30000;
let gameRetryTimer;
let gameLoadFailures = 0; // 連續失敗幾次。第一次失敗清完快取馬上再試，之後才慢慢等

/**
 * 載入遊戲，失敗（沒網路、遊戲站暫時連不上）就每隔一段時間再試，直到成功。
 * 啟動跟睡眠醒來都用這個：載入失敗不該讓桌寵其他功能跟著停擺。
 */
async function loadGame() {
  clearTimeout(gameRetryTimer);
  try {
    await bootGame();
  } catch (e) {
    console.error(`遊戲載入失敗，${GAME_RETRY_MS / 1000} 秒後再試：`, e.message);
    // 上次不正常結束（當機、斷電、被強制關閉）有可能把遊戲的離線快取弄壞，之後每次載入都失敗。
    // 把快取清掉讓它重新下載；存檔在 localStorage，不在清除範圍內
    await gameWin.webContents.session.clearStorageData({ storages: ["serviceworkers", "cachestorage"] }).catch(() => {});
    gameRetryTimer = setTimeout(loadGame, gameLoadFailures++ === 0 ? 1000 : GAME_RETRY_MS);
    return;
  }
  if (gameLoadFailures > 0) console.log("遊戲重新載入成功");
  gameLoadFailures = 0;
}

// ── 存檔管理：匯出、匯入、轉移碼 ──────────────────────────
// 匯入一律分兩步：先把要匯入的內容讀進來給使用者看（哪些角色），確認了才真的蓋掉。

// 轉移碼跟遊戲內建的是同一套，兩邊產生的碼可以互通：把存檔暫存到 Litterbox（catbox.moe 的臨時檔案空間），
// 它回的檔名前六碼就是轉移碼，24 小時後自動消失。知道那六碼的人都讀得到，這點要讓使用者知道。
const LITTERBOX_UPLOAD = "https://litterbox.catbox.moe/resources/internals/api.php";
const LITTERBOX_FILES = "https://litter.catbox.moe/";

let pendingImport; // 讀進來、等使用者確認的存檔文字

const readSave = () => inGame(`localStorage.getItem(${JSON.stringify(SAVE_KEY)})`);

/** 檢查是不是放置希望的存檔，是的話記成待確認，回傳要給使用者看的摘要。 */
async function stageImport(text, from) {
  let characters;
  try {
    characters = JSON.parse(text).characters;
  } catch {}
  if (!Array.isArray(characters)) return { error: "這不是放置希望的存檔。" };
  pendingImport = text;
  return {
    from,
    characters: characters.map((c) => `Lv.${c.level ?? "?"} ${c.name ?? "（沒有名字）"}`),
    willOverwrite: (await readSave()) != null,
  };
}

async function exportSaveToFile() {
  const text = await readSave();
  if (text == null) return { error: "桌寵裡還沒有存檔可以匯出。" };
  const picked = await dialog.showSaveDialog(savesWin, {
    title: "匯出存檔",
    defaultPath: path.join(app.getPath("downloads"), `idle-seal-save-${new Date().toISOString().slice(0, 10)}.json`),
    filters: [{ name: "存檔", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };
  try {
    fs.writeFileSync(picked.filePath, text);
    return { path: picked.filePath };
  } catch (e) {
    return { error: `寫不進去：${e.message}` };
  }
}

async function pickImportFile() {
  const picked = await dialog.showOpenDialog(savesWin, {
    title: "選擇遊戲匯出的存檔",
    defaultPath: app.getPath("downloads"),
    filters: [{ name: "存檔", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (picked.canceled) return { canceled: true };
  try {
    return await stageImport(fs.readFileSync(picked.filePaths[0], "utf8"), path.basename(picked.filePaths[0]));
  } catch (e) {
    return { error: `讀不到檔案：${e.message}` };
  }
}

async function makeTransferCode() {
  const text = await readSave();
  if (text == null) return { error: "桌寵裡還沒有存檔可以轉移。" };
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("time", "24h");
    form.append("fileToUpload", new Blob([text], { type: "application/json" }), "save.json");
    const res = await net.fetch(LITTERBOX_UPLOAD, { method: "POST", body: form });
    if (!res.ok) return { error: `外部空間收不下（HTTP ${res.status}），改用「匯出成檔案」。` };
    const code = (await res.text()).trim().toLowerCase().match(/([a-z0-9]{6})(?:\.[a-z0-9]+)?$/)?.[1];
    return code ? { code } : { error: "外部空間回了看不懂的東西，改用「匯出成檔案」。" };
  } catch {
    return { error: "連不到外部空間，改用「匯出成檔案」。" };
  }
}

async function fetchTransferCode(input) {
  // 貼整個網址或檔名進來也行，取最後那六碼
  const code = String(input).trim().toLowerCase().match(/([a-z0-9]{6})(?:\.[a-z0-9]+)?$/)?.[1];
  if (!code || !/^[a-z0-9]{6}$/.test(code)) return { error: "轉移碼是六個英數字。" };
  try {
    const res = await net.fetch(`${LITTERBOX_FILES}${code}.json`);
    if (res.status === 404) return { error: "轉移碼只有 24 小時有效，過期或打錯了，回原本那台再產生一個。" };
    if (!res.ok) return { error: `外部空間現在回不了（HTTP ${res.status}），等一下再試。` };
    return await stageImport(await res.text(), `轉移碼 ${code}`);
  } catch {
    return { error: "連不到外部空間，換個網路再試一次。" };
  }
}

async function confirmImport() {
  if (pendingImport === undefined) return { error: "沒有等待匯入的存檔。" };
  pendingSave = pendingImport;
  pendingImport = undefined;
  await bootGame();
  return { done: true };
}

ipcMain.handle("saves:export", exportSaveToFile);
ipcMain.handle("saves:pick-file", pickImportFile);
ipcMain.handle("saves:make-code", makeTransferCode);
ipcMain.handle("saves:fetch-code", (_e, code) => fetchTransferCode(code));
ipcMain.handle("saves:confirm-import", confirmImport);
ipcMain.on("saves:cancel-import", () => (pendingImport = undefined));

function openSaves() {
  savesWin = openPanel(savesWin, "saves.html", {
    width: 460,
    height: 700,
    title: "存檔管理",
    webPreferences: { preload: path.join(__dirname, "saves-preload.js") },
  });
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
  petWin.setIgnoreMouseEvents(true, { forward: true });
  petWin.loadFile(path.join(__dirname, "pet", "index.html"));
  petWin.webContents.on("did-finish-load", () => {
    sendPets();
    petWin.webContents.send("pet:stay", settings.stayPut);
    petWin.webContents.send("pet:focus-show", settings.focusShow);
    if (lastState) petWin.webContents.send("pet:state", lastState);
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
}

/** 桌寵被藏起來或開著專注模式時，一律恢復成看得到、點得到。 */
function restorePet() {
  if (!petWin.isVisible()) petWin.showInactive();
  if (clickThrough) setClickThrough(false);
}

/** 專注模式的快捷鍵。桌寵被藏起來時按它是先把桌寵叫回來，不然會變成怎麼按都看不到效果。 */
function toggleClickThrough() {
  if (!petWin.isVisible()) restorePet();
  else setClickThrough(!clickThrough);
}

/** 大小是全部桌寵共用的；拉條開在被按右鍵的那一隻頭上。 */
function openSizer(petIndex = 0) {
  // 拉條要用滑鼠操作，專注模式開著的話先關掉；桌寵被藏起來的話先叫出來
  if (clickThrough) setClickThrough(false);
  if (!petWin.isVisible()) petWin.showInactive();
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
  helpWin = openPanel(helpWin, "help.html", { width: 460, height: 620, title: "放置希望桌寵・操作說明" });
}

/** tab："hours"＝每小時明細，"items"＝這段時間拿到的東西。 */
function openIncome(tab = "hours") {
  const alreadyOpen = incomeWin && !incomeWin.isDestroyed();
  incomeWin = openPanel(incomeWin, "income.html", {
    width: 760,
    height: 560,
    resizable: true,
    title: "每小時收益",
    webPreferences: { preload: path.join(__dirname, "income-preload.js") },
  });
  if (alreadyOpen) incomeWin.webContents.send("income:tab", tab);
  else incomeWin.webContents.once("did-finish-load", () => incomeWin.webContents.send("income:tab", tab));
}

/**
 * 查得到名稱跟圖示的一般物品才回傳。箱子、石頭那一類不在物品資料／物品圖集裡，
 * 顯示出來只會是沒名字、沒圖的一列，所以清單跟飄字都直接略過。
 */
function knownItem(itemId) {
  const item = game.item.get(Number(itemId));
  const icon = game.iconIndex[item?.icon];
  return item && icon !== undefined ? { name: item.name, icon, sell: item.sell } : undefined;
}

/** 把收益紀錄裡的物品 id 換成名稱、圖示、單價，照價值高到低排好，給明細視窗用。 */
function describeItems(items) {
  return Object.entries(items)
    .flatMap(([itemId, { got, sold }]) => {
      const item = knownItem(itemId);
      return item ? [{ ...item, got, sold }] : [];
    })
    .sort((a, b) => b.sell * b.got - a.sell * a.got || b.got - a.got || a.name.localeCompare(b.name, "zh-Hant"));
}

function incomeDetail() {
  const s = income.summary();
  return {
    ...s,
    hours: s.hours.map((h) => ({ ...h, items: describeItems(h.items) })),
    total: { ...s.total, items: describeItems(s.total.items) },
    current: undefined,
  };
}

// ── 書籤工具 ──────────────────────────────────────────────
// 把書籤工具（loader.js）載進遊戲視窗，做的事跟玩家在瀏覽器點那顆書籤完全一樣：
// 鑲嵌石畫面多出「🧮 試算」「🎯 自動洗」和「次數用完自動 +50」，另外還有一鍵強化、自動煉金等書籤工具原本的功能。
// 直接載線上那一份而不是抄一份進桌寵，這樣書籤工具更新，桌寵這邊重新載入遊戲就會跟著更新。
const BOOKMARK_TOOL_URL = "https://jtnhrbpvvm-spec.github.io/taiwan_game2/%E5%B8%8C%E6%9C%9B/loader.js";
const BOOKMARK_RETRY_MS = 60000;

// 書籤工具要等進了角色（找得到 session）才能載，不然它會跳「找不到 session」的警告；
// 遊戲重新載入或換角色後 session 是新的，要再載一次（跟玩家再點一次書籤一樣）。載入失敗隔一陣子再試。
const LOAD_BOOKMARK_TOOL = `(() => {
  ${FIND_SESSION}
  const session = findSession();
  if (!session || window.__petToolSession === session || Date.now() < (window.__petToolRetryAt ?? 0)) return false;
  window.__petToolSession = session;
  import(${JSON.stringify(BOOKMARK_TOOL_URL)} + "?v=" + Date.now()).catch((e) => {
    console.error("書籤工具載入失敗", e);
    window.__petToolSession = undefined;
    window.__petToolRetryAt = Date.now() + ${BOOKMARK_RETRY_MS};
  });
  return true;
})()`;

// ── 目前地圖資訊 ──────────────────────────────────────────
// 跟書籤工具的「📊 掉落查詢」是同一個功能：讀角色目前的等級、是不是鐵匠系、〔乞討〕等級、所在地圖、正在打的怪，
// 帶在網址參數上打開掉落查詢網站，網站就會直接顯示這張地圖的資料。

const DROP_SITE_URL = "https://jtnhrbpvvm-spec.github.io/taiwan_game2/%E5%B8%8C%E6%9C%9B/%E5%B8%8C%E6%9C%9B%E7%89%A9%E5%93%81%E6%9F%A5%E8%A9%A2.html";

// 在遊戲頁面裡組出網址參數，判斷方式照抄書籤工具的 dropQueryUrl()：
//   鐵匠系＝一轉是鐵匠、而且二轉不是爆破士（跟遊戲 dropMultiplier() 一樣，這種角色不受等級差衰減）
//   〔乞討〕是技能 230，每級掉落率 +3%
//   在副本裡帶副本編號；野外狩獵帶正在打的怪；村莊、釣魚只帶地圖
const READ_MAP_QUERY = `(() => {
  ${FIND_SESSION}
  const session = findSession();
  if (!session) return null;
  const params = ["from=game"];
  const read = [];
  const p = session.player;
  if (typeof p?.level === "number") { params.push("lv=" + p.level); read.push("Lv" + p.level); }
  try {
    if (session.isBlacksmith && session.secondJob?.id !== "bomber") { params.push("smith=1"); read.push("鐵匠系"); }
  } catch {}
  try {
    const beg = session.skills?.get?.(230) || 0;
    if (beg > 0) { params.push("beg=" + beg); read.push("乞討Lv" + beg); }
  } catch {}
  let mapId;
  try { mapId = session.currentMapId; } catch {}
  if (typeof mapId !== "number") mapId = session.snapshot?.value?.mapId;
  if (typeof mapId === "number") {
    params.push("map=" + mapId);
    read.push(session.data?.mapById?.get(mapId)?.name ?? "地圖 #" + mapId);
  }
  try {
    const run = session.dungeon?.run;
    const target = session.placement?.target;
    if (typeof run?.dungeonId === "number") {
      params.push("dg=" + run.dungeonId);
      read.push("副本 " + (session.data?.dungeonById?.get(run.dungeonId)?.name ?? "#" + run.dungeonId));
    } else if (session.onHuntingGround && typeof target?.id === "number") {
      params.push("mon=" + target.id);
      read.push("打 " + (session.data?.monsterById?.get(target.id)?.name ?? target.name ?? "怪物"));
    }
  } catch {}
  return { query: params.join("&"), read: read.join("・"), hasMap: typeof mapId === "number" };
})()`;

/** 選單每按一次就照角色現在的位置重新讀一次；視窗已經開著的話直接換成新位置的資料。 */
async function openMapInfo() {
  const info = await inGame(READ_MAP_QUERY);
  if (!info?.hasMap) {
    say("還讀不到角色的位置，先進遊戲選好角色再試一次");
    return;
  }
  if (!mapInfoWin || mapInfoWin.isDestroyed()) {
    mapInfoWin = new BrowserWindow({ width: 1100, height: 820, autoHideMenuBar: true, title: "目前地圖資訊" });
    mapInfoWin.removeMenu();
    // 網站自己會改 <title>，蓋回來才看得到這次讀到的是哪裡
    mapInfoWin.on("page-title-updated", (e) => e.preventDefault());
    mapInfoWin.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/.test(url)) shell.openExternal(url);
      return { action: "deny" };
    });
  }
  mapInfoWin.setTitle(`目前地圖資訊　${info.read}`);
  mapInfoWin.loadURL(`${DROP_SITE_URL}?${info.query}`);
  mapInfoWin.show();
  mapInfoWin.focus();
  return info;
}

/** 選單項目前面的小色點：綠＝收入、紅＝支出（Windows 的選單沒辦法把字變色，用這個代替）。 */
function dot(r, g, b) {
  const size = 12;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - 5.5, y - 5.5) > 4.6) continue;
      pixels.set([b, g, r, 255], (y * size + x) * 4);
    }
  }
  return nativeImage.createFromBitmap(pixels, { width: size, height: size });
}
const GREEN_DOT = dot(46, 125, 50);
const RED_DOT = dot(192, 57, 43);

/** 右鍵選單裡的「每小時收益」：直接列出這個小時到目前為止的五項數字。 */
function incomeMenu() {
  const s = income.summary();
  const h = s.current;
  const num = (n) => Math.round(n).toLocaleString("zh-TW");
  const hourLabel = (ms) => `${String(new Date(ms).getHours()).padStart(2, "0")}:00`;
  const line = (label, value, icon, sign = "") => ({ label: `${label}　${value ? sign : ""}${num(value)}`, icon, enabled: false });
  const lines = h
    ? [
        { label: `${hourLabel(h.start)}～${hourLabel(h.start + 36e5)}（這個小時到目前為止）`, enabled: false },
        line("打怪收入", h.hunt, GREEN_DOT),
        line("自動販售收入", h.sales, GREEN_DOT),
        line("自動喝水支出", h.potions, RED_DOT, "−"),
        line("寵物支出", h.pets, RED_DOT, "−"),
        line("雜項支出", h.misc, RED_DOT, "−"),
        { type: "separator" },
        { label: `淨收入　${h.net > 0 ? "+" : h.net < 0 ? "−" : ""}${num(Math.abs(h.net))}`, enabled: false },
        { label: `平均每小時淨收入　${s.average.net < 0 ? "−" : ""}${num(Math.abs(s.average.net))}`, enabled: false },
      ]
    : [{ label: "還沒有資料（角色出發掛機後才會開始記）", enabled: false }];
  return {
    label: "每小時收益",
    submenu: [
      ...lines,
      { type: "separator" },
      { label: "查看每小時明細…", click: () => openIncome("hours") },
      { label: "這段時間拿到的東西…", click: () => openIncome("items") },
    ],
  };
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
 * 使用者幫那一隻選的優先，沒選就跟著目前蹲點在打的那隻怪。
 */
function resolveModels() {
  const following = game.monster.get(lastRaw?.targetId)?.model ?? DEFAULT_MODEL;
  return Array.from({ length: settings.petCount }, (_, i) => settings.petModels[i] ?? following);
}

const sendPets = () => petWin?.webContents.send("pet:pets", resolveModels());

function setPetCount(count) {
  settings.petCount = count;
  saveSettings();
  sendPets();
  // 正在幫牠挑外觀的那一隻被收掉了，視窗跟著關
  if (pickerTarget >= count && pickerWin && !pickerWin.isDestroyed()) pickerWin.close();
}

/**
 * 選外觀視窗的清單：同一張動畫表只列一次（很多怪共用同一張，例如各種前綴的咕咕），
 * 其他共用的名字放進 search 讓搜尋找得到。
 */
function pickerEntries() {
  const byModel = new Map();
  const add = (model, name, group) => {
    if (!model) return;
    const entry = byModel.get(model);
    if (!entry) byModel.set(model, { model, name, group, search: name });
    else {
      entry.search += ` ${name}`;
      // 有前綴的（[幼幼的]咕咕）讓位給沒前綴的本名
      if (entry.name.startsWith("[") && !name.startsWith("[")) entry.name = name;
    }
  };
  for (const kind of game.battlePets) kind.models.forEach((model, i) => add(model, `${kind.name}・${kind.stages[i] ?? ""}`, "戰寵"));
  for (const m of game.monster.values()) add(m.model, m.name, "怪物");
  return [...byModel.values()];
}

const SAY_GAP_MS = 15500; // 一句話在桌寵頭上停 15 秒，下一句等它消失再講
const sayQueue = [];
let sayBusy = false;

function sayNext() {
  const text = sayQueue.shift();
  if (text === undefined) {
    sayBusy = false;
    return;
  }
  sayBusy = true;
  // 桌寵被藏起來的話改用系統通知，不然提醒就白講了
  if (petWin?.isVisible()) petWin.webContents.send("pet:say", text);
  else if (Notification.isSupported()) new Notification({ title: "放置希望桌寵", body: text }).show();
  setTimeout(sayNext, SAY_GAP_MS);
}

/** 桌寵開口說一句話。同時有好幾句要講（例如整點時黑店跟線上GM都要提醒）就排隊一句一句來，不會互相蓋掉。 */
function say(text) {
  sayQueue.push(text);
  if (!sayBusy) sayNext();
}

let askSeq = 0;
const askWaiting = new Map(); // 問題編號 → 收到回答時要呼叫的函式

/**
 * 桌寵問一個是非題，頭上跳出帶兩顆按鈕的對話框。回傳 Promise<boolean>；一段時間沒人理就當作「不要」。
 * 桌寵被使用者藏起來的時候不硬叫出來，直接當作「不要」。
 */
function ask(text, yes, no) {
  if (!petWin?.isVisible()) return Promise.resolve(false);
  return new Promise((resolve) => {
    const id = ++askSeq;
    askWaiting.set(id, resolve);
    petWin.webContents.send("pet:ask", { id, text, yes, no });
  });
}
ipcMain.on("pet:answer", (_e, { id, ok }) => {
  askWaiting.get(id)?.(!!ok);
  askWaiting.delete(id);
});

/** 黑店優惠提醒：優惠前 3 小時起每個整點講一次今天幾點優惠，同一個小時只講一次。 */
function mallTick() {
  if (!settings.mallReminder || !mallFormulaOk) return;
  const r = mall.reminder();
  if (!r || r.key === lastMallKey) return;
  lastMallKey = r.key;
  say(r.text);
}

/**
 * 線上GM提醒：出現前一小時講一次、出現的那一小時講一次（這次已經跟他擲過就不講）。
 * 他的出現時間都在整點，所以跟黑店共用整點的檢查。
 */
function gmTick() {
  if (!settings.gmReminder) return;
  const r = gm.reminder(Date.now(), lastRaw?.gmDuelWindow);
  if (!r || r.key === lastGmKey) return;
  lastGmKey = r.key;
  say(r.text);
}

/** 每個整點（多等 2 秒，確定已經跨過去）檢查一次。 */
function scheduleHourlyTick() {
  setTimeout(() => {
    mallTick();
    gmTick();
    scheduleHourlyTick();
  }, mall.msToNextHour() + 2000);
}

/** 使用者剛好開著黑店面板時，拿畫面上的匯率跟公式對帳；對不上代表遊戲改了算法，提醒會報錯時段，直接關掉。 */
function checkMallFormula(shownRate) {
  if (!mallFormulaOk || !Number.isFinite(shownRate)) return;
  if (shownRate === mall.rate(mall.periodOf(new Date()))) return;
  mallFormulaOk = false;
  console.error(`黑店匯率公式跟遊戲對不上（遊戲顯示 ${shownRate}），提醒先關掉`);
}

/** 專注模式子選單裡的一個勾選項：專注模式下要不要顯示這一類飄字。 */
function focusShowItem(key, label) {
  return {
    label,
    type: "checkbox",
    checked: !!settings.focusShow[key],
    click: (item) => {
      settings.focusShow = { ...settings.focusShow, [key]: item.checked };
      saveSettings();
      petWin.webContents.send("pet:focus-show", settings.focusShow);
    },
  };
}

/** petIndex＝這次是對第幾隻桌寵按的右鍵（從系統匣開的話當作第一隻）。 */
function buildMenu(petIndex = 0) {
  if (!(petIndex >= 0 && petIndex < settings.petCount)) petIndex = 0;
  const many = settings.petCount > 1;
  return Menu.buildFromTemplate([
    { label: gameWin.isVisible() ? "隱藏遊戲視窗" : "顯示遊戲視窗", accelerator: TOGGLE_KEY, click: toggleGame },
    { type: "separator" },
    {
      label: "專注模式",
      submenu: [
        { label: "開啟專注模式（桌寵不擋滑鼠）", type: "checkbox", checked: clickThrough, accelerator: CLICK_THROUGH_KEY, click: toggleClickThrough },
        { type: "separator" },
        { label: "專注模式下，桌寵頭上還要顯示（可複選）：", enabled: false },
        focusShowItem("damage", "顯示傷害"),
        focusShowItem("exp", "顯示經驗值"),
        focusShowItem("loot", "顯示物品取得"),
      ],
    },
    { label: "顯示桌寵", type: "checkbox", checked: petWin.isVisible(), click: () => (petWin.isVisible() ? petWin.hide() : petWin.showInactive()) },
    {
      label: "原地不走動",
      type: "checkbox",
      checked: settings.stayPut,
      click: (item) => {
        settings.stayPut = item.checked;
        saveSettings();
        petWin.webContents.send("pet:stay", settings.stayPut);
      },
    },
    {
      label: "桌寵數量",
      submenu: Array.from({ length: MAX_PETS }, (_, i) => ({
        label: `${i + 1} 隻`,
        type: "radio",
        checked: settings.petCount === i + 1,
        click: () => setPetCount(i + 1),
      })),
    },
    incomeMenu(),
    { label: "目前地圖資訊…", click: openMapInfo },
    { type: "separator" },
    {
      label: "書籤工具（鑲嵌石試算、自動洗…）",
      type: "checkbox",
      checked: settings.bookmarkTool,
      click: (item) => {
        settings.bookmarkTool = item.checked;
        saveSettings();
        // 關掉的話要重新載入遊戲，才能把已經載進去的書籤工具拿掉；打開則下一次讀狀態時就會載
        if (!item.checked) loadGame();
      },
    },
    { label: many ? "調整大小…（全部一起）" : "調整大小…", click: () => openSizer(petIndex) },
    { label: many ? `選擇這隻桌寵的外觀…（第 ${petIndex + 1} 隻）` : "選擇桌寵外觀…", click: () => openPicker(petIndex) },
    {
      label: mallFormulaOk ? "黑店優惠提醒" : "黑店優惠提醒（遊戲改版，暫時停用）",
      type: "checkbox",
      checked: settings.mallReminder && mallFormulaOk,
      enabled: mallFormulaOk,
      click: (item) => {
        settings.mallReminder = item.checked;
        saveSettings();
        lastMallKey = undefined; // 重新打開時，正好在提醒時段就馬上講一次
        mallTick();
      },
    },
    {
      label: "線上GM提醒",
      type: "checkbox",
      checked: settings.gmReminder,
      click: (item) => {
        settings.gmReminder = item.checked;
        saveSettings();
        lastGmKey = undefined;
        gmTick();
      },
    },
    // 開機自動啟動只有安裝版有意義（開發版登記的會是 electron.exe 本身）
    ...(app.isPackaged
      ? [{ label: "開機自動啟動", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
          click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) }]
      : []),
    { type: "separator" },
    { label: "存檔管理…", click: openSaves },
    { label: "重新載入遊戲", click: loadGame },
    { label: "操作說明", click: openHelp },
    petShell.updates.menuItem(),
    { type: "separator" },
    { label: "結束", click: () => app.quit() },
  ]);
}

// ── 遊戲資料：動畫表、怪物對照 ──────────────────────────────

async function fetchBytes(relPath) {
  const res = await net.fetch(GAME_URL + relPath);
  if (!res.ok) throw new Error(`${relPath} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** 抓遊戲站上的檔案，存一份在本機；之後斷網也拿得到上次那份。 */
async function cachedBytes(relPath) {
  const file = path.join(app.getPath("userData"), "game-cache", relPath);
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

/** 載入桌寵用得到的遊戲資料。哪一份失敗就少那一塊功能（顯示不出名字／圖示），其他照常。 */
async function loadGameData() {
  const load = async (relPath, apply) => {
    try {
      apply(JSON.parse((await cachedBytes(relPath)).toString("utf8")));
    } catch (e) {
      console.error(`${relPath} 載入失敗：`, e.message);
    }
  };
  const byId = (list, pick) => new Map(list.map((x) => [x.id, pick(x)]));
  await Promise.all([
    load("data/monsters.json", (d) => (game.monster = byId(d.monsters, (m) => ({ name: m.name, model: m.model })))),
    load("data/battle-pets.json", (d) => (game.battlePets = d.kinds.map((k) => ({ name: k.name, models: k.models ?? [], stages: k.stages ?? [] })))),
    load("data/maps.json", (d) => (game.map = byId(d.maps, (m) => m.name))),
    load("data/towns.json", (d) => (game.town = byId(d.towns, (t) => t.name))),
    load("data/dungeons.json", (d) => (game.dungeon = byId(d.dungeons, (x) => x.name))),
    load("data/items.json", (d) => (game.item = byId(d.items, (i) => ({ name: i.name, icon: i.icon, sell: i.noSell ? 0 : i.sell ?? 0 })))),
    load("data/icons.json", (d) => {
      game.iconIndex = d.index;
      game.iconAtlas = { cell: d.cell, cols: d.cols };
    }),
  ]);
}

ipcMain.handle("pet:sprite", async (_e, model) => {
  if (!/^[\w-]+$/.test(model)) return null;
  try {
    const [meta, image] = await Promise.all([cachedBytes(`sprites/${model}.json`), cachedBytes(`sprites/${model}.webp`)]);
    return { meta: JSON.parse(meta.toString("utf8")), image };
  } catch (e) {
    console.error(`動畫表 ${model} 載入失敗：`, e.message);
    return null;
  }
});
// 物品圖示圖集：一張大圖切成 cell×cell 的格子，掉寶冒出來的小圖示從這裡切
ipcMain.handle("pet:item-atlas", async () => {
  if (!game.iconAtlas) return null;
  try {
    return { ...game.iconAtlas, image: await cachedBytes("icons/items.webp") };
  } catch (e) {
    console.error("物品圖示載入失敗：", e.message);
    return null;
  }
});
ipcMain.on("pet:interactive", (_e, on) => petWin?.setIgnoreMouseEvents(!on, { forward: true }));
ipcMain.handle("income:get", incomeDetail);
ipcMain.handle("picker:list", () => ({
  entries: pickerEntries(),
  current: settings.petModels[pickerTarget] ?? null,
  title: settings.petCount > 1 ? `選擇桌寵外觀（第 ${pickerTarget + 1} 隻）` : "選擇桌寵外觀",
}));
ipcMain.on("picker:choose", (_e, model) => {
  const models = Array.from({ length: MAX_PETS }, (_, i) => settings.petModels[i] ?? null);
  models[pickerTarget] = typeof model === "string" && /^[\w-]+$/.test(model) ? model : null;
  settings.petModels = models;
  saveSettings();
  sendPets();
});
ipcMain.on("pet:toggle-game", toggleGame);
ipcMain.on("pet:menu", (_e, index) => popupMenu(index));

// ── 讀遊戲狀態 ────────────────────────────────────────────

const READ_STATE = `(() => {
  ${FIND_SESSION}
  // 收支累計（欄位意義見 income.js）。遊戲改版找不到的話回傳 null，收益功能就停在那裡，其他照常
  const readIncome = () => {
    try {
      const session = findSession();
      const p = session?.player;
      if (!p || typeof p.goldFromSales !== "number") return null;
      const n = (v) => Number(v) || 0;
      let hunt = 0;
      for (const [itemId, count] of session.drops ?? []) {
        const item = session.data?.itemById?.get(itemId);
        if (item && !item.noSell) hunt += n(item.sell) * n(count);
      }
      // 遊戲只記「總共賣了幾件」，沒記賣的是什麼。所以在它每 10 秒一次的自動販售（sellSweep）前面插一手，
      // 把它準備賣的清單（plannedSales）記到 session.__petSold。遊戲重新載入後 session 是新的，要重掛一次。
      if (!session.__petSold && typeof session.sellSweep === "function" && typeof session.plannedSales === "function") {
        const sold = (session.__petSold = new Map());
        const sellSweep = session.sellSweep;
        session.sellSweep = function (...args) {
          session.__petSweeps = (session.__petSweeps ?? 0) + 1; // 自我測試用：確認這個掛勾真的有被遊戲呼叫到
          try {
            for (const sale of this.plannedSales()) sold.set(sale.itemId, (sold.get(sale.itemId) ?? 0) + sale.count);
          } catch {}
          return sellSweep.apply(this, args);
        };
      }
      return { hunt, sales: n(p.goldFromSales), potions: n(p.goldSpentOnPotions) + n(p.goldSpentOnApPotions),
        pets: n(p.goldSpentOnPets) + n(p.goldSpentOnBpetPotions), misc: n(p.goldSpentOnThrowables) + n(p.goldSpentOnHolyWater),
        drops: [...(session.drops ?? [])], sold: [...(session.__petSold ?? [])],
        // 這趟打出去的總傷害（自己＋戰寵＋隊友），桌寵「顯示傷害」用
        damage: [...(session.damageBy ?? [])].reduce((sum, [, dealt]) => sum + n(dealt), 0) };
    } catch { return null; }
  };
  try {
    const file = JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}));
    const c = file.characters.find((x) => x.id === file.lastPlayedId);
    if (!c) return null;
    const bag = {};
    for (const s of c.stacks ?? []) bag[s.itemId] = (bag[s.itemId] ?? 0) + (s.count ?? 1);
    return { id: c.id, name: c.name, level: c.level, exp: c.exp, gold: c.gold, elapsedMs: c.elapsedMs, savedAt: c.savedAt,
      inVillage: !!c.inVillage, townId: c.townId, mapId: c.spot?.mapId, targetId: c.spot?.targetId, gmDuelWindow: c.gmDuelWindow,
      fishingMapId: c.fishing?.mapId, dungeonId: c.dungeon?.run?.dungeonId, bag, hidden: document.hidden, income: readIncome(),
      // 黑店面板開著的時候畫面上的匯率（沒開就是 null），給黑店提醒對帳用
      mallRate: Number((document.querySelector(".mall > .rate")?.textContent.match(/\\d[\\d,]{4,}/)?.[0] ?? "").replace(/,/g, "")) || null };
  } catch { return null; }
})()`;

/** 角色現在人在哪、在做什麼（判斷順序跟遊戲自己的標題列一樣：副本 → 釣魚 → 村莊 → 野外）。 */
function describePlace(s) {
  if (s.dungeonId != null) return { place: game.dungeon.get(s.dungeonId) ?? "副本", doing: "副本中" };
  if (s.fishingMapId != null) return { place: game.map.get(s.fishingMapId) ?? "未知的地方", doing: "釣魚中" };
  if (s.inVillage) return { place: game.town.get(s.townId) ?? "村莊", doing: "休息中" };
  const target = game.monster.get(s.targetId)?.name;
  return { place: game.map.get(s.mapId) ?? "未知的地方", doing: target ? `打 ${target}` : "掛機中" };
}

/**
 * 比對前後兩次存檔，整理成桌寵要演出來的事件。
 * 遊戲大約 10 秒自動存一次，所以事件是一批一批來的，不是每一刀都有。
 */
function diffEvents(prev, next) {
  const events = [];
  if (next.level > prev.level) events.push({ kind: "levelup", level: next.level });
  else if (next.exp > prev.exp) events.push({ kind: "exp", n: next.exp - prev.exp });
  if (next.gold > prev.gold) events.push({ kind: "gold", n: next.gold - prev.gold });
  const loot = [];
  for (const [itemId, count] of Object.entries(next.bag)) {
    const gained = count - (prev.bag[itemId] ?? 0);
    if (gained <= 0) continue;
    const item = knownItem(itemId);
    if (item) loot.push({ kind: "loot", n: gained, name: item.name, icon: item.icon });
  }
  return events.concat(loot.slice(0, MAX_LOOT_SHOWN));
}

async function pollState() {
  const s = await inGame(READ_STATE);
  if (!s) return;
  // 換角色、匯入存檔之後第一筆只當基準，不然整個背包都會被當成「剛撿到」
  if (lastRaw && lastRaw.id === s.id && lastRaw.savedAt !== s.savedAt) {
    const events = diffEvents(lastRaw, s);
    if (events.length) petWin?.webContents.send("pet:events", events);
  }
  lastRaw = s;
  if (settings.bookmarkTool) inGame(LOAD_BOOKMARK_TOOL);
  if (s.mallRate) checkMallFormula(s.mallRate);
  if (s.income) {
    income.record(s.id, s.income);
    // 傷害是遊戲裡即時累計的，每次讀狀態（幾秒一次）都比得出差額，不用等 10 秒一次的存檔。
    // 變小＝重新出發、統計歸零了，那次不算
    const dealt = lastDamage?.id === s.id ? s.income.damage - lastDamage.total : 0;
    lastDamage = { id: s.id, total: s.income.damage };
    if (dealt > 0) petWin?.webContents.send("pet:events", [{ kind: "damage", n: dealt }]);
  }
  const { bag, mallRate, income: _income, ...rest } = s;
  lastState = { ...rest, ...describePlace(s) };
  petWin?.webContents.send("pet:state", lastState);
  sendPets();
}

// ── 啟動 ──────────────────────────────────────────────────

async function createTray() {
  try {
    const icon = nativeImage.createFromBuffer(await cachedBytes("pwa-icon-rabbit-192.png")).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    tray.setToolTip("放置希望桌寵");
    tray.on("click", toggleGame);
    tray.on("right-click", () => tray.popUpContextMenu(buildMenu()));
  } catch (e) {
    console.error("系統匣圖示建立失敗（不影響使用）：", e.message);
  }
}

app.whenReady().then(async () => {
  loadSettings();
  income.start(path.join(app.getPath("userData"), "income-log.json")); // 每次啟動從空白開始，蓋掉上一次的
  createGameWindow();
  createPetWindow();
  createTray();
  if (!globalShortcut.register(TOGGLE_KEY, toggleGame)) console.error(`快捷鍵 ${TOGGLE_KEY} 被別的程式佔用了`);
  if (!globalShortcut.register(CLICK_THROUGH_KEY, toggleClickThrough)) console.error(`快捷鍵 ${CLICK_THROUGH_KEY} 被別的程式佔用了`);
  // 第一次開：先告訴使用者怎麼操作（之後從右鍵選單「操作說明」再看）
  if (!settings.helpSeen && !SELFTEST) {
    openHelp();
    settings.helpSeen = true;
    saveSettings();
  }
  await Promise.all([loadGameData(), loadGame()]);
  setInterval(pollState, POLL_MS);
  // 電腦睡眠時計時器整個停掉，醒來後重新載入，讓遊戲照自己的離線規則把這段時間補回來
  powerMonitor.on("resume", loadGame);
  // 電腦睡著時整點的計時器不會響，醒來補檢查一次
  powerMonitor.on("resume", mallTick);
  powerMonitor.on("resume", gmTick);
  // 每次打開桌寵先報一次今天的黑店特價：已經在倒數時段裡（前 3 小時內）就直接講幾點，
  // 還早的話只講落在清晨／上午／下午／晚間哪一段。等桌寵畫出來再講，所以延後幾秒
  setTimeout(() => {
    if (settings.mallReminder && mallFormulaOk) {
      if (mall.reminder()) mallTick();
      else say(mall.dailyHint());
    }
    // 線上GM快出現或正在歡喜城的話也講一聲
    gmTick();
  }, 6000);
  scheduleHourlyTick();
  petShell.updates.start({ notify: (text) => petWin?.webContents.send("pet:notice", text), say, ask });
  // 走到這裡代表視窗都開好、遊戲也載入了：告訴外殼這份內容是能跑的（新下載的內容靠這個通過試用）
  petShell.markHealthy();
  if (SELFTEST) require("./selftest").run({ gameWin, petWin, showGame, inGame, READ_STATE, getState: () => lastState, diffEvents, openPicker, getPicker: () => pickerWin, openHelp, getHelp: () => helpWin, say, ask, income, openIncome, getIncomeWin: () => incomeWin, buildMenu, openSaves, getSavesWin: () => savesWin, openMapInfo, getMapInfoWin: () => mapInfoWin, READ_MAP_QUERY, saves: { stageImport, makeTransferCode, fetchTransferCode, readSave }, FIND_SESSION, setPetCount, quit: () => app.quit() });
});

app.on("before-quit", () => {
  quitting = true;
  income.flush();
});
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
