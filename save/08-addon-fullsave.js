

// ════════════════════════════════════════════════
//  🧩 加掛版完整存檔（一次備份多個 localStorage key，含最多 16 個角色存檔位）
//  檔案格式：{ format:'idle-lineage-full', schema, exportedAt, keyCount, keys:{ localStorageKey: 原始值, ... } }
//  其中角色存檔位 key 樣式為 lineage_idle_save_<N>，值為 'LZ1:'+壓縮(SIG1字串)（或舊明文 SIG1）。
//  解壓後即為與網頁版完全相同的 SIG1 存檔，可直接沿用 parseSIG1/buildSIG1/_buildSaveBase。
//  其餘非角色 key（寵物、圖鑑、血盟、傭兵…）原封不動保留，匯出時一併寫回。
// ════════════════════════════════════════════════
let _jjBackup = null;      // 匯入的完整加掛版物件（含 keys）
let _jjCurrentSlot = null; // 目前正在編輯的角色存檔位 key，例如 'lineage_idle_save_3'

const _JJ_SAVE_KEY_RE = /^lineage_idle_save_(\d+)$/;

function _jjEsc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// 從存檔位 key 取角色編號（用於下拉選單顯示 #N）
function _jjSlotNumber(key){
  const m = _JJ_SAVE_KEY_RE.exec(key);
  return m ? parseInt(m[1], 10) : null;
}

// 解壓某存檔位的原始 localStorage 值 → SIG1 字串（相容舊明文，無 'LZ1:' 前綴→原樣回傳）
function _jjDecodeSlotRaw(raw){
  if(raw == null) return null;
  const s = String(raw);
  if(s.slice(0, 4) === 'LZ1:'){
    return LZString.decompressFromUTF16(s.slice(4));
  }
  return s;
}

// 把 SIG1 字串壓回加掛版存檔位需要的 localStorage 值（'LZ1:'+UTF16；壓縮失敗退回明文）
function _jjEncodeSlotRaw(sig1Str){
  try { return 'LZ1:' + LZString.compressToUTF16(sig1Str); }
  catch(e){ return sig1Str; }
}

// 靜默解析 SIG1 payload（僅供下拉選單預覽，不驗簽、不跳 toast）
function _jjParseSlotSilent(sig1Str){
  if(sig1Str == null) return null;
  const str = String(sig1Str).trim();
  if(str.slice(0, 5) === 'SIG1:'){
    const rest = str.slice(5);
    const i = rest.indexOf(':');
    if(i < 0) return null;
    return JSON.parse(rest.slice(i + 1));
  }
  return JSON.parse(str);
}

// 列出加掛版內所有角色存檔位（含暱稱/職業/等級），依編號排序
function _jjListSaveSlots(){
  if(!_jjBackup || !_jjBackup.keys) return [];
  const out = [];
  for(const key of Object.keys(_jjBackup.keys)){
    const num = _jjSlotNumber(key);
    if(num == null) continue;
    const info = { key, num, name:'', cls:'', lv:1, valid:false };
    try{
      const parsed = _jjParseSlotSilent(_jjDecodeSlotRaw(_jjBackup.keys[key]));
      const p = parsed && parsed.p;
      if(p){
        info.name  = p.name || '';
        info.cls   = p.cls  || '';
        info.lv    = p.lv   || 1;
        info.valid = true;
      }
    }catch(e){ /* 空存檔位或毀損，仍列出讓使用者知道 */ }
    out.push(info);
  }
  out.sort((a, b) => a.num - b.num);
  return out;
}

// 重建下拉選單：#編號 暱稱｜職業 Lv.等級
function _rebuildJJSlotSelect(){
  const sel = document.getElementById('jjSlotSelect');
  if(!sel) return;
  const slots = _jjListSaveSlots();
  if(!_jjBackup || slots.length === 0){
    sel.style.display = 'none';
    sel.innerHTML = '<option value="">— 選擇角色 —</option>';
    _jjSetStatus('');
    return;
  }
  sel.style.display = '';
  const opts = ['<option value="">— 選擇角色 —</option>'];
  for(const s of slots){
    const nick     = s.name ? s.name : '（未命名）';
    const clsLabel = s.valid ? (s.cls ? _clsLabel(s.cls) : '（無職業）') : '（空存檔位）';
    const lvLabel  = s.valid ? ('Lv.' + s.lv) : '';
    const label    = `#${s.num} ${nick}｜${clsLabel} ${lvLabel}`.trim();
    const selAttr  = (s.key === _jjCurrentSlot) ? ' selected' : '';
    opts.push(`<option value="${_jjEsc(s.key)}"${selAttr}>${_jjEsc(label)}</option>`);
  }
  sel.innerHTML = opts.join('');
}

function _jjSetStatus(msg){
  const el = document.getElementById('jjStatusLabel');
  if(!el) return;
  if(typeof msg === 'string'){ el.textContent = msg; return; }
  if(_jjCurrentSlot){
    const num   = _jjSlotNumber(_jjCurrentSlot);
    const total = _jjListSaveSlots().length;
    el.textContent = `目前編輯：加掛版 #${num}（共 ${total} 角）`;
  } else {
    el.textContent = _jjBackup ? '請從下拉選單選擇要編輯的角色' : '';
  }
}

// 匯入加掛版完整存檔
function importJJFile(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const obj = JSON.parse(e.target.result);
      if(!obj || typeof obj !== 'object' || !obj.keys || typeof obj.keys !== 'object'){
        throw new Error('不是加掛版完整存檔格式（缺少 keys 欄位）');
      }
      _jjBackup = obj;
      _jjCurrentSlot = null;
      _sig2Envelope = null;
      _rebuildJJSlotSelect();
      const slots = _jjListSaveSlots();
      const firstValid = slots.find(s => s.valid) || slots[0];
      if(firstValid){
        _jjLoadSlot(firstValid.key);
      }else{
        toast('⚠️ 加掛版存檔內找不到任何角色存檔位（lineage_idle_save_N）', 'warn', 4500);
      }
      const n = slots.filter(s => s.valid).length;
      toast(`✅ 加掛版完整存檔已匯入（${n} 個角色，${Object.keys(_jjBackup.keys).length} 個資料項）`, 'ok', 3500);
    }catch(err){
      toast('❌ 加掛版解析失敗：' + err.message, 'err', 4500);
    }
  };
  reader.readAsText(file);
  evt.target.value = '';
}

// 下拉選單切換角色
function onJJSlotChange(sel){
  const key = sel.value;
  if(!key){ return; }
  if(_jjCurrentSlot && _jjCurrentSlot !== key){
    _jjSaveCurrentSlot();   // 切換前先把目前編輯內容寫回記憶體（尚未落地成檔）
  }
  _jjLoadSlot(key);
}

// 載入某存檔位到編輯器（與 importJsonFile 相同流程）
function _jjLoadSlot(key){
  if(!_jjBackup || !_jjBackup.keys || !(key in _jjBackup.keys)){
    toast('❌ 找不到該存檔位', 'err'); return;
  }
  let parsed;
  try{
    parsed = parseSIG1(_jjDecodeSlotRaw(_jjBackup.keys[key]));
  }catch(err){
    toast('❌ 該存檔位無法載入（可能是空位或毀損）：' + err.message, 'err', 4500);
    return;
  }
  _rawSave   = parsed;
  G.p        = parsed.p    || G.p;
  G.wh       = parsed.wh   || G.wh;
  G.pets     = parsed.pets || G.pets;
  G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
  _sig1Nonce = parsed._exportNonce || _genExportNonce();
  canonicalizeAttrCodes();
  loadAllUI();
  _jjCurrentSlot = key;
  const sel = document.getElementById('jjSlotSelect');
  if(sel) sel.value = key;
  _rebuildJJSlotSelect();   // 讓剛寫回的舊角色標籤（暱稱/等級）即時更新
  _jjSetStatus();
  const num = _jjSlotNumber(key);
  toast(`✅ 已載入加掛版 #${num} 角色，編輯後切換角色或按「匯出」即會寫回`, 'ok', 3000);
}

// 把目前編輯內容重新簽章 + 壓縮，寫回 _jjBackup 記憶體中的存檔位（不落地成檔）
// ⚠️ 加掛版的角色存檔位「只有」 {v,p,ms,ticks}；倉庫(wh)/寵物(pets)/潘朵拉鑽石/血盟(clanState)
//    都是 16 隻角色「共用」的獨立 localStorage key（fb5_pet_roster / fb5_clan_state_v1 …），
//    不會出現在單一角色存檔位裡。因此這裡「不能」用 _buildSaveBase()（那會把 wh/pets/… 注入單角存檔位、
//    污染共用倉庫格式），只以該存檔位原本的結構為底、僅覆寫玩家資料 p，其餘 v/ms/ticks 原樣保留。
function _jjBuildSlotPayload(){
  const src = (_rawSave && typeof _rawSave === 'object') ? _rawSave : { v:2, ms:G.ms, ticks:G.ticks };
  const out = Object.assign({}, src);            // 完整沿用原存檔位的鍵與鍵位順序
  out.p = G.p;                                    // 玩家資料一定更新
  if('wh'              in src) out.wh = G.wh;     // 只有「原本就存在」的欄位才從編輯器同步回去，
  if('pets'            in src) out.pets = G.pets; //   絕不新增加掛版單角存檔位原本沒有的共用欄位。
  if('pandoraDiamonds' in src) out.pandoraDiamonds = G.diamonds;
  return out;
}

function _jjSaveCurrentSlot(){
  if(!_jjBackup || !_jjCurrentSlot) return false;
  applyAll(true);
  const payload = JSON.stringify(_jjBuildSlotPayload());
  const signed  = buildSIG1(payload);
  _jjBackup.keys[_jjCurrentSlot] = _jjEncodeSlotRaw(signed);
  return true;
}

// 匯出加掛版完整存檔（把所有 key 一併寫回，含目前編輯中的角色）
function exportJJFile(){
  if(!_jjBackup){
    toast('❌ 尚未匯入加掛版完整存檔，請先按「加掛版完整存檔匯入」', 'err', 4500);
    return;
  }
  const text = _jjBuildPackText();
  const blob = new Blob([text], { type:'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  const stamp = new Date().toISOString().replace(/[:T]/g, '').replace(/\..+$/, '').slice(0, 14);
  a.download = 'idle-lineage-backup-' + stamp + '.json';
  a.click();
  URL.revokeObjectURL(url);
  _rebuildJJSlotSelect();
  toast('🧩 加掛版完整存檔已匯出', 'ok');
}

// 組出目前完整加掛版封包的 JSON 字串（先把正在編輯的角色寫回；供「檔案匯出」與「轉移碼上傳」共用）。
function _jjBuildPackText(){
  if(_jjCurrentSlot){ _jjSaveCurrentSlot(); }
  const out = Object.assign({}, _jjBackup, {
    format:     _jjBackup.format || 'idle-lineage-full',
    schema:     _jjBackup.schema || 1,
    exportedAt: new Date().toISOString(),
    keyCount:   Object.keys(_jjBackup.keys).length,
  });
  return JSON.stringify(out);
}