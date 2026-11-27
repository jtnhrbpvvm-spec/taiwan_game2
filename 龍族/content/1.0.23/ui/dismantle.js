"use strict";
// 分解視窗（使用者 2026-11-26）：勾稀有度＋部位（跟遊戲分解視窗一樣）、看三種等級檔次可能拿到的素材、目前背包符合的裝備。
// 素材資料：codex-data.js 的 dismantle（遊戲主程式裡的分解設定表）、monsterLevels（怪物最低等級）、items[].src.drops（掉落）。
const $ = (id) => document.getElementById(id);
const api = window.dismantleApi;
const C = window.RajaCodex || {};
const D = C.dismantle || null;
const RARITY = ["普通", "稀有", "高級", "史詩"];
const PARTS = [["weapon", "武器"], ["armor", "防具"], ["acc", "飾品"]];
const PART_NAME = Object.fromEntries(PARTS);
let cfg = null, bag = { items: [], free: 0, ok: false };

const itemByNo = new Map((C.items || []).map((i) => [i.no, i]));
// 物品等級（使用者 2026-11-26：應該是生活技能能製作這件的等級）：有配方就用配方的最低等級；
// 不能製作的才退回「會掉這件的怪物裡等級最低的」當參考。都沒有＝null。
const craftMin = new Map();
for (const r of C.recipes || []) if (Number.isFinite(r[4])) craftMin.set(r[1], Math.min(craftMin.get(r[1]) ?? Infinity, r[4]));
function levelInfo(no) {
  const it = itemByNo.get(no);
  const c = craftMin.get(no) ?? (it && it.src && it.src.craft && Number.isFinite(it.src.craft.min) ? it.src.craft.min : undefined);
  if (c !== undefined) return { lv: c, from: "製作" };
  const lv = (it && it.src && it.src.drops || []).flatMap(([, mobs]) => mobs.map((m) => (C.monsterLevels || {})[m])).filter(Number.isFinite);
  return lv.length ? { lv: Math.min(...lv), from: "掉落" } : null;
}
const itemLevel = (no) => { const x = levelInfo(no); return x ? x.lv : null; };
const tierOf = (lv) => { if (!D || lv === null) return -1; let t = 0; D.tierLevels.forEach((min, i) => { if (lv >= min) t = i; }); return t; };
const tierRange = (i) => (D.tierLevels[i + 1] !== undefined ? `Lv ${D.tierLevels[i]}～${D.tierLevels[i + 1] - 1}` : `Lv ${D.tierLevels[i]} 以上`);
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const pct = (v) => (v ? `${v}%` : "—");

function current() {
  return {
    enabled: $("on").checked, freeSlots: Math.max(0, Math.min(90, Number($("free").value) || 0)),
    rarities: RARITY.map((_, i) => $(`rar${i}`).checked),
    parts: Object.fromEntries(PARTS.map(([k]) => [k, $(`part-${k}`).checked])),
  };
}

function renderStatic() {
  if (!D) { $("tier-hint").textContent = "小百科資料裡沒有分解設定（要用新版遊戲重新產生 codex-data.js）。"; return; }
  // 稀有度表
  $("rarities").replaceChildren(...RARITY.map((name, i) => {
    const up = D.upPercentByRarity[i] || [0, 0];
    const lo = Math.round(D.baseMin * D.rarityMaterialMult[i] * 10) / 10, hi = Math.round(D.baseMax * D.rarityMaterialMult[i] * 10) / 10;
    return el("tr", {},
      el("td", {}, el("input", { type: "checkbox", id: `rar${i}` })),
      el("td", {}, el("label", { htmlFor: `rar${i}`, className: `r${i}`, textContent: name })),
      el("td", { className: "num", textContent: lo === hi ? `${lo} 個` : `${lo}～${hi} 個` }),
      el("td", { className: "num", textContent: pct(up[0]) }),
      el("td", { className: "num", textContent: pct(up[1]) }),
      el("td", { className: "num", textContent: `${D.sealPercentByRarity[i] || 0}%` }),
      el("td", { className: "num", id: `rar-n${i}` }));
  }));
  // 部位
  $("parts").replaceChildren(...PARTS.map(([k, name]) => el("label", { className: "chip" }, el("input", { type: "checkbox", id: `part-${k}` }), name, el("span", { className: "n", id: `part-n-${k}` }))));
  // 三種等級檔次
  const scrap = new Set(D.scrap || []);
  $("tiers").replaceChildren(...D.pools.map((pool, i) => el("tr", {},
    el("td", { textContent: `第 ${i + 1} 檔` }),
    el("td", { className: "tier", textContent: tierRange(i) }),
    el("td", {}, ...pool.map((no) => el("span", { className: "mat" }, D.itemNames[no] || `#${no}`, scrap.has(no) ? el("span", { className: "scrap", textContent: "（常見）" }) : ""))))));
  $("tier-hint").textContent = `遊戲把素材分成三檔（${D.tierLevels.map((l) => `Lv ${l}`).join("／")} 起）。等級是伺服器算的，網頁端看不到算法；這裡照「生活技能能製作這件的等級」推估（不能製作的才用掉落怪物等級，標「掉落」）。「跳一檔／跳兩檔」＝拿到更高檔次素材的機率。`;
  const sealName = D.seals ? `${D.itemNames[D.seals.weapon] || "印記"}` : "印記";
  $("seal-hint").innerHTML = "";
  $("seal-hint").append(el("span", { className: "seal", textContent: `另外有機會出 ${sealName}` }),
    `（強化用；武器拆出武器用的、其他部位拆出防具用的）：Lv ${D.sealMinLevel} 以上才有，機率看上面稀有度那欄，最多 ${D.sealPercentMax}%。`);
}

function applyCfg(c) {
  $("on").checked = !!c.enabled;
  $("free").value = c.freeSlots ?? 10;
  RARITY.forEach((_, i) => { const x = $(`rar${i}`); if (x) x.checked = !!(c.rarities || [])[i]; });
  PARTS.forEach(([k]) => { const x = $(`part-${k}`); if (x) x.checked = (c.parts || {})[k] !== false; });
}

function renderBag() {
  const c = current();
  const ok = bag.items.filter((x) => x.ok);
  RARITY.forEach((_, i) => { const n = ok.filter((x) => x.rarity === i && c.parts[x.part]).length; const t = $(`rar-n${i}`); if (t) t.textContent = n ? `${n} 件` : "—"; });
  PARTS.forEach(([k]) => { const n = ok.filter((x) => x.part === k && c.rarities[x.rarity]).length; const t = $(`part-n-${k}`); if (t) t.textContent = n ? `${n}` : ""; });
  const match = ok.filter((x) => c.rarities[x.rarity] && c.parts[x.part]);
  // 同一件同稀有度合併成一列
  const groups = new Map();
  for (const x of match) { const k = `${x.no}:${x.rarity}`; const g = groups.get(k) || { ...x, n: 0 }; g.n++; groups.set(k, g); }
  const rows = [...groups.values()].sort((a, b) => b.rarity - a.rarity || (itemLevel(b.no) ?? -1) - (itemLevel(a.no) ?? -1) || a.name.localeCompare(b.name));
  $("match-n").textContent = `（${match.length} 件，背包剩 ${bag.free} 格）`;
  $("match").replaceChildren(...(rows.length ? rows.map((x) => {
    const li = levelInfo(x.no), lv = li ? li.lv : null, t = tierOf(lv);
    return el("tr", {},
      el("td", {}, el("span", { className: `r${x.rarity}`, textContent: `${RARITY[x.rarity]} ${x.name}` }), x.n > 1 ? ` ×${x.n}` : ""),
      el("td", { textContent: PART_NAME[x.part] }),
      el("td", { className: "num", textContent: lv === null ? "—" : `Lv ${lv}` }, li && li.from === "掉落" ? el("span", { className: "scrap", textContent: "（掉落）" }) : ""),
      el("td", { className: "tier", textContent: t < 0 ? "（不能製作、也沒有掉落資料）" : `第 ${t + 1} 檔` }));
  }) : [el("tr", {}, el("td", { colSpan: 4, className: "muted", textContent: bag.ok ? "背包裡沒有符合的裝備" : "還沒連上遊戲，讀不到背包" }))]));
  // 不能拆的（桌寵不碰、遊戲不讓）
  const skip = bag.items.filter((x) => !x.ok && c.rarities[x.rarity] && c.parts[x.part]);
  $("skip-box").hidden = !skip.length;
  $("skip-sum").textContent = `勾選範圍內有 ${skip.length} 件不會分解（點開看原因）`;
  $("skip").replaceChildren(...skip.map((x) => el("tr", {}, el("td", {}, el("span", { className: `r${x.rarity}`, textContent: `${RARITY[x.rarity]} ${x.name}` })), el("td", { className: "why", textContent: x.why }))));
}

function renderInfo(s) {
  if (!s) return;
  bag = s.bag || bag;
  $("status").textContent = s.name ? `角色：${s.name}` : s.status === "ingame" ? "" : "桌寵還沒連上遊戲：設定可以先存，背包要連上後才看得到";
  $("log").textContent = (s.log || []).length ? s.log.join("\n") : "還沒有紀錄";
  $("log").className = (s.log || []).length ? "" : "muted";
  renderBag();
}

renderStatic();
document.addEventListener("change", (ev) => { if (ev.target.matches("input")) renderBag(); });
$("save").addEventListener("click", async () => {
  const s = await api.set(current());
  if (s && !s.error) { cfg = s.cfg; renderInfo(s); $("msg").textContent = "已儲存"; setTimeout(() => ($("msg").textContent = ""), 2000); }
  else $("msg").textContent = `沒存成：${s?.error || "沒有回應"}`;
});
$("run").addEventListener("click", async () => {
  const c = current();
  const n = bag.items.filter((x) => x.ok && c.rarities[x.rarity] && c.parts[x.part]).length;
  if (!n) { $("msg").textContent = "沒有符合的裝備"; return; }
  const rare = bag.items.filter((x) => x.ok && x.rarity > 0 && c.rarities[x.rarity] && c.parts[x.part]).length;
  if (!confirm(`確定分解 ${n} 件裝備？${rare ? `\n（含 ${rare} 件稀有以上）` : ""}\n分解後裝備會消失，拿到素材。`)) return;
  $("run").disabled = true; $("msg").textContent = "分解中…";
  const r = await api.run(c);
  $("run").disabled = false;
  $("msg").textContent = r?.error ? `沒有分解：${r.error}` : `分解了 ${r?.count || 0} 件`;
  if (r?.info) renderInfo(r.info);
});
(async () => {
  const s = await api.get();
  if (s) { cfg = s.cfg; applyCfg(cfg); renderInfo(s); }
  setInterval(async () => renderInfo(await api.get()), 5000);
})();
