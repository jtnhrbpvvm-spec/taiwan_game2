// 離線伺服器：掛機設定（設定 → 狩獵／補給／魔法／召喚／名單）、怪物與頭目出生、村莊 NPC、傳送師
//   掛在 OfflineServer.prototype 上（offline-server.js 最下面 Object.assign）。
//   設定欄位、旗標的意義照網頁 hud.js 設定頁（AS_PAGE）與 protocol.js autoSettings：
//     旗標 1 綠水、2 勇敢類（照職業）、4 藍水、8 慎重藥水、128 變身、256 魔法屏障卷軸、2048 自動買銀箭、
//     16384 沒怪瞬移、65536 魔力不夠先休息、1048576 經驗藥水、2097152 撐不住先瞬移 3 次回村、1073741824 只喝選的那種藥水
import { DX, DY } from './opcodes.js';

const HOME_STONE = 49900;
const GOLD_ID_A = 40308;
// 自動補給會用到、自動賣出不賣的（同 offline-server.js sendInvIds 的 supply）
const SELL_KEEP = [40010, 40011, 40012, 40013, 40014, 40015, 40018, 40029, 40031, 40068, 40088, 40100, 40744, 41246];
const TELE_RANGE = 200;   // 隨機瞬移的範圍（L1J L1Teleport.randomTeleport：randomLocation(200, true)）
// 隨機瞬移的落點至少要走得到幾格（排除封閉的小空間）：傲慢之塔地下水路有一間 77 格、沒有傳點的封閉房間，飛進去只能再瞬移
const POCKET_MIN = 150;
const TELE_SCROLL = 40100, HOME_SCROLL = 40079, POLY_SCROLL = 40088, BARRIER_SCROLL = 40889, WIS_POTION = 40016, SILVER_ARROW = 40744;
const SUMMON_RING = 20284;
export const PET_COLLAR = 40314, PET_FLUTE = 41160;   // 項圈（裡面裝寵物）、寵物召喚笛
const NPC_VIEW = 30, NPC_DROP = 40;   // 照真的位置放的 NPC：幾格內送到畫面、超過幾格拿掉
// 新手引導（20 步制，2026-11-12 照連線版 webl1.com 實際跑一隻新角色抄下來的順序、目標、獎勵；8、9、14 步伺服器已拿掉）
//   s＝伺服器的步驟編號、k＝種類（tutorial.js K_*）、goal＝進度目標（AUTO 秒數、等級）、g＝獎勵 [道具編號（0＝魔法娃娃的袋子）, 數量, 強化值]、
//   start＝進到這步先給的（強化武器那步給 5 張象牙塔對武器施法的卷軸）、plus＝武器要衝到 +幾
const TUT = [
    { s: 1, k: 1, g: [[20028, 1, 4], [20082, 1, 4], [20126, 1, 4], [20173, 1, 4], [20206, 1, 4], [20232, 1, 4], [21138, 1, 4]] },
    { s: 2, k: 2, g: [[40029, 100]] },
    { s: 3, k: 5, g: [[40029, 150], [40030, 10]] },
    { s: 4, k: 8, g: [[40096, 20]] },
    { s: 5, k: 22, g: [[40099, 10]] },
    { s: 6, k: 3, g: [[40029, 200]] },
    { s: 7, k: 4, goal: 30, g: [[40099, 10]] },
    { s: 10, k: 9, g: [[40099, 30]] },
    { s: 11, k: 10, goal: 10, g: [] },
    { s: 12, k: 11, g: [[0, 1], [41246, 4]] },
    { s: 13, k: 12, g: [[40099, 10], [40029, 100]] },
    { s: 15, k: 14, g: [[40029, 250]] },
    { s: 16, k: 15, goal: 13, g: [] },
    { s: 17, k: 16, plus: 5, start: [[49312, 5]], g: [[40030, 10], [40029, 100]] },
    { s: 18, k: 17, g: [[40099, 10], [40029, 200]] },
    { s: 19, k: 18, goal: 16, g: [] },
    { s: 20, k: 20, goal: 20, plus: 6, g: [[40308, 20000]] },
];
const TUT_DOLL_BAG = 41247;   // 獎勵清單上「魔法娃娃的袋子」的圖示
// 等級試煉獎勵（照遊戲指南 guide.html「等級試煉獎勵」那張表；騎士 15、30 級跟連線版 webl1.com 實際推送的一樣）
//   職業（0 王族、1 騎士、2 妖精、3 法師、4 黑暗妖精）→ 等級 → { pick: 二選一, items: [道具編號…] }；收下後寄到這隻角色的信箱
const TRIAL_LV = [15, 30, 45, 50];
const TRIAL = {
    0: { 15: { items: [20065] }, 30: { items: [20051, 40228] }, 45: { items: [20287] }, 50: { items: [51] } },
    1: { 15: { items: [20027] }, 30: { items: [30, 20230] }, 45: { items: [20318] }, 50: { items: [56] } },
    2: { 15: { pick: true, items: [20021, 20039] }, 30: { items: [20084, 40243] }, 45: { items: [20171, 40245] }, 50: { pick: true, items: [50, 184] } },
    3: { 15: { items: [20226, 126] }, 30: { items: [115] }, 45: { items: [20055] }, 50: { items: [20225] } },
    4: { 15: { items: [20004, 40268] }, 30: { items: [20164, 40270] }, 45: { items: [20195, 40276] }, 50: { items: [13] } },
};
// 治癒藥水回復量
export const HEAL_POTS = { 40010: 25, 40011: 60, 40012: 95, 40029: 35, 40022: 25, 40023: 55, 40024: 85, 140010: 35, 140011: 75, 140012: 115, 41337: 95 };
const BRAVE_ITEM = { 0: 40031, 1: 40014, 2: 40068 };   // 王族 惡魔之血、騎士 勇敢藥水、妖精 精靈餅乾
const EXP_POTS = [47004, 47003, 47002, 47001, 47000];  // 加成高的排前面
// 各村莊的傳送師（data/npcfn.json 的鍵；動作字首＝出發地）
const TOWN_TELEPORTER = {
    '奇岩城鎮': '$1354|6377', '銀騎士村莊': '$947|6377', '肯特村莊': '$831|6377', '古魯丁村莊': '$830|6377', '風木村莊': '$946|6377',
    '海音城鎮': '$1517|6377', '歐瑞村莊': '$1773|6377', '亞丁城鎮': '$2126|6377', '威頓村莊': '$1596|6377', '說話之島村莊': '$829|6377',
};
const SAFE_R = 26;        // 村莊中心幾格內算安全區
const SPAWN_R = 20;       // 玩家幾格內的出生點會生怪
const MOB_CAP = 12;
// 怪物不會自己回血；失去攻擊目標（沒在打、玩家不在附近）滿 5 分鐘才一次補滿（站長 2026-11-13：有些頭目回血比單人輸出快，打不死）
const MOB_RESET_MS = 5 * 60 * 1000;
const MOB_ENGAGE_R = 12;  // 玩家在這幾格內、怪又是主動攻擊狀態＝還在交戰
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const rnd = n => Math.floor(Math.random() * n);
const jsonGet = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);

export const autoMixin = {
    // ── 資料：召喚表、傳送師目的地、出生點索引（進世界後第一次用到才建）──
    initAuto() {
        if (this._autoInit) return;
        this._autoInit = true;
        this.summonData = null; this.npcTele = {};
        jsonGet('/data/summons.json').then(d => { this.summonData = d; });
        jsonGet('/data/npctele.json').then(d => { this.npcTele = d || {}; });
        // 出生點（data/drops.json pts：地圖 → [怪物編號, x, y, …]）切成 16×16 的格子
        this._pts = {};
        for (const [m, a] of Object.entries((this.data.drops && this.data.drops.pts) || {})) {
            const cells = new Map();
            for (let i = 0; i + 2 < a.length; i += 3) {
                const k = (a[i + 1] >> 4) + ':' + (a[i + 2] >> 4);
                let l = cells.get(k);
                if (!l) cells.set(k, l = []);
                l.push(i);
            }
            this._pts[m] = { a, cells };
        }
        this._bossIds = new Set();
        for (const l of Object.values(this.data.bosses || {})) for (const b of l) this._bossIds.add(b.id);
        this._ptDead = new Map();     // 出生點 → 可以再生的時間
        this._bossDead = new Map();   // 頭目出生點 → 可以再生的時間
        this._mobHp = new Map();      // 打過、還沒打死就走遠（或飛走）的頭目／出生點怪 → { hp, at＝最後一次交戰的時間 }（MOB_RESET_MS 內回來血量照舊）
        this.towns = (this.data.teleports || []).filter(t => t.kind === '村莊').map(t => ({ map: t.map, x: t.x, y: t.y, name: t.name }));
    },

    nearSpawnPts(map, x, y, r) {
        const idx = this._pts[map], out = [];
        if (!idx) return out;
        for (let cx = (x - r) >> 4; cx <= (x + r) >> 4; cx++) {
            for (let cy = (y - r) >> 4; cy <= (y + r) >> 4; cy++) {
                for (const i of idx.cells.get(cx + ':' + cy) || []) {
                    if (Math.abs(idx.a[i + 1] - x) <= r && Math.abs(idx.a[i + 2] - y) <= r) out.push(i);
                }
            }
        }
        return out;
    },

    townAt(mapId, x, y, r = SAFE_R) {
        this.initAuto();
        return this.towns.find(t => t.map === mapId && Math.abs(t.x - x) <= r && Math.abs(t.y - y) <= r) || null;
    },

    isSafeTownSpot(mapId, x, y) { return !!this.townAt(mapId, x, y); },

    // 最近的村莊（回村用）：同一張地圖最近的，沒有就奇岩
    homeTown() {
        const ch = this.curChar;
        this.initAuto();
        let best = null, bd = Infinity;
        for (const t of this.towns) {
            if (t.map !== ch.mapId) continue;
            const d = cheb(t, ch);
            if (d < bd) { bd = d; best = t; }
        }
        return best || this.towns.find(t => t.name === '奇岩城鎮') || { map: 4, x: 33438, y: 32796, name: '奇岩城鎮' };
    },

    // ── 村莊 NPC：每個村莊放一組服務 NPC，傳送師用那個村莊自己的 ──
    spawnTownNpcs(mapId, px, py) {
        // 有連線版抄下來的 NPC 位置（data/npcspawn.json）的地圖：照真的位置放，不放下面那組通用 NPC
        const real = this.data.npcspawn && this.data.npcspawn[mapId];
        if (Array.isArray(real) && real.length) { this.spawnRealNpcs(mapId, real); return; }
        const town = this.townAt(mapId, px, py, 45);
        const teleKey = (town && TOWN_TELEPORTER[town.name]) || (town ? '' : TOWN_TELEPORTER['奇岩城鎮']);
        const defs = [
            { key: '$846|1208', title: '鐵匠', dx: -4, dy: -2 },
            { key: '$2690|1307', title: '製作工匠', dx: -2, dy: -4 },
            { key: '$309|143', title: '倉庫管理員', dx: 3, dy: -3 },
            teleKey && { key: teleKey, title: '傳送師', dx: 4, dy: 1 },
            { key: '$3428|940', title: '收購商人', dx: -3, dy: 3 },
            { key: '$840|792', title: '寵物商人', dx: 2, dy: 4 },
            // 鍵要跟 data/npccards.json 一樣（名字碼|外型），畫面才認得是 NPC、點了會說話；原本寫「魔法商人|792」「艾利溫|1307」點了沒反應
            { key: '$9157|2143', title: '魔法商人', dx: 0, dy: -4 },   // 倫德羅
            { key: '$1780|2115', title: '精靈屬性', dx: -5, dy: 0 },   // 艾利溫
        ].filter(Boolean);
        const baseX = town ? town.x : px, baseY = town ? town.y : py;
        for (const def of defs) {
            const [nm, g] = def.key.split('|');
            const npc = { id: this.nextObjId++, x: baseX + def.dx, y: baseY + def.dy, gfx: +g, name: def.name || nm, title: def.title, key: def.key, heading: 4, isPc: false, isNpc: true };
            this.mapNpcs.push(npc);
            if (!town) continue;   // 不在村莊：只列進遠端對話清單
            this.objs.set(npc.id, npc);
            this.emit('object', {
                id: npc.id, x: npc.x, y: npc.y, gfx: npc.gfx, weapon: 0, action: 0, heading: 4, light: 0, speed: 0, exp: 0, lawful: 0,
                name: npc.name, title: npc.title, status: 0, clanId: 0, clan: '', master: '', state: 0, hpRatio: 0xff, thirdSpeed: false, level: 50,
            });
        }
        let extra = 0;
        for (const [key, fn] of Object.entries(this.data.npcfn)) {
            if (extra >= 25) break;
            if (!(fn.shop && fn.shop.buy)) continue;
            const [nm, g] = key.split('|');
            this.mapNpcs.push({ id: this.nextObjId++, x: baseX + 5, y: baseY + 5, gfx: +g || 940, name: nm, title: this.data.npccards[key] || '商人', key, heading: 4, isPc: false, isNpc: true });
            extra++;
        }
    },

    // ── 照連線版位置放 NPC：整張地圖的都列進 mapNpcs（遠端對話清單），畫面上只送主人附近的（同連線版只送看得到的範圍）──
    spawnRealNpcs(mapId, list) {
        const cards = this.data.npccards || {};
        for (const [name, gfx, x, y] of list) {
            if (!name) continue;   // 沒名字的（地上的裝飾物件）不放
            const key = name + '|' + gfx;
            this.mapNpcs.push({ id: this.nextObjId++, x, y, gfx, name, title: cards[key] || '', key, mapKey: key + '@' + mapId, heading: 5, isPc: false, isNpc: true, real: true });
        }
        this._npcViewAt = null;
        this.refreshNpcView(true);
    },
    // 主人附近 NPC_VIEW 格內的送出來、走遠超過 NPC_DROP 格的拿掉；走不到 4 格就不重算
    refreshNpcView(force) {
        const ch = this.curChar;
        if (!ch) return;
        const at = this._npcViewAt;
        if (!force && at && at.map === ch.mapId && cheb(at, ch) < 4) return;
        this._npcViewAt = { map: ch.mapId, x: ch.x, y: ch.y };
        for (const npc of this.mapNpcs) {
            if (!npc.real) continue;
            const d = cheb(npc, ch), shown = this.objs.has(npc.id);
            if (!shown && d <= NPC_VIEW) {
                this.objs.set(npc.id, npc);
                this.emit('object', {
                    id: npc.id, x: npc.x, y: npc.y, gfx: npc.gfx, weapon: 0, action: 0, heading: npc.heading, light: 0, speed: 0, exp: 0, lawful: 0,
                    name: npc.name, title: npc.title, status: 0, clanId: 0, clan: '', master: '', state: 0, hpRatio: 0xff, thirdSpeed: false, level: 50,
                });
            } else if (shown && d > NPC_DROP) {
                this.objs.delete(npc.id);
                this.emit('remove', npc.id);
            }
        }
    },

    // ── 傳送師：動作字串（teleport 出發地-目的地）→ 目的地座標 ──
    //   data/npctele.json（動作 → [地圖, x, y]）優先；沒有就拿目的地名稱對狩獵場傳送表（data/teleports.json）
    teleDest(act, name) {
        this.initAuto();
        const t = this.npcTele[act];
        if (t) return { map: t[0], x: t[1], y: t[2], name: name || '' };
        const n = String(name || '').replace(/\s+/g, '');
        const hit = n && (this.data.teleports || []).find(d => d.name === n);
        return hit ? { map: hit.map, x: hit.x, y: hit.y, name: hit.name } : null;
    },

    npcTeleport(objId, act) {
        const npc = this.objs.get(objId) || this.mapNpcs.find(n => n.id === objId);
        const fn = npc && ((npc.mapKey && this.data.npcfn[npc.mapKey]) || this.data.npcfn[npc.key]);   // 「鍵@地圖」：同名同外型、不同地圖傳送清單不一樣
        const row = fn && fn.tele ? fn.tele.find(t => t[0] === act) : null;
        if (!row && !act.startsWith('teleport ')) return false;
        const dest = this.teleDest(act, row && row[1]);
        if (!dest) { this.sysMsg('「' + ((row && row[1]) || act) + '」的傳送座標還沒有建立，無法傳送。'); return true; }
        const price = row ? row[2] | 0 : 0;
        // 第 5 欄＝要交的道具 [名稱, 圖示, 個數]（連線版精靈墓穴／地底湖的傳送師收精靈結晶）：先看夠不夠，金幣扣了才扣道具
        const cost = row && Array.isArray(row[4]) ? row[4] : null;
        let costId = 0, costN = 0;
        if (cost) {
            costN = Math.max(1, cost[2] | 0);
            const mk = (this.data.npcmake && this.data.npcmake.items) || {};
            costId = +(Object.keys(mk).find(id => mk[id] && mk[id][0] === cost[0]) || 0);
            if (!costId || this.countMat(costId) < costN) { this.sysMsg('需要' + cost[0] + ' ×' + costN + '才能傳送。'); return true; }
        }
        if (price > 0 && !this.spendGold(price)) { this.sysMsg('金幣不足，傳送需要 ' + price.toLocaleString() + ' 金幣。'); return true; }
        if (costId) this.consumeMat(costId, costN);
        this.teleportTo(dest.map, dest.x, dest.y, true);
        this.sysMsg('傳送至「' + (dest.name || row[1]) + '」。');
        this.tutNote('tele');
        return true;
    },

    // ── 怪物、頭目出生 ──
    spawnMob(tplId, x, y, extra) {
        const tpl = (this.data.drops && this.data.drops.mobs && this.data.drops.mobs[tplId]) || { n: '妖魔', lv: 5, hp: 30, ac: 8, mr: 0, exp: 25, gold: [20, 60], d: [] };
        const now = Date.now(), maxHp = Math.max(5, tpl.hp || (tpl.lv || 1) * 12);
        const mob = Object.assign({
            id: this.nextObjId++, tplId: +tplId, name: tpl.n, level: tpl.lv || 1, hp: maxHp, maxHp,
            ac: tpl.ac != null ? tpl.ac : 10, mr: tpl.mr || 0, dr: tpl.dr || 0,
            exp: Math.max(5, tpl.exp || (tpl.lv || 1) * (tpl.lv || 1) * 2), drops: tpl.d || [], gold: tpl.gold || [10, 50],
            x, y, gfx: this.getMobGfx(tpl.n), heading: rnd(8), isPc: false, isMob: true,
            isUndead: !!tpl.u || /殭屍|骷髏|食屍鬼|鬼魂|幽靈|吸血鬼|木乃伊/.test(tpl.n), isLarge: !!tpl.sz,
            aggro: !!tpl.ag || /狼人|侏儒|妖魔|歐克|蜥蜴人/.test(tpl.n), dead: false, lastMoveAt: now + Math.random() * 1500, lastAtkAt: 0,
        }, extra || {});
        mob.mapId = this.curChar ? this.curChar.mapId : 0;
        mob.engagedAt = now;
        // 5 分鐘內打過又走開的同一隻（頭目、出生點怪）：血量照舊，不會走遠一下就補滿
        const k = this.mobHpKey(mob), rec = k && this._mobHp && this._mobHp.get(k);
        if (rec) {
            this._mobHp.delete(k);
            if (now - rec.at < MOB_RESET_MS) { mob.hp = Math.max(1, Math.min(mob.maxHp, rec.hp)); mob.engagedAt = rec.at; mob.aggro = true; }
        }
        mob._lastHp = mob.hp;
        this.mapMobs.push(mob);
        this.objs.set(mob.id, mob);
        this.emit('object', {
            id: mob.id, x: mob.x, y: mob.y, gfx: mob.gfx, weapon: 0, action: 0, heading: mob.heading, light: 0, speed: 0, exp: 0, lawful: 0,
            name: mob.name, title: '', status: 0, clanId: 0, clan: '', master: '', state: 0, hpRatio: 0xff, thirdSpeed: false, level: mob.level,
        });
        return mob;
    },

    // 同一隻怪的記號：頭目＝出生點、大陸的怪＝地圖＋出生點；地監隨機生的怪沒有固定身分（不記）
    mobHpKey(m) {
        if (m.bossKey) return 'b:' + m.bossKey;
        if (m.pt != null) return 'p:' + m.mapId + ':' + m.pt;
        return '';
    },
    // 怪離開畫面（走遠、換地圖）時還沒打死、有受傷：記下血量
    rememberMobHp(m) {
        if (!this._mobHp || m.dead || !(m.hp < m.maxHp)) return;
        const k = this.mobHpKey(m);
        if (k) this._mobHp.set(k, { hp: m.hp, at: m.engagedAt || Date.now() });
    },

    // 頭目只在自己真正的出生點出現（data/bosses.json 的 x、y／pts），玩家走近才生；打倒後 10 分鐘再生
    spawnBosses(now) {
        const ch = this.curChar, mapKey = String(ch.mapId);
        for (const b of (this.data.bosses && this.data.bosses[mapKey]) || []) {
            const pts = b.pts || (b.x ? [[b.x, b.y]] : []);
            for (const [bx, by] of pts) {
                if (Math.max(Math.abs(bx - ch.x), Math.abs(by - ch.y)) > SPAWN_R + 2) continue;
                const key = mapKey + ':' + b.id + ':' + bx + ':' + by;
                if (this.mapMobs.some(m => m.bossKey === key)) continue;
                if ((this._bossDead.get(key) || 0) > now) continue;
                const raw = (this.data.drops.mobs && this.data.drops.mobs[b.id]) || {};
                const hp = Math.max(1500, (raw.hp || (b.lv || 60) * 150) * 3);
                const taken = this.mapMobs.some(m => !m.dead && m.x === bx && m.y === by);
                const mob = this.spawnMob(b.id, bx + (taken ? rnd(5) - 2 : 0), by + (taken ? rnd(5) - 2 : 0), {
                    name: '★ ' + b.n, level: b.lv || raw.lv || 60, hp, maxHp: hp, ac: raw.ac != null ? raw.ac : -30, mr: raw.mr != null ? raw.mr : 70, dr: 5,
                    exp: Math.max(2000, (b.lv || 60) * 300), gold: [2000, 10000], gfx: this.getMobGfx(b.n), isBoss: true, isLarge: true, aggro: true, bossKey: key,
                    isUndead: !!raw.u || /死亡騎士|不死|卡士伯|黑長者/.test(b.n),
                });
                this.sysMsg('⚠️ 警告：首領【' + mob.name + '】就在附近！');
            }
        }
    },

    maintainMonsters() {
        const ch = this.curChar;
        if (!ch) return;
        this.initAuto();
        const now = Date.now(), mapKey = String(ch.mapId);
        this.mapMobs = this.mapMobs.filter(m => {
            const gone = m.dead ? now - m.deadAt > 2500 : cheb(m, ch) > 26;
            if (!gone) return true;
            this.rememberMobHp(m);
            if (m.dead && m.pt != null) this._ptDead.set(mapKey + ':' + m.pt, now + 10000);
            if (m.dead && m.bossKey) this._bossDead.set(m.bossKey, now + 600000);
            this.objs.delete(m.id);
            this.emit('remove', m.id);
            return false;
        });
        this.spawnBosses(now);
        if (this.isSafeTownSpot(ch.mapId, ch.x, ch.y)) return;
        let alive = this.mapMobs.filter(m => !m.dead && !m.isBoss).length;
        const idx = this._pts[mapKey];
        if (idx) {
            // 有出生點資料的地圖（大陸）：怪生在牠真正的出生點
            const used = new Set(this.mapMobs.filter(m => m.pt != null).map(m => m.pt));
            const cand = this.nearSpawnPts(mapKey, ch.x, ch.y, SPAWN_R).filter(i => !used.has(i) && !this._bossIds.has(idx.a[i])
                && (this._ptDead.get(mapKey + ':' + i) || 0) <= now && (idx.a[i + 1] !== ch.x || idx.a[i + 2] !== ch.y));
            while (alive < MOB_CAP && cand.length) {
                const i = cand.splice(rnd(cand.length), 1)[0];
                this.spawnMob(idx.a[i], idx.a[i + 1], idx.a[i + 2], { pt: i });
                alive++;
            }
            return;
        }
        // 沒有出生點資料的地圖（地監…）：這張地圖會出的怪，生在玩家周圍
        const ids = ((this.data.drops && this.data.drops.maps && this.data.drops.maps[mapKey]) || []).filter(id => !this._bossIds.has(id));
        if (!ids.length) return;
        // 玩家回報（傲慢之塔 2 樓）：怪生在塔外黑色、走不到的地方 → 只生在從玩家這格走得到的空地；通行資料還在載＝這次先不生
        const w = this.mapWorld();
        if (w === 'wait') return;
        let spots = null;
        if (w) {
            spots = this.reachSpots(w, ch.x, ch.y, 7).filter(([x, y]) => Math.max(Math.abs(x - ch.x), Math.abs(y - ch.y)) >= 2
                && !this.mapMobs.some(m => !m.dead && m.x === x && m.y === y));
            if (!spots.length) return;
        }
        for (; alive < MOB_CAP; alive++) {
            if (spots) {
                if (!spots.length) break;
                const [sx, sy] = spots.splice(rnd(spots.length), 1)[0];
                this.spawnMob(ids[rnd(ids.length)], sx, sy);
                continue;
            }
            let dx = 0, dy = 0;
            for (let t = 0; t < 12 && Math.abs(dx) < 2 && Math.abs(dy) < 2; t++) { dx = rnd(15) - 7; dy = rnd(15) - 7; }
            this.spawnMob(ids[rnd(ids.length)], ch.x + dx, ch.y + dy);
        }
    },

    // ── 掛機設定：預設值、存檔裡舊設定的整理 ──
    learned(sid) { const ch = this.curChar; return !!(sid > 0 && ch && ch.skills && ch.skills.includes(sid)); },
    skillTpl(sid) { return this.data.skills.find(s => s.sid === sid) || null; },
    canCast(sid) {
        const ch = this.curChar, sk = this.learned(sid) ? this.skillTpl(sid) : null;
        return !!(sk && ch.mp >= (sk.mp || 0) && ch.hp > (sk.hp || 0));
    },

    sendAutoSettings() {
        const ch = this.curChar;
        if (!ch) return;
        let s = ch.autoSettings;
        // 舊存檔的法師、妖精沒有攻擊／召喚／洗魔魔法（設定 → 魔法、召喚 沒東西可選）：補一次新角色會有的那幾個
        if (!ch.kit2) {
            ch.kit2 = 1;
            const kit = [4].concat(ch.type === 3 ? [6, 7, 10, 15, 16, 17, 22, 25, 28, 34, 38, 45, 46, 51, 57] : ch.type === 2 ? [6, 7, 15, 130, 154] : []).filter(sid => !this.learned(sid))
                .filter(sid => { if (this.skillFree()) return true; const need = this.skillReqLv(sid, ch.type); return need != null && need <= (ch.level || 1); });   // 只補職業、等級學得到的
            if (kit.length) { ch.skills = (ch.skills || []).concat(kit); this.sendSkills(); this.sendLearnMagicList(); }
        }
        const firstOf = f => { const k = this.data.skills.find(x => this.learned(x.sid) && f(x)); return k ? k.sid : 0; };
        const atk = firstOf(x => (x.type & 64) && x.sid !== 108 && x.sid !== 72);
        const aoe = firstOf(x => (x.type & 64) && x.area !== 0 && x.sid !== 72);
        const heal = firstOf(x => x.type & 16), hpk = firstOf(x => x.sid === 130 || x.sid === 146), sum = firstOf(x => x.sid === 51 || x.sid === 154 || x.sid === 162);
        if (!s || !s.rev) {
            // 新角色，或舊版離線伺服器留下的設定（開關跟實際沒對上）：重設成合理的預設
            const old = s || {};
            s = ch.autoSettings = {
                rev: 2,
                potion: 40029, potKeep: 40029, hpPct: 70,
                homeHpPct: 30, homeKeep: 30, repairMode: 0,
                roamRange: 25, teleSec: 10,
                flags: 1 | 2 | (ch.type === 3 || ch.type === 2 ? 4 : 0),
                greenPot: 40018, bluePot: 40015, breathPot: 40032, expPot: 0, blessPot: 49904, cureBy: 0,
                poly: typeof old.poly === 'string' ? old.poly : '',
                buffs: [],
                openSkill: 0, openKeep: atk, openMpPct: 50,
                aoeSkill: 0, aoeKeep: aoe, aoeCount: 3, aoeMpPct: 50,
                atkSkill: ch.type === 3 ? atk : 0, atkKeep: atk, atkMpPct: 30,
                healSkill: heal, healKeep: heal, healHpPct: 50,
                hpSkill: 0, hpKeep: hpk, hpSkillPct: 80, hpSkillMp: 40,
                restMpPct: 30, restMpUp: 60, petMpPct: 0,
                summonSkill: 0, sumKeep: sum, ringNpc: 0, dollItem: 0,
                dollAuto: 0, dollKeep: (ch.dolls && ch.dolls.worn) || 0,
                boss: old.boss || {}, ignore: old.ignore || {}, sell: old.sell || [], pets: [],
            };
        }
        // 只認學會的魔法（沒學會的關掉、記著的換成學會的）
        const fix = (use, keep, def) => {
            if (!this.learned(s[use])) s[use] = 0;
            if (!this.learned(s[keep])) s[keep] = def;
        };
        fix('openSkill', 'openKeep', atk); fix('aoeSkill', 'aoeKeep', aoe); fix('atkSkill', 'atkKeep', atk);
        fix('healSkill', 'healKeep', heal); fix('hpSkill', 'hpKeep', hpk); fix('summonSkill', 'sumKeep', sum);
        s.buffs = (s.buffs || []).filter(b => this.learned(b));
        for (const k of ['boss', 'ignore']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
        if (!Array.isArray(s.sell)) s.sell = [];
        if (!Array.isArray(s.pets)) s.pets = [];
        delete s.roamCenter;
        // 網頁靠這些標記決定要不要顯示各列（protocol.js S_Web 2）
        Object.assign(s, { hasHome: true, feat: 3, maxSell: 100, clash: null,
            v2: true, v3: true, v4: true, v5: true, v6: true, v7: true, v8: true, v9: true, v10: false, v11: true, v12: true, v14: false, v15: false, v16: false, v17: true, v18: true, v19: true });
        this.emit('autoSettings', JSON.parse(JSON.stringify(s)));
        this.emit('autoState', { on: !!this.autoOn, reason: '', card: false });
    },

    autoSettings(cfg) {
        const ch = this.curChar;
        if (!ch) return;
        ch.autoSettings = Object.assign({}, ch.autoSettings || {}, cfg, { rev: 2 });
        this.sendAutoSettings();
        this.save();
    },

    autoStatusText(text, warn) {
        if (this._autoText === text) return;
        this._autoText = text;
        this.emit('autoStatus', { code: this.autoOn ? 1 : 0, warn: !!warn, text });
    },

    autoToggle(on, reason) {
        const ch = this.curChar;
        this.autoOn = !!on && !!ch;
        this.autoTargetId = 0;
        this._resting = false; this._escapes = []; this._noMobAt = 0; this._autoText = null;
        // 巡邏範圍從開 AUTO 的地方算起；在村莊裡開的＝走出去打到第一隻怪的地方
        this.autoCenter = this.autoOn && !this.isSafeTownSpot(ch.mapId, ch.x, ch.y) ? { x: ch.x, y: ch.y } : null;
        this.emit('autoState', { on: this.autoOn, reason: reason || '', card: false });
        this.autoStatusText(this.autoOn ? '自動尋怪狩獵中' : '');
    },

    // ── 道具：背包沒有就照商店價買（data/shopbuy.json：[價錢, 一組幾個]）──
    autoBuy(itemId, n) {
        const sb = this.data.shopbuy[itemId];
        if (!sb) return null;
        const pack = sb[1] || 1, packs = Math.ceil(n / pack), cost = (sb[0] || 0) * packs;
        if (!this.spendGold(cost)) {
            if (this._noGoldFor !== itemId) { this._noGoldFor = itemId; this.sysMsg('金幣不足，無法自動購買補給品。'); }
            return null;
        }
        return this.giveItem(itemId, packs * pack);
    },
    needItem(itemId, buyN) { return this.findInvByItemId(itemId) || (buyN ? this.autoBuy(itemId, buyN) : null); },

    // 隨機瞬移（卷軸、瞬間移動術、AUTO 找怪）：r 格內挑落點。玩家回報會飛到傲慢之塔外圍 → 落點要是空地，
    //   先挑從現在位置走得到的（至少離 4 格），沒有才挑其他空地；通行資料還在載＝原地；這張圖沒有畫面資料＝照舊亂數
    //   玩家 2026-11-13「目前僅能瞬移兩格是錯誤的」：原本只在畫面已經載進來的那一小塊、10～12 格內挑 →
    //   改照 L1J（l1j-en L1Teleport.randomTeleport → L1Location.randomLocation(200, true)）：同一張圖、上下左右 200 格的方框內
    //   均勻亂數挑 40 次（框夾在地圖範圍內），第一個「在圖內、能站」的就是落點；40 次都不行＝原地。
    //   落點那一區的通行資料還沒載：先叫畫面把那幾區抓下來（最多等 3 秒），沒載到的當牆。另外保留原本的「至少三個方向走得出去」，不落進牆縫
    //   回 false＝這張圖不能隨機瞬移（L1J isTeleportable＝0，訊息 276），呼叫的人不要扣卷軸
    randomTeleport(r = TELE_RANGE) {
        const ch = this.curChar;
        if (!ch) return false;
        if (!this.canRandomTele()) { this.sysMsg('在這裡無法隨機傳送。'); return false; }
        if (this._teleBusy) return true;
        const w = this.mapWorld();
        if (w && w !== 'wait' && w.wantRegions) { this.randomTeleportL1J(r, w); return true; }
        this.randomTeleportNear(Math.min(r, 20), w);
        return true;
    },
    // 這張圖能不能隨機瞬移（teleports.json 的 noTp＝伺服器 mapids teleportable 0；沒資料的圖當可以）
    canRandomTele() {
        if (!this._noTpMaps) this._noTpMaps = new Set((this.data.teleports || []).filter(t => t && t.noTp).map(t => t.map));
        return !this._noTpMaps.has(this.curChar.mapId);
    },
    randomTeleportL1J(r, w) {
        const ch = this.curChar, mapId = ch.mapId, x0 = ch.x, y0 = ch.y, t = w.map, d = t.d;
        const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const xa = cl(x0 - r, d.gameX0 + 1, d.gameX0 + d.cw - 2), xb = cl(x0 + r, d.gameX0 + 1, d.gameX0 + d.cw - 2);
        const ya = cl(y0 - r, d.gameY0 + 1, d.gameY0 + d.ch - 2), yb = cl(y0 + r, d.gameY0 + 1, d.gameY0 + d.ch - 2);
        const cands = [];
        for (let i = 0; i < 40; i++) cands.push([xa + rnd(xb - xa + 1), ya + rnd(yb - ya + 1)]);
        const regOf = (x, y) => Math.floor((y - d.gameY0) / d.rs) * d.rnx + Math.floor((x - d.gameX0) / d.rs);
        const want = (x, y) => { const lx = x - d.gameX0, ly = y - d.gameY0; w.wantRegions(lx - 24, ly - 24, lx + 24, ly + 24); };   // 周圍也抓：要數走不走得出去（openArea）
        cands.forEach(([x, y]) => want(x, y));
        // 畫面每 2 秒會丟掉離畫面遠的區：等的時候被丟掉的再叫一次
        const loaded = () => cands.every(([x, y]) => {
            const i = regOf(x, y), g = t.reg[i];
            if (d.regions[i] === -1) return true;
            if (!g) { want(x, y); return false; }
            return g.ready || g.failed;
        });
        this._teleBusy = true;
        const t0 = Date.now();
        const finish = () => {
            this._teleBusy = false;
            if (this.curChar !== ch || ch.mapId !== mapId || w.map !== t) return;   // 等的時候換了角色、地圖
            let to = null;
            for (const [x, y] of cands) {
                if (!this.openAt(w, x, y)) continue;
                let ways = 0;
                for (let h = 0; h < 8; h++) if (w.canStep(x, y, h, null, true)) ways++;
                // 站長 2026-11-13「小地圖多飛幾次看會不會飛到地圖外」：傲慢之塔、象牙塔、冒險洞窟各飛 150 次都在裡面，
                //   但傲慢之塔地下水路有一間 77 格的封閉房間（能站、走不出去、沒有傳點）。
                //   L1J 只看能不能站會飛進去 → 這裡另外要求從落點走得到至少 POCKET_MIN 格，困死人的小空間不當落點
                if (ways >= 3 && this.openArea(w, x, y, POCKET_MIN) >= POCKET_MIN) { to = [x, y]; break; }
            }
            this.teleportTo(mapId, to ? to[0] : ch.x, to ? to[1] : ch.y, true);   // 40 次都不能站＝原地（同 L1J）
        };
        const wait = () => { if (loaded() || Date.now() - t0 > 3000) finish(); else setTimeout(wait, 80); };
        wait();
    },
    // 從 (x,y) 走得到幾格（八方向擴散，數到 cap 就停）：用來排除能站、但四周被牆封死的小空間
    openArea(w, x, y, cap) {
        const seen = new Set([x + ':' + y]), q = [[x, y]];
        for (let i = 0; i < q.length && seen.size < cap; i++) {
            const [cx, cy] = q[i];
            for (let h = 0; h < 8; h++) {
                const nx = cx + DX[h], ny = cy + DY[h], k = nx + ':' + ny;
                if (seen.has(k) || !w.canStep(cx, cy, h, null, true)) continue;
                seen.add(k); q.push([nx, ny]);
            }
        }
        return seen.size;
    },
    // 沒有畫面的通行資料（這張圖沒有地圖檔、還在載）：照原本在附近挑
    randomTeleportNear(r, w) {
        const ch = this.curChar;
        let x = ch.x, y = ch.y;
        if (!w) { x += rnd(2 * r + 1) - r; y += rnd(2 * r + 1) - r; }
        else if (w !== 'wait') {
            const far = this.reachSpots(w, ch.x, ch.y, r).filter(([a, b]) => Math.max(Math.abs(a - ch.x), Math.abs(b - ch.y)) >= 4);
            if (far.length) [x, y] = far[rnd(far.length)];
            else for (let t = 0; t < 300; t++) {
                const a = ch.x + rnd(2 * r + 1) - r, b = ch.y + rnd(2 * r + 1) - r;
                let ways = 0;
                for (let h = 0; h < 8; h++) if (w.canStep(a, b, h, null, true)) ways++;
                if (this.openAt(w, a, b) && ways >= 3) { x = a; y = b; break; }   // 至少三個方向走得出去，不落進牆縫
            }
        }
        this.teleportTo(ch.mapId, x, y, true);
    },
    // 這張地圖的通行資料（畫面那邊 window.__world）：回 world；'wait'＝還在載；null＝沒有 world、這張圖沒有畫面資料、等太久（照舊不檢查）
    mapWorld() {
        const w = typeof window !== 'undefined' && window.__world, ch = this.curChar;
        if (!w || !ch) return null;
        if (w.map && w.map.id === ch.mapId && w.map.d) { this._mwWait = null; return w; }
        if (w.missing === ch.mapId) return null;
        if (!this._mwWait || this._mwWait.m !== ch.mapId) this._mwWait = { m: ch.mapId, at: Date.now() };
        return Date.now() - this._mwWait.at > 15000 ? null : 'wait';
    },
    openAt(w, x, y) { const d = w.map.d; return !!w.pass(x - d.gameX0, y - d.gameY0); },
    // 從 (x,y) 走得到、r 格內的所有格子（八方向擴散，跟走路同一套牆的判斷；不含起點）
    reachSpots(w, x, y, r) {
        const out = [], seen = new Set([x + ':' + y]), q = [[x, y]];
        for (let i = 0; i < q.length; i++) {
            const [cx, cy] = q[i];
            for (let h = 0; h < 8; h++) {
                const nx = cx + DX[h], ny = cy + DY[h], k = nx + ':' + ny;
                if (seen.has(k) || Math.abs(nx - x) > r || Math.abs(ny - y) > r) continue;
                seen.add(k);
                if (!w.canStep(cx, cy, h, null, true)) continue;
                q.push([nx, ny]);
                out.push([nx, ny]);
            }
        }
        return out;
    },
    // 用瞬間移動卷軸逃（沒有就買 1 張）；學會瞬間移動術、魔力夠就用魔法
    autoEscapeTele() {
        const ch = this.curChar;
        if (this._teleBusy) return true;          // 上一次還在找落點：不要再扣一張
        if (!this.canRandomTele()) return false;   // 不能瞬移的地圖：不扣卷軸、魔力
        const sc = this.needItem(TELE_SCROLL, 1);
        if (sc) this.consumeItem(sc.id, 1);
        else if (this.canCast(5)) ch.mp -= this.skillTpl(5).mp || 0;
        else return false;
        this.randomTeleport();
        return true;
    },
    autoGoHome(reason) {
        const ch = this.curChar, sc = this.findInvByItemId(HOME_SCROLL) || this.findInvByItemId(HOME_STONE) || this.autoBuy(HOME_SCROLL, 1);
        if (!sc) return false;
        this.consumeItem(sc.id, 1);
        const t = this.homeTown();
        this.autoToggle(false, reason);
        this.teleportTo(t.map, t.x, t.y, true);
        this.sysMsg('⚠️ ' + reason + '（' + t.name + '）');
        return true;
    },

    // ── 補給、治癒、輔助魔法：掛機沒開也會做 ──
    tickCare(now) {
        const ch = this.curChar, s = ch.autoSettings;
        if (!s) return;
        const f = s.flags | 0, hpPct = ch.hp * 100 / ch.maxHp, mpPct = ch.mp * 100 / ch.maxMp;
        // 喝水：開關開著（potion > 0）、體力低於設定才喝；喝完看「喝完先喝身上別種」，都沒有就買選的那種
        if (s.potion > 0 && hpPct < (s.hpPct || 70) && now - (this._potAt || 0) >= 600) {
            let pot = this.findInvByItemId(s.potion);
            if (!pot && !(f & 1073741824)) pot = (ch.inv || []).find(it => HEAL_POTS[it.itemId]);
            if (!pot) pot = this.autoBuy(s.potion, 100);
            if (pot) { this._potAt = now; this.useConsumable(pot); }
        }
        // 治癒魔法
        if (s.healSkill > 0 && hpPct < (s.healHpPct || 50) && now - (this._castAt || 0) >= 1000 && this.canCast(s.healSkill)) {
            this.useSkill(s.healSkill, { id: ch.id });
            return;
        }
        if (now - (this._careAt || 0) < 1000) return;
        const did = () => { this._careAt = now; return true; };
        const drink = (itemId, buyN) => { const it = this.needItem(itemId, buyN); if (it) { this.useConsumable(it); return did(); } return false; };
        if ((f & 1) && !this.hasHaste() && drink(s.greenPot === 40018 ? 40018 : 40013, 1)) return;
        if ((f & 2) && BRAVE_ITEM[ch.type] && !this.hasBrave() && drink(BRAVE_ITEM[ch.type], 1)) return;
        if ((f & 4) && !this.hasEffect(1002) && !this.hasEffect(1028) && drink(s.bluePot === 40736 ? 40736 : 40015, s.bluePot === 40736 ? 0 : 5)) return;
        if ((f & 8) && ch.type === 3 && !this.hasEffect(1004) && drink(WIS_POTION, 5)) return;
        if ((f & 256) && !this.hasEffect(31) && drink(BARRIER_SCROLL, 0)) return;
        if ((f & 128) && !this.hasEffect(67)) {
            const sc = this.needItem(POLY_SCROLL, 1);
            if (sc) {
                const pool = (this.data.polys || []).filter(p => p.g && (p.lv || 1) <= ch.level);
                const name = s.poly || (pool.length ? pool[rnd(pool.length)].n : '');
                if (name) { this.consumeItem(sc.id, 1); this.applyPoly(name, 1800); did(); return; }
            }
        }
        if ((f & 2048) && (ch.weaponVisual === 20) && !(ch.inv || []).some(it => /箭/.test(it.nid || '') || it.itemId === SILVER_ARROW) && this.autoBuy(SILVER_ARROW, 500)) { did(); return; }
        if ((f & 1048576) && this.autoOn && !(ch.expPotUntil > now)) {
            const ids = s.expPot ? [s.expPot] : EXP_POTS, it = ids.map(id => this.findInvByItemId(id)).find(Boolean);
            if (it) { this.useConsumable(it); did(); return; }
        }
        // 沒有娃娃時自動召喚選的那隻（要擁有）
        if (s.dollAuto > 0 && ch.dolls && !ch.dolls.worn && ch.dolls.own && ch.dolls.own[s.dollAuto] > 0) { this.dollWear(s.dollAuto); did(); return; }
        if (now - (this._castAt || 0) < 1000) return;
        // 洗魔：體力高於、魔力低於設定，安全區不放
        if (s.hpSkill > 0 && hpPct > (s.hpSkillPct || 0) && mpPct < (s.hpSkillMp || 40) && this.canCast(s.hpSkill) && !this.isSafeTownSpot(ch.mapId, ch.x, ch.y)) {
            this.useSkill(s.hpSkill);
            return;
        }
        // 輔助魔法：效果沒了就補
        for (const sid of s.buffs || []) {
            if (!this.hasEffect(sid) && this.canCast(sid)) { this.useSkill(sid, { id: ch.id }); return; }
        }
        // 召喚：掛機時身邊沒有召喚物就施放
        if (this.autoOn && s.summonSkill > 0 && !this.summon && this.canCast(s.summonSkill)) this.useSkill(s.summonSkill);
    },

    // ── 自動賣出／自動刪除（背包「自動賣出」清單＝AUTO 設定的 sell）：AUTO 開不開都會做，每 3 秒看一次背包 ──
    //   原本離線版只把清單存起來，沒有任何地方真的去賣（玩家 2026-11-13 回報「自動賣出沒有運作」）
    //   清單的值：正的＝賣出（商店不收的直接刪）、負的＝刪除；祝福的（bless 0）算「編號 + 100000」那一項（同 hud.js asKey）
    //   不動：穿著的、強化過的、有屬性的、上鎖的、金幣、項圈、主城傳送石、象牙塔卷軸／裝備、補給會用到的（同 hud.js AS_SKIP、invIds 的 supply）
    tickSell() {
        const ch = this.curChar, s = ch && ch.autoSettings;
        if (!s || !Array.isArray(s.sell) || !s.sell.length) return;
        const mode = new Map();
        for (const v of s.sell) if (v) mode.set(Math.abs(v), v < 0 ? 'del' : 'sell');
        const keep = new Set([40308, 40314, 40316, HOME_STONE, 49311, 49312, ...SELL_KEEP]);
        if (s.potion > 0) keep.add(s.potion);
        let soldN = 0, gold = 0, delN = 0;
        for (const it of (ch.inv || []).slice()) {
            if (it.equipped || it.locked || it.pet || it.inn || (it.ench | 0) !== 0 || it.attr || it.elem || keep.has(it.itemId)) continue;
            const key = it.bless === 0 && it.itemId < 100000 ? it.itemId + 100000 : it.itemId;
            const m = mode.get(key);
            if (!m) continue;
            const e = this.data.itemsById.get(it.itemId), k = e && e.tpl && e.tpl.k;
            if ((k === 'w' || k === 'a') && /^象牙塔/.test(this.itemName(it.itemId))) continue;   // 新手送的象牙塔裝備
            const n = it.count | 0 || 1;
            const price = m === 'sell' ? (this.data.shopsell[key] || this.data.shopsell[it.itemId] || 0) : 0;
            this.consumeItem(it.id, n);
            if (price > 0) { soldN += n; gold += price * n; } else delN += n;
        }
        if (!soldN && !delN) return;
        if (gold > 0) this.giveItem(GOLD_ID_A, gold);
        if (this.autoLog) { this.autoLog.soldCount += soldN; this.autoLog.soldGold += gold; }
        this.save();
    },

    // ── 召喚物：跟著主人、打主人在打的怪 ──
    castSummon(sk) {
        const ch = this.curChar, d = this.summonData, s = ch.autoSettings || {};
        if (!d) return;
        const hasRing = (ch.inv || []).some(it => it.equipped && it.itemId === SUMMON_RING);
        const ring = hasRing && s.ringNpc ? ((d.ring && d.ring.list) || []).find(r => r.npc === s.ringNpc && ch.level >= (r.need || 0)) : null;
        const list = (d.auto && d.auto.list) || [];
        const pick = ring || list.find(l => ch.level >= l.from && (l.to == null || ch.level <= l.to)) || list[0];
        if (!pick) return;
        this.dismissSummon();
        const hp = Math.max(50, pick.lv * 20);
        this.summon = { id: this.nextObjId++, isSummon: true, kind: sk.sid === 51 ? 2 : sk.sid === 154 ? 4 : 5, name: pick.nid || pick.name, cname: pick.name, gfx: pick.gfx,
            level: pick.lv, hp, maxHp: hp, x: ch.x + 1, y: ch.y, heading: ch.heading, until: Date.now() + 3600000, lastAtkAt: 0, lastMoveAt: 0 };
        this.showSummon();
        this.sendCompanions();
        this.sysMsg('召喚了「' + pick.name + '」。');
    },
    showSummon(c = this.summon) {
        const ch = this.curChar;
        if (!c || !ch) return;
        this.objs.set(c.id, c);
        this.emit('object', {
            id: c.id, x: c.x, y: c.y, gfx: c.gfx, weapon: 0, action: 0, heading: c.heading, light: 0, speed: 0, exp: 0, lawful: 0,
            name: c.name, title: '', status: 0, clanId: 0, clan: '', master: ch.name, state: 0, hpRatio: 100, thirdSpeed: false, level: c.level,
        });
    },
    dismissSummon() {
        const c = this.summon;
        if (!c) return;
        this.summon = null;
        this.objs.delete(c.id);
        this.emit('remove', c.id);
        this.sendCompanions();
    },
    sendCompanions() {
        const list = [];
        for (const c of [this.pet, this.summon]) {
            if (!c) continue;
            const col = c.isPet ? this.petCol(c.id) : null, gear = col ? col.pet : {}, set = (col ? col.pet.set : c.set) || {};
            const x = { id: c.id, kind: c.kind, name: c.name, tname: c.name, gfx: c.gfx, lv: c.level, hp: c.hp, mhp: c.maxHp, mp: 0, mmp: 0,
                wpn: gear.wpn ? gear.wpn.name : '', arm: gear.arm ? gear.arm.name : '',
                pct: set.pct | 0, pot: set.pot | 0, green: !!set.green, gmode: set.gmode | 0, heal: set.heal | 0, st: 1, collar: c.collar || 0 };
            if (c.isPet) x.exp = Math.min(100, Math.floor((c.exp || 0) * 100 / this.petNeed(c.level)));
            else x.endAt = performance.now() + (c.until - Date.now());
            list.push(x);
        }
        this.emit('companions', { canHaste: false, list });
    },

    // ── 寵物：跟寵物商買項圈（裡面 Lv5），用項圈叫出來／收回去；跟著主人打怪、升級（最高到主人等級）──
    petInfo(npcId) {   // data/npcfn.json 各寵物商的 pet 清單：[動作, 名字, 價錢, 外型]
        for (const fn of Object.values(this.data.npcfn || {})) {
            const p = (fn.pet || []).find(r => r[0] === 'buypet ' + npcId);
            if (p) return { npc: npcId, name: p[1], price: +p[2] || 50000, gfx: +p[3] };
        }
        return null;
    },
    petNeed(lv) { return Math.max(100, lv * lv * 20); },   // 升下一級要的經驗
    petMaxHp(lv) { return 30 + lv * 12; },
    petBuy(act) {
        const ch = this.curChar, info = this.petInfo(parseInt(act.slice(7), 10));
        if (!ch || !info) return;
        if (!this.spendGold(info.price)) { this.sysMsg('金幣不足，購買' + info.name + '需要 ' + info.price.toLocaleString() + ' 金幣。'); return; }
        // 項圈不能疊：每個項圈各自一隻寵物（不走 giveItem，那個會疊在一起）
        const it = this.makeItemInstance(PET_COLLAR, 1, 0, null, false);
        it.pet = { npc: info.npc, name: info.name, gfx: info.gfx, lv: 5, exp: 0 };
        it.name = this.formatItemName(it);
        this.addInvInstance(it);
        this.sysMsg('獲得項圈[Lv.5 ' + info.name + ']，在背包點兩下項圈就能叫出寵物。');
        this.sendPetCollars();
        this.save();
    },
    petToggle(col) {
        if (this.pet && this.pet.collar === col.id) { this.petStash(); return; }
        this.petSummon(col);
    },
    petSummon(col) {
        const ch = this.curChar;
        if (!ch || !col || !col.pet) return;
        this.petStash(true);
        const p = col.pet, hp = this.petMaxHp(p.lv);
        this.pet = { id: this.nextObjId++, isPet: true, kind: 1, collar: col.id, name: p.name, cname: p.name, gfx: p.gfx, level: p.lv, exp: p.exp || 0,
            hp, maxHp: hp, x: ch.x + 1, y: ch.y, heading: ch.heading, until: Infinity, lastAtkAt: 0, lastMoveAt: 0 };
        this.petApplyGear();
        this.showSummon(this.pet);
        this.sendCompanions();
        this.sendPetCollars();
        this.sysMsg('叫出了寵物「' + p.name + '」。');
    },
    petStash(quiet) {   // 收回項圈
        const c = this.pet;
        if (!c) return;
        this.pet = null;
        this.objs.delete(c.id);
        this.emit('remove', c.id);
        this.sendCompanions();
        if (!quiet) { this.sendPetCollars(); this.sysMsg('「' + c.name + '」回到項圈裡了。'); }
    },
    petRelease() {   // 放生：寵物消失、項圈也消失
        const c = this.pet;
        if (!c) return;
        this.petStash(true);
        this.consumeItem(c.collar, 1);
        this.sendPetCollars();
        this.sysMsg('放生了「' + c.name + '」。');
        this.save();
    },
    petFlute() {
        const ch = this.curChar;
        if (!ch) return;
        if (this.pet) { const c = this.pet; c.x = ch.x + 1; c.y = ch.y; this.showSummon(c); this.sysMsg('「' + c.name + '」回到你身邊了。'); return; }
        const col = (ch.inv || []).find(it => it.itemId === PET_COLLAR && it.pet);
        if (!col) { this.sysMsg('你沒有寵物。可以到寵物商人那裡購買。'); return; }
        this.petSummon(col);
    },
    petGainExp(c, mob) {
        const ch = this.curChar, col = ch && (ch.inv || []).find(it => it.id === c.collar);
        if (!col || !col.pet) return;
        // 經驗倍率照 rates.json（同主人，經驗 10 倍；GM 面板改了也跟著）（使用者 2026-11-12「要，套 10 倍」）
        c.exp = (c.exp || 0) + Math.floor(Math.max(5, (mob.level || 1) * 5) * Math.max(1, (this.gmRates && this.gmRates.exp) || 1));
        let up = false;
        while (c.level < Math.max(5, ch.level) && c.exp >= this.petNeed(c.level)) { c.exp -= this.petNeed(c.level); c.level++; up = true; }
        if (c.level >= ch.level) c.exp = Math.min(c.exp, this.petNeed(c.level) - 1);
        col.pet.lv = c.level; col.pet.exp = c.exp;
        if (up) {
            c.maxHp = this.petMaxHp(c.level); c.hp = c.maxHp;
            col.name = this.formatItemName(col);
            this.emit('invUpdate', { id: col.id, count: col.count, name: col.name });
            this.sysMsg('「' + c.name + '」升到 Lv.' + c.level + '！');
            this.sendPetCollars();
            this.save();
        }
        this.sendCompanions();
    },
    // 設定 → 召喚 的寵物卡：背包裡有寵物的項圈（state 0 收著、1 在身邊）
    sendPetCollars() {
        const ch = this.curChar;
        if (!ch) return;
        const list = (ch.inv || []).filter(it => it.itemId === PET_COLLAR && it.pet).map(it => {
            const out = this.pet && this.pet.collar === it.id, mhp = this.petMaxHp(it.pet.lv);
            return { collar: it.id, name: it.pet.name, tname: it.pet.name, gfx: it.pet.gfx, lv: it.pet.lv, hp: out ? this.pet.hp : mhp, mhp, state: out ? 1 : 0 };
        });
        list.ext = false;
        this.emit('petCollars', list);
    },
    // 夥伴視窗「寄放」／收回：寵物回項圈、召喚物消失
    compDismiss(id) {
        if (this.pet && this.pet.id === id) this.petStash();
        else if (this.summon && this.summon.id === id) this.dismissSummon();
    },
    compList() { this.sendCompanions(); },

    // ── 寵物裝備：0 武器（各種牙）、1 防具（寵物盔甲）；裝在項圈裡那隻身上，跟著項圈走 ──
    petCol(id) {
        const c = this.pet, ch = this.curChar;
        return c && c.id === id && ch ? (ch.inv || []).find(it => it.id === c.collar && it.pet) : null;
    },
    petGearOk(it, slot) {
        const e = this.data.itemsById.get(it.itemId), p = e && e.tpl.type === 'petitem' && e.tpl.pet;
        return !!p && !it.equipped && (slot === 0 ? !!p.wpn : !p.wpn);
    },
    compGear(id, slot) {
        const col = this.petCol(id);
        if (!col) { this.sysMsg('只有寵物可以穿裝備。'); return; }
        const cur = (slot === 0 ? col.pet.wpn : col.pet.arm) || null;
        const items = (this.curChar.inv || []).filter(it => this.petGearOk(it, slot)).map(it => ({ id: it.id, name: it.name, gfx: it.gfx }));
        this.emit('compGear', { id, slot, cur: cur ? cur.name : '', items });
    },
    compEquip(id, itemObjId) {
        const col = this.petCol(id), ch = this.curChar;
        const it = col && (ch.inv || []).find(x => x.id === itemObjId);
        if (!it) return;
        const slot = this.petGearOk(it, 0) ? 0 : this.petGearOk(it, 1) ? 1 : -1;
        if (slot < 0) { this.sysMsg('這個不是寵物裝備。'); return; }
        this.compUnequip(id, slot, true);
        const e = this.data.itemsById.get(it.itemId);
        col.pet[slot === 0 ? 'wpn' : 'arm'] = { itemId: it.itemId, name: e ? e.nid : it.name, bless: it.bless, ench: it.ench };
        this.consumeItem(it.id, 1);
        this.petApplyGear();
        this.sysMsg('「' + col.pet.name + '」穿上了 ' + (e ? e.name : '裝備') + '。');
        this.sendCompanions();
        this.save();
    },
    compUnequip(id, slot, quiet) {
        const col = this.petCol(id);
        if (!col) return;
        const k = slot === 0 ? 'wpn' : 'arm', g = col.pet[k];
        if (!g) return;
        col.pet[k] = null;
        this.giveItem(g.itemId, 1, g.ench || 0, g.bless);
        this.petApplyGear();
        if (!quiet) { this.sysMsg('「' + col.pet.name + '」脫下了裝備。'); this.sendCompanions(); this.save(); }
    },
    // 牙：命中、傷害加成（寵物打怪用）；盔甲：防禦（離線版怪不打寵物，只顯示）
    petApplyGear() {
        const c = this.pet, col = c && this.petCol(c.id);
        if (!col) return;
        const w = col.pet.wpn && this.data.itemsById.get(col.pet.wpn.itemId);
        const p = (w && w.tpl.pet) || {};
        c.dmgBonus = (p.dmg || 0) + Math.max(0, p.hit || 0);
    },
    // 夥伴的喝水／加速設定：離線版寵物不會受傷，設定照存、照顯示
    compSettings(id, st) {
        const col = this.petCol(id);
        if (col) col.pet.set = Object.assign({}, st);
        else if (this.summon && this.summon.id === id) this.summon.set = Object.assign({}, st);
        this.sendCompanions();
        this.save();
    },
    petSettings(collar, st) {
        const col = (this.curChar.inv || []).find(it => it.id === collar && it.pet);
        if (!col) return;
        col.pet.set = Object.assign({}, st);
        this.sendPetCollars();
        this.save();
    },

    // ── 新手引導（tutorial.js；S_Web 27 新格式）：條件到了就直接給獎勵、換下一步（同連線版，不用按領取）──
    tutWeapon() { return (this.curChar.inv || []).find(it => it.equipped && (this.data.itemsById.get(it.itemId) || { tpl: {} }).tpl.k === 'w') || null; },
    tutCond(st) {
        const ch = this.curChar, t = ch.tut, s = ch.autoSettings || {}, w = this.tutWeapon();
        switch (st.k) {
            case 1: return !!w;
            case 2: return (ch.inv || []).some(it => it.equipped && (this.data.itemsById.get(it.itemId) || { tpl: {} }).tpl.k === 'a');
            case 5: return !!s.potion && (ch.inv || []).some(it => it.itemId === s.potion);
            case 8: return !!(s.flags & 1);
            case 22: return !!(s.flags & 128) && !!s.poly;
            case 3: return !!t.tele;
            case 4: return (t.autoSec || 0) >= st.goal;
            case 9: return !!(s.flags & 16384);
            case 10: case 15: case 18: return ch.level >= st.goal;
            case 11: return !!t.drops;
            case 12: return !!(ch.dolls && ch.dolls.worn);
            case 14: return !!t.signed;
            case 16: return !!w && w.ench >= st.plus;
            case 17: return !!t.hotkey;
            case 20: return ch.level >= st.goal && !!t.made && !!w && w.ench >= st.plus;
        }
        return false;
    },
    tutGifts(list) {
        return (list || []).map(([id, n, en]) => {
            const e = this.data.itemsById.get(id || TUT_DOLL_BAG);
            return { id, gfx: e ? e.tpl.ig || 0 : 0, n, name: id ? (en ? '+' + en + ' ' : '') + (e ? e.name : '道具') : '魔法娃娃的袋子' };
        });
    },
    tutSend(result, claimed, ended) {
        const ch = this.curChar, t = ch && ch.tut;
        if (!t) return;
        const flags = 8 | (ch.level < 10 ? 1 : 0) | (ended ? 2 : 0);
        if (t.done) {
            this.emit('tutorial', { step: 0, reached: false, flags, result: result || 0, claimed: claimed || 0, cur: 0, goal: 0, gifts: [], total: 20, ench: { cur: 0, goal: 0, plus: 0, made: false } });
            return;
        }
        const st = TUT[t.i], w = this.tutWeapon();
        const lvGoal = st.k === 10 || st.k === 15 || st.k === 18 || st.k === 20;
        const cur = st.k === 4 ? Math.min(st.goal, Math.floor(t.autoSec || 0)) : lvGoal ? Math.min(st.goal, ch.level) : 0;
        const ench = st.plus ? { cur: w ? Math.min(w.ench, st.plus) : 0, goal: st.plus, plus: st.plus, made: !!t.made } : { cur: 0, goal: 0, plus: 0, made: false };
        this.emit('tutorial', { step: st.s, reached: false, flags, result: result || 0, claimed: claimed || 0, cur, goal: st.goal || 0,
            gifts: this.tutGifts(st.g), total: 20, kind: st.k, ench, shown: { step: t.i + 1, total: TUT.length } });
    },
    tutEnter(i) {   // 進到第 i 步：先給這步要用的東西（強化武器的卷軸）
        const t = this.curChar.tut, st = TUT[i];
        t.i = i; t.autoSec = 0;
        for (const [id, n] of st.start || []) this.giveItem(id, n);
    },
    tutCheck() {
        const ch = this.curChar, t = ch && ch.tut;
        if (!t || t.done) return;
        const st = TUT[t.i];
        if (!st || !this.tutCond(st)) return;
        for (const [id, n, en] of st.g) {
            if (id === 0) { ch.dolls = ch.dolls || { own: {}, seen: [] }; ch.dolls.bag = (ch.dolls.bag || 0) + n; this.sendDolls(); }
            else this.giveItem(id, n, en || 0);
        }
        if (t.i + 1 >= TUT.length) { t.done = true; this.tutSend(1, st.s, true); this.sysMsg('🎉 新手引導全部完成了！'); }
        else { this.tutEnter(t.i + 1); this.tutSend(1, st.s); }
        this.save();
    },
    tutNote(what) {   // 傳送、簽到、做好卷軸：記下來，輪到那一步就算數
        const t = this.curChar && this.curChar.tut;
        if (!t || t.done) return;
        if (what === 'tele') t.tele = true;
        else if (what === 'signin') t.signed = true;
        else if (what === 'made' && this.curChar.level >= 20) t.made = true;
        this.tutCheck();
    },
    // C_Web 26：1 領取、2 看完掉寶說明、3 要目前狀態、4 快捷格放了治癒藥水、5 打開掛機紀錄
    tutorial(action, step) {
        const t = this.curChar && this.curChar.tut;
        if (!t) return;
        if (action === 2) t.drops = true;
        else if (action === 4) t.hotkey = true;
        if (action === 3) this.tutSend();
        else this.tutCheck();
    },
    // ── 等級試煉獎勵（trial.js；S_Web 32）：升到 15／30／45／50 級跳儀式，「收下」寄到信箱 ──
    trialList() {
        const ch = this.curChar, tab = TRIAL[ch.type] || {}, got = ch.trials || {};
        return TRIAL_LV.filter(lv => ch.level >= lv && !got[lv] && tab[lv]).map(lv => ({
            lv, pick: !!tab[lv].pick,
            items: tab[lv].items.map(id => { const e = this.data.itemsById.get(id); return { id, gfx: e ? e.tpl.ig || 0 : 0, name: e ? e.name : '道具#' + id }; }),
        }));
    },
    trialPush(popup) {
        const list = this.trialList();
        if (list.length) this.emit('trial', { result: 0, lv: 0, popup: !!popup, list });
    },
    trialClaim(lv, pick) {
        const ch = this.curChar;
        if (!ch) return;
        const t = (TRIAL[ch.type] || {})[lv];
        if (!t || ch.level < lv || (ch.trials && ch.trials[lv])) { this.emit('trial', { result: 4, lv, popup: false, list: this.trialList() }); return; }
        const ids = t.pick ? [t.items[Math.max(0, Math.min(t.items.length - 1, pick | 0))]] : t.items;
        ch.trials = Object.assign({}, ch.trials, { [lv]: true });
        this.mailAdd(lv + ' 級試煉獎勵', '恭喜達成 ' + lv + ' 級試煉！這是你的試煉獎勵，請收下。', ids.map(id => [id, 1]));
        this.save();
        this.emit('trial', { result: 1, lv, popup: false, list: this.trialList() });
    },
    // 這次連線第一次：有已經到了還沒領的就留「🎁 試煉獎勵」；之後升級跨過試煉等級就跳儀式
    trialTick() {
        const ch = this.curChar;
        if (this._trialFor !== ch) { this._trialFor = ch; this._trialLv = ch.level; this.trialPush(false); return; }
        if (ch.level !== this._trialLv) {
            const old = this._trialLv; this._trialLv = ch.level;
            if (TRIAL_LV.some(lv => old < lv && ch.level >= lv)) this.trialPush(true);
        }
    },

    // 每次 tick：還沒有引導資料的角色（20 級以下才帶）建一份、這次連線第一次送狀態；AUTO 那步數秒數
    tutTick(now) {
        const ch = this.curChar;
        if (!ch) return;
        if (!ch.tut) { ch.tut = ch.level < 20 ? { i: 0 } : { done: true }; this.save(); }
        const t = ch.tut;
        if (this._tutFor !== ch) { this._tutFor = ch; this._tutAt = now; this._tutCheckAt = 0; if (!t.done) this.tutSend(); return; }
        if (t.done) return;
        const st = TUT[t.i];
        if (st.k === 4 && this.autoOn) {
            const before = Math.floor(t.autoSec || 0);
            t.autoSec = (t.autoSec || 0) + Math.min(1, (now - (this._tutAt || now)) / 1000);
            if (Math.floor(t.autoSec) !== before) this.tutSend();
        }
        this._tutAt = now;
        if (now - (this._tutCheckAt || 0) >= 1000) { this._tutCheckAt = now; this.tutCheck(); }
    },

    tickSummon(now) {
        this.tickFollower(this.summon, now);
        this.tickFollower(this.pet, now);
    },
    tickFollower(c, now) {
        const ch = this.curChar;
        if (!c) return;
        if (now >= c.until) { this.dismissSummon(); this.sysMsg('召喚物的時間到了。'); return; }
        if (!this.objs.has(c.id) || cheb(c, ch) > 12) { c.x = ch.x + 1; c.y = ch.y; this.showSummon(c); }   // 換地圖、離太遠：回到主人身邊
        const step = (tx, ty) => {
            if (now - c.lastMoveAt < 300) return;
            c.lastMoveAt = now;
            const dir = this.freeDir(c.x, c.y, this.dirBetween(c.x, c.y, tx, ty)), ox = c.x, oy = c.y;
            if (dir < 0) return;
            c.x += DX[dir]; c.y += DY[dir]; c.heading = dir;
            this.emit('move', { id: c.id, x: ox, y: oy, heading: dir });
        };
        const tgt = this.mapMobs.find(m => !m.dead && m.id === this.autoTargetId) || this.mapMobs.find(m => !m.dead && m.aggro && cheb(m, ch) <= 2);
        if (!tgt) { if (cheb(c, ch) > 2) step(ch.x, ch.y); return; }
        if (cheb(c, tgt) > 1) { step(tgt.x, tgt.y); return; }
        if (now - c.lastAtkAt < 1200) return;
        c.lastAtkAt = now;
        const dmg = this.gmRates.oneHit ? tgt.hp : Math.max(1, Math.floor(c.level / 2) + rnd(Math.max(1, Math.floor(c.level / 2))) + (c.dmgBonus || 0) - (tgt.dr || 0));
        const dir = this.dirBetween(c.x, c.y, tgt.x, tgt.y);
        tgt.hp = Math.max(0, tgt.hp - dmg);
        tgt.aggro = true;
        if (c.isPet) { tgt.petHit = true; tgt.petHit_collar = c.collar; }   // 怪死的時候寵物分經驗（onMobKilled）
        this.emit('attack', { act: 1, atk: c.id, tgt: tgt.id, dmg, heading: dir, gfx: 0, use: 0, x: c.x, y: c.y, tx: tgt.x, ty: tgt.y });
        this.emit('hpMeter', { id: tgt.id, ratio: Math.round(tgt.hp * 100 / tgt.maxHp) });
        if (tgt.hp <= 0) this.onMobKilled(tgt);
    },

    // ── 怪物 AI（近戰、弓箭怪、法師怪）──
    tickMobs(now) {
        const ch = this.curChar;
        for (const mob of this.mapMobs) {
            if (mob.dead) continue;
            const dist = cheb(mob, ch);
            // 不自動回血：被打到（血變少）或玩家在附近交戰＝還有目標；沒有目標滿 5 分鐘才一次補滿
            if (mob.hp < (mob._lastHp != null ? mob._lastHp : mob.hp) || (mob.aggro && dist <= MOB_ENGAGE_R)) mob.engagedAt = now;
            mob._lastHp = mob.hp;
            if (mob.hp < mob.maxHp && now - (mob.engagedAt || now) >= MOB_RESET_MS) {
                mob.hp = mob._lastHp = mob.maxHp;
                this.emit('hpMeter', { id: mob.id, ratio: 100 });
            }
            const ranged = mob.isBoss || /弓|箭|哈維|妖精|法師|思克巴|長者|巫妖/.test(mob.name);
            if (mob.aggro && (dist <= 1 || (ranged && dist <= 6))) {
                if (now - mob.lastAtkAt < 1300) continue;
                mob.lastAtkAt = now;
                const dir = this.dirBetween(mob.x, mob.y, ch.x, ch.y);
                mob.heading = dir;
                let dmg = this.gmRates.godMode ? 0 : Math.max(1, Math.floor((mob.level || 1) * 0.9) - Math.max(0, Math.floor((10 - ch.ac) * 0.25)));
                if (mob.isBoss && dmg) dmg = Math.max(15, dmg * 2);
                if (dmg) dmg = Math.max(1, dmg - (ch.dr | 0));   // 傷害減免（強化過安定值的防具、增幅防禦）
                // 增益魔法：絕對屏障＝不受傷；迴避提升／暗影閃避／水之防護＝機率打不中；聖結界＝傷害減半
                if (dmg && (this.hasEffect(78) || Math.random() * 100 < ((ch.buff && ch.buff.er) || 0))) dmg = 0;
                if (dmg && this.hasEffect(68)) dmg = Math.max(1, Math.floor(dmg / 2));
                ch.hp = Math.max(1, ch.hp - dmg);
                const magic = ranged && /法師|長者|思克巴|巫妖/.test(mob.name), gfx = dist <= 1 ? 0 : magic ? 129 : ranged ? 66 : 0;
                this.emit('attack', { act: 1, atk: mob.id, tgt: ch.id, dmg, heading: dir, gfx, use: gfx ? 6 : 0, x: mob.x, y: mob.y, tx: ch.x, ty: ch.y });
                this.sendOwnStatus();
            } else if (now - mob.lastMoveAt >= 1400) {
                mob.lastMoveAt = now + Math.random() * 600;
                const dir = this.freeDir(mob.x, mob.y, mob.aggro && dist <= 8 ? this.dirBetween(mob.x, mob.y, ch.x, ch.y) : rnd(8));
                if (dir < 0) continue;   // 四周都是牆：這次不動
                const ox = mob.x, oy = mob.y;
                mob.x += DX[dir]; mob.y += DY[dir]; mob.heading = dir;
                this.emit('move', { id: mob.id, x: ox, y: oy, heading: dir });
            }
        }
    },

    // 主循環每 250 毫秒跑一次。分頁切到背景時瀏覽器會把頁面上的計時器放慢到 1 秒一次（5 分鐘後更慢），
    //   掛機幾乎停擺 → 改由 Worker 裡的計時器來敲（Worker 不會被放慢）；開不了 Worker 才退回原本的 setInterval
    startLoops() {
        const run = () => { try { this.tick(); } catch (e) { console.error('[OfflineServer] tick', e); } };
        let fallback = 0;
        const useInterval = () => { if (!fallback) fallback = setInterval(run, 250); };
        try {
            const w = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},250)'], { type: 'text/javascript' })));
            w.onmessage = run;
            w.onerror = () => { try { w.terminate(); } catch (e) { } useInterval(); };
        } catch (e) { useInterval(); }
    },

    tick() {
        const ch = this.curChar;
        if (!ch) return;
        const now = Date.now();
        this.initAuto();
        // 每 3 秒：自然回復、補怪、掛機時間
        if (now - (this._lastRegen || 0) >= 3000) {
            this._lastRegen = now;
            if (ch.hp < ch.maxHp || ch.mp < ch.maxMp) {
                const bf = ch.buff || {};   // 增益魔法：生命之泉、冥想術、藍色藥水…（狂暴術不會自然回血）
                if (!this.hasEffect(55)) ch.hp = Math.min(ch.maxHp, ch.hp + Math.max(5, Math.floor(ch.maxHp * 0.04)) + this.huntBonus().regen + (bf.hpr || 0));   // 狩獵圖鑑 說話之島：回血
                ch.mp = Math.min(ch.maxMp, ch.mp + Math.max(3, Math.floor(ch.maxMp * 0.05)) + (bf.mpr || 0));
                this.sendOwnStatus();
            }
            this.maintainMonsters();
            if (this.autoOn && this.autoLog) { this.autoLog.sec += 3; this.autoLog.dur = this.autoLog.sec; }
        }
        if (now - (this._buffAt || 0) >= 1000) { this._buffAt = now; this.tickBuffs(); }   // 增益魔法到期：能力收回
        this.tickCare(now);
        if (now - (this._sellAt || 0) >= 3000) { this._sellAt = now; this.tickSell(); }
        this.tickMobs(now);
        this.tickSummon(now);
        this.tutTick(now);
        this.trialTick();
        if (this.autoOn) this.tickAuto(now);
    },

    // ── 牆、柱子、水（地圖的通行資料在畫面那邊：world.js flags／canStep，main.js 掛在 window.__world）──
    //   原本 AUTO、怪、召喚物走路都直接朝目標加座標，不看牆 → 穿牆、走進水裡。手動點地面走本來就會繞（world.findPath）
    //   拿不到資料（地圖還沒載好、這張圖沒有畫面資料、自己腳下那區還沒載）＝照原本直走，不卡住
    walkWorld(x, y) {
        const w = typeof window !== 'undefined' && window.__world, ch = this.curChar;
        if (!w || !w.map || !w.map.d || !ch || w.map.id !== ch.mapId) return null;
        const d = w.map.d;
        return w.pass(x - d.gameX0, y - d.gameY0) ? w : null;
    },
    // 從 (x,y) 往 (tx,ty) 繞路走的下一步方向（八方向 A*，同手動點地面）；-1＝已經在走得到的最近處（過不去）
    pathDir(x, y, tx, ty) {
        const w = this.walkWorld(x, y);
        if (!w) return this.dirBetween(x, y, tx, ty);
        const r = w.astar(x, y, tx, ty, null, 24, true);
        return r && r.path && r.path.length ? r.path[0] : -1;
    },
    // 怪、召喚物走一步：朝 dir 走不過去就試左右各偏一格、兩格；都不行＝-1（這次不動）
    freeDir(x, y, dir) {
        const w = this.walkWorld(x, y);
        if (!w) return dir;
        for (const k of [0, 1, 7, 2, 6]) { const h = (dir + k) & 7; if (w.canStep(x, y, h, null, true)) return h; }
        return -1;
    },

    // 回 false＝走不到那裡（被牆、水隔開）
    autoStep(tx, ty, now) {
        const ch = this.curChar;
        if (now - (this.lastStepAt || 0) < (this.hasHaste() ? 260 : 360)) return true;
        const dir = this.pathDir(ch.x, ch.y, tx, ty);
        if (dir < 0) return false;
        this.lastStepAt = now;
        const ox = ch.x, oy = ch.y;
        ch.x += DX[dir]; ch.y += DY[dir]; ch.heading = dir;
        this.emit('move', { id: ch.id, x: ox, y: oy, heading: dir });
        return true;
    },

    // ── AUTO：狩獵（巡邏範圍、沒怪瞬移、回村、撐不住瞬移）、名單（不打／瞬移）、魔法（開怪／範圍／攻擊／休息回魔）──
    tickAuto(now) {
        const ch = this.curChar, s = ch.autoSettings || {}, f = s.flags | 0;
        const hpPct = ch.hp * 100 / ch.maxHp, mpPct = ch.mp * 100 / ch.maxMp;
        // 體力低於 N% 回村（開關＝homeHpPct > 0）
        if (s.homeHpPct > 0 && hpPct < s.homeHpPct && this.autoGoHome('體力過低，自動回村並停止掛機')) return;
        // 撐不住先瞬移，一分鐘內第 3 次就回村（大陸不瞬移）
        if ((f & 2097152) && hpPct < 25 && ch.mapId !== 4 && now - (this._escAt || 0) >= 3000) {
            this._escAt = now;
            this._escapes = (this._escapes || []).filter(t => now - t < 60000);
            if (this._escapes.length >= 2) { if (this.autoGoHome('一分鐘內逃了 3 次，自動回村並停止掛機')) return; }
            else if (this.autoEscapeTele()) { this._escapes.push(now); this.sysMsg('⚡ 快撐不住了，先瞬間移動離開。'); return; }
        }
        // 名單「瞬移」：看到就用瞬間移動卷軸離開
        const tpList = (s.boss && s.boss[ch.mapId]) || [];
        if (tpList.length && now - (this._escAt || 0) >= 3000) {
            const bad = this.mapMobs.find(m => !m.dead && tpList.includes(m.tplId) && cheb(m, ch) <= 13);
            if (bad) {
                this._escAt = now;
                if (this.autoEscapeTele()) { this.sysMsg('⚡ 看到名單上的【' + bad.name + '】，瞬間移動離開。'); return; }
            }
        }
        // 魔力不夠先休息回魔（法師、妖精）：低於 restMpPct 停手，回到 restMpUp 再打；被打照樣還手
        if ((f & 65536) && (ch.type === 3 || ch.type === 2)) {
            if (!this._resting && mpPct < (s.restMpPct || 30)) this._resting = true;
            else if (this._resting && mpPct >= (s.restMpUp || 60)) this._resting = false;
        } else this._resting = false;

        const R = s.roamRange | 0, center = this.autoCenter;
        const inRoam = m => !R || !center || cheb(m, center) <= R;
        const hitsMe = m => m.aggro && cheb(m, ch) <= 2;
        // 名單「不打」：不主動打，牠打我照樣還手
        const igList = (s.ignore && s.ignore[ch.mapId]) || [];
        const ok = m => !m.dead && (hitsMe(m) || (!this._resting && inRoam(m) && !(m.noReachUntil > now) && !igList.includes(m.tplId) && !tpList.includes(m.tplId)));

        let target = this.mapMobs.find(m => m.id === this.autoTargetId && ok(m));
        if (!target) {
            let bd = Infinity;
            for (const m of this.mapMobs) {
                if (!ok(m)) continue;
                const d = cheb(m, ch) - (hitsMe(m) ? 100 : 0);
                if (d < bd) { bd = d; target = m; }
            }
            this.autoTargetId = target ? target.id : 0;
        }
        if (!target) {
            if (this._resting) { this.autoStatusText('魔力不足，休息回魔中'); return; }
            this.autoStatusText('尋找怪物中');
            if (!this._noMobAt) this._noMobAt = now;
            // 沒怪 N 秒自動瞬移（大陸不瞬移）
            if ((f & 16384) && ch.mapId !== 4 && now - this._noMobAt >= Math.max(3, s.teleSec || 10) * 1000) {
                this._noMobAt = now;
                if (this.autoEscapeTele()) this.sysMsg('🧭 周圍沒有怪物，瞬間移動找怪。');
                return;
            }
            // 走回巡邏中心；在中心也沒怪就往最近的出生點走（不超出巡邏範圍）
            if (R && center && cheb(ch, center) > R) { this.autoStep(center.x, center.y, now); return; }
            const idx = this._pts[String(ch.mapId)];
            if (idx) {
                let best = -1, bd = Infinity;
                for (const i of this.nearSpawnPts(String(ch.mapId), ch.x, ch.y, 90)) {
                    const p = { x: idx.a[i + 1], y: idx.a[i + 2] };
                    if (this._bossIds.has(idx.a[i]) || igList.includes(idx.a[i]) || tpList.includes(idx.a[i]) || !inRoam(p)) continue;
                    if (this._noReachPts && this._noReachPts.has(ch.mapId + ':' + i)) continue;   // 走不到的出生點（隔著牆、水）
                    const d = cheb(p, ch);
                    if (d < bd) { bd = d; best = i; }
                }
                if (best >= 0 && bd > 3 && !this.autoStep(idx.a[best + 1], idx.a[best + 2], now)) {
                    if (!this._noReachPts || this._noReachPts.size > 500) this._noReachPts = new Set();
                    this._noReachPts.add(ch.mapId + ':' + best);
                }
            }
            return;
        }
        this._noMobAt = 0;
        if (!this.autoCenter) this.autoCenter = { x: ch.x, y: ch.y };
        this.autoStatusText(this._resting ? '魔力不足，休息回魔中' : '自動尋怪狩獵中');

        const isBow = ch.weaponVisual === 20 || ch.weaponVisual === 62;
        const dist = cheb(target, ch), castOk = !this._resting && now - (this._castAt || 0) >= 1000;
        if (castOk) {
            // 開怪技能：每隻怪第一下
            if (s.openSkill > 0 && !target.opened && dist <= 8 && mpPct >= (s.openMpPct | 0) && this.canCast(s.openSkill)) {
                target.opened = true;
                this.useSkill(s.openSkill, { id: target.id, x: target.x, y: target.y });
                return;
            }
            // 範圍技能：周圍 3 格有 N 隻以上
            if (s.aoeSkill > 0 && mpPct >= (s.aoeMpPct | 0) && this.canCast(s.aoeSkill)
                && this.mapMobs.filter(m => !m.dead && cheb(m, ch) <= 3).length >= Math.max(2, s.aoeCount | 0 || 3)) {
                this.useSkill(s.aoeSkill, { id: target.id, x: target.x, y: target.y });
                return;
            }
            // 攻擊技能
            if (s.atkSkill > 0 && dist <= 6 && mpPct >= (s.atkMpPct | 0) && this.canCast(s.atkSkill)) {
                target.opened = true;
                this.useSkill(s.atkSkill, { id: target.id, x: target.x, y: target.y });
                return;
            }
        }
        if (dist <= (isBow ? 8 : 1)) {
            if (now - (this.lastAttackAt || 0) >= (this.hasHaste() ? 480 : 640)) {
                this.lastAttackAt = now;
                target.opened = true;
                this.attack(target.id, target.x, target.y);
            }
        } else if (!this.autoStep(target.x, target.y, now)) {
            // 被牆、水隔開走不到：這隻先放 20 秒，換別隻（牠自己走過來打我照樣還手）
            target.noReachUntil = now + 20000;
            this.autoTargetId = 0;
        }
    },
};
