/* 神祇與神器（Beta 0.8.2 起）：技能神祇 Lv 20 選一個、每 10 級升一級；原屬性神祇改名神器，仍從寶箱出 */
RSW.page({
  id: 'deities', nav: '神祇與神器', title: () => '神祇與神器',
  render() {
    const R = RSW, D = R.deities;
    const jobs = R.jobs.list.filter(j => deitySkills(j.id).length);
    return `<h2 class="pt">神祇與神器</h2>
<p class="lead">神祇會把你帶著的一個技能「改造」得更強，共有 ${Object.keys(D.skills).length} 個技能有神祇；另外還有 ${D.stats.length} 個任何職業都能拿的<b>神器</b>（Beta 0.8.2 前叫「屬性神祇」）。</p>

<h3>技能神祇怎麼拿（Beta 0.8.2 起）</h3>
<ul>
  <li><b>不再從寶箱出現。</b>這局等級達到 <b>Lv 20</b> 時，從你帶著的所有技能中選一個神祇。</li>
  <li>之後每 <b>10 級升一級</b>：Lv 20 為 1 級、Lv 30 為 2 級、Lv 40 為 3 級…，<b>沒有上限</b>（下表列到 10 級＝Lv 110）。</li>
  <li>道具列表中有自己的欄位，Lv 20 前是鎖定的。開「自動技能」也不會跳過：欄位會顯示「!」，點它就能選；開「自動技能」或「自動寶箱」時若沒選，會自動放到升級最多的技能上（0.8.4）。</li>
  <li><b>無盡之塔</b>不變：開始時選一個技能神祇，每 10 層升一級。</li>
  <li>二轉職業保留一轉的技能，所以一轉技能的神祇也選得到。</li>
  <li>事蹟記錄者的「轉移神祇」特權已移除，買過的會退還點數。</li>
</ul>

<h3>神器</h3>
<p>原本的屬性神祇（布理辛加曼、雷神之錘、女武神之鎧…）改名為<b>神器</b>，仍然會從<a href="#runitems">寶箱</a>出現，放在自己的欄位。數值依品質而定。</p>
<div class="tw"><table class="t"><tr><th>神器</th><th>效果（最低 → 最高）</th></tr>
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
      root.querySelector('#dt-rv').textContent = `${r}（Lv ${10 + r * 10}）`;
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
