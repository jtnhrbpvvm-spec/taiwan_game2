// 抓白沙灣測站逐時氣溫，併入 weather.json，只保留最近 3 天
// 用法：CWA_KEY=金鑰 node weather.js weather.json
// GitHub 排程常被延遲或跳過，所以每次都把能拿到的過去資料一起補齊：
//   1. CODiS：前天、昨天完整逐時資料（不需金鑰，今天的要隔天才有）
//   2. 氣象署單站頁面：最近 24 小時逐時表
//   3. 開放資料 API：最新一筆（需金鑰）
const fs = require('fs');

const file = process.argv[2];
const STATION = 'C0AI20', NAME = '白沙灣';
const KEEP_MS = 3 * 86400000;
const DAY = 86400000;
const taipeiDate = ms => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(ms); // YYYY-MM-DD
const key = (date, hh) => `${date}T${hh}:00:00+08:00`;

async function fromCodis(add) {
  for (const date of [taipeiDate(Date.now() - 2 * DAY), taipeiDate(Date.now() - DAY)]) {
    const body = new URLSearchParams({ date: `${date}T00:00:00.000+08:00`, type: 'report_date', stn_ID: STATION,
      stn_type: 'auto_C0', more: '', start: `${date}T00:00:00`, end: `${date}T23:59:59` });
    const res = await fetch('https://codis.cwa.gov.tw/api/station', { method: 'POST', body });
    if (!res.ok) throw new Error(`回應 ${res.status}`);
    // DataTime 例：2026-10-30T01:00:00，最後一筆是隔天 00:00
    for (const r of (await res.json()).data?.[0]?.dts ?? []) {
      add(Date.parse(`${r.DataTime}+08:00`), r.AirTemperature?.Instantaneous);
    }
  }
}

async function fromStationPage(add) {
  const res = await fetch(`https://www.cwa.gov.tw/V8/C/W/Observe/MOD/24hr/${STATION.slice(0, 5)}.html?T=${Date.now()}`);
  if (!res.ok) throw new Error(`回應 ${res.status}`);
  const html = await res.text();
  const year = Number(taipeiDate(Date.now()).slice(0, 4)), month = Number(taipeiDate(Date.now()).slice(5, 7));
  // 每列：<th ...>11/01<br ...> 01:00</th> ... <span class="tem-C ...">23.9</span>
  for (const m of html.matchAll(/(\d{2})\/(\d{2})<br[^>]*>\s*(\d{2}):00<\/th>[\s\S]*?class="tem-C[^"]*">([-\d.]+)</g)) {
    const y = Number(m[1]) > month ? year - 1 : year; // 1 月初看到 12 月的資料
    add(Date.parse(`${y}-${m[1]}-${m[2]}T${m[3]}:00:00+08:00`), m[4]);
  }
}

async function fromOpenData(add) {
  if (!process.env.CWA_KEY) throw new Error('缺少 CWA_KEY（請確認 Secrets 裡有 Weather）');
  const url = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
    + `?Authorization=${encodeURIComponent(process.env.CWA_KEY)}&StationId=${STATION}&WeatherElement=AirTemperature`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`回應 ${res.status}`);
  for (const s of (await res.json())?.records?.Station ?? []) add(Date.parse(s.ObsTime?.DateTime), s.WeatherElement?.AirTemperature);
}

async function main() {
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { stations: {}, records: {} };
  data.stations = { [STATION]: NAME };
  for (const time in data.records) data.records[time] = { [STATION]: data.records[time][STATION] };

  let added = 0, ok = 0;
  const add = (ms, value) => {
    const t = Number(value);
    if (!Number.isFinite(ms) || value === null || value === '' || !Number.isFinite(t) || t < -90) return; // -99 代表缺測
    const hh = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', hourCycle: 'h23' }).format(ms);
    data.records[key(taipeiDate(ms), hh)] = { [STATION]: t };
    added++;
  };
  for (const [name, source] of [['CODiS', fromCodis], ['單站頁面', fromStationPage], ['開放資料 API', fromOpenData]]) {
    const before = added;
    try { await source(add); ok++; console.log(`${name}：${added - before} 筆`); }
    catch (e) { console.warn(`${name} 失敗：${e.message}`); }
  }
  if (!ok) throw new Error('所有資料來源都失敗');

  const cutoff = Date.now() - KEEP_MS;
  data.records = Object.fromEntries(Object.entries(data.records)
    .filter(([time, rec]) => Date.parse(time) >= cutoff && rec[STATION] !== undefined)
    .sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
