/* 關卡：開放條件、怪物、首領時間表、可掉落的裝備與卡片 */
RSW.page({
  id: 'stages', nav: '關卡',
  title: arg => (arg && RSW.index().stage[arg] ? RSW.index().stage[arg].name : '關卡'),
  render(arg) {
    const R = RSW, ix = R.index();
    if (arg && ix.stage[arg]) return detail(ix.stage[arg]);
    return `<h2 class="pt">關卡</h2>
<p class="lead">每個關卡都要用同一個角色打倒前一關的 MVP，並且身上裝備的裝備分數達到門檻才能進入。</p>
<div class="grid">${R.stages.map((s, i) => `<a class="tile" href="#stages/${s.id}"><div>
  <b>${i + 1}. ${R.esc(s.name)}${s.open ? '' : ' <span class="tag dev">尚未開放</span>'}</b>
  <small>${R.esc(s.place)}・怪物等級 ${R.esc(s.levels)}・裝備分數 ${s.gsMin}${s.jobLvMin ? `・職業等級 ${s.jobLvMin}` : ''}</small>
  <small>${s.open ? `${mins(s.runLength)} 分鐘${s.jobCap && !s.jobLvMin ? `・職業等級好升到 ${s.jobCap}` : ''}` : '預告中'}</small></div></a>`).join('')}</div>`;

    function mins(sec) { const m = sec / 60; return m % 1 ? m.toFixed(1) : m; }

    function detail(s) {
      const i = R.stages.indexOf(s), prev = R.stages[i - 1];
      const prevMvp = prev && prev.bosses && prev.bosses.length ? prev.bosses[prev.bosses.length - 1].id : null;
      const bossIds = new Set((s.bosses || []).map(b => b.id));
      const normal = (s.pool || []).filter(m => !bossIds.has(m));
      const loot = ids => {
        const gear = [], cards = [];
        for (const id of ids) {
          const m = ix.monster[id];
          if (!m) continue;
          for (const d of m.drops) gear.push({ d, m });
          if (m.card) cards.push(m.card);
        }
        return { gear, cards };
      };
      const bossLoot = loot([...bossIds]);
      const sec = (title, b) => `<h3>${title}</h3><div class="tw"><table class="t"><tr><th>時間</th><th>首領</th><th>HP</th></tr>
        ${b.map((x, k) => `<tr><td>${R.min(Math.round(x.t / 6) / 10)}</td><td>${R.monLink(x.id)}${k === b.length - 1 ? '' : ''}</td><td class="num">${R.num((ix.monster[x.id] || {}).hp)}</td></tr>`).join('')}</table></div>`;
      return `<p class="small"><a href="#stages">← 所有關卡</a></p>
<h2 class="pt">${R.esc(s.name)} <span class="muted small">${R.esc(s.place)}</span>${s.open ? '' : '<span class="tag dev">尚未開放</span>'}</h2>
<div class="box">
  <span class="stat">怪物等級 <b>${R.esc(s.levels)}</b></span><span class="stat">階級 <b>${s.tier}</b></span>
  <span class="stat">需要裝備分數 <b>${s.gsMin}</b></span>${s.jobLvMin ? `<span class="stat">需要職業等級 <b>${s.jobLvMin}</b></span>` : ''}
  ${s.open ? `<span class="stat">時間 <b>${mins(s.runLength)} 分鐘</b></span>${s.jobCap && !s.jobLvMin ? `<span class="stat">職業等級好升到 <b>${s.jobCap}</b></span>` : ''}` : ''}
  ${prev ? `<div class="small" style="margin-top:6px">開放條件：用同一個角色打倒 ${R.stageLink(prev.id)} 的 MVP${prevMvp ? ' ' + R.monLink(prevMvp) : ''}${s.jobLvMin ? `，職業等級 ${s.jobLvMin}。這是<a href="#promotion">轉職劇情</a>，只能單人、每個角色玩一次` : ''}。</div>` : '<div class="small" style="margin-top:6px">第一個關卡，一開始就能進。</div>'}
  ${s.reward ? `<div class="small" style="margin-top:6px">首次通關獎勵：${R.itemLink(s.reward)}</div>` : ''}
</div>
${s.open ? `
${s.bosses && s.bosses.length ? sec('首領時間表', s.bosses) : ''}
${s.storyInfo ? sec('劇情模式的首領', s.storyInfo.bosses) + (s.storyInfo.jobWeapon ? '<p class="small">劇情通關會依職業拿到劇情武器（見各職業頁）。</p>' : '') : ''}
<h3>一般怪物</h3><p>${normal.map(id => R.monLink(id)).join('、') || '—'}</p>
<h3>首領可能掉落</h3>
${bossLoot.gear.length ? `<div class="tw"><table class="t"><tr><th>物品</th><th>首領</th><th>機率</th></tr>
  ${bossLoot.gear.sort((a, b) => b.d.chance - a.d.chance).map(x => `<tr><td>${R.itemLink(x.d.id)}</td><td>${R.monLink(x.m.id)}</td><td class="num">${R.pct(x.d.chance)}</td></tr>`).join('')}</table></div>` : '<p class="muted">—</p>'}
<h3>這裡可以拿到的卡片</h3>
<p>${[...new Set([...loot(normal).cards, ...bossLoot.cards])].map(R.cardLink).join('、') || '—'}</p>`
        : `<div class="note">這個關卡還沒開放，目前預告的怪物：${(s.planned.monsters || []).map(id => R.monLink(id)).join('、')}${s.planned.mvp ? `；MVP：${R.monLink(s.planned.mvp)}` : ''}。</div>`}`;
    }
  },
});
