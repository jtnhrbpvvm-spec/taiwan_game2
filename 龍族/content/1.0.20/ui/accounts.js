"use strict";
const $ = (id) => document.getElementById(id);
const api = window.accountsApi;

function msg(text, cls = "") {
  $("msg").className = cls;
  $("msg").textContent = text;
}

const statusText = { connecting: "連線中…", login: "尚未登入", ingame: "已登入", kicked: "被踢下線", expired: "登入過期", closed: "已斷線" };
async function act(request) {
  try {
    const result = await request;
    if (result.accounts) render(result);
    if (result.error) msg(result.error, "warn");
  } catch { msg("操作未完成，請再試一次", "warn"); }
}
function button(text, cls, fn, disabled = false) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = text; b.className = cls; b.disabled = disabled;
  b.addEventListener("click", fn);
  return b;
}
function render({ accounts, pets = [], maxPets = 5 }) {
  $("pet-count").textContent = `（${pets.length}/${maxPets}）`;
  const legacy = pets.find(p => p.accountId === null);
  $("legacy").replaceChildren();
  if (legacy) {
    const row = document.createElement("div"); row.className = "acct";
    const text = document.createElement("span"); text.className = "who";
    text.textContent = `舊版登入・${legacy.character || statusText[legacy.status] || legacy.status}`;
    row.append(text, button("顯示遊戲", "", () => act(api.showGame(null))), button("關閉桌寵", "", () => act(api.close(null))));
    $("legacy").append(row);
  }
  const list = $("list");
  if (!accounts.length) {
    list.innerHTML = `<div class="hint">還沒有記住任何帳號，在下面新增。</div>`;
    return;
  }
  list.replaceChildren(...accounts.map((a) => {
    const pet = pets.find(p => p.accountId === a.id);
    const row = document.createElement("div");
    row.className = `acct${pet ? " current" : ""}`;
    const who = document.createElement("div");
    who.className = "who";
    const name = document.createElement("b");
    name.textContent = a.label || a.username;
    const small = document.createElement("small");
    small.textContent = `${a.label ? `${a.username}・` : ""}${a.hasPassword ? "已存密碼" : "沒存密碼"}`;
    who.append(name, small);
    const state = document.createElement("small");
    state.textContent = pet ? `${pet.loggingIn ? "Chrome 登入中・" : ""}${statusText[pet.status] || pet.status}${pet.character ? `・Lv.${pet.level ?? "?"} ${pet.character}` : ""}` : "桌寵未開啟";
    who.append(state);
    const btn = button;
    row.append(who);
    if (pet) {
      row.append(btn(pet.loggingIn ? "登入好了" : "重新登入", "main", () => act(pet.loggingIn ? api.finishLogin(a.id) : api.login(a.id))));
      row.append(btn("遊戲", "", () => act(api.showGame(a.id))));
      row.append(btn("關閉桌寵", "", () => act(api.close(a.id))));
    } else row.append(btn("開啟桌寵", "main", () => act(api.use(a.id)), pets.length >= maxPets));
    row.append(btn("修改", "", () => edit(a)));
    row.append(btn("刪除", "danger", async () => {
      if (!confirm(`確定刪除「${a.label || a.username}」？（只刪桌寵記住的帳號密碼，不會動到遊戲帳號）`)) return;
      await act(api.remove(a.id));
    }));
    return row;
  }));
}

function edit(a) {
  $("form-title").textContent = a ? `修改「${a.label || a.username}」` : "新增帳號";
  $("f-id").value = a?.id ?? "";
  $("f-user").value = a?.username ?? "";
  $("f-label").value = a?.label ?? "";
  $("f-pass").value = "";
  $("f-pass").placeholder = a?.hasPassword ? "不改密碼就留空" : "";
  $("f-cancel").hidden = !a;
  msg("");
}

$("f-cancel").addEventListener("click", () => edit(null));
$("f-save").addEventListener("click", async () => {
  const r = await api.save({ id: $("f-id").value || undefined, username: $("f-user").value, password: $("f-pass").value, label: $("f-label").value });
  if (r.error) return msg(r.error, "warn");
  render(r);
  edit(null);
  msg(`已儲存「${r.account.label || r.account.username}」${r.account.hasPassword ? "" : "（沒存密碼）"}`, "ok");
});

api.onChanged(render);
api.list().then(render);
