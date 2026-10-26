// 收入總覽的「目前地圖」區塊（電腦版 ui/income.js、安卓版設定畫面共用）。tools/gen-zones.js 會把這段接在 zones.js 的資料後面。
// 資料是 window.ZONE_GUIDE（從黑暗大陸攻略的 wiki-data.js 整理出來的）；物品／怪物／技能說明視窗用 window.GUIDE_WIKI（攻略 wiki.js 抄過來的，跟攻略網一樣）。
(() => {
  const G = window.ZONE_GUIDE;
  const GW = window.GUIDE_WIKI;
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const pct = (p) => (p >= 0.1 ? `${Math.round(p * 100)}%` : p >= 0.01 ? `${(p * 100).toFixed(1)}%` : `${(p * 100).toFixed(2)}%`);
  const num = (n) => Math.round(n).toLocaleString("zh-TW");
  const range = (n) => (Array.isArray(n) ? (n[0] === n[1] ? `×${n[0]}` : `×${n[0]}～${n[1]}`) : "");
  const itemName = (id) => G.items[id] || id;
  // 點了會跳出說明視窗的物品／怪物名稱
  const itemA = (id) => (GW && GW.W.items[id] ? GW.itemLink(id) : esc(itemName(id)));
  const monA = (id, m) => (GW && GW.W.monsters[id] ? `<a class="il" data-mon="${esc(id)}">${esc(m.icon || "")} ${esc(m.name)}</a>` : `${esc(m.icon || "")} ${esc(m.name)}`);

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
   * 這張地圖可掉的魔法書／技能書（遊戲 spellbook.js rollBookDrop）：一般怪／首領機率不同，
   * 掉了就從「最低學習等級 ≤ 怪物等級 +5」的書平均抽一本。mons＝[{ name, lv, boss }]
   */
  function booksHtml(mons) {
    if (!GW || !GW.W.bookDrops || !mons.length) return "";
    const C = GW.W.consts;
    const top = Math.max(...mons.map((m) => m.lv));
    const pool = GW.bookPool(top);
    const per = mons
      .map((m) => ({ m, n: GW.bookPool(m.lv).length }))
      .filter((x) => x.n)
      .map(({ m, n }) => `<tr${m.boss ? ' class="rare"' : ""}><td>${esc(m.name)}</td><td>Lv.${m.lv}</td><td>${pct(GW.bookDropP(m))}</td><td>${n} 本</td><td>${GW.pct(GW.bookDropP(m) / n)}</td></tr>`)
      .join("");
    const head = `<p class="zg-sub">這張地圖可掉的魔法書／技能書（${pool.length} 本）</p>`;
    if (!pool.length) return `${head}<p class="dim">怪物等級太低，這張地圖不會掉書。</p>`;
    return `${head}
      <p class="dim">一般怪每隻 ${pct(C.BOOK_DROP_P)}、首領每隻 ${pct(C.BOOK_BOSS_P)} 掉一本，從「學習等級 ≤ 怪物等級 +5」的書裡平均抽；任何職業的書都會掉。</p>
      <table class="zg-t"><tr><th>怪物</th><th>等級</th><th>掉書</th><th>可掉</th><th>指定一本</th></tr>${per}</table>
      <details class="zg-books"><summary>看書單（Lv.${top} 可以拿到的 ${pool.length} 本，點書名看說明）</summary>${GW.bookGroupsHtml(pool)}</details>`;
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
    const bookMons = []; // 掉書用：{ name, lv, boss }
    if (zone.type === "tower" && loc.floor) {
      // 永夜之塔：怪物等級看樓層，用攻略表裡最接近、不超過這一層的那一列
      const f = (G.tower || []).filter((r) => r.floor <= loc.floor).pop() || (G.tower || [])[0];
      head = `<b>${esc(zone.icon || "")} ${esc(zone.name)} ${loc.floor}F</b>`;
      if (f) {
        rows += `<tr><td>塔怪（攻略表 ${f.floor}F）</td><td>Lv.${f.lv}</td><td>${num(f.hp)}</td><td>${num(f.exp)}</td></tr>`;
        extraLvs.push(f.lv);
        bookMons.push({ name: `塔怪（${f.floor}F）`, lv: f.lv });
      }
    }
    for (const id of monIds) {
      const m = G.monsters[id];
      if (m) rows += `<tr><td>${monA(id, m)}</td><td>Lv.${m.lv}</td><td>${num(m.hp)}</td><td>${num(m.exp)}</td></tr>`;
    }
    const rare = zone.rare && G.monsters[zone.rare.id];
    if (rare) {
      rows += `<tr class="rare"><td>★ ${monA(zone.rare.id, rare)}<small>稀有 ${pct(zone.rare.p)}</small></td><td>Lv.${rare.lv}</td><td>${num(rare.hp)}</td><td>${num(rare.exp)}</td></tr>`;
      monIds.push(zone.rare.id);
    }
    const boss = zone.boss && G.monsters[zone.boss];
    if (boss) {
      rows += `<tr class="rare"><td>👑 ${monA(zone.boss, boss)}</td><td>Lv.${boss.lv}</td><td>${num(boss.hp)}</td><td>${num(boss.exp)}</td></tr>`;
      monIds.push(zone.boss);
    }
    for (const id of monIds) if (G.monsters[id]) bookMons.push({ name: G.monsters[id].name, lv: G.monsters[id].lv, boss: !!G.monsters[id].boss });
    const items = obtainable(zone, monIds, extraLvs);
    const itemRows = items.map(([id, x]) => `<tr><td>${itemA(id)}${x.n ? `<small>${range(x.n)}</small>` : ""}</td><td>${pct(x.p)}</td><td class="from">${esc(x.from.join("、"))}</td></tr>`).join("");
    return `<div class="zg">
      <p class="zg-head">${head}　<a href="${esc(url)}" data-guide="${esc(url)}">看攻略 ›</a></p>
      ${zone.desc ? `<p class="dim">${esc(zone.desc)}</p>` : ""}
      <table class="zg-t"><tr><th>怪物分布</th><th>等級</th><th>HP</th><th>經驗</th></tr>${rows}</table>
      <details class="zg-items"><summary class="zg-sub">這張地圖可獲得的物品（${items.length} 種）</summary>
        <table class="zg-t"><tr><th>物品</th><th>機率</th><th>來源</th></tr>${itemRows}</table></details>
      ${booksHtml(bookMons)}
      <p class="dim">機率是每隻怪的掉落率（攻略資料，遊戲版本 ${esc(G.version)}）。點物品、怪物、書名可以看說明。另外每隻怪都有機會掉製作通貨、異界地圖和隨機品質裝備，詳見攻略。</p>
    </div>`;
  }

  // ── 說明視窗（跟攻略網一樣的內容；樣式自己帶，電腦版、安卓版都能用）──
  const CSS = `
.zg .il, .gw-modal .il { cursor: pointer; display: inline-flex; align-items: center; gap: 5px; vertical-align: middle; color: #ffd98a; text-decoration: none; }
.zg .il:hover, .gw-modal .il:hover { text-decoration: underline; }
.zg .ic, .gw-modal .ic { width: 20px; height: 20px; border-radius: 5px; object-fit: contain; background: #0a0807; border: 1px solid #3a2f24; vertical-align: middle; flex: none; }
.zg .ic.emo, .gw-modal .ic.emo { display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
.zg details.zg-books { margin: 6px 0; font-size: 13px; }
.zg details.zg-items > summary.zg-sub { display: list-item; cursor: pointer; margin: 10px 0 4px; }
.zg details summary, .gw-modal details summary { cursor: pointer; color: #d9a54a; margin: 4px 0; }
.zg .bookg, .gw-modal .bookg { margin: 3px 0; line-height: 1.9; text-align: left; }
.zg .bookg .il, .gw-modal .bookg .il { margin-right: 10px; white-space: nowrap; }
.gw-modal { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.7); display: none; align-items: flex-start; justify-content: center; padding: 4vh 10px; overflow: auto; }
.gw-modal.on { display: flex; }
.gw-modal .gw-in { background: #1c1713; color: #e8dfd2; border: 1px solid #5a4630; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.45); max-width: 600px; width: 100%; padding: 16px 18px; position: relative; font-size: 14px; line-height: 1.7; text-align: left; }
.gw-modal .gw-x { position: absolute; top: 6px; right: 8px; background: none; border: 0; color: #a89a88; font-size: 22px; cursor: pointer; }
.gw-modal .gw-x:hover { color: #ffd98a; }
.gw-modal a { color: #ffd98a; text-decoration: none; cursor: pointer; }
.gw-modal small, .gw-modal .dim { color: #a89a88; }
.gw-modal p { margin: .5em 0; }
.gw-modal ul { margin: 4px 0; padding-left: 1.3em; }
.gw-modal .mhead { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.gw-modal .mhead h3 { margin: 0; font-size: 18px; color: #e0b25a; }
.gw-modal .ic.lg { width: 56px; height: 56px; border-radius: 10px; }
.gw-modal .ic.lg.emo { font-size: 32px; }
.gw-modal .msec { margin-top: 10px; }
.gw-modal .msec h4 { margin: 0 0 4px; color: #e0b25a; font-size: 14px; }
.gw-modal .box { background: #241d17; border: 1px solid #3a2f24; border-left: 3px solid #e0b25a; border-radius: 8px; padding: 8px 12px; }
.gw-modal .stats { display: flex; flex-wrap: wrap; gap: 4px 6px; }
.gw-modal .stats span { background: #241d17; border: 1px solid #3a2f24; border-radius: 6px; padding: 0 8px; font-size: 13px; white-space: nowrap; }
.gw-modal .stats span b { color: #ffd98a; font-weight: 600; }
.gw-modal .tag { display: inline-block; font-size: 12px; padding: 0 7px; border-radius: 10px; border: 1px solid #5a4630; color: #a89a88; margin: 1px 2px 1px 0; white-space: nowrap; line-height: 1.6; }
.gw-modal .tag.red { color: #ff8a8a; border-color: #6a2a2a; } .gw-modal .tag.gold { color: #ffd98a; border-color: #6a5326; }
.gw-modal .tag.blue { color: #6aa8ff; border-color: #2a456a; } .gw-modal .tag.green { color: #6fcf7f; border-color: #2a5a32; }
.gw-modal .tag.purple { color: #c08bff; border-color: #4e2f6e; } .gw-modal .tag.cyan { color: #4fd6c8; border-color: #24575a; }
.zg .g-normal, .gw-modal .g-normal { color: #e8e8e8; } .zg .g-high, .gw-modal .g-high { color: #6fdc6f; } .zg .g-rare, .gw-modal .g-rare { color: #5aa0ff; }
.zg .g-hero, .gw-modal .g-hero { color: #c87bff; } .zg .g-legend, .gw-modal .g-legend { color: #ff9a3c; }
.gw-modal .res-1 { color: #5aa0ff; } .gw-modal .res-2 { color: #c87bff; } .gw-modal .res-3 { color: #ff9a3c; } .gw-modal .res-4 { color: #ff5a5a; }
.zg .doll-T1, .gw-modal .doll-T1 { color: #ff6a6a; } .zg .doll-T2, .gw-modal .doll-T2 { color: #ffd84a; } .zg .doll-T3, .gw-modal .doll-T3 { color: #c08bff; } .zg .doll-T4, .gw-modal .doll-T4 { color: #6aa8ff; }
`;
  let modal = null;
  function openModal(html) {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "gw-modal";
      modal.innerHTML = '<div class="gw-in" role="dialog" aria-modal="true"><button class="gw-x" type="button" aria-label="關閉">✕</button><div class="gw-body"></div></div>';
      document.body.appendChild(modal);
    }
    modal.querySelector(".gw-body").innerHTML = html;
    modal.classList.add("on");
    modal.scrollTop = 0;
  }
  const closeModal = () => modal && modal.classList.remove("on");
  // 攻略網頁連結（說明視窗裡的「在道具圖鑑查看」等）：交給呼叫的那邊開（電腦版用瀏覽器開），沒接就開新視窗
  const openUrl = (url) => (window.zoneGuideOpenUrl ? window.zoneGuideOpenUrl(url) : window.open(url, "_blank"));
  if (GW && typeof document !== "undefined") {
    // 樣式一載入就放上去（目前地圖區塊的物品連結也要用）
    const st = document.createElement("style");
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
    document.addEventListener("click", (e) => {
      if (modal && (e.target === modal || e.target.classList.contains("gw-x"))) return closeModal();
      const a = e.target.closest("[data-item],[data-mon],[data-skill]");
      if (a) {
        e.preventDefault();
        if (a.dataset.item) openModal(GW.itemDetailHtml(a.dataset.item));
        else if (a.dataset.mon) openModal(GW.monDetailHtml(a.dataset.mon));
        else openModal(GW.skillDetailHtml(a.dataset.skill));
        return;
      }
      const link = modal && e.target.closest(".gw-modal a[href]");
      if (link) {
        e.preventDefault();
        const href = link.getAttribute("href");
        openUrl(/^https?:/.test(href) ? href : G.guideUrl + href);
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  window.zoneGuideHtml = zoneGuideHtml;
})();
