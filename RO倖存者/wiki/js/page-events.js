/* 活動資料依遊戲內 Beta 0.7 / 0.7.1 公告及當期收藏整理。 */
RSW.page({
  id: 'events', nav: '活動', title: () => '燈籠節活動',
  render() {
    const R = RSW, f = R.festival;
    if (!f) return '<h2 class="pt">活動</h2><div class="empty">目前尚無已整理的活動資料。</div>';
    const ix = R.index(), stage = ix.stage[f.stage];
    const date = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(f.checkedAt));
    const qualities = ['普通／優良／稀有（白、綠、藍）', '史詩（紫）', '傳說'];
    const cosmetics = id => R.cosmetics.list.filter(c => c.ball === id);
    const bossIds = id => Object.keys(f.bossBalls).filter(m => f.bossBalls[m] === id);
    const slot = s => R.meta.labels.slots[s] || s;
    return `<h2 class="pt">燈籠節 <span class="tag">季節活動</span></h2>
<p class="lead">前往洛陽的燈籠與市集之間挑戰頭目，收集扭蛋、專屬裝備、外觀與卡片。</p>
<div class="note event-intro"><b>${R.esc(date)} 已確認開放</b> · 公告說明開放到聖誕季，尚未公布確切結束日期與時間。<br>
入口：普隆德拉廣場的<b>節慶主持人</b>。所有角色都能進入，不需打倒前一關 MVP，也沒有裝備分數門檻。</div>

<h3>活動怎麼玩</h3>
<ol class="steps">
  <li>在廣場與節慶主持人交談，選擇前往<b>燈籠節</b>。關卡是第 2 階級，怪物標示等級 26–30，難度會一路提高，後期約為開始時的三倍。</li>
  <li>活動固定使用 <b>250% 怪物數量、200% 事件</b>；生命、傷害與速度維持預設，沒有難度滑桿。出發前可以選「立即」或「累積」升級。</li>
  <li><b>關卡不直接掉裝備、卡片或寵物蛋</b>。頭目掉落對應扭蛋，結算後存入帳號；每隻頭目出現後 15 秒內不會產生新的普通怪物。</li>
  <li>回到節慶主持人處開扭蛋，可一次開 <b>1 顆或 9 顆</b>，也能查看收藏。重複外觀變成該扭蛋的碎片，同類 <b>${f.fragmentsPerRoll} 個碎片</b>換一次抽取；裝備可以重複得到。</li>
</ol>

<h3>三種扭蛋與獎勵</h3>
<div class="tw"><table class="t"><tr><th>扭蛋</th><th>來源頭目</th><th>外觀收藏</th><th>裝備品質</th><th>極少見卡片</th></tr>
${f.balls.map(b => `<tr><td>${R.img(b.icon, 'ico lg')} <b>${R.esc(b.name)}</b></td><td>${bossIds(b.id).map(m => R.monLink(m)).join('、')}</td><td>${b.cosmetics.length} 件</td><td>${qualities[b.id]}</td><td>${b.cards.length} 張</td></tr>`).join('')}
</table></div>
<p class="small">三種扭蛋的裝備共用 <b>${f.gear.length} 件燈籠節專屬裝備</b>，只會抽到目前角色能穿的物品，階級固定為 2，並綁定帳號。不能把外觀收藏數當成每件物品的抽中機率；公告未提供各獎勵的精確機率。</p>

<h3>頭目時間表與蛇王</h3>
<div class="tw"><table class="t"><tr><th>時間</th><th>頭目</th><th>獎勵</th></tr>
${(stage.bosses || []).map(b => `<tr><td>${R.min(b.t / 60)}</td><td>${R.monLink(b.id)}</td><td>${R.ballLink(f.bossBalls[b.id])}</td></tr>`).join('')}
<tr><td>部分場次</td><td>${R.monLink('dark_snake_lord')}（蛇王）</td><td>${R.ballLink(2)}</td></tr>
</table></div>
<p class="small">第 12 分鐘的 Rice Cake Boy 與 Spring Rabbit 同時登場。白素貞（White Lady）限時 2 分鐘；部分場次在她倒下後出現紫色召喚儀式，接著召喚蛇王，蛇王沒有時間限制。<a href="#stages/louyang">查看關卡與普通怪物 →</a></p>
<details class="event-details"><summary>頭目走位重點</summary><ul>
<li>Dancing Dragon：避開之字形衝刺與鞭炮陣。</li>
<li>Live Peach Tree：注意星形樹根、桃子攻擊；樹蔭招式要進入綠色安全圈。</li>
<li>Wanderer：連續斬擊與影子出刀；周身拔刀的招式要貼近頭目躲避。</li>
<li>Wooden Golem：避開遠距跳躍、追蹤樹根、四分地面與滾木。</li>
<li>Rice Cake Boy／Spring Rabbit：避開減速麻糬水窪與傳球；其中一隻倒下後，另一隻會狂怒。</li>
<li>白素貞：留意玉扇、紙鶴、蓮花與花瓣，低血量會進入新階段。</li>
<li>蛇王：優先擊殺追蹤墨蛇、清掉墨印；被墨染雙眼時到水中清洗。</li>
</ul></details>

<h3>扭蛋收藏：${f.balls.reduce((n, b) => n + b.cosmetics.length, 0)} 件外觀、${f.balls.reduce((n, b) => n + b.cards.length, 0)} 張卡片</h3>
${f.balls.map(b => `<details class="event-details"><summary>${R.esc(b.name)}：${b.cosmetics.length} 件外觀、${b.cards.length} 張卡片</summary>
<h4>卡片（由扭蛋抽出）</h4><p>${b.cards.map(id => { const c = ix.card[id]; return c ? `${R.img(c.image)} ${R.cardLink(id)}` : ''; }).join('、')}</p>
<div class="tw"><table class="t"><tr><th>外觀</th><th>部位</th></tr>${cosmetics(b.id).map(c => `<tr><td>${R.img(c.icon)} ${R.esc(c.zh || c.en)}</td><td>${R.esc(slot(c.slot))}</td></tr>`).join('')}</table></div>
</details>`).join('')}

<details class="event-details"><summary>${f.gear.length} 件活動專屬裝備</summary><p class="small">點名稱可查看職業限制、★ 專屬效果與取得方式；同名的一般裝備可能有不同效果。</p>
<div class="tw"><table class="t"><tr><th>裝備</th><th>部位</th><th>可裝備職業</th></tr>${f.gear.map(id => { const it = ix.item[id]; return `<tr><td>${R.itemLink(id)}</td><td>${R.esc(R.slotName(it))}</td><td class="small">${it.jobs ? it.jobs.map(R.jobLink).join('、') : '所有職業'}</td></tr>`; }).join('')}</table></div></details>

<h3>11 月 15 日的活動修正（Beta 0.7.1）</h3>
<ul><li>組隊成員各自於關卡結束領取扭蛋，修正先前郵差寄來空信的問題。</li>
<li>關閉遊戲或斷線導致無法領取時，扭蛋會在幾分鐘內直接進入帳號；重新登入後由「你的上一局」顯示，不再透過郵差。</li></ul>
<p class="muted small">資料依 <a href="https://ro-survivors.com/" target="_blank" rel="noopener">遊戲內「最新消息」Beta 0.7、0.7.1</a>與當期活動收藏整理，版本 ${R.esc(f.version)}。活動開放狀態與內容可能隨後續版本調整。</p>`;
  },
});
