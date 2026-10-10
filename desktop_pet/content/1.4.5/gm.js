// 線上GM（遊戲裡的 NPC〔復活節兔子〕）出現時間的提醒。
// 拿〔天上之蛋〕跟他擲十八啦，贏了可以換到特殊的蛋，但他只會不定期出現在歡喜城。
//
// 出現的規則抄自遊戲 bundle（2026-10-08 20:51 那版的 bb / xb / Sb / Cb），跟黑店匯率一樣只看時間，
// 所以可以事先算出來，不用問遊戲：
//   - 一律用台灣時間（UTC+8），跟電腦設的時區無關
//   - 每天從早上 6 點起分成兩段，每段 9 小時：06:00～15:00、15:00～24:00
//   - 每段出現一次、一次 1 小時，開始時間是那一段裡的某個整點（第 0～8 個小時，用段落編號當亂數種子決定）
//   - 凌晨 0～6 點不會出現
// 遊戲哪天改了規則，這裡報的時間就會錯；自我測試會拿遊戲自己算的 gmWakeInMs() 來對帳。
const { rng } = require("./mall");

const HOUR_MS = 36e5;
const DAY_MS = 24 * HOUR_MS;
const TAIWAN_OFFSET_MS = 8 * HOUR_MS;
const DAY_STARTS_AT_MS = 6 * HOUR_MS; // 每天從早上 6 點起算
const WINDOWS_PER_DAY = 2;
const PERIOD_MS = 9 * HOUR_MS;
const START_SLOTS = 9; // 開始時間可以落在那一段的第 0～8 個小時
const DURATION_MS = HOUR_MS;
const SEED = 1735222371;
const REMIND_BEFORE_MS = HOUR_MS;
const TOWN = "歡喜城";

/** 這個時間點屬於第幾段（從 1970 年起算的編號）。凌晨 0～6 點算在前一天的第二段。 */
function periodIndex(ms) {
  const local = ms + TAIWAN_OFFSET_MS;
  const day = Math.floor(local / DAY_MS);
  return day * WINDOWS_PER_DAY + Math.floor((local - day * DAY_MS - DAY_STARTS_AT_MS) / PERIOD_MS);
}

/** 第 index 段從什麼時候開始。 */
function periodStart(index) {
  const day = Math.floor(index / WINDOWS_PER_DAY);
  return day * DAY_MS - TAIWAN_OFFSET_MS + DAY_STARTS_AT_MS + (index - day * WINDOWS_PER_DAY) * PERIOD_MS;
}

/** 第 index 段裡 GM 出現的那一小時。window 是這一次出現的編號，遊戲用它記玩家這次擲過了沒。 */
function windowOf(index) {
  const slot = Math.floor(rng(Math.imul(index, 2654435761) ^ SEED)() * START_SLOTS);
  const startMs = periodStart(index) + slot * HOUR_MS;
  return { window: index, startMs, endMs: startMs + DURATION_MS };
}

/** 正在進行、或接下來最近的那一次出現。 */
function upcoming(now = Date.now()) {
  const index = periodIndex(now);
  const current = windowOf(index);
  return now < current.endMs ? current : windowOf(index + 1);
}

/** 跟遊戲的 gmWakeInMs() 同一個算法：離下一次「狀態改變」（出現、離開、換下一段）還有幾毫秒。對帳用。 */
function wakeInMs(now = Date.now()) {
  const current = windowOf(periodIndex(now));
  if (now < current.startMs) return current.startMs - now;
  if (now < current.endMs) return current.endMs - now;
  return periodStart(periodIndex(now) + 1) - now;
}

const taiwanHour = (ms) => Math.floor(((ms + TAIWAN_OFFSET_MS) % DAY_MS) / HOUR_MS);

/**
 * 現在該不該提醒。出現前一小時內講一次、出現的那一小時講一次。
 * playedWindow＝存檔裡記的「已經擲過的那一次」的編號，這次已經擲過就不用再叫人去。
 * key 用來確保同一件事只講一次。
 */
function reminder(now = Date.now(), playedWindow) {
  const w = upcoming(now);
  if (now >= w.startMs) {
    if (playedWindow === w.window) return undefined;
    return { key: `here-${w.window}`, text: `線上GM 現在在${TOWN}，到 ${taiwanHour(w.endMs)} 點為止` };
  }
  const left = w.startMs - now;
  if (left > REMIND_BEFORE_MS) return undefined;
  const minutes = Math.round(left / 60000);
  const when = minutes >= 58 ? "1 小時後" : `${minutes} 分鐘後`;
  return { key: `soon-${w.window}`, text: `線上GM ${when}（${taiwanHour(w.startMs)} 點）會出現在${TOWN}` };
}

module.exports = { periodIndex, windowOf, upcoming, wakeInMs, reminder, taiwanHour };
