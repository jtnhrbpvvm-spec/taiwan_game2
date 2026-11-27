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
  // 貼的道具：文字裡的 [名稱] 換成可以點的道具（點了看詳細內容，跟遊戲點聊天的道具一樣）
  const L = e.item && e.itemLabel;
  let mark = L ? `[${L.name}]` : "";
  let at = L ? e.text.indexOf(mark) : -1;
  if (L && at < 0) { mark = "[道具]"; at = e.text.indexOf(mark); }
  if (L && at < 0) { mark = ""; at = e.text.length; } // 文字裡沒有標記：道具放最後
  if (at >= 0) {
    div.append(document.createTextNode(e.text.slice(0, at)), itemButton(e.item, L, e.ch === 3 ? "" : e.name), document.createTextNode(e.text.slice(at + mark.length)));
  } else div.append(document.createTextNode(e.text));
  return div;
}
function labelText(L) {
  return `${L.rarity >= 0 && L.rarityName ? `${L.rarityName} ` : ""}${L.grade > 1 ? `G${L.grade} ` : ""}${L.name}${L.enh > 0 ? ` +${L.enh}` : ""}${L.damaged ? "（損壞）" : ""}${L.count > 1 ? ` ×${L.count}` : ""}`;
}
function itemButton(item, L, owner) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `item r${L.rarity >= 0 ? L.rarity : -1}`;
  b.textContent = `[${labelText(L)}]`;
  b.title = "看道具內容";
  b.addEventListener("click", () => showDetail(item, L, owner));
  return b;
}
async function showDetail(item, L, owner) {
  $("d-title").textContent = labelText(L);
  $("d-text").textContent = "讀取中…";
  $("detail").hidden = false;
  const r = await api.detail(item, owner || "");
  if (r?.text) {
    // 遊戲視窗的標題（XX 貼的道具）、關閉鈕不用再顯示一次
    const lines = r.text.split(/\n+/).map((s) => s.trim()).filter((s) => s && s !== "關閉" && !/貼的道具$/.test(s) && s !== "道具");
    $("d-text").textContent = lines.join("\n");
  } else $("d-text").textContent = `讀不到內容：${r?.error || "遊戲沒有回應"}`;
}
$("d-close").addEventListener("click", () => ($("detail").hidden = true));
$("detail").addEventListener("click", (ev) => { if (ev.target === $("detail")) $("detail").hidden = true; });

// ── 表情、角色表情、快捷語、貼道具（遊戲 beta-v1.2.2989 聊天框的功能） ──
let panel = "";
const say = (msg) => ($("msg").textContent = msg || "");
function insertText(s) {
  const t = $("text"), a = t.selectionStart ?? t.value.length, b = t.selectionEnd ?? a;
  const v = t.value.slice(0, a) + s + t.value.slice(b);
  if ([...v].length > 120) return say("訊息已達字數上限");
  t.value = v; t.focus(); t.setSelectionRange(a + s.length, a + s.length);
}
function btn(cls, content, title, onClick) {
  const b = document.createElement("button");
  b.type = "button"; if (cls) b.className = cls; if (title) b.title = title;
  if (typeof content === "string") b.textContent = content; else b.append(content);
  b.addEventListener("click", onClick);
  return b;
}
async function openPanel(name) {
  panel = panel === name ? "" : name;
  for (const b of $("tools").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.panel === panel));
  const box = $("panel");
  box.hidden = !panel;
  if (!panel) return;
  box.replaceChildren(Object.assign(document.createElement("div"), { className: "hint2", textContent: "讀取中…" }));
  const x = await api.extras();
  if (!x || x.error) { box.replaceChildren(Object.assign(document.createElement("div"), { className: "hint2", textContent: x?.error || "遊戲還沒載入" })); return; }
  const empty = (t) => Object.assign(document.createElement("div"), { className: "hint2", textContent: t });
  if (panel === "emoji") {
    const g = document.createElement("div"); g.className = "grid";
    g.append(...x.emoji.map(([c, n]) => btn("", c, n, () => insertText(c))));
    box.replaceChildren(x.emoji.length ? g : empty("這一版遊戲讀不到表情符號"));
  } else if (panel === "emote") {
    const g = document.createElement("div"); g.className = "grid";
    g.append(...x.emotes.map((e) => {
      const img = Object.assign(document.createElement("img"), { src: e.img, alt: e.name, draggable: false });
      return btn("", img, `${e.name}（/${e.cmd}）`, async () => { const r = await api.emote(e.no); say(r?.error ? `送不出去：${r.error}` : `做了表情：${e.name}`); });
    }));
    box.replaceChildren(empty("角色頭上做出表情動作（一般頻道，同房間的人看得到）"), x.emotes.length ? g : empty("這一版遊戲讀不到角色表情"));
  } else if (panel === "phrase") {
    const g = document.createElement("div"); g.className = "phr";
    g.append(...x.phrases.map((p, i) => btn("", p, "", async () => { const r = await api.say(i); say(r?.error ? `送不出去：${r.error}` : ""); })));
    box.replaceChildren(x.phrases.length ? g : empty("這一版遊戲讀不到快捷語"));
  } else if (panel === "item") {
    const g = document.createElement("div"); g.className = "list";
    g.append(...x.items.map((it) => {
      const span = document.createElement("span");
      span.className = `r${it.label && it.label.rarity >= 0 ? it.label.rarity : -1}`;
      span.textContent = it.label ? labelText(it.label) : "道具";
      const sub = Object.assign(document.createElement("span"), { className: "sub", textContent: it.where === 1 ? "身上" : "背包" });
      const frag = document.createDocumentFragment(); frag.append(span, sub);
      return btn("", frag, "貼到聊天", async () => {
        const ch = Number($("ch").value);
        const r = await api.postItem(it.where, it.index, ch, $("to").value.trim());
        say(r?.error ? `送不出去：${r.error}` : "");
      });
    }));
    box.replaceChildren(empty("點一件貼到下面選的頻道"), x.items.length ? g : empty("身上和背包都沒有道具"));
  }
}
for (const b of $("tools").querySelectorAll("button")) b.addEventListener("click", () => openPanel(b.dataset.panel));
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
