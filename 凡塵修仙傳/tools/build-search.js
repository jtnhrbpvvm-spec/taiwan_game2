// 重建全站搜尋索引 search-index.js。新增或修改頁面內容後執行：
//   node tools/build-search.js
// 做法：用 Edge（或 Chrome）無頭模式把每個頁面實際跑一遍，再把畫面上的文字切成一筆一筆。
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process"), { pathToFileURL } = require("url");
const root = path.resolve(__dirname, "..");
const browser = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
].find(p => fs.existsSync(p));
if (!browser) { console.error("找不到 Edge 或 Chrome"); process.exit(1); }
const TMP = "__idx.html", tmpPath = path.join(root, TMP), profile = fs.mkdtempSync(path.join(os.tmpdir(), "idx-"));

function dump(file) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  if (!html.includes("</body>")) throw new Error(file + " 沒有 </body>");
  fs.writeFileSync(tmpPath, html.replace("</body>", '<script src="tools/indexer.js"></script></body>'));
  const dom = execFileSync(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + profile,
    "--virtual-time-budget=8000", "--dump-dom", pathToFileURL(tmpPath).href], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  const m = dom.match(/<pre id="__IDX__">([^<]*)<\/pre>/);
  if (!m) throw new Error(file + " 沒有產生索引（頁面的程式可能出錯了）");
  return JSON.parse(decodeURIComponent(m[1]));
}

try {
  const home = dump("index.html");
  const pages = home.pages;
  if (!pages.length) throw new Error("index.html 讀不到頁面清單");
  const entries = [];
  const files = fs.readdirSync(root).filter(f => f.endsWith(".html") && f !== "index.html" && f !== "s.html" && f !== TMP);   // s.html 是分享短連結的中繼頁，不是攻略頁
  files.forEach(f => { if (!pages.some(p => p[0] === f)) console.warn("⚠️ " + f + " 還沒加到 index.html 的 PAGES"); });
  pages.forEach((p, pi) => {
    if (!files.includes(p[0])) { console.warn("⚠️ PAGES 裡的 " + p[0] + " 找不到檔案"); return; }
    const r = dump(p[0]);
    r.entries.forEach(e => entries.push([pi, e[0], e[1]]));
    console.log(String(r.entries.length).padStart(5), p[0]);
  });
  const js = "// 由 tools/build-search.js 產生，不要手動修改。\nwindow.SEARCH_INDEX=" + JSON.stringify({ p: pages, e: entries }) + ";\n";
  fs.writeFileSync(path.join(root, "search-index.js"), js);
  console.log(`完成：${pages.length} 頁、${entries.length} 筆、${Math.round(Buffer.byteLength(js) / 1024)} KB`);
} finally {
  try { fs.unlinkSync(tmpPath); } catch (e) {}
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
}
