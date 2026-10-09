const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petApi", {
  getSprite: (model) => ipcRenderer.invoke("pet:sprite", model),
  getItemAtlas: () => ipcRenderer.invoke("pet:item-atlas"),
  onState: (cb) => ipcRenderer.on("pet:state", (_e, state) => cb(state)),
  // 每一隻桌寵的外觀（陣列，長度＝桌寵數量）
  onPets: (cb) => ipcRenderer.on("pet:pets", (_e, models) => cb(models)),
  onAsk: (cb) => ipcRenderer.on("pet:ask", (_e, question) => cb(question)),
  answer: (id, ok) => ipcRenderer.send("pet:answer", { id, ok }),
  onFocusShow: (cb) => ipcRenderer.on("pet:focus-show", (_e, show) => cb(show)),
  onStay: (cb) => ipcRenderer.on("pet:stay", (_e, on) => cb(on)),
  onSay: (cb) => ipcRenderer.on("pet:say", (_e, text) => cb(text)),
  onNotice: (cb) => ipcRenderer.on("pet:notice", (_e, text) => cb(text)),
  onEvents: (cb) => ipcRenderer.on("pet:events", (_e, events) => cb(events)),
  onClickThrough: (cb) => ipcRenderer.on("pet:click-through", (_e, on) => cb(on)),
  onOpenSizer: (cb) => ipcRenderer.on("pet:open-sizer", (_e, index) => cb(index)),
  setInteractive: (on) => ipcRenderer.send("pet:interactive", on),
  toggleGame: () => ipcRenderer.send("pet:toggle-game"),
  // index＝對第幾隻桌寵按的右鍵
  showMenu: (index) => ipcRenderer.send("pet:menu", index),
});
