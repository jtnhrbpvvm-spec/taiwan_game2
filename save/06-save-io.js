

// ════════════════════════════════════════════════
//  匯入 / 匯出 / 貼上
// ════════════════════════════════════════════════
function importJsonFile(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const parsed = parseSIG1(e.target.result.trim());
      _rawSave = parsed;
      G.p    = parsed.p    || G.p;
      G.wh   = parsed.wh   || G.wh;
      G.pets = parsed.pets || G.pets;
      G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
      _sig1Nonce = parsed._exportNonce || _genExportNonce();
      canonicalizeAttrCodes();
      loadAllUI();
      toast('✅ 存檔已匯入', 'ok');
    }catch(err){
      toast('❌ 解析失敗：' + err.message, 'err', 4000);
    }
  };
  reader.readAsText(file);
  evt.target.value = '';
}

function exportJson(){
  applyAll(true);
  const base   = _buildSaveBase();
  const out     = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  const payload = JSON.stringify(out);
  const signed  = buildSIG1(payload);
  const prev    = document.getElementById('sig1Preview');
  if(prev) prev.value = signed.slice(0, 300) + '…';
  const fSig1   = document.getElementById('f_sig1');
  if(fSig1) fSig1.value = _sig1DisplayOnly(signed);
  const blob    = new Blob([signed], { type:'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = 'save_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('💾 存檔已匯出', 'ok');
}

// ════════════════════════════════════════════════
//  匯入 / 匯出 單機版存檔（SIG2）
// ════════════════════════════════════════════════
async function importSIG2File(evt){
  const file = evt.target.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const { payload, verified } = await verifySIG2(text.trim());
    if(!verified){
      toast('⚠️ SIG2 簽章不符，資料可能已被修改，仍嘗試載入', 'warn', 4000);
    }
    const save = (payload && payload.save) ? payload.save : payload;
    _rawSave = save;
    _sig2Envelope = { version: payload && payload.version, format: payload && payload.format, schema: payload && payload.schema };
    G.p    = save.p    || G.p;
    G.wh   = save.wh   || G.wh;
    G.pets = save.pets || G.pets;
    G.diamonds = save.pandoraDiamonds ?? save.diamonds ?? save.sharedDiamonds ?? G.diamonds ?? 0;
    _sig1Nonce = save._exportNonce || _genExportNonce();
    canonicalizeAttrCodes();
    loadAllUI();
    toast('✅ 單機版存檔已匯入', 'ok');
  }catch(err){
    toast('❌ 解析失敗：' + err.message, 'err', 4000);
  }
  evt.target.value = '';
}

async function exportSIG2(){
  applyAll(true);
  const base = _buildSaveBase();
  const saveOut = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  const envelope = {
    format: (_sig2Envelope && _sig2Envelope.format) || 'idle-lineage-desktop-save',
    schema: (_sig2Envelope && _sig2Envelope.schema) || 1,
    version: (_sig2Envelope && _sig2Envelope.version) || '3.8.19',
    exportedAt: new Date().toISOString(),
    save: saveOut,
  };
  const payload = JSON.stringify(envelope);
  const signed  = await signDesktopSave(payload);
  const blob    = new Blob([signed], { type:'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = 'save_desktop_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('💾 單機版存檔已匯出', 'ok');
}