// 桌寵「回報效能異常」的收件處：Cloudflare Worker＋Durable Object（SQLite）。不在桌寵安裝檔裡，部署在 Cloudflare 上。
//
//   POST /report          桌寵上傳一份報告（JSON，最大 REPORT_MAX 位元組），回 { id }
//   GET  /reports?key=…    報告列表（網頁）；key 要等於 Worker 的祕密變數 ADMIN_KEY，沒設 ADMIN_KEY 就不開放
//   GET  /reports/<id>?key=…  一份報告的完整 JSON
//
// 資料全部存在同一個 Durable Object（名稱 "main"）的 SQLite 表 reports，
// 也可以在 Cloudflare 後台 Durable Objects → dark-pet-report_ReportStore → 該物件的資料瀏覽直接看。
// 部署：Worker 名稱 dark-pet-report，綁定 REPORTS → class ReportStore（new_sqlite_classes 遷移）。
import { DurableObject } from "cloudflare:workers";

const REPORT_MAX = 256 * 1024;
const PER_HOUR = 10; // 同一個 IP 一小時最多收幾份，避免被灌爆
const KEEP = 5000; // 最多留幾份，多的刪最舊的

export class ReportStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, created_at TEXT, ip_hash TEXT, install_id TEXT, pet_version TEXT,
      cpu_total REAL, cpu_top TEXT, system_cpu REAL, pet_count INTEGER, power_save INTEGER,
      os TEXT, cpu_model TEXT, data TEXT)`);
  }

  add(report, ipHash) {
    const hourAgo = new Date(Date.now() - 3600e3).toISOString();
    const recent = this.sql.exec("SELECT COUNT(*) AS n FROM reports WHERE ip_hash = ? AND created_at > ?", ipHash, hourAgo).one().n;
    if (recent >= PER_HOUR) return { error: "太多次了，請一小時後再試" };
    const id = crypto.randomUUID().slice(0, 8).toUpperCase();
    const s = report.summary ?? {};
    const text = (v) => (v == null ? null : String(v).slice(0, 200));
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
    this.sql.exec(
      "INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      id, new Date().toISOString(), ipHash, text(report.installId), text(report.app?.content ?? report.app?.version),
      num(s.cpuTotal), text(s.cpuTop), num(s.systemCpu), num(report.settings?.petCount), report.settings?.powerSave ? 1 : 0,
      text(report.system?.os), text(report.system?.cpuModel), JSON.stringify(report));
    this.sql.exec("DELETE FROM reports WHERE id NOT IN (SELECT id FROM reports ORDER BY created_at DESC LIMIT ?)", KEEP);
    return { id };
  }

  list(limit) {
    return this.sql.exec(`SELECT id, created_at, install_id, pet_version, cpu_total, cpu_top, system_cpu, pet_count, power_save, os, cpu_model
      FROM reports ORDER BY created_at DESC LIMIT ?`, limit).toArray();
  }

  get(id) {
    const row = this.sql.exec("SELECT data FROM reports WHERE id = ?", id).toArray()[0];
    return row ? row.data : null;
  }
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const store = env.REPORTS.get(env.REPORTS.idFromName("main"));

    if (url.pathname === "/report" && request.method === "POST") {
      const body = await request.text();
      if (body.length > REPORT_MAX) return json({ error: "報告太大" }, 413);
      let report;
      try {
        report = JSON.parse(body);
      } catch {
        return json({ error: "格式不對" }, 400);
      }
      if (!report || typeof report !== "object" || report.kind !== "dark-pet-perf") return json({ error: "格式不對" }, 400);
      const result = await store.add(report, await sha(request.headers.get("cf-connecting-ip") ?? ""));
      return json(result, result.error ? 429 : 200);
    }

    if (url.pathname.startsWith("/reports")) {
      if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) return new Response("沒有權限", { status: 403 });
      const id = url.pathname.split("/")[2];
      if (id) {
        const data = await store.get(id.toUpperCase());
        return data ? new Response(data, { headers: { "content-type": "application/json; charset=utf-8" } }) : json({ error: "找不到" }, 404);
      }
      const rows = await store.list(Math.min(500, Number(url.searchParams.get("limit")) || 200));
      const key = encodeURIComponent(url.searchParams.get("key"));
      const cols = ["id", "created_at", "pet_version", "cpu_total", "cpu_top", "system_cpu", "pet_count", "power_save", "os", "cpu_model", "install_id"];
      const html = `<!doctype html><meta charset="utf-8"><title>桌寵效能回報</title>
<style>body{font:13px system-ui;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 6px;text-align:left}</style>
<h2>桌寵效能回報（最新 ${rows.length} 份）</h2><table><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>
${rows.map((r) => `<tr>${cols.map((c) => `<td>${c === "id" ? `<a href="/reports/${esc(r.id)}?key=${key}">${esc(r.id)}</a>` : esc(r[c])}</td>`).join("")}</tr>`).join("\n")}
</table>`;
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    return new Response("dark-pet-report ok");
  },
};
