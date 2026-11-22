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
  return `Lv.${p.level ?? "?"}・${where}${p.watching ? "・<span class=\"warn\">遊戲視窗開著（暫停）</span>" : ""}` +
    (p.party ? `・隊伍：${esc(p.party.leader)} 帶 ${p.party.members.length} 人${p.party.destination ? (p.party.here ? "（在隊伍房間）" : "（不在隊伍房間）") : ""}` : "") +
    (p.teamState ? `<br />${esc(p.teamState)}` : "");
}

/** 指定怪物：列出選定地圖的怪（等級、首領），跟遊戲小地圖下方「怪物」選單同一份。換地圖就重列、沒有的怪改回不指定。 */
function fillMobs(maps, team) {
  const sel = $("mob");
  const map = maps.find((m) => m.id === $("map").value);
  const mobs = map?.monsters || [];
  const sig = JSON.stringify([map?.id, mobs.map((m) => m.no)]);
  const want = team ? String(team.mob || 0) : sel.value || "0";
  if (sel.dataset.sig !== sig) {
    const lv = (m) => `Lv ${m.levelMin === m.levelMax ? m.levelMin : `${m.levelMin}～${m.levelMax}`}`;
    sel.replaceChildren(new Option("不指定（照自動戰鬥）", "0"), ...mobs.map((m) => new Option(`${m.boss ? "【首領】" : ""}${m.name}｜${lv(m)}`, String(m.no))));
    sel.dataset.sig = sig;
  }
  sel.value = [...sel.options].some((o) => o.value === want) ? want : "0";
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

  const leader = st.pets.find((p) => key(p.accountId) === leaderSel.value);
  const mapSel = $("map");
  const maps = leader?.huntMaps || [];
  const mapSig = JSON.stringify(maps.map((m) => m.id));
  const mapWant = team ? team.mapId : mapSel.value || leader?.huntMap || leader?.lastHuntMap?.id || "";
  if (mapSel.dataset.sig !== mapSig) {
    mapSel.replaceChildren(...(maps.length ? maps.map((m) => new Option(`${m.name}｜怪物 Lv.${m.levelMin}${m.levelMin === m.levelMax ? "" : `–${m.levelMax}`}`, m.id)) : [new Option("（隊長連上遊戲後才會列出地圖）", "")]));
    mapSel.dataset.sig = mapSig;
  }
  if ([...mapSel.options].some((o) => o.value === mapWant)) mapSel.value = mapWant;
  fillMobs(maps, team);
  $("spot").checked = team ? team.spot !== false : $("spot").checked;

  $("pets").replaceChildren(...st.pets.filter((p) => key(p.accountId) !== leaderSel.value).map((p) => {
    const div = document.createElement("div");
    div.className = "pet";
    const k = key(p.accountId);
    div.innerHTML = `<input type="checkbox" data-k="${esc(k)}" ${picked.has(k) ? "checked" : ""} ${team ? "disabled" : ""} />` +
      `<div class="who"><b>${esc(p.name || "（未登入）")}</b>　<span class="muted">${esc(p.label)}</span><div class="state">${petLine(p)}</div></div>`;
    return div;
  }));
  if (!st.pets.some((p) => key(p.accountId) !== leaderSel.value)) $("pets").innerHTML = `<div class="hint">只有一隻桌寵。先到「帳號與桌寵管理」多開幾隻，登入後再來組隊。</div>`;

  for (const id of ["leader", "map", "mob", "spot"]) $(id).disabled = !!team;
  $("start").disabled = !!team;
  $("stop").disabled = !team;

  if (team) {
    const L = st.pets.find((p) => key(p.accountId) === key(team.leaderId));
    const lines = [`<span class="ok">組隊中</span>：隊長 <b>${esc(L?.name || "?")}</b>，目的地「${esc(team.mapName)}」${team.mobName ? `，指定怪物「${esc(team.mobName)}」` : ""}（${new Date(team.startedAt).toLocaleTimeString("zh-TW", { hour12: false })} 開始）`];
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
$("map").addEventListener("change", () => latest && render(latest));
$("leader").addEventListener("change", () => { picked.delete($("leader").value); $("map").dataset.sig = ""; $("map").value = ""; latest && render(latest); });
$("start").addEventListener("click", async () => {
  const r = await window.teamApi.start({ leaderId: unkey($("leader").value), memberIds: [...picked].filter((k) => k !== $("leader").value).map(unkey), mapId: $("map").value,
    mob: Number($("mob").value) || 0, spot: $("spot").checked });
  $("msg").className = r?.error ? "bad" : "ok";
  $("msg").textContent = r?.error || "已開始：隊員回城等邀請中";
  render(await window.teamApi.get());
});
$("stop").addEventListener("click", async () => {
  await window.teamApi.stop();
  $("msg").className = "ok";
  $("msg").textContent = "已解散";
  render(await window.teamApi.get());
});
window.teamApi.onStatus(render);
window.teamApi.get().then(render);
