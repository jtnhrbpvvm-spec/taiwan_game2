const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pickerApi", {
  list: () => ipcRenderer.invoke("picker:list"),
  getSprite: (model) => ipcRenderer.invoke("pet:sprite", model, true),
  // model 是 null＝跟著目前角色的職業
  choose: (model) => ipcRenderer.send("picker:choose", model),
  // 整隻調色 { hue, sat, light }；save＝拉條放開了，可以寫進設定
  setColor: (color, save) => ipcRenderer.send("picker:color", color, save),
});
