// D2 Survivors 安裝版（桌面版）繁體中文：由 app.asar 裡 main.cjs 第一行載入（install.ps1 加上去的）。
// 遊戲頁面（app://game/）和設定頁（app://setup/：找 Diablo II、解壓縮、遊戲改版後更新檔案）
// 每次載入完成，就把 d2_zh.js（跟書籤同一份）注入頁面。
// 遊戲本身會擋掉頁面的網路連線，所以中文檔放在這個資料夾；啟動時在背景向 GitHub Pages 抓新版，下次開遊戲生效。
'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;
const LOCAL = path.join(DIR, 'd2_zh.js');
const REMOTE = 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/d2/d2_zh.js';
const LOG = path.join(DIR, 'last-run.log');

function log(message) {
  try { fs.appendFileSync(LOG, `${new Date().toISOString()} ${message}\n`); } catch (_) { /* 記錄失敗不影響遊戲 */ }
}

function refresh() {
  if (fs.existsSync(path.join(DIR, 'no-auto-update'))) return;
  const req = https.get(`${REMOTE}?v=${Date.now()}`, { timeout: 10000 }, res => {
    if (res.statusCode !== 200) { res.resume(); log(`update: HTTP ${res.statusCode}`); return; }
    let body = '';
    res.setEncoding('utf8');
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      // 只接受看起來完整的書籤檔
      if (!body.startsWith('void (function D2ZH()') || !body.includes('D2ZH_FIX')) { log('update: unexpected content, kept local copy'); return; }
      try {
        if (fs.existsSync(LOCAL) && fs.readFileSync(LOCAL, 'utf8') === body) return;
        fs.writeFileSync(LOCAL + '.tmp', body);
        fs.renameSync(LOCAL + '.tmp', LOCAL);
        log('update: d2_zh.js updated (used from next launch)');
      } catch (e) { log(`update: ${e.message}`); }
    });
  });
  req.on('timeout', () => req.destroy(new Error('timeout')));
  req.on('error', e => log(`update: ${e.message}`));
}

app.whenReady().then(refresh);

app.on('web-contents-created', (_event, contents) => {
  contents.on('did-finish-load', () => {
    if (!/^app:\/\/(game|setup)\//.test(contents.getURL())) return;
    let code;
    try { code = fs.readFileSync(LOCAL, 'utf8'); } catch (e) { log(`inject: ${e.message}`); return; }
    contents.executeJavaScript(`window.__D2ZH_DESKTOP = true;\n${code}\n;0`, true)
      .then(() => log(`inject: ok ${contents.getURL()}`))
      .catch(e => log(`inject: ${e && e.message}`));
  });
});
log(`loaded, app ${app.getVersion()}`);
