const { contextBridge, ipcRenderer } = require("electron");

// 組隊練功視窗（ui/team.html）
contextBridge.exposeInMainWorld("teamApi", {
  get: () => ipcRenderer.invoke("team:get"),
  start: (req) => ipcRenderer.invoke("team:start", req),
  stop: () => ipcRenderer.invoke("team:stop"),
  solo: (req) => ipcRenderer.invoke("team:solo", req),
  room: (req) => ipcRenderer.invoke("team:room", req),
  rooms: (req) => ipcRenderer.invoke("team:rooms", req),
  onPreset: (cb) => ipcRenderer.on("team:preset", (_e, p) => cb(p)),
  onStatus: (cb) => ipcRenderer.on("team:status", (_e, st) => cb(st)),
});
