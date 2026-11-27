// 主程序與遊戲 hook 共用的藥水選項、數量與購買計畫。
(function (root) {
  "use strict";
  const types = {
    hp: [[4001, "初級治療藥水"], [4007, "中級治療藥水"], [4009, "高級治療藥水"], [4011, "半數治療藥水"], [4003, "完全治療藥水"]],
    mp: [[4002, "初級魔力藥水"], [4008, "中級魔力藥水"], [4010, "高級魔力藥水"], [4012, "半數魔力藥水"], [4004, "魔力全滿藥水"]],
  };
  const selection = (kind, value) => types[kind]?.some(([id]) => id === Number(value)) ? Number(value) : 0;
  const name = (kind, value) => types[kind]?.find(([id]) => id === Number(value))?.[1] || (kind === "hp" ? "紅水（自動選擇）" : "藍水（自動選擇）");
  function count(inv, itemNo) {
    return (inv?.bag || []).reduce((n, slot) => n + (Array.isArray(slot) && slot[0] === itemNo ? (slot.length === 2 ? Math.max(0, Number(slot[1]) || 0) : 1) : 0), 0);
  }
  function plan(g, inv, itemNo, to, gold, shops) {
    const missing = Math.max(0, to - count(inv, itemNo));
    if (!missing) return { status: "enough" };
    if (!["shopList", "shopItems", "unitOf", "buyLimit"].every(k => g[k] !== undefined)) return { status: "unavailable" };
    const unit = g.unitOf(itemNo);
    const offers = [...shops].filter(shop => Array.isArray(g.shopList) && shop >= 0 && shop < g.shopList.length && g.shopItems(shop).includes(itemNo));
    if (!offers.length || !unit || !(unit.price > 0) || !(unit.count > 0)) return { status: "not-sold" };
    const units = Math.min(Math.ceil(missing / unit.count), Math.floor(Math.max(0, gold) / unit.price), g.buyLimit(itemNo));
    if (!(units > 0)) return { status: "no-gold" };
    return { status: "buy", shop: offers[0], itemNo, units, cost: units * unit.price };
  }
  const api = { types, selection, name, count, plan };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RajaPotionSupply = api;
})(globalThis);
