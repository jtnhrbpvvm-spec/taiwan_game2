// 從「黑暗大陸攻略」的資料（../黑暗大陸攻略/data/wiki-data.js，攻略的 tools/extract.js 從遊戲產生）整理出桌寵收入總覽要用的地圖資料，
// 寫成 zones.js：window.ZONE_GUIDE（每張地圖的等級、怪物分布、稀有首領、掉落）＋ tools/zone-guide-helper.js（畫「目前地圖」區塊）。
// 電腦版 ui/income.html、安卓版設定畫面都用 <script src="../zones.js"> 載入；它是內容的一部分，跟著小檔案更新走。
//
// 用法：攻略重新產生資料後（node ../黑暗大陸攻略/tools/extract.js），在這裡跑 npm run zones，再發布小檔案更新。
//   node tools/gen-zones.js [攻略資料夾]
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const GUIDE = path.resolve(process.argv[2] || path.join(ROOT, "..", "黑暗大陸攻略"));
// 攻略在 GitHub Pages 上的網址（taiwan_game2 倉庫）
const GUIDE_URL = "https://jtnhrbpvvm-spec.github.io/taiwan_game2/%E9%BB%91%E6%9A%97%E5%A4%A7%E9%99%B8%E6%94%BB%E7%95%A5/";

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(GUIDE, "data", "wiki-data.js"), "utf8"), sandbox);
const W = sandbox.window.WIKI;
if (!W?.zones) throw new Error("讀不懂攻略的 wiki-data.js");

const drop = (d) => ({ id: d.id, p: d.p, ...(d.n ? { n: d.n } : {}) });
const zones = {};
const monIds = new Set();
for (const z of W.zones) {
  zones[z.id] = { name: z.name, icon: z.icon, type: z.type, lv: z.lv, desc: z.desc || "", mons: z.mons || [], drops: (z.drops || []).map(drop),
    rare: z.rare ? { id: z.rare.id, p: z.rare.p } : null, boss: z.boss || null };
  (z.mons || []).forEach((id) => monIds.add(id));
  if (z.rare) monIds.add(z.rare.id);
  if (z.boss) monIds.add(z.boss);
}
const monsters = {};
const itemIds = new Set();
for (const id of monIds) {
  const m = W.monsters[id];
  if (!m) continue;
  monsters[id] = { name: m.name, icon: m.icon, lv: m.lv, hp: m.hp, exp: m.exp, drops: (m.drops || []).map(drop) };
  m.drops?.forEach((d) => itemIds.add(d.id));
}
Object.values(zones).forEach((z) => z.drops.forEach((d) => itemIds.add(d.id)));
const common = W.commonDrops.map((d) => ({ ...drop(d), ...(d.minLv ? { minLv: d.minLv } : {}), ...(d.maxLv ? { maxLv: d.maxLv } : {}) }));
common.forEach((d) => itemIds.add(d.id));
const items = Object.fromEntries([...itemIds].filter((id) => W.items[id]).map((id) => [id, W.items[id].name]));
const tower = (W.tower?.floors || []).map((f) => ({ floor: f.floor, lv: f.lv, hp: f.hp, exp: f.exp }));

const data = { version: W.meta.version, guideUrl: GUIDE_URL, zones, monsters, items, common, tower };
const helper = fs.readFileSync(path.join(__dirname, "zone-guide-helper.js"), "utf8");
const out = path.join(ROOT, "zones.js");
fs.writeFileSync(out, `// 自動產生：node tools/gen-zones.js（攻略資料，遊戲版本 ${data.version}）。不要手動修改，改 tools/zone-guide-helper.js 或重新產生。\nwindow.ZONE_GUIDE = ${JSON.stringify(data)};\n\n${helper}`);
console.log(`zones.js 已更新（遊戲版本 ${data.version}）：地圖 ${Object.keys(zones).length}、怪物 ${Object.keys(monsters).length}、物品 ${Object.keys(items).length}，${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
