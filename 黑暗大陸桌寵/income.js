// 收入總覽：記「這次打開桌寵以來」每一隻（每個帳號）賺了多少——經驗、金幣、打怪數、拿到哪些東西、自動賣掉哪些東西。
// 下次打開桌寵時從頭記（start() 把上一次的檔案蓋掉），使用者 2026-10-26 指定。
//
// 資料來源：
//   - 經驗、金幣、擊殺、死亡：比對前後兩次存檔（main.js 的 summarize）；經驗跨過升級時照遊戲的經驗表換算成總經驗再相減
//   - 拿到／賣出的東西：遊戲左下角訊息框的「掉落紀錄」那幾行字（main.js 的 COLLECT_LOOT 在遊戲頁面裡抄下來）
//     自動賣出那一行有寫賣了多少錢，所以賣出所得是準的；金幣淨增減則是存檔的金幣差（含打怪掉的錢、買東西花的錢）
const fs = require("fs");
const path = require("path");

let dir;
const books = new Map(); // 第幾隻 → 紀錄

function blank() {
  return { startedAt: Date.now(), updatedAt: Date.now(), character: null, exp: 0, levels: 0, gold: 0, kills: 0, deaths: 0,
    soldGold: 0, obtained: {}, sold: {}, last: null };
}

/** 啟動時呼叫：清掉上一次的紀錄檔，從頭記。 */
function start(folder) {
  dir = folder;
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^income-\d+\.json$/.test(f)) fs.rmSync(path.join(dir, f), { force: true });
  books.clear();
}

const book = (index) => {
  if (!books.has(index)) books.set(index, blank());
  return books.get(index);
};

function save(index) {
  if (!dir) return;
  const { last, ...data } = book(index);
  try {
    fs.writeFileSync(path.join(dir, `income-${index}.json`), JSON.stringify(data, null, 1));
  } catch (e) {
    console.error("收入紀錄存不進去：", e.message);
  }
}

/** 存檔有更新：s＝{ id, name, cls, level, totalExp, gold, kills, deaths }。換角色的話新角色從那一刻起算。 */
function recordSave(index, s) {
  const b = book(index);
  const prev = b.last;
  b.character = { name: s.name, cls: s.cls, level: s.level };
  if (prev && prev.id === s.id) {
    const exp = s.totalExp - prev.totalExp;
    if (exp > 0) b.exp += exp; // 死亡扣經驗不算進來
    if (s.level > prev.level) b.levels += s.level - prev.level;
    b.gold += s.gold - prev.gold;
    if (s.kills > prev.kills) b.kills += s.kills - prev.kills;
    if (s.deaths > prev.deaths) b.deaths += s.deaths - prev.deaths;
  }
  b.last = s;
  b.updatedAt = Date.now();
  save(index);
}

/** 掉落紀錄新出現的幾行（已經拆好）：{ kind: "got"|"sold", name, n, gold? }。 */
function recordLoot(index, entries) {
  if (!entries?.length) return;
  const b = book(index);
  for (const e of entries) {
    if (!e?.name || !(e.n > 0)) continue;
    if (e.kind === "sold") {
      const x = (b.sold[e.name] ??= { n: 0, gold: 0 });
      x.n += e.n;
      x.gold += e.gold || 0;
      b.soldGold += e.gold || 0;
    } else if (e.kind === "got") b.obtained[e.name] = (b.obtained[e.name] ?? 0) + e.n;
  }
  b.updatedAt = Date.now();
  save(index);
}

/** 給收入總覽視窗用：labels[i]＝第 i 隻的帳號名稱。 */
function summary(count, labels) {
  return Array.from({ length: count }, (_, i) => {
    const { last, ...data } = book(i);
    return { index: i, account: labels[i], ...data };
  });
}

module.exports = { start, recordSave, recordLoot, summary };
