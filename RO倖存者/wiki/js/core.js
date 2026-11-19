/* RO 倖存者小百科：共用工具與頁面切換
   每個功能頁是 wiki\js\page-*.js，用 RSW.page({...}) 註冊；資料在 wiki\data\*.js（build_wiki.py 產生）。
   網址格式：#頁面 或 #頁面/項目，例如 #items/1105、#monsters/poring */
window.RSW = window.RSW || {};
(function (R) {
  const IMG_BASE = 'https://ro-survivors.com/assets/';   /* 圖片直接用遊戲官網的 */
  const pages = [];
  R.pages = pages;
  R.page = def => pages.push(def);

  /* ---------- 文字 ---------- */
  R.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  R.img = (path, cls = 'ico', alt = '') => path ? `<img class="${cls}" src="${R.esc((R.localImages && R.localImages[path]) || (IMG_BASE + path))}" alt="${R.esc(alt)}" loading="lazy">` : '';
  R.pct = x => {
    if (x == null) return '—';
    const p = x * 100;
    return (p >= 10 ? p.toFixed(0) : p >= 1 ? p.toFixed(1) : String(Number(p.toPrecision(2)))) + '%';
  };
  R.num = n => (n == null ? '—' : Number(n).toLocaleString('zh-TW'));
  R.min = t => (t == null ? '' : `第 ${t % 1 ? t.toFixed(1) : t} 分鐘`);

  /* ---------- 索引 ---------- */
  R.index = () => {
    if (R._ix) return R._ix;
    const by = (arr, k = 'id') => Object.fromEntries((arr || []).map(x => [x[k], x]));
    R._ix = {
      job: by(R.jobs.list), skill: by(R.skills), item: by(R.items), card: by(R.cards),
      monster: by(R.monsters), stage: by(R.stages),
      cardByMonster: Object.fromEntries((R.cards || []).map(c => [c.monster, c])),
    };
    return R._ix;
  };
  const L = () => R.meta.labels;

  /* ---------- 名稱與連結 ---------- */
  R.jobName = id => (R.meta.jobNames[id] || id);
  R.jobLink = id => `<a href="#jobs/${id}">${R.esc(R.jobName(id))}</a>`;
  R.monName = m => (m ? m.zh || m.en : '');
  R.monLink = (id, withEn) => {
    const m = R.index().monster[id];
    if (!m) return R.esc(id);
    const b = m.boss === 'mvp' ? ' <span class="tag mvp">MVP</span>' : m.boss === 'mini' ? ' <span class="tag mini">小首領</span>' : '';
    return `<a href="#monsters/${id}">${R.esc(R.monName(m))}</a>${withEn && m.zh ? ` <span class="muted small">${R.esc(m.en)}</span>` : ''}${b}`;
  };
  R.itemName = it => (it ? it.zh || it.en : '');
  R.itemLink = (id, icon = true) => {
    const it = R.index().item[id];
    if (!it) return '#' + id;
    return `<a href="#items/${id}">${icon ? R.img(it.icon) + ' ' : ''}${R.esc(R.itemName(it))}</a>`;
  };
  R.cardName = c => (c ? c.zh || c.en : '');
  R.cardLink = id => {
    const c = R.index().card[id];
    return c ? `<a href="#cards/${id}">${R.esc(R.cardName(c))}</a>` : '#' + id;
  };
  R.skillLink = (id, icon = true) => {
    const s = R.index().skill[id];
    return s ? `<a href="#skills/${id}">${icon ? R.img(s.icon) + ' ' : ''}${R.esc(s.name)}</a>` : R.esc(id);
  };
  R.stageName = id => { const s = R.index().stage[id]; return s ? s.name : id; };
  R.stageLink = id => `<a href="#stages/${id}">${R.esc(R.stageName(id))}</a>`;
  R.slotName = it => {
    const s = L().slots[it.slot] || L().slots[it.slot === 'acc' ? 'acc' : ''] || it.slot;
    return it.wtypeName ? `${s}・${it.wtypeName}` : s;
  };
  R.roleTag = w => w.role === 'mvp' ? '<span class="tag mvp">MVP</span>' : w.role === 'mini' ? '<span class="tag mini">小首領</span>'
    : w.role === 'optional' ? '<span class="tag mvp">條件式 MVP</span>' : w.role === 'summon' ? '<span class="tag">蛇王召喚</span>'
    : w.role === 'planned' ? '<span class="tag dev">尚未開放</span>' : '<span class="tag">一般</span>';
  R.festivalBall = id => R.festival && R.festival.balls.find(b => b.id === id);
  R.ballLink = id => {
    const b = R.festivalBall(id);
    return b ? `<a href="#events/lantern-festival">${R.img(b.icon)} ${R.esc(b.name)}</a>` : '燈籠節扭蛋';
  };

  /* 怪物出現在哪裡（一行文字） */
  R.whereText = m => {
    if (!m.where || !m.where.length) return '<span class="muted">目前關卡沒有出現</span>';
    return m.where.map(w => `${R.stageLink(w.stage)}${w.story ? '（劇情）' : ''} ${R.roleTag(w)}${w.minute ? ' <span class="muted small">' + R.min(w.minute) + '</span>' : ''}${w.role === 'optional' ? ' <span class="muted small">部分場次，白素貞倒下後召喚</span>' : ''}`).join('<br>');
  };

  /* 物品的取得方式 */
  R.sourceRows = it => {
    const rows = [];
    for (const s of it.sources || []) {
      if (s.type === 'drop') {
        const m = R.index().monster[s.monster];
        rows.push({ how: '怪物掉落', who: R.monLink(s.monster), where: m ? R.whereText(m) : '', chance: s.chance });
      } else if (s.type === 'starter') rows.push({ how: '初始裝備', who: R.jobLink(s.job), where: '建立角色時就有', chance: 1 });
      else if (s.type === 'festival') rows.push({ how: '燈籠節扭蛋', who: R.ballLink(s.ball), where: '<a href="#events/lantern-festival">普隆德拉的節慶主持人</a>', chance: null });
      else if (s.type === 'story') rows.push({ how: '劇情獎勵', who: R.jobLink(s.job), where: R.stageLink('sunken') + '（劇情）通關，依職業給武器', chance: 1 });
      else if (s.type === 'reward') rows.push({ how: '首次通關獎勵', who: '—', where: R.stageLink(s.stage), chance: 1 });
    }
    return rows;
  };

  /* ---------- 頁面切換 ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [id, ...rest] = h.split('/');
    const arg = rest.join('/');
    const page = pages.find(p => p.id === id) || pages.find(p => p.id === 'home');
    document.querySelectorAll('nav.tabs a').forEach(a => a.classList.toggle('on', a.dataset.page === page.id));
    const app = document.getElementById('app');
    try {
      app.innerHTML = page.render(arg) || '';
      if (page.bind) page.bind(app, arg);
    } catch (e) {
      console.error(e);
      app.innerHTML = `<div class="empty">這一頁出錯了：${R.esc(e.message)}</div>`;
    }
    const title = page.title(arg);
    document.title = (title ? title + ' · ' : '') + 'RO 倖存者小百科';
    if (!R._keepScroll) window.scrollTo(0, 0);
    R._keepScroll = false;
  }
  R.go = hash => { if (location.hash === hash) route(); else location.hash = hash; };

  /* ---------- 左側功能列：電腦版可收合（記住選擇），手機版是抽屜（預設收起） ---------- */
  function setupNav(nav) {
    const shell = document.querySelector('.shell');
    const btn = document.getElementById('nav-toggle');
    const backdrop = document.getElementById('nav-backdrop');
    if (!shell || !btn) return;
    const mobile = window.matchMedia('(max-width: 760px)');
    const KEY = 'rsw.navHidden';
    let hidden = false;
    try { hidden = localStorage.getItem(KEY) === '1'; } catch (e) { /* 無痕模式等 */ }
    const sync = () => {
      shell.classList.toggle('nav-off', hidden);
      const open = mobile.matches ? shell.classList.contains('nav-open') : !hidden;
      btn.setAttribute('aria-expanded', String(open));
      if (backdrop) backdrop.hidden = !(mobile.matches && open);
    };
    const setOpen = open => { shell.classList.toggle('nav-open', open); sync(); };
    btn.addEventListener('click', () => {
      if (mobile.matches) { setOpen(!shell.classList.contains('nav-open')); return; }
      hidden = !hidden;
      try { localStorage.setItem(KEY, hidden ? '1' : '0'); } catch (e) { /* 存不了就只在這次有效 */ }
      sync();
    });
    nav.addEventListener('click', e => { if (mobile.matches && e.target.closest('a')) setOpen(false); });
    if (backdrop) backdrop.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && shell.classList.contains('nav-open')) { setOpen(false); btn.focus(); } });
    (mobile.addEventListener ? mobile.addEventListener('change', () => setOpen(false)) : mobile.addListener(() => setOpen(false)));
    sync();
  }

  R.start = () => {
    const nav = document.querySelector('nav.tabs');
    nav.innerHTML = pages.filter(p => p.nav).map(p => `<a href="#${p.id}" data-page="${p.id}">${p.nav}</a>`).join('');
    setupNav(nav);
    const q = document.getElementById('q');
    q.addEventListener('keydown', e => { if (e.key === 'Enter' && q.value.trim()) R.go('#search/' + encodeURIComponent(q.value.trim())); });
    const m = R.meta;
    document.getElementById('ver').textContent = `資料版本 ${m.version}（${m.builtAt} 整理）`;
    window.addEventListener('hashchange', route);
    route();
  };
})(window.RSW);
