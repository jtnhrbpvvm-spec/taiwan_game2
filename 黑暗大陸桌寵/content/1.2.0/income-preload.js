const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("incomeApi", {
  // { pets: [{ index, account, startedAt, updatedAt, character, exp, levels, gold, kills, deaths, soldGold, obtained, sold }], classes }
  get: () => ipcRenderer.invoke("income:get"),
});
