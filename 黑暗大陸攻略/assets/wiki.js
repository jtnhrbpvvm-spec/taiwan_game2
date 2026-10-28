// 黑暗大陸攻略百科：共用程式（導覽列、搜尋、道具／怪物／技能彈出說明、表格）
// 每頁先載入 data/wiki-data.js（window.WIKI），再載入本檔，最後頁面自己的 <script> 呼叫這裡的函式。
const W = window.WIKI;

const PAGES = [
    ['index', '首頁', '🏠'], ['guide', '新手攻略', '🧭'], ['classes', '職業', '⚔️'], ['skills', '技能魔法', '✨'],
    ['items', '道具圖鑑', '🎒'], ['monsters', '怪物圖鑑', '👹'], ['zones', '地圖村莊', '🗺️'], ['quests', '職業任務', '📜'],
    ['enchant', '衝裝', '🔨'], ['affix', '詞綴通貨', '💠'], ['resonance', '共鳴裝備', '🌟'], ['forge', '鍛造附魔', '⚒️'],
    ['rift', '異界地圖', '🌀'], ['tower', '永夜之塔', '🏛️'], ['dragons', '四龍首領', '🐉'], ['dolls', '魔法娃娃', '🧸'],
    ['morph', '變身', '🎭'], ['merc', '傭兵', '🤝'], ['mechanics', '數值公式', '📐'], ['exp', '經驗離線', '📈'], ['online', '線上功能', '🌐'],
];

// 我們做的桌寵：遊戲在背景掛機、桌面上留一隻角色
const PET_URL = 'https://jtnhrbpvvm-spec.github.io/taiwan_game2/%E9%BB%91%E6%9A%97%E5%A4%A7%E9%99%B8%E6%A1%8C%E5%AF%B5/';

// ═══ 桌寵共用：開始 ═══（黑暗大陸桌寵 tools/gen-zones.js 會把這兩行之間整段抄進 zones.js，給收入總覽的說明視窗用；
//    這段只能用 W 與這段裡自己的東西，不要碰頁面上的元素）
// ───────── 基本工具 ─────────
const $ =(s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n == null ? '—' : Math.round(n).toLocaleString('en-US');
// 機率（0.0123 → 1.23%）：越小保留越多位
function pct(p) {
    if (p == null) return '—';
    const v = p * 100;
    if (v >= 10) return (Math.round(v * 10) / 10) + '%';
    if (v >= 1) return (Math.round(v * 100) / 100) + '%';
    if (v >= 0.01) return (Math.round(v * 1000) / 1000) + '%';
    return (Math.round(v * 100000) / 100000) + '%';
}
const range = r => Array.isArray(r) ? (r[0] === r[1] ? fmt(r[0]) : `${fmt(r[0])}～${fmt(r[1])}`) : fmt(r);
const sec = ms => ms >= 60000 ? `${Math.round(ms / 60000)} 分鐘` : `${Math.round(ms / 100) / 10} 秒`;
const img = p => !p ? '' : /^https?:/.test(p) ? p : W.meta.imgBase + p;

const ZONE = Object.fromEntries(W.zones.map(z => [z.id, z]));
const zoneName = id => (ZONE[id] && ZONE[id].name) || id;
const townName = id => (W.towns[id] && W.towns[id].name) || id;
const className = id => (W.classes[id] && W.classes[id].name) || id;
const ZONE_TYPE = { field: '野外', dungeon: '地監', tower: '高塔', dragon: '龍穴' };
const SKILL_TYPE = { spell: '攻擊魔法', heal: '治癒', buff: '增益', strike: '物理技能', passive: '被動' };
const CAT_EMO = { weapon: '⚔️', armor: '🛡️', potion: '🧪', scroll: '📜', ammo: '🏹', elixir: '⚗️', material: '💎', quest: '🔖', currency: '🔹', book: '📖', map: '🗺️', doll: '🧸', mercRune: '🔷' };
const GRADE_NAME = { normal: '一般', high: '高級', rare: '稀有', hero: '英雄', legend: '傳說' };
const TAG_NAME = { human: '人型', demon: '惡魔', holy: '神聖', undead: '不死', large: '大型', boss: '首領', dragon: '龍族' };
const ACC_SLOTS = ['amulet', 'ring', 'belt'];

// 能力名稱（道具、技能、詞綴共用）
const STAT_LABEL = Object.assign({}, W.statNames, {
    hit: '命中', dmg: '傷害', sp: 'SP', mr: '魔防', crit: '物爆率', magicCrit: '魔爆率', critDmg: '物爆傷害', magicCritDmg: '魔爆傷害', dodge: '閃避', reduce: '減傷', lifesteal: '吸血', hp: 'HP', mp: 'MP',
    hpRegen: '回血', mpRegen: '回魔', weight: '負重上限', spdMul: '攻速', double: '連擊', absorb: '傷害吸收', counter: '反擊', ac: '防禦',
    allStat: '全能力', bossDmg: '首領增傷', expPct: '經驗', goldPct: '金幣', thorns: '反傷', haste: '加速', brave: '勇敢', wise: '慎重',
});
const PCT_KEYS = ['crit', 'magicCrit', 'critDmg', 'magicCritDmg', 'dodge', 'lifesteal', 'spdMul', 'double', 'counter', 'absorb', 'bossDmg', 'expPct', 'goldPct', 'thorns'];
function statVal(k, v) {
    if (v === true) return '';
    if (PCT_KEYS.includes(k) && Math.abs(v) < 1) return (v > 0 ? '+' : '') + Math.round(v * 1000) / 10 + '%';
    return (v > 0 ? '+' : '') + v;
}
function fxList(fx) {
    return Object.entries(fx || {}).filter(([k]) => STAT_LABEL[k]).map(([k, v]) => `${STAT_LABEL[k]} ${statVal(k, v)}`.trim());
}
const fxText = fx => fxList(fx).join('、') || '—';

// ───────── 道具顯示 ─────────
function itemCls(id) {
    const d = W.items[id];
    if (!d) return '';
    if (d.cat === 'doll' && W.dolls[d.doll]) return 'doll-' + W.dolls[d.doll].quality;
    return d.grade ? 'g-' + d.grade : '';
}
function itemIcon(id, lg) {
    const d = W.items[id] || {};
    const c = 'ic' + (lg ? ' lg' : '');
    if (d.img) return `<img class="${c}" src="${esc(img(d.img))}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;${c} emo&quot;>${CAT_EMO[d.cat] || '❔'}</span>'">`;
    return `<span class="${c} emo">${CAT_EMO[d.cat] || '❔'}</span>`;
}
function itemLink(id, n) {
    const d = W.items[id];
    if (!d) return esc(id);
    return `<a class="il ${itemCls(id)}" data-item="${esc(id)}">${itemIcon(id)}${esc(d.name)}${d.res ? '🌟' : ''}</a>${n ? ` ×${range(n)}` : ''}`;
}
function monIcon(id, lg) {
    const m = W.monsters[id];
    return `<span class="ic emo${lg ? ' lg' : ''}">${(m && m.icon) || '👾'}</span>`;
}
function monLink(id) {
    const m = W.monsters[id];
    if (!m) return esc(id);
    return `<a class="il${m.boss ? ' g-legend' : ''}" data-mon="${esc(id)}">${m.icon} ${esc(m.name)}</a>`;
}
const zoneLink = id => `<a href="zones.html#${esc(id)}">${ZONE[id] ? ZONE[id].icon + ' ' : ''}${esc(zoneName(id))}</a>`;
const classLink = id => `<a href="classes.html#${esc(id)}">${W.classes[id] ? W.classes[id].icon + ' ' : ''}${esc(className(id))}</a>`;
function skillIcon(s) {
    return s.img ? `<img class="ic" src="${esc(img(s.img))}" alt="" loading="lazy">` : `<span class="ic emo">✨</span>`;
}
function skillLink(id) {
    const s = W.skills[id];
    if (!s) return esc(id);
    return `<a class="il" data-skill="${esc(id)}">${skillIcon(s)}${esc(s.name)}</a>`;
}

function itemTypeText(d) {
    if (d.cat === 'weapon') return `${(W.weaponTypes[d.type] || {}).name || d.type}${(W.weaponTypes[d.type] || {}).two ? '（雙手）' : ''}`;
    if (d.cat === 'armor') return W.slots[d.slot] || (d.slot === 'ring' ? '戒指' : d.slot);
    if (d.cat === 'map') return `異界地圖 T${d.tier}`;
    if (d.cat === 'doll') return `魔法娃娃 ${W.dolls[d.doll] ? W.dolls[d.doll].quality : ''}`;
    return W.catNames[d.cat] || d.cat;
}
// 道具的基礎屬性（一列小標籤）
function itemStatsHtml(d) {
    const s = [];
    if (d.cat === 'weapon') {
        s.push(`傷害 <b>${d.dmg[0]}／${d.dmg[1]}</b>（小／大）`);
        const wt = W.weaponTypes[d.type];
        if (wt) s.push(`攻擊間隔 <b>${wt.spd}ms</b>`);
        if (wt && wt.range) s.push(`射程 <b>${wt.range} 格</b>`);
    }
    if (d.ac) s.push(`防禦 <b>+${d.ac}</b>`);
    for (const k of ['hit', 'dmg', 'sp', 'mr', 'crit', 'magicCrit', 'critDmg', 'magicCritDmg', 'dodge', 'reduce', 'lifesteal', 'hp', 'mp', 'hpRegen', 'mpRegen', 'str', 'dex', 'con', 'int', 'wis', 'cha', 'weight']) {
        if (k === 'dmg' && d.cat === 'weapon') continue;
        if (d[k] != null && typeof d[k] === 'number') s.push(`${STAT_LABEL[k]} <b>${statVal(k, d[k])}</b>`);
    }
    if (d.cat === 'ammo') s.push(`傷害 <b>+${d.dmg}</b>`);
    if (d.haste) s.push('<b>加速效果</b>');
    if (d.silver) s.push('<b>銀製</b>（打不死系 +1～10）');
    if (d.dragon) s.push(`<b>對龍 ×${d.dragon}</b>`);
    if (d.drain) s.push(`<b>吸取 MP ${range(d.drain)}</b>`);
    if (d.heal) s.push(`回復 HP <b>${range(d.heal)}</b>`);
    if (d.buff && W.buffDefs[d.buff]) s.push(`${W.buffDefs[d.buff].name} <b>${d.sec ? sec(d.sec * 1000) : ''}</b>${fxList(W.buffDefs[d.buff].fx).length ? '（' + fxText(W.buffDefs[d.buff].fx) + '）' : ''}`);
    if (d.safe != null && (d.cat === 'weapon' || d.cat === 'armor')) s.push(d.safe < 0 ? '不能強化' : `安定值 <b>+${d.safe}</b>`);
    if (d.wt != null) s.push(`重量 <b>${d.wt}</b>`);
    return `<div class="stats">${s.map(x => `<span>${x}</span>`).join('')}</div>`;
}
function resText(r) {
    if (!r) return '';
    const trig = W.resTriggers[r.trigger] + (r.p ? ` ${pct(r.p)}` : '') + (r.n ? `（累積 ${r.n} 點）` : '') + (r.cd ? `（冷卻 ${r.cd} 秒）` : '') + (r.pct ? `（HP 低於 ${pct(r.pct)}）` : '');
    return `<b class="res-${r.tier}">${esc(W.resTiers[r.tier].name)}・${esc(r.name)}</b>　<span class="tag">${trig}</span><br>${esc(r.desc)}` +
        (r.cls && r.cls.length ? `<br><small>職業共鳴（效果 ×${W.consts.RES_CLASS_BONUS}）：${r.cls.map(className).join('、')}</small>` : '');
}
function sourceText(s, id) {
    const d = W.items[id] || {};
    switch (s.type) {
        case 'shop': return `🏪 ${esc(townName(s.town))}起的商店（${d.cat === 'ammo' ? fmt(s.price * 100) + ' 金幣／100 個' : fmt(s.price) + ' 金幣'}）`;
        case 'mon': return `👹 ${monLink(s.mon)} 掉落 <b>${pct(s.p)}</b>${s.n ? `（×${range(s.n)}）` : ''}`;
        case 'zone': return `🗺️ ${zoneLink(s.zone)} 的怪物掉落 <b>${pct(s.p)}</b>${s.n ? `（×${range(s.n)}）` : ''}`;
        case 'tower': return `🏛️ 永夜之塔${s.floor ? ` ${s.floor}F` : '各層'}守關首領 <b>${pct(s.p)}</b>`;
        case 'common': return `🎲 所有怪物共通掉落 <b>${pct(s.p)}</b>${s.minLv ? `（Lv.${s.minLv} 以上怪物）` : ''}${s.maxLv ? `（Lv.${s.maxLv} 以下怪物）` : ''}`;
        case 'recipe': { const r = W.recipes[s.idx]; return `⚒️ 鍛造：${Object.entries(r.need).map(([k, n]) => itemLink(k, n)).join('＋')}＋${fmt(r.gold)} 金幣`; }
        case 'quest': return `📜 ${classLink(s.cls)}職業任務第 ${s.ch + 1} 章獎勵`;
        case 'book': { const b = W.bookDrops.find(x => x.id === id), lv = b ? Math.max(1, b.lv - 5) : 1;
            return `📖 <a href="monsters.html#books">Lv.${lv} 以上的怪物</a>掉落（一般怪 ${pct(W.consts.BOOK_DROP_P)}、首領 ${pct(W.consts.BOOK_BOSS_P)} 掉一本書，從可掉的書裡平均抽；Lv.${lv} 怪物可掉 ${bookPool(lv).length} 本，一般怪指定這本約 ${pct(W.consts.BOOK_DROP_P / bookPool(lv).length)}，等級越高可掉的書越多）`; }
        case 'currency': { const c = W.currency[id]; return `🎲 怪物掉落通貨（每隻 ${pct(W.consts.CURRENCY_DROP_P)}、首領 ${pct(W.consts.CURRENCY_BOSS_P)}），掉落權重 ${c ? c.w : '?'}${c && c.minLv ? `，只有 Lv.${c.minLv} 以上怪物會掉` : ''}`; }
        case 'mapdrop': return `🌀 怪物掉落（一般地圖每隻 ${pct(W.consts.MAP_DROP_P)}、異界內 ${pct(W.consts.MAP_DROP_IN_MAP_P)}），異界通關獎勵` +
            (d.tier >= 8 ? `；T8 以上掉圖有 ${pct(W.consts.TREASURE_MAP_DROP_P)} 是<a href="rift.html#treasure">未鑑定傳奇財寶地圖</a>` : '');
        case 'mapboss': return `🌀 異界首領 ${pct(W.consts.RES_MAP_BOSS_P)} 掉一件共鳴裝備（${W.resTiers[d.res.tier].name}需 T${[0, 1, 6, 11, 15][d.res.tier]} 以上地圖）`;
        case 'soul': return `🔮 鍛造師「BOSS 附魔」把武器上的附魔封存（消耗永夜之魂 ×5、${fmt(W.consts.BOSS_ENCHANT_SOUL_COST)} 金幣）`;
        case 'mercRune': { const dr = W.merc.drops, basic = dr && dr.basic.includes(id);
            return `🤝 傭兵專用符石，<a href="merc.html#runes">鑲在傭兵四格技能槽</a>，不能購買。` + (!dr ? '' : basic
                ? `<b>基本符石</b>：<a href="rift.html">黃色稀有異界地圖</a>的一般怪 <b>${pct(dr.normalP)}</b>`
                : `<b>特殊符石</b>：<a href="rift.html">黃色稀有異界地圖</a>首領 <b>${pct(dr.bossP)}</b>、<a href="dragons.html">團隊副本</a>勝利每人 <b>${pct(dr.bossP)}</b>`); }
        case 'doll': return W.dolls[d.doll] && W.dolls[d.doll].quality === 'T4' ? `🧸 娃娃商人露米（${W.consts.DOLL_SHOP_PRICE} 鑽，目前限 GM 購買）` : '🧸 目前只有 GM 發放';
        case 'questitem': return '📜 接了職業任務後，指定地圖的怪物掉落';
        case 'dismantle': return `🧸 娃娃商人分解傳說品質裝備（每件 ${W.consts.DOLL_DISMANTLE_CRYSTALS} 個）`;
        case 'random': return `🎲 隨機裝備掉落（Lv.${s.minLv} 以上怪物；一般怪 ${pct(W.consts.RANDOM_EQUIP_P)}、首領 50%，可能帶品質詞綴）`;
    }
    return esc(s.type);
}
function itemDetailHtml(id) {
    const d = W.items[id];
    if (!d) return '找不到這個道具';
    const be = W.bossEnchants[id];
    const book = d.cat === 'book' && W.skills[d.skill];
    const doll = d.cat === 'doll' && W.dollAbilities[d.doll];
    const src = (W.sources[id] || []);
    return `<div class="mhead">${itemIcon(id, true)}<div><h3 class="${itemCls(id)}">${esc(d.name)}</h3>
        <span class="tag">${esc(itemTypeText(d))}</span>${d.grade ? `<span class="tag ${itemCls(id)}">${GRADE_NAME[d.grade]}</span>` : ''}${d.res ? `<span class="tag res-${d.res.tier}">🌟 ${W.resTiers[d.res.tier].name}</span>` : ''}</div></div>
        ${itemStatsHtml(d)}
        ${d.desc && !doll ? `<p>${esc(d.desc)}</p>` : ''}
        ${d.classes ? `<div class="msec"><h4>限定職業</h4>${d.classes.map(classLink).join('、')}</div>` : ''}
        ${d.res ? `<div class="msec box"><h4>🌟 共鳴技能</h4>${resText(d.res)}</div>` : ''}
        ${book ? `<div class="msec"><h4>學會技能</h4>${skillLink(d.skill)}　<small>${esc(book.desc)}</small><br><small>${Object.keys(W.classes).map(c => { const r = W.classSkills[c].find(x => x.id === d.skill); return r ? `${className(c)} Lv.${r.lv}` : ''; }).filter(Boolean).join('、')}</small></div>` : ''}
        ${doll ? `<div class="msec box"><h4>娃娃能力</h4>基本：${esc(doll.base)}<br>被動「${esc(doll.name)}」：${esc(doll.desc)}<br><small>召喚要 ${W.consts.DOLL_SUMMON_COST} 個魔法結晶，每 ${sec(W.consts.DOLL_SUMMON_MS)}自動再扣 ${W.consts.DOLL_SUMMON_COST} 個。</small></div>` : ''}
        ${d.cat === 'mercRune' && W.merc.runes[d.rune] ? `<div class="msec box"><h4>🤝 傭兵技能：${esc(W.merc.runes[d.rune].name)}</h4>${esc(W.merc.runes[d.rune].text)}</div>` : ''}
        ${be ? `<div class="msec box"><h4>🔮 BOSS 附魔：${esc(be.name)}</h4>${esc(W.bossEnchantText[id] || '')}<br><small>觸發 ${pct(be.p)}、冷卻 ${be.cd} 秒、${be.kind === 'magic' ? '魔法' : '物理'}傷害；附魔費用 ${fmt(be.cost)} 金幣</small></div>` : ''}
        <div class="msec"><h4>價格</h4>${d.price ? `商店 ${fmt(d.price)} 金幣${d.cat === 'ammo' ? '（每 100 個 ' + fmt(d.price * 100) + '）' : ''}　` : ''}回收 ${fmt(d.sellPrice)} 金幣</div>
        <div class="msec"><h4>取得方式</h4>${src.length ? `<ul class="src">${src.map(s => `<li>${sourceText(s, id)}</li>`).join('')}</ul>` : '<span class="dim">尚無一般取得管道</span>'}</div>
        <div class="msec"><a href="items.html#${esc(id)}">在道具圖鑑查看 →</a></div>`;
}

// ───────── 怪物顯示 ─────────
// 怪物掉書（遊戲 spellbook.js rollBookDrop）：一般怪／首領機率不同；掉了就從「最低學習等級 ≤ 怪物等級 +5」的掉落書平均抽一本
const bookDropP = m => m.boss ? W.consts.BOOK_BOSS_P : W.consts.BOOK_DROP_P;
const bookPool = lv => W.bookDrops.filter(b => b.lv <= lv + 5);
// 書單分組：魔法依級數、職業技能依職業；連結只顯示技能名稱
function bookGroupsHtml(pool) {
    const g = {};
    for (const b of pool) {
        const d = W.items[b.id], s = W.skills[d.skill];
        const k = s.kind === 'magic' ? 'a' + String(s.tier).padStart(2, '0') : 'b' + String(Object.keys(W.classes).indexOf(d.classes[0])).padStart(2, '0');
        (g[k] = g[k] || { name: s.kind === 'magic' ? `${W.magicTierNames[s.tier]}級魔法書` : `${className(d.classes[0])}技能書`, ids: [] }).ids.push(b.id);
    }
    return Object.keys(g).sort().map(k => `<div class="bookg"><b>${esc(g[k].name)}</b> <small class="dim">${g[k].ids.length} 本</small>：${g[k].ids.map(id => `<a class="il" data-item="${esc(id)}">${itemIcon(id)}${esc(W.skills[W.items[id].skill].name)}</a>`).join('')}</div>`).join('');
}
function monBookHtml(m) {
    const pool = bookPool(m.lv), p = bookDropP(m);
    if (!pool.length) return '<span class="dim">等級太低，不會掉書</span>';
    return `每隻 <b>${pct(p)}</b>（${m.boss ? '首領' : '一般怪'}）掉一本，從 <b>${pool.length}</b> 本裡平均抽，指定一本約 <b>${pct(p / pool.length)}</b>。
        <details><summary>Lv.${m.lv} 可以拿到的書（學習等級 Lv.${m.lv + 5} 以內）</summary>${bookGroupsHtml(pool)}</details>`;
}
function monTags(m) {
    return ['boss', 'dragon', 'large', 'undead', 'human', 'demon', 'holy'].filter(k => m[k]).map(k => `<span class="tag${k === 'boss' || k === 'dragon' ? ' red' : ''}">${TAG_NAME[k]}</span>`).join('');
}
function monDetailHtml(id) {
    const m = W.monsters[id];
    if (!m) return '找不到這隻怪物';
    const where = m.zones.map(zoneLink).concat(m.rareIn.map(r => `${zoneLink(r.zone)}（${r.lair ? '巢穴首領' : '稀有出現 ' + pct(r.p)}）`));
    return `<div class="mhead">${monIcon(id, true)}<div><h3>${esc(m.name)}</h3><span class="tag gold">Lv.${m.lv}</span>${monTags(m)}</div></div>
        <div class="stats"><span>HP <b>${fmt(m.hp)}</b></span><span>防禦 <b>${10 - m.ac}</b></span><span>命中 <b>${m.hit}</b></span><span>攻擊 <b>${range(m.dmg)}</b></span>
        <span>攻擊間隔 <b>${m.spd}ms</b></span><span>魔防 <b>${m.mr}</b></span><span>經驗 <b>${fmt(m.exp)}</b></span><span>金幣 <b>${range(m.gold)}</b></span></div>
        ${m.magic ? `<p>魔法「${esc(m.magic.name)}」：${pct(m.magic.p)} 機率，傷害 ${range(m.magic.dmg)}（無視防禦、受魔防減免）</p>` : ''}
        ${m.boss ? `<p class="dim">首領／龍會每 7～11 秒蓄力放大招（紅圈，×${W.consts.TELE_MUL} 傷害），走出紅圈就能閃開。</p>` : ''}
        <div class="msec"><h4>出沒地點</h4>${where.length ? where.join('、') : '<span class="dim">特殊出現</span>'}</div>
        <div class="msec"><h4>專屬掉落</h4>${m.drops.length ? `<ul class="src">${m.drops.map(d => `<li>${itemLink(d.id, d.n)}　<b>${pct(d.p)}</b></li>`).join('')}</ul>` : '<span class="dim">只有共通掉落與地區掉落</span>'}</div>
        <div class="msec"><h4>📖 魔法書／技能書</h4>${monBookHtml(m)}</div>
        <div class="msec"><a href="monsters.html#${esc(id)}">在怪物圖鑑查看 →</a></div>`;
}

// ───────── 技能顯示 ─────────
function skillMetaHtml(s) {
    const t = [`<span class="tag ${s.type === 'passive' ? 'purple' : s.type === 'buff' ? 'green' : s.type === 'heal' ? 'cyan' : 'red'}">${SKILL_TYPE[s.type] || s.type}</span>`];
    if (s.kind === 'magic') t.push(`<span class="tag blue">${W.magicTierNames[s.tier]}級魔法</span>`);
    if (s.mp) t.push(`<span class="tag">MP ${s.mp}</span>`);
    if (s.cd) t.push(`<span class="tag">冷卻 ${s.cd} 秒</span>`);
    if (s.sec) t.push(`<span class="tag">持續 ${sec(s.sec * 1000)}</span>`);
    if (s.aoe) t.push('<span class="tag gold">範圍</span>');
    if (s.spread) t.push('<span class="tag gold">分散多發</span>');
    return t.join('');
}
function skillDetailHtml(id) {
    const s = W.skills[id];
    if (!s) return '找不到這個技能';
    const who = Object.keys(W.classes).map(c => { const r = W.classSkills[c].find(x => x.id === id); return r ? `${classLink(c)} Lv.${r.lv}` : ''; }).filter(Boolean);
    const book = 'book_' + id;
    const nums = [];
    if (s.mult) nums.push(`傷害倍率 ×${s.mult}${s.hits ? `，${s.hits} 連擊` : ''}`);
    if (s.dmg) nums.push(`魔法傷害 ${range(s.dmg)}＋SP×${s.spK || 1}`);
    if (s.heal) nums.push(`回復 ${range(s.heal)}＋SP×${s.spK || 1}`);
    if (s.stun) nums.push(`暈眩 ${s.stun} 秒`);
    if (s.ignoreAc) nums.push('無視防禦');
    if (s.undeadMul) nums.push(`對不死 ×${s.undeadMul}`);
    if (s.fx) nums.push(fxText(s.fx));
    return `<div class="mhead">${s.img ? `<img class="ic lg" src="${esc(img(s.img))}" alt="">` : '<span class="ic lg emo">✨</span>'}<div><h3>${esc(s.name)}</h3>${skillMetaHtml(s)}</div></div>
        <p>${esc(s.desc)}</p>${nums.length ? `<div class="stats">${nums.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        <div class="msec"><h4>可學職業</h4>${who.join('、') || '—'}</div>
        ${W.items[book] ? `<div class="msec"><h4>學習方式</h4>${itemLink(book)}<ul class="src">${(W.sources[book] || []).map(x => `<li>${sourceText(x, book)}</li>`).join('') || '<li>創角時自動學會</li>'}</ul></div>` : '<div class="msec"><h4>學習方式</h4>創角時自動學會</div>'}`;
}
// ═══ 桌寵共用：結束 ═══

// ───────── 彈出視窗 ─────────
function openModal(html) {
    let m = $('#modal');
    if (!m) {
        m = document.createElement('div');
        m.id = 'modal'; m.className = 'modal';
        m.innerHTML = '<div class="modal-in" role="dialog" aria-modal="true"><button class="modal-x" aria-label="關閉">✕</button><div class="modal-body"></div></div>';
        document.body.appendChild(m);
        m.addEventListener('click', e => { if (e.target === m || e.target.classList.contains('modal-x')) closeModal(); });
    }
    $('.modal-body', m).innerHTML = html;
    m.classList.add('on');
    $('.modal-in', m).scrollTop = 0;
}
function closeModal() { const m = $('#modal'); if (m) m.classList.remove('on'); }
const openItem = id => openModal(itemDetailHtml(id));
const openMon = id => openModal(monDetailHtml(id));
const openSkill = id => openModal(skillDetailHtml(id));
document.addEventListener('click', e => {
    const a = e.target.closest('[data-item],[data-mon],[data-skill]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.item) openItem(a.dataset.item);
    else if (a.dataset.mon) openMon(a.dataset.mon);
    else openSkill(a.dataset.skill);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ───────── 可排序表格 ─────────
// cols：[{ label, k?（排序用欄位）, v?(row)（排序值）, html(row), num? }]；rows：資料陣列
function renderTable(el, cols, rows, opt = {}) {
    const st = el._sort || (el._sort = { i: opt.sortCol == null ? -1 : opt.sortCol, dir: opt.sortDir || 1 });
    const sv = (c, r) => c.v ? c.v(r) : c.k ? r[c.k] : 0;
    let list = rows.slice();
    if (st.i >= 0) {
        const c = cols[st.i];
        list.sort((a, b) => { const x = sv(c, a), y = sv(c, b); return (typeof x === 'string' ? x.localeCompare(y, 'zh-Hant') : (x || 0) - (y || 0)) * st.dir; });
    }
    el.innerHTML = `<div class="tw"><table><thead><tr>${cols.map((c, i) => `<th class="${c.v || c.k ? 'sort' : ''}${c.num ? ' num' : ''}${st.i === i ? (st.dir > 0 ? ' asc' : ' desc') : ''}${c.cls ? ' ' + c.cls : ''}" data-i="${i}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>${list.map(r => `<tr${opt.rowAttr ? ' ' + opt.rowAttr(r) : ''}>${cols.map(c => `<td class="${c.num ? 'num' : ''}${c.cls ? ' ' + c.cls : ''}">${c.html(r)}</td>`).join('')}</tr>`).join('') ||
        `<tr><td colspan="${cols.length}" class="dim">沒有符合的資料</td></tr>`}</tbody></table></div>`;
    $$('th.sort', el).forEach(th => th.onclick = () => {
        const i = +th.dataset.i;
        st.dir = st.i === i ? -st.dir : (cols[i].num ? -1 : 1);
        st.i = i;
        renderTable(el, cols, rows, opt);
    });
}
// 分頁籤：tabs [[值, 文字]]，onPick(值)
function renderTabs(el, tabs, cur, onPick) {
    el.innerHTML = tabs.map(([v, t]) => `<button type="button" class="${v === cur ? 'on' : ''}" data-v="${esc(v)}">${t}</button>`).join('');
    $$('button', el).forEach(b => b.onclick = () => onPick(b.dataset.v));
}

// ───────── 全站搜尋 ─────────
let SEARCH_INDEX = null;
function searchIndex() {
    if (SEARCH_INDEX) return SEARCH_INDEX;
    const L = [];
    PAGES.forEach(([p, t, e]) => L.push({ t: `${e} ${t}`, k: '頁面', href: p + '.html' }));
    for (const id in W.classes) L.push({ t: `${W.classes[id].icon} ${W.classes[id].name}`, k: '職業', href: 'classes.html#' + id });
    for (const z of W.zones) L.push({ t: `${z.icon} ${z.name}`, k: ZONE_TYPE[z.type] || '地區', href: 'zones.html#' + z.id });
    for (const id in W.towns) L.push({ t: `${W.towns[id].icon} ${W.towns[id].name}`, k: '村莊', href: 'zones.html#town-' + id });
    for (const id in W.monsters) L.push({ t: `${W.monsters[id].icon} ${W.monsters[id].name}`, k: `怪物 Lv.${W.monsters[id].lv}`, mon: id });
    for (const id in W.skills) L.push({ t: `✨ ${W.skills[id].name}`, k: SKILL_TYPE[W.skills[id].type] || '技能', skill: id });
    for (const id in W.items) if (W.items[id].cat !== 'book') L.push({ t: W.items[id].name, k: itemTypeText(W.items[id]), item: id });
    return (SEARCH_INDEX = L);
}
function initSearch() {
    const box = $('.gsearch'), inp = $('input', box), res = $('.gs-res', box);
    let hits = [], sel = 0;
    const draw = () => {
        res.innerHTML = hits.map((h, i) => `<a href="${h.href || '#'}" class="${i === sel ? 'sel' : ''}" data-i="${i}">${h.item ? itemIcon(h.item) : ''}<span class="${h.item ? itemCls(h.item) : ''}">${esc(h.t)}</span><span class="k">${esc(h.k)}</span></a>`).join('') || '<a class="dim">找不到</a>';
        res.classList.toggle('on', !!inp.value.trim());
    };
    const go = h => {
        if (!h) return;
        res.classList.remove('on');
        if (h.item) openItem(h.item); else if (h.mon) openMon(h.mon); else if (h.skill) openSkill(h.skill); else location.href = h.href;
    };
    inp.addEventListener('input', () => {
        if (inp.isComposing) return;
        const q = inp.value.trim().toLowerCase();
        hits = q ? searchIndex().filter(x => x.t.toLowerCase().includes(q) || x.k.toLowerCase().includes(q)).slice(0, 30) : [];
        sel = 0; draw();
    });
    inp.addEventListener('compositionend', () => inp.dispatchEvent(new Event('input')));
    inp.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { sel = Math.min(hits.length - 1, sel + 1); draw(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
        else if (e.key === 'Enter') { go(hits[sel]); e.preventDefault(); }
    });
    res.addEventListener('click', e => { const a = e.target.closest('a[data-i]'); if (a) { e.preventDefault(); go(hits[+a.dataset.i]); } });
    document.addEventListener('click', e => { if (!box.contains(e.target)) res.classList.remove('on'); });
}

// ───────── 頁首、頁尾 ─────────
function initPage() {
    const page = document.body.dataset.page;
    const head = document.createElement('header');
    head.className = 'top';
    head.innerHTML = `<div class="top-in"><a class="logo" href="index.html"><b>⚔</b>黑暗大陸 攻略百科<span>v${esc(W.meta.version)}</span></a>
        <div class="gsearch"><input type="search" placeholder="搜尋道具、怪物、技能、地圖…" aria-label="全站搜尋"><div class="gs-res"></div></div>
        <button class="btn menu-btn" type="button" aria-label="選單">☰ 目錄</button></div>
        <nav class="nav">${PAGES.map(([p, t, e]) => `<a href="${p}.html" class="${p === page ? 'cur' : ''}">${e} ${t}</a>`).join('')}</nav>`;
    document.body.prepend(head);
    $('.menu-btn', head).onclick = () => $('.nav', head).classList.toggle('on');
    const foot = document.createElement('footer');
    foot.className = 'foot';
    foot.innerHTML = `資料自動擷取自遊戲原始碼（遊戲版本 ${esc(W.meta.version)}，整理日期 ${esc(W.meta.generated)}）。數值以遊戲實際為準，改版後可能不同。<br>
        <a href="https://k559610142-art.github.io/-username-.github.io-/%E5%B1%A0%E9%BE%8D%E5%8B%87%E8%80%85/" target="_blank" rel="noopener">▶ 前往《黑暗大陸》遊戲</a>　<a href="${PET_URL}" target="_blank" rel="noopener">🐾 黑暗大陸桌寵</a>　圖片版權屬遊戲作者所有。`;
    document.body.appendChild(foot);
    initSearch();
    // 網址帶 #item=xxx／#mon=xxx 時直接打開說明
    const m = location.hash.match(/^#(item|mon|skill)=(.+)$/);
    if (m) ({ item: openItem, mon: openMon, skill: openSkill })[m[1]](decodeURIComponent(m[2]));
}
document.addEventListener('DOMContentLoaded', initPage);
