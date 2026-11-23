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

/** 送一個設定給遊戲，拿回最新的狀態重畫。 */
async function set(key, value) {
  busy = true;
  try {
    const s = await api.set(key, value);
    if (s && s.ready) render(s);
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
    renderSkills(s);
  }
}

function renderSkills(s) {
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
  const key = JSON.stringify([quick, s.party, offAllowed]);
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
      rules.className = `seg rules${offAllowed ? "" : " four"}`;
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
    const choices = RULES.filter(([v]) => offAllowed || v !== RULE_OFF);
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
