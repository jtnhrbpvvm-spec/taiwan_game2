// 用電腦上真的 Chrome（沒有就用 Edge）登入，登入好之後把登入狀態（Cookie、遊戲存在網頁裡的 idle:* 設定）拿回來。
//
// 為什麼：遊戲登入要過 Cloudflare 人機驗證（Turnstile），Electron 做的視窗、Claude 內建瀏覽器都會被判定成機器人（錯誤 600010）。
// 用 --remote-debugging-pipe 開的 Chrome 也不行（2026-11-21 實測：一直停在「正在驗證…」），
// 所以登入時開的是「完全普通」的 Chrome，不帶任何偵錯參數。
//
// 做法：
//   1. 用獨立的設定檔（%APPDATA%\龍族桌寵\login-browser）開普通 Chrome，玩家自己驗證、登入，好了把這個視窗關掉
//   2. 視窗關掉後，用同一個設定檔在背景開一個看不到的 Chrome（--headless），讀出遊戲網站的 Cookie，
//      再開遊戲網站的 robots.txt（同一個網址來源、不會跑遊戲、不會連線）讀 localStorage 的 idle:* 設定，讀完關掉
// 帳號密碼是玩家自己在瀏覽器裡打的，桌寵碰不到；拿回來的 Cookie、token 只放進桌寵自己的遊戲視窗，不寫進紀錄檔。
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const isCloudflare = (c) => /^(__cf|cf_|_cfuvid)/i.test(c.name);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const findBrowser = () => BROWSERS.find((p) => p && fs.existsSync(p));

/** 跟瀏覽器之間的 DevTools 管線：一則訊息一段 JSON，用 \0 分隔。只用在看不到的那個 Chrome。 */
class Pipe {
  constructor(proc) {
    this.out = proc.stdio[3];
    this.nextId = 1;
    this.waiting = new Map();
    let buf = "";
    proc.stdio[4].on("data", (chunk) => {
      buf += chunk.toString("utf8");
      let i;
      while ((i = buf.indexOf("\0")) >= 0) {
        const text = buf.slice(0, i);
        buf = buf.slice(i + 1);
        let msg;
        try {
          msg = JSON.parse(text);
        } catch {
          continue;
        }
        const w = msg.id && this.waiting.get(msg.id);
        if (!w) continue;
        this.waiting.delete(msg.id);
        msg.error ? w.reject(new Error(msg.error.message)) : w.resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    this.out.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      setTimeout(() => this.waiting.delete(id) && reject(new Error(`${method} 沒有回應`)), 15000);
    });
  }
}

const READ_STORAGE = `(() => {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("idle")) o[k] = localStorage.getItem(k); }
  return JSON.stringify(o);
})()`;

/** 用登入用的設定檔開一個看不到的 Chrome，讀出遊戲網站的 Cookie 和 localStorage。 */
async function readProfile(exe, userDataDir, origin) {
  const proc = spawn(exe, [
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--remote-debugging-pipe",
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"], windowsHide: true });
  const pipe = new Pipe(proc);
  const exited = new Promise((r) => proc.on("exit", r));
  try {
    await sleep(800);
    const host = new URL(origin).hostname;
    const { cookies } = await pipe.send("Storage.getCookies");
    const site = cookies.filter((c) => {
      const d = c.domain.replace(/^\./, "");
      return (d === host || host.endsWith("." + d)) && !isCloudflare(c);
    });
    const { targetId } = await pipe.send("Target.createTarget", { url: origin + "/robots.txt" });
    await sleep(2500);
    const { sessionId } = await pipe.send("Target.attachToTarget", { targetId, flatten: true });
    const r = await pipe.send("Runtime.evaluate", { expression: READ_STORAGE, returnByValue: true }, sessionId);
    return { cookies: site, local: JSON.parse(r.result.value || "{}"), session: {} };
  } finally {
    pipe.send("Browser.close").catch(() => {});
    await Promise.race([exited, sleep(4000)]);
    if (proc.exitCode === null) proc.kill();
  }
}

/**
 * 開普通的 Chrome 讓玩家登入；玩家關掉視窗後讀出登入狀態。
 * 回傳 { promise: Promise<{ cookies, local, session }>, cancel() }。
 */
/**
 * 用 Windows 無障礙介面（UI Automation）把帳號、密碼填進 Chrome 的登入表單（tools/fill-login.ps1）。
 * 不搶游標、不模擬鍵盤，也不是 DevTools，人機驗證不受影響（2026-11-21 實測：填完驗證照樣「成功」、登入鈕變成可按）。
 * 密碼從標準輸入傳給腳本，不放在命令列。回傳腳本最後一行：OK、NOFORM（沒看到登入表單，多半是已經登入了）、ERROR …
 */
function fillLogin(pid, username, password) {
  const script = path.join(__dirname, "tools", "fill-login.ps1").replace("app.asar", "app.asar.unpacked");
  return new Promise((resolve) => {
    const ps = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-ProcessId", String(pid), "-User", username],
      { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    let out = "";
    ps.stdout.on("data", (d) => (out += d.toString("utf8")));
    ps.on("error", (e) => resolve(`ERROR ${e.message}`));
    ps.on("exit", () => resolve(out.trim().split(/\r?\n/).pop() || "ERROR 沒有回應"));
    ps.stdin.end(`${password || ""}\n`);
  });
}

function loginWithBrowser({ url, origin, userDataDir, onStatus = () => {}, fill }) {
  const exe = findBrowser();
  if (!exe) return { promise: Promise.reject(new Error("找不到 Chrome 或 Edge")), cancel() {} };
  fs.mkdirSync(userDataDir, { recursive: true });
  const proc = spawn(exe, [
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--new-window",
    "--mute-audio", // 只是用來登入，不用聽遊戲音樂
    url,
  ], { stdio: "ignore", windowsHide: false });
  let cancelled = false;
  const promise = new Promise((resolve, reject) => {
    proc.on("error", reject);
    proc.on("exit", async () => {
      if (cancelled) return reject(new Error("取消了"));
      onStatus("讀取登入狀態中…");
      try {
        await sleep(1500); // 等瀏覽器把 Cookie 寫回硬碟
        const got = await readProfile(exe, userDataDir, origin);
        if (!got.cookies.length) throw new Error("沒有讀到登入資料，可能還沒登入就把視窗關掉了");
        resolve(got);
      } catch (e) {
        reject(e);
      }
    });
  });
  if (fill?.username) {
    onStatus(`已開啟 Chrome，幫你填「${fill.username}」中…`);
    fillLogin(proc.pid, fill.username, fill.password).then((r) => {
      if (cancelled) return;
      if (r === "OK") onStatus(`帳號密碼填好了：請在 Chrome 勾人機驗證、按「登入」，進到遊戲後關掉 Chrome（或對我按右鍵「登入好了」）`);
      else if (r === "NOFORM") onStatus("Chrome 裡沒有出現登入畫面（可能已經登入了）：確認是要掛機的帳號後，關掉 Chrome（或對我按右鍵「登入好了」）");
      else onStatus(`沒辦法幫你填（${r.replace(/^ERROR\s*/, "")}），請自己輸入帳號密碼登入，進到遊戲後關掉 Chrome`);
    });
  } else onStatus("已開啟 Chrome：登入要掛機的帳號（要換帳號就先在遊戲裡登出），進到遊戲後把這個 Chrome 視窗關掉");
  return {
    promise,
    cancel() {
      cancelled = true;
      proc.kill();
    },
    /** 玩家說登入好了：幫他把 Chrome 正常關掉（不是強制結束，Cookie 才會寫回硬碟），之後照關視窗的流程接手。 */
    done() {
      // 只對主程序送關閉（不加 /T：子程序不能這樣關，會整個失敗；主視窗關了子程序自己會結束）
      spawn("taskkill", ["/PID", String(proc.pid)], { stdio: "ignore", windowsHide: true });
    },
  };
}

module.exports = { loginWithBrowser, findBrowser, readProfile, fillLogin };
