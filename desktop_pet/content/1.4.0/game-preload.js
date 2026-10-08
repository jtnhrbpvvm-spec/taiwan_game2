// 遊戲視窗的 preload：讓遊戲永遠以為自己「看得見」。
//
// 遊戲偵測到分頁被隱藏（document.hidden）會主動把掛機停掉，等回來再一次補算。
// 桌寵要的是藏起來也即時在跑，所以把這個偵測蓋掉；實測沒蓋的話視窗一縮小／被藏起來進度就停在原地。
const { webFrame } = require("electron");

webFrame.executeJavaScript(`(() => {
  Object.defineProperty(Document.prototype, "hidden", { get: () => false, configurable: true });
  Object.defineProperty(Document.prototype, "visibilityState", { get: () => "visible", configurable: true });
  document.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
})()`);
