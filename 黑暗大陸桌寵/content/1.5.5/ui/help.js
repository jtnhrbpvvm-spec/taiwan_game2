// 操作說明視窗。標題「黑暗大陸桌寵」連點 TAPS 下（每下間隔不超過 TAP_GAP_MS）＝打開右鍵選單裡藏起來的「回報效能異常」。
// 這是給開發者請特定玩家回報用的備用機制，說明裡不寫（使用者 2026-10-29 指定）。
const TAPS = 20;
const TAP_GAP_MS = 1500;

let taps = 0;
let lastTap = 0;
document.querySelector("h1").addEventListener("click", () => {
  const now = Date.now();
  taps = now - lastTap > TAP_GAP_MS ? 1 : taps + 1;
  lastTap = now;
  if (taps === TAPS) window.helpApi?.unlock();
});
