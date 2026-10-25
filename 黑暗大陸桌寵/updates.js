// 更新檢查：桌寵程式本身（electron-updater）跟線上版遊戲，每 30 分鐘各查一次。
//
// 桌寵：新版安裝檔放在 taiwan_game2 repo 的「黑暗大陸桌寵」資料夾（latest.yml＋安裝檔＋blockmap，npm run release 產生），
//       從 raw.githubusercontent.com 下載（網址寫在 package.json 的 build.publish，打包時寫進安裝版）。
//       有新版就在背景下載，下載好提醒一次；右鍵選單「立即更新桌寵」重新啟動安裝，不按的話下次結束桌寵時自動安裝。
// 遊戲：抓遊戲首頁看 data/game.js?v=版本號，跟遊戲視窗目前載入的版本比，不一樣就提醒一次；
//       右鍵選單「套用遊戲更新」重新載入全部遊戲（遊戲伺服器會擋舊版上傳雲端存檔，所以建議套用）。
const { app, net } = require("electron");
const { autoUpdater } = require("electron-updater");

const CHECK_MS = 30 * 60 * 1000;

let notify = () => {};
let gameUrl;
let loadedGameVersions = () => []; // 每個遊戲視窗目前跑的版本（main.js 給）
let reloadGames = () => {};
let petReady; // 已經下載好、等安裝的桌寵新版本號
let petChecking = false;
let gameLatest; // 線上遊戲最新版本號（跟載入中的不一樣時才有）
let notifiedGame; // 已經提醒過的遊戲版本，同一版只講一次

/** 遊戲首頁裡的版本號：發佈版是 data/game.js?v=…，開發版是 data/config.js?v=…。網址加時間標記，避開 GitHub Pages 的快取。 */
async function fetchGameVersion() {
  const res = await net.fetch(`${gameUrl}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.text()).match(/data\/(?:game|config)\.js\?v=([\w.-]+)/)?.[1];
}

async function checkGame() {
  try {
    const latest = await fetchGameVersion();
    const loaded = loadedGameVersions().filter(Boolean);
    if (!latest || loaded.length === 0) return;
    // 有任何一隻還在跑舊版就算有更新
    gameLatest = loaded.some((v) => v !== latest) ? latest : undefined;
    if (gameLatest && notifiedGame !== gameLatest) {
      notifiedGame = gameLatest;
      notify(`黑暗大陸更新了（v${gameLatest}）！對我按右鍵選「套用遊戲更新」`);
    }
  } catch (e) {
    console.error("檢查遊戲更新失敗：", e.message);
  }
}

/** manual＝使用者從選單按的：查完不管有沒有新版都講一聲。 */
async function checkPet(manual = false) {
  if (!app.isPackaged) {
    if (manual) notify("開發版不會自動更新，要用安裝版");
    return;
  }
  if (petReady) {
    if (manual) notify(`桌寵新版 v${petReady} 已經下載好了，右鍵選單「立即更新桌寵」`);
    return;
  }
  if (petChecking) return;
  petChecking = true;
  try {
    const r = await autoUpdater.checkForUpdates();
    if (manual && !r?.isUpdateAvailable) notify(`桌寵已經是最新版（v${app.getVersion()}）`);
    else if (manual) notify(`找到桌寵新版 v${r.updateInfo.version}，下載中…`);
  } catch (e) {
    console.error("檢查桌寵更新失敗：", e.message);
    if (manual) notify("檢查桌寵更新失敗，等一下再試");
  } finally {
    petChecking = false;
  }
}

function checkAll() {
  checkPet();
  checkGame();
}

function start(options) {
  ({ notify, gameUrl, loadedGameVersions, reloadGames } = options);
  // 時間標記：raw.githubusercontent.com 會快取檔案約 5 分鐘，推上新版後玩家可能還拿到舊的 latest.yml。
  // electron-updater 的 generic 來源在沒有 Authorization 標頭時，會在 latest.yml 後面自動加 ?noCache=<現在時間>，
  // 每次都是新網址、不吃快取（AppUpdater.isAddNoCacheQuery）；這裡再加 no-cache 標頭。不要加 Authorization 標頭，會把時間標記關掉。
  // 安裝檔、blockmap 檔名本來就帶版本號，不會拿到舊的。
  autoUpdater.requestHeaders = { "Cache-Control": "no-cache", Pragma: "no-cache" };
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", (info) => {
    petReady = info.version;
    notify(`桌寵有新版本 v${petReady}！右鍵選單「立即更新桌寵」，或下次結束桌寵時自動安裝`);
  });
  autoUpdater.on("error", (e) => console.error("桌寵更新出錯：", e.message));
  // 剛打開時遊戲才剛載入，一定是最新的；桌寵本身就先查一次
  setTimeout(() => checkPet(), 10000);
  setInterval(checkAll, CHECK_MS);
}

/** 右鍵選單裡的更新項目：有東西可更新時排在最上面那幾個。 */
function menuItems() {
  return [
    ...(petReady ? [{ label: `⬆ 立即更新桌寵到 v${petReady}（重新啟動）`, click: () => autoUpdater.quitAndInstall(false, true) }] : []),
    ...(gameLatest ? [{ label: `⬆ 套用遊戲更新 v${gameLatest}（重新載入全部遊戲）`, click: () => {
      gameLatest = undefined;
      reloadGames();
    } }] : []),
  ];
}

const checkItem = () => ({ label: `檢查更新（桌寵 v${app.getVersion()}）`, click: () => {
  checkPet(true);
  checkGame();
} });

module.exports = { start, menuItems, checkItem, checkGame, checkPet, fetchGameVersion };
