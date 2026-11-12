/* 神祇：寶箱第五格。技能神祇（依職業、1～10 級）與屬性神祇 */
RSW.page({
  id: 'deities', nav: '神祇', title: () => '神祇',
  render() {
    const R = RSW, D = R.deities;
    const jobs = R.jobs.list.filter(j => deitySkills(j.id).length);
    return `<h2 class="pt">神祇</h2>
<p class="lead">遊戲局裡打開寶箱時的第五個欄位，會把你帶著的一個技能「改造」得更強。共有 ${Object.keys(D.skills).length} 個技能有神祇，另外還有 ${D.stats.length} 個任何職業都能拿的屬性神祇。</p>

<h3>運作方式</h3>
<ul>
  <li>寶箱的神祇欄位會出現<b>你這局帶著的技能</b>的神祇，永遠是傳說品質。</li>
  <li>同一個神祇再出現時會<b>精煉並升一級</b>（最高看下面的 10 級），效果數字跟著變大。</li>
  <li>還沒拿到技能神祇前，這一格可能出現<b>屬性神祇</b>；屬性神祇每次精煉再多加一次數值。</li>
  <li><b>無盡之塔</b>：開始時選一個技能神祇，每 10 層升一級。</li>
  <li>二轉職業保留一轉的技能，所以一轉技能的神祇也拿得到。</li>
</ul>

<h3>屬性神祇</h3>
<div class="tw"><table class="t"><tr><th>神祇</th><th>效果（最低 → 最高）</th></tr>
  ${D.stats.map(s => `<tr><td>${R.img(s.icon)} ${R.esc(s.name)}</td><td class="small">${R.esc(s.min)} → ${R.esc(s.max)}</td></tr>`).join('')}</table></div>

<h3>技能神祇</h3>
<div class="filters">
  <select id="dt-job">${jobs.map(j => `<option value="${j.id}">${R.esc(j.nameF ? j.name + ' / ' + j.nameF : j.name)}</option>`).join('')}</select>
  <label class="small">等級 <input id="dt-rank" type="range" min="1" max="10" value="1"> <b id="dt-rv">1</b></label>
  <input id="dt-q" type="search" placeholder="技能或效果…">
  <span class="count" id="dt-n"></span>
</div>
<div class="tw" id="dt-list"></div>`;
  },
  bind(root) {
    const R = RSW, D = R.deities, ix = R.index();
    const job = root.querySelector('#dt-job'), rank = root.querySelector('#dt-rank'), q = root.querySelector('#dt-q');
    const draw = () => {
      const r = +rank.value, kw = q.value.trim().toLowerCase();
      root.querySelector('#dt-rv').textContent = r;
      const j = ix.job[job.value];
      const own = deitySkills(job.value);
      const base = j && j.base ? deitySkills(j.base).filter(id => !own.includes(id)) : [];
      const rows = ids => ids.filter(id => !kw || [ix.skill[id]?.name || id, ...D.skills[id][r - 1]].join(' ').toLowerCase().includes(kw))
        .map(id => `<tr><td>${R.skillLink(id)}</td><td class="small">${D.skills[id][r - 1].map(R.esc).join('<br>')}</td></tr>`).join('');
      const a = rows(own), b = rows(base);
      root.querySelector('#dt-n').textContent = '';
      root.querySelector('#dt-list').innerHTML = (a || b) ? `<table class="t"><tr><th>技能</th><th>神祇效果（${r} 級）</th></tr>${a}
        ${b ? `<tr><th colspan="2">從${R.esc(R.jobName(j.base))}保留的技能</th></tr>${b}` : ''}</table>` : '<div class="empty">沒有符合的技能</div>';
    };
    job.onchange = draw; rank.oninput = draw; q.oninput = draw;
    draw();
  },
});

/* 某職業（含天賦學會的）有神祇的技能 */
function deitySkills(jobId) {
  return (RSW.skills || []).filter(s => RSW.deities.skills[s.id] && s.jobs.some(j => j.job === jobId)).map(s => s.id);
}
