const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petsApi", {
  // { accounts:[{id,label,email,hasPass}], pets:[{ index, account|null }]（開著的）, max, autoContinue }；不會送出密碼
  get: () => ipcRenderer.invoke("pets:get"),
  // 跟帳號管理一樣：{ label, email, password } → { id } 或 { error }
  saveAccount: (account) => ipcRenderer.invoke("accounts:save", account),
  // { accounts:[要開的帳號 id], guests:[要留著的訪客是第幾隻], newGuest } → { started, stopped } 或 { error }
  apply: (choice) => ipcRenderer.invoke("pets:apply", choice),
});
