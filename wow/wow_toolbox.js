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
function go(url) {
window.__wowbmNav = true;
location.href = url;
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
function draggable(el, key, dflt) {
let pos = load(key, null) || dflt();
const place = () => {
const w = el.offsetWidth || 160;
const ht = el.offsetHeight || 24;
pos = { x: Math.max(0, Math.min(innerWidth - w, pos.x)), y: Math.max(0, Math.min(innerHeight - ht, pos.y)) };
el.style.left = pos.x + 'px';
el.style.top = pos.y + 'px';
};
let d = null;
el.addEventListener('pointerdown', (e) => {
if (e.button !== 0) return;
el.setPointerCapture(e.pointerId);
d = { sx: e.clientX, sy: e.clientY, x: pos.x, y: pos.y };
e.preventDefault();
});
el.addEventListener('pointermove', (e) => {
if (!d) return;
pos = { x: d.x + e.clientX - d.sx, y: d.y + e.clientY - d.sy };
place();
});
const end = () => { if (d) { d = null; store(key, pos); } };
el.addEventListener('pointerup', end);
el.addEventListener('pointercancel', end);
el.title = '可以拖曳到別的位置';
place();
return place;
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
h('button', { onclick: () => go(buildUrl()) }, '開始（重新載入遊戲）'),
h('button', { onclick: copy }, '複製開局網址')),
msg,
h('div', { className: 'note' },
'會重新載入頁面，進行中的這一局會中斷，懸浮按鈕也要再按一次書籤叫出來。',
'選「隨機」每次開局都重抽（複製的網址則固定是抽到的那個）。效能分頁的設定會保留。'));
}
const SAVE_KEY = 'rogue.characters';
const SAVE_SECRET = [0x9c, 0x4e, 0x27, 0xd1, 0x6a, 0xf0, 0x13, 0xb8, 0x5d, 0xe2, 0x71, 0x0c, 0xa9, 0x36, 0xc4, 0x8f];
const TALENT_FULL_XP = 999999;
const CLASS_NAMES = { 1: '戰士', 2: '聖騎士', 3: '獵人', 4: '盜賊', 5: '牧師', 7: '薩滿', 8: '法師', 9: '術士', 11: '德魯伊' };
const utf8 = (s) => new TextEncoder().encode(s);
const concatBytes = (...parts) => {
const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
let i = 0;
for (const p of parts) { out.set(p, i); i += p.length; }
return out;
};
let saveHmacKey = null;
async function saveHmac(...parts) {
if (!crypto.subtle) throw new Error('這個網址不是安全連線（https 或本機），瀏覽器不提供加密功能');
saveHmacKey ||= await crypto.subtle.importKey('raw', concatBytes(utf8('azeroth-survivors/save/v1/'), new Uint8Array(SAVE_SECRET)),
{ name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
return new Uint8Array(await crypto.subtle.sign('HMAC', saveHmacKey, concatBytes(...parts)));
}
async function saveXor(nonce, data) {
const out = data.slice();
for (let i = 0; i < out.length; i += 20) {
const ctr = new Uint8Array(8);
new DataView(ctr.buffer).setUint32(0, i / 20, true);
const ks = await saveHmac(utf8('ks'), nonce, ctr);
for (let j = 0; j < 20 && i + j < out.length; j++) out[i + j] ^= ks[j];
}
return out;
}
async function saveDecode(sealed) {
if (!sealed?.startsWith('RSE1:')) throw new Error('存檔格式不認得（不是 RSE1）');
const blob = Uint8Array.from(atob(sealed.slice(5)), (c) => c.charCodeAt(0));
const nonce = blob.slice(0, 16);
const ct = blob.slice(16, -20);
const tag = blob.slice(-20);
const want = await saveHmac(utf8('tag'), nonce, ct);
if (want.some((x, i) => x !== tag[i])) throw new Error('存檔驗證失敗（遊戲改版換了金鑰？）');
return new TextDecoder().decode(await saveXor(nonce, ct));
}
async function saveEncode(text) {
const nonce = crypto.getRandomValues(new Uint8Array(16));
const ct = await saveXor(nonce, utf8(text));
const tag = await saveHmac(utf8('tag'), nonce, ct);
return 'RSE1:' + btoa(String.fromCharCode(...concatBytes(nonce, ct, tag)));
}
function parseTalents(plain) {
return plain.split('\n').map((line, row) => ({ line, row })).filter((x) => x.line.startsWith('talent|')).map(({ line, row }) => {
const [, cls, xp, alloc = ''] = line.split('|');
return { row, cls: Number(cls), xp: Number(xp), alloc };
});
}
function saveBackups() {
const prefix = `wowbm.backup.${SAVE_KEY}.`;
return Object.keys(localStorage).filter((k) => k.startsWith(prefix))
.map((k) => ({ key: k, at: Number(k.slice(prefix.length)) })).sort((a, b) => b.at - a.at);
}
function writeSealedSave(next) {
const old = localStorage.getItem(SAVE_KEY);
if (old) localStorage.setItem(`wowbm.backup.${SAVE_KEY}.${Date.now()}`, old);
saveBackups().slice(10).forEach((b) => localStorage.removeItem(b.key));
localStorage.setItem(SAVE_KEY, next);
}
function rawSaveSection() {
const box = h('div', { className: 'opt' });
box.append(h('b', {}, '原始存檔編輯器（進階）'));
if (document.getElementById('benilla')) {
box.append(h('div', { className: 'note' }, '遊戲執行中不能改存檔，請先用上面的「跳到可以改存檔的頁面」。'));
return box;
}
const area = h('textarea', { rows: 9, spellcheck: false, placeholder: '讀取中…' });
area.style.whiteSpace = 'pre';
const msg = msgLine();
const backupList = h('div', { className: 'row' });
let loaded = '';
const load = async () => {
try {
const sealed = localStorage.getItem(SAVE_KEY);
if (!sealed) { area.value = ''; area.placeholder = '找不到存檔：先在這個網址玩過一局。'; return; }
loaded = await saveDecode(sealed);
area.value = loaded;
msg.ok('');
} catch (e) {
msg.err(e);
}
renderBackups();
};
const save = async () => {
const text = area.value.replace(/\r\n/g, '\n');
if (text === loaded) { msg.ok('沒有改動。'); return; }
if (!text.trim()) { msg.err('內容是空的，沒有寫入'); return; }
if (!isModded() && !confirm('這會直接修改帳號存檔（永久的）。舊存檔會先自動備份。\n要繼續嗎？')) return;
try {
const next = await saveEncode(text.endsWith('\n') ? text : text + '\n');
if ((await saveDecode(next)).trimEnd() !== text.trimEnd()) throw new Error('重新封裝後驗證失敗，沒有寫入');
writeSealedSave(next);
markModded('存檔修改');
loaded = await saveDecode(next);
msg.ok('已寫入存檔（舊的已備份）。按「開啟遊戲」看結果；改壞了可以用下面的備份還原。');
renderBackups();
} catch (e) {
msg.err(e);
}
};
const restore = async (b) => {
if (!confirm(`要把存檔還原成 ${new Date(b.at).toLocaleString()} 的備份嗎？\n（現在的存檔也會先備份）`)) return;
const sealed = localStorage.getItem(b.key);
try {
await saveDecode(sealed); // 確認備份本身是好的
writeSealedSave(sealed);
await load(); // load() 會清掉訊息，所以訊息放在後面
msg.ok(`已還原成 ${new Date(b.at).toLocaleString()} 的備份。`);
} catch (e) {
msg.err(e);
}
};
function renderBackups() {
const list = saveBackups().slice(0, 5);
backupList.replaceChildren(...(list.length
? [h('span', { className: 'note' }, '還原備份：'), ...list.map((b) => h('button', { onclick: () => restore(b) },
new Date(b.at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })))]
: [h('span', { className: 'note' }, '還沒有備份（第一次儲存時會自動備份）。')]));
}
box.append(
h('div', { className: 'note' },
'這是解密後的帳號存檔，一行一筆、用 | 分隔。改完按「儲存」會重新加密寫回（寫入前自動備份）。',
'不確定的欄位不要亂改；改壞了遊戲可能會把存檔當成損壞、重新開始，這時用下面的備份還原。'),
area,
h('div', { className: 'row' },
h('button', { onclick: save }, '儲存'),
h('button', { onclick: load }, '重新讀取'),
h('button', { onclick: () => saveFile(`AzerothSurvivors 存檔明文 ${stamp()}.txt`, new Blob([area.value], { type: 'text/plain' })) }, '下載明文'),
h('button', { onclick: () => go(location.origin + '/') }, '開啟遊戲')),
msg,
backupList);
load();
return box;
}
function talentSection() {
const box = h('div', { className: 'opt' });
box.append(h('b', {}, '天賦點數（存檔修改）'));
const msg = msgLine();
if (document.getElementById('benilla')) {
box.append(
h('div', { className: 'note' },
'遊戲執行中不能改存檔（遊戲之後會把舊資料寫回去）。按下面的按鈕跳到不會啟動遊戲的頁面，',
'在那裡再按一次書籤、到「修改」分頁修改，改完按「開啟遊戲」。'),
h('div', { className: 'row' }, h('button', { onclick: () => go(location.origin + '/rogue.css') }, '跳到可以改存檔的頁面')));
return box;
}
const list = h('div', { className: 'stats' }, '讀取存檔中…');
box.append(
h('div', { className: 'note' },
'直接改帳號存檔裡的天賦經驗。每個職業最多 51 點，按「全滿」就是 51 點。',
'寫入前會自動備份舊存檔（存在這個網站的瀏覽器儲存裡）。只會列出玩過、有天賦紀錄的職業。'),
list, msg);
const render = async () => {
let plain;
try {
const sealed = localStorage.getItem(SAVE_KEY);
if (!sealed) { list.replaceChildren(h('div', { className: 'note' }, '找不到存檔：先在這個網址玩過一局再來。')); return; }
plain = await saveDecode(sealed);
} catch (e) {
list.replaceChildren(h('div', { className: 'err' }, '讀不到存檔：' + (e?.message || e)));
return;
}
const rows = parseTalents(plain);
if (!rows.length) { list.replaceChildren(h('div', { className: 'note' }, '存檔裡還沒有天賦紀錄：先完整打完一局。')); return; }
const write = async (cls, xp) => {
if (!isModded() && !confirm('這會直接修改帳號存檔（永久的）。改完這一局標記為「已修改」，不會上傳任何資料。\n要繼續嗎？')) return;
try {
const sealed = localStorage.getItem(SAVE_KEY);
const cur = await saveDecode(sealed);
const lines = cur.split('\n');
const i = lines.findIndex((l) => l.startsWith(`talent|${cls}|`));
if (i < 0) throw new Error('存檔裡找不到這個職業的天賦紀錄');
const parts = lines[i].split('|');
parts[2] = String(Math.max(0, Math.floor(xp)));
lines[i] = parts.join('|');
const next = await saveEncode(lines.join('\n'));
if ((await saveDecode(next)) !== lines.join('\n')) throw new Error('重新封裝後驗證失敗，沒有寫入');
writeSealedSave(next);
markModded('天賦點數修改');
msg.ok(`已寫入：${CLASS_NAMES[cls] || '職業 ' + cls} 天賦經驗 = ${parts[2]}。按「開啟遊戲」進遊戲看天賦畫面。`);
await render();
} catch (e) {
msg.err(e);
}
};
list.replaceChildren(...rows.map((r) => {
const input = h('input', { type: 'number', min: 0, step: 1, value: r.xp });
return h('div', { className: 'stat-row' },
h('span', { className: 'stat-name' }, CLASS_NAMES[r.cls] || `職業 ${r.cls}`,
h('small', {}, `天賦經驗 ${r.xp}` + (r.alloc ? `・已配置 ${r.alloc.split(',').filter(Boolean).length} 項` : ''))),
h('button', { onclick: () => write(r.cls, TALENT_FULL_XP) }, '全滿'),
input,
h('button', { onclick: () => write(r.cls, Number(input.value)) }, '套用'));
}), h('div', { className: 'row' }, h('button', { onclick: () => go(location.origin + '/') }, '開啟遊戲')));
};
render();
return box;
}
function isModded() { return !!window.__wowbmModded; }
function markModded(reason) {
if (!window.__wowbmModded) window.__wowbmModded = { reasons: [], at: Date.now(), blocked: 0 };
const m = window.__wowbmModded;
if (!m.reasons.includes(reason)) m.reasons.push(reason);
installGuard();
}
function uploadAllowed(url, method) {
if (!isModded()) return true;
let u;
try { u = new URL(String(url), location.href); } catch { return false; }
const m = String(method || 'GET').toUpperCase();
return u.origin === location.origin && (m === 'GET' || m === 'HEAD');
}
function blocked(what) {
window.__wowbmModded.blocked++;
console.warn('WoW 工具箱：這一頁用過修改功能，已擋下上傳 →', what);
}
function installGuard() {
if (window.__wowbmGuard) return;
window.__wowbmGuard = true;
const origFetch = window.fetch;
window.fetch = function (input, init) {
const url = typeof input === 'string' || input instanceof URL ? input : input?.url;
const method = init?.method || (typeof input === 'object' && input?.method) || 'GET';
if (!uploadAllowed(url, method)) {
blocked(`fetch ${method} ${url}`);
return Promise.reject(new TypeError('WoW 工具箱：已使用修改功能，這一局不上傳'));
}
return origFetch.apply(this, arguments);
};
const xOpen = XMLHttpRequest.prototype.open;
const xSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function (method, url) {
this.__wowbm = { method, url };
return xOpen.apply(this, arguments);
};
XMLHttpRequest.prototype.send = function () {
const r = this.__wowbm || {};
if (!uploadAllowed(r.url, r.method)) {
blocked(`xhr ${r.method} ${r.url}`);
throw new DOMException('WoW 工具箱：已使用修改功能，這一局不上傳', 'NetworkError');
}
return xSend.apply(this, arguments);
};
if (navigator.sendBeacon) {
const beacon = navigator.sendBeacon.bind(navigator);
navigator.sendBeacon = (url, data) => {
if (isModded()) { blocked(`beacon ${url}`); return false; }
return beacon(url, data);
};
}
const WS = window.WebSocket;
const Guarded = function (url, protocols) {
if (isModded()) {
blocked(`websocket ${url}`);
throw new DOMException('WoW 工具箱：已使用修改功能，這一局不上傳', 'SecurityError');
}
return protocols === undefined ? new WS(url) : new WS(url, protocols);
};
Guarded.prototype = WS.prototype;
for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) Guarded[k] = WS[k];
window.WebSocket = Guarded;
}
function timeWarp() {
if (window.__wowbmTime) return window.__wowbmTime;
const real = performance.now.bind(performance);
const T = { k: 1, base: real(), virt: real(), real };
performance.now = function () { return T.virt + (T.real() - T.base) * T.k; };
window.__wowbmTime = T;
return T;
}
function setSpeed(k) {
const T = timeWarp();
const r = T.real();
T.virt += (r - T.base) * T.k; // 從現在這一刻接續，時間不會跳
T.base = r;
T.k = k;
if (k !== 1) markModded(`遊戲速度 ${k} 倍`);
}
const getSpeed = () => window.__wowbmTime?.k ?? 1;
const STAT_FIELDS = [
['hp', '最大血量', '例：224'],
['dmg', '傷害倍率', '1 = 100%'],
['cd', '冷卻倍率', '越低越快，0.5 = 冷卻減半'],
['crit', '暴擊率', '0.05 = 5%'],
['cm', '暴擊傷害倍率', '2 = 200%'],
['spd', '移動速度倍率', '1 = 100%'],
['pick', '拾取範圍', '碼'],
['xp', '經驗倍率', '1 = 100%'],
['arm', '減傷', '0.08 = 8%，不要超過 0.9'],
['reg', '每秒回血', ''],
['area', '範圍倍率', '1 = 100%'],
['luck', '幸運', '越高卡片越稀有，1000 = 全部傳說'],
['gold', '金幣倍率', '1 = 100%'],
];
const STAT_INDEX = Object.fromEntries(STAT_FIELDS.map(([k], i) => [k, i]));
const LUCK_MAX = 1000;
function statState() {
if (!window.__wowbmStats) window.__wowbmStats = { base: null, frozen: {}, error: '' };
return window.__wowbmStats;
}
const memF32 = () => (window.__wowbmMem ? new Float32Array(window.__wowbmMem.buffer) : null);
function statsPlausible(f, base) {
const v = (k) => f[base + STAT_INDEX[k]];
return v('hp') > 0 && v('hp') < 1e7 && v('crit') >= 0 && v('crit') <= 10 && v('cm') > 0 && v('cm') < 100 &&
v('pick') > 0 && v('pick') < 1e4 && v('spd') > 0 && v('spd') < 100;
}
async function findStats() {
const st = statState();
st.base = null;
if (!window.__wowbmMem) throw new Error('需要用即時模式啟動遊戲（戰況分頁）');
const hub = window.__wowbmBridge;
const r = await hub.lua('return ' + STAT_FIELDS.map(([k]) => `AZS_STATS.${k}`).join(', '));
if (!r.ok) throw new Error('讀不到目前屬性（' + (r.error || '遊戲還在載入') + '）');
const want = (r.values || []).map(Number);
if (want.length !== STAT_FIELDS.length || !want.every(Number.isFinite) || !(want[STAT_INDEX.hp] > 0) || !(want[STAT_INDEX.pick] > 0)) {
throw new Error('遊戲還沒給出角色屬性，等這一局開始後再按一次');
}
const tol = (v) => Math.max(0.002, Math.abs(v) * 0.003); // 介面上的數字有四捨五入
const close = (x, v) => Math.abs(x - v) <= tol(v);
const f = memF32();
const L = STAT_INDEX.luck;
const hits = [];
for (let i = L; i < f.length - STAT_FIELDS.length; i++) {
if (!close(f[i], want[L])) continue;
const base = i - L;
let ok = true;
for (let k = 0; k < want.length; k++) {
if (!close(f[base + k], want[k])) { ok = false; break; }
}
if (ok) hits.push(base);
if (hits.length > 5) break;
}
if (hits.length !== 1) throw new Error(hits.length ? '找到好幾個可能的位置，無法確定（升級或選卡後再按一次）' : '在記憶體裡找不到屬性表（升級或選卡後再按一次）');
st.base = hits[0];
st.error = '';
return st.base;
}
function readStats() {
const st = statState();
const f = memF32();
if (!f || st.base === null) return null;
if (!statsPlausible(f, st.base)) { st.base = null; st.error = '位置失效了，請按「重新尋找」'; return null; }
return Object.fromEntries(STAT_FIELDS.map(([k], i) => [k, f[st.base + i]]));
}
function freezeTick() {
const st = statState();
const keys = Object.keys(st.frozen);
if (!keys.length || st.base === null) return;
const f = memF32();
if (!f || !statsPlausible(f, st.base)) { st.base = null; st.error = '位置失效了，請按「重新尋找」'; return; }
for (const k of keys) {
const i = st.base + STAT_INDEX[k];
if (f[i] !== st.frozen[k]) f[i] = st.frozen[k];
}
}
function setFrozen(key, value) {
const st = statState();
if (value === null || !Number.isFinite(value)) delete st.frozen[key];
else {
st.frozen[key] = Math.fround(value);
markModded('角色屬性修改');
}
freezeTick();
}
const mods = { timer: 0 };
function modsStart() {
mods.timer = setInterval(freezeTick, 100);
}
function modsStop() {
clearInterval(mods.timer);
if (getSpeed() !== 1) setSpeed(1);
}
function statsSection() {
const box = h('div', { className: 'opt' });
const st = statState();
if (!window.__wowbmMem) {
box.append(
h('b', {}, '角色屬性修改'),
h('div', { className: 'note' },
'需要用「即時模式」啟動遊戲：到「戰況」分頁按「重新啟動並啟用即時資料」（要按兩次書籤）。',
'可以改傷害、冷卻、暴擊、移動速度、幸運等所有角色屬性，也能讓升級卡片一律是最高稀有度。'));
return box;
}
const status = h('div', { className: 'note' });
const best = h('input', { type: 'checkbox', checked: st.frozen.luck === LUCK_MAX });
const rows = h('div', { className: 'stats' });
const inputs = {};
const confirmMod = () => isModded() || confirm('使用修改功能後，這一局會標記為「已修改」，不會上傳任何資料（例如排行榜）。\n要繼續嗎？');
const render = () => {
rows.replaceChildren(...STAT_FIELDS.map(([k, name, hint]) => {
const cur = h('span', { className: 'cur' });
const input = h('input', { type: 'number', step: 'any', placeholder: '數值' });
const lock = h('input', { type: 'checkbox', checked: k in st.frozen, title: '鎖定這個數值' });
if (k in st.frozen) input.value = +st.frozen[k].toFixed(4);
const apply = () => {
if (!lock.checked) { setFrozen(k, null); if (k === 'luck') best.checked = false; return; }
if (!confirmMod()) { lock.checked = false; return; }
const v = input.value === '' ? Number(cur.dataset.v) : Number(input.value);
if (!Number.isFinite(v)) { lock.checked = false; return; }
input.value = +v.toFixed(4);
setFrozen(k, v);
if (k === 'luck') best.checked = v === LUCK_MAX;
};
lock.addEventListener('change', apply);
input.addEventListener('change', () => { if (input.value !== '' && !lock.checked) lock.checked = true; apply(); });
inputs[k] = { cur, input, lock };
return h('div', { className: 'stat-row' },
h('span', { className: 'stat-name', title: hint }, name, hint ? h('small', {}, hint) : null),
cur, input, h('label', { className: 'inline' }, lock, '鎖定'));
}));
};
const refresh = () => {
const s = readStats();
status.className = s ? 'note' : 'err';
status.textContent = s ? `已找到角色屬性。鎖定 ${Object.keys(st.frozen).length} 項。`
: (st.error || '還沒找到角色屬性，請按「尋找角色屬性」（要在這一局開始之後）。');
for (const [k] of STAT_FIELDS) {
const c = inputs[k]?.cur;
if (!c) continue;
c.dataset.v = s ? s[k] : '';
c.textContent = s ? (+s[k].toFixed(3)).toString() : '—';
}
};
const timer = setInterval(() => { if (!box.isConnected) clearInterval(timer); else refresh(); }, 500);
const find = async (btn) => {
btn.disabled = true;
status.className = 'note';
status.textContent = '尋找中…（約 1 秒）';
try { await findStats(); } catch (e) { st.error = '尋找失敗：' + (e?.message || e); }
btn.disabled = false;
refresh();
};
best.addEventListener('change', () => {
if (best.checked && !confirmMod()) { best.checked = false; return; }
if (best.checked && st.base === null) { best.checked = false; status.className = 'err'; status.textContent = '請先按「尋找角色屬性」。'; return; }
setFrozen('luck', best.checked ? LUCK_MAX : null);
render();
refresh();
});
box.append(
h('b', {}, '角色屬性修改'),
h('div', { className: 'note' }, '天賦、裝備、升級強化的效果最後都加在這些屬性上，直接改就等於改天賦。勾「鎖定」才會生效，取消勾選就恢復遊戲的計算。'),
h('div', { className: 'row' },
h('button', { onclick: (e) => find(e.currentTarget) }, st.base === null ? '尋找角色屬性' : '重新尋找'),
h('button', { onclick: () => { st.frozen = {}; best.checked = false; render(); refresh(); } }, '全部解除鎖定')),
status,
h('label', { className: 'inline best' }, best, h('b', {}, '升級卡片一律最高稀有度'),
h('small', {}, '（把幸運鎖在 1000。已經抽好的卡不會變：這一局第一次升級的卡在開局時就抽好了，按「重抽」就會換成傳說）')),
rows);
render();
refresh();
if (st.base === null && bridgeLive()) find(box.querySelector('button'));
return box;
}
function modsTab(body) {
const status = h('div', {});
const showStatus = () => {
if (!status.isConnected) return clearInterval(timer);
const m = window.__wowbmModded;
status.className = m ? 'err' : 'msg';
status.textContent = m
? `⚠ 這一頁已使用修改功能（${m.reasons.join('、')}）。\n這一局不會上傳任何資料` + (m.blocked ? `，已擋下 ${m.blocked} 次上傳。` : '。') +
'\n重新載入頁面（新的一局）才會恢復。'
: '✓ 目前沒有使用修改功能，遊戲照常運作。';
};
const timer = setInterval(showStatus, 1000);
const range = h('input', { type: 'range', min: 25, max: 300, step: 25, value: Math.round(getSpeed() * 100) });
const label = h('span', { className: 'pct' });
const show = () => { label.textContent = (range.value / 100) + '×'; };
const apply = (pct) => {
range.value = pct;
show();
if (Number(pct) !== 100 && !isModded() && !confirm('使用修改功能後，這一局會標記為「已修改」，不會上傳任何資料（例如排行榜）。\n要繼續嗎？')) {
range.value = Math.round(getSpeed() * 100);
show();
return;
}
setSpeed(pct / 100);
showStatus();
};
range.addEventListener('input', show);
range.addEventListener('change', () => apply(range.value));
show();
body.append(
status,
talentSection(),
rawSaveSection(),
statsSection(),
h('div', { className: 'opt' },
h('div', { className: 'field' }, h('b', {}, '遊戲速度'), h('span', { className: 'slider' }, range, label)),
h('div', { className: 'row' },
h('button', { onclick: () => apply(50) }, '0.5× 慢動作'),
h('button', { onclick: () => apply(100) }, '1× 正常'),
h('button', { onclick: () => apply(200) }, '2× 加速')),
h('div', { className: 'note' },
'立刻生效，不用重新載入。慢動作比較好躲、加速可以快點打完；升級選卡時遊戲本來就會暫停。',
'按「收起」或重新載入會回到正常速度。')),
h('div', { className: 'note-box' },
h('b', {}, '關於排行榜：'),
'用過「角色屬性修改」「遊戲速度」「自動走位」「Lua 主控台」其中任何一個，這一頁就標記為已修改，',
'之後所有對外上傳（連到其他網站、送出資料、WebSocket）都會被擋下，讀取遊戲檔案不受影響。',
h('br'),
'目前網頁版沒有發現線上排行榜（實測整局沒有任何上傳），這是預防：作者之後加了排行榜，修改過的那一局也傳不上去。'));
showStatus();
}
const BOOT_KEY = 'wowbm.boot';
const LIVE_SAVE = 'wowbm.live';
const PHASES = { ready: '準備中（移動就開始）', playing: '進行中', choosing: '升級選卡中（暫停）', paused: '暫停',
over: '結束', won: '勝利', lost: '失敗' };
function bridgeHub() {
if (window.__wowbmBridge) return window.__wowbmBridge;
const hub = { frame: null, lastAt: 0, subs: new Set(), pending: new Map(), seq: 0 };
hub.obj = {
hz: 4, radius: 40, maxUnits: 40, events: true, queue: [],
onFrame(f) {
hub.frame = f;
hub.lastAt = performance.now();
hub.subs.forEach((s) => s.frame?.(f));
},
onEvent(name, data) {
if (name === 'lua' && data && hub.pending.has(data.id)) {
hub.pending.get(data.id)(data);
hub.pending.delete(data.id);
}
hub.subs.forEach((s) => s.event?.(name, data));
},
};
hub.send = (cmd) => hub.obj.queue.push(cmd);
hub.lua = (chunk, timeout = 3000) => new Promise((resolve) => {
const id = ++hub.seq;
hub.pending.set(id, resolve);
hub.send({ op: 'lua', id, chunk });
setTimeout(() => { if (hub.pending.delete(id)) resolve({ id, ok: false, error: '逾時（遊戲沒有回應）' }); }, timeout);
});
window.__wowbmBridge = hub;
return hub;
}
const bridgeReady = () => !!window.__wowbmBridge && window.__wenilla_bridge === window.__wowbmBridge.obj;
const bridgeLive = () => bridgeReady() && performance.now() - window.__wowbmBridge.lastAt < 3000;
function requestBridgeBoot() {
try { sessionStorage.setItem(BOOT_KEY, currentParams().toString()); } catch {}
go(location.origin + '/rogue.css');
}
function pendingBoot() {
try { return sessionStorage.getItem(BOOT_KEY); } catch { return null; }
}
async function bootWithBridge(qs) {
try { sessionStorage.removeItem(BOOT_KEY); } catch {}
const hub = bridgeHub();
const instantiate = WebAssembly.instantiate;
WebAssembly.instantiate = async function (...args) {
const r = await instantiate.apply(this, args);
const inst = r instanceof WebAssembly.Instance ? r : r?.instance;
if (inst?.exports?.memory instanceof WebAssembly.Memory && !window.__wowbmMem) window.__wowbmMem = inst.exports.memory;
return r;
};
let env;
Object.defineProperty(window, '__wenilla_env', {
configurable: true,
get: () => env,
set: (v) => { env = Object.assign({}, v, { bridge: '1' }); },
});
const html = await (await fetch('/', { cache: 'no-store' })).text();
history.replaceState(null, '', '/' + (qs ? '?' + qs : ''));
document.open();
document.write(html);
document.close();
window.__wenilla_bridge = hub.obj;
}
const live = {
opts: Object.assign({ hud: true, lowHp: true, lowPct: 30, boss: true, bossSec: 10, auto: 'off' }, load(LIVE_SAVE, {})),
layer: null,
els: {},
timers: [],
info: null,        // Lua 每秒查一次的資料
holding: false,
track: [],         // 自動走位：最近幾次的位置（判斷卡住）
alerted: new Set(),
lastRunTime: 0,
};
const fmtTime = (s) => {
s = Math.max(0, Math.floor(s || 0));
return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const INFO_LUA = `
local up = AZS_GetUpcomingBosses and AZS_GetUpcomingBosses() or {}
local nb, nl, nf = "", -1, false
for i = 1, table.getn(up) do
local b = up[i]
if b.left and b.left > 0 and (nl < 0 or b.left < nl) then nb, nl, nf = b.name, b.left, b.final end
end
local active = AZS_GetBosses and AZS_GetBosses() or {}
return AZS_GetPhase and AZS_GetPhase() or "", AZS_GetRunTime and AZS_GetRunTime() or 0,
AZS_GetRunLength and AZS_GetRunLength() or 0, nb, nl, nf and 1 or 0,
UnitXP("player"), UnitXPMax("player"), GetMoney(), table.getn(active)`;
async function livePoll() {
if (!bridgeLive()) { live.info = null; return; }
const r = await window.__wowbmBridge.lua(INFO_LUA, 2000);
if (!r.ok) return;
const [phase, runTime, runLength, boss, bossLeft, bossFinal, xp, xpMax, money, activeBosses] = r.values;
live.info = { phase, runTime, runLength, boss, bossLeft, bossFinal: !!bossFinal, xp, xpMax, money, activeBosses };
if (runTime < live.lastRunTime) live.alerted.clear();
live.lastRunTime = runTime;
if (live.opts.boss && boss && bossLeft > 0 && bossLeft <= live.opts.bossSec && !live.alerted.has(boss + '@' + Math.round(runTime + bossLeft))) {
live.alerted.add(boss + '@' + Math.round(runTime + bossLeft));
showBanner(`${bossFinal ? '最終首領' : '首領'}「${boss}」${Math.ceil(bossLeft)} 秒後出現！`);
}
}
function showBanner(text) {
const el = live.els.banner;
if (!el) return;
el.textContent = text;
el.classList.add('show');
clearTimeout(el._t);
el._t = setTimeout(() => el.classList.remove('show'), 4000);
}
function liveTick() {
const hub = window.__wowbmBridge;
const f = bridgeLive() ? hub.frame : null;
const self = f?.self;
const { hud, warn } = live.els;
const pct = self && self.maxHealth ? self.health / self.maxHealth * 100 : 100;
warn.classList.toggle('show', !!(live.opts.lowHp && self && !self.dead && pct < live.opts.lowPct));
const wasHidden = hud.hidden;
hud.hidden = !live.opts.hud || !f;
if (!hud.hidden) {
if (wasHidden) requestAnimationFrame(() => live.placeHud?.()); // 剛顯示：照實際大小再擺一次，避免超出畫面
const enemies = (f.units || []).filter((u) => u.hostile && !u.dead && u.kind === 'unit');
const near10 = enemies.filter((u) => u.dist <= 10).length;
const near30 = enemies.filter((u) => u.dist <= 30).length;
const nearest = enemies.reduce((m, u) => Math.min(m, u.dist), Infinity);
const i = live.info;
const lines = [];
if (i) {
lines.push(`⏱ ${fmtTime(i.runTime)} / ${fmtTime(i.runLength)}　${PHASES[i.phase] || i.phase}`);
if (i.activeBosses > 0) lines.push(`⚔ 首領戰中（${i.activeBosses}）`);
if (i.boss) lines.push(`下一隻${i.bossFinal ? '（最終）' : ''}：${i.boss}，${fmtTime(i.bossLeft)} 後`);
}
if (self) {
lines.push(`❤ ${self.health}/${self.maxHealth}（${Math.round(pct)}%）　Lv ${self.level}` +
(i ? `　經驗 ${i.xp}/${i.xpMax}　金幣 ${Math.floor(i.money / 10000)}` : ''));
}
lines.push(`敵人：10碼內 ${near10}・30碼內 ${near30}` + (Number.isFinite(nearest) ? `・最近 ${nearest.toFixed(1)} 碼` : ''));
if (live.opts.auto !== 'off') lines.push(`🤖 自動走位：${live.opts.auto === 'evade' ? '躲避敵人' : '繞圈'}`);
if (getSpeed() !== 1) lines.push(`⏩ 遊戲速度 ${getSpeed()}×`);
if (isModded()) lines.push('⚠ 已修改：這一局不上傳');
hud.textContent = lines.join('\n');
}
autoMove(hub, f);
}
function autoMove(hub, f) {
const self = f?.self;
const phase = live.info?.phase;
const want = live.opts.auto !== 'off' && self && !self.dead && (!phase || phase === 'ready' || phase === 'playing');
if (!want) {
if (live.holding) { hub?.send({ op: 'release' }); live.holding = false; }
live.track = [];
return;
}
if (!live.holding) {
markModded('自動走位');
hub.send({ op: 'hold', cmd: 'MOVEFORWARD' });
live.holding = true;
}
let dyaw;
if (live.opts.auto === 'circle') {
dyaw = 0.3;
} else {
let vx = 0;
let vy = 0;
for (const u of f.units || []) {
if (!u.hostile || u.dead || u.kind !== 'unit' || u.dist > 30) continue;
const dx = self.pos[0] - u.pos[0];
const dy = self.pos[1] - u.pos[1];
const d = Math.max(Math.hypot(dx, dy), 0.5);
vx += dx / (d * d);
vy += dy / (d * d);
}
dyaw = vx || vy ? wrapAngle(Math.atan2(vy, vx) - self.facing) : 0.15; // 沒有敵人就慢慢繞
dyaw = Math.max(-0.8, Math.min(0.8, dyaw));
}
live.track.push(self.pos);
if (live.track.length > 6) live.track.shift();
if (live.track.length === 6) {
const [a] = live.track;
if (Math.hypot(self.pos[0] - a[0], self.pos[1] - a[1]) < 1) { dyaw = Math.PI / 2; live.track = []; }
}
if (Math.abs(dyaw) > 0.01) hub.send({ op: 'look', dyaw });
}
function liveApply() {
store(LIVE_SAVE, live.opts);
}
function liveStart(layer) {
live.layer = layer;
live.els.hud = h('div', { className: 'hud', hidden: true });
live.els.warn = h('div', { className: 'lowhp' });
live.els.banner = h('div', { className: 'banner' });
layer.append(live.els.warn, live.els.hud, live.els.banner);
live.placeHud = draggable(live.els.hud, 'wowbm.hudPos', () => ({ x: 6, y: 110 }));
live.timers.push(setInterval(liveTick, 250), setInterval(livePoll, 1000));
}
function liveStop() {
live.timers.forEach(clearInterval);
live.timers = [];
if (live.holding) { window.__wowbmBridge?.send({ op: 'release' }); live.holding = false; }
Object.values(live.els).forEach((el) => el.remove());
live.els = {};
}
function liveTab(body) {
if (!bridgeReady()) {
body.append(
h('div', { className: 'err' }, '即時資料沒有啟用。'),
h('div', { className: 'note' },
'戰況面板、低血量警示、首領預告、自動走位，都要用遊戲內建的 WebBridge 讀資料。',
'WebBridge 只能在遊戲啟動時打開，所以要：'),
h('ol', { className: 'note' },
h('li', {}, '按下面的按鈕，頁面會跳到一個空白頁（目前這一局會中斷）。'),
h('li', {}, '在空白頁上再按一次書籤，遊戲會自動以即時模式重新載入（開局、效能設定照舊）。')),
h('div', { className: 'row' },
h('button', { onclick: requestBridgeBoot }, '重新啟動並啟用即時資料')));
return;
}
const hub = window.__wowbmBridge;
const opt = (key, title, desc, extra) => {
const box = h('input', { type: 'checkbox', checked: !!live.opts[key] });
box.addEventListener('change', () => { live.opts[key] = box.checked; liveApply(); });
return h('div', { className: 'opt' },
h('label', { className: 'inline' }, box, h('b', {}, title)),
h('div', { className: 'note' }, desc), extra || null);
};
const num = (key, min, max, step, suffix) => {
const range = h('input', { type: 'range', min, max, step, value: live.opts[key] });
const label = h('span', { className: 'pct' }, live.opts[key] + suffix);
range.addEventListener('input', () => {
live.opts[key] = Number(range.value);
label.textContent = range.value + suffix;
liveApply();
});
return h('span', { className: 'slider' }, range, label);
};
const auto = select([['off', '關'], ['evade', '躲避敵人'], ['circle', '繞圈']], live.opts.auto);
const confirmMod = () => isModded() || confirm('使用修改功能後，這一局會標記為「已修改」，不會上傳任何資料（例如排行榜）。\n要繼續嗎？');
auto.addEventListener('change', () => {
if (auto.value !== 'off' && !confirmMod()) { auto.value = live.opts.auto; return; }
live.opts.auto = auto.value;
liveApply();
});
const code = h('textarea', { rows: 3, placeholder: 'return UnitHealth("player"), GetMoney(), AZS_GetRunTime()' });
const out = h('pre', { className: 'out' });
const run = async () => {
const chunk = code.value.trim();
if (!chunk || !confirmMod()) return;
markModded('Lua 主控台');
out.textContent = '執行中…';
const r = await hub.lua(chunk);
out.textContent = r.ok ? (r.values.length ? r.values.map((v) => JSON.stringify(v)).join('\n') : '（完成，沒有回傳值）')
: '錯誤：' + (r.error || r.message || JSON.stringify(r));
};
code.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });
const status = h('div', { className: 'msg' });
const showStatus = () => {
if (!status.isConnected) return clearInterval(statusTimer);
const ok = bridgeLive();
status.className = ok ? 'msg' : 'note';
status.textContent = ok ? '即時資料：連線中' : '即時資料：已啟用，等待遊戲回報（載入中，或分頁在背景）…';
};
const statusTimer = setInterval(showStatus, 1000);
body.append(
status,
opt('hud', '戰況面板', '畫面左上角顯示時間、下一隻首領倒數、血量、經驗、金幣、附近敵人數。'),
opt('lowHp', '低血量警示', '血量低於設定值時，畫面四周閃紅光。', h('div', { className: 'field' }, '門檻', num('lowPct', 10, 80, 5, '%'))),
opt('boss', '首領預告', '首領出現前在畫面上方提醒。', h('div', { className: 'field' }, '提前', num('bossSec', 5, 60, 5, ' 秒'))),
h('div', { className: 'opt' },
h('div', { className: 'field' }, h('b', {}, '自動走位'), auto),
h('div', { className: 'note' },
'躲避敵人：自動往敵人少的方向跑；繞圈：一直繞大圈。卡住會自動轉向。',
'開著時角色會一直往前走，要自己操作就切回「關」。準備階段開啟會直接開始這一局。',
'屬於修改功能：用了這一局就不會上傳（見「修改」分頁）。')),
h('details', {},
h('summary', {}, '進階：Lua 主控台'),
h('div', { className: 'note' }, '直接對遊戲介面執行 Lua（魔獸世界 1.12 的介面函式，加上 AZS_ 開頭的倖存者函式）。Ctrl+Enter 執行。屬於修改功能：執行後這一局不會上傳。'),
code,
h('div', { className: 'row' }, h('button', { onclick: run }, '執行')),
out));
showStatus();
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
go(gameUrl(p));
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
const UTIL_SAVE = 'wowbm.util';
const util = {
opts: load(UTIL_SAVE, { noLeave: false, wake: false, fps: false }),
layer: null,     // main.js 給的 Shadow DOM，FPS 小框放這裡
wake: null,      // WakeLockSentinel
wakeMsg: '',
fpsEl: null,
raf: 0,
listeners: [],
};
function utilListen(target, ev, fn) {
target.addEventListener(ev, fn);
util.listeners.push([target, ev, fn]);
}
function onBeforeUnload(e) {
if (!util.opts.noLeave || window.__wowbmNav) return;
e.preventDefault();
e.returnValue = '';
}
async function wakeOn() {
if (util.wake || !util.opts.wake) return;
if (!navigator.wakeLock) { util.wakeMsg = '這個瀏覽器不支援防休眠。'; return; }
if (document.visibilityState !== 'visible') return;
try {
const lock = await navigator.wakeLock.request('screen');
util.wake = lock;
util.wakeMsg = '已啟用：螢幕不會自動休眠。';
lock.addEventListener('release', () => { if (util.wake === lock) util.wake = null; });
} catch (e) {
util.wakeMsg = '瀏覽器拒絕了：' + (e?.message || e);
}
}
function wakeOff() {
util.wake?.release().catch(() => {});
util.wake = null;
util.wakeMsg = '';
}
function fpsOn() {
if (util.fpsEl || !util.layer) return;
util.fpsEl = h('div', { className: 'fps' }, 'FPS …');
util.layer.append(util.fpsEl);
draggable(util.fpsEl, 'wowbm.fpsPos', () => ({ x: innerWidth - 190, y: 150 }));
let frames = 0;
let worst = 0;
let last = performance.now();
let start = last;
const tick = (now) => {
frames++;
worst = Math.max(worst, now - last);
last = now;
if (now - start >= 1000) {
const fps = Math.round(frames * 1000 / (now - start));
util.fpsEl.textContent = `FPS ${fps} · 最慢 ${Math.round(worst)}ms`;
util.fpsEl.className = 'fps' + (fps < 30 ? ' bad' : fps < 50 ? ' meh' : '');
frames = 0;
worst = 0;
start = now;
}
util.raf = requestAnimationFrame(tick);
};
util.raf = requestAnimationFrame(tick);
}
function fpsOff() {
cancelAnimationFrame(util.raf);
util.fpsEl?.remove();
util.fpsEl = null;
}
function utilApply() {
store(UTIL_SAVE, util.opts);
if (util.opts.wake) wakeOn(); else wakeOff();
if (util.opts.fps) fpsOn(); else fpsOff();
}
function utilStart(layer) {
util.layer = layer;
utilListen(window, 'beforeunload', onBeforeUnload);
utilListen(document, 'visibilitychange', () => { if (document.visibilityState === 'visible') wakeOn(); });
utilApply();
}
function utilStop() {
for (const [t, ev, fn] of util.listeners) t.removeEventListener(ev, fn);
util.listeners = [];
wakeOff();
fpsOff();
}
function utilTab(body) {
const status = h('div', { className: 'note' });
const refresh = () => {
status.textContent = util.opts.wake ? util.wakeMsg || '啟用中…' : '';
};
const toggle = (key, title, desc) => {
const box = h('input', { type: 'checkbox', checked: !!util.opts[key] });
box.addEventListener('change', async () => {
util.opts[key] = box.checked;
utilApply();
await sleep(300);
refresh();
});
return h('div', { className: 'opt' },
h('label', { className: 'inline' }, box, h('b', {}, title)),
h('div', { className: 'note' }, desc));
};
body.append(
toggle('noLeave', '防誤關',
'要關分頁、重新整理或離開網頁時，先跳出確認視窗。用工具箱開局、套用效能設定不會跳。'),
toggle('wake', '防休眠',
'玩的時候螢幕不會自動變暗、休眠。切到別的分頁會暫停，切回來自動恢復。'),
status,
toggle('fps', 'FPS 顯示',
'畫面左上角顯示每秒幅數，以及最近一秒最慢的一幀（數字突然變大 = 卡頓）。'),
h('div', { className: 'note' },
'開關會記住，下次叫出工具箱自動套用。按「收起」或再按一次書籤，這些功能會一起停掉。'));
refresh();
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
go(location.origin + '/rogue.css');
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
h('button', { onclick: () => go(location.origin + '/') }, '開啟遊戲')));
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
['live', '戰況', liveTab],
['mods', '修改', modsTab],
['perf', '效能', perfTab],
['util', '便利', utilTab],
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
.fab.mod::after { content: ""; position: absolute; right: -2px; top: -2px; width: 12px; height: 12px;
border-radius: 50%; background: #ff4d4d; border: 2px solid #15130f; }
.note-box { padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #f3e3b0;
background: rgba(201,162,39,.08); border: 1px solid #4a3d18; }
.note-box b { color: #f0c94a; }
.stats { display: grid; gap: 3px; margin-top: 4px; }
.stat-row { display: grid; grid-template-columns: 1fr 4.2em 5.5em auto; gap: 6px; align-items: center;
padding: 2px 0; border-bottom: 1px solid #221d12; }
.stat-name { display: grid; line-height: 1.2; }
.stat-name small, .best small { color: #888; font-size: 11px; }
.cur { text-align: right; color: #9fd38a; font: 12px ui-monospace, Consolas, monospace; }
.stat-row input[type=number] { padding: 2px 4px; }
label.best { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 4px 0;
padding: 6px 8px; border-radius: 6px; background: rgba(201,162,39,.1); border: 1px solid #4a3d18; }
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
.opt { display: grid; gap: 2px; padding: 6px 0; border-bottom: 1px solid #2a2618; }
.opt b { color: #f3e3b0; }
.fps, .hud { cursor: move; touch-action: none; user-select: none; }
.fps { position: fixed; z-index: 2147483645;
padding: 2px 8px; border-radius: 4px; background: #000a; color: #9fd38a;
font: 12px/1.5 ui-monospace, Consolas, monospace; }
.fps.meh { color: #f0c94a; }
.fps.bad { color: #ff8a80; }
.hud { position: fixed; z-index: 2147483645; white-space: pre;
padding: 6px 10px; border-radius: 6px; background: #000b; color: #eee; border: 1px solid #4a3d18;
font: 12px/1.6 system-ui, "Microsoft JhengHei", sans-serif; }
.hud[hidden] { display: none; }
.lowhp { position: fixed; inset: 0; z-index: 2147483644; pointer-events: none; opacity: 0;
box-shadow: inset 0 0 60px 18px #ff1a1a; transition: opacity .3s; }
.lowhp.show { animation: wowbm-pulse 1s ease-in-out infinite; }
@keyframes wowbm-pulse { 0%, 100% { opacity: .25; } 50% { opacity: .9; } }
.banner { position: fixed; left: 50%; top: 18%; transform: translateX(-50%); z-index: 2147483645;
pointer-events: none; padding: 8px 18px; border-radius: 6px; background: #300c; color: #ffd36b;
border: 1px solid #c9a227; font: bold 18px system-ui, "Microsoft JhengHei", sans-serif;
opacity: 0; transition: opacity .3s; }
.banner.show { opacity: 1; }
textarea { width: 100%; padding: 4px 6px; background: #0c0b08; color: #eee; border: 1px solid #555;
border-radius: 4px; font: 12px/1.4 ui-monospace, Consolas, monospace; resize: vertical; }
pre.out { margin: 0; padding: 4px 6px; background: #000; border-radius: 4px; color: #9fd38a;
font: 12px/1.4 ui-monospace, Consolas, monospace; white-space: pre-wrap; word-break: break-all; }
pre.out:empty { display: none; }
details { display: grid; gap: 6px; }
details[open] { display: grid; }
summary { cursor: pointer; color: #f3e3b0; }
ol { margin: 0; padding-left: 1.4em; }
`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function toolbox() {
const old = document.getElementById(ROOT_ID);
if (old) { old.__wowbmClose?.(); return; }
const host = h('div', { id: ROOT_ID });
host.__wowbmClose = () => { utilStop(); liveStop(); modsStop(); clearInterval(modTimer); host.remove(); };
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
h('button', { title: '把懸浮按鈕也收掉（再按一次書籤叫回來）', onclick: () => host.__wowbmClose() }, '收起'),
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
utilStart(shadow);
liveStart(shadow);
modsStart();
const modTimer = setInterval(() => {
fab.classList.toggle('mod', isModded());
fab.title = isModded() ? 'WoW 工具箱（已使用修改功能：這一局不上傳）' : 'WoW 工具箱（可拖曳）';
}, 1000);
}
const bootQs = onGame() && !document.getElementById('benilla') ? pendingBoot() : null;
if (bootQs !== null) {
bootWithBridge(bootQs).then(toolbox, (e) => alert('WoW 工具箱：遊戲載入失敗 ' + (e?.message || e)));
} else {
toolbox();
}
})();
