const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("helpApi", {
  // 標題點滿次數：打開右鍵選單裡藏起來的項目（見 ui/help.js）
  unlock: () => ipcRenderer.send("help:unlock"),
});
