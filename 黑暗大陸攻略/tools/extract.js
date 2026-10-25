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
const FILES = 'config classes skills items spellbook monsters zones quests resonance boss-enchant doll-abilities player enchant affix craft maps combat town icons'.split(' ');

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

let src = FILES.map(read).join('\n;\n');
// 單行常數（例如 const A = 1;）
const sliceLine = (file, name) => {
    const m = read(file).match(new RegExp(`^const ${name} = [^\\n]*;`, 'm'));
    if (!m) throw new Error(`${file}.js 找不到 ${name}`);
    return m[0];
};
src += '\n;' + sliceConst('raid', 'RAIDS') + '\n;' + sliceConst('wb', 'WB_KINDS');
src += '\n;' + sliceLine('doll-shop', 'DOLL_SHOP_PRICE') + '\n;' + sliceLine('doll-shop', 'DOLL_DISMANTLE_CRYSTALS');
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
for (const z of ZONES) {
    (z.mons || []).forEach(id => monsters[id] && monsters[id].zones.push(z.id));
    if (z.rare && monsters[z.rare.id]) monsters[z.rare.id].rareIn.push({ zone: z.id, p: z.rare.p });
    if (z.boss && monsters[z.boss]) monsters[z.boss].rareIn.push({ zone: z.id, lair: true });
}

// ── 地區、村莊 ──
const zones = ZONES.map(z => plain(pick(z, ['id', 'name', 'icon', 'type', 'lv', 'town', 'fee', 'mons', 'drops', 'desc', 'rare', 'noMap', 'boss', 'reqLv', 'cdH', 'prev'])));
const towns = plain(G('TOWNS'));
const shopByTier = {};
for (const t of [1, 2, 3, 4]) shopByTier[t] = Object.keys(ITEMS).filter(id => id !== 'polyScroll' && ITEMS[id].price && ITEMS[id].tier <= t);

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
    if (d.cat === 'currency') addSrc(id, { type: 'currency' });
    if (d.cat === 'map') addSrc(id, { type: 'mapdrop' });
    if (d.res && !d.price) addSrc(id, { type: 'mapboss' });
    if (d.soulEnchant) addSrc(id, { type: 'soul' });
    if (d.cat === 'doll') addSrc(id, { type: 'doll' });
    if (d.cat === 'quest') addSrc(id, { type: 'questitem' });
    // 暗黑式隨機裝備（affix.js randomEquipFor：回收價 ≤ 怪物等級 × 600、非職業限定、非共鳴）
    if ((d.cat === 'weapon' || d.cat === 'armor') && !d.classes && !d.res) {
        const minLv = Math.max(1, Math.ceil(sellPriceOf(id) / 600));
        if (minLv <= 105) addSrc(id, { type: 'random', minLv });
    }
}
addSrc('magicCrystal', { type: 'dismantle' });

// ── 任務首領的實際數值 ──
const quests = plain(G('CLASS_QUESTS'));
for (const qs of Object.values(quests)) for (const q of qs) {
    if (q.goal.type !== 'boss') continue;
    const b = G('buildMonster')('questBoss', q.goal.boss);
    q.goal.stats = pick(plain(b), ['lv', 'hp', 'ac', 'hit', 'dmg', 'exp', 'gold', 'mr', 'magic']);
}

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
        'MAGIC_SHOP_MAX_TIER', 'MAX_SLOTS', 'SPECIAL_AFFIX_IL', 'MAP_QTY_MAX', 'MAP_TIERS', 'TELE_CD']
        .map(n => [n, plain(C(n))])),
    statNames: plain(C('STAT_NAMES')), catNames: plain(C('CAT_NAMES')), slots: plain(C('SLOTS')), weaponTypes: plain(C('WEAPON_TYPES')),
    buffDefs: plain(C('BUFF_DEFS')),
    classes, skills, classSkills, magicTierNames: plain(C('MAGIC_TIER_NAMES')),
    items, sources, recipes: plain(C('RECIPES')), commonDrops: plain(C('COMMON_DROPS')),
    monsters, monsterTags: plain(C('MONSTER_TAGS')), zones, towns, shopByTier, tower,
    quests,
    resonance: plain(C('RESONANCE')), resImg: Object.fromEntries(Object.entries(RES_IMG).map(([k, v]) => [k, `images/icons/sk/${v}.jpg?v=1`])),
    resTiers: plain(C('RES_TIERS')), resTriggers: plain(C('RES_TRIGGER_NAMES')),
    affixes, specialAffixes, legendAffixes: plain(C('LEGEND_AFFIXES')), quality: plain(C('QUALITY')), rareNames: plain(C('RARE_NAMES')), lootFilters: plain(C('LOOT_FILTERS')),
    currency: plain(C('CURRENCY')), mapMods: plain(C('MAP_MODS')),
    mapCurrency: Object.fromEntries(Object.entries(C('MAP_CURRENCY')).map(([k, v]) => [k, v.desc])),
    mapTiers: Array.from({ length: C('MAP_TIERS') }, (_, i) => ({ t: i + 1, zone: C('mapZoneFor')(i + 1).id, scale: C('mapTierScale')(i + 1), resTier: C('resMaxTierForMap')(i + 1) })),
    bossEnchants: plain(C('BOSS_ENCHANTS')), bossEnchantText: plain(C('BOSS_ENCHANT_TEXT')),
    dolls: plain(C('DOLLS')), dollAbilities: plain(C('DOLL_ABILITIES')),
    morphForms: plain(C('MORPH_FORMS')),
    morphSprites: Object.fromEntries(Object.entries(C('MORPHS')).map(([k, m]) => [k, pick(plain(m.walk), ['src', 'cellW', 'cellH', 'frames'])])), morphTiers: plain(C('MORPH_TIERS')), morphGroups: plain(C('MORPH_GROUPS')),
    raids: plain(C('RAIDS')), wbKinds: plain(C('WB_KINDS')),
    expTable, enchantTable,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `// 自動產生：node tools/extract.js（遊戲版本 ${data.meta.version}，${data.meta.generated}）。不要手動修改。\nwindow.WIKI = ${JSON.stringify(data)};\n`);
console.log(`寫入 ${path.relative(ROOT, OUT)}：遊戲版本 ${data.meta.version}，職業 ${Object.keys(classes).length}、技能 ${Object.keys(skills).length}、道具 ${Object.keys(items).length}、怪物 ${Object.keys(monsters).length}、地區 ${zones.length}，${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
