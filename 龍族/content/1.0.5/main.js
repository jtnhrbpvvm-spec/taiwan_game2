"use strict";
const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, globalShortcut } = require("electron");
const fs = require("fs");
const path = require("path");
const accounts = require("./accounts");
const createCompanion = require("./companion");
const MAX_PETS = 5;
const pets = new Map();
let tray, accountsWin, selected = null, quitting = false;
let lastInfo;
let snapTimer;
const rosterFile = () => path.join(app.getPath("userData"), "active-pets.json");
const owner = e => [...pets.values()].find(p => p.owns(e.sender));
const activePet = () => pets.get(selected) || pets.values().next().value;
function saveRoster() { fs.writeFileSync(rosterFile(), JSON.stringify([...pets.keys()])); }
function accountsInfo() {
  return { accounts: accounts.all(), pets: [...pets.values()].map(p => p.info()), maxPets: MAX_PETS };
}
function changed() {
  if (quitting) return;
  const info = accountsInfo();
  const key = JSON.stringify(info);
  if (key !== lastInfo) accountsWin?.webContents.send("accounts:changed", info);
  lastInfo = key;
  tray?.setToolTip(`龍族桌寵（${pets.size}/${MAX_PETS}）`);
}
function closePet(id) {
  const pet = pets.get(id);
  if (!pet) return;
  pets.delete(id); pet.dispose(); saveRoster(); changed();
  if (!pets.size && !quitting) openAccounts();
}
function openPet(id, restoring = false) {
  if (id !== null && !accounts.find(id)) throw new Error("找不到這個帳號");
  const existing = pets.get(id);
  if (existing) { selected = id; existing.show(); return existing; }
  if (pets.size >= MAX_PETS) throw new Error("最多同時開啟五隻桌寵，請先關閉其中一隻");
  if (!restoring && id !== null && pets.size === 1 && pets.has(null) && !pets.get(null).info().character) {
    pets.get(null).dispose(); pets.delete(null);
  }
  const usedSlots = new Set([...pets.values()].map(p => p.slot));
  const slot = [0, 1, 2, 3, 4].find(n => !usedSlots.has(n));
  const pet = createCompanion({ accountId: id, slot, onChange: changed, onClose: () => closePet(id), managerMenu });
  pet.slot = slot; pets.set(id, pet); selected = id;
  pet.start(); saveRoster(); changed();
  return pet;
}
// 外殼（boot.js）給的自動更新；直接用 electron main.js 跑的舊方式沒有外殼，就沒有更新
const shell = global.petShell;
function managerMenu() {
  return [
    ...(shell ? [shell.updates.menuItem()] : []),
    { label: `帳號與桌寵管理（${pets.size}/${MAX_PETS}）…`, click: openAccounts },
    { label: "其他桌寵", enabled: !!pets.size, submenu: [...pets.values()].map(p => ({
      label: `${p.info().label}${p.info().character ? `・${p.info().character}` : ""}`,
      click: () => { selected = p.accountId; p.show(); p.toggleGame(); },
    })) },
  ];
}
function openAccounts() {
  if (accountsWin && !accountsWin.isDestroyed()) { accountsWin.show(); accountsWin.focus(); return; }
  accountsWin = new BrowserWindow({
    width: 760, height: 700, minWidth: 650, title: "多帳號與桌寵管理", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "accounts-preload.js") },
  });
  accountsWin.loadFile(path.join(__dirname, "ui", "accounts.html"));
  accountsWin.on("closed", () => { accountsWin = undefined; });
}
const fromAccounts = e => accountsWin && !accountsWin.isDestroyed() && e.sender === accountsWin.webContents;
function accountAction(name, action) {
  ipcMain.handle(name, (e, value) => {
    if (!fromAccounts(e)) return { error: "not allowed" };
    try { const extra = action(value) || {}; changed(); return { ...extra, ...accountsInfo() }; }
    catch (err) { return { error: err.message, ...accountsInfo() }; }
  });
}
accountAction("accounts:list", () => ({}));
accountAction("accounts:save", a => {
  const existing = a?.id && accounts.find(a.id);
  if (existing && pets.has(a.id) && existing.username.toLowerCase() !== String(a.username).trim().toLowerCase()) {
    throw new Error("請先關閉這個帳號的桌寵，再修改登入帳號");
  }
  return { ok: true, account: accounts.upsert(a || {}) };
});
accountAction("accounts:remove", id => { closePet(id); accounts.remove(id); });
accountAction("accounts:use", id => { openPet(id); });
accountAction("accounts:close", id => { closePet(id); });
accountAction("accounts:login", id => { openPet(id).login(); });
accountAction("accounts:finish-login", id => { pets.get(id)?.finishLogin(); });
accountAction("accounts:show-game", id => { const p = openPet(id); selected = id; p.toggleGame(); });

// 依來源視窗路由，遊戲和桌寵的訊息只能影響自己的帳號。
for (const name of ["game:state", "game:auto-log", "game:pending-storage", "game:saved-prefs", "game:prefs", "auto:set", "pet:interactive", "pet:toggle-game", "pet:menu"]) {
  ipcMain.on(name, (e, ...args) => {
    const p = owner(e);
    if (!p) { if (name === "game:pending-storage" || name === "game:saved-prefs") e.returnValue = null; return; }
    if (name === "pet:menu" || name === "pet:toggle-game") selected = p.accountId;
    p.events.get(name)?.(e, ...args);
  });
}
for (const name of ["auto:get", "idle:get", "idle:set", "idle:share", "pet:asset", "pet:art"]) {
  ipcMain.handle(name, (e, ...args) => owner(e)?.handlers.get(name)?.(e, ...args));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", openAccounts);
  app.whenReady().then(() => {
    accounts.load();
    let roster;
    try { roster = JSON.parse(fs.readFileSync(rosterFile(), "utf8")); } catch {}
    if (!Array.isArray(roster)) {
      let old;
      try { old = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "pet-settings.json"), "utf8")); } catch {}
      roster = [old?.account && accounts.find(old.account) ? old.account : null];
      if (old && roster[0]) {
        const dest = path.join(app.getPath("userData"), `pet-settings-${roster[0]}.json`);
        if (!fs.existsSync(dest)) fs.writeFileSync(dest, JSON.stringify(old));
      }
    }
    // 剛啟動只開一隻：帳號清單裡的第一個帳號（不寫死哪個帳號，給其他玩家用也一樣；清單沒有帳號才用上次開著的）；
    // 要多開由玩家自己到「帳號與桌寵管理」一隻一隻加（使用者 2026-11-21 指定）
    const main = accounts.all()[0]?.id;
    const first = main ?? [...new Set(roster)].find(id => id === null || accounts.find(id));
    if (first !== undefined) openPet(first, true);
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, "build", "icon.png")).resize({ width: 16, height: 16 }));
    const trayMenu = () => Menu.buildFromTemplate([
      ...managerMenu(), { type: "separator" },
      ...[...pets.values()].map(p => ({ label: p.info().label, submenu: p.menu() })),
      { type: "separator" }, { label: "結束全部桌寵", click: () => app.quit() },
    ]);
    tray.on("click", openAccounts);
    tray.on("right-click", () => tray.popUpContextMenu(trayMenu()));
    globalShortcut.register("Control+Alt+R", () => activePet()?.toggleGame());
    globalShortcut.register("Control+Alt+P", () => activePet()?.focusMode());
    changed();
    if (shell) {
      // 更新的消息由目前選到的那隻桌寵講
      shell.updates.start({ say: (text) => activePet()?.say(text) });
      // 啟動 20 秒還好好的：告訴外殼這一份內容能跑（新下載的版本才不會被當成壞的退回去）
      setTimeout(() => { if (!quitting) shell.markHealthy(); }, 20000);
    }
    if (!pets.size || process.argv.includes("--accounts")) openAccounts();
    if (process.argv.includes("--show-game")) activePet()?.toggleGame();
    if (process.argv.includes("--open-auto")) activePet()?.openAutoSettings();
    if (process.argv.includes("--open-idle")) activePet()?.openIdleSettings();
    if (process.argv.includes("--login")) activePet()?.login();
    if (process.argv.includes("--snap")) {
      let capturing = false;
      snapTimer = setInterval(async () => {
        if (capturing || quitting) return;
        capturing = true;
        try {
          const dir = app.getPath("userData");
          let first = true;
          for (const p of pets.values()) {
            await p.snapshot(dir, `-${p.accountId || "legacy"}`);
            if (first) { await p.snapshot(dir); first = false; }
          }
          if (accountsWin) fs.writeFileSync(path.join(dir, "snap-accounts.png"), (await accountsWin.webContents.capturePage()).toPNG());
        } catch (err) { console.error("snap", err.message); }
        finally { capturing = false; }
      }, 10000);
    }
  });
}
app.on("before-quit", () => { quitting = true; clearInterval(snapTimer); for (const p of pets.values()) p.dispose(); });
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => {});
