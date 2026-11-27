"use strict";
const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, globalShortcut } = require("electron");
const fs = require("fs");
const path = require("path");
const accounts = require("./accounts");
const createCompanion = require("./companion");
const sellRules = require("./sell-rules");
// 匿名啟動計數：每次主程式啟動只回報一次，不含帳號、角色或存檔。
let startupCounted = false;
function countStartup() {
  if (startupCounted || process.env.NODE_ENV === "test" || process.argv.includes("--selftest")) return;
  startupCounted = true;
  try {
    const url = new URL("https://taiwangame2.goatcounter.com/count");
    url.searchParams.set("p", "/程式/龍族桌寵/啟動");
    url.searchParams.set("t", "程式：龍族桌寵啟動");
    url.searchParams.set("e", "true");
    url.searchParams.set("rnd", Math.random().toString(36).slice(2));
    const request = require("https").get(url, { timeout: 5000 }, response => response.resume());
    request.on("timeout", () => request.destroy());
    request.on("error", () => {}); // 離線或計數服務失敗不影響啟動。
    request.on("socket", socket => socket.unref());
  } catch (_) {}
}

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
  if (currentTrade && (currentTrade.fromId === id || currentTrade.toId === id)) endTrade("error", "有一隻桌寵關掉了");
  if (currentTeam && (currentTeam.leaderId === id || currentTeam.memberIds.includes(id))) {
    // 隊長關掉就整隊結束；隊員關掉就把他從名單拿掉
    if (currentTeam.leaderId === id) stopTeam();
    else { currentTeam.memberIds = currentTeam.memberIds.filter((m) => m !== id); saveTeam(); }
  }
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
  const pet = createCompanion({ accountId: id, slot, onChange: changed, onClose: () => closePet(id), managerMenu, onTeamLog: sendTeamStatus, openTeam: (preset) => openTeam({ ...preset, petId: id }) });
  pet.slot = slot; pets.set(id, pet); selected = id;
  pet.start(); pet.setSellGlobal(sellGlobal()); saveRoster(); changed();
  return pet;
}
// 外殼（boot.js）給的自動更新；直接用 electron main.js 跑的舊方式沒有外殼，就沒有更新
const shell = global.petShell;
/** 全部桌寵共用的選單項目，各隻桌寵的右鍵選單照分類拿去放（companion.js buildMenu）。 */
function managerMenu() {
  return {
    update: shell ? shell.updates.menuItem() : null,
    accounts: { label: `帳號與桌寵管理（${pets.size}/${MAX_PETS}）…`, click: openAccounts },
    team: { label: currentTeam ? "組隊／單人練功（進行中）…" : "組隊／單人練功…", enabled: !!pets.size, click: () => openTeam() },
    inv: { label: currentTrade ? "物品欄與交易（交易中）…" : "物品欄與交易…", click: openInv },
    // 「帳號與桌寵管理」放在其他桌寵子選單最上面（使用者 2026-11-23：從登入設定移過來）
    others: { label: "其他桌寵", submenu: [
      { label: `帳號與桌寵管理（${pets.size}/${MAX_PETS}）…`, click: openAccounts },
      ...(pets.size ? [{ type: "separator" }] : []),
      ...[...pets.values()].map(p => ({
        label: `${p.info().label}${p.info().character ? `・${p.info().character}` : ""}`,
        click: () => { selected = p.accountId; p.show(); p.toggleGame(); },
      })),
    ] },
  };
}
/** 系統匣選單用的平鋪版本。 */
function managerList() {
  const m = managerMenu();
  return [m.update, m.team, m.inv, m.others].filter(Boolean); // 帳號與桌寵管理在「其他桌寵」裡
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

// ── 組隊練功（ui/team.html）：指定一隻當隊長、勾選其他桌寵當隊員 ──
// 隊長桌寵建隊、邀請隊員，到齊（最多等 2 分鐘）後帶隊進私人房；隊員桌寵先回主城等邀請、自動接受、跟上隊長的房間，
// 倒下復活、補給完都回同一間（細節在 game-hook.js 的 teamTick）。只放記憶體，重開桌寵就結束。
let teamWin, currentTeam = null, teamTimer;
function teamStatus() {
  return { pets: [...pets.values()].map((p) => p.teamInfo()), team: currentTeam };
}
function sendTeamStatus() {
  if (teamWin && !teamWin.isDestroyed()) teamWin.webContents.send("team:status", teamStatus());
}
/** preset＝從小百科「打怪掉落」點過來：{ petId, mapName, mobName }，帶入那隻桌寵、地圖、怪物（使用者 2026-11-23）。 */
function openTeam(preset) {
  const sendPreset = () => preset && teamWin.webContents.send("team:preset", preset);
  if (teamWin && !teamWin.isDestroyed()) { teamWin.show(); teamWin.focus(); sendPreset(); return; }
  teamWin = new BrowserWindow({
    width: 640, height: 760, title: "組隊練功", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "team-preload.js") },
  });
  teamWin.loadFile(path.join(__dirname, "ui", "team.html"));
  teamWin.webContents.once("did-finish-load", () => setTimeout(sendPreset, 300));
  teamTimer = setInterval(sendTeamStatus, 2000);
  teamWin.on("closed", () => { teamWin = undefined; clearInterval(teamTimer); });
}
const fromTeam = (e) => teamWin && !teamWin.isDestroyed() && e.sender === teamWin.webContents;
function stopTeam() {
  pendingTeam = null;
  if (!currentTeam) { saveTeam(); return; }
  for (const id of [currentTeam.leaderId, ...currentTeam.memberIds]) pets.get(id)?.setTeam(null, true);
  currentTeam = null;
  saveTeam();
}
// ── 組隊存檔：重開桌寵後自動接回（使用者 2026-11-23：重開後隊員顯示「沒有用桌寵組隊」）──
// 開始／換房間／解散都寫 team.json；啟動時讀回來當 pendingTeam，等隊長和開著的隊員都進到遊戲就照原設定重新開始組隊
// （遊戲裡隊伍還在就不會重新邀請，直接回隊伍的房間）。晚開的隊員進到遊戲後自動加回來。
const teamFile = () => path.join(app.getPath("userData"), "team.json");
let pendingTeam = null, savedTeam = null, teamResumeTimer;
function saveTeam() {
  savedTeam = currentTeam ? { ...currentTeam, dest: null } : null;
  try { if (savedTeam) fs.writeFileSync(teamFile(), JSON.stringify(savedTeam)); else fs.rmSync(teamFile(), { force: true }); } catch {}
}
function petReady(id) {
  const p = pets.get(id)?.teamInfo();
  return p && p.status === "ingame" && p.name ? p : null;
}
/** 照存下來的設定開始組隊（leaderId、memberIds 是要帶的隊員；只帶已經進遊戲的）。 */
function applyTeam(t, memberIds) {
  const leader = pets.get(t.leaderId), L = petReady(t.leaderId);
  const map = (L?.huntMaps || []).find((m) => m.id === t.mapId);
  if (!leader || !L || !map) return false;
  const members = memberIds.map(petReady);
  const shared = { mapId: map.id, mob: t.mob || 0, spot: t.spot !== false, room: t.room || { kind: "private", rev: 0 } };
  currentTeam = { ...t, memberIds, mapName: map.name, dest: null };
  leader.setTeam({ role: "leader", members: members.map((m) => m.name), mapName: map.name, ...shared });
  for (const id of memberIds) pets.get(id).setTeam({ role: "member", leader: L.name, ...shared });
  startTeamRelay();
  sendTeamStatus();
  return true;
}
function resumeTeamTick() {
  if (quitting) return;
  // 1. 還沒接回：隊長＋至少一隻開著的隊員進到遊戲（其他開著的隊員也都進遊戲了）就開始
  if (pendingTeam && !currentTeam) {
    const t = pendingTeam;
    if (!petReady(t.leaderId)) return;
    const open = t.memberIds.filter((id) => pets.has(id));
    if (!open.length || open.some((id) => !petReady(id))) return;
    if (applyTeam(t, open)) {
      pendingTeam = null;
      pets.get(t.leaderId)?.say?.("重開前在組隊：已自動接回組隊練功");
    }
    return;
  }
  // 2. 接回後：存檔名單裡晚開的隊員進到遊戲 → 加回隊伍（隊長重新邀請、隊員跟上）
  if (currentTeam && savedTeam && savedTeam.leaderId === currentTeam.leaderId) {
    const late = savedTeam.memberIds.filter((id) => !currentTeam.memberIds.includes(id) && petReady(id));
    if (late.length) applyTeam(currentTeam, [...currentTeam.memberIds, ...late]);
  }
}
function loadTeam() {
  try { savedTeam = JSON.parse(fs.readFileSync(teamFile(), "utf8")); } catch { savedTeam = null; }
  if (!savedTeam || !Array.isArray(savedTeam.memberIds) || typeof savedTeam.mapId !== "string") { savedTeam = null; return; }
  pendingTeam = savedTeam;
  teamResumeTimer = setInterval(resumeTeamTick, 3000);
}
ipcMain.handle("team:get", (e) => (fromTeam(e) ? teamStatus() : null));
ipcMain.handle("team:start", (e, req) => {
  if (!fromTeam(e)) return { error: "not allowed" };
  const leader = pets.get(req?.leaderId ?? null);
  const L = leader?.teamInfo();
  if (!L || L.status !== "ingame" || !L.name) return { error: "隊長的桌寵還沒進到遊戲" };
  const memberIds = (Array.isArray(req.memberIds) ? req.memberIds : []).filter((id) => id !== req.leaderId && pets.has(id));
  const members = memberIds.map((id) => pets.get(id).teamInfo());
  if (!members.length) return { error: "至少要勾一隻其他桌寵當隊員" };
  const notReady = members.filter((m) => m.status !== "ingame" || !m.name);
  if (notReady.length) return { error: `這幾隻還沒進到遊戲：${notReady.map((m) => m.label).join("、")}` };
  if (members.length > 7) return { error: "遊戲隊伍最多 8 人" };
  const map = L.huntMaps.find((m) => m.id === req.mapId);
  if (!map) return { error: "請選要去的練功地圖" };
  // 指定怪物（這張圖的怪，0＝不指定）、倒下復活後走回倒下的地方（使用者 2026-11-22 加在組隊頁）
  const mobNo = Number(req.mob) || 0;
  const mob = mobNo && (map.monsters || []).find((m) => m.no === mobNo);
  if (mobNo && !mob) return { error: "指定的怪物不在這張地圖" };
  const spot = req.spot !== false;
  const room = cleanTeamRoom(req.room, 0);
  if (room.kind === "public" && members.length + 1 > 16) return { error: "公開房最多 16 人" };
  stopTeam();
  currentTeam = { leaderId: req.leaderId, memberIds, mapId: map.id, mapName: map.name, mob: mob ? mob.no : 0, mobName: mob ? mob.name : "", spot, room, dest: null, startedAt: Date.now() };
  const shared = { mapId: map.id, mob: mob ? mob.no : 0, spot, room };
  leader.setTeam({ role: "leader", members: members.map((m) => m.name), mapName: map.name, ...shared });
  for (const id of memberIds) pets.get(id).setTeam({ role: "member", leader: L.name, ...shared });
  startTeamRelay();
  saveTeam();
  sendTeamStatus();
  return {};
});
// 公開房組隊（使用者 2026-11-23）：遊戲自己去公開房不會通知隊友，所以由主程式把隊長進的公開房房號轉給隊員。
// room＝{ kind:"private" } 或 { kind:"public", no:房號（0＝快速加入） }；rev＝第幾次指定（組隊中換房間 +1）
function cleanTeamRoom(r, rev) {
  // best＝自動進人數最多、擠得下全隊的公開房（使用者 2026-11-23）；skip＝這次不要挑的房號（隊員進不去的那間）
  if (r && r.kind === "public" && r.best) return { kind: "public", no: 0, best: true, rev, ...(Number(r.skip) > 0 ? { skip: Math.floor(Number(r.skip)) } : {}) };
  if (r && r.kind === "public") return { kind: "public", no: Math.max(0, Math.min(1e6, Math.floor(Number(r.no) || 0))), rev };
  return { kind: "private", rev };
}
let teamRelayTimer;
function startTeamRelay() {
  clearInterval(teamRelayTimer);
  teamRelayTimer = setInterval(() => {
    if (!currentTeam) { clearInterval(teamRelayTimer); teamRelayTimer = undefined; return; }
    const L = pets.get(currentTeam.leaderId)?.teamInfo();
    // 自動進人最多的房間：隊員連續進不了隊長那間（滿了／解散了）→ 隊長換一間人最多、擠得下全隊的
    const cd = currentTeam.dest;
    if (currentTeam.room.best && cd && Date.now() > (currentTeam.stuckAt || 0) + 60000 &&
        currentTeam.memberIds.some((id) => pets.get(id)?.teamInfo()?.teamStuck === cd.no)) {
      currentTeam.stuckAt = Date.now();
      const room = cleanTeamRoom({ kind: "public", best: true, skip: cd.no }, (currentTeam.room.rev || 0) + 1);
      Object.assign(currentTeam, { room, dest: null });
      const where = { mapId: currentTeam.mapId, mapName: currentTeam.mapName, mob: currentTeam.mob || 0 };
      for (const id of [currentTeam.leaderId, ...currentTeam.memberIds]) pets.get(id)?.setTeamRoom(room, where);
      saveTeam();
      sendTeamStatus();
      return;
    }
    const tr = currentTeam.room.kind === "public" && L?.teamRoom && L.teamRoom.rev === currentTeam.room.rev ? L.teamRoom : null;
    const dest = tr ? { mapId: tr.mapId, no: tr.no, code: tr.code } : null;
    if (!dest || JSON.stringify(dest) === JSON.stringify(currentTeam.dest)) return;
    currentTeam.dest = dest;
    for (const id of currentTeam.memberIds) pets.get(id)?.setTeamDest(dest);
    sendTeamStatus();
  }, 2000);
}
// 組隊中隊長換房間：私人房／公開房 N／快速加入，隊員跟著過去
ipcMain.handle("team:room", (e, req) => {
  if (!fromTeam(e)) return { error: "not allowed" };
  if (!currentTeam) return { error: "沒有在組隊" };
  const room = cleanTeamRoom(req, (currentTeam.room?.rev || 0) + 1);
  if (room.kind === "public" && currentTeam.memberIds.length + 1 > 16) return { error: "公開房最多 16 人" };
  // 組隊中也能換地圖（使用者 2026-11-23：「去哪練功」組隊中選不了）；指定怪物不在新地圖就改不指定
  const L = pets.get(currentTeam.leaderId)?.teamInfo();
  const map = (L?.huntMaps || []).find((m) => m.id === (req?.mapId || currentTeam.mapId));
  if (!map) return { error: "請選要去的練功地圖" };
  const mobNo = Number(req?.mob ?? currentTeam.mob) || 0;
  const mob = mobNo && (map.monsters || []).find((m) => m.no === mobNo);
  Object.assign(currentTeam, { room, dest: null, mapId: map.id, mapName: map.name, mob: mob ? mob.no : 0, mobName: mob ? mob.name : "" });
  const where = { mapId: map.id, mapName: map.name, mob: mob ? mob.no : 0 };
  pets.get(currentTeam.leaderId)?.setTeamRoom(room, where);
  for (const id of currentTeam.memberIds) pets.get(id)?.setTeamRoom(room, where);
  saveTeam();
  sendTeamStatus();
  return {};
});
// 讀某張地圖的公開房（用指定那隻桌寵的遊戲連線）
ipcMain.handle("team:rooms", async (e, req) => {
  if (!fromTeam(e)) return { error: "not allowed" };
  const pet = pets.get(req?.petId ?? null);
  if (!pet) return { error: "找不到這隻桌寵" };
  if (typeof req.mapId !== "string" || !req.mapId) return { error: "請選地圖" };
  return pet.listRooms(req.mapId, req.after);
});
// 不組隊自己打（使用者 2026-11-23）：選的那幾隻（隊長欄＋勾選的）各自去同一張地圖、各打各的。
// 有在組隊就先解散、離開遊戲裡的隊伍；地圖、指定怪物記成每隻「自動補給」的練功地圖和指定怪物（之後補給、復活也回這裡）
ipcMain.handle("team:solo", (e, req) => {
  if (!fromTeam(e)) return { error: "not allowed" };
  const ids = [...new Set(Array.isArray(req?.ids) ? req.ids : [])].filter((id) => pets.has(id));
  if (!ids.length) return { error: "請選要去打的桌寵" };
  const infos = ids.map((id) => pets.get(id).teamInfo());
  const notReady = infos.filter((m) => m.status !== "ingame" || !m.name);
  if (notReady.length) return { error: `這幾隻還沒進到遊戲：${notReady.map((m) => m.label).join("、")}` };
  const map = infos[0].huntMaps.find((m) => m.id === req.mapId);
  if (!map) return { error: "請選要去的練功地圖" };
  const mobNo = Number(req.mob) || 0;
  const mob = mobNo && (map.monsters || []).find((m) => m.no === mobNo);
  if (mobNo && !mob) return { error: "指定的怪物不在這張地圖" };
  stopTeam();
  for (const id of ids) pets.get(id).goSolo({ mapId: map.id, mapName: map.name, mob: mob ? mob.no : 0, mobName: mob ? mob.name : "", spot: req.spot !== false });
  sendTeamStatus();
  return { names: infos.map((m) => m.name), mapName: map.name };
});
ipcMain.handle("team:stop", (e) => {
  if (!fromTeam(e)) return { error: "not allowed" };
  // 沒有桌寵組隊、但遊戲裡還在隊伍（例如重開桌寵後）：在隊伍裡的每隻都離隊（使用者 2026-11-23：解散鈕不能用）
  if (!currentTeam) for (const p of pets.values()) if (p.teamInfo().party) p.setTeam(null, true);
  stopTeam();
  sendTeamStatus();
  return {};
});

// ── 物品欄與指定交易（ui/inv.html）：看每隻角色的背包、身上裝備；選物品＋金幣交給另一隻 ──
// 給的桌寵回主城（tradeGive），主程式把它的房號轉給收的桌寵（tradeTake 用房號進同一間、走過去），
// 兩邊用遊戲自己的交易（邀請、放物品、雙方 OK）。收的一方只在物品件數、金幣跟指定的一樣時才按 OK。只放記憶體。
let invWin, invTimer, currentTrade = null, tradeSeq = 0;
const tradeLog = []; // 最近的交易結果（最多 20 筆）
// ── 自動販售：「全部桌寵」的規則（sell-global.json）、遊戲送來的道具分類清單（item-catalog.json，下拉選單用） ──
const globalSellFile = () => path.join(app.getPath("userData"), "sell-global.json");
const catalogFile = () => path.join(app.getPath("userData"), "item-catalog.json");
let sellGlobalCache, catalogCache;
function sellGlobal() {
  if (!sellGlobalCache) { try { sellGlobalCache = sellRules.cleanGlobal(JSON.parse(fs.readFileSync(globalSellFile(), "utf8"))); } catch { sellGlobalCache = sellRules.cleanGlobal({}); } }
  return sellGlobalCache;
}
function setSellGlobal(g) {
  sellGlobalCache = sellRules.cleanGlobal(g);
  try { fs.writeFileSync(globalSellFile(), JSON.stringify(sellGlobalCache, null, 1)); } catch {}
  for (const p of pets.values()) p.setSellGlobal(sellGlobalCache);
}
function catalog() {
  if (catalogCache === undefined) { try { catalogCache = JSON.parse(fs.readFileSync(catalogFile(), "utf8")); } catch { catalogCache = null; } }
  return catalogCache;
}
ipcMain.on("game:catalog", (e, c) => {
  if (!owner(e) || !c || !Array.isArray(c.items) || c.items.length > 5000) return;
  const items = c.items.filter((r) => Array.isArray(r) && r.length === 4 && Number.isInteger(r[0]) && typeof r[1] === "string" && typeof r[2] === "string" && typeof r[3] === "string")
    .map((r) => [r[0], r[1].slice(0, 40), r[2].slice(0, 20), r[3].slice(0, 30)]);
  const cats = Object.fromEntries(Object.entries(c.cats || {}).filter(([k, v]) => sellRules.SELL_CATS.includes(k) && typeof v === "string").map(([k, v]) => [k, v.slice(0, 10)]));
  catalogCache = { cats, items, at: Date.now() };
  try { fs.writeFileSync(catalogFile(), JSON.stringify(catalogCache)); } catch {}
});
function invStatus() {
  return { pets: [...pets.values()].map((p) => p.invInfo()), trade: currentTrade, history: tradeLog, sellGlobal: sellGlobal() };
}
function sendInvStatus() {
  if (invWin && !invWin.isDestroyed()) invWin.webContents.send("inv:status", invStatus());
}
function openInv() {
  if (invWin && !invWin.isDestroyed()) { invWin.show(); invWin.focus(); return; }
  invWin = new BrowserWindow({
    width: 980, height: 780, title: "物品欄與交易", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "inv-preload.js") },
  });
  invWin.loadFile(path.join(__dirname, "ui", "inv.html"));
  invTimer = setInterval(() => { if (invWin && !invWin.isDestroyed() && !currentTrade) sendInvStatus(); }, 3000);
  invWin.on("closed", () => { invWin = undefined; clearInterval(invTimer); invTimer = undefined; });
}
const fromInv = (e) => invWin && !invWin.isDestroyed() && e.sender === invWin.webContents;
function endTrade(result, text) {
  if (!currentTrade) return;
  const t = currentTrade;
  currentTrade = null;
  clearInterval(tradeTimer); tradeTimer = undefined;
  for (const id of [t.fromId, t.toId]) pets.get(id)?.setTrade(null);
  tradeLog.unshift({ at: Date.now(), from: t.fromName, to: t.toName, items: t.items.map((i) => i.label), gold: t.gold, result, text });
  tradeLog.splice(20);
  sendInvStatus();
}
// 交易進行中：把給的那隻的房號轉給收的那隻；兩邊都做完（或有一邊失敗）就結束
// 計時器只在交易中開著（endTrade 會關），物品欄視窗的更新也只在視窗開著時跑：桌寵全關後不留計時器
let tradeTimer;
function startTradeWatch() { if (!tradeTimer) tradeTimer = setInterval(tradeWatch, 1000); }
function tradeWatch() {
  if (!currentTrade) { clearInterval(tradeTimer); tradeTimer = undefined; return; }
  const t = currentTrade, giver = pets.get(t.fromId), taker = pets.get(t.toId);
  if (!giver || !taker) return endTrade("error", "有一隻桌寵關掉了");
  const g = giver.invInfo().trade, r = taker.invInfo().trade;
  const gs = g?.id === t.id ? g : null, rs = r?.id === t.id ? r : null;
  if (gs?.meet?.mapId && JSON.stringify(t.meet) !== JSON.stringify(gs.meet)) { t.meet = gs.meet; taker.setTrade({ ...t.takeJob, meet: gs.meet }); }
  // 收的一方在主城走到旁邊、準備好了，才叫給的一方發邀請
  if (rs?.ready && !t.ready) { t.ready = true; giver.setTrade({ ...t.giveJob, ready: true }); }
  if (gs?.error || rs?.error) return endTrade("error", (gs?.error && gs.step) || rs.step);
  if (gs?.ok && rs?.ok) return endTrade("ok", "交易成功");
  if (Date.now() - t.startedAt > 10 * 60 * 1000) return endTrade("error", "超過 10 分鐘沒有完成，已取消");
  sendInvStatus();
}
ipcMain.handle("inv:get", (e) => (fromInv(e) ? invStatus() : null));
ipcMain.handle("inv:catalog", (e) => (fromInv(e) ? catalog() : null));
// 改販售設定：scope "global"＝全部桌寵；其他＝那隻桌寵的 accountId（"null" 是沒有帳號的那隻）
ipcMain.handle("inv:sell-set", (e, scope, cfg) => {
  if (!fromInv(e)) return { error: "not allowed" };
  if (scope === "global") setSellGlobal(cfg);
  else { const p = pets.get(scope === "null" ? null : scope); if (!p) return { error: "找不到這隻桌寵" }; p.setSell(cfg); }
  sendInvStatus();
  return {};
});
ipcMain.handle("inv:trade", (e, req) => {
  if (!fromInv(e)) return { error: "not allowed" };
  if (currentTrade) return { error: "已經有一筆交易在進行，先等它完成或取消" };
  const giver = pets.get(req?.fromId ?? null), taker = pets.get(req?.toId ?? null);
  if (!giver || !taker || giver === taker) return { error: "請選要交給哪一隻桌寵" };
  const G = giver.invInfo(), T = taker.invInfo();
  for (const p of [G, T]) {
    if (p.status !== "ingame" || !p.name) return { error: `${p.label} 還沒進到遊戲` };
    if ((p.level || 0) < 25) return { error: `${p.name} 等級未滿 25，遊戲不能交易` };
  }
  const bag = G.inv?.bag || [];
  const items = (Array.isArray(req.items) ? req.items : []).map((it) => bag.find((b) => b && b.slot === it.slot && b.sig === it.sig)).filter(Boolean);
  if (items.length !== (req.items || []).length) return { error: "有選的物品已經不在背包裡了，請重新選" };
  if (items.length > 20) return { error: "一次最多交易 20 格物品" };
  const gold = Math.max(0, Math.floor(Number(req.gold) || 0));
  if (gold > (G.inv?.gold || 0)) return { error: `${G.name} 的金幣不夠` };
  if (!items.length && !gold) return { error: "請選物品或填金幣" };
  const id = `t${Date.now()}-${++tradeSeq}`;
  const giveJob = { id, role: "give", to: T.name, items: items.map((i) => ({ slot: i.slot, sig: i.sig, name: i.name })), gold };
  const takeJob = { id, role: "take", from: G.name, count: items.length, gold, meet: null };
  currentTrade = { id, fromId: req.fromId ?? null, toId: req.toId ?? null, fromName: G.name, toName: T.name, gold, startedAt: Date.now(), takeJob, giveJob,
    items: items.map((i) => ({ ...i, label: `${i.name}${i.n > 1 ? ` ×${i.n}` : ""}` })) };
  giver.setTrade(giveJob);
  taker.setTrade(takeJob);
  startTradeWatch();
  sendInvStatus();
  return {};
});
ipcMain.handle("inv:cancel", (e) => { if (!fromInv(e)) return { error: "not allowed" }; endTrade("canceled", "手動取消"); return {}; });

// 依來源視窗路由，遊戲和桌寵的訊息只能影響自己的帳號。
for (const name of ["game:state", "game:auto-log", "game:chat", "game:pending-storage", "game:saved-prefs", "game:prefs", "auto:set", "pet:interactive", "pet:toggle-game", "pet:menu"]) {
  ipcMain.on(name, (e, ...args) => {
    const p = owner(e);
    if (!p) { if (name === "game:pending-storage" || name === "game:saved-prefs") e.returnValue = null; return; }
    if (name === "pet:menu" || name === "pet:toggle-game") selected = p.accountId;
    p.events.get(name)?.(e, ...args);
  });
}
for (const name of ["auto:get", "codex:char", "codex:set-target", "codex:open-team", "life:get", "life:set", "dismantle:get", "dismantle:set", "dismantle:run", "chat:get", "chat:send","chat:extras", "chat:emote", "chat:say", "chat:item", "chat:detail","idle:get", "idle:set", "idle:share", "pet:asset", "pet:art"]) {
  ipcMain.handle(name, (e, ...args) => owner(e)?.handlers.get(name)?.(e, ...args));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", openAccounts);
  app.whenReady().then(() => {
    countStartup();
    accounts.load();
    loadTeam();
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
      ...managerList(), { type: "separator" },
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
