// 自我測試：npm run selftest（electron . --selftest）。
// 用一個全新的暫存資料夾（main.js 開頭改 userData），不會碰到平常用的桌寵設定、帳號和遊戲存檔。
// 不會真的登入任何帳號（不送出帳號密碼到遊戲伺服器）：登入只檢查表單找不找得到，帳號檔只測本機加密。
// 在線上版遊戲建一個訪客角色 → 確認桌寵讀得到存檔 → 重新載入確認自動繼續冒險 → 換帳號 → 選單、外觀、帳號、說明視窗。
// 每隻桌寵是獨立的程式，這裡只跑第 1 隻；好幾隻同時開（啟動器、新增、結束、傳話）要實際開好幾個程式測。
// 截圖存在暫存資料夾的 shots/，結果印在主控台，最後自己結束。
const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, session } = require("electron");

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
    t.changeSettings((s) => (s.autoContinue = false));
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
    t.changeSettings((s) => (s.autoContinue = true));
    g0.win.reload();
    await sleep(2000);
    await waitFor("自動繼續冒險", async () => (await screenOf(t, g0)) === "screen-game", 40000);
    check("重新載入後自動繼續冒險", true);
    t.changeSettings((s) => (s.autoContinue = false));

    // ── 節約效能模式 ──
    // 不管開不開，遊戲一律回報看得見（回報在背景的話大地圖不找怪、不掉寶）；開著時只有藏著的遊戲解析度降低（devicePixelRatio 0.5）
    const vis = () => t.inGame(g0, `JSON.stringify({ hidden: document.hidden, dpr: devicePixelRatio })`);
    // getAppMetrics 的 CPU 是「上一次呼叫到這一次」的平均，先叫一次當起點
    const cpu = async (ms) => {
      const pids = { game: g0.win.webContents.getOSProcessId(), pet: t.petWin.webContents.getOSProcessId() };
      app.getAppMetrics();
      await sleep(ms);
      const m = app.getAppMetrics();
      const of = (pid) => m.find((x) => x.pid === pid)?.cpu?.percentCPUUsage ?? -1;
      const gpu = m.filter((x) => x.type === "GPU").reduce((s, x) => s + x.cpu.percentCPUUsage, 0);
      return `遊戲 ${of(pids.game).toFixed(1)}%・桌寵 ${of(pids.pet).toFixed(1)}%・GPU ${gpu.toFixed(1)}%`;
    };
    const visOff = await vis();
    const cpuOff = await cpu(6000);
    t.setPowerSave(true);
    await sleep(500);
    const visOnHidden = await vis();
    const cpuOn = await cpu(6000);
    // 計時器沒被節流：1.5 秒的計時器要準時到（被節流的背景分頁會拖到 1 秒一次以上，遊戲主迴圈就會變慢）
    const gameTicking = await t.inGame(g0, `(async () => { const s1 = Date.now(); let n = 0; const id = setInterval(() => n++, 100); await new Promise((r) => setTimeout(r, 1500)); clearInterval(id); return { ms: Date.now() - s1, ticks: n }; })()`);
    // 藏著的遊戲畫面迴圈要全速跑（沒顯示的視窗一秒只有 1～2 次，大地圖找怪的節奏會跟看著時不一樣）
    const rafHidden = await t.inGame(g0, `(async () => { let n = 0; const s = Date.now(); const f = () => { n++; if (Date.now() - s < 2000) requestAnimationFrame(f); }; requestAnimationFrame(f); await new Promise((r) => setTimeout(r, 2100)); return n / 2; })()`);
    check("藏著的遊戲畫面迴圈照常跑（每秒 30 次以上）", rafHidden >= 30, `${rafHidden} 次／秒`);
    t.showGame(g0, true);
    await sleep(500);
    const visShown = await vis();
    t.showGame(g0, false);
    await sleep(500);
    const visHiddenAgain = await vis();
    t.setPowerSave(false);
    await sleep(300);
    const visAfterOff = await vis();
    const [off, onHidden, shown, hiddenAgain, afterOff] = [visOff, visOnHidden, visShown, visHiddenAgain, visAfterOff].map((v) => JSON.parse(v));
    check("節約效能模式：遊戲永遠回報看得見", [off, onHidden, shown, hiddenAgain, afterOff].every((v) => v.hidden === false), JSON.stringify([off, onHidden, shown, hiddenAgain, afterOff]));
    check("節約效能模式：只有藏著時解析度降低，叫出來／關掉就恢復", onHidden.dpr === 0.5 && hiddenAgain.dpr === 0.5 && off.dpr > 0.5 && shown.dpr === off.dpr && afterOff.dpr === off.dpr,
      `一般 ${off.dpr}／藏著 ${onHidden.dpr}／叫出來 ${shown.dpr}／關掉 ${afterOff.dpr}`);
    check("節約效能模式：遊戲計時器照常跑（100ms 的計時器 1.5 秒內跑 13 次以上）", gameTicking?.ms < 1800 && gameTicking?.ticks >= 13, JSON.stringify(gameTicking));
    console.log(`       CPU 一般：${cpuOff}`);
    console.log(`       CPU 節約效能：${cpuOn}`);

    // ── 回報效能異常（只收集、不上傳）──
    const perf = await t.diagnostics.collect(t.diagnosticsContext(), 4000);
    const perfGame = perf.games[0];
    check("效能報告：讀到各程序 CPU、遊戲畫面格數、電腦規格", perf.processes.some((p) => p.name === "第 1 隻的遊戲") && perf.processes.some((p) => p.name === "桌寵畫面")
      && perfGame.framesPerSec > 0 && perfGame.callbacksPerSec >= perfGame.framesPerSec && perf.system.cores > 0 && perf.pet.rafFps > 0,
      JSON.stringify({ summary: perf.summary, game: { fps: perfGame.framesPerSec, cb: perfGame.callbacksPerSec, timer: perfGame.timerFramesPerSec }, pet: perf.pet.rafFps }));
    check("效能報告：不含帳號、Email、密碼", !/@|passEnc|password/i.test(JSON.stringify(perf)), JSON.stringify(perf).match(/.{0,60}(@|passEnc|password).{0,60}/i)?.[0] ?? "");
    // 高更新率螢幕上也不超過每秒 60 格（這台電腦是 60Hz 的話只能確認沒超過）
    check("遊戲畫面每秒最多 60 格", perfGame.framesPerSec <= 62 && perfGame.framesPerSec >= 40, `${perfGame.framesPerSec} 格／秒（螢幕 ${perf.system.displays.map((d) => d.hz).join("、")}Hz）`);
    // 畫面更新率換成 48Hz：遊戲真的變成每秒約 48 格；換回預設 60
    const gameFps = async () => {
      const a = await t.inGame(g0, "({ ...__petFrameStats(), at: performance.now() })");
      await sleep(3000);
      const b = await t.inGame(g0, "({ ...__petFrameStats(), at: performance.now() })");
      return Math.round(((b.frames - a.frames) * 10000) / (b.at - a.at)) / 10;
    };
    t.setPetFps(48, 0);
    await sleep(300);
    const fps48 = await gameFps();
    t.setPetFps(60, 0);
    check("畫面更新率：選 48Hz 遊戲每秒約 48 格", fps48 >= 45 && fps48 <= 50, `${fps48} 格／秒`);
    const rateMenu = t.buildMenu().items.find((i) => i.label === "節約效能模式")?.submenu?.items.map((i) => i.label) ?? [];
    check("畫面更新率：選單有 48／55／60／120／144／不限制、套用全部、節約效能模式",
      ["48Hz", "55Hz", "60Hz（預設）", "120Hz", "144Hz", "不限制（跟著螢幕更新率）", "套用到全部桌寵（不勾＝只改這一隻）"].every((l) => rateMenu.includes(l)) && rateMenu.some((l) => l.startsWith("節約效能模式（")) && /越快越吃 CPU/.test(rateMenu[0]),
      rateMenu.join("、"));
    console.log(`       ${t.diagnostics.describe(perf).replace(/\n+/g, "／")}`);

    // ── 收入總覽 ──
    // 遊戲的訊息框函式在線上（混淆）版也叫得到
    const fns = await t.inGame(g0, `[typeof toggleLogDrawer, typeof setLogPopTab].join(",")`);
    check("線上版叫得到訊息框函式", fns === "function,function", fns);
    // 藏著的時候讀一次狀態：訊息框要被打開、切到掉落紀錄
    await sleep(3500);
    const drawer = await t.inGame(g0, `[document.getElementById("log-pop")?.classList.contains("open"), document.getElementById("lp-tab-loot")?.classList.contains("on"), !document.getElementById("hunt-loot")?.classList.contains("hidden")].join(",")`);
    check("遊戲藏著時掉落紀錄自動打開", drawer === "true,true,true", drawer);
    // 拆字、只算新出現的：先放兩行，再放「舊的 + 三行新的」
    const fake = (lines) => `(() => { document.getElementById("hunt-loot").innerHTML = ${JSON.stringify(lines)}.map((l) => '<div class="log-line">' + l + '</div>').join(""); return window.__petLoot.take(false); })()`;
    const a = ["🎁 獲得 治癒藥水 ×3", "🪙 自動賣出 【精良】短劍 ×1（+1,234）"];
    const got1 = await t.inGame(g0, fake(a));
    const got2 = await t.inGame(g0, fake([...a, "🌙 離線撿到：箭 ×1,500、紅色藥水 ×2", "📜 獲得任務道具「古老徽章」 ×1（1/5）", "🗺️ 獲得 【稀有】異界地圖 T3 ×1"]));
    check("掉落紀錄拆成拿到／賣出", got1.length === 2 && got1[1].kind === "sold" && got1[1].gold === 1234 && got1[1].name === "【精良】短劍", JSON.stringify(got1));
    check("只算新出現的行", got2.length === 4 && got2[0].n === 1500 && got2[2].name === "古老徽章" && got2[3].name === "【稀有】異界地圖 T3", JSON.stringify(got2));
    await t.inGame(g0, `(() => { window.__petLoot.take(false); setLogPopTab("loot"); })()`); // 讓遊戲把假的行蓋回去

    // 存檔比對：跨過升級的經驗要換算成總經驗
    const base = { id: "x", name: "測", cls: "elf", level: 9, totalExp: t.totalExp(9, 3000), gold: 1000, kills: 10, deaths: 0 };
    t.income.recordSave(9, base);
    t.income.recordSave(9, { ...base, level: 10, totalExp: t.totalExp(10, 100), gold: 1500, kills: 25, deaths: 1 });
    t.income.recordLoot(9, [...got1, ...got2]);
    const book = t.income.snapshot(9);
    const expGain = 10 ** 4 - 9 ** 4 - 3000 + 100; // 9 級升 10 級要 (10⁴−9⁴)＝3439
    check("收入：經驗跨升級、金幣、打怪數", book.exp === expGain && book.levels === 1 && book.gold === 500 && book.kills === 15 && book.deaths === 1, JSON.stringify({ exp: book.exp, expGain, gold: book.gold, kills: book.kills }));
    check("收入：拿到／賣出", book.obtained["治癒藥水"] === 3 && book.obtained["箭"] === 1500 && book.sold["【精良】短劍"].gold === 1234 && book.soldGold === 1234, JSON.stringify(book.obtained));
    t.openIncome();
    await sleep(1500);
    const town = await t.getIncomeWin().webContents.executeJavaScript(`document.getElementById("zone").textContent`);
    check("收入總覽：在村莊時說明出發後會顯示地圖", /村莊/.test(town), town.slice(0, 60));
    // 在收入總覽視窗裡畫迷霧古林（存檔每 3 秒會蓋回真的位置，所以直接叫畫圖的函式）：要列出怪物分布、稀有首領、可獲得物品
    const zoneText = await t.getIncomeWin().webContents.executeJavaScript(`(() => {
      const box = document.getElementById("zone");
      box.dataset.key = "test";
      box.innerHTML = zoneGuideHtml({ type: "zone", id: "elvenForest" });
      return box.textContent;
    })()`);
    check("收入總覽：目前地圖的怪物、稀有首領、可獲得物品", /迷霧古林/.test(zoneText) && /古老樹精/.test(zoneText) && /可獲得的物品/.test(zoneText) && /水晶魔杖/.test(zoneText), zoneText.replace(/\s+/g, " ").slice(0, 120));
    // 這張地圖可掉的技能書；點物品／書名跳出跟攻略網一樣的說明視窗
    const popup = await t.getIncomeWin().webContents.executeJavaScript(`(() => {
      const r = { books: /可掉的魔法書／技能書/.test(document.getElementById("zone").textContent), folded: !document.querySelector("#zone .zg-items").open };
      document.querySelector("#zone .zg-items").open = true;
      document.querySelector("#zone .zg-t [data-item]").click();
      r.item = document.querySelector(".gw-modal.on .gw-body")?.textContent || "";
      document.querySelector("#zone .zg-books [data-item]").click();
      r.book = document.querySelector(".gw-modal.on .gw-body")?.textContent || "";
      document.querySelector(".gw-x").click();
      r.closed = !document.querySelector(".gw-modal.on");
      return r;
    })()`);
    check("收入總覽：目前地圖可掉的技能書", popup.books);
    check("收入總覽：可獲得的物品預設收起", popup.folded);
    check("收入總覽：點物品／書名跳出說明視窗", /取得方式/.test(popup.item) && /學會技能/.test(popup.book) && popup.closed, popup.item.slice(0, 60));
    // 物品圖示從遊戲網站載入（income.html 的 CSP img-src 要放行）
    const icons = await t.getIncomeWin().webContents.executeJavaScript(`new Promise((ok) => {
      const imgs = [...document.querySelectorAll("#zone .zg-t img")].slice(0, 5);
      imgs.forEach((i) => (i.loading = "eager"));
      const t0 = Date.now();
      (function wait() {
        const done = imgs.filter((i) => i.complete);
        if (done.length === imgs.length || Date.now() - t0 > 8000) ok({ n: imgs.length, loaded: imgs.filter((i) => i.naturalWidth > 0).length });
        else setTimeout(wait, 200);
      })();
    })`);
    check("收入總覽：物品圖示載得出來", icons.n > 0 && icons.loaded === icons.n, JSON.stringify(icons));
    await t.getIncomeWin().webContents.executeJavaScript(`document.getElementById("zone").scrollIntoView()`);
    await shot(t.getIncomeWin(), "income");

    // ── 變身 ──
    const morphed = t.summarize(0, { t: 1000, player: { lv: 20, exp: 0, cls: "elf", name: "x", buffs: { morph: { id: "polyScroll", form: "m19", until: 5000 } } } });
    const generic = t.summarize(0, { t: 1000, player: { lv: 20, exp: 0, cls: "elf", name: "x", buffs: { morph: { id: "polyScroll", form: "m23", until: 5000 } } } });
    const expired = t.summarize(0, { t: 9000, player: { lv: 20, exp: 0, cls: "elf", name: "x", buffs: { morph: { id: "polyScroll", form: "m19", until: 5000 } } } });
    check("讀出變身外觀（專屬圖／統一外觀／過期）", morphed.morph === "ivoryArchmage" && generic.morph === "wolfRanger" && expired.morph === null, `${morphed.morph}／${generic.morph}／${expired.morph}`);
    t.games[0].lastRaw = { ...t.games[0].lastRaw, morph: "ivoryArchmage" };
    t.sendPets();
    await sleep(3000);
    await shot(t.petWin, "pet-morph");
    t.games[0].lastRaw = { ...t.games[0].lastRaw, morph: null };

    // 角色在村莊（測試角色在低語港）：桌寵睡覺，頭上有大中小三個 Z，不走、不揮擊
    const petSnap = () => t.petWin.webContents.executeJavaScript(`({ x: pets[0].x, action: pets[0].action, sleeping: pets[0].sleeping, z: pets[0].zzz ? pets[0].zzz.querySelectorAll("span").length : 0 })`);
    await waitFor("桌寵睡覺", async () => (await petSnap()).sleeping, 15000);
    await t.petWin.webContents.executeJavaScript(`swing(pets[0])`);
    const sleep1 = await petSnap();
    await sleep(6000);
    const sleep2 = await petSnap();
    await shot(t.petWin, "pet-sleep");
    check("村莊時桌寵睡覺：三個 Z、完全不動", sleep1.z === 3 && sleep1.action === "idle" && sleep2.action === "idle" && sleep1.x === sleep2.x, JSON.stringify([sleep1, sleep2]));
    // 出村莊就醒來
    t.petWin.webContents.send("pet:state", 0, { ...t.games[0].lastState, sleeping: false });
    await sleep(300);
    const awake = await petSnap();
    check("離開村莊醒來、Z 收掉", !awake.sleeping && awake.z === 0, JSON.stringify(awake));

    t.showGame(g0, true);
    await sleep(1500);
    await shot(g0.win, "game");
    const shownBounds = g0.win.getBounds();
    t.showGame(g0, false);
    const parked = g0.win.getBounds();
    // 再開關一次：大小不能一直變大（螢幕縮放的進位）
    t.showGame(g0, true);
    const again = g0.win.getBounds();
    t.showGame(g0, false);
    check("遊戲視窗藏起來時靜音、停在螢幕外（只露幾個像素）", g0.win.webContents.isAudioMuted() && parked.x + parked.width <= 4 && parked.y + parked.height <= 4 && shownBounds.x >= 0, JSON.stringify({ shownBounds, parked }));
    check("開關遊戲視窗大小、位置不會跑掉", again.width === shownBounds.width && again.height === shownBounds.height && again.x === shownBounds.x && again.y === shownBounds.y, JSON.stringify({ shownBounds, again }));

    // 遊戲網頁當掉（白畫面）：自動重新載入，並記到 game-log.txt
    g0.win.webContents.forcefullyCrashRenderer();
    await sleep(500);
    const crashed = g0.win.webContents.isCrashed();
    await waitFor("當掉後重新載入", async () => !g0.win.webContents.isCrashed() && (await screenOf(t, g0)), 60000);
    const log = fs.readFileSync(path.join(app.getPath("userData"), "game-log.txt"), "utf8");
    check("遊戲網頁當掉自動重新載入、記到 game-log.txt", crashed && (await screenOf(t, g0)) && log.includes("遊戲網頁當掉"), `${await screenOf(t, g0)}／${log.trim().split("\n").pop()}`);
    // 叫出遊戲時網頁不是遊戲（載入失敗停在空白頁）：馬上重新載入
    await g0.win.loadURL("about:blank");
    t.showGame(g0, true);
    const blankFixed = await waitFor("叫出時重新載入", () => screenOf(t, g0), 60000).catch(() => null);
    t.showGame(g0, false);
    check("叫出遊戲時是空白頁就重新載入", !!blankFixed, String(blankFixed));

    // 遊戲設定的四種畫面尺寸：遊戲視窗跟著換大小（手機 9:16、PC 16:9 遊戲區剛好那個比例；全螢幕＝網頁全螢幕）
    const pickMode = (mode) => t.inGame(g0, `(() => { localStorage.setItem("dragonSlayer_display", "${mode}"); if (typeof setDisplayMode === "function") setDisplayMode("${mode}"); })()`);
    t.showGame(g0, true);
    const sizes = {};
    for (const mode of ["phone", "pc", "full", "auto"]) {
      await pickMode(mode);
      await sleep(2500);
      const c = g0.win.getContentBounds();
      sizes[mode] = { w: c.width, h: c.height, outer: g0.win.getBounds(), full: g0.win.isFullScreen(), inner: await t.inGame(g0, `innerWidth + "x" + innerHeight`) };
    }
    t.showGame(g0, false);
    await sleep(1500);
    const parkedAfter = g0.win.getBounds();
    const ratio = (s) => s.w / s.h;
    check("畫面尺寸：手機 9:16", Math.abs(ratio(sizes.phone) - 9 / 16) < 0.01, JSON.stringify(sizes.phone));
    check("畫面尺寸：PC 16:9 變成橫的", Math.abs(ratio(sizes.pc) - 2000 / 1116) < 0.01 && sizes.pc.w > 900, JSON.stringify(sizes.pc));
    check("畫面尺寸：全螢幕", sizes.full.full, JSON.stringify(sizes.full));
    check("畫面尺寸：換回自動尺寸恢復原本大小、退出全螢幕", !sizes.auto.full && sizes.auto.outer.width === shownBounds.width && sizes.auto.outer.height === shownBounds.height, JSON.stringify(sizes.auto));
    check("畫面尺寸：藏起來時一樣停在螢幕外", parkedAfter.x + parkedAfter.width <= 4 && parkedAfter.y + parkedAfter.height <= 4, JSON.stringify(parkedAfter));

    // 畫面更新率：不勾「套用到全部」只改那一隻；勾了全部一起換；沒設的是預設 60
    const fpsBefore = t.settings().petFps[1] ?? null;
    t.setPetFps(120, 0);
    const onlyFirst = [t.settings().petFps[0], t.settings().petFps[1] ?? null];
    t.changeSettings((s) => (s.fpsApplyAll = true));
    t.setPetFps(55, 1);
    const allPets = [t.settings().petFps[0], t.settings().petFps[1]];
    t.changeSettings((s) => (s.fpsApplyAll = false));
    t.setPetFps(60, 0);
    t.setPetFps(60, 1);
    check("畫面更新率：不勾只改這一隻、勾了全部一起換", fpsBefore === null && onlyFirst[0] === 120 && onlyFirst[1] === null && allPets[0] === 55 && allPets[1] === 55,
      JSON.stringify({ fpsBefore, onlyFirst, allPets }));

    // 登入表單找得到（只打開、檢查、按取消，不送出）
    await waitFor("雲端連線", () => t.inGame(g0, `(() => { const b = document.getElementById("btn-cloud"); return !!b && !b.classList.contains("hidden") && !b.textContent.includes("連線中"); })()`), 30000);
    const form = await t.inGame(g0, `(() => {
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
    check("新增帳號：檔案裡沒有明文密碼、讀得回來", !!added.id && !text1.includes("not-a-real-password") && t.accounts.password(added.id) === "not-a-real-password", `能加密：${t.accounts.canEncrypt()}`);
    const list = JSON.parse(text1);
    list.push({ label: "手寫", email: "hand@example.invalid", password: "hand-written-pass" });
    fs.writeFileSync(t.accounts.file(), JSON.stringify(list));
    t.accounts.load();
    const text2 = fs.readFileSync(t.accounts.file(), "utf8");
    const hand = t.accounts.list().find((a) => a.email === "hand@example.invalid");
    check("手寫明文密碼自動轉成加密", !!hand && !text2.includes("hand-written-pass") && t.accounts.password(hand.id) === "hand-written-pass");

    // 換帳號＝換一個遊戲視窗（自動登入已在上面關掉，這裡不會真的去登入）。平常是整個程式重開，自我測試時直接換
    t.setPetAccount(0, added.id);
    await sleep(500);
    check("換帳號後用該帳號自己的登入資料", t.games[0].partition === `persist:acct-${added.id}` && t.games[0] !== g0
      && t.games[0].win.webContents.session.storagePath?.endsWith(`acct-${added.id}`), t.games[0].win.webContents.session.storagePath);
    const labels = t.buildMenu().items.map((i) => i.label).filter(Boolean);
    check("右鍵選單有帳號、新增一隻、沒有說話／撫摸功能", labels.some((l) => l.startsWith("帳號（第 1 隻）：測試帳號")) && labels.some((l) => l.startsWith("新增一隻桌寵（目前 1 隻"))
      && !labels.some((l) => /說話|摸|黑店|GM|書籤|收益|存檔管理|桌寵數量/.test(l)), labels.join("、"));
    t.setPetAccount(1, added.id);
    check("同一個帳號只給一隻用", t.settings().petAccounts[1] === added.id && t.settings().petAccounts[0] === null);

    // 自動登入：登入請求在本機擋掉（假帳號，不會送到遊戲伺服器），要真的填好按下「登入」
    let loginTry = 0;
    const second = t.accounts.list().find((a) => a.email === "hand@example.invalid");
    const autoWas = t.settings().autoContinue;
    t.changeSettings((s) => (s.autoContinue = true));
    t.setPetAccount(0, second.id);
    await sleep(500);
    t.games[0].win.webContents.session.webRequest.onBeforeRequest({ urls: ["*://*/auth/v1/*"] }, (d, cb) => {
      if (/\/auth\/v1\/token/.test(d.url) && d.method === "POST") loginTry++;
      cb({ cancel: true });
    });
    await waitFor("按了登入", () => loginTry, 90000).catch(() => {});
    check("自動登入有填好按下登入（請求在本機擋掉）", loginTry > 0, JSON.stringify({ loginTry, state: t.games[0].login.state }));
    t.changeSettings((s) => (s.autoContinue = autoWas));
    t.setPetAccount(1, null);
    t.setPetAccount(0, added.id);

    t.openAccounts();
    await sleep(1500);
    await shot(t.getAccountsWin(), "accounts");
    const rows = await t.getAccountsWin().webContents.executeJavaScript(`document.querySelectorAll("#pets select").length + "/" + document.querySelectorAll("#list .row").length`);
    check("帳號管理視窗列出開著的 1 隻桌寵、2 個帳號", rows === "1/2", rows);
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
    const gameMenu = t.buildMenu().items.map((i) => i.label);
    const spoken = await speechOn();
    check("遊戲有更新時跳提醒、選單出現套用更新", gameMenu.some((l) => l?.startsWith("⬆ 套用遊戲更新")) && /黑暗大陸更新了/.test(spoken || ""), `${spoken}`);
    // 桌寵靠在螢幕最右邊：對話框被推回畫面裡，尖角要對到桌寵
    const tail = await t.petWin.webContents.executeJavaScript(`(async () => {
      pet.x = innerWidth - 40; pet.action = "idle"; pet.idleLeftMs = 60000;
      await new Promise((r) => setTimeout(r, 300));
      const box = speech.getBoundingClientRect(), r = bodyRect(pet);
      const tailX = box.left + parseFloat(getComputedStyle(speech, "::after").left);
      return { tailX: Math.round(tailX), petX: Math.round((r.l + r.r) / 2), boxRight: Math.round(box.right), width: innerWidth };
    })()`);
    check("桌寵靠右邊時對話框尖角對到桌寵", Math.abs(tail.tailX - tail.petX) <= 18 && tail.boxRight <= tail.width, JSON.stringify(tail));
    await shot(t.petWin, "update-say");
    check("選單有檢查更新", gameMenu.some((l) => l?.startsWith("檢查更新（")));
    check("從外殼啟動", !!global.petShell?.contentVersion, JSON.stringify({ shell: global.petShell?.shellVersion, content: global.petShell?.contentVersion }));
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

    t.openPicker(0);
    await waitFor("外觀縮圖", () => t.getPicker().webContents.executeJavaScript(`[...document.querySelectorAll(".card canvas")].every((c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0))`), 60000).catch(() => {});
    await shot(t.getPicker(), "picker");
    const cards = await t.getPicker().webContents.executeJavaScript(`document.querySelectorAll(".card").length`);
    const morphLooks = Object.keys(require("./names.json").morphs).length;
    check(`外觀清單有 12 個職業＋${morphLooks} 種變身`, cards === 12 + morphLooks, String(cards));
    t.getPicker().close();
    t.openHelp();
    await sleep(1000);
    await shot(t.getHelp(), "help");
    // 回報效能異常平常藏起來，說明的標題連點 20 下才出現（點 19 下不算）
    const hasReport = () => t.buildMenu().items.some((i) => i.label?.startsWith("回報效能異常"));
    const hiddenBefore = !hasReport();
    const tap = (n) => t.getHelp().webContents.executeJavaScript(`for (let i = 0; i < ${n}; i++) document.querySelector("h1").click()`);
    await tap(19);
    await sleep(300);
    const after19 = hasReport();
    await sleep(1700); // 間隔太久重新數
    await tap(20);
    await sleep(300);
    check("回報效能異常：平常藏起來、說明標題連點 20 下才出現", hiddenBefore && !after19 && hasReport() && t.settings().reportUnlocked === true, `${hiddenBefore}／${after19}／${hasReport()}`);
    t.getHelp().close();
  } catch (e) {
    const where = await t.inGame(g0, `[document.querySelector(".screen.active")?.id, document.getElementById("dialog-layer")?.innerText?.slice(0, 200)].join(" | ")`);
    check("測試中斷", false, `${e.message}（第一隻遊戲畫面：${where}）\n${e.stack}`);
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
