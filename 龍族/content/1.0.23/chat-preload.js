const { contextBridge, ipcRenderer } = require("electron");

// 對話視窗（ui/chat.html）：讀遊戲聊天紀錄、收新訊息、發話；表情、快捷語、貼道具、看別人貼的道具（遊戲 beta-v1.2.2989）
contextBridge.exposeInMainWorld("chatApi", {
  get: () => ipcRenderer.invoke("chat:get"),
  send: (text, ch, to) => ipcRenderer.invoke("chat:send", { text, ch, to }),
  extras: () => ipcRenderer.invoke("chat:extras"),
  emote: (no) => ipcRenderer.invoke("chat:emote", no),
  say: (i) => ipcRenderer.invoke("chat:say", i),
  postItem: (where, index, ch, to) => ipcRenderer.invoke("chat:item", { where, index, ch, to }),
  detail: (item, owner) => ipcRenderer.invoke("chat:detail", { item, owner }),
  onNew: (fn) => ipcRenderer.on("chat:new", (_e, entry) => fn(entry)),
});
