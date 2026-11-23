"use strict";
// 對話視窗：遊戲聊天的紀錄（分頁看頻道）、發話。點名字＝改成密語他。
const $ = (id) => document.getElementById(id);
const api = window.chatApi;
const CH = { 0: "一般", 1: "密語", 2: "國家", 3: "系統", 4: "公會", 5: "世界" };
const TABS = [["all", "全部"], [0, "一般"], [1, "密語"], [2, "國家"], [4, "公會"], [5, "世界"], [3, "系統"]];
let tab = "all", log = [], me = "";
const unread = new Set();

const time = (at) => new Date(at).toLocaleTimeString("zh-TW", { hour12: false, hour: "2-digit", minute: "2-digit" });
const show = (e) => tab === "all" || e.ch === tab;

function line(e) {
  const div = document.createElement("div");
  div.className = `line ch${e.ch}${e.me ? " me" : ""}`;
  const t = document.createElement("span");
  t.className = "t"; t.textContent = time(e.at);
  div.append(t);
  if (e.ch !== 0 && e.ch !== 1) { const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = `[${CH[e.ch] || e.ch}]`; div.append(tag); }
  if (e.name) {
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = e.ch === 1 ? (e.me ? `→ ${e.to || "?"}` : `${e.name} →我`) : `${e.gm ? "[GM] " : ""}${e.name}`;
    const target = e.ch === 1 && e.me ? e.to : e.name;
    if (target && target !== me) { who.title = `密語 ${target}`; who.addEventListener("click", () => whisper(target)); }
    div.append(who, document.createTextNode("："));
  }
  div.append(document.createTextNode(e.text));
  return div;
}
function renderTabs() {
  $("tabs").replaceChildren(...TABS.map(([v, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    b.setAttribute("aria-selected", String(v === tab));
    if (unread.has(v)) b.className = "unread";
    b.addEventListener("click", () => { tab = v; unread.delete(v); renderTabs(); renderLog(); });
    return b;
  }));
}
function renderLog() {
  const box = $("log");
  const list = log.filter(show);
  box.replaceChildren(...(list.length ? list.map(line) : [Object.assign(document.createElement("div"), { className: "empty", textContent: "還沒有對話。桌寵連上遊戲後收到的訊息會出現在這裡。" })]));
  box.scrollTop = box.scrollHeight;
}
function add(e) {
  log.push(e);
  if (log.length > 300) log.splice(0, log.length - 300);
  const box = $("log");
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  if (show(e)) {
    box.querySelector(".empty")?.remove();
    box.append(line(e));
    if (atBottom || e.me) box.scrollTop = box.scrollHeight;
  } else if (e.ch !== 3 && !e.me) { unread.add(e.ch); renderTabs(); }
}
function whisper(name) {
  $("ch").value = "1";
  $("to").value = name;
  syncTo();
  $("text").focus();
}
function syncTo() { $("to").hidden = $("ch").value !== "1"; }

$("ch").addEventListener("change", syncTo);
$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const text = $("text").value.trim();
  if (!text) return;
  const r = await api.send(text, Number($("ch").value), $("to").value.trim());
  $("msg").textContent = r?.error ? `送不出去：${r.error}` : "";
  if (!r?.error) $("text").value = "";
});
api.onNew(add);
(async () => {
  const s = await api.get();
  if (s) { log = s.log || []; me = s.name || ""; }
  renderTabs(); renderLog(); syncTo();
})();
