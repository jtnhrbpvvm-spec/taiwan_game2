"use strict";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const codex = window.RajaCodex;
const LP = window.RajaLifePlan.make(codex);
const nameOf = (no) => codex.itemNames[no] || `#${no}`;
let info = null, form = null; // form＝畫面上正在編輯的設定（第一次拿到資料時從已存的設定填）

const life = () => info?.now?.life || [];
const have = () => info?.now?.have || {};
const lv = (skill) => LP.level(life(), skill);
function formNow() {
  return {
    skill: Number($("skill").value), mode: document.querySelector("input[name=mode]:checked")?.value || "best",
    recipe: Number($("recipe").value) || 0, count: Math.max(0, Math.floor(Number($("count").value) || 0)),
    chain: $("chain").checked, buy: $("buy").checked,
  };
}
function fillForm(cfg) {
  $("skill").replaceChildren(...codex.craftSkills.map((s) => new Option(s.name, String(s.skill))));
  $("skill").value = String(cfg.skill);
  for (const r of document.querySelectorAll("input[name=mode]")) r.checked = r.value === cfg.mode;
  $("count").value = cfg.count;
  $("chain").checked = cfg.chain;
  $("buy").checked = cfg.buy;
  fillRecipes(cfg.recipe);
}
function fillRecipes(want) {
  const skill = Number($("skill").value);
  const list = LP.forSkill(skill).sort((a, b) => a.min - b.min || a.no - b.no);
  $("recipe").replaceChildren(...list.map((r) => new Option(`${nameOf(r.itemNo)}（Lv${r.min}${LP.unlocked(r, life()) ? "" : "・等級不夠"}）`, String(r.no))));
  if (want && list.some((r) => r.no === want)) $("recipe").value = String(want);
}

function renderLevels() {
  const all = [...codex.craftSkills.map((s) => ({ ...s, kind: "製作" })), ...codex.gatherSkills.map((s) => ({ ...s, kind: "採集" }))];
  $("levels").innerHTML = info?.now ? all.map((s) => `<span class="lv">${esc(s.name)} <b class="gold">${Math.trunc((life()[s.group] || 0) / 10000)}</b></span>`).join("") : "遊戲連上、進到角色後才會顯示。";
}
function renderRecipes() {
  const skill = Number($("skill").value);
  const s = codex.craftSkills.find((x) => x.skill === skill);
  $("recipes-title").textContent = `${s?.name || ""}的配方（你 ${lv(skill)} 級）`;
  const sel = Number($("recipe").value);
  const list = LP.forSkill(skill).sort((a, b) => a.min - b.min || a.no - b.no);
  const opts = { life: life(), chain: false, buy: false, hasTool: () => true };
  $("recipes").innerHTML = list.map((r) => {
    const open = LP.unlocked(r, life());
    const n = LP.maxCount(r, have(), opts, 999);
    const tool = LP.toolKind(r);
    return `<tr class="pick${open ? "" : " locked"}${r.no === sel && formNow().mode === "recipe" ? " sel" : ""}" data-no="${r.no}">` +
      `<td>${esc(nameOf(r.itemNo))}${r.amount > 1 ? ` ×${r.amount}` : ""}${tool ? `<br /><span class="muted">工具：${esc(codex.toolNames[tool] || tool)}</span>` : ""}</td>` +
      `<td class="num">${r.min}～${r.max}</td><td class="num">${open ? `${LP.rate(r, life())}%` : "—"}</td>` +
      `<td>${r.mats.map((m) => `${esc(nameOf(m.itemNo))}×${m.amount}<span class="muted">（有 ${have()[m.itemNo] || 0}）</span>`).join("<br />")}</td>` +
      `<td class="num">${n ? `<span class="ok">${n}</span>` : "0"}</td></tr>`;
  }).join("");
}
function renderPreview() {
  const f = formNow();
  const out = [];
  if (!info?.now) { $("preview").textContent = "遊戲連上後才能預覽。"; return; }
  const n = f.count > 0 ? Math.min(f.count, 20) : 20;
  const opts = { life: life(), chain: f.chain, buy: f.buy, hasTool: () => true, canBuy: () => true, canBuyTool: () => true };
  let r = f.mode === "recipe" ? LP.byNo.get(f.recipe) : null, skipped = null;
  if (f.mode === "best") {
    // 跟桌寵一樣：從最高等級往下找第一個材料湊得出來的
    const order = LP.bestOrder(f.skill, life());
    r = order.find((x) => LP.maxCount(x, have(), opts, n) > 0) || order[0];
    if (r && order[0] && r !== order[0]) skipped = order[0];
  }
  if (!r) { $("preview").textContent = f.mode === "best" ? "這個技能現在沒有能做的配方。" : "請選要做的物品。"; return; }
  if (!LP.unlocked(r, life())) { $("preview").innerHTML = `<span class="bad">${esc(nameOf(r.itemNo))} 要 ${r.min} 級，你現在 ${lv(r.skill)} 級。</span>`; return; }
  if (skipped) out.push(`<span class="muted">最高等級的「${esc(nameOf(skipped.itemNo))}」（Lv${skipped.min}）材料湊不出來，先做下面這個</span>`);
  const max = LP.maxCount(r, have(), { ...opts, buy: false }, 999);
  // 一直做（count 0）：一批最多 20 次，湊得出幾次就做幾次；指定數量：照數量（最多 20 一批）
  const batch = f.count > 0 ? n : f.buy ? n : Math.max(1, Math.min(n, max));
  const p = LP.plan(r, batch, have(), opts);
  out.push(`要做：<b>${esc(nameOf(r.itemNo))}</b>（Lv${r.min}～${r.max}，成功率 ${LP.rate(r, life())}%）${f.mode === "best" ? `<span class="muted">・目前最高等級能做的</span>` : ""}`);
  out.push(`只用背包現有的${f.chain ? "（含先做中間材料）" : ""}：可以做 <b>${max}</b> 次`);
  if (p.ok) {
    out.push(`${f.count > 0 && f.count > 20 ? "第一批" : "這一批"}做 ${batch} 次的步驟：${p.steps.map((s) => `${esc(nameOf(s.recipe.itemNo))}×${s.count}（${esc(LP.skillOf(s.recipe.skill)?.name || "")}）`).join(" → ")}`);
    const buys = Object.entries(p.buys);
    if (buys.length) out.push(`<span class="warn">要買：${buys.map(([no, q]) => `${esc(nameOf(Number(no)))} ${q}`).join("、")}</span>（主城有賣才買得到，實際以遊戲商店為準）`);
  } else {
    out.push(`<span class="bad">做 ${batch} 次材料不夠：缺 ${p.missing.map((m) => `${esc(nameOf(m.itemNo))} ${m.amount}`).join("、")}</span>${f.buy ? "" : "（可以勾「自動購買不足的材料」）"}`);
  }
  const tool = LP.toolKind(r);
  if (tool) out.push(`需要工具：${esc(codex.toolNames[tool] || tool)}（身上或背包要有）`);
  $("preview").innerHTML = out.join("<br />");
}
function renderNow() {
  const now = info?.now, cfg = info?.cfg;
  $("who").textContent = info ? `${info.name || "（未登入）"}・${info.status !== "ingame" ? "遊戲還沒連上" : info.town ? "在主城" : "不在主城"}${info.watching ? "・遊戲視窗開著（暫停）" : ""}` : "";
  const lines = [];
  lines.push(cfg?.enabled ? `<span class="ok">練習中</span>：${esc(codex.craftSkills.find((s) => s.skill === cfg.skill)?.name || "")}・${cfg.mode === "best" ? "最高等級能做的" : esc(nameOf(LP.byNo.get(cfg.recipe)?.itemNo))}・${cfg.count ? `${cfg.count} 件` : "一直做"}` : "沒有在練。");
  if (now?.mk) { const r = LP.byNo.get(now.mk); lines.push(`遊戲正在做：${esc(nameOf(r?.itemNo))}${now.mkn ? `（還有 ${now.mkn}）` : ""}`); }
  if (now?.state) lines.push(esc(now.state));
  if (cfg?.enabled && now) lines.push(`這次已做：${now.made} 件`);
  $("now").innerHTML = lines.join("<br />");
  $("log").textContent = (info?.log || []).slice().reverse().join("\n");
  $("start").textContent = cfg?.enabled ? "套用變更" : "開始練習";
  $("stop").disabled = !cfg?.enabled;
}
function render() {
  if (!form && info?.cfg) { form = info.cfg; fillForm(form); }
  renderLevels();
  renderRecipes();
  renderPreview();
  renderNow();
}
async function save(enabled) {
  const cfg = { ...formNow(), enabled };
  if (enabled && cfg.mode === "recipe" && !cfg.recipe) { $("msg").className = "bad"; $("msg").textContent = "請選要做的物品"; return; }
  info = await window.lifeApi.set(cfg);
  $("msg").className = "ok";
  $("msg").textContent = enabled ? "已開始（回主城後開始做）" : "已停止";
  render();
}

$("skill").addEventListener("change", () => { fillRecipes(0); render(); });
$("recipe").addEventListener("change", () => { document.querySelector("input[name=mode][value=recipe]").checked = true; render(); });
for (const id of ["count", "chain", "buy"]) $(id).addEventListener("input", render);
for (const r of document.querySelectorAll("input[name=mode]")) r.addEventListener("change", render);
$("recipes").addEventListener("click", (e) => {
  const tr = e.target.closest("tr.pick");
  if (!tr) return;
  $("recipe").value = tr.dataset.no;
  document.querySelector("input[name=mode][value=recipe]").checked = true;
  render();
});
$("start").addEventListener("click", () => save(true));
$("stop").addEventListener("click", () => save(false));
async function refresh() { info = await window.lifeApi.get(); render(); }
refresh();
setInterval(refresh, 3000);
