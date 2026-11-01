// Cloudflare Worker：網頁按「天氣」時即時向氣象署抓白沙灣逐時氣溫
// 部署方式見對話說明；金鑰（選用）放在 Worker 的 Secret「CWA_KEY」，不會出現在網頁
// 回傳格式與 weather-data 分支的 weather.json 相同：{ stations, records }
const STATION = 'C0AI20', NAME = '白沙灣';
const DAY = 86400000, HOUR = 3600000;
const taipeiDate = ms => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(ms); // YYYY-MM-DD
const taipeiHour = ms => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', hourCycle: 'h23' }).format(ms);
const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };

// 最近 24 小時：氣象署單站頁面的逐時表
async function fromStationPage(add) {
  const res = await fetch(`https://www.cwa.gov.tw/V8/C/W/Observe/MOD/24hr/${STATION.slice(0, 5)}.html?T=${Date.now()}`);
  if (!res.ok) throw new Error(`回應 ${res.status}`);
  const html = await res.text();
  const today = taipeiDate(Date.now()), year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  for (const m of html.matchAll(/(\d{2})\/(\d{2})<br[^>]*>\s*(\d{2}):00<\/th>[\s\S]*?class="tem-C[^"]*">([-\d.]+)</g)) {
    const y = Number(m[1]) > month ? year - 1 : year; // 1 月初看到 12 月的資料
    add(Date.parse(`${y}-${m[1]}-${m[2]}T${m[3]}:00:00+08:00`), m[4]);
  }
}

// 前天、昨天完整逐時：CODiS（昨天的要等氣象署整理完才有）
async function fromCodis(add) {
  for (const date of [taipeiDate(Date.now() - 2 * DAY), taipeiDate(Date.now() - DAY)]) {
    const body = new URLSearchParams({ date: `${date}T00:00:00.000+08:00`, type: 'report_date', stn_ID: STATION,
      stn_type: 'auto_C0', more: '', start: `${date}T00:00:00`, end: `${date}T23:59:59` });
    const res = await fetch('https://codis.cwa.gov.tw/api/station', { method: 'POST', body });
    if (!res.ok) throw new Error(`回應 ${res.status}`);
    for (const r of (await res.json()).data?.[0]?.dts ?? []) add(Math.round(Date.parse(`${r.DataTime}+08:00`) / HOUR) * HOUR, r.AirTemperature?.Instantaneous);
  }
}

// 最新一筆：開放資料 API（有設定 CWA_KEY 才用）
async function fromOpenData(add, key) {
  if (!key) return;
  const res = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
    + `?Authorization=${encodeURIComponent(key)}&StationId=${STATION}&WeatherElement=AirTemperature`);
  if (!res.ok) throw new Error(`回應 ${res.status}`);
  for (const s of (await res.json())?.records?.Station ?? []) add(Date.parse(s.ObsTime?.DateTime), s.WeatherElement?.AirTemperature);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const records = {}, errors = [];
    const add = (ms, value) => {
      const t = Number(value);
      if (!Number.isFinite(ms) || value === null || value === '' || !Number.isFinite(t) || t < -90) return; // -99 代表缺測
      records[`${taipeiDate(ms)}T${taipeiHour(ms)}:00:00+08:00`] = { [STATION]: t };
    };
    const sources = [['CODiS', fromCodis], ['單站頁面', fromStationPage], ['開放資料 API', add => fromOpenData(add, env.CWA_KEY)]];
    await Promise.all(sources.map(([name, source]) => source(add).catch(e => errors.push(`${name}：${e.message}`))));
    const sorted = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b)));
    return new Response(JSON.stringify({ stations: { [STATION]: NAME }, records: sorted, errors }), { headers: CORS });
  },
};
