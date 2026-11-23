"use strict";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const codex = window.RajaCodex;
const key = (id) => (id === null ? "null" : String(id));
const unkey = (k) => (k === "null" ? null : k);
const EQUIP_NAMES = ["武器", "盾牌／副手", "頭盔", "盔甲", "項鍊", "鞋子", "飾品 1", "飾品 2"];
const time = (t) => new Date(t).toLocaleTimeString("zh-TW", { hour12: false });

let latest = null, current = null; // current＝目前看的桌寵 key
const picked = new Map(); // slot → {slot, sig, name, n}（只對 current 那隻）

/** 裝備的基本能力（小百科資料）做成滑鼠提示。 */
function itemTip(it) {
  const c = codex?.items.find((x) => x.no === it.no);
  if (!c) return it.name;
  const parts = [it.name];
  if (c.damage) parts.push(`攻擊 ${c.damage}${c.damageRandom ? `+${c.damageRandom}` : ""}`);
  if (c.ar) parts.push(`AC ${c.ar}`);
  const need = Object.entries(c.need || {}).map(([k, v]) => `${codex.statNames[k] || ({ level: "等級", dualStep: "轉職", ws: "魔法力量", ps: "魔法力量", fame: "名聲", gender: "性別" })[k] || k} ${v}`);
  if (need.length) parts.push(`需求：${need.join("、")}`);
  return parts.join("\n");
}
const itemCell = (it) => `${esc(it.name)}${it.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}`;
const amount = (it) => (it.dur ? `${it.dur[0]}/${it.dur[1]}` : it.n > 1 ? `×${it.n.toLocaleString()}` : "");

function renderTabs(st) {
  if (!current || !st.pets.some((p) => key(p.accountId) === current)) current = key(st.pets[0]?.accountId ?? null);
  $("tabs").replaceChildren(...st.pets.map((p) => {
    const b = document.createElement("button");
    b.textContent = `${p.name || "（未登入）"}${p.level ? ` Lv.${p.level}` : ""}`;
    b.title = p.label;
    b.className = key(p.accountId) === current ? "on" : "";
    b.onclick = () => { if (current !== key(p.accountId)) { current = key(p.accountId); picked.clear(); render(latest); } };
    return b;
  }));
}

function renderInv(p) {
  const left = $("left");
  if (!p) { left.innerHTML = `<div class="muted">沒有開著的桌寵。</div>`; return; }
  if (p.status !== "ingame" || !p.inv) { left.innerHTML = `<div class="warn">${esc(p.label)} 還沒進到遊戲，進遊戲後會顯示物品欄。</div>`; return; }
  const bag = p.inv.bag.filter(Boolean);
  // 背包換了內容（撿到、用掉）：選的格子內容不一樣就取消選擇
  for (const [slot, it] of picked) if (!bag.some((b) => b.slot === slot && b.sig === it.sig)) picked.delete(slot);
  const where = p.dead ? `<span class="bad">倒下中</span>` : p.town ? "在主城" : "在練功地圖";
  let html = `<div class="hint">${esc(p.name)}（${esc(p.label)}）・${where}${p.watching ? `・<span class="warn">遊戲視窗開著</span>` : ""}　金幣 <b style="color:#f2d9a6">${p.inv.gold.toLocaleString()}</b></div>`;
  html += `<h2>身上裝備</h2><table>${p.inv.equip.map((it, i) => `<tr><td class="eqslot">${EQUIP_NAMES[i] || i}</td><td ${it ? `title="${esc(itemTip(it))}"` : ""}>${it ? itemCell(it) : `<span class="muted">（空）</span>`}</td><td class="num">${it ? amount(it) : ""}</td></tr>`).join("")}</table>`;
  html += `<h2>背包 <small>${bag.length}／${p.inv.bag.length} 格・點一下選要交易的物品</small></h2>`;
  html += bag.length ? `<table>${bag.map((it) => `<tr class="item${picked.has(it.slot) ? " sel" : ""}" data-slot="${it.slot}" title="${esc(itemTip(it))}"><td class="slot">${it.slot + 1}</td><td>${picked.has(it.slot) ? "✔ " : ""}${itemCell(it)}${ruleHit(p, it.no) ? (it.tags.length && !p.sell?.sellPrecious ? `<span class="sellmark muted">符合規則，但貴重不賣</span>` : `<span class="sellmark">會自動賣</span>`) : ""}</td><td class="num">${amount(it)}</td><td class="act"><button type="button" class="small" data-sell="${it.no}">賣這種</button></td></tr>`).join("")}</table>` : `<div class="muted">背包是空的。</div>`;
  left.innerHTML = html;
}

function renderTrade(st, p) {
  const others = st.pets.filter((x) => key(x.accountId) !== current);
  const sel = $("to");
  const want = sel.value;
  sel.replaceChildren(...(others.length ? others.map((x) => new Option(`${x.name || "（未登入）"}${x.level ? ` Lv.${x.level}` : ""}・${x.label}`, key(x.accountId))) : [new Option("（要再開一隻桌寵）", "")]));
  if ([...sel.options].some((o) => o.value === want)) sel.value = want;
  $("goldHave").textContent = p?.inv ? `（有 ${p.inv.gold.toLocaleString()}）` : "";
  $("picked").innerHTML = picked.size ? `要給的物品（${picked.size} 格）：<br />${[...picked.values()].map((it) => `<div>・${esc(it.name)}${it.n > 1 ? ` ×${it.n}` : ""}</div>`).join("")}` : "還沒選物品。";
  const t = st.trade;
  $("go").disabled = !!t || !others.length;
  $("cancel").hidden = !t;
  if (t) {
    const g = st.pets.find((x) => key(x.accountId) === key(t.fromId)), r = st.pets.find((x) => key(x.accountId) === key(t.toId));
    const step = (x) => (x?.trade?.id === t.id ? esc(x.trade.step) : "準備中");
    $("now").innerHTML = `<b>${esc(t.fromName)}</b> → <b>${esc(t.toName)}</b>：${t.items.map((i) => esc(i.label)).join("、") || "（沒有物品）"}${t.gold ? `、金幣 ${t.gold.toLocaleString()}` : ""}<br />` +
      `${esc(t.fromName)}：${step(g)}<br />${esc(t.toName)}：${step(r)}<br /><span class="muted">${time(t.startedAt)} 開始</span>`;
  } else $("now").textContent = "沒有進行中的交易。";
  const lines = st.pets.flatMap((x) => (x.log || []).map((l) => `${l.slice(0, 8)} [${x.name || x.label}] ${l.slice(9)}`)).sort().reverse();
  $("log").textContent = lines.join("\n");
  $("hist").innerHTML = st.history.length ? st.history.map((h) => `<div><span class="${h.result === "ok" ? "ok" : h.result === "canceled" ? "muted" : "bad"}">${h.result === "ok" ? "成功" : h.result === "canceled" ? "取消" : "失敗"}</span>　${time(h.at)}　${esc(h.from)} → ${esc(h.to)}：${h.items.map(esc).join("、") || "（沒有物品）"}${h.gold ? `、金幣 ${h.gold.toLocaleString()}` : ""}${h.result === "ok" ? "" : `（${esc(h.text)}）`}</div>`).join("") : "（還沒有）";
}

// ── 自動販售 ──
let catalog = null, catMap = new Map(); // 道具編號 → [名稱, 大類, 小類]
const scope = () => document.querySelector("input[name=scope]:checked").value; // "global" | "pet"
const curPet = () => latest?.pets.find((x) => key(x.accountId) === current);
/** 這隻實際會用的規則有沒有包含這種道具（顯示「會自動賣」用；實際賣不賣還要看貴重、鎖定）。 */
function ruleHit(p, no) {
  if (!p || !latest) return false;
  const rules = [...(p.sell?.enabled ? p.sell.rules : []), ...(latest.sellGlobal?.enabled && p.sell?.useGlobal ? latest.sellGlobal.rules : [])];
  const c = catMap.get(no);
  return rules.some((r) => (r.kind === "item" ? r.no === no : !!c && c[1] !== "potion" && r.cat === c[1] && (!r.sub || r.sub === c[2])));
}
function cfgNow() {
  const p = curPet();
  return scope() === "global" ? latest.sellGlobal : p?.sell;
}
async function saveCfg(cfg) {
  const r = await window.invApi.sellSet(scope() === "global" ? "global" : current, cfg);
  $("sell-msg").className = r?.error ? "hint bad" : "hint ok";
  $("sell-msg").textContent = r?.error || "已儲存";
  render(await window.invApi.get());
}
function addRule(rule) {
  const cfg = cfgNow();
  if (!cfg) return;
  saveCfg({ ...cfg, enabled: true, rules: [...cfg.rules, rule] }); // 加了規則就是要用：順便打開這個範圍
}
function fillCats() {
  const catSel = $("cat");
  if (!catalog) { catSel.replaceChildren(new Option("（遊戲連上後才有分類清單）", "")); $("sub").replaceChildren(); $("item").replaceChildren(); return; }
  if (!catSel.options.length || catSel.options[0].value === "") catSel.replaceChildren(...Object.entries(catalog.cats).map(([k, v]) => new Option(v, k)));
  fillSubs();
}
function fillSubs() {
  const cat = $("cat").value;
  const subs = [...new Set(catalog.items.filter((r) => r[2] === cat && r[3]).map((r) => r[3]))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  $("sub").replaceChildren(new Option(subs.length ? "（整個大類）" : "—", ""), ...subs.map((s) => new Option(s, s)));
  $("sub").disabled = !subs.length;
  fillItems();
}
function fillItems() {
  const cat = $("cat").value, sub = $("sub").value;
  const list = catalog.items.filter((r) => r[2] === cat && (!sub || r[3] === sub)).sort((a, b) => a[1].localeCompare(b[1], "zh-Hant"));
  const all = cat === "potion" ? [] : [new Option(`（這一類全部，共 ${list.length} 種）`, "all")];
  $("item").replaceChildren(...all, ...list.map((r) => new Option(r[1], String(r[0]))));
}
function renderSell(st) {
  const p = curPet();
  $("scope-name").textContent = p ? p.name || p.label : "";
  const g = scope() === "global", cfg = cfgNow();
  const opts = $("scope-opts");
  if (!cfg) { opts.innerHTML = `<div class="warn">這隻桌寵還沒準備好。</div>`; $("rules").textContent = ""; return; }
  const sig = JSON.stringify([g, cfg, current]);
  if (opts.dataset.sig !== sig) {
    opts.dataset.sig = sig;
    opts.innerHTML = g
      ? `<div class="row"><label><input type="checkbox" data-k="enabled" ${cfg.enabled ? "checked" : ""} /> 啟用「全部桌寵」的規則</label></div><div class="hint">每隻桌寵可以在「只有這隻」裡取消套用全部桌寵的規則。</div>`
      : `<div class="row"><label><input type="checkbox" data-k="enabled" ${cfg.enabled ? "checked" : ""} /> 啟用這隻自己的規則</label></div>
         <div class="row"><label><input type="checkbox" data-k="useGlobal" ${cfg.useGlobal ? "checked" : ""} /> 也套用「全部桌寵」的規則${st.sellGlobal.enabled ? "" : `<span class="muted">（全部桌寵的規則目前沒開）</span>`}</label></div>
         <div class="row">背包剩 <input type="number" data-k="freeSlots" min="0" max="90" value="${cfg.freeSlots}" style="width:70px" /> 格以下就回城賣</div>
         <div class="row"><label><input type="checkbox" data-k="sellPrecious" ${cfg.sellPrecious ? "checked" : ""} /> <span class="warn">稀有、+強化、追蹤詞綴等「貴重」的也賣</span></label></div>`;
  }
  $("rules-title").textContent = g ? "全部桌寵的規則" : `${p.name || p.label} 自己的規則`;
  $("rules").innerHTML = cfg.rules.length ? cfg.rules.map((r, i) => `<div><span>${r.kind === "item" ? esc(r.name) : `<b>${esc(r.label)}</b>（整類）`}</span><button type="button" class="small" data-del="${i}">移除</button></div>`).join("") : "（沒有）";
  const now = p?.sellNow;
  $("sell-now").innerHTML = !p || p.status !== "ingame" ? "遊戲還沒連上。" :
    `背包空格 ${now?.free ?? "?"} 格・實際套用 ${p.sellActive} 條規則<br />` +
    (now?.count ? `現在符合、會賣的：${now.count} 件（約 ${now.gold.toLocaleString()} 金幣）<br /><span class="muted">${now.names.map(esc).join("、")}${now.count > now.names.length ? "…" : ""}</span>` : "背包裡現在沒有要賣的。") +
    (now?.error ? `<br /><span class="bad">上次沒賣成：${esc(now.error)}</span>` : "");
}

function render(st) {
  latest = st;
  renderTabs(st);
  const p = st.pets.find((x) => key(x.accountId) === current);
  renderInv(p);
  renderTrade(st, p);
  renderSell(st);
}
// 右邊分頁：指定交易／自動販售
$("rtabs").addEventListener("click", (e) => {
  const t = e.target.dataset?.tab;
  if (!t) return;
  for (const b of $("rtabs").children) b.classList.toggle("on", b.dataset.tab === t);
  $("pane-trade").hidden = t !== "trade";
  $("pane-sell").hidden = t !== "sell";
});
for (const r of document.querySelectorAll("input[name=scope]")) r.addEventListener("change", () => latest && renderSell(latest));
$("scope-opts").addEventListener("change", (e) => {
  const k = e.target.dataset?.k;
  if (!k) return;
  const cfg = cfgNow();
  saveCfg({ ...cfg, [k]: e.target.type === "checkbox" ? e.target.checked : Number(e.target.value) || 0 });
});
$("cat").addEventListener("change", fillSubs);
$("sub").addEventListener("change", fillItems);
$("add").addEventListener("click", () => {
  if (!catalog) return;
  const cat = $("cat").value, sub = $("sub").value, v = $("item").value;
  if (v === "all") addRule({ kind: "cat", cat, sub, label: `${catalog.cats[cat]}${sub ? `＞${sub}` : ""}` });
  else if (v) addRule({ kind: "item", no: Number(v), name: $("item").selectedOptions[0].text });
});
$("rules").addEventListener("click", (e) => {
  const i = e.target.dataset?.del;
  if (i === undefined) return;
  const cfg = cfgNow();
  saveCfg({ ...cfg, rules: cfg.rules.filter((_, k) => k !== Number(i)) });
});
async function loadCatalog() {
  catalog = await window.invApi.catalog();
  catMap = new Map((catalog?.items || []).map((r) => [r[0], [r[1], r[2], r[3]]]));
  fillCats();
}
loadCatalog();
setInterval(() => { if (!catalog) loadCatalog(); }, 10000);

$("left").addEventListener("click", (e) => {
  const sellNo = e.target.dataset?.sell;
  if (sellNo) {
    const no = Number(sellNo), it = curPet()?.inv?.bag.find((b) => b && b.no === no);
    addRule({ kind: "item", no, name: it?.name || catMap.get(no)?.[0] || String(no) });
    $("sell-msg").textContent = `已加入${scope() === "global" ? "全部桌寵" : "這隻"}的規則：${it?.name || no}`;
    return;
  }
  const tr = e.target.closest("tr.item");
  if (!tr || !latest) return;
  const slot = Number(tr.dataset.slot);
  const p = latest.pets.find((x) => key(x.accountId) === current);
  const it = p?.inv?.bag.find((b) => b && b.slot === slot);
  if (!it) return;
  if (picked.has(slot)) picked.delete(slot);
  else if (picked.size < 20) picked.set(slot, { slot, sig: it.sig, name: it.name, n: it.n });
  render(latest);
});
$("clear").addEventListener("click", () => { picked.clear(); latest && render(latest); });
$("go").addEventListener("click", async () => {
  const r = await window.invApi.trade({ fromId: unkey(current), toId: unkey($("to").value), items: [...picked.values()].map(({ slot, sig }) => ({ slot, sig })), gold: Number($("gold").value) || 0 });
  $("msg").className = r?.error ? "bad" : "ok";
  $("msg").textContent = r?.error || "已開始";
  if (!r?.error) { picked.clear(); $("gold").value = 0; }
  render(await window.invApi.get());
});
$("cancel").addEventListener("click", async () => { await window.invApi.cancel(); render(await window.invApi.get()); });
window.invApi.onStatus(render);
window.invApi.get().then(render);
