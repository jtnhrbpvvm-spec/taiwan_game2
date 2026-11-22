// 帳號檔：%APPDATA%\龍族桌寵\accounts.json
// 每個帳號：{ id, username, label, passEnc }。密碼用 Windows 內建加密（Electron safeStorage／DPAPI）存成 passEnc，
// 只有這台電腦、這個 Windows 使用者解得開；換電腦或換使用者後要重新輸入。密碼不寫進紀錄檔、不送到網路上，
// 只在登入時交給 tools/fill-login.ps1 填進 Chrome（從標準輸入傳，不放在命令列）。
"use strict";
const { app, safeStorage } = require("electron");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const file = () => path.join(app.getPath("userData"), "accounts.json");
let list = [];

// 從 Claude 啟動時，Windows 可能把 AppData 導向套件的 LocalCache。
// 直接雙擊啟動改用一般 AppData；只在新位置完全沒有帳號檔時接回舊檔。
function migrateAccounts() {
  if (fs.existsSync(file())) return;
  const appData = path.join(os.homedir(), "AppData");
  const candidates = [path.join(appData, "Roaming", "龍族桌寵", "accounts.json")];
  const packages = path.join(appData, "Local", "Packages");
  try {
    for (const entry of fs.readdirSync(packages, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith("Claude_")) {
        candidates.push(path.join(packages, entry.name, "LocalCache", "Roaming", "龍族桌寵", "accounts.json"));
      }
    }
  } catch {}
  for (const candidate of candidates) {
    if (path.resolve(candidate) === path.resolve(file())) continue;
    let raw;
    try { raw = JSON.parse(fs.readFileSync(candidate, "utf8")); } catch { continue; }
    if (!Array.isArray(raw) || !raw.length || !raw.every(a => a && typeof a.id === "string" && typeof a.username === "string")) continue;
    fs.mkdirSync(path.dirname(file()), { recursive: true });
    if (raw.some(a => a.passEnc) && fs.existsSync(path.join(path.dirname(candidate), "Local State"))) {
      // safeStorage 的金鑰也跟著設定檔：先在隔離背景程序讀舊金鑰，
      // 再用目前金鑰加密，不能只搬 passEnc，亦不能覆寫目前的 Local State。
      const helper = path.join(__dirname, "tools", "legacy-account-crypto.cjs").replace("app.asar", "app.asar.unpacked");
      const env = { ...process.env };
      delete env.ELECTRON_RUN_AS_NODE;
      const converted = spawnSync(process.execPath, ["--no-sandbox", "--disable-gpu", helper, `--legacy-profile=${path.dirname(candidate)}`], {
        env, encoding: "utf8", windowsHide: true, timeout: 20000,
      });
      if (converted.status !== 0) throw new Error("舊帳號密碼搬移未完成，原始資料仍保留");
      raw = JSON.parse(converted.stdout).map(({ password, ...a }) => ({
        ...a, ...(password ? { passEnc: safeStorage.encryptString(password).toString("base64") } : {}),
      }));
      fs.writeFileSync(file(), JSON.stringify(raw, null, 1), { flag: "wx" });
    } else fs.copyFileSync(candidate, file(), fs.constants.COPYFILE_EXCL);
    return;
  }
}

function load() {
  migrateAccounts();
  try {
    const raw = JSON.parse(fs.readFileSync(file(), "utf8"));
    list = Array.isArray(raw) ? raw.filter((a) => a && typeof a.id === "string" && typeof a.username === "string") : [];
  } catch {
    list = [];
  }
}
function save() {
  fs.writeFileSync(file(), JSON.stringify(list, null, 1));
}

const pub = (a) => ({ id: a.id, username: a.username, label: a.label || "", hasPassword: !!a.passEnc });

/** 給畫面用的清單（沒有密碼）。 */
const all = () => list.map(pub);
const find = (id) => list.find((a) => a.id === id);

/** 新增或修改：password 給空字串＝不改密碼。回傳那個帳號（沒有密碼）。 */
function upsert({ id, username, label, password }) {
  username = String(username || "").trim().slice(0, 20);
  if (!username) throw new Error("帳號不能空白");
  if (id && list.some(a => a.id !== id && a.username.toLowerCase() === username.toLowerCase())) throw new Error("這個帳號已存在，請使用原本的帳號項目");
  let a = id ? find(id) : list.find((x) => x.username.toLowerCase() === username.toLowerCase());
  if (!a) {
    a = { id: crypto.randomBytes(6).toString("hex"), username, label: "" };
    list.push(a);
  }
  a.username = username;
  a.label = String(label || "").trim().slice(0, 20);
  if (password) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("這台電腦不能加密儲存密碼");
    a.passEnc = safeStorage.encryptString(String(password).slice(0, 72)).toString("base64");
  }
  save();
  return pub(a);
}

function remove(id) {
  list = list.filter((a) => a.id !== id);
  save();
}

/** 解開密碼；解不開（換了電腦、Windows 使用者）回傳空字串。 */
function password(id) {
  const a = find(id);
  if (!a?.passEnc) return "";
  try {
    return safeStorage.decryptString(Buffer.from(a.passEnc, "base64"));
  } catch {
    return "";
  }
}

module.exports = { load, all, find: (id) => (find(id) ? pub(find(id)) : undefined), upsert, remove, password };
