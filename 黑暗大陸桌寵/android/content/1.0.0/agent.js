// 桌寵放在遊戲頁面裡的「探子」：GameService 每隔幾秒呼叫一次 __petAgent.tick()，
// 它把遊戲現在的狀態、這段時間發生的事（給桌寵飄字用）、標題畫面上的按鈕狀態（自動登入、繼續冒險用）整理好，用 JSON 字串交回去。
//
// 跟電腦版（黑暗大陸桌寵 main.js 的 READ_STATE、diffEvents、save-reader.js）是同一套：
// 線上版遊戲是混淆過的，player 不在 window 上，所以讀遊戲自己每 20 秒寫一次的本機存檔（加密的，這裡解開，只讀不寫）。
// 地名、道具名、職業名在 window.__petNames（GameService 在塞這份之前先塞進來，內容是 names.json）。
(() => {
  if (window.__petAgent) return;

  // 遊戲的存檔 key（遊戲 config.js 的 SAVE_KEY／SLOT_KEY；save.js 的 slotKey）
  const SAVE_KEY = "dragonSlayer_save_v2";
  const SLOT_KEY = "dragonSlayer_slot";
  const MAX_LOOT_SHOWN = 4;
  const names = () => window.__petNames || { classes: {}, towns: {}, zones: {}, items: {} };

  // ── 解開存檔（照抄遊戲 guard.js 的 guardHash／guardStream／guardXor）──
  const GUARD_LS_KEY = "q7Lx!dS-2026-ark";
  function guardHash(str, seed) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
  }
  function guardStream(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    };
  }
  function parseSave(raw) {
    if (!raw) return null;
    try {
      if (raw.charAt(0) === "{") return JSON.parse(raw);
      if (raw.slice(0, 3) !== "DS1") return null;
      const nonce = raw.slice(3, 11);
      const bin = atob(raw.slice(39));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const next = guardStream(parseInt(guardHash(GUARD_LS_KEY + nonce, 3).slice(-8), 16));
      let r = 0;
      for (let i = 0; i < bytes.length; i++) {
        if ((i & 3) === 0) r = next();
        bytes[i] ^= (r >>> ((i & 3) * 8)) & 255;
      }
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) {
      return null;
    }
  }

  /** 目前角色欄位的存檔 → 桌寵要的摘要。 */
  function readSave() {
    try {
      const slot = parseInt(localStorage.getItem(SLOT_KEY), 10) || 0;
      const data = parseSave(localStorage.getItem(slot ? SAVE_KEY + "_s" + slot : SAVE_KEY));
      const p = data && data.player;
      if (!p || typeof p.lv !== "number") return undefined;
      const bag = {};
      for (const it of p.inv || []) if (it && it.id) bag[it.id] = (bag[it.id] || 0) + (Number(it.n) || 1);
      return { id: slot + ":" + (p.created || p.name), t: data.t, name: p.name, cls: p.cls, level: p.lv, exp: Number(p.exp) || 0,
        gold: Number(p.gold) || 0, loc: p.loc || {}, hunting: !!p.hunting, mapRun: !!p.mapRun, bag };
    } catch (e) {
      return undefined;
    }
  }

  /** 角色現在人在哪、在做什麼。 */
  function describePlace(s, screen) {
    if (screen && screen !== "screen-game") return { place: "標題畫面", doing: "等待進入遊戲" };
    const n = names();
    if (s.loc.type === "town") return { place: n.towns[s.loc.id] || "村莊", doing: "休息中" };
    let place = n.zones[s.loc.id] || "地圖 #" + (s.loc.id == null ? "?" : s.loc.id);
    if (s.loc.floor) place += " " + s.loc.floor + "F";
    if (s.mapRun) place = "異界地圖（" + place + "）";
    return { place, doing: s.hunting ? "掛機中" : "待機中" };
  }

  /** 比對前後兩次存檔，整理成桌寵要演出來的事件。遊戲大約 20 秒自動存一次，所以是一批一批來的。 */
  function diffEvents(prev, next) {
    const events = [];
    if (next.level > prev.level) events.push({ kind: "levelup", level: next.level });
    else if (next.exp > prev.exp) events.push({ kind: "exp", n: next.exp - prev.exp });
    if (next.gold > prev.gold) events.push({ kind: "gold", n: next.gold - prev.gold });
    let loot = 0;
    for (const itemId of Object.keys(next.bag)) {
      const gained = next.bag[itemId] - (prev.bag[itemId] || 0);
      const name = names().items[itemId];
      if (gained <= 0 || !name || loot >= MAX_LOOT_SHOWN) continue;
      events.push({ kind: "loot", n: gained, name });
      loot++;
    }
    return events;
  }

  // ── 標題畫面：自動登入、繼續冒險要看的東西 ──
  const shown = (id) => {
    const el = document.getElementById(id);
    return !!el && !el.classList.contains("hidden");
  };

  /** 遊戲這次載入的版本號（發佈版 data/game.js?v=…，開發版 data/config.js?v=…），檢查遊戲更新時比對。 */
  function version() {
    const script = document.querySelector('script[src*="data/game.js?v="], script[src*="data/config.js?v="]');
    const m = script && script.src.match(/v=([\w.-]+)/);
    return m ? m[1] : null;
  }

  let lastSave;

  function tick() {
    const out = { now: Date.now(), hasSave: false, events: [] };
    const active = document.querySelector(".screen.active");
    out.screen = active ? active.id : "";
    out.cloud = shown("btn-cloud") ? document.getElementById("btn-cloud").textContent : "";
    const msg = document.getElementById("cloud-msg");
    out.cloudMsg = msg ? msg.textContent : "";
    const layer = document.getElementById("dialog-layer");
    out.dialog = !!layer && layer.classList.contains("active");
    out.canContinue = shown("btn-continue");
    out.version = version();
    const s = readSave();
    if (!s) {
      lastSave = undefined;
      return JSON.stringify(out);
    }
    // 換角色之後第一筆只當基準，不然整個背包都會被當成「剛撿到」
    if (lastSave && lastSave.id === s.id && lastSave.t !== s.t) out.events = diffEvents(lastSave, s);
    lastSave = s;
    Object.assign(out, { hasSave: true, name: s.name, cls: s.cls, level: s.level }, describePlace(s, out.screen));
    return JSON.stringify(out);
  }

  /** 跟玩家自己在標題畫面操作一樣：按「☁️ 登入／註冊」→ 填 Email、密碼 → 按「登入」。回傳有沒有按下去。 */
  function login(email, pass) {
    const open = document.getElementById("btn-cloud");
    if (!open || open.classList.contains("hidden")) return false;
    open.click();
    const em = document.getElementById("cloud-email"), pw = document.getElementById("cloud-pass");
    if (!em || !pw) return false;
    em.value = email;
    pw.value = pass;
    const btn = [...document.querySelectorAll("#dialog-layer .dialog-btns button")].find((b) => b.textContent.trim() === "登入");
    if (!btn) return false;
    btn.click();
    return true;
  }

  /** 按標題畫面的「繼續冒險」。 */
  function pressContinue() {
    const btn = document.getElementById("btn-continue");
    if (!btn || btn.classList.contains("hidden")) return false;
    btn.click();
    return true;
  }

  // ── 下拉選單 ────────────────────────────────────────────
  // 遊戲畫面是掛在背景服務的懸浮視窗上，系統不准這種視窗跳出網頁下拉選單（<select>）的選項，點了完全沒反應。
  // 這裡把點擊攔下來，改在頁面裡自己畫一份選項清單，選好再把值填回去、通知遊戲（放置希望安卓版 0.3.6 的做法）
  const TOP_LAYER = 2147483647;
  let picker; // 開著的選項清單

  function closePicker() {
    if (picker) picker.remove();
    picker = undefined;
  }

  function pick(select, option) {
    closePicker();
    if (!select.isConnected || option.disabled || select.selectedIndex === option.index) return;
    select.selectedIndex = option.index;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function openPicker(select) {
    closePicker();
    picker = document.createElement("div");
    picker.style.cssText = `position:fixed;inset:0;z-index:${TOP_LAYER};display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.55);`;
    picker.addEventListener("click", (e) => e.target === picker && closePicker());
    const list = document.createElement("div");
    list.style.cssText = "min-width:60%;max-width:100%;max-height:70%;overflow-y:auto;background:#1f1b15;border:2px solid #8a6a3a;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.6);font:16px/1.3 sans-serif;color:#efe6d2;";
    let chosen;
    let group;
    for (const option of select.options) {
      const parent = option.parentElement;
      if (parent !== group && parent.tagName === "OPTGROUP") {
        const head = document.createElement("div");
        head.textContent = parent.label;
        head.style.cssText = "padding:8px 16px 4px;font-size:13px;color:#9d927d;";
        list.append(head);
      }
      group = parent;
      const row = document.createElement("div");
      row.textContent = option.label || option.text;
      row.style.cssText = "padding:13px 16px;border-top:1px solid #3d3427;";
      if (option.disabled) row.style.opacity = ".4";
      else row.addEventListener("click", () => pick(select, option));
      if (option.selected) {
        row.style.background = "#4a3522";
        row.style.color = "#e8c066";
        row.style.fontWeight = "bold";
        chosen = row;
      }
      list.append(row);
    }
    picker.append(list);
    document.documentElement.append(picker);
    if (chosen) chosen.scrollIntoView({ block: "center" });
  }

  const plainSelect = (e) => {
    const select = e.target && e.target.closest && e.target.closest("select");
    return select && !select.disabled && !select.multiple && select.size <= 1 ? select : undefined;
  };
  // 系統的選項是在 mousedown 的預設動作裡跳的，擋掉它；自己的清單等 click 才開，免得同一下點擊順便點到清單裡的選項
  window.addEventListener("mousedown", (e) => plainSelect(e) && e.preventDefault(), true);
  window.addEventListener("click", (e) => {
    const select = plainSelect(e);
    if (select) openPicker(select);
  }, true);

  window.__petAgent = { tick, login, pressContinue };
})();
