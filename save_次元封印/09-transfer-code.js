

// ════════════════════════════════════════════════
//  🔁 加掛版轉移碼（與遊戲 afk-fullsave.js 同一套 Litterbox 管道 + idle-lineage-full 封包）
//  產生：把整包（含編輯後內容）上傳 Litterbox → 取回六碼；玩家到遊戲輸入六碼即可帶回。
//  輸入：以六碼從 Litterbox 抓回整包 → 驗證 → 載入編輯器（等同匯入加掛版檔案）。
//  ⚠️ 六碼大小寫敏感；輸入端自動轉小寫、去空白、可容整串網址；絕不自動把 o↔0 / l↔1 互換重試
//     （那可能抓到別人的存檔）。
// ════════════════════════════════════════════════
const _JJ_LB_UPLOAD = 'https://litterbox.catbox.moe/resources/internals/api.php';
const _JJ_LB_FILE   = 'https://litter.catbox.moe/';
const _JJ_LB_EXPIRY = '24h';
const _JJ_CODE_RE   = /^[a-z0-9]{6}$/;

// 回傳網址形如 https://litter.catbox.moe/4wz0fn.json → 取中間六碼
function _jjCodeFromUrl(url){
  const m = String(url || '').trim().match(/([a-z0-9]{6})\.json\s*$/i);
  return m ? m[1].toLowerCase() : '';
}
// 玩家可能打大寫/帶空白/整串網址貼進來 → 一律正規化成純六碼字串
function _jjNormalizeCode(s){
  let t = String(s || '').trim().toLowerCase();
  if(t.indexOf('/') >= 0) t = t.slice(t.lastIndexOf('/') + 1);
  return t.replace(/\.json$/, '').trim();
}
function _jjCodeNote(msg, bad){
  const el = document.getElementById('jjCodeNote');
  if(!el) return;
  el.style.color = bad ? 'var(--red)' : 'var(--green)';
  el.textContent = msg || '';
}
function _jjNetErrMsg(e){
  if(typeof navigator !== 'undefined' && navigator.onLine === false) return '沒有網路連線。';
  if(e instanceof TypeError) return '連不上轉移服務，你的 DNS 或廣告封鎖可能把它擋掉了。';
  return null;
}

function openJJCodeModal(){
  document.getElementById('jjCodeModal').classList.add('show');
  _jjCodeNote('');
}
function closeJJCodeModal(){
  document.getElementById('jjCodeModal').classList.remove('show');
}
// 「📥 輸入轉移碼」：開窗並聚焦輸入框
function openJJCodeImport(){
  openJJCodeModal();
  const box = document.getElementById('jjCodeBox');
  if(box) box.style.display = 'none';
  setTimeout(() => { const i = document.getElementById('jjCodeInput'); if(i) i.focus(); }, 50);
}
// 「🔑 產生轉移碼」：開窗並直接上傳
function openJJCodeGenerate(){
  if(!_jjBackup){
    toast('❌ 尚未匯入加掛版完整存檔，無法產生轉移碼', 'err', 4500);
    return;
  }
  openJJCodeModal();
  doJJGenerate();
}

// 上傳整包 → 取回六碼
function _jjUploadPack(){
  let text;
  try { text = _jjBuildPackText(); }
  catch(e){ return Promise.reject(new Error('打包失敗：' + (e && e.message || e))); }
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('time', _JJ_LB_EXPIRY);
  fd.append('fileToUpload', new Blob([text], { type:'application/json' }), 'save.json');
  return fetch(_JJ_LB_UPLOAD, { method:'POST', body: fd })
    .then(r => { if(!r.ok) throw new Error('上傳失敗（' + r.status + '）'); return r.text(); })
    .then(url => { const code = _jjCodeFromUrl(url); if(!code) throw new Error('上傳結果看不懂'); return code; });
}
// 以六碼抓回整包
function _jjDownloadByCode(code){
  return fetch(_JJ_LB_FILE + code + '.json', { cache:'no-store' })
    .then(r => { if(r.status === 404) throw new Error('NOTFOUND'); if(!r.ok) throw new Error('讀取失敗（' + r.status + '）'); return r.text(); });
}

function doJJGenerate(){
  if(!_jjBackup){ _jjCodeNote('尚未匯入加掛版完整存檔。', true); return; }
  const btn = document.getElementById('jjGenBtn');
  if(btn){ btn.disabled = true; btn.textContent = '上傳中…'; }
  _jjCodeNote('上傳中…請不要關掉頁面。');
  _jjUploadPack().then(code => {
    const box = document.getElementById('jjCodeBox');
    const el  = document.getElementById('jjCodeText');
    if(el)  el.textContent = code;
    if(box) box.style.display = 'flex';
    _jjCodeNote('✅ 到遊戲的「完整資料備份與還原 → 用轉移碼搬家」輸入這六碼即可帶回（24 小時內有效）。');
    _rebuildJJSlotSelect();
  }).catch(e => {
    _jjCodeNote('❌ ' + (_jjNetErrMsg(e) || ((e && e.message || '產生轉移碼失敗') + '。')) + ' 可改用「加掛版完整存檔匯出」存成檔案。', true);
  }).then(() => {
    if(btn){ btn.disabled = false; btn.textContent = '🔑 產生轉移碼'; }
  });
}

function doJJUseCode(){
  const input = document.getElementById('jjCodeInput');
  const code  = _jjNormalizeCode(input && input.value);
  if(!_JJ_CODE_RE.test(code)){ _jjCodeNote('請輸入六碼（英文小寫或數字）。', true); return; }
  const btn = document.getElementById('jjUseBtn');
  if(btn) btn.disabled = true;
  _jjCodeNote('讀取中…');
  _jjDownloadByCode(code).then(text => {
    let obj;
    try { obj = JSON.parse(text); } catch(e){ obj = null; }
    if(!obj || typeof obj !== 'object' || !obj.keys || typeof obj.keys !== 'object'){
      _jjCodeNote('抓回來的內容不是加掛版完整存檔。', true); return;
    }
    _jjBackup = obj;
    _jjCurrentSlot = null;
    _sig2Envelope = null;
    _rebuildJJSlotSelect();
    const slots = _jjListSaveSlots();
    const firstValid = slots.find(s => s.valid) || slots[0];
    if(firstValid){ _jjLoadSlot(firstValid.key); }
    const n = slots.filter(s => s.valid).length;
    _jjCodeNote('✅ 已載入（' + n + ' 個角色）。可編輯後再產生新的轉移碼帶回遊戲。');
    toast('✅ 轉移碼已載入加掛版存檔（' + n + ' 個角色）', 'ok', 3500);
  }).catch(e => {
    if(e && e.message === 'NOTFOUND') _jjCodeNote('❌ 找不到這組轉移碼。可能打錯了（注意 0 和 o、1 和 l），或已超過 24 小時。', true);
    else _jjCodeNote('❌ ' + (_jjNetErrMsg(e) || ((e && e.message || '讀取失敗') + '。')), true);
  }).then(() => { if(btn) btn.disabled = false; });
}

function copyJJCode(){
  const t = (document.getElementById('jjCodeText') || {}).textContent || '';
  if(!t){ return; }
  const done = () => _jjCodeNote('✅ 已複製轉移碼 ' + t + '。');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(done).catch(() => {
      const el = document.getElementById('jjCodeText');
      if(el){ try{ const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); _jjCodeNote('請長按或按 Ctrl+C 複製選取的六碼。'); }catch(e){ _jjCodeNote('請手動抄下六碼。', true); } }
    });
  } else {
    const el = document.getElementById('jjCodeText');
    if(el){ try{ const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); _jjCodeNote('請長按或按 Ctrl+C 複製選取的六碼。'); }catch(e){ _jjCodeNote('請手動抄下六碼。', true); } }
  }
}