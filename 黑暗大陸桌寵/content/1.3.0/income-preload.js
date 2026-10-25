const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("incomeApi", {
  // { pets: [{ index, account, startedAt, updatedAt, character, exp, levels, gold, kills, deaths, soldGold, obtained, sold, here }], classes }
  // here＝角色現在在哪（存檔的 loc：{ type, id, floor }），標題畫面時是 null
  get: () => ipcRenderer.invoke("income:get"),
  // 「目前地圖」的「看攻略」：用瀏覽器開攻略網站
  openGuide: (url) => ipcRenderer.send("income:open-guide", url),
});
