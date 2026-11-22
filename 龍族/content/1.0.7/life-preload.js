const { contextBridge, ipcRenderer } = require("electron");

// 生活技能視窗（ui/life.html）：配方資料直接從 codex-data.js 讀，這裡拿角色的生活技能等級、背包數量、改設定
contextBridge.exposeInMainWorld("lifeApi", {
  get: () => ipcRenderer.invoke("life:get"),
  set: (cfg) => ipcRenderer.invoke("life:set", cfg),
});
