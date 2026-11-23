// 生活技能的計算（生活技能視窗、遊戲網頁的 lifeRun 共用）。資料來自 codex-data.js（遊戲的配方表、技能表）。
// 跟遊戲一樣的規則（2026-11-22 讀遊戲程式）：
//   技能等級＝trunc(life[group] / 10000)，0～100
//   配方能做：needKnow 為 0，或技能等級 ≥ 配方最低等級（遊戲 zl）
//   成功率：等級在 min～max 之間線性從 k2 到 k1+k2（遊戲 Il）
//   工具：技能 tool 0＝不用、-1＝看配方 toolKind、其他＝固定那種（遊戲 Rl），身上或背包要有這種 itemKind 的道具
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R = (r) => ({ no: r[0], itemNo: r[1], amount: r[2], skill: r[3], min: r[4], max: r[5], k1: r[6], k2: r[7], toolKind: r[8], needKnow: r[9], mats: r[10].map(([itemNo, amount]) => ({ itemNo, amount })) });

  function make(codex) {
    const recipes = codex.recipes.map(R);
    const byNo = new Map(recipes.map((r) => [r.no, r]));
    const skillOf = (skill) => codex.craftSkills.find((s) => s.skill === skill);
    const level = (life, skill) => { const s = skillOf(skill); return s ? clamp(Math.trunc(((life || [])[s.group] || 0) / 10000), 0, 100) : 0; };
    const unlocked = (r, life) => r.needKnow === 0 || level(life, r.skill) >= r.min;
    function rate(r, life) {
      const n = clamp(r.min, 0, 100);
      let span = clamp(r.max, 0, 100) - n;
      if (span < 0) return 0;
      if (span === 0) span = 1;
      const i = Math.min(1, (level(life, r.skill) - n) / span);
      return clamp(Math.floor(i * r.k1 + r.k2), 0, 100);
    }
    const toolKind = (r) => { const t = skillOf(r.skill)?.tool ?? 0; return t === 0 ? 0 : t === -1 ? r.toolKind : t; };
    const forSkill = (skill) => recipes.filter((r) => r.skill === skill);
    const producers = (itemNo) => recipes.filter((r) => r.itemNo === itemNo);
    /** 這個技能現在能做的配方，最高等級的排前面（「只做目前最高等級能做的物品」）。 */
    const bestOrder = (skill, life) => forSkill(skill).filter((r) => unlocked(r, life)).sort((a, b) => b.min - a.min || b.no - a.no);

    /**
     * 要做 count 次 recipe 的計畫。
     * have：{道具號: 數量}（背包）；opts：{ chain 用原料先做中間材料, buy 買不夠的, canBuy(itemNo), life, hasTool(kind), canBuyTool(kind) }
     * 回傳 { ok, steps:[{recipe, count}]（先做的在前，最後一步是 recipe 本身）, buys:{道具號: 數量}, tools:[要買的工具種類], missing:[{itemNo, amount}] }
     */
    function plan(recipe, count, have, opts) {
      const inv = { ...have };
      const steps = [], buys = {}, missing = [], tools = new Set();
      const toolOk = (r) => {
        const k = toolKind(r);
        if (!k || (opts.hasTool && opts.hasTool(k)) || tools.has(k)) return true;
        if (opts.buy && opts.canBuyTool && opts.canBuyTool(k)) { tools.add(k); return true; }
        return false;
      };
      // 用掉 qty 個 itemNo；不夠的先試著用原料做（chain），再試著買（buy）
      function need(itemNo, qty, depth, stack) {
        const use = Math.min(inv[itemNo] || 0, qty);
        inv[itemNo] = (inv[itemNo] || 0) - use;
        let rest = qty - use;
        if (!rest) return true;
        if (opts.chain && depth < 5) {
          for (const p of producers(itemNo)) {
            if (stack.has(p.no) || !unlocked(p, opts.life) || !toolOk(p)) continue;
            const times = Math.ceil(rest / p.amount);
            // 試算：材料夠不夠（不夠就換下一個配方或改用買的）
            const saved = { inv: { ...inv }, steps: steps.length, buys: { ...buys }, missing: missing.length };
            const next = new Set(stack).add(p.no);
            if (p.mats.every((m) => need(m.itemNo, m.amount * times, depth + 1, next))) {
              steps.push({ recipe: p, count: times });
              inv[itemNo] = (inv[itemNo] || 0) + times * p.amount - rest;
              return true;
            }
            Object.assign(inv, saved.inv); for (const k of Object.keys(inv)) if (!(k in saved.inv)) delete inv[k];
            steps.length = saved.steps; missing.length = saved.missing;
            for (const k of Object.keys(buys)) delete buys[k]; Object.assign(buys, saved.buys);
          }
        }
        if (opts.buy && opts.canBuy && opts.canBuy(itemNo)) { buys[itemNo] = (buys[itemNo] || 0) + rest; return true; }
        missing.push({ itemNo, amount: rest });
        return false;
      }
      if (!toolOk(recipe)) return { ok: false, steps: [], buys: {}, tools: [], missing: [], noTool: toolKind(recipe) };
      const ok = recipe.mats.every((m) => need(m.itemNo, m.amount * count, 0, new Set([recipe.no])));
      if (ok) steps.push({ recipe, count });
      return { ok, steps, buys, tools: [...tools], missing };
    }
    /** 最多能做幾次（1～max，照 plan 的規則）。 */
    function maxCount(recipe, have, opts, max) {
      let lo = 0, hi = max;
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (plan(recipe, mid, have, opts).ok) lo = mid; else hi = mid - 1; }
      return lo;
    }
    return { recipes, byNo, skillOf, level, unlocked, rate, toolKind, forSkill, producers, bestOrder, plan, maxCount };
  }

  const api = { make };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RajaLifePlan = api;
})(globalThis);
