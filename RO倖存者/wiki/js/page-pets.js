/* 寵物：取得方式（蛋、進化）、親密度、飾品、各寵物加成 */
RSW.page({
  id: 'pets', nav: '寵物',
  title: arg => (arg && petOf(arg) ? RSW.monName(RSW.index().monster[arg]) || arg : '寵物'),
  render(arg) {
    const R = RSW, P = R.pets, rules = P.rules, ix = R.index();
    const tier = id => rules.tiers.find(t => t.id === id) || {};
    const loyal = tier('Leal'), cordial = tier('Cordial');
    const minutes = target => Math.round((target - rules.start) * rules.secondsPerPoint / 60);
    const name = p => R.esc(p.zh || p.en);
    const icon = p => R.img(p.eggIcon, 'ico', p.eggZh || p.eggEN);
    const howGet = p => {
      if (p.from) {
        const f = petOf(p.from);
        return `由 <a href="#pets/${p.from}">${f ? name(f) : p.from}</a> 進化（${R.esc(loyal.name)}＋打倒${name(p)} ${rules.evolveKills} 次）`;
      }
      const m = ix.monster[p.id];
      const rate = p.boss === 'mvp' ? rules.eggMvp : rules.eggNormal;
      const stages = m ? [...new Set(m.where.filter(w => w.role !== 'planned').map(w => w.stage))].map(R.stageLink).join('、') : '';
      return `${R.monLink(p.id)} 掉蛋 <span class="muted">${R.pct(rate)}</span>${stages ? `<br><span class="small muted">${stages}</span>` : ''}`;
    };

    if (arg && petOf(arg)) return detail(petOf(arg));

    const chains = P.list.filter(p => !p.from && P.list.some(q => q.from === p.id)).map(root => {
      const chain = [root];
      for (let cur = root; ;) { const nx = P.list.find(q => q.from === cur.id); if (!nx) break; chain.push(nx); cur = nx; }
      return chain;
    });
    return `<h2 class="pt">寵物</h2>
<p class="lead">遊戲裡全部 ${P.list.length} 隻寵物。寵物屬於整個帳號，每個角色可以帶一隻，牠會在遊戲局裡跟著你並提供加成。</p>

<h3>怎麼取得</h3>
<ul>
  <li><b>蛋</b>：由對應的怪物掉落，一般怪物 <b>${R.pct(rules.eggNormal)}</b>、MVP <b>${R.pct(rules.eggMvp)}</b>。已經擁有的寵物不會再掉蛋。</li>
  <li><b>進化</b>：首領寵物不會從蛋孵出來，要讓前一隻寵物達到「${R.esc(loyal.name)}」，並打倒那隻首領 ${rules.evolveKills} 次，再到廣場的寵物飼育員進化。原本那隻會留著。</li>
</ul>
${chains.length ? `<p class="small">進化路線：${chains.map(c => c.map(p => `<a href="#pets/${p.id}">${name(p)}</a>`).join(' → ')).join('　｜　')}</p>` : ''}

<h3>親密度</h3>
<p class="small">新寵物從 <b>${rules.start}</b> 開始，帶著牠玩遊戲局，每 <b>${rules.secondsPerPoint} 秒</b>加 1 點（最高 ${rules.max}）。加成會依親密度打折：</p>
<div class="tw"><table class="t"><tr><th>親密度</th><th>從</th><th>加成</th><th>新寵物大約要玩</th></tr>
  ${rules.tiers.map(t => `<tr><td>${R.esc(t.name)}</td><td class="num">${t.min}</td><td class="num">×${t.mult}</td>
    <td class="num">${t.min > rules.start ? minutes(t.min) + ' 分鐘' : '—'}</td></tr>`).join('')}</table></div>

<h3>寵物飾品</h3>
<p class="small">寵物到「${R.esc(cordial.name)}」（${cordial.min}）後，廣場的寵物飼育員會賣牠的飾品：<b>${rules.accPrice} 卡普拉點數</b>，戴上後加成 <b>×${rules.accMult}</b>。卡普拉點數靠賣裝備和卡片取得。首領寵物沒有飾品。</p>

<h3>全部寵物</h3>
<div class="filters"><input id="pt-q" type="search" placeholder="寵物或效果…"><span class="count" id="pt-n"></span></div>
<div class="tw" id="pt-list"></div>`;

    function detail(p) {
      const rows = [...rules.tiers.map(t => [R.esc(t.name) + `（×${t.mult}）`, p[t.id === 'Neutral' ? 'neutral' : t.id === 'Cordial' ? 'cordial' : 'loyal']]),
        ...(p.acc ? [[`${R.esc(loyal.name)}＋飾品（×${loyal.mult * rules.accMult}）`, p.loyalAcc]] : [])];
      const next = P.list.filter(q => q.from === p.id);
      return `<p class="small"><a href="#pets">← 所有寵物</a></p>
<h2 class="pt">${icon(p)} ${name(p)} <span class="muted small">${R.esc(p.en)}</span>${p.from ? '<span class="tag mvp">進化寵物</span>' : ''}</h2>
<div class="box">
  <div>取得：${howGet(p)}</div>
  ${!p.from ? `<div class="small" style="margin-top:6px">蛋：${R.esc(p.eggZh || p.eggEN || '')}</div>` : ''}
  ${p.acc ? `<div class="small" style="margin-top:6px">飾品：${R.img(p.accIcon)} ${R.esc(p.accZh || p.accEN || '')}（${R.esc(cordial.name)}後向寵物飼育員買，${rules.accPrice} 卡普拉點數）</div>` : '<div class="small muted" style="margin-top:6px">沒有飾品</div>'}
  ${next.length ? `<div class="small" style="margin-top:6px">可以進化成：${next.map(q => `<a href="#pets/${q.id}">${name(q)}</a>（再打倒${name(q)} ${rules.evolveKills} 次）`).join('、')}</div>` : ''}
</div>
<h3>加成</h3>
<div class="tw"><table class="t"><tr><th>親密度</th><th>效果</th></tr>
  ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v.map(R.esc).join('、')}</td></tr>`).join('')}</table></div>
<p class="small">對應的怪物：${R.monLink(p.id, true)}</p>`;
    }
  },
  bind(root, arg) {
    const R = RSW, P = R.pets;
    if (arg) return;
    const q = root.querySelector('#pt-q');
    const draw = () => {
      const kw = q.value.trim().toLowerCase();
      const list = P.list.filter(p => !kw || [p.zh, p.en, ...p.loyal].join(' ').toLowerCase().includes(kw));
      root.querySelector('#pt-n').textContent = `${list.length} 隻`;
      root.querySelector('#pt-list').innerHTML = `<table class="t"><tr><th>寵物</th><th>取得方式</th><th>忠誠時的加成</th><th>飾品</th></tr>
        ${list.map(p => `<tr><td>${R.img(p.eggIcon)} <a href="#pets/${p.id}">${R.esc(p.zh || p.en)}</a><br><span class="muted small">${R.esc(p.en)}</span></td>
          <td class="small">${howGetShort(p)}</td><td class="small">${p.loyal.map(R.esc).join('<br>')}</td>
          <td class="small">${p.acc ? R.img(p.accIcon) + ' ' + R.esc(p.accZh || p.accEN || '') : '—'}</td></tr>`).join('')}</table>`;
    };
    function howGetShort(p) {
      if (p.from) { const f = petOf(p.from); return `由 <a href="#pets/${p.from}">${R.esc(f ? f.zh || f.en : p.from)}</a> 進化`; }
      return `${R.monLink(p.id)} 掉蛋 <span class="muted">${R.pct(p.boss === 'mvp' ? P.rules.eggMvp : P.rules.eggNormal)}</span>`;
    }
    q.oninput = draw;
    draw();
  },
});

function petOf(id) { return (RSW.pets.list || []).find(p => p.id === id); }
