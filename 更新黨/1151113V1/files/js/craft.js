// 製作工匠（⊞ 選單第一項）。站長 2026-10-23「製作工匠介面更新，依簡單明瞭好看的目標製作；放茉莉、芬、喬爾…巴姆特這些 NPC 的製作，
//   分頁依照製作類型分類（武器、防具、飾品、道具）」：
//   上面＝類型分頁（全部＋成品的類型，沒有配方的類型不列）＋搜尋（成品、材料、NPC 名字）；下面＝配方一列一張卡：
//     成品圖示＋名字＋（小字）哪位 NPC・條件；材料圖示＋「有／要」（夠＝綠、不夠但能先用別的配方做出來＝黃、做不出來＝紅；倉庫有的另外標）；
//     做不出來時「還缺：最底層材料 N」；右邊「可做 N」＋數量＋「製作」。圖示點了看道具資訊（iteminfo.js，cb.info）。
//   NPC 清單＝CRAFTERS（站長那 25 位名字對伺服器 npc 表、有配方的那幾隻；對不到、沒配方的見 web-client 分支 craft8 的回報）。
//     新手引導第 20 步（做象牙塔武器卷軸）進行中：那一步要找的旅人諮詢員也放進來、排最前面標「新手任務」（cb.task()；那步過了就不列）。
//   材料夠不夠、做得出幾個、成品都是伺服器算（C_Web 15 → S_Web 18，跟實際的連鎖製作同一套規則）；「製作」送 C_Web 16，做完回 S_Web 19。
//     要哪隻 NPC：同一張地圖上有那種 NPC＝它的物件編號（伺服器原本「同一張地圖可以遠端」就收）；不在這張地圖＝負的 NPC 編號
//     （伺服器 WebCraft 認得的製作工匠清單才收，其他一律不理）。
//     伺服器同一隻 NPC 的清單 1 秒最多算一次 → 這裡一次只問一隻，回來了（或 2 秒沒回）再問下一隻；開視窗、做完東西、每 20 秒重問一輪。
//   站長 2026-10-23（craft8b）：搜尋每打一個字就篩（輸入法選字中先不篩）。
//   站長 2026-10-23（craft8c）：「依類型／依 NPC」切換拿掉，回到類型分頁；清單改成縮圖格（成品圖示＋名字），點一格才跳出小視窗看材料、按製作。
//     新手任務那幾格每個分頁都排最前面、金框標「新手任務」。
//   站長 2026-10-23（craft8e）「這幾種數量直接點道具，在裡面選擇就好」：同一個成品（同分頁、成品道具編號一樣）有好幾個配方的只列一格
//     （煉金的 魔法寶石 ×20／×200／×1,000／×25…），點開後上面一排數量按鈕（少的排前面，預設第一個），選哪個下面就是那個配方的材料和製作；
//     數量一樣、材料不一樣的，按鈕後面加那個配方獨有的材料名字分辨。任一個做得出來那格就亮綠點；搜尋任一個配方對得上就列出來。
//   站長 2026-10-23（craft8f）「石頭用分頁做分類」：那一格的配方用的主要材料不只一種 → 數量按鈕上面先一排材料小分頁（圖示＋名字），
//     選了分頁下面才列那種材料換得到的數量（只寫數量）；只有一種材料就不出分頁。預設第一個分頁、第一個數量。
//     主要材料＝配方裡金幣以外、而且不是這一格每個配方都要的材料，照配方列的順序取第一個（煉金＝那顆石頭）；都一樣就取金幣以外第一個
//   用法：const craft = createCraft(cb)；craft.open()、craft.close()、craft.list(S_Web 18)、craft.done(S_Web 19)
import { infoItem, itemTpl, itemById, tplVar } from './items.js';
import { itemIcon } from './icons.js';
import { displayName } from './look.js';
import { CRAFT_HIDE } from './craft-hide.js';
import { sfx, preloadSfx } from './audio.js';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GOLD_ID = 40308;
let MK = { items: {}, npc: {} };
fetch('/data/npcmake.json').then(r => r.ok ? r.json() : null).then(d => { if (d && d.npc) MK = d; }).catch(() => {});

// 站長指定的製作 NPC（照站長列的順序；tid＝伺服器 npc 編號，同 WebCraft.CRAFTERS／VIRTUAL；key＝npcmake.json 的鍵）。
//   名字跟站長寫的不一樣的：拉比安妮＝拉比安尼、莫莉亞＝莫麗雅、皮爾＝強韌的海斯（鐵匠皮爾的配方移給他了，伺服器本機改動第 16 項）。
//   伺服器第 134 項照單機版補了配方（WebCraftNpc.xml）：芬、法林、倫提斯、精靈、安特掛在原版那位 NPC 身上；
//   茉莉、喬爾、拉達爾、萊恩、伊貝爾賓、布拉伯原版沒有這位 NPC（布拉伯是怪物）＝虛擬工匠 99000x，鍵＝「名字|0」，只在這個視窗出現。
//   愛佛特（單機版「愛弗特」是布料商人，不做東西）沒有配方，不列
export const CRAFTERS = [
    { tid: 990001, key: '茉莉|0' },     // 茉莉（虛擬）
    { tid: 70101, key: '$455|705' },    // 芬
    { tid: 990002, key: '喬爾|0' },     // 喬爾（虛擬）
    { tid: 70838, key: '$749|895' },    // 娜魯帕
    { tid: 70852, key: '$805|896' },    // 精靈女皇
    { tid: 70851, key: '$754|854' },    // 精靈
    { tid: 70848, key: '$755|847' },    // 安特
    { tid: 70850, key: '$753|875' },    // 潘
    { tid: 70846, key: '$752|864' },    // 芮克妮
    { tid: 990006, key: '布拉伯|0' },   // 布拉伯（虛擬）
    { tid: 990007, key: '傲慢之塔工匠|0' },   // 傲慢之塔工匠（虛擬，伺服器第 181 項：傲慢之塔傳送符）
    { tid: 990008, key: '飾品工匠|0' },   // 飾品工匠（虛擬，伺服器第 460 項：原本拿不到的項鍊、耳環、戒指，寶石＋金幣）
    { tid: 990003, key: '拉達爾|0' },   // 拉達爾（虛擬）
    { tid: 70537, key: '$1054|983' },   // 法林
    { tid: 990004, key: '萊恩|0' },     // 萊恩（虛擬）
    { tid: 70524, key: '$2690|1307' },  // 拉比安尼（拉比安妮）
    { tid: 70598, key: '$865|1307' },   // 莫麗雅（莫莉亞）
    { tid: 70642, key: '$846|1208' },   // 海克特
    { tid: 70641, key: '$1246|1312' },  // 哈巴特
    { tid: 71129, key: '$4571|1768' },  // 倫提斯
    { tid: 990005, key: '伊貝爾賓|0' }, // 伊貝爾賓（虛擬）
    { tid: 70671, key: '$3042|1271' },  // 諾斯
    { tid: 70676, key: '$2689|3095' },  // 陸米爾（伺服器第 174 項：主城製作區；光明腰帶、中間一階腰帶）
    { tid: 70872, key: '$1488|1621' },  // 伊芙洛爾（伺服器第 174 項：主城製作區；深水長靴、伊娃之盾）
    { tid: 81112, key: '$3121|3757' },  // 雷德（騎士洞穴 1 樓；召喚控制戒指，伺服器第 174 項）
    // 伺服器第 174 項（站長 2026-10-25「做裝備的、料理和特殊材料」那批；材料拿不到的配方不列，見 craft-hide.js）：
    { tid: 71125, key: '$4574|1768' },  // 亞提利歐（狄亞得要塞）
    { tid: 70762, key: '$2688|1768' },  // 卡立普（威頓）
    { tid: 81113, key: '$3122|1768' },  // 哈古丁（狄亞得要塞）
    { tid: 71036, key: '$3732|4691' },  // 卡蜜拉的靈魂（卡蜜拉的房間）
    { tid: 80069, key: '$2112|4261' },  // 小惡魔（炎魔謁見所）
    { tid: 81261, key: '$6446|1216' },  // 大衛（歐瑞；冰之女王的耳環）
    { tid: 70908, key: '$2557|2794' },  // 皮爾斯（沉默洞穴）
    { tid: 81114, key: '$2984|3406' },  // 火焰之影的分身（古魯丁地監 6 樓）
    { tid: 80054, key: '$4693|4873' },  // 研究員（火焰之影實驗室）
    { tid: 80068, key: '$3414|4262' },  // 炎魔的分身（炎魔謁見所）
    { tid: 81322, key: '$2987|7024' },  // 黑騎士副隊長（騎士洞穴）
    { tid: 70614, key: '$860|1271' },  // 安東（奇岩）
    { tid: 70607, key: '$2986|1307' },  // 沙勒霞（奇岩）
    { tid: 71175, key: '$4043|2648' },  // 指揮官．艾思提凡（亞丁）
    { tid: 71074, key: '$3733|4708' },  // 蜥蜴人長老（海賊島）
    { tid: 80076, key: '$4454|5676' },  // 航海士的靈魂（船舶之墓海面；完整的航海日誌換航海士的袋子，伺服器第 677 項）
    { tid: 71198, key: '$5030|1659' },  // 傭兵團長 多文（海音；毒蛇之牙披肩，伺服器第 486 項：原任務的道具一次交齊＋100 萬）
    // 拉龐斯（80091，古魯丁；料理書）：第 336 項拿掉（站長 2026-10-26「製作工匠 移除 料理書」；伺服器 WebCraft.CRAFTERS 同步拿掉）
    { tid: 81283, key: '$7741|1621' },  // 細心的修樂（威頓）
    { tid: 81284, key: '$7742|782' },  // 頑強的歐浩（威頓）
    { tid: 81285, key: '$7743|2820' },  // 燦爛的艾咪（威頓）
    { tid: 81286, key: '$7892|914' },   // 米米（威頓；魔眼解封印、合成，伺服器第 409、413 項）
    { tid: 70742, key: '$1953|237' },   // 迪泰特
    { tid: 81282, key: '$7740|2255' },  // 強韌的海斯（皮爾）
    { tid: 70904, key: '$2442|1768' },  // 庫普
    { tid: 70690, key: '$2608|457' },   // 巴姆特
    { tid: 70520, key: '$3480|2090' },  // 煉金術師（站長 2026-10-23「煉金術師的製作放到工匠裡面，分類好」；各村莊都有）
    // 旅人諮詢員：象牙塔對盔甲／武器施法的卷軸、象牙塔妙藥。象牙塔裝備只能用這種卷軸強化，原本只有新手第 20 步才列 → 做不了圖鑑（玩家 2026-11-13 回報）
    { tid: 81257, key: '$8481|7868' },
];
const TASK = { tid: 81257, key: '$8481|7868', task: true, act: '4' };   // 新手第 20 步：旅人諮詢員（同 tutorial.js CRAFT_NPC）；act：只列做武器卷軸那個（第 382 項）

// 成品類型 → 分頁（照 items.json 的 k／type）。沒有配方的類型不出分頁
const CATS = ['武器', '防具', '飾品', '材料', '寵物', '道具', '煉金'];
// 「煉金」分頁：煉金術師的兌換（SingleItemMaking.xml 動作 a～M：四種魔法石、黑色血痕 → 魔法寶石、精靈玉、二級黑魔石、馬普勒之石，各 1／10／50 份共 39 格）。
//   性質都一樣（拿石頭換），放進「材料」會把那頁淹掉 → 自己一頁；他做的藥水、卷軸、精靈餅乾（動作 request …）照成品類型放
const ALCH_TID = 70520;
const isAlch = (c, r) => c.tid === ALCH_TID && !/^request /.test(r.a);
const ACC = new Set(['ring', 'amulet', 'earring', 'belt']);
// 道具表照名字編號存，同一個名字編號被別種道具佔走的（木製的夾克 $802＝某把劍）：分頁照這裡（伺服器第 174 項）
const CAT_FIX = { 20461: { k: 'a', type: 'armor', minLv: 0 } };
// 伺服器名字一樣、其實是不同等級的（冰之女王的耳環 Lv0～Lv8，資料庫名字都一樣）：製作工匠裡補上等級
const NAME_FIX = { 21081: '冰之女王的耳環 Lv0', 21082: '冰之女王的耳環 Lv1', 21083: '冰之女王的耳環 Lv2', 21084: '冰之女王的耳環 Lv3', 21085: '冰之女王的耳環 Lv4',
    21086: '冰之女王的耳環 Lv5', 21087: '冰之女王的耳環 Lv6', 21088: '冰之女王的耳環 Lv7', 21089: '冰之女王的耳環 Lv8 力量', 21090: '冰之女王的耳環 Lv8 敏捷', 21091: '冰之女王的耳環 Lv8 精神' };
const tplOf = id => CAT_FIX[id] || (MK.items[id] ? tplVar(itemTpl(MK.items[id][1]), +id) : null);
// 防具分頁的小分類（站長 2026-10-25「工匠顯得太亂」）：照部位，只列有配方的
const SLOTS = [['helm', '頭盔'], ['armor', '盔甲'], ['T', '內衣'], ['cloak', '斗篷'], ['glove', '手套'], ['boots', '長靴'], ['shield', '盾牌'], ['guarder', '臂甲']];
// 開放的五個職業（站長 2026-10-25「沒開放的職業移除名稱，沒開放的職業的相關道具防武從工匠移除」）：龍騎士、幻術師不顯示；
//   只有龍騎士、幻術師能用的武器防具（道具表 cls 只有 32／64），或配方只限這兩個職業的，製作工匠不列
const OPEN_CLS = ['王族', '騎士', '妖精', '法師', '黑暗妖精'];
const openOnly = c => Array.isArray(c) ? c.filter(x => OPEN_CLS.includes(x)) : [];
const closedOnly = (id, r) => { const tp = tplOf(id); return (Array.isArray(r.c) && !openOnly(r.c).length) || !!(tp && (tp.k === 'w' || tp.k === 'a') && tp.cls != null && (tp.cls & 31) === 0); };
const slotOf = id => { const tp = tplOf(id); return tp && tp.k === 'a' ? tp.type : ''; };
// 道具表不是寵物裝備、但只給寵物用的：放寵物分頁（站長 2026-10-29「製作工匠 進化果實移到寵物分類」）
const PET_CAT = new Set([40070]);
function catOf(id) {
    if (PET_CAT.has(+id)) return '寵物';
    const tp = tplOf(id);
    if (!tp) return '道具';
    if (tp.k === 'w') return '武器';
    if (tp.k === 'a') return ACC.has(tp.type) ? '飾品' : '防具';
    return tp.type === 'material' ? '材料' : tp.type === 'petitem' ? '寵物' : '道具';
}

export function createCraft(cb) {
    // cb：areas(keep) → { map, areas: [{ list: [{ id, key }] }] }（這張地圖的 NPC）、request(npc, 動作)、make(npc, 動作, 數量)、icon({ name, nid })、
    //     items()（parseItem 過的背包）、gold()、info(道具)、task() → 新手第 20 步進行中
    let ov = null, tab = '全部', sub = '', q = '', msg = '', msgAt = 0, sig = '', timer = 0, ver = 0, roundAt = 0, roundIds = '';
    let only = '';  // 只列這位工匠的配方（NPC 的 key；'' ＝全部）：站長 2026-10-30「拉比安妮顯示自己的製作道具就好了」
    let pop = '';   // 點開的那一格（groups 的 k）；'' ＝沒點開
    let pick = '', shown = '';   // 點開那格選的配方（keyOf；'' ＝第一個）、小視窗上次畫的配方（換了就把數量框歸 1）
    const data = new Map();   // 要清單用的編號（物件編號或負的 NPC 編號）→ { at, wh, byAct: 動作 → 伺服器算的狀態 }
    let queue = [], inflight = null;   // 還沒問的 NPC 編號、問了還沒回的 { id, at }
    let lastMake = 0;                  // 上次按製作的那隻（做完伺服器會自己重送那隻）
    let curX = null, lastX = null, fxT = 0;   // 小視窗正在顯示的配方、上次按製作的配方（做好了播動畫用）、動畫收掉的計時器
    // 站長 2026-10-29「製作工匠裡面內容按鈕卡卡的」：原本每回一隻 NPC 的清單（開視窗後約每秒一次）、每次點格子／關小視窗都把 260 格整片 innerHTML 重建，
    //   手機上一次 100ms 上下、按下去那格還可能被換掉（點擊落空）。改成：每一格的 DOM 照 data-k 記著（內容字串一樣就沿用同一個元素），
    //   換分頁只是把記著的格子重新排進去、不重新解析 HTML；小視窗內容沒變不重畫；rows＋groups 照（清單版本、NPC 編號、新手任務）記住，
    //   每秒的計時器不再重算；ids()（要掃這張地圖的 NPC）0.5 秒內沿用
    const cellEl = new Map();   // groups 的 k → { h: cellHtml 字串, el }
    let tailHtml = null, popHtml = '', memo = null, idsAt = -1e9, idsV = null;
    const nm = id => +id === GOLD_ID ? '金幣' : NAME_FIX[id] || (MK.items[id] ? MK.items[id][0] : '道具 ' + id);
    const ic = id => { const t = MK.items[id]; const u = cb.icon({ name: nm(id), nid: t ? t[1] : '' }); return u ? '<img src="' + esc(u) + '" alt="">' : ''; };
    const canInfo = id => !!cb.info && +id !== GOLD_ID && !!MK.items[id];
    // 新手第 20 步進行中：放新手那格（只列武器卷軸），常駐的旅人諮詢員先不列，免得同一隻出現兩次
    const crafters = () => (cb.task && cb.task() ? [TASK].concat(CRAFTERS.filter(c => c.key !== TASK.key)) : CRAFTERS).filter(c => MK.npc[c.key]);
    const keyOf = x => x.c.tid + '|' + x.r.a;
    // 每位要用哪個編號問：這張地圖上有同一種 → 物件編號；沒有 → 負的 NPC 編號
    function ids() {
        const now = performance.now();
        if (idsV && now - idsAt < 500) return idsV;
        idsAt = now; idsV = ids0();
        return idsV;
    }
    function ids0() {
        const C = crafters(), K = new Set(C.map(c => c.key)), live = new Map();
        const A = cb.areas ? cb.areas(k => K.has(k)) : null;
        if (A) for (const a of A.areas) for (const n of a.list) if (!live.has(n.key)) live.set(n.key, n.id);
        return new Map(C.map(c => [c.key, live.get(c.key) || -c.tid]));
    }
    // 第 336 項：藏起來的配方（craft-hide.js）不送伺服器算，省得每輪白算
    const actsOf = c => [...new Set((MK.npc[c.key] || []).map(r => r.a))].filter(a => !CRAFT_HIDE.has(c.key + '|' + a)).slice(0, 200);

    // 一輪：同一張地圖的先問（舊伺服器也收）；skip＝做完東西時伺服器自己會重送的那隻
    function round(skip) {
        const I = ids();
        queue = [...I.values()].filter(id => id !== skip).sort((a, b) => (b > 0) - (a > 0));
        roundAt = performance.now(); roundIds = [...I.values()].join(',');
        pump();
    }
    function pump() {
        const now = performance.now();
        if (inflight && now - inflight.at < 2000) return;
        inflight = null;
        const id = queue.shift();
        if (id == null) return;
        const I = ids(), c = crafters().find(x => I.get(x.key) === id);
        if (!c) { pump(); return; }
        inflight = { id, at: now };
        cb.request(id, actsOf(c));
    }

    // o.q：一打開就帶的搜尋字；o.only＝只列這位工匠（NPC key）的配方、標題寫 o.name、不放搜尋框（hud.js 點拉比安尼）
    function open(o) {
        if (ov) ov.remove();
        preloadSfx(['magic', 113]);   // 做好了的動畫要用（playFx），第一次就有聲
        ov = document.createElement('div'); ov.id = 'lmui-craft'; ov.className = 'lmui-ov cr';
        ov.innerHTML = '<div class="box"><div class="hd">' + esc(o && o.only && o.name ? o.name : '製作工匠') + '<button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
            '<div class="cr-top"' + (o && o.only ? ' hidden' : '') + '><div class="cr-tabs" role="tablist"></div><div class="cr-slots" role="tablist" aria-label="部位" hidden></div><input class="cr-q" type="search" placeholder="搜尋道具、材料、NPC" aria-label="搜尋" maxlength="20"></div>' +
            '<div class="cr-msg" hidden></div><div class="bd"></div><div class="cr-pop" hidden></div></div>';
        ov.addEventListener('click', onClick);
        ov.addEventListener('keydown', e => {
            if (e.key === 'Escape' && pop) { e.stopPropagation(); setPop(''); return; }
            if (e.target.tagName === 'INPUT') e.stopPropagation();   // 數字鍵不要變快捷鍵、方向鍵不要走路
        });
        ov.addEventListener('input', e => {
            if (e.target.classList.contains('cr-qty')) e.target.value = e.target.value.replace(/\D+/g, '');
            if (e.target.classList.contains('cr-q') && !e.isComposing) search(e.target);   // 注音、倉頡選字中先不篩，選完字（compositionend）再篩
        });
        ov.addEventListener('compositionend', e => { if (e.target.classList.contains('cr-q')) search(e.target); });
        document.body.appendChild(ov);
        only = (o && o.only) || ''; memo = null; tab = '全部'; sub = ''; q = (o && typeof o.q === 'string' && o.q.trim()) || ''; msg = ''; sig = ''; pop = '';
        ov.querySelector('.cr-q').value = q;
        try { localStorage.removeItem('lineage_web_craft_mode'); } catch (e) { /* 上一版「依類型／依 NPC」記的，用不到了 */ }
        render(true);
        round(0);
        clearInterval(timer);
        timer = setInterval(() => {
            if (!ov || !ov.isConnected) { clearInterval(timer); ov = null; return; }
            if (document.hidden) return;
            // 這張地圖的 NPC 清單剛到（開視窗時還沒有＝全部用負編號排隊）：同一張地圖的換成物件編號，馬上重排一輪，不用等 20 秒
            if ((performance.now() - roundAt > 20000 && !queue.length) || [...ids().values()].join(',') !== roundIds) round(0);
            pump();
            if (msg && performance.now() - msgAt > 5000) msg = '';
            render();
        }, 1000);
    }
    function search(inp) {
        const v = inp.value.trim();
        if (v === q) return;
        q = v; render(true); ov.querySelector('.bd').scrollTop = 0;
    }
    function setPop(k) { pop = k; msg = ''; render(true); if (!k) { const c = ov && ov.querySelector('.cr-cell.last'); if (c) c.focus({ preventScroll: true }); } }
    function close() { clearInterval(timer); clearTimeout(fxT); if (ov) ov.remove(); ov = null; queue = []; inflight = null; pop = ''; cellEl.clear(); memo = null; idsV = null; tailHtml = null; popHtml = ''; only = ''; }

    // 做好了的動畫（站長 2026-10-29「製作道具給個製作動畫」）：材料圖示從四周收到中間 → 閃一下光 → 成品放大彈出＋名字（×總數）。
    //   只在 S_Web 19 res 0（伺服器說做好了）播；一次做很多個也只播一次；再做一次＝換掉上一個重播；點一下就收掉（不擋操作）。
    //   蓋在 .box 裡（.cr-fx，z-index 高過 .cr-pop）；減少動態效果＝只淡入成品（craft.css）。n＝做了幾次，成品數＝每次的數量 × n
    function playFx(x, n) {
        const box = ov && ov.querySelector('.box');
        if (!box || !x) return;
        const old = box.querySelector('.cr-fx'); if (old) old.remove();
        clearTimeout(fxT);
        const runs = Math.max(1, n | 0), oid = x.outs[0][0];
        const name = x.outs.map(([id, k]) => nm(id) + (k * runs > 1 ? ' ×' + (k * runs).toLocaleString() : '')).join('、');
        const mats = x.r.m.map(([id]) => id).slice(0, 6), R = 104;
        const fx = document.createElement('div');
        fx.className = 'cr-fx'; fx.setAttribute('role', 'status');
        fx.innerHTML = '<div class="cr-fx-stage">' + mats.map((id, i) => {
            const a = (i / mats.length) * Math.PI * 2 - Math.PI / 2 + (mats.length % 2 ? 0 : Math.PI / mats.length);
            return '<span class="cr-fx-mat" style="--dx:' + Math.round(Math.cos(a) * R) + 'px;--dy:' + Math.round(Math.sin(a) * R) + 'px;--d:' + (i * 40) + 'ms">' + ic(id) + '</span>';
        }).join('') + '<i class="cr-fx-ray" aria-hidden="true"></i><i class="cr-fx-flash" aria-hidden="true"></i><i class="cr-fx-ring" aria-hidden="true"></i><i class="cr-fx-ring r2" aria-hidden="true"></i>' +
            // 火花（站長 2026-11-01「完成製作給個動畫」：原本的太小不明顯 → 加火花迸發、「製作成功」金字、音效、停久一點）
            Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2 + (i % 2) * 0.2, r = 90 + (i % 3) * 26; return '<i class="cr-fx-spark" style="--sx:' + Math.round(Math.cos(a) * r) + 'px;--sy:' + Math.round(Math.sin(a) * r) + 'px;--sd:' + (i % 4) * 30 + 'ms"></i>'; }).join('') +
            '<span class="cr-fx-out">' + ic(oid) + '</span></div><div class="cr-fx-ttl">製作成功</div><div class="cr-fx-nm">' + esc(name) + '</div>';
        fx.addEventListener('click', e => { e.stopPropagation(); fx.remove(); clearTimeout(fxT); });
        box.appendChild(fx);
        sfx('magic', 0.5, 0, 'craft');
        const t2 = setTimeout(() => { if (fx.isConnected) sfx(113, 0.7, 0, 'craft2'); }, 600);
        fxT = setTimeout(() => { clearTimeout(t2); fx.remove(); }, 2600);
    }

    // 要列的配方：[{ c, r, s, id（要清單的編號）, outs, cat, who: [NPC 名字…] }]（新手任務的排最前面；伺服器說這隻沒有這個配方的不列）。
    //   兩位 NPC 的配方一模一樣（單機版茉莉／拉達爾、芬／法林、喬爾／萊恩）：只列一格，NPC 名字並排
    function rows(I) {
        const out = [], same = new Map();
        for (const c of crafters()) {
            if (only && c.key !== only) continue;
            const id = I.get(c.key), d = data.get(id), who = displayName(c.key.split('|')[0]);
            for (const r of MK.npc[c.key] || []) {
                if (CRAFT_HIDE.has(c.key + '|' + r.a) || closedOnly(r.o[0][0], r)) continue;   // 材料拿不到（craft-hide.js）、只有沒開放的職業用得到
                if (c.act && r.a !== c.act) continue;   // 第 382 項（站長 2026-10-28 截圖「這兩個不用顯示了」）：新手那格只留武器卷軸，象牙塔妙藥、盔甲卷軸不列
                const s = d && d.byAct[r.a];
                if (s && s.cond === 2) continue;
                const k = c.task ? '' : JSON.stringify([r.o, r.m, r.c || 0, r.q || 0, r.lv || 0]), dup = k && same.get(k);
                if (dup) { if (!dup.who.includes(who)) dup.who.push(who); continue; }
                const outs = s && s.outs.length ? s.outs.map(o => [o.id, o.n]) : r.o;
                const x = { c, r, s, id, outs, cat: isAlch(c, r) ? '煉金' : catOf(outs[0][0]), who: [who] };
                if (k) same.set(k, x);
                out.push(x);
            }
        }
        return out;
    }
    const hit = (x, words) => {
        if (!words) return true;
        const t = x.who.concat(x.outs.map(o => nm(o[0])), (x.s ? x.s.mats : x.r.m.map(m => ({ id: m[0] }))).map(m => nm(m.id))).join(' ');
        return words.every(w => t.includes(w));
    };
    const canMake = x => !!(x.s && x.s.max > 0 && x.s.cond === 0);
    // 同一個成品的配方併成一格：{ k, vs: [配方…]（成品數量少的排前面） }，照第一個配方出現的順序。新手任務的另外併、不跟一般的混
    function groups(list) {
        // 名字一樣、道具編號不同的成品（卡立普的袋子：用不同寶石換的）也併一格，點開用材料分頁選（站長 2026-10-25「工匠顯得太亂」）
        const byName = new Map();
        for (const x of list) for (const [id] of x.outs) { const n = nm(id); if (!byName.has(n)) byName.set(n, new Set()); byName.get(n).add(id); }
        const part = id => byName.get(nm(id)).size > 1 ? nm(id) : id;
        const m = new Map();
        for (const x of list) {
            const k = (x.c.task ? 'T' : '') + x.cat + ':' + x.outs.map(o => part(o[0])).join(',');
            if (!m.has(k)) m.set(k, { k, vs: [] });
            m.get(k).vs.push(x);
        }
        for (const g of m.values()) { g.raw = g.vs.slice(); g.vs.sort((a, b) => a.outs[0][1] - b.outs[0][1]); }   // raw＝原本配方順序（材料分頁照它排，每格的石頭順序一致）
        return [...m.values()];
    }
    // 這個配方的主要材料（材料分頁用）：金幣以外、不是這一格每個配方都要的，取配方列的第一個；都一樣＝金幣以外第一個（只有金幣＝金幣）
    function matOf(x, g) {
        const ids = y => y.r.m.map(m => +m[0]).filter(id => id !== GOLD_ID), mine = ids(x);
        const own = mine.find(id => !g.vs.every(y => ids(y).includes(id)));
        return own != null ? own : mine.length ? mine[0] : GOLD_ID;
    }
    // 預設選的配方：第一個材料分頁（原本配方順序第一個的主要材料）裡數量最少的
    const firstOf = g => { const m0 = matOf(g.raw[0], g); return g.vs.find(y => matOf(y, g) === m0) || g.vs[0]; };
    // 數量按鈕的字：×數量；同一格裡有別的配方數量一樣 → 後面加這個配方獨有的材料（都沒有就加 NPC 名字）
    function vLabel(x, g) {
        const n = x.outs[0][1], lab = '×' + n.toLocaleString();
        const twins = g.vs.filter(y => y !== x && y.outs[0][1] === n);
        if (!twins.length) return esc(lab);
        const ids = y => y.r.m.map(m => +m[0]);
        const own = ids(x).find(id => twins.every(y => !ids(y).includes(id)));
        const tag = own != null ? nm(own) : x.who.join('、');
        return esc(lab) + '<small>' + esc(tag) + '</small>';
    }

    // 排序：新手任務 → 做得出來的 → 分頁順序 → 防具部位 → 成品等級限制 → 要的金幣（相同照原本順序）
    function sortGroups(list) {
        const key = (g, i) => {
            const x = g.vs[0], id = x.outs[0][0], tp = tplOf(id), sl = SLOTS.findIndex(([t]) => t === slotOf(id));
            const gold = (x.r.m.find(m => +m[0] === GOLD_ID) || [0, 0])[1];
            return [x.c.task ? 0 : 1, g.vs.some(canMake) ? 0 : 1, CATS.indexOf(x.cat), sl < 0 ? 99 : sl, (tp && tp.minLv) || 0, gold, i];
        };
        const ks = new Map(list.map((g, i) => [g, key(g, i)]));
        const sorted = list.slice().sort((a, b) => { const A = ks.get(a), B = ks.get(b); for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; });
        // 站長 2026-11-02「這個麻煩排的順順的」：同名只差尾巴括號的（傲慢之塔傳送符 21F～91F）原本照等級限制排、被魔眼插在中間 →
        //   第一個出現的位置不動，同系列的其他都搬到它後面（彼此照上面排好的順序，樓層由低到高）
        const series = g => { const x = g.vs[0]; if (x.outs.length !== 1) return null; const m = /^(.+?)\(([^()]{1,5})\)$/.exec(nm(x.outs[0][0])); return m ? m[1] : null; };
        const out = [], seen = new Set();
        for (const g of sorted) {
            if (seen.has(g)) continue;
            out.push(g); seen.add(g);
            const b = series(g);
            if (b) for (const h of sorted) if (!seen.has(h) && series(h) === b) { out.push(h); seen.add(h); }
        }
        return out;
    }

    // 站長 2026-10-23（craft8c）：清單＝縮圖格（成品圖示＋名字，像背包格子），點一格才跳出小視窗看材料、按製作。
    //   做得出來的格子框亮一點＋右上小綠點；新手任務那幾格金框、標「新手任務」，每個分頁都排最前面
    function render(force) {
        if (!ov) return;
        const I = ids(), mk = [MK, ver, [...I.values()].join(','), cb.task && cb.task() ? 1 : 0];
        if (!memo || memo.k.some((v, i) => v !== mk[i])) { const all = rows(I), task = all.filter(x => x.c.task), rest = all.filter(x => !x.c.task); memo = { k: mk, all, rest, G: groups(task.concat(rest)) }; }
        const { all, rest } = memo;
        // 站長 2026-10-25「工匠顯得太亂」：多「可製作」分頁；防具再照部位分；每頁做得出來的排前面，其他照分頁、部位、等級排
        const books = cb.books ? cb.books() : [];   // 圖鑑卡片 [{ id, name, icon, got, total, off＝未開放 }]
        const tabs = ['全部', '可製作'].concat(CATS.filter(c => rest.some(x => x.cat === c)), books.length ? ['圖鑑'] : []);   // 圖鑑（站長 2026-10-25）：排最後
        if (!tabs.includes(tab)) tab = '全部';
        const G = memo.G;
        const slots = SLOTS.filter(([t]) => G.some(g => g.vs[0].cat === '防具' && slotOf(g.vs[0].outs[0][0]) === t));
        if (tab !== '防具' || !slots.some(x => x[0] === sub)) sub = '';
        const s = [tab, sub, q, ver, msg, pop, pick, [...I.values()].join(','), all.length, JSON.stringify(books)].join('|');
        if (!force && s === sig) return;
        const a = document.activeElement;
        if (!force && ov.contains(a) && a.classList.contains('cr-qty')) return;   // 正在打數量：先不重畫
        sig = s;
        const tb = ov.querySelector('.cr-tabs'), th = tabs.map(t => '<button type="button" role="tab" data-tab="' + t + '"' + (t === tab ? ' class="on" aria-selected="true"' : '') + '>' + t + '</button>').join('');
        if (tb.innerHTML !== th) tb.innerHTML = th;
        const sl = ov.querySelector('.cr-slots'), sh = tab === '防具' && slots.length > 1 ? [['', '全部']].concat(slots).map(([t, n]) => '<button type="button" role="tab" data-slot="' + t + '"' + (t === sub ? ' class="on" aria-selected="true"' : '') + '>' + n + '</button>').join('') : '';
        if (sl.innerHTML !== sh) sl.innerHTML = sh;
        sl.hidden = !sh;
        const words = q ? q.split(/\s+/).filter(Boolean) : null;
        const inTab = g => g.vs[0].c.task || tab === '全部' || (tab === '可製作' ? g.vs.some(canMake) : g.vs[0].cat === tab && (!sub || slotOf(g.vs[0].outs[0][0]) === sub));
        const list = sortGroups(G.filter(g => inTab(g) && g.vs.some(x => hit(x, words))));
        const bd = ov.querySelector('.bd'), keep = bd.scrollTop;
        if (tab === '圖鑑') {   // 圖鑑：一種一張卡（名字、收集進度條），點了開那個圖鑑
            // shine：圖示閃亮亮同快捷格的主城傳送石（lmui.css img.home-shine＋.hs-fx；站長 2026-10-25「開通圖示幫我用成跟他一樣閃閃發亮」）
            const bIcon = (id, shine) => { try { const t = itemById(id); const u = t ? itemIcon(t) : ''; return u ? '<img src="' + esc(u) + '" alt=""' + (shine ? ' class="home-shine"' : '') + '>' + (shine ? '<i class="hs-fx" aria-hidden="true"><b></b><b></b><b></b></i>' : '') : ''; } catch (e) { return ''; } };
            tailHtml = null;
            bd.innerHTML = '<div class="cr-books">' + books.map(b => {
                const pct = !b.off && b.total ? Math.floor(b.got / b.total * 100) : 0;
                return '<button type="button" class="cr-book' + (b.off ? ' off' : ' lit') + (b.ready ? ' ready' : '') + '"' + (b.off ? ' disabled' : ' data-book="' + esc(b.id) + '"') + '><span class="cr-bk-ic">' + bIcon(b.icon, !b.off)   /* 站長 2026-10-25：開放的圖鑑圖示都閃亮亮（三顆小星星），未開放灰色 */ + '</span>' +
                    '<span class="cr-bk-tx"><b>' + esc(b.name) + '</b>' + (b.off ? '<em>未開放</em>' : '<small>' + (b.label || '收集') + ' ' + b.got + ' / ' + b.total + '</small><i style="--p:' + pct + '%"></i>') + '</span>' +
                    (b.off ? '' : '<span class="cr-bk-pct">' + pct + '<u>%</u></span>') + '</button>';
            }).join('') + '</div>';
            pop = ''; const pp = ov.querySelector('.cr-pop'); if (pp) pp.hidden = true; const mm = ov.querySelector('.cr-msg'); if (mm) mm.hidden = true;
            return;
        }
        const noWh = [...data.values()].some(d => !d.wh);
        const cells = list.map(cellHtml), tail = (list.length ? '' : '<div class="cr-none">' + (q ? '沒有符合的配方' : tab === '可製作' ? '現在沒有材料夠的配方' : '沒有配方') + '</div>') +
            (noWh && list.length ? '<div class="cr-note">倉庫的材料要 5 級以上、沒設倉庫密碼才算得進來</div>' : '');
        const els = list.map((g, i) => {   // 內容一樣的格子沿用原本的元素（圖示不重載、按住的那格不會被換掉）
            let c = cellEl.get(g.k);
            if (!c || c.h !== cells[i]) { const t = document.createElement('template'); t.innerHTML = cells[i]; c = { h: cells[i], el: t.content.firstElementChild }; cellEl.set(g.k, c); }
            c.el.classList.toggle('last', g.k === pop);
            return c.el;
        });
        let grid = bd.firstElementChild && bd.firstElementChild.classList.contains('cr-grid') ? bd.firstElementChild : null;
        if (!grid || tail !== tailHtml) {
            bd.innerHTML = tail;
            grid = null;
            tailHtml = tail;
        }
        if (els.length) {
            if (!grid) { grid = document.createElement('div'); grid.className = 'cr-grid'; bd.prepend(grid); }
            const cur = grid.children;
            if (cur.length !== els.length || els.some((e, i) => cur[i] !== e)) grid.replaceChildren(...els);
        } else if (grid) grid.remove();
        bd.scrollTop = keep;
        // 點開的那一格：小視窗（數量按鈕、材料、數量、製作）；那一格不見了（伺服器說沒有這些配方）就收起來
        const p = ov.querySelector('.cr-pop'), g = pop ? G.find(y => y.k === pop) : null;
        const x = g ? g.vs.find(y => keyOf(y) === pick) || firstOf(g) : null;
        if (pop && !x) pop = '';
        const m = ov.querySelector('.cr-msg');
        m.hidden = !msg || !!x; m.textContent = msg;
        curX = x;
        if (!x) { p.hidden = true; p.innerHTML = ''; popHtml = ''; return; }
        const old = p.querySelector('.cr-qty'), qv = old && shown === keyOf(x) ? old.value : '1';
        shown = keyOf(x);
        // 好幾個配方：主要材料不只一種 → 材料分頁（點了選那種材料的第一個數量）＋那種材料的數量按鈕；只有一種 → 只有數量按鈕
        let vs = '';
        if (g.vs.length > 1) {
            const mk = new Map();
            for (const y of g.raw) { const m = matOf(y, g); if (!mk.has(m)) mk.set(m, []); mk.get(m).push(y); }
            for (const ys of mk.values()) ys.sort((a, b) => a.outs[0][1] - b.outs[0][1]);
            const cur = matOf(x, g), sub = mk.size > 1 ? { vs: mk.get(cur) } : g;
            const tabs = mk.size > 1 ? '<div class="cr-ms" role="tablist" aria-label="材料">' + [...mk].map(([m, ys]) => {
                const on = m === cur;
                return '<button type="button" role="tab" aria-selected="' + on + '" class="cr-m' + (on ? ' on' : '') + (ys.some(canMake) ? ' can' : '') + '" data-v="' + esc(keyOf(ys[0])) + '">' +
                    '<span class="cr-mi">' + ic(m) + '</span>' + esc(nm(m)) + '</button>';
            }).join('') + '</div>' : '';
            const qs = sub.vs.length > 1 ? '<div class="cr-vs" role="radiogroup" aria-label="數量">' + sub.vs.map(y => {
                const on = y === x;
                return '<button type="button" role="radio" aria-checked="' + on + '" class="cr-v' + (on ? ' on' : '') + (canMake(y) ? ' can' : '') + '" data-v="' + esc(keyOf(y)) + '">' + vLabel(y, sub) + '</button>';
            }).join('') + '</div>' : '';
            vs = '<div class="cr-vw">' + tabs + qs + '</div>';
        }
        const ph = '<div class="cr-dim" data-pclose="1"></div><div class="cr-card" role="dialog" aria-label="' + esc(nm(x.outs[0][0])) + '">' +
            '<button type="button" class="cr-pclose" data-pclose="1" aria-label="關閉">✕</button>' + rowHtml(x, vs) +
            (msg ? '<div class="cr-pmsg">' + esc(msg) + '</div>' : '') + '</div>';
        if (ph !== popHtml || p.hidden) {   // 內容一樣就不重畫（數量框打的字、按鈕按住都不會被換掉）
            popHtml = ph; p.innerHTML = ph;
            const nq = p.querySelector('.cr-qty'); if (nq && !nq.disabled) nq.value = qv;
        }
        p.hidden = false;
    }

    // 一格縮圖：成品圖示（只有一個配方、數量大於 1：角落標 ×N；好幾個配方＝點開再選，不標）＋名字；任一個配方做得出來＝cr-cell can（亮框＋小綠點）
    function cellHtml(g) {
        const x = g.vs[0], oid = x.outs[0][0], n1 = g.vs.length === 1 ? x.outs[0][1] : 1, k = g.k;
        const name = x.outs.map(([id]) => nm(id)).join('、');
        // 名字尾巴的短括號（樓層「(21F)」、「(10%)」）做成圖示左上的小牌子：格子名字兩行會被切掉，一排傳送符看不出是幾樓（站長 2026-10-25）
        const tail = x.outs.length === 1 ? /^(.+?)\(([^()]{1,5})\)$/.exec(name) : null;
        return '<button type="button" class="cr-cell' + (g.vs.some(canMake) ? ' can' : '') + (x.c.task ? ' task' : '') + '" data-k="' + esc(k) + '" title="' + esc(name) + '">' +
            (x.c.task ? '<span class="cr-ctag">新手任務</span>' : cb.pass && cb.pass(oid) ? '<span class="cr-ctag cr-done">已開通</span>' : '') +
            '<span class="cr-cic">' + ic(oid) + (tail ? '<span class="cr-cfl">' + esc(tail[2]) + '</span>' : '') + (n1 > 1 ? '<span class="cr-cn">×' + n1.toLocaleString() + '</span>' : '') + '</span>' +
            '<span class="cr-cnm">' + esc(tail ? tail[1] : name) + '</span></button>';
    }

    // 小視窗裡的詳細（同上一版的配方卡）。s＝伺服器算好的狀態（S_Web 18；還沒到＝材料照背包算、不能按）；一次能做多個的（flags 1）才有數量框
    //   vs＝同一個成品好幾個配方時的數量按鈕（放在名字底下、材料上面）
    function rowHtml(x, vs) {
        const { c, r, s, outs } = x;
        const oid = outs[0][0], n1 = outs[0][1];
        const name = outs.map(([id, n]) => nm(id) + (n > 1 && outs.length > 1 ? ' ×' + n.toLocaleString() : '')).join('、');
        const mats = s ? s.mats : r.m.map(([id, need]) => { const inv = invCount(id); return { id, need, inv, wh: 0, st: inv >= need ? 0 : 2 }; });
        const oc = openOnly(r.c), cond = [oc.length && oc.length < OPEN_CLS.length ? '限' + oc.join('、') : '', r.q ? '任務「' + r.q + '」' : '', r.lv ? (r.lv[0] === r.lv[1] ? r.lv[0] + ' 級' : r.lv[0] + '～' + r.lv[1] + ' 級') : ''].filter(Boolean).join('・');
        const can = canMake(x), multi = s && (s.flags & 1);
        const lack = s && s.max < 1 && s.lack.length ? '<div class="cr-lack">還缺：' + s.lack.map(l => esc(nm(l.id)) + ' ' + l.n.toLocaleString()).join('、') + '</div>' : '';
        const who = esc(x.who.join('、'));
        // 樓層小牌子（同格子 cellHtml 的 tail）：傳送符圖示上原本畫的 3～10 會被它蓋掉，只看到「21F」
        const fm = outs.length === 1 ? /\(([^()]{1,5})\)$/.exec(name) : null, fl = fm ? '<span class="cr-cfl">' + esc(fm[1]) + '</span>' : '';
        return '<div class="cr-row' + (can ? ' can' : '') + (c.task ? ' task' : '') + (vs ? ' multi' : '') + '" data-k="' + c.tid + '|' + esc(r.a) + '">' +
            (canInfo(oid) ? '<button type="button" class="cr-ic" data-info="' + oid + '" aria-label="道具資訊">' + ic(oid) + fl + '</button>' : '<span class="cr-ic">' + ic(oid) + fl + '</span>') +
            '<div class="cr-hd"><b class="cr-nm">' + esc(name) + '</b>' + (outs.length === 1 && n1 > 1 ? '<span class="cr-n">×' + n1.toLocaleString() + '</span>' : '') +
            (c.task ? '<span class="cr-tag">新手任務</span>' : '') + '</div>' +
            '<div class="cr-sub">' + who + (cond ? '<span' + (s && s.cond === 1 ? ' class="bad"' : '') + '>・' + esc(cond) + '</span>' : '') + '</div>' +
            (vs || '') + '<div class="cr-mats">' + mats.map(m => {
                const cls = m.st === 0 ? 'ok' : m.st === 1 ? 'mid' : 'no', have = m.inv + m.wh, inf = canInfo(m.id);
                return '<span class="cr-mat ' + cls + '"' + (inf ? ' data-info="' + m.id + '" role="button" tabindex="0"' : '') + '>' +
                    '<span class="cr-mi">' + ic(m.id) + '</span><span class="cr-mn">' + esc(nm(m.id)) + '</span><b>' + have.toLocaleString() + '/' + m.need.toLocaleString() + '</b>' +
                    (m.st === 1 ? '<i>可合成</i>' : '') + (m.wh > 0 ? '<em>倉庫 ' + m.wh.toLocaleString() + '</em>' : '') + '</span>';
            }).join('') + '</div>' + lack +
            '<div class="cr-ctl">' + (can ? '<span class="cr-max">可做 ' + s.max.toLocaleString() + '</span>' : '') +
            '<span class="cr-btns">' + (multi ? '<input class="cr-qty" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" value="1" aria-label="數量"' + (can ? '' : ' disabled') + '>' : '') +
            '<button type="button" class="cr-go" data-id="' + x.id + '" data-act="' + esc(r.a) + '"' + (can ? '' : ' disabled') + '>製作</button></span></div></div>';
    }
    // 背包裡有幾個（伺服器清單還沒到時用；同 npc.js 製作分頁：名字編號對、祝福狀態對、穿著的不算）
    function invCount(id) {
        if (+id === GOLD_ID) return cb.gold();
        const t = MK.items[id]; if (!t) return 0;
        let n = 0;
        for (const p of cb.items()) if (!p.equipped && (p.nid === t[1] || p.nid === t[2]) && (p.it.bless == null || p.it.bless === t[3])) n += p.count || 1;
        return n;
    }

    function onClick(e) {
        if (e.target === ov || e.target.closest('[data-x]')) { close(); return; }
        if (e.target.closest('[data-pclose]')) { setPop(''); return; }
        const inf = e.target.closest('[data-info]');
        if (inf && cb.info) { const k = inf.getAttribute('data-info'), t = MK.items[k]; if (t) cb.info(infoItem({ name: t[0], nid: t[1], bless: t[3], id: +k })); return; }
        const bk = e.target.closest('[data-book]');
        if (bk) { if (cb.openBook) cb.openBook(bk.getAttribute('data-book')); return; }
        const tb = e.target.closest('[data-tab]');
        if (tb) { tab = tb.getAttribute('data-tab'); sub = ''; render(true); ov.querySelector('.bd').scrollTop = 0; return; }
        const so = e.target.closest('[data-slot]');
        if (so) { sub = so.getAttribute('data-slot'); render(true); ov.querySelector('.bd').scrollTop = 0; return; }
        const cell = e.target.closest('.cr-cell');
        if (cell) { pick = ''; setPop(cell.getAttribute('data-k')); return; }
        const v = e.target.closest('.cr-v, .cr-m');
        if (v) { pick = v.getAttribute('data-v'); msg = ''; render(true); return; }
        const b = e.target.closest('.cr-go');
        if (b && !b.disabled) {
            const id = +b.getAttribute('data-id'), row = b.closest('.cr-row'), qi = row.querySelector('.cr-qty');
            const cnt = Math.max(1, Math.min(9999, Math.floor(+(qi && qi.value) || 1)));
            b.disabled = true; msg = '';
            lastMake = id; lastX = curX;
            cb.make(id, b.getAttribute('data-act'), cnt);
        }
    }

    // 做好 n 次：這個配方的材料先扣掉（背包先、不夠再扣倉庫，同伺服器 Maker），可做幾個重算；不動伺服器的資料以外的東西，下一包 S_Web 18 會整份蓋掉
    function spent(x, n) {
        const d = x && data.get(x.id), st = d && d.byAct[x.r.a];
        if (!st || !(n > 0)) return;
        const mats = st.mats.map(m => {
            let use = m.need * n; const inv = Math.max(0, m.inv - use); use -= m.inv - inv;
            const wh = Math.max(0, m.wh - use), have = inv + wh;
            return { ...m, inv, wh, st: have >= m.need ? 0 : m.st === 1 ? 1 : 2 };
        });
        const max = Math.min(...mats.map(m => Math.floor((m.inv + m.wh) / Math.max(1, m.need))));
        d.byAct[x.r.a] = { ...st, mats, max: Math.max(0, Math.min(st.max - n, max)) };
        d.raw = null;   // 伺服器重送一樣的也要照它畫
        ver++;
    }

    return {
        open, close,
        isOpen: () => !!ov && ov.isConnected,
        // S_Web 18：{ npc（負的 NPC 編號照樣回；封包讀成無號，這裡轉回有號）, wh, recipes: [{ act, cond, flags, max, outs, mats, lack }] }
        //   站長 2026-10-30「有時候裡面按鈕卡卡的」：視窗開著就一輪一輪一直重問（約每秒回一隻），材料沒變時回來的跟上次一模一樣，
        //   原本照樣 ver++ → 整份配方重整、所有格子重組字串；一樣的就只記時間，不重算不重畫
        list(d) {
            const id = d.npc | 0, raw = JSON.stringify([d.wh, d.recipes]), old = data.get(id), same = !!old && old.raw === raw;
            if (same) old.at = performance.now();
            else {
                const byAct = {};
                for (const r of d.recipes) byAct[r.act] = r;
                data.set(id, { at: performance.now(), wh: d.wh, byAct, raw });
                ver++;
            }
            if (inflight && inflight.id === id) { inflight = null; pump(); }
            if (ov && !same) render();   // 正在打數量時不重畫（打完下一秒補）
        },
        // 視窗（.box）蓋住 r（getBoundingClientRect）幾成，0～1；沒開＝0。main.js 拿來決定後面的地圖要不要照畫
        cover(r) {
            const b = ov && ov.isConnected ? ov.querySelector('.box') : null;
            if (!b || !(r.width > 0 && r.height > 0)) return 0;
            const q = b.getBoundingClientRect();
            const w = Math.max(0, Math.min(q.right, r.right) - Math.max(q.left, r.left)), h = Math.max(0, Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top));
            return (w * h) / (r.width * r.height);
        },
        // S_Web 19：{ res 0 做好了／1 沒做成／2 照原本流程送出了, n, msg }。回這次要顯示的一句（照原本流程的不寫，看原版訊息）
        //   做好了：材料變了，其他 NPC 的也重問一輪（做的那隻伺服器會自己重送）
        done(r) {
            msg = r.res === 0 ? ((r.msg && r.msg.includes('只做了')) ? r.msg : '做好了 ' + r.n.toLocaleString() + ' 個') : r.res === 1 ? (r.msg || '沒有做成') : '';
            msgAt = performance.now();
            if (r.res === 0) spent(lastX, r.n);   // 站長 2026-11-02「做完扣完材料要馬上顯示剩幾個，不然還以為可以再做」：先照這次做的數量扣掉，伺服器重送的清單到了再照它的
            if (ov) { if (r.res === 0) { round(lastMake); playFx(lastX, r.n); } render(true); }
            return msg;
        },
    };
}
