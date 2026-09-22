/* ============================================================
   天下無雙放置版 — 登入頁／角色選擇／創建角色
   版面參考 idle-lineage：登入（點任意處）→ 角色選擇（4 個角色欄位）→ 創建角色 → 進入遊戲
   存檔：第 1 格沿用原本的 SAVE_KEY_BASE（舊存檔自動成為第 1 格），第 2～4 格為 SAVE_KEY_BASE + '_slot' + n
   人物立繪：PORTRAITS 留空＝黑底空框；之後放入圖片路徑即可顯示
   ============================================================ */
(function(){
  'use strict';
  const SLOT_COUNT = 4;
  const LAST_SLOT_KEY = 'txws_last_slot';
  const LEGACY_FLAG = 'txws_legacy_migrated';
  const ATTR_KEYS = ['狠','準','穩','快','智'];

  /* 人物立繪（空字串＝以黑圖代替）。例如：劍宗:{m:'assets/char/sword_m.png',f:'assets/char/sword_f.png'} */
  const PORTRAITS = {
    劍宗:{m:'',f:''}, 戟門:{m:'',f:''}, 詭流:{m:'',f:''}, 幻道:{m:'',f:''}
  };

  const CLASS_LORE = {
    劍宗:'劍宗弟子以劍入道，\n招式之多、變化之繁，冠絕四門。\n\n他們身法輕靈，\n以「快」搶得先機、以「狠」一擊破敵，\n在近身纏鬥中最能發揮所長。\n\n劍宗的防禦並不厚重，\n但只要掌握出手時機，\n連綿不絕的劍招\n足以在敵人反應之前結束戰鬥。\n\n若你嚮往快意恩仇的江湖，\n劍宗便是你的道路。',
    戟門:'戟門承襲沙場征戰之術，\n重甲長戟，一招一式皆大開大闔。\n\n他們的招式範圍廣闊，\n單招破壞力為四門之首，\n並以「狠」與「穩」立足戰場，\n能在最前線承受敵人的攻勢。\n\n戟門身法較為遲緩，\n卻擁有無人能及的耐久與威壓。\n\n若你願意為同伴擋下刀鋒，\n並以一戟橫掃千軍，\n戟門將成就你的威名。',
    詭流:'詭流行走於虛實之間，\n以鏜為兵，擅長遠距離攻擊，\n並兼修玄妙的風水之術。\n\n他們極重「準」，\n在敵人近身之前便已命中要害；\n又以「智」驅使風水術，\n牽制、控場，令敵人寸步難行。\n\n詭流的正面防禦薄弱，\n卻總能在距離與地勢中\n找到最有利的位置。\n\n若你喜愛運籌帷幄，\n詭流的奇詭之道正等著你。',
    幻道:'幻道修士不以蠻力取勝，\n而是鑽研天地之間的咒術。\n\n他們的一般攻擊較弱，\n但以「智」驅動的咒術威力驚人，\n隨著修為提升，\n更能以法力扭轉整場戰局。\n\n幻道在初入江湖時看似柔弱，\n需要耐心累積修為與法寶，\n一旦大成，\n便是眾人不敢輕視的存在。\n\n若你相信智慧勝於刀劍，\n就踏上幻道吧。'
  };

  const $id = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => Math.floor(Number(n) || 0).toLocaleString('zh-TW');
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } }
  function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }

  function slotKey(n){ return n === 1 ? SAVE_KEY_BASE : SAVE_KEY_BASE + '_slot' + n; }
  function useSlot(n){ SAVE_SLOT = n; SAVE_KEY = slotKey(n); lsSet(LAST_SLOT_KEY, String(n)); }

  /* 舊版單一存檔 → 第 1 格（僅執行一次） */
  function migrateLegacy(){
    if (lsGet(LEGACY_FLAG)) return;
    if (!lsGet(SAVE_KEY_BASE) && typeof LEGACY_KEYS !== 'undefined') {
      for (const key of LEGACY_KEYS) { const raw = lsGet(key); if (raw) { lsSet(SAVE_KEY_BASE, raw); break; } }
    }
    lsSet(LEGACY_FLAG, '1');
  }

  function summary(n){
    const raw = lsGet(slotKey(n));
    if (!raw) return null;
    let s;
    try { s = JSON.parse(raw); } catch(e){ return { broken:true, name:'存檔損毀', cls:'—' }; }
    if (!s || typeof s !== 'object' || !s.selected || !s.player || !s.player.classKey) return null;
    const p = s.player, st = p.stats || {}, attr = p.attr || {};
    const map = (typeof maps !== 'undefined' && maps.find(m => m.id === s.map)) || null;
    const pw = Math.round((st.atk||0)*10 + (st.def||0)*8 + (st.maxHp||0)*.28 + (st.maxMp||0)*.2 + (st.speed||0)*14);
    return {
      name: s.name || p.name || '少俠', cls: p.classKey, gender: p.gender === 'f' ? 'f' : 'm',
      mode: s.mode === 'qiyuan' ? 'qiyuan' : 'normal',
      lv: p.level || 1, map: map ? map.name : '—', power: pw,
      hp: st.hp, mhp: st.maxHp, mp: st.mp, mmp: st.maxMp, def: st.def,
      attr, stone: p.spiritStone || 0
    };
  }

  function portraitHtml(cls, gender){
    const src = cls && PORTRAITS[cls] ? PORTRAITS[cls][gender || 'm'] : '';
    return `<div class="lb-portrait">${src ? `<img src="${esc(src)}" alt="${esc(cls)}" draggable="false">` : ''}</div>`;
  }

  /* ---------------- DOM ---------------- */
  function build(){
    const root = document.createElement('div');
    root.id = 'lobby';
    root.innerHTML = `
    <div class="lb-stage" id="lb-login" aria-label="登入畫面">
      <div class="lb-login-blur" aria-hidden="true"></div>
      <img class="lb-login-art" src="圖片/login-bg.jpg" alt="天下無雙" draggable="false">
      <div class="lb-login-vignette" aria-hidden="true"></div>
      <div class="lb-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div id="lb-login-panel">
        <div id="lb-login-title">
          <span class="lb-seal">放置版</span>
          <h1>天下無雙</h1>
          <p>創造您的角色　闖蕩江湖</p>
          <div class="lb-rule"><i></i></div>
        </div>
        <div id="lb-login-menu">
          <button class="lb-btn" type="button" data-act="open-select">開始遊戲</button>
          <button class="lb-btn ghost" type="button" data-act="fullscreen">全螢幕</button>
          <p class="lb-tap-hint">點擊畫面任意處進入</p>
        </div>
        <div id="lb-login-meta">
          <div id="lb-login-version"></div>
          <div id="lb-login-note">角色存檔保存在此瀏覽器；最多 4 名角色，共用同一個倉庫。更換裝置前請先在角色選擇畫面「匯出進度」。</div>
          <div id="lb-login-disclaimer">本遊戲為非官方免費同人放置作品，絕無營利意圖；遊戲名稱、職業與世界觀相關權利歸原權利方所有，嚴禁商業販售。</div>
        </div>
      </div>
    </div>

    <div class="lb-stage hidden" id="lb-select" aria-label="角色選擇">
      <div id="lb-slot-grid" aria-label="存檔角色"></div>
      <div id="lb-select-ornament" aria-hidden="true"><i></i></div>
      <div class="lb-frame" id="lb-select-panel">
        <section id="lb-info" aria-live="polite">
          <div class="lb-info-row"><span>角色名稱</span><strong id="lbi-name"></strong></div>
          <div class="lb-info-row"><span>門派</span><strong id="lbi-cls"></strong></div>
          <div class="lb-info-row"><span>所在地圖</span><strong id="lbi-map"></strong></div>
          <div class="lb-info-row"><span>戰力</span><strong id="lbi-power"></strong></div>
          <div class="lb-info-row hp"><span>氣血</span><strong id="lbi-hp"></strong></div>
          <div class="lb-info-row mp"><span>法力</span><strong id="lbi-mp"></strong></div>
          <div class="lb-info-row"><span>防禦</span><strong id="lbi-def"></strong></div>
          <div class="lb-info-row"><span>等級</span><strong id="lbi-lv"></strong></div>
          <div class="lb-info-row"><span>狠</span><strong id="lbi-狠"></strong></div>
          <div class="lb-info-row"><span>準</span><strong id="lbi-準"></strong></div>
          <div class="lb-info-row"><span>穩</span><strong id="lbi-穩"></strong></div>
          <div class="lb-info-row"><span>快</span><strong id="lbi-快"></strong></div>
          <div class="lb-info-row"><span>智</span><strong id="lbi-智"></strong></div>
          <div class="lb-info-row"><span>靈石</span><strong id="lbi-stone"></strong></div>
        </section>
        <div id="lb-actions">
          <button class="lb-btn" type="button" id="lb-btn-create" data-act="create">創新角色</button>
          <button class="lb-btn" type="button" id="lb-btn-import" data-act="import">匯入進度</button>
          <button class="lb-btn wide" type="button" id="lb-btn-enter" data-act="enter">進入遊戲</button>
          <button class="lb-btn" type="button" id="lb-btn-export" data-act="export">匯出進度</button>
          <button class="lb-btn danger" type="button" id="lb-btn-delete" data-act="delete">刪除角色</button>
          <button class="lb-btn wide" type="button" data-act="back-login">返回</button>
        </div>
      </div>
    </div>

    <div class="lb-stage hidden" id="lb-create" aria-label="創建角色">
      <div class="lb-frame" id="lb-create-frame">
        <i class="lb-gem"></i>
        <div id="lb-create-portrait"></div>
        <div id="lb-create-classname">選擇門派</div>
        <div id="lb-create-gender-tag"></div>
      </div>
      <div class="lb-frame" id="lb-create-desc" aria-live="polite"></div>
      <div id="lb-create-side">
        <div><h3 class="lb-sec-title">門派</h3><nav id="lb-class-list" aria-label="門派選擇"></nav></div>
        <div><h3 class="lb-sec-title">性別</h3>
          <div id="lb-gender">
            <button type="button" class="lb-gender-btn" data-gender="m" title="男性">♂</button>
            <button type="button" class="lb-gender-btn" data-gender="f" title="女性">♀</button>
          </div>
        </div>
        <div><h3 class="lb-sec-title">模式（建立後無法更改）</h3>
          <div id="lb-mode">
            <button type="button" class="lb-mode-btn" data-mode="normal">一般模式</button>
            <button type="button" class="lb-mode-btn" data-mode="qiyuan">奇緣模式</button>
          </div>
          <div id="lb-mode-desc"></div>
        </div>
        <div id="lb-name-row"><label for="startName">角色名稱</label><input id="startName" class="lb-input" maxlength="16" placeholder="輸入角色名稱，例如：無雙劍客" autocomplete="off"></div>
        <div><h3 class="lb-sec-title">初始屬性</h3><div id="lb-stats"></div></div>
        <div id="lb-create-meta"></div>
        <div id="lb-create-buttons">
          <button class="lb-btn" type="button" data-act="create-back">返回</button>
          <button class="lb-btn" type="button" id="lb-btn-start" data-act="create-start" disabled>開始遊戲</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(root);
    const ver = $id('lb-login-version');
    if (ver) ver.textContent = (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '').replace(/^v/i, 'V');
    root.addEventListener('click', onClick);
    root.addEventListener('dblclick', e => {
      const slot = e.target.closest('.lb-slot');
      if (slot && summary(+slot.dataset.slot)) enterSlot(+slot.dataset.slot);
    });
    $id('startName').addEventListener('input', updateCreateButtons);
    $id('startName').addEventListener('keydown', e => { if (e.key === 'Enter') createStart(); });
    return root;
  }

  let selected = 1, createCls = null, createGender = 'm', createMode = 'normal';
  const MODE_INFO = {
    normal: { name: '一般模式', desc: '可自由強化、精煉、鑲嵌與 3合1 升品；倉庫與其他一般模式角色共用。' },
    qiyuan: { name: '奇緣模式', desc: '裝備無法以任何方式強化，只能靠打怪掉落；掉落裝備隨機帶有品階、強度與強化值。倉庫與一般模式分開、不共通。' }
  };

  function show(which){
    const root = $id('lobby');
    root.classList.remove('hidden');
    ['lb-login','lb-select','lb-create'].forEach(id => $id(id).classList.toggle('hidden', id !== which));
  }
  function hideLobby(){ $id('lobby').classList.add('hidden'); }

  function onClick(e){
    const slot = e.target.closest('.lb-slot');
    if (slot) { selectSlot(+slot.dataset.slot); return; }
    const cls = e.target.closest('[data-class]');
    if (cls) { pickClass(cls.dataset.class); return; }
    const gd = e.target.closest('[data-gender]');
    if (gd) { pickGender(gd.dataset.gender); return; }
    const md = e.target.closest('[data-mode]');
    if (md) { pickMode(md.dataset.mode); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) {
      // 登入畫面：點任意處（全螢幕鈕以外）直接進入角色選擇
      if (e.target.closest('#lb-login')) openSelect();
      return;
    }
    const act = btn.dataset.act;
    if (act === 'open-select') openSelect();
    else if (act === 'fullscreen') lobbyFullscreen();
    else if (act === 'back-login') show('lb-login');
    else if (act === 'enter') enterSlot(selected);
    else if (act === 'create') openCreate();
    else if (act === 'import') importSlot(selected);
    else if (act === 'export') exportSlot(selected);
    else if (act === 'delete') deleteSlot(selected);
    else if (act === 'create-back') openSelect(selected);
    else if (act === 'create-start') createStart();
  }

  function lobbyFullscreen(){
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }

  /* ---------------- 角色選擇 ---------------- */
  function openSelect(prefer){
    let n = Number(prefer) || Number(lsGet(LAST_SLOT_KEY)) || 0;
    if (!(n >= 1 && n <= SLOT_COUNT)) n = 0;
    if (!n) { n = 1; for (let i = 1; i <= SLOT_COUNT; i++) if (summary(i)) { n = i; break; } }
    selected = n;
    lastClickSlot = 0; lastClickAt = 0;
    show('lb-select');
    renderSelect();
  }
  /* 拱門內連點兩下＝直接進入遊戲。
     （第一下若整塊重繪，原生 dblclick 會因為節點被換掉而不觸發，所以這裡自己判斷間隔） */
  let lastClickSlot = 0, lastClickAt = 0;
  function selectSlot(n){
    const now = Date.now();
    const dbl = (n === lastClickSlot && now - lastClickAt <= 600);
    lastClickSlot = n; lastClickAt = now;
    const s = summary(n);
    if (dbl && s && !s.broken) { lastClickSlot = 0; enterSlot(n); return; }
    if (n === selected) { updateInfo(); return; }   // 已選取：不重繪，保留節點
    selected = n;
    renderSelect();
  }

  function renderSelect(){
    let html = '';
    for (let n = 1; n <= SLOT_COUNT; n++) {
      const s = summary(n);
      const label = s ? `${esc(s.name)}<small>${esc(s.cls)} Lv.${s.lv || '—'}</small>${s.mode === 'qiyuan' ? '<em class="lb-mode-tag">奇緣模式</em>' : ''}` : '空白';
      html += `<button type="button" class="lb-slot ${s ? 'filled' : 'empty'} ${n === selected ? 'selected' : ''}" data-slot="${n}" title="${s ? '雙擊進入遊戲' : '空白存檔'}">
        <div class="lb-arch-top"></div>
        <div class="lb-arch-body">${portraitHtml(s && s.cls, s && s.gender)}<span class="lb-slot-label">${label}</span><span class="lb-slot-num">存檔 ${n}</span></div>
        <div class="lb-arch-base"></div>
      </button>`;
    }
    $id('lb-slot-grid').innerHTML = html;
    updateInfo();
  }

  function updateInfo(){
    const s = summary(selected), empty = !s, broken = !!(s && s.broken);
    const set = (id, v) => { const el = $id(id); if (el) el.textContent = empty ? '' : v; };
    const a = (s && s.attr) || {};
    set('lbi-name', s ? s.name : '');
    set('lbi-cls', s ? (s.broken ? s.cls : `${s.cls}・${MODE_INFO[s.mode].name}`) : '');
    set('lbi-map', broken ? '' : s && s.map);
    set('lbi-power', broken ? '' : s && num(s.power));
    set('lbi-hp', broken ? '' : s && `${num(s.hp)} / ${num(s.mhp)}`);
    set('lbi-mp', broken ? '' : s && `${num(s.mp)} / ${num(s.mmp)}`);
    set('lbi-def', broken ? '' : s && num(s.def));
    set('lbi-lv', broken ? '' : s && s.lv);
    ATTR_KEYS.forEach(k => set('lbi-' + k, broken || a[k] == null ? '' : String(Math.round(Number(a[k]) * 10) / 10)));
    set('lbi-stone', broken ? '' : s && num(s.stone));
    $id('lb-btn-create').classList.toggle('hidden', !empty);
    $id('lb-btn-import').classList.toggle('hidden', !empty);
    $id('lb-btn-enter').classList.toggle('hidden', empty || broken);
    $id('lb-btn-export').classList.toggle('hidden', empty || broken);
    $id('lb-btn-delete').classList.toggle('hidden', empty);
  }

  function enterSlot(n){
    const s = summary(n);
    if (!s || s.broken) return;
    useSlot(n);
    try { if (typeof closeBattleScreen === 'function') closeBattleScreen(); } catch(e){}
    battle = null; pendingBoss = null;
    load();
    GAME_ACTIVE = true;
    applyScreenMode();
    activePanel = (G.setting && G.setting.lastPanel) || 'home';
    hideLobby();
    renderAll();
    save(true);
    toast(`歡迎回來，${G.name || '少俠'}`);
  }

  function exportSlot(n){
    const raw = lsGet(slotKey(n));
    if (!raw) return;
    try { prompt(`存檔 ${n} 的存檔碼（請完整複製保存）`, 'TXWS510:' + btoa(unescape(encodeURIComponent(raw)))); }
    catch(e){ alert('匯出失敗'); }
  }
  function importSlot(n){
    if (summary(n)) { alert(`存檔 ${n} 已有角色，請先刪除角色後再匯入。`); return; }
    const code = prompt(`貼上要匯入到「存檔 ${n}」的存檔碼（TXWS510／TXWS520／舊版皆可）`);
    if (!code) return;
    let obj;
    try { obj = JSON.parse(decodeURIComponent(escape(atob(code.trim().replace(/^TXWS\d+:/, ''))))); }
    catch(e){ alert('存檔碼無效'); return; }
    if (!obj || typeof obj !== 'object' || !obj.player) { alert('存檔碼內容不正確'); return; }
    obj.offlineAt = Date.now();   // 匯入不發放離線收益
    if (!lsSet(slotKey(n), JSON.stringify(obj))) { alert('無法寫入存檔（瀏覽器儲存空間不足或被封鎖）'); return; }
    renderSelect();
    alert(summary(n) ? `已匯入到存檔 ${n}。` : `已匯入到存檔 ${n}，但此存檔尚未建立角色，需要重新創建。`);
  }
  function deleteSlot(n){
    const s = summary(n);
    if (!s) { renderSelect(); return; }
    const expected = s.name;
    const typed = prompt(`即將刪除存檔 ${n}：${s.cls} Lv.${s.lv || '—'} ${expected}\n\n刪除後才能在此欄位創建新角色或匯入進度。\n請輸入角色名稱「${expected}」確認刪除：`, '');
    if (typed === null) return;
    if (typed.trim() !== expected) { alert('角色名稱不正確，已取消刪除。'); return; }
    if (!confirm(`確定永久刪除「${expected}」嗎？\n角色存檔將刪除；共用倉庫內的物品與靈石會保留。`)) return;
    lsDel(slotKey(n));
    renderSelect();
    alert(`角色「${expected}」已刪除。`);
  }

  /* ---------------- 創建角色 ---------------- */
  function openCreate(){
    if (summary(selected)) { alert(`存檔 ${selected} 已有角色，請先刪除角色後再創建新角色。`); return; }
    createCls = null; createGender = 'm';
    $id('lb-class-list').innerHTML = Object.entries(CLASSES).map(([k, c]) =>
      `<button type="button" class="lb-class-btn" data-class="${esc(k)}" title="${esc(k)}">${esc(c.icon)}<small>${esc(k)}</small></button>`).join('');
    $id('startName').value = '';
    show('lb-create');
    pickClass(Object.keys(CLASSES)[0]);
    pickGender('m');
    pickMode('normal');
  }
  function pickMode(m){
    createMode = m === 'qiyuan' ? 'qiyuan' : 'normal';
    document.querySelectorAll('.lb-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === createMode));
    $id('lb-mode-desc').textContent = MODE_INFO[createMode].desc;
  }
  function pickClass(k){
    const c = CLASSES[k];
    if (!c) return;
    createCls = k;
    document.querySelectorAll('.lb-class-btn').forEach(b => b.classList.toggle('active', b.dataset.class === k));
    $id('lb-create-classname').textContent = k;
    $id('lb-create-desc').textContent = CLASS_LORE[k] || c.desc || '';
    $id('lb-stats').innerHTML = ATTR_KEYS.map(a => `<div class="lb-stat"><span>${a}</span><strong>${c.attrs[a]}</strong></div>`).join('')
      + `<div class="lb-stat growth"><span>主修</span><strong>${esc(c.ai.focus)}</strong></div>`;
    const skills = (typeof CLASS_SKILLS !== 'undefined' && CLASS_SKILLS[k]) || [];
    $id('lb-create-meta').innerHTML = `<b>武器：</b>${esc(c.weapon)}　<b>起始神通：</b>${esc(skills.join('、') || '—')}<br><span style="opacity:.8">建立於存檔 ${selected}；起始屬性依門派固定，之後靠升級與天賦成長。</span>`;
    renderCreatePortrait();
    updateCreateButtons();
  }
  function pickGender(g){
    createGender = g === 'f' ? 'f' : 'm';
    document.querySelectorAll('.lb-gender-btn').forEach(b => b.classList.toggle('active', b.dataset.gender === createGender));
    $id('lb-create-gender-tag').textContent = createGender === 'f' ? '女' : '男';
    renderCreatePortrait();
  }
  function renderCreatePortrait(){ $id('lb-create-portrait').innerHTML = portraitHtml(createCls, createGender); }
  function updateCreateButtons(){ $id('lb-btn-start').disabled = !createCls || !$id('startName').value.trim(); }

  function createStart(){
    const name = $id('startName').value.trim();
    if (!createCls) return;
    if (!name) { $id('startName').focus(); return; }
    if (summary(selected)) { alert(`存檔 ${selected} 已有角色，無法直接覆蓋。`); openSelect(selected); return; }
    $id('startName').value = name.slice(0, 16);
    useSlot(selected);
    try { if (typeof closeBattleScreen === 'function') closeBattleScreen(); } catch(e){}
    battle = null; pendingBoss = null;
    G = freshState();
    normalize();
    G.player.gender = createGender;
    G.mode = createMode;
    GAME_ACTIVE = true;
    applyScreenMode();
    hideLobby();
    chooseClass(createCls);   // 沿用原本的創角流程：學神通、起始裝備、存檔、開始掛機
  }

  /* ---------------- 啟動 ---------------- */
  function boot(){
    migrateLegacy();
    build();
    const fromLogout = sessionStorage.getItem('txws_logout') === '1';
    sessionStorage.removeItem('txws_logout');
    if (fromLogout) openSelect(); else show('lb-login');
  }
  window.TXWSLobby = { openSelect, enterSlot, summary, slotKey };
  boot();
})();
