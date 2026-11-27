"use strict";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const key = (id) => (id === null ? "null" : String(id));
const unkey = (k) => (k === "null" ? null : k);
let latest = null;
const picked = new Set(); // 勾選的隊員（accountId 的 key）

function petLine(p) {
  if (p.status !== "ingame") return `<span class="warn">${p.status === "login" || p.status === "expired" ? "還沒登入" : "連線中"}</span>`;
  const where = p.dead ? `<span class="bad">倒下中</span>` : p.town ? "在主城" : "在練功地圖";
  return `Lv.${p.level ?? "?"}・${where}${p.watching ? "・遊戲視窗開著" : ""}` +
    (p.party ? `・隊伍：${esc(p.party.leader)} 帶 ${p.party.members.length} 人${p.party.destination ? (p.party.here ? "（在隊伍房間）" : "（不在隊伍房間）") : ""}` : "") +
    (p.teamState ? `<br />${esc(p.teamState)}` : "");
}

/** 指定怪物：列出選定地圖的怪（等級、首領），跟遊戲小地圖下方「怪物」選單同一份。換地圖就重列、沒有的怪改回不指定。 */
function fillMobs(maps, team) {
  const sel = $("mob");
  const map = maps.find((m) => m.id === $("map").value);
  const mobs = map?.monsters || [];
  const sig = JSON.stringify([map?.id, mobs.map((m) => m.no)]);
  const want = sel.dataset.user || (team ? String(team.mob || 0) : sel.value || "0");
  if (sel.dataset.sig !== sig) {
    const lv = (m) => `Lv ${m.levelMin === m.levelMax ? m.levelMin : `${m.levelMin}～${m.levelMax}`}`;
    sel.replaceChildren(new Option("不指定（照自動戰鬥）", "0"), ...mobs.map((m) => new Option(`${m.boss ? "【首領】" : ""}${m.name}｜${lv(m)}`, String(m.no))));
    sel.dataset.sig = sig;
  }
  sel.value = [...sel.options].some((o) => o.value === want) ? want : "0";
}

// ---- 房間：私人房／公開房（使用者 2026-11-23：讀遊戲的公開房，隊長決定去哪間、隊友一起過去） ----
let rooms = null; // { key:"隊長|地圖", total, list:[[房號,人數]], more, here, max, error, loading }
const roomKeyOf = (petKey, mapId) => `${petKey}|${mapId}`;
function curRoomKey() {
  const team = latest?.team;
  return roomKeyOf(team ? key(team.leaderId) : $("leader").value, $("map").value);
}
function roomValue(r) { return r && r.kind === "public" ? `pub:${r.no || 0}` : "private"; }
function parseRoom(v) {
  if ($("roomBest").checked) return { kind: "public", no: 0, best: true }; // 自動進人數最多的公開房（使用者 2026-11-23）
  return v && v.startsWith("pub:") ? { kind: "public", no: Number(v.slice(4)) || 0 } : { kind: "private" };
}
function fillRooms() {
  const sel = $("room"), team = latest?.team;
  const ok = rooms && rooms.key === curRoomKey() && !rooms.error;
  const max = rooms?.max || 16;
  const size = team ? team.memberIds.length + 1 : picked.size + 1;
  const opts = [new Option("私人房（只有隊伍）", "private"), new Option(`公開房・快速加入${ok ? `（這張圖公開房共 ${rooms.total} 人）` : ""}`, "pub:0")];
  if (ok) for (const [no, n] of rooms.list) {
    const o = new Option(`公開房 ${no}｜${n}/${max} 人${rooms.here === no ? "（隊長在這間）" : ""}${n + size > max ? "（擠不下全隊）" : ""}`, `pub:${no}`);
    o.disabled = n >= max;
    opts.push(o);
  }
  // 組隊中正在用的那間不在清單裡也要列出來
  const using = team ? roomValue(team.room) : null;
  if (using && !opts.some((o) => o.value === using)) opts.push(new Option(`公開房 ${using.slice(4)}`, using));
  const want = sel.dataset.user || (team ? using : sel.value) || "private";
  const sig = JSON.stringify(opts.map((o) => [o.value, o.text, o.disabled]));
  if (sel.dataset.sig !== sig) { sel.replaceChildren(...opts); sel.dataset.sig = sig; }
  sel.value = opts.some((o) => o.value === want && !o.disabled) ? want : "private";
  const best = $("roomBest");
  if (!best.dataset.user) best.checked = team ? !!team.room?.best : best.checked;
  sel.disabled = best.checked;
  $("roomsMore").hidden = !(ok && rooms.more);
  $("roomsLoad").disabled = !!rooms?.loading;
  $("roomsMore").disabled = !!rooms?.loading;
  $("roomGo").hidden = !team;
  $("roomGo").disabled = !team || ((best.checked ? !!team.room?.best : sel.value === using && !team.room?.best) && $("map").value === team.mapId && $("mob").value === String(team.mob || 0));
  const hint = $("roomHint");
  if (rooms?.loading) hint.dataset.state = "正在讀取公開房…";
  else if (rooms?.error && rooms.key === curRoomKey()) hint.dataset.state = `讀不到公開房：${rooms.error}`;
  else if (ok) hint.dataset.state = rooms.list.length ? "" : "這張圖目前沒有公開房（選快速加入會開一間新的）";
  else hint.dataset.state = "";
  let st = $("roomState");
  if (!st) { st = document.createElement("div"); st.id = "roomState"; st.className = "hint warn"; hint.before(st); }
  st.textContent = hint.dataset.state;
  st.hidden = !hint.dataset.state;
}
async function loadRooms(more) {
  const team = latest?.team;
  const petKey = team ? key(team.leaderId) : $("leader").value;
  const mapId = $("map").value;
  if (!mapId) return;
  const k = roomKeyOf(petKey, mapId);
  const after = more && rooms?.key === k ? rooms.list.at(-1)?.[0] : 0;
  const prev = more && rooms?.key === k ? rooms.list : [];
  rooms = { list: [], total: 0, ...(rooms?.key === k && !rooms.error ? rooms : {}), key: k, loading: true, error: "" };
  fillRooms();
  const r = await window.teamApi.rooms({ petId: unkey(petKey), mapId, after });
  if (curRoomKey() !== k) { rooms = null; fillRooms(); return; } // 讀的時候換了地圖／隊長
  rooms = r?.error ? { key: k, error: r.error, list: [] } : { key: k, total: r.total, list: [...prev, ...r.rooms], more: r.more, here: r.here, max: r.max || 16 };
  fillRooms();
}
$("roomsLoad").addEventListener("click", () => loadRooms(false));
$("roomsMore").addEventListener("click", () => loadRooms(true));
$("room").addEventListener("change", () => { $("room").dataset.user = $("room").value; fillRooms(); });
$("roomBest").addEventListener("change", () => { $("roomBest").dataset.user = "1"; fillRooms(); });
$("roomGo").addEventListener("click", async () => {
  const r = await window.teamApi.room({ ...parseRoom($("room").value), mapId: $("map").value, mob: Number($("mob").value) || 0 });
  $("msg").className = r?.error ? "bad" : "ok";
  $("msg").textContent = r?.error || "隊長換地圖／房間中，隊員會跟過去";
  if (!r?.error) for (const id of ["room", "map", "mob", "roomBest"]) delete $(id).dataset.user;
  render(await window.teamApi.get());
});
let roomAutoKey = "";
/** 隊長或地圖換了就自動讀一次公開房。 */
function autoLoadRooms() {
  const k = curRoomKey();
  if (k === roomAutoKey || !k.split("|")[1]) return;
  const L = latest?.pets.find((p) => key(p.accountId) === k.split("|")[0]);
  if (!L || L.status !== "ingame") return;
  roomAutoKey = k;
  delete $("room").dataset.user;
  loadRooms(false);
}

// 重開桌寵後組隊（只放記憶體）結束了，但遊戲裡的隊伍還在（使用者 2026-11-23）：
// 偵測桌寵們已經在同一個遊戲隊伍 → 自動帶入隊長、勾好隊員，按「開始組隊」就接著用（已在隊伍裡不會重新邀請）
let partySeen = "";
function detectParty(st) {
  const lead = st.pets.find((p) => p.party && p.name && p.party.leader === p.name && p.party.members.length > 1);
  if (!lead) { partySeen = ""; $("partyFound")?.remove(); return; }
  const mates = st.pets.filter((p) => p !== lead && p.name && lead.party.members.includes(p.name));
  if (!mates.length) return;
  const sig = JSON.stringify([key(lead.accountId), ...mates.map((p) => key(p.accountId))]);
  if (sig !== partySeen) {
    partySeen = sig;
    $("leader").value = key(lead.accountId);
    picked.clear();
    mates.forEach((p) => picked.add(key(p.accountId)));
    const d = lead.party.destination;
    if (d && d.mapId && [...$("map").options].some((o) => o.value === d.mapId)) $("map").value = d.mapId;
  }
  let el = $("partyFound");
  if (!el) { el = document.createElement("div"); el.id = "partyFound"; el.className = "hint ok"; $("pets").before(el); }
  el.textContent = `偵測到遊戲裡的隊伍：${lead.name} 帶 ${mates.map((p) => p.name).join("、")}（已帶入隊長、勾好隊員；選好地圖和房間按「開始組隊」接著用，不用重新邀請）`;
}

function render(st) {
  latest = st;
  const team = st.team;
  const leaderSel = $("leader");
  const ready = st.pets.filter((p) => p.status === "ingame" && p.name);
  const want = team ? key(team.leaderId) : leaderSel.value || key(ready[0]?.accountId ?? st.pets[0]?.accountId ?? null);
  const opts = st.pets.map((p) => new Option(`${p.name || "（未登入）"}・${p.label}`, key(p.accountId)));
  const sig = JSON.stringify(opts.map((o) => o.text));
  if (leaderSel.dataset.sig !== sig) { leaderSel.replaceChildren(...opts); leaderSel.dataset.sig = sig; }
  leaderSel.value = want;
  if (team) { picked.clear(); team.memberIds.forEach((id) => picked.add(key(id))); }
  else detectParty(st);

  const leader = st.pets.find((p) => key(p.accountId) === leaderSel.value);
  const mapSel = $("map");
  const maps = leader?.huntMaps || [];
  const mapSig = JSON.stringify(maps.map((m) => m.id));
  const mapWant = mapSel.dataset.user || (team ? team.mapId : null) || mapSel.value || leader?.huntMap || leader?.lastHuntMap?.id || "";
  if (mapSel.dataset.sig !== mapSig) {
    mapSel.replaceChildren(...(maps.length ? maps.map((m) => new Option(`${m.name}｜怪物 Lv.${m.levelMin}${m.levelMin === m.levelMax ? "" : `–${m.levelMax}`}`, m.id)) : [new Option("（隊長連上遊戲後才會列出地圖）", "")]));
    mapSel.dataset.sig = mapSig;
  }
  if ([...mapSel.options].some((o) => o.value === mapWant)) mapSel.value = mapWant;
  fillMobs(maps, team);
  fillRooms();
  autoLoadRooms();
  $("spot").checked = team ? team.spot !== false : $("spot").checked;

  $("pets").replaceChildren(...st.pets.filter((p) => key(p.accountId) !== leaderSel.value).map((p) => {
    const div = document.createElement("div");
    div.className = "pet";
    const k = key(p.accountId);
    div.innerHTML = `<input type="checkbox" data-k="${esc(k)}" ${picked.has(k) ? "checked" : ""} ${team ? "disabled" : ""} />` +
      `<div class="who"><b>${esc(p.name || "（未登入）")}</b>　<span class="muted">${esc(p.label)}</span><div class="state">${petLine(p)}</div></div>`;
    return div;
  }));
  if (!st.pets.some((p) => key(p.accountId) !== leaderSel.value)) $("pets").innerHTML = `<div class="hint">只有一隻桌寵：可以按「不組隊自己打」。要組隊先到「帳號與桌寵管理」多開幾隻。</div>`;

  for (const id of ["leader", "spot"]) $(id).disabled = !!team; // 地圖、怪物、房間組隊中也能改，按「套用」生效
  $("start").disabled = !!team;
  $("solo").disabled = false; // 組隊中按也行：會先解散
  $("stop").disabled = !team && !st.pets.some((p) => p.party); // 遊戲裡還在隊伍也能解散

  if (team) {
    const L = st.pets.find((p) => key(p.accountId) === key(team.leaderId));
    const lines = [`<span class="ok">組隊中</span>：隊長 <b>${esc(L?.name || "?")}</b>，目的地「${esc(team.mapName)}」` +
      `${team.room?.kind === "public" ? `公開房${team.room.best ? "（自動挑人最多的）" : ""}${team.dest ? ` ${esc(team.dest.no)}` : team.room.no ? ` ${esc(team.room.no)}（隊長前往中）` : team.room.best ? " 隊長找房間中" : "（快速加入，隊長前往中）"}` : "私人房"}${team.mobName ? `，指定怪物「${esc(team.mobName)}」` : ""}（${new Date(team.startedAt).toLocaleTimeString("zh-TW", { hour12: false })} 開始）`];
    lines.push(`隊長：${L ? petLine(L) : "桌寵已關閉"}`);
    $("now").innerHTML = lines.join("<br />");
  } else $("now").textContent = "沒有在組隊。";
  const log = st.pets.flatMap((p) => (p.log || []).map((l) => `${l.slice(0, 8)} [${p.name || p.label}] ${l.slice(9)}`)).sort().reverse();
  $("log").textContent = log.length ? log.join("\n") : "（還沒有）";
}

$("pets").addEventListener("change", (e) => {
  const k = e.target.dataset?.k;
  if (k === undefined) return;
  if (e.target.checked) picked.add(k); else picked.delete(k);
});
$("map").addEventListener("change", () => { if (latest?.team) $("map").dataset.user = $("map").value; latest && render(latest); });
$("mob").addEventListener("change", () => { if (latest?.team) $("mob").dataset.user = $("mob").value; latest && render(latest); });
$("leader").addEventListener("change", () => { picked.delete($("leader").value); $("map").dataset.sig = ""; $("map").value = ""; latest && render(latest); });
$("start").addEventListener("click", async () => {
  const r = await window.teamApi.start({ leaderId: unkey($("leader").value), memberIds: [...picked].filter((k) => k !== $("leader").value).map(unkey), mapId: $("map").value,
    mob: Number($("mob").value) || 0, spot: $("spot").checked, room: parseRoom($("room").value) });
  $("msg").className = r?.error ? "bad" : "ok";
  $("msg").textContent = r?.error || "已開始：隊員回城等邀請中";
  if (!r?.error) { delete $("room").dataset.user; delete $("roomBest").dataset.user; }
  render(await window.teamApi.get());
});
// 不組隊自己打：上面「隊長」那隻＋勾選的，各自去選的地圖打（使用者 2026-11-23）
$("solo").addEventListener("click", async () => {
  const ids = [unkey($("leader").value), ...[...picked].filter((k) => k !== $("leader").value).map(unkey)];
  const r = await window.teamApi.solo({ ids, mapId: $("map").value, mob: Number($("mob").value) || 0, spot: $("spot").checked });
  $("msg").className = r?.error ? "bad" : "ok";
  $("msg").textContent = r?.error || `${r.names.join("、")} 各自去「${r.mapName}」打`;
  render(await window.teamApi.get());
});

// 從小百科「打怪掉落」點過來：選那隻桌寵、帶入地圖（和怪物）
let pendingPreset = null;
function applyPreset() {
  const p = pendingPreset;
  if (!p || !latest) return;
  pendingPreset = null;
  if (latest.team) { $("msg").className = "warn"; $("msg").textContent = `組隊進行中：要去「${p.mapName}」請先解散`; return; }
  if ([...$("leader").options].some((o) => o.value === key(p.petId))) { $("leader").value = key(p.petId); $("map").dataset.sig = ""; $("map").value = ""; render(latest); }
  const leader = latest.pets.find((x) => key(x.accountId) === $("leader").value);
  const map = (leader?.huntMaps || []).find((m) => m.name === p.mapName);
  if (!map) {
    $("msg").className = "warn";
    $("msg").textContent = leader?.huntMaps?.length ? `「${p.mapName}」不在傳送清單裡，請自己選地圖` : "這隻桌寵還沒連上遊戲，連上後再選地圖";
    return;
  }
  $("map").value = map.id;
  render(latest);
  const mob = p.mobName && (map.monsters || []).find((m) => m.name === p.mobName);
  if (mob) $("mob").value = String(mob.no);
  $("msg").className = "ok";
  $("msg").textContent = `已帶入「${map.name}」${mob ? `、指定怪物「${mob.name}」` : ""}：按「開始組隊」或「不組隊自己打」`;
}
window.teamApi.onPreset((p) => { pendingPreset = p; applyPreset(); });

$("stop").addEventListener("click", async () => {
  await window.teamApi.stop();
  $("msg").className = "ok";
  $("msg").textContent = "已解散";
  render(await window.teamApi.get());
});
window.teamApi.onStatus(render);
window.teamApi.get().then((st) => { render(st); applyPreset(); });
