/* 藥水、秘藥、祝福、料理：遊戲局裡開寶箱拿到的本局加成（神器、神祇另有一頁） */
RSW.page({
  id: 'runitems', nav: '藥水與秘藥', title: () => '藥水、秘藥與祝福',
  render() {
    const R = RSW, D = R.runItems || { slots: [], list: [] };
    const Q = (R.meta.labels.qualities || []);
    const wSum = Q.reduce((a, q) => a + (q.weight || 0), 0);
    const QC = ['', 'q1', 'q2', 'q3', 'q4'];
    const groups = D.slots.filter(s => s.id !== 'deity' && D.list.some(x => x.slot === s.id));
    const cost = n => D.chest ? Math.round(D.chest.base + D.chest.lin * n + D.chest.sq * n * n) : null;
    const cn = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20];
    /* Beta 0.8.2 起：技能神祇（slot skill）不從寶箱出，屬性神祇改名「神器」（slot deity）仍從寶箱出 */
    const chestSlots = D.slots.filter(s => s.id !== 'skill');
    const artName = (D.slots.find(s => s.id === 'deity') || {}).name || '神器';
    return `<h2 class="pt">藥水、秘藥與祝福</h2>
<p class="lead">遊戲局裡用金幣打開寶箱，可以拿到${groups.map(s => R.esc(s.name)).join('、')}和<a href="#deities">${R.esc(artName)}</a>。效果只在<b>這一局</b>有效，結束就消失。共有 ${D.list.length} 種（不含${R.esc(artName)}）。</p>

<h3>寶箱怎麼開</h3>
<ul>
  <li>每次打開寶箱，會從 ${chestSlots.length} 種欄位（${chestSlots.map(s => s.id === 'deity' ? `<a href="#deities">${R.esc(s.name)}</a>` : R.esc(s.name)).join('、')}）隨機挑 <b>3 種不同的欄位</b>，各出一個道具，選一個拿走。</li>
  <li><b>技能神祇不再從寶箱出現</b>（Beta 0.8.2 起）：達到 Lv 20 時自己選一個，詳見<a href="#deities">神祇頁</a>。</li>
  <li><b>每一種欄位這局只能裝一個道具。</b>選了某瓶藥水後，之後寶箱的藥水欄位只會再出現<b>同一瓶</b>，再選它就把數值<b>疊加</b>上去（精煉）。所以第一次選要想清楚。</li>
  <li>效果大小看<b>品質</b>，品質越高數值越大（下面表格可以切換品質看）。尋寶率越高，越容易開出高品質。</li>
  <li>用不到的道具不會出現：例如沒有近戰技能就不會出現「近戰攻擊範圍」，沒有需要詠唱的技能就不會出現詠唱類（詳見表格的備註）。</li>
  <li>開寶箱時可能有重抽整箱、重抽單張、放逐（這局不再出現）、鎖定（更容易出現）等次數可以用。</li>
</ul>
${D.chest ? `<div class="note small">寶箱價格隨開啟次數變貴：第 n 個寶箱 ＝ ${D.chest.base} ＋ ${D.chest.lin}×(n−1) ＋ ${D.chest.sq}×(n−1)² 金幣（寶箱折扣另外打折）。<br>
${cn.map(n => `第 ${n} 個 <b>${R.num(cost(n - 1))}</b>`).join('　')}</div>` : ''}

<h3>品質機率</h3>
<div class="tw"><table class="t"><tr>${Q.map((q, i) => `<th><span class="qn ${QC[i] || ''}">${R.esc(q.name)}</span></th>`).join('')}</tr>
<tr>${Q.map(q => `<td class="num">${wSum ? R.pct(q.weight / wSum) : '—'}</td>`).join('')}</tr></table></div>
<p class="muted small">沒有尋寶率加成時的機率。尋寶率會讓越高的品質越容易出現。</p>

<div class="filters">
  <label class="small">品質 <select id="ri-q">${Q.map((q, i) => `<option value="${i}"${i === Q.length - 1 ? ' selected' : ''}>${R.esc(q.name)}</option>`).join('')}</select></label>
  <input id="ri-kw" type="search" placeholder="名稱或效果…">
</div>
<div id="ri-list">${groups.map(s => `<section data-slot="${s.id}"><h3>${R.esc(s.name)} <span class="tag">${D.list.filter(x => x.slot === s.id).length}</span></h3>
  <div class="tw"></div></section>`).join('')}</div>
<p class="muted small">「生命藥水」的百分比在其他加成都算完之後才乘上去。同名的「範圍藥水」「範圍祝福」各有兩種：一種加全部技能範圍，一種只加近戰攻擊範圍。</p>`;
  },
  bind(root, arg) {
    const R = RSW, D = R.runItems || { slots: [], list: [] };
    const Q = R.meta.labels.qualities || [];
    const need = {};
    const why = { melee: '有近戰技能才會出現', dot: '這局出現過毒、燃燒或流血後才會出現', cast: '有需要詠唱的技能才會出現', str: '有物理技能才會出現', int: '有魔法技能才會出現' };
    for (const [k, ids] of Object.entries(D.useless || {})) for (const id of ids) need[id] = why[k] || '';
    const sel = root.querySelector('#ri-q'), kw = root.querySelector('#ri-kw');
    const draw = () => {
      const q = +sel.value, k = kw.value.trim().toLowerCase();
      for (const sec of root.querySelectorAll('#ri-list section')) {
        const list = D.list.filter(x => x.slot === sec.dataset.slot &&
          (!k || [x.name, ...x.vals].join(' ').toLowerCase().includes(k)));
        sec.hidden = !list.length;
        sec.querySelector('.tw').innerHTML = `<table class="t"><tr><th>道具</th><th>效果（${R.esc(Q[q] ? Q[q].name : '')}）</th><th>最低 → 最高</th></tr>
          ${list.map(x => `<tr id="ri-${x.id}"${arg === x.id ? ' class="hl"' : ''}><td class="nw">${R.img(x.img || x.icon, 'ico')} ${R.esc(x.name)}</td>
            <td><b>${R.esc(x.vals[q])}</b>${need[x.id] ? `<div class="muted small">${R.esc(need[x.id])}</div>` : ''}</td>
            <td class="small">${R.esc(x.vals[0])} → ${R.esc(x.vals[x.vals.length - 1])}</td></tr>`).join('')}</table>`;
      }
    };
    sel.onchange = draw; kw.oninput = draw;
    draw();
    /* 頁面切換完會捲回頂端，所以晚一點再捲到指定的道具 */
    if (arg) setTimeout(() => { const row = root.querySelector('#ri-' + CSS.escape(arg)); if (row) row.scrollIntoView({ block: 'center' }); }, 0);
  },
});
