// 配裝分享的短連結服務（Cloudflare Workers + KV）
// 需要的設定（在 Cloudflare 後台的 Worker →「設定」裡加）：
//   KV 命名空間綁定：變數名稱 LINKS
//   環境變數 GUIDE_URL    ＝試算頁的完整網址，例 https://帳號.github.io/taiwan_game2/凡塵修仙傳/屬性與技能.html
//   環境變數 ALLOW_ORIGIN ＝攻略站的來源（只到網域，結尾不要斜線），例 https://帳號.github.io
//
// 用法：
//   POST /new      內容＝分享資料（試算頁網址 #b= 後面那一串）→ 回傳代號（純文字）
//   GET  /代號      → 轉到 GUIDE_URL#b=分享資料
//   GET  /get/代號  → 回傳分享資料（純文字）
const ID_LEN = 7, TTL = 400 * 86400, MAX = 12000;
const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// 代號由內容算出來：同一份配裝永遠拿到同一個代號，不會重複佔空間
async function idOf(data, salt) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + data)));
  let s = "";
  for (let i = 0; i < ID_LEN; i++) s += B62[h[i] % 62];
  return s;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get("Origin") || "", okOrigin = origin === env.ALLOW_ORIGIN;
    const cors = { "Access-Control-Allow-Origin": env.ALLOW_ORIGIN, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
    const text = (s, status = 200) => new Response(s, { status, headers: Object.assign({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, cors) });
    const page = (msg, status) => new Response(`<!DOCTYPE html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>分享連結</title><body style="font:16px/1.8 system-ui,sans-serif;max-width:520px;margin:18vh auto;padding:0 18px"><p>${msg}</p><p><a href="${env.GUIDE_URL}">前往屬性與技能試算</a></p></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (req.method === "POST" && url.pathname === "/new") {
      // 只收攻略站送來的、格式正確的分享資料（只會是英數、-、_）
      if (!okOrigin) return text("forbidden", 403);
      const data = (await req.text()).trim();
      if (data.length > MAX || !/^[zj][\w-]{20,}$/.test(data)) return text("bad data", 400);
      for (let n = 0; n < 5; n++) {
        const id = await idOf(data, n ? String(n) : ""), old = await env.LINKS.get(id);
        if (old === data) return text(id);
        if (old === null) {
          // 免費方案每天的寫入次數有上限；用完時回 429，試算頁會請玩家明天再試
          try { await env.LINKS.put(id, data, { expirationTtl: TTL }); } catch (e) { return text("quota", 429); }
          return text(id);
        }
      }
      return text("busy", 503);
    }

    if (req.method === "GET") {
      if (url.pathname === "/") return Response.redirect(env.GUIDE_URL, 302);
      const m = url.pathname.match(/^\/(get\/)?([0-9A-Za-z]{5,12})$/);
      if (!m) return text("not found", 404);
      const data = await env.LINKS.get(m[2]);
      if (m[1]) return data === null ? text("not found", 404) : text(data);
      if (data === null) return page("這條分享連結已經失效或不存在，請對方重新分享。", 404);
      // 只會轉到攻略站的試算頁，不能被拿來轉去別的網站
      return new Response(null, { status: 302, headers: { Location: env.GUIDE_URL + "#b=" + data, "Cache-Control": "no-store" } });
    }
    return text("method not allowed", 405);
  }
};
