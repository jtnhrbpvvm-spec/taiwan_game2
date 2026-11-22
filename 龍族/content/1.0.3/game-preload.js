// 遊戲視窗的 preload（contextIsolation 開著、sandbox 關著，才讀得到 game-hook.js）。
//
// 1. 在遊戲程式之前把 game-hook.js 放進網頁（main world），攔遊戲的連線、整理角色狀態。
// 2. 讓遊戲以為自己一直被看著（document.hidden 永遠 false）：遊戲在背景時會暫停畫面（visualsPaused），
//    藏起來的遊戲視窗還是照常收封包、角色狀態照常更新，這只是保險（黑暗大陸桌寵踩過背景不打怪的坑）。
// 3. 遊戲視窗藏起來時，畫面每秒只畫幾格（__rajaPetParked）：打怪是伺服器在算，畫面畫多少格不影響掛機，省 CPU。
// 4. game-hook.js 用 postMessage 送來的狀態轉給主程式。只收同一個網頁送來、帶 __rajaPet 的訊息。
const { webFrame, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const hook = fs.readFileSync(path.join(__dirname, "game-hook.js"), "utf8");
const potionSupply = fs.readFileSync(path.join(__dirname, "potion-supply.js"), "utf8");
// 剛用 Chrome 登入（login-browser.js）：遊戲存在網頁裡的登入設定，要在遊戲程式之前放進去
const pending = ipcRenderer.sendSync("game:pending-storage");
// 桌寵記住的遊戲掛機設定（自動施放、自動喝藥、撿物賣物…），載入時在遊戲程式之前寫回去，見下面 PREF_RE
const savedPrefs = ipcRenderer.sendSync("game:saved-prefs");

webFrame.executeJavaScript(`(() => {
  // 不裝遊戲的 Service Worker：它會把主程式存起來直接用，桌寵在載入時加的那一行（game-patch.js）就不見了
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register = () => Promise.reject(new Error("disabled in desktop pet"));
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    }
  } catch {}
  const pending = ${JSON.stringify(pending)};
  if (pending && location.origin === "https://play.17raja.com") {
    // 換帳號：先把舊帳號留下的登入資料清掉（sessionStorage 重新載入也還在，舊的 token 會蓋過新帳號），再放新的
    const drop = (s, keep) => {
      for (let i = s.length - 1; i >= 0; i--) {
        const k = s.key(i);
        if (k && (k.startsWith("idle") || k.startsWith("rajaPet")) && !(keep && k in keep)) s.removeItem(k);
      }
    };
    drop(sessionStorage);
    drop(localStorage, pending.local || {});
    for (const [k, v] of Object.entries(pending.local || {})) localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(pending.session || {})) sessionStorage.setItem(k, v);
  }
  // 遊戲的掛機設定只存在網頁 localStorage：程式被強制結束時還沒寫進硬碟的會不見，用 Chrome 重新登入也會被 Chrome 裡的舊設定蓋掉。
  // 桌寵自己記一份（存在 pet-settings），每次載入、在遊戲程式讀之前寫回去；遊戲上線時就照這份送給伺服器（setUpkeep／setAutoPotion）
  const savedPrefs = ${JSON.stringify(savedPrefs)};
  if (savedPrefs && location.origin === "https://play.17raja.com") {
    try { for (const [k, v] of Object.entries(savedPrefs)) localStorage.setItem(k, v); } catch {}
  }
  // 自動「接手上次登入」：遊戲的登入 token 放在 sessionStorage（每個分頁各自一份，關掉就沒了），
  // 新分頁打開時登入畫面會有一顆「接手『帳號』／繼續上次登入」按鈕，按下去遊戲做的事（遊戲程式 function yv）就是下面這幾行：
  // 從 localStorage 的 idle:rememberedSession（scope、角色）和 idle:profileLogin（id、帳號）放回 sessionStorage，token 用 "@cookie"。
  // 桌寵每次載入都幫忙做一次，玩家不用每次重開都去按。
  try {
    const rem = JSON.parse(localStorage.getItem("idle:rememberedSession") || "null");
    const prof = JSON.parse(localStorage.getItem("idle:profileLogin") || "null");
    if (rem && /^[a-f0-9]{24}$/.test(rem.scope) && !sessionStorage.getItem("idle:token")) {
      sessionStorage.setItem("idle:token", "@cookie");
      sessionStorage.setItem("idle:sessionScope", rem.scope);
      if (typeof rem.characterId === "string") sessionStorage.setItem("idle:lastCharacter", rem.characterId);
      if (prof && typeof prof.id === "string") sessionStorage.setItem("idle:profileLogin", prof.id);
      if (prof && typeof prof.username === "string") sessionStorage.setItem("idle:profileAccount", prof.username);
    }
  } catch {}
  // 接著上次的房間：遊戲每 30 秒把「現在在哪個房間、自動戰鬥開著沒」存在 sessionStorage 的 idle:resumeRoom，
  // 重新整理網頁時 10 分鐘內會自動回去（遊戲程式 HT／UT）。但桌寵程式整個重開時 sessionStorage 就沒了，角色會回主城，
  // 所以另外抄一份到 localStorage（rajaPet:resumeRoom），載入時放回去；過期與否照遊戲自己的規則判斷。
  try {
    const KEY = "idle:resumeRoom", COPY = "rajaPet:resumeRoom";
    const saved = localStorage.getItem(COPY);
    if (saved && !sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, saved);
    setInterval(() => {
      const v = sessionStorage.getItem(KEY);
      if (v) localStorage.setItem(COPY, v);
    }, 10000);
  } catch {}
})();
(() => {
  Object.defineProperty(Document.prototype, "hidden", { get: () => false, configurable: true });
  Object.defineProperty(Document.prototype, "visibilityState", { get: () => "visible", configurable: true });
  document.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
  // 藏起來時每秒最多畫 PARKED_FPS 格。螢幕保護程式、螢幕關掉時 requestAnimationFrame 會整個停住，也用計時器補上
  const PARKED_FPS = 5;
  const realRaf = window.requestAnimationFrame.bind(window), realCancel = window.cancelAnimationFrame.bind(window);
  let parked = false, nextId = 1;
  const pending = new Map();
  Object.defineProperty(window, "__rajaPetParked", { value: (on) => (parked = !!on) });
  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    const run = (t) => {
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      realCancel(p.raf);
      clearTimeout(p.timer);
      cb(t);
    };
    pending.set(id, parked
      ? { raf: 0, timer: setTimeout(() => run(performance.now()), 1000 / PARKED_FPS) }
      : { raf: realRaf(run), timer: setTimeout(() => run(performance.now()), 100) });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    realCancel(p.raf);
    clearTimeout(p.timer);
  };
})();
${potionSupply}
${hook}`);

window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || typeof e.data !== "object") return;
  if (e.data.__rajaPet) ipcRenderer.send("game:state", e.data.__rajaPet);
  // 自動補給、自動合成做了什麼（game-hook.js 的 log）
  if (e.data.__rajaPetLog) ipcRenderer.send("game:auto-log", e.data.__rajaPetLog);
});

// 遊戲的掛機設定（localStorage）有變就送給主程式存起來：
//   idle:upkeep＝自動施放條件（每格快捷技能）、幫隊友施法、撿物、賣物、修理…；idle:autoPotion／idle:potionPriority＝自動喝藥；
//   idle:junk:<角色>、idle:tracked-affixes:<角色>＝賣物時要留的（跟 upkeep 一起送給伺服器）
const PREF_RE = /^idle:(upkeep|autoPotion|potionPriority|junk:.+|tracked-affixes:.+|sound|soundVolume|music|musicVolume|graphics|effects|shake)$/;
let lastPrefs = "";
function reportPrefs() {
  if (location.origin !== "https://play.17raja.com") return;
  try {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && PREF_RE.test(k)) o[k] = localStorage.getItem(k);
    }
    const json = JSON.stringify(o);
    if (json === lastPrefs || json === "{}") return;
    lastPrefs = json;
    ipcRenderer.send("game:prefs", o);
  } catch {}
}
setInterval(reportPrefs, 3000);
window.addEventListener("beforeunload", reportPrefs);

// 主程式送來的自動補給、合成設定，轉給遊戲網頁裡的 game-hook.js
ipcRenderer.on("auto:settings", (_e, settings, watching, lastHuntMap) => {
  window.postMessage({ __rajaPetCmd: { type: "settings", settings, watching, lastHuntMap } }, location.origin);
});
