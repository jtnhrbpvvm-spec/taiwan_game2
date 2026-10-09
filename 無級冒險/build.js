// 把 loader.js 整份塞進書籤，產生不需要連網載入的安裝頁 install.html
// 用法：node build.js（loader.js 改過之後要重跑）
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'loader.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('//'));
if (src.some((l) => /(^|[^:'"`\\])\/\//.test(l))) {
  throw new Error('loader.js 裡有行尾 // 註解，壓成單行後會把後面的程式碼吃掉');
}
const code = src.join(' ');
new Function(code.replace(/^\(\(\) => \{/, '(() => { return;')); // 語法檢查

// 只編碼會破壞網址或 HTML 屬性的字元，中文保持原樣，書籤長度才不會膨脹三倍
const enc = (s) => s.replace(/[%#"<>&\s]/g, encodeURIComponent);
if (decodeURIComponent(enc(code)) !== code) throw new Error('編碼後無法還原');
const tool = 'javascript:' + enc(code);
const unlock = 'javascript:' + enc(
  "(()=>{if(!/wuji-adventure/.test(location.host)){alert('請先打開「無級冒險」的網頁');return}" +
  "sessionStorage.setItem('resumeSlot',localStorage.getItem('lastSlot-v1')==='2'?'2':'1');location.reload()})()"
);

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>無級冒險書籤工具</title>
<style>
  body{margin:0;background:#fbf3df;color:#2f2116;font:16px/1.7 system-ui,"Microsoft JhengHei","PingFang TC",sans-serif}
  main{max-width:680px;margin:0 auto;padding:24px 16px 48px}
  h1{font-size:24px;margin:0 0 4px}
  h2{font-size:18px;margin:32px 0 8px;border-left:4px solid #c0672a;padding-left:10px}
  p,li{margin:6px 0}
  .card{background:#fff;border:1px solid #d9c59a;border-radius:12px;padding:14px 16px;margin:12px 0}
  .card h3{margin:0 0 4px;font-size:16px}
  .card p{font-size:14px;color:#6b5540}
  .bm{display:inline-block;background:#c0672a;color:#fff;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:999px;margin:6px 8px 6px 0;cursor:grab}
  button{font:inherit;font-weight:700;background:#f0e2bd;color:#2f2116;border:1px solid #a58a62;border-radius:8px;padding:7px 14px;cursor:pointer}
  textarea{width:100%;box-sizing:border-box;height:70px;font:12px/1.4 ui-monospace,Consolas,monospace;border:1px solid #a58a62;border-radius:8px;padding:8px;margin-top:8px;word-break:break-all}
  code{background:#efe2c0;padding:1px 6px;border-radius:4px}
  small{color:#8a7458}
  .note{background:#fff1c9;border:1px solid #e0b34a;border-radius:12px;padding:12px 16px;margin:16px 0;font-size:15px}
</style>
</head>
<body>
<main>
  <h1>無級冒險書籤工具</h1>
  <p><small>適用網站：wuji-adventure.pages.dev　打包時間：${new Date().toISOString().slice(0, 10)}</small></p>

  <div class="note">
    這一頁只負責<b>安裝書籤</b>，在這裡點按鈕不會改到遊戲。<br>
    用法是：裝好書籤 → 打開遊戲 → 在遊戲頁面點書籤 → 面板出現後選要改的項目 → 按「儲存並重新載入」。
  </div>

  <div class="card">
    <h3>工具面板</h3>
    <p>存檔修改、備份匯出匯入、電腦版進入遊戲，全部在這個面板裡。再點一次書籤可以關閉面板。</p>
    <a class="bm" href="${tool}">無級工具</a>
    <button data-copy="tool">複製書籤程式碼</button>
    <textarea id="tool" readonly>${tool}</textarea>
  </div>

  <div class="card">
    <h3>快速進入（電腦版用）</h3>
    <p>不開面板，直接跳過「請用手機遊玩」畫面，進入上次玩的存檔。</p>
    <a class="bm" href="${unlock}">無級直接進入</a>
    <button data-copy="unlock">複製書籤程式碼</button>
    <textarea id="unlock" readonly>${unlock}</textarea>
  </div>

  <h2>電腦安裝</h2>
  <ol>
    <li>按 <code>Ctrl + Shift + B</code> 顯示書籤列。</li>
    <li>把上面的橘色按鈕拖到書籤列。</li>
    <li>打開遊戲網頁後，點書籤列上的書籤。</li>
  </ol>

  <h2>手機安裝</h2>
  <ol>
    <li>按「複製書籤程式碼」。</li>
    <li>隨便把一個網頁加入書籤，然後編輯那個書籤：名稱改成「無級工具」，網址整段刪掉後貼上剛剛複製的程式碼。</li>
    <li>打開遊戲網頁。<b>Chrome</b>：點網址列，輸入「無級工具」，從下方建議清單點選那個書籤。<b>Safari</b>：直接從書籤清單點選。</li>
  </ol>
  <p><small>手機 Chrome 一定要從網址列的建議清單點選，從書籤頁面點選不會執行。</small></p>
</main>
<script>
  document.querySelectorAll('.bm').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); alert('請把這個按鈕拖到書籤列，然後到遊戲頁面再點書籤。'); });
  });
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.dataset.copy);
      var done = function () { b.textContent = '已複製'; setTimeout(function () { b.textContent = '複製書籤程式碼'; }, 1500); };
      var fallback = function () { el.focus(); el.select(); document.execCommand('copy'); done(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value).then(done, fallback); else fallback();
    });
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'install.html'), html);
console.log('工具書籤長度：' + tool.length + ' 字元');
