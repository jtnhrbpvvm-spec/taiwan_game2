

// ════════════════════════════════════════════════
//  顯示目前存檔的 SIG1 原始碼（供手動複製使用）
// ════════════════════════════════════════════════
function showSig1SourceModal(){
  applyAll(true);
  const base   = _buildSaveBase();
  const out     = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  const payload = JSON.stringify(out);
  const signed  = buildSIG1(payload);
  const fSig1   = document.getElementById('f_sig1');
  if(fSig1) fSig1.value = _sig1DisplayOnly(signed);
  const el = document.getElementById('sig1SourceOutput');
  if(el) el.value = signed;
  document.getElementById('pasteModal').classList.add('show');
}

function copySig1Source(){
  const el = document.getElementById('sig1SourceOutput');
  if(!el || !el.value){ toast('內容為空', 'err'); return; }
  el.focus();
  el.select();
  el.setSelectionRange(0, 99999);
  const done = () => toast('📋 已複製到剪貼簿', 'ok');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(el.value).then(done).catch(() => {
      try{ document.execCommand('copy'); done(); }catch(e){ toast('❌ 複製失敗，請手動選取複製', 'err'); }
    });
  } else {
    try{ document.execCommand('copy'); done(); }catch(e){ toast('❌ 複製失敗，請手動選取複製', 'err'); }
  }
}

function openPasteModal(){
  document.getElementById('pasteModal').classList.add('show');
}
function closePasteModal(){
  document.getElementById('pasteModal').classList.remove('show');
}

function loadFromPaste(){
  const raw = document.getElementById('pasteInput').value.trim();
  if(!raw){ toast('內容為空', 'err'); return; }
  try{
    const parsed = parseSIG1(raw);
    _rawSave = parsed;
    G.p    = parsed.p    || G.p;
    G.wh   = parsed.wh   || G.wh;
    G.pets = parsed.pets || G.pets;
    G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
    _sig1Nonce = parsed._exportNonce || _genExportNonce();
    canonicalizeAttrCodes();
    loadAllUI();
    closePasteModal();
    document.getElementById('pasteInput').value = '';
    toast('✅ 存檔已載入', 'ok');
  }catch(e){
    toast('❌ 解析失敗：' + e.message, 'err', 4000);
  }
}

// ════════════════════════════════════════════════
//  JSON 面板
// ════════════════════════════════════════════════
function syncJsonEditor(){
  applyAll(true);
  const out = _buildSaveBase();
  const el = document.getElementById('jsonEditor');
  if(el) el.value = JSON.stringify(out, null, 2);
}

function applyJsonEditor(){
  try{
    const parsed = JSON.parse(document.getElementById('jsonEditor').value.trim());
    _rawSave = parsed;
    G.p    = parsed.p    || G.p;
    G.wh   = parsed.wh   || G.wh;
    G.pets = parsed.pets || G.pets;
    G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
    _sig1Nonce = parsed._exportNonce || _genExportNonce();
    loadAllUI();
    toast('✅ JSON 已套用', 'ok');
  }catch(e){
    toast('❌ JSON 格式錯誤：' + e.message, 'err', 4000);
  }
}

function formatJson(){
  try{
    const el = document.getElementById('jsonEditor');
    el.value = JSON.stringify(JSON.parse(el.value), null, 2);
    toast('已格式化', 'info');
  }catch(e){
    toast('JSON 格式錯誤', 'err');
  }
}