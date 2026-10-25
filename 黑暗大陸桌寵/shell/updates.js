// 桌寵自己的自動更新（做法照放置希望桌寵 desktop_pet 的 shell/updates.js）。優先只下載有變動的小檔案（內容更新）；做不到的時候才下載完整的安裝檔。
//
// 更新來源寫在 update-source.json 的 url（taiwan_game2 的「黑暗大陸桌寵」資料夾），那個網址底下要有：
//   content/manifest.json      最新內容的清單 { version, shell, files: [{ path, sha256, size }] }（tools/publish-content.js 產生）
//   content/<版本>/<檔案…>      清單裡的每個檔案
//   latest.yml、安裝檔 .exe、.exe.blockmap   完整安裝檔（electron-updater 用，tools/release.js 產生）
//
// 什麼時候下載完整安裝檔：
//   1. 最新的內容需要比較新的外殼（清單的 shell 比這個外殼的號碼大）
//   2. 小檔案下載失敗（連不上、檔案對不起來）
// 這兩種情況如果線上的安裝檔也沒有比較新，就什麼都不做，下次再試。
//
// 檢查時清單的網址都加時間標記（?t=現在時間），避開 raw.githubusercontent.com 約 5 分鐘的快取，推上去後玩家下一次檢查就拿得到。
// 下載好之後桌寵講一聲（勿擾時內容那邊會先記著、解除再講），右鍵選單最上面多「立即更新桌寵」；不按的話下次打開桌寵自動換上。
// 只有安裝版會更新；開發時（electron .）一律不檢查，除非設了測試用的環境變數。
const { app, net } = require("electron");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const store = require("./content-store");

const CHECK_EVERY_MS = 30 * 60 * 1000;
const SAFE_PATH = /^[A-Za-z0-9_\-]+(\/[A-Za-z0-9_\-.]+)*(\.[A-Za-z0-9]+)?$/; // 只收單純的相對路徑，擋掉 ../ 跟絕對路徑
const MAX_FILES = 200;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

let source;
try {
  source = require("../update-source.json");
} catch {}

// 測試用：DARK_PET_CONTENT_URL 指到別的地方（可以是 file:// 資料夾），DARK_PET_FORCE_UPDATES 讓開發版也檢查
const contentBase = process.env.DARK_PET_CONTENT_URL || (source?.url ? `${source.url}content/` : undefined);
const enabled = (app.isPackaged || !!process.env.DARK_PET_FORCE_UPDATES) && !!contentBase;

let shellApi;
let contentVersion; // 這次啟動跑的內容版本
let ui; // { notify(文字)：頭上飄一行小字, say(文字)：桌寵講一句（勿擾時會等解除） }
let busy = false;
let manual = false; // 這次檢查是使用者自己按的：沒有新版或出錯也要回報，背景檢查則保持安靜
let readyContent; // 已經下載好、重開就會換上的內容版本
let readyInstaller; // 已經下載好、重開就會裝的安裝檔版本
let told; // 已經講過的版本，同一版不重複講
let fullUpdater; // electron-updater，用到才載入

function init(options) {
  shellApi = options.shellApi;
  contentVersion = options.contentVersion;
}

function restart() {
  app.relaunch();
  app.quit();
}

/** 已經有新版等著換上的話，回傳右鍵選單最上面那一項；沒有回傳 null。 */
function readyItem() {
  if (readyInstaller) return { label: `⬆ 立即更新桌寵到 v${readyInstaller}（重新啟動）`, click: () => fullUpdater.quitAndInstall(false, true) };
  if (readyContent) return { label: `⬆ 立即更新桌寵到 v${readyContent}（重新啟動）`, click: restart };
  return null;
}

/** 右鍵選單的「檢查更新」。 */
function menuItem() {
  if (!enabled) return { label: `檢查更新（開發版 v${contentVersion} 不會自動更新）`, enabled: false };
  return { label: `檢查更新（桌寵 v${contentVersion}）`, click: () => check(true) };
}

// ── 小檔案更新 ────────────────────────────────────────────

async function fetchBytes(url) {
  const res = await net.fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** 清單加時間標記，每次都是新網址、不吃快取（file:// 測試來源不加）。 */
const fresh = (url) => (/^https?:/.test(url) ? `${url}?t=${Date.now()}` : url);

function validate(manifest) {
  if (typeof manifest?.version !== "string" || !/^\d+(\.\d+)*$/.test(manifest.version)) throw new Error("清單沒有版本號");
  if (!Number.isInteger(manifest.shell)) throw new Error("清單沒有外殼號碼");
  if (!Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_FILES) throw new Error("清單的檔案列表不對");
  for (const f of manifest.files) {
    if (typeof f.path !== "string" || !SAFE_PATH.test(f.path) || f.path.includes("..")) throw new Error(`清單裡有奇怪的路徑：${f.path}`);
    if (typeof f.sha256 !== "string" || !Number.isInteger(f.size) || f.size > MAX_FILE_BYTES) throw new Error(`清單裡 ${f.path} 的資料不對`);
  }
  if (!manifest.files.some((f) => f.path === "main.js")) throw new Error("清單裡沒有 main.js");
  return manifest;
}

/** 把清單裡的檔案全部下載到暫存資料夾，逐一核對雜湊值，全部對了才換成正式的。 */
async function download(manifest) {
  const final = store.dirOf(manifest.version);
  const temp = `${final}.tmp`;
  fs.rmSync(temp, { recursive: true, force: true });
  try {
    for (const f of manifest.files) {
      const bytes = await fetchBytes(`${contentBase}${manifest.version}/${f.path}`);
      if (bytes.length !== f.size || crypto.createHash("sha256").update(bytes).digest("hex") !== f.sha256) throw new Error(`${f.path} 跟清單對不起來`);
      const target = path.join(temp, ...f.path.split("/"));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
    }
    fs.writeFileSync(path.join(temp, "content.json"), JSON.stringify(manifest));
    fs.rmSync(final, { recursive: true, force: true });
    fs.renameSync(temp, final);
  } catch (e) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw e;
  }
}

function announce(version, small) {
  if (told === version) return;
  told = version;
  ui.say(`桌寵新版 v${version} ${small ? "下載好了（只有小檔案）" : "下載好了"}！右鍵選單「立即更新桌寵」，或下次打開桌寵時自動換上`);
}

async function check(byUser = false) {
  if (!enabled || busy) return;
  busy = true;
  manual = byUser;
  try {
    if (readyContent || readyInstaller) {
      // 已經有一版在等重開，使用者又按了一次檢查：再講一次
      told = undefined;
      announce(readyInstaller || readyContent, !readyInstaller);
      return;
    }
    const manifest = validate(JSON.parse((await fetchBytes(fresh(`${contentBase}manifest.json`))).toString("utf8")));
    if (manifest.shell > shellApi) return checkInstaller(); // 要先換外殼
    if (store.compareVersions(manifest.version, contentVersion) <= 0) {
      if (manual) ui.say(`桌寵已經是最新版（v${contentVersion}）`);
      return;
    }
    if (store.isBad(manifest.version)) {
      // 這一版在這台電腦上啟動失敗過，不要一直重抓
      if (manual) ui.say(`新版 v${manifest.version} 在這台電腦上啟動失敗過，先維持 v${contentVersion}`);
      return;
    }
    if (!store.has(manifest.version)) {
      ui.notify(`發現桌寵新版 v${manifest.version}，下載中…`);
      await download(manifest);
    }
    readyContent = manifest.version;
    announce(manifest.version, true);
  } catch (e) {
    console.error("小檔案更新失敗，改試完整安裝檔：", e.message);
    checkInstaller();
  } finally {
    busy = false;
  }
}

// ── 完整安裝檔（備援）────────────────────────────────────

function checkInstaller() {
  if (!app.isPackaged || !source?.provider) {
    if (manual) ui.say("檢查桌寵更新沒有成功，晚點再試試看");
    return;
  }
  if (!fullUpdater) {
    fullUpdater = require("electron-updater").autoUpdater;
    fullUpdater.setFeedURL(source);
    // latest.yml 會自動加 ?noCache=時間（沒有 Authorization 標頭時），再加 no-cache 標頭；不要加 Authorization，會把時間標記關掉
    fullUpdater.requestHeaders = { "Cache-Control": "no-cache", Pragma: "no-cache" };
    fullUpdater.autoDownload = true;
    fullUpdater.autoInstallOnAppQuit = true; // 不按「立即更新」的話，下次結束程式時順便裝
    fullUpdater.on("update-available", (info) => ui.notify(`發現桌寵新版 v${info.version}，下載完整安裝檔中…`));
    fullUpdater.on("update-not-available", () => manual && ui.say(`桌寵已經是最新版（v${contentVersion}）`));
    fullUpdater.on("error", (e) => {
      console.error("完整安裝檔更新失敗：", e.message);
      if (manual) ui.say("檢查桌寵更新沒有成功，晚點再試試看");
    });
    fullUpdater.on("update-downloaded", (info) => {
      readyInstaller = info.version;
      announce(info.version, false);
    });
  }
  fullUpdater.checkForUpdates().catch(() => {}); // 失敗會走 error 事件，這裡不用再處理一次
}

function start(handlers) {
  ui = handlers;
  if (!enabled) return;
  setTimeout(check, 10000);
  setInterval(check, CHECK_EVERY_MS);
}

module.exports = { init, start, menuItem, readyItem, check };
