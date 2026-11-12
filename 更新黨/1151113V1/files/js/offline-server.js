
// 3.50C 原版公式與輔助運算
function strDmg(str) {
    if (str <= 8) return -2;
    if (str <= 10) return -1;
    if (str <= 12) return 0;
    if (str <= 14) return 1;
    if (str <= 16) return 2;
    if (str <= 18) return 3;
    if (str <= 20) return 4;
    if (str <= 22) return 5;
    if (str <= 25) return 6;
    if (str <= 29) return 7;
    if (str <= 32) return 8;
    if (str <= 35) return 9;
    return 9 + Math.floor((str - 35) / 2);
}
function strHit(str) {
    if (str <= 8) return -2;
    if (str <= 10) return -1;
    if (str <= 12) return 0;
    if (str <= 15) return 1;
    if (str <= 18) return 2;
    if (str <= 22) return 3;
    if (str <= 26) return 4;
    if (str <= 30) return 5;
    return 5 + Math.floor((str - 30) / 3);
}
function dexDmg(dex) {
    if (dex <= 14) return 0;
    if (dex <= 16) return 1;
    if (dex <= 18) return 2;
    if (dex <= 21) return 3;
    if (dex <= 24) return 4;
    if (dex <= 27) return 5;
    return 5 + Math.floor((dex - 27) / 2);
}
function dexHit(dex) {
    if (dex <= 8) return -1;
    if (dex <= 11) return 0;
    if (dex <= 14) return 1;
    if (dex <= 17) return 2;
    if (dex <= 20) return 3;
    if (dex <= 23) return 4;
    if (dex <= 26) return 5;
    return 5 + Math.floor((dex - 26) / 2);
}
function isUndeadWeapon(name) {
    if (!name) return false;
    return /銀|米索莉|奧里哈魯根|底比斯|祝福|海賊/.test(name);
}
// 強化超過安定值另外給的能力（照網頁 items.js overSafeLines 的表）：「過幾」＝強化值 − 安定值；安定值 0 的 +1、+2 只有小加成，+3 起才算過 1。飾品沒有
const OS_W_DMG = [0, 1, 1, 2, 3, 4, 5], OS_W_HIT = [0, 0, 1, 2, 3, 4, 5];
const OS_A = [[0, 0, 0, 0], [10, 0, 0, 0], [15, 5, 0, 0], [20, 10, 1, 0], [30, 15, 1, 1], [40, 20, 1, 2]];   // HP、MP、傷害減免、抗魔
function overSafe(t, en) {
    const none = { hit: 0, dmg: 0, hp: 0, mp: 0, dr: 0, mr: 0 };
    if (!t || t.safe == null || t.safe < 0 || !(en > 0)) return none;
    if (t.k !== 'w' && t.k !== 'a') return none;
    if (t.k === 'a' && /^(amulet|ring|earring|belt)$/.test(t.type)) return none;
    const small = t.safe === 0 && en <= 2, over = t.safe === 0 ? en - 2 : en - t.safe;
    if (!small && over <= 0) return none;
    if (t.k === 'w') {
        if (small) return Object.assign(none, { dmg: 1 });
        const dmg = over < OS_W_DMG.length ? OS_W_DMG[over] : OS_W_DMG[OS_W_DMG.length - 1] + over - OS_W_DMG.length + 1;
        return Object.assign(none, { dmg, hit: OS_W_HIT[Math.min(over, OS_W_HIT.length - 1)] });
    }
    if (small) return Object.assign(none, { hp: en === 1 ? 5 : 8 });
    const [hp, mp, dr, mr] = OS_A[Math.min(over, OS_A.length - 1)];
    return Object.assign(none, { hp, mp, dr, mr });
}
function findDropItemTpl(nid, itemsData) {
    if (!nid) return null;
    if (itemsData[nid]) return itemsData[nid];
    const s = String(nid).trim();
    if (itemsData[s]) return itemsData[s];
    const parts = s.split(/\s+/);
    for (let i = parts.length - 1; i >= 0; i--) {
        if (itemsData[parts[i]]) return itemsData[parts[i]];
    }
    return null;
}

// 網頁奇岩城（Lineage 3.5C）本機離線伺服器模擬器
// 攔截 L1Connection 的所有客戶端請求並即時回傳事件，無須外部 Java / L1J 伺服器即可 100% 離線遊玩。
import { ready as lookReady, displayName, addMobNames } from './look.js';
import { itemsReady, useReady, itemById, TPL_OF } from './items.js';
import { DX, DY } from './opcodes.js';
import { CRAFTERS } from './craft.js';
import { autoMixin, HEAL_POTS, PET_COLLAR, PET_FLUTE } from './offline-auto.js';

const SAVE_KEY = 'webl1_offline_save_v1';
const GOLD_ID = 40308;
const HOME_STONE = 49900;
const BS_PRICE = 10000;          // 魔法商人一組增益的價錢
const SKILL_CLS = ['royal', 'knight', 'elf', 'wizard', 'darkelf'];   // 職業 → data/skill-learn.json 的鍵
const ELF_ATTR_NAME = { 1: '地', 2: '火', 4: '水', 8: '風' };
const ELF_RESET_PRICE = 100000;  // 艾利溫去除精靈力的價錢
const PET_KEEP_PRICE = 1000;     // 寵物保管員領出一次
const INN_PRICE = 10000;         // 旅館鑰匙（同 npc.js INN_PRICE）
const INN_KEY = 40312;           // 旅館鑰匙
const INN_HOURS = 4;             // 鑰匙能用幾小時（到期跟旅館老闆說話或使用鑰匙時收回、退房）
const GROUND_GFX = 65000;        // 地上的道具：沒有地面外型資料，用不存在的外型（只畫名字）

// 職業初始設定：0 王族、1 騎士、2 妖精、3 法師、4 黑暗妖精
const CLASS_INIT = {
    0: { name: '王族', gfx: [0, 1], hp: 14, mp: 3, hpGain: [11, 16], mpGain: [3, 6], ac: 10 },
    1: { name: '騎士', gfx: [61, 48], hp: 16, mp: 1, hpGain: [16, 22], mpGain: [1, 3], ac: 10 },
    2: { name: '妖精', gfx: [138, 37], hp: 15, mp: 4, hpGain: [11, 15], mpGain: [4, 8], ac: 10 },
    3: { name: '法師', gfx: [734, 1186], hp: 12, mp: 8, hpGain: [7, 11], mpGain: [8, 14], ac: 10 },
    4: { name: '黑暗妖精', gfx: [2786, 2796], hp: 12, mp: 3, hpGain: [12, 16], mpGain: [3, 6], ac: 10 },
};

// 經驗值表：跟畫面經驗條同一張（js/hud.js EXP＝連線版 L1J ExpTable；EXP_TABLE[lv]＝到 lv 級要的累積經驗）
//   玩家回報 29 級以後經驗一直 0%：原本離線自己算的表跟畫面那張對不上（數字小很多、29→30 級又突然跳 7 倍）
const ONLINE_EXP = [0, 3, 19, 69, 182, 427, 912, 1810, 3394, 6079, 10486, 16581, 24406, 34261, 46470, 61381, 79366, 100821, 126166, 155845, 190326, 230101, 275686, 327617, 386466, 452817, 527282, 610497, 703122, 805841, 919362, 1044417, 1181762, 1332177, 1496466, 1675457, 1870002, 2080977, 2309282, 2555841, 2821602, 3107538, 3414643, 3743938, 4096467, 4825827, 6334243, 9829506, 19741695, 55806787, 91871879, 127936971, 164002063, 200067155, 236132247, 272197339, 308262431, 344327523, 380392615, 416457707, 452522799, 488587891, 524652983, 560718075, 596783167, 632848259, 668913351, 704978443, 741043535, 777108627, 813173719, 849238811, 885303903, 921368995, 957434087, 993499179, 1029564271, 1065629363, 1101694455, 1137759547, 1173824639, 1209889731, 1245954823, 1282019915, 1318085007, 1354150099, 1390215191, 1426280283, 1462345375, 1498410467, 1534475559, 1570540651, 1606605743, 1642670835, 1678735927, 1714801019, 1750866111, 1786931203, 1822996295, 1859061387];
const EXP_TABLE = [0].concat(ONLINE_EXP.slice(0, 99));
// 舊版離線的經驗表（只用來把舊存檔的經驗換算到新表）
const OLD_EXP_TABLE = [0, 0];
for (let lv = 1; lv <= 99; lv++) {
    if (lv < 5) OLD_EXP_TABLE[lv] = (lv - 1) * 15;
    else if (lv < 10) OLD_EXP_TABLE[lv] = Math.floor(Math.pow(lv, 2.7));
    else if (lv < 30) OLD_EXP_TABLE[lv] = Math.floor(Math.pow(lv, 3.3));
    else if (lv < 50) OLD_EXP_TABLE[lv] = Math.floor(Math.pow(lv, 3.85));
    else OLD_EXP_TABLE[lv] = OLD_EXP_TABLE[lv - 1] + Math.floor(Math.pow(lv, 3.6) * (lv >= 65 ? 2.5 : 1.5));
}
// 舊存檔：等級不動，這一級裡的進度照比例搬到新表（進世界時做一次，ch.expV2 記著）
function migrateExp(ch) {
    if (!ch || ch.expV2) return;
    ch.expV2 = 1;
    const lv = Math.max(1, Math.min(99, ch.level || 1));
    const oa = OLD_EXP_TABLE[lv], ob = lv < 99 ? OLD_EXP_TABLE[lv + 1] : oa;
    const frac = ob > oa ? Math.max(0, Math.min(0.999, ((ch.exp || 0) - oa) / (ob - oa))) : 0;
    const na = EXP_TABLE[lv], nb = lv < 99 ? EXP_TABLE[lv + 1] : na;
    ch.exp = na + Math.floor((nb - na) * frac);
}
export function expForLevel(lv) { return EXP_TABLE[Math.max(1, Math.min(99, lv))] || 0; }
export function levelFromExp(exp) {
    let lv = 1;
    for (let i = 1; i <= 99; i++) {
        if (exp >= EXP_TABLE[i]) lv = i;
        else break;
    }
    return lv;
}

// 武器種類 → 角色動作編號 (S_OwnCharPack / S_CharVisualUpdate)
const WPN_VISUAL = {
    sword: 4, dagger: 46, tohandsword: 50, bow: 20, singlebow: 20,
    spear: 24, singlespear: 24, blunt: 11, tohandblunt: 11,
    staff: 40, tohandstaff: 40, gauntlet: 62, claw: 58, edoryu: 54,
};

// 防具種類 → useType (對應 items.js SLOT_OF_USE)
const ARMOR_USETYPE = {
    armor: 2, T: 18, cloak: 19, glove: 20, boots: 21,
    helm: 22, ring: 23, amulet: 24, shield: 25, guarder: 25, belt: 37, earring: 40,
};

// 道具 use 字串 → useType 編號
const ETC_USETYPE = {
    none: -1, normal: 0, wand: 5, spell_long: 5, ntele: 6, identify: 7, res: 8,
    letter: 12, blank: 13, choice: 14, instrument: 15, sosc: 16, spell_short: 17,
    dai: 26, zel: 27, spell_buff: 30,
};

const jsonGet = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);

export class OfflineServer {
    constructor(conn) {
        this.conn = conn;
        this.ready = false;
        this.data = {
            items: {}, itemsById: new Map(), skills: [], dolls: [], teleports: [],
            drops: { maps: {}, mobs: {}, pts: {}, boss: {} },
            npccards: {}, npcfn: {}, npcmake: { items: {}, npc: {} },
            shopbuy: {}, shopitems: [], shopsell: {}, boxes: {}, polys: [],
            gfxByName: new Map(), names: {}, mobs: {},
        };
        this.state = this.loadSave();
        this.curChar = null;
        this.objs = new Map();
        this.groundItems = new Map();
        this.mapMobs = [];
        this.mapNpcs = [];
        this.autoTargetId = 0;
        this.lastAttackAt = 0;
        this.lastStepAt = 0;
        this.lastAutoTeleAt = 0;
        this.nextObjId = 100000;
        this.gmRates = { exp: 1, drop: 1, gold: 1, godMode: false, oneHit: false };

        this.initPromise = this.initData();
        window.__offlineServer = this;
    }

    emit(evt, arg) {
        if (!this.conn) return;
        this.conn.rxAt = performance.now();
        try {
            this.conn.emit(evt, arg);
        } catch (e) {
            console.error('[OfflineServer] emit error:', evt, e);
        }
    }

    async initData() {
        await Promise.all([lookReady, itemsReady, useReady]);
        const [
            items, skills, dolls, teleports, drops, npccards, npcfn, npcmake,
            shopbuy, shopitems, shopsell, boxes, polys, meta, names, mobs, portals, bosses, npcspawn, npcshop
        ] = await Promise.all([
            jsonGet('/data/items.json'), jsonGet('/data/skills.json'), jsonGet('/data/dolls.json'),
            jsonGet('/data/teleports.json'), jsonGet('/data/drops.json'), jsonGet('/data/npccards.json'),
            jsonGet('/data/npcfn.json'), jsonGet('/data/npcmake.json'), jsonGet('/data/shopbuy.json'),
            jsonGet('/data/shopitems.json'), jsonGet('/data/shopsell.json'), jsonGet('/data/boxes.json'),
            jsonGet('/data/polys.json'), jsonGet('/data/idle-meta.json'), jsonGet('/data/names.json'),
            jsonGet('/data/mobs.json'), jsonGet('/data/portals.json'), jsonGet('/data/bosses.json'),
            jsonGet('/data/npcspawn.json'), jsonGet('/data/npcshop.json'),
        ]);
        // 倍率照登入畫面寫的（rates.json：經驗 10 倍…，連線版同一份）；GM 面板還是可以再改
        const rates = await jsonGet('/rates.json');
        if (rates) {
            if (rates.xp > 0) this.gmRates.exp = +rates.xp;
            if (rates.adena > 0) this.gmRates.gold = +rates.adena;
            if (rates.drop > 0) this.gmRates.drop = +rates.drop;
        }
        // 各職業幾級能學哪些魔法（連線版的規則，畫面魔法視窗也用同一份）
        this.data.skillLearn = (await jsonGet('/data/skill-learn.json')) || {};
        this.data.npcspawn = npcspawn || {};   // 連線版的 NPC 位置（地圖編號 → [名字碼, 外型, x, y]）
        this.data.npcshop = npcshop || {};     // 連線版各商人賣的東西（「名字碼|外型@地圖」或「名字碼|外型」→ [道具編號, 價錢, 一包幾個]）

        this.data.items = items || {};
        for (const [nid, tpl] of Object.entries(this.data.items)) {
            if (tpl && tpl.id != null && !this.data.itemsById.has(tpl.id)) {
                this.data.itemsById.set(tpl.id, { nid, tpl, name: displayName(nid) || nid });
            }
            if (tpl && tpl.v) {
                for (const [vid, vtpl] of Object.entries(tpl.v)) {
                    this.data.itemsById.set(+vid, { nid, tpl: Object.assign({}, tpl, vtpl, { id: +vid }), name: displayName(nid) || nid });
                }
            }
        }
        this.data.skills = skills || [];
        this.data.dolls = dolls || [];
        this.data.teleports = teleports || [];
        this.data.drops = drops || { maps: {}, mobs: {}, pts: {}, boss: {} };
        this.data.npccards = npccards || {};
        this.data.npcfn = npcfn || {};
        this.data.npcmake = npcmake || { items: {}, npc: {} };
        this.data.shopbuy = shopbuy || {};
        this.data.shopitems = shopitems || [];
        this.data.shopsell = shopsell || {};
        this.data.boxes = boxes || {};
        this.addMissingItems();
        this.data.polys = polys || [];
        this.data.names = names || {};
        this.data.mobs = mobs || {};
        this.data.portals = portals || {};
        this.data.bosses = bosses || {};

        // 建立怪物中文名 → 外型編號 (gfx) 對照表
        if (meta && meta.ORIGIN) {
            for (const [k, v] of Object.entries(meta.ORIGIN)) {
                if (k.startsWith('anim/')) {
                    const nm = k.slice(5);
                    for (const act of Object.values(v)) {
                        if (Array.isArray(act) && act.length >= 3 && /^\d+$/.test(String(act[2]))) {
                            this.data.gfxByName.set(nm, +act[2]);
                            break;
                        }
                    }
                }
            }
        }
        for (const p of this.data.polys) {
            if (p && p.c && p.g && !this.data.gfxByName.has(p.c)) {
                this.data.gfxByName.set(p.c, p.g);
            }
        }
        // 把所有 drops.mobs 的中文名字補進 look.js 的 MOBS 表，讓 isMob(a) 永遠回 true
        //   （原本補在這裡自己另外抓的那份 mobs.json 上，look.js 的表沒變 → 點怪不會攻擊）
        if (this.data.drops.mobs) {
            const mobNames = Object.values(this.data.drops.mobs).map(m => m && m.n);
            if (this.data.bosses) for (const list of Object.values(this.data.bosses)) for (const b of (Array.isArray(list) ? list : [])) mobNames.push(b && (b.n || b.name));
            addMobNames(mobNames);
        }

        await this.restoreFromDisk();
        window.addEventListener('pagehide', () => this.flushDisk(true));
        document.addEventListener('visibilitychange', () => { if (document.hidden) this.flushDisk(true); });

        this.ready = true;
        this.startLoops();
        // 模擬連線建立：送出 S_INITPACKET ('init')
        setTimeout(() => this.emit('init'), 60);
    }

    loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.chars)) return parsed;
            }
        } catch (e) {}
        return {
            account: 'offline',
            chars: [],
            warehouse: [],
            nextItemId: 500001,
            signin: { next: 1, signed: 0, lastDay: '' },
        };
    }

    // 瀏覽器裡沒有存檔（清過瀏覽資料、換瀏覽器、埠號被占用改用別的埠）或比較舊：改用 saves\ 資料夾裡那一份
    //   原本 saves\ 只寫不讀，而且瀏覽器那邊一空就拿空白存檔蓋掉 saves\ → 角色整個不見
    async restoreFromDisk() {
        try {
            const r = await fetch('/api/offline-save', { cache: 'no-store' });
            const disk = r.ok ? await r.json() : null;
            // 「重置所有角色與存檔.bat」寫的記號：瀏覽器裡那一份也要清掉（原本只清 saves\，角色照樣還在）
            if (disk && disk.reset) {
                try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
                this.state = this.loadSave();
                this.save();
                return;
            }
            if (!disk || !Array.isArray(disk.chars) || !disk.chars.length) return;
            const local = this.state, hasLocal = local && Array.isArray(local.chars) && local.chars.length > 0;
            if (hasLocal && (local.savedAt || 0) >= (disk.savedAt || 0)) return;
            if (!disk.signin) disk.signin = { next: 1, signed: 0, lastDay: '' };
            if (!Array.isArray(disk.warehouse)) disk.warehouse = [];
            this.state = disk;
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(disk)); } catch (e) {}
            console.log('[OfflineServer] 已從 saves 資料夾還原存檔（' + disk.chars.length + ' 個角色）');
        } catch (e) {}
    }

    save() {
        this.state.savedAt = Date.now();
        let body;
        try { body = JSON.stringify(this.state); } catch (e) { return; }
        // 瀏覽器存不進去（無痕、空間滿）也照樣寫到 saves\ 資料夾
        try { localStorage.setItem(SAVE_KEY, body); } catch (e) {}
        // 存檔很頻繁（每打倒一隻怪一次）：寫到本機伺服器的那一份最多 1.5 秒送一次，關分頁時補送最後一份
        this._diskBody = body;
        if (this._diskTimer) return;
        this._diskTimer = setTimeout(() => this.flushDisk(), 1500);
    }

    flushDisk(beacon) {
        clearTimeout(this._diskTimer);
        this._diskTimer = 0;
        const body = this._diskBody;
        if (!body) return;
        this._diskBody = null;
        try {
            if (beacon && navigator.sendBeacon && navigator.sendBeacon('/api/offline-save', new Blob([body], { type: 'application/json' }))) return;
            fetch('/api/offline-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: body.length < 60000 }).catch(() => {});
        } catch (e) {}
    }

    allocItemId() {
        this.state.nextItemId = (this.state.nextItemId || 500001) + 1;
        return this.state.nextItemId;
    }

    // ── 道具建立與名稱格式化 ──
    // 道具表（items.json）沒有、但 NPC 製作／交換、寶箱會給的編號（卡立普的袋子、雷奧納的袋子、圖騰、勇士之證、香菜、屬性武器強化卷軸…）
    //   原本拿到只顯示「道具#編號」（玩家 2026-11-12 回報遊樂場後一起查）→ 補一筆：名字照 npcmake／寶箱表；
    //   道具表裡有同名的就借它的資料（圖示、種類），沒有就當一般道具；寶箱照樣用 boxes.json 開
    addMissingItems() {
        const byName = new Map();
        for (const [nid, tpl] of Object.entries(this.data.items)) {
            const n = displayName(nid) || nid;
            if (tpl && tpl.id != null && !byName.has(n)) byName.set(n, { nid, tpl });
        }
        const add = (id, name) => {
            if (!id || !name || this.data.itemsById.has(id) || this.blessedBase(id)) return;
            const src = byName.get(name);
            const tpl = src ? Object.assign({}, src.tpl, { id }) : { k: 'e', id, type: 'material', use: 'normal', w: 1000, ig: 34 };
            delete tpl.v;
            this.data.itemsById.set(id, { nid: src ? src.nid : name, tpl, name });
        };
        for (const [id, row] of Object.entries(this.data.npcmake.items || {})) add(+id, row && row[0]);
        for (const rows of Object.values(this.data.boxes)) for (const r of rows || []) add(r[0], r[3]);
    }

    // 祝福的道具編號（原編號 +100000，例：140087 受祝福的對武器施法的卷軸）道具表沒有 → 換回原編號＋祝福（bless 0）
    //   原本只有 bless 沒指定才換，寶藏挖掘傳了 bless 0 就沒換到，背包變成只有編號的道具（玩家 2026-11-12 回報）
    blessedBase(itemId) {
        return itemId >= 100000 && itemId < 200000 && !this.data.itemsById.has(itemId) && this.data.itemsById.has(itemId - 100000) ? itemId - 100000 : 0;
    }
    // 舊存檔裡已經壞掉的（itemId 還是 1xxxxx）修回來：背包、倉庫
    repairBlessedItems(ch) {
        const fix = list => (list || []).forEach(it => {
            if (!it) return;
            // 之前只顯示「道具#編號」、現在道具表補上的：名字、圖示換成正確的
            if (/^道具#/.test(it.nid || '') && this.data.itemsById.has(it.itemId)) {
                const ok = this.makeItemInstance(it.itemId, it.count, it.ench, it.bless, it.equipped);
                Object.assign(it, { nid: ok.nid, useType: ok.useType, gfx: ok.gfx });
                it.name = this.formatItemName(it);
                return;
            }
            const b = this.blessedBase(it.itemId);
            if (!b) return;
            const ok = this.makeItemInstance(b, it.count, it.ench, 0, it.equipped);
            Object.assign(it, { itemId: b, nid: ok.nid, useType: ok.useType, gfx: ok.gfx, bless: 0 });
            it.name = this.formatItemName(it);
            TPL_OF.set(it.id, it.itemId);
        });
        if (ch) fix(ch.inv);
        fix(this.state.warehouse);
    }

    makeItemInstance(itemId, count = 1, ench = 0, bless = null, equipped = false) {
        let baseId = itemId;
        const bb = this.blessedBase(itemId);
        if (bb) { baseId = bb; bless = 0; }
        else if (bless == null) bless = 1;
        const entry = this.data.itemsById.get(baseId) || this.data.itemsById.get(itemId);
        const tpl = entry ? entry.tpl : { k: 'e', id: itemId, type: 'other', use: 'normal', w: 1000, ig: 34 };
        const nid = entry ? entry.nid : ('道具#' + itemId);
        let useType = 0;
        if (tpl.k === 'w') useType = 1;
        else if (tpl.k === 'a') useType = ARMOR_USETYPE[tpl.type] || 2;
        else {
            const u = tpl.use || 'normal';
            if (baseId === 140100 || itemId === 140100) useType = 29;
            else useType = ETC_USETYPE[u] != null ? ETC_USETYPE[u] : 0;
        }
        const it = {
            id: this.allocItemId(),
            itemId: baseId,
            nid,
            useType,
            count: Math.max(1, count | 0),
            ench: ench | 0,
            bless: bless | 0,
            equipped: !!equipped,
            identified: true,
            gfx: tpl.ig || 34,
            name: '',
            st: null,
        };
        it.name = this.formatItemName(it);
        return it;
    }

    formatItemName(it) {
        const entry = this.data.itemsById.get(it.itemId);
        const tpl = entry ? entry.tpl : null;
        const nid = it.nid || (entry ? entry.nid : String(it.itemId));
        let s = '';
        if (tpl && (tpl.k === 'w' || tpl.k === 'a' || it.ench !== 0)) {
            if (it.ench !== 0 || tpl.k === 'w' || tpl.k === 'a') {
                s += (it.ench >= 0 ? '+' + it.ench : String(it.ench)) + ' ';
            }
        }
        s += nid;
        if (it.pet) s += ' [Lv.' + it.pet.lv + ' ' + it.pet.name + ']';   // 寵物項圈：裡面那隻
        if (it.count > 1) s += ' (' + it.count + ')';
        if (it.equipped) {
            s += tpl && tpl.k === 'w' ? ' ($9)' : ' ($117)';
        }
        return s;
    }

    // ── 登入、創角、選角 ──
    async clientVersion() {
        await this.initPromise;
        this.emit('serverVersion');
    }

    async login(account, password, mode) {
        await this.initPromise;
        this.state.account = account || 'offline';
        if (!this.state.chars) this.state.chars = [];
        this.emit('loginResult', 0); // 0 = OK
        setTimeout(() => {
            this.sendCharList();
        }, 30);
    }

    commonClick() {
        this.sendCharList();
    }

    sendCharList() {
        const list = this.state.chars || [];
        this.emit('charAmount', { count: list.length, max: 6 });
        for (const c of list) {
            this.emit('charPack', {
                name: c.name,
                clan: c.clan || '奇岩離線盟',
                type: c.type,
                sex: c.sex,
                lawful: c.lawful || 0,
                hp: Math.min(65535, c.hp || 100),
                mp: Math.min(65535, c.mp || 50),
                ac: c.ac != null ? c.ac : 10,
                level: c.level || 1,
                str: c.str, dex: c.dex, con: c.con, wis: c.wis, cha: c.cha, int: c.int,
                accessLevel: 200,
            });
        }
    }

    createDefaultChar() {
        const prevEmit = this.emit;
        this.emit = () => {};
        try {
            this.createChar({
                name: '亞丁英雄',
                type: 1, // 騎士
                sex: 0,
                str: 20, dex: 12, con: 14, wis: 9, cha: 12, int: 8,
            });
        } finally {
            this.emit = prevEmit;
        }
    }

    createChar(o) {
        const name = String(o.name || '').trim() || ('勇者' + Math.floor(Math.random() * 900 + 100));
        if (this.state.chars.some(c => c.name === name)) {
            this.emit('createStatus', 0x06); // 名稱重複
            return;
        }
        const type = o.type in CLASS_INIT ? o.type : 1;
        const sex = o.sex ? 1 : 0;
        const ci = CLASS_INIT[type];
        const gfx = ci.gfx[sex] != null ? ci.gfx[sex] : ci.gfx[0];

        const ch = {
            id: 1000 + this.state.chars.length + Math.floor(Math.random() * 10000),
            name,
            title: '離線冒險者',
            clan: '奇岩城血盟',
            type,
            sex,
            gfx,
            baseGfx: gfx,
            level: 1,
            exp: 0,
            str: o.str || 16,
            dex: o.dex || 12,
            con: o.con || 16,
            wis: o.wis || 12,
            cha: o.cha || 10,
            int: o.int || 12,
            hp: ci.hp + Math.max(0, (o.con || 14) - 12),
            maxHp: ci.hp + Math.max(0, (o.con || 14) - 12),
            mp: ci.mp + Math.max(0, (o.wis || 12) - 10),
            maxMp: ci.mp + Math.max(0, (o.wis || 12) - 10),
            ac: 10,
            sp: 0,
            mr: 10,
            food: 100,
            lawful: 500,
            pk: 0,
            bonusStats: 0,
            elfAttr: 0,
            mapId: 4,      // 預設在銀騎士村莊或奇岩城鎮
            x: 33080,
            y: 33392,
            heading: 5,
            inv: [],
            // 預設給實用基礎魔法；法師、妖精另外給攻擊／召喚／洗魔魔法（設定 → 魔法、召喚 才有東西可選）
            //   學魔法有職業、等級限制（沒按「解除限制」時）：只給這個職業 1 級就學得到的（照規則 1 級誰都還不能學 → 一開始沒有魔法，升級後再學）
            skills: [1, 2, 3, 4, 5, 8, 9, 12, 13, 19, 21, 26, 35, 42, 43, 54]
                .concat(type === 3 ? [6, 7, 10, 15, 16, 17, 22, 25, 28, 34, 38, 45, 46, 51, 57] : type === 2 ? [6, 7, 15, 130, 154] : [])
                .filter(sid => { if (this.skillFree()) return true; const need = this.skillReqLv(sid, type); return need != null && need <= 1; }),
            expV2: 1,
            bookmarks: [
                { id: 1, name: '奇岩廣場', map: 4, x: 33438, y: 32798, color: 1 },
                { id: 2, name: '銀騎士村莊', map: 4, x: 33080, y: 33392, color: 6 },
                { id: 3, name: '說話之島村莊', map: 0, x: 32580, y: 32928, color: 7 },
            ],
            dolls: {
                worn: 1,
                bag: 10,
                box: 3,
                bag2: 3,
                own: { 1: 2, 2: 2, 3: 1 },
                seen: [1, 2, 3],
            },
            trialsDone: [],
            tutorialStep: 0, // 0 = 完成不擋畫面
            autoSettings: null,
        };

        // 給予豐富的新手離線大禮包
        const starter = [
            [GOLD_ID, 500000, 0, 1, false],       // 50 萬金幣
            [HOME_STONE, 1, 0, 1, false],         // 主城傳送石
            [35, 1, 6, 0, type !== 2],            // +6 祝福的 象牙塔單手劍
            [174, 1, 6, 0, type === 2],           // +6 祝福的 象牙塔石弓
            [40744, 5000, 0, 1, false],           // 銀箭 5000 支
            [20028, 1, 4, 0, true],               // +4 象牙塔皮頭盔
            [20085, 1, 4, 0, true],               // +4 T恤
            [20110, 1, 6, 0, true],               // +6 抗魔法鏈甲
            [20173, 1, 4, 0, true],               // +4 象牙塔皮手套
            [20194, 1, 4, 0, true],               // +4 鋼鐵長靴
            [20219, 1, 4, 0, type !== 2],         // +4 皮盾牌
            [20288, 1, 0, 0, true],               // 傳送控制戒指
            [40029, 500, 0, 1, false],            // 象牙塔治癒藥水 x500
            [40011, 300, 0, 1, false],            // 強力治癒藥水 x300
            [40012, 200, 0, 1, false],            // 終極治癒藥水 x200
            [40018, 50, 0, 0, false],             // 強化 綠色藥水 x50
            [type === 1 ? 40014 : type === 2 ? 40068 : type === 0 ? 40031 : 40733, 50, 0, 0, false], // 職業二段加速藥水 x50
            [40015, 50, 0, 1, false],             // 藍色藥水 x50
            [49138, 20, 0, 1, false],             // 巧克力蛋糕(三段加速) x20
            [40088, 50, 0, 0, false],             // 變形卷軸 x50
            [40100, 100, 0, 0, false],            // 瞬間移動卷軸 x100
            [40087, 30, 0, 0, false],             // 祝福對武器施法的卷軸 x30
            [40074, 30, 0, 0, false],             // 祝福對盔甲施法的卷軸 x30
            [41246, 5000, 0, 1, false],           // 魔法結晶體 x5000
        ];
        for (const [iid, cnt, en, bl, eq] of starter) {
            ch.inv.push(this.makeItemInstance(iid, cnt, en, bl, eq));
        }

        this.state.chars.push(ch);
        this.save();

        this.emit('createStatus', 0x02); // REASON_OK
        this.emit('newChar', {
            name: ch.name, clan: ch.clan, type: ch.type, sex: ch.sex,
            lawful: ch.lawful, hp: ch.hp, mp: ch.mp, ac: ch.ac, level: ch.level,
            str: ch.str, dex: ch.dex, con: ch.con, wis: ch.wis, cha: ch.cha, int: ch.int,
            accessLevel: 200,
        });
    }

    deleteChar(name) {
        this.state.chars = (this.state.chars || []).filter(c => c.name !== name);
        this.save();
        this.emit('deleteResult', 0x05); // DELETE_CHAR_NOW
    }

    changeChar() {
        this.autoOn = false;
        this.autoCenter = null;
        this.summon = null;
        this.pet = null;
        this.curChar = null;
        this.objs.clear();
        this.mapMobs = [];
        this.mapNpcs = [];
        setTimeout(() => this.sendCharList(), 30);
    }

    // ── 進入世界 ──
    enterWorld(name) {
        let ch = (this.state.chars || []).find(c => c.name === name) || this.state.chars[0];
        if (!ch) return;
        this.curChar = ch;
        migrateExp(ch);   // 舊存檔的經驗換到新經驗表
        this.repairBlessedItems(ch);   // 寶藏挖掘給的祝福卷軸只有編號 → 修回來
        this.autoOn = false;
        this.autoLog = {
            start: Math.floor(Date.now() / 1000),
            sec: 0,
            exp: 0,
            gold: 0,
            kills: 0,
            potions: 0,
            deaths: 0,
            endReason: '',
            map: ch.mapId || 4,
            soldCount: 0,
            soldGold: 0,
            offline: false,
            resetOk: true,
            items: [],
            mobs: [],
        };
        this.recalcStats();

        this.emit('loginGame');
        this.sendMapAndSelf();
        this.sendInventory();
        this.sendSkills();
        this.sendBookmarks();
        this.sendSpMr();
        this.sendBonusStats();
        this.sendAutoSettings();
        this.sendDolls();
        this.sendMonthCard();
        this.sendSignin(false);
        this.sendLearnMagicList();
        this.sendEffects();
        this.sendPlayers();
        this.clanInfo();
        this.toiBook(0);
        this.huntDex(0);
        this.collect(0);
        this.mail(0);
        this.marketSummary();
        this.top1List();

        setTimeout(() => {
            this.sysMsg('✨ 歡迎來到【網頁奇岩城】離線單機版！');
            this.sysMsg('💡 支援全地圖傳送、AUTO 自動打怪、NPC 商店／製作、裝備強化與魔法娃娃。');
            if (window.__GM_ENABLED) {
                this.sysMsg('🔧 GM 模式已啟用：可點右下角「GM」按鈕，或在聊天框輸入「.道具名稱」刷取任意物品！');
            }
        }, 300);
    }

    sysMsg(text) {
        this.emit('chat', { type: 9, id: 0, text, x: 0, y: 0 });
    }

    recalcStats() {
        const ch = this.curChar;
        if (!ch) return;
        let ac = 10 - Math.floor((ch.dex || 12) / 6);
        let sp = Math.max(0, Math.floor(((ch.int || 12) - 10) / 3));
        let mr = 10 + Math.max(0, (ch.wis || 12) - 10) * 2 + Math.floor((ch.level || 1) / 2);
        let maxHpBonus = 0, maxMpBonus = 0;
        let wpnVisual = 0;
        let hitBonus = 0, dmgBonus = 0, dr = 0;

        for (const it of ch.inv || []) {
            it.name = this.formatItemName(it);
            if (!it.equipped) continue;
            const entry = this.data.itemsById.get(it.itemId);
            const tpl = entry ? entry.tpl : null;
            if (!tpl) continue;
            if (tpl.k === 'w') {
                wpnVisual = WPN_VISUAL[tpl.type] || 4;
                hitBonus += (tpl.hit || 0) + (it.ench || 0);
                dmgBonus += (tpl.dmg || 0) + (it.ench || 0);
            } else if (tpl.k === 'a') {
                const isAcc = /ring|amulet|earring|belt/.test(tpl.type);
                ac += (tpl.ac || 0) - (isAcc ? 0 : (it.ench || 0));
                hitBonus += (tpl.hitA || 0) + (tpl.bhA || 0);
                dmgBonus += (tpl.dmgA || 0) + (tpl.bdA || 0);
            }
            sp += tpl.sp || 0;
            mr += tpl.mr || 0;
            maxHpBonus += tpl.hp || 0;
            maxMpBonus += tpl.mp || 0;
            // 強化超過安定值的額外能力（同網頁 items.js overSafeLines／伺服器 WebOverSafe，道具說明照這個表顯示）
            const os = overSafe(tpl, it.ench || 0);
            hitBonus += os.hit; dmgBonus += os.dmg; maxHpBonus += os.hp; maxMpBonus += os.mp; mr += os.mr; dr += os.dr;
        }
        // 增益效果加成
        if (this.hasEffect(115)) ac -= 8; // 鋼鐵士氣
        if (this.hasEffect(151)) ac -= 6; // 大地防護
        if (this.hasEffect(21)) ac -= 3;  // 鎧甲護持
        if (this.hasEffect(1004)) sp += 2; // 慎重藥水
        // 狩獵圖鑑的永久能力（照 huntdex.js HUNT_P 的公式；原本升級了只改等級、能力沒加上去，玩家 2026-11-13 回報）
        const hb = this.huntBonus();
        maxHpBonus += hb.hp; maxMpBonus += hb.mp; mr += hb.mr; ac -= hb.ac; hitBonus += hb.hit;

        ch.ac =Math.max(-128, Math.min(127, ac));
        ch.sp = sp;
        ch.mr = mr;
        ch.weaponVisual = wpnVisual;
        ch.hitBonus = hitBonus;
        ch.dmgBonus = dmgBonus;
        ch.dr = dr;
        // 沒升過級的角色沒有 baseMaxHp：從目前上限扣掉上次加過的裝備加成記下來（原本直接拿 maxHp 當底再加一次，每次重算都往上疊）
        if (!(ch.baseMaxHp > 0)) ch.baseMaxHp = Math.max(1, (ch.maxHp || 50) - (ch.hpBonusOn | 0));
        if (!(ch.baseMaxMp > 0)) ch.baseMaxMp = Math.max(1, (ch.maxMp || 20) - (ch.mpBonusOn | 0));
        ch.hpBonusOn = maxHpBonus; ch.mpBonusOn = maxMpBonus;
        ch.maxHp = Math.max(1, ch.baseMaxHp + maxHpBonus);
        ch.maxMp = Math.max(1, ch.baseMaxMp + maxMpBonus);
        if (ch.hp > ch.maxHp) ch.hp = ch.maxHp;
        if (ch.mp > ch.maxMp) ch.mp = ch.maxMp;
    }

    sendOwnStatus() {
        const ch = this.curChar;
        if (!ch) return;
        this.emit('ownStatus', {
            id: ch.id,
            level: ch.level,
            exp: ch.exp,
            str: ch.str,
            int: ch.int,
            wis: ch.wis,
            dex: ch.dex,
            con: ch.con,
            cha: ch.cha,
            hp: Math.max(0, Math.min(65535, ch.hp | 0)),
            maxHp: Math.max(1, Math.min(65535, ch.maxHp | 0)),
            mp: Math.max(0, Math.min(65535, ch.mp | 0)),
            maxMp: Math.max(1, Math.min(65535, ch.maxMp | 0)),
            ac: ch.ac | 0,
            time: Math.floor(Date.now() / 1000),
            food: ch.food != null ? ch.food : 100,
            weight: 5,
            lawful: ch.lawful || 0,
        });
    }

    sendSpMr() {
        const ch = this.curChar;
        if (!ch) return;
        this.emit('spMr', { sp: ch.sp || 0, mr: ch.mr || 0 });
        this.emit('stats', {
            spBonus: ch.sp || 0,
            mrBonus: ch.mr || 0,
            ac: ch.ac | 0,
            str: ch.str,
            dex: ch.dex,
            con: ch.con,
            int: ch.int,
            wis: ch.wis,
            cha: ch.cha,
        });
    }

    sendBonusStats() {
        const ch = this.curChar;
        if (!ch) return;
        const payload = {
            bonusStats: ch.bonusStats || 0,
            remain: ch.bonusStats || 0,
            pkCount: ch.pk || 0,
            pk: ch.pk || 0,
            strCap: 50, dexCap: 50, conCap: 50, intCap: 50, wisCap: 50, chaCap: 50,
            elixir: 5,
            elixirCount: 5,
        };
        this.emit('bonusStats', payload);
        this.emit('stats', payload);
    }

    sendMapAndSelf() {
        const ch = this.curChar;
        if (!ch) return;
        this.sendOwnStatus();
        this.emit('mapId', { map: ch.mapId, underwater: ch.mapId === 63 ? 1 : 0 });
        this.emit('object', {
            id: ch.id,
            x: ch.x,
            y: ch.y,
            gfx: ch.polyGfx || ch.gfx,
            weapon: ch.weaponVisual || 0,
            action: 0,
            heading: ch.heading || 5,
            light: 10,
            speed: this.hasHaste() ? 1 : 0,
            exp: ch.exp || 1,
            lawful: ch.lawful || 0,
            name: ch.name,
            title: ch.title || '',
            // 角色封包的 status＝手上武器的動作編號（main.js onObject 讀這格當 weapon）；原本塞加速旗標 → 進世界、傳送後一律被當空手，拿弓也是揮拳
            status: ch.weaponVisual || 0,
            clanId: 1,
            clan: ch.clan || '奇岩城血盟',
            master: '',
            state: 0,
            hpRatio: 100,
            thirdSpeed: this.hasEffect(1027),
            level: ch.level,
            isPc: true,
        });
        if (this.hasHaste()) this.emit('haste', { id: ch.id, type: 1, time: 1800 });
        if (this.hasBrave()) this.emit('brave', { id: ch.id, type: ch.type === 2 ? 3 : 1, time: 600 });
        if (this.hasEffect(1027)) this.emit('liquor', { id: ch.id, type: 8 });

        this.spawnMapEntities();
    }

    sendInventory() {
        const ch = this.curChar;
        if (!ch) return;
        const list = (ch.inv || []).map(it => {
            it.name = this.formatItemName(it);
            return Object.assign({}, it);
        });
        this.emit('invList', list);
        this.sendInvIds();
    }

    sendInvIds() {
        const ch = this.curChar;
        if (!ch) return;
        const m = new Map();
        for (const it of ch.inv || []) {
            m.set(it.id, it.itemId);
            TPL_OF.set(it.id, it.itemId);
        }
        m.bound = new Set([HOME_STONE]);
        m.locked = new Set();
        for (const it of ch.inv || []) {
            if (it.locked) m.locked.add(it.id);
        }
        m.supply = new Set([40010, 40011, 40012, 40013, 40014, 40015, 40018, 40029, 40031, 40068, 40088, 40100, 40744, 41246, HOME_STONE]);
        this.emit('invIds', m);
    }

    sendSkills() {
        const ch = this.curChar;
        if (!ch) return;
        const masks = new Array(32).fill(0);
        for (const sid of ch.skills || []) {
            const idx = (sid - 1) >> 3;
            const bit = 1 << ((sid - 1) & 7);
            if (idx >= 0 && idx < 32) masks[idx] |= bit;
        }
        this.emit('skills', masks);
    }

    sendBookmarks() {
        const ch = this.curChar;
        if (!ch) return;
        for (const bm of ch.bookmarks || []) {
            this.emit('bookmark', { name: bm.name, map: bm.map, id: bm.id, color: bm.color || 0 });
        }
    }

    sendDolls() {
        const ch = this.curChar;
        if (!ch) return;
        const d = ch.dolls || (ch.dolls = { worn: 1, bag: 5, box: 2, bag2: 1, own: { 1: 1 }, seen: [1] });
        const own = new Map();
        for (const [k, v] of Object.entries(d.own || {})) {
            if (v > 0) own.set(+k, +v);
        }
        const seen = new Set(d.seen || []);
        const remain = new Map();
        for (const dl of this.data.dolls) remain.set(dl.id, 1800);
        this.emit('dolls', {
            worn: d.worn || 0,
            bag: d.bag || 0,
            box: d.box || 0,
            bag2: d.bag2 || 0,
            own,
            seen,
            bookBonuses: ['', '經驗加成 +2%', '近遠距離命中 +1', '近遠距離傷害 +1', '減傷 +1', '全能力 +1', '全能力 +2'],
            synth: {
                pity: 5,
                refund: 1,
                tiers: [
                    null,
                    { fee: 10000, rate: 50, need: 4, pity: 0 },
                    { fee: 50000, rate: 35, need: 4, pity: 0 },
                    { fee: 200000, rate: 25, need: 4, pity: 0 },
                    { fee: 1000000, rate: 15, need: 4, pity: 0 },
                    { fee: 5000000, rate: 10, need: 4, pity: 0 },
                ],
            },
            crystal: {
                minutes: 30,
                cost: [0, 0, 0, 0, 0, 0, 0], // 離線版召喚娃娃免消耗結晶體
                paused: false,
                at: Date.now(),
                remain,
            },
            shop: { price: 30000, left: 99, limit: 99, minLv: 1 },
        });
    }

    sendMonthCard() {
        const now = Math.floor(Date.now() / 1000);
        // 離線版永久啟用 VIP 月卡（背包上限 180 格、自動賣出等完整開放）
        this.emit('monthCard', {
            on: true,
            active: true,
            now,
            expire: now + 86400 * 365,
            days: 365,
            bagCard: 180,
            bagFree: 180,
            bagMax: 180,
            vipMax: 180,
            freeMax: 180,
            hintOff: true,
            promptSeen: true,
            freeBeta: true,
        });
    }

    sendSignin(justSigned = false) {
        const si = this.state.signin || (this.state.signin = { next: 1, signed: 1, lastDay: '' });
        if (!justSigned) si.signed = 1; // 進遊戲預設不強彈簽到視窗擋畫面，玩家可從設定打開或領取
        const days = [
            { reward: '金幣 ×100,000', item: GOLD_ID, qty: 100000 },
            { reward: '象牙塔治癒藥水 ×500', item: 40029, qty: 500 },
            { reward: '魔法娃娃的袋子 ×3', item: 49900, qty: 3 },
            { reward: '受祝福的 對盔甲施法的卷軸 ×5', item: 140074, qty: 5 },
            { reward: '受祝福的 對武器施法的卷軸 ×5', item: 140087, qty: 5 },
            { reward: '巧克力蛋糕 ×10', item: 49138, qty: 10 },
            { reward: '高級魔法娃娃的盒子 ×3', item: 49900, qty: 3 },
        ];
        this.emit('signin', { next: si.next || 1, signed: si.signed ? 1 : 0, days });
    }

    signin() {
        const si = this.state.signin || (this.state.signin = { next: 1, signed: 0 });
        this.giveItem(GOLD_ID, 200000, 0, 1);
        if (this.curChar && this.curChar.dolls) {
            this.curChar.dolls.bag = (this.curChar.dolls.bag || 0) + 3;
            this.curChar.dolls.box = (this.curChar.dolls.box || 0) + 1;
            this.sendDolls();
        }
        si.signed = 1;
        si.next = Math.min(8, (si.next || 1) + 1);
        this.save();
        this.sendSignin(true);
        this.sysMsg('🎁 簽到成功！獲得金幣 ×200,000、魔法娃娃袋子 ×3、高級娃娃盒子 ×1！');
        this.tutNote('signin');   // 新手引導「每天簽到」
    }

    // ── 狀態與藥水效果 ──
    hasEffect(id) {
        if (!this.curChar || !this.curChar.effects) return false;
        const exp = this.curChar.effects[id];
        return exp != null && (exp < 0 || exp > Date.now());
    }

    addEffect(id, sec) {
        if (!this.curChar) return;
        if (!this.curChar.effects) this.curChar.effects = {};
        this.curChar.effects[id] = sec < 0 ? -1 : Date.now() + sec * 1000;
        this.recalcStats();
        this.sendOwnStatus();
        this.sendSpMr();
        this.sendEffects();
    }

    hasHaste() { return this.hasEffect(1001) || this.hasEffect(43) || this.hasEffect(54); }
    hasBrave() { return this.hasEffect(1000) || this.hasEffect(1016) || this.hasEffect(1017); }

    sendEffects() {
        const ch = this.curChar;
        if (!ch) return;
        const now = Date.now();
        const list = [];
        for (const [k, exp] of Object.entries(ch.effects || {})) {
            if (exp < 0) list.push({ id: +k, sec: -1 });
            else if (exp > now) list.push({ id: +k, sec: Math.ceil((exp - now) / 1000) });
            else delete ch.effects[k];
        }
        this.emit('effects', list);
    }

    sendPlayers() {
        const ch = this.curChar;
        if (!ch) return;
        this.emit('players', {
            full: true,
            removed: [],
            total: 1,
            list: [{ id: ch.id, name: ch.name, type: ch.type, level: ch.level || 1, map: ch.mapId, area: '離線世界' }],
        });
    }

    // ── 地圖 NPC 與怪物生成 ──
    getMobGfx(name) {
        const clean = String(name || '').trim();
        if (this.data.gfxByName.has(clean)) return this.data.gfxByName.get(clean);
        for (const [k, g] of this.data.gfxByName.entries()) {
            if (clean.endsWith(k) || clean.includes(k)) return g;
        }
        return 56; // 預設妖魔外型
    }

    spawnMapEntities() {
        const ch = this.curChar;
        if (!ch) return;
        // 清除舊地圖物件
        for (const id of this.objs.keys()) {
            if (id !== ch.id) this.emit('remove', id);
        }
        this.objs.clear();
        this.mapMobs = [];
        this.mapNpcs = [];
        this.groundItems.clear();

        // 1. 生成城鎮常用 NPC（奇岩廣場、銀騎士村莊、說話之島等）並支援遠端對話
        this.spawnTownNpcs(ch.mapId, ch.x, ch.y);

        // 2. 如果是狩獵地圖或村外，在玩家周圍生成怪物
        this.maintainMonsters();
        this.sendMapNpcs();
    }

    sendMapNpcs() {
        const ch = this.curChar;
        if (!ch) return;
        const list = this.mapNpcs.map(n => ({
            id: n.id, x: n.x, y: n.y, gfx: n.gfx, name: n.name, title: n.title,
        }));
        this.emit('mapNpcs', {
            map: ch.mapId,
            remote: true,
            list,
            areas: [{
                name: '村莊與遠端服務 NPC',
                list,
            }],
        });
    }

    mapNpcsReq() {
        this.sendMapNpcs();
    }

    // ── 角色移動與傳送 ──
    move(x, y, heading) {
        const ch = this.curChar;
        if (!ch) return;
        const h = heading & 7;
        ch.x = x + DX[h];
        ch.y = y + DY[h];
        ch.heading = h;

        // 移動時若剛好踩在 Portal 傳點上，自動進行地圖傳送
        const portals = (this.data.portals && this.data.portals[ch.mapId]) || [];
        const onPt = portals.find(p => p.x === ch.x && p.y === ch.y);
        if (onPt) {
            this.enterPortal(ch.x, ch.y);
            return;
        }

        this.maintainMonsters();
        this.refreshNpcView();
    }

    changeHeading(h) {
        if (this.curChar) this.curChar.heading = h & 7;
    }

    enterPortal(x, y) {
        const ch = this.curChar;
        if (!ch) return;
        const curPts = (this.data.portals && this.data.portals[ch.mapId]) || [];
        // 尋找在玩家周圍 <= 3 格的最接近傳點
        let best = null, bestDist = 999;
        for (const p of curPts) {
            const d = Math.max(Math.abs(p.x - (x || ch.x)), Math.abs(p.y - (y || ch.y)));
            if (d < bestDist && d <= 3) {
                bestDist = d;
                best = p;
            }
        }
        if (!best) {
            // 地圖無傳點或未靠近傳點時微調傳送
            this.teleportTo(ch.mapId, x || ch.x, y || ch.y);
            return;
        }

        const destMap = best.to;
        if (destMap === ch.mapId) {
            // 同地圖跳躍 (傳送門)
            this.teleportTo(destMap, best.x, best.y, true);
            return;
        }

        // 跨地圖傳送：尋找目標地圖中回到當前地圖的傳點
        const destPts = (this.data.portals && this.data.portals[destMap]) || [];
        const retPortal = destPts.find(rp => rp.to === ch.mapId) || destPts[0];
        let targetX = retPortal ? retPortal.x : ch.x;
        let targetY = retPortal ? retPortal.y : ch.y;
        if (retPortal) {
            // 微調一格避免卡在傳點邊緣循環觸發
            targetX += (retPortal.x > 32700 ? -1 : 1);
        }
        this.teleportTo(destMap, targetX, targetY, true);
        if (best.t) this.sysMsg('進入「' + best.t + '」。');
    }

    teleportTo(mapId, x, y, fx = true) {
        const ch = this.curChar;
        if (!ch) return;
        if (fx) this.emit('effect', { id: ch.id, gfx: 169 }); // 瞬間移動光束
        ch.mapId = mapId;
        ch.x = x;
        ch.y = y;
        this.autoTargetId = 0;
        if (this.autoOn) this.autoCenter = { x, y };   // 掛機中傳送：巡邏範圍從新位置算起
        this.sendMapAndSelf();
        this.save();
    }

    webTeleport(destId) {
        const ch = this.curChar;
        if (!ch) return;
        const dest = this.data.teleports.find(t => t.id === destId);
        if (!dest) return;
        const price = dest.price || 0;
        if (price > 0 && !this.spendGold(price)) {
            this.sysMsg('金幣不足，無法傳送。');
            return;
        }
        this.teleportTo(dest.map, dest.x, dest.y, true);
        this.sysMsg('傳送至「' + dest.name + '」。');
        this.tutNote('tele');   // 新手引導「傳送去練功的地方」
    }

    // ── 戰鬥、攻擊、技能與掉寶 ──
    attack(objId, x, y) {
        const ch = this.curChar;
        if (!ch) return;
        const mob = this.mapMobs.find(m => m.id === objId && !m.dead);
        const dir = mob ? this.dirBetween(ch.x, ch.y, mob.x, mob.y) : ch.heading;
        ch.heading = dir;

        const isBow = ch.weaponVisual === 20 || ch.weaponVisual === 62;
        if (!mob) {
            this.emit('attack', {
                act: 1, atk: ch.id, tgt: 0, dmg: 0, heading: dir,
                gfx: isBow ? 66 : 0, use: isBow ? 6 : 0,
                x: ch.x, y: ch.y, tx: x || ch.x + DX[dir], ty: y || ch.y + DY[dir],
            });
            return;
        }

        // 3.50C 原版命中判定 (等級 + 力量/敏捷修正 + 武器修正 vs 防禦 AC)
        const statHit = isBow ? dexHit(ch.dex || 12) : strHit(ch.str || 16);
        let baseHit = (ch.level || 1) + statHit + (ch.hitBonus || 0) + (isBow ? 0 : 5);
        for (const it of ch.inv || []) {
            if (it.equipped) {
                const entry = this.data.itemsById.get(it.itemId);
                const tpl = entry && entry.tpl;
                if (tpl && tpl.k === 'w') {
                    baseHit += (tpl.hit || 0) + Math.floor((it.ench || 0) / 2);
                }
            }
        }
        const mobAc = mob.ac != null ? mob.ac : 10;
        // 命中率：最低 10%，最高 95%
        const hitRate = Math.min(0.95, Math.max(0.10, ((baseHit * 5) - ((10 - mobAc) * 2.5)) / 100 + 0.50));
        const isHit = this.gmRates.oneHit || (Math.random() <= hitRate);

        if (!isHit) {
            // 未命中 (Miss)
            this.emit('attack', {
                act: 1, atk: ch.id, tgt: mob.id, dmg: 0, heading: dir,
                gfx: isBow ? 66 : 0, use: isBow ? 6 : 0,
                x: ch.x, y: ch.y, tx: mob.x, ty: mob.y,
            });
            mob.aggro = true;
            return;
        }

        // 計算 3.50C 傷害
        let dmg = this.calcPlayerDamage(mob, isBow);
        mob.hp = Math.max(0, mob.hp - dmg);
        mob.aggro = true;

        this.emit('attack', {
            act: 1, atk: ch.id, tgt: mob.id, dmg: Math.max(1, dmg), heading: dir,
            gfx: isBow ? 66 : 0, use: isBow ? 6 : 0,
            x: ch.x, y: ch.y, tx: mob.x, ty: mob.y,
        });
        this.emit('hpMeter', { id: mob.id, ratio: Math.max(0, Math.min(100, Math.round((mob.hp / mob.maxHp) * 100))) });

        if (mob.hp <= 0) {
            this.onMobKilled(mob);
        }
    }

    calcPlayerDamage(mob, isBow) {
        const ch = this.curChar;
        if (this.gmRates.oneHit) return Math.max(9999, mob.hp);

        const statDmg = isBow ? dexDmg(ch.dex || 12) : strDmg(ch.str || 16);
        let baseDmg = statDmg + Math.floor((ch.level || 1) / 10) + (ch.dmgBonus || 0);

        // 取得裝備武器骰子與強化值
        let weaponDice = 4;
        let weaponEnch = 0;
        let weaponName = '';
        let isUndeadBonusWeapon = false;

        for (const it of ch.inv || []) {
            if (it.equipped) {
                const entry = this.data.itemsById.get(it.itemId);
                const tpl = entry && entry.tpl;
                if (tpl && tpl.k === 'w') {
                    // 大小怪判定
                    weaponDice = mob.isLarge ? Math.max(4, tpl.dl || 6) : Math.max(4, tpl.ds || 6);
                    weaponEnch = it.ench || 0;
                    weaponName = entry.name || '';
                    if (isUndeadWeapon(weaponName) || tpl.bd) isUndeadBonusWeapon = true;
                    baseDmg += (tpl.dmg || 0);
                    break;
                }
            }
        }

        let rndWeapon = Math.floor(Math.random() * weaponDice) + 1;
        let weaponPart = rndWeapon + weaponEnch;

        // 黑妖雙重破壞 (Double Brake, 115)：33% 機率武器骰子與強化值翻倍
        const hasDoubleBrake = (ch.skills && ch.skills.includes(115)) || (ch.effects && ch.effects[115]);
        if (hasDoubleBrake && Math.random() < 0.33) {
            weaponPart *= 2;
        }

        // 不死怪加成 (銀、米索莉、奧里哈魯根、底比斯武器加成 1~20 隨機神聖傷害)
        let undeadExtra = 0;
        if (mob.isUndead && isUndeadBonusWeapon) {
            undeadExtra = Math.floor(Math.random() * 20) + 1;
        }

        let totalDmg = weaponPart + baseDmg + undeadExtra;

        // 燃燒鬥志 (Burning Spirit, 118) 或 火焰武器 (148)：33% 機率總物理傷害 1.5 倍
        const hasBurning = (ch.skills && ch.skills.includes(118)) || (ch.effects && (ch.effects[118] || ch.effects[148]));
        if (hasBurning && Math.random() < 0.33) {
            totalDmg = Math.floor(totalDmg * 1.5);
        }

        // 扣除怪物傷害減免 (Damage Reduction)
        const dr = mob.dr || 0;
        return Math.max(1, Math.round(totalDmg - dr));
    }

    onMobKilled(mob) {
        const ch = this.curChar;
        mob.dead = true;
        mob.deadAt = Date.now();
        if (this.autoTargetId === mob.id) this.autoTargetId = 0;
        // 寵物有打過這隻就分到經驗（不管最後一下是誰打的）；原本只有寵物自己打死才有，主人打死的都拿不到（2026-11-12 使用者要求檢查）
        if (mob.petHit) {
            const pet = this.pet;
            mob.petHit = false;
            if (pet && pet.collar === mob.petHit_collar && this.petGainExp) this.petGainExp(pet, mob);
        }

        this.emit('hpMeter', { id: mob.id, ratio: 0 });
        this.emit('action', { id: mob.id, action: 8 }); // 8 = ACTION_Die

        // Boss 擊殺公告
        if (mob.isBoss) {
            this.sysMsg('📢 賀！玩家「' + ch.name + '」英勇擊敗了世界首領【' + mob.name + '】！');
        }

        // 經驗值與升級
        const potMul = ch.expPotUntil > Date.now() ? (ch.expPotPct || 150) / 100 : 1;   // 經驗藥水
        const huntMul = 1 + this.huntBonus().exp / 100;   // 狩獵圖鑑 亞丁：經驗 +%
        const expGain = Math.max(1, Math.round((mob.exp || 10) * (this.gmRates.exp || 1) * potMul * huntMul));
        ch.exp = (ch.exp || 0) + expGain;
        ch.lawful = Math.min(32767, (ch.lawful || 0) + Math.max(1, Math.floor(mob.level / 2)));

        const newLv = levelFromExp(ch.exp);
        if (newLv > ch.level) {
            this.levelUpTo(newLv);
        } else {
            this.sendOwnStatus();
        }

        // 掉金幣與道具 (支援複合金幣及複合鍵解析)
        const [gMin, gMax] = mob.gold || [10, 40];
        const goldAmt = Math.max(5, Math.round((gMin + Math.floor(Math.random() * Math.max(1, gMax - gMin + 1))) * (this.gmRates.gold || 1)));
        this.giveItem(GOLD_ID, goldAmt, 0, 1, mob.id);

        const droppedNames = [];
        for (const d of mob.drops || []) {
            const [rawNid, rate, minQ, maxQ] = d;
            const actualRate = Math.min(1, (rate || 0.02) * (this.gmRates.drop || 1) * (mob.isBoss ? 2.5 : 1.0));
            if (Math.random() < actualRate) {
                const tpl = findDropItemTpl(rawNid, this.data.items);
                if (tpl && tpl.id) {
                    const qty = (minQ || 1) + Math.floor(Math.random() * Math.max(1, (maxQ || 1) - (minQ || 1) + 1));
                    const inst = this.giveItem(tpl.id, qty, 0, 1, mob.id);
                    if (inst) droppedNames.push(displayName(rawNid) || tpl.name || rawNid);
                }
            }
        }

        // 更新掛機紀錄 (autoLog)
        if (this.autoLog) {
            this.autoLog.exp += expGain;
            this.autoLog.gold += goldAmt;
            this.autoLog.kills += 1;
            const mEntry = this.autoLog.mobs.find(x => x.name === mob.name);
            if (mEntry) mEntry.count += 1;
            else this.autoLog.mobs.push({ gfx: mob.gfx, name: mob.name, count: 1 });
            for (const nm of droppedNames) {
                const iEntry = this.autoLog.items.find(x => x.name === nm);
                if (iEntry) iEntry.count += 1;
                else this.autoLog.items.push({ name: nm, count: 1 });
            }
            if (this.autoOn) this.emit('autoLog', Object.assign({}, this.autoLog));
        }

        this.save();
    }

    levelUpTo(targetLv) {
        const ch = this.curChar;
        if (!ch) return;
        const ci = CLASS_INIT[ch.type] || CLASS_INIT[1];
        while (ch.level < targetLv && ch.level < 99) {
            ch.level++;
            const hpAdd = ci.hpGain[0] + Math.floor(Math.random() * (ci.hpGain[1] - ci.hpGain[0] + 1)) + Math.max(0, Math.floor((ch.con - 12) / 2));
            const mpAdd = ci.mpGain[0] + Math.floor(Math.random() * (ci.mpGain[1] - ci.mpGain[0] + 1)) + Math.max(0, Math.floor((ch.wis - 12) / 2));
            ch.baseMaxHp = (ch.baseMaxHp || ch.maxHp) + hpAdd;
            ch.baseMaxMp = (ch.baseMaxMp || ch.maxMp) + mpAdd;
            if (ch.level > 50) ch.bonusStats = (ch.bonusStats || 0) + 1;
        }
        if (ch.exp < expForLevel(ch.level)) ch.exp = expForLevel(ch.level);
        this.recalcStats();
        ch.hp = ch.maxHp;
        ch.mp = ch.maxMp;
        this.sendOwnStatus();
        this.sendSpMr();
        this.sendBonusStats();
        this.sendLearnMagicList();
        this.sysMsg('🎉 恭喜升到 Lv.' + ch.level + '！體力與魔力已完全恢復！');
    }

    // ── 獲得與扣除道具 ──
    findInvByItemId(itemId) {
        if (!this.curChar) return null;
        return (this.curChar.inv || []).find(it => it.itemId === itemId);
    }

    getGold() {
        const g = this.findInvByItemId(GOLD_ID);
        return g ? g.count : 0;
    }

    spendGold(amount) {
        if (amount <= 0) return true;
        const g = this.findInvByItemId(GOLD_ID);
        if (!g || g.count < amount) return false;
        this.consumeItem(g.id, amount);
        return true;
    }

    giveItem(itemId, count = 1, ench = 0, bless = null, fromMobId = 0) {
        const ch = this.curChar;
        if (!ch) return null;
        let baseId = itemId;
        const bb = this.blessedBase(itemId);
        if (bb) { baseId = bb; bless = 0; }
        const entry = this.data.itemsById.get(baseId) || this.data.itemsById.get(itemId);
        const tpl = entry ? entry.tpl : { k: 'e', id: baseId, ig: 34 };
        const canStack = tpl.k === 'e' && baseId !== HOME_STONE;

        let inst = canStack ? (ch.inv || []).find(it => it.itemId === baseId && !it.pet && !it.inn && (bless == null || it.bless === bless)) : null;
        if (inst) {
            inst.count += Math.max(1, count | 0);
            inst.name = this.formatItemName(inst);
            this.emit('invUpdate', { id: inst.id, count: inst.count, name: inst.name });
        } else {
            inst = this.makeItemInstance(itemId, count, ench, bless, false);
            ch.inv.push(inst);
            TPL_OF.set(inst.id, inst.itemId);
            this.emit('invAdd', Object.assign({}, inst));
            this.sendInvIds();
        }
        if (fromMobId) {
            const mob = this.objs.get(fromMobId);
            this.emit('loot', {
                x: mob ? mob.x : ch.x,
                y: mob ? mob.y : ch.y,
                items: [{ name: inst.name, gfx: inst.gfx }],
            });
        }
        return inst;
    }

    // ── 地上的道具：丟出去會掉在腳下（原本「丟棄」直接把道具刪掉），點地上的道具走過去撿 ──
    //   離線版沒有道具的地面外型資料，地上只畫名字（gfx 用不存在的編號）；換地圖、傳送就不見（同原版放久會消失）
    dropItem(x, y, objId, cnt) {
        const ch = this.curChar;
        const it = ch && (ch.inv || []).find(i => i.id === objId);
        if (!it || it.equipped || it.itemId === HOME_STONE) return;
        const n = Math.min(it.count, Math.max(1, cnt | 0));
        const copy = Object.assign({}, it, { count: n });
        copy.name = this.formatItemName(copy);
        this.consumeItem(it.id, n);
        const g = { id: this.nextObjId++, x: ch.x, y: ch.y, item: copy };
        this.groundItems.set(g.id, g);
        this.emitGroundItem(g);
        this.save();
    }
    emitGroundItem(g) {
        this.emit('object', {
            id: g.id, x: g.x, y: g.y, gfx: GROUND_GFX, weapon: 0, action: 0, heading: 0, light: 0, speed: 0, exp: g.item.count, lawful: 0,
            name: g.item.name, title: '', status: 0, clanId: 0, clan: '', master: '', state: 0, hpRatio: 0xff, thirdSpeed: false, level: 0,
            isItem: true, count: g.item.count,
        });
    }
    pickUp(x, y, objId, cnt) {
        const ch = this.curChar, g = this.groundItems.get(objId);
        if (!ch || !g) return;
        if (Math.max(Math.abs(g.x - ch.x), Math.abs(g.y - ch.y)) > 3) { this.sysMsg('離太遠了，走近一點再撿。'); return; }
        this.groundItems.delete(objId);
        this.emit('remove', objId);
        const it = g.item, entry = this.data.itemsById.get(it.itemId);
        const stack = entry && entry.tpl.k === 'e' && !it.pet && !it.inn && it.itemId !== HOME_STONE;
        if (stack) this.giveItem(it.itemId, it.count, it.ench, it.bless);
        else { it.id = this.allocItemId(); it.equipped = false; this.addInvInstance(it); }
        this.save();
    }

    // 直接放一件做好的道具進背包（不跟同樣的疊在一起，例：裝著寵物的項圈）
    addInvInstance(inst) {
        const ch = this.curChar;
        if (!ch) return;
        ch.inv.push(inst);
        TPL_OF.set(inst.id, inst.itemId);
        this.emit('invAdd', Object.assign({}, inst));
        this.sendInvIds();
    }

    consumeItem(objId, count = 1) {
        const ch = this.curChar;
        if (!ch) return false;
        const idx = (ch.inv || []).findIndex(it => it.id === objId);
        if (idx < 0) return false;
        const it = ch.inv[idx];
        if (it.itemId === HOME_STONE) return true; // 主城傳送石不消耗
        if (it.count > count) {
            it.count -= count;
            it.name = this.formatItemName(it);
            this.emit('invUpdate', { id: it.id, count: it.count, name: it.name });
        } else {
            ch.inv.splice(idx, 1);
            this.emit('invDel', it.id);
            if (it.pet) { if (this.pet && this.pet.collar === it.id) this.petStash(true); this.sendPetCollars(); }   // 項圈賣掉／丟掉：裡面的寵物跟著不見
        }
        return true;
    }

    // ── 使用道具 (裝備穿脫、喝藥水、強化卷軸、瞬間移動、變身、開箱) ──
    useItem(objId, extraFn) {
        const ch = this.curChar;
        if (!ch) return;
        const it = (ch.inv || []).find(x => x.id === objId);
        if (!it) return;

        // 解析 extraFn 傳入的參數 (targetId, polyName, mapId/bmId)
        const args = { d: [], h: [], s: [] };
        if (typeof extraFn === 'function') {
            const dummy = {
                c() { return this; },
                h(v) { args.h.push(v); return this; },
                d(v) { args.d.push(v); return this; },
                s(v) { args.s.push(v); return this; },
            };
            try { extraFn(dummy); } catch (e) {}
        }

        const entry = this.data.itemsById.get(it.itemId);
        const tpl = entry ? entry.tpl : { k: 'e', id: it.itemId };

        // 0. 寵物項圈：叫出／收回裡面的寵物；寵物召喚笛：叫寵物回到身邊（沒叫出來就叫第一個項圈的）
        if (it.itemId === PET_COLLAR && it.pet) { this.petToggle(it); return; }
        if (it.itemId === PET_FLUTE) { this.petFlute(); return; }
        if (it.itemId === INN_KEY) { this.innRest(it); return; }

        // 1. 武器或防具：穿脫切換
        if (tpl.k === 'w' || tpl.k === 'a') {
            this.toggleEquip(it, tpl);
            return;
        }

        // 2. 強化卷軸 (對武器/盔甲施法的卷軸、祝福賦予卷軸)
        if ((it.useType === 26 || it.useType === 27 || it.itemId === 49908 || it.itemId === 49932) && args.d.length > 0) {
            const targetObjId = args.d[0];
            this.useEnchantScroll(it, targetObjId);
            return;
        }

        // 3. 鑑定卷軸
        if (it.useType === 7 && args.d.length > 0) {
            const target = ch.inv.find(x => x.id === args.d[0]);
            if (target) {
                target.identified = true;
                target.name = this.formatItemName(target);
                this.emit('invUpdate', Object.assign({}, target));
                this.emit('itemStatus', Object.assign({}, target));
                this.consumeItem(it.id, 1);
            }
            return;
        }

        // 4. 變形卷軸
        if (it.useType === 16 || it.itemId === 40088 || it.itemId === 140088) {
            const polyName = args.s[0] || '';
            this.applyPoly(polyName, 1800);
            this.consumeItem(it.id, 1);
            return;
        }

        // 5. 主城傳送石 (49900) 或回家卷軸 (40079, 40095, 40521)
        if (it.itemId === HOME_STONE || it.itemId === 40079 || it.itemId === 40095 || it.itemId === 40521) {
            if (it.itemId !== HOME_STONE) this.consumeItem(it.id, 1);
            this.teleportTo(4, 33438, 32798, true);
            this.sysMsg('傳送回奇岩城鎮廣場。');
            return;
        }

        // 6. 瞬間移動卷軸 (40100, 140100, useType 6 / 29)
        if (it.useType === 6 || it.useType === 29 || it.itemId === 40100 || it.itemId === 140100) {
            this.consumeItem(it.id, 1);
            const bmId = args.d[0] || 0;
            const bm = bmId ? (ch.bookmarks || []).find(b => b.id === bmId) : null;
            if (bm) {
                this.teleportTo(bm.map, bm.x, bm.y, true);
            } else {
                this.randomTeleport(12);   // 落點要是空地（不會飛到牆外、塔外）
            }
            return;
        }

        // 7. 寶箱 / 袋子 (data/boxes.json)
        if (this.data.boxes[it.itemId]) {
            this.openBoxItem(it);
            return;
        }

        // 8. 魔法書、精靈水晶、技術書：照職業、等級學魔法（原本被當成一般道具：回 30 血、不會學）
        if (tpl.type === 'spellbook') {
            this.readSpellBook(it, entry ? entry.name : '');
            return;
        }

        // 9. 藥水與消耗品
        this.useConsumable(it);
    }

    toggleEquip(it, tpl) {
        const ch = this.curChar;
        if (it.equipped) {
            it.equipped = false;
            it.name = this.formatItemName(it);
            this.emit('invUpdate', Object.assign({}, it));
        } else {
            // 卸下同部位裝備（戒指最多可戴 2 顆）
            const sameSlot = ch.inv.filter(x => x.equipped && x.id !== it.id && x.useType === it.useType);
            const maxSlot = it.useType === 23 ? 2 : 1;
            while (sameSlot.length >= maxSlot) {
                const old = sameSlot.shift();
                old.equipped = false;
                old.name = this.formatItemName(old);
                this.emit('invUpdate', Object.assign({}, old));
            }
            it.equipped = true;
            it.name = this.formatItemName(it);
            this.emit('invUpdate', Object.assign({}, it));
        }
        this.recalcStats();
        this.sendOwnStatus();
        this.sendSpMr();
        this.emit('visual', { id: ch.id, weapon: ch.weaponVisual || 0 });
        this.save();
    }

    useEnchantScroll(scroll, targetObjId) {
        const ch = this.curChar;
        const target = (ch.inv || []).find(x => x.id === targetObjId);
        if (!target) return;
        const entry = this.data.itemsById.get(target.itemId);
        const tpl = entry ? entry.tpl : null;
        if (!tpl) return;

        this.consumeItem(scroll.id, 1);

        // 祝福賦予卷軸 (49908)
        if (scroll.itemId === 49908) {
            target.bless = 0;
            target.name = this.formatItemName(target);
            this.emit('itemColor', { id: target.id, bless: 0 });
            this.emit('invUpdate', Object.assign({}, target));
            this.emit('serverMsg', { id: 161, args: [displayName(target.nid), '$245', '$247'] });
            this.save();
            return;
        }

        const safe = tpl.safe != null ? tpl.safe : 6;
        const curEn = target.ench || 0;
        const isBlessed = scroll.bless === 0 || scroll.itemId === 49932;
        let success = true;
        if (curEn >= safe) {
            // 離線版友善強化機率：過安定值也有高達 65% 成功率（GM 無敵模式 100% 成功）
            const rate = this.gmRates.godMode ? 1.0 : Math.max(0.25, 0.75 - (curEn - safe) * 0.08);
            success = Math.random() < rate;
        }

        if (success) {
            let add = 1;
            if (isBlessed && curEn < safe) {
                add = curEn <= 2 ? [1, 2, 3][Math.floor(Math.random() * 3)] : [1, 2][Math.floor(Math.random() * 2)];
            }
            target.ench = curEn + add;
            target.name = this.formatItemName(target);
            this.emit('invUpdate', Object.assign({}, target));
            this.emit('itemStatus', Object.assign({}, target));
            this.emit('serverMsg', { id: 161, args: [displayName(target.nid), '$245', add > 1 ? '$248' : '$247'] });
            if (target.ench >= safe + 2) {
                this.emit('enhBroadcast', {
                    name: ch.name,
                    code: target.nid,
                    itemName: displayName(target.nid),
                    en0: curEn,
                    en1: target.ench,
                    bless: target.bless,
                    fail: false,
                    safe,
                    icon: target.gfx,
                });
            }
            this.recalcStats();
            this.sendOwnStatus();
            this.sendSpMr();
        } else {
            // 失敗不爆裝，改為「發出強烈的光芒，但是沒有任何事情發生」(160)，單機遊玩更舒心！
            this.emit('serverMsg', { id: 160, args: [displayName(target.nid), '$245'] });
        }
        this.save();
    }

    enhanceBatch(scrollId, goal, ids) {
        const ch = this.curChar;
        if (!ch) return;
        let done = 0;
        for (const tid of ids || []) {
            const target = ch.inv.find(x => x.id === tid);
            const scroll = ch.inv.find(x => x.id === scrollId) || ch.inv.find(x => x.useType === 26 || x.useType === 27);
            if (!target || !scroll) break;
            while ((target.ench || 0) < goal && scroll.count > 0) {
                this.useEnchantScroll(scroll, target.id);
                done++;
                if (!ch.inv.includes(scroll)) break;
            }
        }
        this.sysMsg('一起強化完成：共強化 ' + done + ' 次。');
    }

    openBoxItem(it, all = false) {
        const list = this.data.boxes[it.itemId];
        if (!list || !list.length) return;
        const times = all ? it.count : 1;
        this.consumeItem(it.id, times);
        for (let t = 0; t < times; t++) {
            const pick = list[Math.floor(Math.random() * list.length)];
            const [rid, rqty] = pick;
            const inst = this.giveItem(rid, rqty || 1, 0, 1);
            if (inst && times <= 5) {
                this.sysMsg('打開獲得：' + (displayName(inst.nid) || inst.name) + (rqty > 1 ? ' ×' + rqty : ''));
            }
        }
        if (times > 5) this.sysMsg('已全部開啟 ' + times + ' 個箱子！');
        this.save();
    }

    boxOpenAll(objId) {
        const it = (this.curChar && this.curChar.inv || []).find(x => x.id === objId);
        if (it) this.openBoxItem(it, true);
    }

    useConsumable(it) {
        const ch = this.curChar;
        const iid = it.itemId;
        // 治癒藥水系列
        const HEAL_MAP = HEAL_POTS;
        if (HEAL_MAP[iid] || /治癒藥水|體力恢復劑|麵包/.test(displayName(it.nid))) {
            const heal = HEAL_MAP[iid] || 45;
            ch.hp = Math.min(ch.maxHp, ch.hp + heal + Math.floor(Math.random() * 12));
            this.consumeItem(it.id, 1);
            this.emit('effect', { id: ch.id, gfx: 189 });
            this.sendOwnStatus();
            if (this.autoOn && this.autoLog) this.autoLog.potions += 1;
            return;
        }
        // 加速藥水 (綠水)
        if (iid === 40013 || iid === 40018 || iid === 140013 || iid === 140018 || iid === 41338) {
            const sec = (iid === 40018 || iid === 140018 || iid === 41338) ? 1800 : 300;
            this.consumeItem(it.id, 1);
            this.addEffect(1001, sec);
            this.emit('haste', { id: ch.id, type: 1, time: sec });
            this.emit('effect', { id: ch.id, gfx: 191 });
            return;
        }
        // 二段加速 (勇敢藥水、精靈餅乾、惡魔之血、名譽貨幣、生命之樹果實)
        if ([40014, 140014, 41415, 49305, 40068, 140068, 49304, 40031, 49158, 40733].includes(iid)) {
            const sec = 600;
            this.consumeItem(it.id, 1);
            const effId = [40068, 140068, 49304].includes(iid) ? 1016 : 1000;
            this.addEffect(effId, sec);
            this.emit('brave', { id: ch.id, type: effId === 1016 ? 3 : 1, time: sec });
            this.emit('effect', { id: ch.id, gfx: 751 });
            return;
        }
        // 三段加速 (巧克力蛋糕 49138)
        if (iid === 49138) {
            this.consumeItem(it.id, 1);
            this.addEffect(1027, 600);
            this.emit('liquor', { id: ch.id, type: 8 });
            this.emit('effect', { id: ch.id, gfx: 8031 });
            return;
        }
        // 藍色藥水 / 智慧貨幣
        if (iid === 40015 || iid === 140015 || iid === 40736) {
            this.consumeItem(it.id, 1);
            this.addEffect(iid === 40736 ? 1028 : 1002, 600);
            this.emit('effect', { id: ch.id, gfx: 190 });
            return;
        }
        // 精神藥水 (補 MP)
        if (iid === 40042) {
            this.consumeItem(it.id, 1);
            ch.mp = Math.min(ch.maxMp, ch.mp + 50);
            this.sendOwnStatus();
            return;
        }
        // 慎重藥水 (魔攻 +2，5 分鐘)
        if (iid === 40016 || iid === 140016) {
            this.consumeItem(it.id, 1);
            this.addEffect(1004, 300);
            this.emit('effect', { id: ch.id, gfx: 750 });
            return;
        }
        // 經驗藥水 (150%～250%，30 分鐘)
        if (iid >= 47000 && iid <= 47004) {
            this.consumeItem(it.id, 1);
            ch.expPotPct = 150 + (iid - 47000) * 25;
            ch.expPotUntil = Date.now() + 1800000;
            this.sysMsg('喝下經驗藥水：30 分鐘內狩獵經驗 ' + ch.expPotPct + '%。');
            return;
        }
        // 魔法卷軸 (魔法屏障)
        if (iid === 40889) {
            this.consumeItem(it.id, 1);
            this.addEffect(31, 64);
            this.emit('effect', { id: ch.id, gfx: 2234 });
            return;
        }
        // 回憶蠟燭 (重新分配能力值)
        if (iid === 49142) {
            this.charReset(1);
            return;
        }
        // 預設一般道具：回血回魔
        ch.hp = Math.min(ch.maxHp, ch.hp + 30);
        this.sendOwnStatus();
    }

    applyPoly(polyName, sec = 1800) {
        const ch = this.curChar;
        if (!ch) return;
        if (!polyName) {
            ch.polyGfx = 0;
            delete (ch.effects || {})[67];
            this.emit('poly', { id: ch.id, gfx: ch.gfx, weapon: ch.weaponVisual || 0 });
            this.sendEffects();
            return;
        }
        const p = this.data.polys.find(x => String(x.n).toLowerCase() === String(polyName).toLowerCase() || x.c === polyName);
        const gfx = p ? p.g : 110; // 預設黑騎士
        ch.polyGfx = gfx;
        this.addEffect(67, sec);
        this.emit('poly', { id: ch.id, gfx, weapon: ch.weaponVisual || 0 });
        this.emit('effect', { id: ch.id, gfx: 6082 });
    }

    // ── 施放魔法與學習魔法 ──
    useSkill(skillId, t) {
        const ch = this.curChar;
        if (!ch) return;
        const sk = this.data.skills.find(s => s.sid === skillId);
        if (!sk) return;

        if (ch.mp < (sk.mp || 0)) {
            this.sysMsg('魔力不足，無法施放「' + sk.name + '」。');
            return;
        }
        ch.mp = Math.max(0, ch.mp - (sk.mp || 0));
        if (sk.hp > 0 && ch.hp > sk.hp) ch.hp -= sk.hp;
        this._castAt = Date.now();

        // 召喚術 (51)、召喚屬性精靈 (154)、召喚強力屬性精靈 (162)
        if (skillId === 51 || skillId === 154 || skillId === 162) {
            this.castSummon(sk);
            this.emit('effect', { id: ch.id, gfx: sk.gfx || 744 });
            this.sendOwnStatus();
            return;
        }

        // 瞬間移動術 (sid === 5)
        if (skillId === 5) {
            const bmId = t && t.bm ? t.bm : 0;
            const bm = bmId ? (ch.bookmarks || []).find(b => b.id === bmId) : null;
            if (bm) this.teleportTo(bm.map, bm.x, bm.y, true);
            else this.randomTeleport(10);   // 落點要是空地（不會飛到牆外、塔外）
            return;
        }

        // 魂體轉換 (sid === 131) 或心靈轉換
        // 心靈轉換 (130)：體力換 2 點魔力；魂體轉換 (146)：換 12 點（體力在上面照技能表扣）
        if (skillId === 130 || skillId === 146) {
            ch.mp = Math.min(ch.maxMp, ch.mp + (sk.mp || 0) + (skillId === 146 ? 12 : 2));
            this.emit('effect', { id: ch.id, gfx: sk.gfx || 744 });
            this.sendOwnStatus();
            return;
        }

        const targetId = t && t.id ? t.id : this.autoTargetId;
        const targetMob = this.mapMobs.find(m => m.id === targetId && !m.dead);

        // 治癒類魔法 (初級/中級/高級/全部/生祝)：對不死系怪物轉為神聖攻擊
        if (/治癒|祝福/.test(sk.name) && (sk.type === 16 || sk.target === 'buff')) {
            if (targetMob && targetMob.isUndead) {
                // 對不死怪神聖重擊！
                const spBonus = 1 + (ch.sp || 0) * 0.08 + Math.max(0, (ch.int || 12) - 12) * 0.05;
                const holyDmg = Math.max(15, Math.round(((sk.dv || 5) * (sk.dd || 6) + (ch.int || 12) * 3) * spBonus));
                targetMob.hp = Math.max(0, targetMob.hp - holyDmg);
                targetMob.aggro = true;
                const dir = this.dirBetween(ch.x, ch.y, targetMob.x, targetMob.y);
                ch.heading = dir;
                this.emit('rangeSkill', {
                    act: sk.act || 18, atk: ch.id, x: ch.x, y: ch.y, heading: dir,
                    gfx: sk.gfx || 744, type: 8, targets: [targetMob.id],
                });
                this.emit('attack', {
                    act: sk.act || 18, atk: ch.id, tgt: targetMob.id, dmg: holyDmg, heading: dir,
                    gfx: 0, use: 0, x: ch.x, y: ch.y, tx: targetMob.x, ty: targetMob.y,
                });
                this.emit('hpMeter', { id: targetMob.id, ratio: Math.max(0, Math.min(100, Math.round((targetMob.hp / targetMob.maxHp) * 100))) });
                if (targetMob.hp <= 0) this.onMobKilled(targetMob);
                this.sendOwnStatus();
                return;
            }

            const heal = (sk.dv || 5) * (sk.dd || 6) + (ch.int || 12) * 3 + (ch.sp || 0) * 4;
            ch.hp = Math.min(ch.maxHp, ch.hp + heal);
            this.emit('effect', { id: ch.id, gfx: sk.gfx || 744 });
            this.sendOwnStatus();
            return;
        }

        // 攻擊魔法 (單體與 AoE 範圍魔法)
        if (sk.target === 'attack' || /光箭|烈炎|龍捲|火球|雷電|極道|冰雪|流星|震裂|暗黑/.test(sk.name)) {
            const mob = targetMob || this.mapMobs.find(m => !m.dead);
            if (!mob) {
                this.sendOwnStatus();
                return;
            }
            const dir = this.dirBetween(ch.x, ch.y, mob.x, mob.y);
            ch.heading = dir;

            // 3.50C 魔法傷害公式：(dv + (1~dd)*dc) * (1 + SP*0.08 + (INT-12)*0.05) * MR減免
            const calcMagicDmg = (m) => {
                const baseDice = (sk.dv || 4) + (sk.dd && sk.dc ? (Math.floor(Math.random() * sk.dd) + 1) * sk.dc : 10);
                const spBonus = 1 + (ch.sp || 0) * 0.08 + Math.max(0, (ch.int || 12) - 12) * 0.05;
                const mrRed = Math.max(0.2, 1 - (m.mr || 10) / 200);
                let finalDmg = Math.round(baseDice * spBonus * mrRed);
                if (this.gmRates.oneHit) finalDmg = Math.max(9999, m.hp);
                return Math.max(1, finalDmg);
            };

            // 判斷是否為範圍魔法 (AoE)
            const isAoe = (sk.area && sk.area > 0) || [28, 45, 57, 68, 78, 80].includes(skillId) || /火球|流星|龍捲|冰雪|極道/.test(sk.name);
            const hitMobs = isAoe
                ? this.mapMobs.filter(m => !m.dead && Math.max(Math.abs(m.x - mob.x), Math.abs(m.y - mob.y)) <= 3)
                : [mob];

            this.emit('rangeSkill', {
                act: sk.act || 18, atk: ch.id, x: ch.x, y: ch.y, heading: dir,
                gfx: sk.gfx || 167, type: 8, targets: hitMobs.map(m => m.id),
            });

            for (const m of hitMobs) {
                const mdmg = calcMagicDmg(m);
                m.hp = Math.max(0, m.hp - mdmg);
                m.aggro = true;
                this.emit('attack', {
                    act: sk.act || 18, atk: ch.id, tgt: m.id, dmg: mdmg, heading: dir,
                    gfx: 0, use: 0, x: ch.x, y: ch.y, tx: m.x, ty: m.y,
                });
                this.emit('hpMeter', { id: m.id, ratio: Math.max(0, Math.min(100, Math.round((m.hp / m.maxHp) * 100))) });
                if (m.hp <= 0) this.onMobKilled(m);
            }
            this.sendOwnStatus();
            return;
        }

        // 輔助狀態魔法
        const dur = sk.dur > 0 ? sk.dur : 600;
        this.addEffect(skillId, dur);
        if (skillId === 43 || skillId === 54) this.emit('haste', { id: ch.id, type: 1, time: dur });
        this.emit('effect', { id: ch.id, gfx: sk.gfx || 744 });
        this.sendOwnStatus();
    }

    learnMagicList() {
        this.sendLearnMagicList();
    }

    // ── 學魔法：照連線版的職業、等級規則（data/skill-learn.json；畫面魔法視窗、魔法書按鈕也用同一份）──
    //   技能視窗的「解除限制」打開（state.skillFree）＝什麼職業、幾級都能學
    skillFree() { return !!(this.state && this.state.skillFree); }
    // 職業 type 學 sid 要幾級；null＝這個職業學不到
    skillReqLv(sid, type) {
        const sk = this.data.skills.find(s => s.sid === sid);
        if (!sk) return null;
        const c = (this.data.skillLearn || {})[SKILL_CLS[type]];
        if (!c) return Math.max(1, (sk.lv || 1) * 4);   // 讀不到規則：舊算法
        const exc = c.exceptions || {};
        if (Object.prototype.hasOwnProperty.call(exc, String(sid))) return exc[sid] == null ? null : +exc[sid];
        const need = (c.levels || {})[sk.lv];
        return need == null ? null : +need;
    }
    // 能不能學：{ ok, code（protocol.js 第 35 項的結果碼：3 等級不夠、4 不能學、5 已經學會）, msg }
    learnCheck(sid) {
        const ch = this.curChar, sk = this.data.skills.find(s => s.sid === sid);
        if (!ch || !sk) return { ok: false, code: 4, msg: '沒有這個魔法。' };
        if ((ch.skills || []).includes(sid)) return { ok: false, code: 5, msg: '已經學會「' + sk.name + '」了。' };
        if (this.skillFree()) return { ok: true };
        const need = this.skillReqLv(sid, ch.type);
        if (need == null) return { ok: false, code: 4, msg: '你的職業無法學習「' + sk.name + '」。' };
        if ((ch.level || 1) < need) return { ok: false, code: 3, msg: '等級 ' + need + ' 才能學習「' + sk.name + '」。' };
        // 妖精屬性魔法：要先選精靈屬性，而且要跟自己的屬性一樣
        if (ch.type === 2 && sk.lv >= 17 && ELF_ATTR_NAME[sk.attr]) {
            if (!ch.elfAttr) return { ok: false, code: 4, msg: '「' + sk.name + '」是' + ELF_ATTR_NAME[sk.attr] + '屬性魔法，請先選擇精靈屬性。' };
            if (ch.elfAttr !== sk.attr) return { ok: false, code: 4, msg: '「' + sk.name + '」是' + ELF_ATTR_NAME[sk.attr] + '屬性魔法，你的精靈屬性是' + (ELF_ATTR_NAME[ch.elfAttr] || '其他') + '。' };
        }
        return { ok: true };
    }
    learnPrice(sk) { return Math.max(1000, (sk.lv || 1) * 5000); }

    sendLearnMagicList(result = 0, sid = 0) {
        const ch = this.curChar;
        if (!ch) return;
        const free = this.skillFree(), list = [];
        for (const sk of this.data.skills) {
            const need = free ? 1 : this.skillReqLv(sk.sid, ch.type);
            if (need == null) continue;   // 這個職業學不到的不列
            list.push({ sid: sk.sid, lv: need, reqLv: need, price: this.learnPrice(sk), book: 40169, attr: sk.attr || 0 });
        }
        this.emit('learnMagic', {
            result, res: result, sid, list, skillFree: free,
            elfAttr: ch.elfAttr || 0, elfReset: ELF_RESET_PRICE, reset: ELF_RESET_PRICE,   // main.js 讀的是 reset
        });
    }

    learnMagic(sid) {
        const ch = this.curChar;
        if (!ch) return;
        const sk = this.data.skills.find(s => s.sid === sid);
        const chk = this.learnCheck(sid);
        if (!chk.ok) { this.sysMsg(chk.msg); this.sendLearnMagicList(chk.code, sid); return; }
        const price = this.learnPrice(sk);
        if (!this.spendGold(price)) { this.sysMsg('金幣不足，學習「' + sk.name + '」需要 ' + price.toLocaleString() + ' 金幣。'); this.sendLearnMagicList(2, sid); return; }
        this.addSkill(sid);
        this.sendLearnMagicList(1, sid);
    }
    addSkill(sid) {
        const ch = this.curChar, sk = this.data.skills.find(s => s.sid === sid);
        if (!ch.skills) ch.skills = [];
        if (!ch.skills.includes(sid)) ch.skills.push(sid);
        this.sendSkills();
        this.emit('effect', { id: ch.id, gfx: 224 });
        if (sk) this.sysMsg('學會了「' + sk.name + '」。');
        this.save();
    }
    // 讀魔法書／精靈水晶／技術書：名字括號裡的魔法；學得會才扣書
    readSpellBook(it, bookName) {
        const m = /[(（]([^()（）]+)[)）]\s*$/.exec(bookName || '');
        const sk = m ? this.data.skills.find(s => s.name === m[1].trim()) : null;
        if (!sk) { this.sysMsg('這本書上的魔法還無法學習。'); return; }
        const chk = this.learnCheck(sk.sid);
        if (!chk.ok) { this.sysMsg(chk.msg); return; }
        this.consumeItem(it.id, 1);
        this.addSkill(sk.sid);
    }
    // 技能視窗「解除限制」：打開後學魔法不看職業、等級；再按一次恢復
    skillLimitToggle(on) {
        if (!this.state) return;
        this.state.skillFree = on == null ? !this.state.skillFree : !!on;
        this.save();
        this.sysMsg(this.state.skillFree ? '🔓 已解除學習魔法的限制：任何職業、等級都能學全部魔法。' : '🔒 已恢復學習魔法的限制：照職業和等級學習。');
        this.sendLearnMagicList();
    }

    learnAllMagic() {
        const ch = this.curChar;
        if (!ch) return;
        // 有限制時：只學職業、等級學得到的（妖精屬性魔法照自己的屬性）；按了「解除限制」＝全部
        const add = this.data.skills.filter(s => !ch.skills.includes(s.sid) && this.learnCheck(s.sid).ok).map(s => s.sid);
        ch.skills = ch.skills.concat(add);
        this.sendSkills();
        this.sendLearnMagicList();
        this.emit('effect', { id: ch.id, gfx: 224 });
        this.sysMsg(this.skillFree() ? '✨ 已一鍵學會全部魔法！' : '✨ 已一鍵學會目前職業、等級學得到的 ' + add.length + ' 個魔法（要全部學會可按技能視窗的「解除限制」）。');
        this.save();
    }

    // ── AUTO 自動狩獵與掛機設定 ──
    autoFocus(id) {
        this.autoTargetId = id | 0;
    }

    autoState() {
        if (this.autoLog) this.emit('autoLog', Object.assign({}, this.autoLog));
    }

    autoLogReset() {
        if (!this.autoLog) return;
        this.autoLog.start = Math.floor(Date.now() / 1000);
        this.autoLog.sec = 0;
        this.autoLog.exp = 0;
        this.autoLog.gold = 0;
        this.autoLog.kills = 0;
        this.autoLog.potions = 0;
        this.autoLog.items = [];
        this.autoLog.mobs = [];
        this.emit('autoLog', Object.assign({}, this.autoLog));
    }

    // ── NPC 對話、商店買賣、倉庫、製作工匠 ──
    npcTalk(objId) {
        const npc = this.objs.get(objId) || this.mapNpcs.find(n => n.id === objId);
        if (!npc) return;
        // 畫面是先送 npcTalk、再開 NPC 視窗（main.js talkNow）；離線版是同步回的 → 回得比視窗開還早，視窗收不到（魔法商人整頁空白）。等視窗開好再回
        setTimeout(() => {
            if (npc.title === '魔法商人' || npc.name === '倫德羅') {
                this.emit('npcHtml', { id: npc.id, html: 'bs_01', data: [String(BS_PRICE), '43:1800,79:1800,151:1800,158:1800,160:1800,115:1800', '148:1800', '149:1800'] });
                return;
            }
            if (npc.title === '旅館老闆') {   // 「旅館」分頁；資料帶有沒有這間的鑰匙（到期的先收回）
                this.innCheckout(npc.key);
                this.emit('npcHtml', { id: npc.id, html: 'inn', data: [this.innKeyOf(npc) ? '1' : '0'] });
                return;
            }
            this.emit('npcHtml', { id: npc.id, html: 'shop', data: [] });
        }, 0);
    }

    npcAction(objId, action) {
        const ch = this.curChar;
        if (!ch) return;
        const act = String(action || '').trim();

        // 寵物商（羅德尼等）：「buypet 寵物編號」→ 扣錢、給一個裝著 Lv5 寵物的項圈
        if (act.startsWith('buypet ')) { this.petBuy(act); return; }
        // 夥伴視窗按「解散」寵物：放生（項圈消失）
        if (act === 'dismiss' && this.pet && this.pet.id === objId) { this.petRelease(); return; }

        const who = this.objs.get(objId) || this.mapNpcs.find(n => n.id === objId);
        // 旅館老闆：租房間＝付錢拿一把這間的鑰匙（一次一把）
        if (act === 'room' && who && who.title === '旅館老闆') { this.innRent(who); return; }
        if (act === 'enter' && who && who.title === '旅館老闆') {   // 有鑰匙時的「傳送」
            if (this.innCheckout(who.key)) { this.emit('npcHtml', { id: who.id, html: 'inn', data: ['0'] }); return; }
            const k = this.innKeyOf(who);
            if (k) this.innGo(k, who); else this.emit('npcHtml', { id: who.id, html: 'inn', data: ['0'] });
            return;
        }
        // 經驗恢復神女、贖罪的神女：離線版死亡不扣經驗，沒有要恢復的
        if (act === 'exp' || act === 'expd') { this.sysMsg('你沒有需要恢復的經驗值。'); return; }

        if (act === 'buy') {
            const items = this.getShopBuyList(objId);
            this.emit('shopBuy', { npc: objId, npcId: objId, tax: 0, items });
            return;
        }
        if (act === 'sell') {
            const items = [];
            for (const it of ch.inv || []) {
                if (it.equipped || it.itemId === GOLD_ID || it.itemId === HOME_STONE) continue;
                const price = this.data.shopsell[it.itemId] || 50;
                items.push({ id: it.id, price });
            }
            if (!items.length) this.emit('npcHtml', { id: objId, html: 'nosell', data: [] });
            else this.emit('shopSell', { npc: objId, npcId: objId, items });
            return;
        }
        if (act === 'retrieve' || act === 'retrieve-pledge') {
            const wh = this.state.warehouse || [];
            const kind = act === 'retrieve-pledge' ? 5 : 3;
            this.emit('retrieveList', { npc: objId, npcId: objId, kind, type: kind, fee: 30, feeEq: 30, price: 30, items: wh });
            return;
        }
        // 魔法商人一鍵滿狀態 ('a' 近戰火焰武器 / 'b' 遠程風之神射)
        const talkNpc = this.objs.get(objId) || this.mapNpcs.find(n => n.id === objId);
        if ((act === 'a' || act === 'b') && talkNpc && talkNpc.title === '魔法商人') {
            if (!this.spendGold(BS_PRICE)) {
                this.emit('npcHtml', { id: objId, html: 'bs_adena', data: [String(BS_PRICE)] });
                return;
            }
            this.sendOwnStatus && this.sendOwnStatus();
            for (const sid of [43, 79, 151, 158, 160, 115, act === 'a' ? 148 : 149]) {
                this.addEffect(sid, 1800);
            }
            this.emit('haste', { id: ch.id, type: 1, time: 1800 });
            this.emit('effect', { id: ch.id, gfx: 830 });
            this.emit('npcHtml', { id: objId, html: 'bs_done', data: ['10000', '43:1800,79:1800,151:1800,158:1800,160:1800,115:1800', '148:1800', '149:1800'] });
            this.sysMsg('✨ 已施加全套強化魔法增益（持續 30 分鐘）！');
            return;
        }
        // 妖精選定精靈屬性
        const ELF_MAP = { fire: [2, 1], water: [4, 2], air: [8, 3], earth: [1, 4] };
        if (ELF_MAP[act]) {
            if (ch.type !== 2 || ch.elfAttr) return;   // 只有妖精能選；已經有屬性要先去除（畫面自己會說）
            ch.elfAttr = ELF_MAP[act][0];
            this.emit('elfMsg', ELF_MAP[act][1]);
            this.sendLearnMagicList();
            this.save();
            return;
        }
        if (act === 'init') {
            if (!ch.elfAttr) return;   // 沒有屬性：畫面自己說「還沒有屬性」
            if (!this.spendGold(ELF_RESET_PRICE)) {
                this.sysMsg('金幣不足，去除精靈力需要 ' + ELF_RESET_PRICE.toLocaleString() + ' 金幣。');
                return;
            }
            ch.elfAttr = 0;
            this.emit('serverMsg', { id: 678, args: [] });   // 「感覺到在身上有的精靈力量被空氣中融化。」→ 畫面換回四張屬性卡
            this.sendLearnMagicList();
            this.save();
            return;
        }
        // 傳送師：照 NPC 的傳送清單（data/npcfn.json）扣錢、傳到目的地（js/offline-auto.js npcTeleport）
        this.npcTeleport(objId, act);
    }

    // ── 旅館 ──
    //   照連線版：租了拿到一把這間的鑰匙，鑰匙沒到期都能進房間（連線版是拿著鑰匙走進旅館門口，鑰匙不會用掉）。
    //   離線版：租好直接傳進房間；有還能用的鑰匙時旅館老闆改成「傳送」；到期的鑰匙回收、說「感謝使用，退房已經處理完畢」，就能再租
    //   房間：旅館老闆附近那個「→ 旅館房間」的門（data/portals.json），落點跟走門進去一樣（房間出口旁邊一格；奇岩 18432 是 32744,32803，同連線版）
    innRoomOf(npc) {
        const pts = ((this.data.portals && this.data.portals[npc.mapId != null ? npc.mapId : this.curChar.mapId]) || []).filter(p => /旅館/.test(p.t || ''));
        let best = null, bd = 40;
        for (const p of pts) { const d = Math.max(Math.abs(p.x - npc.x), Math.abs(p.y - npc.y)); if (d <= bd) { bd = d; best = p; } }
        if (!best) return null;
        const out = ((this.data.portals && this.data.portals[best.to]) || [])[0];
        return out ? { map: best.to, x: out.x + (out.x > 32700 ? -1 : 1), y: out.y } : { map: best.to, x: 32744, y: 32803 };
    }
    innExpired(key) {
        if (!key.innUntil) { key.innUntil = Date.now() + INN_HOURS * 3600000; return false; }   // 舊存檔的鑰匙沒有期限：從現在起算
        return Date.now() >= key.innUntil;
    }
    // 到期的鑰匙收回去（only＝只收這間的）；收了回傳 true
    innCheckout(onlyKey) {
        const ch = this.curChar;
        const old = (ch.inv || []).filter(it => it.itemId === INN_KEY && (!onlyKey || it.inn === onlyKey) && this.innExpired(it));
        if (!old.length) return false;
        for (const it of old) this.consumeItem(it.id, it.count || 1);
        this.sysMsg('感謝使用，退房已經處理完畢');
        this.save();
        return true;
    }
    innKeyOf(npc) {
        return (this.curChar.inv || []).find(it => it.itemId === INN_KEY && it.inn === npc.key && !this.innExpired(it)) || null;
    }
    innGo(key, npc) {
        const room = (key && key.innRoom) || (npc && this.innRoomOf(npc));
        if (!room) { this.sysMsg('這間旅館沒有房間。'); return false; }
        const left = key && key.innUntil ? Math.max(1, Math.ceil((key.innUntil - Date.now()) / 60000)) : 0;
        this.teleportTo(room.map, room.x, room.y, true);
        this.sysMsg('進入旅館房間。' + (left ? '鑰匙還能用 ' + (left >= 60 ? Math.floor(left / 60) + ' 小時 ' + (left % 60) + ' 分' : left + ' 分') + '。' : ''));
        return true;
    }
    innRent(npc) {
        this.innCheckout(npc.key);
        const has = this.innKeyOf(npc);
        if (has) { this.innGo(has, npc); return; }   // 已經有還能用的鑰匙：直接傳送，不再收錢
        const room = this.innRoomOf(npc);
        if (!room) { this.sysMsg('這間旅館沒有房間可以租。'); return; }
        if (!this.spendGold(INN_PRICE)) { this.emit('npcHtml', { id: npc.id, html: 'inn3', data: [] }); return; }
        const key = this.makeItemInstance(INN_KEY, 1, 0, null, false);
        key.inn = npc.key;   // 哪一間的鑰匙（不跟別間的疊在一起）
        key.innRoom = room;
        key.innUntil = Date.now() + INN_HOURS * 3600000;
        key.name = this.formatItemName(key);
        this.addInvInstance(key);
        this.sysMsg('租好房間了，鑰匙可以用 ' + INN_HOURS + ' 小時。');
        this.innGo(key, npc);   // 買好直接傳進房間
        this.save();
    }
    // 背包用鑰匙：沒到期＝傳進房間（鑰匙留著）；到期＝收回
    innRest(key) {
        if (this.innExpired(key)) {
            this.consumeItem(key.id, key.count || 1);
            this.sysMsg('感謝使用，退房已經處理完畢');
            this.save();
            return;
        }
        if (!key.innRoom) {   // 舊存檔的鑰匙：找租的那間旅館
            const npc = this.mapNpcs.find(n => n.key === key.inn) || null;
            if (npc) key.innRoom = this.innRoomOf(npc);
        }
        if (this.innGo(key, null)) this.save();
    }

    getShopBuyList(objId) {
        // 這個商人在連線版賣什麼（data/npcshop.json）：有就照它；沒抄到的商人才用下面那份通用清單
        const npc = objId && (this.objs.get(objId) || this.mapNpcs.find(n => n.id === objId));
        const own = npc && npc.key && ((npc.mapKey && this.data.npcshop[npc.mapKey]) || this.data.npcshop[npc.key]);
        if (own && own.length) {
            const list = [];
            for (const [iid, price, pack] of own) {
                const entry = this.data.itemsById.get(iid) || this.data.itemsById.get(iid % 100000);
                if (!entry) continue;
                list.push({ order: list.length, itemId: iid, packCount: pack || 1, gfx: entry.tpl.ig || 34, price, name: entry.name + (pack > 1 ? ' (' + pack + ')' : ''), st: null });
            }
            if (list.length) return list;
        }
        const popularIds = [
            40029, 40010, 40011, 40012, 40013, 40018, 40014, 40068, 40031, 40733, 40015, 40017,
            49138, 40088, 40100, 140100, 40126, 40087, 40074, 140087, 140074, 49908, 40744, 41246, 40318,
            PET_FLUTE,
            35, 54, 174, 181, 20011, 20028, 20085, 20110, 20137, 20173, 20194, 20219, 20288,
        ];
        const list = [];
        const seen = new Set();
        for (const iid of popularIds.concat(this.data.shopitems.slice(0, 60))) {
            if (seen.has(iid)) continue;
            seen.add(iid);
            const entry = this.data.itemsById.get(iid) || this.data.itemsById.get(iid % 100000);
            if (!entry) continue;
            const sb = this.data.shopbuy[iid] || [100, 1, 100, 0];
            const isBlessed = iid >= 100000;
            const name = (isBlessed ? '受祝福的 ' : '') + entry.name + (sb[1] > 1 ? ' (' + sb[1] + ')' : '');
            list.push({
                order: list.length,
                itemId: iid,
                packCount: sb[1] || 1,
                gfx: entry.tpl.ig || 34,
                price: sb[0] || 100,
                name,
                st: null,
            });
        }
        return list;
    }

    npcResult(objId, type, pairs) {
        const ch = this.curChar;
        if (!ch || !Array.isArray(pairs)) return;
        const shopList = type === 0 ? this.getShopBuyList(objId) : [];

        if (type === 0) {
            // 商店購買
            for (const [order, qty] of pairs) {
                const row = shopList[order];
                if (!row) continue;
                // 魔法書、精靈水晶、技術書：買了直接學（同連線版第 133 項）；職業、等級不合就不賣、不扣錢
                const be = this.data.itemsById.get(row.itemId);
                if (be && be.tpl && be.tpl.type === 'spellbook') {
                    const m = /[(（]([^()（）]+)[)）]\s*$/.exec(be.name || row.name || '');
                    const sk = m ? this.data.skills.find(s => s.name === m[1].trim()) : null;
                    if (sk) {
                        const chk = this.learnCheck(sk.sid);
                        if (!chk.ok) { this.sysMsg(chk.msg); continue; }
                        if (!this.spendGold(row.price || 10)) { this.sysMsg('金幣不足，無法購買 ' + (row.name || sk.name) + '。'); break; }
                        this.addSkill(sk.sid);
                        this.sendLearnMagicList();
                        continue;
                    }
                }
                const totalCost = (row.price || 10) * Math.max(1, qty);
                if (!this.spendGold(totalCost)) {
                    this.sysMsg('金幣不足，無法購買 ' + row.name + '。');
                    break;
                }
                this.giveItem(row.itemId, (row.packCount || 1) * Math.max(1, qty));
            }
            this.save();
        } else if (type === 1) {
            // 商店賣出
            let totalEarned = 0;
            for (const [itemObjId, qty] of pairs) {
                const it = ch.inv.find(x => x.id === itemObjId);
                if (!it) continue;
                const n = Math.min(it.count, Math.max(1, qty));
                const unitPrice = this.data.shopsell[it.itemId] || 50;
                totalEarned += unitPrice * n;
                this.consumeItem(it.id, n);
            }
            if (totalEarned > 0) this.giveItem(GOLD_ID, totalEarned);
            this.save();
        } else if (type === 2 || type === 4) {
            // 個人倉庫存入 (type 2) / 血盟倉庫存入 (type 4)
            const feePerItem = 30;
            const totalFee = feePerItem * pairs.length;
            if (!this.spendGold(totalFee)) {
                this.sysMsg('金幣不足，存入每件需收取 30 金幣保管費。');
                return;
            }
            if (!this.state.warehouse) this.state.warehouse = [];
            for (const [itemObjId, qty] of pairs) {
                const it = ch.inv.find(x => x.id === itemObjId);
                if (!it || it.equipped) continue;
                const n = Math.min(it.count, Math.max(1, qty));
                // 放入倉庫
                const existingWh = this.state.warehouse.find(w => w.itemId === it.itemId && w.ench === it.ench && w.bless === it.bless && !it.isEquipment);
                if (existingWh) {
                    existingWh.count += n;
                } else {
                    this.state.warehouse.push({
                        id: this.allocItemId(),
                        itemId: it.itemId,
                        name: it.name,
                        count: n,
                        ench: it.ench || 0,
                        bless: it.bless != null ? it.bless : 1,
                        isEquipment: it.isEquipment || false,
                    });
                }
                this.consumeItem(it.id, n);
            }
            this.save();
            const kind = type === 4 ? 5 : 3;
            this.emit('retrieveList', { npc: objId, npcId: objId, kind, type: kind, fee: 30, feeEq: 30, price: 30, items: this.state.warehouse });
            this.sysMsg('道具已成功存入倉庫！');
        } else if (type === 3 || type === 5) {
            // 個人倉庫取回 (type 3) / 血盟倉庫取回 (type 5)
            const feePerItem = 30;
            const totalFee = feePerItem * pairs.length;
            if (!this.spendGold(totalFee)) {
                this.sysMsg('金幣不足，領取每件需收取 30 金幣手續費。');
                return;
            }
            if (!this.state.warehouse) this.state.warehouse = [];
            for (const [itemObjId, qty] of pairs) {
                const idx = this.state.warehouse.findIndex(w => w.id === itemObjId);
                if (idx < 0) continue;
                const whItem = this.state.warehouse[idx];
                const n = Math.min(whItem.count, Math.max(1, qty));
                this.giveItem(whItem.itemId, n, whItem.ench, whItem.bless);
                whItem.count -= n;
                if (whItem.count <= 0) {
                    this.state.warehouse.splice(idx, 1);
                }
            }
            this.save();
            const kind = type === 5 ? 5 : 3;
            this.emit('retrieveList', { npc: objId, npcId: objId, kind, type: kind, fee: 30, feeEq: 30, price: 30, items: this.state.warehouse });
            this.sysMsg('道具已成功從倉庫領出！');
        } else if (type === 12) {
            // 寵物保管員「領出」：付 1,000 金幣把項圈裡的寵物叫出來（寄放＝夥伴視窗的 compDismiss）
            const col = (pairs[0] && ch.inv.find(x => x.id === pairs[0][0])) || null;
            if (!col || !col.pet) { this.sysMsg('找不到這個寵物項圈。'); return; }
            if (this.pet && this.pet.collar === col.id) { this.sysMsg('「' + col.pet.name + '」已經在你身邊了。'); return; }
            if (!this.spendGold(PET_KEEP_PRICE)) { this.sysMsg('金幣不足，領出寵物需要 ' + PET_KEEP_PRICE.toLocaleString() + ' 金幣。'); return; }
            this.petSummon(col);
            this.save();
        }
    }

    sellQuery(ids) {
        const ch = this.curChar;
        if (!ch) return;
        const list = [];
        const targets = ids && ids.length ? ch.inv.filter(x => ids.includes(x.id)) : ch.inv;
        for (const it of targets) {
            if (it.equipped || it.itemId === GOLD_ID || it.itemId === HOME_STONE) continue;
            list.push({ id: it.id, price: this.data.shopsell[it.itemId] || 50 });
        }
        this.emit('sellInfo', list);
    }

    sellItem(reqId, objId, qty) {
        const ch = this.curChar;
        if (!ch) return;
        const it = ch.inv.find(x => x.id === objId);
        if (!it) {
            this.emit('sellResult', { reqId, objId, res: 1, qty: 0, gold: 0 });
            return;
        }
        const n = Math.min(it.count, Math.max(1, qty));
        const unit = this.data.shopsell[it.itemId] || 50;
        const gold = unit * n;
        this.consumeItem(it.id, n);
        this.giveItem(GOLD_ID, gold);
        this.emit('sellResult', { reqId, objId, res: 0, qty: n, gold });
        this.save();
    }

    // 製作工匠 (craft.js)
    craftList(npcId, acts) {
        const ch = this.curChar;
        if (!ch) return;
        // 找出對應的 NPC 配方表：動作代號（a、g、request …）很多 NPC 共用，只看第一個會抓到別隻的配方
        //   → 挑「畫面要的動作全部都有」的那隻，記住是哪隻（製作時照這隻的配方算，玩家 2026-11-13 回報二級黑魔石要黑暗之翼）
        const npcKey = this.craftKeyFor(npcId, acts, true);
        const recipes = npcKey ? (this.data.npcmake.npc[npcKey] || []) : [];
        const rows = [];
        for (const act of acts || []) {
            const r = recipes.find(x => x.a === act);
            const outs = r && r.o ? r.o.map(([id, n]) => ({ id: +id, n: +n })) : [];
            const mats = (r && r.m || []).map(([id, need]) => {
                const inv = this.countMat(+id);
                return { id: +id, need: +need, inv, bag: inv, wh: 0, st: inv >= +need ? 0 : 2 };
            });
            // 材料要夠才做得出來：可做數量＝每種材料 背包數量 ÷ 需要數量 取最小
            const max = r ? this.craftMax(r) : 0;
            const lack = max < 1 ? mats.filter(m => m.inv < m.need).map(m => ({ id: m.id, n: m.need - m.inv })) : [];
            rows.push({
                act,
                cond: 0,
                flags: 0,
                max,
                outs,
                mats,
                lack,
            });
        }
        this.emit('craftList', { npc: npcId, wh: true, recipes: rows, list: rows });
    }

    craftMake(npcId, act, n) {
        const ch = this.curChar;
        if (!ch) return;
        const key = this.craftKeyFor(npcId, [act], false);
        const recipe = key ? (this.data.npcmake.npc[key] || []).find(r => r.a === act) : null;
        if (!recipe) {
            this.emit('craftDone', { npc: npcId, act, res: 1, n: 0, count: 0, msg: '找不到這個配方' });
            return;
        }
        const want = Math.max(1, n | 0);
        const max = this.craftMax(recipe);
        if (max < 1) {
            const lack = (recipe.m || [])
                .map(([mid, mneed]) => ({ mid: +mid, short: +mneed - this.countMat(+mid) }))
                .filter(x => x.short > 0)
                .map(x => this.itemName(x.mid) + ' ' + x.short.toLocaleString());
            this.emit('craftDone', { npc: npcId, act, res: 1, n: 0, count: 0, msg: '材料不足，還缺：' + lack.join('、') });
            return;
        }
        const count = Math.min(want, max);
        // 先扣材料（全部確定夠了才扣），再給成品
        for (const [mid, mneed] of recipe.m || []) this.consumeMat(+mid, +mneed * count);
        for (const [oid, on] of recipe.o || []) {
            this.giveItem(+oid, (on || 1) * count);
        }
        const msg = count < want ? '材料不夠，只做了 ' + count.toLocaleString() + ' 個' : '';
        this.emit('craftDone', { npc: npcId, act, res: 0, n: count, count, msg });
        // 新手引導最後一步：20 級後在旅人諮詢員做象牙塔施法卷軸
        if ((recipe.o || []).some(([oid]) => +oid === 49311 || +oid === 49312)) this.tutNote('made');
        this.save();
    }

    // 這隻 NPC（畫面送的編號：世界裡的物件編號，或製作工匠視窗的 -npc 編號）用 npcmake.json 哪一隻的配方。
    //   查清單時（fresh）：挑包含全部動作、多出來的最少的那隻，記下來；製作時先用記下來的，沒記過才照動作找
    craftKeyFor(npcId, acts, fresh) {
        const all = this.data.npcmake.npc || {}, memo = this._craftKey || (this._craftKey = new Map());
        const want = (acts || []).filter(a => a != null);
        if (!want.length) return null;
        const has = (k, a) => Array.isArray(all[k]) && all[k].some(r => r.a === a);
        // 1. 世界裡的 NPC 物件身上就有 npcmake 的鍵；2. 製作工匠視窗不在同一張地圖＝負的 NPC 編號（craft.js CRAFTERS）
        const npc = (this.mapNpcs || []).find(n => n.id === npcId);
        let direct = npc && npc.key && all[npc.key] ? npc.key : null;
        if (!direct && npcId < 0) { const c = CRAFTERS.find(x => x.tid === -npcId); direct = c ? c.key : (-npcId === 81257 ? '$8481|7868' : null); }
        if (direct && want.some(a => has(direct, a))) { memo.set(npcId, direct); return direct; }
        if (!fresh) {
            const k = memo.get(npcId);
            if (k && want.every(a => has(k, a))) return k;
        }
        let best = null, bestHit = 0, bestExtra = Infinity;
        for (const [k, rs] of Object.entries(all)) {
            if (!Array.isArray(rs)) continue;
            const acts0 = new Set(rs.map(r => r.a));
            let hit = 0;
            for (const a of want) if (acts0.has(a)) hit++;
            if (!hit) continue;
            const extra = acts0.size - hit;
            if (hit > bestHit || (hit === bestHit && extra < bestExtra)) { best = k; bestHit = hit; bestExtra = extra; }
        }
        if (best && fresh) memo.set(npcId, best);
        return best;
    }

    // 配方材料：背包裡（不含穿在身上的）這種道具的總數；不可堆疊的道具每件分開算
    matMatch(it, itemId) {
        if (it.equipped) return false;
        if (it.itemId === itemId) return true;
        // 1xxxxx＝祝福版（存成本體 id＋bless 0）
        return itemId >= 100000 && itemId < 200000 && it.itemId === itemId - 100000 && it.bless === 0;
    }

    countMat(itemId) {
        let n = 0;
        for (const it of (this.curChar && this.curChar.inv) || []) if (this.matMatch(it, itemId)) n += it.count | 0;
        return n;
    }

    consumeMat(itemId, need) {
        // 先用強化值低的，避免吃掉玩家衝過的裝備
        const list = ((this.curChar && this.curChar.inv) || []).filter(it => this.matMatch(it, itemId)).sort((a, b) => (a.ench | 0) - (b.ench | 0));
        for (const it of list) {
            if (need <= 0) break;
            const use = Math.min(it.count | 0, need);
            this.consumeItem(it.id, use);
            need -= use;
        }
    }

    craftMax(recipe) {
        let max = 9999;
        for (const [mid, mneed] of recipe.m || []) {
            const need = Math.max(1, +mneed || 1);
            max = Math.min(max, Math.floor(this.countMat(+mid) / need));
        }
        return max;
    }

    itemName(itemId) {
        const base = itemId >= 100000 && itemId < 200000 && !this.data.itemsById.has(itemId) ? itemId - 100000 : itemId;
        const e = this.data.itemsById.get(base);
        return (e && (e.name || (e.tpl && e.tpl.name))) || (this.data.npcmake.items && this.data.npcmake.items[itemId] && this.data.npcmake.items[itemId][0]) || ('道具#' + itemId);
    }

    // ── 魔法娃娃系統 ──
    dollWear(id) {
        if (!this.curChar) return;
        this.curChar.dolls.worn = id | 0;
        this.sendDolls();
        this.sendEffects();
        this.emit('dollResult', { act: 1, res: 0, id: id | 0, extra: 0 });
        this.save();
    }

    dollUnwear() {
        if (!this.curChar) return;
        this.curChar.dolls.worn = 0;
        this.sendDolls();
        this.sendEffects();
        this.emit('dollResult', { act: 2, res: 0, id: 0, extra: 0 });
        this.save();
    }

    dollOpenBag() { this.openDollPack('bag', [1, 2]); }
    dollOpenBox() { this.openDollPack('box', [2, 3, 4]); }
    dollOpenBag2() { this.openDollPack('bag2', [1, 2, 3]); }

    openDollPack(key, tiers) {
        const ch = this.curChar;
        if (!ch || !ch.dolls) return;
        // 數量 0 不能開（原本會憑空補一個再開）：照連線版的做法不回結果、只重送清單，畫面收到就會停下來
        if (!((ch.dolls[key] | 0) > 0)) {
            ch.dolls[key] = 0;
            this.sysMsg('沒有' + (key === 'bag' ? '魔法娃娃的袋子' : key === 'box' ? '高級魔法娃娃的盒子' : '精緻魔法娃娃的袋子') + '可以開了。');
            this.sendDolls();
            return;
        }
        ch.dolls[key]--;
        const pool = this.data.dolls.filter(d => tiers.includes(d.tier));
        const picked = pool[Math.floor(Math.random() * pool.length)] || this.data.dolls[0] || { id: 1 };
        ch.dolls.own[picked.id] = (ch.dolls.own[picked.id] || 0) + 1;
        if (!ch.dolls.seen.includes(picked.id)) ch.dolls.seen.push(picked.id);
        this.sendDolls();
        // 畫面認的種類（S_Web 30）：1 開袋子、2 開盒子、9 開精緻袋子（原本送 act 3／4，畫面不認，開袋子動畫停住）
        const kind = key === 'bag' ? 1 : key === 'box' ? 2 : 9;
        this.emit('dollResult', { kind, id: picked.id, used: 0 });
        this.save();
    }

    dollBuy(n) {
        const ch = this.curChar;
        if (!ch || !ch.dolls) return;
        const qty = Math.max(1, n | 0);
        if (!this.spendGold(30000 * qty)) {   // 原本錢不夠也照給袋子
            this.emit('dollResult', { kind: 7, id: 0, used: 0, why: '金幣不足，' + qty + ' 個袋子要 ' + (30000 * qty).toLocaleString() + ' 金幣。' });
            return;
        }
        ch.dolls.bag = (ch.dolls.bag || 0) + qty;
        this.sendDolls();
        this.emit('dollResult', { kind: 6, id: qty, used: 0 });
        this.save();
    }

    dollSynth(tier, ids) {
        const ch = this.curChar;
        if (!ch || !ch.dolls) return;
        // 手續費照視窗寫的（sendDolls 的 synth.tiers）：一般 1 萬、高級 5 萬、稀有 20 萬、英雄 100 萬、傳說 500 萬
        const fee = [0, 10000, 50000, 200000, 1000000, 5000000][tier | 0] || 0;
        if (fee && !this.spendGold(fee)) {
            this.emit('dollResult', { kind: 4, id: 0, used: 0 });
            this.sysMsg('金幣不足，合成手續費要 ' + fee.toLocaleString() + ' 金幣。');
            return;
        }
        for (const id of ids || []) {
            if (ch.dolls.own[id] > 0) ch.dolls.own[id]--;
        }
        const nextTier = Math.min(6, (tier || 1) + 1);
        const pool = this.data.dolls.filter(d => d.tier === nextTier);
        const picked = pool[Math.floor(Math.random() * pool.length)] || this.data.dolls[0] || { id: 1 };
        ch.dolls.own[picked.id] = (ch.dolls.own[picked.id] || 0) + 1;
        if (!ch.dolls.seen.includes(picked.id)) ch.dolls.seen.push(picked.id);
        this.sendDolls();
        this.emit('dollResult', { kind: 3, id: picked.id, used: (ids || []).length });   // 3＝合成成功（原本送 act 5，畫面不認，合成卡住）
        this.save();
    }

    // 神話重組：2 隻神話（6 階）換 1 隻不同的神話
    dollReroll(a, b) {
        const ch = this.curChar;
        if (!ch || !ch.dolls) return;
        const own = ch.dolls.own, tierOf = id => (this.data.dolls.find(d => d.id === id) || {}).tier;
        const need = {}; need[a] = (need[a] || 0) + 1; need[b] = (need[b] || 0) + 1;
        if (tierOf(a) !== 6 || tierOf(b) !== 6 || Object.entries(need).some(([id, k]) => (own[id] || 0) < k)) {
            this.emit('dollResult', { kind: 4, id: 0, used: 0 });
            return;
        }
        own[a]--; own[b]--;
        const pool = this.data.dolls.filter(d => d.tier === 6 && d.id !== a && d.id !== b);
        const picked = pool[Math.floor(Math.random() * pool.length)] || this.data.dolls.find(d => d.tier === 6);
        own[picked.id] = (own[picked.id] || 0) + 1;
        if (!ch.dolls.seen.includes(picked.id)) ch.dolls.seen.push(picked.id);
        this.sendDolls();
        this.emit('dollResult', { kind: 5, id: picked.id, used: 2 });
        this.save();
    }

    dollRegister(id) {
        const ch = this.curChar;
        if (!ch || !ch.dolls) return;
        if (!ch.dolls.seen.includes(id)) ch.dolls.seen.push(id);
        this.sendDolls();
        this.emit('dollResult', { kind: 8, id, used: 0 });
        this.save();
    }

    // ── 能力配點、記憶座標、聊天與 GM 指令 ──
    raiseAttr(key) {
        const ch = this.curChar;
        if (!ch || (ch.bonusStats || 0) <= 0) return;
        const k = String(key || '').toLowerCase();
        if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(k)) {
            ch[k] = Math.min(50, (ch[k] || 10) + 1);
            ch.bonusStats--;
            this.recalcStats();
            this.sendOwnStatus();
            this.sendSpMr();
            this.sendBonusStats();
            this.save();
        }
    }

    addBookmark(name, color) {
        const ch = this.curChar;
        if (!ch) return;
        const id = Date.now() & 0x7fffffff;
        const bm = { id, name, map: ch.mapId, x: ch.x, y: ch.y, color: color || 0 };
        ch.bookmarks.push(bm);
        this.emit('bookmark', { name: bm.name, map: bm.map, id: bm.id, color: bm.color });
        this.save();
    }

    deleteBookmark(name) {
        const ch = this.curChar;
        if (!ch) return;
        ch.bookmarks = (ch.bookmarks || []).filter(b => b.name !== name);
        this.save();
    }

    bookmarkColor(name, color) {
        const ch = this.curChar;
        if (!ch) return;
        const bm = (ch.bookmarks || []).find(b => b.name === name);
        if (bm) {
            bm.color = color || 0;
            this.emit('bookmark', { name: bm.name, map: bm.map, id: bm.id, color: bm.color });
            this.save();
        }
    }

    itemLock(on, objId) {
        const ch = this.curChar;
        if (!ch) return;
        const it = (ch.inv || []).find(x => x.id === objId);
        if (it) {
            it.locked = !!on;
            this.sendInvIds();
            this.save();
        }
    }

    prefsLoad() {
        const json = (this.state && this.state.prefs) || '{}';
        this.emit('prefs', { ok: true, json });
    }

    prefsSave(json) {
        if (!this.state) return;
        this.state.prefs = String(json || '{}');
        this.save();
        this.emit('prefsSaved', 1);
    }

    ranking() {
        const ch = this.curChar;
        const myName = ch ? ch.name : '奇岩勇者';
        const myType = ch ? (ch.type || 0) : 1;
        const myLv = ch ? (ch.level || 1) : 50;
        const myExp = ch ? (ch.exp || 100) : 1000;
        const myDolls = ch && ch.dolls && ch.dolls.seen ? ch.dolls.seen.length : 3;
        const heroes = [
            { name: myName, type: myType, level: Math.max(myLv, 1), value: myExp },
            { name: '太陽神阿波羅', type: 1, level: 82, value: 980000000 },
            { name: '月光女神黛安娜', type: 2, level: 80, value: 850000000 },
            { name: '大法師梅林', type: 3, level: 79, value: 780000000 },
            { name: '暗影刺客', type: 4, level: 78, value: 720000000 },
            { name: '亞丁王族', type: 0, level: 77, value: 650000000 },
        ];
        const lvRows = heroes.slice().sort((a, b) => b.level - a.level || b.value - a.value);
        const myLvRank = lvRows.findIndex(r => r.name === myName) + 1;
        const dollRows = [
            { name: myName, type: myType, level: myLv, value: myDolls },
            { name: '娃娃收藏王', type: 0, level: 75, value: 42 },
            { name: '月光女神黛安娜', type: 2, level: 80, value: 36 },
            { name: '大法師梅林', type: 3, level: 79, value: 28 },
        ].sort((a, b) => b.value - a.value);
        const myDollRank = dollRows.findIndex(r => r.name === myName) + 1;
        const boards = [
            { total: lvRows.length, myRank: myLvRank, myValue: myExp, rows: lvRows },
            { total: 0, myRank: 0, myValue: 0, rows: [] },
            { total: dollRows.length, myRank: myDollRank, myValue: myDolls, rows: dollRows },
        ];
        for (let c = 0; c < 5; c++) {
            const cRows = lvRows.filter(r => r.type === c);
            const rk = cRows.findIndex(r => r.name === myName) + 1;
            boards.push({ total: cRows.length, myRank: rk, myValue: myExp, rows: cRows });
        }
        this.emit('ranking', { time: Math.floor(Date.now() / 1000), boards });
    }

    top1List() {
        const ch = this.curChar;
        const myId = ch ? ch.id : 10001;
        const myName = ch ? ch.name : '奇岩勇者';
        const myType = ch ? (ch.type || 0) : 1;
        const myLv = ch ? (ch.level || 50) : 50;
        const now = Math.floor(Date.now() / 1000);
        this.emit('top1', {
            list: [
                { id: myId, name: myName, type: myType, level: myLv, title: '傳說勇者', statue: 0, score: { v: myLv, c: 0, t: 0 } },
                { id: myId, name: myName, type: myType, level: myLv, title: '怪物博士', statue: 0, score: { v: 100, c: 10, t: 10, ms: 12000 } },
                { id: myId, name: myName, type: myType, level: myLv, title: '奇趣收藏家', statue: 0, score: { v: 10, c: 10, t: 50 } },
            ],
            kinds: [
                { name: '傳說勇者', text: '全能力 +1、HP +100', since: now - 3600, until: 0 },
                { name: '怪物博士', text: '狩獵經驗 +10%', since: now - 3600, until: now + 86400 },
                { name: '奇趣收藏家', text: '近遠距離傷害 +2', since: now - 3600, until: 0 },
            ],
            hours: 24,
            show: [myId],
        });
    }

    top1Title(text) {
        const ch = this.curChar;
        if (ch) {
            ch.title = String(text || '').slice(0, 8);
            this.sendMapAndSelf();
            this.save();
        }
        this.emit('top1', { set: { result: 0, title: ch ? ch.title : '' } });
    }

    top1Show() {
        this.top1List();
    }

    mail(action, id) {
        const now = Math.floor(Date.now() / 1000);
        if (!this.state.mails) {
            this.state.mails = [
                {
                    id: 1,
                    src: 0,
                    title: '歡迎來到網頁奇岩城離線單機版！',
                    body: '感謝遊玩網頁奇岩城離線單機版！隨信附贈離線支援補給禮包，祝您冒險愉快！',
                    sent: now - 600,
                    expire: now + 86400 * 30,
                    read: false,
                    unc: true,
                    atts: [
                        { id: GOLD_ID, gfx: 4, name: '金幣', count: 300000, en: 0, got: false },
                        { id: 49142, gfx: 2777, name: '回憶蠟燭', count: 3, en: 0, got: false },
                        { id: 49238, gfx: 2777, name: '狩獵的證明', count: 2000, en: 0, got: false },
                    ],
                },
            ];
        }
        // 有 owner 的信（試煉獎勵）只給那隻角色看、領；沒有 owner 的整個帳號共用
        const me = this.curChar ? this.curChar.name : '';
        const mails = this.state.mails.filter(m => !m.owner || m.owner === me);
        if (action === 0) {
            const unc = mails.filter(m => m.unc || !m.read).length;
            this.emit('mail', { badge: unc });
            return;
        }
        if (action === 2) {
            const m = mails.find(x => x.id === id);
            if (m) {
                m.read = true;
                this.emit('mail', { body: { id: m.id, text: m.body } });
                this.save();
            }
            return;
        }
        if (action === 3 || action === 4) {
            const targets = action === 4 ? mails.filter(x => x.unc) : mails.filter(x => x.id === id && x.unc);
            let cnt = 0;
            for (const m of targets) {
                m.read = true;
                m.unc = false;
                for (const a of m.atts) {
                    if (!a.got) {
                        a.got = true;
                        this.giveItem(a.id, a.count, a.en || 0, 1);
                        cnt++;
                    }
                }
            }
            this.save();
            this.emit('mail', { result: { code: 0, id: id || 0, n: cnt, msg: '已領取信件附件！' } });
        } else if (action === 5) {
            this.state.mails = this.state.mails.filter(m => (m.owner && m.owner !== me) || m.unc);   // 別隻角色的信不動
            this.save();
            this.emit('mail', { result: { code: 0, id: 0, n: 0, msg: '已刪除已領取的信件' } });
        }
        const mine = this.state.mails.filter(m => !m.owner || m.owner === me);
        const unc = mine.filter(m => m.unc || !m.read).length;
        this.emit('mail', { badge: unc });
        this.emit('mail', { list: { warnDays: 3, now, mails: mine.map(m => Object.assign({}, m, { flags: (m.read ? 1 : 0) | (m.unc ? 2 : 0) })) } });
    }

    // 寄一封有附件的信給目前這隻角色（試煉獎勵等）；atts：[[道具編號, 數量], …]
    mailAdd(title, body, atts) {
        const ch = this.curChar;
        if (!ch) return;
        if (!this.state.mails) this.mail(0);   // 先建好預設的歡迎信
        const now = Math.floor(Date.now() / 1000);
        const id = this.state.mails.reduce((a, m) => Math.max(a, m.id | 0), 0) + 1;
        this.state.mails.push({
            id, src: 0, owner: ch.name, title, body, sent: now, expire: now + 86400 * 30, read: false, unc: true,
            atts: atts.map(([iid, n]) => { const e = this.data.itemsById.get(iid); return { id: iid, gfx: e ? e.tpl.ig || 0 : 0, name: e ? e.name : '道具#' + iid, count: n || 1, en: 0, got: false }; }),
        });
        this.save();
        const unc = this.state.mails.filter(m => (!m.owner || m.owner === ch.name) && (m.unc || !m.read)).length;
        this.emit('mail', { badge: unc });
    }

    marketSummary() {
        this.emit('market', {
            summary: {
                on: true, salePct: 3, listPct: 1, listMin: 100, listMax: 100000,
                hours: 24, maxN: 10, active: 0, claims: 0, maxPrice: 2000000000,
            },
        });
    }

    marketBrowse(cat, sort, q) {
        const sample = [
            { id: 501, itemId: 54, gfx: 61, useType: 1, bless: 0, identified: 1, count: 1, name: '+9 瑟魯基之劍', unit: 500000, total: 500000, seller: '奇岩鐵匠', left: 86000, cat: 1, mine: false },
            { id: 502, itemId: 181, gfx: 190, useType: 1, bless: 0, identified: 1, count: 1, name: '+9 尤米弓', unit: 500000, total: 500000, seller: '妖精森林', left: 86000, cat: 1, mine: false },
            { id: 503, itemId: 121, gfx: 110, useType: 1, bless: 0, identified: 1, count: 1, name: '+9 力量魔法杖', unit: 500000, total: 500000, seller: '象牙塔長老', left: 86000, cat: 1, mine: false },
            { id: 504, itemId: 40087, gfx: 249, useType: 26, bless: 0, identified: 1, count: 10, name: '對武器施法的卷軸', unit: 35000, total: 350000, seller: '雜貨商', left: 86000, cat: 4, mine: false },
            { id: 505, itemId: 40074, gfx: 248, useType: 27, bless: 0, identified: 1, count: 10, name: '對盔甲施法的卷軸', unit: 30000, total: 300000, seller: '雜貨商', left: 86000, cat: 4, mine: false },
        ].map(x => Object.assign({}, x, { it: { id: x.id, useType: x.useType, gfx: x.gfx, bless: x.bless, identified: x.identified, count: x.count, name: x.name } }));
        const filtered = sample.filter(x => (!cat || x.cat === cat) && (!q || x.name.includes(q)));
        // 排序：0 價格低到高、2 價格高到低、1 最新上架（網頁 market.js 第 761 項）
        if (sort === 2) filtered.sort((a, b) => b.unit - a.unit);
        else if (sort === 1) filtered.sort((a, b) => b.id - a.id);
        else filtered.sort((a, b) => a.unit - b.unit);
        this._marketItems = sample;
        this.emit('market', { list: { cat: cat || 0, sort: sort || 0, total: filtered.length, list: filtered } });
    }

    marketDetail(id) {
        const x = (this._marketItems || []).find(i => i.id === id) || null;
        this.emit('market', { detail: { id, entry: x, lo: x ? x.unit : 0, hi: x ? x.unit : 0, n: 1 } });
    }

    marketBuy(id, n) {
        const x = (this._marketItems || []).find(i => i.id === id);
        if (!x) return;
        const qty = Math.max(1, Math.min(x.count, n || x.count));
        const cost = x.unit * qty;
        if (!this.spendGold(cost)) {
            this.emit('market', { result: { op: 4, code: 1, id, msg: '金幣不足' } });
            return;
        }
        const enMatch = /^\+(\d+)\s/.exec(x.name);
        const ench = enMatch ? +enMatch[1] : 0;
        this.giveItem(x.itemId, qty, ench, x.bless);
        this.emit('market', { result: { op: 4, code: 0, id, msg: '購買成功！已放入背包' } });
    }

    marketMine() { this.emit('market', { mine: [] }); }
    marketClaims() { this.emit('market', { claims: [] }); }
    marketList() { this.emit('market', { result: { op: 3, code: 0, id: 0, msg: '離線單機版已展示上架完成' } }); }
    marketCancel(id) { this.emit('market', { result: { op: 5, code: 0, id, msg: '已下架' } }); }
    marketClaim(id) { this.emit('market', { result: { op: 8, code: 0, id: id || 0, msg: '已領取' } }); }

    charReset(action, init, fin) {
        const ch = this.curChar;
        if (!ch) return;
        const ci = CLASS_INIT[ch.type] || CLASS_INIT[0];
        const base = [ci.str, ci.dex, ci.con, ci.int, ci.wis, ci.cha];
        const cur = [ch.str, ch.dex, ch.con, ch.int, ch.wis, ch.cha];
        const bonus = Math.max(0, (ch.level || 1) - 50);
        if (action === 1) {
            this.emit('charReset', {
                info: {
                    type: ch.type, level: ch.level || 1,
                    initTotal: 75, initMax: 18, amount: 75 - base.reduce((a, b) => a + b, 0),
                    statMax: 50, bonus, elixir: 0,
                    base, orig: base.slice(), cur,
                },
            });
            return;
        }
        if (action === 2 && Array.isArray(fin) && fin.length === 6) {
            [ch.str, ch.dex, ch.con, ch.int, ch.wis, ch.cha] = fin.map(v => Math.max(5, Math.min(50, v | 0)));
            this.recalcStats();
            this.sendOwnStatus();
            this.sendSpMr();
            this.sendBonusStats();
            this.save();
            this.emit('charReset', { result: { code: 0, wait: 0, msg: '能力值已重新分配！' } });
        }
    }

    clanInfo() {
        const ch = this.curChar;
        if (!ch) return;
        this.emit('clanInfo', {
            id: 1,
            name: ch.clan || '奇岩城血盟',
            leader: ch.name,
            rank: 4,
            ext: true,
            cap: 50,
            wh: 0,
            emblem: false,
            wars: [],
            clans: [],
            members: [
                { name: ch.name, rank: 4, online: true, level: ch.level || 1, type: ch.type || 0, title: ch.title || '奇岩城主' },
            ],
        });
    }

    createClan(name) {
        const ch = this.curChar;
        if (!ch) return;
        ch.clan = String(name || '奇岩城血盟').trim() || '奇岩城血盟';
        this.clanInfo();
        this.sendMapAndSelf();
        this.sysMsg('🏰 成功創立血盟「' + ch.clan + '」！');
        this.save();
    }

    leaveClan() {
        this.sysMsg('你目前是奇岩城血盟盟主。');
    }

    title(name, titleText) {
        const ch = this.curChar;
        if (!ch) return;
        ch.title = String(titleText || '').trim();
        this.clanInfo();
        this.sendMapAndSelf();
        this.sysMsg('✨ 封號已變更為「' + ch.title + '」。');
        this.save();
    }

    clanRecruit() {
        const ch = this.curChar;
        this.emit('clanRecruit', {
            ok: true, leader: true,
            mine: { intro: '奇岩城離線單機版官方血盟', minLv: 1 },
            applied: 0, appliedAll: [], myEmb: true, cool: { id: 0, sec: 0 },
            list: [
                { id: 1, name: (ch && ch.clan) || '奇岩城血盟', leader: (ch && ch.name) || '奇岩勇者', on: true, n: 1, online: 1, minLv: 1, intro: '歡迎所有冒險者加入！' },
            ],
        });
    }

    toiBook(action, seg = 0) {
        const ch = this.curChar;
        if (!ch) return;
        if (!ch.toiLv) ch.toiLv = [1, 0, 0, -1, -1, -1, -1, -1, -1, 1];
        if ((action === 1 || action === 2) && seg >= 0 && seg < 10) {
            ch.toiLv[seg] = Math.min(10, Math.max(0, (ch.toiLv[seg] < 0 ? 0 : ch.toiLv[seg] + 1)));
            this.save();
        }
        this.emit('toiBook', { lv: ch.toiLv.slice() });
    }

    // 狩獵圖鑑每區等級 → 永久能力（同 huntdex.js HUNT_P：[每級加多少, 只有 Lv1、3、5、7、9 才加]）
    //   0 奇岩 HP、1 海音 水抗、2 歐瑞 魔防、3 威頓 負重%、4 肯特 MP、5 燃柳 火抗、6 亞丁 經驗%、7 銀騎士 AC、8 古魯丁 命中、9 說話之島 回血
    huntBonus() {
        const ch = this.curChar, lv = (ch && ch.huntLv) || [];
        const P = [[20], [4], [2], [4], [20], [4], [2], [1, 1], [1, 1], [1, 1]];
        const v = i => { const l = lv[i] | 0, p = P[i]; return l <= 0 ? 0 : p[1] ? Math.floor((l + 1) / 2) * p[0] : p[0] * l; };
        return { hp: v(0), water: v(1), mr: v(2), weight: v(3), mp: v(4), fire: v(5), exp: v(6), ac: v(7), hit: v(8), regen: v(9) };
    }

    huntDex(action, reg = 0) {
        const ch = this.curChar;
        if (!ch) return;
        const names = ['奇岩', '海音', '歐瑞', '威頓', '肯特', '燃柳', '亞丁', '銀騎士', '古魯丁', '說話之島'];
        const descs = ['最大 HP +20', '水屬性抗性 +4', '魔防 +2', '負重 +4%', '最大 MP +20', '火屬性抗性 +4', '經驗 +2%', '防禦 AC −1', '命中 +1', '回血 +1'];
        if (!ch.huntLv) ch.huntLv = [1, 0, -1, -1, -1, -1, -1, 1, -1, 1];
        const open = { proof: 100, gold: 50000 };
        const up = Array.from({ length: 10 }, (_, i) => ({ proof: (i + 1) * 100, gold: (i + 1) * 50000 }));
        if ((action === 1 || action === 2) && reg >= 0 && reg < 10) {
            // 離線版照舊不收證明、金幣（狩獵的證明只有信箱送的 2,000 個，收了就升不滿）
            ch.huntLv[reg] = Math.min(up.length, ch.huntLv[reg] < 0 ? 0 : ch.huntLv[reg] + 1);
            // 能力馬上生效
            this.recalcStats();
            this.sendOwnStatus();
            this.sendSpMr();
            this.save();
        }
        const regs = names.map((nm, i) => ({ lv: ch.huntLv[i], name: nm, desc: descs[i] }));
        this.emit('huntDex', { regs, open, up });
    }

    collect(action, grp = 0, slot = 0, objId = 0) {
        const ch = this.curChar;
        if (!ch) return;
        if (!ch.collectDone) ch.collectDone = {};
        if (action === 1 && grp && objId) {
            ch.collectDone[grp + ':' + slot] = true;
            this.consumeItem(objId, 1);
            this.save();
        }
        const groups = [
            {
                id: 1, name: '象牙塔初心者的祝福', active: 0,
                slots: [
                    { ids: [35], gfx: 50, name: '象牙塔單手劍', safe: 6, has: true, en: 6 },
                    { ids: [20028], gfx: 141, name: '象牙塔皮頭盔', safe: 4, has: true, en: 4 },
                    { ids: [20110], gfx: 158, name: '抗魔法鏈甲', safe: 4, has: true, en: 6 },
                ],
                tiers: [
                    { rel: false, n: 4, bonus: 'HP +30、防禦 -1' },
                    { rel: false, n: 6, bonus: 'HP +50、防禦 -2、近距離傷害 +1' },
                ],
            },
            {
                id: 2, name: '奇岩勇士武裝', active: -1,
                slots: [
                    { ids: [54], gfx: 61, name: '瑟魯基之劍', safe: 6, has: !!ch.collectDone['2:0'], en: ch.collectDone['2:0'] ? 6 : 0 },
                    { ids: [181], gfx: 190, name: '尤米弓', safe: 6, has: !!ch.collectDone['2:1'], en: ch.collectDone['2:1'] ? 6 : 0 },
                ],
                tiers: [
                    { rel: false, n: 6, bonus: '近距離傷害 +2、遠距離傷害 +2' },
                ],
            },
        ];
        this.emit('collect', { ver: 1, doneGrp: action === 1 ? grp : 0, doneSlot: action === 1 ? slot : 255, groups, total: ['HP +30', '防禦 -1'], msg: '' });
    }

    treasure(action, cell = 0) {
        if (!this._tr) {
            this._tr = { digs: 0, max: 10, maps: 0, daily: 10, mapPrice: 50000, digPrice: 10000, near: 0, last: -1, got: [], free: 3, freeMap: true };
        }
        const t = this._tr;
        if (action === 1) {
            t.digs = 0; t.got = []; t.last = -1;
            if (t.free > 0) { t.free--; t.freeMap = true; } else { t.maps++; t.freeMap = false; }
        } else if (action === 2 && cell >= 0 && cell < 25) {
            if (!t.got.some(g => g.cell === cell)) {
                const pool = [
                    { item: GOLD_ID, count: 100000, rarity: 3, name: '金幣' },
                    { item: 140087, count: 2, rarity: 4, name: '受祝福的 對武器施法的卷軸' },
                    { item: 140074, count: 2, rarity: 4, name: '受祝福的 對盔甲施法的卷軸' },
                    { item: 49138, count: 5, rarity: 2, name: '巧克力蛋糕' },
                ];
                const pick = pool[Math.floor(Math.random() * pool.length)];
                t.got.push({ cell, item: pick.item, count: pick.count, rarity: pick.rarity, name: pick.name });
                t.digs++;
                t.last = cell;
                this.giveItem(pick.item, pick.count, 0, pick.item >= 100000 ? 0 : 1);
            }
        } else if (action === 3) {
            t.digs = -1; t.last = -1; t.got = [];
        }
        this.emit('treasure', Object.assign({}, t, { got: t.got.slice() }));
    }

    mall(action) {
        if (action === 0) {
            this.emit('mall', { state: { diamonds: 99999, own: {}, pay: { on: false, pkgs: [] } } });
        } else {
            this.emit('mall', { result: { ok: true, msg: '離線單機版已免費解鎖商城特權！' } });
        }
    }

    partyRecruit() {
        this.emit('partyRecruit', { open: false, list: [] });
    }

    partyBuff() {
        this.emit('partyBuff', {
            on: true, state: 0, maxH: 5, leader: true, count: 1,
            list: [
                { sec: 3600, price: 10000, val: 10 },
                { sec: 3600, price: 10000, val: 10 },
                { sec: 3600, price: 10000, val: 5 },
                { sec: 3600, price: 10000, val: 10 },
                { sec: 0, price: 0, val: 20 },
            ],
        });
    }

    friend(action) {
        if (action === 0) this.emit('friend', { kind: 0, max: 50, list: [] });
        else this.emit('friend', { kind: 1, ok: true, msg: '操作完成' });
    }

    offlineLog() {
        this.emit('offlineLog', null);
    }

    restart() {
        const ch = this.curChar;
        if (!ch) return;
        ch.hp = ch.maxHp;
        ch.mp = ch.maxMp;
        this.teleportTo(4, 33438, 32798, true);
    }

    gmItem(itemId, count, ench) {
        const inst = this.giveItem(itemId, count || 1, ench || 0);
        if (inst) {
            this.sysMsg('🎁 獲得道具：' + (displayName(inst.nid) || inst.name) + (ench ? ' +' + ench : '') + (count > 1 ? ' ×' + count : ''));
            this.save();
        }
    }

    chat(text, type = 0) {
        const ch = this.curChar;
        if (!ch) return;
        const msg = String(text || '').trim();
        if (!msg) return;

        // 支援聊天框輸入「.道具名稱」或「.gm」快速搜尋建立物品（同官方 GM 指令）
        if (msg.startsWith('.')) {
            const q = msg.slice(1).trim();
            if (this.gmCommand(q)) return;
            this.openItemSearch(q);
            return;
        }
        this.emit('chat', { type, id: ch.id, text: ch.name + ': ' + msg, x: ch.x, y: ch.y });
    }

    // 聊天框指令（遊戲系統與功能對照.md 列的那幾個；原本全部被當成「.道具名稱」拿去搜尋道具，沒有一個有作用）
    //   回 true＝是指令、處理掉了
    gmCommand(q) {
        const ch = this.curChar, parts = String(q || '').trim().split(/\s+/), cmd = (parts[0] || '').toLowerCase();
        const num = i => { const n = parseFloat(parts[i]); return isFinite(n) ? n : NaN; };
        const r = this.gmRates;
        const rate = (key, label, max) => {
            const n = num(1);
            if (!(n >= 1 && n <= max)) { this.sysMsg('用法：.' + cmd + ' 倍率（1～' + max + '）'); return true; }
            r[key] = n;
            this.sysMsg(label + '已調整為 ' + n + ' 倍。');
            return true;
        };
        switch (cmd) {
            case 'rates':
                this.sysMsg('目前倍率：經驗 ' + r.exp + ' 倍、掉寶 ' + r.drop + ' 倍、金幣 ' + r.gold + ' 倍；無敵 ' + (r.godMode ? '開' : '關') + '、一擊必殺 ' + (r.oneHit ? '開' : '關'));
                return true;
            case 'exp': return rate('exp', '經驗值', 100);
            case 'drop': return rate('drop', '掉寶率', 50);
            case 'gold': return rate('gold', '金幣倍率', 100);
            case 'god':
                r.godMode = !r.godMode;
                this.sysMsg('無敵模式已' + (r.godMode ? '開啟' : '關閉') + '。');
                return true;
            case 'onehit':
                r.oneHit = !r.oneHit;
                this.sysMsg('一擊必殺已' + (r.oneHit ? '開啟' : '關閉') + '。');
                return true;
            case 'lv': {
                const lv = num(1) | 0;
                if (!(lv >= 1 && lv <= 99)) { this.sysMsg('用法：.lv 等級（1～99）'); return true; }
                if (lv <= ch.level) { this.sysMsg('目前已經是 Lv.' + ch.level + '（這個指令只能往上升）。'); return true; }
                ch.exp = Math.max(ch.exp || 0, expForLevel(lv));
                this.levelUpTo(lv);
                this.save();
                return true;
            }
            case 'item': {
                const id = num(1) | 0, cnt = Math.max(1, Math.min(2000000000, num(2) | 0 || 1));
                if (!(id > 0) || !this.data.itemsById.has(id)) { this.sysMsg('用法：.item 道具編號 數量（例：.item 40308 100000）'); return true; }
                this.gmItem(id, cnt, 0);
                return true;
            }
            case 'clear': {
                // 只清沒穿在身上、沒上鎖的消耗品與雜物；武器、防具、金幣、主城傳送石不動
                const junk = (ch.inv || []).filter(it => {
                    if (it.equipped || it.locked || it.itemId === GOLD_ID || it.itemId === HOME_STONE) return false;
                    const e = this.data.itemsById.get(it.itemId);
                    return !e || e.tpl.k === 'e';
                });
                for (const it of junk) this.consumeItem(it.id, it.count);
                this.sendInvIds();
                this.save();
                this.sysMsg('已清掉背包裡 ' + junk.length + ' 種沒穿戴的消耗品與雜物（武器、防具、金幣不動）。');
                return true;
            }
        }
        return false;
    }

    openItemSearch(q) {
        const query = String(q || '').trim().toLowerCase();
        const matches = [];
        for (const [id, info] of this.data.itemsById.entries()) {
            const nm = info.name || '';
            if (!query || nm.toLowerCase().includes(query) || String(id) === query) {
                matches.push({
                    id,
                    gfx: info.tpl.ig || 34,
                    bless: 1,
                    stack: info.tpl.k === 'e',
                    equip: info.tpl.k === 'w' || info.tpl.k === 'a',
                    name: nm,
                });
                if (matches.length >= 60) break;
            }
        }
        this.emit('itemPick', { kw: q || '全部', q: q || '全部', ask: true, count: 1, total: matches.length, list: matches, items: matches });
    }

    gmSetLevel(lv) {
        this.levelUpTo(lv | 0);
    }

    gmMaxStats() {
        const ch = this.curChar;
        if (!ch) return;
        ch.str = ch.dex = ch.con = ch.int = ch.wis = ch.cha = 50;
        this.recalcStats();
        ch.hp = ch.maxHp;
        ch.mp = ch.maxMp;
        this.sendOwnStatus();
        this.sendSpMr();
        this.sendBonusStats();
        this.save();
    }

    // ── 伺服器主循環：怪物 AI、AUTO 自動打怪、自然回血回魔 ──
    dirBetween(x1, y1, x2, y2) {
        const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
        for (let d = 0; d < 8; d++) {
            if (DX[d] === dx && DY[d] === dy) return d;
        }
        return 4;
    }

}

// 掛機設定、怪物／頭目出生、村莊 NPC、傳送師（js/offline-auto.js）
Object.assign(OfflineServer.prototype, autoMixin);
