/* 龍脈紀元 輔助書籤（非官方）
 * 功能：自動喝藍色藥水、資訊面板、資料查詢、介面調整、提醒、存檔備份匯出。
 * 只呼叫遊戲自己的喝藥函式（會正常扣藥水），不修改等級、金幣、鑽石、物品，也不送任何資料到伺服器。
 * 載入方式：javascript:import('…/dv-tool.js?v='+Date.now())
 */
const VERSION = 'V1';
const CFG_KEY = 'dvtool-cfg'; // 刻意不用 dragonvein 開頭，避免被遊戲的雲端同步帶走

(() => {
  if (window.__DVTOOL) { window.__DVTOOL.toggle(); return; }

  // ---------- 取得遊戲資料 ----------
  // 遊戲程式包在閉包裡，只透過 window.__G 公開角色(P)、物品/怪物/技能表與喝藥函式；
  // 最大體力、最大魔力、負重直接讀下方狀態列上遊戲自己算好的數字。
  const GG = () => window.__G || null;
  const hudPair = (id) => {
    const el = document.getElementById(id);
    const m = el && el.textContent.match(/(-?\d+)\s*\/\s*(\d+)/);
    return m ? [+m[1], +m[2]] : null;
  };
  const G = {
    P: () => (GG() && GG().P) || null,
    ITEMS: () => (GG() && GG().ITEMS) || {},
    MON: () => (GG() && GG().MON) || {},
    SKILLS: () => (GG() && GG().SKILLS) || {},
    cnt: (id) => { const p = G.P(); if (!p || !p.inv) return 0; const it = p.inv.find((i) => i.id === id); return it ? (it.qty || 1) : 0; },
    usePot: (id) => { try { GG().usePot(id); return true; } catch (e) { return false; } },
    hpMax: () => { const h = hudPair('hpT'); return h ? h[1] : 0; },
    mpMax: () => { const h = hudPair('mpT'); return h ? h[1] : 0; },
    need: (lv) => Math.floor(26 * Math.pow(lv, 2.25) + 24),
    weight: () => { const el = document.getElementById('hW'); return el ? parseInt(el.textContent, 10) || 0 : 0; },
    toast: (t) => showFlash(t, false),
    chat: (t, c) => { try { if (typeof window.__chat0 === 'function') window.__chat0(t, c || 'sys'); } catch (e) {} },
  };
  const inGame = () => {
    const p = G.P();
    const t = document.getElementById('title');
    const l = document.getElementById('loading');
    return !!(p && p.inv && (!t || t.hidden) && (!l || l.hidden) && !window.DUP29);
  };

  // ---------- 設定 ----------
  const DEF = {
    mpOn: true, mpPct: 30, mpOnlyAuto: false, mpPots: ['blue', 'mz_cola', 'mz_energy'],
    remBag: true, remWt: true, remHp: true, remHpPct: 25, remPot: true, remPotN: 20,
    hideQuest: false, hideMini: false, hudZoom: 100, mute: false,
    x: null, y: 70, min: false, tab: 'auto',
  };
  let cfg = Object.assign({}, DEF);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); } catch (e) {}
  const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} };

  // ---------- 樣式 ----------
  const css = document.createElement('style');
  css.id = 'dvt-css';
  css.textContent = `
#dvt{position:fixed;z-index:99990;right:176px;top:70px;width:330px;max-height:calc(100vh - 200px);display:flex;flex-direction:column;
 font:500 12.5px/1.5 "Noto Sans TC","Microsoft JhengHei",sans-serif;color:#ece2cb;background:linear-gradient(180deg,#2f2a24,#1b1815);
 border:2px solid #7d5f22;border-radius:6px;box-shadow:inset 0 0 0 1px #000,0 6px 18px rgba(0,0,0,.6);user-select:none}
#dvt *{box-sizing:border-box}
#dvt .dvt-hd{display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:move;border-bottom:1px solid #5b4f3f;color:#f1d68a;font-weight:900;font-family:"Noto Serif TC",serif;letter-spacing:.06em}
#dvt .dvt-hd small{color:#a89c86;font:500 10px sans-serif;letter-spacing:0}
#dvt .dvt-hd button{margin-left:auto}
#dvt .dvt-hd button+button{margin-left:0}
#dvt button{font:inherit;color:#f1d68a;background:#0c0b0a;border:1px solid #5b4f3f;border-radius:4px;padding:1px 8px;cursor:pointer}
#dvt button:hover{border-color:#c9a24a}
#dvt .dvt-tabs{display:flex;gap:3px;padding:6px 8px 0;flex-wrap:wrap}
#dvt .dvt-tabs button{flex:1;padding:3px 2px;color:#ece2cb;white-space:nowrap;font-size:12px}
#dvt .dvt-tabs button.on{border-color:#c9a24a;color:#f1d68a;background:#2a2110}
#dvt .dvt-bd{padding:8px;overflow:auto;min-height:0}
#dvt.min .dvt-tabs,#dvt.min .dvt-bd{display:none}
#dvt .dvt-row{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:4px 0}
#dvt .dvt-row label{display:flex;align-items:center;gap:6px;cursor:pointer}
#dvt input[type=number]{width:56px;background:#0c0b0a;color:#ece2cb;border:1px solid #5b4f3f;border-radius:3px;padding:1px 4px;font:inherit}
#dvt input[type=search]{width:100%;background:#0c0b0a;color:#ece2cb;border:1px solid #5b4f3f;border-radius:4px;padding:4px 8px;font:inherit}
#dvt input[type=range]{width:120px}
#dvt .dvt-sec{margin:8px 0 2px;color:#a89c86;font-size:11px;letter-spacing:.12em}
#dvt .dvt-cell{display:flex;justify-content:space-between;background:#0c0b0a;border:1px solid #3a3229;border-radius:3px;padding:2px 8px;margin:3px 0;font-variant-numeric:tabular-nums}
#dvt .dvt-cell b{color:#f1d68a}
#dvt .dvt-bar{height:8px;background:#0a0808;border:1px solid #000;border-radius:4px;overflow:hidden;margin:2px 0 6px}
#dvt .dvt-bar i{display:block;height:100%;background:linear-gradient(#7aa0ff,#2b55c4)}
#dvt .dvt-note{color:#a89c86;font-size:11.5px;margin:6px 0 0}
#dvt .dvt-res{margin-top:6px}
#dvt .dvt-it{background:#0c0b0a;border:1px solid #3a3229;border-radius:4px;padding:4px 8px;margin:4px 0}
#dvt .dvt-it b{color:#f1d68a}
#dvt .dvt-it .dvt-s{color:#a89c86;font-size:11.5px}
#dvt .on-g{color:#7ff09a}#dvt .on-r{color:#ff7060}
#dvt-flash{position:fixed;z-index:99989;left:50%;top:84px;transform:translateX(-50%);padding:6px 16px;border-radius:6px;font:900 14px sans-serif;
 color:#fff;background:rgba(160,30,30,.9);border:1px solid #ff8070;pointer-events:none;opacity:0;transition:opacity .2s}
#dvt-flash.show{opacity:1}
#dvt-flash.ok{background:rgba(47,36,20,.95);border-color:#c9a24a;color:#f1d68a}
body.dvt-hq #quest{display:none!important}
body.dvt-hm #mini{display:none!important}
@media (max-width:700px){#dvt{right:8px;left:8px;width:auto;top:60px}}
`;
  document.head.appendChild(css);

  // ---------- 面板 ----------
  const box = document.createElement('div');
  box.id = 'dvt';
  box.innerHTML = `
<div class="dvt-hd">龍脈輔助 <small>${VERSION}</small><button type="button" data-a="min" title="收合／展開">－</button><button type="button" data-a="close" title="關閉（再點一次書籤可重新打開）">✕</button></div>
<div class="dvt-tabs">
 <button type="button" data-t="auto">自動喝水</button><button type="button" data-t="info">資訊</button><button type="button" data-t="data">查詢</button>
 <button type="button" data-t="ui">介面</button><button type="button" data-t="rem">提醒</button><button type="button" data-t="bak">備份</button>
</div>
<div class="dvt-bd"></div>`;
  document.body.appendChild(box);
  const flash = document.createElement('div');
  flash.id = 'dvt-flash';
  document.body.appendChild(flash);
  function showFlash(msg, warn) {
    flash.textContent = msg;
    flash.classList.toggle('ok', !warn);
    flash.classList.add('show');
    clearTimeout(flash._h); flash._h = setTimeout(() => flash.classList.remove('show'), 2500);
  }
  const bd = box.querySelector('.dvt-bd');
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const fmt = (n) => (Math.round(n) || 0).toLocaleString('zh-TW');

  if (cfg.x != null) { box.style.left = cfg.x + 'px'; box.style.right = 'auto'; }
  box.style.top = (cfg.y || 70) + 'px';
  box.classList.toggle('min', !!cfg.min);

  // 拖曳面板
  (() => {
    const hd = box.querySelector('.dvt-hd');
    let sx, sy, ox, oy, drag = false;
    hd.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || innerWidth <= 700) return;
      drag = true; sx = e.clientX; sy = e.clientY;
      const r = box.getBoundingClientRect(); ox = r.left; oy = r.top;
      hd.setPointerCapture(e.pointerId);
    });
    hd.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const x = Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx));
      const y = Math.max(0, Math.min(innerHeight - 40, oy + e.clientY - sy));
      box.style.left = x + 'px'; box.style.right = 'auto'; box.style.top = y + 'px';
      cfg.x = x; cfg.y = y;
    });
    hd.addEventListener('pointerup', () => { if (drag) { drag = false; saveCfg(); } });
  })();
  // 面板上的按鍵不要被遊戲當成快捷鍵
  ['keydown', 'keyup', 'keypress'].forEach((ev) => box.addEventListener(ev, (e) => e.stopPropagation()));

  // ---------- 統計（資訊頁用） ----------
  const S = { t0: Date.now(), exp0: null, lv0: null, gold0: null, expGain: 0, goldGain: 0, lastExp: null, lastLv: null, lastGold: null, mpUsed: 0 };
  const resetStats = () => { S.t0 = Date.now(); S.expGain = 0; S.goldGain = 0; S.lastExp = null; S.mpUsed = 0; };
  function sample() {
    const p = G.P(); if (!p || !inGame()) return;
    if (S.lastExp == null) { S.lastExp = p.exp; S.lastLv = p.lv; S.lastGold = p.gold; return; }
    if (p.lv === S.lastLv) { if (p.exp > S.lastExp) S.expGain += p.exp - S.lastExp; }
    else if (p.lv > S.lastLv) {
      // 升級：前一級剩下的 + 新一級已得的
      let g = G.need(S.lastLv) - S.lastExp;
      for (let l = S.lastLv + 1; l < p.lv; l++) g += G.need(l);
      S.expGain += Math.max(0, g) + p.exp;
    }
    if (p.gold > S.lastGold) S.goldGain += p.gold - S.lastGold;
    S.lastExp = p.exp; S.lastLv = p.lv; S.lastGold = p.gold;
  }

  // ---------- 自動喝藍色藥水 ----------
  let mpCd = 0, warnNoPot = 0;
  function autoMp(now) {
    if (!cfg.mpOn || !inGame()) return;
    const p = G.P(); if (p.dead) return;
    if (cfg.mpOnlyAuto && !p.auto) return;
    const mx = G.mpMax(); if (!mx) return;
    if (p.mp / mx * 100 >= cfg.mpPct) return;
    if (now < mpCd) return;
    const ITEMS = G.ITEMS();
    const id = cfg.mpPots.find((k) => ITEMS[k] && G.cnt(k) > 0);
    if (!id) {
      if (now > warnNoPot) { warnNoPot = now + 30000; G.chat('【輔助】藍色藥水用完了', 'bad'); }
      mpCd = now + 2000; return;
    }
    if (G.usePot(id)) S.mpUsed++;
    mpCd = now + 1000; // 每秒最多喝一瓶
  }

  // ---------- 提醒 ----------
  const remT = {};
  function remind(key, msg, gap) {
    const now = Date.now();
    if (remT[key] && now < remT[key]) return;
    remT[key] = now + (gap || 60000);
    showFlash(msg, true);
    G.chat('【提醒】' + msg, 'bad');
  }
  function checkRem() {
    if (!inGame()) return;
    const p = G.P(); if (p.dead) return;
    const max = p.bagMax || 60;
    if (cfg.remBag && p.inv.length >= max - 2) remind('bag', `背包快滿了（${p.inv.length}/${max}）`);
    if (cfg.remWt && G.weight() >= 50) remind('wt', `負重 ${G.weight()}%，體力魔力不會自然回復`);
    const hm = G.hpMax();
    if (cfg.remHp && hm && p.hp / hm * 100 < cfg.remHpPct) remind('hp', `體力只剩 ${Math.round(p.hp / hm * 100)}%！`, 8000);
    if (cfg.remPot) {
      const hpPots = ['red', 'orange', 'clear'].reduce((a, k) => a + G.cnt(k), 0);
      if (hpPots < cfg.remPotN) remind('hpot', `紅水類藥水只剩 ${hpPots} 瓶`, 120000);
      if (cfg.mpOn && G.cnt('blue') < cfg.remPotN && G.cnt('blue') > 0) remind('mpot', `藍色藥水只剩 ${G.cnt('blue')} 瓶`, 120000);
    }
  }

  // ---------- 靜音 ----------
  const ABS = window.AudioBufferSourceNode && AudioBufferSourceNode.prototype;
  const OSC = window.OscillatorNode && OscillatorNode.prototype;
  const origStart = { abs: ABS && ABS.start, osc: OSC && OSC.start };
  function applyMute() {
    if (cfg.mute) {
      if (ABS) ABS.start = function () {};
      if (OSC) OSC.start = function () {};
      liveMedia.forEach((a) => { a.muted = true; });
      document.querySelectorAll('audio,video').forEach((a) => { a.muted = true; });
    } else {
      if (ABS) ABS.start = origStart.abs;
      if (OSC) OSC.start = origStart.osc;
      liveMedia.forEach((a) => { a.muted = false; });
      document.querySelectorAll('audio,video').forEach((a) => { a.muted = false; });
    }
  }
  // 遊戲的背景音樂是 new Audio() 動態建立的，不在 DOM 裡：攔截 play 讓它跟著靜音
  const liveMedia = new Set();
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { liveMedia.add(this); this.muted = !!cfg.mute; return origPlay.apply(this, arguments); };

  function applyUi() {
    document.body.classList.toggle('dvt-hq', !!cfg.hideQuest);
    document.body.classList.toggle('dvt-hm', !!cfg.hideMini);
    const hud = document.getElementById('hud');
    if (hud) { hud.style.zoom = cfg.hudZoom === 100 ? '' : cfg.hudZoom / 100; }
    applyMute();
  }

  // ---------- 各分頁 ----------
  const chk = (k, txt) => `<label><input type="checkbox" data-c="${k}" ${cfg[k] ? 'checked' : ''}> ${txt}</label>`;
  const num = (k, min, max) => `<input type="number" data-n="${k}" min="${min}" max="${max}" value="${cfg[k]}">`;
  const potName = (id) => (G.ITEMS()[id] || {}).n || id;

  const PAGES = {
    auto: () => `
<div class="dvt-row">${chk('mpOn', '<b>魔力低於設定值自動喝藍水</b>')}</div>
<div class="dvt-row"><span>魔力低於</span><span>${num('mpPct', 5, 95)} %</span></div>
<div class="dvt-row">${chk('mpOnlyAuto', '只在「自動戰鬥」開啟時喝')}</div>
<div class="dvt-sec">喝的順序（有哪個喝哪個）</div>
${cfg.mpPots.map((k, i) => `<div class="dvt-cell"><span>${i + 1}. ${esc(potName(k))}</span><b data-live="cnt:${k}">0</b></div>`).join('')}
<div class="dvt-sec">目前</div>
<div class="dvt-cell"><span>魔力</span><b data-live="mp">-</b></div>
<div class="dvt-bar"><i data-live="mpbar" style="width:0"></i></div>
<div class="dvt-cell"><span>這次已自動喝</span><b data-live="mpused">0</b></div>
<p class="dvt-note">用的是遊戲自己的喝藥功能，跟你手動點藥水一樣會扣掉藥水；每秒最多喝一瓶。<br>體力的自動喝水遊戲已內建（自動戰鬥時，在角色視窗設定 HP %）。</p>`,
    info: () => `
<div class="dvt-cell"><span>等級</span><b data-live="lv">-</b></div>
<div class="dvt-cell"><span>經驗</span><b data-live="exp">-</b></div>
<div class="dvt-cell"><span>統計時間</span><b data-live="dur">-</b></div>
<div class="dvt-cell"><span>經驗／小時</span><b data-live="exph">-</b></div>
<div class="dvt-cell"><span>預估升級</span><b data-live="eta">-</b></div>
<div class="dvt-cell"><span>金幣／小時</span><b data-live="goldh">-</b></div>
<div class="dvt-cell"><span>負重</span><b data-live="wt">-</b></div>
<div class="dvt-cell"><span>背包格數</span><b data-live="bag">-</b></div>
<div class="dvt-sec">藥水存量</div>
${['red', 'orange', 'clear', 'blue', 'haste', 'tele'].map((k) => `<div class="dvt-cell"><span>${esc(potName(k))}</span><b data-live="cnt:${k}">0</b></div>`).join('')}
<div class="dvt-row" style="margin-top:8px"><button type="button" data-a="reset">重新統計</button><span class="dvt-note" style="margin:0">練功前按一下比較準</span></div>`,
    data: () => `
<input type="search" id="dvt-q" placeholder="搜尋怪物、物品、技能名稱…" autocomplete="off">
<div class="dvt-res" id="dvt-res"><p class="dvt-note">例如：輸入「哥布林」看掉落物、輸入「藥水」看所有藥水。</p></div>`,
    ui: () => `
<div class="dvt-row">${chk('mute', '遊戲全部靜音（音樂＋音效）')}</div>
<div class="dvt-row">${chk('hideQuest', '隱藏左上任務框')}</div>
<div class="dvt-row">${chk('hideMini', '隱藏右上小地圖')}</div>
<div class="dvt-row"><span>下方狀態列大小</span><span><input type="range" min="70" max="130" step="5" data-r="hudZoom" value="${cfg.hudZoom}"> <b data-live="zoom">${cfg.hudZoom}%</b></span></div>
<p class="dvt-note">設定會記在這台瀏覽器，下次點書籤自動套用。</p>`,
    rem: () => `
<div class="dvt-row">${chk('remBag', '背包剩 2 格以內提醒')}</div>
<div class="dvt-row">${chk('remWt', '負重 50% 以上提醒（不會自然回復）')}</div>
<div class="dvt-row">${chk('remHp', '體力低於')}<span>${num('remHpPct', 5, 90)} %</span></div>
<div class="dvt-row">${chk('remPot', '藥水少於')}<span>${num('remPotN', 1, 500)} 瓶</span></div>
<p class="dvt-note">提醒會在畫面上方閃一下，並寫在聊天框。同一件事 1 分鐘內只提醒一次（體力 8 秒）。</p>`,
    bak: () => `
<button type="button" data-a="export" style="width:100%;padding:6px">⬇ 下載我的存檔備份（.json）</button>
<p class="dvt-note">把這台瀏覽器裡龍脈紀元的角色存檔下載成檔案留底，<b>只讀不改</b>。<br>為了你的帳號安全，備份<b>不會</b>包含雲端登入憑證（dragonvein-cloud）。</p>
<p class="dvt-note">正式網站的進度以雲端帳號為準，這份檔案是給自己留紀錄、查資料用，請不要拿去改再匯回，伺服器會判定存檔異常並還原。</p>`,
  };

  function render() {
    box.querySelectorAll('.dvt-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === cfg.tab));
    bd.innerHTML = (PAGES[cfg.tab] || PAGES.auto)();
    if (cfg.tab === 'data') {
      const q = bd.querySelector('#dvt-q');
      q.addEventListener('input', () => search(q.value));
      setTimeout(() => q.focus(), 0);
    }
    live();
  }

  // ---------- 查詢 ----------
  const TYPE = { pot: '體力藥水', mpot: '魔力藥水', haste: '加速', tele: '傳送', wep: '武器', armor: '盔甲', helm: '頭盔', cloak: '斗篷', ring: '戒指', ring2: '戒指', amulet: '項鍊', glove: '手套', boots: '長靴', shield: '盾牌', belt: '腰帶', ear: '耳環', ewep: '強化卷軸', earm: '強化卷軸', skbook: '技能書' };
  const pct = (r) => (r * 100).toFixed(r < .01 ? 2 : 1) + '%';
  // 遊戲資料裡有些掉落會重複列出，同一物品只顯示一次
  const uniqDrops = (m) => { const seen = new Set(); return (m.drops || []).filter(([id]) => !seen.has(id) && seen.add(id)); };
  function search(raw) {
    const out = bd.querySelector('#dvt-res'); if (!out) return;
    const q = raw.trim().toLowerCase();
    if (!q) { out.innerHTML = '<p class="dvt-note">輸入名稱開始搜尋。</p>'; return; }
    const ITEMS = G.ITEMS(), MON = G.MON(), SK = G.SKILLS();
    const hit = (o, k) => (o.n || '').toLowerCase().includes(q) || k.toLowerCase() === q;
    const html = [];
    for (const k in MON) {
      const m = MON[k]; if (!hit(m, k)) continue;
      const dr = uniqDrops(m).map(([id, r]) => `${esc((ITEMS[id] || {}).n || id)} ${pct(r)}`).join('、');
      html.push(`<div class="dvt-it"><b>👾 ${esc(m.n)}</b> <span class="dvt-s">Lv ${m.lv}${m.boss ? '・頭目' : ''}${m.aggro ? '・主動攻擊' : ''}</span>
<div class="dvt-s">HP ${fmt(m.hp)}　攻擊 ${(m.atk || []).join('-')}　AC ${m.ac}　經驗 ${fmt(m.exp)}　金幣 ${(m.gold || []).join('-')}</div>
${dr ? `<div class="dvt-s">掉落：${dr}</div>` : ''}</div>`);
      if (html.length > 40) break;
    }
    for (const k in ITEMS) {
      const it = ITEMS[k]; if (!hit(it, k) || k === 'gold') continue;
      const from = [];
      for (const mk in MON) {
        const d = (MON[mk].drops || []).find((x) => x[0] === k);
        const label = d && `${esc(MON[mk].n)} Lv${MON[mk].lv}(${pct(d[1])})`;
        if (label && !from.includes(label)) from.push(label);
      }
      const st = [];
      if (it.dmg) st.push('攻擊 ' + it.dmg.join('-'));
      if (it.ac) st.push('AC ' + it.ac);
      if (it.heal) st.push('回復 ' + it.heal.join('-'));
      if (it.price) st.push('商店價 ' + fmt(it.price));
      if (it.wt != null) st.push('重量 ' + it.wt);
      html.push(`<div class="dvt-it"><b>🎒 ${esc(it.n)}</b> <span class="dvt-s">${esc(TYPE[it.t] || '')}</span>
${st.length ? `<div class="dvt-s">${st.join('　')}</div>` : ''}${it.d ? `<div class="dvt-s">${esc(it.d)}</div>` : ''}
${from.length ? `<div class="dvt-s">掉落怪物：${from.slice(0, 12).join('、')}${from.length > 12 ? '…' : ''}</div>` : ''}
<div class="dvt-s">背包持有：${G.cnt(k)}</div></div>`);
      if (html.length > 60) break;
    }
    for (const k in SK) {
      const s = SK[k]; if (!hit(s, k)) continue;
      html.push(`<div class="dvt-it"><b>✨ ${esc(s.n)}</b> <span class="dvt-s">魔力 ${s.mp}・冷卻 ${s.cd} 秒</span><div class="dvt-s">${esc(s.d || '')}</div></div>`);
      if (html.length > 70) break;
    }
    out.innerHTML = html.length ? html.join('') : '<p class="dvt-note">找不到符合的怪物、物品或技能。</p>';
  }

  // ---------- 即時數值 ----------
  function live() {
    const p = G.P();
    const set = (k, v) => bd.querySelectorAll(`[data-live="${k}"]`).forEach((el) => { el.textContent = v; });
    bd.querySelectorAll('[data-live^="cnt:"]').forEach((el) => { el.textContent = fmt(G.cnt(el.dataset.live.slice(4))); });
    if (!p || !inGame()) { set('mp', '尚未進入遊戲'); return; }
    const mx = G.mpMax();
    set('mp', mx ? `${fmt(p.mp)} / ${fmt(mx)}` : '讀取中…');
    const bar = bd.querySelector('[data-live="mpbar"]'); if (bar) bar.style.width = (mx ? Math.min(100, p.mp / mx * 100) : 0) + '%';
    set('mpused', fmt(S.mpUsed));
    const nd = G.need(p.lv);
    set('lv', p.lv);
    set('exp', nd ? `${fmt(p.exp)} / ${fmt(nd)}（${(p.exp / nd * 100).toFixed(2)}%）` : fmt(p.exp));
    const hrs = (Date.now() - S.t0) / 3600000;
    const m = Math.floor(hrs * 60);
    set('dur', `${Math.floor(m / 60)} 小時 ${m % 60} 分`);
    const eh = hrs > 0.005 ? S.expGain / hrs : 0;
    set('exph', eh ? `${fmt(eh)}（${nd ? (eh / nd * 100).toFixed(1) : 0}%）` : '統計中…');
    if (eh && nd) {
      const left = (nd - p.exp) / eh * 60;
      set('eta', left > 6000 ? '超過 100 小時' : `約 ${Math.floor(left / 60)} 小時 ${Math.round(left % 60)} 分`);
    } else set('eta', '統計中…');
    set('goldh', hrs > 0.005 ? fmt(S.goldGain / hrs) : '統計中…');
    set('wt', G.weight() + '%');
    set('bag', `${p.inv.length} / ${p.bagMax || 60}`);
  }

  // ---------- 事件 ----------
  box.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]');
    if (t) { cfg.tab = t.dataset.t; saveCfg(); render(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'min') { cfg.min = !cfg.min; box.classList.toggle('min', cfg.min); saveCfg(); }
    if (a.dataset.a === 'close') api.toggle();
    if (a.dataset.a === 'reset') { resetStats(); live(); }
    if (a.dataset.a === 'export') exportSave();
  });
  box.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.c) cfg[el.dataset.c] = el.checked;
    if (el.dataset.n) { const v = Math.max(+el.min, Math.min(+el.max, Math.round(+el.value) || 0)); cfg[el.dataset.n] = v; el.value = v; }
    saveCfg(); applyUi();
  });
  box.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.r) { cfg[el.dataset.r] = +el.value; const z = bd.querySelector('[data-live="zoom"]'); if (z) z.textContent = el.value + '%'; saveCfg(); applyUi(); }
  });

  function exportSave() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (/^dragonvein/.test(k) && k !== 'dragonvein-cloud') o[k] = localStorage.getItem(k);
    }
    if (!Object.keys(o).length) { G.toast('這台瀏覽器裡沒有找到存檔'); return; }
    const p = G.P();
    const name = (p && p.name ? p.name : '存檔').replace(/[\\/:*?"<>|]/g, '');
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    const blob = new Blob([JSON.stringify({ tool: 'dv-tool ' + VERSION, time: d.toISOString(), host: location.hostname, data: o }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `龍脈紀元備份_${name}_${stamp}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    G.toast('存檔備份已下載');
  }

  // ---------- 主迴圈 ----------
  let n = 0;
  const loop = setInterval(() => {
    const now = Date.now();
    try { autoMp(now); } catch (e) {}
    if (++n % 4 === 0) {
      try { sample(); } catch (e) {}
      try { checkRem(); } catch (e) {}
      if (!box.hidden && !cfg.min && cfg.tab !== 'data') try { live(); } catch (e) {}
    }
  }, 250);

  const api = {
    toggle() { box.hidden = !box.hidden; if (!box.hidden) render(); G.toast(box.hidden ? '輔助面板已隱藏（自動喝水繼續運作）' : '輔助面板已打開'); },
    stop() { clearInterval(loop); box.remove(); css.remove(); flash.remove(); cfg.mute = false; applyMute(); HTMLMediaElement.prototype.play = origPlay; delete window.__DVTOOL; },
    version: VERSION,
  };
  window.__DVTOOL = api;

  applyUi();
  render();
  G.toast('龍脈輔助書籤 ' + VERSION + ' 已啟用');
  if (!G.P()) G.chat('【輔助】沒有偵測到遊戲，請在龍脈紀元的遊戲頁面點書籤');
})();
