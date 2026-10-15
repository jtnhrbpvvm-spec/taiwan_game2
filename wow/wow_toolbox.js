void (() => {
const GAME = 'https://wow.aethus.pl/';
const LAUNCH_KEYS = ['glue', 'bg', 'class', 'race', 'name', 'gender'];
const PERF_KEYS = ['pbr_lite', 'pipe_warm', 'renderScale', 'farclip', 'MasterVolume'];
const onGame = () => location.hostname === 'wow.aethus.pl'
|| /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
function gameUrl(params) {
const base = onGame() ? location.origin + '/' : GAME;
const qs = params.toString();
return base + (qs ? '?' + qs : '');
}
const currentParams = () => new URLSearchParams(
onGame() && /^\/(index\.html)?$/.test(location.pathname) ? location.search : '');
function h(tag, attrs, ...kids) {
const el = document.createElement(tag);
for (const [k, v] of Object.entries(attrs || {})) {
if (v === undefined || v === null || v === false) continue;
if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
else if (k === 'style') el.style.cssText = v;
else if (k in el && k !== 'list') el[k] = v;
else el.setAttribute(k, v === true ? '' : v);
}
for (const kid of kids.flat()) {
if (kid === null || kid === undefined || kid === false) continue;
el.append(kid instanceof Node ? kid : String(kid));
}
return el;
}
const select = (options, value) => h('select', {},
options.map(([v, t]) => h('option', { value: v, selected: v === value }, t)));
function msgLine() {
const el = h('div', { className: 'msg' });
el.ok = (t) => { el.className = 'msg'; el.textContent = t; };
el.err = (e) => { el.className = 'err'; el.textContent = '失敗：' + (e?.message || e); };
return el;
}
function load(key, dflt) {
try { const v = JSON.parse(localStorage.getItem(key)); return v ?? dflt; } catch { return dflt; }
}
function store(key, value) {
try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function saveFile(name, blob) {
const url = URL.createObjectURL(blob);
const a = h('a', { href: url, download: name, style: 'display:none' });
document.body.append(a);
a.click();
a.remove();
setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function pickFile(accept) {
return new Promise((resolve) => {
const input = h('input', { type: 'file', accept, style: 'display:none' });
document.body.append(input);
const done = (v) => { input.remove(); resolve(v); };
input.addEventListener('change', () => done(input.files[0] || null));
input.addEventListener('cancel', () => done(null));
input.click();
});
}
function stamp() {
const d = new Date();
const p = (n) => String(n).padStart(2, '0');
return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}`;
}
const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1024).toFixed(1) + ' KB');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (r) => new Promise((resolve, reject) => {
r.onsuccess = () => resolve(r.result);
r.onerror = () => reject(r.error);
});
const ZONES = [['av', '奧特蘭克山谷'], ['ab', '阿拉希盆地'], ['wsg', '戰歌峽谷'], ['elwynn', '艾爾文森林'],
['duskwood', '暮色森林'], ['feralas', '菲拉斯'], ['brm', '黑石山'], ['aq', '安其拉之門'], ['arena', '古拉巴許競技場']];
const CLASSES = [['warrior', '戰士'], ['paladin', '聖騎士'], ['hunter', '獵人'], ['rogue', '盜賊'], ['priest', '牧師'],
['shaman', '薩滿'], ['mage', '法師'], ['warlock', '術士'], ['druid', '德魯伊']];
const RACES = [['human', '人類'], ['orc', '獸人'], ['dwarf', '矮人'], ['nightelf', '夜精靈'], ['scourge', '不死族'],
['tauren', '牛頭人'], ['gnome', '地精'], ['troll', '食人妖']];
const LAUNCH_SAVE = 'wowbm.quickLaunch';
function launchTab(body) {
const cur = currentParams();
const saved = load(LAUNCH_SAVE, {});
const pick = (k, dflt) => cur.get(k) || saved[k] || dflt;
const mode = select([['run', '直接開局（跳過主畫面）'], ['glue', '伺服器列表／角色選擇'], ['home', '遊戲原本的主畫面']],
cur.get('glue') ? 'glue' : cur.get('bg') ? 'run' : saved.mode || 'run');
const zone = select(ZONES, pick('bg', 'av'));
const cls = select([['*', '（隨機）'], ...CLASSES], pick('class', 'mage'));
const race = select([['*', '（隨機）'], ...RACES], pick('race', 'human'));
const gender = select([['', '（不指定）'], ['male', '男'], ['female', '女']], pick('gender', ''));
const name = h('input', { type: 'text', value: pick('name', ''), placeholder: '空白 = 遊戲自己取名', maxLength: 12 });
const runOnly = h('div', { className: 'grid' },
h('label', {}, '地區', zone),
h('label', {}, '職業', cls),
h('label', {}, '種族', race),
h('label', {}, '性別', gender),
h('label', {}, '角色名字', name));
const sync = () => { runOnly.style.display = mode.value === 'run' ? '' : 'none'; };
mode.addEventListener('change', sync);
sync();
const anyOf = (list) => list[Math.floor(Math.random() * list.length)][0];
const buildUrl = () => {
const p = currentParams();
LAUNCH_KEYS.forEach((k) => p.delete(k));
const choice = { mode: mode.value, bg: zone.value, class: cls.value, race: race.value,
gender: gender.value, name: name.value.trim() };
store(LAUNCH_SAVE, choice);
if (choice.mode === 'glue') p.set('glue', '1');
if (choice.mode === 'run') {
p.set('bg', choice.bg);
p.set('class', choice.class === '*' ? anyOf(CLASSES) : choice.class);
p.set('race', choice.race === '*' ? anyOf(RACES) : choice.race);
if (choice.name) p.set('name', choice.name);
if (choice.gender) p.set('gender', choice.gender);
}
return gameUrl(p);
};
const msg = msgLine();
const copy = async () => {
const url = buildUrl();
try {
await navigator.clipboard.writeText(url);
msg.ok('已複製，可以貼到書籤列存成固定的開局書籤：\n' + url);
} catch {
msg.ok('瀏覽器不讓複製，請手動選取：\n' + url);
}
};
body.append(
h('label', {}, '模式', mode),
runOnly,
h('div', { className: 'row' },
h('button', { onclick: () => { location.href = buildUrl(); } }, '開始（重新載入遊戲）'),
h('button', { onclick: copy }, '複製開局網址')),
msg,
h('div', { className: 'note' },
'會重新載入頁面，進行中的這一局會中斷，懸浮按鈕也要再按一次書籤叫出來。',
'選「隨機」每次開局都重抽（複製的網址則固定是抽到的那個）。效能分頁的設定會保留。'));
}
const LOW_SCALE_SAVE = 'wowbm.lowScale';
function perfTab(body) {
const cur = currentParams();
const triple = (on, off) => [['', '自動（遊戲決定）'], ['1', on], ['0', off]];
const lite = select(triple('開：簡化光影（較順）', '關：完整光影跟陰影'), cur.get('pbr_lite') || '');
const warm = select(triple('開：載入時先編譯（之後少卡頓）', '關：用到才編譯（載入快、手機較穩）'),
cur.get('pipe_warm') || '');
const far = h('input', { type: 'number', min: 100, max: 1000, step: 10, value: cur.get('farclip') || '',
placeholder: '空白 = 預設 420' });
const mute = h('input', { type: 'checkbox', checked: cur.get('MasterVolume') === '0' });
const slider = (min, max, pct) => {
const range = h('input', { type: 'range', min, max, step: 5, value: pct });
const label = h('span', { className: 'pct' });
const show = () => { label.textContent = range.value + '%'; };
range.addEventListener('input', show);
show();
return { el: h('span', { className: 'slider' }, range, label), range,
get: () => Number(range.value), set: (v) => { range.value = v; show(); } };
};
const curScale = Number(cur.get('renderScale'));
const scaleOn = h('input', { type: 'checkbox', checked: curScale > 0 });
const scale = slider(50, 200, curScale > 0 ? Math.round(curScale * 100) : 100);
const syncScale = () => { scale.range.disabled = !scaleOn.checked; };
scaleOn.addEventListener('change', syncScale);
syncScale();
const low = slider(50, 100, load(LOW_SCALE_SAVE, 75));
low.range.addEventListener('change', () => store(LOW_SCALE_SAVE, low.get()));
const fill = (p) => {
lite.value = p.pbr_lite || '';
warm.value = p.pipe_warm || '';
far.value = p.farclip || '';
scaleOn.checked = !!p.scale;
if (p.scale) scale.set(p.scale);
syncScale();
};
const presets = {
low: () => fill({ pbr_lite: '1', pipe_warm: '0', farclip: '200', scale: low.get() }),
auto: () => fill({}),
high: () => fill({ pbr_lite: '0', pipe_warm: '1', farclip: '777' }),
};
const apply = () => {
const p = currentParams();
PERF_KEYS.forEach((k) => p.delete(k));
if (lite.value) p.set('pbr_lite', lite.value);
if (warm.value) p.set('pipe_warm', warm.value);
if (scaleOn.checked) p.set('renderScale', String(scale.get() / 100));
const d = Math.round(Number(far.value));
if (far.value !== '' && d > 0) p.set('farclip', String(d));
if (mute.checked) p.set('MasterVolume', '0');
location.href = gameUrl(p);
};
body.append(
h('div', { className: 'row' }, '快速套用：',
h('button', { onclick: presets.low }, '低配'),
h('button', { onclick: presets.auto }, '全部自動'),
h('button', { onclick: presets.high }, '高配')),
h('label', {}, '低配的縮放', low.el),
h('div', { className: 'note' }, '按「低配」時渲染縮放用這個比例。越低越順、畫面越糊；只影響 3D 畫面，介面文字不受影響。'),
h('hr'),
h('div', { className: 'field' }, '渲染縮放',
h('span', { className: 'slider' }, h('label', { className: 'inline' }, scaleOn, '自訂'), scale.el)),
h('label', {}, '簡化光影', lite),
h('label', {}, '預先編譯', warm),
h('label', {}, '地形距離', far),
h('label', {}, '靜音', h('span', {}, mute, ' 總音量設成 0')),
h('div', { className: 'row' }, h('button', { onclick: apply }, '套用（重新載入遊戲）')),
h('div', { className: 'note' },
'會重新載入頁面，進行中的這一局會中斷。渲染縮放不勾「自訂」= 用遊戲 Options 裡存的設定。',
h('br'), '渲染縮放、地形距離、靜音是透過網址覆蓋遊戲設定，還沒在正式網站實測，沒效果的話跟我說。',
h('br'), '目前網址上的效能參數：', h('code', {},
PERF_KEYS.filter((k) => cur.has(k)).map((k) => `${k}=${cur.get(k)}`).join('&') || '（無）')));
}
const FORMAT = 'wow-aethus-backup';
const KNOWN_DBS = ['azeroth-survivors-addons'];
function b64(u8) {
let s = '';
for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
return btoa(s);
}
function unb64(s) {
const bin = atob(s);
const u8 = new Uint8Array(bin.length);
for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
return u8;
}
async function enc(v) {
if (v === null || typeof v !== 'object') {
return typeof v === 'number' && !Number.isFinite(v) ? { $t: 'Number', v: String(v) } : v;
}
if (v instanceof Date) return { $t: 'Date', v: v.getTime() };
if (v instanceof ArrayBuffer) return { $t: 'ArrayBuffer', v: b64(new Uint8Array(v)) };
if (ArrayBuffer.isView(v)) {
return { $t: v.constructor.name, v: b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
}
if (v instanceof Blob) {
return { $t: v instanceof File ? 'File' : 'Blob', type: v.type, name: v.name,
v: b64(new Uint8Array(await v.arrayBuffer())) };
}
if (v instanceof Map) return { $t: 'Map', v: await enc([...v]) };
if (v instanceof Set) return { $t: 'Set', v: await enc([...v]) };
if (Array.isArray(v)) {
const out = [];
for (const x of v) out.push(await enc(x));
return out;
}
const out = {};
for (const k of Object.keys(v)) out[k] = await enc(v[k]);
return '$t' in v ? { $t: 'Object', v: out } : out;
}
function dec(v) {
if (v === null || typeof v !== 'object') return v;
if (Array.isArray(v)) return v.map(dec);
if (typeof v.$t === 'string') {
switch (v.$t) {
case 'Number': return Number(v.v);
case 'Date': return new Date(v.v);
case 'ArrayBuffer': return unb64(v.v).buffer;
case 'DataView': return new DataView(unb64(v.v).buffer);
case 'Blob': return new Blob([unb64(v.v)], { type: v.type });
case 'File': return new File([unb64(v.v)], v.name || 'file', { type: v.type });
case 'Map': return new Map(dec(v.v));
case 'Set': return new Set(dec(v.v));
case 'Object': { const o = {}; for (const k of Object.keys(v.v)) o[k] = dec(v.v[k]); return o; }
default: {
const T = globalThis[v.$t];
if (typeof T === 'function' && T.BYTES_PER_ELEMENT) return new T(unb64(v.v).buffer);
}
}
}
const o = {};
for (const k of Object.keys(v)) o[k] = dec(v[k]);
return o;
}
async function dbNames() {
try {
if (indexedDB.databases) return (await indexedDB.databases()).map((d) => d.name).filter(Boolean);
} catch {}
return KNOWN_DBS;
}
async function dumpDb(name) {
const db = await req(indexedDB.open(name));
const out = { name, version: db.version, stores: [] };
try {
for (const sn of db.objectStoreNames) {
const s = db.transaction(sn, 'readonly').objectStore(sn);
const st = {
name: sn, keyPath: s.keyPath, autoIncrement: s.autoIncrement,
indexes: [...s.indexNames].map((i) => {
const x = s.index(i);
return { name: i, keyPath: x.keyPath, unique: x.unique, multiEntry: x.multiEntry };
}),
records: [],
};
const raw = [];
await new Promise((resolve, reject) => {
const c = s.openCursor();
c.onsuccess = () => {
const cur = c.result;
if (!cur) return resolve();
raw.push([cur.primaryKey, cur.value]);
cur.continue();
};
c.onerror = () => reject(c.error);
});
for (const [k, v] of raw) st.records.push([await enc(k), await enc(v)]);
out.stores.push(st);
}
} finally {
db.close();
}
return out;
}
async function dumpAll() {
const ls = {};
for (let i = 0; i < localStorage.length; i++) {
const k = localStorage.key(i);
ls[k] = localStorage.getItem(k);
}
const dbs = [];
for (const n of await dbNames()) dbs.push(await dumpDb(n));
return { format: FORMAT, version: 1, origin: location.origin, at: new Date().toISOString(),
localStorage: ls, indexedDB: dbs };
}
async function restoreDb(d) {
await new Promise((resolve, reject) => {
const r = indexedDB.deleteDatabase(d.name);
r.onsuccess = resolve;
r.onerror = () => reject(r.error);
r.onblocked = () => reject(new Error(`資料庫 ${d.name} 正在被使用，刪不掉（請關掉其他開著這個網站的分頁）`));
});
const open = indexedDB.open(d.name, d.version || 1);
open.onupgradeneeded = () => {
for (const st of d.stores) {
const s = open.result.createObjectStore(st.name, { keyPath: st.keyPath ?? undefined,
autoIncrement: !!st.autoIncrement });
for (const i of st.indexes || []) s.createIndex(i.name, i.keyPath, { unique: i.unique, multiEntry: i.multiEntry });
}
};
const db = await req(open);
try {
for (const st of d.stores) {
if (!st.records.length) continue;
await new Promise((resolve, reject) => {
const t = db.transaction(st.name, 'readwrite');
const s = t.objectStore(st.name);
for (const [k, v] of st.records) {
if (s.keyPath === null) s.put(dec(v), dec(k));
else s.put(dec(v));
}
t.oncomplete = resolve;
t.onerror = () => reject(t.error);
t.onabort = () => reject(t.error || new Error('寫入中斷'));
});
}
} finally {
db.close();
}
}
function backupTab(body) {
const info = h('div', { className: 'note' }, '讀取中…');
const msg = msgLine();
const showErr = msg.err;
const showMsg = msg.ok;
const gameRunning = !!document.getElementById('benilla');
const refresh = async () => {
try {
const names = await dbNames();
const parts = [`localStorage ${localStorage.length} 筆`];
for (const n of names) {
const d = await dumpDb(n);
parts.push(`資料庫「${n}」${d.stores.map((s) => `${s.name} ${s.records.length} 筆`).join('、') || '空的'}`);
}
info.textContent = '目前這個網站存的資料：' + parts.join('；');
} catch (e) {
info.textContent = '讀不到目前的資料：' + (e?.message || e);
}
};
const doExport = async (btn) => {
btn.disabled = true;
showMsg('匯出中…');
try {
const data = await dumpAll();
const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
saveFile(`AzerothSurvivors 備份 ${stamp()}.json`, blob);
showMsg(`已下載備份檔（${kb(blob.size)}）。`);
} catch (e) {
showErr(e);
} finally {
btn.disabled = false;
}
};
const doImport = async (btn) => {
if (gameRunning && confirm('遊戲正在執行，還原後遊戲可能會把舊資料寫回去。\n\n'
+ '建議先跳到同網站「不會啟動遊戲」的頁面，在那裡再按一次書籤、到「備份」分頁做還原。\n\n要現在跳過去嗎？')) {
location.href = location.origin + '/rogue.css';
return;
}
const file = await pickFile('.json,application/json');
if (!file) return;
btn.disabled = true;
try {
const data = JSON.parse(await file.text());
if (data?.format !== FORMAT) throw new Error('這不是這支書籤匯出的備份檔');
const lsCount = Object.keys(data.localStorage || {}).length;
const dbList = (data.indexedDB || []).map((d) => d.name).join('、') || '（無）';
if (!confirm(`要用這個備份覆蓋目前的資料嗎？\n\n備份時間：${new Date(data.at).toLocaleString()}\n`
+ `來源：${data.origin}\nlocalStorage：${lsCount} 筆\n資料庫：${dbList}\n\n`
+ '目前的 localStorage 會整個換成備份裡的內容，上面列的資料庫也會整個換掉。\n'
+ '建議先按「匯出備份」把現在的資料也存一份。')) return;
showMsg('還原中…');
localStorage.clear();
for (const [k, v] of Object.entries(data.localStorage || {})) localStorage.setItem(k, v);
for (const d of data.indexedDB || []) await restoreDb(d);
showMsg('還原完成。重新載入遊戲後生效。');
await refresh();
body.append(h('div', { className: 'row' },
h('button', { onclick: () => { location.href = location.origin + '/'; } }, '開啟遊戲')));
} catch (e) {
showErr(e);
} finally {
btn.disabled = false;
}
};
body.append(
info,
h('div', { className: 'row' },
h('button', { onclick: (e) => doExport(e.currentTarget) }, '匯出備份'),
h('button', { onclick: (e) => doImport(e.currentTarget) }, '匯入還原')),
msg,
h('div', { className: 'note' },
'備份檔包含這個網站在這個瀏覽器裡的全部資料：遊戲進度、設定等。',
h('br'), '遊戲自己的「Options → Saves」只匯出帳號存檔；這個連設定都一起備份。',
h('br'), '資料只存在你自己的電腦，不會上傳到任何地方。'));
if (!onGame()) {
body.prepend(h('div', { className: 'err' },
'注意：現在不在 wow.aethus.pl 上，備份到的會是「這個網站」的資料，不是遊戲的。'));
}
refresh();
}
const ROOT_ID = 'wowbm-root';
const FAB_POS = 'wowbm.fabPos';
const LAST_TAB = 'wowbm.tab';
const TABS = [
['launch', '開局', launchTab],
['perf', '效能', perfTab],
['backup', '備份', backupTab],
];
const FAB_SIZE = 46;
const GAP = 8;
const CSS = `
:host { all: initial; }
* { box-sizing: border-box; font: inherit; }
.fab { position: fixed; z-index: 2147483647; width: ${FAB_SIZE}px; height: ${FAB_SIZE}px; border-radius: 50%;
display: grid; place-items: center; cursor: grab; touch-action: none; user-select: none;
background: radial-gradient(circle at 35% 30%, #5a4a1c, #1d180c); color: #f0c94a;
border: 2px solid #c9a227; box-shadow: 0 3px 12px #000b; font: 22px/1 system-ui, sans-serif;
opacity: .82; transition: opacity .15s, transform .15s; }
.fab:hover, .fab.open { opacity: 1; }
.fab.drag { cursor: grabbing; transform: scale(1.08); }
.panel { position: fixed; z-index: 2147483646; width: min(460px, calc(100vw - ${GAP * 2}px));
max-height: calc(100vh - ${GAP * 2}px); display: flex; flex-direction: column;
background: #15130f; color: #ddd; border: 1px solid #c9a227; border-radius: 8px;
font: 14px/1.5 system-ui, "Microsoft JhengHei", sans-serif; box-shadow: 0 6px 30px #000c; }
.panel[hidden] { display: none; }
.head { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #221d12;
border-bottom: 1px solid #4a3d18; border-radius: 8px 8px 0 0; }
.head b { flex: 1; color: #f0c94a; }
.tabs { display: flex; gap: 2px; padding: 6px 8px 0; background: #1b170f; border-bottom: 1px solid #4a3d18; }
.tabs button { flex: 1; border: 1px solid #4a3d18; border-bottom: none; border-radius: 6px 6px 0 0;
background: #221d12; color: #b9a670; padding: 5px 4px; }
.tabs button.on { background: #3a3014; color: #f3e3b0; border-color: #c9a227; }
.body { padding: 10px 12px; display: grid; gap: 8px; overflow: auto; }
.grid { display: grid; gap: 8px; }
label, .field { display: grid; grid-template-columns: 7.5em 1fr; align-items: center; gap: 8px; }
label.inline { display: inline-flex; gap: 4px; }
select, input[type=text], input[type=number] { width: 100%; padding: 4px 6px;
background: #0c0b08; color: #eee; border: 1px solid #555; border-radius: 4px; }
.slider { display: flex; align-items: center; gap: 8px; }
.slider input[type=range] { flex: 1; min-width: 60px; accent-color: #c9a227; }
.pct { min-width: 3.2em; text-align: right; color: #f3e3b0; }
button { padding: 5px 10px; background: #3a3014; color: #f3e3b0; border: 1px solid #c9a227;
border-radius: 4px; cursor: pointer; }
button:hover { background: #4e4019; }
button:disabled, input:disabled { opacity: .45; cursor: default; }
.head button { background: none; border: none; color: #aaa; padding: 0 4px; }
.head button:hover { color: #fff; }
.x { font-size: 18px; }
.row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.note { color: #999; font-size: 12px; }
.msg { color: #9fd38a; white-space: pre-wrap; }
.msg:empty { display: none; }
.err { color: #ff8a80; white-space: pre-wrap; }
hr { border: none; border-top: 1px solid #333; margin: 2px 0; width: 100%; }
table { width: 100%; border-collapse: collapse; }
td, th { padding: 4px; border-bottom: 1px solid #333; text-align: left; vertical-align: top; }
code { background: #000; padding: 0 4px; border-radius: 3px; word-break: break-all; }
`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function toolbox() {
const old = document.getElementById(ROOT_ID);
if (old) { old.remove(); return; }
const host = h('div', { id: ROOT_ID });
const shadow = host.attachShadow({ mode: 'open' });
for (const ev of ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'wheel', 'contextmenu']) {
host.addEventListener(ev, (e) => e.stopPropagation());
}
const fab = h('div', { className: 'fab', title: 'WoW 工具箱（可拖曳）' }, '⚙');
const saved = load(FAB_POS, null);
let pos = { x: saved?.x ?? innerWidth - FAB_SIZE - 16, y: saved?.y ?? Math.round(innerHeight * 0.35) };
const setPos = (x, y) => {
pos = { x: clamp(x, 0, innerWidth - FAB_SIZE), y: clamp(y, 0, innerHeight - FAB_SIZE) };
fab.style.left = pos.x + 'px';
fab.style.top = pos.y + 'px';
if (!panel.hidden) place();
};
const body = h('div', { className: 'body' });
const tabBtns = {};
let current = load(LAST_TAB, 'launch');
const show = (id) => {
const tab = TABS.find((t) => t[0] === id) || TABS[0];
current = tab[0];
store(LAST_TAB, current);
for (const [k, b] of Object.entries(tabBtns)) b.className = k === current ? 'on' : '';
body.replaceChildren();
tab[2](body);
body.scrollTop = 0;
place();
};
const panel = h('div', { className: 'panel', hidden: true },
h('div', { className: 'head' },
h('b', {}, 'WoW 工具箱'),
h('button', { title: '把懸浮按鈕也收掉（再按一次書籤叫回來）', onclick: () => host.remove() }, '收起'),
h('button', { className: 'x', title: '關閉面板', onclick: () => toggle(false) }, '×')),
h('div', { className: 'tabs' }, TABS.map(([id, label]) => {
tabBtns[id] = h('button', { onclick: () => show(id) }, label);
return tabBtns[id];
})),
body);
function place() {
if (panel.hidden) return;
const W = innerWidth;
const H = innerHeight;
const pw = panel.offsetWidth;
const ph = panel.offsetHeight;
const r = fab.getBoundingClientRect();
let x = r.left + r.width / 2 < W / 2 ? r.right + GAP : r.left - GAP - pw;
let y = r.top;
if (x < GAP || x + pw > W - GAP) {
x = clamp(r.left + r.width / 2 - pw / 2, GAP, W - pw - GAP);
y = r.bottom + GAP + ph <= H - GAP ? r.bottom + GAP : r.top - GAP - ph;
}
panel.style.left = Math.round(x) + 'px';
panel.style.top = Math.round(clamp(y, GAP, H - ph - GAP)) + 'px';
}
function toggle(open = panel.hidden) {
panel.hidden = !open;
fab.classList.toggle('open', open);
if (open) show(current);
}
let drag = null;
fab.addEventListener('pointerdown', (e) => {
if (e.button !== 0) return;
fab.setPointerCapture(e.pointerId);
drag = { sx: e.clientX, sy: e.clientY, x: pos.x, y: pos.y, moved: false };
});
fab.addEventListener('pointermove', (e) => {
if (!drag) return;
const dx = e.clientX - drag.sx;
const dy = e.clientY - drag.sy;
if (!drag.moved && Math.hypot(dx, dy) < 5) return;
drag.moved = true;
fab.classList.add('drag');
setPos(drag.x + dx, drag.y + dy);
});
const endDrag = (e, cancelled) => {
if (!drag) return;
const moved = drag.moved;
if (moved && !cancelled) setPos(drag.x + e.clientX - drag.sx, drag.y + e.clientY - drag.sy);
drag = null;
fab.classList.remove('drag');
if (moved) store(FAB_POS, pos);
else if (!cancelled) toggle();
};
fab.addEventListener('pointerup', (e) => endDrag(e, false));
fab.addEventListener('pointercancel', (e) => endDrag(e, true));
host.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
const onResize = () => { if (host.isConnected) setPos(pos.x, pos.y); else removeEventListener('resize', onResize); };
addEventListener('resize', onResize);
shadow.append(h('style', {}, CSS), panel, fab);
(document.body || document.documentElement).append(host);
setPos(pos.x, pos.y);
}
toolbox();
})();
