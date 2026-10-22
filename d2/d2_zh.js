void (function D2ZH() {
if (window.__D2ZH) {
const I = window.D2I18N;
if (I) I.setLanguage(I.language === 'zh-Hant' ? 'en' : 'zh-Hant');
return;
}
// 桌面版（安裝版）由 desktop/d2zh-inject.cjs 注入，會先設 __D2ZH_DESKTOP；頁面上沒有 #d2-files
if (!document.getElementById('d2-files') && !window.__D2ZH_DESKTOP) {
alert('請在 D2 Survivors 遊戲頁面（https://d2survivors.lol/）按這個書籤。');
return;
}
window.__D2ZH = true;
// 中文化版本號：每次發布更新加一（顯示在「書籤修改」面板標題旁）
const D2ZH_VERSION = 'V2';
window.__D2ZH_VERSION = D2ZH_VERSION;
const D2_FONTS = {"font6":{"h":11,"lh":14,"adv":[7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,5,5,4,7,6,9,7,2,3,3,5,6,3,4,3,4,7,4,5,5,6,5,5,5,5,6,3,3,6,7,6,6,9,6,6,7,7,6,6,7,7,4,5,7,5,8,7,7,6,7,7,5,6,7,7,9,6,6,6,3,4,3,6,6,3,7,6,5,6,6,5,6,7,4,5,7,4,8,6,6,6,6,5,6,5,6,6,9,6,7,5,4,2,5,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,2,2,7,7,7,7,7,7,7,7,7,7,7,7,7,5,5,6,6,6,6,2,5,5,8,5,5,5,5,8,4,4,6,4,4,3,7,5,5,4,3,5,5,9,8,9,6,7,7,7,7,7,7,9,7,6,6,6,6,4,4,4,4,7,7,7,7,7,7,7,6,7,7,7,7,7,7,6,8,6,6,6,6,6,6,9,5,6,6,6,6,3,3,3,5,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7]},"font8":{"h":14,"lh":18,"adv":[8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,4,4,4,9,7,10,8,3,5,5,7,10,4,4,4,4,7,7,7,7,7,7,7,7,7,7,4,4,10,10,10,7,12,8,8,9,9,8,7,9,9,4,4,8,6,11,9,9,8,9,8,8,7,9,8,12,8,8,8,5,4,5,12,7,7,8,8,7,8,7,5,8,7,4,4,7,4,12,8,7,8,8,6,7,5,8,7,10,7,7,7,7,7,7,10,8,8,8,4,7,6,12,7,7,7,15,8,4,12,8,8,8,8,4,4,6,6,7,7,12,7,10,7,4,12,8,7,8,7,4,7,7,8,7,7,7,7,10,6,6,10,4,10,7,5,10,5,5,7,7,7,4,7,5,6,6,11,11,11,7,8,8,8,8,8,8,11,9,8,8,8,8,4,4,4,4,9,9,9,9,9,9,9,10,9,9,9,9,9,8,8,8,8,8,8,8,8,8,11,7,7,7,7,7,4,4,4,4,7,8,7,7,7,7,7,10,7,8,8,8,8,7,7,7]},"font16":{"h":16,"lh":20,"adv":[12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,8,8,7,8,8,13,12,4,5,5,6,8,5,5,5,9,12,5,9,8,9,9,8,8,7,8,5,5,6,7,6,8,11,12,7,9,10,8,8,10,9,5,5,9,8,12,10,11,9,12,10,7,11,12,13,16,12,12,10,5,9,5,5,9,5,10,7,8,8,7,7,9,7,4,4,8,7,10,9,10,7,10,9,7,9,10,10,13,10,10,7,6,3,6,6,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,5,6,12,12,12,12,12,12,12,12,12,12,12,12,12,8,8,7,8,7,12,3,6,6,11,9,7,10,4,11,9,7,9,7,7,5,13,9,7,7,3,8,8,11,13,12,8,12,12,12,12,12,12,11,10,8,7,8,8,5,5,5,7,11,11,11,11,11,12,11,10,11,13,13,13,12,12,8,9,11,10,10,10,10,10,10,8,7,6,7,7,4,5,4,5,8,9,10,9,9,10,10,8,10,10,10,10,10,10,7,10]},"font24":{"h":26,"lh":32,"adv":[17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,12,12,11,11,11,18,17,6,8,7,8,10,6,8,6,12,17,8,12,12,13,12,12,12,11,12,6,8,9,9,9,12,17,18,12,15,15,12,12,14,14,7,7,14,11,17,15,17,12,17,15,11,16,18,18,24,18,18,13,7,12,7,8,10,7,14,11,11,13,9,10,11,11,6,6,11,10,15,13,13,10,14,13,9,14,15,15,20,14,14,12,9,4,10,9,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,7,7,17,17,17,17,17,17,17,17,17,17,17,17,17,12,12,10,12,11,17,4,10,9,16,12,11,15,8,17,8,9,11,9,9,7,19,11,11,12,5,11,11,16,16,18,12,18,18,17,17,18,17,17,14,11,11,11,11,8,7,7,8,16,16,17,17,17,16,17,12,16,18,18,18,19,17,12,13,15,15,14,14,15,15,14,12,9,9,9,9,6,6,7,7,11,13,15,14,14,14,14,11,14,15,15,15,15,15,10,15]},"font30":{"h":30,"lh":38,"adv":[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,16,16,14,14,15,23,21,8,10,9,11,12,8,10,8,16,22,9,15,15,16,15,14,15,15,14,8,8,10,12,10,15,21,22,15,17,18,15,15,17,16,8,8,17,14,22,19,21,14,21,18,14,20,23,23,31,22,22,16,9,16,8,10,15,8,19,12,15,16,13,12,15,14,7,8,14,12,19,16,18,13,18,16,13,17,19,19,24,18,19,14,12,6,12,11,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,8,8,21,21,21,21,21,21,21,21,21,21,21,21,21,16,16,13,14,14,22,7,12,10,21,14,14,18,10,21,10,11,15,11,11,9,24,15,14,15,7,14,13,20,20,22,15,22,23,22,22,22,22,21,17,15,15,15,15,9,9,9,10,18,19,21,21,20,21,21,15,21,23,24,23,23,22,14,16,18,18,18,18,18,19,18,15,13,12,12,12,8,8,9,9,14,16,18,18,18,18,18,14,18,19,19,19,19,18,12,18]},"font42":{"h":41,"lh":51,"adv":[29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,21,21,18,19,19,31,28,10,12,12,14,16,11,13,10,21,29,12,21,20,22,20,19,20,19,20,10,11,13,15,13,19,28,30,20,23,24,20,19,23,22,11,11,23,19,30,26,28,20,28,25,19,28,31,31,41,29,29,22,11,21,11,12,21,12,26,17,20,21,17,17,20,19,10,10,19,17,24,21,23,17,24,21,16,23,25,26,33,24,24,18,16,7,15,13,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,12,11,29,29,29,29,29,29,29,29,29,29,29,29,29,21,21,18,20,19,29,6,16,14,28,19,17,24,13,28,13,14,20,15,14,11,32,20,20,19,9,18,18,27,25,30,19,29,30,30,30,30,30,29,23,19,18,19,19,13,13,13,14,25,26,28,28,29,29,29,20,28,30,31,31,32,30,19,22,26,25,25,25,25,25,24,20,16,16,16,15,11,11,11,11,18,22,24,24,24,24,24,18,24,25,25,26,26,24,16,24]},"fontexocet10":{"h":18,"lh":22,"adv":[13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,9,9,10,9,9,14,13,6,7,7,7,11,6,9,5,9,13,6,9,9,9,9,9,10,8,9,6,6,9,10,9,9,12,13,9,10,11,9,9,10,11,6,7,12,9,15,11,12,9,12,12,9,12,14,14,18,14,13,10,6,10,6,8,10,7,11,8,9,10,8,8,9,10,5,7,11,8,13,10,11,8,11,10,8,11,12,12,17,13,11,9,7,3,7,7,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,7,7,12,12,12,12,12,12,12,12,12,12,12,12,12,9,9,8,10,9,14,3,7,7,12,8,9,12,8,12,11,6,11,5,5,6,14,10,8,8,5,9,9,12,12,13,9,14,14,14,14,14,14,15,10,9,9,9,9,7,7,6,8,11,11,12,12,12,12,12,9,13,14,14,14,14,14,9,10,14,14,14,14,14,14,15,10,9,9,9,9,6,7,6,7,11,11,12,12,12,12,12,9,13,14,14,14,14,14,9,14]},"fontformal12":{"h":20,"lh":25,"adv":[11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,6,6,6,13,10,15,12,3,6,6,9,14,6,6,6,5,10,10,10,10,10,10,10,10,10,10,6,6,14,14,14,9,17,12,11,12,12,11,10,13,13,6,6,11,9,15,13,13,10,13,11,10,10,12,12,16,11,11,11,6,5,6,17,9,9,11,11,9,11,10,7,11,10,5,5,10,5,16,11,10,11,11,8,9,7,11,9,13,10,10,9,9,9,9,14,11,11,11,6,10,8,17,9,9,9,22,10,6,17,11,11,11,11,6,6,8,8,10,9,17,9,14,9,6,16,11,9,11,10,6,10,10,11,10,9,9,9,14,8,8,14,6,14,9,6,14,7,7,9,10,9,6,9,7,8,8,15,15,15,9,12,12,12,12,12,12,16,12,11,11,11,11,6,6,6,6,13,13,13,13,13,13,13,14,13,12,12,12,12,11,10,11,11,11,11,11,11,11,16,9,10,10,10,10,5,5,5,5,10,11,10,10,10,10,10,14,10,11,11,11,11,10,10,10]}};
const D2ZH_STATE = new WeakMap();
const D2ZH_CTX = CanvasRenderingContext2D.prototype;
const D2ZH_PUT = D2ZH_CTX.putImageData;
const D2ZH_DRAW = D2ZH_CTX.drawImage;
const D2ZH_FONT = '"Microsoft JhengHei UI", "Microsoft JhengHei", "Noto Sans TC", "PingFang TC", sans-serif';
const D2ZH_PUNCT = { 8208: 45, 8211: 45, 8212: 45, 8216: 39, 8217: 39, 8220: 34, 8221: 34, 8230: 46 };
const D2ZH_CJK = /[㐀-鿿]/u;
let d2zhBusy = false;
function d2zhLang() {
return window.D2I18N ? window.D2I18N.language : 'en';
}
function d2zhIsText(c) {
return c instanceof HTMLCanvasElement && c.classList.contains('d2-text') && !c.classList.contains('d2-local-font');
}
function d2zhReadable([r, g, b]) {
const lum = 0.3 * r + 0.59 * g + 0.11 * b;
if (lum >= 170) return [r, g, b];
if (lum < 8) return [232, 223, 204];
const k = 170 / lum;
const scaled = [r, g, b].map(v => v * k);
const over = Math.max(...scaled) - 255;
return scaled.map(v => Math.round(Math.min(255, over > 0 ? v + (255 - v) * Math.min(1, over / 255) : v)));
}
function d2zhWidth(font, line) {
let w = 0;
for (const ch of line) {
let code = ch.charCodeAt(0);
code = D2ZH_PUNCT[code] || code;
w += font.adv[code < 256 && font.adv[code] ? code : 63] || 0;
}
return w;
}
function d2zhAnalyze(img, src) {
const { width: W, height: H, data } = img;
const lit = [];
let black = 0, opaque = 0;
for (let i = 0; i < data.length; i += 4) {
if (!data[i + 3]) continue;
opaque++;
const r = data[i], g = data[i + 1], b = data[i + 2];
if (!r && !g && !b) { black++; continue; }
lit.push([0.3 * r + 0.59 * g + 0.11 * b, r, g, b]);
}
let color = [232, 223, 204];
if (lit.length) {
lit.sort((a, b) => b[0] - a[0]);
const top = lit.slice(0, Math.max(1, Math.ceil(lit.length * 0.2)));
color = [1, 2, 3].map(j => Math.round(top.reduce((s, p) => s + p[j], 0) / top.length));
}
color = d2zhReadable(color);
const looksShadow = opaque > 0 && black >= opaque * 0.15 ? 1 : 0;
const lines = src.split('\n');
let pick = null;
for (const name in D2_FONTS) {
const f = D2_FONTS[name];
for (const s of [looksShadow, 1 - looksShadow, 2]) {   // 大字型的陰影偏移 2px（例如營地提示 font24）
const h = H - s;
if (h < f.h || (h - f.h) % f.lh) continue;
const k = (h - f.h) / f.lh + 1;
const natural = Math.max(...lines.map(l => d2zhWidth(f, l)));
const exact = k === lines.length && natural + s === W;
const wrapped = k > lines.length && natural + s > W;
const score = (exact ? 4 : 0) + (wrapped ? 2 : 0) + (s === looksShadow ? 1 : 0);
if (!pick || score > pick.score) pick = { f, s, k, score };
}
}
// 認不出字型：至少在原本的寬度內換行，不要整行超出畫面
if (!pick) pick = { f: { h: H, lh: Math.round(H * 1.25) }, s: looksShadow, k: lines.length, guess: true };
// 第一行英文實際有筆畫的高度（大字型的字框比字母高很多，中文要照這個高度縮小）
let inkTop = -1, inkBottom = -1;
for (let y = 0; y < Math.min(H, pick.f.h); y++) {
for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3]) { if (inkTop < 0) inkTop = y; inkBottom = y; break; }
}
const ink = inkTop < 0 ? 0 : inkBottom - inkTop + 1 - pick.s;
let align = 'center';
if (pick.k > 1) {
let left = true, right = true, ragged = false;
for (let line = 0; line < pick.k; line++) {
const y0 = line * pick.f.lh, y1 = Math.min(H, y0 + pick.f.h);
let min = W, max = -1;
for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
if (data[(y * W + x) * 4 + 3]) { if (x < min) min = x; if (x > max) max = x; }
}
if (max < 0) continue;
if (min > 1) left = false;
if (max < W - 2 - pick.s) right = false;
if (min > 2 || max < W - 3 - pick.s) ragged = true;
}
if (ragged) align = left ? 'left' : right ? 'right' : 'center';
}
return {
src, en: img, w: W, h: H, lang: 'en',
size: pick.f.h, lh: pick.f.lh, shadow: pick.s, color, align, ink,
maxWidth: pick.k > lines.length || pick.guess ? W - pick.s : 0,
};
}
function d2zhWrap(ctx, text, maxWidth) {
if (!maxWidth || ctx.measureText(text).width <= maxWidth) return [text];
const out = [];
let line = '';
for (const token of text.includes(' ') ? text.split(/(?<=\s)/u) : Array.from(text)) {
const next = line + token;
if (line && ctx.measureText(next).width > maxWidth) {
out.push(line.trimEnd());
line = token.trimStart();
if (ctx.measureText(line).width > maxWidth) {
let part = '';
for (const ch of Array.from(line)) {
if (part && ctx.measureText(part + ch).width > maxWidth) { out.push(part); part = ch; }
else part += ch;
}
line = part;
}
} else line = next;
}
if (line) out.push(line.trimEnd());
return out;
}
// 把一行中文拆成 n 行：挑最寬那行最窄的斷點，「和」之後、「技能／法術／靈氣…」之前優先
function d2zhSplit(ctx, text, n) {
const chars = Array.from(text);
if (n < 2 || chars.length < 3) return text;
const tail = /^(技能|法術|靈氣|精通|藝術|修行)$/;
let best = null;
for (let i = 1; i < chars.length; i++) {
const a = chars.slice(0, i).join(''), b = chars.slice(i).join('');
let cost = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
if (chars[i - 1] === '和' || chars[i - 1] === '與' || tail.test(b)) cost -= ctx.measureText('一').width * 1.2;
if (!best || cost < best.cost) best = { cost, text: a + '\n' + (n > 2 ? d2zhSplit(ctx, b, n - 1) : b) };
}
return best.text;
}
function d2zhPaint(c, st) {
const lang = d2zhLang();
st.lang = lang;
d2zhBusy = true;
try {
const ctx = c.getContext('2d');
if (!ctx) return;
const cjk = D2ZH_CJK.test(st.src);
if (!cjk && (lang !== 'zh-Hant' || !window.D2I18N.shouldUseLocalFont(st.src))) {
if (c.width !== st.w || c.height !== st.h) { c.width = st.w; c.height = st.h; }
D2ZH_PUT.call(ctx, st.en, 0, 0);
return;
}
let text = cjk ? st.src : window.D2I18N.translate(st.src);
let size = Math.max(10, st.size);
// 大字型（選單用的 font24 以上）：中文高度對齊英文字母實際高度，不要用整個字框高度
if (st.size >= 24 && st.ink > 0) size = Math.max(14, Math.min(size, Math.round(st.ink * 1.1)));
let font = `bold ${size}px ${D2ZH_FONT}`;
ctx.font = font;
// 原文分成好幾行的短標籤（例如技能樹分頁 "Defensive\nAuras"）：中文也照行數拆開，太寬就縮小字，不要超出原本的框
const inTab = !!c.closest('.tree-tab');
const boxed = !cjk && (st.src.includes('\n') || inTab) && D2ZH_CJK.test(text);
if (boxed && !text.includes('\n')) {
const rows = Math.max(st.src.split('\n').length, inTab && ctx.measureText(text).width > st.w ? 2 : 1);
text = d2zhSplit(ctx, text, rows);
}
let lines = text.split('\n').flatMap(l => d2zhWrap(ctx, l, st.maxWidth));
let widths = lines.map(l => ctx.measureText(l).width);
const widest = Math.max(0, ...widths);
if (boxed && widest > st.w) {
size = Math.max(10, Math.floor(size * st.w / widest));
font = `bold ${size}px ${D2ZH_FONT}`;
ctx.font = font;
widths = lines.map(l => ctx.measureText(l).width);
}
const lh = Math.max(size + 2, st.lh), s = st.shadow;
const stroke = size < 16 ? 1.5 : Math.max(2, Math.round(size / 9));
const pad = Math.ceil(stroke / 2);
c.width = Math.max(1, Math.ceil(Math.max(0, ...widths)) + s + pad * 2);
c.height = Math.max(1, Math.ceil(size + (lines.length - 1) * lh + s + pad * 2));
ctx.font = font;
ctx.textBaseline = 'middle';
ctx.lineJoin = 'round';
ctx.lineWidth = stroke;
ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
const fill = `rgb(${st.color[0]}, ${st.color[1]}, ${st.color[2]})`;
lines.forEach((line, i) => {
const w = widths[i];
const inner = c.width - pad * 2 - s;
const x = pad + (st.align === 'left' ? 0 : st.align === 'right' ? inner - w : (inner - w) / 2);
const y = pad + size / 2 + i * lh;
if (s) { ctx.fillStyle = '#000'; ctx.fillText(line, x + 1, y + 1); }
ctx.strokeText(line, x, y);
ctx.fillStyle = fill;
ctx.fillText(line, x, y);
});
c.setAttribute('aria-label', text);
} finally {
d2zhBusy = false;
}
}
function d2zhCapture(c, img, src) {
const st = d2zhAnalyze(img, src);
D2ZH_STATE.set(c, st);
if (d2zhLang() === 'zh-Hant' || D2ZH_CJK.test(src)) d2zhPaint(c, st);
return st;
}
function d2zhAdopt(c) {
if (!c.width || !c.height || !c.textContent) return null;
const ctx = c.getContext('2d');
if (!ctx) return null;
const st = d2zhAnalyze(ctx.getImageData(0, 0, c.width, c.height), c.textContent);
D2ZH_STATE.set(c, st);
return st;
}
function d2zhMergeParts(box) {
const kids = [...box.children].filter(c => D2ZH_STATE.has(c));
const states = kids.map(c => D2ZH_STATE.get(c));
kids.forEach((c, k) => {
const st = states[k];
if (st.orig === undefined) st.orig = st.src;
if (st.src !== st.orig || c.style.display === 'none') { st.src = st.orig; st.lang = null; c.style.display = ''; }
});
if (d2zhLang() === 'zh-Hant' && window.__d2zhKnown) {
for (let i = 0; i < kids.length; i++) {
for (let n = Math.min(4, kids.length - i); n >= 2; n--) {
const group = states.slice(i, i + n);
const color = group[0].color.join();
if (group.some(st => st.color.join() !== color)) continue;
const last = group[n - 1].orig;
const tail = /[:,.;!?]$/.test(last) ? last.slice(-1) : '';
const phrase = group.map(st => st.orig).join(' ');
const name = tail ? phrase.slice(0, -1) : phrase;
if (!window.__d2zhKnown(name)) continue;
group[0].src = phrase;
group[0].lang = null;
kids.slice(i + 1, i + n).forEach(c => { c.style.display = 'none'; });
i += n - 1;
break;
}
}
}
kids.forEach((c, k) => { if (states[k].lang !== d2zhLang()) d2zhPaint(c, states[k]); });
}
function d2zhMergeAll(root) {
if (!(root instanceof Element)) return;
if (root.classList.contains('d2-parts')) d2zhMergeParts(root);
for (const box of root.querySelectorAll('.d2-parts')) d2zhMergeParts(box);
}
function d2zhInstallHook() {
D2ZH_CTX.putImageData = function (img, dx, dy) {
const r = D2ZH_PUT.apply(this, arguments);
const c = this.canvas;
if (!d2zhBusy && arguments.length === 3 && dx === 0 && dy === 0 && d2zhIsText(c)
&& img.width === c.width && img.height === c.height) {
try { d2zhCapture(c, img, c.textContent || ''); } catch (e) { console.warn('[D2 中文]', e); }
}
return r;
};
D2ZH_CTX.drawImage = function (img) {
if (!d2zhBusy && img instanceof HTMLCanvasElement && img.classList.contains('d2-text')) {
try {
const st = D2ZH_STATE.get(img) || (d2zhIsText(img) ? d2zhAdopt(img) : null);
if (st && st.lang !== d2zhLang()) d2zhPaint(img, st);
if (st) d2edOnTextDraw(this, img, arguments, st.src === 'PREVIOUS MENU');
} catch (e) { console.warn('[D2 中文]', e); }
}
return D2ZH_DRAW.apply(this, arguments);
};
window.addEventListener('d2-language-changed', () => {
for (const c of document.querySelectorAll('canvas.d2-text')) {
const st = D2ZH_STATE.get(c);
if (st && st.lang !== d2zhLang()) d2zhPaint(c, st);
}
d2zhMergeAll(document.body);
});
new MutationObserver(records => {
for (const r of records) for (const node of r.addedNodes) d2zhMergeAll(node);
}).observe(document.body, { subtree: true, childList: true });
for (const c of document.querySelectorAll('canvas.d2-text')) if (d2zhIsText(c)) d2zhAdopt(c);
}
const D2ED = { player: null, extras: null, added: new WeakMap(), menuAt: 0, otherAt: 0, menuRect: null, button: null, panel: null };
const D2ED_SAVE_KEY = 'd2-survivors/save/v1';
const D2ED_ELEMENTS = ['fire', 'cold', 'lightning', 'poison', 'magic'];
const D2ED_LIFE_PER_VIT = { amazon: 6, assassin: 6, barbarian: 8, druid: 4, necromancer: 4, paladin: 6, sorceress: 4 };
const D2ED_RANKS = [
['strength', '力量（每級起始 +5）', 10], ['dexterity', '敏捷（每級起始 +5）', 10],
['vitality', '體力（每級起始 +5）', 10], ['energy', '精力（每級起始 +5）', 10],
['goldFind', '尋獲金幣（每級 +10%）', 10], ['magicFind', '尋獲魔法物品（每級 +10%）', 10],
['damageReduced', '傷害減少（每級 2%）', 5], ['replenish', '補充生命（每級每秒 +0.5）', 5],
['rerolls', '重抽次數', 3], ['skips', '略過次數', 3], ['banishes', '放逐次數', 3], ['resurrect', '復活次數', 2],
];
const D2ED_FIELDS = [
['life', '目前生命', '', 0], ['maxLife', '生命上限', '', 0], ['regen', '每秒恢復生命', '', 1],
['speed', '移動速度', '一開始是 150', 0], ['pickupRadius', '拾取範圍', '一開始是 70', 0],
['might', '傷害倍率', '所有技能，1 = 原本', 2], ['weaponDamage', '攻擊傷害倍率', '武器技能，1 = 原本', 2],
['castSpeed', '技能冷卻倍率', '越小越快，0.5 = 冷卻減半', 2], ['damageTaken', '受到傷害倍率', '0 = 無敵', 2],
['crit', '致命一擊機率', '0.25 = 25%', 2], ['allSkills', '所有技能等級', '+N 級', 0],
['magicFind', '尋獲魔法物品', '%', 0], ['goldGain', '金幣獲得倍率', '1 = 原本', 2],
['mastery.physical', '物理加成', '力量每 5 點 +0.05', 2], ['mastery.fire', '火焰加成', '', 2],
['mastery.cold', '冰寒加成', '', 2], ['mastery.lightning', '閃電加成', '', 2],
['mastery.poison', '毒素加成', '', 2], ['mastery.magic', '魔法加成', '', 2],
];
function d2edInRun() {
return !!D2ED.player && !document.body.classList.contains('no-run');
}
function d2edGet(path) {
const p = D2ED.player;
if (path === 'crit') return D2ED.extras ? D2ED.extras.crit : NaN;
const [a, b] = path.split('.');
return b ? p[a][b] : p[a];
}
function d2edSet(path, v) {
const p = D2ED.player;
if (path === 'crit') { if (D2ED.extras) D2ED.extras.crit = v; return; }
const [a, b] = path.split('.');
if (b) p[a][b] = v; else p[a] = v;
}
function d2edAttribute(attr, n) {
const p = D2ED.player;
// 跟遊戲的屬性效果一樣（build 20261020：力量加 strDamage、敏捷加 dexDamage，不再乘 weaponDamage）
if (attr === 'strength') {
p.mastery.physical += 0.05 * n;
p.strDamage = (p.strDamage || 0) + 0.05 * n;
} else if (attr === 'dexterity') {
if (D2ED.extras) D2ED.extras.crit += 0.01 * n;
p.dexDamage = (p.dexDamage || 0) + 0.03 * n;
p.dexterity = (p.dexterity || 0) + 5 * n;
} else if (attr === 'vitality') {
const life = (D2ED_LIFE_PER_VIT[p.cls] || 6) * 5 * n;
p.maxLife = Math.max(1, p.maxLife + life);
p.life = Math.max(1, Math.min(p.maxLife, p.life + life));
} else if (attr === 'energy') for (const el of D2ED_ELEMENTS) p.mastery[el] += 0.05 * n;
const added = D2ED.added.get(p) || {};
added[attr] = (added[attr] || 0) + 5 * n;
D2ED.added.set(p, added);
}
function d2edReadSave() {
try { return JSON.parse(localStorage.getItem(D2ED_SAVE_KEY) || '{}') || {}; } catch (_) { return {}; }
}
function d2edWriteSaveAndReload(gold, ranks) {
const write = () => {
const save = d2edReadSave();
save.gold = gold;
save.ranks = save.ranks || {};
for (const [k, v] of Object.entries(ranks)) { if (v > 0) save.ranks[k] = v; else delete save.ranks[k]; }
try { localStorage.setItem(D2ED_SAVE_KEY, JSON.stringify(save)); } catch (e) { alert('存檔寫入失敗：' + e); }
};
write();
addEventListener('pagehide', write);
location.reload();
}
function d2edOnTextDraw(ctx, img, args, isMenu) {
const now = performance.now();
if (isMenu) d2edOnMenuDraw(ctx, img, args, now);
else if (now - D2ED.menuAt > 100) D2ED.otherAt = now;
}
function d2edOnMenuDraw(ctx, img, args, now) {
const t = ctx.getTransform();
const x = args[1], y = args[2];
const w = args.length >= 5 ? args[3] : img.width, h = args.length >= 5 ? args[4] : img.height;
const canvas = ctx.canvas, rect = canvas.getBoundingClientRect();
const sx = rect.width / canvas.width, sy = rect.height / canvas.height;
const px = (X, Y) => [rect.left + (t.a * X + t.c * Y + t.e) * sx, rect.top + (t.b * X + t.d * Y + t.f) * sy];
const [l, top] = px(x, y), [r, bottom] = px(x + w, y + h);
D2ED.menuAt = now;
D2ED.menuRect = { left: l, top, right: r, bottom, canvas: rect };
}
function d2edPlaceButton() {
const b = D2ED.button, sw = D2ED.switcher;
const show = D2ED.menuRect && D2ED.menuAt >= D2ED.otherAt && performance.now() - D2ED.menuAt < 4000 && !D2ED.panel;
b.style.display = show ? 'block' : 'none';
if (sw) sw.style.display = show ? 'flex' : 'none';
if (show) {
const m = D2ED.menuRect, h = Math.max(30, Math.min(48, (m.bottom - m.top) * 0.9));
b.style.fontSize = Math.round(h * 0.5) + 'px';
b.style.height = Math.round(h) + 'px';
const width = Math.max(b.offsetWidth || 140, sw ? sw.offsetWidth : 0);
const roomRight = m.canvas.right - m.right - 16;
const left = roomRight >= width ? m.right + 16 : Math.max(m.canvas.left + 8, m.canvas.right - width - 12);
const top = roomRight >= width ? (m.top + m.bottom) / 2 - h / 2 : m.top - h - 8;
b.style.left = Math.round(left) + 'px';
b.style.top = Math.round(top) + 'px';
if (sw) {
sw.style.left = Math.round(Math.max(left, m.canvas.right - (sw.offsetWidth || 180) - 12)) + 'px';
sw.style.top = Math.round(Math.min(top + h + h * 0.9, m.canvas.bottom - (sw.offsetHeight || 32) - 4)) + 'px';
}
}
requestAnimationFrame(d2edPlaceButton);
}
function d2edAdoptSwitcher() {
const sw = document.getElementById('d2-language-switch');
if (!sw) return;
if (!sw.querySelector('.d2ed-lang-label')) {
const label = document.createElement('span');
label.className = 'd2ed-lang-label';
label.textContent = '語言';
sw.prepend(label);
}
sw.style.right = 'auto';
sw.style.display = 'none';
D2ED.switcher = sw;
}
function d2edEl(tag, attrs, ...kids) {
const e = document.createElement(tag);
for (const [k, v] of Object.entries(attrs || {})) {
if (k === 'style') e.style.cssText = v;
else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
else e.setAttribute(k, v);
}
for (const k of kids) e.append(k);
return e;
}
function d2edRound(v, digits) {
return Number.isFinite(v) ? String(Number(v.toFixed(digits))) : '';
}
function d2edToast(msg) {
const t = D2ED.panel && D2ED.panel.querySelector('.d2ed-msg');
if (!t) return;
t.textContent = msg;
clearTimeout(t._h);
t._h = setTimeout(() => { t.textContent = ''; }, 2500);
}
function d2edRunSection() {
const box = d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '本局人物'));
if (!d2edInRun()) {
box.append(d2edEl('p', { class: 'd2ed-note' },
D2ED.player ? '目前不在遊戲中。進入遊戲後，按 Esc 暫停 → 選項 → 書籤修改。'
: '還沒抓到人物資料：進入遊戲、打到第一隻怪物後就會出現（書籤要在進遊戲前或遊戲中按過一次）。'));
return box;
}
const p = D2ED.player;
const added = D2ED.added.get(p) || {};
const attrs = d2edEl('div', { class: 'd2ed-attrs' });
for (const [k, name] of [['strength', '力量'], ['dexterity', '敏捷'], ['vitality', '體力'], ['energy', '精力']]) {
const count = d2edEl('span', { class: 'd2ed-count' }, added[k] ? (added[k] > 0 ? '+' : '') + added[k] : '0');
const btn = (label, n) => d2edEl('button', { type: 'button', onclick: () => { d2edAttribute(k, n); d2edRender(); } }, label);
attrs.append(d2edEl('div', { class: 'd2ed-attr' }, d2edEl('b', {}, name), btn('－5', -1), count, btn('＋5', 1)));
}
box.append(d2edEl('p', { class: 'd2ed-note' }, '屬性加減效果跟升級時選屬性一樣（中間是這次用書籤加減的點數）。'), attrs);
const grid = d2edEl('div', { class: 'd2ed-grid' });
const inputs = [];
for (const [path, name, hint, digits] of D2ED_FIELDS) {
const input = d2edEl('input', { type: 'number', step: digits ? String(1 / 10 ** digits) : '1', value: d2edRound(d2edGet(path), digits) });
inputs.push([path, input]);
grid.append(d2edEl('label', {}, d2edEl('span', {}, name, hint ? d2edEl('small', {}, hint) : ''), input));
}
const apply = () => {
let n = 0;
for (const [path, input] of inputs) {
const v = Number(input.value);
if (input.value === '' || !Number.isFinite(v)) continue;
if (Math.abs(v - d2edGet(path)) > 1e-9) { d2edSet(path, v); n++; }
}
if (p.life > p.maxLife) p.life = p.maxLife;
d2edRender();
d2edToast(n ? `已套用 ${n} 項` : '沒有變更');
};
box.append(grid, d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: apply }, '套用'),
d2edEl('button', { type: 'button', onclick: () => { p.life = p.maxLife; d2edRender(); d2edToast('生命已補滿'); } }, '生命補滿')),
d2edEl('p', { class: 'd2ed-note' }, '只對這一局有效：「儲存並離開」後再繼續，會回到原本的數值。'));
return box;
}
function d2edSaveSection() {
const box = d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '永久升級（存檔）'));
if (!document.body.classList.contains('no-run')) {
box.append(d2edEl('p', { class: 'd2ed-note' }, '遊戲中不能改存檔（遊戲會蓋回去）。請「儲存並離開遊戲」，在主選單的 選項 → 書籤修改 修改。'));
return box;
}
const save = d2edReadSave();
const ranks = save.ranks || {};
const grid = d2edEl('div', { class: 'd2ed-grid' });
const gold = d2edEl('input', { type: 'number', min: '0', step: '1', value: String(save.gold || 0) });
grid.append(d2edEl('label', {}, d2edEl('span', {}, '金幣'), gold));
const inputs = [];
for (const [key, name, max] of D2ED_RANKS) {
const input = d2edEl('input', { type: 'number', min: '0', max: String(max), step: '1', value: String(ranks[key] || 0) });
inputs.push([key, max, input]);
grid.append(d2edEl('label', {}, d2edEl('span', {}, name, d2edEl('small', {}, `0～${max}`)), input));
}
const fill = () => { for (const [, max, input] of inputs) input.value = String(max); };
const apply = () => {
const out = {};
for (const [key, max, input] of inputs) out[key] = Math.max(0, Math.min(max, Math.floor(Number(input.value) || 0)));
const g = Math.max(0, Math.floor(Number(gold.value) || 0));
if (confirm('要儲存並重新載入遊戲嗎？')) d2edWriteSaveAndReload(g, out);
};
box.append(d2edEl('p', { class: 'd2ed-note' }, '恰西賣的永久升級，每個英雄都適用。等級不能超過遊戲的上限。'), grid,
d2edEl('div', { class: 'd2ed-row' },
d2edEl('button', { type: 'button', class: 'd2ed-main', onclick: apply }, '儲存並重新載入'),
d2edEl('button', { type: 'button', onclick: fill }, '全部填滿')),
d2edEl('p', { class: 'd2ed-note' }, window.__D2ZH_DESKTOP ? '儲存後遊戲會重新載入，中文會自動恢復。' : '儲存後頁面會重新載入，要再點一次書籤才會恢復中文。'));
return box;
}
// 電腦安裝版：從作者（我們）的 GitHub 更新中文化。頁面不能上網，由 d2zh-inject.cjs（主程序）下載，
// 這裡用 console.log('__D2ZH__:update') 通知它，下載完它會呼叫 window.__d2zhUpdateDone(結果)。
function d2edUpdateSection() {
const desk = window.__D2ZH_DESKTOP;
if (!desk) return null;
const box = d2edEl('section', { class: 'd2ed-sec' }, d2edEl('h3', {}, '中文化更新（電腦版）'));
if (typeof desk !== 'object' || !desk.updater) {
box.append(d2edEl('p', { class: 'd2ed-note' }, '這個版本還不能在遊戲裡更新：請重新下載「D2倖存者中文化.zip」，執行一次「建立桌面捷徑.cmd」或「安裝中文版.cmd」。'));
return box;
}
const when = t => t ? new Date(t).toLocaleString('zh-TW', { hour12: false }) : '—';
const loaded = desk.fileTime || 0;   // 這個頁面正在用的翻譯檔時間（注入時記下的）
// 新的翻譯檔是在這個頁面載入之後才下載的，才需要重新載入
const needReload = r => !!r && r.changed.includes('d2_zh.js') && loaded < r.at;
const status = d2edEl('p', { class: 'd2ed-note d2ed-update-status' });
const describe = r => {
if (!r) return `目前翻譯檔：${when(loaded)}`;
if (r.errors.length && !r.changed.length) return `更新失敗（${r.errors[0]}）。請確認網路連線後再試一次。`;
if (!needReload(r) && r.applies !== 'restart') return `已經是最新版（${when(r.at)} 檢查）。`;
if (!needReload(r)) return '已下載新版安裝程式，下次開遊戲時生效。';
if (r.applies === 'restart') return '已下載新版！翻譯按「重新載入」就會套用；安裝程式的部分在下次開遊戲時生效。';
return '已下載新版翻譯！按「重新載入」就會套用。';
};
const reload = d2edEl('button', { type: 'button', class: 'd2ed-main', style: 'display:none', onclick: () => {
if (!document.body.classList.contains('no-run') && !confirm('遊戲中重新載入，這一局沒存到的進度會不見。確定要重新載入嗎？\n（建議先「儲存並離開遊戲」，在主選單再按）')) return;
location.reload();
} }, '重新載入');
const show = r => {
status.textContent = describe(r);
reload.style.display = needReload(r) ? '' : 'none';
};
const check = d2edEl('button', { type: 'button', onclick: () => {
check.disabled = true;
status.textContent = '正在從 GitHub 檢查更新…';
window.__d2zhUpdateDone = result => {
check.disabled = false;
// 之前（例如開遊戲時的背景檢查）已經下載、這次沒再變的，也要算進「需要重新載入」
if (needReload(desk.lastCheck) && !result.changed.includes('d2_zh.js')) result.changed.push('d2_zh.js');
desk.lastCheck = result;
show(result);
};
console.log('__D2ZH__:update');
} }, '檢查更新');
// 開遊戲時背景已經自動下載過新版、這個頁面還沒用到：直接提示可以重新載入
show(needReload(desk.lastCheck) ? desk.lastCheck : null);
box.append(d2edEl('p', { class: 'd2ed-note' }, '翻譯和修改功能會從 GitHub 下載最新版。每次開遊戲也會在背景自動檢查。'),
status, d2edEl('div', { class: 'd2ed-row' }, check, reload));
return box;
}
function d2edRender() {
const body = D2ED.panel.querySelector('.d2ed-body');
body.replaceChildren(...[d2edRunSection(), d2edSaveSection(), d2edUpdateSection()].filter(Boolean));
}
function d2edOpen() {
if (D2ED.panel) return;
const close = () => { D2ED.panel.remove(); D2ED.panel = null; };
D2ED.panel = d2edEl('div', { id: 'd2ed-overlay', onclick: e => { if (e.target.id === 'd2ed-overlay') close(); } },
d2edEl('div', { class: 'd2ed-card', role: 'dialog', 'aria-label': '書籤修改' },
d2edEl('div', { class: 'd2ed-head' }, d2edEl('b', {}, '書籤修改'), d2edEl('span', { class: 'd2ed-ver', title: '中文化版本' }, D2ZH_VERSION), d2edEl('span', { class: 'd2ed-msg' }),
d2edEl('button', { type: 'button', class: 'd2ed-x', onclick: close, 'aria-label': '關閉' }, '×')),
d2edEl('div', { class: 'd2ed-body' })));
D2ED.panel.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close(); });
document.body.append(D2ED.panel);
d2edRender();
}
function d2edInstall() {
window.__D2ED = D2ED; // 除錯用（在主控台看抓到的人物、選單位置）
const rawGet = WeakMap.prototype.get;
WeakMap.prototype.get = function (key) {
const v = rawGet.call(this, key);
if (v && key && typeof key === 'object' && key.mastery && key.cls && key.weaponDamage !== undefined && typeof v.crit === 'number') {
D2ED.player = key;
D2ED.extras = v;
}
return v;
};
const style = document.createElement('style');
style.textContent = `
#d2ed-btn { position: fixed; z-index: 2147483646; display: none; padding: 0 16px; cursor: pointer;
font: bold 18px ${D2ZH_FONT}; color: #f0d896; letter-spacing: 1px; white-space: nowrap;
background: linear-gradient(180deg, #3a2e1c, #1a140c); border: 2px solid #c7a45f; border-radius: 4px;
text-shadow: 0 1px 2px #000, 0 0 2px #000; box-shadow: 0 2px 10px #000c; }
#d2ed-btn:hover { color: #fff3c4; border-color: #f0d896; }
#d2-language-switch { align-items: center; font-size: 14px; }
#d2-language-switch .d2ed-lang-label { padding: 0 6px; color: #c7a45f; font-size: 13px; white-space: nowrap; }
#d2ed-overlay { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 12px;
background: rgba(0,0,0,.6); font: 14px/1.5 ${D2ZH_FONT}; color: #e8e2d0; }
#d2ed-overlay .d2ed-card { width: min(560px, 100%); max-height: calc(100vh - 24px); display: flex; flex-direction: column;
background: linear-gradient(180deg, #221a12, #120d08); border: 2px solid #8f743e; border-radius: 8px; box-shadow: 0 10px 40px #000; }
#d2ed-overlay .d2ed-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #4a3418; }
#d2ed-overlay .d2ed-head b { color: #f0c94a; font-size: 18px; }
#d2ed-overlay .d2ed-ver { padding: 0 6px; border: 1px solid #8f743e; border-radius: 4px; color: #c7a45f; font-size: 12px; line-height: 18px; }
#d2ed-overlay .d2ed-msg { flex: 1; color: #9fd38a; font-size: 13px; }
#d2ed-overlay .d2ed-x { background: none; border: 0; color: #d8d0c0; font-size: 24px; line-height: 1; cursor: pointer; }
#d2ed-overlay .d2ed-body { overflow: auto; padding: 4px 14px 14px; }
#d2ed-overlay h3 { margin: 12px 0 4px; color: #c7a45f; font-size: 16px; }
#d2ed-overlay .d2ed-note { margin: 4px 0; color: #a39a82; font-size: 12px; }
#d2ed-overlay .d2ed-attrs { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 6px; margin: 6px 0; }
#d2ed-overlay .d2ed-attr { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(0,0,0,.35); border: 1px solid #2e2216; border-radius: 6px; }
#d2ed-overlay .d2ed-attr b { flex: 1; color: #f3e3b0; }
#d2ed-overlay .d2ed-count { min-width: 3em; text-align: center; color: #9fd38a; }
#d2ed-overlay .d2ed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 6px 12px; margin: 6px 0; }
#d2ed-overlay label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
#d2ed-overlay label span { display: flex; flex-direction: column; }
#d2ed-overlay small { color: #7d7462; font-size: 11px; }
#d2ed-overlay input { width: 96px; padding: 4px 6px; color: #f3e3b0; background: #000; border: 1px solid #5a4a2a; border-radius: 4px; font: 14px ui-monospace, Consolas, monospace; }
#d2ed-overlay button:not(.d2ed-x) { padding: 4px 12px; cursor: pointer; color: #f3e3b0; background: #2c2014; border: 1px solid #8f743e; border-radius: 4px; font: inherit; }
#d2ed-overlay button.d2ed-main { color: #17120b; background: #c7a45f; font-weight: bold; }
#d2ed-overlay .d2ed-row { display: flex; gap: 8px; margin-top: 8px; }
`;
document.head.append(style);
D2ED.button = d2edEl('button', { id: 'd2ed-btn', type: 'button', onclick: e => { e.preventDefault(); e.stopPropagation(); d2edOpen(); } }, '書籤修改');
document.body.append(D2ED.button);
for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend']) {
window.addEventListener(type, e => {
if (e.target instanceof Element && (e.target.closest('#d2ed-btn') || e.target.closest('#d2ed-overlay'))) {
if (type === 'click') return;
e.stopImmediatePropagation();
}
}, true);
}
d2edAdoptSwitcher();
requestAnimationFrame(d2edPlaceButton);
}
d2zhInstallHook();
const D2ZH_EXTRA = {"labels":{"Cap":"帽子","Skull Cap":"骷髏帽","Helm":"頭盔","Full Helm":"全盔","Great Helm":"卓越頭盔","Mask":"面具","Crown":"皇冠","Bone Helm":"骨盔","War Hat":"戰帽","Sallet":"輕便頭盔","Casque":"無頰頭盔","Basinet":"圓頂盔","Winged Helm":"翼盔","Grim Helm":"陰森頭盔","Grand Crown":"巨皇冠","Death Mask":"死亡面具","Shako":"軍帽","Hydraskull":"九頭蛇頭蓋骨圓帽","Armet":"活動頭盔","Giant Conch":"巨型海螺","Spired Helm":"螺旋頭盔","Corona":"頭冠","Demonhead":"惡魔頭顱","Bone Visage":"骨面","Circlet":"頭飾","Coronet":"寶冠","Tiara":"三重冠","Diadem":"權冠","Wolf Head":"狼頭","Hawk Helm":"飛鷹頭盔","Antlers":"鹿角","Falcon Mask":"獵鷹面具","Spirit Mask":"靈魂狼頭面具","Alpha Helm":"阿爾發頭盔","Griffon Headdress":"獅鷲獸頭帶","Hunter's Guise":"獵人的偽裝","Sacred Feathers":"神聖羽毛頭帶","Totemic Mask":"圖騰面具狼盔","Blood Spirit":"血腥之靈","Sun Spirit":"太陽之靈","Earth Spirit":"大地之靈","Sky Spirit":"天空之靈","Dream Spirit":"幽夢之靈","Jawbone Cap":"顎骨帽","Fanged Helm":"尖牙盔","Horned Helm":"角盔","Assault Helmet":"突擊頭盔","Avenger Guard":"復仇者之盔","Jawbone Visor":"顎骨面甲","Lion Helm":"獅頭尖盔","Rage Mask":"狂怒面具","Savage Helmet":"野蠻頭盔","Slayer Guard":"殺手防護面甲","Carnage Helm":"屠殺頭盔","Fury Visor":"暴怒面甲","Destroyer Helm":"毀滅者頭盔","Conqueror Crown":"征服者皇冠面甲","Guardian Crown":"守護者皇冠","Quilted Armor":"布甲","Leather Armor":"皮甲","Hard Leather Armor":"硬皮甲","Studded Leather":"鑲嵌甲","Ring Mail":"環甲","Scale Mail":"鱗甲","Chain Mail":"鎖子甲","Breast Plate":"胸甲","Splint Mail":"板甲","Plate Mail":"板甲","Field Plate":"實戰鎧甲","Gothic Plate":"哥德鎧甲","Full Plate Mail":"全身鎧甲","Ancient Armor":"古代盔甲","Light Plate":"輕型裝甲","Ghost Armor":"鬼魂戰甲","Serpentskin Armor":"海蛇皮甲","Demonhide Armor":"惡魔皮甲","Trellised Armor":"攀繞戰甲","Linked Mail":"連環甲","Tigulated Mail":"鱗片甲","Mesh Armor":"織網戰甲","Cuirass":"胸鎧","Russet Armor":"羅瑟戰甲","Templar Coat":"聖殿外衣","Sharktooth Armor":"鯊齒戰甲","Embossed Plate":"浮雕鎧甲","Chaos Armor":"混沌盔甲","Ornate Plate":"華麗鎧甲","Mage Plate":"法師鎧甲","Dusk Shroud":"灰暮壽衣","Wyrmhide":"龍皮甲","Scarab Husk":"聖甲蟲殼","Wire Fleece":"線羊毛皮甲","Diamond Mail":"鑽石甲","Loricated Mail":"鎖片甲","Boneweave":"骸骨鏈甲","Great Hauberk":"巨型鎖甲","Balrog Skin":"炎魔皮板甲","Hellforge Plate":"地獄熔爐鎧甲","Kraken Shell":"海妖殼甲","Lacquered Plate":"漆鎧","Shadow Plate":"暗影鎧甲","Sacred Armor":"神聖盔甲","Archon Plate":"執政官鎧甲","Buckler":"圓盾","Small Shield":"小盾牌","Large Shield":"大盾牌","Kite Shield":"輕盾","Tower Shield":"塔盾","Gothic Shield":"哥德盾牌","Bone Shield":"白骨盾牌","Spiked Shield":"尖刺盾","Defender":"防禦者盾","Round Shield":"圓型盾","Scutum":"長方盾","Dragon Shield":"龍盾","Pavise":"大型立盾","Ancient Shield":"古代之盾","Grim Shield":"冷酷之盾","Barbed Shield":"倒鉤盾","Heater":"加熱盾","Luna":"月盾","Hyperion":"亥伯龍盾","Monarch":"統治者大盾","Aegis":"神盾","Ward":"保護盾牌","Troll Nest":"洞穴巨魔巢穴骨盾","Blade Barrier":"刀刃屏障","Targe":"小盾","Rondache":"圓盾牌","Heraldic Shield":"紋章盾","Aerin Shield":"艾林盾","Crown Shield":"皇冠盾","Akaran Targe":"阿卡蘭輕圓盾","Akaran Rondache":"阿卡蘭圓盾","Protector Shield":"保護者之盾","Gilded Shield":"飾金盾牌","Royal Shield":"皇家盾","Sacred Targe":"神聖小盾","Sacred Rondache":"神聖輕圓盾","Kurast Shield":"庫拉斯特盾","Zakarum Shield":"撒卡蘭姆盾牌","Vortex Shield":"旋風盾","Preserved Head":"保存頭顱","Zombie Head":"殭屍頭顱","Unraveller Head":"解縛者頭顱","Gargoyle Head":"石像鬼頭顱","Demon Head":"惡魔之首","Mummified Trophy":"木乃伊獎章","Fetish Trophy":"妖人獎章","Sexton Trophy":"助祭獎章","Cantor Trophy":"領唱者印記","Hierophant Trophy":"祭司印記","Minion Skull":"僕從骷髏","Hellspawn Skull":"地獄之子骷髏","Overseer Skull":"督軍骷髏","Succubus Skull":"女妖之骨","Bloodlord Skull":"血王之骨","Leather Gloves":"皮手套","Heavy Gloves":"重手套","Chain Gloves":"鎖鍊手套","Light Gauntlets":"輕型鐵手套","Gauntlets":"鐵手套","Demonhide Gloves":"魔皮手套","Sharkskin Gloves":"鯊魚皮套","Heavy Bracers":"重型手鐲","Battle Gauntlets":"戰場手套","War Gauntlets":"巨戰手套","Bramble Mitts":"荊棘連指手套","Vampirebone Gloves":"吸血鬼骸骨手套","Vambraces":"吸血鬼手套","Crusader Gauntlets":"十字軍鐵手套","Ogre Gauntlets":"食人魔鐵手套","Boots":"靴子","Heavy Boots":"重靴","Chain Boots":"鎖鍊靴","Light Plated Boots":"輕型金屬靴","Greaves":"護脛","Demonhide Boots":"魔皮靴","Sharkskin Boots":"鯊皮之靴","Mesh Boots":"織網之靴","Battle Boots":"戰場之靴","War Boots":"巨戰之靴","Wyrmhide Boots":"龍皮靴","Scarabshell Boots":"聖甲蟲殼靴","Boneweave Boots":"骸骨靴","Mirrored Boots":"鏡面靴","Myrmidon Greaves":"極速靴","Sash":"飾帶","Light Belt":"輕扣帶","Belt":"腰帶","Heavy Belt":"重扣帶","Plated Belt":"金屬扣帶","Demonhide Sash":"魔皮勳帶","Sharkskin Belt":"鯊皮腰帶","Mesh Belt":"織網腰帶","Battle Belt":"戰場腰帶","War Belt":"巨戰腰帶","Spiderweb Sash":"蛛網腰帶","Vampirefang Belt":"吸血鬼燎牙腰帶","Mithril Coil":"秘銀腰帶","Troll Belt":"洞穴巨魔腰帶","Colossus Girdle":"巨神腰帶","Hand Axe":"手斧","Axe":"斧","Double Axe":"雙刃斧","Military Pick":"軍用鎬","War Axe":"巨戰斧","Large Axe":"巨斧","Broad Axe":"闊斧","Battle Axe":"戰鬥斧","Great Axe":"卓越之斧","Giant Axe":"大斧","Hatchet":"小斧","Cleaver":"切肉斧","Twin Axe":"強化雙斧","Crowbill":"鴉喙斧","Naga":"納卡","Military Axe":"軍斧","Bearded Axe":"鬚斧","Tabar":"戰鬥斧","Gothic Axe":"哥德之斧","Ancient Axe":"古代之斧","Tomahawk":"戰鉞","Small Crescent":"小新月斧","Ettin Axe":"雙頭斧","War Spike":"戰刺","Berserker Axe":"狂戰士斧","Feral Axe":"猛禽斧","Silver-edged Axe":"銀刃斧","Decapitator":"斬首斧","Champion Axe":"豪傑斧","Glorious Axe":"榮光之斧","Wand":"法杖","Yew Wand":"紫杉之杖","Bone Wand":"骨杖","Grim Wand":"殘酷之杖","Burnt Wand":"燒焦之杖","Petrified Wand":"淨化之杖","Tomb Wand":"古墓之杖","Grave Wand":"墓地之杖","Polished Wand":"拋光魔杖","Ghost Wand":"鬼魂法杖","Lich Wand":"巫妖法杖","Unearthed Wand":"破隱法杖","Club":"木棒","Spiked Club":"尖刺棍棒","Mace":"釘頭錘","Morning Star":"流星鎚","Flail":"連枷","War Hammer":"巨戰鐵鎚","Maul":"撞槌","Great Maul":"巨槌","Cudgel":"棍棒","Barbed Club":"倒鉤棍","Flanged Mace":"凸緣釘頭錘","Jagged Star":"鋸齒流星鎚","Knout":"鐵皮鞭","Battle Hammer":"戰鬥鐵鎚","War Club":"戰棍","Martel de Fer":"鐵錘","Truncheon":"戰儀杖","Tyrant Club":"暴君棍","Reinforced Mace":"強化釘頭錘","Devil Star":"惡魔流星錘","Scourge":"天罰之錘","Legendary Mallet":"傳說之鎚","Ogre Maul":"食人魔大槌","Thunder Maul":"雷霆大槌","Scepter":"權杖","Grand Scepter":"雄偉權杖","War Scepter":"巨戰權杖","Rune Scepter":"符文權杖","Holy Water Sprinkler":"聖水噴杖","Divine Scepter":"神屬權杖","Mighty Scepter":"強威權杖","Seraph Rod":"熾天使之杖","Caduceus":"神使之杖","Short Sword":"短劍","Scimitar":"彎刀","Sabre":"軍刀","Falchion":"彎劍","Crystal Sword":"水晶劍","Broad Sword":"闊劍","Long Sword":"長劍","War Sword":"巨戰之劍","Two-Handed Sword":"雙手劍","Claymore":"雙刃大刀","Giant Sword":"大劍","Bastard Sword":"雜種劍","Flamberge":"焰形劍","Great Sword":"卓越之劍","Gladius":"羅馬短劍","Cutlass":"微彎劍","Shamshir":"波斯彎刀","Tulwar":"印度彎刀","Dimensional Blade":"空間之刃","Battle Sword":"戰鬥劍","Rune Sword":"符文劍","Ancient Sword":"古代之劍","Espandon":"斬鐵劍","Dacian Falx":"雙刃鐮","Tusk Sword":"長牙劍","Gothic Sword":"哥德劍","Zweihander":"雙手巨劍","Executioner Sword":"死刑之劍","Falcata":"短劍","Ataghan":"土耳其劍","Elegant Blade":"優雅之刃","Hydra Edge":"九頭蛇之刃","Phase Blade":"幻化之刃","Conquest Sword":"征服之劍","Cryptic Sword":"神秘之劍","Mythical Sword":"秘儀之劍","Legend Sword":"傳奇之劍","Highland Blade":"高地之刃","Balrog Blade":"炎魔之刃","Champion Sword":"冠軍之劍","Colossus Sword":"巨神之劍","Colossus Blade":"巨神之刃","Dagger":"匕首","Dirk":"短刀","Kris":"波刃短劍","Blade":"短刀","Poignard":"銳匕","Rondel":"圓盤匕首","Cinquedeas":"五指劍","Stiletto":"細劍","Bone Knife":"骸骨小刀","Mithril Point":"秘銀尖刺","Fanged Knife":"尖牙刀","Legend Spike":"傳說尖刺","Throwing Knife":"飛刀","Throwing Axe":"飛斧","Balanced Knife":"平衡飛刀","Balanced Axe":"平衡斧","Battle Dart":"戰鬥飛鏢","Francisca":"法蘭飛斧","War Dart":"戰爭飛鏢","Hurlbat":"短戰戟","Flying Knife":"飛刀","Flying Axe":"飛斧","Winged Knife":"翼形刀","Winged Axe":"翼斧","Javelin":"標槍","Pilum":"短鏢槍","Short Spear":"短矛","Glaive":"大長刀","Throwing Spear":"飛矛","War Javelin":"戰爭標槍","Great Pilum":"卓越標槍","Simbilan":"銳矛","Spiculum":"尖頭標槍","Harpoon":"魚叉","Hyperion Javelin":"亥伯龍標槍","Stygian Pilum":"冥河標槍","Balrog Spear":"炎魔長矛","Ghost Glaive":"鬼魂尖槍","Winged Harpoon":"翼魚叉","Spear":"長矛","Trident":"三叉戟","Brandistock":"藏刃矛","Spetum":"三刃矛","Pike":"矛","War Spear":"巨戰長矛","Fuscina":"海神叉","War Fork":"戰叉","Yari":"日本槍","Lance":"長槍","Hyperion Spear":"亥伯龍之矛","Stygian Pike":"冥河長槍","Mancatcher":"捕人叉","Ghost Spear":"幽靈長矛","War Pike":"戰槍","Bardiche":"大砍刀","Voulge":"鉤鐮","Scythe":"鐮刀","Poleaxe":"長柄戰斧","Halberd":"長戟","War Scythe":"戰爭鐮刀","Lochaber Axe":"羅佳伯斧","Bill":"鉤刀","Battle Scythe":"戰鬥鐮刀","Partizan":"闊頭槍","Bec-de-Corbin":"雙鋒戰戟","Grim Scythe":"陰森鐮刀","Ogre Axe":"食人魔之斧","Colossus Voulge":"巨神鉤鐮","Thresher":"打穀者","Cryptic Axe":"神秘之斧","Great Poleaxe":"巨長斧","Giant Thresher":"巨型打穀者","Short Staff":"短棍","Long Staff":"長棍","Gnarled Staff":"多節棍","Battle Staff":"戰鬥法杖","War Staff":"巨戰法杖","Jo Staff":"喬木棒","Quarterstaff":"長棍","Cedar Staff":"杉木棍","Gothic Staff":"哥德之棍","Rune Staff":"符文之棍","Walking Stick":"手杖","Stalagmite":"鐘乳石之杖","Elder Staff":"長老之杖","Shillelagh":"樹皮之杖","Archon Staff":"執政官之杖","Short Bow":"短弓","Hunter's Bow":"獵弓","Long Bow":"長弓","Composite Bow":"組合弓","Short Battle Bow":"短戰鬥弓","Long Battle Bow":"長戰鬥弓","Short War Bow":"短巨戰弓","Long War Bow":"長巨戰弓","Edge Bow":"鋒銳之弓","Razor Bow":"剃刀之弓","Cedar Bow":"杉木弓","Double Bow":"雙弓","Short Siege Bow":"短攻城弓","Large Siege Bow":"長攻城弓","Rune Bow":"符文之弓","Gothic Bow":"哥德弓","Spider Bow":"蜘蛛弓","Blade Bow":"刀鋒弓","Shadow Bow":"陰影弓","Great Bow":"巨弓","Diamond Bow":"鑽石弓","Crusader Bow":"十字軍弓","Ward Bow":"庇護之弓","Hydra Bow":"九頭蛇弓","Light Crossbow":"輕十字弓","Crossbow":"十字弓","Heavy Crossbow":"重十字弓","Repeating Crossbow":"連發十字弓","Arbalest":"石弓","Siege Crossbow":"攻城十字弓","Ballista":"弩弓","Chu-Ko-Nu":"諸葛連弩","Pellet Bow":"彈丸弓","Gorgon Crossbow":"蛇髮女妖十字弓","Colossus Crossbow":"巨神十字弓","Demon Crossbow":"惡魔十字弓","Katar":"拳劍","Wrist Blade":"腕刃","Hatchet Hands":"斧手","Cestus":"腰刀","Claws":"爪","Blade Talons":"刃爪","Scissors Katar":"剪咬刃","Quhab":"格鬥刃","Wrist Spike":"腕刺","Fascia":"格鬥爪","Hand Scythe":"手鐮","Greater Claws":"巨爪","Greater Talons":"巨鷹爪","Scissors Quhab":"剪刃庫哈布","Suwayyah":"近身刃","Wrist Sword":"腕劍","War Fist":"戰拳","Battle Cestus":"鬥腰刀","Feral Claws":"猛禽爪","Runic Talons":"符紋爪","Scissors Suwayyah":"近身剪","Eagle Orb":"鷹之法珠","Sacred Globe":"神聖法球","Smoked Sphere":"煙霧法珠","Clasped Orb":"扣環法珠","Jared's Stone":"傑瑞德之石","Glowing Orb":"發光法珠","Crystalline Globe":"水晶法球","Cloudy Sphere":"雲霧法珠","Sparkling Ball":"閃耀水晶球","Swirling Crystal":"渦流水晶","Heavenly Stone":"天堂之石","Eldritch Orb":"怪異之球","Demon Heart":"惡魔之心","Vortex Orb":"漩渦球","Dimensional Shard":"次元碎片","Stag Bow":"男性之弓","Reflex Bow":"反射之弓","Maiden Spear":"少女之矛","Maiden Pike":"少女長槍","Maiden Javelin":"女士標槍","Ashwood Bow":"灰木之弓","Ceremonial Bow":"祭典之弓","Ceremonial Spear":"儀式之矛","Ceremonial Pike":"祭典之長矛","Ceremonial Javelin":"祭典之 標 槍","Matriarchal Bow":"女族長之弓","Grand Matron Bow":"大院長之弓","Matriarchal Spear":"女族長之矛","Matriarchal Pike":"族長長槍","Matriarchal Javelin":"女族長之 標 槍","Rogue's Bow":"蘿格之弓","Valkyrie Wing":"女神之翼","Undead Crown":"不死皇冠","Arch-Angel's Wing":"大天使之翼","Healing Potion":"治療藥水","Mana Potion":"法力藥水","Rejuvenation Potion":"回復藥水","Full Rejuvenation Potion":"全面回復藥水","Scroll of Town Portal":"城鎮傳送卷軸","Tome of Town Portal":"城鎮傳送之書","Gold":"金幣","Small Charm":"小護身符","Chipped":"碎裂的","Flawed":"瑕疵的","Flawless":"無瑕的","Perfect":"完美的","Amethyst":"紫寶石","Topaz":"黃寶石","Sapphire":"蔚藍","Emerald":"祖母綠","Ruby":"紅寶石","Diamond":"鑽石","Skull":"骷髏","Azurewrath":"蒼怒","Bladebone":"刃骨","Bloodfist":"血拳","Bloodrise":"血湧","Boneflame":"骨焰","Bonehew":"砍骨","Boneshade":"骨影","Brainhew":"碎腦","Crushflange":"碎骨錘","Culwen's Point":"庫爾溫的尖端","Deathbit":"死亡之刺","Deathspade":"死亡之鏟","Axe of Fechmar":"費屈瑪之斧","Felloak":"倒橡","Frostburn":"霜燒","Ghostflame":"鬼焰","Goldwrap":"金色包裹","Gorefoot":"血足","Gravenspine":"墳脊","Greyform":"灰形","Griswold's Edge":"格里斯瓦得的銳利","Hellcast":"地獄鑄","Hellclap":"地獄霹靂","Hellplague":"地獄瘟疫","Hellrack":"地獄架","Hotspur":"馬刺","Howltusk":"嚎牙","Iceblink":"冰眨","Ironstone":"鐵石","Lightsabre":"光劍","Magefist":"法師之拳","Nagelring":"納格戒指","Nightsmoke":"夜煙","Ormus' Robes":"奧瑪斯的長袍","Pluckeye":"挖眼","Rakescar":"耙疤","Ravenlore":"鴉之傳說","Razortail":"剃刀之尾","Rockfleece":"岩羊毛","Rusthandle":"鏽柄","Saracen's Chance":"薩拉森的機會","Shadowfang":"影牙","Snakecord":"蛇索","Soulflay":"剝魂","Spineripper":"裂脊","Stealskull":"竊顱","Steelclash":"鋼擊","Steelrend":"裂鋼","Stoneraven":"石鴉","Stormeye":"風暴之眼","Stormguild":"風暴之會","Stormspike":"風暴之刺","Stormstrike":"風暴之擊","Stormtree":"風暴之樹","Tearhaunch":"撕腿","Thunderstroke":"雷擊","Toothrow":"齒列","Twitchthroe":"抽搐","Witherstring":"枯弦","Wizardspike":"巫師之刺","Woestave":"悲哀之杖","Wolfhowl":"狼嚎","Blastbark":"爆樹皮","Beetleburst":"甲蟲爆裂","Bladebuckle":"刃扣","Metalgrid":"金屬網格","Leadcrow":"鉛鴉","Hellmouth":"地獄之口","Maelstrom":"大漩渦","Lacerator":"撕裂者","Widowmaker":"寡婦製造者","Chance Guards":"運氣守護","Hand of Blessed Light":"祝福之光之手","Amber":"琥珀","Arcing":"彎曲","Azure":"天青","Bahamut's":"巴哈姆特的","Beryl":"海藍","Blessed":"祝福的","Boreal":"北風","Bronze":"青銅","Brutal":"野蠻的","Buzzing":"嗡鳴的","Chromatic":"彩色的","Cobalt":"鈷","Coral":"珊瑚","Corosive":"腐蝕的","Crimson":"棗紅","Cruel":"殘酷的","Deadly":"致命的","Dragon's":"龍的","Drake's":"飛龍的","Ember":"餘燼的","Envenomed":"淬毒的","Felicitous":"幸運的","Ferocious":"殘暴的","Fine":"精良","Flaming":"燃燒","Fortuitous":"偶然的","Garnet":"深紅","Glimmering":"微光的","Glorious":"光榮的","Glowing":"發光","Godly":"如神的","Grandmaster's":"大宗師的","Great Wyrm's":"巨龍的","Hibernal":"冬季的","Holy":"神聖的","Iron":"鐵","Jade":"翠綠","Jagged":"鋸齒","King's":"國王的","Knight's":"騎士的","Lapis":"天藍","Lizard's":"蜥蜴","Lord's":"領主的","Massive":"巨大的","Master's":"大師","Merciless":"無情的","Meteoric":"流星的","Mnemonic":"記憶的","Ocher":"赭色的","Pestilent":"瘟疫","Platinum":"白金","Prismatic":"稜鏡的","Rainbow":"彩虹的","Russet":"赤褐","Saintly":"聖潔的","Savage":"凶猛的","Scintillating":"閃爍的","Scorching":"灼熱的","Septic":"腐敗","Serpent's":"海蛇","Sharp":"尖銳","Shimmering":"閃耀","Shivering":"顫抖","Shocking":"震撼","Silver":"白銀的","Smoking":"煙霧","Smoldering":"悶燒","Snake's":"蛇","Snowflake":"雪花的","Soldier's":"士兵的","Static":"靜態","Steel":"鋼","Strange":"奇異的","Strong":"強壯的","Sturdy":"堅固的","Tangerine":"紅柑","Toxic":"劇毒","Vicious":"惡毒的","Viridian":"銘綠","Warrior's":"戰士的","Weird":"怪異的","Wyrm's":"巨龍的","of Chance":"機運之","of Dexterity":"敏捷之","of Energy":"精力之","of Fire":"火焰之","of Health":"健康之","of Life":"生命之","of Life Everlasting":"永生之","of Lightning":"閃電之","of Skill":"技巧之","of Speed":"速度之","of Strength":"力量之","Gloom":"陰鬱","Gray":"灰色","Dire":"恐怖","Black":"黑色","Shadow":"暗影","Haze":"迷霧","Wind":"疾風","Storm":"風暴","Warp":"扭曲","Night":"暗夜","Moon":"月亮","Star":"星辰","Pit":"深坑","Flame":"火焰","Ice":"寒冰","Seethe":"沸騰","Ash":"灰燼","Stone":"岩石","Rust":"鐵鏽","Mold":"黴菌","Blight":"枯萎","Plague":"瘟疫","Rot":"腐爛","Ooze":"軟泥","Puke":"嘔吐","Snot":"鼻涕","Bile":"膽汁","Blood":"鮮血","Pulse":"脈動","Gut":"腸","Gore":"血腥","Flesh":"血肉","Bone":"骨","Spine":"脊椎","Mind":"心智","Spirit":"靈魂","Soul":"魂","Wrath":"憤怒","Grief":"悲傷","Foul":"污穢","Vile":"邪惡","Sin":"罪","Chaos":"混沌","Dread":"恐懼","Doom":"末日","Bane":"災禍","Death":"死亡","Viper":"毒蛇","Dragon":"龍","Devil":"惡魔","Touch":"之觸","Spell":"咒語","Feast":"盛宴","Wound":"創傷","Grin":"獰笑","Maim":"致殘","Hack":"劈砍","Bite":"之咬","Rend":"撕裂","Burn":"灼燒","Ripper":"撕裂者","Kill":"殺戮","Call":"呼喚","Vex":"煩擾","Web":"之網","Killer":"殺手","Razor":"剃刀","Drinker":"飲者","Shifter":"變形者","Crawler":"爬行者","Dancer":"舞者","Bender":"扭曲者","Weaver":"編織者","Eater":"吞噬者","Widow":"寡婦","Maggot":"蛆","Spawn":"之子","Wight":"屍妖","Grumble":"咕噥","Growler":"咆哮者","Snarl":"咆哮","Wolf":"狼","Crow":"烏鴉","Hawk":"鷹","Cloud":"雲","Bang":"轟","Head":"頭","Brow":"眉","Eye":"之眼","Maw":"巨口","Tongue":"舌","Fang":"尖牙","Horn":"號角","Thorn":"荊棘","Claw":"爪","Fist":"拳","Heart":"之心","Shank":"脛","Skin":"之皮","Wing":"之翼","Pox":"痘","Fester":"潰爛","Blister":"水泡","Pus":"膿","Slime":"黏液","Drool":"口水","Froth":"泡沫","Sludge":"淤泥","Poison":"毒","Break":"破碎","Shard":"碎片","Thirst":"之渴","Lust":"慾望","Beast":"野獸","Eagle":"鷹","Ghoul":"食屍鬼","Grim":"陰森","Rune":"符文","Wraith":"幽魂","Pain":"痛苦","Havoc":"浩劫","Gale":"狂風","Brimstone":"硫磺","Vengeance":"復仇","Badge":"徽章","Band":"指環","Beads":"念珠","Branch":"枝","Buckle":"扣環","Carapace":"甲殼","Clasp":"扣","Clutches":"爪握","Coat":"外衣","Coil":"盤繞","Collar":"項圈","Cord":"繩","Cowl":"兜帽","Crack":"裂痕","Crest":"頂飾","Cry":"哭號","Dart":"飛鏢","Edge":"之刃","Emblem":"紋章","Finger":"指","Fletch":"箭羽","Flight":"飛翔","Gnarl":"節瘤","Goad":"刺棒","Gorget":"護頸","Grip":"握","Guard":"守衛","Gutter":"溝","Gyre":"旋轉","Hand":"之手","Hew":"砍","Hide":"皮","Hold":"掌握","Hood":"兜帽","Jack":"夾克","Knell":"喪鐘","Knot":"結","Knuckle":"指節","Lash":"鞭","Lock":"鎖","Loop":"環","Mallet":"木槌","Mangler":"絞肉者","Mantle":"披風","Mark":"印記","Nails":"之釘","Necklace":"項鍊","Needle":"針","Nock":"箭扣","Noose":"絞索","Pelt":"毛皮","Prod":"戳刺","Quarrel":"弩箭","Quill":"羽刺","Road":"之路","Saw":"鋸","Scalpel":"手術刀","Scarab":"聖甲蟲","Scratch":"抓痕","Shroud":"裹屍布","Slippers":"拖鞋","Smasher":"粉碎者","Song":"之歌","Sphere":"球","Spike":"尖刺","Spiral":"螺旋","Spire":"尖塔","Splitter":"劈裂者","Spur":"馬刺","Stake":"木樁","Stalk":"莖","Stinger":"螫刺","Strap":"皮帶","Suit":"套裝","Sunder":"分裂","Talisman":"護符","Torc":"金屬項圈","Tower":"高塔","Track":"足跡","Trample":"踐踏","Turn":"轉折","Veil":"面紗","Visage":"面容","Wrack":"毀滅","Chant":"頌歌","Blazer":"烈焰","Abaddon":"亞巴頓","Abominable":"可憎雪人","Abyss Knight":"深淵騎士","Afflicted":"受折磨者","Apparition":"幻影","Arach":"阿拉克蛛","Arcane":"秘法","Assailant":"襲擊者","Axe Dweller":"斧居者","Balrog":"炎魔","Barracks":"兵營","Bishibosh":"比西博什","Black Archer":"黑暗弓箭手","Black Lancer":"黑暗槍兵","Black Locusts":"黑蝗蟲","Black Raptor":"黑猛禽","Black Raptor Nest":"黑猛禽巢","Black Rogue":"黑暗羅格","Black Soul":"黑魂","Blaze Ripper":"烈焰撕裂者","Blood Boss":"血頭目","Blood Bringer":"帶血者","Blood Clan":"血族","Blood Diver":"血潛者","Blood Hawk Nest":"血鷹巢","Blood Lord":"血王","Blood Maggot":"血蛆","Blood Maggot Egg":"血蛆卵","Blood Maggot Young":"幼血蛆","Blood Temptress":"血之誘惑者","Blood Wing":"血翼","Blunderbore":"笨熊巨人","Bog Creature":"沼澤生物","Bone Archer":"骷髏弓箭手","Bone Ash":"骨灰","Bone Mage":"骷髏法師","Bone Scarab":"骨甲蟲","Bone Warrior":"骷髏戰士","Bonebreaker":"碎骨者","Bramble Hulk":"荊棘巨人","Brute":"野獸人","Burning Dead":"燃燒亡者","Burning Dead Archer":"燃燒亡者弓箭手","Burning Dead Mage":"燃燒亡者法師","Burning Soul":"燃燒之魂","Cadaver":"屍體","Cantor":"吟唱者","Carrion Bird":"腐肉鳥","Carver":"雕刻者","Carver Shaman":"雕刻者薩滿","Cave Leaper":"洞穴跳躍者","Claw Viper":"利爪蝮蛇","Cliff Lurker":"懸崖潛伏者","Cloud Stalker":"雲中追蹤者","Coldcrow":"寒鴉","Corpse Spitter":"屍體噴吐者","Corpsefire":"屍火","Corpulent":"肥胖者","Council Member":"議會成員","Crush Beast":"粉碎獸","Crusher":"粉碎者","Damned":"被詛咒者","Dark Archer":"黑暗弓箭手","Dark Familiar":"黑暗使魔","Dark Hunter":"黑暗獵手","Dark Lancer":"黑暗槍兵","Dark Lord":"黑暗領主","Dark One":"黑暗者","Dark Ranger":"黑暗遊俠","Dark Shaman":"黑暗薩滿","Dark Shape":"黑暗之形","Dark Spearwoman":"黑暗女槍兵","Dark Stalker":"黑暗追蹤者","Darkwing":"暗翼","Death Beetle":"死亡甲蟲","Death Berserker":"死亡狂戰士","Death Brawler":"死亡鬥士","Death Brigadier":"死亡准將","Death Clan":"死亡氏族","Death Lord":"死亡領主","Death Mauler":"死亡重擊者","Death Slasher":"死亡斬擊者","Decayed":"腐朽者","Defiled Warrior":"褻瀆戰士","Demon Gremlin":"惡魔小鬼","Demon Imp":"惡魔小惡魔","Demon Rascal":"惡魔搗蛋鬼","Demon Sprite":"惡魔精靈","Demon Trickster":"惡魔騙子","Desert Wing":"沙漠之翼","Devilkin":"小惡魔","Devilkin Shaman":"小惡魔薩滿","Devourer":"吞噬者","Devourer Egg":"吞噬者卵","Devourer Young":"幼吞噬者","Disfigured":"毀容者","Doom Ape":"末日猿","Doom Caster":"末日施法者","Doom Knight":"末日騎士","Dried Corpse":"乾屍","Drowned Carcass":"溺斃的屍骸","Dune Beast":"沙丘獸","Dung Soldier":"糞甲蟲戰士","Embalmed":"防腐屍","Enslaved":"被奴役者","Faithful":"信徒","Fallen":"沉淪魔","Fallen Shaman":"沉淪魔巫師","Fangskin":"牙皮","Feeder":"進食者","Fetid Defiler":"惡臭褻瀆者","Fetish":"妖人","Fetish Shaman":"妖人薩滿","Fiend":"惡魔","Fire Boar":"火焰野豬","Flame Spider":"火焰蜘蛛","Flamespike the Crawler":"爬行者焰刺","Flayer":"剝皮者","Flayer Shaman":"剝皮者薩滿","Flesh Archer":"血肉弓箭手","Flesh Beast":"血肉獸","Flesh Hunter":"血肉獵手","Flesh Spawner":"血肉產卵者","Foul Crow":"污穢烏鴉","Foul Crow Nest":"污穢烏鴉巢","Frenzied Ice Spawn":"狂暴冰之子","Frozen Creeper":"冰凍爬行者","Frozen Scourge":"冰凍天譴","Frozen Terror":"冰凍恐懼","Frozenstein":"冰凍怪","Gargantuan Beast":"巨型野獸","Ghost":"鬼魂","Ghoul Lord":"食屍鬼領主","Giant Lamprey":"巨型七鰓鰻","Giant Lamprey Egg":"巨型七鰓鰻卵","Giant Lamprey Young":"幼巨型七鰓鰻","Gloam":"暮光","Gloombat":"陰鬱蝙蝠","Grotesque":"怪誕者","Grotesque Wyrm":"怪誕巨蟲","Guardian":"守衛者","Gull":"海鷗","Greater Hell Spawn":"大地獄之子","Heirophant":"祭司長","Hell Bovine":"地獄牛","Hell Buzzard":"地獄禿鷹","Hell Cat":"地獄貓","Hell Clan":"地獄氏族","Hell Lord":"地獄領主","Hell Slinger":"地獄投石者","Hell Spawn":"地獄之子","Hell Swarm":"地獄蟲群","Hell Temptress":"地獄誘惑者","Hell Whip":"地獄之鞭","Hell Witch":"地獄女巫","Hell's Belle":"地獄美人","Hollow One":"空洞者","Homunculus":"人造人","Horadrim Ancient":"赫拉迪姆先祖","Horror":"恐怖骷髏","Horror Archer":"恐怖弓箭手","Horror Mage":"恐怖法師","Humongous":"龐然巨人","Hungry Dead":"飢餓亡者","Huntress":"女獵手","Ice Boar":"冰霜野豬","Ice Spawn":"冰之子","Infidel":"異教徒","Invader":"入侵者","Itchies":"癢蟲","Jungle Hunter":"叢林獵手","Korlic":"科力克","Lasher":"鞭打者","Leaper":"跳躍者","Leviathan":"利維坦","Madawc":"馬道克","Marauder":"掠奪者","Mauler":"重擊者","Maw Fiend":"巨口惡魔","Minion of Destruction":"毀滅之僕","Misshapen":"畸形者","Moon Clan":"月之氏族","Moon Lord":"月之領主","Night Clan":"夜之氏族","Night Lord":"夜之領主","Night Marauder":"夜之掠奪者","Night Slinger":"夜之投石者","Night Tiger":"夜虎","Oblivion Knight":"遺忘騎士","Overlord":"霸主","Overseer":"督軍","Pindleskin":"暴躁外皮","Pit Lord":"深坑領主","Pit Viper":"深坑毒蛇","Pitspawn Fouldog":"深坑污犬","Plague Bearer":"疫病帶原者","Poison Spinner":"毒紡者","Preserved Dead":"保存的亡者","Prowling Dead":"徘徊亡者","Putrid Defiler":"腐爛褻瀆者","Radament":"拉達曼特","Rakanishu":"拉卡尼休","Rancid Defiler":"腐臭褻瀆者","Rat Man":"鼠人","Razor Spine":"剃刀脊","Reanimated Horde":"復甦部眾","Returned":"歸來者","Returned Archer":"歸來弓箭手","Returned Mage":"歸來法師","Riftwraith the Cannibal":"食人者裂隙幽魂","Rock Worm":"岩蟲","Rock Worm Egg":"岩蟲卵","Rock Worm Young":"幼岩蟲","Rot Walker":"腐行者","Saber Cat":"劍齒貓","Salamander":"火蜥蜴","Sand Leaper":"沙地跳躍者","Sand Maggot":"沙蛆","Sand Maggot Egg":"沙蛆卵","Sand Maggot Queen":"沙蛆女王","Sand Maggot Young":"幼沙蛆","Sand Raider":"沙漠掠奪者","Serpent Magus":"巨蛇法師","Sexton":"教堂司事","Siege Beast":"攻城獸","Siren":"海妖","Skeleton":"骷髏","Skeleton Archer":"骷髏弓箭手","Slayer":"殺戮者","Slime Prince":"黏液王子","Slinger":"投石者","Snow Drifter":"雪中漂泊者","Soul Killer":"靈魂殺手","Soul Killer Shaman":"靈魂殺手薩滿","Spear Cat":"標槍貓","Specter":"幽靈","Spider Magus":"蜘蛛法師","Spike Fiend":"尖刺惡魔","Steel Scarab":"鋼鐵甲蟲","Storm Caster":"風暴施法者","Strangler":"絞殺者","Stygian Dog":"冥河犬","Stygian Doll":"冥河玩偶","Stygian Fury":"冥河狂怒","Stygian Hag":"冥河女巫","Stygian Harlot":"冥河娼婦","Succubus":"魅魔","Sucker":"吸血者","Swamp Dweller":"沼澤居民","Taintbreeder":"污染繁殖者","Tainted":"受污染者","Talic":"塔力克","Temple Guard":"神殿守衛","The Banished":"被放逐者","The Tormentor":"折磨者","Thorn Beast":"荊棘獸","Thorned Hulk":"荊棘巨人","Thrasher":"鞭打者","Tomb Creeper":"墓穴爬行者","Tomb Viper":"墓穴毒蛇","Tree Lurker":"樹林潛伏者","Undead Flayer":"不死剝皮者","Undead Scavenger":"不死食腐者","Undead Soul Killer":"不死靈魂殺手","Undead Stygian Doll":"不死冥河玩偶","Unholy Corpse":"邪惡屍體","Unraveler":"解縛者","Urdar":"烏達","Venom Lord":"毒液領主","Vile Archer":"邪惡弓箭手","Vile Hunter":"邪惡獵手","Vile Lancer":"邪惡槍兵","Vile Temptress":"邪惡誘惑者","Vile Witch":"邪惡女巫","Vinvear Molech":"文維爾·莫洛克","Wailing Beast":"哀嚎獸","Warped One":"扭曲者","Warped Shaman":"扭曲薩滿","Winged Nightmare":"有翼夢魘","Wretched Defiler":"可悲褻瀆者","Yeti":"雪人","Zakarumite":"撒卡蘭姆信徒","Zealot":"狂熱者","Zombie":"殭屍","Goatman":"山羊人","Quill Rat":"刺鼠","Corrupt Rogue":"墮落羅格","Megademon":"巨型惡魔","Regurgitator":"反芻者","Succubus Witch":"魅魔女巫","Minion":"僕從","Ancient Tunnels":"古代通道","Arachnid Lair":"蜘蛛巢穴","Burial Grounds":"墓地","Canyon of the Magi":"眾法師之谷","Catacombs Level 1":"地下墓穴第 1 層","Catacombs Level 2":"地下墓穴第 2 層","Catacombs Level 3":"地下墓穴第 3 層","Cathedral":"大教堂","Causeway":"堤道","Cave Level 1":"洞穴第 1 層","Cave Level 2":"洞穴第 2 層","Claw Viper Temple Level 1":"利爪蝮蛇神殿第 1 層","Claw Viper Temple Level 2":"利爪蝮蛇神殿第 2 層","Crypt":"地穴","Desert":"沙漠","Disused Fane":"廢棄神廟","Disused Reliquary":"廢棄聖骨箱","Drifter Cavern":"漂流者洞穴","Durance":"囚牢","Durance of Hate Level 1":"憎恨囚牢第 1 層","Durance of Hate Level 2":"憎恨囚牢第 2 層","Flayer Dungeon Level 1":"剝皮者地牢第 1 層","Flayer Dungeon Level 2":"剝皮者地牢第 2 層","Flayer Dungeon Level 3":"剝皮者地牢第 3 層","Forgotten Reliquary":"被遺忘的聖骨箱","Forgotten Sands":"被遺忘的沙地","Forgotten Temple":"被遺忘的神殿","Frozen Abyss":"冰凍深淵","Furnace of Pain":"痛苦熔爐","Halls of Anguish":"苦惱大廳","Halls of Pain":"痛苦大廳","Halls of the Dead Level 1":"死亡大廳第 1 層","Halls of the Dead Level 2":"死亡大廳第 2 層","Halls of the Dead Level 3":"死亡大廳第 3 層","Harem Level 2":"後宮第 2 層","Hole Level 1":"地洞第 1 層","Hole Level 2":"地洞第 2 層","Icy Cellar":"冰冷地窖","Infernal Pit":"地獄深坑","Inner Cloister":"內修道院","Jail Level 1":"監獄第 1 層","Jail Level 2":"監獄第 2 層","Jail Level 3":"監獄第 3 層","Kurast":"庫拉斯特","Maggot Lair Level 1":"蛆蟲巢穴第 1 層","Maggot Lair Level 2":"蛆蟲巢穴第 2 層","Maggot Lair Level 3":"蛆蟲巢穴第 3 層","Matron's Den":"女族長之巢","Mausoleum":"陵墓","Monastery":"修道院","Moo Moo Farm":"哞哞農場","Nihlathak Temple":"尼拉塞克神殿","Outer Cloister":"外修道院","Palace Cellar Level 1":"宮殿地窖第 1 層","Palace Cellar Level 2":"宮殿地窖第 2 層","Palace Cellar Level 3":"宮殿地窖第 3 層","Pit Level 1":"地坑第 1 層","Pit Level 2":"地坑第 2 層","Pit of Acheron":"冥河之坑","Ruined Fane":"毀壞的神廟","Ruined Temple":"毀壞的神殿","Sewers Level 1":"下水道第 1 層","Sewers Level 2":"下水道第 2 層","Sewers Level 3":"下水道第 3 層","Spider Cavern":"蜘蛛洞穴","Stony Tomb Level 1":"石墓第 1 層","Stony Tomb Level 2":"石墓第 2 層","Swampy Pit Level 1":"沼澤地坑第 1 層","Swampy Pit Level 2":"沼澤地坑第 2 層","Swampy Pit Level 3":"沼澤地坑第 3 層","Tal Rasha's Chamber":"塔拉夏之室","The Ancients' Way":"先祖之路","The Chaos Sanctuary":"混沌避難所","Tomb":"古墓","Tower Cellar Level 1":"高塔地窖第 1 層","Tower Cellar Level 2":"高塔地窖第 2 層","Tower Cellar Level 3":"高塔地窖第 3 層","Tower Cellar Level 4":"高塔地窖第 4 層","Tower Cellar Level 5":"高塔地窖第 5 層","Tristram":"崔斯特姆","Underground Passage Level 1":"地下通道第 1 層","Underground Passage Level 2":"地下通道第 2 層","Worldstone Keep Level 1":"世界之石要塞第 1 層","Worldstone Keep Level 2":"世界之石要塞第 2 層","Worldstone Keep Level 3":"世界之石要塞第 3 層","Blood Moor":"鮮血荒地","Cold Plains":"冰冷之原","Stony Field":"石塊曠野","Dark Wood":"黑暗森林","Black Marsh":"黑色荒地","Tamoe Highland":"泰摩高地","Rocky Waste":"岩石荒地","Dry Hills":"乾燥高地","Far Oasis":"遙遠綠洲","Lost City":"遺忘之城","Valley of Snakes":"蛇谷","Absorbs Fire Damage":"吸收火焰傷害","Attacker Takes Damage of":"攻擊者受到傷害","Attacker Takes Lightning Damage of":"攻擊者受到閃電傷害","Better Chance of Getting Magic Items":"尋獲魔法物品機率提高","Bonus to Attack Rating":"攻擊準確率加成","Chance of Crushing Blow":"壓碎性打擊機率","Chance of Open Wounds":"撕裂傷口機率","Cold Absorb":"冰寒吸收","Fire Absorb":"火焰吸收","Lightning Absorb":"閃電吸收","Damage Reduced by":"傷害減少","Damage Taken Goes To Mana":"受到的傷害轉為法力","Damage to Demons":"對惡魔的傷害","Damage to Undead":"對不死生物的傷害","Defense vs. Missile":"對飛射物防禦","Drain Life":"吸取生命","Enhanced Maximum Damage":"增強最大傷害","Enhanced Minimum Damage":"增強最小傷害","Extra Gold from Monsters":"從怪物身上獲得額外金幣","Freezes target":"冰凍目標","Half Freeze Duration":"冰凍時間減半","Heal Stamina Plus":"耐力恢復加成","Hit Causes Monster to Flee":"擊中使怪物逃跑","Increase Maximum Mana":"提高法力上限","Increased Chance of Blocking":"提高格擋機率","Increased Stack Size":"提高堆疊數量","Life after each Demon Kill":"每殺死一隻惡魔恢復生命","Life after each Kill":"每次擊殺恢復生命","Magic Damage Reduced by":"魔法傷害減少","Maximum Stamina":"耐力上限","Piercing Attack":"穿透攻擊","Poison Length Reduced by":"中毒時間減少","Regenerate Mana":"法力恢復","Replenishes quantity":"補充數量","Slower Stamina Drain":"耐力消耗減緩","Slows Target by":"目標緩速","Target Defense":"目標防禦","to Amazon Skill Levels":"亞馬遜技能等級","to Attack Rating":"攻擊準確率","to Attack Rating against Demons":"對惡魔的攻擊準確率","to Attack Rating against Undead":"對不死生物的攻擊準確率","to Cold Skill Damage":"冰寒技能傷害","to Dexterity":"敏捷","to Enemy Fire Resistance":"敵人火焰抗性","to Enemy Lightning Resistance":"敵人閃電抗性","to Enemy Poison Resistance":"敵人毒素抗性","to Energy":"精力","to Fire Skill Damage":"火焰技能傷害","to Fire Skills":"火焰技能","to Life":"生命","to Light Radius":"照亮範圍","to Lightning Skill Damage":"閃電技能傷害","to Mana":"法力","to Mana after each Kill":"每次擊殺恢復法力","to Maximum Cold Damage":"最大冰寒傷害","to Maximum Damage":"最大傷害","to Maximum Fire Damage":"最大火焰傷害","to Maximum Fire Resist":"最大火焰抗性","to Maximum Lightning Damage":"最大閃電傷害","to Maximum Lightning Resist":"最大閃電抗性","to Maximum Poison Damage":"最大毒素傷害","to Maximum Poison Resist":"最大毒素抗性","to Minimum Cold Damage":"最小冰寒傷害","to Minimum Damage":"最小傷害","to Minimum Fire Damage":"最小火焰傷害","to Minimum Lightning Damage":"最小閃電傷害","to Minimum Poison Damage":"最小毒素傷害","to Monster Defense Per Hit":"每次擊中降低怪物防禦","to Strength":"力量","to Vitality":"體力","(Based on Character Level)":"（依角色等級）","Repairs %d durability per second":"每秒修復 %d 耐久度","Act I":"第一幕","ACT I":"第一幕","Act II":"第二幕","ACT II":"第二幕","Act III":"第三幕","ACT III":"第三幕","Act IV":"第四幕","ACT IV":"第四幕","Act V":"第五幕","ACT V":"第五幕","casts":"施放","cast":"施放","chills":"冰冷","chill":"冰冷","crawls":"爬行","crawl":"爬行","explodes":"爆炸","explode":"爆炸","hunts down its":"追擊","hunt down their":"追擊","it hits":"命中處","they hit":"命中處","it passes":"經過處","they pass":"經過處","pecks":"啄擊","peck":"啄擊","pierces":"穿透","pierce":"穿透","spirals":"盤旋","spiral":"盤旋","a bolt":"彈矢","a spark":"一道火花","an arrow":"箭矢","a fire arrow":"一支火焰箭","a magic arrow":"一支魔法箭","a hammer":"戰鎚","a javelin":"標槍","a kick":"一次踢擊","a skeleton":"一具骷髏","a swift blow":"一次快速攻擊","a twister":"一道扭曲旋風","a web":"一張網","a monster":"一隻怪物","Evolves":"進化","into":"為","also":"還","needs:":"需要：","Spells":"法術","Chain":"連鎖","Frozen":"冰封","Glacial":"冰河","Cold Spells":"冰寒法術","Lightning Spells":"閃電法術","Fire Spells":"火焰法術","Exit":"離開","EXIT":"離開","OK":"確定","Back":"返回","BACK":"返回","CANCEL":"取消","CONTINUE":"繼續","COPIED":"已複製","Copied":"已複製","Export":"匯出","Import":"匯入","Replace":"取代","UPDATES":"更新","LINK":"連結","OFF":"關","ON":"開","MUSIC":"音樂","SOUND":"音效","MUTE":"靜音","PREVIOUS HERO":"上一位英雄","INVENTORY":"物品欄","Inventory":"物品欄","Stash":"儲物箱","Shared Stash":"共用儲物箱","Skills":"技能","Passives":"被動技能","Upgrades":"升級","Items":"物品","Experience":"經驗值","Requirements":"需求","Repair":"修理","Sell":"出售","Buy":"購買","Reroll":"重抽","Skip":"略過","Banish":"放逐","Maxed":"已達上限","Choose":"選擇","Click":"點擊","Tap":"點一下","Enter":"Enter","Space":"空白鍵","Boss":"首領","Champion":"精英","Regular":"一般","Survivor":"倖存者","Strength":"力量","Dexterity":"敏捷","Vitality":"體力","Energy":"精力","Weapon":"武器","Armor":"盔甲","Shield":"盾牌","Gloves":"手套","Ring":"戒指","Amulet":"護身符","Damage":"傷害","Attack":"攻擊","Knockback":"擊退","Masteries":"專精","Warcries":"戰嚎","Curses":"詛咒","Traps":"陷阱","Barrel":"木桶","Urn":"甕","Brazier":"火盆","Corpse":"屍體","One hit":"一擊","Coming soon":"即將推出","Build complete":"建置完成","Not learned":"尚未習得","New skill":"新技能","New passive":"新被動技能","Empty skill slot":"空的技能欄","Empty passive slot":"空的被動欄","Skill Tree":"技能樹","Everything is maxed":"全部都已達上限","Nothing sold to buy back":"沒有可回購的物品","Put an item down on this panel":"把物品放到這個面板上","Shift-click an item, or put it down here":"Shift＋點擊物品，或放到這裡","Click a ware to buy it":"點擊貨品即可購買","Tap again for every skill":"再點一次檢視所有技能","Tap again to drop":"再點一次丟棄","Tap an item, then tap it again":"點選物品後再點一次","You do not have enough gold":"你的金幣不足","Your inventory is full":"你的物品欄已滿","Your inventory is full (C to make room)":"你的物品欄已滿（按 C 整理空間）","Your inventory is full (tap Character to make room)":"你的物品欄已滿（點「角色」整理空間）","Your stash is full":"你的儲物箱已滿","Slay the act boss to reach the next act":"擊敗本幕首領才能前往下一幕","Pick a card to banish it for this run":"選一張卡片，本輪將它放逐","Pick with 1–3 or click":"按 1～3 或點擊選擇","Arrows or drag to adjust - Esc to go back":"方向鍵或拖曳調整 - Esc 返回","Enter: play again - T: Charsi's wares - Esc: main menu":"Enter：再玩一次 - T：恰西的貨品 - Esc：主選單","← → to choose · Enter to continue · N for a new run":"← → 選擇 · Enter 繼續 · N 開始新的一輪","← → to choose · Enter to play":"← → 選擇 · Enter 開始遊戲","Charsi's wares (B)":"恰西的貨品（B）","Charsi's wares (G)":"恰西的貨品（G）","Making the code…":"正在產生代碼…","The highest level a hero can reach":"英雄能達到的最高等級","Taken: ":"已取得：",": stash it":"：放進儲物箱",": stash it at Charsi's":"：到恰西那裡放進儲物箱",", needs:":"，需要："," - ready to evolve":" - 可以進化","A hit, and a second:":"一擊，再一擊：","Heals 30 Life":"恢復 30 生命","Restores all Life":"恢復全部生命","Restores all life":"恢復全部生命","Regenerate 1 life per second":"每秒恢復 1 生命","Wirt's Leg + Tome of Town Portal":"維特之腳 ＋ 城鎮傳送之書","This browser's gold, upgrades and gear give way to the code's. Export them first to keep a copy.":"此瀏覽器的金幣、升級與裝備會被代碼內容取代。請先匯出保留一份。","Unofficial fan project. Not affiliated with or endorsed by Blizzard Entertainment. Diablo® is a trademark of Blizzard Entertainment, Inc.":"非官方粉絲作品，與 Blizzard Entertainment 無關，亦未獲其認可。Diablo® 為 Blizzard Entertainment, Inc. 的商標。","Unofficial fan project. Not affiliated with or endorsed by Blizzard Entertainment.":"非官方粉絲作品，與 Blizzard Entertainment 無關，亦未獲其認可。","Diablo® is a trademark of Blizzard Entertainment, Inc.":"Diablo® 為 Blizzard Entertainment, Inc. 的商標。","Blizzard Entertainment":"Blizzard Entertainment","Blizzard Entertainment, Inc":"Blizzard Entertainment, Inc","Diablo®":"Diablo®","Diablo®, Diablo II®, Lord of Destruction® and Blizzard Entertainment® are trademarks or registered trademarks of Blizzard Entertainment, Inc. in the U.S. and/or other countries. All Diablo II game content (graphics, sounds, music, fonts, text and data) is © Blizzard Entertainment, Inc. and remains their property.":"Diablo®、Diablo II®、Lord of Destruction® 與 Blizzard Entertainment® 為 Blizzard Entertainment, Inc. 在美國及／或其他國家的商標或註冊商標。所有 Diablo II 遊戲內容（圖像、音效、音樂、字型、文字與資料）版權歸 Blizzard Entertainment, Inc. 所有。","If you represent Blizzard Entertainment and want anything changed or removed, contact the maintainer through the repository and it will be addressed promptly, including taking the project down.":"若您代表 Blizzard Entertainment 並希望修改或移除任何內容，請透過程式庫聯絡維護者，我們會儘速處理，包括下架本專案。","This notice describes the project’s intent and policies. It is not legal advice.":"本聲明說明本專案的目的與政策，並非法律意見。","No Blizzard files are distributed":"不散布任何 Blizzard 的檔案","Bring your own Diablo II: nothing is downloaded from Blizzard, and the app holds no Blizzard file. On first launch it finds your Diablo II and Lord of Destruction and extracts their art and sound once, in about a minute and a half. From then on it plays offline.":"請使用你自己的 Diablo II：程式不會從 Blizzard 下載任何東西，也不含任何 Blizzard 檔案。第一次啟動時會找到你的 Diablo II 與毀滅之王，花約一分半鐘擷取一次圖像與音效，之後即可離線遊玩。","Diablo II and Lord of Destruction, patched to 1.14, installed\nmacOS on Apple silicon, or Windows 10 or 11 (x64)\nAbout 1.5 GB of free disk space":"已安裝 Diablo II 與毀滅之王，並更新至 1.14\nApple 晶片的 macOS，或 Windows 10／11（x64）\n約 1.5 GB 可用磁碟空間","If it can’t find Diablo II, point it at the folder that holds d2data.mpq.":"如果找不到 Diablo II，請指定含有 d2data.mpq 的資料夾。","Run the installer. It isn’t signed, so SmartScreen warns about it: click More info, then Run anyway. This build is new and not yet tested on a real PC.":"執行安裝程式。程式沒有數位簽章，SmartScreen 會跳出警告：請按「其他資訊」再按「仍要執行」。此版本是新版，尚未在實體電腦上測試過。","Made by framara - @framara on X":"製作：framara - X 上的 @framara","D2 SURVIVORS":"D2 SURVIVORS","Slain Monsters Rest in Peace":"被殺的怪物安息","on attack":"攻擊時","Armor Shrine":"護甲神殿","Combat Shrine":"戰鬥神殿","Experience Shrine":"經驗神殿","Exploding Shrine":"爆炸神殿","Fire Shrine":"火焰神殿","Gem Shrine":"寶石神殿","Monster Shrine":"怪物神殿","Refilling Shrine":"補充神殿","Skill Shrine":"技能神殿","Mana Recharge Shrine":"法力充能神殿","Stamina Shrine":"耐力神殿","Resist Fire Shrine":"火焰抗性神殿","Resist Cold Shrine":"冰寒抗性神殿","Resist Lightning Shrine":"閃電抗性神殿","Resist Poison Shrine":"毒素抗性神殿","Poison Shrine":"毒素神殿","Portal Shrine":"傳送門神殿","Shrine":"神殿","You feel more skillful.":"你覺得技巧更純熟了。","You feel ready for battle.":"你覺得已經準備好戰鬥了。","You feel refreshed.":"你覺得精神煥發。","Your experience teaches you well.":"你的經驗讓你學到很多。","Your skin hardens.":"你的皮膚變硬了。","A circle of flame...":"一圈火焰……","A fiery death...":"火熱的死亡……","A marvelous gem...":"一顆神奇的寶石……","Death's advocate approaches.":"死亡的代言人逼近了。","Bow and\nCrossbow\nSkills":"弓與\n十字弓\n技能","Javelin\nand Spear\nSkills":"標槍與\n長矛\n技能","Passive\nand Magic\nSkills":"被動與\n魔法\n技能","Poison\nand Bone\nSpells":"毒素與\n白骨\n法術","Poison and Bone Spells":"毒素與白骨法術","Close Mini Panel":"關閉迷你面板","Open Mini Panel":"開啟迷你面板","Game Menu (Esc)":"遊戲選單（Esc）","Message Log":"訊息紀錄","Party Screen":"隊伍畫面","Quest Log":"任務紀錄","Skilled with the spear and the bow, she is a very versatile fighter.":"擅長使用長矛與弓，是一位非常全能的戰士。","Schooled in the Martial Arts, her mind and body are deadly weapons.":"受過武學訓練，她的心靈與身體都是致命的武器。","Summoning undead minions and cursing his enemies are his specialties.":"召喚不死僕從與詛咒敵人是他的專長。","He is unequaled in close-quarters combat and mastery of weapons.":"他在近身肉搏與武器運用上無人能及。","He is a natural party leader, holy man, and blessed warrior.":"他是天生的隊伍領袖、聖職者，也是受祝福的戰士。","She has mastered the elemental magicks -- fire, lightning, and ice.":"她精通元素魔法——火焰、閃電與冰霜。","Commanding the forces of nature, he summons wild beasts and raging storms to his side.":"他號令自然之力，召喚野獸與狂暴的風暴相助。","the Axe":"斧頭","the Cold":"冰冷者","the Hammer":"戰鎚","Dragonscale":"龍鱗","Festering Appendages":"潰爛附肢","Gorebelly":"血腹","Magma Torquer":"熔岩扭轉者","Tarnhelm":"隱身盔","Charsi":"恰西","Amazon":"亞馬遜","Assassin":"刺客","Barbarian":"野蠻人","Druid":"德魯伊","Necromancer":"死靈法師","Paladin":"聖騎士","Sorceress":"女巫","(Amazon Only)":"（亞馬遜專用）","(Assassin Only)":"（刺客專用）","(Barbarian Only)":"（野蠻人專用）","(Druid Only)":"（德魯伊專用）","(Necromancer Only)":"（死靈法師專用）","(Paladin Only)":"（聖騎士專用）","(Sorceress Only)":"（女巫專用）","Bows, javelins and a warrior’s reflexes":"弓、標槍與戰士的反應","Bone, poison, curses and the raised dead":"白骨、毒素、詛咒與復甦的亡者","Elemental storms, summoned beasts and shape shifting":"元素風暴、召喚野獸與變形","Fire, cold and lightning":"火焰、冰寒與閃電","Holy auras, combat skills and the Blessed Hammer":"神聖靈氣、戰鬥技能與祝福之錘","Weapon masteries, war cries and Whirlwind":"武器專精、戰嚎與旋風斬","Bow and Crossbow Skills":"弓與十字弓技能","Passive and Magic Skills":"被動與魔法技能","Javelin and Spear Skills":"標槍與長矛技能","Fire Skills":"火焰技能","Cold Skills":"冰寒技能","Combat Skills":"戰鬥技能","Elemental Skills":"元素技能","Poison and Bone Skills":"毒素與白骨技能","Shape Shifting Skills":"變形技能","Summoning Skills":"召喚技能","Damage Reduced":"傷害減少","Maximum Damage":"最大傷害","Minimum Damage":"最小傷害","Spells, auras and summons don't use it":"法術、靈氣與召喚物不會用到","More damage from every skill: gear's +% Damage and shrines":"提高所有技能傷害：裝備的 +% 傷害與神殿","More damage from weapon skills (arrows, javelins, blows, throws): the weapon's damage, Dexterity, gear's +% Attack Damage":"提高武器技能傷害（箭矢、標槍、近戰、投擲）：武器傷害、敏捷、裝備的 +% 攻擊傷害","More gold from what monsters drop":"怪物掉落更多金幣","Every blow lands here: Attack Rating is critical strike chance instead":"此處攻擊必定命中：攻擊準確率改為致命一擊機率","Chance of a critical strike: double damage":"致命一擊機率：雙倍傷害","Chance a physical hit makes the monster bleed for 8 seconds":"物理命中使怪物流血 8 秒的機率","Physical hits heal you by a share of their damage, less from monsters D2 drains less":"物理命中依傷害比例治療你；在 D2 中吸取較少的怪物效果也較低","Raises each armour's own Damage Reduction: counted in Damage Reduced":"提高每件護甲自身的傷害減免：計入傷害減少","Added to every weapon blow: its average goes to Attack Damage":"加到每次武器攻擊：平均值計入攻擊傷害","Added to every weapon blow: its share of the average goes to Attack Damage":"加到每次武器攻擊：其平均值比例計入攻擊傷害","Adds 0.4% Attack Damage a percent":"每 1% 增加 0.4% 攻擊傷害","Each point past the class's: +0.2% critical strike chance, +0.6% Attack Damage":"超過職業初始值的每一點：+0.2% 致命一擊機率、+0.6% 攻擊傷害","Each point past the class's: +1% physical damage":"超過職業初始值的每一點：+1% 物理傷害","No mana here: Faster Cast Rate, a quarter of a percent a point":"這裡沒有法力：改為快速施法率，每點 0.25%","No mana here: Faster Cast Rate, as what fighting pours in":"這裡沒有法力：改為快速施法率，隨戰鬥累積","No mana here: each point past the class's is +1% fire, cold, lightning, poison and magic damage":"這裡沒有法力：超過職業初始值的每一點為 +1% 火焰、冰寒、閃電、毒素與魔法傷害","Come back at half life\nonce more per run, per rank":"以一半生命復活\n每級每輪多一次","One more level-up banish per run, per rank":"每級每輪多一次升級放逐","One more level-up reroll per run, per rank":"每級每輪多一次升級重抽","One more level-up skip per run, per rank":"每級每輪多一次升級略過","+0.5 life per second per rank":"每級每秒 +0.5 生命","+1% chance of a critical strike, +3% Attack Damage":"+1% 致命一擊機率、+3% 攻擊傷害","+10% better chance of magic items per rank":"每級 +10% 尋獲魔法物品機率","+10% cold damage":"+10% 冰寒傷害","+10% fire damage":"+10% 火焰傷害","+10% gold per rank":"每級 +10% 金幣","+10% lightning damage":"+10% 閃電傷害","+10% magic damage (Teeth, Bone Spear, Bone Spirit)":"+10% 魔法傷害（骨牙、骨矛、骨魂）","+10% movement speed":"+10% 移動速度","+10% poison damage":"+10% 毒素傷害","+20 maximum life":"+20 生命上限","+20 to 40 maximum life, by class":"+20～40 生命上限，依職業而定","+5 points":"+5 點","+5% fire, cold, lightning, poison and magic damage":"+5% 火焰、冰寒、閃電、毒素與魔法傷害","+5% physical damage":"+5% 物理傷害","+7% movement speed and 4% shorter cooldowns":"+7% 移動速度，冷卻時間縮短 4%","+8% movement speed":"+8% 移動速度","2% less damage taken per rank":"每級受到的傷害減少 2%","Skills recharge 8% faster":"技能冷卻快 8%","Take 7% less damage":"受到的傷害減少 7%","Take 8% less damage":"受到的傷害減少 8%","You take 30% less damage and have 35% more life, renewed every 12s":"受到的傷害減少 30%、生命增加 35%，每 12 秒重新生效","Every few seconds a double of you appears nearby, drawing monsters (more often, for longer)":"每隔幾秒在附近出現你的分身吸引怪物（更頻繁、更持久）","Battle Orders, and +1 to all your skills":"戰鬥命令，並使所有技能 +1","Aura: +10% magic damage (Blessed Hammer, Holy Bolt, Holy Shield)":"靈氣：+10% 魔法傷害（祝福之槌、聖光彈、神聖之盾）","Aura: +10% physical damage (Zeal, Smite, Charge)":"靈氣：+10% 物理傷害（熱誠、重擊、衝鋒）","Aura: burns every monster around you each second":"靈氣：每秒灼燒你周圍的所有怪物","Aura: lightning jolts every monster around you each second":"靈氣：每秒以閃電電擊你周圍的所有怪物","Aura: monsters around you are slowed by half and chilled each second":"靈氣：你周圍的怪物每秒被緩速一半並冰冷","Aura: monsters around you take 10% more damage from everything, +5% a level":"靈氣：你周圍的怪物受到的所有傷害增加 10%，每級 +5%","Aura: skills recharge 5% faster, +4% physical damage":"靈氣：技能冷卻快 5%，+4% 物理傷害","Aura: take 6% less damage":"靈氣：受到的傷害減少 6%","2 bolts that jump between up to 8 monsters, 45 damage each":"2 道在最多 8 隻怪物間跳躍的彈矢，各 45 傷害","2 molten boulders roll through all in their path, 95 damage, knockback, leaving fire":"2 顆熔岩巨石輾過路徑上的一切，95 傷害並擊退，留下火焰","3 fire balls at the nearest monsters, bursting on impact for 55 damage around":"向最近的怪物發射 3 顆火球，命中時爆炸對周圍造成 55 傷害","6 axes thrown at the monsters around you, 55 damage each, passing through 3":"向周圍怪物投擲 6 把斧頭，各 55 傷害，可穿透 3 隻","6 blades thrown at the monsters around you, 36 damage each, passing through one":"向周圍怪物投擲 6 把刀刃，各 36 傷害，可穿透 1 隻","6 frenzied blows over the monsters in a wide reach (every other at a boss), 26 damage each":"對大範圍內的怪物狂亂攻擊 6 次（每隔一次打首領），各 26 傷害","A blast of the mind over the nearest pack, 90 damage and a 2s stun to all in it":"對最近的怪物群釋放心靈衝擊，90 傷害並暈眩 2 秒","A focused blow at the toughest monster in reach, 200 damage, splashing 60 to those beside it":"集中攻擊範圍內最強的怪物，200 傷害，對旁邊的怪物濺射 60","A wall of fire across the path ahead that burns for 4s":"在前方路徑上築起火牆，燃燒 4 秒","An orb that sprays chilling ice shards in every direction, 22 damage each":"向四面八方噴射冰冷碎片的法球，每片 22 傷害","Blades spin around you, 32 damage to all beside you 3 times a second, and fly off at monsters for 28":"刀刃環繞你旋轉，每秒 3 次對身旁所有怪物造成 32 傷害，並飛向怪物造成 28 傷害","Charge 3 times along your path, 60 damage in the way, a holy burst at each stop":"沿路徑衝鋒 3 次，對路上怪物造成 60 傷害，每次停下時神聖爆發","Leap where you run (at a foe when still) and strike: 320 damage, 100 around":"往奔跑方向跳躍（靜止時跳向敵人）並攻擊：320 傷害，周圍 100","Lightning keeps striking monsters around you, 70 damage":"閃電持續打擊你周圍的怪物，70 傷害","Meteors crash onto 3 monsters, 90 damage, and leave the ground burning":"隕石砸向 3 隻怪物，90 傷害，並使地面燃燒","The Hammerdin: 4 blessed hammers at once, whirling faster and wider, 40 damage to all they pass":"錘丁：一次 4 把祝福之槌，旋轉得更快更廣，對經過的怪物造成 40 傷害","a bash":"猛擊","a blade":"刀刃","a bolt from the sky":"天降彈矢","a bolt or blow back":"彈矢或反擊","a burst of fire, cold or lightning":"火焰、冰寒或閃電爆發","a cut or a thrown blade":"斬擊或飛刃","a fire ball":"火球","a kick or its fire":"踢擊或其火焰","a mage's bolt":"法師的彈矢","a meteor":"隕石","a monster around you":"你周圍的怪物","a monster in it":"其中的怪物","a monster in the blast":"爆炸中的怪物","a monster in the ring":"環內的怪物","a monster it lands among":"落點處的怪物","a second of a bite's poison":"撕咬毒素的一秒","a second of its poison":"其毒素的一秒","a spear":"長矛","a spear thrust":"長矛刺擊","a thrust at each monster around":"刺擊周圍每隻怪物","a tick of a fire":"火焰每次造成傷害時","a tornado":"龍捲風","an arrow or its blast":"箭矢或其爆炸","an arrow or its burst":"箭矢或其爆發","an axe":"斧頭","to Life (Based on Character Level)":"生命（依角色等級）","to Mana (Based on Character Level)":"法力（依角色等級）","Magic Arrow":"魔法箭","Fire Arrow":"火焰箭","Inner Sight":"內視","Critical Strike":"致命攻擊","Jab":"搓刺","Cold Arrow":"冰箭","Multiple Shot":"多重箭","Dodge":"閃躲","Power Strike":"威力一擊","Poison Javelin":"毒槍","Exploding Arrow":"爆裂箭","Slow Missiles":"慢速箭","Avoid":"躲避","Impale":"刺爆","Lightning Bolt":"閃電球","Ice Arrow":"急凍箭","Guided Arrow":"導引箭","Penetrate":"刺入","Charged Strike":"衝能一擊","Plague Javelin":"瘟疫標槍","Strafe":"掃射","Immolation Arrow":"犧牲之箭","Dopplezon":"分身","Decoy":"誘餌","Evade":"迴避","Fend":"擊退","Freezing Arrow":"凍結之箭","Valkyrie":"女武神","Pierce":"穿刺","Lightning Strike":"閃電攻擊","Lightning Fury":"閃電之怒","Fire Bolt":"火彈","Warmth":"溫暖","Charged Bolt":"衝能彈","Ice Bolt":"冰彈","Frozen Armor":"冰封裝甲","Inferno":"地獄火","Static Field":"靜態立場","Telekinesis":"心靈傳動","Frost Nova":"霜之新星","Ice Blast":"冰風暴","Blaze":"火焰之路","Fire Ball":"火球","Nova":"新星","Lightning":"閃電","Shiver Armor":"碎 冰甲","Fire Wall":"火牆","Enchant":"附魔","Chain Lightning":"連鎖閃電","Teleport":"傳送","Glacial Spike":"冰尖柱","Meteor":"隕石","Thunder Storm":"雷雲風暴","Energy Shield":"能量護盾","Blizzard":"暴風雪","Chilling Armor":"寒冰裝甲","Fire Mastery":"支配火燄","Hydra":"九頭蛇","Lightning Mastery":"支配閃電","Frozen Orb":"冰封球","Cold Mastery":"支配冰冷","Amplify Damage":"傷害加深","Teeth":"牙","Bone Armor":"白骨裝甲","Skeleton Mastery":"支配骷髏","Raise Skeleton":"復甦骷髏","Dim Vision":"微暗靈視","Weaken":"虛弱","Poison Dagger":"淬 毒匕首","Corpse Explosion":"屍體爆炸","Clay Golem":"黏 土石模","Iron Maiden":"攻擊反噬","Terror":"恐懼","Bone Wall":"骨牆","Golem Mastery":"支配石魔","Raise Skeletal Mage":"復甦骷髏法師","Confuse":"混亂","Life Tap":"偷取生命","Poison Explosion":"毒爆","Bone Spear":"骨矛","Blood Golem":"鮮血石魔","Attract":"吸引","Decrepify":"衰老","Bone Prison":"骨牢","Summon Resist":"召喚反抗","Iron Golem":"鋼鐵石魔","Lower Resist":"降低抵抗","Poison Nova":"劇毒新星","Bone Spirit":"白骨之魂","Fire Golem":"火焰石魔","Revive":"復活","Bash":"猛擊","Sword Mastery":"支配長劍","Axe Mastery":"支配斧頭","Mace Mastery":"支配釘頭錘","Howl":"嚎叫","Find Potion":"找尋葯劑","Leap":"跳躍","Double Swing":"雙手揮擊","Pole Arm Mastery":"長柄武器專精","Throwing Mastery":"支配飛擲","Spear Mastery":"支配長矛","Taunt":"嘲弄","Shout":"吶喊","Stun":"擊暈","Double Throw":"雙手投擲","Increased Stamina":"增加耐力","Find Item":"找尋物品","Leap Attack":"跳躍攻擊","Concentrate":"專心","Iron Skin":"鐵布衫","Battle Cry":"戰嗥","Frenzy":"狂亂","Increased Speed":"加速","Battle Orders":"戰鬥體制","Grim Ward":"殘酷嚇阻","Whirlwind":"旋風斬","Berserk":"狂戰士","Natural Resistance":"自然抵抗","War Cry":"戰鬥狂嗥","Battle Command":"戰鬥指揮","Sacrifice":"犧牲","Smite":"重擊","Might":"威能","Prayer":"祈禱","Resist Fire":"抗火","Holy Bolt":"聖光彈","Holy Fire":"聖火","Thorns":"荊棘","Defiance":"反抗","Resist Cold":"抗冰冷","Zeal":"熱誠","Charge":"衝鋒","Blessed Aim":"祝福瞄準","Cleansing":"淨化","Resist Lightning":"抵抗閃電","Blessed Hammer":"祝福之鎚","Concentration":"專注","Holy Freeze":"神聖冰凍","Vigor":"活力","Conversion":"轉化","Holy Shield":"神聖之盾","Holy Shock":"神聖衝擊","Sanctuary":"庇護所","Meditation":"冥想","Fist of the Heavens":"天堂之拳","Fanaticism":"狂熱","Conviction":"信念","Redemption":"救贖","Salvation":"救援","Raven":"烏鴉","Poison Creeper":"猛毒花藤","Werewolf":"狼人","Lycanthropy":"變狼術","Firestorm":"火風暴","Oak Sage":"橡木智者","Summon Spirit Wolf":"召喚鬼狼","Werebear":"熊人","Molten Boulder":"熔 漿巨岩","Arctic Blast":"極地風暴","Carrion Vine":"食屍藤","Feral Rage":"野性狂暴","Fissure":"火山裂隙","Cyclone Armor":"颶風裝甲","Heart of Wolverine":"狼獾之心","Summon Dire Wolf":"召喚狂狼","Summon Fenris":"召喚芬里爾","Rabies":"狂犬病","Fire Claws":"火焰之爪","Twister":"扭曲旋風","Solar Creeper":"太陽藤","Hunger":"飢餓","Shock Wave":"震波","Volcano":"火山","Tornado":"龍捲風","Spirit of Barbs":"荊棘之靈","Summon Grizzly":"召喚灰熊","Fury":"狂怒","Armageddon":"末日浩劫","Hurricane":"颶風","Cycle of Life":"生命循環","Claw Mastery":"支配利爪","Psychic Hammer":"心靈戰錘","Tiger Strike":"猛虎擊","Dragon Talon":"龍爪","Fire Blast":"火焰爆震","Burst of Speed":"速度爆發","Fists of Fire":"火焰之拳","Dragon Claw":"雙龍爪","Charged Bolt Sentry":"電能守衛","Wake of Fire":"火焰復甦","Wake of Fire Sentry":"火焰復甦守衛","Weapon Block":"武器格檔","Cloak of Shadows":"魔影斗篷","Cobra Strike":"眼鏡蛇攻擊","Blade Fury":"刃之怒","Fade":"消逝","Shadow Warrior":"影子戰士","Claws of Thunder":"雷電爪","Dragon Tail":"神龍擺尾","Lightning Sentry":"雷光守衛","Wake of Inferno":"復甦獄火","Mind Blast":"心靈爆震","Blades of Ice":"寒冰刃","Dragon Flight":"飛龍在天","Death Sentry":"亡者守衛","Blade Shield":"刀刃之盾","Blade Sentinel":"刃之守衛","Venom":"毒牙","Shadow Master":"支配影子","Phoenix Strike":"鳳凰攻擊","Aura Enchanted":"靈氣附魔","Cold Enchanted":"冰寒強化","Fire Enchanted":"火焰強化","Magic Resistant":"魔法抗性","Mana Burn":"燃燒法力","Teleportation":"瞬間移動","Cursed":"被詛咒","Possessed":"被附身","Fire Trauma":"火焰創傷","Fire Eye":"火眼","Prevent Monster Heal":"阻止怪物恢復","Replenish Life":"補充生命","Fires Explosive Arrows or Bolts":"射出爆裂箭或彈矢","Fires Magic Arrows":"射出魔法箭","Horror Arctic Blast":"恐怖極地寒風","Baal Inferno":"巴爾地獄火","Catacombs Level 4":"地下墓穴第 4 層","Durance of Hate Level 3":"憎恨囚牢第 3 層","Duriel's Lair":"督瑞爾之巢","Nihlathak's Temple":"尼拉塞克神殿","The Secret Cow Level":"秘密奶牛關","The Countess":"女伯爵","The Summoner":"召喚者","assassin upkeep":"刺客維持","barbarian upkeep":"野蠻人維持","druid upkeep":"德魯伊維持","sorceress upkeep":"女巫維持","Acrobat's":"特技","Alma Negra":"阿爾瑪 尼格拉","Arachnid Mesh":"蜘蛛之網","Arioc's Needle":"愛理歐克之針","Arkaine's Valor":"阿凱尼的榮耀","Arm of King Leoric":"李奧瑞克王的武器","Arreat's Face":"亞瑞特的面容","Astreon's Iron Ward":"愛斯特龍之鐵的保護區","Bane Ash":"禍根之灰","Baranar's Star":"巴拉那之星","Bartuc's Cut-Throat":"巴特克的猛擊","Biggin's Bonnet":"畢格因的軟帽","Blackhand Key":"黑手之鑰","Blinkbat's Form":"眨眼蝙蝠的外觀","Blood Crescent":"血紅新月","Blood Raven's Charge":"血鳥的襲擊","Bul-Kathos' Wedding Band":"布爾凱索之戒","Buriza-Do Kyanon":"布里撒 多 凱南","Burning":"燃燒","Bverrit Keep":"貝弗提的紀念","Captain's":"隊長","Carin Shard":"凱恩碎片","Cerebus' Bite":"地獄之吻","Chilling":"寒意","Crown of Ages":"年紀之冠","Crown of Thieves":"盜賊皇冠","Darkforce Spawn":"魔力肇生","Death Cleaver":"死亡之刀","Death's Web":"死亡之網","Demonhorn's Edge":"惡魔號角的邊緣","Dimoak's Hew":"迪馬克之劈砍","Dwarf Star":"矮人之星","Entrapping":"誘騙","Eschuta's Temper":"艾斯屈塔的脾氣","Expert's":"專家","Fanatic":"狂信者","Fletcher's":"製箭者","Fungal":"黴菌","Gargoyle's Bite":"石像鬼之噬","Gerke's Sanctuary":"基爾克的聖堂","Gloom's Trap":"陰影陷阱","Gore Rider":"蝕肉騎士","Graverobber's":"盜墓者","Griffon's Eye":"格利風之眼","Halaberd's Reign":"海拉柏得的國度","Harlequin Crest":"諧角之冠","Harpoonist's":"魚叉手","Hawk Branded":"老鷹烙印","Herald of Zakarum":"撒卡蘭姆使者","Hexing":"詛咒","Highlord's Wrath":"大君之怒","Husoldal Evo":"胡索丹 依弗","Iron Pelt":"擲鐵","Jade Talon":"碧玉爪","Jalal's Mane":"加爾的長髮","Kinemil's Awl":"金麥爾的錐子","Kira's Guardian":"奇拉的守護","Knell Striker":"敲擊喪鐘者","Langer Briser":"蘭格 布里瑟","Lidless Wall":"警戒之牆","Life":"生命","Lion Branded":"獅子烙印","Lycander's Aim":"雷山德的指標","Lycander's Flank":"雷山德的側腹","Mara's Kaleidoscope":"馬拉的萬花筒","Medusa's Gaze":"梅杜莎的凝視","Mentalist's":"心智","Nature's":"自然","Nature's Peace":"大自然的和平","Nightwing's Veil":"夜翼面紗","Nosferatu's Coil":"吸血聖王之圈","Passion":"熱情","Pelta Lunata":"新月小盾","Preserver's":"保護者","Que-Hegan's Wisdom":"魁黑剛的智慧","Radament's Sphere":"達羅門特之球體","Raven Claw":"渡鳥之爪","Raven Frost":"烏鴉之霜","Rixot's Keen":"瑞克撒特的輓歌","Rose Branded":"玫瑰烙印","Seraph's Hymn":"熾天使之韻","Shadow Dancer":"影舞者","Shadow Killer":"影殺者","Shock Web":"雷電網","Shogukusha's":"將軍","Skin of the Vipermagi":"蛇魔法師之皮","Skullder's Ire":"詩寇蒂的憤怒","Sounding":"鳴響","Sparking":"火光","Sparking Mail":"火花之甲","Spectral Shard":"妖怪碎片","Spire of Honor":"榮耀的尖塔","Spire of Lazarus":"拉撒羅斯之螺旋","Spirit Keeper":"靈魂看守者","Spirit Ward":"魂系結界","Spiritual":"精神","Steel Pillar":"鐵柱","Suicide Branch":"自殺支系","The Cat's Eye":"貓眼","The Chieftain":"族長","The Dragon Chang":"張龍","The Eye of Etlich":"艾利屈之眼","The Face of Horror":"恐懼之臉","The Fetid Sprinkler":"惡臭散佈者","The Gladiator's Bane":"鬥士的禍根","The Gnasher":"牙齒","The Hand of Broc":"柏克之手","the Impaler":"穿刺者","The Iron Jang Bong":"鐵檢棒","The Meat Scraper":"刮肉者","The Oculus":"眼球","The Patriarch":"族長","The Rising Sun":"旭日東昇","The Salamander":"火精靈","The Scalper":"圓鑿","The Tannr Gorerod":"坦之血杖","The Ward":"囚房","Thundergod's Vigor":"雷神之力","Titan's Revenge":"泰坦的復仇","Torch of Iro":"衣洛的火炬","Trainer's":"訓練師","Treads of Cthon":"凱松的征服","Umbral Disk":"陰影圓盤","Ume's Lament":"烏米的慟哭","Veil of Steel":"鋼鐵面紗","Verdungo's Hearty Cord":"維爾登戈的心結","Volcanic":"火山","War Traveler":"戰爭旅者","Wisp Projector":"鬼火投射者","Zakarum's Hand":"撒卡蘭姆之手"},"patterns":[["Holy Shield at its height for good, +{}% Chance to Block, smiting back; a holy blast every 4s throws monsters back, 50 damage","神聖之盾永遠維持最強，+{1}% 格擋機率並反擊；每 4 秒神聖爆發擊退怪物，50 傷害"],["A heavy blow at the toughest monster in reach, {} damage; each costs you {}% of your life, held back below {}% life","重擊範圍內最強的怪物，{1} 傷害；每次消耗你 {2}% 生命，生命低於 {3}% 時暫停"],["A sentry fires lightning 5 times, {} damage, and blows up a corpse near it each time for {} plus {}% of its life","守衛發射 5 次閃電，{1} 傷害，每次並引爆附近屍體造成 {2} 加上屍體生命的 {3}%"],["A Tome of Town Portal, transmuted with Wirt's Leg\nin the Horadric Cube: a portal to {}\nopens after Mephisto {}","城鎮傳送之書與維特之腳\n放進赫拉迪克方塊合成：通往{1}的傳送門\n會在擊敗墨菲斯托後開啟{2}"],["A trap near the nearest pack breathes fire at monsters 10 times, 5 flames of {} damage to all in their path","最近怪物群附近的陷阱向怪物噴火 10 次，每次 5 道火焰，對路徑上所有敵人造成 {1} 傷害"],["Bless your shield for {}s: +{}% Chance to Block, +{}% Defense; smite what you block for {}, and Smite hits harder","祝福你的盾牌 {1} 秒：+{2}% 格擋機率、+{3}% 防禦；格擋時重擊對方 {4}，重擊威力更強"],["A grizzly, {} damage a swipe, and the pack +{}% damage; with 3 dire wolves, 5 spirit wolves and {} ravens","一隻灰熊，每次揮擊 {1} 傷害，獸群傷害 +{2}%；另有 3 隻恐狼、5 隻狼靈與 {3} 隻烏鴉"],["Heart of Wolverine: +{}% damage to your blows and your summons', +{}% Attack Rating; Oak Sage's +{}% life","狼獾之心：你與召喚物的攻擊傷害 +{1}%、攻擊準確率 +{2}%；橡木智者 +{3}% 生命"],["Curse, {}s: monsters within {} of the nearest turn on each other with their own blows (not act bosses)","詛咒 {1} 秒：最近目標 {2} 範圍內的怪物會互相攻擊（幕首領除外）"],["A thrust at the toughest monster in reach, 120 damage; lightning chains on through {} more, 110 each","刺擊範圍內最強的怪物，120 傷害；閃電再連鎖 {1} 隻，各 110"],["The Worldstone is safe. You cleared all five acts{} in {}, at level {#}, having slain {#} monsters. +{#} gold.{}","世界之石已安全。你以 {2} 通過了全部五幕{1}，等級 {3}，共擊殺 {4} 隻怪物。+{5} 金幣。{6}"],["A charged thrust at the toughest monster in reach, 100 damage; {} bolts crackle on from it, 50 each","對範圍內最強的怪物充能刺擊，100 傷害；並迸出 {1} 道電彈，各 50"],["A solar creeper eats corpses: each speeds recharge {}% for {}s, up to {}%; the vine and {} creepers stay","日光藤吞食屍體：每具使技能冷卻加快 {1}%，持續 {2} 秒，最多 {3}%；藤蔓與 {4} 株毒藤會留下"],["Curse, {}s: monsters within {} of a target, ranged first, only see you beside them (not act bosses)","詛咒 {1} 秒：目標 {2} 範圍內的怪物（優先遠程）只看得到身邊的你（幕首領除外）"],["Blow up a corpse near monsters: {} damage plus {}% of its life, radius {}. Its own dead don't blow up","引爆怪物附近的屍體：{1} 傷害加上屍體生命的 {2}%，範圍 {3}。它造成的屍體不會連鎖引爆"],["Ice shards rain on the nearest pack for 2.4s, 24 shards of {} damage each, chilling what they hit","冰碎片落在最近的怪物群 2.4 秒，共 24 片，各 {1} 傷害並冰冷"],["When monsters crowd you, those around you flee in terror for {}s (bosses less, act bosses never)","被怪物包圍時，周圍的怪物會恐懼逃跑 {1} 秒（首領較短，幕首領不受影響）"],["A kick at the toughest in reach, {} damage, exploding in fire for {} around, releasing all charges","踢擊範圍內最強的敵人，{1} 傷害，爆炸對周圍造成 {2} 火焰傷害，釋放所有蓄能"],["Curse the toughest of the nearest pack, {}s: those within {} turn on it, passing on when it falls","詛咒最近怪物群中最強的一隻，{1} 秒：{2} 範圍內的怪物會攻擊它，它倒下後轉移"],["A blow at the toughest monster in reach: {} fire, cold and lightning each, half to those beside","攻擊範圍內最強的怪物：火焰、冰寒、閃電各 {1}，旁邊的怪物受一半"],["A golem of iron, {} life, {} damage, with a Thorns aura: what strikes it takes back {}% of the blow","鋼鐵石魔，{1} 生命，{2} 傷害，帶有荊棘靈氣：攻擊它的敵人承受 {3}% 反傷"],["{} javelins trailing poison that burst into a spreading cloud, 240 poison over {}s to all within {}","{1} 支拖曳毒素的標槍，爆出擴散毒雲，{3} 範圍內所有敵人 {2} 秒內受到 240 毒素傷害"],["Near a crowd or boss, blind all around you {}s: they take {}% more damage (act bosses unblinded)","靠近怪物群或首領時，使周圍敵人目盲 {1} 秒：受到的傷害增加 {2}%（幕首領不會目盲）"],["Werebear for {}s near monsters: 25% less damage taken, +{}% life, splashing blows of {}; no spells","靠近怪物時變身熊人 {1} 秒：受到的傷害減少 25%、+{2}% 生命，濺射攻擊 {3}；無法施法"],["Spirit of Barbs: monsters that strike you take back {}% of the damage, plus Wolverine's boons","荊棘之靈：攻擊你的怪物承受 {1}% 的反傷，並獲得狼獾之心的增益"],["Aura: +{}% chance of a critical strike (double damage) with Zeal, Smite, Charge and Sacrifice","靈氣：熱誠、重擊、衝鋒與犧牲 +{1}% 致命一擊機率（雙倍傷害）"],["Plant a totem among the nearest pack, and howl: for {}s monsters within {} of it flee in terror","在最近的怪物群中插下圖騰並嚎叫：{1} 秒內 {2} 範圍內的怪物恐懼逃跑"],["The strongest monster near you fights for you for {}s, harder; up to {}, no champions or bosses","你附近最強的怪物為你作戰 {1} 秒並更強；最多 {2} 隻，精英與首領除外"],["Up to 3 dire wolves, {} damage a bite, and the pack +{}% life; with 5 spirit wolves and {} ravens","最多 3 隻恐狼，每次撕咬 {1} 傷害，獸群生命 +{2}%；另有 5 隻狼靈與 {3} 隻烏鴉"],["Monsters near her take {}% more damage (except those with an immunity, which it can't break)","她附近的怪物受到的傷害增加 {1}%（無法破除免疫）"],["Summons take {}% less damage from monsters whose blows carry fire, cold, lightning or poison","召喚物受到帶有火焰、冰寒、閃電或毒素的怪物攻擊時，傷害減少 {1}%"],["A sentry near the nearest pack fires lightning through monsters in line 10 times, {} damage","最近怪物群附近的守衛發射 10 次貫穿直線怪物的閃電，{1} 傷害"],["A carrion vine eats corpses near you, each healing {} life + {}% of maximum; {} poison creepers","腐屍藤吞食你附近的屍體，每具恢復 {1} 生命 + 上限的 {2}%；{3} 株毒藤"],["Two blows in a wide reach, 45 damage each; hits speed your swings and steps, up to {} times","大範圍攻擊兩次，各 45 傷害；命中會加快揮擊與移動，最多疊加 {1} 次"],["The toughest monster nearby charges you for {}s, blows {}% weaker (act bosses only weakened)","附近最強的怪物向你衝來 {1} 秒，攻擊減弱 {2}%（幕首領只會被削弱）"],["Claws at the toughest in reach, {} damage; every fourth blow drains {} more, healing {}% of it","爪擊範圍內最強的敵人，{1} 傷害；每第四擊額外吸取 {2}，並恢復其中 {3}%"],["Curse, {}s: monsters within {} of a target slow by half, deal {}% less damage and take {}% more","詛咒 {1} 秒：目標 {2} 範圍內的怪物緩速一半，造成的傷害減少 {3}%、受到的傷害增加 {4}%"],["Curse, {}s: monsters within {} of the nearest take back {}% of their blows on you and summons","詛咒 {1} 秒：最近目標 {2} 範圍內的怪物攻擊你與召喚物時承受 {3}% 反傷"],["A jet of flame at the nearest monster within {}: {} flames, {} damage each to all in its path","向 {1} 範圍內最近的怪物噴出火焰：{2} 道火焰，對路徑上所有敵人各造成 {3} 傷害"],["Aura: +{}% cold resistance, and +{}% to its maximum (75%) a level; chill wears off {}% faster","靈氣：+{1}% 冰寒抗性，每級 +{2}% 抗性上限（75%）；冰冷效果消退快 {3}%"],["Aura: monsters close to you are hurt and thrown out, {} damage twice a second, +{} a level","靈氣：靠近你的怪物受到傷害並被彈開，每秒兩次 {1} 傷害，每級 +{2}"],["Bash the toughest monster in reach with your shield, {} damage, knocked back and stunned","用盾牌猛擊範圍內最強的怪物，{1} 傷害，擊退並暈眩"],["2 spikes at the nearest monsters burst for {} damage, freezing all in the burst for 1.5s","向最近的怪物射出 2 根冰刺，爆炸造成 {1} 傷害並冰凍範圍內敵人 1.5 秒"],["Claws at the toughest in reach, {} damage; every fourth blow releases 3 charges, +{}% each","爪擊範圍內最強的敵人，{1} 傷害；每第四擊釋放 3 層蓄能，每層 +{2}%"],["Claws at the toughest in reach, {} damage; every fourth blow bursts in fire, {} around it","爪擊範圍內最強的敵人，{1} 傷害；每第四擊爆出火焰，對周圍造成 {2}"],["Wereform blows add 32 poison over {}s; a bitten monster that dies passes it to {} near it","變身後的攻擊附加 {1} 秒 32 毒素傷害；被咬的怪物死亡時傳染給附近 {2}"],["Slain monsters have a {}% chance to leave gold (champions {}%), and now and then an item","被殺的怪物有 {1}% 機率掉落金幣（精英 {2}%），偶爾掉落物品"],["A golem of fire, {} life, {} damage, with a Holy Fire aura that burns everything near it","火焰石魔，{1} 生命，{2} 傷害，帶有灼燒周圍一切的聖火靈氣"],["A three-headed hydra near the nearest pack for {}s, spitting fire bolts, {} damage each","在最近的怪物群附近召喚三頭九頭蛇 {1} 秒，噴出火彈，各 {2} 傷害"],["{} arrows that burst into freezing ice, 90 damage around what they hit and a 3s chill","{1} 支爆出冰霜的箭，對命中處周圍造成 90 傷害並冰冷 3 秒"],["Werebear for {}s: blows of {}, each {} more a charge up to 13 (the last stuns); no spells","變身熊人 {1} 秒：攻擊 {2}，每層蓄能多 {3}，最多 13 層（最後一擊暈眩）；無法施法"],["{} trailing poison clouds, {} damage and {} poison over {}s to every monster in the clouds","拖曳毒雲的{1}，對雲中每隻怪物造成 {2} 傷害並在 {4} 秒內造成 {3} 毒素傷害"],["Thrown axes deal {}% more damage and have +{}% chance to fly on through what they hit","投擲的斧頭傷害增加 {1}%，並有 +{2}% 機率穿透目標"],["Curse, {}s: damage you and summons deal monsters within {} of the nearest heals you {}%","詛咒 {1} 秒：你與召喚物對最近目標 {2} 範圍內怪物造成的傷害，會恢復你 {3}%"],["A blow at the toughest monster in reach, {} damage, stunning it for {}s (bosses less)","攻擊範圍內最強的怪物，{1} 傷害，暈眩 {2} 秒（首領較短）"],["Claws, 36 damage; every fourth blow shatters ice, {} damage around and a long chill","爪擊，36 傷害；每第四擊震碎寒冰，對周圍造成 {1} 傷害並長時間冰冷"],["Maul as a werebear for {}s; every {}rd swing a stomp, {} damage within {} yards, stunning","以熊人形態重擊 {1} 秒；每第 {2} 次揮擊會踐踏，{4} 碼內 {3} 傷害並暈眩"],["Curse, {}s: monsters within {} of the nearest flee and don't attack (not act bosses)","詛咒 {1} 秒：最近目標 {2} 範圍內的怪物逃跑且不攻擊（幕首領除外）"],["A trap near the nearest pack sends out 5 waves of fire, {} damage to all they pass","最近怪物群附近的陷阱發出 5 波火焰，對經過的一切造成 {1} 傷害"],["When monsters close in, blink on ahead where they're fewest; ready again after {}s","怪物逼近時瞬移到前方怪物最少處；{1} 秒後可再次使用"],["Your shadow fights beside you, {} damage a blow, {} life; every third blow is a kick","你的影子在身旁作戰，每次攻擊 {1} 傷害，{2} 生命；每第三擊是踢擊"],["A spear thrust charged with lightning at the toughest monster in reach, {} damage","對範圍內最強的怪物發出帶電刺擊，{1} 傷害"],["A spinning blade shuttles between you and the nearest pack for {}s, {} damage a cut","旋轉的刀刃在你與最近的怪物群之間來回 {1} 秒，每次斬擊 {2} 傷害"],["An army: up to {} skeletons, and slain monsters rise to fight for you (up to {}, {}s)","大軍：最多 {1} 具骷髏，被殺的怪物會復活為你作戰（最多 {2} 隻，{3} 秒）"],["Blink to the toughest monster ahead and kick it, {} damage, releasing all charges","瞬移到前方最強的怪物並踢擊，{1} 傷害，釋放所有蓄能"],["For {}s burning rocks fall around you, the toughest monsters most, 90 damage each","{1} 秒內燃燒岩石落在你周圍（最強的怪物最多），各 90 傷害"],["A sentry near the nearest pack fires 5 bursts of 5 charged bolts, {} damage each","最近怪物群附近的守衛發射 5 輪、每輪 5 道充能彈，各 {1} 傷害"],["For {}s a storm rages within {} yards: 45 cold damage 2.5 times a second, chilling","{1} 秒內，{2} 碼範圍內颳起風暴：每秒 2.5 次 45 冰寒傷害並冰冷"],["The ground erupts under the nearest pack for {}s, across {} yards, {} damage a burst","最近的怪物群下方地面爆發 {1} 秒，範圍 {2} 碼，每次爆發 {3} 傷害"],["Two blasts of cold in a fan before you, {} damage each, chilling what they touch","向前方扇形噴出兩道寒氣，各 {1} 傷害並冰冷"],["{} fire trails, {} yards, at the nearest monster, burning {} damage 4 times a second","向最近的怪物放出 {1} 道 {2} 碼的火焰路徑，每秒 4 次造成 {3} 傷害"],["Claws, 32 damage; every fourth blow a thunder nova, {} damage, and charged bolts","爪擊，32 傷害；每第四擊發出雷霆新星，{1} 傷害，並放出充能彈"],["A rapid volley of {} arrows spread over the monsters around you, 40 damage each","對周圍怪物快速連射 {1} 支箭，各 40 傷害"],["A volcano under the nearest pack for {}s, raining burning rocks, 65 damage each","在最近的怪物群下方召喚火山 {1} 秒，降下燃燒岩石，各 65 傷害"],["Dash through the monsters in your path, {} damage to each and a blow at the end","衝過路徑上的怪物，各造成 {1} 傷害，最後再攻擊一次"],["Leap the way you run (at a pack when still); the landing knocks back, {} damage","往奔跑方向跳躍（靜止時跳向怪物群）；落地時擊退，{1} 傷害"],["Two claw blows at the toughest in reach, {} damage each, releasing all charges","對範圍內最強的敵人揮爪兩次，各 {1} 傷害，釋放所有蓄能"],["Werewolf for {}s near monsters: +{}% life, claws of {} every {}s, +{}% crit; no spells","靠近怪物時變身狼人 {1} 秒：+{2}% 生命，每 {4} 秒爪擊 {3}，+{5}% 致命一擊；無法施法"],["Aura: monsters that strike you in melee take back {}% of the blow, +{}% a level","靈氣：近戰攻擊你的怪物承受 {1}% 的反傷，每級 +{2}%"],["A crushing blow at the toughest monster in reach, {} damage, knocking it back","對範圍內最強的怪物壓碎性打擊，{1} 傷害並擊退"],["A golem of clay holds the horde back and slows what it hits, {} life, {} damage","黏土石魔擋住怪物群並緩速被擊中的目標，{1} 生命，{2} 傷害"],["A spear thrust at every monster around you in turn (up to {}), 60 damage each","依序刺擊你周圍的每隻怪物（最多 {1} 隻），各 60 傷害"],["A golem of blood, {} life, {} damage; every blow it lands heals you for {}% of it","血石魔，{1} 生命，{2} 傷害；它的每次攻擊會以傷害的 {3}% 治療你"],["Wereforms last {}s longer, {}s more a level, and give +{}% more life, +{}% a level","變身持續時間延長 {1} 秒（每級再加 {2} 秒），並增加 +{3}% 生命（每級 +{4}%）"],["A corpse by the nearest monster bursts into poison: {} over {}s to all within {}","最近怪物旁的屍體爆出毒素：{3} 範圍內所有怪物 {2} 秒內受到 {1}"],["A heavy spear thrust at the toughest monster in reach, {} damage, {} to a boss","對範圍內最強的怪物重重刺擊，{1} 傷害，對首領 {2}"],["3 tornadoes wander the horde, {} damage and a stun to each monster they pass","3 道龍捲風在怪物群中遊蕩，對經過的怪物造成 {1} 傷害並暈眩"],["Werewolf for {}s: a flurry of {} blows at all in reach, {} damage each, every {}s","變身狼人 {1} 秒：每 {4} 秒對範圍內所有敵人連續攻擊 {2} 次，各 {3} 傷害"],["A bomb thrown at the nearest monster, bursting for {} fire damage around it","向最近的怪物投擲炸彈，爆炸對周圍造成 {1} 火焰傷害"],["Bone walls cage the {} near you for {}s, bosses too (act bosses half as long)","白骨之牆將你附近的{1}囚禁 {2} 秒，首領也會（幕首領時間減半）"],["You fell in {} after {}, at level {#}, having slain {#} monsters. +{#} gold (best: {}).","你在{1}倒下，歷時 {2}，等級 {3}，共擊殺 {4} 隻怪物。+{5} 金幣（最佳：{6}）。"],["Whirl {} yards through the horde, {} damage to each monster 5 times a second","在怪物群中旋轉 {1} 碼，每秒 5 次對每隻怪物造成 {2} 傷害"],["{} javelins that burst into lightning forking to {} monsters, 70 damage each","{1} 支爆出閃電的標槍，分岔擊中 {2} 隻怪物，各 70 傷害"],["Frozen Armor for {}s: melee attackers get a {}s chill; {}% of their blows miss","冰封裝甲 {1} 秒：近戰攻擊者被冰冷 {2} 秒；他們的攻擊有 {3}% 落空"],["You have {} gold · What a hero sells stays here until that hero's next run","你有 {1} 金幣 · 英雄出售的物品會留在這裡，直到該英雄開始下一輪"],["Aura: monsters slain near you heal you {} life, {}% of the time, +{}% a level","靈氣：在你附近被殺的怪物有 {2}% 機率為你恢復 {1} 生命，每級 +{3}%"],["A ring of poison out to 230: 180 poison over {}s to everything it touches","向外擴散至 230 的毒環：碰到的一切 {1} 秒內受到 180 毒素傷害"],["{} arrows that explode for 90 damage and leave the ground burning for 3s","{1} 支爆炸的箭，造成 90 傷害並使地面燃燒 3 秒"],["Aura: +{}% fire, cold and lightning resistance; chill wears off {}% faster","靈氣：+{1}% 火焰、冰寒與閃電抗性；冰冷效果消退快 {2}%"],["A ring of frost out to {} range, {} damage, chilling all it touches for {}s","向外擴散至 {1} 距離的冰霜環，{2} 傷害，冰冷碰到的一切 {3} 秒"],["{} bone spirits, each hunting down one of the nearest monsters, {} damage","{1} 道骨魂，各自追擊一隻最近的怪物，{2} 傷害"],["Spirits' boons and vines' meals are {}% stronger, creepers' poison too","靈體的增益與藤蔓的吞食效果強 {1}%，藤蔓的毒素也是"],["+{}% chance for her attacks (and the Valkyrie's) to deal double damage","她（與女武神）的攻擊 +{1}% 機率造成雙倍傷害"],["Up to 5 spirit wolves fight beside you, {} damage a bite; and {} ravens","最多 5 隻狼靈在你身旁作戰，每次撕咬 {1} 傷害；另有 {2} 隻烏鴉"],["Monsters within {} lose {}% of their life (a third of that for elites)","{1} 範圍內的怪物失去 {2}% 生命（精英為三分之一）"],["Aura: +{}% lightning resistance, and +{}% to its maximum (75%) a level","靈氣：+{1}% 閃電抗性，每級 +{2}% 抗性上限（75%）"],["{} quick spear thrusts at the nearest monster in reach, {} damage each","對範圍內最近的怪物快速刺擊 {1} 次，各 {2} 傷害"],["+{}% chance for arrows and javelins to fly on through what they hit","箭矢與標槍 +{1}% 機率穿透目標"],["{} at the toughest in reach, {} damage; the last releases all charges","對範圍內最強的敵人{1}，{2} 傷害；最後一擊釋放所有蓄能"],["{} that seek monsters, {} damage and a stun to each they pass through","追蹤怪物的{1}，對經過的每隻怪物造成 {2} 傷害並暈眩"],["{} spears of bone that pierce every monster in their path, {} damage","{1} 支貫穿路徑上所有怪物的骨矛，{2} 傷害"],["{} of sparks over the nearest pack for {}s, {} damage 4 times a second","{1}火花籠罩最近的怪物群 {2} 秒，每秒 4 次 {3} 傷害"],["Hurts every monster around you for {} damage and stuns them for {}s","對你周圍所有怪物造成 {1} 傷害並暈眩 {2} 秒"],["Ravens, wolves, the grizzly and creepers get +{}% life and damage","烏鴉、狼、灰熊與藤蔓獲得 +{1}% 生命與傷害"],["+{}% chance to sidestep a monster's hit while you're on the move","移動時 +{1}% 機率閃開怪物的攻擊"],["Aura: +{}% fire resistance, and +{}% to its maximum (75%) a level","靈氣：+{1}% 火焰抗性，每級 +{2}% 抗性上限（75%）"],["{} guided arrows that hunt through 6 monsters each, 65 damage","{1} 支導引箭，各追擊穿過 6 隻怪物，65 傷害"],["Monsters around you, bosses too, take {}% more damage for {}s","你周圍的怪物（包括首領）受到的傷害增加 {1}%，持續 {2} 秒"],["Curse, {}s: monsters within {} of a target deal {}% less damage","詛咒 {1} 秒：目標 {2} 範圍內的怪物造成的傷害減少 {3}%"],["Curse, {}s: monsters within {} of a target take {}% more damage","詛咒 {1} 秒：目標 {2} 範圍內的怪物受到的傷害增加 {3}%"],["+{}% physical damage; as a werewolf, {}% faster run (up to {}%)","+{1}% 物理傷害；狼人形態跑速快 {2}%（最多 {3}%）"],["Aura: +{}% movement speed, up to +{}%; Charge reaches further","靈氣：+{1}% 移動速度，最多 +{2}%；衝鋒距離更遠"],["Slain monsters have a {}% chance to leave a healing potion","被殺的怪物有 {1}% 機率掉落治療藥水"],["Leave a trail of fire behind you for {}s, {} damage per tick","在身後留下火焰路徑 {1} 秒，每次 {2} 傷害"],["Take 4% less damage; poison and chill wear off {}% faster","受到的傷害減少 4%；中毒與冰冷消退快 {1}%"],["Take 6% less damage; poison and chill wear off {}% faster","受到的傷害減少 6%；中毒與冰冷消退快 {1}%"],["A Valkyrie fights at your side, {} damage a spear thrust","女武神在你身旁作戰，每次刺擊 {1} 傷害"],["Two swift blows at the monsters in reach, {} damage each","對範圍內的怪物快速攻擊兩次，各 {1} 傷害"],["{} arrows that freeze what they hit solid for {}s, {} damage","{1} 支箭，將命中目標冰凍 {2} 秒，{3} 傷害"],["+{}% physical damage and +{}% chance of a critical strike","+{1}% 物理傷害與 +{2}% 致命一擊機率"],["{} of holy light that {} {}, {} damage (double to the undead)","{1}聖光，{2}{3}，{4} 傷害（對不死生物加倍）"],["Your claws and blades poison, {} damage a second for {}s","你的爪與刀刃附帶毒素，每秒 {1} 傷害，持續 {2} 秒"],["A fan of {} teeth at the nearest monster, {} damage each","向最近的怪物扇形射出 {1} 顆骨牙，各 {2} 傷害"],["{} of lightning through every monster in line, {} damage","{1}閃電貫穿直線上所有怪物，{2} 傷害"],["Skeletons, mages and revives get +{}% life and damage","骷髏、骷髏法師與復活怪物獲得 +{1}% 生命與傷害"],["Your fire skills burn {}% harder, the Hydra's bolts {}%","你的火焰技能傷害提高 {1}%，九頭蛇的火彈提高 {2}%"],["A blow of the mind at {}, {} damage, knocking them back","對{1}發出心靈衝擊，{2} 傷害並擊退"],["Werewolf and werebear blows heal {}% of their damage","狼人與熊人的攻擊會恢復傷害的 {1}%"],["+{}% chance to block a monster's hit with your claws","+{1}% 機率用爪格擋怪物的攻擊"],["+{}% chance to sidestep a monster's missile entirely","+{1}% 機率完全閃開怪物的飛射物"],["Absorbs Lightning Damage (+{} per Character Level)","吸收閃電傷害（每角色等級 +{1}）"],["{} that jump between up to {} monsters, {} damage each","{1}，在最多 {2} 隻怪物間跳躍，各 {3} 傷害"],["{} {} fire, cold, lightning or poison bolts, {} damage","{1}{2}火焰、冰寒、閃電或毒素彈，{3} 傷害"],["+{}% chance to sidestep a monster's hit entirely","+{1}% 機率完全閃開怪物的攻擊"],["Transmuted: a portal to {}\nopens after Mephisto {}","已合成：通往{1}的傳送門\n會在擊敗墨菲斯托後開啟{2}"],["Stab {} within reach, {} damage and {} poison over {}s","刺擊範圍內的{1}，{2} 傷害並在 {4} 秒內造成 {3} 毒素傷害"],["{} {} after monsters, {} poison over {}s a bite, {} life","{1}{2}怪物，每次撕咬在 {4} 秒內造成 {3} 毒素傷害，{5} 生命"],["{}% chance of a critical strike: double damage","{1}% 致命一擊機率：雙倍傷害"],["The cow portal will open after Mephisto, on {}","奶牛關傳送門會在擊敗墨菲斯托後開啟（{1}）"],["Only the {} can use that: stash it at Charsi's","只有{1}能使用：到恰西那裡放進儲物箱"],["Absorbs Cold Damage (+{} per Character Level)","吸收冰寒傷害（每角色等級 +{1}）"],["Absorbs Fire Damage (+{} per Character Level)","吸收火焰傷害（每角色等級 +{1}）"],["Each point past the class's: +{} maximum life","超過職業初始值的每一點：+{1} 生命上限"],["+{}% fire damage; wereform claws burn with it","+{1}% 火焰傷害；變身後的爪擊也會帶火焰"],["No room for that with the {} or in the stash","{1}身上和儲物箱都沒有空間"],["A ring of lightning out to {} range, {} damage","向外擴散至 {1} 距離的閃電環，{2} 傷害"],["{} from the class, {} from level-ups and gear","職業 {1}，升級與裝備 {2}"],["You cleared all five acts{} in {}, at level {#}.","你以 {2} 通過了全部五幕{1}，等級 {3}。"],["The Oak Sage follows you: +{}% maximum life","橡木智者跟隨你：+{1}% 生命上限"],["Aura: poison and chill wear off {}% faster","靈氣：中毒與冰冷效果消退快 {1}%"],["a javelin, or its burst's poison over {}s","標槍，或其爆炸毒素（{1} 秒）"],["Up to {} fight beside you, {} life, {} damage","最多{1}在你身旁作戰，{2} 生命，{3} 傷害"],["{}% Better Chance of Getting Magic Items","尋獲魔法物品機率提高 {1}%"],["Your {} one level higher, past their max","你的{1}提高一級，可超過上限"],["+{}% cold damage and take 5% less damage","+{1}% 冰寒傷害，受到的傷害減少 5%"],["{}% Chance to cast level {} {} when you Die","死亡時有 {1}% 機率施放等級 {2} 的{3}"],["Every skill recharges in {} of its time","所有技能冷卻時間變為原本的 {1}"],["{}% Chance to cast level {} {} on striking","擊中時有 {1}% 機率施放等級 {2} 的{3}"],["{}% Chance to cast level {} {} when struck","被擊中時有 {1}% 機率施放等級 {2} 的{3}"],["+{}% per level of {} skills and passives","{2}技能與被動每級 +{1}%"],["Throw an axe from each hand, {} damage{}","雙手各投擲一把斧頭，{1} 傷害{2}"],["Attacker Takes Lightning Damage of {}","攻擊者受到 {1} 閃電傷害"],["{} at monsters in reach, {} damage each","對範圍內的怪物{1}，各 {2} 傷害"],["{} that crackle forward, {} damage each","向前劈啪竄出的{1}，各 {2} 傷害"],["{} {} at monsters, {} damage, {} times each","{1}向怪物{2}，{3} 傷害，各 {4} 次"],["Adds {}-{} Poison Damage over {} Seconds","增加 {1}-{2} 毒素傷害，持續 {3} 秒"],["{}% Chance to cast level {} {} on attack","攻擊時有 {1}% 機率施放等級 {2} 的{3}"],["Build {} is ready: see the main menu","版本 {1} 已就緒：請到主選單查看"],["{} that pierces {} and chills, {} damage","{1}，穿透 {2} 隻並冰冷，{3} 傷害"],["Aura: heal {} life a second, up to {}","靈氣：每秒恢復 {1} 生命，最多 {2}"],["{} at the nearest monsters, {} damage","向最近的怪物發射{1}，{2} 傷害"],["{} {} out around you, {} damage to all {}","{1}向你周圍{2}，對所有{4}造成 {3} 傷害"],["{} at the nearest monster, {} damage","向最近的怪物發射{1}，{2} 傷害"],["Only the {} can use that: stash it","只有{1}能使用：放進儲物箱"],["Levels gear adds to every {} skill","裝備增加的等級套用到每個{1}技能"],["{} that pierce {} and chill, {} damage","{1}，穿透 {2} 隻並冰冷，{3} 傷害"],["+{}% Attack Rating against Demons","+{1}% 對惡魔的攻擊準確率"],["+{}% Attack Rating against Undead","+{1}% 對不死生物的攻擊準確率"],["Ready: a chest evolves it into {}","就緒：寶箱會將它進化為{1}"],["You fell in {} after {}, at level {#}.","你在{1}倒下，歷時 {2}，等級 {3}。"],["Monsters' missiles fly {}% slower","怪物的飛射物速度減慢 {1}%"],["a javelin, or its poison over {}s","標槍，或其毒素（{1} 秒）"],["{} that {} for {} damage around what {}","{1}，在{4}{2}，造成 {3} 範圍傷害"],["{}% Increased Chance of Blocking","格擋機率提高 {1}%"],["Her attacks deal {}% more damage","她的攻擊造成的傷害增加 {1}%"],["Aura: skills recharge {}% faster","靈氣：技能冷卻快 {1}%"],["A fan of {} arrows, {} damage each","扇形射出 {1} 支箭，各 {2} 傷害"],["+{} Poison Damage over {} Seconds","+{1} 毒素傷害，持續 {2} 秒"],["Ready: a chest evolves {} into {}","就緒：寶箱會將{1}進化為{2}"],["Hit Causes Monster to Flee {}%","擊中使怪物逃跑 {1}%"],["For {}s you take {}% less damage","{1} 秒內受到的傷害減少 {2}%"],["{} comes when the bar runs out","量條用完時{1}就會出現"],["Missile Damage Reduced by {}%","飛射物傷害減少 {1}%"],["Level {} when the globe fills","球體填滿時升到等級 {1}"],["Evolves {} into {}, also needs:","將{1}進化為{2}，還需要："],["A portal to Act {} has opened","通往第 {1} 幕的傳送門已開啟"],["{}% Extra Gold from Monsters","從怪物身上多獲得 {1}% 金幣"],["Level {} {} Aura When Equipped","裝備時獲得等級 {1} 的{2}靈氣"],["Poison Length Reduced by {}%","中毒時間減少 {1}%"],["+{}% Bonus to Attack Rating","+{1}% 攻擊準確率加成"],["+{}% Increased Attack Speed","+{1}% 提高攻擊速度"],["{}% Chance of Crushing Blow","{1}% 機率造成壓碎性打擊"],["{}% Deadly Strike per Level","每級 {1}% 致命攻擊"],["Attacker Takes Damage of {}","攻擊者受到 {1} 傷害"],["Level {} now and {} at level {}","目前等級 {1}，在等級 {3} 時為 {2}"],["Next {} at character level {}","角色等級 {2} 時獲得下一個{1}"],["The portal takes you in {}…","傳送門將在 {1} 後帶你離開…"],["{}% Chance to cast level {} {} {}","{4}有 {1}% 機率施放等級 {2} 的{3}"],["Magic Damage Reduced by {}","魔法傷害減少 {1}"],["Base Damage Reduction: {}%","基礎傷害減免：{1}%"],["Skills recharge {}% faster","技能冷卻快 {1}%"],["Press {} or click to drink","按 {1} 或點擊飲用"],["{}% Chance of Open Wounds","{1}% 機率造成撕裂傷口"],["{} Receives Bonuses From:","{1} 從以下技能獲得加成："],["+{}% damage per level of {}","{2}每級 +{1}% 傷害"],["+{}% per level of {} skills","{2}技能每級 +{1}%"],["A portal to {} has opened","通往{1}的傳送門已開啟"],["+{} Life after each Kill","每次擊殺 +{1} 生命"],["+{}% Faster Hit Recovery","+{1}% 快速打擊恢復"],["{}: {} at character level {}","{1}：角色等級 {3} 時 {2}"],["+5 starting {} per rank\n{}","每級起始 {1} +5\n{2}"],["Only the {} can use that{}","只有{1}能使用{2}"],["{}% Life Stolen Per Hit","擊中偷取 {1}% 生命"],["{}% Mana Stolen Per Hit","擊中偷取 {1}% 法力"],["One-Hand Damage: {} to {}","單手傷害：{1} 至 {2}"],["Two-Hand Damage: {} to {}","雙手傷害：{1} 至 {2}"],["+{}% Faster Block Rate","+{1}% 快速格擋率"],["Synergies: +{}% damage","協同加成：+{1}% 傷害"],["in your next run on {}","在你下一輪的{1}難度"],["+{} to Life per Level","每級 +{1} 生命"],["+{} to Mana per Level","每級 +{1} 法力"],["+{}% Damage to Demons","+{1}% 對惡魔的傷害"],["+{}% Damage to Undead","+{1}% 對不死生物的傷害"],["+{}% Enhanced Defense","+{1}% 增強防禦"],["+{}% Faster Cast Rate","+{1}% 快速施法率"],["Level {} {} ({}/{} Charges)","等級 {1} {2}（{3}/{4} 次）"],["Lightning Resist +{}%","閃電抗性 +{1}%"],["Damage Reduced by {}%","傷害減少 {1}%"],["Evolves from {} with {}","由{1}搭配{2}進化而來"],["Another run as the {}","以{1}再玩一輪"],["Slay Baal on {} first","請先在{1}難度擊敗巴爾"],["The {} is coming soon","{1}即將推出"],["+{} to {} Skill Levels","+{1} {2}技能等級"],["+{} Lightning Absorb","+{1} 閃電吸收"],["+{}% Enhanced Damage","+{1}% 增強傷害"],["+{}% Faster Run/Walk","+{1}% 快速跑步／行走"],["Lightning Absorb {}%","閃電吸收 {1}%"],["Damage Reduced by {}","傷害減少 {1}"],["{} shorter cooldowns","冷卻時間縮短 {1}"],["The portal to Act {}","通往第 {1} 幕的傳送門"],["Less {} damage taken{}","受到的{1}傷害減少{2}"],["{} · Level {#} · {#} kills","{1} · 等級 {2} · {3} 擊殺"],["-{}% Target Defense","-{1}% 目標防禦"],["{}% Piercing Attack","{1}% 穿透攻擊"],["All Resistances +{}","所有抗性 +{1}"],["Slows Target by {}%","目標緩速 {1}%"],["Attack Damage: +{}%","攻擊傷害：+{1}%"],["{#} Damage per Level","每級 {1} 傷害"],["{} is open to the {}.","{1}已向{2}開放。"],["+{} Average Damage","+{1} 平均傷害"],["+{}% Attack Damage","+{1}% 攻擊傷害"],["+{}% Pickup Radius","+{1}% 拾取範圍"],["Poison Resist +{}%","毒素抗性 +{1}%"],["Freezes Target +{}","冰凍目標 +{1}"],["Replenish Life +{}","補充生命 +{1}"],["Required Level: {}","需要等級：{1}"],["+{}% per level of {}","{2}每級 +{1}%"],["Monsters slain: {}","擊殺怪物：{1}"],["Up to {#} skeletons","最多 {1} 具骷髏"],["+{} to All Skills","+{1} 所有技能"],["+{}% maximum life","+{1}% 生命上限"],["{}% Deadly Strike","{1}% 致命攻擊"],["Base Damage: +{}%","基礎傷害：+{1}%"],["Sells for {} gold","售價 {1} 金幣"],["Sold {} for {} gold","以 {2} 金幣賣出{1}"],["Experience: {} / {}","經驗值：{1} / {2}"],["{} evolved into {}!","{1}已進化為{2}！"],["Build {} is ready","版本 {1} 已就緒"],["Adds {}-{} {} Damage","增加 {1}-{2} {3}傷害"],["+{} magic damage","+{1} 魔法傷害"],["Cold Resist +{}%","冰寒抗性 +{1}%"],["Fire Resist +{}%","火焰抗性 +{1}%"],["{} over {} seconds","{1}，持續 {2} 秒"],["You have {} gold","你有 {1} 金幣"],["Evolves into {}:","進化為{1}："],["{#} hits a second","每秒 {1} 次"],["{#} charged bolts","{1} 道充能彈"],[" (+{} from gear)","（裝備 +{1}）"],["Adds {}-{} Damage","增加 {1}-{2} 傷害"],["+{} Cold Absorb","+{1} 冰寒吸收"],["+{} Fire Absorb","+{1} 火焰吸收"],["Cold Absorb {}%","冰寒吸收 {1}%"],["Fire Absorb {}%","火焰吸收 {1}%"],["Now +{}% damage","目前 +{1}% 傷害"],["Loading the {}…","正在載入{1}…"],["{} on Nightmare","{1}（惡夢）"],[" on Nightmare","（惡夢）"],["{#} magic arrows","{1} 支魔法箭"],["Evolved from {}","由{1}進化而來"],["+{} to {} Skills","+{1} {2}技能"],["Sold by the {}","由{1}出售"],["Per second: {}","每秒：{1}"],["Keeps level {}","保留等級 {1}"],["{}: {} at level {}","{1}：等級 {3} 時 {2}"],["Back to the {}","回到{1}"],["{#} fire arrows","{1} 支火焰箭"],["{#} magic arrow","{1} 支魔法箭"],["{#} swift blows","{1} 次快速攻擊"],["when you Die","死亡時"],["{#} {} per Level","每級 {1} {2}"],["Best time: {}","最佳紀錄：{1}"],["Passives {}/6","被動技能 {1}/6"],["from level {}","從等級 {1} 起"],["{} approaches","{1}逼近了"],["{#} fire bolts","{1} 道火彈"],["{#} fire balls","{1} 顆火球"],["{#} fire arrow","{1} 支火焰箭"],["{#} swift blow","{1} 次快速攻擊"],["when struck","被擊中時"],["on striking","擊中時"],["{#} per Level","每級 {1}"],["{#} per level","每級 {1}"],["and {} more.","還有 {1} 個。"],["{#} ice bolts","{1} 道冰彈"],["{#} skeletons","{1} 具骷髏"],["Level {#} to {#}","等級 {1} → {2}"],["+{#} {} Damage","+{1} {2}傷害"],["+{}% Damage","+{1}% 傷害"],["If worn: {}","裝備時：{1}"],["Level {} / {}","等級 {1} / {2}"],["Life: {} / {}","生命：{1} / {2}"],["Skills {}/6","技能 {1}/6"],["Replaces {}","取代{1}"],["{} has come","{1}來了"],["{#} javelins","{1} 支標槍"],["{#} monsters","{1} 隻怪物"],["{#} javelins","{1} 支標槍"],["{#} monsters","{1} 隻怪物"],["{#} skeleton","{1} 具骷髏"],["{#} twisters","{1} 道扭曲旋風"],["Saved in {}","儲存於{1}"],["Rank {} / {}","等級 {1} / {2}"],["Act {}: {}. {}","第 {1} 幕：{2}。{3}"],["{} weakens","{1}變弱了"],["{#} Regular","{1} 一般"],["{#} hammers","{1} 把戰鎚"],["{#} meteors","{1} 顆隕石"],["{} on Hell","{1}（地獄）"],[" on Hell","（地獄）"],["{#} hammers","{1} 把祝福之槌"],["{#} javelin","{1} 支標槍"],["{#} monster","{1} 隻怪物"],["{#} twister","{1} 道扭曲旋風"],["{} Level {#}","{1}第 {2} 層"],["{} upkeep","{1}維持"],["{#} arrows","{1} 支箭"],["{#} spears","{1} 支矛"],["{#} blades","{1} 把刀刃"],["{#} arrows","{1} 支箭"],["{#} hammer","{1} 把祝福之槌"],["{#} sparks","{1} 道火花"],["+{#}% to {}","+{1}% {2}"],["+{} gold","+{1} 金幣"],["Cost: {}","價格：{1}"],["Level {#}","等級 {1}"],["level {#}","等級 {1}"],["Up to {#}","最多 {1}"],["New {} {}/{}","新{1} {2}/{3}"],["Drop {}?","丟棄{1}？"],["Act {}: {}","第 {1} 幕：{2}"],["{} (Esc)","{1}（Esc）"],["{#} bolts","{1} 道彈矢"],["{#} kills","{1} 擊殺"],["{#} arrow","{1} 支箭"],["{#} bolts","{1} 道彈矢"],["{#} kicks","{1} 次踢擊"],["{#} spark","{1} 道火花"],["Up to {}","最多 {1}"],["max {#}/{#},","上限 {1}/{2}，"],["max {#}/{#}.","上限 {1}/{2}。"],["+{#} to {}","+{1} {2}"],["-{#} to {}","-{1} {2}"],["{#}% to {}","{1}% {2}"],["{#} gold","{1} 金幣"],["best {}","最佳 {1}"],["{} trap","{1}陷阱"],["{#} of 3","{1} / 3"],["{}: OFF","{1}：關"],["{#} axes","{1} 把斧頭"],["{#} bolt","{1} 道彈矢"],["{#} kick","{1} 次踢擊"],["{#} webs","{1} 張網"],["max {#}/{#}","上限 {1}/{2}"],["ACT {#}","第 {1} 幕"],["Act {#}","第 {1} 幕"],["{#} web","{1} 張網"]],"skillTags":{"Magic Arrow":"魔法","Fire Arrow":"魔法","Cold Arrow":"魔法","Exploding Arrow":"魔法","Multiple Shot":"物理","Guided Arrow":"物理","Jab":"物理","Power Strike":"魔法","Poison Javelin":"魔法","Impale":"物理","Lightning Bolt":"魔法","Valkyrie":"物理","Ice Arrow":"魔法","Strafe":"物理","Fend":"物理","Charged Strike":"魔法","Lightning Strike":"魔法","Plague Javelin":"魔法","Lightning Fury":"魔法","Freezing Arrow":"魔法","Immolation Arrow":"魔法","Widowmaker":"物理","Fire Bolt":"魔法","Ice Bolt":"魔法","Charged Bolt":"魔法","Nova":"魔法","Blaze":"魔法","Inferno":"魔法","Hydra":"魔法","Frost Nova":"魔法","Ice Blast":"魔法","Fire Ball":"魔法","Meteor":"魔法","Frozen Orb":"魔法","Chain Lightning":"魔法","Thunder Storm":"魔法","Fire Wall":"魔法","Glacial Spike":"魔法","Blizzard":"魔法","Shiver Armor":"魔法","Chilling Armor":"魔法","Teeth":"魔法","Poison Dagger":"魔法","Raise Skeleton":"物理","Raise Skeletal Mage":"魔法","Clay Golem":"物理","Bone Spear":"魔法","Bone Spirit":"魔法","Poison Explosion":"魔法","Poison Nova":"魔法","Revive":"物理","Blood Golem":"物理","Iron Golem":"物理","Fire Golem":"魔法","Fire Blast":"魔法","Shock Web":"魔法","Charged Bolt Sentry":"魔法","Blade Sentinel":"物理","Tiger Strike":"物理","Cobra Strike":"物理","Fists of Fire":"魔法","Dragon Talon":"物理","Psychic Hammer":"魔法","Shadow Warrior":"物理","Wake of Fire":"魔法","Wake of Inferno":"魔法","Lightning Sentry":"魔法","Death Sentry":"魔法","Blade Fury":"物理","Blade Shield":"物理","Phoenix Strike":"魔法","Claws of Thunder":"魔法","Blades of Ice":"魔法","Dragon Claw":"物理","Dragon Tail":"魔法","Dragon Flight":"物理","Mind Blast":"魔法","Shadow Master":"物理","Double Swing":"物理","Bash":"物理","Stun":"物理","Leap":"物理","Double Throw":"物理","Whirlwind":"物理","War Cry":"物理","Frenzy":"物理","Concentrate":"物理","Berserk":"魔法","Leap Attack":"物理","Lacerator":"物理","Blessed Hammer":"魔法","Holy Bolt":"魔法","Zeal":"物理","Charge":"物理","Holy Shield":"魔法","Smite":"物理","Sacrifice":"物理","Vengeance":"魔法","Zakarum's Hand":"魔法","Fist of the Heavens":"魔法","Passion":"物理","Herald of Zakarum":"物理","Exile":"魔法","Firestorm":"魔法","Arctic Blast":"魔法","Fissure":"魔法","Twister":"物理","Raven":"物理","Poison Creeper":"魔法","Werewolf":"物理","Werebear":"物理","Molten Boulder":"魔法","Volcano":"魔法","Armageddon":"魔法","Tornado":"物理","Hurricane":"魔法","Summon Spirit Wolf":"物理","Summon Dire Wolf":"物理","Summon Grizzly":"物理","Fury":"物理","Maul":"物理","Shock Wave":"物理"}};
// 2026-10 遊戲改版（build 20261020）新增／改寫的字串。鍵的寫法跟遊戲內建的韓文翻譯一樣：
// # = 數字、* = 任意文字，{0}{1}… 依序代入（* 代入的文字會再翻譯一次）。words 也會拿來翻句子裡的單字（例如稀有物品名稱的前後綴）。
const D2ZH_FIX = {
words: {
'Barb': '倒鉤', 'Bludgeon': '重棍', 'Glare': '怒視', 'Impaler': '穿刺者', 'Gem': '寶石',
'January': '一月', 'February': '二月', 'March': '三月', 'April': '四月', 'May': '五月', 'June': '六月', 'July': '七月',
'August': '八月', 'September': '九月', 'October': '十月', 'November': '十一月', 'December': '十二月', "Angel's": '天使', 'Antimagic': '反魔法', "Arch-Angel's": '大天使', "Archer's": '弓箭手',
"Athlete's": '運動員', 'Berserker': '狂戰士', "Berserker's": '狂戰士', 'Blighting': '枯萎',
'Bloody': '血腥', "Bowyer's": '製弓匠', 'Calling': '呼喚', "Caretaker's": '看護者', 'Charged': '充能', "Commander's": '指揮官', 'Communal': '共有', 'Devious': '狡猾', 'Eagleeye': '鷹眼', 'Elysian': '極樂', 'Eocene': '始新世',
'Exile': '流放者', 'Falconeye': '隼眼', 'Forked': '分叉', 'Fortified': '強化', 'Freezing': '冰凍', 'Furious': '狂怒',
"Gaea's": '蓋亞', 'Ghostly': '幽靈', "Golemlord's": '魔像領主', 'Gritty': '堅毅', "Gymnast's": '體操家',
"Hierophant's": '祭司', "Jester's": '弄臣', "Joker's": '小丑',
"Keeper's": '守護者', "Kenshi's": '劍士', "Knave's": '惡棍', "Lancer's": '槍騎兵', 'Loud': '響亮', "Magekiller's": '法師殺手',
"Maiden's": '少女', "Marshal's": '元帥', 'Miocene': '中新世', "Monk's": '僧侶', 'Null': '無效', 'Oligocene': '漸新世',
'Paleocene': '古新世', 'Paradox': '悖論', "Priest's": '牧師',
'Red': '紅色', 'Robineye': '知更鳥眼', 'Screaming': '尖叫',
"Sensei's": '師範', 'Serrated': '鋸齒', "Shaman's": '薩滿', 'Shouting': '吶喊', 'Sparroweye': '麻雀眼', "Spearmaiden's": '長矛少女',
"Terra's": '大地', "Trickster's": '詐欺師', 'Trump': '王牌', 'Venomous': '劇毒',
"Veteran's": '老兵', 'Vodoun': '巫毒', "Warder's": '看守者',
"Witch-hunter's": '獵巫者', 'Yelling': '叫喊',
'of Balance': '平衡之', 'of Bliss': '至福之', 'of Ennui': '倦怠之', 'of Envy': '嫉妒之', 'of Frigidity': '嚴寒之', 'of Grace': '優雅之',
'of Grace and Power': '優雅與力量之', 'of Icebolt': '冰彈之', 'of Joyfulness': '喜悅之', 'of Power': '力量之', 'of Stability': '穩定之',
'of the Cobra': '眼鏡蛇之', 'of the Efreeti': '火精之', 'of the Elements': '元素之', 'of the Phoenix': '鳳凰之', 'of the Yeti': '雪人之',
'creeper': '爬行者', 'kick': '踢擊', 'skeletal mage': '骷髏法師', 'spark': '電花', 'swift blow': '迅捷一擊', 'wearwolf': '狼人',
'dire wolves': '恐狼', 'spirit wolves': '靈狼', 'ravens': '烏鴉', 'tier': '層'
},
text: {
// 選單、按鈕
'PLAY': '開始遊戲', 'Play': '開始遊戲', 'RESUME': '繼續遊戲', 'SAVES': '存檔', 'Your saves': '你的存檔', 'SAVE AND EXIT': '儲存並離開',
'EXIT ANYWAY': '仍要離開', 'VIDEO OPTIONS': '影像選項', 'SHOW ITEMS': '顯示物品', 'SHOW ITEMS: *': '顯示物品：{0}', 'SKILL EFFECTS': '技能特效',
'WEBSITE': '官方網站', 'CREDITS': '製作群', 'NEXT TIER': '下一層', 'CREATE NEW HERO': '建立新英雄', 'SELECT HERO': '選擇英雄',
'DELETE': '刪除', 'YES': '是', 'NO': '否', 'START OVER': '重新開始', 'Start over?': '要重新開始嗎？', 'A fresh start?': '要全新開始嗎？',
'GET THE DESKTOP APP': '下載桌面版', 'Back to game': '回到遊戲', 'Back in your save': '已回到你的存檔',
'Enter to choose': 'Enter 選擇', 'Esc to go back': 'Esc 返回', 'Enter to choose, then press a button - Esc to go back': 'Enter 選擇，然後按下按鍵 - Esc 返回',
'Enter: next tier - T: Charsi\'s wares - Esc: end the run': 'Enter：下一層 - T：恰西的貨品 - Esc：結束這一輪',
'Tap a line to choose': '點一下要選的項目', 'Click for the skill tree (T)': '點擊開啟技能樹（T）', 'Tap again for the skill tree': '再點一下開啟技能樹',
'Shift: all points': 'Shift：全部點數', 'Stat Points': '屬性點數', 'New Stats': '新屬性點', 'Spends new stat points for you': '自動幫你分配新的屬性點',
'+# stat points': '+{0} 屬性點數', '+# stat points to spend': '+{0} 屬性點數可分配', 'Stat points remaining: *': '剩餘屬性點數：{0}', 'Add a point to *': '在{0}加一點',
// 技能等級（舊規則 "{} Level {#}" 會翻成「第 N 層」，那是地圖區域用的）
'Level # to #': '升級至等級 {1}', 'Level # to # (max)': '升級至等級 {1}（最高）', 'Level #': '等級 {0}', 'next level': '下一級',
'Level # / #': '等級 {0} / {1}', 'Level # / # (+# from gear)': '等級 {0} / {1}（裝備 +{2}）', 'Keeps level #': '保持等級 {0}',
'Level # now and # at level #': '現在等級 {0}，角色等級 {2} 時為 {1}', 'from level #': '從等級 {0} 起', 'Evolved from *': '由{0}進化',
'Level # * (#/# Charges)': '等級 {0} {1}（{2}/{3} 次充能）', 'Level # * Aura When Equipped': '裝備時有等級 {0} 的{1}靈氣',
'*: * at level *': '{0}：等級 {2} 時 {1}', '*: * at character level *': '{0}：角色等級 {2} 時 {1}', 'Next * at character level *': '下一個{0}：角色等級 {1}',
'Next rank': '下一級', 'Next rank:': '下一級：', 'Rank *': '第 {0} 級', 'Past rank *': '超過第 {0} 級', 'Past rank *:': '超過第 {0} 級：',
'Remaining': '剩餘', 'Resurrect': '復活', 'Earlier': '更早', 'Latest': '最新', 'Loading…': '載入中…', 'Chest': '寶箱',
'From the chests:': '來自寶箱：', 'Into the stash:': '放進儲物箱：', 'Personal': '個人', 'Shared': '共用', 'No room in this tab': '這個分頁沒有空間',
'Only this hero can reach it': '只有這個英雄拿得到', 'Healing -40%': '治療 -40%', '- ready to evolve': '－可以進化', 'Evolves from *:': '由{0}進化：',
'A note from the developer': '開發者的話', 'Korean translation': '韓文翻譯', 'It takes you when the bar runs out': '量表用完時就會把你帶走',
'Nothing new since your last visit': '上次來訪後沒有新內容', 'Since your last visit': '自上次來訪以來', 'Your hero is saved': '你的英雄已儲存',
'Press the button for it': '請按下要設定的按鍵', 'Button *': '按鍵 {0}', 'Circle': '○', 'Cross': '✕', 'Square': '□', 'Triangle': '△', 'Minus': '−', 'Plus': '＋',
'Units': '單位', 'Floor tiles': '地板', 'Missiles': '投射物', 'Heroes': '英雄', 'Gear': '裝備', 'Interface': '介面', 'Scenery': '場景', 'Title and menus': '標題與選單',
'Sounds and music': '音效與音樂', 'and': '和', 'or': '或', 'Demon': '惡魔', 'max #/#': '最多 {0}/{1}', 'Build *': '版本 {0}',
'Harrogath': '哈洛加斯', 'Harem Level 1': '後宮第 1 層', 'Hratli': '赫拉特利', 'Larzuk': '拉蘇克', 'Patriarch': '族長', 'Matriarch': '女族長',
'toughest monster': '最強的怪物', '# toughest monsters': '{0} 隻最強的怪物', 'monster level #': '怪物等級 {0}', 'One blow took more than half your life': '一擊就打掉你超過一半的生命',
// 恐懼層、營火、一輪的結算
'The Terror tiers are open': '恐懼層已開放', 'the Terror tiers': '恐懼層', 'No tier cleared yet': '還沒有通過任何一層', 'Best tier: #': '最佳層數：{0}',
'TERROR TIER #': '恐懼第 {0} 層', 'Terror tier # cleared': '恐懼第 {0} 層已通過', 'Terror tier #: monster level #': '恐懼第 {0} 層：怪物等級 {1}',
'Tier # is open.': '第 {0} 層已開放。', 'on Terror tier #': '恐懼第 {0} 層', '* on Terror tier *': '{0}，恐懼第 {1} 層',
'Each pays +#% MF · +#% XP · +#% gold': '每項獎勵：尋獲魔法物品 +{0}% · 經驗值 +{1}% · 金幣 +{2}%',
'Each pays ×# drops · +#% MF · +#% XP · +#% gold': '每項獎勵：掉落 ×{0} · 尋獲魔法物品 +{1}% · 經驗值 +{2}% · 金幣 +{3}%',
'More Elite Packs': '更多精英怪群', 'No Potions in the Belt': '腰帶不能放藥水', 'Possessed Champions': '被附身的冠軍怪物', 'Skills never run out of mana here': '在這裡技能永遠不會耗盡法力',
'CONTINUE starts Terror tier * over, at level *. Leaving any other way counts as a death.': '「繼續」會從恐懼第 {0} 層重新開始，等級 {1}。用其他方式離開會算作死亡。',
'From the campfire, TERROR starts your level-* * on tier 1: one act of Hell at monster level *. Clear it to open the next.': '在營火選「恐懼」，會讓你等級 {0} 的{1}從第 1 層開始：一幕地獄，怪物等級 {2}。通過後開放下一層。',
'CONTINUE starts * over from its start, at level *. Your items and gold are kept.': '「繼續」會從{0}的開頭重新開始，等級 {1}。物品和金幣會保留。',
'Act I is not saved: your next run starts anew. Your items and gold are kept.': '第一幕不會存檔：下一輪會重新開始。物品和金幣會保留。',
'and continue the run': '並繼續這一輪', 'Could not start as the hero who beat Baal': '無法以擊敗巴爾的英雄開始', 'Bring it back to Tristram, in a harder world.': '把它帶回崔斯特姆，在更難的世界。',
'Saved at the start of *': '{0}開始時存檔', 'Saved at the start of *, level *': '{0}開始時存檔，等級 {1}', 'Saved at the start of * on *': '{1}{0}開始時存檔',
'Saved at the start of * on *, level *': '{1}{0}開始時存檔，等級 {2}', 'Saved at the start of * on Terror *': '恐懼第 {1} 層{0}開始時存檔',
'Saved at the start of * on Terror *, level *': '恐懼第 {1} 層{0}開始時存檔，等級 {2}', 'As *, level *, from Act I': '以{0}，等級 {1}，從第一幕開始',
'Your level-* *': '你等級 {0} 的{1}', '*: your level-* *': '{0}：你等級 {1} 的{2}', '*: a new hero at level 1': '{0}：等級 1 的新英雄',
'Your level-* * can now enter the Terror tiers.': '你等級 {0} 的{1}現在可以進入恐懼層了。', 'Your level-* * can now enter *.': '你等級 {0} 的{1}現在可以進入{2}。',
'From the campfire, * now starts as your level-* *.': '從營火開始，{0}現在會以你等級 {1} 的{2}開始。',
'A new hero starts at level 1. Beat Baal on * to carry your hero into *.': '新英雄從等級 1 開始。在{0}擊敗巴爾，就能把英雄帶進{1}。',
'You cleared * in *, at level *.': '你在 {1} 內通過{0}，等級 {2}。', 'You cleared all five acts* in *, at level *.': '你{0}在 {1} 內通過全部五幕，等級 {2}。',
'The Worldstone is safe. You cleared all five acts* in *, at level *, having slain * monsters. +* gold.**': '世界之石安全了。你{0}在 {1} 內通過全部五幕，等級 {2}，擊殺 {3} 隻怪物。+{4} 金幣。{5}{6}',
'You fell in ** after *, at level *.': '你在{0}{1}倒下，撐了 {2}，等級 {3}。',
'You fell in ** after *, at level *, having slain * monsters. +* gold. *.': '你在{0}{1}倒下，撐了 {2}，等級 {3}，擊殺 {4} 隻怪物。+{5} 金幣。{6}。',
'You fell in ** after *, at level *, having slain * monsters. +* gold (best: *).': '你在{0}{1}倒下，撐了 {2}，等級 {3}，擊殺 {4} 隻怪物。+{5} 金幣（最佳：{6}）。',
'Slain by *\'s *: * * damage': '被{0}的{1}殺死：{2} {3}傷害', 'Slain by *: * * damage': '被{0}殺死：{1} {2}傷害',
'# damage in the last second': '最近 1 秒 {0} 傷害', '# damage in the last # seconds': '最近 {1} 秒 {0} 傷害', '# monsters slain': '擊殺 {0} 隻怪物', 'New best time: *': '新的最佳紀錄：{0}',
'Walk into the portal to *': '走進傳送門前往{0}', 'Walk into the portal to Act #': '走進傳送門前往第 {0} 幕',
// 商店、物品
'Charsi won\'t buy that': '恰西不收購這個', '* won\'t buy that': '{0}不收購這個', '*\'s Wares': '{0}的貨品', '*\'s wares (B)': '{0}的貨品（B）', '*\'s wares (G)': '{0}的貨品（G）',
'Imbue it into a rare': '把它灌注成稀有物品', 'Chipped Gem': '碎裂的寶石', 'Flawed Gem': '瑕疵的寶石', 'Flawless Gem': '無瑕的寶石',
'Minor Healing Potion': '輕微治療藥水', 'Light Healing Potion': '輕型治療藥水', 'Greater Healing Potion': '強效治療藥水', 'Super Healing Potion': '超級治療藥水',
'Required Dexterity:': '需要敏捷：', 'Required Level:': '需要等級：', 'Required Strength:': '需要力量：', 'One-Hand Damage:': '單手傷害：', 'Two-Hand Damage:': '雙手傷害：',
'Average Damage': '平均傷害', 'Absorbs Cold Damage': '吸收冰寒傷害', 'Absorbs Lightning Damage': '吸收閃電傷害', 'all Attributes': '所有屬性',
'Defense vs. Melee': '對近戰防禦', 'Increase Maximum Life': '增加生命上限', 'Heals * Life': '恢復 {0} 生命', 'Regenerate # life per second': '每秒恢復 {0} 生命',
'Repairs # durability per second': '每秒修復 {0} 耐久度', 'Pick things up from #% farther away': '拾取範圍增加 {0}%', '(#/# Charges)': '（{0}/{1} 次充能）', '(+* from gear)': '（裝備 +{0}）',
'to Barbarian Skill Levels': '野蠻人技能等級', 'to Necromancer Skill Levels': '死靈法師技能等級', 'to Paladin Skill Levels': '聖騎士技能等級', 'to Sorceress Skill Levels': '女巫技能等級',
'to Enemy Cold Resistance': '敵人冰寒抗性', 'to Maximum Magic Damage': '最大魔法傷害', 'to Minimum Magic Damage': '最小魔法傷害', 'to Experience Gained': '獲得經驗值',
'+# to Bow and Crossbow Skills': '+{0} 弓和十字弓技能', '+# to Combat Skills': '+{0} 戰鬥技能', '+# to Javelin and Spear Skills': '+{0} 標槍和長矛技能',
'+# to Passive and Magic Skills': '+{0} 被動和魔法技能', '+#% to Maximum Cold Resist': '+{0}% 最大冰寒抗性',
// 死靈法師技能樹（照易牙居技能頁：召喚技能／毒素和白骨技能／詛咒技能）
'Poison and Bone Skills': '毒素和白骨技能', '+# to Poison and Bone Skills': '+{0} 毒素和白骨技能',
'Summoning Skills': '召喚技能', '+# to Summoning Skills': '+{0} 召喚技能', 'Curses': '詛咒技能', '+# to Curses': '+{0} 詛咒技能',
'Shape Shifting Skills': '外形變形技能', '+# to Shape Shifting Skills': '+{0} 外形變形技能', '+# to Elemental Skills': '+{0} 元素技能',
'+* to * (* Only)': '+{0} {1}（限{2}）', '*% Chance to cast level * * when you Kill an Enemy': '擊殺敵人時有 {0}% 機率施放等級 {1} 的{2}',
'*% Chance to cast level * * when you Level-Up': '升級時有 {0}% 機率施放等級 {1} 的{2}',
'+#% better chance of magic items per rank': '每級尋獲魔法物品機率 +{0}%', 'Come back at half life once more per run, per rank': '每級：每一輪多一次以一半生命復活',
'+* starting * per rank *': '每級起始{1} +{0}\n{2}', '+#% damage with a bow or claws': '弓或爪 +{0}% 傷害',
'+5% physical damage, none with a bow': '+5% 物理傷害（弓除外）', '+5% physical damage none with a bow': '+5% 物理傷害（弓除外）', 'none with a bow': '弓除外',
'+1% critical strike chance +3% damage with a bow or claws': '+1% 致命一擊機率，弓或爪 +3% 傷害', '+1% chance of a critical strike, +3% damage with a bow or claws': '+1% 致命一擊機率，弓或爪 +3% 傷害',
'Each point past the class\'s: +#% critical strike chance, +#% weapon damage': '超過職業初始值的每一點：+{0}% 致命一擊機率，+{1}% 武器傷害',
'Each point past the class\'s: +#% physical damage': '超過職業初始值的每一點：+{0}% 物理傷害',
'Each point past the class\'s is +#% fire, cold, lightning, poison and magic damage': '超過職業初始值的每一點：+{0}% 火焰、冰寒、閃電、毒素與魔法傷害',
'With this weapon, +#% a point on its blows, as D2\'s weapons give': '使用這把武器時，每點讓攻擊 +{0}%，跟 D2 的武器一樣',
'Its weapon damage goes by the weapon, as D2\'s: all with a bow, none with an axe or a sword': '武器傷害依武器而定，跟 D2 一樣：弓全部適用，斧和劍不適用',
'Adds #% Attack Damage a percent': '每 1% 增加 {0}% 攻擊傷害', 'A level past a #\'s maximum still adds to it, as in D2': '超過{0}上限的等級仍然有效，跟 D2 一樣',
'Two-weapon skills swing or throw with both in turn': '雙武器技能會輪流用兩把武器揮擊或投擲', 'Right hand / left hand: each weapon strikes with its own damage': '右手／左手：每把武器用各自的傷害攻擊',
// 角色畫面說明
'More Defense: less damage from physical hits': '更多防禦：減少物理攻擊的傷害', 'Less damage from physical hits': '減少物理攻擊的傷害',
'Aura: more Defense, less damage from physical hits': '靈氣：更多防禦，減少物理攻擊的傷害', 'Every skill\'s damage a second, all together': '所有技能每秒傷害總和',
'Gear\'s +% Damage and shrines': '裝備的 +% 傷害與神殿', 'Mana from items, leech and kills speeds up casting:': '來自物品、吸取與擊殺的法力會加快施法：',
'Chance a physical hit takes a quarter of the monster\'s life, an eighth of a boss\'s; half that for missiles': '物理攻擊打掉怪物四分之一生命的機率（首領為八分之一；投射物減半）',
'Less damage from physical hits: gear\'s Damage Reduced and Defense, Charsi\'s ranks, skills\' Defense': '減少物理攻擊的傷害：裝備的傷害減少與防禦、恰西的升級、技能的防禦',
'At most 50%, as in D2; fire, cold, lightning, magic and poison go by resistances': '最多 50%，跟 D2 一樣；火焰、冰寒、閃電、魔法和毒素看抗性',
'Of every hit, after skills that take a share off them all (Energy Shield)': '每次受到攻擊時計算，在分攤傷害的技能（能量護盾）之後',
'More damage from weapon skills (arrows, javelins, blows, throws): the weapon\'s damage and gear\'s +% Attack Damage': '武器技能（箭矢、標槍、近戰、投擲）傷害更高：武器的傷害加上裝備的 +% 攻擊傷害',
'On a physical hit it adds with Strength\'s and Dexterity\'s bonus': '物理攻擊時跟力量與敏捷的加成相加',
'On a physical blow it adds with Strength and gear\'s +% Damage, as D2\'s bonuses do': '物理攻擊時跟力量和裝備的 +% 傷害相加，跟 D2 的加成方式一樣',
'Speeds up casting: a quarter of a percent Faster Cast Rate a point': '加快施法：每點 0.25% 快速施法率', 'Speeds up casting: Faster Cast Rate, as what fighting pours in': '加快施法：快速施法率，以及戰鬥中補充的法力',
'Weapon skills and some spells can critically strike: a skill\'s hover shows its chance': '武器技能和部分法術可以致命一擊：滑鼠移到技能上會顯示機率',
'At most #%, more with +% to Maximum Resist': '最多 {0}%，有 +% 最大抗性時更高', ', after this difficulty\'s #': '，已計入此難度的 {0}', '#% less damage taken': '受到的傷害減少 {0}%',
'-#% to Enemy Resistance: +#% damage, +#% at #% resistance': '-{0}% 敵人抗性：+{1}% 傷害，對 {3}% 抗性時 +{2}%',
'Drops roll their quality by D2\'s own formula: the item first, then its chance to be unique, rare or magic, so uniques and rares are far scarcer and Magic Find counts for more': '掉落物品的品質照 D2 原本的公式決定：先決定物品，再判定是獨特、稀有或魔法，所以獨特和稀有少很多，尋獲魔法物品機率更有價值',
'Terror tiers drop far fewer items: about Hell\'s count, paying instead in better finds through their Magic Find and item level': '恐懼層掉落的物品少很多：大約跟地獄一樣，改成透過尋獲魔法物品機率和物品等級掉出更好的東西',
// 技能說明
'freeze what they hit': '凍結命中的目標', 'freezes what it hits': '凍結命中的目標', ', passing through #': '，穿透 {0} 隻', '# hits': '命中 {0} 次', '* hits a second': '每秒命中 {0} 次',
'* a cast, every * s': '每次施放 {0}，每 {1} 秒', '*: active': '{0}：啟用中', 'Chance a physical hit makes the monster bleed for # seconds': '物理攻擊使怪物流血 {0} 秒的機率',
'A wall of fire across the monsters nearby that burns for #s': '在附近怪物之間燃起一道火牆，持續 {0} 秒', 'A wall of fire across the path ahead that burns for #s': '在前方路上燃起一道火牆，持續 {0} 秒',
'# arrows that burst into freezing ice, # damage around what they hit and a #s chill': '{0} 支箭矢爆成冰凍寒冰，在命中處周圍造成 {1} 傷害並冰冷 {2} 秒',
'# arrows that explode for # damage and leave the ground burning for #s': '{0} 支箭矢爆炸造成 {1} 傷害，地面燃燒 {2} 秒',
'# axes thrown at the monsters around you, # damage each, passing through #': '向周圍怪物投擲 {0} 把斧頭，每把 {1} 傷害，穿透 {2} 隻',
'# blades thrown at the monsters around you, # damage each, passing through one': '向周圍怪物投擲 {0} 把刀刃，每把 {1} 傷害，穿透 1 隻',
'# fire balls at the nearest monsters, bursting on impact for # damage around': '向最近的怪物發射 {0} 顆火球，命中時爆炸對周圍造成 {1} 傷害',
'# fire trails, # yards, at the nearest monster, burning # damage # times a second': '向最近的怪物放出 {0} 道火焰軌跡，長 {1} 碼，每秒燃燒 {3} 次，每次 {2} 傷害',
'# frenzied blows over the monsters in a wide reach (every other at a boss), # damage each': '對大範圍內的怪物狂亂攻擊 {0} 次（首領每隔一次），每次 {1} 傷害',
'# frenzied blows in a wide reach, # damage each, on one monster until it falls; each sweeps #% through those beside it': '在大範圍內狂亂攻擊 {0} 次，每次 {1} 傷害，集中攻擊一隻怪物直到倒下；每擊對旁邊的怪物造成 {2}% 掃擊',
'# guided arrows that hunt through # monsters each, # damage': '{0} 支導引箭矢，每支追擊 {1} 隻怪物，{2} 傷害',
'# javelins that burst into lightning forking to # monsters, # damage each': '{0} 支標槍爆成閃電，分叉擊中 {1} 隻怪物，每道 {2} 傷害',
'# javelins trailing poison that burst into a spreading cloud, # poison over #s to all within #': '{0} 支拖著毒素的標槍爆成擴散毒雲，{3} 範圍內所有目標在 {2} 秒內受到 {1} 毒素傷害',
'# molten boulders roll through all in their path, # damage, knockback, leaving fire': '{0} 顆熔岩巨石滾過路徑上所有目標，{1} 傷害並擊退，留下火焰',
'# of sparks over the nearest pack for #s, # damage # times a second': '在最近的怪群上方放出 {0} 電花，持續 {1} 秒，每秒 {3} 次，每次 {2} 傷害',
'# spikes at the nearest monsters burst for # damage, freezing all in the burst for #s': '向最近的怪物射出 {0} 根冰刺，爆炸造成 {1} 傷害，並冰凍範圍內所有目標 {2} 秒',
'# tornadoes wander the horde, # damage and a stun to each monster they pass': '{0} 道龍捲風在怪群中遊走，對經過的每隻怪物造成 {1} 傷害並暈眩',
'+#% chance to sidestep a monster\'s blow while you stand still': '站著不動時 +{0}% 機率閃避怪物的近戰攻擊',
'+#% chance to sidestep a monster\'s missile while you stand still': '站著不動時 +{0}% 機率閃避怪物的投射物',
'+#% cold damage and take #% less damage': '+{0}% 冰寒傷害，受到的傷害減少 {1}%', '+#% cold damage and +#% to fire, cold and lightning resistance': '+{0}% 冰寒傷害，火焰、冰寒與閃電抗性 +{1}%',
'+#% to all resistances; poison and chill wear off #% faster': '所有抗性 +{0}%；中毒和冰冷持續時間縮短 {1}%',
'+#% to all resistances, #% Damage Reduced; poison and chill wear off #% faster': '所有抗性 +{0}%，傷害減少 {1}%；中毒和冰冷持續時間縮短 {2}%',
'+#% movement speed (up to +#%) and #% shorter cooldowns': '+{0}% 移動速度（最多 +{1}%），冷卻時間縮短 {2}%',
'A blast of the mind over the nearest pack, # damage and a #s stun to all in it': '對最近的怪群發出心靈衝擊，範圍內全部 {0} 傷害並暈眩 {1} 秒',
'A charged thrust at the toughest monster in reach, # damage; # bolts crackle on from it, # each': '對範圍內最強的怪物充能刺擊，{0} 傷害；再迸出 {1} 道電彈，每道 {2}',
'A focused blow at the toughest monster in reach, # damage, splashing # to those beside it': '對範圍內最強的怪物集中一擊，{0} 傷害，旁邊的怪物受到 {1} 濺射',
'A grizzly, # damage a swipe, and the pack +#% damage; with # dire wolves, # spirit wolves and # ravens': '一隻灰熊，每爪 {0} 傷害，同伴傷害 +{1}%；另有 {2} 隻恐狼、{3} 隻靈狼和 {4} 隻烏鴉',
'A rapid volley of # arrows spread over the monsters around you, # damage each': '快速射出 {0} 支箭矢分散射向周圍怪物，每支 {1} 傷害',
'A reckless magic blow at the toughest in reach, # damage; you take #% more for a moment': '對範圍內最強的怪物魯莽魔法一擊，{0} 傷害；短時間內你受到的傷害增加 {1}%',
'A reckless magic blow at the toughest in reach, # damage; you take #% more physical damage while you swing': '對範圍內最強的怪物魯莽魔法一擊，{0} 傷害；揮擊時你受到的物理傷害增加 {1}%',
'A ring of poison out to #: # poison over #s to everything it touches': '向外擴散到 {0} 的毒環：碰到的目標在 {2} 秒內受到 {1} 毒素傷害',
'A sentry fires lightning # times, # damage, and blows up a corpse near it each time for # plus #% of its life': '哨塔發射閃電 {0} 次，{1} 傷害，每次引爆附近一具屍體，造成 {2} 加上屍體生命 {3}% 的傷害',
'A sentry near the nearest pack fires # bursts of # charged bolts, # damage each': '在最近的怪群附近設置哨塔，發射 {0} 輪、每輪 {1} 道充能彈，每道 {2} 傷害',
'A sentry near the nearest pack fires lightning through monsters in line # times, # damage': '在最近的怪群附近設置哨塔，發射直線貫穿怪物的閃電 {0} 次，{1} 傷害',
'A spear thrust at every monster around you in turn (up to #), # damage each': '依序刺擊周圍每隻怪物（最多 {0} 隻），每次 {1} 傷害',
'A thrust at the toughest monster in reach, # damage; lightning chains on through # more, # each': '刺擊範圍內最強的怪物，{0} 傷害；閃電再連鎖 {1} 隻，每隻 {2}',
'A trap near the nearest pack breathes fire at monsters # times, # flames of # damage to all in their path': '在最近的怪群附近設置陷阱，向怪物噴火 {0} 次，{1} 道火焰對路徑上所有目標造成 {2} 傷害',
'A trap near the nearest pack sends out # waves of fire, # damage to all they pass': '在最近的怪群附近設置陷阱，放出 {0} 波火焰，對經過的所有目標造成 {1} 傷害',
'A volcano under the nearest pack for #s, raining burning rocks, # damage each': '在最近的怪群下方召喚火山 {0} 秒，落下燃燒的岩石，每顆 {1} 傷害',
'An orb that sprays chilling ice shards in every direction, # damage each': '向四面八方噴出寒冰碎片的法球，每片 {0} 傷害',
'Aura: +#% cold resistance, and +#% to its maximum (#%) a level learned; chill wears off #% faster': '靈氣：+{0}% 冰寒抗性，每學一級最大值 +{1}%（{2}%）；冰冷持續時間縮短 {3}%',
'Aura: +#% fire resistance, and +#% to its maximum (#%) a level learned': '靈氣：+{0}% 火焰抗性，每學一級最大值 +{1}%（{2}%）',
'Aura: +#% lightning resistance, and +#% to its maximum (#%) a level learned': '靈氣：+{0}% 閃電抗性，每學一級最大值 +{1}%（{2}%）',
'Aura: monsters around you resist fire, cold and lightning #% less, +#% a level (a fifth of it if immune)': '靈氣：周圍怪物的火焰、冰寒與閃電抗性降低 {0}%，每級 +{1}%（免疫的怪物只有五分之一）',
'Aura: monsters around you resist fire, cold and lightning #% less (a fifth of it if immune)': '靈氣：周圍怪物的火焰、冰寒與閃電抗性降低 {0}%（免疫的怪物只有五分之一）',
'Aura: skills recharge #% faster, +#% physical damage': '靈氣：技能冷卻加快 {0}%，+{1}% 物理傷害', 'Aura: skills recharge #% faster, +#% physical damage, +#% a level': '靈氣：技能冷卻加快 {0}%，+{1}% 物理傷害，每級 +{2}%',
'Aura: take #% less damage': '靈氣：受到的傷害減少 {0}%', 'Aura: monsters that strike you in melee take back #% of the blow': '靈氣：近戰攻擊你的怪物會承受 {0}% 的反傷',
'Aura: monsters slain near you heal you # life, #% of the time': '靈氣：在你附近被殺的怪物有 {1}% 機率為你恢復 {0} 生命',
'Aura: monsters close to you are hurt and thrown out, # damage twice a second': '靈氣：靠近你的怪物會受傷並被彈開，每秒兩次 {0} 傷害',
'Banish* · *': '放逐{0} · {1}', 'Reroll* · *': '重抽{0} · {1}', 'Skip* · *': '略過{0} · {1}', 'Battle Orders, and +# to all your skills': '戰鬥體制，並且所有技能 +{0}',
'Blades spin around you, # damage to all beside you # times a second, and fly off at monsters for #': '刀刃環繞你旋轉，每秒 {1} 次對身旁所有目標造成 {0} 傷害，並飛向怪物造成 {2}',
'Charge # times along your path, # damage in the way, a holy burst at each stop': '沿路衝鋒 {0} 次，路上造成 {1} 傷害，每次停下時發出神聖爆發',
'Chilling Armor, #s: melee attackers take # cold, chilled #s; shooters a # ice bolt; #% miss': '寒冰裝甲 {0} 秒：近戰攻擊者受到 {1} 冰寒傷害並冰冷 {2} 秒；遠程攻擊者被 {3} 冰彈反擊；{4}% 攻擊落空',
'Claws at the toughest in reach, # damage; every fourth blow releases # charges, +#% each': '用爪攻擊範圍內最強的怪物，{0} 傷害；每第四擊釋放 {1} 層充能，每層 +{2}%',
'Claws, # damage; every fourth blow a thunder nova, # damage, and charged bolts': '爪擊 {0} 傷害；每第四擊發出雷霆新星，{1} 傷害，並放出充能彈',
'Claws, # damage; every fourth blow shatters ice, # damage around and a long chill': '爪擊 {0} 傷害；每第四擊震碎寒冰，周圍 {1} 傷害並長時間冰冷',
'Claws, # damage; every fourth blow shatters ice, # damage around, ice cubes and a long chill': '爪擊 {0} 傷害；每第四擊震碎寒冰，周圍 {1} 傷害，冰塊並長時間冰冷',
'Claws, # damage: a meteor (#), chain lightning (#), then chaos ice; every fourth all three': '爪擊 {0} 傷害：隕石（{1}）、連鎖閃電（{2}），然後混沌寒冰；每第四擊三種一起',
'Curse, #s: monsters within # of a target slow by half, deal #% less damage and lose #% physical resistance (a fifth of it if immune)': '詛咒 {0} 秒：目標 {1} 範圍內的怪物減速一半，傷害減少 {2}%，物理抗性降低 {3}%（免疫的怪物只有五分之一）',
'Curse, #s: monsters within # of a target lose #% physical resistance (a fifth of it if immune)': '詛咒 {0} 秒：目標 {1} 範圍內的怪物物理抗性降低 {2}%（免疫的怪物只有五分之一）',
'For #s a storm rages within # yards: # cold damage # times a second, chilling': '{0} 秒內 {1} 碼範圍颳起風暴：每秒 {3} 次 {2} 冰寒傷害，並造成冰冷',
'For #s burning rocks fall around you, the toughest monsters most, # damage each': '{0} 秒內燃燒的岩石落在你周圍，最常砸向最強的怪物，每顆 {1} 傷害',
'For #s you take #% less physical damage': '{0} 秒內受到的物理傷害減少 {1}%',
'Frozen Armor for #s: melee attackers get a #s chill; #% of blows and missiles miss her': '冰封裝甲 {0} 秒：近戰攻擊者冰冷 {1} 秒；{2}% 的近戰和投射物打不中她',
'Golems get +#% life, +#% damage and +#% speed': '魔像 +{0}% 生命、+{1}% 傷害、+{2}% 速度',
'Holy Shield at its height for good, +#% Chance to Block, smiting back; a holy blast every #s throws monsters back, # damage': '神聖之盾永久處於最強狀態，+{0}% 格擋機率並反擊；每 {1} 秒發出神聖衝擊擊退怪物，{2} 傷害',
'Ice shards rain on the nearest pack for #s, # shards of # damage each, chilling what they hit': '寒冰碎片落在最近的怪群上 {0} 秒，共 {1} 片，每片 {2} 傷害，並冰冷命中的目標',
'Leap where you run (at a foe when still) and strike: # damage, # around': '跳向你移動的方向（站著不動時跳向敵人）並攻擊：{0} 傷害，周圍 {1}',
'Lightning keeps striking monsters around you, # damage': '閃電持續打擊你周圍的怪物，{0} 傷害', 'Lightning keeps striking # monsters at a time around you, # damage': '閃電持續打擊你周圍的怪物，每次 {0} 隻，{1} 傷害',
'Lightning strikes the toughest monster nearby and one more, # damage; holy bolts burst, # each': '閃電打擊附近最強的怪物和另一隻，{0} 傷害；迸出神聖彈，每道 {1}',
'Maul as a werebear for #s; every #rd swing also stomps its blow out to all within # yards, stunning': '變成熊人重擊 {0} 秒；每第 {1} 次揮擊會把攻擊震向 {2} 碼內所有目標並暈眩',
'Meteors crash onto # monsters, # damage, and leave the ground burning': '隕石砸向 {0} 隻怪物，{1} 傷害，並讓地面燃燒',
'Monsters near her take #% more damage (it breaks no immunity)': '她附近的怪物受到的傷害增加 {0}%（不會破除免疫）',
'Monsters resist fire, cold, lightning and poison #% less, up to #% (a fifth of it if immune)': '怪物的火焰、冰寒、閃電與毒素抗性降低 {0}%，最多 {1}%（免疫的怪物只有五分之一）',
'Shiver Armor for #s: melee attackers take # cold and a #s chill; #% of blows and missiles miss her': '碎冰甲 {0} 秒：近戰攻擊者受到 {1} 冰寒傷害並冰冷 {2} 秒；{3}% 的近戰和投射物打不中她',
'Take #% less damage': '受到的傷害減少 {0}%', 'Take #% less damage; poison and chill wear off #% faster': '受到的傷害減少 {0}%；中毒和冰冷持續時間縮短 {1}%',
'The Hammerdin: # blessed hammers at once, whirling faster and wider, # damage to all they pass': '鎚丁：一次 {0} 把祝福之鎚，轉得更快更廣，對經過的所有目標造成 {1} 傷害',
'Two blows in a wide reach, # damage each; hits speed your swings and steps, up to # times': '大範圍兩次攻擊，每次 {0} 傷害；命中會加快你的揮擊和移動，最多疊加 {1} 次',
'Up to # dire wolves, # damage a bite, and the pack +#% life; with # spirit wolves and # ravens': '最多 {0} 隻恐狼，每咬 {1} 傷害，同伴生命 +{2}%；另有 {3} 隻靈狼和 {4} 隻烏鴉',
'Up to # spirit wolves fight beside you, # damage a bite; and # ravens': '最多 {0} 隻靈狼在你身邊戰鬥，每咬 {1} 傷害；另有 {2} 隻烏鴉',
'Werebear for #s near monsters: #% less damage taken, +#% life, splashing blows of #': '怪物在附近時變成熊人 {0} 秒：受到的傷害減少 {1}%，+{2}% 生命，濺射攻擊 {3}',
'Werebear for #s: #% less physical damage taken, +#% life, splashing blows of #': '變成熊人 {0} 秒：受到的物理傷害減少 {1}%，+{2}% 生命，濺射攻擊 {3}',
'Werebear for #s: blows of #, each # more a charge up to # (the last stuns)': '變成熊人 {0} 秒：攻擊 {1}，每層充能多 {2}，最多 {3} 層（最後一擊暈眩）',
'Wereform blows add # poison over #s; a bitten monster that dies passes it to # near it': '變身後的攻擊在 {1} 秒內附加 {0} 毒素傷害；被咬的怪物死亡時會傳染給附近 {2} 隻',
'Wereforms last #s longer and give +#% more life': '變身持續時間增加 {0} 秒，生命額外 +{1}%',
'Werewolf for #s near monsters: +#% life, claws of # every #s, +#% crit': '怪物在附近時變成狼人 {0} 秒：+{1}% 生命，每 {3} 秒爪擊 {2}，+{4}% 致命一擊',
'When monsters crowd and hurt you, those around you flee in terror for #s (bosses less, act bosses never)': '被怪物包圍並受傷時，周圍的怪物會恐懼逃跑 {0} 秒（首領較短，幕首領不受影響）',
'Whirl # yards through the horde, # damage to each monster # times a second': '在怪群中旋風斬 {0} 碼，每秒 {2} 次對每隻怪物造成 {1} 傷害',
'You take #% less damage and have #% more life, renewed every #s': '受到的傷害減少 {0}%，生命增加 {1}%，每 {2} 秒更新',
'You take #% less physical damage and have #% more life, renewed every #s': '受到的物理傷害減少 {0}%，生命增加 {1}%，每 {2} 秒更新',
'Your shadow master, # damage, # life; every third blow a fire, lightning or ice kick': '你的影子大師，{0} 傷害，{1} 生命；每第三擊施展火焰、閃電或寒冰踢擊',
// 存檔、回報問題、更新
'Open a save file': '開啟存檔檔案', 'Save as a file': '儲存成檔案', 'That file couldn\'t be read.': '無法讀取這個檔案。', 'That file is too big to be a save.': '這個檔案太大，不是存檔。',
'Your game could not be saved': '無法儲存遊戲', 'Your save could not be read': '無法讀取你的存檔', 'A saved run could not be read': '無法讀取已儲存的這一輪',
'Your saved run could not be started': '無法開始已儲存的這一輪', 'This run is not saved': '這一輪不會儲存', 'A kept hero could not be read': '無法讀取保留的英雄',
'Your game could not be saved: this browser\'s storage is full or turned off': '無法儲存遊戲：這個瀏覽器的儲存空間已滿或被關閉',
'This browser would not store it: its storage is full, or turned off (a private window, or site data blocked). CONTINUE still works until this page is closed. Allow this site to keep data, or free up space, then save again.': '這個瀏覽器無法儲存：儲存空間已滿或被關閉（無痕視窗，或封鎖了網站資料）。在關閉這個頁面之前「繼續」仍然有效。請允許這個網站儲存資料或清出空間，再存一次。',
'It is kept aside in this browser, untouched, and a new save starts now. Send a REPORT and it can be looked at.': '它已原封不動地另外保存在這個瀏覽器裡，現在開始新的存檔。送出「回報問題」就能幫你查看。',
'This browser would not keep it aside either, so a new save starts now. Send a REPORT, please.': '這個瀏覽器也無法另外保存，所以現在開始新的存檔。請送出「回報問題」。',
'Something went wrong as it loaded. It is still saved: try CONTINUE again. If it fails again, send a REPORT.': '載入時發生錯誤。存檔還在：請再按一次「繼續」。如果又失敗，請送出「回報問題」。',
'The *\'s saved run is not one this version can start, so CONTINUE does not offer it for now. It is kept aside, untouched, and comes back once a version can read it.': '{0}的已儲存進度無法用這個版本開始，所以「繼續」暫時不會出現。它會原封不動地另外保存，等到有版本能讀取時就會回來。',
'The *\'s saved run is not one this version can start, and this browser would not keep it aside. Send a REPORT, please.': '{0}的已儲存進度無法用這個版本開始，這個瀏覽器也無法另外保存。請送出「回報問題」。',
'The *\'s saved run was kept aside by an older version, and is back now: CONTINUE plays it.': '{0}的已儲存進度之前被舊版本另外保存，現在回來了：按「繼續」就能玩。',
'The * kept for * is not one this version can start, so * starts at level 1 for now. It is kept aside, untouched, and comes back once a version can read it.': '為{1}保留的{0}無法用這個版本開始，所以{2}暫時從等級 1 開始。它會原封不動地另外保存，等到有版本能讀取時就會回來。',
'The * kept for * is not one this version can start, and storage would not keep it aside. Send a REPORT, please.': '為{1}保留的{0}無法用這個版本開始，儲存空間也無法另外保存。請送出「回報問題」。',
'The * kept for * was kept aside by an older version, and is back now.': '為{1}保留的{0}之前被舊版本另外保存，現在回來了。',
'A save file or code from the desktop app or another browser replaces this browser\'s save.': '來自桌面版或其他瀏覽器的存檔檔案或代碼，會取代這個瀏覽器的存檔。',
'That code comes from a newer version of D2 Survivors. Reload this page to update, then try again.': '這個代碼來自較新版本的 D2 Survivors。請重新整理頁面更新後再試一次。',
'Keep your gold, Charsi\'s upgrades and gear, or carry them to the desktop app, another browser or another device.': '保留你的金幣、恰西的升級和裝備，或帶到桌面版、其他瀏覽器或其他裝置。',
'Carry your gold, Charsi\'s upgrades and gear to D2 Survivors in another browser or on another device.': '把你的金幣、恰西的升級和裝備帶到其他瀏覽器或裝置上的 D2 Survivors。',
'SAVES on the main menu keeps your progress as a file or a code, and brings it into the desktop app or another browser.': '主選單的「存檔」可以把進度存成檔案或代碼，再帶進桌面版或其他瀏覽器。',
'The game has evolved a lot since its release. As it\'s still in beta, the developer encourages a wipe and a fresh start: a new taste of the game as it is now, and feedback based on that. Would you like to start over?': '遊戲從推出以來已經改變很多。因為還在測試階段，開發者鼓勵清空存檔重新開始：體驗遊戲現在的樣子，並根據這個給予意見。要重新開始嗎？',
'Every hero, item, gold piece, Charsi\'s rank and Terror tier is deleted, for good. Your settings stay.': '所有英雄、物品、金幣、恰西的升級和恐懼層都會永久刪除。設定會保留。',
'Bug': '錯誤', 'Balance': '平衡', 'Idea': '建議', 'Send': '送出', 'Sending…': '送出中…', 'Thanks, sent.': '謝謝，已送出。', 'Screenshot': '螢幕截圖',
'Include the screenshot': '附上螢幕截圖', 'What\'s sent': '會送出的內容', 'Write a few words first.': '請先寫幾個字。',
'Couldn\'t reach the server: it will be sent the next time the game opens.': '連不上伺服器：下次開啟遊戲時會再送出。',
'Couldn\'t send it, and there\'s no room to keep it for later.': '無法送出，也沒有空間留著稍後再送。',
'X (@name) or Reddit (u/name), only if you want a reply': 'X（@名稱）或 Reddit（u/名稱），想收到回覆再填',
'A bug, a balance note or an idea, with your run attached.': '回報錯誤、平衡意見或建議，會附上這一輪的資料。',
'A contact is @name (X) or u/name (Reddit).': '聯絡方式請填 @名稱（X）或 u/名稱（Reddit）。',
'The report was refused. Shorten the text, or leave the screenshot out, and try again.': '回報被拒絕了。請縮短文字或不要附上截圖，再試一次。',
'What happened, or what would you change? Any language is fine.': '發生了什麼事，或你想改變什麼？任何語言都可以。',
'D2 Survivors is still a beta, and it changes all the time. I read your feedback and keep improving the game, so now and then something may break: please bear with me. It\'s made by one person, in spare time, doing my best to make something you enjoy.': 'D2 Survivors 還在測試階段，而且一直在改變。我會閱讀你的意見並持續改進遊戲，所以偶爾可能會出問題：請多包涵。這是一個人利用空閒時間製作的，我盡力做出你會喜歡的遊戲。',
'Arrows or drag to adjust': '方向鍵或拖曳來調整', 'Build complete': '建置完成', '# upgrade': '{0} 項升級',
'Build # is ready': '版本 {0} 已就緒', 'Build # is ready: see the main menu': '版本 {0} 已就緒：請看主選單',
'Checking for updates...': '正在檢查更新...', 'Preparing update...': '正在準備更新...', 'Up to date': '已是最新版本', 'Update ready: click to restart': '更新已就緒：點擊重新啟動',
'Downloading update *%': '正在下載更新 {0}%', 'Open the .dmg and drag D2 Survivors into Applications. It keeps itself up to date.': '打開 .dmg，把 D2 Survivors 拖進「應用程式」。它會自動保持最新版本。',
'The official game is at d2survivors.lol': '官方遊戲在 d2survivors.lol',
// 遊戲檔案（使用自己的 Diablo II 檔案）
'USE YOUR OWN FILES': '使用自己的遊戲檔案', 'Use my own files…': '使用我自己的檔案…', 'Hosted files': '線上檔案', 'The game plays with the hosted files.': '遊戲使用線上檔案進行。',
'The game now uses your own files': '遊戲現在使用你自己的檔案', 'Your own Diablo II files': '你自己的 Diablo II 檔案', 'Play with your own Diablo II': '用你自己的 Diablo II 玩',
'Play with your own Diablo II files: faster, no download.': '用你自己的 Diablo II 檔案玩：更快，不用下載。', 'D2 Survivors now needs your own Diablo II files': 'D2 Survivors 現在需要你自己的 Diablo II 檔案',
'Your Diablo II: Resurrected files don’t match each other.': '你的 Diablo II: Resurrected 檔案彼此不相符。', 'That folder won’t do': '這個資料夾不行',
'Extract': '解壓縮', 'Change folder': '更換資料夾', 'Opening the archives': '正在開啟封存檔', 'Extracting': '解壓縮中', 'The extraction stopped': '解壓縮中斷了',
// 安裝版的設定頁（app://setup/：找 Diablo II、解壓縮、遊戲改版後更新檔案）
'Ready': '準備完成', 'Done in *': '花了 {0} 完成', '# of #': '{0}／{1}', 'Getting ready': '準備中', 'Copied': '已複製', 'Automap': '自動地圖',
// 原本完成後只寫一行小字、沒提示要按按鈕：加上提示
'Your game files are in place, and stay on this computer.': '✔ 遊戲檔案已經下載完成，會一直留在這台電腦上。請按下方的「開始遊戲」按鈕進入遊戲。',
'Where is Diablo II?': 'Diablo II 在哪裡？', 'It isn’t a Diablo II install.': '這不是 Diablo II 的安裝資料夾。', 'Locate Diablo II…': '選擇 Diablo II 資料夾…',
'Extract the game files again': '重新解壓縮遊戲檔案', 'Updating game files…': '正在更新遊戲檔案…（遊戲改版，完成後會自動開始）',
'Copying your game files. This takes a minute or so, once.': '正在複製你的遊戲檔案，只需要一次，大約一分鐘。',
'This version reads some of your game files differently, so those are copied again. The game starts once they’re in place.': '遊戲改版了，新版讀取部分檔案的方式不同，所以會重新複製這些檔案。完成後遊戲會自動開始，請稍候。',
'Some of the game files are missing. Extract them again to play.': '缺少部分遊戲檔案，請按「解壓縮」重新複製才能玩。',
'This version of D2 Survivors reads the game files differently. Extract them again to play.': '遊戲改版了：這個版本讀取遊戲檔案的方式不同，請按「解壓縮」重新複製才能玩。',
'This version of D2 Survivors reads some of the game files differently. Extract them again to play.': '遊戲改版了：這個版本讀取部分遊戲檔案的方式不同，請按「解壓縮」重新複製才能玩。',
'The art and sound are copied again, from this install or another, over the ones the game has now.': '會從這個或另一個安裝資料夾重新複製圖像和音效，覆蓋目前的檔案。',
'Try again': '再試一次', 'The game plays with them.': '遊戲會使用這些檔案。', 'Play with my files': '用我的檔案玩', 'Extract again…': '重新解壓縮…', 'How it works': '運作方式',
'Copy details': '複製詳細資訊', 'Choose another folder…': '選擇其他資料夾…', 'Reading Diablo II…': '正在讀取 Diablo II…', 'A few seconds': '幾秒鐘', 'Diablo II found': '找到 Diablo II',
'Diablo II: Resurrected found': '找到 Diablo II: Resurrected', 'Your game files': '你的遊戲檔案', 'Update your game files': '更新你的遊戲檔案', 'Update game files': '更新遊戲檔案',
'Remove from this browser': '從這個瀏覽器移除', 'Your game files are in this browser, and stay here.': '你的遊戲檔案存在這個瀏覽器裡，並會留在這裡。',
'Only those are copied again, from your Diablo II folder.': '只會從你的 Diablo II 資料夾重新複製這些檔案。', 'They’re copied again from your Diablo II folder.': '會從你的 Diablo II 資料夾重新複製。',
'Pick your Diablo II folder again.': '請重新選擇你的 Diablo II 資料夾。', 'This browser can’t remember folders: pick yours again.': '這個瀏覽器無法記住資料夾：請重新選擇。',
'Sounds and music from Diablo II: Resurrected': '音效與音樂來自 Diablo II: Resurrected', 'Sounds and music from Diablo II: Resurrected.': '音效與音樂來自 Diablo II: Resurrected。',
'Your computer couldn’t read a game file.': '你的電腦無法讀取遊戲檔案。', 'D2 Survivors wasn’t allowed to read a game file.': 'D2 Survivors 沒有權限讀取遊戲檔案。',
'A game file is missing.': '缺少一個遊戲檔案。', 'This computer’s disk is full.': '這台電腦的磁碟已滿。', 'Free some space, then try again.': '清出一些空間後再試一次。',
'On an external or network drive? Keep it connected.': '在外接或網路磁碟上？請保持連線。', 'Something went wrong while copying the game files.': '複製遊戲檔案時發生錯誤。',
'Try again. If it stops again, copy the details for a report.': '再試一次。如果又中斷，請複製詳細資訊來回報。',
'Close the game. In Battle.net choose Options, then Scan and Repair (in Steam: Verify integrity of game files), let any update finish, then try again.': '關閉遊戲。在 Battle.net 選「選項」→「掃描與修復」（Steam：驗證遊戲檔案完整性），等更新完成後再試一次。',
'Soon D2 Survivors will run only on your own Diablo II or Diablo II: Resurrected files, out of respect for Blizzard\'s work. Get the desktop app, or point the game at your install. Your saves come with you.': '出於對 Blizzard 作品的尊重，D2 Survivors 很快只能使用你自己的 Diablo II 或 Diablo II: Resurrected 檔案執行。請下載桌面版，或讓遊戲指向你的安裝資料夾。存檔會一起保留。',
'It works in desktop Chrome, Edge, Firefox and Safari. On a phone the game plays with the hosted files.': '支援電腦版 Chrome、Edge、Firefox 和 Safari。手機上會使用線上檔案。',
'With the hosted files, the game downloads its art and sound from this site as you play, as before. Switch any time in Options, GAME FILES.': '使用線上檔案時，遊戲會像以前一樣邊玩邊從本站下載圖像與音效。隨時可以在「選項 → 遊戲檔案」切換。',
'Hosted files are going away very soon: D2 Survivors will only run on your own Diablo II or D2R files.': '線上檔案很快就會停止提供：D2 Survivors 之後只能使用你自己的 Diablo II 或 D2R 檔案執行。',
'Your heroes are safe in this browser, and SAVES works without game files.': '你的英雄安全地存在這個瀏覽器裡，沒有遊戲檔案也能使用「存檔」。',
'D2 Survivors now plays from your own Diablo II or Diablo II: Resurrected files.': 'D2 Survivors 現在使用你自己的 Diablo II 或 Diablo II: Resurrected 檔案執行。',
'A phone can\'t read a Diablo II install. Play on a computer: here on the website, or in the desktop app.': '手機無法讀取 Diablo II 安裝檔。請在電腦上玩：用這個網站或桌面版。',
'This browser can\'t read a Diablo II install. Play in a recent Chrome, Edge, Firefox or Safari, or in the desktop app.': '這個瀏覽器無法讀取 Diablo II 安裝檔。請使用新版 Chrome、Edge、Firefox、Safari 或桌面版。',
'Your heroes are safe in this browser. SAVES exports them, to carry to your computer.': '你的英雄安全地存在這個瀏覽器裡。用「存檔」匯出，就能帶到電腦上。',
'Your heroes stay in this browser, with or without game files. Export them to keep a copy, or to carry them to the desktop app or another browser.': '不論有沒有遊戲檔案，你的英雄都會留在這個瀏覽器。匯出可以保留備份，或帶到桌面版、其他瀏覽器。',
'It works in desktop Chrome, Edge, Firefox and Safari. A phone can’t read an install: play on a computer.': '支援電腦版 Chrome、Edge、Firefox 和 Safari。手機無法讀取安裝檔：請在電腦上玩。',
'Your heroes stay in this browser, with or without game files: SAVES exports them. The desktop app plays from your install too.': '不論有沒有遊戲檔案，你的英雄都會留在這個瀏覽器：用「存檔」匯出。桌面版也是使用你的安裝檔執行。',
'Plays from your own Diablo II or Diablo II: Resurrected files.': '使用你自己的 Diablo II 或 Diablo II: Resurrected 檔案執行。',
'Lord of Destruction isn’t installed there (d2exp.mpq is missing). D2 Survivors needs Diablo II and its expansion.': '那裡沒有安裝毀滅之王（缺少 d2exp.mpq）。D2 Survivors 需要 Diablo II 和它的資料片。',
'patch_d2.mpq is missing: update Diablo II to patch 1.14 first.': '缺少 patch_d2.mpq：請先把 Diablo II 更新到 1.14 版。',
'D2 Survivors reads the art and sound of your Diablo II and Lord of Destruction (1.14) once, in this browser, and keeps them here. Nothing is uploaded.': 'D2 Survivors 會在這個瀏覽器裡讀取一次你的 Diablo II 與毀滅之王（1.14）的圖像和音效，並保存在這裡。不會上傳任何東西。',
'Copying your game files into this browser. This takes a few minutes, once.': '正在把你的遊戲檔案複製到這個瀏覽器。只需要一次，大約幾分鐘。',
'This version of D2 Survivors reads some of your game files differently. Extract them again to play with them.': '這個版本的 D2 Survivors 讀取部分遊戲檔案的方式不同。請重新解壓縮才能使用。',
'That folder isn’t a Diablo II install, and none was found inside it: no d2data.mpq, nor Diablo II: Resurrected’s Data folder. Pick the folder that holds Diablo II’s .mpq files, or Diablo II: Resurrected’s (from Steam, in steamapps/common).': '那個資料夾不是 Diablo II 的安裝資料夾，裡面也找不到：沒有 d2data.mpq，也沒有 Diablo II: Resurrected 的 Data 資料夾。請選擇放有 Diablo II .mpq 檔案的資料夾，或 Diablo II: Resurrected 的資料夾（Steam 版在 steamapps/common 裡）。',
'A Diablo II: Resurrected install works too, from Battle.net or Steam: pick its folder, or the Steam library it’s in. Its sounds and music are D2R’s own.': 'Battle.net 或 Steam 的 Diablo II: Resurrected 安裝也可以：選擇它的資料夾，或它所在的 Steam 遊戲庫。音效和音樂會使用 D2R 的版本。',
'D2 Survivors plays with the art and sound of your own Diablo II and Lord of Destruction, or Diablo II: Resurrected. It copies them once, into its own folder on this computer. Nothing is sent anywhere; it only asks d2survivors.lol for newer builds.': 'D2 Survivors 使用你自己的 Diablo II 與毀滅之王，或 Diablo II: Resurrected 的圖像和音效。它只會複製一次到這台電腦上自己的資料夾。不會傳送到任何地方；只會向 d2survivors.lol 詢問新版本。',
'Point D2 Survivors at the folder that holds Diablo II’s .mpq files, or Diablo II: Resurrected’s.': '請讓 D2 Survivors 指向放有 Diablo II .mpq 檔案的資料夾，或 Diablo II: Resurrected 的資料夾。',
'In OneDrive, iCloud or Dropbox? Set it to always keep on this device.': '放在 OneDrive、iCloud 或 Dropbox？請設定成「一律保留在此裝置上」。',
'Close Diablo II and let Battle.net finish updating, then try again.': '關閉 Diablo II，等 Battle.net 更新完成後再試一次。',
'An antivirus may be blocking it: allow D2 Survivors, or move the game to a normal folder, then try again.': '可能被防毒軟體擋住了：請允許 D2 Survivors，或把遊戲移到一般資料夾，再試一次。',
'Repair the game in Battle.net (Options, then Scan and Repair), then try again.': '請在 Battle.net 修復遊戲（選項 → 掃描與修復），再試一次。',
'Diablo II’s game data is missing or out of date: update or repair it, or pick a copy without mods.': 'Diablo II 的遊戲資料缺少或過舊：請更新或修復，或選擇沒有裝模組的版本。',
'Some of your game files are missing. Copy them again to play.': '缺少部分遊戲檔案。請重新複製後再玩。',
'Copying your game files again, from your Diablo II folder. The game starts once they’re in place.': '正在從你的 Diablo II 資料夾重新複製遊戲檔案。完成後遊戲就會開始。',
'Pick the folder that holds Diablo II’s .mpq files: *.': '請選擇放有 Diablo II .mpq 檔案的資料夾：{0}。', 'Music and speech are optional: *.': '音樂和語音可有可無：{0}。',
'This browser has only * free for the site.': '這個瀏覽器只剩 {0} 可給這個網站使用。', 'Done in * · *': '{0} 完成 · {1}', 'Extracted on * · *': '解壓縮於 {0} · {1}',
'Diablo II’s * are missing from that folder.': '那個資料夾缺少 Diablo II 的 {0}。', 'Diablo II’s * is missing from that folder.': '那個資料夾缺少 Diablo II 的 {0}。',
'* are missing: the game plays without that music or speech.': '缺少 {0}：遊戲會在沒有這些音樂或語音的情況下進行。', '* is missing: the game plays without that music or speech.': '缺少 {0}：遊戲會在沒有這些音樂或語音的情況下進行。',
'It keeps about * in this browser, and asks the browser to keep it for good.': '它會在這個瀏覽器保存大約 {0}，並要求瀏覽器永久保留。',
// 2026-10-22 改版：遊戲選項頁、羅格營地、阿卡拉重新抽選、存檔版本、桌面版更新與解壓縮回報
'GAME OPTIONS': '遊戲選項', 'AUTO UPDATE': '自動更新', 'AUTO UPDATE: *': '自動更新：{0}', 'Auto stats, language and more': '自動配點、語言等設定',
'Fades your own skills only': '只淡化你自己的技能特效', 'Every item named, as Alt does': '顯示每件物品的名稱，就像按住 Alt', 'Spends stat points on damage': '把屬性點數分配到傷害',
'Spends new stat points on your damage stat': '把新的屬性點數分配到你的傷害屬性', 'Downloads each new build of the app': '自動下載每個新版本的應用程式',
'Where art and sound come from': '圖像和音效的來源', 'Wipes your progress for good': '永久清除你的進度', 'Are you sure?': '確定嗎？', 'This can\'t be undone. Your settings stay.': '這個動作無法復原。設定會保留。',
'Every hero, item, gold piece, Charsi\'s rank, Terror tier and best time is deleted. To keep a copy, export a save code from SAVES first.': '所有英雄、物品、金幣、恰西的升級、恐懼層和最佳紀錄都會刪除。想保留備份，請先在「存檔」匯出存檔代碼。',
'With the hosted files, the game downloads its art and sound from this site as you play, as before. Switch any time in Options, GAME OPTIONS, GAME FILES.': '使用線上檔案時，遊戲會像以前一樣邊玩邊從本站下載圖像與音效。隨時可以在「選項 → 遊戲選項 → 遊戲檔案」切換。',
'Safari may delete this save after a week away: save it as a file in SAVES': 'Safari 可能會在一週沒開遊戲後刪除這個存檔：請在「存檔」把它存成檔案',
'Safari deletes a website\'s saved data after 7 days without a visit, and a private tab\'s when it closes. Save this as a file to keep it, or add the game to your Home Screen (Share, then Add to Home Screen), where Safari keeps it.': 'Safari 會在 7 天沒造訪後刪除網站儲存的資料，無痕分頁則在關閉時刪除。請把存檔存成檔案保留，或把遊戲加入主畫面（分享 → 加入主畫面），Safari 就會保留它。',
'Town': '城鎮', 'Waypoint': '傳送點', 'Mercenaries: Soon™': '傭兵：即將推出™', 'A new hero at level 1': '等級 1 的新英雄',
'Click the waypoint to start a run, or a hero by the fire to play as her': '點擊傳送點開始新的一輪，或點擊營火旁的英雄改用該英雄',
'Tap the waypoint to start a run, or a hero by the fire to play as her': '點一下傳送點開始新的一輪，或點一下營火旁的英雄改用該英雄',
'Ends your saved run: click again': '會結束你已儲存的這一輪：再點擊一次', 'Ends your saved run: tap again': '會結束你已儲存的這一輪：再點一下',
'Reset your * hero': '重置你的{0}英雄', 'Re-draft your * hero': '重新抽選你的{0}英雄', 'Click again to reset': '再點擊一次以重置', 'Tap again to reset': '再點一下以重置',
'Your hero is drafted anew': '你的英雄已重新抽選', 'Re-draft: * levels to place': '重新抽選：還有 {0} 級要分配', 'Level * · * levels to place': '等級 {0} · 還有 {1} 級要分配',
'Level * · free': '等級 {0} · 免費', 'Level * · * levels waiting · free': '等級 {0} · {1} 級等待中 · 免費', 'Level * · * levels waiting · * gold': '等級 {0} · {1} 級等待中 · {2} 金幣',
'* levels wait for a free slot': '還有 {0} 級在等空的欄位', 'Pick a card to banish it for this difficulty': '選一張卡片，在這個難度中放逐它',
'+* stat points: * +*, * +*': '+{0} 屬性點數：{1} +{2}、{3} +{4}', 'Stat points at the cap for level #': '屬性點數已達等級 {0} 的上限',
'Tap to pick up or put down · Hold to equip or take off': '點一下拿起或放下 · 長按穿上或卸下',
'Your save is from a newer version': '你的存檔來自較新的版本',
'This version plays it as far as it can. The save as the newer version left it is kept aside, untouched, and the newer version brings back what this one can not keep.': '這個版本會盡量讀取它。較新版本留下的存檔會原封不動地另外保存，回到較新版本時就能找回這個版本無法保留的內容。',
'This version plays it as far as it can, and this browser would not keep the newer copy aside: what only the newer version knows may be lost. Send a REPORT, please.': '這個版本會盡量讀取它，但這個瀏覽器無法另外保存較新版本的存檔：只有較新版本認得的內容可能會遺失。請送出「回報問題」。',
'An older version played your save for a while and could not keep everything on your items. It was kept aside, and is back now.': '舊版本玩過你的存檔一段時間，無法保留物品上的所有內容。原本的資料已另外保存，現在回來了。',
'Something went wrong. SAVE AND EXIT keeps your run: please send a REPORT': '發生錯誤。「儲存並離開」會保留這一輪：請送出「回報問題」',
'The game could not start': '遊戲無法啟動', 'RELOAD': '重新載入', 'Reload to try again. If it happens again, copy the diagnostics and send them on Discord.': '請重新載入再試一次。如果又發生，請複製診斷資訊並在 Discord 上傳送。',
'The game closed unexpectedly last time: lighter graphics for now': '上次遊戲意外關閉：暫時使用較簡化的畫面',
'On a phone the game holds its art in half the memory again, with the map, heroes and monsters drawn whole': '手機上遊戲的圖像再次只佔一半記憶體，地圖、英雄和怪物都完整繪製',
'Update didn\'t install: click to retry': '更新沒有安裝成功：點擊重試', 'Updating: the game opens again by itself': '正在更新：完成後遊戲會自動重新開啟',
'©2000, 2001, 2021 Blizzard Entertainment, Inc. All rights reserved.': '©2000, 2001, 2021 Blizzard Entertainment, Inc. 版權所有。',
'D2 Survivors couldn’t save its copy of the game files.': 'D2 Survivors 無法儲存它複製的遊戲檔案。',
'Your Diablo II is fine. An antivirus may be blocking D2 Survivors’ own folder: allow D2 Survivors, then try again.': '你的 Diablo II 沒有問題。可能是防毒軟體擋住了 D2 Survivors 自己的資料夾：請允許 D2 Survivors，再試一次。',
'FAQ': '常見問題', 'Support on Ko-fi': '在 Ko-fi 贊助', 'Set up your files': '設定你的檔案', 'Privacy': '隱私權', 'Legal': '法律聲明',
'@framara on X': 'X 上的 @framara', 'Made by framara (@framara on X)': '製作：framara（X 上的 @framara）',
'Free to play, with no ads. Diablo®, Diablo II®, Lord of Destruction® and Blizzard Entertainment® are trademarks or registered trademarks of Blizzard Entertainment, Inc. in the U.S. and/or other countries.': '免費遊玩，沒有廣告。Diablo®、Diablo II®、Lord of Destruction®（毀滅之王）和 Blizzard Entertainment® 是 Blizzard Entertainment, Inc. 在美國及／或其他國家的商標或註冊商標。',
'Diablo II ©2000, Diablo II: Lord of Destruction ©2001 and Diablo II: Resurrected ©2021 Blizzard Entertainment, Inc. All rights reserved.': 'Diablo II ©2000、Diablo II: 毀滅之王 ©2001 與 Diablo II: Resurrected ©2021 Blizzard Entertainment, Inc. 版權所有。',
'Try again. If it stops again, send a report.': '再試一次。如果又中斷，請送出回報。', 'Stopped at': '中斷的步驟', 'Send report': '送出回報', 'Report sent': '回報已送出', 'Send again': '再送一次',
// 2026-10-22 改版：技能、被動與裝備說明
'# blades thrown at the monsters around you, # damage and #% of your weapon\'s each, passing through three': '向周圍怪物投擲 {0} 把刀刃，每把造成 {1} 傷害加武器傷害的 {2}%，可穿透三隻怪物',
'Blades spin around you, # damage and #% of your weapon\'s to all beside you # times a second, and fly off at monsters for #': '刀刃繞著你旋轉，每秒 {2} 次對身邊所有敵人造成 {0} 傷害加武器傷害的 {1}%，並飛向怪物造成 {3} 傷害',
'Claws, # damage; every fourth blow # lightning, a thunder nova of # and # charged bolts of #': '爪擊 {0} 傷害；每第四擊造成 {1} 閃電傷害、{2} 的雷電新星，以及 {3} 道 {4} 的充能彈',
'Claws, # damage: a meteor (#), chain lightning (#), then chaos ice (#); every fourth the ice again': '爪擊 {0} 傷害：隕石（{1}）、連鎖閃電（{2}），接著混沌寒冰（{3}）；每第四擊再次釋放寒冰',
'Claws, # damage; every fourth blow # cold, shattering ice for as much around and ice cubes that freeze': '爪擊 {0} 傷害；每第四擊造成 {1} 冰寒傷害，碎冰對周圍造成同樣傷害，並散落會凍結敵人的冰塊',
'+#% chance to sidestep a monster\'s blow while you attack or stand still': '攻擊或站立不動時，+{0}% 機率閃開怪物的近戰攻擊',
'+#% chance to sidestep a monster\'s hit while you walk or run': '行走或奔跑時，+{0}% 機率閃開怪物的攻擊',
'+#% chance to sidestep a monster\'s missile while you attack or stand still': '攻擊或站立不動時，+{0}% 機率閃開怪物的投射物',
'the thrust or a bolt': '刺擊或彈矢',
'Aura: burns monsters around you each second, and adds #× that to your attacks': '靈氣：每秒燃燒周圍怪物，並在你的攻擊附加 {0} 倍的傷害',
'Aura: jolts monsters around you each second, and adds #× that to your attacks': '靈氣：每秒電擊周圍怪物，並在你的攻擊附加 {0} 倍的傷害',
'Aura: monsters around you are slowed by half and chilled; #× its cold on your attacks': '靈氣：周圍怪物減速一半並被冰冷；你的攻擊附加 {0} 倍的冰寒傷害',
'Aura: +#% mana regeneration, as Faster Cast Rate: skills recharge #% faster': '靈氣：法力恢復 +{0}%，等同快速施法率：技能冷卻快 {1}%',
'Aura: +#% damage to your attacks and Blessed Hammer': '靈氣：你的攻擊和祝福之鎚傷害 +{0}%', 'Now +*% *': '目前{1} +{0}%',
'At most # shorter: gear\'s, the card\'s and every skill\'s haste together': '最多縮短 {0}：裝備、卡片與所有技能的加速合計',
'Holy Shield at its height for good, +#% Chance to Block, smiting back; a holy blast every #s, # damage to all around you': '神聖之盾永久維持最強狀態，格擋機率 +{0}%，格擋時反擊；每 {1} 秒一次神聖爆炸，對周圍所有敵人造成 {2} 傷害',
'Wereform blows add # poison over #s; while it lasts, a bitten monster spreads it to those around it': '變身形態的攻擊在 {1} 秒內附加 {0} 毒素傷害；持續期間，被咬的怪物會傳染給周圍的怪物',
'With an axe: +#% physical damage and +#% chance of a critical strike': '使用斧頭時：物理傷害 +{0}%，致命攻擊機率 +{1}%',
'With a sword: +#% physical damage and +#% chance of a critical strike': '使用劍時：物理傷害 +{0}%，致命攻擊機率 +{1}%',
'With a blunt weapon: +#% physical damage and +#% chance of a critical strike': '使用鈍器時：物理傷害 +{0}%，致命攻擊機率 +{1}%',
'With a polearm: +#% physical damage and +#% chance of a critical strike': '使用長柄武器時：物理傷害 +{0}%，致命攻擊機率 +{1}%',
'With a spear or javelin: +#% physical damage and +#% chance of a critical strike': '使用長矛或標槍時：物理傷害 +{0}%，致命攻擊機率 +{1}%',
// 2026-10-22 第二次改版（20261022.1）：傭兵、尋找凱恩、任務紀錄、恐懼挑戰、特殊物品
'A new build is ready: click to reload': '新版本已就緒：點擊重新載入',
'Mercenary': '傭兵', 'MERCENARY': '傭兵', 'Hire': '雇用', 'Click again to hire': '再點擊一次以雇用', 'Tap again to hire': '再點一下以雇用',
'Rogue Scout': '羅格斥候', 'Desert Mercenary': '沙漠傭兵', 'Greiz': '葛列茲', 'Qual-Kehk': '夸爾－凱克',
'Kashya will lend you a Rogue Scout, free': '卡夏會免費借你一名羅格斥候', 'Sent by *': '由{0}派來', '* · yours · free': '{0} · 你的傭兵 · 免費',
'* will fight for you': '{0} 會為你作戰', '* fights for you again': '{0} 再次為你作戰', '*: * leaves': '{0}：{1} 離開了', '* has fallen': '{0} 倒下了',
'Fallen: resurrect at Kashya': '已倒下：請到卡夏那裡復活', 'Joins at level *': '等級 {0} 加入', 'Opens at level *': '等級 {0} 開放',
'Click to choose': '點擊選擇', 'Tap again to choose': '再點一下以選擇',
'The Horadric Malus pays for it': '用赫拉迪克之錘支付', 'Only this hero can keep that': '只有這個英雄能保留它', 'I can\'t carry anymore.': '我拿不下了。',
'Click the + of the attribute to raise': '點擊要提升的屬性旁的＋', 'Charsi takes it to imbue an item': '恰西用它來為物品灌注', 'Charsi imbued an item': '恰西為物品灌注了魔法',
'Read it in a run or the camp': '在一輪遊戲中或營地裡閱讀', 'Click a tree\'s tab, then click it again': '點擊技能樹的分頁，再點擊一次', 'Books and Tomes to read again': '可以再次閱讀的書與典籍',
'Book of Skill': '技能之書', 'Right Click to learn skill of your choice': '右鍵點擊學習你選擇的技能', 'Lam Esen\'s Tome': '蘭姆·艾森之書',
'+5 to an Attribute of your choice': '你選擇的一項屬性 +5', 'Right Click to Read': '右鍵點擊閱讀', 'Potion of Life': '生命藥劑',
'Right Click to permanently add 20 to Life': '右鍵點擊永久增加 20 點生命', 'Scroll of Resistance': '抗性卷軸', 'Right Click to Cast': '右鍵點擊施放',
'Token of Absolution': '赦免徽記', 'Right-click to reset Stat/Skill Points': '右鍵點擊重置屬性／技能點數',
'Horadric Malus': '赫拉迪克之錘', 'Horadric Scroll': '赫拉迪克卷軸', 'Scroll of Inifuss': '英尼弗斯卷軸', 'Tree of Inifuss': '英尼弗斯之樹',
'Key to the Cairn Stones': '石塊陣之鑰', 'Cairn Stones': '石塊陣', 'Cow King': '奶牛之王', 'High Council': '最高議會',
'Quests': '任務', 'Quest completed.': '任務完成。', 'Quest completed: *': '任務完成：{0}', 'Reward: *': '獎勵：{0}', 'Reward: Akara\'s Ring': '獎勵：阿卡拉的戒指',
'The Search for Cain': '尋找凱恩', 'Search for Cain': '尋找凱恩', 'The portal back': '回程的傳送門',
'Treehead WoodFist guards the Tree of Inifuss. Bring me its scroll.': '木拳樹頭守護著英尼弗斯之樹。把它的卷軸帶來給我。',
'Take this to the Cairn Stones, where Rakanishu stands guard.': '把這個帶到拉卡尼休看守的石塊陣。',
'Thank you for rescuing Deckard Cain. Take this ring.': '謝謝你救出迪卡·凱恩。收下這枚戒指吧。', 'I thank you, friend, for coming to my aid.': '朋友，謝謝你來救我。',
'Return to Deckard Cain for your reward.': '回去找迪卡·凱恩領取獎勵。', 'Talk to Akara for a reward.': '去找阿卡拉領取獎勵。',
'Slay Treehead WoodFist at the Tree of Inifuss, and recover the Scroll.': '在英尼弗斯之樹擊殺木拳樹頭，取回卷軸。',
'Take the Scroll of Inifuss to Akara.': '把英尼弗斯卷軸交給阿卡拉。',
'Touch the Cairn Stones where Rakanishu falls, and enter the portal to Tristram.': '在拉卡尼休倒下的地方觸碰石塊陣，進入通往崔斯特姆的傳送門。',
'Find and rescue Deckard Cain.': '找到並救出迪卡·凱恩。', 'Cain has been rescued and is now at the Rogue Encampment.': '凱恩已獲救，現在在羅格營地。',
// 恐懼挑戰（任務紀錄的恐懼分頁）
'Act I by Name': '第一幕點名', 'Andariel at Full Strength': '全盛的安達莉爾', 'Untouched by Duriel': '督瑞爾碰不到你', 'One Tree': '單一技能樹',
'The High Council': '最高議會', 'Duriel in Thirty': '三十秒內的督瑞爾', 'Untouched by Mephisto': '墨菲斯托碰不到你', 'Six Evolutions': '六次進化',
'Rite of Passage': '成年禮', 'One Tree in Hell': '地獄的單一技能樹', 'Untouched by Diablo': '迪亞布羅碰不到你', 'Baal in a Minute': '一分鐘內的巴爾',
'The Cow Tier': '奶牛層', 'Every Act': '每一幕', 'Three in a Row': '連續三層', 'No Potions': '不用藥水',
'Slay all ten of Act I\'s named monsters in one Act I.': '在同一次第一幕中擊殺第一幕全部十隻有名字的怪物。', 'Slay the Cow King in the Moo Moo Farm.': '在哞哞農場擊殺奶牛之王。',
'Slay Andariel before she weakens.': '在安達莉爾變弱之前擊殺她。', 'Slay Duriel with none of his blows landing.': '擊殺督瑞爾，且沒有被他打中任何一擊。',
'Slay Mephisto holding at least * skills, all of one tree.': '擊殺墨菲斯托時至少擁有 {0} 個技能，而且全部來自同一個技能樹。',
'Slay all six of the High Council in one Act III.': '在同一次第三幕中擊殺最高議會全部六人。', 'Slay Duriel within * seconds of his coming.': '督瑞爾出現後 {0} 秒內擊殺他。',
'Slay Mephisto with none of his blows or missiles landing.': '擊殺墨菲斯托，且沒有被他的攻擊或投射物打中。',
'Slay the three seal bosses, then Diablo before he weakens.': '擊殺三個封印首領，再在迪亞布羅變弱之前擊殺他。',
'Hold * evolved skills as an act boss falls.': '幕首領倒下時擁有 {0} 個已進化技能。', 'Slay Pindleskin before Nihlathak comes.': '在尼拉塞克出現之前擊殺暴躁外皮。',
'Slay Talic, Madawc and Korlic within * seconds of their awakening.': '塔力克、馬道克和科力克甦醒後 {0} 秒內擊殺他們。',
'Slay Baal holding at least * skills, all of one tree.': '擊殺巴爾時至少擁有 {0} 個技能，而且全部來自同一個技能樹。',
'Slay Diablo with none of his blows, missiles or novas landing.': '擊殺迪亞布羅，且沒有被他的攻擊、投射物或新星打中。', 'Slay Baal within * seconds of his coming.': '巴爾出現後 {0} 秒內擊殺他。',
'Clear the Cow tier.': '通過奶牛層。', 'Clear a tier in each of the five acts.': '在五幕中各通過一層。', 'Clear tier * or higher.': '通過第 {0} 層或更高。',
'Clear * tiers with none lost between.': '連續通過 {0} 層，中間沒有失敗。', 'Clear a tier with No Potions in the Belt.': '在「腰帶不能放藥水」的層中通過一層。',
'Named monsters left: *': '剩下有名字的怪物：{0}', 'Acts: *': '幕：{0}', 'Tiers in a row: *': '連續層數：{0}',
// 20261022.2
'Turn your phone upright': '請把手機轉成直向', 'Your level-* * stays your * hero.': '你等級 {0} 的{1}仍是你的{2}英雄。',
// 進化條件（升級卡片與技能樹）：遊戲另外還有縮短版（Into …, needs:），技能名稱含 of 時不要被逗號規則切開
'Evolves * into *, also needs:': '把{0}進化為{1}，還需要：', 'Evolves * into *, also needs: *': '把{0}進化為{1}，還需要：{2}',
'* into *, needs:': '{0} → {1}，需要：', '* into *, needs: *': '{0} → {1}，需要：{2}', 'Into *, needs:': '進化為{0}，需要：', 'Into *, needs: *': '進化為{0}，需要：{1}',
'Evolves into *: *': '進化為{0}：{1}',
'Melee Damage Reduced by *%': '近戰傷害減少 {0}%', 'Physical hits only': '只對物理攻擊有效', '#% Reanimate as:': '{0}% 機率復活為：', 'when you Kill an Enemy': '擊殺敵人時',
// 新的獨特物品（易牙居有的放在下面 iya 區）
'Bonesnap': '碎骨', 'The Centurion': '百夫長', 'Hawkmail': '鷹甲', 'Boneflesh': '骨肉',
'Earthshaker': '撼地者',
'Swordguard': '劍衛', 'Soulfeast Tine': '噬魂叉', 'Warpspear': '扭曲之矛', 'Skystrike': '天擊', 'Demon Machine': '惡魔機器', 'The Grandfather': '祖父', 'Windforce': '風之力', 'Bloodmoon': '血月', 'The Reaper\'s Toll': '死神的喪鐘', 'Windhammer': '風之鎚', 'Cranebeak': '鶴嘴',
'Pompeii\'s Wrath': '龐貝之怒', 'The Gavel of Pain': '痛苦之槌',
'Blade of Ali Baba': '阿里巴巴之刃', 'Blackbog\'s Sharp': '黑沼之鋒', 'Skin of the Flayed One': '剝皮者之皮',
'Guardian Angel': '守護天使',
'Crescent Moon': '新月', 'Steel Shade': '鋼影', 'Tyrael\'s Might': '泰瑞爾的力量', 'Rune Master': '符文大師', 'Carrion Wind': '腐肉之風'
},
// 易牙居（iya-backup）譯名：物品、套裝、底材、魔法前後綴，比對網站後統一；優先於上面兩區
iya: {
'Accursed': '詛咒', 'Ambergris': '龍涎香之', 'Ancient Armor': '古代裝甲', 'Andariel\'s Visage': '安達利爾的面貌', 'Athena\'s Wrath': '雅典娜的忿怒', 'Athlete\'s': '競賽',
'Atma\'s Scarab': '亞特瑪的聖甲蟲', 'Atma\'s Wail': '亞特瑪的哭喊', 'Avenger Guard': '復仇者之盔', 'Baezil\'s Vortex': '貝西爾的漩渦', 'Bahamut\'s': '巴哈姆特',
'Barbed Club': '倒鉤錘', 'Barbed Shield': '倒刺護盾', 'Basinet': '輕鋼盔', 'Bastard Sword': '巨劍', 'Battle Gauntlets': '戰場手套', 'Bearded Axe': '鉤斧',
'Bill': '比爾長刀', 'Bing Sz Wang': '兵之王', 'Black Hades': '黑色黑帝斯', 'Blackhorn\'s Face': '黑角面具', 'Blackleach Blade': '黑水之刃', 'Blackoak Shield': '黑橡樹盾',
'Blacktongue': '黑色之舌', 'Blade Barrier': '刀刃刺盾', 'Blanched': '白化之', 'Blazing': '炎熱', 'Bloodletter': '血書', 'Bloodthief': '血之偷',
'Bloodtree Stump': '血樹殘株', 'Bone Helm': '白骨頭盔', 'Bone Visage': '骸骨面罩', 'Boneslayer Blade': '碎骨者之刃', 'Bramble Mitts': '荊棘連指手套', 'Brandistock': '叉',
'Buriza-Do Kyanon': '布里撒 多 凱南', 'Butcher\'s Pupil': '屠夫之瞳', 'Buzzing': '嗡叫', 'Camphor': '樟腦之', 'Cantor Trophy': '領唱者印記', 'Carbuncle': '紅玉之',
'Caretaker\'s': '看守人', 'Carmine': '胭脂之', 'Celestial': '天體', 'Chaos Armor': '混沌戰甲', 'Chromatic': '多彩', 'Chromatic Ire': '五彩的怒氣', 'Chu-Ko-Nu': '巧工弩',
'Cinnabar': '朱紅之', 'Cinquedeas': '強波刀', 'Cliffkiller': '岩壁殺手', 'Cloudcrack': '雲裂', 'Coif of Glory': '光榮布帽', 'Coldkill': '冷殺',
'Coldsteel Eye': '冰鋼之眼', 'Corpsemourn': '屍體的哀傷', 'Crainte Vomir': '克林 鐵弗姆', 'Crow Caw': '鴉鳴', 'Crowbill': '喙鉗', 'Crusader Bow': '十字軍之弓',
'Cuirass': '護胸甲', 'Cunning': '冷靜', 'Dacian Falx': '雙刃鐮', 'Dark Clan Crusher': '闇族毀滅者', 'Darkglow': '擴散黑暗', 'Darksight Helm': '暗視之盔',
'Defender': '防禦盾', 'Demon Limb': '惡魔爪牙', 'Demon\'s Arch': '惡魔之王', 'Demonhead': '惡魔頭蓋骨面具', 'Demonhide Armor': '魔皮戰甲', 'Demonhide Sash': '魔皮勳帶',
'Dirk': '長匕首', 'Djinn Slayer': '魔靈殺手', 'Doombringer': '末日毀滅者', 'Doomslinger': '毀滅投石者', 'Dracul\'s Grasp': '卓古拉之握', 'Dragon\'s': '龍',
'Drake\'s': '德爾克', 'Duriel\'s Shell': '都瑞爾的殼', 'Duskdeep': '黃昏深處', 'Eaglehorn': '鷹號角', 'Earth Shifter': '大地變形者', 'Eburin': '類象牙之', 'Echoing': '回音',
'Elegant Blade': '優雅之劍', 'Ember': '烈火', 'Embossed Plate': '凸紋戰甲', 'Endlesshail': '無休止的冰雹', 'Ethereal Edge': '永恆邊界',
'Executioner\'s Justice': '劊子手的裁決', 'Falchion': '彎形大刀', 'Fanged Knife': '齒緣小刀', 'Felicitous': '得體', 'Feral': '猛禽', 'Ferocious': '凶暴',
'Flamberge': '雙手飾劍', 'Flamebellow': '火焰號叫', 'Flanged Mace': '凸緣釘頭錘', 'Fleshrender': '血肉裁決者', 'Fleshripper': '裂肉者', 'Fortuitous': '偶然', 'Foul': '險惡',
'Frostwind': '冰霜之風', 'Full Helm': '高級頭盔', 'Full Plate Mail': '高級戰甲', 'Fuscina': '魔鬼之叉', 'Ghost Glaive': '鬼魂尖槍', 'Ghoulhide': '食屍鬼之外皮',
'Giant Skull': '巨骷髏', 'Giant Thresher': '鮫尾巨斧', 'Gimmershred': '碎片貪婪者', 'Ginther\'s Rift': '金瑟的裂縫', 'Glacial': '冰冷', 'Gleamscythe': '閃耀的鐮刀',
'Glimmering': '微光', 'Glorious Axe': '榮光之斧', 'Gnarled Staff': '多節棍', 'Goblin Toe': '小妖精腳趾', 'Goldskin': '黃金之皮', 'Goldstrike Arch': '金擊圓弧',
'Golemlord\'s': '石魔之王', 'Goreshovel': '血塊之鏟', 'Gothic Plate': '哥德戰甲', 'Grandmaster\'s': '宗師', 'Gravepalm': '墓穴的撫弄', 'Great Maul': '卓越巨棍',
'Great Wyrm\'s': '巨飛龍', 'Grim Helm': '殘酷頭盔', 'Grim Scythe': '殘酷鐮刀', 'Grim\'s Burning Dead': '驚怖焰亡靈', 'Guardian Naga': '蛇神守護者', 'Guardian\'s': '守護者',
'Gut Siphon': '內臟吸管', 'Gymnast\'s': '體技', 'Hawk Branded': '老鷹烙印', 'Hawkeye': '目光銳利', 'Head Hunter\'s Glory': '獵頭人的榮耀', 'Headstriker': '擊頭者',
'Heart Carver': '刻心者', 'Heavenly Garb': '天堂裝束', 'Heavy Bracers': '重型手鐲', 'Hellforge Plate': '地獄鍛甲', 'Hellslayer': '地獄毀滅者', 'Hexfire': '六角之火',
'Hibernal': '寒冬', 'Hierophant\'s': '祭師', 'Hone Sundan': '宏 森丹', 'Horizon\'s Tornado': '地平線的颱風', 'Howling': '咆哮', 'Ichorsting': '靈液之刺',
'Infernostride': '地獄闊步', 'Islestrike': '島擊', 'Ivory': '象牙之', 'Jacinth': '紅鋯石之', 'Jagged Star': '鋸齒流星鎚', 'Keeper\'s': '管理者', 'Kelpie Snare': '水魔陷阱',
'Kenshi\'s': '劍聖', 'King\'s': '國王', 'Knight\'s': '騎士', 'Kris': '波形刀', 'Kuko Shakaku': '社角久子', 'Lance of Yaggai': '雅該長矛', 'Lancer\'s': '長槍兵',
'Lapis Lazuli': '青金石之', 'Lava Gout': '熔岩角羊', 'Legendary Mallet': '傳說之鎚', 'Lenymo': '雷摩尼', 'Light Plate': '輕型裝甲', 'Linked Mail': '連扣戰甲',
'Lion Branded': '獅子烙印', 'Lord\'s': '君王', 'Loricated Mail': '甲殼鎧鱗甲', 'Luna': '月精靈護盾', 'Magewrath': '巫師之怒', 'Maiden\'s': '處女', 'Mancatcher': '刺人槍',
'Mang Song\'s Lesson': '梅格之歌的教訓', 'Marrowwalk': '骨隨行走', 'Martel de Fer': '戰鎚', 'Merciless': '絕情', 'Messerschmidt\'s Reaver': '希梅斯特的掠奪',
'Meteoric': '隕鐵', 'Military Pick': '軍用鍬', 'Mnemonic': '記憶', 'Monk\'s': '僧人', 'Moonfall': '落月', 'Moser\'s Blessed Circle': '摩西祝福之環',
'Necromancer\'s': '死靈法師', 'Nokozan Relic': '諾科藍遺物', 'Nord\'s Tenderizer': '諾德的蝕肉藥', 'Noxious': '有害', 'Ocher': '赭黃', 'Ogre Maul': '食人魔之錘',
'Ondal\'s Wisdom': '安戴爾的智慧', 'Ornate Plate': '華麗戰甲', 'Partizan': '戰戟', 'Peasant Crown': '粗野之冠', 'Pierre Tombale Couant': '皮爾 通把 考恩特',
'Plate Mail': '鎧甲', 'Powered': '力量十足', 'Prismatic': '棱鏡', 'Psychic': '心靈', 'Pus Spitter': '毒液怪', 'Quarterstaff': '六呎棍', 'Raging': '猛烈',
'Rattlecage': '作響之籠', 'Razor\'s Edge': '刀鋒邊緣', 'Razorswitch': '擺動剃刀', 'Razortine': '剃刀之叉', 'Realgar': '雄黃之', 'Reinforced Mace': '強化釘頭錘',
'Repeating Crossbow': '連射十字弓', 'Resonant': '迴響', 'Ribcracker': '肋骨粉碎者', 'Ring Mail': '鎖環甲', 'Riphook': '撕裂之鉤', 'Ripsaw': '粗齒大鋸',
'Rockstopper': '岩石制動器', 'Rondel': '詩歌匕首', 'Rose Branded': '玫瑰烙印', 'Rusty': '鐵鏽之', 'Saintly': '崇高', 'Sandstorm Trek': '沙暴之旅', 'Sanguinary': '噬殺',
'Scarlet': '猩紅之', 'Schaefer\'s Hammer': '史恰佛之鎚', 'Scintillating': '閃閃發光', 'Scissors Suwayyah': '近身剪', 'Scutum': '鱗盾', 'Sensei\'s': '劍士',
'Serpent Lord': '海蛇之王', 'Shadow Plate': '陰影鎧甲', 'Shaftstop': '謝夫特斯坦布', 'Shaman\'s': '巫師', 'Shamshir': '虛偽之刃', 'Silks of the Victor': '勝利者之絲綢',
'Silkweave': '沙織', 'Skewer of Krintiz': '格林提斯的肉叉', 'Skull Collector': '骷髏收集者', 'Skull Splitter': '切開骷髏', 'Small Charm': '小護身符', 'Snowclash': '雪之衝突',
'Snowflake': '雪白', 'Soldier\'s': '士兵', 'Soul Drainer': '吸魂者', 'Soul Harvest': '靈魂採集者', 'Spearmaiden\'s': '女矛手', 'Spellsteel': '鋼鐵魔咒',
'Spetum': '大戰戟', 'Spike Thorn': '尖刺根源', 'Spiked Club': '狼牙棒', 'Spiked Shield': '尖刺盾牌', 'Spirit Forge': '靈魂鎔爐', 'Steel Carapace': '鋼鐵鎧甲',
'Steeldriver': '鐵製大槌', 'Steelgoad': '鐵刺棒', 'Stone Crusher': '碎石者', 'Stormchaser': '風暴追逐者', 'Stormlash': '暴風之結', 'Stormrider': '暴風騎士',
'Stormshield': '暴風之盾', 'Stormspire': '暴風尖塔', 'Stoutnail': '堅硬的指甲', 'String of Ears': '長串之耳', 'Sturdy': '結實', 'Summoner\'s': '召喚者',
'Sureshrill Frost': '尖嘯冰霜', 'Swirling Crystal': '渦流水晶', 'Swordback Hold': '劍背之架', 'Templar Coat': '聖堂武士外袍', 'Templar\'s Might': '聖堂武士的力量',
'Terra\'s': '祭司', 'The Atlantean': '亞特拉斯', 'The Battlebranch': '戰鬥支系', 'The Cranium Basher': '碎腦錘', 'The Diggler': '迪格勒',
'The Gavel Of Pain': '痛苦木槌', 'The Grim Reaper': '冷酷開膛手', 'The Jade Tan Do': '坦社之玉', 'The Minotaur': '牛頭怪', 'The Spirit Shroud': '靈魂帷幕',
'The Vile Husk': '卑劣軀殼', 'Thresher': '銳利之斧', 'Thunder Maul': '雷錘', 'Tiamat\'s Rebuke': '魔龍的非難', 'Tigulated Mail': '提格萊特戰甲',
'Todesfaelle Flamme': '特迪斯法雷 芙米法', 'Tomb Reaver': '盜墓者', 'Trickster\'s': '欺詐', 'Troll Nest': '洞穴巨魔巢穴骨盾', 'Tulwar': '圓月彎刀', 'Turquoise': '綠松石之',
'Tyrant Club': '暴君之棒', 'Valkyrie\'s': '女武神', 'Vampire Gaze': '吸血鬼的凝視', 'Venom Grip': '劇毒之抓', 'Venom Ward': '毒液牢房', 'Vermillion': '朱砂之',
'Veteran\'s': '老手', 'Vicious': '惡毒', 'Viperfork': '蝮蛇叉', 'Visceratuant': '維斯爾坦特', 'Visionary': '幻影', 'Voulge': '鉤鐮槍', 'Vulpine': '奸詐',
'Wailing': '哭號', 'Wake Of Inferno': '復甦獄火', 'Wall of the Eyeless': '無眼之牆', 'Wand': '法杖', 'War Club': '巨戰木棍', 'War Fork': '巨戰之叉',
'War Scythe': '巨戰鐮刀', 'Warder\'s': '主管', 'Warlord\'s Trust': '戰爵之證', 'Warrior\'s': '戰士', 'Warshrike': '戰爭之鳥', 'Waterwalk': '水上飄',
'Widowmaker': '戮夫刃', 'Winged Knife': '翼刀', 'Witch-hunter\'s': '女巫獵人', 'Witchwild String': '狂野之弦', 'Wizendraw': '凋謝之畫', 'Wormskull': '溫暖骷髏',
'Wraith Flight': '死靈夜翔', 'Wyrm\'s': '維特', 'Yari': '三叉長槍', 'Zircon': '鋯石之', 'Zweihander': '韓瑞德之劍'
}
};
/* Traditional Chinese layer for the local D2 Survivors copy. */
(function () {
'use strict';
const STORAGE_KEY = 'd2-survivors-language';
const FONT_STACK = '"Cinzel", "Microsoft JhengHei UI", "Microsoft JhengHei", "Noto Sans TC", "PingFang TC", sans-serif';
const labels = {
'Level Up': '升級',
'LEVEL UP': '升級',
'Paused': '已暫停',
'OPTIONS': '選項',
'Options': '選項',
'SAVE AND EXIT GAME': '儲存並離開遊戲',
'Save and exit game': '儲存並離開遊戲',
'RETURN TO GAME': '返回遊戲',
'Return to game (Esc)': '返回遊戲（Esc）',
'Previous menu (Esc)': '返回上一個選單（Esc）',
'Sound': '音效',
'Music': '音樂',
'Mute': '靜音',
'Play again (Enter)': '再玩一次（Enter）',
'PLAY AGAIN': '再玩一次',
"CHARSI'S WARES": '恰西的貨品',
"Charsi's Wares": '恰西的貨品',
"Charsi's wares": '恰西的貨品',
'Visit Charsi (T)': '拜訪恰西（T）',
'MAIN MENU': '主選單',
'Main menu': '主選單',
'Main menu (Esc)': '主選單（Esc）',
'Main menu (Enter)': '主選單（Enter）',
'Inventory (I)': '物品欄（I）',
'Buy back (B)': '回購（B）',
'Buy Back': '回購',
'Gamble (G)': '賭博（G）',
'New Run': '新的一輪',
'NEW RUN': '新的一輪',
'New run': '新的一輪',
'New Run (Enter)': '開始新的一輪（Enter）',
'Start a new run (Enter)': '開始新的一輪（Enter）',
'Automap': '自動地圖',
'Character': '角色',
'Pause': '暫停',
'Close': '關閉',
'Close (Esc)': '關閉（Esc）',
'Drop': '丟棄',
'Leave': '離開',
'Continue': '繼續',
'Continue (Enter)': '繼續（Enter）',
'Choose class': '選擇職業',
'Choose Class': '選擇職業',
'NEXT HERO': '下一位英雄',
'Previous hero': '上一位英雄',
'Next hero': '下一位英雄',
'Cancel (Esc)': '取消（Esc）',
'Cancel': '取消',
'Transfer save': '轉移存檔',
'Transfer Save': '轉移存檔',
'TRANSFER SAVE': '轉移存檔',
'Copy code': '複製代碼',
'COPY DIAGNOSTICS': '複製診斷資訊',
'Save imported.': '存檔已匯入。',
'Save too large': '存檔太大',
'Click or press any key': '點擊或按下任意按鍵',
'Click or press any key to continue': '點擊或按下任意按鍵以繼續',
'Click to pick up · Right-click to equip · Shift-click to sell · Esc to close': '左鍵拾取 · 右鍵裝備 · Shift＋左鍵出售 · Esc 關閉',
'Click to pick up · Ctrl-click to move across · Right-click to equip': '左鍵拾取 · Ctrl＋左鍵移動 · 右鍵裝備',
'Tap to pick up an item, tap again to put it down · Hold to equip or take off': '點一下拾取物品，再點一下放下 · 長按以裝備或卸下',
'Tap to pick up an item, tap the stash or inventory to put it down': '點一下拾取物品，再點儲物箱或物品欄放下',
'Tap an item to see it': '點選物品查看',
'Tap a ware to see it': '點選貨品查看',
'Tap a ware to buy it': '點選貨品購買',
'Tap an item to see it': '點選物品查看',
'Tap again to buy': '再點一次購買',
'Tap again to buy it back': '再點一次回購',
'Tap again to gamble': '再點一次賭博',
'Click an item to buy it back': '點擊物品即可回購',
'Click an item to gamble': '點擊物品即可賭博',
'Tap a card to pick it': '點選卡片以選擇',
'Tap to continue': '點一下繼續',
'Click for every skill (T)': '按 T 檢視所有技能',
'A code from another browser replaces this browser\'s save.': '來自另一個瀏覽器的代碼會取代此瀏覽器的存檔。',
'The Smith': '鐵匠',
'Baal has been slain': '巴爾已被擊殺',
'Unofficial fan project, not affiliated with or endorsed by Blizzard Entertainment. Diablo® is a trademark of Blizzard Entertainment, Inc.': '非官方粉絲作品，與 Blizzard Entertainment 無關，亦未獲其認可或背書。Diablo® 為 Blizzard Entertainment, Inc. 的商標。',
'Unofficial fan project, not affiliated with or endorsed by Blizzard Entertainment. Diablo® is a trademark of Blizzard Entertainment, Inc': '非官方粉絲作品，與 Blizzard Entertainment 無關，亦未獲其認可或背書。Diablo® 為 Blizzard Entertainment, Inc. 的商標。',
'The Secret of the Vizjerei': '維茲傑雷的祕密',
'A Vampire Survivors-style tribute to Diablo II: Lord of Destruction': '向《暗黑破壞神 II：毀滅之王》致敬的倖存者類型遊戲',
'D2 Survivors in its own window, offline': '在獨立視窗中遊玩 D2 Survivors',
'Better chance that items dropped are magic, rare or unique': '提高掉落物品為魔法、稀有或獨特品質的機率',
'Life now, and its maximum': '目前生命值與生命上限',
'Life regained every second': '每秒恢復的生命值',
'Gold banked for Charsi': '恰西保管的金幣',
'At most 75%, more with +% to Maximum Resist': '最高 75%；提高抗性上限可再增加',
'Blocking with a shield goes by it too': '使用盾牌格擋時也會套用',
'A level past a skill\'s maximum still adds to it, as in D2': '技能超過最高等級後仍會繼續增加效果，如同 D2',
'Carry your gold, Charsi\'s upgrades and gear to D2 Survivors in another browser or on another device.': '將金幣、恰西的升級與裝備轉移到其他瀏覽器或裝置上的 D2 Survivors。',
'Best time': '最佳紀錄',
'Coming soon': '即將推出',
'Could not resume the saved run': '無法繼續已儲存的遊戲進度',
'No one can use that': '沒有角色能使用此物品',
'No room to swap that': '沒有空間交換此物品',
'Nothing of yours needs repair': '你的裝備不需要修理',
'You gambled': '你購得賭博物品',
'You have died': '你已死亡',
'You have no room for that': '沒有空間放置此物品',
'Your class can\'t use this': '你的職業無法使用此物品',
'What a hero sells stays here': '英雄出售的物品會留在這裡',
'The portal is open already': '傳送門已經開啟',
'Replace Your Save?': '要取代目前的存檔嗎？',
'Paste a save code first.': '請先貼上存檔代碼。',
'Paste a save code here': '在此貼上存檔代碼',
'Select the code and copy it': '選取代碼並複製',
'That code comes from a newer version of D2 Survivors. Reload this page to update, then try again.': '此代碼來自較新版本的 D2 Survivors。請重新載入頁面更新後再試一次。',
'That code holds gear this version of D2 Survivors doesn\'t know. Reload this page to update, then try again.': '此代碼包含目前版本不支援的裝備。請重新載入頁面更新後再試一次。',
'That code is damaged. Copy all of it again and paste it here.': '此代碼已損毀。請重新完整複製後再貼上。',
'That code doesn\'t hold a save D2 Survivors can use.': '此代碼不包含 D2 Survivors 可讀取的存檔。',
'That isn\'t a D2 Survivors save code.': '這不是 D2 Survivors 的存檔代碼。',
'That\'s too long to be a save code.': '此內容過長，無法作為存檔代碼。',
'This browser can\'t make a save code.': '此瀏覽器無法產生存檔代碼。',
'SINGLE PLAYER': '單人遊戲',
'Sound on': '音效開啟',
'Sound off': '音效關閉',
'PREVIOUS MENU': '返回上一個選單',
'RESTART TO UPDATE': '重新啟動以套用更新',
'CREDITS / LEGAL': '製作人員／法律聲明',
'D2 Survivors diagnostics': 'D2 Survivors 診斷資訊',
'D2 Survivors is open in another tab': 'D2 Survivors 已在另一個分頁中開啟',
'D2 Survivors is an unofficial, free fan project. It is not affiliated with, endorsed, sponsored or approved by Blizzard Entertainment, Inc.': 'D2 Survivors 是免費的非官方粉絲作品，與 Blizzard Entertainment, Inc. 無關，亦未獲其認可、贊助或核准。',
'Diminishing for rares and uniques, as in D2': '如同 D2，對稀有與獨特物品的效果會遞減。',
'Golems get +25% life, +10% damage and +8% speed': '石魔獲得 +25% 生命、+10% 傷害與 +8% 速度',
'Half as much Faster Cast Rate: attacks here recharge as spells do': '此處快速施法率效果減半：攻擊的冷卻速度比照法術。',
'How much faster the hero runs': '英雄跑步速度的提升幅度',
'Its dose added to every weapon blow: its average goes to Attack Damage': '此效果會加到每次武器攻擊；平均值計入攻擊傷害。',
'Its hits come as monsters strike you': '怪物攻擊你時觸發命中效果。',
'Less damage from every hit taken': '每次受到攻擊時減少傷害',
'Pick things up from 40% farther away': '拾取物品的距離增加 40%',
'Tap a ware, then tap it again': '點選一件貨品，再點一次以確認',
'Tap again to pick it': '再點一次即可拾取',
'The Ancients awaken': '先祖甦醒了',
'The Worldstone is safe.': '世界之石已安全。',
'You don\'t have Wirt\'s Leg': '你沒有維特之腳',
'travel: cow portal': '傳送：奶牛關入口',
'WINDOWS (BETA)': 'Windows（測試版）',
'COPY FAILED': '複製失敗',
'Select Hero Class': '選擇英雄職業',
'TIP THE DEV': '贊助開發者',
'Every hero can reach it': '每位英雄都能達到此處',
'The display was lost': '顯示畫面已中斷',
'The display was lost: reload notice shown': '顯示畫面已中斷：已顯示重新載入提示',
'This browser': '此瀏覽器',
'The code': '代碼',
'The Cow King': '奶牛之王',
'No errors or warnings.': '沒有錯誤或警告。',
'none in play yet': '目前尚無遊戲資料',
'no best time': '暫無最佳紀錄',
'Software rendering: update your graphics driver': '目前使用軟體繪圖，請更新顯示卡驅動程式',
'On a Mac': '在 Mac 上',
'An error occurred': '發生錯誤',
'Campfire (Enter)': '營火（Enter）',
'Build complete': '建置完成',
'Drag a slider to adjust': '拖曳滑桿調整',
'First launch on Windows (beta)': 'Windows 首次啟動（測試版）',
'Lord of Destruction': '毀滅之王',
'DESKTOP APP': '桌面版應用程式',
'Last errors and warnings:': '最近的錯誤與警告：',
'Taken:': '已取得：',
'Open the .dmg and drag D2 Survivors into Applications. It keeps itself up to date.': '打開 .dmg，將 D2 Survivors 拖入「應用程式」資料夾。程式會自動保持更新。',
'display lost': '畫面中斷',
'display lost: reload notice shown': '畫面中斷：已顯示重新載入提示',
'display reloading': '正在重新載入畫面',
'display restored': '畫面已恢復',
'display resumable': '遊戲進度可繼續',
'no WebGL context': '沒有可用的 WebGL 繪圖環境',
'No available renderer for the current environment': '目前環境沒有可用的繪圖方式',
'D2\'s Exocet didn\'t build': 'D2 Exocet 標題無法正確載入',
'thorns (gear)': '荊棘（裝備效果）',
'Lion Branded': '獅印之',
'until that hero\'s next run': '直到該英雄開始下一輪遊戲為止',
'CONTROLLER': '手把',
'RUMBLE': '震動',
'STICK DEAD ZONE': '搖桿死區',
'PRESS A BUTTON': '請按下按鍵',
'RESET TO DEFAULTS': '恢復預設值',
'BELT 1': '腰帶 1',
'BELT 2': '腰帶 2',
'BELT 3': '腰帶 3',
'BELT 4': '腰帶 4',
'INTERACT': '互動',
'SKILL LIST': '技能列表',
'GAME MENU': '遊戲選單',
'PICK SKILL LEFT': '選擇左邊技能',
'PICK SKILL RIGHT': '選擇右邊技能',
'REST SKILL': '休息技能',
'D-pad Up': '十字鍵上',
'D-pad Down': '十字鍵下',
'D-pad Left': '十字鍵左',
'D-pad Right': '十字鍵右',
'ON': '開',
'OFF': '關',
'AUTO STATS': '自動配點',
'END THE RUN': '結束這一輪',
'GAME FILES': '遊戲檔案',
'UPDATES': '更新',
'NEWS': '最新消息',
'REPORT': '回報問題',
'Pick': '選擇',
'Pick up': '拿起',
'Put back': '放回',
'Put down': '放下',
'Select': '選擇',
'START': '開始',
'LANGUAGE': '遊戲語言',
'Unofficial fan project, not affiliated with Blizzard Entertainment. Diablo II® is a trademark of Blizzard Entertainment, Inc.': '非官方粉絲作品，與 Blizzard Entertainment 無關。Diablo II® 為 Blizzard Entertainment, Inc. 的商標。'
};
const vocabulary = [
['Maximum Life', '生命上限'], ['maximum life', '生命上限'], ['Maximum Mana', '法力上限'],
['Attack Damage', '攻擊傷害'], ['Physical Damage', '物理傷害'], ['Fire Damage', '火焰傷害'],
['Cold Damage', '冰寒傷害'], ['Lightning Damage', '閃電傷害'], ['Poison Damage', '毒素傷害'],
['Magic Damage', '魔法傷害'], ['Area Damage', '範圍傷害'], ['Attack Rating', '攻擊準確率'],
['Enhanced Damage', '增強傷害'], ['Enhanced Defense', '增強防禦'], ['Critical Strike', '致命攻擊'],
['Faster Cast Rate', '快速施法率'], ['Faster Hit Recovery', '快速打擊恢復'],
['Faster Block Rate', '快速格擋率'], ['Life Stolen Per Hit', '擊中偷取生命'],
['Mana Stolen Per Hit', '擊中偷取法力'], ['Magic Find', '尋獲魔法物品機率'],
['Gold Find', '尋獲金幣機率'], ['Chance to Block', '格擋機率'], ['Damage Taken', '受到的傷害'],
['damage taken', '受到的傷害'], ['life per second', '每秒生命值'], ['per second', '每秒'],
['per rank', '每級'], ['per level', '每級'], ['per kill', '每次擊殺'], ['on kill', '擊殺時'],
['when struck', '受到攻擊時'], ['on striking', '攻擊時'], ['when equipped', '裝備時'],
['while equipped', '裝備時'], ['chance of', '機率'], ['chance to', '機率'],
['movement speed', '移動速度'], ['attack speed', '攻擊速度'], ['cooldowns', '冷卻時間'],
['cooldown', '冷卻時間'], ['critical strike', '致命攻擊'], ['crit', '暴擊'],
['maximum life', '生命上限'], ['maximum mana', '法力上限'], ['life regeneration', '生命恢復'],
['mana regeneration', '法力恢復'], ['life stolen', '偷取生命'], ['mana stolen', '偷取法力'],
['resistance', '抗性'], ['resistances', '抗性'], ['resist', '抗性'], ['damage', '傷害'],
['defense', '防禦'], ['armor', '護甲'], ['block', '格擋'], ['strength', '力量'],
['dexterity', '敏捷'], ['vitality', '體力'], ['energy', '精力'], ['experience', '經驗值'],
['gold', '金幣'], ['kills', '擊殺'], ['kill', '擊殺'], ['level', '等級'], ['life', '生命'],
['mana', '法力'], ['health', '生命'], ['fire', '火焰'], ['cold', '冰寒'],
['lightning', '閃電'], ['poison', '毒素'], ['physical', '物理'], ['magic', '魔法'],
['normal', '普通'], ['nightmare', '惡夢'], ['hell', '地獄'], ['unique', '獨特'],
['rare', '稀有'], ['magic item', '魔法物品'], ['items', '物品'], ['item', '物品'],
['monsters', '怪物'], ['monster', '怪物'], ['bosses', '首領'], ['boss', '首領'],
['skills', '技能'], ['skill', '技能'], ['passives', '被動技能'], ['passive', '被動技能'],
['attributes', '屬性'], ['attribute', '屬性'], ['weapon', '武器'], ['shield', '盾牌'],
['helmet', '頭盔'], ['helm', '頭盔'], ['body armor', '盔甲'], ['boots', '靴子'],
['gloves', '手套'], ['belt', '腰帶'], ['ring', '戒指'], ['amulet', '護身符'],
['inventory', '物品欄'], ['stash', '儲物箱'], ['equip', '裝備'], ['equipped', '已裝備'],
['unequip', '卸下'], ['sell', '出售'], ['buy', '購買'], ['buy back', '回購'],
['gamble', '賭博'], ['gold per rank', '每級金幣'], ['points', '點數'], ['point', '點數'],
['chance', '機率'], ['duration', '持續時間'], ['seconds', '秒'], ['second', '秒'],
['radius', '範圍'], ['area', '範圍'], ['range', '距離'], ['speed', '速度'],
['summon', '召喚'], ['summons', '召喚物'], ['pierce', '穿透'], ['knockback', '擊退'],
['stun', '暈眩'], ['burns', '燃燒'], ['burn', '燃燒'], ['chilled', '冰冷'],
['slowed', '緩速'], ['damage per second', '每秒傷害'], ['more damage', '額外傷害'],
['less damage', '減少傷害'], ['all skills', '所有技能'], ['to all skills', '所有技能'],
['per hit', '每次命中'], ['per strike', '每次攻擊'], ['per projectile', '每枚飛射物'],
['chance of a critical strike', '致命攻擊機率'], ['critical damage', '致命傷害'],
['cold resistance', '冰寒抗性'], ['fire resistance', '火焰抗性'],
['lightning resistance', '閃電抗性'], ['poison resistance', '毒素抗性'],
['cold resist', '冰寒抗性'], ['fire resist', '火焰抗性'],
['lightning resist', '閃電抗性'], ['poison resist', '毒素抗性'],
['all resistances', '所有抗性'], ['all resist', '所有抗性'],
['open wounds', '撕裂傷口'], ['crushing blow', '壓碎性打擊'], ['deadly strike', '致命攻擊'],
['life tap', '生命偷取詛咒'], ['amplify damage', '傷害加深'], ['decrepify', '衰老'],
['aura', '靈氣'], ['holy', '神聖'], ['summoned', '召喚的'], ['undead', '不死生物'],
['elite', '精英'], ['champion', '冠軍怪物'], ['frenzy', '狂亂'], ['blessed', '祝福'],
['attack', '攻擊'], ['attacks', '攻擊'], ['cast', '施放'], ['casts', '施放'],
['throw', '投擲'], ['thrown', '投擲'], ['arrow', '箭矢'], ['arrows', '箭矢'],
['bolt', '彈矢'], ['bolts', '彈矢'], ['blade', '刀刃'], ['blades', '刀刃'],
['hammer', '戰鎚'], ['spear', '長矛'], ['javelin', '標槍'], ['axe', '斧'],
['sword', '劍'], ['staff', '法杖'], ['wand', '魔杖'], ['bow', '弓'],
['orb', '法珠'], ['skull', '頭骨'], ['ring', '戒指'], ['amulet', '護身符'],
['amazon', '亞馬遜'], ['assassin', '刺客'], ['barbarian', '野蠻人'],
['druid', '德魯伊'], ['necromancer', '死靈法師'], ['paladin', '聖騎士'],
['sorceress', '女巫'], ['act', '幕'], ['level up', '升級'], ['paused', '已暫停'],
['options', '選項'], ['main menu', '主選單'], ['new run', '新的一輪'],
['play again', '再玩一次'], ['return to game', '返回遊戲'], ['save and exit game', '儲存並離開遊戲'],
['character', '角色'], ['automap', '自動地圖'], ['close', '關閉'], ['drop', '丟棄'],
['reroll', '重抽'], ['skip', '略過'], ['banish', '放逐'], ['maxed', '已達上限'],
['learned', '已習得'], ['evolved', '已進化'], ['next level', '下一級'], ['level ', '等級 ']
];
const names = [
['Andariel', '安達莉爾'], ['Duriel', '督瑞爾'], ['Mephisto', '墨菲斯托'],
['Diablo', '迪亞布羅'], ['Baal', '巴爾'], ['Blood Raven', '血鴉'],
['The Smith', '鐵匠'], ['Countess', '女伯爵'], ['Summoner', '召喚者'],
['Nihlathak', '尼拉塞克'], ['Izual', '衣卒爾'], ['Hephasto', '海法斯特'],
['Rakanishu', '拉卡尼休'], ['Griswold', '格瑞斯華爾德'], ['Charsi', '恰西'],
['Akara', '阿卡拉'], ['Kashya', '卡夏'], ['Warriv', '瓦瑞夫'], ['Gheed', '基德'],
['Deckard Cain', '迪卡·凱恩'], ['Fara', '法拉'], ['Drognan', '卓格南'],
['Ormus', '奧瑪斯'], ['Asheara', '艾席拉'], ['Jamella', '潔梅拉'],
['Halbu', '哈爾布'], ['Malah', '瑪拉'], ['Anya', '安雅'],
['Rogue Encampment', '羅格營地'], ['Blood Moor', '鮮血荒地'], ['Cold Plains', '冰冷之原'],
['Stony Field', '石塊曠野'], ['Dark Wood', '黑暗森林'], ['Black Marsh', '黑色荒地'],
['Catacombs', '地下墓穴'], ['Lut Gholein', '魯·高因'], ['Rocky Waste', '岩石荒地'],
['Dry Hills', '乾燥高地'], ['Far Oasis', '遙遠綠洲'], ['Lost City', '遺忘之城'],
['Arcane Sanctuary', '秘法聖所'], ['Kurast Docks', '庫拉斯特港口'],
['Spider Forest', '蜘蛛森林'], ['Great Marsh', '龐大濕地'], ['Flayer Jungle', '剝皮叢林'],
['Lower Kurast', '庫拉斯特下層'], ['Upper Kurast', '庫拉斯特上層'],
['Travincal', '崔凡克'], ['Pandemonium Fortress', '混沌避難所'],
['Den of Evil', '邪惡洞窟'], ['Normal', '普通'], ['Nightmare', '惡夢'], ['Hell', '地獄'],
['Magic Arrow', '魔法箭'], ['Fire Arrow', '火焰箭'], ['Cold Arrow', '冰箭'],
['Multiple Shot', '多重箭'], ['Exploding Arrow', '爆裂箭'], ['Guided Arrow', '導引箭'],
['Strafe', '掃射'], ['Valkyrie', '女武神'], ['Lightning Fury', '閃電之怒'],
['Fire Blast', '火焰爆震'], ['Wake of Fire', '火焰復甦'], ['Blade Fury', '刀刃之怒'],
['Lightning Sentry', '閃電守衛'], ['Death Sentry', '亡者守衛'], ['Dragon Talon', '龍爪'],
['Bash', '猛擊'], ['Double Swing', '雙手揮擊'], ['Frenzy', '狂亂'], ['Whirlwind', '旋風'],
['Leap Attack', '跳躍攻擊'], ['Battle Orders', '戰鬥命令'], ['Battle Cry', '戰鬥吶喊'],
['Berserk', '狂戰士'], ['Firestorm', '火風暴'], ['Molten Boulder', '熔岩巨石'],
['Fissure', '火山裂隙'], ['Volcano', '火山爆'], ['Armageddon', '毀天滅地'],
['Tornado', '龍捲風'], ['Hurricane', '颶風'], ['Cyclone Armor', '旋風裝甲'],
['Bone Spear', '骨矛'], ['Bone Spirit', '骨魂'], ['Corpse Explosion', '屍體爆炸'],
['Raise Skeleton', '復甦骷髏'], ['Poison Nova', '毒爆'], ['Clay Golem', '黏土石魔'],
['Iron Golem', '鋼鐵石魔'], ['Blessed Hammer', '祝福之槌'], ['Holy Bolt', '聖光彈'],
['Fist of the Heavens', '天堂之拳'], ['Zeal', '熱誠'], ['Holy Fire', '聖火'],
['Holy Freeze', '神聖冰凍'], ['Holy Shock', '神聖電擊'], ['Fanaticism', '狂熱'],
['Fire Bolt', '火彈'], ['Fire Ball', '火球'], ['Meteor', '隕石'], ['Frozen Orb', '冰封球'],
['Blizzard', '暴風雪'], ['Chain Lightning', '連鎖閃電'], ['Charged Bolt', '充能彈'],
['Teleport', '傳送'], ['Static Field', '靜態力場'], ['Hydra', '九頭海蛇'],
['Short Sword', '短劍'], ['Long Sword', '長劍'], ['Broad Sword', '闊劍'],
['Crystal Sword', '水晶劍'], ['Phase Blade', '幻化之刃'], ['Berserker Axe', '狂戰士斧'],
['War Pike', '戰槍'], ['Colossus Blade', '巨神之刃'], ['Ring Mail', '環甲'],
['Chain Mail', '鎖子甲'], ['Archon Plate', '執政官鎧甲'], ['Monarch', '統治者大盾'],
['El Rune', '艾爾符文'], ['Eld Rune', '艾德符文'], ['Tir Rune', '特爾符文'],
['Nef Rune', '內夫符文'], ['Eth Rune', '艾斯符文'], ['Ith Rune', '伊司符文'],
['Tal Rune', '塔爾符文'], ['Ral Rune', '拉爾符文'], ['Ort Rune', '歐特符文'],
['Thul Rune', '書爾符文'], ['Amn Rune', '安姆符文'], ['Sol Rune', '索爾符文'],
['Shael Rune', '夏符文'], ['Dol Rune', '多爾符文'], ['Hel Rune', '海爾符文'],
['Io Rune', '伊歐符文'], ['Lum Rune', '盧姆符文'], ['Ko Rune', '科符文'],
['Fal Rune', '法爾符文'], ['Lem Rune', '藍姆符文'], ['Pul Rune', '普爾符文'],
['Um Rune', '烏姆符文'], ['Mal Rune', '馬爾符文'], ['Ist Rune', '伊斯特符文'],
['Gul Rune', '古爾符文'], ['Vex Rune', '伐克斯符文'], ['Ohm Rune', '歐姆符文'],
['Lo Rune', '羅符文'], ['Sur Rune', '瑟符文'], ['Ber Rune', '貝符文'],
['Jah Rune', '喬符文'], ['Cham Rune', '查姆符文'], ['Zod Rune', '薩德符文']
];
const extraNames = [
['Achmel the Cursed', '詛咒者亞克姆'], ['Ancient Kaa the Soulless', '無魂者古代卡'],
['Bartuc the Bloody', '血腥巴特克'], ['Battlemaid Sarina', '戰鬥女僕莎蓮娜'],
['Bremm Sparkfist', '電拳布瑞姆'], ['Coldworm the Burrower', '掘地者寒蟲'],
['Colenzo the Annihilator', '毀滅者科倫索'], ['Eldritch the Rectifier', '懲戒者艾德瑞奇'],
['Eyeback the Unleashed', '解放者眼背'], ['Geleb Flamefinger', '火指吉列布'],
['Grand Vizier of Chaos', '混沌大臣'], ['Hephasto the Armorer', '盔甲匠海法斯特'],
['Ismail Vilehand', '邪惡之手伊斯梅爾'], ['Korlic the Protector', '守護者科力克'],
['Lister the Tormentor', '折磨者利斯特'], ['Lord De Seis', '西希之王'],
['Madawc the Guardian', '守衛者馬道克'], ['Maffer Dragonhand', '龍手馬弗'],
['Shenk the Overseer', '督軍申克'], ['Snapchip Shatter', '碎片粉碎者'],
['Sszark the Burning', '燃燒者斯札克'], ['Talic the Defender', '防禦者塔力克'],
['Toorc Icefist', '冰拳圖克'], ['Ventar the Unholy', '邪惡者文特'],
['Witch Doctor Endugu', '巫醫恩杜古'], ['Wyand Voidbringer', '虛空使者懷安'],
['Arreat Plateau', '亞瑞特高原'], ['Arreat Summit', '亞瑞特山頂'],
['Arreat\'s Face', '亞瑞特之面'], ['Bloody Foothills', '血腥丘陵'],
['Chaos Sanctuary', '混沌避難所'], ['City of the Damned', '苦痛之城'],
['Claw Viper Temple', '利爪蝮蛇神殿'], ['Crystalline Passage', '水晶通道'],
['Durance of Hate', '憎恨囚牢'], ['Frigid Highlands', '冰凍高地'],
['Frozen River', '冰凍之河'], ['Frozen Tundra', '冰凍苔原'],
['Glacial Trail', '冰河路徑'], ['Halls of Vaught', '瓦特大廳'],
['Kurast Bazaar', '庫拉斯特市集'], ['Kurast Causeway', '庫拉斯特堤道'],
['Monastery Gate', '修道院大門'], ['Outer Steppes', '外側草原'],
['Plains of Despair', '絕望平原'], ['River of Flame', '火焰之河'],
['Tal Rasha\'s Tomb', '塔拉夏古墓'], ['Tamoe Highland', '泰摩高地'],
['Throne of Destruction', '毀滅王座'], ['Valley of Snakes', '蛇谷'],
['Worldstone Chamber', '世界之石大殿'], ['Worldstone Keep', '世界之石要塞'],
['Akaran Rondache', '阿卡蘭圓盾'], ['Akaran Targe', '阿卡蘭輕圓盾'],
['Avenger Guard', '復仇者頭盔'], ['Balrog Skin', '巴爾洛格之皮'],
['Battle Cestus', '戰鬥拳刃'], ['Battle Dart', '戰鬥飛鏢'],
['Battle Gauntlets', '戰鬥手套'], ['Cantor Trophy', '吟唱者獎章'],
['Ceremonial Pike', '儀式長矛'], ['Cloudy Sphere', '雲霧法珠'],
['Colossus Crossbow', '巨神十字弓'], ['Colossus Girdle', '巨神腰帶'],
['Conqueror Crown', '征服者皇冠'], ['Crusader Gauntlets', '十字軍手套'],
['Crystalline Globe', '水晶法球'], ['Dacian Falx', '達契亞長刀'],
['Demon Head', '惡魔頭骨'], ['Demon Heart', '惡魔之心'],
['Demonhide Sash', '惡魔皮腰帶'], ['Dimensional Shard', '次元碎片'],
['Divine Scepter', '神聖權杖'], ['Dusk Shroud', '灰暮罩衣'],
['Falcon Mask', '獵鷹面具'], ['Feral Claws', '狂暴之爪'],
['Fetish Trophy', '妖人獎章'], ['Field Plate', '戰場鎧甲'],
['Flanged Mace', '凸緣錘'], ['Flying Knife', '飛刀'], ['Fury Visor', '狂怒面甲'],
['Gargoyle Head', '石像鬼頭骨'], ['Ghost Glaive', '幽靈戰戟'],
['Glorious Axe', '榮耀之斧'], ['Glowing Orb', '發光法珠'],
['Gnarled Staff', '扭曲法杖'], ['Grand Crown', '巨型皇冠'],
['Grand Scepter', '巨型權杖'], ['Great Pilum', '巨型標槍'],
['Great Poleaxe', '巨型長柄斧'], ['Greater Claws', '巨型爪'],
['Greater Talons', '巨型利爪'], ['Griffon Headdress', '獅鷲頭飾'],
['Grim Ward', '陰森圖騰'], ['Guardian Crown', '守護者皇冠'],
['Hand Scythe', '手鐮'], ['Harlequin Crest', '諧角之冠'],
['Hatchet Hands', '手斧爪'], ['Heavy Bracers', '重型護腕'],
['Heavy Crossbow', '重型十字弓'], ['Hierophant Trophy', '祭司長獎章'],
['Hunter\'s Guise', '獵人的偽裝'], ['Jade Talon', '翡翠爪'],
['Jagged Star', '鋸齒之星'], ['Jawbone Cap', '顎骨頭盔'],
['Jawbone Visor', '顎骨面甲'], ['Kraken Shell', '海妖殼甲'],
['Legend Spike', '傳奇尖刺'], ['Legendary Mallet', '傳奇巨槌'],
['Light Crossbow', '輕型十字弓'], ['Light Gauntlets', '輕型鐵手套'],
['Light Plate', '輕型鎧甲'], ['Lion Helm', '獅首頭盔'],
['Lochaber Axe', '洛哈伯斧'], ['Mithril Coil', '秘銀腰帶'],
['Myrmidon Greaves', '米特律之靴'], ['Ogre Gauntlets', '食人魔鐵手套'],
['Sacred Feathers', '神聖羽飾'], ['Sacred Globe', '神聖法球'],
['Sacred Rondache', '神聖圓盾'], ['Sacred Targe', '神聖輕圓盾'],
['Scissors Katar', '剪刃卡塔爾'], ['Scissors Quhab', '剪刃庫哈布'],
['Scissors Suwayyah', '剪刃蘇瓦雅'], ['Seraph Rod', '熾天使之杖'],
['Sexton Trophy', '助祭獎章'], ['Smoked Sphere', '煙霧法珠'],
['Sparkling Ball', '閃耀水晶球'], ['Spectral Shard', '幽靈碎片'],
['Stygian Pilum', '冥河標槍'], ['Swirling Crystal', '旋渦水晶'],
['Totemic Mask', '圖騰面具'], ['Troll Nest', '巨魔巢穴盾'],
['Umbral Disk', '暗影圓盤'], ['War Fist', '戰拳'],
['War Gauntlets', '戰鬥鐵手套'], ['War Hat', '戰帽'],
['Winged Harpoon', '翼形魚叉'], ['Wire Fleece', '線毛甲'],
['Wrist Spike', '腕刺'], ['Zombie Head', '殭屍頭骨'],
['Alma Negra', '阿瑪·內格拉'], ['Arachnid Mesh', '蜘蛛網腰帶'],
['Arioc\'s Needle', '艾瑞歐克之針'], ['Arkaine\'s Valor', '阿凱尼的榮耀'],
['Arm of King Leoric', '李奧瑞克王之臂'], ['Astreon\'s Iron Ward', '阿斯特龍的鐵守衛'],
['Bane Ash', '痛苦烏木'], ['Baranar\'s Star', '巴拉那之星'],
['Bartuc\'s Cut-Throat', '巴特克的屠殺之刃'], ['Biggin\'s Bonnet', '比格因的軟帽'],
['Blackhand Key', '黑手之匙'], ['Blinkbat\'s Form', '蝙蝠之形'],
['Blood Crescent', '血月'], ['Blood Raven\'s Charge', '血鴉之爪'],
['Bonesaw Breaker', '碎骨鋸'], ['Bul-Kathos\' Wedding Band', '布爾凱索的婚戒'],
['Buriza-Do Kyanon', '布理撒多凱南'], ['Bverrit Keep', '貝弗提的堡壘'],
['Carin Shard', '凱恩碎片'], ['Cerebus\' Bite', '刻耳柏洛斯之咬'],
['Crown of Ages', '年紀之冠'], ['Crown of Thieves', '竊盜之王皇冠'],
['Death Cleaver', '死神之擊'], ['Death\'s Fathom', '死亡深度'],
['Death\'s Web', '死亡之網'], ['Dimoak\'s Hew', '迪莫克之劈'],
['Dwarf Star', '矮人之星'], ['Eschuta\'s Temper', '艾斯屈塔的脾氣'],
['Gargoyle\'s Bite', '石像鬼之咬'], ['Gerke\'s Sanctuary', '吉永的庇護'],
['Gloom\'s Trap', '陰影陷阱'], ['Gore Rider', '蝕肉騎士'],
['Griffon\'s Eye', '獅鷲之眼'], ['Halaberd\'s Reign', '哈拉伯德的統治'],
['Heaven\'s Light', '天堂之光'], ['Highlord\'s Wrath', '大君之怒'],
['Husoldal Evo', '胡索達爾艾沃'], ['Icehawk Riftwing', '冰鷹裂翼'],
['Jalal\'s Mane', '加爾的長髮'], ['Jared\'s Stone', '傑瑞德之石'],
['Kinemil\'s Awl', '基米爾的錐子'], ['Kira\'s Guardian', '奇拉的守護'],
['Knell Striker', '喪鐘敲擊者'], ['Langer Briser', '蘭格布萊瑟'],
['Lidless Wall', '無眼之牆'], ['Lycander\'s Aim', '萊坎德的準星'],
['Lycander\'s Flank', '萊坎德的側翼'], ['Mara\'s Kaleidoscope', '馬拉的萬花筒'],
['Manald Heal', '瑪納德的治療'], ['Medusa\'s Gaze', '美杜莎之凝視'],
['Nature\'s Peace', '自然之和平'], ['Nightwing\'s Veil', '夜翼面紗'],
['Nosferatu\'s Coil', '諾斯費拉圖的線圈'], ['Pelta Lunata', '佩爾塔月牙'],
['Que-Hegan\'s Wisdom', '魁黑剛的智慧'], ['Radament\'s Sphere', '拉達曼特之球'],
['Raven Claw', '渡鴉之爪'], ['Raven Frost', '烏鴉之霜'],
['Rixot\'s Keen', '瑞克撒特的銳利'], ['Seraph\'s Hymn', '熾天使的頌歌'],
['Shadow Dancer', '影舞者'], ['Shadow Killer', '影殺者'],
['Skin of the Vipermagi', '蛇魔法師之皮'], ['Skullder\'s Ire', '斯寇德的憤怒'],
['Spiderweb Sash', '蜘蛛網腰帶'], ['Spire of Honor', '榮耀尖塔'],
['Spire of Lazarus', '拉撒路尖塔'], ['Suicide Branch', '自殺枝芽'],
['The Cat\'s Eye', '貓眼'], ['The Chieftain', '酋長'], ['The Eye of Etlich', '艾利屈之眼'],
['The Face of Horror', '恐懼之臉'], ['The Gladiator\'s Bane', '鬥士的禍根'],
['The Hand of Broc', '布洛克之手'], ['The Oculus', '眼球'],
['The Stone of Jordan', '喬丹之石'], ['Thundergod\'s Vigor', '雷神之力'],
['Titan\'s Revenge', '泰坦的復仇'], ['Treads of Cthon', '克松之足'],
['Ume\'s Lament', '烏姆之哀嘆'], ['Verdungo\'s Hearty Cord', '維爾登戈的強健之索'],
['Wirt\'s Leg', '維特之腳'], ['Wisp Projector', '鬼火投射器'],
['Arctic Blast', '寒冰氣流'], ['Battle Command', '戰鬥指揮'],
['Charged Strike', '充能一擊'], ['Claw Mastery', '爪類精通'],
['Claws of Thunder', '雷電爪'], ['Cloak of Shadows', '暗影斗篷'],
['Cobra Strike', '眼鏡蛇攻擊'], ['Defensive Auras', '防禦靈氣'],
['Dragon Claw', '龍爪'], ['Dragon Flight', '飛龍在天'], ['Dragon Tail', '神龍擺尾'],
['Faster Run/Walk', '高速跑步／行走'], ['Feral Rage', '狂怒'],
['Find Potion', '尋找藥水'], ['Frost Nova', '霜之新星'], ['Golem Mastery', '石魔精通'],
['Heart of Wolverine', '狼獾之心'], ['Holy Shield', '神聖之盾'],
['Ice Blast', '冰彈'], ['Increased Attack Speed', '提高攻擊速度'],
['Increased Speed', '加速'], ['Increased Stamina', '提高耐力'],
['Inferno Sentry', '地獄火守衛'], ['Inner Sight', '內視'],
['Iron Maiden', '攻擊反噬'], ['Iron Skin', '鋼鐵之膚'], ['Mace Mastery', '錘類精通'],
['Martial Arts', '武學'], ['Mind Blast', '心靈爆震'], ['Multiple Shots', '多重射擊'],
['Oak Sage', '橡木智者'], ['Offensive Auras', '攻擊靈氣'],
['Phoenix Strike', '鳳凰擊'], ['Pole Arm Mastery', '長柄武器精通'],
['Power Strike', '威力一擊'], ['Raise Skeletal Mage', '復甦骷髏法師'],
['Royal Strike', '皇家一擊'], ['Shadow Disciplines', '暗影修行'],
['Shadow Master', '影子大師'], ['Shadow Warrior', '影子戰士'],
['Shape Shifting', '變形'], ['Shock Field', '電能場'], ['Shock Wave', '震波'],
['Shock Web', '電網'], ['Skeleton Mastery', '骷髏精通'], ['Slow Missiles', '緩速飛射'],
['Solar Creeper', '太陽藤蔓'], ['Spirit of Barbs', '荊棘靈'],
['Throwing Mastery', '投擲精通'], ['Thunder Storm', '雷暴'],
['Tiger Strike', '虎擊'], ['Wake of Inferno', '地獄火復甦'], ['War Cry', '戰嗥'],
['Cannot Be Frozen', '無法冰凍'], ['Extra Fast', '特別快速'],
['Extra Strong', '特別強壯'], ['Hit Blinds Target', '擊中使目標目盲'],
['Immune to Cold', '冰寒免疫'], ['Immune to Fire', '火焰免疫'],
['Immune to Lightning', '閃電免疫'], ['Immune to Magic', '魔法免疫'],
['Immune to Physical', '物理免疫'], ['Immune to Poison', '毒素免疫'],
['Ignore Target\'s Defense', '無視目標防禦'], ['Lightning Enchanted', '閃電強化'],
['Lightning Mastery', '閃電支配'], ['Lightning Skills', '閃電技能'],
['Lower Resist', '降低抗性'], ['Martial arts, traps and shadow disciplines', '武學、陷阱與暗影修行'],
['of the Apprentice', '學徒之'], ['of the Bat', '蝙蝠之'], ['of the Colosuss', '巨像之'],
['of the Elephant', '猛獁之'], ['of the Fox', '狐狸之'], ['of the Giant', '巨人之'],
['of the Glacier', '冰河之'], ['of the Icicle', '冰柱之'], ['of the Jackal', '豺狼之'],
['of the Kraken', '海妖之'], ['of the Lamprey', '七鰓鰻之'], ['of the Leech', '水蛭之'],
['of the Locust', '蝗蟲之'], ['of the Magus', '大法師之'], ['of the Mammoth', '猛獁之'],
['of the Mind', '心智之'], ['of the Ox', '公牛之'], ['of the Sentinel', '守衛之'],
['of the Squid', '烏賊之'], ['of the Sun', '太陽之'], ['of the Tiger', '猛虎之'],
['of the Titan', '泰坦之'], ['of the Vampire', '吸血鬼之'], ['of the Whale', '巨鯨之'],
['of the Wolf', '狼之'], ['of the Wraith', '幽靈之'], ['of Absorption', '吸收之'],
['of Acceleration', '加速之'], ['of Accuracy', '準確之'], ['of Alacrity', '敏捷之'],
['of Amelioration', '改善之'], ['of Anthrax', '劇毒之'], ['of Attraction', '吸引之'],
['of Blight', '枯萎之'], ['of Blocking', '格擋之'], ['of Brilliance', '光輝之'],
['of Burning', '燃燒之'], ['of Butchery', '屠戮之'], ['of Carnage', '屠殺之'],
['of Craftsmanship', '工藝之'], ['of Defiance', '抗禦之'], ['of Deflecting', '偏斜之'],
['of Enlightenment', '啟迪之'], ['of Evisceration', '剖腹之'], ['of Excellence', '卓越之'],
['of Flame', '烈焰之'], ['of Fortune', '財運之'], ['of Frost', '冰霜之'],
['of Gore', '血腥之'], ['of Greed', '貪婪之'], ['of Guarding', '守護之'],
['of Haste', '急速之'], ['of Incineration', '焚化之'], ['of Light', '光明之'],
['of Luck', '幸運之'], ['of Maiming', '致殘之'], ['of Might', '威力之'],
['of Negation', '消除之'], ['of Nirvana', '涅槃之'], ['of Pacing', '步伐之'],
['of Perfection', '完美之'], ['of Pestilence', '瘟疫之'], ['of Precision', '精準之'],
['of Protection', '防護之'], ['of Quickness', '迅捷之'], ['of Radiance', '光芒之'],
['of Regeneration', '再生之'], ['of Regrowth', '復甦之'], ['of Remedy', '療癒之'],
['of Revivification', '復活之'], ['of Shock', '電擊之'], ['of Slaughter', '屠殺之'],
['of Slaying', '屠戮之'], ['of Sorcery', '巫術之'], ['of Spikes', '尖刺之'],
['of Storms', '風暴之'], ['of Swiftness', '迅速之'], ['of Swords', '劍術之'],
['of Thorns', '荊棘之'], ['of Thunder', '雷霆之'], ['of Transcendence', '超凡之'],
['of Traveling', '旅行之'], ['of Venom', '毒液之'], ['of Warding', '防衛之'],
['of Wealth', '財富之'], ['of Winter', '寒冬之'], ['of Wizardry', '法術之'],
['of Worth', '價值之'],
['Ancients\' Way', '先祖之路'], ['Blood Golem', '血肉石魔'],
['Blood Hawk', '血鷹'], ['Blood Spirit', '血靈'], ['Bloodwitch the Wild', '野性血巫'],
['Bone Knife', '骨刀'], ['Bone Prison', '骨牢'], ['Bone Wall', '骨牆'],
['Bramble Mitts', '荊棘手套'], ['Carrion Vine', '屍體藤蔓'], ['Corrupt Rogue', '墮落羅格'],
['Creeping Feature', '爬行異物'], ['Dac Farren', '達克·法倫'], ['Dark Elder', '黑暗長老'],
['Darkforce Spawn', '黑暗力量之卵'], ['Death Mask', '死亡面具'],
['Demonhorn\'s Edge', '惡魔號角之刃'], ['Devil Star', '惡魔之星'],
['Dim Vision', '微暗視力'], ['Dream Spirit', '夢境之靈'], ['Earth Spirit', '大地之靈'],
['Firelizard\'s Talons', '火蜥蜴之爪'], ['Full Rejuvenation Potion', '全面回復藥水'],
['Glacial Spike', '冰尖柱'], ['Great Wyrm\'s', '巨龍之'], ['Hawk Branded', '鷹印之'],
['Healing Potion', '治療藥水'], ['Heavenly Stone', '天堂之石'],
['Herald of Zakarum', '撒卡蘭姆使者'], ['Infector of Souls', '靈魂傳染者'],
['Iron Pelt', '鐵皮'], ['Mage Plate', '法師鎧甲'], ['Maiden Pike', '少女長矛'],
['Matriarchal Pike', '族長長矛'], ['Mighty Scepter', '強威權杖'],
['Morning Star', '晨星'], ['Mummified Trophy', '木乃伊獎章'],
['Plague Poppy', '瘟疫罌粟'], ['Preserved Head', '保存頭顱'], ['Quill Rat', '刺鼠'],
['Rage Mask', '狂怒面具'], ['Reinforced Mace', '強化釘錘'],
['Rose Branded', '玫瑰印記之'], ['Rune Scepter', '符文權杖'],
['Runic Talons', '符文利爪'], ['Scroll of Town Portal', '城鎮傳送卷軸'],
['Sharptooth Slayer', '鋒齒殺手'], ['Sky Spirit', '天空之靈'],
['Slayer Guard', '屠殺者守衛'], ['Small Charm', '小型護身符'],
['Small Crescent', '小型新月斧'], ['Sparking Mail', '電光鎧甲'],
['Spectral Hit', '幽靈打擊'], ['Spirit Keeper', '靈魂守護者'],
['Spirit Mask', '靈魂面具'], ['Spirit Ward', '靈魂守衛'], ['Splint Mail', '板甲'],
['Steel Pillar', '鋼鐵之柱'], ['Stone Skin', '石膚'], ['Studded Leather', '鑲嵌皮甲'],
['Sun Spirit', '太陽之靈'], ['The Dragon Chang', '長龍'],
['The Fetid Sprinkler', '惡臭灑水器'], ['The General\'s Tan Do Li Ga', '將軍的譚多里加'],
['The Gnasher', '咬骨'], ['The Harrowing', '恐懼'], ['The Howler', '嚎叫者'],
['The Hungry', '飢餓者'], ['The Hunter', '獵人'], ['The Impaler', '穿刺者'],
['The Infernal Gate', '地獄之門'], ['The Iron Jang Bong', '鐵長棍'],
['The Mahim-Oak Curio', '馬希姆橡木古物'], ['The Mauler', '重擊者'],
['The Meat Scraper', '剝肉者'], ['The Patriarch', '族長'], ['The Redeemer', '救贖者'],
['The Rising Sun', '旭日'], ['The Salamander', '火蜥蜴'], ['The Scalper', '剝頭皮者'],
['The Sightless Eye', '無眼者'], ['The Tannr Gorerod', '坦恩戈瑞德'],
['The Ward', '守護者'], ['Thresh Socket', '碎顱者'], ['Throwing Knife', '投擲飛刀'],
['Torch of Iro', '伊羅火炬'], ['Treehead WoodFist', '木拳樹頭'],
['Unraveller Head', '解縛者頭顱'], ['Veil of Steel', '鋼鐵面紗'],
['Walking Stick', '手杖'], ['War Scepter', '戰鬥權杖'], ['War Traveler', '戰爭旅者'],
['Wolf Head', '狼頭'], ['Zakarum\'s Hand', '撒卡蘭姆之手'],
['of Anima', '靈性之'], ['of Atlus', '巨人之'], ['of Measure', '衡量之'],
['of Memory', '記憶之'], ['of Performance', '精湛之'], ['of Quality', '品質之'],
['of Razors', '利刃之'], ['of Readiness', '備戰之'],
['a blow', '攻擊'], ['a blow back', '擊退'], ['a blow of the mind', '精神衝擊'],
['a blow, on the dash or at its end', '衝刺途中或結束時發動攻擊'], ['a bomb', '炸彈'],
['a boulder', '巨石'], ['a burst', '爆裂'], ['a claw', '爪擊'], ['a claw blow', '爪擊'],
['a cut', '斬擊'], ['a dire wolf\'s bite', '恐狼撕咬'], ['a flame', '火焰'],
['a gust', '疾風'], ['a hit of his spin', '旋轉攻擊命中時'], ['a kick', '踢擊'],
['a paw', '揮爪'], ['a raven\'s peck', '烏鴉啄擊'], ['a rock', '岩石'],
['a shard', '碎片'], ['a skeleton\'s blow', '骷髏重擊'], ['a smite at what it blocks', '格擋時施展重擊'],
['a spark', '火花'], ['a spike', '尖刺'], ['a spirit', '靈體'],
['a spirit wolf\'s bite', '幽靈狼撕咬'], ['a spit', '噴吐'],
['a stomp or a blow', '踐踏或重擊'], ['a strike', '打擊'], ['a thrust', '刺擊'],
['a tick of a flame', '火焰每次造成傷害時'], ['a tick of a web', '蛛網每次造成傷害時'],
['a tick of the wall', '牆壁每次造成傷害時'], ['a tooth', '尖牙'], ['a twister', '旋風'],
['a wave', '波動'], ['the Dark', '暗黑者'], ['the Dead', '亡者'],
['the Destroyer', '毀滅者'], ['the Flayer', '剝皮者'], ['the golem\'s blow', '石魔重擊'],
['the Grim', '陰森者'], ['the grizzly\'s swipe', '灰熊揮擊'], ['the Jagged', '鋸齒者'],
['the landing or the strike', '落地或攻擊時'], ['the Mad', '狂亂者'], ['the Quick', '迅捷者'],
['the Shade', '暗影者'], ['the Sharp', '銳利者'], ['the Slasher', '斬擊者'],
['the Slayer', '殺戮者'], ['the Tainted', '污染者'], ['the Unclean', '污穢者'],
['the Unholy', '邪惡者'], ['the Witch', '女巫'], ['the Wraith', '幽魂'],
['wake of destruction', '毀滅之焰']
];
// 易牙居譯名（技能、技能樹分頁、獨特物品、底材）：優先於上面所有譯名。
// 從易牙居備份的「中文 English」對照抽出，只列跟原本譯名不同的；同一詞易牙居有多種寫法時取最常用的。
const iyaNames = {
// 技能樹分頁
'Bow and Crossbow Skills': '弓和十字弓技能', 'Passive and Magic Skills': '被動和魔法技能', 'Javelin and Spear Skills': '標槍和長矛技能',
'Fire Spells': '火焰法術技能', 'Lightning Spells': '閃電法術技能', 'Cold Spells': '冰凍法術技能',
'Curses': '詛咒技能', 'Poison and Bone Spells': '毒素和白骨技能', 'Summoning Spells': '召喚技能',
'Offensive Auras': '攻擊性靈氣技能', 'Defensive Auras': '防禦性靈氣技能',
'Combat Masteries': '戰鬥專家技能', 'Warcries': '吶喊技能',
'Summoning': '召喚技能', 'Shape Shifting': '外型變形技能', 'Elemental': '元素技能',
'Traps': '陷阱技能', 'Shadow Disciplines': '影子訓練技能', 'Martial Arts': '武學藝術技能',
// 技能
'Strafe': '砲轟', 'Charged Strike': '衝能一擊', 'Pierce': '穿刺', 'Dodge': '閃避', 'Slow Missiles': '慢速箭',
'Charged Bolt': '衝能彈', 'Blaze': '熾烈之徑', 'Static Field': '靜態立場', 'Inferno': '地獄之火', 'Hydra': '九頭火蛇',
'Ice Blast': '冰風暴', 'Thunder Storm': '雷雲風暴', 'Shiver Armor': '碎冰甲', 'Lightning Mastery': '支配閃電',
'Warmth': '暖氣', 'Enchant': '強化', 'Poison Dagger': '淬毒匕首', 'Weaken': '削弱', 'Dim Vision': '微暗靈視',
'Life Tap': '偷取生命', 'Bone Spirit': '白骨之魂', 'Poison Nova': '劇毒新星', 'Confuse': '迷亂', 'Revive': '重生',
'Blood Golem': '鮮血石魔', 'Lower Resist': '降低抵抗', 'Skeleton Mastery': '支配骷髏', 'Golem Mastery': '支配石魔',
'Shock Web': '雷電網', 'Fists of Fire': '焰拳', 'Cloak of Shadows': '魔影斗篷', 'Lightning Sentry': '雷光守衛',
'Blade Fury': '刃之怒', 'Phoenix Strike': '鳳凰攻擊', 'Dragon Claw': '雙龍爪', 'Shadow Master': '支配影子',
'Claw Mastery': '支配利爪', 'Burst of Speed': '加速', 'Fade': '能量消解', 'Bash': '重擊', 'Stun': '擊暈',
'Whirlwind': '炫風', 'Howl': '狂嗥', 'Shout': '大叫', 'Battle Cry': '戰嗥', 'War Cry': '戰鬥狂嗥',
'Grim Ward': '殘酷嚇阻', 'Battle Orders': '戰鬥體制', 'Mace Mastery': '支配釘頭錘', 'Throwing Mastery': '支配飛擲',
'Iron Skin': '鐵布衫', 'Increased Stamina': '增加耐力', 'Find Potion': '找尋葯劑', 'Blessed Hammer': '祝福之鎚',
'Zeal': '白熱', 'Charge': '突擊', 'Conversion': '轉換', 'Might': '力量', 'Holy Shock': '神聖衝擊', 'Thorns': '針刺',
'Vigor': '精力', 'Salvation': '救助', 'Meditation': '冥思', 'Arctic Blast': '極地風暴', 'Fissure': '火山爆',
'Twister': '鎌鼬風', 'Werewolf': '狼人變化', 'Werebear': '熊人變化', 'Molten Boulder': '熔漿巨岩', 'Volcano': '火山',
'Hurricane': '暴風', 'Carrion Vine': '食屍藤', 'Solar Creeper': '太陽藤', 'Spirit of Barbs': '棘靈',
'Lycanthropy': '變形術', 'Feral Rage': '野性狂暴', 'Fire Claws': '焰爪', 'Cyclone Armor': '颶風裝甲',
// 獨特物品
'Pelta Lunata': '新月小盾', 'Biggin\'s Bonnet': '畢格因的軟帽', 'Hotspur': '熱靴刺', 'The Hand of Broc': '柏克之手',
'Nagelring': '拿各的戒指', 'Greyform': '薄暮外觀', 'Gorefoot': '血腳', 'Umbral Disk': '陰影圓盤',
'Blinkbat\'s Form': '眨眼蝙蝠的外觀', 'Stormguild': '暴風公會', 'Treads of Cthon': '凱松的征服', 'Tarnhelm': '塔因頭盔',
'Manald Heal': '瑪那得的治療', 'Sparking Mail': '火花之甲', 'Steelclash': '作響的金屬', 'The Mahim-Oak Curio': '瑪哈姆橡木古董',
'Goldwrap': '金色包袱', 'Stealskull': '偷取骷髏', 'Lidless Wall': '警戒之牆', 'Bul-Kathos\' Wedding Band': '布爾凱索之戒',
'The Rising Sun': '旭日東昇', 'Seraph\'s Hymn': '熾天使之韻', 'Nature\'s Peace': '大自然的和平', 'Wisp Projector': '鬼火投射者',
'Arachnid Mesh': '蜘蛛之網', 'Griffon\'s Eye': '格利風之眼', 'Bane Ash': '禍根之灰', 'Spire of Lazarus': '拉撒羅斯之螺旋',
'The Salamander': '火精靈', 'The Iron Jang Bong': '鐵檢棒', 'Pluckeye': '勇氣之眼', 'Witherstring': '凋謝之戒',
'Raven Claw': '渡鳥之爪', 'Stormstrike': '暴風之擊', 'Hellclap': '作響的地獄', 'Blastbark': '爆裂的吠叫',
'Lycander\'s Aim': '雷山德的指標', 'Lycander\'s Flank': '雷山德的側腹', 'Stoneraven': '石烏鴉', 'Blood Raven\'s Charge': '血鳥的襲擊',
'Torch of Iro': '衣洛的火炬', 'Maelstrom': '漩渦', 'Gravenspine': '墓穴之脊', 'Ume\'s Lament': '烏米的慟哭',
'Blackhand Key': '黑手之鑰', 'Homunculus': '侏儒', 'Suicide Branch': '自殺支系', 'Arm of King Leoric': '李奧瑞克王的武器',
'Darkforce Spawn': '魔力肇生', 'Boneshade': '白骨陰影', 'Felloak': '兇猛橡樹', 'Knell Striker': '敲擊喪鐘者',
'Crushflange': '壓碎的凸邊', 'Bloodrise': '血昇', 'Rusthandle': '腐蝕的把手', 'The General\'s Tan Do Li Ga': '坦-杜-裡-嘎-將軍',
'Stormeye': '暴風眼', 'The Fetid Sprinkler': '惡臭散佈者', 'Astreon\'s Iron Ward': '愛斯特龍之鐵的保護區', 'The Redeemer': '懺悔者',
'Alma Negra': '阿爾瑪 尼格拉', 'Rixot\'s Keen': '瑞克撒特的輓歌', 'The Gnasher': '牙齒', 'Blood Crescent': '血紅新月',
'Shadowfang': '影之牙', 'Bladebone': '肩胛骨', 'Soulflay': '剝皮靈魂', 'The Chieftain': '族長', 'Kinemil\'s Awl': '金麥爾的錐子',
'Brainhew': '腦袋', 'Rakescar': '火鉤之傷', 'Humongous': '巨大無比', 'Arreat\'s Face': '亞瑞特的面容', 'The Scalper': '圓鑿',
'Lightsabre': '光之軍刀', 'Death Cleaver': '死亡之刀', 'Azurewrath': '青色忿怒', 'Demonhorn\'s Edge': '惡魔號角的邊緣',
'Halaberd\'s Reign': '海拉柏得的國度', 'Ravenlore': '烏鴉之王', 'Cerebus\' Bite': '地獄之吻', 'Spirit Keeper': '靈魂看守者',
'Bartuc\'s Cut-Throat': '巴特克的猛擊', 'Jade Talon': '碧玉爪', 'Twitchthroe': '抽動的掙扎', 'Iceblink': '冰雪眨眼',
'Rockfleece': '石之毛', 'Iron Pelt': '擲鐵', 'Skullder\'s Ire': '詩寇蒂的憤怒', 'Toothrow': '排齒', 'Leviathan': '海王利維亞桑',
'Howltusk': '怒號長牙', 'Crown of Thieves': '盜賊皇冠', 'Bverrit Keep': '貝弗提的紀念', 'The Ward': '囚房',
'Gerke\'s Sanctuary': '基爾克的聖堂', 'Radament\'s Sphere': '達羅門特之球體', 'Spirit Ward': '魂系結界', 'Medusa\'s Gaze': '梅杜莎的凝視',
'Frostburn': '霜燃', 'Hellmouth': '地獄之嘴', 'Steelrend': '碎鋼', 'Bladebuckle': '鋒利扣帶', 'Nosferatu\'s Coil': '吸血聖王之圈',
'Verdungo\'s Hearty Cord': '維爾登戈的心結', 'Tearhaunch': '淚之臀', 'Leadcrow': '引導烏鴉', 'Hellcast': '投擲地獄',
'Langer Briser': '蘭格 布里瑟', 'Buriza-Do Kyanon': '布里撒-多 凱南', 'Hellrack': '地獄拷問', 'The Dragon Chang': '張龍',
'The Tannr Gorerod': '坦之血杖', 'Spire of Honor': '榮耀的尖塔', 'Steel Pillar': '鐵柱', 'Arioc\'s Needle': '愛理歐克之針',
'Gargoyle\'s Bite': '石像鬼之噬', 'Dimoak\'s Hew': '迪馬克之劈砍', 'Woestave': '煩惱詩集', 'The Meat Scraper': '刮肉者',
'Husoldal Evo': '胡索丹 依弗', 'Bonehew': '破骨', 'Spectral Shard': '妖怪碎片', 'Spineripper': '裂脊者',
'Stormspike': '暴風尖刺', 'Deathbit': '死亡碎片', 'Ghostflame': '鬼火焰',
// 底材（Belt、Boots、Blade 也是介面常用字，保留「腰帶／靴子／刀刃」）
'Slayer Guard': '殺手防護面甲', 'Fury Visor': '暴怒面甲', 'Conqueror Crown': '征服者皇冠面甲', 'Totemic Mask': '圖騰面具狼盔',
'Blood Spirit': '血腥之靈', 'Dusk Shroud': '灰暮壽衣', 'Ceremonial Javelin': '祭典之標槍', 'Matriarchal Javelin': '女族長之標槍',
'Ceremonial Pike': '祭典之長矛', 'Grand Scepter': '雄偉權杖', 'War Scepter': '巨戰權杖', 'Divine Scepter': '神屬權杖',
'Morning Star': '流星鎚', 'Devil Star': '惡魔流星錘', 'Greater Talons': '巨鷹爪', 'Battle Cestus': '鬥腰刀', 'Feral Claws': '猛禽爪',
'Hierophant Trophy': '祭司印記', 'Sacred Rondache': '神聖輕圓盾', 'Spiderweb Sash': '蛛網腰帶', 'Light Crossbow': '輕十字弓',
'Heavy Crossbow': '重十字弓', 'Winged Harpoon': '翼魚叉', 'Stiletto': '小劍', 'Bone Knife': '骸骨小刀', 'Legend Spike': '傳說尖刺',
'Lochaber Axe': '羅佳伯斧', 'Studded Leather': '鑲嵌甲', 'Field Plate': '實戰鎧甲', 'Wire Fleece': '線羊毛皮甲',
'Balrog Skin': '炎魔皮板甲', 'Grand Crown': '巨皇冠', 'Pavise': '大盾', 'Aegis': '塔盾', 'War Gauntlets': '巨戰手套',
'Myrmidon Greaves': '極速靴'
};
const d2zhKnown = new Set([...Object.keys(labels), ...[...names, ...extraNames, ...vocabulary].map(e => e[0])].map(s => s.toLowerCase()));
for (const [en, zh] of Object.entries(D2ZH_EXTRA.labels)) if (!d2zhKnown.has(en.toLowerCase())) labels[en] = zh;
const d2zhPatterns = D2ZH_EXTRA.patterns.map(([en, zh]) => [new RegExp('^' + en.split(/(\{#?\})/).map(part =>
part === '{}' ? '(.+?)' : part === '{#}' ? '([-+]?\\d[\\d.,]*)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$', 'i'), zh]);
window.__d2zhKnown = s => lookup.has(String(s).toLowerCase());
// 技能名稱放在句子裡時不要帶「（魔法）」這類元素標記（例如「+3 骨矛（限死靈法師）」「牙每級 +7%」）
function d2zhPlain(value) {
const text = translate(value);
return D2ZH_EXTRA.skillTags[value] ? text.replace(/（[^）]*）$/, '') : text;
}
function d2zhPattern(source) {
for (const [re, zh] of d2zhPatterns) {
const m = re.exec(source);
if (m) return zh.replace(/\{(\d)\}/g, (_, i) => d2zhPlain(m[i]));
}
const m = /^(.+) (of (?:the )?[A-Z][\w']*(?: [A-Z][\w']*)?)$/.exec(source);
if (m && lookup.has(m[2].toLowerCase())) return translate(m[2]) + translate(m[1]);
return null;
}
const lookup = new Map();
for (const [english, chinese] of [...Object.entries(labels), ...names, ...extraNames]) {
lookup.set(english.toLowerCase(), chinese);
}
const wordMap = new Map();
const wordEntries = [...Object.entries(labels), ...extraNames, ...names, ...vocabulary];
for (const [english, chinese] of wordEntries) wordMap.set(english.toLowerCase(), chinese);
// 易牙居譯名放最後蓋過舊譯名；句子裡的單字（stun、charge、thorns…）若是一般用語就維持原本的翻譯
const genericWords = new Set(vocabulary.map(([english]) => english.toLowerCase()));
const iyaFlat = new Map(Object.entries(iyaNames).map(([english, chinese]) => [english.toLowerCase(), chinese]));
for (const key of [...lookup.keys()]) {
// 舊表裡分行的寫法（例如 "bow and\ncrossbow\nskills"）也換成易牙居譯名
if (/\n/.test(key) && iyaFlat.has(key.replace(/\s+/g, ' '))) lookup.delete(key);
}
for (const [english, chinese] of Object.entries(iyaNames)) {
lookup.set(english.toLowerCase(), chinese);
if (!genericWords.has(english.toLowerCase())) { wordMap.set(english.toLowerCase(), chinese); wordEntries.push([english, chinese]); }
}
for (const [english, chinese] of [...Object.entries(D2ZH_FIX.words), ...Object.entries(D2ZH_FIX.iya)]) {
lookup.set(english.toLowerCase(), chinese);
if (genericWords.has(english.toLowerCase())) continue;
wordMap.set(english.toLowerCase(), chinese);
wordEntries.push([english, chinese]);
}
// 改版後的字串（D2ZH_FIX.text）：完全相同的直接查，含 # 或 * 的照遊戲韓文翻譯的規則比對
const fixNorm = s => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const fixExact = new Map(), fixWild = [];
for (const [english, chinese] of Object.entries(D2ZH_FIX.text)) {
if (!/[#*]/.test(english)) { fixExact.set(fixNorm(english), chinese); continue; }
const parts = english.split(/([#*])/);
fixWild.push({
re: new RegExp('^' + parts.map(p => p === '*' ? '(.*?)' : p === '#' ? '([-+]?\\d[\\d.,]*)'
: p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('') + '$', 'is'),
kinds: parts.filter(p => p === '#' || p === '*'),
fixed: english.replace(/[#*\s]/g, '').length,
chinese
});
}
fixWild.sort((a, b) => b.fixed - a.fixed);
for (const [english, chinese] of Object.entries(D2ZH_FIX.iya)) fixExact.set(fixNorm(english), chinese);
function d2zhFix(source, depth = 0) {
const text = source.trim();
const exact = fixExact.get(fixNorm(text));
if (exact !== undefined) return exact;
for (const w of fixWild) {
const m = w.re.exec(text);
if (!m) continue;
return w.chinese.replace(/\{(\d+)\}/g, (_, i) => {
const v = (m[+i + 1] || '').trim();
return w.kinds[i] === '#' ? v : d2zhPlain(v.replace(/^the\s+/i, ''));
});
}
// 名稱後面接標點（進化條件逐項列出：「max 3/8,」「Pierce,」）：照名稱翻，不要落到一般單字（pierce＝穿透）
const tailMark = /^(.+?)\s*([,:;])$/s.exec(text);
if (tailMark && (lookup.has(tailMark[1].toLowerCase()) || fixExact.has(fixNorm(tailMark[1])))) return d2zhPlain(tailMark[1]) + tailMark[2];
if (depth > 2) return null;
// 遊戲常把好幾句用「 · 」或「 - 」接起來，或在前後加數字（例如 "-12% to Enemy Cold Resistance"）
for (const sep of [' · ', ' - ']) {
if (!text.includes(sep)) continue;
const pieces = text.split(sep).map(p => p.trim()), done = pieces.map(p => d2zhFix(p, depth + 1));
if (done.some(p => p !== null)) return pieces.map((p, i) => done[i] ?? translate(p)).join(sep);
}
// 用逗號列出的名稱（例如解壓縮進度「Units, floor tiles」）：每一段都認得才翻
if (text.includes(', ')) {
const whole = s => { const t = translate(s); return /[㐀-鿿]/u.test(t) && !/[A-Za-z]{3,}/.test(t) ? t : null; };
const pieces = text.split(', '), done = pieces.map(p => d2zhFix(p, depth + 1) ?? whole(p));
if (done.every(p => p !== null)) return done.join('、');
}
const lead = /^([-+]?\d[\d.,]*%?)\s+(.+)$/s.exec(text);
if (lead) { const rest = d2zhFix(lead[2], depth + 1); if (rest !== null) return lead[1] + ' ' + rest; }
return null;
}
window.__d2zhKnown = s => lookup.has(String(s).toLowerCase()) || fixExact.has(fixNorm(s));
// 有分層的地圖區域名稱（字典裡有 "Catacombs Level 1" 就記下 "catacombs"）
const d2zhAreas = new Set([...lookup.keys()].map(k => /^(.+) level \d+$/.exec(k)?.[1]).filter(Boolean));
const wordAlternatives = wordEntries
.map(([english]) => english)
.sort((a, b) => b.length - a.length)
.map(english => english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
.join('|');
const wordPattern = new RegExp(`(^|[^A-Za-z])(${wordAlternatives})(?=$|[^A-Za-z])`, 'gi');
const translatedTexts = new Map();
function translate(value) {
const source = String(value ?? '');
if (language !== 'zh-Hant' || !source) return source;
if (translatedTexts.has(source)) return translatedTexts.get(source);
const fixed = /[A-Za-z]/.test(source) ? d2zhFix(source) : null;
if (fixed !== null) { translatedTexts.set(source, fixed); return fixed; }
// 「骨矛 Level 3」這種技能等級：翻成「骨矛 升級至等級 3」；地圖區域（地下墓穴 Level 1）仍是「第 N 層」
const skillLevel = /^(.+?)\s+Level\s+(\d+)$/i.exec(source.trim());
if (skillLevel && !lookup.has(source.trim().toLowerCase()) && !d2zhAreas.has(skillLevel[1].toLowerCase())) {
const result = (lookup.get(skillLevel[1].toLowerCase()) || translate(skillLevel[1])) + ' 升級至等級 ' + skillLevel[2];
translatedTexts.set(source, result);
return result;
}
const direct = lookup.get(source.toLowerCase());
if (direct) return D2ZH_EXTRA.skillTags[source] ? direct + '（' + D2ZH_EXTRA.skillTags[source] + '）' : direct;
// 遊戲把短標籤拆成兩行（例如技能樹分頁 "Combat\nSkills"）：先當成一整句查
if (/\s/.test(source.trim())) {
const flat = lookup.get(source.replace(/\s+/g, ' ').trim().toLowerCase());
if (flat) return flat;
}
const d2zhViaPattern = d2zhPattern(source);
if (d2zhViaPattern !== null) { translatedTexts.set(source, d2zhViaPattern); return d2zhViaPattern; }
const result = source.replace(wordPattern, (_match, lead, word) => lead + wordMap.get(word.toLowerCase())).replace(/([㐀-鿿])\s+(?=[㐀-鿿])/gu, '$1');
if (translatedTexts.size >= 12000) translatedTexts.delete(translatedTexts.keys().next().value);
translatedTexts.set(source, result);
return result;
}
function shouldUseLocalFont(value) {
return language === 'zh-Hant' && /[\u3400-\u9fff]/u.test(translate(value));
}
function cacheLanguage(value) {
const source = String(value ?? '');
return language === 'zh-Hant' && translate(source) !== source ? language : 'en';
}
function colorValue(value) {
if (Array.isArray(value) && value.length >= 3) {
return `rgb(${Math.max(0, Math.min(255, value[0]))}, ${Math.max(0, Math.min(255, value[1]))}, ${Math.max(0, Math.min(255, value[2]))})`;
}
return typeof value === 'string' ? value : '#e8dfcc';
}
function wrapLine(context, text, maxWidth) {
if (!maxWidth || context.measureText(text).width <= maxWidth) return [text];
const result = [];
for (const sourceLine of text.split('\n')) {
const tokens = sourceLine.includes(' ') ? sourceLine.split(/(?<=\s)/u) : Array.from(sourceLine);
let line = '';
for (const token of tokens) {
const next = line + token;
if (line && context.measureText(next).width > maxWidth) {
result.push(line.trimEnd());
line = token.trimStart();
if (context.measureText(line).width > maxWidth) {
let part = '';
for (const char of Array.from(line)) {
if (part && context.measureText(part + char).width > maxWidth) {
result.push(part);
part = char;
} else part += char;
}
line = part;
}
} else line = next;
}
if (line || !sourceLine) result.push(line.trimEnd());
}
return result;
}
function renderBitmapText(bitmapFont, source, options) {
options = options || {};
const text = translate(source);
const size = Math.max(10, Math.round(Number(bitmapFont?.info?.height || bitmapFont?.lineHeight || 16)));
const lineHeight = Math.max(size + 2, Math.round(Number(bitmapFont?.lineHeight || size * 1.24)));
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
if (!context) return canvas;
context.font = `${size}px ${FONT_STACK}`;
context.textBaseline = 'middle';
const maxWidth = Number(options.maxWidth) > 0 ? Number(options.maxWidth) : 0;
const lines = text.split('\n').flatMap(line => wrapLine(context, line, maxWidth));
const widths = lines.map(line => context.measureText(line).width);
const shadow = options.shadow ? 2 : 0;
canvas.width = Math.max(1, Math.ceil(Math.max(0, ...widths)) + shadow);
canvas.height = Math.max(1, Math.ceil(size + (lines.length - 1) * lineHeight + shadow));
context.font = `${size}px ${FONT_STACK}`;
context.textBaseline = 'middle';
context.fillStyle = colorValue(options.color);
const align = options.align || 'center';
lines.forEach((line, index) => {
const width = context.measureText(line).width;
const x = align === 'left' ? 0 : align === 'right' ? canvas.width - width - shadow : (canvas.width - width - shadow) / 2;
const y = size / 2 + index * lineHeight;
if (options.shadow) {
context.fillStyle = '#000';
context.fillText(line, x + 1, y + 1);
context.fillStyle = colorValue(options.color);
}
context.fillText(line, x, y, maxWidth || undefined);
});
canvas.className = 'd2-text d2-local-font';
canvas.setAttribute('aria-label', text);
return canvas;
}
let language = 'zh-Hant';
try {
const saved = localStorage.getItem(STORAGE_KEY);
if (saved === 'en' || saved === 'zh-Hant') language = saved;
} catch (_) { /* Storage can be disabled; Traditional Chinese remains the default. */ }
const textRecords = new WeakMap();
const attributeRecords = new WeakMap();
let switcher;
function shouldSkipText(node) {
return !node.parentElement || !!node.parentElement.closest('#d2-language-switch, .d2pad-key');
}
function processTextNode(node) {
if (shouldSkipText(node)) return;
const current = node.nodeValue;
let record = textRecords.get(node);
if (!record) {
record = { source: current, last: null };
textRecords.set(node, record);
} else if (current !== record.last) {
record.source = current;
}
const translated = translate(record.source);
record.last = translated;
if (node.nodeValue !== translated) node.nodeValue = translated;
}
function processAttributes(element) {
if (element.id === 'd2-language-switch' || element.closest?.('#d2-language-switch')) return;
const keys = ['title', 'aria-label', 'placeholder', 'alt'];
let records = attributeRecords.get(element);
if (!records) {
records = new Map();
attributeRecords.set(element, records);
}
for (const key of keys) {
if (!element.hasAttribute(key)) continue;
const current = element.getAttribute(key);
let record = records.get(key);
if (!record) record = { source: current, last: null };
else if (current !== record.last) record.source = current;
const next = translate(record.source);
record.last = next;
records.set(key, record);
if (current !== next) element.setAttribute(key, next);
}
}
function scan(root) {
if (!root) return;
if (root.nodeType === Node.TEXT_NODE) {
processTextNode(root);
return;
}
if (root.nodeType === Node.ELEMENT_NODE) processAttributes(root);
const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) processTextNode(node);
if (root.querySelectorAll) root.querySelectorAll('*').forEach(processAttributes);
}
function applyLanguage() {
document.documentElement.lang = language === 'zh-Hant' ? 'zh-Hant' : 'en';
if (document.body) {
document.body.classList.toggle('d2zh-hant', language === 'zh-Hant');
scan(document.body);
}
if (switcher) {
switcher.querySelectorAll('button[data-language]').forEach(button => {
const active = button.dataset.language === language;
button.setAttribute('aria-pressed', String(active));
button.classList.toggle('active', active);
});
}
window.dispatchEvent(new CustomEvent('d2-language-changed', { detail: { language } }));
}
function setLanguage(next) {
if (next !== 'en' && next !== 'zh-Hant') return;
language = next;
try { localStorage.setItem(STORAGE_KEY, language); } catch (_) { /* In-memory switching still works. */ }
applyLanguage();
}
function addSwitcher() {
if (!document.body || document.getElementById('d2-language-switch')) return;
const style = document.createElement('style');
style.textContent = `
:root { --d2-local-fonts: ${FONT_STACK}; }
body.d2zh-hant button, body.d2zh-hant .overlay, body.d2zh-hant .hint,
body.d2zh-hant .legal, body.d2zh-hant #hud, body.d2zh-hant #touch,
body.d2zh-hant #character, body.d2zh-hant #tooltip, body.d2zh-hant .panel {
font-family: var(--d2-local-fonts) !important;
}
#d2-language-switch {
position: fixed; z-index: 2147483647;
top: calc(8px + env(safe-area-inset-top, 0px));
right: calc(10px + env(safe-area-inset-right, 0px));
display: flex; gap: 2px; padding: 3px;
border: 1px solid #8f743e; border-radius: 7px;
background: rgba(10, 8, 6, .94); box-shadow: 0 2px 10px #0009;
font: 12px/1.1 ${FONT_STACK}; pointer-events: auto;
}
#d2-language-switch button {
min-height: 28px; padding: 4px 8px; border: 0; border-radius: 4px;
color: #d8d0c0; background: transparent; cursor: pointer;
font: inherit; letter-spacing: .01em;
}
#d2-language-switch button.active { color: #17120b; background: #c7a45f; font-weight: 700; }
#d2-language-switch button:focus-visible { outline: 2px solid #f0d896; outline-offset: 1px; }
`;
document.head.appendChild(style);
switcher = document.createElement('div');
switcher.id = 'd2-language-switch';
switcher.setAttribute('role', 'group');
switcher.setAttribute('aria-label', 'Language / 語言');
for (const [locale, title] of [['en', 'English'], ['zh-Hant', '繁體中文']]) {
const button = document.createElement('button');
button.type = 'button';
button.dataset.language = locale;
button.textContent = title;
button.addEventListener('click', event => {
event.preventDefault();
event.stopPropagation();
setLanguage(locale);
});
switcher.appendChild(button);
}
document.body.appendChild(switcher);
window.addEventListener('pointerdown', event => {
if (event.target instanceof Element && event.target.closest('#d2-language-switch')) event.stopImmediatePropagation();
}, true);
applyLanguage();
new MutationObserver(records => {
for (const record of records) {
if (record.type === 'characterData') processTextNode(record.target);
else {
if (record.target.nodeType === Node.ELEMENT_NODE) processAttributes(record.target);
record.addedNodes.forEach(node => scan(node));
}
}
}).observe(document.body, { subtree: true, childList: true, characterData: true });
}
window.D2I18N = {
get active() { return language === 'zh-Hant'; },
get language() { return language; },
translate,
shouldUseLocalFont,
cacheLanguage,
renderBitmapText,
setLanguage
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSwitcher, { once: true });
else addSwitcher();
})();
d2edInstall();
// ====== 遊戲手把（只偵測連線） ======
// 遊戲已內建手把操作，按鍵配置與震動請在遊戲「選項 → 手把」調整；書籤不再模擬按鍵，只顯示連線狀態：
// 偵測到手把時在畫面上方提示，遊戲「選項」選單出現 🎮 狀態按鈕，手把斷線時自動跳出提醒。
function d2padInstall() {
const style = document.createElement('style');
style.textContent = `#d2pad-toast { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 2147483647; padding: 6px 14px;
border: 1px solid #8f743e; border-radius: 6px; background: rgba(10,8,6,.94); color: #f3e3b0;
font: 14px/1.5 "Microsoft JhengHei", system-ui, sans-serif; pointer-events: none; transition: opacity .4s; }`;
document.head.append(style);
function toast(text) {
document.getElementById('d2pad-toast')?.remove();
const el = document.createElement('div');
el.id = 'd2pad-toast'; el.textContent = text;
document.body.append(el);
setTimeout(() => { el.style.opacity = '0'; }, 2200);
setTimeout(() => el.remove(), 2800);
}
const find = () => [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(p => p && p.connected) || null;
const padCheck = d2padCheck(toast, find);
// 腰帶按鍵：有手把時在腰帶 1～4 格左上角標出遊戲綁定的手把按鍵（讀遊戲的手把設定，玩家在遊戲裡改綁也會跟著變）
const BELT_DEFAULT = [14, 12, 15, 13]; // 遊戲預設：十字鍵 左／上／右／下
const PAD_NAMES = {
xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'LS', 'RS', '↑', '↓', '←', '→'],
playstation: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', '↑', '↓', '←', '→'],
switch: ['B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR', '−', '+', 'LS', 'RS', '↑', '↓', '←', '→']
};
const padKind = id => /054c|playstation|dualshock|dualsense/i.test(id) ? 'playstation' : /057e|nintendo|pro controller|joy-con/i.test(id) ? 'switch' : 'xbox';
function beltButtons() {
let saved = null;
try { saved = JSON.parse(localStorage.getItem('d2s:pad') || 'null'); } catch (_) { /* 沒有設定就用預設 */ }
return BELT_DEFAULT.map((d, i) => {
const v = saved && saved.bindings && saved.bindings['potion' + (i + 1)];
return Number.isInteger(v) && v >= 0 && v < 16 ? v : d;
});
}
style.textContent += `#belt-slots .d2pad-key { position: absolute; left: 1px; top: 0; z-index: 2; pointer-events: none;
font: bold 10px/1.1 Arial, sans-serif; color: #f3e3b0; text-shadow: -1px 0 #000, 1px 0 #000, 0 -1px #000, 0 1px #000, 0 0 3px #000; }`;
let beltAt = 0, beltSig = '';
function updateBelt(pad, now) {
if (now - beltAt < 300) return;
beltAt = now;
const slots = document.querySelectorAll('#belt-slots .belt-slot');
const names = pad ? PAD_NAMES[padKind(pad.id)] : null;
const keys = names ? beltButtons().map(b => names[b]) : [];
const sig = slots.length + '|' + keys.join(',');
if (sig === beltSig && [...slots].every(s => !!s.querySelector('.d2pad-key') === !!names)) return;
beltSig = sig;
slots.forEach((slot, i) => {
let el = slot.querySelector('.d2pad-key');
if (!names || !keys[i]) { el?.remove(); return; }
if (!el) { el = document.createElement('span'); el.className = 'd2pad-key'; slot.append(el); }
el.textContent = keys[i];
});
}
let announced = false, prev = [];
(function poll(now) {
requestAnimationFrame(poll);
const pad = find();
padCheck.update(pad);
updateBelt(pad, now || 0);
if (!pad) { prev = []; return; }
if (!announced) { announced = true; toast('已偵測到遊戲手把'); }
// 面板開著時按 A 或 B 關閉面板
const hit = i => !!(pad.buttons[i] && pad.buttons[i].pressed) && !prev[i];
if (padCheck.isOpen() && (hit(0) || hit(1))) padCheck.close();
prev = pad.buttons.map(b => b.pressed);
})();
addEventListener('gamepadconnected', e => toast('已連接遊戲手把：' + e.gamepad.id.replace(/\s*\(.*$/, '')));
addEventListener('gamepaddisconnected', () => { if (!find()) padCheck.open(true); });
}
// 手把狀態按鈕：在遊戲「選項」選單（書籤修改旁）出現 🎮，綠點＝已連接、紅點＝未連接。
// 點開檢查面板；沒連接時提示重新連接，並持續等待，偵測到就顯示成功。
function d2padCheck(toast, find) {
const css = document.createElement('style');
css.textContent = `#d2pad-btn { position: fixed; z-index: 2147483646; display: none; align-items: center; gap: 6px; padding: 5px 12px;
border: 1px solid #8f743e; border-radius: 6px; background: rgba(10,8,6,.94); color: #f3e3b0; cursor: pointer;
font: 13px/1.2 "Microsoft JhengHei", system-ui, sans-serif; box-shadow: 0 2px 10px #0009; }
#d2pad-btn i { width: 9px; height: 9px; border-radius: 50%; background: #e5534b; }
#d2pad-btn.on i { background: #6fd18b; }
#d2pad-dlg { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; background: rgba(0,0,0,.6); }
#d2pad-dlg > div { width: min(360px, calc(100vw - 32px)); padding: 18px; border: 1px solid #8f743e; border-radius: 10px;
background: #17120b; color: #e8e2d0; font: 14px/1.6 "Microsoft JhengHei", system-ui, sans-serif; box-shadow: 0 6px 24px #000c; }
#d2pad-dlg h3 { margin: 0 0 8px; color: #c7a45f; font-size: 18px; }
#d2pad-dlg .st { padding: 8px 10px; border-radius: 6px; font-weight: bold; }
#d2pad-dlg .st.on { background: #1e3a24; color: #a8efb8; }
#d2pad-dlg .st.off { background: #4a1e18; color: #ffc4b8; }
#d2pad-dlg ol { margin: 10px 0 0; padding-left: 20px; color: #bfb39a; }
#d2pad-dlg .note { margin: 12px 0 0; padding-top: 10px; border-top: 1px solid #3a2c18; color: #bfb39a; font-size: 13px; }
#d2pad-dlg .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
#d2pad-dlg button { padding: 5px 14px; border: 1px solid #8f743e; border-radius: 4px; font: inherit; cursor: pointer; background: #2c2014; color: #f3e3b0; }
#d2pad-dlg button.main { background: #c7a45f; color: #17120b; font-weight: bold; }`;
document.head.append(css);
const btn = document.createElement('button');
btn.id = 'd2pad-btn'; btn.type = 'button'; btn.title = '檢查遊戲手把連線';
btn.innerHTML = '<i></i><span>🎮 手把</span>';
document.body.append(btn);
let dlg = null, current = null, lost = false;
const name = pad => pad.id.replace(/\s*\(.*$/, '') || '遊戲手把';
function render() {
if (!dlg) return;
const st = dlg.querySelector('.st');
st.className = 'st ' + (current ? 'on' : 'off');
st.textContent = current ? '✔ 已連接：' + name(current) : (lost ? '✖ 手把已斷線，請重新連接' : '✖ 沒有偵測到手把，請重新連接');
dlg.querySelector('ol').hidden = !!current;
}
function close() { if (dlg) dlg.remove(); dlg = null; }
function open(disconnected) {
close();
lost = !!disconnected;
current = find();
dlg = document.createElement('div');
dlg.id = 'd2pad-dlg';
dlg.innerHTML = `<div><h3>🎮 遊戲手把</h3><div class="st"></div>
<ol><li>用 USB 線或藍牙連接手把（手機請到「設定 → 藍牙」配對）。</li>
<li>連好後<b>按一下手把上的任何鍵</b>，瀏覽器才會讓網頁讀到手把。</li>
<li>偵測到之後這裡會自動變成「已連接」。</li></ol>
<p class="note">按鍵配置、搖桿死區和震動開關，請到遊戲的「選項 → 手把」調整。</p>
<div class="row"><button type="button" data-a="retry">重新偵測</button><button type="button" class="main" data-a="close">關閉</button></div></div>`;
dlg.addEventListener('click', e => {
const b = e.target.closest('button'), a = b && b.dataset.a;
if (a === 'close' || e.target === dlg) close();
else if (a === 'retry') { current = find(); render(); }
});
document.body.append(dlg);
render();
}
// 遊戲的畫布會搶滑鼠事件，按鈕與面板上的操作不要傳給遊戲。
for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) {
window.addEventListener(type, e => {
if (e.target instanceof Element && (e.target.closest('#d2pad-btn') || e.target.closest('#d2pad-dlg'))) e.stopImmediatePropagation();
}, true);
}
btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); open(false); });
(function place() {
const ed = document.getElementById('d2ed-btn');
const show = ed && ed.style.display === 'block';
btn.style.display = show ? 'flex' : 'none';
if (show) {
const r = ed.getBoundingClientRect();
btn.style.left = Math.round(r.left) + 'px';
btn.style.top = Math.round(r.top - (btn.offsetHeight || 30) - 8) + 'px';
}
requestAnimationFrame(place);
})();
return {
isOpen: () => !!dlg,
close,
open,
update(pad) {
const was = !!current;
current = pad || null;
btn.classList.toggle('on', !!pad);
if (pad) lost = false;
if (was !== !!pad) { render(); if (pad && dlg) toast('已連接遊戲手把：' + name(pad)); }
}
};
}
d2padInstall();
// ====== 技能進化提示補全 ======
// 遊戲規則：技能練滿＋持有某個被動（＋角色等級）→ 寶箱把技能進化成新技能（遊戲自己的設定，build 20261020）。
// 遊戲只在「技能」那一邊一定寫出要哪個被動；「被動」那一邊：
//   ・升級卡片只寫一個技能（同職業幾個技能共用一個被動時，其他的不提）
//   ・技能樹的被動說明框完全不提
// 還沒學的技能，技能樹說明框也不提要搭配哪個被動。這裡在卡片和說明框最後補一行。
function d2evoInstall() {
const EVO = {
amazon: [["Cold Arrow", "Dodge", "Ice Arrow"], ["Exploding Arrow", "Decoy", "Immolation Arrow"], ["Multiple Shot", "Critical Strike", "Strafe"], ["Guided Arrow", "Pierce", "Widowmaker"], ["Jab", "Evade", "Fend"], ["Power Strike", "Inner Sight", "Charged Strike"], ["Poison Javelin", "Avoid", "Plague Javelin"], ["Ice Arrow", "Slow Missiles", "Freezing Arrow"], ["Lightning Bolt", "Penetrate", "Lightning Fury"], ["Charged Strike", "Penetrate", "Lightning Strike"]],
sorceress: [["Fire Bolt", "Warmth", "Fire Ball"], ["Charged Bolt", "Energy Shield", "Chain Lightning"], ["Nova", "Lightning Mastery", "Thunder Storm"], ["Fire Ball", "Enchant", "Meteor"], ["Ice Bolt", "Cold Mastery", "Frozen Orb"], ["Shiver Armor", "Cold Mastery", "Chilling Armor"], ["Ice Blast", "Faster Cast Rate", "Glacial Spike"], ["Glacial Spike", "Replenish Life", "Blizzard"], ["Blaze", "Faster Run/Walk", "Fire Wall"], ["Frozen Armor", "Vitality", "Shiver Armor"]],
necromancer: [["Poison Dagger", "Faster Cast Rate", "Poison Explosion"], ["Amplify Damage", "Faster Run/Walk", "Decrepify"], ["Confuse", "Vitality", "Attract"], ["Clay Golem", "Golem Mastery", "Blood Golem"], ["Iron Golem", "Golem Mastery", "Fire Golem"], ["Teeth", "Bone Wall", "Bone Spear"], ["Dim Vision", "Telekinesis", "Confuse"], ["Raise Skeleton", "Skeleton Mastery", "Revive"], ["Bone Spear", "Bone Armor", "Bone Spirit"], ["Poison Explosion", "Lower Resist", "Poison Nova"], ["Blood Golem", "Summon Resist", "Iron Golem"]],
assassin: [["Fire Blast", "Faster Cast Rate", "Wake of Fire"], ["Charged Bolt Sentry", "Faster Cast Rate", "Lightning Sentry"], ["Lightning Sentry", "Faster Cast Rate", "Death Sentry"], ["Dragon Talon", "Faster Run/Walk", "Dragon Claw"], ["Blade Fury", "Vitality", "Blade Shield"], ["Blade Sentinel", "Burst of Speed", "Blade Fury"], ["Dragon Tail", "Burst of Speed", "Dragon Flight"], ["Fists of Fire", "Claw Mastery", "Claws of Thunder"], ["Dragon Claw", "Claw Mastery", "Dragon Tail"], ["Psychic Hammer", "Fade", "Mind Blast"], ["Wake of Fire", "Fade", "Wake of Inferno"], ["Shadow Warrior", "Weapon Block", "Shadow Master"], ["Claws of Thunder", "Weapon Block", "Blades of Ice"], ["Tiger Strike", "Venom", "Phoenix Strike"]],
barbarian: [["Leap", "Faster Run/Walk", "Leap Attack"], ["Shout", "Vitality", "Battle Orders"], ["Double Swing", "Increased Speed", "Frenzy"], ["Bash", "Axe Mastery", "Concentrate"], ["Double Throw", "Throwing Mastery", "Lacerator"], ["Concentrate", "Iron Skin", "Berserk"], ["Battle Orders", "Find Item", "Battle Command"]],
druid: [["Fissure", "Faster Cast Rate", "Volcano"], ["Carrion Vine", "Faster Cast Rate", "Solar Creeper"], ["Twister", "Faster Run/Walk", "Tornado"], ["Summon Dire Wolf", "Vitality", "Summon Grizzly"], ["Poison Creeper", "Replenish Life", "Carrion Vine"], ["Heart of Wolverine", "Replenish Life", "Spirit of Barbs"], ["Firestorm", "Cyclone Armor", "Molten Boulder"], ["Tornado", "Cyclone Armor", "Hurricane"], ["Raven", "Ravenlore", "Summon Spirit Wolf"], ["Summon Spirit Wolf", "Ravenlore", "Summon Dire Wolf"], ["Werebear", "Lycanthropy", "Maul"], ["Maul", "Lycanthropy", "Shock Wave"], ["Oak Sage", "Spirit Keeper", "Heart of Wolverine"], ["Werewolf", "Feral Rage", "Fury"], ["Volcano", "Fire Claws", "Armageddon"]],
paladin: [["Blessed Hammer", "Concentration", "Zakarum's Hand"], ["Holy Bolt", "Holy Shock", "Fist of the Heavens"], ["Zeal", "Might", "Passion"], ["Charge", "Vigor", "Herald of Zakarum"], ["Holy Shield", "Defiance", "Exile"]]
};
const classOf = new Map(), passives = new Set();
for (const [cls, rows] of Object.entries(EVO)) for (const [skill, passive] of rows) { classOf.set(skill, cls); passives.add(passive); }
const zh = () => d2zhLang() === 'zh-Hant';
const name = s => zh() ? window.D2I18N.translate(s).replace(/（[^）]*）$/, '') : s;
// 卡片或說明框每一行的英文原文：中文模式下畫布的 textContent 會被翻成中文，所以用 D2ZH_STATE 記下的原文；分段的行把每段接起來
const original = c => { const st = D2ZH_STATE.get(c); return st ? (st.orig ?? st.src) : c.textContent; };
const lineTexts = box => [...box.children].filter(el => !el.classList.contains('d2zh-evo'))
.map(el => (el.tagName === 'CANVAS' ? [el] : [...el.querySelectorAll('canvas')]).map(original).join(' ').replace(/\s+/g, ' ').trim())
.filter(Boolean);
function rowsFor(passive, text) {
const all = Object.entries(EVO).flatMap(([cls, rows]) => rows.filter(r => r[1] === passive).map(r => [cls, ...r]));
let cls = window.__D2ED && D2ED.player && D2ED.player.cls;
if (!cls) { const seen = all.find(([, skill]) => text.includes(skill)); cls = seen && seen[0]; }   // 沒抓到人物：用卡片上已出現的技能判斷職業
return cls ? all.filter(r => r[0] === cls) : all;
}
function hintFor(box) {
const lines = lineTexts(box);
if (lines.length < 2) return null;
const [first, second] = lines[0].includes(' - ') ? lines[0].split(' - ') : [lines[0], lines[1]];
const text = lines.join(' ');
// 被動：升級卡片（New passive／Level a to b）或技能樹說明框（Level a / b、Required Level）
if (passives.has(first) && /^(New passive|Level \d+ (to|\/) \d+|Required Level:)/.test(second)) {
const rows = rowsFor(first, text);
const missing = rows.filter(([, skill, , into]) => !text.includes(`${skill} into ${into}`));
if (!missing.length) return null;
const also = missing.length < rows.length;   // 遊戲自己已經寫了其中一個
return zh()
? `此被動${also ? '也' : '可'}讓：${missing.map(([, s, , c]) => `${name(s)} → ${name(c)}`).join('、')}（技能練滿後由寶箱進化）`
: `${also ? 'Also evolves' : 'Evolves'}: ${missing.map(([, s, , c]) => `${s} → ${c}`).join(', ')} (skill at max, from a chest)`;
}
// 還沒學的技能（技能樹說明框）：遊戲沒寫要搭配哪個被動
if (classOf.has(first) && /^Required Level:/.test(second)) {
const row = EVO[classOf.get(first)].find(r => r[0] === first);
if (text.includes(`into ${row[2]}`)) return null;
return zh() ? `進化：練滿＋被動「${name(row[1])}」→ ${name(row[2])}` : `Evolves into ${row[2]}: at max, with ${row[1]}`;
}
return null;
}
function augment(box) {
const old = box.querySelector(':scope > .d2zh-evo');
let hint = null;
try { hint = hintFor(box); } catch (e) { console.warn('[D2 中文] 進化提示', e); }
if (!hint) { old?.remove(); return; }
if (old && old.textContent === hint) return;
const el = old || document.createElement('div');
el.className = 'd2zh-evo';
el.textContent = hint;
// 字的大小照這個框裡第一行字型畫布的高度
const ref = box.querySelector('canvas');
const h = ref ? ref.offsetHeight : 16;
// 不要把說明框撐寬：最寬只到框裡原本最寬的那一行，超過就換行
const widest = Math.max(200, ...[...box.children].filter(c => c !== el).map(c => c.offsetWidth));
el.style.cssText = `font: bold ${Math.max(11, Math.round(h * 0.8))}px ${D2ZH_FONT}; line-height: 1.35; color: #e0bd6a; max-width: ${widest}px; align-self: center;` +
' text-shadow: -1px 0 #000, 1px 0 #000, 0 -1px #000, 0 1px #000; margin-top: 2px; white-space: normal; text-align: center; pointer-events: none;';
if (!old) box.append(el);
}
const boxes = () => document.querySelectorAll('#hoverbox, .d2-choice > .lines');
let queued = false;
const run = () => { queued = false; boxes().forEach(augment); };
const schedule = () => { if (!queued) { queued = true; setTimeout(run, 0); } };
new MutationObserver(records => {
for (const r of records) {
if ([...r.addedNodes, ...r.removedNodes].every(n => n.nodeType === 1 && n.classList.contains('d2zh-evo'))) continue;
const t = r.target;
if (t.nodeType === 1 && (t.matches('#hoverbox, .d2-choice > .lines, .d2-choice') || t.closest('#hoverbox, .d2-choice'))) { schedule(); return; }
for (const n of r.addedNodes) if (n.nodeType === 1 && (n.matches('#hoverbox, .d2-choice') || n.querySelector?.('.d2-choice'))) { schedule(); return; }
}
}).observe(document.body, { subtree: true, childList: true });
window.addEventListener('d2-language-changed', schedule);
}
d2evoInstall();
// ====== 說明框不要超出視窗 ======
// 遊戲在說明框出現時，用當下的高度決定位置（框在圖示上方時是「底邊對齊」）；之後中文合併字詞、補上「進化：…」那一行，
// 框變高就往上長，最上面的技能名稱被視窗切掉。框的大小或位置一變，就把它推回視窗裡。
function d2fitInstall() {
const MARGIN = 4;
const own = new WeakMap();   // 每個框：遊戲自己設的位置（base）和這裡改過的值（mine）
const fit = box => {
if (box.classList.contains('hidden') || !box.style.top) return;
const o = own.get(box) || {};
if (box.style.top !== o.mine) o.base = parseFloat(box.style.top);   // 遊戲重新定位了
own.set(box, o);
const r = box.getBoundingClientRect();
if (!r.height) return;
// 照遊戲原本的位置算，框變矮時就回到原位
const shift = parseFloat(box.style.top) - o.base, top = r.top - shift, bottom = r.bottom - shift;
let dy = 0;
if (top < MARGIN || r.height > innerHeight - MARGIN * 2) dy = MARGIN - top;   // 放不下時至少讓最上面的名稱看得到
else if (bottom > innerHeight - MARGIN) dy = innerHeight - MARGIN - bottom;
if (Math.abs(dy - shift) < 0.5) return;
o.mine = `${o.base + dy}px`;
box.style.top = o.mine;
o.mine = box.style.top;   // 瀏覽器可能改寫數字格式
};
const watched = new WeakSet();
const watch = () => {
for (const box of document.querySelectorAll('#hoverbox, #tooltip')) {
if (watched.has(box)) continue;
watched.add(box);
new ResizeObserver(() => fit(box)).observe(box);
new MutationObserver(() => fit(box)).observe(box, { attributes: true, attributeFilter: ['style', 'class'] });
}
};
watch();
new MutationObserver(watch).observe(document.body, { childList: true });
}
d2fitInstall();
})();
