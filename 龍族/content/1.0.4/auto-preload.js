const { contextBridge, ipcRenderer } = require("electron");

// 自動補給與合成的設定視窗（ui/auto.html）
contextBridge.exposeInMainWorld("autoApi", {
  get: () => ipcRenderer.invoke("auto:get"),
  set: (settings) => ipcRenderer.send("auto:set", settings),
  onStatus: (cb) => ipcRenderer.on("auto:status", (_e, status) => cb(status)),
});
