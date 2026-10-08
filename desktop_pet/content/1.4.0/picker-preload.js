const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pickerApi", {
  list: () => ipcRenderer.invoke("picker:list"),
  getSprite: (model) => ipcRenderer.invoke("pet:sprite", model),
  // model 傳 null＝改回「跟著目前在打的怪物」
  choose: (model) => ipcRenderer.send("picker:choose", model),
});
