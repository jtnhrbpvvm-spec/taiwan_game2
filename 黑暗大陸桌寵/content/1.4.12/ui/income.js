// 收入總覽：每隻桌寵（每個帳號）這次打開以來的經驗、金幣、打怪數、拿到和賣出的東西。每 3 秒更新一次。
const view = document.getElementById("view");
const tabs = document.getElementById("tabs");
let current = 0;
let data;

const num = (n) => Math.round(n).toLocaleString("zh-TW");
const signed = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + num(Math.abs(n));
const clock = (ms) => new Date(ms).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

function stat(label, value, cls = "") {
  return el("div", { className: "stat" }, el("i", { textContent: label }), el("b", { className: cls, textContent: value }));
}

function table(head, rows) {
  if (rows.length === 0) return el("p", { className: "empty", textContent: "還沒有" });
  return el("table", {}, el("tr", {}, ...head.map((h) => el("th", { textContent: h }))), ...rows.map((r) => el("tr", {}, ...r.map((c) => el("td", { textContent: c })))));
}

function render() {
  const pets = data.pets;
  if (current >= pets.length) current = 0;
  tabs.hidden = pets.length < 2;
  tabs.replaceChildren(...pets.map((p, i) => {
    const b = el("button", { type: "button", className: i === current ? "on" : "", textContent: `第 ${i + 1} 隻・${p.account}` });
    b.addEventListener("click", () => {
      current = i;
      render();
    });
    return b;
  }));
  const p = pets[current];
  const minutes = Math.max(0, Math.floor((Date.now() - p.startedAt) / 60000));
  document.getElementById("since").textContent = `從 ${clock(p.startedAt)} 到現在（${Math.floor(minutes / 60)} 小時 ${minutes % 60} 分）`;
  const c = p.character;
  const who = el("p", { className: "who" }, c ? `Lv.${c.level} ${c.name}` : "還沒讀到角色",
    el("small", { textContent: [c && data.classes[c.cls], pets.length > 1 ? "" : p.account].filter(Boolean).join("・") }));
  const obtained = Object.entries(p.obtained).sort((a, b) => b[1] - a[1]);
  const sold = Object.entries(p.sold).sort((a, b) => b[1].gold - a[1].gold);
  view.replaceChildren(
    who,
    el("div", { className: "stats" },
      stat("經驗", signed(p.exp) + (p.levels ? `（升 ${p.levels} 級）` : ""), p.exp > 0 ? "plus" : ""),
      stat("金幣淨增減", signed(p.gold), p.gold > 0 ? "gold" : p.gold < 0 ? "minus" : ""),
      stat("自動賣出所得", signed(p.soldGold), p.soldGold > 0 ? "gold" : ""),
      stat("打怪數", num(p.kills)),
      stat("死亡", num(p.deaths), p.deaths > 0 ? "minus" : ""),
      stat("每小時經驗", minutes >= 1 ? num((p.exp / minutes) * 60) : "—"),
    ),
  );
  // 目前地圖（#zone-wrap）排在數字下面、清單上面
  document.getElementById("lists").replaceChildren(
    el("h2", { textContent: `拿到的東西（${obtained.length} 種）` }),
    table(["物品", "數量"], obtained.map(([name, n]) => [name, `×${num(n)}`])),
    el("h2", { textContent: `自動賣出（${sold.length} 種）` }),
    table(["物品", "數量", "賣得"], sold.map(([name, s]) => [name, `×${num(s.n)}`, num(s.gold)])),
  );
  // 目前地圖：位置變了才重畫（每 3 秒更新一次，不要讓捲動位置一直跳）
  const key = `${current}:${JSON.stringify(p.here)}`;
  if (zoneBox.dataset.key !== key) {
    zoneBox.dataset.key = key;
    zoneBox.innerHTML = !window.zoneGuideHtml ? '<p class="dim">沒有地圖資料。</p>'
      : p.here ? window.zoneGuideHtml(p.here) : '<p class="dim">還沒進入遊戲，讀不到角色在哪。</p>';
  }
}

// 目前地圖的怪物分布、可獲得物品（資料來自黑暗大陸攻略）；「看攻略」和說明視窗裡的攻略連結用瀏覽器開
// 點物品／怪物／書名跳出的說明視窗由 zones.js 自己處理
const zoneBox = document.getElementById("zone");
window.zoneGuideOpenUrl = (url) => window.incomeApi.openGuide(url);
zoneBox.addEventListener("click", (e) => {
  const link = e.target.closest("[data-guide]");
  if (!link) return;
  e.preventDefault();
  window.incomeApi.openGuide(link.dataset.guide);
});

// 重置：目前這頁（這隻）的統計歸零，從現在重新記
document.getElementById("reset").addEventListener("click", async () => {
  if (!data?.pets?.length) return;
  const p = data.pets[current];
  const who = data.pets.length > 1 ? `第 ${current + 1} 隻（${p.account}）` : "";
  if (!confirm(`確定要把${who}的收入統計歸零，從現在重新記嗎？`)) return;
  await window.incomeApi.reset(p.index);
  refresh();
});

async function refresh() {
  data = await window.incomeApi.get();
  if (data?.pets?.length) render();
}
refresh();
setInterval(refresh, 3000);
