// 收入總覽的「目前地圖」區塊（電腦版 ui/income.js、安卓版設定畫面共用）。tools/gen-zones.js 會把這段接在 zones.js 的資料後面。
// 資料是 window.ZONE_GUIDE（從黑暗大陸攻略的 wiki-data.js 整理出來的）。
(() => {
  const G = window.ZONE_GUIDE;
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const pct = (p) => (p >= 0.1 ? `${Math.round(p * 100)}%` : p >= 0.01 ? `${(p * 100).toFixed(1)}%` : `${(p * 100).toFixed(2)}%`);
  const num = (n) => Math.round(n).toLocaleString("zh-TW");
  const range = (n) => (Array.isArray(n) ? (n[0] === n[1] ? `×${n[0]}` : `×${n[0]}～${n[1]}`) : "");
  const itemName = (id) => G.items[id] || id;

  /** 這張地圖每一種可獲得物品：最好的機率、從哪裡來。 */
  function obtainable(zone, monIds, extraLvs = []) {
    const best = new Map(); // 物品 id → { p, n, from: [] }
    const add = (id, p, n, from) => {
      const x = best.get(id) || { p: 0, n: null, from: [] };
      if (p > x.p) {
        x.p = p;
        x.n = n || null;
      }
      if (!x.from.includes(from)) x.from.push(from);
      best.set(id, x);
    };
    for (const d of zone.drops || []) add(d.id, d.p, d.n, "這張地圖");
    for (const mid of monIds) for (const d of G.monsters[mid]?.drops || []) add(d.id, d.p, d.n, G.monsters[mid].name);
    // 共通掉落：任何怪都會掉，有等級限制的看這張地圖的怪物等級
    const lvs = [...monIds.map((id) => G.monsters[id]?.lv), ...extraLvs].filter((v) => v != null);
    for (const d of G.common) if (lvs.some((lv) => (!d.minLv || lv >= d.minLv) && (!d.maxLv || lv <= d.maxLv))) add(d.id, d.p, d.n, "共通掉落");
    return [...best.entries()].sort((a, b) => b[1].p - a[1].p);
  }

  /**
   * 目前地圖區塊的 HTML。loc＝存檔的 player.loc（{ type, id, floor }）。
   * guide(id)：點「攻略」連結時要做的事由呼叫的那邊接（data-guide＝攻略頁網址）。
   */
  function zoneGuideHtml(loc) {
    if (!G) return "";
    if (!loc || loc.type === "town") return `<p class="dim">角色在村莊裡。出發到狩獵地圖後，這裡會顯示那張地圖的怪物和可獲得物品。</p>`;
    const zone = G.zones[loc.id];
    if (!zone) return `<p class="dim">攻略資料裡沒有這張地圖（地圖 #${esc(loc.id)}），可能是遊戲新加的，等攻略更新。</p>`;
    const url = `${G.guideUrl}zones.html#${encodeURIComponent(loc.id)}`;
    let head = `<b>${esc(zone.icon || "")} ${esc(zone.name)}</b>　<span class="tagz">Lv.${zone.lv[0]}～${zone.lv[1]}</span>`;
    let rows = "";
    let monIds = [...(zone.mons || [])];
    const extraLvs = [];
    if (zone.type === "tower" && loc.floor) {
      // 永夜之塔：怪物等級看樓層，用攻略表裡最接近、不超過這一層的那一列
      const f = (G.tower || []).filter((r) => r.floor <= loc.floor).pop() || (G.tower || [])[0];
      head = `<b>${esc(zone.icon || "")} ${esc(zone.name)} ${loc.floor}F</b>`;
      if (f) {
        rows += `<tr><td>塔怪（攻略表 ${f.floor}F）</td><td>Lv.${f.lv}</td><td>${num(f.hp)}</td><td>${num(f.exp)}</td></tr>`;
        extraLvs.push(f.lv);
      }
    }
    for (const id of monIds) {
      const m = G.monsters[id];
      if (m) rows += `<tr><td>${esc(m.icon || "")} ${esc(m.name)}</td><td>Lv.${m.lv}</td><td>${num(m.hp)}</td><td>${num(m.exp)}</td></tr>`;
    }
    const rare = zone.rare && G.monsters[zone.rare.id];
    if (rare) {
      rows += `<tr class="rare"><td>★ ${esc(rare.icon || "")} ${esc(rare.name)}<small>稀有 ${pct(zone.rare.p)}</small></td><td>Lv.${rare.lv}</td><td>${num(rare.hp)}</td><td>${num(rare.exp)}</td></tr>`;
      monIds.push(zone.rare.id);
    }
    const boss = zone.boss && G.monsters[zone.boss];
    if (boss) {
      rows += `<tr class="rare"><td>👑 ${esc(boss.icon || "")} ${esc(boss.name)}</td><td>Lv.${boss.lv}</td><td>${num(boss.hp)}</td><td>${num(boss.exp)}</td></tr>`;
      monIds.push(zone.boss);
    }
    const items = obtainable(zone, monIds, extraLvs);
    const itemRows = items.map(([id, x]) => `<tr><td>${esc(itemName(id))}${x.n ? `<small>${range(x.n)}</small>` : ""}</td><td>${pct(x.p)}</td><td class="from">${esc(x.from.join("、"))}</td></tr>`).join("");
    return `<div class="zg">
      <p class="zg-head">${head}　<a href="${esc(url)}" data-guide="${esc(url)}">看攻略 ›</a></p>
      ${zone.desc ? `<p class="dim">${esc(zone.desc)}</p>` : ""}
      <table class="zg-t"><tr><th>怪物分布</th><th>等級</th><th>HP</th><th>經驗</th></tr>${rows}</table>
      <p class="zg-sub">這張地圖可獲得的物品（${items.length} 種）</p>
      <table class="zg-t"><tr><th>物品</th><th>機率</th><th>來源</th></tr>${itemRows}</table>
      <p class="dim">機率是每隻怪的掉落率（攻略資料，遊戲版本 ${esc(G.version)}）。另外每隻怪都有機會掉魔法書、製作通貨、異界地圖和隨機品質裝備，詳見攻略。</p>
    </div>`;
  }

  window.zoneGuideHtml = zoneGuideHtml;
})();
