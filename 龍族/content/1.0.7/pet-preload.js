const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petApi", {
  // 角色圖（assets/players/…），回傳 bytes；主程式會存在本機
  getAsset: (rel) => ipcRenderer.invoke("pet:asset", rel),
  // 紙娃娃對照表、圖層順序、動作格表（art.json）
  getArt: () => ipcRenderer.invoke("pet:art"),
  // 滑鼠移上去要顯示的角色狀態
  onState: (cb) => ipcRenderer.on("pet:state", (_e, state) => cb(state)),
  onPosition: (cb) => ipcRenderer.on("pet:position", (_e, ratio) => cb(ratio)),
  // 外觀：性別、身上裝備（物品編號）、膚色和衣服顏色
  onLook: (cb) => ipcRenderer.on("pet:look", (_e, look) => cb(look)),
  // 升級、經驗、金幣、撿到東西
  onEvents: (cb) => ipcRenderer.on("pet:events", (_e, events) => cb(events)),
  onNotice: (cb) => ipcRenderer.on("pet:notice", (_e, text) => cb(text)),
  onSize: (cb) => ipcRenderer.on("pet:size", (_e, size) => cb(size)),
  onStay: (cb) => ipcRenderer.on("pet:stay", (_e, on) => cb(on)),
  onClickThrough: (cb) => ipcRenderer.on("pet:click-through", (_e, on) => cb(on)),
  setInteractive: (on) => ipcRenderer.send("pet:interactive", on),
  toggleGame: () => ipcRenderer.send("pet:toggle-game"),
  showMenu: () => ipcRenderer.send("pet:menu"),
});
