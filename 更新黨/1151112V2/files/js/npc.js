// NPC 對話框：伺服器的對話內容在用戶端加密檔（不解），網頁照 NPC 種類（data/npcfn.json，gen-data 從商店表、倉庫 NPC、Teleporter.xml 整理）自己畫，
//   按鈕送的動作字串跟原本對話框一樣（C_NPCAction），買賣、存取用 C_Result，成敗全照伺服器（金幣不夠等等照伺服器的訊息）。
//   商人：「買」「賣」→ buy／sell → 伺服器回清單 → 版面照單機版商店（js/13 renderShopItems：圖示、名字、價錢、數量、購買）
//   倉庫：版面照單機版倉庫（js/12 renderWarehouseNPC 的 whx-*：金幣列、倉庫／背包分頁、分類、列上的數量＋取出／存入）；個人倉庫 5 級以上才能用（伺服器規定）
//     血盟倉庫（第 111 項，有血盟才有上面「個人倉庫／血盟倉庫」切換）：照原版——清單 retrieve-pledge（S_RetrieveList 種類 5，打開的人鎖住倉庫）、
//       存 C_Result 4、取 C_Result 5、關掉／切回個人倉庫送 C_Result 5 空清單解鎖；見習、沒封號不能用（clan.whState，伺服器取出時也再擋）
//   傳送師：Teleporter.xml 裡這隻的目的地與價錢，按了送那個動作字串，扣錢、傳送都是伺服器
//   製作：伺服器 NpcActions 裡這隻的配方（data/npcmake.json，tools/npc-make.mjs）：成品、材料要幾個／背包有幾個（不算穿著的，同伺服器）、職業／任務條件；
//     站長 2026-10-19「製作：所有 NPC 統一」：跟製作工匠（craft.js）同一套——打開製作分頁就跟伺服器要這隻的配方狀態（C_Web 15 → S_Web 18，web/WebCraft），
//       材料算背包＋倉庫、不夠但能用別的配方先做出來的標「（可合成）」、做不出來列「還缺：最底層材料」；按「製作」送 C_Web 16（伺服器自動先做中間材料，回 S_Web 19）。
//       伺服器標「照原本流程」的（任務、傳送類，旗標 2）、清單還沒回來時：照舊送動作字串（C_NPCAction）；
//       材料夠做好幾份、配方可以輸入數量時伺服器回 S_HowManyMake 問幾個 → 回這裡填的數量（C_Amount）。
//     扣材料、給成品、能不能做都是伺服器，結果照伺服器的訊息（也列在視窗裡）
//   好幾種功能（商人兼製作…）上面一排分頁切換
//   買、賣、製作清單的道具圖示（和名字）點了看道具資訊（cb.info → iteminfo.js，跟背包的道具視窗同一套說明）；買、賣、製作照原本的按鈕
//   艾利溫：妖精選屬性（火、水、風、地；去除精靈力），見 ELF_NPC
//   魔法商人：花錢上一組增益（兩組，價錢照伺服器，站長 2026-10-23 定 1 萬），見 BS_HTML
//   寵物商（羅德尼、班酷、燃柳的基頓、梅玲；站長 2026-10-20「11 種寵物可以在 NPC 那裡買得到，每隻 5 萬」「兩個 NPC 都賣」）：data/npcfn.json 的 pet（gen-data PET_SHOP）一隻一列＝頭像、名字、價錢、「購買」，
//     按了送 C_NPCAction「buypet 寵物編號」；扣錢、給項圈（裡面是 Lv5 的寵物）都是伺服器，結果（獲得項圈[Lv.5 ○○]／金幣不足）寫在列表上面
//   寵物保管員（職稱「寵物保管員」，data/npccards.json；伺服器本機改動第 83 項①，站長 2026-10-22「NPC寵物保管員也可以領寵物，領一次1000」）：「寵物」分頁
//     一隻一列＝頭像、名字、Lv；收在項圈的寫價錢＋「領出」（C_Result 12：NPC、項圈；扣錢、夥伴上限、魅力都是伺服器），在身邊的「寄放」（同夥伴視窗，C_Web 8-2）。
//     清單＝背包裡有寵物的項圈（S_Web 11，hud 的 petCols）＋叫出來的寵物（S_Web 8）；按了之後 5 秒內的伺服器訊息寫在列表上面（同寵物商）
//   城堡侍從長（伺服器本機改動第 122 項，站長 2026-10-23「城主調稅率的網頁畫面」）：城主說話時伺服器回城主那頁對話（LORD_HTML）→ 多「城堡」分頁＋「調整稅率」；
//     按了照原版送 C_NPCAction "tax" → S_TaxRate（範圍 0～50、目前稅率、公庫）→ 拉條＋「標價 100 玩家實付」（同伺服器 L1TaxCalculator，第 120 項）→ 確認 → C_TaxRate；
//     送完再要一次 S_TaxRate，伺服器存好的稅率、商店用的稅率都對上才說設好了（站長 2026-10-23：設好立即生效、可以設 0%）。是不是城主、範圍全是伺服器判斷（非城主伺服器不回城主那頁、C_TaxRate 也不收）
//   派報少年（第 148 項，站長 2026-10-24「點派報少年 可以看喊話內容」）：伺服器回對話檔 newsboy＋[版本 1, 剛說過幾句 R, 剛說過的（最新在前）, 全部句子…]（web/WebNewsboy）→「消息」分頁，見 NEWS_HTML
//   旅館老闆（第 138 項，站長 2026-10-23「要能夠向 NPC 購買鑰匙，買到鑰匙後點擊使用鑰匙可以直接飛進去房間」）：說話時伺服器回 inn（npcaction 表）→「旅館」分頁，見 INN_HTML
//   商店購買清單：伺服器在清單尾端帶這家商人現在收的城稅（S_ShopSellList），不是 0 就在上面寫「本城稅率 ○%」
//   次元之門（第 407 項，慾望洞穴大廳四扇：土、風、水、火）：伺服器回目前狀態的對話檔＋印記數等資料（web/WebElementDoor）→「次元之門」畫面，見 DOOR_KEY
//   其他：「這位 NPC 目前沒有可用的功能」
//   用法：const ui = createNpcUi(cb)；ui.open({ id, name, title, key, map })、ui.shopBuy(封包)、ui.shopSell(封包)、ui.retrieve(封包)、ui.noSell()、ui.whEmpty()、
//     ui.makeAmount(NPC, 動作)、ui.makeMsg(文字)、ui.craftList(S_Web 18)、ui.craftDone(S_Web 19)、ui.refresh()、ui.close()
import { parseItem, stacks, stackKey, glowCls, nameCls, infoItem, isBound } from './items.js';
import { displayName, npcPortrait, trimImage } from './look.js';
import { CLAN_WH_OPEN } from './clan.js';
import { goldIcon } from './icons.js';
import { npcIconSvg } from './npcmark.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let NPCFN = {}, NPCMAKE = { items: {}, npc: {} };
fetch('/data/npcfn.json').then(r => r.ok ? r.json() : null).then(d => { NPCFN = d || {}; }).catch(() => {});
fetch('/data/npcmake.json').then(r => r.ok ? r.json() : null).then(d => { if (d && d.npc) NPCMAKE = d; }).catch(() => {});
const GOLD_ID = 40308;
const CLAN_NPC = '血盟執行人';
// 艾利溫（象牙塔 2 樓，L1Merchant）：妖精選屬性。原版對話檔 ellyonne 在加密檔，網頁照名字（或伺服器回 ellyonne）自己畫；
//   按鈕送 C_NPCAction fire／water／air／earth（伺服器只讓妖精、還沒有屬性的選），去除精靈力＝init（會刪掉學過的屬性魔法）。
//   選成功伺服器回 S_PacketBox 15（main.js elfMsg）、去除成功回系統訊息 678；不符合條件伺服器什麼都不回 → 等一下沒回音就說為什麼
//   第 117 項（站長 2026-10-23「介面做得更精緻、選了屬性要有效果」；定案「讓玩家自己去找 NPC 學，自己消除」）：
//   - 四屬性各畫一個意象（火焰、水波、旋風、岩土，ELF_SVG）；點了先看那一系能學的魔法，按「選定○屬性」才送。
//   - 選定的那一刻：畫面中間播一次屬性特效（elfBurst，CSS）；角色身上的效果圖是伺服器播的（web/WebElfAttr，S_SkillSound）。
//   - 有屬性之後：列出那一系的魔法當資訊（圖示、名字、要幾級、學過沒、去哪拿；站長 2026-10-23 定案「讓玩家自己去找 NPC 學」，艾利溫不賣、不能學，
//     伺服器 C_Web 29 也擋）；自己的屬性、去除精靈力的價錢照 S_Web 35 版本 2。
//   - 去除精靈力：價錢照伺服器給的（設定檔 elfreset，站長定 500 萬），按第二下才送；伺服器收錢、刪屬性魔法（照原版）。
const ELF_NPC = '艾利溫', ELF_HTML = new Set(['ellyonne']);
// [動作字串, 名稱, class 字尾, 伺服器屬性值（1 地、2 火、4 水、8 風）, S_PacketBox 15 的編號]
const ELF_ATTR = [['fire', '火', 'f', 2, 1], ['water', '水', 'w', 4, 2], ['air', '風', 'a', 8, 3], ['earth', '地', 'e', 1, 4]];
const elfByVal = v => ELF_ATTR.find(a => a[3] === v) || null;
const ELF_RESET_DEF = 5000000;   // 伺服器還沒給價錢時顯示的（舊伺服器）；真正收多少是伺服器
// 四屬性的意象（viewBox 64）：火焰、水滴＋水波、旋風、岩山＋晶石；漸層 id 各自一組（同一頁出現好幾次也一樣，不會互相蓋掉）
const ELF_SVG = {
    f: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="elfg-f" cx="50%" cy="72%" r="62%"><stop offset="0" stop-color="#fff6c2"/><stop offset=".42" stop-color="#ffb02e"/><stop offset="1" stop-color="#c2290c"/></radialGradient></defs>' +
        '<path d="M32 3c3 10 15 17 15 32a15 15 0 0 1-30 0c0-8 3.5-12.5 7-16 0 5.5 2 8.5 5.5 10C27.5 20 30 11 32 3z" fill="url(#elfg-f)"/>' +
        '<path d="M44 19c3 4 6 9 5 15-1-4-3-6-5-7 1-3 1-5 0-8zM19 25c-2 4-3 8-2 12 1-3 2-4 4-5-1-2-2-4-2-7z" fill="#ff8a1f" opacity=".85"/>' +
        '<path d="M32 31c2.5 4 7 7 7 13a7 7 0 0 1-14 0c0-4 2-6.5 4-8.5 0 3 1 4.5 3 5.5-1-4-.5-7 0-10z" fill="#fff6c2"/></svg>',
    w: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="elfg-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe9ff"/><stop offset=".5" stop-color="#3b8fe0"/><stop offset="1" stop-color="#123c8c"/></linearGradient></defs>' +
        '<path d="M32 4C24 17 15 26 15 38.5a17 17 0 0 0 34 0C49 26 40 17 32 4z" fill="url(#elfg-w)"/>' +
        '<path d="M20 39c4-3.5 8-3.5 12 0s8 3.5 12 0M22 47c3.3-2.6 6.7-2.6 10 0s6.7 2.6 10 0" fill="none" stroke="#e6f6ff" stroke-width="2.6" stroke-linecap="round"/>' +
        '<ellipse cx="25" cy="27" rx="3" ry="6" fill="#fff" opacity=".55" transform="rotate(25 25 27)"/></svg>',
    a: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="elfg-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2fff0"/><stop offset=".5" stop-color="#5fd39a"/><stop offset="1" stop-color="#1d7a52"/></linearGradient></defs>' +
        '<g fill="none" stroke="url(#elfg-a)" stroke-linecap="round"><path d="M5 23h33a8.5 8.5 0 1 0-8.5-8.5" stroke-width="5"/>' +
        '<path d="M3 34h46a9 9 0 1 1-9 9" stroke-width="5.5"/><path d="M9 45h17a6.5 6.5 0 1 1-6.5 6.5" stroke-width="4.5"/>' +
        '<path d="M44 21h10M50 30h9" stroke-width="3" opacity=".7"/></g></svg>',
    e: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="elfg-e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d79b"/><stop offset=".55" stop-color="#a9772f"/><stop offset="1" stop-color="#5a3a12"/></linearGradient>' +
        '<linearGradient id="elfg-e2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#e2a93a"/></linearGradient></defs>' +
        '<path d="M4 54L21 25l8 10 11-21 20 40z" fill="url(#elfg-e)"/><path d="M40 14l-5 17 5 23M21 25l3 12-5 17" fill="none" stroke="#3a250b" stroke-width="1.6" opacity=".7"/>' +
        '<path d="M31 54l4-13 4 6 3-10 5 17z" fill="url(#elfg-e2)"/><path d="M2 55h60" stroke="#6b4a1a" stroke-width="3" stroke-linecap="round"/></svg>',
};
let elfPend = 0;   // 按了之後等伺服器回音的計時器
// 選定屬性的特效（畫面中間，不擋點擊）：屬性意象放大＋光環＋粒子（火往上竄、水波一圈圈、風繞圈、地石塊往上噴），約 2 秒自己拿掉
function elfBurst(c) {
    const a = ELF_ATTR.find(x => x[2] === c); if (!a) return;
    const old = document.getElementById('elf-burst'); if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'elf-burst'; el.className = 'elf-burst elfb-' + c;
    let parts = '';
    for (let i = 0; i < 16; i++) parts += '<i style="--i:' + i + ';--r:' + ((i * 137) % 360) + 'deg;--d:' + (60 + (i * 53) % 90) + 'px"></i>';
    el.innerHTML = '<div class="elfb-glow"></div><div class="elfb-ring"></div><div class="elfb-ring r2"></div><div class="elfb-parts">' + parts + '</div>' +
        '<div class="elfb-mark">' + ELF_SVG[c] + '</div><div class="elfb-txt">忽然全身充滿了' + a[1] + '的靈力。</div>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
}
// 魔法商人（npc 81353～81363，倫德羅、梅貝勒…各村一位，L1Merchant）：說話時伺服器回 bs_01（對話檔在加密檔）→ 網頁畫兩組：
//   C_NPCAction 'a'＝共同六種＋火焰武器、'b'＝共同六種＋風之神射（伺服器 web/WebBuffShop）；成功回 bs_done、金幣不夠回 bs_adena
//   第 127 項（站長 2026-10-23「介面做精緻一點，價格調整為 1 萬」）：
//   - 價錢、各增益幾秒照伺服器（bs_01／bs_done／bs_adena 帶的資料：[價錢, 共同「編號:秒,…」, a 多加的, b 多加的]）；
//     說話時 npcaction 表回的 bs_01 沒資料 → 送一次 "0" 要帶資料的 bs_01。舊伺服器沒給：價錢先顯示 BS_PRICE、秒數照 skills.json 的 dur
//   - 共同六種一格一個（技能圖示、名字、一句效果、持續時間）；多加的兩種做成卡片，選一張再按「購買」；金幣不夠按鈕變灰、寫還差多少
//   - 買好了：格子亮一下、上面寫「已施加」（角色身上的效果圖是伺服器照原版播的，TYPE_GMBUFF）
const BS_HTML = new Set(['bs_01', 'bs_done', 'bs_adena']), BS_PRICE = 10000;
// [技能編號, 名字, 一句效果]：效果照 data/skills.json 的 effect（伺服器實際算的），寫成「身上有這個效果時」的說法
const BS_COMMON = [[43, '加速術', '攻擊、移動、施法速度約 ×1.33'], [79, '靈魂昇華', '最大 HP、MP 各 +20%'], [151, '大地防護', '防禦 −6'],
    [158, '生命之泉', 'HP 自然回復每次 +15'], [160, '水之防護', '被弓箭攻擊的迴避率 +5%'], [115, '鋼鐵士氣', '防禦 −8']];
// [動作, 技能編號, 名字, 效果, 卡片顏色]
const BS_SETS = [['a', 148, '火焰武器', '近戰傷害 +4', 'f'], ['b', 149, '風之神射', '遠程命中 +6', 'a']];
const bsInfo = { price: null, dur: {} };   // 伺服器給過的（換 NPC、重開視窗都還在）
const bsDurText = s => !(s > 0) ? '' : s % 60 === 0 ? (s / 60) + ' 分鐘' : s < 60 ? s + ' 秒' : Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒';
// 金幣、時鐘、勾勾的小圖（跟著文字顏色）
const BS_SVG = {
    clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.4V8l2.6 1.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.4l3 3 6.6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// 城堡侍從長：城主跟自己城堡的侍從長說話時伺服器回的對話（L1MerchantInstance；一般成員、外人是 …6、…7，不給調稅率）
// 旅館老闆（各村一隻，L1Merchant；伺服器 npcaction 表 normal_action inn、caotic_action Inn1）：原版對話檔在加密檔，網頁照伺服器回的對話檔名開「旅館」分頁。
//   租：按了送 C_NPCAction room → 伺服器 S_HowManyKey 問幾把（main.js inputAmount → innAmount 回這裡填的把數，C_Amount）
//     → 成功回 inn4（鑰匙在背包）、金幣不夠 inn3、背包已經有這間的鑰匙 inn5（伺服器第 154 項起鑰匙可以刪除，刪了就能再租）、沒空房 inn6、剛被搶走回空的對話檔。價錢 2000（原版 300，站長 2026-10-23 改；伺服器 web/WebInn.PRICE），這裡只是顯示、先擋金幣不夠的。
//   第 138 項補二（站長 2026-10-23 改定）：會議廳暫不開放、不能退租（鑰匙到期就作廢）→ 不畫這兩顆（伺服器收到 hall／return 也擋）；
//     鑰匙在哪裡都能用（回家卷軸不能用的地方、戰鬥中不行），伺服器擋的時候回一句系統訊息（聊天框）。inn15／inn16／inn10／inn20 留著接舊伺服器
//   一次只租 1 把：原版一次能買 1～8 把分給同伴同住，但網頁版不能丟地上、沒有玩家交易，多的鑰匙給不出去、只會多花錢
//   進房間：背包點鑰匙「使用」（伺服器 web/WebInn）。亞丁的史斌、海賊島的米列沒有房間（伺服器也不給租），INN_NOROOM 照名字認
const INN_HTML = new Set(['inn', 'Inn1']), INN_NOROOM = new Set(['史斌', '米列']), INN_PRICE = 10000;   // 站長 2026-10-24 改一萬（之前 500，鑰匙用一次；伺服器 web/WebInn.PRICE）
const INN_MSG = { inn4: '租好了，鑰匙在背包裡', inn3: '金幣不夠（要 ' + INN_PRICE.toLocaleString() + ' 金幣）', inn5: '背包裡已經有這間的鑰匙，點鑰匙「使用」就能進房間', inn6: '現在沒有空房', inn15: '你已經租了會議廳', inn16: '現在沒有空的會議廳', inn10: '只有王族能租會議廳' };
// 派報少年（npc 81307，各大村一隻）：上面是他剛說過的（頭上的字一閃就過，點他再看一次），下面是他會說的全部。舊伺服器回的 newsboy 沒資料＝照舊「沒有可用的功能」
const NEWS_HTML = 'newsboy';
// 第 407 項：慾望洞穴大廳四扇次元之門（土 80059、風 80060、水 80061、火 80062；伺服器 web/WebElementDoor）。原版靠用戶端對話檔 wpass01～14 畫選項，網頁沒有 → 照伺服器回的對話檔自己畫，
//   按鈕跟恢復神女同一套（data-gd → C_NPCAction）。說話、按了之後伺服器回目前狀態的對話檔，後面帶 [這個元素的印記有幾個, 換支配者要幾個, 已有幾個支配者, 屬性 1 土／2 火／4 水／8 風]
//   （舊伺服器沒帶：不寫數字）：
//   wpass05 什麼都沒有：拿通行證（b）；wpass08 有印記沒通行證：拿通行證（b；印記已經夠了伺服器拿到就直接換支配者 → 按鈕寫「交換」）；
//   wpass03 有通行證、印記不夠：印記 x／y、進入領域（a）、放棄（c）→ wpass07 確定（f：丟通行證＋這個元素的印記）／取消（e：伺服器回空的＝關掉，網頁回到放棄前的畫面）；
//   wpass06 剛換到支配者、wpass11～14 已有這個元素的支配者、wpass02 有元素之支配者：進入（a）；wpass04 拿著別的元素的通行證：沒按鈕，說要到那扇門放棄；cpass03 炎魔友好：不能用
//   四扇名字都是 $4641，靠外型分；同名同外型的 $4641|5460 是風木沙漠的次元之門（傳送，data/npcfn.json）和炎魔房間的門，不是這四扇
const DOOR_KEY = { '$4641|5457': 1, '$4641|5458': 8, '$4641|5459': 4, '$4641|5456': 2 };
// 屬性 → [字, ELF_SVG 字尾, 通行證圖, 印記圖, 支配者圖, 領域]（圖＝道具表 40909～40920 的 invgfx；領域＝地圖 607／605／604／606 的名字）
const DOOR_EL = { 1: ['土', 'e', 681, 676, 686, '地之領域'], 2: ['火', 'f', 680, 675, 685, '火之領域'], 4: ['水', 'w', 683, 678, 688, '水之領域'], 8: ['風', 'a', 684, 679, 689, '風之領域'] };
const DOOR_HTML = /^(wpass0[2-8]|wpass1[1-4]|cpass03)$/;
// 傳送的等級限制 [低, 高]（gen-data：Teleporter.xml 的 LevelMin／LevelMax，沒寫＝1／99）→ 標籤字，寫法同狩獵場（hud.js lvTxt）
const lvTag = lv => lv[0] === lv[1] ? 'Lv' + lv[0] : lv[1] >= 99 ? 'Lv' + lv[0] + ' 以上' : lv[0] <= 1 ? 'Lv' + lv[1] + ' 以下' : 'Lv' + lv[0] + '～' + lv[1];
const GODDESS = new Set(['恢復神女', '經驗恢復神女', '贖罪的神女']);   // 第 305 項：主城那隻改名經驗恢復神女（舊名留著：伺服器重開前還是舊名）
const BUILD_NPC = '主城建設官';   // 主城建設捐獻（伺服器第 253 項；第 255 項起奇岩那隻村莊福利員改叫主城建設官）
const LORD_HTML = new Set(['ishmael1', 'seghem1', 'othmond1', 'orville1', 'fisher1', 'potempin1', 'timon1', 'olle1']);
const CASTLE_NAME = ['', '肯特城', '妖魔城', '風木城', '奇岩城', '海音城', '侏儒城', '亞丁城', '狄亞得要塞'];
// 標價 price 的商品玩家實付多少：同伺服器 L1TaxCalculator（第 120 項）——城稅 0＝戰爭稅、村莊固定 2% 都不收；城稅不是 0＝城稅＋村莊稅＋戰爭稅一起算、無條件捨去
export function taxPay(price, rate, town, war) {
    const t = rate > 0 ? town : Math.max(0, town - 2), w = rate > 0 ? war : 0;
    return price + Math.floor((price * rate + price * t + price * w) / 100);
}
const taxParts = (r, t) => r > 0 ? '城稅 ' + r + '%＋村莊稅 ' + t.town + '%＋戰爭稅 ' + t.war + '%' : '不收稅';
const isGold = p => /^\$4\b/.test(p.it.name || '') || p.base === '金幣';
// 寵物保管員：領一次多少（只是顯示；真正扣多少是伺服器 web/WebPetKeeper.PRICE）
const KEEPER = '寵物保管員', KEEP_PRICE = 1000;
// 寵物商的頭像：同夥伴視窗（單機版動作圖裁掉透明邊，look.js trimImage）；還沒裁好、沒有動作圖的先放項圈
const COLLAR = '/assets/icons/items/' + encodeURIComponent('項圈 (牧羊犬).png');
const petPics = new Map();   // 動作圖網址 → 裁好的 dataURL（'' ＝裁不出來）
// 倉庫圖示（同單機版 js/12 _WHX_SVG）
const SVG = {
    chest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v1H3z"/><path d="M3 12.5h7v2.5h4v-2.5h7V20H3z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4.5a3 3 0 0 1 6 0V6h-1.6V4.5a1.4 1.4 0 0 0-2.8 0V6H9z"/><path d="M5 11a4.5 4.5 0 0 1 4.5-4.5h5A4.5 4.5 0 0 1 19 11v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20zm3 3.5v3h8v-3z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3h3v7.5h3.5L12 16l-5-5.5h3.5z"/><path d="M3 14h3v4h12v-4h3v7H3z"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l5 5.5h-3.5V15h-3V7.5H7z"/><path d="M3 14h3v4h12v-4h3v7H3z"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l9 4.5-9 4.5-9-4.5z"/><path d="M3 8.2l8 4v9.6l-8-4zM21 8.2l-8 4v9.6l8-4z"/></svg>',
    log: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2.5h11l3.5 3.5v15.5H5zM8 8v2h8V8zm0 4v2h8v-2zm0 4v2h5v-2z" fill-rule="evenodd"/></svg>',   // 第 112 項 血盟倉庫紀錄
};
const CATS = [['all', '全部'], ['w', '武器'], ['a', '防具'], ['e', '道具']];
const catOf = p => (p.tpl && (p.tpl.k === 'w' || p.tpl.k === 'a')) ? p.tpl.k : 'e';
// 倉庫那邊的疊法：伺服器沒給道具表編號（parseItem 認不出是不是裝備），單件（數量 1）而且 stackKey 一樣的就疊——取出照樣一件一件送（pairsOf），疊錯也只是顯示
function whStacks(list) {
    const out = [], by = new Map();
    for (const p of list) {
        if ((p.count || 1) !== 1) { out.push({ p, items: [p] }); continue; }
        const k = stackKey(p);
        let s = by.get(k);
        if (!s) { s = { p, items: [] }; by.set(k, s); out.push(s); }
        s.items.push(p);
    }
    return out;
}

export function createNpcUi(cb) {
    // cb：items()（背包 parseItem 過的，不含金幣）、goldItem()（背包裡的金幣那一疊，parseItem 過）、icon(名字)、action(npc, 字串)、result(npc, 種類, [[編號, 數量]])、level()、gold()、
    //     craftReq(npc, 動作清單)（C_Web 15）、craftMake(npc, 動作, 數量)（C_Web 16）：沒給就照舊只走 C_NPCAction；
    //     寵物保管員：pets()（{ cols: 項圈清單, ext: 伺服器回過沒（null＝還沒）, comps: 叫出來的寵物 }）、askPets()（要項圈清單）、stash(寵物編號)（寄放）
    let win = null, st = null, openAt = -1e9;   // openAt：打開的時間（點畫面上的 NPC 開的，手指放開後瀏覽器補的那下 click 會落在剛蓋上來的底色上）

    function ensureWin() {
        if (win) return;
        win = document.createElement('div');
        win.id = 'npc-window';
        win.hidden = true;
        win.innerHTML = '<div class="npw-panel" role="dialog"><div class="npw-head"><img class="whx-chest" src="/assets/ui/wh-chest.webp" alt="">' +
            '<div class="npw-heading"><h3 class="npw-name"></h3><span class="npw-title"></span><span class="npw-goldh"></span></div>' +
            '<button type="button" class="npw-close">關閉</button></div><div class="npw-body"></div></div>';
        win.addEventListener('click', onClick);
        // 第 122 項 稅率拉條：拖的時候只改數字和實付（不整個重畫，拉條才不會斷）
        win.addEventListener('input', e => {
            if (!e.target.classList.contains('tax-range') || !st || !st.tax) return;
            st.taxPick = +e.target.value;
            const box = e.target.closest('.tax-box'), t = st.tax;
            box.querySelector('.tax-val b').textContent = st.taxPick;
            box.querySelector('.tax-pay b').textContent = taxPay(100, st.taxPick, t.town, t.war);
            box.querySelector('.tax-parts').textContent = taxParts(st.taxPick, t);
            box.querySelectorAll('.tax-step').forEach(x => { x.disabled = x.dataset.tax === '-1' ? st.taxPick <= t.min : st.taxPick >= t.max; });
        });
        win.addEventListener('input', e => { if (e.target.classList.contains('npw-qty') || e.target.id === 'wh-gold-amt') e.stopPropagation(); });
        // 數量框一點進去就全選：直接打數字蓋掉原本的 1，不用先刪
        win.addEventListener('focusin', e => { if (e.target.classList.contains('npw-qty')) setTimeout(() => { try { e.target.select(); } catch (_) { /* 選不了就算了 */ } }, 0); });
        document.body.appendChild(win);
    }
    // src：parseItem 過的道具或 { name, gfx }（icons.js 一定給得出圖）；身上／倉庫的道具帶祝福／詛咒／屬性光效（items.js glowCls）
    const icon = src => { const ic = cb.icon(src), g = src && src.it ? glowCls(src) : ''; return ic ? '<img' + (g ? ' class="' + g + '"' : '') + ' src="' + esc(ic) + '" alt="">' : ''; };
    // 點道具圖示（或名字）看道具資訊（iteminfo.js）：data-info＝「b 第幾筆」買、「s 第幾疊」賣、「m 道具編號」製作的成品／材料。買、賣、製作照原本那一列的按鈕
    const infoBtn = (key, inner, cls) => cb.info ? '<button type="button" class="' + cls + ' npw-info" data-info="' + key + '" aria-label="道具資訊">' + inner + '</button>' : '<div class="' + cls + '">' + inner + '</div>';
    function infoOf(key) {
        const k = key[0], v = key.slice(1);
        if (k === 'b') { const x = (st.buy || [])[+v]; return x ? infoItem({ name: x.name }) : null; }
        if (k === 's') { const g = (st.sellGroups || [])[+v]; return g ? g.p : null; }
        if (k === 'm') { const t = (NPCMAKE.items || {})[v]; return t ? infoItem({ name: t[0], nid: t[1], bless: t[3], id: +v }) : null; }
        return null;
    }

    function open(npc) {
        ensureWin();
        unlockClanWh();
        const fn = NPCFN[npc.key + '@' + npc.map] || NPCFN[npc.key] || {}, mk = NPCMAKE.npc[npc.key] || null;   // 「鍵@地圖」：同名同外型、不同地圖功能不一樣的（gen-data，第 407 項）
        const views = [];
        if (fn.shop && fn.shop.buy) views.push(['buy', '買']);
        if (fn.shop && fn.shop.sell) views.push(['sell', '賣']);
        if (fn.pet) views.push(['pet', '寵物']);
        if (npc.title === KEEPER && cb.pets) views.push(['keep', '寵物']);
        if (fn.tele) views.push(['tele', '傳送']);
        if (mk) views.push(['make', '製作']);
        // 血盟執行人（各村一隻，L1Merchant）：原版靠加密對話檔開血盟功能；網頁照名字認，功能在 clan.js
        if (cb.clan && npc.name === CLAN_NPC) views.unshift(['clan', '血盟']);
        if (npc.name === ELF_NPC) views.unshift(['elf', '精靈屬性']);
        // 恢復神女（伺服器第 249 項，主城；樣板照抄贖罪的神女）、各村的贖罪的神女：原版對話檔 restore1pk 網頁沒有 → 自己做兩顆鈕（C_NPCAction exp／pk）
        if (GODDESS.has(npc.name)) views.unshift(['goddess', '恢復']);
        // 伺服器第 677 項（站長 2026-11-05「不完整的航海日誌直接在巴克休販賣就好了」）：日誌改跟深海巴克休買，這裡不再放「領取」分頁（伺服器 A 動作還在）
        if (DOOR_KEY[npc.key]) views.unshift(['door', '次元之門']);   // 第 407 項：伺服器回對話檔（serverHtml）之前先寫讀取中
        if (npc.name === BUILD_NPC && cb.build) { views.unshift(['build', '建設']); cb.buildAsk(); }
        st = { npc, fn, mk, views, view: fn.dwarf ? 'wh' : views.length ? views[0][0] : 'none', buy: null, sell: null, noSell: false,
            wh: null, whTab: 'wh', whCat: 'all', waiting: false, whSrc: 'me', cwh: null, cwhLock: false, whMsg: '', pend: null, mkMsg: [], elfSure: false, elfPick: null, elfNew: 0, bsMsg: '', bsOk: false, bsPick: null, bsPend: 0, bsFresh: 0, bsAsked: false,
            srv: null, srvAsk: 0, mkWeb: 0, petMsg: [], petAt: 0, tax: null, taxPick: 0, taxSure: false, taxSent: null, taxMsg: '', shopTax: 0, innMsg: '', innOk: false, innPend: null, doorAttr: DOOR_KEY[npc.key] || 0, door: null, doorBack: null };   // door：次元之門目前的狀態（serverHtml）、doorBack：按「放棄」之前的（取消時回去）   // innPend：旅館按了租 { act, n, at }   // petAt：按了寵物「購買」的時間（之後 5 秒的伺服器訊息寫進 petMsg）   // srv＝伺服器算好的配方狀態（S_Web 18）：{ wh, byAct: 動作 → { cond, flags, max, mats, lack } }；mkWeb＝按了「製作」（C_Web 16）的時間
        const wh = st.view === 'wh';   // 倉庫：標題照單機版（寶箱＋「倉庫」＋紅色 ✕）
        win.querySelector('.npw-name').textContent = wh ? '倉庫' : npc.name;
        win.querySelector('.npw-title').textContent = npc.title && !wh ? '（' + npc.title + '）' : '';
        win.querySelector('.npw-close').textContent = wh ? '✕' : '關閉';
        win.querySelector('.npw-close').setAttribute('aria-label', '關閉');
        win.classList.toggle('wh', wh);
        win.hidden = false; openAt = performance.now();
        if (st.view === 'buy' || st.view === 'sell') request(st.view);
        if (st.view === 'wh' && cb.level() >= 5) whReq();
        if (st.view === 'make') askCraft();
        if (st.view === 'keep') cb.askPets();
        if (st.view === 'elf' && cb.learnList) cb.learnList();   // 第 117 項：自己的屬性、去除精靈力的價錢（S_Web 35）
        render();
    }
    function request(action) { st.waiting = true; cb.action(st.npc.id, action); }
    // 製作分頁：跟伺服器要這隻每個配方的狀態（同製作工匠；還沒回來前 3 秒內不重複要）
    function askCraft(force) {
        if (!st || !st.mk || !cb.craftReq) return;
        const now = performance.now();
        if (!force && now - st.srvAsk < 3000) return;
        st.srvAsk = now;
        cb.craftReq(st.npc.id, [...new Set(st.mk.map(r => r.a))].slice(0, 200));
    }
    function close() { unlockClanWh(); if (win) win.hidden = true; st = null; }
    // 血盟倉庫：打開清單時伺服器把倉庫鎖給自己（別的成員打不開），不看了就解（原版關掉清單送 C_Result 5、0 筆）
    function unlockClanWh() { if (st && st.cwhLock) { st.cwhLock = false; cb.result(st.npc.id, 5, []); } }
    const whReq = () => request(st.whSrc === 'clan' ? 'retrieve-pledge' : 'retrieve');

    function render() {
        if (!win || win.hidden || !st) return;
        const body = win.querySelector('.npw-body'), top = body.scrollTop;
        win.querySelector('.npw-goldh').innerHTML = st.view === 'wh' ? '' : goldIcon() + cb.gold().toLocaleString();   // 同單機版：標題列帶身上金幣（倉庫有自己的金幣列）
        // 好幾種功能：上面一排分頁（倉庫有自己的版面，不進分頁）
        let h = st.view !== 'wh' && st.views.length > 1 ? '<div class="whx-tabs npw-tabs">' + st.views.map(([v, t]) =>
            '<button type="button" class="' + (st.view === v ? 'on' : '') + '" data-view="' + v + '">' + t + '</button>').join('') + '</div>' : '';
        if (st.view === 'buy' || st.view === 'sell') h += shopHtml();
        else if (st.view === 'wh') h += whHtml();
        // 傳送：同狩獵場的一行一個（站長 2026-10-25「傳送師 NPC 的介面使用狩獵場的風格」）：整行可以點、名字在左、價錢在右（金幣圖示＋數字）
        //   有等級限制的（第 407 項，例：風木沙漠的次元之門 45 級以上）名字下面標等級，等級不符的變灰按不下去（伺服器不傳、也不回話）；
        //   要交道具的（第 408 項，例：真．冥皇丹特斯交死亡騎士之印記）右邊寫道具＋個數（不夠伺服器說「○○不足」）
        else if (st.view === 'tele') h += '<div class="npw-tps">' + st.fn.tele.map(([act, dest, price, lv, it], i) => {
            const ok = !lv || (cb.level() >= lv[0] && cb.level() <= lv[1]);
            const cost = (price ? goldIcon() + price : '') + (it ? '<span class="npw-tpit">' + icon({ name: it[0], gfx: it[1] }) + esc(it[0]) + '×' + it[2] + '</span>' : '');
            return '<button type="button" class="lm-row lm-tpr npw-tpr" data-tp="' + i + '"' + (ok ? '' : ' disabled') + '><span class="lm-rn"><b><span>' + esc(dest) + '</span></b>' +
                (lv ? '<span class="lm-tgs"><i class="lm-tg ' + (ok ? 'lv' : 'warn') + '">' + lvTag(lv) + '</i></span>' : '') + '</span><em>' + (cost || '免費') + '</em></button>';
        }).join('') + '</div>';
        else if (st.view === 'make') h += makeHtml();
        else if (st.view === 'pet') h += petHtml();
        else if (st.view === 'keep') h += keepHtml();
        else if (st.view === 'clan') h += cb.clan.npcHtml();
        else if (st.view === 'elf') h += elfHtml();
        else if (st.view === 'bs') h += bsHtml();
        else if (st.view === 'castle') h += castleHtml();
        else if (st.view === 'inn') h += innHtml();
        else if (st.view === 'news') h += newsHtml();
        else if (st.view === 'goddess') h += goddessHtml();
        else if (st.view === 'door') h += doorHtml();
        else if (st.view === 'build') h += buildHtml();
        else h += '<div class="npw-empty">這位 NPC 目前沒有可用的功能</div>';
        body.innerHTML = h;
        body.scrollTop = top;
        taxConfirm();
        if (st.view === 'pet' || st.view === 'keep') trimPetPics(body);
    }

    // ── 派報少年（第 148 項）：剛說過的、全部 ──
    // 恢復神女：恢復經驗值（價錢照原版 C_NPCAction exp；伺服器回 738 問要不要花多少金幣，main.js 跳確認）
    // 主城建設（伺服器第 253 項 web/WebBuild）：進度條、加成剩多久、捐獻（先選金額再按捐獻）、本週貢獻榜前 10
    // 主城建設（伺服器第 253 項 web/WebBuild）。站長 2026-10-26「建設的視窗用精緻一點」：
    //   上方金框徽章（城堡，同頭上圖示 npcmark build）＋第幾期；進度條有光澤、條上寫百分比；加成中＝綠色發光卡＋倒數，沒有＝寫捐滿有什麼；
    //   捐獻：自己打金額（最少 d.min），不合的寫在上面（st.buildMsg）；貢獻榜前三名金銀銅牌、自己那行標亮
    function buildHtml() {
        const d = cb.build(); if (!d) return '<div class="npw-empty">讀取中…</div>';
        const w = n => n >= 10000 && n % 10000 === 0 ? (n / 10000).toLocaleString() + '萬' : n.toLocaleString();
        const pct = Math.min(100, Math.floor(d.fund / d.goal * 100)), left = d.until > performance.now() ? Math.ceil((d.until - performance.now()) / 60000) : 0;
        const me = d.me || '', medal = ['gold', 'silver', 'bronze'];
        const leftTxt = (left >= 60 ? Math.floor(left / 60) + ' 小時 ' : '') + (left % 60) + ' 分';
        return '<div class="bd-build">' +
            '<div class="bd-hero"><span class="bd-emb">' + npcIconSvg('build') + '</span><div class="bd-ht"><b>奇岩建設</b><small>第 ' + (d.done + 1) + ' 期・全服一起捐獻</small></div></div>' +
            '<div class="bd-prog"><div class="bd-bar"><i style="width:' + pct + '%"></i><span>' + pct + '%</span></div><div class="bd-num">' + goldIcon() + '<b>' + w(d.fund) + '</b> ／ ' + w(d.goal) + '</div></div>' +
            (left > 0 ? '<div class="bd-perk on"><b>全服經驗 +' + d.pct + '%</b><span>還有 ' + leftTxt + '</span></div>'
                : '<div class="bd-perk"><b>捐滿全服經驗 +' + d.pct + '%</b><span>持續 ' + d.hours + ' 小時</span></div>') +
            (st.buildMsg ? '<div class="bd-msg" role="status">' + esc(st.buildMsg) + '</div>' : '') +
            '<div class="bd-in"><span class="bd-coin">' + goldIcon() + '</span><input type="text" inputmode="numeric" class="bd-amt" maxlength="13" placeholder="捐獻金額（最少 ' + w(d.min) + '）" autocomplete="off"><button type="button" class="bd-go" data-bgo="1">捐獻</button></div>' +
            '<div class="bd-rank"><div class="bd-rh"><b>本週貢獻榜</b>' + (d.mine ? '<em>我捐了 ' + w(d.mine) + '</em>' : '') + '</div>' +
            (d.top.length ? '<ol>' + d.top.map((t, i) => '<li class="' + (medal[i] || '') + (t.name === me ? ' me' : '') + '"><i>' + (i + 1) + '</i><span>' + esc(t.name) + '</span><b>' + w(t.amount) + '</b></li>').join('') + '</ol>'
                : '<div class="bd-none">這週還沒有人捐，第一個就是你</div>') + '</div></div>';
    }
    // ── 次元之門（第 407 項）：上面屬性意象＋領域名，下面照伺服器回的狀態（對話檔＋印記數）畫一兩列＋按鈕；
    //   按鈕跟航海士、恢復神女同一套（data-gd → C_NPCAction），伺服器回新的狀態再重畫（serverHtml）。舊伺服器沒帶印記數：不寫數字 ──
    function doorHtml() {
        const d = st.door, [el, c, gPass, gSeal, gRuler, land] = DOOR_EL[d && DOOR_EL[d.attr] ? d.attr : st.doorAttr];
        // 上面的徽章借艾利溫選屬性的那套（elf-crest、elf-c-* 顏色）
        const wrap = s => '<div class="dr elf-c-' + c + '"><div class="elf-crest"><span class="elf-mk">' + ELF_SVG[c] + '</span><b>' + land + '</b></div>' + s + '</div>';
        if (!d) return wrap('<div class="npw-empty">讀取中…</div>');
        const pass = el + '之通行證', seal = el + '之印記', ruler = el + '之支配者', known = d.need > 0;
        const btn = (act, t, cls) => '<button type="button" class="npw-btn' + (cls ? ' ' + cls : '') + '" data-gd="' + act + '">' + t + '</button>';
        const row = (name, gfx, sub, b) => '<div class="npw-row"><div class="npw-ic">' + icon({ name, gfx }) + '</div><div class="npw-main"><span class="npw-nm">' + name + '</span>' +
            (sub ? '<span class="npw-price">' + sub + '</span>' : '') + '</div>' + (b ? '<div class="npw-ctl">' + b + '</div>' : '') + '</div>';
        const list = (...rows) => '<div class="npw-list">' + rows.join('') + '</div>';
        const seals = known ? row(seal, gSeal, '<span class="dr-cnt' + (d.seals >= d.need ? ' ok' : '') + '">' + d.seals + '／' + d.need + '</span>') : '';
        const go = '<div class="dr-go">' + btn('a', '進入' + land) + '</div>';
        const note = t => '<div class="npw-empty dr-note">' + t + '</div>';
        switch (d.html) {
            case 'cpass03': return wrap(note('和炎魔友好的人不能使用次元之門'));
            case 'wpass04': { const o = doorOtherPass(el); return wrap(note(o ? '身上有' + o + '之通行證：先到' + o + '的次元之門放棄，才能拿這扇的' : '身上有別的元素的通行證：先到那扇次元之門放棄，才能拿這扇的')); }
            case 'wpass05': return wrap(list(row(pass, gPass, '進' + land + '收集' + (known ? ' ' + d.need + ' 個' : '') + seal + '，回來換' + ruler, btn('b', '拿通行證'))));
            case 'wpass08': return wrap(list(seals, known && d.seals >= d.need ? row(ruler, gRuler, '用 ' + d.need + ' 個' + seal + '換', btn('b', '交換'))
                : row(pass, gPass, '進' + land + (known ? '再收集 ' + (d.need - d.seals) + ' 個' : '收集') + seal, btn('b', '拿通行證'))));
            case 'wpass03': return wrap(list(seals, row(pass, gPass, '印記收集夠了回來這裡，換' + ruler)) + go + '<div class="dr-quit">' + btn('c', '放棄通行證', 'dr-q') + '</div>');
            case 'wpass07': return wrap('<div class="dr-cf"><b>放棄' + pass + '？</b><p>通行證' + (!known ? '和身上的' + seal + '都' : d.seals > 0 ? '和身上 ' + d.seals + ' 個' + seal + '都' : '') + '會丟掉。要改拿別的元素的通行證才需要放棄。</p>' +
                '<div class="dr-cf-btns">' + btn('e', '取消') + btn('f', '確定放棄', 'dr-danger') + '</div></div>');
            case 'wpass06': return wrap('<div class="npw-mkmsg inn-ok" role="status">換到' + ruler + '了</div>' + list(row(ruler, gRuler, '')) + go);
            case 'wpass02': return wrap(list(row('元素之支配者', 1464, '已擁有')) + go);
            default: return wrap(list(row(ruler, gRuler, '已擁有')) + go);   // wpass11～14
        }
    }
    // 身上別的元素的通行證（wpass04 說要去哪一扇放棄）：背包道具名「○之通行證」；讀不到背包就不寫是哪一種
    function doorOtherPass(el) {
        try { for (const p of cb.items()) { const m = /([土水火風])之通行證/.exec(p.base || p.full || ''); if (m && m[1] !== el) return m[1]; } } catch (e) { /* 照沒有 */ }
        return '';
    }
    function goddessHtml() {
        const row = (act, name, sub, btn) => '<div class="npw-row"><div class="npw-main"><span class="npw-nm">' + name + '</span><span class="npw-price">' + sub + '</span></div>' +
            '<div class="npw-ctl"><button type="button" class="npw-btn" data-gd="' + act + '">' + btn + '</button></div></div>';
        // 站長 2026-10-26「恢復經驗就好了 金額照原廠設定」：贖罪不放。第 305 項「可以選金幣恢復 藍鑽恢復」：藍鑽＝伺服器 WebExpRestore（C_NPCAction expd），按了伺服器回價錢再確認
        return row('exp', '金幣恢復', '拿回上次死亡損失的經驗值', '恢復') + row('expd', '藍鑽恢復', '', '恢復');
    }
    function newsHtml() {
        const n = st.news, li = a => a.map(t => '<li>' + esc(t) + '</li>').join('');
        return '<div class="nb">' + (n.recent.length ? '<div class="nb-sec">剛剛說的</div><ul class="nb-list nb-recent">' + li(n.recent) + '</ul>' : '') +
            '<div class="nb-sec">全部（' + n.all.length + '）</div><ol class="nb-list">' + li(n.all) + '</ol></div>';
    }

    // ── 旅館（第 138 項）：房間鑰匙＋「租房間」；結果寫在最上面（會議廳、退租第 138 項補二起不開放） ──
    function innHtml() {
        const msg = st.innMsg ? '<div class="npw-mkmsg npw-stick' + (st.innOk ? ' inn-ok' : '') + '" role="status">' + esc(st.innMsg) + '</div>' : '';
        if (INN_NOROOM.has(st.npc.name)) return msg + '<div class="npw-empty">這間旅館沒有房間可以租</div>';
        const key = icon({ name: '旅館鑰匙', gfx: 59 });   // 59＝鑰匙的背包圖（etcitem invgfx）
        const row = (act, name, btn) => '<div class="npw-row"><div class="npw-ic">' + key + '</div><div class="npw-main"><span class="npw-nm">' + name + '</span>' +
            '<span class="npw-price">' + INN_PRICE.toLocaleString() + ' 金幣・鑰匙用一次</span></div>' +
            '<div class="npw-ctl"><button type="button" class="npw-btn" data-inn="' + act + '">' + btn + '</button></div></div>';
        // 房間裡回魔的好處寫在最上面（站長 2026-10-24「旅館回魔的優勢 想辦法讓玩家知道」；伺服器第 158 項：6 秒一次；第 734 項：每次多回魔力 3、體力照舊 5）
        return msg + '<div class="inn-perk"><b>房間裡回魔 6 秒一次</b><span>每次多回魔力 3、體力 5</span></div>' +
            // 背包已經有旅館鑰匙：不放「租房間」（站長 2026-10-24「租房間之後就不要有租房間按鈕了」；伺服器也只在沒有這間的鑰匙時才給租）
            // 第 448 項（經營者檢查 2026-10-29「背包有任何鑰匙——過期、別間的也算——就藏按鈕」）：改照伺服器說的「這間、還能開門的鑰匙」（st.innKey）
            (hasKey() ? '<div class="npw-empty inn-has">背包裡有這間的鑰匙，點鑰匙「使用」就能進房間</div>' :
            '<div class="npw-list">' + row('room', '房間鑰匙', '租房間') + '</div>' +
            '<div class="npw-empty inn-tip">在背包點鑰匙「使用」，在哪裡都能直接進房間；進去就用掉，要再進來再租一把</div>');
    }
    // 這間有沒有還能開門的鑰匙：伺服器說話時在對話檔資料帶 "1"／"0"（第 448 項，WebInn.hasKeyFor：這間的、沒到期、沒被別人租走）；
    //   剛租好（inn4）、伺服器說已經有了（inn5）＝有。舊伺服器沒帶＝不知道 → 照樣放「租房間」（真的有的話伺服器回 inn5）
    const hasKey = () => st.innKey === true;
    function innClick(b) {
        const act = b.dataset.inn, id = st.npc.id;
        st.innMsg = ''; st.innOk = false;
        if (act !== 'return' && cb.gold() < INN_PRICE) { st.innMsg = '金幣不夠（要 ' + INN_PRICE.toLocaleString() + ' 金幣）'; render(); return; }   // 不夠就不送（伺服器也會擋，回 inn3）
        st.innPend = { act, n: act === 'return' ? 0 : 1, at: performance.now() };
        cb.action(id, act);
        render();
    }

    // ── 城堡（城主）：「調整稅率」→ 伺服器回 S_TaxRate 才出現拉條；確定 → 確認視窗 → C_TaxRate ──
    function castleHtml() {
        const t = st.tax, msg = st.taxMsg ? '<div class="npw-mkmsg tax-msg" role="status">' + esc(st.taxMsg) + '</div>' : '';
        if (!t) return msg + '<div class="tax-start"><button type="button" class="npw-btn tax-go tax-open" data-tax="open">調整稅率</button></div>';
        const r = st.taxPick;
        const now = t.ext ? '<div class="tax-now"><span class="tax-castle">' + esc(CASTLE_NAME[t.castle] || '城堡') + '</span><span>現行稅率 <b>' + t.eff + '%</b></span>' +
            '<span>公庫 <b class="tax-gold">' + t.money.toLocaleString() + '</b> 金幣</span></div>' : '';
        return msg + '<div class="tax-box">' + now +
            '<div class="tax-pick"><button type="button" class="tax-step" data-tax="-1" aria-label="減少"' + (r <= t.min ? ' disabled' : '') + '>－</button>' +
            '<div class="tax-val"><b>' + r + '</b>%</div>' +
            '<button type="button" class="tax-step" data-tax="1" aria-label="增加"' + (r >= t.max ? ' disabled' : '') + '>＋</button></div>' +
            '<input type="range" class="tax-range" min="' + t.min + '" max="' + t.max + '" step="1" value="' + r + '" aria-label="稅率">' +
            '<div class="tax-scale"><span>' + t.min + '%</span><span>' + t.max + '%</span></div>' +
            '<div class="tax-pay"><span>標價 100 的商品，玩家實付</span><b>' + taxPay(100, r, t.town, t.war) + '</b></div>' +
            '<div class="tax-parts">' + taxParts(r, t) + '</div>' +
            '<button type="button" class="npw-btn tax-go" data-tax="ok">確定</button></div>';
    }
    // 確認視窗：疊在 NPC 視窗上（render 每次重畫完再補上）
    function taxConfirm() {
        const old = win.querySelector('.tax-ov'); if (old) old.remove();
        if (!st || st.view !== 'castle' || !st.tax || !st.taxSure) return;
        const t = st.tax, ov = document.createElement('div');
        ov.className = 'tax-ov';
        ov.innerHTML = '<div class="tax-cf" role="alertdialog" aria-label="確認稅率"><div class="tax-cf-t">稅率改為 <b>' + st.taxPick + '%</b></div>' +
            '<p>設定後立即生效：標價 100 的商品玩家要付 <span class="tax-nw"><b>' + taxPay(100, st.taxPick, t.town, t.war) + '</b> 金幣。</span></p>' +
            '<div class="tax-cf-btns"><button type="button" class="npw-btn" data-tax="no">取消</button><button type="button" class="npw-btn tax-go" data-tax="yes">確定</button></div></div>';
        win.querySelector('.npw-panel').appendChild(ov);
    }
    let taxWait = 0;
    function taxClick(v) {
        const t = st.tax;
        if (v === 'open') { st.taxMsg = ''; cb.action(st.npc.id, 'tax'); render(); return; }
        if (!t) return;
        if (v === '-1' || v === '1') { st.taxPick = Math.max(t.min, Math.min(t.max, st.taxPick + +v)); render(); return; }
        if (v === 'ok') { st.taxSure = true; render(); return; }
        if (v === 'no') { st.taxSure = false; render(); return; }
        if (v === 'yes') {
            st.taxSure = false; st.taxMsg = '';
            st.taxSent = { rate: st.taxPick, at: performance.now() };
            cb.taxRate(t.id, st.taxPick);
            // 伺服器設好不回話：再要一次 S_TaxRate，存好的稅率對上才算設好（taxRate 收）
            setTimeout(() => { if (st && st.taxSent) cb.action(st.npc.id, 'tax'); }, 400);
            clearTimeout(taxWait);
            taxWait = setTimeout(() => { if (st && st.taxSent) { st.taxSent = null; st.taxMsg = '沒有改成，請重新跟侍從長說話再試一次'; render(); } }, 4000);
            render();
        }
    }

    // ── 寵物保管員：收在項圈的（價錢＋領出）、在身邊的（寄放），按了的結果寫在最上面（同寵物商） ──
    function keepHtml() {
        const d = cb.pets(), msg = st.petMsg.length ? '<div class="npw-mkmsg npw-stick" role="status">' + st.petMsg.map(esc).join('<br>') + '</div>' : '';
        if (d.ext === null) return msg + '<div class="npw-empty">讀取中…</div>';
        const kept = d.cols.filter(c => c.state === 0), out = d.comps;
        if (!kept.length && !out.length) return msg + '<div class="npw-empty">背包裡沒有寵物項圈</div>';
        const row = (gfx, tname, name, lv, sub, btn) => '<div class="npw-row"><div class="npw-ic">' + petPic(gfx, tname || name) + '</div><div class="npw-main"><span class="npw-nm">' +
            esc(name) + ' <em class="npw-lv">Lv.' + lv + '</em></span>' + sub + '</div><div class="npw-ctl">' + btn + '</div></div>';
        return msg + '<div class="npw-list">' +
            kept.map(c => row(c.gfx, c.tname, c.name, c.lv, '<span class="npw-price">' + KEEP_PRICE.toLocaleString() + ' 金幣</span>',
                '<button type="button" class="npw-btn" data-keep="' + c.collar + '">領出</button>')).join('') +
            out.map(c => row(c.gfx, c.tname, c.name, c.lv, '<span class="npw-here">在身邊</span>', '<button type="button" class="npw-btn" data-stash="' + c.id + '">寄放</button>')).join('') +
            '</div>';
    }

    // ── 寵物商：一隻一列（頭像、名字、價錢、購買），按了的結果寫在最上面 ──
    function petHtml() {
        const msg = st.petMsg.length ? '<div class="npw-mkmsg npw-stick" role="status">' + st.petMsg.map(esc).join('<br>') + '</div>' : '';
        return msg + '<div class="npw-list">' + st.fn.pet.map(([act, name, price, gfx], i) =>
            '<div class="npw-row"><div class="npw-ic">' + petPic(gfx, name) + '</div><div class="npw-main"><span class="npw-nm">' + esc(name) + '</span>' +
            '<span class="npw-price">' + price.toLocaleString() + ' 金幣</span></div>' +
            '<div class="npw-ctl"><button type="button" class="npw-btn" data-pet="' + i + '">購買</button></div></div>').join('') + '</div>';
    }
    function petPic(gfx, name) {
        const u = npcPortrait(gfx, name), t = u ? petPics.get(u) : '';
        return t ? '<img src="' + esc(t) + '" alt="">' : '<img src="' + COLLAR + '" alt=""' + (u && !petPics.has(u) ? ' data-pic="' + esc(u) + '"' : '') + '>';
    }
    function trimPetPics(box) {
        box.querySelectorAll('img[data-pic]').forEach(im => {
            const u = im.getAttribute('data-pic');
            trimImage(u).then(t => { petPics.set(u, t || ''); if (t && im.isConnected) { im.src = t; im.removeAttribute('data-pic'); } });
        });
    }

    // ── 魔法商人（第 127 項）：共同六種一格一個、多加的兩種是卡片（選一張）、底下價錢＋「購買」；按了的結果（bs_done／bs_adena）寫在最上面 ──
    const bsPrice = () => bsInfo.price != null ? bsInfo.price : BS_PRICE;
    function bsDur(sid) {   // 伺服器給的秒數；沒有就照 skills.json
        if (bsInfo.dur[sid] > 0) return bsInfo.dur[sid];
        const x = (cb.skills ? cb.skills() : []).find(s => s.sid === sid);
        return x && x.dur > 0 ? x.dur : 0;
    }
    const bsIc = name => { const ic = cb.skillIcon ? cb.skillIcon(name) : ''; return ic ? '<img src="' + esc(ic) + '" alt="">' : ''; };
    const bsDu = sid => { const t = bsDurText(bsDur(sid)); return t ? '<span class="bsx-du">' + BS_SVG.clock + t + '</span>' : ''; };
    const coin = () => goldIcon('bsx-coin');   // 價錢前的金幣：同左上角那張（icons.js goldIcon）
    function bsHtml() {
        const price = bsPrice(), gold = cb.gold(), short = Math.max(0, price - gold), pend = st.bsPend && performance.now() - st.bsPend < 4000;
        const fresh = st.bsFresh && performance.now() - st.bsFresh < 2200, pick = BS_SETS.find(x => x[0] === st.bsPick);
        // 結果寫在底下購買列（按的人眼睛在那裡）；沒有結果時那一行寫選了哪一種
        const msg = st.bsMsg ? '<span class="bsx-msg' + (st.bsOk ? ' ok' : ' no') + '" role="status">' + (st.bsOk ? BS_SVG.check : '') + esc(st.bsMsg) + '</span>' : '';
        const tiles = BS_COMMON.map(([sid, n, e]) => '<div class="bsx-tile"><div class="bsx-ic">' + bsIc(n) + '</div><div class="bsx-tx"><b class="bsx-nm">' + n + '</b>' +
            '<span class="bsx-ef">' + e + '</span>' + bsDu(sid) + '</div></div>').join('');
        const cards = BS_SETS.map(([a, sid, n, e, c]) => '<button type="button" class="bsx-card bsx-c-' + c + (st.bsPick === a ? ' on' : '') + '" data-bsp="' + a + '" aria-pressed="' + (st.bsPick === a) + '">' +
            '<span class="bsx-tick">' + BS_SVG.check + '</span><span class="bsx-cic">' + bsIc(n) + '</span><b class="bsx-cn">' + n + '</b><span class="bsx-ef">' + e + '</span>' + bsDu(sid) +
            '<span class="bsx-cp">' + coin() + price.toLocaleString() + '</span></button>').join('');
        const btn = pend ? '施加中…' : short ? '還差 ' + short.toLocaleString() + ' 金幣' : pick ? '購買' : '先選一種';
        return '<div class="bsx' + (fresh ? ' fresh' : '') + '">' +
            '<div class="bsx-sec"><span>一定會加</span></div><div class="bsx-grid">' + tiles + '</div>' +
            '<div class="bsx-sec"><span>再選一種</span></div><div class="bsx-picks">' + cards + '</div>' +
            '<div class="bsx-foot"><div class="bsx-sum">' + (msg || (pick ? '<span class="bsx-what">' + bsIc(pick[2]) + '六種＋' + pick[2] + '</span>' : '')) +
            '<span class="bsx-total">' + coin() + price.toLocaleString() + ' 金幣</span></div>' +
            '<button type="button" class="npw-btn bsx-buy' + (short ? ' short' : '') + '" data-bsbuy="1"' + (pend || short || !pick ? ' disabled' : '') + '>' + btn + '</button></div></div>';
    }
    function bsBuy() {
        const pick = BS_SETS.find(x => x[0] === st.bsPick);
        if (!pick || (st.bsPend && performance.now() - st.bsPend < 4000) || cb.gold() < bsPrice()) return;
        st.bsMsg = ''; st.bsPend = performance.now();
        cb.action(st.npc.id, pick[0]);   // 扣錢、上增益都是伺服器，結果回 bs_done／bs_adena
        render();
        const me = st;
        setTimeout(() => { if (st === me && st.bsPend && performance.now() - st.bsPend >= 4000) { st.bsPend = 0; render(); } }, 4100);   // 伺服器沒回音：按鈕恢復
    }
    // ── 精靈屬性（艾利溫，第 117 項）：還沒選＝四張屬性卡（點了先看那一系的魔法，再按「選定」）；選了＝那一系的魔法清單＋去除精靈力 ──
    // 自己的屬性：伺服器給的（S_Web 35 版本 2）；舊伺服器沒給＝看學過的屬性魔法，都沒有當沒選
    function elfMine() {
        const v = cb.elfAttr ? cb.elfAttr() : null;
        if (v != null) return v;
        const s = (cb.skills ? cb.skills() : []).find(x => x.learned && x.lv >= 17 && elfByVal(x.attr));
        return s ? s.attr : 0;
    }
    const elfResetPrice = () => { const p = cb.elfReset ? cb.elfReset() : null; return p != null ? p : ELF_RESET_DEF; };
    // 那一系的屬性魔法清單（站長 2026-10-23 定案「讓玩家自己去找 NPC 學，自己消除」：艾利溫不賣，只當資訊）：
    //   圖示、名字、要幾級（照精靈水晶：skill_level 19 → 30、20 → 40、21／22 → 50；水之元氣 30）、學過沒；沒學過的寫去哪拿——
    //   商店有賣水晶的（ELF_SHOP，照 shop 表＋spawnlist_npc）寫「到○○購買」，其他「打怪取得」。生命呼喚、暴風疾走沒有精靈水晶，學過才列。照要幾級排
    const ELF_NOCRYSTAL = new Set([165, 172]);
    const ELF_SHOP = { 148: '象牙塔 1 樓的琳達', 149: '象牙塔 1 樓的琳達', 151: '象牙塔 1 樓的琳達' };   // 琳達 70060：火焰武器、風之神射、大地防護的水晶
    // 第 129 項：哪裡買照 data/spellwhere.json（主城、象牙塔都有琳達＝兩處都寫）；舊資料沒有這個檔才用上面 ELF_SHOP
    const elfShop = sid => { const w = cb.spellWhere ? cb.spellWhere(sid) : null; return w && w.length ? w.slice(0, 2).map(p => p[0] + '的' + p[1]).join('、') : ELF_SHOP[sid] || ''; };
    const elfNeed = x => x.sid === 170 ? 30 : ({ 19: 30, 20: 40, 21: 50, 22: 50 })[x.lv] || 0;
    function elfSkills(v) {
        return (cb.skills ? cb.skills() : []).filter(x => x.lv >= 17 && x.attr === v && (x.learned || !ELF_NOCRYSTAL.has(x.sid)))
            .map(x => ({ x, need: elfNeed(x) })).sort((p, q) => p.need - q.need || p.x.sid - q.x.sid);
    }
    function elfRows(v) {
        const list = elfSkills(v);
        if (!list.length) return '<div class="npw-empty">讀取中…</div>';
        return '<div class="elf-list">' + list.map(({ x, need }) => {
            const ic = cb.skillIcon ? cb.skillIcon(x.name) : '';
            const shop = x.learned ? '' : elfShop(x.sid);
            const how = x.learned ? '' : shop ? '<span class="elf-buy">到' + esc(shop) + '學習</span>' : '<span class="elf-drop">打怪取得</span>';
            return '<div class="elf-sk' + (x.learned ? ' learned' : '') + '"><div class="npw-ic">' + (ic ? '<img src="' + esc(ic) + '" alt="">' : '') + '</div>' +
                '<div class="elf-skm"><span class="npw-nm">' + esc(x.name) + '</span><span class="elf-meta">' + (need ? '<em class="npw-lv">Lv' + need + '</em>' : '') + how + '</span></div>' +
                (x.learned ? '<div class="elf-skc"><span class="elf-done">已學會</span></div>' : '') + '</div>';
        }).join('') + '</div>';
    }
    function elfHtml() {
        if (!cb.isElf()) return '<div class="npw-empty">只有妖精可以選擇屬性</div>';
        const mine = elfByVal(elfMine()), price = elfResetPrice();
        if (!mine) {
            const pick = ELF_ATTR.find(a => a[2] === st.elfPick);
            return '<div class="elf-npc"><p class="elf-tip">選一種屬性學那一系的魔法；之後要換得花 ' + price.toLocaleString() + ' 金幣。</p>' +
                '<div class="elf-cards">' + ELF_ATTR.map(([, n, c]) => '<button type="button" class="elf-card elf-c-' + c + (st.elfPick === c ? ' on' : '') + '" data-elfp="' + c + '">' +
                    '<span class="elf-mk">' + ELF_SVG[c] + '</span><span class="elf-cn">' + n + '</span></button>').join('') + '</div>' +
                (pick ? '<div class="elf-prev elf-c-' + pick[2] + '">' + elfRows(pick[3]) +
                    '<button type="button" class="npw-btn elf-go" data-elf="' + pick[0] + '">選定' + pick[1] + '屬性</button></div>' : '') + '</div>';
        }
        const fresh = st.elfNew && performance.now() - st.elfNew < 2500, short = cb.gold() < price;
        return '<div class="elf-npc elf-has elf-c-' + mine[2] + (fresh ? ' fresh' : '') + '">' +
            '<div class="elf-crest"><span class="elf-mk">' + ELF_SVG[mine[2]] + '</span><b>' + mine[1] + '屬性</b></div>' +
            elfRows(mine[3]) +
            (st.elfSure
                ? '<div class="elf-warn">學過的' + mine[1] + '屬性魔法會全部消失，要重新選、重新學。</div><div class="elf-two">' +
                    '<button type="button" class="npw-btn" data-elfx="1">取消</button>' +
                    '<button type="button" class="npw-btn elf-init danger" data-elf="init"' + (short ? ' disabled' : '') + '>' + (short ? '金幣不夠' : '花 ' + price.toLocaleString() + ' 去除') + '</button></div>'
                : '<button type="button" class="npw-btn elf-init" data-elf="init">去除精靈力<span class="npw-price">' + price.toLocaleString() + ' 金幣</span></button>') + '</div>';
    }
    function elfAct(a) {
        if (a === 'init' && !st.elfSure) { st.elfSure = true; render(); return; }
        clearTimeout(elfPend);
        elfPend = setTimeout(() => { elfPend = 0; cb.toast(a === 'init' ? '還沒有屬性，不用去除' : '已經有屬性了，要換先去除精靈力'); }, 1500);
        cb.action(st.npc.id, a);
        st.elfSure = false;   // 視窗留著：選好了換成那一系的魔法清單（elfDone）
    }

    // ── 製作：一列＝成品（圖示、名字、可做幾個）、材料（圖示、名字、有幾個／要幾個，夠綠、能先合成黃、不夠紅）、還缺的最底層材料、條件、數量＋「製作」 ──
    //   伺服器清單到了（st.srv）：照伺服器算（背包＋倉庫、可合成、還缺、可做幾個；這隻其實沒有的配方 cond 2 不列）；還沒到：照背包算
    function makeHtml() {
        const I = NPCMAKE.items || {}, inv = cb.items().filter(p => !p.equipped);
        const have = id => {
            if (+id === GOLD_ID) return cb.gold();
            const t = I[id]; if (!t) return 0;
            let n = 0;
            for (const p of inv) if ((p.nid === t[1] || p.nid === t[2]) && (p.it.bless == null || p.it.bless === t[3])) n += p.count || 1;
            return n;
        };
        const nm = id => (+id === GOLD_ID ? '金幣' : I[id] ? I[id][0] : '道具 ' + id);
        const ic = id => icon({ name: nm(id), nid: I[id] ? I[id][1] : '' });
        const msg = st.mkMsg.length ? '<div class="npw-mkmsg">' + st.mkMsg.map(esc).join('<br>') + '</div>' : '';
        const note = st.srv && !st.srv.wh ? '<p class="npw-tip">倉庫的材料要 5 級以上、沒設倉庫密碼才算得進來</p>' : '';
        return msg + note + '<div class="npw-list">' + st.mk.map((r, i) => {
            const s = st.srv && st.srv.byAct[r.a];
            if (s && s.cond === 2) return '';
            const mats = s ? s.mats.map(m => ({ id: m.id, need: m.need, h: m.inv + m.wh, wh: m.wh, st: m.st }))
                : r.m.map(([id, n]) => { const h = have(id); return { id, need: n, h, wh: 0, st: h >= n ? 0 : 2 }; });
            const can = s ? (s.cond === 0 ? s.max : 0) : Math.min(...r.m.map(([id, n]) => Math.floor(have(id) / n)));
            const multi = s ? (s.flags & 1) : r.n;
            const outs = s && s.outs.length ? s.outs.map(o => [o.id, o.n]) : r.o;
            const [oid] = outs[0];
            const outName = outs.map(([id, n]) => nm(id) + (n > 1 ? ' ×' + n.toLocaleString() : '')).join('、');
            // 沒開放的龍騎士、幻術師不寫；五職都行＝不寫（站長 2026-10-25）
            const oc = (r.c || []).filter(x => !/^(龍騎士|幻術師)$/.test(x)), cond = [oc.length && oc.length < 5 ? '限' + oc.join('、') : '', r.q ? '任務「' + r.q + '」' : '', r.lv ? (r.lv[0] === r.lv[1] ? r.lv[0] + ' 級' : r.lv[0] + '～' + r.lv[1] + ' 級') : ''].filter(Boolean).join('・');
            const mInfo = id => +id !== GOLD_ID && I[id] ? 'm' + id : '';   // 金幣不用看
            const lack = s && can < 1 && s.lack.length ? '<div class="npw-lack">還缺：' + s.lack.map(x => esc(nm(x.id)) + ' ' + x.n.toLocaleString()).join('、') + '</div>' : '';
            return '<div class="npw-row npw-mk">' + (mInfo(oid) ? infoBtn(mInfo(oid), ic(oid), 'npw-ic') : '<div class="npw-ic">' + ic(oid) + '</div>') + '<div class="npw-main"><span class="npw-nm">' + esc(outName) + '</span>' +
                (can > 0 ? '<span class="npw-price">可做 ' + can.toLocaleString() + ' 個</span>' : '<span class="npw-short">' + (s && s.cond === 1 ? '條件不符' : '材料不夠') + '</span>') +
                (cond ? '<span class="npw-cond">' + esc(cond) + '</span>' : '') + '</div>' +
                '<div class="npw-mats">' + mats.map(m => {
                    const k = cb.info ? mInfo(m.id) : '';
                    return '<div class="npw-mat ' + (m.st === 0 ? 'ok' : m.st === 1 ? 'mid' : 'no') + '"' + (k ? ' data-info="' + k + '"' : '') + '>' + (k ? infoBtn(k, ic(m.id), 'mi') : '<span class="mi">' + ic(m.id) + '</span>') +
                        '<span class="mn">' + esc(nm(m.id)) + (m.st === 1 ? '<i>（可合成）</i>' : '') + (m.wh > 0 ? '<em>倉庫 ' + m.wh.toLocaleString() + '</em>' : '') + '</span>' +
                        '<span class="mc">' + m.h.toLocaleString() + ' / ' + m.need.toLocaleString() + '</span></div>';
                }).join('') + '</div>' + lack +
                '<div class="npw-ctl">' + (multi && can > 1 ? '<input type="number" class="npw-qty" min="1" max="' + can + '" value="1" inputmode="numeric" aria-label="數量">' : '') +
                '<button type="button" class="npw-btn" data-mk="' + i + '"' + (s && can < 1 ? ' disabled' : '') + '>製作</button></div></div>';
        }).join('') + '</div>';
    }

    // ── 商店（站長 2026-10-23 改成緊湊列表：一列＝小圖示｜名字＋價錢｜數量＋按鈕，樣式在 lmui.css 檔尾「NPC 商店緊湊列表」） ──
    //   價錢前面一枚金幣（取代「金幣」兩個字）；身上錢不夠的那一列價錢變紅（扣錢、能不能買還是伺服器說了算）
    const COIN = () => goldIcon();   // 同左上角那張金幣圖（icons.js goldIcon）
    function shopHtml() {
        let list = '', rows = false;   // 買／賣分頁跟其他功能一起畫在 render()
        if (st.view === 'buy') {
            // 第 122 項：這家商人有收城稅就寫在清單上面（伺服器帶的；0 不寫）
            const gold = cb.gold();
            if (!st.buy) list = '';
            else list = (st.shopTax > 0 ? '<div class="npw-taxline">本城稅率 ' + st.shopTax + '%</div>' : '') + st.buy.map((x, i) => {
                rows = true;
                const base = x.name.replace(/\s*\(\d+\)$/, '');
                // 第 133 項（站長 2026-10-23「商店買魔法書，改成買了直接學習」）：書／水晶＝「學習」、沒有數量；學不了的灰掉寫原因（hud.js shopBook）；按了等伺服器回（學會了 S_AddSkill 會重畫成「已學會」）
                const bk = cb.shopBook ? cb.shopBook(x.name) : null, pend = bk && !bk.off && st.bookPend && st.bookPend.order === x.order && performance.now() - st.bookPend.at < 3000;
                const ctl = bk ? '<button type="button" class="npw-btn npw-bk' + (bk.t === '已學會' ? ' done' : '') + '" data-buy="' + x.order + '" data-book="1"' + (bk.off || pend ? ' disabled' : '') + '>' + esc(pend ? '學習中…' : bk.t) + '</button>'
                    : '<input type="number" class="npw-qty" min="1" value="1" inputmode="numeric" aria-label="數量"><button type="button" class="npw-btn" data-buy="' + x.order + '">購買</button>';
                return '<div class="npw-row">' + infoBtn('b' + i, icon({ name: base, gfx: x.gfx }), 'npw-ic') + '<div class="npw-main"' + (cb.info ? ' data-info="b' + i + '"' : '') + '><span class="npw-nm">' + esc(displayName(x.name)) + '</span>' +
                    '<span class="npw-price' + (x.price > gold && !(bk && bk.off) ? ' short' : '') + '">' + COIN() + x.price.toLocaleString() + '</span></div>' +
                    '<div class="npw-ctl">' + ctl + '</div></div>';
            }).join('');
        } else {
            // 同款裝備疊成一列（同背包，items.js stacks）：數量＝賣幾件，一次送過去、每件 1 個
            const inv = new Map(cb.items().map(p => [p.id, p])), price = new Map((st.sell || []).map(x => [x.id, x.price]));
            const groups = st.sellGroups = stacks((st.sell || []).filter(x => inv.has(x.id)).map(x => inv.get(x.id)));
            if (st.noSell || (st.sell && !groups.length)) list = '<div class="npw-empty">身上沒有這位商人收購的東西</div>';
            // 第 378 項（站長 2026-10-27「全部賣出沒用移除掉」）：收購商不再放「全部賣出」鈕（allSellHtml 留著不叫）
            else list = groups.map((g, i) => {
                rows = true;
                const p = g.p, max = g.items.length > 1 ? g.items.length : p.count;
                return '<div class="npw-row">' + infoBtn('s' + i, icon(p), 'npw-ic') + '<div class="npw-main"' + (cb.info ? ' data-info="s' + i + '"' : '') + '><span class="npw-nm' + nameCls(p.bless) + '">' + esc(p.full) + (max > 1 ? ' ×' + max.toLocaleString() : '') + '</span>' +
                    '<span class="npw-price">' + COIN() + price.get(p.id).toLocaleString() + '</span></div>' +
                    '<div class="npw-ctl">' + (max > 1 ? '<input type="number" class="npw-qty" min="1" max="' + max + '" value="' + max + '" inputmode="numeric" aria-label="數量">' : '') +
                    '<button type="button" class="npw-btn" data-sell="' + i + '">賣出</button></div></div>';
            }).join('');
        }
        return '<div class="npw-list' + (rows ? ' npw-shop' : '') + '">' + list + '</div>';
    }

    // 第 353 項（職業實測：收購商要一列一列按賣出，地監撿回來的雜物十幾列）：兩列以上多一顆「全部賣出」，按第一下寫總價、再按一下才賣（3 秒沒按就恢復）
    // eslint-disable-next-line no-unused-vars
    function allSellHtml(groups, price) {
        const total = groups.reduce((s, g) => s + (price.get(g.p.id) || 0) * (g.items.length > 1 ? g.items.length : g.p.count), 0);
        const armed = st.sellAllAt && performance.now() - st.sellAllAt < 3000;
        return '<div class="npw-sellall"><button type="button" class="npw-btn' + (armed ? ' on' : '') + '" data-sellall="1">' +
            (armed ? '確定全部賣出 ' + COIN() + total.toLocaleString() : '全部賣出（' + groups.length + ' 種）') + '</button></div>';
    }

    // ── 倉庫（版面照單機版 whx-*） ──
    // 血盟倉庫不能用的原因（clan.whState：1 見習、2 沒封號）
    const CWH_NO = { 1: '見習成員不能使用血盟倉庫', 2: '要有封號才能使用血盟倉庫，請盟主給你封號' };
    function whHtml() {
        if (cb.level() < 5) return '<div class="whx"><div class="npw-empty">5 級以上才能使用倉庫</div></div>';
        // 血盟倉庫還沒開放（clan.js CLAN_WH_OPEN）：當成沒有血盟＝沒有「個人倉庫／血盟倉庫」切換，只開個人倉庫
        const cws = CLAN_WH_OPEN && cb.clan && cb.clan.whState ? cb.clan.whState() : null, clan = st.whSrc === 'clan';
        if (clan && cws === null) { st.whSrc = 'me'; return whHtml(); }   // 剛退出血盟
        const src = cws === null ? '' : '<div class="whx-tabs whx-src"><button type="button" class="' + (clan ? '' : 'on') + '" data-whsrc="me"><span>個人倉庫</span></button>' +
            '<button type="button" class="' + (clan ? 'on' : '') + '" data-whsrc="clan"><span>血盟倉庫</span></button></div>';
        if (!clan && st.whTab === 'log') st.whTab = 'wh';   // 紀錄只有血盟倉庫有
        // 第 112 項：見習、沒封號、別人在用時也能看紀錄（伺服器只看是不是成員）
        const logBtn = cb.clan && cb.clan.whLogReq ? '<br><button type="button" class="npw-btn" data-whtab="log">存取紀錄</button>' : '';
        if (clan && st.whTab === 'log' && logBtn) return whBody(src, clan);
        if (clan && CWH_NO[cws]) return '<div class="whx">' + src + '<div class="npw-empty">' + CWH_NO[cws] + logBtn + '</div></div>';
        if (clan && st.whMsg) return '<div class="whx">' + src + '<div class="npw-empty">' + esc(st.whMsg) + (st.whRetry ? '<br><button type="button" class="npw-btn" data-whretry="1">再試一次</button>' : '') + logBtn + '</div></div>';
        return whBody(src, clan);
    }
    // 第 112 項 血盟倉庫紀錄：時間（今天／昨天／月/日）、誰、存入／取出、道具（圖示＋名字）、數量；新到舊（伺服器每個血盟留最近 200 筆）
    const two = n => String(n).padStart(2, '0');
    function whenText(sec) {
        const d = new Date(sec * 1000), now = new Date(), hm = two(d.getHours()) + ':' + two(d.getMinutes());
        const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(), diff = Math.round((day(now) - day(d)) / 86400000);
        return diff === 0 ? '今天 ' + hm : diff === 1 ? '昨天 ' + hm : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hm;
    }
    function logPanel() {
        const L = cb.clan.whLog();
        let body;
        if (!L || (L.loading && !L.list)) body = '<div class="whx-empty">讀取中…</div>';
        else if (L.status === 1) body = '<div class="whx-empty">血盟倉庫紀錄還沒開放</div>';
        else if (L.status === 2) body = '<div class="whx-empty">加入血盟才能看紀錄</div>';
        else if (L.status === -1) body = '<div class="whx-empty">現在看不到紀錄，請稍後再試</div>';
        else if (!L.list.length) body = '<div class="whx-empty">還沒有人存取過血盟倉庫</div>';
        else body = L.list.map(e => {
            const p = parseItem({ id: 0, name: e.name, count: e.count, gfx: e.gfx }), gold = e.id === GOLD_ID;
            // 伺服器第 446 項：身上不夠、從血盟倉庫扣的取出手續費記成「金幣（取出手續費）」，照名字顯示
            const nm = gold ? (/手續費/.test(e.name || '') ? e.name : '金幣') : p.full, cnt = gold || e.count > 1 ? (gold ? '' : '×') + e.count.toLocaleString() : '';
            return '<div class="whx-row whx-log"><div class="whx-icon">' + icon(p) + '</div>' +
                '<div class="whx-log-main"><div class="whx-name"><span' + (nameCls(p.bless) ? ' class="' + nameCls(p.bless).trim() + '"' : '') + '>' + esc(nm) + '</span>' + (cnt ? '<span class="whx-cnt">' + cnt + '</span>' : '') + '</div>' +
                '<div class="whx-log-sub"><span class="whx-log-who">' + esc(e.who) + '</span><span class="whx-log-when">' + whenText(e.sec) + '</span></div></div>' +
                '<span class="whx-log-act ' + (e.act === 1 ? 'in' : 'out') + '">' + (e.act === 1 ? '存入' : '取出') + '</span></div>';
        }).join('');
        return '<div class="whx-panel"><div class="whx-list">' + body + '</div></div>';
    }
    function whBody(src, clan) {
        const wh = ((clan ? st.cwh : st.wh) || []).map(it => parseItem(it)), inv = cb.items().filter(p => !p.equipped);
        const whGold = wh.find(isGold);
        // 兩邊同款裝備都疊成一列（items.js stacks），存入／取出＝數量那麼多件。倉庫那邊伺服器沒給能力值（看不出損壞程度）：損壞的跟好的同款會疊在一起，取出到背包會照損壞分開
        //   （玩家回饋 2026-11-08「身上的堆疊裝備存入倉庫就變成一件一件，可否也堆疊呢？不然取出時很麻煩」）
        const whItems = st.whGroups = whStacks(wh.filter(p => !isGold(p) && (st.whCat === 'all' || catOf(p) === st.whCat)));
        const invItems = st.invGroups = stacks(inv.filter(p => !isGold(p) && (st.whCat === 'all' || catOf(p) === st.whCat)));
        const hasLog = clan && cb.clan && cb.clan.whLogReq, onWh = st.whTab === 'wh', onLog = hasLog && st.whTab === 'log';
        const tabs = '<div class="whx-tabs' + (hasLog ? ' whx-tabs3' : '') + '"><button type="button" class="' + (onWh ? 'on' : '') + '" data-whtab="wh">' + SVG.chest + '<span>倉庫（' + whItems.length + '）</span></button>' +
            '<button type="button" class="' + (onWh || onLog ? '' : 'on') + '" data-whtab="inv">' + SVG.bag + '<span>背包（' + invItems.length + '）</span></button>' +
            (hasLog ? '<button type="button" class="whx-logtab' + (onLog ? ' on' : '') + '" data-whtab="log">' + SVG.log + '<span>紀錄</span></button>' : '') + '</div>';
        if (onLog) return '<div class="whx">' + src + tabs + logPanel() + '</div>';
        const row = (p, side, n, key) => {
            const trial = side === 'in' && isBound(p);   // 第 145 項：試煉贈品（伺服器不讓存，商店買的同款可以）
            const noStore = trial || (side === 'in' && p.tpl && p.tpl.nt);   // 不能交易的（伺服器不讓存）：同單機版寫「不可存放」
            const max = n > 1 ? n : p.count;
            const fee = side === 'out' && p.it && p.it.fee > 0 ? p.it.fee : 0;   // 第 124 項：取出的手續費寫在「取出」下面
            return '<div class="whx-row' + (noStore ? ' whx-dim' : '') + '"><div class="whx-icon">' + icon(p) + '</div>' +
                '<div class="whx-name" title="' + esc(p.full) + '"><span' + (nameCls(p.bless) ? ' class="' + nameCls(p.bless).trim() + '"' : '') + '>' + esc(p.full) + '</span>' + (max > 1 ? '<span class="whx-cnt">×' + max.toLocaleString() + '</span>' : '') + '</div>' +
                (max > 1 && !noStore ? '<input class="whx-qty npw-qty" type="number" min="1" max="' + max + '" value="' + max + '" inputmode="numeric" aria-label="數量">' : '') +
                (noStore ? '<span class="whx-nostore">' + (trial ? '試煉贈品' : '不可存放') + '</span>' : (fee ? '<span class="whx-outc">' : '') + '<button type="button" class="whx-act" data-' + side + '="' + key + '">' + SVG.box + '<span>' + (side === 'out' ? '取出' : '存入') + '</span></button>' +
                    (fee ? '<small class="whx-fee">手續費 ' + (n > 1 ? '每件 ' : '') + fee.toLocaleString() + '</small></span>' : '')) + '</div>';
        };
        const list = arr => arr.length ? arr.map((x, i) => row(x.p, onWh ? 'out' : 'in', x.items.length, i)).join('')
            : '<div class="whx-empty">' + (onWh ? '這個分類倉庫是空的' : '這個分類背包沒有物品') + '</div>';
        return '<div class="whx">' + src +
            '<div class="whx-gold"><div class="whx-gold-sum"><img src="/assets/ui/wh-coins.webp" alt="" class="whx-coins"><div><div>' + (clan ? '血盟' : '倉庫') + '金幣 <b>' + (whGold ? whGold.count : 0).toLocaleString() + '</b></div>' +
            '<div>身上金幣 <b>' + cb.gold().toLocaleString() + '</b></div></div></div>' +
            '<div class="whx-gold-ctl"><input id="wh-gold-amt" type="number" min="1" placeholder="全部" inputmode="numeric" class="whx-input" aria-label="金幣數量">' +
            '<button type="button" class="whx-btn" data-gold="in">' + SVG.down + '<span>存入</span></button><button type="button" class="whx-btn" data-gold="out">' + SVG.up + '<span>取出</span></button></div></div>' +
            tabs +
            '<div class="whx-cats">' + CATS.map(c => '<button type="button" class="' + (st.whCat === c[0] ? 'on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
            '<div class="whx-panel"><div class="whx-list">' + list(onWh ? whItems : invItems) + '</div></div></div>';
    }
    // 存取後伺服器不會主動送倉庫清單：再要一次（背包的變動伺服器會送）
    let reTimer = 0;
    function reloadWh() { clearTimeout(reTimer); reTimer = setTimeout(() => { if (st && st.view === 'wh') whReq(); }, 350); }
    const qtyOf = (btn, max) => { const row = btn.closest('.npw-row, .whx-row'), inp = row && row.querySelector('.npw-qty'); const v = inp ? Math.floor(+inp.value) : 1; return Math.max(1, Math.min(max || 1e9, v || 1)); };
    // 一疊（stacks）要送的 [編號, 數量]：疊起來的裝備＝前幾件各 1 個；會疊的道具＝那一格、數量
    const pairsOf = (g, btn) => g.items.length > 1 ? g.items.slice(0, qtyOf(btn, g.items.length)).map(x => [x.id, 1]) : [[g.p.id, qtyOf(btn, g.p.count)]];

    function onClick(e) {
        if (!st) return;
        // 點底色＝關；剛打開 400 毫秒內的不算（手機點畫面上的 NPC：手指放開就開視窗，瀏覽器接著補的 click 落在底色上，一開就關——
        //   NPC 在畫面邊邊、對話框蓋不到的地方最明顯，奇岩雜貨店屋頂上的 邁爾、傑夫、迪艾司，站長 2026-10-23「這 NPC 都點不到」）
        if (e.target === win) { if (performance.now() - openAt > 400) close(); return; }
        if (e.target.closest('.npw-close')) { close(); return; }
        const inf = cb.info && e.target.closest('[data-info]');
        if (inf) { const p = infoOf(inf.getAttribute('data-info')); if (p) cb.info(p); return; }
        const b = e.target.closest('button'); if (!b) return;
        const id = st.npc.id;
        if (b.dataset.view) { st.view = b.dataset.view; if ((st.view === 'buy' || st.view === 'sell') && !st[st.view]) request(st.view); if (st.view === 'make') askCraft(true); if (st.view === 'keep') cb.askPets(); if (st.view === 'elf' && cb.learnList) cb.learnList(); render(); return; }
        // 寵物保管員：領出（C_Result 12，扣錢、能不能領都是伺服器）、寄放（同夥伴視窗 C_Web 8-2）；之後 5 秒的伺服器訊息寫在上面
        if (b.dataset.keep != null) { st.petMsg = []; st.petAt = performance.now(); cb.result(id, 12, [[+b.dataset.keep, 1]]); render(); return; }
        if (b.dataset.stash != null) { st.petMsg = []; st.petAt = performance.now(); cb.stash(+b.dataset.stash); render(); return; }
        if (st.view === 'clan' && cb.clan && cb.clan.npcClick(e, win)) return;   // 血盟執行人：創立、查詢成員、離開／解散（clan.js）
        if (b.dataset.elfp) { st.elfPick = st.elfPick === b.dataset.elfp ? null : b.dataset.elfp; render(); return; }   // 屬性卡：先看那一系的魔法
        if (b.dataset.elfx) { st.elfSure = false; render(); return; }
        if (b.dataset.tax) { taxClick(b.dataset.tax); return; }   // 第 122 項 城主調稅率
        if (b.dataset.inn) { innClick(b); return; }   // 第 138 項 旅館
        if (b.dataset.gd) {   // 恢復神女（第 249 項）、航海士的靈魂（第 409 項）、次元之門（第 407 項）：送動作字串
            // 次元之門「取消」放棄（e）：伺服器回空的（原版＝關掉對話框）→ 畫面回到按放棄之前；沒有之前的就照原版關掉
            if (st.view === 'door' && b.dataset.gd === 'e') { const back = st.doorBack; if (back) { st.door = back; st.doorBack = null; render(); } else close(); }
            cb.action(id, b.dataset.gd); return;
        }
        if (b.dataset.bgo) {   // 主城建設：照輸入的金額捐（逗號、空白、全形數字都收）
            const inp = win.querySelector('.bd-amt'), raw = (inp ? inp.value : '').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48)).replace(/[,，\s]/g, '');
            const n = /^\d+$/.test(raw) ? +raw : 0, d = cb.build(), min = d ? d.min : 10000;
            if (n < min) st.buildMsg = '最少捐 ' + min.toLocaleString() + ' 金幣';
            else if (n > cb.gold()) st.buildMsg = '金幣不夠';
            else { st.buildMsg = ''; cb.buildDonate(n); if (inp) inp.value = ''; }
            render(); return;
        }
        if (b.dataset.elf) { elfAct(b.dataset.elf); return; }
        if (b.dataset.bsp) { if (st.bsPick !== b.dataset.bsp) st.bsMsg = ''; st.bsPick = b.dataset.bsp; render(); return; }   // 魔法商人：選多加的那一種
        if (b.dataset.bsbuy) { bsBuy(); return; }
        if (b.dataset.pet != null) {   // 寵物商：扣錢、給項圈都是伺服器，結果照伺服器訊息（makeMsg）
            const p = (st.fn.pet || [])[+b.dataset.pet]; if (!p) return;
            st.petMsg = []; st.petAt = performance.now(); cb.action(id, p[0]); render(); return;
        }
        if (b.dataset.mk != null) {
            const r = st.mk[+b.dataset.mk]; if (!r || b.disabled) return;
            const s = st.srv && st.srv.byAct[r.a];
            // 伺服器能自己做（不是任務、傳送類）：C_Web 16，缺的中間材料伺服器先做；數量照輸入（上限伺服器再算一次）
            if (s && !(s.flags & 2) && cb.craftMake) {
                const n = (s.flags & 1) ? qtyOf(b, Math.max(1, s.max)) : 1;
                st.pend = { act: r.a, n, at: performance.now() }; st.mkMsg = []; st.mkWeb = performance.now();
                cb.craftMake(id, r.a, n); render(); return;
            }
            st.pend = { act: r.a, n: r.n ? qtyOf(b) : 1, at: performance.now() }; st.mkMsg = [];
            cb.action(id, r.a); render(); return;
        }
        if (b.dataset.buy != null && b.dataset.book) {   // 第 133 項：書一次學一本；3 秒沒回音按鈕恢復（錢不夠之類的原因伺服器寫在聊天框）
            const me = st; st.bookPend = { order: +b.dataset.buy, at: performance.now() };
            cb.result(id, 0, [[+b.dataset.buy, 1]]); render();
            setTimeout(() => { if (st === me && win && !win.hidden) render(); }, 3100);
            return;
        }
        if (b.dataset.buy != null) { cb.result(id, 0, [[+b.dataset.buy, qtyOf(b)]]); return; }
        if (b.dataset.sellall) {
            const me = st;
            if (!(st.sellAllAt && performance.now() - st.sellAllAt < 3000)) { st.sellAllAt = performance.now(); render(); setTimeout(() => { if (st === me && win && !win.hidden) render(); }, 3100); return; }
            st.sellAllAt = 0;
            const pairs = (st.sellGroups || []).flatMap(g => g.items.length > 1 ? g.items.map(x => [x.id, 1]) : [[g.p.id, g.p.count]]);
            if (pairs.length) cb.result(id, 1, pairs);
            return;
        }
        if (b.dataset.sell != null) { const g = (st.sellGroups || [])[+b.dataset.sell]; if (g) cb.result(id, 1, pairsOf(g, b)); return; }
        if (b.dataset.tp != null) { const t = st.fn.tele[+b.dataset.tp]; if (t) { cb.action(id, t[0]); close(); } return; }
        if (b.dataset.whtab) {
            // 第 112 項：看紀錄時先把血盟倉庫的鎖解開（不然別的成員一直「有人在使用」）；回到倉庫／背包再要一次清單（重新鎖上）
            const was = st.whTab; st.whTab = b.dataset.whtab;
            if (st.whTab === 'log') { unlockClanWh(); cb.clan.whLogReq(() => { if (st && st.view === 'wh' && st.whTab === 'log') render(); }); render(); return; }
            if (was === 'log' && st.whSrc === 'clan') { const cws = cb.clan && cb.clan.whState ? cb.clan.whState() : null; if (!CWH_NO[cws]) whReq(); }
            render(); return;
        }
        if (b.dataset.whretry) { st.whMsg = ''; whReq(); render(); return; }
        if (b.dataset.whsrc) {   // 個人倉庫／血盟倉庫：換過去就要那一邊的清單；離開血盟倉庫先解鎖
            if (b.dataset.whsrc === st.whSrc) return;
            unlockClanWh(); st.whSrc = b.dataset.whsrc; st.whMsg = ''; if (st.whTab === 'log') st.whTab = 'wh';
            const cws = cb.clan && cb.clan.whState ? cb.clan.whState() : null;
            if (st.whSrc === 'me' || !CWH_NO[cws]) whReq();
            render(); return;
        }
        const wIn = st.whSrc === 'clan' ? 4 : 2, wOut = st.whSrc === 'clan' ? 5 : 3, whList = () => (st.whSrc === 'clan' ? st.cwh : st.wh) || [];
        if (b.dataset.cat) { st.whCat = b.dataset.cat; render(); return; }
        if (b.dataset.in != null) { const g = (st.invGroups || [])[+b.dataset.in]; if (g) { cb.result(id, wIn, pairsOf(g, b)); reloadWh(); } return; }
        if (b.dataset.out != null) { const g = (st.whGroups || [])[+b.dataset.out]; if (g) { if (wOut === 5) st.cwhLock = false; cb.result(id, wOut, pairsOf(g, b)); reloadWh(); } return; }
        if (b.dataset.gold) {   // 金幣：輸入金額（空白＝全部），不用去背包找
            const inp = win.querySelector('#wh-gold-amt'), want = Math.floor(+(inp && inp.value) || 0);
            const src = b.dataset.gold === 'in' ? cb.goldItem() : whList().map(it => parseItem(it)).find(isGold);
            if (!src) return;
            const n = want > 0 ? Math.min(want, src.count) : src.count;
            if (b.dataset.gold !== 'in' && wOut === 5) st.cwhLock = false;   // 取出後伺服器自己解鎖
            cb.result(id, b.dataset.gold === 'in' ? wIn : wOut, [[src.id, n]]);
            if (inp) inp.value = '';
            reloadWh();
        }
    }

    return {
        open, close,
        isOpen: () => !!win && !win.hidden,
        npcId: () => st && st.npc.id,
        shopBuy(p) { if (st && p.npc === st.npc.id) { st.buy = p.items; st.shopTax = p.tax || 0; st.waiting = false; render(); } },
        // 第 122 項 S_TaxRate（城主按了「調整稅率」、設好後再要的那次）：{ id, min, max, ext, castle, rate, eff, money, town, war, sec }
        taxRate(d) {
            if (!st || st.view !== 'castle') return;
            const first = !st.tax;
            st.tax = Object.assign({ at: performance.now() }, d);
            if (!d.ext) Object.assign(st.tax, { town: 2, war: 15, rate: 0 });   // 舊伺服器只給範圍：照原版村莊稅、戰爭稅算
            if (first) st.taxPick = Math.max(d.min, Math.min(d.max, d.ext ? d.rate : d.min));
            if (st.taxSent) {
                const s = st.taxSent; st.taxSent = null; clearTimeout(taxWait);
                st.taxMsg = !d.ext ? '稅率已送出' : d.rate === s.rate && d.eff === s.rate ? '稅率已設為 ' + s.rate + '%' : '沒有改成，請重新跟侍從長說話再試一次';
            }
            render();
        },
        shopSell(p) { if (st && p.npc === st.npc.id) { st.sell = p.items; st.noSell = false; st.waiting = false; render(); } },
        noSell() { if (st && st.view === 'sell') { st.sell = []; st.noSell = true; st.waiting = false; render(); } },
        retrieve(p) {
            if (!st || p.npc !== st.npc.id) return;
            // 第 124 項：每件取出的手續費（伺服器送的種類：武器 1、防具 2 → 武器防具的價錢；其他照一般道具；金幣免費）
            for (const it of p.items) it.fee = it.type === 1 || it.type === 2 ? (p.feeEq || p.fee || 0) : (p.fee || 0);
            if (p.kind === 5) { st.cwh = p.items; st.cwhLock = true; st.whMsg = ''; } else st.wh = p.items;
            st.waiting = false; render();
        },
        whEmpty() { if (st && st.view === 'wh') { if (st.whSrc === 'clan') { st.cwh = []; st.whMsg = ''; } else st.wh = []; st.waiting = false; render(); } },
        // 血盟倉庫打不開（伺服器訊息 208 沒血盟、209 別人正在用、728 沒封號、834 有倉庫密碼）：寫在倉庫視窗裡
        whMsg(t, id) { if (st && st.view === 'wh' && st.whSrc === 'clan') { st.whMsg = t; st.whRetry = id === 209; st.waiting = false; render(); } },   // 209 別人在用：等一下再試有用
        // 伺服器問要做幾個（S_HowManyMake）：剛按的那個配方 → 填的數量；不是這裡按的回 0（不回答）
        // 第 138 項 旅館：伺服器問要幾把鑰匙（S_HowManyKey）→ 剛按「租」填的把數；不是這裡按的回 0（不回答）
        innAmount(npcId) { const p = st && st.innPend; return p && st.npc.id === npcId && p.act !== 'return' && performance.now() - p.at < 5000 ? p.n : 0; },
        makeAmount(npcId, act) { const p = st && st.pend; return p && st.npc.id === npcId && p.act === act && performance.now() - p.at < 5000 ? p.n : 0; },
        // 按「製作」後幾秒內的伺服器訊息（給了什麼、缺什麼、太重…）也列在視窗上面；寵物商按「購買」後的（獲得項圈、金幣不足）也是
        makeMsg(t) {
            if (st && (st.view === 'pet' || st.view === 'keep') && st.petAt && performance.now() - st.petAt < 5000) { st.petMsg = st.petMsg.concat(t).slice(-3); render(); return; }
            const p = st && st.pend; if (p && st.view === 'make' && performance.now() - p.at < 5000) { st.mkMsg.push(t); render(); }
        },
        // S_Web 18（這隻 NPC 的配方狀態）：製作分頁照它畫；別隻的不理（製作工匠視窗另外收）
        craftList(d) {
            if (!st || d.npc !== st.npc.id) return;
            const byAct = {}; for (const r of d.recipes) byAct[r.act] = r;
            st.srv = { wh: d.wh, byAct };
            if (st.view === 'make' && !e_typing()) render();
        },
        // S_Web 19（剛在這裡按的「製作」的結果）：沒做成寫原因；做成了伺服器已經送「○○ 給你 ×× 。」（makeMsg），沒有才補一句。回 true＝這裡收了
        craftDone(r) {
            if (!st || !st.mkWeb || performance.now() - st.mkWeb > 8000) return false;
            st.mkWeb = 0;
            if (r.res === 1) st.mkMsg.push(r.msg || '沒有做成');
            else if (r.res === 0 && !st.mkMsg.length) st.mkMsg.push('做好了 ' + r.n.toLocaleString() + ' 個');
            if (st.view === 'make') render();
            return true;
        },
        refresh() { if (win && !win.hidden && !e_typing()) render(); },
        // 寵物保管員：項圈清單（S_Web 11）、夥伴清單（S_Web 8）有變就重畫；系統訊息（「哈士奇 領出來了」、夥伴已滿）按了之後 5 秒內寫在上面
        keepOpen: () => !!(st && st.view === 'keep' && win && !win.hidden),
        petsChanged() { if (st && st.view === 'keep') render(); },
        sysMsg(t) { if (st && (st.view === 'keep' || st.view === 'pet') && st.petAt && performance.now() - st.petAt < 5000) { st.petMsg = st.petMsg.concat(t).slice(-3); render(); } },
        // 伺服器回的對話檔：魔法商人的 bs_01（說話時）、bs_done／bs_adena（按了之後）；艾利溫的 ellyonne（名字沒對到時也照這個開精靈屬性頁）
        serverHtml(id, html, data) {
            // 第 138 項 旅館：租好了（inn4）、金幣不夠（inn3）、被搶走（空的）是伺服器 C_Amount 回的，編號是 NPC 樣板編號（70031）不是畫面上那隻 → 剛按了租就認
            const innAns = st && st.innPend && performance.now() - st.innPend.at < 5000 && (INN_MSG[html] || html === '');
            if (!st || (st.npc.id !== id && !innAns)) return;
            // 第 407 項 次元之門：對話檔＝目前狀態，資料＝[印記數, 要幾個, 已有幾個支配者, 屬性]；空的（取消放棄、進入後接著傳送）不動畫面
            if (st.doorAttr && (DOOR_HTML.test(html) || html === '')) {
                if (html === '') return;
                const n = (data || []).slice(0, 4).map(Number), ok = n.length === 4 && n.every(Number.isFinite);
                st.doorBack = html === 'wpass07' ? (st.door && st.door.html !== 'wpass07' ? st.door : st.doorBack) : null;
                st.door = { html, seals: ok ? n[0] : 0, need: ok ? n[1] : 0, rulers: ok ? n[2] : 0, attr: ok && DOOR_EL[n[3]] ? n[3] : st.doorAttr };
                st.view = 'door';
                render();
                return;
            }
            if (INN_HTML.has(html) || INN_MSG[html] || html === 'inn20' || (html === '' && st.innPend)) {
                if (!st.views.some(v => v[0] === 'inn')) st.views.unshift(['inn', '旅館']);
                if (st.view === 'none' || !INN_HTML.has(html)) st.view = 'inn';
                const p = st.innPend; st.innPend = null;
                if (INN_HTML.has(html)) st.innKey = data && data.length ? data[0] === '1' : null;   // 第 448 項：伺服器帶的「有沒有這間的鑰匙」（舊伺服器沒帶＝null）
                else if (html === 'inn4' || html === 'inn5') st.innKey = true;
                if (html === 'inn20') { st.innMsg = '已退租，退回 ' + (+(data && data[1]) || 0).toLocaleString() + ' 金幣'; st.innOk = true; }
                else if (INN_MSG[html]) { st.innMsg = INN_MSG[html]; st.innOk = html === 'inn4'; }
                else if (html === '' && p && performance.now() - p.at < 5000) st.innMsg = p.act === 'return' ? '你沒有在這裡租房間' : '房間剛被別人租走了，再按一次';
                render();
                return;
            }
            if (html === NEWS_HTML) {   // 第 148 項 派報少年
                if (!data || data[0] !== '1') return;
                const r = Math.max(0, Math.min(+data[1] || 0, data.length - 2));
                st.news = { recent: data.slice(2, 2 + r), all: data.slice(2 + r) };
                if (!st.views.some(v => v[0] === 'news')) st.views.unshift(['news', '消息']);
                st.view = 'news';
                render();
                return;
            }
            if (LORD_HTML.has(html)) {   // 第 122 項：城主跟自己城堡的侍從長說話
                if (!st.views.some(v => v[0] === 'castle')) st.views.unshift(['castle', '城堡']);
                st.view = 'castle';
                render();
                return;
            }
            if (BS_HTML.has(html)) {
                // 第 127 項：伺服器帶的價錢、各增益秒數；說話時的 bs_01 沒帶 → 要一次（舊伺服器回的也沒帶，就不再要）
                if (data && data.length >= 1 && /^\d+$/.test(data[0])) {
                    bsInfo.price = +data[0];
                    for (const part of data.slice(1)) for (const kv of String(part).split(',')) { const m = /^(\d+):(\d+)$/.exec(kv.trim()); if (m) bsInfo.dur[+m[1]] = +m[2]; }
                } else if (html === 'bs_01' && !st.bsAsked) { st.bsAsked = true; cb.action(id, '0'); }
                if (!st.views.some(v => v[0] === 'bs')) st.views.unshift(['bs', '增益']);
                if (st.view === 'none' || html !== 'bs_01') st.view = 'bs';
                if (html !== 'bs_01') {
                    const ok = html === 'bs_done';
                    st.bsPend = 0; st.bsOk = ok; st.bsMsg = ok ? '已施加' : '金幣不夠，要 ' + bsPrice().toLocaleString() + ' 金幣';
                    if (ok) { st.bsFresh = performance.now(); const me = st; setTimeout(() => { if (st === me) render(); }, 2300); }   // 格子亮完拿掉 class
                }
                render();
                return;
            }
            if (!ELF_HTML.has(html) || st.views.some(v => v[0] === 'elf')) return;
            st.views.unshift(['elf', '精靈屬性']);
            if (st.view === 'none') st.view = 'elf';
            render();
        },
        // 伺服器回了（選好屬性＝'f'／'w'／'a'／'e'、去除成功＝'init'）：不用再說「已經有屬性了」；選好的播特效、視窗換成那一系的魔法清單
        elfDone(c) {
            clearTimeout(elfPend); elfPend = 0;
            if (c && c !== 'init') elfBurst(c);
            if (st && st.view === 'elf') { st.elfPick = null; st.elfSure = false; st.elfNew = c && c !== 'init' ? performance.now() : 0; render(); }
        },
    };
    function e_typing() { const a = document.activeElement; return !!(a && win.contains(a) && a.tagName === 'INPUT'); }
}
