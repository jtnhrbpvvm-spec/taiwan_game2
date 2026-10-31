// 更新檢查（內容這邊）：線上版遊戲每 30 分鐘查一次；桌寵程式本身的更新交給外殼（shell/updates.js，boot.js 放在 global.petShell）。
//
// 遊戲：抓遊戲首頁看 data/game.js?v=版本號（網址加時間標記避開快取），跟遊戲視窗目前載入的版本比，不一樣就提醒一次；
//       右鍵選單「套用遊戲更新」重新載入全部遊戲（遊戲伺服器會擋舊版上傳雲端存檔，所以建議套用）。
// 桌寵：外殼優先只下載有變動的小檔案，必要時才下載完整安裝檔；下載好提醒一次，右鍵選單「立即更新桌寵」。
const { net } = require("electron");

const CHECK_MS = 30 * 60 * 1000;
const shell = () => global.petShell?.updates;

let notify = () => {};
let gameUrl;
let loadedGameVersions = () => []; // 每個遊戲視窗目前跑的版本（main.js 給）
let reloadGames = () => {};
let others = () => []; // 別隻（別的程式）是第幾隻
let tell = async () => {}; // 傳話給別隻（peers.js）
let leader = () => true; // 這隻是不是負責講更新提醒的那隻（只讓一隻講，不然每隻頭上都跳一次）
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
    if (gameLatest && notifiedGame !== gameLatest && leader()) {
      notifiedGame = gameLatest;
      notify(`黑暗大陸更新了（v${gameLatest}）！對我按右鍵選「套用遊戲更新」`);
    }
  } catch (e) {
    console.error("檢查遊戲更新失敗：", e.message);
  }
}

/**
 * options：{ notify(講一句), floater(頭上飄一行小字), gameUrl, loadedGameVersions, reloadGames,
 *            canCheck()：這隻要不要檢查桌寵更新（只讓一隻檢查）, others()：別隻是第幾隻, tell(第幾隻, 訊息) }
 */
function start(options) {
  ({ notify, gameUrl, loadedGameVersions, reloadGames } = options);
  others = options.others ?? others;
  tell = options.tell ?? tell;
  leader = options.canCheck ?? leader;
  shell()?.start({ say: notify, notify: options.floater ?? notify, canCheck: options.canCheck });
  setInterval(checkGame, CHECK_MS);
}

/** 右鍵選單裡的更新項目：有東西可更新時排在最上面那幾個。 */
function menuItems() {
  return [
    ...[shell()?.readyItem()].filter(Boolean).map(withOthers),
    ...(gameLatest ? [{ label: `⬆ 套用遊戲更新 v${gameLatest}（重新載入全部遊戲）`, click: () => {
      gameLatest = undefined;
      reloadGames();
    } }] : []),
  ];
}

/**
 * 每隻桌寵是獨立的程式：立即更新時別隻也要跟著。小檔案更新＝大家各自重開（重開就換上新內容）；
 * 完整安裝檔＝別隻先結束（安裝時檔案不能被佔用），安裝完會自己開回來（啟動器照上次開著的那幾隻開）。
 */
function withOthers(item) {
  return { ...item, click: async () => {
    const msg = { type: item.kind === "installer" ? "quit" : "relaunch" };
    await Promise.all(others().map((i) => tell(i, msg)));
    if (item.kind === "installer") await new Promise((r) => setTimeout(r, 2000)); // 等別隻真的結束
    item.click();
  } };
}

/** 「檢查更新」：桌寵（外殼）跟遊戲都馬上查一次。 */
function checkItem() {
  const item = shell()?.menuItem() ?? { label: "檢查更新", enabled: false };
  const pet = item.click;
  return { ...item, enabled: true, click: () => {
    pet?.();
    checkGame();
  } };
}

module.exports = { start, menuItems, checkItem, checkGame, fetchGameVersion };
