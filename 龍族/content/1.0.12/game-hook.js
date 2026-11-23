// 在遊戲網頁裡（main world）執行：攔下遊戲和伺服器之間的 WebSocket，解開封包，整理出桌寵要的角色狀態，
// 用 window.postMessage 交給 game-preload.js 轉給主程式。只讀，不送任何東西給伺服器。
//
// 封包是 MessagePack：{ seq, msg: { op, … } }。用到的：
//   auth / character      角色基本資料（名字、職業、等級、經驗、血量、金幣、性別…）。auth 裡還有登入用的 ticket、token：一律不碰、不轉出去
//   room                  進房間：selfId、mapId、me（角色數值）、inv（b 背包、e 身上裝備）、entities（房間裡每個人）
//   roomInfo / roomDelta  房間名稱、是不是主城（town）、成員清單（含性別、膚色、衣服顏色）
//   delta                 每 tick 的變化：me（整份數值）、mep（只有變動的數值）、inv、up（有變化的人：位置、血量、身上裝備的物品編號）
//   error / loggedOut     被踢、登入過期、登出
//
// 人的資料是陣列（遊戲程式的寫法）：[編號, 種類, x, y, 方向, hp, maxHp, ?, 動作, 等級, 衣服, 頭盔, 武器, 盾, 狀態, 披風, 武器等級, 發光]
// 房間成員：[編號, 名字, 等級, 職業, ?, ?, 國家, 性別(1 男 0 女), 臉, 膚色, 衣服顏色, …]
(() => {
  "use strict";
  if (window.__rajaPetHooked) return;
  window.__rajaPetHooked = true;

  // ---------- MessagePack 解碼 ----------
  const td = new TextDecoder();
  function decode(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let p = 0;
    const str = (n) => { const s = td.decode(bytes.subarray(p, p + n)); p += n; return s; };
    const bin = (n) => { const b = bytes.subarray(p, p + n); p += n; return b; };
    const arr = (n) => { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = read(); return a; };
    const map = (n) => { const o = {}; for (let i = 0; i < n; i++) { const k = read(); o[k] = read(); } return o; };
    const ext = (n) => { p++; return bin(n); };
    function read() {
      const b = bytes[p++];
      if (b <= 0x7f) return b;
      if (b <= 0x8f) return map(b & 0x0f);
      if (b <= 0x9f) return arr(b & 0x0f);
      if (b <= 0xbf) return str(b & 0x1f);
      if (b >= 0xe0) return b - 0x100;
      let v;
      switch (b) {
        case 0xc0: return null;
        case 0xc2: return false;
        case 0xc3: return true;
        case 0xc4: v = bytes[p]; p += 1; return bin(v);
        case 0xc5: v = dv.getUint16(p); p += 2; return bin(v);
        case 0xc6: v = dv.getUint32(p); p += 4; return bin(v);
        case 0xc7: v = bytes[p]; p += 1; return ext(v);
        case 0xc8: v = dv.getUint16(p); p += 2; return ext(v);
        case 0xc9: v = dv.getUint32(p); p += 4; return ext(v);
        case 0xca: v = dv.getFloat32(p); p += 4; return v;
        case 0xcb: v = dv.getFloat64(p); p += 8; return v;
        case 0xcc: return bytes[p++];
        case 0xcd: v = dv.getUint16(p); p += 2; return v;
        case 0xce: v = dv.getUint32(p); p += 4; return v;
        case 0xcf: v = Number(dv.getBigUint64(p)); p += 8; return v;
        case 0xd0: return dv.getInt8(p++);
        case 0xd1: v = dv.getInt16(p); p += 2; return v;
        case 0xd2: v = dv.getInt32(p); p += 4; return v;
        case 0xd3: v = Number(dv.getBigInt64(p)); p += 8; return v;
        case 0xd4: return ext(1);
        case 0xd5: return ext(2);
        case 0xd6: return ext(4);
        case 0xd7: return ext(8);
        case 0xd8: return ext(16);
        case 0xd9: v = bytes[p]; p += 1; return str(v);
        case 0xda: v = dv.getUint16(p); p += 2; return str(v);
        case 0xdb: v = dv.getUint32(p); p += 4; return str(v);
        case 0xdc: v = dv.getUint16(p); p += 2; return arr(v);
        case 0xdd: v = dv.getUint32(p); p += 4; return arr(v);
        case 0xde: v = dv.getUint16(p); p += 2; return map(v);
        case 0xdf: v = dv.getUint32(p); p += 4; return map(v);
      }
      throw new Error("msgpack 0x" + b.toString(16));
    }
    return read();
  }

  // ---------- 角色狀態 ----------
  const CHAR_FIELDS = ["name", "classId", "level", "exp", "hp", "maxHp", "mp", "maxMp", "gold", "fame", "gender", "face"];
  const ME_FIELDS = ["level", "exp", "hp", "maxHp", "mp", "maxMp", "gold", "fame", "huntKills", "huntDeaths", "huntMinutes"];
  const S = {
    status: "connecting", // connecting 連線中、login 還沒登入、ingame 遊戲中、kicked 被踢、expired 登入過期、closed 斷線
    character: null,       // 只放 CHAR_FIELDS
    selfId: undefined,
    mapId: undefined,
    roomName: undefined,
    town: false,
    gear: [0, 0, 0, 0, 0], // 衣服、頭盔、武器、盾、披風（物品編號）
    sex: undefined,
    colors: undefined,     // [膚色, 衣服顏色]
    bag: {},               // 物品編號 → 數量（背包＋身上）
    errors: 0,
  };
  const pick = (o, fields) => {
    const out = {};
    for (const f of fields) if (o && o[f] !== undefined && (typeof o[f] === "number" || typeof o[f] === "string")) out[f] = o[f];
    return out;
  };
  let helloTimer = 0;
  const deathTimes = []; // 最近倒下的時間（自動復活判斷是不是一直送死）
  // 最後一次倒下的地方 { mapId, x, y, at }：復活回到同一張練功圖後走回這附近（使用者 2026-11-22）
  let deathSpot = null;
  function noteDeathSpot() {
    try {
      const p = window.__rajaGame && window.__rajaGame.selfPos && window.__rajaGame.selfPos();
      if (S.mapId && !S.town && Array.isArray(p)) deathSpot = { mapId: S.mapId, x: p[0], y: p[1], at: Date.now() };
    } catch {}
  }
  const mergeChar =(o, fields) => { S.character = { ...(S.character || {}), ...pick(o, fields) }; };

  function readInv(inv) {
    if (!inv || !Array.isArray(inv.b)) return;
    const bag = {};
    for (const slot of [...inv.b, ...(Array.isArray(inv.e) ? inv.e : [])]) {
      if (!Array.isArray(slot) || !slot[0]) continue;
      bag[slot[0]] = (bag[slot[0]] || 0) + (slot.length === 2 ? slot[1] : 1);
    }
    S.bag = bag;
  }
  function readEntity(t) {
    if (!Array.isArray(t) || t[0] !== S.selfId) return;
    if (typeof t[5] === "number" && S.character) S.character.hp = t[5];
    if (typeof t[6] === "number" && S.character) S.character.maxHp = t[6];
    const g = [t[10], t[11], t[12], t[13], t[15]].map((v) => (typeof v === "number" ? v : 0));
    if (g.some((v, i) => v !== S.gear[i])) S.gear = g;
  }
  function readMembers(rows) {
    if (!Array.isArray(rows)) return;
    for (const r of rows) {
      if (!Array.isArray(r) || r[0] !== S.selfId) continue;
      if (r[7] === 0 || r[7] === 1) S.sex = r[7];
      if (typeof r[9] === "number" && typeof r[10] === "number") S.colors = [r[9], r[10]];
    }
  }

  function onMessage(msg) {
    if (!msg || typeof msg.op !== "string") return;
    switch (msg.op) {
      case "hello":
        // 有登入的話緊接著就會收到 auth；等一下都沒有才算「還沒登入」（不然主程式會在這一瞬間以為沒登入）
        clearTimeout(helloTimer);
        helloTimer = setTimeout(() => {
          if (S.status === "connecting" || S.status === "closed") {
            S.status = "login";
            schedulePost();
          }
        }, 6000);
        break;
      case "auth":
        S.status = msg.character ? "ingame" : "login";
        if (typeof msg.nation === "number") S.nation = msg.nation;
        if (msg.character) mergeChar(msg.character, CHAR_FIELDS);
        break;
      case "character":
        if (msg.character) mergeChar(msg.character, CHAR_FIELDS);
        S.status = "ingame";
        break;
      case "room":
        S.status = "ingame";
        S.selfId = msg.selfId;
        S.mapId = msg.mapId;
        if (msg.me) mergeChar(msg.me, ME_FIELDS);
        if (msg.me && typeof msg.me.hp === "number") S.dead = msg.me.hp <= 0; // 倒下後回主城，進城時血量還是 0
        readInv(msg.inv);
        if (Array.isArray(msg.entities)) msg.entities.forEach(readEntity);
        if (msg.info) readRoomInfo(msg.info);
        break;
      case "roomInfo":
        readRoomInfo(msg.info);
        break;
      case "roomDelta":
        readMembers(msg.add);
        break;
      case "delta":
        if (msg.me) mergeChar(msg.me, ME_FIELDS);
        if (msg.mep) mergeChar(msg.mep, ME_FIELDS); // 只有變動的欄位（遊戲程式叫 stats patch），打怪時的經驗、金幣、血量都在這裡
        // 倒下：血量 0＋事件 [6, 自己]；復活：事件 [7, 自己]（2026-11-21 在 Chrome 實錄）
        if (msg.mep && typeof msg.mep.hp === "number") {
          if (msg.mep.hp <= 0) {
            if (!S.dead) { deathTimes.push(Date.now()); noteDeathSpot(); } // 血量 0 跟事件 [6] 常在同一包，先到的這邊就要記
            S.dead = true;
          } else S.dead = false;
        }
        if (Array.isArray(msg.ev)) {
          for (const ev of msg.ev) {
            if (!Array.isArray(ev) || ev[1] !== S.selfId) continue;
            if (ev[0] === 6) {
              if (!S.dead) { deathTimes.push(Date.now()); noteDeathSpot(); }
              S.dead = true;
            } else if (ev[0] === 7) S.dead = false;
          }
        }
        if (msg.inv) readInv(msg.inv);
        if (Array.isArray(msg.up)) msg.up.forEach(readEntity);
        break;
      case "trade":
        // 交易視窗的狀態（遊戲 vK()）：view {partner, state 0 被邀請／1 等回覆／2 交易中, mine/theirs {items, slots, gold, ok}}；結束時 end（1＝成交）
        tradeMsg = { view: msg.view || null, end: msg.end, at: Date.now() };
        return;
      case "roomLeft":
        S.roomName = undefined;
        S.town = false;
        break;
      case "loggedOut":
        S.status = "login";
        S.character = null;
        break;
      case "error":
        if (msg.code === "KICKED") S.status = "kicked";
        else if (msg.code === "SESSION_EXPIRED" || msg.code === "NOT_AUTHENTICATED") S.status = "expired";
        else if (msg.code === "NO_CHARACTER" && !S.character) S.status = "login";
        break;
      default:
        return;
    }
    schedulePost();
  }
  function readRoomInfo(info) {
    if (!info || typeof info !== "object") return;
    if (typeof info.name === "string") S.roomName = info.name;
    if (typeof info.mapId === "string") S.mapId = info.mapId;
    if (typeof info.code === "string") S.roomCode = info.code; // 房號：別隻桌寵用 joinRoom(地圖,{code}) 進同一間（交易用）
    S.town = !!info.town;
    if (!S.town && S.mapId) S.lastHuntMap = { id: S.mapId, name: S.roomName || S.mapId };
    readMembers(info.members);
  }

  let tradeMsg = null; // 最近一次交易訊息（見 onMessage 的 trade）

  // ---------- 交給 preload ----------
  let postTimer = 0;
  function post() {
    postTimer = 0;
    // 經驗 %（遊戲視窗標題用）：遊戲自己的經驗條算法，找不到就不放
    try {
      const c = S.character, f = window.__rajaGame && window.__rajaGame.expProgress;
      const x = c && f && typeof c.level === "number" && typeof c.exp === "number" ? f(c.level, c.exp) : null;
      S.expPct = x && x.needed > 0 ? Math.min(100, Math.floor((x.current / x.needed) * 10000) / 100) : undefined;
    } catch { S.expPct = undefined; }
    window.postMessage({ __rajaPet: JSON.parse(JSON.stringify(S)) }, location.origin);
  }
  function schedulePost() {
    if (!postTimer) postTimer = setTimeout(post, 300);
  }

  // ---------- 自動補給、自動合成 ----------
  // 用 game-patch.js 接出來的遊戲函式（window.__rajaGame）做事：跟玩家按傳送、商店「快速補給」、背包「合成」一樣的流程。
  // 設定由主程式（設定視窗）送來；玩家把遊戲視窗叫出來看著的時候不動作，免得跟玩家搶。
  let AUTO = null; // { supply:{enabled,town,hpMin,hpTo,mpMin,mpTo,ammoMin,ammoTo}, fuse:[{enabled,count}×3] }
  let watching = false;
  let busy = false;
  // 停止練功：PAUSED＝主程式說停；pauseTownDone＝停下後已經回過主城（之後玩家自己出城就不再拉回）；resumePending＝按了開始，等著回去打
  let PAUSED = false, pauseTownDone = false, resumePending = false, resumeAt = 0;
  let nextSupplyAt = 0, nextFuseAt = 0;
  let supplyError = "";
  let supplyResumeMode;
  // 補給要先走到賣那樣東西的商人旁邊、商店打開了才買（使用者 2026-11-21：站在原地就買像外掛），所以走路、NPC 視窗那幾個也是必要的
  const SUPPLY_NEED = ["joinRoom", "store", "invView", "state", "quickPotion", "potionKinds", "countHp", "countMp", "net", "towns",
    "talkNpc", "currentTown", "npcSheet", "npcList"];
  const FUSE_NEED = ["store", "invView", "state", "fuseCandidates", "fuseExclude", "fusePick", "rng", "fuse", "tracked"];
  const TIER_NAMES = ["普通→稀有", "稀有→高級", "高級→史詩"];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const G = () => window.__rajaGame;
  const potions = window.RajaPotionSupply;
  const potionCount = (cfg, inv, kind) => {
    const id = potions.selection(kind, cfg?.[`${kind}Item`]);
    return id ? potions.count(inv, id) : kind === "hp" ? G().countHp(inv) : G().countMp(inv);
  };
  const has = (keys) => { const g = G(); return !!g && keys.every((k) => g[k] !== undefined); };
  const log = (text, level = "info") => window.postMessage({ __rajaPetLog: { text, level } }, location.origin);
  const invNow = () => { const g = G(); const raw = g.store.getState().inventory; return raw ? g.invView(raw) : null; };
  async function waitFor(pred, ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (pred()) return true;
      await sleep(250);
    }
    return false;
  }
  const errText = (e) => (e && (e.code || e.message)) || String(e);
  /** 跟伺服器要東西最多等 ms；斷線時遊戲的 promise 可能永遠不回，會讓 busy 一直卡著、之後都不再檢查藥水。 */
  const timed = (p, ms, what) => new Promise((resolve, reject) => {
    let done = false;
    Promise.resolve(p).then((v) => { done = true; resolve(v); }, (e) => { done = true; reject(e); });
    setTimeout(() => Promise.resolve().then(() => { if (!done) reject(new Error(`${what}等太久沒有回應`)); }), ms);
  });

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || !e.data.__rajaPetCmd) return;
    const c = e.data.__rajaPetCmd;
    if (c.type === "settings") {
      AUTO = c.settings || null;
      if (!S.lastHuntMap && c.lastHuntMap && typeof c.lastHuntMap.id === "string") S.lastHuntMap = c.lastHuntMap;
      watching = !!c.watching;
      nextSupplyAt = 0; // 儲存設定或收起遊戲後，不沿用之前失敗的等待時間
      supplyError = "";
      nextFuseAt = 0;
      nextReviveAt = 0;
      // 停止練功（遊戲視窗上方「停止練功／開始練功」按鈕）：停下時回主城一次；按開始就回去打，順便取消倒下太多次的休息
      const paused = !!(AUTO && AUTO.paused);
      if (paused && !PAUSED) { pauseTownDone = false; resumePending = false; }
      if (!paused && PAUSED) { resumePending = true; resumeAt = 0; reviveHoldUntil = 0; }
      PAUSED = paused;
      TRADE = (AUTO && AUTO.trade) || null;
      // 生活技能關掉：如果正在做就叫遊戲停
      const lifeOn = !!(AUTO && AUTO.life && AUTO.life.enabled);
      if (!lifeOn && LIFE_ON) lifeStopPending = true;
      LIFE_ON = lifeOn;
      nextLifeAt = 0;
      const team = (AUTO && AUTO.team) || null;
      if (JSON.stringify(team) !== JSON.stringify(TEAM)) {
        TEAM = team;
        teamStartAt = Date.now();
        nextTeamAt = 0;
        teamInvited = {};
        teamWentTown = false;
        // 組隊練功一律開自動戰鬥（使用者 2026-11-22：進地圖後沒馬上開打——在主城時自動戰鬥是關的，原本照「開始組隊時的樣子」恢復就一直關著）
        if (team) teamAutoMode = "auto";
        teamAutoDone = false;
      }
    }
  });

  function townInfo(mapId) {
    const t = (G().towns || []).find((x) => x.mapId === mapId);
    return t ? { mapId: t.mapId, name: t.name, nation: t.nation, shops: new Set((t.npcs || []).flatMap((n) => n.shops || [])) } : undefined;
  }

  /** 要不要回城補給：任一種低於門檻（門檻填 0 就是不看這一種）。回傳不夠的說明，夠就回傳空陣列。 */
  function lacking(cfg, inv) {
    const g = G(), out = [];
    const hp = potionCount(cfg, inv, "hp"), mp = potionCount(cfg, inv, "mp");
    if (cfg.hpMin > 0 && hp < cfg.hpMin) out.push(`${potions.name("hp", cfg.hpItem)} ${hp}`);
    if (cfg.mpMin > 0 && mp < cfg.mpMin) out.push(`${potions.name("mp", cfg.mpItem)} ${mp}`);
    const ammo = ammoCount(inv);
    if (cfg.ammoMin > 0 && ammo && ammo.n < cfg.ammoMin) out.push(`${ammo.name} ${ammo.n}`);
    return out;
  }
  /** 彈藥：弓用箭（遊戲說箭不會消耗，沒有才需要買）、投擲武器用身上那一疊。沒用這兩種就是 undefined。 */
  function ammoCount(inv) {
    const g = G();
    const weaponId = S.gear[2];
    const weaponSlot = inv.equip.findIndex((s) => s && s[0] === weaponId);
    if (g.countThrown && weaponSlot >= 0 && g.countThrown(inv) > 0) return { kind: "thrown", n: g.countThrown(inv), name: "投擲武器", slot: weaponSlot };
    if (g.countArrow && g.quickArrow && S.gear[3]) return { kind: "arrow", n: g.countArrow(inv), name: "箭" };
    return undefined;
  }

  const randMs = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const STUCK_MS = 10000; // 走去商人時，站著不動這麼久就放棄

  /** 用小地圖下方「NPC」清單的自動導航走到這間店（shop 編號）的商人旁邊，等遊戲把商店打開
   *  （跟玩家按 NPC 清單那一項一樣：遊戲自己找路、走過去、到了才開）。 */
  async function walkToShop(shop) {
    const g = G();
    const area = g.currentTown();
    if (!area) throw new Error("還沒進到主城，沒辦法去找商人");
    const fnOf = { kind: "shop", shop };
    // 這個主城裡賣這間店東西的商人：NPC 清單那位排第一，其他也賣的排後面（被擋住時可以換一位）
    const first = g.npcList().find((e) => e.fn.kind === "shop" && e.fn.shop === shop && e.npcIndex !== undefined);
    const indexes = first ? [first.npcIndex] : [];
    if (g.npcFunctions) area.npcs.forEach((n, i) => {
      try { if (!indexes.includes(i) && (g.npcFunctions(n) || []).some((f) => f.kind === "shop" && f.shop === shop)) indexes.push(i); } catch {}
    });
    if (!indexes.length) throw new Error("NPC 清單裡找不到賣這樣東西的商人");
    const nameOf = (i) => String(area.npcs[i].name || "").split("/")[0] || "商人";
    const openNpc = () => g.npcSheet.getState().open?.npc;
    const opened = indexes.find((i) => openNpc() === area.npcs[i]);
    if (opened !== undefined) return nameOf(opened);
    g.npcSheet.getState().close();
    await sleep(randMs(800, 2000));
    const tryNpc = async (i) => {
      g.talkNpc(i, fnOf);
      // 走得動就一直等到商店打開（最多 45 秒）；站著 10 秒都沒動＝找不到路或被擋住，放棄（使用者 2026-11-22：不要一直卡著）
      let last = g.selfPos && g.selfPos(), movedAt = Date.now();
      const start = Date.now();
      const done = await waitFor(() => {
        if (openNpc() === area.npcs[i]) return true;
        const p = g.selfPos && g.selfPos();
        if (p && last && (p[0] !== last[0] || p[1] !== last[1])) { last = p; movedAt = Date.now(); }
        return Date.now() - movedAt > STUCK_MS || Date.now() - start > 45000;
      }, 46000);
      if (done && openNpc() === area.npcs[i]) {
        log(`商店：走到「${nameOf(i)}」旁邊`);
        await sleep(randMs(1000, 2500)); // 打開商店後看一下再買
        return true;
      }
      if (!S.town) throw new Error("走去商人的途中離開了主城");
      return false;
    };
    // 走去最近的那位；10 秒走不動就直接換別的主城（buyAnywhere／sellHere 接 unreachable）
    if (await tryNpc(indexes[0])) return nameOf(indexes[0]);
    const err = new Error(`走不到「${nameOf(indexes[0])}」旁邊（10 秒沒有走動，可能被擋住或找不到路）`);
    err.unreachable = true;
    throw err;
  }
  function closeShop() {
    try { G().npcSheet.getState().close(); } catch {}
  }

  async function buy(plan, units, what) {
    const g = G();
    if (units <= 0) return;
    await walkToShop(plan.shop);
    // 一次買太多可能放不下；伺服器拒絕後縮小數量，絕不丟棄或出售物品。
    let amount = units;
    for (;;) {
      try {
        const result = await timed(g.net.request({ op: "buy", shop: plan.shop, item: plan.itemNo, n: amount }), 30000, "購買");
        if (result?.error) throw new Error(errText(result.error));
        log(`購買：買了${what.replace(/\d+ 份$/, `${amount} 份`)}`);
        await sleep(800);
        return amount;
      } catch (e) {
        if (errText(e) !== "BAG_FULL") throw e;
        if (amount <= 1) throw new Error("背包已滿（BAG_FULL），連一份藥水也放不下，請先整理背包");
        amount = Math.max(1, Math.floor(amount / 2));
      }
    }
  }

  /** 要回去的練功地圖：設定指定的 > 現在所在的練功圖 > 最後一次待過的練功圖。 */
  function huntTarget(cfg) {
    const g = G();
    const back = cfg?.huntMap || (!S.town && S.mapId) || S.lastHuntMap?.id;
    if (!back) throw new Error("尚未記錄最後狩獵區，請先到狩獵地圖，或在設定中指定地圖");
    if (cfg?.huntMap && (!Array.isArray(g.huntMaps) || !g.huntMaps.some(m => m.id === back))) throw new Error("指定的狩獵地圖目前不在遊戲清單中，請重新選擇");
    const name = g.huntMaps?.find(m => m.id === back)?.name || (S.lastHuntMap?.id === back ? S.lastHuntMap.name : null) || back;
    return { id: back, name };
  }

  // 念咒語復活、出村回練功圖之前都先等一下：5 秒＋隨機 1～10 秒（使用者 2026-11-21：太快了不像人在按）
  const humanPause = () => sleep(5000 + (1 + Math.floor(Math.random() * 10)) * 1000);

  // ---------- 組隊練功（主程式協調好幾隻桌寵，見 main.js 的「組隊練功」）----------
  // TEAM：{ role:"leader", members:[角色名], mapId, mapName } 或 { role:"member", leader:角色名 }；AUTO.teamLeave＝解散時間（離開隊伍一次）
  // 都用遊戲自己的做法（2026-11-22 讀遊戲程式）：
  //   邀請 party{act:"invite",name}、接受 party{act:"accept"}（收到的邀請在 state.partyAsk {id,from}）、建隊 party{act:"create",open:false}、離隊 party{act:"leave"}
  //   隊長帶隊去私人房＝joinRoom(地圖,{hunt:"private"})，伺服器把房間記在 state.party.destination {from,mapId,code}，隊員收到「隊長出發」
  //   隊員「跟上隊伍」＝joinRoom(destination.mapId,{code})；倒下、補給回來也用同一個 code 回到同一間
  let TEAM = null, teamStartAt = 0, nextTeamAt = 0, teamInvited = {}, teamWentTown = false, teamAutoMode, teamLeaveDone = 0, teamAutoDone = false;
  const partyNow = () => { try { return G().state().party || null; } catch { return null; } };
  const roomCode = () => { try { const st = G().state(); return st.room && st.room.status === "in" ? st.roomMeta && st.roomMeta.code : undefined; } catch { return undefined; } };
  const myName = () => (S.character && S.character.name) || "";
  // 隊伍正在練功的房間（遊戲「跟上隊伍」按鈕用的同一份 party.destination）。
  // 不限桌寵的「組隊練功」：桌寵重開後 TEAM 清掉了但遊戲裡隊伍還在，隊長回城補給、復活後也要回隊伍那間（使用者 2026-11-22）
  const teamDest = () => { const p = partyNow(); return (p && p.destination) || null; };
  async function partyReq(body) {
    const r = await timed(G().net.request({ op: "party", ...body }), 20000, "組隊");
    if (r && r.error) throw new Error(errText(r.error));
    return r;
  }
  /** 自動戰鬥恢復成 mode：auto＝開（用 setAuto，manual 時也能直接開；toggleAuto 從 manual 會切成 locked＝關），locked＝關。 */
  function restoreAuto(mode) {
    const g = G();
    const now = g.state().auto && g.state().auto.mode;
    if (mode === "auto" && now !== "auto") g.net.post({ op: "setAuto", locked: false });
    else if (mode === "locked" && now === "auto" && g.toggleAuto) g.toggleAuto();
  }
  /** 隊長帶隊伍進私人房（隊員會收到「隊長出發」）。 */
  async function enterPrivate(team) {
    const g = G();
    const name = team.mapName || team.mapId;
    log(`組隊：帶隊伍去「${name}」私人房`);
    const err = await timed(g.joinRoom(team.mapId, { hunt: "private" }), 30000, "進私人房");
    if (err) throw new Error(`進不了「${name}」私人房（${err}）`);
    if (!(await waitFor(() => !S.town && S.mapId === team.mapId, 20000))) throw new Error(`等太久還沒進到「${name}」`);
    await sleep(1000);
    restoreAuto(teamAutoMode);
    log(`組隊：已進「${name}」私人房，等隊員跟上`);
  }
  /** 回到隊伍的房間（隊長出發的那間）。隊長回不去（房間沒了）就重開一間私人房。 */
  async function joinTeamRoom(dest, autoMode, what) {
    const g = G();
    if (roomCode() === dest.code) return;
    const err = await timed(g.joinRoom(dest.mapId, { code: dest.code }), 30000, "跟上隊伍");
    if (err) {
      if (TEAM && TEAM.role === "leader" && TEAM.mapId) { log(`組隊：回不了原本的房間（${err}），重開一間私人房`, "warn"); await enterPrivate(TEAM); return; }
      throw new Error(`跟不上隊伍（${err}）`);
    }
    if (!(await waitFor(() => roomCode() === dest.code, 20000))) throw new Error("等太久還沒進到隊伍的房間");
    clearPartyGo();
    await sleep(1000);
    // 組隊練功中一律開自動戰鬥（倒下前若是關著，autoMode 會是 locked，照它恢復弓手就一直不打：2026-11-22 實測）
    restoreAuto(TEAM ? teamAutoMode : autoMode || teamAutoMode);
    log(`${what}，回到隊伍的房間（${dest.from} 帶隊）繼續打`);
  }
  /** 組隊的人互加好友（遊戲「社交」的加好友；使用者 2026-11-22：先變好友比較好組隊）。每個人只試一次。 */
  const teamFriended = new Set();
  async function ensureFriends(names) {
    const todo = names.filter((n) => n && !teamFriended.has(n));
    if (!todo.length) return;
    let list = [];
    try { const r = await timed(G().net.request({ op: "friends" }), 20000, "好友清單"); list = (r && r.list) || []; } catch {}
    const have = new Set(list.map((f) => f && f[0]));
    for (const n of todo) {
      teamFriended.add(n);
      if (have.has(n)) continue;
      try { await timed(G().net.request({ op: "addFriend", name: n }), 20000, "加好友"); log(`組隊：加 ${n} 為好友`); }
      catch (e) { log(`組隊：加 ${n} 為好友沒成功（${errText(e)}），照樣組隊`, "warn"); }
      await sleep(randMs(600, 1200));
    }
  }
  /** 隊伍要去的房間：伺服器記的 party.destination，或剛收到的「隊長出發」（state.partyGo）。 */
  function teamTarget(st, party, leader) {
    if (party && party.destination) return party.destination;
    const go = st.partyGo;
    return go && go.code && (!leader || go.from === leader) ? go : null;
  }
  /** 關掉「隊長出發」對話框（遊戲自己按「跟上」後也是這樣關；不關會在畫面上留 60 秒）。 */
  function clearPartyGo() {
    try { const st = G().state(); if (st.partyGo && st.setPartyGo) st.setPartyGo(null); } catch {}
  }
  /** 組隊狀態每 5 秒看一次，該做的做一步。 */
  async function teamTick() {
    const g = G();
    if (AUTO && AUTO.teamLeave && AUTO.teamLeave !== teamLeaveDone) {
      teamLeaveDone = AUTO.teamLeave;
      if (partyNow()) { await partyReq({ act: "leave" }); log("組隊：已離開隊伍"); }
    }
    const team = TEAM, me = myName();
    if (!team || !me || S.dead || Date.now() < nextTeamAt) return;
    const st = g.state(), party = st.party || null;
    // 已經在「隊長出發」說的那間房（或自己就是隊長）：對話框不用留著
    if (st.partyGo && (roomCode() === st.partyGo.code || st.partyGo.from === me)) clearPartyGo();
    // 開始組隊時已經在隊伍的房間（例如剛復活回來）就不會再進一次房間：這種時候也要把自動戰鬥開起來（每次開始組隊做一次）
    const dest0 = party && party.destination;
    if (!teamAutoDone && dest0 && roomCode() === dest0.code) { teamAutoDone = true; restoreAuto(teamAutoMode); }
    await ensureFriends(team.role === "member" ? [team.leader] : team.members || []);
    if (team.role === "member") {
      if (party && party.leader !== team.leader) { await partyReq({ act: "leave" }); log(`組隊：先離開原本 ${party.leader} 的隊伍`); return; }
      if (!party) {
        if (st.partyAsk && st.partyAsk.from === team.leader) {
          await sleep(randMs(1000, 3000));
          await partyReq({ act: "accept" });
          try { st.setPartyAsk && st.setPartyAsk(null); } catch {}
          log(`組隊：加入 ${team.leader} 的隊伍`);
          return;
        }
        if (!S.town && !teamWentTown) {
          teamWentTown = true;
          const own = (g.towns || []).find((t) => t.nation === S.nation);
          const town = (AUTO.supply && AUTO.supply.town && townInfo(AUTO.supply.town)) || (own && townInfo(own.mapId));
          if (town) {
            log(`組隊：回「${town.name}」等 ${team.leader} 邀請`);
            const err = await timed(g.joinRoom(town.mapId, { town: true }), 30000, "回主城");
            if (err) throw new Error(`回不了主城（${err}）`);
          }
        }
        return;
      }
      const dest = teamTarget(st, party, team.leader);
      if (dest && roomCode() !== dest.code) {
        await sleep(randMs(2000, 5000));
        await joinTeamRoom(dest, teamAutoMode, `組隊：跟上 ${dest.from}`);
      }
      return;
    }
    if (team.role === "leader") {
      if (party && party.leader !== me) { await partyReq({ act: "leave" }); log(`組隊：先離開 ${party.leader} 的隊伍，自己當隊長`); return; }
      if (!party) { await partyReq({ act: "create", open: false }); log("組隊：建立隊伍"); return; }
      const inParty = new Set(party.members.map((m) => m[0]));
      const missing = (team.members || []).filter((n) => !inParty.has(n));
      for (const n of missing) {
        if (Date.now() < (teamInvited[n] || 0)) continue;
        teamInvited[n] = Date.now() + 20000;
        try { await partyReq({ act: "invite", name: n }); log(`組隊：邀請 ${n}`); }
        catch (e) { log(`組隊：邀請 ${n} 沒成功（${errText(e)}），20 秒後再試`, "warn"); }
        await sleep(randMs(800, 1500));
      }
      if (!party.destination) {
        // 等大家都進隊（最多 2 分鐘，沒到齊也先出發，晚到的之後收到邀請、跟上）
        if (missing.length && Date.now() - teamStartAt < 120000) return;
        await humanPause();
        await enterPrivate(team);
        return;
      }
      if (roomCode() !== party.destination.code) await joinTeamRoom(party.destination, teamAutoMode, "組隊：隊長");
    }
  }
  function teamState() {
    const party = partyNow();
    if (!TEAM) return party ? `在 ${party.leader} 的隊伍（沒有用桌寵組隊）` : "";
    const dest = party && party.destination;
    const here = dest && roomCode() === dest.code;
    if (TEAM.role === "leader") {
      if (!party) return "隊長：建立隊伍中";
      const n = party.members.length;
      return dest ? `隊長：${here ? "在" : "回"}私人房「${TEAM.mapName || dest.mapId}」，隊伍 ${n} 人` : `隊長：邀請隊員中（${n}/${(TEAM.members || []).length + 1}）`;
    }
    if (!party) return `隊員：等 ${TEAM.leader} 邀請`;
    return dest ? (here ? `隊員：在 ${TEAM.leader} 的私人房` : `隊員：跟上 ${TEAM.leader} 中`) : `隊員：已入隊，等 ${TEAM.leader} 出發`;
  }

  // ---------- 指定交易（主程式協調兩隻桌寵，見 main.js 的物品欄視窗）----------
  // TRADE：{ id, role:"give", to:角色名, items:[{slot, sig}], gold } 或 { id, role:"take", from:角色名, count, gold, meet:{mapId,code}|null }
  // 跟玩家自己交易一樣（遊戲 vK()／VA()）：要在同一間房、雙方 Lv25 以上、5 格內；tradeAsk{to:對方 id} → 對方 tradeAnswer{accept} →
  // tradeSet{slots:背包格,gold} → 雙方 tradeOk{ok:true} → 收到 trade{end:1} 成交。給的一方先回主城，收的一方用房號 joinRoom 進同一間、走過去。
  let TRADE = null, tradeStatus = null;
  const tradeDone = {};
  const TRADE_END = ["交易取消", "交易成功", "對方拒絕了交易", "想要交易的物品被使用掉了", "背包放不下，交易取消", "金幣不夠，交易取消", "距離太遠，交易已取消",
    "交易一方已達每日成交額度（直接交易與交易所共用）", "新帳號前 48 小時有成交額度限制", "交易一方帳號未滿 48 小時，淨收金幣的一方須提供道具"];
  const setTradeStep = (id, step, extra = {}) => { tradeStatus = { id, step, at: Date.now(), ...extra }; schedulePost(); };
  const memberByName = (name) => { try { return (G().state().roomMeta?.members || []).find((m) => m[1] === name) || null; } catch { return null; } };
  const posOf = (id) => { try { const e = G().world.entities.get(id); return e ? [e[2], e[3]] : null; } catch { return null; } };
  function isNear(id) {
    const a = G().selfPos && G().selfPos(), b = posOf(id);
    return !!a && !!b && Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 4; // 遊戲要 5 格內，留一格餘裕
  }
  function walkNextTo(id) {
    const a = G().selfPos && G().selfPos(), b = posOf(id);
    if (!a || !b) return;
    G().net.post({ op: "move", x: b[0] + (a[0] <= b[0] ? -1 : 1), y: b[1] });
  }
  async function tradeReq(body) {
    const r = await timed(G().net.request(body), 20000, "交易");
    if (r && r.error) throw new Error(errText(r.error));
    return r;
  }
  const rawBag = () => { try { return G().store.getState().inventory?.b || []; } catch { return []; } };
  /** 選的物品現在在背包第幾格（選完到交易之間可能撿東西、合成而換格子，用物品內容比對）。 */
  function resolveSlots(items) {
    const bag = rawBag(), used = new Set();
    return items.map((it) => {
      const same = (i) => bag[i] && bag[i].length && JSON.stringify(bag[i]) === it.sig && !used.has(i);
      const i = same(it.slot) ? it.slot : bag.findIndex((_, k) => same(k));
      if (i < 0) throw new Error(`「${it.name || "物品"}」已經不在背包裡了`);
      used.add(i);
      return i;
    });
  }
  async function tradeTown() {
    const g = G();
    if (S.town) return;
    const own = (g.towns || []).find((t) => t.nation === S.nation);
    const town = (AUTO.supply && AUTO.supply.town && townInfo(AUTO.supply.town)) || (own && townInfo(own.mapId));
    if (!town) throw new Error("找不到要去的主城");
    log(`交易：回「${town.name}」`);
    const err = await timed(g.joinRoom(town.mapId, { town: true }), 30000, "回主城");
    if (err) throw new Error(`回不了主城（${err}）`);
    if (!(await waitFor(() => S.town && S.mapId === town.mapId, 20000))) throw new Error("等太久還沒進到主城");
    await sleep(1500);
  }
  /** 交易途中的等待：主程式取消（換了交易或按取消）就馬上停。 */
  async function tradeWait(job, pred, ms) {
    const alive = () => !!TRADE && TRADE.id === job.id;
    const ok = await waitFor(() => !alive() || pred(), ms);
    if (!alive()) throw new Error("交易已取消");
    return ok;
  }
  async function approach(job, name, ms) {
    let m = null;
    if (!(await tradeWait(job, () => (m = memberByName(name)), ms))) return null;
    for (let i = 0; i < 3 && !isNear(m[0]); i++) {
      walkNextTo(m[0]);
      if (await tradeWait(job, () => isNear(m[0]), 8000)) break;
    }
    return m;
  }
  async function tradeFinish(job) {
    if (!(await tradeWait(job, () => tradeMsg && tradeMsg.end !== undefined, 90000))) throw new Error("等太久交易都沒有成交");
    if (tradeMsg.end !== 1) throw new Error(TRADE_END[tradeMsg.end] || `交易結束（${tradeMsg.end}）`);
  }
  async function tradeGive(job) {
    await tradeTown();
    setTradeStep(job.id, `在主城等 ${job.to} 過來`, { meet: { mapId: S.mapId, code: roomCode() } });
    log(`交易：在主城等 ${job.to}`);
    const m = await approach(job, job.to, 180000);
    if (!m) throw new Error(`等了 3 分鐘 ${job.to} 都沒有進到同一個房間`);
    if (!(await tradeWait(job, () => isNear(m[0]), 30000))) throw new Error(`走不到 ${job.to} 旁邊（要 5 格內）`);
    await sleep(randMs(1000, 2000));
    tradeMsg = null;
    setTradeStep(job.id, `邀請 ${job.to} 交易`);
    await tradeReq({ op: "tradeAsk", to: m[0] });
    if (!(await tradeWait(job, () => tradeMsg && (tradeMsg.end !== undefined || (tradeMsg.view && tradeMsg.view.state === 2)), 60000))) throw new Error(`${job.to} 沒有回應交易邀請`);
    if (!tradeMsg.view) throw new Error(TRADE_END[tradeMsg.end] || "交易取消");
    const slots = resolveSlots(job.items || []);
    setTradeStep(job.id, "放上物品");
    await tradeReq({ op: "tradeSet", slots, gold: job.gold || 0 });
    await tradeWait(job, () => tradeMsg && tradeMsg.view && tradeMsg.view.mine.slots.length === slots.length && tradeMsg.view.mine.gold === (job.gold || 0), 10000);
    await sleep(randMs(800, 1500));
    await tradeReq({ op: "tradeOk", ok: true });
    setTradeStep(job.id, "按了 OK，等對方確認");
    await tradeFinish(job);
  }
  async function tradeTake(job) {
    const g = G();
    setTradeStep(job.id, `等 ${job.from} 到主城`);
    if (!(await tradeWait(job, () => TRADE && TRADE.id === job.id && TRADE.meet && TRADE.meet.code, 180000))) throw new Error(`等了 3 分鐘 ${job.from} 都沒有到主城`);
    const meet = TRADE.meet;
    if (roomCode() !== meet.code) {
      log(`交易：去 ${job.from} 所在的房間`);
      const err = await timed(g.joinRoom(meet.mapId, { code: meet.code }), 30000, "進同一個房間");
      if (err) throw new Error(`進不了 ${job.from} 的房間（${err}）`);
      if (!(await tradeWait(job, () => roomCode() === meet.code, 20000))) throw new Error(`等太久還沒進到 ${job.from} 的房間`);
      await sleep(1500);
    }
    setTradeStep(job.id, `走到 ${job.from} 旁邊`);
    tradeMsg = null;
    const m = await approach(job, job.from, 30000);
    if (!m) throw new Error(`房間裡找不到 ${job.from}`);
    setTradeStep(job.id, `等 ${job.from} 發交易邀請`);
    if (!(await tradeWait(job, () => tradeMsg && tradeMsg.view && tradeMsg.view.state === 0, 90000))) throw new Error(`${job.from} 沒有發交易邀請`);
    if (tradeMsg.view.partner !== job.from) { await tradeReq({ op: "tradeAnswer", accept: false }); throw new Error(`收到的是 ${tradeMsg.view.partner} 的交易邀請，已拒絕`); }
    await sleep(randMs(800, 1500));
    await tradeReq({ op: "tradeAnswer", accept: true });
    // 對方放的東西要跟指定的一樣（件數、金幣）才按 OK
    setTradeStep(job.id, "確認對方放的物品");
    const match = () => { const v = tradeMsg && tradeMsg.view; return v && v.state === 2 && v.theirs.items.length === (job.count || 0) && v.theirs.gold === (job.gold || 0); };
    if (!(await tradeWait(job, match, 60000))) throw new Error("對方放的物品跟指定的不一樣，沒有按 OK");
    await sleep(randMs(800, 1500));
    await tradeReq({ op: "tradeOk", ok: true });
    setTradeStep(job.id, "按了 OK，等成交");
    await tradeFinish(job);
  }
  async function tradeRun(job) {
    const g = G();
    const autoMode = g.state().auto && g.state().auto.mode;
    const wasHunting = !S.town;
    let back = null;
    try { back = huntTarget(AUTO.supply || {}); } catch {}
    tradeDone[job.id] = true;
    try {
      if (((g.state().character && g.state().character.level) || 0) < 25) throw new Error("等級要 25 以上才能交易");
      log(job.role === "give" ? `交易：要把物品交給 ${job.to}` : `交易：要收 ${job.from} 的物品`);
      if (job.role === "give") await tradeGive(job); else await tradeTake(job);
      setTradeStep(job.id, "交易成功", { done: true, ok: true });
      log("交易：成功");
    } catch (e) {
      try { if (tradeMsg && tradeMsg.view) await tradeReq({ op: "tradeCancel" }); } catch {}
      setTradeStep(job.id, errText(e), { done: true, error: true });
      log(`交易沒有完成：${errText(e)}`, "warn");
    }
    if (wasHunting) { try { await backToHunt(back, autoMode, "交易結束"); } catch (e) { log(`交易後回練功地圖失敗：${errText(e)}`, "warn"); } }
  }
  /** 物品欄（物品欄視窗顯示、選要交易的物品）：用遊戲自己的道具名稱、標籤（稀有度、+強化…）。 */
  function invSummary() {
    const g = G();
    let raw;
    try { raw = g.store.getState().inventory; } catch {}
    if (!raw) return null;
    const label = (s, i) => {
      if (!s || !s.length) return null;
      let it = null, tags = [];
      try { it = g.item ? g.item(s[0]) : null; } catch {}
      try { tags = g.itemTags ? g.itemTags(s) : []; } catch {}
      const nameOf = codex && codex.itemNames ? codex.itemNames[s[0]] : undefined;
      return { slot: i, no: s[0], name: (it && it.name) || nameOf || `#${s[0]}`, n: s.length === 2 ? s[1] : 1, tags: Array.isArray(tags) ? tags.map(String) : [],
        ...(s.length >= 3 ? { dur: [s[1] & 65535, s[2] & 65535] } : {}), sig: JSON.stringify(s) };
    };
    return { bag: (raw.b || []).map(label), equip: (raw.e || []).map(label), gold: (g.state().character && g.state().character.gold) || 0 };
  }

  // ---------- 自動販售 ----------
  // 規則（主程式整理好送來的 AUTO.sellRules）：{kind:"item", no} 這種道具；{kind:"cat", cat, sub?} 這一類（商店分類，見 itemCatOf）。
  // 能不能賣、貴重與否都問遊戲自己的 sellCheck（商店「賣」頁一樣：鎖定的不能賣；稀有、+強化、追蹤詞綴＝貴重，預設不賣）。
  // 賣法跟玩家一樣：在主城走到商人旁、商店開了才 sellMany{slots, expected:各格內容}。
  const CAT_NAMES = { weapon: "武器", armor: "防具", potion: "藥水", material: "材料", tool: "工具", other: "其他" };
  let nextSellAt = 0, sellError = "";
  /** 商店分類：[大類, 小類]。武器小類照遊戲商店（弓、法杖與令牌、單手劍術…），防具照裝備位置。 */
  function itemCatOf(no) {
    const g = G();
    const def = g.item && g.item(no);
    if (!def || !g.itemCat) return null;
    const cat = g.itemCat(def);
    const sub = cat === "weapon" && g.itemSub ? g.itemSub(def) : cat === "armor" && codex ? codex.slots[def.wearAble] || "其他防具" : "";
    return [cat, sub];
  }
  /** 給設定視窗的道具清單（每次進遊戲送一次）：[編號, 名稱, 大類, 小類]。 */
  function postCatalog() {
    const g = G();
    if (!g || !g.item || !g.itemCat || !codex || !codex.itemNames) return false;
    const list = [];
    for (const no of Object.keys(codex.itemNames).map(Number)) {
      try { const c = itemCatOf(no); const def = g.item(no); if (c && def) list.push([no, def.name, c[0], c[1]]); } catch {}
    }
    if (!list.length) return false;
    window.postMessage({ __rajaPetCatalog: { cats: CAT_NAMES, items: list } }, location.origin);
    return true;
  }
  let catalogSent = false;
  /** 背包裡現在要賣的格子（照規則、遊戲的能不能賣、貴重設定；自動補給用的紅藍水不賣）。 */
  function sellPlan(cfg) {
    const g = G();
    const rules = (AUTO && AUTO.sellRules) || [];
    if (!rules.length || !g.sellCheck) return { slots: [], gold: 0, names: [] };
    let tracked = [];
    try { tracked = (g.tracked && g.tracked(g.state().character && g.state().character.id)) || []; } catch {}
    const keepNo = new Set([AUTO.supply && AUTO.supply.hpItem, AUTO.supply && AUTO.supply.mpItem].filter(Boolean));
    const bag = rawBag(), out = { slots: [], gold: 0, names: [] };
    bag.forEach((s, i) => {
      if (!s || !s.length || keepNo.has(s[0])) return;
      const c = itemCatOf(s[0]);
      const hit = rules.some((r) => r.kind === "item" ? r.no === s[0] : !!c && c[0] !== "potion" && r.cat === c[0] && (!r.sub || r.sub === c[1]));
      if (!hit) return;
      let chk;
      try { chk = g.sellCheck(s, tracked); } catch { return; }
      if (!chk || !chk.sell) return;
      if (chk.precious && chk.precious.length && !(cfg && cfg.sellPrecious)) return;
      out.slots.push(i);
      out.gold += chk.price || 0;
      const def = g.item(s[0]);
      out.names.push(`${(def && def.name) || s[0]}${s.length === 2 && s[1] > 1 ? ` ×${s[1]}` : ""}`);
    });
    return out;
  }
  const freeSlots = () => rawBag().filter((s) => !s || !s.length).length;
  /** 在主城：走到商人旁賣掉。賣了幾件。 */
  async function sellHere(cfg, town) {
    const g = G();
    let plan = sellPlan(cfg);
    if (!plan.slots.length) return 0;
    const shops = [...((town && town.shops) || [])];
    let opened = false;
    for (const shop of shops) {
      try { await walkToShop(shop); opened = true; break; }
      catch (e) { if (e && e.unreachable) break; log(`販售：${errText(e)}，換一位商人`, "warn"); } // 走不動（被擋住）就不在這個主城耗時間
    }
    if (!opened) throw new Error("主城裡走不到任何商人旁邊，這次沒有賣");
    let sold = 0, gold = 0;
    for (let round = 0; round < 10 && plan.slots.length; round++) {
      const slots = plan.slots.slice(0, 20), bag = rawBag();
      const before = (g.state().character && g.state().character.gold) || 0;
      const r = await timed(g.net.request({ op: "sellMany", slots, expected: slots.map((i) => bag[i]) }), 30000, "販售");
      if (r && r.error) throw new Error(errText(r.error));
      await waitFor(() => slots.every((i) => !rawBag()[i] || !rawBag()[i].length || JSON.stringify(rawBag()[i]) !== JSON.stringify(bag[i])), 5000);
      sold += slots.length;
      gold += Math.max(0, ((g.state().character && g.state().character.gold) || 0) - before);
      await sleep(randMs(600, 1200));
      plan = sellPlan(cfg);
    }
    closeShop();
    log(`販售：賣了 ${sold} 件${gold ? `，得到 ${gold.toLocaleString()} 金幣` : ""}`);
    return sold;
  }
  /** 背包快滿（剩 freeSlots 格以下）又有要賣的：回主城賣完再回去練功。在主城閒著就直接賣。 */
  async function sellTick(cfg) {
    if (Date.now() < nextSellAt) return;
    const plan = sellPlan(cfg);
    if (!plan.slots.length) { nextSellAt = Date.now() + 30000; return; }
    const g = G();
    const own = (g.towns || []).find((t) => t.nation === S.nation);
    const town = (AUTO.supply && AUTO.supply.town && townInfo(AUTO.supply.town)) || (own && townInfo(own.mapId));
    if (!town) return;
    if (S.town) {
      if (S.mapId !== town.mapId) { const here = townInfo(S.mapId); if (here) { await sellHere(cfg, here); nextSellAt = Date.now() + 60000; return; } }
      await sellHere(cfg, town);
      nextSellAt = Date.now() + 60000;
      return;
    }
    if (freeSlots() > (cfg.freeSlots ?? 10)) { nextSellAt = Date.now() + 15000; return; }
    const autoMode = g.state().auto && g.state().auto.mode;
    let back = null;
    try { back = huntTarget(AUTO.supply || {}); } catch {}
    log(`販售：背包只剩 ${freeSlots()} 格，回「${town.name}」賣 ${plan.slots.length} 件`);
    const err = await timed(g.joinRoom(town.mapId, { town: true }), 30000, "回主城");
    if (err) throw new Error(`回不了主城（${err}）`);
    if (!(await waitFor(() => S.town && S.mapId === town.mapId, 20000))) throw new Error("等太久還沒進到主城");
    await sleep(1500);
    try { await sellHere(cfg, town); }
    finally { nextSellAt = Date.now() + 120000; await backToHunt(back, autoMode, "販售完成"); }
  }

  // ---------- 生活技能（練製作技能）----------
  // AUTO.life：{ enabled, skill, mode:"best"（只做目前最高等級能做的）|"recipe"（指定配方）, recipe, count（0＝一直做）, buy（自動買不足的材料、工具）, chain（用身上原料先做中間材料） }
  // 跟玩家在「生活」頁按製作一樣：在主城 craft{recipe, count}（一件 1.5 秒），做完或材料用完遊戲自己停；craft{recipe:0,count:0}＝停。
  // 計算（等級、能不能做、材料鏈、要買什麼）在 life-plan.js，跟生活技能視窗同一套。
  // （這裡比下面「自動配點」的 const codex 早執行，所以直接讀 window.RajaCodex）
  const LP = window.RajaLifePlan && window.RajaCodex && window.RajaCodex.recipes ? window.RajaLifePlan.make(window.RajaCodex) : null;
  let LIFE_ON = false;
  let lifeKey = "", lifeMade = 0, lifeState = "", lifeError = "", nextLifeAt = 0, lifeStopPending = false, lifeDoneLogged = false;
  function bagCounts() {
    const out = {};
    for (const s of rawBag()) if (s && s.length) out[s[0]] = (out[s[0]] || 0) + (s.length === 2 ? s[1] : 1);
    return out;
  }
  function hasToolKind(kind) {
    const g = G();
    let inv;
    try { inv = g.store.getState().inventory; } catch {}
    return [...((inv && inv.e) || []), ...((inv && inv.b) || [])].some((s) => s && s.length && ((g.item(s[0]) || {}).itemKind === kind));
  }
  /** 這個主城哪間店賣這樣東西（{shop, unit}）。 */
  function shopFor(itemNo, town) {
    const g = G();
    if (!town || !g.shopItems || !g.unitOf) return null;
    const unit = g.unitOf(itemNo);
    if (!unit || !(unit.price > 0)) return null;
    const shop = [...town.shops].find((s) => { try { return g.shopItems(s).includes(itemNo); } catch { return false; } });
    return shop === undefined ? null : { shop, unit };
  }
  function toolFor(kind, town) {
    const g = G();
    if (!town || !g.shopItems) return null;
    for (const s of town.shops) {
      let list = [];
      try { list = g.shopItems(s); } catch {}
      const no = list.find((n) => (g.item(n) || {}).itemKind === kind);
      if (no !== undefined) return no;
    }
    return null;
  }
  /** 在主城買到身上有 qty 個（走到商人旁、一次最多買 buyLimit 份）。 */
  async function buyItem(itemNo, qty, town) {
    const g = G();
    const name = (g.item(itemNo) || {}).name || itemNo;
    for (let round = 0; round < 20; round++) {
      const have = bagCounts()[itemNo] || 0;
      if (have >= qty) return;
      const s = shopFor(itemNo, town);
      if (!s) throw new Error(`「${town.name}」沒有賣${name}`);
      const gold = (g.state().character && g.state().character.gold) || 0;
      const units = Math.min(Math.ceil((qty - have) / (s.unit.count || 1)), Math.floor(gold / s.unit.price), g.buyLimit ? g.buyLimit(itemNo) : 99);
      if (!(units > 0)) throw new Error(`金幣不夠買${name}`);
      const bought = await buy({ shop: s.shop, itemNo }, units, `${name} ${units} 份`);
      if (!bought || !(await waitFor(() => (bagCounts()[itemNo] || 0) > have, 5000))) throw new Error(`買不到${name}`);
    }
  }
  /** 開始做、等遊戲做完（character.mk 回到 0）。回傳做出幾件成品。 */
  async function craftRun(recipe, count) {
    const g = G();
    const before = bagCounts()[recipe.itemNo] || 0;
    const name = (g.item(recipe.itemNo) || {}).name || recipe.itemNo;
    closeShop();
    lifeState = `製作 ${name} ×${count}`;
    const r = await timed(g.net.request({ op: "craft", recipe: recipe.no, count }), 20000, "製作");
    if (r && r.error) throw new Error(errText(r.error));
    const busyNow = () => { const ch = charNow(); return !!ch && ch.mk === recipe.no; };
    await waitFor(busyNow, 5000);
    await waitFor(() => !busyNow(), count * 2500 + 30000);
    await sleep(800);
    const made = Math.max(0, (bagCounts()[recipe.itemNo] || 0) - before);
    log(`生活技能：${name} 做了 ${count} 次，得到 ${made} 個`);
    return made;
  }
  // 斷線重連（遊戲網頁重新載入）後接著做同一件工作：做了幾件記在 sessionStorage（同一個視窗重新載入還在）
  const LIFE_SAVE = "rajaPet:life";
  function saveLifeProgress(clear = false) {
    try { if (clear) sessionStorage.removeItem(LIFE_SAVE); else sessionStorage.setItem(LIFE_SAVE, JSON.stringify({ key: lifeKey, made: lifeMade })); } catch {}
  }
  try { const s = JSON.parse(sessionStorage.getItem(LIFE_SAVE) || "null"); if (s && typeof s.key === "string") { lifeKey = s.key; lifeMade = Number(s.made) || 0; } } catch {}

  /** 採集（採礦、伐木…）：跟遊戲「生活→採集」按開始一樣，在主城帶著工具送 gather{skill}，遊戲每 3 秒採一次、一直採；character.gat＝正在採的技能。
   *  斷線重連、被打斷（背包滿以外）後會再開始。 */
  let gatherStartedAt = 0;
  async function gatherTick(cfg, sk) {
    const g = G(), ch = charNow();
    if (ch.gat === sk.skill) { lifeState = `採集中：${sk.name}`; lifeError = ""; return; }
    if (ch.mk) { lifeState = "製作中（等這一批做完再採集）"; return; }
    if (ch.gat) { await timed(g.net.request({ op: "gather", skill: 0 }), 20000, "停止採集"); await sleep(1000); return; } // 在採別的：先停
    const town = townInfo(S.mapId);
    if (sk.tool > 0 && !hasToolKind(sk.tool)) {
      const no = town && toolFor(sk.tool, town);
      const toolName = (codex.toolNames && codex.toolNames[sk.tool]) || "工具";
      if (!cfg.buy || no === null || no === undefined) {
        lifeError = `缺工具「${toolName}」${cfg.buy ? "（這個主城買不到）" : "（可以勾「自動購買」）"}`;
        lifeState = lifeError;
        log(`生活技能：${lifeError}，1 分鐘後再看`, "warn");
        nextLifeAt = Date.now() + 60000;
        return;
      }
      lifeState = `買工具「${toolName}」`;
      await buyItem(no, (bagCounts()[no] || 0) + 1, town);
      closeShop();
    }
    // 剛開始沒多久遊戲就自己停了：多半是背包滿了
    const free = rawBag().filter((s) => !s || !s.length).length;
    if (!free || (gatherStartedAt && Date.now() - gatherStartedAt < 20000)) {
      lifeError = free ? "採集一開始就停下（可能背包滿了或這裡採不到）" : "背包滿了，採集停下";
      lifeState = lifeError;
      log(`生活技能：${lifeError}，5 分鐘後再試`, "warn");
      gatherStartedAt = 0;
      nextLifeAt = Date.now() + 300000;
      return;
    }
    const r = await timed(g.net.request({ op: "gather", skill: sk.skill }), 20000, "採集");
    if (r && r.error) throw new Error(errText(r.error));
    gatherStartedAt = Date.now();
    lifeError = "";
    lifeState = `採集中：${sk.name}`;
    log(`生活技能：開始採集「${sk.name}」`);
  }

  async function lifeTick(cfg) {
    const g = G(), ch = charNow();
    if (!LP || !ch || !Array.isArray(ch.life)) return;
    const gsk = (window.RajaCodex.gatherSkills || []).find((s) => s.skill === cfg.skill);
    const key = JSON.stringify([cfg.skill, cfg.mode, cfg.recipe, cfg.count, !!cfg.useUp]);
    if (key !== lifeKey) { lifeKey = key; lifeMade = 0; lifeError = ""; lifeDoneLogged = false; gatherStartedAt = 0; saveLifeProgress(); }
    if (Date.now() < nextLifeAt) return;
    const own = (g.towns || []).find((t) => t.nation === S.nation);
    const home = (AUTO.supply && AUTO.supply.town && townInfo(AUTO.supply.town)) || (own && townInfo(own.mapId));
    if (!S.town) {
      if (!home) throw new Error("找不到主城");
      lifeState = `回「${home.name}」練生活技能`;
      log(`生活技能：回「${home.name}」`);
      const err = await timed(g.joinRoom(home.mapId, { town: true }), 30000, "回主城");
      if (err) throw new Error(`回不了主城（${err}）`);
      await waitFor(() => S.town, 20000);
      await sleep(1500);
      return;
    }
    if (gsk) { await gatherTick(cfg, gsk); return; }
    if (ch.gat) { await timed(g.net.request({ op: "gather", skill: 0 }), 20000, "停止採集"); await sleep(1000); return; } // 改練製作：先停採集
    if (ch.mk) { lifeState = "製作中（等這一批做完）"; return; }
    const remaining = cfg.count > 0 ? cfg.count - lifeMade : Infinity;
    const doneText = () => `完成：做了 ${lifeMade} 件${cfg.useUp ? "，身上原料能做的都做完了" : ""}`;
    if (remaining <= 0 && !cfg.useUp) {
      lifeState = doneText();
      if (!lifeDoneLogged) { lifeDoneLogged = true; log(`生活技能：${lifeState}`); }
      return;
    }
    const town = townInfo(S.mapId) || home;
    const opts = { life: ch.life, chain: !!cfg.chain, buy: !!cfg.buy, hasTool: hasToolKind,
      canBuy: (no) => !!shopFor(no, town), canBuyTool: (kind) => toolFor(kind, town) !== null };
    const have = bagCounts();
    const candidates = cfg.mode === "best" ? LP.bestOrder(cfg.skill, ch.life) : [LP.byNo.get(cfg.recipe)].filter(Boolean);
    if (!candidates.length) throw new Error(cfg.mode === "best" ? "這個技能現在沒有能做的配方" : "找不到指定的配方");
    if (cfg.mode !== "best" && !LP.unlocked(candidates[0], ch.life)) throw new Error(`技能等級不夠（要 ${candidates[0].min} 級）`);
    let chosen = null, batch = 0, useOpts = opts, extra = false;
    // 儘量用光身上原料（使用者 2026-11-23）：先只用背包現有的（不買），目標配方做不了就改做這個技能其他做得出來的（等級高的先）；
    // 指定數量做完也繼續，直到背包裡的原料什麼都做不出來為止。現有的都用不上了才照「自動購買」去買。
    if (cfg.useUp) {
      const noBuy = { ...opts, buy: false };
      const others = LP.bestOrder(cfg.skill, ch.life).filter((r) => !candidates.includes(r));
      const pool = remaining > 0 ? [...candidates, ...others] : LP.bestOrder(cfg.skill, ch.life);
      for (const r of pool) {
        const main = remaining > 0 && candidates.includes(r);
        const n = LP.maxCount(r, have, noBuy, main ? Math.min(remaining, 20) : 20);
        if (n > 0) { chosen = r; batch = n; useOpts = noBuy; extra = !main; break; }
      }
      if (!chosen && remaining <= 0) {
        lifeState = doneText();
        if (!lifeDoneLogged) { lifeDoneLogged = true; log(`生活技能：${lifeState}`); }
        return;
      }
    }
    if (!chosen) for (const r of candidates) {
      batch = LP.maxCount(r, have, opts, Math.min(remaining, 20));
      if (batch > 0) { chosen = r; break; }
    }
    if (!chosen) {
      const p = LP.plan(candidates[0], 1, have, opts);
      const lack = p.noTool ? `工具「${codex.toolNames[p.noTool] || p.noTool}」` : p.missing.map((m) => `${(g.item(m.itemNo) || {}).name || m.itemNo} ${m.amount}`).join("、");
      lifeError = `材料不夠：缺 ${lack}${cfg.buy ? "（主城買不到）" : "（可以勾「自動購買不足的材料」）"}`;
      lifeState = lifeError;
      log(`生活技能：${lifeError}，1 分鐘後再看`, "warn");
      nextLifeAt = Date.now() + 60000;
      return;
    }
    lifeError = "";
    lifeDoneLogged = false;
    const p = LP.plan(chosen, batch, have, useOpts);
    for (const kind of p.tools) {
      const no = toolFor(kind, town);
      lifeState = `買工具「${codex.toolNames[kind] || kind}」`;
      await buyItem(no, (bagCounts()[no] || 0) + 1, town);
    }
    for (const [no, qty] of Object.entries(p.buys)) {
      lifeState = `買材料 ${(g.item(Number(no)) || {}).name || no}`;
      await buyItem(Number(no), (have[no] || 0) + qty, town);
    }
    const step = p.steps[0];
    const made = await craftRun(step.recipe, step.count);
    if (step.recipe.no === chosen.no && !extra) { lifeMade += made; saveLifeProgress(); }
    lifeState = step.recipe.no !== chosen.no ? "做好中間材料，繼續" : extra ? `用光原料：做了 ${(g.item(chosen.itemNo) || {}).name || chosen.itemNo}` :
      `已做 ${lifeMade} 件${cfg.count > 0 ? ` / ${cfg.count}` : ""}`;
  }

  /** 回練功地圖，自動戰鬥恢復成 autoMode（離開練功圖前的樣子）。 */
  async function backToHunt(target, autoMode, what) {
    const g = G();
    // 組隊中：回隊伍的房間；隊員還沒有隊伍房間就留在主城等隊長
    const dest = teamDest();
    if (dest) {
      await humanPause();
      try {
        await joinTeamRoom(dest, autoMode, what);
        await walkBackToSpot(autoMode);
        return;
      } catch (e) {
        if (TEAM || !target) throw e;
        log(`${what}：${errText(e)}，改回「${target.name}」`, "warn"); // 不是桌寵組隊、隊伍的房間又進不去：照一般回練功圖
      }
    } else {
      if (TEAM && TEAM.role === "member") { log(`${what}，組隊中：留在主城等 ${TEAM.leader}`); return; }
      if (LIFE_ON) { log(`${what}，練生活技能中：留在主城`); return; }
      if (!target) { log(`${what}，不知道要回哪張練功地圖，先停在主城`, "warn"); return; }
      await humanPause();
    }
    const err2 = await timed(g.joinRoom(target.id, {}), 30000, "回狩獵地圖");
    if (err2) throw new Error(`回不了狩獵地圖「${target.name}」（${err2}）`);
    if (!(await waitFor(() => !S.town && S.mapId === target.id, 20000))) throw new Error(`等太久還沒進到狩獵地圖「${target.name}」`);
    await sleep(1000);
    restoreAuto(autoMode);
    log(`${what}，回到「${target.name}」繼續打`);
    await walkBackToSpot(autoMode);
  }

  // ---------- 練功圖裡走位：復活後走回倒下的地方、指定怪物 ----------
  // 2026-11-22 在主帳號實測遊戲指令：
  //   move{x,y}：伺服器自己找路走過去（遠的也行），自動戰鬥暫時變 manual，走到後約 3 秒自己恢復自動戰鬥
  //   seek{no}：小地圖下方「怪物」選單用的，走到最近一隻這種怪、用普攻開打（manual，打死後約 3 秒恢復自動）
  //   setAuto{locked:false}：manual 中送出就馬上回到自動戰鬥、目標不變，會照快捷欄設定放技能
  // auto.mode：auto＝自動戰鬥開著；locked＝玩家關掉自動戰鬥；manual＝自己操作中（過一下會自己恢復）。
  // 實體陣列：[id, 種類(1＝怪物), x, y, 方向, hp, maxHp, 外觀, 動作, 等級, …, 怪物編號(12)]
  const SPOT_NEAR = 4, MOB_NEAR = 6, SPOT_MAX_MS = 3 * 60 * 1000, SPOT_TTL_MS = 30 * 60 * 1000;
  let pendingSpot = null; // 復活時記下要走回去的地方，回到練功圖後才走
  let walking = false;
  const cheb = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  const autoOn = () => G().net.post({ op: "setAuto", locked: false });
  function liveMonsters() {
    const w = G().world;
    const out = [];
    if (!w || !w.entities) return out;
    for (const e of w.entities.values()) if (Array.isArray(e) && e[1] === 1 && e[5] > 0) out.push(e);
    return out;
  }
  /** 現在的戰鬥目標（活著的怪），沒有就 null。 */
  function currentTarget() {
    const w = G().world;
    const id = w && w.control && w.control[1];
    const e = id && w.entities.get(id);
    return Array.isArray(e) && e[1] === 1 && e[5] > 0 ? e : null;
  }
  /** 復活回到倒下的那張練功圖後，走回倒下的地方附近；路上看到怪就先開自動戰鬥打（會放技能），打完再走。 */
  async function walkBackToSpot(autoMode) {
    const spot = pendingSpot;
    pendingSpot = null;
    if (!spot || S.mapId !== spot.mapId || S.town || Date.now() - spot.at > SPOT_TTL_MS) return;
    const g = G();
    if (!g.world || !g.selfPos) return;
    if ((autoMode || (g.state().auto || {}).mode) === "locked") return; // 玩家關著自動戰鬥：不幫他走
    const here = g.selfPos();
    if (!here || cheb(here, [spot.x, spot.y]) <= SPOT_NEAR) return;
    log(`走回倒下的地方附近（${spot.x}, ${spot.y}），路上看到怪就先打`);
    walking = true;
    try {
      const end = Date.now() + SPOT_MAX_MS;
      let lastMove = 0, lastPos = null, stillSince = Date.now();
      while (Date.now() < end) {
        if (S.dead || S.town || S.mapId !== spot.mapId || S.status !== "ingame") return;
        const me = g.selfPos();
        if (!me) return;
        if (cheb(me, [spot.x, spot.y]) <= SPOT_NEAR) { log("已走到倒下的地方附近，繼續打"); break; }
        if (!lastPos || cheb(me, lastPos) > 0) { lastPos = me; stillSince = Date.now(); }
        const mode = (g.state().auto || {}).mode;
        const near = liveMonsters().some((e) => cheb(me, [e[2], e[3]]) <= MOB_NEAR);
        const tgt = currentTarget();
        if (near || (mode === "auto" && tgt && cheb(me, [tgt[2], tgt[3]]) <= MOB_NEAR)) {
          if (mode !== "auto") autoOn(); // 看到怪：馬上開自動戰鬥（放技能）
        } else if (mode === "auto" || Date.now() - stillSince > 3000 || Date.now() - lastMove > 8000) {
          g.net.post({ op: "move", x: spot.x, y: spot.y });
          lastMove = Date.now();
          stillSince = Date.now();
        }
        await sleep(1000);
      }
      if (Date.now() >= end) log("走回倒下的地方太久了，就地繼續打", "warn");
    } finally {
      walking = false;
      try { if ((g.state().auto || {}).mode === "manual") autoOn(); } catch {}
    }
  }

  // 指定怪物（自動補給設定裡選的；只在那隻怪出現的地圖生效）：
  //   目標不是指定的怪、身邊 MOB_NEAR 格內也沒有正在打的 → 用遊戲「怪物」選單的 seek 走過去；走到旁邊就開回自動戰鬥（放技能）。
  //   被別的怪貼身（目前目標在 3 格內）就先照自動戰鬥打掉再找（使用者 2026-11-22 選「先打身邊的再找」）。
  let lastSeekAt = 0, seekMissUntil = 0, seekNo = 0, seekPending = false;
  function mobTick() {
    // 組隊練功有指定怪物就用組隊的（只在組隊那張圖），不然用自動補給設定裡的
    const sup = TEAM && TEAM.mob ? { huntMob: TEAM.mob, huntMobMap: TEAM.mapId || "" } : AUTO && AUTO.supply;
    const no = sup && sup.huntMob;
    const g = G();
    const mode = g && g.state && (g.state().auto || {}).mode;
    const me = g && g.world && g.selfPos && g.selfPos();
    if (!no || busy || walking || watching || S.dead || S.town || S.status !== "ingame" || !me || !g.net || (g.net.supports && !g.net.supports("seek")) ||
      (sup.huntMobMap && sup.huntMobMap !== S.mapId) || mode === "locked") { // locked＝玩家關掉自動戰鬥
      seekPending = false; // 中斷過就重新算
      return;
    }
    if (no !== seekNo) { seekNo = no; seekMissUntil = 0; seekPending = false; }
    const now = Date.now();
    const tgt = currentTarget();
    if (tgt && tgt[12] === no) {
      seekPending = false;
      if (mode === "manual" && cheb(me, [tgt[2], tgt[3]]) <= 3) autoOn();
      return;
    }
    if (seekPending) {
      if (now - lastSeekAt < 8000) return; // 還在走過去
      // 8 秒都沒對上這種怪：大概這附近沒有，20 秒後再找，中間照自動戰鬥打
      seekPending = false;
      seekMissUntil = now + 20000;
      if (mode === "manual") autoOn();
      return;
    }
    if (tgt && cheb(me, [tgt[2], tgt[3]]) <= 3) return; // 先打身邊的
    if (now < seekMissUntil || now - lastSeekAt < 3000) return;
    g.net.post({ op: "seek", no });
    lastSeekAt = now;
    seekPending = true;
  }
  setInterval(() => { try { mobTick(); } catch {} }, 1500);
  /** 設定視窗顯示用：指定怪物現在在做什麼。 */
  function mobState() {
    const sup = TEAM && TEAM.mob ? { huntMob: TEAM.mob, huntMobMap: TEAM.mapId || "" } : AUTO && AUTO.supply;
    if (!sup || !sup.huntMob) return "";
    if (walking) return "走回倒下的地方中";
    if (watching) return "遊戲視窗開著，暫停找怪";
    if (S.dead || S.town || S.status !== "ingame") return "不在練功圖，回到練功圖後開始找";
    if (sup.huntMobMap && sup.huntMobMap !== S.mapId) return "不在指定怪物的地圖，照一般自動戰鬥";
    try {
      const g = G();
      if ((g.state().auto || {}).mode === "locked") return "自動戰鬥關著，不找怪";
      const tgt = currentTarget();
      if (tgt && tgt[12] === sup.huntMob) return "正在打指定的怪";
      if (Date.now() < seekMissUntil) return "附近找不到指定的怪，稍後再找（先打身邊的）";
      if (seekPending) return "走去找指定的怪";
      return tgt ? "先打身邊的怪" : "找怪中";
    } catch { return ""; }
  }

  async function supplyRun(cfg, opts = {}) {
    const g = G();
    let town = townInfo(cfg.town);
    if (!town) throw new Error("設定的主城不在遊戲的主城清單裡");
    const target = huntTarget(cfg);
    const back = target.id, backName = target.name;
    const autoMode = opts.autoMode || supplyResumeMode || (g.state().auto && g.state().auto.mode);
    supplyResumeMode = autoMode;
    const enterTown = async (t, why) => {
      if (S.town && S.mapId === t.mapId) return; // 已經在這個主城（例如剛復活）就不用再進一次
      log(`補給：${why}「${t.name}」買東西`);
      const err = await timed(g.joinRoom(t.mapId, { town: true }), 30000, "回主城");
      if (err) throw new Error(`回不了主城「${t.name}」（${err}）`);
      if (!(await waitFor(() => S.town && S.mapId === t.mapId, 20000))) throw new Error(`等太久還沒進到主城「${t.name}」`);
      await sleep(1500);
    };
    await enterTown(town, "回");
    // 有自動販售規則：先賣掉要賣的（空出背包、拿到金幣再買藥）
    if (AUTO && AUTO.sellRules && AUTO.sellRules.length) { try { await sellHere(AUTO.sell || {}, town); } catch (e) { log(`販售沒有完成：${errText(e)}`, "warn"); } }
    // 商人被擋住、走位後還是走不到：傳送到其他有賣這間店東西、傳送得過去的主城買（使用者 2026-11-22）
    const tried = new Set([town.mapId]);
    const buyAnywhere = async (plan, units, what) => {
      for (;;) {
        try {
          return await buy(plan, units, what);
        } catch (e) {
          if (!e || !e.unreachable) throw e;
          closeShop();
          const own = S.nation;
          const others = (g.towns || []).map((t) => townInfo(t.mapId)).filter((t) => t && !tried.has(t.mapId) && t.shops.has(plan.shop))
            .sort((a, b) => Number(b.nation === own) - Number(a.nation === own)); // 自己國家的主城先試
          let moved = false;
          if (others.length) log(`補給：${errText(e)}，改去別的主城`, "warn");
          for (const t of others) {
            tried.add(t.mapId);
            try {
              await enterTown(t, "傳送到");
              town = t;
              moved = true;
              break;
            } catch (e2) {
              log(`補給：${errText(e2)}，再換一個`, "warn");
            }
          }
          if (!moved) throw new Error(`${errText(e)}，其他主城也去不了，這次沒有買`);
        }
      }
    };
    const c = S.character || {};
    // 指定種類只計算並購買該種；未指定時保留遊戲快速補給的選法。
    const before = invNow();
    if (!before) throw new Error("背包資料尚未載入，沒有購買藥水");
    const order = [["hp", cfg.hpTo, c.maxHp, "紅水"], ["mp", cfg.mpTo, c.maxMp, "藍水"]];
    const priority = kind => {
      const n = potionCount(cfg, before, kind), min = cfg[`${kind}Min`] || 0;
      return min > 0 && n < min ? (n === 0 ? 0 : 1) : 2;
    };
    order.sort((a, b) => priority(a[0]) - priority(b[0]));
    for (const [kind, to, max, name] of order) {
      if (!(to > 0)) continue;
      // 遊戲一次最多只能買 99 份（buyLimit），設 300 瓶就要分好幾次買，直到身上的數量到設定值
      for (let round = 0; round < 30; round++) {
        const inv = invNow();
        if (!inv) throw new Error("背包資料尚未載入，沒有購買藥水");
        const have = potionCount(cfg, inv, kind);
        const selected = potions.selection(kind, cfg[`${kind}Item`]);
        let plan, title = name;
        if (selected) {
          title = potions.name(kind, selected);
          plan = potions.plan(g, inv, selected, to, (S.character || {}).gold || 0, town.shops);
          if (plan.status === "enough") break;
          if (plan.status === "unavailable") { log(`補給：這一版遊戲無法讀取指定藥水的商店資料，沒有購買${title}`, "warn"); break; }
          if (plan.status === "not-sold") { log(`補給：「${town.name}」沒有販售${title}，請換主城或藥水種類`, "warn"); break; }
          if (plan.status === "no-gold") { if (!round) log(`補給：金幣不夠買${title}`, "warn"); break; }
        } else {
          plan = g.quickPotion(inv, (S.character || {}).gold || 0, to, g.potionKinds[kind === "hp" ? 2 : 3], max || 1);
          if (plan === g.potionKinds[4]) { if (!round) log(`補給：金幣不夠買${name}`, "warn"); break; }
          if (!plan) break; // 已經夠了
          if (!town.shops.has(plan.shop)) { log(`補給：「${town.name}」沒有賣這種${name}的店，換一個主城試試`, "warn"); break; }
        }
        const bought = await buyAnywhere(plan, plan.units, `${title} ${plan.units} 份`);
        if (!bought) break;
        // 等背包數量更新再算下一次要買多少；數量沒變（伺服器沒給）就不再重複買
        if (!(await waitFor(() => { const b = invNow(); return b && potionCount(cfg, b, kind) > have; }, 5000))) break;
      }
    }
    // 彈藥
    const inv = invNow();
    const ammo = ammoCount(inv);
    if (ammo && cfg.ammoTo > ammo.n) {
      const gold = ((S.character || {}).gold || 0) * 2; // 遊戲自己算的時候只花一半的錢，傳兩倍進去等於可以花全部
      let plan, units;
      if (ammo.kind === "arrow") {
        plan = g.quickArrow(inv, gold, true);
        units = plan && plan !== g.potionKinds[4] ? plan.units : 0;
      } else if (g.quickThrown && g.unitOf) {
        // 遊戲的函式只在「一個都沒有」時才回答要買什麼，先假裝身上那疊是 0 個問它，數量自己照設定算
        const fake = { ...inv, equip: inv.equip.map((s, i) => (i === ammo.slot ? [s[0], 0] : s)) };
        plan = g.quickThrown(fake, gold);
        const per = plan && plan !== g.potionKinds[4] ? (g.unitOf(plan.itemNo) || {}).count || 1 : 1;
        units = plan && plan !== g.potionKinds[4] ? Math.min(plan.units, Math.ceil((cfg.ammoTo - ammo.n) / per)) : 0;
      }
      if (plan === g.potionKinds[4]) log(`補給：金幣不夠買${ammo.name}`, "warn");
      else if (plan && !town.shops.has(plan.shop)) log(`補給：「${town.name}」沒有賣${ammo.name}的店`, "warn");
      else if (plan) await buyAnywhere(plan, units, `${ammo.name} ${units} 份`);
    }
    closeShop();
    // 沒買到足以越過門檻的藥水就先留在主城，避免空手回去又倒下。
    if (!(await waitFor(() => { const bag = invNow(); return bag && !lacking(cfg, bag).length; }, 3000))) {
      throw new Error(`補給後仍不足：${lacking(cfg, invNow()).join("、")}，先留在主城等待補給`);
    }
    // 回指定地圖或最後狩獵區，自動戰鬥恢復成原本的樣子。
    // 練功圖和主城可能是同一張地圖（例如雷諾市練功房和雷諾斯市主城都是 RENES_C，差在進的是不是主城），所以不比地圖名稱，一律回去
    if (back) await backToHunt({ id: back, name: backName }, autoMode, opts.doneText || "補給完成");
    supplyResumeMode = undefined;
  }

  // ---------- 自動復活 ----------
  // 跟玩家按「回主城」「念咒語復活」一樣（2026-11-21 實錄）：
  //   回主城＝joinRoom(主城, {town:true})；念咒語＝在聊天送出原版龍族的復活咒語，伺服器回血量約七成、魔力 0、事件 [7, 自己]。
  const REVIVE_WORDS = "以宇宙和大風暴的艾德布洛伊之名";
  const REVIVE_NEED = ["joinRoom", "net", "state", "towns"];
  const DEATH_LIMIT = 3, DEATH_WINDOW_MS = 10 * 60 * 1000;
  const REVIVE_REST_MS = 30 * 60 * 1000;
  let autoBeforeDeath; // 倒下前的自動戰鬥模式（倒下後遊戲可能自己關掉）
  // 一直送死：先在主城休息到這個時間（倒下照樣復活，只是不回練功區、組隊也不跟），時間到自己回去（使用者 2026-11-23：
  // 原本停住後組隊又把角色帶回去，再倒下就不復活，躺了一整晚）
  let reviveHoldUntil = 0;
  const reviveHolding = () => Date.now() < reviveHoldUntil;

  async function reviveRun(rcfg, scfg) {
    const g = G();
    const own = (g.towns || []).find((t) => t.nation === S.nation);
    const town = (scfg?.town && townInfo(scfg.town)) || (own && townInfo(own.mapId));
    if (!town) throw new Error("找不到要回去復活的主城");
    let target;
    try { target = huntTarget(scfg); } catch {}
    const autoMode = autoBeforeDeath;
    // 復活回到同一張練功圖後要不要走回倒下的地方（設定預設開著）
    // 組隊練功時照組隊頁的勾選，不然照自動復活設定
    const wantSpot = TEAM && typeof TEAM.spot === "boolean" ? TEAM.spot : rcfg.spot !== false;
    pendingSpot = wantSpot && deathSpot && Date.now() - deathSpot.at < SPOT_TTL_MS ? deathSpot : null;
    log(`倒下了：回「${town.name}」念咒語復活`);
    if (!(S.town && S.mapId === town.mapId)) {
      const err = await timed(g.joinRoom(town.mapId, { town: true }), 30000, "回主城");
      if (err) throw new Error(`回不了主城（${err}）`);
      if (!(await waitFor(() => S.town && S.mapId === town.mapId, 20000))) throw new Error("等太久還沒進到主城");
      await sleep(1500);
    }
    await humanPause();
    // 念咒語；還在倒數（REVIVE_WAIT）的話等一下再念，最多試 6 次
    for (let i = 0; i < 6 && S.dead; i++) {
      g.net.post({ op: "chat", text: REVIVE_WORDS });
      if (await waitFor(() => !S.dead, 5000)) break;
    }
    if (S.dead) throw new Error("念了咒語還是沒有復活");
    log("復活了");
    await sleep(1000);
    if (PAUSED) { log("復活：停止練功中，留在主城"); return; }
    if (reviveHolding()) { log("復活：休息中，留在主城"); return; }
    const recent = deathTimes.filter((t) => Date.now() - t < DEATH_WINDOW_MS);
    if (recent.length >= DEATH_LIMIT) {
      reviveHoldUntil = Date.now() + REVIVE_REST_MS;
      deathTimes.length = 0; // 休息完重新算
      log(`復活：10 分鐘內倒下 ${recent.length} 次，先在主城休息 30 分鐘再回去（按「停止練功」再「開始練功」可以馬上回去）`, "warn");
      return;
    }
    const wantSupply = rcfg.supply && scfg && (scfg.hpTo > 0 || scfg.mpTo > 0 || scfg.ammoTo > 0);
    if (wantSupply) {
      // 補給的主城沒指定時就在復活的這個主城買
      await supplyRun({ ...scfg, town: scfg.town || town.mapId }, { autoMode, doneText: "復活、補給完成" });
    } else if (target || teamDest() || (TEAM && TEAM.role === "member")) await backToHunt(target, autoMode, "復活完成");
    else log("復活：不知道要回哪張練功地圖，先停在主城（在設定裡指定練功地圖就會自動回去）", "warn");
  }

  /** 停止練功：回主城（補給設定的主城，沒設就本國主城）待著；只做一次，之後玩家自己出城不再拉回。 */
  async function pauseRun() {
    pauseTownDone = true;
    if (S.town) { log("停止練功：留在主城"); return; }
    const g = G(), sup = AUTO && AUTO.supply;
    const own = (g.towns || []).find((t) => t.nation === S.nation);
    const town = (sup && sup.town && townInfo(sup.town)) || (own && townInfo(own.mapId));
    if (!town) { restoreAuto("locked"); log("停止練功：找不到主城，先關掉自動戰鬥", "warn"); return; }
    log(`停止練功：回「${town.name}」休息`);
    try {
      const err = await timed(g.joinRoom(town.mapId, { town: true }), 30000, "回主城");
      if (err) throw new Error(err);
    } catch (e) {
      restoreAuto("locked");
      log(`停止練功：回不了主城（${errText(e)}），先關掉自動戰鬥`, "warn");
    }
  }
  /** 開始練功（或休息完）：在主城就回練功區／隊伍的房間，自動戰鬥打開；已經在外面就只把自動戰鬥打開。 */
  async function resumeRun() {
    resumePending = false;
    if (!S.town) { restoreAuto("auto"); log("開始練功：開啟自動戰鬥"); return; }
    let target = null;
    try { target = huntTarget(AUTO && AUTO.supply); } catch {}
    if (TEAM) { nextTeamAt = 0; log("開始練功：照組隊回隊伍"); return; } // 組隊的進出交給 teamTick
    try { await backToHunt(target, "auto", "開始練功"); }
    catch (e) { log(`開始練功沒有完成：${errText(e)}。1 分鐘後再試`, "warn"); resumePending = true; resumeAt = Date.now() + 60000; }
  }

  /** 不組隊自己打：離開遊戲裡的隊伍，去指定的練功地圖（一般房間）開自動戰鬥；指定怪物由 mobTick 照自動補給設定的 huntMob 找。 */
  let goHuntDone = 0, goHuntAt = 0;
  async function goHuntRun(job) {
    const g = G();
    reviveHoldUntil = 0;
    resumePending = false;
    try {
      if (partyNow()) {
        await partyReq({ act: "leave" });
        if (AUTO.teamLeave) teamLeaveDone = AUTO.teamLeave;
        log("自己打：已離開隊伍");
      }
      const target = huntTarget({ huntMap: job.mapId });
      if (S.town || S.mapId !== target.id) { // 已經在這張圖就不換房間
        const err = await timed(g.joinRoom(target.id, {}), 30000, "去練功地圖");
        if (err) throw new Error(`進不了「${target.name}」（${err}）`);
        if (!(await waitFor(() => !S.town && S.mapId === target.id, 20000))) throw new Error(`等太久還沒進到「${target.name}」`);
        await sleep(1000);
      }
      restoreAuto("auto");
      goHuntDone = job.id;
      log(`自己打：到「${target.name}」開打`);
    } catch (e) {
      log(`自己打沒有完成：${errText(e)}。30 秒後再試`, "warn");
      goHuntAt = Date.now() + 30000;
    }
  }

  async function fuseTier(tier, cfg) {
    const g = G();
    const allowed = () => {
      const inv = invNow();
      if (!inv) return { bag: [], slots: [] };
      const tracked = g.tracked(g.state().character && g.state().character.id) || [];
      const skip = g.fuseExclude(inv.bag, tracked, tier);
      return { bag: inv.bag, slots: g.fuseCandidates(inv.bag, tier).filter((i) => !skip.has(i)) };
    };
    let { bag, slots } = allowed();
    if (slots.length < Math.max(5, cfg.count || 5)) return;
    let ok = 0, fail = 0;
    log(`合成（${TIER_NAMES[tier]}）：可合的裝備 ${slots.length} 件，開始合成`);
    while (slots.length >= 5) {
      const pick = g.fusePick(bag, tier, new Set(slots), g.rng);
      if (!pick) break;
      const r = await timed(g.fuse(pick.from, pick.use), 30000, "合成");
      if (r && r.error) { log(`合成（${TIER_NAMES[tier]}）停止：${r.error}`, "warn"); break; }
      r && r.success ? ok++ : fail++;
      await sleep(1500);
      ({ bag, slots } = allowed());
    }
    if (ok + fail) log(`合成（${TIER_NAMES[tier]}）完成：成功 ${ok} 次、失敗 ${fail} 次`, ok ? "good" : "info");
  }

  // ---------- 自動配點 ----------
  // 有可分配點數就照設定的比例分：每一點給「目前最落後比例」的能力（stat-alloc.js），
  // 用遊戲「能力」頁按「分配」送的同一個 allocate（add＝照能力順序每格加幾點）。
  const codex = window.RajaCodex, statAlloc = window.RajaStatAlloc;
  let nextAllocAt = 0;
  /** 遊戲狀態裡的角色：能力 ab（照 codex.statKeys 順序）、可分配點數 point、職業 classId、轉職階段 ds。 */
  const charNow = () => { try { return G().state().character || null; } catch { return null; } };
  async function allocRun(cfg) {
    const g = G(), ch = charNow();
    if (!g || !g.net || !codex || !statAlloc || !ch || !Array.isArray(ch.ab) || !(ch.point > 0)) return;
    const item = cfg.target && codex.items.find((i) => i.no === cfg.target.itemNo);
    const { add } = statAlloc.planWithTarget(codex, ch, item, cfg.ratio, cfg.enabled);
    const total = add.reduce((a, b) => a + b, 0);
    if (!total) { nextAllocAt = Date.now() + 60000; return; } // 目標已達成（等主程式清掉）、或有比例的能力都到上限了
    await sleep(randMs(1000, 3000));
    try {
      const r = await timed(g.net.request({ op: "allocate", add }), 30000, "配點");
      if (r && r.error) throw new Error(errText(r.error));
      log(`配點${item ? `（目標：${item.name}）` : ""}：${statAlloc.describe(codex, add)}`);
      nextAllocAt = Date.now() + 10000; // 等遊戲把新的能力值送回來再看下一次
    } catch (e) {
      log(`配點沒有完成：${errText(e)}。5 分鐘後再試`, "warn");
      nextAllocAt = Date.now() + 300000;
    }
  }

  let nextReviveAt = 0;
  setInterval(async () => {
    // 記下還活著時的自動戰鬥模式，復活回去後照這個恢復
    if (!S.dead) try { autoBeforeDeath = (G() && G().state && G().state().auto && G().state().auto.mode) || autoBeforeDeath; } catch {}
    if (busy || !AUTO || S.status !== "ingame") return;
    // 遊戲視窗開著（玩家在看）時補給、合成先停，但倒下了照樣自動復活（使用者 2026-11-21：看著弓手倒下卻沒復活）
    const rev = AUTO.revive;
    // 倒下就復活（休息中、停止練功中也一樣，只是復活後留在主城）
    const reviveNow = rev && rev.enabled && S.dead && Date.now() >= nextReviveAt && has(REVIVE_NEED);
    // 休息時間到了：回去繼續打（跟按「開始練功」一樣）
    if (reviveHoldUntil && !reviveHolding()) { reviveHoldUntil = 0; if (!PAUSED) { resumePending = true; log("復活：休息 30 分鐘了，回去繼續打"); } }
    // 停止練功、開始練功、休息中都是玩家看著遊戲時也要照做的（按鈕就在遊戲視窗上）
    const pauseNow = PAUSED && !pauseTownDone && !S.dead && has(REVIVE_NEED);
    const resumeNow = !PAUSED && resumePending && Date.now() >= resumeAt && !S.dead && !reviveHolding() && has(REVIVE_NEED);
    // 不組隊自己打（組隊練功頁的按鈕）：玩家下的指令，看著遊戲也照做
    const goNow = !!(AUTO.goHunt && AUTO.goHunt.id && AUTO.goHunt.id !== goHuntDone) && !S.dead && Date.now() >= goHuntAt && has(REVIVE_NEED);
    const resting = PAUSED || reviveHolding();
    // 組隊、指定交易是玩家下的指令：遊戲視窗開著也照做（使用者 2026-11-22：看著遊戲時「隊長出發」不會按）
    const teamNow = !resting && (!!TEAM || !!(AUTO.teamLeave && AUTO.teamLeave !== teamLeaveDone));
    const tradeNow = !!(TRADE && TRADE.id && !tradeDone[TRADE.id]);
    if (watching && !reviveNow && !goNow && !pauseNow && !resumeNow && !teamNow && !tradeNow) return;
    busy = true;
    try {
      if (reviveNow) {
        try {
          await reviveRun(rev, AUTO.supply || null);
        } catch (e) {
          log(`復活沒有完成：${errText(e)}。1 分鐘後再試`, "warn");
          nextReviveAt = Date.now() + 60000;
        }
        return; // 這一輪只做復活
      }
      if (goNow) { await goHuntRun(AUTO.goHunt); return; }
      if (pauseNow) { await pauseRun(); return; }
      if (resumeNow) { await resumeRun(); return; }
      if (resting) {
        // 停止練功／休息中：只照指定交易（玩家下的指令），其他自動功能（補給、組隊跟隨、販售、合成…）都先停
        if (tradeNow && !S.dead) await tradeRun(TRADE);
        return;
      }
      // 指定交易（物品欄視窗）：比補給優先，做完才繼續其他自動功能
      if (TRADE && TRADE.id && !tradeDone[TRADE.id] && !S.dead) { await tradeRun(TRADE); return; }
      if (watching) {
        // 玩家在看：只做組隊，其他自動功能（補給、販售、合成、配點、生活技能）等藏回去再做
        if (teamNow) {
          try { await teamTick(); }
          catch (e) { log(`組隊沒有完成：${errText(e)}。30 秒後再試`, "warn"); nextTeamAt = Date.now() + 30000; }
        }
        return;
      }
      const sup = AUTO.supply;
      if (sup && sup.enabled && !reviveHolding() && !S.dead && Date.now() >= nextSupplyAt && has(SUPPLY_NEED) && S.character && S.character.hp > 0) {
        const inv = invNow();
        const low = inv ? lacking(sup, inv) : [];
        if (low.length) {
          log(`補給：${low.join("、")}，低於設定`);
          try {
            await supplyRun(sup);
            supplyError = "";
            nextSupplyAt = Date.now() + 60000;
          } catch (e) {
            supplyError = errText(e);
            // 身上已經一瓶都沒有的話不能等 5 分鐘（使用者 2026-11-22：沒魔力水還一直在練功區）
            const empty = (() => { const b = invNow(); return !!b && ["hp", "mp"].some(k => sup[`${k}Min`] > 0 && potionCount(sup, b, k) === 0); })();
            const delay = /BAG_FULL|背包已滿|補給後仍不足/.test(supplyError) ? 30000 : empty ? 60000 : 300000;
            log(`補給沒有完成：${supplyError}。${delay === 30000 ? "30 秒" : delay === 60000 ? "1 分鐘" : "5 分鐘"}後再試`, "warn");
            nextSupplyAt = Date.now() + delay;
          }
        }
      }
      if (Array.isArray(AUTO.fuse) && AUTO.fuse.some((f) => f && f.enabled) && Date.now() >= nextFuseAt && has(FUSE_NEED)) {
        nextFuseAt = Date.now() + 20000;
        for (let t = 0; t < 3; t++) if (AUTO.fuse[t] && AUTO.fuse[t].enabled) await fuseTier(t, AUTO.fuse[t]);
      }
      // 組隊練功：邀請／接受／帶隊進私人房／跟上隊伍（主程式指定角色）
      if (TEAM || (AUTO.teamLeave && AUTO.teamLeave !== teamLeaveDone)) {
        try { await teamTick(); }
        catch (e) { log(`組隊沒有完成：${errText(e)}。30 秒後再試`, "warn"); nextTeamAt = Date.now() + 30000; }
      }
      // 自動販售：背包快滿就回城賣；在主城閒著就直接賣
      if (AUTO.sellRules && AUTO.sellRules.length && !S.dead && !reviveHolding()) {
        try { await sellTick(AUTO.sell || {}); sellError = ""; }
        catch (e) { sellError = errText(e); log(`販售沒有完成：${sellError}。5 分鐘後再試`, "warn"); nextSellAt = Date.now() + 300000; }
      }
      // 生活技能：在主城練（關掉時叫遊戲停止製作）
      if (lifeStopPending) {
        lifeStopPending = false;
        try { const ch = charNow(); if (ch && ch.mk) { await timed(G().net.request({ op: "craft", recipe: 0, count: 0 }), 20000, "停止製作"); log("生活技能：已停止製作"); } } catch {}
        try { const ch = charNow(); if (ch && ch.gat) { await timed(G().net.request({ op: "gather", skill: 0 }), 20000, "停止採集"); log("生活技能：已停止採集"); } } catch {}
        saveLifeProgress(true);
        lifeState = "";
      }
      if (LIFE_ON && !S.dead) {
        try { await lifeTick(AUTO.life); }
        catch (e) { lifeError = errText(e); lifeState = lifeError; log(`生活技能沒有完成：${lifeError}。1 分鐘後再試`, "warn"); nextLifeAt = Date.now() + 60000; }
      }
      // 配點：有小百科指定的目標裝備就先配到剛好能用（不管比例配點有沒有開），剩下的點數有開比例配點才照比例分
      if (AUTO.alloc && (AUTO.alloc.enabled || AUTO.alloc.target) && !S.dead && Date.now() >= nextAllocAt) await allocRun(AUTO.alloc);
    } catch (e) {
      log(`自動功能出錯：${errText(e)}`, "warn");
    } finally {
      busy = false;
    }
  }, 5000);

  // 主城清單、哪些遊戲函式接得到（設定視窗要用）
  setInterval(() => {
    const g = G();
    if (!g) return;
    const towns = (g.towns || []).map((t) => ({ mapId: t.mapId, name: t.name, nation: t.nation }));
    const auto = { towns, missing: g.missing || [], supplyOk: has(SUPPLY_NEED), fuseOk: has(FUSE_NEED), nation: S.nation };
    auto.supplyState = !AUTO?.supply?.enabled ? "自動補給未開啟" : watching ? "遊戲視窗開著，補給暫停；收起遊戲後會檢查" :
      PAUSED ? "停止練功中" : reviveHolding() ? `頻繁倒下，在主城休息（約 ${Math.ceil((reviveHoldUntil - Date.now()) / 60000)} 分鐘後回去）` : S.dead ? "倒下中，等待復活後補給" : !has(SUPPLY_NEED) ? "遊戲補給介面尚未就緒" :
      Date.now() < nextSupplyAt ? `${supplyError || "補給完成後稍候"}（約 ${Math.ceil((nextSupplyAt - Date.now()) / 1000)} 秒後檢查）` :
      busy ? "正在執行補給、復活或合成" : "每 5 秒檢查藥水，主城內也會補給";
    // 每張圖的怪物（跟遊戲小地圖下方「怪物」選單同一份：同名合併、等級範圍、首領）
    const mobsOf = (m) => {
      try { if (g.mapMonsters) return g.mapMonsters(m).monsters.map(x => ({ no: x.no, name: x.name, levelMin: x.levelMin, levelMax: x.levelMax, boss: !!x.boss })); } catch {}
      return (m.monsters || []).map(x => ({ no: x.no, name: `#${x.no}`, levelMin: x.levelMin, levelMax: x.levelMax, boss: false }));
    };
    auto.huntMaps = (g.huntMaps || []).map(m => ({ id: m.id, name: m.name, levelMin: m.levelMin, levelMax: m.levelMax, coreLevelMin: m.coreLevelMin, coreLevelMax: m.coreLevelMax, monsters: mobsOf(m) }));
    auto.mobState = mobState();
    // 目前有幾瓶、各檔可以合幾件（設定視窗顯示，方便決定數字）
    try {
      const inv = g.store && g.invView ? invNow() : null;
      if (inv && has(SUPPLY_NEED)) {
        const ammo = ammoCount(inv);
        const cfg = AUTO?.supply;
        auto.counts = { hp: potionCount(cfg, inv, "hp"), mp: potionCount(cfg, inv, "mp"), hpName: potions.name("hp", cfg?.hpItem), mpName: potions.name("mp", cfg?.mpItem), ammo: ammo ? ammo.n : null, ammoName: ammo ? ammo.name : null };
      }
      if (inv && has(FUSE_NEED)) {
        const tracked = g.tracked(g.state().character && g.state().character.id) || [];
        auto.fusable = [0, 1, 2].map((t) => {
          const skip = g.fuseExclude(inv.bag, tracked, t);
          return g.fuseCandidates(inv.bag, t).filter((i) => !skip.has(i)).length;
        });
      }
    } catch {}
    // 生活技能（生活技能視窗要用）
    try {
      const ch = charNow();
      if (ch) auto.life = { life: Array.isArray(ch.life) ? ch.life.slice() : [], mk: ch.mk || 0, mkn: ch.mkn || 0, gat: ch.gat || 0, made: lifeMade, state: lifeState, error: lifeError, have: bagCounts() };
    } catch {}
    // 物品欄、交易進度、自動販售預覽（物品欄視窗要用）
    try { auto.inv = invSummary(); } catch {}
    try {
      if (!catalogSent && S.status === "ingame") catalogSent = postCatalog();
      const p = AUTO && AUTO.sellRules && AUTO.sellRules.length ? sellPlan(AUTO.sell || {}) : null;
      auto.sell = { free: freeSlots(), count: p ? p.slots.length : 0, gold: p ? p.gold : 0, names: p ? p.names.slice(0, 12) : [], error: sellError,
        next: Date.now() < nextSellAt ? nextSellAt : 0 };
    } catch {}
    auto.trade = tradeStatus;
    // 組隊（組隊練功視窗要用）
    try {
      const party = partyNow();
      auto.party = party ? { leader: party.leader, members: party.members.map((m) => m[0]), destination: party.destination || null, here: !!party.destination && roomCode() === party.destination.code } : null;
      auto.teamState = teamState();
    } catch {}
    // 角色能力（自動配點、小百科「我能不能用」要用）
    try {
      const ch = charNow();
      if (ch && Array.isArray(ch.ab)) {
        const st = g.state();
        auto.char = { classId: ch.classId, level: ch.level, ds: ch.ds || 0, gender: ch.gender, fame: typeof ch.fame === "number" ? ch.fame : undefined,
          nation: S.nation, ab: ch.ab.slice(), point: ch.point || 0, skillLv: Array.isArray(st.tactics?.lv) ? st.tactics.lv.slice() : undefined };
      }
    } catch {}
    if (JSON.stringify(auto) !== JSON.stringify(S.auto)) {
      S.auto = auto;
      schedulePost();
    }
  }, 3000);

  // ---------- 掛機設置（桌寵右鍵「掛機設置」視窗） ----------
  // 完整照遊戲「設置」頁：一般（畫面品質、特效、音效、音樂、打擊震動、自動喝藥、優先藥水、公開裝備）、
  // 掛機自動化（原地自動戰鬥、幫隊友施法、自動修理、撿裝備、停止升級、自動賣裝、自動施放設定）。
  // 讀寫都用遊戲自己的函式（game-patch.js 接出來的），跟在遊戲裡按一樣：遊戲會自己存、在線上就送給伺服器。
  // 主程式用 executeJavaScript 呼叫 window.__rajaPetPrefs。
  const GRAPHICS = ["auto", "performance", "quality"], EFFECTS = ["auto", "high", "mid", "low"];
  const POTION_AT = [0, 30, 40, 50, 60];
  const ALLY_SUPPORT = ["self", "party", "nearby"];
  const RULE_OFF = 4, RULES = [0, 1, 2, 3, 4]; // 一直用、只打首領、HP 低於一半、身邊 2 隻怪以上、關閉
  const vol = (v) => Math.max(0, Math.min(100, Math.round(Number(v) / 5) * 5 || 0));
  function prefsSnapshot() {
    const g = G();
    if (!g) return { ready: false };
    const out = { ready: true, connected: S.status === "ingame", missing: [] };
    const get = (name, fn) => { try { out[name] = fn(); } catch { out.missing.push(name); } };
    get("graphics", () => g.graphicsStore.getState().choice);
    get("effects", () => g.effectsStore.getState().choice);
    get("sound", () => ({ on: !!g.sound.enabled, volume: g.sound.volume }));
    get("music", () => ({ on: !!g.music.musicEnabled, volume: g.music.musicVolume }));
    get("shake", () => !!g.shakeGet());
    get("potionAt", () => g.potionAtGet());
    get("potionPriority", () => { const p = g.potionPriority.getState(); return { hp: p.hpItem, mp: p.mpItem }; });
    get("potionChoices", () => ({
      hp: g.potionChoices.hp.map((t) => ({ itemNo: t.itemNo, name: t.name, heal: t.healHp })),
      mp: g.potionChoices.mp.map((t) => ({ itemNo: t.itemNo, name: t.name, heal: t.healMp })),
    }));
    get("upkeep", () => {
      const u = g.upkeepGet();
      // 遊戲 beta-v1.2.2264 起「自動幫隊友施法」開關改成「支援對象」三選一（allySupport：self／party／nearby）；舊版只有 allyCast
      const allySupport = ALLY_SUPPORT.includes(u.allySupport) ? u.allySupport : u.allyCast === false ? "self" : "party";
      return { hold: u.hold, allySupport, allySupportNew: "allySupport" in u, repair: u.repair, pickupMin: u.lootFilter?.pickupMin ?? 0, expLock: u.expLock,
        sell: u.sell, sellRarity: u.sellRarity, rules: u.rules, allyTargets: u.allyTargets };
    });
    get("quickAutoOff", () => !!g.feature("quickAutoOff"));
    get("quick", () => (g.state().combatSkills?.quick ?? []).flatMap((id, slot) => (id ? [{
      slot, id, name: g.skillName(id), icon: g.skillIcon(id) ? new URL(g.skillIcon(id), location.origin).href : null, ally: !!g.skillAlly(id),
    }] : [])));
    get("party", () => { const st = g.state(); const me = st.character?.name; return (st.party?.members ?? []).map((m) => m[0]).filter((n) => n !== me); });
    return out;
  }
  function setUpkeep(patch) {
    const g = G();
    g.upkeepSet({ ...g.upkeepGet(), ...patch });
  }
  function prefsSet(key, v) {
    const g = G();
    switch (key) {
      case "graphics": if (GRAPHICS.includes(v)) g.graphicsStore.getState().setChoice(v); break;
      case "effects": if (EFFECTS.includes(v)) g.effectsStore.getState().setChoice(v); break;
      case "soundOn": g.sound.setEnabled(!!v); break;
      case "soundVolume": g.sound.setVolume(vol(v)); break;
      case "musicOn": g.music.setMusicEnabled(!!v); break;
      case "musicVolume": g.music.setMusicVolume(vol(v)); break;
      case "shake": g.shakeSet(!!v); break;
      case "potionAt": if (POTION_AT.includes(v)) g.potionAtSet(v); break;
      case "hpItem": case "mpItem": {
        const kind = key === "hpItem" ? "hp" : "mp", n = Number(v);
        if (n === 0 || g.potionChoices[kind].some((t) => t.itemNo === n)) g.potionPrioritySet(kind, n);
        break;
      }
      case "hold": case "repair": case "expLock": case "sell": setUpkeep({ [key]: !!v }); break;
      case "allySupport": {
        if (!ALLY_SUPPORT.includes(v)) break;
        if ("allySupport" in g.upkeepGet()) setUpkeep({ allySupport: v });
        else setUpkeep({ allyCast: v !== "self" }); // 舊版遊戲：只有開／關
        break;
      }
      case "pickupMin": if ([0, 1, 2].includes(v)) setUpkeep({ lootFilter: { ...g.upkeepGet().lootFilter, pickupMin: v } }); break;
      case "sellRarity": if (Number.isInteger(v) && v >= 0 && v <= 7) setUpkeep({ sellRarity: v }); break;
      case "rule": {
        if (!v || !Number.isInteger(v.slot) || v.slot < 0 || v.slot > 11 || !RULES.includes(v.rule)) break;
        const rules = [...g.upkeepGet().rules];
        rules[v.slot] = v.rule;
        setUpkeep({ rules });
        break;
      }
      case "allRulesOff": setUpkeep({ rules: Array(12).fill(RULE_OFF) }); break;
      case "allyTarget": {
        if (!v || !Number.isInteger(v.slot) || v.slot < 0 || v.slot > 11 || typeof v.name !== "string" || v.name.length > 24) break;
        const allyTargets = [...g.upkeepGet().allyTargets];
        allyTargets[v.slot] = v.name;
        setUpkeep({ allyTargets });
        break;
      }
    }
    return prefsSnapshot();
  }
  // 公開裝備存在伺服器（不在網頁裡），要連線才讀得到
  async function shareEquipment(on) {
    const g = G();
    if (!g || S.status !== "ingame" || !g.net.supports || !g.net.supports("equipmentPrivacy")) return { available: false };
    const r = await g.net.request({ op: "profile", birthdayText: true, ...(typeof on === "boolean" ? { shareEquipment: on } : {}) });
    if (r?.op !== "profile") return { available: true, error: true };
    return { available: true, on: r.profile.shareEquipment !== false };
  }
  Object.defineProperty(window, "__rajaPetPrefs", {
    value: Object.freeze({ get: prefsSnapshot, set: prefsSet, share: shareEquipment }),
  });

  // ---------- 掛 WebSocket ----------
  const toBytes = (d) => (d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null);
  function watch(ws) {
    ws.addEventListener("message", (e) => {
      try {
        const b = toBytes(e.data);
        if (b) onMessage(decode(b)?.msg);
      } catch {
        S.errors++;
      }
    });
    ws.addEventListener("close", () => {
      if (S.status === "ingame" || S.status === "connecting") S.status = "closed";
      schedulePost();
    });
  }
  const Real = window.WebSocket;
  const Hooked = function (...args) {
    const ws = new Real(...args);
    if (String(args[0]).includes("/ws")) {
      if (S.status === "closed") S.status = "connecting";
      watch(ws);
    }
    return ws;
  };
  Hooked.prototype = Real.prototype;
  for (const k of ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]) Hooked[k] = Real[k];
  window.WebSocket = Hooked;
})();
