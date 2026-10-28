// 從黑暗大陸的原始資料檔（屠龍勇者/data/*.js）整理出桌寵要用的對照表，寫成 names.json：
//   職業名稱與人物動作圖、變身外觀（MORPHS 動作圖、MORPH_FORMS 對象→用哪套圖、變形卷軸沒有專屬圖時的統一外觀）、村莊／地圖名稱、道具名稱。
// 線上版是混淆過的（遊戲資料不在 window 上），桌寵沒辦法從遊戲頁面裡讀，所以先在這裡做好一份放進桌寵。
// 遊戲改版加了新地圖、新道具，再跑一次就好；沒更新的話桌寵只是顯示「地圖 #id」、不飄那件道具的名字。
//
// 用法：node tools/gen-names.js <屠龍勇者資料夾>
//   例：node tools/gen-names.js ..\..\idle-lineage-class\-username-.github.io-\屠龍勇者
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const gameDir = process.argv[2];
if (!gameDir) {
  console.error("用法：node tools/gen-names.js <屠龍勇者資料夾>");
  process.exit(1);
}

// 只載資料檔：boss-enchant 以前＋mercenary（傭兵符石）、affix／craft（通貨）、maps（異界地圖）；其他是戰鬥、畫面，桌寵用不到，而且會碰到 document
const FILES = ["config", "classes", "skills", "items", "spellbook", "monsters", "zones", "quests", "resonance", "boss-enchant", "doll-abilities", "mercenary", "player", "enchant", "affix", "craft", "maps"];

const noop = () => {};
const storage = { getItem: () => null, setItem: noop, removeItem: noop, key: () => null, length: 0 };
const sandbox = {
  console, Math, Date, JSON, setTimeout: noop, setInterval: noop,
  localStorage: storage, sessionStorage: storage,
  document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
  navigator: { userAgent: "" }, location: { search: "", hostname: "" },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const code = FILES.map((f) => fs.readFileSync(path.join(gameDir, "data", `${f}.js`), "utf8")).join("\n;\n");
// 頂層 const 不會掛到 sandbox 上，最後把要的東西整理好再交出來
vm.runInContext(`${code}
;globalThis.__out = {
  version: GAME_VERSION,
  classes: Object.fromEntries(Object.entries(CLASSES).map(([k, c]) => [k, { name: c.name, sprite: c.sprite ?? null }])),
  // 變身：MORPHS 的圖跟職業圖同格式，另外多 foot（腳底在格子裡的位置，不是貼格子底部）、charH 160
  morphs: Object.fromEntries(Object.entries(MORPHS).map(([k, m]) => [k, { name: m.name, sprite: { charH: m.charH, foot: m.foot, walk: m.walk, attack: m.attack, cast: m.cast } }])),
  morphForms: Object.fromEntries(MORPH_FORMS.map((f) => [f.id, { name: f.name, sprite: f.sprite ?? null }])),
  defaultMorph: ITEMS.polyScroll && ITEMS.polyScroll.morph,
  towns: Object.fromEntries(Object.entries(TOWNS).map(([k, t]) => [k, t.name])),
  zones: Object.fromEntries(ZONES.map((z) => [z.id, z.name])),
  items: Object.fromEntries(Object.entries(ITEMS).map(([k, i]) => [k, i.name])),
};`, sandbox, { filename: "game-data.js" });

const out = sandbox.__out;
const file = path.join(__dirname, "..", "names.json");
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`names.json 已更新（遊戲版本 ${out.version}）：職業 ${Object.keys(out.classes).length}、變身外觀 ${Object.keys(out.morphs).length}、村莊 ${Object.keys(out.towns).length}、地圖 ${Object.keys(out.zones).length}、道具 ${Object.keys(out.items).length}`);
