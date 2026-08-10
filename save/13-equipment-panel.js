

function renderEqPanel(){
  const grid = document.getElementById('eqGrid');
  if(!grid) return;

  const attrOptHTML = `
    <option value="">── 無 ──</option>
    <optgroup label="一階（之）">
      ${['fr1','wa1','wi1','ea1'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="二階">
      ${['fr2','wa2','wi2','ea2'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="三階（靈）">
      ${['fr3','wa3','wi3','ea3'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="四階">
      ${['fr4','wa4','wi4','ea4'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="五階（最高階）">
      ${['fr5','wa5','wi5','ea5'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>`;

  const attrMagicSelectHTML = attrMagicOptHTML();

  const ancOptHTML = `
    <option value="">── 無 ──</option>
    ${ANC_OPTIONS.map(o=>`<option value="${String(o.v)}">${o.n}</option>`).join('')}`;

  const blessOptHTML = `
    <option value="">── 無 ──</option>
    ${BLESS_OPTIONS.map(o=>`<option value="${String(o.v)}">${o.n}</option>`).join('')}`;

  const remSetOptHTML = `
    <option value="">── 無 ──</option>
    ${REM_SET_NAMES.map(n=>`<option value="${n}">${n}</option>`).join('')}`;

  grid.innerHTML = EQ_SLOTS.map(sl => {
    if(sl.hidden) return '';
    if(sl.spacer) return `<div id="remSetSummary" class="rem-set-summary">${remSetSummaryHTML(G.p.eq)}</div>`;

    const d  = (G.p.eq && G.p.eq[sl.id]) || {};

    if(sl.isSimpleToggle){
      return `
      <div class="eq-slot eq-slot-simple">
        <div class="eq-slot-title">${sl.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px">
          ID: <code>${sl.fixedItemId}</code>（固定，全遊戲僅此一件對應物品）
        </div>
        <label class="eq-flag">
          <input type="checkbox" id="eq_${sl.id}_equipped"
                 onchange="onSimpleToggleFieldChange('${sl.id}')" ${d.id?'checked':''}> 已裝備
        </label>
      </div>`;
    }

    if(sl.isRemains){
      return `
      <div class="eq-slot eq-slot-rem">
        <div class="eq-slot-title">${sl.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px">
          ID: <code>${sl.id}</code>（固定）
        </div>
        <div class="eq-slot-row">
          <label class="eq-flag">
            <input type="checkbox" id="eq_${sl.id}_equipped"
                   onchange="onRemFieldChange('${sl.id}')" ${d.id?'checked':''}> 已裝備
          </label>
          <label class="eq-flag">
            <input type="checkbox" id="eq_${sl.id}_lock"
                   onchange="onRemFieldChange('${sl.id}')" ${d.lock?'checked':''}> 鎖定
          </label>
        </div>
        <div class="affix-row">
          <span class="affix-label">套裝效果</span>
          <select class="affix-select" id="eq_${sl.id}_seteff"
                  onchange="onRemFieldChange('${sl.id}')">${remSetOptHTML}</select>
        </div>
      </div>`;
    }

    const db = (d.id && ITEM_DB[d.id]) || {};
    return `
    <div class="eq-slot">
      <div class="eq-slot-title">${sl.label}</div>
      <div style="font-size:12px;min-height:18px;margin-bottom:6px;line-height:1.4">
        ${getEqDisplayName(db, d)}
      </div>
      <div class="eq-slot-row">
        <label style="font-size:11px;color:var(--text3)">ID</label>
        <input type="text" id="eq_${sl.id}_id" value="${d.id||''}"
               style="width:130px" placeholder="物品 ID"
               onchange="onEqFieldChange('${sl.id}')">
        <label style="font-size:11px;color:var(--text3)">+</label>
        <input type="number" id="eq_${sl.id}_en" value="${d.en||0}"
               min="0" max="99" style="width:46px"
               onchange="onEqFieldChange('${sl.id}')">
      </div>
      <div class="affix-row">
        <span class="affix-label">屬性詞綴</span>
        <select class="affix-select" id="eq_${sl.id}_attr"
                onchange="onEqFieldChange('${sl.id}')">${attrOptHTML}</select>
      </div>
      <div class="affix-row">
        <span class="affix-label">屬性魔法</span>
        <select class="affix-select" id="eq_${sl.id}_attrmagic"
                onchange="onEqFieldChange('${sl.id}')" title="只有五階屬性裝備才能附加，且技能元素須與屬性詞綴相同">${attrMagicSelectHTML}</select>
        <select id="eq_${sl.id}_attrmagicstar" style="width:56px;margin-left:4px"
                title="星級（1~3，同技能升星使觸發率×星數）"
                onchange="onEqFieldChange('${sl.id}')">${starOptHTML(d.attrMagicStar||1)}</select>
      </div>
      <div class="affix-row">
        <span class="affix-label">遠古詞綴</span>
        <select class="affix-select" id="eq_${sl.id}_anc"
                onchange="onEqFieldChange('${sl.id}')">${ancOptHTML}</select>
      </div>
      <div class="affix-row">
        <span class="affix-label">祝福/詛咒</span>
        <select class="affix-select" id="eq_${sl.id}_bless"
                onchange="onEqFieldChange('${sl.id}')">${blessOptHTML}</select>
      </div>
      <div class="eq-slot-row" style="margin-top:6px">
        <label class="eq-flag">
          <input type="checkbox" id="eq_${sl.id}_lock"
                 onchange="onEqFieldChange('${sl.id}')"
                 ${d.lock?'checked':''}> 鎖定
        </label>
        <label class="eq-flag">
          <input type="checkbox" id="eq_${sl.id}_ancchk"
                 onchange="onEqAncChk('${sl.id}')"
                 ${d.anc?'checked':''}> ★祖傳
        </label>
      </div>
    </div>`;
  }).join('');

  // 補上 selected 狀態
  EQ_SLOTS.forEach(sl => {
    if(sl.hidden || sl.spacer) return;
    const d = (G.p.eq && G.p.eq[sl.id]) || {};
    if(sl.isSimpleToggle) return;   // 只有checkbox，沒有下拉選單需要同步selected狀態
    if(sl.isRemains){
      _setSelectVal(`eq_${sl.id}_seteff`, d.seteff || '');
      return;
    }
    _setSelectVal(`eq_${sl.id}_attr`,  d.attr  || '');
    _setSelectVal(`eq_${sl.id}_attrmagic`, d.attrMagic || '');
    _setSelectVal(`eq_${sl.id}_attrmagicstar`, String(d.attrMagicStar || 1));
    _setSelectVal(`eq_${sl.id}_anc`,
      d.anc === true ? 'true' : (d.anc || ''));
    _setSelectVal(`eq_${sl.id}_bless`,
      d.bless === 'cursed' ? 'cursed' : (d.bless ? 'true' : ''));
  });
}

// ── 遺骸欄位變更即時同步
function onRemFieldChange(slotId){
  if(!G.p.eq) G.p.eq = {};
  const equipped = !!document.getElementById(`eq_${slotId}_equipped`)?.checked;
  if(!equipped){
    G.p.eq[slotId] = null;
    _refreshRemSummary();
    return;
  }
  const orig   = G.p.eq[slotId] || {};
  const seteff = document.getElementById(`eq_${slotId}_seteff`)?.value || '';
  const lock   = !!document.getElementById(`eq_${slotId}_lock`)?.checked;
  G.p.eq[slotId] = Object.assign({}, orig, {
    id: slotId,
    uid: orig.uid || genUID(),
    cnt: 1,
    en: 0,
    bless: false,
    anc: false,
    attr: false,
    seteff: seteff || false,
    lock,
    junk: false,
    _ruleJunk: false,
  });
  _refreshRemSummary();
}
function _refreshRemSummary(){
  const el = document.getElementById('remSetSummary');
  if(el) el.innerHTML = remSetSummaryHTML(G.p.eq);
}

// ── 簡易切換欄位（目前只有魔眼欄位在用）：固定物品ID，只有「已裝備」一個開關，其餘屬性一律清空
function onSimpleToggleFieldChange(slotId){
  if(!G.p.eq) G.p.eq = {};
  const sl = EQ_SLOTS.find(s => s.id === slotId);
  if(!sl || !sl.fixedItemId) return;
  const equipped = !!document.getElementById(`eq_${slotId}_equipped`)?.checked;
  if(!equipped){
    G.p.eq[slotId] = null;
    return;
  }
  const orig = G.p.eq[slotId] || {};
  G.p.eq[slotId] = Object.assign({}, orig, {
    id: sl.fixedItemId,
    uid: orig.uid || genUID(),
    cnt: 1,
    en: 0,
    bless: false,
    anc: false,
    attr: false,
    lock: false,
    junk: false,
    _ruleJunk: false,
  });
}

// ── 欄位變更即時同步
function onEqFieldChange(slotId){
  const idVal = (document.getElementById(`eq_${slotId}_id`)?.value || '').trim();
  const orig  = G.p.eq[slotId] || {};

  if(!idVal){
    G.p.eq[slotId] = null;
    _refreshEqPreview(slotId, null, null);
    return;
  }

  const attrRaw  = document.getElementById(`eq_${slotId}_attr`)?.value  || '';
  const ancRaw   = document.getElementById(`eq_${slotId}_anc`)?.value   || '';
  const blessRaw = document.getElementById(`eq_${slotId}_bless`)?.value || '';

  // 🔮 屬性魔法：所有裝備欄位（席琳遺骸除外）皆適用，且必須「第5階屬性裝備」+「技能與屬性詞綴同元素」才合法
  let attrMagic = false, attrMagicStar = 1;
  {
    const magicRaw = document.getElementById(`eq_${slotId}_attrmagic`)?.value || '';
    const starRaw  = parseInt(document.getElementById(`eq_${slotId}_attrmagicstar`)?.value) || 1;
    if(magicRaw){
      if(!isTier5AttrWeapon(idVal, attrRaw)){
        toast('⚠️ 只有「五階屬性裝備」才能附加屬性魔法，已忽略此設定', 'err', 4000);
      } else if(ATTR_MAGIC_BY_SKILL[magicRaw] !== (ATTR_AFFIX[attrCanon(attrRaw)]||{}).ele){
        toast('⚠️ 屬性魔法必須跟裝備的屬性詞綴同元素，已忽略此設定', 'err', 4000);
      } else {
        attrMagic     = magicRaw;
        attrMagicStar = Math.max(1, Math.min(3, starRaw));
      }
    }
    if(!attrMagic){
      _setSelectVal(`eq_${slotId}_attrmagic`, '');
      _setSelectVal(`eq_${slotId}_attrmagicstar`, '1');
    }
  }

  G.p.eq[slotId] = Object.assign({}, orig, {
    id:     idVal,
    en:     parseInt(document.getElementById(`eq_${slotId}_en`)?.value) || 0,
    cnt:    orig.cnt   || 1,
    bless:  blessRaw === '' ? false : (blessRaw === 'true' ? true : blessRaw),
    lock:   !!(document.getElementById(`eq_${slotId}_lock`)?.checked),
    anc:    ancRaw   === '' ? false : (ancRaw   === 'true' ? true : ancRaw),
    uid:    orig.uid   || genUID(),
    attr:   attrRaw   || false,
    attrMagic,
    attrMagicStar,
    seteff: orig.seteff || false,
    junk:   orig.junk  ?? false,
  });

  const ancChk = document.getElementById(`eq_${slotId}_ancchk`);
  if(ancChk) ancChk.checked = !!G.p.eq[slotId].anc;

  const db = ITEM_DB[idVal] || {};
  _refreshEqPreview(slotId, db, G.p.eq[slotId]);
}

function _refreshEqPreview(slotId, db, eq){
  const idInput = document.getElementById(`eq_${slotId}_id`);
  if(!idInput) return;
  const slot = idInput.closest('.eq-slot');
  if(!slot) return;
  const preview = slot.querySelector('div[style*="min-height"]');
  if(preview) preview.innerHTML = getEqDisplayName(db, eq);
}

function onEqAncChk(slotId){
  const chk    = document.getElementById(`eq_${slotId}_ancchk`);
  const ancSel = document.getElementById(`eq_${slotId}_anc`);
  if(!chk || !ancSel) return;
  if(chk.checked){
    if(!ancSel.value) _setSelectVal(`eq_${slotId}_anc`, 'true');
  } else {
    _setSelectVal(`eq_${slotId}_anc`, '');
  }
  onEqFieldChange(slotId);
}

function saveEqToG(){
  if(!G.p.eq) G.p.eq = {};
  EQ_SLOTS.forEach(sl => {
    const inputEl = document.getElementById(`eq_${sl.id}_id`);
    // 如果裝備面板還沒被渲染出 DOM 元素，就直接跳過，保留 G.p.eq 內的原始資料
    if(!inputEl) return; 

    const idVal = (inputEl.value || '').trim();
    if(!idVal){ G.p.eq[sl.id] = null; return; }
    onEqFieldChange(sl.id);
  });
}