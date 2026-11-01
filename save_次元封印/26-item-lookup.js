

// ════════════════════════════════════════════════
//  🔍 物品查詢
//  秋玥版內嵌的「掉落物查詢系統.html」是舊版資料（查不到次元封印新增的物品），這裡改查遊戲目前的資料。
// ════════════════════════════════════════════════
(function initItemLookupTypes(){
  const sel = document.getElementById('itemLookupType');
  if(!sel) return;
  const types = [...new Set(Object.values(ITEM_DB).map(v => v.type).filter(Boolean))];
  sel.innerHTML = '<option value="">全部類型</option>' + types.map(t => `<option value="${t}">${ITEM_TYPE_LABEL[t] || t}</option>`).join('');
})();

function renderItemLookup(){
  const box = document.getElementById('itemLookupResults');
  if(!box) return;
  const tokens = (document.getElementById('itemLookupInput')?.value || '').toLowerCase().split(/\s+/).filter(Boolean);
  const type   = document.getElementById('itemLookupType')?.value || '';
  const cnt    = document.getElementById('itemLookupCount');
  if(!tokens.length && !type){
    if(cnt) cnt.textContent = `共 ${Object.keys(ITEM_DB).length.toLocaleString()} 件物品`;
    box.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center">輸入關鍵字開始查詢。</div>';
    return;
  }
  const hits = Object.entries(ITEM_DB).filter(([id, v]) => {
    if(type && v.type !== type) return false;
    const hay = ((v.n || '') + ' ' + id).toLowerCase();
    return tokens.every(t => hay.includes(t));
  });
  const LIMIT = 100;
  if(cnt) cnt.textContent = hits.length > LIMIT ? `找到 ${hits.length.toLocaleString()} 件，只顯示前 ${LIMIT} 件` : `找到 ${hits.length.toLocaleString()} 件`;
  box.innerHTML = hits.slice(0, LIMIT).map(([id, v]) => {
    const drops = GAME_DATA.drops[id] || [];
    return `
    <div class="eq-slot" style="margin-bottom:8px">
      <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
        <b style="${v.legend ? 'color:var(--legend)' : v.relic ? 'color:var(--relic)' : ''}">${_sealEsc(v.n || id)}</b>
        <code style="font-size:11px;color:var(--text3)">${_sealEsc(id)}</code>
        <span style="font-size:11px;color:var(--text3)">${ITEM_TYPE_LABEL[v.type] || v.type || ''}</span>
      </div>
      ${v.d ? `<div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.5">${_sealEsc(v.d)}</div>` : ''}
      ${drops.length ? `<div style="font-size:12px;color:var(--text3);margin-top:4px">掉落：${drops.slice(0, 30).map(_sealEsc).join('、')}${drops.length > 30 ? `…（共 ${drops.length} 隻）` : ''}</div>` : ''}
    </div>`;
  }).join('') || '<div style="color:var(--text3);padding:20px;text-align:center">找不到符合的物品。</div>';
}
