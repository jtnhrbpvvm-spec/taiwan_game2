// 抓石門區測站最新逐時氣溫，併入 weather.json，只保留最近 3 天
// 用法：CWA_KEY=金鑰 node weather.js weather.json
const fs = require('fs');

const file = process.argv[2];
const STATIONS = ['C0AI20', 'C0AJ40', 'C2A920']; // 白沙灣、石門、富貴角
const KEEP_MS = 3 * 86400000;

async function main() {
  const key = process.env.CWA_KEY;
  if (!key) throw new Error('缺少 CWA_KEY（請確認 Secrets 裡有 Weather）');
  const url = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
    + `?Authorization=${encodeURIComponent(key)}&StationId=${STATIONS.join(',')}&WeatherElement=AirTemperature`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`氣象署 API 回應 ${res.status}`);
  const stations = (await res.json())?.records?.Station;
  if (!Array.isArray(stations) || !stations.length) throw new Error('氣象署 API 沒有回傳任何測站資料');

  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { stations: {}, records: {} };
  for (const s of stations) {
    const time = s.ObsTime?.DateTime; // 例：2026-10-31T10:00:00+08:00
    const t = Number(s.WeatherElement?.AirTemperature);
    data.stations[s.StationId] = s.StationName;
    if (time && Number.isFinite(t) && t > -90) (data.records[time] ??= {})[s.StationId] = t; // -99 代表缺測
    console.log(s.StationId, s.StationName, time, t);
  }

  const cutoff = Date.now() - KEEP_MS;
  data.records = Object.fromEntries(Object.entries(data.records)
    .filter(([time]) => Date.parse(time) >= cutoff)
    .sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
