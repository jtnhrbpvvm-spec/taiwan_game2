// 選擇桌寵外觀：列出遊戲裡所有有動畫表的怪物跟戰寵，點一下桌面上的桌寵就立刻換。
// 縮圖是每張動畫表的待機第一格，捲到看得見才去載（全部約四百多張，一次全載太慢）。
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const follow = document.getElementById("follow");

const MAX_SHOWN = 120; // 沒搜尋時不用把四百多張卡片全畫出來
const THUMB = 80;

let entries = [];
let current = null; // 目前選的動畫表；null＝跟著在打的怪物
// 不能當桌寵的：遊戲站上沒有圖，或只有一格靜態圖、沒有走路動畫（箱子、礦石、樹那類）。
// 要載了動畫表才知道，所以發現一個就把卡片拿掉並記下來，下次打開直接不列。
const UNUSABLE_KEY = "picker.unusable";
const missing = new Set();
try {
  for (const model of JSON.parse(localStorage.getItem(UNUSABLE_KEY)) ?? []) missing.add(model);
} catch {}

const thumbLoader = new IntersectionObserver((seen) => {
  for (const s of seen) {
    if (!s.isIntersecting) continue;
    thumbLoader.unobserve(s.target);
    drawThumb(s.target);
  }
});

async function drawThumb(card) {
  const got = await window.pickerApi.getSprite(card.dataset.model);
  if (!got?.meta.layout?.idle || !got.meta.layout.walk) {
    // 連不上遊戲站（got 是 null）可能只是暫時的，這種不記下來
    missing.add(card.dataset.model);
    if (got) localStorage.setItem(UNUSABLE_KEY, JSON.stringify([...missing]));
    card.remove();
    empty.hidden = list.children.length > 0;
    return;
  }
  const image = await createImageBitmap(new Blob([got.image]));
  const cell = image.width / got.meta.cols;
  const f = got.meta.layout.idle.from;
  const canvas = card.querySelector("canvas");
  canvas.getContext("2d").drawImage(image, (f % got.meta.cols) * cell, Math.floor(f / got.meta.cols) * cell, cell, cell, 0, 0, canvas.width, canvas.height);
  image.close();
}

function markCurrent() {
  follow.classList.toggle("on", current === null);
  for (const card of list.children) card.classList.toggle("on", card.dataset.model === current);
}

function render() {
  const q = search.value.trim().toLowerCase();
  const shown = entries.filter((e) => !missing.has(e.model) && (!q || e.search.toLowerCase().includes(q))).slice(0, MAX_SHOWN);
  thumbLoader.disconnect();
  list.replaceChildren(
    ...shown.map((e) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.dataset.model = e.model;
      card.title = e.search;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = THUMB * 2;
      const name = document.createElement("span");
      name.textContent = e.name;
      const group = document.createElement("small");
      group.textContent = e.group;
      card.append(canvas, name, group);
      if (missing.has(e.model)) card.classList.add("missing");
      thumbLoader.observe(card);
      return card;
    })
  );
  empty.hidden = shown.length > 0;
  markCurrent();
}

function choose(model) {
  current = model;
  window.pickerApi.choose(model);
  markCurrent();
}

list.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card && !missing.has(card.dataset.model)) choose(card.dataset.model);
});
follow.addEventListener("click", () => choose(null));
search.addEventListener("input", render);

window.pickerApi.list().then((got) => {
  entries = got.entries;
  current = got.current;
  document.title = got.title; // 有好幾隻桌寵時，標題會寫這次是在幫第幾隻挑
  // 目前選的那隻排最前面，一打開就看得到
  entries.sort((a, b) => (b.model === current) - (a.model === current));
  render();
});
