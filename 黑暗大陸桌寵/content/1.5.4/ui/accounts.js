// 帳號管理：新增、修改、刪除帳號（Email＋密碼），以及指定每隻桌寵用哪個帳號。
// 密碼不會從主程式送回這裡；修改時密碼欄留空＝沿用原本的。
const petsBox = document.getElementById("pets");
const listBox = document.getElementById("list");
const form = document.getElementById("form");
const msg = document.getElementById("msg");
const field = (id) => document.getElementById(id);

let data;
let editing = null; // 正在修改的帳號 id；null＝新增

const nameOf = (a) => (a.label ? `${a.label}（${a.email}）` : a.email);

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function render() {
  petsBox.replaceChildren(
    // 現在開著的那幾隻（每隻是獨立的程式，編號可能不連續）
    ...data.pets.map((i) => {
      const current = data.petAccounts[i];
      const select = el("select", {}, el("option", { value: "", textContent: "訪客（不登入）" }),
        ...data.accounts.map((a) => el("option", { value: a.id, textContent: nameOf(a) })));
      select.value = current ?? "";
      select.addEventListener("change", () => window.accountsApi.assign(i, select.value || null));
      return el("div", { className: "row" }, el("b", { textContent: `第 ${i + 1} 隻` }), select);
    })
  );
  listBox.replaceChildren(
    ...(data.accounts.length
      ? data.accounts.map((a) => {
          const used = data.petAccounts.indexOf(a.id);
          const who = el("span", { className: "who", textContent: a.label || a.email },
            el("small", { textContent: [a.label && a.email, used >= 0 && `第 ${used + 1} 隻在用`, !a.hasPass && "沒有密碼"].filter(Boolean).join("・") }));
          const edit = el("button", { type: "button", textContent: "修改" });
          edit.addEventListener("click", () => startEdit(a));
          const del = el("button", { type: "button", className: "danger", textContent: "刪除" });
          del.addEventListener("click", async () => {
            if (del.dataset.sure !== "1") {
              del.dataset.sure = "1";
              del.textContent = "確定刪除？";
              setTimeout(() => {
                del.dataset.sure = "";
                del.textContent = "刪除";
              }, 3000);
              return;
            }
            await window.accountsApi.remove(a.id);
            if (editing === a.id) resetForm();
            refresh();
          });
          return el("div", { className: "row" }, who, edit, del);
        })
      : [el("div", { className: "empty", textContent: "還沒有帳號，用下面的表單新增。" })])
  );
  document.getElementById("enc").textContent = data.encrypted
    ? "帳號存在 accounts.json，密碼用 Windows 內建加密存放，只有這台電腦、這個 Windows 使用者解得開。也可以直接編輯檔案，密碼寫成 \"password\": \"…\"，下次開桌寵會自動轉成加密。"
    : "⚠️ 這台電腦不能用 Windows 內建加密，密碼會以明文存在 accounts.json，請注意不要把檔案給別人。";
  document.getElementById("enc").className = data.encrypted ? "note" : "warn";
}

function say(text, bad) {
  msg.textContent = text;
  msg.classList.toggle("bad", !!bad);
}

function startEdit(a) {
  editing = a.id;
  field("label").value = a.label;
  field("email").value = a.email;
  field("password").value = "";
  field("password").placeholder = "留空＝不改密碼";
  document.getElementById("form-title").textContent = `修改帳號：${a.label || a.email}`;
  document.getElementById("cancel").hidden = false;
  say("");
  field("email").focus();
}

function resetForm() {
  editing = null;
  form.reset();
  field("password").placeholder = "遊戲帳號的密碼";
  document.getElementById("form-title").textContent = "新增帳號";
  document.getElementById("cancel").hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const r = await window.accountsApi.save({ id: editing, label: field("label").value, email: field("email").value, password: field("password").value });
  if (r.error) {
    say(r.error, true);
    return;
  }
  say(editing ? "已修改" : "已新增，可以在上面指定給哪一隻桌寵用");
  resetForm();
  refresh();
});
document.getElementById("cancel").addEventListener("click", () => {
  resetForm();
  say("");
});
document.getElementById("folder").addEventListener("click", () => window.accountsApi.openFolder());

async function refresh() {
  data = await window.accountsApi.get();
  render();
}
window.accountsApi.onChanged(refresh);
refresh();
