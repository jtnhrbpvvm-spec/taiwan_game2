// D2 Survivors 改版檢查：讀電腦版遊戲的 app.asar，列出書籤（d2_zh.js）還沒翻到的字串。
//   用法（在 D2修改版 資料夾執行）：
//     node tools/check-update.js                 和上一個存下來的版本比對
//     node tools/check-update.js --all           連以前就沒翻到的也列出來
//     node tools/check-update.js --asar <路徑>    指定 app.asar（預設：中文化記錄的遊戲資料夾，或 C:\Program Files\D2 Survivors）
//     node tools/check-update.js --base <版本>    指定比對基準（例如 20261105.3），預設是 tools/cache 裡比目前舊的最新一版
// 2026-11-21 網頁版下架，改讀電腦版：app.asar 裡的 desktop/dist/web 就是遊戲網頁（assets/*.js、changelog.json）。
//   assets/ko-*.js 是完整的「英文 → 韓文」字串表；技能資料（含 evolution:{passive:）用來比對書籤的進化表（EVO）。
// 每個版本的遊戲檔存在 tools/cache/assets-<版本>/（git 忽略），下次當比對基準。重跑幾次結果都一樣，不會蓋掉基準。
// 輸出很長，建議導到檔案：node tools/check-update.js > report.txt
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HERE = __dirname;
const ROOT = path.join(HERE, '..');
const CACHE = path.join(HERE, 'cache');
const SHOW_ALL = process.argv.includes('--all');
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };

function findAsar() {
  const given = arg('--asar');
  if (given) return given;
  const dirs = [];
  try { dirs.push(fs.readFileSync(path.join(process.env.APPDATA || '', 'D2SurvivorsZH', 'game-dir.txt'), 'utf8').trim()); } catch (_) { /* 沒裝過中文化 */ }
  dirs.push('C:\\Program Files\\D2 Survivors', path.join(process.env.LOCALAPPDATA || '', 'Programs', 'D2 Survivors'));
  for (const d of dirs) { const p = path.join(d, 'resources', 'app.asar'); if (d && fs.existsSync(p)) return p; }
  throw new Error('找不到遊戲的 app.asar，請用 --asar 指定路徑');
}

// app.asar：4 位元組 4、4 位元組標頭長度、標頭 pickle（長度 + JSON）、檔案資料。只讀 desktop/dist/web 底下的檔案
function readWeb(asarPath) {
  const fd = fs.openSync(asarPath, 'r');
  try {
    const head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    const json = Buffer.alloc(head.readUInt32LE(12));
    fs.readSync(fd, json, 0, json.length, 16);
    const base = 8 + head.readUInt32LE(4);
    let node = JSON.parse(json.toString('utf8'));
    for (const k of ['desktop', 'dist', 'web']) {
      node = node.files && node.files[k];
      if (!node) throw new Error('app.asar 裡找不到 desktop/dist/web（遊戲打包方式可能改了）');
    }
    const files = new Map();
    (function walk(n, prefix) {
      for (const [name, v] of Object.entries(n.files || {})) {
        const p = prefix + name;
        if (v.files) { walk(v, p + '/'); continue; }
        if (v.unpacked || !/\.(js|json)$/.test(name)) continue;
        const buf = Buffer.alloc(v.size);
        fs.readSync(fd, buf, 0, v.size, base + Number(v.offset));
        files.set(p, buf.toString('utf8'));
      }
    })(node, '');
    return files;
  } finally { fs.closeSync(fd); }
}

// 遊戲 20261124.1 起有官方簡體中文（assets/zh-*.js，格式和 ko 表一樣：英文 → 簡中，佔位符是 {0}{1}…）。
// 2026-11-24 比對過：句子大致可用，但物品／技能／怪物名稱用的是國服譯名（刺客＝猎法者、冰寒＝冰霜、淬鍊＝淬火…），
// 和書籤（易牙居、台灣用語）差很多，所以不直接換成簡轉繁，只在這裡當「簡中參考」，加新翻譯時省得從頭翻。
// 簡轉繁用 Windows 內建的 LCMapString（逐字轉換），再用下面的表改成書籤用語、補逐字轉換轉錯的字。
const SC_TERMS = [
  ['獵法者', '刺客'], ['冰霜', '冰寒'], ['淬火', '淬鍊'], ['透視地圖', '自動地圖'], ['魔壇', '神殿'], ['赫拉迪姆', '赫拉迪克'],
  ['暗黑破壞神2', '暗黑破壞神 II'], ['在線', '線上'], ['游戲', '遊戲'], ['范圍', '範圍'], ['復制', '複製'], ['并', '並'],
  ['數據', '資料'], ['文件夾', '資料夾'], ['文件', '檔案'], ['保存', '儲存'], ['刷新', '重新整理'], ['加載', '載入'], ['默認', '預設'],
  ['設置', '設定'], ['菜單', '選單'], ['鼠標', '滑鼠'], ['屏幕', '螢幕'], ['信息', '訊息'], ['用戶', '使用者'], ['幾率', '機率'],
  ['剩余', '剩餘'], ['其余', '其餘'], ['多余', '多餘'], ['墻', '牆'], ['佈', '布'], ['程序', '程式'], ['網絡', '網路'], ['軟件', '軟體'],
];
function scToTc(list) {
  if (!list.length || process.platform !== 'win32') return list.map(() => '');
  const os = require('os'), { execFileSync } = require('child_process');
  const tmp = path.join(os.tmpdir(), `d2sc-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify(list));
  try {
    const ps = `Add-Type -AssemblyName Microsoft.VisualBasic; $j = [IO.File]::ReadAllText('${tmp}') | ConvertFrom-Json; ` +
      `$o = @($j | ForEach-Object { [Microsoft.VisualBasic.Strings]::StrConv([string]$_, [Microsoft.VisualBasic.VbStrConv]::TraditionalChinese, 0x0804) }); ` +
      `[IO.File]::WriteAllText('${tmp}', (ConvertTo-Json -InputObject $o -Compress), [Text.UTF8Encoding]::new($false))`;
    execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
    const out = JSON.parse(fs.readFileSync(tmp, 'utf8').replace(/^﻿/, ''));
    return (Array.isArray(out) ? out : [out]).map(s => {
      let t = String(s || '');
      for (const [a, b] of SC_TERMS) t = t.split(a).join(b);
      return t.replace(/(?<![皇王天])后/g, '後').replace(/(這|那|哪|心|家)里/g, '$1裡').replace(/\{\d+\}/g, '*');
    });
  } catch (_) { return list.map(() => ''); } finally { try { fs.unlinkSync(tmp); } catch (_) { /* 已刪 */ } }
}

// 遊戲寫死在程式裡的英文（不在 ko 表）：取反引號字串，${…} 統一成 ${}，免得變數改名被當成新句子
function literals(texts) {
  const set = new Set();
  for (const t of texts) for (const m of t.matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
    const s = m[1].replace(/\$\{[^}]*\}/g, '${}');
    if (s.length < 400 && (/[A-Za-z]{2,}[^`]*\s[A-Za-z]{2,}/.test(s) || /^[A-Z][A-Z ':!?.-]{3,}$/.test(s)) && !/[{};=<>]|\b(function|return|const|let|var)\b|https?:|\.(js|css|png|webp)\b/.test(s)) set.add(s);
  }
  return set;
}

// 在假的瀏覽器環境裡執行 d2_zh.js，拿出 D2I18N.translate
function loadTranslator() {
  const any = (() => {
    const f = function () { return p; };
    const p = new Proxy(f, {
      get(_, k) {
        if (k === Symbol.toPrimitive) return () => '';
        if (k === Symbol.iterator) return function* () {};
        if (k === 'then') return undefined;
        if (k === 'readyState') return 'complete';
        if (k === 'length') return 0;
        return p;
      },
      apply: () => p, construct: () => p, set: () => true, has: () => true,
    });
    return p;
  })();
  const store = {};
  const win = {
    __D2ZH_DESKTOP: { updater: 1 }, document: any, navigator: any, console,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem() {} },
    location: { href: 'app://game/', pathname: '/', search: '' },
    CanvasRenderingContext2D: function () {}, HTMLCanvasElement: function () {}, ImageData: function () {},
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 }, NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: function () { return { observe() {}, disconnect() {} }; },
    ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
    Storage: function () {}, fetch: () => Promise.reject(new Error('offline')), Response: function () {},
    CustomEvent: function () {}, Element: function () {}, HTMLElement: function () {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {},
    requestAnimationFrame: () => 0, performance: { now: () => 0, getEntriesByType: () => [] },
    alert: m => { throw new Error('alert: ' + m); }, getComputedStyle: () => any, matchMedia: () => any,
  };
  win.Storage.prototype = { setItem() {}, getItem() { return null; }, removeItem() {} };
  win.CanvasRenderingContext2D.prototype = { putImageData() {}, drawImage() {}, fillText() {} };
  win.window = win; win.self = win; win.globalThis = win;
  const source = fs.readFileSync(path.join(ROOT, 'd2_zh.js'), 'utf8');
  try { vm.runInContext(source, vm.createContext(win), { filename: 'd2_zh.js' }); }
  catch (e) {
    if (!win.D2I18N) throw e;
    // 書籤後半段沒跑完的話，有些翻譯會用到還沒初始化的變數；先警告，再看是不是這裡的假環境少了什麼
    console.warn(`  （警告：書籤在檢查環境裡沒有完整跑完：${e.message}）`);
  }
  return { translate: win.D2I18N.translate, source };
}

function parseKo(text) {
  const m = { exports: {} };
  new Function('module', text.replace(/export\s*\{\s*(\w+) as default\s*\};?\s*$/, 'module.exports=$1;'))(m);
  return m.exports;
}

// 翻譯結果裡還有英文單字（排除按鍵、縮寫、專有名詞）就算沒翻到
const KEEP = /^(D2|D2R|XP|MF|HP|ID|OK|Esc|Enter|Shift|Tab|Ctrl|Alt|LT|RT|LB|RB|Diablo|II|Resurrected|Survivors|Blizzard|Entertainment|Inc|Battle|net|Steam|Safari|Chrome|Edge|Firefox|Discord|Reddit|Google|Cloudflare|Apple|Windows|OneDrive|iCloud|Dropbox|Ko|fi)$/i;
function untranslated(zh) {
  const words = (zh.match(/[A-Za-z]{2,}/g) || []).filter(w => !KEEP.test(w));
  return words.length > 0 && (!/[㐀-鿿]/u.test(zh) || words.join('').length > 3);
}

// 書籤的進化表（EVO）和遊戲的技能資料比對
function checkEvolutions(keepSave, source, allText = keepSave) {
  const names = {};
  // 被動的名稱可能在別的檔（例如共用被動 frw、fcr），所以名稱從所有檔案找
  // 20261105.1 起技能寫成 xxx:{growth:…,name:`…`}，name 前面可能有 growth
  const HEAD = /(\w+):\{(?:growth:[^`]{0,40}(?:`[^`]*`[^`]{0,20})?,)?name:`([^`]+)`/g;
  for (const m of allText.matchAll(HEAD)) if (!(m[1] in names)) names[m[1]] = m[2];
  const heads = [...keepSave.matchAll(HEAD)].map(m => ({ at: m.index, name: m[2] }));
  const game = [];
  for (const m of keepSave.matchAll(/evolution:\{passive:`(\w+)`,into:`(\w+)`[^}]*\}/g)) {
    const head = heads.filter(h => h.at < m.index).pop();
    game.push([head.name, names[m[1]] || m[1], names[m[2]] || m[2]].join(' | '));
  }
  const start = source.indexOf('const EVO = {');
  const evo = new Function('return ' + source.slice(start + 12, source.indexOf('};', start) + 1))();
  const mine = Object.values(evo).flat().map(r => r.join(' | '));
  const norm = s => s.toLowerCase().replace(/\s+/g, '');
  const mineSet = new Set(mine.map(norm)), gameSet = new Set(game.map(norm));
  return {
    count: game.length,
    missing: game.filter(r => !mineSet.has(norm(r))),
    extra: mine.filter(r => !gameSet.has(norm(r))),
  };
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const asarPath = findAsar();
  const web = readWeb(asarPath);
  const changelog = JSON.parse(web.get('changelog.json') || '[]');
  const build = changelog[0] && changelog[0].build;
  if (!build) throw new Error('app.asar 裡沒有 changelog.json');
  console.log(`遊戲檔：${asarPath}`);
  console.log(`遊戲版本：${build}（${changelog[0].date}）`);

  // 存下這一版的遊戲檔，當下次的比對基準
  const mine = path.join(CACHE, `assets-${build}`);
  fs.mkdirSync(mine, { recursive: true });
  for (const [p, text] of web) if (/^assets\/[^/]+\.js$/.test(p) || p === 'changelog.json') fs.writeFileSync(path.join(mine, path.basename(p)), text);

  // 比對基準：指定的版本，或 cache 裡比目前舊的最新一版
  const older = fs.readdirSync(CACHE).map(n => /^assets-(.+)$/.exec(n)?.[1]).filter(b => b && b < build).sort();
  const baseBuild = arg('--base') || older.pop() || null;
  const baseDir = baseBuild && path.join(CACHE, `assets-${baseBuild}`);
  const baseFiles = baseDir && fs.existsSync(baseDir) ? fs.readdirSync(baseDir).map(n => [n, fs.readFileSync(path.join(baseDir, n), 'utf8')]) : null;
  console.log(baseFiles ? `比對基準：${baseBuild}` : '比對基準：沒有（第一次檢查，只列出全部沒翻到的）');

  const { translate, source } = loadTranslator();

  // 更新紀錄：書籤用 D2ZH_CHANGELOG 整句翻（不經過 translate），這裡核對新版本的每一行都有譯文
  const clStart = source.indexOf('const D2ZH_CHANGELOG = {');
  const clText = source.slice(clStart, source.indexOf('\n};', clStart));
  const fresh = baseBuild ? changelog.filter(b => b.build > baseBuild) : changelog.slice(0, 1);
  // 簡中字串表（沒有就是舊版遊戲，參考欄留空）
  const zhPath = [...web.keys()].find(p => /^assets\/zh-[^/]+\.js$/.test(p));
  const sc = zhPath ? parseKo(web.get(zhPath)) : {};
  const scRef = (keys) => { const tc = scToTc(keys.map(k => sc[k] || '')); return new Map(keys.map((k, i) => [k, sc[k] ? tc[i] : ''])); };
  const clRef = scRef(fresh.flatMap(b => b.lines.map(l => l.text)).filter(t => !clText.includes(JSON.stringify(t) + ':')));
  console.log(`\n== 更新紀錄（${baseBuild ? `${baseBuild} 之後` : '最新一版'}）==${zhPath ? '（缺譯文的附簡中轉繁參考，名稱要改成書籤用語）' : ''}`);
  for (const b of fresh) {
    console.log(`\n[${b.build}] ${b.date}`);
    for (const l of b.lines) {
      console.log(`  ${clText.includes(JSON.stringify(l.text) + ':') ? '　' : '缺'}｜${l.kind === 'new' ? '新' : '修'}｜${l.text}`);
      if (clRef.get(l.text)) console.log(`      簡中參考：${clRef.get(l.text)}`);
    }
  }
  const clMissing = fresh.flatMap(b => b.lines).filter(l => !clText.includes(JSON.stringify(l.text) + ':')).length;
  console.log(`\n更新紀錄缺譯文：${clMissing} 行（標「缺」的要加到 D2ZH_CHANGELOG 最前面）`);

  // ko 字串表
  const koPath = [...web.keys()].find(p => /^assets\/ko-[^/]+\.js$/.test(p));
  if (!koPath) throw new Error('找不到 ko-*.js（遊戲載入字串表的方式可能改了）');
  const ko = parseKo(web.get(koPath));
  const baseKoText = baseFiles && (baseFiles.find(([n]) => /^ko-/.test(n)) || [])[1];
  const prev = baseKoText ? parseKo(baseKoText) : null;
  const skip = new Set(changelog.flatMap(b => b.lines.map(l => l.text)));
  const rows = [];
  for (const [en, kr] of Object.entries(ko)) {
    if (skip.has(en)) continue;
    // affix:、monster:、unique: 這類是韓文版自己用的名稱表；英文畫面只顯示冒號後面的名稱
    const shown = en.replace(/^[a-z]+:(?=\S)/, '');
    const zh = translate(shown.replace(/#/g, '12'));
    const isNew = !!prev && !(en in prev);
    if (untranslated(zh) && (SHOW_ALL || isNew || !prev)) rows.push({ en: shown, zh, kr, isNew });
  }
  const unique = [...new Map(rows.map(r => [r.en, r])).values()];
  const added = prev ? Object.keys(ko).filter(k => !(k in prev) && !skip.has(k)) : [];
  console.log(`\n== 字串表 ${path.basename(koPath)}：共 ${Object.keys(ko).length} 句，${prev ? `新增 ${added.length} 句（不含更新紀錄）` : '沒有基準'} ==`);
  console.log(`還沒翻到${SHOW_ALL || !prev ? '' : '（這次新增）'}：${unique.length} 句`);
  const keyOf = new Map(Object.keys(ko).map(k => [k.replace(/^[a-z]+:(?=\S)/, ''), k]));
  const koRef = scRef(unique.map(r => keyOf.get(r.en) || r.en));
  for (const r of unique) {
    const ref = koRef.get(keyOf.get(r.en) || r.en);
    console.log(`  ${r.isNew ? '＋' : '　'} ${r.en}\n      現在：${r.zh}\n      韓文：${r.kr}${ref ? `\n      簡中參考：${ref}` : ''}`);
  }
  if (prev && added.length) {
    console.log('\n== 新增句子目前的翻譯（翻過但不通順的也要看）==');
    for (const k of added) console.log(`  ${k}\n    → ${translate(k.replace(/^[a-z]+:(?=\S)/, '').replace(/#/g, '12'))}`);
  }

  // 寫死在程式裡的新句子（不在 ko 表）
  if (baseFiles) {
    const jsNow = [...web].filter(([p]) => /^assets\/[^/]+\.js$/.test(p) && !/\/(ko|zh)-/.test(p)).map(([, t]) => t);
    const jsOld = baseFiles.filter(([n]) => n.endsWith('.js') && !/^(ko|zh)-/.test(n)).map(([, t]) => t);
    const old = literals(jsOld);
    // 含漢字的是遊戲簡中模式才顯示的句子（網頁版下載說明等），書籤固定英文底，不用翻
    const lit = [...literals(jsNow)].filter(s => !old.has(s) && !/[一-鿿]/.test(s) && !skip.has(s) && !(s in ko) && !(s.replace(/\$\{\}/g, '*') in ko) && !(s.replace(/\$\{\}/g, '#') in ko));
    console.log(`\n== 程式裡寫死的新句子（不在字串表）：${lit.length} 句 ==`);
    for (const s of lit) console.log(`  ${s}\n    → ${translate(s.replace(/\$\{\}/g, '12'))}`);
  }

  const skillFile = [...web].find(([p, t]) => /^assets\//.test(p) && !/\/ko-/.test(p) && t.includes('evolution:{passive:'));
  if (skillFile) {
    const allText = [...web].filter(([p]) => /^assets\//.test(p) && !/\/ko-/.test(p)).map(([, t]) => t).join('\n');
    const evo = checkEvolutions(skillFile[1], source, allText);
    console.log(`\n== 進化表：遊戲 ${evo.count} 組 ==`);
    if (!evo.missing.length && !evo.extra.length) console.log('  書籤的 EVO 表和遊戲一致');
    for (const r of evo.missing) console.log(`  遊戲有、書籤沒有：${r}`);
    for (const r of evo.extra) console.log(`  書籤有、遊戲沒有：${r}`);
  }

  const report = path.join(CACHE, `report-${build}.json`);
  fs.writeFileSync(report, JSON.stringify({ build, base: baseBuild, ko: path.basename(koPath), untranslated: unique }, null, 1));
  console.log(`\n報告：${path.relative(ROOT, report)}；這一版的遊戲檔存在 ${path.relative(ROOT, mine)}`);
  console.log('另外記得：每次改版都要到電腦版實測「裝備創造」。');
}

main().then(() => process.exit(0), e => { console.error('檢查失敗：', e.message); process.exit(1); });
