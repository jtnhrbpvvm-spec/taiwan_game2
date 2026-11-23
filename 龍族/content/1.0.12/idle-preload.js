const { contextBridge, ipcRenderer } = require("electron");

// 掛機設置視窗（ui/idle.html）：照遊戲「設置」頁，讀寫都轉給遊戲網頁裡遊戲自己的設定函式
contextBridge.exposeInMainWorld("idleApi", {
  get: () => ipcRenderer.invoke("idle:get"),
  set: (key, value) => ipcRenderer.invoke("idle:set", key, value),
  share: (on) => ipcRenderer.invoke("idle:share", on),
});
