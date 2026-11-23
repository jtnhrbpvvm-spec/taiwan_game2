// 每小時收益視窗，兩個分頁：
//   每小時明細：一個整點到整點一列，最新的在最上面；收入綠字、支出紅字
//   這段時間拿到的東西：打怪掉了什麼、各幾個，被自動賣掉的在名稱後面標（賣出）
const rows = document.getElementById("rows");
const foot = document.getElementById("foot");
const table = document.getElementById("table");
const empty = document.getElementById("empty");
const since = document.getElementById("since");
const range = document.getElementById("range");
const itemRows = document.getElementById("item-rows");
const itemFoot = document.getElementById("item-foot");
const itemTable = document.getElementById("item-table");
const itemEmpty = document.getElementById("item-empty");

const REFRESH_MS = 3000;
const ICON_SIZE = 24;
const COLUMNS = [
  ["hunt", "income"],
  ["sales", "income"],
  ["potions", "expense"],
  ["pets", "expense"],
  ["misc", "expense"],
];

let atlas; // 物品圖示圖集 { url, cell, cols }
let data;

const number = (n) => Math.round(n).toLocaleString("zh-TW");
const clock = (ms) => new Date(ms).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
const hourLabel = (h) => `${clock(h.start)}～${clock(h.start + 36e5)}`;

function cell(tr, text, cls) {
  const td = document.createElement("td");
  td.textContent = text;
  if (cls) td.className = cls;
  tr.append(td);
  return td;
}

// ── 每小時明細 ────────────────────────────────────────────

function hourRow(label, h) {
  const tr = document.createElement("tr");
  cell(tr, label);
  for (const [key, kind] of COLUMNS) cell(tr, h[key] ? (kind === "expense" ? "−" : "") + number(h[key]) : "0", h[key] ? kind : "");
  cell(tr, (h.net > 0 ? "+" : h.net < 0 ? "−" : "") + number(Math.abs(h.net)), h.net < 0 ? "minus" : h.net > 0 ? "income" : "");
  return tr;
}

function renderHours() {
  const has = data.hours.length > 0;
  table.hidden = !has;
  empty.hidden = has;
  if (!has) return;
  const list = [...data.hours].reverse();
  rows.replaceChildren(
    ...list.map((h, i) => {
      const tr = hourRow(hourLabel(h), h);
      if (i === 0) tr.className = "now";
      return tr;
    })
  );
  foot.replaceChildren(hourRow("合計", data.total), hourRow("平均每小時", data.average));
}

// ── 這段時間拿到的東西 ────────────────────────────────────

/** 時段下拉選單：全部，加上每個小時。資料更新時保留使用者原本選的那一個。 */
function renderRange() {
  const chosen = range.value || "all";
  const options = [["all", "從開啟桌寵到現在"], ...[...data.hours].reverse().map((h) => [String(h.start), hourLabel(h)])];
  range.replaceChildren(
    ...options.map(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    })
  );
  range.value = options.some(([value]) => value === chosen) ? chosen : "all";
}

function itemRow(item) {
  const tr = document.createElement("tr");
  const first = cell(tr, "");
  const icon = document.createElement("i");
  if (atlas && item.icon !== undefined) {
    const zoom = ICON_SIZE / atlas.cell;
    icon.style.backgroundImage = `url(${atlas.url})`;
    icon.style.backgroundSize = `${atlas.cols * ICON_SIZE}px auto`;
    icon.style.backgroundPosition = `-${(item.icon % atlas.cols) * atlas.cell * zoom}px -${Math.floor(item.icon / atlas.cols) * atlas.cell * zoom}px`;
  }
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = item.name;
  first.append(icon, name);
  if (item.sold > 0) {
    const sold = document.createElement("span");
    sold.className = "sold";
    // 賣掉的數量可能比這段時間拿到的多（賣的是之前囤的），那也算全部賣出
    sold.textContent = item.sold >= item.got ? "（賣出）" : `（賣出 ${number(item.sold)} 個）`;
    first.append(sold);
    if (item.sold >= item.got) tr.className = "all-sold";
  }
  cell(tr, `×${number(item.got)}`);
  cell(tr, number(item.sell));
  cell(tr, number(item.sell * item.got));
  return tr;
}

function renderItems() {
  renderRange();
  const source = range.value === "all" ? data.total : data.hours.find((h) => String(h.start) === range.value);
  // 只列「拿到」的；單純賣掉以前囤貨、這段時間沒掉的不算這段時間拿到的東西
  const items = (source?.items ?? []).filter((item) => item.got > 0);
  itemTable.hidden = items.length === 0;
  itemEmpty.hidden = items.length > 0;
  itemRows.replaceChildren(...items.map(itemRow));
  const tr = document.createElement("tr");
  cell(tr, `合計 ${items.length} 種`);
  cell(tr, `×${number(items.reduce((sum, item) => sum + item.got, 0))}`);
  cell(tr, "");
  cell(tr, number(items.reduce((sum, item) => sum + item.sell * item.got, 0)));
  itemFoot.replaceChildren(tr);
}

// ── 分頁、更新 ────────────────────────────────────────────

function showTab(tab) {
  for (const button of document.querySelectorAll("nav button")) button.classList.toggle("on", button.dataset.tab === tab);
  document.getElementById("tab-hours").hidden = tab !== "hours";
  document.getElementById("tab-items").hidden = tab !== "items";
}

async function refresh() {
  data = await window.incomeApi.get();
  since.textContent = `從 ${clock(data.startedAt)} 開啟桌寵到現在・有在掛機的時間 ${Math.floor(data.total.activeMs / 60000)} 分鐘`;
  renderHours();
  renderItems();
}

document.querySelector("nav").addEventListener("click", (e) => e.target.dataset.tab && showTab(e.target.dataset.tab));
range.addEventListener("change", renderItems);
window.incomeApi.onTab(showTab);
showTab("hours");

window.incomeApi.getItemAtlas().then((got) => {
  if (got) atlas = { url: URL.createObjectURL(new Blob([got.image], { type: "image/webp" })), cell: got.cell, cols: got.cols };
  if (data) renderItems();
});
refresh();
setInterval(refresh, REFRESH_MS);
