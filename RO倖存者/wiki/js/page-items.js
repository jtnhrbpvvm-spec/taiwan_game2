/* 物品：裝備列表（依部位、職業、取得方式篩選）、單一物品的取得方式 */
RSW.page({
  id: 'items', nav: '物品與取得',
  title: arg => (arg && RSW.index().item[arg] ? RSW.itemName(RSW.index().item[arg]) : '物品與取得'),
  render(arg) {
    const R = RSW, ix = R.index();
    if (arg && ix.item[arg]) return detail(ix.item[arg]);
    const slots = [...new Set(R.items.map(i => i.slot))];
    return `<h2 class="pt">物品與取得</h2>
<p class="lead">遊戲裡全部 ${R.items.length} 件裝備。點物品看哪隻怪物、哪個關卡會掉，以及掉率。</p>
<div class="note small">首領每件 10%～15%（武器固定 5%），一般怪物每件 0.015%～0.03%。調高難度可以增加戰利品（單人最高 ×2.5、組隊 ×2）。關卡中掉的裝備要等結算後才鑑定出詞綴。掉下來的裝備會隨機附帶加成，威力看掉落關卡的階級。</div>
<div class="filters">
  <select id="it-slot"><option value="">全部部位</option>${slots.map(s => `<option value="${s}">${R.esc(R.meta.labels.slots[s] || s)}</option>`).join('')}</select>
  <select id="it-job"><option value="">全部職業</option>${R.jobs.list.filter(j => j.rank === 1).map(j => `<option value="${j.id}">${R.esc(j.name)}</option>`).join('')}</select>
  <select id="it-src"><option value="">全部取得方式</option><option value="boss">首領掉落</option><option value="drop">一般怪物掉落</option>
    <option value="starter">初始裝備</option><option value="story">劇情／通關獎勵</option><option value="secret">秘密裝備</option><option value="none">目前無法取得</option></select>
  <input id="it-q" type="search" placeholder="名稱（中英文皆可）…">
  <span class="count" id="it-n"></span>
</div>
<div class="tw" id="it-list"></div>`;

    function detail(it) {
      const rows = R.sourceRows(it);
      const jobs = it.jobs ? it.jobs.map(R.jobLink).join('、') : '所有職業';
      return `<p class="small"><a href="#items">← 所有物品</a></p>
<h2 class="pt">${R.img(it.icon, 'ico lg')} ${R.esc(R.itemName(it))} <span class="muted small">${R.esc(it.en)}</span>
  ${it.rare ? '<span class="tag star">稀有</span>' : ''}${it.secret ? '<span class="tag mvp">秘密</span>' : ''}${it.starter ? '<span class="tag">初始裝備</span><span class="tag">不可交易</span>' : ''}</h2>
<div class="box">
  <span class="stat">部位 <b>${R.esc(R.slotName(it))}</b></span>
  <span class="stat">卡片插槽 <b>${it.cardSlots}</b></span>
  ${it.base && it.base.wlv ? `<span class="stat">武器等級 <b>${it.base.wlv}</b></span>` : ''}
  ${it.gender ? `<span class="stat">限 <b>${it.gender === 'f' ? '女性' : '男性'}</b></span>` : ''}
  <div class="small" style="margin-top:6px">可裝備：${jobs}</div>
  ${it.bonuses.length ? `<div class="small" style="margin-top:6px">固定效果：${it.bonuses.map(R.esc).join('、')}</div>` : ''}
  ${it.sig.length ? `<div class="small" style="margin-top:6px">★ 專屬加成：${it.sig.map(R.esc).join('、')}${it.sigMax.join() !== it.sig.join() ? `（最高品質：${it.sigMax.map(R.esc).join('、')}）` : ''}<span class="muted">　數值再乘上掉落關卡的階級和精煉</span></div>` : ''}
</div>
<h3>取得方式</h3>
${rows.length ? `<div class="tw"><table class="t"><tr><th>方式</th><th>來源</th><th>地點</th><th>機率</th></tr>
  ${rows.map(r => `<tr><td>${r.how}</td><td>${r.who}</td><td class="small">${r.where}</td><td class="num">${r.chance === 1 ? '必得' : R.pct(r.chance)}</td></tr>`).join('')}</table></div>`
    : it.secret ? '<div class="note warn">秘密裝備：遊戲裡有隱藏的取得方式，目前沒有公開。</div>'
      : '<div class="note">目前沒有任何怪物或劇情會給這件裝備。多半是舊版留下的物品（舊存檔或玩家交易才會有），之後改版可能重新加入掉落。</div>'}
<p class="muted small">機率是每隻怪物死亡時的掉落機率，難度加成前的數字。</p>`;
    }
  },
  bind(root, arg) {
    const R = RSW;
    if (arg) return;
    const $ = s => root.querySelector(s);
    const srcType = it => {
      const s = it.sources || [];
      const t = new Set();
      for (const x of s) {
        if (x.type === 'drop') { const m = R.index().monster[x.monster]; t.add(m && m.boss ? 'boss' : 'drop'); }
        else if (x.type === 'reward') t.add('story'); else t.add(x.type);
      }
      if (it.secret) t.add('secret');
      if (!t.size) t.add('none');
      return t;
    };
    const best = it => {
      const d = (it.sources || []).filter(x => x.type === 'drop').sort((a, b) => b.chance - a.chance)[0];
      if (d) return `${R.monLink(d.monster)} <span class="muted">${R.pct(d.chance)}</span>${it.sources.filter(x => x.type === 'drop').length > 1 ? ` <span class="muted small">等 ${it.sources.filter(x => x.type === 'drop').length} 種</span>` : ''}`;
      const o = (it.sources || [])[0];
      if (o) return o.type === 'starter' ? `初始裝備（${R.jobLink(o.job)}）` : o.type === 'story' ? `失事輪劇情（${R.jobLink(o.job)}）` : `${R.stageLink(o.stage)} 首次通關`;
      return it.secret ? '<span class="muted">秘密</span>' : '<span class="muted">目前無法取得</span>';
    };
    const draw = () => {
      const slot = $('#it-slot').value, job = $('#it-job').value, src = $('#it-src').value, kw = $('#it-q').value.trim().toLowerCase();
      const jobOk = it => !job || !it.jobs || it.jobs.includes(job);
      const list = R.items.filter(it => (!slot || it.slot === slot) && jobOk(it) && (!src || srcType(it).has(src)) &&
        (!kw || ((it.zh || '') + ' ' + (it.en || '')).toLowerCase().includes(kw)));
      $('#it-n').textContent = `${list.length} 件`;
      $('#it-list').innerHTML = list.length ? `<table class="t"><tr><th>物品</th><th>部位</th><th>插槽</th><th>主要取得</th></tr>
        ${list.map(it => `<tr><td>${R.itemLink(it.id)}<br><span class="muted small">${R.esc(it.en)}</span></td><td class="small">${R.esc(R.slotName(it))}</td>
          <td class="num">${it.cardSlots}</td><td class="small">${best(it)}</td></tr>`).join('')}</table>` : '<div class="empty">沒有符合的物品</div>';
    };
    for (const s of ['#it-slot', '#it-job', '#it-src']) $(s).onchange = draw;
    $('#it-q').oninput = draw;
    draw();
  },
});
