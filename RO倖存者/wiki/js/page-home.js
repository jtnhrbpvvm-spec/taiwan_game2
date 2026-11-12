/* 首頁：遊戲簡介、新手流程、各區入口 */
RSW.page({
  id: 'home', nav: '首頁', title: () => '',
  render() {
    const R = RSW, ix = R.index();
    const open = R.stages.filter(s => s.open);
    const first = R.jobs.list.filter(j => j.rank === 1 && j.tier !== 'extended');
    const count = (n, label, href) => `<a class="tile" href="${href}"><div><b>${n}</b><small>${label}</small></div></a>`;
    return `
<h2 class="pt">RO 倖存者小百科</h2>
<p class="lead">RO Survivors 是以仙境傳說（Ragnarok Online）為靈感的免費網頁倖存者遊戲。這裡整理遊戲裡的職業、技能、轉職、物品、卡片與怪物資料，名稱採用台版仙境傳說譯名。</p>

<div class="grid">
  ${count(first.length + ' 個一轉', '職業與技能、天賦樹', '#jobs')}
  ${count(R.jobs.list.filter(j => j.rank === 2).length + ' 個二轉', '轉職條件與方法', '#promotion')}
  ${count(R.items.length + ' 件裝備', '每件的取得方式與掉率', '#items')}
  ${count(R.cards.length + ' 張卡片', '掉落怪物與效果', '#cards')}
  ${count(R.monsters.length + ' 種怪物', '出現關卡、掉落物', '#monsters')}
  ${count(open.length + ' 個關卡', '開放條件、首領時間表', '#stages')}
  ${count(R.pets.list.length + ' 隻寵物', '蛋的掉率、進化、親密度', '#pets')}
  ${count(Object.keys(R.deities.skills).length + ' 個技能神祇', '寶箱第五格：改造技能', '#deities')}
</div>

<h3>新手流程</h3>
<ol class="steps">
  <li><b>建立角色、選一轉職業</b>：劍士、魔法師、弓箭手、服事、盜賊、商人。每個職業會帶初始武器和防具。<a href="#jobs">看各職業特色 →</a></li>
  <li><b>從${R.stageLink(open[0].id)}開始</b>：每局在關卡中撐過怪物群，最後打倒 MVP。打倒 MVP 才會開放下一個關卡（每個角色各自計算）。</li>
  <li><b>局內升級選卡</b>：每局從遊戲局等級 1 開始，升級時選技能卡或強化卡，局結束就消失。</li>
  <li><b>局外成長</b>：基本等級（最高 99，給素質點數）和職業等級（最高 50，每級 1 點天賦）會保留。首領掉的裝備、卡片整個帳號共用。</li>
  <li><b>職業等級 50 轉二轉</b>：到普隆德拉城打劇情、選二轉職業。<a href="#promotion">看完整轉職攻略 →</a></li>
  <li><b>二轉後</b>可以挑戰無盡之塔（廣場西邊的塔之守護者）。</li>
</ol>

<h3>關卡一覽</h3>
<div class="tw"><table class="t">
  <tr><th>關卡</th><th>怪物等級</th><th>需要裝備分數</th><th>職業等級好升到</th><th>MVP</th></tr>
  ${R.stages.map(s => `<tr><td>${R.stageLink(s.id)}${s.open ? '' : ' <span class="tag dev">尚未開放</span>'}${s.jobLvMin ? ' <span class="tag mini">轉職劇情</span>' : ''}</td>
    <td>${R.esc(s.levels)}</td><td class="num">${s.gsMin ?? '—'}</td><td class="num">${s.jobCap ?? '—'}</td>
    <td>${s.bosses && s.bosses.length ? R.monLink(s.bosses[s.bosses.length - 1].id) : s.planned && s.planned.mvp ? R.monLink(s.planned.mvp) : '—'}</td></tr>`).join('')}
</table></div>
<p class="muted small">每個關卡都要用同一個角色打倒前一關的 MVP，並且身上裝備的裝備分數達到門檻才能進入。</p>

<h3>掉寶怎麼算</h3>
<div class="note">
  <b>裝備</b>：首領（小首領、MVP）每件 10%～15%，首領的武器固定 5%；一般怪物每件只有 0.015%～0.03%。
  掉下來的裝備會隨機附帶加成（詞綴），威力看掉落關卡的「階級」，不是看 RO 原本的名稱。<br>
  <b>★ 專屬加成</b>：很多裝備有自己的能力（取自 RO 原本的效果），任何品質都有，和詞綴分開算；數值會乘上掉落關卡的階級（第 2 階級＝×2）和精煉。<br>
  <b>卡片</b>：每種怪物都可能掉自己的卡片，非常稀有，首領比較容易掉。每張卡只能插一種部位（頭飾卡上中下三格都能插）；卡片加成<b>不受</b>關卡階級和精煉影響。<br>
  <b>組隊</b>：裝備和卡片用擲骰分配（需求骰優先，沒人需要才比貪婪骰）；怪物變多，但掉落的卡片和蛋跟單人一樣多。<br>
  <b>寵物蛋</b>：一般怪物 0.01%，MVP 0.1%；已經有的寵物不會再掉。<br>
  出發前調高難度，戰利品最多可以加倍。
</div>`;
  },
});
