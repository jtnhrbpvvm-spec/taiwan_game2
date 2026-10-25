const { contextBridge, ipcRenderer } = require("electron");

// 每隻桌寵各掛一個帳號，狀態、事件、提示都帶著「第幾隻」（index）
contextBridge.exposeInMainWorld("petApi", {
  getSprite: (model) => ipcRenderer.invoke("pet:sprite", model),
  onState: (cb) => ipcRenderer.on("pet:state", (_e, index, state) => cb(index, state)),
  // 每一隻桌寵的外觀（陣列長度＝桌寵數量）
  onPets: (cb) => ipcRenderer.on("pet:pets", (_e, models) => cb(models)),
  onFocusShow: (cb) => ipcRenderer.on("pet:focus-show", (_e, show) => cb(show)),
  onNormalShow: (cb) => ipcRenderer.on("pet:normal-show", (_e, show) => cb(show)),
  // 每一隻桌寵的調色（沒調是 null）
  onColors: (cb) => ipcRenderer.on("pet:colors", (_e, colors) => cb(colors)),
  onStay: (cb) => ipcRenderer.on("pet:stay", (_e, on) => cb(on)),
  onEvents: (cb) => ipcRenderer.on("pet:events", (_e, index, events) => cb(index, events)),
  // 程式要提醒的事（例如登入失敗），從那一隻頭上冒出來
  onNotice: (cb) => ipcRenderer.on("pet:notice", (_e, index, text) => cb(index, text)),
  // 更新提醒：第一隻頭上跳出對話框（勿擾時主程式不會送）
  onSay: (cb) => ipcRenderer.on("pet:say", (_e, text) => cb(text)),
  onClickThrough: (cb) => ipcRenderer.on("pet:click-through", (_e, on) => cb(on)),
  onOpenSizer: (cb) => ipcRenderer.on("pet:open-sizer", (_e, index) => cb(index)),
  setInteractive: (on) => ipcRenderer.send("pet:interactive", on),
  // index＝第幾隻桌寵的遊戲視窗
  toggleGame: (index) => ipcRenderer.send("pet:toggle-game", index),
  // index＝對第幾隻桌寵按的右鍵
  showMenu: (index) => ipcRenderer.send("pet:menu", index),
});
