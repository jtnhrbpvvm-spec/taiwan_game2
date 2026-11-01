

// ════════════════════════════════════════════════
//  SIG1 簽章系統（與遊戲完全對齊）
// ════════════════════════════════════════════════
function _seedHash(str){
  str = String(str);
  let h = 1779033703 ^ str.length;
  for(let i = 0; i < str.length; i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

const _SAVE_SALT = 'fb5#9c3a7e1d-save-integrity-salt-do-not-edit#a1b2c3';

function _signSave(s){
  let a = _seedHash(_SAVE_SALT + '::' + s);
  let b = _seedHash(s + '::' + _SAVE_SALT + '::' + a);
  return (a >>> 0).toString(36) + '.' + (b >>> 0).toString(36) + '.' + (s.length).toString(36);
}

function buildSIG1(payloadStr){
  return 'SIG1:' + _signSave(payloadStr) + ':' + payloadStr;
}

// ════════════════════════════════════════════════
//  SIG2 簽章系統（單機版，HMAC-SHA256，與線上單機互轉工具同編碼模式）
// ════════════════════════════════════════════════
const SIG2_KEY_BYTES = new Uint8Array([
  157, 103, 50, 228, 15, 138, 177, 89, 198, 36,
  119, 211, 65, 174, 149, 11, 94, 248, 19, 108,
  162, 57, 221, 112, 24, 203, 79, 134, 241, 45,
  168, 83
]);

// "IdleLineage.Desktop.Save.SIG2\0" 的 ASCII Bytes（含結尾 \0）
const SIG2_DOMAIN_BYTES = new Uint8Array([
  73, 100, 108, 101, 76, 105, 110, 101, 97, 103, 101, 46,
  68, 101, 115, 107, 116, 111, 112, 46,
  83, 97, 118, 101, 46,
  83, 73, 71, 50, 0
]);

function _toBase36(num) {
  return Number(num).toString(36);
}

async function signDesktopSave(payloadStr){
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payloadStr);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    SIG2_KEY_BYTES,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const combinedBytes = new Uint8Array(SIG2_DOMAIN_BYTES.length + payloadBytes.length);
  combinedBytes.set(SIG2_DOMAIN_BYTES, 0);
  combinedBytes.set(payloadBytes, SIG2_DOMAIN_BYTES.length);

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, combinedBytes);
  const signatureBytes = new Uint8Array(signatureBuffer);

  let binaryString = '';
  for(let i = 0; i < signatureBytes.length; i++){
    binaryString += String.fromCharCode(signatureBytes[i]);
  }
  const base64 = btoa(binaryString);
  const base64Url = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return 'SIG2:' + base64Url + '.' + _toBase36(payloadStr.length) + ':' + payloadStr;
}

async function verifySIG2(raw){
  if(raw == null) throw new Error('內容為空');
  const str = String(raw).trim();
  if(str.slice(0, 5) !== 'SIG2:') throw new Error('不是 SIG2（單機版）格式');
  const rest = str.slice(5);
  const i = rest.indexOf(':');
  if(i < 0) throw new Error('SIG2 格式毀損（缺少分隔符）');

  const sigPart = rest.slice(0, i);
  const payloadStr = rest.slice(i + 1);

  const expectedSIG2 = await signDesktopSave(payloadStr);
  // ⚠️ bug修正：原本寫 expectedSIG2.indexOf(':') 沒有指定起始位置，
  // 會抓到字串開頭「SIG2:」前綴自己的冒號(第4個字元)，導致slice(5,4)永遠回傳空字串，
  // 使得 verified 永遠是 false（即使存檔完全沒被竄改）。改成從index 5開始找，跳過前綴的冒號。
  const expectedSigPart = expectedSIG2.slice(5, expectedSIG2.indexOf(':', 5));
  const verified = (sigPart === expectedSigPart);

  return { payload: JSON.parse(payloadStr), verified };
}

// 🧬 角色種子（enSeed）：遊戲用它判斷「匯入的存檔是不是跟其他存檔格是同一個角色」
// （13-shop-save.js 的 importSave：enSeed 相同 → 視為重複角色，拒絕匯入），
// 也是強化成敗的決定論種子。格式比照遊戲 startGame() 建立新角色時的寫法：'es' + 隨機碼 + 隨機碼。
function _genEnSeed(){
  const rnd = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return 'es' + rnd() + rnd();
}
function reissueEnSeed(){
  const msg = '右側「換發身分證」按鈕：按下後會產生一組全新、跟任何現有角色都不會撞號的身分證。\n\n' +
              '改完存檔資料後，先按「換發身分證」換一組新的，再按「匯出存檔」，這樣匯入到別的存檔格時就不會再被判定成重複角色。\n\n' +
              '小提醒：身分證同時也是強化機率的決定論種子，換了新的之後，未來的強化成敗結果也會跟著改變。\n\n' +
              '確定要現在換發新的身分證嗎？';
  if(!confirm(msg)) return;
  if(!G.p) G.p = {};
  G.p.enSeed = _genEnSeed();
  setVal('f_enseed', G.p.enSeed);
  toast('🧬 已換發新的身分證，匯出後可視為新角色匯入不同存檔格', 'ok', 4000);
}
// 簽章演算法（_seedHash / _signSave / _SAVE_SALT）完全沒有更動，遊戲端驗證邏輯不受影響。
// 🎲 每次「換發」用的亂數欄位：只用來讓 payload 內容不同，藉此讓 SIG1 雜湊跟著改變。
function _genExportNonce(){
  const padLen = 1 + Math.floor(Math.random() * 16); // 隨機 1~16 字元，讓整份 payload 長度每次不同
  let pad = '';
  for(let i = 0; i < padLen; i++) pad += Math.floor(Math.random() * 36).toString(36);
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + '-' + pad;
}

// 🪪 目前的身分證亂數：資料編輯、一般匯出都不會改變它；
// 只有「換發身分證」（或匯入檔案本身帶有不同亂數）才會更新。
let _sig1Nonce = _genExportNonce();

// 🔶 組出目前存檔的完整基底物件（p/wh/pets/pandoraDiamonds + 頂層 v/ms/ticks/clanState）。
// 有 _rawSave（讀檔進來的既有存檔）時，v/ms/ticks/clanState 直接沿用 _rawSave 本身的值（來自玩家真實存檔，不能亂改）；
// 沒有 _rawSave（全新角色/clearAll 之後）時，才補上 G.ms/G.ticks/G.clanState 這些新角色預設值。
// ⚠️ 這是本檔案唯一一處組裝存檔基底的地方，_computeCurrentSig1/exportJson/exportSIG2/showSig1SourceModal/syncJsonEditor
// 全部呼叫這裡，不要各自複製一份，否則又會重演「_rawSave===null分支漏改」的舊坑（見PROJECT_HANDOFF §6.5）。
function _buildSaveBase(){
  return _rawSave
    ? Object.assign({}, _rawSave, { p: G.p, wh: G.wh, pets: G.pets, pandoraDiamonds: G.diamonds })
    : { v:2, p: G.p, ms: G.ms, ticks: G.ticks, wh: G.wh, pets: G.pets, pandoraDiamonds: G.diamonds, clanState: G.clanState };
}

// 依「目前面板資料 + 目前身分證亂數」即時算出身分證，供顯示與匯出共用。
function _computeCurrentSig1(){
  const base = _buildSaveBase();
  const withNonce = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  return buildSIG1(JSON.stringify(withNonce));
}
// 只取簽章本身（不含 SIG1: 前綴、也不含後面的 JSON payload）——顯示用，僅供辨識，不影響實際簽章與匯出內容
function _sig1DisplayOnly(signed){
  const first  = signed.indexOf(':');
  if(first < 0) return signed;
  const second = signed.indexOf(':', first + 1);
  return second < 0 ? signed.slice(first + 1) : signed.slice(first + 1, second);
}
function refreshSig1Display(){
  const el = document.getElementById('f_sig1');
  if(el) el.value = _sig1DisplayOnly(_computeCurrentSig1());
}

// 🆔 換發身分證：依規則（新亂數）產生一組新的身分證，資料本身不受影響；
// 之後按「匯出存檔」就會帶著這組新身分證匯出。
function reissueSig1(){
  _sig1Nonce = _genExportNonce();
  refreshSig1Display();
  toast('🆔 已換發新身分證', 'ok');
}

function parseSIG1(raw){
  if(raw == null) throw new Error('內容為空');
  const str = String(raw).trim();
  if(str.slice(0, 5) === 'SIG1:'){
    const rest = str.slice(5);
    const i    = rest.indexOf(':');
    if(i < 0) throw new Error('SIG1 格式毀損（缺少分隔符）');
    const sig     = rest.slice(0, i);
    const payload = rest.slice(i + 1);
    if(_signSave(payload) !== sig){
      toast('⚠️ 簽章不符，資料可能已被修改，仍嘗試載入', 'warn', 4000);
    }
    return JSON.parse(payload);
  }
  return JSON.parse(str);
}