// 遊戲中介面：沿用單機版 afk-lmui.js 的天堂M風格（DOM 結構、按鈕、文字照原檔），資料改由 L1J 封包餵進來。
//   規格書＝單機版原始碼（afk-lmui.js、js/00z-my-tweaks.js 的功能選單）；能做什麼、數值照 L1J 3.50c。
//   還沒做的（交易所、統計／血盟；能力視窗的社交分頁 2026-10-29 站長要求移除）保留外觀，按了跳「尚未開放」。
//   用法：const hud = createHud(root, cb) → hud.update(state)、hud.chat(line)…；cb 見 main.js
import { parseTitle } from './titlecolor.js';
import { goldIcon } from './icons.js';
import { parseItem, infoItem, itemLines, lineHtml, itemById, stacks, glowCls, nameCls, TPL_OF, HOME_STONE, isHomeStone, hsFx, HONOR_CARDS, honorKind, hcTag, isLocked, lockTag } from './items.js';
import { cmpHtml } from './equipdiff.js';
import { derived, totalSp, realStat, lawfulColor, blessStat } from './calc.js';
import { frameFor } from './look.js';
import { scale2x } from './pixel.js';
import { audioCfg, setAudio } from './audio.js';
import { createEnhance } from './enhance.js';
import { createCraft } from './craft.js';
import { createItemInfo } from './iteminfo.js';
import { createHotDrag } from './hotdrag.js';
import { startRcol } from './rcol.js';
import { createNpcUi } from './npc.js';
import { createSupply } from './supply.js';
import { createSpellShop } from './spellshop.js';
import { createUpdater } from './update.js';
import { watchFrames } from './frame.js';
import { pcInit, pcUpdate, isPc, pcPlace, pcShell, pcModeChange, pcResetWins } from './pcui.js';
import { vw, vh, srect, sxy, stageScale } from './stage.js';
import { effectDesc } from './effects.js';
import { dollShow, setDollShow, dollShowSelect, reloadDollShow } from './dollshow.js';
import { openDollPick } from './dollpick.js';
import { statusHtml as cardStatus, lockAsk as cardLockAsk, LOCK_BTN, lockTxt, autoAsk } from './sellcard.js';
import { hornOfName, hornSvgHtml } from './horn.js';   // 第 732 項第二版：聊天框說話的人名字前面放小號角

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const setTxt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
// 商店收一個多少錢（gen-data → data/shopsell.json，同伺服器 WebShop.sellPrice）：沒列的＝沒人收，自動賣出時伺服器直接刪除
let SHOP_SELL = null;
fetch('/data/shopsell.json').then(r => r.ok ? r.json() : null).then(d => { SHOP_SELL = d; }).catch(() => {});
// 設定視窗的分頁：系統（站長 2026-10-18：設定頁一打開就是系統）＋掛機輔助五頁（照站長給的內掛選單截圖；「輔助」2026-10-20 拿掉，中毒、變身搬到補給）
const AS_TABS = ['系統', '狩獵', '補給', '魔法', '召喚', '名單'];

const CLASS_LOGO = ['王族', '騎士', '妖精', '法師', '黑暗妖精'];
const CLASS_NAME = CLASS_LOGO;
// 隱藏魅力：只用在帶寵物（照 3.50c C_GiveItem.tamePet：王族、法師、黑暗妖精＋6，妖精＋12，騎士沒有；每隻寵物佔 6）
const HIDDEN_CHA = [6, 0, 12, 6, 6];
// 寵物傷害（站長 2026-10-17 自訂規則，伺服器 L1Attack.petChaBonus 同一個公式）：寵物每一下＋round(魅力 × 0.2)，魅力含裝備、不含隱藏魅力
const petDmg = cha => Math.round((cha || 0) * 0.2);
// AUTO 鈕圖示（站長 2026-10-23「AUTO 有開啟的時候，顯示明顯的動畫；圖示換帥一點」）：三種設計先都留著，AUTO_STYLE 切換，站長挑好再定案
//   a＝符文魔法陣（外圈符文環慢慢轉＋紫光脈動）、b＝聖盾光劍（盾上一道光掃過＋金光脈動）、c＝旋風刃輪（雙刃快轉＋紅光波紋往外擴）
//   動畫在 lmui.css「AUTO 鈕三種設計」：只動 transform／opacity（圖層合成，不重畫）；關著不動；prefers-reduced-motion 改成靜態發光
const AUTO_STYLE = 'a';
const AUTO_SVG = (() => {
    const P = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return (24 + r * Math.cos(a)).toFixed(2) + ' ' + (24 + r * Math.sin(a)).toFixed(2); };
    const svg = (cls, body, extra) => '<svg class="' + cls + '" viewBox="0 0 48 48" aria-hidden="true"' + (extra || '') + '>' + body + '</svg>';
    const word = (y, size) => '<text x="24" y="' + y + '" text-anchor="middle" fill="currentColor" stroke="none" font-size="' + size + '" font-weight="800" font-family="Arial,Helvetica,sans-serif" letter-spacing=".4">AUTO</text>';
    const sword = deg => '<g transform="translate(24 18.6) rotate(' + deg + ')"><path d="M0-11.5l1.7 2.6v12.6h-3.4V-8.9z"/><path d="M-4.6 3.7h9.2v1.9h-9.2z"/><path d="M-.9 5.6h1.8v4.2h-1.8z"/><circle cy="11.1" r="1.35"/></g>';
    const swords = '<g fill="currentColor" stroke="rgba(0,0,0,.55)" stroke-width=".5" stroke-linejoin="round">' + sword(-38) + sword(38) + '</g>';
    if (AUTO_STYLE === 'b') {
        const shield = '<path d="M24 6.5L33.5 10v8c0 6-4 10-9.5 12.5C18.5 28 14.5 24 14.5 18v-8z" fill="rgba(0,0,0,.28)" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
            '<path d="M24 9.2l7 2.6v6.2c0 4.5-3 7.6-7 9.6" fill="none" stroke="currentColor" stroke-width=".7" opacity=".55"/>';
        const sword = '<g stroke="currentColor" stroke-linecap="round"><path d="M24 3.2V22" stroke-width="2.6"/><path d="M24 4.5V20.5" stroke="#fff" stroke-width=".8" opacity=".75"/>' +
            '<path d="M18.8 21.6h10.4" stroke-width="2.2"/><path d="M24 21.6v5.6" stroke-width="2"/></g><circle cx="24" cy="28.6" r="1.4" fill="currentColor"/>';
        return '<i class="as-halo"></i><i class="as-clip"><b></b></i>' + svg('as-core', shield + sword + word(40.5, 9));
    }
    if (AUTO_STYLE === 'c') {
        // 一把彎刃：外緣貼著圓、內緣照 sin 曲線鼓進來（尾端最寬、刃尖收成一點）
        const blade = o => { let d = 'M' + P(22, o) + 'A22 22 0 0 1 ' + P(22, o + 130); for (let k = 12; k >= 0; k--) { const t = k / 12; d += 'L' + P(22 - 4.6 * Math.sin(Math.PI * Math.pow(t, .7)), o + 130 * t); } return d + 'Z'; };
        const ring = '<g fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width=".5"><path d="' + blade(0) + '"/><path d="' + blade(180) + '"/></g>' +
            '<g fill="currentColor"><circle cx="' + P(20.3, 165).split(' ')[0] + '" cy="' + P(20.3, 165).split(' ')[1] + '" r=".9"/><circle cx="' + P(20.3, 345).split(' ')[0] + '" cy="' + P(20.3, 345).split(' ')[1] + '" r=".9"/></g>';
        const core = '<path d="M24 9.5l1.3 3.2 3.2 1.3-3.2 1.3L24 18.5l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="currentColor"/>' + word(29.5, 10.5) +
            '<path d="M17 33.2h4.6l2.4-1.4 2.4 1.4H31" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".8"/>';
        return '<i class="as-halo"></i><i class="as-wave"></i>' + svg('as-ring', ring) + svg('as-core', core);
    }
    // a：符文魔法陣
    const runes = ['M0-1.8v3.6M0-1.8l1.3 1M0-.2l1.3 1', 'M-1.1-1.8l2.2 3.6M1.1-1.8l-2.2 3.6', 'M0-1.8v3.6M-1.2-.6L0 .4l1.2-1', 'M-1.1 1.8V-1.8l2.2 1.6-2.2 1.4',
        'M0-1.8l1.3 1.8L0 1.8-1.3 0z', 'M-1.1-1.8v3.6M1.1-1.8v3.6M-1.1 0h2.2', 'M1.1-1.8L-1.1 0l2.2 1.8', 'M0-1.8v3.6M-1.2-1.8L0-.6l1.2-1.2'];
    let r = '<circle cx="24" cy="24" r="21.8" stroke-width="1"/><circle cx="24" cy="24" r="15.6" stroke-width=".9"/>';
    runes.forEach((d, i) => {
        const p = P(18.7, i * 45).split(' '), q = P(18.7, i * 45 + 22.5).split(' ');
        r += '<path d="' + d + '" transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + i * 45 + ') scale(1.3)" stroke-width="1"/><circle cx="' + q[0] + '" cy="' + q[1] + '" r=".8" fill="currentColor" stroke="none"/>';
    });
    const ring = '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + r + '</g>';
    return '<i class="as-halo"></i>' + svg('as-ring', ring) + svg('as-core', swords + word(35.2, 8));
})();
const MAP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>';
// 功能鈕與選單圖示（js/00z-my-tweaks.js FN_SVG、FN_ICO）
const FN_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lmui-fn-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe6a6"/><stop offset="1" stop-color="#b8862f"/></linearGradient></defs>' +
    '<g fill="none" stroke="url(#lmui-fn-g)" stroke-width="2.4" stroke-linejoin="round"><rect x="4" y="4" width="10" height="10" rx="2"/><rect x="18" y="4" width="10" height="10" rx="2"/><rect x="4" y="18" width="10" height="10" rx="2"/></g>' +
    '<path d="M23 17.5v11M17.5 23h11" stroke="url(#lmui-fn-g)" stroke-width="2.8" stroke-linecap="round"/></svg>';
// 背包下方的小圖示（bagFoot）：自動賣出＝金幣袋、背包整理＝上下箭頭
//   站長 2026-10-25 給的四個金色圖示（.scratch/ico/cut4.mjs 去背切開 → public/icons/bag-*.png）
const bagImg = n => '<img class="bf-img" src="/icons/bag-' + n + '.png" alt="">';
const BAG_ICO = { doll: bagImg('doll'), sell: bagImg('sell'), mail: bagImg('mail'), sort: bagImg('sort') };
const FN_ICO = {
    shop: '<svg viewBox="0 0 24 24"><path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7"/><circle cx="9.5" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="M3 6l9 7 9-7"/></svg>',
    trade: '<svg viewBox="0 0 24 24"><path d="M4 8h15l-4-4M20 16H5l4 4"/></svg>',
    rank: '<svg viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11"/><path d="M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z"/></svg>',
    drops: '<svg viewBox="0 0 24 24"><path d="M5 10h14l-1.5 10h-11z"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/><path d="M12 13.5v3.5M10.2 15.2h3.6"/></svg>',
    craft: '<svg viewBox="0 0 24 24"><path d="M13.5 4.5l6 6-2.5 2.5-6-6z"/><path d="M12.2 8.2L4 16.4 7.6 20l8.2-8.2"/></svg>',
    fun: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.3" r=".9"/><circle cx="17.6" cy="13.6" r=".9"/></svg>',
    dig: '<svg viewBox="0 0 24 24"><path d="M4 20l7-7"/><path d="M10.5 6.5l7 7 2-2a3 3 0 0 0 0-4.2l-2.8-2.8a3 3 0 0 0-4.2 0z"/><path d="M15 19h5M17.5 16.5v5"/></svg>',
    doll: '<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.6"/><path d="M8.6 9.8C6.6 11 5.5 13.6 5.5 16.5c0 2.4 2.9 4 6.5 4s6.5-1.6 6.5-4c0-2.9-1.1-5.5-3.1-6.7"/><path d="M9.5 15.5h5"/></svg>',
};
// 魔法娃娃（dolls.js）移到背包左下的「魔法娃娃」（站長 2026-10-19「原本娃娃按鈕移過來」），⊞ 選單不再列；「掉寶」改名「該地圖掉寶資訊」
const FN_ITEMS = [['shop', '商城'], ['craft', '製作工匠'],   // 商城：站長 2026-10-24 從右側方框鈕收進來，排第一個、選單打開時閃一下（lmui.css .fn-shine）
    ['trade', '交易所'],   // 信箱移到背包下方（站長 2026-10-25「方塊的信箱移除」）
    ['rank', '排行榜'], ['fun', '遊樂場']];   // 本區掉寶移到右上小地圖底下那條（站長 2026-10-25「本區掉寶移到右邊展開的小地圖裡面」）   // 遊樂場：小遊戲都收在這（站長 2026-10-25「方塊放一個名稱，把挖寶放裡面，之後有新遊戲可以放裡面」），目前有寶藏挖掘（伺服器第 210 項）；本區掉寶：原名「該地圖掉寶資訊」（站長 2026-10-25「換個名稱」）
const TOOLS = [
    { id: 'battle', name: '狩獵場' }, { id: 'chat', name: '聊天' }, { id: 'stats', name: '角色' },   // 站長 2026-10-31：原本「能力」，視窗裡有能力、隊伍、血盟三頁 → 改「角色」
    { id: 'skill', name: '魔法' }, { id: 'items', name: '背包' }, { id: 'automation', name: '設定' },
];
// 聊天頻道：選單值 → C_Chat 的 chatType（一般 0、世界 3、隊伍 11、血盟 4）、能不能用
//   隊伍：伺服器把 type 11 送給全隊（S_ChatPacket 走 GLOBALCHAT、type 11「(名字) 內容」，main.js CHAT_CAT 放隊伍分頁）
const CHANNELS = [['say', '一般', 0, 1], ['world', '世界', 3, 1], ['party', '隊伍', 11, 1], ['clan', '血盟', 4, 1], ['whisper', '密語', -1, 1]];   // 密語：send() 另外走 onWhisper（名字欄 #lmui-wto）
// 血條的樣子＝用戶端同一段橫條不同色的圖（Sprite.pak，gen-data 存成 data/ui/bar-<編號>.png）。
//   由上往下第一個成立的就用它（同時好幾種狀態＝排越前面越優先），都不成立用最後一個（平常）；狀態解除伺服器會再通知，自動換回平常。
//   狀態從哪來（main.js）：S_Poison 綠＝poison、灰＝grayPoison（麻痺毒；冰凍也會送灰）、S_Paralysis 麻痺＝paralysis、詛咒麻痺＝paralysis2、冰凍＝freeze、
//   S_Web 6（伺服器本機改動）魔法封印、封印禁地、沉默毒＝silenced
const BAR_LOOK = {
    hp: [
        ['467', s => s.freeze],                                     // 冰凍：白（冰矛圍籬、冰雪颶風、寒冰噴吐、大地屏障）
        ['469', s => s.paralysis || s.paralysis2 || s.grayPoison], // 麻痺、石化：石色（麻痺毒、詛咒麻痺）
        ['470', s => s.poison],                                     // 中毒：金
        ['468'],                                                    // 平常：紅
    ],
    mp: [
        ['459', s => s.silenced],                                   // 魔法封印（沉默）：銀
        ['460'],                                                    // 平常：藍灰
    ],
};
const barLook = (k, s) => BAR_LOOK[k].find(([, when]) => !when || when(s))[0];
// 負重（weight242＝目前重量 ÷ 上限 × 242，伺服器算好送來）的門檻，照 3.50c：≥120 魔力不會自然恢復（MpRegeneration）、≥121 體力也不會（HpRegeneration）、
//   ≥197 不能攻擊、施法（C_Attack、L1SkillUse）、≥242 撿不起、拿不到更多東西（L1PcInventory）。回傳顏色 class 和給玩家看的一句
function weightLook(w) {
    if (w == null || w < 120) return null;
    if (w >= 242) return { cls: 'wt-over', note: '拿不動更多東西' };
    if (w >= 197) return { cls: 'wt-over', note: '太重了，無法攻擊或施法' };
    return { cls: 'wt-warn', note: w >= 121 ? '體力、魔力不會自然恢復' : '魔力不會自然恢復' };
}
// 聊天分頁裡還沒有資料來源的（沒有戰鬥）：固定顯示「尚未開放」。掉落＝打怪拿到東西的訊息（main.js DROP_MSG）；血盟＝血盟頻道（type 4）；隊伍＝隊伍頻道（type 11）
const TAB_SOON = {};
// 「全部」分頁收哪些（站長 2026-10-23：原本的「戰鬥」改成「全部」，看一般、隊伍、血盟、世界；悄悄話跟一般走）
const ALL_CATS = { say: 1, whisper: 1, party: 1, clan: 1, world: 1, spy: 1 };
const inTab = (cat, t) => t === 'all' ? !!ALL_CATS[cat] : cat === t || (t === 'say' && cat === 'whisper');
const MM_KEY = 'l1web_mm_off', HOT_KEY = 'l1web_hot_mode', HOT_SLOTS_KEY = 'l1web_hot_', BAG_KEY = 'l1web_bag_', BAG_KEEP = 400, WHO_KEY = 'l1web_who_off', CHAT_KEY = 'l1web_chat_size', FLT_KEY = 'l1web_flt_off';
// 浮動訊息（快捷列上方）：最多幾行、每則停多久
const FLT_MAX = 5, FLT_MS = 3500;
// 聊天視窗三段高度（小、中、大）各幾行（直式）；照剩下的高度縮，最大那段也要留 CHAT_MIN_SCENE 給戰鬥畫面
const CHAT_LINES = [3, 6, 10], CHAT_MIN_SCENE = 130;
// 用了要先選另一個道具的：鑑定(7)、選擇(14，強化卷軸等)、武器強化(26 dai)、防具強化(27 zel)（C_ItemUSe 讀對象道具編號）
const NEED_ITEM_TARGET = new Set([7, 14, 26, 27]);

// L1J ExpTable.java（等級 1..99 的累積經驗；站長 2026-10-17：1～10 級照單機版，11 級以後每級需求照 3.5、整張往前移 4175）
const EXP = [0, 3, 19, 69, 182, 427, 912, 1810, 3394, 6079, 10486, 16581, 24406, 34261, 46470, 61381, 79366, 100821, 126166, 155845, 190326, 230101, 275686, 327617, 386466, 452817, 527282, 610497, 703122, 805841, 919362, 1044417, 1181762, 1332177, 1496466, 1675457, 1870002, 2080977, 2309282, 2555841, 2821602, 3107538, 3414643, 3743938, 4096467, 4825827, 6334243, 9829506, 19741695, 55806787, 91871879, 127936971, 164002063, 200067155, 236132247, 272197339, 308262431, 344327523, 380392615, 416457707, 452522799, 488587891, 524652983, 560718075, 596783167, 632848259, 668913351, 704978443, 741043535, 777108627, 813173719, 849238811, 885303903, 921368995, 957434087, 993499179, 1029564271, 1065629363, 1101694455, 1137759547, 1173824639, 1209889731, 1245954823, 1282019915, 1318085007, 1354150099, 1390215191, 1426280283, 1462345375, 1498410467, 1534475559, 1570540651, 1606605743, 1642670835, 1678735927, 1714801019, 1750866111, 1786931203, 1822996295, 1859061387];
export function expPercent(level, exp) {
    if (!level || level >= 99) return 0;
    const a = EXP[level - 1], b = EXP[level];
    return Math.max(0, Math.min(100, (exp - a) / (b - a) * 100));
}
// 魔防＝職業基本＋精神加成＋等級/2＋裝備（L1PcInstance.resetBaseMr、CalcStat.calcStatMr；伺服器只送裝備那段 S_SPMR）
const MR_CLASS = [10, 0, 25, 15, 10, 18, 20];
function wisMr(w) {
    if (w <= 14) return 0; if (w <= 16) return 3;
    const t = { 17: 6, 18: 10, 19: 15, 20: 21, 21: 28, 22: 37, 23: 47 }; if (t[w] != null) return t[w];
    if (w <= 29) return 50; if (w <= 34) return 52; if (w <= 39) return 55; if (w <= 43) return 59; if (w <= 46) return 62; if (w <= 49) return 64; return 65;
}
export function totalMr(st) { const v = realStat(st, 16); return v != null ? v : (MR_CLASS[st.type] || 0) + wisMr(st.wis || 0) + Math.floor((st.level || 0) / 2) + (st.mrBonus || 0); }   // 伺服器送了實際魔防（S_Web 22）就用它的

// 魔法書：各職業學得到的一般魔法階數（C_ItemUSe.useSpellBook：騎士 1、王族／黑暗妖精 1～2、妖精 1～6、法師 1～10），
//   職業魔法＝skills 表的 skill_level（騎士 11～12、黑暗妖精 13～14、王族 15、妖精 17～22）
const GEN_MAX = [2, 1, 6, 10, 2];
const CLS_LV = [[15], [11, 12], [17, 18, 19, 20, 21, 22], [], [13, 14]];
// 紙娃娃：左右各一排、中間留給人物（站長 2026-10-17 晚）；同一列左右對到身體同一個高度：頭→脖子／肩→身體→手→腰→腳，最下一列放箭和娃娃。
//   3.50c 耳環 1 個、戒指 2 個（C_ItemUSe.UseArmor）
// 右邊第 7 格（戒指下面、娃娃上面）＝榮耀卡片（站長 2026-10-24「箭的位子不變，卡片改這裡」：有榮耀封號就放那張卡，點了開榮耀卡；伺服器第 166 項）
const DOLL_L = ['helm', 'amulet', 'armor', 'wpn', 'gloves', 'belt', 'boots', 'arrow'];
const DOLL_R = ['ear', 'cloak', 'tshirt', 'shield', 'ring1', 'ring2', 'doll'];   // 站長 2026-11-01「移除卡片欄位」：榮耀卡片只在背包（左右各 7 格）
// 箭格只有拿弓才有（站長 2026-10-20：拿劍的箭格也顯示背包裡的箭，看起來像裝在身上）：伺服器 L1Attack 只有武器 type1 20
//   （道具表 bow、singlebow；沙哈之弓也算，背包有箭照樣射箭、扣箭）才拿箭（getArrow）。鐵手甲（gauntlet，type1 62）拿的是飛刀（getSting），
//   網頁沒有飛刀格 → 跟拿劍一樣不顯示。不顯示＝那格整個空著（同右排第 7 格），不留「箭」字，左右兩排照樣對齊
const ARROW_WPN = new Set(['bow', 'singlebow']);
const SLOT_NAME = { helm: '頭盔', ear: '耳環', amulet: '項鍊', gloves: '手套', cloak: '斗篷', tshirt: 'T恤', wpn: '武器', shield: '盾牌', armor: '盔甲',
    ring1: '戒指', ring2: '戒指', belt: '腰帶', boots: '長靴', doll: '娃娃', arrow: '箭', card: '卡片' };

// 站長 2026-11-02「手機版快捷鍵不用顯示 F 多少」：只有觸控、沒有滑鼠（手機、平板）
const touchOnly = () => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; } };
// 智力減少 MP（同伺服器 L1SkillUse.isHPMPConsume 的「MPのINT軽減」「騎士智力減免」；站長 2026-11-08 玩家「法師竟然沒有 MP 消耗減免」→「魔法說明加入魔力減免多少」）：
//   法師魔法（編號 9～80）：編號過 8／16／23／32／40／48／56、智力過 12～18 各少 1 點（約等於 min(智力−12, 階數−1)，最多 7）；
//   騎士魔法（87～91）：智力 13～17 少（智力−12），18 以上少 5 再照公式多減；最少扣 1。頭盔減半、創角原始智力的減免網頁不知道，不算
export function mpCut(sid, mp, int) {
    if (!mp || !int) return 0;
    let c = 0;
    if (sid > 8 && sid <= 80) [8, 16, 23, 32, 40, 48, 56].forEach((t, k) => { if (sid > t && int > 12 + k) c++; });
    else if (sid >= 87 && sid <= 91 && int > 12) {
        if (int <= 17) c = int - 12;
        else { c = 5; if (mp - 5 > 1) for (let first = 1, range = 2; first <= int - 17; first += range, range++) c++; }
    }
    return Math.max(0, Math.min(c, mp - 1));
}

export function createHud(root, cb) {
    let hot = '';
    for (let i = 0; i < 12; i++) hot += '<button type="button" class="lmui-slot ' + (i < 6 ? 'r1' : 'r2') + '" data-i="' + i + '"><span class="fk">F' + (i + 1) + '</span></button>';
    hot += '<button type="button" id="lmui-hotmode" aria-label="切換快捷列"></button>';
    root.insertAdjacentHTML('beforeend',
        '<div id="lmui-hud">' +
          '<div id="lmui-tl">' +
            '<div id="lmui-face"><div class="pic lmui-hit" role="button" aria-label="裝備"><img alt=""></div><span id="lmui-align"><b>0</b></span></div>' +
            '<div id="lmui-stats">' +
              '<div class="row"><span id="lmui-name"></span></div>' +
              '<div class="row"><span><span class="k">防禦</span><b id="lmui-ac"></b></span><span><span class="k">魔防</span><b id="lmui-mr"></b></span></div>' +
              '<div class="row"><span id="lmui-gold"><span class="k">' + goldIcon() + '</span><b></b></span></div>' +
            '</div>' +
          '</div>' +
          '<div id="lmui-who" class="lmui-hit"><div id="lmui-ptbar" hidden></div><button type="button" id="lmui-whobtn" aria-expanded="true" hidden><b>管理員</b><span>0</span><i aria-hidden="true">▾</i></button><div id="lmui-wholist" hidden></div></div>' +
          '<div id="lmui-status"></div>' +
          '<div class="afk-tm-mm lmui-hit"><canvas width="256" height="192"></canvas><i aria-hidden="true">' + MAP_SVG + '</i><button type="button" class="mm-drops" data-mmdrops="1">本區掉寶</button></div>' +
          '<div id="lmui-lower">' +
            // 系統、掉落訊息浮在快捷列上方（右下那排鈕再上面），左邊一顆收折鈕；這一列本身不佔高度
            '<div id="lmui-flt"><div class="list" aria-live="polite"></div><button type="button" class="tg lmui-hit"></button></div>' +
            // 右下一排（快捷列上面、跟 ⊞ 同一側）：掛機紀錄（一直都在，紀錄不自動跳，玩家自己點來看）、AUTO、⊞ 功能鈕；這一列本身不佔高度
            '<div id="lmui-vit">' +
              '<button type="button" id="lmui-skbtn" class="lmui-hit" aria-label="功能">' + FN_SVG + '</button>' +
              '<button type="button" id="lmui-huntbtn" class="lmui-hit">掛機紀錄</button>' +
              // 強制攻擊（手機；站長 2026-10-19「手機版新增強制攻擊鍵」）：⊞ 正上方，觸控裝置才顯示（lmui.css）；亮著時點玩家、寵物、NPC＝強制攻擊
              '<button type="button" id="lmui-force" class="lmui-hit" aria-label="強制攻擊" aria-pressed="false"><img src="/cursor/sword.png" alt=""><span>強制</span></button>' +
              // 推廣鈕（站長 2026-11-08「推廣按鍵先放這比較顯眼，等開服完回原本的位子」）：強制鈕正上方；開服後拿掉（開服清單），回到設定 → 系統、推廣大使
              // 原本這裡是回主城鈕（第 126 項）；2026-10-24 拿掉（站長「原本右邊的主城按鈕移除」），改成 20 級發的道具「主城傳送石」（伺服器第 157 項）
              '<div id="lmui-bars"><button type="button" id="lmui-auto" class="lmui-hit off" data-as="' + AUTO_STYLE + '" aria-label="AUTO">' + AUTO_SVG + '</button><span id="lmui-astate" role="status" hidden></span></div>' +
            '</div>' +
            // 下方一直在（由上到下）：AUTO → 快捷列 → 龍頭帶 → 聊天視窗；彈出視窗不會蓋到快捷列以下
            '<div id="lmui-hot" data-mode="0">' + hot + '</div>' +
            // 用戶端 431 上緣那條裝飾帶，緊貼聊天視窗上緣：左端小龍｜左段橫條＝體力｜龍頭｜右段橫條＝魔力｜右端小龍
            //   條：底＝431 原本的暗色管子、i＝上了色的那段（照 --r 從外側往龍頭裁）、span＝數字
            //   地名（說話之島（一般區域））在龍頭帶正上方、貼著血條；地名右邊＝夥伴列（寵物、召喚、迷魅、精靈、造屍，一隻一格）
            '<div id="lmui-band"><div id="lmui-mapline"><div id="lmui-mapname"><b></b><em id="lmui-zone"></em></div><div id="lmui-comp"></div></div>' +
              '<i class="bl"></i><div id="lmui-hp" class="lmui-bar"><i></i><span></span></div><i class="bd"></i>' +
              '<div id="lmui-mp" class="lmui-bar"><i></i><span></span></div><i class="br"></i></div>' +
            // 聊天視窗（分頁、訊息、輸入列）；高度三段（▲／工具列「聊天」切換）
            '<div id="lmui-bottom">' +
              '<div id="lmui-chat">' +
                '<div id="lmui-tabs"><div class="row"><button type="button" class="more" data-t="size" aria-label="聊天框高度">▲</button>' +
                  [['all', '全部'], ['say', '一般'], ['party', '隊伍'], ['clan', '血盟'], ['world', '世界'], ['drop', '掉落'], ['sys', '系統']].map(c => '<button type="button" data-t="' + c[0] + '">' + c[1] + '</button>').join('') + '</div></div>' +
                '<div id="lmui-linesbox"><div id="lmui-lines"></div>' +
                  '<div id="lmui-sb"><button type="button" class="up" aria-label="往上捲"></button><div class="trk"><i></i></div><button type="button" class="dn" aria-label="往下捲"></button></div></div>' +
                '<div id="lmui-input"><select id="lmui-ch" aria-label="頻道">' + CHANNELS.map(c => '<option value="' + c[0] + '">' + c[1] + '</option>').join('') + '</select>' +
                  '<input id="lmui-wto" type="text" maxlength="16" autocomplete="off" enterkeyhint="next" placeholder="名字" aria-label="密語對象" hidden>' +
                  '<input id="lmui-say" type="text" maxlength="60" autocomplete="off" enterkeyhint="send" placeholder="輸入訊息"><button type="button" id="lmui-send">發送</button></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div id="lmui-win" class="hidden"><div id="lmui-whead"><b></b><button type="button" aria-label="關閉">✕</button></div><div id="lmui-wtabs" class="lm-tabs"></div><div id="lmui-wbody"></div></div>' +
        '<div id="m-nav"><div id="lmui-nav">' + TOOLS.map(t => '<button type="button" class="lmui-tool" data-tool="' + t.id + '"><span>' + t.name + '</span></button>').join('') +
          '<div id="lmui-exp"><i></i><span class="lv"><em>等級</em><b></b></span><span class="pc"></span></div></div></div>' +
        '<div id="lmui-toast"></div>');

    const el = {};
    ['ac', 'mr', 'gold', 'name', 'align', 'hp', 'mp', 'exp', 'mapname', 'zone', 'lines', 'tabs', 'say', 'ch', 'win', 'hot', 'hotmode', 'toast', 'skbtn'].forEach(k => { el[k] = $('lmui-' + k); });
    // 中間提示搬到 body：留在 #game（fixed、自成疊放層）裡，z-index 130 比不過 body 底下的彈出視窗（娃娃 120…）→ 開著視窗時提示被蓋住看不到
    if (el.toast) document.body.appendChild(el.toast);
    el.face = root.querySelector('#lmui-face img');
    el.mm = root.querySelector('.afk-tm-mm');
    el.mmCanvas = el.mm.querySelector('canvas');
    pcInit();   // 電腦介面（pcui.js）：面板左欄、主選單鈕提示
    const frameScan = watchFrames();   // 彈出視窗外框右邊捲軸上的捲動鈕
    let state = {}, cur = '', chatTab = 'all', lines = [], toastT = 0, winTab = '', fromFace = false;
    let chatOwner = '', chatLogT = 0;   // 聊天紀錄留到下次（chatLogLoad／chatLogSave）
    // 電腦介面右邊那個視窗的變數（平常存在這裡，要動右邊時跟上面那些對調；見 swapSide）
    const alt = { cur: '', winTab: '', fromFace: false, pending: null, settingsSig: '', battleSig: '', win: null, body: null };
    let swapped = false;

    // ── 右上角狀態圖示（同單機版 #status-icon-bar：從右往左排、28px、剩 10 秒閃＋圖上倒數；說明框見 paintStip）──
    //   資料：伺服器 S_Web 種類 10（web/WebStatus，有增減、時間被刷新才送），main.js 換成 [{ id, name, icon, end }]（end＝到期的 performance.now()，-1＝沒時限），這裡自己倒數
    //   最多三行（到小地圖上緣為止），左邊讓開頭像數值區（名字長短會變，每次量）
    let effects = [], effSig = '', stipFor = null;
    el.status = $('lmui-status');
    const stip = document.createElement('div'); stip.id = 'lmui-stip'; document.body.appendChild(stip);
    const effLeft = x => x.end < 0 ? -1 : Math.ceil((x.end - performance.now()) / 1000);
    function setEffects(list) { effects = list; paintEffects(); }
    function paintEffects() {
        effects = effects.filter(x => x.end < 0 || effLeft(x) > 0);   // 到期：伺服器也會送新清單，這裡先拿掉
        const bar = el.status, tl = srect($('lmui-tl')), hud = srect($('lmui-hud'));
        const maxW = Math.max(62, Math.min(hud.width * 0.62, hud.right - tl.right - 12));
        bar.style.maxWidth = maxW + 'px';
        // 放不下就縮小圖示（28→16px），全部擠進同一塊（高 88px＝原本三行）：原本多的直接被切掉，又因為照編號排，藥水、料理這些後面的最先不見
        let sz = 28;
        while (sz > 16 && Math.ceil(effects.length / Math.max(1, Math.floor((maxW + 2) / (sz + 2)))) * (sz + 2) - 2 > 88) sz -= 2;
        bar.style.setProperty('--st', sz + 'px');
        //   圖示也算進簽名（站長 2026-10-29「魔法圖示沒載好」：剛進遊戲圖示表還沒到＝先畫成文字，之後種類沒變就一直不重畫）
        const sig = effects.map(x => x.id + ':' + (x.icon || '')).join(',');
        if (sig !== effSig) {   // 種類變了才重畫（圖不會一直重新載入而閃）
            effSig = sig;
            //   frame（誘捕：道具圖）＝外面加狀態圖示那種深色框、圖照原色（同 .cut）
            bar.innerHTML = effects.map(x => '<div class="lmui-st lmui-hit' + (x.frame ? ' framed' : '') + '" data-id="' + x.id + '">' +
                (x.icon ? '<img alt="" src="' + esc(x.icon) + '"' + (x.icon.startsWith('/state-icons/') || x.frame ? ' class="cut"' : '') + ' draggable="false">' : '<span class="nm">' + esc(x.name.slice(0, 2)) + '</span>') + '</div>').join('');
        }
        for (const x of effects) {
            const c = bar.querySelector('.lmui-st[data-id="' + x.id + '"]'); if (!c) continue;
            const s = effLeft(x), ending = s >= 0 && s <= 10;
            c.classList.toggle('ending', ending);
            let cd = c.querySelector('.cd');
            if (ending) { if (!cd) { cd = document.createElement('span'); cd.className = 'cd'; c.appendChild(cd); } if (cd.textContent !== String(s)) cd.textContent = s; }
            else if (cd) cd.remove();
        }
        paintStip();
    }
    // 說明框（站長 2026-10-23「電腦比過去顯示該圖示能力，手機也一樣」）：名稱、效果（effects.js effectDesc，一句一行）、剩餘時間（每秒跟著倒數）
    //   電腦：滑鼠移到圖示上就出現、移開就收；點一下＝釘住（移開不收，點別的地方或再點一次才收）
    //   手機：點一下出現，點別的地方（含地圖）或再點同一個收起；這排圖示原本點了只跳名字和秒數，沒有別的功能 → 不衝突
    //   位置：圖示正下方、右緣對齊圖示，左右夾在畫面內；下面放不下就改放圖示上面
    const fmtLeft = s => s < 60 ? s + ' 秒' : s < 3600 ? Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒' : Math.floor(s / 3600) + ' 小時 ' + Math.floor(s % 3600 / 60) + ' 分';
    let stipBy = '', stipKey = '';
    //   同一個說明框也給畫面上其他「移上去／點一下看說明」的字用（AUX_TIP）：元素帶 data-stip="鍵"，stipFor＝那個鍵（字串；狀態圖示是數字編號）。
    //   內容每次畫的時候現算（能力頁一直重畫，元素會換新，照 data-stip 重找）；看不到（視窗關了）＝收起；tm＝最下面那行灰字
    const AUX_TIP = {
        bless: () => { const b = blessStat(state, equipped()), pc = v => +v.toFixed(1) + '%';
            return { id: 'bless', name: '祝福值', end: -1, desc: ['祝福值提高對惡魔、不死、頭目的抗性。', '穿 1 件以上祝福裝備：被打到有「祝福值」% 機率傷害減少 25%（最高 60%）。', '穿 6 件以上：牠們的魔法有「祝福值 ÷ 5」% 機率閃掉（最高 15%）。', '對頭目兩個機率都減半。'],
                tm: '目前：減傷機率 ' + pc(b.dr) + '（頭目 ' + pc(b.drBoss) + '）、魔法閃避 ' + pc(b.ev) + '（頭目 ' + pc(b.evBoss) + '）' }; },
    };
    function paintStip() {
        const aux = typeof stipFor === 'string' && AUX_TIP[stipFor] ? AUX_TIP[stipFor]() : null;
        const x = aux || (stipFor != null ? effects.find(e => e.id === stipFor) : null);
        const c = aux ? document.querySelector('[data-stip="' + stipFor + '"]') : x && el.status.querySelector('.lmui-st[data-id="' + x.id + '"]');
        if (!c || !c.getClientRects().length) { stipFor = null; stipBy = ''; stipKey = ''; stip.style.display = 'none'; return; }
        const desc = x.desc || effectDesc(x.id, state), key = x.id + '|' + x.name + '|' + desc.join('|') + '|' + (x.tm || '');
        if (key !== stipKey) {   // 換了效果才重排（倒數只換時間那一行）
            stipKey = key;
            stip.innerHTML = '<div class="sh">' + (x.icon ? '<i' + (x.frame ? ' class="framed"' : '') + '><img alt="" src="' + esc(x.icon) + '"></i>' : '') + '<b>' + esc(x.name) + '</b></div>' +
                (desc.length ? '<ul>' + desc.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') + '<div class="tm"></div>';
        }
        const s = effLeft(x), tm = stip.querySelector('.tm'), tt = aux ? aux.tm || '' : s >= 0 ? '剩餘 ' + fmtLeft(s) : '';
        if (tm.textContent !== tt) tm.textContent = tt;
        tm.hidden = !tt;
        stip.style.display = 'block';
        const r = srect(c), w = stip.offsetWidth, h = stip.offsetHeight;
        stip.style.top = Math.round(r.bottom + 6 + h > vh() - 6 ? Math.max(6, r.top - 6 - h) : r.bottom + 6) + 'px';
        stip.style.left = Math.round(Math.max(6, Math.min(vw() - w - 6, r.right - w))) + 'px';
    }
    setInterval(() => { if (!document.hidden && (effects.length || stipFor != null)) paintEffects(); }, 500);   // 切走時不畫（main.js 切走只留連線）
    const stOf = e => e.target.closest && e.target.closest('#lmui-status .lmui-st');
    // 圖示編號：伺服器的效果是數字；網頁自己加的那幾格是字（doll 魔法娃娃、build 主城建設）——原本一律轉數字，字的變 NaN、點了不出說明（站長 2026-10-26「魔法娃娃 建設圖示點了沒顯示能力加成」）
    const stId = c => { const v = c.getAttribute('data-id'); return /^-?\d+$/.test(v) ? +v : v; };
    el.status.addEventListener('pointerover', e => {   // 電腦滑過去
        if (e.pointerType !== 'mouse') return;
        const c = stOf(e), id = c ? stId(c) : null;
        if (stipBy === 'tap' && (id == null || id === stipFor)) return;
        if (id == null) { if (stipBy === 'hover') { stipFor = null; paintStip(); } return; }
        stipFor = id; stipBy = 'hover'; paintStip();
    });
    el.status.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && stipBy === 'hover') { stipFor = null; paintStip(); } });
    el.status.addEventListener('click', e => {
        const c = stOf(e); if (!c) return;
        const id = stId(c);
        if (stipFor === id && stipBy === 'tap') { stipFor = null; paintStip(); return; }   // 再點一次同一個＝收起
        stipFor = id; stipBy = 'tap'; paintStip();
    });
    document.addEventListener('pointerdown', e => { if (stipBy === 'tap' && !stOf(e) && !auxOf(e)) { stipFor = null; paintStip(); } }, true);   // 點別的地方＝收起
    // AUX_TIP（data-stip）：電腦滑過去出現、移開收；點一下釘住、再點一次收；手機點一下出現、點別的地方或再點一次收（同狀態圖示）
    const auxOf = e => e.target.closest && e.target.closest('[data-stip]');
    document.addEventListener('pointerover', e => {
        if (e.pointerType !== 'mouse') return;
        const a = auxOf(e), k = a && a.getAttribute('data-stip');
        if (k) { if (stipBy === 'tap' && k === stipFor) return; stipFor = k; stipBy = 'hover'; paintStip(); }
        else if (stipBy === 'hover' && typeof stipFor === 'string' && !stOf(e)) { stipFor = null; paintStip(); }   // 狀態圖示自己的字編號（doll、build）不算
    });
    document.addEventListener('click', e => {
        const a = auxOf(e); if (!a) return;
        const k = a.getAttribute('data-stip');
        if (stipFor === k && stipBy === 'tap') stipFor = null; else { stipFor = k; stipBy = 'tap'; }
        paintStip();
    });

    // 有新版本／更新紀錄（update.js）：開頁就開始看版本；彈出視窗一次一個，遊戲中下緣停在龍頭帶上面
    const upd = createUpdater({ beforeOpen: () => closeAll(), beforeReload: () => { if (cb.beforeReload) cb.beforeReload(); }, inGame: () => !!$('lmui-band').offsetParent });
    upd.watch();

    // ── 系統、掉落訊息浮在快捷列上方（站長 2026-10-17）：透明底、描邊字，一則一行、新的在下面往上推，最多 FLT_MAX 行，FLT_MS 後淡出。
    //   聊天框「系統」分頁照樣全部留著；收折鈕收起來＝不浮（記在這台裝置）；開著彈出視窗時不浮（視窗蓋住那塊）
    const flt = $('lmui-flt'), fltList = flt.querySelector('.list'), fltBtn = flt.querySelector('.tg');
    const fltOff = () => { try { return localStorage.getItem(FLT_KEY) === '1'; } catch (e) { return false; } };
    function syncFlt() { const off = fltOff(); flt.classList.toggle('off', off); fltBtn.textContent = '訊息' + (off ? '▴' : '▾'); fltBtn.setAttribute('aria-pressed', off ? 'false' : 'true'); }
    fltBtn.addEventListener('click', () => { const off = !fltOff(); try { localStorage.setItem(FLT_KEY, off ? '1' : '0'); } catch (e) { /* 無痕 */ } if (off) fltList.textContent = ''; syncFlt(); });
    syncFlt();
    let lastFlt = { text: '', t: 0 };
    // 新手任務完成的特效放的時候（tutorial.js，cb.holdFloats）：浮著的先藏、新來的先排著，放完再浮（不跟特效的字疊在一起；排著的照樣浮滿 FLT_MS）
    let fltHold = false;
    const fltWait = [];
    function holdFloats(on) {
        on = !!on;
        if (fltHold === on) return;
        fltHold = on;
        fltList.classList.toggle('held', on);
        if (!on) for (const [t, c] of fltWait.splice(0)) floatMsg(t, c);
    }
    function floatMsg(text, cls, cat) {
        // 開著彈出視窗（娃娃、背包…）時聊天框、浮動訊息都藏起來 → 系統訊息改用中間的提示，不然在視窗裡按了沒反應又看不到原因（站長 2026-10-23 娃娃「魔法結晶體不足」看不到）
        // 戰鬥中的提示（點選目標、太遠了…，cat＝'must'；站長 2026-10-24「距離太遠、點選目標會擋住畫面」）：浮不上來（開著視窗、浮動訊息收起來）就退回中間的提示，不能整句不見。
        //   剛關掉視窗（hud.closeAll）時 body.lmui-cover 要等 MutationObserver 才拿掉 → 先對一次
        if (cat === 'must') { try { syncCover(); } catch (e) { /* 還沒初始化 */ } }
        if (document.body.classList.contains('lmui-cover')) { if (cat === 'sys' || cat === 'must') toast(text); return; }
        if (fltOff()) { if (cat === 'must') toast(text); return; }
        if (fltHold) { fltWait.push([text, cls]); if (fltWait.length > FLT_MAX) fltWait.shift(); lastFlt = { text, t: performance.now() }; return; }
        const d = document.createElement('div'); d.className = cls || ''; d.textContent = text;
        fltList.appendChild(d);
        while (fltList.children.length > FLT_MAX) fltList.firstChild.remove();
        setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, FLT_MS);
        lastFlt = { text, t: performance.now() };
    }

    // ── 提示 ──
    function toast(msg) {
        if (msg === lastFlt.text && performance.now() - lastFlt.t < 500) return;   // 剛浮上來同一句：不再跳一次
        setTxt(el.toast, msg); el.toast.classList.add('on');
        clearTimeout(toastT); toastT = setTimeout(() => el.toast.classList.remove('on'), 1800);
    }
    const soon = () => toast('這個系統還沒完成');
    // 電腦版：滑鼠中鍵點夥伴格、隊員欄＝滾輪選中的快捷格對他用（站長 2026-10-23；main.js midUseId）。中鍵不要變成瀏覽器的自動捲動
    function midOn(box, sel, who) {
        box.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
        box.addEventListener('pointerdown', e => {
            if (e.button !== 1 || e.pointerType !== 'mouse' || !isPc() || !cb.midUse) return;
            const b = e.target.closest(sel); if (!b) return;
            e.preventDefault(); e.stopPropagation();
            const [id, name] = who(b); if (id) cb.midUse(id, name);
        });
    }
    // 蓋在畫面上的小視窗（功能選單裡的掉寶、快捷格選單、道具視窗）：點外面或 ✕ 關
    function overlay(id, inner) {
        const old = $(id); if (old) old.remove();
        const ov = document.createElement('div'); ov.id = id; ov.className = 'lmui-ov'; ov.innerHTML = inner;
        ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-x]')) ov.remove(); });
        document.body.appendChild(ov);
        return ov;
    }

    // ── 小地圖：三段（第 324 項，站長 2026-10-27「點一下展開原本樣式 再點一下放大地圖 再點一下縮小去小按鈕」）：
    //   小按鈕 → 原本大小 → 放大 → 小按鈕…（記在這台裝置；MM_KEY 原本只有 '1' 收起／'0' 展開，加 '2' 放大，舊值照讀）
    //   放大＝框加倍、畫布也加倍（world.drawMinimap 照畫布大小決定看多大範圍）
    const mmMode = () => { let v = null; try { v = localStorage.getItem(MM_KEY); } catch (e) { /* 無痕 */ } return v === '1' ? 'off' : v === '2' ? 'big' : 'norm'; };
    const applyMm = m => {
        el.mm.classList.toggle('off', m === 'off'); el.mm.classList.toggle('big', m === 'big');
        const w = m === 'big' ? 768 : 256, h = m === 'big' ? 576 : 192;   // 站長 2026-11-03「地圖全開狀態再大一點」：放大版 768×576
        if (el.mmCanvas.width !== w) { el.mmCanvas.width = w; el.mmCanvas.height = h; }
    };
    applyMm(mmMode());
    el.mm.querySelector('[data-mmdrops]').addEventListener('click', e => { e.stopPropagation(); showMapDrops(); });   // 小地圖展開時框框底下那顆：本區掉寶（點了不切換小地圖）
    el.mm.addEventListener('click', e => {
        if (mmMode() === 'big' && cb.minimapTap && cb.minimapTap(e)) return;   // 站長 2026-11-03：放大版點到傳送點名稱＝自動走過去，不切換大小
        const m = { off: 'norm', norm: 'big', big: 'off' }[mmMode()];
        applyMm(m); try { localStorage.setItem(MM_KEY, m === 'off' ? '1' : m === 'big' ? '2' : '0'); } catch (e) { /* 無痕 */ }
    });

    // ── 左側線上玩家：點標題收起／展開（記在這台裝置），點名字問過再傳送到他身邊（伺服器判斷能不能傳） ──
    const who = $('lmui-who'), whoBtn = $('lmui-whobtn'), whoList = $('lmui-wholist');
    // 第 353 項（職業實測：手機上名單預設展開，蓋住畫面左邊約 1/3）：沒選過的話手機（窄螢幕或觸控）預設收起
    const whoNarrow = () => { try { return innerWidth < 768 || matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
    const whoOff = () => { try { const v = localStorage.getItem(WHO_KEY); return v == null ? whoNarrow() : v === '1'; } catch (e) { return whoNarrow(); } };
    function applyWho(off) { who.classList.toggle('off', off); whoBtn.setAttribute('aria-expanded', off ? 'false' : 'true'); }
    applyWho(whoOff());
    whoBtn.addEventListener('click', () => { if (cb.openAdmin) { cb.openAdmin(); return; } const off = !who.classList.contains('off'); applyWho(off); try { localStorage.setItem(WHO_KEY, off ? '1' : '0'); } catch (e) { /* 無痕 */ } });
    whoList.addEventListener('click', e => { const b = e.target.closest('[data-pid]'); if (b) toPlayerAsk(+b.getAttribute('data-pid'), b.querySelector('.nm').textContent); });
    // 點名字先問一句（一點就送很容易誤點，大哥 2026-10-20）：確定才送伺服器；外框同其他小確認框（.cl-ov）
    function toPlayerAsk(id, name) {
        const ov = overlay('lmui-tpask', '<div class="box"><div class="hd"><span>傳送</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd"><div class="cl-ask">傳送到 <b>' + esc(name) + '</b> 身邊？</div></div>' +
            '<div class="ft"><button type="button" data-x="1">取消</button><button type="button" data-ok="1">確定</button></div></div>');
        ov.classList.add('cl-ov');
        ov.querySelector('[data-ok]').addEventListener('click', () => { ov.remove(); cb.toPlayer(id); });
    }
    // ── 左側隊員欄（線上名單上面；沒有隊伍不顯示）：職業圖、名字、等級、血條；點了 cb.partyCast（party.js 列能對他放的治癒、輔助魔法）──
    //   線上名單的最大高度扣掉這欄的高度（--lmui-pt-h），不會一起長到地名、聊天框上
    const ptBar = $('lmui-ptbar');
    let ptHtml = '', ptLast = [[], null];
    // 收起／展開（站長 2026-11-07「隊伍視窗可以選擇隱藏彈出按鈕」）：最上面一顆「隊伍 N ▾」，收起來只剩這顆；記在這台裝置
    const PT_FOLD_KEY = 'l1web_ptfold';
    let ptFold = (() => { try { return localStorage.getItem(PT_FOLD_KEY) === '1'; } catch (e) { return false; } })();
    ptBar.addEventListener('click', e => {
        if (e.target.closest('.pt-fold')) { ptFold = !ptFold; try { localStorage.setItem(PT_FOLD_KEY, ptFold ? '1' : '0'); } catch (err) { /* 無痕：這次有效就好 */ } setParty(...ptLast); return; }
        if (e.target.closest('.pt-leave')) { if (cb.party) cb.party.leave(); return; }   // 退出／解散：先跳確認框（party.js doLeave，同分頁最下面那顆）
        if (e.target.closest('.pt-buffbar, .pt-add')) { if (cb.partyBuffPop) cb.partyBuffPop(); return; } const b = e.target.closest('[data-ptid]'); if (b && cb.partyCast) cb.partyCast(+b.getAttribute('data-ptid'));
    });
    midOn(ptBar, '[data-ptid]', b => [+b.getAttribute('data-ptid'), (b.querySelector('.nm') || {}).textContent]);
    // buff（第 513 項）：{ text, on } 隊伍增益在跑的種類＋剩的時間，排在隊員下面一行；沒有＝null
    function setParty(list, buff) {
        ptLast = [list, buff];
        const head = list.length ? '<button type="button" class="pt-fold" aria-expanded="' + !ptFold + '"><b>隊伍</b><span>' + (list.length + 1) + '</span><i aria-hidden="true">▾</i></button>' : '';
        const h = head + (ptFold ? '' : list.map(m => {
            const logo = CLASS_LOGO[m.type] ? '/assets/logo/' + encodeURIComponent(CLASS_LOGO[m.type] + 'logo.png') : '';
            const r = m.hp == null ? null : Math.max(0, Math.min(100, m.hp));
            return '<button type="button" class="pt-side' + (m.leader ? ' lead' : '') + '" data-ptid="' + m.id + '">' + (logo ? '<img src="' + logo + '" alt="' + esc(CLASS_NAME[m.type] || '') + '">' : '<i></i>') +
                '<span class="nm">' + esc(m.name) + '</span><span class="lv">' + (m.level || '') + '</span>' +
                // 站長 2026-11-07「組隊的視窗擋到畫面了」：血條、地區併成第二行（原本各一行），一位隊員兩行高
                '<span class="r2"><span class="hp' + (r == null ? '' : r <= 20 ? ' low' : r <= 50 ? ' mid' : '') + '"><i style="width:' + (r == null ? 0 : r) + '%"></i></span>' +
                (m.mapName ? '<span class="mp">📍' + esc(m.mapName) + '</span>' : '') + '</span></button>';
        }).join('') + (list.length && buff && (buff.items || [buff.text]).length ? '<div class="pt-buffbar' + (buff.on ? ' on' : '') + '">' + (buff.items || [buff.text]).map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
            // 最下面一排：左「＋ 隊伍增益」、右「退出隊伍／解散隊伍」（站長 2026-11-09；兩顆分開、退出小顆紅框靠右，免得點錯）
            (list.length ? '<div class="pt-ft">' + (buff && buff.add ? '<button type="button" class="pt-add">＋ 隊伍增益</button>' : '') +
                '<button type="button" class="pt-leave">' + esc(cb.party ? cb.party.leaveText() : '退出隊伍') + '</button></div>' : ''));
        if (h === ptHtml) return;
        ptHtml = h; ptBar.innerHTML = h; ptBar.hidden = !h;
        who.style.setProperty('--lmui-pt-h', (h ? ptBar.offsetHeight + 4 : 0) + 'px');
    }
    // 第 543 項（站長 2026-11-01「左上的線上玩家移除，移到 GM 帳號的管理清單裡」）：線上名單只有伺服器說你是 GM／管理員帳號（S_Web 254）才顯示，
    //   標題改「GM 管理」、清單第一行標「線上玩家」；一般玩家看不到（名單照收，隊員欄、血盟要用）。隊員欄、加到主畫面鈕同在 #lmui-who，不跟著藏
    // 第 543 項之二（站長 2026-11-01「GM 直接顯示在線人數，不顯示玩家，直接搜尋就好」「新增管理員視窗」）：鈕上只顯示在線人數（含離線掛機），點了開管理員視窗（admin.js）；名單不列
    function setManager(d) { whoBtn.hidden = !d; whoList.hidden = true; if (d) setTxt(whoBtn.querySelector('span'), String((d.online || 0) + (d.afk || 0))); }
    let whoHtml = '';
    function setPlayers(list) {
        list = list.slice().sort((a, b) => b.level - a.level || a.name.localeCompare(b.name, 'zh-Hant'));
        const h = (list.length ? '<div class="lw-hd">線上玩家（點名字傳送）</div>' : '') + list.map(p => {
            const logo = CLASS_LOGO[p.type] ? '/assets/logo/' + encodeURIComponent(CLASS_LOGO[p.type] + 'logo.png') : '';
            return '<button type="button" class="lw-row" data-pid="' + p.id + '"><img src="' + logo + '" alt="' + esc(CLASS_NAME[p.type] || '') + '">' +
                '<span class="nm">' + esc(p.name) + '</span><span class="lv">' + p.level + '</span>' +
                '<span class="mp"><span>' + esc(p.mapName || '') + '</span>' + (p.offline ? '<em>離線</em>' : '') + '</span></button>';
        }).join('');
        if (h !== whoHtml) { whoHtml = h; whoList.innerHTML = h; }
    }

    // ── 夥伴（寵物、召喚、迷魅、精靈、造屍；照單機版 afk-lmui 夥伴列＋js/22 openCompanionPanel）──
    //   伺服器（web/WebCompanions）有變才推清單：一隻一格、下緣血條；點任一格開「夥伴」視窗（一隻一張卡：頭像、Lv、HP／MP、飽食度、態勢、寵物的武器防具、餵食、寄放）
    //   自動喝水、加速的設定 2026-10-20 搬去 設定 → 召喚，2026-10-22 連同自動復活、自動呼叫搬回這裡、每張卡底下（站長「把它融合再一起」，見 cwCfgHtml）；喝水、加速都在伺服器跑
    const COMP_KIND = { 1: ['寵物', null], 2: ['召喚', '召喚術'], 3: ['迷魅', '迷魅術'], 4: ['精靈', '召喚屬性精靈'], 5: ['精靈', '召喚強力屬性精靈'], 6: ['造屍', '造屍術'] };
    const COLLAR = '/assets/icons/items/' + encodeURIComponent('項圈 (牧羊犬).png');   // 單機版站長決定：所有寵物都用牧羊犬項圈
    const POTS = ['紅水', '橙水', '白水'];
    // 原版寵物選單（C_NPCAction 對寵物送的字串；字照用戶端 string-c 的寵物功能選單）：伺服器照原版，一下就換掉主人「全部」寵物、召喚獸的態勢
    //   （寵物等級比主人高、肚子餓的不聽）；現在的態勢＝伺服器夥伴清單的 st，亮起來的那顆
    const MODES = [[1, 'aggressive', '攻擊模式'], [2, 'defensive', '防禦模式'], [3, 'stay', '休息'], [4, 'extend', '散開'], [5, 'alert', '警戒']];
    let comps = [], compCanHaste = false, compBarSig = '', dismissArm = 0, dismissTimer = 0;
    const picUrl = new Map();   // 頭像：單機版動作圖網址 → 裁好的 dataURL（'' ＝沒圖，用種類圖示）
    const compIcon = c => c.kind === 1 ? COLLAR : (cb.skillIcon(COMP_KIND[c.kind] ? COMP_KIND[c.kind][1] : '召喚術') || COLLAR);
    const cpct = (v, m) => m > 0 ? Math.max(0, Math.min(100, Math.round(v * 100 / m))) : 0;
    const compBar = $('lmui-comp');
    function setCompanions(d) {
        comps = d.list; compCanHaste = d.canHaste;
        const sig = comps.map(c => c.id + ':' + c.kind + ':' + cpct(c.hp, c.mhp)).join(',');
        if (sig !== compBarSig) {
            compBarSig = sig;
            compBar.innerHTML = comps.map(c => '<button type="button" class="lmui-cp" data-id="' + c.id + '" aria-label="' + esc((COMP_KIND[c.kind] || ['夥伴'])[0] + ' ' + c.name) + '">' +
                '<img alt="" src="' + esc(compIcon(c)) + '" draggable="false"><i><b style="width:' + cpct(c.hp, c.mhp) + '%"></b></i></button>').join('');
        }
        gearEcho();
        // 項圈清單（S_Web 11，在身邊／收著／死了）：設定頁、夥伴視窗、寵物保管員開著才要；身邊的寵物變了（叫出來、寄放、死了）馬上要，
        //   只是血量跳的 3 秒最多一次（不然寄放後「收在項圈」那張要等 3 秒才從「在身邊」換過來）
        const petSig = comps.filter(c => c.kind === 1).map(c => c.id + (c.hp > 0 ? '' : 'x')).join(','), moved = petSig !== compPetSig;
        compPetSig = petSig;
        if (wantCollars()) askCollars(moved);
        if ($('lmui-compwin')) renderCompWin();   // 夥伴視窗：血量、態勢、叫出來／寄放
        if (cur === 'automation' && (winTab === '召喚' || winTab === '補給')) renderWin();   // 補給頁自我加速藥水買幾瓶跟著更新
        if (npcUi.keepOpen()) npcUi.petsChanged();   // 寵物保管員：叫出來、寄放了，「領出／寄放」兩邊跟著換
    }
    let compPetSig = '';
    compBar.addEventListener('click', e => { if (e.target.closest('.lmui-cp')) openCompWin(); });
    midOn(compBar, '.lmui-cp', b => { const id = +b.getAttribute('data-id'), c = comps.find(x => x.id === id); return [id, c ? c.name : '']; });
    function openCompWin() {
        const ov = overlay('lmui-compwin', '<div class="box"><div class="hd">夥伴<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="cw-msg" hidden></div><div class="bd"></div></div>');
        const bd = ov.querySelector('.bd');
        bd.addEventListener('click', e => {
            const card = e.target.closest('[data-id]'); if (!card) return;
            const id = +card.getAttribute('data-id'), a = e.target.closest('button[data-a]');
            if (!a) return;
            const k = a.getAttribute('data-a');
            if (k === 'stash') cb.compDismiss(id);
            else if (k === 'wpn' || k === 'arm') cb.compGear(id, k === 'wpn' ? 0 : 1);
            else if (k === 'mode') cb.npcAction(id, a.getAttribute('data-m'));
            else if (k === 'getitem') cb.npcAction(id, 'getitem');   // 寵物身上撿的東西（沒穿著的）交給主人
            else if (k === 'feed') cb.compFeed(id);   // 餵到飽（伺服器用背包的食物、沒有就買；吃飽了、餵不了伺服器自己說）
            else if (k === 'dismiss') {   // 寵物放生（原版 liberate：變回野生、項圈消失）拿不回來：按第二下才送
                clearTimeout(dismissTimer);
                if (dismissArm === id) { dismissArm = 0; cb.npcAction(id, 'dismiss'); }
                else {
                    dismissArm = id; toast('解散後寵物會變回野生、項圈消失；只是要收起來請按「寄放」。');
                    dismissTimer = setTimeout(() => { dismissArm = 0; renderCompWin(); }, 4000);
                }
                renderCompWin();
            }
        });
        bd.addEventListener('change', onCompCfg);   // 喝水、加速、自動復活、自動呼叫、魔力門檻（第 83 項③：從設定 → 召喚 搬過來）
        bd.addEventListener('keydown', e => { e.stopPropagation(); });
        askCollars(true);   // 收在項圈裡的寵物也列（S_Web 11）
        renderCompWin(true);
    }
    // ── 夥伴視窗＋設定（站長 2026-10-22「設定那邊的召喚頁面有寵物界面把它移到…點像圈就會出現的介面…把它融合再一起」，伺服器本機改動第 83 項③）──
    //   叫出來的每隻一張卡（照舊：頭像、HP／MP、飽食度、態勢、武器防具、餵食／收集／寄放／解散），卡底下接原本設定頁那張卡的設定：
    //   體力低於 N% 時喝紅／橙／白水或主人的治癒魔法、自動加速（綠水／加速術）；寵物再多自動復活（復活卷軸／返生術）、自動呼叫。
    //   寵物的設定照項圈存（C_Web 8-7）、自動復活／呼叫存在 AUTO 設定的 pets（C_Web 3），所以叫出來的寵物要對到項圈清單（S_Web 11）的那一筆：
    //   伺服器 S_Web 8 尾端帶項圈編號（第 83 項③）就照編號，舊伺服器照名字＋等級＋血量上限，只有一筆對得上才算（對不到的設定照叫出來的夥伴存、項圈那筆留在下面）。
    //   召喚物（召喚、迷魅、精靈、造屍）照叫出來的夥伴存（C_Web 8-1），沒有復活／呼叫。
    //   下面「收在項圈」：背包裡沒叫出來（或死了、對不到）的寵物，同一套設定。最底下：魔力低於幾 % 不用魔法補夥伴（有學治癒魔法才有）
    function collarOf(c, used) {
        if (c.kind !== 1 || !petExt) return null;
        if (c.collar) return petCols.find(p => p.collar === c.collar) || null;
        const m = petCols.filter(p => p.state !== 0 && !used.has(p.collar) && p.name === c.name && p.lv === c.lv && p.mhp === c.mhp);
        return m.length === 1 ? m[0] : null;
    }
    // 一張卡的設定（欄位名同設定頁的卡：data-cp 喝水／加速、data-pr／pm／ps 自動復活／怎麼復活／自動呼叫，cardVals 照讀）；collar＝這隻寵物的項圈（0＝召喚物、對不到）
    function cwCfgHtml(c, collar, s, heals, res) {
        const opt = (v, t, on) => '<option value="' + v + '"' + (on ? ' selected' : '') + '>' + t + '</option>';
        const chk = (attr, on, t) => '<label class="cw-chk"><input type="checkbox" ' + attr + (on ? ' checked' : '') + '><span>' + t + '</span></label>';
        let h = '<div class="cw-cfg"><div class="cw-cfg-row"><span>體力低於</span><input type="number" inputmode="numeric" data-cp="pct" min="0" max="99" value="' + (c.pct || 0) + '" aria-label="體力低於幾 %">' +
            '<span>% 時</span><select data-cp="pot" aria-label="用什麼補">' + POTS.map((p, i) => opt('p' + i, '喝' + p, !c.heal && i === c.pot)).join('') +
            heals.map(x => opt('h' + x.sid, esc(x.name), c.heal === x.sid)).join('') + '</select></div><div class="cw-cfg-row">' +
            // 伺服器第 589 項：每隻自己選——綠水（自我加速藥水）／強化綠水／加速術（會加速術才列）
            '<span class="cw-opt">' + chk('data-cp="green"', c.green, '自動加速') + '<select data-cp="gmode" aria-label="怎麼加速">' + opt(0, '綠水', !c.gmode || (c.gmode === 1 && !compCanHaste)) + opt(2, '強化綠水', c.gmode === 2) + (compCanHaste ? opt(1, '加速術', c.gmode === 1) : '') + '</select></span>';
        if (collar && s) {
            const p = s.pets.find(x => x.collar === collar) || { revive: false, mode: 1, summon: false };
            h += '<span class="cw-opt">' + chk('data-pr="1"', p.revive, '自動復活') + (res ? '<select data-pm="1" aria-label="怎麼復活">' + opt(1, '復活卷軸', p.mode === 1) + (asSkills().learned.has(61) ? opt(0, '返生術', p.mode === 0) : '') + (asSkills().learned.has(75) ? opt(2, '終極返生術', p.mode === 2 || (p.mode === 0 && !asSkills().learned.has(61))) : '') + '</select>' : '') + '</span>' +
                chk('data-ps="1"', p.summon, '自動呼叫');
        }
        return h + '</div></div>';
    }
    const REVIVE_PAUSE = 33554432;   // 伺服器第 464 項：AUTO 設定旗標「寵物連續死亡 3 次，停 10 分鐘再復活」
    const PET_BREATH = 67108864;   // 伺服器第 477 項：AUTO 設定旗標「水中幫寵物用伊娃的祝福」
    function onCompCfg(e) {
        const t = e.target;
        if (t.hasAttribute('data-cf')) {   // 第 464 項：AUTO 設定的旗標（只動這一個位元，其他照伺服器給的送回去）
            const s = cb.autoSettings && cb.autoSettings(); if (!s || !cb.saveAutoSettings) return;
            const bit = +t.getAttribute('data-cf');
            cb.saveAutoSettings(Object.assign({}, s, { flags: t.checked ? (s.flags | bit) : (s.flags & ~bit) }));
            return;
        }
        if (t.hasAttribute('data-cm')) {   // 魔力低於幾 % 不用魔法補夥伴（AUTO 設定）
            const s = cb.autoSettings && cb.autoSettings(); if (!s || !cb.saveAutoSettings) return;
            cb.saveAutoSettings(Object.assign({}, s, { petMpPct: Math.max(0, Math.min(100, Math.floor(+t.value) || 0)) }));
            return;
        }
        const card = t.closest('.cw-card'); if (!card) return;
        const collar = +card.getAttribute('data-pcol') || 0, id = +card.getAttribute('data-id') || 0;
        if (t.hasAttribute('data-cp')) {   // 喝水、加速：寵物照項圈存（收著的也行），召喚物、對不到項圈的照叫出來的夥伴存
            if (collar && petExt) petCardSave(card);
            else { const c = comps.find(x => x.id === id); if (c) cb.compSettings(id, cardVals(card, c)); }
            return;
        }
        if (collar && (t.hasAttribute('data-pr') || t.hasAttribute('data-pm') || t.hasAttribute('data-ps'))) {   // 自動復活、自動呼叫：AUTO 設定的 pets，兩個都沒勾＝拿掉那筆
            const s0 = cb.autoSettings && cb.autoSettings(); if (!s0 || !cb.saveAutoSettings) return;
            const m = card.querySelector('[data-pm]'), revive = card.querySelector('[data-pr]').checked, summon = card.querySelector('[data-ps]').checked;
            const s = Object.assign({}, s0, { pets: s0.pets.filter(p => p.collar !== collar) });
            if (revive || summon) s.pets.push({ collar, revive, mode: m ? +m.value : 1, summon });
            cb.saveAutoSettings(s);
        }
    }
    // 召喚、迷魅還剩多少時間（站長 2026-10-22「迷魅、召喚的怪物在夥伴視窗那裡需要顯示剩餘多少時間」，伺服器本機改動第 96 項：S_Web 8 尾端的秒數 → c.endAt）：
    //   名字旁「剩 mm:ss」（一小時以上 h:mm:ss），每秒自己倒數（cwTick 只改字、不重畫），每次收到清單照伺服器的重新對；剩 1 分鐘內紅字。寵物、舊伺服器沒有 endAt＝不顯示
    const cwLeftTxt = end => { const t = Math.max(0, Math.ceil((end - performance.now()) / 1000)), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60, p2 = v => (v < 10 ? '0' : '') + v;
        return '剩 ' + (h ? h + ':' + p2(m) : p2(m)) + ':' + p2(s); };
    const cwLeftHtml = c => c.endAt ? '<span class="cw-left' + (c.endAt - performance.now() <= 60000 ? ' low' : '') + '" data-end="' + Math.round(c.endAt) + '">' + cwLeftTxt(c.endAt) + '</span>' : '';
    setInterval(() => {
        const ov = $('lmui-compwin'); if (!ov) return;
        ov.querySelectorAll('.cw-left[data-end]').forEach(e => { const end = +e.getAttribute('data-end'); e.textContent = cwLeftTxt(end); e.classList.toggle('low', end - performance.now() <= 60000); });
    }, 1000);
    let compWinSig = '', compWinLater = null;
    function renderCompWin(force) {
        const ov = $('lmui-compwin'); if (!ov) return;
        const bd = ov.querySelector('.bd');
        const s = cb.autoSettings ? cb.autoSettings() : null, k = asSkills();
        const heals = k.sks.filter(x => (x.type & 16) || x.sid === 158), res = k.learned.has(61) || k.learned.has(75);
        const sig = JSON.stringify([comps, dismissArm, petCols, petExt, s && s.pets, s && s.petMpPct, s && s.v12 && (s.flags & REVIVE_PAUSE), s && s.v14 && (s.flags & PET_BREATH), heals.map(x => x.sid), res, compCanHaste]);
        if (!force && sig === compWinSig) return;
        // 正在打 % 數、正在選下拉：先不畫（血量一跳就重畫會把輸入框洗掉），離開那一格再補畫（同設定頁 settingsLater）
        const a = document.activeElement;
        if (!force && a && bd.contains(a) && (a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'checkbox'))) {
            if (!compWinLater) {
                const h = compWinLater = ev => {
                    if (ev.relatedTarget && bd.contains(ev.relatedTarget)) return;
                    bd.removeEventListener('focusout', h); compWinLater = null;
                    setTimeout(() => renderCompWin(), 200);
                };
                bd.addEventListener('focusout', h);
            }
            return;
        }
        compWinSig = sig;
        const top = bd.scrollTop;
        const bar = (v, m, cls) => '<div class="cw-bar ' + cls + '"><i style="width:' + cpct(v, m) + '%"></i><span>' + (cls === 'mp' ? 'MP ' : 'HP ') + Math.max(0, v) + ' / ' + m + '</span></div>';
        const used = new Set();
        let h = comps.map(c => {
            const kind = COMP_KIND[c.kind] || ['夥伴'], pic = cb.portrait ? cb.portrait(c.gfx, c.tname || c.name) : null;
            const col = collarOf(c, used); if (col) used.add(col.collar);
            const gear = c.kind === 1
                ? '<span class="cw-gear"><button type="button" class="cw-btn' + (c.wpn ? ' on' : '') + '" data-a="wpn">武器：' + esc(c.wpn || '無') + '</button><button type="button" class="cw-btn' + (c.arm ? ' on' : '') + '" data-a="arm">防具：' + esc(c.arm || '無') + '</button></span>'
                : '';
            return '<div class="cw-card" data-id="' + c.id + '"' + (col ? ' data-pcol="' + col.collar + '"' : '') + '>' +
                '<div class="cw-top"><span class="cw-pic">' + (pic && picUrl.get(pic) ? '<img alt="" src="' + esc(picUrl.get(pic)) + '" class="pic" draggable="false">'
                  : '<img alt="" src="' + esc(compIcon(c)) + '" class="ic"' + (pic && !picUrl.has(pic) ? ' data-pic="' + esc(pic) + '"' : '') + ' draggable="false">') + '</span><div class="cw-main">' +
                  '<div class="cw-name"><b>' + esc(c.name) + '</b><em>Lv.' + c.lv + '</em>' + cwLeftHtml(c) + '<small>' + kind[0] + '</small></div>' + bar(c.hp, c.mhp, 'hp') + (c.mmp > 0 ? bar(c.mp, c.mmp, 'mp') : '') +
                  // 飽食度（寵物；伺服器 S_Web 8 尾端，舊伺服器沒有＝不顯示）：低於 50 換警告色
                  (c.food != null ? '<div class="cw-bar food' + (c.food < 50 ? ' low' : '') + '"><i style="width:' + Math.max(0, Math.min(100, c.food)) + '%"></i><span>飽食度 ' + c.food + ' / 100</span></div>' : '') +
                  // 經驗（寵物；伺服器第 626 項，站長 2026-11-03「寵物介面新增可以看到寵物的經驗值」；舊伺服器沒送＝不顯示）
                  (c.exp != null ? '<div class="cw-bar exp"><i style="width:' + Math.max(0, Math.min(100, c.exp)) + '%"></i><span>經驗 ' + c.exp + '%</span></div>' : '') + '</div></div>' +
                '<div class="cw-mode">' + MODES.map(([n, a, t]) => '<button type="button" class="cw-btn' + (c.st === n ? ' on' : '') + '" data-a="mode" data-m="' + a + '" aria-pressed="' + (c.st === n) + '">' + t + '</button>').join('') + '</div>' +
                // 收集、解散（放生）只有寵物有；召喚類的解散就是「寄放」
                '<div class="cw-acts">' + gear + '<span class="cw-cmd">' + (c.food != null ? '<button type="button" class="cw-btn" data-a="feed">餵食</button>' : '') +
                  (c.kind === 1 ? '<button type="button" class="cw-btn" data-a="getitem">收集</button>' : '') +
                  '<button type="button" class="cw-btn" data-a="stash">寄放</button>' +
                  (c.kind === 1 ? '<button type="button" class="cw-btn' + (dismissArm === c.id ? ' danger' : '') + '" data-a="dismiss">' + (dismissArm === c.id ? '確定解散' : '解散') + '</button>' : '') + '</span></div>' +
                cwCfgHtml(col || c, col ? col.collar : 0, s, heals, res) + '</div>';
        }).join('');
        // 收在項圈裡的（背包裡有、沒叫出來；死了、對不到的也在這）：頭像、名字、狀態、HP＋同一套設定
        const kept = petExt ? petCols.filter(p => !used.has(p.collar)) : [];
        if (kept.length) {
            h += (comps.length ? '<div class="cw-sec">收在項圈</div>' : '') + kept.map(p => '<div class="cw-card cw-kept" data-pcol="' + p.collar + '"><div class="cw-top"><span class="cw-pic">' +
                petPicHtml(p.gfx, p.tname || p.name) + '</span><div class="cw-main"><div class="cw-name"><b>' + esc(p.name) + '</b><em>Lv.' + p.lv + '</em><small' + (p.state === 2 ? ' class="dead"' : '') + '>' +
                (PET_STATE[p.state] || '') + '</small></div>' + bar(p.hp, p.mhp, 'hp') + '</div></div>' + cwCfgHtml(p, p.collar, s, heals, res) + '</div>').join('');
        }
        if (h) {
            if (heals.length && s) h += '<div class="cw-foot"><span>魔力低於</span><input type="number" inputmode="numeric" data-cm="petMpPct" min="0" max="100" value="' + (s.petMpPct || 0) + '" aria-label="魔力低於幾 %">' +
                '<span>% 時不用魔法補夥伴</span></div>';
            // 伺服器第 464 項（站長 2026-10-30「在寵物頁面那邊設定一個 連續死亡3才過10分鐘再復活」）：AUTO 設定的旗標 REVIVE_PAUSE（預設勾）；
            //   有寵物（項圈）、伺服器認得（v12）才列。沒勾＝每次都自動復活（救不起來不扣、不重試照舊，伺服器第 462 項）
            if (s && s.v12 && petExt && petCols.length) h += '<div class="cw-foot"><label class="cw-chk"><input type="checkbox" data-cf="' + REVIVE_PAUSE + '"' + (s.flags & REVIVE_PAUSE ? ' checked' : '') +
                '><span>連續死亡 3 次，停 10 分鐘再復活</span></label></div>';
            // 伺服器第 477 項（站長 2026-10-30「寵物要多一個伊娃的祝福可以打勾，寵物在海底也是需要呼吸」）：AUTO 設定的旗標 PET_BREATH（預設勾）；
            //   有寵物（項圈）、伺服器認得（v14）才列。寵物在水中、沒有水中呼吸或快到期時從背包用一個，沒有會自動買；沒勾＝寵物在水中照角色那樣一直扣血
            //   伺服器第 559 項（站長 2026-11-01「寵物改成不能進入海底，寵物視窗也不需要自動喝伊娃的祝福了」）：寵物進不了海底了，這格不列
            const sea = false;
            if (sea) h += '<div class="cw-foot"><label class="cw-chk"><input type="checkbox" data-cf="' + PET_BREATH + '"' + (s.flags & PET_BREATH ? ' checked' : '') +
                '><span>水中幫寵物用伊娃的祝福</span></label></div>';
            h += '<div class="cw-note">' + (petExt ? '0% 不補，掛機沒開也會。自動復活用復活卷軸' + (sea ? '、水中用伊娃的祝福' : '') + '，沒有會自動買；自動呼叫在每次進遊戲時叫出來。' : '0% 不補，掛機沒開也會。') + '</div>';
        }
        bd.innerHTML = h || '<div class="cw-empty">' + (petExt === null ? '讀取中…' : '身邊沒有夥伴。') + '</div>';
        bd.scrollTop = top;
        trimPics(bd);
    }
    // 寵物裝備（照單機版 js/22 petGearOpen）：點「武器」「防具」→ 伺服器回背包裡這一格能穿的 → 視窗「杜賓狗：寵物武器」、「目前：○○／（無）」，
    //   穿著的話第一列是「卸下」，下面背包裡能穿的一件一列 → 點一件穿上（伺服器 WebCompanions：換下來的回主人背包）
    //   穿上／卸下後伺服器會馬上重送夥伴清單：那隻的武器／防具變了就在聊天（系統）寫一句「杜賓狗 裝上了 勝利之牙。」（同單機版；舊伺服器也一樣，網頁自己比）；
    //   夥伴視窗開著時聊天、提示都被視窗蓋住 → 同一句也寫在夥伴視窗標題下面，幾秒後收起
    let gearPend = null, cwMsgT = 0;   // gearPend：{ id, slot, before, off, at }
    function compGear(d) {
        const what = d.slot === 0 ? '武器' : '防具', c = comps.find(x => x.id === d.id);
        const ov = overlay('lmui-compgear', '<div class="box"><div class="hd">' + (c ? esc(c.name) + '：' : '') + '寵物' + what + '<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            '<div class="cg-cur">目前：<b>' + (d.cur ? esc(d.cur) : '（無）') + '</b></div><div class="grid">' +
            (d.cur ? '<button type="button" class="opt cg-off" data-off="1"><span>卸下 ' + esc(d.cur) + '</span></button>' : '') +
            d.items.map(x => '<button type="button" class="opt" data-it="' + x.id + '"><img alt="" src="' + esc(cb.itemIcon({ name: x.name, gfx: x.gfx })) + '"><span>' + esc(x.name) + '</span></button>').join('') +
            '</div>' + (d.items.length ? '' : '<div class="cw-empty">背包沒有寵物能用的' + what + '，可以到亞丁找諾斯製作。</div>') + '</div></div>');
        ov.addEventListener('click', e => {
            const b = e.target.closest('.opt'); if (!b) return;
            const off = b.hasAttribute('data-off');
            gearPend = { id: d.id, slot: d.slot, before: c ? (d.slot === 0 ? c.wpn : c.arm) || '' : d.cur || '', off, at: performance.now() };
            if (off) cb.compUnequip(d.id, d.slot); else cb.compEquip(d.id, +b.getAttribute('data-it'));
            ov.remove();
        });
    }
    // 夥伴清單更新時：剛按的穿上／卸下有結果了就寫一句（3 秒內沒變＝伺服器沒換，不寫；換成同名同強化的看不出來，也不寫）
    function gearEcho() {
        const p = gearPend; if (!p) return;
        if (performance.now() - p.at > 3000) { gearPend = null; return; }
        const c = comps.find(x => x.id === p.id); if (!c) return;
        const now = (p.slot === 0 ? c.wpn : c.arm) || '';
        if (now === p.before) return;
        gearPend = null;
        const t = now && !p.off ? c.name + ' 裝上了 ' + now + '。' : !now && p.before ? c.name + ' 卸下了 ' + p.before + '。' : '';
        if (!t) return;
        chat(t, 'sys', 'c-pet');
        const m = document.querySelector('#lmui-compwin .cw-msg');
        if (!m) { toast(t); return; }
        m.textContent = t; m.hidden = false;
        clearTimeout(cwMsgT); cwMsgT = setTimeout(() => { m.hidden = true; }, 5000);
    }

    // ── 功能鈕（右下 ⊞）：鈕旁彈出小選單（製作工匠、信箱、交易所、排行榜、掉寶），點選單外面就收起（同單機版 toggleFnMenu） ──
    function closeFnMenu(instant) {
        const m = $('lmui-fnmenu'); el.skbtn.classList.remove('open'); document.body.classList.remove('lmui-fn-open');
        if (!m) return;
        if (instant || m.classList.contains('closing')) { m.remove(); return; }
        m.classList.add('closing'); setTimeout(() => m.remove(), 140);
    }
    // 信箱（mail.js，第 110 項）有要處理的信：選單上的「信箱」掛紅點＋數字（⊞ 鈕上的那顆 main.js 掛）
    //   交易所有東西可領：選單上的「交易所」也掛（cb.marketBadge；⊞ 鈕上的是兩個合計）
    // 遊樂場（⊞ 選單）：小遊戲一個一張卡，點了開那個遊戲；之後的新遊戲加在 FUN_GAMES
    const FUN_GAMES = [{ id: 'dig', name: '寶藏挖掘', sub: '買藏寶圖一格一格挖，每格都有獎', open: () => cb.treasureOpen && cb.treasureOpen() }];
    function openFun() {
        const ov = document.createElement('div'); ov.id = 'lmui-fun'; ov.className = 'lmui-ov';
        ov.innerHTML = '<div class="box"><div class="hd"><span>遊樂場</span><button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            FUN_GAMES.map(g => '<button type="button" class="fun-g" data-g="' + g.id + '"><span class="fun-ic"><img src="/icon/1780.png" alt=""></span><span class="fun-tx"><b>' + esc(g.name) + '</b><small>' + esc(g.sub) + '</small></span><i>›</i></button>').join('') + '</div></div>';
        ov.addEventListener('click', e => {
            if (e.target === ov || e.target.closest('[data-x]')) { ov.remove(); return; }
            const b = e.target.closest('[data-g]'); if (!b) return;
            const g = FUN_GAMES.find(x => x.id === b.getAttribute('data-g')); ov.remove(); if (g) g.open();
        });
        document.body.appendChild(ov);
    }
    const fnBadge = k => { const n = k === 'mail' && cb.mailBadge ? cb.mailBadge() : k === 'trade' && cb.marketBadge ? cb.marketBadge() : 0; return n > 0 ? '<b class="ml-badge">' + (n > 99 ? '99+' : n) + '</b>' : ''; };
    el.skbtn.addEventListener('click', e => {
        e.stopPropagation();
        const m = $('lmui-fnmenu');
        if (m && !m.classList.contains('closing')) { closeFnMenu(); return; }
        if (m) m.remove();
        el.skbtn.classList.add('open'); document.body.classList.add('lmui-fn-open');   // 選單蓋在小地圖上面（lmui.css）
        const menu = document.createElement('div'); menu.id = 'lmui-fnmenu'; menu.className = 'lmui-hit';
        // 站長 2026-11-02「商城跟交易所 20 等之後再顯示」（伺服器第 598 項也擋）
        const lv20 = (state.level || 0) >= 20;
        menu.innerHTML = FN_ITEMS.filter(([k]) => (k !== 'shop' || !(cb.shopHidden && cb.shopHidden())) && (k !== 'doll' || (cb.dollReady && cb.dollReady())) && (lv20 || (k !== 'shop' && k !== 'trade'))).map(([k, n]) => '<button type="button" data-k="' + k + '"' + (k === 'shop' ? ' class="fn-shine"' : '') + '>' + FN_ICO[k] + '<span>' + n + '</span>' + fnBadge(k) + '</button>').join('') +
            '<button type="button" class="l35-x" aria-label="關閉"></button>';   // 外框右上角的 Close 牌子
        menu.addEventListener('click', ev => {
            if (ev.target.closest('.l35-x')) { ev.stopPropagation(); closeFnMenu(); return; }
            const b = ev.target.closest('button[data-k]'); if (!b) return;
            ev.stopPropagation(); closeFnMenu(true);
            const k = b.getAttribute('data-k');
            if (k === 'shop') { closeAll(); if (cb.openShop) cb.openShop(); } else if (k === 'drops') showMapDrops(); else if (k === 'craft') { closeAll(); craft.open(); } else if (k === 'doll') { closeAll(); cb.dollOpen(); } else if (k === 'rank') { closeAll(); cb.rankOpen(); } else if (k === 'fun') { closeAll(); openFun(); } else if (k === 'trade' && cb.marketOpen) { closeAll(); cb.marketOpen(); } else if (k === 'mail' && cb.mailOpen) { closeAll(); cb.mailOpen(); } else soon();
        });
        el.skbtn.parentNode.appendChild(menu);
    });
    document.addEventListener('click', e => { if (!e.target.closest || e.target.closest('#lmui-fnmenu') || e.target.closest('#lmui-skbtn')) return; closeFnMenu(); }, true);

    // 掉寶：這張地圖的怪物與掉落（伺服器 spawnlist × droplist，機率照 DropTable；同單機版 showMapDrops 的版面）
    function fmtRate(r) {
        if (!isFinite(r)) return '—';
        if (r >= 100) return '100%';
        if (r >= 1) return (Math.round(r * 10) / 10) + '%';
        return parseFloat(r.toPrecision(2)) + '%';
    }
    async function showMapDrops() {
        if (cb.onMapDrops) cb.onMapDrops();   // 新版新手引導第 5 步：打開過掉寶（tutorial.js 告訴伺服器）
        const d = await cb.mapDrops();
        const stat = (k, v) => '<span><i>' + k + '</i><b>' + esc(v) + '</b></span>';
        const rg = (a, b) => (b != null && b !== a ? a + '～' + b : a);   // 第 389 項：隨機等級的怪寫範圍（drops.json lv2／hp2／ac2／exp2）
        const html = (d.mobs || []).map((m, mi) => {
            const rows = m.d.length ? m.d.map((x, di) => {
                const icon = cb.itemIcon({ name: x.base || x.name, nid: x.nid });   // 祝福的：圖示照本名找
                return '<div class="mi-drop" role="button" tabindex="0" data-md="' + mi + ',' + di + '"><img src="' + esc(icon || '') + '" alt="" onerror="this.style.visibility=\'hidden\'"><span class="nm' + (x.b ? nameCls(0) : '') + '">' + esc(x.name) +
                    (x.max > 1 ? ' ×' + (x.min === x.max ? x.max : x.min + '～' + x.max) : '') + '</span><span class="rt">' + fmtRate(x.rate) + '</span></div>';
            }).join('') : '<div class="mi-none">' + (m.into ? '倒下後變成「' + esc(m.into) + '」' : '沒有掉落物') + '</div>';   // into：會變身的怪（main.js mapDrops）
            // 種族（drops.json u＝npc.undead）：1、3 不死（銀、祝福武器加傷）、2 惡魔（祝福武器加傷）
            const race = m.u === 2 ? '<span class="mi-race demon">惡魔</span>' : m.u === 1 || m.u === 3 ? '<span class="mi-race undead">不死</span>' : '';
            // 站長 2026-10-31「怪物資訊旁著名大怪還是小怪、硬皮等」（drops.json sz／hd／w／ag，gen-data）：大型／小型、硬皮、弱點屬性、主動攻擊
            const tags = '<span class="mi-tag' + (m.sz ? ' big' : '') + '">' + (m.sz ? '大型' : '小型') + '</span>' + (m.hd ? '<span class="mi-tag hard">硬皮</span>' : '') +
                [[1, '地'], [2, '火'], [4, '水'], [8, '風']].filter(([b]) => (m.w || 0) & b).map(([, t]) => '<span class="mi-tag weak">弱' + t + '</span>').join('') +
                (m.ag ? '<span class="mi-tag agro">主動</span>' : '');
            return '<div class="md-mob"><div class="mi-hd"><span class="mi-name">' + esc(m.n) + '</span>' + race + tags + '<span class="mi-lv">Lv.' + rg(m.lv, m.lv2) + '</span></div>' +
                '<div class="mi-stats">' + stat('HP', rg(m.hp, m.hp2)) + stat('攻擊', Math.floor(m.atk != null ? m.atk : (m.lv || 1) * 0.9)) + stat('防禦', rg(m.ac, m.ac2)) + stat('魔防', m.mr) + stat('經驗', rg(m.exp, m.exp2)) + stat('金幣', m.gold ? m.gold[0] + '~' + m.gold[1] : '0') + '</div>' + rows + '</div>';
        }).join('');
        const ov = overlay('lmui-mapdrops', '<div class="box"><div class="hd">' + esc(d.title) + '<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd">' + (html || '<div class="mi-none" style="text-align:center;padding:24px 0;">這裡沒有怪物。</div>') + '</div></div>');
        // 點一樣掉落物＝道具資訊（站長 2026-10-25「點擊觀看掉寶機率時，可以點選道具看這樣道具的資訊」；同製作工匠的 iteminfo.js）
        ov.addEventListener('click', e => {
            const r = e.target.closest('[data-md]'); if (!r) return;
            const [mi, di] = r.getAttribute('data-md').split(',').map(Number), x = d.mobs[mi] && d.mobs[mi].d[di]; if (!x) return;
            itemInfo.open(infoItem({ name: x.base || x.name, nid: x.nid, bless: x.b ? 0 : 1 }));
        });
    }

    // ── 快捷列：F1~F6 → F7~F12 → 兩排；格子放什麼照角色名存在這台裝置（介面偏好，不是存檔） ──
    const hotMode = () => { try { const m = +localStorage.getItem(HOT_KEY); return m === 1 || m === 2 ? m : 0; } catch (e) { return 0; } };
    function applyHot() {
        const m = hotMode();
        el.hot.setAttribute('data-mode', m);
        el.hotmode.innerHTML = '<b>▾</b>' + (m === 0 ? '1~6' : m === 1 ? '7~12' : '兩排');
    }
    applyHot();
    el.hotmode.addEventListener('click', () => { try { localStorage.setItem(HOT_KEY, String((hotMode() + 1) % 3)); } catch (e) { /* 無痕 */ } applyHot(); });
    let hotSlots = new Array(12).fill(null), hotOwner = '';
    function hotLoad(name) {
        hotOwner = name || '';
        hotSlots = new Array(12).fill(null);
        try { const a = JSON.parse(localStorage.getItem(HOT_SLOTS_KEY + hotOwner) || '[]'); if (Array.isArray(a)) a.slice(0, 12).forEach((v, i) => { hotSlots[i] = v || null; }); } catch (e) { /* 壞掉就空的 */ }
        renderHot();
    }
    function hotSave() { if (!hotOwner) return; try { localStorage.setItem(HOT_SLOTS_KEY + hotOwner, JSON.stringify(hotSlots)); } catch (e) { /* 無痕 */ } }
    const parsedItems = () => (cb.items ? cb.items() : []).map(parseItem);
    // 魔杖（道具表 type wand：烏木魔杖＝閃電魔杖、松木、楓木、驅逐…）剩幾次（站長 2026-10-22「閃電魔杖改成可以重疊，重疊後會顯示剩餘可使用的次數」）：
    //   伺服器第 89 項起閃電魔杖可以疊、數量＝次數（名字尾巴也是「(數量)」）；其他魔杖、舊伺服器的閃電魔杖一支一格，名字尾巴「(N)」是那一支的次數。不是魔杖回 0
    const wandUses = p => { if (!(p.tpl && p.tpl.type === 'wand')) return 0; const m = /\((\d+)\)\s*$/.exec(p.it.name || ''); return m ? +m[1] : (p.count || 1); };
    // 強化視窗（enhance.js）：入口＝道具視窗的「強化」、背包雙擊強化卷軸
    const enh = createEnhance({ items: parsedItems, icon: p => cb.itemIcon(p), use: (sc, p) => cb.useItem(sc, p), tutorial: () => !!(cb.tutEnh && cb.tutEnh()),
        batch: (sc, goal, ids) => !!(cb.enhBatch && cb.enhBatch(sc.id, goal, ids)) });   // batch：伺服器第 697 項一起強化   // tutorial：新手導覽強化那幾步＝特效照播
    // 製作工匠（craft.js）：入口＝⊞ 選單第一項；清單、製作都走伺服器（main.js 收 S_Web 18／19 轉給 craft.list／done）
    //   商店、製作清單點道具圖示 → 道具資訊（iteminfo.js；跟背包的道具視窗同一套說明＋換裝差值，沒有動作鈕）
    const itemInfo = createItemInfo({ icon: p => cb.itemIcon(p), diff: p => equipDiffOf(p), byId: id => parsedItems().find(x => x.id === id) });
    const TOI_OPEN = true;   // 傲慢之塔圖鑑開放給玩家了沒（站長 2026-10-25 看過效果後先關回未開放；2026-10-26「奧塔圖鑑不是有開」→ 開放，第 293 項）
    const craft = createCraft({ areas: keep => (cb.npcAreas ? cb.npcAreas(keep) : null), request: (id, acts) => cb.craftList(id, acts), make: (id, a, n) => cb.craftMake(id, a, n),
        icon: p => cb.itemIcon(p), items: parsedItems, gold: () => state.gold || 0, info: p => itemInfo.open(p),
        task: () => !!(cb.tutCraft && cb.tutCraft()),
        pass: id => !!(cb.toiPass && cb.toiPass(id)),   // 第 603 項：傲慢之塔傳送符開通了＝格子標「已開通」
        // 「圖鑑」分頁（站長 2026-10-25；傲慢之塔圖鑑的圖示用主城傳送石那張（站長「我要主城那個圖示」）；之後還有傲慢之塔圖鑑、狩獵圖鑑）：目前只有娃娃圖鑑，點了開娃娃視窗的圖鑑頁
        //   站長 2026-10-25「有點單調，能精緻他嗎」「先用奧塔圖鑑（未開放）、狩獵圖鑑（未開放）」：卡片加圖示、百分比；還沒做的灰卡不能點（icon＝道具編號）
        books: () => { const d = cb.dollBook ? cb.dollBook() : null; return [d ? { id: 'doll', name: '娃娃圖鑑', icon: 41246, got: d.got, total: d.total } : { id: 'doll', name: '娃娃圖鑑', icon: 41246, got: 0, total: 0 },
            // 站長 2026-10-25「我看完了，可以改回灰色未開通了」：先不開放給玩家（程式、伺服器都留著；TOI_OPEN 改 true 就開）
            (t => t && TOI_OPEN ? { id: 'tower', name: '傲慢之塔圖鑑', icon: 49900, got: t.got, total: t.total, label: '開通', ready: !!t.ready, shine: true } : { id: 'tower', name: '傲慢之塔圖鑑', icon: 49900, off: true })(cb.toiBook ? cb.toiBook() : null),
            // 第 393 項（站長 2026-10-28 狩獵圖鑑「製作工匠那有狩獵圖鑑放這」）：原本的灰卡開放，點了開狩獵圖鑑視窗（huntdex.js）；進度＝開通幾區
            (h => h ? { id: 'hunt', name: '狩獵圖鑑', icon: 40647, got: h.got, total: h.total, label: '開通', ready: !!h.ready, shine: true } : { id: 'hunt', name: '狩獵圖鑑', icon: 40647, off: true })(cb.huntDex ? cb.huntDex() : null),
            // 第 457 項（站長 2026-10-29 裝備蒐藏）：伺服器送過 S_Web 57 才開放（舊伺服器＝灰卡未開放）；進度＝登錄了幾格；背包有現在就能登錄的＝發光
            (c => c ? { id: 'collect', name: '裝備蒐藏', icon: 20011, got: c.got, total: c.total, label: '登錄', ready: !!c.ready, shine: true } : { id: 'collect', name: '裝備蒐藏', icon: 20011, off: true })(cb.collect ? cb.collect() : null)]; },
        openBook: id => { if (id === 'doll' && cb.dollOpen) { closeAll(); cb.dollOpen('book'); } else if (id === 'tower' && cb.toiOpen) { closeAll(); cb.toiOpen(); } else if (id === 'hunt' && cb.huntOpen) { closeAll(); cb.huntOpen(); } else if (id === 'collect' && cb.collectOpen) { closeAll(); cb.collectOpen(); } } });   // task：新手第 20 步進行中（那步要找的 NPC 暫時放進來）
    const skillList = () => (cb.skills ? cb.skills() : []);
    // 快捷格的道具：同名字碼（nid）、同祝福狀態（b，本機改動第 88 項起才記）——祝福的、一般的瞬間移動卷軸名字碼一樣（$230），
    //   原本放了一種，按下去用的是背包裡排前面的那種（祝福的要跳記憶座標選單，一般的直接隨機瞬移）。舊的格子沒有 b＝照原本哪種都算
    //   名字碼直接寫中文的道具（主城傳送石…，parseItem 的 nid 是空的）：改用道具表的鍵（＝名字）當格子記的 nid，不然放不進快捷格
    const hnid = p => p.nid || (p.tpl ? p.base : '');
    //   武器、盾牌（站長 2026-10-30「武器、盾牌都可以放到快捷鍵，手動玩時切換武器比較方便」）：記那一件的物件編號（oid）——同名不同強化值的分得開
    const hotMatch = (e, p) => e.oid ? p.id === e.oid : hnid(p) === e.nid && (e.b == null || p.bless === e.b);
    //   頭盔（站長 2026-10-31「更改頭盔也可以拉到快捷鍵上面，風之頭盔、力量、敏捷、治癒魔法頭盔也都需要用到」）：同武器、盾牌，按了換上那一頂
    const isGear = p => !!(p && p.tpl && (p.tpl.k === 'w' || (p.tpl.k === 'a' && /^(shield|guarder|helm)$/.test(p.tpl.type))));
    const hotEntry = p => isGear(p) ? { k: 'item', nid: hnid(p), b: p.bless, name: p.full || p.base, oid: p.id } : { k: 'item', nid: hnid(p), b: p.bless, name: p.base };
    // 能放快捷格的道具（選單列的、拖拉能放的都照這個）
    const hotCanItem = p => !!(p && hnid(p) && p.tpl && ((p.tpl.k === 'e' && p.tpl.use !== 'none') || isGear(p)));
    // 主城傳送石預設放一格快捷鍵（站長 2026-10-24）：背包有、快捷列還沒放 → 放進第一個空格（F1→F12）。每個角色只做一次（l1web_hotstone_<角色名> 記著），
    //   之後玩家自己拿掉不再塞回去；沒有空格就不放（也算做過）。快捷列電腦、手機是同一排（#lmui-hot），存在同一份 l1web_hot_<角色名>
    const HS_KEY = 'l1web_hotstone_';
    function hotAutoStone(items) {
        if (!hotOwner) return;
        let done; try { done = localStorage.getItem(HS_KEY + hotOwner) === '1'; } catch (e) { return; }   // 存不了旗標（無痕）就不放，不然每次重整都塞回去
        if (done) return;
        const p = items.find(isHomeStone); if (!p || !hotCanItem(p)) return;   // 還沒拿到背包、道具表還沒載好：下次再看
        if (!hotSlots.some(e => e && e.k === 'item' && hotMatch(e, p))) {
            const i = hotSlots.indexOf(null);
            if (i >= 0) { hotSlots[i] = { k: 'item', nid: hnid(p), b: p.bless, name: p.base }; hotSave(); }
        }
        try { localStorage.setItem(HS_KEY + hotOwner, '1'); } catch (e) { /* 無痕 */ }
    }
    // 快捷格道具圖照「實際畫的部分」縮放（站長 2026-11-01「快捷鍵道具圖怎那麼大」）：單機版的圖（/assets/icons/）有的只畫畫布一半（藥水），
    //   有的整張畫滿（卷軸、箭）→ 原本一律放大 130%，畫滿的就爆出格子。第一次載入時量透明以外的範圍，讓畫的部分都佔格子約七成；量好之前照 CSS 原本的大小
    const HOT_FIT = new Map(), HOT_FIT_ING = new Set();
    //   want＝畫的部分要佔格子幾成：道具 72；魔法圖自己帶一圈方框，88 才跟格子差不多大（站長 2026-11-02「快捷鍵的魔法圖示太大了」：原本沒套，123% 爆出格子）
    function hotFitStyle(src, want = 72) {
        if (!src.startsWith('/assets/icons/')) return '';
        const c = HOT_FIT.get(src);
        if (c) { const f = Math.round(Math.min(130, want / c)); return ' style="width:' + f + '%;height:' + f + '%"'; }
        if (!HOT_FIT_ING.has(src)) {
            HOT_FIT_ING.add(src);
            const im = new Image();
            im.onload = () => {
                try {
                    const w = im.naturalWidth, h = im.naturalHeight, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
                    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
                    const d = cx.getImageData(0, 0, w, h).data; cv.width = 0; cv.height = 0;   // 量完就還（iPhone 畫布上限）
                    let x0 = w, y0 = h, x1 = -1, y1 = -1;
                    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
                    if (x1 < 0) return;
                    const c = Math.max((x1 - x0 + 1) / w, (y1 - y0 + 1) / h);
                    HOT_FIT.set(src, c);   // 存畫的部分佔畫布幾成，縮放照呼叫的 want 算
                    renderHot();
                } catch (e) { /* 量不到就照 CSS */ }
            };
            im.src = src;
        }
        return '';
    }
    function renderHot() {
        const items = parsedItems(), sks = skillList();
        hotAutoStone(items);
        el.hot.querySelectorAll('.lmui-slot').forEach(b => {
            const e = hotSlots[+b.getAttribute('data-i')];
            let h = '<span class="fk">F' + (+b.getAttribute('data-i') + 1) + '</span>';
            if (e && e.k === 'item') {
                const mine = items.filter(p => hotMatch(e, p)), n = mine.reduce((a, p) => a + (wandUses(p) || p.count), 0), base = mine[0] ? mine[0].base : e.name;   // 魔杖算剩幾次
                const ic = cb.itemIcon(mine[0] || { name: base, nid: e.nid });
                const hp = mine[0] || { name: e.nid, bless: e.b };   // 主城傳送石閃亮亮（背包裡沒有了也照格子記的名字認）
                // 站長 2026-11-04「快捷鍵上的祝福道具不會顯示祝福」：光效照背包（items.js glowCls：祝福、屬性、主城傳送石、榮耀卡片）
                const gl = glowCls(hp);
                h += (ic ? '<img alt=""' + (gl ? ' class="' + gl + '"' : '') + ' src="' + esc(ic) + '"' + hotFitStyle(ic) + '>' + hsFx(hp) + flTag(base) : '<span class="nm">' + esc(base || '') + '</span>') + (e.oid ? (mine[0] && mine[0].equipped ? '<span class="cnt eq">E</span>' : '') : '<span class="cnt">' + n.toLocaleString() + '</span>');   // 武器、盾牌：拿著的寫 E
                b.classList.toggle('none', !n);
            } else if (e && e.k === 'skill') {
                const s = sks.find(x => x.sid === e.sid), ic = s && cb.skillIcon(s.name);
                //   魔法圖也照實際畫的部分縮放（站長 2026-11-02「快捷鍵的魔法圖示太大了」：原本沒套，一律 130% 爆出格子）
                h += ic ? '<img alt="" src="' + esc(ic) + '"' + hotFitStyle(ic, 88) + '>' : '<span class="nm">' + esc(s ? s.name : '') + '</span>';
                b.classList.toggle('none', !(s && s.learned));
            } else b.classList.remove('none');
            b.classList.toggle('sk', !!(e && e.k === 'skill'));   // 魔法格：施法冷卻的灰色遮罩蓋在這種格子上（lmui.css）
            if (b.innerHTML !== h) b.innerHTML = h;
        });
        paintHotSel();
    }
    // 施法冷卻（main.js castSent）：全部魔法共用一個鎖 → 一個 CSS 變數 --castcd（還剩幾成，0～1），
    //   快捷列的魔法格、魔法視窗學會的格子都照它蓋一層暗色扇形，從 12 點鐘順時針退掉（樣式在 lmui.css 最後面）
    let castUntil = 0, castTotal = 1, castRaf = 0;
    function setCastLock(until, total) {
        castUntil = until; castTotal = Math.max(1, total);
        if (!castRaf) castRaf = requestAnimationFrame(castTick);
    }
    //   變數設在快捷列、魔法格的容器上，不設在 body：body 的 CSS 變數一變，整頁每個元素都要重算樣式（冷卻中每一幀都是），手機上點魔法、捲魔法視窗會卡
    //   剩幾秒（站長 2026-10-24「顯示魔法延遲倒數」）：--cdtxt 給遮罩中間的字，1 秒以上顯示整數秒（無條件進位），不到 1 秒不顯示字、只剩扇形在退
    //   （大部分魔法只鎖施法動作 0.6～1 秒，小數一直跳反而吵）；字變了才設，不是每一幀都動
    function castTick() {
        const left = castUntil - performance.now(), v = left > 0 ? Math.min(1, left / castTotal).toFixed(3) : '0';
        const txt = left >= 1000 ? '"' + Math.ceil(left / 1000) + '"' : '""';
        for (const e of document.querySelectorAll('#lmui-hot, .lsk2-grid')) {
            e.style.setProperty('--castcd', v);
            if (e.style.getPropertyValue('--cdtxt') !== txt) e.style.setProperty('--cdtxt', txt);
        }
        castRaf = left > 0 ? requestAnimationFrame(castTick) : 0;
    }
    // tap＝手指／滑鼠點格子（鍵盤 F1～F12 不算）：東西用完（顯示 0）點一下就打開「F? 要放什麼？」換別的
    //   （站長 2026-10-19「這個 F1 怎麼更換別的」→ 長按／右鍵才換，玩家不知道）；鍵盤照舊只提示，打怪按 F1 喝水時不要跳選單擋畫面
    // 電腦版：滾輪選快捷格、滑鼠中鍵點目標就用選中的那格（站長 2026-10-22「快捷鍵可以使用滾輪選取…使用滑鼠中鍵點擊目標即可使用」；main.js midUse）。
    //   hotSel＝選中的格子（-1＝還沒選），空格跳過；格子框成金色
    let hotSel = -1;
    function paintHotSel() { if (hotSel >= 0 && !hotSlots[hotSel]) hotSel = -1; el.hot.querySelectorAll('.lmui-slot').forEach(b => b.classList.toggle('sel', +b.getAttribute('data-i') === hotSel)); }
    function hotCycle(d) {
        const base = hotSel >= 0 ? hotSel : d > 0 ? -1 : 0;
        for (let k = 1; k <= 12; k++) { const i = ((base + d * k) % 12 + 12) % 12; if (hotSlots[i]) { hotSel = i; paintHotSel(); return; } }
    }
    // 選中的那格現在是什麼：{ k: 'skill', s }／{ k: 'item', p }／{ k: 'none' }（東西用完、魔法還沒學），都帶 i；沒選＝null
    function hotPicked() {
        const e = hotSel >= 0 ? hotSlots[hotSel] : null; if (!e) return null;
        if (e.k === 'item') { const p = parsedItems().find(x => hotMatch(e, x)); return p ? { k: 'item', p, i: hotSel } : { k: 'none', i: hotSel }; }
        const s = skillList().find(x => x.sid === e.sid);
        return s && s.learned ? { k: 'skill', s, i: hotSel } : { k: 'none', i: hotSel };
    }
    function useSlot(i, tap) {
        const e = hotSlots[i];
        if (!e) { if (tap) openHotPick(i); return; }   // 空格：手機（直式）點了照舊打開選單；F1～F12 什麼都不做（站長 2026-10-23）
        if (e.k === 'item') {
            const p = parsedItems().find(x => hotMatch(e, x));
            if (!p) { if (tap) openHotPick(i); else toast('背包裡沒有了'); return; }
            if (isGear(p) && p.equipped) return;   // 已經拿在手上：不要卸下來（換武器只換上）
            useItemFlow(p);
        } else {
            const s = skillList().find(x => x.sid === e.sid);
            if (!s || !s.learned) { toast('還沒學會這個魔法'); return; }
            cb.castSkill(s, null, true);   // 快捷鍵：鎖定的玩家也直接放（main.js castSkill 的 hot）
        }
    }
    // 點一下＝使用；長按 0.5 秒＝設定這格（同單機版 bindHot）。按著的時候格子下緣一條金色進度（.hold，lmui.css）
    //   電腦版面（站長 2026-10-23「快捷格要長按才會出現選單，空格也一樣」）：短按空格什麼都不做、右鍵也不開選單，只認長按。
    //   直式（手機）照舊：點空格、東西用完的格子打開選單，右鍵（Android 長按）也開
    {
        let pressT = 0, longAt = 0, holdEl = null;
        const holdOff = () => { if (holdEl) { holdEl.classList.remove('hold'); holdEl = null; } };
        el.hot.querySelectorAll('.lmui-slot').forEach(s => {
            const i = +s.getAttribute('data-i');
            // 電腦版：左鍵點格子＝選這格（滾輪、中鍵用的那格），不用；F1～F12 照舊直接用（站長 2026-10-22「滑鼠左鍵點選快捷鍵時可以直接選擇滾輪的切換」）。手機照舊點了就用
            //   要點目標的魔法另外進入準星，接著左鍵點目標就放（main.js armCast；站長 2026-10-24「點滑鼠左鍵也不會施放」）
            // 用手指點的（手機橫放也是電腦版面）：點一下就用，跟直式一樣（站長 2026-11-08「手機介面使用快捷鍵…不需要每次都點擊兩下」）；滑鼠才是「點一下選、點兩下用」
            let byMouse = true;
            s.addEventListener('pointerdown', e => { byMouse = e.pointerType === 'mouse'; }, { passive: true });
            s.addEventListener('click', () => {
                if (Date.now() - longAt < 700) return;
                if (isPc() && byMouse) {
                    const e = hotSlots[i]; if (!e) { openHotPick(i); return; }   // 空格：打開放置選單（站長 2026-10-24「4444 卡住」：新手引導叫你點空格，電腦版原本點了沒反應）
                    hotSel = i; paintHotSel();
                    if (e.k === 'skill' && cb.armCast) { const x = skillList().find(k => k.sid === e.sid); if (x && x.learned) cb.armCast(x); }
                    return;
                }
                useSlot(i, true);
            });
            // 電腦版道具格：左鍵或右鍵點兩下＝直接用（站長 2026-10-24「右鍵點兩下沒反應」）；右鍵點一下照舊開放置選單，道具格等一下確定不是點兩下才開
            let rT = 0;
            const isItem = () => isPc() && hotSlots[i] && hotSlots[i].k === 'item';
            // 魔法格點兩下＝放（同 F1～F12；站長 2026-11-01「電腦點兩點沒反應」「道具可以、魔法的好像不行」）：要選目標的照 castSkill（有鎖定直接放，沒有就進準星）
            s.addEventListener('dblclick', () => { if (byMouse && (isItem() || (isPc() && hotSlots[i] && hotSlots[i].k !== 'item'))) useSlot(i, false); });   // 手指點兩下＝上面 click 已經各用一次，不再多用
            s.addEventListener('contextmenu', e => {
                e.preventDefault(); longAt = Date.now();
                if (!isItem()) { openHotPick(i); return; }
                if (rT) { clearTimeout(rT); rT = 0; useSlot(i, false); return; }
                rT = setTimeout(() => { rT = 0; openHotPick(i); }, 300);
            });   // 右鍵也開放置選單（站長 2026-10-23「保留」；電腦長按 0.5 秒照樣開）
            const start = () => {
                clearTimeout(pressT); holdOff();
                holdEl = s; void s.offsetWidth; s.classList.add('hold');
                pressT = setTimeout(() => { holdOff(); longAt = Date.now(); openHotPick(i); }, 500);
            };
            const stop = () => { clearTimeout(pressT); holdOff(); };
            s.addEventListener('touchstart', start, { passive: true });
            s.addEventListener('mousedown', e => { if (e.button === 0) start(); });
            ['touchend', 'touchmove', 'touchcancel', 'mouseup', 'mouseleave', 'hd-start'].forEach(ev => s.addEventListener(ev, stop, { passive: true }));   // hd-start：電腦版開始拖這格（hotdrag.js）
        });
    }
    // 電腦版拖拉（hotdrag.js）：背包道具、魔法視窗的魔法拖到快捷格＝放進去（存的東西跟下面選單選的一樣）；快捷格互拖＝交換、拖出快捷列＝清掉
    createHotDrag({
        pick(t) {
            if (!t || !t.closest) return null;
            const img = c => { const m = c.querySelector('img'); return m ? m.getAttribute('src') : ''; };
            const hs = t.closest('#lmui-hot .lmui-slot');
            if (hs) { const i = +hs.getAttribute('data-i'); return hotSlots[i] ? { hot: i, icon: img(hs), el: hs } : null; }
            const bc = t.closest('.bag-cell[data-id]:not(.empty)');
            if (bc) {
                const p = parsedItems().find(x => x.id === +bc.getAttribute('data-id')); if (!p) return null;
                return { entry: hotCanItem(p) ? hotEntry(p) : null, icon: img(bc), el: bc };
            }
            const sc = t.closest('.lsk-cell[data-sid]');
            if (sc) { const x = skillList().find(s => s.sid === +sc.getAttribute('data-sid')); return x ? { entry: x.learned ? { k: 'skill', sid: x.sid } : null, icon: img(sc), el: sc } : null; }
            return null;
        },
        started(src) { if (src.hot != null) src.el.dispatchEvent(new Event('hd-start')); },
        put(i, entry) { hotSlots[i] = entry; hotSave(); renderHot(); },
        swap(a, b) { [hotSlots[a], hotSlots[b]] = [hotSlots[b], hotSlots[a]]; if (hotSel === a) hotSel = b; else if (hotSel === b) hotSel = a; hotSave(); renderHot(); },
        clear(i) { hotSlots[i] = null; hotSave(); renderHot(); }
    });
    // 「F? 要放什麼？」：魔法（學會的）／道具（背包裡能用的，同一種只列一次）兩頁
    function openHotPick(i) {
        const cur = hotSlots[i];
        const opt = (k, id, name, icon, extra, on) => '<button type="button" class="opt' + (on ? ' on' : '') + '" data-k="' + k + '" data-id="' + esc(id) + '">' +
            '<img src="' + esc(icon || '') + '" alt="" onerror="this.style.visibility=&quot;hidden&quot;"><span>' + esc(name) + (extra || '') + '</span></button>';
        const sks = skillList().filter(s => s.learned);
        const seen = {}, items = [], hk = p => isGear(p) ? 'o' + p.id : hnid(p) + '|' + p.bless;   // 同一種只列一次（祝福的另外一種，見 hotMatch）；武器、盾牌一件一列
        for (const p of parsedItems()) {
            if (seen[hk(p)] || !hotCanItem(p)) continue;
            seen[hk(p)] = 1; items.push(p);
        }
        const cnt = q => parsedItems().filter(p => hk(p) === hk(q)).reduce((a, p) => a + p.count, 0);
        const ov = overlay('lmui-hotpick', '<div class="box"><div class="hd">' + (touchOnly() ? '第 ' + (i + 1) + ' 格' : 'F' + (i + 1)) + ' 要放什麼？<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="tabs"><button type="button" data-tab="sk" class="on">魔法</button><button type="button" data-tab="it">道具</button></div><div class="bd">' +
            '<div class="grid" data-pane="sk">' + (sks.map(s => opt('skill', s.sid, s.name, cb.skillIcon(s.name), '', cur && cur.k === 'skill' && cur.sid === s.sid)).join('') || '<span class="none">還沒學會魔法</span>') + '</div>' +
            '<div class="grid" data-pane="it" style="display:none">' + (items.map(p => opt('item', hk(p), p.full, cb.itemIcon(p), isGear(p) ? (p.equipped ? '（使用中）' : '') : ' ×' + cnt(p).toLocaleString(), cur && cur.k === 'item' && hotMatch(cur, p))).join('') || '<span class="none">背包沒有可用的道具</span>') + '</div>' +
            '</div><div class="ft"><button type="button" data-clear="1">清空這格</button></div></div>');
        ov.addEventListener('click', e => {
            const tb = e.target.closest('[data-tab]');
            if (tb) {
                const t = tb.getAttribute('data-tab');
                ov.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === tb));
                ov.querySelectorAll('[data-pane]').forEach(x => { x.style.display = x.getAttribute('data-pane') === t ? '' : 'none'; });
                return;
            }
            if (e.target.closest('[data-clear]')) { hotSlots[i] = null; hotSave(); renderHot(); ov.remove(); return; }
            const b = e.target.closest('.opt'); if (!b) return;
            const k = b.getAttribute('data-k'), id = b.getAttribute('data-id');
            const ip = k === 'item' ? items.find(p => hk(p) === id) : null;
            hotSlots[i] = k === 'skill' ? { k, sid: +id } : ip ? hotEntry(ip) : null;
            hotSave(); renderHot(); ov.remove();
        });
        if (cur && cur.k === 'item') ov.querySelector('[data-tab="it"]').click();
    }

    // AUTO：打怪全部在伺服器跑（開著時斷線也繼續打）；按鈕只送開關，亮暗照伺服器回來的狀態
    $('lmui-auto').addEventListener('click', () => cb.autoToggle());
    // AUTO 被試煉儀式（trial.js）或每日簽到（signin.js）蓋住：浮一顆一樣的 AUTO 在最上面（lmui.css #lmui-autofloat，z-index 210：
    //   儀式 200 上面、斷線接回 300 底下），這兩個會自己跳出來的開著也點得到（站長 2026-10-19 實測：登入跳儀式＋簽到，點不到 AUTO，多掛了 78 秒、血掉一半）。
    //   玩家自己打開的視窗（背包、能力、設定、掛機紀錄…）蓋住 AUTO 時不浮：關掉就點得到，浮鈕壓在別的東西上反而礙眼（站長 2026-10-19）。
    //   放哪：AUTO 原本的位置；那裡是儀式、簽到的內容（道具卡、按鈕、簽到格子）就在同一直排往上下找最近一塊整顆都落在暗底上的地方（不蓋內容、點內容不會按到 AUTO）；
    //   找不到就不浮（儀式有「稍後」、簽到有關閉）。
    //   每 0.25 秒看一次：AUTO 中間最上面是儀式、簽到＝被蓋住；浮著的位置還空著就不動，不空了、AUTO 換位置了才重找。亮暗同 setAuto
    const autoFloat = document.createElement('button');
    autoFloat.type = 'button'; autoFloat.id = 'lmui-autofloat'; autoFloat.className = 'off'; autoFloat.dataset.as = AUTO_STYLE; autoFloat.hidden = true;
    autoFloat.setAttribute('aria-label', 'AUTO'); autoFloat.innerHTML = AUTO_SVG;
    autoFloat.addEventListener('click', () => cb.autoToggle());
    for (const ev of ['pointerdown', 'pointerup', 'touchstart']) autoFloat.addEventListener(ev, e => e.stopPropagation(), { passive: true });   // 不穿到底下的視窗、地圖
    document.body.appendChild(autoFloat);
    // 第 448 項（經營者檢查 2026-10-29「試煉畫面 AUTO 鈕浮在遮罩上」）：試煉儀式不浮了——AUTO 開著儀式本來就不自己跳（trial.js held），開著時有「稍後」收起來就點得到 AUTO
    const FLOAT_BY = '#signin-window';   // 蓋住 AUTO 時要浮的：只剩每日簽到
    const FLOAT_BUSY = '.tr-card, .tr-title, .tr-hint, .tr-steps, .tr-msg, .tr-or, button, a, input, select, textarea';   // 儀式裡面算內容的
    const topAt = (x, y) => { for (const e of document.elementsFromPoint(x, y)) if (e !== autoFloat && !autoFloat.contains(e)) return e; return null; };
    // 暗底：簽到視窗外面那層（元素本身；裡面的 .box 是內容）、儀式的背景（不是道具卡、標題、按鈕）
    function backAt(x, y) {
        const e = topAt(x, y);
        return !!e && (e.id === 'signin-window' || (!!e.closest('#trial-rite') && !e.closest(FLOAT_BUSY)));
    }
    // 圓心 (x, y)、半徑 r（螢幕座標）整顆（再往外留 4px）都在暗底上：圓心＋兩圈各 8 個方向
    const RING = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
    function spotFree(x, y, r) {
        const R = r + 4;
        if (x - R < 0 || y - R < 0 || x + R > innerWidth || y + R > innerHeight || !backAt(x, y)) return false;
        return RING.every(p => backAt(x + p[0] * R, y + p[1] * R) && backAt(x + p[0] * R * 0.55, y + p[1] * R * 0.55));
    }
    let floatAt = null, floatFor = '', floatMiss = 0;   // 浮著的圓心 [x, y]（螢幕座標）；那時 AUTO 的位置；上次哪裡都放不下的時間（1 秒內不重找）
    // 同一直排上下找（不左右挪：儀式兩張道具卡中間那種縫，放進去點卡片容易按錯）；找不到＝null
    function findSpot(cx, cy, r) {
        for (let d = 0; d <= 320; d += 8) {
            for (const dy of d ? [-d, d] : [0]) if (spotFree(cx, cy + dy, r)) return [cx, cy + dy];
        }
        return null;
    }
    // 浮著的時候，底下被蓋住、變暗的那顆 AUTO 透明掉（不然看起來兩顆疊在一起；只改 opacity，還是點得到、量得到，蓋住它的東西拿掉就回來）
    function floatShow(on, b) {
        if (autoFloat.hidden === !on) return;
        autoFloat.hidden = !on;
        if (b) b.style.opacity = on ? '0' : '';
    }
    function syncAutoFloat() {
        const b = $('lmui-auto');
        // 簽到視窗沒開＝不會被它蓋住，結果同下面「沒被蓋住」那條；省掉每 0.25 秒量位置、找最上層元素（會逼瀏覽器馬上重排版面，工匠這種大視窗剛換內容時很重）
        if (!document.getElementById('signin-window')) { floatShow(false, b); floatAt = null; return; }
        const q = b && !document.hidden ? b.getBoundingClientRect() : null;
        const t = q && q.width && q.height ? topAt(q.left + q.width / 2, q.top + q.height / 2) : null;
        if (!t || !t.closest(FLOAT_BY)) { floatShow(false, b); floatAt = null; return; }   // 沒被蓋住、被玩家自己開的視窗蓋住（或還沒進遊戲）
        const r = q.width / 2, cx = q.left + r, cy = q.top + q.height / 2, key = Math.round(cx) + ',' + Math.round(cy) + ',' + Math.round(r);
        const ok = floatAt && floatFor === key && spotFree(floatAt[0], floatAt[1], r);
        if (!ok) {
            if (!floatAt && floatFor === key && performance.now() - floatMiss < 1000) return;
            floatAt = findSpot(cx, cy, r); floatFor = key;
            if (!floatAt) { floatShow(false, b); floatMiss = performance.now(); return; }
            const p = sxy(floatAt[0], floatAt[1]), sz = q.width / stageScale();   // 螢幕座標 → 舞台座標（stage.js）
            Object.assign(autoFloat.style, { left: Math.round(p[0] - sz / 2) + 'px', top: Math.round(p[1] - sz / 2) + 'px', width: Math.round(sz) + 'px', height: Math.round(sz) + 'px' });
        }
        floatShow(true, b);
    }
    setInterval(syncAutoFloat, 250);
    // 儀式、簽到加在 body 下：一開一關馬上看（不等 0.25 秒，底下那顆透明掉的才不會慢一拍才回來）
    let floatRaf = 0;
    new MutationObserver(() => { if (!floatRaf) floatRaf = requestAnimationFrame(() => { floatRaf = 0; syncAutoFloat(); }); })
        .observe(document.body, { childList: true, attributes: true, attributeFilter: ['class'] });
    $('lmui-huntbtn').addEventListener('click', () => cb.huntLog());
    // 強制攻擊鈕：按一下亮、再按一下熄（亮著點人點怪都是強制攻擊，走路不會熄；main.js forceToggle）
    $('lmui-force').addEventListener('click', () => { if (cb.forceToggle) cb.forceToggle(); });
    function setForce(on) { const b = $('lmui-force'); b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    startRcol();   // 右側直排方框鈕的位置（商城那支也會叫，重複叫沒關係；原本的主城鈕第 157 項拿掉了）
    // AUTO 目前在做什麼（站長 2026-10-18「喝水喝到沒錢，血量不夠不會打怪，也沒提醒」；伺服器 S_Web 26，main.js 收）：AUTO 鈕正上方一行小字，
    //   卡住的（回血中（沒藥水），st.warn）紅底醒目；AUTO 關著、舊伺服器沒送＝不顯示
    function setAuto(on, st) {
        const tag = $('lmui-astate'), show = !!(on && st && st.text);
        tag.hidden = !show;
        if (show) { if (tag.textContent !== st.text) tag.textContent = st.text; tag.classList.toggle('warn', !!st.warn); }
        $('lmui-auto').classList.toggle('off', !on);
        autoFloat.classList.toggle('off', !on);   // 浮在上面那顆（AUTO 被蓋住時）跟著換
        // 掛機紀錄鈕一直都在（站長 2026-10-19「掛機紀錄不要再彈出來了，給玩家自己點來看就好了」：AUTO 停了、離線回來都不自動跳，要看自己點）
        if (cur === 'automation') renderWin();   // 設定頁每頁上面的「開始／停止掛機」跟著換
    }
    // 掛機紀錄（版面同單機版 #lmui-huntlog＋離線紀錄 afk-history）：這次 AUTO（含離線期間）在哪、殺了幾隻、經驗／金幣（含每 10 分鐘平均）、升了幾級、道具、有沒有死、為什麼停
    //   開著時 AUTO 有變伺服器就推一包（最快 0.5 秒）→ main.js 叫 refreshHuntLog 原地重畫（不關掉重開、捲動位置不動）；「時間」那格網頁自己每秒加 1
    const huntHms = s => { s = Math.max(0, s | 0); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' 小時 ' + m + ' 分' : m ? m + ' 分 ' + (s % 60) + ' 秒' : s + ' 秒'; };
    // 掛機紀錄、離線掛機的金幣格（站長 2026-10-19「實賺」→「這樣好亂，給我總算，然後可以點裡面細項」）：伺服器有明細（net，protocol.js readGoldNet）＝
    //   「實賺」總數（打怪撿到＋自動賣出－自動購買－修理武器；平均也算實賺），有買賣才能點（▸）：點了在那格底下展開明細（每項一行，0 的不列，最後一行實賺），再點收起。
    //   展開與否記在視窗本身（.net-open，netToggle），即時更新只換 .bd 內容，展開狀態不會掉；舊伺服器沒明細＝照舊「金幣」（打怪撿到的）不能點
    function goldStat(stat, gold, net, per10) {
        gold = gold || 0;
        if (!net) return stat('金幣', '+' + gold.toLocaleString(), per10(gold));
        const v = gold + net.sold - net.bought - net.repair, sg = n => (n < 0 ? '-' : '+') + Math.abs(n).toLocaleString(), avg = per10(v), neg = v < 0 ? ' class="neg"' : '';
        if (!(net.sold || net.bought || net.repair)) return '<span><i>實賺</i><b' + neg + '>' + esc(sg(v)) + '</b>' + (avg ? '<small>' + esc(avg) + '</small>' : '') + '</span>';
        const parts = [['撿到', gold], ['賣出', net.sold], ['購買', -net.bought], ['修理', -net.repair]].filter(p => p[1]);
        const row = (k, n, c) => '<div' + (c ? ' class="' + c + '"' : '') + '><i>' + k + '</i><b>' + esc(sg(n)) + '</b></div>';
        return '<span class="mi-gold" data-net="1"><i>實賺</i><b' + neg + '>' + esc(sg(v)) + '<em class="mi-tw"></em></b>' + (avg ? '<small>' + esc(avg) + '</small>' : '') + '</span>' +
            '<div class="mi-netd">' + parts.map(p => row(p[0], p[1])).join('') + row('實賺', v, 'sum' + (v < 0 ? ' neg' : '')) + '</div>';
    }
    // 點「實賺」：展開／收起明細（class 放在視窗上，即時更新重畫 .bd 也保得住）
    function netToggle(ov, e) {
        if (!e.target.closest('[data-net]')) return false;
        ov.classList.toggle('net-open');
        return true;
    }
    function huntBody(g, running) {
        const stat = (k, v, avg, id) => '<span><i>' + k + '</i><b' + (id ? ' data-k="' + id + '"' : '') + '>' + esc(v) + '</b>' + (avg ? '<small>' + esc(avg) + '</small>' : '') + '</span>';
        const per10 = v => g.dur >= 60 ? '平均 ' + Math.round(v * 600 / g.dur).toLocaleString() + ' / 10分' : '';
        const result = running && !g.reason ? '進行中' : g.died ? '被打死了' : (g.reason || '—');
        const map = cb.huntPlaceName ? cb.huntPlaceName(g.map) : cb.mapName ? cb.mapName(g.map) : '';
        return (map ? '<div class="mi-map">📍 ' + esc(map) + '</div>' : '') +
            '<div class="mi-stats">' + stat('時間', huntHms(g.dur), '', 'dur') + stat('其中離線', huntHms(g.offline)) + stat('擊殺', g.kills.toLocaleString()) + stat('升級', g.levels ? '+' + g.levels + ' 級' : '—') +
            stat('經驗', '+' + g.exp.toLocaleString(), per10(g.exp)) + goldStat(stat, g.gold, g.net, per10) + '</div>' +
            // 結果自己一整列（同離線掛機的結束原因）：回村原因很長，放在兩欄裡會把表格撐出框外、手機要左右滑才看得到
            '<div class="mi-why"><i>結果</i><b>' + esc(result) + '</b></div>' +
            // 獲得道具（站長 2026-10-20「改成跟上一次離線掛機的擺置一樣」）：同 showOfflineLog 的標題＋格子（itemGrid）；
            //   祝福／屬性的光效、名字顏色照伺服器 S_Web 3 每件的祝福、屬性
            '<div class="ofl-h">獲得道具</div>' + itemGrid(g.items, '沒有撿到道具') +
            // 用掉的（站長 2026-10-26「掛機紀錄沒顯示用掉的道具」，伺服器第 265 項）：同上次離線掛機的「用掉」
            (g.used ? '<div class="ofl-h">用掉</div>' + itemGrid(g.used, '沒有用掉道具') + petUsedLine(g.petUsed) : '');
    }
    // 伺服器的秒數是捨去的、封包又有延遲：每包算一次「這台的開始時刻」，同一次 AUTO 取最早那個，秒數就不會倒退或卡一下；視窗關了自己停
    let huntTick = 0, huntAt = 0, huntStart = null;
    function huntClock(g, running) {
        clearTimeout(huntTick); huntTick = 0;
        if (!running || g.reason) return;
        const at = Date.now() - g.dur * 1000;
        if (huntStart !== g.start || at < huntAt || at - huntAt > 2000) { huntStart = g.start; huntAt = at; }
        const tick = () => {
            const b = document.querySelector('#lmui-huntlog [data-k="dur"]'); if (!b) { huntTick = 0; return; }
            const ms = Date.now() - huntAt;
            b.textContent = huntHms(Math.max(g.dur, Math.floor(ms / 1000)));
            huntTick = setTimeout(tick, 1000 - ms % 1000 + 5);   // 對準下一個整秒
        };
        tick();
    }
    function showHuntLog(g, running, snap) {   // snap＝離線回來那份（定格，不放「上次離線掛機」）
        const off = !snap && cb.offLogAvail && cb.offLogAvail(), rst = !snap && cb.logResetOk && cb.logResetOk();   // 重置：伺服器支援才有（舊伺服器沒這個指令）
        const away = !snap && !!awayData;   // 離開期間（見 setAwayLog）
        const ov = overlay('lmui-huntlog', '<div class="box"><div class="hd">掛機紀錄<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' + huntBody(g, running) + '</div>' +
            (off || rst || away ? '<div class="ft">' + (rst ? '<button type="button" data-logreset="1">重置</button>' : '') + (away ? '<button type="button" data-awaylog="1">離開期間</button>' : '') +
                (off ? '<button type="button" data-offlog="1">上次<wbr>離線掛機</button>' : '') + '</div>' : '') + '</div>');
        ov.addEventListener('click', e => { if (netToggle(ov, e)) return; if (e.target.closest('[data-offlog]')) cb.offlineLog(); else if (e.target.closest('[data-awaylog]')) openAway(); else if (e.target.closest('[data-logreset]')) logResetAsk(); });
        huntClock(g, running);
    }
    // 重置掛機紀錄：先問；確定才送伺服器（cb.logReset），畫面上的數字等伺服器推回來的 S_Web 3 再換（這裡不先歸零）
    function logResetAsk() {
        const ov = overlay('lmui-logreset', '<div class="box"><div class="hd"><span>重置掛機紀錄</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd"><div class="cl-ask">目前的掛機紀錄會清掉重新算。</div></div>' +
            '<div class="ft"><button type="button" data-x="1">取消</button><button type="button" class="danger" data-ok="1">確定</button></div></div>');
        ov.classList.add('cl-ov');   // 小視窗（同血盟、賣出的確認框）
        ov.querySelector('[data-ok]').addEventListener('click', () => { ov.remove(); cb.logReset(); });
    }
    // 上次離線掛機明細（S_Web 20；線上 AUTO 不會蓋掉）：自己點才開（掛機紀錄視窗、掛機設定頁）。
    //   d.other＝別隻角色的（同帳號只能離線掛機一隻，登入這隻時上一隻被停掉）：標題換成那隻的名字、原因叫「停止原因」，加 class ofl-other（新手引導不算「打開了掛機紀錄」）
    const offWhen = s => { const d = new Date(s * 1000), p = n => String(n).padStart(2, '0'); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
    function showOfflineLog(d) {
        const dur = Math.max(0, d.end - d.start);
        const stat = (k, v, avg) => '<span><i>' + k + '</i><b>' + esc(v) + '</b>' + (avg ? '<small>' + esc(avg) + '</small>' : '') + '</span>';
        const per10 = v => dur >= 60 ? '平均 ' + Math.round(v * 600 / dur).toLocaleString() + ' / 10分' : '';
        const times = n => n ? n + ' 次' : '—';
        const map = cb.huntPlaceName ? cb.huntPlaceName(d.map) : cb.mapName ? cb.mapName(d.map) : '';   // 站長 2026-11-05「21.修正」：跟掛機紀錄同一套地名（原本這裡寫地圖名「大陸」）
        const ov = overlay('lmui-offlog', '<div class="box"><div class="hd">' + (d.other ? '<span>上一隻角色：' + esc(d.other) + ' 的離線掛機結算</span>' : '上次離線掛機') +
            '<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            (map ? '<div class="mi-map">📍 ' + esc(map) + '</div>' : '') + '<div class="mi-when">' + offWhen(d.start) + ' ～ ' + offWhen(d.end) + '</div>' +
            '<div class="mi-stats">' + stat('時間', huntHms(dur)) + stat('擊殺', d.kills.toLocaleString()) + stat('經驗', '+' + d.exp.toLocaleString(), per10(d.exp)) + goldStat(stat, d.gold, d.net, per10) +
            stat('升級', d.levels ? '+' + d.levels + ' 級' : '—') + stat('死亡', times(d.deaths)) + stat('逃跑', times(d.escapes)) + stat('回村', times(d.towns)) + '</div>' +
            '<div class="mi-why"><i>' + (d.other ? '停止原因' : '結束原因') + '</i><b>' + esc(d.reason || '—') + '</b></div>' +
            '<div class="ofl-h">獲得道具</div>' + itemGrid(d.loot, '沒有撿到道具') + '<div class="ofl-h">用掉</div>' + itemGrid(d.used, '沒有用掉道具') + petUsedLine(d.petUsed) + '</div>' +
            '<div class="ft"><button type="button" class="ofl-ok" data-x="1">確認</button></div></div>');
        if (d.other) ov.classList.add('ofl-other');
        ov.addEventListener('click', e => netToggle(ov, e));
    }
    // 離開期間的掛機（站長 2026-10-22「網頁不關把它縮小 不會顯示掛機收益」；main.js awayShow：切到背景、縮小一陣子回來，這段時間打到的）。
    //   不自動跳（站長同日「玩家自己點」）：掛機紀錄底下多一顆「離開期間」，掛機紀錄鈕上亮紅點，點開看過就熄；留最近一次，換角色清掉
    let awayData = null;
    function setAwayLog(d) {
        awayData = d || null;
        $('lmui-huntbtn').classList.toggle('has-new', !!awayData);
        const box = document.querySelector('#lmui-huntlog .box');   // 掛機紀錄正開著：底下補那顆
        if (!box || !awayData || box.querySelector('[data-awaylog]')) return;
        let ft = box.querySelector('.ft');
        if (!ft) { ft = document.createElement('div'); ft.className = 'ft'; box.appendChild(ft); }
        const b = document.createElement('button'); b.type = 'button'; b.dataset.awaylog = '1'; b.textContent = '離開期間';
        ft.insertBefore(b, ft.querySelector('[data-offlog]'));
    }
    function openAway() { if (!awayData) return; $('lmui-huntbtn').classList.remove('has-new'); showAwayLog(awayData); }
    //   排法同上次離線掛機（同一個框，樣式共用 #lmui-offlog）；資料是掛機紀錄相減，沒有死亡、逃跑、回村、用掉。AUTO 還開著不寫結束原因
    function showAwayLog(d) {
        const dur = Math.max(0, d.end - d.start);
        const stat = (k, v, avg) => '<span><i>' + k + '</i><b>' + esc(v) + '</b>' + (avg ? '<small>' + esc(avg) + '</small>' : '') + '</span>';
        const per10 = v => dur >= 60 ? '平均 ' + Math.round(v * 600 / dur).toLocaleString() + ' / 10分' : '';
        const map = cb.huntPlaceName ? cb.huntPlaceName(d.map) : cb.mapName ? cb.mapName(d.map) : '';
        const ov = overlay('lmui-offlog', '<div class="box"><div class="hd">離開期間的掛機<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            (map ? '<div class="mi-map">📍 ' + esc(map) + '</div>' : '') + '<div class="mi-when">' + offWhen(d.start) + ' ～ ' + offWhen(d.end) + '</div>' +
            '<div class="mi-stats">' + stat('時間', huntHms(dur)) + stat('擊殺', d.kills.toLocaleString()) + stat('經驗', '+' + d.exp.toLocaleString(), per10(d.exp)) + goldStat(stat, d.gold, d.net, per10) +
            stat('升級', d.levels ? '+' + d.levels + ' 級' : '—') + '</div>' +
            (d.reason ? '<div class="mi-why"><i>結束原因</i><b>' + esc(d.reason) + '</b></div>' : '') +
            '<div class="ofl-h">獲得道具</div>' + itemGrid(d.loot, '沒有撿到道具') + '</div>' +
            '<div class="ft"><button type="button" class="ofl-ok" data-x="1">確認</button></div></div>');
        ov.classList.add('ofl-away');
        ov.addEventListener('click', e => netToggle(ov, e));
    }
    // 夥伴用掉（站長 2026-10-30「離線掛記錄最底下在一個寫:夥伴用掉」，伺服器第 463 項）：寵物、召喚獸喝掉的治癒藥水、綠水，對寵物用的復活卷軸；
    //   主人自己的在上面「用掉」，不重複。畫法同「用掉」（站長同日「也像用掉的一樣有圖示」：標題＋圖示格子、右下角數量、數量多的在前），沒有就整段不顯示（舊伺服器＝空的）
    function petUsedLine(a) {
        if (!a || !a.length) return '';
        return '<div class="ofl-h">夥伴用掉</div>' + itemGrid(a, '');
    }
    // 道具格子（站長 15:30 照單機版「獲得道具」）：一排 5 格（手機直式也 5 格、格子跟著縮），方框裡圖示＋右下角數量，下面名字；數量多的在前；
    //   金幣上面數字區已經有，不放格子；對不到圖示的用通用圖（itemIcon 一定有圖）
    function itemGrid(a, none) {
        const list = a.filter(x => !/^\$4$|^金幣$/.test(x.name)).sort((p, q) => q.count - p.count);
        if (!list.length) return '<div class="mi-none">' + none + '</div>';
        return '<div class="ofl-grid">' + list.map(x => {
            const u = cb.itemIcon({ name: x.name, gfx: x.gfx || undefined });   // 0＝伺服器查不到圖示（用戶端 0 號是空心圈）→ 通用圖
            const cls = [u.startsWith('/icon/') ? 'ic35' : '', glowCls(x)].filter(Boolean).join(' ');   // 祝福／詛咒／屬性的光效（S_Web 20 撿到的每件的祝福、屬性）
            return '<div class="ofl-cell"><div class="ofl-ic"><img alt=""' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(u) + '">' + hsFx(x) + flTag(x.name) + '<b>' + x.count.toLocaleString() + '</b></div>' +
                '<div class="ofl-nm' + nameCls(x.bless) + '">' + esc(x.name) + '</div></div>';
        }).join('') + '</div>';
    }
    function refreshHuntLog(g, running) {
        const bd = document.querySelector('#lmui-huntlog .bd'); if (!bd) return false;
        const top = bd.scrollTop; bd.innerHTML = huntBody(g, running); bd.scrollTop = top;
        huntClock(g, running);
        return true;
    }
    // 建立物品指令（站長自訂；照單機版 openPick／openQty）：伺服器回搜尋清單 → 點一件跳數量視窗 → 「放進背包」（誰能用、放不放得下由伺服器判斷）
    //   本機改動第 365 項（站長 2026-10-27）：點到能強化的武器／防具（伺服器送的 ench 上限 > 0）改跳選強化值視窗（gmPicked）
    function itemPick(d) {
        if (d.ask && d.list.length === 1) { gmPicked(d.list[0], d.count); return; }
        try { const ae = document.activeElement; if (ae && ae.blur && ae !== document.body) ae.blur(); } catch (e) { /* 收掉聊天輸入框的鍵盤，不然會蓋住清單 */ }
        const names = {}; d.list.forEach(x => { const k = gmName(x); names[k] = (names[k] || 0) + 1; });   // 連祝福都一樣的好幾件（例如冰之女王的耳環）：名字後面補編號才分得出來
        const ov = overlay('lmui-gmpick', '<div class="box"><div class="hd">「' + esc(d.kw) + '」<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            (d.total > d.list.length ? '<div class="gm-note">共 ' + d.total.toLocaleString() + ' 件，關鍵字打長一點可以縮小</div>' : '') +
            '<div class="bd"><div class="grid">' + d.list.map((x, i) => '<button type="button" class="opt" data-i="' + i + '">' + itemImg(cb.itemIcon({ name: x.name, gfx: x.gfx }), x) +
                '<span class="' + nameCls(x.bless).trim() + '">' + esc(gmName(x)) + (names[gmName(x)] > 1 ? '<small>#' + x.id + '</small>' : '') + '</span></button>').join('') + '</div></div></div>');
        ov.addEventListener('click', e => { const b = e.target.closest('.opt[data-i]'); if (b) gmPicked(d.list[+b.getAttribute('data-i')], d.count); });
    }
    const gmPicked = (x, cnt) => (x.ench > 0 ? openGmEnch(x) : openGmQty(x, cnt));
    // 第 365 項：選強化值（+0～伺服器給的上限，預設 +0）→ 點一個就建立一件（數量 1）；伺服器會再夾一次範圍
    function openGmEnch(x) {
        const old = $('lmui-gmpick'); if (old) old.remove();
        const max = Math.min(x.ench | 0, 30), opts = [];
        for (let v = 0; v <= max; v++) opts.push('<button type="button" class="opt' + (v === 0 ? ' on' : '') + '" data-e="' + v + '">+' + v + '</button>');
        const ov = overlay('lmui-gmench', '<div class="box"><div class="hd' + nameCls(x.bless) + '">' + itemImg(cb.itemIcon({ name: x.name, gfx: x.gfx }), x) + esc(gmName(x)) +
            '<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd"><div class="grid">' + opts.join('') + '</div></div></div>');
        ov.addEventListener('click', e => { const b = e.target.closest('.opt[data-e]'); if (!b) return; ov.remove(); cb.gmItem(x.id, 1, +b.getAttribute('data-e')); });
        try { ov.querySelector('.opt.on').focus(); } catch (e) { /* 預設 +0：按 Enter 就是 +0 */ }
    }
    // 祝福版跟一般的同名（治癒藥水 40010／140010）：照強化視窗的寫法加前綴、換顏色（詛咒版 2026-10-19 起伺服器不列）
    const gmName = x => (x.bless === 0 ? '祝福的 ' : '') + x.name;   // 用詞同背包（items.js BLESS_WORD）
    function openGmQty(x, cnt) {
        const old = $('lmui-gmpick'); if (old) old.remove();
        const ov = overlay('lmui-gmqty', '<form class="box"><div class="hd' + nameCls(x.bless) + '">' + itemImg(cb.itemIcon({ name: x.name, gfx: x.gfx }), x) + esc(gmName(x)) +
            '<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd"><input type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="send" autocomplete="off" maxlength="10" value="' + (cnt | 0 || 1) + '"></div>' +
            '<div class="ft"><button type="submit">放進背包</button></div></form>');
        const inp = ov.querySelector('input');
        inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D+/g, ''); });
        inp.addEventListener('keydown', e => e.stopPropagation());   // 數字鍵不要變成快捷鍵、方向鍵不要走路
        ov.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            const n = parseInt(inp.value, 10);
            if (!(n > 0)) { inp.focus(); return; }
            ov.remove(); cb.gmItem(x.id, n);
        });
        try { inp.focus(); inp.select(); } catch (e) { /* 在點擊當下 focus，手機才會直接彈出數字鍵盤 */ }
    }
    // 提煉魔石（黑暗妖精 100）：伺服器把施法的「目標」讀成道具編號（L1SkillUse BRING_STONE）；一～四級黑魔石（40320～40323）才有反應：
    //   成了＝這顆換成高一級的，失敗＝這顆沒了（五級不能再提煉）。列出背包裡的一～四級讓玩家點，點哪顆就回傳哪顆（onPick(那顆的 it)）；一顆都沒有回 false
    const STONE_IDS = [40320, 40321, 40322, 40323];
    function stonePick(onPick) {
        const list = parsedItems().filter(p => STONE_IDS.includes(TPL_OF.has(p.id) ? TPL_OF.get(p.id) : p.tpl && p.tpl.id))
            .sort((a, b) => (TPL_OF.get(a.id) || 0) - (TPL_OF.get(b.id) || 0) || a.id - b.id);
        if (!list.length) { toast('背包裡沒有一～四級黑魔石'); return false; }
        const ov = overlay('lmui-stonepick', '<div class="box"><div class="hd">提煉魔石<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="gm-note">成功升一級，失敗會損失那一顆</div>' +
            '<div class="bd"><div class="grid">' + list.map((p, i) => '<button type="button" class="opt" data-i="' + i + '">' + itemImg(cb.itemIcon(p), p) +
                '<span>' + esc(p.base) + '</span><small>×' + (p.count || 1).toLocaleString() + '</small></button>').join('') + '</div></div></div>');
        ov.addEventListener('click', e => { const b = e.target.closest('.opt[data-i]'); if (!b) return; ov.remove(); onPick(list[+b.getAttribute('data-i')].it); });
        return true;
    }
    // 頭像：同單機版 toggleEquipWin，開／關「裝備」（背包的裝備欄分頁）
    root.querySelector('#lmui-face .pic').addEventListener('click', () => {
        inSide('items', () => {   // 電腦介面：開在右邊（背包那側）
            if (cur === 'items' && winTab === '裝備欄') { closeAll(true); return; }
            closeAll(true); cur = 'items'; fromFace = true; openWin('items', '裝備欄');
        });
        syncTools();
    });
    // 地名點了不再打開地圖清單（站長 2026-11-07「手動操作的時候會不小心點到飛走」）：樣式 pointer-events: none，點下去等於點地面

    // ── 聊天 ──
    function send() {
        const wsp = el.ch.value === 'whisper';
        let t = el.say.value.trim();
        if (!t) { if (wsp) toast(el.wto.value.trim() ? '密語要打內容' : '密語要填名字和內容'); return; }
        let ch = CHANNELS.find(c => c[0] === el.ch.value) || CHANNELS[0];
        // 照用戶端的頻道符號（站長 2026-10-23「對話框跟客戶端一樣，輸入 @ 血盟頻道、# 隊伍頻道」「還有其他頻道快捷鍵同步加入」）：
        //   ! 大喊、& 世界、@ 血盟、# 隊伍、$ 交易（伺服器 C_Chat 自己認開頭的 $，原樣送一般）、"名字 內容＝悄悄話；全形符號也算。符號不送出去
        const c0 = t[0], half = { '！': '!', '＆': '&', '＠': '@', '＃': '#', '＄': '$', '＂': '"', '“': '"', '”': '"' }[c0] || c0;
        if (half === '"') {
            const rest = t.slice(1).trim(), m = /^\S+/.exec(rest), name = m ? m[0] : '', msg = name ? rest.slice(name.length).trim() : '';
            if (!name || !msg) { toast('悄悄話：打 "名字 內容'); return; }
            cb.onWhisper(name, msg); el.say.value = ''; return;
        }
        if (half === '$') { t = '$' + t.slice(1); ch = CHANNELS[0]; }
        const pre = { '!': 2, '&': 3, '@': 4, '#': 11 }[half];
        if (pre != null) {
            t = t.slice(1).trim(); if (!t) return;
            cb.onChat(t, pre); el.say.value = ''; return;
        }
        // 密語頻道（站長 2026-11-09「密語好用一點」）：名字欄＋內容；送出後清內容、名字留著（連續聊）
        if (wsp && half !== '$') {
            const name = el.wto.value.trim();
            if (!name) { toast('密語要填名字'); el.wto.focus(); return; }
            cb.onWhisper(name, t); el.say.value = ''; return;
        }
        if (!ch[3]) { soon(); return; }   // 隊伍、血盟：網頁版還沒有組隊、血盟，伺服器會直接丟掉
        cb.onChat(t, ch[2]);
        el.say.value = '';
    }
    $('lmui-send').addEventListener('click', send);
    el.say.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); el.say.blur(); }
        else if (e.key === 'Escape') { el.say.blur(); }
    });
    // 密語：頻道選「密語」才出現名字欄；名字欄按 Enter＝跳到內容欄
    el.wto = $('lmui-wto');
    const syncWsp = () => { el.wto.hidden = el.ch.value !== 'whisper'; };
    el.ch.addEventListener('change', () => { syncWsp(); if (el.ch.value === 'whisper') (el.wto.value.trim() ? el.say : el.wto).focus(); });
    el.wto.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); el.say.focus(); }
        else if (e.key === 'Escape') { el.wto.blur(); }
    });
    // 點聊天框的名字、管理員選單的「密語」：切到密語、帶名字、游標到內容欄
    // 點聊天框別人的名字＝切到密語、帶入名字（站長 2026-11-09）；點自己的名字不理
    el.lines.addEventListener('click', e => { const w = e.target.closest('.c-who'); if (!w) return; const name = w.textContent; if (!name || name === chatOwner) return; e.stopPropagation(); whisperTo(name); });
    function whisperTo(name) {
        el.ch.value = 'whisper'; syncWsp(); el.wto.value = name; el.say.focus();
    }
    el.tabs.addEventListener('click', e => {
        const b = e.target.closest('button[data-t]'); if (!b) return;
        const t = b.getAttribute('data-t');
        if (t === 'size') { cycleChat(); return; }   // ▲：聊天視窗小→中→大→小
        chatTab = t; renderChat(); syncTabs();
    });
    // 聊天視窗高度：小／中／大（記在這台裝置）。每段幾行照螢幕剩下的高度算：最大那段也要留 CHAT_MIN_SCENE 給戰鬥畫面
    //   電腦版面（站長 2026-10-19「橫式版對話框默認設定最低版面」）另外一份 chatPc：每次進遊戲（clear）從「小」開始，按 ▲ 拉大只算這次、不寫回去；
    //   直式照舊用記住的那份（同一支手機轉來轉去，直式記的大小不會被橫的蓋掉）
    let chatSave = (() => { try { const v = +localStorage.getItem(CHAT_KEY); return v === 1 || v === 2 ? v : 0; } catch (e) { return 0; } })(), chatPc = 0;
    const chatSizeNow = () => (isPc() ? chatPc : chatSave);
    const linesBox = $('lmui-linesbox'), lower = $('lmui-lower'), band = $('lmui-band');
    function chatLevels() {
        const lh = parseFloat(getComputedStyle(el.lines).lineHeight) || 18;
        // 電腦版面（橫的，pcui.css）：聊天框在最下面面板中欄，「小」＝撐滿面板（CSS），「中」「大」往上長，最高到畫面六成
        if (isPc()) {
            const chrome = srect($('lmui-chat')).height - srect(linesBox).height;
            const fit = Math.max(1, Math.floor((srect($('m-nav')).height - chrome - 8) / lh));
            const big = Math.max(fit + 2, Math.floor((vh() * 0.6 - chrome - 8) / lh));
            return { lh, n: [1, Math.round((fit + big) / 2), big] };
        }
        const sceneH = vh() - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--m-nav-h')) || 62);
        const others = srect(lower).height - srect(linesBox).height;   // 聊天訊息以外的下方介面
        const fit = Math.floor((sceneH - others - Math.max(CHAT_MIN_SCENE, sceneH * 0.35) - 8) / lh);
        const big = Math.max(2, Math.min(CHAT_LINES[2], fit));
        return { lh, n: [Math.min(CHAT_LINES[0], Math.ceil(big * 0.3)), Math.min(CHAT_LINES[1], Math.ceil(big * 0.6)), big] };
    }
    function layoutChat() {
        const { lh, n } = chatLevels(), chatSize = chatSizeNow();
        linesBox.style.height = Math.round(n[chatSize] * lh + 8) + 'px';
        const b = el.tabs.querySelector('[data-t="size"]');
        setTxt(b, chatSize === 2 ? '▼' : '▲');
        b.setAttribute('aria-label', ['聊天框：小', '聊天框：中', '聊天框：大'][chatSize]);
        if (el.lines.scrollTop + el.lines.clientHeight >= el.lines.scrollHeight - 40) el.lines.scrollTop = el.lines.scrollHeight;
        measureLayout();
    }
    function cycleChat() {
        if (isPc()) chatPc = (chatPc + 1) % 3;
        else { chatSave = (chatSave + 1) % 3; try { localStorage.setItem(CHAT_KEY, String(chatSave)); } catch (e) { /* 無痕 */ } }
        layoutChat();
    }
    // 版面位置給 CSS 用：彈出視窗的下緣停在龍頭帶上緣（--lmui-pop-b＝龍頭帶上緣離畫面底多遠，快捷列、地名被蓋住）、
    //   線上名單的高度上限（--lmui-lower-h）
    //   電腦版面：右欄上面的 AUTO 那排鈕是固定大小，面板縮小（手機橫放 0.75 倍）時會比龍頭帶高 → 視窗下緣停在兩個裡面比較高的那個，不蓋到 AUTO
    function measureLayout() {
        const r = document.documentElement.style, bt = srect(band).top;   // 舞台座標（stage.js）
        if (!band.getBoundingClientRect().top && !band.offsetParent) return;   // 還沒進遊戲（看不到）
        let top = bt;
        if (isPc()) { const a = srect($('lmui-bars')); if (a.height) top = Math.min(top, a.top); }
        r.setProperty('--lmui-pop-b', Math.round(vh() - top) + 'px');
        r.setProperty('--lmui-lower-h', Math.round(srect(lower).height) + 'px');
        syncSb();
    }
    // 下方介面大小變了（進遊戲才看得到、快捷列換兩排、轉橫放）就重算；聊天訊息以外的高度不受行數影響，不會一直循環
    if (window.ResizeObserver) new ResizeObserver(() => layoutChat()).observe(lower);
    window.addEventListener('resize', () => requestAnimationFrame(layoutChat));
    // 彈出視窗蓋到龍頭帶上緣，地名有一截伸進龍頭帶（貼血條）蓋不完 → 有彈出視窗開著就整個藏起來（body.lmui-cover）。
    //   視窗都直接加在 body 下（小視窗、更新紀錄、NPC、強化）：盯 body 的直接子節點＋三個常駐視窗自己的 class／hidden，不整棵樹盯
    const COVER = '#lmui-win:not(.hidden), .lmui-ov, #lmui-updwin.ingame, #npc-window:not([hidden]), #enh-window:not([hidden])';
    const coverMo = new MutationObserver(syncCover), coverSeen = new WeakSet();
    function syncCover() {
        for (const id of ['lmui-win', 'lmui-win2', 'npc-window', 'enh-window']) {
            const w = $(id);
            if (w && !coverSeen.has(w)) { coverSeen.add(w); coverMo.observe(w, { attributes: true, attributeFilter: ['class', 'hidden'] }); }
        }
        // 有任何視窗開著（含電腦版右邊的背包 #lmui-win2，它不藏聊天框所以不算 COVER）：跑馬燈淡淡透明、不擋視窗（lmui.css body.lmui-anywin #enh-broadcast；站長 2026-11-08「只要有開到視窗都是淡淡透明化」）
        document.body.classList.toggle('lmui-anywin', !!document.querySelector(COVER + ', #lmui-win2:not(.hidden)'));
        const on = !!document.querySelector(COVER);
        if (document.body.classList.contains('lmui-cover') === on) return;
        document.body.classList.toggle('lmui-cover', on);   // 聊天框、輸入列、地名、浮著的訊息藏起來／回來（lmui.css），直式的龍頭帶跟著移
        if (on) fltList.textContent = '';   // 開視窗：浮著的訊息收掉（關掉視窗時不會冒出舊的）
        measureLayout();   // 視窗下緣（--lmui-pop-b）馬上照龍頭帶新的位置，不等 ResizeObserver 下一輪（不然視窗會先短一截再拉長）
    }
    coverMo.observe(document.body, { childList: true });
    syncCover();
    function syncTabs() { el.tabs.querySelectorAll('button[data-t]').forEach(b => b.classList.toggle('on', b.getAttribute('data-t') === chatTab)); }
    syncTabs();
    // 一行聊天／訊息：cat＝分頁（sys/combat/drop/say/world/party/clan），cls＝顏色；quiet＝只記進聊天框、不浮上來（同一句已經用別的方式提示了）
    //   dir＝喊叫的方向 0～7（畫面上的 → ↗ ↑ ↖ ← ↙ ↓ ↘，main.js shoutDir）：行首放用戶端的方向圓牌（data/ui/shout-<dir>.png；沒有介面圖時是箭頭字）
    const DIR_CH = '→↗↑↖←↙↓↘';
    //   who＝這句是誰說的（main.js chatWho：{ n 名字, i 位置 }）：名字包成 .c-who，點了＝密語他
    function chat(text, cat, cls, quiet, dir, who) {
        if (!quiet && (cat === 'sys' || cat === 'drop')) floatMsg(text, cls, cat);
        const l = { text, cat, cls, dir: dir >= 0 && dir < 8 ? dir : -1, who: who && who.n && String(text).substr(who.i, who.n.length) === who.n ? who : null };
        lines.push(l);
        if (lines.length > 200) lines.shift();
        if (chatOwner && !chatLogT) chatLogT = setTimeout(chatLogSave, 3000);
        if (inTab(cat, chatTab)) {
            chatPend.push(l);
            if (chatPend.length > CHAT_ROWS * 2) chatPend = chatPend.slice(-CHAT_ROWS);   // 切到背景時下一幀不會來：排著的最多留一框
            if (!chatRaf) chatRaf = requestAnimationFrame(flushChat);
        }
    }
    // 聊天紀錄留到下次（站長 2026-11-09「對話頻道可以保留嗎」→ 選「重新整理、重新登入後之前的對話還在」）：每隻角色各存最後 CHATLOG_MAX 句在 localStorage
    //   （l1web_chatlog_<角色名>，不在 prefsync 的同步清單裡、不進伺服器）；有新句子 3 秒內存一次、離開頁面再存一次。
    //   進遊戲（update 第一次拿到角色名）讀回來接在這次已經收到的前面；換角色（clear 沒留聊天）重新認主人
    const CHATLOG_KEY = 'l1web_chatlog_', CHATLOG_MAX = 150;   // chatOwner、chatLogT 跟 lines 一起宣告在最上面（chat 可能更早被叫）
    function chatLogSave() {
        if (chatLogT) { clearTimeout(chatLogT); chatLogT = 0; }
        if (!chatOwner) return;
        try { localStorage.setItem(CHATLOG_KEY + chatOwner, JSON.stringify(lines.slice(-CHATLOG_MAX))); } catch (e) { /* 無痕、滿了：這次不存 */ }
    }
    function chatLogLoad(name) {
        if (!name || chatOwner === name) return;
        chatOwner = name;
        let old = [];
        try { const a = JSON.parse(localStorage.getItem(CHATLOG_KEY + name) || '[]'); if (Array.isArray(a)) old = a.filter(l => l && typeof l.text === 'string' && typeof l.cat === 'string'); } catch (e) { /* 壞掉就不讀 */ }
        if (!old.length || lines.length >= 200) return;
        lines = old.concat(lines).slice(-200);
        renderChat();
    }
    window.addEventListener('pagehide', chatLogSave);
    // 聊天框最多留 120 行。原本每來一句就整個重建 120 行、再量兩次高度（強迫排版），手機每秒 20 句時一句十幾毫秒、整個畫面跟著卡 →
    //   改成：同一幀來的句子先排著，下一幀一次加在最後面、超過的從最上面刪（加之前看一次在不在底部：這時版面還沒動，量了不用重排）；
    //   捲到底、捲軸圓鈕留到再下一幀（chatSettle：那時瀏覽器已經照新內容排好版，量高度不會再強迫排一次）。換分頁才整個重畫（renderChat）
    const CHAT_ROWS = 120, chatRow = l => '<div class="' + (l.cls || '') + '">' + (l.dir >= 0 ? '<i class="c-dir d' + l.dir + '">' + DIR_CH[l.dir] + '</i>' : '') + chatWhoHtml(l) + '</div>';
    const chatWhoHtml = l => { const t = String(l.text), w = l.who; return !w ? esc(t) : esc(t.slice(0, w.i)) + '<span class="c-who">' + esc(w.n) + '</span>' + esc(t.slice(w.i + w.n.length)); };
    let chatPend = [], chatRaf = 0, chatSettle = 0, chatEnd = false;   // chatSettle：上一幀加了幾行、還沒捲；chatEnd：加之前在底部
    function flushChat() {
        chatRaf = 0;
        const L = el.lines;
        if (chatSettle) {
            // 加之前在底部、而且這一幀之間沒有被往上捲（離底部扣掉新加那幾行的高度還在 24px 內）→ 捲到底
            let moved = false;   // 有捲動：scroll 事件會叫 syncSb，這裡不用再算一次
            if (chatEnd) {
                let addH = 0; for (let i = 0, r = L.lastElementChild; i < chatSettle && r; i++, r = r.previousElementSibling) addH += r.offsetHeight;
                if (L.scrollHeight - L.scrollTop - L.clientHeight - addH <= 24) { const y = L.scrollTop; L.scrollTop = L.scrollHeight; moved = L.scrollTop !== y; }
            }
            chatSettle = 0; if (!moved) syncSb();
        }
        const add = chatPend; chatPend = [];
        if (!add.length) return;
        if (TAB_SOON[chatTab]) { renderChat(true); return; }
        chatEnd = L.scrollTop + L.clientHeight >= L.scrollHeight - 24;
        const rows = add.slice(-CHAT_ROWS), frag = document.createDocumentFragment();
        for (const l of rows) {   // 跟 chatRow 同一個樣子，直接建節點（一兩行時比整段 HTML 解析快）
            const d = document.createElement('div'); d.className = l.cls || '';
            if (l.dir >= 0) { const i = document.createElement('i'); i.className = 'c-dir d' + l.dir; i.textContent = DIR_CH[l.dir]; d.appendChild(i); }
            const t = l.text == null ? '' : String(l.text), w = l.who;
            if (w) {   // 名字包成 .c-who（同 chatWhoHtml）
                d.appendChild(document.createTextNode(t.slice(0, w.i)));
                const s = document.createElement('span'); s.className = 'c-who'; s.textContent = w.n; d.appendChild(s);
                d.appendChild(document.createTextNode(t.slice(w.i + w.n.length)));
            } else d.appendChild(document.createTextNode(t));
            frag.appendChild(d);
        }
        L.appendChild(frag);
        for (let n = L.childElementCount - CHAT_ROWS; n > 0; n--) L.firstElementChild.remove();
        chatSettle = rows.length; chatRaf = requestAnimationFrame(flushChat);
    }
    function renderChat(append) {
        chatPend = []; chatSettle = 0; if (chatRaf) { cancelAnimationFrame(chatRaf); chatRaf = 0; }   // 整個重畫：排著還沒畫的本來就在 lines 裡
        if (TAB_SOON[chatTab]) { el.lines.innerHTML = '<div class="lmui-soon">未完成</div>'; return; }
        const atEnd = el.lines.scrollTop + el.lines.clientHeight >= el.lines.scrollHeight - 24;
        const show = lines.filter(l => inTab(l.cat, chatTab)).slice(-CHAT_ROWS);
        el.lines.innerHTML = show.map(chatRow).join('');
        if (atEnd || !append) el.lines.scrollTop = el.lines.scrollHeight;
        syncSb();
    }
    // 聊天框的捲軸（用戶端的零件：上下鈕、捲軸桿、圓鈕）：上下鈕一次三行、拖圓鈕、點桿子＝翻一頁
    const sb = $('lmui-sb'), sbTrk = sb.querySelector('.trk'), sbKnob = sb.querySelector('i');
    function syncSb() {
        const L = el.lines, max = L.scrollHeight - L.clientHeight, room = sbTrk.clientHeight - sbKnob.offsetHeight;
        sbKnob.style.transform = 'translateY(' + Math.max(0, Math.round(max > 0 ? room * L.scrollTop / max : room)) + 'px)';
    }
    el.lines.addEventListener('scroll', syncSb, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(syncSb).observe(el.lines);
    sb.querySelector('.up').addEventListener('click', () => el.lines.scrollBy({ top: -54 }));
    sb.querySelector('.dn').addEventListener('click', () => el.lines.scrollBy({ top: 54 }));
    const sbTo = cy => { const r = srect(sbTrk), k = sbKnob.offsetHeight, y = sxy(0, cy)[1]; el.lines.scrollTop = Math.max(0, Math.min(1, (y - r.top - k / 2) / Math.max(1, r.height - k))) * (el.lines.scrollHeight - el.lines.clientHeight); };
    sbTrk.addEventListener('pointerdown', e => {
        if (e.target !== sbKnob) { el.lines.scrollBy({ top: (e.clientY < sbKnob.getBoundingClientRect().top ? -1 : 1) * el.lines.clientHeight * 0.9 }); return; }
        e.preventDefault(); sbKnob.setPointerCapture(e.pointerId); sbKnob.classList.add('on');
        const mv = ev => sbTo(ev.clientY), up = () => { sbKnob.classList.remove('on'); sbKnob.removeEventListener('pointermove', mv); sbKnob.removeEventListener('pointerup', up); sbKnob.removeEventListener('pointercancel', up); };
        sbKnob.addEventListener('pointermove', mv); sbKnob.addEventListener('pointerup', up); sbKnob.addEventListener('pointercancel', up);
    });
    // gen-data 沒讀到 3.5C 用戶端 → data/ui 沒有圖：血條改純色、聊天框拿掉上緣和自製捲軸（lmui.css 的 body.lmui-noui）
    { const probe = new Image(); probe.onerror = () => { document.body.classList.add('lmui-noui'); console.warn('[hud] 沒有 data/ui 介面圖（gen-data 讀不到 3.5C 用戶端），血條／聊天框用簡易樣式'); }; probe.src = '/data/ui/bar-468.png'; }
    // 管子挖空的帶子（tools/client-ui.mjs 的 band-*-hollow）有才換上：扣掉的血、魔＝空白；沒有（data/ui 還沒重產）照舊暗色管子，帶子不會整段不見
    { const probe = new Image(); probe.onload = () => document.body.classList.add('lmui-hollow'); probe.src = '/data/ui/band-hp-hollow.png'; }
    // 扣掉的那段＝空的玻璃管（站長選的半透明灰玻璃；圖檔名沿用 bar-white-*）：有才墊；沒有就照上一行的透明
    { const probe = new Image(); probe.onload = () => document.body.classList.add('lmui-white'); probe.src = '/data/ui/bar-white-hp.png'; }
    // 喊叫的方向圓牌（tools/client-ui.mjs 的 shout-0～7）：有才用圖；沒有（data/ui 還沒重產）照舊是箭頭字（lmui.css .c-dir）
    { const probe = new Image(); probe.onload = () => document.body.classList.add('lmui-shoutdir'); probe.src = '/data/ui/shout-0.png'; }
    // 血條各狀態的圖先載好，換色時不會閃一下空的
    for (const k in BAR_LOOK) for (const [n] of BAR_LOOK[k]) new Image().src = '/data/ui/bar-' + n + '.png';

    // ── 狩獵場（彈出視窗）：傳送點＝最上面的分類鈕「村莊｜外圍｜島嶼｜地監」（島嶼 2026-10-24 加；跟搜尋框一起釘在視窗頂端）（站長：分類參考單機版 MAP_CATEGORIES，介面還是 3.5 的卡片），
    //   村莊、外圍直接列地點（一行一個、照名稱排，點一下付金幣傳送；2026-10-24 前是兩欄卡片、照建議等級）；外圍、島嶼一個地區一張卡、地監一座一張卡（樓層在卡片底下），預設收折、點牌子展開（見 tpOpen）。
    //   最上面「搜尋掉落物」：選了道具就只列附近會掉的傳送點（見下面 tpQ／tpPick）。
    //   此地圖 NPC＝整張地圖有功能的 NPC 卡片，照職稱排（main.js npcAreas；點了直接說話，舊伺服器才走過去）。分好幾區的大地圖（主大陸照村莊分）先列自己所在那區，
    //   最上面「← 其他地區｜區名」點了列這張地圖的各區（同地監→樓層），再點一區看那區的。在村莊（安全區）打開時先停在「此地圖 NPC」；
    //   選哪一類、停在哪座地監記在這台裝置，下次打開直接回那裡 ──
    let zone = 0, battleSig = '', npcArea = '', npcMap = -1;   // npcArea：''＝自己所在那區、'*'＝各區清單、區名＝那一區（換地圖、重開狩獵場回 ''）
    const TP_TAB = '傳送點', NPC_TAB = '此地圖 NPC', TP_KINDS = ['村莊', '外圍', '島嶼', '地監'], TP_KIND_KEY = 'l1web_tp_kind', TP_OPEN_KEY = 'l1web_tp_open';
    const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
    let tpKind = lsGet(TP_KIND_KEY);
    // 卡片收折（站長 2026-10-24「小卡片下方默認收折 點擊展開 點另一個小卡片 之前的卡片收折」，地監樓層也收進卡片裡、不再另開一頁）：
    //   外圍／島嶼／地監每張卡只露牌子那列，同一類同時只開一張。tpOpen＝每一類開著哪張（牌子名；''＝全收），記在這台裝置；
    //   每次打開狩獵場，玩家所在地點屬於哪張就先開那張（tpSeen：這次打開已經套過「所在那張」的類別，之後照使用者點的）
    let tpOpen = {}, tpSeen = new Set();
    try { tpOpen = JSON.parse(lsGet(TP_OPEN_KEY) || '{}') || {}; } catch (e) { tpOpen = {}; }
    const saveTpOpen = () => { try { localStorage.setItem(TP_OPEN_KEY, JSON.stringify(tpOpen)); } catch (e) { /* 無痕 */ } };
    function setTp(kind) {
        tpKind = kind;
        try { localStorage.setItem(TP_KIND_KEY, kind); } catch (e) { /* 無痕 */ }
        renderBattle($('lmui-wbody'), true); $('lmui-wbody').scrollTop = 0;
    }
    // 傳送點卡片（站長 2026-10-19「紅色圈起來部分看不到在寫什麼」）：價錢放第一行名字右邊（金幣圖示後面不空格、千位不加逗號），
    //   第二行只寫建議等級，太長可以折成兩行（例：「建議 Lv9～17（+0 裝 Lv13 起）」），不再被「…」切掉、價錢也不會被擠掉
    const lvTxt = lv => lv[0] === lv[1] ? 'Lv' + lv[0] : 'Lv' + lv[0] + '～' + lv[1];
    //   XML 有 Note（練功地圖分析寫的「建議 LvA～B（+0 裝…）」、「這裡掛機找不到怪」）就寫它、不寫建議等級
    // 不能瞬移的地圖（伺服器 mapids teleportable＝0，gen-data 帶 noTp；本機改動第 98 項，站長「有地圖無法瞬移的話要提示」）：小字最前面加「無法瞬移」（說明長的會被截掉，放前面才看得到），去之前就知道 AUTO 找不到怪不會飛
    // 第 512 項（站長 2026-10-31「奧塔傳送，身上有傳送符就不用錢」）：身上有那一層的傲慢之塔傳送符＝免費（伺服器 C_Web.teleport 同一套）
    const tpHasNeed = t => !!t.need && ((cb.toiPass && cb.toiPass(t.need)) || parsedItems().some(p => p.base === itemName(t.need)));   // 第 603 項：開通了（不在背包）也算
    const tpPrice = t => t.price && !tpHasNeed(t) ? goldIcon() + t.price : '免費';   // 給 lmCard 的是 HTML（金幣圖示＋數字）
    // 照名稱排（站長 2026-10-24「傳送點顯示一行顯示一個 依照名稱排列」；原本照建議等級）：zh-Hant＝筆畫序，numeric＝「2樓」排在「10樓」前面
    const TP_COLL = new Intl.Collator('zh-Hant', { numeric: true });
    const byName = (list, nm = t => t.name) => list.slice().sort((a, b) => TP_COLL.compare(nm(a), nm(b)));
    // 一行一個傳送點（站長 2026-10-24，原本兩欄卡片）：左邊名字＋底下小字（建議等級、說明，可以折兩行），右邊價錢；目前所在的整行亮起
    // 傳送點那一行的第二行（站長 2026-10-24「這樣變得很突兀 在優化一下 精緻一點」：原本整句「建議 Lv8～16（怪的經驗只有一般的 1/7）」折兩行、每行長短不一）：
    //   拆成小標籤排一行：等級（亮）｜括號裡的補充（+0 裝幾級起、經驗打折…，淡）｜無法瞬移、不建議掛機這類提醒（紅）。Note 不是「建議 LvA～B（…）」的整句當提醒
    const TP_NOTE = /^建議 Lv(\d+)～(\d+)(?:（(.+)）)?$/;
    const tpMeta = t => {
        const tags = [], m = t.note && TP_NOTE.exec(t.note), tag = (c, x) => tags.push('<i class="lm-tg ' + c + '">' + esc(x) + '</i>');
        if (t.noTp) tag('warn', '無法瞬移');
        if (t.need) { if (tpHasNeed(t)) tag('lv', '已開通・免費'); else tag('warn', '需傳送符或卷軸'); }   // 伺服器第 180 項：沒有那一層的傲慢之塔傳送符傳不過去；第 511 項起同一層的移動卷軸也行（扣一張）
        if (m) { tag('lv', m[1] === m[2] ? 'Lv' + m[1] : 'Lv' + m[1] + '～' + m[2]); if (m[3]) m[3].replace(/怪的經驗只有一般的 ?/, '經驗只有 ').replace(/ 起/g, '').split('，').forEach(x => tag(/經驗/.test(x) ? 'warn' : '', x)); }
        else if (t.note) tag('warn', t.note);
        else if (t.lv) tag('lv', lvTxt(t.lv));
        return tags.join('');
    };
    // 名稱「地區｜地點」：地點當名字，地區做成名字前面的小牌子（沒有地區的就只有名字，左邊一樣對齊）
    const tpName = n => { const i = n.indexOf('｜'); return i > 0 ? '<i class="lm-rg">' + esc(n.slice(0, i)) + '</i><span>' + esc(n.slice(i + 1)) + '</span>' : '<span>' + esc(n) + '</span>'; };
    //   label：群組裡只寫「｜」後面的地點名（地區已經在群組的牌子上）；null＝不寫名字（自己就是一個牌子的地點，例如夢幻之島），小標籤當第一行
    const tpLine = (t, on, label) => '<button type="button" class="lm-row lm-tpr' + (on ? ' cur' : '') + '" data-tp="' + t.id + '"><span class="lm-rn">' +
        (label === null ? '' : '<b>' + (label === undefined ? tpName(t.name) : '<span>' + esc(label) + '</span>') + '</b>') +
        '<span class="lm-tgs">' + (tpMeta(t) || (label === null ? '<i class="lm-tg">前往</i>' : '')) + '</span></span><em>' + tpPrice(t) + '</em></button>';
    // 同一塊牌子一個群組（站長 2026-10-24「小牌子可以大一點 夢幻之島這種也歸類在小牌子 同牌子一個群組」）：「地區｜地點」照地區分組，群組上面一塊大一點的牌子，
    //   底下一行一個地點；沒有地區的（夢幻之島、新兵修練場、精靈墓穴）自己就是一塊牌子，底下那行只寫等級、價錢。整串都沒有「｜」（村莊）照舊一行一個
    //   fold：給了＝收折式（{ open: 開著的牌子名 }，牌子那列是按鈕 data-fold）；沒給（搜尋掉落物的結果）＝全部攤開、牌子不能點
    const tpGroupList = list => {
        const gs = [];
        for (const t of list) {
            const i = t.name.indexOf('｜'), key = i > 0 ? t.name.slice(0, i) : t.name, last = gs[gs.length - 1];
            if (i > 0 && last && last.key === key && last.sub) last.items.push(t); else gs.push({ key, sub: i > 0, items: [t] });
        }
        return gs;
    };
    // 收折時牌子那列右邊的價錢：每個地點一樣就寫那個，不一樣寫最低～最高（全部免費＝免費）
    const tpPriceSum = items => {
        const ps = items.map(t => t.price || 0), lo = Math.min(...ps), hi = Math.max(...ps);
        return !hi ? '免費' : goldIcon() + (lo === hi ? lo : (lo || 0) + '～' + hi);
    };
    const tpLvSum = items => { const lvs = items.filter(t => t.lv); return lvs.length ? [Math.min(...lvs.map(t => t.lv[0])), Math.max(...lvs.map(t => t.lv[1]))] : null; };
    //   一張卡：牌子那列（收折＝按鈕：牌子、摘要小標籤、價錢、箭頭）＋底下一行一個地點
    const tpCard = (key, items, sum, rows, on, fold) => {
        if (!fold) return '<div class="lm-tpg' + (on ? ' cur' : '') + '"><div class="lm-tpg-h"><i class="lm-pl">' + esc(key) + '</i></div><div class="lm-rows">' + rows + '</div></div>';
        const open = fold.open === key;
        //   等級放進牌子裡（地名底下一行；站長 2026-10-29「地圖跟等級可以放一起 邊框加大 不然都吃到字了」），「N 層」「N 個地點」也拿掉（站長同日「幾層可以不用 擋到了」）
        const lvTag = /<i class="lm-tg lv">([^<]*)<\/i>/.exec(sum);
        if (lvTag) sum = sum.replace(lvTag[0], '');
        return '<div class="lm-tpg lm-fold' + (on ? ' cur' : '') + (open ? ' open' : '') + '"><button type="button" class="lm-fold-h" data-fold="' + esc(key) + '" aria-expanded="' + open + '">' +
            '<i class="lm-pl' + (lvTag ? ' lm-pl2' : '') + '">' + esc(key) + (lvTag ? '<small>' + lvTag[1] + '</small>' : '') + '</i><span class="lm-tgs lm-fold-s">' + sum + '</span><em class="lm-fold-p">' + tpPriceSum(items) + '</em><i class="lm-fold-a" aria-hidden="true"></i></button>' +
            '<div class="lm-fold-b"><div class="lm-fold-in"><div class="lm-rows">' + rows + '</div></div></div></div>';
    };
    const tpGroups = (list, here, fold) => {
        if (!list.some(t => t.name.includes('｜'))) return '<div class="lm-rows">' + list.map(t => tpLine(t, here(t))).join('') + '</div>';
        return '<div class="lm-tpgs">' + tpGroupList(list).map(g => {
            const lv = tpLvSum(g.items);
            const sum = g.sub ? (lv ? '<i class="lm-tg lv">' + lvTxt(lv) + '</i>' : '') : tpMeta(g.items[0]);
            return tpCard(g.key, g.items, sum, g.items.map(t => tpLine(t, here(t), g.sub ? t.name.slice(t.name.indexOf('｜') + 1) : null)).join(''), g.items.some(here), fold);
        }).join('') + '</div>';
    };
    // 這一類裡玩家所在地點屬於哪張卡（牌子名；沒有＝''）
    const tpHereKey = (list, here, dungeon) => {
        const t = list.find(here);
        if (!t) return '';
        if (dungeon) return t.group || '';
        const i = t.name.indexOf('｜');
        return i > 0 ? t.name.slice(0, i) : t.name;
    };
    // ── 搜尋掉落物（站長 2026-10-24「最上方可以搜尋掉落物 選擇正確的掉落物 篩選出會掉落的地圖」）：打字 → 列會掉的道具（名字＋圖示，祝福的另一筆）→ 選一個 →
    //   清單只剩「附近有怪會掉它」的傳送點（三類一起列、照名稱）；✕ 回到全部。哪些傳送點會掉：main.js dropTps（大陸照「生怪點離哪個傳送點最近」分，其他地圖整張圖算）。
    //   搜尋框在清單外面（重畫清單不會把打到一半的字、手機鍵盤收掉）；打的字、選的道具這次開著遊戲都記著，關掉視窗再打開還在
    let tpQ = '', tpPick = '';
    const TPF_MAX = 60;
    // 三個畫面（傳送點、地監樓層、此地圖 NPC）同一種卡片：名字＋第二行小字（沒有就空一行，高度不變），目前所在的整張亮起（站長：狩獵場要有一致性）
    //   price：有給（傳送點）就放第一行右邊，第二行可以折兩行
    const lmCard = (attr, name, sub, on, price) => '<button type="button" class="lm-card' + (on ? ' cur' : '') + (price ? ' lm-tp' : '') + '" ' + attr + '>' +
        (price ? '<span class="lm-hd"><b>' + esc(name) + '</b><em>' + price + '</em></span>' : '<b>' + esc(name) + '</b>') +
        '<small>' + (sub ? esc(sub) : '&nbsp;') + '</small></button>';
    function renderBattle(body, force) {
        let sig = winTab, h;
        if (winTab === TP_TAB) {
            // 進得去的等級（伺服器 XML 的 Req）：自己等級不在範圍內的整格不列、選不到（站長 2026-10-18：木人樁 1～9 級、新兵修練場 10～19 級）；
            //   等級還沒收到（剛進遊戲）先全列。升級時 sig 會變（帶著等級）→ 馬上重畫
            const lvNow = state.level || 0;
            const all = (cb.teleports ? cb.teleports() : []).filter(t => !t.req || !lvNow || (lvNow >= t.req[0] && lvNow <= t.req[1])), pos = cb.curPos ? cb.curPos() : null;
            const here = t => pos && t.map === pos.map && Math.max(Math.abs(t.x - pos.x), Math.abs(t.y - pos.y)) < 40;   // 目前所在：同一張圖、40 格內
            // 分類鈕只列有地點的（伺服器 XML 還沒換成有「島嶼」的那版＝不出現那顆；清單還沒到先全列）
            const kindsOn = all.length ? TP_KINDS.filter(k => all.some(t => t.kind === k)) : TP_KINDS;
            if (!kindsOn.includes(tpKind)) tpKind = (all.find(here) || {}).kind || kindsOn[0];   // 第一次：停在目前所在那一類
            const kindList = all.filter(t => t.kind === tpKind);
            if (all.length && !tpSeen.has(tpKind)) {   // 這次打開第一次看這一類：所在地點屬於哪張就開那張（不在這類＝照上次使用者開的）
                tpSeen.add(tpKind);
                const hk = tpHereKey(kindList, here, tpKind === '地監');
                if (hk && tpOpen[tpKind] !== hk) { tpOpen[tpKind] = hk; saveTpOpen(); }
            }
            // 搜尋：打了字還沒選＝列候選道具；選了＝篩傳送點。掉寶資料（data/drops.json）第一次要用才下載，到了 main.js 會 refreshWin → 這裡重畫
            const q = tpQ.trim().toLowerCase(), F = cb.dropFind || null;
            const cands = q && !tpPick && F ? F.items() : null, hit = tpPick && F ? F.tps(tpPick) : null, bossHit = tpPick && F && F.boss ? F.boss(tpPick) : null;
            sig += '|' + tpKind + '|' + all.length + '|' + lvNow + '|' + (pos ? pos.map + ':' + Math.round(pos.x / 20) + ',' + Math.round(pos.y / 20) : '') +
                '|' + q + '|' + tpPick + '|' + (cands ? cands.length : -1) + '|' + (hit ? hit.size : -1) + '|' + (bossHit ? bossHit.length : -1);
            let list = body.querySelector(':scope > .tpf-list');
            if (!list) {   // 別的視窗用過這個 body（或第一次）：搭搜尋框＋清單的架子
                //   頂欄（.tpf，sticky）：搜尋框＋分類鈕（＋地監裡的「← 地監｜地監名」），捲清單時一直留在視窗最上面（站長 2026-10-24「分頁按鈕須置頂」）
                body.innerHTML = '<div class="tpf"><span class="tpf-box"><input type="search" class="tpf-q" placeholder="搜尋掉落物" autocomplete="off" enterkeyhint="search" aria-label="搜尋掉落物">' +
                    '<button type="button" class="tpf-x" data-tpx="1" aria-label="清除">✕</button></span><div class="tpf-nav"></div></div><div class="tpf-list"></div>';
                list = body.querySelector(':scope > .tpf-list'); force = true;
            }
            const inp = body.querySelector('.tpf-q');
            if (inp && document.activeElement !== inp && inp.value !== tpQ) inp.value = tpQ;
            body.querySelector('.tpf').classList.toggle('on', !!tpQ);
            if (!force && sig === battleSig) return;
            const kinds = '<div class="lm-bar lm-kinds">' + kindsOn.map(k => '<button type="button" data-kind="' + k + '"' + (k === tpKind ? ' class="on"' : '') + '>' + k + '</button>').join('') + '</div>';
            const none = s => '<div class="lmui-soon tpf-none">' + s + '</div>';
            let nav = '';
            if (q && !tpPick) {   // 候選道具：名字開頭就對到的排前面，其他照名稱
                if (!F) h = none('沒有掉落資料');
                else if (!cands) h = none('讀取中…');
                else {
                    const m = cands.filter(c => c.low.includes(q)).sort((a, b) => (b.low.startsWith(q) - a.low.startsWith(q)) || TP_COLL.compare(a.name, b.name));
                    h = m.length ? '<div class="lm-rows">' + m.slice(0, TPF_MAX).map(c => '<button type="button" class="lm-row tpf-it" data-pick="' + esc(c.name) + '">' +
                        '<img class="' + (c.icon.startsWith('/icon/') ? 'ic35 ' : '') + (c.b ? 'bless-glow' : '') + '" src="' + esc(c.icon) + '" alt="" draggable="false" onerror="this.style.visibility=\'hidden\'">' +
                        '<b class="' + nameCls(c.b ? 0 : 1).trim() + '">' + esc(c.name) + '</b></button>').join('') + '</div>' +
                        (m.length > TPF_MAX ? none('再多打幾個字縮小範圍') : '') : none('沒有怪會掉這個道具');
                }
            } else if (tpPick) {   // 篩過的傳送點：三類一起列（各一段、照名稱；地監直接列樓層）
                //   站長 2026-11-09「頭目的掉落跟一般地圖分開」：分兩區，「一般怪物會掉」＝上面那樣（只算一般怪），「頭目會掉」＝一隻頭目一張卡（牌子寫頭目名），
                //   底下一行一個牠出生的傳送點（同一般的傳送點那行，點了一樣傳過去）。哪一區沒有就不出現
                if (!hit) h = none('讀取中…');
                else {
                    const secs = TP_KINDS.map(k => [k, byName(all.filter(t => t.kind === k && hit.has(t.id)))]).filter(x => x[1].length);
                    const byId = new Map(all.map(t => [t.id, t]));
                    const boss = (bossHit || []).map(b => [b.n, byName(b.tps.map(id => byId.get(id)).filter(Boolean))]).filter(x => x[1].length);
                    const hd = s => '<div class="tpf-hd">' + s + '</div>';
                    h = (secs.length ? hd('一般怪物會掉') + secs.map(([k, l]) => '<div class="tpf-sec">' + k + '</div>' + tpGroups(l, here)).join('') : '') +
                        (boss.length ? hd('頭目會掉') + '<div class="lm-tpgs tpf-boss">' + boss.map(([n, l]) => tpCard(n, l, '', l.map(t => tpLine(t, here(t))).join(''), l.some(here))).join('') + '</div>' : '');
                    if (!h) h = none('沒有傳送點附近會掉這個道具');
                }
            } else if (tpKind === '地監') {   // 一座地監一張卡（同外圍的底板＋牌子）：收折時牌子後面小標籤「N 層」「Lv…」（每層都不建議，例如螞蟻洞窟→寫那句）；展開＝底下一行一層
                const groups = []; for (const t of kindList) if (t.group && !groups.includes(t.group)) groups.push(t.group);
                const fold = { open: tpOpen[tpKind] || '' };
                nav = kinds; h = '<div class="lm-tpgs">' + byName(groups, g => g).map(g => {
                    // 名字開頭是地監名的（○○1樓、2樓…）排前面，掛在同一組的其他地點（海賊島地監的迪哥的廢棄監獄、豪勢的地監，伺服器第 497 項）排後面
                    const fl = byName(kindList.filter(t => t.group === g)).sort((a, b) => b.name.startsWith(g) - a.name.startsWith(g)), lv = tpLvSum(fl);
                    const note = !lv && fl.length && fl.every(t => t.note) ? fl[0].note : '';
                    //   樓層只寫地監名後面那段（「眠龍洞穴1樓」→「1樓」），地監名已經在牌子上
                    const flName = t => t.name.startsWith(g) && t.name.length > g.length ? t.name.slice(g.length) : t.name;
                    const sum = (lv ? '<i class="lm-tg lv">' + lvTxt(lv) + '</i>' : note ? '<i class="lm-tg warn">' + esc(note) + '</i>' : '');
                    return tpCard(g, fl, sum, fl.map(t => tpLine(t, here(t), flName(t))).join(''), fl.some(here), fold);
                }).join('') + '</div>';
            } else {
                nav = kinds; h = tpGroups(byName(kindList), here, { open: tpOpen[tpKind] || '' });
            }
            battleSig = sig;
            const navEl = body.querySelector('.tpf-nav'); if (navEl && navEl.innerHTML !== nav) navEl.innerHTML = nav;   // 搜尋中（三類一起列）不放分類鈕
            list.innerHTML = h;
            return;
        } else if (winTab === NPC_TAB) {
            const A = cb.npcAreas ? cb.npcAreas() : null, areas = A ? A.areas : [];
            if (A && A.map !== npcMap) { npcMap = A.map; npcArea = ''; }
            const area = areas.find(a => a.name === (npcArea || (A && A.cur))) || null;
            sig += '|' + npcArea + '|' + (A ? A.cur : '') + '|' + areas.map(a => a.name + ':' + a.list.map(n => n.id).join(',')).join(';');
            if (!force && sig === battleSig) return;
            const cards = list => '<div class="lm-cards">' + list.map(n => lmCard('data-npc="' + n.id + '"', n.name, n.title ? '[' + n.title + ']' : '')).join('') + '</div>';
            if (!areas.length) h = '<div class="lmui-soon">這張地圖沒有 NPC</div>';
            else if (areas.length === 1) h = cards(areas[0].list);
            else if (npcArea === '*' || !area) h = '<div class="lm-cards">' + areas.map(a => lmCard('data-area="' + esc(a.name) + '"', a.name, a.list.length + ' 位', a.name === A.cur)).join('') + '</div>';
            else h = '<div class="lm-bar"><button type="button" class="lm-back" data-areas="1">← 其他地區</button><b>' + esc(area.name) + '</b></div>' + cards(area.list);
        } else return;
        battleSig = sig;
        body.innerHTML = h;
    }
    // 點牌子那列：開這張、收起其他張（再點同一張＝收起）。直接切 class（不重畫，展開動畫才跑得出來）；畫面不自己捲
    // 先抓傳送點的地圖圖（站長 2026-10-29「圖檔都打包了 為何還是會讀檔 沒事先讀嗎」）：按下傳送才抓來不及（伺服器馬上送過去）。
    //   展開卡片＝卡片裡每個落點周圍 5 格（最多 8 個）；電腦滑鼠停在傳送點上＝那一個周圍 10 格。同一個點同一種範圍只抓一次
    const tpPre = new Set();
    function tpPreload(id, r) { const k = id + ':' + r; if (!cb.tpPreload || tpPre.has(k)) return; tpPre.add(k); cb.tpPreload(id, r); }
    function tpFold(fh) {
        const card = fh.closest('.lm-fold'), body = $('lmui-wbody'); if (!card) return;
        const open = !card.classList.contains('open');
        if (open) [...card.querySelectorAll('[data-tp]')].slice(0, 8).forEach(b => tpPreload(+b.getAttribute('data-tp'), 5));
        body.querySelectorAll('.lm-fold.open').forEach(c => { if (c !== card) { c.classList.remove('open'); c.querySelector('.lm-fold-h').setAttribute('aria-expanded', 'false'); } });
        card.classList.toggle('open', open); fh.setAttribute('aria-expanded', String(open));
        tpOpen[tpKind] = open ? fh.getAttribute('data-fold') : ''; saveTpOpen();
        // 展開後不自己捲動（站長 2026-10-24「點開狩獵場分頁 畫面不要自己捲動」；原本卡片被切到會捲上來）
    }
    $('lmui-wbody').addEventListener('pointerover', e => {
        if (cur !== 'battle' || e.pointerType !== 'mouse') return;
        const b = e.target.closest && e.target.closest('[data-tp]'); if (b) tpPreload(+b.getAttribute('data-tp'), 10);
    });
    $('lmui-wbody').addEventListener('click', e => {
        if (cur !== 'battle') return;
        const k = e.target.closest('[data-kind]'); if (k) { setTp(k.getAttribute('data-kind')); return; }
        const fh = e.target.closest('[data-fold]'); if (fh) { tpFold(fh); return; }
        const pk = e.target.closest('[data-pick]');   // 搜尋掉落物：選了這個道具 → 篩傳送點
        if (pk) { tpPick = tpQ = pk.getAttribute('data-pick'); const i = $('lmui-wbody').querySelector('.tpf-q'); if (i) { i.value = tpQ; i.blur(); } renderBattle($('lmui-wbody'), true); $('lmui-wbody').scrollTop = 0; return; }
        if (e.target.closest('[data-tpx]')) { tpQ = tpPick = ''; const i = $('lmui-wbody').querySelector('.tpf-q'); if (i) i.value = ''; renderBattle($('lmui-wbody'), true); $('lmui-wbody').scrollTop = 0; return; }
        const ar = e.target.closest('[data-area]'), arBack = e.target.closest('[data-areas]');   // 此地圖 NPC：選一區／回各區清單
        if (ar || arBack) { npcArea = ar ? ar.getAttribute('data-area') : '*'; renderBattle($('lmui-wbody'), true); $('lmui-wbody').scrollTop = 0; return; }
        const t = e.target.closest('[data-tp]');
        if (t) { closeAll(); cb.webTeleport(+t.getAttribute('data-tp')); return; }
        const n = e.target.closest('[data-npc]');
        if (n) { closeAll(); cb.talkTo(+n.getAttribute('data-npc')); }   // 收起來、跳 NPC 對話（舊伺服器：看角色走過去，到了才跳）
    });
    // 搜尋框：打字＝重新找候選道具（選過的作廢）；第一次點進去先開始下載掉寶資料。Enter＝選第一個候選
    $('lmui-wbody').addEventListener('input', e => {
        if (cur !== 'battle' || !e.target.classList.contains('tpf-q')) return;
        tpQ = e.target.value; tpPick = ''; renderBattle($('lmui-wbody')); $('lmui-wbody').scrollTop = 0;
    });
    $('lmui-wbody').addEventListener('focusin', e => { if (cur === 'battle' && e.target.classList.contains('tpf-q') && cb.dropFind) cb.dropFind.items(); });
    $('lmui-wbody').addEventListener('keydown', e => {
        if (cur !== 'battle' || !e.target.classList.contains('tpf-q')) return;
        e.stopPropagation();   // 打字不要變成快捷鍵、方向鍵不要走路
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const f = $('lmui-wbody').querySelector('[data-pick]'); if (f) f.click(); else e.target.blur(); }
    });
    setInterval(() => { if (!document.hidden && cur === 'battle' && winTab === NPC_TAB) renderBattle($('lmui-wbody')); }, 1000);   // 清單到了、換地圖、看得到的 NPC 變了才重畫
    // NPC 對話框（npc.js）：商人買賣、倉庫存取、傳送師；伺服器的對話內容在用戶端加密檔裡，照 NPC 種類畫按鈕
    const npcUi = createNpcUi({ items: parsedItems, goldItem: () => cb.goldItem ? cb.goldItem() : null, icon: src => cb.itemIcon(src), action: (id, s) => cb.npcAction(id, s), result: (id, t, pairs) => cb.npcResult(id, t, pairs),
        level: () => state.level || 0, gold: () => state.gold || 0, clan: cb.clan || null,   // clan：血盟執行人的「血盟」分頁（clan.js）
        isElf: () => state.type === 2, toast: t => toast(t), info: p => itemInfo.open(p), shopBook: n => shopBook(n),   // shopBook：第 133 項 商店的書買了直接學
        // 第 117 項 艾利溫視窗：那一系的魔法（同魔法視窗的清單、圖示）、自己的屬性、去除精靈力的價錢（learnList＝要 S_Web 35）
        skills: skillList, skillIcon: n => cb.skillIcon(n), learnList: () => { if (cb.learnList) cb.learnList(); },
        build: () => (cb.build ? cb.build() : null), buildAsk: () => { if (cb.buildAsk) cb.buildAsk(); }, buildDonate: n => { if (cb.buildDonate) cb.buildDonate(n); },   // 村莊福利員「建設」分頁（伺服器第 253 項）
        elfAttr: () => cb.elfAttr ? cb.elfAttr() : null, elfReset: () => cb.elfReset ? cb.elfReset() : null, spellWhere: sid => cb.spellWhere ? cb.spellWhere(sid) : null,   // 艾利溫的精靈屬性頁（spellWhere：第 129 項 去哪買）：只有妖精能選；伺服器沒回音時的提示；info＝點道具圖示看資訊
        craftReq: (id, acts) => cb.craftList(id, acts), craftMake: (id, a, n) => cb.craftMake(id, a, n), taxRate: (id, r) => cb.taxRate(id, r),   // taxRate：第 122 項 城主設稅率
        // 寵物保管員的「寵物」分頁（本機改動第 83 項①）：項圈清單（S_Web 11，同設定頁）＋叫出來的寵物；寄放同夥伴視窗
        pets: () => ({ cols: petCols, ext: petExt, comps: comps.filter(c => c.kind === 1) }), askPets: () => askCollars(true), stash: id => cb.compDismiss(id) });
    // 彈出視窗一次開一個：NPC 對話、強化視窗打開前先把別的收掉
    // 主城補給商人（supply.js，伺服器第 141 項）：點了開製作工匠那種版面，不開一般商店列表；它的商店清單（S_ShopSellList）也給它
    const supply = createSupply({ icon: src => cb.itemIcon(src), gold: () => state.gold || 0, action: (id, s) => cb.npcAction(id, s), result: (id, t, pairs) => cb.npcResult(id, t, pairs), info: p => itemInfo.open(p) });
    const npcShopBuy = npcUi.shopBuy;
    // 吉倫（spellshop.js，站長 2026-10-30）：同萬物百貨商那套版面，點一本看能不能學、魔法說明，按「學習」走原本商店購買（伺服器第 133 項買了直接學會）
    const spellShop = createSpellShop({ icon: src => cb.itemIcon(src), skillIcon: n => cb.skillIcon(n), gold: () => state.gold || 0, level: () => state.level || 0,
        skills: skillList, status: name => shopBook(name), tip: sk => skillTip(sk, state.type || 0, true), action: (id, s) => cb.npcAction(id, s), result: (id, t, pairs) => cb.npcResult(id, t, pairs) });
    npcUi.shopBuy = p => { if (!supply.shopBuy(p) && !spellShop.shopBuy(p)) npcShopBuy(p); };
    const npcOpen = npcUi.open, enhOpen = enh.open;
    // 站長 2026-10-30「拉比安妮介面也改成製作介面」：只有製作功能的工匠點了直接開製作工匠視窗、搜尋帶她的名字（只列她的配方；清掉搜尋看全部）
    const CRAFT_DIRECT = new Set(['$2690|1307']);   // 拉比安尼（70524）
    npcUi.open = n => { closeAll(); if (supply.is(n)) supply.open(n); else if (spellShop.is(n)) spellShop.open(n); else if (CRAFT_DIRECT.has(n.key)) craft.open({ only: n.key, name: n.name }); else npcOpen(n); };
    enh.open = o => { closeAll(); enhOpen(o); };

    // ── 底部工具列＋彈出視窗（能力／魔法／背包／設定／狩獵場、頭像的裝備）：浮在遊戲畫面上、下緣停在裝飾帶上面，一次一個，✕ 或再按同一顆鈕關 ──
    // 只關「這一側」的視窗（手機只有一個視窗；電腦介面左右各一個，見下面 inSide）
    function closeWin() {
        el.win.classList.add('hidden');
        if (cur === 'items') figStop();
        cur = ''; fromFace = false; pending = null; skSel = 0;
    }
    // keepOther：電腦介面開同一側的別的視窗時，另一側的留著（手機沒有另一側，跟 closeAll() 一樣）
    // keepCraft：電腦介面開背包時製作工匠留著（站長 2026-10-25「開製作工匠再開背包，製作工匠會消失」；背包在右邊、工匠在左邊，不會疊到，一起看材料）
    function closeAll(keepOther, keepCraft) {
        closeWin(); if (keepOther !== true) onOther(closeWin);
        document.body.classList.toggle('lmui-win-open', !!(cur || alt.cur));
        syncTools(); figStop();
        npcUi.close(); enh.close(); closeFnMenu(true); upd.close();
        document.querySelectorAll('.lmui-ov').forEach(o => { if (!(keepCraft && o.id === 'lmui-craft')) o.remove(); });
    }
    // 新手引導完成一步，關掉那一步引導打開的視窗（tutorial.js CLOSE_OF，經 main.js）：回 true＝關了、null＝沒開著、false＝現在不能關（等一下再叫）。
    //   held(元素)＝手指／滑鼠還按在它裡面（拉條拉到一半、正在點）→ 先不關。
    //   工具列的視窗（背包、設定）走 ✕ 那條路（closeWin），但只關這一個——✕ 是 closeAll(true)，會連 NPC 對話、強化視窗、所有小視窗一起收，玩家自己開的別的也會被關掉。
    //   設定頁改了就存（onBodyChange 當場送伺服器），沒有「還沒按儲存」的狀態；只有數字欄打到一半（change 要離開欄位才發）→ 先 blur，照平常那條路送出去再關。
    //   強化視窗：蓄力、結果特效、連續強化還在跑就等它（enh.busy），不然看不到最後那張「強化成功」
    const TUT_OV = { slotpick: 'lmui-slotpick', aspick: 'lmui-aspick', hotpick: 'lmui-hotpick', polymenu: 'lmui-polymenu' };   // polymenu：設定自動變身那步（選了外型本來就會關，保險）
    function tutClose(id, held) {
        if (id === 'enh') {
            if (!enh.isOpen()) return null;
            if (enh.busy() || held($('enh-window'))) return false;
            enh.close(); return true;
        }
        if (id === 'craft') {
            if (!craft.isOpen()) return null;
            if (held($('lmui-craft'))) return false;
            craft.close(); return true;
        }
        if (TUT_OV[id]) {
            const ov = $(TUT_OV[id]);
            if (!ov) return null;
            if (held(ov)) return false;
            ov.remove(); return true;   // 同小視窗的 ✕（overlay）
        }
        if (!WIN[id]) return null;
        if (isPc() && id === 'items' && !alt.win) return null;   // 電腦介面的背包開在右邊那個視窗（還沒建＝沒開過）
        const r = inSide(id, () => {
            if (cur !== id || el.win.classList.contains('hidden')) return null;
            if (held(el.win)) return false;
            const a = document.activeElement;
            if (a && a !== document.body && el.win.contains(a) && a.blur) a.blur();   // 數字欄打到一半：blur 會發 change → onBodyChange 送伺服器
            closeWin();
            return true;
        });
        if (r) { document.body.classList.toggle('lmui-win-open', !!(cur || alt.cur)); syncTools(); }
        return r;
    }
    function toggleTool(id) {
        // 聊天視窗一直在：這顆跟 ▲ 一樣切換高度。
        //   別的視窗開著時（手機：聊天框被藏起來；電腦：視窗蓋在聊天框上）先把視窗都關掉、回到聊天框，不切高度（站長 2026-10-20「點擊聊天按鈕沒辦法回到聊天視窗」）
        if (id === 'chat') { if (cur || alt.cur || document.querySelector(COVER)) closeAll(); else cycleChat(); return; }
        inSide(id, () => {
            const keepCraft = isPc() && id === 'items';
            if (cur === id) { closeAll(true, keepCraft); return; }
            closeAll(true, keepCraft); cur = id;
            // 狩獵場一律開傳送點（「此地圖 NPC」分頁 2026-10-24 拿掉）
            openWin(id, id === 'battle' ? TP_TAB : undefined);
        });
        syncTools();
    }
    function syncTools() {
        root.querySelectorAll('.lmui-tool').forEach(b => { const t = b.getAttribute('data-tool'); b.classList.toggle('on', t === cur || t === alt.cur); });
    }
    root.querySelector('#lmui-nav').addEventListener('click', e => { const b = e.target.closest('.lmui-tool'); if (b) toggleTool(b.getAttribute('data-tool')); });
    root.querySelector('#lmui-whead button').addEventListener('click', () => { closeAll(true); });

    // ── 電腦介面：左右各一個視窗（站長 2026-10-18「像原版一樣不會擋住正中間，且可以拉動背包等介面位置」）──
    //   背包（含裝備欄、自動賣出）開在右邊 #lmui-win2，其他開在左邊 #lmui-win（原本那個）；位置、拖動、記位置在 pcui.js。
    //   這份程式原本只有一個視窗（cur、winTab… 都是那一個的）：平常一律是左邊那份；要動右邊時 swapSide 把這些變數、元素（含 id）跟右邊那份對調，做完再換回來。
    //   手機介面不建右邊那個，inSide／onOther 什麼都不做（跟原本一模一樣）
    const SWAP_IDS = ['win', 'whead', 'wtabs', 'wbody'];
    function swapSide() {
        [cur, alt.cur] = [alt.cur, cur]; [winTab, alt.winTab] = [alt.winTab, winTab]; [fromFace, alt.fromFace] = [alt.fromFace, fromFace];
        [pending, alt.pending] = [alt.pending, pending]; [settingsSig, alt.settingsSig] = [alt.settingsSig, settingsSig]; [battleSig, alt.battleSig] = [alt.battleSig, battleSig];
        [el.win, alt.win] = [alt.win, el.win]; [wbody, alt.body] = [alt.body, wbody];
        const a = SWAP_IDS.map(k => $('lmui-' + k)), b = SWAP_IDS.map(k => $('lmui-' + k + '2'));
        a.forEach((x, i) => { x.id = 'lmui-' + SWAP_IDS[i] + '2'; }); b.forEach((x, i) => { x.id = 'lmui-' + SWAP_IDS[i]; });
        swapped = !swapped;
    }
    function onOther(fn) { if (!alt.win) return; swapSide(); try { return fn(); } finally { swapSide(); } }
    // 視窗 id 開在哪一側：電腦介面的背包在右邊
    function inSide(id, fn) {
        if (isPc() && id === 'items') ensureRight();
        const right = !!alt.win && isPc() && id === 'items';
        return right === swapped ? fn() : onOther(fn);
    }
    // 右邊那個視窗（第一次要用才建）：結構同 #lmui-win，id 尾巴加 2；分頁、內容的點擊都在右邊那份的變數下跑同一套處理
    let rightShell = null;
    function ensureRight() {
        if (rightShell) return;
        el.win.insertAdjacentHTML('afterend', '<div id="lmui-win2" class="hidden"><div id="lmui-whead2"><b></b><button type="button" aria-label="關閉">✕</button></div><div id="lmui-wtabs2" class="lm-tabs"></div><div id="lmui-wbody2"></div></div>');
        rightShell = $('lmui-win2');
        syncCover();   // 開始監看它的 class（打開、關掉時跑馬燈跟著淡／回來）
        alt.win = rightShell; alt.body = $('lmui-wbody2');
        const R = f => e => inSide('items', () => f(e));
        $('lmui-whead2').querySelector('button').addEventListener('click', R(() => closeAll(true)));
        $('lmui-wtabs2').addEventListener('click', R(onWinTabs));
        alt.body.addEventListener('click', R(onBodyClick)); alt.body.addEventListener('change', R(onBodyChange)); alt.body.addEventListener('input', R(onBodyInput));
        pcShell(rightShell, $('lmui-whead2')); frameScan();
    }
    // 換成手機介面：右邊的收掉；換成電腦介面：手機時開在唯一那個視窗的背包搬到右邊
    //   開著的視窗照新版面重畫（設定的「視窗位置重設」只有電腦版面有：橫式開的設定轉回直式還留著那顆）
    pcModeChange(pc => {
        if (!pc) {
            // 右邊開著背包：手機只有一個視窗，左邊空著就把背包搬過來，左邊有開別的就收掉背包；
            //   不管哪種都要重算 lmui-win-open（原本收掉背包卻留著它，直式的 AUTO、強制、掛機紀錄一直藏著點不到）
            const bag = alt.cur === 'items' ? { t: alt.winTab, ff: alt.fromFace } : null;
            onOther(closeWin);
            if (bag && !cur) { cur = 'items'; fromFace = bag.ff; openWin('items', bag.t); } else if (cur) renderWin();
            document.body.classList.toggle('lmui-win-open', !!(cur || alt.cur)); syncTools(); return;
        }
        if (cur === 'items') { const t = winTab, ff = fromFace; closeWin(); inSide('items', () => { cur = 'items'; fromFace = ff; openWin('items', t); }); syncTools(); }
        else if (cur) renderWin();
    });
    const WIN = {
        battle: { title: '狩獵場', tabs: [TP_TAB] },   // 「此地圖 NPC」分頁拿掉（站長 2026-10-24「取消此地圖NPC 傳送點分頁」）；那頁的程式留著沒用到
        stats: { title: '角色', tabs: ['能力', '隊伍', '血盟', '好友'] },   // 好友：伺服器第 584 項（站長 2026-11-02）
        skill: { title: '魔法', tabs: null },
        items: { title: '背包', tabs: ['全部', '武器', '防具', '道具', '裝備欄'] },   // 「自動賣出」移到背包左下（bagFoot）
        automation: { title: '設定', tabs: AS_TABS },
    };
    function openWin(id, tab) {
        const w = WIN[id];
        const tabs = $('lmui-wtabs');
        winTab = w.tabs ? (tab || w.tabs[0]) : '';
        tabs.style.display = w.tabs && w.tabs.length > 1 ? '' : 'none';   // 只有一個分頁（狩獵場「傳送點」，站長 2026-10-24「傳送點標題移除」）不畫分頁列
        // 背包「全部」帶 ⇅：已經在「全部」時再點一次＝整理背包（同單機版 pickBagCat）
        tabs.innerHTML = w.tabs ? w.tabs.map(t => '<button type="button" data-w="' + t + '"' + (t === '全部' ? ' title="再點一次整理背包"' : '') + '>' + t +
            (id === 'items' && t === '全部' ? '<span class="lmui-tabicon" aria-hidden="true">⇅</span>' : '') + '</button>').join('') : '';
        el.win.classList.remove('hidden'); document.body.classList.add('lmui-win-open');
        el.win.setAttribute('data-w', id);
        battleSig = ''; if (id === 'battle') { npcArea = ''; tpSeen.clear(); }   // 此地圖 NPC：每次打開先列自己所在那區；傳送點：每次打開先展開所在那張卡
        if (id === 'skill' && cb.learnList) cb.learnList();   // 花金幣學魔法：每次打開跟伺服器要清單（價錢伺服器可以改；舊伺服器不回）
        renderWin();
        pcPlace(el.win);   // 電腦介面：放到這種視窗記住的位置（沒拖過＝背包靠右、其他靠左）
    }
    function onWinTabs(e) {
        const b = e.target.closest('button[data-w]'); if (!b) return;
        const t = b.getAttribute('data-w');
        if (cur === 'items' && t === '全部' && winTab === '全部') { sortBag(); toast('背包整理好了'); }
        if (t !== '裝備欄') fromFace = false;
        winTab = t; renderWin();
    }
    $('lmui-wtabs').addEventListener('click', onWinTabs);
    function renderWin() {
        if (!cur || cur === 'chat') return;
        $('lmui-wtabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.getAttribute('data-w') === winTab));
        setTxt(el.win.querySelector('#lmui-whead b'), cur === 'items' && winTab === '裝備欄' && fromFace ? '裝備' : WIN[cur].title);
        el.win.classList.toggle('w-doll', cur === 'items' && winTab === '裝備欄');
        const body = $('lmui-wbody');
        if (cur !== 'automation') settingsSig = '';
        if (cur === 'battle') renderBattle(body);
        else if (cur === 'stats') renderStats(body);
        else if (cur === 'items') { if (winTab === '裝備欄') renderDoll(body); else { figStop(); renderBag(body); } }
        else if (cur === 'skill') renderSkills(body);
        else renderSettings(body);
    }

    // ── 能力（同單機版能力頁：上方六圍彩色方塊，下方明細；推算公式照 3.50c，見 calc.js） ──
    function renderStats(body) {
        if (winTab === '血盟' && cb.clan) { cb.clan.renderTab(body); return; }   // 血盟名、成員、盟主的管理鈕（clan.js）
        if (winTab === '隊伍' && cb.party) { cb.party.renderTab(body); return; }
        if (winTab === '好友' && cb.friend) { cb.friend.renderTab(body); return; }   // 好友名單、加好友、密語、傳送（friend.js）   // 隊員、血量、隊長的踢人／委任、退出（party.js）
        body.onclick = null;   // 血盟分頁掛的點擊處理（同一個 body 換分頁共用）
        if (winTab !== '能力') { body.innerHTML = '<div class="lmui-soon">未完成</div>'; return; }
        const s = state, wl = weightLook(s.weight);
        const six = [['str', '力量'], ['int', '智力'], ['dex', '敏捷'], ['wis', '精神'], ['con', '體質'], ['cha', '魅力']];
        const rows = [['等級', s.level], ['經驗值', (s.exp || 0).toLocaleString() + '（' + expPercent(s.level, s.exp || 0).toFixed(2) + '%）'], ['體力', (s.hp || 0) + ' / ' + (s.maxHp || 0)],
            ['魔力', (s.mp || 0) + ' / ' + (s.maxMp || 0)], ['防禦', s.ac], ['魔防', totalMr(s) + '%'], ['正義值', s.lawful || 0]];
        // 用戶端狀態視窗的兩條量表「負重程度」「飽食程度」（string-c 608／609；站長 2026-10-18「依照 3.5 客戶端」）。
        //   用戶端量表的圖沒抽出來 → 跟背包負重條同一種（.bw-bar）；負重照 weight242（有目前／上限就用它）、顏色同背包（≥120 黃、≥197 紅），飽食度 food 0～225
        const wr = s.wMax > 0 ? s.wCur / s.wMax : (s.weight || 0) / 242, fr = (s.food || 0) / 225;
        const gauge = (label, r, cls) => { const p = Math.max(0, Math.min(1, r)) * 100; return '<div class="ab-gauge' + (cls ? ' ' + cls : '') + '"><div class="ag-txt"><span>' + label + '</span><b>' + Math.round(p) + '%</b></div>' +
            '<div class="bw-bar"><i style="width:' + p.toFixed(1) + '%"></i></div></div>'; };
        const gauges = '<div class="ab-gauges">' + (s.weight != null ? gauge('負重程度', wr, wl && wl.cls) : '') + (s.food != null ? gauge('飽食程度', fr) : '') + '</div>';
        const der = derived(s, cb.base ? cb.base() : null, equipped());
        const cut = der.indexOf(null);
        const rs = (i, v) => { const x = realStat(s, i); return x != null ? x : v; };   // 屬性抗性：伺服器送了實際值（S_Web 22）就用它的
        const res = [['火屬性抗性', rs(17, s.fire)], ['水屬性抗性', rs(18, s.water)], ['風屬性抗性', rs(19, s.wind)], ['地屬性抗性', rs(20, s.earth)], ['寵物傷害', '+' + petDmg(s.cha)],
            ['祝福值', blessStat(s, equipped()).v + '%', 'ab-tip', 'data-stip="bless" role="button"']];   // 第 171 項：移上去／點一下看說明（AUX_TIP.bless）
        const list = a => '<div class="ab-list">' + a.map(x => '<div' + (x[2] ? ' class="' + x[2] + '"' : '') + (x[3] ? ' ' + x[3] : '') + '><span>' + x[0] + '</span><b>' + esc(x[1] ?? '') + '</b></div>').join('') + '</div>';
        const hid = HIDDEN_CHA[s.type] || 0;
        const val = k => (s[k] ?? '') + (k === 'cha' && hid && s.cha != null ? '<small class="ab-hid">（隱藏＋' + hid + '）</small>' : '');
        // 51 級起沒點的升級點數（candle.js）：能力頁最上面一顆入口
        const bl = cb.bonusLeft ? cb.bonusLeft() : 0;
        // 自己設封號（沒有血盟、40 級以上；clan.js selfTitleState，null＝不放）
        const ttl = cb.selfTitle ? cb.selfTitle(s.level) : null;
        if (bl > 0 || ttl) body.onclick = e => { if (e.target.closest('[data-bonus]') && cb.bonusOpen) cb.bonusOpen(); else if (e.target.closest('[data-stitle]') && cb.selfTitleOpen) cb.selfTitleOpen(); };
        body.innerHTML = (bl > 0 ? '<button type="button" class="ab-bonus" data-bonus>能力點數 <b>' + bl + '</b>　分配</button>' : '') +
            (ttl ? '<button type="button" class="ab-stitle' + (ttl.lock ? ' lock' : '') + '" data-stitle' + (ttl.lock ? ' disabled' : '') + '><span>封號</span><b>' + (ttl.lock ? '40 級才能設定封號' : (ttl.title ? '<i style="font-style:normal;color:' + parseTitle(ttl.title).color + '">' + esc(parseTitle(ttl.title).text) + '</i>' : '沒有')) + '</b>' + (ttl.lock ? '' : '<em>' + (ttl.title ? '更改' : '設定') + '</em>') + '</button>' : '') + '<div class="ab-grid">' + six.map(x => '<div class="ab-' + x[0] + '"><em>' + x[1] + '</em><b>' + val(x[0]) + '</b></div>').join('') + '</div>' +
            list(rows) + gauges + (wl ? '<div class="wt-note ' + wl.cls + '">' + wl.note + '</div>' : '') +
            list(der.slice(0, cut)) + list(der.slice(cut + 1)) + list(res.map(r => [r[0], r[1] ?? 0, r[2], r[3]])) + honorList() + collectList();
    }
    // 裝備蒐藏的加成（伺服器第 457 項：HP、防禦…已經算進上面的數值；PvP 傷害、狩獵經驗只在這裡看得到）
    function collectList() {
        const t = cb.collectSum ? cb.collectSum() : [];
        return t && t.length ? '<div class="ab-list ab-honor"><div><span>裝備蒐藏</span><b>' + esc(t.join('、')) + '</b></div></div>' : '';
    }
    // 特殊封號的附加能力（伺服器第 166 項：已經算進上面的數值；main.js cb.honors → top1.js top1Honors）
    function honorList() {
        const hs = cb.honors ? cb.honors() : [];
        return hs.length ? '<div class="ab-list ab-honor">' + hs.map(h => '<div><span>' + cb.honorTag(h) + '</span><b>' + esc(h.text || '') + '</b></div>').join('') + '</div>' : '';
    }

    // ── 背包：5 欄方格；「全部」再點一次＝整理；點格子＝道具視窗 ──
    //   順序（道具物件編號清單）存在 localStorage、key 帶角色名（同快捷列），重登、重新整理接回來；物件編號重登不變。
    //   新拿到的接在最後；背包裡已經沒有的編號顯示時略過（伺服器的清單還沒送完時也不會被丟掉），累積太多才一次清掉
    let bagOrder = [], bagSig = '';   // 道具編號的顯示順序；bagSig＝上次寫進去的內容（有變才寫）
    function bagLoad(name) {
        bagOrder = [];
        try { const a = JSON.parse(localStorage.getItem(BAG_KEY + name) || '[]'); if (Array.isArray(a)) bagOrder = a.filter(Number.isInteger).slice(0, BAG_KEEP); } catch (e) { /* 壞掉就當沒存過 */ }
        bagSig = bagOrder.join(',');
    }
    function bagSave() {
        const sig = bagOrder.join(',');
        if (!hotOwner || sig === bagSig) return;
        bagSig = sig;
        try { localStorage.setItem(BAG_KEY + hotOwner, JSON.stringify(bagOrder)); } catch (e) { /* 無痕、滿了 */ }
    }
    function bagList() {
        const all = parsedItems(), byId = new Map(all.map(p => [p.id, p])), have = new Set(bagOrder);
        for (const p of all) if (!have.has(p.id)) bagOrder.push(p.id);
        if (bagOrder.length > BAG_KEEP) bagOrder = bagOrder.filter(id => byId.has(id));
        bagSave();
        return bagOrder.filter(id => byId.has(id)).map(id => byId.get(id));
    }
    // 背包整理（站長 2026-10-18「法書、道具、武器、防具，這樣排放整齊」）：法書 → 道具 → 武器 → 防具，裝備中的在前，同類照名字；同名的照 祝福→一般→詛咒；強化高的在前。
    //   法書＝學魔法、學技能的書（魔法書、精靈水晶、黑暗精靈水晶、王族／騎士的技術書…）＝道具表 type 是 spellbook；不寫死編號，背包名字對不到時用伺服器給的道具編號（S_Web 12）找
    const isBook = p => { const k = kindOf(p), t = p.tpl || (k ? (itemById(k) || {}).tpl : null); return !!(t && t.k === 'e' && t.type === 'spellbook'); };
    const SORT_RANK = p => isBook(p) ? 0 : p.cat === '道具' ? 1 : p.cat === '武器' ? 2 : 3;
    function sortBag() {
        bagOrder = bagList().sort((a, b) => SORT_RANK(a) - SORT_RANK(b) || (b.equipped - a.equipped) || a.base.localeCompare(b.base, 'zh-Hant') || a.bless - b.bless || b.en - a.en).map(p => p.id);
        bagSave();
    }
    // 道具圖示：祝福／詛咒／屬性的光效套在圖上（items.js glowCls，照單機版；格子照一般的）
    const itemImg = (icon, p) => { const g = glowCls(p); return '<img alt=""' + (g ? ' class="' + g + '"' : '') + ' src="' + esc(icon) + '">'; };
    // 法書（魔法書、精靈水晶、黑暗精靈水晶、技術書）：格子上緣寫括號裡的魔法名（站長 2026-10-21「方便玩家辨識」；圖示都長一樣）。
    //   站長同日「一行短名，需顯示完整名稱」「字體大小需要一致」「可以放第二行」：完整名稱、每格字一樣大（照格子寬放得下 5 個字，lmui.css .bk）；
    //   5 個字以內一行，6 個字以上平均分兩行（has-bk2：圖示再往下挪、小一點，不被字蓋到）；數量在右下
    const BOOK_RE = /[(（]([^()（）]+)[)）]\s*$/;
    function bookTag(p) {
        const m = isBook(p) ? BOOK_RE.exec(p.base || '') : null;
        if (!m) return '';
        const t = [...m[1].trim()], per = Math.ceil(t.length / 2);
        return t.length > 5 ? '<span class="bk bk2">' + esc(t.slice(0, per).join('')) + '<br>' + esc(t.slice(per).join('')) + '</span>' : '<span class="bk">' + esc(t.join('')) + '</span>';
    }
    // 法書道具視窗的按鈕（站長 2026-10-21「技能書、水晶使用按鈕改成學習，有學習過的技能變成已學習」）：括號裡的名字對技能表（skills.json），
    //   學會了（S_AddSkill 的位元遮罩）＝「已學習」灰掉；這個職業學不到（skill-learn.json 沒有那一級、例外標 null；例：騎士拿精靈水晶）＝「不能學」灰掉；
    //   精靈屬性魔法（站長同日「妖精四屬性魔法需選擇屬性之後才能學習」）：學會的屬性魔法看得出選了哪個屬性、跟這本不合＝灰掉、寫原因；看不出來（還沒學過屬性魔法）照舊讓伺服器回。
    //   對不到技能表＝照舊「學習」。學不學得會照樣伺服器說了算（本機改動第 75 項：學過的不扣書、屬性不合說原因）。
    //   戴魔法頭盔時頭盔給的魔法也在遮罩裡（伺服器 L1EquipmentSlot.setMagicHelm），分不出真的學過沒 → 那幾個照「學習」讓伺服器判斷
    const HELM_SK = { 20008: [43], 20013: [26, 43], 20014: [1, 19], 20015: [12, 13, 42], 20023: [43, 54] };
    //   誰戴得了（armor 表的職業、最低等級；伺服器第 737 項 AUTO 換頭盔也照這關）：[職業 state.type…, 最低等級]
    const HELM_CAN = { 20008: [[1, 2, 3], 30], 20013: [[0, 1], 0], 20014: [[0, 1], 0], 20015: [[0, 1], 0], 20023: [[3], 45] };
    const helmWearable = id => { const c = HELM_CAN[id]; return !c || (c[0].includes(state.type || 0) && (state.level || 0) >= c[1]); };
    //   職業 → skill-learn.json 的鍵（CLS_KEY）、屬性名（ATTR_NAME：1 地、2 火、4 水、8 風）在魔法視窗那段
    function bookSkill(p) {
        const m = isBook(p) ? BOOK_RE.exec(p.base || '') : null;
        return m ? skillList().find(x => x.name === m[1].trim()) || null : null;
    }
    // 離線版技能視窗按了「解除限制」：學魔法不看職業、等級、屬性
    function skFree() { return !!(cb.skillFree && cb.skillFree()); }
    function classCanLearn(sk) {
        if (skFree()) return true;
        const c = ((cb.skillLearn ? cb.skillLearn() : null) || {})[CLS_KEY[state.type]];
        if (!c) return true;   // 讀不到表、不知道職業：當學得到
        const exc = c.exceptions || {};
        if (Object.prototype.hasOwnProperty.call(exc, sk.sid)) return exc[sk.sid] != null;
        return (c.levels || {})[sk.lv] != null;
    }
    // 回 null＝不是法書；{ t 按鈕字, off 灰掉, why 灰掉的原因（寫在視窗裡） }
    function bookBtn(p) {
        if (!isBook(p)) return null;
        const sk = bookSkill(p);
        if (!sk) return { t: '學習' };
        if (!classCanLearn(sk)) return { t: '不能學', off: true };
        const helm = equipped().some(q => (HELM_SK[kindOf(q)] || []).includes(sk.sid));
        if (sk.learned && !helm) return { t: '已學習', off: true };
        if (!skFree() && state.type === 2 && sk.lv >= 17 && ATTR_NAME[sk.attr]) {
            const mine = skillList().find(x => x.learned && x.lv >= 17 && ATTR_NAME[x.attr]);
            if (mine && mine.attr !== sk.attr) return { t: '學習', off: true, why: '這是' + ATTR_NAME[sk.attr] + '屬性的魔法，你選的是' + ATTR_NAME[mine.attr] + '屬性。' };
        }
        return { t: '學習' };
    }
    // 第 133 項（站長 2026-10-23「商店買魔法書，改成買了直接學習」）：商店購買清單的書／水晶（名字照 BOOK_RE 對技能表）→ 按鈕
    //   null＝不是書（照一般「購買」）；{ t 按鈕字, off 灰掉 }。只是顯示，伺服器 web/WebShopLearn 照原版讀書的規則再判斷一次
    const SHOP_BOOK = /^(魔法書|精靈水晶|黑暗精靈水晶|技術書)\s*[(（]/;
    function shopBook(name) {
        const base = (name || '').replace(/\s*\(\d+\)$/, '').trim(), m = SHOP_BOOK.test(base) ? BOOK_RE.exec(base) : null;
        if (!m) return null;
        const sk = skillList().find(x => x.name === m[1].trim());
        if (!sk) return { t: '學習' };
        if (!classCanLearn(sk)) return { t: '其他職業', off: true };
        const helm = equipped().some(q => (HELM_SK[kindOf(q)] || []).includes(sk.sid));
        if (sk.learned && !helm) return { t: '已學會', off: true };
        const c = ((cb.skillLearn ? cb.skillLearn() : null) || {})[CLS_KEY[state.type]], exc = (c && c.exceptions) || {};
        const need = c ? (Object.prototype.hasOwnProperty.call(exc, sk.sid) ? exc[sk.sid] : (c.levels || {})[sk.lv]) : null;
        if (skFree()) return { t: '學習' };
        if (need && (state.level || 0) < need) return { t: '需 Lv' + need, off: true };
        if (state.type === 2 && sk.lv >= 17 && ATTR_NAME[sk.attr] && sk.attr !== 16) {
            let mine = cb.elfAttr ? cb.elfAttr() : null;
            if (mine == null) { const l = skillList().find(x => x.learned && x.lv >= 17 && ATTR_NAME[x.attr] && x.attr !== 16); mine = l ? l.attr : null; }
            if (mine != null && mine !== sk.attr) return { t: '需' + ATTR_NAME[sk.attr] + '屬性', off: true };
        }
        return { t: '學習' };
    }
    // 道具視窗開著時學會了（S_AddSkill → refreshWin）：按鈕跟著換
    function refreshBookBtn() {
        const w = sellWin; if (!w || !w.ov.isConnected) return;
        const bb = bookBtn(w.p), b = w.ov.querySelector('[data-a="use"]'); if (!bb || !b) return;
        b.textContent = bb.t; b.disabled = !!bb.off;
        const why = w.ov.querySelector('.iw-why');
        if (why) { why.hidden = !bb.why; why.textContent = bb.why || ''; }
    }
    // n＝這格疊了幾件同款裝備（stacks）；疊起來的跟會疊的道具一樣，右下角顯示數量
    // AUTO 補給會用、會自動買的道具（站長 2026-11-01「自動購買的道具背包顯示 AUTO 以免誤刪」→ 同日改「不要顯示 AUTO，有點亂；有自動購買的道具不能刪除」）：
    //   照現在打開的補給、狩獵設定（同補給頁 補給() 選的那幾種）算；道具視窗的「刪除」、自動賣出清單設成「刪除」都擋（keepBlocked）
    const KEEP_MSG = 'AUTO 補給會用到，不能刪除（要刪先到設定關掉那一項）';
    const keepBlocked = id => { const s = cb.autoSettings ? cb.autoSettings() : null; return !!id && autoKeep(s).has(id % 100000); };
    function autoKeep(s) {
        const k = new Set(); if (!s) return k;
        const f = s.flags || 0, on = (bit, ...ids) => { if (f & bit) ids.forEach(id => id && k.add(id)); };
        if (s.potion > 0) k.add(tKeep(s, 'potion') || PICK_POTS[0]);
        if (s.homeHpPct > 0) k.add(40079);
        if (f & (16384 | 2097152)) k.add(40100);
        if (s.repairMode > 0) k.add(40317);
        on(2048, 40744); on(4096 | 256, 40889);
        on(1, greenPick(s)); on(2, BRAVE[state.type || 0] && BRAVE[state.type || 0][0], BRAVE[state.type || 0] && HONOR_COIN); on(4, 40015); on(8, 40016); on(CAKE_BIT, CHOCO_CAKE);
        on(4194304, breathPick(s)); on(BLESS_BIT, blessPick(s)); on(16, cureItem(s), CURE_POT); on(131072, HOLY_SCROLL); on(128, 40088);
        if (f & 1048576) { const xp = expPick(s); (xp ? [xp] : EXP_POTS).forEach(id => k.add(id)); }
        return k;
    }
    // 站長 2026-11-02「這個又沒改到」：傲慢之塔樓層小牌子（名字尾巴「(21F)」）共用一個，背包、掛機紀錄的獲得道具、快捷格都用（樣式 lmui.css .fl-tag）
    function flTag(name) { const m = /\((\d{1,3}F)\)$/.exec(name || ''); return m ? '<span class="fl-tag">' + m[1] + '</span>' : ''; }
    function cellHtml(p, cls, n) {
        const icon = cb.itemIcon(p), wu = n > 1 ? 0 : wandUses(p), cnt = n > 1 ? n : wu || p.count, bk = bookTag(p);   // 魔杖：右下角＝剩幾次（剩 1 次也顯示）
        // 站長 2026-11-02「奧卷改這樣才知道打到幾樓」：名字尾巴的短括號（傲慢之塔傳送符(21F)）做成圖示右上的小牌子，同製作工匠的格子（craft.js cellHtml）；圖示上原本畫的小數字被它蓋掉
   // 只認樓層「(21F)」：魔法書的「(體能激發)」那種名字已經有自己的小牌子（bookTag），不再疊一個（站長 2026-11-02「為啥顯示兩個體能字體」）
        return '<div class="' + cls + (bk ? ' has-bk' + (bk.includes('bk2') ? ' has-bk2' : '') : '') + '" data-id="' + p.id + '" title="' + esc(p.full) + '">' +
            (icon ? itemImg(icon, p) + hsFx(p) : '<span class="nm">' + esc(p.base) + '</span>') + bk + hcTag(p) + lockTag(p) + flTag(p.base) +
            (p.en ? '<span class="en">' + (p.en > 0 ? '+' : '') + p.en + '</span>' : '') + (cnt > 1 || wu ? '<span class="cnt">' + cnt.toLocaleString() + '</span>' : '') + '</div>';
    }
    // 「自動賣出」分類（版面同單機版 afk-lmui 的自動賣出清單）：下拉選道具＋新增，每列 圖示／名稱（每個幾金幣／沒有收購）／點此移除。
    //   下拉＝背包裡現在有的道具種類（站長 2026-10-18：「要有打到物品，物品有在背包才可以點選」），照 武器／防具／道具 分組、組內照名字，上面的輸入框打字篩選。
    //   清單存在伺服器（AUTO 設定的 sell，同道具視窗的「自動賣出／自動刪除」鈕），伺服器每 10 秒照商店收購價賣掉清單裡的
    //   （AUTO 開關都會；穿著的、強化過、有屬性的不賣；商店不收的直接刪）
    //   第 412 項（站長 2026-10-28「祝福道具也可以跟一般道具一樣自動賣出」）：祝福的另外一項「祝福的 XXX」（asKey），跟一般版分開選
    //   背包每格是哪種道具照伺服器給的（S_Web 12）：道具視窗的「自動賣出」鈕用；伺服器還沒回的先照名字對道具表
    let asSig = '', invTpl = new Map(), invAskAt = 0;
    function setInvIds(m) { invTpl = m; inSide('items', () => { if (cur === 'items') { asSig = ''; renderWin(); } }); }   // 背包同款裝備疊成一格也照這個
    let asQ = '';   // 篩選字
    const AS_GROUP = ['武器', '防具', '道具'];
    // 金幣、項圈（裡面可能有寵物）、主城傳送石（綁定、刪不掉）、新手引導補的象牙塔強化卷軸（456 把武器卷軸加進來被刪光、強化武器那步卡死；伺服器第 162 項也不刪）不給加
    const AS_SKIP = new Set([40308, 40314, 40316, HOME_STONE, 49311, 49312, ...HONOR_CARDS]);   // 第 169 項：榮耀卡片（綁定、跟著封號走）
    // 下拉的選項：背包裡每種道具一個（已經在清單裡的不列）。穿著的、強化過、有屬性強化的那件不算——伺服器本來就不賣；
    //   同一種只要背包裡有一件沒強化的就列；祝福的另外列一項（第 412 項）
    function asOpts(listed) {
        const have = new Set(listed.map(Math.abs)), by = new Map();   // 負的＝設成刪除（第 119 項）
        for (const p of bagList()) {
            const kind = kindOf(p), id = asKey(p);
            if (!id || have.has(id) || by.has(id) || AS_SKIP.has(kind) || p.equipped || p.en || p.hasAttr) continue;
            const t = itemById(kind), nm = t ? t.name : p.base;
            if ((p.cat === '武器' || p.cat === '防具') && String(nm).startsWith('象牙塔')) continue;   // 第 397 項：新手送的象牙塔武器、防具不給加（商店不收＝加了就被刪；伺服器 WebCare.ivoryGear 也不動）
            by.set(id, { id, name: asBlessWord(p.bless, nm), g: Math.max(0, AS_GROUP.indexOf(p.cat)) });
        }
        return [...by.values()].sort((a, b) => a.g - b.g || a.name.localeCompare(b.name, 'zh-Hant'));
    }
    // 第 412 項：自動賣出清單裡這件是哪一項（伺服器 WebSellKeep.blessKey 同一條規則，改一邊另一邊也要改）：
    //   祝福的＝祝福版道具編號（1xxxxx，一般版 + 100000）；一般編號的祝福品（祝福賦予卷軸做的、古老的金幣這種天生祝福的）也 + 100000，跟同款祝福版同一項
    const asKey = p => { const id = kindOf(p); return id && p.bless === 0 && id < 100000 ? id + 100000 : id; };
    const asBlessWord = (b, nm) => (b === 0 && !/^受?祝福/.test(nm) ? '祝福的 ' : '') + nm;   // 用詞同背包（items.js BLESS_WORD）
    function asOptions(opts) {
        const q = asQ.trim(), list = opts.filter(o => !q || o.name.includes(q));
        if (!list.length) return '<option value="">' + (opts.length ? '沒有符合的道具' : '背包裡沒有可以加的道具') + '</option>';
        let h = '', g = -1;
        for (const o of list) {
            if (o.g !== g) { h += (g >= 0 ? '</optgroup>' : '') + '<optgroup label="' + AS_GROUP[o.g] + '">'; g = o.g; }
            h += '<option value="' + o.id + '">' + esc(o.name) + '</option>';
        }
        return h + '</optgroup>';
    }
    // 打字篩選：只換下拉的選項（整個分頁重畫會讓輸入框失去焦點）
    function asFilter(body) {
        const s = cb.autoSettings ? cb.autoSettings() : null, sel = body.querySelector('[data-assel]'), add = body.querySelector('[data-asadd]');
        if (!s || !sel) return;
        sel.innerHTML = asOptions(asOpts(s.sell || []));
        if (add) add.disabled = !sel.value;
    }
    function renderAutoSell(body) {
        const s = cb.autoSettings ? cb.autoSettings() : null;
        if (!s) { body.innerHTML = '<div class="lmui-soon">讀取中…</div>'; asSig = ''; return; }
        const bag = bagList();
        if (cb.invIds && bag.some(p => !invTpl.has(p.id)) && Date.now() - invAskAt > 1500) { invAskAt = Date.now(); cb.invIds(); }
        const listed = s.sell || [], opts = asOpts(listed), keep = invTpl.supply || null;   // keep：自動補給會用到、伺服器不會賣的（S_Web 12 尾端，第 57 項）
        const cardSt = cb.cardKnown && cb.cardKnown() ? (cb.hasCard() ? 1 : 0) : -1;   // 第 119 項：月卡（S_Web 41）；-1＝還沒收到，頂端不放狀態卡
        const sig = JSON.stringify([listed, opts.map(o => o.id), !!SHOP_SELL, keep ? listed.filter(id => keep.has(id)) : 0, cardSt, asArm]);   // 背包多了／少了一種道具：下拉跟著換
        if (sig === asSig && body.querySelector('.lmas')) return;
        const act = document.activeElement; if (act && body.contains(act) && act.matches('[data-assel], [data-asq]')) return;   // 正在選、正在打字：別把它重畫掉
        asSig = sig;
        const opt = asOptions(opts);
        let h = '<div class="lmas"><input type="search" class="lmas-q" data-asq="1" value="' + esc(asQ) + '" placeholder="打字篩選，例如：魔法杖" autocomplete="off" enterkeyhint="search" aria-label="篩選道具">' +
            '<div class="lmas-add"><select data-assel="1" aria-label="要自動賣出的道具">' + opt + '</select>' +
            '<button type="button" data-asadd="1"' + (opt.startsWith('<option value="">') ? ' disabled' : '') + '>新增</button></div>';
        if (cardSt >= 0) h = h.replace('<div class="lmas">', '<div class="lmas">' + cardStatus(cardSt === 1));   // 頂端狀態卡（sellcard.js；沒月卡的「開通月卡」＝data-scshop）
        if (!listed.length) h += '<div class="lmas-empty">' + (cardSt === 0 ? '選道具按「新增」再選「刪除」：撿到就自動刪除（強化過、有屬性的不動）。' :
            '選道具按「新增」：背包裡的這種道具會自動賣掉，商店不收的直接刪除（強化過、有屬性的不動）。') + '</div>';
        for (const sid of listed) {
            const id = Math.abs(sid), del = sid < 0;   // 負的＝玩家設成「刪除」（商店收也刪，第 119 項）
            // 祝福版（道具編號 +100000）跟一般版同一個名字碼，道具表只記一般版 → 找一般版、名字前加字；
            //   舊清單裡的詛咒版（+200000，2026-10-19 起伺服器換成一般版）照一般版的名字、不加字；
            //   一般編號 + 100000 的祝福品（asKey，第 412 項：古老的金幣這種）沒有自己的收購價＝照一般編號（同伺服器照實際道具編號算）
            const own = itemById(id), t = own || (id >= 100000 ? itemById(id % 100000) : null);
            const name = t ? (own || id >= 200000 ? t.name : asBlessWord(0, t.name)) : '道具 ' + id;
            const pr = SHOP_SELL ? SHOP_SELL[id] || (id >= 100000 && id < 200000 ? SHOP_SELL[id - 100000] : null) : null, sup = keep && keep.has(id);
            // 商店收的：右邊「賣出｜刪除」切換（改成刪除要按第二下）；商店不收的本來就是刪除
            //   沒月卡（cardSt 0）：「賣出」掛鎖、按了跳「自動賣出要月卡」小卡（sellcard.js autoAsk）；設成賣出的那列寫「沒有月卡：留在背包」
            const nc = cardSt === 0;
            const mode = pr && !sup ? '<span class="lmas-mode"><button type="button" data-asmode="' + id + '" data-m="s" class="' + (del ? '' : 'on') + (nc ? ' sc-locked" data-lock="1' : '') + '">' + (nc ? lockTxt('賣出') : '賣出') + '</button>' +
                '<button type="button" data-asmode="' + id + '" data-m="d"' + (nc ? ' data-nc="1"' : '') + ' class="' + (del ? 'on' : '') + (asArm === id ? ' armed' : '') + '">' + (asArm === id ? '確定刪除' : '刪除') + '</button></span>' : '';
            h += '<div class="lmas-row"><span class="lmas-ico"><img alt="" src="' + esc(cb.itemIcon({ name, nid: t && t.nid })) + '"></span><span class="lmas-name">' + esc(name) +
                (keep && keep.has(id) ? '<small>補給用，不賣</small>' :   // 伺服器會自動買來用的（寵物食物、補給設定裡的藥水、卷軸…）：買了又賣會一直循環，伺服器不賣
                SHOP_SELL ? (pr ? (del ? '<small class="del">自動刪除</small>' : nc ? '<small class="sc-keep">沒有月卡：留在背包</small>' : '<small>每個 ' + pr.toLocaleString() + ' 金幣</small>') : '<small class="del">沒有收購・直接刪除</small>') : '') + mode + '</span>' +
                '<button type="button" class="lmas-del" data-asdel="' + id + '">點此移除</button></div>';
        }
        body.innerHTML = h + '</div>';
    }
    function autoSellAdd(body) {
        const sel = body.querySelector('[data-assel]');
        autoSellAddId(sel ? +sel.value : 0);
    }
    // 回 true＝在清單裡了（原本就有也算）；滿了回 false、提示一句（伺服器第 446 項：上限照伺服器送的 maxSell（300），舊伺服器 100；
    //   原本 slice 掉多的照樣說「已設定」，伺服器那邊也丟掉）
    function autoSellAddId(id, del) {   // del＝設成刪除（存負的）
        const s = Object.assign({}, cb.autoSettings());
        if (!id) return false;
        if (del && keepBlocked(id)) { toast(KEEP_MSG); return false; }
        if ((s.sell || []).some(x => Math.abs(x) === id)) return true;
        const max = s.maxSell || 100;
        if ((s.sell || []).length >= max) { toast('自動賣出清單滿了（' + max + ' 種），先移除用不到的再加。'); return false; }
        s.sell = (s.sell || []).concat([del ? -id : id]);
        s.flags |= 8192;   // 清單有東西就要真的會賣（同單機版）
        asSig = ''; cb.saveAutoSettings(s);
        return true;
    }
    function autoSellDel(id) {
        const s = Object.assign({}, cb.autoSettings());
        s.sell = (s.sell || []).filter(x => Math.abs(x) !== Math.abs(id));   // 賣出、刪除都拿掉
        if (!s.sell.length) s.flags &= ~8192;
        asSig = ''; cb.saveAutoSettings(s);
    }
    // 第 119 項：沒月卡按「自動賣出」→ 小卡：開通月卡／改成自動刪除／取消（已在清單＝移出清單）
    //   name＝確認那句的道具名；confirm＝直接進確認（清單沒月卡按「刪除」）
    function asAsk(id, listed, done, name, confirm) {
        if (!name) { const t = itemById(id) || (id >= 100000 ? itemById(id % 100000) : null); name = t ? t.name : ''; }
        autoAsk({ listed, name, confirm, openShop: () => { if (done) done(); if (cb.openShop) cb.openShop(); },
            toDel: () => { if (done) done(); if (listed) { asArm = id; autoSellMode(id, true); } else if (!autoSellAddId(id, true)) return; toast('已設定：撿到就自動刪除'); },
            remove: () => { if (done) done(); autoSellDel(id); toast('已移出自動賣出'); } });
    }
    // 第 119 項：清單裡的一種改成賣出／刪除（存成負的道具編號；伺服器沒月卡時也照刪）
    let asArm = 0, asArmTimer = 0;
    function autoSellMode(id, del) {
        const s = Object.assign({}, cb.autoSettings()), list = s.sell || [];
        const cur = list.find(x => Math.abs(x) === id); if (cur == null) return;
        if (del && keepBlocked(id)) { toast(KEEP_MSG); return; }
        if (del && cur > 0 && asArm !== id) { asArm = id; clearTimeout(asArmTimer); asArmTimer = setTimeout(() => { asArm = 0; asSig = ''; renderWin(); }, 3000); asSig = ''; renderWin(); return; }
        asArm = 0; clearTimeout(asArmTimer);
        const want = del ? -id : id; if (cur === want) { asSig = ''; renderWin(); return; }
        s.sell = list.map(x => (x === cur ? want : x));
        asSig = ''; cb.saveAutoSettings(s);
    }
    // 背包最下面一列（站長 2026-10-19「背包整理放背包介面右下角，左下新增分頁魔法娃娃、自動賣出，原本娃娃按鈕移過來」）：
    //   左＝魔法娃娃（打開娃娃視窗；伺服器有娃娃系統才出現）、自動賣出（背包裡的一頁，再點一次回「全部」），右＝背包整理（自動賣出那頁不放）。
    //   貼在背包內容的最底下（sticky），捲動時一直看得到
    function bagFoot() {
        const as = winTab === '自動賣出', doll = !!(cb.dollReady && cb.dollReady());
        // 小圖示＋底下小字（站長 2026-10-25「背包下方魔法娃娃、自動賣出、背包整理用個小圖示，新增一個信箱」）；信箱有未讀同 ⊞ 選單的紅點
        const bi = (attr, cls, ico, name, badge) => '<button type="button" class="bf-ic' + cls + '" ' + attr + ' aria-label="' + name + '">' + ico + '<span>' + name + '</span>' + (badge || '') + '</button>';
        return '<div class="bag-foot"><span class="bf-l">' + (doll ? bi('data-bagdoll="1"', '', BAG_ICO.doll, '魔法娃娃') : '') +
            bi('data-bagas="1"', as ? ' on' : '', BAG_ICO.sell, '自動賣出') + (cb.mailOpen ? bi('data-bagmail="1"', '', BAG_ICO.mail, '信箱', cb.mailBadge && cb.mailBadge() > 0 ? '<i class="ml-dot"></i>' : '') : '') + '</span>' +
            (as ? '' : bi('data-sort="1"', ' bw-sort', BAG_ICO.sort, '背包整理')) + '</div>';
    }
    function renderBag(body) {
        if (winTab === '自動賣出') { renderAutoSell(body); if (!body.querySelector('.bag-foot')) body.insertAdjacentHTML('beforeend', bagFoot()); return; }
        asSig = '';
        // 穿著的只在「裝備欄」；同款裝備疊成一格（items.js stacks）
        const list = stacks(bagList().filter(p => !p.equipped && (winTab === '全部' || p.cat === winTab)));
        bagStacks = new Map(list.map(s => [s.p.id, s.items]));
        let h = '';
        for (const s of list) h += cellHtml(s.p, 'bag-cell' + (pending && pending.id === s.p.id ? ' pick' : ''), s.items.length);
        for (let i = list.length; i < Math.max(35, Math.ceil(list.length / 5) * 5); i++) h += '<div class="bag-cell empty"></div>';
        h = (pending ? '<div class="bag-pick">點要用「' + esc(pending.base) + '」的道具（身上穿的在「裝備欄」）</div>' : '') + bagWeight() + '<div class="bag-grid">' + h + '</div>';
        const foot = bagFoot();
        // 內容沒變就不重畫（站長 2026-10-21「背包欄位點擊道具是沒有很順暢」）：update() 每次血量、魔力、經驗變了都會叫到這裡（打怪一秒好幾次），
        //   原本每次整個背包換掉 → 手指（滑鼠）按下到放開中間格子被換掉，那一下就沒反應（電腦實測 16 下掉 3 下）；手機每次重排、重畫圖示、光效重來，點了要等很久
        if (body.__bagHtml === h + foot && body.querySelector(':scope > .bag-grid')) return;
        body.__bagHtml = h + foot;
        // 第 401 項（站長 2026-10-28「背包下方四個按鈕會閃爍」）：掛機時背包一直變（買藥水、撿東西）整個重畫，下方按鈕的圖片跟著重新載入會閃 → 按鈕那排沒變就把原本的節點接回去
        const oldFoot = body.querySelector(':scope > .bag-foot');
        if (oldFoot && oldFoot.__html === foot) { body.innerHTML = h; body.appendChild(oldFoot); return; }
        body.innerHTML = h + foot;
        const nf = body.querySelector(':scope > .bag-foot'); if (nf) nf.__html = foot;
    }
    // 背包上方的負重條（站長 2026-10-18「背包上顯示負重詳情」）：目前／最大（伺服器 S_Web 16）＋百分比；
    //   顏色、那一句照 242 段值（weightLook：≥120 不會自然回魔、≥197 不能攻擊），條上一道線標出 197（不能攻擊）的位置。
    //   舊伺服器沒送目前／最大：只顯示百分比
    function bagWeight() {
        const s = state, w = s.weight;
        //   「背包整理」鈕移到背包右下（bagFoot，站長 2026-10-19）；舊伺服器沒送負重時這行不畫
        const sortBtn = '';
        if (w == null) return '';
        const wl = weightLook(w), num = s.wMax > 0;
        const pct = Math.min(100, num ? s.wCur / s.wMax * 100 : w / 242 * 100);
        //   同一行右邊放防禦（站長 2026-10-18「背包新增防禦力顯示」：換裝時看得到變化；數字同左上角、能力頁的 s.ac，update() 每次都重畫背包）
        // 第 119 項：格數 n／上限（上限照月卡，伺服器 S_Web 41；沒收到就只寫格數），負重只寫百分比（站長 2026-10-23「取消總重量」）
        //   格數放負重和防禦中間（站長 2026-10-23 截圖紅框），背包小圖示＋自己的底色跟負重分開；剩 5 格以下橘、滿了紅
        const sf = s.slotMax ? (s.slots >= s.slotMax ? ' full' : s.slotMax - s.slots <= 5 ? ' warn' : '') : '';
        const sl = s.slots != null ? '<span class="bw-slots' + sf + '"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h10l-1 8H4z"/><path d="M5.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none"/></svg>格數 <b>' + s.slots + (s.slotMax ? '/' + s.slotMax : '') + '</b></span>' : '';
        return '<div class="bag-wt' + (wl ? ' ' + wl.cls : '') + '"><div class="bw-txt"><b>負重 ' + Math.round(pct) + '%</b>' + sl + sortBtn +
            (wl ? '<em>' + wl.note + '</em>' : '') + (s.ac != null ? '<span class="bw-ac">防禦 <b>' + s.ac + '</b></span>' : '') + '</div><div class="bw-bar"><i style="width:' + pct.toFixed(1) + '%"></i><span class="bw-mark" style="left:' + (197 / 242 * 100).toFixed(1) + '%"></span></div></div>';
    }
    let bagStacks = new Map();   // 背包格子（那疊第一件的編號）→ 這疊的每一件

    // ── 道具視窗：使用／裝備或卸下／強化／自動賣出（C_ItemUSe）；商店不收的「刪除」（C_DeleteInventoryItem，見 refreshSell）。不能丟在地上（伺服器 C_DropItem 一律拒絕，站長 2026-10-17） ──
    let pending = null;   // 強化卷軸、鑑定卷軸等：等玩家點要用在哪個道具上
    // 道具 → 背包裡這一格是哪種道具（伺服器給的 S_Web 12，沒有就照名字對道具表）、商店收不收
    const kindOf = p => invTpl.get(p.id) || (p.tpl && p.tpl.id) || 0;
    const sellsFor = id => !SHOP_SELL || !!SHOP_SELL[id];   // 讀不到收購表就當成會收（只影響按鈕字）
    // ── 裝備＝替換（站長 2026-10-18「裝備武器飾品點裝備直接替換身上穿的物品」）──
    //   伺服器 C_ItemUSe：防具那格有東西不會換（訊息 124「已經裝備其他東西」），要先脫；武器伺服器自己換（UseWeapon：先脫舊的再穿新的）；
    //   雙手武器和盾牌不能同時（128／129；臂甲沒有這條）；戒指兩格（滿了不換）。（被詛咒的脫不下來＝訊息 150，本機伺服器 2026-10-19 拿掉）
    //   「斗篷下不能換盔甲」那條本機伺服器已拿掉（C_ItemUSe 2026-10-17），不必先脫斗篷。
    //   做法：照順序送封包（脫舊的 → 等伺服器把名字改成沒穿 → 穿新的 → 等改成穿著），中間哪步沒成功就把脫下來的穿回去，不留光著的一格
    const TWO_HAND = new Set(['tohandsword', 'bow', 'spear', 'claw', 'edoryu', 'tohandblunt', 'tohandstaff', 'chainsword', 'tohandkiringku']);   // L1Weapon.isTwohandedWeapon
    const fixTpl = q => { if (q.tpl) return q; const r = itemById(kindOf(q)); return r && r.tpl ? { ...q, tpl: r.tpl } : q; };   // 名字不帶 $編號的（歷戰長靴）靠物件編號查道具表
    // 這件要穿上，要先脫哪些：{ out（先脫的，照順序）, pick（戒指兩格都滿：讓玩家選換哪個）, auto（武器：伺服器自己換）}；沒有東西要換回 null
    function replacePlan(p) {
        if (!p.slot || p.equipped || !p.tpl || (p.tpl.k !== 'w' && p.tpl.k !== 'a') || p.slot === 'arrow' || p.slot === 'doll') return null;
        const worn = equipped().map(fixTpl), type = p.tpl.type;
        if (p.slot === 'wpn') {
            const w = worn.find(q => q.slot === 'wpn'), sh = worn.find(q => q.slot === 'shield' && q.tpl && q.tpl.type === 'shield');
            const out = TWO_HAND.has(type) && sh ? [sh] : [];   // 雙手武器和盾牌互斥：先脫盾（訊息 128）
            return out.length || w ? { out, auto: !!w } : null;
        }
        if (p.slot === 'ring') { const rs = worn.filter(q => q.slot === 'ring'); return rs.length >= 2 ? { out: [], pick: rs } : null; }   // 還有空格就直接穿
        const out = worn.filter(q => q.slot === p.slot);
        if (p.slot === 'shield' && type === 'shield') { const w = worn.find(q => q.slot === 'wpn'); if (w && w.tpl && TWO_HAND.has(w.tpl.type)) out.push(w); }   // 盾牌不能拿雙手武器時穿（訊息 129）
        return out.length ? { out } : null;
    }
    let swapBusy = false;
    const wornNow = id => { const q = parsedItems().find(x => x.id === id); return !!(q && q.equipped); };
    const waitWorn = async (id, want, ms = 1800) => {   // 等伺服器把這件改成穿著／沒穿（名字尾巴的 ($117)）
        const t0 = performance.now();
        while (performance.now() - t0 < ms) { if (wornNow(id) === want) return true; await new Promise(r => setTimeout(r, 60)); }
        return wornNow(id) === want;
    };
    async function swapEquip(p, out) {
        if (swapBusy) { toast('還在換，等一下'); return; }
        swapBusy = true;
        const taken = [];
        const putBack = async () => { for (const v of taken.slice().reverse()) { cb.useItem(v); await waitWorn(v.id, true); } };
        try {
            for (const v of out) {
                cb.useItem(v);
                if (!await waitWorn(v.id, false)) { toast('脫不下來，沒換'); await putBack(); return; }   // 伺服器沒脫（逾時、狀態不能動…）
                taken.push(v);
            }
            cb.useItem(p);
            if (!await waitWorn(p.id, true)) { toast('穿不上，已穿回原本的'); await putBack(); }
        } finally { swapBusy = false; }
    }
    // 戒指兩格都滿：選換掉哪一個
    function ringPick(p, rings) {
        const ov = overlay('lmui-slotpick', '<div class="box"><div class="hd"><span>換掉哪一個戒指？</span><button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            rings.map(r => { const icon = cb.itemIcon(r); return '<button type="button" class="opt" data-id="' + r.id + '">' + (icon ? itemImg(icon, r) : '') + '<span class="' + nameCls(r.bless).trim() + '">' + esc(r.full) + '</span></button>'; }).join('') + '</div></div>');
        ov.addEventListener('click', e => {
            const b = e.target.closest('.opt[data-id]'); if (!b) return;
            const r = rings.find(x => x.id === +b.getAttribute('data-id'));
            ov.remove(); if (r) swapEquip(p, [r]);
        });
    }
    // 要穿的裝備有東西要換：處理掉回 true；沒有（或職業、等級穿不上——照原本送，讓伺服器說原因，別先把身上的脫了）回 false
    function equipReplace(p) {
        const plan = replacePlan(p);
        if (!plan || !canWear(p)) return false;
        if (plan.pick) { ringPick(p, plan.pick); return true; }
        if (!plan.out.length) return false;   // 武器：伺服器自己換
        swapEquip(p, plan.out); return true;
    }
    function useItemFlow(p) {
        // 站長 2026-10-31「項圈點選使用，直接開啟夥伴視窗」：項圈、高級項圈按「使用」＝打開夥伴視窗（叫出來、寄放都在那裡），不送伺服器
        if (p.tpl && (p.tpl.id === 40314 || p.tpl.id === 40316)) { closeAll(true); openCompWin(); return; }
        const bb = bookBtn(p);   // 法書學過、職業學不到、屬性不合：點兩下、快捷格也不送
        if (bb && bb.off) { toast(bb.why || (bb.t === '已學習' ? '已經學會了' : '這個職業不能學')); return; }
        if (equipReplace(p)) return;
        if (NEED_ITEM_TARGET.has(p.it.useType)) {
            inSide('items', () => {   // 電腦介面：背包在右邊
                pending = p;
                if (cur !== 'items' || winTab === '裝備欄') { closeAll(true); cur = 'items'; openWin('items', '全部'); pending = p; }
                renderWin();
            });
            syncTools();
            return;
        }
        // 精靈水晶（「精靈水晶(魔法名)」）：等級不夠伺服器完全不回應（一般魔法書有訊息 312）→ 照 skill-learn.json 先擋下、說要幾級（2026-10-18 妖精魔法測試回報）
        const cm = p.tpl && p.tpl.type === 'spellbook' && state.type === 2 ? /^精靈水晶[(（](.+)[)）]$/.exec(p.base) : null;
        if (cm) {
            const sk = skillList().find(x => x.name === cm[1]), L = (cb.skillLearn ? cb.skillLearn() : {}).elf || {}, exc = L.exceptions || {};
            const need = sk ? (Object.prototype.hasOwnProperty.call(exc, sk.sid) ? exc[sk.sid] : (L.levels || {})[sk.lv]) : null;
            if (need && (state.level || 0) < need) { toast('等級不夠（要 Lv' + need + '）'); return; }
        }
        // 魔法書、精靈水晶在哪裡都能讀（伺服器本機改動第 68 項，站長 2026-10-21 拿掉神殿／世界樹的地點限制）→ 直接送
        cb.useItem(p);
    }
    // ── 變身形態（站長 2026-10-19「變身卷無法使用，自動變卷也怪怪的，整理一下，可以拿單機版參考」；照單機版 js/02 POLY_TIERS：只列正式的形態、高等在前）──
    //   data/polys.json（tools/gen-data.mjs）：n 英文名（送伺服器的）、c 中文名、lv 要幾級、v 畫面上畫得出來、g 外型編號、
    //   w／a 能拿的武器／能穿的防具、s 能不能放魔法（後四個是 polymorphs 表的 polyid／weaponequip／armorequip／isSkillUse）。
    //   只列有中文名、畫得出來、拿得了武器的：沒中文名的是活動形態（制服、馬、柑橘…），畫不出來的變了人會不見，拿不了武器的（牛、鹿、地獄犬…）變了武器被脫掉。
    //   伺服器「隨機」也只挑這些裡面能放魔法的（web/WebCare.RANDOM_POLYS）。舊的 polys.json 沒有 v 欄＝全列、沒有 w／a／s 欄＝不看那幾條
    const POLY_WPN = { sword: 2, dagger: 1, tohandsword: 4, bow: 256, spear: 16, blunt: 8, staff: 32, throwingknife: 256, arrow: 256, gauntlet: 256, claw: 128, edoryu: 64,
        singlebow: 256, singlespear: 16, tohandblunt: 8, tohandstaff: 32, kiringku: 512, chainsword: 1024, tohandkiringku: 512 };   // 武器種類 → 旗標（L1PolyMorph.weaponFlgMap）
    const POLY_ARM = { helm: 1, armor: 16, T: 8, cloak: 32, glove: 256, boots: 1024, shield: 128, amulet: 2, ring: 512, belt: 64, earring: 4, guarder: 2048 };   // armorFlgMap
    // 排序（選單分組照這個）：高等在前，同等級照名字（中文筆畫序；沒中文名的照英文名）
    const polyCmp = (a, b) => b.lv - a.lv || (a.c || a.n).localeCompare(b.c || b.n, 'zh-Hant');
    function polyForms(lv) {
        const all = cb.polys ? cb.polys() : [], old = !all.some(p => p.v != null);
        return all.filter(p => p.lv <= lv && (old || (p.v && p.c && p.w !== 0))).sort(polyCmp);
    }
    // 現在穿著的武器、防具，這個形態能不能用（伺服器 L1PolyMorph.isEquipableWeapon／Armor；不能用的變身時會被脫掉）
    function polyGear(p) {
        const r = { wpn: true, arm: true };
        if (p.w == null) return r;
        for (const e of equipped()) {
            const t = e.tpl, f = t ? (t.k === 'w' ? POLY_WPN[t.type] : t.k === 'a' ? POLY_ARM[t.type] : 0) : 0;
            if (f && !((t.k === 'w' ? p.w : p.a) & f)) r[t.k === 'w' ? 'wpn' : 'arm'] = false;
        }
        return r;
    }
    // 外型選單：變形術（伺服器施放後送 SHOWHTML「monlist」＝S_ShowPolyList，回 C_NPCAction 自己的編號＋英文名，"none"＝變回原形；cb.polyPick）、
    //   變形卷軸（main.js polyScroll：o.pick 送 C_ItemUSe 帶英文名）、掛機設定的自動變身（o.mode 'set'：polySetMenu，選了存設定）三個共用。
    //   伺服器的規則：等級 ≥ minlevel 才變得成，不夠回「無法變成你指定的怪物」（181）；變形術那次選擇就沒了（白放）、卷軸不扣 → 只列等級到了的（同單機版）。
    //   變形術、卷軸：拿著的武器這個形態拿不了的不列（同單機版變形控制戒指的選單；變了武器會被脫掉）。
    //   自動變身（同單機版設定頁）：最上面一張「隨機」，形態全列；現在的武器、防具用不了的標「裝備不合」（伺服器那次改隨機，WebCare.poly）；
    //   選過、現在不在清單裡的（等級不夠了、舊設定選的活動形態）也列在它那一級。
    //   排版（站長 2026-10-19「自動變身排版排好，依照等級排列」）：照等級分組，每組上面一條「LvNN」（捲動時黏在上面），高等在上、同一組照名字；
    //   兩欄卡片，卡片第一行名字、第二行標示（遠距離／不能用魔法／會脫下防具／裝備不合，固定在名字下面）；現在的金框，打開時捲到它。搜尋也照分組
    //   同名的兩種（polys.json：妖魔巡守＝re orc scout Lv1／orc scout polymorph Lv15，思克巴＝re succubus Lv1／succubus morph Lv40）網頁畫的是同一組圖（gfxmap 都對到
    //   單機版同名動作圖）、能拿的武器防具一樣，兩個都列玩家分不出來（站長 2026-10-19）→ 只留一個：等級到了的裡面要求最高的那個（原版的怪物形態；
    //   伺服器精靈「三重矢」只認 orc scout polymorph 的外型 2323，L1BuffUtil TRIPLE_ARROW），等級不到就是 Lv1 那個；自動變身選過的那個優先（存的設定照樣標金框）
    //   同名又同等級的（伺服器第 175 項補了 3.5C 原版選單的名字後：死亡騎士 death knight／death 52、炎魔 barlog morph／barlog 52、黑暗騎士 ancient／neo…）：留外型編號大的＝
    //   用戶端原版選單那個，出手、施法都比較快（死亡騎士雙手劍 23 格→17 格；站長 2026-10-25「變身的等級攻速會有差嗎」）
    function polyOne(list, keep) {
        const by = new Map(), nm = p => p.c || p.n;
        for (const p of list) {
            const o = by.get(nm(p));
            if (!o || p.n === keep || (o.n !== keep && (p.lv > o.lv || (p.lv === o.lv && p.g > o.g)))) by.set(nm(p), p);
        }
        const one = new Set(by.values());
        return list.filter(p => one.has(p));
    }
    function polyMenu(o) {
        const set = o.mode === 'set', nm = p => p.c || p.n, all = cb.polys ? cb.polys() : [];
        let list = polyForms(o.level || 0);
        if (set) {
            const x = o.sel && !list.some(p => p.n === o.sel) ? all.find(p => p.n === o.sel) : null;
            if (x) list = list.concat([x]).sort(polyCmp);
        }   // 站長 2026-11-01「為何手動點變捲選項那麼少」：原本只列拿得了現在武器的（拿弓時 30 級以下只剩 5 種）→ 全部列，拿不了的標「會脫下武器」
        list = polyOne(list, set ? o.sel : '');
        // 新手任務「設定自動變身」那步（tutorial.js polyRec）：推薦的外型標「推薦」——現在的武器、防具用得了的才標（不然標了也選不成）
        const rec = set && o.rec ? new Set(o.rec) : null;
        const isRec = p => !!(rec && rec.has(p.n) && (o.level || 0) >= p.lv && (g => g.wpn && g.arm)(polyGear(p)));
        // 推薦的排在同一級最前面（照 o.rec 的順序：最推薦的在左上），不用往下捲找
        if (rec) { const ri = p => isRec(p) ? o.rec.indexOf(p.n) : 1e9; list.sort((a, b) => b.lv - a.lv || ri(a) - ri(b) || polyCmp(a, b)); }
        const tags = p => {
            const g = polyGear(p);
            return [isRec(p) ? '推薦' : '', p.w === 256 ? '遠距離' : '', p.s === 0 ? '不能用魔法' : '', set ? (g.wpn && g.arm ? '' : '裝備不合') : (g.wpn ? '' : '會脫下武器'), set || g.arm ? '' : '會脫下防具'].filter(Boolean);
        };
        // 現在的外型：同名沒列出來的那種（例：現在是 Lv1 的妖魔巡守，選單列的是 Lv15 那個）也算這一格
        const isOn = p => set ? p.n === o.sel : !!(o.gfx && all.some(q => q.g === o.gfx && nm(q) === nm(p)));
        const card = (n, name, t, on, cls) => '<button type="button" class="opt pm-c' + (cls || '') + (on ? ' on' : '') + '" data-n="' + esc(n) + '"><span class="pm-n">' + esc(name) + '</span>' +
            '<span class="pm-t">' + t.map(x => '<i' + (x === '推薦' ? ' class="pm-rec-t"' : '') + '>' + x + '</i>').join('') + '</span></button>';
        const rows = q => {
            let h = set && (!q || '隨機'.includes(q)) ? card('', '隨機', [], !o.sel, ' pm-rand') : '', lv = -1;
            for (const p of list) {
                if (q && !(nm(p) + ' ' + p.n).toLowerCase().includes(q)) continue;
                if (p.lv !== lv) { lv = p.lv; h += '<div class="pm-lv">Lv' + lv + '</div>'; }
                h += card(p.n, nm(p), tags(p), isOn(p), isRec(p) ? ' pm-rec' : '');
            }
            return h || '<div class="sp-none">' + (q ? '找不到' : '沒有能變的外型') + '</div>';
        };
        try { const ae = document.activeElement; if (ae && ae.blur && ae !== document.body) ae.blur(); } catch (e) { /* 收掉聊天輸入框的鍵盤 */ }
        const ov = overlay('lmui-polymenu', '<div class="box"><div class="hd"><span>' + esc(o.title || '變形術') + '：選擇外型</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="pm-top"><input type="text" class="pm-q" placeholder="找外型" autocomplete="off" aria-label="找外型"></div><div class="bd"><div class="pm-list">' + rows('') + '</div></div>' +
            (o.morphed ? '<div class="ft"><button type="button" data-none="1">' + esc(o.revertText || '變回原形') + '</button></div>' : '') + '</div>');
        if (set) ov.setAttribute('data-mode', 'set');   // 新手引導分得出是設定頁開的（變形卷軸、變形術的不算）
        const q = ov.querySelector('.pm-q'), bd = ov.querySelector('.bd'), box = ov.querySelector('.pm-list');
        const on = box.querySelector('.opt.on');   // 現在的捲到中間（.bd 是 offsetParent）
        if (on) bd.scrollTop = Math.max(0, on.offsetTop - (bd.clientHeight - on.offsetHeight) / 2);
        q.addEventListener('input', () => { box.innerHTML = rows(q.value.trim().toLowerCase()); bd.scrollTop = 0; });
        q.addEventListener('keydown', e => e.stopPropagation());   // 打字不要變成快捷鍵、方向鍵不要走路
        ov.addEventListener('click', e => {
            const n = e.target.closest('[data-none]');
            if (n) { ov.remove(); if (o.revert) o.revert(); else cb.polyPick('none'); return; }
            const b = e.target.closest('.opt[data-n]'); if (!b) return;
            ov.remove(); (o.pick || cb.polyPick)(b.getAttribute('data-n'));
        });
    }
    // 這個外型（英文名）現在用得了嗎：等級到了、拿得了手上的武器、穿得了身上的防具（同伺服器 WebCare.polyOk；新手引導「設定自動變身」那步用）。
    //   外型資料還沒讀到、或沒有這個名字＝不知道，當成可以（伺服器會判斷）
    function polyFits(name) {
        const p = (cb.polys ? cb.polys() : []).find(x => x.n === name);
        if (!p) return true;
        const g = polyGear(p);
        return (state.level || 0) >= p.lv && g.wpn && g.arm;
    }
    // 掛機設定「變身消失時自動使用」的形態：按鈕打開外型選單（設定模式），選了就存（""＝隨機）；不用卷軸、不送 C_ItemUSe
    function polySetMenu() {
        const s0 = cb.autoSettings ? cb.autoSettings() : null; if (!s0) return;
        polyMenu({ mode: 'set', title: '自動變身', level: state.level || 0, sel: s0.poly || '', rec: cb.polyRec ? cb.polyRec() : null, pick: name => {
            const s = Object.assign({}, cb.autoSettings()); if (s.poly === name && (s.flags & 128)) return;
            s.poly = name; s.flags |= 128; cb.saveAutoSettings(s);   // 選了形態＝要自動變身（同設定頁其他圖示框：選了就打開開關）
        } });
    }
    // ── 賣出（站長 2026-10-18「道具物品新增可以售出價格，點下去直接售出」；伺服器 web/WebSell：S_Web 23 售價、24 結果）──
    //   開道具視窗時問這格（疊起來的每一件）的售價 → 資訊表多一列「售價」、按鈕列多「賣出」；按了跳確認框（疊起來的先選數量）→ 逐件送 C_Web 20，
    //   背包、金幣照原版封包更新。強化過的商店不收（伺服器回原因 11）；穿著、封印的不顯示鈕。舊伺服器沒回售價＝整組不顯示
    const sellInfo = new Map();                      // 物件編號 → { price（一個賣多少，0＝不能賣）, reason }
    let sellWin = null, sellRun = null, sellReq = (Math.random() * 1e9 | 0) + 1;   // 開著的道具視窗 { p, members, ov }；進行中的賣出；請求編號（每次不同、非 0）
    const SELL_WHY = { 1: '商店不收', 2: '穿在身上', 3: '封印中', 4: '項圈裡有寵物', 5: '娃娃叫出來了', 6: '背包裡沒有這件', 11: '強化過的商店不收' };
    const SELL_FAIL = Object.assign({}, SELL_WHY, { 7: '數量不對', 8: '金幣會超過 20 億', 10: '現在不能賣', 12: '隨地賣出需要月卡；沒有月卡請到商店村的亞丁商團（萬物收購商）賣' });
    const sellable = a => a.filter(m => { const i = sellInfo.get(m.id); return i && i.price > 0 && i.reason === 0; });
    function setSellInfo(list) { for (const x of list) sellInfo.set(x.id, x); refreshSell(); }
    function refreshSell() {
        const w = sellWin; if (!w || !w.ov.isConnected) return;
        const { p, members, ov } = w, ft = ov.querySelector('.ft'), btn = ov.querySelector('[data-a="sell"]');
        const infos = members.map(m => sellInfo.get(m.id)).filter(Boolean);
        let row = ov.querySelector('.iw-sell');
        // 站長 2026-10-25「重複了」：有「售價」（伺服器算的這件實際賣多少）就把道具表的「商人收購」那列藏起來，沒有售價時照舊顯示
        const buyRow = [...ov.querySelectorAll('.iw-lines > *')].find(e => e !== row && e.firstElementChild && e.firstElementChild.textContent === '商人收購');
        const setRow = t => {
            if (buyRow) buyRow.style.display = t != null ? 'none' : '';
            if (t == null) { if (row) row.remove(); return; }
            if (!row) {
                let box = ov.querySelector('.iw-lines');
                if (!box) { box = document.createElement('div'); box.className = 'iw-lines'; ov.querySelector('.bd').prepend(box); }
                row = document.createElement('div'); row.className = 'iw-sell'; row.innerHTML = '<span>售價</span><b></b>'; box.appendChild(row);
            }
            const b = row.querySelector('b'); b.textContent = t; b.className = t.startsWith('不能賣') ? 'no' : '';
        };
        if (!infos.length || p.equipped || kindOf(p) === HOME_STONE || honorKind(p) >= 0 || members.some(isLocked)) { setRow(null); btn.hidden = true; }   // 第 275 項：鎖著的不給賣、刪   // 還沒回（舊伺服器永遠不會回）、穿在身上：不顯示
        else {
            const ok = sellable(members), first = infos[0];
            if (ok.length) {
                const price = sellInfo.get(ok[0].id).price, n = members.length > 1 ? ok.length : (p.count || 1);
                setRow(n > 1 ? '每件 ' + price.toLocaleString() + '，共 ' + (price * n).toLocaleString() + ' 金幣' : price.toLocaleString() + ' 金幣');
                btn.hidden = false; btn.disabled = false; btn.dataset.del = '';
                // 第 119 項：沒月卡＝隨地賣伺服器會擋 → 鈕上掛鎖頭，按了跳「隨地賣出要月卡」（sellcard.js）
                const lock = !!(cb.cardKnown && cb.cardKnown() && !cb.hasCard());
                btn.dataset.lock = lock ? '1' : ''; btn.classList.toggle('sc-locked', lock);
                if (lock) btn.innerHTML = LOCK_BTN; else btn.textContent = '賣出';
            } else if (first.reason === 2) { setRow(null); btn.hidden = true; }
            else {
                setRow('不能賣（' + (SELL_WHY[first.reason] || '商店不收') + '）');
                // 商店不收、強化過的：這顆改成「刪除」（站長 2026-10-21「象牙塔裝備要刪也刪不掉」：原本只有自動刪除，強化過的自動賣出不動）；
                //   封印的不顯示鈕，項圈裡有寵物、娃娃叫出來了照舊灰掉的賣出（伺服器也不給刪）
                //   項圈（4：裡面有寵物）也可以刪（站長 2026-10-29「寵物項圈沒有刪除按鈕」）：寵物叫出來的那個伺服器照原版擋；刪了寵物一起沒了，提示框寫清楚
                const del = (first.reason === 1 || first.reason === 11 || first.reason === 4) && !keepBlocked(kindOf(p));
                if (!del && keepBlocked(kindOf(p))) setRow(KEEP_MSG);
                const dbox = ov.querySelector('.iw-drop[data-del] > div'); if (dbox && first.reason === 4) dbox.textContent = '項圈裡的寵物會一起消失，拿不回來。';
                btn.hidden = first.reason === 3; btn.disabled = !del;
                if (!btn.dataset.armed) btn.textContent = del ? '刪除' : '賣出';
                btn.dataset.del = del ? '1' : ''; btn.dataset.lock = ''; btn.classList.remove('sc-locked');
            }
        }
        if (ft) ft.classList.toggle('ft4', [...ft.querySelectorAll('button')].filter(b => !b.hidden).length >= 4);   // 四顆＝手機直式排兩列（lmui.css）
    }
    // 祝福、有屬性的：商店照一般的收、價錢一樣
    const SELL_ELE = { fr: '火', wa: '水', wi: '風', ea: '地' };
    function sellNote(p) {
        const a = [];
        if (p.bless === 0) a.push('祝福的');
        if (p.attrKey) a.push((SELL_ELE[p.attrKey.slice(0, 2)] || '') + '屬性 ' + p.attrKey.slice(2) + ' 段');
        return a.length ? '這件是' + a.join('、') + '，商店只照一般價收。' : '';
    }
    function sellConfirm() {
        const w = sellWin; if (!w || !w.ov.isConnected) return;
        if (sellRun) { toast('還在賣，等一下'); return; }
        const ok = sellable(w.members); if (!ok.length) return;
        const p = w.p, price = sellInfo.get(ok[0].id).price, stackObj = ok.length === 1 && ok[0].count > 1;
        const max = stackObj ? ok[0].count : ok.length, note = sellNote(p);
        const ask = n => '賣出 ' + (n > 1 ? n.toLocaleString() + ' 件 ' : '') + p.full + '，得到 ' + (price * n).toLocaleString() + ' 金幣？';
        const ov = overlay('lmui-sellyn', '<div class="box"><div class="hd"><span>賣出</span><button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            (max > 1 ? '<div class="sl-qty"><button type="button" data-q="-1" aria-label="少一個">−</button><input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="7" value="' + max + '" aria-label="數量">' +
                '<button type="button" data-q="1" aria-label="多一個">＋</button><button type="button" data-q="0">全部</button></div>' : '') +
            '<div class="cl-ask" data-ask>' + esc(ask(max)) + '</div>' + (note ? '<div class="sl-note">' + esc(note) + '</div>' : '') + '</div>' +
            '<div class="ft"><button type="button" data-x="1">取消</button><button type="button" data-ok="1">確定賣出</button></div></div>');
        ov.classList.add('cl-ov');   // 小視窗（同血盟、書的確認框）
        const inp = ov.querySelector('input'), askEl = ov.querySelector('[data-ask]');
        const cur = () => { const n = inp ? parseInt(inp.value, 10) : 1; return Math.max(1, Math.min(max, n > 0 ? n : 1)); };
        const upd = () => { askEl.textContent = ask(cur()); };
        if (inp) {
            inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D+/g, ''); if (inp.value !== '' && +inp.value > max) inp.value = String(max); upd(); });
            inp.addEventListener('blur', () => { inp.value = String(cur()); upd(); });
            inp.addEventListener('keydown', e => e.stopPropagation());   // 數字鍵不要變成快捷鍵、方向鍵不要走路
            ov.addEventListener('click', e => {
                const b = e.target.closest('[data-q]'); if (!b) return;
                const d = +b.getAttribute('data-q'); inp.value = String(d === 0 ? max : Math.max(1, Math.min(max, cur() + d))); upd();
            });
        }
        ov.querySelector('[data-ok]').addEventListener('click', () => {
            const n = cur(), queue = [];
            if (stackObj) queue.push({ id: ok[0].id, qty: n }); else for (const m of ok.slice(0, n)) queue.push({ id: m.id, qty: 1 });   // 疊起來的裝備是一件一件獨立的道具：逐件送
            ov.remove(); w.ov.remove();
            sellRun = { queue, name: p.full, sold: 0, gold: 0, reqs: queue.length, req: 0, msg: '', timer: 0 };
            sellNext();
        });
    }
    function sellNext() {
        const run = sellRun; if (!run) return;
        const q = run.queue.shift();
        if (!q) { sellDone(); return; }
        run.req = ++sellReq;
        if (!cb.sellItem || !cb.sellItem(run.req, q.id, q.qty)) { sellEnd(); toast('現在不能賣'); return; }
        clearTimeout(run.timer); run.timer = setTimeout(() => { if (sellRun === run) { sellEnd(); toast('賣出沒有回應'); } }, 6000);
    }
    function sellEnd() { if (sellRun) clearTimeout(sellRun.timer); sellRun = null; }
    function sellDone() {
        const run = sellRun; sellEnd(); if (!run) return;
        toast(run.reqs === 1 && run.msg ? run.msg : '賣出 ' + run.name + (run.sold > 1 ? ' ×' + run.sold.toLocaleString() : '') + '，得到 ' + run.gold.toLocaleString() + ' 金幣');
    }
    function sellResult(r) {
        const run = sellRun; if (!run || r.req !== run.req) return;   // 不是這次送的（逾時了、同請求重送）：不理
        if (r.res === 9) return;   // 同一個請求編號重送：伺服器安靜丟掉，原本那筆照常回
        if (r.res === 0) { run.sold += r.sold; run.gold += r.gold; run.msg = r.msg; if (run.queue.length) sellNext(); else sellDone(); return; }
        sellEnd();
        if (r.res === 12 && !run.sold) { cardLockAsk(() => cb.openShop && cb.openShop()); return; }   // 沒月卡（第 119 項；鎖頭沒掛上時伺服器擋下來的）：跳同一張小卡
        toast((run.sold ? '已賣 ' + run.sold.toLocaleString() + ' 件，得到 ' + run.gold.toLocaleString() + ' 金幣；' : '') + (r.msg || SELL_FAIL[r.res] || '賣不出去'));
    }
    // group＝背包裡疊在同一格的每一件（同款裝備）：說明照第一件、寫共幾件；裝備、強化挑第一件
    //   「自動賣出／自動刪除」＝把這種道具加進（或移出）自動賣出清單（同「自動賣出」分頁）；商店不收的伺服器會直接刪掉，所以按鈕叫自動刪除、要按第二下確認
    // back＝從比較框點了身上那件打開的：多一顆「返回」回到原本那件（站長 2026-10-22「點此道具會顯示該道具資訊」）
    function openItem(p, group, back) {
        const icon = cb.itemIcon(p), lines = itemLines(p), many = group && group.length > 1 ? group.length : 0;
        const equip = p.slot && p.slot !== 'arrow' && p.slot !== 'doll';
        // 回憶蠟燭（49142）道具表是 use none，伺服器第 113 項起「使用」＝打開重配能力值的視窗（candle.js）；
        //   旅館鑰匙（40312）也是 use none，伺服器第 138 項起「使用」＝進房間、在房間裡用＝回旅館門口（web/WebInn）
        const usable = !equip && (!(p.tpl && p.tpl.k === 'e' && p.tpl.use === 'none') || (p.tpl && (p.tpl.id === 49142 || p.tpl.id === 40312)));
        const bb = bookBtn(p);   // 法書：學習／已學習／不能學
        const act = equip ? (p.equipped ? '卸下' : replacePlan(p) ? '替換' : '裝備') : usable ? (bb ? bb.t : '使用') : '';   // 那格已經穿著別的：按了先脫舊的再穿新的（equipReplace）
        const kind = kindOf(p), s = cb.autoSettings ? cb.autoSettings() : null, ak = asKey(p);
        // 項圈不給加（裡面可能有寵物）；祝福的加的是「祝福的 XXX」那一項（asKey，第 412 項起；原本不給加）
        // 第 275 項：道具鎖（一格好幾件同款＝整格一起鎖、解）；伺服器不認（舊）＝不顯示鎖頭。主城傳送石、榮耀卡片本來就不能賣不能刪，不給鎖
        const locked = (group && group.length ? group : [p]).some(isLocked), lockable = !!(cb.lockOk && cb.lockOk()) && kind !== HOME_STONE && honorKind(p) < 0;
        const canList = s && kind && kind !== 40314 && kind !== 40316 && kind !== HOME_STONE && honorKind(p) < 0 && !locked;   // 主城傳送石（第 157 項）：不能賣也不能刪，不給加
        const listed = canList && (s.sell || []).some(x => Math.abs(x) === ak), sells = sellsFor(kind);   // 收不收照實際道具編號（同伺服器）
        // 第 119 項：在清單裡＝寫狀態（自動賣出中／自動刪除中，點了移出）；沒月卡又會賣的＝掛鎖「自動賣出」，點了跳小卡（asAsk）
        const asCur = listed ? s.sell.find(x => Math.abs(x) === ak) : 0, asDel = !sells || asCur < 0;
        const asLock = !asDel && !!(cb.cardKnown && cb.cardKnown() && !cb.hasCard());
        const asTxt = asLock ? lockTxt('自動賣出') : listed ? (asDel ? '自動刪除中' : '自動賣出中') : (sells ? '自動賣出' : '自動刪除');
        const asCls = (listed && !asLock ? 'sc-ason' : '') + (asLock ? ' sc-locked' : '');
        const ov = overlay('lmui-itemwin', '<div class="box"><div class="hd"><span class="iw-ic">' + (icon ? itemImg(icon, p) + hsFx(p) : '') + '</span>' +
            '<div class="iw-tt"><span class="iw-nm' + nameCls(p.bless) + '">' + esc(p.full) + (many ? '（共 ' + many + ' 件）' : wandUses(p) ? '（剩 ' + wandUses(p).toLocaleString() + ' 次）' : p.count > 1 ? ' (' + p.count.toLocaleString() + ')' : '') + '</span></div>' +
            (lockable ? '<button type="button" class="iw-lock' + (locked ? ' on' : '') + '" data-a="lock" aria-label="' + (locked ? '解鎖' : '鎖定') + '" aria-pressed="' + locked + '">' + (locked ? '🔒' : '🔓') + '</button>' : '') +
            '<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd">' + (locked ? '<div class="iw-locked">已鎖定：不能賣、刪除、交易</div>' : '') + equipDiffOf(p) + (lines.length ? '<div class="iw-lines">' + lines.map(l => lineHtml(l, cb.itemIcon)).join('') + '</div>' : '') +   // 第 567 項：說明列改走 items.js lineHtml（南瓜箱子的掉寶式格子要道具圖示）
            (bb ? '<div class="iw-why"' + (bb.why ? '' : ' hidden') + '>' + esc(bb.why || '') + '</div>' : '') +
            '<div class="iw-drop" hidden><div>背包裡的這種道具會被直接刪掉，不給錢。</div></div>' +
            '<div class="iw-drop" data-del hidden><div>' + (many ? '刪掉其中 1 件，拿不回來。' : p.count > 1 ? '整疊 ' + p.count.toLocaleString() + ' 個一起刪掉，拿不回來。' : '刪掉就拿不回來。') + '</div></div></div>' +
            '<div class="ft">' + (back ? '<button type="button" data-a="back">返回</button>' : '') + (act ? '<button type="button" data-a="use"' + (bb && bb.off ? ' disabled' : '') + '>' + act + '</button>' : '') + (enh.enhanceable(p) ? '<button type="button" data-a="enh">強化</button>' : '') +
            (canList ? '<button type="button" data-a="as" class="' + asCls + '">' + asTxt + '</button>' : '') + '<button type="button" data-a="sell" hidden>賣出</button></div></div>');
        const members = many ? group : [p];
        sellWin = { p, members, ov };   // 售價、賣出鈕等伺服器回了才顯示（refreshSell）
        if (cb.sellQuery) cb.sellQuery(members.map(m => m.id).slice(0, 200));
        refreshSell();
        ov.addEventListener('click', e => {
            // 比較框（equipdiff.js）：點身上那件＝換成那件的道具視窗（可以按「返回」回來）；點換上那件＝捲到這件的說明
            const cw = e.target.closest('[data-cmpid]');
            if (cw) { const q = parsedItems().find(x => x.id === +cw.getAttribute('data-cmpid')); if (q) openItem(q, null, () => openItem(p, group, back)); return; }
            if (e.target.closest('[data-cmpnow]')) { const l = ov.querySelector('.iw-lines'); if (l) l.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
            const b = e.target.closest('[data-a]'); if (!b) return;
            const a = b.getAttribute('data-a');
            if (a === 'back') { back(); return; }
            if (a === 'lock') { const on = !locked; for (const m of members) cb.itemLock(on, m.id); toast(on ? '已鎖定' : '已解鎖'); ov.remove(); return; }
            // 強化卷軸（含象牙塔卷軸）按「使用」＝打開強化視窗（站長 2026-10-19「象牙塔強化卷沒有進入到強化介面」），不再走背包裡點對象那套
            if (a === 'use') { ov.remove(); if (enh.scrollInfo(p)) enh.open({ scroll: p }); else useItemFlow(p); }
            else if (a === 'sell' && b.dataset.del) {   // 刪除這一件（商店不收的；refreshSell）：按第二下才刪，能不能刪伺服器判斷
                if (!b.dataset.armed) {
                    const box = ov.querySelector('.iw-drop[data-del]'); box.hidden = false; box.scrollIntoView({ block: 'nearest' });   // 在資訊表下面：手機上要捲才看得到
                    b.dataset.armed = '1'; b.textContent = '確定刪除'; b.classList.add('danger'); return;
                }
                if (keepBlocked(kindOf(p))) { toast(KEEP_MSG); return; }
                ov.remove(); if (!cb.deleteItem || !cb.deleteItem(p)) toast('現在不能刪');
            }
            else if (a === 'sell' && b.dataset.lock) cardLockAsk(() => cb.openShop && cb.openShop(), () => ov.remove());
            else if (a === 'sell') sellConfirm();
            else if (a === 'enh') { ov.remove(); enh.open({ item: p }); }
            else if (a === 'as') {
                if (asLock) { asAsk(ak, listed, () => ov.remove(), p.base ? asBlessWord(p.bless, p.base) : ''); return; }
                if (listed) { ov.remove(); autoSellDel(ak); toast('已取消' + (asDel ? '自動刪除' : '自動賣出')); return; }
                const box = ov.querySelector('.iw-drop:not([data-del])');
                if (!sells && box.hidden) { box.hidden = false; box.scrollIntoView({ block: 'nearest' }); b.textContent = '確定自動刪除'; b.classList.add('danger'); return; }   // 刪掉的拿不回來：按第二下才加
                ov.remove(); if (autoSellAddId(ak)) toast('已加入' + (sells ? '自動賣出' : '自動刪除'));
            }
        });
    }

    // ── 裝備（紙娃娃）：上方名字／等級／職業＋經驗，左右裝備格夾著中間的角色，角色下方血／魔，最下面能力值（同單機版 renderDoll） ──
    function equipped() { return parsedItems().filter(p => p.equipped); }
    // 手上這把用不用箭（ARROW_WPN）；沒拿武器、道具表查不到＝不用
    function usesArrow(w) { const t = w && fixTpl(w).tpl; return !!t && t.k === 'w' && ARROW_WPN.has(t.type); }
    function dollMap() {
        const m = {}, eq = equipped();
        for (const p of eq) {
            if (p.slot === 'ring') { if (!m.ring1) m.ring1 = p; else m.ring2 = p; }
            else if (p.slot && !m[p.slot]) m[p.slot] = p;
        }
        const sp = cb.equipSpecial ? cb.equipSpecial() : {}, all = parsedItems();
        if (sp.arrow && usesArrow(m.wpn)) m.arrow = all.find(p => p.id === sp.arrow);
        if (sp.doll) m.doll = all.find(p => p.id === sp.doll);
        return m;
    }
    function dollCell(k, m) {
        if (!k) return '<div></div>';
        if (k === 'card') {   // 榮耀卡片（第 169 項起是背包道具 items.js honorKind）：有卡＝卡的圖示（閃亮亮）＋封號小字，好幾張就並排；點了開那張的榮耀卡（cb.openHonorCard）。沒有卡＝「卡片」
            const seen = new Set(), cs = parsedItems().filter(p => { const hk = honorKind(p); if (hk < 0 || seen.has(hk)) return false; seen.add(hk); return true; }).sort((a, b) => honorKind(a) - honorKind(b));
            if (!cs.length) return '<div class="ld-cell is-empty ld-card"><span>' + SLOT_NAME.card + '</span></div>';
            return '<div class="ld-cell is-filled ld-card ld-hcs n' + cs.length + '">' + cs.map(p => {
                const hk = honorKind(p), icon = cb.itemIcon(p), nm = String(p.base || '').replace(/^榮耀卡片：/, '');
                return '<span class="ld-hc k' + hk + '" data-hck="' + hk + '" role="button" title="' + esc(p.full) + '"><span class="ld-hc-ic">' + (icon ? itemImg(icon, p) + hsFx(p) : '') + '</span><i>' + esc(nm) + '</i></span>';
            }).join('') + '</div>';
        }
        const p = m[k];
        // 娃娃格：網頁版魔法娃娃不是背包道具（dolls.js，S_Web 29），原本只認背包裡裝著的娃娃道具 → 叫出來的娃娃這格是空的（站長 2026-10-24「有帶娃娃 裝備欄沒顯示」）。
        //   沒有道具娃娃時照娃娃系統裝著的那隻畫（圖示、名字），點了打開魔法娃娃視窗
        if (!p && k === 'doll') {
            const w = cb.dollsOwned && (cb.dollsOwned() || []).find(d => d.worn);
            if (w) return '<div class="ld-cell is-filled ld-dollw" data-dollwin="1" title="' + esc(w.full || w.name) + '"><img src="' + esc(w.src) + '" alt="" draggable="false"></div>';
        }
        if (!p) return '<div class="ld-cell is-empty" data-slot="' + k + '"><span>' + SLOT_NAME[k] + '</span></div>';
        const icon = cb.itemIcon(p);
        return '<div class="ld-cell is-filled" data-id="' + p.id + '" title="' + esc(p.full) + '">' + (icon ? itemImg(icon, p) : '<span class="nm">' + esc(p.base) + '</span>') +
            (p.en ? '<span class="ld-en"><b>' + (p.en > 0 ? '+' : '') + p.en + '</b></span>' : p.count > 1 ? '<span class="ld-cnt">' + p.count.toLocaleString() + '</span>' : '') + '</div>';
    }
    // 這個職業、這個等級穿不穿得上（伺服器 C_ItemUSe 的職業、等級檢查）；道具表查不到＝當穿得上
    function canWear(p) {
        const t = p.tpl, bit = [1, 2, 4, 8, 16][state.type], lv = state.level || 0;
        return !t || ((t.cls == null || bit == null || (t.cls & bit)) && (!t.minLv || lv >= t.minLv) && (!t.maxLv || lv <= t.maxLv));
    }
    // 道具視窗最上面的換裝比較（站長 2026-10-18「顯示裝備改道具之後會變化的能力值」；equipdiff.js cmpHtml）：還沒穿、鑑定過、穿得上的武器防具才有
    //   跟誰比＝按「替換」真的會脫掉的（replacePlan）：武器伺服器自己換（auto）＝身上那把；雙手武器連盾牌、盾牌連雙手武器；戒指兩格都滿＝兩只都列、預設跟同款那只比（沒有同款跟第一只）
    //   名字不帶 $編號的（伺服器直接送中文名，例：歷戰長靴）查不到道具表 → fixTpl 改用伺服器給的「物件編號 → 道具編號」（invTpl）找
    function equipDiffOf(p) {
        p = fixTpl(p);
        if (p.equipped || !p.identified || !p.tpl || (p.tpl.k !== 'w' && p.tpl.k !== 'a') || !p.slot || !canWear(p)) return '';
        const worn = equipped().map(fixTpl), plan = replacePlan(p);
        let off = [], rings = null, pick = 0;
        if (plan && plan.pick) { rings = plan.pick; pick = Math.max(0, rings.findIndex(r => r.nid === p.nid)); }
        else if (plan) { off = plan.out.slice(); const w = plan.auto && worn.find(q => q.slot === 'wpn'); if (w) off.unshift(w); }
        return cmpHtml(p, { off, rings, pick, worn, icon: q => cb.itemIcon(q) });
    }
    // 點空的裝備格：背包裡穿得到這一格的（職業、等級合）列出來，點一件就穿上（跟道具視窗的「裝備」同一條路）
    // 第 448 項（經營者檢查 2026-10-29「選武器沒有推薦，法師可能拿劍」）：武器格的清單裡，象牙塔武器照職業標「推薦」、排第一個
    //   （新角色背包是這個職業能拿的象牙塔武器＋長弓，伺服器 WebTutorial.starter）：王族單手劍、騎士雙手劍、妖精弓、法師魔杖、黑妖雙刀
    const REC_WPN = { 0: ['sword'], 1: ['tohandsword'], 2: ['bow'], 3: ['staff', 'tohandstaff'], 4: ['edoryu'] };
    const recWpn = p => !!(p && p.tpl && /象牙塔/.test(p.base || p.full || '') && (REC_WPN[state.type] || []).includes(p.tpl.type));
    function slotPick(k) {
        const want = k === 'ring1' || k === 'ring2' ? 'ring' : k;
        let list = stacks(bagList().filter(p => !p.equipped && p.slot === want && canWear(p)));
        const rec = want === 'wpn' ? list.filter(s => recWpn(s.p)).slice(0, 1) : [];
        if (rec.length) list = rec.concat(list.filter(s => s !== rec[0]));
        const ov = overlay('lmui-slotpick', '<div class="box"><div class="hd"><span>' + SLOT_NAME[k] + '</span><button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd">' +
            (list.length ? list.map(s => { const icon = cb.itemIcon(s.p), r = rec[0] === s; return '<button type="button" class="opt' + (r ? ' sp-rec' : '') + '" data-id="' + s.p.id + '">' + (icon ? itemImg(icon, s.p) : '') +
                '<span class="' + nameCls(s.p.bless).trim() + '">' + esc(s.p.full) + (s.items.length > 1 ? '（' + s.items.length + '）' : s.p.count > 1 ? ' (' + s.p.count.toLocaleString() + ')' : '') + '</span>' +
                (r ? '<i class="sp-rec-t">推薦</i>' : '') + '</button>'; }).join('')
                : '<div class="sp-none">背包裡沒有可以穿在這裡的裝備</div>') + '</div></div>');
        ov.addEventListener('click', e => {
            const b = e.target.closest('.opt[data-id]'); if (!b) return;
            const p = parsedItems().find(x => x.id === +b.getAttribute('data-id'));
            ov.remove();
            if (p) useItemFlow(p);   // 空格也可能有東西要換（雙手武器要先脫盾）
        });
    }
    function renderDoll(body) {
        const s = state, m = dollMap(), bow = usesArrow(m.wpn);
        const lv = s.level || 0, a = EXP[lv - 1] || 0, b = EXP[lv] || 0;
        const xp = lv >= 99 || !b ? 'EXP MAX' : 'EXP ' + Math.max(0, (s.exp || 0) - a).toLocaleString() + ' / ' + (b - a).toLocaleString();
        const al = s.lawful || 0;
        const pct = (x, y) => y ? Math.max(0, Math.min(100, x / y * 100)) + '%' : '0%';
        const wl = weightLook(s.weight);
        body.innerHTML = '<div id="lmui-doll"><div class="ld2-title"><b class="nm">' + esc(s.name || '') + '</b><span class="lv">Lv.' + lv + '</span><span class="cl">' + (CLASS_NAME[s.type] || '') + '</span></div>' +
            '<div class="ld2-xp">' + xp + '　<span class="' + (wl ? wl.cls : '') + '">負重 ' + (s.weight != null ? Math.round(s.weight / 242 * 100) : 0) + '%</span></div>' +
            (wl ? '<div class="wt-note ' + wl.cls + '">' + wl.note + '</div>' : '') +
            '<div class="ld2-body"><canvas class="ld2-fig" aria-hidden="true"></canvas><div class="ld2-col">' + DOLL_L.map(k => dollCell(k === 'arrow' && !bow ? null : k, m)).join('') + '</div>' +
              '<div class="ld2-mid"></div><div class="ld2-col">' + DOLL_R.map(k => dollCell(k, m)).join('') + '</div></div>' +
            // 血魔條：中間那欄手機上只剩 70px 左右，「HP 138 / 191」放不下（字被切掉）→ 改成裝備格下面整排、左右並排
            '<div class="ld2-bars"><div class="ld2-bar hp"><i style="width:' + pct(s.hp, s.maxHp) + '"></i><span>HP ' + (s.hp || 0) + ' / ' + (s.maxHp || 0) + '</span></div>' +
              '<div class="ld2-bar mp"><i style="width:' + pct(s.mp, s.maxMp) + '"></i><span>MP ' + (s.mp || 0) + ' / ' + (s.maxMp || 0) + '</span></div></div>' +
            '<div class="ld2-stats">' + [['力量', s.str], ['敏捷', s.dex], ['體質', s.con], ['智力', s.int], ['精神', s.wis], ['魅力', s.cha], ['防禦', s.ac], ['魔防', totalMr(s)],
                [al > 0 ? '正義' : al < 0 ? '邪惡' : '中立', Math.abs(al)]].map(x => '<div><em>' + x[0] + '</em><b>' + (x[1] ?? '') + '</b></div>').join('') + '</div></div>';
        figStart();
    }
    // 中間的角色：面向畫面（方向 5）的待機動作，跟場景同一套圖（look.js frameFor）；只在裝備欄看得到時畫
    let figT = 0;
    function figStart() { if (!figT) figT = setInterval(figTick, 100); figTick(); }
    function figStop() { clearInterval(figT); figT = 0; }
    function figTick() {
        if (document.hidden) return;   // 切走時不畫
        const cv = document.querySelector('#lmui-doll .ld2-fig'), me = cb.me && cb.me();
        if (!cv || el.win.classList.contains('hidden')) { figStop(); return; }
        const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
        // 畫布像素＝顯示大小×裝置像素比，照實際的比（Android 常見 2.625：取整數 3 會被瀏覽器再縮一次，整張變糊）；4:3 舞台再乘放大倍率（stage.js）
        const dpr = (window.devicePixelRatio || 1) * stageScale(), bw = Math.round(W * dpr), bh = Math.round(H * dpr);
        if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
        const ctx = cv.getContext('2d'); ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0); ctx.clearRect(0, 0, W, H);
        const hp = cv.parentNode.querySelector('.ld2-bar.hp'), mid = cv.parentNode.querySelector('.ld2-mid');
        const bottom = (hp ? hp.offsetTop : H) - Math.max(14, H * 0.06), mw = mid ? mid.clientWidth : W * 0.4, fx = W / 2;
        const f = me ? frameFor({ gfx: me.gfx, weapon: me.weapon, heading: 5, walking: false, t: 1, phase: 0, name: me.name, isPc: true }, performance.now()) : null;
        // 倍率：高度放得下（腳到頂約 85%）、寬度也放得下（照身體實際畫到的寬度），1～3 倍；水平用身體重心置中（同單機版 figTick）
        //   取「螢幕像素」的整數倍（k）：原圖每個像素一樣寬（2.5 倍在 iPhone 上是 7.5 個螢幕像素＝一格 7 一格 8，看起來糊、不整齊）
        const ms = f && massOf(f), cx = ms ? ms.cx : f ? f.ax : 0;
        const sH = f ? bottom * 0.85 / Math.max(40, f.head || 60) : 1, sW = ms ? (W / 2 * 0.95) / Math.max(10, ms.half) : sH;
        const k = Math.max(1, Math.floor(Math.max(1, Math.min(3, sH, sW)) * dpr));
        // 左右各一排 8 格（頭到腳）：腳下台座對到長靴那一格（左排第 7 格），不再貼著最底下
        const col = cv.parentNode.querySelector('.ld2-col'), boots = col && col.children[6];
        const fy = boots ? Math.min(bottom, Math.round(col.offsetTop + boots.offsetTop + boots.offsetHeight * 0.7)) : bottom;
        ctx.save(); ctx.translate(fx, fy); ctx.scale(1, 0.3);   // 腳下光圈台座
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, mw * 0.6); g.addColorStop(0, 'rgba(255,214,140,.32)'); g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, mw * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(214,170,90,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, mw * 0.42, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        if (!f) return;
        // 人物照螢幕像素畫（不經過 CSS 單位，位置對齊整數像素）
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
        const ox = Math.round(fx * bw / W - (cx - f.sx) * k), oy = Math.round(fy * bh / H - f.ay * k);
        if (f.shadow && f.shadow.complete && f.shadow.naturalWidth) { ctx.globalAlpha = 0.55; ctx.drawImage(f.shadow, Math.round(fx * bw / W - cx * k), oy, f.shadow.naturalWidth * k, f.shadow.naturalHeight * k); ctx.globalAlpha = 1; }
        // 先用 Scale2x 放大 2／4 倍（外框、斜線不會一格一格的鋸齒），剩下的倍數再照原樣放大；
        //   手機（像素比 2 以上）剩下的倍數不整齊也只差 1 個螢幕像素看不出來，電腦上要整除才用
        const p = [4, 2].find(n => n <= k && (dpr >= 2 || k % n === 0)) || 1, up = p > 1 ? crispOf(f, p) : null;
        if (up) ctx.drawImage(up.c, ox + up.x * k, oy + up.y * k, up.w * k, up.h * k);
        else ctx.drawImage(f.im, f.sx, f.sy, f.sw, f.sh, ox, oy, f.sw * k, f.sh * k);
    }
    // 人物圖放大用：裁掉四周透明的部分，再用 Scale2x（EPX）放大 p 倍（2、4）；每張圖、每種倍數做一次。讀不到像素就回 null（照原樣放大）
    //   顏色差一點點也當成同色（色差 ≤ 48）：3.5 的圖邊緣有抖色，完全同色才算的話幾乎不會動到
    const crispCache = new Map();
    function crispOf(f, p) {
        const key = f.im.src + '#' + f.sx + '#' + f.sy + '#' + p;
        if (crispCache.has(key)) return crispCache.get(key);
        let r = null;
        try {
            const c = document.createElement('canvas'); c.width = f.sw; c.height = f.sh;
            const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(f.im, f.sx, f.sy, f.sw, f.sh, 0, 0, f.sw, f.sh);
            const d = x.getImageData(0, 0, f.sw, f.sh).data;
            let x0 = f.sw, y0 = f.sh, x1 = -1, y1 = -1;
            for (let i = 3, n = 0; i < d.length; i += 4, n++) if (d[i]) { const px = n % f.sw, py = (n - px) / f.sw; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
            if (x1 >= 0) {
                x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(f.sw - 1, x1 + 1); y1 = Math.min(f.sh - 1, y1 + 1);
                let im = x.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
                for (let s = 1; s < p; s *= 2) im = scale2x(im, 48);
                const o = document.createElement('canvas'); o.width = im.width; o.height = im.height; o.getContext('2d').putImageData(im, 0, 0);
                r = { c: o, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
            }
            c.width = 0; c.height = 0;
        } catch (e) { r = null; }
        if (crispCache.size > 64) { for (const v of crispCache.values()) if (v && v.c) { v.c.width = 0; v.c.height = 0; } crispCache.clear(); }   // 先歸零再丟（iPhone 畫布上限）
        crispCache.set(key, r);
        return r;
    }
    // 這張圖不透明像素的平均 x（劍細、身體寬，平均會落在身上）＋左右最遠到哪；每張圖量一次（讀不到像素就回 null）
    const massCache = new Map();
    function massOf(f) {
        const key = f.im.src + '#' + f.sx;
        if (massCache.has(key)) return massCache.get(key);
        let r = null;
        try {
            const c = document.createElement('canvas'); c.width = f.sw; c.height = f.sh;
            const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(f.im, f.sx, f.sy, f.sw, f.sh, 0, 0, f.sw, f.sh);
            const px = x.getImageData(0, 0, f.sw, f.sh).data; let sum = 0, n = 0, lo = f.sw, hi = 0; c.width = 0; c.height = 0;
            for (let i = 3, p = 0; i < px.length; i += 4, p++) if (px[i] > 128) { const cx = p % f.sw; sum += cx; n++; if (cx < lo) lo = cx; if (cx > hi) hi = cx; }
            if (n) { const m = sum / n; r = { cx: f.sx + m, half: Math.max(m - lo, hi - m) }; }
        } catch (e) { r = null; }
        massCache.set(key, r);
        return r;
    }

    // ── 魔法書：上方書籤（全體魔法／職業）、左側階數鈕（點了捲到那一階）、5 欄圖示、底部魔攻／魔法防禦（同單機版 renderSkillList） ──
    //   點一下＝看名字和消耗，同一格再點一次＝施放（只限學會的；同單機版 __lmuiSkTap）
    let skBook = 'all', skSel = 0;
    function renderSkills(body) {
        const s = state, type = s.type || 0, all = skillList();
        const free = skFree(), genMax = free ? 10 : (GEN_MAX[type] || 1);   // 解除限制：1～10 階全列、其他職業的魔法也列
        const books = [{ k: 'all', n: '全體魔法' }];
        if ((CLS_LV[type] || []).length) books.push({ k: 'cls', n: CLASS_NAME[type] });
        if (free) books.push({ k: 'oth', n: '其他' });   // 其他職業的職業魔法
        if (!books.some(b => b.k === skBook)) skBook = 'all';
        const groups = [];
        if (skBook === 'all') for (let lv = 1; lv <= genMax; lv++) groups.push({ key: 'g' + lv, label: lv, list: all.filter(x => x.lv === lv), set: 'g' });
        if (skBook === 'oth') CLS_LV.forEach((lvs, t) => { if (t !== type) lvs.forEach((lv, i) => groups.push({ key: 'o' + lv, label: CLASS_NAME[t].slice(0, 1) + (i + 1), list: all.filter(x => x.lv === lv), set: 'o' + t })); });
        // 站長 2026-10-25「騎士治 力 敏 頭盔請實裝」：魔法頭盔給的魔法（伺服器 L1EquipmentSlot.setMagicHelm，例：騎士戴力量魔法頭盔＝擬似魔法武器、無所遁形術、體魄強健術）
        //   在這個職業學不到的階數 → 原本那幾階不列、沒格子可以點；那幾階只列「現在會的」（拿下頭盔伺服器送 S_DelSkill 就消失）
        if (skBook === 'all') for (let lv = genMax + 1; lv <= 10; lv++) { const l = all.filter(x => x.lv === lv && x.learned); if (l.length) groups.push({ key: 'g' + lv, label: lv, list: l, set: 'g' }); }
        if (skBook !== 'oth') (CLS_LV[type] || []).forEach((lv, i) => groups.push({ key: 'c' + lv, label: i + 1, list: all.filter(x => x.lv === lv), set: 'c' }));
        let side = '', cells = [], last = null;
        for (const g of groups) {
            if (!g.list.length) continue;
            if (last && last !== g.set) side += '<span class="gap"></span>';
            last = g.set;
            side += '<button type="button" data-grp="' + g.key + '">' + g.label + '</button>';
            g.list.forEach((x, i) => {
                const ic = cb.skillIcon(x.name), e = learnOf(x), can = e && (s.level || 0) >= e.lv;
                // 能花錢學的（伺服器 S_Web 35 給的）：格子照樣暗（同其他沒學的），上面標價錢、可以點；等級還沒到＝上面標「LvN」
                //   （站長 2026-10-21「還沒學一樣顯示暗色，上面顯示金額就好」：原本亮＋金框、價錢在下面）
                const tag = !e ? '' : can ? '<span class="lk-tag lk-buy">' + learnPrice(e.price) + '</span>' : '<span class="lk-tag">Lv' + e.lv + '</span>';
                cells.push('<div class="lsk-cell' + (x.learned && !x.attrOff ? '' : ' is-unlearned') + '"' + (i ? '' : ' data-grp="' + g.key + '"') + ' data-sid="' + x.sid + '" title="' + esc(x.name) + '">' +
                    (ic ? '<img alt="" src="' + esc(ic) + '">' : '<span class="nm">' + esc(x.name) + '</span>') + tag + '</div>');
            });
        }
        while (cells.length % 5 || cells.length < 30) cells.push('<div class="lsk-cell is-empty"></div>');
        const sel = all.find(x => x.sid === skSel);
        const info = sel ? skillTip(sel, type) : '';
        // 只換有變的那一塊（站長 2026-10-22「魔法欄滑動跟點擊卡卡的」）：血、魔、經驗每跳一次都會叫到這裡（hud.update → renderWin），
        //   原本每次整個視窗重建——手指底下的格子、正在捲的那層被換掉，捲動停住、點了沒反應。選中的框（.sel）直接改 class，不重建格子
        let root = body.firstElementChild;
        if (!root || !root.classList.contains('lsk2')) {
            body.innerHTML = '<div class="lsk2"><div class="lsk2-tabs"></div><div class="lsk2-body"><div class="lsk2-side"></div><div class="lsk2-scroll"><div class="lsk2-grid"></div></div></div>' +
                '<div class="lsk2-info"></div><div class="lsk2-foot"></div></div>';
            root = body.firstElementChild;
            const b = root.querySelector('.lsk2-scroll');
            b.addEventListener('scroll', () => skSyncSide(b), { passive: true });
        }
        const put = (cls, h) => { const e = root.querySelector('.' + cls); if (e._h === h) return false; e._h = h; e.innerHTML = h; return true; };
        put('lsk2-tabs', books.map(b => '<button type="button" data-book="' + b.k + '" class="' + (b.k === skBook ? 'on' : '') + '">' + b.n + '</button>').join('') +
            (cb.betaLearn && cb.betaLearn() ? '<button type="button" class="lsk2-all" data-learnall="1">一鍵學魔法</button>' : '') +   // 伺服器第 695 項：公測期間
            // 離線版：「解除限制」＝學魔法不看職業、等級（再按一次「恢復限制」）
            (cb.skillLimitCan && cb.skillLimitCan() ? '<button type="button" class="lsk2-all lsk2-free' + (skFree() ? ' on' : '') + '" data-skfree="1">' + (skFree() ? '恢復限制' : '解除限制') + '</button>' : ''));
        const moved = put('lsk2-side', side) | put('lsk2-grid', cells.join(''));
        put('lsk2-info', info);
        put('lsk2-foot', '魔攻<b>' + totalSp(s) + '</b>魔法防禦<b>' + totalMr(s) + '</b>%');
        for (const c of root.querySelectorAll('.lsk-cell[data-sid]')) c.classList.toggle('sel', +c.getAttribute('data-sid') === skSel);
        if (moved) skSyncSide(root.querySelector('.lsk2-scroll'));
    }
    // 魔法說明框（版面同單機版 buildSkillTipHTML，內容全部照 3.5 伺服器：skills 表＋Java 整理出的效果、學習等級）
    //   傷害、治療照 L1Magic：傷害＝damage_value＋damage_dice_count 顆 damage_dice 面骰，再依智力、魔攻放大；
    //   治療＝(damage_value＋智力加成) 顆 damage_dice 面骰。說明不寫骰子式，一律寫「最小～最大」
    const CLS_KEY = ['royal', 'knight', 'elf', 'wizard', 'darkelf'];
    const ATTR_NAME = { 1: '地', 2: '火', 4: '水', 8: '風', 16: '光' };
    // bare：吉倫視窗用（spellshop.js）——不寫「去哪學」、不放花錢學的按鈕（那邊自己有「學習」）
    function skillTip(x, type, bare) {
        const t = x.type;
        const kind = t & 64 ? '攻擊魔法' : t & 16 ? '治癒魔法' : t & 32 ? '復活魔法' : t & 8 ? '即死魔法' : t & (1 | 4) ? '弱化魔法' : t & 128 ? '特殊魔法' : '輔助魔法';
        const color = t & 64 ? 'tc-atk' : t & 16 ? 'tc-heal' : 'tc-buff';
        const L = (cb.skillLearn ? cb.skillLearn() : {})[CLS_KEY[type]] || {};
        const exc = L.exceptions || {};   // 例外表裡寫 null＝這個職業學不到（例如沒有魔法水晶可讀）
        const le = learnOf(x);   // 能花錢學的：等級照伺服器給的（黑暗妖精花錢學 1／2 階是 Lv12／24，讀書是 Lv10／20）
        const need = le ? le.lv : Object.prototype.hasOwnProperty.call(exc, x.sid) ? exc[x.sid] : (L.levels || {})[x.lv];
        const meta = need != null ? ['需求等級 ' + need] : bare ? [] : ['你的職業不能學'];   // bare：吉倫視窗上面已經寫了
        const cut = mpCut(x.sid, x.mp, state.int || 0);
        const cost = []; if (x.hp) cost.push('體力 ' + x.hp); if (x.mp) cost.push('魔力 ' + x.mp + (cut ? '（智力減免 ' + cut + '，實扣 ' + (x.mp - cut) + '）' : '')); if (x.item && x.itemName) cost.push(x.itemName + '×' + (x.itemN || 1));
        if (cost.length) meta.push('消耗' + cost.join('、'));
        if (x.dur) meta.push('持續 ' + x.dur + ' 秒');
        if (x.cd >= 500) meta.push('冷卻 ' + (Math.round(x.cd / 100) / 10) + ' 秒');
        const TO = [[1, '玩家'], [2, '怪物'], [4, '血盟'], [8, '隊伍'], [16, '寵物'], [32, '地面']];
        // 不用選目標的：給血盟、隊伍、寵物的（烈炎氣息、暴風之眼、大地的祝福、生命的祝福、士氣三招、體力回復術、集體傳送術）＝「自己、隊伍」這樣列；
        //   其他有範圍的（範圍攻擊）不寫、沒範圍的＝自己（原本有範圍的一律不寫 → 這些看不出對象是隊伍，2026-10-18 法師魔法測試回報）
        const party = TO.filter(o => (o[0] === 4 || o[0] === 8 || o[0] === 16) && (x.to & o[0])).map(o => o[1]);
        //   要選目標、對象只有血盟／隊伍的（通暢氣脈術、狂暴術、聖結界…）也能給自己（沒鎖定就給自己，main.js castSkill）→ 前面加「自己」
        const tgt = x.target === 'none' ? (party.length ? ['自己'].concat(party).join('、') : x.area ? '' : '自己')
            : !x.to ? '自己' : ((x.to & (4 | 8)) && !(x.to & 1) ? ['自己'] : []).concat(TO.filter(o => x.to & o[0]).map(o => o[1])).join('、');
        const geo = [];
        if (tgt) geo.push('對象：' + tgt);
        if (x.target !== 'none' && x.range) geo.push('距離：' + (x.range < 0 ? '畫面內' : x.range + ' 格'));
        if (x.area) geo.push('範圍：' + (x.area < 0 ? '畫面內' : x.area + ' 格'));
        if (ATTR_NAME[x.attr]) geo.push(ATTR_NAME[x.attr] + '屬性');
        const eff = [];
        if (t & 64 && x.dd > 0) eff.push('傷害 ' + (x.dv + x.dc) + '～' + (x.dv + x.dc * x.dd) + '（另加智力、魔攻加成）');
        else if (t & 64 && x.dv > 0) eff.push('傷害 ' + x.dv);
        if (t & 16 && x.dd > 0 && x.dv > 0) eff.push('治療 ' + x.dv + '～' + x.dv * x.dd + '（另加智力加成）');
        if (x.soon) eff.push('尚未開放');   // 網頁還做不到（main.js SKILL_SOON：呼喚盟友、援護盟友、變形術）
        if (x.effect) eff.push(x.effect);
        // 還沒學會：能花錢學、等級到了＝下面一顆學習鈕；等級沒到＝「LvN 才能學」；不能花錢學＝寫要用什麼學（伺服器沒給清單＝舊伺服器，照原本「還沒學會」）
        //   （自己一行，不跟效果說明接在一起）
        const canBuy = le && (state.level || 0) >= le.lv;
        //   第 129 項（站長 2026-10-23「花金幣學取消，都跟 NPC 學」）：伺服器清單沒有這個魔法、這個職業能學、有 NPC 賣＝「到主城的吉倫買魔法書」（data/spellwhere.json）
        const buy = !x.learned && !le && need != null ? buyWhere(x) : '';
        const how = !bare && x.learned && x.attrOff ? x.attrOff : bare || x.learned || canBuy ? '' : le ? 'Lv' + le.lv + ' 才能學' : buy || (cb.learnKnown && cb.learnKnown() && need != null ? howLearn(x.lv) : '還沒學會');
        return '<div class="sk-tip"><b class="' + color + '">' + esc(x.name) + '</b><em>' + kind + '・第 ' + groupNo(x, type) + ' 階</em>' +
            '<div>' + meta.map(esc).join('・') + '</div>' + (geo.length ? '<div>' + geo.map(esc).join('・') + '</div>' : '') +
            (eff.length ? '<div class="eff">' + eff.map(esc).join('／') + '</div>' : '') + (how ? '<div class="sk-how">' + esc(how) + '</div>' : '') +
            (x.sid === 51 && cb.summonTip ? cb.summonTip() : '') +   // 召喚術：現在會叫出什麼＋召喚表（main.js → summon.js）
            (!bare && !x.learned && canBuy ? '<div class="sk-learn"><button type="button" data-learn="' + x.sid + '">' + (le.price ? '花 ' + learnPrice(le.price) + ' 金幣學習' : '免費學習') + '</button></div>' : '') + '</div>';
    }
    // ── 花金幣學魔法（站長 2026-10-21「在魔法欄位直接點擊學習魔法」；伺服器 web/WebLearnMagic，本機改動第 68 項）──
    //   能學哪些、價錢、幾級都照伺服器給的清單（S_Web 35，打開魔法視窗時要）；點了先跳確認，按「學習」才送 C_Web 29（只送技能編號）。
    //   學會了伺服器送 S_AddSkill（格子變亮、快捷格／掛機設定的魔法選單跟著有）＋系統訊息；學不了的原因也是系統訊息（剛按過會跳提示）
    function learnOf(x) {
        if (x.learned || !cb.learnInfo) return null;
        // 第 117 項：屬性魔法跟自己的精靈屬性不一樣（或還沒選）＝不顯示學習鈕（伺服器也不收）；解除限制＝不管屬性
        const mine = cb.elfAttr ? cb.elfAttr() : null;
        if (!skFree() && mine != null && x.lv >= 17 && ATTR_NAME[x.attr] && x.attr !== 16 && x.attr !== mine) return null;
        return cb.learnInfo(x.sid);
    }
    function learnPrice(n) { return (n || 0).toLocaleString(); }
    // 不能花錢學的要用什麼學（skills 表 skill_level：騎士 11～12、黑暗妖精 13～14、妖精 17～22；其他＝魔法書，王族的也是「魔法書(…)」）
    function howLearn(lv) { return '用' + bookKind(lv) + '學'; }
    function bookKind(lv) { return lv === 11 || lv === 12 ? '技術書' : lv === 13 || lv === 14 ? '黑暗精靈水晶' : lv >= 17 ? '精靈水晶' : '魔法書'; }
    // 第 129 項：哪裡買（data/spellwhere.json，最多寫兩處）；屬性魔法跟自己的精靈屬性不一樣（或還沒選）＝不寫（買了也學不了）
    function buyWhere(x) {
        const w = cb.spellWhere ? cb.spellWhere(x.sid) : null;
        if (!w || !w.length) return '';
        const mine = cb.elfAttr ? cb.elfAttr() : null;
        if (x.lv >= 17 && ATTR_NAME[x.attr] && x.attr !== 16 && mine != null && x.attr !== mine) return '';
        return '到' + w.slice(0, 2).map(p => p[0] + '的' + p[1]).join('、') + '學習';   // 第 133 項：商店的書買了直接學會
    }
    function learnAsk(x) {
        const e = learnOf(x);
        if (!e || (state.level || 0) < e.lv) return;
        const short = e.price > (state.gold || 0), ic = cb.skillIcon(x.name), price = learnPrice(e.price);
        const ov = overlay('lmui-learnyn', '<div class="box"><div class="hd"><span>學習魔法</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd"><div class="cl-ask lk-ask">' + (ic ? '<img alt="" src="' + esc(ic) + '">' : '') +
            '<div>' + (short ? '學 <b>' + esc(x.name) + '</b> 要 ' + price + ' 金幣，金幣不夠。' : '學會 <b>' + esc(x.name) + '</b>？' + (e.price ? '<br>花 ' + price + ' 金幣' : '')) + '</div></div></div>' +
            '<div class="ft">' + (short ? '<button type="button" data-x="1">關閉</button>' : '<button type="button" data-x="1">取消</button><button type="button" data-ok="1">學習</button>') + '</div></div>');
        ov.classList.add('cl-ov');
        const ok = ov.querySelector('[data-ok]');
        if (ok) ok.addEventListener('click', () => { ov.remove(); if (cb.learnMagic) cb.learnMagic(x.sid); });
    }
    function groupNo(x, type) { const i = (CLS_LV[type] || []).indexOf(x.lv); if (i >= 0) return i + 1; const o = CLS_LV.find(a => a.includes(x.lv)); return o ? o.indexOf(x.lv) + 1 : x.lv; }   // 別的職業的職業魔法（吉倫視窗看得到）：照那個職業的第幾階   // 職業魔法照書裡的第幾階
    function skSyncSide(box) {
        const cells = box.querySelectorAll('.lsk-cell[data-grp]'), base = box.firstElementChild ? box.firstElementChild.offsetTop : 0;
        let top = box.scrollTop + 4, cur = null;
        if (box.scrollHeight > box.clientHeight + 2 && box.scrollTop + box.clientHeight >= box.scrollHeight - 2) top = box.scrollTop + box.clientHeight - 8;
        for (const c of cells) { if (c.offsetTop - base <= top) cur = c.getAttribute('data-grp'); else break; }
        if (!cur && cells.length) cur = cells[0].getAttribute('data-grp');
        box.closest('.lsk2').querySelectorAll('.lsk2-side button').forEach(b => b.classList.toggle('on', b.getAttribute('data-grp') === cur));
    }

    // ── 設定：「系統」（回選角、更新紀錄、戰鬥音效／背景音樂；一打開就是這頁）＋掛機輔助六頁（狩獵／補給／魔法／召喚／名單／輔助，照站長給的內掛選單截圖） ──
    //   登出鈕拿掉（站長 2026-10-18「登出跟回選角重複了」）：回選角 → 選角畫面的返回＝登出（main.js cb.logout：通行碼作廢、回登入畫面）
    //   掛機設定存在伺服器（C_Web 3／S_Web 2；伺服器 WebAutoSettings.sanitize 夾範圍、只認學會的魔法），改了就送；伺服器沒回設定（還沒支援 AUTO）六頁顯示讀取中。
    //   每頁最上面「開始／停止掛機」＝HUD 的 AUTO 鈕。自動賣出／刪除照舊在背包（站長 2026-10-17：掛機頁不放）
    let settingsSig = '', settingsTab = '', lastRoam = 20, settingsLaterFn = null;   // settingsLaterFn：見 settingsLater
    // 召喚頁的寵物卡：背包裡有寵物的項圈（伺服器 S_Web 11：名字、等級、血、0 收在項圈／1 在身邊／2 死了＋每隻的喝水／加速設定）；打開設定頁、夥伴有變時跟伺服器要（3 秒最多一次）
    //   petExt：伺服器有沒有帶設定（＝收 C_Web 8-7 照項圈存）；null＝還沒回。舊伺服器（false）照原本：寵物卡只列叫出來的、自動復活／叫出用下面原本的「寵物」區塊
    let petCols = [], petColsAt = 0, petExt = null;
    function setPetCollars(l) { petCols = l; petExt = !!l.ext; if (cur === 'automation') renderWin(); npcUi.petsChanged(); renderCompWin(); }
    let petColsTimer = 0;
    const wantCollars = () => cur === 'automation' || npcUi.keepOpen() || !!$('lmui-compwin');   // 設定頁、寵物保管員、夥伴視窗開著才要
    function askCollars(force) {
        const now = Date.now();
        if (!cb.petCollars) return;
        if (force || now - petColsAt > 3000) { clearTimeout(petColsTimer); petColsTimer = 0; petColsAt = now; cb.petCollars(); }
        else if (!petColsTimer) petColsTimer = setTimeout(() => { petColsTimer = 0; if (wantCollars()) askCollars(true); }, petColsAt + 3000 - now);   // 3 秒內又有變：等時間到再要一次（不然最後一次變動會漏掉）
    }
    function renderSettings(body) {
        const s = cb.autoSettings ? cb.autoSettings() : null, tab = winTab, on = !!(cb.autoOn && cb.autoOn());
        // 血魔每跳都會呼叫 renderWin：內容沒變就不重畫（不然正在打的數字、拖的音量條會被洗掉）；正在選、正在打字也先不畫
        const off = !!(cb.offLogAvail && cb.offLogAvail());
        const sig = JSON.stringify([tab, s, on, off, skillList().filter(x => x.learned).map(x => x.sid), state.type, state.level,
            cb.autoPotions ? cb.autoPotions().length : 0, cb.polys ? cb.polys().length : 0, petCols, cb.mapId ? cb.mapId() : 0, !!(cb.signinReady && cb.signinReady()), !!(cb.inviteReady && cb.inviteReady()), !!(cb.promoReady && cb.promoReady()),
            tab === '召喚' ? [comps.map(c => [c.id, c.kind, c.name, c.lv, c.pct, c.pot, c.heal, c.green, c.gmode]), compCanHaste, petExt] : 0, tab === '名單' ? [!!(cb.mapMobs && cb.mapMobs()), cb.mobsArea ? cb.mobsArea() : ''] : 0, isPc(),
            tab === '補給' ? greenUsers(40013) + greenUsers(40018) * 100 : 0, cb.shopCost ? cb.shopCost(40100, 1) : 0,   // 價錢表讀到了要重畫（小字的金額）
            tab === '系統' && cb.bookmarks ? cb.bookmarks().map(b => [b.id, b.name, b.color]) : 0, tab === '系統' && cb.pushState ? cb.pushState() : 0, tab === '召喚' ? [dollShow(), (cb.dollsOwned && cb.dollsOwned() || []).map(d => [d.id, d.cost])] : 0]);   // 第 153 項：擁有的娃娃變了（自動召喚的選單）   // 記憶座標新增、刪除、改顏色；娃娃視窗改了顯示娃娃（召喚頁）
        if (sig === settingsSig && body.firstElementChild) return;
        if (tab === settingsTab && body.contains(document.activeElement) && /^(INPUT|SELECT)$/.test(document.activeElement.tagName) && document.activeElement.type !== 'checkbox') { settingsLater(body); return; }
        if (settingsLaterFn) { body.removeEventListener('focusout', settingsLaterFn); settingsLaterFn = null; }
        if (!settingsSig) askCollars(true);   // 剛打開設定頁
        const top = tab === settingsTab ? body.scrollTop : 0;
        settingsSig = sig; settingsTab = tab;
        if (tab === '系統') body.innerHTML = systemHtml();
        else if (!s) body.innerHTML = '<div class="lmui-soon">讀取中…</div>';
        // 召喚頁不放「開始掛機」「上次離線掛機」（站長 2026-10-24「開始掛機從召喚這邊拿掉 娃娃介面排第一個 不要在滑到下面去」）
        else body.innerHTML = '<div class="as">' + (tab === '召喚' ? '' : '<button type="button" class="as-go' + (on ? ' on' : '') + '" data-go="1">' + (on ? '停止掛機' : '開始掛機') + '</button>' +
            (off ? '<button type="button" class="st-link as-off" data-offlog="1">上次離線掛機</button>' : '')) + AS_PAGE[tab](s) + '</div>';
        body.scrollTop = top;
        trimPics(body);
    }
    // 正在打字、正在選而沒重畫的：離開輸入框後補畫一次（寵物卡改過喝水 % 之後焦點留在框裡，叫出寵物、升級推來的新資料原本要等下一包才畫，
    //   在村莊不動就一直停在「Lv.5 收在項圈」，2026-10-20 實測）。跳到同一頁另一個欄位＝等它也離開；等 200 毫秒讓點下去的那一下（勾選框、按鈕）先做完
    function settingsLater(body) {
        if (settingsLaterFn) return;
        const h = settingsLaterFn = e => {
            if (e.relatedTarget && body.contains(e.relatedTarget)) return;
            body.removeEventListener('focusout', h); if (settingsLaterFn === h) settingsLaterFn = null;
            setTimeout(() => { if (cur === 'automation') renderWin(); }, 200);
        };
        body.addEventListener('focusout', h);
    }
    // 傷害數字：一列四格（站長 2026-10-24「不要做成兩個」＋「玩家會選擇性開啟哪個」）全部／只看攻擊／只看受到／關閉，照兩個舊 key 的組合亮哪格、按了兩個 key 一起寫。
    //   沒設過＝攻擊開、受到的關（同 main.js dmgHidden）＝亮「只看攻擊」
    //   經驗值飄字（l1web_exp_num，沒設過＝開；main.js expHidden 讀）
    const DMG_MODES = [['all', '全部', '1', '1'], ['out', '只看攻擊', '1', '0'], ['self', '只看受到', '0', '1'], ['off', '關閉', '0', '0']];
    const dmgMode = () => { let o = true, s = false; try { const a = localStorage.getItem('l1web_dmg_out'), b = localStorage.getItem('l1web_dmg_self'); if (a != null) o = a === '1'; if (b != null) s = b === '1'; } catch (e) { /* 無痕 */ }
        return o ? (s ? 'all' : 'out') : (s ? 'self' : 'off'); };
    const dmgSeg = () => { const m = dmgMode(); return '<div class="sy-seg-row"><span class="sy-lb"><i aria-hidden="true">💥</i>顯示傷害</span><div class="sy-seg" role="radiogroup" aria-label="顯示傷害">' +
        DMG_MODES.map(d => '<button type="button" role="radio" data-dmgmode="' + d[0] + '" aria-checked="' + (d[0] === m) + '"' + (d[0] === m ? ' class="on"' : '') + '>' + d[1] + '</button>').join('') + '</div></div>'; };
    const expOn = () => { try { return localStorage.getItem('l1web_exp_num') !== '0'; } catch (e) { return true; } };
    // 省電模式（站長 2026-10-25「手機玩家 系統設定頁 新增省電模式開關 且說明該功能」「默認關閉」）：l1web_power_save＝'1' 開；main.js powerSave 讀
    //   只在觸控裝置（手機、平板）顯示；開了＝畫面每秒最多 30 格、畫布照 1 倍像素畫（原本最高 2 倍）
    const powerOn = () => { try { return localStorage.getItem('l1web_power_save') === '1'; } catch (e) { return false; } };
    const touchDev = () => { try { return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0; } catch (e) { return false; } };
    // 夥伴打的傷害開關：站長 2026-11-03 取消（夥伴的傷害數字一律不畫，main.js）
    const OPT_KEYS = { exp: ['l1web_exp_num'], out: ['l1web_dmg_out'], self: ['l1web_dmg_self'], power: ['l1web_power_save'] };
    // 系統頁版面（站長 2026-10-24「系統分頁裡面內容整理一下 有點亂」）：分區小標題＋兩欄功能鈕、切換開關、音量拉條旁邊顯示數值；回選角放最下面分開。
    //   data-s／data-dmgopt／data-winreset／data-bmadd… 跟事件處理照舊（tutorial.js 找 [data-s="signin"]）；不要用 data-t、data-sl（onBodyChange 會當成 AUTO 設定送伺服器）
    const syBtn = (attr, ico, txt) => '<button type="button" class="sy-btn" ' + attr + '><i aria-hidden="true">' + ico + '</i><span>' + txt + '</span></button>';
    const sySw = (attr, on, ico, txt) => '<label class="sy-sw"><span class="sy-lb"><i aria-hidden="true">' + ico + '</i>' + txt + '</span><input type="checkbox" ' + attr + (on ? ' checked' : '') + '></label>';
    const syVol = (k, on, v, ico, txt) => '<div class="sy-vol">' + sySw('data-s="' + k + '"', on, ico, txt) +
        '<div class="sy-rng"><input type="range" min="0" max="100" data-s="' + k + 'Vol" value="' + v + '" aria-label="' + txt + '音量"><b data-volv="' + k + 'Vol">' + v + '</b></div></div>';
    function systemHtml() {
        const a = audioCfg(), sign = cb.signinReady && cb.signinReady();
        return '<div class="sy"><div class="sy-h">一般</div><div class="sy-grid">' +
            syBtn('data-s="log"', '📜', '更新紀錄') +
            // 站長 2026-11-09「設定那個我要拿掉」：［邀請好友］拿掉，領好友獎勵改從推廣視窗拉人那段的［好友獎勵］進（promo.js）   // 伺服器第 703 項（站長 2026-11-07「邀請好友」）：收過 S_Web 73 而且功能開著才有（invite.js）
            (cb.promoReady && cb.promoReady() ? syBtn('data-s="promo"', '📣', '推廣獎勵') : '') +   // 伺服器第 710 項（站長 2026-11-08「推廣系統」）：收過 S_Web 74 而且功能開著才有（promo.js）
            (isPc() ? syBtn('data-winreset="1"', '🔄', '視窗歸位') : '') + '</div>' +   // 電腦版面（橫的）：拖過的視窗放回預設位置
            '<div class="sy-h">聲音</div><div class="sy-card">' + syVol('sfx', a.sfx, a.sfxVol, '🔊', '戰鬥音效') + syVol('bgm', a.bgm, a.bgmVol, '🎵', '背景音樂') + '</div>' +
            // 畫面數字開關（站長 2026-10-24「新增顯示經驗值或關閉 做按鈕開跟關就好；顯示傷害也是開跟關 不要做成兩個」；存在這台裝置）
            // 站長同日改：「顯示傷害的回原本的設定」→ 攻擊傷害、受到的傷害兩個各自開關（同原本兩項；沒設過＝攻擊開、受到的關）
            // 站長 2026-10-31「系統設定新增夥伴傷害顯示開關」「系統頁整理一下」：傷害數字開關一區（自己打的／自己受到的；夥伴打的那顆站長 2026-11-03 取消）；
            //   經驗值、省電（只有觸控裝置）併成「畫面」一區；聲音照舊放最上面（站長同日「聲音放上面」）
            '<div class="sy-h">傷害數字</div><div class="sy-card">' + sySw('data-dmgopt="out"', dmgMode() === 'all' || dmgMode() === 'out', '⚔️', '自己打的') +
                sySw('data-dmgopt="self"', dmgMode() === 'all' || dmgMode() === 'self', '🩸', '自己受到的') + '</div>' +
            '<div class="sy-h">畫面</div><div class="sy-card">' + sySw('data-dmgopt="exp"', expOn(), '✨', '顯示經驗值') +
                (touchDev() ? sySw('data-dmgopt="power"', powerOn(), '🔋', '省電模式') + '<p class="sy-note">手機比較不燙、比較省電，畫面會稍微模糊、動作稍微不順。</p>' : '') + '</div>' +
            pushHtml() + bookmarkHtml() +
            '<div class="sy-end">' + syBtn('data-s="char"', '🚪', '回選角') + '</div></div>';
    }
    // 手機通知（伺服器第 534 項，站長 2026-10-31「系統設定 新增開關 手機推播：伺服器重開、被玩家攻擊」；push.js）：沒有 cb.pushState＝舊版主程式，不列
    function pushHtml() {
        const p = cb.pushState ? cb.pushState() : null;
        if (!p) return '';
        return '<div class="sy-h">手機通知</div><div class="sy-card">' + sySw('data-push="restart"', p.restart, '🔔', '伺服器重開') + sySw('data-push="pvp"', p.pvp, '🛡️', '被玩家攻擊') +
            (p.village == null ? '' : sySw('data-push="village"', p.village, '🏠', '角色回村')) +   // 2026-11-10 站長「設定裡面新增 角色回村手機提醒通知開關 默認關閉」；舊伺服器沒有＝不列
            (p.note ? '<p class="sy-note">' + esc(p.note) + '</p>' : '') + '</div>';
    }
    // ── 記憶座標（系統頁最底下，伺服器本機改動第 88 項；站長 2026-10-22「在設定頁面系統的最底下新增『記憶座標』…在使用祝福的瞬間移動卷軸就可以飛過來記憶的點…後面有可以按刪除」）──
    //   「記憶座標」→ 輸入名稱（預先填所在地名）、選字的顏色 → 送伺服器記下目前位置；能不能記（只有大陸、說話之島）、名稱、個數、同名都是伺服器判斷，不行回一句（聊天框＋提示）。
    //   清單照伺服器送的（main.js G.bookmarks，照名稱排好），名字照它的顏色，前面的色點＝改顏色，後面「刪除」。用祝福的瞬間移動卷軸時跳 bookmarkPick 選飛哪裡（main.js bookmarkScroll）
    //   第 95 項（站長 2026-10-22「可輸入空格、符號。記憶好的字樣可以選擇顏色。開頭同字的會自動排列在一起」）：顏色存伺服器（character_teleport.color）
    const bmColor = c => { const p = cb.bookmarkColors ? cb.bookmarkColors().list : []; return p[c] || p[0] || ''; };
    const bmStyle = b => ' style="color:' + esc(bmColor(b.color | 0)) + '"';
    function bookmarkHtml() {
        const list = cb.bookmarks ? cb.bookmarks() : null;
        if (!list) return '';
        return '<div class="sy-h">記憶座標</div><div class="st-bm sy-bm">' + syBtn('data-bmadd="1"', '📍', '記憶目前位置') +
            (list.length ? '<div class="bm-list">' + list.map((b, i) => '<div class="bm-row"><button type="button" class="bm-dot" data-bmcolor="' + i + '" aria-label="改顏色" style="background:' + esc(bmColor(b.color | 0)) + '"></button>' +
                '<span' + bmStyle(b) + '>' + esc(b.name) + '</span><button type="button" class="bm-del" data-bmdel="' + i + '">刪除</button></div>').join('') + '</div>' : '') + '</div>';
    }
    // 顏色那一排（新增視窗、改顏色視窗共用）：sel＝目前選的編號
    function bmSwatches(sel) {
        const c = cb.bookmarkColors ? cb.bookmarkColors() : { list: [], names: [] };
        return '<div class="bm-sw">' + c.list.map((col, i) => '<button type="button" class="bm-swb' + (i === sel ? ' on' : '') + '" data-sw="' + i + '" aria-label="' + esc(c.names[i] || '') + '" style="background:' + esc(col) + '"></button>').join('') + '</div>';
    }
    // 新增：輸入名稱、選顏色（網頁先擋存不進去的字、太長、同名，伺服器照樣再判斷）
    function bookmarkAdd() {
        const r = cb.bookmarkName ? cb.bookmarkName() : null;
        if (!r) return;
        let color = 0;
        const ov = overlay('lmui-bmadd', '<form class="box"><div class="hd"><span>記憶座標</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd"><input type="text" class="bm-in" maxlength="' + r.max + '" value="' + esc(r.def) + '" placeholder="名稱" autocomplete="off" enterkeyhint="done" aria-label="名稱">' +
            bmSwatches(color) + '<div class="bm-err" aria-live="polite"></div></div>' +
            '<div class="ft"><button type="button" data-x="1">取消</button><button type="submit">記憶</button></div></form>');
        const inp = ov.querySelector('input'), err = ov.querySelector('.bm-err');
        const paint = () => { inp.style.color = bmColor(color); ov.querySelectorAll('.bm-swb').forEach(b => b.classList.toggle('on', +b.getAttribute('data-sw') === color)); };
        paint();
        ov.addEventListener('click', e => { const b = e.target.closest('.bm-swb'); if (b) { color = +b.getAttribute('data-sw'); paint(); } });
        inp.addEventListener('keydown', e => e.stopPropagation());   // 打字不要變成走路、快捷鍵
        inp.addEventListener('input', () => { err.textContent = ''; });
        ov.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            const v = r.norm(inp.value), list = cb.bookmarks() || [];
            const why = !v ? '請輸入名稱' : r.bad(v) ? '有不能用的字，請換掉' : v.length > r.max ? '最多 ' + r.max + ' 個字'
                : list.some(b => b.name.toLowerCase() === v.toLowerCase()) ? '已經有同名的了' : '';
            if (why) { err.textContent = why; inp.focus(); return; }
            ov.remove(); cb.addBookmark(v, color);
        });
        try { inp.focus(); inp.select(); } catch (e) { /* 手機要在點擊當下 focus 才會跳鍵盤 */ }
    }
    // 改顏色：點清單上名字前面的色點
    function bookmarkRecolor(b) {
        const ov = overlay('lmui-bmcolor', '<div class="box"><div class="hd"><span' + bmStyle(b) + '>' + esc(b.name) + '</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd">' + bmSwatches(b.color | 0) + '</div></div>');
        ov.addEventListener('click', e => { const s = e.target.closest('.bm-swb'); if (!s) return; ov.remove(); const c = +s.getAttribute('data-sw'); if (c !== (b.color | 0)) cb.bookmarkColor(b, c); });
    }
    // 祝福的瞬間移動卷軸：飛哪個記憶座標，或照原本隨機瞬移（o.pick(記憶座標編號)，0＝隨機）
    function bookmarkPick(o) {
        try { const ae = document.activeElement; if (ae && ae.blur && ae !== document.body) ae.blur(); } catch (e) { /* 收掉聊天輸入框的鍵盤 */ }
        const ov = overlay('lmui-bmpick', '<div class="box"><div class="hd"><span>' + esc(o.title || '瞬間移動卷軸') + '</span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd"><button type="button" class="opt bm-rand" data-bm="0"><span>隨機瞬移</span></button>' +
            '<div class="grid">' + o.list.map(b => '<button type="button" class="opt" data-bm="' + b.id + '"><span' + bmStyle(b) + '>' + esc(b.name) + '</span></button>').join('') + '</div></div></div>');
        ov.addEventListener('click', e => { const b = e.target.closest('.opt[data-bm]'); if (!b) return; ov.remove(); o.pick(+b.getAttribute('data-bm')); });
    }
    // 頭像：先放種類圖示，單機版動作圖裁好透明邊再換上（讀不到就留圖示）
    function trimPics(box) {
        box.querySelectorAll('img[data-pic]').forEach(im => { const p = im.getAttribute('data-pic'); cb.trimImage(p).then(u => { picUrl.set(p, u || ''); if (u && im.isConnected) { im.src = u; im.className = 'pic'; } }); });
    }
    function petPicHtml(gfx, tname, icon) {   // icon：沒有頭像時的圖（預設項圈；召喚物用種類的魔法圖示）
        const pic = cb.portrait ? cb.portrait(gfx, tname) : null;
        return pic && picUrl.get(pic) ? '<img alt="" src="' + esc(picUrl.get(pic)) + '" class="pic" draggable="false">'
            : '<img alt="" src="' + esc(icon || COLLAR) + '" class="ic"' + (pic && !picUrl.has(pic) ? ' data-pic="' + esc(pic) + '"' : '') + ' draggable="false">';
    }
    // ── 掛機輔助各頁的零件 ──
    const BRAVE = { 0: [40031, '惡魔之血'], 1: [40014, '勇敢藥水'], 2: [40068, '精靈餅乾'], 3: [40733, '名譽貨幣'], 4: [40733, '名譽貨幣'] };   // 勇敢類只用本職業的（伺服器 WebCare.buffItemNeeded）；法師、黑妖用名譽貨幣（2026-11-13）
    const HONOR_COIN = 40733, CHOCO_CAKE = 49138, CAKE_BIT = 33554432;   // 王族、騎士、妖精沒有本職業的勇敢類時喝名譽貨幣；自動吃巧克力蛋糕（offline-auto.js F_CAKE）
    // 效果掛在道具上的魔法：舊伺服器看不出「效果沒了」，會一直重放 → 全部不列。
    //   伺服器 S_Web 2 功能旗標 bit 0（backlog 98，伺服器 c6412fc 起）看穿著的武器／盔甲剩幾秒 → 神聖武器 8、擬似魔法武器 12、鎧甲護持 21、祝福魔法武器 48、暗影之牙 107 可以列；
    //   創造魔法武器 73、提煉魔石 100（改道具、吃材料）一律不列（原本網頁沒接這個旗標，這五個一直沒出現，站長 2026-10-21「有些魔法不會顯示在上面」）
    const ON_ITEM = new Set([8, 12, 21, 48, 73, 100, 107]), ON_ITEM_NEW = new Set([73, 100]);
    // 輔助魔法最多幾個：舊伺服器 C_Web 3 只讀前 8 個（多送後面的欄位會錯位）→ 8；功能旗標 bit 1（伺服器本機改動第 72 項）＝伺服器讀完整份、只留學會的 → 不限
    const BUFF_MAX_OLD = 8, BUFF_MAX = 64;
    const buffMax = s => (s && (s.feat & 2)) ? BUFF_MAX : BUFF_MAX_OLD;
    const ON_KEYS = [];   // 「使用」勾選＋下拉：沒勾＝0（洗魔、召喚魔法第 64 項起也改成圖示框＋開關，現在沒有這種列了）
    // 設定頁改版（站長 2026-10-20，伺服器本機改動第 63 項）：一列＝左邊圖示框（可點的開選單）｜名稱＋拉條（旁邊寫目前數值）＋一行小字｜右邊開關。
    //   開關關掉也記得選的東西和數值（伺服器 *Keep）。T_KEYS：開關 → [實際用的欄位（0＝關）, 記著的欄位]
    const T_KEYS = { potion: ['potion', 'potKeep'], home: ['homeHpPct', 'homeKeep'], open: ['openSkill', 'openKeep'], aoe: ['aoeSkill', 'aoeKeep'], atk: ['atkSkill', 'atkKeep'], heal: ['healSkill', 'healKeep'],
        hp: ['hpSkill', 'hpKeep'], sum: ['summonSkill', 'sumKeep'],   // 第 64 項：洗魔、召喚魔法
        doll: ['dollAuto', 'dollKeep'] };   // 伺服器第 153 項：沒有娃娃時自動召喚（娃娃編號 1～50）
    const ANCIENT_WHITE = 40024;   // 古代白水（伺服器第 688 項 WebCare.ANCIENT_WHITE）：月卡才自動買
    const PICK_POTS = [40010, 40011, 40012];   // 喝水可以選的（伺服器 WebAutoSettings.PICK_POTIONS）：商店有賣、背包沒有也列
    // 第 405 項（站長 2026-10-28「治癒藥水設定可以偵測背包裡有什麼藥水，目前買了古代白水偵測不到」）：背包裡有、會補血的也列（同伺服器 WebAutoSettings.pickablePotion：
    //   HEAL_POTIONS 含受祝福的＋WebCare.OTHER_HEAL＋LOW_HEAL）。選了就只喝那種；商店沒賣的用完就不喝
    const HEAL_IDS = new Set([40010, 40011, 40012, 40019, 40020, 40021, 40022, 40023, 40024, 40029].flatMap(id => [id, id + 100000])
        .concat([41337, 47114, 49137, 41141, 40071, 41300, 40058, 40026, 40027, 40028, 41299, 41411, 41298]));
    // 第 405 項：水中呼吸可以選的（伺服器 WebCare.BREATH_ITEMS；沒設過＝伊娃的祝福 40032）：福利呼吸藥水、水中的水、伊娃的祝福、人魚之鱗
    const BREATH_POTS = [49303, 41344, 40032, 40041];
    const HEAL_BUY = 10;                        // 治癒藥水沒有時一次買幾瓶（伺服器 WebCare.HEAL_BUY）
    const REPAIR_STONES = 5;                    // 武器損傷到 5 就修＝一次用 5 顆磨刀石（伺服器 WebAutoSession.REPAIR_AT）
    const CURE_POT = 40017, CURE_SK = 9;        // 翡翠藥水、解毒術（伺服器 WebCare.CURE_POTION；cureBy 1 藥水、2 魔法）
    // 伺服器本機改動第 81 項（S_Web 2 標記 4＝v4）：解毒多一種安特之樹枝（cureBy 3）、綠水可以選自我加速藥水或強化 綠色藥水（greenPot；伺服器 WebAutoSettings.GREEN_SELF／GREEN_STRONG）
    const CURE_BRANCH = 40507, GREEN_POTS = [40013, 40018];
    const HOLY_SK = 37, HOLY_SCROLL = 40895;   // 聖潔之光、魔法卷軸 (聖潔之光)（伺服器 WebCare 第 118 項）
    const asIco = id => { const t = id ? itemById(id) : null, src = t ? cb.itemIcon({ name: t.name, nid: t.nid }) : ''; return '<span class="as-ico">' + (src ? '<img alt="" src="' + esc(src) + '">' : '') + '</span>'; };
    const asCb = (attr, on, dis) => '<label class="as-cb"><input type="checkbox" ' + attr + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '></label>';
    const asNum = (k, v, lo, hi) => '<input type="number" inputmode="numeric" data-a="' + k + '" min="' + lo + '" max="' + hi + '" value="' + v + '">';
    const asH = t => '<div class="as-h">' + t + '</div>';
    const asNote = t => '<div class="as-note">' + t + '</div>';
    const asSells = id => !cb.shopSells || cb.shopSells(id);
    const asGold = (id, n) => { const c = cb.shopCost ? cb.shopCost(id, n) : 0; return c > 0 ? c.toLocaleString() + ' 金幣' : ''; };   // 價錢表（data/shopbuy.json）還沒產就不寫金額
    const POTION_BUY = 5;   // 藍色藥水、慎重藥水沒有時一次買幾瓶（伺服器 WebCare.POTION_BUY）
    const greenUsers = gp => comps.filter(c => c.green && c.hp > 0 && (c.gmode === 2 ? 40018 : !c.gmode ? 40013 : 0) === (gp === 40018 ? 40018 : 40013)).length;   // 伺服器第 589 項：喝同一種綠水、活著的夥伴（WebCompanions.greenUsers：自動買多買這幾瓶）
    // 新版型的零件：圖示（道具／魔法）、可點的圖示框（data-pick＝開哪個選單）、拉條（data-sl＝欄位，旁邊的數字 data-slv 拉的時候跟著跳）、一列
    const itemSrc = id => { const t = id ? itemById(id) : null; return t ? cb.itemIcon({ name: t.name, nid: t.nid }) : ''; };
    const itemName = id => { const t = id ? itemById(id) : null; return t ? t.name : ''; };
    const skillOf = sid => sid ? skillList().find(x => x.sid === sid) : null;
    const skillSrc = sid => { const k = skillOf(sid); return k && cb.skillIcon ? cb.skillIcon(k.name) || '' : ''; };
    const asImg = src => src ? '<img alt="" src="' + esc(src) + '">' : '';
    const asPick = (kind, src, label, dis) => '<button type="button" class="as-ico as-pk" data-pick="' + kind + '" aria-label="' + label + '"' + (dis ? ' disabled' : '') + '>' + asImg(src) + '</button>';
    const asV = (k, v) => '<span class="as-v" data-slv="' + k + '">' + v + '</span>';
    const asSl = (k, v, lo, hi, label) => '<input type="range" min="' + lo + '" max="' + hi + '" step="1" data-sl="' + k + '" value="' + v + '" aria-label="' + label + '">';
    const asSlRow = (pre, k, v, lo, hi, post) => '<label class="as-sl"><span>' + pre + asV(k, v) + post + '</span>' + asSl(k, v, lo, hi, pre + post) + '</label>';
    const asLine = (ico, title, body, note, tog) => '<div class="as-row as-line">' + ico + '<div class="as-mid"><b>' + title + '</b>' + (body || '') + (note ? '<small>' + note + '</small>' : '') + '</div>' + tog + '</div>';
    const asT = (k, on, dis) => asCb('data-t="' + k + '"', on, dis);
    const tKeep = (s, k) => s[T_KEYS[k][0]] || s[T_KEYS[k][1]] || 0;   // 現在選的（開著＝在用的那個；關著＝記著的）
    const emName = t => t ? '<em>' + esc(t) + '</em>' : '';
    const asSeg = (a, b) => '<span>' + a + '，</span><span>' + b + '</span>';   // 小字兩段：窄螢幕從逗號換行，不會「用一／次 88 金幣」拆開
    // 「使用」＋下拉（useRow：洗魔、召喚魔法）第 64 項改成 skLine（圖示框＋開關）後沒人用了，拿掉
    const pctRow = (pre, k, v, lo, hi, post) => '<div class="as-row as-pct"><span>' + pre + '</span>' + asNum(k, v, lo, hi) + '<span>' + post + '</span></div>';
    // 伺服器第 515 項（站長 2026-10-31「自動切換頭盔然後放體魄強健術、通暢氣脈術、擬似魔法武器」）：魔法頭盔戴著才會的魔法（伺服器 WebHelmBuff.HELMS）；
    //   背包裡有那頂＝輔助魔法清單也列（標「頭盔」），開了「沒學會的用魔法頭盔放」AUTO 換上放完換回
    const helmSids = () => { const out = new Set(); for (const p of parsedItems()) { const hid = p.tpl && p.tpl.id; if (helmWearable(hid)) for (const id of HELM_SK[hid] || []) out.add(id); } return out; };   // HELM_SK、helmWearable 見魔法書那段（頭盔編號 → 會的魔法；這個職業、等級戴不了的不算）
    function asSkills() {
        const sks = skillList().filter(x => x.learned), s0 = cb.autoSettings ? cb.autoSettings() : null;
        const hs = helmSids(), pool = skillList().filter(x => x.learned || hs.has(x.sid));
        const onItem = (s0 && (s0.feat & 1)) ? ON_ITEM_NEW : ON_ITEM;
        // 攻擊魔法不列會心一擊（108：放完自己 HP 1、MP 0，AUTO 會一直放到死；伺服器也當成沒設，backlog 88）
        //   伺服器第 582 項：起死回生術（18）、魔力奪取（39）技能表不是攻擊類，但都是對怪放的 → 也列
        const atk = sks.filter(x => ((x.type & 64) || x.sid === 18 || x.sid === 39) && x.sid !== 108 && x.sid !== 72);   // 72 強力無所遁形術：只傷隱身的玩家（伺服器第 591 項）
        return { sks, learned: new Set(sks.map(x => x.sid)), atk,
            // 範圍技能（伺服器 WebAutoSettings.areaSkill）：攻擊魔法裡技能表範圍欄位不是 0 的，加上極光雷電（打一整排）；
            //   不列強力無所遁形術（72：只傷隱身的玩家，打怪沒用；站長 2026-10-20「範圍技能清單拿掉強力無所遁形術」）
            aoe: atk.filter(x => (x.area !== 0 || x.sid === 17) && x.sid !== 72),
            heal: sks.filter(x => x.type & 16),
            // 洗魔（第 64 項，站長 2026-10-20「顯示有學的心靈轉換 魂體轉換，妖精才會顯示這個設定」）：只列這兩個（伺服器 WebAutoSettings.HP_SKILLS）；召喚：召喚術、召喚屬性精靈、
            //   召喚強力屬性精靈（伺服器第 84 項起收 162；舊伺服器選了 162 存不進去＝照舊沒選）
            hpk: sks.filter(x => x.sid === 130 || x.sid === 146), sum: sks.filter(x => x.sid === 51 || x.sid === 154 || x.sid === 162),
            // 輔助魔法：效果掛在角色身上、有持續時間的才列（沒持續時間的解毒術、無所遁形術…、變形術要選形態：伺服器看「效果沒了」就放，會一直重放）。
            //   對象：不用選目標的、能給玩家的，加上只給血盟／隊伍的（通暢氣脈術、體魄強健術、狂暴術、聖結界：L1SkillUse.isTarget 對象有血盟／隊伍的可以給自己，
            //   AUTO 對自己放、看自己身上的效果；原本只認「玩家」漏掉這四個）；只能放在地上的（治癒能量風暴、精準目標）不列。同伺服器 WebAutoSettings.buffOk
            //   絕對屏障 78、暗隱術 97 不列（伺服器第 474 項 WebBuffClash.notAuto：一出手就解除，AUTO 會一直重放）
            buffs: pool.filter(x => (x.type & 2) && !(x.type & (16 | 64)) && (x.target === 'none' || (x.to & (1 | 4 | 8))) && !onItem.has(x.sid) && x.dur > 0 && x.sid !== 67 && !BUFF_NOT_AUTO.has(x.sid)) };
    }
    // ── 輔助魔法同類互斥（伺服器第 474 項）：互斥組＋強弱由伺服器送（S_Web 2 標記 13，s.clash；網頁不另存一份，舊伺服器沒送＝不互斥）。
    //   勾一個就把同組已勾的取消、那格下面說跟誰只能選一個；同組有勾別的＝其他格標「同類」
    const BUFF_NOT_AUTO = new Set([78, 97]);
    let buffHint = null;   // { sid, text }：剛勾的那格要顯示的提示（重畫後還在，改別的輔助魔法就清掉）
    const clashOf = (s, sid) => (s && s.clash || []).find(g => g.some(m => m.id === sid)) || null;
    function buffTag(s, sid) {
        const tag = t => '<small class="as-bc">' + esc(t) + '</small>';
        if (buffHint && buffHint.sid === sid && s.buffs.includes(sid)) return tag(buffHint.text);
        const g = clashOf(s, sid);
        if (g && !s.buffs.includes(sid) && g.some(m => m.id !== sid && s.buffs.includes(m.id))) return tag('同類');
        if (sid === 150 && (s.flags & 2) && s.buffs.includes(sid)) return tag('有精靈餅乾時先吃餅乾');   // 自動勇敢（F_BRAVE）開著：伺服器先吃餅乾，風之疾走只在沒餅乾時放
        if (sid === 31) return tag('用魔法寶石');   // 魔法屏障：跟補給頁「魔法屏障卷軸」（F_BARRIER 256）是兩個開關，玩家關了卷軸以為魔屏關了（站長 2026-11-09）
        return '';
    }
    // 勾了 data-b 那格：同組其他勾著的取消（存檔前就不送衝突組合），記下提示
    function buffPick(body, t) {
        const sid = +t.getAttribute('data-b'), s = cb.autoSettings ? cb.autoSettings() : null, g = t.checked ? clashOf(s, sid) : null;
        buffHint = null;
        if (!g) return;
        const off = [];
        for (const m of g) {
            const e = m.id !== sid && body.querySelector('[data-b="' + m.id + '"]');
            if (e && e.checked) { e.checked = false; const k = skillOf(m.id); off.push(k ? k.name : String(m.id)); }
        }
        if (off.length) buffHint = { sid, text: '跟' + off.join('、') + '只能選一個' };
    }
    // 選單的選項：kind → [{ id, name, src }]（開怪／攻擊＝學會的攻擊魔法、範圍＝有範圍的、治癒＝治癒魔法、藥水＝三種、解毒＝翡翠藥水（＋安特之樹枝）＋學會了的解毒術、綠水＝兩種）
    function pickOpts(kind) {
        const k = asSkills(), sk = l => l.map(x => ({ id: x.sid, name: x.name, src: cb.skillIcon ? cb.skillIcon(x.name) || '' : '', mp: x.mp }));
        const v4 = !!((cb.autoSettings ? cb.autoSettings() : null) || {}).v4;
        if (kind === 'doll') return dollOpts();
        if (kind === 'potion') {
            // 第 405 項：商店那三種＋背包裡有的會補血的（同一種疊在一起，寫數量）＋現在選的（背包用完了也列，看得出選的是哪種）
            const have = new Map();
            for (const p of parsedItems()) { const k = kindOf(p); if (HEAL_IDS.has(k)) { const o = have.get(k); if (o) o.n += p.count || 1; else have.set(k, { p, n: p.count || 1 }); } }
            const s0 = cb.autoSettings ? cb.autoSettings() : null, cur = s0 ? tKeep(s0, 'potion') : 0;
            // 伺服器第 688 項：有月卡＝古代白水（古代終極體力恢復劑）一直列、用完自動買
            const card = !!(s0 && s0.v19 && cb.hasCard && cb.hasCard());
            const ids = [...new Set(PICK_POTS.concat(card ? [ANCIENT_WHITE] : [], [...have.keys()], HEAL_IDS.has(cur) ? [cur] : []))];
            return ids.map(id => { const h = have.get(id); return { id, name: itemName(id) || (h && h.p.base) || '治癒藥水', src: itemSrc(id) || (h ? cb.itemIcon(h.p) : ''), n: h ? h.n : 0 }; });
        }
        if (kind === 'breath') return BREATH_POTS.map(id => ({ id, name: itemName(id) || '伊娃的祝福', src: itemSrc(id) }));
        if (kind === 'green') return GREEN_POTS.map(id => ({ id, name: itemName(id) || '自我加速藥水', src: itemSrc(id) }));
        // 第 345 項：經驗藥水（0＝自動，加成高的先喝）
        if (kind === 'exp') return [{ id: 0, name: '自動（高的先喝）', src: itemSrc(47004) }].concat(EXP_POTS.map(id => ({ id, name: itemName(id) || '經驗藥水', src: itemSrc(id) })));
        if (kind === 'bless') return BLESS_POTS.map(id => ({ id, name: itemName(id) || '祝福藥水', src: itemSrc(id) }));   // 伺服器第 539 項
        if (kind === 'blue') return BLUE_POTS.map(id => ({ id, name: itemName(id) || (id === 40736 ? '智慧貨幣' : '藍色藥水'), src: itemSrc(id) }));   // 第 567 項：藍色藥水那列選藍水或智慧貨幣
        if (kind === 'cure') return [{ id: 1, name: itemName(CURE_POT) || '翡翠藥水', src: itemSrc(CURE_POT) }]
            .concat(v4 ? [{ id: 3, name: itemName(CURE_BRANCH) || '安特之樹枝', src: itemSrc(CURE_BRANCH) }] : [])
            .concat(k.learned.has(CURE_SK) ? [{ id: 2, name: (skillOf(CURE_SK) || {}).name || '解毒術', src: skillSrc(CURE_SK) }] : []);
        return sk(kind === 'aoe' ? k.aoe : kind === 'heal' ? k.heal : kind === 'hp' ? k.hpk : kind === 'sum' ? k.sum : k.atk);
    }
    const PICK_TITLE = { potion: '選治癒藥水', open: '選開怪技能', aoe: '選範圍技能', atk: '選攻擊技能', heal: '選治癒魔法', cure: '中毒時用什麼解', hp: '選洗魔魔法', sum: '選召喚魔法', green: '選加速藥水', doll: '選魔法娃娃' , exp: '選經驗藥水', breath: '選呼吸藥水', bless: '選祝福藥水', blue: '選魔力回復藥水' };   // blue：第 567 項
    // 自動召喚的娃娃（伺服器第 153 項）：只列擁有的（dolls.js owned：含裝著的那隻），名字照階級上色（.as-dt 的 data-dt：不能用 data-t，readAutoSettings 把頁面上的 [data-t] 都當開關；選單 .opt 的 data-t 在 body 底下的視窗，不受影響）；還沒收到娃娃資料＝null
    const dollOpts = () => { const l = cb.dollsOwned ? cb.dollsOwned() : null; return l ? l.map(d => ({ id: d.id, name: d.name, src: d.src, tier: d.tier, cost: d.cost })) : []; };
    function dollLine(s) {
        const l = cb.dollsOwned ? cb.dollsOwned() : null, list = l || [], id = tKeep(s, 'doll'), x = list.find(d => d.id === id);
        const note = !l ? '讀取中…' : !list.length ? '還沒有魔法娃娃' : x && x.cost ? asSeg('每 ' + (x.min || 30) + ' 分鐘 ' + x.cost + ' 顆魔法結晶體', '不夠時自動買') : '';
        return asLine(asPick('doll', x ? x.src : '', PICK_TITLE.doll, !list.length), '沒有娃娃時自動召喚' + (x ? '<em class="as-dt" data-dt="' + x.tier + '">' + esc(x.name) + '</em>' : ''), '', note,
            asT('doll', s.dollAuto > 0 && !!x, !list.length));
    }
    // 一列技能（開怪／範圍／攻擊／治癒／洗魔／召喚）：圖示框選技能、拉條、開關；沒學會可以選的＝空框、開關不能勾
    function skLine(s, kind, list, title, body, none) {
        const sid = tKeep(s, kind), x = list.find(y => y.sid === sid);
        return asLine(asPick(kind, x ? cb.skillIcon(x.name) : '', PICK_TITLE[kind], !list.length), title + emName(x ? x.name : ''), list.length ? body : '', list.length ? '' : none,
            asT(kind, s[T_KEYS[kind][0]] > 0, !list.length));
    }
    // 中毒時用什麼解：cureBy 1 翡翠藥水、2 解毒術、3 安特之樹枝、0（舊設定）＝學會解毒術用魔法、沒學喝藥水（同伺服器 WebCare.cureBySkill）
    const cureSkill = (s, k) => s.cureBy === 2 || (!s.cureBy && k.learned.has(CURE_SK));
    const cureItem = s => s.v4 && s.cureBy === 3 ? CURE_BRANCH : CURE_POT;   // 用道具解時用哪種
    const greenPick = s => s.v4 && s.greenPot === 40018 ? 40018 : 40013;
    const EXP_POTS = [47000, 47001, 47002, 47003, 47004];   // 第 345 項：150%～250% 經驗藥水
    const expPick = s => (s.v7 && EXP_POTS.includes(s.expPot)) ? s.expPot : 0;
    // 伺服器第 539 項（站長 2026-11-01「設定頁面新增可以自動喝祝福藥水，選擇要哪一種，喝完自己再購買」）：祝福值 +10～40% 四種，沒選過＝+10%
    const BLESS_POTS = [49904, 49905, 49906, 49907], BLESS_BIT = 268435456;
    const blessPick = s => BLESS_POTS.includes(s.blessPot) ? s.blessPot : 49904;
    // 第 567 項（站長 2026-11-02 南瓜系統）：「藍色藥水」那列（旗標 4）伺服器 v17 起可以選藍色藥水或智慧貨幣（WebAutoSettings.bluePot、WISDOM_COIN 40736），沒選過＝藍色藥水；
    //   選智慧貨幣＝伺服器只喝背包裡的、不買（商店沒賣）；兩種狀態任一個在身上就不喝
    const BLUE_POTS = [40015, 40736];
    const bluePick = s => (s.v17 && BLUE_POTS.includes(s.bluePot)) ? s.bluePot : 40015;
    const breathPick = s => (s.v8 && BREATH_POTS.includes(s.breathPot)) ? s.breathPot : 40032;   // 第 405 項
    // 圖示框點了：照種類開選單（格子，同快捷格選單），選了＝記下來、打開這一列的開關、存（伺服器 C_Web 3 照樣驗：學會了、種類對、三種藥水）
    function openAsPick(kind) {
        const s0 = cb.autoSettings ? cb.autoSettings() : null; if (!s0) return;
        // 伺服器第 440 項：戴召喚控制戒指時 AUTO 叫哪隻——召喚表同一套卡片（summon.js openList set 模式，像變身的外型選單）；選了存設定（0＝不指定）
        if (kind === 'ring') {
            if (cb.summonSet) cb.summonSet(s0.ringNpc | 0, npc => { const s = Object.assign({}, cb.autoSettings()); if ((s.ringNpc | 0) === npc) return; s.ringNpc = npc; cb.saveAutoSettings(s); });
            return;
        }
        // 魔法娃娃：卡片式的選娃娃視窗（dollpick.js，站長 2026-10-24「做成法師召喚表那樣」）；選了照原本：記下來、打開開關、存
        if (kind === 'doll') {
            openDollPick({ list: (cb.dollsOwned && cb.dollsOwned()) || [], cur: tKeep(s0, 'doll'), more: cb.dollOpen ? () => cb.dollOpen() : null,
                pick: id => { const s = Object.assign({}, cb.autoSettings()), [use, keep] = T_KEYS.doll; s[keep] = id; s[use] = id; cb.saveAutoSettings(s); } });
            return;
        }
        const opts = pickOpts(kind), cur = kind === 'cure' ? (cureSkill(s0, asSkills()) ? 2 : cureItem(s0) === CURE_BRANCH ? 3 : 1) : kind === 'green' ? greenPick(s0) : kind === 'exp' ? expPick(s0) : kind === 'breath' ? breathPick(s0) : kind === 'bless' ? blessPick(s0) : kind === 'blue' ? bluePick(s0) : tKeep(s0, kind);   // blue：第 567 項
        const ov = overlay('lmui-aspick', '<div class="box"><div class="hd">' + PICK_TITLE[kind] + '<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd"><div class="grid">' +
            (opts.map(o => '<button type="button" class="opt' + (o.id === cur ? ' on' : '') + '" data-id="' + o.id + '"' + (o.tier ? ' data-t="' + o.tier + '"' : '') + '><img src="' + esc(o.src) + '" alt="" onerror="this.style.visibility=&quot;hidden&quot;"><span>' +
                esc(o.name) + '</span>' + (o.mp ? '<small>MP ' + o.mp + '</small>' : '') + (o.cost ? '<small>結晶體 ' + o.cost + ' 顆</small>' : '') + (o.n ? '<small>×' + o.n + '</small>' : '') + '</button>').join('') || '<span class="none">沒有可以選的</span>') + '</div></div></div>');
        ov.setAttribute('data-kind', kind);
        ov.addEventListener('click', e => {
            const b = e.target.closest('.opt[data-id]'); if (!b) return;
            const id = +b.getAttribute('data-id'), s = Object.assign({}, cb.autoSettings());
            if (kind === 'cure') { s.cureBy = id; s.flags |= 16; }
            else if (kind === 'green') { s.greenPot = id; s.flags |= 1; }   // 選了＝打開「效果沒了自動喝」
            else if (kind === 'exp') { s.expPot = id; s.flags |= 1048576; }   // 第 345 項：選了＝打開自動喝經驗藥水
            else if (kind === 'bless') { s.blessPot = id; s.flags |= BLESS_BIT; }   // 伺服器第 539 項：選了＝打開自動喝祝福藥水
            else if (kind === 'blue') { s.bluePot = id; s.flags |= 4; }   // 第 567 項：選了＝打開「藍色藥水」那列的「效果沒了自動喝」（旗標 4）
            else if (kind === 'breath') { s.breathPot = id; s.flags |= 4194304; }   // 第 405 項：選了＝打開水中自動喝
            else { const [use, keep] = T_KEYS[kind]; s[keep] = id; s[use] = id; }
            ov.remove();
            cb.saveAutoSettings(s);
        });
    }
    // 體力低於 N% 時回村（拉條＋開關）：回家卷軸回村、關 AUTO；第 430 項起在狩獵頁（原本在補給頁）
    function homeLine(s) {
        const hk = Math.max(1, Math.min(90, tKeep(s, 'home') || 30));
        return asLine(asIco(40079), '體力低於 ' + asV('homeKeep', hk) + '% 時回村', asSl('homeKeep', hk, 1, 90, '體力低於幾 % 時回村'), '', asT('home', s.homeHpPct > 0));   // 回家卷軸的價錢寫在狩獵頁最下面（huntNote）
    }
    // 狩獵頁最下面兩行（站長 2026-10-29「邊框大小不一 看起來好礙眼 幫我統一大小 文字不要切到 能不往下滑就不往下滑」）：原本三張卡各寫一句「沒有…卷軸時自動買，用一次 N 金幣」、
    //   「大陸不瞬移」只寫在沒怪那張（伺服器 tpMap：大陸兩種瞬移都不做）、最下面一段巡邏範圍的說明 → 併成兩行，卡片都只剩標題＋一行。
    //   原本的「村莊、安全區不會瞬移」拿掉：伺服器 backlog 52 起在安全區沒怪會瞬移出去，這句已經不對。價錢照商店價（含稅），價錢表還沒讀到、商店沒賣就不寫
    function huntNote(s) {
        const gold = id => { const c = cb.shopCost ? cb.shopCost(id, 1) : 0; return c > 0 ? c.toLocaleString() : ''; };
        const buy = [asSells(40100) && gold(40100) && '瞬移 ' + gold(40100), s.hasHome && gold(40079) && '回村 ' + gold(40079)].filter(Boolean);
        return asNote('巡邏範圍從開 AUTO 的地方算起；大陸不瞬移' + (buy.length ? '<br>沒卷軸自動買，每次' + buy.join('、') + ' 金幣' : ''));
    }
    const AS_PAGE = {
        // 狩獵：巡邏範圍（伺服器 WebAutoSession.roam：開 AUTO 的地方幾格內打怪、走動（伺服器第 185 項起定點；原本跟著最後出手處走），0＝關掉＝整張地圖走（伺服器第 74 項起；舊伺服器站著））、迴避頭目、N 秒沒怪瞬移
        //   （第 63 項：這兩個開著＝沒卷軸就買 1 張，原本的「自動購買瞬間移動卷軸」拿掉）
        狩獵(s) {
            const roam = s.roamRange > 0, rv = roam ? s.roamRange : lastRoam, ts = Math.max(3, Math.min(120, s.teleSec || 10));
            // 卡片包在 .as-hunt（lmui.css：每張一樣高、標題＋一行）；價錢、大陸不瞬移、巡邏範圍從哪算寫在最下面（huntNote）
            return '<div class="as-hunt"><div class="as-row"><span class="as-ico as-auto">AUTO</span><div class="as-mid"><b>巡邏範圍 <span data-roamv>' + rv + '</span>格</b>' +
                    '<input type="range" min="1" max="60" step="1" data-roam="1" value="' + rv + '" aria-label="巡邏範圍"></div>' + asCb('data-roamon="1"', roam) + '</div>' +
                // 「看見BOSS自動瞬移」拿掉（伺服器第 499 項，站長 2026-10-30「原本的 boss 迴避可以刪除了」）：要躲哪些怪到「名單」頁設「瞬移」
                // 大陸（地圖 4）不做沒怪瞬移（伺服器第 140 項，站長 2026-10-23「很容易飛到很強的怪」）：寫在最下面（huntNote）
                asLine(asIco(40100), '沒怪 ' + asV('teleSec', ts) + ' 秒自動瞬移', asSl('teleSec', ts, 3, 120, '幾秒沒怪自動瞬移'), '', asCb('data-f="16384"', s.flags & 16384)) +
                // 伺服器第 430 項（站長 2026-10-29「移除三次逃離」）：「撐不住自動回村」（F_ESC_HOME 2097152）拿掉，原位置換成補給頁搬來的「體力低於 N% 時回村」
                //   （homeHpPct／homeKeep，伺服器 backlog 59；舊伺服器沒帶 hasHome＝不顯示；新角色伺服器預設開 30%）
                (s.hasHome ? homeLine(s) : '') +
                // 伺服器第 509 項（站長 2026-10-31「狩獵頁面增加開關，三次瞬移撐不住是否回村」）：開了＝快撐不住先用瞬間移動卷軸逃，一分鐘內第 3 次就用回家卷軸回村（F_ESC_HOME 2097152，預設關；大陸照舊不瞬移）
                (s.hasHome ? asLine(asIco(40100), '撐不住先瞬移，3 次就回村', '', '<span>一分鐘內逃到第 3 次</span><span>用回家卷軸回村</span>', asCb('data-f="2097152"', s.flags & 2097152)) : '') +
                // 伺服器第 446 項（站長 2026-10-29「在狩獵設定新增按鈕讓玩家選擇開關 預設開啟」）：離線掛機最近 30 分鐘打倒不到 10 隻、或金幣淨虧 → 結束離線掛機（旗標 8388608；舊伺服器沒帶 v10＝不顯示）
                //   字縮成一行（手機 360 寬、電腦版也不換行，不然 .as-hunt 每張卡都跟著變高）
                (s.v10 ? asLine('<span class="as-ico as-auto">AUTO</span>', '離線掛機效率太低就停', '', '<span>半小時打不到 10 隻</span><span>或虧錢</span>', asCb('data-f="8388608"', s.flags & 8388608)) : '') +
                // 伺服器第 620 項（站長 2026-11-03「AUTO 加入禮貌模式」）：別人正在打的怪不搶（旗標 536870912，預設不勾）；在打我的照打、同隊的不算
                asLine('<span class="as-ico as-auto">AUTO</span>', '禮貌模式：別人在打的怪不搶', '', '<span>打我的照打</span><span>同隊的不算別人</span>', asCb('data-f="536870912"', s.flags & 536870912)) +
                // 伺服器第 455 項（站長 2026-10-29「血盟宣戰沒有實裝」→ 第一批）：血盟戰爭中 AUTO 看到敵對血盟成員就打（旗標 16777216，預設勾）；沒勾被打照樣還手（舊伺服器沒帶 v11＝不顯示）
                // 伺服器第 508 項（站長 2026-10-31「盟戰時主動打敵盟移除」）：「盟戰時主動打敵對血盟」那一行拿掉（伺服器不再看這個勾）
                '</div>' + huntNote(s);
        },
        // 補給：喝水、回村、修武器（拉條＋開關），下面是自動購買的那些（第 63 項：兩個標題、自動購買治癒藥水／瞬間移動卷軸拿掉；中毒、變身從「輔助」搬來）。
        //   量照伺服器 WebCare：治癒藥水 HEAL_BUY、銀箭 500（第 576 項）、魔法屏障卷軸 5；藥水類效果沒了自動喝、沒有才買——
        //   藍色藥水、慎重藥水一次 5 瓶（POTION_BUY）、自我加速藥水自己 1 瓶＋喝綠水的夥伴每隻 1 瓶（greenUsers）、其他 1 個；金額整筆含稅，同 shopCost
        補給(s) {
            const type = state.type || 0, k = asSkills();
            // 副標一段一段（窄螢幕整段換行，不會「共 3,700」「金幣」拆兩行）
            // ico：左邊換成別的（綠水的圖示框）；沒給＝道具圖示
            // tag：名稱旁邊的黃色小字（emName，同 asLine 選的東西；經驗藥水「高的先喝」）
            const row = (id, name, segs, bit, off, ico, tag) => '<div class="as-row' + (off ? ' off' : '') + '">' + (ico || asIco(id)) + '<div class="as-mid"><b>' + esc(name) + emName(tag) + '</b><small>' +
                segs.filter(Boolean).map(x => '<span>' + x + '</span>').join('') + '</small></div>' + asCb('data-f="' + bit + '"', s.flags & bit, off && !(s.flags & bit)) + '</div>';
            const buy = (id, name, when, n, bit) => row(id, name, [when + '一次購買 ×' + n + '　', asGold(id, n) && '共 ' + asGold(id, n)], bit);
            const use = (id, name, bit, verb, n = 1, ico, tag) => row(id, name, [verb + '・', asSells(id) ? '沒有就買 ×' + n + '　' : '商店沒賣，背包有才會' + verb.slice(-1), asSells(id) && asGold(id, n)], bit, false, ico, tag);
            // 喝水：藥水三選一（圖示框）、體力低於幾 % 喝（拉條）、開關；沒有藥水時自動買 HEAL_BUY 瓶（價錢整筆含稅，同伺服器扣的）
            const pot = tKeep(s, 'potion') || PICK_POTS[0], hp = Math.max(1, Math.min(95, s.hpPct || 70));
            // 自動購買含稅（站長 2026-10-22「備註自動選購會有抽稅問題，抽幾%」）：這頁會自動買的道具的稅率（data/shopbuy.json 第 4 欄，同伺服器扣的），不一樣就寫範圍
            const taxes = [pot, 40079, 40317, 40744, 40889, greenPick(s), BRAVE[type] && BRAVE[type][0], 40015, 40016, CURE_POT, 40088].filter(id => id && asSells(id)).map(id => cb.shopTax ? cb.shopTax(id) : 0).filter(t => t > 0);
            const tLo = Math.min(...taxes), tHi = Math.max(...taxes);
            const taxNote = taxes.length ? '<div class="as-tax">自動購買含稅 ' + (tLo === tHi ? tLo : tLo + '～' + tHi) + '%</div>' : '';
            const potNote = (pot === ANCIENT_WHITE && s.v19 && !(cb.hasCard && cb.hasCard())) ? '月卡才自動買，背包有才會喝' : !asSells(pot) ? '商店沒賣，背包有才會喝' : asGold(pot, HEAL_BUY) ? asSeg('沒有藥水時自動買 ' + HEAL_BUY + ' 瓶', '共 ' + asGold(pot, HEAL_BUY)) : '沒有藥水時自動買';
            // 站長 2026-11-01「補給頁面裡面的道具依照性質排列整齊」：照道具種類分三組（站長同日更正「魔法屏障卷軸放一起、藥水一起這樣」）：藥水、卷軸、裝備與彈藥，各組前面一個小標題
            const g = { pot: '', scroll: '', gear: '' };
            // 伺服器第 688 項：勾著（預設）＝選的喝完先喝身上別的治癒藥水；不勾＝直接補買選的那種（旗標 1073741824 反過來存：設了＝不勾）
            //   站長 2026-11-06「另開一張看起來更亂」→ 不另開一張卡，放在治癒藥水這張的小字下面一行（小勾勾，樣式寫在這裡，不動 lmui.css）
            const onlyPick = s.v19 ? '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;color:#d8c9a8;cursor:pointer;width:max-content;max-width:100%">' +
                '<input type="checkbox" data-fi="1073741824"' + (((s.flags || 0) & 1073741824) ? '' : ' checked') + ' style="flex:none;width:16px;height:16px;margin:0;accent-color:#c9973e;cursor:pointer">喝完先喝身上別種</label>' : '';
            g.pot = asLine(asPick('potion', itemSrc(pot), '選治癒藥水'), '體力低於 ' + asV('hpPct', hp) + '% 時喝' + emName(itemName(pot)), asSl('hpPct', hp, 1, 95, '體力低於幾 % 時喝'),
                potNote + onlyPick, asT('potion', s.potion > 0));
            let h = '';
            // 回村、修武器（伺服器 59／63；舊伺服器沒帶＝不顯示）：回村用回家卷軸、關 AUTO；修武器用磨刀石（損傷到 5 修一次）
            if (s.hasHome) {   // 「體力低於 N% 時回村」第 430 項搬到狩獵頁（homeLine）
                g.gear += asLine(asIco(40317), '武器損壞時自動修理', '', asSells(40317) && asGold(40317, REPAIR_STONES) && asSeg('沒有磨刀石時自動買', '修一次約 ' + asGold(40317, REPAIR_STONES)),
                    asCb('data-rep="1"', s.repairMode > 0));
                // 背包滿了回村（伺服器第 125 項）：站長 2026-10-26「補給背包滿了回村可以移除了」→ 選項拿掉，伺服器一律開著（第 268 項）
            }

            if (asSells(40744)) g.gear += buy(40744, '銀箭', '箭用完時', 500, 2048);   // 伺服器第 576 項：一次 500 支
            const barrierBuy = asSells(40889) ? buy(40889, '魔法屏障卷軸', '少於 3 張時', 5, 4096) : '';   // 跟「沒有魔法屏障時自動用」排在一起（卷軸組）
            // 綠水（旗標 1）：伺服器第 81 項起（v4）圖示框選自我加速藥水或強化 綠色藥水，沒有就買選的那種（自己 1 瓶＋喝綠水的夥伴每隻 1 瓶）
            const gp = greenPick(s);
            g.pot += use(gp, itemName(gp) || '自我加速藥水', 1, '效果沒了自動喝', 1 + greenUsers(gp), s.v4 ? asPick('green', itemSrc(gp), PICK_TITLE.green) : '');
            if (BRAVE[type]) g.pot += use(BRAVE[type][0], BRAVE[type][1], 2, '效果沒了自動喝', 1, '', BRAVE[type][0] !== HONOR_COIN ? '沒有時喝名譽貨幣' : '');
            // 巧克力蛋糕（三段加速，每個職業都能吃；商店沒賣＝背包有才吃）
            g.pot += use(CHOCO_CAKE, itemName(CHOCO_CAKE) || '巧克力蛋糕', CAKE_BIT, '效果沒了自動吃');
            // 藍色藥水（旗標 4）：第 567 項起伺服器 v17 圖示框選藍色藥水或智慧貨幣（bluePick）；選智慧貨幣＝只喝背包裡的、不買（商店沒賣，伺服器 WebCare 也不買，小字照解毒那列的寫法）。舊伺服器沒帶 v17＝照原本那行
            const blp = bluePick(s);
            g.pot += !s.v17 ? use(40015, '藍色藥水', 4, '效果沒了自動喝', POTION_BUY)
                : blp === 40015 ? use(40015, '藍色藥水', 4, '效果沒了自動喝', POTION_BUY, asPick('blue', itemSrc(40015), PICK_TITLE.blue))
                : row(blp, itemName(blp) || '智慧貨幣', ['效果沒了自動喝・', '商店沒賣，背包有才會喝'], 4, false, asPick('blue', itemSrc(blp), PICK_TITLE.blue));
            // 第 403 項（站長 2026-10-28「新增自動喝伊娃的祝福跟人魚之鱗的選項」）：在水中、沒有水中呼吸就喝，時間長的先喝（伺服器 WebCare.breathNeeded，旗標 4194304）
            // 第 405 項（站長 2026-10-28「水中呼吸做像綠水一樣可以選擇，未選取的物品不要亂吃」）：伺服器 v8 起圖示框選哪種，只喝選的那種（舊伺服器照原本的字）
            const bp = breathPick(s);
            g.pot += s.v8 ? use(bp, itemName(bp) || '伊娃的祝福', 4194304, '在水中時自動喝', 1, asPick('breath', itemSrc(bp), PICK_TITLE.breath))
                : use(40032, '伊娃的祝福、人魚之鱗', 4194304, '在水中時自動喝');
            if (type === 3) g.pot += use(40016, '慎重藥水', 8, '效果沒了自動喝', POTION_BUY);
            // 站長 2026-11-09：說明寫明是卷軸那個，跟魔法頁「魔法屏障」（用魔法寶石）分開；不用 use()，它的「背包有才會」取 verb 最後一個字
            g.scroll += row(40889, '魔法屏障卷軸', ['沒有魔法屏障時用卷軸・', asSells(40889) ? '沒有就買 ×1　' : '商店沒賣，背包有才會用', asSells(40889) && asGold(40889, 1)], 256) + barrierBuy;
            // 經驗藥水（旗標 1048576，伺服器第 332 項；站長 2026-10-27「補給順便新增自動喝經驗藥水」）：AUTO 打怪時效果沒了就喝，加成高的先喝；商店沒賣、不會買
            // 第 345 項（站長 2026-10-27「背包有150% 200% 可以點選要喝幾%的嗎」）：圖示框選哪種（自動＝加成高的先喝），選了就只喝那種
            const xp = expPick(s);
            //   2026-10-29 統一卡片大小：「高的先喝」從小字搬到名稱旁邊（原本小字三行，這張比別張高）
            g.pot += use(xp || 47000, xp ? itemName(xp) || '經驗藥水' : '經驗藥水', 1048576, '打怪時效果沒了自動喝', 1, s.v7 ? asPick('exp', itemSrc(xp || 47000), PICK_TITLE.exp) : '', xp ? '' : '高的先喝');
            // 祝福藥水（旗標 268435456，伺服器第 539 項）：AUTO 打怪時效果沒了喝選的那種，沒有就買 1 瓶；沒穿祝福裝備不喝（伺服器提示一次）。舊伺服器沒帶 v16＝不列
            if (s.v16) { const bp = blessPick(s); g.pot += use(bp, itemName(bp) || '祝福藥水', BLESS_BIT, '打怪時效果沒了自動喝', 1, asPick('bless', itemSrc(bp), PICK_TITLE.bless)); }
            // 中毒時（旗標 16）：圖示框選翡翠藥水、安特之樹枝（伺服器第 81 項起，v4）或解毒術（學會才列；舊伺服器沒帶 v2＝照原本固定：學會用魔法、沒學喝藥水）
            //   沒有就買的一律是翡翠藥水（安特之樹枝商店沒賣；站長 2026-10-22：選安特之樹枝的用完也買翡翠藥水）
            const bySk = cureSkill(s, k), cid = cureItem(s), cname = itemName(cid) || (cid === CURE_BRANCH ? '安特之樹枝' : '翡翠藥水');
            g.pot += asLine(s.v2 ? asPick('cure', bySk ? skillSrc(CURE_SK) : itemSrc(cid), '中毒時用什麼解') : (bySk ? '<span class="as-ico">' + asImg(skillSrc(CURE_SK)) + '</span>' : asIco(cid)),
                '中毒時自動解毒' + emName(bySk ? (skillOf(CURE_SK) || {}).name || '解毒術' : cname), '',
                bySk ? '' : !asSells(CURE_POT) ? '商店沒賣，背包有才會用' : !asGold(CURE_POT, 1) ? ''
                    : cid === CURE_POT ? asSeg('沒有' + cname + '時自動買', '每瓶 ' + asGold(CURE_POT, 1))
                    : '<span>沒有' + cname + '時，</span>' + asSeg('自動買' + (itemName(CURE_POT) || '翡翠藥水'), '每瓶 ' + asGold(CURE_POT, 1)),   // 三段：窄螢幕不會「翡翠藥／水」拆開
                asCb('data-f="16"', s.flags & 16));
            // 被怪物放木乃伊的詛咒時（旗標 131072，伺服器第 118 項；站長 2026-10-23）：學會聖潔之光放魔法，沒學會（或魔力不夠）用背包的魔法卷軸 (聖潔之光)（商店沒賣）
            const hl = skillOf(HOLY_SK), hlOk = !!(hl && hl.learned);
            //   2026-10-29 統一卡片大小：名稱原本「被木乃伊時自動使用聖潔之光」手機要兩行，縮成一行
            g.scroll += asLine(hlOk ? '<span class="as-ico">' + asImg(skillSrc(HOLY_SK)) + '</span>' : asIco(HOLY_SCROLL), '被木乃伊時用聖潔之光', '',
                hlOk ? '' : '背包有魔法卷軸 (聖潔之光) 才會用', asCb('data-f="131072"', s.flags & 131072));
            // 變身消失時（旗標 128）：圖示框（變形卷軸）點了開外型選單（polySetMenu；站長 2026-10-19 不要原生下拉），形態寫在名稱旁邊
            const pp = s.poly ? (cb.polys ? cb.polys() : []).find(p => p.n === s.poly) : null;
            const polyTxt = !s.poly ? '隨機' : pp ? (pp.c || pp.n) + ' Lv' + pp.lv : s.poly;
            g.scroll += asLine('<button type="button" class="as-ico as-pk" data-polyset="1" aria-label="變身形態">' + asImg(itemSrc(40088)) + '</button>', '變身消失自動使用' + emName(polyTxt), '',
                asSells(40088) && asGold(40088, 1) ? asSeg('沒有變形卷軸時自動買', '每張 ' + asGold(40088, 1)) : '', asCb('data-f="128"', s.flags & 128));
            // 魔法娃娃時間到自動續用（旗標 524288，伺服器第 136 項；第 152 項起背包不夠一份會自動買魔法結晶體；站長 2026-10-24「自動續結晶體的一樣放補給那裡」）
            // 第 274 項（站長 2026-10-26「太多設定了 統一 放在娃娃介面」）：搬到娃娃視窗「自動召喚」一個開關（dolls.js autoHtml），這裡不列
            h = taxNote + asH('藥水') + g.pot + asH('卷軸') + g.scroll + (g.gear ? asH('裝備與彈藥') + g.gear : '');
            return h;
        },
        // 魔法：攻擊魔法（第 63 項：開怪／範圍／攻擊技能三列，只在掛機打怪時）、魔力不夠先休息回魔、治癒（自己、隊友）、
        //   洗魔（伺服器：體力高於 hpSkillPct 且魔力低於 hpSkillMp、安全區不放；第 64 項起只有心靈轉換、魂體轉換）、輔助魔法（站長：原本的輔助魔法放這頁）
        魔法(s) {
            const k = asSkills(), skRow = (kind, list, title, body, none) => skLine(s, kind, list, title, body, none);
            const mp = (key, v) => asSlRow('魔力 ', key, v, 0, 100, '% 以上');
            let h = asH('攻擊魔法');
            if (s.v2) {
                h += skRow('open', k.atk, '開怪技能', mp('openMpPct', s.openMpPct), '還沒學會攻擊魔法') +
                    skRow('aoe', k.aoe, '範圍技能', asSlRow('周圍 3 格 ', 'aoeCount', s.aoeCount, 2, 8, ' 隻以上') + mp('aoeMpPct', s.aoeMpPct), '還沒學會範圍攻擊魔法');
            }
            h += skRow('atk', k.atk, '攻擊技能', mp('atkMpPct', s.atkMpPct), '還沒學會攻擊魔法');
            // 魔力不夠要不要站著回魔（伺服器旗標 65536 F_REST_MP，線上 AUTO、離線掛機都看；預設不勾＝不等，照普通攻擊）：
            //   站長 2026-10-19「法師離線掛時不要等魔…默認關閉」→ 2026-10-20「沒魔力不要等回魔，放在設定頁面讓玩家自行決定，默認關閉」；
            //   設定頁改版時站長更正：留著，放在這區底下。學會攻擊魔法才列（伺服器看攻擊技能那列）
            //   伺服器本機改動第 81 項（v5，站長 2026-10-22「打勾不會停下來休息。順便加個拉條低於多少停下來回魔」→「新增拉條自行設定」）：
            //   兩條拉條＝魔力低於幾 % 休息（restMpPct，預設 30）、回到幾 % 再打（restMpUp，預設 60；要比休息的高，伺服器也夾）
            //   站長 2026-10-22「法師顯示就好」：只給法師看（伺服器也只對法師生效）；原本學會攻擊魔法的都列
            //   伺服器本機改動第 736 項（站長 2026-11-09「妖精在設定頁面的魔法新增一個跟法師一樣的…妖精是停下來洗魔…恢復到多少在開始繼續掛機」）：
            //   妖精也列（同一個勾、同兩條拉條）；學了心靈轉換／魂體轉換（k.hpk）寫「洗魔」，沒學的伺服器照法師站著回魔 → 字也照法師
            const restTy = state.type || 0;
            if (restTy === 3 || restTy === 2) {
                const wash = restTy === 2 && k.hpk.length > 0, how = wash ? '洗魔' : '休息';
                const rp = Math.max(1, Math.min(95, s.restMpPct || 30)), up = Math.max(rp + 1, Math.min(100, s.restMpUp || 60));
                // 字一行、拉條一行（拉條直接放在 .as-mid 底下＝整行寬）：兩條起點、長度一樣（asSlRow 字跟拉條同一行，字長短不同會把拉條擠歪）
                const slTxt = (pre, k, v, post) => '<span class="as-sl"><span>' + pre + asV(k, v) + post + '</span></span>';
                h += '<div class="as-row"><div class="as-mid"><b>' + (wash ? '魔力不夠先停下來洗魔' : '魔力不夠先休息回魔') + '</b>' + (s.v5 ? slTxt('低於 ', 'restMpPct', rp, '% 時' + how) + asSl('restMpPct', rp, 1, 95, '低於幾 % 時' + how) +
                    slTxt('回到 ', 'restMpUp', up, '% 再打') + asSl('restMpUp', up, 2, 100, '回到幾 % 再打') : '') +
                    '</div>' + asCb('data-f="65536"', s.flags & 65536) + '</div>';
            }
            h += asNote('只在掛機打怪時施放。');
            h += asH('治癒魔法') + skRow('heal', k.heal, '體力低於 ' + asV('healHpPct', s.healHpPct) + '% 時施放', asSl('healHpPct', s.healHpPct, 1, 95, '體力低於幾 % 時施放'), '還沒學會治癒魔法') +
                asNote('隊友體力低於這個比例也會補；掛機沒開也會。');
            // 洗魔（第 64 項）：只有學會心靈轉換／魂體轉換（妖精）才顯示；體力高於 X%、魔力低於 Y% 施放（舊伺服器沒帶 v3＝魔力固定 90%，不顯示那條）
            if (k.hpk.length) {
                h += asH('洗魔魔法') + skRow('hp', k.hpk, '用體力換魔力', asSlRow('體力高於 ', 'hpSkillPct', s.hpSkillPct, 0, 100, '%') +
                    (s.v3 ? asSlRow('魔力低於 ', 'hpSkillMp', s.hpSkillMp, 1, 100, '%') : ''), '') +
                    asNote(s.v3 ? '安全區不放；掛機沒開也會。' : '魔力低於 90% 才放，安全區不放；掛機沒開也會。');
            }
            h += asH('輔助魔法') + (k.buffs.length ? '<div class="as-grid">' + k.buffs.map(x => '<label class="st-chk"><input type="checkbox" data-b="' + x.sid + '"' + (s.buffs.includes(x.sid) ? ' checked' : '') + '><span>' +
                    esc(x.name) + (helmSids().has(x.sid) ? '<small class="as-bc">頭盔</small>' : '') + buffTag(s, x.sid) + '</span></label>').join('') + '</div>' +
                // 第 515 項：有頭盔才會的就多一列開關（F_HELM_BUFF 134217728，預設關）
                ((hh => k.buffs.some(x => hh.has(x.sid)))(helmSids()) ? asLine('<span class="as-ico as-auto">AUTO</span>', '用魔法頭盔放', '', '<span>沒學會或換上更省魔</span><span>放完換回原本的</span>', asCb('data-f="134217728"', s.flags & 134217728)) : '')   /* 伺服器第 578 項：學會了但頭盔更省魔也換；背包有頭盔就列這列 */ + asNote(buffMax(s) < k.buffs.length ? '效果沒了就補，最多 ' + buffMax(s) + ' 個；掛機沒開也會。' : '效果沒了就補；掛機沒開也會。') : asNote('還沒學會可以自動補的輔助魔法。'));
            return h;
        },
        // 召喚：沒有召喚物時自動施放（伺服器 WebAutoSession：AUTO 開著、身邊完全沒有夥伴）。
        //   每隻夥伴的卡（2026-10-20 從夥伴視窗搬來）2026-10-22 搬回夥伴視窗、跟態勢併在一起（站長「把它融合再一起」，openCompWin／cwCfgHtml），這裡只留一顆鈕過去
        召喚(s) {
            const k = asSkills();
            // 魔法娃娃（站長 2026-10-24「召喚那裡只是設定娃娃方面的」）：地圖上顯示娃娃（dollshow.js，存這台裝置；從設定 → 系統搬來，娃娃視窗也能改）。續用結晶體留在補給頁
            // 第 274 項（站長 2026-10-26「娃娃要不要顯示 兩個設定開關重複了 留娃娃介面就好了」「統一 放在娃娃介面」）：魔法娃娃整段搬到娃娃視窗（自動召喚、顯示娃娃）
            let h = '';
            // 伺服器第 153 項（站長 2026-10-24「可以選擇哪個娃娃，跟召喚那樣判斷可以召喚誰出來」）：圖示框選擁有的娃娃＋開關；舊伺服器（沒有 v6）不列
            // 第 64 項：圖示框選召喚術／召喚屬性精靈（學會才列）、右邊開關（原本「使用」勾選＋下拉）
            h += asH('自動召喚') + skLine(s, 'sum', k.sum, '沒有召喚物時自動施放', '', '還沒學會召喚魔法') +
                asNote('掛機時身邊沒有寵物、召喚物就施放：法師「召喚術」依等級召喚怪物，妖精「召喚屬性精靈」召喚自己屬性的精靈。');
            // 伺服器第 440 項（站長 2026-10-29「帶招界另外拉個視窗像變身的那樣的選單 選好後自動召喚」）：學會召喚術才列；圖示框（召喚控制戒指）開卡片選單。
            //   沒選＝「上次手選的」（伺服器第 339 項）；選的那隻現在叫不出來寫原因（伺服器到時會改叫別隻）
            if (s.v9 && k.sum.some(x => x.sid === 51)) {
                const rn = s.ringNpc | 0, rName = rn && cb.summonRingName ? cb.summonRingName(rn) : '', rWhy = rn && cb.summonRingWhy ? cb.summonRingWhy(rn) : '';
                h += asLine(asPick('ring', itemSrc(20284), '選召喚的怪物'), '戴召喚控制戒指時召喚' + emName(rn ? rName || '怪物 ' + rn : '上次手選的'), '', rWhy, '');
            }
            // 寵物、召喚物每隻的設定（喝水、加速、自動復活、自動呼叫）、魔力門檻 2026-10-22 搬進夥伴視窗、跟態勢併在同一張卡（第 83 項③）：這裡留一顆鈕過去
            h += asH('寵物、召喚物') + '<button type="button" class="as-compbtn" data-compwin="1">打開夥伴視窗</button>';
            return petExt === false ? h + asH('自動復活、自動叫出') + petBoxHtml(s, k.learned) : h;   // 舊伺服器：原本的「寵物」區塊
        },
        // 名單（站長 2026-10-30「boss 瞬移可以跟不攻擊的怪物合併」→「用原本的加入功能設定，添加後就不打跟瞬移；原本的 boss 迴避可以刪除了；沒有設定在這都是要打」）：
        //   選這張地圖的怪 → 按「不打」或「瞬移」加入；每列可以換、移除。不打＝s.ignore（不主動打，牠先打我照樣還手）；瞬移＝s.boss（伺服器第 499 項：看到就用瞬間移動卷軸，
        //   名單空的＝不躲；不再看「看見BOSS自動瞬移」開關，那張卡拿掉了）。同名的怪（不同 npc 編號）併一列；大陸只列所在地區的怪（area），設定照整個大陸一份
        名單(s) {
            const map = cb.mapId ? cb.mapId() : -1, mapName = cb.mapName ? cb.mapName(map) : '', groups = cb.mapMobs ? cb.mapMobs() : null;
            const area = cb.mobsArea ? cb.mobsArea() : '', full = (area && cb.mapMobs(true)) || groups || [];
            let h = asH('怪物名單');
            if (!groups) return h + asNote('讀取中…');
            const bl = cb.bosses ? cb.bosses(map) : [], ig = (s.ignore || {})[map] || [], tp = (s.boss || {})[map] || [];
            const mk = (list, extra) => list.filter(b => !groups.some(g => g.ids.includes(b.id)) && !full.some(g => g.ids.includes(b.id))).map(b => ({ n: b.n, lv: b.lv, ids: [b.id], boss: true })).concat(extra);
            const isBoss = g => g.ids.some(id => bl.some(b => b.id === id));
            const all = mk(bl, groups.map(g => ({ n: g.n, lv: g.lv, ids: g.ids, boss: isBoss(g) }))).filter(r => /[一-鿿]/.test(r.n));   // 沒中文名字的是程式用的隱形 NPC
            const known = mk(bl, full.map(g => ({ n: g.n, lv: g.lv, ids: g.ids, boss: isBoss(g) })));
            const on = r => r.ids.some(id => tp.includes(id)) ? 'tp' : r.ids.some(id => ig.includes(id)) ? 'ig' : '';
            const listed = known.filter(on), other = tp.concat(ig).filter(id => !known.some(r => r.ids.includes(id))).map(id => ({ n: '怪物 ' + id, lv: 0, ids: [id] }));
            const seg = (k, st) => '<span class="ms-seg">' + [['ig', '不打'], ['tp', '瞬移']].map(([v, t]) => '<button type="button" data-ms="' + k + '|' + v + '"' + (st === v ? ' class="on ' + v + '"' : '') + '>' + t + '</button>').join('') + '</span>';
            const nm = r => esc(r.n) + (r.lv ? ' <small>Lv.' + r.lv + (r.boss ? '・頭目' : '') + '</small>' : '');
            const opts = all.filter(r => !on(r));
            h += '<div class="lmas-add ms-add"><select data-igsel="1" aria-label="要加入的怪物">' + (opts.length ? '<option value="">（請選擇）</option>' + opts.map(r => '<option value="' + r.ids.join(',') + '">' + esc(r.n) + ' Lv.' + r.lv + (r.boss ? '（頭目）' : '') + '</option>').join('')
                : '<option value="">' + (area ? '這一帶' : '這張地圖') + '沒有別的怪物</option>') + '</select><button type="button" data-msadd="ig"' + (opts.length ? '' : ' disabled') + '>加入</button></div>';   // 站長「請選擇的旁邊用加入按鈕就好」：加進來先是「不打」，在那一列切瞬移
            h += listed.length || other.length ? listed.concat(other).map(r => { const k = r.ids.join(','); return '<div class="as-row as-ig ms-row"><b>' + nm(r) + '</b>' + seg(k, on(r) || (tp.some(id => r.ids.includes(id)) ? 'tp' : 'ig')) +
                '<button type="button" class="lmas-del" data-ms="' + k + '|hit">移除</button></div>'; }).join('') : '<div class="as-none">（沒有）</div>';
            return h + asNote('沒加進來的怪都會打；「瞬移」看到就用瞬間移動卷軸離開，「不打」被牠打時還是會還手。<br>' + (area ? '選單是「' + esc(area) + '」一帶的怪物，整個大陸共用一份。' : '每張地圖各自設定' + (mapName ? '（目前：' + esc(mapName) + '）' : '') + '。'));
        },
        // 「輔助」分頁第 63 項整頁拿掉（站長 2026-10-20）：中毒、變身搬到補給；聖潔之光、魔法相消術、沒有娃娃自動召喚拿掉（伺服器也不再做）
    };
    // 「迴避頭目」細部：這張地圖要迴避哪幾隻（沒挑＝全部；同單機版 afk-bossavoid）
    function bossEntry(s) {
        const map = cb.mapId ? cb.mapId() : -1, list = cb.bosses ? cb.bosses(map) : [], picked = (s.boss || {})[map] || [];
        // 狩獵頁卡片第二行（2026-10-29 統一卡片大小）：「迴避對象：這張圖沒有頭目」在電腦版、窄手機會被切成「…」→ 縮成「迴避：」、沒頭目只寫「這張圖沒有頭目」
        const txt = picked.length ? '迴避：名單 ' + picked.length + ' 隻' : list.length ? '迴避：全部頭目' : '這張圖沒有頭目';   // 點了到「名單」頁改（站長 2026-10-30 合併）
        return '<button type="button" class="st-link" data-boss="1">' + esc(txt) + '</button>';
    }
    function openBossPick() {
        const map = cb.mapId(), list = cb.bosses(map), name = cb.mapName ? cb.mapName(map) : '';
        const s0 = cb.autoSettings(); if (!s0) return;
        let ids = ((s0.boss || {})[map] || []).slice();
        const ov = overlay('lmui-bosspick', '<div class="box"><div class="hd">迴避哪些頭目' + (name ? ' · ' + esc(name) : '') + '<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="bd"><div class="grid"></div></div><div class="ft"><button type="button" data-all="1">全部迴避</button></div></div>');
        const draw = () => {
            ov.querySelector('.grid').innerHTML = list.map(b => '<button type="button" class="opt' + (ids.includes(b.id) ? ' on' : '') + '" data-id="' + b.id + '"><span>' + esc(b.n) + '</span><small>Lv.' + b.lv + '</small></button>').join('');
            ov.querySelector('[data-all]').disabled = !ids.length;
        };
        draw();
        ov.addEventListener('click', e => {
            const r = e.target.closest('.opt[data-id]'), all = e.target.closest('[data-all]');
            if (!r && !all) return;
            if (all) ids = [];
            else { const id = +r.getAttribute('data-id'), i = ids.indexOf(id); if (i < 0) ids.push(id); else ids.splice(i, 1); }
            const s = Object.assign({}, cb.autoSettings()); s.boss = Object.assign({}, s.boss);
            if (ids.length) s.boss[map] = ids.slice(); else delete s.boss[map];
            cb.saveAutoSettings(s);
            draw();
        });
    }
    // 「不攻擊的怪物」：加入／移除（值＝同名那幾隻的 npc 編號，逗號分隔）；伺服器每張地圖最多 50 隻
    //   「看到就瞬移的怪物」（which＝'boss'，存在 s.boss）同一套；加進一份名單就從另一份拿掉
    // 名單頁一列的三顆鈕：hit 打／ig 不打／tp 瞬移（見 AS_PAGE.名單）
    function monState(key, v) {
        const map = cb.mapId(), s = Object.assign({}, cb.autoSettings()), ids = key.split(',').map(Number).filter(Boolean);
        if (!ids.length) return;
        let tp = ((s.boss || {})[map] || []).slice(), ig = ((s.ignore || {})[map] || []).slice();   // 伺服器第 499 項：瞬移名單空的＝不躲
        tp = tp.filter(id => !ids.includes(id)); ig = ig.filter(id => !ids.includes(id));
        if (v === 'tp') tp = tp.concat(ids); else if (v === 'ig') ig = ig.concat(ids);
        s.boss = Object.assign({}, s.boss); s.ignore = Object.assign({}, s.ignore);
        if (tp.length) s.boss[map] = tp.slice(0, 50); else delete s.boss[map];
        if (ig.length) s.ignore[map] = ig.slice(0, 50); else delete s.ignore[map];
        cb.saveAutoSettings(s);
    }
    function ignoreEdit(key, add, which = 'ignore') {
        const map = cb.mapId(), s = Object.assign({}, cb.autoSettings()), ids = key.split(',').map(Number).filter(Boolean);
        if (!ids.length) return;
        const edit = (k, on) => {
            s[k] = Object.assign({}, s[k]);
            const now = s[k][map] || [];
            const next = on ? now.concat(ids.filter(id => !now.includes(id))).slice(0, 50) : now.filter(id => !ids.includes(id));
            if (next.length) s[k][map] = next; else delete s[k][map];
        };
        edit(which, add);
        if (add) edit(which === 'boss' ? 'ignore' : 'boss', false);
        cb.saveAutoSettings(s);
    }
    // 夥伴視窗卡片上的喝水、綠水（cwCfgHtml 的 data-cp；沒有的欄位照原本的）
    function cardVals(card, c) {
        const pv = card.querySelector('[data-cp="pot"]').value, n = parseInt(card.querySelector('[data-cp="pct"]').value, 10);
        const g = card.querySelector('[data-cp="green"]'), gm = card.querySelector('[data-cp="gmode"]');
        return { pct: Math.max(0, Math.min(99, n || 0)), pot: pv[0] === 'p' ? +pv.slice(1) : c.pot || 0, heal: pv[0] === 'h' ? +pv.slice(1) : 0,
            green: g ? g.checked : !!c.green, gmode: gm ? +gm.value : c.gmode || 0 };
    }
    // 寵物卡＝照項圈存（C_Web 8/7，收在項圈裡的也能設）；先改在手上的清單，伺服器回的 S_Web 11 到之前重畫也是新的值
    function petCardSave(card) {
        const id = +card.getAttribute('data-pcol'), p = petCols.find(x => x.collar === id); if (!p || !cb.petSettings) return;
        const v = cardVals(card, p);
        Object.assign(p, v);
        cb.petSettings(id, v);
    }
    // 「寵物」區塊：下拉選背包裡的項圈＋「新增」，下面每隻一張卡片（自動復活：返生術／復活卷軸、自動叫出、移除），最多 4 隻
    const PET_MAX = 4, PET_STATE = ['收在項圈', '在身邊', '死了'];
    function petBoxHtml(s, learned) {
        const res = learned.has(61) || learned.has(75), have = new Set(s.pets.map(p => p.collar));
        const addable = petCols.filter(c => !have.has(c.collar));
        let h = '<div class="lmas-add"><select data-petsel="1" aria-label="要加入的寵物">' +
            (addable.length ? addable.map(c => '<option value="' + c.collar + '">' + esc('項圈 ' + c.name + ' Lv.' + c.lv) + '</option>').join('') : '<option value="">沒有其他寵物的項圈</option>') +
            '</select><button type="button" data-petadd="1"' + (addable.length && s.pets.length < PET_MAX ? '' : ' disabled') + '>新增</button></div>';
        for (const p of s.pets) {
            const c = petCols.find(x => x.collar === p.collar) || { name: '', tname: '', lv: 0, hp: 0, mhp: 0, state: 0, gfx: 0 };
            const mode = res ? p.mode : 1;
            h += '<div class="cw-card pc-card" data-collar="' + p.collar + '"><div class="cw-top"><span class="cw-pic">' + petPicHtml(c.gfx, c.tname || c.name) + '</span><div class="cw-main">' +
                '<div class="cw-name"><b>' + esc(c.name) + '</b><em>Lv.' + c.lv + '</em><small>' + (PET_STATE[c.state] || '') + '</small></div>' +
                '<div class="cw-bar hp"><i style="width:' + cpct(c.hp, c.mhp) + '%"></i><span>HP ' + Math.max(0, c.hp) + ' / ' + c.mhp + '</span></div></div></div>' +
                '<div class="cw-set"><span><label class="cw-green"><input type="checkbox" data-pr="1"' + (p.revive ? ' checked' : '') + '>自動復活</label>' +
                '<select data-pm="1">' + (learned.has(61) ? '<option value="0"' + (mode === 0 ? ' selected' : '') + '>返生術</option>' : '') + (learned.has(75) ? '<option value="2"' + (mode === 2 ? ' selected' : '') + '>終極返生術</option>' : '') + '<option value="1"' + (mode === 1 ? ' selected' : '') + '>復活卷軸</option></select></span>' +   // 第 586 項：終極返生術
                '<label class="cw-green"><input type="checkbox" data-ps="1"' + (p.summon ? ' checked' : '') + '>自動叫出</label>' +
                '<button type="button" class="pc-del" data-petdel="' + p.collar + '">移除</button></div></div>';
        }
        return h;
    }
    // 讀這一頁的欄位改進設定（別頁的欄位不在畫面上：照原本的）
    function readAutoSettings(body) {
        const s = Object.assign({}, cb.autoSettings()), v = k => { const e = body.querySelector('[data-a="' + k + '"]'); return e ? Math.floor(+e.value) || 0 : s[k]; };
        for (const k of ['petMpPct']) s[k] = v(k);   // 洗魔、召喚魔法第 64 項起走下面的拉條／開關
        for (const k of ON_KEYS) { const on = body.querySelector('[data-on="' + k + '"]'); if (on && !on.checked) s[k] = 0; }   // 「使用」沒勾＝不用
        // 新版型（第 63 項）：拉條（data-sl＝欄位）、開關（data-t：關＝實際用的送 0、記著的留著；開了還沒選過＝先選第一個）、修武器開關（data-rep）
        body.querySelectorAll('[data-sl]').forEach(e => { s[e.getAttribute('data-sl')] = Math.floor(+e.value) || 0; });
        body.querySelectorAll('[data-t]').forEach(e => {
            const k = e.getAttribute('data-t'), [use, keep] = T_KEYS[k];
            if (!s[keep] || (k === 'doll' && !pickOpts(k).some(o => o.id === s[keep]))) { const o = k === 'home' ? [{ id: 30 }] : pickOpts(k); s[keep] = o.length ? o[0].id : 0; }   // 娃娃：記著的那隻已經沒了（合成用掉）＝換第一隻
            s[use] = e.checked ? s[keep] || 0 : 0;
        });
        const rep = body.querySelector('[data-rep]'); if (rep) s.repairMode = rep.checked ? 1 : 0;
        s.teleSec = Math.max(3, Math.min(120, s.teleSec || 10));
        s.hpPct = Math.max(1, Math.min(95, s.hpPct || 70));
        s.homeKeep = Math.max(1, Math.min(90, s.homeKeep || 30));
        s.hpSkillMp = Math.max(1, Math.min(100, s.hpSkillMp || 90));
        s.restMpPct = Math.max(1, Math.min(95, s.restMpPct || 30));   // 伺服器第 81 項：魔力低於幾 % 先休息回魔
        s.restMpUp = Math.max(s.restMpPct + 1, Math.min(100, s.restMpUp || 60));   // 回到幾 % 再打：比休息的高（同伺服器 sanitize）
        s.homeHpPct = s.homeHpPct > 0 ? s.homeKeep : 0;
        const ro = body.querySelector('[data-roamon]'), rr = body.querySelector('[data-roam]');
        if (ro && rr) { const n = Math.max(1, Math.min(60, +rr.value || 20)); lastRoam = n; s.roamRange = ro.checked ? n : 0; }   // 巡邏範圍：不勾送 0（整張地圖走）
        // 旗標：只改這頁有勾選框的那幾個（自動賣出在背包那邊）
        let mask = 0, f = 0;
        body.querySelectorAll('[data-f]').forEach(e => { const b = +e.getAttribute('data-f'); mask |= b; if (e.checked) f |= b; });
        body.querySelectorAll('[data-fi]').forEach(e => { const b = +e.getAttribute('data-fi'); mask |= b; if (!e.checked) f |= b; });   // 反過來存的旗標（伺服器第 688 項）：沒勾＝設
        s.flags = (s.flags & ~mask) | f;
        if (body.querySelector('[data-b]')) s.buffs = [...body.querySelectorAll('[data-b]')].filter(e => e.checked).map(e => +e.getAttribute('data-b')).slice(0, buffMax(s));
        s.pets = s.pets.map(p => {
            const card = body.querySelector('.pc-card[data-collar="' + p.collar + '"]'); if (!card) return p;
            const m = card.querySelector('[data-pm]');
            return { collar: p.collar, revive: card.querySelector('[data-pr]').checked, mode: m ? +m.value : p.mode, summon: card.querySelector('[data-ps]').checked };
        });
        // 召喚頁的寵物卡（每個項圈一張）2026-10-22 搬進夥伴視窗（自動復活、呼叫在那邊存，onCompCfg）
        return s;
    }
    function petAdd(body) {
        const sel = body.querySelector('[data-petsel]'), id = sel ? +sel.value : 0, s = Object.assign({}, cb.autoSettings());
        if (!id || s.pets.length >= PET_MAX || s.pets.some(p => p.collar === id)) return;
        const res = skillList().some(x => x.learned && (x.sid === 61 || x.sid === 75));
        s.pets = s.pets.concat([{ collar: id, revive: true, mode: res ? 0 : 1, summon: true }]);
        cb.saveAutoSettings(s);
    }
    function petDel(id) { const s = Object.assign({}, cb.autoSettings()); s.pets = s.pets.filter(p => p.collar !== id); cb.saveAutoSettings(s); }

    // 視窗裡的點擊：背包格、紙娃娃格、魔法格、書籤／階數鈕、設定
    let wbody = $('lmui-wbody');   // let：電腦介面換到右邊那個視窗時跟著換（swapSide）
    // 道具格點兩下＝直接用（同 3.5 用戶端雙擊）：裝備／卸下、喝、用；要選對象的進「點要用在哪個道具」；強化卷軸開強化視窗；不能用的照伺服器回的訊息。
    //   點一下＝馬上開道具視窗（站長 2026-10-21「背包欄位點擊道具是沒有很順暢」：原本先等 DBL_MS 看有沒有第二下，每次點都慢一拍）。
    //   第二下：DBL_MS 內又按在同一格的位置——道具視窗蓋住格子時按到的是視窗（下面 document 的 pointerdown 在最前面攔下、連那一下的 click 一起吞掉，不會按到視窗裡的鈕），
    //   沒蓋住（電腦介面視窗在旁邊）就是格子本身（onBodyClick）——都當點兩下：收掉道具視窗、直接用。用道具 id 比，中間背包重畫過也算同一格
    const DBL_MS = 280;
    let tapWait = null;   // { id, p, at（第一下的時間）, r（那格在畫面上的位置） }
    function dblUse(p) {
        tapWait = null;
        const iw = document.getElementById('lmui-itemwin'); if (iw) iw.remove();
        if (enh.scrollInfo(p)) enh.open({ scroll: p }); else useItemFlow(p);
    }
    let swallow = null;   // 被當成第二下的那次按壓 { id（pointerId）, up（放開的時間） }：它放開後緊接著的 click 吞掉
    document.addEventListener('pointerdown', e => {
        if (swallow && swallow.up) swallow = null;   // 上一次被吞的那下已經放開（電腦上沒有 click 跟著來）：新的按壓跟它無關
        const w = tapWait;
        if (!w || performance.now() - w.at > DBL_MS || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
        if (e.clientX < w.r.left || e.clientX > w.r.right || e.clientY < w.r.top || e.clientY > w.r.bottom) return;
        if (e.target.closest && e.target.closest('.bag-cell[data-id="' + w.id + '"], .ld-cell[data-id="' + w.id + '"]')) return;   // 按到的是格子本身：交給 onBodyClick
        e.preventDefault(); e.stopPropagation();
        swallow = { id: e.pointerId, up: 0 };
        dblUse(w.p);
    }, true);
    document.addEventListener('pointerup', e => { if (swallow && !swallow.up && e.pointerId === swallow.id) swallow.up = performance.now(); }, true);
    document.addEventListener('click', e => {
        const s = swallow; if (!s || !s.up) return;
        swallow = null;
        if (performance.now() - s.up < 300) { e.preventDefault(); e.stopPropagation(); }   // 視窗收掉了，這下的 click 會落到底下的格子：不算新的一下
    }, true);
    function onBodyClick(e) {
        const t = e.target;
        if (t.closest('.bw-sort')) { sortBag(); toast('背包整理好了'); renderWin(); return; }   // 背包右下的「背包整理」鈕
        if (t.closest('[data-bagdoll]')) { closeAll(); cb.dollOpen(); return; }
        if (t.closest('[data-bagmail]')) { closeAll(); if (cb.mailOpen) cb.mailOpen(); return; }   // 背包下方「信箱」   // 背包左下「魔法娃娃」：打開娃娃視窗（原本在 ⊞ 選單）
        if (t.closest('[data-compwin]')) { openCompWin(); return; }   // 設定 → 召喚「打開夥伴視窗」：寵物、召喚物的設定在那邊（第 83 項③）
        if (t.closest('[data-bagas]')) {   // 背包左下「自動賣出」：再點一次回「全部」；打開時重新要一次 invIds（尾端的「補給用，不賣」照現在的設定、寵物）
            winTab = winTab === '自動賣出' ? '全部' : '自動賣出'; renderWin(); wbody.scrollTop = 0;
            if (winTab === '自動賣出' && cb.invIds) { invAskAt = Date.now(); cb.invIds(); }
            return;
        }
        const hcc = t.closest('.ld-hc[data-hck]');   // 裝備欄的榮耀卡片：開榮耀卡（第 169 項）
        if (hcc) { if (cb.openHonorCard) cb.openHonorCard(+hcc.getAttribute('data-hck')); return; }
        const bag = t.closest('.bag-cell:not(.empty), .ld-cell.is-filled');
        if (bag) {
            const p = parsedItems().find(x => x.id === +bag.getAttribute('data-id')); if (!p) return;
            if (pending) {   // 選卷軸要用在哪個道具上
                const scroll = pending; pending = null;
                if (p.id !== scroll.id) cb.useItem(scroll, p);
                renderWin(); return;
            }
            if (tapWait && tapWait.id === p.id && performance.now() - tapWait.at <= DBL_MS + 150) { dblUse(p); return; }   // +150：這裡看的是第二下的 click（按下到放開那段也算進去）
            const group = bag.classList.contains('bag-cell') ? bagStacks.get(p.id) : null;
            tapWait = { id: p.id, p, at: performance.now(), r: bag.getBoundingClientRect() };
            openItem(p, group);
            return;
        }
        if (t.closest('.ld-cell[data-dollwin]')) { closeAll(); if (cb.dollOpen) cb.dollOpen(); return; }   // 裝備欄的娃娃格（娃娃系統那隻）：打開魔法娃娃視窗
        const es = t.closest('.ld-cell.is-empty[data-slot]');
        if (es) { slotPick(es.getAttribute('data-slot')); return; }
        const bk = t.closest('.lsk2-tabs button[data-book]');
        if (bk) { skBook = bk.getAttribute('data-book'); skSel = 0; renderWin(); return; }
        const sd = t.closest('.lsk2-side button[data-grp]');
        if (sd) {
            const box = wbody.querySelector('.lsk2-scroll'), c = box && box.querySelector('.lsk-cell[data-grp="' + sd.getAttribute('data-grp') + '"]');
            if (c) box.scrollTop = Math.max(0, c.offsetTop - box.firstElementChild.offsetTop);
            skSyncSide(box); return;
        }
        const sk = t.closest('.lsk-cell[data-sid]');
        if (sk) {
            const sid = +sk.getAttribute('data-sid'), x = skillList().find(s => s.sid === sid);
            if (x && x.learned && skSel === sid) { skSel = 0; renderWin(); cb.castSkill(x); return; }
            skSel = sid; renderWin();
            if (x && !x.learned) learnAsk(x);   // 還沒學、能花錢學、等級到了：直接跳確認（說明留在下面）
            return;
        }
        if (t.closest('[data-learnall]')) { if (cb.learnAll) cb.learnAll(); return; }
        if (t.closest('[data-skfree]')) { if (cb.skillLimitToggle) cb.skillLimitToggle(); return; }   // 離線版：技能視窗「解除限制」   // 伺服器第 695 項：公測一鍵學魔法
        const lb = t.closest('[data-learn]');
        if (lb) { const x = skillList().find(s => s.sid === +lb.getAttribute('data-learn')); if (x) learnAsk(x); return; }
        if (t.closest('[data-winreset]')) { pcResetWins(); toast('視窗放回原位了'); return; }
        const dm = t.closest('[data-dmgmode]');
        if (dm) {   // 顯示傷害四格：寫兩個 key、原地換亮的那格（不整頁重畫）
            const d = DMG_MODES.find(x => x[0] === dm.getAttribute('data-dmgmode')); if (!d) return;
            try { localStorage.setItem('l1web_dmg_out', d[2]); localStorage.setItem('l1web_dmg_self', d[3]); } catch (e) { /* 無痕 */ }
            dm.parentElement.querySelectorAll('[data-dmgmode]').forEach(b => { const on = b === dm; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
            return;
        }
        if (t.closest('[data-bmadd]')) { bookmarkAdd(); return; }   // 記憶座標
        const bmd = t.closest('[data-bmdel]');
        if (bmd) { const b = (cb.bookmarks ? cb.bookmarks() : [])[+bmd.getAttribute('data-bmdel')]; if (b) cb.delBookmark(b); return; }
        const bmc = t.closest('[data-bmcolor]');
        if (bmc) { const b = (cb.bookmarks ? cb.bookmarks() : [])[+bmc.getAttribute('data-bmcolor')]; if (b) bookmarkRecolor(b); return; }
        if (t.closest('[data-go]')) { cb.autoToggle(); return; }   // 設定頁「開始／停止掛機」＝AUTO 鈕
        if (t.closest('[data-offlog]')) { cb.offlineLog(); return; }
        if (t.closest('[data-boss]')) { winTab = '名單'; renderWin(); return; }   // 迴避名單搬到「名單」頁（原本 openBossPick 另開視窗）
        if (t.closest('[data-polyset]')) { polySetMenu(); return; }
        const pk = t.closest('.as-pk[data-pick]'); if (pk) { if (!pk.disabled) openAsPick(pk.getAttribute('data-pick')); return; }   // 只認設定頁的圖示框：狩獵場「搜尋掉落物」的道具也是 data-pick（同一個 wbody），原本點了會丟錯
        // 第 272 項（站長 2026-10-26「抽到娃娃要用自動召喚沒有選單」：點的是名字那行，原本只有左邊的小圖示能開）：點這一行的字也開同一個選單；拉條、開關、下拉照舊
        const mid = t.closest('.as-line > .as-mid'); if (mid && !t.closest('input, select, button, label, a')) { const p = mid.parentElement.querySelector('[data-pick]'); if (p) { if (!p.disabled) openAsPick(p.getAttribute('data-pick')); return; } }   // 設定頁的圖示框：選藥水、技能、解毒
        const msa = t.closest('[data-msadd]'); if (msa) { const sel = wbody.querySelector('[data-igsel]'); if (sel && sel.value) monState(sel.value, msa.getAttribute('data-msadd')); return; }
        if (t.closest('[data-igadd]')) { const sel = wbody.querySelector('[data-igsel]'); if (sel && sel.value) ignoreEdit(sel.value, true); return; }
        const ms = t.closest('[data-ms]'); if (ms) { const [k, v] = ms.getAttribute('data-ms').split('|'); monState(k, v); return; }
        const igd = t.closest('[data-igdel]'); if (igd) { ignoreEdit(igd.getAttribute('data-igdel'), false); return; }
        if (t.closest('[data-petadd]')) { petAdd(wbody); return; }
        const pd = t.closest('[data-petdel]'); if (pd) { petDel(+pd.getAttribute('data-petdel')); return; }
        if (t.closest('[data-scshop]')) { if (cb.openShop) cb.openShop(); return; }   // 自動賣出頁頂端的「開通月卡」
        const asA = t.closest('[data-asadd]'); if (asA) { autoSellAdd(wbody); return; }
        const asD = t.closest('[data-asdel]'); if (asD) { autoSellDel(+asD.getAttribute('data-asdel')); return; }
        const asM = t.closest('[data-asmode]');
        if (asM && asM.dataset.lock) { const id = +asM.getAttribute('data-asmode'); asAsk(id, true); return; }   // 沒月卡按「賣出」：小卡
        if (asM && asM.dataset.nc && !asM.classList.contains('on')) { asAsk(+asM.getAttribute('data-asmode'), true, null, '', true); return; }   // 沒月卡按「刪除」：同一張卡的確認（跟道具視窗一致）
        if (asM) { autoSellMode(+asM.getAttribute('data-asmode'), asM.getAttribute('data-m') === 'd'); return; }
        const st = t.closest('[data-s]');
        if (st && st.tagName === 'BUTTON') {
            const k = st.getAttribute('data-s');
            if (k === 'char') { closeAll(); cb.onChangeChar(); }
            else if (k === 'log') upd.open(true);   // 更新紀錄（換掉設定視窗）
            else if (k === 'signin') { closeAll(); cb.signinOpen(); }   // 每日簽到（signin.js）
            else if (k === 'invite') { closeAll(); cb.inviteOpen(); }   // 邀請好友（invite.js，第 703 項）
            else if (k === 'promo') { closeAll(); cb.promoOpen(); }   // 推廣獎勵（promo.js，第 710 項）
            else soon();
        }
    }
    function onBodyChange(e) {
        const t = e.target;
        if (cur === 'automation' && t.closest) {
            // 「使用」＋下拉：選了就勾、選回（請選擇）就不勾；勾了還沒選就先選第一個
            const k = t.getAttribute('data-a') || t.getAttribute('data-on');
            if (k && ON_KEYS.includes(k)) {
                const on = wbody.querySelector('[data-on="' + k + '"]'), sel = wbody.querySelector('[data-a="' + k + '"]');
                if (t === sel && on) on.checked = +sel.value > 0;
                else if (t === on && on.checked && sel && !(+sel.value) && sel.options.length > 1) sel.selectedIndex = 1;
            }
            if (t.hasAttribute('data-roam')) { const ro = wbody.querySelector('[data-roamon]'); if (ro) ro.checked = true; }   // 拉了滑桿＝要巡邏
            // 站長 2026-11-04「有開瞬移，狩獵中心就沒用處了，兩個開關互相排斥」：開巡邏範圍＝關沒怪瞬移；開沒怪瞬移＝關巡邏範圍
            { const ro = wbody.querySelector('[data-roamon]'), tp = wbody.querySelector('[data-f="16384"]');
              if (ro && tp) { if ((t === ro || t.hasAttribute('data-roam')) && ro.checked) tp.checked = false; else if (t === tp && tp.checked) ro.checked = false; } }
            if (t.hasAttribute('data-b')) buffPick(wbody, t);   // 伺服器第 474 項：輔助魔法同類只能勾一個
        }
        if (t.closest && t.closest('[data-a], [data-f], [data-fi], [data-b], [data-p], [data-pr], [data-pm], [data-ps], [data-on], [data-roamon], [data-roam], [data-t], [data-sl], [data-rep]') && cb.autoSettings && cb.autoSettings()) { cb.saveAutoSettings(readAutoSettings(wbody)); return; }   // AUTO 設定：改了就送伺服器（拉條放開才送）
        const pk = t.getAttribute && t.getAttribute('data-push');
        if (pk && cb.pushToggle) { cb.pushToggle(pk, t.checked); return; }   // 伺服器第 534 項：手機通知
        const dk = t.getAttribute && t.getAttribute('data-dmgopt');
        if (dk && OPT_KEYS[dk]) { try { for (const key of OPT_KEYS[dk]) localStorage.setItem(key, t.checked ? '1' : '0'); } catch (e) { /* 無痕 */ } if (dk === 'power' && cb.powerChanged) cb.powerChanged(); return; }
        if (t.hasAttribute && t.hasAttribute('data-dollshow')) { setDollShow(t.value); return; }
        const k = t.getAttribute && t.getAttribute('data-s'); if (!k) return;
        setAudio(k, t.type === 'checkbox' ? t.checked : +t.value);
    }
    function onBodyInput(e) {
        if (e.target.matches && e.target.matches('[data-asq]')) { asQ = e.target.value; asFilter(wbody); return; }   // 自動賣出：打字篩選下拉
        const k = e.target.getAttribute && e.target.getAttribute('data-s');
        if (k === 'sfxVol' || k === 'bgmVol') { setAudio(k, +e.target.value); const v = wbody.querySelector('[data-volv="' + k + '"]'); if (v) v.textContent = e.target.value; }   // 系統頁音量：數字跟著跳
        if (e.target.hasAttribute && e.target.hasAttribute('data-roam')) { const v = wbody.querySelector('[data-roamv]'); if (v) v.textContent = e.target.value; }   // 巡邏範圍：拉的時候數字跟著跳
        const sl = e.target.getAttribute && e.target.getAttribute('data-sl');
        if (sl) { const v = wbody.querySelector('[data-slv="' + sl + '"]'); if (v) v.textContent = e.target.value; }   // 設定頁的拉條：拉的時候數字跟著跳
    }
    wbody.addEventListener('click', onBodyClick); wbody.addEventListener('change', onBodyChange); wbody.addEventListener('input', onBodyInput);

    // ── 數值 ──
    function update(s) {
        state = s;
        if (s.name && s.name !== hotOwner) { hotLoad(s.name); bagLoad(s.name); }
        if (s.name && s.name !== chatOwner) chatLogLoad(s.name);
        setTxt(el.name, s.name || '');
        const nc = s.lawful ? lawfulColor(s.lawful) : '';   // 自己的名字也照正義值變色（0＝原本的顏色）
        if (el.name.style.color !== nc) el.name.style.color = nc;
        setTxt(el.ac, s.ac != null ? String(s.ac) : '');
        setTxt(el.mr, s.wis != null ? String(totalMr(s)) : '');
        setTxt(el.gold.querySelector('b'), (s.gold || 0).toLocaleString());
        setTxt(el.align.querySelector('b'), String(s.lawful || 0));
        const logo = CLASS_LOGO[s.type] ? '/assets/logo/' + encodeURIComponent(CLASS_LOGO[s.type] + 'logo.png') : '';
        if (logo && el.face.getAttribute('src') !== logo) el.face.setAttribute('src', logo);
        // 血條（用戶端 1331c／1332c，「體力」「魔力」字畫在圖上）：--r＝剩下的比例，剩下那段上色（狀態換色照 BAR_LOOK）、沒了的是空的玻璃管（半透明灰；lmui.css body.lmui-white）；數字疊在條上
        //   只有用戶端有的狀態換色（站長 2026-10-18「依照 3.5 客戶端」：用戶端條圖沒有暗色版，太重不變暗；負重、飽食度在能力頁的量表）
        const ratio = (a, b) => b ? Math.max(0, Math.min(1, a / b)) : 0;
        const bar = (e, k, a, b) => {
            e.style.setProperty('--r', ratio(a, b)); setTxt(e.querySelector('span'), b ? a + '/' + b : '');
            const look = barLook(k, s); if (e.dataset.look !== look) { e.dataset.look = look; e.style.setProperty('--bar', 'url("/data/ui/bar-' + look + '.png")'); }
        };
        bar(el.hp, 'hp', s.hp, s.maxHp); bar(el.mp, 'mp', s.mp, s.maxMp);
        const ep = expPercent(s.level, s.exp || 0);
        el.exp.querySelector('i').style.width = 'calc((100% - 22px) * ' + (ep / 100) + ')';
        setTxt(el.exp.querySelector('.lv b'), String(s.level || ''));
        setTxt(el.exp.querySelector('.pc'), ep.toFixed(4) + '%');
        pcUpdate(s, totalMr(s), weightLook(s.weight));   // 電腦介面面板左欄（pcui.js）
        if (cur && cur !== 'chat') renderWin();
        onOther(() => { if (cur) renderWin(); });   // 電腦介面右邊那個視窗（背包）
    }
    // 站長 2026-11-10「地圖名字太長可以改成拉洞三樓」：地名那排還要放夥伴格、省電標籤，名字太長會把夥伴格擠成直的疊在一起 →
    //   「、」後面的副名不顯示（「4樓 長老會議廳、副神官…之室」只留「4樓 長老會議廳」），太長的照玩家叫法縮寫；完整名字放 title（電腦滑鼠停著看得到）
    const PLACE_ABBR = [[/^拉斯塔巴德地下洞穴\s*/, '拉洞 '], [/^新兵修練場\s*分流/, '修練場 分流'], [/^大洞穴隱遁者村莊地區$/, '隱遁者村莊'], [/長老．/, ''], [/暗黑精靈棲息地$/, '暗精棲息地']];   // 站長 2026-11-10 看了清單「改名字就好了」
    function shortPlace(n) {
        let t = String(n || '').split('、')[0].trim();
        if (t.length > 8) for (const [re, to] of PLACE_ABBR) t = t.replace(re, to);
        return t;
    }
    function setPlace(mapName, z) {
        const b = el.mapname.querySelector('b'), full = mapName || '';
        setTxt(b, shortPlace(full));
        if (b.title !== full) b.title = full;
        setTxt(el.zone, z === 1 ? '（安全區）' : z === 2 ? '（戰鬥區域）' : '（一般區域）');
        el.zone.className = z === 1 ? 'z1' : z === 2 ? 'z2' : '';
        zone = z;
    }
    // 場景裡「自己」要站的畫面位置：下方 HUD 蓋住的那段扣掉，站在剩下那塊的正中間
    //   彈出視窗開著時聊天框藏起來、下方 HUD 變矮：照關著時量的算，鏡頭不要跟著跳
    //   「蓋住的那段」＝下方 HUD 跟畫布重疊多少：直式整塊疊在畫布上；電腦版面（橫的）HUD 在畫布下面那條面板，不重疊
    //   main.js 每幀叫：原本每幀量兩次 getBoundingClientRect（強迫排版）→ 改成版面可能變的時候才記一筆「要重量」（focusDirty），
    //   下一次叫到才量、量完存著；下方介面、畫布、選單列大小變了（ResizeObserver）、轉向／視窗大小變了、彈出視窗開關（syncCover）都會記。
    //   保險：最多 2 秒也重量一次（不知道的版面變動不會一直錯下去）
    let lowerH = 0, focusDirty = true, focusAt = 0, focusRo = null, focusCover = false;
    function sceneFocus(cvH) {
        const lower = $('lmui-lower'), cv = $('cv'), now = performance.now(), cover = document.body.classList.contains('lmui-cover');
        if (!focusRo && window.ResizeObserver && lower) { focusRo = new ResizeObserver(() => { focusDirty = true; }); focusRo.observe(lower); if (cv) focusRo.observe(cv); }
        if (cover !== focusCover) { focusCover = cover; focusDirty = true; }
        if ((focusDirty || now - focusAt > 2000) && lower && !cover) {
            lowerH = Math.max(0, (cv ? srect(cv).bottom : vh()) - srect(lower).top);
            focusDirty = false; focusAt = now;
        }
        return Math.max(80, (cvH - lowerH) / 2 + 30);
    }
    function measureNav() {
        focusDirty = true;
        const n = $('m-nav'); if (n) document.documentElement.style.setProperty('--m-nav-h', Math.round(srect(n).height) + 'px');
    }
    window.addEventListener('resize', measureNav);
    // iPhone 轉向時 resize 事件常比版面早到（量到的還是轉之前的）：下方介面自己的高度一變就重量（同 main.js 畫布的 ResizeObserver）
    if (window.ResizeObserver && $('m-nav')) new ResizeObserver(measureNav).observe($('m-nav'));
    requestAnimationFrame(() => { measureNav(); layoutChat(); });
    syncTools();
    // 挨到大的一擊（≥ 最大體力 10%）：體力條紅光閃一下（同單機版 vfxPlayerHit 的 vfx-hurt；main.js 在打到的那一刻叫）。連續挨打：重來一次
    function hurtFlash() { const b = el.hp; b.classList.remove('vfx-hurt'); void b.offsetWidth; b.classList.add('vfx-hurt'); }
    el.hp.addEventListener('animationend', e => { if (e.animationName === 'lmuiHurt') el.hp.classList.remove('vfx-hurt'); });

    return {
        update, setPlace, chat, toast, float: (t, must) => floatMsg(t, '', must ? 'must' : undefined), closeAll, sceneFocus, setCastLock, useSlot,
        slotKind: i => { const e = hotSlots[i]; return !e ? null : e.k !== 'item' ? e.k : e.oid ? 'gear' : 'item'; },   // 按住 F 鍵連用（main.js）：skill／item（會用掉的）／gear（裝備，不連用）
        hotCycle, hotPicked, measureNav, setAuto, setForce,showHuntLog, refreshHuntLog, showOfflineLog, setAwayLog, itemPick, stonePick, setCompanions, compGear, setPlayers, setManager, setParty, setEffects, setPetCollars, setInvIds, npc: npcUi, craft, sell: { info: setSellInfo, result: sellResult }, hurtFlash, polyMenu, polyFits, bookmarkPick,
        minimap: el.mmCanvas, minimapOn: () => !el.mm.classList.contains('off'),
        itemInfoOpen: o => itemInfo.open(infoItem(o)),   // 站長 2026-11-03：別的視窗（南瓜箱子內容）點道具開資訊卡
        isTyping: () => document.activeElement === el.say || document.activeElement === el.wto,
        focusChat: () => el.say.focus(),
        // 只重畫能力視窗的某一分頁（開著的才畫）：隊友血量一直變，不能每次整個視窗（背包…）都重畫
        tabIs: (id, t) => (cur === id && winTab === t) || (alt.cur === id && alt.winTab === t),
        refreshTab: t => { const f = () => { if (cur === 'stats' && winTab === t) renderWin(); }; f(); onOther(f); },
        refreshWin: () => { renderHot(); if (cur && cur !== 'chat') renderWin(); onOther(() => { if (cur) renderWin(); }); enh.refresh(); npcUi.refresh(); refreshBookBtn(); renderCompWin(); },   // renderCompWin：AUTO 設定（自動復活／呼叫、魔力門檻）、學會治癒魔法
        openWin: (id, tab) => { inSide(id, () => { closeAll(true); cur = id; openWin(id, tab); }); syncTools(); },   // 例：血盟執行人的「查詢血盟成員」→ 能力視窗的血盟分頁
        tutClose,   // 新手引導完成一步：關掉那一步引導打開的視窗（只關那一個）
        canWear,    // 新手引導一鍵全部穿上：這個職業、這個等級穿不穿得上
        holdFloats,   // 新手引導完成一步的特效放的時候：系統訊息先不浮上來，放完再浮
        enhMsg: (id, text) => enh.serverMsg(id, text),
        enhSys: text => { if (enh.sysMsg) enh.sysMsg(text); },   // 祝福賦予結果（S_SystemMessage）   // 強化結果（伺服器訊息 161／160／164／79）
        // 第 299 項：伺服器存的設定剛寫進 localStorage（prefsync.js）→ 照新的值重讀：快捷列（顯示幾排、格子）、背包排序、小地圖／線上玩家／訊息浮字收折、
        //   狩獵場分類、娃娃顯示；開著的視窗重畫（設定頁的勾勾）。傷害數字、經驗值飄字每次飄都讀 localStorage，不用這裡；召喚視窗的分頁下次打開才讀
        prefsReload() {
            applyHot();
            if (hotOwner) { const n = hotOwner; bagLoad(n); hotLoad(n); }
            applyMm(mmMode()); applyWho(whoOff()); syncFlt();
            tpKind = lsGet(TP_KIND_KEY); try { tpOpen = JSON.parse(lsGet(TP_OPEN_KEY) || '{}') || {}; } catch (e) { tpOpen = {}; }
            reloadDollShow();
            if (cur && cur !== 'chat') renderWin(); onOther(() => { if (cur) renderWin(); });
        },
        hotSlots: () => hotSlots.slice(),   // 快捷格 F1～F12 放了什麼（新版新手引導「快捷格放治癒藥水」看的；{ k: 'item', nid, name } 或 { k: 'skill', sid }、空的 null）
        // keep＝同一隻角色斷線後自動用通行碼登回來（main.js enter）：開著的視窗、聊天紀錄、快捷列都留著，只清伺服器會重送的（站長 2026-10-22「視窗都被關閉」）
        //   keepChat＝同一隻角色重新進遊戲（伺服器重開、維修完、自動登回失敗再自己登入）：其他照清，只留聊天紀錄（站長 2026-11-06「重新接上時對話不要清除」）
        clear(keep, keepChat) {
            if (!keep && !keepChat) { chatLogSave(); lines = []; chatPend = []; el.lines.innerHTML = ''; chatOwner = ''; }
            if (!keep) { bagOrder = []; hotOwner = ''; setAwayLog(null); }
            bagSig = ''; zone = 0;
            if (!keep) closeAll();
            if (!keep) setManager(false);
            setPlayers([]); setParty([]); setCompanions({ list: [], canHaste: false }); setEffects([]);
            if (!keep && chatPc) { chatPc = 0; if (isPc()) layoutChat(); }   // 電腦版面：進遊戲聊天框從「小」開始
        },
    };
}
