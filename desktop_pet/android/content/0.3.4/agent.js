// 桌寵放在遊戲頁面裡的「探子」：GameService 每隔幾秒呼叫一次 __petAgent.tick()，
// 它把遊戲現在的狀態、這段時間發生的事（給桌寵飄字用）、每小時收益整理好，用 JSON 字串交回去。
//
// 邏輯跟電腦版 main.js（READ_STATE、diffEvents、書籤工具）＋ income.js 是同一套，只是整個搬進遊戲頁面裡跑：
// 這裡拿得到遊戲的 session 物件，物品、地圖、怪物的名稱直接問遊戲就有，不用另外下載資料檔。
//
// 遊戲重新載入後這份會不見、由 GameService 重新塞進來，所以收益紀錄只記「這次載入以來」的。
(() => {
  if (window.__petAgent) return;

  const SAVE_KEY = "idle-seal.save";
  const HOUR_MS = 36e5;
  const BOOKMARK_TOOL_URL = "https://jtnhrbpvvm-spec.github.io/taiwan_game2/%E5%B8%8C%E6%9C%9B/loader.js";
  const BOOKMARK_RETRY_MS = 60000;
  const MAX_LOOT_SHOWN = 4;
  const MAX_GAP_MS = 15000; // 兩次取樣隔超過這麼久就不算在「有在掛機的時間」裡
  const INCOME_KEYS = ["hunt", "sales", "potions", "pets", "misc"];
  const n = (v) => Number(v) || 0;

  // 遊戲的 session 沒有掛在 window 上，要從 Vue 的元件樹裡找（幾乎每個畫面元件都有 props.session），
  // 做法跟書籤工具 loader.js 的 findGameRefs 一樣
  function findSession() {
    let root = document.getElementById("app");
    if (!root || !root._vnode) root = [...document.querySelectorAll("*")].find((el) => el._vnode);
    let found;
    const walk = (vnode) => {
      if (!vnode || found) return;
      if (vnode.component) {
        const session = vnode.component.props && vnode.component.props.session;
        if (session && typeof session.enhance === "function") found = session;
        else walk(vnode.component.subTree);
      } else if (Array.isArray(vnode.children)) vnode.children.forEach(walk);
    };
    walk(root && root._vnode && root._vnode.component && root._vnode.component.subTree);
    return found;
  }

  // 遊戲只記「總共賣了幾件」，沒記賣的是什麼。在它每 10 秒一次的自動販售（sellSweep）前面插一手，
  // 把它準備賣的清單（plannedSales）記下來
  function hookSales(session) {
    if (session.__petSold || typeof session.sellSweep !== "function" || typeof session.plannedSales !== "function") return;
    const sold = (session.__petSold = new Map());
    const sellSweep = session.sellSweep;
    session.sellSweep = function (...args) {
      try {
        for (const sale of this.plannedSales()) sold.set(sale.itemId, (sold.get(sale.itemId) || 0) + sale.count);
      } catch (e) {}
      return sellSweep.apply(this, args);
    };
  }

  // 查得到名稱的一般物品才算；箱子、石頭那一類不在物品資料裡，顯示出來只會是沒名字的一列
  function knownItem(session, itemId) {
    const item = session && session.data && session.data.itemById && session.data.itemById.get(Number(itemId));
    return item && item.name ? { name: item.name, sell: item.noSell ? 0 : n(item.sell) } : undefined;
  }

  // ── 每小時收益（電腦版 income.js）────────────────────────
  const income = { startedAt: Date.now(), hours: [], prev: undefined };

  function bucketFor(now) {
    const start = Math.floor(now / HOUR_MS) * HOUR_MS;
    let bucket = income.hours[income.hours.length - 1];
    if (!bucket || bucket.start !== start) {
      bucket = { start, hunt: 0, sales: 0, potions: 0, pets: 0, misc: 0, activeMs: 0, items: {} };
      income.hours.push(bucket);
    }
    return bucket;
  }

  function addItems(bucket, field, list, prevList) {
    const before = new Map(prevList || []);
    for (const [itemId, count] of list || []) {
      let gained = count - (before.get(itemId) || 0);
      if (gained < 0) gained = count; // 統計被清空重算了
      if (gained <= 0) continue;
      const item = bucket.items[itemId] || (bucket.items[itemId] = { got: 0, sold: 0 });
      item[field] += gained;
    }
  }

  function recordIncome(id, sample, now) {
    const prev = income.prev;
    if (prev && prev.id === id) {
      const bucket = bucketFor(now);
      addItems(bucket, "got", sample.drops, prev.drops);
      addItems(bucket, "sold", sample.sold, prev.sold);
      for (const key of INCOME_KEYS) {
        let gained = sample[key] - prev[key];
        if (gained < 0) gained = sample[key]; // 計數器歸零重算了（重新出發時掉落統計會清空）
        if (gained > 0) bucket[key] += gained;
      }
      if (now - prev.at <= MAX_GAP_MS) bucket.activeMs += now - prev.at;
    }
    income.prev = Object.assign({ id, at: now }, sample);
  }

  function describeItems(session, items) {
    return Object.keys(items)
      .map((itemId) => {
        const item = knownItem(session, itemId);
        return item ? Object.assign({}, item, items[itemId]) : undefined;
      })
      .filter(Boolean)
      .sort((a, b) => b.sell * b.got - a.sell * a.got || b.got - a.got);
  }

  /** 給收益畫面用的整理結果：每個小時一筆，加上合計跟平均每小時。 */
  function incomeSummary() {
    const session = findSession();
    const net = (h) => h.sales - h.potions - h.pets - h.misc;
    const total = { hunt: 0, sales: 0, potions: 0, pets: 0, misc: 0, activeMs: 0, items: {} };
    for (const h of income.hours) {
      for (const key of INCOME_KEYS.concat("activeMs")) total[key] += h[key];
      for (const itemId of Object.keys(h.items)) {
        const sum = total.items[itemId] || (total.items[itemId] = { got: 0, sold: 0 });
        sum.got += h.items[itemId].got;
        sum.sold += h.items[itemId].sold;
      }
    }
    const perHour = (value) => (total.activeMs > 0 ? Math.round((value / total.activeMs) * HOUR_MS) : 0);
    const average = { net: perHour(net(total)) };
    for (const key of INCOME_KEYS) average[key] = perHour(total[key]);
    return JSON.stringify({
      startedAt: income.startedAt,
      hours: income.hours.map((h) => Object.assign({}, h, { net: net(h), items: describeItems(session, h.items) })),
      total: Object.assign({}, total, { net: net(total), items: describeItems(session, total.items) }),
      average,
    });
  }

  // ── 狀態跟事件 ──────────────────────────────────────────
  let lastSave; // 上一次讀到的存檔摘要
  let lastDamage; // 上一次讀到的累計傷害 { id, total }

  function readSave() {
    try {
      const file = JSON.parse(localStorage.getItem(SAVE_KEY));
      const c = file.characters.find((x) => x.id === file.lastPlayedId);
      if (!c) return undefined;
      const bag = {};
      for (const s of c.stacks || []) bag[s.itemId] = (bag[s.itemId] || 0) + (s.count == null ? 1 : s.count);
      return c && { c, bag };
    } catch (e) {
      return undefined;
    }
  }

  /** 角色現在人在哪、在做什麼（判斷順序跟遊戲自己的標題列一樣：副本 → 釣魚 → 村莊 → 野外）。 */
  function describePlace(c, data) {
    const mapName = (id) => (data && data.mapById && data.mapById.get(id) && data.mapById.get(id).name) || "未知的地方";
    const run = c.dungeon && c.dungeon.run;
    if (run && run.dungeonId != null) {
      const d = data && data.dungeonById && data.dungeonById.get(run.dungeonId);
      return { place: (d && d.name) || "副本", doing: "副本中" };
    }
    if (c.fishing && c.fishing.mapId != null) return { place: mapName(c.fishing.mapId), doing: "釣魚中" };
    if (c.inVillage) {
      const town = data && Array.isArray(data.towns) && data.towns.find((t) => t.id === c.townId);
      return { place: (town && town.name) || "村莊", doing: "休息中" };
    }
    const target = data && data.monsterById && data.monsterById.get(c.spot && c.spot.targetId);
    return { place: mapName(c.spot && c.spot.mapId), doing: target && target.name ? "打 " + target.name : "掛機中" };
  }

  /** 比對前後兩次存檔，整理成桌寵要演出來的事件。遊戲大約 10 秒自動存一次，所以是一批一批來的。 */
  function diffEvents(prev, next, session) {
    const events = [];
    if (next.c.level > prev.c.level) events.push({ kind: "levelup", level: next.c.level });
    else if (next.c.exp > prev.c.exp) events.push({ kind: "exp", n: next.c.exp - prev.c.exp });
    if (next.c.gold > prev.c.gold) events.push({ kind: "gold", n: next.c.gold - prev.c.gold });
    let loot = 0;
    for (const itemId of Object.keys(next.bag)) {
      const gained = next.bag[itemId] - (prev.bag[itemId] || 0);
      if (gained <= 0 || loot >= MAX_LOOT_SHOWN) continue;
      const item = knownItem(session, itemId);
      if (!item) continue;
      events.push({ kind: "loot", n: gained, name: item.name });
      loot++;
    }
    return events;
  }

  // 書籤工具（loader.js）：跟玩家在瀏覽器點書籤一樣載進來。要等找得到 session 才載；
  // 遊戲重新載入或換角色後 session 是新的，要再載一次
  function loadBookmarkTool(session) {
    if (window.__petToolSession === session || Date.now() < (window.__petToolRetryAt || 0)) return;
    window.__petToolSession = session;
    import(BOOKMARK_TOOL_URL + "?v=" + Date.now()).catch((e) => {
      console.error("書籤工具載入失敗", e);
      window.__petToolSession = undefined;
      window.__petToolRetryAt = Date.now() + BOOKMARK_RETRY_MS;
    });
  }

  function tick(options) {
    const now = Date.now();
    const out = { now, hasSave: false, events: [] };
    const save = readSave();
    if (!save) {
      lastSave = undefined;
      return JSON.stringify(out);
    }
    const c = save.c;
    const session = findSession();
    const data = session && session.data;
    Object.assign(out, { hasSave: true, name: c.name, level: c.level, inVillage: !!c.inVillage, elapsedMs: c.elapsedMs,
      targetId: c.spot && c.spot.targetId, gmDuelWindow: c.gmDuelWindow == null ? null : c.gmDuelWindow }, describePlace(c, data));
    const target = data && data.monsterById && data.monsterById.get(c.spot && c.spot.targetId);
    if (target && target.model) out.model = target.model;
    // 黑店面板開著的時候畫面上的匯率（沒開就是 null），給黑店提醒對帳用
    const rate = document.querySelector(".mall > .rate");
    const shown = rate && rate.textContent.match(/\d[\d,]{4,}/);
    out.mallRate = shown ? Number(shown[0].replace(/,/g, "")) : null;

    // 換角色、匯入存檔之後第一筆只當基準，不然整個背包都會被當成「剛撿到」
    if (lastSave && lastSave.c.id === c.id && lastSave.c.savedAt !== c.savedAt) out.events = diffEvents(lastSave, save, session);
    lastSave = save;

    const p = session && session.player;
    if (p && typeof p.goldFromSales === "number") {
      hookSales(session);
      let hunt = 0;
      for (const [itemId, count] of session.drops || []) {
        const item = knownItem(session, itemId);
        if (item) hunt += item.sell * n(count);
      }
      recordIncome(c.id, {
        hunt, sales: n(p.goldFromSales), potions: n(p.goldSpentOnPotions) + n(p.goldSpentOnApPotions),
        pets: n(p.goldSpentOnPets) + n(p.goldSpentOnBpetPotions), misc: n(p.goldSpentOnThrowables) + n(p.goldSpentOnHolyWater),
        drops: [...(session.drops || [])], sold: [...(session.__petSold || [])],
      }, now);
      // 傷害是遊戲裡即時累計的，每次都比得出差額，不用等 10 秒一次的存檔。變小＝重新出發、統計歸零了，那次不算
      const total = [...(session.damageBy || [])].reduce((sum, entry) => sum + n(entry[1]), 0);
      const dealt = lastDamage && lastDamage.id === c.id ? total - lastDamage.total : 0;
      lastDamage = { id: c.id, total };
      if (dealt > 0) out.events.unshift({ kind: "damage", n: dealt });
      if (options && options.bookmarkTool) loadBookmarkTool(session);
    }
    return JSON.stringify(out);
  }

  /** 選外觀用的清單：同一張動畫表只列一次，其他共用的名字放進 search 讓搜尋找得到。 */
  function entries() {
    const session = findSession();
    const data = session && session.data;
    const byModel = new Map();
    const add = (model, name, group) => {
      if (!model || !name) return;
      const entry = byModel.get(model);
      if (!entry) byModel.set(model, { model, name, group, search: name });
      else {
        entry.search += " " + name;
        if (entry.name.startsWith("[") && !name.startsWith("[")) entry.name = name; // 有前綴的讓位給本名
      }
    };
    try {
      const kinds = (data.battlePets && (data.battlePets.kinds || [...(data.battlePets.kindById || new Map()).values()])) || [];
      for (const kind of kinds) (kind.models || []).forEach((model, i) => add(model, kind.name + "・" + ((kind.stages || [])[i] || ""), "戰寵"));
    } catch (e) {}
    try {
      for (const m of data.monsterById.values()) add(m.model, m.name, "怪物");
    } catch (e) {}
    return JSON.stringify([...byModel.values()]);
  }

  /** 掉落查詢網站的網址參數（電腦版「目前地圖資訊」、書籤工具「掉落查詢」）。 */
  function mapQuery() {
    const session = findSession();
    if (!session) return "";
    const params = ["from=game"];
    const p = session.player;
    if (p && typeof p.level === "number") params.push("lv=" + p.level);
    try {
      if (session.isBlacksmith && !(session.secondJob && session.secondJob.id === "bomber")) params.push("smith=1");
    } catch (e) {}
    try {
      const beg = (session.skills && session.skills.get && session.skills.get(230)) || 0;
      if (beg > 0) params.push("beg=" + beg);
    } catch (e) {}
    let mapId;
    try { mapId = session.currentMapId; } catch (e) {}
    if (typeof mapId !== "number") return "";
    params.push("map=" + mapId);
    try {
      const run = session.dungeon && session.dungeon.run;
      const target = session.placement && session.placement.target;
      if (run && typeof run.dungeonId === "number") params.push("dg=" + run.dungeonId);
      else if (session.onHuntingGround && target && typeof target.id === "number") params.push("mon=" + target.id);
    } catch (e) {}
    return params.join("&");
  }

  window.__petAgent = { tick, incomeSummary, entries, mapQuery };
})();
