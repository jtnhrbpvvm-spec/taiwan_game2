const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pickerApi", {
  list: () => ipcRenderer.invoke("picker:list"),
  getSprite: (model) => ipcRenderer.invoke("pet:sprite", model),
  // model 傳 null＝改回「跟著目前在打的怪物」
  choose: (model) => ipcRenderer.send("picker:choose", model),
  // 整隻調色 { hue, sat, light }；save＝拉條放開了，可以寫進設定檔
  setColor: (color, save) => ipcRenderer.send("picker:color", color, save),
});
