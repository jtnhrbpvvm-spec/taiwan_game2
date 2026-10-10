// 桌寵本體：在視窗底邊左右走動、待機，並把遊戲裡發生的事演出來。
//
// 可以同時有好幾隻（右鍵選單「桌寵數量」），每隻各走各的、外觀可以各自挑，但顧的都是同一個角色。
// 第一隻是主角：說話、問問題、經驗／掉寶的飄字都從牠頭上冒出來，其他幾隻只跟著揮一下湊熱鬧。
//
// 滑鼠：移上去顯示角色在哪張地圖；來回摸會冒愛心；點一下跳一下；按住可以拖著走、放開會掉回地面；
//       點兩下叫出遊戲；右鍵開選單。
// 遊戲連動：存檔有進帳（經驗／金錢／掉寶／升級）時揮一下，頭上冒出數字跟物品圖示。
//
// 動畫表格式跟遊戲一樣：一張圖切成 cols 欄的正方形格子，meta.layout 寫每個動作從第幾格開始、幾格、播多久。
// 圖裡的角色一律面向左，往右走時水平翻轉。
const bubble = document.getElementById("bubble");
const speech = document.getElementById("speech");

const DEFAULT_HEIGHT = 96; // 角色身體在螢幕上的高度（px）；使用者可以用拉條在 50%～200% 之間調
const SIZE_PERCENT = [50, 200];
const SIZE_KEY = "pet.sizePercent";
const GROUND_GAP = 2; // 腳底離視窗底邊
const EDGE_MARGIN = 60;
const WALK_SPEED = [35, 70]; // px/秒
const IDLE_SECONDS = [2, 7];
const STEP_SECONDS = [2, 5]; // 原地不走動時，一次踏步踏多久
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
const DROP_IN_HEIGHT = 220; // 新加進來的桌寵從這麼高掉下來

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

let atlas; // 物品圖示圖集 { url, cell, cols }
let state;

/**
 * 一隻桌寵。sprite = { model, image, meta, cell, box:{l,t,r,b}（格子內、面向左時的身體範圍）, scale }；
 * lift = 腳離地面多高（被拖起來或正在往下掉）。
 */
function createPet(index) {
  const canvas = document.createElement("canvas");
  canvas.className = "pet";
  bubble.before(canvas); // 照順序排在提示框前面：編號大的畫在上層
  const first = index === 0;
  return {
    index, canvas, ctx: canvas.getContext("2d"), sprite: undefined, loadingModel: undefined,
    x: first ? window.innerWidth / 2 : rand(EDGE_MARGIN, window.innerWidth - EDGE_MARGIN),
    facing: first || Math.random() < 0.5 ? -1 : 1,
    action: "idle", actionMs: 0, targetX: 0, idleLeftMs: first ? 3000 : rand(500, 4000),
    hopMs: 0, lift: first ? 0 : DROP_IN_HEIGHT, fallSpeed: 0,
  };
}

const pet = createPet(0); // 主角
const pets = [pet];
let hovering = false;
let hovered; // 游標在哪一隻身上
let interactive = false; // 視窗目前吃不吃滑鼠：游標在桌寵身上、或在調整大小的面板上
let sizerPet; // 調整大小的面板開在哪一隻頭上；沒開就是 undefined
let sizePercent = clamp(Number(localStorage.getItem(SIZE_KEY)) || 100, ...SIZE_PERCENT);
let clickThrough = false;
// 專注模式下要顯示哪幾類飄字（右鍵選單「專注模式」裡勾的），以及每種事件算哪一類
let focusShow = { damage: false, exp: false, loot: false };
const FLOATER_GROUP = { damage: "damage", exp: "exp", levelup: "exp", loot: "loot", gold: "loot" };
let drag; // { pet, grabX, startY, startLift, moved }
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

// 好幾隻桌寵常常是同一個外觀（預設都跟著在打的怪），同一張動畫表只載一次、量一次
const sheets = new Map(); // model → Promise<{ image, meta, cell, box } | undefined>

function loadSheet(model) {
  if (!sheets.has(model)) {
    sheets.set(model, (async () => {
      const got = await window.petApi.getSprite(model);
      // 箱子、礦石、樹那類只有一格靜態圖、沒有走路動畫的不能當桌寵（畫不出來），維持原本的樣子
      if (!got?.meta.layout?.idle || !got.meta.layout.walk) return undefined;
      const image = await createImageBitmap(new Blob([got.image]));
      const cell = image.width / got.meta.cols;
      return { image, meta: got.meta, cell, box: measureBody(image, got.meta, cell) };
    })());
  }
  return sheets.get(model);
}

/** 沒有任何一隻在用的動畫表就丟掉（沒載成功的也丟，下次再試）。 */
function pruneSheets() {
  const used = new Set(pets.flatMap((p) => [p.sprite?.model, p.loadingModel]));
  for (const model of sheets.keys()) if (!used.has(model)) sheets.delete(model);
}

async function loadModel(p, model) {
  if (model === p.sprite?.model || model === p.loadingModel) return;
  p.loadingModel = model;
  const sheet = await loadSheet(model);
  if (p.loadingModel !== model) return;
  p.loadingModel = undefined;
  if (sheet && pets.includes(p)) {
    p.sprite = { model, ...sheet, scale: 1 };
    p.action = "idle";
    applySize(p);
  }
  pruneSheets();
}

/** 照使用者設定的大小重算縮放。不管哪隻怪，身體高度都一樣，所以換怪不會忽大忽小。 */
function applySize(p) {
  if (!p.sprite) return;
  const { cell, box } = p.sprite;
  p.sprite.scale = (DEFAULT_HEIGHT * sizePercent) / 100 / (box.b - box.t);
  const dpr = window.devicePixelRatio || 1;
  const size = Math.round(cell * p.sprite.scale);
  p.canvas.width = p.canvas.height = Math.round(size * dpr);
  p.canvas.style.width = p.canvas.style.height = `${size}px`;
}

/** 物品圖示第一次要用時才載入（桌寵視窗比遊戲資料早開好，太早要會拿不到）。 */
async function ensureAtlas() {
  if (atlas) return;
  const got = await window.petApi.getItemAtlas();
  if (got && !atlas) atlas = { url: URL.createObjectURL(new Blob([got.image], { type: "image/webp" })), cell: got.cell, cols: got.cols };
}

// ── 行為 ──────────────────────────────────────────────────

function setAction(p, name) {
  if (p.action === name) return;
  p.action = p.sprite?.meta.layout[name] ? name : "idle";
  p.actionMs = 0;
}

function rest(p) {
  setAction(p, "idle");
  p.idleLeftMs = rand(...IDLE_SECONDS) * 1000;
}

/** 揮一下（被點到、或遊戲裡有進帳）。 */
function swing(p) {
  if (drag?.pet === p || p.lift > 0) return;
  p.action = "idle"; // 連續觸發時從頭再播一次
  setAction(p, "attack");
}

/** 這隻現在該站著別動：游標在牠身上、調整大小的面板開在牠頭上、或主角正在問問題。 */
const held = (p) => hovered === p || sizerPet === p || (!!asking && p === pet);

function think(p, dt) {
  if (drag?.pet === p) return;
  if (p.lift > 0) {
    // 放開之後掉回地面
    p.fallSpeed += (GRAVITY * dt) / 1000;
    p.lift = Math.max(0, p.lift - (p.fallSpeed * dt) / 1000);
    if (p.lift === 0) {
      p.fallSpeed = 0;
      p.hopMs = HOP_MS / 2; // 落地彈一小下
      rest(p);
    }
    return;
  }
  if (p.action === "attack") {
    if (p.actionMs >= p.sprite.meta.layout.attack.duration * 1000) rest(p);
    return;
  }
  if (p.action === "idle") {
    p.idleLeftMs -= dt;
    if (p.idleLeftMs > 0 || held(p)) return;
    if (p.stay) {
      // 原地不走動：改成在原地踏幾秒的步
      p.stepLeftMs = rand(...STEP_SECONDS) * 1000;
      setAction(p, "walk");
      return;
    }
    p.targetX = rand(EDGE_MARGIN, window.innerWidth - EDGE_MARGIN);
    p.speed = rand(...WALK_SPEED);
    p.facing = p.targetX < p.x ? -1 : 1;
    setAction(p, "walk");
    return;
  }
  if (p.stay) {
    // 原地踏步：播走路的動畫但不移動，踏夠了就休息
    p.stepLeftMs = (p.stepLeftMs ?? 0) - dt;
    if (p.stepLeftMs <= 0 || held(p)) rest(p);
    return;
  }
  const step = (p.speed * dt) / 1000;
  if (Math.abs(p.targetX - p.x) <= step || held(p)) {
    rest(p);
    return;
  }
  p.x += p.facing * step;
}

/** 桌寵身體在視窗裡的範圍（已經算進翻轉、跳躍、被拖起來的高度）。沒指定就是主角。 */
function bodyRect(p = pet) {
  const { cell, box, scale } = p.sprite;
  const size = cell * scale;
  const hop = p.hopMs > 0 ? Math.sin((1 - p.hopMs / HOP_MS) * Math.PI) * HOP_HEIGHT : 0;
  const left = p.x - size / 2;
  const top = window.innerHeight - GROUND_GAP - box.b * scale - hop - p.lift;
  const l = p.facing < 0 ? box.l : cell - box.r;
  const r = p.facing < 0 ? box.r : cell - box.l;
  return { canvasLeft: left, canvasTop: top, l: left + l * scale, r: left + r * scale, t: top + box.t * scale, b: top + box.b * scale };
}

function draw(p) {
  const { image, meta, cell } = p.sprite;
  const anim = meta.layout[p.action] ?? meta.layout.idle;
  const duration = anim.duration * 1000;
  // 有幾張動畫表（整人箱那類）某個動作的播放時間是 0，等於只有一格，直接畫第一格
  const progress = duration <= 0 ? 0 : p.action === "attack" ? Math.min(p.actionMs / duration, 0.999) : (p.actionMs % duration) / duration;
  const f = anim.from + Math.floor(progress * anim.count);
  const rect = bodyRect(p);
  p.canvas.style.transform = `translate(${rect.canvasLeft}px, ${rect.canvasTop}px) scaleX(${-p.facing})`;
  p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
  p.ctx.drawImage(image, (f % meta.cols) * cell, Math.floor(f / meta.cols) * cell, cell, cell, 0, 0, p.canvas.width, p.canvas.height);
}

/** 對話框跟在主角頭上；滑鼠移上去的提示框、調整大小的面板跟著被點的那一隻。 */
function placePanels() {
  if (pet.sprite && asking) placeAbove(askBox, bodyRect(pet), 12);
  else if (pet.sprite && speaking) placeAbove(speech, bodyRect(pet), 12);
  else if (hovered?.sprite && !drag) placeAbove(bubble, bodyRect(hovered));
  if (sizerPet?.sprite) placeAbove(sizer, bodyRect(sizerPet));
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
  if (pet.action === "walk") rest(pet);
  askTimer = setTimeout(() => closeAsk(false), ASK_MS);
}
askYes.addEventListener("click", () => closeAsk(true));
askNo.addEventListener("click", () => closeAsk(false));

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastTime);
  lastTime = now;
  for (const p of pets) {
    if (!p.sprite) continue;
    p.actionMs += dt;
    p.hopMs = Math.max(0, p.hopMs - dt);
    think(p, dt);
    draw(p);
  }
  placePanels();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ── 頭上冒出來的字跟圖示 ──────────────────────────────────

/** 從某一隻頭上冒出來；沒指定就是主角。 */
function spawnFloater(kind, text, iconIndex, p = pet) {
  if (!p.sprite) return;
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
  const rect = bodyRect(p);
  const x = clamp((rect.l + rect.r) / 2 - el.offsetWidth / 2 + rand(-18, 18), 4, window.innerWidth - el.offsetWidth - 4);
  el.style.transform = `translate(${x}px, ${Math.max(70, rect.t - 6)}px)`;
  el.addEventListener("animationend", () => el.remove());
}

const compact = (n) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}億` : n >= 1e4 ? `${(n / 1e4).toFixed(1)}萬` : String(n));

async function playEvents(events) {
  // 一般模式：經驗、金錢、掉寶、升級都飄，傷害不飄（幾秒就一筆，太吵）。
  // 專注模式：預設全部不飄，只飄使用者在右鍵選單「專注模式」裡勾的那幾類
  events = events.filter((e) => (clickThrough ? focusShow[FLOATER_GROUP[e.kind]] : e.kind !== "damage"));
  if (events.length === 0) return;
  if (events.some((e) => e.kind === "loot")) await ensureAtlas();
  // 傷害幾秒就來一筆，只有它的時候不用每次都揮。字只從主角頭上冒，其他幾隻跟著揮
  if (events.some((e) => e.kind !== "damage")) pets.forEach(swing);
  events.forEach((e, i) => {
    setTimeout(() => {
      if (e.kind === "damage") spawnFloater("damage", `傷害 ${compact(e.n)}`);
      else if (e.kind === "exp") spawnFloater("exp", `+${compact(e.n)} EXP`);
      else if (e.kind === "gold") spawnFloater("gold", `+${compact(e.n)} 金`);
      else if (e.kind === "loot") spawnFloater("loot", `${e.name} ×${e.n}`, e.icon);
      else if (e.kind === "levelup") {
        spawnFloater("levelup", `LEVEL UP！Lv.${e.level}`);
        for (const p of pets) p.hopMs = HOP_MS;
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

/** 游標現在在哪一隻身上（傳 true＝主角；不在任何一隻身上就傳 false／undefined）。 */
function setHovering(target) {
  if (target === true) target = pet;
  target = target || undefined;
  if (target === hovered) return;
  hovered = target;
  hovering = !!target;
  stroked = 0;
  updateCursor();
  bubble.classList.toggle("on", hovering && !sizerPet && !speaking && !asking && !!bubble.textContent);
}

const inside = (r, e) => e.clientX >= r.l && e.clientX <= r.r && e.clientY >= r.t && e.clientY <= r.b;

/** 游標底下的那一隻；疊在一起時取畫在最上層的。 */
function petAt(e) {
  for (let i = pets.length - 1; i >= 0; i--) if (pets[i].sprite && inside(bodyRect(pets[i]), e)) return pets[i];
  return undefined;
}

const overElement = (el, e) => {
  const r = el.getBoundingClientRect();
  return inside({ l: r.left, r: r.right, t: r.top, b: r.bottom }, e);
};
const overSizer = (e) => !!sizerPet && overElement(sizer, e);
const overAsk = (e) => !!asking && overElement(askBox, e);

function endDrag() {
  if (!drag) return;
  const wasClick = !drag.moved;
  const p = drag.pet ?? pet;
  drag = undefined;
  updateCursor();
  if (!wasClick) return;
  p.hopMs = HOP_MS;
  swing(p);
}

document.addEventListener("mousemove", (e) => {
  if (!pet.sprite) return;
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
    const p = drag.pet;
    setAction(p, "idle");
    const x = clamp(e.clientX - drag.grabX, EDGE_MARGIN / 2, window.innerWidth - EDGE_MARGIN / 2);
    if (x !== p.x) p.facing = x < p.x ? -1 : 1;
    p.x = x;
    p.lift = Math.max(0, drag.startLift + (drag.startY - e.clientY));
    p.fallSpeed = 0;
    return;
  }
  // 按著滑鼠的時候（正在拉拉條）游標滑出面板也不要放掉，不然拉到一半會斷
  if (e.buttons !== 0) return;
  const onPanel = overSizer(e) || overAsk(e);
  setHovering(!onPanel && petAt(e));
  setInteractive(hovering || onPanel);
  if (!hovering) return;
  stroked += Math.abs(e.movementX) + Math.abs(e.movementY);
  if (stroked >= PET_STROKE) {
    stroked = 0;
    spawnFloater("heart", "♥", undefined, hovered);
    window.petApi.petted();
  }
});
document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !hovered) return;
  drag = { pet: hovered, grabX: e.clientX - hovered.x, startX: e.clientX, startY: e.clientY, startLift: hovered.lift, moved: false };
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
  // 告訴主程式是對哪一隻按的，選單裡「選擇外觀」「調整大小」才知道要對誰動手
  if (hovered) window.petApi.showMenu(hovered.index);
});

// ── 遊戲狀態 ──────────────────────────────────────────────

window.petApi.onState((next) => {
  state = next;
  const where = document.createElement("small");
  where.textContent = `${state.place}・${state.doing}`;
  bubble.replaceChildren(`Lv.${state.level} ${state.name}`, where);
});

function removePet(p) {
  p.canvas.remove();
  if (drag?.pet === p) drag = undefined;
  if (hovered === p) {
    setHovering(false);
    setInteractive(false);
  }
  if (sizerPet === p) closeSizer();
}

// 主程式送來每一隻該長什麼樣（陣列長度＝桌寵數量）：多的收掉、少的補上、外觀不一樣的換掉
window.petApi.onPets((models) => {
  if (!Array.isArray(models) || models.length === 0) return;
  while (pets.length > models.length) removePet(pets.pop());
  while (pets.length < models.length) pets.push(createPet(pets.length));
  applyStay(); // 新加進來的也要套上牠的設定
  applyColors();
  pets.forEach((p, i) => loadModel(p, models[i]));
});
window.petApi.onEvents(playEvents);
// 程式本身要講的話（例如有新版），一樣從頭上冒出來
window.petApi.onNotice((text) => spawnFloater("hint", text));
window.petApi.onSay(say);
window.petApi.onFocusShow((show) => (focusShow = show));
// 原地不走動（右鍵選單）：只在原地踏步或揮擊，不左右走。每隻可以各自開關，送來的是每一隻的設定；
// 只送一個 true／false 就是全部一起
let stayFlags = false;
function applyStay() {
  for (const p of pets) {
    const on = Array.isArray(stayFlags) ? !!stayFlags[p.index] : !!stayFlags;
    if (on && !p.stay && p.action === "walk") rest(p); // 正在走的先停下來
    p.stay = on;
  }
}
// 整隻調色（選外觀視窗裡的三條拉條）：用濾鏡轉色相、調鮮豔度和亮度，圖本身的明暗層次會留著
let petColors = [];
function applyColors() {
  for (const p of pets) {
    const c = petColors[p.index];
    p.canvas.style.filter = c ? `hue-rotate(${c.hue}deg) saturate(${c.sat}%) brightness(${c.light}%)` : "";
  }
}
window.petApi.onColors((colors) => {
  petColors = Array.isArray(colors) ? colors : [];
  applyColors();
});
window.petApi.onStay((flags) => {
  stayFlags = flags;
  applyStay();
});
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
// 大小是全部桌寵共用的；面板開在被按右鍵的那一隻頭上。

const sizer = document.getElementById("sizer");
const sizerRange = document.getElementById("sizer-range");
const sizerValue = document.getElementById("sizer-value");
[sizerRange.min, sizerRange.max] = SIZE_PERCENT;

function closeSizer() {
  sizerPet = undefined;
  sizer.classList.remove("on");
}

sizerRange.addEventListener("input", () => {
  sizePercent = Number(sizerRange.value);
  sizerValue.textContent = `${sizePercent}%`;
  localStorage.setItem(SIZE_KEY, String(sizePercent));
  pets.forEach(applySize);
});
document.getElementById("sizer-done").addEventListener("click", closeSizer);
window.petApi.onOpenSizer((index) => {
  sizerPet = pets[index] ?? pet;
  sizerRange.value = String(sizePercent);
  sizerValue.textContent = `${sizePercent}%`;
  bubble.classList.remove("on");
  sizer.classList.add("on");
  if (sizerPet.action === "walk") rest(sizerPet);
});
// 還沒有存檔（或遊戲還沒載完）時先放一隻預設的出來
loadModel(pet, "t_by");
