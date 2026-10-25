// 自我測試：npm run selftest（electron . --selftest）。
// 用一個全新的暫存資料夾（main.js 開頭改 userData），不會碰到平常用的桌寵設定、帳號和遊戲存檔。
// 不會真的登入任何帳號（不送出帳號密碼到遊戲伺服器）：登入只檢查表單找不找得到，帳號檔只測本機加密。
// 在線上版遊戲建一個訪客角色 → 確認桌寵讀得到存檔 → 重新載入確認自動繼續冒險 → 兩隻桌寵兩個獨立的遊戲 → 選單、外觀、帳號、說明視窗。
// 截圖存在暫存資料夾的 shots/，結果印在主控台，最後自己結束。
const fs = require("fs");
const path = require("path");
const { app, BrowserWindow } = require("electron");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const screenOf = (t, g) => t.inGame(g, `document.querySelector(".screen.active")?.id`);

async function waitFor(what, fn, timeoutMs = 60000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(500);
  }
  throw new Error(`等不到：${what}`);
}

async function run(t) {
  const shots = path.join(app.getPath("userData"), "shots");
  fs.mkdirSync(shots, { recursive: true });
  const shot = async (win, name) => fs.writeFileSync(path.join(shots, `${name}.png`), (await win.webContents.capturePage()).toPNG());
  const results = [];
  const check = (name, ok, detail = "") => {
    results.push(ok);
    console.log(`${ok ? "[OK]  " : "[FAIL]"} ${name}${detail ? "：" + detail : ""}`);
  };
  const g0 = t.games[0];
  try {
    // 測試中不要自動把沒有角色的遊戲視窗叫出來
    t.settings().autoContinue = false;
    await waitFor("標題畫面", async () => (await screenOf(t, g0)) === "screen-title");
    check("遊戲載入到標題畫面", true);

    // 建一個訪客角色（跟玩家在畫面上按按鈕一樣，只呼叫事件字串用的頂層函式）
    await t.inGame(g0, `openCreate()`);
    await sleep(800);
    await t.inGame(g0, `(() => {
      selectClass("mage");
      document.getElementById("create-name").value = "桌寵測試";
      // 每一項輪流加一點，加到點數用完（單項滿了按鈕不會變灰，只是按了沒反應）
      for (let round = 0; round < 30; round++) {
        for (let i = 0; i < 6; i++) document.querySelectorAll("#create-stats button:not(.secondary)")[i]?.click();
      }
      confirmCreate();
    })()`);
    await waitFor("進入遊戲畫面", async () => (await screenOf(t, g0)) === "screen-game");
    // 存檔是遊戲建角色時馬上寫的，桌寵 3 秒讀一次
    const s = await waitFor("桌寵讀到角色", () => g0.lastState, 20000);
    check("解開存檔讀到角色", s.name === "桌寵測試" && s.cls === "mage" && s.level === 1 && s.account === "訪客（不登入）", JSON.stringify(s));
    await sleep(3000); // 讓桌寵換成法師的外觀
    await shot(t.petWin, "pet");

    // 事件比對
    const prev = { level: 5, exp: 100, gold: 50, bag: { redPotion: 2 } };
    const ev = t.diffEvents(prev, { level: 5, exp: 180, gold: 90, bag: { redPotion: 5, dagger: 1, unknownThing: 1 } });
    check("經驗／金幣／掉寶事件", ev.length === 4 && ev[0].kind === "exp" && ev[0].n === 80 && ev[1].n === 40 && ev.some((e) => e.kind === "loot"), JSON.stringify(ev));
    const up = t.diffEvents(prev, { level: 6, exp: 10, gold: 50, bag: {} });
    check("升級事件", up.length === 1 && up[0].kind === "levelup" && up[0].level === 6);

    // 重新載入：要自動按「繼續冒險」
    t.settings().autoContinue = true;
    g0.win.reload();
    await sleep(2000);
    await waitFor("自動繼續冒險", async () => (await screenOf(t, g0)) === "screen-game", 40000);
    check("重新載入後自動繼續冒險", true);
    t.settings().autoContinue = false;
    g0.win.show();
    await sleep(1500);
    await shot(g0.win, "game");
    g0.win.hide();
    check("遊戲視窗藏起來時靜音", g0.win.webContents.isAudioMuted());

    // 兩隻桌寵：第二隻是另一個遊戲視窗、另一份登入資料，看不到第一隻的角色
    t.setPetCount(2);
    const g1 = t.games[1];
    check("第二隻有自己的遊戲視窗", t.games.length === 2 && g1.win !== g0.win && g1.partition !== g0.partition, `${g0.partition} / ${g1.partition}`);
    await waitFor("第二隻的標題畫面", async () => (await screenOf(t, g1)) === "screen-title");
    const otherSave = await t.inGame(g1, `Object.keys(localStorage).filter((k) => k.startsWith("dragonSlayer_save")).length`);
    check("第二隻的存檔跟第一隻分開", otherSave === 0, `第二隻有 ${otherSave} 個存檔`);

    // 登入表單找得到（只打開、檢查、按取消，不送出）
    await waitFor("雲端連線", () => t.inGame(g1, `(() => { const b = document.getElementById("btn-cloud"); return !!b && !b.classList.contains("hidden") && !b.textContent.includes("連線中"); })()`), 30000);
    const form = await t.inGame(g1, `(() => {
      document.getElementById("btn-cloud").click();
      const ok = !!document.getElementById("cloud-email") && !!document.getElementById("cloud-pass")
        && [...document.querySelectorAll("#dialog-layer .dialog-btns button")].some((b) => b.textContent.trim() === "登入");
      [...document.querySelectorAll("#dialog-layer .dialog-btns button")].find((b) => b.textContent.trim() === "取消")?.click();
      return ok;
    })()`);
    check("找得到遊戲的登入表單（Email、密碼、登入按鈕）", form === true);

    // 帳號檔：新增的密碼要加密、手寫的明文要自動轉成加密
    const added = t.accounts.save({ label: "測試帳號", email: "pet-selftest@example.invalid", password: "not-a-real-password" });
    const text1 = fs.readFileSync(t.accounts.file(), "utf8");
    check("新增帳號：檔案裡沒有明文密碼、讀得回來", !!added.id && !text1.includes("not-a-real-password") && t.accounts.password(added.id) === "not-a-real-password");
    const list = JSON.parse(text1);
    list.push({ label: "手寫", email: "hand@example.invalid", password: "hand-written-pass" });
    fs.writeFileSync(t.accounts.file(), JSON.stringify(list));
    t.accounts.load();
    const text2 = fs.readFileSync(t.accounts.file(), "utf8");
    const hand = t.accounts.list().find((a) => a.email === "hand@example.invalid");
    check("手寫明文密碼自動轉成加密", !!hand && !text2.includes("hand-written-pass") && t.accounts.password(hand.id) === "hand-written-pass");

    // 換帳號＝換一個遊戲視窗（自動登入已在上面關掉，這裡不會真的去登入）
    t.setPetAccount(1, added.id);
    check("第二隻換帳號後用該帳號自己的登入資料", t.games[1].partition === `persist:acct-${added.id}` && t.games[1] !== g1);
    const labels = t.buildMenu(1).items.map((i) => i.label).filter(Boolean);
    check("右鍵選單有帳號、沒有說話／撫摸功能", labels.some((l) => l.startsWith("帳號（第 2 隻）：測試帳號")) && !labels.some((l) => /說話|摸|黑店|GM|書籤|收益|存檔管理/.test(l)), labels.join("、"));
    t.setPetAccount(0, added.id);
    check("同一個帳號只給一隻用", t.settings().petAccounts[0] === added.id && t.settings().petAccounts[1] === null);
    t.setPetAccount(0, null);

    t.openAccounts();
    await sleep(1500);
    await shot(t.getAccountsWin(), "accounts");
    const rows = await t.getAccountsWin().webContents.executeJavaScript(`document.querySelectorAll("#pets select").length + "/" + document.querySelectorAll("#list .row").length`);
    check("帳號管理視窗列出 2 隻桌寵、2 個帳號", rows === "2/2", rows);
    t.getAccountsWin().close();

    // 遊戲更新：記下載入的版本，線上版本號不一樣時提醒並出現「套用遊戲更新」
    const online = await t.updates.fetchGameVersion();
    const g0now = t.games[0];
    await waitFor("記下遊戲版本", () => g0now.version, 20000).catch(() => {});
    check("記下遊戲視窗載入的版本", !!online && g0now.version === online, `線上 ${online}／載入 ${g0now.version}`);
    const speechOn = () => t.petWin.webContents.executeJavaScript(`document.getElementById("speech").classList.contains("on") && document.getElementById("speech").textContent`);
    g0now.version = "舊版測試";
    await t.updates.checkGame();
    await sleep(500);
    const gameMenu = t.buildMenu(0).items.map((i) => i.label);
    const spoken = await speechOn();
    check("遊戲有更新時跳提醒、選單出現套用更新", gameMenu.some((l) => l?.startsWith("⬆ 套用遊戲更新")) && /黑暗大陸更新了/.test(spoken || ""), `${spoken}`);
    await shot(t.petWin, "update-say");
    check("選單有檢查更新", gameMenu.some((l) => l?.startsWith("檢查更新（桌寵 v")));
    // 勿擾（專注模式）：不跳對話，解除後才補講
    t.setClickThrough(true);
    await sleep(500);
    t.say("勿擾測試");
    await sleep(800);
    const during = await speechOn();
    t.setClickThrough(false);
    await sleep(3500);
    const after = await speechOn();
    check("勿擾時不跳對話、解除後補講", !during && after === "勿擾測試", `勿擾中：${during}／解除後：${after}`);

    t.setPetCount(3);
    t.setStay(true, 1);
    await sleep(3000);
    await shot(t.petWin, "pets3");
    check("三隻桌寵三個遊戲", (await t.petWin.webContents.executeJavaScript(`document.querySelectorAll("canvas.pet").length`)) === 3 && t.games.length === 3);
    t.setPetCount(1);
    check("減少桌寵時關掉多的遊戲", t.games.length === 1 && BrowserWindow.getAllWindows().filter((w) => w.webContents.session.storagePath?.includes("Partitions")).length === 1);
    t.openPicker(0);
    await waitFor("外觀縮圖", () => t.getPicker().webContents.executeJavaScript(`[...document.querySelectorAll(".card canvas")].every((c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0))`), 60000).catch(() => {});
    await shot(t.getPicker(), "picker");
    const cards = await t.getPicker().webContents.executeJavaScript(`document.querySelectorAll(".card").length`);
    check("外觀清單有 12 個職業", cards === 12, String(cards));
    t.getPicker().close();
    t.openHelp();
    await sleep(1000);
    await shot(t.getHelp(), "help");
    t.getHelp().close();
  } catch (e) {
    const where = await t.inGame(g0, `[document.querySelector(".screen.active")?.id, document.getElementById("dialog-layer")?.innerText?.slice(0, 200)].join(" | ")`);
    check("測試中斷", false, `${e.message}（第一隻遊戲畫面：${where}）`);
    if (!g0.win.isDestroyed()) {
      g0.win.show();
      await sleep(1000);
      await shot(g0.win, "fail");
    }
  }
  const ok = results.every(Boolean);
  console.log(ok ? "SELFTEST PASSED" : "SELFTEST FAILED");
  console.log(`截圖：${shots}`);
  t.quit();
}

module.exports = { run };
