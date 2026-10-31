// 選擇要開的桌寵（右鍵「選擇要開的桌寵…」）：每個帳號一個勾選框，勾幾個就開幾隻、各自登入那個帳號；
// 也可以在這裡直接新增帳號（新增完自動勾起來）。按確認後，新勾的開起來、取消勾選的那隻結束（main.js 的 pets:apply）。
const listBox = document.getElementById("list");
const form = document.getElementById("form");
const field = (id) => document.getElementById(id);

let data; // { accounts, pets:[{ index, account }], max, autoContinue }
const checked = new Set(); // 勾起來的：帳號 id，或 "guest:第幾隻"（開著的訪客）、"guest:new"（再開一隻訪客）

const nameOf = (a) => a.label || a.email;
const runningOf = (id) => data.pets.find((p) => p.account === id);

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/** 一列：key＝checked 裡的值；running＝開著的話是第幾隻（0 起算）。 */
function row(key, title, sub, running) {
  const on = checked.has(key);
  const full = !on && checked.size >= data.max;
  const box = el("input", { type: "checkbox", checked: on, disabled: full });
  box.addEventListener("change", () => {
    if (box.checked) checked.add(key);
    else checked.delete(key);
    render();
  });
  // 右邊的小標籤：開著／按確認後會結束／按確認後會開
  const tag = running !== undefined
    ? el("span", { className: on ? "tag" : "tag stop", textContent: on ? `第 ${running + 1} 隻・開著` : `第 ${running + 1} 隻・會結束` })
    : on ? el("span", { className: "tag new", textContent: "會開" }) : "";
  return el("label", { className: full ? "row off" : "row" }, box, el("span", { className: "who", textContent: title }, el("small", { textContent: sub })), tag);
}

function render() {
  const rows = [
    ...data.accounts.map((a) => row(a.id, nameOf(a), a.label ? a.email : "", runningOf(a.id)?.index)),
    ...data.pets.filter((p) => !p.account).map((p) => row(`guest:${p.index}`, "訪客", "不登入", p.index)),
    row("guest:new", data.pets.some((p) => !p.account) ? "再開一隻訪客" : "訪客", "不登入"),
  ];
  listBox.replaceChildren(...(data.accounts.length ? [] : [el("div", { className: "empty", textContent: "還沒有帳號，用下面的表單新增；也可以先開訪客。" })]), ...rows);
  const n = checked.size;
  document.getElementById("count").textContent = `已勾 ${n} 隻（最多 ${data.max} 隻）`;
  const ok = document.getElementById("ok");
  ok.disabled = n === 0;
  ok.textContent = n ? `確認（開 ${n} 隻）` : "至少勾一隻";
  document.getElementById("auto-off").hidden = data.autoContinue;
}

function say(box, text, bad) {
  box.textContent = text;
  box.classList.toggle("bad", !!bad);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const r = await window.petsApi.saveAccount({ label: field("label").value, email: field("email").value, password: field("password").value });
  if (r.error) return say(field("form-msg"), r.error, true);
  form.reset();
  await load();
  if (checked.size < data.max) checked.add(r.id);
  say(field("form-msg"), checked.has(r.id) ? "已新增並勾起來" : `已新增（已經勾滿 ${data.max} 隻，沒有勾）`);
  render();
});

document.getElementById("cancel").addEventListener("click", () => window.close());
document.getElementById("ok").addEventListener("click", async () => {
  const ok = document.getElementById("ok");
  ok.disabled = true;
  say(field("msg"), "處理中…");
  const r = await window.petsApi.apply({
    accounts: data.accounts.map((a) => a.id).filter((id) => checked.has(id)),
    guests: data.pets.filter((p) => !p.account && checked.has(`guest:${p.index}`)).map((p) => p.index),
    newGuest: checked.has("guest:new"),
  });
  if (r.error) {
    say(field("msg"), r.error, true);
    ok.disabled = false;
    return;
  }
  say(field("msg"), [r.started && `開了 ${r.started} 隻`, r.stopped && `結束了 ${r.stopped} 隻`].filter(Boolean).join("、") || "沒有變動");
  setTimeout(() => window.close(), 1200);
});

async function load() {
  data = await window.petsApi.get();
}

// 一打開：開著的都勾起來
load().then(() => {
  for (const p of data.pets) checked.add(p.account ?? `guest:${p.index}`);
  render();
});
