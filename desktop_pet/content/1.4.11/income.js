// 每小時收益紀錄：把遊戲裡的收支照「整點到整點」分段累計，寫進使用者資料夾的 income-log.json。
// 這份檔案只記「這次開程式以來」的，每次啟動都會被新的蓋掉。
//
// 數字來源是遊戲 session 裡的累計計數器（main.js 的 READ_STATE 讀出來）：
//   hunt    打怪收入＝掉落物照商店賣價估的價值（這遊戲打怪不直接掉錢，錢是賣掉落物來的）
//   sales   自動販售收入＝實際賣東西進帳的金幣
//   potions 自動喝水支出＝買 HP 藥水＋AP 藥水
//   pets    寵物支出＝寵物飼料／便當＋戰寵藥水
//   misc    雜項支出＝投擲道具＋聖水
// 計數器只會往上加，前後兩次讀到的差就是這段時間發生的量。
//
// 另外記每樣東西「拿到幾個、其中賣掉幾個」（items）：
//   拿到＝遊戲的掉落統計（session.drops）；賣掉＝main.js 掛在遊戲自動販售上的紀錄（見 READ_STATE）。
//   手動在村莊賣的不會算進「賣掉」。
const fs = require("fs");

const KEYS = ["hunt", "sales", "potions", "pets", "misc"];
const HOUR_MS = 36e5;
const WRITE_EVERY_MS = 30000;
const MAX_GAP_MS = 15000; // 兩次取樣隔超過這麼久（電腦睡著、遊戲重新載入）就不算在「有在掛機的時間」裡

let file;
let startedAt = Date.now();
let hours = []; // [{ start, hunt, sales, potions, pets, misc, activeMs, items: { 物品id: { got, sold } } }]，舊的在前
let prev; // 上一次取樣 { id, at, ...計數器 }
let dirty = false;
let lastWrite = 0;

function write() {
  if (!file) return;
  try {
    fs.writeFileSync(file, JSON.stringify({ startedAt, updatedAt: Date.now(), hours }, null, 2));
    dirty = false;
    lastWrite = Date.now();
  } catch (e) {
    console.error("收益紀錄寫不進去：", e.message);
  }
}

/** 程式啟動時呼叫：從空白開始，把上一次的檔案蓋掉。 */
function start(filePath) {
  file = filePath;
  startedAt = Date.now();
  hours = [];
  prev = undefined;
  write();
}

function bucketFor(now) {
  const start = Math.floor(now / HOUR_MS) * HOUR_MS;
  let bucket = hours[hours.length - 1];
  if (!bucket || bucket.start !== start) {
    bucket = { start, hunt: 0, sales: 0, potions: 0, pets: 0, misc: 0, activeMs: 0, items: {} };
    hours.push(bucket);
  }
  return bucket;
}

/** 遊戲重新載入之後呼叫：下一筆只當基準。不然重新載入時遊戲補算的離線收益會整包灌進這個小時。 */
function rebaseline() {
  prev = undefined;
}

/** 把 [[物品id, 累計數量], …] 跟上一次比，差額加進這個小時的 items[id][field]。 */
function addItems(bucket, field, list, prevList) {
  const before = new Map(prevList ?? []);
  for (const [itemId, count] of list ?? []) {
    let gained = count - (before.get(itemId) ?? 0);
    if (gained < 0) gained = count; // 統計被清空重算了
    if (gained <= 0) continue;
    const item = (bucket.items[itemId] ??= { got: 0, sold: 0 });
    item[field] += gained;
    dirty = true;
  }
}

/**
 * 每次讀到遊戲狀態時呼叫。sample＝各計數器目前的累計值（另外帶 drops、sold 兩份物品清單）；
 * id＝角色 id（換角色要重新取基準）。
 */
function record(id, sample, now = Date.now()) {
  if (prev && prev.id === id) {
    const bucket = bucketFor(now);
    addItems(bucket, "got", sample.drops, prev.drops);
    addItems(bucket, "sold", sample.sold, prev.sold);
    for (const key of KEYS) {
      let gained = sample[key] - prev[key];
      // 變小＝計數器歸零重算了（重新出發時掉落統計會清空），這時候目前的值就是歸零後新增的量
      if (gained < 0) gained = sample[key];
      if (gained > 0) {
        bucket[key] += gained;
        dirty = true;
      }
    }
    const gap = now - prev.at;
    if (gap <= MAX_GAP_MS) bucket.activeMs += gap;
  }
  prev = { id, at: now, ...sample };
  if (dirty && now - lastWrite >= WRITE_EVERY_MS) write();
}

const net = (h) => h.sales - h.potions - h.pets - h.misc;

/** 給選單跟明細視窗用的整理結果。 */
function summary() {
  const total = { hunt: 0, sales: 0, potions: 0, pets: 0, misc: 0, activeMs: 0, items: {} };
  for (const h of hours) {
    for (const key of [...KEYS, "activeMs"]) total[key] += h[key];
    for (const [itemId, item] of Object.entries(h.items)) {
      const sum = (total.items[itemId] ??= { got: 0, sold: 0 });
      sum.got += item.got;
      sum.sold += item.sold;
    }
  }
  const perHour = (value) => (total.activeMs > 0 ? Math.round((value / total.activeMs) * HOUR_MS) : 0);
  return {
    startedAt,
    hours: hours.map((h) => ({ ...h, net: net(h) })),
    total: { ...total, net: net(total) },
    average: { ...Object.fromEntries(KEYS.map((key) => [key, perHour(total[key])])), net: perHour(net(total)) },
    current: hours.length ? { ...hours[hours.length - 1], net: net(hours[hours.length - 1]) } : undefined,
  };
}

module.exports = { start, record, rebaseline, summary, flush: () => dirty && write(), KEYS };
