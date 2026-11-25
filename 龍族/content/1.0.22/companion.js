"use strict";
const { app, BrowserWindow, Menu, Tray, screen, globalShortcut, shell, Notification, nativeImage, session } = require("electron");
const { patchBoot } = require("./game-patch");
const fs = require("fs");
const path = require("path");
const art = require("./art.json");
const { loginWithBrowser, findBrowser } = require("./login-browser");
const accounts = require("./accounts");
const potions = require("./potion-supply");
const codex = require("./codex-data");
const statAlloc = require("./stat-alloc");
const { cleanRules, cleanSell } = require("./sell-rules");
const { spawn } = require("child_process");

const GAME_ORIGIN = "https://play.17raja.com";
const GAME_URL = GAME_ORIGIN + "/";
// 每個帳號各自一份遊戲資料（登入、遊戲設定）和登入用的 Chrome 設定檔，換帳號不會互相蓋掉。
// 沒指定帳號（0.1 版留下來的登入）用原本的 persist:raja 和 login-browser
const partitionOf = (id) => (id ? `persist:raja-acct-${id}` : "persist:raja");
const loginDirOf = (id) => path.join(app.getPath("userData"), id ? `login-browser-${id}` : "login-browser");
const TOGGLE_KEY = "Control+Alt+R"; // 叫出／藏起遊戲視窗
const CLICK_THROUGH_KEY = "Control+Alt+P"; // 專注模式（桌寵不擋滑鼠）
const PET_STRIP_HEIGHT = 300;
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 760;
const LOGIN_WAIT_MS = 8000; // 載入後這麼久還是「還沒登入」，就把遊戲叫出來讓玩家登入
const NO_STATE_WAIT_MS = 30000; // 載入後這麼久都沒收到任何狀態（遊戲沒連上），也叫出來
const GAME_RETRY_MS = 30000;
const ASSET_KEEP_MS = 7 * 24 * 60 * 60 * 1000; // 角色圖在本機留 7 天
const SIZE_CHOICES = [60, 80, 100, 130, 160, 200];
const MAX_LOOT_SHOWN = 4;
const patchedSessions = new WeakSet();
let bootPatch;


// 每隻桌寵擁有自己的視窗、遊戲 Session、登入流程、角色外觀、事件與自動設定。
module.exports = function createCompanion({ accountId = null, slot = 0, onChange, onClose, managerMenu, onTeamLog, openTeam }) {
  const events = new Map(), handlers = new Map();
  const ipcMain = { on: (name, fn) => events.set(name, fn), handle: (name, fn) => handlers.set(name, fn) };
  const currentAccount = () => accountId;
  const gameSession = () => session.fromPartition(partitionOf(accountId));
  const accountLabel = () => { const a = accounts.find(accountId); return a ? a.label || a.username : "舊的登入"; };
let petWin;
let quitting = false;
let clickThrough = false;
let petInteractive = false;
const game = { win: undefined, shown: false, loading: false, failures: 0, retryTimer: undefined, loadedAt: 0, asked: false, state: undefined, lastState: undefined };

// ── 設定 ──────────────────────────────────────────────────

const settingsFile = () => path.join(app.getPath("userData"), accountId ? `pet-settings-${accountId}.json` : "pet-settings.json");
// 自動補給、自動合成的設定（設定視窗 ui/auto.html）。預設全部關閉；門檻填 0＝不看這一種
const DEFAULT_AUTO = {
  supply: { enabled: false, town: "", huntMap: "", hpItem: 0, mpItem: 0, hpMin: 0, hpTo: 0, mpMin: 0, mpTo: 0, ammoMin: 0, ammoTo: 0 },
  fuse: [{ enabled: false, count: 5 }, { enabled: false, count: 5 }, { enabled: false, count: 5 }],
  // 自動復活：倒下後回主城念咒語復活；supply＝復活後照「自動補給」的設定買藥，再回練功地圖
  revive: { enabled: false, supply: true, rest: true },
  // 自動配點：有可分配點數就照 ratio（{int:6, wsps:3, con:1}）分，見 stat-alloc.js
  // target＝小百科指定的目標裝備 { itemNo, setAt }：先配到剛好能用它（不管 enabled），達成就清掉；history＝以前的目標紀錄
  alloc: { enabled: false, ratio: {}, target: null, history: [] },
  // 自動販售（這隻自己的規則）：useGlobal＝也套用「全部桌寵」的規則；背包剩 freeSlots 格以下就回城賣；sellPrecious＝稀有、強化等貴重的也賣
  sell: { enabled: false, rules: [], useGlobal: true, freeSlots: 10, sellPrecious: false },
  // 生活技能：在主城練製作技能（ui/life.html）。mode "best"＝只做目前最高等級能做的、"recipe"＝指定配方；count 0＝一直做
  life: { enabled: false, skill: 0, mode: "best", recipe: 0, count: 0, buy: false, chain: true },
};
// 要記的遊戲掛機設定（localStorage 的鍵），跟 game-preload.js 一樣
const PREF_RE = /^idle:(upkeep|autoPotion|potionPriority|junk:.+|tracked-affixes:.+|skillsets:.+|sound|soundVolume|music|musicVolume|graphics|effects|shake)$/;
let settings = { size: 100, stay: false, gameBounds: undefined, autoStart: false, auto: DEFAULT_AUTO };
const num = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v)) || 0));
// ── 生活技能 ──
function cleanLife(l) {
  // 製作技能或採集技能（採礦、伐木…，2026-11-23 加）
  const gather = codex.gatherSkills.some((s) => s.skill === l?.skill);
  const skill = gather || codex.craftSkills.some((s) => s.skill === l?.skill) ? l.skill : codex.craftSkills[0].skill;
  const recipe = codex.recipes.find((r) => r[0] === l?.recipe && r[3] === skill) ? l.recipe : 0;
  return { enabled: !!l?.enabled && (gather || l?.mode !== "recipe" || recipe > 0), skill, mode: l?.mode === "recipe" ? "recipe" : "best", recipe, count: num(l?.count, 0, 100000), buy: !!l?.buy, chain: l?.chain !== false, useUp: !!l?.useUp, fuse: l?.fuse !== false };
}

// ── 配點目標（小百科「設為配點目標」）──
const HISTORY_MAX = 30;
const codexItem = (no) => codex.items.find((i) => i.no === Number(no));
const time = (t) => (Number.isFinite(t) && t > 0 ? Math.floor(t) : 0);
function cleanTarget(t) {
  const it = t && codexItem(t.itemNo);
  return it ? { itemNo: it.no, setAt: time(t.setAt) || Date.now() } : null;
}
function cleanHistory(h) {
  const it = h && codexItem(h.itemNo);
  if (!it || !["done", "canceled", "replaced"].includes(h.result)) return null;
  return { itemNo: it.no, name: it.name, setAt: time(h.setAt), endAt: time(h.endAt), result: h.result };
}
/** 目前目標結束（達成、取消、換別件），記到紀錄最前面。 */
function endTarget(result) {
  const t = settings.auto.alloc.target;
  if (!t) return;
  const it = codexItem(t.itemNo);
  settings.auto.alloc.history = [{ itemNo: t.itemNo, name: it?.name || String(t.itemNo), setAt: t.setAt, endAt: Date.now(), result }, ...settings.auto.alloc.history].slice(0, HISTORY_MAX);
  settings.auto.alloc.target = null;
}
function setAllocTarget(itemNo) {
  const it = itemNo == null ? null : codexItem(itemNo);
  if (itemNo != null && !it) return { error: "找不到這件裝備" };
  const ch = game.state?.auto?.char;
  if (it && ch && it.classes && !it.classes.includes(ch.classId)) return { error: "這件裝備你的職業不能用，不能設成目標" };
  if (it && ch && statAlloc.targetShort(codex, it, ch).overCap.length) return { error: "這件裝備要求的能力超過你目前職業、轉職的上限，配點配不到" };
  if (settings.auto.alloc.target?.itemNo === it?.no) return {};
  endTarget(it ? "replaced" : "canceled");
  if (it) {
    settings.auto.alloc.target = { itemNo: it.no, setAt: Date.now() };
    logGame(`配點目標：${it.name}`);
  }
  saveSettings();
  sendAuto();
  checkAllocTarget();
  return {};
}
/** 角色能力已經夠用目標裝備（能力類條件都滿足）：記成達成、清掉目標、冒泡說一聲。 */
function checkAllocTarget() {
  const t = settings.auto.alloc.target, ch = game.state?.auto?.char;
  const it = t && codexItem(t.itemNo);
  if (!it || !ch || !Array.isArray(ch.ab)) return;
  if (statAlloc.targetShort(codex, it, ch).total > 0) return;
  endTarget("done");
  saveSettings();
  sendAuto();
  notice(`配點目標達成：能力已經夠用「${it.name}」了`);
  logGame(`配點目標達成：${it.name}`);
}
function allocInfo() {
  const a = settings.auto.alloc, ch = game.state?.auto?.char;
  const it = a.target && codexItem(a.target.itemNo);
  return {
    target: it ? { itemNo: it.no, name: it.name, setAt: a.target.setAt, ...(ch ? { short: statAlloc.targetShort(codex, it, ch) } : {}) } : null,
    history: a.history,
    enabled: a.enabled,
  };
}

/** 設定視窗送來的值不能全信，整理成合法的數字。 */
function cleanAuto(a) {
  const s = a?.supply ?? {};
  return {
    supply: {
      enabled: !!s.enabled,
      town: typeof s.town === "string" ? s.town.slice(0, 40) : "",
      huntMap: typeof s.huntMap === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(s.huntMap) ? s.huntMap : "",
      huntMob: num(s.huntMob, 0, 999999), // 指定怪物（遊戲怪物編號，0＝不指定）
      huntMobMap: typeof s.huntMobMap === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(s.huntMobMap) ? s.huntMobMap : "",
      hpItem: potions.selection("hp", s.hpItem), mpItem: potions.selection("mp", s.mpItem),
      hpMin: num(s.hpMin, 0, 9999), hpTo: num(s.hpTo, 0, 9999),
      mpMin: num(s.mpMin, 0, 9999), mpTo: num(s.mpTo, 0, 9999),
      ammoMin: num(s.ammoMin, 0, 9999), ammoTo: num(s.ammoTo, 0, 9999),
    },
    fuse: [0, 1, 2].map((i) => ({ enabled: !!a?.fuse?.[i]?.enabled, count: num(a?.fuse?.[i]?.count ?? 5, 5, 96) })),
    revive: { enabled: !!a?.revive?.enabled, supply: a?.revive?.supply !== false, spot: a?.revive?.spot !== false, rest: a?.revive?.rest !== false },
    sell: cleanSell(a?.sell),
    life: cleanLife(a?.life),
    alloc: {
      enabled: !!a?.alloc?.enabled,
      ratio: Object.fromEntries(codex.statKeys.map((k) => [k, num(a?.alloc?.ratio?.[k], 0, 100)]).filter(([, v]) => v > 0)),
      target: cleanTarget(a?.alloc?.target),
      history: (Array.isArray(a?.alloc?.history) ? a.alloc.history : []).map(cleanHistory).filter(Boolean).slice(0, HISTORY_MAX),
    },
  };
}
function loadSettings() {
  try {
    settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsFile(), "utf8")) };
  } catch {}
  if (!SIZE_CHOICES.includes(settings.size)) settings.size = 100;
  settings.auto = cleanAuto(settings.auto);
  settings.gamePrefs = cleanPrefs(settings.gamePrefs);
}
function saveSettings() {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 1));
  } catch {}
}

function logGame(text) {
  const line = `[${accountId || "舊的登入"}] ${new Date().toLocaleString("zh-TW", { hour12: false })} ${text}\n`;
  console.log(line.trim());
  try {
    const file = path.join(app.getPath("userData"), "game-log.txt");
    if (fs.existsSync(file) && fs.statSync(file).size > 200 * 1024) fs.writeFileSync(file, fs.readFileSync(file, "utf8").slice(-100 * 1024));
    fs.appendFileSync(file, line);
  } catch {}
}

// ── 遊戲視窗 ──────────────────────────────────────────────

/** 跟一般 Chrome 一樣的 User-Agent（拿掉 Electron／程式名稱）：Cloudflare 人機驗證看到 Electron 比較容易判定成機器人。 */
function chromeUserAgent(ses) {
  return ses.getUserAgent().replace(/\s(?:Electron|raja-desktop-pet|龍族桌寵)\/\S+/g, "");
}

// 遊戲主程式（app/boot-*.js）載入時在最後加一行，把遊戲自己的傳送、買東西、合成函式接出來（game-patch.js）。
// 其他請求原封不動放行。只影響桌寵的遊戲視窗。
const BOOT_RE = /^https:\/\/play\.17raja\.com\/app\/boot-[\w-]+\.js(\?.*)?$/;
function installBootPatch(ses) {
  if (patchedSessions.has(ses)) return;
  patchedSessions.add(ses);
  ses.protocol.handle("https", async (req) => {
    const pass = () => ses.fetch(req, { bypassCustomProtocolHandlers: true });
    if (req.method !== "GET" || !BOOT_RE.test(req.url)) return pass();
    const res = await pass();
    if (!res.ok) return res;
    const { code, found, missing } = patchBoot(await res.text());
    bootPatch = { found: Object.keys(found).length, missing };
    if (missing.length) logGame(`遊戲改版：找不到 ${missing.join("、")}，用到的自動功能會停用`);
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    return new Response(code, { status: res.status, headers });
  });
}

function createGame() {
  const ses = gameSession();
  ses.setUserAgent(chromeUserAgent(ses));
  installBootPatch(ses);
  // 之前裝過的 Service Worker、它存的主程式清掉（不然會直接用沒加料的舊檔，見 game-preload.js）
  ses.clearStorageData({ storages: ["serviceworkers", "cachestorage"] }).catch(() => {});
  const acct = currentAccount() && accounts.find(currentAccount());
  game.win = new BrowserWindow({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    show: false,
    skipTaskbar: true,
    title: `桌寵，${acct ? acct.label || acct.username : "龍族"}`,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      session: ses,
      backgroundThrottling: false,
      contextIsolation: true,
      sandbox: false, // preload 要讀 game-hook.js
      preload: path.join(__dirname, "game-preload.js"),
    },
  });
  game.win.webContents.setAudioMuted(true);
  updateGameMenu();
  parkGame();
  game.win.on("close", (e) => {
    if (quitting) return;
    e.preventDefault();
    showGame(false);
  });
  // 最小化的視窗 Chromium 不畫畫面，當成藏起來
  game.win.on("minimize", () => {
    game.win.restore();
    showGame(false);
  });
  game.win.on("page-title-updated", (e) => e.preventDefault());
  game.win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  game.win.webContents.on("render-process-gone", (_e, d) => {
    if (quitting) return;
    logGame(`遊戲網頁當掉（${d.reason}），重新載入`);
    setTimeout(() => game.win && !game.win.isDestroyed() && loadGame(), 1000);
  });
  game.win.webContents.on("did-finish-load", () => {
    game.loadedAt = Date.now();
    game.asked = false;
    syncParked();
    sendAuto();
  });
  loadGame();
}

// 遊戲視窗上方：標題「桌寵，角色名(經驗%)」、選單列一個「停止練功／開始練功」按鈕（使用者 2026-11-23）
function gameTitle() {
  const s = game.state;
  const name = s?.character?.name || accountLabel();
  const pct = typeof s?.expPct === "number" ? `(${s.expPct.toFixed(2)}%)` : "";
  return `桌寵，${name}${pct}${settings.paused ? "　停止練功中" : trainMode() === "life" ? "　練生活技能" : ""}`;
}
function updateGameTitle() {
  if (!game.win || game.win.isDestroyed()) return;
  const t = gameTitle();
  if (game.win.getTitle() !== t) game.win.setTitle(t);
}
function updateGameMenu() {
  if (!game.win || game.win.isDestroyed()) return;
  // 使用者 2026-11-23：原本的「停止練功」鈕換成跟右鍵一樣的「停止目前所有動作」（停止戰鬥／停止生活技能／全部停止）；停著時多「開始練功」
  game.win.setMenu(Menu.buildFromTemplate([
    { label: "停止目前所有動作", submenu: stopMenuItems() },
    ...(settings.paused ? [{ label: trainMode() === "life" ? "▶ 開始練生活技能" : "▶ 開始練功", click: togglePause }] : []),
  ]));
  game.win.setAutoHideMenuBar(false);
  game.win.setMenuBarVisibility(true);
}
/** 停止練功：回主城待著，補給、組隊跟隨、販售等自動功能先停（倒下照樣復活）；開始練功：回練功區／隊伍打。記在設定裡，重開也一樣。 */
function togglePause() {
  settings.paused = !settings.paused;
  saveSettings();
  const what = trainMode() === "life" ? "練生活技能" : "練功";
  logGame(settings.paused ? "停止練功" : `開始${what}`);
  notice(settings.paused ? "停止練功，回主城休息" : `開始${what}`);
  updateGameMenu();
  updateGameTitle();
  sendAuto();
  onChange();
}

// 練功設定最上面三選一（使用者 2026-11-25：要練生活技能時一直被拉回練功地點）：
//   停止練功＝paused；打怪練功＝trainMode "hunt"（生活技能關掉）；練生活技能＝trainMode "life"（待在主城練，不回練功地圖、不跟組隊出門）
const trainMode = () => (settings.trainMode === "life" ? "life" : "hunt");
function setTrainMode(mode) {
  if (mode === "stop") { if (!settings.paused) togglePause(); return; }
  const wasPaused = !!settings.paused;
  settings.paused = false;
  settings.trainMode = mode;
  let needLife = false;
  if (mode === "hunt") {
    if (settings.auto.life.enabled) settings.auto.life = cleanLife({ ...settings.auto.life, enabled: false });
  } else {
    settings.auto.life = cleanLife({ ...settings.auto.life, enabled: true });
    needLife = !settings.auto.life.enabled; // 指定配方卻沒選配方：先去生活技能頁選
  }
  saveSettings();
  logGame(mode === "life" ? "切換：練生活技能" : "切換：打怪練功");
  notice(mode === "life" ? (needLife ? "練生活技能：先在生活技能頁選好要練的" : "練生活技能，回主城練") : (wasPaused ? "開始打怪練功" : "打怪練功（生活技能已關）"));
  updateGameMenu();
  updateGameTitle();
  sendAuto();
  onChange();
  if (needLife) openLife();
}

/** 右鍵「停止目前所有動作」：fight＝停止戰鬥（同「停止練功」：回主城休息、自動功能都停）；life＝關掉生活技能；all＝兩個都做。 */
function stopMenuItems() {
  return [
    { label: settings.paused ? "停止戰鬥（已停止，回主城休息中）" : "停止戰鬥（回主城休息）", enabled: !settings.paused, click: () => stopActions("fight") },
    { label: settings.auto.life.enabled ? "停止生活技能" : "停止生活技能（沒有在練）", enabled: !!settings.auto.life.enabled, click: () => stopActions("life") },
    { type: "separator" },
    { label: "全部停止", enabled: !settings.paused || !!settings.auto.life.enabled, click: () => stopActions("all") },
    { type: "separator" },
    { label: "要繼續：練功設定 → 勾「打怪練功」或「練生活技能」", enabled: false },
  ];
}
function stopActions(kind) {
  const done = [];
  if ((kind === "fight" || kind === "all") && !settings.paused) { settings.paused = true; done.push("戰鬥"); }
  if ((kind === "life" || kind === "all") && settings.auto.life.enabled) { settings.auto.life = cleanLife({ ...settings.auto.life, enabled: false }); done.push("生活技能"); }
  if (!done.length) return;
  saveSettings();
  logGame(`停止目前動作：${done.join("、")}`);
  notice(`已停止${done.join("、")}${done.includes("戰鬥") ? "，回主城休息" : ""}`);
  updateGameMenu();
  updateGameTitle();
  sendAuto();
  onChange();
}

async function loadGame() {
  clearTimeout(game.retryTimer);
  game.loading = true;
  game.state = undefined;
  try {
    const win = game.win;
    if (quitting || !win || win.isDestroyed()) return;
    await win.loadURL(GAME_URL);
    game.failures = 0;
  } catch (e) {
    if (quitting || !game.win || game.win.isDestroyed()) return;
    logGame(`遊戲載入失敗，稍後再試：${e.message}`);
    game.retryTimer = setTimeout(loadGame, game.failures++ === 0 ? 2000 : GAME_RETRY_MS);
  } finally {
    game.loading = false;
  }
}

/** 藏起來＝停在螢幕外只露 1 像素、幾乎透明、滑鼠穿過，但還是「顯示中」的視窗（沒顯示的視窗 Chromium 會停掉畫面和計時器）。 */
function parkGame() {
  const area = screen.getPrimaryDisplay().workArea;
  const { width, height } = game.win.getBounds();
  game.win.setSkipTaskbar(true);
  game.win.setIgnoreMouseEvents(true);
  game.win.setFocusable(false);
  game.win.setOpacity(0.01);
  game.win.setBounds({ x: area.x - width + 1, y: area.y - height + 1, width, height });
  if (!game.win.isVisible()) game.win.showInactive();
}

/** 藏著而且已經進到遊戲才降低畫面格數；載入、登入的時候照常（遊戲載入進度是一格一格跑的，降格數會載很久）。 */
function syncParked() {
  const parked = !game.shown && game.state?.status === "ingame";
  // 藏著＝也開遊戲的「省電掛機」（畫面全停，比只降格數更省）；叫出遊戲視窗就關掉（使用者 2026-11-23）
  if (game.win && !game.win.isDestroyed()) game.win.webContents.executeJavaScript(`window.__rajaPetParked && __rajaPetParked(${parked}); window.__rajaPetPowerSave && __rajaPetPowerSave(${parked})`).catch(() => {});
}

function showGame(on) {
  if (!game.win || game.win.isDestroyed()) return;
  if (on === game.shown) {
    if (on) game.win.focus();
    return;
  }
  game.shown = on;
  game.autoShown = false;
  logGame(on ? "叫出遊戲視窗" : "藏起遊戲視窗");
  if (on) {
    const area = screen.getPrimaryDisplay().workArea;
    const width = Math.min(GAME_WIDTH, area.width - 40), height = Math.min(GAME_HEIGHT, area.height - 40);
    const at = settings.gameBounds ?? { x: area.x + Math.round((area.width - width) / 2), y: area.y + Math.round((area.height - height) / 2) };
    game.win.setBounds({
      x: Math.max(area.x, Math.min(at.x, area.x + area.width - width)),
      y: Math.max(area.y, Math.min(at.y, area.y + area.height - height)),
      width, height,
    });
    game.win.setOpacity(1);
    game.win.setIgnoreMouseEvents(false);
    game.win.setFocusable(true);
    game.win.setSkipTaskbar(false);
    game.win.show();
    game.win.focus();
    if (game.win.webContents.isCrashed()) loadGame();
  } else {
    const { x, y } = game.win.getBounds();
    settings.gameBounds = { x, y };
    saveSettings();
    parkGame();
  }
  game.win.webContents.setAudioMuted(true);
  syncParked();
  sendAuto(); // 遊戲叫出來（玩家在看）時自動功能先停，藏回去再繼續
}

// ── 自動補給、自動合成 ────────────────────────────────────

const autoLog = []; // 最近的紀錄（設定視窗顯示）
// 組隊練功（main.js 的組隊視窗指定）：team＝{role:"leader",members,mapId,mapName}／{role:"member",leader}；teamLeave＝解散的時間（叫遊戲離隊一次）
// 只放在記憶體：重開桌寵就不再自動組隊
let team = null, teamLeave = 0;
// 不組隊自己打：{ id, mapId }，hook 看到新的 id 就去那張圖一次（只放記憶體）
let goHunt = null;
// 指定交易（main.js 的物品欄視窗指定）：{ id, role:"give", to, items, gold } 或 { id, role:"take", from, count, gold, meet }
let trade = null;
// 「全部桌寵」的販售規則（main.js 管、存在 sell-global.json）：{ enabled, rules }
let sellGlobal = { enabled: false, rules: [] };
/** 這隻實際要用的販售規則＝自己的（有開）＋全部桌寵的（有開、這隻也套用）。 */
function sellRules() {
  const own = settings.auto.sell;
  return cleanRules([...(own.enabled ? own.rules : []), ...(sellGlobal.enabled && own.useGlobal ? sellGlobal.rules : [])]);
}
function sendAuto() {
  if (game.win && !game.win.isDestroyed()) game.win.webContents.send("auto:settings", { ...settings.auto, paused: !!settings.paused, lifeOnly: trainMode() === "life", team, teamLeave, goHunt, trade, sellRules: sellRules() }, game.shown, settings.lastHuntMap ?? null);
  autoWin?.webContents.send("auto:status", autoStatus());
}
function autoStatus() {
  const a = game.state?.auto;
  return {
    settings: settings.auto,
    potions: potions.types,
    towns: a?.towns ?? [],
    huntMaps: a?.huntMaps ?? [],
    lastHuntMap: game.state?.lastHuntMap ?? settings.lastHuntMap ?? null,
    nation: a?.nation,
    counts: a?.counts ?? null,
    fusable: a?.fusable ?? null,
    supplyOk: !!a?.supplyOk,
    supplyState: a?.supplyState || "",
    mobState: a?.mobState || "",
    fuseOk: !!a?.fuseOk,
    char: a?.char ?? null,
    allocTarget: allocInfo(),
    stats: { keys: codex.statKeys, names: codex.statNames },
    classes: codex.classes.map((c) => ({ id: c.id, name: c.name, base: c.base, recommend: c.recommend })),
    missing: a?.missing ?? bootPatch?.missing ?? [],
    connected: game.state?.status === "ingame",
    watching: game.shown,
    log: autoLog.slice(-30),
  };
}
ipcMain.on("game:auto-log", (e, entry) => {
  if (!game.win || e.sender !== game.win.webContents || !entry || typeof entry.text !== "string") return;
  const text = entry.text.slice(0, 200);
  const line = `${new Date().toLocaleTimeString("zh-TW", { hour12: false })} ${text}`;
  autoLog.push(line);
  if (autoLog.length > 200) autoLog.splice(0, autoLog.length - 200);
  logGame(`自動：${text}`);
  // 頭上只冒重要的（開始補給、完成、出問題、合成結果），買了幾瓶這種細項只記在設定視窗
  if (/^補給：回|補給完成|沒有完成|停止|完成：|金幣不夠|沒有賣|出錯|^倒下|^復活|^組隊：(加入|帶隊伍|已進|跟上|回「)|^交易：成功|^販售：(賣了|背包只剩)|^生活技能：(完成|材料不夠)/.test(text)) notice(text);
  onTeamLog?.();
  autoWin?.webContents.send("auto:status", autoStatus());
});

let autoWin;
function openAutoSettings() {
  if (autoWin && !autoWin.isDestroyed()) return autoWin.focus();
  autoWin = new BrowserWindow({
    width: 520,
    height: 720,
    title: "自動補給、合成與配點",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "auto-preload.js") },
  });
  autoWin.loadFile(path.join(__dirname, "ui", "auto.html"));
  autoWin.on("closed", () => (autoWin = undefined));
}
ipcMain.handle("auto:get", () => autoStatus());
ipcMain.on("auto:set", (e, a) => {
  if (!autoWin || e.sender !== autoWin.webContents) return;
  const keep = settings.auto.alloc;
  // 設定視窗只送補給／合成／復活／配點；販售規則（物品欄視窗管）、生活技能（生活技能視窗管）要沿用，
  // 不然每按一次「儲存」就被清空（使用者 2026-11-24：自動販售清單一直消失）
  settings.auto = cleanAuto({ ...a, sell: settings.auto.sell, life: settings.auto.life });
  if (a?.alloc?.target === null && keep.target) { settings.auto.alloc.target = keep.target; endTarget("canceled"); } // 設定視窗按了「取消目標」
  else settings.auto.alloc.target = keep.target;
  settings.auto.alloc.history = keep.history;
  saveSettings();
  sendAuto();
});
// ── 生活技能（ui/life.html：選技能、配方或「最高等級」，材料不夠要不要買、要不要先用原料做中間材料） ──
let lifeWin;
function openLife() {
  if (lifeWin && !lifeWin.isDestroyed()) return lifeWin.focus();
  lifeWin = new BrowserWindow({
    width: 900,
    height: 780,
    title: `生活技能・${accountLabel()}`,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "life-preload.js") },
  });
  lifeWin.loadFile(path.join(__dirname, "ui", "life.html"));
  lifeWin.on("closed", () => (lifeWin = undefined));
}
const fromLife = (e) => lifeWin && !lifeWin.isDestroyed() && e.sender === lifeWin.webContents;
const lifeInfo = () => ({
  name: game.state?.character?.name || "", status: game.state?.status || "connecting", town: !!game.state?.town, watching: game.shown,
  gold: typeof game.state?.character?.gold === "number" ? game.state.character.gold : undefined, // 使用者 2026-11-23：生活技能頁要看到金幣
  now: game.state?.auto?.life ?? null, cfg: settings.auto.life, log: autoLog.filter((l) => / 生活技能/.test(l)).slice(-12),
});
handlers.set("life:get", (e) => (fromLife(e) ? lifeInfo() : null));
handlers.set("life:set", (e, cfg) => {
  if (!fromLife(e)) return { error: "not allowed" };
  const wasOn = settings.auto.life.enabled;
  settings.auto.life = cleanLife(cfg);
  // 在生活技能頁打開：練功設定跟著切到「練生活技能」（不然打怪練功會把它拉回練功地點）
  if (settings.auto.life.enabled && !wasOn && (trainMode() !== "life" || settings.paused)) {
    settings.trainMode = "life";
    settings.paused = false;
    logGame("切換：練生活技能");
  }
  saveSettings();
  sendAuto();
  updateGameMenu(); // 遊戲視窗「停止目前所有動作」裡的停止生活技能跟著開關
  updateGameTitle();
  onChange();
  return lifeInfo();
});

// ── 對話（ui/chat.html：遊戲聊天，不用開遊戲視窗也能看、能回；使用者 2026-11-23） ──
const CHAT_MAX = 300;
const chatLog = [];
let chatWin;
ipcMain.on("game:chat", (e, c) => {
  if (!game.win || e.sender !== game.win.webContents || !c || typeof c.text !== "string") return;
  const entry = { at: Number(c.at) || Date.now(), ch: Number.isInteger(c.ch) ? c.ch : 0, name: String(c.name || "").slice(0, 32), text: c.text.slice(0, 240),
    to: String(c.to || "").slice(0, 32), gm: !!c.gm, me: !!c.me, recent: !!c.recent };
  // 進房間時遊戲會再送一次頭上的對話：已經有的就不重複
  if (entry.recent && chatLog.some((x) => x.name === entry.name && x.text === entry.text && entry.at - x.at < 600000)) return;
  chatLog.push(entry);
  if (chatLog.length > CHAT_MAX) chatLog.splice(0, chatLog.length - CHAT_MAX);
  // 別人密語我：桌寵頭上冒出來（對話視窗沒開著的時候）
  if (entry.ch === 1 && !entry.me && !(chatWin && !chatWin.isDestroyed() && chatWin.isVisible())) notice(`${entry.name} 密語：${entry.text}`);
  chatWin?.webContents.send("chat:new", entry);
});
function openChat() {
  if (chatWin && !chatWin.isDestroyed()) { chatWin.show(); return chatWin.focus(); }
  chatWin = new BrowserWindow({
    width: 460, height: 560, minWidth: 320, minHeight: 300,
    title: `對話・${accountLabel()}`,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "chat-preload.js") },
  });
  chatWin.loadFile(path.join(__dirname, "ui", "chat.html"));
  chatWin.on("closed", () => (chatWin = undefined));
}
const fromChat = (e) => chatWin && !chatWin.isDestroyed() && e.sender === chatWin.webContents;
handlers.set("chat:get", (e) => (fromChat(e) ? { name: game.state?.character?.name || "", status: game.state?.status || "connecting", log: chatLog } : null));
handlers.set("chat:send", async (e, m) => {
  if (!fromChat(e) || !m || typeof m.text !== "string") return { error: "not allowed" };
  if (!game.win || game.win.isDestroyed() || game.loading) return { error: "遊戲還沒載入" };
  const args = [m.text.slice(0, 200), Number.isInteger(m.ch) ? m.ch : 0, typeof m.to === "string" ? m.to.slice(0, 32) : ""].map((v) => JSON.stringify(v)).join(",");
  return game.win.webContents.executeJavaScript(`window.__rajaPetChat ? window.__rajaPetChat.send(${args}) : { error: "遊戲還沒載入" }`).catch(() => ({ error: "送不出去" }));
});

// ── 小百科（ui/codex.html：裝備能力、使用限制；用目前角色的能力標出能不能用） ──
let codexWin;
function openCodex() {
  if (codexWin && !codexWin.isDestroyed()) return codexWin.focus();
  codexWin = new BrowserWindow({
    width: 900,
    height: 760,
    title: `小百科・${accountLabel()}`,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "codex-preload.js") },
  });
  codexWin.loadFile(path.join(__dirname, "ui", "codex.html"));
  codexWin.on("closed", () => (codexWin = undefined));
}
const fromCodex = (e) => codexWin && !codexWin.isDestroyed() && e.sender === codexWin.webContents;
handlers.set("codex:char", (e) => (fromCodex(e) ? { char: game.state?.auto?.char ?? null, name: game.state?.character?.name || "", alloc: allocInfo() } : null));
handlers.set("codex:set-target", (e, itemNo) => (fromCodex(e) ? setAllocTarget(itemNo) : { error: "not allowed" }));
// 小百科「打怪掉落」點地圖／怪物：開組隊練功頁、帶入這隻桌寵和那張地圖（使用者 2026-11-23）
handlers.set("codex:open-team", (e, p) => {
  if (!fromCodex(e) || typeof p?.mapName !== "string") return { error: "not allowed" };
  openTeam?.({ mapName: p.mapName.slice(0, 60), mobName: typeof p.mobName === "string" ? p.mobName.slice(0, 60) : "" });
  return {};
});

// ── 掛機設置（照遊戲「設置」頁，讀寫都透過遊戲網頁裡的 window.__rajaPetPrefs，見 game-hook.js） ──
let idleWin;
function openIdleSettings() {
  if (idleWin && !idleWin.isDestroyed()) return idleWin.focus();
  idleWin = new BrowserWindow({
    width: 520,
    height: 760,
    title: `掛機設置・${accountLabel()}`,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "idle-preload.js") },
  });
  idleWin.loadFile(path.join(__dirname, "ui", "idle.html"));
  idleWin.on("closed", () => (idleWin = undefined));
}
const PREF_KEYS = new Set(["graphics", "effects", "soundOn", "soundVolume", "musicOn", "musicVolume", "shake", "potionAt", "hpItem", "mpItem",
  "hold", "allySupport", "repair", "expLock", "sell", "pickupMin", "sellRarity", "rule", "allRulesOff", "allyTarget",
  "castStyle", "follow", "followRange", "followStay", "skillSetSave", "skillSetDelete", "skillSetApply", "quickSlot"]);
function inGame(code) {
  if (!game.win || game.win.isDestroyed() || game.loading) return Promise.resolve({ ready: false });
  return game.win.webContents.executeJavaScript(`window.__rajaPetPrefs ? ${code} : { ready: false }`).catch(() => ({ ready: false }));
}
const fromIdle = (e) => idleWin && !idleWin.isDestroyed() && e.sender === idleWin.webContents;
handlers.set("idle:get", (e) => (fromIdle(e) ? inGame("window.__rajaPetPrefs.get()") : null));
handlers.set("idle:set", (e, key, value) => {
  if (!fromIdle(e) || !PREF_KEYS.has(key)) return null;
  return inGame(`window.__rajaPetPrefs.set(${JSON.stringify(key)}, ${JSON.stringify(value ?? null)})`);
});
handlers.set("idle:share", (e, on) => {
  if (!fromIdle(e)) return null;
  return inGame(`window.__rajaPetPrefs.share(${typeof on === "boolean" ? on : "undefined"})`);
});

const toggleGame = () => showGame(!game.shown);

// 沒登入的話開 Chrome 讓玩家自己登入（人機驗證只能自己點，而且桌寵自己的遊戲視窗過不了，見 login-browser.js；
// 2026-11-22 又試過在遊戲視窗登入：Cloudflare 時過時不過，不開除錯埠也會要求手動勾、勾了也失敗，所以維持 Chrome）。
// 遊戲視窗開著也一樣（例如玩家在裡面登出想換帳號）：把它收起來改開 Chrome，不讓玩家在桌寵的視窗裡登入（使用者 2026-11-21 指定）。
let noStateReloaded = false;
const loginTimer = setInterval(() => {
  if (!game.win || game.win.isDestroyed() || game.asked || browserLogin || !game.loadedAt || game.loading) return;
  const waited = Date.now() - game.loadedAt;
  const status = game.state?.status;
  if ((status === "login" || status === "expired") && waited > LOGIN_WAIT_MS) {
    game.asked = true;
    // 剛從 Chrome 接回登入狀態、遊戲卻還是沒登入：不要馬上又開 Chrome（會先把剛接回的資料清掉，變成一直重登），讓玩家決定
    if (game.importedAt && Date.now() - game.importedAt < 2 * 60 * 1000) {
      game.importedAt = 0;
      logGame(`接回登入狀態後遊戲還是「${STATUS_TEXT[status] || status}」，先不自動重開 Chrome`);
      notice("接回登入狀態後遊戲還是沒登入：要再試請對我按右鍵「重新登入」");
      return;
    }
    startBrowserLogin();
    return;
  }
  // 遊戲完全沒連上（連「還沒登入」都沒收到）：先重新載入一次，還是不行才把遊戲視窗叫出來給玩家看是怎麼了
  if (!game.state && !game.shown && waited > NO_STATE_WAIT_MS) {
    game.asked = true;
    if (!noStateReloaded) {
      noStateReloaded = true;
      logGame("遊戲一直沒連上，重新載入");
      loadGame();
    } else {
      notice("遊戲好像沒有連上，把遊戲視窗叫出來給你看看");
      showGame(true);
      game.autoShown = true; // 之後連上了就自己藏回去
    }
  }
}, 2000);

// ── 用 Chrome 登入，再把登入狀態接到桌寵的遊戲視窗 ─────────────────

let browserLogin; // 進行中的 { promise, cancel }
let pendingStorage; // 要在遊戲程式之前放進網頁的 localStorage／sessionStorage（game-preload.js 來拿一次）

const SAME_SITE = { Strict: "strict", Lax: "lax", None: "no_restriction" };

async function importLogin({ cookies, local, session: sess }) {
  const jar = gameSession().cookies;
  for (const c of cookies) {
    const host = c.domain.replace(/^\./, "");
    await jar.set({
      url: `https://${host}${c.path || "/"}`,
      name: c.name,
      value: c.value,
      ...(c.domain.startsWith(".") ? { domain: c.domain } : {}),
      path: c.path || "/",
      secure: !!c.secure,
      httpOnly: !!c.httpOnly,
      ...(c.expires > 0 ? { expirationDate: c.expires } : {}),
      sameSite: SAME_SITE[c.sameSite] ?? "unspecified",
    }).catch((e) => logGame(`Cookie ${c.name} 放不進去：${e.message}`));
  }
  pendingStorage = { local: local ?? {}, session: sess ?? {} };
  await gameSession().cookies.flushStore().catch(() => {});
  game.importedAt = Date.now();
  // 只記名字（不記內容：裡面有登入用的 id），方便查接回後為什麼沒登入
  logGame(`從瀏覽器接回登入狀態：Cookie ${cookies.length} 個（${cookies.map((c) => c.name).join("、")}）、設定 ${Object.keys(pendingStorage.local).length + Object.keys(pendingStorage.session).length} 項（${Object.keys(pendingStorage.local).join("、")}）`);
}
// 接回來的登入資料留到真的進遊戲（ingame）才丟：中途重新載入（斷線重連、載入失敗重試）時每次都再放一次，不會弄丟
ipcMain.on("game:pending-storage", (e) => {
  e.returnValue = game.win && e.sender === game.win.webContents ? pendingStorage ?? null : null;
});

// 遊戲自己的掛機設定（自動施放、自動喝藥、撿物賣物…）：桌寵記一份，載入時寫回遊戲（見 game-preload.js）
function cleanPrefs(o) {
  if (!o || typeof o !== "object") return undefined;
  const out = {};
  for (const [k, v] of Object.entries(o).slice(0, 50)) {
    if (k.length <= 80 && PREF_RE.test(k) && typeof v === "string" && v.length <= 20000) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
ipcMain.on("game:saved-prefs", (e) => {
  e.returnValue = game.win && e.sender === game.win.webContents ? settings.gamePrefs ?? null : null;
});
ipcMain.on("game:prefs", (e, o) => {
  if (!game.win || e.sender !== game.win.webContents) return;
  const prefs = cleanPrefs(o);
  if (!prefs || JSON.stringify(prefs) === JSON.stringify(settings.gamePrefs)) return;
  settings.gamePrefs = prefs;
  saveSettings();
  logGame("記下遊戲的掛機設定（自動施放等）");
});

/**
 * 登入前先清乾淨（使用者 2026-11-22）：桌寵遊戲視窗帶著舊的登入憑證（Cookie session=scoped）連著伺服器時，
 * 同一個帳號又在 Chrome 重新登入，伺服器會卡住（Chrome 一直「伺服器回應太慢」）或互踢。所以：
 *   1. 桌寵的遊戲視窗先離開遊戲（about:blank，斷線），清掉遊戲網站的 Cookie、localStorage 等登入資料（遊戲設定照樣由 gamePrefs 寫回）
 *   2. 登入用的 Chrome 設定檔整個刪掉，從乾淨的登入頁開始（刪不掉＝之前開的登入 Chrome 還開著，請玩家先關掉）
 * 回傳清遊戲視窗的 Promise（接回登入狀態前要等它清完）；Chrome 設定檔刪不掉時回傳 null。
 */
function cleanBeforeLogin(id) {
  const dir = loginDirOf(id);
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 2 });
  } catch (e) {
    logGame(`登入用的 Chrome 設定檔刪不掉（${e.code || e.message}）：之前開的登入 Chrome 可能還開著`);
    notice("之前開的登入用 Chrome 還開著：請先把它關掉，再對我按右鍵「重新登入」");
    return null;
  }
  const win = game.win;
  return (async () => {
    try {
      if (win && !win.isDestroyed()) await win.loadURL("about:blank").catch(() => {});
      game.state = undefined;
      sendState();
      const ses = gameSession();
      await ses.clearStorageData({ origin: GAME_ORIGIN, storages: ["cookies", "localstorage", "indexdb", "serviceworkers", "cachestorage", "websql"] });
      await ses.cookies.flushStore().catch(() => {});
      ses.flushStorageData();
      logGame("登入前清掉遊戲視窗的舊登入資料、登入用 Chrome 的設定檔");
    } catch (e) {
      logGame(`清遊戲視窗的登入資料沒成功：${e.message}`);
    }
  })();
}

function startBrowserLogin() {
  if (quitting || browserLogin) return;
  if (!findBrowser()) {
    notice("找不到 Chrome 或 Edge，只好用桌寵的遊戲視窗登入（人機驗證可能過不了）");
    showGame(true);
    return;
  }
  showGame(false);
  const id = currentAccount();
  const acct = id && accounts.find(id);
  const cleaned = cleanBeforeLogin(id);
  if (!cleaned) return;
  browserLogin = loginWithBrowser({
    url: GAME_URL,
    origin: GAME_ORIGIN,
    userDataDir: loginDirOf(id),
    onStatus: (t) => notice(t),
    // 有記帳號就幫忙填帳號密碼（沒存密碼就只填帳號），人機驗證和按登入還是玩家自己來
    fill: acct ? { username: acct.username, password: accounts.password(id) } : undefined,
  });
  browserLogin.promise
    .then(async (got) => {
      // 綁定帳號必須吻合，避免將另一個帳號的角色接到這隻娃娃。
      let who;
      try {
        who = JSON.parse(got.local?.["idle:profileLogin"] || "null")?.username;
      } catch {}
      if (acct && (!who || who.toLowerCase() !== acct.username.toLowerCase())) throw new Error("登入帳號與這隻桌寵綁定的帳號不符，請重新登入指定帳號");
      if (quitting || id !== currentAccount()) return; // 登入途中換了帳號，這份不是現在要的
      await cleaned;
      await importLogin(got);
      if (quitting) return;
      notice("登入狀態接過來了，桌寵的遊戲重新連線中…");
      game.asked = false;
      // 重新算等待時間：不然「遊戲一直沒連上」的計時（從登入前的 about:blank 算起）會馬上又重新載入一次，
      // 把剛載入、已經拿走登入資料的那次打斷（2026-11-22 實測：接回後變成「還沒登入」又開 Chrome）
      game.loadedAt = Date.now();
      noStateReloaded = false;
      loadGame();
    })
    .catch((e) => {
      if (quitting) return;
      logGame(`用瀏覽器登入沒有完成：${e.message}`);
      notice(`登入沒有完成（${e.message}）。要再試一次請對我按右鍵「重新登入」`);
      // 遊戲視窗登入前被斷線了：載回遊戲（會停在登入頁）
      cleaned.then(() => { if (!quitting && game.win && !game.win.isDestroyed()) loadGame(); });
    })
    .finally(() => { browserLogin = undefined; onChange(); });
  onChange();
}

// ── 遊戲狀態 → 桌寵 ───────────────────────────────────────

const STATUS_TEXT = { connecting: "連線中…", login: "還沒登入", kicked: "被踢下線（別的地方登入了）", expired: "登入過期，請重新登入", closed: "斷線，重新連線中…" };

function describe(s) {
  const c = s?.character;
  const place = s?.roomName || s?.mapId || "";
  return {
    name: c?.name,
    level: c?.level,
    classId: c?.classId,
    hp: c?.hp,
    maxHp: c?.maxHp,
    place: s?.status === "ingame" ? place : STATUS_TEXT[s?.status] ?? "載入中…",
    doing: s?.status !== "ingame" ? "" : s.dead ? "倒下了" : s.town ? "在主城休息" : "狩獵中",
    sleeping: s?.status === "ingame" && !!s.town,
    offline: s?.status !== "ingame",
  };
}

function lookOf(s) {
  const c = s?.character;
  if (!c) return undefined;
  const sex = s.sex === 0 || s.sex === 1 ? s.sex : c.gender === 0 ? 0 : 1;
  return { sex, gear: s.gear ?? [0, 0, 0, 0, 0], colors: s.colors ?? null };
}

const itemName = (id) => art.items[id] ?? `物品 ${id}`;

/** 比較前後兩次狀態，找出要演出來的事：升級、經驗、金幣、撿到東西。 */
function diffEvents(prev, next) {
  const a = prev?.character, b = next?.character;
  if (!a || !b || a.name !== b.name || prev.status !== "ingame" || next.status !== "ingame") return [];
  const events = [];
  if (b.level > a.level) events.push({ kind: "levelup", level: b.level });
  else if (b.exp > a.exp) events.push({ kind: "exp", n: b.exp - a.exp });
  if (b.gold > a.gold) events.push({ kind: "gold", n: b.gold - a.gold });
  const loot = [];
  // 剛連上時前一次的背包是空的（還沒收到），整個背包都會變成「撿到」：這種時候不算
  const prevBagKnown = Object.keys(prev.bag ?? {}).length > 0;
  for (const [id, n] of prevBagKnown ? Object.entries(next.bag ?? {}) : []) {
    const before = prev.bag?.[id] ?? 0;
    if (n > before) loot.push({ kind: "loot", name: itemName(id), n: n - before });
  }
  // 一次拿很多種（例如剛從倉庫拿出來）就不一個一個冒，只講前幾個
  return events.concat(loot.slice(0, MAX_LOOT_SHOWN));
}

ipcMain.on("game:state", (e, s) => {
  if (!game.win || e.sender !== game.win.webContents || !s || typeof s !== "object") return;
  const prev = game.state;
  if (s.status === "login" || s.status === "expired") s = { ...s, character: undefined };
  game.state = s;
  updateGameTitle();
  if (s.auto?.char && JSON.stringify(s.auto.char) !== JSON.stringify(prev?.auto?.char)) checkAllocTarget();
  if (s.status === "ingame" && s.lastHuntMap && /^[A-Za-z0-9_-]{1,64}$/.test(s.lastHuntMap.id) &&
      (settings.lastHuntMap?.id !== s.lastHuntMap.id || settings.lastHuntMap?.name !== s.lastHuntMap.name)) {
    settings.lastHuntMap = { id: s.lastHuntMap.id, name: String(s.lastHuntMap.name || s.lastHuntMap.id).slice(0, 100) };
    saveSettings();
  }
  if (prev?.status !== s.status) {
    logGame(`狀態：${s.status}`);
    if (s.status === "kicked") notice("在別的地方登入了，這邊被踢下線。要接回來請對我按右鍵「重新連線」");
    if (s.status === "ingame" && game.shown && game.autoShown) showGame(false);
    if (s.status === "ingame") {
      // 登入資料（Cookie、localStorage）瀏覽器是隔一陣子才寫進硬碟的；程式被強制結束、當機、關機時還沒寫的就沒了，
      // 下次打開會接回舊帳號（2026-11-21 換帳號時踩到）。進到遊戲就馬上寫一次
      setTimeout(() => {
        const ses = gameSession();
        ses.flushStorageData();
        ses.cookies.flushStore().catch(() => {});
      }, 3000);
      game.autoShown = false;
      game.asked = false; // 之後又變成沒登入（登出、過期）時可以再開 Chrome
      noStateReloaded = false;
      pendingStorage = undefined; // 接回的登入資料已經用上了
    }
    syncParked();
  }
  sendState();
  onChange();
  queueEvents(diffEvents(prev, s));
  if (autoWin && (prev?.status !== s.status || JSON.stringify(prev?.auto) !== JSON.stringify(s.auto) || JSON.stringify(prev?.lastHuntMap) !== JSON.stringify(s.lastHuntMap))) autoWin.webContents.send("auto:status", autoStatus());
  // 斷線重連的一瞬間房間名稱、地圖都還沒有：那次不記（不然會記成「出城：undefined」）
  if (prev && prev.town !== s.town && (s.roomName ?? s.mapId)) logGame(s.town ? `回到主城（${s.roomName ?? s.mapId}）` : `出城：${s.roomName ?? s.mapId}`);
});

// 打怪時狀態大約每 0.3 秒就變一次，一筆一筆冒字太吵：經驗、金幣、撿到的東西累積 EVENT_BATCH_MS 再一起冒；升級馬上演
const EVENT_BATCH_MS = 2500;
let pendingEvents = [];
let eventTimer;
function queueEvents(events) {
  if (!events.length) return;
  if (events.some((e) => e.kind === "levelup")) {
    flushEvents(events);
    return;
  }
  pendingEvents.push(...events);
  eventTimer ??= setTimeout(() => flushEvents([]), EVENT_BATCH_MS);
}
function flushEvents(extra) {
  clearTimeout(eventTimer);
  eventTimer = undefined;
  const all = pendingEvents.concat(extra);
  pendingEvents = [];
  const sum = (kind) => all.filter((e) => e.kind === kind).reduce((n, e) => n + e.n, 0);
  const loot = new Map();
  for (const e of all) if (e.kind === "loot") loot.set(e.name, (loot.get(e.name) ?? 0) + e.n);
  const out = [
    ...all.filter((e) => e.kind === "levelup").slice(-1),
    ...(sum("exp") ? [{ kind: "exp", n: sum("exp") }] : []),
    ...(sum("gold") ? [{ kind: "gold", n: sum("gold") }] : []),
    ...[...loot].slice(0, MAX_LOOT_SHOWN).map(([name, n]) => ({ kind: "loot", name, n })),
  ];
  if (!out.length) return;
  petWin?.webContents.send("pet:events", out);
  if (process.argv.includes("--snap")) logGame(`事件：${out.map((e) => (e.kind === "loot" ? `${e.name}×${e.n}` : `${e.kind} ${e.n ?? e.level}`)).join("、")}`);
}

function sendState() {
  if (!petWin || petWin.isDestroyed()) return;
  petWin.webContents.send("pet:state", { ...describe(game.state), account: accountLabel(), status: game.state?.status || "connecting" });
  const look = lookOf(game.state);
  const key = JSON.stringify(look);
  if (key !== game.lastLook) {
    game.lastLook = key;
    petWin.webContents.send("pet:look", look);
  }
}

// ── 角色圖：從遊戲站抓，存在本機 ──────────────────────────

const ASSET_RE = /^assets\/players\/[01]\/(movement\.json|movement-\d+\.webp|gear\/\d+\.json|gear\/\d+-\d+\.webp)$/;
const assetFetches = new Map();

async function getAsset(rel) {
  if (typeof rel !== "string" || !ASSET_RE.test(rel)) throw new Error("bad asset path");
  const file = path.join(app.getPath("userData"), "assets", ...rel.split("/"));
  try {
    const st = fs.statSync(file);
    if (Date.now() - st.mtimeMs < ASSET_KEEP_MS) return fs.readFileSync(file);
  } catch {}
  if (!assetFetches.has(rel)) {
    assetFetches.set(rel, (async () => {
      try {
        const res = await gameSession().fetch(`${GAME_ORIGIN}/${rel}`);
        // 網站找不到檔案會回首頁（200 + HTML），不能當成圖存
        if (!res.ok || (res.headers.get("content-type") || "").includes("text/html")) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
        return buf;
      } catch (e) {
        if (fs.existsSync(file)) return fs.readFileSync(file); // 舊的總比沒有好
        throw e;
      } finally {
        assetFetches.delete(rel);
      }
    })());
  }
  return assetFetches.get(rel);
}
ipcMain.handle("pet:asset", (_e, rel) => getAsset(rel));
ipcMain.handle("pet:art", () => ({ gear: art.gear, order: art.order, layerOrders: art.layerOrders, actions: art.actions }));

// ── 桌寵視窗 ──────────────────────────────────────────────

// 顯示卡程式（GPU process）當掉重開後，透明視窗會變成全透明、什麼都畫不出來，桌寵圖示就不見了，遊戲照跑
// （使用者 2026-11-24：跑一段時間桌寵不見；當時 GPU 程式 09:29 重開過）。收到就把桌寵視窗整個重建。
let gpuRebuildTimer;
function rebuildPetWindow(why) {
  if (quitting || !petWin) return;
  const old = petWin;
  logGame(`${why}：桌寵視窗重建`);
  createPetWindow();
  petWin.webContents.once("did-finish-load", () => setTimeout(() => { if (!old.isDestroyed()) old.destroy(); }, 500));
}
app.on("child-process-gone", (_e, d) => {
  if (d.type !== "GPU" || quitting) return;
  clearTimeout(gpuRebuildTimer);
  gpuRebuildTimer = setTimeout(() => rebuildPetWindow(`顯示卡程式重開（${d.reason}）`), 3000);
});

/** 桌寵長條該在的位置：主螢幕工作區（不含工作列）最下面、全寬。 */
function petStripBounds() {
  const area = screen.getPrimaryDisplay().workArea;
  return { x: area.x, y: area.y + area.height - PET_STRIP_HEIGHT, width: area.width, height: PET_STRIP_HEIGHT };
}
function fitPetWindow() {
  if (!petWin || petWin.isDestroyed()) return;
  const want = petStripBounds(), now = petWin.getBounds();
  if (["x", "y", "width", "height"].every((k) => Math.abs(now[k] - want[k]) <= 1)) return;
  petWin.setBounds(want);
  logGame(`螢幕變了：桌寵放回螢幕底部（${now.width}×${now.height} → ${want.width}×${want.height}）`);
}

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
  petWin.on("minimize", () => {
    petWin.restore();
    petWin.setAlwaysOnTop(true, "screen-saver");
  });
  petWin.setIgnoreMouseEvents(true, { forward: true });
  // 螢幕設定變了（休眠醒來、螢幕重新接上、縮放比例改了）Windows 會把視窗縮小或移走，桌寵就浮在半空、跑出畫面（使用者 2026-11-23）：
  // 收到螢幕變動就重新貼回底部；另外每 30 秒對一次位置（有些變動不會發事件）
  let fitTimer;
  const fitSoon = () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitPetWindow, 1500); };
  const screenEvents = ["display-metrics-changed", "display-added", "display-removed"];
  if (typeof screen.on === "function") screenEvents.forEach((ev) => screen.on(ev, fitSoon));
  const fitCheck = setInterval(fitPetWindow, 30000);
  petWin.on("closed", () => {
    if (typeof screen.removeListener === "function") screenEvents.forEach((ev) => screen.removeListener(ev, fitSoon));
    clearInterval(fitCheck);
    clearTimeout(fitTimer);
  });
  petWin.loadFile(path.join(__dirname, "pet", "index.html"));
  // 桌寵畫面那個程式當掉：重新載入
  petWin.webContents.on("render-process-gone", (_e, d) => {
    if (quitting || d.reason === "clean-exit") return;
    logGame(`桌寵畫面停掉了（${d.reason}），重新載入`);
    setTimeout(() => { if (petWin && !petWin.isDestroyed()) petWin.webContents.reload(); }, 1000);
  });
  petWin.webContents.on("did-finish-load", () => {
    petInteractive = false;
    petWin.setIgnoreMouseEvents(true, { forward: true });
    petWin.webContents.send("pet:size", settings.size);
    petWin.webContents.send("pet:stay", settings.stay);
    if (clickThrough) petWin.webContents.send("pet:click-through", true);
    petWin.webContents.send("pet:position", (slot + 1) / 6);
    game.lastLook = undefined;
    sendState();
  });
}

ipcMain.on("pet:interactive", (e, on) => {
  if (!petWin || petWin.isDestroyed() || e.sender !== petWin.webContents) return;
  // renderer 已在勿擾模式下檢查 Ctrl；此處仍須接受暫時互動，否則永遠收不到右鍵。
  petInteractive = on === true;
  petWin.setIgnoreMouseEvents(!petInteractive, { forward: true });
});
ipcMain.on("pet:toggle-game", toggleGame);
ipcMain.on("pet:menu", () => buildMenu().popup({ window: petWin }));

function notice(text) {
  if (quitting || clickThrough) return;
  if (petShown() && !clickThrough) petWin.webContents.send("pet:notice", text);
  else if (Notification.isSupported()) new Notification({ title: "龍族桌寵", body: text }).show();
}

const petShown = () => !!petWin && petWin.isVisible() && !petWin.isMinimized();
function showPet() {
  if (petWin.isMinimized()) petWin.restore();
  petWin.showInactive();
  petWin.setAlwaysOnTop(true, "screen-saver");
}

function setClickThrough(on) {
  clickThrough = on;
  if (on) petInteractive = false;
  petWin.setIgnoreMouseEvents(!petInteractive, { forward: true });
  petWin.webContents.send("pet:click-through", on);
}

function setSize(size) {
  settings.size = size;
  saveSettings();
  petWin.webContents.send("pet:size", size);
}

function setStay(on) {
  settings.stay = on;
  saveSettings();
  petWin.webContents.send("pet:stay", on);
}

function setAutoStart(on) {
  settings.autoStart = on;
  saveSettings();
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: on });
}

function reconnect() {
  game.state = undefined;
  sendState();
  loadGame();
}

/** 選單最上面那行：「職業，角色名（Lv.等級 經驗%）」。 */
function menuTitle() {
  const c = game.state?.character;
  if (!c?.name) return `${accountLabel()}・尚未登入角色`;
  const cls = codex.classes?.find((x) => x.id === c.classId)?.name;
  const pct = typeof game.state?.expPct === "number" ? ` ${game.state.expPct.toFixed(2)}%` : "";
  return `${cls ? `${cls}，` : ""}${c.name}（Lv.${c.level}${pct}）`;
}

// 右鍵選單分類（使用者 2026-11-23 指定）：新功能照性質放進「登入設定／練功設定／桌寵設定」，分不出來就先問使用者
function buildMenu() {
  const m = managerMenu();
  return Menu.buildFromTemplate([
    { label: menuTitle(), enabled: false },
    { type: "separator" },
    { label: game.shown ? "隱藏遊戲視窗" : "開啟遊戲視窗", accelerator: TOGGLE_KEY, click: toggleGame },
    { label: "對話…", click: openChat }, // 使用者 2026-11-23 指定放最上面這區
    ...(m.update ? [m.update] : []),
    m.others,
    // 使用者 2026-11-23：開遊戲畫面不再自動暫停，要停由玩家自己按（放在「其他桌寵」下面）
    { label: "停止目前所有動作", submenu: stopMenuItems() },
    { type: "separator" },
    { label: browserLogin ? "登入設定（登入中）" : "登入設定", submenu: [
      { label: "重新連線（重新載入遊戲）", click: reconnect },
      ...(browserLogin ? [{ label: "登入好了，接到桌寵（幫你關掉 Chrome）", click: () => browserLogin?.done() }] : []),
      browserLogin
        ? { label: "取消用 Chrome 登入", click: () => browserLogin?.cancel() }
        : { label: currentAccount() ? "重新登入（開 Chrome，幫你填帳號密碼）…" : "登入（開 Chrome）…", click: startBrowserLogin },
      { label: "開機自動啟動", type: "checkbox", checked: app.isPackaged ? app.getLoginItemSettings().openAtLogin : false, enabled: app.isPackaged, click: (i) => setAutoStart(i.checked) },
    ] },
    { type: "separator" },
    { label: "練功設定", submenu: [
      { label: "停止練功（回主城休息）", type: "radio", checked: !!settings.paused, click: () => setTrainMode("stop") },
      { label: "打怪練功", type: "radio", checked: !settings.paused && trainMode() === "hunt", click: () => setTrainMode("hunt") },
      { label: "練生活技能（待在主城）", type: "radio", checked: !settings.paused && trainMode() === "life", click: () => setTrainMode("life") },
      { type: "separator" },
      m.team,
      m.inv,
      { label: "掛機設置…", click: openIdleSettings },
      { label: "自動補給、合成與配點…", click: openAutoSettings },
      { label: "小百科（裝備）…", click: openCodex },
      { label: settings.auto.life.enabled ? "生活技能（練習中）…" : "生活技能…", click: openLife },
    ] },
    { type: "separator" },
    { label: "桌寵設定", submenu: [
      { label: "原地不走動", type: "checkbox", checked: settings.stay, click: (i) => setStay(i.checked) },
      { label: "大小", submenu: SIZE_CHOICES.map((n) => ({ label: `${n}%`, type: "radio", checked: settings.size === n, click: () => setSize(n) })) },
      { label: "專注模式（滑鼠穿過桌寵）", type: "checkbox", accelerator: CLICK_THROUGH_KEY, checked: clickThrough, click: (i) => setClickThrough(i.checked) },
    ] },
    { type: "separator" },
    { label: "關閉此桌寵", click: onClose },
    { label: "關閉全部桌寵", click: () => app.quit() },
  ]);
}


  return {
    accountId, events, handlers,
    /** 組隊練功：主程式指定這隻當隊長／隊員；null＝不組隊（leave＝順便離開遊戲裡的隊伍）。 */
    setTeam(t, leave = false) {
      team = t || null;
      if (leave) teamLeave = Date.now();
      if (team) logGame(`組隊：${team.role === "leader" ? `當隊長，帶 ${team.members.join("、")} 去「${team.mapName}」` : `當隊員，等 ${team.leader}`}`);
      else if (leave) logGame("組隊：解散");
      sendAuto();
    },
    /** 組隊中隊長換房間（私人房／公開房 N／快速加入）。 */
    setTeamRoom(room, where = {}) {
      if (!team) return;
      team = { ...team, ...where, room, ...(team.role === "member" ? { dest: null } : {}) };
      logGame(`組隊：換到「${team.mapName || team.mapId}」${room.kind === "public" ? (room.no ? `公開房 ${room.no}` : room.best ? "人最多的公開房" : "公開房（快速加入）") : "私人房"}`);
      sendAuto();
    },
    /** 公開房組隊：主程式把隊長進的公開房（{mapId,no,code}）轉給隊員。 */
    setTeamDest(dest) {
      if (!team || team.role !== "member") return;
      team = { ...team, dest: dest || null };
      if (dest) logGame(`組隊：${team.leader} 在公開房 ${dest.no}，跟過去`);
      sendAuto();
    },
    /** 讀公開房清單（組隊頁用，經隊長的遊戲連線讀）。 */
    async listRooms(mapId, after) {
      if (!game.win || game.win.isDestroyed() || game.loading || game.state?.status !== "ingame") return { error: "這隻桌寵還沒進到遊戲" };
      const args = [String(mapId || "").slice(0, 32), Number(after) || 0].map((v) => JSON.stringify(v)).join(",");
      return game.win.webContents.executeJavaScript(`window.__rajaPetRooms ? window.__rajaPetRooms.list(${args}) : { error: "遊戲還沒載入" }`).catch(() => ({ error: "讀不到公開房" }));
    },
    /** 不組隊自己打（組隊練功頁）：離開隊伍，練功地圖、指定怪物記進自動補給設定，馬上去那張圖開打；停止練功中也一併恢復。 */
    goSolo({ mapId, mapName, mob, mobName, spot }) {
      team = null;
      teamLeave = Date.now();
      const sup = settings.auto.supply;
      settings.auto.supply = { ...sup, huntMap: mapId, huntMob: mob || 0, huntMobMap: mob ? mapId : "" };
      settings.auto.revive = { ...settings.auto.revive, spot: spot !== false };
      settings.auto = cleanAuto(settings.auto);
      // 自己打＝打怪練功：停止練功、練生活技能都切回來（生活技能開著會把它拉回主城）
      settings.paused = false;
      settings.trainMode = "hunt";
      if (settings.auto.life.enabled) settings.auto.life = cleanLife({ ...settings.auto.life, enabled: false });
      updateGameMenu(); updateGameTitle();
      goHunt = { id: Date.now(), mapId };
      saveSettings();
      logGame(`自己打：去「${mapName}」${mobName ? `，指定怪物「${mobName}」` : ""}`);
      sendAuto();
      onChange();
    },
    /** 指定交易：主程式指定這隻要給／收；null＝取消。 */
    setTrade(job) {
      trade = job || null;
      if (trade && !trade.meet && !trade.ready) logGame(`交易：${trade.role === "give" ? `交給 ${trade.to}` : `收 ${trade.from} 的`}`);
      sendAuto();
    },
    /** 全部桌寵的販售規則（主程式改了就送來）。 */
    setSellGlobal(g) { sellGlobal = g || { enabled: false, rules: [] }; sendAuto(); },
    /** 這隻自己的販售設定（物品欄視窗改的）。 */
    setSell(cfg) { settings.auto.sell = cleanSell(cfg); saveSettings(); sendAuto(); },
    invInfo() {
      const s = game.state, a = s?.auto;
      return {
        accountId, label: accountLabel(), status: s?.status || "connecting", name: s?.character?.name || "", level: s?.character?.level,
        town: !!s?.town, dead: !!s?.dead, watching: game.shown, inv: a?.inv ?? null, trade: a?.trade ?? null, job: trade,
        sell: settings.auto.sell, sellNow: a?.sell ?? null, sellActive: sellRules().length,
        log: autoLog.filter((l) => / 交易/.test(l)).slice(-8),
      };
    },
    teamInfo() {
      const s = game.state, a = s?.auto;
      return {
        accountId, label: accountLabel(), status: s?.status || "connecting",
        name: s?.character?.name || "", level: s?.character?.level, classId: a?.char?.classId,
        mapId: s?.mapId, town: !!s?.town, dead: !!s?.dead, watching: game.shown,
        huntMaps: a?.huntMaps ?? [], lastHuntMap: s?.lastHuntMap ?? settings.lastHuntMap ?? null, huntMap: settings.auto.supply.huntMap || "",
        party: a?.party ?? null, teamState: a?.teamState || "", team, teamRoom: a?.teamRoom ?? null, teamStuck: a?.teamStuck ?? null, room: a?.room ?? null,
        log: autoLog.filter((l) => / 組隊|復活|倒下/.test(l)).slice(-8),
      };
    },
    owns(sender) { return [petWin, game.win, autoWin, idleWin, codexWin, lifeWin, chatWin].some(w => w && !w.isDestroyed() && w.webContents === sender); },
    start() { loadSettings(); createPetWindow(); createGame(); },
    show: showPet, toggleGame, login: startBrowserLogin, openAutoSettings, openIdleSettings, say: notice,
    finishLogin() { browserLogin?.done(); },
    menu: buildMenu,
    focusMode() { setClickThrough(!clickThrough); },
    async snapshot(dir, suffix = "") {
      if (quitting) return;
      fs.writeFileSync(path.join(dir, `snap-pet${suffix}.png`), (await petWin.webContents.capturePage()).toPNG());
      fs.writeFileSync(path.join(dir, `snap-game${suffix}.png`), (await game.win.webContents.capturePage()).toPNG());
      if (autoWin) fs.writeFileSync(path.join(dir, `snap-auto${suffix}.png`), (await autoWin.webContents.capturePage()).toPNG());
      if (idleWin) fs.writeFileSync(path.join(dir, `snap-idle${suffix}.png`), (await idleWin.webContents.capturePage()).toPNG());
      const s = game.state ? { ...game.state, bag: Object.keys(game.state.bag ?? {}).length } : null;
      fs.writeFileSync(path.join(dir, `snap-state${suffix}.json`), JSON.stringify({ accountId, shown: game.shown, state: s, describe: describe(game.state), look: lookOf(game.state) }, null, 1));
    },
    info() { return { accountId, label: accountLabel(), status: game.state?.status || "connecting", character: game.state?.character?.name || "", level: game.state?.character?.level, loggingIn: !!browserLogin }; },
    dispose() {
      quitting = true;
      browserLogin?.cancel();
      clearInterval(loginTimer); clearTimeout(game.retryTimer); clearTimeout(eventTimer);
      pendingStorage = undefined; pendingEvents = [];
      for (const w of [autoWin, idleWin, chatWin, game.win, petWin]) if (w && !w.isDestroyed()) w.destroy();
    },
  };
};
