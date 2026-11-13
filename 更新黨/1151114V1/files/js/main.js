// 網頁版主程式：跟伺服器的連線、畫面切換（登入 → 選角／建角 → 遊戲）、走路、聊天
//   登入／選角／建角＝start.js（照搬單機版畫面）；遊戲中介面＝hud.js（單機版天堂M介面）；地圖與角色＝world.js（單機版 afk-townmap 畫法）
import { L1Connection } from './protocol.js?v=20261110w';
import * as relinkUi from './relink-ui.js';
import { World } from './world.js?v=20261109sc';
import { displayName, isMob, npcPortrait, trimImage, effectDirs, fxKind, CLASS_OF_GFX } from './look.js';
import { DX, DY } from './opcodes.js';
import * as HUD from './hud.js';   // 舊 hud.js 還在瀏覽器快取（Cloudflare 4 小時）時具名匯入 mpCut 會整支載不起來 → 用命名空間、沒有就當 0
const { createHud } = HUD, mpCut = HUD.mpCut || (() => 0);
import { stageOn, stageScale, vw, vh, sxy } from './stage.js';
import { createStart } from './start.js?v=20261109s';
import { parseItem, TPL_OF, BOUND, LOCKED, stacks, HOME_STONE, honorKind, itemById } from './items.js';
import { big5Encode } from './big5.js';
import { bgmScene, townScene, zoneScene, warScene, sfx, audioHidden, onAudioStuck } from './audio.js';
import * as csfx from './combatsfx.js';
import { Link } from './link.js';
import { itemIcon, skillIcon, stateIcon } from './icons.js';
import { createLootFx } from './loot.js';
import { createClan, RANK_NAME } from './clan.js';
import { createWarBar } from './warbar.js';   // 伺服器第 455 項：血盟戰爭戰況條（畫面上方、可收折）
import { createParty } from './party.js';
import { createFriend } from './friend.js';
import { createEnhBroadcast } from './enhbc.js';
import { createNewbieCard } from './newbie.js';
import { createTutorial } from './tutorial.js';
import { captureAdSrc, reportAdSrc } from './adsrc.js';   // 廣告來源（網址帶 utm_source／fbclid 進來的，登入後回報帳號）
captureAdSrc();
import { createSignin } from './signin.js';
import { captureInvite, inviteBanner, createInvite, promoClick } from './invite.js';   // 伺服器第 703 項：邀請好友（網址帶 ?r=邀請碼 進來的記起來、登入畫面放邀請卡）
captureInvite(); inviteBanner(); promoClick();
import { createPromo } from './promo.js?v=20261110rk';   // 伺服器第 710 項：推廣系統（推文送審、拉人、全服推廣進度、推廣幣兌換、分享卡）
import { createDolls, dollTierByName } from './dolls.js';
import { openToiBook, toiReady, toiCeremony, toiEnterTip } from './toibook.js';
import { openHuntDex, huntReady, huntCeremony } from './huntdex.js';
import { openCollect, collectBook } from './collect.js';
import { createTreasure } from './treasure.js';
import { createPumpkin, isPumpkinName } from './pumpkin.js';
import { createCall } from './call.js';
import { dollShow } from './dollshow.js';
import { createPrefSync } from './prefsync.js';
import { dollGfx } from './doll-gfx.js';
import { PC_LETTER_KEYS } from './pcui.js';
import { createRanking } from './ranking.js';
import { createTop1, top1Honors, honorTag } from './top1.js';
import { createMarket } from './market.js';
import { createShop, SVG as SHOP_SVG } from './shop.js?v=20261109s';
import { createPayDone } from './paydone.js';
import { noCardTip, tipReset as sellTipReset, NO_CARD_PREFIX } from './sellcard.js';
import { createMail } from './mail.js';
import { createCandle } from './candle.js';
import { createGuide } from './guide.js';
import { pushInit, pushAsk, pushOnServer, pushState, pushToggle } from './push.js';   // 伺服器第 534 項：手機推播
import { createTrial } from './trial.js';
import { createLure } from './lure.js';
import { createBoxAll } from './boxall.js';   // 守護團獎金箱子開啟／全開（伺服器第 686 項）
import { createFruit } from './fruit.js';   // 進化果實／勝利果實：選寵物（伺服器第 482 項）
import { createStone } from './stone.js';
import { createPortals } from './portals.js';
import { createSummon } from './summon.js';
import { createSilh } from './silh.js';
import { createAdmin } from './admin.js';
import * as shutdownUi from './shutdown-ui.js';   // 維修倒數：秒數用浮窗、分鐘用跑馬燈（伺服器第 544 項）
let lootFx = null;
const enhBc = createEnhBroadcast();   // 強化全服廣播跑馬燈（enhbc.js；伺服器 S_Web 22）
const newbie = createNewbieCard();    // 新手任務卡（newbie.js；伺服器 S_Web 27，舊伺服器沒送就不出現）
// 新版新手引導（tutorial.js；伺服器 S_Web 27 新格式／C_Web 26，tutorial.mode 適用的角色才送；收到了舊卡片收起來）
const tutorial = createTutorial({
    send: (a, s) => { if (conn && G.inWorld) conn.tutorial(a, s); },
    level: () => G.st.level || 0,
    items: () => [...G.inv.values()].map(parseItem),
    autoOn: () => !!G.autoOn,
    autoSettings: () => G.autoSettings,   // 第 5 步前段：看「自我加速藥水 效果沒了自動喝」勾了沒
    trainingId: () => { const t = TELEPORTS.find(x => x.name === '新兵修練場'); return t ? t.id : 17; },
    toast: t => hud.toast(t),
    inGame: () => !!(G.inWorld && start.screen === 'game'),
    hotSlots: () => (hud.hotSlots ? hud.hotSlots() : []),   // 20 步制「快捷格放治癒藥水」
    mapId: () => G.mapId,                                   // 20 步制最後一步：在不在大陸（不在＝先傳回銀騎士村莊）
    gold: () => G.st.gold || 0,                             // 20 步制最後一步：做卷軸的錢夠不夠
    myType: () => G.st.type || 0,                           // 設定自動變身：法師推薦的外型不一樣
    polyFits: n => (hud.polyFits ? hud.polyFits(n) : true), // 設定自動變身：選的外型現在用得了嗎（等級、武器、防具）
    // 完成一步：關掉那一步引導打開的視窗（tutorial.js CLOSE_OF；回 true 關了、null 沒開著、false 等一下再試）。魔法娃娃、每日簽到是自己的模組，其他在 hud.js
    closeWin: (w, held) => {
        if (w === 'doll') { if (!dolls.isOpen()) return null; if (held(document.getElementById('doll-window')) || held(document.getElementById('doll-item'))) return false; dolls.close(); return true; }
        if (w === 'signin') { if (!signin.isOpen()) return null; if (held(document.getElementById('signin-window'))) return false; signin.close(); return true; }
        return hud.tutClose ? hud.tutClose(w, held) : null;
    },
    holdFloats: on => { if (hud.holdFloats) hud.holdFloats(on); },
    signinOpen: () => signin.open(), signinReady: () => signin.ready(), signinSigned: () => signin.signed(),   // 新手任務簽到那步（設定的簽到鈕拿掉了）   // 完成一步的特效放的時候：系統訊息先不浮上來（不跟特效的字疊在一起）
    // 一鍵全部穿上（tutorial.js wearAll）：穿不穿得上照 hud.js canWear；穿＝跟背包點道具一樣的 useItem
    canWear: p => (hud.canWear ? hud.canWear(p) : true),
    wear: p => useItem(p),
    // 本機改動第 375 項（站長 2026-10-27「剛創人物進遊戲先歡迎一下再進入任務引導」）：歡迎視窗寫角色名、記「這隻看過了」；換地圖、斷線接回中先別跳
    charName: () => G.st.name || (G.curChar && G.curChar.name) || (G.me && G.me.name) || '',
    busy: () => popBusy(),
});
// 每日簽到（signin.js；S_Web 28／C_Web 23，舊伺服器沒送就不出現）：自己跳出來要等地圖讀好、AUTO 關著（同下面試煉獎勵）
const signin = createSignin({
    send: () => { if (conn && G.inWorld) conn.signin(); },
    inGame: () => !!(G.inWorld && start.screen === 'game'),
    // 新手引導進行中不自己跳（站長 2026-10-24「剛創角色 每日簽到就跳出來了」：新手第一眼就被簽到蓋住）；引導第 14 步會帶去 設定 → 系統 → 每日簽到，引導做完才照常自己跳
    busy: () => popBusy() || tutorial.active(),
    autoOn: () => !!G.autoOn,
});
// 邀請好友（invite.js；伺服器第 703 項，S_Web 73／C_Web 73，舊伺服器沒送就沒有入口）：進世界打招呼（＋綁網址帶來的邀請碼）、設定 → 系統的「邀請好友」開視窗
const invite = createInvite({
    send: (fn, ...a) => { if (!conn || !conn[fn]) return false; conn[fn](...a); return true; },   // 不看 G.inWorld：打招呼在第一次收到 AUTO 設定時送，那時 G.inWorld 有時還沒設（實測綁定隨機漏送）；伺服器沒角色本來就不理 C_Web
    acct: () => G.acct || '',
    toast: t => hud.toast(t),
    onChange: () => hud.refreshWin(),   // 收到 on 變了：設定頁的鈕跟著出現／消失
});
// 推廣系統（promo.js；伺服器第 710 項，S_Web 74／C_Web 74，舊伺服器沒回就沒有入口）：進世界問一次狀態、設定 → 系統的「推廣獎勵」開視窗；登入畫面測試服公告的入口進世界後自己打開
const promo = createPromo({
    send: (act, o) => { if (!conn || !conn.promo) return false; conn.promo(act, o); return true; },
    toast: t => hud.toast(t),
    onChange: () => hud.refreshWin(),
    me: () => G.me, level: () => G.st.level || 0, cls: () => (G.st.type == null ? -1 : G.st.type), inv: () => [...G.inv.values()],   // 分享卡：站姿、等級職業、強化最高的武器
    beforeOpen: () => { if (!document.body.classList.contains('pcui')) hud.closeAll(); },   // 手機直式：彈出視窗一次一個
    info: o => hud.itemInfoOpen(o),   // 兌換清單的道具點了看說明（站長 2026-11-08「點道具要說明」）
    inviteOpen: () => { if (!document.body.classList.contains('pcui')) hud.closeAll(); invite.open(); },   // 站長 2026-11-09：設定裡的［邀請好友］拿掉，推廣視窗拉人那段的［好友獎勵］開領獎視窗（invite.js）
    broadcast: parts => enhBc.show({ parts }),   // 第 732 項第二版：升上金／傳說號角、傳說號角上線的跑馬燈（同第一名那條）
});
// 練功推薦（guide.js）：20 級起右上角「!」，照等級列狩獵場、按了走狩獵場付費傳送（同狩獵場視窗的 webTeleport）
const guide = createGuide({
    level: () => G.st.level || 0,
    teleports: () => TELEPORTS,
    teleport: id => webTeleport(id),
    inGame: () => !!(G.inWorld && start.screen === 'game'),
    charName: () => (G.curChar && G.curChar.name) || (G.me && G.me.name) || '',
    beforeOpen: () => { if (!document.body.classList.contains('pcui')) hud.closeAll(); },   // 手機直式：彈出視窗一次一個（電腦版面小視窗可以並排）
    autoOn: () => !!G.autoOn,   // AUTO 開著「!」藏起來
});
// 魔法娃娃（dolls.js；S_Web 29 收藏／30 結果、C_Web 24 操作，舊伺服器沒送 29 就沒有入口）：結果寫進系統訊息
// 寶藏挖掘（treasure.js，伺服器第 210 項）：圖示照道具編號（items.js itemById → icons.js itemIcon）
const call = createCall({ go: id => { if (conn && G.inWorld) conn.callGo(id); }, mapName: id => mapLabel(id), icon: id => { try { const t = itemById(id); return t ? itemIcon(t) : ''; } catch (e) { return ''; } } });   // 穿雲箭（伺服器第 237 項）
// 南瓜種植（pumpkin.js，伺服器第 596 項）：點南瓜開的小視窗；澆水、採收離太遠先走過去（pumpkinAct → pumpkinCheck）
const invCount = id => { let n = 0; for (const it of G.inv.values()) if (tplOf(parseItem(it)) === id) n += it.count || 1; return n; };
const pumpkin = createPumpkin({ count: invCount, conn: () => (conn && G.inWorld ? conn : null), act: (id, act, pot) => pumpkinAct(id, act, pot),
    icon: id => { try { const t = itemById(id); return t ? itemIcon(t) : ''; } catch (e) { return ''; } }, iconOf: o => { try { return itemIcon(o) || ''; } catch (e) { return ''; } },   // iconOf：箱子內容格子的圖示（items.js lineHtml）
    info: o => hud.itemInfoOpen(o) });   // 站長 2026-11-03：箱子內容的格子點了開道具資訊
const treasure = createTreasure({ conn: () => (conn && G.inWorld ? conn : null), gold: () => G.st.gold || 0, bagIcon: () => itemIcon('魔法娃娃的袋子'), icon: id => { try { const t = itemById(id); return t ? itemIcon(t) : ''; } catch (e) { return ''; } } });
const dolls = createDolls({ conn: () => (conn && G.inWorld ? conn : null), chat: (t, cls) => hud.chat(t, 'sys', cls), gold: () => G.st.gold || 0,
    autos: () => G.autoSettings, saveAutos: s => { if (conn && G.inWorld) { conn.autoSettings(s); G.autoSettings = s; hud.refreshWin(); dolls.settingsChanged(); } } });   // 第 274 項：娃娃視窗的自動召喚開關   // gold：合成手續費、買袋子夠不夠（伺服器照樣判斷）
// 排行榜（ranking.js；⊞ 選單開視窗時 C_Web 25 要、S_Web 31 回）：自己的名字用來標出「這是我」
const ranking = createRanking({ send: () => { if (conn && G.inWorld) conn.ranking(); }, me: () => ({ name: G.st.name, level: G.st.level, type: G.st.type }) });
// 排行榜第一名特權（top1.js；伺服器 S_Web 37、C_Web 31，本機改動第 102 項）：金名、金色封號、雕像、全服廣播借強化跑馬燈
// 交易所（market.js；伺服器 C_Web 32 ↔ S_Web 38，本機改動第 109 項）：⊞ 選單「交易所」開視窗；價錢、金幣、背包放不放得下都是伺服器判斷
const market = createMarket({
    send: (fn, ...a) => { if (conn && G.inWorld && conn[fn]) { G.actAt = performance.now(); conn[fn](...a); } },
    items: () => [...G.inv.values()].filter(it => !isGold(it)),
    gold: () => G.st.gold || 0,
    icon: p => itemIcon(p),
    toast: t => hud.toast(t),
    onBadge: () => fnBadges(),   // 有東西可領：⊞ 鈕、選單上的「交易所」掛紅點（同信箱）
    // 第 119 項：出售分頁看月卡（S_Web 41）；沒月卡按「開通月卡」打開商城；第一次的引導按「否」記在伺服器帳號上（C_Web 35 動作 2）
    card: () => G.card,
    hasCard: () => cardOn(),
    openShop: () => { if (!lv20('商城')) return; market.close(); shopOpen(); },
    hintOff: () => { if (conn && G.inWorld) conn.monthCard(2); if (G.card) G.card.hintOff = true; },
});
// 月卡（伺服器 S_Web 41，本機改動第 119 項）：G.card＝收到的那包＋expireAt（換成本機時間）；有沒有、背包上限、能不能賣都是伺服器判斷，這裡只拿來顯示
function cardOn() { return !!(G.card && G.card.on && Date.now() < G.card.expireAt); }
function bagMax() { return G.card ? (cardOn() ? G.card.bagCard : G.card.bagFree) : 0; }
// 商城＋月卡（shop.js）：右下「商城」鈕；月卡區照伺服器 S_Web 41，其他商品還是範本（按了「尚未開放」）
// 第 647 項（站長 2026-11-04「測試期間隱藏商城，正式開服務必改回去」）：SHOP_HIDDEN＝⊞ 選單不放「商城」，其他會打開商城的地方只跳一句。開服前改 false
const SHOP_HIDDEN = true;
const BETA_LEARN_UNTIL = Date.UTC(2026, 10, 14, 4, 0);   // 伺服器第 695 項：2026-11-14 12:00（台灣）
// 站長 2026-11-05「管理者帳號不隱藏」：GM／管理員帳號（伺服器 S_Web 254 送了在線人數＝G.manager）照樣看得到、打得開商城，測試用
function shopOpen() { if (SHOP_HIDDEN && !G.manager) { hud.toast('測試期間商城暫停開放'); return; } shop.open(); }
const shop = createShop({ toast: t => hud.toast(t), beforeOpen: () => { if (!document.body.classList.contains('pcui')) hud.closeAll(); },
    ask: () => { if (conn && G.inWorld) conn.monthCard(1); },
    activate: () => { if (conn && G.inWorld) conn.monthCard(3); },
    mall: (...a) => { if (!conn || !G.inWorld) return false; conn.mall(...a); return true; }, account: () => G.acct || '' });   // account：第 291 項儲值開單表單自動填   // 伺服器第 222 項：用藍鑽買、使用   // 測試期免費開通（第 119b 項；開關、天數、上限都是伺服器）
// 儲值成功慶祝畫面（paydone.js）：在線入帳＝伺服器那行系統訊息（onChat）；離線入帳＝進遊戲後問 /pay/ways 的 done；餘額＝商城狀態（S_Web 222）
const payDone = createPayDone({ account: () => G.acct || '', inWorld: () => !!G.inWorld, askBalance: () => { if (conn && G.inWorld) conn.mall(0); }, gem: SHOP_SVG.gem });
const PAY_DONE_RE = /^儲值成功：藍鑽 \+(\d+)/;   // 伺服器 web/WebPay 入帳那行「儲值成功：藍鑽 +N。」
// 背包滿了開不了 AUTO、沒月卡（伺服器第 125 項，S_Web 1 帶 card）：伺服器那句「背包已滿（80/80 格）：存倉庫、到萬物收購商賣掉，或開通月卡擴充到 180 格」
//   冒號前當標題（剩 1 格、超過上限照伺服器寫的）、後面當內文（手機直式兩行內）；「開通月卡」＝打開商城（月卡區在最上面）、「知道了」＝關掉。
//   站長 2026-10-23：每次按 AUTO 都跳（跟交易所「按否就不再跳」不一樣）；同日「也要告訴玩家不用月卡也有別的方法」
let bagAskWin = null;
function bagCardAsk(reason) {
    if (bagAskWin) bagAskWin.remove();
    const text = String(reason || '背包已滿'), i = text.indexOf('：'), title = i > 0 ? text.slice(0, i) : '背包已滿', body = i > 0 ? text.slice(i + 1) : text;
    const ov = bagAskWin = document.createElement('div'); ov.className = 'lmui-ov cl-ov bag-ask';
    ov.innerHTML = '<div class="box"><div class="hd"><span></span><button type="button" data-x="1" aria-label="關閉">✕</button></div>' +
        '<div class="bd"><div class="cl-ask"></div></div>' +
        '<div class="ft"><button type="button" data-no="1">知道了</button><button type="button" data-yes="1">開通月卡</button></div></div>';
    ov.querySelector('.hd span').textContent = title;
    ov.querySelector('.cl-ask').textContent = /[。！]$/.test(body) ? body : body + '。';


    const close = () => { ov.remove(); if (bagAskWin === ov) bagAskWin = null; };
    ov.addEventListener('click', e => {
        if (e.target.closest('[data-yes]')) { close(); market.close(); if (lv20('商城')) shopOpen(); return; }
        if (e.target.closest('[data-no]') || e.target.closest('[data-x]') || e.target === ov) close();
    });
    document.body.appendChild(ov);
}
// 怪物剪影大考驗（silh.js；伺服器 S_Web 163、C_Web 163，本機改動第 163 項）：參加鈕、題目卡、排行榜、怪物博士封號；前三名借強化跑馬燈
const silh = createSilh({ send: (a, q, c) => { if (conn && G.inWorld) conn.silh(a, q, c); }, toast: t => hud.toast(t), myName: () => G.st.name || '',
    broadcast: parts => enhBc.show({ parts }), cry: (name, gfx) => csfx.mobAttack(name, gfx, 1) });
const top1 = createTop1({ toast: t => hud.toast(t), broadcast: parts => enhBc.show({ parts }), obj: id => G.objs.get(id) || (G.me && G.me.id === id ? G.me : null), card: o => clan.card(o),
    myId: () => (G.me && G.me.id) || G.myId || 0, setShow: on => { if (conn) conn.top1Show(on); } });   // 第 166 項：封號固定、榮耀卡、加冕；第 167 項：野外也全套顯示開關
// 信箱（mail.js，本機改動第 110 項；C_Web 33、S_Web 39）：⊞ 選單開視窗；有要處理的信時 ⊞ 鈕掛紅點＋數字（選單上那顆 hud.js 問 mail.badge()）
const mail = createMail({
    send: (a, id) => { if (!conn || !G.inWorld) return false; conn.mail(a, id); return true; },
    onBadge: () => fnBadges(),
});
// ⊞ 鈕的紅點＝信箱要處理的信＋交易所可領的，合計一個數字；選單上的「信箱」「交易所」各掛自己的（選單開著時也跟著變；選單打開那下 hud.js 問 mail.badge()／market.claims()）
function fnBadges() {
    const m = mail.badge(), k = market.claims();
    const put = (el, n) => {
        if (!el) return;
        let i = el.querySelector('.ml-badge');
        if (n > 0) { if (!i) { i = document.createElement('b'); i.className = 'ml-badge'; el.appendChild(i); } i.textContent = n > 99 ? '99+' : String(n); }
        else if (i) i.remove();
    };
    put(document.getElementById('lmui-skbtn'), k);   // 信箱移到背包下方（站長 2026-10-25）：⊞ 只算交易所可領的
    // 信箱：背包下方那顆、工具列的「背包」各掛一個紅點（不寫數字）
    const dot = (el, on) => { if (!el) return; let i = el.querySelector('.ml-dot'); if (on && !i) { i = document.createElement('i'); i.className = 'ml-dot'; el.appendChild(i); } else if (!on && i) i.remove(); };
    document.querySelectorAll('[data-tool="items"], .bag-foot [data-bagmail]').forEach(el => dot(el, m > 0));
    put(document.querySelector('#lmui-fnmenu button[data-k="trade"]'), k);
}
// 自己跳出來的視窗（試煉儀式、每日簽到）先等一下：換地圖進度條、斷線接回、自動重新登入中、死掉（AUTO 被打死停了，先看死亡畫面）
function popBusy() { return !G.me || mapLoad.active || !!G.reconnecting || relogTry >= 0 || !!G.dead; }
// 等級試煉獎勵（trial.js；伺服器 S_Web 32 推、C_Web 28 收下，舊伺服器沒送就不出現）：全畫面儀式，不關任何視窗、不動 AUTO；
//   AUTO 開著不自動跳（只留「🎁」入口，AUTO 關了才演；autoState 收到開關變了叫 trial.auto）
// 回憶蠟燭（candle.js，本機改動第 113 項；C_Web 34、S_Web 40）：用蠟燭 → 伺服器說可以才打開重配視窗
const candle = createCandle({
    send: (a, init, fin) => { if (!conn || !G.inWorld) return false; conn.charReset(a, init, fin); return true; },
    toast: t => hud.toast(t),
    raise: k => { if (!conn || !G.inWorld) return false; conn.raiseAttr(k); return true; },   // 升級點數 +1（原版 C_Attr 479）
    stats: () => G.st,   // 舊伺服器（沒有 S_Web 40 動作 3）：用能力頁的值
    onBonus: () => hud.refreshWin(),   // 能力頁的「能力點數」入口跟著變
});
const trial = createTrial({
    send: (lv, pick) => { if (!conn || !G.inWorld) return false; conn.trialClaim(lv, pick); return true; },   // 不設 actAt：結果儀式上就有，系統訊息不另外跳提示
    inGame: () => !!(G.inWorld && start.screen === 'game'),
    busy: () => popBusy() || tutorial.welcoming(),   // 第 375 項：新角色的歡迎視窗先，關掉才演
    autoOn: () => !!G.autoOn,
    onShow: () => tutorial.tick(),   // 新手引導的框、標籤馬上讓開（它每 0.3 秒自己也會看）
    // 領到了：儀式淡出、焦點在角色身上（角色身體中間在螢幕上的位置，畫布座標×舞台倍率＋畫布左上角）；角色身上的煙火放完才演下一級
    mePos: () => {
        if (!G.me || !view.cam) return null;
        const p = world.worldPos(G.me.fx, G.me.fy), r = cv.getBoundingClientRect(), k = stageScale() * view.zoom;
        return [r.left + (p[0] - view.cam[0]) * k, r.top + (p[1] - view.cam[1] - (G.me._head || 50) / 2) * k];
    },
    fxOn: ids => G.fx.some(f => f.kind === 'gfx' && f.id === G.myId && ids.includes(f.gfx)),
    mailOn: () => mail.on(),   // 第 448 項：伺服器信箱開著＝試煉獎勵寄信箱，儀式寫去哪裡領
});
// 誘捕（lure.js；伺服器 web/WebPetLure、S_Web 34）：背包「使用」漂浮之眼肉／胡蘿蔔＝一般的使用道具，自己身上誘捕、右上角狀態圖示（effects.js）；
//   舊伺服器（沒送 34）擋下不送
const lure = createLure({ toast: t => hud.toast(t) });
const boxAll = createBoxAll({ ok: () => !!(G.autoSettings && G.autoSettings.v18), tplOf: p => tplOf(p), count: p => invCount(tplOf(p)), has: id => G.inv.has(id), open: id => { if (!conn || !G.inWorld) return; G.actAt = performance.now(); conn.useItem(id); }, openAll: id => { if (!conn || !G.inWorld) return; G.actAt = performance.now(); conn.boxOpenAll(id); } });
const fruit = createFruit({ ok: () => !!(G.autoSettings && G.autoSettings.v15), comps: () => G.comps || [], tplOf: p => tplOf(p), has: id => G.inv.has(id), toast: t => hud.toast(t), send: (id, pet) => { if (!conn || !G.inWorld) return; G.actAt = performance.now(); conn.useItem(id, w => w.d(pet)); } });
// 提煉魔石連續提煉（stone.js，本機改動第 123 項；C_Web 123、S_Web 123）：選黑魔石、次數 → 伺服器一次一次照原版提煉；舊伺服器退回一次一顆的原版封包
const stone = createStone({
    items: () => [...G.inv.values()].map(parseItem),
    mp: () => (G.st && G.st.mp) || 0,
    send: (id, n) => { if (!conn || !G.inWorld || !G.me) return false; if (helpless()) { frozenWarn(); return false; } conn.bringStone(id, n); return true; },
    stop: () => { if (!conn || !G.inWorld) return false; conn.bringStone(0); return true; },
    single: objId => {
        const s = SKILLS.find(x => x.sid === 100);
        if (!conn || !G.me || !s || helpless() || castLocked()) return false;
        G.actAt = performance.now(); conn.useSkill(100, { id: objId, x: G.me.x, y: G.me.y }); castSent(s); return true;
    },
    toast: t => hud.toast(t),
});
import { effectInfo } from './effects.js';
import { createMapLoading } from './maploading.js';

const $ = id => document.getElementById(id);
const STEP_MS = 667;          // 查不到 spr_action 時的預設：10 個職業外型走路都是 16/24 秒（L1J spr_action framecount 16、framerate 24）
const KEEPALIVE_MS = 60000;
const HOLD_MS = 250;          // 按住超過這麼久＝往手指方向一直走；更短＝點一下（點地面走過去、點人鎖定）
// 聊天 type → 介面的分頁與顏色
// 聊天那句是誰說的（同 maint 第 698 項；正式機補上給「點名字密語」用）：名字: 、<名字>、[名字]、{名字}、{{名字}}、(名字)、-> (名字)；世界頻道匿名的 [******] 不算
const WHO_RE = /^(-> \(|\{\{|\[|<|\{|\()([^\s[\]<>{}():*]{1,20})(?:\)|\]|>|\}\}|\}) |^([^\s:：]{1,20})(?:: |：)/;
function chatWho(t) { const m = WHO_RE.exec(t); return !m ? null : m[2] ? { n: m[2], i: m[1].length } : { n: m[3], i: 0 }; }
const CHAT_CAT = { 0: ['say', 'c-say'], 2: ['say', 'c-shout'], 3: ['world', 'c-world'], 12: ['world', 'c-world'], 4: ['clan', 'c-clan'], 13: ['clan', 'c-clan'],
    11: ['party', 'c-party'], 14: ['party', 'c-party'], 9: ['sys', 'c-sys'], 16: ['whisper', 'c-whisper'],
    20: ['spy', 'c-spy'] };   // 20：管理員才收得到的監聽（伺服器 WebChatSpy，第 713 項）：只在「全部」分頁、灰紫色

let link = null, conn = null, keepTimer = 0;
// 正在處理的是舊的遊戲資料（link.js：接回時轉接補送的、手機背景時積著的）：斷線那段發生的施法特效、音效、傷害數字、出手動作不再演一次，
//   狀態照收（站長 2026-10-22「重新連線之後…會再重放一次狀態」）
const stale = () => !!(link && link.stale);
let chars = [], charMax = 0, charCount = 0;   // 選角列表（伺服器 S_CharAmount／S_CharPacks）
const G = { myId: 0, me: null, objs: new Map(), mapId: -1, st: {}, inv: new Map(), skillMasks: null, inWorld: false, lock: null, path: null, goal: null, marker: null, curChar: null,
    arrowTpl: 0, dollItem: 0, lastDoll: 0, castPick: null, actAt: 0, mapNpcs: null, mapNpcsAsk: -1e9, remoteTalk: false, learn: null, elfAttr: null, elfReset: null, learnAsk: -1e9, learnAt: -1e9, learnAllAt: -1e9,
    autoOn: false, autoSettings: null, autoLog: null, logWanted: false, players: new Map(), fx: [], dead: false, bookmarks: [] };
let autoPingTimer = 0;
// 回報附帶的手機、網路狀況（errlog.js 的 st 欄；機型在伺服器記的 User-Agent 裡）
function devInfo() {
    try {
        const n = navigator.connection || {};
        return '網路 ' + (n.effectiveType || '?') + (n.saveData ? '（省流量）' : '') + (n.downlink ? ' ' + n.downlink + 'Mbps' : '') + (n.rtt != null ? ' rtt ' + n.rtt + 'ms' : '') +
            '；記憶體 ' + (navigator.deviceMemory || '?') + 'GB；核心 ' + (navigator.hardwareConcurrency || '?') + '；畫面 ' + screen.width + 'x' + screen.height + '@' + (window.devicePixelRatio || 1) +
            (matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches ? '；桌面圖示開的' : '');
    } catch (e) { return ''; }
}
// AUTO 開著（伺服器一直會送打怪、走路、狀態）、畫面開著，卻 STALL_MS 都沒收到伺服器資料 → 回報一次（errlog 同一個訊息一頁只報一次）
const STALL_MS = 30000;
setInterval(() => {
    if (!conn || !G.inWorld || !G.autoOn || document.hidden || !conn.rxAt || !window.L1WEB_REPORT) return;
    if (performance.now() - conn.rxAt > STALL_MS) L1WEB_REPORT('AUTO 開著卻 ' + STALL_MS / 1000 + ' 秒沒收到伺服器資料', '/js/main.js', devInfo());
}, 5000);
const world = new World();
// 伺服器第 757 項（站長 2026-11-09「萬物百貨商五格範圍內不能有人靠近」，web/WebShopClear）：萬物百貨商 5 格內不能走進去——
//   這一步落在圈內、又沒有比上一格離它更遠＝不走（在圈裡的只能往外走）。伺服器照同一條擋，網頁不先避開會一直被拉回。
//   點百貨商、圈裡別的 NPC 照樣直接說話（同一張地圖不用走過去）。名字、半徑跟伺服器 config/web-shopclear.properties 對齊
const SHOP_CLEAR = '萬物百貨商', SHOP_CLEAR_R = 1;
let shopZ = [], shopZAt = -1e9;
function shopNoEnter(fx, fy, tx, ty) {
    const now = performance.now();
    if (now - shopZAt > 500) { shopZAt = now; shopZ = []; for (const o of G.objs.values()) if (!o.isPc && (o.name || '').trim() === SHOP_CLEAR) shopZ.push(o); }   // 找路一次問幾千格：半秒重找一次就好
    for (const s of shopZ) { const dt = Math.max(Math.abs(tx - s.x), Math.abs(ty - s.y)); if (dt <= SHOP_CLEAR_R && dt <= Math.max(Math.abs(fx - s.x), Math.abs(fy - s.y))) return true; }
    return false;
}
world.noEnter = shopNoEnter;
window.__world = world;   // 離線伺服器的 AUTO、怪走路要看牆（js/offline-auto.js walkWorld）
const portals = createPortals(world);   // 樓梯、傳送點的標示（portals.js）：畫在地圖上、點了走過去
// 召喚術叫得出什麼（summon.js）：魔法視窗召喚術的說明＋召喚表；戴召喚控制戒指放召喚術時伺服器送 summonlist → 同一張表挑一種，回 C_NPCAction（自己的編號＋那一列的字）
const summon = createSummon({
    level: () => G.st.level || 0, cha: () => G.st.cha || 0,
    comps: () => G.comps || [],   // 身邊的夥伴（S_Web 8）：佔掉的魅力、夥伴上限照伺服器扣（summon.js comps）
    ringOn: () => [...G.inv.values()].some(it => { const p = parseItem(it); return p.equipped && tplOf(p) === SUMMON_RING; }),
    isMage: () => (G.st.type || 0) === 3, hasCard: () => cardOn(), cardKnown: () => !!G.card,   // 第 344 項：召喚表的月卡說明（只給法師看）
    pick: s => { if (conn && G.inWorld && G.myId) { G.actAt = performance.now(); conn.npcAction(G.myId, s); } },
});
const SUMMON_RING = 20284;   // 召喚控制戒指（伺服器 L1BuffUtil SUMMON_MONSTER 的 checkEquipped；data/summons.json ringId 同一個）
// 換地圖：新地圖的圖還沒到先蓋進度條（最多 3 秒）。結束時告訴伺服器「看得到了」：伺服器的傳送後保護（怪不打、最多 5 秒）縮短成再 1 秒（本機改動第 161 項）
const mapLoad = createMapLoading($('game'), () => { if (conn && G.inWorld && G.me && G.mapId >= 0) conn.mapLoaded(G.mapId, G.me.x, G.me.y); });
const getJson = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
let AUTO_POTIONS = [];   // AUTO 設定可選的治癒藥水（跟伺服器 WebAutoSettings.HEAL_POTIONS 同一組）
getJson('/data/autopotions.json').then(d => { AUTO_POTIONS = d || []; });
let POLYS = [], BOSSES = {}, SHOP_ITEMS = null;   // AUTO 設定：變形卷軸能變的形態（英文名送伺服器）、每張地圖的頭目（迴避頭目選哪幾隻）、一般商店有賣的（自動買買得到的）
getJson('/data/polys.json').then(d => { POLYS = d || []; });
getJson('/data/bosses.json').then(d => { BOSSES = d || {}; });
getJson('/data/shopitems.json').then(d => { SHOP_ITEMS = d ? new Set(d) : null; });
let SHOP_BUY = null;   // 隨地自動買的價錢（data/shopbuy.json：道具 → [一包含稅價, 一包幾個, 一包原價, 稅率%]，同伺服器 WebShop；舊資料只有前兩個）；沒有這份＝設定頁不寫金額
getJson('/data/shopbuy.json').then(d => { SHOP_BUY = d; });
let dropsAsk = null;
let MAPNAMES = {}, SKILLS = [], SPRWALK = {}, SYSMSG = {}, DROPS = null, TELEPORTS = [], NPCCARDS = {};
//   字典還沒載完就收到的系統訊息（剛開頁／回到遊戲時伺服器一口氣送來的）等載完再顯示，不然會出現「系統訊息 #294」（站長 2026-10-29「這什麼錯誤」）
let sysmsgLoaded = false;
const SYSMSG_READY = getJson('/data/sysmsg.json').then(d => { SYSMSG = d || {}; sysmsgLoaded = true; });
getJson('/data/teleports.json').then(d => { TELEPORTS = d || []; });
getJson('/data/npccards.json').then(d => { NPCCARDS = d || {}; });
let SKILL_LEARN = {};   // 各職業學各階魔法要幾級（tools/skill-notes.json，照 C_ItemUSe 的魔法書規則）
getJson('/data/skill-learn.json').then(d => { SKILL_LEARN = d || {}; });
let SPELL_WHERE = {};   // 第 129 項 魔法去哪裡買（tools/spell-where.mjs）：技能編號 → [[地點, NPC]…]；舊資料沒有這個檔＝空的（照原本寫「用魔法書學」）
getJson('/data/spellwhere.json').then(d => { SPELL_WHERE = d || {}; });
getJson('/data/mapnames.json').then(d => { MAPNAMES = d || {}; if (G.players.size) showPlayers(); });
// 大陸（地圖 4）伺服器的名字是「整個大陸」，大陸上哪裡都一樣（站長：沒有意義）→ 線上名單、掉寶、掛機紀錄寫「大陸」；
//   左下地名改成最近的傳送點（狩獵場清單裡大陸上的地點，80 格內），離每個地點都遠就寫「大陸」
const MAINLAND = 4;
// 伺服器第 680 項：新兵修練場 1001、1091～1093 四座分流 →「新兵修練場 分流N」；掉寶照 1001
const TRAIN_SHARD = { 1001: 1, 1091: 2, 1092: 3, 1093: 4 };
const dropMap = id => TRAIN_SHARD[id] ? 1001 : id;
const mapLabel = id => id === MAINLAND ? '大陸' : TRAIN_SHARD[id] ? '新兵修練場 分流' + TRAIN_SHARD[id] : MAPNAMES[id] || '';
function hereName() {
    const me = G.me;
    // 狩獵場地點有劃範圍的（木人樁在新兵修練場那張圖裡劃一塊）：站在範圍裡就叫那個地點的名字
    const zt = me && TELEPORTS.find(t => t.zone && t.map === G.mapId && me.x >= t.zone[0] && me.y >= t.zone[1] && me.x <= t.zone[2] && me.y <= t.zone[3]);
    if (zt) return zt.name;
    if (G.mapId === MAINLAND && me) {
        let best = null, bd = 81;
        for (const t of TELEPORTS) if (t.map === MAINLAND) { const d = Math.max(Math.abs(t.x - me.x), Math.abs(t.y - me.y)); if (d < bd) { bd = d; best = t; } }
        if (best) return best.name;
    }
    return mapLabel(G.mapId) || ('地圖 ' + G.mapId);
}
getJson('/data/sprwalk.json').then(d => { SPRWALK = d || {}; });
let SPRATK = {};   // 出手要幾毫秒（伺服器 spr_action，同 SprTable）：外型 → 動作編號 → 毫秒；攻擊動畫照這個播（播完剛好接下一刀）
getJson('/data/spratk.json').then(d => { SPRATK = d || {}; });
// 這次出手的動作要多長：攻擊＝手上武器的攻擊動作（走路編號＋1；怪物＝1），施法＝18／19；查不到回 0（照固定幀長）
//   自己照加速、勇水縮短（伺服器的出手間隔也是這樣算，伺服器第 74 項）：原本照沒加速的長度播，加速＋勇水時一刀只播到六成就被下一刀蓋掉
function actMsOf(o, act) {
    const t = SPRATK[o.gfx]; if (!t) return 0;
    let ms = 0;
    if (act === 'attack') ms = t[o.isPc ? (o.weapon || 0) + 1 : 1] || t[1] || t[30] || 0;
    else if (act === 'skill') ms = t[18] || t[19] || 0;
    return !ms ? ms : o === G.me ? ms * mySpeed(act === 'attack' ? 'atk' : 'spell') : act === 'attack' ? ms * objSpeed(o, 'atk') : ms;
}
// 自己的速度倍率（同伺服器 AcceleratorChecker.getRightInterval）：一段（加速 ×0.75、緩速 ÷0.75）× 二段（勇水 0.75、精靈餅乾 0.87、超級加速 0.375、
//   神疾／行走加速／風之疾走只算走路 0.75、血之渴望只算攻擊 0.75）× 生命之樹果實（走路 0.87）× 巧克力蛋糕 0.87。
//   效果看右上角狀態圖示（S_Web 10）；一段另外看伺服器送的 S_SkillHaste（G.hasteSt；原版用戶端靠它，裝備給的加速沒有狀態圖示、只有這包）
function mySpeed(kind) {
    const ef = G.effectIds || new Set();
    const haste = SPELL_HASTE.some(i => ef.has(i)) || G.hasteSt === 1, slow = SPELL_SLOW.some(i => ef.has(i)) || G.hasteSt === 2;
    let m = haste && !slow ? 0.75 : slow && !haste ? 1 / 0.75 : 1;
    if (ef.has(1026)) m *= 0.375;
    else if (ef.has(1000)) m *= 0.75;
    else if (ef.has(1016)) m *= 0.87;
    else if (kind === 'move' && (ef.has(52) || ef.has(101) || ef.has(150))) m *= 0.75;
    else if (kind === 'atk' && ef.has(186)) m *= 0.75;
    if (kind === 'move' && ef.has(1017)) m *= 0.87;
    if (ef.has(1027)) m *= 0.87;
    if (kind !== 'move' && ef.has(167)) m *= 2;   // 風之枷鎖：攻擊、施法間隔 ×2（伺服器第 755 項 AcceleratorChecker 同倍率；原本網頁沒算＝中了照樣快）
    return m;
}
// 別的玩家的速度倍率（同伺服器 getRightInterval）：一段 o.mv（S_SkillHaste／進視野的 S_OtherCharPacks）、二段 o.brave（S_SkillBrave）、三段 o.third（S_Liquor 8）。
//   原本別人一律照外型的步速播：別人喝了水、或 AUTO 照原版速度走（第 103 項），畫面先慢、排隊、再一口氣追上或直接跳（站長 2026-10-23「人物角色有時候會飄移」）
function objSpeed(o, kind) {
    if (!o.isPc) return 1;
    let m = o.mv === 1 ? 0.75 : o.mv === 2 ? 1 / 0.75 : 1;
    const b = o.brave || 0;
    if (b === 1) m *= 0.75; else if (b === 3) m *= 0.87; else if (b === 5) m *= 0.375;
    else if (b === 4 && kind === 'move') m *= 0.75; else if (b === 6 && kind === 'atk') m *= 0.75;
    if (o.third) m *= 0.87;
    if (kind !== 'move' && o.shackleUntil && performance.now() < o.shackleUntil) m *= 2;   // 風之枷鎖（S_PacketBox 0x2c，伺服器第 755 項）
    return m;
}
const objSet = (id, k, v) => { const o = G.objs.get(id); if (o && o !== G.me) o[k] = v; };
// 失明（闇盲咒術 20、黑闇之影 40、暗黑盲咒 103；伺服器 S_CurseBlind，第 755 項）：原版畫面全黑只看得到自己（1），吃了漂浮之眼肉看得到周圍（2）。
//   原本網頁不認這包＝失明沒有任何作用。暗幕疊在畫布上（同 #cv 的位置，不擋按鈕、不吃點擊），每 0.1 秒照自己在畫面上的位置挖一個洞；
//   伺服器時間到會送 0；身上已經沒有這三個效果（S_Web 10）3 秒以上也收掉（保險：漏了 0 不會一直黑）
const BLIND_IDS = [20, 40, 103];
let blindEl = null, blindTimer = 0, blindType = 0, blindAt = 0;
function blindSet(t) {
    blindType = t === 1 || t === 2 ? t : 0; blindAt = performance.now();
    if (!blindType) { clearInterval(blindTimer); blindTimer = 0; if (blindEl) { blindEl.remove(); blindEl = null; } return; }
    if (!blindEl) {
        blindEl = document.createElement('div'); blindEl.id = 'blind-dim';
        blindEl.style.cssText = 'position:absolute;pointer-events:none;z-index:1';
        cv.insertAdjacentElement('afterend', blindEl);
    }
    if (!blindTimer) blindTimer = setInterval(blindDraw, 100);
    blindDraw();
}
function blindDraw() {
    if (!blindEl) return;
    const ef = G.effectIds;
    if (!G.inWorld || (ef && !BLIND_IDS.some(i => ef.has(i)) && performance.now() - blindAt > 3000)) { blindSet(0); return; }
    // 跟畫布同一塊：用畫布在 #game 裡的版面位置（電腦版 #game 整個被舞台縮放，fixed／螢幕座標會再被縮一次、洞挖歪）
    const s = blindEl.style;
    s.left = cv.offsetLeft + 'px'; s.top = cv.offsetTop + 'px'; s.width = cv.offsetWidth + 'px'; s.height = cv.offsetHeight + 'px';
    let x = '50%', y = '50%', k = 1;
    if (G.me && view.cam) {
        const p = world.worldPos(G.me.fx, G.me.fy); k = view.zoom;   // 版面座標（還沒乘舞台縮放）
        x = Math.round((p[0] - view.cam[0]) * k) + 'px'; y = Math.round((p[1] - view.cam[1] - (G.me._head || 50) / 2) * k) + 'px';
    }
    const [r0, r1] = blindType === 2 ? [170, 230] : [40, 72];
    blindEl.style.background = 'radial-gradient(circle at ' + x + ' ' + y + ', rgba(0,0,0,0) ' + Math.round(r0 * k) + 'px, rgba(0,0,0,.94) ' + Math.round(r1 * k) + 'px)';
}
// 走一步幾毫秒：伺服器 spr_action（外型 × 手上武器的走路動作；NPC、怪物用空手那個）
function walkMs(o) {
    const t = SPRWALK[o.gfx]; if (!t) return STEP_MS;
    return t[o.isPc ? (o.weapon || 0) : 0] || t[0] || STEP_MS;
}
// 自己走一步（同伺服器 AcceleratorChecker 的移動間隔）：sprwalk 是 ×1000÷framerate、伺服器 SprTable 是 ×960 → ×0.96，再乘一段＋二段＋三段（mySpeed）。
//   原本手動走路只照外型：喝綠水、勇水都沒變快（第 103 項實測：伺服器加速＋勇敢 360 毫秒，手動一直 667）
const myWalkMs = () => walkMs(G.me) * 0.96 * mySpeed('move');
getJson('/data/skills.json').then(d => {
    SKILLS = d || [];
    for (const s of SKILLS) if (SKILL_FIX[s.sid]) s.effect = SKILL_FIX[s.sid];   // 伺服器第 755 項改過效果的整句換掉
    for (const s of SKILLS) { const a = SKILL_ADD[s.sid]; if (a && s.effect && !s.effect.includes(a)) s.effect += '；' + a; }   // 補充說明（SKILL_ADD）：資料重產後已經有了就不再接
    for (const s of SKILLS) if (s.area > 0 && s.target === 'attack' && s.gfx) effectDirs(s.gfx);   // 有目標的範圍魔法：先載效果圖有幾個方向（onRangeSkill 分飛過去還是原地播）
});

// ── 登入／選角／建角 ────────────────────────────────
// 畫面從遊戲切到登入／選角／建角：遊戲裡開著的視窗全部收掉（站長 2026-10-23：伺服器重開、斷線回登入畫面，魔法娃娃視窗還開在左上角）。
//   娃娃、交易所、信箱、商城、簽到、排行榜…都掛在 body 上，不會跟著 #game 藏起來。
//   斷線自動登回同一隻（relogSoft）畫面一直停在遊戲（蓋 #relink），不會走到這裡 → 玩家開著的視窗照樣留著；登入畫面自己的東西（更新鈕、提示）不動。
//   血盟／組隊、復活的「是／否」有計時器會把框放回來，要連計時一起收（clan／party.reset、resYesNoClose）；新手引導、儀式進遊戲本來就會重來
let sceneWas = 'login';   // createStart 一建好就叫 scene('login')：那時下面的模組還沒建，不能收
function leaveGameUi() {
    const steps = [
        () => hud.closeAll(), () => hud.craft.close(),
        () => dolls.close(), () => market.close(), () => shop.close(), () => signin.close(), () => invite.close(), () => promo.close(), () => guide.close(), () => stone.close(),
        () => mail.close(), () => candle.close(), () => ranking.close(), () => top1.close(),
        () => clan.reset(), () => party.reset(), () => resYesNoClose(), () => trial.reset(), () => tutorial.reset(), () => sellTipReset(),
        () => { if (bagAskWin) { bagAskWin.remove(); bagAskWin = null; } },
        () => document.querySelectorAll('.lmui-ov').forEach(o => o.remove()),   // 漏掉的小視窗（道具資訊、召喚表、月卡小卡…）
    ];
    for (const f of steps) { try { f(); } catch (e) { console.warn('[畫面] 收遊戲視窗失敗', e); } }
}
const start = createStart({
    login: (a, p, m) => connect(a, p, 0, null, m),
    enter: ch => enter(ch),
    create: o => { if (conn) conn.createChar(o); },
    del: name => { if (conn) conn.deleteChar(name); },
    refresh: () => { if (conn) conn.commonClick(); },   // 刪角後重拿角色列表
    logout: () => { passClear(); if (conn) conn.webLogout(); disconnect(); },   // 選角畫面回登入：伺服器那邊的通行碼也作廢
    scene: (which, type) => {
        if (which !== 'game' && sceneWas === 'game') leaveGameUi();   // 離開遊戲畫面：遊戲裡開著的視窗收掉
        sceneWas = which;
        bgmScene(which === 'create' ? 'create' + type : 'title');   // 遊戲中的曲子由 place() 依安全區換
    },
});

// ── 管理員視窗（admin.js，伺服器第 543 項）：GM／管理員帳號左上「管理員」鈕打開 ──
const admin = createAdmin({
    send: (act, q, id) => { if (conn && G.inWorld) conn.admin(act, q, id); },
    toPlayer: id => { if (conn && G.inWorld) { G.actAt = performance.now(); stopPath(); G.talkTo = 0; G.pickTo = 0; conn.toPlayer(id); } },
    mapName: id => mapLabel(id),
});

// ── 血盟（clan.js）：血盟執行人、能力視窗「血盟」分頁、點血盟主申請加入、盟主的同意視窗 ──
const clan = createClan({
    conn: () => (conn && G.inWorld ? conn : null),
    me: () => G.me,
    myName: () => (G.me && G.me.name) || (G.curChar && G.curChar.name) || '',
    myType: () => G.st.type,                 // 0＝王族（才能創立血盟）
    myLevel: () => G.st.level || 0,          // 第 310 項：招募板「幾級以上」
    gold: () => G.st.gold || 0,
    toast: t => hud.toast(t),
    chat: t => { hud.chat(t, 'sys', 'c-sys'); hud.toast(t); },   // 血盟戰爭開戰、投降、結束（第 111 項）
    act: () => { G.actAt = performance.now(); },   // 剛按了：伺服器回的訊息跳提示
    refresh: () => hud.refreshWin(),
    openTab: () => hud.openWin('stats', '血盟'),
    playerInfo: id => G.players.get(id),     // 線上清單（職業：王族才可能是血盟主）
    obj: id => G.objs.get(id),
    goNear: (x, y) => { userMoved(); goNear(x, y); },   // 申請加入：走到盟主旁邊（3 格內就停）
    stop: () => stopPath(),
    walking: () => !!(G.path && G.path.length) || !!(G.me && G.me.walking),
});
// 對方跟自己同血盟（自己有血盟、對方頭上的盟名一樣）
const sameClan = o => { const mc = clan.name(); return !!(o && o !== G.me && mc && (o.clan || '').trim() === mc); };
// 點隊員、點盟友能對他放的（party.js castMenu／小卡片）：學會的、技能表對象 buff 且含玩家（1）或隊伍（8）的（治癒、加速、祝福魔法武器…）；
//   同血盟再加只給血盟的（4：通暢氣脈術、體魄強健術、聖結界；伺服器 L1SkillUse.isTarget 看同盟）。
//   減益（技能表 type 1 機率類、4 詛咒類：毒咒、緩速術、弱化術…）不列：原本也列在隊員選單，點了會害到自己人。還沒開放的不列
function allySkills(o) {
    const m = G.skillMasks || [], to = sameClan(o) ? (1 | 4 | 8) : (1 | 8);
    return SKILLS.filter(s => s.lv <= 22 && ((m[s.lv - 1] || 0) & s.bit) && s.target === 'buff' && (s.to & to) && !(s.type & (1 | 4)) && !SKILL_SOON.has(s.sid));
}
// 血盟戰爭戰況條（warbar.js；站長 2026-10-29「血盟戰爭畫面上方可收折 會顯示分數 擊殺 在線 剩餘時間」）：資料＝血盟資訊尾端的戰況（clan.js 解好的 st.wars）
const warBar = createWarBar({ inGame: () => !!(G.inWorld && start.screen === 'game'), wars: () => clan.state().wars });
// ── 組隊（party.js）：點玩家邀請、被邀請的「是／否」、能力視窗「隊伍」分頁、隊友頭上的血條 ──
const party = createParty({
    conn: () => (conn && G.inWorld ? conn : null),
    me: () => G.me,
    myId: () => G.myId,
    myName: () => (G.me && G.me.name) || (G.curChar && G.curChar.name) || '',
    myStats: () => G.st,
    toast: t => hud.toast(t),
    act: () => { G.actAt = performance.now(); },
    refresh: () => { hud.refreshTab('隊伍'); hud.setParty(party.barList(), party.buffBar()); },   // 能力視窗隊伍分頁、左側隊員欄（第 513 項：隊伍增益剩的時間）
    recruit: () => G.precruit,   // 伺服器第 517 項：自由招募（S_Web 215）
    recruitAsk: () => { if (conn && G.inWorld) conn.partyRecruit(0); },
    recruitSet: on => { if (conn && G.inWorld) conn.partyRecruit(1, on); },
    recruitJoin: id => { if (conn && G.inWorld) conn.partyRecruit(2, id); },
    mapName: id => mapLabel(id),
    // 站長 2026-11-01「點隊長的名片 會彈出是否要傳送 只能傳送狩獵場有的點」：隊長所在那個狩獵場傳送點（同左下地名：有劃範圍的先看範圍，
    //   同一張圖取最近的；大陸要在 TP_NEAR_R 格內）；沒有＝null。價錢同狩獵場視窗（身上有傳送符＝免費），收錢、能不能傳由伺服器判斷
    leaderTp: (map, x, y) => {
        let tp = TELEPORTS.find(t => t.zone && t.map === map && x >= t.zone[0] && y >= t.zone[1] && x <= t.zone[2] && y <= t.zone[3]);
        if (!tp) { let bd = map === MAINLAND ? TP_NEAR_R + 1 : Infinity; for (const t of TELEPORTS) if (t.map === map) { const d = Math.max(Math.abs(t.x - x), Math.abs(t.y - y)); if (d < bd) { bd = d; tp = t; } } }
        if (!tp) return null;
        // 傲慢之塔：有那一層的傳送符（用掉 1 張）或支配符（49950 起，永久）＝不收金幣（2026-11-14）
        const dom = tp.need ? 49950 + (tp.need - 40289) : 0;
        const free = !tp.price || (tp.need && [...G.inv.values()].some(it => { const id = tplOf(parseItem(it)); return id === tp.need || id === dom; }));
        return { id: tp.id, name: tp.name, price: free ? 0 : tp.price };
    },
    teleport: id => webTeleport(id),
    tab: () => hud.refreshTab('隊伍'),
    buff: () => G.pbuff,   // 伺服器第 513 項：隊伍增益（S_Web 214；at＝收到的時間，網頁自己倒數）
    buyBuff: i => { if (conn && G.inWorld) conn.partyBuff(1, i); },
    gold: () => G.st.gold || 0,
    playerInfo: id => G.players.get(id),     // 線上清單：隊友的等級、職業
    partySkills: id => allySkills(G.objs.get(id)),   // 點左側隊員（對方不在畫面上＝看不到盟名，只給血盟的不列；點了也是「太遠了」）
    clanSkills: o => (sameClan(o) ? allySkills(o) : []),   // 點畫面上同血盟的人：小卡片「放輔助魔法」（不同隊的盟友也能放）
    skillIcon,
    cast: (s, o) => castSkill(s, o, true),   // 距離（太遠先走過去）、魔力、材料照 castSkill

    obj: id => G.objs.get(id),
    goNear: (x, y) => { userMoved(); goNear(x, y); },   // 邀請、委任：對方要在 7 格內，遠了先走過去
    stop: () => stopPath(),
    walking: () => !!(G.path && G.path.length) || !!(G.me && G.me.walking),
});

// ── 遊戲中介面 ────────────────────────────────────
// 第 299 項：玩家設定存到伺服器（白名單、合併規則在 prefsync.js）
const prefSync = createPrefSync({
    load: () => { if (conn && G.inWorld) conn.prefsLoad(); },
    save: json => { if (!conn || !G.inWorld) return false; conn.prefsSave(json); },
    applied: () => hud.prefsReload(),
});
// ── 好友（friend.js，伺服器第 584 項）：角色視窗「好友」分頁 ──
const friend = createFriend({
    conn: () => (conn && G.inWorld ? conn : null),
    toast: t => hud.toast(t),
    act: () => { G.actAt = performance.now(); },
    refresh: () => hud.refreshTab('好友'),
    tabOpen: () => hud.tabIs('stats', '好友'),
    whisper: (name, text) => { if (conn && G.inWorld) { G.actAt = performance.now(); conn.whisper(name, text); } },
    toPlayer: id => { if (conn && G.inWorld) { G.actAt = performance.now(); stopPath(); G.talkTo = 0; G.pickTo = 0; conn.toPlayer(id); } },
});
// 站長 2026-11-02「商城跟交易所 20 等之後再顯示」：20 級以下不開（⊞ 選單也不列，hud.js；伺服器第 598 項也擋）
const lv20 = what => { if ((G.st.level || 0) >= 20) return true; hud.toast(what + ' 20 級以後開放'); return false; };
const hud = createHud($('game'), {
    // 站長 2026-11-03「地圖內有傳送點的話新增傳送點名稱顯示，點擊可以自動引導過去」：放大的小地圖點到傳送點 → 走過去（同點畫面上的牌子）
    minimapTap: e => {
        const p = G.me && world.minimapPortalAt && world.minimapPortalAt(hud.minimap, e.clientX, e.clientY);
        if (!p) return false;
        userMoved(); goPortal({ x: p.x, y: p.y, cells: p.c || [[p.x, p.y]] });
        if (hud.toast) hud.toast('前往 ' + p.t);
        return true;
    },
    clan, party, friend,
    partyCast: id => party.castMenu(id),   // 點左側隊員：對他放治癒、輔助魔法
    midUse: (id, name) => midUseId(id, name),   // 中鍵點夥伴格、隊員欄：選中的快捷格對他用（電腦版）
    // 電腦版左鍵點快捷格的魔法：除了選這格，要點目標的（攻擊、弱化、指定地點…）順便進入準星，接著左鍵點怪／人／地面就放（站長 2026-10-24「點滑鼠左鍵也不會施放」）。
    //   只是等目標、不會自己放出去（鎖定著也不放：點格子原本就是「選、不用」）；給自己的、無對象的照舊只選
    armCast(s) {
        if (!G.inWorld || !G.me || !(midNeedsTarget(s) || XY_ONLY.has(s.sid))) return;
        G.castPick = s; hud.float('點選「' + s.name + '」' + (XY_ONLY.has(s.sid) ? '要放的地方' : '的目標'), true);
    },
    // 「.」「．」開頭＝建立物品指令（站長自訂，伺服器 web/WebItemCommand 判斷誰能用）：一律走一般頻道，伺服器回的提示要跳出來
    onChat(text, type) {
        if (!conn || !G.inWorld) return;
        // 血盟頻道：沒有血盟伺服器會直接丟掉。clan.name() 靠血盟資訊（S_Web 15），斷線很快接回（離線掛機接手）時伺服器當作沒變不重推 → 一直是空的、盟頻打不出去；
        //   自己角色封包帶的血盟編號（G.me.clanId）也算有血盟
        if (type === 4 && !clan.name() && !(G.me && G.me.clanId)) { hud.toast('還沒有加入血盟'); return; }
        if (type === 11 && !party.inParty()) { hud.toast('還沒有隊伍'); return; }   // 隊伍頻道：同上
        // 「.指令」不管在哪個頻道都改送一般（伺服器只在一般聊天認指令）；連續的點、刪節號、點後面空白（「.....」「. 好」）是聊天，照原頻道送
        //   （站長 2026-11-07「世界頻道打.....不會進入」：原本只看開頭一個點，整句被當成指令吞掉）
        if (/^[.．](?![.．。…\s])/.test(text)) { type = 0; G.actAt = performance.now(); }
        conn.chat(text, type);
    },
    onWhisper(name, text) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.whisper(name, text); } },   // 悄悄話（hud 對話框 "名字 內容）
    gmItem(id, n, ench) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.gmItem(id, n, ench); } },   // ench：第 365 項選強化值（沒有＝+0）
    // 道具視窗的「售價」「賣出」（伺服器 web/WebSell）：問售價（物件編號清單；回 S_Web 23）、賣（請求編號、物件編號、數量；回 S_Web 24）
    sellQuery(ids) { if (conn && G.inWorld) conn.sellQuery(ids); },
    sellItem(req, id, n) { if (!conn || !G.inWorld) return false; G.actAt = performance.now(); conn.sellItem(req, id, n); return true; },
    signinReady: () => signin.ready(), signinOpen: () => signin.open(),   // 設定 → 系統的「每日簽到」鈕（收過伺服器的簽到狀態才有）
    inviteReady: () => invite.ready(), inviteOpen: () => invite.open(),   // 設定 → 系統的「邀請好友」鈕（伺服器第 703 項；收過 S_Web 73 而且功能開著才有）
    promoReady: () => promo.ready(), promoOpen: () => promo.open(), promoSoon: () => promo.openSoon(() => hud.toast('推廣活動目前沒有開放')),   // promoSoon：強制鈕上面的推廣鈕（站長 2026-11-08，開服後拿掉）   // 設定 → 系統的「推廣獎勵」鈕（伺服器第 710 項；收過 S_Web 74 而且功能開著才有）
    rankOpen: () => ranking.open(),   // ⊞ 選單的「排行榜」（第一名封號第 166 項起固定，視窗裡不再有「設定第一名封號」）
    marketOpen: () => { if (lv20('交易所')) market.open(); },   // ⊞ 選單的「交易所」（market.js；沒月卡也能買，上架才要月卡）
    honors: () => top1Honors(G.me), honorTag, openHonorCard: k => { if (G.me) top1.openCard(k, { id: G.me.id, name: G.me.name }); },   // 第 169 項：裝備欄的榮耀卡片   // 能力頁最下面：特殊封號＋附加能力（top1.js，第 166 項）
    selfTitle: lv => clan.selfTitleState(lv), selfTitleOpen: () => clan.selfTitle(),   // 能力頁「封號」入口：沒有血盟、40 級以上（clan.js）
    bonusLeft: () => candle.bonusLeft(), bonusOpen: () => candle.bonusOpen(),   // 能力頁的「能力點數」入口（51 級起沒點的升級點數，candle.js）
    mailOpen: () => mail.open(), mailBadge: () => mail.badge(),   // ⊞ 選單的「信箱」與紅點（mail.js，第 110 項）
    marketBadge: () => market.claims(),   // ⊞ 選單「交易所」的紅點（有東西可領）
    toiPass: id => !!(G.toiPass && G.toiPass.has(+id)),   // 第 603 項
    dollReady: () => dolls.ready(), dollOpen: t => dolls.open(t), dollBook: () => dolls.book(), treasureOpen: () => treasure.open(),
    // 站長 2026-10-25「先開放我看看效果」：伺服器還沒送（舊伺服器、重開前）也開放，當成九段都沒開；按開通提示等伺服器更新
    toiBook: () => { if (!G.toiLv) toiAsk(); return G.toiLv ? { got: G.toiLv.filter(v => v >= 0).length, total: G.toiLv.length, ready: toiReady(toiState()) } : { got: 0, total: 10, ready: false }; }, toiOpen: () => openToi(),   // 伺服器第 192 項：傲慢之塔圖鑑         // ⊞ 選單的「魔法娃娃」（收過伺服器的 S_Web 29 才有）
    // 第 393 項（站長 2026-10-28 狩獵圖鑑）：製作工匠「圖鑑」分頁的狩獵圖鑑卡；伺服器還沒送就當十區都沒開（卡片一顯示就去要）
    huntDex: () => { if (!G.huntDex) huntAsk(); const st = huntState(); return st ? { got: st.regs.filter(r => r.lv >= 0).length, total: st.regs.length, ready: huntReady(st) } : { got: 0, total: 10, ready: false }; }, huntOpen: () => openHunt(),
    // 第 457 項（站長 2026-10-29 裝備蒐藏）：製作工匠「圖鑑」分頁的裝備蒐藏卡（伺服器沒送過 S_Web 57＝null＝未開放；卡片一顯示就去要）；能力頁最下面的「裝備蒐藏」一行
    collect: () => { if (!G.collect) collectAsk(); return collectBook(G.collect, collectBag()); }, collectOpen: () => openColl(), collectSum: () => (G.collect ? G.collect.total : []),
    dollsOwned: () => dolls.owned(),   // 設定 → 召喚「沒有娃娃時自動召喚」的選單：擁有的娃娃（第 153 項）
    // 夥伴（web/WebCompanions）：設定、寄放、寵物裝備；成敗由伺服器決定（失敗回一行原因）
    compSettings(id, s) { if (conn && G.inWorld) conn.compSettings(id, s); },
    petSettings(collar, s) { if (conn && G.inWorld) conn.petSettings(collar, s); },   // 設定 → 召喚 的寵物卡：照項圈存（S_Web 11 帶設定的伺服器才收）
    compDismiss(id) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.compDismiss(id); } },
    compFeed(id) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.compFeed(id); } },
    compGear(id, slot) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.compGear(id, slot); } },
    compEquip(id, itemObjId) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.compEquip(id, itemObjId); } },
    compUnequip(id, slot) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.compUnequip(id, slot); } },
    portrait: (gfx, name) => npcPortrait(gfx, displayName(name || '')),
    trimImage,
    items: () => [...G.inv.values()].filter(it => !isGold(it)),   // 金幣只顯示在左上角（金幣圖示；背包、快捷列選單都不列；3.5 金幣重量 0，藏起來不影響負重）
    goldItem() { const g = [...G.inv.values()].find(isGold); return g ? parseItem(g) : null; },   // 倉庫存金幣用（輸入金額，不用去背包找）
    itemIcon,   // 道具圖示（icons.js：單機版 → 用戶端 /icon/ → 通用圖示，一定有圖）
    skills() {   // S_AddSkill 的 28 個等級位元遮罩 × skills 表
        //   只有五個職業的魔法（skill_level 1～22）；23 以上是龍騎士／幻術師的（已刪，剩專注、耐力、洞察給魔法商人上增益用，玩家學不到）
        const m = G.skillMasks || [];
        //   attrOff：學會了但不是自己的精靈屬性、放不出來的那一句（伺服器第 755 項；魔法視窗變灰、說明寫原因）
        return SKILLS.filter(s => s.lv <= 22).map(s => Object.assign({ learned: !!((m[s.lv - 1] || 0) & s.bit), soon: SKILL_SOON.has(s.sid), attrOff: attrWhy(s) }, s, SKILL_TEXT[s.sid] ? { effect: SKILL_TEXT[s.sid] } : null));
    },
    skillIcon,
    skillLearn: () => SKILL_LEARN,
    // 花金幣學魔法（伺服器第 68 項）：learnInfo＝伺服器給的那一筆 { price, lv }（不能花錢學＝null）；learnKnown＝收過清單（舊伺服器一直 false＝不顯示學習鈕）
    learnInfo: sid => (G.learn && G.learn.get(sid)) || null,
    summonTip: () => summon.tip(),   // 魔法視窗：召喚術的說明多一段（summon.js）
    // 伺服器第 440 項：設定 → 召喚「戴召喚控制戒指時召喚」的卡片選單、那一行的名字和叫不出來的原因（summon.js）
    summonSet: (cur, pick) => summon.openList(pick, { cur }), summonRingName: npc => summon.ringName(npc), summonRingWhy: npc => summon.ringWhy(npc),
    learnKnown: () => !!G.learn,
    spellWhere: sid => SPELL_WHERE[sid] || null,   // 第 129 項：魔法視窗、艾利溫寫「到主城的吉倫買魔法書」
    elfAttr: () => G.elfAttr, elfReset: () => G.elfReset,   // 第 117 項 艾利溫視窗：自己的精靈屬性、去除精靈力的價錢（S_Web 35 版本 2；舊伺服器 null）
    learnList() { if (conn && G.inWorld && performance.now() - G.learnAsk > 2000) { G.learnAsk = performance.now(); conn.learnMagicList(); } },   // 打開魔法視窗時要（價錢伺服器可以改）
    learnMagic(sid) {   // 確認框按了「學習」：只送技能編號；伺服器回之前（最多 3 秒）不重送
        if (!conn || !G.inWorld || performance.now() - G.learnAt < 3000) return;
        G.learnAt = G.actAt = performance.now(); conn.learnMagic(sid);
    },
    // 伺服器第 695 項：公測一鍵學魔法（站長 2026-11-07）；11/14 12:00（台灣）公測結束按鈕自己藏起來（伺服器同一刻停收）
    betaLearn: () => Date.now() < BETA_LEARN_UNTIL,
    learnAll() {
        if (!conn || !G.inWorld || !conn.learnAllMagic || performance.now() - G.learnAllAt < 3000) return;
        G.learnAllAt = G.actAt = performance.now(); conn.learnAllMagic();
    },
    // 技能視窗「解除限制」（離線版）：skillFree＝已解除（伺服器清單帶回來的）；skillLimitToggle＝切換
    skillFree: () => !!G.skillFree,
    skillLimitCan: () => !!(conn && conn.skillLimitToggle),
    skillLimitToggle() { if (conn && G.inWorld && conn.skillLimitToggle) conn.skillLimitToggle(); },
    useItem, castSkill,
    // 記憶座標（設定 → 系統，本機改動第 88 項）：清單照伺服器送的；新增只送名稱（能不能記、名稱、個數、同名都是伺服器判斷，不行回一句訊息）；
    //   刪除伺服器不回話（原版 C_DeleteBookmark）→ 送了就從清單拿掉
    bookmarks: () => G.bookmarks,
    pushState: () => pushState(), pushToggle: (k, on) => pushToggle(k, on),   // 伺服器第 534 項：系統頁「手機通知」開關（重開、被攻擊；2026-11-10 加角色回村）
    bookmarkName: () => ({ norm: bmNorm, bad: bmBad, max: BM_NAME_MAX, def: bookmarkDefault() }),   // 新增視窗：預先填的名稱、網頁先擋的規則
    bookmarkColors: () => ({ list: BM_COLORS, names: BM_COLOR_NAMES }),   // 第 95 項：字的顏色（編號＝伺服器存的）
    addBookmark(name, color) { if (!conn || !G.inWorld) return; G.actAt = performance.now(); conn.addBookmark(name, color | 0); },
    bookmarkColor(b, color) { if (!conn || !G.inWorld) return; G.actAt = performance.now(); conn.bookmarkColor(b.name, color | 0); },   // 伺服器存好送回同編號的 S_Bookmarks
    delBookmark(b) { if (!conn || !G.inWorld) return; conn.deleteBookmark(b.name); G.bookmarks = G.bookmarks.filter(x => x !== b); hud.refreshWin(); },
    dropItem(p, n) { if (conn && G.me) { G.actAt = performance.now(); conn.dropItem(G.me.x, G.me.y, p.id, n); } },
    lockOk: () => !!G.lockOk, itemLock(on, id) { if (conn && G.inWorld) conn.itemLock(on, id); },   // 第 275 項：道具鎖（道具視窗的鎖頭）
    deleteItem(p) { if (!conn || !G.inWorld) return false; G.actAt = performance.now(); conn.deleteItem(p.id); return true; },   // 道具視窗「刪除」：能不能刪伺服器判斷（C_DeleteInventoryItem）
    base: () => G.curChar,                // 選角畫面的基本能力（能力分頁當「原始能力」用，見 calc.js）
    me: () => G.me,
    equipSpecial,
    mapDrops,
    onMapDrops: () => tutorial.onDrops(),   // ⊞ →「掉寶」打開了：新版新手引導第 5 步
    teleports: () => TELEPORTS,
    // 狩獵場：展開卡片（r 小）、滑鼠停在傳送點上（r 大）就先把那裡的地圖圖抓進快取（hud.js tpPreload）
    tpPreload: (id, r) => { const t = TELEPORTS.find(x => x.id === id); if (t) world.preload(t.map, t.x, t.y, r); },
    dropFind: { items: () => dropFind.items(), tps: name => dropFind.tps(name), boss: name => dropFind.boss(name) },   // 狩獵場「搜尋掉落物」（dropFind 在下面才宣告：用的時候才去拿）
    curPos: () => G.me ? { map: G.mapId, x: G.me.x, y: G.me.y } : null,
    webTeleport,
    // 狩獵場「此地圖 NPC」：伺服器給的整張地圖清單（S_Web 17）裡有對話的（data/npccards.json）；照職稱分類（npcRank：傳送師、各種商人、倉庫、製作、其他），同職稱照名字。
    //   伺服器還沒回（或是舊伺服器不認 C_Web 14）先列看得到的；沒清單時最多 10 秒再要一次。
    //   分區：主大陸（地圖 4）一張圖就有十一個村莊、三百多隻 → 照最近的村莊傳送點分（NPC_AREA_R 格內，都不在＝野外）；
    //   回 { map, cur＝自己所在那區, areas: [{ name, list: [{ id, name, title, key }] }] }（自己那區排第一，其他照離自己近遠）。hud 預設只列自己那區。
    //   keep(key)：要列哪些（預設＝npccards 有的；製作工匠傳「npcmake 有配方的」）
    npcAreas(keep) {
        const me = G.me;
        if (!me) return null;
        const L = mapNpcList();
        if (!L && conn && G.inWorld && performance.now() - G.mapNpcsAsk > 10000) { G.mapNpcsAsk = performance.now(); conn.mapNpcs(); }
        const vil = TELEPORTS.filter(t => t.kind === '村莊' && t.map === G.mapId);
        const far = (v, x, y) => Math.max(Math.abs(v.x - x), Math.abs(v.y - y));
        const areaOf = (x, y) => { let best = null; for (const v of vil) if (!best || far(v, x, y) < far(best, x, y)) best = v; return best && far(best, x, y) <= (best.r || NPC_AREA_R) ? best.name : '野外'; };
        const by = new Map();
        for (const o of L || G.objs.values()) {
            const k = npcKey(o);
            if (o.isPc || !(keep ? keep(k) : k in NPCCARDS)) continue;
            const a = areaOf(o.x, o.y);
            if (!by.has(a)) by.set(a, []);
            by.get(a).push({ id: o.id, name: displayName((o.name || '').trim()), title: NPCCARDS[k] || '', key: k });
        }
        const rank = npcRank;
        const cur = areaOf(me.x, me.y), dist = a => { const v = vil.find(t => t.name === a); return v ? far(v, me.x, me.y) : Infinity; };
        const areas = [...by].map(([name, list]) => ({ name, list: list.sort((a, b) => rank(a.title) - rank(b.title) || a.name.localeCompare(b.name, 'zh-Hant') || a.id - b.id) }))
            .sort((a, b) => (b.name === cur) - (a.name === cur) || dist(a.name) - dist(b.name));
        return { map: G.mapId, cur, areas };
    },
    talkTo,
    npcTitle: k => NPCCARDS[k] || '', npcRank: t => npcRank(t),   // 製作工匠的 NPC 鈕：名字＋［職稱］、照職稱分類排
    // 製作工匠（craft.js）：要清單、製作都只送 NPC 和動作字串，材料夠不夠、先做中間物、扣背包＋倉庫都是伺服器
    craftList(id, acts) { if (conn && G.inWorld) conn.craftList(id, acts); },
    tutCraft: () => tutorial.craftStep(),
    tutEnh: () => tutorial.enhStep(),
    // 伺服器第 697 項：強化視窗「同樣的 N 件一起強化」交給伺服器一次做完（送出去了回 true）
    enhBatch(scrollId, goal, ids) { if (!conn || !G.inWorld || !conn.enhanceBatch) return false; G.actAt = performance.now(); conn.enhanceBatch(scrollId, goal, ids); return true; },   // 新手導覽的強化步驟進行中：強化視窗照舊播蓄力、結果特效（站長 2026-11-07）   // 新手第 20 步（做象牙塔武器卷軸）進行中：製作工匠暫時放那位 NPC
    craftMake(id, act, n) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.craftMake(id, act, n); } },
    // NPC 對話框的按鈕（npc.js）：動作字串（買、賣、領出、傳送…）與買賣／存取，成敗由伺服器決定
    npcAction(id, s) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.npcAction(id, s); } },
    npcResult(id, type, pairs) { if (conn && G.inWorld) { G.actAt = performance.now(); conn.npcResult(id, type, pairs); } },
    taxRate(id, rate) { if (conn && G.inWorld) conn.taxRate(id, rate); },   // 第 122 項：城主設稅率（C_TaxRate）
    // 線上玩家：點名字傳送到他身邊（能不能傳、落點都由伺服器判斷，失敗會回一行原因）
    openAdmin: () => admin.open(),
    partyBuffPop: () => party.buffPop(),   // 左上隊員欄的隊伍增益：點了開小視窗（party.js）
    toPlayer(id) { if (conn && G.inWorld) { G.actAt = performance.now(); stopPath(); G.talkTo = 0; G.pickTo = 0; conn.toPlayer(id); } },
    // AUTO：全部在伺服器跑，這裡只送開關／設定、收狀態與紀錄
    autoOn: () => G.autoOn,
    // 「上次離線掛機」入口：伺服器有明細（登入時收過 S_Web 20），或這次登入跳過的離線回來那段已經被新的一段取代（接著累加的不用，掛機紀錄裡就有）
    offLogAvail: () => !!(G.offLogOk || (G.offSnap && (!G.autoLog || G.autoLog.start !== G.offSnap.start))),
    autoToggle() { if (conn && G.inWorld) { changeWaitStop(); G.actAt = performance.now(); atkStop(); stopPath(); conn.autoToggle(!G.autoOn); } },   // 第 448 項：自己按了 AUTO＝不回選角了
    // 強制攻擊鈕：按一下亮、再按一下熄（站長 2026-10-22「點擊強制攻擊，移動時不要解除，除非手動解除強制鍵」）。
    //   亮著的時候點人、點怪都是強制攻擊；走路、點地面、放魔法、Esc 都不會熄。熄掉時正在強制打的那隻也停手
    forceToggle() {
        if (!G.inWorld) return;
        if (G.forceArm || (G.atk && G.atk.force)) { G.forceArm = false; if (G.atk && G.atk.force) { stopPath(); atkStop(); } forceSync(); return; }
        G.forceArm = true; G.castPick = null; forceSync();
    },
    autoSettings: () => G.autoSettings,
    autoPotions: () => AUTO_POTIONS,
    polys: () => POLYS,
    polyRec: () => tutorial.polyRec(),   // 新手任務「設定自動變身」那步：外型選單標「推薦」的（英文名；不是這步＝null）
    // 變形術的外型選單選好了：回 C_NPCAction（自己的編號＋形態英文名，"none"＝變回原形；成敗、等級夠不夠由伺服器決定，選單已經先擋掉等級不夠的）
    polyPick(name) { if (conn && G.inWorld && G.myId) { G.actAt = performance.now(); conn.npcAction(G.myId, name); } },
    shopSells: id => !SHOP_ITEMS || SHOP_ITEMS.has(id),   // 還沒讀到清單當作有賣（伺服器買不到會自己提示）
    shopTax: id => { const p = SHOP_BUY && SHOP_BUY[id]; return p && p.length >= 4 ? p[3] : 0; },   // 自動購買的稅率 %（data/shopbuy.json 第 4 欄，同伺服器 WebShop 扣的；設定→補給的「含稅」小字）
    // 買 n 個多少錢（湊整包）；不知道回 0。伺服器第 54 項起整筆算稅（WebShop.cost：n 個的原價 ＋ 原價 × 稅率 ÷ 100 捨去）；舊資料沒有原價、稅率就一包一包乘
    shopCost(id, n) {
        const p = SHOP_BUY && SHOP_BUY[id];
        if (!p) return 0;
        const packs = Math.ceil(n / p[1]);
        if (p.length < 4) return packs * p[0];
        const raw = packs * p[2];
        return raw + Math.floor(raw * p[3] / 100);
    },
    // 設定「名單」頁：這張地圖的怪（data/drops.json，第一次要才下載；同名不同編號的併成一筆）→ [{ n, lv, ids }]；還沒下載好回 null
    //   大陸只列所在地區的（areaMobs，同掉寶視窗）；all＝整張圖（名單裡已經有、但不在這一區的怪也要叫得出名字）
    mapMobs(all) {
        if (!DROPS) { if (!dropsAsk) dropsAsk = mapDrops().then(() => hud.refreshWin()); return null; }
        const by = new Map(), area = all ? null : areaMobs();
        for (const id of area ? area.ids : DROPS.maps[dropMap(G.mapId)] || []) {
            const m = DROPS.mobs[id]; if (!m) continue;
            const e = by.get(m.n);
            if (e) { e.ids.push(id); e.lv = Math.min(e.lv, m.lv); } else by.set(m.n, { n: m.n, lv: m.lv, ids: [id] });
        }
        return [...by.values()].sort((a, b) => a.lv - b.lv || a.n.localeCompare(b.n, 'zh-Hant'));
    },
    mobsArea: () => { const a = DROPS ? areaMobs() : null; return a ? a.title : ''; },   // 名單頁只列一區時那一區的名字；整張圖＝''
    bosses: map => BOSSES[map] || [],
    mapId: () => G.mapId,
    mapName: mapLabel,
    powerChanged: () => { readPower(); resize(); },
    build: () => G.build || null, buildAsk: () => { if (conn && G.inWorld) conn.build(0); }, buildDonate: n => { if (conn && G.inWorld) { G.actAt = performance.now(); conn.build(1, n); } },   // 村莊福利員「建設」分頁（npc.js）   // 系統頁的省電模式開關（hud.js）
    // 掛機紀錄的地點：掛機時記下的地名（huntHere；同一張圖才用；離線掛機回來、記錄是別張圖＝照地圖名）
    huntPlaceName: map => (G.huntPlace && G.huntPlace.map === map) ? G.huntPlace.name : mapLabel(map),
    petCollars() { if (conn && G.inWorld) conn.petCollars(); },   // 設定 → 召喚 的寵物卡：背包裡有寵物的項圈（伺服器回 petCollars）
    invIds() { if (conn && G.inWorld) conn.invIds(); },           // 背包「自動賣出」：每格是哪種道具（伺服器回 invIds）
    // 送了先記在手上（設定頁的圖示框選單選完馬上換圖示；接著再點別的開關也是從新的值改起）；伺服器夾過範圍回的 S_Web 2 到了再換成它的
    hasCard: () => cardOn(), cardKnown: () => !!G.card,   // 第 119 項：月卡（S_Web 41），自動賣出頁頂端的狀態卡、背包賣出鈕的鎖頭
    openShop: () => { if (lv20('商城')) shopOpen(); },
    shopHidden: () => SHOP_HIDDEN && !G.manager,   // ⊞ 選單不放「商城」（第 647 項）   // 「開通月卡」（自動賣出頁、隨地賣出被鎖的小卡）＝打開商城月卡區
    saveAutoSettings(s) { if (conn && G.inWorld) { conn.autoSettings(s); G.autoSettings = s; hud.refreshWin(); } },
    huntLog() { if (conn && G.inWorld) { G.logWanted = true; conn.autoState(); } },
    // 掛機紀錄「重置」：伺服器有這個指令才有鈕（G.logResetOk）；送出去後數字照伺服器推回來的 S_Web 3 換（autoLog 那邊認 G.logResetAt）
    logResetOk: () => !!G.logResetOk,
    logReset() { if (conn && G.inWorld && G.logResetOk) { G.logResetAt = performance.now(); conn.autoLogReset(); } },
    // 「上次離線掛機」（掛機紀錄視窗、掛機設定頁）：伺服器有明細就跟它要；舊伺服器＝這次登入猜著跳過的那份掛機紀錄（定格）
    offlineLog() {
        if (!conn || !G.inWorld) return;
        if (G.offLogOk) { G.offWanted = true; conn.offlineLog(); }
        else if (G.offSnap) { G.huntGuess = true; hud.showHuntLog(G.offSnap, false, true); }
    },
    onChangeChar() { changeChar(false); },   // 回選角（changeChar）
    // 「點此更新」重新載入前：記下現在玩的角色（只有名字，不碰密碼），重新登入後直接進這隻（start.js resumeChar）。
    //   遊戲連線不用先關：同帳號在寬限內重登，轉接會先關舊的（AUTO 開著的照原本規則接成離線掛機、登入後接著開）
    //   有通行碼就不用（重新載入後直接用通行碼登入同一隻）
    beforeReload() { try { if (G.inWorld && G.curChar && !passGet()) sessionStorage.setItem('l1web_upd_char', G.curChar.name); } catch (e) { /* 無痕 */ } },
});
// 右上角狀態圖示（S_Web 10）：效果編號 → 名字、圖示（effects.js；認不得的不顯示），剩幾秒照收到的時間換成到期時間，hud 自己倒數
//   raw＝{ list, at }：誘捕的對照（S_Web 34）比效果晚到時，main.js 拿同一包再畫一次，到期時間不會被往後推
function showEffects(raw) {
    const rows = [];
    G.effectIds = new Set(raw.list.map(e => e.id));   // 施法冷卻看加速、勇水（castLockMs）
    for (const e of raw.list) { const f = effectInfo(e.id, SKILLS, G.st.type); if (f) rows.push({ id: e.id, name: f.name, icon: f.icon, frame: !!f.frame, end: e.sec < 0 ? -1 : raw.at + e.sec * 1000 }); }
    // 召喚中的魔法娃娃（站長 2026-10-24「上面沒有召喚娃娃圖示與時間」）：娃娃不是伺服器的效果，照娃娃系統（dolls.js worn）補一格；剩餘時間＝魔法結晶體那份還剩多久（死亡暫停時不倒數＝不顯示秒數）
    const w = dolls.worn && dolls.worn();
    // 圖示：3.5C 用戶端的狀態圖示（站長 2026-10-26 挑 2588，tools/state-icons.mjs「魔法娃娃」）；沒有就照娃娃圖
    //   說明：效果一行是 [字, 種類]（doll-info：p＝機率觸發），說明框只要字（站長 2026-10-26 截圖「傷害,p」）
    if (w) rows.push({ id: 'doll', name: w.name, icon: stateIcon('魔法娃娃') || w.icon, frame: !stateIcon('魔法娃娃'), desc: (w.fx || []).map(x => Array.isArray(x) ? x[0] : x), end: w.left > 0 && !w.paused ? performance.now() + w.left * 1000 : -1 });
    // 主城建設完成的全服經驗加成（伺服器第 253 項）：右上角一格，到期時間照伺服器給的剩幾秒
    const bd = G.build;
    //   圖示：3.5C 用戶端 3814（站長 2026-10-26 挑的，tools/state-icons.mjs「主城建設」）；沒有就照主城傳送石的道具圖
    if (bd && bd.until > performance.now()) { let ic = stateIcon('主城建設') || ''; if (!ic) try { const t = itemById(49900); ic = t ? itemIcon(t) : ''; } catch (e) { /* 沒圖就寫字 */ } rows.push({ id: 'build', name: '主城建設', icon: ic, frame: !stateIcon('主城建設'), desc: ['全服經驗 +' + bd.pct + '%'], end: bd.until }); }
    hud.setEffects(rows);
}

// 聲音開不起來（iOS 替這個 App 開不了播放裝置；audio.js 判斷，一次開頁只叫一次）：
//   提示用 start.js 那個 toast（掛在 body、z-index 蓋過彈出視窗，登入／選角／遊戲中都看得到；遊戲的 #lmui-toast 在 #game 裡，彈窗開著會被蓋住），
//   遊戲中另外記一則系統訊息（toast 幾秒就消失，聊天框「系統」分頁還找得到）；不浮上來，免得同一句在畫面上出現兩次
onAudioStuck(t => { start.toast(t, 6000); if (G.inWorld) hud.chat(t, 'sys', 'c-sys', true); });
// 用道具（C_ItemUSe）：要帶什麼欄位看道具的 useType（ItemTable._useTypes）
// at＝施法道具點選的對象（tapAt 等目標時傳進來）
// 站長 2026-11-03「使用力量、敏捷魔法頭盔的魔法後不會自動再換回原本的頭盔」：手動換上魔法頭盔（快捷格、背包）時記住原本戴的那頂，
//   放了那頂頭盔給的魔法之後 HELM_BACK_MS 內沒再放頭盔的魔法 → 自動換回原本那頂（原本沒戴就脫掉不管它）。自己又換別頂頭盔＝取消
//   魔法頭盔給的魔法同 hud.js HELM_SK（伺服器 L1EquipmentSlot.setMagicHelm）；AUTO 自己換頭盔放（伺服器第 515 項）不經過這裡
const MAGIC_HELM = { 20008: [43], 20013: [26, 43], 20014: [1, 19], 20015: [12, 13, 42], 20023: [43, 54] }, HELM_BACK_MS = 2500;
let helmBack = null, helmBackT = 0, helmOff = null;   // helmBack { from: 換上的魔法頭盔物件編號, to: 原本那頂 }；helmOff：剛脫下的那頂（網頁換頭盔＝先脫舊的再穿新的，hud.js swapEquip）
const isHelm = q => !!(q && q.tpl && q.tpl.k === 'a' && q.tpl.type === 'helm');
const wornHelm = () => [...G.inv.values()].map(parseItem).find(q => q.equipped && isHelm(q)) || null;
function noteHelm(p) {
    if (!isHelm(p)) return;
    if (p.equipped) { helmOff = MAGIC_HELM[p.tpl.id] ? null : { id: p.id, at: performance.now() }; return; }   // 脫下：記著（換上魔法頭盔時拿來當「原本那頂」）
    clearTimeout(helmBackT);
    const cur = wornHelm(), prev = cur ? cur : helmOff && performance.now() - helmOff.at < 5000 ? parseItem(G.inv.get(helmOff.id) || { name: '' }) : null;
    helmOff = null;
    if (!MAGIC_HELM[p.tpl.id]) { helmBack = null; return; }   // 自己換回普通頭盔＝不用再換
    if (prev && prev.id && !MAGIC_HELM[prev.tpl && prev.tpl.id]) helmBack = { from: p.id, to: prev.id };
    else if (helmBack && prev && prev.id === helmBack.from) helmBack = { from: p.id, to: helmBack.to };   // 魔法頭盔換另一頂魔法頭盔：還是換回最早那頂
    else helmBack = null;
}
function helmCast(s) {
    if (!helmBack) return;
    const cur = wornHelm();
    if (!cur || cur.id !== helmBack.from) { helmBack = null; return; }
    if (!(MAGIC_HELM[cur.tpl.id] || []).includes(s.sid)) return;
    clearTimeout(helmBackT);
    helmBackT = setTimeout(() => {
        const b = helmBack; helmBack = null;
        if (!b || !conn || !G.inWorld) return;
        const now = wornHelm(), to = G.inv.get(b.to);
        if (!now || now.id !== b.from || !to) return;
        useItem(now);   // 先脫魔法頭盔（同部位要先空出來）
        let n = 0;
        const put = () => { if (!conn || !G.inWorld) return; const w = wornHelm(); if (!w) { const t = G.inv.get(b.to); if (t) useItem(parseItem(t)); return; } if (++n < 20) setTimeout(put, 100); };
        setTimeout(put, 100);
    }, HELM_BACK_MS);
}
function useItem(p, target, at) {
    if (!conn || !G.inWorld) return;
    if (!target) noteHelm(p);
    // 榮耀卡片（伺服器第 169 項）：使用＝開自己的榮耀卡，不送伺服器（伺服器收到也不做事）；麻痺、冰凍中也能看
    if (!target && honorKind(p) >= 0) { if (G.me) top1.openCard(honorKind(p), { id: G.me.id, name: G.me.name }); return; }
    if (helpless()) { frozenWarn(); return; }   // 麻痺、睡眠、冰凍、暈眩中不能用道具（站長 2026-10-24「被冰凍的狀況下還能喝水」；伺服器第 155 項也擋）
    if (!target && lure.block(p)) return;   // 誘捕道具：舊伺服器會當食物吃掉 → 擋下（lure.js）；新伺服器照一般道具送
    if (!target && boxAll.pick(p)) return;   // 守護團獎金箱子：先跳「開啟／全開」（boxall.js）
    if (!target && fruit.pick(p)) return;   // 進化果實／勝利果實：先跳視窗選哪隻寵物吃（fruit.js）
    const u = p.it.useType, me = G.me, lk = G.lock || me;
    if (p.slot === 'arrow' && p.tpl) G.arrowTpl = p.tpl.id;   // 選箭（伺服器回「%0 被選擇了」）
    if (p.slot === 'doll') G.lastDoll = p.id;
    if (target) { G.actAt = performance.now(); return conn.useItem(p.id, w => w.d(target.id)); }   // 強化／鑑定卷軸：對象道具
    // 施法道具（閃電魔杖＝烏木魔杖、楓木魔杖、驅逐魔杖…）：跟放魔法一樣（castSkill）——有鎖定的（活著的）就對牠用，沒有就等玩家點目標（點自己＝對自己）。
    //   原本沒鎖定一律對自己用：閃電魔杖對自己沒傷害、次數照扣（站長 2026-10-22「使用閃電魔杖目前有沒效果，把它改成像使用魔法可以攻擊目標一樣」）
    if (u === 5 || u === 17) {
        let t = at || (G.lock && G.objs.has(G.lock.id) && G.lock.act !== 'death' ? G.lock : null);
        if (!at && pvpNoForce(t)) t = null;   // 鎖定的是玩家：沒強制不對他用，等玩家點目標
        if (!t) { G.castPick = { useItem: p }; hud.closeAll(); hud.float('點選「' + p.base + '」的目標', true); return; }   // 戰鬥中的提示浮在快捷列上方，不擋畫面中間（hud.float）
        if (t !== G.me && !inScreen(t)) { hud.float('太遠了', true); return; }   // 伺服器只認畫面內的對象（太遠的次數照扣、沒傷害）
        G.actAt = performance.now();
        return conn.useItem(p.id, w => w.d(t.id).h(t.x).h(t.y));
    }
    if (braveBlock(p)) return;
    G.actAt = performance.now();
    if (u === 30 || u === 8) return conn.useItem(p.id, w => w.d(lk ? lk.id : 0));   // 對人用的卷軸、復活卷軸
    if ((u === 29 || (u === 6 && tplOf(p) === TELE_SCROLL && rotcOn())) && G.bookmarks.length) { bookmarkScroll(p); return; }   // 能飛記憶座標的卷軸：先選飛哪裡
    if (u === 6 || u === 29) return conn.useItem(p.id, w => w.h(G.mapId).d(0));    // 瞬間移動卷軸：沒有記憶座標＝隨機傳送
    if (u === 16) { polyScroll(p); return; }   // 變形卷軸：先選外型
    if (u === 12 || u === 13 || u === 28) { hud.toast('尚未開放'); return; }   // 信紙、空白魔法卷軸
    // 主城傳送石（伺服器第 157 項，取代原本右側主城鈕）：能不能傳、冷卻由伺服器判斷；先預載奇岩廣場的圖（設定改了只是預載不準）
    if (tplOf(p) === HOME_STONE) world.preload(4, 33438, 32798);
    if (p.tpl && p.tpl.k === 'e' && p.tpl.type !== 'light') csfx.item(p.it.gfx);   // 吃、喝、打開：3.5C 用戶端那個圖示的聲音（equipsound.def；裝備、燈在穿上／點亮時放，見 invUpdate）
    conn.useItem(p.id);
}
// 勇敢類只有對的職業喝得了（伺服器 C_ItemUSe 原版規則）：喝錯的伺服器說「沒有任何事情發生」、藥水照扣（王族喝勇敢藥水走路沒變快，第 103 項）→ 先擋下、不送，
//   提示這個職業該喝哪一種（站長 2026-10-22「藥水提醒」）。職業：0 王族、1 騎士、2 妖精、3 法師、4 黑暗妖精、5 龍騎士、6 幻術師
const BRAVE_ITEMS = [
    [[40014, 140014, 41415, 49305], [1]],      // 勇敢藥水、受祝福的、強化勇氣的藥水、福利勇敢藥水：騎士
    [[40068, 140068, 49304], [2]],             // 精靈餅乾、受祝福的、福利森林藥水：妖精
    [[40031], [0]],                            // 惡魔之血：王族
    [[49158], [5, 6]],                         // 生命之樹果實：龍騎士、幻術師
    [[40733], [0, 1, 2, 3, 4]],                // 名譽貨幣：龍騎士、幻術師以外
];
const CLASS_NAME = ['王族', '騎士', '妖精', '法師', '黑暗妖精', '龍騎士', '幻術師'];
const BRAVE_OF = { 0: '惡魔之血', 1: '勇敢藥水', 2: '精靈餅乾', 5: '生命之樹果實', 6: '生命之樹果實' };
function braveBlock(p) {
    const id = tplOf(p), row = BRAVE_ITEMS.find(r => r[0].includes(id)), cls = G.st.type;
    if (!row || cls == null || row[1].includes(cls)) return false;
    hud.toast(BRAVE_OF[cls] ? CLASS_NAME[cls] + '請喝' + BRAVE_OF[cls] : CLASS_NAME[cls] + '喝了不會有效果');
    return true;
}
// 能飛記憶座標的（站長 2026-10-22，同伺服器 web/WebBookmark.scrollCanFly／skillCanFly）：祝福的瞬間移動卷軸（useType 29「btele」，只有 140100）一定可以；
//   戴著傳送控制戒指（20288）時，瞬間移動卷軸（40100）、瞬間移動術（魔法 5）也可以。其他（象牙塔、全體傳送術的卷軸、指定傳送卷軸、集體傳送術）照原本直接隨機瞬移
const TELE_SCROLL = 40100, ROTC = 20288, SK_TELEPORT = 5;
const tplOf = p => TPL_OF.has(p.id) ? TPL_OF.get(p.id) : p.tpl ? p.tpl.id : 0;
const rotcOn = () => [...G.inv.values()].some(it => { const p = parseItem(it); return p.equipped && tplOf(p) === ROTC; });
// 有記憶座標就先跳選單（記憶座標＋照原本的隨機瞬移），選了才用——
//   C_ItemUSe 帶 H 地圖、D 記憶座標編號（0＝隨機）。能不能飛伺服器判斷（本機改動第 88 項：要是自己的、在大陸／說話之島、這裡能用卷軸傳；不行回一句、不扣卷軸）
function bookmarkScroll(p) {
    hud.bookmarkPick({ title: p.full, list: G.bookmarks, pick: id => {
        if (!conn || !G.inWorld || !G.inv.has(p.id)) return;
        G.actAt = performance.now();
        conn.useItem(p.id, w => w.h(G.mapId).d(id));
    } });
}
// 記憶座標的名稱（伺服器 web/WebBookmark，第 95 項起：空格、符號全形半形都收，前後空白去掉，最多 12 字；同名不分大小寫）。
//   網頁先擋伺服器存不進去的字：控制字元、換行，還有 Big5 沒有的字（big5.js 編不出來＝送過去變成「?」，伺服器分不出來，只能這裡擋）
const BM_NAME_MAX = 12;
function bmNorm(s) { return (s || '').trim(); }   // trim 也去掉全形空白
function bmBadChar(ch) {
    const c = ch.codePointAt(0);
    if (c < 0x20 || (c >= 0x7f && c <= 0x9f) || c === 0x2028 || c === 0x2029 || c > 0xffff) return true;
    const b = big5Encode(ch);
    return ch !== '?' && b.length === 1 && b[0] === 0x3f;
}
function bmBad(s) { return [...s].some(bmBadChar); }
// 字的顏色（第 95 項，伺服器 WebBookmark.COLORS＝8，編號同順序；0＝白色）：深色背景、地圖畫面上都看得清楚的
const BM_COLORS = ['#f5f0e6', '#fde047', '#fb923c', '#f87171', '#f9a8d4', '#c4b5fd', '#7dd3fc', '#86efac'];
const BM_COLOR_NAMES = ['白', '黃', '橘', '紅', '粉紅', '紫', '藍', '綠'];
// 清單、選單照名稱排（站長 2026-10-22「開頭同字的會自動排列在一起」）：中文排序、數字照數值大小（古魯丁2 在 古魯丁10 前面）
const bmCollator = new Intl.Collator('zh-TW', { numeric: true, sensitivity: 'base' });
function bmSort() { G.bookmarks.sort((a, b) => bmCollator.compare(a.name, b.name) || a.id - b.id); }
// 新增時預先填的名稱：所在地名（左下那個，大陸上＝最近的傳送點），最多 12 字；跟已有的同名就接 2、3…
function bookmarkDefault() {
    const base = bmNorm([...hereName()].filter(c => !bmBadChar(c)).join('').slice(0, BM_NAME_MAX));
    if (!base) return '';
    const has = n => G.bookmarks.some(b => b.name.toLowerCase() === n.toLowerCase());
    if (!has(base)) return base;
    for (let i = 2; i < 100; i++) { const n = base.slice(0, BM_NAME_MAX - String(i).length) + i; if (!has(n)) return n; }
    return '';
}
// 變形卷軸（useType 16「sosc」：變形卷軸、受祝福的、象牙塔變身卷軸、福利變形藥水）：跳外型選單（同變形術那個 hud.polyMenu），選了才用——
//   C_ItemUSe 帶形態英文名（伺服器 C_ItemUSe.usePolyScroll：等級夠才變、變了才扣一張；變形卷軸 1800 秒、受祝福的 2100 秒）。
//   原本這裡只說「尚未開放」、什麼都沒送（站長 2026-10-19「變身卷無法使用」）
//   站長 2026-11-01「變捲視窗多一個還原按鈕」：變身中下面多一顆「變回原形」＝帶空字串用卷軸（伺服器 usePolyScroll：解除變身，照原版也扣一張）
function polyScroll(p) {
    const use = name => {
        if (!conn || !G.inWorld || !G.inv.has(p.id)) return;
        G.actAt = performance.now();
        conn.useItem(p.id, w => w.s(name));
    };
    hud.polyMenu({ level: G.st.level || 0, gfx: G.me ? G.me.gfx : 0, title: p.base, pick: use,
        morphed: !!(G.me && !CLASS_OF_GFX[G.me.gfx]), revert: () => use(''), revertText: '變回原形（用掉 1 張）' });
}
// 紙娃娃的箭、娃娃格：伺服器不送「裝備中」——箭＝玩家選過的那種（沒選就是背包裡第一支，同 L1PcInventory.getBullet），娃娃＝召喚中的那個
function equipSpecial() {
    const items = [...G.inv.values()].map(parseItem), arrows = items.filter(p => p.slot === 'arrow');
    const a = arrows.find(p => p.tpl && p.tpl.id === G.arrowTpl) || arrows[0];
    return { arrow: a ? a.id : 0, doll: G.inv.has(G.dollItem) ? G.dollItem : 0 };
}
// 施法音效：3.5C 用戶端的魔法聲音在效果圖上（list.spr）→ 等伺服器回效果圖、播出來那一刻才放（onAttack／onRangeSkill／effect；
//   效果圖落在別人身上、地上的，認「剛剛自己放的那個效果圖」G.castFx）。3.5C 效果圖沒聲音的照原本：自己按的當下就放（伺服器回來的效果圖 0.7 秒內不再放一次）
function castSfx(s) {
    //   等伺服器回的這段時間先把音檔讀好（第一次放的 wav 大，手機上到那一幀才讀會來不及，combatsfx.js preloadEffect）
    if (s.sid === 87) csfx.preloadEffect(STUN_GFX);   // 暈眩聲也先讀好
    if (s.gfx && csfx.hasEffect(s.gfx)) { G.castFx = { gfx: s.gfx, at: performance.now() }; csfx.preloadEffect(s.gfx); return; }
    G.castSfxAt = performance.now(); csfx.spell(s.name);
}
// 施法冷卻（魔法測試 2026-10-18：網頁可以連點連放、沒有冷卻顯示）：送出一個魔法後，全部魔法鎖住一段時間，鎖住時再點不送。
//   時間照伺服器：AcceleratorChecker 的施法間隔＝外型的施法動作（spr_action 18 有方向／19 無方向；技能表 action_id 18＝有方向）
//   × 加速 0.75（緩速 ÷0.75）× 勇水 0.75（精靈餅乾 0.87），跟技能表的 reuseDelay（全部魔法共用的延遲）取大的，再多留 5%。
//   效果只看得到伺服器送來的（S_Web 10）；裝備、娃娃給的加速看不到 → 鎖久一點（寧可慢一點，不要送了被伺服器丟掉）
const SPELL_HASTE = [43, 54, 1001], SPELL_SLOW = [29, 76, 152];   // 加速術、強力加速術、自我加速藥水；緩速術、集體緩速術、地面障礙
// 施法動作本身多久（普通攻擊只等這段，見 atkCheck）。站長 2026-11-07「衝暈完之後不能攻擊」：原本普通攻擊也等到魔法延遲結束（衝擊之暈 1.5 秒、尖刺盔甲 5 秒）
function castActMs(s) {
    const t = (G.me && SPRATK[G.me.gfx]) || {};
    let ms = s.act === 18 ? t[18] : s.act ? t[19] : Math.max(t[18] || 0, t[19] || 0);   // 舊資料沒有 act：兩種取長的
    if (!ms) ms = t[18] || t[19] || 800;
    return ms * mySpeed('spell');   // 一段＋二段＋三段（同伺服器 getRightInterval；原本沒算超級加速、巧克力蛋糕、裝備加速）
}
function castLockMs(s) { return Math.round(Math.max(castActMs(s), s.cd || 0) * 1.05); }
function castLocked() {
    const left = (G.castUntil || 0) - performance.now();
    if (left <= 0) return false;
    // 浮在快捷列上方（同系統訊息），不用畫面中間的提示：連按魔法時一直蓋在戰鬥畫面正中間（站長 2026-10-23「還在施法中字幕不要擋在戰鬥畫面」）
    if (performance.now() - (G.castWarnAt || 0) > 600) { G.castWarnAt = performance.now(); hud.float('還在施法中'); }
    return true;
}
function castSent(s) {   // 魔法送出去了：音效＋鎖住（快捷列、魔法視窗的灰色遮罩照這個倒數）
    castSfx(s);
    helmCast(s);
    const ms = castLockMs(s), now = performance.now();
    G.castUntil = now + ms;
    G.castActUntil = now + Math.round(castActMs(s) * 1.05);
    hud.setCastLock(G.castUntil, ms);
}
// 只認自己學會的魔法（喝藥水、別人幫你加的效果圖可能跟某個魔法一樣，不能當成你在施法）
function spellEcho(gfx) {
    if (performance.now() - (G.castSfxAt || 0) < 700) return;
    const m = G.skillMasks || [];
    const s = SKILLS.find(x => x.gfx === gfx && x.lv <= 22 && ((m[x.lv - 1] || 0) & x.bit));
    if (s) csfx.spell(s.name);
}
// 自己手上武器的種類（武器揮擊音用）；沒拿＝空字串
function myWeaponType() {
    for (const it of G.inv.values()) { const p = parseItem(it); if (p.equipped && p.slot === 'wpn') return (p.tpl && p.tpl.type) || 'other'; }
    return '';
}
const hitBy = new Map();   // 自己打過的怪 → 最後打的時間（怪死掉時放死亡音：只放自己最近 10 秒打過的，別人打死的不吵）
// 誰 → 最後一下「畫面上打到」的時間（performance.now）。伺服器打死的那一刻就送死亡動作，但畫面上那一刀還在揮（等走完、揮到 45% 才打中）
//   → 死亡動作、死亡音效等到這個時間之後才播（站長 2026-10-17「怪還沒打死就先出死掉的聲音」）
const impactAt = new Map();
// 施法（C_UseSkill）：攻擊／輔助魔法要對象——有鎖定就用鎖定的，沒有的話輔助魔法給自己、攻擊魔法等玩家點目標
const XY_ONLY = new Set([58, 63]), MAP_ONLY = new Set([5, 69]);   // 火牢、治癒能量風暴／指定傳送、集體傳送術
// 網頁還做不到的魔法（不擋會照扣魔力和魔法寶石）→ 按了只說「尚未開放」、不送；魔法視窗的說明也標出來（skills() 的 soon）。目前沒有：
//   變形術 67：伺服器送 monlist → hud.polyMenu 外型選單 → polyPick 回 C_NPCAction；提煉魔石 100：stone.js 選魔石、次數（伺服器連續提煉）；
//   呼喚盟友、援護盟友 116／118：先跳血盟成員選人視窗，名字送給伺服器，見 castSkill／clan.js callPick
const SKILL_SOON = new Set();
// 說明照網頁實際的效果改寫（技能表的說明寫「傳送到記憶座標」，網頁沒有記憶座標 → 伺服器 L1SkillUse 沒有書籤時同一張地圖 200 格內隨機）
const SKILL_TEXT = { 5: '隨機傳送到同一張地圖的某處', 69: '和身邊 3 格內的血盟成員一起，隨機傳送到同一張地圖的某處' };
// 接在說明後面的一句（魔法視窗、狀態圖示、魔法書說明都看得到）：激勵士氣、鋼鐵士氣伺服器 L1SkillUse 互斥（放一個會蓋掉另一個），衝擊士氣可以並存
//   （站長 2026-11-05 全面測試 低 14）；tools/skill-notes.json 也補了，資料重產後這裡不會重複接
const SKILL_ADD = { 114: '與鋼鐵士氣不能同時存在', 115: '與激勵士氣不能同時存在' };
// 伺服器第 755 項改了效果、資料（data/skills.json）還是舊說明的：整句換掉（tools/skill-notes.json 也改了，重產後一樣）
const SKILL_FIX = { 103: '使目標失明 64 秒，畫面變暗；對怪物沒有作用', 174: '目標被弓箭攻擊的迴避率變為 0；怪物被弓、鐵手甲打時命中 +3' };
// 沒鎖定目標時給自己：只有增益（技能表 type 2）、治癒（16）、其他（128）。機率類（1：緩速、魔力奪取…）、詛咒類（4：毒咒、木乃伊的詛咒…）、
//   復活（32）要點目標（測試回報 2026-10-18：弱化魔法沒點目標放到自己身上，被自己的木乃伊詛咒麻痺）
//   精準目標（113，技能表算增益）標自己沒有用 → 也要點目標
const selfOk = s => s.sid !== 113 && (s.type & (2 | 16 | 128)) !== 0 && (s.type & (1 | 4 | 32)) === 0;
// 鎖定怪物時放增益魔法（技能表 type 2、對象含怪物）：沒強制＝放自己（站長 2026-11-05 全面測試 H2「從魔法頁或快捷鍵放增益魔法會放到怪身上」：扣魔、自己沒效果、加速術還幫怪加速）。
//   符合的：神聖武器 8、解毒術 9、聖潔之光 37、加速術 43、祝福魔法武器 48、水之元氣 170——幫怪放都沒意義；要對怪放照樣按強制（強制鈕、Ctrl）
const buffSelf = s => s.target === 'buff' && (s.to & 2) && (s.type & 2) && (s.type & (1 | 4 | 32)) === 0;
// 神聖武器、祝福魔法武器：伺服器（L1SkillUse）對象沒拿武器只回一行系統訊息 79、魔力照扣 → 放自己時先看手上有沒有武器（同擬似魔法武器）
const NEED_WPN = new Set([8, 48]);
// 背包裡這種道具（道具表編號）有幾個；名字對不到道具表的不算（施法材料都是一般道具，對得到）
function matCount(itemId) { let n = 0; for (const it of G.inv.values()) { const p = parseItem(it); if (p.tpl && p.tpl.id === itemId) n += p.count || 1; } return n; }
// 伺服器「在畫面內」（Point.isInScreen：橫加直 18 格以內一定算）：射程 -1 的魔法、閃電魔杖都照這個
const inScreen = o => Math.abs(o.x - G.me.x) + Math.abs(o.y - G.me.y) <= 18;
// 畫面內最近的怪物屍體（造屍術用）：死亡動作中的怪，不算玩家、寵物、召喚獸
function nearestCorpse() {
    let best = null, bd = 1e9;
    for (const o of G.objs.values()) {
        if (o.act !== 'death' || o.isPc || o.isItem || o.master || !isMob(o) || !inScreen(o)) continue;
        const d = Math.max(Math.abs(o.x - G.me.x), Math.abs(o.y - G.me.y));
        if (d < bd) { bd = d; best = o; }
    }
    return best;
}
// 精靈屬性魔法放不放得出來（同伺服器第 755 項 L1SkillUse：17～22 級有屬性的魔法只能放自己選的屬性；弱化屬性 133 要先選屬性）：
//   放不了回那一句（同伺服器的字），可以回 ''。還不知道自己的屬性（G.elfAttr null：舊伺服器、還沒收到）不擋，照伺服器
const ELF_ATTR_NAME = { 1: '地', 2: '火', 4: '水', 8: '風' };
function attrWhy(s) {
    const mine = G.elfAttr;
    if (G.st.type !== 2 || mine == null || !s) return '';
    if (s.lv >= 17 && s.lv <= 22 && ELF_ATTR_NAME[s.attr] && s.attr !== mine)
        return mine ? '這是' + ELF_ATTR_NAME[s.attr] + '屬性魔法，你的屬性是' + (ELF_ATTR_NAME[mine] || '無') + '。' : '要先選精靈屬性才能用這個魔法。';
    if (s.sid === 133 && !mine) return '要先選精靈屬性才能用這個魔法。';
    return '';
}
// hot＝從快捷列按的（F1～F12、點格子）：鎖定的是玩家也直接放攻擊魔法——鎖定就是自己選的目標（站長 2026-10-22「如果有鎖定角色點快捷鍵的技能可以直接施放」）；
//   魔法視窗按的照舊要強制或再點一次目標
function castSkill(s, target, hot) {
    if (!conn || !G.inWorld || !G.me) return;
    if (SKILL_SOON.has(s.sid)) { hud.toast('尚未開放'); return; }
    { const why = attrWhy(s); if (why) { hud.toast(why); return; } }   // 別系的精靈屬性魔法（第 755 項）：不送
    // 召喚屬性精靈／召喚強力屬性精靈：伺服器（L1BuffUtil）身邊有任何寵物、召喚獸、迷魅的怪就不召喚、也不說，魔力和精靈玉照扣（2026-10-18 妖精魔法測試回報）
    if ((s.sid === 154 || s.sid === 162) && G.comps && G.comps.length) { hud.toast('身邊已經有寵物或召喚獸'); return; }
    // 召喚術戴著召喚控制戒指：伺服器先扣魔力、魔法寶石再跳清單，身邊夥伴佔滿時選了也叫不出來 → 先說原因、不送（summon.js blocked）
    if (s.sid === 51) { const why = summon.blocked(); if (why) { hud.toast(why); return; } }
    // 材料（精靈玉、魔法寶石…）不夠：伺服器只回一行系統訊息 299，玩家看不出是缺什麼（站長 2026-10-22「召喚屬性精靈無法使用」：背包沒有精靈玉）→ 先說缺什麼、不送
    if (s.item && s.itemN && matCount(s.item) < s.itemN) { hud.toast((s.itemName || '材料') + '不夠，要 ' + s.itemN + ' 個'); return; }
    if (helpless()) { frozenWarn(); return; }   // 麻痺、睡眠、冰凍、暈眩中：伺服器不收施法
    if ((s.sid === 87 || s.sid === 91) && myWeaponType() !== 'tohandsword') { hud.toast(s.name + '要裝備雙手劍'); return; }
    if (s.sid === 90 && ![...G.inv.values()].map(parseItem).some(p => p.equipped && p.slot === 'shield' && p.tpl && p.tpl.type === 'shield')) { hud.toast('堅固防護要裝備盾牌'); return; }   // 伺服器第 700 項補   // 伺服器第 700 項
    if (castLocked()) return;
    G.actAt = performance.now();
    // 呼喚盟友（116）、援護盟友（118）：先挑一位線上的血盟成員，名字送給伺服器；對方同不同意、傳不傳得過去都照伺服器的訊息
    if (s.sid === 116 || s.sid === 118) {
        hud.closeAll();
        clan.callPick(s, name => {
            if (!conn || !G.inWorld || castLocked()) return;
            G.actAt = performance.now();
            conn.useSkill(s.sid, { name }); castSent(s);
        });
        return;
    }
    // 瞬間移動術＋傳送控制戒指（第 88 項）：有記憶座標先選飛哪裡（C_UseSkill 帶記憶座標編號，0＝隨機）
    if (s.sid === SK_TELEPORT && rotcOn() && G.bookmarks.length) {
        hud.bookmarkPick({ title: s.name, list: G.bookmarks, pick: id => {
            if (!conn || !G.inWorld || castLocked()) return;
            G.actAt = performance.now();
            conn.useSkill(s.sid, { mapOnly: true, map: G.mapId, bm: id }); castSent(s);
        } });
        return;
    }
    if (MAP_ONLY.has(s.sid)) { conn.useSkill(s.sid, { mapOnly: true, map: G.mapId }); castSent(s); return; }
    // 對道具施法（L1SkillUse：目標欄位讀成道具編號）：擬似魔法武器、暗影之牙、創造魔法武器＝身上的武器，鎧甲護持＝身上的盔甲
    const ITEM_SKILL = { 12: 1, 107: 1, 73: 1, 21: 2 };
    if (ITEM_SKILL[s.sid]) {
        const it = [...G.inv.values()].map(parseItem).find(p => p.equipped && p.it.useType === ITEM_SKILL[s.sid]);
        if (!it) { hud.toast(ITEM_SKILL[s.sid] === 1 ? '要先拿著武器' : '要先穿上盔甲'); return; }
        conn.useSkill(s.sid, { id: it.id, x: G.me.x, y: G.me.y }); castSent(s); return;
    }
    // 提煉魔石：列出背包的一～四級黑魔石讓玩家點，目標欄位送那顆的物件編號（伺服器 L1SkillUse BRING_STONE；技能表寫「無對象」但目標欄位照樣被當成道具編號）
    //   本機改動第 123 項：改成選一種、填次數，伺服器連續提煉（stone.js）；舊伺服器退回一次一顆
    if (s.sid === 100) { hud.closeAll(); stone.open(s); return; }
    if (s.target === 'none') { conn.useSkill(s.sid); castSent(s); G.castShot = { s, t: null }; return; }
    // 造屍術（41）要對怪物的屍體放，屍體 3 秒就消失（伺服器 NpcDeletionTime），開魔法視窗再點屍體來不及（站長 2026-10-22「招喚的魔法都檢查看看」）
    //   → 沒點到屍體就對畫面內最近的一具放；沒有屍體就說，不送
    if (s.sid === 41 && !(target && target.act === 'death')) {
        const c = nearestCorpse();
        if (!c) { hud.toast('身邊沒有怪物的屍體'); return; }
        target = c;
    }
    // 鎖定的已經死了（只放魔法打死的，紅圈還留在屍體上）：不算目標（復活類照舊對屍體放）。不然對屍體送出去，伺服器照扣魔力、什麼都沒發生（站長 2026-10-24「沒有選到目標會耗魔力」）
    let t = target || (G.lock && G.objs.has(G.lock.id) && (G.lock.act !== 'death' || (s.type & 32)) ? G.lock : null);
    // AUTO 開著、沒鎖定別隻（或鎖定的已經死了）：攻擊魔法直接放在 AUTO 正在打的那隻（站長 2026-10-22「掛機選擇目標後，快捷鍵按攻擊魔法直接打那隻，不用再點一次目標」）。
    //   攻擊魔法＝技能表 type 64（同設定頁的攻擊魔法）；AUTO 的目標伺服器有送（S_Web 13 → G.autoTarget，腳下紅圈）。施法照樣走 C_UseSkill，伺服器照原本檢查
    if (!target && G.autoOn && G.autoTarget && s.target === 'attack' && (s.type & 64)) {
        const gone = o => !o || o.act === 'death' || o.sunk || o._hidden, a = G.objs.get(G.autoTarget);
        if (gone(t)) t = gone(a) ? null : a;
    }
    // 對玩家、血盟、隊伍的輔助、治癒魔法沒鎖定＝給自己（弱化類要點目標）。血盟／隊伍那幾招（通暢氣脈術、體魄強健術、狂暴術、聖結界，對象 4／12）
    //   原本只認對象含玩家（1）→ 一定要點目標，可是點不到自己（tapAt 跳過自己）＝單人放不出來；伺服器 isTarget 本來就收自己（2026-10-18 法師魔法測試回報）
    if (!t && s.target === 'buff' && (s.to & (1 | 4 | 8)) && selfOk(s)) t = G.me;
    // 治癒魔法（type 16、對象 buff）對著怪物（站長 2026-10-30「點選怪物，怪物不是不死系的，也沒有按強制鍵正常是不能幫他補的，但是按了快捷鍵會幫他補血」）：
    //   怪物、不是不死系、沒強制（強制鈕、Ctrl）→ 補自己；不死系照舊對牠放（治癒術打不死系）。還不知道是不是不死系（掉寶資料還沒到，第一次按）也補自己，要打不死系按強制
    if (t && t !== G.me && (s.type & 16) && s.target === 'buff' && mobTarget(t) && !G.forceArm && !G.ctrl && mobUndead(t) !== true) t = G.me;
    if (t && t !== G.me && buffSelf(s) && mobTarget(t) && !G.forceArm && !G.ctrl) t = G.me;   // 增益魔法對著怪物：沒強制改放自己（buffSelf）
    if (t === G.me && NEED_WPN.has(s.sid) && !myWeapon()) { hud.toast('要先拿著武器'); return; }
    if (!target && !hot && s.target === 'attack' && pvpNoForce(t)) t = null;   // 鎖定的是玩家：攻擊魔法沒強制不打他，等玩家點目標（點了才算自己選的）
    if (!t) { G.castPick = s; hud.closeAll(); hud.float('點選「' + s.name + '」' + (XY_ONLY.has(s.sid) ? '要放的地方' : '的目標'), true); return; }   // 收起視窗才點得到場景裡的人；提示浮在快捷列上方，不擋畫面中間
    G.castPick = null;
    // 對別人放、技能表有距離的（衝擊之暈 1 格、寒冷戰慄 3 格…）超過距離：先走過去（同點 NPC 走過去說話），進到距離內再放（castWalkCheck）；
    //   走不到、AUTO 開著（不能自己走）＝「太遠了」不送。伺服器照扣魔力、做動作，但距離外的目標沒效果、也不說（2026-10-18 測試回報衝擊之暈隔 2 格）
    if (t !== G.me && t.id && s.range > 0 && tooFar(t, s.range)) {
        if (!G.autoOn) { atkStop(); goNear(t.x, t.y); if (G.path && G.path.length) { G.castWalk = { s, id: t.id, at: performance.now() }; return; } }
        hud.float('太遠了，要在 ' + s.range + ' 格內', true); return;
    }
    conn.useSkill(s.sid, XY_ONLY.has(s.sid) ? { xyOnly: true, x: t.x, y: t.y } : Object.assign({ id: t.id, x: t.x, y: t.y }, s.sid === 113 ? { msg: '' } : null));
    if (s.sid === 113) playAt(G.me, 'skill');   // 精準目標：伺服器不送施法動作（L1SkillUse TRUE_TARGET 直接 return）→ 自己播（2026-10-18 測試回報）
    castSent(s);
    G.castShot = { s, t: t === G.me ? G.me : t.id ? t.id : { x: t.x, y: t.y } };   // 按住 F 鍵連放用（hotHoldCheck）：剛放出去的魔法和目標（自己／物件編號／地點）
}
// 電腦版按住 F1～F12 不放＝同一個魔法對同一個目標一直放（同原版天堂；站長 2026-10-24「F2 按著他不會連續一直放魔法」）。
//   瀏覽器按住會一直送 keydown（e.repeat）→ 不照那個送；改成每幀看施法動作（castUntil，同 castLockMs 的節奏）結束了就再放一次。
//   這次按下去之後真的送出去了（G.castShot：F 鍵直接放、點目標放、走過去放都算）才開始連；目標死了、不見了、魔力不夠、castSkill 沒送（材料不夠…）＝停；放開就停。
//   會跳選單的（召喚術、變形術）、召喚屬性精靈（身邊有夥伴伺服器照扣不召喚）、復活類、造屍術不連
let hotHold = null;   // { code, i, item, at }：按著的那顆 F 鍵、快捷格；item＝放的是會用掉的道具（藥水…），at＝上次用的時間
// 按住放道具的 F 鍵＝每 HOLD_ITEM_MS 用一次（站長 2026-11-08 玩家「熱鍵無法按住連喝水」）；伺服器照道具的使用間隔擋（紅水 0.5 秒、橙／白水 1 秒），太快的伺服器不理。裝備不連（不然一直穿脫）
const HOLD_ITEM_MS = 550;   // 比伺服器紅水的 0.5 秒多一點，每一下都喝得到（剛好 500 會有幾下卡在邊界被擋）
function hotItemCheck(now) {
    const h = hotHold;
    if (!h || !G.me || G.dead || G.reconnecting || !conn) return;
    if (now - h.at < HOLD_ITEM_MS) return;
    h.at = now; hud.useSlot(h.i);
}
const NO_REPEAT = new Set([51, 67, 41, 154, 162]);
function hotHoldCheck(now) {
    const h = hotHold, sh = G.castShot;
    if (!h || !sh || !G.me || G.dead || G.reconnecting || !conn) return;
    if (now < (G.castUntil || 0) || G.castWalk || G.castPick || helpless()) return;   // 還在施法、正走過去、等點目標、被定住：等
    const s = sh.s;
    if (NO_REPEAT.has(s.sid) || (s.type & 32)) { hotHold = null; return; }
    let t = null;
    if (sh.t === G.me) t = G.me;
    else if (typeof sh.t === 'number') {
        t = G.objs.get(sh.t);
        if (!t || t.act === 'death' || t.sunk || t._hidden) { hotHold = null; return; }
    } else if (sh.t) t = sh.t;
    const st = G.st || {};
    const mpNeed = s.mp ? s.mp - mpCut(s.sid, s.mp, st.int || 0) : 0;   // 照實扣的算（智力減免，hud.js mpCut）
    if ((mpNeed && (st.mp || 0) < mpNeed) || (s.hp && (st.hp || 0) <= s.hp)) { hotHold = null; hud.float(mpNeed && (st.mp || 0) < mpNeed ? '魔力不足' : '體力不足', true); return; }
    const was = G.castUntil;
    castSkill(s, t, true);
    if (G.castUntil === was && !G.castWalk) hotHold = null;   // 沒送出去（castSkill 已經說了原因）
}
const npcKey = o => (o.name || '').trim() + '|' + o.gfx;   // data/npccards.json 的鍵
const PROMO_NPC = '推廣大使';   // 奇岩廣場，點了開推廣視窗（talkNow）
// 「此地圖 NPC」、製作工匠的分類順序：照 data/npctitles.json（tools/npc-titles.mjs：傳送師 → 各種商人 → 倉庫 → 製作 → 其他服務），
//   不在表裡的職稱排在後面、沒職稱的最後。舊資料（還沒有 npctitles.json，職稱是「商店／倉庫／製作」）照下面這組
let NPC_ORDER = ['傳送師', '商店', '倉庫', '製作'];
getJson('/data/npctitles.json').then(d => { if (d && Array.isArray(d.order)) NPC_ORDER = d.order; });
function npcRank(t) { if (!t) return NPC_ORDER.length + 1; const i = NPC_ORDER.indexOf(t); return i < 0 ? NPC_ORDER.length : i; }
const NPC_AREA_R = 120;   // 「此地圖 NPC」分區：離村莊傳送點幾格內算那個村莊；大城（亞丁、海音、奇岩）比較大，teleports.json 的 r（gen-data VIL_R）
// 伺服器給的這張地圖的 NPC（S_Web 17：{ id, gfx, x, y, name }）；還沒收到、或是別張地圖的回 null
const mapNpcList = () => G.mapNpcs && G.mapNpcs.map === G.mapId ? G.mapNpcs.list : null;
// 點 NPC 卡片、點畫面上的 NPC：伺服器回過地圖 NPC 清單（G.remoteTalk＝支援同地圖遠距離對話）→ 直接說話（C_NPCTalk），不走過去（站長 2026-10-18）；
//   舊伺服器照原本：走到他旁邊（相鄰一格）再說，每幀在 loop 裡看到了沒（talkCheck）
function talkTo(id) {
    const o = G.objs.get(id) || (mapNpcList() || []).find(n => n.id === id), me = G.me;
    if (!o || !me || !conn) return;
    atkStop();   // 找 NPC 說話＝不打了
    if (G.remoteTalk) { talkNow(o); return; }
    if (!G.objs.has(id)) return;
    if (conn && G.inWorld && performance.now() - G.mapNpcsAsk > 10000) { G.mapNpcsAsk = performance.now(); conn.mapNpcs(); }   // 還沒問過能不能遠距離對話：問一次，下一次點就直接說
    G.talkTo = id;
    if (Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y)) > 1) { goNear(o.x, o.y); if (!G.path || !G.path.length) talkNow(o); }   // 旁邊八格都走不到（站在屋裡、櫃台後面）：直接說
}
// 跟 NPC 說話（C_NPCTalk：伺服器不看距離）＋開對話視窗
//   map：同名同外型的 NPC 在不同地圖功能不一樣時（data/npcfn.json 的「鍵@地圖」，第 407 項）靠這個分
function talkNow(o) {
    G.talkTo = 0; stopPath(); G.actAt = performance.now();
    // 推廣大使（伺服器第 710 項補，奇岩廣場；站長 2026-11-08「推文吧 npc，可以點，兌換還是 po 都寫進去」）：點了直接開推廣視窗，不開 NPC 對話框
    if ((o.name || '').trim() === PROMO_NPC) { promo.openSoon(() => hud.toast('推廣活動目前沒有開放')); return; }   // 狀態還沒到先要、到了才打開（promo.js openSoon）
    conn.npcTalk(o.id);
    hud.npc.open({ id: o.id, name: displayName((o.name || '').trim()), title: NPCCARDS[npcKey(o)] || '', key: npcKey(o), map: G.mapId });
}
// 走到 (x,y) 旁邊：那格本身走不進去（NPC 站在櫃檯後面、牆邊，例：奇岩 海克特）就改走相鄰八格裡離自己最近、走得到的那格
function goNear(x, y) {
    goTo(x, y);
    if (G.path && G.path.length) return;
    const me = G.me, d = (a, b) => Math.max(Math.abs(a - me.x), Math.abs(b - me.y)), near = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) near.push([x + dx, y + dy]);
    near.sort((a, b) => d(a[0], a[1]) - d(b[0], b[1]));
    for (const [nx, ny] of near) { const p = world.findPath(me.x, me.y, nx, ny, occupied); if (p && p.length) { G.path = p; G.goal = [nx, ny]; return; } }
}
const tooFar = (o, r) => Math.max(Math.abs(o.x - G.me.x), Math.abs(o.y - G.me.y)) > r;   // 同伺服器 L1SkillUse：getTileLineDistance > ranged
// 走去放魔法（castSkill 距離外）：進到距離內就放；目標不見了、死了、潛地了＝不放；
//   牠走開了每半秒重找一次路，路走完還是太遠也重找；找不到路＝「太遠了」
function castWalkCheck() {
    const w = G.castWalk, o = G.objs.get(w.id);
    if (!o || o.act === 'death' || o.sunk || o._hidden) { G.castWalk = null; stopPath(); return; }
    if (!tooFar(o, w.s.range)) { G.castWalk = null; stopPath(); castSkill(w.s, o); return; }
    const moved = !G.goal || Math.max(Math.abs(G.goal[0] - o.x), Math.abs(G.goal[1] - o.y)) > 1;
    if (!G.path || !G.path.length || (moved && performance.now() - w.at > 500)) { w.at = performance.now(); goNear(o.x, o.y); }
    if (!G.path || !G.path.length) { G.castWalk = null; hud.float('太遠了，走不過去', true); }
}
function talkCheck() {
    const o = G.objs.get(G.talkTo), me = G.me;
    if (!o) { G.talkTo = 0; return; }
    // 到旁邊了、或路走完（中途被擋：門關著、有人站著）還是到不了：就地說（C_NPCTalk 伺服器不看距離；
    //   對話視窗裡的買賣、傳送伺服器同地圖也放行，WebMapNpcs.remoteOk），不再「走不過去」停住
    if (Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y)) <= 1 || !G.path || !G.path.length) talkNow(o);
}
// 點地上的道具：走到旁邊（相鄰一格）再撿（C_PickUpItem）；撿不起來（太重、別人的）照伺服器回的訊息
function pickTo(id) {
    const o = G.objs.get(id), me = G.me;
    if (!o || !me || !conn) return;
    G.pickTo = id;
    if (Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y)) > 1) goTo(o.x, o.y);
}
// 南瓜澆水／採收（伺服器 REACH＝3 格內）：近就直接送；遠就走過去，到了再送（pumpkinCheck）。回 true＝要走過去
const PUMPKIN_REACH = 3;
function pumpkinAct(id, act, pot) {
    const o = G.objs.get(id), me = G.me;
    if (!o || !me || !conn) return false;
    if (Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y)) <= PUMPKIN_REACH) { conn.pumpkin(act, id, pot); return false; }
    atkStop(); G.talkTo = 0; G.pickTo = 0; userMoved();
    G.pumpkinDo = { id, act, pot, at: 0 };
    goNear(o.x, o.y);
    if (!G.path || !G.path.length) { G.pumpkinDo = null; hud.toast('走不過去'); return false; }
    return true;
}
function pumpkinCheck() {
    const w = G.pumpkinDo, o = G.objs.get(w.id), me = G.me, now = performance.now();
    if (!o) { G.pumpkinDo = null; return; }
    if (Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y)) <= PUMPKIN_REACH) { G.pumpkinDo = null; stopPath(); conn.pumpkin(w.act, w.id, w.pot); pumpkin.open(w.id); return; }
    const moved = !G.goal || Math.max(Math.abs(G.goal[0] - o.x), Math.abs(G.goal[1] - o.y)) > 1;   // 成熟南瓜會走動：同 castWalkCheck 每半秒重找路
    if (!G.path || !G.path.length || (moved && now - w.at > 500)) { w.at = now; goNear(o.x, o.y); }
    if (!G.path || !G.path.length) { G.pumpkinDo = null; hud.toast('走不過去'); }
}
function pickCheck() {
    const o = G.objs.get(G.pickTo), me = G.me;
    if (!o) { G.pickTo = 0; return; }
    if (Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y)) <= 1) {
        G.pickTo = 0; stopPath(); G.actAt = performance.now();
        conn.pickUp(o.x, o.y, o.id, o.count || 1);
    } else if (!G.path || !G.path.length) { G.pickTo = 0; hud.toast('走不過去'); }
}
// ── 手動攻擊（站長 2026-10-19「點選怪物鎖定後系統自動攻擊該怪物」「電腦版按 CTRL＝強制攻擊」「手機版新增強制攻擊鍵」）──
//   同原版用戶端：點怪＝走到打得到的地方、一直打（C_Attack；近戰、弓同一包，伺服器照手上武器算），打到牠死、不見、潛地，
//   或自己做了別的事（點地面、方向鍵、按住走、點別的、開 AUTO、找 NPC、被打死、傳送）為止。
//   強制攻擊（電腦 Ctrl＋點、手機「強制」鈕亮著時點）＝玩家、寵物、召喚獸、NPC 也照打；點地面＝朝那一格揮一下（C_Attack 對象 0，伺服器 L1Attack 揮空）。
//   打不打得到、有沒有傷害（安全區、守衛、自己的寵物…）一律照伺服器（伺服器擋的就是揮空），網頁不另外擋。
//   出手間隔：伺服器 AcceleratorChecker 的攻擊間隔（外型 × 手上武器的攻擊動作，SprTable；同 data/spratk.json）× 加速／勇水，再多留 5%。
//   伺服器另有軟性攻擊間隔（比 ×0.8 還快的攻擊封包默默丟掉），送太快也只是少打一下，不會被當加速器踢
const RANGED_WPN = new Set(['bow', 'singlebow', 'gauntlet', 'tohandkiringku']);   // 武器表 range −1（畫面內）
const REACH2_WPN = new Set(['spear', 'singlespear', 'chainsword']);              // 武器表 range 2（矛、鎖鏈劍）
const BOW_R = 8;   // 弓：幾格內就射（伺服器不看距離，但中間被擋＝必定打空、箭照扣 → 再看直線上擋不擋，擋了就再走近）
function myWeapon() { for (const it of G.inv.values()) { const p = parseItem(it); if (p.equipped && p.slot === 'wpn') return p; } return null; }
function atkRange(w) { const t = w && w.tpl && w.tpl.type; return RANGED_WPN.has(t) ? -1 : REACH2_WPN.has(t) ? 2 : 1; }
// 弓要箭、鐵手甲要飛刀（伺服器 L1Attack：沒有就必定打空、不說）；沙哈之弓（190）不用箭。背包有認不出來的道具＝不擋（照伺服器）
function ammoOk(w) {
    const t = w && w.tpl; if (!t || t.id === 190) return true;
    const need = t.type === 'gauntlet' ? 'sting' : t.type === 'bow' || t.type === 'singlebow' ? 'arrow' : null;
    if (!need) return true;
    let unknown = false;
    for (const it of G.inv.values()) { const p = parseItem(it); if (!p.tpl) unknown = true; else if (p.tpl.type === need) return true; }
    return unknown;
}
// 一刀多久：伺服器的攻擊間隔（外型 × 武器的攻擊動作 × 一段＋二段＋三段，mySpeed）× ACT_SLACK。
//   原本 ×1.05、每幀才看一次又沒接著排、沒算三段 → 比原版慢 5～8%（第 103 項）
const ACT_SLACK = 1.02;   // 同伺服器 WebAutoSession.SLACK：手動、AUTO 同一個速度
function atkRawMs() {
    const me = G.me, t = (me && SPRATK[me.gfx]) || {};
    return (t[((me && me.weapon) || 0) + 1] || t[1] || 800) * mySpeed('atk');
}
// 下一刀：接著上一刀排定的時間往後排（每幀晚的十幾毫秒不累積）；跟這一刀至少隔原版間隔的 0.9（伺服器軟性攻擊間隔丟 0.8 以下的）
function atkNextAt(now) {
    const raw = atkRawMs(), prev = G.atkNext || 0;
    const base = now >= prev && now - prev < 100 ? prev : now;
    return Math.max(base + raw * ACT_SLACK, now + raw * 0.9);
}
// 箭飛不飛得過去（同伺服器 L1Character.glanceCheck：方向在起點算一次，每格問那個方向過不過得去、往目標靠一格）；
//   網頁只有「走不走得過去」，拿來當「箭過不過得去」（牆、柵欄一樣擋；水、懸崖箭其實過得去 → 頂多多走近幾步）
// 直線上有沒有擋箭的（照伺服器 L1Character.glanceCheck：每走一格都從「現在這格」重算方向，問 isArrowPassable；最多 15 格）
//   站長 2026-11-03「如果直線距離有牆壁攻擊就不成立，需走到直線距離沒有牆壁才開始攻擊」：原本用走路的通行位元、方向只算一次，跟伺服器判的不一樣 → 隔牆照射、伺服器判沒打到
function glance(fx, fy, tx, ty) {
    let x = fx, y = fy;
    for (let i = 0; i < 15 && !(x === tx && y === ty); i++) {
        const disX = Math.abs(x - tx), disY = Math.abs(y - ty), dis = Math.max(disX, disY);
        const sx = Math.floor(disX / dis + 0.59) === 0 ? 0 : Math.sign(tx - x), sy = Math.floor(disY / dis + 0.59) === 0 ? 0 : Math.sign(ty - y);
        let h = 0; for (let k = 0; k < 8; k++) if (DX[k] === sx && DY[k] === sy) { h = k; break; }
        if (!world.arrowStep(x, y, h)) return false;
        x += Math.sign(tx - x); y += Math.sign(ty - y);
    }
    return true;
}
// 點了打得到的怪（不是別人的寵物、召喚獸：那要強制攻擊）
const mobTarget = o => o && !o.isPc && !o.isItem && !o.master && o.act !== 'death' && isMob(o);
// 強制攻擊鈕（手機）：亮著＝等著點目標，或正在強制攻擊
const forceSync = () => { hud.setForce(!!(G.forceArm || (G.atk && G.atk.force))); cursorSync(); };   // 站長 2026-11-03「強制鍵點人會有劍的圖示」：鈕亮著游標也換成劍（同 Ctrl）
function atkStart(o, force) {
    if (!o || !G.me || !conn) return;
    G.talkTo = 0; G.pickTo = 0; G.castWalk = null; G.castPick = null;
    G.lock = o;
    G.atk = { id: o.id, force: !!force, pathAt: 0 };
    forceSync();
}
function atkStop() {   // 停手；強制攻擊鈕亮著的話照樣亮著（只有再按一次鈕才熄，見 forceToggle）
    if (!G.atk) return;
    G.atk = null;
    forceSync();
}
// 強制攻擊點地面：朝那一格揮一下（上一刀還沒揮完就不送）
function swingAt(x, y) {
    if (!G.me || !conn) return;
    if (helpless()) { frozenWarn(); return; }
    const now = performance.now();
    if (now < (G.atkNext || 0)) return;
    conn.attack(0, x, y);
    G.atkNext = atkNextAt(now);
}
// 每幀（自己沒在走的時候）：目標在射程內＝出手，不在＝走過去。回 true＝站著不動（出手、等這一刀揮完、被定住）
function atkCheck(now) {
    const a = G.atk, o = G.objs.get(a.id), me = G.me;
    if (!o || o.act === 'death' || o.sunk || o._hidden) { if (G.lock === o) G.lock = null; atkStop(); stopPath(); return false; }   // 打死了：紅圈也拿掉（不留在屍體上）
    if (now < (G.atkNext || 0) || helpless() || now < (G.castActUntil || 0)) return true;   // 這一刀還在揮、被定住、施法動作中：等（魔法延遲只鎖魔法，不鎖普通攻擊）
    const w = myWeapon(), r = atkRange(w), d = Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y));
    if (d <= (r < 0 ? BOW_R : r) && (d <= 1 || glance(me.x, me.y, o.x, o.y))) {
        if (!ammoOk(w)) { atkStop(); stopPath(); hud.toast(w.tpl.type === 'gauntlet' ? '沒有飛刀了' : '沒有箭了'); return false; }
        stopPath();
        conn.attack(o.id, o.x, o.y);
        G.atkNext = atkNextAt(now);
        return true;
    }
    if (immobile()) return true;   // 束縛：走不了，等
    // 走過去：路走完、或牠走開了每半秒重找一次路（同 castWalkCheck）；找不到路＝停
    const moved = !G.goal || Math.max(Math.abs(G.goal[0] - o.x), Math.abs(G.goal[1] - o.y)) > 1;
    if (!G.path || !G.path.length || (moved && now - a.pathAt > 500)) { a.pathAt = now; goNear(o.x, o.y); G.marker = null; }
    if (!G.path || !G.path.length) { atkStop(); hud.float('走不過去', true); return false; }
    return false;
}
// 電腦版：按住 Ctrl＝強制攻擊，遊戲畫面上的游標換成原版用戶端的劍（tools/cursor.mjs）；4:3 舞台放大 1.4 倍以上用 1.5 倍那張，熱點在劍尖
function setCtrl(on) {
    on = !!on; if (G.ctrl === on) return;
    G.ctrl = on;
    cursorSync();
}
// 遊戲畫面上的游標：Ctrl＝劍；電腦版魔法等目標（G.castPick：按了 F 鍵、沒有鎖定）＝十字準星，看得出「現在左鍵點下去是放魔法」；其他照瀏覽器
let curNow = '';
function cursorSync() {
    let c = '';
    if (G.ctrl || G.hoverFree || G.forceArm) { const big = stageScale() >= 1.4; c = 'url(/cursor/' + (big ? 'sword-48' : 'sword') + '.png) ' + (big ? '3 3' : '2 2') + ', crosshair'; }
    else if (G.castPick && document.body.classList.contains('pcui')) c = 'crosshair';
    if (c !== curNow) { curNow = c; cv.style.cursor = c; }
}

// 掉寶資料（spawnlist × droplist，tools/gen-data.mjs → data/drops.json）：掉寶視窗用，第一次要用才下載
//   第 389 項（站長 2026-10-28：掉寶機率改了，開著的網頁還顯示舊的 0.1%）：抓過超過 5 分鐘再用就重抓（伺服器 no-cache＋Last-Modified，沒變只回 304）
let dropsAt = 0;
async function allDrops() {
    if (!DROPS || performance.now() - dropsAt > 300000) {
        dropsAt = performance.now();
        const d = await getJson('/data/drops.json');
        if (d || !DROPS) DROPS = d || { maps: {}, mobs: {}, mapRate: {} };
    }
    return DROPS;
}
// 掉寶視窗的資料：這張地圖的怪＋各自的掉落
async function mapDrops() {
    await allDrops();
    const mr = DROPS.mapRate[dropMap(G.mapId)] ?? 1, none = !(mr > 0);   // 倍率 0（地獄…，gen-data）：伺服器不給掉落、金幣 → 都不列
    const area = areaMobs();
    //   tf＝倒下會變身（變身前不掉東西，gen-data）：跟變身後同名的不列（巴薩斯不會出現兩筆），不同名的列、寫「倒下後變成…」（into，hud.js）
    const next = m => m.tf ? DROPS.mobs[m.tf] : null;
    const mobs = (area ? area.ids : DROPS.maps[dropMap(G.mapId)] || []).map(id => DROPS.mobs[id]).filter(m => m && !(next(m) && next(m).n === m.n)).sort((a, b) => a.lv - b.lv)
        .map(m => ({ ...m, gold: none ? null : m.gold, into: next(m) ? next(m).n : '',
            d: none ? [] : m.d.map(x => ({ nid: x[0], name: dropLabel(x), base: displayName(x[0]), b: x[4] ? 1 : 0, rate: x[1] * mr * 100, min: x[2], max: x[3] })) }));   // 祝福的寫「祝福的 …」（dropLabel）
    return { title: area ? area.title : mapLabel(G.mapId) || ('地圖 ' + G.mapId), mobs };
}
// 大陸一張圖就是整個大陸（怪一百多種，站長：顯示該地區就好）→ 只列所在地區的怪：
//   地區＝左下地名那個地點（狩獵場清單裡大陸上的地點，最近、80 格內，同 hereName）；每個生怪點（drops.json pts）也照「離哪個地點最近、80 格內」分，
//   跟自己同一區的怪才列。離每個地點都遠（左下寫「大陸」）→ 列自己 80 格內有生怪點的。舊的 drops.json 沒有 pts → 照舊列整張圖（回 null）
//   設定「名單」頁（AUTO 不攻擊的怪）的選單也用這份（站長 2026-10-22「要」）。名單頁每跳血都會問 → 同一區（或附近模式同一個 8×8 格）記住上次的結果
const AREA_R = 80;
let areaMemo = null;
const placeNear = (places, x, y) => { let best = null, bd = AREA_R + 1; for (const t of places) { const d = Math.max(Math.abs(t.x - x), Math.abs(t.y - y)); if (d < bd) { bd = d; best = t; } } return best; };
function areaMobs() {
    const me = G.me, pts = DROPS && DROPS.pts && DROPS.pts[G.mapId];
    if (G.mapId !== MAINLAND || !me || !pts) return null;
    const places = TELEPORTS.filter(t => t.map === MAINLAND), mine = placeNear(places, me.x, me.y);
    const key = mine ? 'p' + mine.id : 'f' + (me.x >> 3) + ',' + (me.y >> 3);
    if (areaMemo && areaMemo.key === key && areaMemo.pts === pts && areaMemo.places === places.length) return areaMemo.res;
    const ids = new Set();
    for (let i = 0; i + 2 < pts.length; i += 3) {
        const x = pts[i + 1], y = pts[i + 2];
        if (mine ? placeNear(places, x, y) === mine : Math.max(Math.abs(x - me.x), Math.abs(y - me.y)) <= AREA_R) ids.add(pts[i]);
    }
    const res = { ids: [...ids], title: mine ? mine.name : mapLabel(MAINLAND) + '（附近）' };
    areaMemo = { key, pts, places: places.length, res };
    return res;
}
// 狩獵場「搜尋掉落物」（站長 2026-10-24）：items()＝會掉的道具（同名的併一筆、祝福的另一筆）、tps(名字)＝附近有一般怪會掉它的傳送點編號、boss(名字)＝哪些頭目會掉、在哪個傳送點。
//   頭目（drops.json boss，2026-10-30 起）也算：豪勢掉的弄縐的情書原本搜不到、寫「沒有怪會掉這個道具」；2026-11-09 起頭目跟一般怪分開列
//   哪些算「這個傳送點附近」：
//     有生怪點座標的地圖（drops.json pts，現在只有大陸）：每個生怪點歸「同一張圖上離它最近的傳送點」（TP_NEAR_R 格內；大陸一半的生怪點離最近的傳送點超過 80 格，
//       掉寶視窗那個 80 格會漏掉強盜、哈士奇這些，這裡放寬到 200：96% 的點都算得到）。每個點只歸一個傳送點，同一片怪不會整排傳送點都亮。
//     其他地圖（地監各樓層、說話之島、海賊島…）：整張圖的怪都算。地圖掉寶倍率是 0 的不算。
//   傳送點不寫死：跟 teleports.json（伺服器 WebTeleport.xml）重產的走
const TP_NEAR_R = 200;
let dropItemsMemo = null;
const dropLabel = x => { const n = displayName(x[0]); return !n ? '' : x[4] && !/^受?祝福/.test(n) ? '祝福的 ' + n : n; };   // 第 5 格 1＝祝福的（gen-data itemBless）
const dropFind = {
    items() {
        if (!DROPS) { if (!dropsAsk) dropsAsk = allDrops().then(() => hud.refreshWin()); return null; }
        if (dropItemsMemo) return dropItemsMemo;
        const by = new Map(); let blank = 0;
        for (const m of [...Object.values(DROPS.mobs), ...Object.values(DROPS.boss || {})]) for (const x of m.d || []) {
            const name = dropLabel(x); if (!name) { blank++; continue; }
            if (!by.has(name)) by.set(name, { name, low: name.toLowerCase(), nid: x[0], b: x[4] ? 1 : 0, icon: itemIcon({ name: displayName(x[0]), nid: x[0] }) || '' });
        }
        const res = [...by.values()];
        if (blank < 20) dropItemsMemo = res;   // 名字表（names.json）還沒到：先不記，下次再算
        return res;
    },
    tps(name) {
        if (!DROPS) { if (!dropsAsk) dropsAsk = allDrops().then(() => hud.refreshWin()); return null; }
        const mobs = new Set(), bo = dropBossOnly();
        for (const [id, m] of Object.entries(DROPS.mobs)) if (m.d.some(x => dropLabel(x) === name)) mobs.add(+id);
        const out = new Set(), byMap = dropTpByMap();
        //   站長 2026-11-09「高品質鑽石列出古魯丁 3 樓，但 3 樓一般怪不會掉、會掉的是頭目」：這裡只算一般怪，頭目另外列（boss() 下面）。
        //     drops.json 的 maps／pts 連頭目出生表的怪也算進去了（gen-data：設定名單、掉寶視窗要用）→ 頭目在牠出生的那幾張圖不算
        const mobHere = (id, map) => mobs.has(id) && !(bo.has(id) && bo.get(id).has(+map));
        for (const [map, list] of byMap) {
            if ((DROPS.mapRate[map] ?? 1) <= 0) continue;
            const pts = DROPS.pts && DROPS.pts[map];
            if (pts && list.length > 1) {
                for (let i = 0; i + 2 < pts.length; i += 3) {
                    if (!mobHere(pts[i], map)) continue;
                    const best = dropTpNear(list, pts[i + 1], pts[i + 2]); if (best) out.add(best.id);
                }
            } else if ((DROPS.maps[map] || []).some(id => mobHere(id, map))) for (const t of list) out.add(t.id);
        }
        return out;
    },
    // 頭目會掉的：[{ n 頭目名字, tps [傳送點編號…] }]（同名的併一筆，照名字排）。出生點（drops.json boss.m）歸同一張圖最近的傳送點；整張圖只有一個傳送點就是它。
    //   沒有傳送點到得了的（安塔瑞斯這種）不列：狩獵場是拿來傳過去的
    boss(name) {
        if (!DROPS) { if (!dropsAsk) dropsAsk = allDrops().then(() => hud.refreshWin()); return null; }
        const bo = dropBossOnly(), byMap = dropTpByMap(), by = new Map();
        for (const [id, b] of Object.entries(DROPS.boss || {})) {
            if (!bo.has(+id) || !(b.d || []).some(x => dropLabel(x) === name)) continue;
            const n = displayName(b.n) || b.n; if (!n) continue;
            for (const [map, x, y] of b.m || []) {
                const list = byMap.get(map); if (!list || (DROPS.mapRate[map] ?? 1) <= 0) continue;
                const t = list.length > 1 ? dropTpNear(list, x, y) : list[0]; if (!t) continue;
                if (!by.has(n)) by.set(n, new Set()); by.get(n).add(t.id);
            }
        }
        return [...by].map(([n, s]) => ({ n, tps: [...s] })).sort((a, b) => a.n.localeCompare(b.n, 'zh-Hant'));
    },
};
const dropTpNear = (list, x, y) => { let best = null, bd = TP_NEAR_R + 1; for (const t of list) { const d = Math.max(Math.abs(t.x - x), Math.abs(t.y - y)); if (d < bd) { bd = d; best = t; } } return best; };
const dropTpByMap = () => { const byMap = new Map(); for (const t of TELEPORTS) { const a = byMap.get(t.map); if (a) a.push(t); else byMap.set(t.map, [t]); } return byMap; };
//   哪些算「頭目」：怪 → 牠當頭目出生的地圖。真的頭目（drops.json bossIds），或頭目出生表上、除此之外沒在別的地方生過的
//     （卡士伯一行的西瑪、巴土瑟、馬庫爾，深淵之主旁的四牙這種跟著頭目一起出來的）。漂浮之眼、黑騎士這種平常就有的照一般怪算
let dropBossMemo = null;
function dropBossOnly() {
    if (dropBossMemo && dropBossMemo.d === DROPS) return dropBossMemo.r;
    const r = new Map(), real = new Set(DROPS.bossIds || []), at = new Map();
    for (const [map, ids] of Object.entries(DROPS.maps || {})) for (const id of ids) { const s = at.get(+id); if (s) s.add(+map); else at.set(+id, new Set([+map])); }
    for (const [id, b] of Object.entries(DROPS.boss || {})) {
        const bm = new Set((b.m || []).map(s => +s[0]));
        if (real.has(+id) || [...(at.get(+id) || [])].every(m => bm.has(m))) r.set(+id, bm);
    }
    dropBossMemo = { d: DROPS, r };
    return r;
}
function isGold(it) { return /^\$4\b/.test(it.name || '') || displayName(it.name || '') === '金幣'; }   // 金幣（40308，名字碼 $4）
function hudUpdate() {
    const s = G.st;
    s.name = G.me ? G.me.name : (G.curChar && G.curChar.name) || '';
    let gold = 0;   // 金幣＝背包裡的金幣（$4）數量
    for (const it of G.inv.values()) if (isGold(it)) gold += it.count;
    s.gold = gold;
    // 背包格數／上限（第 119 項）：第 135 項起＝背包畫面看得到的格子數：金幣、穿著的不算，同款裝備疊成一格算 1 格（items.js stacks；
    //   伺服器 L1PcInventory.bagCount 用一樣的規則算，跟上限比的都是那個數）
    s.slots = stacks([...G.inv.values()].filter(it => !isGold(it)).map(parseItem).filter(p => !p.equipped)).length; s.slotMax = bagMax();

    hud.update(s);
}
function showPlayers() {
    const myName = G.curChar ? G.curChar.name : '';
    hud.setPlayers([...G.players.values()].filter(p => p.id !== G.myId && p.name !== myName)
        .map(p => ({ ...p, mapName: mapLabel(p.map) || ('地圖 ' + p.map) })));
    if (party.inParty()) hud.setParty(party.barList(), party.buffBar());   // 左側隊員欄的等級、職業取線上名單：名單變了重畫（隊伍增益那排一起帶，原本漏帶＝名單一更新「＋ 隊伍增益」就不見）
}
function place() {
    const me = G.me, z = me && world.ready ? (world.flags(me.x - world.map.d.gameX0, me.y - world.map.d.gameY0) & 0x30) >> 4 : 0, here = hereName();
    hud.setPlace(here, z);
    mapLoad.rename(here);   // 換地圖讀取條：位置到了就改顯示實際地名
    // 安全區＝那個村莊的曲子（照地名，audio.js townScene），其他＝原版用戶端那個地方的曲子（洞窟、地監…，audio.js zoneScene），沒有就戰鬥曲。
    //   換地圖還在載圖（進度條）時先不換曲：音檔會跟地圖圖檔搶頻寬；載好後 0.5 秒內這裡會再跑一次
    //   伺服器第 455 項（站長 2026-10-29「宣戰沒有攻城的音樂」）：自己的血盟在打仗（開戰到結束，在哪裡都一樣）＝原版的戰爭曲（audio.js warScene），結束換回原本的
    if (G.inWorld && me && world.ready && !mapLoad.active) bgmScene(clan.atWar() ? warScene() : z === 1 ? townScene(here) : zoneScene(G.mapId, me.x, me.y) || 'battle');
}
// 掛機紀錄的地點：伺服器只給地圖編號（木人樁、新兵修練場同一張圖；大陸整張一個名字）→ 記下左下地名，紀錄照它寫（huntPlaceName）。
//   跟伺服器記地圖同一個時機：開 AUTO 時、之後每打死一隻（S_Web 3 擊殺數變多）。
//   原本 AUTO 開著時每走一步就記：回家卷軸回村、死掉回村那一下 AUTO 還沒停，地點被蓋成村莊
function huntHere() { if (G.me && G.mapId >= 0) G.huntPlace = { map: G.mapId, name: hereName() }; }

// ── 通行碼（伺服器 web/WebPass 發的 S_Web 21）：回到網頁、網頁被系統重新載入時，直接登入原本那隻，不用再打帳號密碼、不經過選角。
//   只放 sessionStorage（同一個分頁才有，關分頁就沒了）：{ t 通行碼, c 角色名字, a 帳號（登入封包要帶，不是密碼） }。
//   每次進世界伺服器都發新的（舊的作廢）；登出（C_Web 18 叫伺服器也作廢）、回選角就丟掉；伺服器說無效（過期、重啟過）也丟掉、回登入畫面。不印到 console
//   手機另外留一份在 localStorage（PASS_KEEP，站長 2026-11-06「Safari 保留 12 小時接回」）：iPhone 在背景常把整個分頁收掉、sessionStorage 跟著沒了，
//   回來只剩帳密畫面。這份帶到期時間（伺服器給的 ttl）、哪個分頁的（tab）、那個分頁最後還活著的時間（beat，前景時每 5 秒更新）：
//   分頁沒有自己的通行碼時，只有那份「沒過期、而且原本的分頁已經 15 秒沒動靜（被收掉了）」才拿來用——開第二個分頁不會把正在玩的那個搶走。
//   桌機不留（分頁不會被系統收掉；多開不同帳號的人才不會被搶）
const PASS_KEY = 'l1web_pass', PASS_PREFIX = '\u0001PASS:', PASS_KEEP = 'l1web_pass_keep', PASS_BEAT_MS = 5000, PASS_STALE_MS = 15000;
const PASS_TAB = (() => { try { let id = sessionStorage.getItem('l1web_tab'); if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem('l1web_tab', id); } return id; } catch (e) { return 'x'; } })();
const keepGet = () => { try { const v = JSON.parse(localStorage.getItem(PASS_KEEP) || 'null'); return v && v.t && v.exp > Date.now() ? v : null; } catch (e) { return null; } };
const keepPut = v => { try { localStorage.setItem(PASS_KEEP, JSON.stringify(v)); } catch (e) { /* 存不了就不留 */ } };
const passGet = () => {
    try {
        const v = JSON.parse(sessionStorage.getItem(PASS_KEY) || 'null');
        if (v && v.t) return v;
        if (!matchMedia('(pointer: coarse)').matches) return null;
        const k = keepGet();
        if (!k || (k.tab !== PASS_TAB && Date.now() - (k.beat || 0) < PASS_STALE_MS)) return null;   // 別的分頁還開著在用：不搶
        const p = { t: k.t, c: k.c, a: k.a };
        sessionStorage.setItem(PASS_KEY, JSON.stringify(p));
        keepPut(Object.assign(k, { tab: PASS_TAB, beat: Date.now() }));
        return p;
    } catch (e) { return null; }
};
const passSet = (v, ttl) => {
    try { sessionStorage.setItem(PASS_KEY, JSON.stringify(v)); } catch (e) { /* 無痕 */ }
    if (matchMedia('(pointer: coarse)').matches) keepPut(Object.assign({}, v, { exp: Date.now() + (ttl > 0 ? ttl : 12 * 3600) * 1000, tab: PASS_TAB, beat: Date.now() }));
};
const passClear = () => {
    try { sessionStorage.removeItem(PASS_KEY); } catch (e) { /* 無痕 */ }
    const k = keepGet(); if (k && k.tab === PASS_TAB) { try { localStorage.removeItem(PASS_KEEP); } catch (e) { /* 無痕 */ } }
};
setInterval(() => { if (document.hidden) return; const k = keepGet(); if (k && k.tab === PASS_TAB) keepPut(Object.assign(k, { beat: Date.now() })); }, PASS_BEAT_MS);

// 伺服器第 741 項：用密碼登入時帶這台裝置的編號（伺服器擋同一台裝置短時間登入很多帳號）。跟 invite.js devId 同一個 localStorage 欄位、同格式；
//   不 import invite.js：快取讓兩支新舊混搭時，少一個 export 整個網頁就開不起來。存不了＝不帶，伺服器只看 IP
function loginDev() {
    try {
        let d = localStorage.getItem('l1web_dev');
        if (d && /^[A-Za-z0-9]{20}$/.test(d)) return d;
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', b = new Uint8Array(20);
        crypto.getRandomValues(b);
        d = Array.from(b, x => A[x % 62]).join('');
        localStorage.setItem('l1web_dev', d);
        return localStorage.getItem('l1web_dev') === d ? d : '';
    } catch (e) { return ''; }
}

// ── 連線 ──────────────────────────────────────────
//   pass：用通行碼登入（帳號照送、密碼欄送 PASS_PREFIX＋通行碼；成功後角色收齊直接進 pass.c 那隻）
function connect(account, password, tries = 0, pass = null, mode = 0) {
    disconnect();
    const l = link = new Link((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    const c = conn = new L1Connection(b => l.send(b));
    l.onData = d => { if (conn === c) c.feed(d); };
    l.onDown = () => { if (conn !== c) return; if (G.inWorld) relinkStart(); else lost(); };   // 遊戲中斷線：先試著接回
    l.onEnd = () => { if (conn === c) lost(); };
    takenAway = false;
    c.on('serverMsg', m => { if (m.id === 357 && conn === c) takenAway = true; });   // 伺服器第 503 項：同帳號在別的地方登入、接手了這條連線
    // 站長 2026-11-07（玩家 閃靈之風 眠龍洞穴：按了伺服器有收到、畫面卻不動）：封包處理出錯原本只寫 console → 也回報 /api/clientlog（errlog.js；同一種封包同一個錯一頁只報一次）
    c.on('error', e => { console.warn('[封包]', e); if (window.L1WEB_REPORT) L1WEB_REPORT('封包處理出錯：' + ((e && e.message) || e), '/js/protocol.js op=' + (e && e.op != null ? e.op : '?'), ((e && e.stack) || '') + '\n' + devInfo()); });
    c.on('init', () => c.clientVersion());
    c.on('serverVersion', () => {
        if (pass) { l.setAccount(pass.a); c.login(pass.a, PASS_PREFIX + pass.t); return; }   // 伺服器 web/WebPass：密碼欄這樣開頭＝通行碼
        l.setAccount(account); c.login(account, password, mode, loginDev());
    });
    c.on('loginResult', r => {
        if (r === 0) { G.acct = pass ? pass.a || '' : account; reportAdSrc(G.acct); if (pass) { const stay = relogStay; relogStay = false; staySel = stay; relogEnd(); start.passOk(pass.c, stay); if (stay) start.toast('伺服器重新開機了，請重新進入遊戲', 5000); } else { relogStay = false; start.loginOk(); } return; }
        disconnect();
        // 「已在線上」：多半是網頁剛重新整理、伺服器還沒把舊連線登出完（轉接剛關掉舊的）→ 等一下自動再登，試幾次都不行才說
        if ((r === 7 || r === 22) && tries < 4) { setTimeout(() => connect(account, password, tries + 1, pass, mode === 0x12 ? 0x11 : mode), 1500); return; }
        if (pass) { passClear(); relogEnd(); start.showLogin(''); return; }   // 通行碼失效：回登入畫面，不多說
        // 第 290 項：80＝新帳號格式不對（伺服器 S_LoginResult.REASON_NEW_ACCOUNT_FORMAT）
        // 第 296 項：81＝帳號還沒註冊（登入不再自動建帳號）、82＝註冊的帳號已經有人用
        // 伺服器第 741 項：84＝同一個網路或裝置短時間登入太多帳號（web/WebLoginHop）、85＝新帳號的密碼太好猜（web/WebWeakPassword）
        start.loginFailed(r === 7 || r === 22 ? '這個帳號已經在線上' : r === 80 ? '新帳號只能用英文數字 4～13 字，密碼只能用英數和符號 6～16 字'
            : r === 81 ? '這個帳號還沒註冊，請按「註冊帳號」' : r === 82 ? '這個帳號名字已經有人用了，換一個名字再按「註冊並登入」'
            : r === 83 ? '開服前最後確認中，20:00 開放進入' : r === 84 ? '這台裝置短時間登入太多帳號，請 30 分鐘後再試'
            : r === 85 ? '密碼太好猜了，請換一個' : '帳號或密碼錯誤', r === 81);   // 83：伺服器第 679 項
    });
    c.on('loginQueue', pos => start.queue(pos));   // 伺服器第 549 項：排隊驗密碼
    c.on('pass', p => { if (p.token && G.acct && G.curChar) passSet({ t: p.token, c: G.curChar.name, a: G.acct }, p.ttl); });   // 進世界時伺服器發的（S_Web 21）
    c.on('news', () => c.commonClick());
    c.on('charAmount', a => { chars = []; charMax = a.max; charCount = a.count; start.setChars(chars, charMax, a.count === 0); });
    c.on('charPack', ch => { chars.push(ch); start.setChars(chars, charMax, chars.length >= charCount); });
    c.on('createStatus', s => {   // S_CharCreateStatus：2 成功（接著送 S_NewCharPacket）、6 名字重複、9 名字不能用、21 點數不對或角色已滿
        if (s === 2) return;
        start.createFailed(s === 6 ? '這個名字已經有人用了' : s === 9 ? '名字不能用，換一個' : '能力點數不對或角色已滿');
    });
    c.on('newChar', ch => { chars.push(ch); charCount = chars.length; start.created(ch); });
    c.on('deleteResult', r => start.deleted(r));
    c.on('ownStatus', s => { G.myId = s.id; Object.assign(G.st, s); hudUpdate(); });
    c.on('stats', s => {
        if (s.level && G.st.level && s.level > G.st.level && !stale()) sfx('levelup');
        const gain = s.exp != null && G.st.exp != null && G.inWorld && G.myId ? s.exp - G.st.exp : 0;   // 剛進遊戲（還沒有原本的經驗）、死掉扣經驗不飄
        if (gain > 0 && !stale() && !expHidden()) addFx({ kind: 'exp', id: G.myId, exp: gain });
        if (s.weight != null) weightWarn(s.weight);
        Object.assign(G.st, s); hudUpdate();
    });
    // 第 353 項（職業實測：地監掛 35 分鐘負重 58→203，過一半就不回血了，之前完全沒提醒）：負重 242 段值從 120 以下升到 ≥120（不回魔、≥121 不回血）時提醒一次；
    //   降回 100 以下才會再提醒（在門檻上下抖不洗頻）。剛進世界、換地圖讀取中（stale）不提醒
    let weightWarned = false;
    function weightWarn(w) {
        if (w < 100) { weightWarned = false; return; }
        if (w < 120 || weightWarned || !G.inWorld || stale()) return;
        weightWarned = true;
        const t = '背包超過一半重量，體力、魔力不會自然恢復了，回村把東西賣給萬物收購商。';
        hud.chat(t, 'sys', 'c-sys'); hud.toast(t);
    }
    // 正義值變了（S_Lawful：自己的、身邊玩家的都會收到）：自己的寫進能力；別人的記在角色上（名字顏色，calc.js lawfulColor）
    c.on('lawful', l => { const o = G.objs.get(l.id); if (o && o.isPc) o.lawful = l.lawful; if (l.id === G.myId) { G.st.lawful = l.lawful; hudUpdate(); } });
    // 紫色名字（S_PinkName：打了藍名玩家，伺服器 L1PinkName，D 角色、D 秒數）：這段時間名字畫紫色
    c.on('pinkName', p => { const o = G.objs.get(p.id); if (o) o.pinkUntil = performance.now() + p.sec * 1000; });
    // 自己的異常狀態（血條換色用，對照表在 hud.js BAR_LOOK）：S_Poison 綠／灰、S_Paralysis 麻痺／詛咒麻痺／冰凍、S_Web 魔法封印
    c.on('poison', p => { if (p.id === G.myId) { G.st.poison = p.green; G.st.grayPoison = p.gray; hudUpdate(); } });
    c.on('paralysis', t => {   // S_Paralysis：前一個＝開始、後一個＝解除（睡眠、暈眩、束縛只拿來鎖操作，見 helpless／immobile）
        const k = { 2: ['paralysis', true], 3: ['paralysis', false], 4: ['paralysis2', true], 5: ['paralysis2', false], 10: ['sleep', true], 11: ['sleep', false],
            12: ['freeze', true], 13: ['freeze', false], 22: ['stun', true], 23: ['stun', false], 24: ['bind', true], 25: ['bind', false] }[t];
        if (k) { ccSet(k[0], k[1]); if (k[1] && immobile()) stopPath(); hudUpdate(); }
    });
    c.on('status', s => { G.st.silenced = s.silenced; hudUpdate(); });
    c.on('curseBlind', t => blindSet(t));   // 失明（S_CurseBlind，伺服器第 755 項起暗黑盲咒也送）：畫暗幕
    c.on('windShackle', w => { if (w.id !== G.myId) objSet(w.id, 'shackleUntil', w.sec > 0 ? performance.now() + w.sec * 1000 : 0); });
    // 右上角狀態圖示（showEffects）：記下這一包和收到的時間（誘捕對照晚到時重畫用）
    //   剩幾秒是伺服器送出那一刻的：接回時補送的舊包，收到的時間往前扣它在轉接等了多久（link.lag），剩餘時間才接得上
    c.on('effects', list => { G.effRaw = { list, at: performance.now() - (link ? link.lag : 0) }; showEffects(G.effRaw); ccCheck('效果清單'); });
    c.on('hp', h => { G.st.hp = h.hp; G.st.maxHp = h.maxHp; hudUpdate(); });
    c.on('mp', m => { G.st.mp = m.mp; G.st.maxMp = m.maxMp; hudUpdate(); });
    // 背包多了東西：跟伺服器要每格的道具編號（同款裝備疊成一格要用；未鑑定的名字看不出是哪種），連續拿到很多件只要一次
    const askTpl = () => { clearTimeout(G.tplTimer); G.tplTimer = setTimeout(() => { if (conn && G.inWorld) conn.invIds(); }, 300); };
    c.on('invList', list => { G.inv.clear(); for (const it of list) G.inv.set(it.id, it); hudUpdate(); hud.refreshWin(); askTpl(); });
    // 新進背包的武器、防具（撿起來、AUTO 拿到、買到）：放那個道具在 3.5C 的音效（equipsound.def，同穿上時那一聲；站長 2026-11-01「撿裝備也要有撿裝備的音效」）
    c.on('invAdd', it => {
        G.inv.set(it.id, it); hudUpdate(); hud.refreshWin(); if (!TPL_OF.has(it.id)) askTpl();
        if (!stale()) { const p = parseItem(it); if (p.tpl && (p.tpl.k === 'w' || p.tpl.k === 'a')) csfx.item(it.gfx); }
    });
    c.on('invDel', id => { G.inv.delete(id); TPL_OF.delete(id); BOUND.delete(id); hudUpdate(); hud.refreshWin(); });
    c.on('invUpdate', u => {
        const it = G.inv.get(u.id); if (!it) return;
        const on = () => { const p = parseItem(it); return p.equipped || p.lit; };
        const was = on();
        Object.assign(it, u); hudUpdate(); hud.refreshWin();
        if (!was && on() && !stale()) csfx.item(it.gfx);   // 穿上、點亮：3.5C 用戶端那個圖示的聲音（equipsound.def）
    });
    c.on('skills', m => { G.skillMasks = m.map((v, i) => v | ((G.skillMasks || [])[i] || 0)); hud.refreshWin(); });   // 學新魔法只送新的位元 → OR 進去
    c.on('skillsDel', m => { if (G.skillMasks) G.skillMasks = G.skillMasks.map((v, i) => v & ~(m[i] || 0)); hud.refreshWin(); });
    c.on('doll', t => { G.dollItem = t > 0 ? G.lastDoll : 0; hud.refreshWin(); });
    c.on('sound', id => { if (!stale()) csfx.server(id); });   // S_Sound：3.5C 用戶端有那個編號就放 3.5C 的
    c.on('autoState', a => {
        const was = G.autoOn;
        G.autoOn = a.on;
        if (a.on && !was) huntHere();   // 掛機地點先記開 AUTO 的地方（一隻都還沒打死時用這個）
        if (link) link.setAuto(a.on);   // 轉接：網頁斷了，AUTO 關著 10 秒就關遊戲連線（不讓角色站著被打死）
        if (!a.on) { G.autoTarget = 0; if (G.me) { G.me.q = []; G.me.pend = null; } }
        clearInterval(autoPingTimer);
        if (a.on) atkStop();   // AUTO 開了：手動攻擊交給 AUTO（不兩邊搶著打）
        if (a.on) autoPingTimer = setInterval(() => { if (conn && G.inWorld && G.autoOn) conn.autoPing(); }, 120000);
        else if (a.reason && a.card) { hud.chat('AUTO 沒開：' + a.reason, 'sys', 'c-sys'); bagCardAsk(a.reason); }   // 第 125 項：背包滿了、沒月卡＝跳月卡引導
        else if (a.reason) { hud.toast('AUTO 停了：' + a.reason); hud.chat('AUTO 停了：' + a.reason, 'sys', 'c-sys'); }
        if (a.on !== was) G.autoState = null;   // 剛開、剛關：上一段的狀態不留（開著時伺服器會用 S_Web 26 送新的）
        hud.setAuto(a.on, G.autoState);
        guide.tick();   // 練功推薦「!」：AUTO 開著藏、關了出來，馬上換（不等每秒那次）
        // 試煉儀式、每日簽到：AUTO 開著不自己跳（開了＝自己跳出來的收起來），AUTO 關了才跳（站長 2026-10-19 實測：登入時蓋住畫面點不到 AUTO）。
        //   跟上次告訴它們的比（不跟 was 比）：走路關 AUTO（userMoved）先把 G.autoOn 改成 false，伺服器回「關了」時 was 已經是 false
        if (a.on !== G.popAuto) { G.popAuto = a.on; trial.auto(a.on); signin.auto(a.on); }
        // AUTO 剛停（自己關或被迫停）：跟伺服器要剛寫好的紀錄記著，**不自動跳**（站長 2026-10-19「掛機紀錄不要再彈出來了，給玩家自己點來看就好了」），按「掛機紀錄」才看
        if (was && !a.on && conn && G.inWorld) conn.autoState();
    });
    // AUTO 目前在做什麼（S_Web 26）：鈕上方的小字；伺服器標警告（回血中（沒藥水）＝卡住了）→ 警告色
    c.on('autoStatus', s => {
        G.autoState = s.text ? { code: s.code, warn: s.warn, text: s.text } : null;
        hud.setAuto(G.autoOn, G.autoState);
    });
    c.on('combat', ms => { G.combatEnd = performance.now() + ms; });   // 第 366 項：戰鬥中到什麼時候（S_Web 66），回選角看它擋
    c.on('prefs', d => prefSync.onLoad(d.ok, d.json));   // 第 299 項：伺服器存的設定（S_Web 199）
    c.on('prefsSaved', res => prefSync.onSaved(res));
    c.on('autoSettings', s => {
        G.autoSettings = s; hud.refreshWin(); dolls.settingsChanged();
        askTpl();   // 補給設定變了：自動賣出清單的「補給用，不賣」跟著換（伺服器放在 invIds 尾端）
        // 第一次收到設定＝角色已經在世界上了：跟伺服器說這版網頁要「AUTO 關著也照顧」（喝水、補血、輔助、解狀態、寵物、自動買賣）
        if (!G.helloSent && conn) { G.helloSent = true; conn.hello(); prefSync.begin((G.me && G.me.name) || (G.curChar && G.curChar.name) || ''); invite.hello(); promo.hello(); }   // 第 299 項：同時跟伺服器要存的設定；第 703 項：邀請好友打招呼（＋綁邀請碼）；第 710 項：推廣系統問狀態
    });
    c.on('petCollars', l => { for (const x of l) { x.name = displayName(x.name); x.tname = displayName(x.tname); } hud.setPetCollars(l); });
    c.on('invIds', m => { TPL_OF.clear(); for (const [k, v] of m) TPL_OF.set(k, v); BOUND.clear(); for (const id of m.bound || []) BOUND.add(id); LOCKED.clear(); for (const id of m.locked || []) LOCKED.add(id); G.lockOk = !!m.locked; hud.setInvIds(m); });   // BOUND：試煉贈品（第 145 項）
    c.on('itemPick', d => hud.itemPick(d));   // 建立物品指令：伺服器回搜尋清單（或只有一件、跳數量視窗）
    c.on('sellInfo', l => hud.sell.info(l));      // 道具售價（S_Web 23）
    c.on('sellResult', r => hud.sell.result(r));  // 賣出結果（S_Web 24）
    // 夥伴清單（有變才送）、寵物裝備（背包裡能穿的）：名字可能是 $編號，換成字
    c.on('companions', d => { for (const x of d.list) { x.name = displayName(x.name); x.tname = displayName(x.tname); x.wpn = displayName(x.wpn); x.arm = displayName(x.arm); } G.comps = d.list; hud.setCompanions(d); });
    c.on('compGear', d => { d.cur = displayName(d.cur); for (const x of d.items) x.name = displayName(x.name); hud.compGear(d); });
    c.on('autoLog', g => {
        awayShow(g);   // 離開一陣子回來：這段時間的結算
        const prev = G.autoLog;
        G.autoLog = g; G.logResetOk = !!g.resetOk; hud.setAuto(G.autoOn, G.autoState);   // 每包都帶「伺服器收不收重置」的旗標（protocol.js）
        if (G.autoOn && g.map === G.mapId && g.kills > (prev && prev.start === g.start ? prev.kills : 0)) huntHere();   // 又打死怪了：掛機地點換成這裡
        // 自己按「掛機紀錄」，或回來時有沒看過的離線掛機紀錄（記在這台裝置看過哪一次）
        const key = 'l1web_seenlog_' + (G.curChar ? G.curChar.name : ''); let seen = null;
        try { seen = localStorage.getItem(key); } catch (e) { /* 無痕 */ }
        //   伺服器有「上次離線掛機明細」（收過 S_Web 20）就不猜了，改跳那份（offlineLog）
        //   AUTO 已經接著開了也跳（同一段只跳一次）：伺服器可能先送 AUTO 開著才送紀錄
        const fresh = g.offline > 0 && String(g.start) !== seen && !G.offLogOk;
        if (G.logWanted) {   // 自己按了「掛機紀錄」
            G.huntGuess = false; G.logWanted = false; hud.showHuntLog(g, G.autoOn, false); try { localStorage.setItem(key, String(g.start)); } catch (e) { /* 無痕 */ }
        }
        else if (fresh) {
            // 離線回來（舊伺服器、沒送 S_Web 20）：不自動跳了（站長 2026-10-19），只把這段記成「上次離線掛機」（offSnap），掛機紀錄底下、設定頁點了再看
            G.offSnap = g; try { localStorage.setItem(key, String(g.start)); } catch (e) { /* 無痕 */ }
        }
        else if (G.logResetAt && performance.now() - G.logResetAt < 5000 && $('lmui-huntlog')) { G.logResetAt = 0; hud.refreshHuntLog(g, G.autoOn); }   // 剛按了重置：伺服器推回歸零的那份，視窗開著就換（AUTO 停了也換）
        else if (G.autoOn && !(G.huntGuess && G.offSnap && G.offSnap.start !== g.start)) hud.refreshHuntLog(g, true);   // 伺服器 AUTO 有變就推：掛機紀錄開著才原地重畫，沒開就只記著
    });
    // 上次離線掛機明細（S_Web 20；登入時伺服器一律送一包，有沒看過的才帶「新的」旗標）：自己按的才開，新的也不自動跳（站長 2026-10-19）
    //   例外：別隻角色的（d.other；站長 2026-10-19「一個帳號只能離線掛一隻，登入其他角色則跳出上一隻離線掛機結算」）一收到就跳，不動自己那份的入口
    c.on('offlineLog', d => {
        G.offLogOk = true;
        if (d && d.other) {
            for (const x of d.loot.concat(d.used, d.petUsed || [])) x.name = displayName(x.name) || x.name;
            hud.showOfflineLog(d);
            return;
        }
        const asked = G.offWanted; G.offWanted = false;
        if (!d) { if (asked) hud.toast('還沒有離線掛機紀錄'); return; }
        if (!asked) return;
        if (G.huntGuess) { G.huntGuess = false; const h = $('lmui-huntlog'); if (h) h.remove(); }   // 先猜著跳的掛機紀錄收掉，換這份
        for (const x of d.loot.concat(d.used, d.petUsed || [])) x.name = displayName(x.name) || x.name;   // 名字可能是 $編號（第 463 項：夥伴用掉的也是）
        hud.showOfflineLog(d);
    });
    // 線上玩家清單：進遊戲送一次完整的，之後伺服器只推有變的（上下線、換地圖、升級）
    c.on('admin', d => { admin.onPacket(d); if (d.k === 1) { G.manager = !!d; hud.setManager(d); } });
    c.on('players', u => {
        if (u.full) G.players.clear();
        for (const id of u.removed) G.players.delete(id);
        for (const p of u.list) G.players.set(p.id, p);
        showPlayers();
    });
    c.on('mapId', m => setMap(m.map));
    // 記憶座標（S_Bookmarks）：進遊戲每個送一次、新增成功送新的那個、改顏色送改過的（同編號＝換掉）；一直照名稱排好（bmSort）
    c.on('bookmark', b => { const i = G.bookmarks.findIndex(x => x.id === b.id); if (i >= 0) G.bookmarks[i] = b; else G.bookmarks.push(b); bmSort(); hud.refreshWin(); });
    c.on('teleport', () => { for (const id of [...G.objs.keys()]) if (id !== G.myId) G.objs.delete(id); hitBy.clear(); impactAt.clear(); G.lock = null; atkStop(); G.fx.length = 0; stopPath(); hud.npc.close(); });
    c.on('object', onObject);
    c.on('move', onMove);
    c.on('remove', id => { if (id === G.myId) return; const o = G.objs.get(id); if (o && G.lock === o) G.lock = null; G.objs.delete(id); hitBy.delete(id); impactAt.delete(id); });   // 打過的怪、打中時間也一起刪（不然整晚掛機一直累積）
    c.on('heading', h => { const o = G.objs.get(h.id); if (o && o !== G.me) o.heading = h.heading; });
    c.on('action', onAction);
    // NPC：商店清單、收購清單、倉庫清單（npc.js）；收購時身上沒東西＝伺服器回對話 nosell
    c.on('shopBuy', p => hud.npc.shopBuy(p));
    c.on('taxRate', d => hud.npc.taxRate(d));   // 第 122 項：城主按了侍從長的「調整稅率」
    c.on('shopSell', p => hud.npc.shopSell(p));
    c.on('retrieveList', p => hud.npc.retrieve(p));
    c.on('mapNpcs', d => { G.mapNpcs = d; G.remoteTalk = true; });   // 此地圖的 NPC（狩獵場分頁每秒看一次，有變就重畫）
    c.on('craftList', d => { hud.craft.list(d); if (hud.npc.craftList) hud.npc.craftList(d); });   // 一隻 NPC 的配方狀態（S_Web 18）：製作工匠、NPC 對話的製作分頁都照它畫
    // 製作結果（S_Web 19；照原本流程送出的沒有一句，看原版訊息）：NPC 對話的製作分頁按的寫在那個視窗，製作工匠按的寫在製作工匠（沒開就跳提示）
    c.on('craftDone', r => { if (hud.npc.craftDone && hud.npc.craftDone(r)) return; const t = hud.craft.done(r); if (t && !hud.craft.isOpen()) hud.toast(t); });
    c.on('npcHtml', h => {
        // 變形術：伺服器要這個人選外型（S_ShowPolyList，目標是被變的人；自己放、別人放給自己，都是自己的編號）
        if (h.html === 'monlist') { if (h.id === G.myId) hud.polyMenu({ level: G.st.level || 0, gfx: G.me ? G.me.gfx : 0, morphed: !!(G.me && !CLASS_OF_GFX[G.me.gfx]) }); return; }
        if (h.html === 'summonlist') { if (h.id === G.myId) summon.openList(summon.pick); return; }   // 戴召喚控制戒指放召喚術：挑一種（summon.js）
        if (h.html === 'RaiseAttr') { if (h.id === G.myId) candle.raiseAttr(); return; }   // 原版 51 級起「選一項能力 +1」（S_bonusstats）：candle.js 的能力點數視窗
        if (h.html === 'nosell' && h.id === hud.npc.npcId()) hud.npc.noSell(); else hud.npc.serverHtml(h.id, h.html, h.data);
    });
    // 妖精選好屬性（S_PacketBox 15 MSG_ELF：1 火、2 水、3 風、4 地）：照 3.5「忽然全身充滿了○的靈力。」
    c.on('elfMsg', v => {
        const w = ['', '火', '水', '風', '地'][v]; hud.npc.elfDone(['', 'f', 'w', 'a', 'e'][v]);   // 第 117 項：畫面中間的屬性特效、艾利溫視窗換成魔法清單
        if (w) G.elfAttr = [0, 2, 4, 8, 1][v];   // 伺服器接著會推 S_Web 35（新伺服器），舊伺服器靠這裡
        if (w) { const t = '忽然全身充滿了' + w + '的靈力。'; hud.chat(t, 'sys', 'c-sys'); hud.toast(t); }
    });
    // 血盟：血盟資訊（S_Web 15，伺服器有變就推）、有人申請加入（盟主的「是／否」）
    c.on('clanInfo', i => { clan.onInfo(i); warBar.sync(); });
    c.on('clanRecruit', d => clan.onRecruit(d));   // 第 310 項：血盟招募板
    c.on('clanWhLog', d => clan.onWhLog(d));    // 第 112 項：血盟倉庫紀錄（倉庫視窗的「紀錄」分頁）
    c.on('rankChanged', v => { const n = RANK_NAME[v]; if (n) hud.chat('你的階級變更為' + n + '。', 'sys', 'c-sys'); });   // 伺服器第 466 項：盟主改了你的階級（S_PacketBox 27）
    c.on('clanWar', w => clan.onWar(w));        // 第 111 項：開戰、投降、結束、勝利（原版 S_War）
    c.on('emblem', m => clan.onEmblem(m));      // 第 111 項：盟徽（名字左邊畫）
    c.on('yesNo', y => { if (RES_YN.has(y.type)) { resYesNo(y); return; } if (y.type === 738 || y.type === 7381) { expYesNo(y); return; } if (!clan.onYesNo(y) && !party.onYesNo(y)) console.warn('[yesNo] 還沒處理的種類', y.type, y.args); });
    c.on('party', p => party.onPacket(p));   // 組隊名單（S_PacketBox 104／105／106／110）
    // 製作：伺服器問要做幾個（材料夠好幾份）→ 回製作視窗填的數量（上限照伺服器算的）；不是製作視窗按的不回
    //   旅館（第 138 項）：伺服器問要幾把鑰匙（S_HowManyKey，對話檔 inn2／inn12）→ 回旅館分頁填的把數；動作字串伺服器不看
    c.on('inputAmount', p => {
        if (p.html === 'inn2' || p.html === 'inn12') { const k = hud.npc.innAmount(p.id); if (k && conn) conn.npcAmount(p.id, Math.max(1, Math.min(k, p.max)), ''); return; }
        const n = hud.npc.makeAmount(p.id, p.action); if (n && conn) conn.npcAmount(p.id, Math.max(1, Math.min(n, p.max)), p.action);
    });
    c.on('attack', a => { if (!stale()) onAttack(a); else { const o = G.objs.get(a.atk); if (o && o !== G.me && a.heading != null) o.heading = a.heading; } });
    c.on('rangeSkill', a => { if (!stale()) onRangeSkill(a); });
    // 效果圖的音效（3.5C 用戶端：效果圖第幾幀放哪個）：自己身上的（AUTO 補血、輔助、別人幫你加的）、自己剛放的魔法落在別人身上／地上的；
    //   3.5C 這個效果圖沒聲音的，自己身上的照原本認魔法放（spellEcho）
    c.on('effect', e => {
        if (stale()) return;
        addFx({ kind: 'gfx', gfx: e.gfx, id: e.id, x: e.x, y: e.y });
        const mine = e.id && e.id === G.myId, cast = G.castFx && G.castFx.gfx === e.gfx && performance.now() - G.castFx.at < 3000;
        const auto = G.autoOn && e.id && e.id === G.autoTarget;   // AUTO 放的（伺服器施法，網頁沒有 castFx）：站長 2026-11-07「衝暈後沒有暈眩音效」
        if ((mine || cast || auto) && csfx.effect(e.gfx)) return;
        if (mine) spellEcho(e.gfx);
    });
    // 王族「精準目標」（S_TrueTarget，自己和線上血盟成員都收到）：被標的那隻頭上畫準星（world.js drawLabel）；原版用戶端標多久沒查到，先 16 秒
    c.on('trueTarget', t => { const o = G.objs.get(t.id); if (o) o.trueMark = { until: performance.now() + 16000, text: t.text || '' }; });
    c.on('invis', v => { const o = G.objs.get(v.id); if (o) o.invis = v.on; });   // 隱身／現形（暗隱術、隱身術）：world.js 畫成半透明（原本沒處理，看不出自己隱身了）
    c.on('light', v => { const o = G.objs.get(v.id); if (o) o.light = v.size; });   // 光的大小變了（日光術、點燈／熄燈）：world.js 腳下畫一圈柔光（角色封包的 light 欄位是進視野時的值，見 onObject）
    // 被救活（S_Resurrection：返生術、終極返生術、復活卷軸按了「復活」後）：屍體站起來、外型換回本來的；是自己＝收掉死亡畫面。
    //   原本沒處理 → 伺服器已經救活（血也回了），畫面一直躺著、只能按重新開始回村（2026-10-18 法師魔法測試回報）
    c.on('resurrect', v => {
        const o = G.objs.get(v.id); if (!o) return;
        o.act = null; o.actT = 0; o.pend = null;
        if (v.gfx) o.gfx = v.gfx;
        if (o === G.me) { meDead(false); hudUpdate(); }
    });
    c.on('autoTarget', id => { G.autoTarget = id; if (id) hpMineAdd(id); });   // AUTO 正在打的那隻：腳下畫紅圈（同手動鎖定）
    // 誘捕道具（S_Web 34，進世界送）：狀態圖示要用的對照；比身上效果晚到的話，已經收到的效果清單重畫一次
    c.on('lureItems', list => { lure.set(list); if (G.effRaw) showEffects(G.effRaw); });
    c.on('bringStone', d => stone.update(d));   // 連續提煉魔石的進度（S_Web 123，stone.js）
    // 全服強化廣播：畫面上方跑馬燈。道具名是「$70」這種名字編號（轉不出來用伺服器附的樣板中文名）；消失的強化值＝消失前（原本的），成功＝強化後
    c.on('newbie', d => newbie.update(d));
    c.on('tutorial', d => { newbie.reset(); tutorial.update(d); });
    c.on('signin', d => signin.update(d));
    c.on('invite', d => invite.update(d));   // 邀請好友（S_Web 73，第 703 項）
    c.on('promo', d => promo.update(d));   // 推廣系統（S_Web 74，第 710 項）
    c.on('ranking', d => ranking.update(d));
    c.on('top1', d => top1.update(d));
    c.on('silh', d => silh.update(d));   // 怪物剪影大考驗（S_Web 163）
    c.on('market', d => market.update(d));
    c.on('monthCard', d => { if (d.result) { shop.result(d.result); return; } G.card = { ...d, expireAt: d.on ? Date.now() + (d.expire - d.now) * 1000 : 0 }; shop.setCard(d); market.cardChanged(); hudUpdate(); });   // 月卡（S_Web 41，第 119 項）
    c.on('mail', d => mail.update(d));   // 信箱（S_Web 39）
    c.on('charReset', d => candle.update(d));   // 回憶蠟燭、升級點數（S_Web 40）
    c.on('dolls', d => { dolls.update(d); hud.refreshWin(); showEffects(G.effRaw || { list: [], at: performance.now() }); });   // showEffects：右上角召喚中的娃娃那格跟著變   // refreshWin：設定 → 召喚「沒有娃娃時自動召喚」的娃娃清單跟著變（第 153 項）
    c.on('dollResult', r => dolls.result(r));
    c.on('trial', d => trial.update(d));   // 等級試煉獎勵（S_Web 32）：推送＝演儀式、收下的回覆＝下一級或收起來
    // 花金幣學魔法（S_Web 35）：這個職業能花錢學的清單（技能編號 → 價錢、幾級）；學會了另外有 S_AddSkill（skills）、失敗的原因是系統訊息
    c.on('learnMagic', d => { G.learn = new Map(d.list.map(x => [x.sid, x])); if (d.skillFree != null) G.skillFree = !!d.skillFree; if (d.elfAttr != null) { G.elfAttr = d.elfAttr; G.elfReset = d.reset; } if (d.result) G.learnAt = -1e9; hud.refreshWin(); });
    // 自己按了開通／升級（toiPend）之後那一段等級變了＝成功 → 儀式（進世界那包、別的時候送的不放）
    c.on('build', d => { G.build = Object.assign(d, { until: d.left > 0 ? performance.now() + d.left * 1000 : 0, me: (G.me && G.me.name) || (G.curChar && G.curChar.name) || '' }); hud.npc.refresh(); showEffects(G.effRaw || { list: [], at: performance.now() }); });   // 伺服器第 253 項：主城建設（福利員分頁、右上角加成圖示）
    c.on('callArrow', d => call.show(d));   // 伺服器第 237 項：盟友／隊友的穿雲箭
    c.on('mall', d => { if (d.fx) G.mallFx = d.fx; else { if (d.state) payDone.balance(d.state.diamonds); shop.mall(d); } });   // 伺服器第 222 項：商城；第 236 項閃亮封號、名字光環名單（world.js 畫在頭上）
    c.on('treasure', d => treasure.update(d));
    // 伺服器第 596 項：南瓜種植——1 資訊、2 用了種子＝等點地面（tapAt）、3 小地圖紫點、4 這棵不在了
    c.on('pumpkin', d => {
        if (d.a === 1) pumpkin.update(d);
        else if (d.a === 2) { G.castPick = { seed: d.seed }; hud.closeAll(); hud.float('點選要種南瓜的地面', true); }
        else if (d.a === 3) G.pumpkinDots = d.pts;
        else if (d.a === 4) pumpkin.gone(d.id);
    });   // 伺服器第 210 項：寶藏挖掘
    pushInit((a, ep, k, au, r, p, v) => { if (conn && G.inWorld && conn.push) conn.push(a, ep, k, au, r, p, v); }, () => hud.refreshWin());
    c.on('friend', d => friend.onPacket(d));
    c.on('toiPass', list => { G.toiPass = new Set(list); hud.refreshWin(); });   // 伺服器第 603 項：傲慢之塔傳送符開通了哪幾段（狩獵場免費、製作工匠標已開通）   // 伺服器第 584 項：好友
    c.on('push', d => pushOnServer(d));   // 伺服器第 534 項：這支手機的通知開關
    c.on('partyRecruit', d => { G.precruit = d; hud.refreshTab('隊伍'); });   // 伺服器第 517 項：自由招募
    c.on('partyBuff', d => { G.pbuff = Object.assign(d, { at: performance.now() }); hud.refreshTab('隊伍'); hud.setParty(party.barList(), party.buffBar()); party.popRefresh(); });   // 伺服器第 513 項：隊伍增益
    c.on('toiBook', d => {
        const old = G.toiLv; G.toiLv = d.lv;
        if (toiPend >= 0 && old && d.lv[toiPend] !== old[toiPend] && d.lv[toiPend] >= 0) toiCeremony(toiFloorOf(toiPend), d.lv[toiPend]);
        toiPend = -1;
        if (toiWin) toiWin.render();
    });   // 伺服器第 192 項
    // 第 393 項（站長 2026-10-28 狩獵圖鑑）：自己按了開通／升級（huntPend）之後那一區等級變了＝成功 → 儀式（進世界那包、別的時候送的不放）
    c.on('huntDex', d => {
        // 伺服器的能力說明寫「防禦 −1」（U+2212），Big5 編不出來、到這裡變成「防禦 ?1」→ 問號後面接數字的換回減號
        for (const x of d.regs) x.desc = x.desc.replace(/\?(?=\d)/g, '−');
        const old = G.huntDex; G.huntDex = d;
        const r = huntPend >= 0 ? d.regs[huntPend] : null, o = r && old ? old.regs[huntPend] : null;
        if (r && o && r.lv !== o.lv && r.lv >= 0) huntCeremony({ ...r, i: huntPend }, huntIcon());   // i＝第幾區（儀式照公式寫升完的能力，第 496 項）
        huntPend = -1;
        if (huntWin) huntWin.render();
    });
    // 第 457 項（站長 2026-10-29 裝備蒐藏）：進世界、要了、登錄之後伺服器送整份；視窗開著就重畫（剛登錄的那格亮一下、沒成功寫原因）
    c.on('collect', d => { const old = G.collect; G.collect = d; if (collWin) collWin.update(d, old); hud.refreshWin(); });
    c.on('announce', m => { if (!shutdownUi.onAnnounce(m)) enhBc.show({ parts: { pre: m.pre, name: m.name, post: m.post } }); });   // 伺服器第 178 項：打倒 BOSS、稀有掉落
    c.on('enhBroadcast', m => enhBc.show({ name: m.name, item: displayName(m.code) || m.itemName, en: m.fail ? m.en0 : m.en1, bless: m.bless, fail: m.fail }));
    c.on('loot', l => { if (stale()) return; if (!lootFx) lootFx = createLootFx(cv, world, view, () => G.me); lootFx(l); });   // 打怪拿到的東西飛到身上（loot.js）
    c.on('visual', v => { const o = G.objs.get(v.id); if (!o) return; o.weapon = v.weapon; if (!o.isPc && SINK_GFX.has(o.gfx)) o.sunk = sunkBy(o, v.weapon); });   // 會潛地的怪的「外觀狀態」：11／20＝在地底
    c.on('poly', p => { const o = G.objs.get(p.id); if (o) { if (o.isPc && CLASS_OF_GFX[o.gfx]) o.baseGfx = o.gfx; o.gfx = p.gfx; o.weapon = p.weapon; if (o === G.me) csfx.preloadMe(p.gfx); } });
    c.on('haste', h => { if (h.id === G.myId) G.hasteSt = h.type; else objSet(h.id, 'mv', h.type); });   // 一段加速（S_SkillHaste：1 加速、2 緩速、0 沒有）：自己 mySpeed、別人 objSpeed 用
    c.on('brave', b => objSet(b.id, 'brave', b.type));   // 二段（自己看狀態圖示，mySpeed）
    c.on('liquor', l => { if (l.type === 8 || l.type === 0) objSet(l.id, 'third', l.type === 8); });
    c.on('title', t => { const o = G.objs.get(t.id); if (o) o.title = t.title; });
    // 站長 2026-11-04「看不到別人打怪的血條，除非自己有去打那隻怪才出現血條」：怪的血量先記在 hpRaw，自己（或自己的夥伴）打過、被牠打過的（hpMine）才畫
    c.on('hpMeter', h => { const o = G.objs.get(h.id); if (o) { o.hpRaw = h.ratio === 0xff ? null : h.ratio / 100; o.hpR = (o.isPc || o.master || hpMine.has(h.id)) ? o.hpRaw : null; } party.onHp(h.id, h.ratio); });   // 隊友的血量：不管多遠伺服器都送（隊伍分頁）
    c.on('chat', onChat);
    c.on('serverMsg', onServerMsg);
    c.on('disconnect', () => { /* 伺服器馬上會關連線，交給 onclose */ });
}
// 狩獵場付費傳送（狩獵場視窗、練功推薦 guide.js 都走這裡）：只送目的地編號，錢、能不能傳由伺服器判斷
function webTeleport(id) {
    if (!conn || !G.inWorld) return;
    G.actAt = performance.now(); stopPath(); G.talkTo = 0; G.pickTo = 0; conn.webTeleport(id);
    const t = TELEPORTS.find(x => x.id === id); if (t) world.preload(t.map, t.x, t.y, 10);   // 伺服器送過去之前先抓目的地的圖（錢不夠、傳不了也只是多抓幾個檔）；一個畫面左右
}
function disconnect() {
    prefSync.end();   // 第 299 項：連線還在就把沒送的設定送掉
    clearInterval(keepTimer); clearInterval(autoPingTimer); relinkDone();
    const l = link; link = null; conn = null;
    if (l) l.close();
    G.inWorld = false; G.me = null; G.myId = 0; G.objs.clear(); G.inv.clear(); G.toiPass = null; G.lock = null; atkStop(); stopPath(); mapLoad.cancel();
    trial.reset();   // 儀式蓋著整個畫面：斷線回登入畫面時一定要收掉
}
// ── 斷線接回：手機切背景、關螢幕，系統會關掉 WebSocket；轉接那邊的遊戲連線會保留一段時間（server/relay.mjs）。
//   遊戲中斷了先蓋「重新連線中…」，馬上、每 3 秒、回到前景、網路恢復時用接續碼接回（link.js）；接不回才回登入畫面
let relinkTimer = 0, relinkAt = 0, relinkShowT = 0;
// 站長 2026-11-03「有時候會跳出重新連線中」：實測多數斷線一秒內就接回（補送幾百 bytes），那層蓋上去又馬上收掉只會嚇人 → 先接，RELINK_SHOW_MS 內接回就不蓋
const RELINK_SHOW_MS = 1500;
function relinkStart() {
    G.reconnecting = true; relinkAt = Date.now();
    stopPath(); keys.clear(); pointer.down = false; G.talkTo = 0; G.pickTo = 0; G.castPick = null; G.castWalk = null;
    clearTimeout(relinkShowT); relinkShowT = setTimeout(() => { if (G.reconnecting) relinkUi.show(); }, RELINK_SHOW_MS);
    clearInterval(relinkTimer); relinkTimer = setInterval(relinkTry, 3000);
    relinkTry();
}
async function relinkTry() {
    const l = link;
    if (!l || !G.reconnecting || l.state !== 'down') return;
    if (document.hidden && TOUCH.matches) return;   // 手機切走時不在背景一直試（回來 visibilitychange 再接；太久轉接會關）
    if (Date.now() - relinkAt > (l.grace + 15) * 1000) { lost(); return; }   // 一直連不上網路：轉接那邊也早就放棄了
    if (await l.resume() && link === l) relinkDone();
}
function relinkDone() {
    G.reconnecting = false; clearInterval(relinkTimer); clearTimeout(relinkShowT); if (relogTry < 0) relinkUi.hide();
    ccCheck('斷線接回');
    if (awayWanted && conn && G.inWorld && link && link.state === 'open') conn.autoState();   // 接回了：跟伺服器要現在的掛機紀錄（離開期間的結算）
}
// 自動重新登入（有通行碼）：遊戲中斷了接不回（手機切走太久轉接關了、轉接重啟）、網頁被系統重新載入 → 用通行碼直接進原本那隻。
//   切走中先記著，回來再登；連不上（伺服器重啟中、沒網路）隔一陣子再試，幾次都不行才回登入畫面；通行碼失效直接回登入畫面
const RELOG_WAIT = [0, 2000, 4000, 8000, 16000];
let relogTry = -1, relogT = 0;
// 站長 2026-11-02「重開後畫面回到選人物那邊，不然在掛直接上一直被怪打」：遊戲伺服器那邊關的連線（轉接送 bye：重開、踢人）登回後停在選角、選好原本那隻，
//   玩家自己按進入；手機切走、網路斷的（沒有 bye，角色多半還在離線掛機）照舊直接進
let relogStay = false, staySel = false;   // staySel：停在選角等玩家按（伺服器重開過）；這時又斷了（伺服器真的關掉）＝再登回選角
// 伺服器重開：倒數到了先踢人、再存檔關機，中間還收連線——馬上登回會登進快要關的那台、接著又被踢 → 先等 8 秒，最多等 2 分鐘多（換版約 40 秒）
const RELOG_WAIT_SRV = [8000, 8000, 10000, 15000, 20000, 30000, 40000];
function relogStart() {
    if (!passGet()) return false;
    if (document.hidden) { G.relogWanted = true; return true; }
    G.relogWanted = false;
    if (start.screen === 'game') relinkUi.show(); else start.showLogin('連線中…');
    relogTry = 0; relogNext();
    return true;
}
function relogNext() {
    clearTimeout(relogT);
    const p = passGet();
    if (!p) { relogEnd(); start.showLogin(''); return; }
    const waits = (relogStay || staySel) ? RELOG_WAIT_SRV : RELOG_WAIT;
    if (relogTry >= waits.length) { relogEnd(); staySel = false; start.showLogin('連線中斷了，請重新登入'); return; }
    relogT = setTimeout(() => connect('', '', 0, p), waits[relogTry++]);
}
function relogEnd() { relogTry = -1; clearTimeout(relogT); G.relogWanted = false; if (!G.reconnecting) relinkUi.hide(); }
// 切走（換 App、切分頁、關螢幕）：畫面、音樂音效、畫面用的計時都停，只留連線（封包照收，狀態照更新）。
//   手機（主要靠觸控）再請轉接計時：AWAY_SEC 秒內沒回來就關遊戲連線（AUTO 開著＝伺服器轉離線掛機、關著＝登出），不讓手機在背景一直收封包發燙。
//   計時放轉接：背景時網頁的程式常常整個停住（iPhone），自己計時不可靠。桌機只停畫面，不斷線。（站長 14:30）
const AWAY_SEC = 60;
const TOUCH = matchMedia('(pointer: coarse)');
let bgHidden = false;
function onHidden() {
    if (bgHidden) return; bgHidden = true;
    prefSync.flush();   // 第 299 項：手機切背景可能就此被關，沒送的設定先送
    audioHidden(true);
    awayMark();
    if (link && G.inWorld && TOUCH.matches) link.hidden(AWAY_SEC);
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') { onHidden(); return; }
    bgHidden = false;
    audioHidden(false);
    if (!rafId) rafId = requestAnimationFrame(loop);
    awayBack();
    if (G.relogWanted) { relogStart(); return; }   // 切走時被斷了：回來用通行碼登回去
    if (!link) return;
    link.shown();
    if (G.reconnecting) relinkTry(); else if (G.inWorld) link.check();   // 回到前景：連線看起來開著也確認一下還活著
});
window.addEventListener('pagehide', onHidden);
// ── 離開期間的掛機（站長 2026-10-22「網頁不關把它縮小 不會顯示掛機收益」）：切走時記下掛機紀錄（S_Web 3），回來超過 AWAY_LOG_MS 就跟伺服器要現在的，
//   相減＝這段時間打到的，跟「上次離線掛機」同樣排法的結算。中間斷線接回、自動登回同一隻都算（伺服器的掛機紀錄接著算）。
//   不自動跳（站長同日「玩家自己點」）：交給 hud.setAwayLog——掛機紀錄底下多一顆「離開期間」、掛機紀錄鈕上亮紅點。什麼都沒打到、AUTO 也還開著就不記
const AWAY_LOG_MS = 60000;
let awaySnap = null, awayWanted = false;
function awayMark() {
    if (awaySnap && awayWanted) { awayWanted = false; return; }   // 上一段還沒結算又切走：從上一段開始算
    awaySnap = G.inWorld && G.autoOn && G.autoLog && G.curChar ? { log: G.autoLog, at: Date.now(), name: G.curChar.name } : null;
}
function awayBack() {
    if (!awaySnap) return;
    if (Date.now() - awaySnap.at < AWAY_LOG_MS) { awaySnap = null; return; }
    awayWanted = true;
    if (conn && G.inWorld && !G.reconnecting && link && link.state === 'open') conn.autoState();   // 斷線中：接回後（relinkDone）再要；登回同一隻伺服器自己會送
}
function awayShow(g) {   // 收到掛機紀錄（autoLog）
    const s = awaySnap;
    if (!awayWanted || !s || stale() || !G.curChar || G.curChar.name !== s.name) return;
    awayWanted = false; awaySnap = null;
    const a = s.log, same = g.start === a.start;
    if (!same && g.start * 1000 < s.at - 5000) return;   // 中間重新開始算過、又不是切走之後才開的：這段算不出來
    const b = same ? a : { kills: 0, exp: 0, gold: 0, levels: 0, items: [], net: null };
    const key = x => x.name + '|' + x.bless + '|' + (x.attrKey || '');
    const had = new Map(); for (const x of b.items) had.set(key(x), (had.get(key(x)) || 0) + x.count);
    const loot = [];
    for (const x of g.items) { const n = x.count - (had.get(key(x)) || 0); if (n > 0) loot.push(Object.assign({}, x, { count: n, name: displayName(x.name) || x.name })); }
    const bn = b.net || { sold: 0, bought: 0, repair: 0 };
    const d = { start: Math.floor(s.at / 1000), end: Math.floor(Date.now() / 1000), map: g.map, kills: Math.max(0, g.kills - b.kills), exp: Math.max(0, g.exp - b.exp),
        gold: Math.max(0, g.gold - b.gold), levels: Math.max(0, g.levels - b.levels), loot, reason: G.autoOn ? '' : g.reason || '',
        net: g.net ? { sold: g.net.sold - bn.sold, bought: g.net.bought - bn.bought, repair: g.net.repair - bn.repair } : null };
    if (!d.kills && !d.exp && !d.gold && !loot.length && !d.reason) return;
    hud.setAwayLog(d);
}
window.addEventListener('online', () => { if (G.reconnecting) relinkTry(); });
// 遊戲中斷了、接不回，用通行碼登回同一隻（relogSoft）：enter 不關玩家開著的視窗、不清聊天紀錄（站長 2026-10-22「視窗都被關閉然後跳出回到遊戲」）。
//   最常見的是手機關螢幕／切走超過 AWAY_SEC（轉接照設計關遊戲連線、伺服器轉離線掛機），其次是轉接重開（部署）
let relogSoft = false, softAt = -1e9;
// 第 503 項：被同帳號的新登入接手（伺服器先送 357 再關連線）＝玩家在別的分頁、別台裝置登入了：這裡不用通行碼登回去（會把那邊又踢掉，兩邊互搶）
let takenAway = false;
function lost() {
    const wasIn = G.inWorld, srvGone = !!(link && link.bye);
    // 站長 2026-11-03「維修時候登入不要登入到人物畫面，登入時候顯示目前伺服器維修中」：轉接說維修中＝回登入頁留著訊息，不自動重登
    if (link && link.maint) { disconnect(); relogEnd(); staySel = false; relogStay = false; start.showLogin('伺服器維修中，請稍後再試'); start.maint(true); return; }
    if (takenAway) { takenAway = false; passClear(); relogSoft = false; disconnect(); relogEnd(); start.showLogin('這個帳號在別的地方登入了'); return; }
    disconnect();
    if (relogTry >= 0) { relogNext(); return; }   // 自動登入中又斷了：等一下再試
    relogSoft = wasIn && !srvGone;
    if (wasIn && srvGone) relogStay = true;
    if (!wasIn && staySel && passGet()) { relogStay = true; if (relogStart()) return; }   // 停在選角時伺服器才真的關掉：再登回選角
    if (wasIn && relogStart()) return;
    relogStay = false;
    relogSoft = false;
    start.showLogin(wasIn ? '連線中斷了，請重新登入' : '連不上伺服器，請稍後再試');
}
function enter(ch) {
    if (!ch || !conn) return;
    staySel = false;
    relogEnd();
    const soft = relogSoft && start.screen === 'game' && !!G.curChar && G.curChar.name === ch.name;   // 自動登回失敗、回過登入畫面的不算
    relogSoft = false; softAt = soft ? performance.now() : -1e9;
    const sameChar = !!G.curChar && G.curChar.name === ch.name;   // 這個網頁上次進遊戲的也是這隻：聊天紀錄留著（hud.clear keepChat）
    G.curChar = ch;
    G.objs.clear(); G.inv.clear(); G.me = null; G.myId = 0; G.hasteSt = 0; G.st = { type: ch.type >= 32 ? ch.type - 32 : ch.type }; G.mapId = -1; G.skillMasks = null; G.lock = null; atkStop(); stopPath();
    G.forceArm = false; forceSync();   // 強制攻擊鈕：換角色、重進遊戲從熄的開始
    G.arrowTpl = 0; G.dollItem = 0; G.lastDoll = 0; G.castPick = null; G.mapNpcs = null; G.mapNpcsAsk = -1e9; G.learn = null; G.learnAsk = -1e9; G.learnAt = -1e9; G.elfAttr = null; G.elfReset = null;
    G.bookmarks = [];   // 記憶座標：進遊戲時伺服器一個一個送（S_Bookmarks）
    G.autoOn = false; G.popAuto = false; G.autoState = null; G.autoSettings = null; G.autoLog = null; G.logWanted = false; G.helloSent = false; clearInterval(autoPingTimer); hud.setAuto(false);
    G.offLogOk = false; G.offWanted = false; G.huntGuess = false; G.offSnap = null;
    G.combatEnd = 0;   // 第 366 項：換角色、重新進世界從不在戰鬥中算（伺服器新的角色物件會重送 S_Web 66）
    const mailWas = soft && mail.isOpen();   // 同一隻自動登回：信箱開著就重開（reset 會關掉；伺服器那邊重抓一次清單）
    G.players.clear(); G.fx.length = 0; G.manager = false; meDead(false); clan.reset(); admin.reset(); party.reset(); newbie.reset(); tutorial.reset(); trial.reset(); mail.reset(); candle.reset(); if (!soft) G.card = null;
    if (!soft) { signin.reset(); invite.reset(); promo.reset(); dolls.reset(); guide.reset(); ranking.reset(); top1.reset(); silh.reset(); market.reset(); shop.reset(); sellTipReset(); payDone.reset(); }   // 簽到、魔法娃娃、練功推薦的視窗：同一隻登回來留著（資料伺服器會重送）
    G.effRaw = null; lure.reset(); stone.reset();   // 誘捕：等這隻角色進世界的 S_Web 34
    if (!soft) { G.huntDex = null; huntAskAt = 0; }   // 第 393 項：狩獵圖鑑綁角色，換角色要重新要（伺服器進世界不主動送）
    if (!soft) { G.collect = null; collAskAt = 0; }   // 第 457 項：裝備蒐藏（伺服器進世界會送；舊伺服器不送＝卡片未開放）
    hud.clear(soft, sameChar);
    start.show('game');
    G.inWorld = true;
    setTimeout(() => { if (G.inWorld) pushAsk(); }, 1500);   // 伺服器第 534 項：問這支手機的通知開關
    if (mailWas) setTimeout(() => { if (G.inWorld && G.curChar === ch) mail.open(); }, 1000);   // 等伺服器那邊角色進世界再要清單
    hudUpdate();
    link.setWorld(true);   // 遊戲中：斷線時轉接保留遊戲連線等接回
    link.setAuto(false);   // 換了角色：等伺服器說這隻 AUTO 開沒開
    conn.enterWorld(ch.name);
    clearInterval(keepTimer);
    keepTimer = setInterval(() => { if (conn && G.inWorld) conn.keepAlive(); }, KEEPALIVE_MS);
    requestAnimationFrame(() => { hud.measureNav(); resize(); });
    setTimeout(() => { if (G.inWorld && G.curChar === ch) payDone.check(); }, 2500);   // 離線時入帳的儲值：進來站穩了再跳（paydone.js）
}

// ── 世界 ──────────────────────────────────────────
// 旅館房間（伺服器 WebInn：地圖 16384～25088，每 512 一間）：回魔照原版規則，負重 242 段值 ≥120 或飽食度 < 3 自然回魔歸零（MpRegeneration.regenAmount）
const isInnRoom = id => id >= 16384 && id <= 25088 && id % 512 === 0;
function innRegenTip(id) {
    if (G.mapId !== id || !G.inWorld || stale()) return;
    const t = (G.st.weight | 0) >= 120 ? '背包太重，在旅館也不會回魔，先把東西存倉庫' : G.st.food != null && G.st.food < 3 ? '太餓了，在旅館也不會回魔，先吃點東西' : '';
    if (t) { hud.chat(t, 'sys', 'c-sys'); hud.toast(t); }
}
function setMap(id) {
    // 伺服器每次送地圖編號（進遊戲、傳送——同一張圖也是、死了重新開始）都會把它那邊「看得到的」清掉（removeAllKnownObjects）再重送一遍
    //   → 這裡也一律清掉自己以外的；原本只有換地圖才清，同一張圖傳送（AUTO 沒怪瞬移、狩獵場傳送）傳送前看到的會一直留著
    for (const k of [...G.objs.keys()]) if (k !== G.myId) G.objs.delete(k);
    G.lock = null; atkStop(); G.fx.length = 0; stopPath(); hud.npc.close();
    const newMap = G.mapId !== id, prevMap = G.mapId;
    G.mapId = id;
    ccCheck('傳送');
    if (newMap && isInnRoom(id)) setTimeout(() => innRegenTip(id), 2500);   // 站長 2026-11-10：旅館裡太重、太餓不回魔要提示（能力值隨後才到，晚一點看）
    // 換地圖：「此地圖 NPC」重新要一份。進遊戲的第一張圖也要（G.mapNpcsAsk < 0＝這次登入還沒問過）：伺服器回了才知道支援遠距離對話（G.remoteTalk）——
    //   原本只有打開狩獵場「此地圖 NPC」分頁才問 → 沒開過的人點 NPC 照舊要走到旁邊，站在屋裡的（奇岩雜貨店 邁爾、傑夫、迪艾司）走不到就「走不過去」（站長 2026-10-23）
    if (newMap && (G.remoteTalk || G.mapNpcsAsk < 0) && conn) { G.mapNpcsAsk = performance.now(); conn.mapNpcs(); }
    mapLoad.begin(mapLabel(id));   // 進遊戲、每次傳送（同一張圖也是）伺服器都先送地圖編號，再送自己的新位置
    $('maptip').classList.add('hidden');
    place();
    // 傲慢之塔（地圖 101～200＝1～100 樓）：從塔外進來、或換到另一段（每 10 樓一段）＝浮出這裡有效的加成約 2 秒（toibook.js toiEnterTip；站長 2026-10-31）
    const toiF = m => (m >= 101 && m <= 200 ? m - 100 : 0), toiSeg = f => Math.floor((f - 1) / 10);
    const enterTower = newMap && toiF(id) && (!toiF(prevMap) || toiSeg(toiF(prevMap)) !== toiSeg(toiF(id)));
    world.setMap(id).then(() => { place(); if (enterTower && G.mapId === id && G.toiLv) toiEnterTip(toiF(id), toiState()); }).catch(e => {
        console.warn('[map] 地圖 ' + id + ' 沒有畫面資料（data/maps/' + id + '）；要畫出來：node tools/gen-data.mjs --maps ' + id, e);
        const tip = $('maptip');
        tip.textContent = '這個地方的畫面還沒準備好，可以繼續聊天，或按「狩獵場」傳送回村莊。';
        tip.classList.remove('hidden');
    });
}
function newActor(o) {
    return { id: o.id, x: o.x, y: o.y, fx: o.x, fy: o.y, sx: o.x, sy: o.y, tx: o.x, ty: o.y, t: 1, walking: false, stepMs: STEP_MS,
        mv: o.isPc ? o.speed : 0, brave: o.brave || 0, third: !!o.third,
        heading: o.heading, gfx: o.gfx, weapon: o.isPc ? o.status : 0, name: o.name, title: o.title, clan: o.clan, clanId: o.isPc ? o.clanId : 0, isPc: o.isPc, isItem: o.isItem, count: o.count, master: o.master || '', isDoll: !!o.isDoll, phase: Math.random() * 8,
        lawful: o.isPc ? o.lawful : 0, baseGfx: o.isPc && CLASS_OF_GFX[o.gfx] ? o.gfx : 0 };   // 正義值：玩家名字的顏色（calc.js lawfulColor）
}
// 潛地、飛天的怪（L1NpcInstance HIDDEN_STATUS_SINK／FLY）：圖和名字都不畫、點不到（look.js frameFor → HIDDEN）。
//   只有伺服器 L1MonsterInstance.hide／initHide 那幾種會躲——潛地：史巴托 145、底比斯曼陀羅草 6555／6557（外觀狀態、動作 11）、安塔瑞斯 1245（20）；
//   飛天：哈維 1024／2363、格利芬 1204／2353、林德拜爾 2544（動作 44 飛走、45 飛下來；剛出現就在天上的看 S_NPCPack 的飛天旗標 o.fly）。
//   11／20 對別的怪是「拿斧頭／拿弓走路」，不能一律當潛地（2026-10-18 拿弓的妖魔弓箭手整隻不見）。石頭高崙潛地用的是狀態 4（跟其他意思混在一起），照舊畫
const SINK_GFX = new Set([145, 6555, 6557, 1245]), FLY_GFX = new Set([1024, 2363, 1204, 2353, 2544]);
const sunkBy = (o, st) => !o.isPc && SINK_GFX.has(o.gfx) && (st === 11 || st === 20);
// 職業外型（變身畫不出來時 look.js 畫回這個，不讓人整個看不見）：自己照職業、性別；別人照看過的樣子（沒變身時的外型）
const CLASS_GFX = [[0, 1], [61, 48], [138, 37], [734, 1186], [2786, 2796]];
function myClassGfx() { const t = CLASS_GFX[G.st.type || 0] || CLASS_GFX[1]; return t[G.curChar && G.curChar.sex ? 1 : 0]; }
// 站長 2026-11-07「衝暈沒有暈眩音效」：衝擊之暈的暈眩星星是伺服器生的效果物件（npc 81162，外型 4183），3.5C 的暈眩聲 1453 在這張圖上，不是效果封包（4434 那個 1498 是打下去的聲音）。
//   跟其他魔法聲一樣只放跟自己有關的：暈的是自己、鎖定的、AUTO 正在打的，或自己剛放衝擊之暈
const STUN_GFX = 4183;
// 站長 2026-11-07「衝暈音效沒有持續到時間結束」：list.spr 這張圖一圈 6 幀×4×40＝960 毫秒、每圈第一幀放一次 → 星星還在就繼續放（STUN_MAX_MS：伺服器重複暈會疊時間，收不到移除封包也會停）
const STUN_LOOP_MS = 960, STUN_MAX_MS = 15000;
function stunLoop(id, until) {
    setTimeout(() => {
        if (!G.objs.has(id) || performance.now() >= until) return;
        if (!stale()) csfx.effect(STUN_GFX, 0, 'stun');
        stunLoop(id, until);
    }, STUN_LOOP_MS);
}
function stunMine(o) {
    const at = t => !!t && t.x === o.x && t.y === o.y;
    return at(G.me) || at(G.lock) || (G.autoOn && at(G.objs.get(G.autoTarget))) || (!!G.castFx && G.castFx.gfx === 4434 && performance.now() - G.castFx.at < 3000);
}
function onObject(o) {
    if (o.gfx === STUN_GFX && !stale() && stunMine(o)) { csfx.effect(STUN_GFX, 0, 'stun'); stunLoop(o.id, performance.now() + STUN_MAX_MS); }   // 自己一組：跟 1498 幾乎同時，同一組 80 毫秒內的第二個會被吃掉
    // 魔法娃娃：伺服器送的是怪物、職業外型的，換成跟娃娃視窗那張圖同一隻的娃娃外型（doll-gfx.js；站長 2026-10-23「召喚女騎士怎麼是這隻？」）
    if (o.isDoll) o.gfx = dollGfx(o.name, o.gfx);
    const dead = o.status === 8;   // 外觀動作 8＝死了（ACTION_Die）：進視野時就是屍體 → 直接停在死亡最後一幀
    if (o.id === G.myId || (G.me && o.id === G.me.id)) {   // 自己：進入世界、傳送、重新開始後伺服器重送位置
        const me = G.me || newActor(o);
        Object.assign(me, { x: o.x, y: o.y, fx: o.x, fy: o.y, sx: o.x, sy: o.y, tx: o.x, ty: o.y, t: 1, walking: false, heading: o.heading, gfx: o.gfx,
            weapon: dead ? 0 : o.status, name: o.name, isPc: true, isMe: true, act: dead ? 'death' : null, actT: -1e9, q: [], pend: null, walkEnd: null, gap: 0, invis: !!(o.flags & 2), light: o.light, baseGfx: CLASS_OF_GFX[o.gfx] ? o.gfx : myClassGfx() });
        G.me = me; G.objs.set(o.id, me); G.myId = o.id;
        csfx.preloadMe(me.gfx);   // 死亡聲先讀好（第一次死才讀會來不及、不放）
        mapLoad.placed();
        meDead(dead);
        stopPath(); hudUpdate(); place();
        return;
    }
    const old = G.objs.get(o.id);
    if (old) {
        Object.assign(old, { x: o.x, y: o.y, fx: o.x, fy: o.y, tx: o.x, ty: o.y, walking: false, t: 1, heading: o.heading, gfx: o.gfx, name: o.name, clan: o.clan, clanId: o.isPc ? o.clanId : 0, isPc: o.isPc, master: o.master || '', isDoll: !!o.isDoll, q: [], pend: null, walkEnd: null,
            lawful: o.isPc ? o.lawful : 0, mv: o.isPc ? o.speed : 0, brave: o.brave || 0, third: !!o.third, gap: 0,
            sunk: sunkBy(o, o.status) || (!!o.fly && FLY_GFX.has(o.gfx)), invis: !!(o.flags & 2), light: o.light });
        if (o.isPc && CLASS_OF_GFX[o.gfx]) old.baseGfx = o.gfx;
        if (dead && old.act !== 'death') { old.act = 'death'; old.actT = -1e9; } else if (!dead && old.act === 'death') old.act = null;
        return;
    }
    const a = newActor(o);
    a.sunk = sunkBy(o, o.status) || (!!o.fly && FLY_GFX.has(o.gfx));
    a.invis = !!(o.flags & 2);   // 角色封包的隱身位元（看得到隱身的人時）
    a.light = o.light;
    if (dead) { a.act = 'death'; a.actT = -1e9; a.weapon = 0; }
    G.objs.set(o.id, a);
}

// ── 戰鬥畫面（同單機版 afk-townmap）：伺服器送什麼就播什麼——攻擊、受傷、死亡、施法動作，魔法／箭的效果圖，傷害數字 ──
const SKILL_ACT = new Set([17, 18, 19]);   // ACTION_Wand、SkillAttack、SkillBuff
function play(o, act) {
    if (!o || o.act === 'death') return;
    const now = performance.now();
    if (act === 'hurt' && o === G.me && (o.act === 'attack' || o.act === 'skill') && now - o.actT < (o.actMs || 600)) return;   // 自己出手中被打：不打斷出手（同單機版；怪物照樣播受傷）
    o.act = act; o.actT = now; o.walkEnd = null;
    // 攻擊、施法照伺服器的出手時間播（每幀＝出手時間÷幀數）；攻擊播完停在收刀幀，最多再等出手時間的 35%（AUTO 下一刀約在 ×1.08 後）
    o.actMs = actMsOf(o, act); o.holdMs = act === 'attack' && o.actMs ? o.actMs * 0.35 : 0;
}
// 出手：還在走（伺服器說已經走到了，畫面還在走最後一步）就等走完再轉向、出手——不然人邊滑邊揮刀；回傳還要等幾毫秒
function walkLeft(o) { return o.walking ? (1 - o.t) * o.stepMs + (o.q ? o.q.length : 0) * (o.stepMs || STEP_MS) : 0; }
function playAt(o, act, heading) {
    const wait = walkLeft(o);
    if (wait > 0) { o.pend = { act, heading }; return wait; }
    if (heading != null) o.heading = heading;
    play(o, act);
    return 0;
}
// 傷害數字（設定 → 系統「顯示傷害」四格：全部／只看攻擊／只看受到／關閉，hud.js dmgMode）：攻擊傷害＝自己、寵物打出去的（l1web_dmg_out，沒設過＝開）；
//   受到的傷害＝自己被打的（l1web_dmg_self，沒設過＝關）。關掉的那種不飄字；夥伴打的另外一個開關（petDmgHidden，2026-10-31 起不歸攻擊傷害管）
const dmgHidden = me => { try { const v = localStorage.getItem(me ? 'l1web_dmg_self' : 'l1web_dmg_out'); return v == null ? me : v !== '1'; } catch (e) { return me; } };
// 夥伴打的傷害：站長 2026-11-03 取消（一律不畫，設定頁的開關也拿掉；原本 2026-10-31 的 l1web_dmg_pet 開關不再讀）
// 每隻夥伴的數字各一個位置（站長同日「每隻寵物傷害分開」）：照夥伴清單（G.comps）的順序，第 1 隻頭上偏右、第 2 隻偏左、再來更右、更左…（world.js drawNumbers 照 slot 挪）；
//   清單裡沒有的（還沒收到 S_Web 8）照第一次出現的順序排
const petSlotOf = new Map();
function petSlot(id) {
    const i = (G.comps || []).findIndex(c => c.id === id);
    if (i >= 0) return i;
    if (!petSlotOf.has(id)) petSlotOf.set(id, (G.comps || []).length + petSlotOf.size);
    return petSlotOf.get(id);
}
// 經驗值飄字（站長 2026-10-24「設定系統裡 新增顯示經驗值或關閉」）：伺服器送新的累積經驗（S_EXP）比原本多＝自己頭上飄「+N EXP」（world.js drawNumbers）；設定 → 系統可關（沒設過＝開）
const expHidden = () => { try { return localStorage.getItem('l1web_exp_num') === '0'; } catch (e) { return false; } };
function addFx(f) {
    f.t0 = f.t0 || performance.now();
    // 跟著物件播的：先記下它現在的位置（world.js fxPos 平常每格跟著它走）——伺服器送完效果馬上把物件移除的（釋放元素 145 送走召喚獸），
    //   不先記就一格都畫不出來（2026-10-18 妖精魔法測試回報）
    if (f.id && f.x == null) { const o = G.objs.get(f.id); if (o) { f.x = o.fx; f.y = o.fy; f.head = o._head || 50; } }
    G.fx.push(f);
    if (G.fx.length > 150) G.fx.splice(0, G.fx.length - 150);
}
function onAction(m) {   // S_DoActionGFX
    const o = G.objs.get(m.id); if (!o) return;
    const old = stale();   // 斷線那段死的：直接躺著（屍體），不播倒下、不出聲
    if (m.action === 8 && old) {
        impactAt.delete(o.id);
        o.act = 'death'; o.actT = -1e9; o.walking = false; o.pend = null; if (o.q) o.q.length = 0;
        if (o === G.me) { meDead(true); stopPath(); }
        return;
    }
    if (m.action === 8) {
        const die = () => {
            if (o.act === 'death' && o.actT > 0) return;
            o.act = 'death'; o.actT = performance.now(); o.walking = false; o.pend = null; if (o.q) o.q.length = 0;
            if (o === G.me) { meDead(true); stopPath(); csfx.meDeath(G.st.type || 0, G.curChar && G.curChar.sex, o.gfx); }
            else if (!o.isPc && performance.now() - (hitBy.get(o.id) || -1e9) < 10000) { hitBy.delete(o.id); csfx.mobDeath(displayName((o.name || '').trim()), o.gfx); }
        };
        // 那一刀（魔法飛到）畫面上打到之後才倒下、才出聲。伺服器有時先送死亡、才送打死牠的那個攻擊封包（風刃、冰箭擊殺）→
        //   還沒有打中時間的先等 DEATH_WAIT 看攻擊封包會不會來（2026-10-18 測試回報：怪比魔法先倒下）
        const fall = () => {
            const wait = (impactAt.get(o.id) || 0) - performance.now();
            impactAt.delete(o.id);
            if (wait > 0) { o.pend = null; setTimeout(die, wait + 60); } else die();
        };
        if (o !== G.me && !impactAt.has(o.id)) setTimeout(fall, DEATH_WAIT); else fall();
        return;
    }
    if (!o.isPc && ((SINK_GFX.has(o.gfx) && (m.action === 11 || m.action === 20)) || (FLY_GFX.has(o.gfx) && m.action === 44))) { o.sunk = true; return; }   // 潛地、飛走：藏起來
    if (!o.isPc && o.sunk && (m.action === 4 || m.action === 45)) { o.sunk = false; return; }   // 冒出來、飛下來
    if (old) return;
    if (m.action === 2) { play(o, 'hurt'); if (o === G.me) csfx.meHurt(G.st.type || 0, G.curChar && G.curChar.sex, o.gfx, o.weapon); }   // 自己挨打（看不到打的人、中毒…）：受傷聲
    else if (SKILL_ACT.has(m.action)) { const w = playAt(o, 'skill'); if (o === G.me) csfx.act(o.gfx, m.action, w, actMsOf(o, 'skill')); }   // 自己的施法動作（少數外型有聲音）
    else if (m.action === 1 || m.action === 30) playAt(o, 'attack');
}
// 出手到打中的那一刻：近戰＝出手動作的 45%（刀揮到那一下）；遠距離再加飛過去的時間。查不到出手時間照原本的 120／220 毫秒
const IMPACT = 0.45;
const DEATH_WAIT = 150;   // 死亡動作比打死牠的攻擊封包先到時，等這麼久看攻擊封包來不來（onAction）
// 自己的寵物、召喚物：S_PetPack／S_SummonPack 帶的主人名字＝我的名字（protocol.js readCharPack）
// 打玩家、別人的寵物／召喚獸要強制（站長 2026-10-22「會直接攻擊到其他玩家」）：鎖定著他再按攻擊魔法、魔杖，沒開強制（強制鈕亮著或按住 Ctrl）＝不對他放，改成等玩家點目標
//   紫名玩家（剛打過藍名的人，S_PinkName）不用強制：直接點、攻擊魔法直接放，游標指上去就是劍（站長 2026-10-29「紫名不用點強制鍵 指向紫人指標就會顯示劍 可以直接攻擊」）
// 伺服器第 455 項：正在跟我的血盟打血盟戰爭的敵對血盟成員也一樣不用強制（clan.js isEnemy；離線掛機的不算，伺服器那邊打不到）
const freePvp = t => !!t && t !== G.me && t.isPc && ((t.pinkUntil || 0) > performance.now() || clan.isEnemy(t));
const pvpNoForce = t => !!t && t !== G.me && (t.isPc || (!!t.master && !isMyPet(t))) && !G.forceArm && !G.ctrl && !freePvp(t);
// 這隻怪是不是不死系（drops.json mobs 的 u：1、3＝不死，同掉寶視窗）：照名字找；掉寶資料還沒到＝null（順便開始抓）
function mobUndead(o) {
    if (!DROPS) { if (!dropsAsk) dropsAsk = allDrops(); return null; }
    const n = displayName(o.name || '');
    let seen = false;
    for (const m of Object.values(DROPS.mobs || {})) if (m.n === n) { if (m.u === 1 || m.u === 3) return true; seen = true; }
    return seen ? false : null;
}
// 站長 2026-11-10「改在奇村點玩家點不到別人的寵物或夥伴，玩家自己的可以點」：自己在奇岩城鎮、那隻寵物／夥伴站在安全區裡、不是自己的＝點不到
const giranPetSkip = o => !!(o && !o.isPc && !o.isItem && o.master && !isMyPet(o) && G.mapId === MAINLAND && world.ready && hereName() === '奇岩城鎮' &&
    ((world.flags(o.x - world.map.d.gameX0, o.y - world.map.d.gameY0) & 0x30) >> 4) === 1);
const isMyPet = o => !!(o && !o.isPc && o.master && o.master === ((G.me && G.me.name) || (G.curChar && G.curChar.name)));
// 自己有份的怪（hpMine）：我打牠、我的夥伴打牠、牠打我或我的夥伴、AUTO 正在打的——這些才顯示血條（hpMeter 那段）
const hpMine = new Set();
function hpMineAdd(id) {
    if (!id || hpMine.has(id)) return;
    if (hpMine.size > 400) hpMine.clear();
    hpMine.add(id);
    const o = G.objs.get(id); if (o && o.hpRaw !== undefined) o.hpR = o.hpRaw;
}
function hpMineNote(a) {
    if (!a) return;
    const mineId = id => id && (id === G.myId || (G.comps || []).some(c => c.id === id));
    if (mineId(a.atk) && a.tgt) hpMineAdd(a.tgt);
    if (mineId(a.tgt) && a.atk) hpMineAdd(a.atk);
}
function onAttack(a) {   // S_AttackPacket／S_AttackMissPacket／S_UseArrowSkill／S_UseAttackSkill
    hpMineNote(a);
    const o = a.atk && G.objs.get(a.atk), now = performance.now(), act = SKILL_ACT.has(a.act) ? 'skill' : 'attack';
    // 攻擊者還在走最後一步：走完才轉向、出手（start＝出手那一刻）；打中的時間照出手動作的長度算
    const wait = o ? playAt(o, act, a.heading) : 0, start = now + wait;
    const ms = o ? actMsOf(o, act) : 0;
    let hit = start + (ms ? ms * IMPACT : 120) + (a.gfx ? 100 : 0), fxT0 = start;   // fxT0＝效果圖（箭、魔法）出來的那一刻（音效照這個）
    if (a.gfx) {   // 遠距離：弓箭、魔法飛彈在出手那一刻從攻擊者飛到目標；範圍魔法播在目標那格
        //   6＝單體攻擊魔法（光箭、冰箭、火球…，圖檔畫在黑底上、用戶端加亮畫）→ glow；0＝弓箭、飛刀（一般畫）
        //   魔法（6）飛不飛照用戶端 list.spr 的 109.effect（look.js fxKind）：光箭、冰箭、火箭…飛過去，飛到了接著播水花／爆炸；
        //   烈炎術、地獄之牙、極道落雷、究極光裂術、寒冷戰慄、吸血鬼之吻＝播在目標身上（原本一律從施法者飛過去：烈炎術射程 3 格只飛 0.15 秒，
        //   19 幀的爆炸只閃過兩三幀還在半路上，站長 2026-10-24「烈焰術 火牢 魔法特效怪怪的」）；極光雷電＝施法者朝目標的一道閃電；會心一擊＝施法者身上；
        //   地裂術＝從施法者一格一格裂到目標、最後在目標噴出來。沒有 fxseq 照原本（0、6 都飛）
        const k = a.use === 6 ? fxKind(a.gfx) : null, kind = k ? k.kind : (a.use === 0 || a.use === 6) ? 'proj' : 'at';
        const proj = kind === 'proj', t0 = start + (ms ? ms * IMPACT * 0.7 : 0), dir = dirTo(a.x, a.y, a.tx, a.ty);
        const f = proj ? { kind: 'proj', gfx: a.gfx, x: a.x, y: a.y, tx: a.tx, ty: a.ty, glow: a.use === 6, follow: k && k.follow, tid: a.tgt }
            : kind === 'self' ? { kind: 'gfx', gfx: a.gfx, id: a.atk, x: a.x, y: a.y, dir }
            : { kind: 'gfx', gfx: a.gfx, id: k ? a.tgt : 0, x: a.tx, y: a.ty, dir };
        f.t0 = t0;
        // 飛彈：飛到目標的那一刻才算打中（傷害數字、受傷、倒下都對齊；飛行時間同 world.js drawFx：每格約 35 毫秒、最少 150）——原本照出手時間另算，數字比飛彈晚 0.2 秒
        if (proj) { f.dur = Math.max(150, Math.hypot(a.tx - a.x, a.ty - a.y) * 35); hit = f.t0 + f.dur; }
        fxT0 = f.t0;
        if (kind === 'trail') hit = trailFx(a.gfx, k.follow, a.x, a.y, a.tx, a.ty, a.tgt, t0);
        else addFx(f);
    }
    // 打中了：目標播受傷、跳傷害數字（伺服器送的真正傷害；0＝未命中），都在打到的那一刻
    //   （伺服器只對「看不到攻擊者」的人另外送受傷動作，看得到的由用戶端看攻擊封包自己播）
    const t = a.tgt && a.tgt !== a.atk && G.objs.get(a.tgt);
    if (t) {
        impactAt.set(t.id, Math.max(impactAt.get(t.id) || 0, hit));
        // 數字（站長 2026-10-18「我打怪的傷害跟怪打我的傷害分開」）：打在我身上的＝紅字、從身上往上飄（world.js drawNumbers 'me'），其他照單機版白字在頭上；
        //   怪打我沒打中不跳（單機版玩家身上沒有數字）；好幾個同時跳、擠在同一點的，畫的時候排開（world.js drawNumbers）
        //   只跳跟自己有關的（站長 2026-10-20「不能看到對方的傷害顯示與受到傷害顯示」）：自己打的、打在自己身上的、自己的寵物／召喚物打的和挨的；
        //   別人打怪、別人挨打、別人的寵物都不跳（受傷動作照播）
        const onMe = a.tgt === G.myId;
        // 自己的寵物、召喚物（含迷魅）打的：另一個顏色（站長 2026-10-22「寵物的攻擊顯示顏色使用別的顏色，要區分與主人不同的顏色」，world.js drawNumbers 'pet'）；
        //   認法：頭上主人名字是我（isMyPet），或在伺服器給的夥伴清單裡（S_Web 8，G.comps）
        const byPet = !onMe && a.atk !== G.myId && (isMyPet(o) || (G.comps || []).some(c => c.id === a.atk));
        const mine = onMe || a.atk === G.myId || byPet || isMyPet(t);
        if (mine && !(onMe && !a.dmg) && (!byPet && !dmgHidden(onMe))) addFx({ kind: 'dmg', id: a.tgt, dmg: a.dmg, t0: hit, who: onMe ? 'me' : byPet ? 'pet' : 'other', slot: byPet ? petSlot(a.atk) : 0 });
        if (a.dmg > 0) setTimeout(() => play(t, 'hurt'), hit - now);
        // 挨到大的一擊（單下 ≥ 最大體力 10%）：體力條紅光閃＋畫面震一下（同單機版 vfxPlayerHit：小傷不閃不震，免得每下都晃）
        if (onMe && a.dmg > 0 && G.st.maxHp > 0 && a.dmg >= G.st.maxHp * 0.1) setTimeout(() => { hud.hurtFlash(); shakeView(); }, hit - now);
    }
    // 音效（只管跟自己有關的：自己打怪、怪打自己；別人打架不出聲）：照 3.5C 用戶端，出手、受傷動作播到哪一幀就在那時放（combatsfx.js）；
    //   出手的聲音沒打中也放（用戶端的出手動作本來就帶聲音），受傷聲只有打中才放（打中才播受傷動作）。撿東西（動作 15）只放撿的聲音
    if (a.atk === G.myId && o && act === 'skill') {   // 自己的攻擊魔法（打怪、打人都算）
        csfx.act(o.gfx, a.act, wait, ms);   // 施法動作本身（少數外型有）
        if (a.gfx && !csfx.effect(a.gfx, fxT0 - now) && t && !t.isPc) setTimeout(() => spellEcho(a.gfx), wait);   // 效果圖（光箭、冰箭…）播出來那一刻；3.5C 沒有的照原本
        { const k = a.gfx && fxKind(a.gfx); if (k && k.follow) csfx.effect(k.follow, hit - now); }   // 飛到／裂到之後接著播的（爆炸 218…）自己的聲音
    }
    if (a.act === 15) { if (a.atk === G.myId && o) csfx.act(o.gfx, 15, wait); }
    // 打玩家、被玩家打也要有聲音（站長 2026-10-29「手動攻擊沒有攻擊音效」：原本只放打怪、被怪打的，打紫名／敵對血盟沒聲音）
    else if (a.atk === G.myId && t) {
        if (!t.isPc) hitBy.set(t.id, now);
        if (act !== 'skill') {
            csfx.swing(myWeaponType(), o.gfx, a.act === 1 ? (o.weapon ? o.weapon + 1 : 1) : a.act, wait, ms);
            if (a.gfx) csfx.effect(a.gfx, fxT0 - now);   // 箭
        }
        if (a.dmg > 0) {
            if (t.isPc) { if (!csfx.act(t.gfx, t.weapon ? t.weapon + 2 : 2, hit - now)) csfx.act(t.gfx, 2, hit - now); }   // 打中的玩家：只放他那個外型在 3.5C 的受傷聲（不知道他的職業、性別，不退回職業叫聲）
            else csfx.mobHurt(displayName((t.name || '').trim()), t.gfx, hit - now);
        }
    } else if (a.atk === G.myId && !t && o && act !== 'skill') {   // 強制攻擊點地面空揮（沒有目標）：照樣有揮刀聲（站長 2026-10-29「空揮刀沒有揮刀聲音」）
        csfx.swing(myWeaponType(), o.gfx, a.act === 1 ? (o.weapon ? o.weapon + 1 : 1) : a.act, wait, ms);
        if (a.gfx) csfx.effect(a.gfx, fxT0 - now);   // 弓空射的箭
    } else if (a.tgt === G.myId && o && o.isPc && act !== 'skill') {   // 別的玩家打我：他的揮擊聲（照他的外型、手上武器）＋我的受傷聲
        csfx.swing(0, o.gfx, a.act === 1 ? (o.weapon ? o.weapon + 1 : 1) : a.act, wait, ms);
        if (a.gfx) csfx.effect(a.gfx, fxT0 - now);
        if (a.dmg > 0) csfx.meHurt(G.st.type || 0, G.curChar && G.curChar.sex, G.me && G.me.gfx, G.me && G.me.weapon, hit - now);
    } else if (a.tgt === G.myId && o && !o.isPc) {
        csfx.mobAttack(displayName((o.name || '').trim()), o.gfx, a.act, wait, ms);
        if (a.gfx) csfx.effect(a.gfx, fxT0 - now);   // 怪射過來的箭、魔法
        if (a.dmg > 0) csfx.meHurt(G.st.type || 0, G.curChar && G.curChar.sex, G.me && G.me.gfx, G.me && G.me.weapon, hit - now);
    } else if (o && !o.isPc && t && !t.isPc && (isMyPet(o) || (G.comps || []).some(c => c.id === a.atk))) {
        // 自己的寵物、召喚獸打怪（站長 2026-10-29「寵物沒聲音」）：牠自己的攻擊聲（照牠的外型，同怪物那套）＋打中的怪的受傷聲
        csfx.mobAttack(displayName((o.name || '').trim()), o.gfx, a.act, wait, ms);
        if (a.gfx) csfx.effect(a.gfx, fxT0 - now);
        if (a.dmg > 0) csfx.mobHurt(displayName((t.name || '').trim()), t.gfx, hit - now);
    } else if (o && a.atk !== G.myId && a.tgt !== G.myId && act !== 'skill' && G.me) {
        // 旁人打架（別的玩家打怪／打人、怪打別人）：攻擊者的出手聲，小聲、限量、近的優先（crowdSfx）
        const d = Math.max(Math.abs(o.x - G.me.x), Math.abs(o.y - G.me.y)), at = performance.now();
        crowdSfx(d, k => { const w = Math.max(0, wait - (performance.now() - at));
            if (o.isPc) csfx.swing(0, o.gfx, a.act === 1 ? (o.weapon ? o.weapon + 1 : 1) : a.act, w, ms, k, 'crowd');
            else csfx.mobAttack(displayName((o.name || '').trim()), o.gfx, a.act, w, ms, k, 'crowd'); });
    }
}
// 旁人打架的聲音（站長 2026-11-01「旁人打架的聲音小聲一點，每秒最多幾聲，近的優先」；100 人同畫面 PK 測試時一片安靜）：
//   畫面內（CROWD_RANGE 格）的才算；每 CROWD_MS 收一批，只放最近的那一聲（≈每秒 5 聲）；音量照距離 0.5 → 0.15 倍（自己打的是 1 倍）
const CROWD_RANGE = 13, CROWD_MS = 200;
let crowdQ = [], crowdT = 0;
function crowdSfx(d, play) {
    if (d > CROWD_RANGE) return;
    crowdQ.push([d, play]);
    if (crowdT) return;
    crowdT = setTimeout(() => {
        crowdT = 0;
        const q = crowdQ; crowdQ = [];
        let best = q[0]; for (const x of q) if (x[0] < best[0]) best = x;
        best[1](Math.max(0.15, 0.5 * (1 - best[0] / (CROWD_RANGE + 1))));
    }, CROWD_MS);
}
// 從 (x,y) 朝 (tx,ty) 的方向（0 北…7 西北，同伺服器 heading：DX／DY）；同一格回 0
function dirTo(x, y, tx, ty) {
    const dx = Math.sign(tx - x), dy = Math.sign(ty - y);
    for (let h = 0; h < 8; h++) if (DX[h] === dx && DY[h] === dy) return h;
    return 0;
}
// 地裂術（list.spr 109.effect 種類 7）：從施法者前一格到目標，一格一格冒出石頭（每格晚 80 毫秒），最後在目標那格接著播 follow（123 地面噴發）；回傳噴發那一刻（打中）
function trailFx(gfx, follow, x, y, tx, ty, tid, t0) {
    const dir = dirTo(x, y, tx, ty), n = Math.max(1, Math.max(Math.abs(tx - x), Math.abs(ty - y)));
    for (let i = 1; i <= n; i++) addFx({ kind: 'gfx', gfx, x: x + Math.round((tx - x) * i / n), y: y + Math.round((ty - y) * i / n), dir, t0: t0 + (i - 1) * 80 });
    const at = t0 + n * 80;
    if (follow) addFx({ kind: 'gfx', gfx: follow, id: tid, x: tx, y: ty, dir, t0: at });
    return at + 120;
}
// S_RangeSkill：施法動作＋效果圖。種類 0（沒有目標的：龍捲風、震裂術、冰雪暴、火風暴…）＝播在施法者那格；
//   8（有目標的：寒冰氣息、岩牢、雷霆風暴、流星雨…）＝播在主目標（清單第一個）那格；效果圖是八個方向的飛行物（燃燒的火球 171）＝從施法者飛到主目標（同單體攻擊魔法）
function onRangeSkill(a) {
    if (a && (a.atk === G.myId || (G.comps || []).some(c => c.id === a.atk)) && a.targets) for (const id of a.targets) hpMineAdd(id);   // 範圍魔法打到的每一隻都算自己有份（血條）
    const o = G.objs.get(a.atk);
    const wait = o ? playAt(o, 'skill', a.heading) : 0, t0 = performance.now() + wait;
    const tg = a.type === 8 && a.targets.length ? G.objs.get(a.targets[0]) : null, k = fxKind(a.gfx);
    //   飛不飛照 list.spr 109.effect（燃燒的火球 171 飛過去、到了接著播爆炸 218；寒冰氣息、岩牢、雷霆風暴、流星雨播在目標那格）；沒有 fxseq 照原本看方向數
    const proj = k ? k.kind === 'proj' : effectDirs(a.gfx) === 8;
    if (a.gfx && tg && proj) addFx({ kind: 'proj', gfx: a.gfx, x: a.x, y: a.y, tx: tg.x, ty: tg.y, glow: true, t0, follow: k && k.follow, tid: tg.id });
    else if (a.gfx) addFx({ kind: 'gfx', gfx: a.gfx, x: tg ? tg.x : a.x, y: tg ? tg.y : a.y, t0, dir: tg ? dirTo(a.x, a.y, tg.x, tg.y) : a.heading & 7 });
    { const at = performance.now() + wait + 300; for (const id of a.targets) impactAt.set(id, Math.max(impactAt.get(id) || 0, at)); }   // 範圍魔法：效果圖出來後才倒下
    if (a.atk === G.myId) {
        const now = performance.now(); for (const id of a.targets) hitBy.set(id, now);
        if (o) csfx.act(o.gfx, a.act || 19, wait, actMsOf(o, 'skill'));   // 施法動作本身（少數外型有）
        if (a.gfx && !csfx.effect(a.gfx, t0 - now)) setTimeout(() => spellEcho(a.gfx), wait);   // 效果圖播出來那一刻（3.5C 沒有的照原本）
    }
}
// ── 伺服器帶著走的（AUTO 的自己、別人、怪）：每一步放進佇列，畫面一步接一步走（同單機版 afk-townmap 一格接一格、多出來的時間帶到下一步）——
//   步長照「實際收到的間隔」（平滑過的；加速、勇敢、伺服器每拍的等待都跟著）；落後了（佇列裡還有）就走快一點追上，落後太多直接跳過去。
//   下一步晚到幾十毫秒：look.js 先停在走路最後一幀（WALK_HOLD_MS），不閃回待機
function baseStepMs(o) {
    // 伺服器的走路間隔＝spr_action 走路動作（×960÷framerate，比 data/sprwalk 的 ×1000 短 4%）；自己（AUTO）見 myStepMs
    return o.gap || (o === G.me ? myStepMs() : otherStepMs(o));
}
// 自己（AUTO）走一步：同手動（myWalkMs）× 伺服器 WebAutoSession 的 SLACK（第 103 項起 1.02，照上一步排定的時間往後排、不再等到下一拍）。
//   原本沒算加速：停下來再走的第一步照沒加速播（716 毫秒，伺服器加速＋勇水 400），之後一路慢 0.3 秒、靠排隊加快追 → 看起來忽快忽慢（伺服器第 74 項實測）
// 別人走一步：外型 × 一段＋二段＋三段（objSpeed）。量到的實際間隔（o.gap）優先；速度變了（喝水、變身、換武器）就不用舊的量測
const otherStepMs = o => walkMs(o) * 0.96 * objSpeed(o, 'move');
const objSpeedKey = o => o.gfx + ':' + (o.weapon || 0) + ':' + objSpeed(o, 'move').toFixed(3);
function myStepMs() {
    return myWalkMs() * ACT_SLACK;
}
// 自己的速度有沒有變（外型、武器、看得到的加速勇水）：沒變的話停下來再走照上次量到的間隔，不重新猜
const mySpeedKey = () => G.me ? G.me.gfx + ':' + (G.me.weapon || 0) + ':' + mySpeed('move').toFixed(3) : '';
function startStep(o, carry) {
    const s = o.q.shift();
    o.fx = s.x; o.fy = s.y;   // 從伺服器說的起點走（平常就是上一步的終點；漏了封包時等於跳過去）
    o.sx = s.x; o.sy = s.y; o.tx = s.x + DX[s.h]; o.ty = s.y + DY[s.h]; o.x = o.tx; o.y = o.ty; o.heading = s.h;
    o.stepMs = baseStepMs(o) * (o.q.length ? 0.9 : 1);   // 後面還排著：快 10% 追上
    o.walking = true; o.walkEnd = null; o.t = Math.min(0.5, (carry || 0) / o.stepMs);
    if (o.act && o.act !== 'death') o.act = null;   // 開始走就不再播出手（伺服器說牠動了）
}
function onMove(m) {
    const o = G.objs.get(m.id);
    if (!o) return;
    if (o === G.me && !G.autoOn) return;   // 自己：只有 AUTO（伺服器替你走）才照伺服器的位置走；手動走路是網頁自己一步一步走
    const now = performance.now(), mine = o === G.me, base = mine ? myStepMs() : otherStepMs(o), dt = now - (o.lastMvAt || -1e9);
    if (!mine && o.gap && o.gapKey !== objSpeedKey(o)) o.gap = 0;   // 別人速度變了：舊的量測不用
    // 連續走才量（自己：照算好的一步 0.6～1.6 倍才算，追遠處的怪時伺服器停一下的那種不算進去）
    if (o.lastMvAt && dt < base * 1.6 && dt > base * (mine ? 0.6 : 0.5)) { o.gap = o.gap ? o.gap * 0.7 + dt * 0.3 : dt; o.gapKey = mine ? mySpeedKey() : objSpeedKey(o); }
    else if (!o.walking && !(mine && o.gap && o.gapKey === mySpeedKey())) o.gap = 0;   // 停過再走：照外型的走路動作（自己速度沒變照上次量到的）
    o.lastMvAt = now;
    o.pend = null;   // 等著要播的出手：伺服器已經在走下一步了，不播
    o.q = o.q || [];
    o.q.push({ x: m.x, y: m.y, h: m.heading });
    if (o.q.length > 3) { const last = o.q[o.q.length - 1]; o.q.length = 0; o.q.push(last); o.walking = false; o.t = 1; }   // 落後太多：直接跳到最新那一步
    if (!o.walking) startStep(o, 0);
}
// 每幀推進伺服器帶著走的物件：這一步走完 → 佇列裡有下一步就接著走（多出來的時間帶過去）；沒有就停（look.js 停在最後一幀一下）→ 有等著的出手就轉向出手
function advance(o, dt) {
    if (o.walking) {
        o.t += dt / (o.stepMs || STEP_MS);
        if (o.t >= 1) {
            const carry = (o.t - 1) * o.stepMs;
            o.t = 1;
            if (o.q && o.q.length) startStep(o, carry);
            else { o.walking = false; o.walkEnd = performance.now(); }
        }
        o.fx = o.sx + (o.tx - o.sx) * o.t; o.fy = o.sy + (o.ty - o.sy) * o.t;
    }
    if (!o.walking && o.pend) { const p = o.pend; o.pend = null; if (p.heading != null) o.heading = p.heading; play(o, p.act); }
}
// 自己死了：倒在地上，蓋「重新開始」（C_Restart：回村、復活；伺服器重送自己的角色時拿掉）
function meDead(on) {
    G.dead = !!on;
    if (G.dead) ccClear('死亡');   // 伺服器死亡時整個解除（相消術），但麻痺毒、詛咒麻痺的解除封包死了就不送
    if (G.dead) atkStop();   // 被打死：手動攻擊停（活過來不會自己接著打）
    $('deadbox').classList.toggle('hidden', !G.dead);
    if (!G.dead) resYesNoClose();   // 活過來了（別人救的、自己重新開始）：還開著的「要復活嗎」收掉
}
// 有人要讓你復活（S_Message_YN 321＝復活卷軸、322＝祝福的復活卷軸／返生術／終極返生術）：跳「是／否」，C_Attr 回 1／0（格式同血盟 97，伺服器 C_Attr）。
//   原本沒處理 → 被救的人看不到、救不起來（2026-10-18 法師魔法測試回報）。死掉的畫面（#deadbox）上面也點得到；
//   開別的視窗被 hud.closeAll 收掉就放回來（伺服器一直等著回答）
const RES_YN = new Set([321, 322]);
let resYn = null, resYnTimer = 0;
function resYesNoClose() { clearInterval(resYnTimer); if (resYn) resYn.remove(); resYn = null; }
// 恢復神女（伺服器第 249 項）按「恢復經驗值」：伺服器問要花 %0 金幣要不要恢復（S_Message_YN 738）；第 305 項藍鑽恢復＝7381（伺服器 WebExpRestore）
function expYesNo(y) {
    resYesNoClose();
    const cost = (+((y.args || [])[0]) || 0).toLocaleString() + (y.type === 7381 ? ' 藍鑽' : ' 金幣');
    const ov = document.createElement('div'); ov.id = 'lmui-resyn'; ov.className = 'lmui-ov cl-ov';
    ov.innerHTML = '<div class="box"><div class="hd"><span>恢復經驗值</span></div><div class="bd"><div class="cl-ask">要花 ' + cost + ' 恢復經驗值嗎？</div></div>' +
        '<div class="ft"><button type="button" data-yn="0">取消</button><button type="button" data-yn="1">恢復</button></div></div>';
    ov.addEventListener('click', e => {
        const b = e.target.closest('[data-yn]'); if (!b) return;
        resYesNoClose();
        if (conn && G.inWorld) { G.actAt = performance.now(); conn.answer(y.seq, y.type, b.getAttribute('data-yn') === '1'); }
    });
    document.body.appendChild(ov); resYn = ov;
}
function resYesNo(y) {
    resYesNoClose();
    const ov = document.createElement('div'); ov.id = 'lmui-resyn'; ov.className = 'lmui-ov cl-ov';
    ov.innerHTML = '<div class="box"><div class="hd"><span>復活</span></div><div class="bd"><div class="cl-ask">有人要讓你復活</div></div>' +
        '<div class="ft"><button type="button" data-yn="0">不要</button><button type="button" data-yn="1">復活</button></div></div>';
    ov.addEventListener('click', e => {
        const b = e.target.closest('[data-yn]'); if (!b) return;
        resYesNoClose();
        if (conn && G.inWorld) { G.actAt = performance.now(); conn.answer(y.seq, y.type, b.getAttribute('data-yn') === '1'); }
    });
    document.body.appendChild(ov); resYn = ov;
    resYnTimer = setInterval(() => { if (resYn && !resYn.isConnected) document.body.appendChild(resYn); }, 300);
}
$('btn-restart').addEventListener('click', () => { if (conn && G.inWorld && G.dead) { G.actAt = performance.now(); conn.restart(); } });

// ── 聊天 ──────────────────────────────────────────
// 伺服器訊息（S_ServerMessage）只給編號＋參數；文字用伺服器原始碼 L1SystemMessageId.java 註解裡的中文（data/sysmsg.json）：
//   \f1 這類是顏色碼（拿掉）、%0 %1… 換成參數、%s %d %o %u 是用戶端的語助詞（拿掉）
//   聊天送不出去的那幾則、玩家剛按了道具／魔法 2 秒內收到的（裝備失敗、等級不夠…）除了寫進系統分頁也跳提示
const CHAT_MSG = new Set([195, 462, 510, 242]);
// 打怪拿到東西：「哥布林 給你 金幣 (5)」（143）、組隊分到的「隊員 X 從 哥布林 取得 …」（813）→ 聊天框「掉落」分頁，不放「系統」（站長 2026-10-17）
const DROP_MSG = new Set([143, 813]);
// 不顯示：「你覺得舒服多了。」（77，每喝一瓶治癒藥水、補一次血就一行，把系統分頁洗掉；站長 2026-10-18「這兩個訊息移除不顯示」）
const HIDE_MSG = new Set([77]);
// 戰鬥中常見、剛按了魔法／攻擊就回的：不跳畫面中間的提示（連按魔法時一直蓋在戰鬥畫面正中間），只浮在快捷列上方（站長 2026-10-24「距離太遠、點選目標…會擋住畫面」）。
//   79 沒有任何事情發生、179 請選擇對象、278 因魔力不足而無法使用魔法、280 施咒失敗、290 凝視攻擊失敗、328 請選擇正確的對象；
//   伺服器自己寫的一行「目標太遠，魔法放不到。」（S_SystemMessage，L1SkillUse）見 onChat 的 FLOAT_TEXT
const FLOAT_MSG = new Set([79, 179, 278, 280, 290, 328]);
const FLOAT_TEXT = new Set(['目標太遠，魔法放不到。']);
function onServerMsg(m) {
    if (HIDE_MSG.has(m.id)) return;
    if (!sysmsgLoaded) { SYSMSG_READY.then(() => onServerMsg(m)); return; }
    const args = m.args.map(displayName), raw = SYSMSG[m.id];
    const t = raw ? raw.replace(/\\f./g, '').replace(/%(\d)/g, (x, i) => args[+i] ?? '').replace(/%[sdou]/g, '').trim() : '系統訊息 #' + m.id + (args.length ? '：' + args.join('、') : '');
    const fltOnly = FLOAT_MSG.has(m.id);
    if (DROP_MSG.has(m.id)) hud.chat(t, 'drop', 'c-drop', stale()); else hud.chat(t, 'sys', 'c-sys', stale() || fltOnly);
    if (fltOnly && !stale()) hud.float(t, true);   // 戰鬥中常見的：只浮在快捷列上方（浮不了才退回中間的提示），下面不再跳中間的提示   // NPC 給的（製作、任務）也是 143，一樣放掉落；接回時補送的舊訊息只進聊天框，不一則則浮上來
    const ptMsg = party.onServerMsg(m.id, m.args);   // 解散、被踢、某某離開：拿掉隊員。邀請的回覆、有人離開是晚一點才來的 → 也跳提示、也記進隊伍分頁
    if (ptMsg) hud.chat(t, 'party', 'c-sys', true);
    if (!fltOnly && (CHAT_MSG.has(m.id) || ptMsg || performance.now() - G.actAt < 2000)) hud.toast(t);
    hud.enhMsg(m.id, t);   // 強化視窗等結果
    if (m.id === 1625) hud.npc.whEmpty();   // 倉庫是空的（伺服器不送清單、只送這則）
    if (m.id === 208 || m.id === 209 || m.id === 728 || m.id === 834) hud.npc.whMsg(t, m.id);   // 血盟倉庫打不開（沒血盟、別人在用、沒封號、有倉庫密碼）：寫在倉庫視窗裡（第 111 項）
    if (m.id === 110 && G.atk) { atkStop(); stopPath(); hud.toast(t); }   // 太重了不能戰鬥（C_Attack 每一刀都回這則）：停手，不一直送
    if (m.id === 678) { G.elfAttr = 0; hud.npc.elfDone('init'); }    // 去除精靈力成功（感覺到在身上有的精靈力量被空氣中融化。）
    hud.npc.makeMsg(t);   // 剛按了「製作」：給了什麼、缺什麼也列在製作視窗
    clan.onServerMsg(m.id);   // 創立、加入、離開、驅逐、解散：馬上要一次新的血盟資訊（不等伺服器 2 秒一次的比對）
}
// 喊叫的方向（聊天框行首的方向圓牌，同原版用戶端）：喊的人在畫面上的哪一邊，0～7＝→ ↗ ↑ ↖ ← ↙ ↓ ↘（data/ui/shout-<n>.png 的順序）。
//   座標先用封包帶的（S_ChatPacket／S_NpcChatPacket 大喊在字後面接 x、y；喊的人常在畫面外），沒有再用看得到的那個物件；同一格（自己喊的）不標
function shoutDir(c) {
    const me = G.me, o = c.id && G.objs.get(c.id);
    const x = c.x || (o && o.x), y = c.y || (o && o.y);
    if (!me || !x || !y) return -1;
    const dx = x - me.x, dy = y - me.y; if (!dx && !dy) return -1;
    const sx = 24 * (dx + dy), sy = 12 * (dy - dx);   // 畫面向量（往下為正）
    return ((Math.round(Math.atan2(-sy, sx) / (Math.PI / 4)) % 8) + 8) % 8;
}
// 怪物說話不要太吵：同一隻、同一句 30 秒內只記一次、只冒一次（npcchat 表的重複喊話 10～20 秒一次、派報少年也是一直說）
const npcSaid = new Map();
function npcRepeat(c, text) {
    const now = performance.now(), k = c.id + '|' + text, t = npcSaid.get(k);
    if (t && now - t < 30000) return true;
    npcSaid.set(k, now);
    if (npcSaid.size > 300) for (const [kk, tt] of npcSaid) if (now - tt >= 30000) npcSaid.delete(kk);
    return false;
}
function onChat(c) {
    let text = displayName(c.text);
    // 世界頻道扣錢（伺服器第 537／545 項）：站長 2026-11-01「不用顯示剩多少」「也沒顯示浮窗」→ 舊伺服器帶的「（剩 …）」拿掉；一定浮上來（浮不了就跳中間提示，同戰鬥提示 FLOAT_TEXT）
    const feeMsg = c.type === 9 && /^世界頻道(發言扣|每句要)/.test(text);
    if (feeMsg) text = text.replace(/（剩 [\d,]+）/, '');
    // NPC 說的話：一般＝NPC 的顏色、喊叫＝醒目的顏色；字已經帶名字（「西瑪: …」「<西瑪> …」）。查不到字的（npcsay.json 還沒產）只剩名字＝不記
    if (c.npc) {
        if (!text.replace(/^<[^>]*>|^[^:]*:|^\[[^\]]*\]/, '').trim() || npcRepeat(c, text)) return;
        const o = c.id && G.objs.get(c.id);
        hud.chat(text, 'say', c.type === 2 ? 'c-npcshout' : 'c-npc', stale(), c.type === 2 ? shoutDir(c) : -1);
        // 頭上冒字：看得到、還活著的才冒（死亡時的喊話怪已經倒下，只進聊天框）
        if (o && o.act !== 'death' && (c.type === 0 || c.type === 2)) {
            const i = text.indexOf(': '), body = c.type === 0 && i >= 0 ? text.slice(i + 2) : text.replace(/^<[^>]*>\s*/, '');
            o.bubble = { text: body, until: performance.now() + 4000 + body.length * 120, shout: c.type === 2 };
        }
        return;
    }
    // 自己送出的密語（伺服器 C_ChatWhisper 回 type 9「-> (對方) 內容」）：原本當系統訊息（只在「系統」分頁、還跳提示）→ 跟收到的密語一樣進「全部」「一般」、
    //   粉紅色，點名字＝再密他（站長 2026-11-09「密語好用一點」）
    if (c.type === 9 && text.startsWith('-> (')) { hud.chat(text, 'whisper', 'c-whisper', stale(), -1, chatWho(text)); return; }
    const cat = CHAT_CAT[c.type] || ['say', 'c-say'];
    // 新手任務完成（伺服器給了那一步）：接著就播特效、寫了獲得什麼 → 只進「系統」分頁，不浮上來、不跳提示框（tutorial.js quietMsg；手機上原本跟特效疊在一起）
    //   同一隻自動登回來那幾秒，伺服器的「回到遊戲：AUTO 接著開…」只進聊天框（玩家沒有離開，不必跳出來說）
    const noCard = c.type === 9 && text.startsWith(NO_CARD_PREFIX);   // 掛機中沒月卡沒賣成（伺服器 WebCare.SELL_NO_CARD）：只進聊天框，畫面上換成提示條（sellcard.js）
    const quiet = (c.type === 9 && (tutorial.quietMsg(text) || shutdownUi.quietSys(text))) || stale() || noCard || (c.type === 9 && performance.now() - softAt < 15000 && text.startsWith('回到遊戲：'));
    const fltOnly = c.type === 9 && (FLOAT_TEXT.has(text) || feeMsg);   // 戰鬥中常見的系統訊息：只浮在快捷列上方，不跳中間的提示（FLOAT_MSG）
    hud.chat(text, cat[0], cat[1], quiet || fltOnly, c.type === 2 ? shoutDir(c) : -1, c.type !== 9 ? chatWho(text) : null);
    if (c.type === 9 && hud.enhSys) hud.enhSys(text);   // 祝福賦予的結果（伺服器自己寫的一行字）：強化視窗的祝福賦予模式等這個（站長 2026-11-07）
    if (fltOnly && !quiet) hud.float(text, true);
    // 「此地圖無法瞬移…」（伺服器 AUTO 走到要瞬移時、每張地圖說一次，本機改動第 98 項）：沒按東西也跳提示
    if (c.type === 9 && !quiet && !fltOnly && (performance.now() - G.actAt < 2000 || text.startsWith('此地圖無法瞬移'))) hud.toast(text);   // 剛按了什麼、伺服器回一行系統訊息（例如傳送失敗的原因）：聊天框收著也看得到
    // 只有背包快滿（剩 1 格以下或超過上限）才跳月卡提示條：新手平常不推月卡（站長 2026-10-23「一開始新手先不提醒包月，等背包滿了或設定自動賣出時再顯示」）
    if (noCard && !stale() && bagMax() > 0 && G.inv.size >= bagMax() - 1) noCardTip(() => { if (lv20('商城')) shopOpen(); });   // 上方提示條，每次上線一次
    if (c.type === 9 && !stale()) { const m = PAY_DONE_RE.exec(text); if (m) payDone.paid(+m[1]); }   // 儲值入帳：跳慶祝畫面（paydone.js）
    if (c.type === 9) hud.npc.sysMsg(text);   // 寵物保管員剛按了領出／寄放：「哈士奇 領出來了」、夥伴已滿也寫在視窗上（npc.js）
    const o = c.id && G.objs.get(c.id);
    if (o && (c.type === 0 || c.type === 2)) {
        const i = text.indexOf(': '), body = c.type === 0 && i >= 0 ? text.slice(i + 2) : text.replace(/^<[^>]*>\s*/, '');
        o.bubble = { text: body, until: performance.now() + 4000 + body.length * 120, shout: c.type === 2 };
    }
}

// ── 輸入：方向鍵／WASD／數字鍵；畫面上點一下＝走過去（點到人＝鎖定），按住＝手機出虛擬方向鍵、滑鼠往游標方向一直走 ─────────────
const keys = new Set();
const KEYMAP = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
    Numpad8: 'u', Numpad2: 'd', Numpad4: 'l', Numpad6: 'r', Numpad7: 'ul', Numpad9: 'ur', Numpad1: 'dl', Numpad3: 'dr' };
const WASD = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);   // 只有直式（沒有打字直接進聊天框）才拿來走路
let tap = null;
document.addEventListener('keydown', e => {
    if (!G.inWorld || G.reconnecting || hud.isTyping() || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Enter') { e.preventDefault(); hud.focusChat(); return; }
    if (e.key === 'Escape') { hud.closeAll(); G.lock = null; atkStop(); return; }
    if (e.key === 'Control') { setCtrl(true); return; }   // 按住 Ctrl＝強制攻擊（游標換成劍）
    // Tab＝開關背包（同點下面的「背包」；站長 2026-10-22「電腦版按 tab 也可以打開背包視窗」）。瀏覽器原本的 Tab 換焦點在遊戲裡不要
    if (e.key === 'Tab') { e.preventDefault(); if (!e.repeat) { const b = document.querySelector('.lmui-tool[data-tool="items"]'); if (b) b.click(); } return; }
    // Home＝開關設定視窗（同點下面的「設定」；站長 2026-10-22「電腦版按 HOME 顯示設定頁面」）
    if (e.key === 'Home') { e.preventDefault(); if (!e.repeat) { const b = document.querySelector('.lmui-tool[data-tool="automation"]'); if (b) b.click(); } return; }
    // F1～F12＝快捷列那一格（同點格子；桌機用）。瀏覽器原本的 F1 說明、F5 重新整理在遊戲裡不要
    const fk = /^F(\d{1,2})$/.exec(e.key);
    //   空格（沒放東西）按了什麼都不做（站長 2026-10-23；原本會打開「F? 要放什麼？」），瀏覽器的 F 鍵照樣擋
    //   按住不放：照施法節奏一直放（hotHoldCheck）；瀏覽器自己連發的 keydown 不算
    if (fk && +fk[1] >= 1 && +fk[1] <= 12) { e.preventDefault(); if (!e.repeat) { const fi = +fk[1] - 1; G.castShot = null; hotHold = { code: e.code, i: fi, item: hud.slotKind(fi) === 'item', at: performance.now() }; hud.useSlot(fi); } return; }
    const pc = document.body.classList.contains('pcui');
    const k = pc && WASD.has(e.code) ? null : KEYMAP[e.code];   // 電腦版 W、A、S、D 不走路（站長 2026-10-23 取消這幾個單鍵）：打字直接進聊天框
    // 電腦版：打字直接進聊天框，不用先點（站長 2026-10-22「電腦版如果有輸入字可以直接輸入，不用再點擊輸入框」）。
    //   走路（方向鍵、數字鍵盤）、字母快捷鍵（E）照舊；注音等輸入法打字（key＝Process）一律進聊天框。
    //   在 keydown 就把焦點移過去，這顆字會落在聊天框裡
    if (pc && !e.ctrlKey && !e.altKey && !e.metaKey &&
        (e.key === 'Process' || e.isComposing || (!k && e.key.length === 1 && !PC_LETTER_KEYS.has(e.code)))) { typeToChat(e.key); return; }
    if (!k) return;
    e.preventDefault(); keys.add(e.code); stopPath(); userMoved();
    tap = keyDir();   // 點一下就放開（同一幀內）也要走一步
});
document.addEventListener('keyup', e => { keys.delete(e.code); if (e.key === 'Control') setCtrl(false); if (hotHold && hotHold.code === e.code) hotHold = null; });
// 焦點移到聊天框，這顆字由瀏覽器自己打進去。開著注音的玩家：場景上沒有輸入框時輸入法不作用，第一顆會先變成英文字母落進框裡，
//   接著才開始拼注音 → 2 秒內開始拼字、框裡只有那一個字母＝拿掉
function typeToChat(ch) {
    hud.focusChat();
    const inp = document.activeElement; if (!inp || inp.tagName !== 'INPUT') return;
    const at = performance.now();
    inp.addEventListener('compositionstart', () => { if (performance.now() - at < 2000 && inp.value === ch) inp.value = ''; }, { once: true });
}
window.addEventListener('blur', () => { keys.clear(); pointerEnd(); setCtrl(false); hotHold = null; });   // 切走了收不到放開 F 鍵：不連放
function keyDir() {
    let u = 0, r = 0;
    for (const c of keys) { const k = KEYMAP[c]; if (k.includes('u')) u++; if (k.includes('d')) u--; if (k.includes('r')) r++; if (k.includes('l')) r--; }
    if (!u && !r) return null;
    return screenDir(Math.sign(r), -Math.sign(u));
}
// 畫面方向 → 天堂方向：挑格線投影後最接近的那個（方向 h 的畫面向量＝(24(dx+dy), 12(dy−dx))）
function screenDir(vx, vy) {
    let best = null, bv = -Infinity;
    const len = Math.hypot(vx, vy) || 1;
    for (let h = 0; h < 8; h++) {
        const sx = 24 * (DX[h] + DY[h]), sy = 12 * (DY[h] - DX[h]), sl = Math.hypot(sx, sy);
        const dot = (sx * vx + sy * vy) / (sl * len);
        if (dot > bv) { bv = dot; best = h; }
    }
    return best;
}
const cv = $('cv'), ctx = cv.getContext('2d');
// 站長 2026-11-07：畫布被瀏覽器收回（手機記憶體不夠時，畫面一閃一閃或變黑）也回報
//   第 1、3、10、30 次各報一次（同一句一頁只報一次，所以帶次數）：看得出是偶爾一次還是一直循環
let ctxLost = 0, imgReloadAt = 0;
cv.addEventListener('contextlost', () => {
    ctxLost++;
    if (window.L1WEB_REPORT && [1, 3, 10, 30].includes(ctxLost)) L1WEB_REPORT('遊戲畫布被瀏覽器收回（contextlost）' + (ctxLost > 1 ? '第 ' + ctxLost + ' 次' : ''), '/js/main.js', devInfo());
});
// 畫布還回來：地圖分塊（另外的畫布）多半也被一起清掉了 → 全部重畫（站長 2026-11-07 安卓 Firefox 地圖一條條黑塊，回報裡先有 contextlost）
//   站長 2026-11-08「地圖又扭曲了」（同一位玩家）：拼圖頁的圖也重抓（world.reloadImages），不然拿壞掉的圖重畫一樣缺
//   但重抓 1 分鐘最多一次（站長同日玩家影片「龍之谷地監走動畫面跳動」：重抓整張圖的拼圖頁吃記憶體，手機又收回畫布 → 再重抓，一直循環）；其餘只重畫分塊
cv.addEventListener('contextrestored', () => {
    const now = performance.now();
    if (!imgReloadAt || now - imgReloadAt > 60000) { imgReloadAt = now; world.reloadImages(); } else world.flushChunks();
});
window.L1WEB_DEV = devInfo;   // world.js 回報地圖載入失敗時附上
// 挨到大的一擊：遊戲畫面（只有畫布，介面不動）震一下（同單機版 vfxPlayerHit 震 #battle-view；lmui.css .vfx-shake）
function shakeView() { cv.classList.remove('vfx-shake'); void cv.offsetWidth; cv.classList.add('vfx-shake'); }
cv.addEventListener('animationend', e => { if (e.animationName === 'vfxShake') cv.classList.remove('vfx-shake'); });
const pointer = { down: false, x: 0, y: 0, x0: 0, y0: 0, t0: 0, hold: false, id: -1, touch: false, onObj: false };
function cvPos(e) { const r = cv.getBoundingClientRect(), k = stageScale(); return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; }   // 畫布的 CSS 像素（4:3 舞台放大 k 倍：螢幕距離 ÷ k）
// ── 虛擬方向鍵（站長 2026-10-22「按住畫面可以顯示出虛擬方向鍵 滑動角色可以走向對應的方向」）：手指按住遊戲畫面（不是按在怪、NPC、玩家、地上的道具上）
//   超過 HOLD_MS 或拖開 12px，按下去那一點出現方向鍵；手指往哪滑角色就往那個方向一直走（同方向鍵／按住走路：一格一格送 C_MoveChar、照角色的走路速度），
//   離中心不到 STICK_DEAD 站著不動，放開就停、方向鍵收掉。短按照舊（點地面走過去、點怪打、點 NPC 說話）。
//   按在人、怪、道具上：放開照舊是點他；拖開 STICK_DRAG 才變方向鍵（拖的時候中心還是按下去那一點）。滑鼠照舊（按住往游標方向走）
const STICK_R = 56, STICK_DEAD = 12, STICK_DRAG = 24;
const stick = document.createElement('div');
stick.id = 'vstick'; stick.hidden = true; stick.setAttribute('aria-hidden', 'true'); stick.innerHTML = '<i></i>';
$('game').appendChild(stick);
const stickKnob = stick.firstChild;
function stickShow(e) {   // e＝按下去那一下的事件（螢幕座標 → 舞台座標，stage.js）
    const [x, y] = sxy(e.clientX, e.clientY);
    stick.style.left = Math.round(x) + 'px'; stick.style.top = Math.round(y) + 'px';
    stickKnob.style.transform = ''; stick.hidden = false;
}
function stickHide() { if (!stick.hidden) stick.hidden = true; }
function stickMove() {   // 圓鈕跟著手指（超出外圈就停在外圈上）
    if (stick.hidden) return;
    const vx = pointer.x - pointer.x0, vy = pointer.y - pointer.y0, d = Math.hypot(vx, vy), m = STICK_R - 22, k = d > m ? m / d : 1;
    stickKnob.style.transform = 'translate(' + Math.round(vx * k) + 'px,' + Math.round(vy * k) + 'px)';
}
let stickEv = null, stickT = 0;
// 手指按著的那一刻變成方向鍵：AUTO 開著就關（同按住走路、方向鍵：手動移動＝停止自動）、點地面的路線取消
function stickOn() {
    clearTimeout(stickT);
    if (!pointer.down || pointer.hold || !stickEv || !G.inWorld || G.reconnecting) return;
    pointer.hold = true; stopPath(); userMoved();
    stickShow(stickEv); stickMove();
}
// 按下去那一點有沒有人／怪／道具（同 tapAt 點人的判斷）
function objAt(sx, sy) {
    if (!G.me || !view.cam || !world.ready) return null;
    const mx = sx / view.zoom + view.cam[0], my = sy / view.zoom + view.cam[1];
    for (const o of G.objs.values()) {
        if (o === G.me || o.sunk || o._hidden || o.isDoll) continue;
        if (hitObj(o, mx, my)) return o;
    }
    return null;
}
// (mx,my)（世界像素）有沒有點到 o：身體＝腳底往上到頭頂、左右各 18（_hw／_cx／_foot：第一名雕像比人寬、中間不在腳底、石座比腳底低，world.js）；
//   有對話的 NPC 連頭上的名牌也算（站長 2026-10-23「這 NPC 都點不到」：奇岩雜貨店的 NPC 站在屋裡，身體被屋頂蓋住，看得到的只有名牌）
function hitObj(o, mx, my) {
    if (o.gfx === 8162) return false;   // 情報少年（81307，會在奇岩廣場亂走）點不到：站長 2026-11-09「改少年不能點」，它走到萬物百貨商前面會擋住，玩家都點成它、買不到東西
    const p = world.worldPos(o.fx, o.fy), h = o._head || 50, cx = p[0] + (o._cx || 0);
    const npc = !o.isPc && !o.isItem && npcKey(o) in NPCCARDS, hw = npc ? Math.max(o._hw || 18, 28) : o._hw || 18;
    return mx > cx - hw && mx < cx + hw && my > p[1] - h - (npc ? 22 + (o._mark || 0) : 0) && my < p[1] + (o._foot || 8);   // _mark：名字上面的功能圖示高度（npcmark.js），點圖示也算
}
// 魔法娃娃的名字（站長 2026-10-24「平常不顯示，滑鼠移上去或點擊才出現，要用階級顏色」）：
//   電腦滑鼠停在娃娃圖上（world.js drawActor 記的這一幀圖範圍 _box）＝畫；手機、電腦點一下娃娃＝畫 DOLL_NAME_MS。
//   點娃娃不鎖定、不走過去（tapAt）
const DOLL_NAME_MS = 3000;
let dollTap = null, mouseIn = false;
function dollAt(mx, my) {
    let hit = null, best = -Infinity;
    const now = performance.now();
    for (const o of G.objs.values()) {
        if (!o.isDoll || !o._box || now - (o._boxAt || 0) > 500) continue;   // 最近沒畫到（設定隱藏、走出畫面）的不算
        const p = world.worldPos(o.fx, o.fy), b = o._box;
        if (mx >= p[0] + b[0] && mx <= p[0] + b[2] && my >= p[1] + b[1] && my <= p[1] + b[3]) { const r = o.y - o.x; if (r > best) { best = r; hit = o; } }
    }
    return hit;
}
// 電腦版滑鼠停在玩家身上（同點擊範圍 hitObj；自己照身體範圍 meBody）：每幀只算一次，畫每個人時比對
let pcHoverMemo = { t: -1, id: 0 };
function pcHoverOn(a) {
    if (!mouseIn || pointer.touch || !view.cam || !document.body.classList.contains('pcui')) return false;
    const now = performance.now();
    if (now - pcHoverMemo.t > 30) {
        const mx = pointer.x / view.zoom + view.cam[0], my = pointer.y / view.zoom + view.cam[1];
        let hit = null, best = -Infinity;
        for (const o of G.objs.values()) { if (!o.isPc || o === G.me || o.sunk || o._hidden || !hitObj(o, mx, my)) continue; const r = o.y - o.x; if (r > best) { best = r; hit = o; } }
        pcHoverMemo = { t: now, id: hit ? hit.id : (G.me && meBody(mx, my) ? G.me.id : 0) };
    }
    return pcHoverMemo.id === a.id;
}
function dollNameOn(a) {
    if (dollTap && dollTap.id === a.id && performance.now() < dollTap.until) return true;
    if (!mouseIn || pointer.touch || !view.cam || !a._box) return false;
    const p = world.worldPos(a.fx, a.fy), b = a._box, mx = pointer.x / view.zoom + view.cam[0], my = pointer.y / view.zoom + view.cam[1];
    return mx >= p[0] + b[0] && mx <= p[0] + b[2] && my >= p[1] + b[1] && my <= p[1] + b[3] && dollAt(mx, my) === a;
}
cv.addEventListener('pointerover', e => { if (e.pointerType === 'mouse') mouseIn = true; });
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mouseIn = false; });
// 點到自己：身體上半（腳邊 20 點照舊算點地面）；按住照舊是走路（pointerDir），不會跳卡
function meBody(mx, my) {
    const me = G.me; if (!me || me.act === 'death') return false;
    const p = world.worldPos(me.fx, me.fy), h = me._head || 50;
    return Math.abs(mx - p[0]) < 18 && my > p[1] - h - 4 && my < p[1] - 20;
}
function pointerEnd() { pointer.down = false; pointer.id = -1; clearTimeout(stickT); stickEv = null; stickHide(); }
cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button === 1) { e.preventDefault(); if (document.body.classList.contains('pcui')) midUse(...cvPos(e)); return; }   // 中鍵：用滾輪選中的快捷格（電腦版）
    if (pointer.down && pointer.touch && e.pointerId !== pointer.id) return;   // 第二根手指：不打斷正在按的那根（方向鍵）
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    [pointer.x, pointer.y] = cvPos(e); pointer.x0 = pointer.x; pointer.y0 = pointer.y;
    pointer.down = true; pointer.hold = false; pointer.t0 = performance.now(); pointer.ctrl = e.ctrlKey; pointer.id = e.pointerId;
    pointer.touch = e.pointerType === 'touch';
    pointer.onObj = pointer.touch && !!objAt(pointer.x, pointer.y);
    clearTimeout(stickT); stickEv = null; stickHide();
    if (pointer.touch) { stickEv = { clientX: e.clientX, clientY: e.clientY }; if (!pointer.onObj) stickT = setTimeout(stickOn, HOLD_MS); }
    cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });   // 中鍵不要變成瀏覽器的自動捲動
// 電腦版：滾輪在遊戲畫面上＝換選中的快捷格（hud.hotCycle，空格跳過）。滑鼠滾一格＝換一格，滾多快換多快；
//   觸控板一次只來一點點 → 累積滿 100 才換一格（站長 2026-10-22「滾輪有點卡卡的」：原本 150ms 內只算一格，滾快了會吃掉）
//   滑鼠停在快捷列上滾也一樣（站長 2026-10-23「滑鼠停在快捷列上滾滾輪也可以切換」）
let wheelAcc = 0;
function hotWheel(e) {
    if (!document.body.classList.contains('pcui') || !G.inWorld) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;   // 行／頁換算成像素
    if (!d) return;
    if (Math.abs(d) >= 50) { wheelAcc = 0; hud.hotCycle(d > 0 ? 1 : -1); return; }   // 滑鼠滾一格（50～120 都有）＝換一格
    if (Math.sign(d) !== Math.sign(wheelAcc)) wheelAcc = 0;   // 觸控板：換方向重算
    wheelAcc += d;
    if (Math.abs(wheelAcc) >= 100) { hud.hotCycle(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
}
cv.addEventListener('wheel', hotWheel, { passive: false });
{ const hb = $('lmui-hot'); if (hb) hb.addEventListener('wheel', hotWheel, { passive: false }); }
// 中鍵點畫面：選中的快捷格對點到的人用（站長 2026-10-22「例如選好治癒術，點擊目標就會補血」）。
//   魔法：點到人／怪＝對他放（也鎖定他；點了就算自己選的，玩家也直接放）、點到自己＝對自己、指定地點的點地面＝放在那格、其他點地面＝同按 F 鍵；
//   魔杖：點到的人／怪／自己；其他道具（藥水…）＝同按 F 鍵。能不能放、距離、扣什麼照舊由 castSkill／伺服器判斷
function midUse(sx, sy) {
    if (!G.me || !view.cam || !world.ready || !G.inWorld) return;
    const h = hud.hotPicked();
    if (!h) { hud.toast('先用滾輪選一格快捷鍵'); return; }
    if (h.k === 'none') { hud.useSlot(h.i); return; }   // 東西用完、魔法還沒學：照按 F 鍵的提示
    const hit = objAt(sx, sy), mp = world.worldPos(G.me.fx, G.me.fy), mx = sx / view.zoom + view.cam[0], my = sy / view.zoom + view.cam[1];
    let t = hit && !hit.isItem ? hit : (mx > mp[0] - 18 && mx < mp[0] + 18 && my > mp[1] - (G.me._head || 50) && my < mp[1] + 8) ? G.me : null;
    if (t && t !== G.me && t.act === 'death' && !(h.k === 'skill' && (h.s.type & 32))) t = null;   // 點到屍體＝沒點到（造屍術、復活類才對屍體放）
    if (!t && h.k === 'skill' && XY_ONLY.has(h.s.sid)) { const cell = world.screenToCell(sx / view.zoom, sy / view.zoom, view.cam); castSkill(h.s, { x: cell[0], y: cell[1] }, true); return; }
    // 要目標的魔法、施法道具（閃電魔杖…）點到空地：不送、不扣魔力。原本照按 F 鍵＝對鎖定的（可能是早就打死的屍體）、AUTO 打的那隻放，
    //   點了空地卻扣了魔力（站長 2026-10-24「使用滑鼠中鍵，沒有選到目標會耗魔力」）。對自己放的、範圍型的（技能表無對象）照舊
    if (!t && (h.k === 'skill' ? midNeedsTarget(h.s) : (h.p.it.useType === 5 || h.p.it.useType === 17))) { hud.float('沒有點到目標', true); return; }
    hotUseOn(h, t);
}
// 中鍵點空地時，這個魔法要不要點目標：技能表無對象、指定地圖、指定地點、對道具放、提煉魔石、呼喚／援護盟友、造屍術（自己找屍體）、
//   沒鎖定會給自己的輔助魔法（castSkill 同一條）都不用
const MID_NO_TARGET = new Set([12, 107, 73, 21, 100, 116, 118, 41]);
function midNeedsTarget(s) {
    if (s.target === 'none' || MAP_ONLY.has(s.sid) || XY_ONLY.has(s.sid) || MID_NO_TARGET.has(s.sid)) return false;
    if (s.target === 'buff' && (s.to & (1 | 4 | 8)) && selfOk(s)) return false;
    return true;
}
// 選中的快捷格對 t 用（t＝null：同按 F 鍵）：中鍵點畫面、中鍵點夥伴格／隊員欄共用
function hotUseOn(h, t) {
    if (t && t !== G.me) G.lock = t;
    if (h.k === 'skill') { castSkill(h.s, t, true); return; }
    const u = h.p.it.useType;
    if (t && (u === 5 || u === 17)) { useItem(h.p, null, t); return; }
    hud.useSlot(h.i);
}
// 中鍵點血條上面的夥伴格（寵物、召喚…）、左側隊員欄：選中的快捷格對那隻／那個人用（站長 2026-10-23「例如對寵物補血」）。
//   同中鍵點畫面上的他（hotUseOn → castSkill／useItem），距離、能不能放照舊；不在畫面內（收不到他的位置）＝太遠了
function midUseId(id, name) {
    if (!G.me || !G.inWorld) return;
    const h = hud.hotPicked();
    if (!h) { hud.toast('先用滾輪選一格快捷鍵'); return; }
    if (h.k === 'none') { hud.useSlot(h.i); return; }
    const o = G.objs.get(id);
    if (!o) { hud.float((name ? name + ' ' : '') + '太遠了', true); return; }
    hotUseOn(h, o);
}
// Ctrl 在別的地方按下去的（焦點不在遊戲上）：滑鼠在畫面上一動就對上
cv.addEventListener('pointermove', e => {
    if (pointer.touch && pointer.down && e.pointerId !== pointer.id) return;
    [pointer.x, pointer.y] = cvPos(e); if (e.pointerType === 'mouse' && e.ctrlKey !== !!G.ctrl && !hud.isTyping()) setCtrl(e.ctrlKey);
    if (e.pointerType === 'mouse') hoverFreeCheck();
    if (pointer.touch && pointer.down) {
        if (!pointer.hold && Math.hypot(pointer.x - pointer.x0, pointer.y - pointer.y0) >= (pointer.onObj ? STICK_DRAG : 12)) stickOn();
        stickMove();
    }
});
cv.addEventListener('pointerup', e => {
    if (pointer.touch && pointer.down && e.pointerId !== pointer.id) return;
    if (pointer.down && !pointer.hold) { if (e.shiftKey && !pointer.touch && turnTo(pointer.x, pointer.y)) { pointerEnd(); return; } tapAt(pointer.x, pointer.y, pointer.ctrl || e.ctrlKey); }   // Shift＋點＝原地轉向（turnTo）
    pointerEnd();
});
cv.addEventListener('pointercancel', e => { if (!(pointer.touch && pointer.down && e.pointerId !== pointer.id)) pointerEnd(); });
cv.addEventListener('lostpointercapture', e => { if (!(pointer.touch && pointer.down && e.pointerId !== pointer.id)) pointerEnd(); });
// 按住超過 HOLD_MS 或手指拖開：手機＝虛擬方向鍵的方向（中心＝按下去那一點）；滑鼠＝往游標方向一直走
function pointerDir() {
    if (!pointer.down || !G.me || !view.cam || pointer.ctrl) return null;   // Ctrl＋按住＝強制攻擊，不走
    if (pointer.touch) {
        if (!pointer.hold) return null;   // 還沒變成方向鍵（stickOn）
        const vx = pointer.x - pointer.x0, vy = pointer.y - pointer.y0;
        return Math.hypot(vx, vy) < STICK_DEAD ? null : screenDir(vx, vy);
    }
    if (!pointer.hold) {
        if (performance.now() - pointer.t0 < HOLD_MS && Math.hypot(pointer.x - pointer.x0, pointer.y - pointer.y0) < 12) return null;
        pointer.hold = true; stopPath(); userMoved();
    }
    const p = world.worldPos(G.me.fx, G.me.fy);
    const mx = pointer.x / view.zoom + view.cam[0], my = pointer.y / view.zoom + view.cam[1];
    const vx = mx - p[0], vy = my - (p[1] - 24);   // 量到身體中間，點腳邊附近也走得動
    if (Math.hypot(vx, vy) < 10) return null;
    return screenDir(vx, vy);
}
// 點一下：點到怪＝打牠（手動攻擊，見 atkCheck）；點到其他人（NPC、玩家、寵物）＝鎖定（腳下紅圈）；點地面＝走過去（地上畫目的地圈）。
//   ctrl＝強制攻擊（電腦 Ctrl、手機「強制」鈕）
// 滑鼠指著紫名玩家＝游標換成劍（同按住 Ctrl）；每幀最多算一次
let hoverAt = 0;
function hoverFreeCheck() {
    const now = performance.now(); if (now - hoverAt < 50) return; hoverAt = now;
    let on = false;
    if (G.me && view.cam && world.ready) {
        const mx = pointer.x / view.zoom + view.cam[0], my = pointer.y / view.zoom + view.cam[1];
        for (const o of G.objs.values()) if (freePvp(o) && !o._hidden && hitObj(o, mx, my)) { on = true; break; }
    }
    if (on !== !!G.hoverFree) { G.hoverFree = on; cursorSync(); }
}
function tapAt(sx, sy, ctrl) {
    if (!G.me || !view.cam || !world.ready) return;
    // 點到魔法娃娃（前面沒有別的人、怪擋著）：只顯示名字幾秒，不鎖定、不走過去、不打斷正在做的事。等點目標放魔法、強制攻擊時照舊
    if (!G.castPick && !ctrl && !G.forceArm) {
        const mx = sx / view.zoom + view.cam[0], my = sy / view.zoom + view.cam[1], d = dollAt(mx, my);
        if (d && ![...G.objs.values()].some(o => o !== G.me && !o.sunk && !o._hidden && !o.isDoll && hitObj(o, mx, my))) { dollTap = { id: d.id, until: performance.now() + DOLL_NAME_MS }; return; }
    }
    G.talkTo = 0; G.pickTo = 0; G.castWalk = null;
    const force = !!ctrl || !!G.forceArm;   // 強制攻擊：電腦 Ctrl＋點、手機「強制」鈕亮著
    // 站長 2026-11-02「傳送點還是有點難點」：點到傳送點的牌子最優先（牌子浮在角色、怪頭上，原本被當成點自己、點怪）；選目標放魔法、強制攻擊時不算
    if (!G.castPick && !force) { const bx = portals.hit(sx / view.zoom + view.cam[0], sy / view.zoom + view.cam[1], true); if (bx) { atkStop(); userMoved(); goPortal(bx); return; } }
    atkStop();   // 點了任何地方＝換做別的事（點同一隻怪下面會再接著打）
    const mx = sx / view.zoom + view.cam[0], my = sy / view.zoom + view.cam[1];
    let hit = null, best = -Infinity;
    for (const o of G.objs.values()) {
        if (giranPetSkip(o)) continue;   // 奇岩城鎮安全區裡別人的寵物、夥伴點不到（點到就當沒點到，點得到後面的人或 NPC）
        if (o === G.me || o.sunk || o._hidden || o.isDoll) continue;   // 魔法娃娃只是外觀：不鎖定（點到娃娃上面先處理掉了：只顯示名字）   // 潛地的、不畫的點不到（點到空地上看不見的怪會亂鎖定）
        if (hitObj(o, mx, my)) { const r = o.y - o.x; if (r > best) { best = r; hit = o; } }
    }
    // 站長 2026-11-09「萬物百貨商附近不能有人靠近不然重疊玩家無法點」：點的位置同時壓到能說話的 NPC 跟玩家（或寵物、召喚獸、地上的道具）時，能說話的 NPC 優先；怪不算（點怪照舊打怪）；選目標放魔法、強制攻擊照舊點最前面那個
    if (hit && !G.castPick && !force && (hit.isPc || hit.isItem || hit.master)) {
        for (const o of G.objs.values()) if (o !== G.me && !o.sunk && !o._hidden && !o.isDoll && !o.isPc && !o.isItem && npcKey(o) in NPCCARDS && !mobTarget(o) && hitObj(o, mx, my)) { hit = o; break; }
    }
    if (G.castPick) {   // 魔法等目標：點到人＝對他放（也順便鎖定）；點到自己＝對自己放；指定地點的（火牢、治癒能量風暴）點地面＝放在那一格；其他點地面＝取消
        const s = G.castPick; G.castPick = null;
        //   原本自己點不到（魔法相消術對自己必定成功卻放不了）、指定地點的只能點人（空地上放不出治癒能量風暴）——2026-10-18 法師魔法測試回報
        const mp = world.worldPos(G.me.fx, G.me.fy), meHit = !hit && mx > mp[0] - 18 && mx < mp[0] + 18 && my > mp[1] - (G.me._head || 50) && my < mp[1] + 8;
        if (s.seed) {   // 南瓜種子（伺服器第 596 項）：點地面＝種在那一格（能不能種伺服器判斷、說原因）；點到人、怪＝取消
            if (hit) { hud.float('取消種植', true); return; }
            const cell = world.screenToCell(sx / view.zoom, sy / view.zoom, view.cam);
            conn.pumpkin(1, s.seed, cell[0], cell[1]);
            return;
        }
        if (s.useItem) {   // 施法道具（閃電魔杖…，useItem；魔法的 castPick 是技能表那筆，s.item 是材料編號，所以另外用 useItem 標）：點到人＝對他用（也順便鎖定）、點到自己＝對自己、點地面＝取消；道具已經不在（次數用完）就不送
            const t = hit && !hit.isItem ? hit : meHit ? G.me : null;
            if (!t) hud.float('取消使用', true);
            else if (G.inv.has(s.useItem.id)) { if (t !== G.me) G.lock = t; useItem(s.useItem, null, t); }
            return;
        }
        if (hit) { G.lock = hit; castSkill(s, hit); }
        else if (meHit) castSkill(s, G.me);
        else if (XY_ONLY.has(s.sid)) { const cell = world.screenToCell(sx / view.zoom, sy / view.zoom, view.cam); castSkill(s, { x: cell[0], y: cell[1] }); }
        else hud.float('取消施放', true);
        return;
    }
    // 強制攻擊：點到人（玩家、寵物、NPC…）＝一直打（自己打：AUTO 開著就關）；點地面（或地上的道具）＝朝那一格揮一下。
    //   AUTO 開著時強制點怪＝跟一般點怪一樣讓 AUTO 先打牠（下面），不關 AUTO
    //   強制鈕亮著點地面＝照常走過去（不然鈕亮著就走不動）；Ctrl＋點地面才原地揮
    if (hit && top1.statueTap(hit)) { G.lock = hit; return; }   // 第一名雕像：榮耀卡（top1.js）；強制攻擊亮著也一樣，不走過去、不打
    if ((force || freePvp(hit)) && !(hit && G.autoOn && mobTarget(hit)) && (hit || ctrl)) {
        userMoved();
        if (hit && isMyPet(hit)) { G.lock = G.lock === hit ? null : hit; return; }   // 自己的寵物、召喚獸打不得（伺服器也擋，本機改動第 83 項⑤）：照一般點選＝選取
        if (hit && !hit.isItem) { atkStart(hit, true); return; }
        const cell = hit ? [hit.x, hit.y] : world.screenToCell(sx / view.zoom, sy / view.zoom, view.cam);
        swingAt(cell[0], cell[1]);
        return;
    }
    // 第 297 項（站長 2026-10-26「不能手動攻擊歐姆民兵」）：NPC 卡片照「名字｜外型」對，怪跟同名同外型的商人（魔族神殿 歐姆民兵 45331 vs 商人 81352）分不出來
    //   → 伺服器給過這張地圖能說話的 NPC 清單、而且這隻不在裡面又是怪＝當怪打
    const fakeNpc = h => mobTarget(h) && !!mapNpcList() && !mapNpcList().some(n => n.id === h.id);
    if (hit && !hit.isPc && !hit.isItem && isPumpkinName(hit.name)) { G.lock = hit; pumpkin.open(hit.id); return; }   // 南瓜（第 596 項）：開澆水／採收視窗；要打它用強制攻擊
    if (hit && !hit.isPc && npcKey(hit) in NPCCARDS && !fakeNpc(hit)) { G.lock = hit; talkTo(hit.id); return; }   // 點 NPC 本人＝走過去說話（同 NPC 卡片）
    if (hit && hit.isItem) { userMoved(); pickTo(hit.id); return; }   // 點地上的道具＝走過去撿（自己走：AUTO 開著就關）
    // 點其他玩家＝鎖定＋選單：邀請組隊、隊長對隊員委任／驅逐（party.js）；沒有血盟時點有血盟的王族多一個「申請加入血盟」（clan.js）
    if (hit && hit.isPc && hit !== G.me && party.playerMenu(hit, clan.playerOpts(hit), clan.card(hit))) { G.lock = hit; return; }
    if (!hit && !force && meBody(mx, my)) { party.playerMenu(G.me, [], clan.card(G.me)); return; }   // 點自己：同一張小卡（名字、封號、血盟），沒有按鈕
    // 點怪＝打牠（同原版左鍵點怪）。AUTO 開著：不關 AUTO、不跟它搶，請 AUTO 先打這隻（C_Web 27）；
    //   照舊也鎖定牠（紅圈；對牠放魔法、用魔杖不用再點一次）
    if (mobTarget(hit)) {
        if (G.autoOn) { G.lock = hit; conn.autoFocus(hit.id); return; }
        atkStart(hit, false); return;
    }
    if (hit) { G.lock = G.lock === hit ? null : hit; return; }
    userMoved();   // 點地面＝自己走（AUTO 開著就關）
    const pt = portals.hit(mx, my);   // 點到樓梯、傳送點的光圈或牌子：走上那一格（點不到人才輪到它，不擋打怪）
    if (pt) { goPortal(pt); return; }
    const cell = world.screenToCell(sx / view.zoom, sy / view.zoom, view.cam);
    goToLoose(cell[0], cell[1]);   // 只有點地面用寬鬆版；走去 NPC、撿東西、放魔法照舊用 goTo（站長 2026-10-23：全部改寬鬆版後點 NPC 不能對話）
}
// 走上樓梯、傳送點：好幾格的入口挑最近、走得到的那格；格子本身走不上去（地圖畫成牆）就走到旁邊最近的一格
function goPortal(pt) {
    const me = G.me, far = c => Math.max(Math.abs(c[0] - me.x), Math.abs(c[1] - me.y));
    const cells = pt.cells.slice().sort((a, b) => far(a) - far(b));
    // 人已經站在入口那格（AUTO、登入停在上面；伺服器只在「走進來」那一步傳送）：原本點了什麼都不做 → 送「進入傳點」（站長 2026-11-07「玩家進不去」）
    const on = cells.find(c => far(c) === 0);
    if (on) { if (conn && !immobile()) conn.enterPortal(on[0], on[1]); return; }
    G.portalDoor = null;
    for (const c of cells) { const path = world.findPath(me.x, me.y, c[0], c[1], occupied); if (path && path.length) { G.marker = { x: c[0], y: c[1], t: performance.now() }; G.path = path; G.goal = c; return; } }
    // 入口格子本身是牆（旅館房間的門口、原版用戶端朝門走一步伺服器就傳送：C_MoveChar 先看 Dungeon.dg 才看能不能走）：
    //   走到旁邊，再朝那格送一步（portalDoorCheck；站長 2026-10-24「旅館要離開無法進入傳送點」）
    G.portalDoor = { x: cells[0][0], y: cells[0][1] };
    if (far(cells[0]) === 1) { portalDoorCheck(); return; }
    goNear(cells[0][0], cells[0][1]);
}
// 走到牆一樣的入口旁邊了：朝它送一步（不檢查能不能走，伺服器照傳點處理；沒傳就算了）
function portalDoorCheck() {
    const d = G.portalDoor, me = G.me; if (!d || !me || !conn) return;
    const dx = d.x - me.x, dy = d.y - me.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1) { if (!G.path || !G.path.length) G.portalDoor = null; return; }
    G.portalDoor = null;
    const h = DX.findIndex((x, i) => x === dx && DY[i] === dy); if (h < 0 || immobile()) return;
    me.heading = h; conn.move(me.x, me.y, h);
}
function goTo(x, y) {
    const me = G.me;
    const path = world.findPath(me.x, me.y, x, y, occupied);
    G.marker = { x, y, t: performance.now() };
    if (!path || !path.length) { G.path = null; return; }
    G.path = path; G.goal = [x, y];
}
// 點地面：點的格子走不到（牆、柱子、水、不連通）就走到離點的位置最近、走得到的那格（world.findPathNear），標記畫在真正會停下的那格
//   （站長 2026-10-23「點走不過去的位置人物就不動了」）。只給點地面用，其他（goNear、撿東西、goPortal）照舊用 goTo
function goToLoose(x, y) {
    const me = G.me;
    const r = world.findPathNear(me.x, me.y, x, y, occupied);
    if (!r || !r.path.length) { G.marker = { x, y, t: performance.now() }; G.path = null; return; }
    G.marker = { x: r.to[0], y: r.to[1], t: performance.now() };
    G.path = r.path; G.goal = r.to;
}
function stopPath() { G.path = null; G.goal = null; }
function changeChar(fromWait) {   // 回選角：C_NewCharSelect，伺服器存檔後重送角色列表（連線不斷）；通行碼丟掉，進下一隻時伺服器再發
    if (!conn) return;
    // 第 366 項（站長 2026-10-27「戰鬥中時不能重登」）：戰鬥中（S_Web 66）不送、畫面不清；伺服器那邊也會擋（舊網頁、直接送封包的保底）
    // 第 448 項（經營者檢查 2026-10-29「AUTO 開著回不了選角，怎麼等都沒用」）：AUTO 開著自己一直打，戰鬥永遠不會結束 →
    //   先幫玩家關 AUTO，離開戰鬥後自己回選角（changeWait）；等的時候玩家又開 AUTO（autoToggle）就不回了
    const fight = G.inWorld ? (G.combatEnd || 0) - performance.now() : 0;
    if (fight > 0) {
        const wasAuto = G.autoOn;
        if (wasAuto) { G.actAt = performance.now(); atkStop(); stopPath(); conn.autoToggle(false); }
        if (!fromWait) { changeWait(); hud.toast(wasAuto ? '已關掉 AUTO，離開戰鬥後自動回選角' : '戰鬥中，離開戰鬥後自動回選角'); }
        return;
    }
    changeWaitStop();
    passClear(); prefSync.end();   // 第 299 項：沒送的設定先送
    G.inWorld = false; clearInterval(keepTimer); link.setWorld(false);
    G.objs.clear(); G.inv.clear(); G.me = null; G.myId = 0; G.lock = null; G.castPick = null; G.forceArm = false; atkStop(); forceSync(); stopPath(); trial.reset();
    start.backToSelect();
    conn.changeChar();
}
// 第 448 項：戰鬥中按了回選角 → 每 0.5 秒看一次，離開戰鬥（S_Web 66 的時間到了）就自己回選角；等太久（一直被怪打）就算了、說一句
const CHANGE_WAIT_MS = 60000;
let changeT = 0, changeUntil = 0;
function changeWaitStop() { clearInterval(changeT); changeT = 0; }
function changeWait() {
    changeWaitStop();
    changeUntil = performance.now() + CHANGE_WAIT_MS;
    changeT = setInterval(() => {
        if (!conn || !G.inWorld) { changeWaitStop(); return; }
        if ((G.combatEnd || 0) - performance.now() <= 0) { changeWaitStop(); changeChar(true); return; }
        if (performance.now() > changeUntil) { changeWaitStop(); hud.toast('還在戰鬥中，離開怪物附近再回選角'); }
    }, 500);
}
// 玩家自己動了（方向鍵、按住、點地面）：取消「走去跟 NPC 說話」；AUTO 開著就關掉（同天堂M：手動移動＝停止自動）
// 走開了：NPC 視窗關掉（舊伺服器離 3 格以上就不理了；支援同地圖遠距離對話的不必關）
function userMoved() { G.talkTo = 0; G.pickTo = 0; G.castWalk = null; atkStop(); if (!G.remoteTalk) hud.npc.close(); if (G.autoOn && conn) { G.autoOn = false; conn.autoToggle(false); hud.float('AUTO 已關閉', true); } }   // 站長 2026-11-10：手動走路關掉 AUTO 要說一聲（玩家「點 AUTO 有時候沒反應」其實是手機誤碰地圖被關掉）

// ── 每幀 ──────────────────────────────────────────
// 省電模式（系統頁開關，hud.js；預設關）：每秒最多畫 20 格、AUTO 30 秒沒碰畫面再降到 12 格（frameGap），畫布 1 倍像素（resize）
//   站長 2026-11-08「開了省電模式手機還是會發燙」：原本 30 格，手機 CPU 降速 4 倍量站著不動還忙 63%（每格約 550 張圖）→ 降幀數
let powerSave = false;
// 站長 2026-11-10「電腦開啟的不用省電模式」：同 hud.js touchDev，電腦（沒觸控）就算存著開也不省電
function readPower() { try { powerSave = localStorage.getItem('l1web_power_save') === '1' && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0); } catch (e) { powerSave = false; } document.body.classList.toggle('pwr-save', powerSave); }   // pwr-save：地名那排最右邊標「省電模式中 N 幀」（lmui.css），站長 2026-11-09「不然卡卡的玩家以為 LAG」
readPower();
const view = { zoom: 1, cam: null, W: 0, H: 0, dpr: 1 };
function resize() {
    // 4:3 舞台（stage.js）：畫布 CSS 大小是舞台的邏輯像素、整個被放大 k 倍 → 畫布實際像素也乘 k，才不會糊
    // 畫布像素＝螢幕實際像素（devicePixelRatio 照實際的，最高 3）：原本四捨五入、最高 2 → 手機 3 倍螢幕畫布只有 2 倍、被瀏覽器再放大 1.5 倍，
    //   名字和整張地圖都糊；電腦 125%／150% 縮放也一樣被放大或縮小一次（站長 2026-10-24「ID 跟 NPC 名稱字體高清一點」）
    const k = stageScale(), dpr = (powerSave ? 1 : Math.max(1, Math.min(2, window.devicePixelRatio || 1))) * k;   // 省電模式：1 倍像素   // 站長 2026-10-24「改回兩倍」：最高 2（3 倍螢幕畫的量多 2.25 倍，怕耗電發熱）
    const w = cv.clientWidth || vw(), h = cv.clientHeight || vh();
    view.dpr = dpr;
    // 站長 2026-10-19「Z 鍵縮放取消」：拿掉按 Z 切 1 倍／放大，一律照預設倍率
    view.zoom = defaultZoom(w, h);
    // 第 369 項（站長 2026-10-27「電腦網頁放大縮小畫面都會閃爍 3 下」）：改 cv.width／height 會把畫布清空，一次縮放會連著觸發好幾次
    //   （視窗 resize、ResizeObserver、舞台重算）→ 每次都清一次＝閃好幾下。尺寸沒變就不動畫布；要變時先把舊畫面拍下來、改完馬上貼回去（拉伸一下），等下一幀照新尺寸重畫
    const nw = Math.round(w * dpr), nh = Math.round(h * dpr);
    if (cv.width !== nw || cv.height !== nh) {
        let snap = null;
        try { if (cv.width > 0 && cv.height > 0) { snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; snap.getContext('2d').drawImage(cv, 0, 0); } } catch (e) { snap = null; }
        cv.width = nw; cv.height = nh;
        if (snap) { try { cv.getContext('2d').drawImage(snap, 0, 0, nw, nh); } catch (e) { /* 拍不到就等下一幀 */ } snap.width = 0; snap.height = 0; }   // 用完就還（iPhone 畫布上限）
    }
    view.W = w / view.zoom; view.H = h / view.zoom; view.cssH = h;
}
// 電腦版面（body.pcui）固定放大 PC_ZOOM 倍，不跟畫面大小變（站長 2026-10-19「電腦版的視野太廣了」→「再拉近一點，固定倍率」；
//   原本只有 1／2 倍、畫布要 1500×800 以上才 2 倍，1920×1080 的瀏覽器扣掉面板只剩 673 高 → 1 倍，看到一大片）。
//   手機橫放（也是電腦版面，pcui.js 把介面縮到 1 以下時加 body.pcui-sm）畫面太小，照舊 1 倍；直式照舊（手機直式從來到不了 2 倍）
//   4:3 舞台（站長 2026-10-19「橫式鎖定 800X600 1200X900 依照比例縮放」，stage.js）：畫面放大交給舞台（1917×899 → 1.5 倍），
//   畫布在舞台裡 1 倍：800×471 個世界像素（舞台 600 扣面板 129）；PC_ZOOM 只剩沒鎖的電腦版面（舞台關掉時）用
const PC_ZOOM = 2.5;
function defaultZoom(w, h) {
    const b = document.body.classList;
    if (stageOn()) return 1;
    if (b.contains('pcui')) return b.contains('pcui-sm') ? 1 : PC_ZOOM;
    return w >= 1500 && h >= 800 ? 2 : 1;
}
window.addEventListener('resize', () => { hud.measureNav(); requestAnimationFrame(resize); });
// iPhone（尤其加到主畫面的 App）轉橫式：resize 事件來的那一刻版面還是直式的高度，之後排好卻不一定再來一次 resize
//   → 畫布像素照直式算、顯示變矮，整個畫面上下壓扁（站長 2026-10-18 手機橫式「畫面變形」）。改看畫布自己的大小：一變就重算
//   （改 cv.width／height 不會動到畫布的 CSS 大小，不會一直觸發）；沒有 ResizeObserver 的舊瀏覽器：轉向後過一下再量兩次
if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(cv);
else window.addEventListener('orientationchange', () => { for (const ms of [300, 1000]) setTimeout(() => { hud.measureNav(); resize(); }, ms); });

function occupied(x, y) {
    for (const o of G.objs.values()) if (o !== G.me && o.isPc && o.x === x && o.y === y) return true;
    return false;
}
// 被定住（S_Paralysis）：麻痺、詛咒麻痺、睡眠、冰凍、暈眩＝不能走也不能施法；束縛＝只是不能走。伺服器不收，網頁原本照走照放 →
//   畫面上走了伺服器沒走、之後被拉回去（2026-10-18 測試回報被暈沒鎖操作）
const HELPLESS = ['paralysis', 'paralysis2', 'sleep', 'freeze', 'stun'];
const helpless = () => { ccCheck(''); return HELPLESS.some(k => G.st[k]); };
// 定身狀態卡住的保險（2026-10-23 站長回報：被梅杜莎「木乃伊的詛咒」麻痺時被打死，回村後一直「動不了」）。
//   原因在伺服器：L1CurseParalysis／L1ParalysisPoison 解除時 player.isDead() 就不送 S_Paralysis 解除 → 死亡時相消術解掉的麻痺，網頁永遠收不到結束。
//   三道保險：① 死了直接清（meDead；伺服器死亡時也是整個解除）；② S_Web 10 身上的效果裡已經沒有任何定身類效果、而且設成 true 超過 CC_GRACE → 清
//   （不含束縛：加速器處罰的束縛沒有效果編號）；③ 設成 true 超過 CC_MAX 還沒收到解除 → 清（原版最長是麻痺毒 45 秒）。
const CC_KEYS = [...HELPLESS, 'bind'], CC_GRACE = 2000, CC_MAX = 60000;
// 會送 S_Paralysis 的效果（伺服器 L1SkillId）：木乃伊的詛咒 33、冰矛 50、沉睡之霧 66、冰雪暴 80、衝擊之暈 87、大地屏障 157、奪命之雷 192／5007、寒冰噴吐 194、
//   骷髏毀壞 208／5004／5005、麻痺毒 1008／1009、詛咒麻痺 1010／1011、束縛 10071、石化 10101、亞力安／邪惡蜥蜴冰矛 15003／15004
const CC_EFFECTS = new Set([33, 50, 66, 80, 87, 157, 192, 194, 208, 1008, 1009, 1010, 1011, 5004, 5005, 5007, 10071, 10101, 15003, 15004]);
const ccAt = {}, ccTimer = {};
function ccSet(k, on) {
    G.st[k] = on; clearTimeout(ccTimer[k]);
    if (!on) { delete ccAt[k]; return; }
    ccAt[k] = performance.now();
    ccTimer[k] = setTimeout(() => ccCheck('逾時'), CC_MAX + 100);
}
function ccClear(why) {
    const was = CC_KEYS.filter(k => G.st[k]);
    for (const k of CC_KEYS) { G.st[k] = false; clearTimeout(ccTimer[k]); delete ccAt[k]; }
    if (was.length) { console.warn('[定身] ' + why + '：清掉 ' + was.join('、')); hudUpdate(); }
}
function ccCheck(why) {
    const now = performance.now(), eff = G.effRaw && G.effRaw.list, noCc = !!eff && !eff.some(e => CC_EFFECTS.has(e.id));
    const drop = [];
    for (const k of CC_KEYS) {
        if (!G.st[k]) continue;
        const age = now - (ccAt[k] || 0);
        if (age > CC_MAX) drop.push([k, '超過 ' + (CC_MAX / 1000) + ' 秒沒收到解除']);
        else if (noCc && k !== 'bind' && age > CC_GRACE) drop.push([k, '身上已經沒有定身效果']);
    }
    if (!drop.length) return;
    for (const [k] of drop) { G.st[k] = false; clearTimeout(ccTimer[k]); delete ccAt[k]; }
    console.warn('[定身] ' + (why ? why + '：' : '') + drop.map(d => d[0] + '（' + d[1] + '）').join('、') + ' 自動解除');
    hudUpdate();
}
const immobile = () => helpless() || !!G.st.bind;
function frozenWarn() { if (performance.now() - (G.frozenWarnAt || 0) > 1500) { G.frozenWarnAt = performance.now(); hud.float('動不了', true); } }
function stepTo(h) {   // 照方向走一步（給尋路用：不滑步）
    const me = G.me;
    if (immobile()) { stopPath(); frozenWarn(); return false; }
    if (!world.canStep(me.x, me.y, h, occupied)) return false;
    conn.move(me.x, me.y, h);
    me.sx = me.x; me.sy = me.y; me.tx = me.x + DX[h]; me.ty = me.y + DY[h];
    me.x = me.tx; me.y = me.ty; me.heading = h; me.walking = true; me.t = 0; me.stepMs = myWalkMs();
    return true;
}
// 站長 2026-11-09「按 Shift 人物可以轉面」：電腦 Shift＋點畫面＝原地轉向點的那個方向（不走、不打、不選目標），同原版用戶端；點自己那格不動
function turnTo(sx, sy) {
    const me = G.me;
    if (!me || !conn || !G.inWorld || !view.cam || !world.ready || G.dead) return false;
    const c = world.screenToCell(sx / view.zoom, sy / view.zoom, view.cam);
    if (c[0] === me.x && c[1] === me.y) return true;
    if (immobile()) { frozenWarn(); return true; }
    stopPath();
    const h = dirTo(me.x, me.y, c[0], c[1]);
    if (me.heading !== h) { me.heading = h; conn.changeHeading(h); }
    return true;
}
function tryStep(h) {   // 鍵盤／按住：被擋就試左右兩個方向（貼著牆滑過去）
    if (immobile()) { frozenWarn(); return false; }   // 被定住：連轉身都不送
    for (const hh of [h, (h + 1) & 7, (h + 7) & 7]) if (stepTo(hh)) return true;
    const me = G.me;
    if (me.heading !== h) { me.heading = h; conn.changeHeading(h); }
    return false;
}
let lastT = 0, lastXY = '', mmAt = 0, placeAt = 0, rafId = 0;
// 站長 2026-10-30「工匠製作頁面有時候裡面按鈕卡卡的」（手機）：製作工匠幾乎蓋住整個地圖（只剩底下一條變暗的），地圖、小地圖照樣每幀重畫，
//   跟工匠的點擊搶同一條執行緒（手機、CPU 降速 4 倍量：點分頁到畫面更新中位 580ms，AUTO 開著 420ms）。
//   工匠開著、蓋住地圖八成五以上：地圖、小地圖先不畫（人物、怪照樣跟著走，關掉下一幀就接著畫）；電腦版視窗兩旁看得到地圖，照畫。蓋住幾成每 0.5 秒量一次
let coverAt = -1e9, coverOn = false;
function mapCovered(now) {
    if (!hud.craft.isOpen()) { coverAt = -1e9; return false; }
    if (now - coverAt > 500) { coverAt = now; coverOn = hud.craft.cover(cv.getBoundingClientRect()) >= 0.85; }
    return coverOn;
}
// AUTO 掛機、30 秒沒碰畫面（觸控、滑鼠、鍵盤都算）：跟省電模式一樣每秒最多畫 30 格，手機少一半耗電發熱；畫布倍率不動（畫面不會突然變糊）。
//   一碰馬上回到原本的幀數（下一幀就照畫）
const IDLE_MS = 30000;
let lastInput = performance.now();
for (const t of ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'keydown']) window.addEventListener(t, () => { lastInput = performance.now(); }, { capture: true, passive: true });
// 離上一格不到幾毫秒就跳過這一格（0＝每格都畫）：門檻取比目標間隔小一點，60／120 Hz 螢幕都剛好落在 20、12、30 格
//   省電：20 格（48）、AUTO 閒置 12 格（80）；沒開省電：AUTO 閒置 30 格（31）、平常不限
function frameGap(now) {
    const idle = G.autoOn && now - lastInput > IDLE_MS;
    if (powerSave) { const f = idle ? '12' : '20', ml = document.getElementById('lmui-mapline'); if (ml && ml.dataset.pwrfps !== f) ml.dataset.pwrfps = f; return idle ? 80 : 48; }   // 「省電模式中 20 幀」（lmui.css）
    return idle ? 31 : 0;
}
function loop(now) {
    rafId = 0;
    if (document.hidden) { lastT = 0; return; }   // 切走：整個停，回來 visibilitychange 再開
    rafId = requestAnimationFrame(loop);
    const gap = frameGap(now);
    if (gap && lastT && now - lastT < gap) return;
    const dt = Math.min(100, lastT ? now - lastT : 16); lastT = now;
    if (!G.inWorld) return;
    const me = G.me;
    if (hotHold) { if (hotHold.item) hotItemCheck(performance.now()); else hotHoldCheck(performance.now()); }   // 按住 F 鍵：道具每 0.55 秒用一次；魔法照施法節奏再放
    cursorSync();
    if (me && G.autoOn) advance(me, dt);   // AUTO：伺服器帶著走，跟別人同一套（佇列、照實際間隔）
    else if (me) {
        let carry = 0;
        if (me.walking) { me.t += dt / me.stepMs; if (me.t >= 1) { carry = (me.t - 1) * me.stepMs; me.t = 1; me.walking = false; me.walkEnd = now; } me.fx = me.sx + (me.tx - me.sx) * me.t; me.fy = me.sy + (me.ty - me.sy) * me.t; }
        if (!me.walking && me.pend) { const p = me.pend; me.pend = null; if (p.heading != null) me.heading = p.heading; play(me, p.act); }
        if (!me.walking && world.ready && conn && !G.reconnecting && !G.dead) {
            if (G.talkTo) talkCheck();   // 走去跟 NPC 說話：到旁邊了就說
            if (G.castWalk) castWalkCheck();   // 走去放魔法：進到距離內就放
            if (G.pickTo) pickCheck();
            if (G.pumpkinDo) pumpkinCheck();   // 走去澆南瓜、採收：到旁邊了就做   // 走去撿地上的道具：到旁邊了就撿
            if (G.portalDoor && (!G.path || !G.path.length)) portalDoorCheck();   // 走去牆一樣的傳點：到旁邊了朝它送一步
            const hold = G.atk ? atkCheck(now) : false;   // 點怪攻擊：射程內出手（或等這一刀揮完）＝站著不走，不在射程內＝照下面的路線走過去
            let moved = false;
            const h = hud.isTyping() ? null : (pointerDir() ?? keyDir() ?? tap);
            tap = null;
            // 施法動作播完才接著走（同原版：施法時人會停下來）。原本走路中放魔法，動作排到這一步走完才播、下一步馬上又走 → 一直畫走路，
            //   只看得到魔法效果、看不到施法動作（站長 2026-10-23「施放魔法的時候沒有施法動作」）。路線、按著的方向都留著，播完照走
            //   攻擊也一樣（站長 2026-10-29「人物手動走路時 按強制攻擊攻擊時候 沒有攻擊動作」：按著方向走、出手排在這一步走完才播，同一幀又走下一步 → 揮刀被走路蓋掉）
            const casting = (me.act === 'skill' || me.act === 'attack') && now - me.actT < (me.actMs || 600);
            if (casting) { /* 站著把施法／揮刀動作播完 */ }
            else if (h != null) moved = tryStep(h);
            else if (!hold && G.path && G.path.length) {   // 點地面的路線：一步一步走；被人擋住就重找一次路
                moved = stepTo(G.path[0]);
                if (moved) G.path.shift();
                else { const g = G.goal; G.path = g ? world.findPath(me.x, me.y, g[0], g[1], occupied) : null; }
            }
            if (moved && carry) { me.t = Math.min(0.5, carry / me.stepMs); me.fx = me.sx + (me.tx - me.sx) * me.t; me.fy = me.sy + (me.ty - me.sy) * me.t; }
        }
    }
    // 地名旁的安全區／戰鬥區：換格子時算；地圖分區晚一點才載到，所以每半秒也重算一次。
    //   AUTO 開著也要算（伺服器帶著走：原本只在手動那段算，AUTO 時左下地名、掛機紀錄的地點都不會跟著換）
    if (me) { const xy = me.x + ',' + me.y; if (xy !== lastXY || now - placeAt > 500) { lastXY = xy; placeAt = now; place(); } }
    for (const o of G.objs.values()) if (o !== me) advance(o, dt);
    // 畫
    ctx.setTransform(view.dpr * view.zoom, 0, 0, view.dpr * view.zoom, 0, 0);
    ctx.imageSmoothingEnabled = false;
    // 換地圖：新地圖的圖還沒到就先不畫（停在上一個畫面，久一點蓋進度條），只把要的圖叫來下載
    const sy = hud.sceneFocus(view.cssH) / view.zoom;
    if (mapLoad.active && mapLoad.hold(now, me && world.ready ? world.prepare(view.W, view.H, [me.fx, me.fy], [...G.objs.values()], mapLoad.since, { sy }) : null)) return;
    if (!me || !world.ready) { ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, view.W, view.H); return; }
    const actors = [];
    const ds = dollShow(), myName = (G.me && G.me.name) || (G.curChar && G.curChar.name);
    for (const o of G.objs.values()) {
        if (o.isDoll && (ds === 'none' || (ds === 'mine' && o.master !== myName))) continue;   // 設定隱藏的魔法娃娃：不畫、名字不畫、小地圖不畫（dollshow.js）
        o.row = o.walking ? Math.max(o.sy - o.sx, o.ty - o.tx) : o.y - o.x;   // 走路中用起點終點較前面那列
        actors.push(o);
    }
    const s = G.st;
    portals.frame(G.mapId, me);
    if (mapCovered(now)) return;
    view.cam = world.draw(ctx, view.W, view.H, [me.fx, me.fy], actors, now, {
        under: portals.under, over: portals.over,
        sy, lock: G.lock || (G.autoOn && G.autoTarget ? G.objs.get(G.autoTarget) : null), marker: G.marker, fx: G.fx,
        hpR: s.maxHp ? s.hp / s.maxHp : 0, mpR: s.maxMp ? s.mp / s.maxMp : 0,
        mate: party.inParty() ? party.isMate : null,   // 隊友：名字綠色、頭上血條（world.js drawLabel）
        emblem: clan.emblemFor,                         // 盟徽：玩家名字左邊（第 111 項）
        enemy: clan.isEnemy,                            // 敵對血盟成員：名字紅色、頭上交叉劍（伺服器第 455 項）
        dollTier: dollTierByName,                       // 魔法娃娃頭上的名字照階級上色（dolls.js）
        mallFx: id => (G.mallFx && G.mallFx.get(id)) || 0,   // 第 236 項：1 閃亮封號、2 名字光環（S_Web 222 動作 4）
        pcHover: pcHoverOn,                             // 電腦版滑鼠停在哪個玩家身上（名字、封號只在這時、或點了才畫）
        dollName: dollNameOn,                           // 魔法娃娃的名字：滑鼠底下那隻、剛點的那隻才畫
    });
    if (hud.minimapOn() && now - mmAt > 250) { mmAt = now; world.drawMinimap(hud.minimap, me, actors, portals.all(), G.mapId === 4 ? G.pumpkinDots : null); }
}
rafId = requestAnimationFrame(loop);
relogStart();   // 這個分頁有通行碼（網頁被系統重新載入、點了更新）：直接登入原本那隻

// 除錯用：主控台看狀態
window.L1WEB = { G, world, hud, keys, pointer, view, mapLoad, tutorial, party, clan, promo, get conn() { return conn; }, get link() { return link; }, isMob };

// 傲慢之塔圖鑑（伺服器第 192 項，toibook.js）：等級照伺服器（S_Web 192，進世界送、開通升級後再送）、碎片照背包（名字「傲慢之塔碎片(NNF)」）、金幣照左上角
let toiWin = null, toiAskAt = 0, toiPend = -1;
// 還沒收到伺服器的圖鑑狀態（進世界那包沒收到）：製作工匠圖鑑分頁一顯示就再要一次，10 秒最多一次
function toiAsk() { if (conn && G.inWorld && performance.now() - toiAskAt > 10000) { toiAskAt = performance.now(); conn.toiBook(0); } }
function openToi() {
    if (conn && G.inWorld) conn.toiBook(0);
    toiWin = openToiBook({
        state: toiState,
        icon: () => '/icon/996.png',
        act: (f, a) => { if (!G.toiLv) { hud.toast('伺服器更新後才能開通'); return; } if (conn && G.inWorld) { toiPend = toiSegOf(f); conn.toiBook(a === 'open' ? 1 : 2, toiPend); } },
    });
}
// 伺服器段號 ↔ 樓層（第 279 項：段 9＝1F，0～8＝11F～91F）
const toiFloorOf = i => (i === 9 ? 1 : 11 + i * 10), toiSegOf = f => (f === 1 ? 9 : (f - 11) / 10);
function toiState() {
    const lv = {}, shards = {};
    (G.toiLv || []).forEach((v, i) => { if (v >= 0) lv[toiFloorOf(i)] = v; });
    for (const it of G.inv.values()) { const p = parseItem(it), m = /^傲慢之塔碎片\((\d+)F\)$/.exec(p.base); if (m) shards[+m[1]] = (shards[+m[1]] || 0) + (p.count || 1); }
    return { lv, shards, gold: G.st.gold || 0 };
}

// 狩獵圖鑑（第 393 項（站長 2026-10-28 狩獵圖鑑），huntdex.js）：等級、地區名字、能力說明、費用照伺服器（S_Web 93：網頁要了才送（圖鑑分頁、開視窗），開通升級後再送）；
//   狩獵的證明（道具 49238，名字碼 $5959）照背包算、金幣照左上角
const HUNT_PROOF = 49238;
let huntWin = null, huntAskAt = 0, huntPend = -1;
// 還沒收到伺服器的圖鑑狀態：製作工匠圖鑑分頁一顯示就要一次，10 秒最多一次
function huntAsk() { if (conn && G.inWorld && performance.now() - huntAskAt > 10000) { huntAskAt = performance.now(); conn.huntDex(0); } }
function huntProof() {
    let n = 0;
    for (const it of G.inv.values()) {
        const p = parseItem(it);
        if (TPL_OF.has(p.id) ? TPL_OF.get(p.id) === HUNT_PROOF : (p.nid === '$5959' || p.base === '狩獵的證明')) n += p.count || 1;
    }
    return n;
}
function huntState() { return G.huntDex ? Object.assign({}, G.huntDex, { proof: huntProof(), gold: G.st.gold || 0 }) : null; }
// 證明的圖示：道具表有就用道具表的，沒有就照伺服器的圖示編號（3.5C etcitem 49238 invgfx 665）
function huntIcon() { try { const t = itemById(HUNT_PROOF); const u = t ? itemIcon(t) : ''; return u || '/icon/665.png'; } catch (e) { return '/icon/665.png'; } }
// 裝備蒐藏（第 457 項（站長 2026-10-29 55.xlsx），collect.js）：組、門檻、加成、登錄了什麼都照伺服器（S_Web 57）；背包裡符合的照道具編號（S_Web 12）對
let collWin = null, collAskAt = 0;
function collectAsk() { if (conn && G.inWorld && performance.now() - collAskAt > 10000) { collAskAt = performance.now(); conn.collect(0); } }
function collectBag() {
    const out = [];
    for (const it of G.inv.values()) {
        const p = parseItem(it);
        if (p.cat === '道具') continue;
        out.push({ id: p.id, full: p.full, en: p.en, equipped: p.equipped, identified: p.identified, locked: LOCKED.has(p.id), cursed: ((it.bless | 0) & 127) === 2, tplId: tplOf(p), icon: itemIcon(p) });
    }
    return out;
}
function collectSlotIcon(s) { try { const t = itemById(s.ids[0]); const u = t ? itemIcon(t) : ''; return u || itemIcon({ name: s.name, gfx: s.gfx }); } catch (e) { return ''; } }
function openColl() {
    if (conn && G.inWorld) conn.collect(0);
    if (!TPL_OF.size && conn && G.inWorld) conn.invIds();   // 背包每格的道具編號還沒有：要一次（對得上哪一格要靠它）
    collWin = openCollect({
        state: () => G.collect,
        bag: collectBag,
        slotIcon: collectSlotIcon,
        act: (g, s, objId) => { if (conn && G.inWorld) conn.collect(1, g, s, objId); },
    });
}
function openHunt() {
    if (conn && G.inWorld) conn.huntDex(0);
    huntWin = openHuntDex({
        state: huntState,
        icon: huntIcon,
        act: (r, a) => { if (conn && G.inWorld) { huntPend = r; conn.huntDex(a === 'open' ? 1 : 2, r); } },
    });
}
