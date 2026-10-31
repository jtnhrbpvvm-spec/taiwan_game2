// 管理下載回來的「內容」：放在哪、這次該跑哪一份、哪一份是壞的。
//
// 使用者資料夾/content/
//   1.4.1/           一份完整的內容，結構跟安裝檔裡的一樣（main.js、pet/、ui/…）
//     content.json   下載完成的記號，內容是當初的清單（版本、需要的外殼號碼、每個檔案的雜湊值）
//   1.4.2.tmp/       下載到一半的，下次啟動會清掉
//   state.json       { bad: [跑不起來的版本], trying: { version, boots } }
//
// 退回機制：一份新下載的內容頭幾次啟動算「試用」。內容自己回報一切正常（markHealthy）才算通過；
// 連續兩次啟動都沒回報（當掉、卡死、被使用者強制關閉），或啟動時直接丟出錯誤，就記成壞的，之後不再用它。
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const MAX_UNCONFIRMED_BOOTS = 2;

const root = () => path.join(app.getPath("userData"), "content");
const stateFile = () => path.join(root(), "state.json");

let state = { bad: [], trying: undefined };
let trial = false; // 這次啟動跑的是不是還在試用的內容

function loadState() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
    state = { bad: Array.isArray(saved.bad) ? saved.bad : [], trying: saved.trying };
  } catch {}
}

function saveState() {
  try {
    fs.mkdirSync(root(), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2));
  } catch (e) {
    console.error("內容狀態存不進去：", e.message);
  }
}

/** 版本號比大小（1.10.0 比 1.9.0 新）。回傳正數＝a 比較新。 */
function compareVersions(a, b) {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] || 0) - (y[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

const dirOf = (version) => path.join(root(), version);
const isBad = (version) => state.bad.includes(version);
const has = (version) => fs.existsSync(path.join(dirOf(version), "content.json"));

/** 下載完整、可以用的內容，新的在前。 */
function downloaded(shellApi) {
  let names = [];
  try {
    names = fs.readdirSync(root());
  } catch {}
  return names
    .filter((name) => /^\d+(\.\d+)*$/.test(name) && has(name))
    .map((name) => {
      try {
        return { version: name, shell: JSON.parse(fs.readFileSync(path.join(dirOf(name), "content.json"), "utf8")).shell };
      } catch {
        return undefined;
      }
    })
    .filter((c) => c && c.shell <= shellApi && !isBad(c.version))
    .sort((a, b) => compareVersions(b.version, a.version));
}

/**
 * 清掉用不到的：下載到一半的、壞掉的、太舊的。
 * 留下這次要跑的那一份，以及它前一份（fallback）：新的那份萬一跑不起來，才有東西可以退回去。
 */
function cleanup(keepVersion, fallbackVersion) {
  let names = [];
  try {
    names = fs.readdirSync(root());
  } catch {}
  for (const name of names) {
    if (name === "state.json" || name === keepVersion || name === fallbackVersion) continue;
    if (/^\d+(\.\d+)*$/.test(name) && keepVersion && compareVersions(name, keepVersion) > 0 && !isBad(name)) continue; // 比現在新、還沒輪到的留著
    try {
      fs.rmSync(path.join(root(), name), { recursive: true, force: true });
    } catch {}
  }
}

/**
 * 決定這次啟動要跑哪一份內容。回傳 { dir, version, bundled }。
 * count＝這次打開要不要算進試用次數、順便清掉用不到的舊版（只有啟動器算；桌寵本體照著挑同一份，不改狀態，
 * 試用中出錯時一樣能記成壞的退回去）。
 */
function choose({ bundledDir, bundledVersion, shellApi, count = true }) {
  loadState();
  const bundled = { dir: bundledDir, version: bundledVersion, bundled: true };
  let pick = bundled;
  let fallback; // 排在這次要跑的那一份後面、次新的可用版本
  for (const candidate of downloaded(shellApi)) {
    if (compareVersions(candidate.version, bundledVersion) <= 0) break; // 安裝檔內建的已經一樣新或更新
    if (!pick.bundled) {
      fallback = candidate.version;
      break;
    }
    if (count && state.trying?.version === candidate.version && state.trying.boots >= MAX_UNCONFIRMED_BOOTS) {
      // 試了幾次都沒有正常跑起來
      state.bad.push(candidate.version);
      state.trying = undefined;
      continue;
    }
    pick = { dir: dirOf(candidate.version), version: candidate.version, bundled: false };
  }
  if (!count) {
    trial = !pick.bundled && state.trying?.version === pick.version && !state.trying.healthy;
    return pick;
  }
  if (pick.bundled) state.trying = undefined;
  else if (state.trying?.version === pick.version) {
    if (!state.trying.healthy) {
      state.trying.boots += 1;
      trial = true;
    }
  } else {
    state.trying = { version: pick.version, boots: 1 };
    trial = true;
  }
  saveState();
  cleanup(pick.bundled ? undefined : pick.version, fallback);
  return pick;
}

/** 內容回報「一切正常」：這一份通過試用，之後不再計次。 */
function markHealthy() {
  if (!state.trying || state.trying.healthy) return;
  state.trying.healthy = true;
  trial = false;
  saveState();
}

/** 使用者自己正常關掉：這次不算沒回報。 */
function cleanExit() {
  if (!trial || !state.trying || state.trying.healthy) return;
  state.trying.boots = Math.max(0, state.trying.boots - 1);
  saveState();
}

function markBad(version) {
  if (!isBad(version)) state.bad.push(version);
  if (state.trying?.version === version) state.trying = undefined;
  trial = false;
  saveState();
}

module.exports = { choose, markHealthy, cleanExit, markBad, isBad, has, dirOf, root, compareVersions, onTrial: () => trial };
