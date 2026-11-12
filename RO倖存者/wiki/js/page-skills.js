/* 技能：全部技能列表（依職業篩選）、單一技能說明 */
RSW.page({
  id: 'skills', nav: '技能',
  title: arg => (arg && RSW.index().skill[arg] ? RSW.index().skill[arg].name : '技能'),
  render(arg) {
    const R = RSW, ix = R.index();
    if (arg && ix.skill[arg]) {
      const s = ix.skill[arg];
      const how = s.jobs.map(j => j.how === 'talent'
        ? `${R.jobLink(j.job)}：天賦「${R.esc((R.talents[j.job] || []).find(t => t.id === j.talent)?.name || '')}」學會`
        : `${R.jobLink(j.job)}：職業技能`);
      return `<p class="small"><a href="#skills">← 所有技能</a></p>
<h2 class="pt">${R.img(s.icon, 'ico lg')} ${R.esc(s.name)}</h2>
<p>${s.tagNames.map(t => `<span class="tag">${R.esc(t)}</span>`).join(' ')} <span class="tag">最高 ${s.maxLevel} 級</span></p>
<div class="box">${R.esc(s.desc1 || '（沒有說明）')}${s.descMax ? `<p class="muted small">每升一級：${R.esc(s.descMax)}</p>` : ''}</div>
<h3>哪些職業可以用</h3>
${how.length ? `<ul>${how.map(h => `<li>${h}</li>`).join('')}</ul>` : '<p class="muted">不屬於任何職業（可能是神祇、寵物或特殊技能）。</p>'}
${(R.deities && R.deities.skills[s.id]) ? `<h3>神祇效果 <a class="small" href="#deities">什麼是神祇？</a></h3>
<div class="tw"><table class="t"><tr><th>等級</th><th>效果</th></tr>
  ${[1, 5, 10].map(r => `<tr><td class="num">${r}</td><td class="small">${R.deities.skills[s.id][r - 1].map(R.esc).join('<br>')}</td></tr>`).join('')}</table></div>` : ''}`;
    }
    const jobs = R.jobs.list;
    return `<h2 class="pt">技能</h2>
<p class="lead">遊戲裡全部 ${R.skills.length} 個技能。局內升級時從你職業的技能卡裡選，天賦也能學會額外技能。</p>
<div class="filters">
  <select id="sk-job"><option value="">全部職業</option>${jobs.map(j => `<option value="${j.id}">${R.esc(j.name)}</option>`).join('')}<option value="-">不屬於職業</option></select>
  <input id="sk-q" type="search" placeholder="技能名稱或說明…">
  <span class="count" id="sk-n"></span>
</div>
<div class="tw" id="sk-list"></div>`;
  },
  bind(root, arg) {
    const R = RSW;
    if (arg) return;
    const job = root.querySelector('#sk-job'), q = root.querySelector('#sk-q');
    const draw = () => {
      const kw = q.value.trim().toLowerCase();
      const list = R.skills.filter(s =>
        (!job.value || (job.value === '-' ? !s.jobs.length : s.jobs.some(j => j.job === job.value))) &&
        (!kw || (s.name + ' ' + (s.desc1 || '') + ' ' + s.id).toLowerCase().includes(kw)));
      root.querySelector('#sk-n').textContent = `${list.length} 個`;
      root.querySelector('#sk-list').innerHTML = list.length ? `<table class="t"><tr><th>技能</th><th>職業</th><th>說明</th><th>等級</th></tr>
        ${list.map(s => `<tr><td>${R.skillLink(s.id)}</td><td class="small">${[...new Set(s.jobs.map(j => j.job))].map(R.jobLink).join('、') || '—'}</td>
          <td class="small">${R.esc(s.desc1 || '')}</td><td class="num">${s.maxLevel}</td></tr>`).join('')}</table>` : '<div class="empty">沒有符合的技能</div>';
    };
    job.onchange = draw; q.oninput = draw;
    draw();
  },
});
