// 解開黑暗大陸的本機存檔文字（只讀，不寫回去）。
// 遊戲存在 localStorage 的是加密過的文字（遊戲的 guard.js saveEncode）：'DS1' + 初始值 8 碼 + 簽章 28 碼 + base64(XOR 後的 UTF-8)。
// 這裡照抄 guard.js 的 guardHash／guardStream／guardXor，解出來的就是遊戲自己的存檔 JSON。
// 遊戲哪天換了加密方式，這裡會解不出來（回傳 null），桌寵就只是不顯示角色狀態，遊戲照常跑。
const GUARD_LS_KEY = "q7Lx!dS-2026-ark";

function guardHash(str, seed) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

function guardStream(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

function guardXor(bytes, nonceHex) {
  const next = guardStream(parseInt(guardHash(GUARD_LS_KEY + nonceHex, 3).slice(-8), 16));
  let r = 0;
  for (let i = 0; i < bytes.length; i++) {
    if ((i & 3) === 0) r = next();
    bytes[i] ^= (r >>> ((i & 3) * 8)) & 255;
  }
  return bytes;
}

/** 存檔文字 → 存檔物件 { schema, t, player, … }；沒有或解不開回傳 null。 */
function parseSave(raw) {
  if (!raw) return null;
  try {
    if (raw.charAt(0) === "{") return JSON.parse(raw); // 改版前的未加密存檔
    if (raw.slice(0, 3) !== "DS1") return null;
    const nonce = raw.slice(3, 11);
    const bytes = guardXor(Buffer.from(raw.slice(39), "base64"), nonce);
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    return null;
  }
}

module.exports = { parseSave };
