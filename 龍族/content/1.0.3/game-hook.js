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
          if (msg.mep.hp <= 0) S.dead = true;
          else S.dead = false;
        }
        if (Array.isArray(msg.ev)) {
          for (const ev of msg.ev) {
            if (!Array.isArray(ev) || ev[1] !== S.selfId) continue;
            if (ev[0] === 6) {
              if (!S.dead) deathTimes.push(Date.now());
              S.dead = true;
            } else if (ev[0] === 7) S.dead = false;
          }
        }
        if (msg.inv) readInv(msg.inv);
        if (Array.isArray(msg.up)) msg.up.forEach(readEntity);
        break;
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
    S.town = !!info.town;
    if (!S.town && S.mapId) S.lastHuntMap = { id: S.mapId, name: S.roomName || S.mapId };
    readMembers(info.members);
  }

  // ---------- 交給 preload ----------
  let postTimer = 0;
  function post() {
    postTimer = 0;
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
      reviveHold = false; // 玩家重新存了設定（可能換了地圖）：再給自動復活一次機會
      nextReviveAt = 0;
    }
  });

  function townInfo(mapId) {
    const t = (G().towns || []).find((x) => x.mapId === mapId);
    return t ? { mapId: t.mapId, name: t.name, shops: new Set((t.npcs || []).flatMap((n) => n.shops || [])) } : undefined;
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

  /** 用小地圖下方「NPC」清單的自動導航走到這間店（shop 編號）的商人旁邊，等遊戲把商店打開
   *  （跟玩家按 NPC 清單那一項一樣：遊戲自己找路、走過去、到了才開）。 */
  async function walkToShop(shop) {
    const g = G();
    const area = g.currentTown();
    if (!area) throw new Error("還沒進到主城，沒辦法去找商人");
    const entry = g.npcList().find((e) => e.fn.kind === "shop" && e.fn.shop === shop && e.npcIndex !== undefined);
    if (!entry) throw new Error("NPC 清單裡找不到賣這樣東西的商人");
    const index = entry.npcIndex;
    const npc = area.npcs[index];
    const fn = () => entry.fn;
    const name = String(npc.name || "").split("/")[0] || "商人";
    const isOpen = () => g.npcSheet.getState().open?.npc === npc;
    if (isOpen()) return name;
    g.npcSheet.getState().close();
    await sleep(randMs(800, 2000));
    for (let tries = 0; tries < 3; tries++) {
      g.talkNpc(index, fn(npc));
      // 遊戲自己等 5 秒＋每格 1 秒，走不到就放棄；這邊最多等 40 秒
      if (await waitFor(isOpen, 40000)) {
        log(`補給：走到「${name}」`);
        await sleep(randMs(1000, 2500)); // 打開商店後看一下再買
        return name;
      }
      if (!S.town) throw new Error("走去商人的途中離開了主城");
      await sleep(randMs(1000, 2000));
    }
    throw new Error(`走不到「${name}」旁邊，這次沒有買`);
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
        const result = await g.net.request({ op: "buy", shop: plan.shop, item: plan.itemNo, n: amount });
        if (result?.error) throw new Error(errText(result.error));
        log(`補給：買了${what.replace(/\d+ 份$/, `${amount} 份`)}`);
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

  /** 回練功地圖，自動戰鬥恢復成 autoMode（離開練功圖前的樣子）。 */
  async function backToHunt(target, autoMode, what) {
    const g = G();
    await humanPause();
    const err2 = await g.joinRoom(target.id, {});
    if (err2) throw new Error(`回不了狩獵地圖「${target.name}」（${err2}）`);
    if (!(await waitFor(() => !S.town && S.mapId === target.id, 20000))) throw new Error(`等太久還沒進到狩獵地圖「${target.name}」`);
    await sleep(1000);
    const now = g.state().auto && g.state().auto.mode;
    if (autoMode && now !== autoMode && g.toggleAuto) g.toggleAuto();
    log(`${what}，回到「${target.name}」繼續打`);
  }

  async function supplyRun(cfg, opts = {}) {
    const g = G();
    const town = townInfo(cfg.town);
    if (!town) throw new Error("設定的主城不在遊戲的主城清單裡");
    const target = huntTarget(cfg);
    const back = target.id, backName = target.name;
    const autoMode = opts.autoMode || supplyResumeMode || (g.state().auto && g.state().auto.mode);
    supplyResumeMode = autoMode;
    // 已經在這個主城（例如剛復活）就不用再進一次
    if (!(S.town && S.mapId === town.mapId)) {
      log(`補給：回「${town.name}」買東西`);
      const err = await g.joinRoom(town.mapId, { town: true });
      if (err) throw new Error(`回不了主城（${err}）`);
      if (!(await waitFor(() => S.town && S.mapId === town.mapId, 20000))) throw new Error("等太久還沒進到主城");
      await sleep(1500);
    }
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
      const inv = invNow();
      if (!inv) throw new Error("背包資料尚未載入，沒有購買藥水");
      const selected = potions.selection(kind, cfg[`${kind}Item`]);
      if (selected) {
        const title = potions.name(kind, selected);
        const plan = potions.plan(g, inv, selected, to, (S.character || {}).gold || 0, town.shops);
        if (plan.status === "enough") continue;
        if (plan.status === "unavailable") { log(`補給：這一版遊戲無法讀取指定藥水的商店資料，沒有購買${title}`, "warn"); continue; }
        if (plan.status === "not-sold") { log(`補給：「${town.name}」沒有販售${title}，請換主城或藥水種類`, "warn"); continue; }
        if (plan.status === "no-gold") { log(`補給：金幣不夠買${title}`, "warn"); continue; }
        await buy(plan, plan.units, `${title} ${plan.units} 份`);
        continue;
      }
      const plan = g.quickPotion(inv, (S.character || {}).gold || 0, to, g.potionKinds[kind === "hp" ? 2 : 3], max || 1);
      if (plan === g.potionKinds[4]) { log(`補給：金幣不夠買${name}`, "warn"); continue; }
      if (!plan) continue; // 已經夠了
      if (!town.shops.has(plan.shop)) { log(`補給：「${town.name}」沒有賣這種${name}的店，換一個主城試試`, "warn"); continue; }
      await buy(plan, plan.units, `${name} ${plan.units} 份`);
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
      else if (plan) await buy(plan, units, `${ammo.name} ${units} 份`);
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
  let autoBeforeDeath; // 倒下前的自動戰鬥模式（倒下後遊戲可能自己關掉）
  let reviveHold = false; // 一直送死：先停在主城，等玩家改設定（重新存設定會解除）

  async function reviveRun(rcfg, scfg) {
    const g = G();
    const own = (g.towns || []).find((t) => t.nation === S.nation);
    const town = (scfg?.town && townInfo(scfg.town)) || (own && townInfo(own.mapId));
    if (!town) throw new Error("找不到要回去復活的主城");
    let target;
    try { target = huntTarget(scfg); } catch {}
    const autoMode = autoBeforeDeath;
    log(`倒下了：回「${town.name}」念咒語復活`);
    if (!(S.town && S.mapId === town.mapId)) {
      const err = await g.joinRoom(town.mapId, { town: true });
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
    const recent = deathTimes.filter((t) => Date.now() - t < DEATH_WINDOW_MS);
    if (recent.length >= DEATH_LIMIT) {
      reviveHold = true;
      log(`復活：10 分鐘內倒下 ${recent.length} 次，先停在主城不回去了（調整設定或換地圖後重新儲存設定就會恢復）`, "warn");
      return;
    }
    const wantSupply = rcfg.supply && scfg && (scfg.hpTo > 0 || scfg.mpTo > 0 || scfg.ammoTo > 0);
    if (wantSupply) {
      // 補給的主城沒指定時就在復活的這個主城買
      await supplyRun({ ...scfg, town: scfg.town || town.mapId }, { autoMode, doneText: "復活、補給完成" });
    } else if (target) await backToHunt(target, autoMode, "復活完成");
    else log("復活：不知道要回哪張練功地圖，先停在主城（在設定裡指定練功地圖就會自動回去）", "warn");
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
      const r = await g.fuse(pick.from, pick.use);
      if (r && r.error) { log(`合成（${TIER_NAMES[tier]}）停止：${r.error}`, "warn"); break; }
      r && r.success ? ok++ : fail++;
      await sleep(1500);
      ({ bag, slots } = allowed());
    }
    if (ok + fail) log(`合成（${TIER_NAMES[tier]}）完成：成功 ${ok} 次、失敗 ${fail} 次`, ok ? "good" : "info");
  }

  let nextReviveAt = 0;
  setInterval(async () => {
    // 記下還活著時的自動戰鬥模式，復活回去後照這個恢復
    if (!S.dead) try { autoBeforeDeath = (G() && G().state && G().state().auto && G().state().auto.mode) || autoBeforeDeath; } catch {}
    if (busy || !AUTO || S.status !== "ingame") return;
    // 遊戲視窗開著（玩家在看）時補給、合成先停，但倒下了照樣自動復活（使用者 2026-11-21：看著弓手倒下卻沒復活）
    const rev = AUTO.revive;
    const reviveNow = rev && rev.enabled && S.dead && !reviveHold && Date.now() >= nextReviveAt && has(REVIVE_NEED);
    if (watching && !reviveNow) return;
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
      const sup = AUTO.supply;
      if (sup && sup.enabled && !reviveHold && !S.dead && Date.now() >= nextSupplyAt && has(SUPPLY_NEED) && S.character && S.character.hp > 0) {
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
            const delay = /BAG_FULL|背包已滿|補給後仍不足/.test(supplyError) ? 30000 : 300000;
            log(`補給沒有完成：${supplyError}。${delay === 30000 ? "30 秒" : "5 分鐘"}後再試`, "warn");
            nextSupplyAt = Date.now() + delay;
          }
        }
      }
      if (Array.isArray(AUTO.fuse) && AUTO.fuse.some((f) => f && f.enabled) && Date.now() >= nextFuseAt && has(FUSE_NEED)) {
        nextFuseAt = Date.now() + 20000;
        for (let t = 0; t < 3; t++) if (AUTO.fuse[t] && AUTO.fuse[t].enabled) await fuseTier(t, AUTO.fuse[t]);
      }
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
      reviveHold ? "頻繁倒下，停在主城等待調整設定" : S.dead ? "倒下中，等待復活後補給" : !has(SUPPLY_NEED) ? "遊戲補給介面尚未就緒" :
      Date.now() < nextSupplyAt ? `${supplyError || "補給完成後稍候"}（約 ${Math.ceil((nextSupplyAt - Date.now()) / 1000)} 秒後檢查）` :
      busy ? "正在執行補給、復活或合成" : "每 5 秒檢查藥水，主城內也會補給";
    auto.huntMaps = (g.huntMaps || []).map(m => ({ id: m.id, name: m.name, levelMin: m.levelMin, levelMax: m.levelMax, coreLevelMin: m.coreLevelMin, coreLevelMax: m.coreLevelMax }));
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
      return { hold: u.hold, allyCast: u.allyCast, repair: u.repair, pickupMin: u.lootFilter?.pickupMin ?? 0, expLock: u.expLock,
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
      case "hold": case "allyCast": case "repair": case "expLock": case "sell": setUpkeep({ [key]: !!v }); break;
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
