const { contextBridge, ipcRenderer } = require("electron");

// 小百科（ui/codex.html）：裝備資料直接從 codex-data.js 讀，這裡拿目前角色的能力、設定配點目標
contextBridge.exposeInMainWorld("codexApi", {
  char: () => ipcRenderer.invoke("codex:char"),
  // itemNo＝設成配點目標；null＝取消目前目標
  setTarget: (itemNo) => ipcRenderer.invoke("codex:set-target", itemNo),
});
