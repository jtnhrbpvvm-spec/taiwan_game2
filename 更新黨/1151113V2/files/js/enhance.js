// 強化視窗：版面照單機版 js/33-enhance-window.js（上：卷軸格＋要強化的裝備；中：成功機率｜強化等級、強化前後的能力；下：武器／防具／飾品分頁＋道具格）
//   規則、機率全部照 3.5 伺服器 model/item/action/Enchant.java（＋rates.properties 的 EnchantChanceWeapon／Armor，data/enchant.json）；
//   網頁只顯示、送 C_ItemUSe（卷軸＋對象裝備），成敗由伺服器決定，結果照伺服器回的訊息（161 成功、160 發光但沒事、164 消失、79 沒有任何事情發生）。
//   機率：伺服器 rnd＝nextInt(100)+1、成功＝rnd < chance → 實際 (chance−1)%；+9 以上 rnd < chance×2 的那段「發光但沒事」，其餘消失。全部整數除法。
//   寵物裝備（「寵物」分頁，伺服器 web/WebPetEnchant，照單機版）：牙用對武器施法的卷軸、寵物盔甲用對盔甲施法的卷軸（一般、祝福；詛咒、幻象、試煉、象牙塔不行），
//     安定值 0、最多 +5；成功率 +0 1/2、+N 1/(N×2)，失敗消失；祝福卷軸成功時 +0～+2 一次 +1／+2／+3 各 1/3、+3 以上 +1／+2 各 1/2（超過 +5 算 +5）
//   用法：const enh = createEnhance(root, cb)；enh.open({ item, scroll })、enh.refresh()（背包變了）、enh.serverMsg(id, 文字)
import { glowCls, PET_EN_MAX, isLocked } from './items.js';
import { sfx, preloadSfx } from './audio.js';
import { srect } from './stage.js';
const esc =s =>String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 飾品強化不開放（伺服器第 172 項，站長 2026-10-25）：沒有「飾品」分頁、飾品不列、飾品強化卷軸不認
const TABS = [['wpn', '武器'], ['arm', '防具'], ['pet', '寵物']];
const ACC_TYPE = new Set(['amulet', 'ring', 'earring', 'belt']);   // 防具表 type 8～12：飾品強化卷軸的對象
// 卷軸（道具編號 mod 100000，祝福版＝+100000，背包裡看 bless：0 祝福、1 一般）
//   fam：std 一般強化、illusion 幻象裝備專用、trial 試煉之劍專用、ivory 象牙塔裝備專用（過安定值照一般卷軸的機率）、acc 飾品
//   blessFx：祝福版會一次加好幾級（Enchant.RandomELevel 認的 140087、140074、140129、140130）
//   詛咒版（240087、240074，強化值 −1）站長 2026-10-19「詛咒都拿掉」：伺服器不再做出來、舊的換成一般版；萬一背包還有也不列（見 scrollsFor）
const SCROLLS = {
    40087: { tab: 'wpn', fam: 'std', blessFx: 1 }, 40077: { tab: 'wpn', fam: 'std' }, 40130: { tab: 'wpn', fam: 'std', blessFx: 1 },
    40128: { tab: 'wpn', fam: 'illusion' }, 40660: { tab: 'wpn', fam: 'trial' }, 49312: { tab: 'wpn', fam: 'ivory' },
    40074: { tab: 'arm', fam: 'std', blessFx: 1 }, 40078: { tab: 'arm', fam: 'std' }, 40129: { tab: 'arm', fam: 'std', blessFx: 1 },
    40127: { tab: 'arm', fam: 'illusion' }, 49311: { tab: 'arm', fam: 'ivory' },
    // 簽到送的祝福盔甲卷（伺服器第 311 項，不能交易；伺服器 WebSignIn.useAs 當 140074 用）：沒列在這裡＝點了不開強化視窗、用不了
    49932: { tab: 'arm', fam: 'std', blessFx: 1 },
    // 祝福賦予卷軸（伺服器第 172／355 項 WebBless.blessScroll）：站長 2026-11-07「跟武卷、防卷同樣的介面，沒過不用再找一次裝備」→ 同一個視窗的祝福賦予模式（st.mode = 'bless'）
    49908: { tab: 'any', fam: 'bless' },
};
const FAM_NEED = { ivory: '象牙塔裝備只能用象牙塔卷軸', illusion: '幻象裝備只能用幻象卷軸', trial: '試煉之劍只能用試煉卷軸' };
let RATE = { weapon: 0, armor: 0 };
fetch('/data/enchant.json').then(r => r.ok ? r.json() : null).then(d => { if (d) RATE = d; }).catch(() => {});

export const scrollInfo = p => p && p.tpl && p.tpl.k === 'e' ? SCROLLS[p.tpl.id % 100000] || null : null;
function tabOf(p) {
    const t = p && p.tpl; if (!t) return null;
    if (t.k === 'w') return 'wpn';
    if (t.k === 'a') return ACC_TYPE.has(t.type) ? null : 'arm';   // 飾品不能強化（第 172 項）
    if (t.k === 'e' && t.pet) return 'pet';
    return null;
}
// 祝福賦予：武器、防具、飾品都能用（伺服器看 type2 1／2）；寵物裝備、箭不列。機率同伺服器 BLESS_SCROLL_RATE_WEAPON／BLESS_SCROLL_RATE，失敗只消耗卷軸
const BLESS_TABS = [['wpn', '武器'], ['arm', '防具'], ['acc', '飾品']];
const BLESS_RATE = { wpn: 0.05, arm: 0.1, acc: 0.1 };
function blessTab(p) {
    const t = p && p.tpl; if (!t) return null;
    if (t.k === 'w') return t.type === 'arrow' ? null : 'wpn';
    if (t.k === 'a') return ACC_TYPE.has(t.type) ? 'acc' : 'arm';
    return null;
}
const petScrollTab = p => p.tpl.pet.wpn ? 'wpn' : 'arm';   // 牙用對武器施法的卷軸、寵物盔甲用對盔甲施法的卷軸
const pct = x => { const v = Math.round(x * 1000) / 10; return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + '%'; };
const sgn = v => (v > 0 ? '+' : '') + v;
const enTxt = v => (v >= 0 ? '+' : '') + v;   // 強化值：+0 也帶正號（同單機版）
const tdiv = (a, b) => Math.trunc(a / b);   // Java 整數除法

// ── 強化音效、特效（照單機版 js/17-audio.js ENH_SFX、js/33-enhance-window.js playEnhance／outcomeFx）──
//   音效借原版法術音：成功＝擬似魔法武器 113（武器）／鎧甲護持 137（防具、飾品）、裝備消失＝壞物術 100、強化值降低＝詛咒 116、沒有變化＝魔法相消術 140；蓄力＝通用施法音 magic
//   流程：按下去就送出、同時蓄力（兩格發光、＋旋轉，至少 CHARGE_MS）→ 伺服器結果到了（且蓄力播完）才播結果特效＋音效：
//   成功（金光爆發＋強化成功 +N）／消失（銀光後碎裂＋畫面震動）／降低（紫光、圖示晃）／沒有變化（灰光、圖示晃冒煙）。
//   結果照伺服器：164 裝備消失、161 成功（那件的強化值變小＝詛咒卷軸降低）、160 發光但沒事、79 沒有任何事情發生。系統開「減少動態效果」＝不播動畫，音效照播
const ENH_SFX = { ok_wpn: 113, ok_arm: 137, boom: 100, down: 116, none: 140 };
const CHARGE_MS = 650, OUT_MS = 1250;
// 站長 2026-11-07「衝 +7 以上才有衝裝的視窗」：這一張成功後會到 FX_MIN 以上才蓄力、播結果特效；以下直接出結果（音效照放）。
//   祝福賦予、新手導覽的強化步驟（cb.tutorial）照舊都播
const FX_MIN = 7;
// 伺服器第 697 項 WebBatchEnchant：一次最多幾件、做完那行的開頭
const BATCH_MAX = 200, BATCH_DONE = '一起強化完成：';
const LOCK_MSG = '這件鎖起來了，先在道具視窗解鎖。';   // 伺服器 WebItemLock.MSG（前面帶「道具名：」）
const reduceMotion = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
function playSfx(kind) { if (kind === 'charge') sfx('magic', 0.55, 90, 'enh'); else if (ENH_SFX[kind] != null) sfx(ENH_SFX[kind], 0.70, 0, 'enh_' + kind); }

// 伺服器第 685 項：過安定值的成功率（萬分比），同 Enchant.weaponChanceBp／armorChanceBp
//   武器（照強化等級）+6 以下 32%、+7→8 25%、+8→9 17%、+9→10 6%、+10→11 2%、+11 以上 0.7%（安定值 0 的 0.3%）
//   防具安定值 0：+0→1 起 42%、29%、21%、16%、11%、7%、4%、2%、1%、0.7%、0.4%、0.2%；安定值 6：+6→7 起 27%、20%、11%、2%、0.7%、0.3%；其他（安定值 4）：+4→5 起 24%、18%、13%、7%、4%、2%、1%、0.6%
const wpnBp = (en, safe) => en <= 6 ? 3200 : en === 7 ? 2500 : en === 8 ? 1700 : en === 9 ? 600 : en === 10 ? 200 : safe === 0 ? 30 : 70;
const A_T0 = [4200, 2900, 2100, 1600, 1100, 700, 400, 200, 100, 70, 40, 20], A_T6 = [2700, 2000, 1100, 200, 70, 30], A_T4 = [2400, 1800, 1300, 700, 400, 200, 100, 60];
const armBp = (en, safe) => { const T = safe === 0 ? A_T0 : safe >= 6 ? A_T6 : A_T4, i = safe === 0 ? en : safe >= 6 ? en - 6 : en - 4; return T[Math.max(0, Math.min(i, T.length - 1))]; };
// 離線伺服器（offline-server.js 象牙塔卷軸過安定值）用同一張表：isWpn 武器／防具、目前強化值、安定值 → 萬分比
export const overSafeBp = (isWpn, en, safe) => isWpn ? wpnBp(en, safe) : armBp(en, safe);

// 這張卷軸用在這件上：{ ok, none, gone, lv（成功時加幾級的分布 [[級數, 機率]]）, down, block（不能用的原因） }
function odds(p, sp) {
    const t = p.tpl, en = p.en, si = scrollInfo(sp), tab = tabOf(p);
    if ((p.it.bless || 0) >= 128) return { block: '封印中，不能強化' };
    if (tab === 'pet') {
        if (en >= PET_EN_MAX) return { block: '已達強化上限 +' + PET_EN_MAX };
        const ok = en <= 0 ? 0.5 : 1 / (en * 2);
        const lv = (sp.it.bless === 0 && si.blessFx ? (en <= 2 ? [[1, 1 / 3], [2, 1 / 3], [3, 1 / 3]] : [[1, .5], [2, .5]]) : [[1, 1]])
            .map(([g, q]) => [Math.min(g, PET_EN_MAX - en), q]);
        return { ok, none: 0, gone: 1 - ok, lv };
    }
    if (si.fam === 'acc') {
        if (t.grade == null || t.grade < 0) return { block: '這件不能強化' };
        if (en < 0 || en >= 10) return { block: en < 0 ? '強化值是負的，不能強化' : '已達強化上限 +10' };
        const c = tdiv(50 + en, en + 1) + 35;
        return { ok: Math.min(100, Math.max(0, c - 1)) / 100, none: 0, lv: [[1, 1]] };
    }
    if (t.safe < 0) return { block: '這件不能強化' };
    // 象牙塔卷軸：安定值內必成；過了安定值照下面一般卷軸的表（玩家 2026-11-13「象牙塔裝備只能衝到 +4，比照正確機率讓玩家衝」，原本到安定值就擋）
    if (si.fam === 'ivory' && en < t.safe) return { ok: 1, none: 0, lv: [[1, 1]] };
    const bless = sp.it.bless === 0 && si.blessFx;
    // 祝福（只在安定值以內）：+0～+2 一次 +1（32%）／+2（44%）／+3（24%），+3～+5 一次 +1（51%）／+2（49%）
    const lv = bless && en <= 2 ? [[1, .32], [2, .44], [3, .24]] : bless && en <= 5 ? [[1, .51], [2, .49]] : [[1, 1]];
    if (en < t.safe) return { ok: 1, none: 0, lv };
    // 伺服器第 685 項（站長 2026-11-06 對照天堂經典版定的表，Enchant.weaponChanceBp／armorChanceBp）：過安定值這一下的成功率照強化等級查表（萬分比），
    //   rnd＝nextInt(10000)；成功 rnd<c；祝福卷 c×1.3（四捨五入），沒成功的一半「不變」；+9 以上 rnd<2c 也是「不變」；其他消失
    let c = tab === 'wpn' ? wpnBp(en, t.safe) : armBp(en, t.safe);
    if (bless) c = Math.round(c * 1.3);
    c = Math.min(10000, c);
    const noneTo = Math.min(10000, Math.max(c, bless ? c + tdiv(10000 - c, 2) : c, en >= 9 ? 2 * c : c));
    const ok = c / 10000, none = (noneTo - c) / 10000;
    return { ok, none, gone: Math.max(0, 1 - ok - none), lv: [[1, 1]] };   // 第 643 項：過了安定值成功一律 +1（祝福卷只提高機率）
}

// 強化值 en 時會跟著變的能力（數值照 3.5 道具表＋伺服器：武器每 +1 傷害 +1、命中 +強化÷2；防具每 +1 防禦 +1，
//   抗魔法頭盔／鏈甲、林德拜爾 魔防 +1、抗魔法斗篷 魔防 +2；飾品照等級：上等 四屬性抗性 +1（+6 時體力、魔力恢復 +1）、
//   中等 體力上限 +2（+6 時魔防 +1）、初等 魔力上限 +1（+6 時魔攻 +1））
function statRows(p, en) {
    const t = p.tpl, rows = [], tab = tabOf(p);
    if (tab === 'wpn') {
        rows.push(['額外傷害', sgn(t.dmg + en)], ['命中', sgn(t.hit + tdiv(en, 2))]);
        if (t.mprEn) rows.push(['魔力恢復', sgn((t.mpr || 0) + t.mprEn * Math.max(0, en))]);   // 巴列斯、紅水晶魔杖每 +1 回魔 +2（伺服器本機改動第 66 項）
    }
    else if (tab === 'arm') { rows.push(['防禦', String(-t.ac + en)]); if (t.mrEn) rows.push(['魔防', sgn(t.mr + t.mrEn * en)]); }
    else if (tab === 'pet') {   // 牙每 +1 命中、額外傷害各 +1；盔甲每 +1 防禦 +1（L1PetInstance 穿上時算）
        const P = t.pet;
        if (P.wpn) rows.push(['寵物命中', sgn((P.hit || 0) + en)], ['寵物額外傷害', sgn((P.dmg || 0) + en)]);
        else rows.push(['寵物防禦', String(-(P.ac || 0) + en)]);
    }
    else if (tab === 'acc') {
        const six = en >= 6 ? 1 : 0;
        if (t.grade === 0) rows.push(['屬性抗性', sgn(Math.max(0, en))], ['體力恢復', sgn(t.hpr + six)], ['魔力恢復', sgn(t.mpr + six)]);
        else if (t.grade === 1) rows.push(['體力上限', sgn(t.hp + 2 * Math.max(0, en))], ['魔防', sgn(t.mr + six)]);
        else if (t.grade === 2) rows.push(['魔力上限', sgn(t.mp + Math.max(0, en))], ['魔攻', sgn(t.sp + six)]);
    }
    return rows;
}

export function createEnhance(cb) {
    // cb：items()（背包 parseItem 過的）、icon(名字)、use(卷軸, 對象)、onOpen(開著與否)
    let st = { id: 0, tab: 'wpn', pick: 0, scrollId: 0, result: null, busy: null, goal: 0 };
    let win = null;

    const items = () => cb.items();
    // 第 711 項（站長 2026-11-08 玩家建議「裝備鎖定之後就無法強化」）：鎖著的不能強化＝道具視窗不出「強化」鈕、強化清單不列（伺服器 C_ItemUSe 也擋）
    const enhanceable = p => { const tb = tabOf(p); return !!tb && !(p.tpl.k === 'w' && p.tpl.type === 'arrow') && !isLocked(p); };
    const bm = () => st.mode === 'bless';   // 祝福賦予模式
    // 同樣的裝備（同名、同強化值、同祝福、都沒穿著＝下面道具格併成一格的那組）：連續強化勾了「一起強化」就一件接一件衝（站長 2026-11-07）
    const twinKey = x => (x.it && x.it.name) + '|' + x.en + '|' + (x.it && x.it.bless);
    const sameGroup = p => p.equipped ? [] : items().filter(x => x.id !== p.id && !x.equipped && !isLocked(x) && tabOf(x) === tabOf(p) && twinKey(x) === twinKey(p));
    const ALL_KEY = 'l1web_enh_all';   // 勾選記在這台（存不了就當沒勾）
    const allOn = () => { try { return localStorage.getItem(ALL_KEY) === '1'; } catch (e) { return false; } };
    const usable = p => bm() ? !!blessTab(p) : enhanceable(p);
    const tabFor = p => bm() ? blessTab(p) : tabOf(p);
    function listItems(tab) {   // 身上的在前、背包的在後
        const all = items().filter(p => usable(p) && tabFor(p) === tab);
        return all.filter(p => p.equipped).concat(all.filter(p => !p.equipped));
    }
    // 這件能用的卷軸：同分頁、專用卷軸只給對應的裝備；排序：一般、祝福，再來其他種。詛咒的（bless 2，2026-10-19 起不該再有）不列
    function scrollsFor(p) {
        if (bm()) return items().filter(s => { const si = scrollInfo(s); return si && si.fam === 'bless'; });
        const enx = p.tpl.enx || null, tab = tabOf(p), pet = tab === 'pet';
        const want = tab === 'acc' ? 'acc' : enx || 'std', stab = pet ? petScrollTab(p) : tab;
        return items().filter(s => { const si = scrollInfo(s); return si && si.tab === stab && si.fam === want && (s.it.bless & 127) !== 2; })
            .sort((a, b) => (a.it.bless === 0 ? 1 : 0) - (b.it.bless === 0 ? 1 : 0) || a.tpl.id - b.tpl.id);
    }
    const scrollName = s => (s.it.bless === 0 ? '祝福的 ' : '') + s.base;   // 用詞同背包（items.js BLESS_WORD）
    function iconHtml(p, cls) { const ic = cb.icon(p), g = glowCls(p); return ic ? '<img class="' + cls + (g ? ' ' + g : '') + '" src="' + esc(ic) + '" alt="" draggable="false" onerror="this.style.visibility=\'hidden\'">' : '<span class="enh-noimg">' + esc(p.base) + '</span>'; }
    const enTag = (p) => p.en ? '<span class="enh-en' + (p.tpl && p.en > (p.tpl.safe || 0) ? ' en-over' : '') + '"><b>' + enTxt(p.en) + '</b></span>' : '';   // 寵物裝備沒有 safe（安定值 0）
    const cell = (label, val, cls) => '<div class="enh-info-cell"><div class="enh-info-label">' + label + '</div><div class="enh-info-val ' + (cls || '') + '">' + val + '</div></div>';

    function render() {
        if (!win) return;
        const all = items();
        let p = st.id ? all.find(x => x.id === st.id) : null;
        if (p && !usable(p)) p = null;
        const scrolls = p ? scrollsFor(p) : [];
        if (st.scrollId) { const k = scrolls.findIndex(s => s.id === st.scrollId); if (k >= 0) st.pick = k; }
        if (st.pick >= scrolls.length) st.pick = 0;
        const sc = scrolls[st.pick] || (!p && st.scrollId ? all.find(s => s.id === st.scrollId) : null) || null;
        const bless = !!(sc && sc.it.bless === 0);

        const mainSlot = p
            ? '<div class="enh-slot-box">' + iconHtml(p, 'enh-slot-img') + enTag(p) + '</div><div class="enh-slot-name">' + esc(p.base) + '</div>'
            : '<div class="enh-slot-box empty"></div><div class="enh-slot-name dim">選擇裝備</div>';
        const scrollSlot = sc
            ? '<div class="enh-slot-box">' + iconHtml(sc, 'enh-slot-img') + '<span class="enh-cnt">' + sc.count.toLocaleString() + '</span></div><div class="enh-slot-name ' + (bless ? 'blessed' : '') + '">' + esc(scrollName(sc)) + '</div>'
            : '<div class="enh-slot-box empty"></div><div class="enh-slot-name dim">' + (p ? '沒有卷軸' : '卷軸') + '</div>';
        const canCycle = scrolls.length > 1;

        let info = cell('成功機率', '—') + cell(bm() ? '狀態' : '強化等級', '—'), stats = '', note = '', canGo = false, auto = '';
        if (p && bm()) {
            const bl = p.it.bless || 0, now = bl === 0 ? '祝福' : (bl & 127) === 2 ? '詛咒' : '一般';
            if (!sc) { info = cell('成功機率', '—') + cell('狀態', now); note = '沒有祝福賦予卷軸'; }
            else if (bl >= 128) { info = cell('成功機率', '—') + cell('狀態', now); note = '封印中，要先解除封印'; }
            else if (bl === 0) { info = cell('成功機率', '—') + cell('狀態', now); note = '已經是祝福的了'; }
            else { info = cell('成功機率', pct(BLESS_RATE[blessTab(p)])) + cell('狀態', now + ' → 祝福'); note = '失敗只消耗卷軸'; canGo = true; }
        } else if (p) {
            const en = p.en;
            if (!sc) { info = cell('成功機率', '—') + cell('強化等級', enTxt(en)); note = tabOf(p) === 'pet' ? '要用' + (p.tpl.pet.wpn ? '對武器' : '對盔甲') + '施法的卷軸' : FAM_NEED[p.tpl.enx] || ''; }
            else {
                const o = odds(p, sc);
                if (o.block) { info = cell('成功機率', '—') + cell('強化等級', enTxt(en)); note = o.block; }
                else if (o.gone) {
                    if (o.ok === 0) { info = cell('成功機率', '0%', 'danger') + cell('強化等級', enTxt(en)); note = '這張卷軸會讓它消失'; canGo = true; }
                    else {
                        const lo = en + o.lv[0][0], hi = en + o.lv[o.lv.length - 1][0];
                        info = cell('成功機率', pct(o.ok)) + cell('強化等級', enTxt(en) + ' → ' + enTxt(lo) + (hi > lo ? '～' + enTxt(hi) : ''));
                        note = (o.none ? '不變 ' + pct(o.none) + '・消失 ' + pct(o.gone) : '失敗會消失 ' + pct(o.gone));   // 站長 2026-11-03「成功、失敗、不變機率都要」
                        stats = statTable(p, en, lo); canGo = true;
                    }
                } else {
                    const lo = en + o.lv[0][0], hi = en + o.lv[o.lv.length - 1][0];
                    info = cell('成功機率', pct(o.ok), o.ok >= 1 ? 'safe' : '') + cell('強化等級', enTxt(en) + ' → ' + enTxt(lo) + (hi > lo ? '～' + enTxt(hi) : ''));
                    stats = statTable(p, en, lo); canGo = true;
                }
                // 連續強化：只到安定值（安定值內必成、不會消失），一張一張送、等伺服器回了才送下一張
                const si = scrollInfo(sc);
                // 第 362 項（站長 2026-10-27「祝福的武卷不能搭配連續衝到安定值」）：選的是祝福卷軸就不給連續強化（祝福的要一張一張自己點）
                if (canGo && si.fam !== 'acc' && en < p.tpl.safe && !bless) {
                    // 站長 2026-11-07「連續強化無法選擇強化值」：背包一變（喝水、撿東西）視窗就重畫，選的值被蓋回安定值 → 記住玩家選的（st.autoTo）
                    const want = st.autoTo > en && st.autoTo <= p.tpl.safe ? st.autoTo : p.tpl.safe;
                    let opts = '';
                    for (let t = en + 1; t <= p.tpl.safe; t++) opts += '<option value="' + t + '"' + (t === want ? ' selected' : '') + '>+' + t + '</option>';
                    const twins = sameGroup(p).length;
                    auto = '<div class="enh-autobox"><div class="enh-auto"><button type="button" class="enh-auto-btn" data-a="auto"' + (st.busy ? ' disabled' : '') + '>連續強化到</button><select class="enh-auto-sel">' + opts + '</select></div>' +
                        (twins ? '<label class="enh-all"><input type="checkbox" class="enh-all-cb"' + (allOn() ? ' checked' : '') + (st.busy ? ' disabled' : '') + '>同樣的 ' + (twins + 1) + ' 件一起強化</label>' : '') +
                        // 第 377 項（站長 2026-10-27「連續強化新增按鈕說明」）
                        '<div class="enh-auto-tip">一張接一張自動點到選的強化值，最多到安定值、不會消失；祝福卷軸不會用到</div></div>';
                }
            }
        }
        // 安定值 +0 的武器、防具（骷髏、火焰之影、死亡、混沌、炎魔雙手劍…武器 42 把、防具 47 件）：+0 起就會消失，大大寫出來（站長 2026-11-05 全面測試 M4）
        const warn0 = p && sc && canGo && !bm() && tabOf(p) !== 'pet' && p.tpl.safe === 0 && p.en >= 0 ? '<div class="enh-warn0">⚠ 這件安定值 +0，強化有風險</div>' : '';
        const res = st.result ? '<div class="enh-result ' + st.result.cls + '">' + esc(st.result.text) + '</div>' : '';
        const TB = bm() ? BLESS_TABS : TABS;
        const tabs = TB.map(([k, n]) => '<button type="button" class="enh-tab' + (st.tab === k ? ' on' : '') + '" data-tab="' + k + '">' + n + '</button>').join('');
        // 同樣的裝備併成一格（站長 2026-11-02「道具沒堆疊」：抗魔法斗篷 20 件排滿畫面）：同名、同強化值、同祝福、都沒穿著＝一格，右下角標件數；
        //   點了挑其中一件（選中的那件在這組就用它）。強化後強化值變了自然分出去；穿著的照舊各自一格
        const list = [], grp = new Map();
        for (const x of listItems(st.tab)) {
            if (x.equipped) { list.push(x); continue; }
            const k = (x.it && x.it.name) + '|' + x.en + '|' + (x.it && x.it.bless);
            const g = grp.get(k);
            if (g) { g.n++; if (p && x.id === p.id) list[g.at] = x; continue; }
            grp.set(k, { n: 1, at: list.length }); list.push(x);
        }
        const nOf = x => { if (x.equipped) return 1; const g = grp.get((x.it && x.it.name) + '|' + x.en + '|' + (x.it && x.it.bless)); return g ? g.n : 1; };
        const grid = list.length ? list.map(x => '<button type="button" class="enh-cell' + (p && x.id === p.id ? ' sel' : '') + '" data-id="' + x.id + '">' +
            '<span class="enh-cell-box">' + iconHtml(x, 'enh-cell-img') + enTag(x) + (x.equipped ? '<span class="eq-tag">使用中</span>' : '') + (nOf(x) > 1 ? '<span class="enh-cnt">×' + nOf(x) + '</span>' : '') + '</span>' +
            '<span class="enh-cell-name">' + esc(x.base) + '</span></button>').join('') : '<div class="enh-empty">沒有可以' + (bm() ? '賦予' : '強化') + '的' + (st.tab === 'pet' ? '寵物裝備' : TB.find(t => t[0] === st.tab)[1]) + '</div>';

        const body = win.querySelector('.enh-body'), og = body.querySelector('.enh-grid'), top = og ? og.scrollTop : 0;
        body.innerHTML =
            '<div class="enh-slots"><div class="enh-slot sc' + (canCycle ? ' cycle' : '') + '"' + (canCycle ? ' data-a="cycle"' : '') + '>' + scrollSlot + (canCycle ? '<span class="enh-cycle-tip">點擊換卷軸</span>' : '') + '</div>' +
            '<div class="enh-plus">＋</div><div class="enh-slot eq">' + mainSlot + '</div></div>' +
            warn0 + '<div class="enh-info">' + info + '</div>' + (note ? '<div class="enh-note">' + esc(note) + '</div>' : '') + stats + res +
            '<button type="button" class="enh-go" data-a="go"' + (canGo && !st.busy ? '' : ' disabled') + '>' + (st.busy && !st.busy.fx ? (bm() ? '賦予中…' : '強化中…') : bm() ? '開始賦予' : '開始強化') + '</button>' + auto +
            '<div class="enh-tabs">' + tabs + '</div><div class="enh-grid">' + grid + '</div>';
        const ng = body.querySelector('.enh-grid'); if (ng && top) ng.scrollTop = top;
    }
    function statTable(p, en0, en1) {
        const a = statRows(p, en0), b = statRows(p, en1);
        if (!a.length) return '';
        return '<div class="enh-stats">' + a.map((r, i) => {
            const nv = b[i] ? b[i][1] : r[1], ch = nv !== r[1];
            return '<div class="enh-stat-row"><span class="enh-stat-label">' + r[0] + '</span><span class="enh-stat-old">' + r[1] + '</span><span class="enh-stat-arrow">→</span><span class="enh-stat-new' + (ch ? ' up' : '') + '">' + nv + '</span></div>';
        }).join('') + '</div>';
    }

    // 送一張：等伺服器回結果訊息（＋那件的強化值更新）才算完成；3 秒沒回就當沒反應
    //   quick＝連續強化的第二張起：不再蓄力（只有第一張蓄力，後面一張接一張，每張的結果特效照播）
    // 第 362 項：連續強化用的卷軸＝開始時選的那一種（同道具、同祝福狀態）；沒有了＝停
    const scrollKey = s => s.tpl.id + '|' + (s.it.bless & 127);
    function chainScroll(p) { return st.chainKey ? scrollsFor(p).find(s => scrollKey(s) === st.chainKey) || null : scrollsFor(p)[st.pick] || null; }
    function sendOne(quick) {
        const all = items(), p = all.find(x => x.id === st.id); if (!p || !usable(p)) return false;   // 第 711 項：中途被鎖起來的不送
        const sc = quick ? chainScroll(p) : scrollsFor(p)[st.pick]; if (!sc) return false;
        const b = st.busy = { id: p.id, en0: p.en, msg: null, t: performance.now(), tab: bm() ? blessTab(p) : tabOf(p) === 'pet' ? petScrollTab(p) : tabOf(p), icon: cb.icon(p), still: false, fx: false, done: false, show: bm() || p.en + 1 >= FX_MIN || !!(cb.tutorial && cb.tutorial()) };
        b.still = !quick && !reduceMotion() && b.show;
        // 一次送幾張：快轉的連續強化（st.rush）、安定值以內、一般卷軸（祝福的一次會跳好幾級，不連續強化）＝差幾級送幾張，卷軸不夠就送到用完
        const n = quick && st.rush && st.goal && !bm() && sc.it.bless !== 0 && p.en < p.tpl.safe ? Math.max(1, Math.min(Math.min(st.goal, p.tpl.safe) - p.en, sc.count || 1)) : 1;
        b.target = p.en + n;   // 送了 n 張：強化值到這裡才算這一輪完成（serverMsg）
        b.timer = setTimeout(() => finish(null), 3000 + 150 * n);
        b.n = n; b.sent = Math.min(2, n); b.sc = sc; b.p = p;   // 伺服器佇列只收 2 包（ClientThread H_CAPACITY）：最多 2 張在路上，回一個補一個（serverMsg）
        for (let k = 0; k < b.sent; k++) cb.use(sc, p);
        if (b.still) { win.classList.add('enh-charging'); playSfx('charge'); }
        return true;
    }
    // 結果出來了（msg＝伺服器訊息，null＝沒回應）：蓄力至少播完才亮結果
    function finish(msg) {
        const b = st.busy; if (!b || b.done) return;
        b.done = true; clearTimeout(b.timer);
        const wait = b.still ? Math.max(0, CHARGE_MS - (performance.now() - b.t)) : 0;
        b.pend = msg;
        if (wait > 0) b.timer = setTimeout(() => settle(b, msg), wait); else settle(b, msg);
    }
    // 點畫面跳過動畫（站長 2026-10-25「強化裝備時的動畫點擊可跳過」）：蓄力中結果還沒到＝一到就直接亮結果；結果已到＝不等蓄力、特效直接收掉；
    //   連續強化中＝馬上接下一張（音效照放，結果那行照寫）
    //   第 320 項（站長 2026-10-26「強化裝備連續強化的特效 點一下可以直接跳到到最後 不用等待+1到+6」）：連續強化中點一下＝快轉（st.rush）：
    //   後面每張不蓄力、不播特效、不放音效，伺服器回了就送下一張，停下來的那張（到目標、失敗、卷軸用完）才照常播結果
    function skip() {
        const b = st.busy; if (!b || !win) return;
        if (st.goal) st.rush = true;
        if (!b.done) { b.still = false; win.classList.remove('enh-charging'); return; }
        if (!b.fx) { clearTimeout(b.timer); settle(b, b.pend); if (st.busy !== b) return; }
        clearTimeout(b.timer); clearFx();
        if (b.more) { sendOne(true); render(); } else { st.busy = null; render(); }
    }
    // 結果：161 → 那件的強化值變小＝降低、否則成功；164 消失；160、79 沒有變化（照伺服器，不猜）
    //   祝福賦予（sysMsg）自己帶 kind：good 成功、none 沒成功、null 沒用到（已經是祝福的、封印中）
const outcomeOf = (b, msg, p) => !msg ? null : 'kind' in msg ? msg.kind : msg.id === 164 ? 'bad' : msg.id === 161 ? (p && p.en < b.en0 ? 'down' : 'good') : 'none';
    function settle(b, msg) {
        if (st.busy !== b || !win) return;
        win.classList.remove('enh-charging');
        const p = items().find(x => x.id === b.id), kind = outcomeOf(b, msg, p);
        if (msg) st.result = kind === 'down' ? { cls: 'mid', text: msg.text } : msg; else if (!b.msg) st.result = { cls: 'mid', text: '伺服器沒有回應' };
        if (!p || kind === 'bad') st.id = 0;   // 消失了（伺服器的刪除封包可能比訊息慢一點到）
        // 連續強化：成功了、還沒到目標、還有卷軸 → 下一張（中間這幾張只播結果特效、不等它播完）
        //   第 362 項：只接「開始時那一種」卷軸（一般的用完就停，不會換成祝福的接著衝）
        let more = st.goal && kind === 'good' && p && p.en < st.goal && p.en < p.tpl.safe && chainScroll(p);
        // 勾了「同樣的 N 件一起強化」：這件到目標了 → 換同一組的下一件（同一種卷軸、同一個目標；卷軸用完就停）
        if (!more && st.goal && kind === 'good' && p && st.queue && st.queue.length) {
            let nx = null;
            while (st.queue.length && !nx) { const q = items().find(x => x.id === st.queue[0]); st.queue.shift(); if (q && q.en < st.goal && q.en < q.tpl.safe && chainScroll(q)) nx = q; }
            if (nx) { st.id = nx.id; st.allN = (st.allN || 1) + 1; more = true; allProgress(); }
        }
        if (!more) {
            if (st.allN > 1 && kind === 'good' && p) st.result = { cls: 'good', text: p.en >= st.goal ? '同樣的 ' + st.allN + ' 件都強化到 ' + enTxt(p.en) : '強化了 ' + st.allN + ' 件，卷軸用完了' };
            st.goal = 0; st.chainKey = null; st.rush = false; st.queue = null; st.allN = 0;
        }
        if (more && st.rush) {   // 快轉：中間這張什麼都不播、也不重畫（busy 一直在，背包變動也不重畫），馬上接下一張；站長 2026-11-07「不要一個一個慢慢加，直接加到 6」
            clearFx();
            b.timer = setTimeout(() => { if (st.busy !== b || !win || win.hidden) return; if (!sendOne(true)) { st.busy = null; st.goal = 0; st.chainKey = null; st.rush = false; render(); } }, 30);
            return;
        }
        if (kind) playSfx(kind === 'good' ? (b.tab === 'wpn' ? 'ok_wpn' : 'ok_arm') : kind === 'bad' ? 'boom' : kind);
        if (!kind || reduceMotion() || !b.show) {   // 沒回應、系統要求減少動態效果、沒到 +7（FX_MIN）：不播動畫（音效照播）
            st.busy = null; render();
            if (more) setTimeout(() => { if (win && !win.hidden && !st.busy) { sendOne(true); render(); } }, 250);
            return;
        }
        b.fx = true; render();   // busy 仍在：按鈕維持停用，等特效播完
        const r0 = rectInPanel(eqBox());   // 重畫「後」才量：裝備消失時版面會變矮、視窗重新置中，事前量的位置會對不上（裝備格本身還在，只是變空）
        outcomeFx(kind, r0, b.icon, p ? p.en : 0);
        b.more = !!more;
        if (more) { b.timer = setTimeout(() => { if (st.busy === b && win && !win.hidden) { sendOne(true); render(); } }, 550); return; }
        b.timer = setTimeout(() => { if (st.busy === b) { st.busy = null; render(); } }, OUT_MS);
    }
    // 一起強化的進度：按鈕「強化中 N/總數」＋框底下一條進度條（快轉中不重畫整個視窗，只改這兩個）
    function allProgress() {
        if (!win || !st.allTotal) return;
        const box = win.querySelector('.enh-autobox'), btn = win.querySelector('.enh-auto-btn'); if (!box) return;
        let bar = box.querySelector('.enh-prog');
        if (!bar) { bar = document.createElement('div'); bar.className = 'enh-prog'; bar.innerHTML = '<i></i>'; box.appendChild(bar); }
        bar.firstChild.style.width = Math.round(100 * (st.allN - 1) / st.allTotal) + '%';
        if (btn) btn.textContent = '強化中 ' + st.allN + '/' + st.allTotal;
    }
    function eqBox() { return win && win.querySelector('.enh-slot.eq .enh-slot-box'); }
    function rectInPanel(el) {
        const panel = win && win.querySelector('.enh-panel');
        if (!el || !panel) return null;
        const a = srect(el), b = srect(panel);   // 舞台座標（stage.js）：放大時螢幕距離不等於版面距離
        return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2, s: a.width, cx: b.width / 2 };
    }
    function fxLayer() {   // 動畫層掛在 .enh-panel（不在 render 重畫的 .enh-body 裡）
        const panel = win && win.querySelector('.enh-panel'); if (!panel) return null;
        let fx = panel.querySelector('.enh-fx');
        if (!fx) { fx = document.createElement('div'); fx.className = 'enh-fx'; panel.appendChild(fx); }
        return fx;
    }
    function outcomeFx(kind, r, src, en1) {
        const fx = fxLayer(); if (!fx || !r) return;
        fx.innerHTML = '';
        const cls = kind === 'good' ? 'ok' : kind === 'bad' ? 'boom' : kind;   // ok／boom／down／none（CSS 的名字）
        const host = document.createElement('div');
        host.className = 'enh-fx-at ' + cls;
        host.style.left = r.x + 'px'; host.style.top = r.y + 'px'; host.style.setProperty('--s', r.s + 'px');
        let html = '<i class="enh-fx-flash"></i>';
        if (kind === 'good') {
            html += '<i class="enh-fx-rays"></i>';
            for (let k = 0; k < 12; k++) { const a = k * 30 + Math.random() * 18, dist = 0.9 + Math.random() * 0.8; html += '<i class="enh-fx-spark" style="--a:' + a + 'deg;--d:' + dist + ';--t:' + (Math.random() * 0.15).toFixed(2) + 's"></i>'; }
            html += '<img class="enh-fx-icon" src="' + esc(src) + '" alt="">';
        } else if (kind === 'bad') {
            // 銀光 → 碎成 8 片往外飛（每片＝同一張圖用 clip-path 裁一塊）
            const P = ['0 0,50% 0,50% 50%', '50% 0,100% 0,50% 50%', '100% 0,100% 50%,50% 50%', '100% 50%,100% 100%,50% 50%', '100% 100%,50% 100%,50% 50%', '50% 100%,0 100%,50% 50%', '0 100%,0 50%,50% 50%', '0 50%,0 0,50% 50%'];
            P.forEach((poly, k) => { const a = k * 45 + 22 + (Math.random() * 20 - 10); html += '<img class="enh-fx-shard" src="' + esc(src) + '" alt="" style="clip-path:polygon(' + poly + ');--a:' + a + 'deg;--r:' + Math.round(Math.random() * 300 - 150) + 'deg">'; });
        } else {
            html += '<img class="enh-fx-icon" src="' + esc(src) + '" alt=""><i class="enh-fx-smoke"></i>';
        }
        host.innerHTML = html;
        fx.appendChild(host);
        // 結果大字：視窗水平置中、壓在兩格那一列（放在裝備格上會超出右邊界、往上飄會蓋到標題）
        const txt = document.createElement('b');
        txt.className = 'enh-fx-text ' + cls;
        txt.innerHTML = kind === 'good' ? (bm() ? '祝福賦予成功' : '強化成功<span>' + enTxt(en1) + '</span>') : kind === 'bad' ? '強化失敗' : kind === 'down' ? '強化值降低' : '沒有變化';
        txt.style.left = r.cx + 'px'; txt.style.top = r.y + 'px';
        fx.appendChild(txt);
        setTimeout(() => { if (txt.parentNode) txt.parentNode.removeChild(txt); }, OUT_MS + 300);
        if (kind === 'bad') { const pn = fx.parentElement; pn.classList.remove('enh-shake'); void pn.offsetWidth; pn.classList.add('enh-shake'); }
        setTimeout(() => { if (host.parentNode) host.parentNode.removeChild(host); }, OUT_MS + 300);
    }
    // 伺服器訊息：161 成功（%0 一瞬間發出 %1 光芒）、160 發光但沒事、164 消失、79 沒有任何事情發生
    function serverMsg(id, text) {
        const b = st.busy; if (!b || b.done || ![161, 160, 164, 79].includes(id)) return;
        const msg = { id, cls: id === 161 ? 'good' : id === 164 ? 'bad' : 'mid', text };
        b.msg = msg; b.msgAt = performance.now();
        if (id === 164 || id === 79 || id === 160) { finish(msg); return; }
        if (b.n && b.sent < b.n) { b.sent++; cb.use(b.sc, b.p); }   // 回來一張成功 → 補送下一張
        if (b.waiting) return;   // 一次送好幾張：等的迴圈已經在跑，只更新最後一個訊息的時間
        b.waiting = true;
        // 成功：等那件的名字（+N）更新了再算完成
        const wait = () => {
            if (st.busy !== b) return;
            const p = items().find(x => x.id === b.id);
            const now = performance.now(), quiet = p && p.en > b.en0 && now - b.msgAt > 350;   // 強化值動了、350ms 沒有新的成功訊息＝伺服器處理完了（少處理的 settle 補送）
            if (!p || p.en >= b.target || (b.target === b.en0 + 1 && p.en !== b.en0) || quiet || now - b.t > 2500 + 150 * (b.target - b.en0)) finish(b.msg); else setTimeout(wait, 40);
        };
        wait();
    }

    // 祝福賦予的結果是伺服器自己寫的一行字（S_SystemMessage，WebBless.blessScroll）：成功／失敗／已經是祝福的／封印中
    function sysMsg(text) {
        const b = st.busy;
        // 伺服器第 697 項：一起強化做完了（「一起強化完成：N 件強化到 +X。」；按太快、不能強化也是這個開頭）
        if (b && !b.done && b.batch && text.startsWith(BATCH_DONE)) {
            const t = text.slice(BATCH_DONE.length), ok = /件強化到/.test(t) && !/^0 件/.test(t);
            const msg = { id: 0, kind: ok ? 'good' : null, cls: ok ? 'good' : 'mid', text: t };
            b.msg = msg; finish(msg); return;
        }
        // 伺服器第 711 項：對鎖著的裝備用強化卷軸＝伺服器擋下、回一行「○○：這件鎖起來了，先在道具視窗解鎖。」（WebItemLock.MSG）；
        //   不認得它就只能等 3 秒顯示「伺服器沒有回應」（站長 2026-11-09 截圖）。清單本來就不列鎖著的，這裡接住鎖頭狀態還沒同步到的那一下
        if (b && !b.done && !bm() && text.endsWith(LOCK_MSG)) {
            const msg = { id: 0, kind: null, cls: 'mid', text: '這件裝備上鎖了，先解鎖才能強化' };
            b.msg = msg; st.goal = 0; st.queue = null; finish(msg); return;
        }
        if (!b || b.done || !bm()) return;
        const kind = /^祝福賦予成功/.test(text) ? 'good' : /^祝福賦予失敗/.test(text) ? 'none' : /^(這件已經是祝福的了|封印中的裝備)/.test(text) ? null : undefined;
        if (kind === undefined) return;
        const msg = { id: 0, kind, cls: kind === 'good' ? 'good' : 'mid', text };
        b.msg = msg; finish(msg);
    }

    function open(o = {}) {
        if (!win) {
            win = document.createElement('div');
            win.id = 'enh-window';
            win.innerHTML = '<div class="enh-panel" role="dialog" aria-label="裝備強化"><div class="enh-head"><span class="enh-title">裝備強化</span><button type="button" class="enh-x" aria-label="關閉">✕</button></div><div class="enh-body"></div></div>';
            win.addEventListener('click', e => {
                if (e.target === win || e.target.closest('.enh-x')) { close(); return; }
                if (st.busy) { skip(); return; }   // 動畫中點哪裡都是跳過
                const t = e.target.closest('[data-tab],[data-id],[data-a]'); if (!t) return;
                if (t.hasAttribute('data-tab')) { st.tab = t.getAttribute('data-tab'); render(); return; }
                if (t.hasAttribute('data-id')) { st.id = +t.getAttribute('data-id'); st.pick = 0; st.autoTo = 0; st.result = null; render(); return; }
                const a = t.getAttribute('data-a');
                if (a === 'cycle') { st.pick++; st.scrollId = 0; st.result = null; render(); }
                else if (a === 'go') { st.goal = 0; st.chainKey = null; st.rush = false; st.result = null; if (sendOne()) render(); }
                else if (a === 'auto') {
                    const sel = win.querySelector('.enh-auto-sel'), p0 = items().find(x => x.id === st.id), s0 = p0 ? scrollsFor(p0)[st.pick] : null;
                    if (!s0 || s0.it.bless === 0) return;   // 第 362 項：祝福卷軸不連續強化
                    // 站長 2026-11-07「連續強化時不要顯示動畫，直接跳到最後」：一開始就快轉（第一張也不蓄力），只有停下來那張播結果
                    st.goal = sel ? +sel.value : 0; st.chainKey = scrollKey(s0); st.rush = true; st.result = null;
                    st.queue = allOn() ? sameGroup(p0).map(x => x.id) : null; st.allN = 1;   // 同樣的一起強化：接著要衝的那幾件
                    st.allTotal = st.queue && st.queue.length ? st.queue.length + 1 : 0;
                    // 伺服器第 697 項：一起強化交給伺服器一次做完（一張一張送，伺服器每個連線一次只收 2 包，100 件要等很久）
                    if (st.queue && st.queue.length && cb.batch) {
                        const ids = [p0.id].concat(st.queue).slice(0, BATCH_MAX);
                        const b = st.busy = { id: p0.id, en0: p0.en, batch: true, msg: null, t: performance.now(), tab: tabOf(p0), icon: cb.icon(p0), still: false, fx: false, done: false, show: false, target: st.goal };
                        st.queue = null; st.allTotal = 0;   // 伺服器做完整組，網頁這邊不接下一件
                        b.timer = setTimeout(() => finish(null), 15000);
                        if (cb.batch(s0, st.goal, ids)) { render(); const btn = win.querySelector('.enh-auto-btn'); if (btn) btn.textContent = '強化中…'; return; }
                        clearTimeout(b.timer); st.busy = null; st.queue = ids.slice(1); st.allTotal = ids.length;   // 送不出去（沒連線）：照舊一件一件
                    }
                    if (sendOne(true)) { render(); allProgress(); }
                }
            });
            win.addEventListener('change', e => {
                const sel = e.target.closest('.enh-auto-sel'); if (sel) { st.autoTo = +sel.value; sel.blur(); }
                const cb = e.target.closest('.enh-all-cb'); if (cb) { try { localStorage.setItem(ALL_KEY, cb.checked ? '1' : '0'); } catch (x) { } cb.blur(); }
            });
            document.body.appendChild(win);
        }
        const s = o.scroll && scrollInfo(o.scroll) ? o.scroll : null, mode = s && scrollInfo(s).fam === 'bless' ? 'bless' : 'enh';
        const p = o.item && (mode === 'bless' ? blessTab(o.item) : enhanceable(o.item)) ? o.item : null;
        if (st.busy) clearTimeout(st.busy.timer);
        st = { mode, id: p ? p.id : 0, tab: p ? (mode === 'bless' ? blessTab(p) : tabOf(p)) : s && mode !== 'bless' ? scrollInfo(s).tab : 'wpn', pick: 0, scrollId: s ? s.id : 0, result: null, busy: null, goal: 0 };
        const ttl = win.querySelector('.enh-title'); if (ttl) ttl.textContent = mode === 'bless' ? '祝福賦予' : '裝備強化';
        clearFx();
        preloadSfx(['magic', ...Object.values(ENH_SFX)]);
        win.hidden = false;
        document.body.classList.add('enh-open');
        render();
    }
    function clearFx() {   // 蓄力、結果特效、震動全部收掉（關窗、重開）
        if (!win) return;
        win.classList.remove('enh-charging');
        const fx = win.querySelector('.enh-fx'); if (fx) fx.innerHTML = '';
        const pn = win.querySelector('.enh-panel'); if (pn) pn.classList.remove('enh-shake');
    }
    function close() { if (!win) return; win.hidden = true; document.body.classList.remove('enh-open'); if (st.busy) clearTimeout(st.busy.timer); st.busy = null; st.goal = 0; st.chainKey = null; st.rush = false; clearFx(); }
    // busy：蓄力、等結果、結果特效、連續強化（兩張中間那一下也算）還在跑（新手引導完成時等它播完才關視窗）
    // 下拉選單開著時不重畫（重畫會把它關掉）；選完 change 會 blur，之後照常重畫
    const picking = () => { const a = document.activeElement; return !!(a && a.classList && a.classList.contains('enh-auto-sel')); };
    return { open, close, refresh: () => { if (win && !win.hidden && !st.busy && !picking()) render(); }, serverMsg, sysMsg, isOpen: () => !!win && !win.hidden, busy: () => !!(st.busy || st.goal), enhanceable, scrollInfo };
}
