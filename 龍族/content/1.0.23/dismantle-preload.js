const { contextBridge, ipcRenderer } = require("electron");

// 分解視窗（ui/dismantle.html）：素材資料直接從 codex-data.js 讀，這裡拿設定、背包清單，存設定、馬上分解
contextBridge.exposeInMainWorld("dismantleApi", {
  get: () => ipcRenderer.invoke("dismantle:get"),
  set: (cfg) => ipcRenderer.invoke("dismantle:set", cfg),
  run: (cfg) => ipcRenderer.invoke("dismantle:run", cfg),
});
