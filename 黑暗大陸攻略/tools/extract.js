// 黑暗大陸攻略：從遊戲原始碼抽出百科資料，寫成 data/wiki-data.js
// 用法：node tools/extract.js [遊戲資料夾]
//   預設遊戲資料夾＝../../idle-lineage-class/-username-.github.io-/屠龍勇者（相對本資料夾）
// 遊戲更新後重跑一次，所有頁面的數值就會跟著更新。只讀遊戲檔案，不修改。
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const GAME = path.resolve(process.argv[2] || path.join(ROOT, '..', '..', 'idle-lineage-class', '-username-.github.io-', '屠龍勇者'));
const OUT = path.join(ROOT, 'data', 'wiki-data.js');
// 圖片直接用遊戲線上版的網址（不複製圖檔）
const IMG_BASE = 'https://k559610142-art.github.io/-username-.github.io-/%E5%B1%A0%E9%BE%8D%E5%8B%87%E8%80%85/';

// 只載入「資料＋規則」的檔案；介面、連線的檔案不需要
// 順序照遊戲 index.html（2026-11-08 加 uniques 傳奇裝備、elite 精英詞條、elements 元素、gems 開孔寶石）
const FILES = 'config classes skills items spellbook monsters zones quests advance resonance uniques boss-enchant doll-abilities mercenary afflict player enchant affix craft maps elite elements gems combat town talent-jewels talent talent-tree talent-layout talent-planner talent-live icons guild-core guild-missions'.split(' ');

// 瀏覽器物件用假的代替（載入時只會碰到一點點）
const stub = new Proxy(function () {}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : stub,
    apply: () => stub, construct: () => stub, set: () => true,
});
const ctx = {
    console, Math, Date, JSON, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 },
    document: stub, navigator: { userAgent: '' }, location: { search: '', href: '', hostname: 'localhost' },
    Image: function () { return stub; }, addEventListener() {}, requestAnimationFrame() {},
    matchMedia: () => ({ matches: false, addEventListener() {} }), fetch: () => new Promise(() => {}),
    TABS: {}, PANEL_FNS: {},   // talent.js 載入時會寫進介面的分頁表（ui-panels 沒載入）
};
ctx.window = ctx;
vm.createContext(ctx);

const read = f => fs.readFileSync(path.join(GAME, 'data', f + '.js'), 'utf8');
// 只取某個檔案裡的一段常數（那個檔案整個載入會碰到介面）
const sliceConst = (file, name) => {
    const s = read(file), i = s.indexOf(`const ${name} =`);
    if (i < 0) throw new Error(`${file}.js 找不到 ${name}`);
    const open = s.indexOf(s[s.indexOf('=', i) + 2] === '[' ? '[' : '{', i);
    const close = open + matchEnd(s.slice(open));
    return s.slice(i, close + 1) + ';';
};
function matchEnd(s) {
    let d = 0, q = null;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'" || c === '`') q = c;
        else if (c === '[' || c === '{') d++;
        else if (c === ']' || c === '}') { d--; if (!d) return i; }
    }
    throw new Error('括號不成對');
}

// 單行常數（例如 const A = 1;）
const sliceLine = (file, name) => {
    const m = read(file).match(new RegExp(`^const ${name} = [^\\n]*;`, 'm'));
    if (!m) throw new Error(`${file}.js 找不到 ${name}`);
    return m[0];
};
// talent-live 載入時會用到 ui-panels 的 CAT_ORDER（ui-panels 整個載入會碰到介面）
let src = FILES.map(f => (f === 'talent-jewels' ? sliceLine('ui-panels', 'CAT_ORDER') + '\n' : '') + read(f)).join('\n;\n');
src += '\n;' + sliceConst('raid', 'RAIDS') + '\n;' + sliceConst('wb', 'WB_KINDS');
src += '\n;' + sliceLine('doll-shop', 'DOLL_SHOP_PRICE') + '\n;' + sliceLine('doll-shop', 'DOLL_DISMANTLE_CRYSTALS');
src += '\n;' + sliceLine('map-queue', 'MAP_QUEUE_MAX') + '\n;' + sliceLine('map-queue', 'MAP_CRAFT_DEFAULT');
src += '\n;' + sliceConst('guild', 'GUILD_ROLE_NAMES') + '\n;' + sliceConst('guild', 'GUILD_PORTRAITS') + '\n;' + sliceConst('titles', 'TITLES');
src += '\n;' + sliceConst('scene-art', 'SCENE_QUEST_ART') + '\n;' + sliceConst('scene-art', 'SCENE_QUEST_SPRITES') + '\n;' + sliceConst('ui-create', 'GAME_UPDATES');
src += `\n;__G = { gameNow: () => gameNow };`;
vm.runInContext(src, ctx, { filename: 'game.js' });
const G = name => vm.runInContext(name, ctx);

// 去掉函式、只留資料
const plain = v => JSON.parse(JSON.stringify(v, (k, x) => typeof x === 'function' ? undefined : x));
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));

const ITEMS = G('ITEMS'), MONSTERS = G('MONSTERS'), ZONES = G('ZONES'), CLASSES = G('CLASSES');

// ── 職業 ──
const classes = {};
for (const [id, c] of Object.entries(CLASSES)) {
    classes[id] = {
        ...pick(c, ['name', 'icon', 'desc', 'base', 'hp', 'mp', 'startHp', 'startMp', 'mr', 'spDiv', 'mpRegenK', 'weapons', 'shield', 'start', 'ammo', 'slayer', 'lifesteal', 'art']),
        hero: vm.runInContext(`typeof heroSrc === 'function' ? heroSrc(${JSON.stringify(id)}) : ''`, ctx) || `images/classes/hero/${id}.webp?v=1`,
        atkK: plain(G('CLASS_ATK_K')[id] || { k: 1 }),
        weaponMs: Object.fromEntries((c.weapons || []).map(w => [w, G('weaponBaseMs')(w, id)])),
        story: plain(G('CLASS_STORIES')[id]),
        magic: plain(G('MAGIC_CLASS')[id]),
    };
}
// 原始資料沒寫但規則裡有的職業特性
const extraOf = vm.runInContext(`(() => { const o = {}; for (const id in CLASSES) { const c = CLASSES[id]; o[id] = Object.keys(c).filter(k => !['sprite','name','icon','desc','base','hp','mp','startHp','startMp','mr','spDiv','mpRegenK','weapons','shield','start','art','hero'].includes(k)); } return o; })()`, ctx);
for (const id in classes) classes[id].extraKeys = extraOf[id];

// ── 技能 ──
const skillNeedLv = G('skillNeedLv');
const skills = {};
for (const s of Object.values(G('SKILL_BY_ID'))) skills[s.id] = plain(s);
const classSkills = {};
for (const id in CLASSES) {
    classSkills[id] = G('classSkillList')(id).map(s => ({ id: s.id, lv: skillNeedLv(s, id) }));
}
const SKILL_IMG = G('SKILL_IMG'), RES_IMG = G('RES_IMG'), ITEM_IMG = G('ITEM_IMG');
for (const id in skills) if (SKILL_IMG[id]) skills[id].img = `images/icons/sk/${SKILL_IMG[id]}.jpg?v=1`;

// ── 道具 ──
const sellPriceOf = G('sellPriceOf');
const items = {};
for (const [id, d] of Object.entries(ITEMS)) {
    const x = plain(d);
    x.sellPrice = sellPriceOf(id);
    // 寶珠說明同遊戲 ui-panels（ITEMS 上的 desc 還留著試玩時期的文字）
    if (d.talentJewel) { const j = G('TALENT_JEWEL_CATALOG').find(c => c.id === d.talentJewel); x.desc = j.type === 'normal' ? j.mods.map(G('talentModText')).join('；') : j.text; }
    if (ITEM_IMG[id]) x.img = `images/icons/items/${ITEM_IMG[id]}.png?v=1`;
    else if (d.cat === 'book' && SKILL_IMG[d.skill]) x.img = `images/icons/sk/${SKILL_IMG[d.skill]}.jpg?v=1`;
    else if (d.doll && G('DOLLS')[d.doll]) x.img = G('DOLLS')[d.doll].art;
    else if (d.buff && G('POTION_IMG')[d.buff]) x.img = `images/icons/${G('POTION_IMG')[d.buff]}.jpg?v=1`;
    // 圖鑑品級（同 codex.js 的 codexGradeOf）
    if (d.cat === 'weapon' || d.cat === 'armor') {
        const s = x.sellPrice;
        x.grade = d.price ? 'normal' : s < 10000 ? 'high' : s < 30000 ? 'rare' : s < 80000 ? 'hero' : 'legend';
    }
    items[id] = x;
}

// ── 怪物（用遊戲的 makeMonster 算出實際數值）──
const makeMonster = G('makeMonster');
const monsters = {};
for (const id of Object.keys(MONSTERS)) {
    const m = makeMonster(id), t = MONSTERS[id];
    monsters[id] = {
        ...pick(m, ['name', 'icon', 'lv', 'hp', 'ac', 'hit', 'dmg', 'spd', 'exp', 'gold', 'mr', 'large', 'undead', 'boss', 'dragon', 'human', 'demon', 'holy']),
        magic: m.magic ? plain(m.magic) : null,
        drops: plain(t.drops || []),
        zones: [], rareIn: [],
    };
}
// 異常狀態（afflict.js）：機率沒寫的照 afflictTry 的預設
const AFFLICTS = G('AFFLICTS'), AFFLICT_DEFAULT_P = G('AFFLICT_DEFAULT_P'), AFFLICT_MONS = G('AFFLICT_MONS');
const afflictP = r => r.p != null ? r.p : AFFLICTS[r.kind].control ? AFFLICT_DEFAULT_P.control : AFFLICTS[r.kind].dot ? AFFLICT_DEFAULT_P.dot : AFFLICT_DEFAULT_P.other;
const afflictList = Object.entries(AFFLICT_MONS).map(([k, r]) => ({ kind: r.kind, id: monsters[k] ? k : null, name: monsters[k] ? monsters[k].name : k, on: r.on || 'magic', p: afflictP(r) }));
for (const a of afflictList) if (a.id) monsters[a.id].afflict = { kind: a.kind, on: a.on, p: a.p };
const afflicts = {
    defs: Object.fromEntries(Object.entries(AFFLICTS).map(([k, d]) => [k, pick(d, ['name', 'emoji', 'ms', 'bossMs', 'imm', 'k', 'dot', 'lethal', 'antiheal', 'control', 'breakOnHit', 'skip', 'ac', 'mr', 'hit', 'taken'])])),
    defaultP: plain(AFFLICT_DEFAULT_P), mons: afflictList,
};
for (const z of ZONES) {
    (z.mons || []).forEach(id => monsters[id] && monsters[id].zones.push(z.id));
    if (z.rare && monsters[z.rare.id]) monsters[z.rare.id].rareIn.push({ zone: z.id, p: z.rare.p });
    if (z.boss && monsters[z.boss]) monsters[z.boss].rareIn.push({ zone: z.id, lair: true });
}

// ── 地區、村莊 ──
const zones = ZONES.map(z => plain(pick(z, ['id', 'name', 'icon', 'type', 'lv', 'town', 'fee', 'mons', 'drops', 'desc', 'rare', 'noMap', 'boss', 'reqLv', 'cdH', 'prev'])));
const towns = plain(G('TOWNS'));
const shopByTier = {};
for (const t of [1, 2, 3, 4]) shopByTier[t] = Object.keys(ITEMS).filter(id => ITEMS[id].price && ITEMS[id].tier <= t);
// 怪物掉落的書（同 spellbook.js rollBookDrop：商店沒賣的書，最低學習等級 ≤ 怪物等級 +5 才會掉）
const bookDrops = Object.keys(ITEMS).filter(id => ITEMS[id].cat === 'book' && !ITEMS[id].price)
    .map(id => ({ id, lv: G('bookMinLv')(ITEMS[id]) })).sort((a, b) => a.lv - b.lv);

// ── 永夜之塔 ──
const makeTowerMonster = G('makeTowerMonster');
const towerFloors = [];
for (const f of [1, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
    const m = makeTowerMonster(f, false);
    const row = { floor: f, lv: m.lv, hp: m.hp, dmg: m.dmg, exp: m.exp, ac: m.ac, mr: m.mr, magic: m.magic && plain(m.magic) };
    if (f % 10 === 0) { const b = makeTowerMonster(f, true); row.boss = pick(plain(b), ['name', 'icon', 'lv', 'hp', 'dmg', 'exp', 'gold', 'ac', 'mr', 'magic', 'drops']); }
    towerFloors.push(row);
}
const tower = {
    themes: plain(G('TOWER_THEMES')), bosses: plain(G('TOWER_BOSSES')), materials: plain(G('TOWER_BOSS_MATERIALS')),
    bossDrops: plain(G('TOWER_BOSS_DROPS')), icons: plain(G('TOWER_ICONS')), floors: towerFloors,
    floorKills: G('TOWER_FLOOR_KILLS'), respawnH: G('TOWER_BOSS_RESPAWN_H'),
};

// ── 道具取得方式 ──
const sources = {};
const addSrc = (id, s) => { if (!items[id]) return; (sources[id] = sources[id] || []).push(s); };
for (const t of [1, 2, 3, 4]) {
    const town = Object.entries(towns).find(([, v]) => v.tier === t);
    shopByTier[t].forEach(id => { if (ITEMS[id].tier === t) addSrc(id, { type: 'shop', town: town[0], tier: t, price: ITEMS[id].price }); });
}
for (const [mid, m] of Object.entries(monsters)) m.drops.forEach(d => addSrc(d.id, { type: 'mon', mon: mid, p: d.p, n: d.n }));
for (const z of ZONES) (z.drops || []).forEach(d => addSrc(d.id, { type: 'zone', zone: z.id, p: d.p, n: d.n }));
tower.bossDrops.forEach((ids, g) => ids.forEach(id => addSrc(id, { type: 'tower', floor: (g + 1) * 10, p: 0.12 })));
tower.materials.forEach((id, g) => addSrc(id, { type: 'tower', floor: (g + 1) * 10, p: G('BOSS_MATERIAL_DROP_P') }));
addSrc('towerSoul', { type: 'tower', floor: 0, p: G('BOSS_MATERIAL_DROP_P') });
G('COMMON_DROPS').forEach(d => addSrc(d.id, { type: 'common', p: d.p, n: d.n, minLv: d.minLv, maxLv: d.maxLv }));
G('RECIPES').forEach((r, i) => addSrc(r.out, { type: 'recipe', idx: i }));
for (const [cls, qs] of Object.entries(G('CLASS_QUESTS'))) qs.forEach((q, ch) => { if (q.reward && q.reward.item) addSrc(q.reward.item, { type: 'quest', cls, ch }); });
for (const id in ITEMS) {
    const d = ITEMS[id];
    if (d.cat === 'book' && !d.price) addSrc(id, { type: 'book' });
    if (d.cat === 'currency' && id !== 'talentStone') addSrc(id, { type: 'currency' });
    if (d.cat === 'talentJewel' || id === 'talentStone') addSrc(id, { type: 'talent' });
    if (d.advReshape) addSrc(id, { type: 'advReshape' });
    if (d.cat === 'map') addSrc(id, { type: 'mapdrop' });
    if (d.res && !d.price) addSrc(id, { type: 'mapboss' });
    if (d.soulEnchant) addSrc(id, { type: 'soul' });
    if (d.cat === 'doll') addSrc(id, { type: 'doll' });
    if (d.cat === 'quest') addSrc(id, { type: /^q_\w+_4$/.test(id) ? 'advProof' : 'questitem' });
    if (d.cat === 'mercRune') addSrc(id, { type: 'mercRune' });
    // 暗黑式隨機裝備（affix.js randomEquipFor：回收價 ≤ 怪物等級 × 600、非職業限定、非共鳴）
    if ((d.cat === 'weapon' || d.cat === 'armor') && !d.classes && !d.res && !d.unique) {
        const minLv = Math.max(1, Math.ceil(sellPriceOf(id) / 600));
        if (minLv <= 105) addSrc(id, { type: 'random', minLv });
    }
}
addSrc('magicCrystal', { type: 'dismantle' });
for (const id of G('UNIQUE_IDS')) addSrc(id, { type: 'unique' });
for (const id of G('SUPPORT_GEM_IDS')) addSrc(id, { type: 'gem' });

// ── 傳奇裝備（uniques.js）──
const uniques = {
    reqLv: G('UNIQUE_REQ_LV'), dropP: plain(G('UNIQUE_DROP_P')),
    list: G('UNIQUE_DEFS').map(u => ({ id: 'uq_' + u.key, ...plain(pick(u, ['key', 'name', 'base', 'cat', 'type', 'slot', 'dmg', 'hit', 'ac', 'mr', 'weight', 'safe', 'wt', 'fx', 'special'])) })),
};
for (const u of uniques.list) {
    items[u.id].unique = true; items[u.id].grade = 'unique';   // 圖鑑品級另列「傳奇」
    if (ITEM_IMG[u.base]) items[u.id].img = `images/icons/items/${ITEM_IMG[u.base]}.png?v=1`;   // 遊戲沿用底材的圖示
}

// ── 精英詞條（elite.js）──
const elite = {
    affixes: plain(G('ELITE_AFFIXES')), expPerAffix: G('ELITE_EXP_PER_AFFIX'), minionExp: G('ELITE_MINION_EXP'), minionMax: G('ELITE_MINION_MAX'),
    shieldMs: G('ELITE_SHIELD_MS'), shieldK: G('ELITE_SHIELD_K'), summonMs: G('ELITE_SUMMON_MS'), blinkMs: G('ELITE_BLINK_MS'), afflictP: G('ELITE_AFFLICT_P'), fieldP: G('ELITE_FIELD_P'),
};

// ── 元素（elements.js）：每隻怪的抗性用遊戲的 monElemRes 算 ──
const monElemRes = G('monElemRes');
for (const [id, m] of Object.entries(monsters)) {
    const r = monElemRes({ id, undead: m.undead, dragon: m.dragon });
    if (r.fire || r.ice || r.light) m.elemRes = plain(r);
}
const elements = {
    defs: plain(G('ELEMENTS')), tagRes: plain(G('ELEM_TAG_RES')), ailmentP: G('ELEM_AILMENT_P'),
    igniteK: G('IGNITE_K'), igniteMs: G('IGNITE_MS'), chillMs: G('CHILL_MS'), freezeK: G('FREEZE_K'), freezeMs: G('FREEZE_MS'), shockMs: G('SHOCK_MS'), shockMul: G('SHOCK_MUL'),
    resMin: G('ELEM_RES_MIN'), resMax: G('ELEM_RES_MAX'),
};

// ── 開孔與寶石（gems.js）──
const SUPPORT_GEMS = G('SUPPORT_GEMS');
const gems = {
    maxLv: G('GEM_MAX_LV'), expShare: G('GEM_EXP_SHARE'), unsocketGold: G('GEM_UNSOCKET_GOLD'), dropP: G('GEM_DROP_P'), bossP: G('GEM_BOSS_P'),
    expNeed: Array.from({ length: G('GEM_MAX_LV') - 1 }, (_, i) => G('gemExpNeed')(i + 1)),
    support: Object.entries(SUPPORT_GEMS).map(([k, g]) => ({ id: 'gem_' + k, key: k, name: g.name, icon: g.icon, lv1: g.desc(1), lv10: g.desc(10), lv20: g.desc(20) })),
    maxSockets: Object.fromEntries(['twohand', 'sword', 'armor', 'helm', 'ring'].map(k => [k, G('gemMaxSockets')(k === 'twohand' ? { cat: 'weapon', type: 'twohand' } : k === 'sword' ? { cat: 'weapon', type: 'sword' } : { cat: 'armor', slot: k })])),
};
for (const g of gems.support) items[g.id].desc = g.lv1 + '（Lv.1）';

// ── 二轉（advance.js）──
const ADV_GROW = G('ADV_GROW'), bookIdOf = G('bookIdOf');
const advBranches = {};
for (const [cls, list] of Object.entries(G('ADV_BRANCHES'))) {
    advBranches[cls] = list.map(b => {
        addSrc(bookIdOf(b.skill1.id), { type: 'advQuest', cls, ch: 5 });
        addSrc(bookIdOf(b.skill2.id), { type: 'advQuest', cls, ch: 6 });
        addSrc('advAcc_' + b.id, { type: 'advQuest', cls, ch: 6 });
        return {
            id: b.id, name: b.name, color: b.color, growHp: ADV_GROW[b.grow][0], growMp: ADV_GROW[b.grow][1],
            passive: b.passive.id, skill1: b.skill1.id, skill2: b.skill2.id, acc: 'advAcc_' + b.id,
            art: `images/classes/advance-v1/${b.id}.png?v=1`,
        };
    });
}
const adv = {
    branches: advBranches, ch: G('ADV_CH'), skill1Lv: G('ADV_SKILL1_LV'), skill2Lv: G('ADV_SKILL2_LV'),
    proofP: G('ADV_PROOF_P'), reshapeP: G('ADV_RESHAPE_P'), reshapeLv: G('ADV_RESHAPE_LV'), worldCurP: G('ADV_WORLD_CUR_P'),
};

// ── 命運星盤（talent*.js）──
const TALENT_REGIONS = G('TALENT_REGIONS'), TALENT_PLAN_TREE = G('TALENT_PLAN_TREE'), TALENT_CLUSTER_FAMILIES = G('TALENT_CLUSTER_FAMILIES');
const talentNodeCount = {};
for (const n of TALENT_PLAN_TREE.nodes) talentNodeCount[n.kind] = (talentNodeCount[n.kind] || 0) + 1;
const talent = {
    rules: plain(G('TALENT_PROGRESS_RULES')), trialTiers: plain(G('TALENT_TRIAL_TIERS')), nodes: TALENT_PLAN_TREE.nodes.length, nodeCount: talentNodeCount,
    regions: TALENT_REGIONS.map((r, i) => {
        const nodes = TALENT_PLAN_TREE.nodes.filter(n => n.region === i), f = TALENT_CLUSTER_FAMILIES[i];
        const uniq = list => [...new Map(list.map(m => [JSON.stringify(m), m])).values()];
        return {
            id: r.id, name: r.name, color: r.color, core: r.core, desc: r.desc, coreText: f.core.text, nodes: nodes.length,
            small: uniq(nodes.filter(n => n.kind === 'small').flatMap(n => n.mods)), notable: uniq(nodes.filter(n => n.kind === 'notable').map(n => ({ name: n.name.split('・')[0], mods: n.mods }))),
        };
    }),
    socketTypes: plain(G('TALENT_SOCKET_TYPES')), jewels: plain(G('TALENT_JEWEL_CATALOG')), clusters: plain(TALENT_CLUSTER_FAMILIES), clusterSizes: plain(G('TALENT_CLUSTER_SIZES')),
    // 掉率只寫在後端（tools/talent-system.sql 的 talent_loot_items，codex.js 也是這組）：T1→T15 線性增加
    // 2026-11-02 起寶珠只有首領掉（遊戲第 274 節），天賦石小怪照掉
    drops: { jewel: { normal: [0.0002, 0.003], boss: [0.01, 0.05], trial: [0.02, 0.1] }, stone: { normal: [0.0005, 0.005], boss: [0.02, 0.1], trial: [0.05, 0.2] },
        pool: { normal: 0.7, radius: 0.1, cluster: 0.2 }, normalQuality: { magic: 0.7, rare: 0.3 }, clusterSize: { small: 0.6, medium: 0.3, large: 0.1 } },
};

// ── 任務首領的實際數值 ──
const quests = plain(G('CLASS_QUESTS'));
for (const qs of Object.values(quests)) for (const q of qs) {
    if (q.goal.type !== 'boss') continue;
    const b = G('buildMonster')('questBoss', q.goal.boss);
    q.goal.stats = pick(plain(b), ['lv', 'hp', 'ac', 'hit', 'dmg', 'exp', 'gold', 'mr', 'magic']);
}

// 任務首領外型（scene-art.js）：有立繪的給圖；職業試煉之影沿用該職業的立繪，頁面加暗影濾鏡
const QUEST_ART = G('SCENE_QUEST_ART'), QUEST_SPRITES = G('SCENE_QUEST_SPRITES');
const artPortrait = s => s.src.replace(/\.png$/, '-portrait.png');
const questArt = Object.fromEntries(Object.entries(QUEST_ART).map(([name, key]) => {
    const s = QUEST_SPRITES[key];
    return [name, s.shadow ? { shadow: s.actor } : { art: artPortrait(s) }];
}));
if (monsters.valakas && QUEST_SPRITES.valakas) monsters.valakas.art = artPortrait(QUEST_SPRITES.valakas);

// 傭兵公會（guild-core.js、guild.js）：只收名冊與任務名稱，任務路線還沒開放
const GC = G('GuildCore');
const guild = {
    roles: plain(G('GUILD_ROLE_NAMES')), portraits: plain(G('GUILD_PORTRAITS')), members: plain(GC.MEMBERS), initial: plain(GC.INITIAL),
    missions: Object.values(GC.MISSIONS).map(m => m.name), restMin: GC.REST_MS / 60000,
    // 2026-11-04 起 12 項普通任務開放（guild-missions.js）
    missionDefs: Object.values(G('GuildMissions').defs).map(d => pick(plain(d), ['id', 'name', 'kind', 'brief', 'limit', 'start'])),
};

// ── 經驗表 ──
const expTable = [];
for (let lv = 1; lv <= G('MAX_LEVEL'); lv++) expTable.push({ lv, next: G('expToNext')(lv), rate: G('huntExpRate')(lv), death: G('deathLossRate')(lv) });

// ── 衝裝成功率 ──
const enchantRate = G('enchantSuccessRate');
const enchantTable = [];
for (const safe of [0, 4, 6]) {
    const row = { safe, rates: [] };
    for (let cur = 0; cur < G('ENCHANT_MAX'); cur++) row.rates.push(enchantRate(cur, safe));
    enchantTable.push(row);
}

// ── 詞綴（數值上限依物品等級）──
const affixRow = a => ({ ...pick(a, ['name', 'pre', 'min', 'pct', 'cap', 'slots']), max: [20, 40, 60, 80, 99].map(il => Math.round(a.max(il) * 1000) / 1000) });
const affixes = Object.fromEntries(Object.entries(G('AFFIXES')).map(([k, a]) => [k, affixRow(a)]));
const specialAffixes = Object.fromEntries(Object.entries(G('SPECIAL_AFFIXES')).map(([k, a]) => [k, { ...pick(a, ['name', 'min', 'pct']), max: [70, 80, 90, 100, 110].map(il => Math.round(a.max(il) * 1000) / 1000) }]));

const C = n => G(n);
const data = {
    meta: { title: C('GAME_TITLE'), version: C('GAME_VERSION'), generated: new Date().toISOString().slice(0, 10), imgBase: IMG_BASE },
    consts: Object.fromEntries(['CREATE_TOTAL', 'CREATE_STAT_MAX', 'STAT_CAP', 'ELIXIR_MAX', 'BONUS_STAT_LEVEL', 'MAX_LEVEL', 'EXP_RATE',
        'OFFLINE_MIN_MS', 'OFFLINE_MAX_MS', 'OFFLINE_RATE', 'OFFLINE_SAMPLE_MS', 'POTION_CD_MS', 'WEIGHT_NO_REGEN', 'WEIGHT_NO_MP_REGEN', 'ENCHANT_MAX',
        'TOWN_TRAVEL_FEE', 'BOOK_DROP_P', 'BOOK_BOSS_P', 'CURRENCY_DROP_P', 'CURRENCY_BOSS_P', 'MAP_DROP_P', 'MAP_DROP_IN_MAP_P', 'RANDOM_EQUIP_P',
        'RES_MAP_BOSS_P', 'RES_CLASS_BONUS', 'BOSS_MATERIAL_DROP_P', 'PACK_WEIGHTS', 'TELE_MS', 'TELE_MUL', 'SKILL_GCD_MS', 'SKILL_DEFAULT_CD', 'MON_DMG_MUL',
        'MOB_JOIN_MS', 'MOB_JOIN_P', 'MOB_SIDE_SLOW', 'DOLL_SUMMON_COST', 'DOLL_SUMMON_MS', 'DOLL_DISMANTLE_CRYSTALS', 'DOLL_SHOP_PRICE','BOSS_ENCHANT_SOUL_COST',
        'MORPH_SPD_MAX', 'HASTE_MUL', 'BRAVE_MUL', 'WAFER_MUL', 'ATK_MIN_MS', 'CAST_BASE_MS', 'CAST_MIN_MS', 'CAST_POTION_MS', 'MAGIC_BOOK_PRICE',
        'MAGIC_SHOP_MAX_TIER', 'MAX_SLOTS', 'SPECIAL_AFFIX_IL', 'MAP_QTY_MAX', 'MAP_TIERS', 'TELE_CD',
        'MAP_QUEUE_MAX', 'TREASURE_MAP_DROP_P', 'SHOP_EQUIP_IL', 'BAR_N', 'MERC_REVIVE_COST', 'MERC_QUEST_KILLS',
        'DOLL_BUY_RATE', 'DOLL_BUY_CHECK_MS', 'MERC_MP_REGEN_MS', 'MERC_GEAR_MP_REGEN_K']
        .map(n => [n, plain(C(n))])),
    statNames: plain(C('STAT_NAMES')), catNames: plain(C('CAT_NAMES')), slots: plain(C('SLOTS')), weaponTypes: plain(C('WEAPON_TYPES')),
    buffDefs: plain(C('BUFF_DEFS')),
    classes, skills, classSkills, magicTierNames: plain(C('MAGIC_TIER_NAMES')),
    items, sources, bookDrops, recipes: plain(C('RECIPES')), commonDrops: plain(C('COMMON_DROPS')),
    monsters, monsterTags: plain(C('MONSTER_TAGS')), zones, towns, shopByTier, tower,
    quests,
    resonance: plain(C('RESONANCE')), resImg: Object.fromEntries(Object.entries(RES_IMG).map(([k, v]) => [k, `images/icons/sk/${v}.jpg?v=1`])),
    resTiers: plain(C('RES_TIERS')), resTriggers: plain(C('RES_TRIGGER_NAMES')),
    affixes, specialAffixes, legendAffixes: plain(C('LEGEND_AFFIXES')), quality: plain(C('QUALITY')), rareNames: plain(C('RARE_NAMES')), lootFilters: plain(C('LOOT_FILTERS')),
    currency: plain(C('CURRENCY')), currencyLadder: plain(C('CURRENCY_LADDER')), uniques, elite, elements, gems, mapMods: plain(C('MAP_MODS')),
    mapCurrency: Object.fromEntries(Object.entries(C('MAP_CURRENCY')).map(([k, v]) => [k, v.desc])),
    mapTiers: Array.from({ length: C('MAP_TIERS') }, (_, i) => ({ t: i + 1, zone: C('mapZoneFor')(i + 1).id, scale: C('mapTierScale')(i + 1), resTier: C('resMaxTierForMap')(i + 1) })),
    bossEnchants: plain(C('BOSS_ENCHANTS')), bossEnchantText: plain(C('BOSS_ENCHANT_TEXT')),
    dolls: plain(C('DOLLS')), dollAbilities: plain(C('DOLL_ABILITIES')),
    morphForms: plain(C('MORPH_FORMS')),
    morphSprites: Object.fromEntries(Object.entries(C('MORPHS')).map(([k, m]) => [k, pick(plain(m.walk), ['src', 'cellW', 'cellH', 'frames'])])), morphTiers: plain(C('MORPH_TIERS')), morphGroups: plain(C('MORPH_GROUPS')),
    raids: plain(C('RAIDS')), wbKinds: plain(C('WB_KINDS')),
    merc: {
        classes: plain(C('MERC_CLASSES')), slots: plain(C('MERC_SLOTS')), groups: plain(C('MERC_GROUPS')), ranks: plain(C('MERC_RANKS')),
        art: Object.fromEntries(Object.entries(C('MERC_MODELS')).map(([k, m]) => [k, m.art])),
        runes: Object.fromEntries(Object.entries(C('MERC_RUNES')).map(([k, r]) => [k, { ...plain(r), text: C('mercRuneText')(k) }])),
        drops: plain(C('MERC_RUNE_DROPS')), traits: plain(C('MERC_TRAITS')),
    },
    dollBuy: pick(plain(C('DEFAULT_SETTINGS')), ['dollBuyGreen', 'dollBuyBrave', 'dollBuyHeal', 'dollBuyBlue', 'dollBuyPoly']),
    mapCraftDefault: plain(C('MAP_CRAFT_DEFAULT')),
    afflicts, adv, talent,
    questArt, guild, titles: plain(C('TITLES')), updates: plain(C('GAME_UPDATES')),
    expTable, enchantTable,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `// 自動產生：node tools/extract.js（遊戲版本 ${data.meta.version}，${data.meta.generated}）。不要手動修改。\nwindow.WIKI = ${JSON.stringify(data)};\n`);
console.log(`寫入 ${path.relative(ROOT, OUT)}：遊戲版本 ${data.meta.version}，職業 ${Object.keys(classes).length}、技能 ${Object.keys(skills).length}、道具 ${Object.keys(items).length}、怪物 ${Object.keys(monsters).length}、地區 ${zones.length}，${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
