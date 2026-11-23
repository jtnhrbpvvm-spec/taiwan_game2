const { contextBridge, ipcRenderer } = require("electron");

// 對話視窗（ui/chat.html）：讀遊戲聊天紀錄、收新訊息、發話
contextBridge.exposeInMainWorld("chatApi", {
  get: () => ipcRenderer.invoke("chat:get"),
  send: (text, ch, to) => ipcRenderer.invoke("chat:send", { text, ch, to }),
  onNew: (fn) => ipcRenderer.on("chat:new", (_e, entry) => fn(entry)),
});
