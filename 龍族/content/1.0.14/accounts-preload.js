const { contextBridge, ipcRenderer } = require("electron");

// 帳號管理視窗（ui/accounts.html）。密碼只往主程式送（加密存起來），不會從主程式拿回來
contextBridge.exposeInMainWorld("accountsApi", {
  list: () => ipcRenderer.invoke("accounts:list"),
  save: (account) => ipcRenderer.invoke("accounts:save", account),
  remove: (id) => ipcRenderer.invoke("accounts:remove", id),
  use: (id) => ipcRenderer.invoke("accounts:use", id),
  login: (id) => ipcRenderer.invoke("accounts:login", id),
  close: (id) => ipcRenderer.invoke("accounts:close", id),
  showGame: (id) => ipcRenderer.invoke("accounts:show-game", id),
  finishLogin: (id) => ipcRenderer.invoke("accounts:finish-login", id),
  onChanged: (cb) => ipcRenderer.on("accounts:changed", (_e, info) => cb(info)),
});
