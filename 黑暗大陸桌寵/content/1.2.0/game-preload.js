// 遊戲視窗的 preload：讓遊戲以為自己一直被看著。
//
// 遊戲偵測到分頁被藏起來（document.hidden）會先存檔，分頁在背景被瀏覽器暫停太久時會改成離線結算（要扣鑽石）。
// 桌寵的遊戲視窗平常就是藏著、計時器也照常跑，讓遊戲當成一直開在前景、正常掛機。
const { webFrame } = require("electron");

webFrame.executeJavaScript(`(() => {
  Object.defineProperty(Document.prototype, "hidden", { get: () => false, configurable: true });
  Object.defineProperty(Document.prototype, "visibilityState", { get: () => "visible", configurable: true });
  document.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
})()`);
