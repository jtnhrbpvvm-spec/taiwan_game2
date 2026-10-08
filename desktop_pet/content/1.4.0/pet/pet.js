// 桌寵本體：在視窗底邊左右走動、待機，並把遊戲裡發生的事演出來。
//
// 滑鼠：移上去顯示角色在哪張地圖；來回摸會冒愛心；點一下跳一下；按住可以拖著走、放開會掉回地面；
//       點兩下叫出遊戲；右鍵開選單。
// 遊戲連動：存檔有進帳（經驗／金錢／掉寶／升級）時揮一下，頭上冒出數字跟物品圖示。
//
// 動畫表格式跟遊戲一樣：一張圖切成 cols 欄的正方形格子，meta.layout 寫每個動作從第幾格開始、幾格、播多久。
// 圖裡的角色一律面向左，往右走時水平翻轉。
const canvas = document.getElementById("pet");
const ctx = canvas.getContext("2d");
const bubble = document.getElementById("bubble");
const speech = document.getElementById("speech");

const DEFAULT_HEIGHT = 96; // 角色身體在螢幕上的高度（px）；使用者可以用拉條在 50%～200% 之間調
const SIZE_PERCENT = [50, 200];
const SIZE_KEY = "pet.sizePercent";
const GROUND_GAP = 2; // 腳底離視窗底邊
const EDGE_MARGIN = 60;
const WALK_SPEED = [35, 70]; // px/秒
const IDLE_SECONDS = [2, 7];
const HOP_MS = 320;
const HOP_HEIGHT = 26;
const ALPHA_SOLID = 40;
const DRAG_THRESHOLD = 4; // 按住後移動超過這麼多 px 才算拖曳，不然算點一下
const GRAVITY = 1800; // px/秒²
const PET_STROKE = 140; // 滑鼠在身上摸過這麼多 px 冒一顆愛心
const FLOATER_GAP_MS = 450; // 同一批事件一個接一個冒出來，不要疊在一起
const ICON_SIZE = 24;
const SPEECH_MS = 15000; // 桌寵說的話停留多久
const ASK_MS = 60000; // 桌寵問的問題沒人理的話，多久後自己收起來（當作「不要」）

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

let sprite; // { model, image, meta, cell, box:{l,t,r,b}（格子內、面向左時的身體範圍）, scale }
let loadingModel;
let atlas; // 物品圖示圖集 { url, cell, cols }
let state;

// lift = 腳離地面多高（被拖起來或正在往下掉）
const pet = { x: window.innerWidth / 2, facing: -1, action: "idle", actionMs: 0, targetX: 0, idleLeftMs: 3000, hopMs: 0, lift: 0, fallSpeed: 0 };
let hovering = false;
let interactive = false; // 視窗目前吃不吃滑鼠：游標在桌寵身上、或在調整大小的面板上
let sizerOpen = false;
let sizePercent = clamp(Number(localStorage.getItem(SIZE_KEY)) || 100, ...SIZE_PERCENT);
let clickThrough = false;
let drag; // { grabX, startY, startLift, moved }
let stroked = 0;

// ── 載入動畫表 ────────────────────────────────────────────

/** 掃待機＋走路每一格的不透明像素，取聯集當作身體範圍：對齊地面跟滑鼠判定都用它。 */
function measureBody(image, meta, cell) {
  const scratch = new OffscreenCanvas(cell, cell).getContext("2d", { willReadFrequently: true });
  const box = { l: cell, t: cell, r: 0, b: 0 };
  for (const name of ["idle", "walk"]) {
    const anim = meta.layout[name];
    if (!anim) continue;
    for (let i = 0; i < anim.count; i++) {
      const f = anim.from + i;
      scratch.clearRect(0, 0, cell, cell);
      scratch.drawImage(image, (f % meta.cols) * cell, Math.floor(f / meta.cols) * cell, cell, cell, 0, 0, cell, cell);
      const px = scratch.getImageData(0, 0, cell, cell).data;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          if (px[(y * cell + x) * 4 + 3] < ALPHA_SOLID) continue;
          if (x < box.l) box.l = x;
          if (x > box.r) box.r = x;
          if (y < box.t) box.t = y;
          if (y > box.b) box.b = y;
        }
      }
    }
  }
  return box.r > box.l ? box : { l: 0, t: 0, r: cell, b: cell };
}

async function loadModel(model) {
  if (model === sprite?.model || model === loadingModel) return;
  loadingModel = model;
  const got = await window.petApi.getSprite(model);
  if (loadingModel !== model) return;
  loadingModel = undefined;
  if (!got?.meta.layout?.idle) return;
  const image = await createImageBitmap(new Blob([got.image]));
  const cell = image.width / got.meta.cols;
  const box = measureBody(image, got.meta, cell);
  sprite = { model, image, meta: got.meta, cell, box, scale: 1 };
  pet.action = "idle";
  applySize();
}

/** 照使用者設定的大小重算縮放。不管哪隻怪，身體高度都一樣，所以換怪不會忽大忽小。 */
function applySize() {
  if (!sprite) return;
  const { cell, box } = sprite;
  sprite.scale = (DEFAULT_HEIGHT * sizePercent) / 100 / (box.b - box.t);
  const dpr = window.devicePixelRatio || 1;
  const size = Math.round(cell * sprite.scale);
  canvas.width = canvas.height = Math.round(size * dpr);
  canvas.style.width = canvas.style.height = `${size}px`;
}

/** 物品圖示第一次要用時才載入（桌寵視窗比遊戲資料早開好，太早要會拿不到）。 */
async function ensureAtlas() {
  if (atlas) return;
  const got = await window.petApi.getItemAtlas();
  if (got && !atlas) atlas = { url: URL.createObjectURL(new Blob([got.image], { type: "image/webp" })), cell: got.cell, cols: got.cols };
}

// ── 行為 ──────────────────────────────────────────────────

function setAction(name) {
  if (pet.action === name) return;
  pet.action = sprite?.meta.layout[name] ? name : "idle";
  pet.actionMs = 0;
}

function rest() {
  setAction("idle");
  pet.idleLeftMs = rand(...IDLE_SECONDS) * 1000;
}

/** 揮一下（被點到、或遊戲裡有進帳）。 */
function swing() {
  if (drag || pet.lift > 0) return;
  pet.action = "idle"; // 連續觸發時從頭再播一次
  setAction("attack");
}

function think(dt) {
  if (drag) return;
  if (pet.lift > 0) {
    // 放開之後掉回地面
    pet.fallSpeed += (GRAVITY * dt) / 1000;
    pet.lift = Math.max(0, pet.lift - (pet.fallSpeed * dt) / 1000);
    if (pet.lift === 0) {
      pet.fallSpeed = 0;
      pet.hopMs = HOP_MS / 2; // 落地彈一小下
      rest();
    }
    return;
  }
  if (pet.action === "attack") {
    if (pet.actionMs >= sprite.meta.layout.attack.duration * 1000) rest();
    return;
  }
  if (pet.action === "idle") {
    pet.idleLeftMs -= dt;
    if (pet.idleLeftMs > 0 || hovering || sizerOpen || asking) return;
    pet.targetX = rand(EDGE_MARGIN, window.innerWidth - EDGE_MARGIN);
    pet.speed = rand(...WALK_SPEED);
    pet.facing = pet.targetX < pet.x ? -1 : 1;
    setAction("walk");
    return;
  }
  const step = (pet.speed * dt) / 1000;
  if (Math.abs(pet.targetX - pet.x) <= step || hovering || sizerOpen || asking) {
    rest();
    return;
  }
  pet.x += pet.facing * step;
}

/** 桌寵身體在視窗裡的範圍（已經算進翻轉、跳躍、被拖起來的高度）。 */
function bodyRect() {
  const { cell, box, scale } = sprite;
  const size = cell * scale;
  const hop = pet.hopMs > 0 ? Math.sin((1 - pet.hopMs / HOP_MS) * Math.PI) * HOP_HEIGHT : 0;
  const left = pet.x - size / 2;
  const top = window.innerHeight - GROUND_GAP - box.b * scale - hop - pet.lift;
  const l = pet.facing < 0 ? box.l : cell - box.r;
  const r = pet.facing < 0 ? box.r : cell - box.l;
  return { canvasLeft: left, canvasTop: top, l: left + l * scale, r: left + r * scale, t: top + box.t * scale, b: top + box.b * scale };
}

function draw() {
  const { image, meta, cell } = sprite;
  const anim = meta.layout[pet.action] ?? meta.layout.idle;
  const duration = anim.duration * 1000;
  const progress = pet.action === "attack" ? Math.min(pet.actionMs / duration, 0.999) : (pet.actionMs % duration) / duration;
  const f = anim.from + Math.floor(progress * anim.count);
  const rect = bodyRect();
  canvas.style.transform = `translate(${rect.canvasLeft}px, ${rect.canvasTop}px) scaleX(${-pet.facing})`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, (f % meta.cols) * cell, Math.floor(f / meta.cols) * cell, cell, cell, 0, 0, canvas.width, canvas.height);
  if (asking) placeAbove(askBox, rect, 12);
  else if (speaking) placeAbove(speech, rect, 12);
  else if (hovering && !drag) placeAbove(bubble, rect);
  if (sizerOpen) placeAbove(sizer, rect);
}

/** 把提示框／面板擺在桌寵頭上，水平置中，不超出視窗。 */
function placeAbove(el, rect, gap = 8) {
  const x = clamp((rect.l + rect.r) / 2 - el.offsetWidth / 2, 8, window.innerWidth - el.offsetWidth - 8);
  el.style.transform = `translate(${x}px, ${Math.max(4, rect.t - el.offsetHeight - gap)}px)`;
}

// ── 桌寵說話 ──────────────────────────────────────────────

let speaking = false;
let speechTimer;

/** 頭上跳出對話框講一句話，順便跳一下引起注意。講話的時候滑鼠移上去的提示框先讓位。 */
function say(text) {
  speech.textContent = text;
  speaking = true;
  speech.classList.toggle("on", !asking); // 正在問問題的話先不蓋過去
  bubble.classList.remove("on");
  pet.hopMs = HOP_MS;
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => {
    speaking = false;
    speech.classList.remove("on");
  }, SPEECH_MS);
}

// ── 桌寵問問題 ────────────────────────────────────────────

const askBox = document.getElementById("ask");
const askYes = document.getElementById("ask-yes");
const askNo = document.getElementById("ask-no");
let asking; // 正在問的那一題 { id }
let askTimer;

function closeAsk(ok) {
  if (!asking) return;
  window.petApi.answer(asking.id, ok);
  asking = undefined;
  clearTimeout(askTimer);
  askBox.classList.remove("on");
  speech.classList.toggle("on", speaking);
}

/** 頭上跳出帶兩顆按鈕的對話框。同時只問一題，新的來了舊的當作「不要」。 */
function ask(question) {
  closeAsk(false);
  asking = { id: question.id };
  document.getElementById("ask-text").textContent = question.text;
  askYes.textContent = question.yes;
  askNo.textContent = question.no;
  speech.classList.remove("on");
  bubble.classList.remove("on");
  askBox.classList.add("on");
  pet.hopMs = HOP_MS;
  if (pet.action === "walk") rest();
  askTimer = setTimeout(() => closeAsk(false), ASK_MS);
}
askYes.addEventListener("click", () => closeAsk(true));
askNo.addEventListener("click", () => closeAsk(false));

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastTime);
  lastTime = now;
  if (sprite) {
    pet.actionMs += dt;
    pet.hopMs = Math.max(0, pet.hopMs - dt);
    think(dt);
    draw();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ── 頭上冒出來的字跟圖示 ──────────────────────────────────

function spawnFloater(kind, text, iconIndex) {
  if (!sprite) return;
  const el = document.createElement("div");
  el.className = `floater ${kind}`;
  if (iconIndex !== undefined && atlas) {
    const icon = document.createElement("i");
    const zoom = ICON_SIZE / atlas.cell;
    icon.style.backgroundImage = `url(${atlas.url})`;
    icon.style.backgroundSize = `${atlas.cols * ICON_SIZE}px auto`;
    icon.style.backgroundPosition = `-${(iconIndex % atlas.cols) * atlas.cell * zoom}px -${Math.floor(iconIndex / atlas.cols) * atlas.cell * zoom}px`;
    el.append(icon);
  }
  el.append(text);
  document.body.append(el);
  const rect = bodyRect();
  const x = clamp((rect.l + rect.r) / 2 - el.offsetWidth / 2 + rand(-18, 18), 4, window.innerWidth - el.offsetWidth - 4);
  el.style.transform = `translate(${x}px, ${Math.max(70, rect.t - 6)}px)`;
  el.addEventListener("animationend", () => el.remove());
}

const compact = (n) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}億` : n >= 1e4 ? `${(n / 1e4).toFixed(1)}萬` : String(n));

async function playEvents(events) {
  if (events.some((e) => e.kind === "loot")) await ensureAtlas();
  swing();
  events.forEach((e, i) => {
    setTimeout(() => {
      if (e.kind === "exp") spawnFloater("exp", `+${compact(e.n)} EXP`);
      else if (e.kind === "gold") spawnFloater("gold", `+${compact(e.n)} 金`);
      else if (e.kind === "loot") spawnFloater("loot", `${e.name} ×${e.n}`, e.icon);
      else if (e.kind === "levelup") {
        spawnFloater("levelup", `LEVEL UP！Lv.${e.level}`);
        pet.hopMs = HOP_MS;
      }
    }, i * FLOATER_GAP_MS);
  });
}

// ── 滑鼠 ──────────────────────────────────────────────────
// 整個視窗預設是滑鼠穿透的（只會收到 mousemove），游標移到桌寵身上才暫時改成可以點。

/** 游標：在桌寵身上是張開的手，按住（拖著走）變成抓住的手；在面板上或其他地方用預設的。 */
function updateCursor() {
  document.body.style.cursor = drag ? "grabbing" : hovering ? "grab" : "";
}

function setInteractive(on) {
  if (on === interactive) return;
  interactive = on;
  window.petApi.setInteractive(on);
}

function setHovering(on) {
  if (on === hovering) return;
  hovering = on;
  stroked = 0;
  updateCursor();
  bubble.classList.toggle("on", on && !sizerOpen && !speaking && !asking && !!bubble.textContent);
}

const inside = (r, e) => e.clientX >= r.l && e.clientX <= r.r && e.clientY >= r.t && e.clientY <= r.b;

const overElement = (el, e) => {
  const r = el.getBoundingClientRect();
  return inside({ l: r.left, r: r.right, t: r.top, b: r.bottom }, e);
};
const overSizer = (e) => sizerOpen && overElement(sizer, e);
const overAsk = (e) => !!asking && overElement(askBox, e);

function endDrag() {
  if (!drag) return;
  const wasClick = !drag.moved;
  drag = undefined;
  updateCursor();
  if (!wasClick) return;
  pet.hopMs = HOP_MS;
  swing();
}

document.addEventListener("mousemove", (e) => {
  if (!sprite) return;
  // 專注模式：平常完全不理滑鼠，按住 Ctrl 移到桌寵身上才暫時可以點（用來開右鍵選單把專注模式關掉）
  if (clickThrough && !e.ctrlKey && !overAsk(e)) {
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
    setAction("idle");
    const x = clamp(e.clientX - drag.grabX, EDGE_MARGIN / 2, window.innerWidth - EDGE_MARGIN / 2);
    if (x !== pet.x) pet.facing = x < pet.x ? -1 : 1;
    pet.x = x;
    pet.lift = Math.max(0, drag.startLift + (drag.startY - e.clientY));
    pet.fallSpeed = 0;
    return;
  }
  // 按著滑鼠的時候（正在拉拉條）游標滑出面板也不要放掉，不然拉到一半會斷
  if (e.buttons !== 0) return;
  const onPanel = overSizer(e) || overAsk(e);
  setHovering(!onPanel && inside(bodyRect(), e));
  setInteractive(hovering || onPanel);
  if (!hovering) return;
  stroked += Math.abs(e.movementX) + Math.abs(e.movementY);
  if (stroked >= PET_STROKE) {
    stroked = 0;
    spawnFloater("heart", "♥");
  }
});
document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !hovering) return;
  drag = { grabX: e.clientX - pet.x, startX: e.clientX, startY: e.clientY, startLift: pet.lift, moved: false };
  updateCursor();
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

// ── 遊戲狀態 ──────────────────────────────────────────────

window.petApi.onState((next) => {
  state = next;
  const where = document.createElement("small");
  where.textContent = `${state.place}・${state.doing}`;
  bubble.replaceChildren(`Lv.${state.level} ${state.name}`, where);
});
window.petApi.onModel(loadModel);
window.petApi.onEvents(playEvents);
// 程式本身要講的話（例如有新版），一樣從頭上冒出來
window.petApi.onNotice((text) => spawnFloater("hint", text));
window.petApi.onSay(say);
window.petApi.onAsk(ask);
window.petApi.onClickThrough((on) => {
  clickThrough = on;
  document.body.classList.toggle("focus", on); // 變半透明，一眼看得出現在是專注模式
  if (on) {
    endDrag();
    setHovering(false);
    setInteractive(false);
    closeSizer();
    spawnFloater("hint", "專注模式：按住 Ctrl 再對我按右鍵，或按 Ctrl+Alt+P 解除");
  } else {
    spawnFloater("hint", "專注模式已解除");
  }
});

// ── 調整大小 ──────────────────────────────────────────────

const sizer = document.getElementById("sizer");
const sizerRange = document.getElementById("sizer-range");
const sizerValue = document.getElementById("sizer-value");
[sizerRange.min, sizerRange.max] = SIZE_PERCENT;

function closeSizer() {
  sizerOpen = false;
  sizer.classList.remove("on");
}

sizerRange.addEventListener("input", () => {
  sizePercent = Number(sizerRange.value);
  sizerValue.textContent = `${sizePercent}%`;
  localStorage.setItem(SIZE_KEY, String(sizePercent));
  applySize();
});
document.getElementById("sizer-done").addEventListener("click", closeSizer);
window.petApi.onOpenSizer(() => {
  sizerOpen = true;
  sizerRange.value = String(sizePercent);
  sizerValue.textContent = `${sizePercent}%`;
  bubble.classList.remove("on");
  sizer.classList.add("on");
  if (pet.action === "walk") rest();
});
// 還沒有存檔（或遊戲還沒載完）時先放一隻預設的出來
loadModel("t_by");
