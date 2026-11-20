// 帳號檔：記錄可以快速登入的遊戲帳號（Email＋密碼），每隻桌寵可以指定用哪一個。
//
// 檔案在桌寵資料夾的 accounts.json（右鍵選單「帳號管理…」裡有按鈕可以打開資料夾）：
//   [{ "id": "a1b2c3", "label": "主帳", "email": "you@example.com", "passEnc": "…" }]
// 密碼用 Windows 內建的加密（Electron safeStorage＝DPAPI）存成 passEnc，只有這台電腦、這個 Windows 使用者解得開。
// 手動編輯檔案時可以直接寫 "password": "明文密碼"，桌寵下次讀檔會自動換成加密的 passEnc、把明文刪掉。
// 加密功能不能用的電腦（極少見）只好照原樣留明文，帳號管理視窗會提醒。
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app, safeStorage } = require("electron");

const file = () => path.join(app.getPath("userData"), "accounts.json");
let accounts = [];

const canEncrypt = () => safeStorage.isEncryptionAvailable();

function write() {
  try {
    fs.writeFileSync(file(), JSON.stringify(accounts, null, 2));
  } catch (e) {
    console.error("帳號檔存不進去：", e.message);
  }
}

/** 讀帳號檔；有明文密碼就順手加密。檔案不存在時建一個空的，方便使用者找到位置。 */
function load() {
  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(file(), "utf8"));
  } catch (e) {
    if (e.code !== "ENOENT") console.error("帳號檔讀不懂（先當作沒有帳號）：", e.message);
  }
  let changed = !fs.existsSync(file());
  accounts = (Array.isArray(list) ? list : []).filter((a) => a && typeof a.email === "string" && a.email.trim()).map((a) => {
    const out = { id: typeof a.id === "string" && a.id ? a.id : crypto.randomBytes(3).toString("hex"), label: String(a.label ?? "").trim(), email: a.email.trim() };
    if (out.id !== a.id) changed = true;
    if (typeof a.password === "string" && a.password) {
      if (canEncrypt()) {
        out.passEnc = safeStorage.encryptString(a.password).toString("base64");
        changed = true;
      } else out.password = a.password;
    } else if (typeof a.passEnc === "string") out.passEnc = a.passEnc;
    return out;
  });
  if (changed) write();
}

const find = (id) => accounts.find((a) => a.id === id);

/** 給選單、帳號管理視窗用：不含密碼。 */
const list = () => accounts.map((a) => ({ id: a.id, label: a.label, email: a.email, hasPass: !!(a.passEnc || a.password) }));

/** 選單上顯示的名字：有取名用名字，不然用 Email。 */
const nameOf = (id) => {
  const a = find(id);
  return a ? a.label || a.email : "";
};

function password(id) {
  const a = find(id);
  if (!a) return "";
  if (a.password) return a.password;
  if (!a.passEnc) return "";
  try {
    return safeStorage.decryptString(Buffer.from(a.passEnc, "base64"));
  } catch {
    return ""; // 換了電腦或 Windows 使用者就解不開，要重新輸入
  }
}

/** 新增或修改。password 留空＝沿用原本的密碼。回傳 { id } 或 { error }。 */
function save({ id, label, email, password: pass }) {
  email = String(email ?? "").trim();
  if (!/^\S+@\S+$/.test(email)) return { error: "Email 格式不對" };
  let a = id ? find(id) : undefined;
  if (accounts.some((x) => x !== a && x.email.toLowerCase() === email.toLowerCase())) return { error: "這個 Email 已經在清單裡了" };
  if (!a) {
    if (!pass) return { error: "新帳號要輸入密碼" };
    a = { id: crypto.randomBytes(3).toString("hex") };
    accounts.push(a);
  }
  a.label = String(label ?? "").trim();
  a.email = email;
  if (pass) {
    delete a.password;
    delete a.passEnc;
    if (canEncrypt()) a.passEnc = safeStorage.encryptString(pass).toString("base64");
    else a.password = pass;
  }
  write();
  return { id: a.id };
}

function remove(id) {
  accounts = accounts.filter((a) => a.id !== id);
  write();
}

module.exports = { load, list, find, nameOf, password, save, remove, file, canEncrypt };
