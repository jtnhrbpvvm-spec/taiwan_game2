/* 卡片：全部卡片（依插入部位篩選）、單一卡片的效果與掉落怪物 */
RSW.page({
  id: 'cards', nav: '卡片與取得',
  title: arg => (arg && RSW.index().card[arg] ? RSW.cardName(RSW.index().card[arg]) : '卡片與取得'),
  render(arg) {
    const R = RSW, ix = R.index();
    if (arg && ix.card[arg]) {
      const c = ix.card[arg], m = ix.monster[c.monster];
      return `<p class="small"><a href="#cards">← 所有卡片</a></p>
<h2 class="pt">${R.esc(R.cardName(c))} <span class="muted small">${R.esc(c.en)}</span></h2>
<div class="box" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">
  ${R.img(c.image, 'cardimg', R.cardName(c))}
  <div>
    <div class="stat">插入部位 <b>${R.esc(c.compoundName)}</b></div>
    <h3 style="margin-top:8px">效果</h3><ul>${c.bonuses.map(b => `<li>${R.esc(b)}</li>`).join('')}</ul>
  </div>
</div>
<h3>怎麼取得</h3>
<div class="tw"><table class="t"><tr><th>掉落怪物</th><th>出現地點</th></tr>
  <tr><td>${R.monLink(c.monster, true)}</td><td class="small">${m ? R.whereText(m) : ''}</td></tr></table></div>
<div class="note small">每種怪物都可能掉自己的卡片，機率非常低，首領（小首領、MVP）比較容易掉。調高難度可以提高戰利品。卡片從角色面板插進裝備的插槽，穿著那件裝備時才有效果。</div>`;
    }
    const comps = [...new Set(R.cards.map(c => c.compoundName))];
    return `<h2 class="pt">卡片與取得</h2>
<p class="lead">遊戲裡全部 ${R.cards.length} 張卡片，每張由對應的怪物掉落。</p>
<div class="filters">
  <select id="cd-slot"><option value="">全部部位</option>${comps.map(s => `<option>${R.esc(s)}</option>`).join('')}</select>
  <select id="cd-boss"><option value="">全部怪物</option><option value="boss">首領的卡片</option><option value="normal">一般怪物的卡片</option></select>
  <input id="cd-q" type="search" placeholder="卡片、怪物或效果…">
  <span class="count" id="cd-n"></span>
</div>
<div class="tw" id="cd-list"></div>`;
  },
  bind(root, arg) {
    const R = RSW;
    if (arg) return;
    const $ = s => root.querySelector(s);
    const draw = () => {
      const slot = $('#cd-slot').value, boss = $('#cd-boss').value, kw = $('#cd-q').value.trim().toLowerCase();
      const list = R.cards.filter(c => {
        const m = R.index().monster[c.monster] || {};
        return (!slot || c.compoundName === slot) && (!boss || (boss === 'boss' ? !!c.boss : !c.boss)) &&
          (!kw || [c.zh, c.en, m.zh, m.en, ...c.bonuses].join(' ').toLowerCase().includes(kw));
      });
      $('#cd-n').textContent = `${list.length} 張`;
      $('#cd-list').innerHTML = list.length ? `<table class="t"><tr><th>卡片</th><th>部位</th><th>效果</th><th>掉落怪物</th></tr>
        ${list.map(c => `<tr><td>${R.cardLink(c.id)}<br><span class="muted small">${R.esc(c.en)}</span></td><td class="small">${R.esc(c.compoundName)}</td>
          <td class="small">${c.bonuses.map(R.esc).join('<br>')}</td><td class="small">${R.monLink(c.monster)}</td></tr>`).join('')}</table>` : '<div class="empty">沒有符合的卡片</div>';
    };
    for (const s of ['#cd-slot', '#cd-boss']) $(s).onchange = draw;
    $('#cd-q').oninput = draw;
    draw();
  },
});
