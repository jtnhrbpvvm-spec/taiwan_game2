// ════════════════════════════════════════════════
//  🕳️ 打洞（僅可修改身上穿著的裝備）— 開孔規則複製自遊戲 01-drops-config.js 的
//  equipSocketLimit：武器/盔甲最多6孔，頭盔/盾牌最多4孔，手套/靴子/披風最多2孔，其餘不可開孔。
// ════════════════════════════════════════════════
function equipSocketLimit(def){
  if(!def || def.relic || def.isArrow || def.doll || def.virtual || def.remains) return 0;
  if(def.type === 'wpn') return 6;
  if(def.type !== 'arm') return 0;
  if(def.slot === 'armor') return 6;
  if(def.slot === 'helm' || def.slot === 'shield') return 4;
  if(def.slot === 'gloves' || def.slot === 'boots' || def.slot === 'cloak') return 2;
  return 0;
}

function socketCurrentCount(it){
  // 目前開孔數 = item.sockets 陣列長度（遊戲內每開一次孔，陣列就多一格）
  if(!it || !it.id) return 0;
  const def = ITEM_DB[it.id];
  const cap = equipSocketLimit(def);
  if(!cap) return 0;
  const arr = Array.isArray(it.sockets) ? it.sockets : [];
  return Math.max(0, Math.min(cap, arr.length));
}

function socketMaxSetting(it){
  // 最大孔數 = item.socketMax，玩家可自行調整；未設定時預設等於本裝備類型上限
  if(!it || !it.id) return 0;
  const def = ITEM_DB[it.id];
  const cap = equipSocketLimit(def);
  if(!cap) return 0;
  const raw = Number(it.socketMax);
  const val = (Number.isFinite(raw) && raw > 0) ? Math.floor(raw) : cap;
  return Math.max(0, Math.min(cap, val));
}

function socketCountText(it){
  if(!it || !it.id) return '—';
  const def = ITEM_DB[it.id];
  const cap = equipSocketLimit(def);
  if(!cap) return '—';
  const current = socketCurrentCount(it);
  const max = socketMaxSetting(it);
  return `目前${current}孔/最大${max}孔（本裝備最多只能有${cap}孔）`;
}

let _gsSlot = '';

function growthSocketEligibleSlots(){
  if(!G.p.eq) return [];
  return Object.keys(G.p.eq).filter(k=>{
    const it = G.p.eq[k];
    if(!it || !it.id) return false;
    const def = ITEM_DB[it.id];
    return equipSocketLimit(def) > 0;
  });
}

function renderGrowthSocketPanel(){
  const sel = document.getElementById('growthSocketSlotSelect');
  if(!sel) return;
  const prev = sel.value || _gsSlot;
  const slots = growthSocketEligibleSlots();
  if(!slots.length){
    sel.innerHTML = '<option value="">（身上目前沒有可開孔的裝備）</option>';
    _gsSlot = '';
    growthSocketRenderOptions();
    growthSocketRenderPreview();
    return;
  }
  sel.innerHTML = slots.map(k=>{
    const it = G.p.eq[k];
    return `<option value="${k}">${gaEsc(EQ_SLOT_LABEL[k]||k)}・${gaEsc(getItemName(it.id))}</option>`;
  }).join('');
  if(prev && slots.includes(prev)) sel.value = prev;
  else sel.value = slots[0];
  growthSocketSlotChange();
}

function growthSocketSlotChange(){
  const sel = document.getElementById('growthSocketSlotSelect');
  _gsSlot = sel ? sel.value : '';
  growthSocketRenderOptions();
  growthSocketRenderPreview();
}

function growthSocketRenderOptions(){
  const curSel = document.getElementById('growthSocketCurrentSelect');
  const maxSel = document.getElementById('growthSocketMaxSelect');
  const capSpan = document.getElementById('growthSocketCap');
  if(!curSel || !maxSel) return;
  if(!_gsSlot){
    curSel.innerHTML = '';
    maxSel.innerHTML = '';
    if(capSpan) capSpan.textContent = '';
    return;
  }
  const it = G.p.eq[_gsSlot];
  const def = ITEM_DB[it.id];
  const cap = equipSocketLimit(def);
  const current = socketCurrentCount(it);
  const max = socketMaxSetting(it);
  let maxOpts = '';
  for(let n=0;n<=cap;n++) maxOpts += `<option value="${n}" ${n===max?'selected':''}>${n} 孔</option>`;
  maxSel.innerHTML = maxOpts;
  let curOpts = '';
  for(let n=0;n<=max;n++) curOpts += `<option value="${n}" ${n===Math.min(current,max)?'selected':''}>${n} 孔</option>`;
  curSel.innerHTML = curOpts;
  if(capSpan) capSpan.textContent = `本裝備最多只能有 ${cap} 孔`;
}

function growthSocketMaxChange(){
  // 調整最大孔數時，重新產生「目前開孔數」選單（不能超過新的最大值）
  const curSel = document.getElementById('growthSocketCurrentSelect');
  const maxSel = document.getElementById('growthSocketMaxSelect');
  if(!curSel || !maxSel || !_gsSlot) return;
  const max = Math.max(0, parseInt(maxSel.value,10)||0);
  const prevCur = Math.min(parseInt(curSel.value,10)||0, max);
  let curOpts = '';
  for(let n=0;n<=max;n++) curOpts += `<option value="${n}" ${n===prevCur?'selected':''}>${n} 孔</option>`;
  curSel.innerHTML = curOpts;
  growthSocketRenderPreview();
}

function growthSocketCurrentChange(){
  growthSocketRenderPreview();
}

function growthSocketRenderPreview(){
  const box = document.getElementById('growthSocketPreview');
  if(!box) return;
  if(!_gsSlot){ box.innerHTML = '<span style="color:var(--text3)">尚未選擇裝備。</span>'; return; }
  const it = G.p.eq[_gsSlot];
  const curSel = document.getElementById('growthSocketCurrentSelect');
  const maxSel = document.getElementById('growthSocketMaxSelect');
  const targetCur = curSel ? (parseInt(curSel.value,10)||0) : socketCurrentCount(it);
  const targetMax = maxSel ? (parseInt(maxSel.value,10)||0) : socketMaxSetting(it);
  box.innerHTML = `<b style="color:var(--accent2)">${gaEsc(getItemName(it.id))}</b>：${gaEsc(socketCountText(it))} → 套用後 目前${targetCur}孔/最大${targetMax}孔`;
}

function growthSocketApply(){
  if(!_gsSlot){ toast('請先選擇要編輯的裝備', 'err'); return; }
  const it = G.p.eq[_gsSlot];
  if(!it){ toast('該部位目前沒有裝備', 'err'); return; }
  const def = ITEM_DB[it.id];
  const cap = equipSocketLimit(def);
  const curSel = document.getElementById('growthSocketCurrentSelect');
  const maxSel = document.getElementById('growthSocketMaxSelect');
  let max = maxSel ? (parseInt(maxSel.value,10)||0) : 0;
  max = Math.max(0, Math.min(cap, max));
  let cur = curSel ? (parseInt(curSel.value,10)||0) : 0;
  cur = Math.max(0, Math.min(max, cur));
  it.socketMax = max;
  const sockets = Array.isArray(it.sockets) ? it.sockets.slice(0, cur) : [];
  while(sockets.length < cur) sockets.push(null);
  it.sockets = sockets;
  toast(`已將「${getItemName(it.id)}」設為 目前${cur}孔/最大${max}孔`, 'ok');
  renderGrowthSocketPanel();
  const eqPanel = document.getElementById('panel-eq');
  if(eqPanel && eqPanel.classList.contains('active') && typeof renderEqPanel === 'function') renderEqPanel();
}
