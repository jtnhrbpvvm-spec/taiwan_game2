

// ════════════════════════════════════════════════
//  ✨ 物品進階欄位（裝備、背包、倉庫共用）
//  對照遊戲 afk-affix-plus.js（祝福／遠古階級、不屈者意志、龍的印記／傷痕、神樹者的讚禮、闇龍的抵抗者）、afk-runes.js（符文孔）
//  沒有專門欄位的資料（腐化、遺物強化…）可以直接改下面的完整 JSON。
// ════════════════════════════════════════════════
let _itemExtraRef = null;

function _itemExtraGet(kind, key){
  if(kind === 'eq')  return (G.p.eq || {})[key];
  if(kind === 'inv') return G.p.inv[key];
  return G.wh.items[key];
}

// 物品能開幾個符文孔、能鑲哪類符文（對照 afk-runes.js 的 kindOf／KINDS）
function _itemRuneKind(d){
  if(!d || d.gmOnly) return null;
  if(d.type === 'wpn' && !d.isArrow) return { kind:'weapon', max:3, cats:GAME_DATA.runeSlotCats.weapon };
  if(d.slot === 'belt') return { kind:'belt', max:3, cats:GAME_DATA.runeSlotCats.acc };
  if(d.slot === 'ring' || d.slot === 'ear' || d.slot === 'amulet') return { kind:'acc', max:1, cats:GAME_DATA.runeSlotCats.acc };
  if(d.type === 'arm' && ['armor','shield','helm','cloak','gloves','boots','shin','tshirt'].includes(d.slot)) return { kind:'armor', max:2, cats:GAME_DATA.runeSlotCats.armor };
  return null;
}

// 物品名稱後面的小標記：看得出這件有進階欄位
function itemExtraBadges(it){
  const b = [];
  if(it.blessLv > 1) b.push('祝×' + it.blessLv);
  if(it.ancLv > 1)   b.push('遠×' + it.ancLv);
  if(it.will)        b.push('意志');
  if(it.dmark)       b.push('印記');
  if(it.dscar)       b.push('傷痕');
  if(it.tree)        b.push('神樹');
  if(it.dres)        b.push('抵抗');
  if(Array.isArray(it.sockets) && it.sockets.length) b.push('孔' + it.sockets.length);
  return b.length ? ` <span style="font-size:10px;color:var(--relic)">${b.join(' ')}</span>` : '';
}

function openItemExtra(kind, key){
  if(kind === 'eq' && typeof onEqFieldChange === 'function' && document.getElementById(`eq_${key}_id`)) onEqFieldChange(key);
  const it = _itemExtraGet(kind, key);
  if(!it || !it.id){ toast('這一格沒有物品', 'warn'); return; }
  _itemExtraRef = { kind, key };
  const d = ITEM_DB[it.id] || {};
  document.getElementById('itemExtraName').textContent = `${d.n || it.id}（${it.id}）`;

  const isEquip = d.type === 'wpn' || d.type === 'arm' || d.type === 'acc';
  const isWpn   = d.type === 'wpn' && !d.isArrow;
  const isScarOk = d.slot === 'shield' || d.slot === 'armor';
  const lvOpts = (cur, names) => [1,2,3].map(v => `<option value="${v}" ${(cur > 1 ? cur : 1) === v ? 'selected' : ''}>${names[v - 1]}（×${v}）</option>`).join('');
  const dragonOpts = cur => '<option value="">── 無 ──</option>' + GAME_DATA.dragons.map(x => `<option value="${x.k}" ${cur === x.k ? 'selected' : ''}>${x.n}（${x.dn}）</option>`).join('');
  const starOpts = cur => [0,1,2,3].map(v => `<option value="${v}" ${(Number(cur) || 0) === v ? 'selected' : ''}>${v} 星</option>`).join('');
  const resKeys = { resFire:'火', resWater:'水', resWind:'風', resEarth:'地', resNone:'無' };
  const tree = Array.isArray(it.tree) ? it.tree : [];
  const resOpts = cur => '<option value="">── 無 ──</option>' + Object.entries(resKeys).map(([k, n]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${n}屬性</option>`).join('');
  const rk = _itemRuneKind(d);
  const sockets = Array.isArray(it.sockets) ? it.sockets : [];

  let html = '';
  if(isEquip){
    html += `
    <div class="form-row">
      <span class="form-label">祝福階級</span>
      <select id="ix_blessLv" style="width:170px" ${it.bless === true ? '' : 'disabled'} title="物品要先設成「祝福的」才有階級">${lvOpts(it.blessLv, ['祝福的','昇華的祝福','至高的祝福'])}</select>
      <span class="form-label" style="width:70px">遠古階級</span>
      <select id="ix_ancLv" style="width:150px" ${it.anc ? '' : 'disabled'} title="物品要先有遠古系詞綴才有階級">${lvOpts(it.ancLv, ['原名','覺醒的','創世的'])}</select>
    </div>`;
    if(isWpn) html += `
    <div class="form-row">
      <span class="form-label">不屈者意志</span>
      <select id="ix_will" style="width:220px">
        <option value="">── 無 ──</option>
        ${GAME_DATA.will.map(w => `<option value="${w.k}" ${it.will === w.k ? 'selected' : ''} title="${w.d}">${w.n}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <span class="form-label">龍的印記</span>
      <select id="ix_dmark" style="width:170px">${dragonOpts(it.dmark)}</select>
      <select id="ix_dmarkStar" style="width:70px">${starOpts(it.dmarkStar)}</select>
      <label class="eq-flag" title="同一件洗超過 100 次的隱藏效果：副本頭目傷害 +50%"><input type="checkbox" id="ix_dmarkHidden" ${it.dmarkHidden ? 'checked' : ''}> 隱藏效果</label>
    </div>`;
    if(isScarOk) html += `
    <div class="form-row">
      <span class="form-label">龍的傷痕</span>
      <select id="ix_dscar" style="width:170px">${dragonOpts(it.dscar)}</select>
      <select id="ix_dscarStar" style="width:70px">${starOpts(it.dscarStar)}</select>
      <label class="eq-flag" title="同一件洗超過 100 次的隱藏效果：受到四龍的傷害再 −50%"><input type="checkbox" id="ix_dscarHidden" ${it.dscarHidden ? 'checked' : ''}> 隱藏效果</label>
    </div>`;
    html += `
    <div class="form-row">
      <span class="form-label">神樹者的讚禮</span>
      <select id="ix_treeA" style="width:110px">${resOpts(tree[0])}</select>
      <select id="ix_treeB" style="width:110px">${resOpts(tree[1])}</select>
      ${d.type === 'arm' ? `<label class="eq-flag"><input type="checkbox" id="ix_dres" ${it.dres ? 'checked' : ''}> 闇龍的抵抗者</label>` : ''}
    </div>`;
  }
  if(rk){
    const runes = GAME_DATA.runes.filter(r => rk.cats.includes(r.cat));
    html += `<div class="section-title">符文孔（這件最多 ${rk.max} 孔；可鑲：${rk.cats.map(c => ({ attack:'攻擊', set:'套裝', class:'職業', guard:'減傷', potion:'藥水', pet:'寵物', aid:'補助' }[c] || c)).join('、')}）</div>`;
    for(let i = 0; i < rk.max; i++){
      const opened = i < sockets.length;
      const cur = opened ? sockets[i] : '';
      html += `
      <div class="form-row">
        <label class="eq-flag" style="width:88px"><input type="checkbox" class="ix_sockOpen" data-i="${i}" ${opened ? 'checked' : ''} onchange="_itemExtraSockSync()"> 第 ${i + 1} 孔</label>
        <select class="ix_sockRune" data-i="${i}" style="flex:1;min-width:0">
          <option value="">── 空孔 ──</option>
          ${runes.map(r => `<option value="${r.id}" ${cur === r.id ? 'selected' : ''}>${r.n}（階段${r.stage}）</option>`).join('')}
        </select>
      </div>`;
    }
  }
  html += `
  <div class="section-title">完整資料（JSON；要改上面沒有的欄位，例如腐化、遺物強化）</div>
  <textarea id="ix_raw" style="width:100%;height:150px;font-family:monospace;font-size:12px">${_sealEsc(JSON.stringify(it, null, 1))}</textarea>
  <label class="eq-flag" style="margin-top:6px"><input type="checkbox" id="ix_useRaw"> 以這段 JSON 為準（勾選後上面的欄位不會套用）</label>`;
  document.getElementById('itemExtraBody').innerHTML = html;
  _itemExtraSockSync();
  document.getElementById('itemExtraModal').classList.add('show');
}
function closeItemExtra(){
  document.getElementById('itemExtraModal').classList.remove('show');
  _itemExtraRef = null;
}
// 孔要連續開：後面的孔開了，前面的也要開；沒開的孔不能選符文
function _itemExtraSockSync(){
  const opens = [...document.querySelectorAll('.ix_sockOpen')];
  let last = -1;
  opens.forEach((c, i) => { if(c.checked) last = i; });
  opens.forEach((c, i) => {
    c.checked = i <= last;
    const sel = document.querySelector(`.ix_sockRune[data-i="${i}"]`);
    if(sel) sel.disabled = !c.checked;
  });
}

// 階級、星數 1 是預設值，遊戲的寫法是不存；其他欄位空值也直接刪掉，不留 null
function _ixSet(it, key, val){
  if(val === '' || val === null || val === false || val === undefined || val === 0) delete it[key];
  else it[key] = val;
}

function applyItemExtra(){
  if(!_itemExtraRef) return;
  const { kind, key } = _itemExtraRef;
  const it = _itemExtraGet(kind, key);
  if(!it) return closeItemExtra();

  if(document.getElementById('ix_useRaw')?.checked){
    let obj;
    try{ obj = JSON.parse(document.getElementById('ix_raw').value); }
    catch(e){ toast('❌ JSON 格式錯誤，沒有套用：' + e.message, 'err', 4000); return; }
    if(!obj || typeof obj !== 'object' || !obj.id){ toast('❌ 物品至少要有 id', 'err', 4000); return; }
    Object.keys(it).forEach(k => delete it[k]);
    Object.assign(it, obj);
  } else {
    const val = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
    const has = id => !!document.getElementById(id);
    const chk = id => !!document.getElementById(id)?.checked;
    if(has('ix_blessLv')){
      const v = parseInt(val('ix_blessLv')) || 1;
      if(it.bless === true && v > 1) it.blessLv = v; else delete it.blessLv;
    }
    if(has('ix_ancLv')){
      const v = parseInt(val('ix_ancLv')) || 1;
      if(it.anc && v > 1) it.ancLv = v; else delete it.ancLv;
    }
    if(has('ix_will')) _ixSet(it, 'will', val('ix_will'));
    if(has('ix_dmark')){
      _ixSet(it, 'dmark', val('ix_dmark'));
      _ixSet(it, 'dmarkStar', it.dmark ? parseInt(val('ix_dmarkStar')) : 0);
      _ixSet(it, 'dmarkHidden', it.dmark ? chk('ix_dmarkHidden') : false);
    }
    if(has('ix_dscar')){
      _ixSet(it, 'dscar', val('ix_dscar'));
      _ixSet(it, 'dscarStar', it.dscar ? parseInt(val('ix_dscarStar')) : 0);
      _ixSet(it, 'dscarHidden', it.dscar ? chk('ix_dscarHidden') : false);
    }
    if(has('ix_treeA')){
      const a = val('ix_treeA'), b = val('ix_treeB');
      if(a && b && a === b){ toast('❌ 神樹者的讚禮是兩種不同的抗性', 'err', 4000); return; }
      if(a && b) it.tree = [a, b]; else delete it.tree;
    }
    if(has('ix_dres')) _ixSet(it, 'dres', chk('ix_dres'));
    const opens = [...document.querySelectorAll('.ix_sockOpen')];
    if(opens.length){
      const sockets = opens.filter(c => c.checked).map((c, i) => document.querySelector(`.ix_sockRune[data-i="${i}"]`).value || null);
      const names = sockets.filter(Boolean).map(id => (GAME_DATA.runes.find(r => r.id === id) || {}).n?.replace(/ ★\d$/, ''));
      if(new Set(names).size !== names.length){ toast('❌ 同一件不能鑲兩顆同名符文', 'err', 4000); return; }
      if(sockets.length) it.sockets = sockets; else delete it.sockets;
    }
  }

  if(kind === 'eq') renderEqPanel();
  else renderItemTable(kind);
  closeItemExtra();
  toast('已套用進階欄位', 'ok');
}
