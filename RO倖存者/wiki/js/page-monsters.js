/* 怪物圖鑑：全部怪物（依關卡、首領篩選）、單一怪物的資料與掉落 */
RSW.page({
  id: 'monsters', nav: '怪物圖鑑',
  title: arg => (arg && RSW.index().monster[arg] ? RSW.monName(RSW.index().monster[arg]) : '怪物圖鑑'),
  render(arg) {
    const R = RSW, ix = R.index(), L = R.meta.labels;
    if (arg && ix.monster[arg]) {
      const m = ix.monster[arg], card = m.card && ix.card[m.card];
      const drops = (m.drops || []).slice().sort((a, b) => b.chance - a.chance);
      return `<p class="small"><a href="#monsters">← 所有怪物</a></p>
<h2 class="pt">${R.esc(R.monName(m))} <span class="muted small">${R.esc(m.en)}</span>${m.boss === 'mvp' ? '<span class="tag mvp">MVP</span>' : m.boss === 'mini' ? '<span class="tag mini">小首領</span>' : ''}</h2>
<div class="box">
  <span class="stat">等級 <b>${m.level ?? '—'}</b></span><span class="stat">HP <b>${R.num(m.hp)}</b></span>
  <span class="stat">傷害 <b>${R.num(m.damage)}</b></span><span class="stat">經驗 <b>${R.num(m.exp)}</b></span>
  ${m.race ? `<span class="stat">種族 <b>${R.esc(L.races[m.race] || m.race)}</b></span>` : ''}
  ${m.element ? `<span class="stat">屬性 <b>${R.esc(L.elements[m.element] || m.element)} ${m.elementLv}</b></span>` : ''}
  ${m.size ? `<span class="stat">體型 <b>${R.esc(L.sizes[m.size] || m.size)}</b></span>` : ''}
  ${m.ranged ? '<span class="tag">遠程攻擊</span>' : ''}${m.speed === 0 ? '<span class="tag">不會移動</span>' : ''}
</div>
<h3>出現地點</h3><p>${R.whereText(m)}</p>
${cosOf(m.id) ? `<p>🎩 擊敗 ${R.cosmetics.kills} 次${cosOf(m.id).kills.length > 1 ? '（三隻塔羅鼠合計）' : ''}可以拿到外觀：<a href="#cosmetics">${R.img(cosOf(m.id).icon)} ${R.esc(cosOf(m.id).zh || cosOf(m.id).en)}</a> <span class="tag dev">即將開放</span></p>` : ''}
${petOf(m.id) ? `<p>🐾 這隻怪物有寵物：<a href="#pets/${m.id}">${R.esc(R.monName(m))}寵物</a>${petOf(m.id).from ? '（由進化取得）' : `（掉蛋 ${R.pct(m.boss === 'mvp' ? R.pets.rules.eggMvp : R.pets.rules.eggNormal)}）`}</p>` : ''}
<h3>掉落物</h3>
${drops.length || card ? `<div class="tw"><table class="t"><tr><th>物品</th><th>部位</th><th>每隻機率</th></tr>
  ${drops.map(d => { const it = ix.item[d.id]; return `<tr><td>${R.itemLink(d.id)}</td><td class="small">${it ? R.esc(R.slotName(it)) : ''}</td><td class="num">${R.pct(d.chance)}</td></tr>`; }).join('')}
  ${card ? `<tr><td>${R.img(card.image, 'ico')} ${R.cardLink(card.id)}</td><td class="small">卡片（${R.esc(card.compoundName)}）</td><td class="num">非常稀有</td></tr>` : ''}
</table></div>` : '<p class="muted">沒有裝備或卡片掉落。</p>'}`;
    }
    return `<h2 class="pt">怪物圖鑑</h2>
<p class="lead">遊戲裡全部 ${R.monsters.length} 種怪物，點進去看出現地點和掉落物。</p>
<div class="filters">
  <select id="mo-stage"><option value="">全部關卡</option>${R.stages.map(s => `<option value="${s.id}">${R.esc(s.name)}</option>`).join('')}</select>
  <select id="mo-boss"><option value="">全部</option><option value="mvp">MVP</option><option value="mini">小首領</option><option value="normal">一般怪物</option></select>
  <input id="mo-q" type="search" placeholder="怪物名稱…">
  <span class="count" id="mo-n"></span>
</div>
<div class="tw" id="mo-list"></div>`;
  },
  bind(root, arg) {
    const R = RSW, L = R.meta.labels;
    if (arg) return;
    const $ = s => root.querySelector(s);
    const draw = () => {
      const st = $('#mo-stage').value, boss = $('#mo-boss').value, kw = $('#mo-q').value.trim().toLowerCase();
      const list = R.monsters.filter(m => (!st || m.where.some(w => w.stage === st)) &&
        (!boss || (boss === 'normal' ? !m.boss : m.boss === boss)) &&
        (!kw || ((m.zh || '') + ' ' + m.en).toLowerCase().includes(kw)))
        .sort((a, b) => (a.level || 0) - (b.level || 0));
      $('#mo-n').textContent = `${list.length} 種`;
      $('#mo-list').innerHTML = list.length ? `<table class="t"><tr><th>怪物</th><th>等級</th><th>HP</th><th>種族／屬性</th><th>出現地點</th><th>掉落</th></tr>
        ${list.map(m => `<tr><td>${R.monLink(m.id)}<br><span class="muted small">${R.esc(m.en)}</span></td><td class="num">${m.level ?? ''}</td><td class="num">${R.num(m.hp)}</td>
          <td class="small">${R.esc(L.races[m.race] || '')}／${R.esc(L.elements[m.element] || '')}</td>
          <td class="small">${[...new Set(m.where.map(w => w.stage))].map(R.stageLink).join('、') || '—'}</td>
          <td class="small">${m.drops.length ? m.drops.length + ' 件' : ''}${m.card ? (m.drops.length ? '＋' : '') + '卡片' : ''}</td></tr>`).join('')}</table>` : '<div class="empty">沒有符合的怪物</div>';
    };
    for (const s of ['#mo-stage', '#mo-boss']) $(s).onchange = draw;
    $('#mo-q').oninput = draw;
    draw();
  },
});
