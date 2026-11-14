/* 遊戲改版後檢查「中文還缺什麼」（小百科和離線版 zh.js 共用 tools\zh\names.txt）
   用法（在 RO倖存者 資料夾）：
     node tools\check_zh.js                 檢查最新一次爬蟲的版本
     node tools\check_zh.js 20261109_00ec63b 指定版本資料夾
   會列出：
   1. 官方中文表比英文表少的字串（官方漏翻；有的話考慮在 zh.js 補）
   2. 物品、卡片名稱（assets/manifest.json）在 names.txt 沒有譯名的 → 加到 names.txt
   3. 怪物、技能名稱在 names.txt 沒有譯名、而且官方也沒翻的 → 加到 names.txt
   4. 離線版修補（rs_offline.py 的 CORE_PATCHES）對不對得上 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CRAWL = path.join(process.env.USERPROFILE || '', 'Desktop', '爬蟲', 'ro-survivors-tool', 'rs-crawl');
let dir = process.argv[2];
if (!dir) {
  const idx = JSON.parse(fs.readFileSync(path.join(CRAWL, 'index.json'), 'utf8'));
  dir = idx[idx.length - 1].dir;
}
const base = path.join(CRAWL, dir);
const build = path.join(base, 'build');
const pick = re => fs.readdirSync(build).find(f => re.test(f));
const core = fs.readFileSync(path.join(build, pick(/^soul_linker-[\w-]+\.js$/)), 'utf8');
console.log('版本：' + dir);

/* names.txt */
const names = {};
for (const line of fs.readFileSync(path.join(ROOT, 'tools', 'zh', 'names.txt'), 'utf8').split(/\r?\n/)) {
  if (!line.startsWith('@') || !line.includes('\t')) continue;
  const [en, zh] = line.slice(1).split('\t');
  if (en.trim() && zh && zh.trim()) names[en.trim()] = zh.trim();
}

/* 取出原始碼裡的物件字面值 { ... } */
function literal(src, start) {
  let i = start, d = 0, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') d++;
    else if (c === '}' && --d === 0) break;
  }
  return (0, eval)('(' + src.slice(start, i + 1) + ')');
}
function objNamed(name) {
  const m = new RegExp('[,;\\s]' + name.replace(/\$/g, '\\$') + '=\\{').exec(core);
  return m ? literal(core, m.index + m[0].length - 1) : null;
}

/* 1. 官方中文表 */
const lang = /([\w$]+)=\{es:null,en:([\w$]+),"zh-TW":([\w$]+)[,}]/.exec(core);  // 11-11 起後面多了 "pt-BR"
let ZH = {};
if (!lang) console.log('⚠ 找不到語言表 {es:null,en:…,"zh-TW":…}（遊戲改了寫法）');
else {
  const EN = objNamed(lang[2]); ZH = objNamed(lang[3]);
  const miss = Object.keys(EN).filter(k => !(k in ZH));
  console.log(`\n1. 官方中文表：英文 ${Object.keys(EN).length} 條、中文 ${Object.keys(ZH).length} 條、中文缺 ${miss.length} 條`);
  for (const k of miss.slice(0, 50)) console.log('   ' + JSON.stringify(EN[k]));
}

/* 2. manifest 物品、卡片 */
const man = JSON.parse(fs.readFileSync(path.join(base, 'assets', 'manifest.json'), 'utf8'));
console.log('\n2. 物品／卡片名稱沒有譯名的（加到 tools\\zh\\names.txt）：');
let n2 = 0;
for (const sec of ['items', 'cards']) {
  for (const [id, v] of Object.entries(man[sec] || {})) {
    if (v && v.name && !names[v.name]) { console.log(`   @${v.name}\t    （${sec} ${id}）`); n2++; }
  }
}
if (!n2) console.log('   （全部都有）');

/* 3. 怪物、技能 */
console.log('\n3. 怪物／技能名稱沒有譯名、官方也沒翻的：');
let n3 = 0;
const seen = new Set();
for (const m of core.matchAll(/\b[\w$]+\(\{id:"([\w]+)",name:"([^"]+)",level:\d+,hp:/g)) {
  if (!names[m[2]] && !seen.has(m[2])) { seen.add(m[2]); console.log(`   @${m[2]}\t    （怪物 ${m[1]}）`); n3++; }
}
/* 技能名：定義長這樣 wa("kihop","Kihop","tk_power",…)（id、英文名、圖示）。
   遊戲會用官方翻譯表（ZH）和名稱表（{Novice:"初心者",…}）翻；兩邊都沒有、names.txt 也沒有才列出 */
const nm = /[,;\s]([\w$]+)=\{Novice:"/.exec(core);
const OFFICIAL_NAMES = nm ? objNamed(nm[1]) : {};
if (!nm) console.log('   ⚠ 找不到官方名稱表 {Novice:"初心者",…}，技能檢查可能不準');
let skillCount = 0;
for (const m of core.matchAll(/[\w$]+\("([a-z][a-z0-9_]*)","([A-Z][A-Za-z' ]+)","([a-z][a-z0-9_]*)"/g)) {
  skillCount++;
  const en = m[2];
  if (seen.has(en) || names[en] || ZH[en] || OFFICIAL_NAMES[en]) continue;
  seen.add(en); console.log(`   @${en}\t    （技能 ${m[1]}）`); n3++;
}
if (!skillCount) console.log('   ⚠ 一個技能定義都沒找到（遊戲改了寫法），技能名要在遊戲裡看');
if (!n3) console.log('   （全部都有）');

/* 4. 離線版修補：2026-11-13 作者封鎖離線遊玩，離線版 v2.0 為最終版（只剩公告頁），不再檢查 */
console.log('\n4. 離線版：已停止（v2.0 最終版），不檢查修補。');
console.log('\n補完 names.txt 後：python tools\\build_wiki.py（小百科），再推上 GitHub。');
