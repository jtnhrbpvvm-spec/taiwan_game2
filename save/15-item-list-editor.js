

// ════════════════════════════════════════════════
//  物品搜尋輔助
// ════════════════════════════════════════════════
function getItemName(id){
  return (ITEM_DB[id] && ITEM_DB[id].n) ? ITEM_DB[id].n : id;
}

function onItemSearch(input, ddId, hidId){
  const q  = input.value.trim().toLowerCase();
  const dd = document.getElementById(ddId);
  if(!q){ dd.style.display = 'none'; return; }

  const results = Object.entries(ITEM_DB)
    .filter(([id,v]) => {
      const name = (v.n||'').toLowerCase();
      return name.includes(q) || id.toLowerCase().includes(q);
    })
    .slice(0, 18);

  if(!results.length){ dd.style.display = 'none'; return; }

  dd.innerHTML = results.map(([id,v]) => `
    <div class="item-opt ${v.legend?'legend':''}"
         onclick="selectItem('${id}','${(v.n||id).replace(/'/g,"\\'")}','${ddId}','${hidId}')">
      <span class="item-opt-name">${v.n||id}</span>
      <span class="item-opt-id">${id}</span>
    </div>`).join('');
  dd.style.display = 'block';
}

function selectItem(id, name, ddId, hidId){
  document.getElementById(hidId).value = id;
  const dd = document.getElementById(ddId);
  if(dd && dd.previousElementSibling) dd.previousElementSibling.value = name;
  dd.style.display = 'none';
}

document.addEventListener('click', e => {
  document.querySelectorAll('.item-dropdown').forEach(dd => {
    if(!dd.parentElement.contains(e.target)) dd.style.display = 'none';
  });
});

// ════════════════════════════════════════════════
//  背包 / 倉庫
// ════════════════════════════════════════════════
function addItem(type){
  const selId = type === 'inv' ? 'invSelId' : 'whSelId';
  const cntId = type === 'inv' ? 'invCnt'   : 'whCnt';
  const enId  = type === 'inv' ? 'invEn'    : 'whEn';
  const id    = document.getElementById(selId).value;
  if(!id){ toast('請先選擇物品', 'err'); return; }
  const item = {
    id, uid:genUID(),
    cnt:   parseInt(document.getElementById(cntId).value) || 1,
    en:    parseInt(document.getElementById(enId).value)  || 0,
    bless: false, lock: false, junk: false,
    attr: false, anc: false, seteff: false,
    attrMagic: false, attrMagicStar: 1,
  };
  if(type === 'inv') G.p.inv.push(item);
  else               G.wh.items.push(item);
  renderItemTable(type);
  toast('已新增：' + getItemName(id), 'ok');
}

function delItem(type, idx){
  if(type === 'inv') G.p.inv.splice(idx, 1);
  else               G.wh.items.splice(idx, 1);
  renderItemTable(type);
}

function clearList(type){
  if(!confirm('確定清空？')) return;
  if(type === 'inv') G.p.inv   = [];
  else               G.wh.items = [];
  _delSel[type].clear();
  renderItemTable(type);
}

function renderItemTable(type){
  const list  = type === 'inv' ? G.p.inv : G.wh.items;
  const tbody = document.getElementById(type === 'inv' ? 'invBody' : 'whBody');
  if(!tbody) return;

  function attrOpts(cur){
    const TIER_LABEL = {1:'一階',2:'二階',3:'三階',4:'四階',5:'五階'};
    let h = `<option value="">無</option>`;
    for(let t = 1; t <= 5; t++){
      const keys = Object.keys(ATTR_AFFIX).filter(k => ATTR_AFFIX[k].tier === t);
      h += `<optgroup label="${TIER_LABEL[t]}">`;
      keys.forEach(k => {
        h += `<option value="${k}" ${cur===k?'selected':''}>${ATTR_AFFIX[k].n}</option>`;
      });
      h += `</optgroup>`;
    }
    return h;
  }

  function ancOpts(cur){
    const curStr = cur === true ? 'true' : (cur || '');
    let h = `<option value="">無</option>`;
    ANC_OPTIONS.forEach(o => {
      const vStr = String(o.v);
      h += `<option value="${vStr}" ${curStr===vStr?'selected':''}>${o.n}</option>`;
    });
    return h;
  }

  tbody.innerHTML = list.map((it, i) => {
    const db      = ITEM_DB[it.id] || {};
    const nameCls = db.legend ? 'style="color:var(--legend)"' : '';
    const eligible = isTier5AttrWeapon(it.id, it.attr);
    return `
    <tr>
      <td ${nameCls}>${getItemName(it.id)}</td>
      <td style="color:var(--text3);font-size:11px">${it.id}</td>
      <td><input type="number" value="${it.cnt||1}" min="1" style="width:60px"
                 onchange="updateItemField('${type}',${i},'cnt',this.value)"></td>
      <td><input type="number" value="${it.en||0}" min="0" max="99" style="width:48px"
                 onchange="updateItemField('${type}',${i},'en',this.value)"></td>
      <td class="inv-attr-cell">
        <select style="font-size:12px;background:var(--bg3);border:1px solid var(--border);
                       color:var(--text);border-radius:3px;padding:2px 3px;width:72px"
                onchange="updateItemField('${type}',${i},'attr',this.value||false)">
          ${attrOpts(it.attr||'')}
        </select>
      </td>
      <td class="inv-attr-cell">
        <select style="font-size:12px;background:var(--bg3);border:1px solid var(--border);
                       color:var(--text);border-radius:3px;padding:2px 3px;width:88px"
                ${eligible?'':'disabled'} title="${eligible?'選擇屬性魔法':'只有五階屬性裝備才能附加屬性魔法'}"
                onchange="updateItemField('${type}',${i},'attrMagic',this.value||false)">
          ${attrMagicOptHTML(it.attrMagic||'')}
        </select>
        <select style="width:52px;margin-left:2px" title="星級(1~3)"
               ${eligible && it.attrMagic ? '' : 'disabled'}
               onchange="updateItemField('${type}',${i},'attrMagicStar',this.value)">
          ${starOptHTML(it.attrMagicStar||1)}
        </select>
      </td>
      <td>
        <select style="font-size:12px;background:var(--bg3);border:1px solid var(--border);
                       color:var(--text);border-radius:3px;padding:2px 3px;width:60px"
                onchange="updateItemAncField('${type}',${i},this.value)">
          ${ancOpts(it.anc)}
        </select>
      </td>
      <td><input type="checkbox" ${it.bless?'checked':''}
                 onchange="updateItemField('${type}',${i},'bless',this.checked)"></td>
      <td><input type="checkbox" ${it.lock?'checked':''}
                 onchange="updateItemField('${type}',${i},'lock',this.checked)"></td>
      <td style="text-align:center"><input type="checkbox" class="del-check"
             ${_delSel[type].has(i)?'checked':''}
             onchange="toggleDelSel('${type}',${i},this.checked)" title="勾選以刪除此物品"></td>
    </tr>`;
  }).join('');
  _updateDelFab();
}

function updateItemAncField(type, idx, val){
  const list = type === 'inv' ? G.p.inv : G.wh.items;
  if(!list[idx]) return;
  list[idx].anc = val === '' ? false : (val === 'true' ? true : val);
}

function updateItemField(type, idx, field, val){
  const list = type === 'inv' ? G.p.inv : G.wh.items;
  const it = list[idx];
  if(!it) return;
  if(field === 'cnt' || field === 'en'){
    it[field] = parseInt(val) || 0;
  } else if(field === 'attr'){
    it[field] = (val === false || val === '' || val === 'false') ? false : val;
    if(it.attrMagic && !attrMagicStillValid(it.id, it.attr, it.attrMagic)){
      it.attrMagic = false;
      it.attrMagicStar = 1;
      toast('⚠️ 屬性已變更，原本附加的屬性魔法不再符合條件，已自動清除', 'warn', 4000);
      renderItemTable(type);
    } else {
      renderItemTable(type);
    }
  } else if(field === 'attrMagic'){
    if(!val || val === 'false'){
      it.attrMagic = false;
      it.attrMagicStar = 1;
    } else if(!isTier5AttrWeapon(it.id, it.attr)){
      toast('⚠️ 只有「五階屬性裝備」才能附加屬性魔法', 'err', 4000);
    } else if(ATTR_MAGIC_BY_SKILL[val] !== (ATTR_AFFIX[attrCanon(it.attr)]||{}).ele){
      toast('⚠️ 屬性魔法必須跟裝備的屬性詞綴同元素', 'err', 4000);
    } else {
      it.attrMagic = val;
      if(!it.attrMagicStar) it.attrMagicStar = 1;
    }
    renderItemTable(type);
  } else if(field === 'attrMagicStar'){
    it[field] = Math.max(1, Math.min(3, parseInt(val) || 1));
  } else {
    it[field] = val;
  }
}


// ════════════════════════════════════════════════
//  🗑️ 背包/倉庫：勾選刪除（每列勾選框 + 右下浮動刪除鈕 + 刪除前確認）
//  · 每列「操作」欄改成勾選框，勾選要刪的物品（可複選）。
//  · 右下角浮動鈕（position:fixed，捲動頁面時固定跟隨）顯示已勾選數量；
//    只有在背包/倉庫分頁且有勾選時才出現。按下會先跳確認再刪除。
//  · 勾選狀態以「列索引」記錄在 _delSel（不寫進物品資料，不會被匯出）。
//    編輯欄位觸發的重繪會保留勾選；清空/刪除後自動清除勾選。
// ════════════════════════════════════════════════
const _delSel = { inv: new Set(), wh: new Set() };

// 目前作用中的物品分頁（用 .panel.active 判斷，不寫死 panel id）
function _activeItemType(){
  const ib = document.getElementById('invBody');
  const wb = document.getElementById('whBody');
  const invPanel = ib && ib.closest('.panel');
  const whPanel  = wb && wb.closest('.panel');
  if(invPanel && invPanel.classList.contains('active')) return 'inv';
  if(whPanel  && whPanel.classList.contains('active'))  return 'wh';
  return null;
}

function toggleDelSel(type, idx, checked){
  if(checked) _delSel[type].add(idx);
  else        _delSel[type].delete(idx);
  _updateDelFab();
}

function deleteSelected(type){
  const sel = _delSel[type];
  if(!sel || sel.size === 0){ toast('尚未勾選任何物品', 'warn'); return; }
  const n = sel.size;
  if(!confirm(`確定刪除勾選的 ${n} 項物品？此動作無法復原。`)) return;
  const list = type === 'inv' ? G.p.inv : G.wh.items;
  // 由大到小 splice，避免索引位移
  Array.from(sel).sort((a, b) => b - a).forEach(i => list.splice(i, 1));
  sel.clear();
  renderItemTable(type);
  toast(`已刪除 ${n} 項物品`, 'ok');
}

function _ensureDelFab(){
  let fab = document.getElementById('itemDelFab');
  if(fab) return fab;
  fab = document.createElement('button');
  fab.id = 'itemDelFab';
  fab.className = 'btn btn-danger';
  fab.style.cssText = 'position:fixed;right:28px;bottom:28px;z-index:3000;display:none;'
    + 'box-shadow:0 6px 20px rgba(0,0,0,.5);font-size:14px;padding:12px 18px;border-radius:10px;';
  fab.onclick = () => { const t = _activeItemType(); if(t) deleteSelected(t); };
  document.body.appendChild(fab);
  return fab;
}

function _updateDelFab(){
  const fab = _ensureDelFab();
  const t = _activeItemType();
  const n = t ? _delSel[t].size : 0;
  if(t && n > 0){
    fab.textContent = `🗑 刪除勾選（${n}）`;
    fab.style.display = 'block';
  } else {
    fab.style.display = 'none';
  }
}

// 切分頁後更新浮動鈕（nav 點擊會呼叫 showPanel；用 setTimeout 讓它先跑完再判斷作用分頁）
document.addEventListener('click', e => {
  if(e.target && e.target.closest && e.target.closest('.nav-item')) setTimeout(_updateDelFab, 0);
});
