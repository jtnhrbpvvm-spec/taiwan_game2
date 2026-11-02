// 檢查遊戲更新後有沒有新的韓文字串、有沒有翻譯用不到了：node tools/check-update.js
// 會下載線上的遊戲資料（約 60 MB）。新增翻譯到 rxs_zh.js 後，有新字的話要重跑 build_font.py，並把 RXSZH_VERSION 加一。
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const GAME = 'https://gaho727.github.io/rockmanx-survivors/';

function loadDict() {
  const s = fs.readFileSync(path.join(__dirname, '..', 'rxs_zh.js'), 'utf8');
  const a = s.indexOf('const ZH = ') + 11, b = s.indexOf('// BGM 曲名存在場景');
  return eval('(' + s.slice(a, b).trim().replace(/;$/, '') + ')');
}

function readLiterals(meta) {
  const litOff = meta.readInt32LE(8), litCnt = meta.readInt32LE(16), dataOff = meta.readInt32LE(20);
  const out = [];
  for (let i = 0; i < litCnt - 1; i++) {
    const a = meta.readInt32LE(litOff + i * 4), b = meta.readInt32LE(litOff + (i + 1) * 4);
    out.push(meta.toString('utf8', dataOff + a, dataOff + b));
  }
  return { version: meta.readInt32LE(4), list: out };
}

function findFile(raw, want) {
  const header = raw.readUInt32LE(16);
  let p = 20;
  while (p < header) {
    const off = raw.readUInt32LE(p), sz = raw.readUInt32LE(p + 4), nl = raw.readUInt32LE(p + 8);
    if (raw.toString('utf8', p + 12, p + 12 + nl).endsWith(want)) return raw.subarray(off, off + sz);
    p += 12 + nl;
  }
  throw new Error('找不到 ' + want);
}

(async () => {
  const html = await (await fetch(GAME, { cache: 'no-cache' })).text();
  const version = (html.match(/productVersion:"([^"]+)"/) || [])[1];
  const data = (html.match(/dataUrl:buildUrl\+'([^']+)'/) || [])[1];
  console.log('線上版本', version, data);
  const res = await fetch(GAME + 'Build' + data);
  const buf = Buffer.from(await res.arrayBuffer());
  const raw = buf[0] === 0x1f ? zlib.gunzipSync(buf) : buf;
  const lit = readLiterals(findFile(raw, 'global-metadata.dat'));
  if (lit.version !== 39) console.log('⚠ metadata 版本變了：', lit.version, '（rxs_zh.js 目前只支援 39）');
  const ZH = loadDict();
  const set = new Set(lit.list);
  const fresh = lit.list.filter(s => /[가-힣]/.test(s) && s.length < 3000 && !(s in ZH) && !s.startsWith('[RXS]') && s !== '가ힰ' && !s.includes('一龦'));
  const gone = Object.keys(ZH).filter(k => !set.has(k));
  console.log('\n未翻譯的新字串', fresh.length);
  fresh.forEach(s => console.log('  ' + JSON.stringify(s)));
  console.log('\n遊戲已經不用的翻譯', gone.length);
  gone.forEach(s => console.log('  ' + JSON.stringify(s)));
})();
