const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("accountsApi", {
  // { accounts:[{id,label,email,hasPass}], pets:[開著的是第幾隻（0 起算）], petAccounts:[第 i 隻的帳號 id|null], encrypted }；不會送出密碼
  get: () => ipcRenderer.invoke("accounts:get"),
  // { id?, label, email, password? }：password 留空＝沿用原本的；回傳 { id } 或 { error }
  save: (account) => ipcRenderer.invoke("accounts:save", account),
  remove: (id) => ipcRenderer.invoke("accounts:remove", id),
  // 讓第 petIndex 隻改用這個帳號（null＝訪客），會馬上自動登入
  assign: (petIndex, id) => ipcRenderer.send("accounts:assign", petIndex, id),
  openFolder: () => ipcRenderer.send("accounts:open-folder"),
  onChanged: (cb) => ipcRenderer.on("accounts:changed", () => cb()),
});
