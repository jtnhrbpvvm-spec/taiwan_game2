// 自動販售規則的整理（companion.js 每隻桌寵的規則、main.js「全部桌寵」的規則共用）。
// 一條規則：{kind:"item", no, name} 這種道具；{kind:"cat", cat, sub, label} 商店分類的一整類（sub 空白＝整個大類）。
"use strict";
const codex = require("./codex-data");
const SELL_CATS = ["weapon", "armor", "potion", "material", "tool", "other"];

function cleanRule(r) {
  if (r?.kind === "item" && Number.isInteger(r.no) && r.no > 0 && r.no < 100000) return { kind: "item", no: r.no, name: String(r.name || codex.itemNames?.[r.no] || r.no).slice(0, 40) };
  if (r?.kind === "cat" && SELL_CATS.includes(r.cat)) return { kind: "cat", cat: r.cat, sub: typeof r.sub === "string" ? r.sub.slice(0, 30) : "", label: String(r.label || r.cat).slice(0, 60) };
  return null;
}
const ruleKey = (r) => (r.kind === "item" ? `i${r.no}` : `c${r.cat}/${r.sub}`);
function cleanRules(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).map(cleanRule).filter((r) => r && !seen.has(ruleKey(r)) && seen.add(ruleKey(r))).slice(0, 200);
}
const num = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v)) || 0));
/** 每隻桌寵自己的販售設定。 */
function cleanSell(s) {
  return { enabled: !!s?.enabled, rules: cleanRules(s?.rules), useGlobal: s?.useGlobal !== false, freeSlots: num(s?.freeSlots ?? 10, 0, 90), sellPrecious: !!s?.sellPrecious };
}
/** 全部桌寵共用的販售設定。 */
function cleanGlobal(g) {
  return { enabled: !!g?.enabled, rules: cleanRules(g?.rules) };
}

module.exports = { SELL_CATS, cleanRule, cleanRules, ruleKey, cleanSell, cleanGlobal };
