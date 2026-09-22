/* ============================================================
   天下無雙放置版 — 共用倉庫（參考 idle-lineage 可拖曳倉庫視窗）
   4 個存檔角色共用；可存放物品與靈石。
   存檔鍵：txws_idle_warehouse_v1 → { stones, items:[{uid,name,count,instance,quality}] }
   - 可堆疊道具：同名合併為一格（count 累加）
   - 裝備：每件一格，保留完整實例（強化、精煉、寶石、詞綴）
   鎖定中的物品無法存入（需先在背包解鎖）。
   ============================================================ */
(function(){
  'use strict';
  const WH_KEY = 'txws_idle_warehouse_v1';
  const WH_MAX = 200;
  const $id = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const CAT_ORDER = ['weapon','armor','accessory','consumable','material','other'];

  let filter = 'all', search = '', qtyInput = '', invView = [], drag = null;

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function loadWh(){
    let w = null;
    try { w = JSON.parse(localStorage.getItem(WH_KEY) || 'null'); } catch(e){}
    if (!w || typeof w !== 'object') w = {};
    w.stones = Math.max(0, Number(w.stones) || 0);
    w.items = Array.isArray(w.items) ? w.items.filter(it => it && it.name && (Number(it.count) || 0) > 0) : [];
    return w;
  }
  function saveWh(w){
    try { localStorage.setItem(WH_KEY, JSON.stringify(w)); return true; }
    catch(e){ toast('無法寫入倉庫（瀏覽器儲存空間不足或被封鎖）'); return false; }
  }
  function metaOf(it){ return getInventoryItemMeta(it.name, it.instance || null); }
  function catOf(it){ return inventoryCategory(it.name, it.instance || null); }
  function matches(it){
    if (search) return String(it.name).toLowerCase().includes(search.toLowerCase());
    return filter === 'all' || catOf(it) === filter;
  }
  function wantQty(max){
    const q = parseInt(qtyInput, 10);
    return Math.max(1, Math.min(max, q > 0 ? q : max));
  }
  function entryLocked(e){
    if (e.instance) return isLocked(e.instance);
    return getStackLock(e.name, e.stackIndex ?? 0);
  }
  function afterChange(){
    ensureStats();
    save(true);
    if (typeof activePanel !== 'undefined' && activePanel === 'inventory') renderAll(); else syncHud();
    render();
  }

  /* ---------------- 存入／取出 ---------------- */
  function deposit(e, qtyOverride){
    if (!e || entryLocked(e)) { toast('鎖定物品需先解鎖才能存入倉庫'); return false; }
    const w = loadWh();
    const name = e.name;
    if (e.instance) {
      const arr = (G.inventoryInstances && G.inventoryInstances[name]) || [];
      const idx = arr.indexOf(e.instance);
      if (idx < 0 || !(G.inventory[name] > 0)) { render(); return false; }
      if (w.items.length >= WH_MAX) { toast(`倉庫已滿（上限 ${WH_MAX} 格）`); return false; }
      w.items.push({ uid: uid(), name, count: 1, instance: JSON.parse(JSON.stringify(e.instance)) });
      if (!saveWh(w)) return false;
      arr.splice(idx, 1);
      G.inventory[name] = Math.max(0, (G.inventory[name] || 0) - 1);
      return true;
    }
    const have = Math.min(Number(G.inventory[name]) || 0, e.count);
    if (have <= 0) { render(); return false; }
    const qty = Math.min(have, qtyOverride || wantQty(have));
    const quality = (G.inventoryQuality && G.inventoryQuality[name]) || null;
    const stack = w.items.find(it => !it.instance && it.name === name);
    if (stack) stack.count += qty;
    else {
      if (w.items.length >= WH_MAX) { toast(`倉庫已滿（上限 ${WH_MAX} 格）`); return false; }
      w.items.push({ uid: uid(), name, count: qty, instance: null, quality });
    }
    if (!saveWh(w)) return false;
    G.inventory[name] = Math.max(0, (G.inventory[name] || 0) - qty);
    return true;
  }
  function withdraw(itemUid){
    const w = loadWh();
    const idx = w.items.findIndex(it => it.uid === itemUid);
    if (idx < 0) { render(); return; }
    const it = w.items[idx];
    const name = it.name;
    if (it.instance) {
      w.items.splice(idx, 1);
      if (!saveWh(w)) return;
      G.inventory[name] = (Number(G.inventory[name]) || 0) + 1;
      G.inventoryInstances[name] = G.inventoryInstances[name] || [];
      // 修正前存入的舊裝備：品質倍率烘進數值（與 index.html 的 migrateEquipQuality 相同規則）
      if (typeof bakeEquipQuality === 'function') bakeEquipQuality(it.instance, it.instance.quality);
      G.inventoryInstances[name].push(it.instance);
    } else {
      const qty = wantQty(it.count);
      if (qty >= it.count) w.items.splice(idx, 1); else it.count -= qty;
      if (!saveWh(w)) return;
      G.inventory[name] = (Number(G.inventory[name]) || 0) + qty;
      if (it.quality && G.inventoryQuality && !G.inventoryQuality[name]) G.inventoryQuality[name] = it.quality;
    }
    afterChange();
  }
  function stones(dir){
    const el = $id('wh-stone-amt');
    let amt = Math.floor(Number(el && el.value) || 0);
    if (amt <= 0) return;
    const w = loadWh();
    if (dir === 'in') { amt = Math.min(amt, Math.floor(G.player.spiritStone || 0)); if (!amt) return toast('背包靈石不足'); w.stones += amt; if (!saveWh(w)) return; G.player.spiritStone -= amt; }
    else { amt = Math.min(amt, w.stones); if (!amt) return toast('倉庫靈石不足'); w.stones -= amt; if (!saveWh(w)) return; G.player.spiritStone += amt; }
    toast(`${dir === 'in' ? '存入' : '取出'}靈石 ${fmt(amt)}`);
    afterChange();
  }
  function oneClickDeposit(){
    const names = new Set(loadWh().items.filter(it => !it.instance).map(it => it.name));
    let moved = 0;
    for (const e of inventorySlotEntries()) {
      if (e.instance || !names.has(e.name) || entryLocked(e)) continue;
      if (deposit(e, e.count)) moved += e.count;
    }
    if (!moved) { toast('背包中沒有與倉庫相同、可存入的道具'); render(); return; }
    toast(`一鍵存入 ${fmt(moved)} 個道具`);
    afterChange();
  }
  function sortWh(){
    const w = loadWh();
    if (!w.items.length) return toast('倉庫沒有物品可排列');
    w.items.sort((a, b) => {
      const A = metaOf(a), B = metaOf(b);
      return CAT_ORDER.indexOf(catOf(a)) - CAT_ORDER.indexOf(catOf(b)) || B.qualityRank - A.qualityRank || B.level - A.level || String(a.name).localeCompare(String(b.name));
    });
    if (saveWh(w)) { toast('倉庫已重新排列'); render(); }
  }

  /* ---------------- 畫面 ---------------- */
  function itemBtn(it, count, attrs, disabled, note){
    const m = metaOf(it);
    const q = it.instance ? (it.instance.quality || m.quality) : (it.quality || m.quality);
    const enh = it.instance && it.instance.enhance ? ` +${it.instance.enhance}` : '';
    const tip = `${it.name}${enh} · ${(typeof QUALITY !== 'undefined' && QUALITY[q]) || ''} · ${INVENTORY_CATEGORY_LABELS[catOf(it)] || ''}${m.level ? ' · Lv.' + m.level : ''}`;
    return `<button type="button" class="wh-item" ${attrs} ${disabled ? 'disabled' : ''} title="${esc(tip)}"><span class="wh-name quality-${esc(q)}">${esc(it.name)}${esc(enh)}${note ? ` <small style="color:#ffb0a8">${note}</small>` : ''}</span><span class="wh-qty">×${fmt(count)}</span></button>`;
  }
  function render(){
    const box = $id('warehouse-window-content');
    if (!box || !isOpen()) return;
    const w = loadWh();
    invView = inventorySlotEntries().filter(e => matches(e));
    const whView = w.items.filter(it => matches(it));
    const invScroll = $id('wh-inv-list')?.scrollTop || 0, whScroll = $id('wh-store-list')?.scrollTop || 0;
    const tabs = Object.entries(INVENTORY_CATEGORY_LABELS).map(([k, label]) => `<button type="button" class="tab ${!search && filter === k ? 'active' : ''}" data-wh-filter="${k}">${label}</button>`).join('');
    const invHtml = invView.length ? invView.map((e, i) => {
      const locked = entryLocked(e);
      return itemBtn(e, e.count, `data-wh-dep="${i}"`, locked, locked ? '（鎖定）' : '');
    }).join('') : `<div class="wh-empty">${search ? '背包沒有符合搜尋的物品' : '此分類背包沒有物品'}</div>`;
    const whHtml = whView.length ? whView.map(it => itemBtn(it, it.count, `data-wh-wd="${esc(it.uid)}"`, false, '')).join('')
      : `<div class="wh-empty">${search ? '倉庫沒有符合搜尋的物品' : '此分類倉庫是空的'}</div>`;
    const searching = document.activeElement && document.activeElement.id === 'wh-search';
    box.innerHTML = `
      <div class="wh-note">將物品或靈石存入倉庫，<b>所有存檔角色共用</b>。點背包物品＝存入；點倉庫物品＝取出（依「數量」欄，留空＝整疊全部）。鎖定中的物品需先解鎖才能存入。</div>
      <div class="wh-bar">
        <span class="wh-money">靈石　背包 <b>${fmt(G.player.spiritStone)}</b>　倉庫 <b>${fmt(w.stones)}</b></span>
        <input id="wh-stone-amt" type="number" min="1" value="1000" class="wh-push" aria-label="靈石數量">
        <button type="button" class="smallbtn good" data-wh-act="stone-in">存入 ▶</button>
        <button type="button" class="smallbtn" data-wh-act="stone-out">◀ 取出</button>
      </div>
      <div class="wh-bar">
        <span>搜尋</span><input id="wh-search" type="search" placeholder="跨分類搜尋名稱" value="${esc(search)}">
        <span>數量</span><input id="wh-qty" type="number" min="1" placeholder="全部" value="${esc(qtyInput)}">
        <button type="button" class="smallbtn hot wh-push" data-wh-act="one-click" title="把背包中與倉庫現有同名的道具全部存入；鎖定物品不動">一鍵存入</button>
        <button type="button" class="smallbtn" data-wh-act="sort">一鍵排列</button>
      </div>
      <div class="wh-tabs">${tabs}</div>
      <div class="wh-cols">
        <div><div class="wh-col-head inv">背包（點擊存入 ▶）<small>${fmt(invView.length)} 格</small></div><div class="wh-list" id="wh-inv-list">${invHtml}</div></div>
        <div><div class="wh-col-head store">倉庫（點擊取出 ◀）<small>${w.items.length}/${WH_MAX}</small></div><div class="wh-list" id="wh-store-list">${whHtml}</div></div>
      </div>`;
    $id('wh-inv-list').scrollTop = invScroll;
    $id('wh-store-list').scrollTop = whScroll;
    if (searching) { const s = $id('wh-search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  }

  function isOpen(){ const win = $id('warehouse-window'); return !!win && !win.classList.contains('hidden'); }
  function open(){
    if (typeof GAME_ACTIVE !== 'undefined' && !GAME_ACTIVE) return;
    if (!G.selected) return toast('請先建立角色');
    const win = $id('warehouse-window');
    win.classList.remove('hidden');
    win.setAttribute('aria-hidden', 'false');
    render();
  }
  function close(){
    const win = $id('warehouse-window');
    if (!win) return;
    win.classList.add('hidden');
    win.setAttribute('aria-hidden', 'true');
  }

  function build(){
    const sec = document.createElement('section');
    sec.id = 'warehouse-window';
    sec.className = 'hidden';
    sec.setAttribute('aria-label', '共用倉庫');
    sec.setAttribute('aria-hidden', 'true');
    sec.innerHTML = `<div id="warehouse-window-frame" role="dialog" aria-labelledby="warehouse-window-title">
      <header id="warehouse-window-drag"><div><h2 id="warehouse-window-title">共用倉庫</h2><span>背包與倉庫之間存入／取出物品</span></div><button type="button" class="smallbtn" id="warehouse-window-close">關閉</button></header>
      <div id="warehouse-window-content"></div></div>`;
    document.body.appendChild(sec);
    const frame = $id('warehouse-window-frame'), handle = $id('warehouse-window-drag'), content = $id('warehouse-window-content');
    $id('warehouse-window-close').onclick = close;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(); });

    content.addEventListener('click', e => {
      const dep = e.target.closest('[data-wh-dep]');
      if (dep && !dep.disabled) { if (deposit(invView[+dep.dataset.whDep])) afterChange(); return; }
      const wd = e.target.closest('[data-wh-wd]');
      if (wd) { withdraw(wd.dataset.whWd); return; }
      const f = e.target.closest('[data-wh-filter]');
      if (f) { filter = f.dataset.whFilter; search = ''; render(); return; }
      const act = e.target.closest('[data-wh-act]');
      if (!act) return;
      const a = act.dataset.whAct;
      if (a === 'stone-in') stones('in');
      else if (a === 'stone-out') stones('out');
      else if (a === 'one-click') oneClickDeposit();
      else if (a === 'sort') sortWh();
    });
    let composing = false;
    content.addEventListener('compositionstart', () => { composing = true; });
    content.addEventListener('compositionend', e => { composing = false; if (e.target.id === 'wh-search') { search = e.target.value.trim(); render(); } });
    content.addEventListener('input', e => {
      if (e.target.id === 'wh-qty') qtyInput = e.target.value;
      else if (e.target.id === 'wh-search' && !composing) { search = e.target.value.trim(); render(); }
    });

    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('button, input, select') || innerWidth <= 560) return;
      const r = frame.getBoundingClientRect();
      drag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const maxX = Math.max(0, innerWidth - frame.offsetWidth), maxY = Math.max(0, innerHeight - frame.offsetHeight);
      frame.style.left = Math.max(0, Math.min(maxX, e.clientX - drag.dx)) + 'px';
      frame.style.top = Math.max(0, Math.min(maxY, e.clientY - drag.dy)) + 'px';
      frame.style.transform = 'none';
    });
    const stop = e => { if (drag && drag.id === e.pointerId) drag = null; };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  build();
  Object.assign(window, { openWarehouseWindow: open, closeWarehouseWindow: close, warehouseWindowIsOpen: isOpen, renderWarehouseWindow: render });
})();
