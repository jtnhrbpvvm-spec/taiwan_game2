// 選擇桌寵外觀：列出遊戲裡 12 個職業的人物和有專屬圖的變身外觀，點一下桌面上的桌寵就立刻換。
// 縮圖是走路圖面向前方那列的中間一格（跟桌寵站著時一樣）。
const list = document.getElementById("list");
const follow = document.getElementById("follow");

const THUMB = 80;

let entries = [];
let current = null; // 目前選的職業；null＝跟著目前角色的職業

async function drawThumb(card) {
  const got = await window.pickerApi.getSprite(card.dataset.model);
  const walk = got?.actions?.walk;
  if (!walk) return;
  const image = await createImageBitmap(new Blob([walk.image]));
  const canvas = card.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  // 照格子比例塞進正方形縮圖，貼底置中
  const fit = Math.min(canvas.width / walk.cellW, canvas.height / walk.cellH);
  const w = walk.cellW * fit;
  const h = walk.cellH * fit;
  const i = Math.floor((walk.frames.down ?? 1) / 2);
  ctx.drawImage(image, i * walk.cellW, 0, walk.cellW, walk.cellH, (canvas.width - w) / 2, canvas.height - h, w, h);
  image.close();
}

function markCurrent() {
  follow.classList.toggle("on", current === null);
  for (const card of list.children) card.classList.toggle("on", card.dataset.model === current);
}

function render() {
  list.replaceChildren(
    ...entries.map((e) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.dataset.model = e.model;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = THUMB * 2;
      const name = document.createElement("span");
      name.textContent = e.name;
      const group = document.createElement("small");
      group.textContent = e.group ?? "";
      card.append(canvas, name, group);
      drawThumb(card);
      return card;
    })
  );
  markCurrent();
}

function choose(model) {
  current = model;
  window.pickerApi.choose(model);
  markCurrent();
}

list.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) choose(card.dataset.model);
});
follow.addEventListener("click", () => choose(null));

// ── 顏色 ──
// 三條拉條整隻調色。拖的時候桌面上的桌寵和下面的縮圖馬上跟著變，放開才存起來。
const COLOR_KEYS = ["hue", "sat", "light"];
const colorInput = (key) => document.getElementById(`color-${key}`);
let colorRange;

function readColor() {
  return Object.fromEntries(COLOR_KEYS.map((key) => [key, Number(colorInput(key).value)]));
}

function showColor() {
  const c = readColor();
  document.getElementById("color-hue-value").textContent = `${c.hue}°`;
  document.getElementById("color-sat-value").textContent = `${c.sat}%`;
  document.getElementById("color-light-value").textContent = `${c.light}%`;
  const changed = COLOR_KEYS.some((key) => c[key] !== colorRange[key][2]);
  list.style.setProperty("--pet-filter", changed ? `hue-rotate(${c.hue}deg) saturate(${c.sat}%) brightness(${c.light}%)` : "none");
}

function setupColor(range, color) {
  colorRange = range;
  for (const key of COLOR_KEYS) {
    const input = colorInput(key);
    [input.min, input.max] = range[key];
    input.value = String(color?.[key] ?? range[key][2]);
    input.addEventListener("input", () => {
      showColor();
      window.pickerApi.setColor(readColor(), false);
    });
    input.addEventListener("change", () => window.pickerApi.setColor(readColor(), true));
  }
  document.getElementById("color-reset").addEventListener("click", () => {
    for (const key of COLOR_KEYS) colorInput(key).value = String(range[key][2]);
    showColor();
    window.pickerApi.setColor(readColor(), true);
  });
  showColor();
}

window.pickerApi.list().then((got) => {
  entries = got.entries;
  current = got.current;
  document.title = got.title; // 有好幾隻桌寵時，標題會寫這次是在幫第幾隻挑
  setupColor(got.colorRange, got.color);
  render();
});
