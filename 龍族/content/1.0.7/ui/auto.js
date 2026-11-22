"use strict";
const $ = (id) => document.getElementById(id);
const FIELDS = { "hp-min": "hpMin", "hp-to": "hpTo", "mp-min": "mpMin", "mp-to": "mpTo", "ammo-min": "ammoMin", "ammo-to": "ammoTo" };
let filled = false; // 表單只在第一次拿到資料時填，之後狀態更新不要蓋掉正在改的數字
let latestStatus;

function fill(st) {
  const a = st.settings;
  $("sup-on").checked = a.supply.enabled;
  for (const kind of ["hp", "mp"]) {
    const select = $(`${kind}-item`);
    select.replaceChildren(new Option("自動選擇（遊戲快速補給）", "0"), ...(st.potions?.[kind] || []).map(([id, name]) => new Option(name, String(id))));
    select.value = String(a.supply[`${kind}Item`] || 0);
  }
  for (const [id, key] of Object.entries(FIELDS)) $(id).value = a.supply[key];
  a.fuse.forEach((f, i) => {
    $(`f${i}-on`).checked = f.enabled;
    $(`f${i}-n`).value = f.count;
  });
  $("rev-on").checked = !!a.revive?.enabled;
  $("rev-supply").checked = a.revive?.supply !== false;
  $("al-on").checked = !!a.alloc?.enabled;
  filled = true;
}

function fillTowns(st) {
  const sel = $("sup-town");
  const want = sel.value || st.settings.supply.town;
  // 沒選過就預設自己國家的主城
  const own = st.towns.find((t) => t.nation === st.nation);
  const key = JSON.stringify(st.towns);
  if (sel.dataset.key !== key) {
    sel.dataset.key = key;
    sel.replaceChildren(...st.towns.map((t) => new Option(`${t.name}${t.nation === st.nation ? "（本國）" : ""}`, t.mapId)));
    if (!st.towns.length) sel.append(new Option("（遊戲連上後才會列出主城）", ""));
  }
  sel.value = st.towns.some((t) => t.mapId === want) ? want : own?.mapId ?? st.towns[0]?.mapId ?? "";
}

function showStatus(st) {
  const parts = [];
  if (!st.connected) parts.push(`<span class="warn">遊戲還沒連上（或還沒登入），連上後才會開始自動補給、合成。</span>`);
  else if (st.watching) parts.push(`<span class="warn">遊戲視窗正開著：自動功能暫停中。</span>`);
  else parts.push(`<span class="ok">遊戲已連上。</span>`);
  if (st.connected && !st.supplyOk) parts.push(`<span class="warn">這一版遊戲找不到補給要用的函式，自動補給停用。</span>`);
  if (st.connected && !st.fuseOk) parts.push(`<span class="warn">這一版遊戲找不到合成要用的函式，自動合成停用。</span>`);
  if (st.counts) parts.push(`目前（已儲存的選擇）：${st.counts.hpName || "紅水"} ${st.counts.hp} 瓶、${st.counts.mpName || "藍水"} ${st.counts.mp} 瓶${st.counts.ammo == null ? "" : `、${st.counts.ammoName} ${st.counts.ammo} 個`}`);
  if (st.fusable) parts.push(`目前可合：普通 ${st.fusable[0]} 件、稀有 ${st.fusable[1]} 件、高級 ${st.fusable[2]} 件`);
  if (st.missing?.length) parts.push(`<span class="warn">（遊戲改版，找不到：${st.missing.join("、")}）</span>`);
  $("status").innerHTML = parts.join("<br />");
  if (st.supplyState) {
    const supply = document.createElement("div");
    supply.className = "hint";
    supply.textContent = `補給狀態：${st.supplyState}`;
    $("status").append(supply);
  }
  $("log").textContent = st.log.length ? st.log.slice().reverse().join("\n") : "（還沒有）";
}

function mapLevels(map, core = false) {
  const min = map?.[core ? "coreLevelMin" : "levelMin"];
  const max = map?.[core ? "coreLevelMax" : "levelMax"];
  return Number.isFinite(min) && Number.isFinite(max) ? `Lv.${min}${min === max ? "" : `–${max}`}` : "等級資料暫無";
}

function showHuntInfo(st) {
  const id = $("sup-hunt").value;
  const mapId = id || st.lastHuntMap?.id;
  const map = (st.huntMaps || []).find(m => m.id === mapId);
  const name = map?.name || (!id && st.lastHuntMap?.name) || mapId;
  const info = $("hunt-info");
  if (!mapId) info.textContent = "預設返回最後狩獵區；進入狩獵地圖後會自動記錄。各帳號獨立保存。";
  else if (!map) info.textContent = `${id ? "指定地圖" : "最後狩獵區"}：${name}。地圖與怪物等級資料尚未取得，連線後會更新。`;
  else info.textContent = `${id ? "指定地圖" : "最後狩獵區"}：${name}｜地區怪物 ${mapLevels(map)}；主要怪物 ${mapLevels(map, true)}。`;
}

function fillHuntMaps(st) {
  const sel = $("sup-hunt");
  const want = sel.dataset.initialized ? sel.value : st.settings.supply.huntMap || "";
  const maps = st.huntMaps || [];
  const key = JSON.stringify([maps, st.lastHuntMap]);
  if (sel.dataset.key !== key) {
    const last = st.lastHuntMap;
    const defaultLabel = `最後狩獵區（預設）${last ? `・${maps.find(m => m.id === last.id)?.name || last.name || last.id}` : ""}`;
    sel.replaceChildren(new Option(defaultLabel, ""), ...maps.map(m => new Option(`${m.name}｜怪物 ${mapLevels(m)}`, m.id)));
    sel.dataset.key = key;
  }
  if (want && ![...sel.options].some(o => o.value === want)) sel.append(new Option(`已儲存地圖：${want}（等待地圖資料）`, want));
  sel.value = want;
  sel.dataset.initialized = "true";
  showHuntInfo(st);
}

// ── 自動配點 ──
const codex = window.RajaCodex, statAlloc = window.RajaStatAlloc;
let ratioFilled = false;
function buildAllocTable() {
  const body = $("al-table").querySelector("tbody");
  body.replaceChildren(...codex.statKeys.map((k) => {
    const tr = document.createElement("tr");
    tr.dataset.key = k;
    tr.innerHTML = `<td>${codex.statNames[k]}</td><td><input type="number" min="0" max="100" data-ratio="${k}" /></td><td data-col="ab"></td><td data-col="own"></td><td data-col="now"></td><td data-col="goal"></td>`;
    return tr;
  }));
  body.addEventListener("input", () => latestStatus && showAlloc(latestStatus));
}
const ratioNow = () => Object.fromEntries(codex.statKeys.map((k) => [k, Math.max(0, Math.min(100, Math.floor(Number(document.querySelector(`[data-ratio="${k}"]`).value) || 0)))]).filter(([, v]) => v > 0));
function setRatio(r) { for (const k of codex.statKeys) document.querySelector(`[data-ratio="${k}"]`).value = r?.[k] || 0; }
const pct = (n) => `${(n * 100).toFixed(1)}%`;
function showAlloc(st) {
  const ch = st.char;
  const cls = ch && codex.classes.find((c) => c.id === ch.classId);
  if (!ratioFilled) {
    const saved = st.settings.alloc?.ratio || {};
    // 沒設定過比例：先填遊戲的建議比例（開關還是關著，要自己勾）
    if (Object.keys(saved).length) { setRatio(saved); ratioFilled = true; }
    else if (cls) { setRatio(cls.recommend); ratioFilled = true; }
  }
  const ratio = ratioNow();
  const wSum = Object.values(ratio).reduce((a, b) => a + b, 0);
  const own = ch ? statAlloc.allocated(codex, ch.classId, ch.ab) : null;
  const ownSum = own ? codex.statKeys.reduce((s, k, i) => s + (ratio[k] ? own[i] : 0), 0) : 0;
  for (const tr of $("al-table").querySelectorAll("tbody tr")) {
    const k = tr.dataset.key, i = codex.statKeys.indexOf(k);
    const cell = (c) => tr.querySelector(`[data-col="${c}"]`);
    cell("ab").textContent = ch ? `${ch.ab[i]}／${statAlloc.cap(codex, ch.classId, ch.ds, k)}` : "";
    cell("own").textContent = own ? own[i] : "";
    cell("now").textContent = own && ratio[k] && ownSum ? pct(own[i] / ownSum) : "";
    cell("goal").textContent = ratio[k] ? pct(ratio[k] / wSum) : "";
    tr.className = ratio[k] ? "" : "dim";
  }
  $("al-class").textContent = ch ? `目前角色：${cls?.name || ch.classId}　Lv.${ch.level}　${ch.ds ? `${ch.ds} 轉　` : ""}可分配點數 ${ch.point}　（遊戲建議：${Object.entries(cls?.recommend || {}).map(([k, v]) => `${codex.statNames[k]} ${v}`).join("：")}）` : "遊戲連上、進到角色後才會顯示目前能力。";
  const t = st.allocTarget?.target;
  const tShort = t?.short ? codex.statKeys.map((k, i) => (t.short.short[i] > 0 ? `${codex.statNames[k]} ${t.short.short[i]}` : "")).filter(Boolean).join("、") : "";
  $("al-target").innerHTML = t
    ? `<span class="ok">配點目標：${t.name.replace(/[&<>]/g, "")}</span>${t.short ? (t.short.total ? `（還差 ${tShort}，共 ${t.short.total} 點）` : "（能力已經夠了）") : ""}——有點數時會先配到剛好能用這件，達成後才照下面的比例分。要換或取消請到右鍵「小百科（裝備）」。`
    : "配點目標：沒有（可以在右鍵「小百科（裝備）」的裝備詳細頁按「設為配點目標」）。";  const preview = $("al-preview");
  if (!ch) preview.textContent = "";
  else if (!wSum && !t) preview.textContent = "還沒設定比例。";
  else if (!(ch.point > 0)) preview.textContent = "目前沒有可分配點數，升級拿到點數後會自動分配。";
  else {
    const item = t && codex.items.find((i) => i.no === t.itemNo);
    const add = statAlloc.planWithTarget(codex, ch, item, ratio, $("al-on").checked).add;
    preview.textContent = add.some((n) => n > 0) ? `現在的 ${ch.point} 點會加：${statAlloc.describe(codex, add)}${item ? `（先配目標「${item.name}」）` : ""}` : "有比例的能力都已經到上限，沒辦法再加。";
  }
}
buildAllocTable();
$("al-recommend").addEventListener("click", () => {
  const ch = latestStatus?.char;
  const cls = ch && codex.classes.find((c) => c.id === ch.classId);
  if (cls) setRatio(cls.recommend);
  latestStatus && showAlloc(latestStatus);
});
$("al-clear").addEventListener("click", () => { setRatio({}); latestStatus && showAlloc(latestStatus); });
$("al-on").addEventListener("change", () => latestStatus && showAlloc(latestStatus));

function render(st) {
  latestStatus = st;
  if (!filled) fill(st);
  showAlloc(st);
  fillTowns(st);
  fillHuntMaps(st);
  showStatus(st);
}

$("save").addEventListener("click", () => {
  const supply = { enabled: $("sup-on").checked, town: $("sup-town").value, huntMap: $("sup-hunt").value, hpItem: Number($("hp-item").value) || 0, mpItem: Number($("mp-item").value) || 0 };
  for (const [id, key] of Object.entries(FIELDS)) supply[key] = Number($(id).value) || 0;
  if (supply.hpTo < supply.hpMin) supply.hpTo = supply.hpMin;
  if (supply.mpTo < supply.mpMin) supply.mpTo = supply.mpMin;
  if (supply.ammoTo < supply.ammoMin) supply.ammoTo = supply.ammoMin;
  const fuse = [0, 1, 2].map((i) => ({ enabled: $(`f${i}-on`).checked, count: Math.max(5, Number($(`f${i}-n`).value) || 5) }));
  const revive = { enabled: $("rev-on").checked, supply: $("rev-supply").checked };
  const alloc = { enabled: $("al-on").checked, ratio: ratioNow() };
  window.autoApi.set({ supply, fuse, revive, alloc });
  for (const [id, key] of Object.entries(FIELDS)) $(id).value = supply[key];
  fuse.forEach((f, i) => ($(`f${i}-n`).value = f.count));
  const saved = $("saved");
  saved.style.opacity = 1;
  setTimeout(() => (saved.style.opacity = 0), 1500);
});

window.autoApi.onStatus(render);
$("sup-hunt").addEventListener("change", () => latestStatus && showHuntInfo(latestStatus));
window.autoApi.get().then(render);
