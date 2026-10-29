// 右鍵「回報效能異常（CPU 偏高）…」：有玩家回報桌寵一直佔很高的 CPU，用這個收集他電腦上的實際狀況。
//
// 收集 SAMPLE_MS 秒：桌寵每個程序（主程式、每隻的遊戲、桌寵畫面、GPU…）的 CPU／記憶體／每秒喚醒次數、
// 整台電腦的 CPU 使用率、每隻遊戲畫面每秒跑幾格（畫面更新幾格、遊戲的畫面迴圈被叫幾次、計時器補幾格，見 game-preload.js 的 __petFrameStats）、
// 桌寵動畫每秒幾格、電腦規格（CPU、記憶體、螢幕更新率、顯示卡）、桌寵設定、最近的 game-log.txt。
// 給玩家看過摘要、按「上傳給開發者」才送到 REPORT_URL（Cloudflare Worker，原始碼在 report-worker/），也可以存成檔案。
// 不收帳號、Email、密碼、存檔內容。
const { app, clipboard, dialog, net, powerMonitor, screen, BrowserWindow } = require("electron");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPORT_URL = "https://dark-pet-report.s8gh6n2fyj.workers.dev/report";
const SAMPLE_MS = 15000;
const SAMPLE_EVERY_MS = 1000;
const LOG_LINES = 40;

/** 遊戲網頁裡讀的東西：畫面跑了幾格（累計，前後各讀一次相減）、解析度、畫布大小、網頁大小、記憶體。 */
const GAME_PROBE = `(() => ({
  frames: window.__petFrameStats ? window.__petFrameStats() : null,
  at: performance.now(),
  dpr: window.devicePixelRatio,
  size: [innerWidth, innerHeight],
  canvases: [...document.querySelectorAll("canvas")].slice(0, 8).map((c) => [c.width, c.height]),
  nodes: document.getElementsByTagName("*").length,
  heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
  screen: document.querySelector(".screen.active")?.id ?? "",
}))()`;

/** 某個視窗的畫面一秒能更新幾次（量 3 秒）。 */
const FPS_PROBE = `new Promise((done) => {
  let n = 0;
  const t0 = performance.now();
  const tick = () => (++n, performance.now() - t0 < 3000 ? requestAnimationFrame(tick) : done(Math.round((n * 1000) / (performance.now() - t0))));
  requestAnimationFrame(tick);
})`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const run = (wc, code) => (wc && !wc.isDestroyed() ? wc.executeJavaScript(code).catch(() => null) : Promise.resolve(null));

/** 整台電腦所有核心加起來的忙碌／總時間。 */
function cpuTimes() {
  let busy = 0, total = 0;
  for (const c of os.cpus()) {
    const t = c.times;
    busy += t.user + t.nice + t.sys + t.irq;
    total += t.user + t.nice + t.sys + t.irq + t.idle;
  }
  return { busy, total };
}

/** 每台電腦一個隨機編號（不含任何個人資料），同一個玩家回報好幾次時對得起來。 */
function installId() {
  const file = path.join(app.getPath("userData"), "report-id.txt");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    const id = crypto.randomUUID();
    try {
      fs.writeFileSync(file, id);
    } catch {}
    return id;
  }
}

/** 最近的 game-log.txt（遊戲當掉、卡住、載入失敗）。Email、帳號名稱換掉。 */
function recentLog() {
  try {
    const text = fs.readFileSync(path.join(app.getPath("userData"), "game-log.txt"), "utf8");
    return text.trim().split("\n").slice(-LOG_LINES)
      .map((line) => line.replace(/[^\s@（）]+@[^\s@（）]+/g, "(email)").replace(/自動登入 .+? 失敗/, "自動登入（帳號）失敗"));
  } catch {
    return [];
  }
}

/**
 * 收集一份報告。ctx：games、petWin、settings、clickThrough（見 main.js 的 diagnosticsContext）。
 * sampleMs 給自我測試縮短用。
 */
async function collect(ctx, sampleMs = SAMPLE_MS) {
  const { games, petWin, settings } = ctx;
  const cores = os.cpus().length || 1;
  // 程序編號 → 給人看的名字
  const names = new Map([[process.pid, "主程式"]]);
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) names.set(win.webContents.getOSProcessId(), `視窗：${win.getTitle()}`);
  }
  if (petWin && !petWin.isDestroyed()) names.set(petWin.webContents.getOSProcessId(), "桌寵畫面");
  for (const g of games) if (!g.win.isDestroyed()) names.set(g.win.webContents.getOSProcessId(), `第 ${g.index + 1} 隻的遊戲`);

  const before = await Promise.all(games.map((g) => run(g.win.webContents, GAME_PROBE)));
  // 遊戲那邊不另外量（requestAnimationFrame 被 game-preload.js 包過，量了會算進遊戲的格數），看前後兩次 __petFrameStats 相減
  const petFps = run(petWin?.webContents, FPS_PROBE);
  const cpu0 = cpuTimes();
  app.getAppMetrics(); // 第一次讀的 CPU 是 0，先讀一次當起點
  const procs = new Map();
  for (let t = 0; t < sampleMs; t += SAMPLE_EVERY_MS) {
    await sleep(Math.min(SAMPLE_EVERY_MS, sampleMs - t));
    for (const m of app.getAppMetrics()) {
      const p = procs.get(m.pid) ?? { pid: m.pid, type: m.type, name: names.get(m.pid) ?? m.name ?? m.serviceName ?? m.type, cpu: [], wakeups: [], memMB: 0 };
      p.cpu.push(Math.max(0, m.cpu.percentCPUUsage)); // 偶爾會讀到一點點負數
      p.wakeups.push(m.cpu.idleWakeupsPerSecond);
      p.memMB = Math.max(p.memMB, Math.round(m.memory.workingSetSize / 1024));
      procs.set(m.pid, p);
    }
  }
  const cpu1 = cpuTimes();
  const after = await Promise.all(games.map((g) => run(g.win.webContents, GAME_PROBE)));

  const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
  // Electron 的 percentCPUUsage 已經除過核心數＝工作管理員看到的那種（整台電腦的百分比）；cpuCore＝換算成單一核心的百分比
  const processes = [...procs.values()]
    .map((p) => ({ pid: p.pid, type: p.type, name: p.name, cpu: round(avg(p.cpu), 2), cpuMax: round(Math.max(...p.cpu), 2), cpuCore: round(avg(p.cpu) * cores),
      wakeups: Math.round(avg(p.wakeups)), memMB: p.memMB }))
    .sort((a, b) => b.cpu - a.cpu);
  const cpuTotal = round(processes.reduce((s, p) => s + p.cpu, 0), 2);
  const systemCpu = round(((cpu1.busy - cpu0.busy) / Math.max(1, cpu1.total - cpu0.total)) * 100);
  const perSec = (a, b, key) => (a?.frames && b?.frames ? round(((b.frames[key] - a.frames[key]) * 1000) / Math.max(1, b.at - a.at)) : null);

  const gpu = await app.getGPUInfo("basic").catch(() => null);
  return {
    kind: "dark-pet-perf",
    installId: installId(),
    at: new Date().toISOString(),
    sampleSec: sampleMs / 1000,
    app: { version: app.getVersion(), content: global.petShell?.contentVersion ?? app.getVersion(), electron: process.versions.electron,
      chrome: process.versions.chrome, packaged: app.isPackaged, uptimeMin: Math.round(process.uptime() / 60) },
    summary: { cpuTotal, systemCpu, cpuTop: processes[0] ? `${processes[0].name} ${processes[0].cpu}%` : "" },
    processes,
    games: games.map((g, i) => ({
      index: g.index, hasAccount: !!g.accountId, shown: g.shown, keepTaskbar: g.keepTaskbar, mode: g.mode, loading: !!g.loading,
      failures: g.failures, version: g.version ?? null, framesPerSec: perSec(before[i], after[i], "frames"),
      callbacksPerSec: perSec(before[i], after[i], "callbacks"), timerFramesPerSec: perSec(before[i], after[i], "timer"), ...(after[i] ? { dpr: after[i].dpr, size: after[i].size, canvases: after[i].canvases,
        nodes: after[i].nodes, heapMB: after[i].heapMB, screen: after[i].screen } : { probe: "讀不到" }),
    })),
    pet: { rafFps: await petFps, shown: !!petWin?.isVisible(), clickThrough: !!ctx.clickThrough },
    settings: { petCount: settings.petCount, powerSave: settings.powerSave, followMorph: settings.followMorph, autoContinue: settings.autoContinue,
      stayPets: settings.stayPets.filter(Boolean).length, normalShow: settings.normalShow, focusShow: settings.focusShow },
    system: {
      os: `${os.type()} ${os.release()}`, arch: os.arch(), cpuModel: os.cpus()[0]?.model?.trim() ?? "", cores,
      memGB: round(os.totalmem() / 1073741824), freeMemGB: round(os.freemem() / 1073741824), uptimeH: round(os.uptime() / 3600),
      onBattery: powerMonitor.isOnBatteryPower?.() ?? null,
      displays: screen.getAllDisplays().map((d) => ({ w: d.size.width, h: d.size.height, scale: d.scaleFactor, hz: d.displayFrequency, primary: d.id === screen.getPrimaryDisplay().id })),
      gpu: gpu?.gpuDevice?.map((d) => ({ vendor: d.vendorId, device: d.deviceId, active: d.active, driver: d.driverVersion })) ?? null,
      gpuFeatures: app.getGPUFeatureStatus(),
    },
    log: recentLog(),
  };
}

/** 給玩家看的摘要。 */
function describe(r) {
  const lines = [`整個桌寵佔 CPU 約 ${r.summary.cpuTotal}%（整台電腦正在用 ${r.summary.systemCpu}%）`, ""];
  for (const p of r.processes.slice(0, 6)) lines.push(`${p.name}：CPU ${p.cpu}%、記憶體 ${p.memMB} MB`);
  lines.push("");
  for (const g of r.games) {
    lines.push(`第 ${g.index + 1} 隻的遊戲：畫面每秒 ${g.framesPerSec ?? "?"} 格、畫面迴圈 ${g.callbacksPerSec ?? "?"} 次${g.timerFramesPerSec ? `（計時器補 ${g.timerFramesPerSec} 次）` : ""}`);
  }
  lines.push(`桌寵動畫：每秒 ${r.pet.rafFps ?? "?"} 格`);
  return lines.join("\n");
}

async function upload(report) {
  const res = await net.fetch(REPORT_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(report) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.id) throw new Error(body.error || `伺服器回應 ${res.status}`);
  return body.id;
}

async function saveFile(report) {
  const name = `黑暗大陸桌寵-效能報告-${report.at.slice(0, 19).replace(/[:T]/g, "-")}.json`;
  const { canceled, filePath } = await dialog.showSaveDialog({ title: "儲存效能報告", defaultPath: path.join(app.getPath("desktop"), name),
    filters: [{ name: "JSON", extensions: ["json"] }] });
  if (!canceled && filePath) fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
}

let busy = false;

/** 右鍵選單按下去：收集 → 給玩家看摘要 → 上傳／存檔／取消。notice＝桌寵頭上飄字。 */
async function start(ctx, notice) {
  if (busy) return notice("效能資料還在收集中，請稍等");
  busy = true;
  try {
    notice(`開始收集效能資料（約 ${SAMPLE_MS / 1000} 秒），請照平常的樣子放著`);
    const report = await collect(ctx);
    const { response } = await dialog.showMessageBox({
      type: "info", title: "回報效能異常", message: "效能資料收集完成",
      detail: `${describe(report)}\n\n上傳的內容：各程序的 CPU／記憶體、畫面更新次數、電腦規格（CPU、記憶體、螢幕、顯示卡）、桌寵設定、最近的錯誤紀錄。不含帳號、Email、密碼、存檔。`,
      buttons: ["上傳給開發者", "存成檔案", "取消"], defaultId: 0, cancelId: 2, noLink: true,
    });
    if (response === 1) return await saveFile(report);
    if (response !== 0) return;
    try {
      const id = await upload(report);
      clipboard.writeText(id);
      await dialog.showMessageBox({ type: "info", title: "回報效能異常", message: `上傳完成，回報編號：${id}`, detail: "編號已經複製起來了，回報問題時把這個編號告訴開發者。" });
    } catch (e) {
      const { response: again } = await dialog.showMessageBox({ type: "warning", title: "回報效能異常", message: "上傳失敗", detail: e.message, buttons: ["存成檔案", "關閉"], noLink: true });
      if (again === 0) await saveFile(report);
    }
  } catch (e) {
    console.error("效能資料收集失敗：", e);
    notice(`效能資料收集失敗：${e.message}`);
  } finally {
    busy = false;
  }
}

module.exports = { start, collect, describe, upload, REPORT_URL };
