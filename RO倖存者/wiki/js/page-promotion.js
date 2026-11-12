/* 轉職攻略：一轉 → 二轉的條件、練等路線、流程、轉職後的變化 */
RSW.page({
  id: 'promotion', nav: '轉職攻略', title: () => '轉職攻略',
  render() {
    const R = RSW, ix = R.index();
    const castle = R.stages.find(s => s.jobLvMin) || {};
    const prev = R.stages[R.stages.indexOf(castle) - 1] || {};
    const prevMvp = prev.bosses && prev.bosses.length ? prev.bosses[prev.bosses.length - 1].id : null;
    const castleBoss = castle.bosses && castle.bosses.length ? castle.bosses[castle.bosses.length - 1].id : null;
    const firsts = R.jobs.list.filter(j => j.rank === 1);
    const jobCaps = R.stages.filter(s => s.open && s.jobCap && !s.jobLvMin);
    const reward = castle.reward && ix.item[castle.reward];
    return `
<h2 class="pt">轉職攻略：一轉 → 二轉</h2>
<p class="lead">二轉要在「${R.esc(castle.name)}」的劇情裡完成。下面整理條件、練職業等級的路線和轉職後的變化。</p>

<h3>轉職條件（同一個角色要全部達成）</h3>
<div class="tw"><table class="t">
  <tr><th>條件</th><th>內容</th></tr>
  <tr><td>職業等級</td><td><b>${castle.jobLvMin || 50}</b>（職業等級的上限就是 ${castle.jobLvMin || 50}）</td></tr>
  <tr><td>前一關 MVP</td><td>用這個角色打倒 ${R.stageLink(prev.id)} 的 MVP ${prevMvp ? R.monLink(prevMvp) : ''}</td></tr>
  <tr><td>裝備分數</td><td>身上穿著的裝備合計 <b>${castle.gsMin}</b> 以上</td></tr>
</table></div>

<h3>職業等級怎麼練到 ${castle.jobLvMin || 50}</h3>
<p class="small">每個關卡的職業經驗只會好升到某個等級，超過之後幾乎不漲，要換下一個關卡。</p>
<div class="tw"><table class="t">
  <tr><th>關卡</th><th>怪物等級</th><th>需要裝備分數</th><th>職業等級好升到</th></tr>
  ${jobCaps.map(s => `<tr><td>${R.stageLink(s.id)}</td><td>${R.esc(s.levels)}</td><td class="num">${s.gsMin}</td><td class="num">${s.jobCap}</td></tr>`).join('')}
</table></div>
<div class="note">最後一段從 ${prev.jobCap || 49} 升到 ${castle.jobLvMin || 50}，遊戲說明是<b>重複刷 ${R.esc(prev.name)}</b>。</div>

<h3>轉職流程</h3>
<ol class="steps">
  <li>條件都達成後，在遠征選單選「<b>${R.esc(castle.name)}</b>」。這是劇情關（皇家婚禮、獸人突襲），<b>只能單人</b>（有隊伍要先離隊），每個角色只玩一次。帳號裡已經有別的角色通關過這段劇情的話，可以按「跳過劇情」直接拿獎勵（沒有經驗值）。</li>
  <li>劇情的首領是 <a href="#monsters/${castleBoss}">${castleBoss ? R.esc(R.monName(ix.monster[castleBoss])) : '首領'}</a>，打倒就通關。</li>
  <li>劇情結束時跳出「選擇你的二轉職業」，每個一轉從下面兩個裡選一個。${reward ? `首次通關另外拿到 ${R.itemLink(reward.id)}。` : ''}</li>
  <li>轉職後在二轉天賦樹投點：<b>第一個點投在哪個分支，那個分支就是你的專精</b>，之後只能在專精分支投點。</li>
</ol>

<h3>各職業可以轉什麼</h3>
<div class="tw"><table class="t">
  <tr><th>一轉</th><th>可選的二轉</th><th>說明</th></tr>
  ${firsts.map(j => `<tr><td>${R.img(j.icon)} ${R.jobLink(j.id)}${j.tier === 'extended' ? ' <span class="tag dev">擴充職業</span>' : ''}</td>
    <td>${j.promotions.length ? j.promotions.map(p => { const q = ix.job[p]; return R.img(q.icon) + ' ' + R.jobLink(p) + (q.nameF ? '／' + R.esc(q.nameF) : ''); }).join('<br>') : '<span class="muted">目前沒有二轉</span>'}</td>
    <td class="small">${j.promotions.map(p => R.esc(ix.job[p].desc)).join('<br>')}</td></tr>`).join('')}
</table></div>
<p class="muted small">吟遊詩人和舞孃是同一個職業：男性角色是吟遊詩人，女性角色是舞孃。${firsts.filter(j => j.tier === 'extended').map(j => R.esc(j.name)).join('、')}是擴充職業，帳號要先解鎖才能建立；目前遊戲裡看不到公開的解鎖方式。</p>

<h3>轉職後的變化</h3>
<ul>
  <li>一轉的天賦樹和技能<b>全部保留</b>（一轉的 50 點維持轉職時的分配）。</li>
  <li>多出 3 個二轉天賦樹，另有 <b>50 點</b>，但只能投在專精的那一個分支，會學到那個分支的 2 個技能。</li>
  <li>血量是一轉的 2～3 倍，技能欄多一格，攻擊／魔攻的效益大很多（二轉用更陡的曲線）。</li>
  <li>可以進<b>無盡之塔</b>（廣場西邊的塔之守護者）。</li>
  <li>想換專精：找廣場的「<b>職業大師</b>」，付 <b>300 卡普拉點數</b>，二轉天賦點數全部退回，再用第一個點重選分支。</li>
</ul>
<div class="note warn">遊戲標示所有二轉都還在開發中，技能、天賦和數值之後可能會變。</div>`;
  },
});
