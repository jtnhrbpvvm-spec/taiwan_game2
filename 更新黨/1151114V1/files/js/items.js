// 背包道具：伺服器給的名字 → 顯示名、強化、$編號、是否裝備中；$編號 → 道具表（data/items.json，tools/gen-data.mjs 產生）
//   名字格式（L1ItemInstance.getNumberedViewName）：[屬性$61xx ][+強化 ]$編號[ (可用次數)][ (數量)][ ($9 揮舞中／$117 穿著中／$10 點亮)]
import { displayName, nameIdsOf } from './look.js';
import { honorInfo } from './top1.js';
import { CRAFT_HIDE } from './craft-hide.js';

let ITEMS = {};
export const itemsReady = fetch('/data/items.json').then(r => r.ok ? r.json() : null).then(d => { ITEMS = d || {}; }).catch(() => {});
export const itemTpl = nid => ITEMS[nid] || null;
// 同一個名字碼、能力不一樣的（冰之女王的耳環 Lv0～Lv8…）：知道道具編號就換成那一列（gen-data v；本機改動第 470 項）
export const tplVar = (tpl, id) => (tpl && id && tpl.v && tpl.v[id]) || tpl;
const sfxOf = t => t && t.sfx ? ' ' + t.sfx : '';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 道具用途（站長 2026-10-19「道具可以新增說明說它的用途嗎」→「自動產生先做個截圖來看」）：道具視窗最下面列「可以做成／到哪裡做／哪裡做得出來／商人收購」，
//   材料、雜物沒有任何配方要用＝「沒有用途」。資料：data/npcmake.json（製作配方：NPC → [{ o 成品, m 材料 }]，loc＝NPC 在哪）、data/shopsell.json（道具編號 → 收購價）
const GOLD_ID = 40308;
//   MAKE_SRC＝成品 → 做得出來的 NPC（製作工匠不列的配方 craft-hide.js 不算）：材料的「取得」用；MAKE_USE 的 h＝那個配方製作工匠不列
let MAKE_USE = null, MAKE_BY = null, MAKE_SRC = null, MK_LOC = {}, MK_ITEMS = {}, SELL = {};
export const useReady = Promise.all([
    fetch('/data/npcmake.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/data/shopsell.json').then(r => r.ok ? r.json() : null).catch(() => null),
]).then(([mk, ss]) => {
    SELL = ss || {};
    const use = new Map(), by = new Map(), src = new Map();
    if (mk && mk.npc) {
        MK_LOC = mk.loc || {}; MK_ITEMS = mk.items || {};
        for (const key in mk.npc) for (const r of mk.npc[key] || []) {
            const h = CRAFT_HIDE.has(key + '|' + r.a);
            for (const [oid] of r.o || []) {
                if (!by.has(oid)) by.set(oid, []); if (!by.get(oid).includes(key)) by.get(oid).push(key);
                if (!h) { if (!src.has(oid)) src.set(oid, []); if (!src.get(oid).includes(key)) src.get(oid).push(key); }
            }
            for (const [mid] of r.m || []) {
                if (mid === GOLD_ID) continue;
                if (!use.has(mid)) use.set(mid, []);
                for (const [oid] of r.o || []) { const u = use.get(mid).find(x => x.o === oid); if (!u) use.get(mid).push({ o: oid, npc: key, h }); else if (!h) u.h = false; }
            }
        }
    }
    MAKE_USE = use; MAKE_BY = by; MAKE_SRC = src;
});
// 第 371 項（站長 2026-10-27「有套裝加成的需說明」）：套裝（data/armorsets.json，gen-data 從 armor_set 產）→ 道具說明的「套裝、套裝加成」
let SETS = new Map(), POLY_C = new Map();
fetch('/data/polys.json').then(r => r.ok ? r.json() : null).then(d => { for (const p of d || []) if (p && p.n && p.c) POLY_C.set(String(p.n).toLowerCase(), p.c); }).catch(() => {});   // 變身英文名 → 中文名（變身選單同一份）
const polyZh = n => POLY_C.get(String(n || '').toLowerCase()) || n;
fetch('/data/armorsets.json').then(r => r.ok ? r.json() : null).then(d => { const m = new Map(); for (const s of d || []) for (const id of s.ids) { if (!m.has(id)) m.set(id, []); m.get(id).push(s); } SETS = m; }).catch(() => {});
const SET_LABEL = { ac: '防禦', hp: '體力上限', mp: '魔力上限', hpr: '體力恢復', mpr: '魔力恢復', mr: '魔防', str: '力量', dex: '敏捷', con: '體質', intl: '智力', wis: '精神', cha: '魅力',
    hit_modifier: '近距離命中', dmg_modifier: '近距離傷害', bow_hit_modifier: '遠距離命中', bow_dmg_modifier: '遠距離傷害', sp: '魔攻', defense_water: '水屬性抗性', defense_wind: '風屬性抗性', defense_fire: '火屬性抗性', defense_earth: '地屬性抗性' };
function setLines(t) {
    const out = [], list = t && t.id != null ? SETS.get(t.id) : null;
    if (!list) return out;
    const sgnN = v => (v > 0 ? '+' : '') + v;
    for (const s of list) {
        const bonus = Object.entries(s.b).map(([k, v]) => (SET_LABEL[k] || k) + ' ' + sgnN(k === 'ac' ? -v : v));
        if (s.ids.length > 1) {
            const names = s.ids.map(id => { const x = itemById(id); return x ? x.name : String(id); });
            out.push(['套裝', s.n + '（' + names.join('、') + '）']);
            if (bonus.length) out.push(['套裝加成', '全部穿上：' + bonus.join('、')]);
            if (s.p) { const z = polyZh(s.p); out.push(['套裝變身', /[A-Za-z]/.test(z) ? '全部穿上會變身' : '全部穿上變成' + z]); }
        } else {
            if (s.p) { const z = polyZh(s.p); out.push(['穿上效果', /[A-Za-z]/.test(z) ? '穿上會變身' : '變成' + z]); }
            if (bonus.length) out.push(['穿上加成', bonus.join('、')]);
        }
    }
    return out;
}
// 隨機寶箱（站長 2026-10-30「卡立普的袋子說明有機率開到 1% 的東西，普通跟高級都做」）：data/boxes.json（tools/treasure-box.mjs，照伺服器 TreasureBox.xml 換算成 %）
//   { 寶箱道具編號: [[道具編號, 數量, %, 名字, 種類, 稀有]…]（% 高到低）}。同一個名字碼有好幾種袋子（卡立普的袋子 49005～49008 內容各不同、道具表那列還是任務道具 40713）
//   → 要用真正的道具編號：背包照 TPL_OF、製作／商店照 infoItem 的 iid
//   稀有＝伺服器 TreasureBox.xml 標 Announce="true" 的（第 484 項：抽到會全服廣播；站長「什麼伊娃之石那些就不用說明了」）：只列這些的名字＋%，
//   其他的只寫種類（藥水、材料等）；袋子裡沒有稀有＝一行「打開隨機得到一樣：藥水、材料等」。舊的 boxes.json 沒有第 6 欄＝當作都沒有稀有
let BOXES = {};
fetch('/data/boxes.json').then(r => r.ok ? r.json() : null).then(d => { BOXES = d || {}; }).catch(() => {});
const pctTxt = v => +(+v).toFixed(2) + '%';
const BOX_KINDS = ['藥水', '材料', '卷軸', '武器', '防具', '魔法書', '魔法娃娃', '寶石', '食物', '箭', '飛刀', '袋子'];   // tools/treasure-box.mjs 的種類
// 第 567 項（站長 2026-11-02「南瓜箱子說明就像怪物掉寶那樣顯示就可以了，這樣就可以一目了然看到圖片跟道具名稱」）：這幾個箱子的內容改成掉寶式的格子——
//   一項一格、圖示＋名字＋數量＋%，照機率高到低（同本區掉寶 hud.js showMapDrops 的 .mi-drop）。其他袋子維持下面的文字寫法（站長另有要求：只列稀有、其他寫種類）。
//   列的型態 [標題, [{ nid, name, base, n, pct, bless }…], 'grid']，畫成 HTML 在 lineHtml；祝福版（道具編號 +100000）道具表只記一般版 → 找一般版、名字前加「祝福的」、圖示照一般版（同 hud.js 自動賣出清單）
const GRID_BOXES = new Set([49927]);   // 南瓜箱子
function boxGrid(list) {
    return [['打開得到', list.map(x => {
        const own = itemById(x[0]), t = own || (x[0] >= 100000 ? itemById(x[0] % 100000) : null), base = t ? t.name : x[3];
        return { nid: t ? t.nid : '', base, name: !own && t && !/^受?祝福/.test(base) ? '祝福的 ' + base : base, n: x[1], pct: x[2], bless: !own && t ? 0 : 1 };
    }), 'grid']];
}
// 說明列 → HTML：背包的道具視窗（hud.js openItem）、道具資訊（iteminfo.js）、交易所（market.js）都走這裡。一般列 [標題, 文字]（文字會 escape）；
//   'grid' 列（boxGrid）＝掉寶式的格子。icon＝道具圖示（icons.js itemIcon，由呼叫的人給：icons.js import 了這個檔，這裡不能反過來 import 它）
export function lineHtml(l, icon) {
    if (l[2] === 'grid') return '<div class="iw-grid"><span>' + l[0] + '</span><div class="iw-grid-list">' + l[1].map(x => {
        const src = icon ? icon({ name: x.base, nid: x.nid }) || '' : '';
        return '<div class="mi-drop"><img src="' + esc(src) + '" alt="" onerror="this.style.visibility=\'hidden\'"><span class="nm' + nameCls(x.bless) + '">' + esc(x.name) + (x.n > 1 ? ' ×' + x.n : '') + '</span><span class="rt">' + pctTxt(x.pct) + '</span></div>';
    }).join('') + '</div></div>';
    if (l[2] === 'os') return '<div style="background:rgba(212,170,60,.14)"><span style="color:#f0c860;font-weight:600">' + l[0] + '</span><b style="color:#ffe08a">' + esc(l[1]) + '</b></div>';   // 過安定值加成：金色底，一眼看得出來
    return '<div><span>' + l[0] + '</span><b>' + esc(l[1]) + '</b></div>';
}
export const boxInfoLines = id => boxLines(id);   // 南瓜視窗（pumpkin.js）列「箱子能開到」
function boxLines(id) {
    const list = BOXES[id];
    if (!list || !list.length) return [];
    if (GRID_BOXES.has(id)) return boxGrid(list);   // 第 567 項：南瓜箱子＝掉寶式的格子（boxes.json 已照 % 高到低排）
    // 固定內容的袋子（第 7 欄＝1，tools/treasure-box.mjs 的 SPECIFIC；站長 2026-11-01 守護神之袋）：一定全給 → 「打開得到」列出每一樣
    if (list.every(x => x[6])) return [['打開得到', list.map(x => { const b = itemById(x[0]); return (/^\+\d/.test(x[3]) ? x[3] : ((b && b.name) || x[3])) + (x[1] > 1 ? ' ×' + x[1] : ''); }).join('、')]];
    const nm = x => { const b = itemById(x[0]); return ((b && b.name) || x[3]) + (x[1] > 1 ? ' ×' + x[1] : ''); };
    const rare = list.filter(x => x[5]), rest = list.filter(x => !x[5]);
    // 其他：只寫種類，照 BOX_KINDS 的順序（每個袋子都寫「藥水、材料」不會一下顛倒）；「道具」那種雜項（神石、磨刀石…）不寫，用「等」帶過
    const rank = c => { const i = BOX_KINDS.indexOf(c); return i < 0 ? BOX_KINDS.length : i; };
    const cats = [...new Set(rest.map(x => x[4]))].sort((a, b) => rank(a) - rank(b)), named = cats.length > 1 ? cats.filter(c => c !== '道具') : cats;
    const kinds = named.join('、') + (named.length < cats.length ? '等' : '');
    // 內容只有幾種、沒有稀有（伊芙洛爾之袋：五穀麵包、葡萄酒各 1～3；詛咒之血 6 種）：每種一列寫數量範圍＋合計機率，不用種類帶過
    const ids = [...new Set(list.map(x => x[0]))];
    if (!rare.length && ids.length <= 6) {
        const out = [['用途', '打開隨機得到一樣']];
        for (const iid of ids) {
            const xs = list.filter(x => x[0] === iid), ns = xs.map(x => x[1]), lo = Math.min(...ns), hi = Math.max(...ns), b = itemById(iid);
            out.push([(b && b.name) || xs[0][3], (lo === hi ? lo : lo + '～' + hi) + ' 個（' + pctTxt(xs.reduce((s, x) => s + x[2], 0)) + '）']);
        }
        return out;
    }
    if (!rare.length) return [['用途', '打開隨機得到一樣：' + kinds]];
    const out = [['用途', '打開隨機得到一樣']];
    out.push(rare.every(x => x[2] === rare[0][2])
        ? ['稀有（' + (rare.length > 1 ? '各 ' : '') + pctTxt(rare[0][2]) + '）', rare.map(nm).join('、')]
        : ['稀有', rare.map(x => nm(x) + ' ' + pctTxt(x[2])).join('、')]);
    if (rest.length) out.push(['其他', kinds]);
    return out;
}
// 道具編號 → 名字碼、道具表（自動賣出清單存的是道具編號；同一個名字碼取編號最小的那個，跟 items.json 一樣）
let BY_ID = null;
export function itemById(id) {
    if (!BY_ID || !BY_ID.size) { BY_ID = new Map(); for (const nid in ITEMS) { const t = ITEMS[nid]; if (t && t.id != null && !BY_ID.has(t.id)) BY_ID.set(t.id, nid); } }
    const nid = BY_ID.get(id);
    return nid ? { nid, tpl: ITEMS[nid], name: displayName(nid) } : null;
}

// 背包每格是哪種道具（伺服器 S_Web 12：物件編號 → 道具編號）：未鑑定的名字看不出是哪種
export const TPL_OF = new Map();
// 試煉贈品（伺服器第 145 項，S_Web 12 尾端 m.bound）：背包裡哪幾件（物件編號）不能交易、存倉、上架；商店買的同款不在裡面
export const BOUND = new Set();
export const isBound = p => !!p && BOUND.has(p.id);
// 道具鎖（伺服器第 275 項，S_Web 12 尾端 m.locked；站長 2026-10-26「背包道具彈出的頁面新增鎖頭」）：鎖著的不能賣、刪、交易、上架、存血盟倉庫，AUTO 自動賣出也跳過
export const LOCKED = new Set();
export const isLocked = p => !!p && LOCKED.has(p.id);
export const lockTag = p => isLocked(p) ? '<span class="il-tag" aria-label="已鎖定">🔒</span>' : '';
// 主城傳送石（伺服器第 157 項，etcitem 49900）：20 級發、綁在角色身上（不能交易、存倉、刪除、賣），使用＝回奇岩主城、不會消失
export const HOME_STONE = 49900;
// 主城傳送石的圖示閃亮亮（站長 2026-10-24「圖檔用閃亮亮的」）：圖上金色光暈（glowCls → home-shine），格子裡再疊一層 hsFx（掃光＋小星星，lmui.css 檔尾）。
//   p：parseItem 過的（物件編號對 TPL_OF、或名字對到的道具表）；或獲得道具清單那種 { name }（名字＝道具表的鍵「主城傳送石」）
export const isHomeStone = p => !!p && ((p.it && TPL_OF.get(p.id) === HOME_STONE) || (p.tpl && p.tpl.id === HOME_STONE) || (!p.tpl && !!p.name && !!ITEMS[p.name] && ITEMS[p.name].id === HOME_STONE));
//   疊在圖示後面（同一個父格子裡，父格子要 position: relative）；不是主城傳送石＝空字串
export const hsFx = p => { const k = honorKind(p); return isHomeStone(p) || k >= 0 ? '<i class="hs-fx' + (k >= 0 ? ' hc-fx k' + k : '') + '" aria-hidden="true"><b></b><b></b><b></b></i>' : ''; };
// 榮耀卡片（伺服器第 169 項，etcitem 49901～49903，web/WebHonorCard；站長 2026-10-24「我卡片要在背包裡可以點，使用中。他屬於道具。」）：
//   跟著榮耀封號走（拿到發、失去收），綁定同主城傳送石（不能交易、存倉、刪除、賣）。種類＝top1.js 的封號種類（0 傳說勇者、1 怪物博士、2 奇趣收藏家）。
//   背包格子標「使用中」（hcTag）、閃亮亮同主城傳送石但配色照封號（glowCls → hc-shine k0～k2、hsFx 多 hc-fx；lmui.css 檔尾）；使用＝開榮耀卡（main.js useItem，不送伺服器）
export const HONOR_CARDS = [49901, 49902, 49903, 49929];   // 49929 推廣大使（第 710 項補；49904～49908 被祝福藥水用掉）
const HC_NAMES = ['榮耀卡片：傳說勇者', '榮耀卡片：怪物博士', '榮耀卡片：奇趣收藏家', '榮耀卡片：推廣大使'];
//   道具表還沒重產（gen-data）時：物件編號照 S_Web 12（TPL_OF），再不行照伺服器送的中文名字
export function honorKind(p) {
    if (!p) return -1;
    const id = (p.it && TPL_OF.get(p.id)) || (p.tpl && p.tpl.id) || (!p.tpl && p.name && ITEMS[p.name] ? ITEMS[p.name].id : 0);
    const k = HONOR_CARDS.indexOf(id);
    return k >= 0 ? k : HC_NAMES.indexOf(String(p.base || p.name || '').trim());
}
export const hcTag = p => honorKind(p) >= 0 ? '<span class="hc-use">使用中</span>' : '';
// 同款裝備疊成一格（同單機版 itemSig 的精神；只是網頁顯示上的——3.5 武器、防具不能真的疊，每件還是獨立的道具，動作逐件送封包）。
//   本機改動第 135 項起背包格數也照這個算（一疊 1 格）：**伺服器 L1PcInventory.groupKey 用一樣的規則**（道具編號、強化值、屬性種類＋等級、祝福、鑑定、損壞），改一邊另一邊也要改

//   全部一樣才疊：道具編號、名字（含強化值）、屬性強化的種類＋等級（名字碼 attrKey：名字裡看不到屬性，不分開就會把火 2 段、水 3 段、沒屬性的疊成一格、只剩第一件的光效）、祝福／一般／詛咒、有沒有鑑定、能力值那串（含損壞程度）
export const stackable = p => (p.cat === '武器' || p.cat === '防具') && !p.equipped && (p.count || 1) === 1;
export const stackKey = p => [TPL_OF.has(p.id) ? TPL_OF.get(p.id) : 'n' + p.nid, p.full, p.attrKey, p.it.bless, p.identified ? 1 : 0, p.it.st || '', p.it.gfx, BOUND.has(p.id) ? 'T' : ''].join('|');   // 第 145 項：試煉贈品和商店買的同款分開兩格（伺服器 groupKey 也分）
// 照順序疊：[{ p＝代表的那一件（第一件）, items＝這疊的每一件 }]；不能疊的自己一疊
export function stacks(list) {
    const out = [], by = new Map();
    for (const p of list) {
        if (!stackable(p)) { out.push({ p, items: [p] }); continue; }
        const k = stackKey(p);
        let s = by.get(k);
        if (!s) { s = { p, items: [] }; by.set(k, s); out.push(s); }
        s.items.push(p);
    }
    return out;
}

// 伺服器 useType（ItemTable._useTypes）→ 紙娃娃部位；臂甲（guarder）跟盾同一格
export const SLOT_OF_USE = { 1: 'wpn', 2: 'armor', 18: 'tshirt', 19: 'cloak', 20: 'gloves', 21: 'boots', 22: 'helm', 23: 'ring', 24: 'amulet', 25: 'shield', 37: 'belt', 40: 'ear' };
const ARMOR_USE = new Set([2, 18, 19, 20, 21, 22, 23, 24, 25, 37, 40]);
export const WEAPON_NAME = { sword: '單手劍', dagger: '匕首', tohandsword: '雙手劍', bow: '弓', singlebow: '弓', spear: '矛', singlespear: '矛', blunt: '斧', tohandblunt: '雙手斧',
    staff: '魔杖', tohandstaff: '魔杖', throwingknife: '飛刀', gauntlet: '鐵手甲', claw: '鋼爪', edoryu: '雙刀', kiringku: '奇古獸', tohandkiringku: '奇古獸', chainsword: '鎖鏈劍' };
export const ARMOR_NAME = { helm: '頭盔', armor: '盔甲', T: 'T恤', cloak: '斗篷', glove: '手套', boots: '長靴', shield: '盾牌', guarder: '臂甲', amulet: '項鍊', ring: '戒指', belt: '腰帶', earring: '耳環' };
// 雙手武器（伺服器 L1Weapon.isTwohandedWeapon：type 3 雙手劍、4 弓、5 矛、11 鋼爪、12 雙刀、15 雙手斧、16 雙手杖、18 鎖鏈劍、19 雙手奇古獸）：穿了不能拿盾
export const TWO_HAND = new Set(['tohandsword', 'bow', 'spear', 'claw', 'edoryu', 'tohandblunt', 'tohandstaff', 'chainsword', 'tohandkiringku']);
// 防具表 type → 紙娃娃部位（商店、製作清單的道具沒有 useType，換裝差值照這個找身上同一格）
const SLOT_OF_ARMOR = { helm: 'helm', armor: 'armor', T: 'tshirt', cloak: 'cloak', glove: 'gloves', boots: 'boots', shield: 'shield', guarder: 'shield', amulet: 'amulet', ring: 'ring', belt: 'belt', earring: 'ear' };

// 祝福：伺服器的 bless（S_AddItem／S_InvList／倉庫清單／S_ItemColor）0 祝福、1 一般、2 詛咒，封印的再 +128（3＝未鑑定）。
//   未鑑定的不標（伺服器 2026-10-17 起道具一律已鑑定，實際上都會標）。
//   詛咒（2）站長 2026-10-19「詛咒都拿掉」：伺服器不再做出詛咒版、舊的換成一般版 → 萬一還收到 2 也當一般的（不加「詛咒的」、不染紅）
export function blessOf(it) {
    if (!it || !it.identified || it.bless == null) return 1;
    return (it.bless & 127) === 0 ? 0 : 1;
}
export const BLESS_WORD = { 0: '祝福的' };
// 屬性強化名字碼（伺服器 L1ItemInstance.getNumberedViewName：地 1、火 2、水 4、風 8 × 1～3 段）→ 單機版光效的元素字首＋段數（3.5 只有武器、只到 3 段）
const ATTR_GLOW = { $6115: 'fr1', $6116: 'fr2', $6117: 'fr3', $6118: 'wa1', $6119: 'wa2', $6120: 'wa3', $6121: 'wi1', $6122: 'wi2', $6123: 'wi3', $6124: 'ea1', $6125: 'ea2', $6126: 'ea3' };
// 道具圖示光效（照單機版 js/08-items-equip.js getGlowClass，樣式 lmui.css 檔尾，照抄 css/style.css）：套在圖示 <img> 上，格子照一般的。
//   屬性＋祝福（金邊加強、呼吸）＞祝福（1px 金邊、圖本身亮暗呼吸）＞屬性（同色系光、段數越高越亮、靜態）；遠古、傳說、遺物 3.5 沒有（詛咒的暗紅 2026-10-19 拿掉）
//   p：parseItem 過的；或 { bless }（建立物品清單那種只有祝福的）
const ATTR_ELE = { fr: '火', wa: '水', wi: '風', ea: '地' };
export function glowCls(p) {
    if (!p) return '';
    if (isHomeStone(p)) return 'home-shine';
    const hk = honorKind(p); if (hk >= 0) return 'hc-shine k' + hk;   // 第 169 項：榮耀卡片
    const a = p.attrKey;
    if (a && p.bless === 0) return 'bless-glow-strong';
    if (p.bless === 0) return 'bless-glow';
    return a ? 'attr-glow-' + a : '';
}
// 名字顏色（單機版 .c-blessed）
export const nameCls = b => b === 0 ? ' c-blessed' : '';

export function parseItem(it) {
    let s = it.name || '';
    const equipped = /\(\$(9|117)\)/.test(s), lit = /\(\$10\)/.test(s);
    s = s.replace(/\s*\(\$(9|117|10|11)\)/g, '');
    let attr = '', hasAttr = false, attrKey = '', en = 0, m;   // 屬性強化的名字碼 3.5C 字串表裡沒有（attr 會是空的）→ 有沒有屬性、哪種幾段另外記
    if ((m = s.match(/^(\$61(?:1[5-9]|2[0-6]))\s+/))) { hasAttr = true; attrKey = ATTR_GLOW[m[1]] || ''; attr = displayName(m[1]); s = s.slice(m[0].length); }
    const hasEn = !!(m = s.match(/^([+-]\d+)\s+/));
    if (hasEn) { en = +m[1]; s = s.slice(m[0].length); }
    m = s.match(/^\$\d+(?: \$\d+)*/);   // 名字碼可能好幾段（「$1652 $264」），整串才對得到道具表
    const nid = m ? m[0] : '';
    const rest = (m ? s.slice(nid.length) : s).replace(/\s*\(\d+\)\s*$/, '');   // 尾巴的「 (數量)」另外顯示；可用次數、剩餘時間留著
    const base = m ? displayName(nid) : displayName(rest).trim();
    //   道具表的名字碼不一定是乾淨的「$數字」：有直接寫中文的（歷戰系列、燃燒系列、護符、泳裝、各種指定傳送卷軸…282 種）、「$數字」後面接字的（「$1000 耳環」）、
    //   兩段黏在一起的（「$4928$4932」）。伺服器照名字碼原樣送，所以整串（去掉強化、數量、穿著標記）先拿去對 items.json，對不到才用開頭那段「$數字」
    const whole = s.replace(/\s*\(\d+\)\s*$/, '').trim();
    const tpl = tplVar(ITEMS[whole] || ITEMS[nid] || null, TPL_OF.get(it.id));
    // 名字最前面加「祝福的」；道具名字本身已經有（例：受祝福的…）就不重複
    const bless = blessOf(it), bw = BLESS_WORD[bless] && !/^受?祝福/.test(base) ? BLESS_WORD[bless] + ' ' : '';
    const full = bw + (attr ? attr + ' ' : '') + (hasEn ? (en >= 0 ? '+' : '') + en + ' ' : '') + base + (m ? displayName(rest) : '') + sfxOf(tpl);
    let slot = SLOT_OF_USE[it.useType] || null;
    if (!slot && tpl && tpl.k === 'e') slot = tpl.type === 'arrow' ? 'arrow' : tpl.type === 'magic_doll' ? 'doll' : null;
    return { it, id: it.id, nid, base, full, attr, hasAttr, attrKey, en, hasEn, equipped, lit, count: it.count, tpl, slot, identified: !!it.identified, bless,
        cat: it.useType === 1 ? '武器' : ARMOR_USE.has(it.useType) ? '防具' : '道具' };
}

// 商店、製作清單上的道具（不在背包、沒有物件編號）→ 跟 parseItem 一樣的形狀，給道具視窗（iteminfo.js）用。
//   nid＝名字碼（製作配方有）；沒有就照中文名找：商店清單伺服器送的是道具表的中文名（整包賣的帶「 (數量)」），
//   名字碼本身是中文的直接對得到，其他用 names.json 反查（同名的挑道具表有的）。查不到 tpl＝null（視窗只有名字）
export function infoItem({ name = '', nid = '', bless = 1, id = 0 }) {
    const m = name.match(/^(.*?)\s*\((\d+)\)$/), base = m ? m[1] : name;
    const key = nid && ITEMS[nid] ? nid : ITEMS[base] ? base : nameIdsOf(base).find(k => ITEMS[k]) || '';
    const tpl = key ? tplVar(ITEMS[key], id) : null;
    const slot = !tpl ? null : tpl.k === 'w' ? 'wpn' : tpl.k === 'a' ? SLOT_OF_ARMOR[tpl.type] || null : tpl.type === 'arrow' ? 'arrow' : tpl.type === 'magic_doll' ? 'doll' : null;
    const b = bless === 0 ? 0 : 1, disp = (base || (key ? displayName(key) : '')) + sfxOf(tpl);   // 詛咒（2）當一般的（2026-10-19 詛咒拿掉）
    const bw = BLESS_WORD[b] && !/^受?祝福/.test(disp) ? BLESS_WORD[b] + ' ' : '';
    const count = m ? +m[2] : 1;
    return { it: { bless: b, identified: 1, count }, id: 0, iid: id || 0, nid: key, base: disp, full: bw + disp, attr: '', hasAttr: false, attrKey: '', en: 0, hasEn: false, equipped: false, lit: false,
        count, tpl, slot, identified: true, bless: b, cat: tpl && tpl.k === 'w' ? '武器' : tpl && tpl.k === 'a' ? '防具' : '道具' };
}

// 魔法書、精靈水晶在哪裡都能讀（伺服器本機改動第 68 項，站長 2026-10-21 拿掉神殿、世界樹的地點限制）→ 道具說明不寫閱讀地點

// 武器種類＋單手／雙手（雙手武器不能拿盾）
const weaponKind = t => (WEAPON_NAME[t.type] || t.type) + '・' + (TWO_HAND.has(t.type) ? '雙手武器' : '單手武器');
// 能不能強化（照強化視窗 enhance.js 的規則）：安定值 < 0＝不能；飾品照等級（grade < 0 不能）用飾品強化卷軸；象牙塔／幻象／試煉裝備只能用專用卷軸
const ENX_NAME = { ivory: '象牙塔', illusion: '幻象', trial: '試煉' };
function enchantLine(t) {
    if (t.k === 'a' && /^(amulet|ring|earring|belt)$/.test(t.type)) return ['強化', '不能強化'];   // 飾品強化不開放（伺服器第 172 項）
    if (t.safe == null || t.safe < 0) return ['強化', '不能強化'];
    return ['安定值', '+' + t.safe + (t.enx ? '（只能用' + ENX_NAME[t.enx] + '卷軸）' : '')];
}
// 寵物裝備的強化上限（伺服器 web/WebPetEnchant.MAX，照單機版）
export const PET_EN_MAX = 5;
// 武器回魔含強化加成（伺服器本機改動第 66 項：巴列斯魔杖、紅水晶魔杖每強化 +2，L1StaffProc.mprByEnchant；gen-data 帶 mprEn）；負強化不扣
export const mprOf = (t, en) => (t.mpr || 0) + (t.mprEn || 0) * Math.max(0, en || 0);
// 法杖共鳴／魔擊（伺服器 model/L1StaffProc，名單、機率在伺服器 config/web-staff.properties；gen-data 帶 res 1／2、mst、pch）：
//   機率＝pch ＋ 過安定值的強化（不能強化的杖不加），照名字上的 +N 算；只有法師拿著才有
export const procChance = (t, en) => Math.min(100, (t.pch || 0) + (t.safe >= 0 ? Math.max(0, (en || 0) - t.safe) : 0));
function procLines(t, en) {
    if (!t.res && !t.mst) return [];
    const ch = procChance(t, en), out = [];
    if (t.mst) out.push(['魔擊', '法師普通攻擊或放攻擊魔法時 ' + ch + '% 機率追加一次必中重擊']);
    else out.push(['共鳴', '法師普通攻擊或放攻擊魔法時 ' + ch + '% 機率免費放一發光箭']);
    if (t.safe >= 0) out.push([t.mst ? '魔擊強化' : '共鳴強化', (t.mst ? '每 +1 傷害 +1' : t.res === 2 ? '每 +2 光箭傷害 +1' : '每 +1 光箭傷害 +1') + '，過安定值每 +1 機率 +1%']);
    return out;
}
// 本機改動第 374 項（站長 2026-10-27「魔法武器有實裝嗎 有說明嗎」）：特殊武器命中時的效果 → 道具說明「武器效果」
//   伺服器只認道具編號（祝福／詛咒版另有編號，只有伺服器明寫的那幾把才算），所以這裡寫死一張表；數字照伺服器讀出來的：
//   ① weapon_skill 表（L1WeaponSkill.getWeaponSkillDamage）：機率 probability%，傷害 fix_damage ＋ 0～(random_damage−1)，不看智力，
//      吃對方魔防和屬性抗性；area>0 時打到目標周圍 area 格的其他敵人；skill_id 64＝魔法封印 skill_time 秒
//   ② L1Attack／L1WeaponSkill 寫死的：巴風特、耀武系列（124、289～303，表裡耀武那幾筆被這條蓋過不會用到）、雷雨／天雷、狂風、酷寒、
//      大法師（疾病術，機率 (5−魔防/10×5)%，0 時 1%）、毀滅（75% 吸血 武器傷害/8+1）、骰子、深紅之弩、瑪那吸魔（上限 9）、魔力短劍、
//      死亡之指／古代黑暗妖精之劍毒（L1DamagePoison 3 秒 5 血 30 秒）、底比斯等追擊（L1Chaser，「5 > 1～100」實際 4%，1 秒一下共 3 下）、沙哈之弓
//   玄冰弓 287 程式有列但範圍、倍率只寫給 263，實際打不出傷害 → 不列
const WFX_INT = (ch, el, lo, hi, extra) => '命中時 ' + ch + '% 機率追加' + el + '屬性魔法傷害，約（智力＋魔攻）× ' + lo + '～' + hi + (extra || '');
const WFX_CHASE = el => '命中時 4% 機率發動追擊：連打 3 下' + el + '屬性魔法傷害（智力越高越痛）';
const WFX = new Map();
const wfx = (ids, s) => { for (const id of ids) WFX.set(id, s); };
wfx([47], '命中時 2% 機率封印對方魔法 16 秒');
wfx([54], '命中時 15% 機率追加 35～59 風屬性魔法傷害');
wfx([58], '命中時 7% 機率追加 75～89 火屬性魔法傷害');
wfx([76], '命中時 15% 機率追加 35～59 地屬性魔法傷害');
wfx([121], '命中時 25% 機率追加 95～149 水屬性魔法傷害');
wfx([203], '命中時 15% 機率追加 90～179 火屬性魔法傷害，周圍 2 格內的敵人也會被打到');
wfx([205], '命中時 5% 機率追加 8 點魔法傷害');
wfx([256, 257, 258], '命中時 8% 機率追加 35～59 地屬性魔法傷害');
wfx([124, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303], WFX_INT(14, '地', 1.8, 3.6));
wfx([264, 288], WFX_INT(4, '風', 2, 4));
wfx([260], WFX_INT(4, '風', 1.5, 3, '，自己周圍 4 格內的敵人也會被打到'));
wfx([263], WFX_INT(5, '水', 1.4, 2.8, '，目標周圍 3 格內的敵人也會被打到'));
wfx([261], '命中時 5% 機率讓對方中疾病術（攻擊 -6、防禦變差 12）；對方魔防 10 以上只剩 1%，20 以上不會中');
wfx([262], '命中時 75% 機率吸血：多打出約武器傷害 1/8，並回復等量體力');
wfx([2, 200002], '命中時 2% 機率打掉對方目前體力的 2/3，之後這把匕首會消失');
wfx([204, 100204], '命中時 2% 機率把對方定身 8 秒');
wfx([259], '命中時吸取對方 1 點魔力，對方魔防越高越難吸到');
wfx([13, 44], '命中時 10% 機率讓對方中毒：每 3 秒扣 5 體力，持續 30 秒');
wfx([265, 266, 267, 268, 280, 281], WFX_CHASE('地'));
wfx([276, 277, 304, 305, 306, 307, 308, 309], WFX_CHASE('水'));
wfx([190], '不用裝箭也能射，每箭額外 1～15 傷害');
function weaponFxLines(t, en) {
    if (t.id === 126 || t.id === 127) return [['武器效果', '命中時吸取對方 1～' + Math.max(1, Math.min(9, (en || 0) + 3)) + ' 點魔力（強化越高吸越多，最多 9）']];
    const s = WFX.get(t.id);
    return s ? [['武器效果', s]] : [];
}
// 伺服器第 685 項 web/WebOverSafe：強化超過安定值另外給的能力（穿著才有），表、算法跟伺服器一樣——
//   「過幾」＝強化值 − 安定值；安定值 0 的 +1、+2 只有小加成（武器傷害 +1；防具 HP +5、+8），+3 起才算過 1。飾品、寵物裝備、不能強化的沒有
const OS_W_DMG = [0, 1, 1, 2, 3, 4, 5], OS_W_HIT = [0, 0, 1, 2, 3, 4, 5];
const OS_A = [[0, 0, 0, 0], [10, 0, 0, 0], [15, 5, 0, 0], [20, 10, 1, 0], [30, 15, 1, 1], [40, 20, 1, 2]];   // HP、MP、傷害減免、抗魔
function overSafeLines(t, en) {
    if (t.safe == null || t.safe < 0 || !(en > 0)) return [];
    if (t.k === 'a' && /^(amulet|ring|earring|belt)$/.test(t.type)) return [];
    if (t.k !== 'w' && t.k !== 'a') return [];
    const small = t.safe === 0 && en <= 2, over = t.safe === 0 ? en - 2 : en - t.safe;
    if (!small && over <= 0) return [];
    const head = small ? '過安定值 小加成' : '過安定值 ' + over;   // 一行放得下（手機寬），加成內容放右邊
    if (t.k === 'w') {
        if (small) return [[head, '傷害 +1', 'os']];
        const dmg = over < OS_W_DMG.length ? OS_W_DMG[over] : OS_W_DMG[OS_W_DMG.length - 1] + over - OS_W_DMG.length + 1, hit = OS_W_HIT[Math.min(over, OS_W_HIT.length - 1)];
        return [[head, '傷害 +' + dmg + (hit ? '、命中 +' + hit : ''), 'os']];
    }
    if (small) return [[head, 'HP +' + (en === 1 ? 5 : 8), 'os']];
    const [hp, mp, dr, mr] = OS_A[Math.min(over, OS_A.length - 1)];
    const out = [[head, 'HP +' + hp + (mp ? '、MP +' + mp : ''), 'os']];   // 四項擠一列手機會斷行 → 傷害減免、抗魔另一列
    if (dr || mr) out.push(['', (dr ? '傷害減免 +' + dr : '') + (dr && mr ? '、' : '') + (mr ? '抗魔 +' + mr : ''), 'os']);
    return out;
}
// 道具視窗的說明列（只列有值的；數值照道具表，強化照名字上的 +N）
export function itemLines(p) {
    const hk = honorKind(p);
    if (hk >= 0) { const h = honorInfo(hk); return [['用途', '榮耀封號的證明' + (h.text ? '，持有期間附加：' + h.text : '') + '；點「使用」看榮耀卡']]; }   // 第 169 項（道具表還沒重產也顯示）
    const t = p.tpl, out = [];
    if (!t) return out;
    if (!p.identified) {   // 未鑑定：數值看不到（同用戶端），種類、職業、重量照列
        const CL = [[1, '王族'], [2, '騎士'], [4, '妖精'], [8, '法師'], [16, '黑暗妖精']];
        if (t.k === 'w') out.push(['種類', weaponKind(t)]);
        if (t.k === 'a') out.push(['種類', ARMOR_NAME[t.type] || t.type]);
        if (t.k !== 'e') out.push(['可用職業', t.cls === 31 ? '全職業' : CL.filter(c => t.cls & c[0]).map(c => c[1]).join('、') || '無']);
        if (t.w) out.push(['重量', String(+(t.w / 1000).toFixed(2))]);
        out.push(['鑑定', '未鑑定']);
        return out;
    }
    const sgn = v => (v > 0 ? '+' : '') + v;
    if (t.k === 'w') {
        out.push(['種類', weaponKind(t)]);
        if (p.attrKey) out.push(['屬性強化', ATTR_ELE[p.attrKey[0] + p.attrKey[1]] + ' ' + p.attrKey[2] + ' 段']);   // 名字碼 3.5C 字串表裡沒有、名字上看不到 → 這裡寫出來
        if (t.ds || t.dl) out.push(['攻擊', '小型 ' + t.ds + '／大型 ' + t.dl + (p.en ? '（' + sgn(p.en) + '）' : '')]);
        if (t.hit) out.push(['命中', sgn(t.hit)]);
        if (t.dmg) out.push(['額外傷害', sgn(t.dmg)]);
        if (t.mdm) out.push(['魔法傷害', sgn(t.mdm)]);
        out.push(...overSafeLines(t, p.en));
        out.push(['損壞', t.bd ? '會' : '不會']);   // gen-data bd＝武器表 canbedmg
        out.push(...procLines(t, p.en));
        out.push(...weaponFxLines(t, p.en));   // 第 374 項
    } else if (t.k === 'e' && t.pet) {   // 寵物裝備（伺服器 petitem 表，gen-data 的 pet）：每隻寵物都能穿（pettypes canUseEquipment 全開），夥伴視窗「武器」「防具」穿
        //   強化（伺服器 web/WebPetEnchant，照單機版）：牙用對武器施法的卷軸、盔甲用對盔甲施法的卷軸，最多 +5；牙每 +1 命中、額外傷害各 +1，盔甲每 +1 防禦 +1
        const P = t.pet, ST = ['力量', '敏捷', '體質', '智力', '精神'], en = Math.max(0, Math.min(PET_EN_MAX, p.en || 0));
        out.push(['種類', P.wpn ? '寵物武器' : '寵物防具']);
        if (P.wpn) { if (P.hit || en) out.push(['寵物命中', sgn((P.hit || 0) + en)]); if (P.dmg || en) out.push(['寵物額外傷害', sgn((P.dmg || 0) + en)]); }
        else if (P.ac || en) out.push(['寵物防禦', String(-(P.ac || 0) + en)]);   // 表裡是負數（L1PetInstance.addAc）
        (P.add || []).forEach((v, i) => { if (v) out.push(['寵物' + ST[i], sgn(v)]); });
        if (P.hp) out.push(['寵物體力上限', sgn(P.hp)]);
        if (P.mp) out.push(['寵物魔力上限', sgn(P.mp)]);
        if (P.sp) out.push(['寵物魔攻', sgn(P.sp)]);
        if (P.mr) out.push(['寵物魔防', sgn(P.mr)]);
        out.push(['強化', (P.wpn ? '對武器' : '對盔甲') + '施法的卷軸，最多 +' + PET_EN_MAX]);
        out.push(['可用', '所有寵物']);
    } else if (t.k === 'e' && (t.ds || t.dl)) {   // 箭、飛刀
        out.push(['攻擊', '小型 ' + t.ds + '／大型 ' + t.dl]);
    } else if (t.k === 'a') {
        out.push(['種類', ARMOR_NAME[t.type] || t.type]);
        const ac = -t.ac + (/ring|amulet|earring|belt/.test(t.type) ? 0 : p.en);   // 道具表的 ac 是負數（L1EquipmentSlot：addAc(ac − 強化)）
        if (ac) out.push(['防禦', String(ac)]);
        out.push(...overSafeLines(t, p.en));
        if (t.dr) out.push(['傷害減免', sgn(t.dr)]);
        if (t.hitA) out.push(['近距離命中', sgn(t.hitA)]);
        if (t.dmgA) out.push(['近距離傷害', sgn(t.dmgA)]);
        if (t.bhA) out.push(['遠距離命中', sgn(t.bhA)]);
        if (t.bdA) out.push(['遠距離傷害', sgn(t.bdA)]);
        // 四屬性抗性、異常狀態耐性（gen-data：rs [火, 水, 風, 地]、rg [暈眩, 石化, 睡眠, 寒冰, 支撐, 暗黑]）、負重減輕
        const list = (vals, names) => (vals || []).map((v, i) => v ? names[i] + ' ' + sgn(v) : '').filter(Boolean).join('、');
        if (list(t.rs, ['火', '水', '風', '地'])) out.push(['屬性抗性', list(t.rs, ['火', '水', '風', '地'])]);
        if (list(t.rg, ['暈眩', '石化', '睡眠', '寒冰', '支撐', '暗黑'])) out.push(['耐性', list(t.rg, ['暈眩', '石化', '睡眠', '寒冰', '支撐', '暗黑'])]);
        if (t.wr) out.push(['負重', sgn(t.wr)]);
    }
    // 祝福裝備的加成（伺服器本機改動第 171 項；只有已鑑定的祝福裝備 bless 0）：每件祝福值 +5%；武器命中、傷害各 +1、打惡魔不死 BOSS 再 +3~6；
    //   防具（頭盔、內衣、盔甲、斗篷、手套、長靴、盾牌、臂甲）物理減傷 +1；飾品（耳環、項鍊、戒指、腰帶）魔法減傷 +1
    if (p.bless === 0 && (t.k === 'w' || t.k === 'a')) {
        out.push(['祝福', '+5%']);
        if (t.k === 'w') out.push(['祝福加成', '命中 +1、傷害 +1'], ['對 BOSS', '命中 +5~8、傷害 +4~7' + (/^(bow|singlebow|gauntlet)$/.test(t.type) ? '，硬皮少扣兩成' : '')], ['對惡魔、不死', '傷害 +3~6']);   // 伺服器第 355 項；第 469 項祝福弓、鐵手甲跟近戰一樣 +4~7（硬皮只擋遠程）
        else out.push(['祝福加成', /^(amulet|ring|earring|belt)$/.test(t.type) ? '魔法減傷 +1' : '物理減傷 +1']);
    }
    if (t.k !== 'e') {
        const ST = ['力量', '敏捷', '體質', '智力', '精神', '魅力'];
        (t.add || []).forEach((v, i) => { if (v) out.push([ST[i], sgn(v)]); });
        if (t.hp) out.push(['體力上限', sgn(t.hp)]);
        if (t.mp) out.push(['魔力上限', sgn(t.mp)]);
        if (t.hpr) out.push(['體力恢復', sgn(t.hpr)]);
        if (t.mpr || t.mprEn) out.push(['魔力恢復', sgn(mprOf(t, p.en)) + (t.mprEn ? '（每強化 +' + t.mprEn + '）' : '')]);
        if (t.sp) out.push(['魔攻', sgn(t.sp)]);
        if (t.mr) out.push(['魔防', sgn(t.mr)]);
        if (t.hs) out.push(['加速效果', '有']);
        out.push(enchantLine(t));
        const CL = [[1, '王族'], [2, '騎士'], [4, '妖精'], [8, '法師'], [16, '黑暗妖精']];
        out.push(['可用職業', t.cls === 31 ? '全職業' : CL.filter(c => t.cls & c[0]).map(c => c[1]).join('、') || '無']);
    }
    if (t.minLv) out.push(['等級限制', t.minLv + (t.maxLv ? '～' + t.maxLv : '') + ' 級']);
    out.push(...setLines(t));   // 第 371 項
    // 隨機寶箱（boxLines）：道具表那列的「用途」（任務道具…）換成打開會得到什麼；商人收購照列、排最前面，其他（不會用掉、可開幾次）排在內容後面
    //   iid：真正的道具編號（背包照 TPL_OF、製作／商店照 infoItem 的 iid）；同一個名字碼好幾種道具時，說明表（ITEM_NOTE）照它查
    const iid = p.iid || (p.it && TPL_OF.get(p.id)) || t.id, bx = boxLines(iid), ul = useLines(t, iid);
    out.push(...(bx.length ? ul.filter(l => l[0] === '商人收購').concat(bx, ul.filter(l => l[0] !== '商人收購' && l[0] !== '用途' && l[0] !== '取得' && l[0] !== '')) : ul));
    if (t.w) out.push(['重量', String(+(t.w / 1000).toFixed(2))]);   // L1ItemInstance.getWeight：數量 × weight ÷ 1000
    if (BOUND.has(p.id)) out.push(['試煉贈品', '不能交易、存倉、上架']);   // 第 145 項
    return out;
}
// 第 413 項（站長 2026-10-28「點選魔眼時可以看到功能」）：魔眼的效果，照伺服器實際有作用的寫（同 effects.js 4049～4055 的狀態說明）。
//   伺服器 item/action/Effect.useEffect＋L1SkillTimer：10 分鐘（time 600）、不消耗（deteleItem false）、七種互斥（deleteRepeatedSkills）；
//   冷卻＝道具表 etcitem.delay_effect 3600 秒（C_ItemUSe 再使用檢查，記在那顆道具上）。
//   程式裡只有註解、沒有實作的（魔法傷害減免、魔法暴擊、防護中毒）不寫。精緻魔眼 47041～47046 這個伺服器拿不到，不列
const EYE_DODGE = '較難被打中（敵方命中 -1）';   // addDodge(1)：L1Attack attackerDice −= dodge
const MAGIC_EYE = {
    47017: '石化耐性 +3、' + EYE_DODGE,   // 地龍之魔眼
    47018: '寒冰耐性 +3',                 // 水龍之魔眼
    47019: '睡眠耐性 +3',                 // 風龍之魔眼
    47020: '暈眩耐性 +3、近戰傷害 +2',    // 火龍之魔眼
    47021: '暗黑耐性 +3、' + EYE_DODGE,   // 誕生之魔眼
    47022: '支撐耐性 +3、' + EYE_DODGE,   // 形象之魔眼
    47023: '近戰傷害 +2、' + EYE_DODGE,   // 生命之魔眼
};
// ── 道具說明表（站長 2026-10-30 製作工匠一個一個點「增加說明」→「製作工匠如果沒說明的說明一下，或是取得方式，或是使用方式，像勝利果實那樣」）──
//   道具編號 → 說明列 [[標題, 內容]…]，照伺服器實際作用寫（數值出處寫在每列後面）。標題「用途」＝主要用途（有了就不再自動補「○○的材料」）；
//   「效果」＝使用的效果（藥水、卷軸），是材料的話底下照樣補「做○○的材料」「取得」。隨機寶箱打開得到什麼另外由 boxLines 列（這裡只寫會不會用掉、可開幾次）
//   沒在表裡的自動補：魔法書（bookLines：學會哪個魔法、哪些職業幾級）、狩獵場傳送要帶的（needLines）、施法會用掉的（castLine）、製作材料（matTxt＋srcRows）
const ITEM_NOTE = {
    // 回憶蠟燭：道具表是 use none，伺服器第 113 項起在村莊用＝重新分配能力值（candle.js）
    49142: [['用途', '在村莊使用，重新分配能力值']],
    // 旅館鑰匙：道具表是 use none，伺服器第 138 項起「使用」＝進房間、在房間裡用＝回旅館門口（web/WebInn；補二起哪裡都能用）
    40312: [['用途', '使用＝直接進租的房間，進去就用掉；戰鬥中不能用，4 小時內沒用就作廢']],
    [HOME_STONE]: [['用途', '使用＝回到奇岩村莊，用了不會消失；戰鬥中也能用']],
    49922: [['用途', '使用＝正義值 +3000（最多 32767）']],   // 第 248 項贖罪聖書
    49920: [['用途', '使用＝召集線上盟友到身邊；畫面上有其他人不能用']],   // 第 237 項穿雲箭
    49921: [['用途', '使用＝召集線上隊友到身邊；畫面上有其他人不能用']],
    49908: [['用途', '對一般的裝備使用，變成祝福的機率：武器 5%、防具和飾品 10%；失敗只消耗卷軸']],   // 第 355 項   // 伺服器第 172 項 WebBless.blessScroll
    // 伺服器第 482 項（WebPetFruit；站長 2026-10-30「增加說明」）：背包點使用 → 選寵物；條件照 C_GiveItem／pettypes
    40070: [['用途', 'Lv30 以上的一般寵物吃了，進化成高等寵物'], ['怎麼用', '背包點「使用」，選要給哪隻寵物吃'], ['進化後', '等級回到 1，血、魔減半']],   // 進化果實
    41310: [['用途', '高等寵物吃了，進化成黃金龍'], ['怎麼用', '背包點「使用」，選要給哪隻寵物吃'], ['進化後', '等級回到 1，血、魔減半']],   // 勝利果實
    41337: [['效果', '回復 85 HP（比終極治癒藥水多）']],   // 受祝福的五穀麵包：C_ItemUSe UseHeallingPotion 85
    // 推廣幣兌換、簽到、邀請送的（站長 2026-11-08「點道具要說明」；數值照 item/action/Effect、C_ItemUSe）
    47009: [['效果', '1 小時：近戰、遠攻命中 +3、傷害 +3，魔攻 +3']],   // 強化戰鬥卷軸 3600 秒
    47007: [['效果', '1 小時：最大 HP +50、回血 +4']],   // 體力增強卷軸 3600 秒
    47008: [['效果', '1 小時：最大 MP +40、回魔 +4']],   // 魔力增強卷軸 3600 秒
    47005: [['效果', '40 分鐘：命中 +3、傷害 +3、回魔 +2'], ['注意', '跟妖精的屬性魔法不能同時有']],   // 媽祖祝福平安符 2400 秒，deleteRepeatedSkills 妖精屬性魔法
    49138: [['效果', '10 分鐘三段加速：攻擊、移動都比勇敢藥水、精靈餅乾更快，每個職業都有效']],   // 巧克力蛋糕 Potion.ThirdSpeed 600 秒
    49935: [['效果', '變身 52 級死亡騎士 15 分鐘，同起司蛋糕'], ['注意', '不能交易']],   // 第 732 項：推廣幣兌換的起司蛋糕(推廣)（伺服器當 49139 用）
    49932: [['用途', '對防具使用，同受祝福的對盔甲施法的卷軸'], ['注意', '不能交易']],   // 簽到、推廣幣兌換專用
    41338: [['效果', '加速 30 分鐘（同強化綠色藥水）']],   // 受祝福的葡萄酒：Potion 加速 1800 秒
    // 藥水（C_ItemUSe → item/action/Potion）：補血 UseHeallingPotion（量 ×（1 ± 常態亂數 ÷ 5），寫基準值）、補魔 UseMpPotion、
    //   加速 useGreenPotion、勇敢／精靈餅乾 Brave（職業不對：訊息 79「沒有任何事情發生」，藥水照扣）、慎重 useWisdomPotion、水中呼吸 useBlessOfEva
    40010: [['效果', '回復 15 HP']],   // 治癒藥水
    40011: [['效果', '回復 45 HP']],   // 強力治癒藥水
    40012: [['效果', '回復 75 HP']],   // 終極治癒藥水
    40013: [['效果', '加速 5 分鐘']],   // 自我加速藥水 300 秒
    40018: [['效果', '加速 30 分鐘']],   // 強化 綠色藥水 1800 秒
    40014: [['效果', '騎士喝了攻擊、移動速度變快，5 分鐘'], ['注意', '不是騎士喝了沒效果，藥水照樣用掉']],   // 勇敢藥水 300 秒，只有騎士
    40068: [['效果', '妖精吃了攻擊、移動速度變快一些，8 分鐘'], ['注意', '不是妖精吃了沒效果，餅乾照樣用掉']],   // 精靈餅乾 480 秒（×1.15），只有妖精
    40016: [['效果', '法師喝了魔攻 +2，5 分鐘'], ['注意', '不是法師喝了沒效果，藥水照樣用掉']],   // 慎重藥水 300 秒 addSp(2)，只有法師
    40041: [['效果', '在水裡不會窒息，5 分鐘（再用時間累加，最多 2 小時）']],   // 人魚之鱗 300 秒、上限 7200
    40042: [['效果', '回復 50 MP']],   // 精神藥水 UseMpPotion(50, 0)＝固定 50
    40507: [['效果', '使用＝解毒']],   // 安特之樹枝：同翡翠藥水 curePoison
    40521: [['效果', '使用＝回村莊（同傳送回家的卷軸）']],   // 精靈羽翼：同 40079 Getback
    // 指定傳送卷軸（C_ItemUSe 最後那段：etcitem 的 locx／locy／mapid，用掉 1 張；不能傳送的地方不能用）
    40118: [['效果', '使用＝傳送到隱遁者村莊']],
    40120: [['效果', '使用＝傳送到抵抗軍村莊']],
    // 打開不會用掉的隨機寶箱（C_ItemUSe treasure_box：delay_effect 86400 秒、不能疊 → 不扣，24 小時後才能再開）；多魯嘉之袋另外有 30 次（L1TreasureBox 扣 chargeCount，用完消失）
    40330: [['重複使用', '不會用掉，24 小時後可以再開']],   // 無限箭筒
    40414: [['重複使用', '不會用掉，24 小時後可以再開']],   // 練金術之石
    40416: [['重複使用', '不會用掉，24 小時後可以再開']],   // 詛咒之血
    46000: [['次數', '可以開 30 次，每次要隔 24 小時']],   // 多魯嘉之袋
    // 魔族的卷軸：TreasureBox.xml SPECIFIC＝固定給靈魂之球，L1TreasureBox.open 打開後 pc.death（同黑暗安特的水果）；古魯丁地監 6 樓「束縛的靈魂」10 萬賣
    49013: [['用途', '打開得到靈魂之球'], ['注意', '打開時角色會死']],
    49014: [['取得', '打開魔族的卷軸（古魯丁地監 6 樓的束縛的靈魂賣，打開會死）']],   // 靈魂之球：沒有怪掉
    // 三～五級黑魔石：沒有怪掉、商店不賣，只有黑暗妖精的「提煉魔石」（L1SkillUse BRING_STONE：對下一級的用，會失敗）
    40322: [['取得', '黑暗妖精對二級黑魔石放「提煉魔石」（會失敗）']],
    40323: [['取得', '黑暗妖精對三級黑魔石放「提煉魔石」（會失敗）']],
    40324: [['取得', '黑暗妖精對四級黑魔石放「提煉魔石」（會失敗）']],
};
// 傲慢之塔移動卷軸(21F)～(91F)：40105～40112（地圖 121、131…191）
// 傲慢之塔移動卷軸：站長 2026-10-30「奧卷這也不用介紹」（名字就寫了去幾樓）→ 不寫說明
// 祝福藥水 49904～49907（伺服器第 171 項（WebBless）；第 416 項站長要說明作用）
for (let id = 49904; id <= 49907; id++) ITEM_NOTE[id] = [['用途', '祝福值 +' + (id - 49903) * 10 + '，30 分鐘；喝新的會取代舊的'], ['減傷', '被惡魔、不死打到時，有「祝福值」% 機率這下傷害減少 25%（最高 60%，頭目減半）；身上要穿至少 1 件祝福裝備才有效'], ['魔法閃避', '穿 6 件以上祝福裝備、祝福值 30 以上：牠們放的魔法有「祝福值 ÷ 5」% 機率閃掉（最高 15%，頭目減半）'], ['祝福值', '每穿 1 件祝福裝備 +5，加上藥水，最高 100']];
// 第 413 項魔眼；受封印的地／水／風／火龍之魔眼 47013～47016 → 解開後是 47017～47020
for (const id in MAGIC_EYE) ITEM_NOTE[id] = [['效果', MAGIC_EYE[id]], ['持續', '10 分鐘'], ['冷卻', '1 小時，道具不會用掉'], ['重複使用', '同時只有一種魔眼有效，用新的會換掉舊的']];
for (let id = 47013; id <= 47016; id++) ITEM_NOTE[id] = [['用途', '解開封印才能使用'], ['解開後效果', MAGIC_EYE[id + 4]]];
// 第 567 項（站長 2026-11-02 南瓜系統第一階段；伺服器 db/web/pumpkin-567.sql、Effect.useEffectItem、Potion.useWisdomCoin／UseMpPotion）
//   南瓜魔眼：EFFECT_PUMPKIN_EYE 4058，600 秒、不消耗、冷卻＝道具表 delay_effect 3600（同龍之魔眼），不在龍之魔眼那組互斥裡
ITEM_NOTE[49924] = [['效果', '最大 HP +100、最大 MP +50、近戰命中 +3、遠程命中 +3'], /* 第 618 項（站長 2026-11-03）：原本 +60／+30 */ ['持續', '10 分鐘'], ['冷卻', '1 小時，道具不會用掉'], ['重複使用', '可以和龍之魔眼同時有效']];
//   南瓜種子：第 596 項種植（伺服器 web/WebPumpkin）；文字照站長定案的提案「道具說明文字」。第 606 項（2026-11-03）：水量減半（WebPumpkin.DRINK_PER_HOUR 937.5）、種子改主城萬物百貨商賣（4h 10,000、8h 20,000）、南瓜怪取消
//   第 637 項（站長 2026-11-03「澆水量都 ×2」「種子 4h 30,000、8h 60,000」）：水量改回 7,500／15,000（DRINK_PER_HOUR 1875）
for (const [id, h, w, n] of [[49925, 4, '7,500', 6], [49926, 8, '15,000', 15]])
    ITEM_NOTE[id] = [['用法', '點一下再點地面就種下，只能種在大陸野外（村莊、城堡附近不行）'], ['澆水', '點南瓜澆治癒藥水：紅 10、澄 40、白 100，共 ' + w + '；水夠就 ' + h + ' 小時成熟'],
        ['採收', '點成熟的南瓜採收，得 ' + n + ' 個南瓜箱子；別人可以偷採一次'], ['限制', '每人同時最多 3 棵']];
//   南瓜箱子：內容由 boxLines（GRID_BOXES）畫掉寶式格子；南瓜結晶石：「用途」由 matTxt 自動補「做古代神秘戒指、南瓜魔眼的材料」（npcmake.json 飾品工匠的配方）。
//   「取得」照 useLines 的規則不顯示（站長 2026-10-31），留著是讓它不落到「沒有用途」
ITEM_NOTE[49927] = [['取得', '種南瓜採收']];
// 站長 2026-11-03「南瓜結晶的說明要有取得方式」：「取得」這個標題照規則不顯示，改用「來源」才列得出來；用途自己寫（不然 matTxt 會自動補一句）
ITEM_NOTE[49928] = [['用途', '做古代神秘戒指、南瓜魔眼的材料（飾品工匠）'], ['來源', '開南瓜箱子，10.6% 開到一顆；箱子是種南瓜採收來的（種子在萬物百貨商買）']];
//   智慧貨幣：STATUS_WISDOM_COIN 1028，MpRegeneration +4、600 秒，跟藍色藥水（1002）互相蓋掉；南瓜糖果：C_ItemUSe → UseMpPotion 5～12
ITEM_NOTE[40736] = [['效果', '魔力回復 +4，10 分鐘'], ['注意', '和藍色藥水只能有一個，後喝的蓋掉先喝的']];
ITEM_NOTE[40725] = [['效果', '回復 5～12 MP']];
// 航海日誌（站長 2026-11-05「這個說明怎麼使用」；伺服器 C_ItemUSe：膠水 41036 對 41038～41047 成功率 CreateChanceDiary 67%、失敗頁和膠水都消失；
//   塗膠水的頁 41048～41057 對「編號 = 頁 + 8034」的日誌才有用，日誌 +2；第 677 項：49082 缺單數頁、49083 缺雙數頁，下一頁 = 編號 − 49081）
ITEM_NOTE[41036] = [['用途', '塗在航海日誌的頁上'], ['怎麼用', '點膠水「使用」，再選要塗的那一頁'], ['成功率', '67%，失敗時那一頁和膠水都會不見']];
for (let id = 41038; id <= 41047; id++) ITEM_NOTE[id] = [['用途', '塗上膠水後補進不完整的航海日誌'], ['怎麼用', '點膠水「使用」，再選這一頁']];
for (let id = 41048; id <= 41057; id++) ITEM_NOTE[id] = [['用途', '補進不完整的航海日誌'], ['怎麼用', '點這一頁「使用」，再選日誌；要從最小的頁照順序補']];
ITEM_NOTE[49082] = [['用途', '補齊缺的 5 頁，變成完整的航海日誌'], ['要補', '塗著膠水的第 1、3、5、7、9 頁，照順序'], ['怎麼補', '點塗著膠水的第 1 頁「使用」，再選這本日誌']];
ITEM_NOTE[49083] = [['用途', '補齊缺的 5 頁，變成完整的航海日誌'], ['要補', '塗著膠水的第 2、4、6、8、10 頁，照順序'], ['怎麼補', '點塗著膠水的第 2 頁「使用」，再選這本日誌']];
for (let id = 49084; id <= 49091; id++) ITEM_NOTE[id] = [['用途', '補齊缺的頁，變成完整的航海日誌'], ['下一頁', '塗著膠水的第 ' + (id - 49081) + ' 頁'], ['怎麼補', '點那一頁「使用」，再選這本日誌']];
ITEM_NOTE[41058] = [['用途', '到製作工匠換航海士的袋子（搜尋「航海士」）']];
// 站長 2026-10-30「狩獵的證明要說明」：兩個圖鑑的材料（伺服器 WebHuntDex、WebToiBook）
ITEM_NOTE[49238] = [['用途', '開通、升級狩獵圖鑑（製作工匠 → 圖鑑）'], ['取得', '一般怪都會掉，怪越高等越容易掉（頭目不掉）'], ['交易', '可以在交易所買賣']];
for (const [id, f] of [[49919, 1], ...Array.from({ length: 9 }, (_, i) => [49910 + i, 11 + i * 10])])
    ITEM_NOTE[id] = [['用途', '開通、升級傲慢之塔圖鑑 ' + f + 'F 那一段（製作工匠 → 圖鑑）'], ['取得', '傲慢之塔 ' + f + '～' + (f + 9) + ' 樓的怪'], ['交易', '可以在交易所買賣']];

// ── 自動補的說明要的資料（gen-data 產的，網頁組）：開網頁 3 秒後才抓（drops.json 比較大，不跟進遊戲搶頻寬）；還沒到＝這幾列先不列 ──
//   drops.json 怪物掉落（boss＝頭目，gen-data 2026-10-30 起才有）、mapnames.json 地圖名、teleports.json 狩獵場（大陸的地區名、要帶傳送符的）、
//   shopitems.json 一般商店有賣的、skills.json＋skill-learn.json 魔法書學會什麼、哪些職業幾級
let SRCD = null;
export const srcReady = new Promise(res => setTimeout(res, 3000))
    .then(() => Promise.all(['drops', 'mapnames', 'teleports', 'shopitems', 'skills', 'skill-learn'].map(n => fetch('/data/' + n + '.json').then(r => r.ok ? r.json() : null).catch(() => null))))
    .then(([drops, mapnames, tps, shop, skills, learn]) => { SRCD = { drops, mapnames: mapnames || {}, tps: tps || [], shop: new Set(shop || []), skills: skills || [], learn: learn || {} }; });
// 關閉的地圖（同伺服器 web/WebClosedMap：魔族拋棄之地 777～779、底比斯／提卡爾 780～784、歌唱之島 8011～8015、第 481 項 68／69／2005／85～87；
//   站長 2026-10-30 再關暗影神殿 521～524、慾望洞穴 600～603（含炎魔謁見所、炎魔房間）、火焰之影實驗室 608）：那裡的怪不算「取得」來源。伺服器關了新的地圖這裡要跟著加
const CLOSED_MAP = m => (m >= 777 && m <= 784) || (m >= 8011 && m <= 8015) || m === 68 || m === 69 || m === 2005 || (m >= 85 && m <= 87) ||
    (m >= 521 && m <= 524) || (m >= 600 && m <= 603) || m === 608;
const MAINLAND = 4;
// 掉寶機率的寫法同掉寶視窗（hud.js fmtRate）
const fmtRate = r => r >= 100 ? '100%' : r >= 1 ? (Math.round(r * 10) / 10) + '%' : parseFloat(r.toPrecision(2)) + '%';
// 名字碼 → 會掉它的怪 [{ n 名字, r 機率（0～1，取掉寶倍率最高的那張圖）, maps 地圖, xy 大陸上的出生點 }]；只算有出生點、地圖開著、掉寶倍率 > 0 的
let DROP_IX = null;
function dropIx() {
    if (DROP_IX || !SRCD || !SRCD.drops) return DROP_IX;
    const D = SRCD.drops, mr = m => D.mapRate && D.mapRate[m] != null ? +D.mapRate[m] : 1, open = m => !CLOSED_MAP(m) && mr(m) > 0;
    const recs = [], at = new Map();
    for (const m in D.maps) if (open(+m)) for (const id of D.maps[m]) {
        if (!at.has(id)) { const o = D.mobs[id]; if (!o) continue; at.set(id, { n: o.n, d: o.d || [], maps: new Set(), xy: [] }); recs.push(at.get(id)); }
        at.get(id).maps.add(+m);
    }
    const P = (D.pts || {})[MAINLAND] || [];
    for (let i = 0; i + 2 < P.length; i += 3) { const c = at.get(P[i]); if (c) c.xy.push([P[i + 1], P[i + 2]]); }
    for (const id in D.boss || {}) {
        const b = D.boss[id], c = { n: b.n, d: b.d || [], maps: new Set(), xy: [] };
        for (const [m, x, y] of b.m || []) if (open(m)) { c.maps.add(m); if (m === MAINLAND) c.xy.push([x, y]); }
        if (c.maps.size) recs.push(c);
    }
    DROP_IX = new Map();
    for (const c of recs) {
        const best = Math.max(...[...c.maps].map(mr));
        for (const x of c.d) { const r = x[1] * best; if (!(r > 0)) continue; if (!DROP_IX.has(x[0])) DROP_IX.set(x[0], []); DROP_IX.get(x[0]).push({ n: c.n, r, maps: c.maps, xy: c.xy }); }
    }
    return DROP_IX;
}
// 大陸（一整張圖）寫地區：出生點離哪個狩獵場傳送點最近（200 格內，同 main.js TP_NEAR_R），取最多點的那個
function landArea(xy) {
    const tps = SRCD.tps.filter(t => t.map === MAINLAND), cnt = new Map();
    for (const [x, y] of xy) {
        let best = null, bd = 201;
        for (const t of tps) { const d = Math.max(Math.abs(t.x - x), Math.abs(t.y - y)); if (d < bd) { bd = d; best = t; } }
        if (best) cnt.set(best.name, (cnt.get(best.name) || 0) + 1);
    }
    return [...cnt].sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || '';
}
// 地圖寫法：同一個地方好幾層合成一段（傲慢之塔 21樓～30樓 → 傲慢之塔 21～30樓），最多寫兩處，再多寫「等」
function placeTxt(g) {
    const names = [...g.maps].sort((a, b) => a - b).map(m => m === MAINLAND ? landArea(g.xy) || '大陸' : String(SRCD.mapnames[m] || '地圖 ' + m));
    const grp = new Map();
    for (const s of names) { const m = /^(.*?)\s*(\d+)樓$/.exec(s), k = m ? m[1] : s; if (!grp.has(k)) grp.set(k, []); if (m && !grp.get(k).includes(+m[2])) grp.get(k).push(+m[2]); }
    const out = [...grp].map(([k, fl]) => {
        if (!fl.length) return k;
        fl.sort((a, b) => a - b);
        const runs = []; for (const f of fl) { const r = runs[runs.length - 1]; if (r && f === r[1] + 1) r[1] = f; else runs.push([f, f]); }
        return k + ' ' + runs.map(r => r[0] === r[1] ? r[0] : r[0] + '～' + r[1]).join('、') + '樓';
    });
    return out.slice(0, 2).join('、') + (out.length > 2 ? '等' : '');
}
// 「取得」：最主要的 1～3 個來源（商店 → 製作 → 掉落機率高的怪 → 隨機寶箱）；都沒有＝目前拿不到（drops.json 沒有 boss＝看不出頭目掉不掉，不下結論）。
//   一個來源一列（第一列標「取得」，後面的標題空白）：擠成一列時機率會被折到下一行，看不出是誰的
const npcName = key => displayName(String(key).split('|')[0]);
function srcRows(id, nid) {
    if (!SRCD) return [];
    const out = [];
    if (SRCD.shop.has(id)) out.push('商店有賣');
    const mk = [...new Set(((MAKE_SRC && MAKE_SRC.get(id)) || []).map(npcName))];   // 同名的 NPC（各村莊的煉金術師）算一位
    if (mk.length) out.push('製作：' + mk.slice(0, 2).join('、') + (mk.length > 2 ? '等' : ''));
    const ix = dropIx(), by = new Map();
    for (const s of (ix && ix.get(nid)) || []) {   // 同名的怪（泥龍 97014～97017…）併一筆：機率取高的、地圖合起來
        const g = by.get(s.n);
        if (!g) by.set(s.n, { n: s.n, r: s.r, maps: new Set(s.maps), xy: s.xy.slice() });
        else { g.r = Math.max(g.r, s.r); s.maps.forEach(m => g.maps.add(m)); g.xy.push(...s.xy); }
    }
    for (const g of [...by.values()].sort((a, b) => b.r - a.r).slice(0, Math.max(0, 3 - out.length))) out.push(g.n + '（' + placeTxt(g) + '）' + fmtRate(g.r * 100));
    if (out.length < 3) for (const b in BOXES) if ((BOXES[b] || []).some(x => x[0] === id)) { const x = mkItem(+b); if (x) { out.push('打開' + x.name); break; } }
    if (out.length) return out.map((s, i) => [i ? '' : '取得', s]);
    return SRCD.drops && SRCD.drops.boss ? [['取得', '目前拿不到']] : [];
}
// 製作材料的「用途」：成品 3 種以內寫名字，多的寫種類（做武器、防具、飾品的材料）；製作工匠不列的配方有別的就不算
const KIND_ORDER = ['武器', '防具', '飾品', '藥水', '卷軸', '魔法書', '箭', '料理', '寵物裝備', '魔法娃娃', '袋子', '材料', '道具'];
const ETC_KIND = { potion: '藥水', scroll: '卷軸', spellbook: '魔法書', arrow: '箭', sting: '箭', food: '料理', petitem: '寵物裝備', magic_doll: '魔法娃娃', treasure_box: '袋子', material: '材料', gem: '材料' };
//   成品名字、道具表照 npcmake.json 的 items（同一個名字碼好幾種的也對得到，itemById 只認編號最小的那個）
const mkItem = id => { const x = MK_ITEMS[id]; if (x) return { name: x[0], tpl: tplVar(ITEMS[x[1]] || null, +id) }; const b = itemById(+id); return b ? { name: b.name, tpl: tplVar(b.tpl, +id) } : null; };
function kindOfId(id) {
    const b = mkItem(id), t = b && b.tpl;
    if (!t) return '道具';
    if (t.k === 'w') return '武器';
    if (t.k === 'a') return /^(ring|amulet|earring|belt)$/.test(t.type) ? '飾品' : '防具';
    return t.pet ? '寵物裝備' : ETC_KIND[t.type] || '道具';
}
function matTxt(uses) {
    const vis = uses.filter(u => !u.h), list = vis.length ? vis : uses;
    const names = [...new Set(list.map(u => (mkItem(u.o) || {}).name).filter(Boolean))];
    if (names.length && names.length <= 3) return '做' + names.join('、') + '的材料';
    const ks = [...new Set(list.map(u => kindOfId(u.o)))].sort((a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b)), named = ks.filter(k => k !== '道具' && k !== '材料');
    if (!named.length) return '做' + names.slice(0, 2).join('、') + '等的材料';   // 成品都是材料、雜項（安塔瑞斯之心 → 安塔瑞斯的魅惑…）：寫兩個名字
    return '做' + named.join('、') + (named.length < ks.length ? '等' : '') + '的材料';
}
// 魔法書：括號裡的名字對技能表（同 hud.js bookSkill）；哪些職業幾級照 skill-learn.json（同魔法視窗的「能學／不能學」）；妖精屬性魔法（17 級以上、地火水風）限那個屬性
const CLS_ZH = [['royal', '王族'], ['knight', '騎士'], ['elf', '妖精'], ['wizard', '法師'], ['darkelf', '黑暗妖精']];
const ELEM = { 1: '地', 2: '火', 4: '水', 8: '風' };
function bookLines(t, id) {
    if (!SRCD || t.type !== 'spellbook') return [];
    const b = mkItem(id) || itemById(t.id), m = /[(（]([^()（）]+)[)）]\s*$/.exec((b && b.name) || '');
    const sk = m ? SRCD.skills.find(x => x.name === m[1].trim()) : null;
    if (!sk) return [];
    const who = [];
    for (const [k, zh] of CLS_ZH) {
        const c = SRCD.learn[k]; if (!c) continue;
        const exc = c.exceptions || {}, lv = Object.prototype.hasOwnProperty.call(exc, sk.sid) ? exc[sk.sid] : (c.levels || {})[sk.lv];
        if (lv != null) who.push(zh + ' Lv' + lv + (k === 'elf' && sk.lv >= 17 && ELEM[sk.attr] ? '（限' + ELEM[sk.attr] + '屬性）' : ''));
    }
    const out = [['用途', '學會魔法「' + sk.name + '」'], ['可學', who.length ? who.join('、') + ' 以上' : '沒有職業能學']];
    if (sk.effect) out.push(['魔法效果', sk.effect]);
    return out;
}
// 狩獵場要帶在身上才能傳的（teleports.json need，伺服器第 180 項：傲慢之塔傳送符），不會用掉
function needLines(id) {
    const tp = SRCD ? SRCD.tps.filter(t => +t.need === id) : [];
    // 站長 2026-10-31「獲得此物品，免費傳送」：伺服器第 512 項起有傳送符＝狩獵場傳送不收錢
    //   2026-11-14「傳送符會用掉，支配符永久免費傳送該樓層」
    if (tp.length) return [['用途', '狩獵場傳送到' + tp.map(t => '「' + t.name + '」').join('、') + '時用掉 1 張（不收金幣）；有同一層的支配符就不會用掉']];
    const dom = SRCD && id >= 49950 && id <= 49958 ? SRCD.tps.filter(t => +t.need === 40289 + (id - 49950)) : [];
    return dom.length ? [['用途', '帶在身上，狩獵場可以永久免費傳送到' + dom.map(t => '「' + t.name + '」').join('、') + '；不會用掉']] : [];
}
// 放魔法要用掉的（skills.json item：魔法寶石、精靈玉…）
function castLine(id) {
    const sk = SRCD ? [...new Set(SRCD.skills.filter(s => s.item === id).map(s => s.name))] : [];
    return sk.length ? [['施法消耗', '放' + sk.slice(0, 2).map(n => '「' + n + '」').join('') + (sk.length > 2 ? '等魔法' : '') + '時用掉']] : [];
}
// 道具用途那幾列（見上面 useReady）：商人收購、說明表、自動補的。id＝真正的道具編號（同一個名字碼好幾種道具時用；沒有＝道具表那列的）
function useLines(t, id = t.id) {
    const out = [];
    if (!MAKE_USE || t.id == null || t.id === GOLD_ID) return out;
    // 站長 2026-10-26「可以做成，到那裡做移除顯示」「哪裡做得出來也是」：製作相關三列（可以做成、到哪裡做、哪裡做得出來）都不列；
    //   2026-10-30「沒說明的說明一下，或是取得方式」：沒有別的說明的材料改成一列「做○○的材料」＋一列「取得」
    const uses = MAKE_USE.get(id) || MAKE_USE.get(t.id) || [];   // 能做成東西的材料：底下「沒有用途」要排除它
    const price = +SELL[t.id] || 0;
    if (price > 0) out.push(['商人收購', price.toLocaleString() + ' 金幣']);
    // 說明表寫了「取得」＝資料看不出來的來源（技能做出來的、固定內容的寶箱…）。站長 2026-10-31「取得顯示拿掉」：「取得」一律不顯示（說明表的、自動找的都不列）
    const note = ITEM_NOTE[id] || ITEM_NOTE[t.id] || [], src = note.filter(l => l[0] === '取得');
    let own = note.filter(l => l[0] !== '取得');
    if (!note.length) own = bookLines(t, id);
    if (!note.length && !own.length) own = needLines(id);
    out.push(...own);
    const cast = castLine(id);
    out.push(...cast);
    if (own.some(l => l[0] === '用途')) return out;
    // 站長 2026-10-30「空的魔法卷軸這種一般道具，說明整個拿掉」：一般商店買得到的不補（SRCD 還沒到＝還不知道商店有沒有賣，先不補）
    //   同日「這個寶石也不用，比較一般的就不用說明了」：20 種以上的怪會掉的（寶石、四大神之石、米索莉…）也算一般道具
    const mobsOf = nid => { const ix = dropIx(); return new Set(((ix && ix.get(nid)) || []).map(x => x.n)).size; };
    //   同日「奧卷這也不用介紹」：卷軸是拿來用的，當材料、哪裡掉都不補
    const plain = !SRCD || t.type === 'scroll' || SRCD.shop.has(id) || SRCD.shop.has(t.id) || mobsOf((MK_ITEMS[id] || [])[1] || (itemById(t.id) || {}).nid) >= 20;
    if (uses.length && t.k === 'e' && !t.pet && !(t.ds || t.dl)) {   // 武器、防具、寵物裝備、箭本來就有一串能力值，不補（站長 2026-10-26 拿掉「可以做成」那時的範圍）
        if (!plain) {   // 商店有賣的：什麼都不補（也不落到下面的「沒有用途」）
            out.push(['用途', matTxt(uses)]);
        }
    }
    else if (!own.length && !src.length && !cast.length && t.k === 'e' && t.use === 'none' && (t.type === 'material' || t.type === 'other')) out.push(['用途', price > 0 ? '沒有用途，可以賣掉' : '沒有用途']);
    // 任務道具：NPC 對話換東西的任務（例如受詛咒的黑色耳環）不在製作配方表裡，看不出有沒有用 → 只寫是任務道具，不寫「沒有用途」
    else if (!own.length && !src.length && t.k === 'e' && t.type === 'questitem') out.push(['用途', '任務道具']);
    return out;
}
