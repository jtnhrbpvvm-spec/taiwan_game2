const { contextBridge, ipcRenderer } = require("electron");

// 組隊練功視窗（ui/team.html）
contextBridge.exposeInMainWorld("teamApi", {
  get: () => ipcRenderer.invoke("team:get"),
  start: (req) => ipcRenderer.invoke("team:start", req),
  stop: () => ipcRenderer.invoke("team:stop"),
  onStatus: (cb) => ipcRenderer.on("team:status", (_e, st) => cb(st)),
});
