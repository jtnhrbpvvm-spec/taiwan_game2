/* 關卡：開放條件、怪物、首領時間表、可掉落的裝備與卡片 */
RSW.page({
  id: 'stages', nav: '關卡',
  title: arg => (arg && RSW.index().stage[arg] ? RSW.index().stage[arg].name : '關卡'),
  render(arg) {
    const R = RSW, ix = R.index();
    if (arg && ix.stage[arg]) return detail(ix.stage[arg]);
    return `<h2 class="pt">關卡</h2>
<p class="lead">一般關卡需要打倒前一關 MVP 並達到裝備分數門檻。季節活動燈籠節向所有角色開放，入口在廣場的節慶主持人。</p>
<div class="grid">${R.stages.map((s, i) => `<a class="tile" href="#stages/${s.id}"><div>
  <b>${i + 1}. ${R.esc(s.name)}${s.season ? ' <span class="tag">季節活動</span>' : ''}${s.open ? '' : ' <span class="tag dev">尚未開放</span>'}</b>
  <small>${R.esc(s.place)}・怪物等級 ${R.esc(s.levels)}・裝備分數 ${s.gsMin}${s.jobLvMin ? `・職業等級 ${s.jobLvMin}` : ''}</small>
  <small>${s.open ? `${mins(s.runLength)} 分鐘${s.jobCap && !s.jobLvMin ? `・職業等級好升到 ${s.jobCap}` : ''}` : '預告中'}</small></div></a>`).join('')}</div>`;

    function mins(sec) { const m = sec / 60; return m % 1 ? m.toFixed(1) : m; }

    function detail(s) {
      const i = R.stages.indexOf(s), prev = R.stages.slice(0, i).filter(x => !x.season).pop();
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
  ${s.season ? '<div class="small" style="margin-top:6px">所有角色都能進入，不需前一關 MVP 或裝備分數門檻。與廣場的節慶主持人交談即可出發。</div>' : prev ? `<div class="small" style="margin-top:6px">開放條件：用同一個角色打倒 ${R.stageLink(prev.id)} 的 MVP${prevMvp ? ' ' + R.monLink(prevMvp) : ''}${s.jobLvMin ? `，職業等級 ${s.jobLvMin}。這是<a href="#promotion">轉職劇情</a>，只能單人、每個角色玩一次` : ''}。</div>` : '<div class="small" style="margin-top:6px">第一個關卡，一開始就能進。</div>'}
  ${s.reward ? `<div class="small" style="margin-top:6px">首次通關獎勵：${R.itemLink(s.reward)}</div>` : ''}
</div>
${s.season ? '<div class="note event-intro">燈籠節固定 250% 怪物數量、200% 事件。關卡不直接掉裝備、卡片或寵物蛋，頭目改掉對應扭蛋。<a href="#events/lantern-festival">查看扭蛋收藏、活動裝備與完整規則 →</a><br>白素貞限時 2 分鐘；部分場次在她倒下後召喚蛇王，蛇王沒有時間限制。</div>' : ''}
${s.open ? `
${s.bosses && s.bosses.length ? sec('首領時間表', s.bosses) : ''}
${s.optionalBosses && s.optionalBosses.length ? `<p>條件式 MVP：${s.optionalBosses.map(id => R.monLink(id)).join('、')}（部分場次，白素貞倒下後召喚）。</p>` : ''}
${s.storyInfo ? sec('劇情模式的首領', s.storyInfo.bosses) + (s.storyInfo.jobWeapon ? '<p class="small">劇情通關會依職業拿到劇情武器（見各職業頁）。</p>' : '') : ''}
<h3>一般怪物</h3><p>${normal.map(id => R.monLink(id)).join('、') || '—'}</p>
<h3>首領可能掉落</h3>
${s.season ? `<p>${Object.keys(R.festival.bossBalls).map(id => `${R.monLink(id)} → ${R.ballLink(R.festival.bossBalls[id])}`).join('<br>')}</p>` : bossLoot.gear.length ? `<div class="tw"><table class="t"><tr><th>物品</th><th>首領</th><th>機率</th></tr>
  ${bossLoot.gear.sort((a, b) => b.d.chance - a.d.chance).map(x => `<tr><td>${R.itemLink(x.d.id)}</td><td>${R.monLink(x.m.id)}</td><td class="num">${R.pct(x.d.chance)}</td></tr>`).join('')}</table></div>` : '<p class="muted">—</p>'}
<h3>${s.season ? '活動扭蛋的卡片' : '這裡可以拿到的卡片'}</h3>
<p>${s.season ? R.festival.balls.flatMap(b => b.cards).map(R.cardLink).join('、') + '。不在關卡直接掉落，需開對應扭蛋。' : [...new Set([...loot(normal).cards, ...bossLoot.cards])].map(R.cardLink).join('、') || '—'}</p>`
        : `<div class="note">這個關卡還沒開放，目前預告的怪物：${(s.planned.monsters || []).map(id => R.monLink(id)).join('、')}${s.planned.mvp ? `；MVP：${R.monLink(s.planned.mvp)}` : ''}。</div>`}`;
    }
  },
});
