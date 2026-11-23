"use strict";
// 掛機設置：照遊戲「設置」頁。每個選項一按就呼叫遊戲自己的設定函式（遊戲會自己存、在線上就送給伺服器），
// 桌寵也會把這些設定記一份，下次啟動遊戲前寫回去（見 game-preload.js）。
const $ = (id) => document.getElementById(id);
const api = window.idleApi;
let snap;
let shareState;
let skillsKey = "";
let busy = false;

const GRAPHICS = [["auto", "推薦"], ["performance", "效能優先"], ["quality", "畫面優先"]];
const EFFECTS = [["auto", "推薦"], ["high", "高"], ["mid", "中"], ["low", "低"]];
const POTION_AT = [[0, "關"], [30, "30%"], [40, "40%"], [50, "50%"], [60, "60%"]];
const PICKUP = [[0, "全部"], [1, "稀有以上"], [2, "高級以上"]];
const ALLY_SUPPORT = [["self", "自己"], ["party", "隊伍"], ["nearby", "附近本國"]];
const RARITY = [[1, "普通"], [2, "稀有"], [4, "高級"]];
const RULE_OFF = 4;
const RULES = [[4, "關閉"], [0, "一直用"], [1, "只打首領"], [2, "HP 低於一半"], [3, "身邊 2 隻怪以上"]];
const RULE_NO_SUPPORT = [5, "沒人需要補助才放"]; // 遊戲 beta-v1.2.2483 起，只給攻擊魔法
const CAST_STYLES = [[0, "均衡"], [1, "補助優先"], [2, "戰鬥優先"]];
const FOLLOW_RANGES = [[4, "4 格"], [6, "6 格"], [8, "8 格"]];
let setsKey = "";

/** 送一個設定給遊戲，拿回最新的狀態重畫。 */
async function set(key, value) {
  busy = true;
  try {
    const s = await api.set(key, value);
    if (s && s.ready) render(s);
    if (s?.turnedOff?.length) skillMsg(`已自動關掉：${s.turnedOff.join("、")}`, "warn");
    else if (s?.error && (key === "quickSlot" || key === "rule")) skillMsg(`沒有成功：${s.error}`, "warn");
    return s;
  } finally {
    busy = false;
  }
}

function seg(el, choices, current, onPick) {
  if (el.childElementCount !== choices.length) {
    el.replaceChildren(...choices.map(([v, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.textContent = label;
      b.addEventListener("click", () => onPick(v));
      return b;
    }));
  }
  [...el.children].forEach((b, i) => b.setAttribute("aria-checked", String(choices[i][0] === current)));
}
function sw(el, on, onChange) {
  el.setAttribute("aria-checked", String(!!on));
  el.onclick = () => onChange(el.getAttribute("aria-checked") !== "true");
}
function slider(id, value) {
  const el = $(id);
  if (document.activeElement !== el) el.value = value;
  $(`${id}Text`).textContent = `${el.value}%`;
}
function potionSelect(el, kind, list, current) {
  const key = JSON.stringify(list);
  if (el.dataset.key !== key) {
    el.dataset.key = key;
    el.replaceChildren(new Option("自動選擇", "0"), ...list.map((t) => new Option(`${t.name} · ${t.heal}`, String(t.itemNo))));
  }
  if (document.activeElement !== el) el.value = String(current ?? 0);
}

function render(s) {
  snap = s;
  const miss = s.missing || [];
  $("status").className = s.connected ? "ok" : "warn";
  $("status").textContent = s.connected
    ? "已連上遊戲：改了馬上生效，遊戲會自己存檔並送給伺服器。"
    : "遊戲還沒連上：改了會先存在遊戲裡，連上時照這份送給伺服器。";
  if (miss.length) $("status").textContent += `（遊戲改版，讀不到：${miss.join("、")}）`;

  if (s.graphics !== undefined) seg($("graphics"), GRAPHICS, s.graphics, (v) => set("graphics", v));
  if (s.effects !== undefined) seg($("effects"), EFFECTS, s.effects, (v) => set("effects", v));
  if (s.sound) {
    sw($("soundOn"), s.sound.on, (v) => set("soundOn", v));
    $("soundVolumeRow").hidden = !s.sound.on;
    slider("soundVolume", s.sound.volume);
  }
  if (s.music) {
    sw($("musicOn"), s.music.on, (v) => set("musicOn", v));
    $("musicVolumeRow").hidden = !s.music.on;
    slider("musicVolume", s.music.volume);
  }
  if (s.shake !== undefined) sw($("shake"), s.shake, (v) => set("shake", v));
  if (s.potionAt !== undefined) seg($("potionAt"), POTION_AT, s.potionAt, (v) => set("potionAt", v));
  if (s.potionChoices && s.potionPriority) {
    potionSelect($("hpItem"), "hp", s.potionChoices.hp, s.potionPriority.hp);
    potionSelect($("mpItem"), "mp", s.potionChoices.mp, s.potionPriority.mp);
  }

  const u = s.upkeep;
  if (u) {
    for (const k of ["hold", "repair", "expLock", "sell"]) sw($(k), u[k], (v) => set(k, v));
    // 舊版遊戲沒有「附近本國」，只有開（隊伍）／關（自己）
    seg($("allySupport"), u.allySupportNew === false ? ALLY_SUPPORT.slice(0, 2) : ALLY_SUPPORT, u.allySupport, (v) => set("allySupport", v));
    seg($("pickupMin"), PICKUP, u.pickupMin, (v) => set("pickupMin", v));
    const checks = $("sellRarity");
    checks.hidden = !u.sell;
    if (checks.childElementCount !== RARITY.length) {
      checks.replaceChildren(...RARITY.map(([bit, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.addEventListener("click", () => set("sellRarity", (snap.upkeep.sellRarity ^ bit) & 7));
        return b;
      }));
    }
    [...checks.children].forEach((b, i) => {
      const on = (u.sellRarity & RARITY[i][0]) !== 0;
      b.setAttribute("aria-pressed", String(on));
      b.textContent = `${on ? "✓ " : ""}${RARITY[i][1]}`;
    });
    // 新版遊戲才有的：施法風格、跟隨隊友、技能組（舊版遊戲整區藏起來）
    for (const el of document.querySelectorAll(".newOpt")) el.hidden = !u.newOptions;
    if (u.newOptions) {
      seg($("castStyle"), CAST_STYLES, u.castStyle, (v) => set("castStyle", v));
      const party = s.party || [];
      const names = u.follow && !party.includes(u.follow) ? [...party, u.follow] : party;
      seg($("follow"), [["", "不跟隨"], ...names.map((n) => [n, n])], u.follow, (v) => set("follow", v));
      $("followHint").textContent = party.length
        ? "自動戰鬥時跟著這位隊友走（開了會關掉「原地自動戰鬥」）。隊友不在房間、倒下、離太遠會暫停，回來後繼續。"
        : "組隊後可以選隊友。自動戰鬥時跟著這位隊友走（開了會關掉「原地自動戰鬥」）。";
      $("followOpts").hidden = !u.follow;
      seg($("followRange"), FOLLOW_RANGES, u.followRange, (v) => set("followRange", v));
      sw($("followStay"), u.followStay, (v) => set("followStay", v));
      renderSkillSets(s);
    }
    renderSkills(s);
  }
}

function renderSkillSets(s) {
  const sets = s.skillSets || [];
  const key = JSON.stringify(sets);
  const box = $("skillSets");
  if (key === setsKey && box.childElementCount) return;
  if (box.contains(document.activeElement)) return; // 正在打名字：先不要重畫
  setsKey = key;
  box.replaceChildren(...Array.from({ length: 6 }, (_, i) => {
    const st = sets[i];
    const row = document.createElement("div");
    row.className = `set${st ? "" : " empty"}`;
    const name = document.createElement("input");
    name.type = "text"; name.maxLength = 24; name.className = "sname"; name.value = st ? st.name : `技能組 ${i + 1}`;
    name.style.cssText = "padding:2px 6px;border-radius:6px;border:1px solid #3a2f20;background:#17130e;color:#e9e4d8;font:inherit;width:110px";
    const skills = document.createElement("span");
    skills.className = "skills";
    skills.textContent = st ? (st.skills.length ? st.skills.join("、") : "（快捷欄是空的）") : "（空）";
    const btn = (text, fn, cls = "small") => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = text; b.addEventListener("click", fn); return b; };
    const msg = (t, ok) => { $("setMsg").textContent = t; $("setMsg").className = `hint ${ok ? "ok" : "warn"}`; };
    row.append(name, skills);
    if (st) row.append(btn("套用", async (e) => {
      e.target.disabled = true;
      const r = await set("skillSetApply", i);
      msg(r?.error ? `套用失敗：${r.error}` : `已套用「${st.name}」`, !r?.error);
      e.target.disabled = false;
    }));
    row.append(btn(st ? "存成目前的" : "把目前的存進來", async () => {
      const r = await set("skillSetSave", { index: i, name: name.value.trim() || `技能組 ${i + 1}` });
      msg(r?.error ? `存不進去：${r.error}` : `已儲存「${name.value.trim() || `技能組 ${i + 1}`}」`, !r?.error);
    }));
    if (st) row.append(btn("刪除", () => set("skillSetDelete", i)));
    return row;
  }));
}

function skillMsg(text, cls = "ok") {
  const el = $("skillMsg");
  el.textContent = text;
  el.className = `hint ${cls}`;
}

// ── 快捷欄 12 格：點一格就跳出學會的魔法／戰技，選了就放進去（使用者 2026-11-23） ──
let pickSlot = null, barKey = "";
function renderBar(s) {
  const all = s.quickAll || [];
  const byId = new Map((s.learned || []).map((l) => [l.id, l]));
  const key = JSON.stringify([all, (s.quick || []).map((q) => [q.id, q.icon])]);
  if (key === barKey) return;
  barKey = key;
  const bar = $("quickBar");
  bar.replaceChildren(...all.map((id, slot) => {
    const q = (s.quick || []).find((x) => x.slot === slot);
    const b = document.createElement("button");
    b.type = "button";
    b.className = `qslot${id ? "" : " empty"}`;
    b.title = id ? `快捷第 ${slot + 1} 格：${q?.name || byId.get(id)?.name || id}（點一下換技能）` : `快捷第 ${slot + 1} 格：空（點一下放技能）`;
    const n = document.createElement("span"); n.className = "n"; n.textContent = slot + 1;
    b.append(n);
    const ic = q?.icon || byId.get(id)?.icon;
    if (ic) { const img = document.createElement("img"); img.src = ic; img.alt = ""; b.append(img); }
    else { const t = document.createElement("span"); t.className = "t"; t.textContent = id ? (q?.name || byId.get(id)?.name || id) : "空"; b.append(t); }
    b.addEventListener("click", () => openPicker(slot));
    return b;
  }));
}
function openPicker(slot) {
  pickSlot = slot;
  const s = snap;
  const cur = (s.quickAll || [])[slot] || 0;
  $("pickTitle").textContent = `快捷第 ${slot + 1} 格：選要放的技能`;
  const order = ["攻擊", "治療", "保護", "增益", "結界", "詛咒", "其他", "戰技"];
  const list = [...(s.learned || [])].sort((a, b) => (order.indexOf(a.type) - order.indexOf(b.type)) || a.id - b.id);
  const box = $("pickList");
  const groups = new Map();
  for (const l of list) { if (!groups.has(l.type)) groups.set(l.type, []); groups.get(l.type).push(l); }
  box.replaceChildren(...[...groups].map(([type, items]) => {
    const sec = document.createElement("div");
    sec.innerHTML = `<div class="ptype">${type || "其他"}</div>`;
    const grid = document.createElement("div");
    grid.className = "pgrid";
    grid.append(...items.map((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `pitem${l.id === cur ? " cur" : ""}`;
      if (l.icon) { const img = document.createElement("img"); img.src = l.icon; img.alt = ""; b.append(img); }
      b.append(document.createTextNode(l.name));
      const inBar = (s.quickAll || []).indexOf(l.id);
      if (inBar >= 0 && inBar !== slot) { const t = document.createElement("small"); t.textContent = `（在第 ${inBar + 1} 格）`; b.append(t); }
      b.addEventListener("click", () => pick(l.id));
      return b;
    }));
    sec.append(grid);
    return sec;
  }));
  if (!list.length) box.innerHTML = '<div class="hint">還沒學會魔法或戰技（遊戲連上後才讀得到）。</div>';
  $("pickClear").disabled = !cur;
  $("picker").hidden = false;
}
async function pick(skill) {
  const slot = pickSlot;
  $("picker").hidden = true;
  if (slot === null) return;
  const r = await set("quickSlot", { slot, skill });
  if (r && !r.error) skillMsg(skill ? `已放進快捷第 ${slot + 1} 格（新放的技能先只手動施放，要掛機用請在下面開自動施放）` : `已清空快捷第 ${slot + 1} 格`);
}
$("pickClear").addEventListener("click", () => pick(0));
$("pickClose").addEventListener("click", () => ($("picker").hidden = true));
$("picker").addEventListener("click", (e) => { if (e.target === $("picker")) $("picker").hidden = true; });

function renderSkills(s) {
  renderBar(s);
  if (s.conflictsFixed?.length) skillMsg(`已自動關掉：${s.conflictsFixed.join("、")}`, "warn");
  const quick = s.quick || [];
  const u = s.upkeep;
  const offAllowed = !!s.quickAutoOff;
  const shown = (slot) => {
    const r = u.rules[slot] ?? RULE_OFF;
    return !offAllowed && r === RULE_OFF ? 0 : r;
  };
  const active = quick.filter((q) => !offAllowed || (u.rules[q.slot] ?? RULE_OFF) !== RULE_OFF).length;
  $("ruleCount").textContent = `掛機會用 ${active}／${quick.length} 招`;
  $("allOff").hidden = !offAllowed;
  $("allOff").disabled = active === 0;
  // 技能、隊友名單變了才整個重畫，不然只更新選中的格子
  const newRules = !!u.newOptions;
  const key = JSON.stringify([quick.map((q) => [q.slot, q.id, q.ally, q.attack, q.group]), s.party, offAllowed, newRules]);
  const box = $("skills");
  if (key !== skillsKey) {
    skillsKey = key;
    if (!quick.length) {
      box.innerHTML = '<div class="hint" style="margin-top:8px">從魔法或戰技頁放入技能後，就能設定自動施放。</div>';
      return;
    }
    box.replaceChildren(...quick.map((q) => {
      const div = document.createElement("div");
      div.className = "skill";
      div.dataset.slot = q.slot;
      const head = document.createElement("div");
      head.className = "head";
      if (q.icon) {
        const img = document.createElement("img");
        img.src = q.icon;
        img.alt = "";
        head.append(img);
      }
      const t = document.createElement("div");
      t.innerHTML = `<div class="slot">快捷第 ${q.slot + 1} 格</div>`;
      const name = document.createElement("div");
      name.style.fontWeight = "bold";
      name.textContent = q.name || `技能 ${q.id}`;
      t.append(name);
      head.append(t);
      const rules = document.createElement("div");
      if (q.group) {
        const tag = document.createElement("div");
        tag.className = "slot";
        tag.textContent = `${q.group}類：跟同類的會互相蓋掉，自動施放只能開一個`;
        t.append(tag);
      }
      const n = (offAllowed ? 5 : 4) + (q.attack && newRules ? 1 : 0);
      rules.className = `seg rules${n === 4 ? " four" : n === 6 ? " six" : ""}`;
      div.append(head, rules);
      if (q.ally) {
        const tg = document.createElement("div");
        tg.className = "targets";
        div.append(tg);
      }
      return div;
    }));
  }
  for (const div of box.querySelectorAll(".skill")) {
    const slot = Number(div.dataset.slot);
    // 「沒人需要補助才放」只給攻擊魔法（跟遊戲一樣；萬一已經選了也照樣顯示）
    const attack = !!quick.find((q) => q.slot === slot)?.attack;
    const choices = [...RULES.filter(([v]) => offAllowed || v !== RULE_OFF), ...((attack && newRules) || shown(slot) === 5 ? [RULE_NO_SUPPORT] : [])];
    seg(div.querySelector(".rules"), choices, shown(slot), (v) => set("rule", { slot, rule: v }));
    const tg = div.querySelector(".targets");
    if (tg) {
      const cur = u.allyTargets[slot] ?? "";
      const names = cur && !s.party.includes(cur) ? [...s.party, cur] : s.party;
      if (!names.length) {
        tg.textContent = "組隊後可以指定只放給某位隊友。";
      } else {
        if (!tg.querySelector(".seg")) {
          tg.textContent = "放給";
          const sg = document.createElement("span");
          sg.className = "seg";
          tg.append(sg);
        }
        seg(tg.querySelector(".seg"), [["", "所有隊友"], ...names.map((n) => [n, n])], cur, (v) => set("allyTarget", { slot, name: v }));
      }
    }
  }
}

async function refresh() {
  if (busy) return;
  const s = await api.get();
  if (!s || !s.ready) {
    $("status").className = "warn";
    $("status").textContent = "遊戲還在載入，等一下會自動讀到設定…";
    return;
  }
  render(s);
  if (!shareState && s.connected) loadShare();
}
async function loadShare(on) {
  const r = await api.share(on);
  if (!r) return;
  shareState = r;
  $("shareRow").hidden = !r.available;
  if (r.available && !r.error) sw($("share"), r.on, (v) => { $("share").disabled = true; loadShare(v).finally(() => ($("share").disabled = false)); });
}

for (const id of ["soundVolume", "musicVolume"]) {
  const el = $(id);
  el.addEventListener("input", () => ($(`${id}Text`).textContent = `${el.value}%`));
  el.addEventListener("change", () => set(id, Number(el.value)));
}
$("hpItem").addEventListener("change", (e) => set("hpItem", Number(e.target.value)));
$("mpItem").addEventListener("change", (e) => set("mpItem", Number(e.target.value)));
$("allOff").addEventListener("click", () => set("allRulesOff"));
for (const b of document.querySelectorAll(".tabs button")) {
  b.addEventListener("click", () => {
    for (const x of document.querySelectorAll(".tabs button")) x.setAttribute("aria-selected", String(x === b));
    $("tab-general").hidden = b.dataset.tab !== "general";
    $("tab-idle").hidden = b.dataset.tab !== "idle";
  });
}

refresh();
setInterval(refresh, 2000);
