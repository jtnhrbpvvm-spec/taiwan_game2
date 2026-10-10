const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("incomeApi", {
  get: () => ipcRenderer.invoke("income:get"),
  getItemAtlas: () => ipcRenderer.invoke("pet:item-atlas"),
  onTab: (cb) => ipcRenderer.on("income:tab", (_e, tab) => cb(tab)),
});