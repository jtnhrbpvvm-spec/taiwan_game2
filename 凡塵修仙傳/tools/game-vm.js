// 在 Node vm 裡載入遊戲本體的程式（照 index.html 的順序），用來比對攻略頁的計算
const fs = require("fs"), path = require("path"), vm = require("vm");
const GAME = process.env.FANCHEN_GAME || path.resolve(__dirname, "../../../idle-lineage-class/-username-.github.io-");   // 遊戲原始碼的本機位置，可用環境變數 FANCHEN_GAME 指定
function load() {
  const html = fs.readFileSync(path.join(GAME, "index.html"), "utf8");
  const files = [...html.matchAll(/<script src="(data\/[^"?]+)/g)].map(m => m[1]);
  const el = () => new Proxy(function () {}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "style" || k === "classList" || k === "dataset" ? el() : k === "length" ? 0 : k === "children" || k === "childNodes" ? [] : k === "value" || k === "innerHTML" || k === "innerText" || k === "textContent" ? "" : el(),
    set: () => true, apply: () => el(), construct: () => el()
  });
  const store = {};
  const sb = {
    console: { log() {}, warn() {}, error() {}, info() {} }, Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Map, Set, Promise, Symbol, Error, parseInt, parseFloat, isNaN, isFinite, Intl, Proxy, Reflect,
    setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    document: new Proxy({}, { get: (t, k) => k === "querySelectorAll" || k === "getElementsByClassName" || k === "getElementsByTagName" ? () => [] : k === "readyState" ? "complete" : k === "hidden" ? false : k === "cookie" ? "" : el(), set: () => true }),
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    navigator: { userAgent: "node", language: "zh-TW", onLine: false }, location: { href: "http://x/", search: "", hash: "", protocol: "http:", hostname: "x", reload() {} },
    addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    innerWidth: 400, innerHeight: 800, devicePixelRatio: 1, screen: { width: 400, height: 800 }, performance: { now: () => Date.now() },
    alert() {}, confirm: () => true, fetch: () => Promise.reject(new Error("no net")), Image: function () { return el(); }, Audio: function () { return el(); },
    history: { pushState() {}, replaceState() {} }, getComputedStyle: () => el(), crypto: { getRandomValues: a => a, subtle: {} }, TextEncoder, TextDecoder, URL, URLSearchParams, btoa: s => Buffer.from(s, "binary").toString("base64"), atob: s => Buffer.from(s, "base64").toString("binary")
  };
  sb.window = sb; sb.self = sb; sb.globalThis = sb; sb.top = sb; sb.parent = sb;
  const ctx = vm.createContext(sb);
  const errs = [];
  files.forEach(f => { try { vm.runInContext(fs.readFileSync(path.join(GAME, f), "utf8"), ctx, { filename: f }); } catch (e) { errs.push(f + ": " + e.message); } });
  return { ctx, errs, files, run: code => vm.runInContext(code, ctx) };
}
module.exports = { load, GAME };
if (require.main === module) {
  const g = load();
  console.log("files", g.files.length, "errors", g.errs.length); g.errs.forEach(e => console.log("  " + e));
  console.log(g.run(`typeof getPlayerCombatAttrs + " " + typeof player + " " + typeof createNewPlayer + " " + typeof getDefaultPlayer + " " + typeof NUMERIC_V2`));
  console.log(g.run(`Object.keys(typeof player==='object'&&player?player:{}).slice(0,80).join(",")`));
}
