// 比較兩版遊戲的文字：翻譯表（新增／移除／官方中文改）、main.js 的 b(西,英,中) 三語字串
// 用法：node tools\diff_text.js 舊版資料夾 新版資料夾   （例如 20261109_00ec63b 20261109_f254752，在 rs-crawl 底下）
// 輸出可能很長，建議 > 存成檔案再看
const fs = require('fs'), path = require('path');
const C = path.join(process.env.USERPROFILE, 'Desktop', '爬蟲', 'ro-survivors-tool', 'rs-crawl');
const [A, B] = process.argv.slice(2);
const file = (v, re) => { const d = path.join(C, v, 'build'); return fs.readFileSync(path.join(d, fs.readdirSync(d).find(f => re.test(f))), 'utf8'); };
function literal(src, start) {
  let i = start, d = 0, q = null;
  for (; i < src.length; i++) { const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c; else if (c === '{') d++; else if (c === '}' && --d === 0) break; }
  return (0, eval)('(' + src.slice(start, i + 1) + ')');
}
function tables(v) {
  const s = file(v, /^soul_linker-.*\.js$/);
  const m = /([\w$]+)=\{es:null,en:([\w$]+),"zh-TW":([\w$]+)[,}]/.exec(s);  // 11-11 起後面多了 "pt-BR"
  const get = n => { const mm = new RegExp('[,;\\s]' + n.replace(/\$/g, '\\$') + '=\\{').exec(s); return literal(s, mm.index + mm[0].length - 1); };
  return { en: get(m[2]), zh: get(m[3]) };
}
function tri(v) {
  const s = file(v, /^main-.*\.js$/);
  const out = new Map();
  const re = /\bb\(("(?:[^"\\]|\\.)*"),("(?:[^"\\]|\\.)*"),("(?:[^"\\]|\\.)*")(?:,"(?:[^"\\]|\\.)*")?\)/g;  // 11-11 起多第 4 個（葡萄牙文）
  for (const m of s.matchAll(re)) { try { out.set(JSON.parse(m[1]), [JSON.parse(m[2]), JSON.parse(m[3])]); } catch (e) {} }
  return out;
}
const ta = tables(A), tb = tables(B);
console.log('== 翻譯表 新增');
for (const k of Object.keys(tb.en)) if (!(k in ta.en)) console.log(' +', JSON.stringify(k), '→', JSON.stringify(tb.zh[k]));
console.log('== 翻譯表 移除');
for (const k of Object.keys(ta.en)) if (!(k in tb.en)) console.log(' -', JSON.stringify(k), '→', JSON.stringify(ta.zh[k]));
console.log('== 翻譯表 中文改');
for (const k of Object.keys(tb.zh)) if (k in ta.zh && ta.zh[k] !== tb.zh[k]) console.log(' ~', JSON.stringify(ta.zh[k]), '→', JSON.stringify(tb.zh[k]));
const xa = tri(A), xb = tri(B);
console.log(`== main.js 三語字串 ${xa.size} → ${xb.size}；新增`);
for (const [k, v] of xb) if (!xa.has(k)) console.log(' +', JSON.stringify(v[1]));
console.log('== 移除');
for (const [k, v] of xa) if (!xb.has(k)) console.log(' -', JSON.stringify(v[1]));
console.log('== 中文改');
for (const [k, v] of xb) if (xa.has(k) && xa.get(k)[1] !== v[1]) console.log(' ~', JSON.stringify(xa.get(k)[1]), '→', JSON.stringify(v[1]));
