/* 依 20261125_7c004f793 遊戲內繁中公告 Beta 0.8.2～0.8.4 整理（技能頁也會顯示） */
RSW.balanceNotes2 = {
  bash: '神祇移除流血；改為目標 +1，每 3 級再 +1（不受卡片上限限制）。',
  mammonite: '神祇移除幸運一擊；改為目標 +1，每 3 級再 +1。',
  sword_dance: '神祇充能武器的額外雷屬性傷害為 60%（每級 +5%）；脈衝上限 4 只限制卡片給的部分，塔／天賦／神祇加的另外疊加。',
  shield_bash: '神祇改為「盾牆」：一次把所有盾牌以你為中心均勻擲出一圈、不瞄準；每級傷害 +10%，移除神聖軌跡。',
  endure: '神祇「堡壘」爆開時也會免費施放一次降低士氣的吶喊與挑釁。',
  firebolt: '神祇改為「餘燼」：每次施放燃燒傷害 +1%，持續 4 秒，最多疊到 20%（取代火球）。0.8.4：射程縮短（380 px；向更遠處找目標時 520）。',
  coldbolt: '不再出現緩速與冰凍機率的強化，固定緩速 1.7 秒，只有冰凍天賦才會冰凍。神祇改為「深度冰凍」：每次命中 20%（每級 +10%）機率以深度冰凍命中、傷害加倍（取代冰霜累積）。0.8.4：射程縮短。',
  lightning: '0.8.4：射程縮短（380 px；向更遠處找目標時 520）。',
  double_strafe: '神祇「銳利射擊」的直線箭固定為一支箭 60% 傷害，對頭目沒有額外爆擊。',
  fire_arrow: '0.8.4：燃燒由命中的 150% 提高到 200%。神祇「傳染」改為被火焰箭擊殺的敵人在 1 公尺內爆炸，造成其最大生命 15%（每級 +5%），並點燃所有被波及的敵人；被爆炸炸死的不會再爆。',
  decrease_agi: '神祇「沉默」：被減速的敵人受到的傷害也 +15%。',
  sand_attack: '傷害 14 → 18、距離 150 → 180。神祇「沙暴」也會減速 50%，持續 3 秒。',
  shadowstep: '神祇「影之舞」的暗影波不再造成傷害，仍會暈眩。',
  caltrops: '神祇範圍 +50%，踩到的敵人會流血（攻擊的 22%）。',
  sight: '火焰改為貼著你旋轉；範圍不再把火焰推遠，改讓波動延伸更遠，波動以固定速度飛出收回並在最遠處停一下。',
  envenom: '毒傷害 +10%。',
  poison_bomb: '毒的總傷害 +10%，改在 4.5 秒內打完（原 6 秒）；神祇毒雲的毒 +10%。',
  enchant_poison: '刺客的塗毒、病毒散撥、毒刃的毒 +10%。',
  venom_dust: '毒 +10%。',
  venom_knife: '毒 +10%。',
  fan_of_knives: '飛刀上限 3 現在只限制卡片給的部分，塔／天賦／神祇／大聲吶喊加的另外疊加。',
  arrow_shower: '每一波為前一波的 90%（原 80%）；上限 5 只限制卡片給的部分，靠技能等級仍最多 5 輪。',
  arrow_rain: '傷害 +15%。',
  cart_revolution: '冷卻 11 → 9 秒，範圍 +50%。',
  zeny_rain: '傷害 +10%，範圍 +15%。',
  cart_rush: '傷害加倍、更寬、衝得更遠，冷卻 9 → 7 秒；衝鋒時不受傷害，停下時暈眩 3 公尺內的敵人 1 秒。天賦「碾壓」改為停下時每級 20% 機率施放手推車攻擊。',
  vending: '傷害 +25%，持續 3.5 秒（原 2 秒），冷卻 16 → 13 秒；最後的爆發擴及看得到的圓圈（大 15%、隨範圍變大）。0.8.4 天賦「大商人」重做：膠囊傷害 +50% 並標記 10 秒，被標記的敵人死亡時多掉金幣。',
  enlarge_weight: '觸發時恢復最大 HP 的 20%，移動速度只降低 25%（原 80%）。',
};
/* 小頭目／MVP 受到的傷害倍率（遊戲 soul_linker 的技能抗性表，20261125_7c004f793） */
RSW.bossResist = {
  skills: {bash:.35,double_strafe:.35,holy_smite:.35,ruwach:.35,envenom:.35,throw_stone:.35,mammonite:.35,heel_drop:.35,triple_action:.35,tracking:.35,firebolt:.4,coldbolt:.4,lightning:.4,soul_strike:.4,holy_light:.65,sight:.4,magnum:.4,sword_dance:.4,provoke:.4,demoralizing_shout:.4,thunderstorm:.4,arrow_rain:.4,decrease_agi:.4,fan_of_knives:.4,zeny_rain:.4,tornado_kick:.4,roundhouse:.4,flaming_petals:.4,lightning_strike:.4,spread_attack:.4,desperado:.4,ground_drift:.4,grand_cross:.4,meteor_storm:.4,fire_pillar:.4,frost_nova:.4,storm_gust:.4,lord_of_vermilion:.4,heavens_drive:.4,dissonance:.4,benedictio:.4,magnus_exorcismus:.4,raid:.4,axe_tornado:.4,rush_quake:.4,greed:.4,ore_discovery:.4,full_moon_kick:.4,cart_revolution:.8},
  other: [[.65, '劍士系的普通攻擊'], [.2, '遊蕩暗影期間的普通攻擊'], [.65, '所有中毒傷害（任何技能）']],
};
/* 依 20261123_9e9cf8978 遊戲內繁中公告 Beta 0.7.7～0.8.1 整理。 */
RSW.balanceNotes = {
  bash: '狂擊傷害降低 39%；粉碎狂擊移除 +30% 傷害，濺射 60% → 35%。神祇改為傷害、流血及短暫減傷。',
  sword_dance: '劍舞傷害降低 35%，局內脈衝卡片最多 4 張。',
  auto_berserk: '狂暴傷害加成 +40% → +20%；流血治療最多每秒最大生命 10%，嗜血每級流血比例 30% → 15%。',
  magnum: '有地獄怒爆時，直接命中傷害由 15% 提高至 35%；燃燒不變。',
  firebolt: '三系箭術傷害降低 44%；每 4 次強化才多一支箭，不再有傷害卡。每張目標卡由 +2 改 +1；持續冰霜另使箭術傷害降低 40%。火球神祇濺射 30% + 每級 2% → 15% + 每級 1%。',
  coldbolt: '三系箭術傷害降低 44%；每 4 次強化才多一支箭，不再有傷害卡。每張目標卡由 +2 改 +1；持續冰霜另使箭術傷害降低 40%。',
  lightning: '三系箭術傷害降低 44%；每 4 次強化才多一支箭，不再有傷害卡。每張目標卡由 +2 改 +1；持續冰霜另使箭術傷害降低 40%。連鎖神祇 50% + 每級 3% → 25% + 每級 2%。',
  soul_strike: '目標卡由 +2 改 +1；移除對不死族 ×2，改為念屬性相剋。',
  thunderstorm: '雷爆術傷害提高 64%。神祇風暴改依脈衝數計算，每次為單脈衝 15% + 每級 1%，原為單脈衝 1.5 倍。',
  napalm: '心靈爆破傷害提高 25%、範圍提高 35%；新增回響暈眩 0.8 秒（頭目除外）。',
  fire_wall: '傷害提高 25%，火焰大 50%，牆內敵人慢 25%；火焰卡最多 4 張，神祇改為旋轉火牆。',
  sight: '傷害提高 50%；旋轉 10 秒、冷卻 20 秒，自施放時計算。新增火焰卡、移除持續時間卡，神祇改為定期火焰脈衝。',
  frost_diver: '神祇改為冰凍主要目標時，免費施放自己的冰箭術（沒有時為 1 級）。冰系最終天賦改為冰凍爆發。',
  ruwach: '光球改為環繞碰觸傷害與擊退：持續 10 秒、冷卻 20 秒，自施放時計算。最多 4 張光球卡，移除持續時間卡；神祇碰觸回復每隻 0.2% 最大生命、每秒上限 1%。',
  holy_smite: '傷害提高 15%；受祝福普攻的神聖波濺射由 60% 提高至 75%。',
  holy_light: '主要傷害大致不變，濺射 60% → 35%；神聖審判主柱傷害降低 14%，固定 2 道光柱。相關天賦傷害與標記加成下修，雙重之光改 1 級。',
  signum_crucis: '移除對不死族 ×3，改為聖屬性對不死／暗 ×1.5；Oratio 每次爆發最多 3 名，每次為前次的 30%。',
  decrease_agi: '詠唱時間由 5 秒縮短為 1.5 秒，DEX 仍可縮短。',
  aqua_benedicta: '站在重疊水窪時每秒只回復一次；對敵傷害不變。',
  envenom: '攻擊與中毒傷害提高 15%。每分配 1 點 INT，物理技能毒傷額外 +2%；裝備 INT 不計。',
  fan_of_knives: '每扇傷害降低 25%，所有來源合計最多 3 扇；每扇為前一扇的 80%，僅第一扇擊退。',
  throw_stone: '基礎傷害提高 35%；精準投石每級 +75% → +30%，碎片每級 30% → 20%；官方估含天賦整體傷害降低 14%。',
  shadowstep: '跳躍改留下撒菱，取消跳躍的 1000%／1500%／2000% 普攻；落地後改 2 秒內普攻 600%（原 3 秒 2000%）。',
  caltrops: '改撒成一圈、基礎範圍 +20%；移除數量卡，神祇改流血。',
  arrow_shower: '齊射由最多 10 輪改為合計最多 5 輪，每輪為前輪的 80%；神祇改為每輪 20% + 每次精煉 2% 的風之回響。',
  arrow_repel: '傷害降低 20%；同次射擊只有第一支箭全額傷害，其餘命中同敵的箭為 50%。',
  atk_bow: '改為隨攻擊威力的平方根成長；官方估普通攻擊傷害約剩三分之一。',
  arcane_shot: '最多 3 張目標卡；每多一個目標會對另一群敵人多射一次，各自有脈衝。',
  fire_arrow: '傳染爆炸直接按死亡怪物最大生命比例計算，不再重複套用自身傷害、爆擊與標記。',
  mammonite: '傷害降低 5%；鐵匠 Maximize Power 濺射 50% → 15%、範圍 3 → 1.5 公尺。幸運一擊僅由本技能觸發，最多 4 名。',
  cart_revolution: 'Cart Termination 改為只命中一隻敵人時傷害 +400%（原固定 +35%），範圍仍 +20%。',
  zeny_rain: '每次施放對同一敵人僅第一次脈衝暈眩；神祇不再增加脈衝。新天賦「腳下之雨」改落在自己身上，傷害 -20%、範圍 +15%。',
  vending: '傷害提高 25%、每擺放 1 秒再 +10%，冷卻 18 → 16 秒；膠囊改為內建，神祇改吸引敵人。',
};
RSW.page({
  id:'updates', nav:'改版與傷害調整', title:()=> '改版與傷害調整',
  render() {
    const R=RSW,u=R.updates;
    const reasons=[
      ['二轉成長曲線','改與一轉使用相同曲線，相同能力值下為一轉的 1.25 倍；原本曲線較陡、至少 1.5 倍。包含普攻，一轉曲線不變。不能把它解讀為所有二轉固定只少 25%。'],
      ['頭目單次施放上限（0.8.2 已取消）','同一次技能施放對頭目合計最多扣最大生命 5%。Beta 0.8.2 取消，改成小頭目／MVP 抵抗部分技能，見上方頭目抗性表。'],
      ['屬性相剋','弱點 ×1.5，同屬性 ×0.75，無屬性不變。水剋火、火剋地、地剋風、風剋水；聖剋暗與不死；念剋念（念對念為弱點特例）。'],
      ['取消舊不死加倍','神聖技能與聖靈召喚移除對不死族 ×2；天使之光移除 ×3。改依怪物屬性計算，聖打不死／暗 ×1.5，聖靈召喚打念 ×1.5。Aspersio 不變。'],
      ['修正傷害重複加成','Oratio、幸運一擊、伏擊、神聖波、雙重之光、投石碎片／反彈及部分二轉最終天賦，改為分配原攻擊傷害，避免再次計入傷害、爆擊與標記。'],
      ['普通卡片下修','卡片新增階級，效果依掉落關卡階級計算；幾乎所有普通卡片變弱、部分改效果，舊卡片自動更新。0.8.1 已恢復小頭目／MVP 卡片的舊效果。'],
      ['局內強化上限','技能從局內卡片最多 +4 目標；有脈衝或齊射的技能最多 +4 脈衝。通常天賦、神祇、裝備與塔另算，箭雨總輪數與飛刀扇總扇數則有各自總上限。'],
    ];
    const names={jobs:'職業',skills:'技能說明',talents:'天賦',items:'裝備',cards:'卡片',monsters:'怪物',stages:'關卡',pets:'寵物'};
    const u2=R.updates0825, BR=R.bossResist;
    const resistGroups=(()=>{const m=new Map();for(const [id,v] of Object.entries(BR.skills))m.set(v,[...(m.get(v)||[]),R.skillLink(id)]);for(const [v,t] of BR.other)m.set(v,[...(m.get(v)||[]),R.esc(t)]);return [...m].sort((a,b)=>a[0]-b[0]);})();
    const cardRows=c=>{const f=c.fields.find(f=>f.key==='bonuses');return `<tr><td>${R.cardLink(c.id)}</td><td>${f.before.map(R.esc).join('<br>')}</td><td>${f.after.map(R.esc).join('<br>')}</td></tr>`;};
    const newer=u2?`<h2 class="pt">Beta 0.8.2～0.8.4（11 月 24～25 日）</h2>
<p class="lead">神祇改制、頭目改成技能抗性、一般卡片恢復，並加強盜賊、弓箭手、商人。</p>
<h3>重點</h3><div class="tw"><table class="t"><tr><th>項目</th><th>內容</th></tr>
<tr><td><a href="#deities">技能神祇</a></td><td>不再從寶箱出現。Lv 20 時從帶著的技能中選一個，之後每 10 級升一級（Lv 30、40、50…），沒有上限；有自己的欄位。無盡之塔不變。事蹟記錄者「轉移神祇」移除並退點數。</td></tr>
<tr><td><a href="#deities">神器</a></td><td>原本的屬性神祇改名為神器，仍從寶箱出、放自己的欄位。貪婪／智慧神器多給 4～12% 尋寶率；記憶、思想、力量、堡壘、生命神器重做（數值依品質）。</td></tr>
<tr><td>頭目</td><td>取消「每次施放最多扣 5% 生命」，改成小頭目與 MVP 抵抗部分技能（含其天賦與神祇），見下表。</td></tr>
<tr><td><a href="#cards">卡片</a></td><td>一般怪物卡片恢復 Beta 0.8 之前的效果（例：Wolf +3% 傷害與 +2% 爆擊、Kobold +5% 爆擊、Goblin +8% 傷害），已有的卡片自動更新。共 ${u2.counts.cards.changed} 張。</td></tr>
<tr><td>弓的普通攻擊</td><td>每支箭傷害 13 → 30（弓箭手、獵人、詩人／舞孃、持弓的盜賊／流氓）；持弓的盜賊投射物基本 20% 貫穿。</td></tr>
<tr><td>技能範圍</td><td>技能本身的範圍（天賦、卡片、神祇）和全域範圍合併在同一條曲線，像冷卻縮減一樣，半徑最多 ×3（0.8.4）。</td></tr>
<tr><td>卡普拉預設組合</td><td>每個角色 3 格，一鍵儲存／載入素質、天賦、含卡片的裝備、外觀、染色和寵物；載入時會列出已無法裝備的東西。需要帳號和連線（0.8.4）。</td></tr>
<tr><td><a href="#stages">關卡</a></td><td>貼牆、地圖邊緣或角落時，怪物改沿牆出現、頻率不變；也可能從你身後、更近（最近 4 公尺）出現。斐揚洞窟短劍變少：Sohee 只掉 Stiletto [4]、Poporing 不再掉 Main Gauche。</td></tr>
</table></div>
<h3>頭目抗性（小頭目、MVP）</h3>
<p class="small">表內數字是小頭目／MVP 實際受到的傷害比例（0.8.4 再提高抗性：原 50% 的組改 35%、60% 的組改 40%、神聖之光 65%）。沒列出的技能和其他普通攻擊造成完整傷害。</p>
<div class="tw"><table class="t"><tr><th>受到傷害</th><th>技能／攻擊</th></tr>${resistGroups.map(([v,list])=>`<tr><td class="num"><b>${Math.round(v*100)}%</b><div class="muted small">−${Math.round((1-v)*100)}%</div></td><td class="small">${list.join('、')}</td></tr>`).join('')}</table></div>
<h3>各技能調整</h3>
<div class="tw"><table class="t"><tr><th>技能</th><th>0.8.2～0.8.4 調整</th></tr>${Object.entries(R.balanceNotes2).map(([id,text])=>`<tr><td>${R.skillLink(id)}</td><td>${R.esc(text)}</td></tr>`).join('')}</table></div>
<details><summary>查看卡片效果恢復前後（${u2.counts.cards.changed} 張）</summary><div class="tw"><table class="t"><tr><th>卡片</th><th>0.8～0.8.1</th><th>0.8.2 起</th></tr>${u2.changes.cards.filter(c=>c.fields?.some(f=>f.key==='bonuses')).map(cardRows).join('')}</table></div></details>
<p class="muted small">來源：遊戲內「最新消息」Beta 0.8.2、0.8.3、0.8.4 與 ${R.esc(u2.to)} 客戶端資料（比對 ${R.esc(u2.from)}）。頭目抗性取自遊戲程式內的抗性表。</p>
<hr>`:'';
    return `${newer}<h2 class="pt">Beta 0.8／0.8.1：歷史改版紀錄</h2>
<div class="note small">以下保留 11 月 23 日當時的改動，包含後來被取代的規則。頭目 5% 上限、普通卡片與神祇等目前規則，請以上方 Beta 0.8.2～0.8.4 整理及各資料頁為準。</div>
<p class="lead">2026 年 11 月 23 日職業平衡大改。技能係數、二轉成長、屬性、卡片與命中次數會一起影響實際輸出。</p>
<p class="small">比對 ${R.esc(u.from)} → ${R.esc(u.to)}。以下百分比依遊戲內官方繁中公告整理；資料表依本機爬取程式抽出，並非角色實戰 DPS 測量。</p>
<h3>為什麼傷害大減</h3><div class="tw"><table class="t"><tr><th>原因</th><th>新規則</th></tr>${reasons.map(([name,text])=>`<tr><td>${name}</td><td>${R.esc(text)}</td></tr>`).join('')}</table></div>
<div class="note">0.8.1 補調：一般關卡怪物、頭目與 MVP 生命 -5%（無盡之塔不變）；燈籠節中段普通怪物再調低 25%、結尾 30%，頭目及傷害不變。這些生命調整不會直接提高你的單擊數字。</div>
<h3>各技能調整</h3><p class="small">表中是各項改動，實戰還會疊加上方共同規則；技能名稱可點進最新說明與神祇效果。</p>
<div class="tw"><table class="t"><tr><th>技能</th><th>0.8 調整</th></tr>${Object.entries(R.balanceNotes).map(([id,text])=>`<tr><td>${R.skillLink(id)}</td><td>${R.esc(text)}</td></tr>`).join('')}</table></div>
<h3>其他更新</h3><ul>
<li><b>無盡之塔</b>：新增逐層模式，可從停下樓層繼續，保留神祇與卡片，不計分／排行榜；仍給塔點數並記最佳樓層。1～30 層生命大幅提高；31 層起生命倍率 3 → 6 倍、每層再 +4%，MVP 生命 -20%、小頭目傷害 +35%。守護者傷害每級 +15% → +5%、爆傷 +25% → +7.5%，脈衝／目標上限 5 → 3 級、費用 +50%。</li>
<li><b>天賦重製</b>：魔法師冰系最終天賦改冰凍爆發；服事最終天賦改哨兵光球；盜賊毒性感染改死亡轉移。二轉先按「專精」選分支，並可在天賦面板重置（0.7.7 起）。</li>
<li><b>卡片與裝備</b>：普通卡片效果及階級已更新至卡片頁；新增一鍵移除裝備所有卡片。尋寶率改由新尋寶藥水、裝備詞條及指定裝備 ★ 提供，貪婪／智慧之神只分別給 Zeny／經驗，數量加倍。</li>
<li><b>關卡</b>：普隆德拉原野、斐揚森林、柏伊亞嵐島改為開闊方形地圖；全關卡怪物從開局混合出現，能力依當下時間計算。</li>
<li><b>遊戲操作</b>：寶箱依拾取範圍飛向角色；自動技能／自動寶箱分開；C 鍵可開能力值視窗，手動選卡或寶箱有 0.5 秒保護。可關閉「轉移神祇」，FPS 可選 120。</li>
<li><b>角色與活動</b>：新增改名、移動欄位及依職業排序；燈籠節點香保證蛇王出現，三種扭蛋機率不同。<a href="#events/lantern-festival">活動新機率 →</a></li>
</ul>
<h3>資料比對結果</h3><div class="tw"><table class="t"><tr><th>資料</th><th>新增</th><th>移除</th><th>變更</th></tr>${Object.entries(u.counts).map(([k,c])=>`<tr><td>${names[k]}</td><td>${c.added}</td><td>${c.removed}</td><td>${c.changed}</td></tr>`).join('')}</table></div>
<p class="small">另有 ${u.deities.length} 個技能的神祇文字變更。這裡計算資料表欄位變更；技能基礎說明未改，也可能有底層傷害公式調整，請一起看上方技能表。</p>
<details><summary>查看卡片效果前後差異</summary><div class="tw"><table class="t"><tr><th>卡片</th><th>原效果</th><th>新效果</th></tr>${u.changes.cards.filter(c=>c.fields?.some(f=>f.key==='bonuses')).map(c=>{const f=c.fields.find(f=>f.key==='bonuses');return `<tr><td>${R.cardLink(c.id)}</td><td>${f.before.map(R.esc).join('<br>')}</td><td>${f.after.map(R.esc).join('<br>')}</td></tr>`;}).join('')}</table></div></details>
<p class="muted small">來源：<a href="https://ro-survivors.com/" target="_blank" rel="noopener">RO Survivors</a> 遊戲內「最新消息」Beta 0.7.7、0.7.8、0.8、0.8.1 與 ${R.esc(u.to)} 客戶端資料。</p>`;
  },
});
