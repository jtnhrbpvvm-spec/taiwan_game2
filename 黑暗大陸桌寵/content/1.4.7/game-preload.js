// 遊戲視窗的 preload：讓遊戲以為自己一直被看著（document.hidden 永遠是 false）。
//
// 遊戲在 document.hidden 時會停掉地圖畫面的 sceneUpdate，而大地圖上找怪、走過去打、生怪都靠它——
// 回報「在背景」的話角色照樣掛著，卻不會掉東西（使用者 2026-10-26 回報）。所以不管什麼模式都一律回報「看得見」。
//
// 節約效能模式（main.js 的 setLowRes）只做一件事：遊戲視窗藏著時，把 devicePixelRatio 回報成 0.5，
// 遊戲的地圖畫布就照這個縮小（ui-scene.js sceneFrame 每一格依 devicePixelRatio 設定畫布大小），要畫的像素少很多；
// 遊戲邏輯（sceneUpdate、找怪、戰鬥、掉寶）完全照常。叫出遊戲時改回真的數值，下一格畫面就恢復清晰。不改遊戲任何程式。
//
// 螢幕保護程式、鎖定畫面、螢幕關掉時 Windows 不再送畫面更新，requestAnimationFrame 整個停住，地圖迴圈跟著停
// （使用者 2026-10-27 回報螢幕保護程式一開桌寵就凍結）。所以每次 requestAnimationFrame 都另外排一個 RAF_STALL_MS 的計時器，
// 畫面更新沒來就由計時器代跑那一格（一秒約 20 格）；平常畫面更新幾毫秒就到，計時器不會用到。
const { webFrame } = require("electron");

webFrame.executeJavaScript(`(() => {
  Object.defineProperty(Document.prototype, "hidden", { get: () => false, configurable: true });
  Object.defineProperty(Document.prototype, "visibilityState", { get: () => "visible", configurable: true });
  document.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
  const real = Object.getOwnPropertyDescriptor(window, "devicePixelRatio") || Object.getOwnPropertyDescriptor(Window.prototype, "devicePixelRatio");
  let lowRes = false;
  Object.defineProperty(window, "devicePixelRatio", { get: () => (lowRes ? 0.5 : real.get.call(window)), configurable: true });
  Object.defineProperty(window, "__petLowRes", { value: (on) => (lowRes = !!on) });
  const RAF_STALL_MS = 50;
  const realRaf = window.requestAnimationFrame.bind(window), realCancel = window.cancelAnimationFrame.bind(window);
  const pending = new Map();
  let nextId = 1;
  const drop = (id) => {
    const p = pending.get(id);
    if (!p) return undefined;
    pending.delete(id);
    realCancel(p.raf);
    clearTimeout(p.timer);
    return p;
  };
  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    const run = (t) => drop(id) && cb(t);
    pending.set(id, { raf: realRaf(run), timer: setTimeout(() => run(performance.now()), RAF_STALL_MS) });
    return id;
  };
  window.cancelAnimationFrame = (id) => void drop(id);
})()`);
