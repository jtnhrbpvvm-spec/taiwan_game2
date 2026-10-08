// 黑店（黑市商人／名品館）優惠時段提醒。
//
// 匯率公式跟書籤工具 loader.js 的「名品館今日提示」是同一份，抄自遊戲 bundle（2026-10-08 版對過，沒變）：
// 每個整點一個匯率，只跟「從 1970 年起第幾個小時」有關，所以今天每個小時的價格都能先算出來，不用問遊戲。
// 遊戲哪天改了公式，這裡報的時段就會錯；main.js 會在使用者打開黑店面板時順便拿畫面上的匯率對帳，
// 對不上就把提醒關掉。
const HOUR_MS = 36e5;
const SUPER_RATE = 22000; // 當天最低匯率在這個值以下（含）算超絕特惠，提醒前面多一句
const REMIND_HOURS_BEFORE = 3;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 1831565813) >>> 0;
    let e = Math.imul(s ^ (s >>> 15), 1 | s);
    e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e;
    return ((e ^ (e >>> 14)) >>> 0) / 4294967296;
  };
}

/** 第 period 個小時（Date.now() / 一小時，取整數）的匯率，20,000～50,000，500 一階。 */
const rate = (period) => 20000 + Math.floor(rng(Math.imul(period, 2654435761) ^ 1835101292)() * 61) * 500;

const periodOf = (date) => Math.floor(date.getTime() / HOUR_MS);

/**
 * 今天（本機時間 00～23 點）的優惠時段：最低價的那個小時。
 * 並列最低有好幾個小時的話挑「還沒過的第一個」；今天的都過了就回傳 undefined。
 */
function todayTarget(now = new Date()) {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const hours = [];
  for (let hour = 0; hour < 24; hour++) {
    const period = Math.floor((dayStart + hour * HOUR_MS) / HOUR_MS);
    hours.push({ hour, period, rate: rate(period) });
  }
  const min = Math.min(...hours.map((h) => h.rate));
  const target = hours.find((h) => h.rate === min && h.period >= periodOf(now));
  return target && { ...target, superSale: min <= SUPER_RATE };
}

/**
 * 現在這個小時該不該提醒。優惠前 3 小時起每個小時一句，優惠那一小時再一句。
 * key 是「這個小時」的編號，呼叫的人用它確保同一個小時只講一次。
 */
function reminder(now = new Date()) {
  const target = todayTarget(now);
  if (!target) return undefined;
  const hoursLeft = target.period - periodOf(now);
  if (hoursLeft > REMIND_HOURS_BEFORE) return undefined;
  const prefix = target.superSale ? "今日超絕特惠價！" : "";
  const text =
    hoursLeft === 0
      ? `${prefix}現在是黑店優惠價，到 ${target.hour + 1} 點為止`
      : `${prefix}今日 ${target.hour} 點黑店優惠價（還有 ${hoursLeft} 小時）`;
  return { key: periodOf(now), text };
}

// 一天分四個時段，每 6 小時一段，跟書籤工具的「今日提示」一樣：清晨 00～05、上午 06～11、下午 12～17、晚間 18～23
const dayPart = (hour) => ["清晨", "上午", "下午", "晚間"][Math.floor(hour / 6)];

/**
 * 每次打開桌寵時講的那一句：今天的特價落在哪個時段（只講時段，不講幾點；快到的時候 reminder() 才會報確切時間）。
 * 今天的已經過了就改報明天的。
 */
function dailyHint(now = new Date()) {
  const today = todayTarget(now);
  if (today) return `${today.superSale ? "今日超絕特惠價！" : ""}今日黑店特價在${dayPart(today.hour)}`;
  const tomorrow = todayTarget(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  return `今日黑店特價時段已經過了，明天在${dayPart(tomorrow.hour)}${tomorrow.superSale ? "，而且是超絕特惠價" : ""}`;
}

/** 到下一個整點還有幾毫秒。 */
const msToNextHour = (now = new Date()) => HOUR_MS - (now.getTime() % HOUR_MS);

module.exports = { rate, periodOf, todayTarget, reminder, dailyHint, msToNextHour };
