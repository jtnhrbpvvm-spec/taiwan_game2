// 桌寵本體：在視窗底邊左右走動、待機；角色在主城時坐下打瞌睡；遊戲裡有進帳時揮一下、頭上冒字。
//
// 外觀跟遊戲裡你的角色一樣：用遊戲自己的紙娃娃圖組出來（assets/players/<性別>/…）。
//   身體＋頭：movement.json，格子名稱 body:方向:格、head:方向:格
//   裝備：gear/<編號>.json，格子名稱 方向:格；衣服另外有「編號+1」那張是衣服顏色的灰階圖，要染成衣服顏色
//   物品編號 → 紙娃娃編號、每一格的圖層前後順序、每個動作用哪幾格：art.json（tools/gen-art.js 從遊戲程式抓的）
// 方向：0 下、1 左下、2 左、3 左上、4 上、5 右上、6 右、7 右下。每個動作格表的一格是 60 毫秒（跟遊戲一樣）。
//
// 滑鼠：移上去顯示角色、等級、在哪；點一下跳一下；按住可以拖著走；點兩下叫出遊戲視窗；右鍵開選單。
"use strict";
const canvas = document.getElementById("pet");
const ctx = canvas.getContext("2d");
const bubble = document.getElementById("bubble");
const nameplate = document.getElementById("nameplate");

const BASE_SCALE = 1.6; // 遊戲圖的角色大約 65px 高，100% 時放大成 1.6 倍
const FRAME_MS = 60;
const BOX = { w: 220, h: 200, ox: 110, oy: 165 }; // 組圖用的畫布大小、腳底（原點）位置
const GROUND_GAP = 4;
const EDGE_MARGIN = 60;
const WALK_SPEED = [30, 55]; // px/秒（100% 大小時）
const IDLE_SECONDS = [2, 7];
const HOP_MS = 320;
const HOP_HEIGHT = 26;
const GRAVITY = 1800;
const DRAG_THRESHOLD = 4;
const FLOATER_GAP_MS = 450;
const ALPHA_SOLID = 40;
const BOW_FILES = [[78, 79, 162, 172], [80, 81, 162, 172]]; // 遊戲程式裡算「弓」的武器紙娃娃編號（女、男）
const DIR = { idleRight: 7, idleLeft: 1, walkRight: 6, walkLeft: 2, front: 0 };
const DEFAULT_SKIN = 0xedb99c; // 還不知道角色膚色時用遊戲裡常見的那個（房間成員資料裡的 15579036）

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

let art; // { gear, order(Uint8Array[]), layerOrders, actions }
let look; // { sex, gear:[衣服,頭盔,武器,盾,披風], colors:[膚色,衣服顏色] }
let doll; // 這套外觀載好的圖：{ key, sex, body, layers:{armor,cloth,helmet,weapon,shield,cape}, bow, colors, cache, box }
let lookVersion = 0;
let sizePercent = 100;
let stay = false;
let clickThrough = false;
let info; // 主程式送來的角色狀態（滑鼠移上去顯示）

const pet = {
  x: window.innerWidth / 2, facing: -1, action: "idle", actionMs: 0, targetX: 0, speed: 40, idleLeftMs: 2500,
  hopMs: 0, lift: 0, fallSpeed: 0, sleeping: false, zzz: undefined,
};

// ── 載圖 ──────────────────────────────────────────────────

const sheets = new Map(); // 路徑 → Promise<{ frames, pages }>
function loadSheet(dir, name) {
  const key = dir + name;
  if (!sheets.has(key)) {
    sheets.set(key, (async () => {
      const j = JSON.parse(new TextDecoder().decode(await window.petApi.getAsset(dir + name)));
      const pages = await Promise.all(j.images.map(async (im) => createImageBitmap(new Blob([await window.petApi.getAsset(dir + im.image)]))));
      return { frames: j.frames, pages };
    })().catch((e) => {
      sheets.delete(key);
      console.warn("載不到", key, e);
      return undefined;
    }));
  }
  return sheets.get(key);
}

const gearFile = (itemId, sex) => {
  const row = art.gear[itemId];
  return row ? (sex === 1 ? row[2] : row[1]) || 0 : 0;
};

async function loadDoll(l) {
  const version = ++lookVersion;
  const key = JSON.stringify(l);
  const sex = l.sex === 0 ? 0 : 1;
  const base = `assets/players/${sex}/`;
  const [armor, helmet, weapon, shield, cape] = l.gear.map((id) => gearFile(id, sex));
  const gear = (file) => (file > 0 ? loadSheet(base + "gear/", `${file}.json`) : Promise.resolve(undefined));
  const [body, armorS, clothS, helmetS, weaponS, shieldS, capeS] = await Promise.all([
    loadSheet(base, "movement.json"), gear(armor), gear(armor > 0 ? armor + 1 : 0), gear(helmet), gear(weapon), gear(shield), gear(cape),
  ]);
  if (!body) return;
  if (version !== lookVersion) return; // 只顯示最後一次收到的角色外觀
  doll = {
    key, sex, body, cache: new Map(),
    layers: { armor: armorS, cloth: clothS, helmet: helmetS, weapon: weaponS, shield: shieldS, cape: capeS },
    bow: BOW_FILES[sex].includes(weapon),
    colors: l.colors,
  };
  doll.box = measure();
  applySize();
}

// ── 組圖 ──────────────────────────────────────────────────

const scratch = new OffscreenCanvas(BOX.w, BOX.h);
const sctx = scratch.getContext("2d", { willReadFrequently: true });

/** 把一格貼到 c 上（原點對齊 BOX 的腳底）；tint＝染色（0xRRGGBB，白色或沒給就不染）。 */
function blit(c, sheet, key, tint) {
  const f = sheet?.frames[key];
  if (!f) return;
  const x = BOX.ox - f.originX, y = BOX.oy - f.originY;
  if (!tint || tint === 0xffffff) {
    c.drawImage(sheet.pages[f.page], f.x, f.y, f.w, f.h, x, y, f.w, f.h);
    return;
  }
  sctx.clearRect(0, 0, BOX.w, BOX.h);
  sctx.globalCompositeOperation = "source-over";
  sctx.drawImage(sheet.pages[f.page], f.x, f.y, f.w, f.h, x, y, f.w, f.h);
  sctx.globalCompositeOperation = "multiply";
  sctx.fillStyle = `#${tint.toString(16).padStart(6, "0")}`;
  sctx.fillRect(x, y, f.w, f.h);
  sctx.globalCompositeOperation = "destination-in";
  sctx.drawImage(sheet.pages[f.page], f.x, f.y, f.w, f.h, x, y, f.w, f.h);
  sctx.globalCompositeOperation = "source-over";
  c.drawImage(scratch, 0, 0);
}

/** 組出「方向 dir、第 n 格」的整個角色（存起來，同一格不用重組）。 */
function composed(dir, n) {
  const key = `${dir}:${n}`;
  let img = doll.cache.get(key);
  if (img) return img;
  img = new OffscreenCanvas(BOX.w, BOX.h);
  const c = img.getContext("2d");
  const bytes = art.order[doll.sex];
  const order = art.layerOrders[bytes?.[dir * 75 + n] ?? 0] ?? art.layerOrders[0];
  const L = doll.layers;
  const [skin, cloth] = doll.colors ?? [DEFAULT_SKIN, 0xffffff];
  blit(c, L.cape, key);
  for (const layer of order) {
    if (layer === "body") {
      blit(c, doll.body, `body:${key}`, skin);
      blit(c, doll.body, `head:${key}`);
    } else if (layer === "armor") {
      blit(c, L.armor, key);
      blit(c, L.cloth, key, cloth);
    } else blit(c, L[layer], key);
  }
  doll.cache.set(key, img);
  return img;
}

/** 量一張組圖的不透明範圍（原圖 px）；全透明回傳 undefined。 */
function opaqueBounds(img) {
  const c = new OffscreenCanvas(BOX.w, BOX.h).getContext("2d", { willReadFrequently: true });
  c.drawImage(img, 0, 0);
  const px = c.getImageData(0, 0, BOX.w, BOX.h).data;
  let l = BOX.w, r = 0, t = BOX.h, b = 0;
  for (let y = 0; y < BOX.h; y++) {
    for (let x = 0; x < BOX.w; x++) {
      if (px[(y * BOX.w + x) * 4 + 3] < ALPHA_SOLID) continue;
      if (x < l) l = x;
      if (x > r) r = x;
      if (y < t) t = y;
      if (y > b) b = y;
    }
  }
  return r <= l ? undefined : { l, r, t, b };
}

/** 量站著那一格的不透明範圍，當成滑鼠判定和頭頂位置（相對腳底，原圖 px）。
 *  腳底只看身體＋衣服：杖、長槍、盾、披風會垂到腳下面，拿來當腳底角色會浮在半空。 */
function measure() {
  const key = `${DIR.front}:${art.actions.none[0]}`;
  const all = opaqueBounds(composed(DIR.front, art.actions.none[0]));
  if (!all) return { half: 20, top: 70, gap: 0 };
  const bodyOnly = new OffscreenCanvas(BOX.w, BOX.h);
  const bc = bodyOnly.getContext("2d");
  const [skin, cloth] = doll.colors ?? [DEFAULT_SKIN, 0xffffff];
  blit(bc, doll.body, `body:${key}`, skin);
  blit(bc, doll.layers.armor, key);
  blit(bc, doll.layers.cloth, key, cloth);
  const feet = opaqueBounds(bodyOnly) ?? all;
  return { half: Math.max(BOX.ox - all.l, all.r - BOX.ox) + 4, top: BOX.oy - all.t, gap: BOX.oy - feet.b };
}

const scale = () => (BASE_SCALE * sizePercent) / 100;

function applySize() {
  const s = scale(), dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(BOX.w * s * dpr);
  canvas.height = Math.round(BOX.h * s * dpr);
  canvas.style.width = `${BOX.w * s}px`;
  canvas.style.height = `${BOX.h * s}px`;
}

// ── 行為 ──────────────────────────────────────────────────

function setAction(name) {
  if (pet.action === name) return;
  pet.action = name;
  pet.actionMs = 0;
}
function rest() {
  setAction("idle");
  pet.idleLeftMs = rand(...IDLE_SECONDS) * 1000;
}
function swing(kind = "attack") {
  if (drag || pet.lift > 0 || !doll || pet.sleeping) return;
  pet.action = "";
  setAction(kind);
}

/** 現在的動作用哪個動作格表、哪個方向、要不要循環。 */
function currentMotion() {
  const A = art.actions;
  const right = pet.facing > 0;
  switch (pet.action) {
    case "walk": return { frames: A.walk, dir: stay ? DIR.front : right ? DIR.walkRight : DIR.walkLeft, loop: true };
    case "attack": return { frames: doll.bow ? A.bow : A.oneSword1, dir: right ? DIR.walkRight : DIR.walkLeft, loop: false };
    case "cast": return { frames: A.magicCasting.length > 2 ? [...A.magicBefore, ...A.magicCasting] : A.magicBefore, dir: DIR.front, loop: false };
    case "sit": return { frames: A.sitDown, dir: right ? DIR.idleRight : DIR.idleLeft, loop: true };
    default: return { frames: A.none, dir: right ? DIR.idleRight : DIR.idleLeft, loop: true };
  }
}

const held = () => hovering;

function think(dt) {
  if (drag) return;
  if (pet.lift > 0) {
    pet.fallSpeed += (GRAVITY * dt) / 1000;
    pet.lift = Math.max(0, pet.lift - (pet.fallSpeed * dt) / 1000);
    if (pet.lift === 0) {
      pet.fallSpeed = 0;
      pet.hopMs = HOP_MS / 2;
      pet.sleeping ? setAction("sit") : rest();
    }
    return;
  }
  if (pet.sleeping) {
    setAction("sit");
    return;
  }
  if (pet.action === "sit") rest();
  if (pet.action === "attack" || pet.action === "cast") {
    if (pet.actionMs >= currentMotion().frames.length * FRAME_MS + 200) rest();
    return;
  }
  if (pet.action === "idle") {
    pet.idleLeftMs -= dt;
    if (pet.idleLeftMs > 0 || held()) return;
    if (stay) {
      pet.stepLeftMs = rand(2, 4) * 1000;
      setAction("walk");
      return;
    }
    pet.targetX = rand(EDGE_MARGIN, window.innerWidth - EDGE_MARGIN);
    pet.speed = rand(...WALK_SPEED) * (sizePercent / 100);
    pet.facing = pet.targetX < pet.x ? -1 : 1;
    setAction("walk");
    return;
  }
  if (stay) {
    pet.stepLeftMs -= dt;
    if (pet.stepLeftMs <= 0 || held()) rest();
    return;
  }
  const step = (pet.speed * dt) / 1000;
  if (Math.abs(pet.targetX - pet.x) <= step || held()) {
    rest();
    return;
  }
  pet.x += pet.facing * step;
}

/** 身體在視窗裡的範圍（算進跳躍、被拖起來的高度）。 */
function bodyRect() {
  const s = scale(), box = doll.box;
  const hop = pet.hopMs > 0 ? Math.sin((1 - pet.hopMs / HOP_MS) * Math.PI) * HOP_HEIGHT : 0;
  const foot = window.innerHeight - GROUND_GAP - hop - pet.lift;
  const originY = foot + box.gap * s; // 組圖原點（BOX.oy）在視窗裡的 y
  return {
    canvasLeft: pet.x - BOX.ox * s, canvasTop: originY - BOX.oy * s,
    l: pet.x - box.half * s, r: pet.x + box.half * s, t: originY - box.top * s, b: foot,
  };
}

function draw() {
  const m = currentMotion();
  const i = m.loop ? Math.floor(pet.actionMs / FRAME_MS) % m.frames.length : Math.min(m.frames.length - 1, Math.floor(pet.actionMs / FRAME_MS));
  const img = composed(m.dir, m.frames[i]);
  const rect = bodyRect();
  placeAbove(nameplate, rect, 2);
  canvas.style.transform = `translate(${rect.canvasLeft}px, ${rect.canvasTop}px)`;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (hovering && !drag) placeAbove(bubble, rect);
  if (pet.zzz) placeZzz(rect);
}

function placeAbove(el, rect, gap = 8) {
  const center = (rect.l + rect.r) / 2;
  const x = clamp(center - el.offsetWidth / 2, 8, window.innerWidth - el.offsetWidth - 8);
  el.style.transform = `translate(${x}px, ${Math.max(4, rect.t - el.offsetHeight - gap)}px)`;
}
function placeZzz(rect) {
  const z = pet.zzz;
  const x = clamp(rect.r - z.offsetWidth * 0.35, 4, window.innerWidth - z.offsetWidth - 4);
  z.style.transform = `translate(${x}px, ${Math.max(4, rect.t - z.offsetHeight + 10)}px)`;
}

function setSleeping(on) {
  if (on === pet.sleeping) return;
  pet.sleeping = on;
  if (on) {
    pet.zzz = document.createElement("div");
    pet.zzz.className = "zzz";
    pet.zzz.innerHTML = "<span>Z</span><span>Z</span><span>Z</span>";
    document.body.append(pet.zzz);
  } else {
    pet.zzz?.remove();
    pet.zzz = undefined;
  }
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastTime);
  lastTime = now;
  if (doll && art) {
    pet.actionMs += dt;
    pet.hopMs = Math.max(0, pet.hopMs - dt);
    think(dt);
    draw();
  }
  requestAnimationFrame(frame);
}

// ── 頭上的字 ──────────────────────────────────────────────

function spawnFloater(kind, text) {
  if (!doll) return;
  const el = document.createElement("div");
  el.className = `floater ${kind}`;
  el.textContent = text;
  document.body.append(el);
  const rect = bodyRect();
  const x = clamp((rect.l + rect.r) / 2 - el.offsetWidth / 2 + rand(-18, 18), 4, window.innerWidth - el.offsetWidth - 4);
  el.style.transform = `translate(${x}px, ${Math.max(70, rect.t - 6)}px)`;
  el.addEventListener("animationend", () => el.remove());
}

const compact = (n) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}億` : n >= 1e4 ? `${(n / 1e4).toFixed(1)}萬` : String(Math.round(n)));

function playEvents(events) {
  if (clickThrough || !events.length) return;
  swing(events.some((e) => e.kind === "levelup") ? "cast" : "attack");
  events.forEach((e, i) => {
    setTimeout(() => {
      if (e.kind === "exp") spawnFloater("exp", `+${compact(e.n)} EXP`);
      else if (e.kind === "gold") spawnFloater("gold", `+${compact(e.n)} 金幣`);
      else if (e.kind === "loot") spawnFloater("loot", `${e.name} ×${e.n}`);
      else if (e.kind === "levelup") {
        spawnFloater("levelup", `LEVEL UP！Lv.${e.level}`);
        if (!pet.sleeping) pet.hopMs = HOP_MS;
      }
    }, i * FLOATER_GAP_MS);
  });
}

function showInfo() {
  if (!info) return bubble.replaceChildren();
  const title = info.name ? `${info.account}・Lv.${info.level} ${info.name}` : info.account || "龍族桌寵";
  const small = document.createElement("small");
  small.textContent = [info.place, info.doing].filter(Boolean).join("・");
  const nodes = [title, small];
  if (info.maxHp > 0 && !info.offline) {
    const bar = document.createElement("span");
    bar.className = "hp";
    bar.title = `HP ${info.hp}/${info.maxHp}`;
    const fill = document.createElement("i");
    fill.style.width = `${clamp((info.hp / info.maxHp) * 100, 0, 100)}%`;
    bar.append(fill);
    nodes.push(bar);
  }
  bubble.replaceChildren(...nodes);
}

// ── 滑鼠 ──────────────────────────────────────────────────
// 整個視窗預設滑鼠穿透（只收得到 mousemove），游標移到桌寵身上才暫時改成可以點。

let hovering = false;
let interactive = false;
let drag; // { grabX, startX, startY, startLift, moved }

function setInteractive(on) {
  if (on === interactive) return;
  interactive = on;
  window.petApi.setInteractive(on);
}
function setHovering(on) {
  if (on === hovering) return;
  hovering = on;
  document.body.style.cursor = drag ? "grabbing" : on ? "grab" : "";
  if (on) showInfo();
  bubble.classList.toggle("on", on && !!bubble.textContent);
}
const inside = (r, e) => e.clientX >= r.l && e.clientX <= r.r && e.clientY >= r.t && e.clientY <= r.b;

function endDrag() {
  if (!drag) return;
  const wasClick = !drag.moved;
  drag = undefined;
  document.body.style.cursor = hovering ? "grab" : "";
  if (!wasClick || pet.sleeping) return;
  pet.hopMs = HOP_MS;
  swing();
}

document.addEventListener("mousemove", (e) => {
  if (!doll) return;
  if (clickThrough && !e.ctrlKey) {
    if (e.buttons === 0) {
      setHovering(false);
      setInteractive(false);
    }
    return;
  }
  if (drag) {
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
    drag.moved = true;
    bubble.classList.remove("on");
    if (!pet.sleeping) setAction("idle");
    const x = clamp(e.clientX - drag.grabX, EDGE_MARGIN / 2, window.innerWidth - EDGE_MARGIN / 2);
    if (x !== pet.x) pet.facing = x < pet.x ? -1 : 1;
    pet.x = x;
    pet.lift = Math.max(0, drag.startLift + (drag.startY - e.clientY));
    pet.fallSpeed = 0;
    return;
  }
  if (e.buttons !== 0) return;
  const over = inside(bodyRect(), e);
  setHovering(over);
  setInteractive(over);
});
document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !hovering) return;
  drag = { grabX: e.clientX - pet.x, startX: e.clientX, startY: e.clientY, startLift: pet.lift, moved: false };
  document.body.style.cursor = "grabbing";
});
document.addEventListener("mouseup", (e) => e.button === 0 && endDrag());
document.addEventListener("mouseleave", () => {
  endDrag();
  setHovering(false);
  setInteractive(false);
});
document.addEventListener("dblclick", () => hovering && window.petApi.toggleGame());
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (hovering) window.petApi.showMenu();
});

// ── 主程式送來的 ──────────────────────────────────────────

window.petApi.onState((s) => {
  info = s;
  nameplate.textContent = `${s.account || "龍族桌寵"}・${s.name || "尚未登入角色"}${s.offline ? "（離線）" : ""}`;
  document.body.classList.toggle("offline", !!s?.offline && !!s?.name);
  setSleeping(!!s?.sleeping);
  if (hovering) showInfo();
});
window.petApi.onLook((l) => {
  look = l;
  if (art) loadDoll(l ?? { sex: 1, gear: [0, 0, 0, 0, 0], colors: null });
});
window.petApi.onPosition((ratio) => { pet.x = window.innerWidth * ratio; });
window.petApi.onEvents(playEvents);
window.petApi.onNotice((text) => spawnFloater("hint", text));
window.petApi.onSize((n) => {
  sizePercent = clamp(Number(n) || 100, 40, 300);
  if (doll) applySize();
});
window.petApi.onStay((on) => {
  stay = !!on;
  if (stay && pet.action === "walk") rest();
});
window.petApi.onClickThrough((on) => {
  clickThrough = on;
  document.body.classList.toggle("focus", on);
  if (on) {
    endDrag();
    setHovering(false);
    setInteractive(false);
    spawnFloater("hint", "專注模式：按住 Ctrl 再對我按右鍵，或按 Ctrl+Alt+P 解除");
  } else spawnFloater("hint", "專注模式已解除");
});

(async () => {
  const a = await window.petApi.getArt();
  art = { ...a, order: a.order.map((s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))) };
  // 還沒登入、還不知道角色長怎樣時，先放一個沒穿裝備的男角
  await loadDoll(look ?? { sex: 1, gear: [0, 0, 0, 0, 0], colors: null });
  requestAnimationFrame(frame);
})();
