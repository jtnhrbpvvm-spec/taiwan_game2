"use strict";
const $ = (id) => document.getElementById(id);
const codex = window.RajaCodex, statAlloc = window.RajaStatAlloc;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const className = (id) => codex.classes.find((c) => c.id === id)?.name || id;
const STAT_LABELS = new Set([...Object.values(codex.statNames), "智慧或智力"]);
const BONUS_NAMES = { ...codex.statNames, ws: "魔法力量（法師）", ps: "魔法力量（祭司）" };
const SPECIAL_NAMES = { lifeMax: "HP 上限", manaMax: "MP 上限", divineMax: "神力上限", hitRate: "命中", defenseRate: "防禦率" };

let me = null; // 角色（game-hook 的 auto.char）
let alloc = null; // 配點目標、紀錄（主程式 allocInfo()）
let sortKey = "level", sortDir = 1, selected = null;

/** 角色能力（物件）：照 statKeys 把 ab 陣列轉成 {str:…} */
function charForCheck() {
  if (!me) return null;
  const abilities = Object.fromEntries(codex.statKeys.map((k, i) => [k, me.ab[i] ?? 0]));
  return { ...me, abilities };
}

/** 檢查結果：ok＝能用；points＝只差能力點、可分配點數夠；no＝不能用。 */
function judge(item) {
  const ch = charForCheck();
  if (!ch) return { state: "", checks: [] };
  const checks = statAlloc.check(codex, item, ch);
  const bad = checks.filter((c) => !c.ok);
  if (!bad.length) return { state: "ok", checks };
  const statOnly = bad.every((c) => STAT_LABELS.has(c.label) || c.label === "魔法力量");
  const need = bad.reduce((s, c) => s + Math.max(0, Number(c.short) || 0), 0);
  return { state: statOnly && need <= (me.point || 0) ? "points" : "no", checks, need, statOnly };
}

const levelOf = (it) => it.need?.level || 0;
const slotName = (it) => it.thrown ? "投擲" : it.skill !== undefined && (it.slot === 2 || it.slot === 10) ? `${it.slot === 10 ? "雙手" : "單手"}・${codex.skills[it.skill]}` : codex.slots[it.slot];

function statusText(j) {
  if (!j.state) return "";
  if (j.state === "ok") return `<span class="ok">能用</span>`;
  const bad = j.checks.filter((c) => !c.ok);
  const txt = bad.map((c) => (c.short > 0 ? `${c.label} 差 ${c.short}` : c.label)).join("、");
  return `<span class="${j.state === "points" ? "near" : "bad"}">${esc(txt)}</span>`;
}

function fillFilters() {
  $("slot").append(...Object.entries(codex.slots).map(([v, n]) => new Option(n, v)), new Option("投擲武器", "thrown"));
  $("cls").append(...codex.classes.map((c) => new Option(c.name, c.id)));
  $("ver").textContent = `遊戲資料 ${codex.gameVersion}（${codex.builtAt} 整理）`;
}

function filtered() {
  const q = $("q").value.trim();
  const slot = $("slot").value, cls = $("cls").value, usable = $("usable").value;
  return codex.items.map((it) => ({ it, j: judge(it) })).filter(({ it, j }) => {
    if (q && !it.name.includes(q)) return false;
    if (slot === "thrown" ? !it.thrown : slot && String(it.slot) !== slot) return false;
    if (cls && it.classes && !it.classes.includes(cls)) return false;
    if (usable === "ok" && j.state !== "ok") return false;
    if (usable === "points" && j.state !== "points") return false;
    if (usable === "no" && j.state === "ok") return false;
    return true;
  });
}

function sortRows(rows) {
  const order = { ok: 0, points: 1, no: 2, "": 3 };
  const val = ({ it, j }) => sortKey === "name" ? it.name : sortKey === "slot" ? it.slot * 100 + (it.skill ?? 0) :
    sortKey === "damage" ? it.damage || 0 : sortKey === "ar" ? it.ar || 0 : sortKey === "status" ? order[j.state] : levelOf(it);
  return rows.sort((a, b) => {
    const x = val(a), y = val(b);
    return (typeof x === "string" ? x.localeCompare(y, "zh-Hant") : x - y) * sortDir || levelOf(a.it) - levelOf(b.it) || a.it.no - b.it.no;
  });
}

function renderList() {
  const rows = sortRows(filtered());
  $("count").textContent = `${rows.length} 件`;
  const body = $("rows");
  body.replaceChildren(...rows.slice(0, 600).map(({ it, j }) => {
    const tr = document.createElement("tr");
    tr.className = `item${selected === it.no ? " sel" : ""}`;
    tr.dataset.no = it.no;
    tr.innerHTML = `<td>${esc(it.name)}${alloc?.target?.itemNo === it.no ? `<span class="target-tag">配點目標</span>` : ""}</td><td>${esc(slotName(it))}</td><td class="num">${levelOf(it) || ""}</td>` +
      `<td class="num">${it.damage ? `${it.damage}${it.damageRandom ? `+${it.damageRandom}` : ""}` : ""}</td><td class="num">${it.ar || ""}</td><td>${statusText(j)}</td>`;
    return tr;
  }));
  if (rows.length > 600) $("count").textContent += "（只列前 600 件，請用搜尋或篩選縮小範圍）";
}

function renderDetail(no) {
  const it = codex.items.find((x) => x.no === no);
  if (!it) return;
  const j = judge(it);
  const rows = (pairs) => `<table>${pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join("")}</table>`;
  let html = `<h2>${esc(it.name)}</h2><div class="muted">編號 ${it.no}・${esc(slotName(it))}</div>`;
  const base = [];
  if (it.damage) base.push(["攻擊力", `${it.damage}${it.damageRandom ? `（浮動 +${it.damageRandom}）` : ""}`]);
  if (it.ar) base.push(["AC（防禦）", it.ar]);
  for (const k of ["hitRate", "defenseRate", "lifeMax", "manaMax", "divineMax"]) if (it[k]) base.push([SPECIAL_NAMES[k], `+${it[k]}`]);
  if (it.maxDuration && !it.thrown) base.push(["耐久", it.maxDuration]);
  if (it.weight) base.push(["重量", it.weight]);
  html += `<h3>基本能力</h3>${base.length ? rows(base) : `<div class="muted">沒有</div>`}`;
  const bonus = Object.entries(it.bonus || {}).map(([k, v]) => [BONUS_NAMES[k] || k, `${v > 0 ? "+" : ""}${v}`]);
  const resist = Object.entries(it.resist || {}).map(([k, v]) => [`${codex.resistNames[k] || k}抵抗`, `${v > 0 ? "+" : ""}${v}`]);
  if (bonus.length || resist.length) html += `<h3>穿上後加的能力</h3>${rows([...bonus, ...resist])}`;
  html += `<h3>使用限制</h3>`;
  const limits = [];
  limits.push(["職業", it.classes ? it.classes.map(className).join("、") : "全部職業"]);
  if (it.nations) limits.push(["國家", it.nations.map((n) => codex.nations[n] || n).join("、")]);
  if (j.checks.length) {
    html += rows(limits) + `<table>${j.checks.map((c) => `<tr><td>${esc(c.label)}</td><td class="${c.ok ? "ok" : "bad"}">需要 ${esc(c.need)}・你 ${esc(c.have)}${c.ok ? " ✓" : c.short > 0 ? `（差 ${c.short}）` : ""}</td></tr>`).join("")}</table>`;
    if (j.state === "ok") html += `<div class="hint ok">現在就能裝備。</div>`;
    else if (j.state === "points") html += `<div class="hint near">只差能力點，共 ${j.need} 點，目前可分配點數 ${me.point} 點就夠了（到「能力」頁配點，或用自動配點）。</div>`;
    else if (j.statOnly) html += `<div class="hint bad">只差能力點，共差 ${j.need} 點（目前可分配 ${me?.point ?? 0} 點）。</div>`;
  } else {
    const need = it.need || {};
    for (const k of ["str", "dex", "con", "endu", "cha", "mor", "movp", "luck", "wis", "int"]) if (need[k]) limits.push([codex.statNames[k], need[k]]);
    if (need.ws) limits.push(["魔法力量（法師）", need.ws]);
    if (need.ps) limits.push(["魔法力量（祭司）", need.ps]);
    if (it.skillNeed > 1) limits.push([`${codex.skills[it.skill]}熟練`, it.skillNeed]);
    if (need.level) limits.push(["等級", need.level]);
    if (need.dualStep) limits.push(["轉職", `${need.dualStep} 轉`]);
    if (need.fame) limits.push(["名聲", need.fame]);
    if (need.gender) limits.push(["性別", need.gender === 1 ? "男" : "女"]);
    html += rows(limits) + `<div class="hint">遊戲連上、進到角色後，會標出你能不能用、差多少。</div>`;
  }
  html += targetBlock(it, j);
  $("detail").innerHTML = html;
}

// ── 配點目標 ──
const RESULT_NAMES = { done: "達成", canceled: "取消", replaced: "換成別件" };
const when = (t) => (t ? new Date(t).toLocaleString("zh-TW", { hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const shortText = (short) => codex.statKeys.map((k, i) => (short[i] > 0 ? `${codex.statNames[k]} ${short[i]}` : "")).filter(Boolean).join("、");

/** 裝備詳細頁下面的「設為配點目標」區塊。 */
function targetBlock(it, j) {
  const isTarget = alloc?.target?.itemNo === it.no;
  const hasStatNeed = ["str", "dex", "con", "endu", "cha", "mor", "movp", "luck", "wis", "int", "ws", "ps"].some((k) => it.need?.[k] > 0);
  let html = `<h3>配點目標</h3>`;
  if (!hasStatNeed) return html + `<div class="muted">這件沒有能力需求，不用配點。</div>`;
  if (isTarget) {
    html += `<div class="near">這件是目前的配點目標。</div>`;
    html += `<button type="button" class="small" data-act="cancel">取消目標</button>`;
  } else {
    let note = "";
    if (me) {
      const t = statAlloc.targetShort(codex, it, me);
      if (it.classes && !it.classes.includes(me.classId)) note = `<span class="bad">你的職業不能用這件。</span>`;
      else if (t.overCap.length) note = `<span class="bad">${esc(t.overCap.join("、"))}的需求超過你目前的能力上限，配點配不到。</span>`;
      else if (!t.total) note = `<span class="ok">能力已經夠了，不用再配點。</span>`;
      else note = `還差 ${esc(shortText(t.short))}，共 ${t.total} 點（目前可分配 ${me.point} 點）。`;
    }
    html += `<div>${note}</div><button type="button" data-act="set" data-no="${it.no}">設為配點目標</button>`;
    if (alloc?.target) html += `<div class="hint">會取代目前的目標「${esc(alloc.target.name)}」。</div>`;
  }
  html += `<span id="target-msg"></span>`;
  html += `<div class="hint">設成目標後，有可分配點數時桌寵會先把點數配到<b>剛好</b>能用這件（點數不夠就先配一部分，之後升級拿到點數再繼續），達成後自動清掉目標並記到紀錄。<br />` +
    `剩下的點數：「自動配點」有勾就照比例分，沒勾就留著。等級、轉職、熟練這些配點補不了的條件要自己練。</div>`;
  return html;
}

function renderTargetBar() {
  const t = alloc?.target;
  if (!t) $("target").innerHTML = `配點目標：<span class="muted">（沒有。在下面的裝備詳細頁按「設為配點目標」）</span>`;
  else {
    const rest = t.short ? (t.short.total ? `還差 ${esc(shortText(t.short.short))}，共 ${t.short.total} 點` : "能力已經夠了") : "連上遊戲後會算還差多少";
    $("target").innerHTML = `配點目標：<b>${esc(t.name)}</b>（${when(t.setAt)} 設定）　${rest}${alloc.enabled ? "" : `　<span class="muted">（比例配點沒開：達成目標後剩下的點數會留著）</span>`}`;
  }
  $("target-show").hidden = !t;
  $("target-cancel").hidden = !t;
  const hist = alloc?.history || [];
  $("hist").querySelector("summary").textContent = `目標紀錄（${hist.length}）`;
  $("hist-list").replaceChildren(...(hist.length ? hist.map((h) => {
    const d = document.createElement("div");
    d.innerHTML = `<span class="${h.result === "done" ? "ok" : "muted"}">${RESULT_NAMES[h.result]}</span>　${esc(h.name)}　${when(h.setAt)} → ${when(h.endAt)}`;
    return d;
  }) : [Object.assign(document.createElement("div"), { textContent: "（還沒有）" })]));
}

async function setTarget(itemNo) {
  const r = await window.codexApi.setTarget(itemNo);
  await refreshMe(true);
  const msg = $("target-msg");
  if (msg && r?.error) { msg.className = "bad"; msg.textContent = r.error; }
}

async function refreshMe(force = false) {
  try {
    const r = await window.codexApi.char();
    const next = r?.char || null;
    const changed = force || JSON.stringify(next) !== JSON.stringify(me) || JSON.stringify(r?.alloc) !== JSON.stringify(alloc);
    me = next;
    alloc = r?.alloc || null;
    renderTargetBar();
    if (me) {
      const cls = codex.classes.find((c) => c.id === me.classId);
      const ab = codex.statKeys.map((k, i) => `${codex.statNames[k]} ${me.ab[i]}`).join("、");
      $("me").textContent = `${r.name || "角色"}：${cls?.name || me.classId} Lv.${me.level}${me.ds ? `・${me.ds} 轉` : ""}・可分配點數 ${me.point}　｜　${ab}`;
      if (!$("cls").dataset.touched) $("cls").value = me.classId;
    } else $("me").textContent = "遊戲還沒連上（或還沒進到角色），先列出全部裝備；連上後會標出能不能用。";
    if (changed) { renderList(); if (selected) renderDetail(selected); }
  } catch {}
}

fillFilters();
for (const id of ["q", "slot", "cls", "usable"]) $(id).addEventListener("input", () => { if (id === "cls") $("cls").dataset.touched = "1"; renderList(); });
document.querySelector("#list thead").addEventListener("click", (e) => {
  const k = e.target.dataset?.sort;
  if (!k) return;
  sortDir = sortKey === k ? -sortDir : 1;
  sortKey = k;
  renderList();
});
$("rows").addEventListener("click", (e) => {
  const tr = e.target.closest("tr.item");
  if (!tr) return;
  selected = Number(tr.dataset.no);
  for (const r of $("rows").querySelectorAll("tr.sel")) r.classList.remove("sel");
  tr.classList.add("sel");
  renderDetail(selected);
});
$("detail").addEventListener("click", (e) => {
  const act = e.target.dataset?.act;
  if (act === "set") setTarget(Number(e.target.dataset.no));
  else if (act === "cancel") setTarget(null);
});
$("target-cancel").addEventListener("click", () => setTarget(null));
$("target-show").addEventListener("click", () => {
  if (!alloc?.target) return;
  selected = alloc.target.itemNo;
  renderList();
  renderDetail(selected);
});
renderList();
refreshMe();
setInterval(refreshMe, 5000);
