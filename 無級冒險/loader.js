// ==========================================================================
// 無級冒險・書籤工具 loader.js
// 透過書籤動態載入（javascript:import('.../無級冒險/loader.js?v='+Date.now())）。
// 功能：存檔修改、存檔備份匯入匯出、電腦版跳過「請用手機遊玩」畫面。
// 遊戲是純前端單機，存檔在 localStorage（存檔 2 的鍵名前面多 slot2:），
// 所以修改都是改 localStorage 後用 sessionStorage 的 resumeSlot 重新載入。
// 技能／寶箱／營火清單是從 2026-10-09 的遊戲版本抓出來的，遊戲改版後要對照更新。
// ==========================================================================
(() => {
  const ID = 'wjt-root';
  const old = document.getElementById(ID);
  if (old) { old.remove(); if (window.game && window.game.setPaused) window.game.setPaused(false, 'wjt'); return; }
  if (!/wuji-adventure/.test(location.host)) { alert('請先打開「無級冒險」的網頁，再點這個書籤。'); return; }

  const LS = localStorage;
  const GLOBAL = ['audio-v1', 'fps-v1', 'lastSlot-v1'];
  const KNOWN = ['tutorial-v2', 'campfires-v1', 'chests-v1', 'loadout-v1', 'gear-v1', 'quests-v1', 'swamp-v1', 'plateau-v1', 'coral-v1', 'breakables-v1', 'arrows-v1', 'deadTrees-v1', 'achievements-v1', 'played-v1'];
  const ITEMS = [['sword', '劍', 0], ['hammer', '槌', 1], ['wand', '法杖', 1], ['bow', '弓', 1], ['shield', '盾', 1], ['lightArmor', '輕甲', 0], ['plate', '重甲', 1], ['cloak', '斗篷', 1], ['fireflyRobe', '法袍', 1]];
  const ALL_ITEMS = ITEMS.map((i) => i[0]).concat(['quiver', 'feather', 'earring', 'shadowHeart']);
  const SKILLS = [['dash', '突進刺', '劍'], ['whirlwind', '旋風斬', '劍'], ['swiftCombo', '疾風連擊', '劍'], ['sunder', '破甲斬', '劍'], ['swordWave', '劍氣斬', '劍'], ['slam', '震地擊', '槌'], ['chargeSmash', '蓄力重擊', '槌'], ['warCry', '戰吼', '槌'], ['armorBreak', '碎甲', '槌'], ['thunderStrike', '雷霆一擊', '槌'], ['bash', '盾擊', '盾'], ['shieldMastery', '盾牌專精', '盾'], ['fireball', '火球術', '杖'], ['starfall', '星落', '杖'], ['frostNova', '冰霜新星', '杖'], ['chainLightning', '雷鳴鏈', '杖'], ['heal', '治癒之光', '杖'], ['pierceShot', '穿透箭', '弓'], ['pinShot', '定身箭', '弓'], ['scatterShot', '散射', '弓'], ['arrowRain', '流星箭雨', '弓'], ['hawkEye', '鷹眼', '弓'], ['toughness', '強韌', '通用']];
  const CHESTS = [['plateauFeather', '高原', '疾風羽毛'], ['plateauNorth', '高原', '符文'], ['plateauLedge', '高原', '符文'], ['plateauHighCliff', '高原', '符文'], ['swampCloak', '沼澤', '斗篷＋定身箭'], ['swampLedge', '沼澤', '符文'], ['forestHut', '森林', '法杖＋火球術'], ['forestVines', '森林', '法袍'], ['forestLedge', '森林', '符文'], ['mineStore', '礦坑', '重甲'], ['mineWallA', '礦坑', '符文'], ['mineWallB', '礦坑', '符文'], ['snowCave', '雪嶺', '冰霜新星＋符文'], ['snowFalls', '雪嶺', '符文'], ['coralWreck', '海灣', '散射'], ['coralCave', '海灣', '符文'], ['ruinsDeep1', '遺跡', '符文'], ['ruinsDeep2', '遺跡', '符文'], ['volcanoIsland', '火山', '碎甲＋符文'], ['volcanoLedge', '火山', '符文']];
  const FIRES = [['camp1', '草原營火'], ['camp2', '野豬王巢穴前'], ['plateauGate', '高原入口'], ['plateauHub', '風車村'], ['swampGate', '沼澤入口'], ['swampPond', '睡蓮池'], ['forestGate', '林間入口'], ['forestHut', '法師小屋'], ['forestClearing', '空地前'], ['mineGate', '坑口'], ['mineForge', '矮人工坊'], ['mineCavern', '大礦穴前'], ['snowFoot', '雪嶺山腳'], ['snowCamp', '尋寶人的營地'], ['coralGate', '海灣入口'], ['coralDock', '漁夫碼頭'], ['desertGate', '沙丘入口'], ['desertTent', '諾拉的帳篷'], ['volcanoFoot', '火山山腳'], ['volcanoCamp', '葛蕾的營地'], ['templeGate', '神殿門前']];

  const key = (s, k) => (s === 1 ? k : 'slot' + s + ':' + k);
  const slotKeys = (s) => {
    const p = 'slot' + s + ':';
    return Object.keys(LS)
      .filter((k) => (s === 1 ? !/^slot\d+:/.test(k) && !GLOBAL.includes(k) : k.startsWith(p)))
      .map((k) => (s === 1 ? k : k.slice(p.length)));
  };
  const get = (s, k, d) => { try { const v = JSON.parse(LS.getItem(key(s, k))); return v == null ? d : v; } catch (e) { return d; } };
  const set = (s, k, v) => LS.setItem(key(s, k), JSON.stringify(v));
  const enter = (s) => { sessionStorage.setItem('resumeSlot', String(s)); location.reload(); };
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));

  let slot = Number(LS.getItem('lastSlot-v1')) === 2 ? 2 : 1;
  let tab = 'edit';
  let msg = '';

  const root = document.createElement('div');
  root.id = ID;
  const css = document.createElement('style');
  css.textContent = `
#${ID}{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:stretch;font:15px/1.5 system-ui,"Microsoft JhengHei","PingFang TC",sans-serif;color:#2f2116;-webkit-user-select:text;user-select:text;touch-action:auto}
#${ID} *{box-sizing:border-box;font:inherit;color:inherit;letter-spacing:0}
#${ID} .wp{background:#fbf3df;width:min(460px,100%);display:flex;flex-direction:column;max-height:100%}
#${ID} .wh{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#5a4028;color:#f3e6c8}
#${ID} .wh b{flex:1;font-weight:900;font-size:16px}
#${ID} .wt{display:flex;background:#e9dbb8}
#${ID} .wt button{flex:1;border:0;border-radius:0;background:none;padding:10px 4px;font-weight:700;border-bottom:3px solid transparent}
#${ID} .wt button.on{border-bottom-color:#c0672a;background:#fbf3df}
#${ID} .wb{overflow:auto;padding:12px;flex:1;-webkit-overflow-scrolling:touch}
#${ID} h4{margin:16px 0 6px;font-weight:900;font-size:15px;border-left:4px solid #c0672a;padding-left:8px}
#${ID} h4:first-child{margin-top:0}
#${ID} p{margin:4px 0 8px;font-size:13px;color:#6b5540}
#${ID} button,#${ID} select,#${ID} input,#${ID} textarea{border:1px solid #a58a62;border-radius:8px;background:#fff;padding:7px 10px;min-height:38px;margin:0}
#${ID} button{background:#f0e2bd;font-weight:700;cursor:pointer}
#${ID} button.pri{background:#c0672a;color:#fff;border-color:#8f4718}
#${ID} button.sm{min-height:30px;padding:3px 10px;font-size:13px}
#${ID} .wh select,#${ID} .wh button{background:#fbf3df;color:#2f2116;min-height:34px;padding:4px 10px}
#${ID} textarea{width:100%;height:120px;font:12px/1.4 ui-monospace,Consolas,monospace;resize:vertical}
#${ID} input[type=number]{width:90px}
#${ID} input[type=checkbox]{min-height:0;width:18px;height:18px;padding:0;flex:none;accent-color:#c0672a}
#${ID} .row{display:flex;align-items:center;gap:8px;margin:6px 0;flex-wrap:wrap}
#${ID} .row>span{flex:1;min-width:120px}
#${ID} .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}
#${ID} .grid label{display:flex;align-items:center;gap:6px;min-height:32px;font-size:14px}
#${ID} .grid small{color:#8a7458;font-size:12px}
#${ID} .wf{padding:10px 12px;background:#e9dbb8;display:flex;gap:8px;align-items:center}
#${ID} .wf span{flex:1;font-size:13px;color:#8f2f18;font-weight:700}
#${ID} .warn{background:#fff1c9;border:1px solid #e0b34a;border-radius:8px;padding:8px 10px;font-size:13px;margin:8px 0}
`;

  const checks = (name, list, on) =>
    '<div class="grid">' + list.map((r) =>
      '<label><input type="checkbox" data-g="' + name + '" value="' + r[0] + '"' + (on.includes(r[0]) ? ' checked' : '') + '><span>' + r[1] + (r[2] ? ' <small>' + r[2] + '</small>' : '') + '</span></label>').join('') + '</div>';
  const head = (title, g) => '<h4>' + title + '</h4>' + (g ? '<div class="row"><button class="sm" data-act="all" data-g="' + g + '">全選</button><button class="sm" data-act="none" data-g="' + g + '">全不選</button></div>' : '');

  const viewEdit = () => {
    const gear = get(slot, 'gear-v1', {});
    const chests = get(slot, 'chests-v1', []);
    const camp = get(slot, 'campfires-v1', { lit: [] });
    const arrows = get(slot, 'arrows-v1', {}).count;
    const coral = get(slot, 'coral-v1', {});
    const lv = gear.levels || {};
    const exists = slotKeys(slot).length > 0;
    return (exists ? '' : '<div class="warn">存檔 ' + slot + ' 目前是空的。可以先修改再進入，遊戲會從頭開始並套用這些設定。</div>') +
      '<h4>數值</h4>' +
      '<div class="row"><span>額外符文<br><small>鍛造升級用，會加在已找到的符文上</small></span><input type="number" id="wjt-runes" min="0" max="999" value="' + num(gear.devRunes, 0, 999) + '"></div>' +
      '<div class="row"><span>箭矢（上限 99）</span><input type="number" id="wjt-arrows" min="0" max="99" value="' + (Number.isFinite(arrows) ? arrows : 30) + '"></div>' +
      '<div class="row"><span>珊瑚碎片<br><small>珊瑚海灣潛水取得的材料</small></span><input type="number" id="wjt-shards" min="0" max="999" value="' + num(coral.shards, 0, 999) + '"></div>' +
      head('技能', 'skill') + '<p>勾選的技能會直接學會。要裝備對應武器才能使用。</p>' + checks('skill', SKILLS, Array.isArray(gear.devSkills) ? gear.devSkills : []) +
      '<h4>裝備等級</h4><p>只對已經擁有的裝備有效。「不指定」代表照遊戲進度。</p><div class="grid">' +
      ITEMS.map((i) => '<label><span style="flex:1">' + i[1] + '</span><select data-lv="' + i[0] + '"><option value="">不指定</option>' +
        [0, 1, 2, 3, 4, 5].filter((n) => n >= i[2]).map((n) => '<option' + (lv[i[0]] === n ? ' selected' : '') + ' value="' + n + '">Lv ' + n + '</option>').join('') + '</select></label>').join('') + '</div>' +
      '<div class="row"><button class="sm" data-act="maxlv">全部 Lv 5</button><button class="sm" data-act="nolv">全部不指定</button></div>' +
      head('寶箱（已開啟）', 'chest') + '<p>勾選等於已開過，會拿到裡面的裝備、技能和符文，地圖上的寶箱也會變成開啟狀態。</p>' + checks('chest', CHESTS, chests) +
      head('營火（已點亮）', 'fire') + '<p>點亮後可以在營火之間快速移動。</p>' + checks('fire', FIRES, Array.isArray(camp.lit) ? camp.lit : []) +
      '<h4>解鎖全部裝備（僅本次有效）</h4><p>槌、弓、盾、飾品等是靠劇情進度取得的，存檔裡沒有獨立欄位，所以只能在進行中的遊戲裡臨時解鎖，重新載入後會消失。</p>' +
      '<div class="row"><button data-act="items"' + (window.game ? '' : ' disabled') + '>' + (window.game ? '立即解鎖全部裝備' : '要先進入遊戲才能使用') + '</button></div>';
  };

  const viewBackup = () =>
    '<h4>匯出存檔 ' + slot + '</h4><p>把下面的文字存起來就是備份。也可以貼到另一台裝置匯入。</p>' +
    '<textarea id="wjt-out" readonly>' + esc(exportText()) + '</textarea>' +
    '<div class="row"><button data-act="copy">複製文字</button><button data-act="dl">下載成檔案</button></div>' +
    '<h4>匯入</h4><p>貼上備份文字，或選擇備份檔。匯入會<b>整個覆蓋</b>目標存檔。</p>' +
    '<textarea id="wjt-in" placeholder="在這裡貼上備份文字"></textarea>' +
    '<div class="row"><input type="file" id="wjt-file" accept=".json,.txt,application/json,text/plain" style="flex:1;min-width:0"></div>' +
    '<div class="row"><span>匯入到</span><select id="wjt-to"><option value="1"' + (slot === 1 ? ' selected' : '') + '>存檔 1</option><option value="2"' + (slot === 2 ? ' selected' : '') + '>存檔 2</option></select><button class="pri" data-act="import">匯入並進入</button></div>' +
    '<h4>清空存檔 ' + slot + '</h4><div class="row"><button data-act="wipe">清空這個存檔</button></div>';

  const viewRaw = () => {
    const keys = Array.from(new Set(slotKeys(slot).concat(KNOWN))).sort();
    return '<h4>進階：直接編輯原始資料</h4><p>存檔 ' + slot + ' 的每一筆資料都是 JSON。任務進度（quests-v1）、成就（achievements-v1）等沒有做成表單的項目可以在這裡改。改錯可能讓該項目被遊戲重設，建議先到「備份」匯出。</p>' +
      '<div class="row"><select id="wjt-key" style="flex:1">' + keys.map((k) => '<option>' + esc(k) + '</option>').join('') + '</select></div>' +
      '<textarea id="wjt-raw" style="height:220px"></textarea>' +
      '<div class="row"><button class="pri" data-act="rawsave">儲存這一項並重新載入</button><button data-act="rawdel">刪除這一項</button></div>';
  };

  const viewPc = () =>
    '<h4>電腦版遊玩</h4><p>遊戲偵測到滑鼠就會擋在標題畫面。按下面的按鈕會跳過標題畫面，直接進入存檔。每次回到標題畫面或重新整理後，再點一次書籤即可。</p>' +
    '<div class="row"><button class="pri" data-act="go" data-s="1">進入存檔 1</button><button class="pri" data-act="go" data-s="2">進入存檔 2</button></div>' +
    '<h4>鍵盤操作</h4><p>W A S D 移動　J 攻擊（按住連打）　K／空白鍵 閃避　L 換武器　1–5 技能</p>';

  const exportText = () => {
    const data = {};
    slotKeys(slot).forEach((k) => { data[k] = LS.getItem(key(slot, k)); });
    return JSON.stringify({ app: 'wuji-adventure', v: 1, slot: slot, at: new Date().toISOString(), data: data });
  };

  const render = () => {
    const tabs = [['edit', '修改'], ['backup', '備份'], ['raw', '進階'], ['pc', '電腦版']];
    const body = tab === 'edit' ? viewEdit() : tab === 'backup' ? viewBackup() : tab === 'raw' ? viewRaw() : viewPc();
    root.innerHTML = '<div class="wp"><div class="wh"><b>無級冒險工具</b>' +
      '<select id="wjt-slot"><option value="1"' + (slot === 1 ? ' selected' : '') + '>存檔 1</option><option value="2"' + (slot === 2 ? ' selected' : '') + '>存檔 2</option></select>' +
      '<button data-act="close">關閉</button></div>' +
      '<div class="wt">' + tabs.map((t) => '<button data-tab="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>').join('') + '</div>' +
      '<div class="wb">' + body + '</div>' +
      '<div class="wf"><span>' + esc(msg) + '</span>' + (tab === 'edit' ? '<button class="pri" data-act="save">儲存並重新載入</button>' : '') + '</div></div>';
    root.appendChild(css);
    if (tab === 'raw') loadRaw();
  };
  const say = (m) => { msg = m; const el = root.querySelector('.wf span'); if (el) el.textContent = m; };
  const $ = (q) => root.querySelector(q);
  const $$ = (q) => Array.from(root.querySelectorAll(q));
  const loadRaw = () => {
    const raw = LS.getItem(key(slot, $('#wjt-key').value));
    let text = raw == null ? '' : raw;
    try { if (raw != null) text = JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { text = raw; }
    $('#wjt-raw').value = text;
  };

  const saveEdit = () => {
    const picked = (g) => $$('input[data-g="' + g + '"]:checked').map((e) => e.value);
    const merge = (prev, known, now) => (Array.isArray(prev) ? prev : []).filter((id) => !known.some((r) => r[0] === id)).concat(now);
    const gear = get(slot, 'gear-v1', {});
    const runes = num($('#wjt-runes').value, 0, 999);
    if (runes) gear.devRunes = runes; else delete gear.devRunes;
    const skills = picked('skill');
    if (skills.length) gear.devSkills = skills; else delete gear.devSkills;
    gear.levels = gear.levels || {};
    $$('select[data-lv]').forEach((e) => { if (e.value === '') delete gear.levels[e.dataset.lv]; else gear.levels[e.dataset.lv] = Number(e.value); });
    gear.spentRunes = Number(gear.spentRunes) || 0;
    set(slot, 'gear-v1', gear);
    set(slot, 'chests-v1', merge(get(slot, 'chests-v1', []), CHESTS, picked('chest')));
    const camp = get(slot, 'campfires-v1', { lit: [], last: null });
    camp.lit = merge(camp.lit, FIRES, picked('fire'));
    if (!camp.lit.includes(camp.last)) camp.last = null;
    set(slot, 'campfires-v1', camp);
    set(slot, 'arrows-v1', { count: num($('#wjt-arrows').value, 0, 99) });
    const coral = get(slot, 'coral-v1', null);
    const shards = num($('#wjt-shards').value, 0, 999);
    if (coral || shards) set(slot, 'coral-v1', Object.assign({}, coral || {}, { shards: shards }));
    enter(slot);
  };

  const doImport = (text) => {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { say('這不是有效的備份文字'); return; }
    if (!obj || obj.app !== 'wuji-adventure' || !obj.data || typeof obj.data !== 'object') { say('這不是無級冒險的備份'); return; }
    const to = Number($('#wjt-to').value);
    if (!confirm('確定要用這份備份覆蓋存檔 ' + to + ' 嗎？原本的進度會消失。')) return;
    slotKeys(to).forEach((k) => LS.removeItem(key(to, k)));
    Object.keys(obj.data).forEach((k) => { if (typeof obj.data[k] === 'string' && !GLOBAL.includes(k)) LS.setItem(key(to, k), obj.data[k]); });
    enter(to);
  };

  const acts = {
    close: () => { root.remove(); if (window.game && window.game.setPaused) window.game.setPaused(false, 'wjt'); },
    save: saveEdit,
    all: (b) => $$('input[data-g="' + b.dataset.g + '"]').forEach((e) => { e.checked = true; }),
    none: (b) => $$('input[data-g="' + b.dataset.g + '"]').forEach((e) => { e.checked = false; }),
    maxlv: () => $$('select[data-lv]').forEach((e) => { e.value = '5'; }),
    nolv: () => $$('select[data-lv]').forEach((e) => { e.value = ''; }),
    items: () => { try { window.game.loadout.unlock({ items: ALL_ITEMS }); say('已解鎖全部裝備，關閉工具後到背包查看'); } catch (e) { say('解鎖失敗，遊戲可能已改版'); } },
    go: (b) => enter(Number(b.dataset.s)),
    copy: () => {
      const el = $('#wjt-out');
      const fallback = () => { el.focus(); el.select(); try { document.execCommand('copy'); say('已複製'); } catch (e) { say('請手動全選複製'); } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value).then(() => say('已複製'), fallback); else fallback();
    },
    dl: () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([$('#wjt-out').value], { type: 'application/json' }));
      a.download = 'wuji-slot' + slot + '-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    },
    import: () => {
      const f = $('#wjt-file').files[0];
      const text = $('#wjt-in').value.trim();
      if (text) doImport(text);
      else if (f) f.text().then(doImport);
      else say('請先貼上備份文字或選擇檔案');
    },
    wipe: () => {
      if (!confirm('確定要清空存檔 ' + slot + ' 嗎？這個動作無法復原。')) return;
      slotKeys(slot).forEach((k) => LS.removeItem(key(slot, k)));
      enter(slot);
    },
    rawsave: () => {
      const text = $('#wjt-raw').value;
      try { JSON.parse(text); } catch (e) { say('JSON 格式有誤：' + e.message); return; }
      LS.setItem(key(slot, $('#wjt-key').value), JSON.stringify(JSON.parse(text)));
      enter(slot);
    },
    rawdel: () => {
      const k = $('#wjt-key').value;
      if (!confirm('確定要刪除 ' + k + ' 嗎？')) return;
      LS.removeItem(key(slot, k));
      enter(slot);
    }
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; msg = ''; render(); return; }
    const b = e.target.closest('[data-act]');
    if (b && acts[b.dataset.act]) acts[b.dataset.act](b);
  });
  root.addEventListener('change', (e) => {
    if (e.target.id === 'wjt-slot') { slot = Number(e.target.value); msg = ''; render(); }
    if (e.target.id === 'wjt-key') loadRaw();
  });
  ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchmove', 'touchend', 'wheel'].forEach((n) => root.addEventListener(n, (e) => e.stopPropagation()));

  if (!window.game && window.matchMedia('(pointer: fine)').matches) tab = 'pc';
  render();
  document.body.appendChild(root);
  if (window.game && window.game.setPaused) window.game.setPaused(true, 'wjt');
})();
