const { contextBridge, ipcRenderer } = require("electron");

// 每個呼叫都回傳一個結果物件：出錯是 { error }，使用者自己取消是 { canceled }，其餘看各功能
contextBridge.exposeInMainWorld("savesApi", {
  exportToFile: () => ipcRenderer.invoke("saves:export"),
  pickFile: () => ipcRenderer.invoke("saves:pick-file"),
  makeCode: () => ipcRenderer.invoke("saves:make-code"),
  fetchCode: (code) => ipcRenderer.invoke("saves:fetch-code", code),
  confirmImport: () => ipcRenderer.invoke("saves:confirm-import"),
  cancelImport: () => ipcRenderer.send("saves:cancel-import"),
});
