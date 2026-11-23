// 存檔管理：匯出成檔案、從檔案匯入、轉移碼（產生／使用）。
// 匯入（檔案或轉移碼）都會先跳確認框列出裡面的角色，按「匯入」才真的蓋掉桌寵裡的存檔。
const $ = (id) => document.getElementById(id);

function say(id, text, kind = "") {
  const el = $(id);
  el.textContent = text;
  el.className = `msg ${kind}`;
}

/** 按鈕按下去到結果回來之間先鎖住，免得連按。 */
async function busy(button, work) {
  button.disabled = true;
  try {
    return await work();
  } finally {
    button.disabled = false;
  }
}

// ── 匯出 ──────────────────────────────────────────────────

$("export").addEventListener("click", () =>
  busy($("export"), async () => {
    const r = await window.savesApi.exportToFile();
    if (r.error) say("export-msg", r.error, "bad");
    else if (r.path) say("export-msg", `已匯出到 ${r.path}`, "ok");
  })
);

// ── 匯入前的確認 ──────────────────────────────────────────

let confirmMsg; // 確認框的結果要顯示在哪一個訊息欄

function askImport(staged, msgId) {
  confirmMsg = msgId;
  $("confirm-from").textContent = `來源：${staged.from}`;
  $("confirm-list").replaceChildren(
    ...(staged.characters.length ? staged.characters : ["（裡面沒有角色）"]).map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    })
  );
  $("confirm-warn").textContent = staged.willOverwrite ? "桌寵裡現在的存檔會被整份蓋掉，沒辦法復原。要保留的話先取消，匯出一份再來。" : "";
  $("confirm").classList.add("on");
}

$("confirm-no").addEventListener("click", () => {
  window.savesApi.cancelImport();
  $("confirm").classList.remove("on");
  say(confirmMsg, "已取消，沒有匯入。");
});
$("confirm-yes").addEventListener("click", () =>
  busy($("confirm-yes"), async () => {
    const r = await window.savesApi.confirmImport();
    $("confirm").classList.remove("on");
    if (r.error) say(confirmMsg, r.error, "bad");
    else say(confirmMsg, "匯入完成，遊戲已經重新載入。角色如果在村莊，到遊戲視窗按「出發」。", "ok");
  })
);

/** 檔案跟轉移碼共用：把讀到的結果交給確認框，或顯示錯誤。 */
function handleStaged(r, msgId) {
  if (r.canceled) return;
  if (r.error) say(msgId, r.error, "bad");
  else {
    say(msgId, "");
    askImport(r, msgId);
  }
}

$("import").addEventListener("click", () => busy($("import"), async () => handleStaged(await window.savesApi.pickFile(), "import-msg")));

// ── 轉移碼 ────────────────────────────────────────────────

$("make-code").addEventListener("click", () =>
  busy($("make-code"), async () => {
    say("make-msg", "上傳中…");
    const r = await window.savesApi.makeCode();
    if (r.error) {
      $("code-box").classList.remove("on");
      say("make-msg", r.error, "bad");
      return;
    }
    $("code").textContent = r.code;
    $("code-box").classList.add("on");
    say("make-msg", "24 小時內在另一台裝置輸入這六碼。", "ok");
  })
);

$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("code").textContent);
  say("make-msg", "已複製。", "ok");
});

const useCode = () =>
  busy($("use-code"), async () => {
    const code = $("code-input").value.trim();
    if (!code) return say("use-msg", "先輸入轉移碼。", "bad");
    say("use-msg", "讀取中…");
    handleStaged(await window.savesApi.fetchCode(code), "use-msg");
  });
$("use-code").addEventListener("click", useCode);
$("code-input").addEventListener("keydown", (e) => e.key === "Enter" && useCode());
