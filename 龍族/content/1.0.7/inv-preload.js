const { contextBridge, ipcRenderer } = require("electron");

// 物品欄與交易視窗（ui/inv.html）
contextBridge.exposeInMainWorld("invApi", {
  get: () => ipcRenderer.invoke("inv:get"),
  trade: (req) => ipcRenderer.invoke("inv:trade", req),
  cancel: () => ipcRenderer.invoke("inv:cancel"),
  // 自動販售：道具分類清單、改設定（scope＝"global" 或桌寵 key）
  catalog: () => ipcRenderer.invoke("inv:catalog"),
  sellSet: (scope, cfg) => ipcRenderer.invoke("inv:sell-set", scope, cfg),
  onStatus: (cb) => ipcRenderer.on("inv:status", (_e, st) => cb(st)),
});
