// 發佈新版桌寵：npm run release（先打包，再跑這支）。
// 把 dist/ 裡這一版的 latest.yml、安裝檔、blockmap 複製到「黑暗大陸桌寵」資料夾最上層，舊版安裝檔刪掉，
// 再把教學網頁 index.html 的下載按鈕（DOWNLOAD:START～END）改成這一版。
// 之後 commit、推到 taiwan_game2 的 main，已安裝的桌寵最慢 30 分鐘內（或下次打開時）就會自動下載新版。
// 記得每次發佈前先把 package.json 的 version 加一（例如 1.0.0 → 1.0.1），版本號沒變桌寵不會更新。
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const { version } = require(path.join(root, "package.json"));
const setup = `dark-continent-pet-setup-${version}.exe`;
const files = ["latest.yml", setup, `${setup}.blockmap`];

for (const f of files) {
  if (!fs.existsSync(path.join(dist, f))) throw new Error(`dist/ 裡找不到 ${f}，先跑 npm run dist`);
}
for (const f of fs.readdirSync(root)) {
  if (/^dark-continent-pet-setup-.*\.exe(\.blockmap)?$/.test(f) && !f.startsWith(setup)) fs.rmSync(path.join(root, f));
}
for (const f of files) fs.copyFileSync(path.join(dist, f), path.join(root, f));

const page = path.join(root, "index.html");
const mb = Math.round(fs.statSync(path.join(dist, setup)).size / 1024 / 1024);
const block = `<!-- DOWNLOAD:START 這一段由 tools/release.js 在每次發佈時自動改寫，不要手動改 -->
          <a class="button" href="https://github.com/jtnhrbpvvm-spec/taiwan_game2/raw/refs/heads/main/%E9%BB%91%E6%9A%97%E5%A4%A7%E9%99%B8%E6%A1%8C%E5%AF%B5/${setup}" download>下載安裝檔</a>
          <p class="meta">版本 ${version}・約 ${mb} MB・Windows 10／11（64 位元）</p>
          <!-- DOWNLOAD:END -->`;
const html = fs.readFileSync(page, "utf8");
if (!/<!-- DOWNLOAD:START[\s\S]*?<!-- DOWNLOAD:END -->/.test(html)) throw new Error("index.html 找不到 DOWNLOAD:START～END");
fs.writeFileSync(page, html.replace(/<!-- DOWNLOAD:START[\s\S]*?<!-- DOWNLOAD:END -->/, block));
console.log(`已準備好 v${version}：${files.join("、")}。commit 後推到 main 就會發佈。`);
