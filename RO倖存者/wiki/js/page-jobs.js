/* 職業與技能：職業列表、單一職業的能力、技能、天賦樹 */
RSW.page({
  id: 'jobs', nav: '職業與技能',
  title: arg => (arg ? RSW.jobName(arg) : '職業與技能'),
  render(arg) {
    const R = RSW;
    return arg && R.index().job[arg] ? detail(arg) : list();

    function list() {
      const firsts = R.jobs.list.filter(j => j.rank === 1);
      const tile = j => `<a class="tile" href="#jobs/${j.id}">${R.img(j.icon)}<div><b>${R.esc(j.name)}${j.nameF ? '／' + R.esc(j.nameF) : ''}</b>
        <small>${R.esc(j.desc)}</small></div></a>`;
      return `<h2 class="pt">職業與技能</h2>
<p class="lead">一轉 6 個（另有 3 個擴充職業），每個一轉在職業等級 50 可以轉成兩種二轉之一。點職業看技能和完整天賦樹。</p>
${firsts.map(j => `<h3>${R.img(j.icon)} ${R.esc(j.name)}${j.tier === 'extended' ? ' <span class="tag dev">擴充職業</span>' : ''}</h3>
<div class="grid">${tile(j)}${j.promotions.map(p => tile(R.index().job[p])).join('')}</div>`).join('')}`;
    }

    function detail(id) {
      const ix = R.index(), j = ix.job[id];
      const base = j.base ? ix.job[j.base] : null;
      const tal = R.talents[id] || [];
      const brs = R.jobs.branches[id] || [];
      const stat = (k, v) => `<span class="stat">${k} <b>${v}</b></span>`;
      const learned = tal.filter(t => t.learn).map(t => t.learn);
      const items = ids => ids.map(i => R.itemLink(i)).join('、');
      return `<p class="small"><a href="#jobs">← 所有職業</a></p>
<h2 class="pt">${R.img(j.icon, 'ico lg')} ${R.esc(j.name)}${j.nameF ? '／' + R.esc(j.nameF) : ''}
  <span class="tag">${j.rank === 2 ? '二轉' : '一轉'}</span>${j.rank === 2 ? '<span class="tag dev">開發中</span>' : ''}${j.tier === 'extended' ? '<span class="tag dev">擴充職業</span>' : ''}</h2>
<p>${R.esc(j.desc)}</p>
<div class="box">${stat('血量', j.hp)}${stat('移動速度', j.speed)}${stat('防禦', j.armor)}${stat('類型', R.esc(j.scalingName))}
  ${j.mount ? stat('坐騎', '大嘴鳥') : ''}
  ${base ? `<div class="small" style="margin-top:6px">由 ${R.jobLink(base.id)} 轉職而來，保留它的技能和天賦樹（50 點）。<a href="#promotion">轉職方法 →</a></div>` : ''}
  ${j.promotions.length ? `<div class="small" style="margin-top:6px">職業等級 50 可轉：${j.promotions.map(p => R.jobLink(p)).join('、')}　<a href="#promotion">轉職方法 →</a></div>` : ''}
  ${j.starter.length ? `<div class="small" style="margin-top:6px">初始裝備：${items(j.starter)}</div>` : ''}
  ${j.story.length ? `<div class="small" style="margin-top:6px">失事輪劇情獎勵武器：${items(j.story)}</div>` : ''}
</div>

<h3>${j.rank === 2 ? '二轉技能（由天賦分支學會）' : '技能'}</h3>
${skillTable(j.rank === 2 ? (j.skills.length ? j.skills : learned) : j.skills)}
${j.rank === 1 && learned.length ? `<h3>天賦學會的技能</h3>${skillTable(learned)}` : ''}

<h3>天賦樹</h3>
<p class="small">${j.rank === 2 ? '二轉有 50 點，但只能投在一個分支（專精）。第一個點投在哪裡就決定專精，換專精找廣場的職業大師（300 卡普拉點數）。'
    : '50 點天賦（每個職業等級 1 點），隨意分配到三個分支。'}每個分支投滿 5 點開放下一排。</p>
${brs.map((b, bi) => branch(b, bi)).join('')}`;

      function skillTable(ids) {
        const list = [...new Set(ids)].map(s => ix.skill[s]).filter(Boolean);
        if (!list.length) return '<p class="muted">（沒有資料）</p>';
        return `<div class="tw"><table class="t"><tr><th>技能</th><th>說明</th><th>最高等級</th></tr>
          ${list.map(s => `<tr><td>${R.skillLink(s.id)}<br>${s.tagNames.map(t => `<span class="tag">${R.esc(t)}</span>`).join(' ')}</td>
          <td class="small">${R.esc(s.desc1 || '')}${s.descMax ? `<br><span class="muted">每升一級：${R.esc(s.descMax)}</span>` : ''}</td><td class="num">${s.maxLevel}</td></tr>`).join('')}
        </table></div>`;
      }

      function branch(b, bi) {
        const ts = tal.filter(t => t.branch === bi);
        const total = ts.reduce((a, t) => a + t.maxRank, 0);
        const rows = [...new Set(ts.map(t => t.row))].sort((a, b) => a - b);
        const paths = b.paths ? Object.values(b.paths) : [];
        return `<details class="fold"${bi === 0 ? ' open' : ''}><summary>${R.img(b.icon)} ${R.esc(b.name)} <span class="tag">共 ${total} 級</span></summary><div class="in">
  <p class="small muted">${R.esc(b.desc)}</p>
  ${paths.length ? `<p class="small">${paths.map(p => `<span class="tag" title="${R.esc(p.desc)}">${R.esc(p.name)}</span>`).join(' ')}</p>` : ''}
  ${rows.map(r => `<div class="row-h">${r === 0 ? '第 1 排' : `第 ${r + 1} 排（這個分支投 ${r * 5} 點後開放）`}</div>
    ${ts.filter(t => t.row === r).map(t => talent(t, b)).join('')}`).join('')}
</div></details>`;
      }

      function talent(t, b) {
        const extra = [];
        if (t.learn) extra.push(`學會技能 ${R.skillLink(t.learn, false)}`);
        if (t.weapons && t.weapons.length) extra.push(`限 ${t.weapons.map(R.esc).join('、')}`);
        if (t.needsShield) extra.push('需要盾牌');
        if (t.path && b.paths && b.paths[t.path]) extra.push(`路線：${R.esc(b.paths[t.path].name)}`);
        const req = t.req ? [].concat(t.req).map(r => (tal.find(x => x.id === r) || {}).name || r) : [];
        if (req.length) extra.push(`前置：${req.map(R.esc).join('、')} 點滿`);
        return `<div class="talent">${R.img(t.icon, 'px')}<div><span class="tn">${R.esc(t.name)}</span>
          <span class="tag">${t.learn ? '★ 學技能' : '最高 ' + t.maxRank}</span>
          <div class="td">${R.esc(t.desc1 || '')}${t.descMax && t.maxRank > 1 ? `<span class="muted">（點滿：${R.esc(t.descMax)}）</span>` : ''}</div>
          ${extra.length ? `<div class="small muted">${extra.join('　')}</div>` : ''}</div></div>`;
      }
    }
  },
});
