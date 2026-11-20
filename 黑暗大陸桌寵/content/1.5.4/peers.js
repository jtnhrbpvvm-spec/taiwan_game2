// 桌寵之間互相傳話：每隻桌寵是一個獨立的程式（main.js 的 ME），各自開一條本機的具名管道
// （Windows 的 named pipe，其他系統是 unix socket），名字照「第幾隻」取。
//
//   - 同一個編號只開得起一條：開不起來＝那一隻已經在跑了，所以它同時是「每個編號只能有一個程式」的鎖，
//     最多 10 隻（MAX_PETS）就是靠編號只有 1～10 擋住的
//   - 連得上＝那隻還活著（scan）；程式結束（包括當掉）管道就自動消失
//   - 一則訊息＝一行 JSON，對方回一行 JSON
//
// 管道名稱裡帶著使用者資料夾的雜湊，自我測試（暫存資料夾）跟平常用的桌寵不會互相連到。
const crypto = require("crypto");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");

let base;

/** dataRoot＝使用者資料夾（%APPDATA%\黑暗大陸桌寵）。 */
function init(dataRoot) {
  const hash = crypto.createHash("sha1").update(dataRoot.toLowerCase()).digest("hex").slice(0, 10);
  base = process.platform === "win32" ? `\\\\.\\pipe\\dark-continent-pet-${hash}-` : path.join(os.tmpdir(), `dark-pet-${hash}-`);
}

const pipeOf = (index) => (process.platform === "win32" ? `${base}${index + 1}` : `${base}${index + 1}.sock`);

/** 傳一則訊息給第 index 隻，回傳牠的回覆；連不上或逾時回傳 undefined。 */
function request(index, msg, timeoutMs = 1500) {
  return new Promise((resolve) => {
    let buf = "";
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };
    const socket = net.connect(pipeOf(index));
    const timer = setTimeout(() => finish(undefined), timeoutMs);
    socket.on("connect", () => socket.write(JSON.stringify(msg) + "\n"));
    socket.on("data", (chunk) => {
      buf += chunk;
      const end = buf.indexOf("\n");
      if (end < 0) return;
      try {
        finish(JSON.parse(buf.slice(0, end)));
      } catch {
        finish(undefined);
      }
    });
    socket.on("error", () => finish(undefined));
    socket.on("close", () => finish(undefined));
  });
}

/** 現在活著的是哪幾隻（0 起算，由小到大）。 */
async function scan(max) {
  const replies = await Promise.all(Array.from({ length: max }, (_, i) => request(i, { type: "ping" }, 800)));
  return replies.map((r, i) => (r?.ok ? i : -1)).filter((i) => i >= 0);
}

/**
 * 佔下第 index 隻的編號，開始收訊息。handler(msg) 的回傳值（可以是 Promise）就是回覆。
 * 回傳 false＝這個編號已經有程式在跑了。
 */
async function listen(index, handler) {
  const pipe = pipeOf(index);
  // unix socket 的檔案在程式當掉後會留著：連得上才算真的有人，連不上就是殘留的，清掉
  if (process.platform !== "win32" && fs.existsSync(pipe)) {
    if (await request(index, { type: "ping" }, 800)) return false;
    try {
      fs.rmSync(pipe, { force: true });
    } catch {}
  }
  return new Promise((resolve) => {
    const server = net.createServer((socket) => {
      let buf = "";
      socket.on("data", async (chunk) => {
        buf += chunk;
        let end;
        while ((end = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, end);
          buf = buf.slice(end + 1);
          let reply;
          try {
            reply = (await handler(JSON.parse(line))) ?? { ok: true };
          } catch (e) {
            reply = { ok: false, error: e.message };
          }
          if (!socket.destroyed) socket.write(JSON.stringify(reply) + "\n");
        }
      });
      socket.on("error", () => {});
    });
    server.once("error", () => resolve(false));
    server.listen(pipe, () => resolve(true));
  });
}

module.exports = { init, request, scan, listen };
