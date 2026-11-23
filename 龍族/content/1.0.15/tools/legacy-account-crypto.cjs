// 專用背景程序：使用舊設定檔的加密金鑰，結果僅經 pipe 交回主程序。
// 不開視窗、不連網、不把解密後的密碼寫到檔案或紀錄。
const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const profile = process.argv.find(a => a.startsWith('--legacy-profile=')).slice('--legacy-profile='.length);
const encrypt = process.argv.includes('--encrypt');
const prefix = path.join(os.tmpdir(), 'raja-account-crypto-');
const scratch = fs.mkdtempSync(prefix);
fs.copyFileSync(path.join(profile, 'Local State'), path.join(scratch, 'Local State'));
app.setPath('userData', scratch);
app.whenReady().then(async () => {
  try {
    let rows;
    if (encrypt) {
      const input = fs.readFileSync(0, 'utf8');
      rows = JSON.parse(input).map(({ password, ...account }) => ({ ...account, ...(password ? {passEnc:safeStorage.encryptString(password).toString('base64')} : {}) }));
    } else {
      rows = JSON.parse(fs.readFileSync(path.join(profile, 'accounts.json'), 'utf8')).map(({ passEnc, ...account }) => ({ ...account, password:passEnc ? safeStorage.decryptString(Buffer.from(passEnc,'base64')) : '' }));
    }
    process.stdout.write(JSON.stringify(rows));
  } catch (e) {
    process.stderr.write(`無法轉換舊帳號的加密資料（${e.code || e.name}）`);
    app.exit(1); return;
  } finally { app.quit(); }
});
app.on('quit', () => {
  const resolved = path.resolve(scratch);
  if (resolved.startsWith(path.resolve(prefix))) {
    try { fs.rmSync(resolved, {recursive:true,force:true}); } catch {}
  }
});
