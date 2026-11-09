/* 搜尋：同時找職業、技能、物品、卡片、怪物、關卡（中英文名稱） */
RSW.page({
  id: 'search', title: arg => '搜尋：' + arg,
  render(arg) {
    const R = RSW, kw = (arg || '').trim().toLowerCase();
    document.getElementById('q').value = arg || '';
    if (!kw) return '<div class="empty">請在上方輸入關鍵字</div>';
    const has = (...s) => s.filter(Boolean).join(' ').toLowerCase().includes(kw);
    const groups = [
      ['職業', R.jobs.list.filter(j => has(j.name, j.nameF, j.id)).map(j => R.img(j.icon) + ' ' + R.jobLink(j.id))],
      ['技能', R.skills.filter(s => has(s.name, s.id)).map(s => R.skillLink(s.id))],
      ['物品', R.items.filter(i => has(i.zh, i.en)).map(i => R.itemLink(i.id))],
      ['卡片', R.cards.filter(c => has(c.zh, c.en)).map(c => R.cardLink(c.id))],
      ['怪物', R.monsters.filter(m => has(m.zh, m.en)).map(m => R.monLink(m.id))],
      ['關卡', R.stages.filter(s => has(s.name, s.place)).map(s => R.stageLink(s.id))],
      ['寵物', R.pets.list.filter(p => has(p.zh, p.en, p.eggZh, p.accZh)).map(p => `<a href="#pets/${p.id}">${R.esc(p.zh || p.en)}</a>`)],
      ['天賦', Object.entries(R.talents).flatMap(([job, ts]) => ts.filter(t => has(t.name)).map(t => `${R.esc(t.name)} <span class="muted small">（${R.jobLink(job)}）</span>`))],
    ].filter(g => g[1].length);
    return `<h2 class="pt">搜尋「${R.esc(arg)}」</h2>
${groups.length ? groups.map(([t, list]) => `<h3>${t} <span class="tag">${list.length}</span></h3><p>${list.slice(0, 80).join('、')}${list.length > 80 ? '…' : ''}</p>`).join('')
    : '<div class="empty">找不到符合的資料</div>'}`;
  },
});
