// 桌寵本體：在視窗底邊左右走動、待機，並把遊戲裡發生的事演出來。
//
// 可以同時有好幾隻（右鍵選單「桌寵數量」），每隻各掛一個帳號（各自的遊戲視窗），各走各的、外觀可以各自挑。
//
// 滑鼠：移上去顯示那隻的帳號、角色在哪張地圖；點一下跳一下；按住可以拖著走、放開會掉回地面；
//       點兩下叫出那隻的遊戲；右鍵開選單。
// 遊戲連動：那隻的存檔有進帳（經驗／金幣／掉寶／升級）時揮一下，頭上冒出數字跟物品名稱。
//
// 動作圖格式跟遊戲一樣（遊戲 classes.js 的 sprite）：每個動作一張圖，列＝方向（0 向下、1 向右、2 向上），欄＝格數，
// 每格 cellW×cellH。所有動作都把角色縮放成 charH 身高、腳底貼格子底部，切換動作時大小與位置一致。
// 走路往左＝向右那列水平翻轉；站著、原地踏步用面向前方（向下）那列。
const bubble = document.getElementById("bubble");

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
const FLOATER_GAP_MS = 450; // 同一批事件一個接一個冒出來，不要疊在一起
const DROP_IN_HEIGHT = 220; // 新加進來的桌寵從這麼高掉下來
const ROW = { down: 0, right: 1, up: 2 };

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * 一隻桌寵。sprite = { model, charH, actions, box:{half, top, gap}（身體範圍，見 measureBody）, scale, w, h }；
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
    info: undefined, // 滑鼠移上去要顯示的內容（主程式送來的這隻的帳號、角色狀態）
    sleeping: false, // 角色在村莊：站著睡覺、頭上冒 Z，不走、不踏步、不揮擊（還是可以拖著移動）
    zzz: undefined, // 睡覺時頭上的大中小三個 Z（.zzz 元素）
    elsewhere: false, // 這個位置是別隻，由別的程式畫（每隻桌寵是獨立的程式，main.js 送 null 過來）：不畫、不吃滑鼠
  };
}

/** 睡覺：停在站著那一格，頭上冒出大中小三個 Z；醒來把 Z 收掉。 */
function setSleeping(p, on) {
  if (on === p.sleeping) return;
  p.sleeping = on;
  if (on) {
    rest(p);
    p.hopMs = 0;
    p.zzz = document.createElement("div");
    p.zzz.className = "zzz";
    p.zzz.innerHTML = "<span>Z</span><span>Z</span><span>Z</span>";
    document.body.append(p.zzz);
  } else {
    p.zzz?.remove();
    p.zzz = undefined;
  }
}

const pet = createPet(0); // 第一隻
const pets = [pet];
let hovering = false;
let hovered; // 游標在哪一隻身上
let interactive = false; // 視窗目前吃不吃滑鼠：游標在桌寵身上、或在調整大小的面板上
let sizerPet; // 調整大小的面板開在哪一隻頭上；沒開就是 undefined
let sizePercent = clamp(Number(localStorage.getItem(SIZE_KEY)) || 100, ...SIZE_PERCENT);
let clickThrough = false;
// 專注模式下要顯示哪幾類飄字（右鍵選單「專注模式」裡勾的），以及每種事件算哪一類
let focusShow = { exp: false, loot: false };
// 一般模式下要顯示哪幾類（右鍵選單「一般模式飄字」）
let normalShow = { exp: true, loot: true };
const FLOATER_GROUP = { exp: "exp", levelup: "exp", loot: "loot", gold: "loot" };
let drag; // { pet, grabX, startY, startLift, moved }

// ── 載入動作圖 ────────────────────────────────────────────

/**
 * 掃走路圖向下、向右兩列每一格的不透明像素，取聯集當作身體範圍：滑鼠判定跟對齊地面都用它。
 * half＝身體離格子中線最遠多寬、top＝頭頂離格子底多高、gap＝腳底離格子底多高（都是原圖的 px）。
 */
function measureBody(walk) {
  const { image, cellW, cellH, frames } = walk;
  const scratch = new OffscreenCanvas(cellW, cellH).getContext("2d", { willReadFrequently: true });
  let half = 0, minY = cellH, maxY = 0;
  for (const dir of ["down", "right"]) {
    for (let i = 0; i < (frames[dir] ?? 0); i++) {
      scratch.clearRect(0, 0, cellW, cellH);
      scratch.drawImage(image, i * cellW, ROW[dir] * cellH, cellW, cellH, 0, 0, cellW, cellH);
      const px = scratch.getImageData(0, 0, cellW, cellH).data;
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          if (px[(y * cellW + x) * 4 + 3] < ALPHA_SOLID) continue;
          half = Math.max(half, Math.abs(x + 0.5 - cellW / 2));
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  return maxY > minY ? { half, top: cellH - minY, gap: cellH - 1 - maxY } : { half: cellW / 2, top: cellH, gap: 0 };
}

// 好幾隻桌寵常常是同一個外觀（預設都跟著角色職業），同一套動作圖只載一次、量一次
const sheets = new Map(); // model → Promise<{ charH, actions, box } | undefined>

function loadSheet(model) {
  if (!sheets.has(model)) {
    sheets.set(model, (async () => {
      const got = await window.petApi.getSprite(model);
      if (!got?.actions?.walk) return undefined;
      const actions = {};
      for (const [name, a] of Object.entries(got.actions)) actions[name] = { ...a, image: await createImageBitmap(new Blob([a.image])) };
      const box = measureBody(actions.walk);
      // 變身圖的腳底不在格子底部，在 foot 那一點（例如 384×320 的格子腳底在 y 270）；職業圖腳底貼格子底部，用量出來的
      if (got.foot) box.gap = actions.walk.cellH - got.foot[1];
      return { charH: got.charH, actions, box };
    })());
  }
  return sheets.get(model);
}

/** 沒有任何一隻在用的動作圖就丟掉（沒載成功的也丟，下次再試）。 */
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

/**
 * 照使用者設定的大小重算縮放。畫布取所有動作裡最大的格子，每個動作都貼著畫布底部中間畫。
 * 縮放照遊戲的算法：角色身高 charH（職業圖 113、變身圖 160）畫成固定高度，所以變身後的大小比例跟遊戲裡一樣。
 */
function applySize(p) {
  if (!p.sprite) return;
  const s = p.sprite;
  s.scale = (DEFAULT_HEIGHT * sizePercent) / 100 / (s.charH || s.box.top - s.box.gap);
  const all = Object.values(s.actions);
  s.w = Math.max(...all.map((a) => a.cellW)) * s.scale;
  s.h = Math.max(...all.map((a) => a.cellH)) * s.scale;
  const dpr = window.devicePixelRatio || 1;
  p.canvas.width = Math.round(s.w * dpr);
  p.canvas.height = Math.round(s.h * dpr);
  p.canvas.style.width = `${s.w}px`;
  p.canvas.style.height = `${s.h}px`;
}

// ── 行為 ──────────────────────────────────────────────────

function setAction(p, name) {
  if (p.action === name) return;
  p.action = name === "idle" || p.sprite?.actions[name] ? name : "idle";
  p.actionMs = 0;
}

function rest(p) {
  setAction(p, "idle");
  p.idleLeftMs = rand(...IDLE_SECONDS) * 1000;
}

/** 揮一下（被點到、或遊戲裡有進帳）。cast＝升級時改成施法。 */
function swing(p, name = "attack") {
  if (drag?.pet === p || p.lift > 0 || !p.sprite || p.sleeping) return;
  p.action = "idle"; // 連續觸發時從頭再播一次
  setAction(p, p.sprite.actions[name] ? name : "attack");
}

/** 一次性動作（攻擊、施法）播一輪要多久。 */
function onceMs(p) {
  const a = p.sprite.actions[p.action];
  return a ? a.ms * (a.frames[p.action === "cast" ? "down" : "right"] ?? 1) : 0;
}

/** 這隻現在該站著別動：游標在牠身上、或調整大小的面板開在牠頭上。 */
const held = (p) => hovered === p || sizerPet === p;

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
  if (p.sleeping) {
    if (p.action !== "idle") rest(p);
    return;
  }
  if (p.action === "attack" || p.action === "cast") {
    if (p.actionMs >= onceMs(p)) rest(p);
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

/** 桌寵身體在視窗裡的範圍（已經算進跳躍、被拖起來的高度）。沒指定就是主角。 */
function bodyRect(p = pet) {
  const { box, scale, w, h } = p.sprite;
  const hop = p.hopMs > 0 ? Math.sin((1 - p.hopMs / HOP_MS) * Math.PI) * HOP_HEIGHT : 0;
  const foot = window.innerHeight - GROUND_GAP - hop - p.lift; // 腳底在視窗裡的 y
  const bottom = foot + box.gap * scale; // 格子底（畫布底）
  return { canvasLeft: p.x - w / 2, canvasTop: bottom - h, l: p.x - box.half * scale, r: p.x + box.half * scale, t: bottom - box.top * scale, b: foot };
}

/** 現在這一格要畫哪張圖的哪一列、第幾格，要不要翻面。 */
function currentFrame(p) {
  const { actions } = p.sprite;
  const walk = actions.walk;
  if (p.action === "idle") return { a: walk, dir: "down", i: Math.floor((walk.frames.down ?? 1) / 2), flip: false };
  const moving = p.action === "walk" && !p.stay;
  const a = actions[p.action] ?? walk;
  // 原地踏步、施法面向前方；走動、攻擊朝走的方向
  const dir = p.action === "cast" || (p.action === "walk" && !moving) ? "down" : "right";
  const count = Math.max(1, a.frames[dir] ?? 1);
  const loop = p.action === "walk";
  const i = loop ? Math.floor(p.actionMs / a.ms) % count : Math.min(count - 1, Math.floor(p.actionMs / a.ms));
  return { a, dir, i, flip: dir === "right" && p.facing < 0 };
}

function draw(p) {
  const { a, dir, i, flip } = currentFrame(p);
  const { scale } = p.sprite;
  const rect = bodyRect(p);
  p.canvas.style.transform = `translate(${rect.canvasLeft}px, ${rect.canvasTop}px) scaleX(${flip ? -1 : 1})`;
  const dpr = window.devicePixelRatio || 1;
  const dw = a.cellW * scale * dpr;
  const dh = a.cellH * scale * dpr;
  p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
  p.ctx.drawImage(a.image, i * a.cellW, ROW[dir] * a.cellH, a.cellW, a.cellH, (p.canvas.width - dw) / 2, p.canvas.height - dh, dw, dh);
}

/** 更新提醒的對話框跟著的那隻：這個視窗裡真正要畫的那一隻。 */
const speaker = () => pets.find((p) => !p.elsewhere) ?? pet;

/** 更新提醒的對話框跟著第一隻；滑鼠移上去的提示框、調整大小的面板跟著那一隻。 */
function placePanels() {
  if (speaker().sprite && speaking) placeAbove(speech, bodyRect(speaker()), 12);
  if (hovered?.sprite && !drag) placeAbove(bubble, bodyRect(hovered));
  if (sizerPet?.sprite) placeAbove(sizer, bodyRect(sizerPet));
  for (const p of pets) if (p.zzz && p.sprite && !p.elsewhere) placeZzz(p);
}

/** Z 擺在頭頂偏右（像漫畫裡睡覺冒出來的那樣），不超出視窗。 */
function placeZzz(p) {
  const rect = bodyRect(p);
  const x = clamp(rect.r - p.zzz.offsetWidth * 0.35, 4, window.innerWidth - p.zzz.offsetWidth - 4);
  p.zzz.style.transform = `translate(${x}px, ${Math.max(4, rect.t - p.zzz.offsetHeight + 6)}px)`;
}

/**
 * 把提示框／面板擺在桌寵頭上，水平置中，不超出視窗。
 * 桌寵靠近螢幕左右邊緣時框會被推回畫面裡、不再正對桌寵，所以對話框的尖角（--tail）改指向桌寵的實際位置。
 */
function placeAbove(el, rect, gap = 8) {
  const center = (rect.l + rect.r) / 2;
  const x = clamp(center - el.offsetWidth / 2, 8, window.innerWidth - el.offsetWidth - 8);
  el.style.transform = `translate(${x}px, ${Math.max(4, rect.t - el.offsetHeight - gap)}px)`;
  el.style.setProperty("--tail", `${clamp(center - x, 16, el.offsetWidth - 16)}px`);
}

// ── 更新提醒 ──────────────────────────────────────────────
// 只有更新提醒會用到（遊戲或桌寵有新版）。勿擾（專注模式）時主程式不會送過來。

const speech = document.getElementById("speech");
const SPEECH_MS = 15000;
let speaking = false;
let speechTimer;

function say(text) {
  speech.textContent = text;
  speaking = true;
  speech.classList.add("on");
  if (!speaker().sleeping) speaker().hopMs = HOP_MS; // 跳一下引起注意（睡著就不跳）
  clearTimeout(speechTimer);
  speechTimer = setTimeout(hideSpeech, SPEECH_MS);
}

function hideSpeech() {
  speaking = false;
  speech.classList.remove("on");
}

// 節約效能模式：每秒畫 12 次就好（人物圖一格本來就 50～150 毫秒），不用每秒 60 次
const POWER_SAVE_FRAME_MS = 83;
let powerSave = false;
window.petApi.onPowerSave((on) => (powerSave = !!on));
const nextFrame = () => (powerSave ? setTimeout(() => frame(performance.now()), POWER_SAVE_FRAME_MS) : requestAnimationFrame(frame));

// 一般模式每秒最多畫幾次（預設 60，0＝不限制；跟著右鍵「畫面更新率」，好幾隻選不同的就照最快的那隻）：
// 高更新率螢幕（144Hz 等）上不用跟著每秒畫 144 次。照固定節拍往後排，落後太多就從現在重新算
let frameMs = 1000 / 60;
let nextAt = -Infinity;
window.petApi.onMaxFps((fps) => ((frameMs = fps > 0 ? 1000 / fps : 0), (nextAt = -Infinity)));

let lastTime = performance.now();
function frame(now) {
  if (!powerSave && frameMs) {
    if (now < nextAt - 1) return requestAnimationFrame(frame);
    nextAt = now - nextAt > frameMs ? now + frameMs : nextAt + frameMs;
  }
  const dt = Math.min(powerSave ? 200 : 100, now - lastTime);
  lastTime = now;
  for (const p of pets) {
    if (!p.sprite || p.elsewhere) continue;
    p.actionMs += dt;
    p.hopMs = Math.max(0, p.hopMs - dt);
    think(p, dt);
    draw(p);
  }
  placePanels();
  nextFrame();
}
requestAnimationFrame(frame);

// ── 頭上冒出來的字 ────────────────────────────────────────

/** 從某一隻頭上冒出來；沒指定就是主角。 */
function spawnFloater(kind, text, p = pet) {
  if (!p.sprite) return;
  const el = document.createElement("div");
  el.className = `floater ${kind}`;
  el.textContent = text;
  document.body.append(el);
  const rect = bodyRect(p);
  const x = clamp((rect.l + rect.r) / 2 - el.offsetWidth / 2 + rand(-18, 18), 4, window.innerWidth - el.offsetWidth - 4);
  el.style.transform = `translate(${x}px, ${Math.max(70, rect.t - 6)}px)`;
  el.addEventListener("animationend", () => el.remove());
}

const compact = (n) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}億` : n >= 1e4 ? `${(n / 1e4).toFixed(1)}萬` : String(Math.round(n)));

/** 第 index 隻（＝牠那個帳號）的遊戲裡有進帳：那一隻揮一下（升級是施法＋跳），字從牠頭上冒出來。 */
function playEvents(index, events) {
  const p = pets[index];
  if (!p) return;
  // 一般模式：飄右鍵選單「一般模式飄字」勾的那幾類。專注模式：預設全部不飄，只飄「專注模式」裡勾的那幾類
  events = events.filter((e) => (clickThrough ? focusShow : normalShow)[FLOATER_GROUP[e.kind]]);
  if (events.length === 0) return;
  swing(p, events.some((e) => e.kind === "levelup") ? "cast" : "attack");
  events.forEach((e, i) => {
    setTimeout(() => {
      if (e.kind === "exp") spawnFloater("exp", `+${compact(e.n)} EXP`, p);
      else if (e.kind === "gold") spawnFloater("gold", `+${compact(e.n)} 金幣`, p);
      else if (e.kind === "loot") spawnFloater("loot", `${e.name} ×${e.n}`, p);
      else if (e.kind === "levelup") {
        spawnFloater("levelup", `LEVEL UP！Lv.${e.level}`, p);
        if (!p.sleeping) p.hopMs = HOP_MS;
      }
    }, i * FLOATER_GAP_MS);
  });
}

/** 滑鼠移上去的提示框：角色（還沒讀到就寫在哪），下面小字是第幾隻・帳號・位置・在做什麼。 */
function showInfo(p) {
  const s = p?.info;
  if (!s) {
    bubble.replaceChildren();
    return;
  }
  const small = document.createElement("small");
  small.textContent = [`第 ${p.index + 1} 隻`, s.account, s.name && s.place, s.doing].filter(Boolean).join("・");
  bubble.replaceChildren(s.name ? `Lv.${s.level} ${s.name}` : s.place, small);
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

/** 游標現在在哪一隻身上（不在任何一隻身上就傳 false／undefined）。 */
function setHovering(target) {
  target = target || undefined;
  if (target === hovered) return;
  hovered = target;
  hovering = !!target;
  updateCursor();
  if (hovering) showInfo(hovered);
  bubble.classList.toggle("on", hovering && !sizerPet && !!bubble.textContent);
}

const inside = (r, e) => e.clientX >= r.l && e.clientX <= r.r && e.clientY >= r.t && e.clientY <= r.b;

/** 游標底下的那一隻；疊在一起時取畫在最上層的。 */
function petAt(e) {
  for (let i = pets.length - 1; i >= 0; i--) if (pets[i].sprite && !pets[i].elsewhere && inside(bodyRect(pets[i]), e)) return pets[i];
  return undefined;
}

const overSizer = (e) => {
  if (!sizerPet) return false;
  const r = sizer.getBoundingClientRect();
  return inside({ l: r.left, r: r.right, t: r.top, b: r.bottom }, e);
};

function endDrag() {
  if (!drag) return;
  const wasClick = !drag.moved;
  const p = drag.pet ?? pet;
  drag = undefined;
  updateCursor();
  if (!wasClick || p.sleeping) return;
  p.hopMs = HOP_MS;
  swing(p);
}

document.addEventListener("mousemove", (e) => {
  if (!pet.sprite) return;
  // 專注模式：平常完全不理滑鼠，按住 Ctrl 移到桌寵身上才暫時可以點（用來開右鍵選單把專注模式關掉）
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
  const onPanel = overSizer(e);
  setHovering(!onPanel && petAt(e));
  setInteractive(hovering || onPanel);
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
document.addEventListener("dblclick", () => hovering && window.petApi.toggleGame(hovered.index));
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  // 告訴主程式是對哪一隻按的，選單裡「選擇外觀」「調整大小」才知道要對誰動手
  if (hovered) window.petApi.showMenu(hovered.index);
});

// ── 遊戲狀態 ──────────────────────────────────────────────

// 第 index 隻的帳號、角色狀態。桌寵還沒加進來（數量剛改）的話先記著，加進來時補上
const pendingInfo = [];
window.petApi.onState((index, state) => {
  pendingInfo[index] = state;
  const p = pets[index];
  if (!p) return;
  p.info = state;
  setSleeping(p, !!state?.sleeping);
  if (hovered === p) showInfo(p);
});

function removePet(p) {
  p.canvas.remove();
  p.zzz?.remove();
  if (drag?.pet === p) drag = undefined;
  if (hovered === p) {
    setHovering(false);
    setInteractive(false);
  }
  if (sizerPet === p) closeSizer();
}

function setElsewhere(p, on) {
  if (on === p.elsewhere) return;
  p.elsewhere = on;
  p.canvas.style.display = on ? "none" : "";
  if (p.zzz) p.zzz.style.display = on ? "none" : "";
  if (!on) return;
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
  while (pets.length < models.length) {
    const p = createPet(pets.length);
    p.info = pendingInfo[p.index];
    setSleeping(p, !!p.info?.sleeping);
    pets.push(p);
  }
  applyStay(); // 新加進來的也要套上牠的設定
  applyColors();
  // null＝別隻的位置（別的程式畫）：藏起來
  pets.forEach((p, i) => setElsewhere(p, models[i] === null));
  pets.forEach((p, i) => models[i] !== null && loadModel(p, models[i]));
});
window.petApi.onEvents(playEvents);
window.petApi.onNotice((index, text) => spawnFloater("hint", text, pets[index] && !pets[index].elsewhere ? pets[index] : speaker()));
window.petApi.onSay(say);
window.petApi.onFocusShow((show) => (focusShow = show));
window.petApi.onNormalShow((show) => (normalShow = show));
// 原地不走動（右鍵選單）：只在原地踏步或揮擊，不左右走。每隻可以各自開關，送來的是每一隻的設定
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
window.petApi.onClickThrough((on) => {
  clickThrough = on;
  document.body.classList.toggle("focus", on); // 變半透明，一眼看得出現在是專注模式
  if (on) {
    endDrag();
    setHovering(false);
    setInteractive(false);
    closeSizer();
    hideSpeech(); // 勿擾：講到一半的也收起來
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
// 放開拉條才存進設定；別隻（別的程式）看到設定變了跟著變大小（主程式送 pet:size 過來）
sizerRange.addEventListener("change", () => window.petApi.setSize(sizePercent, true));
window.petApi.onSize((percent) => {
  const value = clamp(Number(percent) || 100, ...SIZE_PERCENT);
  if (value === sizePercent) return;
  sizePercent = value;
  localStorage.setItem(SIZE_KEY, String(sizePercent));
  if (sizerPet) {
    sizerRange.value = String(sizePercent);
    sizerValue.textContent = `${sizePercent}%`;
  }
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
loadModel(pet, "knight");
