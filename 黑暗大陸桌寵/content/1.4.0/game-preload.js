// 遊戲視窗的 preload：讓遊戲以為自己一直被看著（document.hidden 永遠是 false）。
//
// 遊戲在 document.hidden 時會停掉地圖畫面的 sceneUpdate，而大地圖上找怪、走過去打、生怪都靠它——
// 回報「在背景」的話角色照樣掛著，卻不會掉東西（使用者 2026-10-26 回報）。所以不管什麼模式都一律回報「看得見」。
//
// 節約效能模式（main.js 的 setLowRes）只做一件事：遊戲視窗藏著時，把 devicePixelRatio 回報成 0.5，
// 遊戲的地圖畫布就照這個縮小（ui-scene.js sceneFrame 每一格依 devicePixelRatio 設定畫布大小），要畫的像素少很多；
// 遊戲邏輯（sceneUpdate、找怪、戰鬥、掉寶）完全照常。叫出遊戲時改回真的數值，下一格畫面就恢復清晰。不改遊戲任何程式。
const { webFrame } = require("electron");

webFrame.executeJavaScript(`(() => {
  Object.defineProperty(Document.prototype, "hidden", { get: () => false, configurable: true });
  Object.defineProperty(Document.prototype, "visibilityState", { get: () => "visible", configurable: true });
  document.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
  const real = Object.getOwnPropertyDescriptor(window, "devicePixelRatio") || Object.getOwnPropertyDescriptor(Window.prototype, "devicePixelRatio");
  let lowRes = false;
  Object.defineProperty(window, "devicePixelRatio", { get: () => (lowRes ? 0.5 : real.get.call(window)), configurable: true });
  Object.defineProperty(window, "__petLowRes", { value: (on) => (lowRes = !!on) });
})()`);
