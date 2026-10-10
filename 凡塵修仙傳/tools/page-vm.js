// 在 Node vm 裡載入「屬性與技能.html」的程式（dmg.js＋頁面內的 <script>，DOM 用假物件），讓驗算工具直接呼叫頁面的 analyze／hPlayer／stCalc
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
function loadPage() {
  const html = fs.readFileSync(path.join(ROOT, "屬性與技能.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const el = () => new Proxy(function () {}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "style" || k === "classList" || k === "dataset" ? el() : k === "length" ? 0 : k === "children" || k === "childNodes" || k === "options" ? [] : k === "value" || k === "innerHTML" || k === "innerText" || k === "textContent" ? "" : k === "checked" || k === "hidden" ? false : el(),
    set: () => true, apply: () => el(), construct: () => el()
  });
  const sb = { console: { log() {}, warn() {}, error() {}, info() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    document: new Proxy({}, { get: (t, k) => k === "querySelectorAll" || k === "getElementsByClassName" ? () => [] : k === "readyState" ? "complete" : el(), set: () => true }),
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { userAgent: "node", clipboard: {} }, location: { href: "http://x/", search: "", hash: "", pathname: "/", origin: "http://x" }, history: { replaceState() {} },
    addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), fetch: () => Promise.reject(new Error("no net")),
    TextEncoder, TextDecoder, URL, URLSearchParams, atob: s => Buffer.from(s, "base64").toString("binary"), btoa: s => Buffer.from(s, "binary").toString("base64"), innerWidth: 400, innerHeight: 800 };
  sb.window = sb; sb.self = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb), errs = [];
  const run = (code, name) => { try { vm.runInContext(code, ctx, { filename: name }); } catch (e) { errs.push(name + ": " + e.message); } };
  run(fs.readFileSync(path.join(ROOT, "dmg.js"), "utf8"), "dmg.js");
  scripts.forEach((s, i) => run(s, "page#" + i));
  return { errs, run: code => vm.runInContext(code, ctx) };
}
module.exports = { loadPage };
