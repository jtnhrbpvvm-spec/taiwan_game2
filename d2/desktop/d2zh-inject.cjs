// D2ZH-INJECT：D2 Survivors 安裝版（桌面版）繁體中文。由 app.asar 裡 main.cjs 第一行載入（install.ps1 加上去的）。
// 遊戲頁面（app://game/）和設定頁（app://setup/：找 Diablo II、解壓縮、遊戲改版後更新檔案）
// 每次載入完成，就把 d2_zh.js（跟書籤同一份）注入頁面。
// 更新：遊戲會擋掉頁面的網路連線，所以由這裡（主程序）向 GitHub Pages 下載新版：
//   ・每次開遊戲在背景自動檢查（資料夾裡有 no-auto-update 檔就不自動）
//   ・「書籤修改」面板的「檢查更新」按鈕：頁面 console.log('__D2ZH__:update') → 這裡下載 → 把結果回傳給頁面
'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;
const BASE = process.env.D2ZH_UPDATE_BASE || 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/d2/';   // 環境變數只給測試用
const http = require('http');
const LOG = path.join(DIR, 'last-run.log');
// 要更新的檔案；下載後先檢查內容像不像，不對就保留原本的
const FILES = [
  { name: 'd2_zh.js', url: BASE + 'd2_zh.js', ok: text => text.startsWith('void (function D2ZH()') && text.includes('D2ZH_FIX'), applies: 'reload' },
  { name: 'd2zh-inject.cjs', url: BASE + 'desktop/d2zh-inject.cjs', ok: text => text.includes('D2ZH-INJECT') && text.includes('web-contents-created'), applies: 'restart' },
  { name: 'install.ps1', url: BASE + 'desktop/install.ps1', ok: text => text.includes('D2ZH-PATCH-v1') && text.includes('Patch-Asar'), applies: 'restart' },
];
let lastCheck = null;   // 最近一次檢查的結果（給面板顯示）
let checking = null;

function log(message) {
  try { fs.appendFileSync(LOG, `${new Date().toISOString()} ${message}\n`); } catch (_) { /* 記錄失敗不影響遊戲 */ }
}

function download(url) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('http:') ? http : https).get(`${url}?v=${Date.now()}`, { timeout: 15000, headers: { 'Cache-Control': 'no-cache' } }, res => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('連線逾時')));
    req.on('error', reject);
  });
}

// 下載全部檔案，有變的才換掉。回傳 { changed: [...], applies: 'reload'|'restart'|null, errors: [...] }
function checkForUpdates(reason) {
  if (checking) return checking;
  checking = (async () => {
    const result = { at: Date.now(), reason, changed: [], errors: [], applies: null };
    for (const file of FILES) {
      try {
        const body = await download(file.url);
        const text = body.toString('utf8').replace(/^﻿/, '');
        if (!file.ok(text)) throw new Error('下載的內容不完整');
        const local = path.join(DIR, file.name);
        if (fs.existsSync(local) && fs.readFileSync(local).equals(body)) continue;
        fs.writeFileSync(local + '.tmp', body);
        fs.renameSync(local + '.tmp', local);
        result.changed.push(file.name);
        if (file.applies === 'reload' && result.applies !== 'restart') result.applies = 'reload';
        if (file.applies === 'restart') result.applies = 'restart';
      } catch (e) {
        result.errors.push(`${file.name}：${e.message}`);
      }
    }
    log(`update (${reason}): changed [${result.changed.join(', ')}] errors [${result.errors.join('; ')}]`);
    lastCheck = result;
    return result;
  })().finally(() => { checking = null; });
  return checking;
}

function info() {
  let fileTime = null;
  try { fileTime = fs.statSync(path.join(DIR, 'd2_zh.js')).mtimeMs; } catch (_) { /* 沒有檔案 */ }
  return { updater: 1, fileTime, lastCheck, autoUpdate: !fs.existsSync(path.join(DIR, 'no-auto-update')) };
}

app.whenReady().then(() => { if (info().autoUpdate) checkForUpdates('auto').catch(() => {}); });

app.on('web-contents-created', (_event, contents) => {
  contents.on('did-finish-load', () => {
    if (!/^app:\/\/(game|setup)\//.test(contents.getURL())) return;
    let code;
    try { code = fs.readFileSync(path.join(DIR, 'd2_zh.js'), 'utf8'); } catch (e) { log(`inject: ${e.message}`); return; }
    contents.executeJavaScript(`window.__D2ZH_DESKTOP = ${JSON.stringify(info())};\n${code}\n;0`, true)
      .then(() => log(`inject: ok ${contents.getURL()}`))
      .catch(e => log(`inject: ${e && e.message}`));
  });
  // 面板的「檢查更新」按鈕（Electron 35 以後事件參數是一個物件，舊版是 (event, level, message)）
  contents.on('console-message', (event, _level, message) => {
    const text = typeof message === 'string' ? message : event && event.message;
    if (text !== '__D2ZH__:update' || !/^app:\/\/game\//.test(contents.getURL())) return;
    checkForUpdates('button')
      .then(result => contents.executeJavaScript(`window.__d2zhUpdateDone && window.__d2zhUpdateDone(${JSON.stringify({ ...result, info: info() })});0`, true))
      .catch(e => log(`update button: ${e && e.message}`));
  });
});
log(`loaded, app ${app.getVersion()}`);
