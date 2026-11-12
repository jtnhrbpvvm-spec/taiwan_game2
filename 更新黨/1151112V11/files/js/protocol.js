// 跟 L1J 伺服器講話的那一層：切封包、加解密、組／拆各種封包。瀏覽器（WebSocket）跟 Node 測試（TCP）共用。
//   傳輸層只要給 send(Uint8Array)，收到的位元組丟進 feed()；解出來的事件用 on(名稱, fn) 收。
// 線路格式（ClientThread.java）：[長度 uint16 LE，含這 2 bytes][資料]；第一包是伺服器送的 S_INITPACKET（不加密，帶亂數種子）
import { Cipher } from './cipher.js';
import { Reader, Writer } from './packet.js';
import { C, S } from './opcodes.js';
import { markBreak } from './bossbreak.js';
import { OfflineServer } from './offline-server.js';   // 第 388 項（2026-10-28 破甲小標記）

export class L1Connection {
    constructor(send) {
        this._send = send;
        this.cipher = null;
        this.buf = new Uint8Array(0);
        this.handlers = {};
        this.offline = new OfflineServer(this);
        this._wrapOffline();
        this.log = null;   // 除錯：設成 function(dir, opcode, bytes) 就會收到每一包
    }
    on(evt, fn) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); return this; }
    emit(evt, arg) { this.rxAt = performance.now(); (this.handlers[evt] || []).forEach(fn => fn(arg)); (this.handlers['*'] || []).forEach(fn => fn(evt, arg)); }

    feed(chunk) {
        const nb = new Uint8Array(this.buf.length + chunk.length);
        nb.set(this.buf); nb.set(chunk, this.buf.length);
        this.buf = nb;
        while (this.buf.length >= 2) {
            const len = this.buf[0] | (this.buf[1] << 8);
            if (len < 3) { this.emit('error', new Error('封包長度不對：' + len)); this.buf = new Uint8Array(0); return; }
            if (this.buf.length < len) return;
            const data = this.buf.slice(2, len);
            this.buf = this.buf.slice(len);
            if (!this.cipher) {
                if (data[0] !== S.INITPACKET) { this.emit('error', new Error('第一包不是 INITPACKET：' + data[0])); continue; }
                const key = (data[1] | (data[2] << 8) | (data[3] << 16) | (data[4] << 24)) | 0;
                this.cipher = new Cipher(key);
                this.emit('init');
                continue;
            }
            this.cipher.decrypt(data);
            if (this.log) this.log('S', data[0], data);
            this.rxAt = performance.now();   // 最後一次收到伺服器資料（main.js 看太久沒收到就回報）
            try { this.dispatch(new Reader(data)); } catch (e) { try { e.op = data[0]; } catch (x) { } this.emit('error', e); }   // op：哪一種封包出錯（回報用）
        }
    }

    sendPacket(w) {
        const data = w.bytes();
        if (this.log) this.log('C', data[0], data.slice());
        this.cipher.encrypt(data);
        const out = new Uint8Array(data.length + 2);
        const len = data.length + 2;
        out[0] = len & 0xff; out[1] = (len >> 8) & 0xff;
        out.set(data, 2);
        this._send(out);
    }

    // ── 送出 ──────────────────────────────────────
    _wrapOffline() {
        const s = this.offline;
        if (!s) return;
        this.sendPacket = () => {};
        this.clientVersion = () => s.clientVersion();
        this.login = (a, p, m, d) => s.login(a, p, m, d);
        this.commonClick = () => s.commonClick();
        this.createChar = o => s.createChar(o);
        this.enterWorld = name => s.enterWorld(name);
        this.deleteChar = name => s.deleteChar(name);
        this.changeChar = () => s.changeChar();
        this.move = (x, y, h) => s.move(x, y, h);
        this.enterPortal = (x, y) => s.enterPortal(x, y);
        this.changeHeading = h => s.changeHeading(h);
        this.chat = (text, type) => s.chat(text, type);
        this.useItem = (objId, extra) => s.useItem(objId, extra);
        this.boxOpenAll = objId => s.boxOpenAll(objId);
        this.useSkill = (sid, t) => s.useSkill(sid, t);
        this.attack = (id, x, y) => s.attack(id, x, y);
        this.restart = () => s.restart();
        this.npcTalk = id => s.npcTalk(id);
        this.npcAction = (id, act) => s.npcAction(id, act);
        this.npcResult = (id, type, pairs) => s.npcResult(id, type, pairs);
        this.webTeleport = id => s.webTeleport(id);
        this.autoToggle = on => s.autoToggle(on);
        this.autoFocus = id => s.autoFocus(id);
        this.autoSettings = cfg => s.autoSettings(cfg);
        this.autoState = () => s.autoState();
        this.autoLogReset = () => s.autoLogReset();
        this.enhanceBatch = (sc, goal, ids) => s.enhanceBatch(sc, goal, ids);
        this.invIds = () => s.sendInvIds();
        this.gmItem = (id, cnt, en) => s.gmItem(id, cnt, en);
        this.mapNpcs = () => s.mapNpcsReq();
        this.craftList = (npcId, acts) => s.craftList(npcId, acts);
        this.craftMake = (npcId, act, n) => s.craftMake(npcId, act, n);
        this.sellQuery = ids => s.sellQuery(ids);
        this.sellItem = (reqId, objId, qty) => s.sellItem(reqId, objId, qty);
        this.signin = () => s.signin();
        this.dollWear = id => s.dollWear(id);
        this.dollUnwear = () => s.dollUnwear();
        this.dollOpenBag = () => s.dollOpenBag();
        this.dollOpenBox = () => s.dollOpenBox();
        this.dollOpenBag2 = () => s.dollOpenBag2();
        this.dollBuy = n => s.dollBuy(n);
        this.dollSynth = (tier, ids) => s.dollSynth(tier, ids);
        this.dollRegister = id => s.dollRegister(id);
        this.learnMagicList = () => s.learnMagicList();
        this.learnMagic = sid => s.learnMagic(sid);
        this.learnAllMagic = () => s.learnAllMagic();
        this.skillLimitToggle = on => s.skillLimitToggle ? s.skillLimitToggle(on) : null;   // 技能視窗「解除限制」
        this.monthCard = () => s.sendMonthCard();
        this.raiseAttr = k => s.raiseAttr(k);
        this.addBookmark = (n, c) => s.addBookmark(n, c);
        this.bookmarkColor = (n, c) => s.bookmarkColor ? s.bookmarkColor(n, c) : null;
        this.deleteBookmark = n => s.deleteBookmark(n);
        this.deleteItem = id => s.consumeItem(id, 9999999);
        this.dropItem = (x, y, id, cnt) => s.dropItem ? s.dropItem(x, y, id, cnt) : s.consumeItem(id, cnt);   // 丟在腳下（地上撿得回來）
        this.pickUp = (x, y, id, cnt) => s.pickUp ? s.pickUp(x, y, id, cnt) : null;
        this.whisper = (n, t) => s.whisper ? s.whisper(n, t) : null;
        this.keepAlive = () => { this.rxAt = performance.now(); };
        this.autoPing = () => { this.rxAt = performance.now(); };
        this.hello = () => { this.rxAt = performance.now(); };
        this.mapLoaded = () => { this.rxAt = performance.now(); };
        this.webLogout = () => {};
        this.itemLock = (on, id) => s.itemLock ? s.itemLock(on, id) : null;
        this.prefsLoad = () => s.prefsLoad ? s.prefsLoad() : null;
        this.prefsSave = j => s.prefsSave ? s.prefsSave(j) : null;
        this.ranking = () => s.ranking ? s.ranking() : null;
        this.top1Title = t => s.top1Title ? s.top1Title(t) : null;
        this.top1List = () => s.top1List ? s.top1List() : null;
        this.top1Show = on => s.top1Show ? s.top1Show(on) : null;
        this.marketBrowse = (c, st, q, pg) => s.marketBrowse ? s.marketBrowse(c, st, q, pg) : null;
        this.marketDetail = id => s.marketDetail ? s.marketDetail(id) : null;
        this.marketList = (id, cnt, u) => s.marketList ? s.marketList(id, cnt, u) : null;
        this.marketBuy = (id, n) => s.marketBuy ? s.marketBuy(id, n) : null;
        this.marketCancel = id => s.marketCancel ? s.marketCancel(id) : null;
        this.marketMine = () => s.marketMine ? s.marketMine() : null;
        this.marketClaims = () => s.marketClaims ? s.marketClaims() : null;
        this.marketClaim = id => s.marketClaim ? s.marketClaim(id) : null;
        this.marketSummary = () => s.marketSummary ? s.marketSummary() : null;
        this.mail = (act, id) => s.mail ? s.mail(act, id) : null;
        this.charReset = (act, init, fin) => s.charReset ? s.charReset(act, init, fin) : null;
        this.clanInfo = () => s.clanInfo ? s.clanInfo() : null;
        this.createClan = n => s.createClan ? s.createClan(n) : null;
        this.leaveClan = () => s.leaveClan ? s.leaveClan() : null;
        this.title = (n, t) => s.title ? s.title(n, t) : null;
        this.clanRecruit = (a, o) => s.clanRecruit ? s.clanRecruit(a, o) : null;
        this.toiBook = (a, seg) => s.toiBook ? s.toiBook(a, seg) : null;
        this.huntDex = (a, reg) => s.huntDex ? s.huntDex(a, reg) : null;
        this.collect = (a, g, sl, id) => s.collect ? s.collect(a, g, sl, id) : null;
        this.treasure = (a, cell) => s.treasure ? s.treasure(a, cell) : null;
        this.mall = (a, x, y, to) => s.mall ? s.mall(a, x, y, to) : null;
        this.partyRecruit = (a, x) => s.partyRecruit ? s.partyRecruit(a, x) : null;
        this.partyBuff = (a, b) => s.partyBuff ? s.partyBuff(a, b) : null;
        this.friend = (a, x) => s.friend ? s.friend(a, x) : null;
        this.dollReroll = (a, b) => s.dollReroll ? s.dollReroll(a, b) : null;
        this.trialClaim = (lv, pk) => s.trialClaim ? s.trialClaim(lv, pk) : null;
        this.tutorial = (a, st) => s.tutorial ? s.tutorial(a, st) : null;
        this.offlineLog = () => s.offlineLog ? s.offlineLog() : null;
        // 寵物：項圈清單、夥伴清單、寄放（收回項圈）
        this.petCollars = () => s.sendPetCollars ? s.sendPetCollars() : null;
        this.compList = () => s.compList ? s.compList() : null;
        this.compDismiss = id => s.compDismiss ? s.compDismiss(id) : null;
        // 寵物裝備（牙、寵物盔甲）、夥伴的喝水設定、魔法娃娃神話重組
        this.compGear = (id, slot) => s.compGear ? s.compGear(id, slot) : null;
        this.compEquip = (id, itemId) => s.compEquip ? s.compEquip(id, itemId) : null;
        this.compUnequip = (id, slot) => s.compUnequip ? s.compUnequip(id, slot) : null;
        this.compSettings = (id, st) => s.compSettings ? s.compSettings(id, st) : null;
        this.petSettings = (collar, st) => s.petSettings ? s.petSettings(collar, st) : null;
    }

    clientVersion() { this.sendPacket(new Writer(C.CLIENTVERSION).c(0).c(0).d(0)); }      // 伺服器不看內容，回 S_ServerVersion
    login(account, password, mode, dev) { const w = new Writer(C.LOGINPACKET).s(account).s(password); if (mode) { w.c(mode); if (dev) w.s(dev); } this.sendPacket(w); }   // 第 296 項：mode 0x11 登入、0x12 註冊（伺服器 C_AuthLogin）；伺服器第 741 項：後面帶裝置編號
    commonClick() { this.sendPacket(new Writer(C.COMMONCLICK)); }                          // 看完公告／回選角畫面
    createChar(o) {
        this.sendPacket(new Writer(C.NEWCHAR).s(o.name).c(o.type).c(o.sex)
            .c(o.str).c(o.dex).c(o.con).c(o.wis).c(o.cha).c(o.int));
    }
    enterWorld(name) { this.sendPacket(new Writer(C.LOGINTOSERVER).s(name)); }
    deleteChar(name) { this.sendPacket(new Writer(C.DELETECHAR).s(name)); }
    // 台版（ClientLanguage=3）：伺服器拿自己記的座標＋方向算下一格，方向要 XOR 0x49（C_MoveChar.java）
    move(x, y, heading) { this.sendPacket(new Writer(C.MOVECHAR).h(x).h(y).c(heading ^ 0x49)); }
    enterPortal(x, y) { this.sendPacket(new Writer(C.ENTERPORTAL).h(x).h(y)); }   // 站在傳點上進去（站長 2026-11-07「玩家進不去」奇岩地監 2 樓）
    changeHeading(h) { this.sendPacket(new Writer(C.CHANGEHEADING).c(h)); }
    chat(text, type = 0) { this.sendPacket(new Writer(C.CHAT).c(type).s(text)); }
    whisper(name, text) { this.sendPacket(new Writer(C.WHISPER).s(name).s(text)); }   // 悄悄話（對方不在線上伺服器會回訊息）
    // 用道具（C_ItemUSe）：先讀物件編號，再依道具種類讀不同欄位——一般道具 1 byte、強化卷軸要對象道具編號、
    //   瞬間移動卷軸讀地圖＋記憶座標（0＝隨機傳送）、施法道具讀對象＋座標。欄位不夠伺服器會讀到陣列外，所以一律補 0 到夠長；
    //   extra＝(w)=>w 自己寫要帶的欄位
    useItem(objId, extra) { const w = new Writer(C.USEITEM).d(objId); if (extra) extra(w); for (let i = 0; i < 10; i++) w.c(0); this.sendPacket(w); }
    // 記憶座標（原版封包；伺服器 C_AddBookmark／C_DeleteBookmark）：新增記目前位置，能不能記、名稱、個數都是伺服器判斷
    //   第 95 項：名稱後面多帶 C 顏色（0＝白色）、C 動作（0＝新增、1＝改這個名稱的顏色；伺服器存好送回同編號的 S_Bookmarks）。舊伺服器讀完名稱就不管後面
    addBookmark(name, color) { this.sendPacket(new Writer(C.BOOKMARK).s(name).c(color || 0).c(0)); }
    bookmarkColor(name, color) { this.sendPacket(new Writer(C.BOOKMARK).s(name).c(color || 0).c(1)); }
    deleteBookmark(name) { this.sendPacket(new Writer(C.BOOKMARKDELETE).s(name)); }
    dropItem(x, y, objId, count) { this.sendPacket(new Writer(C.DROPITEM).h(x).h(y).d(objId).d(count)); }
    deleteItem(objId) { this.sendPacket(new Writer(C.DELETEINVENTORYITEM).d(objId)); }
    pickUp(x, y, objId, count) { this.sendPacket(new Writer(C.PICKUPITEM).h(x).h(y).d(objId).d(count)); }
    // 施法（C_UseSkill）：技能編號＝列×8＋欄＋1；有對象就帶 物件編號＋座標（沒帶＝不指定對象的魔法）
    useSkill(skillId, t) {
        const w = new Writer(C.USESKILL).c((skillId - 1) >> 3).c((skillId - 1) & 7);
        if (t && t.name != null) w.s(t.name);                // 呼喚盟友／援護盟友：只帶血盟成員的名字（伺服器 C_UseSkill 讀 charName）
        else if (t && t.mapOnly) w.h(t.map || 0).d(t.bm || 0);   // 指定傳送／集體傳送術：記憶座標編號，0＝隨機傳送
        else if (t && t.xyOnly) w.h(t.x).h(t.y);             // 火牢等：只要地面座標
        else if (t) w.d(t.id || 0).h(t.x).h(t.y);
        if (t && t.msg != null) w.s(t.msg);                  // 精準目標：座標後面還讀一段訊息
        this.sendPacket(w);
    }
    changeChar() { this.sendPacket(new Writer(C.CHANGECHAR)); }
    npcTalk(objId) { this.sendPacket(new Writer(C.NPCTALK).d(objId)); }
    // 攻擊（C_Attack，近戰、弓同一包；伺服器照手上武器決定）：對象編號＋對象座標。對象 0＝朝那一格揮一下（強制攻擊點地面）
    attack(objId, x, y) { this.sendPacket(new Writer(C.ATTACK).d(objId).h(x).h(y)); }
    restart() { this.sendPacket(new Writer(C.RESTART)); }   // 死了：回村、復活（C_Restart）
    // NPC 對話框的按鈕：送跟原本對話框一樣的動作字串（伺服器 C_NPCAction；離 NPC 3 格以上伺服器不理，自己的寵物、召喚獸不限距離）
    npcAction(objId, action) { this.sendPacket(new Writer(C.NPCACTION).d(objId).s(action)); }
    // 製作的數量：回答伺服器 S_HowManyMake（伺服器 C_Amount → 配方 executeWithAmount，材料夠不夠照樣由伺服器檢查）
    taxRate(objId, rate) { this.sendPacket(new Writer(C.TAXRATE).d(objId).c(rate)); }   // 第 122 項：城主設稅率（是不是城主、範圍伺服器判斷，不回話）
    npcAmount(objId, n, action) { this.sendPacket(new Writer(C.AMOUNT).d(objId).d(n).c(0).s(action)); }
    // 商店／倉庫（C_Result）：type 0 買（商店清單的序號, 數量）、1 賣（道具編號, 數量）、2 存進個人倉庫、3 從個人倉庫領出（道具編號, 數量）
    npcResult(objId, type, pairs) {
        const w = new Writer(C.RESULT).d(objId).c(type).h(pairs.length);
        for (const [a, n] of pairs) w.d(a).d(n);
        this.sendPacket(w);
    }
    // 狩獵場付費傳送：只送目的地編號，錢、座標、能不能傳都由伺服器判斷（C_Web、data/xml/WebTeleport.xml）
    webTeleport(destId) { this.sendPacket(new Writer(C.WEB).c(1).h(destId)); }
    // 換地圖讀取畫面結束（C_Web 161：地圖、自己的位置；伺服器 web/WebTpSafe 對得上才把傳送後保護縮短；舊伺服器不認、不理）
    mapLoaded(map, x, y) { this.sendPacket(new Writer(C.WEB).c(161).h(map).h(x).h(y)); }
    // AUTO：打怪全部在伺服器跑（web/WebAutoManager），網頁只送開關、設定
    autoToggle(on) { this.sendPacket(new Writer(C.WEB).c(2).c(on ? 1 : 0)); }
    enhanceBatch(scrollId, goal, ids) { const w = new Writer(C.WEB).c(38).d(scrollId).c(goal).h(ids.length); for (const id of ids) w.d(id); this.sendPacket(w); }   // 伺服器第 697 項：一起強化
    // AUTO 開著時點了怪：AUTO 先打這隻（C_Web 27，web/WebAutoManager.focus；舊伺服器不認、不理）
    autoFocus(id) { this.sendPacket(new Writer(C.WEB).c(27).d(id)); }
    autoSettings(s) {
        const w = new Writer(C.WEB).c(3).d(s.potion).c(s.hpPct).h(s.atkSkill).c(s.atkMpPct).h(s.healSkill).c(s.healHpPct).h(s.hpSkill).c(s.hpSkillPct).c(s.flags)
            .c(s.buffs.length);
        for (const b of s.buffs) w.h(b);
        // 後面接著：D 完整旗標、C MP < X% 不補寵物、S 變身形態、H 自動賣出數＋D×N、H 迴避頭目的地圖數＋（H 地圖、C 頭目數＋D×N）×N、
        //   C 寵物數＋（D 項圈、C 自動復活、C 0 返生術／1 復活卷軸、C 自動叫出）×N
        w.d(s.flags).c(s.petMpPct).s(s.poly || '').h(s.sell.length);
        for (const id of s.sell) w.d(id);
        const maps = Object.keys(s.boss).filter(m => s.boss[m].length);
        w.h(maps.length);
        for (const m of maps) { w.h(+m).c(s.boss[m].length); for (const n of s.boss[m]) w.d(n); }
        w.c(s.pets.length);
        for (const p of s.pets) w.d(p.collar).c(p.revive ? 1 : 0).c(p.mode).c(p.summon ? 1 : 0);
        w.c(s.teleSec || 10);   // 幾秒找不到怪就瞬移（旗標 16384 打勾才會）
        // 掛機輔助分頁：C 巡邏範圍（0＝關掉＝整張地圖走；舊伺服器站著）、H 召喚魔法、D 娃娃道具、H 不打名單地圖數＋（H 地圖、C 隻數＋D npc 編號×N）（舊伺服器讀到 teleSec 就停，多送無妨）
        w.c(s.roamRange).h(s.summonSkill).d(s.dollItem);
        const ig = Object.keys(s.ignore).filter(m => s.ignore[m].length);
        w.h(ig.length);
        for (const m of ig) { w.h(+m).c(s.ignore[m].length); for (const n of s.ignore[m]) w.d(n); }
        // 補給頁：C 體力低於幾 % 回村（0＝不回村，1～90）、C 武器損傷時（0 不修、1 磨刀石、2 金幣）——伺服器看不打名單後面還有沒有 byte，一定要送
        w.c(Math.max(0, Math.min(90, s.homeHpPct | 0))).c(s.repairMode == null ? 1 : s.repairMode);
        // 設定頁改版（伺服器本機改動第 63 項）：D 喝水記著的藥水、C 回村記著的 %、H 攻擊／治癒記著的、H 開怪技能（0＝關）、H 開怪記著的、C 開怪魔力 %、
        //   H 範圍技能（0＝關）、H 範圍記著的、C 範圍幾隻、C 範圍魔力 %、C 解毒用什麼（0 照舊、1 翡翠藥水、2 解毒術）——舊伺服器讀到修武器就停，多送無妨
        w.d(s.potKeep | 0).c(Math.max(1, Math.min(90, s.homeKeep | 0 || 30))).h(s.atkKeep | 0).h(s.healKeep | 0).h(s.openSkill | 0).h(s.openKeep | 0).c(s.openMpPct | 0)
            .h(s.aoeSkill | 0).h(s.aoeKeep | 0).c(Math.max(2, Math.min(8, s.aoeCount | 0 || 3))).c(s.aoeMpPct | 0).c(s.cureBy | 0);
        // 第 64 項：H 洗魔魔法記著的、C 洗魔魔力低於幾 %、H 召喚魔法記著的（上一版伺服器讀到解毒就停）
        w.h(s.hpKeep | 0).c(Math.max(1, Math.min(100, s.hpSkillMp | 0 || 90))).h(s.sumKeep | 0);
        // 第 81 項：C 7（有這段）、D 綠水選哪種（40013 自我加速藥水、40018 強化 綠色藥水）（上一版伺服器讀到召喚魔法就停）；解毒選安特之樹枝＝上面的 cureBy 送 3
        w.c(7).d(s.greenPot === 40018 ? 40018 : 40013);
        // 第 81 項：C 8（有這段）、C 魔力低於幾 % 先休息回魔（1～95，沒設過＝30）、C 回到幾 % 再打（比休息的高、最多 100，沒設過＝60）
        const rp = Math.max(1, Math.min(95, s.restMpPct | 0 || 30));
        w.c(8).c(rp).c(Math.max(rp + 1, Math.min(100, s.restMpUp | 0 || 60)));
        // 伺服器第 153 項：C 9（有這段）、C 沒有娃娃時自動召喚的娃娃（0＝關，1～50）、C 選的娃娃（關掉也記得）——上一版伺服器讀到休息回魔就停，多送無妨
        const dl = n => (n | 0) >= 0 && (n | 0) <= 50 ? n | 0 : 0;
        w.c(9).c(dl(s.dollAuto)).c(dl(s.dollKeep));
        // 伺服器第 345 項：C 10（有這段）、D 自動喝哪種經驗藥水（0＝自動，加成高的先喝；47000～47004）——舊伺服器讀到娃娃就停，多送無妨
        const ep = s.expPot | 0;
        w.c(10).d(ep >= 47000 && ep <= 47004 ? ep : 0);
        // 伺服器第 405 項：C 11（有這段）、D 水中自動喝哪種呼吸藥水（49303／41344／40032／40041，沒設過＝40032 伊娃的祝福）——舊伺服器讀到經驗藥水就停，多送無妨
        const bp = s.breathPot | 0;
        w.c(11).d([49303, 41344, 40032, 40041].includes(bp) ? bp : 40032);
        // 伺服器第 440 項：C 12（有這段）、D 戴召喚控制戒指時 AUTO 自動召喚哪隻（npc 編號，0＝沒選：照上次選的）——舊伺服器讀到呼吸藥水就停，多送無妨
        w.c(12).d(s.ringNpc | 0);
        // 伺服器第 539 項：C 13（有這段）、D 自動喝哪種祝福藥水（49904～49907）——舊伺服器讀到戒指召喚就停，多送無妨
        const bl = s.blessPot | 0;
        w.c(13).d(bl >= 49904 && bl <= 49907 ? bl : 49904);
        // 伺服器第 567 項：C 14（有這段）、D 「藍色藥水」那列自動喝哪種（40015 藍色藥水、40736 智慧貨幣；沒設過＝藍色藥水）——舊伺服器讀到祝福藥水就停，多送無妨
        const bu = s.bluePot | 0;
        w.c(14).d(bu === 40736 ? 40736 : 40015);
        this.sendPacket(w);
    }
    // 網頁宣告自己支援到哪一版（1＝AUTO 關著也要伺服器照顧：喝水、補血、輔助、解狀態、寵物）：進世界時送
    hello() { this.sendPacket(new Writer(C.WEB).c(10).c(1)); }
    petCollars() { this.sendPacket(new Writer(C.WEB).c(9)); }
    invIds() { this.sendPacket(new Writer(C.WEB).c(11)); }   // 背包每格是哪種道具（未鑑定的名字看不出來；自動賣出清單用）
    autoState() { this.sendPacket(new Writer(C.WEB).c(4)); }
    autoPing() { this.sendPacket(new Writer(C.WEB).c(5)); }   // AUTO 開著時定時送：伺服器的閒置踢人只看「有沒有收到封包」
    // 傳送到線上玩家身邊：只送對方角色編號，能不能傳、落點都由伺服器判斷（web/WebPlayerList）
    toPlayer(objId) { this.sendPacket(new Writer(C.WEB).c(6).d(objId)); }
    // 管理員視窗（伺服器第 543 項）：1 總覽、2 搜尋（S）、3 封鎖／4 解除（D 角色編號）、5 隱身切換、6 贊助明細、7 金幣報表
    admin(act, q, id) { const w = new Writer(C.WEB).c(254).c(act); if (act === 2) w.s(q || ''); if (act === 3 || act === 4) w.d(id | 0); this.sendPacket(w); }
    // 建立物品指令（站長自訂）的數量視窗：道具編號、數量（誰能用、上限、背包放不放得下都由伺服器判斷）
    //   本機改動第 365 項（站長 2026-10-27）：ench＝選強化值視窗選的 +幾，>0 才在尾端多送 C（舊伺服器讀完數量就停＝+0；新伺服器沒收到＝+0）
    boxOpenAll(objId) { this.sendPacket(new Writer(C.WEB).c(37).d(objId)); }   // 箱子全開（伺服器第 686 項）
    gmItem(itemId, count, ench) { const w = new Writer(C.WEB).c(7).d(itemId).d(count); if (ench > 0) w.c(ench); this.sendPacket(w); }
    // 夥伴（web/WebCompanions）：1 自動喝水設定、2 寄放（收回項圈／解除召喚）、3 要寵物裝備清單（0 武器、1 防具）、4 穿上（背包道具編號）、5 卸下、6 要夥伴清單
    compSettings(id, s) { this.sendPacket(new Writer(C.WEB).c(8).c(1).d(id).c(s.pct).c(s.pot).c(s.green ? 1 : 0).c(s.gmode).h(s.heal || 0)); }   // heal：主人的治癒魔法（0＝喝藥水）
    compDismiss(id) { this.sendPacket(new Writer(C.WEB).c(8).c(2).d(id)); }
    compGear(id, slot) { this.sendPacket(new Writer(C.WEB).c(8).c(3).d(id).c(slot)); }
    compEquip(id, itemObjId) { this.sendPacket(new Writer(C.WEB).c(8).c(4).d(id).d(itemObjId)); }
    compUnequip(id, slot) { this.sendPacket(new Writer(C.WEB).c(8).c(5).d(id).c(slot)); }
    compList() { this.sendPacket(new Writer(C.WEB).c(8).c(6)); }
    // 設定 → 召喚 的寵物卡：照項圈存喝水／加速（C_Web 8-7；收在項圈裡的也能設）。只有 S_Web 11 帶設定的伺服器才送（舊伺服器不認）
    petSettings(collar, s) { this.sendPacket(new Writer(C.WEB).c(8).c(7).d(collar).c(s.pct).c(s.pot).c(s.green ? 1 : 0).c(s.gmode).h(s.heal || 0)); }
    // 餵寵物（C_Web 21＋D 寵物編號，0＝身上全部）：伺服器用背包的食物餵到 100、沒有就自動買；餵不了、吃飽了伺服器自己送系統訊息，沒有回覆封包
    compFeed(id) { this.sendPacket(new Writer(C.WEB).c(21).d(id || 0)); }
    keepAlive() { this.sendPacket(new Writer(C.KEEPALIVE).c(0).c(0).c(0)); }
    // 血盟（原版封包；能不能做、成敗全照伺服器回的訊息）
    createClan(name) { this.sendPacket(new Writer(C.CREATECLAN).s(name)); }
    leaveClan() { this.sendPacket(new Writer(C.LEAVECLAN)); }        // 盟主送＝解散
    banClan(name) { this.sendPacket(new Writer(C.BANCLAN).s(name)); }
    clanRank(name, rank) { this.sendPacket(new Writer(C.RANK).c(1).c(rank).s(name)); }
    title(name, title) { this.sendPacket(new Writer(C.TITLE).s(name).s(title)); }
    // 網頁版血盟（伺服器本機改動）：12＝要血盟資訊（回 S_Web 15）；13＝申請加入（盟主名字，同地圖 3 格內，不必面對面；之後同原版：盟主收「是／否」）
    clanInfo() { this.sendPacket(new Writer(C.WEB).c(12)); }
    // 第 112 項：12 後面多 C 1＝要血盟倉庫紀錄（回 S_Web 15 開頭 0xFFFFFFFF 那種）；舊伺服器不認、回一般血盟資訊（等不到紀錄）
    clanWhLog() { this.sendPacket(new Writer(C.WEB).c(12).c(1)); }
    clanApply(leaderName) { this.sendPacket(new Writer(C.WEB).c(13).s(leaderName)); }
    // 第 111 項：血盟戰爭（原版 C_War：0 宣戰、2 投降、3 結束；盟主才行、對方盟主在線要按「是」都由伺服器判斷）、盟徽（C_Clan 要、C_Emblem 上傳 384 byte）
    clanWar(type, clanName) { this.sendPacket(new Writer(C.WAR).c(type).s(clanName)); }
    emblemReq(clanId) { this.sendPacket(new Writer(C.CLANEMBLEM).d(clanId)); }
    emblemUpload(bytes) { const w = new Writer(C.EMBLEM); for (let i = 0; i < 384; i++) w.c(bytes[i] | 0); this.sendPacket(w); }
    // 狩獵場「此地圖 NPC」：要自己這張地圖有功能的 NPC 清單（回 S_Web 17）；換地圖、打開分頁時送
    mapNpcs() { this.sendPacket(new Writer(C.WEB).c(14)); }
    // 製作工匠：15＝要一隻 NPC 的配方狀態（D NPC、H 動作數＋S 動作×N（照 npcmake.json 那隻的，最多 200 個）；回 S_Web 18）；
    //   16＝製作（D NPC、S 動作、D 數量 1～9999；伺服器先自動做中間物，扣背包再扣倉庫，回 S_Web 19 再照上次的 15 重送 18）
    craftList(npcId, acts) { const w = new Writer(C.WEB).c(15).d(npcId).h(acts.length); for (const a of acts) w.s(a); this.sendPacket(w); }
    craftMake(npcId, act, n) { this.sendPacket(new Writer(C.WEB).c(16).d(npcId).s(act).d(n)); }
    offlineLog() { this.sendPacket(new Writer(C.WEB).c(17)); }   // 要上次離線掛機明細（回 S_Web 20）
    // 重置掛機紀錄（沒有欄位）：伺服器把這段結算（AUTO 開著不停、從現在重新算；關著只清統計），馬上回一包歸零的 S_Web 3；S_Web 3 尾端的功能旗標 bit0＝收這個指令
    autoLogReset() { this.sendPacket(new Writer(C.WEB).c(22)); }
    // 網頁登出（伺服器作廢這個帳號的通行碼，web/WebPass）：按「登出」、選角畫面回登入時，關連線前送
    webLogout() { this.sendPacket(new Writer(C.WEB).c(18)); }
    // 道具賣出（伺服器 web/WebSell，價錢跟地上自動賣出同一套）：19＝問售價（H 筆數＋D 物件編號×N，最多 200；0 筆＝背包全部；回 S_Web 23）；
    //   20＝賣（D 請求編號（每次不同、非 0；同一角色最近 32 個重送不處理）、D 物件編號、D 數量 1～持有量；回 S_Web 24；背包、金幣照原版封包更新）
    sellQuery(ids) { const w = new Writer(C.WEB).c(19).h(ids.length); for (const id of ids) w.d(id); this.sendPacket(w); }
    signin() { this.sendPacket(new Writer(C.WEB).c(23)); }   // 簽到（不帶參數；回 S_Web 28＋一則系統訊息）
    ranking() { this.sendPacket(new Writer(C.WEB).c(25)); }  // 要排行榜（不帶參數；回 S_Web 31，伺服器每 10 分鐘算一次）
    // 新版新手引導（C_Web 26，伺服器 web/WebTutorial）：動作 1 領取（＋C 第幾步）、2 打開過「掉寶」、3 要目前狀態 → 一律回 S_Web 27 新格式
    // 新版新手引導（C_Web 26）：動作 1 領取（＋C 第幾步）、2 打開過掉寶、3 要目前狀態、4 快捷格放了治癒藥水、5 打開了掛機紀錄（4、5：20 步制；舊伺服器當成 3）
    tutorial(action, step) { const w = new Writer(C.WEB).c(26).c(action); if (action === 1) w.c(step); this.sendPacket(w); }
    // 魔法娃娃（dolls.js）：C 動作 1 裝備（接 C 編號）、2 卸下、3 開袋、4 開盒、5 合成（接 C 階、C 隻數 n、n×C 編號，同一種可以重複）、6 重組（接 2×C 編號）
    //   回 S_Web 30 結果＋整包 S_Web 29
    dollRegister(id) { this.sendPacket(new Writer(C.WEB).c(24).c(8).c(id)); }   // 伺服器第 280 項：登入圖鑑（用掉一隻、付手續費）
    dollWear(id) { this.sendPacket(new Writer(C.WEB).c(24).c(1).c(id)); }
    dollUnwear() { this.sendPacket(new Writer(C.WEB).c(24).c(2)); }
    dollOpenBag() { this.sendPacket(new Writer(C.WEB).c(24).c(3)); }
    dollOpenBox() { this.sendPacket(new Writer(C.WEB).c(24).c(4)); }
    dollOpenBag2() { this.sendPacket(new Writer(C.WEB).c(24).c(9)); }   // 開精緻魔法娃娃的袋子（伺服器第 699 項）
    dollSynth(tier, ids) { const w = new Writer(C.WEB).c(24).c(5).c(tier).c(ids.length); for (const id of ids) w.c(id); this.sendPacket(w); }
    dollReroll(a, b) { this.sendPacket(new Writer(C.WEB).c(24).c(6).c(a).c(b)); }
    dollBuy(n) { this.sendPacket(new Writer(C.WEB).c(24).c(7).c(n)); }   // 買魔法娃娃的袋子 n 個（伺服器本機改動第 132 項；超過今天還能買的伺服器只賣到上限）
    sellItem(reqId, objId, qty) { this.sendPacket(new Writer(C.WEB).c(20).d(reqId).d(objId).d(qty)); }
    // 等級試煉獎勵（C_Web 28，伺服器 web/WebTrialGift）：動作 1 收下（C 試煉等級、C 二選一選第幾件，0 起算；全部給的送 0）→ 回 S_Web 32
    trialClaim(lv, pick) { this.sendPacket(new Writer(C.WEB).c(28).c(1).c(lv).c(pick || 0)); }
    // 花金幣學魔法（C_Web 29，伺服器 web/WebLearnMagic，本機改動第 68 項）：動作 1 要清單、2 學（H 技能編號；職業、等級、價錢、金幣都是伺服器判斷）→ 回 S_Web 35
    //   舊伺服器不認 29＝不回，魔法視窗就不顯示學習鈕
    learnMagicList() { this.sendPacket(new Writer(C.WEB).c(29).c(1)); }
    learnMagic(sid) { this.sendPacket(new Writer(C.WEB).c(29).c(2).h(sid)); }
    learnAllMagic() { this.sendPacket(new Writer(C.WEB).c(29).c(3)); }   // 伺服器第 695 項：公測一鍵學魔法
    // 組隊（原版封包；成敗照伺服器回的系統訊息）
    partyInvite(objId) { this.sendPacket(new Writer(C.CREATEPARTY).c(0).d(objId)); }
    partyLeader(objId) { this.sendPacket(new Writer(C.CREATEPARTY).c(3).d(objId)); }
    partyLeave() { this.sendPacket(new Writer(C.LEAVEPARTY)); }
    partyBan(name) { this.sendPacket(new Writer(C.BANPARTY).s(name)); }
    // 排行榜第一名特權（C_Web 31，伺服器 web/WebTop1，本機改動第 102 項）：動作 1 設金色封號（S 封號，空＝拿掉；能不能設由伺服器判斷）、2 要名單 → 回 S_Web 37
    top1Title(text) { this.sendPacket(new Writer(C.WEB).c(31).c(1).s(text)); }
    top1List() { this.sendPacket(new Writer(C.WEB).c(31).c(2)); }
    // 第 167 項：榮耀外顯開關（持有者在榮耀卡上選「野外也全套顯示」；伺服器存著、推新名單給所有人）
    top1Show(on) { this.sendPacket(new Writer(C.WEB).c(31).c(3).c(on ? 1 : 0)); }
    // 交易所（C_Web 32，伺服器 web/WebMarket，本機改動第 109 項）：價錢、數量、能不能上架、金幣、背包放不放得下全由伺服器判斷，一律回 S_Web 38
    //   1 購買清單（C 分類 0 全部／1 武器／2 防具／3 飾品／4 藥水卷軸／5 材料／6 魔法書、C 排序 0 單價低到高／1 最新、S 搜尋字）、2 詳細（D 上架編號）、
    //   3 上架（D 背包物件編號、D 數量、D 單價）、4 購買、5 下架（D 上架編號）、6 我的上架、7 領取清單、8 領取（D 上架編號，0＝全部）、9 概要
    marketBrowse(cat, sort, q, page) { this.sendPacket(new Writer(C.WEB).c(32).c(1).c(cat).c(sort).s(q || '').h(page | 0)); }   // h 第幾頁（伺服器第 761 項；舊伺服器不讀）
    marketDetail(id) { this.sendPacket(new Writer(C.WEB).c(32).c(2).d(id)); }
    marketList(objId, count, unit) { this.sendPacket(new Writer(C.WEB).c(32).c(3).d(objId).d(count).d(unit)); }
    marketBuy(id, n) { const w = new Writer(C.WEB).c(32).c(4).d(id); if (n > 0) w.d(n); this.sendPacket(w); }   // 第 294 項：n＝買幾個（沒帶＝整筆）
    marketCancel(id) { this.sendPacket(new Writer(C.WEB).c(32).c(5).d(id)); }
    marketMine() { this.sendPacket(new Writer(C.WEB).c(32).c(6)); }
    marketClaims() { this.sendPacket(new Writer(C.WEB).c(32).c(7)); }
    marketClaim(id) { this.sendPacket(new Writer(C.WEB).c(32).c(8).d(id || 0)); }
    marketSummary() { this.sendPacket(new Writer(C.WEB).c(32).c(9)); }
    // 信箱（C_Web 33，伺服器 web/WebMail，本機改動第 110 項）：動作 1 要清單、2 打開（D 信件編號）、3 領取（D）、4 全部領取、5 刪除已領取（D，0＝全部）→ 回 S_Web 39
    //   放不放得下、能不能刪都是伺服器判斷；舊伺服器不認 33＝不回
    mail(action, id) { const w = new Writer(C.WEB).c(33).c(action); if (action === 2 || action === 3 || action === 5) w.d(id || 0); this.sendPacket(w); }
    // 回憶蠟燭（C_Web 34，伺服器 web/WebCharReset，本機改動第 113 項）：動作 1 再要一次規則、2 確定（初始 6 項、最後 6 項，順序力量、敏捷、體質、智力、精神、魅力）→ 回 S_Web 40
    //   村莊、蠟燭、冷卻、每一點合不合規則都是伺服器判斷；舊伺服器不認 34＝不回
    charReset(action, init, fin) { const w = new Writer(C.WEB).c(34).c(action); if (action === 2) for (const v of [...init, ...fin]) w.c(v); this.sendPacket(w); }
    // 連續提煉魔石（C_Web 123，伺服器 web/WebBringStone，本機改動第 123 項）：開始（黑魔石道具編號、次數）／停止 → 回 S_Web 123
    //   學會沒有、材料、魔力、施法間隔每一次都是伺服器照原版判斷；舊伺服器不認 123＝不回
    // 怪物剪影大考驗（C_Web 163，伺服器 web/WebSilhouette，本機改動第 163 項）：動作 1 參加、2 作答（C 第幾題、C 選項 0～3）、3 要狀態 → 回 S_Web 163
    // 伺服器第 222 項：商城（0 狀態、1 買 C 商品、2 喇叭 S、3 改密碼 S 舊 S 新、4 偷窺 S 名字、5 更名 S 名字）
    mall(action, a, b, to) { const w = new Writer(C.WEB).c(222).c(action); if (action === 1) { w.c(a).c(b || 1); if (to) w.s(to); } else if (action === 6) w.c(a); else if (action === 3) w.s(a).s(b); else if (action > 1) w.s(a); this.sendPacket(w); }
    itemLock(on, objId) { this.sendPacket(new Writer(C.WEB).c(30).c(on ? 1 : 0).d(objId)); }   // 伺服器第 275 項：道具鎖（1 鎖、0 解）
    build(action, amount) { const w = new Writer(C.WEB).c(253).c(action); if (action === 1) w.d(amount); this.sendPacket(w); }   // 伺服器第 253 項：主城建設（0 狀態、1 捐）
    callGo(id) { this.sendPacket(new Writer(C.WEB).c(237).c(1).d(id)); }   // 伺服器第 237 項：穿雲箭「前往」
    // 伺服器第 596 項：南瓜種植（1 種：D 種子 H x H y、2 看：D 南瓜、3 澆：D 南瓜 D 藥水編號、4 採收：D 南瓜）→ 回 S_Web 96
    pumpkin(action, obj, a = 0, b = 0) { const w = new Writer(C.WEB).c(96).c(action).d(obj); if (action === 1) w.h(a).h(b); else if (action === 3) w.d(a); this.sendPacket(w); }
    treasure(action, cell = 0) { this.sendPacket(new Writer(C.WEB).c(210).c(action).c(cell)); }   // 伺服器第 210 項：寶藏挖掘（0 狀態、1 買圖、2 挖、3 收手）
    // 伺服器第 299 項：玩家設定存到伺服器（prefsync.js；1 要設定、2 存 S JSON）→ 回 S_Web 199。舊伺服器不認＝不理
    // 第 310 項：血盟招募板（伺服器 web/WebClanRecruit）。act 0 清單、1 登錄（o.intro、o.minLv、o.on）、2 申請（o.id）、3 取消申請
    // 伺服器第 534 項：手機推播（0 要狀態＋S endpoint／1 訂閱＋S endpoint S p256dh S auth C 重開 C 被攻擊 C 角色回村／2 取消＋S endpoint）。角色回村 2026-11-10 加，舊伺服器讀到被攻擊就停
    push(act, ep = '', key = '', auth = '', restart = false, pvp = false, village = false) {
        const w = new Writer(C.WEB).c(216).c(act).s(ep || '');
        if (act === 1) w.s(key).s(auth).c(restart ? 1 : 0).c(pvp ? 1 : 0).c(village ? 1 : 0);
        this.sendPacket(w);
    }
    clanRecruit(act, o = {}) {
        const w = new Writer(C.WEB).c(36).c(act);
        if (act === 1) w.s(o.intro || '').c(o.minLv | 0).c(o.on ? 1 : 0);
        else if (act === 2 || act === 3) w.d(o.id | 0);   // 3 取消：伺服器第 532 項起帶血盟編號（0＝全部）
        this.sendPacket(w);
    }
    prefsLoad() { this.sendPacket(new Writer(C.WEB).c(199).c(1)); }
    prefsSave(json) { this.sendPacket(new Writer(C.WEB).c(199).c(2).s(json)); }
    // 伺服器第 703 項（站長 2026-11-07「邀請好友」，invite.js）：C_Web 73＋動作 1 進世界打招呼（S 這台裝置的編號）、2 綁邀請碼（S 碼）、3 全部領取、4 要狀態 → 回 S_Web 73；舊伺服器不認＝不回
    inviteHello(dev) { this.sendPacket(new Writer(C.WEB).c(73).c(1).s(dev || '')); }
    inviteBind(code) { this.sendPacket(new Writer(C.WEB).c(73).c(2).s(code || '')); }
    inviteClaim() { this.sendPacket(new Writer(C.WEB).c(73).c(3)); }
    inviteState() { this.sendPacket(new Writer(C.WEB).c(73).c(4)); }
    // 伺服器第 710 項（站長 2026-11-08「推廣系統」，promo.js）：C_Web 74＋C 動作＋S 參數 JSON（沒有參數＝空字串）→ 回 S_Web 74。
    //   1 要狀態、2 送審 {p,u,shot}、3 兌換 {id,n}、5 要上傳截圖的通行碼、6 領回開服前的推廣碼 {claim}（4 點營火：第二批）
    promo(act, o) { this.sendPacket(new Writer(C.WEB).c(74).c(act).s(o ? JSON.stringify(o) : '')); }
    friend(action, arg) { const w = new Writer(C.WEB).c(217).c(action); if (action === 1) w.s(arg); else if (action === 2) w.d(arg); this.sendPacket(w); }   // 伺服器第 584 項：好友（0 清單、1 加名字、2 刪編號）
    partyRecruit(action, arg = 0) { const w = new Writer(C.WEB).c(215).c(action); if (action === 1) w.c(arg ? 1 : 0); else if (action === 2) w.d(arg); this.sendPacket(w); }   // 伺服器第 517 項：自由招募（0 清單、1 開關、2 加入）
    partyBuff(action, buff = 0) { this.sendPacket(new Writer(C.WEB).c(214).c(action).c(buff)); }   // 伺服器第 513 項：隊伍增益（0 要狀態、1 買一小時；種類 0～4）
    toiBook(action, seg = 0) { this.sendPacket(new Writer(C.WEB).c(192).c(action).c(seg)); }   // 伺服器第 192 項：傲慢之塔圖鑑（0 要狀態、1 開通、2 升級；段 0～8＝11F～91F）
    huntDex(action, reg = 0) { this.sendPacket(new Writer(C.WEB).c(93).c(action).c(reg)); }   // 第 393 項（站長 2026-10-28 狩獵圖鑑）：0 要狀態、1 開通、2 升級；地區 0～9
    // 第 457 項（站長 2026-10-29 裝備蒐藏）：0 要狀態；1 登錄（H 組編號、C 第幾格、D 背包物件編號）→ 回 S_Web 57；舊伺服器不認＝不回
    collect(action, grp = 0, slot = 0, objId = 0) { const w = new Writer(C.WEB).c(57).c(action); if (action === 1) w.h(grp).c(slot).d(objId); this.sendPacket(w); }
    silh(action, q = 0, c = 0) { const w = new Writer(C.WEB).c(163).c(action); if (action === 2) w.c(q).c(c); this.sendPacket(w); }
    bringStone(stone, times) { const w = new Writer(C.WEB).c(123); if (stone) w.c(1).d(stone).h(times); else w.c(2); this.sendPacket(w); }
    // 51 級起的升級點數選一項 +1：原版 C_Attr 479（H 479、C 1、S str／dex／con／int／wis／cha；伺服器驗還有點數、那項 < 35）
    // 月卡（C_Web 35，伺服器 web/WebMonthCard，本機改動第 119 項）：動作 1 要狀態、2 交易所出售分頁的引導按了「否」（記在帳號上）→ 回 S_Web 41；舊伺服器不認 35＝不回
    monthCard(action) { this.sendPacket(new Writer(C.WEB).c(35).c(action)); }   // 動作 3＝測試期免費開通／續約（第 119b 項）
    raiseAttr(key) { this.sendPacket(new Writer(C.ATTR).h(479).c(1).s(key)); }
    // 回答「是／否」視窗（S_Message_YN）：seq＝它帶來的第幾個、type＝種類（97 申請加入血盟、953 邀請組隊）
    answer(seq, type, yes) { this.sendPacket(new Writer(C.ATTR).h(0).d(seq).h(type).h(yes ? 1 : 0)); }

    // ── 收到 ──────────────────────────────────────
    dispatch(r) {
        const op = r.opcode;
        switch (op) {
            case S.SERVERVERSION: return this.emit('serverVersion');
            case S.LOGINRESULT: return this.emit('loginResult', r.c());
            case S.COMMONNEWS: return this.emit('news', r.s());
            case S.CHARAMOUNT: return this.emit('charAmount', { count: r.c(), max: r.c() });
            case S.CHARLIST: return this.emit('charPack', readCharListEntry(r));
            case S.NEWCHARWRONG: return this.emit('createStatus', r.c());
            case S.NEWCHARPACK: return this.emit('newChar', readCharListEntry(r));
            case S.DETELECHAROK: return this.emit('deleteResult', r.c());
            case S.LOGINTOGAME: return this.emit('loginGame');
            case S.BOOKMARKS: return this.emit('bookmark', { name: r.s(), map: r.h(), id: r.d(), color: r.c() });   // 顏色：第 95 項起才有（舊伺服器是補齊的 0＝白色）
            case S.OWNCHARSTATUS: return this.emit('ownStatus', {
                id: r.d(), level: r.c(), exp: r.d(), str: r.c(), int: r.c(), wis: r.c(), dex: r.c(), con: r.c(), cha: r.c(),
                hp: r.h(), maxHp: r.h(), mp: r.h(), maxMp: r.h(), ac: (r.c() << 24) >> 24, time: r.d(), food: r.c(), weight: r.c(),
                lawful: (r.h() << 16) >> 16,
            });
            case S.MAPID: return this.emit('mapId', { map: r.h(), underwater: r.c() });
            case S.CHARPACK: return this.emit('object', readCharPack(r));
            case S.MOVEOBJECT: return this.emit('move', { id: r.d(), x: r.h(), y: r.h(), heading: r.c() });   // x,y＝出發的格子
            case S.REMOVE_OBJECT: return this.emit('remove', r.d());
            case S.CHANGEHEADING: return this.emit('heading', { id: r.d(), heading: r.c() });
            case S.NORMALCHAT: {   // S_ChatPacket：一般(0)、大喊(2) 有物件編號
                const type = r.c(), id = (type === 0 || type === 2 || type === 14) ? r.d() : 0, text = r.s();
                //   大喊(2) 字後面接喊的人的座標 x、y（用戶端拿來標方向）；封包補齊 4 bytes 的 0 不算
                const at = type === 2 && r.left >= 4 ? { x: r.h(), y: r.h() } : null;
                return this.emit('chat', { type, id, text, x: at ? at.x : 0, y: at ? at.y : 0 });
            }
            case S.NPCSHOUT: {   // S_NpcChatPacket：一般(0)、喊叫(2)、全頻(3)；喊叫一樣在字後面接座標（本機改動第 156 項才有，舊伺服器沒有＝0）
                const type = r.c(), id = r.d(), text = r.s();
                const at = type === 2 && r.left >= 4 ? { x: r.h(), y: r.h() } : null;
                return this.emit('chat', { type, id, text, npc: true, x: at ? at.x : 0, y: at ? at.y : 0 });
            }
            case S.GLOBALCHAT: { const type = r.c(); return this.emit('chat', { type, id: 0, text: r.s(), global: true }); }
            case S.WHISPERCHAT: return this.emit('chat', { type: 16, id: 0, text: r.s() + '：' + r.s() });
            case S.SERVERMSG: {
                const id = r.h(), n = r.c(), args = [];
                for (let i = 0; i < n; i++) args.push(r.s());
                return this.emit('serverMsg', { id, args });
            }
            case S.HPUPDATE: return this.emit('hp', { hp: r.h(), maxHp: r.h() });
            case S.MPUPDATE: return this.emit('mp', { mp: r.h(), maxMp: r.h() });
            case S.HPMETER: return this.emit('hpMeter', { id: r.d(), ratio: r.c() });
            case S.TELEPORT: r.c(); r.c(); return this.emit('teleport', r.d());
            case S.CHARVISUALUPDATE: return this.emit('visual', { id: r.d(), weapon: r.c() });
            case S.POLY: return this.emit('poly', { id: r.d(), gfx: r.h(), weapon: r.c() });
            case S.SKILLHASTE: return this.emit('haste', { id: r.d(), type: r.c() });
            case S.SKILLBRAVE: return this.emit('brave', { id: r.d(), type: r.c() });
            case S.LIQUOR: return this.emit('liquor', { id: r.d(), type: r.c() });
            case S.DOACTIONGFX: return this.emit('action', { id: r.d(), action: r.c() });   // 2 受傷、8 死亡、18／19 施法
            // 攻擊：C 動作、D 攻擊者、D 目標、H 傷害（未命中＝0）、C 方向；後面還有 17 bytes 以上＝遠距離（S_UseArrowSkill／S_UseAttackSkill）：
            //   D 序號、H 效果圖（箭、魔法）、C 種類（0 弓箭、6 遠距離魔法、8 範圍）、H 起點 x,y、H 終點 x,y（近戰後面只剩 5 bytes＋補齊）
            case S.ATTACKPACKET: {
                const a = { act: r.c(), atk: r.d(), tgt: r.d(), dmg: r.h(), heading: r.c() };
                if (r.left >= 17) { r.d(); a.gfx = r.h(); a.use = r.c(); a.x = r.h(); a.y = r.h(); a.tx = r.h(); a.ty = r.h(); }
                return this.emit('attack', a);
            }
            // 範圍魔法（S_RangeSkill）：C 動作、D 施法者、H x,y、C 方向（只有一個 byte）、D 序號、H 效果圖、C 種類、H 0、H 目標數＋（D 目標、H 0x20）×N
            //   （原本多讀一個方向 byte，後面全錯一格：寒冰氣息 1804 讀成 2055、目標數亂掉 → 所有範圍魔法畫不出來，2026-10-18 法師魔法測試回報）
            case S.RANGESKILLS: {
                const a = { act: r.c(), atk: r.d(), x: r.h(), y: r.h(), heading: r.c() };
                r.d(); a.gfx = r.h(); a.type = r.c(); r.h();
                const n = r.h(); a.targets = [];
                for (let i = 0; i < n; i++) { a.targets.push(r.d()); r.h(); }
                return this.emit('rangeSkill', a);
            }
            case S.SKILLSOUNDGFX: return this.emit('effect', { id: r.d(), gfx: r.h() });            // 物件身上的效果圖（補血、加速、升級…）
            case S.EFFECTLOCATION: return this.emit('effect', { x: r.h(), y: r.h(), gfx: r.h() });  // 地上某格的效果圖
            case S.TRUETARGET: { const id = r.d(); r.d(); return this.emit('trueTarget', { id, text: r.s() }); }
            case S.INVIS: return this.emit('invis', { id: r.d(), on: r.c() === 1 });
            case S.LIGHT: return this.emit('light', { id: r.d(), size: r.c() });
            case S.RESURRECTION: { const id = r.d(); r.c(); r.d(); return this.emit('resurrect', { id, gfx: r.d() }); }
            case S.CHARTITLE: return this.emit('title', { id: r.d(), title: r.s() });
            // 背包（S_InvList／S_AddItem 一筆的格式相同）
            // 第 411 項：件數只有 1 位元組，舊伺服器背包超過 255 件會溢位（259 → 3）、只讀到前幾件 → 件數讀完後還剩一筆以上（一筆至少 16 位元組，結尾補齊的 0 不到）就接著讀
            case S.INVLIST: { const n = r.c(), list = []; for (let i = 0; i < n || r.left >= 16; i++) list.push(readItem(r)); return this.emit('invList', list); }
            case S.ADDITEM: return this.emit('invAdd', readItem(r));
            case S.DELETEINVENTORYITEM: return this.emit('invDel', r.d());
            // S_ItemStatus／S_ItemAmount：編號、名字、數量，再來 C 狀態長度（0＝未鑑定，鑑定過的接著是能力值）——鑑定卷軸用完靠這個才知道鑑定好了
            case S.ITEMSTATUS: { const u = { id: r.d(), name: r.s(), count: r.d() }; if (r.left > 0) { u.st = statusHex(r); u.identified = u.st ? 1 : 0; } return this.emit('invUpdate', u); }
            case S.ITEMNAME: return this.emit('invUpdate', { id: r.d(), name: r.s() });
            case S.ITEMCOLOR: return this.emit('invUpdate', { id: r.d(), bless: r.c() });   // 祝福／詛咒／封印變了（鑑定、封印時伺服器送）
            // 角色數值
            case S.OWNCHARSTATUS2: return this.emit('stats', { str: r.c(), int: r.c(), wis: r.c(), dex: r.c(), con: r.c(), cha: r.c(), weight: r.c() });
            case S.OWNCHARATTRDEF: return this.emit('stats', { ac: (r.c() << 24) >> 24, fire: r.c(), water: r.c(), wind: r.c(), earth: r.c() });
            case S.SPMR: return this.emit('stats', { spBonus: (r.c() << 24) >> 24, mrBonus: (r.h() << 16) >> 16 });
            // 體魄強健術、力量提升（S_Strup：H 秒數、C 力量、C 負重 0～242、C 加多少）／通暢氣脈術、敏捷提升（S_Dexup：H 秒數、C 敏捷、C 加多少）：
            //   伺服器上了、時間到了都送一次，帶的是加完（或拿掉）之後的值（第 84 項，原本網頁不認、能力頁力量敏捷不會變）
            case S.STRUP: { r.h(); return this.emit('stats', { str: r.c(), weight: r.c() }); }
            case S.DEXUP: { r.h(); return this.emit('stats', { dex: r.c() }); }
            case S.EXP: return this.emit('stats', { level: r.c(), exp: r.d() });
            case S.LAWFUL: { const id = r.d(); return this.emit('lawful', { id, lawful: (r.h() << 16) >> 16 }); }
            case S.PINKNAME: return this.emit('pinkName', { id: r.d(), sec: r.d() });   // S_PinkName：D 角色、D 秒數
            // 學會的魔法：28 個等級各一個位元遮罩（對 skills 表的 skill_level、id）
            //   學新魔法時伺服器只送新的那幾個位元 → 收到的人要跟舊的 OR 起來；DELSKILL 是要拿掉的位元
            case S.ADDSKILL: { r.c(); const masks = []; for (let i = 0; i < 28; i++) masks.push(r.c()); return this.emit('skills', masks); }
            case S.DELSKILL: { r.c(); const masks = []; for (let i = 0; i < 28; i++) masks.push(r.c()); return this.emit('skillsDel', masks); }
            // 多功能封包（S_PacketBox，第一個 byte＝種類）：10 負重（C weight242，拿東西、丟東西、買賣後伺服器馬上送）、11 飽食度（C 0～225）、
            //   56 魔法娃娃召喚（H 秒數 1800）／收回（0）（MagicDoll.useMagicDoll）、15 妖精選好屬性（MSG_ELF，C 1 火／2 水／3 風／4 地）；其他種類先不管
            case S.PACKETBOX: {
                const t = r.c();
                if (t === 10) return this.emit('stats', { weight: r.c() });
                if (t === 11) return this.emit('stats', { food: r.c() });
                if (t === 56) return this.emit('doll', r.h());
                // 44（0x2c）風之枷鎖（S_SkillIconWindShackle：D 角色、H 秒÷4，0＝沒了）：自己、旁邊的人都收到 → 別人的出手速度（main.js objSpeed）；自己看狀態圖示 167
                if (t === 44) return this.emit('windShackle', { id: r.d(), sec: r.h() * 4 });
                if (t === 15) return this.emit('elfMsg', r.c());   // →「忽然全身充滿了○的靈力。」（main.js）
                if (t === 27) return this.emit('rankChanged', r.c());   // 伺服器第 466 項：盟主改了你的階級（MSG_RANK_CHANGED，C 1 見習／2 一般／3 守護騎士）→「你的階級變更為○。」（main.js）
                // 組隊（S_Party.java）：104＝剛加入的人收到整隊（C 隊長以外幾人、隊長（D 編號、S 名字、C 血量、D 地圖、H x、H y）、其他人同格式×N）；
                //   105＝有人加入（D、S、D 地圖、H、H）；106＝換隊長（D 新隊長；伺服器 switch 沒 break，後面黏著一段 110，不讀）；
                //   110＝每 25 秒整隊的位置（C 人數、（D、D 地圖、H、H）×N）。104 的血量伺服器算錯（只有 0／100），血量看 S_HPMeter
                if (t === 104) {
                    const n = r.c(), mem = () => ({ id: r.d(), name: r.s(), hp: r.c(), map: r.d(), x: r.h(), y: r.h() });
                    const leader = mem(), list = [leader];
                    for (let i = 0; i < n && r.left >= 13; i++) list.push(mem());
                    return this.emit('party', { t: 'all', leader: leader.id, list });
                }
                if (t === 105) return this.emit('party', { t: 'add', m: { id: r.d(), name: r.s(), map: r.d(), x: r.h(), y: r.h() } });
                if (t === 106) return this.emit('party', { t: 'leader', id: r.d() });
                if (t === 110) {
                    const n = r.c(), list = [];
                    for (let i = 0; i < n && r.left >= 12; i++) list.push({ id: r.d(), map: r.d(), x: r.h(), y: r.h() });
                    return this.emit('party', { t: 'pos', list });
                }
                return this.emit('unknown', op);
            }
            // 「是／否」視窗（S_Message_YN）：H 0、D 第幾個、H 種類（系統訊息編號）、S 參數（97：申請人名字）
            case S.YESNO: { r.h(); const seq = r.d(), type = r.h(), args = []; while (r.left > 0 && args.length < 3) args.push(r.s()); return this.emit('yesNo', { seq, type, args }); }
            case S.SOUND: r.c(); return this.emit('sound', r.h());
            case S.POISON: return this.emit('poison', { id: r.d(), green: r.c() === 1, gray: r.c() === 1 });
            case S.PARALYSIS: return this.emit('paralysis', r.c());
            case S.CURSEBLIND: return this.emit('curseBlind', r.h());   // 失明：1 只看得到自己、2 看得到周圍、0 解除（main.js 畫暗幕）
            // 後面：H 有沒有資料、H 幾筆、每筆字串（S_NPCTalkReturn）；第 127 項魔法商人的價錢、各增益秒數放這裡；第 148 項派報少年的喊話（最多 120 句＋3 句剛說的，所以收到 128）
            case S.SHOWHTML: { const id = r.d(), html = r.s(), data = []; if (r.left >= 4) { r.h(); const n = r.h(); for (let i = 0; i < n && i < 128 && r.left > 0; i++) data.push(r.s()); } return this.emit('npcHtml', { id, html, data }); }
            // 第 122 項 城主調稅率（S_TaxRate）：舊伺服器只有前三個欄位（後面補的 0 → ext false）
            case S.TAXRATE: {
                const d = { id: r.d(), min: r.c(), max: r.c() };
                d.ext = r.left >= 14 && r.c() === 1;
                if (d.ext) Object.assign(d, { castle: r.c(), rate: r.c(), eff: r.c(), money: r.sd(), town: r.c(), war: r.c() });   // 最後 D 保留（0）
                return this.emit('taxRate', d);
            }
            // S_HowManyMake：D NPC、D 0、D 初始值、D 下限、D 上限、H 0、S "request"、S 動作字串
            //   旅館（S_HowManyKey，第 138 項）同一個封包：D NPC、D 單價、D 下限、D 下限、D 上限、H 0、S 對話檔 "inn2"（房間）／"inn12"（會議廳）、後面是顯示用的字 → html 帶出去分辨
            case S.INPUTAMOUNT: { const id = r.d(); r.d(); r.d(); r.d(); const max = r.d(); r.h(); const html = r.s(); return this.emit('inputAmount', { id, max, html, action: r.s() }); }
            case S.WEB: return this.webPacket(r);
            // 商店賣的東西：D NPC、H 筆數＋（D 序號、H 圖、D 價錢、S 名字（中文；整包賣的帶「 (數量)」）、C 狀態長度＋狀態）×N
            case S.SHOPBUYLIST: {
                const npc = r.d(), n = r.h(), items = [];
                for (let i = 0; i < n; i++) { const it = { order: r.d(), gfx: r.h(), price: r.d(), name: r.s() }; const k = r.c(); for (let j = 0; j < k; j++) r.c(); items.push(it); }
                r.h();   // 0x07 金幣
                return this.emit('shopBuy', { npc, items, tax: r.c() });   // 第 122 項：尾端 C 這家商人現在收的城稅（舊伺服器＝補的 0）
            }
            // 商店收購：D NPC、H 筆數＋（D 身上道具編號、D 收購價）×N
            case S.SHOPSELLLIST: {
                const npc = r.d(), n = r.h(), items = [];
                for (let i = 0; i < n; i++) items.push({ id: r.d(), price: r.d() });
                return this.emit('shopSell', { npc, items });
            }
            // 個人倉庫：D NPC、H 筆數、C 種類（3 個人、5 血盟）＋（D 編號、C 道具 0／武器 1／防具 2、H 圖、C 祝福、D 數量、C 鑑定、S 名字）×N、H 領出手續費（一般道具）
            //   ＋第 124 項：H 武器防具的手續費（舊伺服器沒送＝0、種類一律 0）
            case S.RETRIEVELIST: {
                const npc = r.d(), n = r.h(), kind = r.c(), items = [];
                for (let i = 0; i < n; i++) { const it = { id: r.d() }; it.type = r.c(); it.gfx = r.h(); it.bless = r.c(); it.count = r.d(); it.identified = r.c(); it.name = r.s(); items.push(it); }
                const fee = r.h();
                return this.emit('retrieveList', { npc, kind, items, fee, feeEq: r.h() });
            }
            case S.WAR: return this.emit('clanWar', { type: r.c(), a: r.s(), b: r.s() });
            case S.EMBLEM: { const clanId = r.d(); return this.emit('emblem', { clanId, data: r.u.slice(r.p, r.p + 384) }); }
            case S.DISCONNECT: return this.emit('disconnect');
            case S.RESTART: return this.emit('restart');
            default: return this.emit('unknown', op);
        }
    }
}

// 伺服器本機改動的網頁版專用封包 S_Web：1 AUTO 狀態、2 AUTO 設定、3 掛機紀錄、4 線上玩家清單、5 線上玩家變動、
//   6 自己的狀態（C 旗標：1＝魔法封印；原版沒有封包通知）、7 建立物品指令的搜尋清單、8 夥伴清單、9 寵物裝備清單、10 身上的效果、
//   11 設定頁寵物區塊的項圈清單、12 背包每格的道具編號、13 AUTO 正在打的那隻、14 打死怪拿到的東西、15 血盟資訊、16 負重（目前／最大）、17 此地圖的 NPC、18 製作清單、19 製作結果、
//   20 上次離線掛機明細、21 通行碼（S 通行碼、D 幾秒後過期；角色進世界時發，回來自動登入用：一般登入封包的密碼欄送 PASS_PREFIX＋通行碼）、
//   22 能力頁的實際數值（迴避率、命中／傷害加成、魔攻、魔防、傷害減免、抗性）、23 道具售價、24 賣出結果
//   （欄位順序見伺服器 S_Web.java；2、3、8 在尾端多了欄位）
L1Connection.prototype.webPacket = function (r) {
    const players = () => {
        const n = r.h(), list = [];
        for (let i = 0; i < n; i++) list.push({ id: r.d(), name: r.s(), level: r.c(), type: r.c(), sex: r.c(), map: r.h(), offline: r.c() === 1 });
        return list;
    };
    const t = r.c();
    // card（伺服器第 125 項）：原因後面多一個 C 1＝背包滿了開不了 AUTO、沒月卡（跳月卡引導）；舊伺服器沒有／補齊的 0＝false
    if (t === 1) return this.emit('autoState', { on: r.c() === 1, reason: r.s(), card: r.left >= 1 && r.c() === 1 });

    if (t === 2) {
        const s = { potion: r.d(), hpPct: r.c(), atkSkill: r.h(), atkMpPct: r.c(), healSkill: r.h(), healHpPct: r.c(), hpSkill: r.h(), hpSkillPct: r.c(), flags: r.c(), buffs: [] };
        let n = r.c(); for (let i = 0; i < n; i++) s.buffs.push(r.h());
        s.flags = r.d() | 0; s.petMpPct = r.c(); s.poly = r.s(); s.sell = []; s.boss = {}; s.pets = [];
        n = r.h(); for (let i = 0; i < n; i++) s.sell.push(r.sd());   // 負的＝設成「刪除」（第 119 項）
        n = r.h(); for (let i = 0; i < n; i++) { const m = r.h(), k = r.c(), l = []; for (let j = 0; j < k; j++) l.push(r.d()); s.boss[m] = l; }
        n = r.c(); for (let i = 0; i < n; i++) s.pets.push({ collar: r.d(), revive: r.c() === 1, mode: r.c(), summon: r.c() === 1 });
        s.teleSec = r.c() || 10;   // 幾秒找不到怪就瞬移（舊伺服器沒送＝補齊的 0 → 預設 10）
        // 掛機輔助分頁的四個（至少 9 bytes；舊伺服器只剩補齊的 0～3 個 0）：巡邏範圍、召喚魔法、娃娃道具、不打名單
        s.roamRange = 20; s.summonSkill = 0; s.dollItem = 0; s.ignore = {};
        if (r.left >= 9) {
            s.roamRange = r.c(); s.summonSkill = r.h(); s.dollItem = r.d();
            n = r.h(); for (let i = 0; i < n; i++) { const m = r.h(), k = r.c(), l = []; for (let j = 0; j < k; j++) l.push(r.d()); s.ignore[m] = l; }
        }
        // 補給頁的回村、修武器：C 1（有這兩個；舊伺服器這裡只剩補齊的 0）、C 體力低於幾 % 回村（0＝不回村）、C 武器損傷時（0 不修、1 磨刀石、2 金幣）
        //   沒有＝補給頁不顯示這兩列（hasHome）
        s.homeHpPct = 0; s.repairMode = 1; s.hasHome = false;
        if (r.left >= 3 && r.c() === 1) { s.homeHpPct = r.c(); s.repairMode = r.c(); s.hasHome = true; }
        // 設定頁改版（伺服器本機改動第 63 項）：C 伺服器功能旗標、C 2（有下面這段；舊伺服器沒有／補齊的 0）、D 喝水記著的藥水、C 回村記著的 %、H 攻擊／治癒記著的、
        //   H 開怪技能（0＝關）、H 開怪記著的、C 開怪魔力 %、H 範圍技能（0＝關）、H 範圍記著的、C 範圍幾隻、C 範圍魔力 %、C 解毒用什麼。
        //   沒有（v2 false）＝開怪、範圍那幾列不顯示，記著的值照實際用的推
        s.feat = s.hasHome && r.left >= 1 ? r.c() : 0;
        s.v2 = false;
        if (s.hasHome && r.left >= 22 && r.c() === 2) {
            Object.assign(s, { potKeep: r.d(), homeKeep: r.c(), atkKeep: r.h(), healKeep: r.h(), openSkill: r.h(), openKeep: r.h(), openMpPct: r.c(),
                aoeSkill: r.h(), aoeKeep: r.h(), aoeCount: r.c(), aoeMpPct: r.c(), cureBy: r.c(), v2: true });
        } else {
            Object.assign(s, { potKeep: s.potion || 40010, homeKeep: s.homeHpPct || 30, atkKeep: s.atkSkill, healKeep: s.healSkill, openSkill: 0, openKeep: 0, openMpPct: 50,
                aoeSkill: 0, aoeKeep: 0, aoeCount: 3, aoeMpPct: 50, cureBy: 0 });
        }
        // 第 64 項：C 3（有下面這段）、H 洗魔魔法記著的、C 洗魔魔力低於幾 %、H 召喚魔法記著的；沒有（v3 false）＝魔力門檻那條不顯示（伺服器固定 90%），記著的照實際用的推
        s.v3 = false;
        if (s.v2 && r.left >= 6 && r.c() === 3) Object.assign(s, { hpKeep: r.h(), hpSkillMp: r.c(), sumKeep: r.h(), v3: true });
        else Object.assign(s, { hpKeep: s.hpSkill, hpSkillMp: 90, sumKeep: s.summonSkill });
        // 第 81 項：C 4（有下面這段）、D 綠水選哪種；沒有（v4 false）＝綠水固定自我加速藥水、解毒不列安特之樹枝
        s.v4 = false;
        if (s.v3 && r.left >= 5 && r.c() === 4) Object.assign(s, { greenPot: r.d(), v4: true });
        else s.greenPot = 40013;
        // 第 81 項：C 5（有下面這段）、C 魔力低於幾 % 先休息回魔、C 回到幾 % 再打；沒有（v5 false）＝不顯示拉條
        s.v5 = false;
        if (s.v4 && r.left >= 3 && r.c() === 5) Object.assign(s, { restMpPct: r.c(), restMpUp: r.c(), v5: true });
        else Object.assign(s, { restMpPct: 30, restMpUp: 60 });
        // 第 153 項：C 6（有下面這段）、C 沒有娃娃時自動召喚的娃娃（0＝關）、C 選的娃娃；沒有（v6 false，舊伺服器）＝召喚頁不列這一行
        s.v6 = false;
        if (s.v5 && r.left >= 3 && r.c() === 6) Object.assign(s, { dollAuto: r.c(), dollKeep: r.c(), v6: true });
        else Object.assign(s, { dollAuto: 0, dollKeep: 0 });
        // 第 345 項：C 7（有下面這段）、D 自動喝哪種經驗藥水（0＝自動）；沒有（v7 false，舊伺服器）＝經驗藥水那列不列圖示框
        s.v7 = false;
        if (s.v6 && r.left >= 5 && r.c() === 7) Object.assign(s, { expPot: r.d(), v7: true });
        else s.expPot = 0;
        // 第 405 項：C 8（有下面這段）、D 水中自動喝哪種呼吸藥水；沒有（v8 false，舊伺服器）＝水中呼吸那列不列圖示框
        s.v8 = false;
        if (s.v7 && r.left >= 5 && r.c() === 8) Object.assign(s, { breathPot: r.d(), v8: true });
        else s.breathPot = 40032;
        // 第 440 項：C 9（有下面這段）、D 戴召喚控制戒指時自動召喚哪隻（0＝沒選）；沒有（v9 false，舊伺服器）＝召喚頁不列那一行
        s.v9 = false;
        if (s.v8 && r.left >= 5 && r.c() === 9) Object.assign(s, { ringNpc: r.d(), v9: true });
        else s.ringNpc = 0;
        // 伺服器第 446 項：C 10（有下面這段）、H 自動賣出清單最多幾種；沒有（v10 false，舊伺服器）＝上限 100、狩獵頁不列「離線掛機效率太低就停」
        s.v10 = false;
        if (s.v9 && r.left >= 3 && r.c() === 10) Object.assign(s, { maxSell: r.h(), v10: true });
        else s.maxSell = 100;
        // 伺服器第 455 項：C 11（沒有內容）＝認得「盟戰時主動攻擊敵對血盟」（旗標 16777216）；沒有（v11 false，舊伺服器）＝狩獵頁不列那一行
        s.v11 = !!(s.v10 && r.left >= 1 && r.c() === 11);
        // 伺服器第 464 項：C 12（沒有內容）＝認得「寵物連續死亡 3 次，停 10 分鐘再復活」（旗標 33554432）；沒有（v12 false，舊伺服器）＝夥伴視窗不列那一行
        s.v12 = !!(s.v11 && r.left >= 1 && r.c() === 12);
        // 伺服器第 474 項：C 13、C 互斥組數、（C 組內幾個、（H 技能編號、C 強度）×N）×組數（WebBuffClash；網頁不另存一份）；沒有（舊伺服器）＝輔助魔法勾選不互斥
        s.clash = null;
        if (s.v12 && r.left >= 2 && r.c() === 13) {
            const n = r.c(), g = [];
            for (let i = 0; i < n && r.left >= 1; i++) { const k = r.c(), m = []; for (let j = 0; j < k && r.left >= 3; j++) m.push({ id: r.h(), pw: r.c() }); g.push(m); }
            s.clash = g;
        }
        // 伺服器第 477 項：C 14（沒有內容）＝認得「水中幫寵物用伊娃的祝福」（旗標 67108864）；沒有（v14 false，舊伺服器）＝夥伴視窗不列那一行
        s.v14 = !!(s.clash && r.left >= 1 && r.c() === 14);
        // 伺服器第 482 項：C 15（沒有內容）＝認得「進化果實／勝利果實選寵物吃」（C_ItemUSe 帶寵物編號）；沒有（舊伺服器會把進化果實吃掉）＝果實先不讓用（fruit.js）
        s.v15 = !!(s.v14 && r.left >= 1 && r.c() === 15);
        // 伺服器第 539 項：C 16、D 自動喝哪種祝福藥水；沒有（v16 false，舊伺服器）＝補給頁不列祝福藥水那一行
        s.v16 = false;
        if (s.v15 && r.left >= 5 && r.c() === 16) Object.assign(s, { blessPot: r.d(), v16: true });
        else s.blessPot = 49904;
        // 伺服器第 567 項：C 17、D 「藍色藥水」那列自動喝哪種（40015 藍色藥水／40736 智慧貨幣）；沒有（v17 false，舊伺服器）＝那列照原本、不放圖示框
        s.v17 = false;
        if (s.v16 && r.left >= 5 && r.c() === 17) Object.assign(s, { bluePot: r.d(), v17: true });
        else s.bluePot = 40015;
        // 伺服器第 686 項：C 18（沒有內容）＝認得「箱子全開」（C_Web 37）；沒有（v18 false，舊伺服器）＝守護團獎金箱子照原本一次開一個
        s.v18 = !!(s.v17 && r.left >= 1 && r.c() === 18);
        // 伺服器第 688 項：C 19（沒有內容）＝認得「沒藥水時先喝身上其他藥水」的勾、月卡古代白水自動買；沒有（v19 false，舊伺服器）＝補給頁不列那個勾、選單不放古代白水
        s.v19 = !!(s.v18 && r.left >= 1 && r.c() === 19);
        return this.emit('autoSettings', s);
    }
    if (t === 3) {
        const g = { start: r.d(), dur: r.d(), offline: r.d(), kills: r.d(), exp: r.d(), died: r.c() === 1, reason: r.s(), items: [] };
        const n = r.h(); for (let i = 0; i < n; i++) g.items.push({ name: r.s(), count: r.d(), gfx: 0, bless: 1, attrKey: '' });
        g.gold = r.d(); g.levels = r.c(); g.map = r.h();
        if (r.left > 0) { const k = r.h(); for (let i = 0; i < k; i++) { const v = r.h(); if (g.items[i]) g.items[i].gfx = v; } }   // 道具圖示編號（順序同上；0＝查不到；舊伺服器沒這段＝全部 0）
        if (r.left > 0) readItemGlow(r, g.items);   // 每件的祝福／屬性（舊伺服器沒這段＝全部一般；同名不同祝福狀態是不同筆）
        g.resetOk = (r.c() & 1) === 1;   // C 功能旗標，bit0＝伺服器收 C_Web 22（重置掛機紀錄）；舊伺服器這裡是補齊的 0 或沒有＝不顯示重置鈕
        g.net = readGoldNet(r);   // 實賺明細（舊伺服器沒有＝null）
        // 伺服器第 265 項：用掉的道具（H 件數＋（S 名字、D 個數、H 圖示）×N，同離線掛機）；舊伺服器沒有＝null（不顯示那一區）
        g.used = null;
        if (g.net && r.left >= 2) { g.used = []; const u = r.h(); for (let i = 0; i < u && r.left > 0; i++) g.used.push({ name: r.s(), count: r.d(), gfx: r.h(), bless: 1, attrKey: '' }); }
        g.petUsed = g.used ? readPetUsed(r) : [];   // 伺服器第 463 項：夥伴用掉的
        return this.emit('autoLog', g);
    }
    if (t === 4) return this.emit('players', { full: true, list: players(), removed: [] });
    if (t === 5) {
        const list = players(), n = r.h(), removed = [];
        for (let i = 0; i < n; i++) removed.push(r.d());
        return this.emit('players', { full: false, list, removed });
    }
    if (t === 6) return this.emit('status', { silenced: (r.c() & 1) === 1 });
    if (t === 7) {
        const d = { kw: r.s(), ask: r.c() === 1, count: r.d(), total: r.h(), list: [] };
        const n = r.h(); for (let i = 0; i < n; i++) d.list.push({ id: r.d(), name: r.s(), gfx: r.h(), bless: r.c(), ench: 0 });
        // 本機改動第 365 項：尾端 H 件數＋C 強化上限×N（順序同清單；0＝不能選）。舊伺服器沒有或只有補齊的 0＝全部 0（照舊跳數量視窗）
        if (r.left >= 2) { const m = r.h(); for (let i = 0; i < m && r.left > 0; i++) { const e = r.c(); if (d.list[i]) d.list[i].ench = e; } }
        return this.emit('itemPick', d);
    }
    if (t === 8) {   // 夥伴清單（有變才送）
        const n = r.h(), list = [];
        for (let i = 0; i < n; i++) list.push({ id: r.d(), kind: r.c(), name: r.s(), tname: r.s(), gfx: r.h(), lv: r.c(), hp: r.d(), mhp: r.d(), mp: r.d(), mmp: r.d(),
            wpn: r.s(), arm: r.s(), pct: r.c(), pot: r.c(), green: r.c() === 1, gmode: r.c() });
        const canHaste = r.c() === 1, k = r.h();
        for (let i = 0; i < k && i < n; i++) list[i].heal = r.h();
        // 再後面：每隻現在的態勢（原版寵物選單：1 攻擊、2 防禦、3 休息、4 散開、5 警戒）；舊伺服器沒送＝讀到 0 筆，不標
        const m = r.h();
        for (let i = 0; i < m && i < n; i++) list[i].st = r.c();
        // 再後面：每隻的飽食度（寵物 0～100；不是寵物的 255）；舊伺服器沒送＝讀到 0 筆，不顯示飽食度和餵食鈕
        const fn = r.h();
        for (let i = 0; i < fn && i < n; i++) { const f = r.c(); if (f !== 255) list[i].food = f; }
        // 再後面（伺服器本機改動第 83 項③）：每隻的項圈編號（寵物；召喚類 0）——夥伴視窗把叫出來的寵物對到項圈清單（S_Web 11）；舊伺服器沒送＝讀到 0 筆
        const cn = r.h();
        for (let i = 0; i < cn && i < n; i++) list[i].collar = r.d();
        // 再後面（伺服器本機改動第 96 項）：每隻還剩幾秒（召喚、精靈、迷魅、造屍；寵物等沒時限的 -1）→ endAt＝這台的 performance.now 到期時間，夥伴視窗自己倒數；舊伺服器沒送＝沒有 endAt
        const tn = r.h(), at = performance.now();
        for (let i = 0; i < tn && i < n; i++) { const v = r.sd(); if (v >= 0) list[i].endAt = at + v * 1000; }
        // 再後面（伺服器第 626 項，站長 2026-11-03「寵物介面新增可以看到寵物的經驗值」）：每隻的經驗 %（寵物 0～100；不是寵物 255）；舊伺服器沒送＝讀到 0 筆
        if (r.left >= 2) { const en = r.h(); for (let i = 0; i < en && i < n && r.left > 0; i++) { const e = r.c(); if (e !== 255) list[i].exp = e; } }
        return this.emit('companions', { list, canHaste });
    }
    if (t === 9) {   // 寵物裝備清單：背包裡這一格能穿的
        const d = { id: r.d(), slot: r.c(), cur: r.s(), items: [] };
        const n = r.h(); for (let i = 0; i < n; i++) d.items.push({ id: r.d(), name: r.s(), gfx: r.h() });
        return this.emit('compGear', d);
    }
    if (t === 10) {   // 身上的效果（有增減、時間被刷新才送）：效果編號（L1SkillId）、剩幾秒（-1＝沒時限）
        const n = r.h(), list = [];
        for (let i = 0; i < n; i++) list.push({ id: r.h(), sec: r.d() | 0 });
        return this.emit('effects', list);
    }
    if (t === 11) {   // 背包裡有寵物的項圈（state 0 收在項圈、1 在身邊、2 死了）：設定 → 召喚 每隻寵物一張卡
        const n = r.h(), list = [];
        for (let i = 0; i < n; i++) list.push({ collar: r.d(), name: r.s(), tname: r.s(), gfx: r.h(), lv: r.c(), hp: r.d(), mhp: r.d(), state: r.c() });
        // 2026-10-20 尾端：C 1＋每隻的喝水／加速設定（同 S_Web 8 那幾個欄位）＝伺服器收 C_Web 8-7（照項圈存）；舊伺服器這裡是補齊的 0 或沒有 → list.ext＝false
        list.ext = r.c() === 1;
        if (list.ext) for (const x of list) Object.assign(x, { pct: r.c(), pot: r.c(), green: r.c() === 1, gmode: r.c(), heal: r.h() });
        return this.emit('petCollars', list);
    }
    if (t === 13) return this.emit('autoTarget', r.d());   // AUTO 正在打的那隻（換了才送；0＝沒有）
    if (t === 16) return this.emit('stats', { wCur: r.d(), wMax: r.d() });   // 負重：目前重量、最大負重（同一種單位；進世界送一次、之後有變才送）→ 背包上方的負重條
    if (t === 14) {   // 打死怪拿到的東西（已經直接進背包）：怪的座標、每件的圖示編號、數量、名字
        const d = { x: r.h(), y: r.h(), items: [] }, n = r.h();
        for (let i = 0; i < n; i++) d.items.push({ gfx: r.h(), count: r.d(), name: r.s() });
        return this.emit('loot', d);
    }
    // 15 血盟資訊（進世界 2 秒內、之後有變才推；C_Web 12 要也會回）：D 血盟編號（0＝沒有血盟，後面不帶）、S 血盟名、S 盟主名、C 自己的階級、
    //    H 人數＋（S 名字、C 階級 1 見習／2 一般／3 守護騎士／4 盟主、C 在線、C 等級、C 職業、S 封號）×N（盟主第一、再線上、再階級高到低）
    if (t === 15) {
        const id = r.d();
        // 第 112 項：開頭 D 0xFFFFFFFF＝血盟倉庫紀錄（C_Web 12 動作 1 要才回）：C 1、C 狀態（0 有清單、1 還沒開放、2 不是血盟成員）、D 伺服器現在（epoch 秒）、
        //   H 筆數＋（D 時間、S 角色、C 1 存／2 取、D 道具編號、H 圖示、S 名字（同倉庫清單）、D 數量）×N，新到舊
        if (id === 0xFFFFFFFF) {
            if (r.c() !== 1) return;
            const d = { status: r.c(), now: r.d(), list: [] }, n = r.h();
            for (let i = 0; i < n && r.left >= 4; i++) d.list.push({ sec: r.d(), who: r.s(), act: r.c(), id: r.d(), gfx: r.h(), name: r.s(), count: r.d() });
            return this.emit('clanWhLog', d);
        }
        if (!id) return this.emit('clanInfo', r.left > 0 && r.c() === 1 ? { id: 0, ext: true } : { id: 0 });   // 第 111 項：C 1＝伺服器有盟徽、戰爭這些（舊伺服器沒有）
        const c = { id, name: r.s(), leader: r.s(), rank: r.c(), members: [] };
        const n = r.h();
        for (let i = 0; i < n; i++) c.members.push({ name: r.s(), rank: r.c(), online: r.c() === 1, level: r.c(), type: r.c(), title: r.s() });
        // 第 111 項尾端（舊伺服器沒有）：C 1、H 人數上限（盟主不在線 0）、C 血盟倉庫 0 能用／1 見習／2 沒封號／3 未滿 5 級、C 有盟徽、
        //   C 戰爭數＋（S 對方、C 1 攻城／2 血盟戰爭）×N、H 其他血盟數＋（S 名字、S 盟主、C 盟主在線、H 人數）×N
        if (r.left > 0 && r.c() === 1) {
            c.ext = true; c.cap = r.h(); c.wh = r.c(); c.emblem = r.c() === 1; c.wars = []; c.clans = [];
            const w = r.c(); for (let i = 0; i < w; i++) c.wars.push({ name: r.s(), type: r.c() });
            const k = r.h(); for (let i = 0; i < k; i++) c.clans.push({ name: r.s(), leader: r.s(), online: r.c() === 1, n: r.h() });
            // 第 455 項尾端（舊伺服器沒有）：C 2、C 戰爭數（同上、同順序）＋（D 剩幾秒（-1＝沒有時限：攻城戰、伺服器規則關掉時開的）、
            //   H 我方分數、H 對方分數、H 我方擊殺、H 對方擊殺、H 我方在線、H 對方在線）×N → 每場 w.end（結束的本機時間，0＝沒有時限）、w.sc＝[我方分, 對方分, 我方擊殺, 對方擊殺, 我方在線, 對方在線]
            if (r.left >= 2 && r.c() === 2) {
                const n2 = r.c(), now = Date.now();
                for (let i = 0; i < n2 && r.left >= 16; i++) {
                    const sec = r.sd(), sc = [r.h(), r.h(), r.h(), r.h(), r.h(), r.h()];
                    if (c.wars[i]) Object.assign(c.wars[i], { end: sec >= 0 ? now + sec * 1000 : 0, sc });
                }
                // 伺服器第 466 項尾端（舊伺服器沒有）：C 3、H 其他血盟數（同上面的其他血盟、同順序）＋（C 1＝正在跟別的血盟打仗）×N → c.clans[i].war（宣戰清單標「交戰中」）
                if (r.left >= 3 && r.c() === 3) {
                    const n3 = r.h();
                    for (let i = 0; i < n3 && r.left >= 1; i++) { const f = r.c(); if (c.clans[i]) c.clans[i].war = f === 1; }
                }
            }
        }
        return this.emit('clanInfo', c);
    }
    // 17 此地圖的 NPC（C_Web 14 要才回）：H 地圖、H 筆數＋（D 物件編號、H 外型、H x、H y、S 名字（「$1897」名字編號））×N
    if (t === 17) {
        const d = { map: r.h(), list: [] }, n = r.h();
        for (let i = 0; i < n; i++) d.list.push({ id: r.d(), gfx: r.h(), x: r.h(), y: r.h(), name: r.s() });
        return this.emit('mapNpcs', d);
    }
    // 18 配方狀態（C_Web 15 要、製作完重送）：D NPC、C 倉庫有沒有算（1＝有；5 級以上、沒設倉庫密碼才算，0＝倉庫數一律 0）、H 配方數＋
    //    （S 動作、C 條件 0 可以做／1 條件不符／2 這隻沒有這個配方、C 旗標 1＝可以一次做多個／2＝照原本對話框流程（任務、傳送類：一次一個、只算背包、不先做中間物）、
    //     D 現在做得出幾個（最多 9999，已算進先做中間物）、H 成品數＋（D 道具、D 數量）×N、H 材料數＋（D 道具、D 做一個要幾個、D 背包有、D 倉庫有、C 0 夠／1 可以先做出來／2 缺）×N、
    //     H 缺料數＋（D 最底層道具、D 還缺幾個；金幣也算）×N）×N
    if (t === 18) {
        const d = { npc: r.d(), wh: r.c() === 1, recipes: [] }, n = r.h();
        for (let i = 0; i < n; i++) {
            const x = { act: r.s(), cond: r.c(), flags: r.c(), max: r.d(), outs: [], mats: [], lack: [] };
            let k = r.h(); for (let j = 0; j < k; j++) x.outs.push({ id: r.d(), n: r.d() });
            k = r.h(); for (let j = 0; j < k; j++) x.mats.push({ id: r.d(), need: r.d(), inv: r.d(), wh: r.d(), st: r.c() });
            k = r.h(); for (let j = 0; j < k; j++) x.lack.push({ id: r.d(), n: r.d() });
            d.recipes.push(x);
        }
        return this.emit('craftList', d);
    }
    if (t === 19) return this.emit('craftDone', { res: r.c(), n: r.d(), msg: r.s() });   // 製作結果：C 0 做好了／1 沒做成／2 照原本流程送出了、D 做了幾個、S 沒做成的原因
    // 20 上次離線掛機明細（C_Web 17 要、或登入時伺服器推還沒看過的；線上 AUTO 不會蓋掉）：C 有沒有（0＝沒有，後面不送）、C 1＝登入推的還沒看過、
    //    D 開始、D 結束（epoch 秒）、D 擊殺、D 經驗、D 金幣、C 升級、H 地圖、C 死亡次數、H 逃跑次數、C 回村次數、S 結束原因、
    //    H 撿到件數＋（S 名字、D 數量、H 圖示）×N、H 用掉件數＋（同上）×N、（新）撿到的每件的祝福、屬性（readItemGlow）、
    //    （2026-10-19）別隻角色的才有：C 1＋S 那隻的名字 → d.other（同帳號只能離線掛機一隻：登入這隻、上一隻被停掉時，伺服器跟在自己那包後面再送一包）。
    //    自己的沒有這段（只有補齊 4 bytes 的 0）。
    //    再後面（2026-10-19 新伺服器）：上面那個 C 一律送（自己的＝0），接著實賺明細（readGoldNet）→ d.net
    if (t === 20) {
        if (r.c() !== 1) return this.emit('offlineLog', null);
        const d = { fresh: r.c() === 1, start: r.d(), end: r.d(), kills: r.d(), exp: r.d(), gold: r.d(), levels: r.c(), map: r.h(),
            deaths: r.c(), escapes: r.h(), towns: r.c(), reason: r.s(), loot: [], used: [] };
        for (const k of ['loot', 'used']) { const n = r.h(); for (let i = 0; i < n; i++) d[k].push({ name: r.s(), count: r.d(), gfx: r.h(), bless: 1, attrKey: '' }); }
        if (r.left > 0) readItemGlow(r, d.loot);   // 撿到的每件的祝福／屬性（用掉的沒有）
        if (r.left >= 2 && r.c() === 1) d.other = r.s();
        d.net = readGoldNet(r);
        d.petUsed = d.net ? readPetUsed(r) : [];   // 伺服器第 463 項：夥伴用掉的
        return this.emit('offlineLog', d);
    }
    if (t === 21) return this.emit('pass', { token: r.s(), ttl: r.d() });
    if (t === 42) return this.emit('loginQueue', r.d());   // 伺服器第 549 項：登入排隊第幾位（0＝輪到了）
    // 23 道具售價（C_Web 19 的回答）：H 筆數＋（D 物件編號、D 一個賣多少（0＝不能賣）、C 原因）×N
    //    原因：0 可以賣、1 沒有商店收、2 穿在身上、3 封印、4 項圈裡有寵物、5 魔法娃娃叫出來了、6 背包裡沒有這件、11 強化過的（原版商店不收）
    if (t === 23) {
        const n = r.h(), list = [];
        for (let i = 0; i < n; i++) list.push({ id: r.d(), price: r.d(), reason: r.c() });
        return this.emit('sellInfo', list);
    }
    // 24 賣出結果（C_Web 20 的回答）：D 請求編號、C 結果、D 物件編號、D 賣了幾個、D 得到金幣、S 給玩家看的一句
    //    結果：0 賣出（伺服器另外送一行系統訊息）、1～6、11 同售價的原因、7 數量不對、8 金幣會超過 20 億、9 同一個請求編號重送（訊息空的）、10 現在不能賣（死亡、交易中、開個人商店）
    if (t === 24) return this.emit('sellResult', { req: r.d(), res: r.c(), id: r.d(), sold: r.d(), gold: r.d(), msg: r.s() });
    // 22 能力頁的實際數值（伺服器 web/WebStats：進世界送一次、之後有變才送）：H 欄位數 N＋有號 H×N，順序（只會往後加；舊伺服器不送、新欄位舊網頁多讀不到也沒關係）：
    //    0 迴避率；1～4 近命中／近傷害／遠命中／遠傷害加成（效果、道具）；5～8 原始能力加成（同順序）；9～12 防具命中／傷害／遠命中／遠傷害；
    //    13 魔攻；14 魔法命中；15 傷害減免；16 魔法防禦；17～20 火／水／風／地抗性；
    //    （伺服器第 84 項起）21 防禦；22～27 力量／敏捷／體質／智力／精神／魅力（最終值，含魔法效果）；28～29 自然回血一次最少／最多；30 自然回魔一次；
    //    （第 171 項）31 祝福值（0～100，含祝福藥水）；32 穿著的祝福裝備件數（calc.js blessStat）
    //    → 防禦、六項能力直接蓋掉 G.st 的（保護罩、體魄強健術…原本只送狀態圖示或 S_Strup，畫面上的數字不會變）
    if (t === 22) {
        const n = Math.min(r.h(), Math.floor(r.left / 2)), v = [];
        for (let i = 0; i < n; i++) v.push((r.h() << 16) >> 16);
        const o = { real: v };
        if (v.length > 27) Object.assign(o, { ac: v[21], str: v[22], dex: v[23], con: v[24], int: v[25], wis: v[26], cha: v[27] });
        return this.emit('stats', o);
    }
    // 25 強化全服廣播（有人強化到安定值 +3 以上成功、或衝到那條線時消失；送給所有線上玩家，包含他自己。S_Web 22 是能力頁真數值）：
    //    S 玩家名字、S 道具名字碼（「$70」，用 names.json 轉）、S 道具名字（樣板中文名，碼轉不出來時用）、C 0 成功／1 裝備消失、
    //    C 原本的強化值（有號）、C 成功＝強化後的值／消失＝這一下要衝的值（原本＋1）、C 祝福 0 祝福／1 一般／2 詛咒、C 安定值、H 圖示編號
    if (t === 25) {
        const name = r.s(), code = r.s(), itemName = r.s(), fail = r.c() === 1;
        const en0 = (r.c() << 24) >> 24, en1 = (r.c() << 24) >> 24, bless = r.c(), safe = r.c(), icon = r.h();
        return this.emit('enhBroadcast', { name, code, itemName, fail, en0, en1, bless, safe, icon });
    }
    // 27 新手任務卡（進世界送一次、有變再送；newbie.js）：C 完成的 bitmask 低 8 位（0xFF＝畢業）、C 目前第幾步（1～8；0＝不參加或已畢業）、S 這一步要做什麼、S 獎勵文字、
    //    H 進度目前、H 進度目標（只有第 2 步 AUTO 秒數、第 6 步離線分鐘會用，其他 0、0＝不畫進度條）
    // 27 新格式＝新版新手引導（伺服器 web/WebTutorial；tutorial.js）：開頭 C 0xFF、C 0xE6（舊網頁把 0xFF 讀成「畢業」收起舊卡片）、C 版本、
    //    C 目前任務 1～總步數（0＝沒有任務框）、C 條件到了（1＝可以領）、C 旗標（1 藏 ⊞ 功能鈕、2 剛結束、4 20 級強制結束）、
    //    C 領取結果（只有領取的回覆不是 0：1 領到、2 格子不夠、3 太重、4 還不能領）、C 剛領的第幾步、H 進度目前、H 進度目標、
    //    H 獎勵件數＋（D 道具編號（0＝魔法娃娃的袋子）、H 圖示編號、D 數量、S 名字）×N、
    //    （版本 2 起）C 總步數：6＝原本 6 步；7＝第 6 步「魔法娃娃」、第 7 步升到 20 級（伺服器 tutorial.dollStep）。版本 1 的伺服器沒送＝6
    //    20 步制（伺服器 tutorial.steps20）：記號 0xE7、版本 3，欄位同上、總步數 20（舊網頁只認 0xE6 → 當成舊格式「畢業」收起來，不會照 6／7 步亂顯示）
    if (t === 27 && r.u[r.p] === 0xFF && (r.u[r.p + 1] === 0xE6 || r.u[r.p + 1] === 0xE7)) {
        r.c(); r.c();
        const ver = r.c();
        const d = { step: r.c(), reached: r.c() === 1, flags: r.c(), result: r.c(), claimed: r.c(), cur: r.h(), goal: r.h(), gifts: [], total: 6 };
        const n = r.h();
        for (let i = 0; i < n && r.left >= 11; i++) d.gifts.push({ id: r.d(), gfx: r.h(), n: r.d(), name: r.s() });
        if (ver >= 2 && r.left >= 1) { const tot = r.c(); d.total = tot >= 20 ? 20 : tot >= 7 ? 7 : 6; }
        // （0xE6 版本 3、0xE7 版本 4 起）C 目前任務的種類（伺服器 WebTutorial K_*；站長「第 4 跟第 8 換」以後 20 步制有兩個順序，照這個顯示）；
        //   舊伺服器沒送、或只是補齊 4 bytes 的 0＝照步驟編號自己對（tutorial.js kindOf）
        if (ver >= 3 && r.left >= 1) { const k = r.c(); if (k) d.kind = k; }
        // （0xE7 版本 5 起，2026-10-20 站長「象牙塔裝備衝到安定裝、武器 +5、最後做武卷點 +6」）C 強化進度目前、C 目標、C 要強化到 +幾、C 記號（bit0＝第 20 步做過武器卷軸）：
        //   強化防具＝到安定值的件數／要點的件數；強化武器、第 20 步＝強化值／要到的值。版本 4 以前沒有（尾端補齊的 0 不讀）→ tutorial.js 照舊規則引導
        if (ver >= 5 && r.left >= 4) d.ench = { cur: r.c(), goal: r.c(), plus: r.c(), made: (r.c() & 1) === 1 };
        // （0xE7 版本 6 起，伺服器第 448 項）C 畫面上的第幾步、C 總步數：拿掉的任務（強化防具、離線掛機）不算，「新手 9/19」不會從 8 跳到 10。
        //   step／total 照舊是伺服器存檔的編號（對獎勵、認幾步制用），只有任務條、視窗說明上的數字用這兩個；版本 5 以前沒有＝照 step／total
        if (ver >= 6 && r.left >= 2) { const s = r.c(), t = r.c(); if (s > 0 && t > 0) d.shown = { step: s, total: t }; }
        return this.emit('tutorial', d);
    }
    if (t === 27) return this.emit('newbie', { done: r.c(), step: r.c(), task: r.s(), reward: r.s(), cur: r.h(), goal: r.h() });
    // 28 每日簽到狀態（進世界送一次、簽完再送；signin.js）：C 下一格是第幾天（1～7）、C 今天簽了沒（0／1）、7 組（S 獎勵文字、D 道具編號（顯示圖示用）、D 數量）
    if (t === 28) {
        const next = r.c(), signed = r.c(), days = [];
        for (let i = 0; i < 7; i++) days.push({ reward: r.s(), item: r.d(), qty: r.d() });
        return this.emit('signin', { next, signed, days });
    }
    // 29 魔法娃娃收藏（進世界送一次、有變就整包重送；dolls.js）：C 裝著的編號（0＝沒裝）、H 袋子數、H 盒子數、C×5 保底（1→2 階 … 5→6 階）、
    //    H 種數＋（C 編號、H 數量）×N。編號 1～50＝data/dolls.json 的 id（單機版 00-data.js 的順序）
    if (t === 29) {
        const worn = r.c(), bags = r.h(), boxes = r.h(), pity = [];
        for (let i = 0; i < 5; i++) pity.push(r.c());
        const n = r.h(), own = new Map();
        for (let i = 0; i < n && r.left >= 3; i++) { const id = r.c(); own.set(id, (own.get(id) || 0) + r.h()); }
        // 尾端版本 2（伺服器本機改動第 132 項）：C 2、C 購買區開不開、D 每個袋子的金幣、C 今天上限、C 今天買了幾個、
        //   C 5＋5×（D 手續費、C 成功率 %、C 要放幾隻）、C 失敗退回幾隻、C 連續失敗幾次後必成。pity（上面那 5 個）＝每階現在連續失敗幾次。舊伺服器沒有＝null
        let shop = null, synth = null;
        if (r.left >= 1 && r.c() >= 2 && r.left >= 8) {
            shop = { on: r.c() === 1, price: r.d(), limit: r.c(), bought: r.c() };
            const k = r.c(); synth = { tiers: {} };
            for (let t = 1; t <= k && r.left >= 6; t++) synth.tiers[t] = { fee: r.d(), rate: r.c(), need: r.c() };
            synth.refund = r.left ? r.c() : 1; synth.pity = r.left ? r.c() : 5;
        }
        // 再來是圖鑑（曾經擁有過）：C 種數＋種數×C 編號；C 6＋6×（C 這階全收集了沒、S 全收集加成的字）
        let seen = null, done = null, bonus = null;
        if (synth && r.left >= 1) {
            const k = r.c(); seen = new Set();
            for (let i = 0; i < k && r.left >= 1; i++) seen.add(r.c());
            if (r.left >= 1) { const m = r.c(); done = []; bonus = []; for (let t = 1; t <= m && r.left >= 2; t++) { done[t] = r.c() === 1; bonus[t] = r.s(); } }
        }
        // 再來是魔法結晶體（伺服器本機改動第 136 項）：C 標記 3、H 每份幾分鐘、C 6＋6×H 每份幾顆（照階級，0＝不限時）、C 自動續用總開關、C 倒數暫停中（死亡）、
        //   C 種數＋（C 編號、D 剩幾秒）。舊伺服器沒有（讀到補齊的 0 或結尾）＝null，不顯示時間
        let crystal = null;
        if (done && r.left >= 4 && r.c() === 3) {
            crystal = { minutes: r.h(), cost: [], at: Date.now(), remain: new Map() };
            const m = r.c(); for (let t = 1; t <= m && r.left >= 2; t++) crystal.cost[t] = r.h();
            crystal.autoRenew = r.left ? r.c() === 1 : true; crystal.paused = r.left ? r.c() === 1 : false;
            const k = r.left ? r.c() : 0; for (let i = 0; i < k && r.left >= 5; i++) { const id = r.c(); crystal.remain.set(id, r.d()); }
        }
        // 再來是精緻魔法娃娃的袋子（伺服器第 699 項）：C 標記 4、H 幾個。舊伺服器沒有＝0
        const bags2 = crystal && r.left >= 3 && r.c() === 4 ? r.h() : 0;
        return this.emit('dolls', { worn, bags, boxes, bags2, pity, own, shop, synth, seen, done, bonus, crystal });
    }
    // 30 魔法娃娃結果（C_Web 24 的回答）：C 種類（1 開袋、2 開盒、3 合成成功、4 合成失敗、5 重組、6 買到袋子、7 沒買成、9 開精緻袋）、C 得到的編號（失敗＝退回的那隻；6＝買了幾個）、C 用掉幾隻；7 後面 S 原因
    if (t === 30) { const d = { kind: r.c(), id: r.c(), used: r.c() }; if (d.kind === 7 && r.left) d.why = r.s(); return this.emit('dollResult', d); }
    // 31 排行榜（C_Web 25 的回答；ranking.js）：D 這份榜幾點算的（epoch 秒，0＝還沒算好）、C 榜數（3：等級、財富、娃娃）、
    //    每張榜：H 上榜人數、H 我的名次（0＝沒上榜）、D 我的數值、C 筆數＋（S 名字、C 職業、C 等級、D 數值）×N（前 20 名）；
    //    數值：等級榜＝經驗值、財富榜＝金幣（背包＋個人倉庫）、娃娃榜＝收集到幾種（共 50）。名次同分並列（1、2、2、4）
    if (t === 31) {
        const time = r.d(), n = r.c(), boards = [];
        for (let b = 0; b < n; b++) {
            const total = r.h(), myRank = r.h(), myValue = r.d(), k = r.c(), rows = [];
            for (let i = 0; i < k; i++) rows.push({ name: r.s(), type: r.c(), level: r.c(), value: r.d() });
            boards.push({ total, myRank, myValue, rows });
        }
        return this.emit('ranking', { time, boards });
    }
    // 32 等級試煉獎勵（伺服器 web/WebTrialGift；trial.js）：C 版本、C 結果（0 推送／1 領到了／2 背包格子不夠／3 太重／4 不能領／5 暫時領不了）、
    //    C 這次處理的試煉等級（推送＝0）、C 1＝要跳儀式、C 還可以領的級數 n＋n×（C 試煉等級、C 1＝二選一、C 件數 k＋k×（D 道具編號、H 圖示編號、S 名字））
    if (t === 32) {
        r.c();   // 版本（1）
        const d = { result: r.c(), lv: r.c(), popup: r.c() === 1, list: [] }, n = r.c();
        for (let i = 0; i < n && r.left >= 3; i++) {
            const x = { lv: r.c(), pick: r.c() === 1, items: [] }, k = r.c();
            for (let j = 0; j < k && r.left >= 7; j++) x.items.push({ id: r.d(), gfx: r.h(), name: r.s() });
            if (x.lv && x.items.length) d.list.push(x);
        }
        return this.emit('trial', d);
    }
    // 34 誘捕道具（伺服器 web/WebPetLure，進世界送一次）：H 個數＋（D 道具編號、H 誘捕狀態的效果編號、S 狀態名稱）×N → lure.js、effects.js
    //   （33 是 2026-10-19 版的怪頭上倒數，新伺服器不送、這裡也不收）
    if (t === 34) {
        const n = r.h(), list = [];
        for (let i = 0; i < n && r.left >= 7; i++) list.push({ item: r.d(), sid: r.h(), name: r.s() });
        return this.emit('lureItems', list);
    }
    // 35 花金幣學魔法（伺服器 web/WebLearnMagic；C_Web 29 的回覆）：C 版本、C 結果（0 清單、1 學會了、2 金幣不夠、3 等級不夠、4 不能學、5 已經學會、6 太快、
    //    7 現在不能學、8 存不進去）、H 這次的技能編號、C 筆數＋（H 技能編號、D 價錢、C 幾級才能學）×N＝這個職業全部能花錢學的（不看學過沒有、等級）
    //    失敗的原因伺服器另外送一行系統訊息
    //    版本 2（第 117 項）：清單後面多 C 精靈屬性（0 沒有、1 地、2 火、4 水、8 風）、D 去除精靈力的價錢（艾利溫視窗）；版本 1 沒有（elfAttr 不給）
    if (t === 35) {
        const ver = r.c();
        const d = { result: r.c(), sid: r.h(), list: [] }, n = r.c();
        for (let i = 0; i < n && r.left >= 7; i++) d.list.push({ sid: r.h(), price: r.d(), lv: r.c() });
        if (ver >= 2 && r.left >= 5) { d.elfAttr = r.c(); d.reset = r.d(); }
        return this.emit('learnMagic', d);
    }
    // 37 排行榜第一名特權（伺服器 web/WebTop1；top1.js）：C 動作
    //    1 名單：C 版本、C 榜數＋（D 角色編號（0＝沒人）、S 名字、C 職業、C 等級、S 封號、D 雕像（奇岩主城）的物件編號）×N（0 等級、1 怪物博士（原本財富）、2 娃娃）
    //      版本 2（第 166 項）：再接 C 封號種類數＋（S 封號名字、S 附加能力一行、D 從幾點持有、D 幾點到期（epoch 秒））×（0 傳說勇者、1 怪物博士、2 奇趣收藏家）、C 怪物博士幾小時
    //    4 授予儀式（第 166 項，只有本人）：C 封號種類、S 封號名字、S 附加能力一行
    //    2 全服廣播：C 種類（1 上線了、2 登上第一名）、C 哪幾張榜（bit0 等級、bit1 財富、bit2 娃娃）、S 名字
    //    3 設封號的回覆：C 結果（0 設好了、1 不是第一名、2 太快、3 超過 8 個字、4 存不進去）、S 現在的金色封號
    // 38 交易所（伺服器 web/WebMarket；market.js）：C 動作 1 購買清單、2 詳細、3 我的上架、4 領取、5 概要、9 動作結果（格式見 readMarketEntry 和伺服器 S_Web.market*）
    if (t === 38) {
        const a = r.c();
        if (a === 1) {
            const d = { cat: r.c(), sort: r.c(), total: r.h(), list: [] }, n = r.h();
            for (let i = 0; i < n && r.left >= 8; i++) d.list.push(readMarketEntry(r));
            if (d.list.length === n && r.left >= 2) d.page = r.h();   // 伺服器第 761 項：尾端第幾頁（舊伺服器沒有）
            return this.emit('market', { list: d });
        }
        if (a === 2) {
            const id = r.d(), on = r.c() === 1, x = on ? readMarketEntry(r) : null;
            return this.emit('market', { detail: { id, entry: x, lo: r.d(), hi: r.d(), n: r.h() } });
        }
        if (a === 3) {
            const n = r.h(), list = [];
            for (let i = 0; i < n && r.left >= 8; i++) list.push(readMarketEntry(r));
            return this.emit('market', { mine: list });
        }
        if (a === 4) {
            const n = r.h(), list = [];
            for (let i = 0; i < n && r.left >= 8; i++) {
                const x = readMarketEntry(r);
                Object.assign(x, { state: r.c(), reason: r.c(), net: r.d(), saleFee: r.d(), buyer: r.s(), closed: r.d() });
                list.push(x);
            }
            return this.emit('market', { claims: list });
        }
        if (a === 5) {
            r.c();   // 版本（1）
            return this.emit('market', { summary: { on: r.c() === 1, salePct: r.d() / 100, listPct: r.d() / 100, listMin: r.d(), listMax: r.d(), hours: r.h(), maxN: r.c(),
                active: r.c(), claims: r.h(), maxPrice: r.d() } });
        }
        if (a === 9) return this.emit('market', { result: { op: r.c(), code: r.c(), id: r.d(), msg: r.s() } });
        return this.emit('unknown', S.WEB);
    }
    // 39 信箱（伺服器 web/WebMail；mail.js）：C 動作
    //    1 紅點：C 版本、H 要處理的信（附件沒領完或還沒打開過）
    //    2 清單（新的在前）：C 版本、C 剩幾天標紅、D 伺服器現在（epoch 秒）、H 封數＋（D 編號、C 來源、S 標題、D 寄出、D 會被刪的時間、C 旗標 bit0 打開過 bit1 附件沒領完、
    //      C 附件數＋（D 道具編號、H 圖示編號、S 名字、D 數量、C 強化值、C 領了沒）×k）×n
    //    3 內文：D 編號、S 內文
    //    4 結果：C 結果（0 好了、1 背包滿、2 太重、3 超過 20 億、4 沒有東西、5 打不開）、D 信件編號（0＝全部）、H 這次幾件、S 給玩家看的一句
    // 40 回憶蠟燭（伺服器 web/WebCharReset；candle.js）：C 動作
    //    1 打開：C 版本、C 職業、C 等級、C 初始總點數（75）、C 初始每項最高（18）、C 可分配點數、C 每項最高（35）、C 升級點數、C 萬能藥點數、
    //      6×C 職業基本值、6×C 目前的初始能力、6×C 目前的能力（力量、敏捷、體質、智力、精神、魅力）
    //    2 結果：C 結果（0 好了、1 不在村莊、2 冷卻中、3 沒有蠟燭、4 點數不對、5 暫時不能用、6 太快、7 現在不能用）、D 冷卻剩幾秒、S 給玩家看的一句
    // 41 月卡（伺服器 web/WebMonthCard，本機改動第 119 項）：C 動作 1＝C 版本、C 有沒有、D 到期（epoch 秒，0＝沒有）、D 伺服器現在、C 出售引導關了沒、
    //    H 現在背包上限、H 沒月卡的上限、H 有月卡的上限。有沒有月卡、能不能上架／賣都是伺服器判斷，這裡只拿來顯示
    //    （119b）尾端 C 測試期免費開通開著沒（1＝「開通月卡」送 C_Web 35 動作 3）；2＝開通結果：C 結果（0 好了、1 沒開放、2 到上限、3 存不進去）、S 一句
    if (t === 41) {
        const a = r.c();
        if (a === 2) return this.emit('monthCard', { result: { code: r.c(), msg: r.s() } });
        if (a !== 1) return this.emit('unknown', S.WEB);
        r.c();
        const d = { on: r.c() === 1, expire: r.d(), now: r.d(), hintOff: r.c() === 1, bagMax: r.h(), bagFree: r.h(), bagCard: r.h() };
        d.freeTest = r.left > 0 && r.c() === 1;
        return this.emit('monthCard', d);
    }
    // 123 連續提煉魔石（伺服器 web/WebBringStone）：C 結束原因（0＝還在跑；1 完成、2 黑魔石用完、3 魔力不夠、4 死亡、5 移動、6 動不了、7 受到攻擊、
    //    8 AUTO 開著、9 已停止、10 提煉不了、11 還沒學會、12 不能提煉、13 等魔力太久）、D 黑魔石道具編號、H 目標次數、H 做了、H 成功、H 失敗、
    //    （2026-10-23 尾端多）C 1＝等待魔力中、H 目前魔力、H 最大魔力；沒有這段的舊伺服器＝不在等
    // 178 全服廣播（伺服器第 178 項 web/WebAnnounce：打倒 BOSS、稀有掉落）：S 前段、S 名字、S 後段 → 強化廣播那條跑馬燈
    // 192 傲慢之塔圖鑑（伺服器 web/WebToiBook）：C 段數、段數×C 等級（255＝沒開、0＝開通、1～10）
    // 210 寶藏挖掘（伺服器 web/WebTreasure）：格式見伺服器 S_Web.treasure
    // 222 商城（伺服器 web/WebMall）：格式見伺服器 S_Web.mall*
    if (t === 222) {
        const a = r.c();
        if (a === 1) {
            const d = { diamonds: r.d(), own: {} }; const n = r.c(); for (let i = 0; i < n; i++) { const id = r.c(); d.own[id] = { cnt: r.d(), left: r.d() }; }
            // 伺服器第 283 項：儲值——C 開著、C 方案數＋（D 金額、D 藍鑽）×N；舊伺服器沒有＝null（不顯示儲值）
            if (r.left >= 2) { d.pay = { on: r.c() === 1, pkgs: [] }; const k = r.c(); for (let i = 0; i < k && r.left >= 8; i++) d.pay.pkgs.push({ price: r.d(), dia: r.d() }); }
            return this.emit('mall', { state: d });
        }
        if (a === 5) return this.emit('mall', { order: { ok: r.c() === 1, no: r.s(), token: r.s() } });   // 第 283 項：開單結果（失敗時 no＝原因）
        if (a === 2) return this.emit('mall', { result: { ok: r.c() === 1, msg: r.s() } });
        if (a === 3) { const d = { name: r.s(), lv: r.c(), cls: r.c(), gear: [] }; const n = r.c(); for (let i = 0; i < n; i++) d.gear.push({ kind: r.c(), name: r.s(), en: r.c() - 128, gfx: r.h() }); return this.emit('mall', { peek: d }); }
        if (a === 4) { const fx = new Map(), n = r.h(); for (let i = 0; i < n; i++) { const id = r.d(); fx.set(id, r.c()); } return this.emit('mall', { fx }); }   // 第 236 項：誰有閃亮封號（1）、名字光環（2）
        return;
    }
    // 237 穿雲箭（伺服器 web/WebCall）：動作 1 召集（D 編號、C 1 血盟 2 隊伍、S 誰、H 地圖、C 幾秒內）
    // 253 主城建設捐獻（伺服器 web/WebBuild）：見 S_Web.build
    // 伺服器第 543 項：管理員視窗（web/WebAdminPanel）。C 種類：1 你是管理的人＋人數、2 總覽、3 搜尋、4 贊助明細、5 金幣報表、9 一句提示
    if (t === 254) {
        const k = r.left > 0 ? r.c() : 1, d = { k };
        if (k === 1) Object.assign(d, { online: r.d(), afk: r.d() });
        else if (k === 2) { Object.assign(d, { online: r.d(), afk: r.d(), invis: r.c() === 1, cls: [] }); const n = r.c(); for (let i = 0; i < n; i++) d.cls.push({ on: r.d(), all: r.d() }); d.autoInvis = r.left > 0 ? r.c() === 1 : null; d.spy = r.left > 0 ? r.c() === 1 : null; }   // spy：伺服器第 713 項監聽開關（舊伺服器沒送＝null，不顯示）   // autoInvis：伺服器第 693 項「上線自動隱身」（舊伺服器沒送＝null，不顯示開關）
        else if (k === 3) { d.list = []; const n = r.h(); for (let i = 0; i < n && r.left > 0; i++) d.list.push({ id: r.d(), name: r.s(), level: r.c(), type: r.c(), state: r.c(), map: r.h(), account: r.s(), banned: r.c() === 1, clan: r.s() }); }
        else if (k === 4) { Object.assign(d, { day: r.s(), month: r.s(), total: r.s(), list: [] }); const n = r.h(); for (let i = 0; i < n && r.left > 0; i++) d.list.push({ at: r.s(), account: r.s(), name: r.s(), price: r.d(), dia: r.d(), type: r.s() }); }
        else if (k === 5) { Object.assign(d, { total: r.s(), bag: r.s(), wh: r.s(), elf: r.s(), clan: r.s(), top: [] }); const n = r.h(); for (let i = 0; i < n && r.left > 0; i++) d.top.push({ account: r.s(), name: r.s(), gold: r.s() }); }
        else if (k === 9) d.msg = r.s();
        return this.emit('admin', d);
    }
    if (t === 253) { if (r.c() === 1) { const d = { fund: r.d(), goal: r.d(), left: r.d(), pct: r.c(), hours: r.c(), done: r.d(), min: r.d(), top: [] }; const n = r.c(); for (let i = 0; i < n; i++) d.top.push({ name: r.s(), amount: r.d() }); d.mine = r.d(); this.emit('build', d); } return; }
    if (t === 237) { if (r.c() === 1) this.emit('callArrow', { id: r.d(), kind: r.c(), name: r.s(), map: r.h(), sec: r.c() }); return; }
    // 96 南瓜種植（伺服器第 596 項 web/WebPumpkin，格式見 S_Web.pumpkin*）：動作 1 資訊、2 點地面種、3 小地圖紫點、4 這棵不在了
    if (t === 96) {
        const a = r.c();
        if (a === 1) return this.emit('pumpkin', { a, id: r.d(), mature: r.c() === 1, owner: r.s(), kind: r.c(), water: r.d(), cap: r.d(), need: r.d(), still: r.d(), left: r.d(), wither: r.d(), boxes: r.c(), stolen: r.c() === 1, mine: r.c() === 1, drink: r.d() });
        if (a === 2) return this.emit('pumpkin', { a, seed: r.d(), kind: r.c() });
        if (a === 3) { const pts = [], n = r.h(); for (let i = 0; i < n; i++) pts.push({ x: r.h(), y: r.h(), mine: r.c() === 1 }); return this.emit('pumpkin', { a, pts }); }
        if (a === 4) return this.emit('pumpkin', { a, id: r.d() });
        return;
    }
    if (t === 210) {
        const d = { digs: r.c(), max: r.c(), maps: r.c(), daily: r.c(), mapPrice: r.d(), digPrice: r.d(), near: r.d(), last: r.c(), got: [] };
        if (d.digs === 255) d.digs = -1; if (d.last === 255) d.last = -1;
        const n = r.c(); for (let i = 0; i < n; i++) { const g = { cell: r.c(), item: r.d(), count: r.d(), rarity: r.c(), name: r.s() }; if (g.item > 0x7fffffff) g.item -= 0x100000000; d.got.push(g); }
        d.free = r.left >= 4 ? r.d() : 0;   // 第 311 項：每日簽到送的免費藏寶圖還有幾張
        d.freeMap = r.left >= 1 && r.c() === 1;   // 第 384 項（站長 2026-10-28「送的挖掘…好像有扣我錢」「要說明清楚玩家誤以為送了怎麼還要花一萬」）：手上這張圖是免費開的；舊伺服器沒有＝不是
        return this.emit('treasure', d);
    }
    if (t === 36) {   // 第 310 項：血盟招募板
        const d = { ok: r.c() === 1, leader: r.c() === 1, mine: null, applied: 0, list: [] };
        if (r.c() === 1) d.mine = { intro: r.s(), minLv: r.c() };
        d.applied = r.d();
        const n = r.h();
        for (let i = 0; i < n; i++) d.list.push({ id: r.d(), name: r.s(), leader: r.s(), on: r.c() === 1, n: r.h(), online: r.h(), minLv: r.c(), intro: r.s() });
        d.myEmb = r.left >= 1 ? r.c() === 1 : true;   // 第 317 項：盟主的血盟有沒有盟徽（舊伺服器沒給＝當有，讓伺服器自己擋）
        //   第 454 項：被哪個血盟拒絕、還要幾秒才能再申請（舊伺服器沒有＝沒有）
        d.cool = r.left >= 6 ? { id: r.d(), sec: r.h() } : { id: 0, sec: 0 };
        // 伺服器第 532 項：申請中的全部血盟（舊伺服器沒有＝只有 applied 那一個）
        if (r.left >= 1) { const k = r.c(); d.appliedAll = []; for (let i = 0; i < k; i++) d.appliedAll.push(r.d()); } else d.appliedAll = d.applied ? [d.applied] : [];
        return this.emit('clanRecruit', d);
    }
    // 73 邀請好友（伺服器第 703 項，站長 2026-11-07「邀請好友」；invite.js）：S JSON（欄位見 invite.js 開頭）。解不開＝不理（不送事件，畫面照舊）
    if (t === 73) {
        let o = null;
        try { o = JSON.parse(r.s()); } catch (e) { o = null; }
        if (o && typeof o === 'object') return this.emit('invite', o);
        return;
    }
    // 74 推廣系統（伺服器第 710 項，站長 2026-11-08「推廣系統」；promo.js）：S JSON——整份狀態（有 on）、推送（push:'bar'…）、上傳通行碼（tok）都走這個事件。解不開＝不理
    if (t === 74) {
        let o = null;
        try { o = JSON.parse(r.s()); } catch (e) { o = null; }
        if (o && typeof o === 'object') return this.emit('promo', o);
        return;
    }
    if (t === 199) {   // 第 299 項：1＝讀（C 1 可用／0 停用、S JSON）、2＝存的結果（C）
        const a = r.c();
        if (a === 1) return this.emit('prefs', { ok: r.c() === 1, json: r.s() });
        if (a === 2) return this.emit('prefsSaved', r.c());
        return this.emit('unknown', S.WEB);
    }
    // 93 狩獵圖鑑（第 393 項（站長 2026-10-28 狩獵圖鑑），伺服器 web/WebHuntDex）：C 地區數 N；N×（C 等級 255＝沒開／0＝開通／1～5、S 名字、S 能力說明）；
    //    D 開通證明、D 開通金幣；C 等級上限 M；M×（D 升到這級的證明、D 金幣）
    if (t === 93) {
        const d = { regs: [], open: null, up: [] }, n = r.c();
        for (let i = 0; i < n; i++) { const v = r.c(); d.regs.push({ lv: v === 255 ? -1 : v, name: r.s(), desc: r.s() }); }
        d.open = { proof: r.d(), gold: r.d() };
        const m = r.c(); for (let i = 0; i < m; i++) d.up.push({ proof: r.d(), gold: r.d() });
        return this.emit('huntDex', d);
    }
    // 214 隊伍增益（伺服器第 513 項 web/WebPartyBuff）：C 開著、C 種類數 n、n×（D 隊長身上剩幾秒、D 隊長等級一小時多少錢、C 照人數的效果（恢復＝倍數×10））、
    //   C 狀態（0 有效、1 不在隊伍、2 隊長不在同一張地圖、3 隊長那張地圖只有一人）、C 最多幾小時、C 自己是隊長、C 隊長那張地圖幾人
    // 215 自由招募（伺服器第 517 項 web/WebPartyRecruit）：C 自己的隊伍開著招募、H 筆數、×（D 隊長編號、S 名字、C 職業、C 等級、C 人數、C 上限、H 地圖、C 平均等級）
    // 216 手機推播（伺服器第 534 項 web/WebPush）：C 伺服器有開、S VAPID 公鑰、C 這支手機有訂閱、C 重開、C 被攻擊〔、C 有角色回村開關、C 角色回村（2026-11-10）〕
    // 217 好友（伺服器第 584 項 web/WebFriend）：C 種類 0 清單（H 上限、H 人數、×（D 編號、S 名字、C 線上、C 等級、C 職業、C 性別、S 地圖））／1 結果（C 成功、S 訊息）／2 好友上線（D 編號）
    // 218 傲慢之塔開通（伺服器第 603 項 web/WebToiPass）：H 個數＋D 傳送符編號×N
    if (t === 218) { const n = r.h(), list = []; for (let i = 0; i < n && r.left > 0; i++) list.push(r.d()); return this.emit('toiPass', list); }
    if (t === 217) {
        const kind = r.c();
        if (kind === 0) { const max = r.h(), n = r.h(), list = []; for (let i = 0; i < n && r.left > 0; i++) list.push({ id: r.d(), name: r.s(), online: r.c() === 1, level: r.c(), cls: r.c(), sex: r.c(), map: r.s() }); return this.emit('friend', { kind, max, list }); }
        if (kind === 1) return this.emit('friend', { kind, ok: r.c() === 1, msg: r.s() });
        return this.emit('friend', { kind, id: r.d() });
    }
    if (t === 216) return this.emit('push', { ok: r.c() === 1, key: r.s(), sub: r.c() === 1, restart: r.c() === 1, pvp: r.c() === 1, hasVillage: r.left > 0 && r.c() === 1, village: r.left > 0 && r.c() === 1 });   // 後兩個 2026-11-10：有角色回村開關、角色回村（舊伺服器沒有＝不列）
    if (t === 215) {
        const open = r.c() === 1, n = r.h(), list = [];
        for (let i = 0; i < n; i++) list.push({ id: r.d(), name: r.s(), type: r.c(), level: r.c(), n: r.c(), max: r.c(), map: r.h(), avg: r.c() });
        return this.emit('partyRecruit', { open, list });
    }
    if (t === 214) {
        const on = r.c() === 1, n = r.c(), list = [];
        for (let i = 0; i < n; i++) list.push({ sec: r.d(), price: r.d(), val: r.c() });
        const state = r.c(), maxH = r.c(), leader = r.left >= 1 ? r.c() === 1 : false, count = r.left >= 1 ? r.c() : 0;
        return this.emit('partyBuff', { on, list, state, maxH, leader, count });
    }
    if (t === 192) { const n = r.c(), lv = []; for (let i = 0; i < n; i++) { const v = r.c(); lv.push(v === 255 ? -1 : v); } return this.emit('toiBook', { lv }); }
    // 57 裝備蒐藏（第 457 項（站長 2026-10-29 55.xlsx），伺服器 web/WebCollection；格式見伺服器 S_Web.collection）：
    //   C 版本、H 剛登錄成功的組（0＝不是）、C 那一格（255）、C 組數；每組 H 編號、S 名字、C 成立第幾階（255＝沒有）、C 格數 ×（C 收的編號數、×D 道具編號、H 圖示、S 名字、C 安定值、C 有登錄、H 強化值（有號））、
    //   C 階數 ×（C 1 照安定值算、C 門檻數字、S 加成）；C 總加成行數 ×S；S 登錄沒成功的原因
    if (t === 57) {
        const d = { ver: r.c(), doneGrp: r.h(), doneSlot: r.c(), groups: [], total: [] };
        const sh = v => (v > 32767 ? v - 65536 : v);
        const g = r.c();
        for (let i = 0; i < g; i++) {
            const x = { id: r.h(), name: r.s(), active: r.c(), slots: [], tiers: [] };
            if (x.active === 255) x.active = -1;
            const k = r.c();
            for (let j = 0; j < k; j++) {
                const a = r.c(), ids = []; for (let q = 0; q < a; q++) ids.push(r.d());
                x.slots.push({ ids, gfx: r.h(), name: r.s(), safe: r.c(), has: r.c() === 1, en: sh(r.h()) });
            }
            const tn = r.c();
            for (let j = 0; j < tn; j++) x.tiers.push({ rel: r.c() === 1, n: r.c(), bonus: r.s() });
            d.groups.push(x);
        }
        const m = r.c(); for (let i = 0; i < m; i++) d.total.push(r.s());
        d.msg = r.left ? r.s() : '';   // 登錄沒成功的原因（空的＝不是）
        return this.emit('collect', d);
    }
    if (t === 178) return this.emit('announce', { pre: r.s(), name: r.s(), post: r.s() });
    // 163 怪物剪影大考驗（伺服器 web/WebSilhouette；silh.js）：C 動作（格式見伺服器 S_Web.silh*）。題目封包裡沒有正解
    if (t === 163) {
        const a = r.c();
        if (a === 1) return this.emit('silh', { state: { game: r.d(), phase: r.c(), n: r.c(), sec: r.c(), left: r.h(), joined: r.c() === 1, elig: r.c(), score: r.h() } });
        if (a === 2) return this.emit('silh', { join: { result: r.c(), elig: r.c() } });
        if (a === 3) {
            const q = { qi: r.c(), total: r.c(), gfx: r.h(), sec: r.c(), elapsed: r.d(), options: [r.s(), r.s(), r.s(), r.s()] };
            const m = r.c(); q.mine = m === 0xFF ? -1 : m;
            return this.emit('silh', { q });
        }
        if (a === 4) { const x = { qi: r.c(), result: r.c() }, m = r.c(); x.mine = m === 0xFF ? -1 : m; return this.emit('silh', { ans: x }); }
        if (a === 5) {
            const v = { qi: r.c(), correct: r.c(), name: r.s(), level: r.c(), map: r.s(), right: r.h(), answered: r.h(), joined: r.h(), fast: r.s(), fastMs: r.d() };
            const m = r.c(); v.mine = m === 0xFF ? -1 : m; v.pts = r.c(); if (v.pts > 127) v.pts -= 256; v.score = r.h(); v.next = r.c();   // pts 有號：答錯扣分是負的（伺服器第 561 項）
            return this.emit('silh', { reveal: v });
        }
        if (a === 6) {
            const joined = r.h(), n = r.c(), board = [];
            for (let i = 0; i < n && r.left >= 4; i++) board.push({ rank: r.c(), name: r.s(), score: r.h(), correct: r.c(), ms: r.d(), elig: r.c() });
            const has = r.c() === 1, me = { rank: r.c(), score: r.h(), correct: r.c(), ms: r.d(), elig: r.c(), text: r.s() };
            return this.emit('silh', { result: { joined, board, me: has ? me : null } });
        }
        if (a === 7) return this.emit('silh', { stop: r.s() });
        if (a === 8) {
            const text = r.s(), n = r.h(), list = [];
            for (let i = 0; i < n && r.left >= 8; i++) list.push({ id: r.d(), left: r.d() });
            return this.emit('silh', { titles: { text, list } });
        }
        return this.emit('unknown', S.WEB);
    }
    if (t === 123) {
        const d = { reason: r.c(), stone: r.d(), times: r.h(), done: r.h(), ok: r.h(), fail: r.h(), waitMp: false, mp: 0, maxMp: 0 };
        if (r.left >= 5) { d.waitMp = r.c() === 1; d.mp = r.h(); d.maxMp = r.h(); }
        return this.emit('bringStone', d);
    }
    if (t === 40) {
        const a = r.c();
        const six = () => [r.c(), r.c(), r.c(), r.c(), r.c(), r.c()];
        if (a === 1) {
            r.c();   // 版本（1）
            const d = { type: r.c(), level: r.c(), initTotal: r.c(), initMax: r.c(), amount: r.c(), statMax: r.c(), bonus: r.c(), elixir: r.c() };
            d.base = six(); d.orig = six(); d.cur = six();
            return this.emit('charReset', { info: d });
        }
        if (a === 2) return this.emit('charReset', { result: { code: r.c(), wait: r.d(), msg: r.s() } });
        // 3 升級點數（51 級起）：C 剩幾點、C 每項最高、6×C 目前的能力、C 1＝升級／進世界（跳視窗）
        if (a === 3) return this.emit('charReset', { bonus: { left: r.c(), max: r.c(), cur: six(), popup: r.c() === 1 } });
        return this.emit('unknown', S.WEB);
    }
    if (t === 39) {
        const a = r.c();
        if (a === 1) { r.c(); return this.emit('mail', { badge: r.h() }); }
        if (a === 2) {
            r.c();
            const warnDays = r.c(), now = r.d(), n = r.h(), list = [];
            for (let i = 0; i < n && r.left >= 4; i++) {
                const m = { id: r.d(), src: r.c(), title: r.s(), sent: r.d(), expire: r.d(), flags: r.c(), atts: [] };
                const k = r.c();
                for (let j = 0; j < k && r.left >= 4; j++) m.atts.push({ id: r.d(), gfx: r.h(), name: r.s(), count: r.d(), en: (r.c() << 24) >> 24, got: r.c() === 1 });
                m.read = (m.flags & 1) === 1; m.unc = (m.flags & 2) === 2;
                list.push(m);
            }
            return this.emit('mail', { list: { warnDays, now, mails: list } });
        }
        if (a === 3) return this.emit('mail', { body: { id: r.d(), text: r.s() } });
        if (a === 4) return this.emit('mail', { result: { code: r.c(), id: r.d(), n: r.h(), msg: r.s() } });
        return this.emit('unknown', S.WEB);
    }
    if (t === 37) {
        const a = r.c();
        if (a === 1) {
            const ver = r.c();
            const n = r.c(), list = [];
            for (let i = 0; i < n && r.left >= 4; i++) list.push({ id: r.d(), name: r.s(), type: r.c(), level: r.c(), title: r.s(), statue: r.d() });
            let kinds = null;
            let hours = 0, show = null;
            if (ver >= 2 && r.left >= 1) {
                const k = r.c(); kinds = [];
                for (let i = 0; i < k && r.left >= 2; i++) kinds.push({ name: r.s(), text: r.s(), since: r.left >= 8 ? r.d() : 0, until: r.left >= 4 ? r.d() : 0 });
                if (r.left >= 1) hours = r.c();
            }
            if (ver >= 3) {   // 第 167 項：開了「野外也全套顯示」的持有者（角色編號）
                show = [];
                const m = r.left >= 1 ? r.c() : 0;
                for (let i = 0; i < m && r.left >= 4; i++) show.push(r.d());
            }
            if (ver >= 4) {   // 第 169 項：每個位置拿下的成績（娃娃榜＝收集幾種／全部幾種；怪物博士＝分數、答對幾題／共幾題）→ list[i].score
                for (let i = 0; i < list.length && r.left >= 6; i++) list[i].score = { v: r.d(), c: r.c(), t: r.c() };
            }
            if (ver >= 5) {   // 第 170 項：答對總用時（毫秒；只有怪物博士位置有值）→ list[i].score.ms
                for (let i = 0; i < list.length && r.left >= 4; i++) { const ms = r.d(); if (list[i].score) list[i].score.ms = ms; }
            }
            return this.emit('top1', { list, kinds, hours, show });
        }
        if (a === 2) return this.emit('top1', { bc: { kind: r.c(), mask: r.c(), name: r.s() } });
        if (a === 3) return this.emit('top1', { set: { result: r.c(), title: r.s() } });
        if (a === 4) return this.emit('top1', { crown: { kind: r.c(), name: r.s(), text: r.s() } });   // 第 166 項：授予儀式
        return this.emit('unknown', S.WEB);
    }
    if (t === 12) {   // 背包每格的道具編號：物件編號 → 道具編號
        const n = r.h(), m = new Map();
        for (let i = 0; i < n; i++) { const id = r.d(); m.set(id, r.d()); }
        // 尾端（伺服器第 57 項）：C 1＋H 個數＋D 道具編號×N＝自動補給會用到、自動賣出不賣的 → m.supply；舊伺服器沒有（補齊的 0）＝不標
        if (r.left >= 3 && r.c() === 1) { const k = r.h(); m.supply = new Set(); for (let i = 0; i < k && r.left >= 4; i++) m.supply.add(r.d()); }
        // 再接（伺服器第 145 項）：C 2＋H 個數＋D 物件編號×N＝試煉贈品（不能交易、存倉、上架）→ m.bound；舊伺服器沒有＝空的
        m.bound = new Set();
        if (r.left >= 3 && r.c() === 2) { const k = r.h(); for (let i = 0; i < k && r.left >= 4; i++) m.bound.add(r.d()); }
        // 再接（伺服器第 275 項）：C 3＋H 個數＋D 物件編號×N＝鎖著的 → m.locked；舊伺服器沒有＝null（網頁不顯示鎖頭）
        m.locked = null;
        if (r.left >= 3 && r.c() === 3) { const k = r.h(); m.locked = new Set(); for (let i = 0; i < k && r.left >= 4; i++) m.locked.add(r.d()); }
        return this.emit('invIds', m);
    }
    // 26 AUTO 目前在做什麼（伺服器 backlog 84；只有 AUTO 開著、有變才送，同一個狀態至少 1.5 秒）：C 狀態碼、S 給玩家看的那句
    //   碼：0 其他、1 打怪中、2 回血中（沒藥水）＝卡住了、3 回魔中、4 等重生、5 走路找怪、6 喝水中、7 回血中（一般）；以後可能加，認不得的照樣顯示字
    //   定案前格式改過幾次（中間有一版在碼和文字之間多一個 C 等級 0／1）：碼後面那個 byte 是 0 或 1 就當等級讀掉（文字的第一個 byte 不會是 0、1），兩種都讀得對
    if (t === 26) {
        const code = r.c();
        let warn = code === 2;
        if (r.left >= 2 && r.u[r.p] <= 1) warn = r.c() === 1 || warn;
        return this.emit('autoStatus', { code, text: r.s(), warn });
    }
    // 66 戰鬥中到什麼時候（伺服器第 366 項，web/WebCombatLogout）：D 從現在起還有幾毫秒算戰鬥中（已含 1 秒寬限；有節流，不送「離開戰鬥」，自己倒數）
    if (t === 66) return this.emit('combat', r.d());
    // 88 頭目破甲（伺服器第 385 項破甲，第 388 項（2026-10-28 破甲小標記）加送）：D 頭目物件編號、D 還剩幾毫秒；破甲開始時送給看得到它的玩家，不送「恢復」
    //   直接記進 bossbreak.js（world.js 畫名字時去問），網頁自己倒數；也照樣 emit 一份給以後想用的人
    if (t === 88) { const b = { id: r.d(), ms: r.d() }; markBreak(b.id, b.ms); return this.emit('bossBreak', b); }
    return this.emit('unknown', S.WEB);
};

// S_CharPacks / S_NewCharPacket（選角畫面一筆角色）
// S_Web 3（掛機紀錄）、20（上次離線明細）每件道具的祝福、屬性，放在封包最後面另一段（舊網頁一筆一筆照順序讀、不會錯位）：
//   H 件數＋（C 祝福（道具原值：0 祝福、1 一般、2 詛咒，封印的 +128）、C 屬性種類（0 沒有、1 地、2 火、4 水、8 風）、C 屬性段數 1～3（沒有＝0））×N，順序同道具清單
//   → items[i].bless（0／1／2）、items[i].attrKey（同 items.js parseItem：'ea'／'fr'／'wa'／'wi' ＋段數，沒有＝''），可直接給 items.js glowCls
const ATTR_PFX = { 1: 'ea', 2: 'fr', 4: 'wa', 8: 'wi' };
function readItemGlow(r, items) {
    const k = r.h();
    for (let i = 0; i < k; i++) {
        const b = r.c() & 127, kind = r.c(), stage = r.c(), x = items[i];
        if (!x) continue;
        x.bless = b === 0 || b === 2 ? b : 1;
        x.attrKey = ATTR_PFX[kind] && stage >= 1 && stage <= 3 ? ATTR_PFX[kind] + stage : '';
    }
}
// S_Web 3、20 最後面的實賺明細（2026-10-19）：C 1＋D 自動賣出收入、D 自動購買花費、D 花金幣修武器 → { sold, bought, repair }；
//   舊伺服器沒有（讀到補齊的 0 或結尾）＝null，畫面照舊只顯示金幣
function readGoldNet(r) {
    return r.left >= 13 && r.c() === 1 ? { sold: r.d(), bought: r.d(), repair: r.d() } : null;
}
// S_Web 3、20 最後面的「夥伴用掉」（伺服器第 463 項：寵物、召喚獸喝掉的治癒藥水、綠水，對寵物用的復活卷軸；不在「用掉」裡）：
//   H 件數＋（S 名字、D 個數、H 圖示）×N → [{ name, count, gfx }]（同「用掉」的格式，畫成圖示格子）；舊伺服器沒有（讀到補齊的 0 或結尾）＝[]
function readPetUsed(r) {
    const a = [];
    if (r.left < 2) return a;
    const n = r.h();
    for (let i = 0; i < n && r.left > 0; i++) { const name = r.s(), count = r.d(), gfx = r.h(); if (count > 0) a.push({ name, count, gfx, bless: 1, attrKey: '' }); }
    return a;
}

function readCharListEntry(r) {
    return {
        name: r.s(), clan: r.s(), type: r.c(), sex: r.c(), lawful: (r.h() << 16) >> 16, hp: r.h(), mp: r.h(),
        ac: (r.c() << 24) >> 24, level: r.c(), str: r.c(), dex: r.c(), con: r.c(), wis: r.c(), cha: r.c(), int: r.c(),
        admin: r.c(), birthday: r.d(),
    };
}

// C 長度＋那麼多 byte → 十六進位字串
function statusHex(r) {
    const n = r.c(); let s = '';
    for (let i = 0; i < n; i++) s += (r.c() + 256).toString(16).slice(1);
    return s;
}
// 背包一筆（S_InvList／S_AddItem）：編號、使用類型、圖示、祝福、數量、鑑定、名字（$編號＋強化/數量字樣）
// S_Web 38 的一筆上架：D 上架編號、D 道具編號、H 圖示、C useType、C 祝福、C 鑑定、D 數量、S 名字（同背包）、D 單價、D 總價、S 賣家、D 剩幾秒、C 分類、C 旗標（bit0 自己的）
//   → it 同背包道具的形狀（items.js parseItem 吃得下；id＝上架編號）
function readMarketEntry(r) {
    const id = r.d(), itemId = r.d(), gfx = r.h(), useType = r.c(), bless = r.c(), identified = r.c(), count = r.d(), name = r.s();
    return { id, itemId, it: { id, useType, gfx, bless, identified, count, name }, unit: r.d(), total: r.d(), seller: r.s(), left: r.d(), cat: r.c(), mine: (r.c() & 1) === 1 };
}
function readItem(r) {
    const it = { id: r.d(), useType: r.c() }; r.c();
    it.gfx = r.h(); it.bless = r.c(); it.count = r.d(); it.identified = r.c(); it.name = r.s();
    it.st = statusHex(r);   // 能力值那串（L1ItemStatus：攻擊力、損壞程度…）：背包同款裝備疊成一格時比對用
    return it;
}

const DOLL_MARK = 0x444F4C4C;   // 伺服器 S_DollPack.WEB_MARK（"DOLL"）
// S_OwnCharPack / S_OtherCharPacks / S_NPCPack / S_DropItem 共用開頭：位置、編號、外型、動作、方向…名字
function readCharPack(r) {
    const o = { x: r.h(), y: r.h(), id: r.d(), gfx: r.h(), status: r.c(), heading: r.c(), light: r.c(), speed: r.c() };
    o.exp = r.d(); o.lawful = (r.h() << 16) >> 16; o.name = r.s(); o.title = r.s();
    o.flags = r.c();             // bit2(4)＝玩家角色、bit1(2)＝隱身
    o.clanId = r.d(); o.clan = r.s();
    o.isPc = !!(o.flags & 4);
    // 地上的道具（S_DropItem，跟 NPC 同一個封包編號）：照上面讀，exp 那格是數量。分辨靠後面的尾巴：
    //   道具讀到這裡還剩 [0,0,255,0,0,0,255,255,0,0,0,0,8,0]（第 13 個是 8）；NPC（S_NPCPack）只剩 8 個 byte
    const rest = r.u.subarray(r.p);
    o.isItem = !o.isPc && rest.length >= 14 && rest[6] === 255 && rest[7] === 255 && rest[12] === 8;
    if (o.isItem) o.count = o.exp;
    // 玩家（S_OtherCharPacks）的速度：speed＝一段（1 加速、2 緩速）、旗標高 4 位元＝二段（同 S_SkillBrave 的種類）、尾巴第 4 個 byte 8＝三段（巧克力蛋糕）
    if (o.isPc) { o.brave = o.flags >> 4; o.third = rest.length >= 4 && rest[3] === 8; }
    // NPC（S_NPCPack）剩下的：S 主人名字（空）、C 飛天（哈維、格利芬…：2＝現在在天上）、C HP…；在天上的不畫（main.js onObject）
    else if (!o.isPc && rest.length >= 2) o.fly = rest[1] === 2;
    // 寵物、召喚獸（S_PetPack／S_SummonPack）在同一個位置是主人的名字（NPC 是空字串）：點怪就打不打別人的寵物（main.js tapAt）
    if (!o.isPc && !o.isItem && rest.length && rest[0]) { const p = r.p; o.master = r.s(); r.p = p; }
    // 魔法娃娃（S_DollPack，伺服器本機改動第 132 項）：主人名字同寵物，經驗值那格是 DOLL_MARK → 點不到、設定可以隱藏（main.js、dollshow.js）
    o.isDoll = !o.isPc && !o.isItem && !!o.master && o.exp === DOLL_MARK;
    return o;
}
