/* 外觀：首領成就、無盡之塔獎勵與燈籠節收藏。 */
RSW.page({
  id: 'cosmetics', nav: '外觀', title: () => '外觀',
  render() {
    const R = RSW, C = R.cosmetics, L = R.meta.labels.slots || {};
    const slot = s => L[s] || { head_top: '上段頭飾', head_mid: '中段頭飾', head_low: '下段頭飾', weapon: '武器', shield: '盾牌' }[s] || s;
    const name = c => R.esc(c.zh || c.en) + (c.zh ? ` <span class="muted small">${R.esc(c.en)}</span>` : '');
    const covers = c => c.covers.length ? `同時遮住${c.covers.map(slot).join('、')}` : '';
    const boss = C.list.filter(c => c.kills), tower = C.list.filter(c => c.tower), festival = C.list.filter(c => c.ball != null);
    const who = c => c.kills.length > 1 ? c.kills.map(id => R.monLink(id)).join('<br>') + '<div class="muted small">三隻合計</div>' : R.monLink(c.kills[0]);
    const where = c => { const m = R.index().monster[c.kills[0]]; return m ? R.whereText(m) : ''; };
    return `<h2 class="pt">外觀</h2>
<p class="lead">角色面板的「外觀」分頁可以換掉三個頭飾、武器與盾牌的<b>外表</b>，屬性仍然看你身上穿的裝備。外觀屬於整個帳號（所有角色都能用），不能交易。</p>
<div class="note">外觀分頁與首領成就已於 11 月 15 日的 Beta 0.7 開放，之前的擊殺也算數。另有 ${festival.length} 件燈籠節外觀可由活動扭蛋取得。</div>

<h3>怎麼拿</h3>
<ul>
  <li><b>首領成就</b>：事蹟記錄者 › 成就，每個關卡首領擊敗 <b>${C.kills} 次</b>送一個相配的外觀（${boss.length} 個）。</li>
  <li><b>無盡之塔</b>：通過第 50 層解鎖 Blood Savage 髮色與服裝染料，再到廣場造型師換上。</li>
  <li><b>燈籠節</b>：從三種活動扭蛋抽出，共 ${festival.length} 件。重複外觀變成同類扭蛋的碎片，5 個換一次抽取。<a href="#events/lantern-festival">查看活動與完整收藏 →</a></li>
  <li>還沒拿到的會在「外觀」分頁上鎖顯示、標出目前次數，可以先試戴預覽。</li>
  <li>也可以<b>隱藏</b>任一個頭飾（不顯示那一格）。</li>
</ul>

<h3>燈籠節外觀</h3>
<div class="tw"><table class="t"><tr><th>外觀</th><th>部位</th><th>取得方式</th></tr>
${festival.map(c => `<tr><td>${R.img(c.icon)} ${name(c)}</td><td>${R.esc(slot(c.slot))}</td><td>${R.ballLink(c.ball)}</td></tr>`).join('')}
</table></div>

<h3>無盡之塔</h3>
<div class="tw"><table class="t"><tr><th>外觀</th><th>部位</th><th>條件</th></tr>
  ${tower.map(c => `<tr><td>${R.img(c.icon)} ${name(c)}</td><td>${R.esc(slot(c.slot))}</td><td>通過第 ${c.tower} 層</td></tr>`).join('')}
  <tr><td>Blood Savage 染料</td><td>髮色／服裝</td><td>通過第 50 層（到廣場造型師換上）</td></tr>
</table></div>
<p class="muted small">本版外觀收藏未列出舊版預告的嗜血狂戰士頭盔、眼罩與圍巾（Blood Savage），因此暫不列其第 55／60／65 層取得條件。第 50 層染料仍有公告依據；Bronze Sentry、Black Guard 與 Shadow 染料的後續開放情況依遊戲公告。</p>

<h3>首領成就（擊敗 ${C.kills} 次）</h3>
<div class="tw"><table class="t"><tr><th>外觀</th><th>部位</th><th>首領</th><th>出現在</th></tr>
  ${boss.map(c => `<tr><td>${R.img(c.icon)} ${name(c)}${covers(c) ? `<div class="muted small">${covers(c)}</div>` : ''}</td>
    <td>${R.esc(slot(c.slot))}</td><td>${who(c)}</td><td class="small">${where(c)}</td></tr>`).join('')}
</table></div>`;
  },
});

/* 某首領的擊殺外觀（怪物頁用） */
function cosOf(monId) { return ((RSW.cosmetics || {}).list || []).find(c => c.kills && c.kills.includes(monId)); }
