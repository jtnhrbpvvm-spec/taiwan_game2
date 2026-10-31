// 外殼的進入點（做法照放置希望桌寵 desktop_pet 的 boot.js）。程式分兩層：
//
//   外殼＝這個檔案、shell/、update-source.json、Electron 本體。跟著安裝檔走，很少改。
//   內容＝main.js、pet/、ui/、names.json…這些真正的功能。安裝檔裡包了一份，
//         之後只從 GitHub 下載有變動的小檔案換掉它，不用重新下載 80 MB 的安裝檔（使用者 2026-10-26 指定）。
//
// 這裡做的事：決定這次要跑哪一份內容（安裝檔內建的，或下載回來比較新的），然後把它跑起來。
// 新下載的內容如果跑不起來，會自動退回上一份能跑的，見 shell/content-store.js。
//
// 每隻桌寵是一個獨立的程式（外殼 2 起）：不帶參數打開的是「啟動器」，把每一隻用 --pet=N 各開成一個程式就結束（見 main.js）。
// 新內容的試用次數只由啟動器算（一次打開算一次），桌寵本體只照著跑、不另外計次，不然開三隻就會被當成啟動失敗三次。
const { app } = require("electron");
const path = require("path");

// 外殼提供給內容的功能有變動（內容必須搭配新外殼才能跑）時加 1。
// 發布的內容清單會寫它需要的號碼，比這裡大就代表要先整包更新外殼（下載完整安裝檔）。
const SHELL_API = 2; // 2：每隻桌寵一個程式（啟動器＋--pet=N）

// 自我測試用全新的暫存資料夾：不碰平常的設定、帳號、遊戲存檔和下載回來的內容
if (process.argv.includes("--selftest")) app.setPath("userData", path.join(app.getPath("temp"), `dark-pet-selftest-${Date.now()}`));
// 測試用：指定另一個資料夾
if (process.env.DARK_PET_PROFILE) app.setPath("userData", process.env.DARK_PET_PROFILE);

// 帶 --pet=N 的是桌寵本體；沒帶的是啟動器
const IS_PET = process.argv.some((a) => /^--pet=\d+$/.test(a));

const store = require("./shell/content-store");
const updates = require("./shell/updates");

const chosen = store.choose({ bundledDir: __dirname, bundledVersion: app.getVersion(), shellApi: SHELL_API, count: !IS_PET });
console.log(`[boot] 外殼 ${app.getVersion()}，內容 ${chosen.version}（${chosen.bundled ? "內建" : "下載"}）`);

// 內容透過這個物件用外殼的功能
global.petShell = {
  api: SHELL_API,
  shellVersion: app.getVersion(),
  contentVersion: chosen.version,
  updates,
  /** 內容啟動到一切正常時呼叫，外殼就知道這一份是能跑的。 */
  markHealthy: () => store.markHealthy(),
};
updates.init({ shellApi: SHELL_API, contentVersion: chosen.version });

/** 下載回來的內容出錯：記成壞的，重開一次就會退回上一份。內建的那份出錯沒有退路，照原樣丟出去。 */
function failed(error) {
  console.error(`內容 ${chosen.version} 啟動失敗：`, error);
  if (chosen.bundled || !store.onTrial()) return false;
  store.markBad(chosen.version);
  app.relaunch();
  app.exit(1);
  return true;
}

// 試用期間出錯就退回；已經通過試用的只記下來讓程式繼續跑（一個小功能出錯不該把整隻桌寵帶走）
process.on("uncaughtException", (error) => {
  if (!failed(error)) console.error("執行中發生錯誤：", error);
});
// 使用者自己正常關掉桌寵不算啟動失敗（啟動器開完桌寵馬上就關，不算）
if (IS_PET) app.on("before-quit", () => store.cleanExit());

try {
  require(path.join(chosen.dir, "main.js"));
} catch (error) {
  if (!failed(error)) throw error;
}
