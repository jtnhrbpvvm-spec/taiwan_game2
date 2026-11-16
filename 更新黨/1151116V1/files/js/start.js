// 登入、選角、建角畫面：外觀與操作照搬單機版 idle-lineage-class（index.html #creation-screen、js/13-shop-save.js、js/00z-my-tweaks.js），
//   背後接 L1J 伺服器：登入＝C_AuthLogin、角色列表＝S_CharAmount/S_CharPacks、建角＝C_CreateChar、刪角＝C_DeleteChar。
//   規則以伺服器為準：能力基本值、可分配點數照 C_CreateChar.java；每項最高 18 由伺服器檢查（這裡只是先擋給玩家看）；
//   每個帳號能建幾隻照伺服器 S_CharAmount 給的上限（拱門一頁 3 隻，多的分頁）。
//   用法：const start = createStart({ login(acc), enter(name), create(o), del(name), refresh(), logout() })
import { sfx, addSfx, preloadSfx } from './audio.js';
const $ = id => document.getElementById(id);
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TYPE_NAMES = ['王族', '騎士', '妖精', '法師', '黑暗妖精', '龍騎士', '幻術師'];
// 建角能力值（C_CreateChar.java ORIGINAL_*）：各職業基本值、可分配點數，六項合計 75
const BASE = { str: [13, 16, 11, 8, 12, 13, 11], dex: [10, 12, 12, 7, 15, 11, 10], con: [10, 14, 12, 12, 8, 14, 12],
    int: [10, 8, 12, 12, 11, 11, 12], wis: [11, 9, 12, 12, 10, 12, 12], cha: [13, 12, 9, 8, 9, 8, 8] };
const BONUS = [8, 4, 7, 16, 10, 6, 10];
const STAT_MAX = 18;   // 每項最高（伺服器 C_CreateChar 也擋，本機改動見伺服器資料夾 本機改動.md）
const statMax = (type, k) => (type === 1 && k === 'str' ? 20 : STAT_MAX);   // 騎士力量最高 20（站長 2026-11-08；伺服器 C_CreateChar.maxInitial）
const STATS = [['str', '力量'], ['dex', '敏捷'], ['con', '體質'], ['int', '智力'], ['wis', '精神'], ['cha', '魅力']];
// 立繪逐幀動畫（單機版 CREATION_CLASS_ANIM_FRAMES）：/assets/start/<key>/<n>.png；職業 type → [男, 女]
const ANIM = { prince: [714, 798], princess: [629, 710], m_knight: [378, 448], f_knight: [315, 374], m_mage: [531, 625], f_mage: [452, 527],
    m_elf: [245, 311], f_elf: [166, 241], m_dark: [90, 162], f_dark: [25, 86] };
const KEY_OF_TYPE = [['prince', 'princess'], ['m_knight', 'f_knight'], ['m_elf', 'f_elf'], ['m_mage', 'f_mage'], ['m_dark', 'f_dark']];
const STEP_MS = 82, DOUBLE_TAP_MS = 400, PAGE = 3;
// 橫式（body.pcui：pcui.js 畫面寬 ≥ 高時加，跟遊戲內同一條判斷）：版面換成 3.5C 原圖（start.css「橫式」）；選角一樣一頁 3 個拱門
const land = () => document.body.classList.contains('pcui');
const NAME_MIN = 2, NAME_MAX = 10;   // 角色名字 2～10 個字（中英文都算一個字；站長 2026-10-19，伺服器同步改）
const NAME_OK = /^[一-鿿㐀-䶿A-Za-z0-9]*$/;   // 第 289 項（站長「創ID也能用日文」；伺服器 C_CreateChar.charsetOk）：只能中文、英文、數字
const ZHUYIN = /[㄀-ㄯㆠ-ㆿˇˊˋ˙]/;   // 第 287 項（站長 2026-10-26「創腳色名稱禁止注音符號」；伺服器 C_CreateChar.hasZhuyin 同一組）
const nameLen = s => [...s].length;
// 登錄動畫（劈開信紙）的音效：3.5C 用戶端 Sound\<編號>.wav（/data/snd35，tools/spr-sfx.mjs 複製）。用戶端登入畫面沒有這段動畫，
//   照單機版 js/17-audio.js playLoginSlashSfx 的兩聲，換成 3.5C 同一個音檔：揮劍＝1540（list.spr 雙手劍 attack largesword 的揮擊聲；單機版 1540.ogg 就是它）、
//   劈開＝920（list.spr 受傷 damage 的打擊聲；單機版爆擊聲 crit.ogg 波形跟它一樣）。時間點同單機版：劍加速那段 170 毫秒、信紙裂開＋震動 330 毫秒
const SLASH_SFX = [[170, 'c1540', 0.85], [330, 'c920', 0.7]];
addSfx(SLASH_SFX.map(x => x[1]));
const REMEMBER_KEY = 'l1web_remember', ACC_KEY = 'l1web_acc';   // 記住帳號：只存帳號，絕不存密碼

const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕 */ } },
    rm(k) { try { localStorage.removeItem(k); } catch (e) { /* 無痕 */ } } };

// 立繪幀快取：下一幀還沒下載完就停在目前這張（網路慢時不會變空白），載入失敗的跳過
const frames = {};
function frame(key, n) { const c = frames[key] || (frames[key] = {}); if (!c[n]) { const im = new Image(); im.src = '/assets/start/' + key + '/' + n + '.png'; c[n] = im; } return c[n]; }
const frameReady = (k, n) => { const im = frame(k, n); return im.complete && im.naturalWidth > 0; };
const frameBroken = (k, n) => { const im = frame(k, n); return im.complete && im.naturalWidth === 0; };
function keyOf(type, sex) { const t = type >= 32 ? type - 32 : type; return (KEY_OF_TYPE[t] || KEY_OF_TYPE[0])[sex ? 1 : 0]; }

export function createStart(cb) {
    const screen = $('creation-screen'), stage = $('login-art-stage');
    const acc = $('login-account'), remember = $('login-remember-cb'), msgEl = $('login-msg');
    let busy = false, slashDone = false, waitChars = false;
    let chars = [], max = 0, complete = false, page = 0, picked = -1, lastTap = { i: -1, t: 0 };

    // ── 提示（選角／建角畫面用；登入畫面用 .login-msg；聲音開不起來的提示也用這個，main.js） ──
    //   寬度：left:50% 的 fixed 元素只會用到半個畫面寬就換行 → width:max-content 才用得到 max-width；長句在標點、空白處換行（keep-all），整段沒得斷才硬斷
    const toastEl = document.createElement('div'); toastEl.id = 'start-toast';
    toastEl.style.cssText = 'position:fixed;left:50%;top:30%;transform:translate(-50%,-50%);z-index:9500;width:max-content;max-width:calc(var(--vw1, 1vw) * 86);word-break:keep-all;overflow-wrap:anywhere;padding:9px 16px;border:1px solid #6b5636;border-radius:6px;' +
        'background:rgba(20,15,10,.95);color:#ecdcb6;font-size:15px;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s;font-family:inherit;';
    document.body.appendChild(toastEl);
    let toastT = 0;
    function toast(t, ms) { toastEl.textContent = t; toastEl.style.opacity = '1'; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.style.opacity = '0'; }, ms || 2200); }
    let msgT = 0;
    function say(t, keep) { msgEl.textContent = t || ''; msgEl.classList.toggle('show', !!t); clearTimeout(msgT); if (t && !keep) msgT = setTimeout(() => msgEl.classList.remove('show'), 3500); }

    // ── 畫面切換 ──
    function show(which) {
        screen.classList.toggle('hidden', which === 'game');
        $('main-menu').classList.toggle('hidden', which !== 'login');
        stage.style.display = which === 'login' ? '' : 'none';
        $('load-select-panel').classList.toggle('hidden', which !== 'select');
        $('creation-panel').classList.toggle('hidden', which !== 'create');
        $('game').classList.toggle('hidden', which !== 'game');
        cur = which;
        animOn();
        if (cb.scene) cb.scene(which, which === 'create' ? cf.type : null);   // 背景音樂跟著畫面換
    }
    let cur = 'login', animRaf = 0;   // animRaf：立繪動畫（tick）排著的那一幀
    // 一打開就是登入畫面：背景音樂先記著要放登入曲（3.5C music.def「Login=0」＝Sound\music0.mp3，跟 audio.js 的 title 是同一個檔），玩家第一次碰畫面才開始放。
    //   原本只有切畫面（show）才叫 scene → 剛打開的登入畫面沒有音樂，登入進選角才響
    if (cb.scene) cb.scene('login', null);

    // 站長 2026-11-03「登入時候顯示目前伺服器維修中」：登入頁每 15 秒問轉接 /api/maint（重開腳本放的旗標、或遊戲埠關著）；維修中＝訊息留著、登錄鈕只顯示訊息
    let maintNow = false;
    function maintPoll() {
        if (cur !== 'login') return;
        fetch('/api/maint', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(r => {
            const on = !!(r && r.maint);
            if (on !== maintNow) { maintNow = on; if (on) say('伺服器維修中，請稍後再試', true); else if (msgEl.textContent === '伺服器維修中，請稍後再試') say(''); }
        }).catch(() => { });
    }
    setInterval(maintPoll, 15000); setTimeout(maintPoll, 800);
    function maint(on) { maintNow = !!on; if (on) say('伺服器維修中，請稍後再試', true); }
    // 第 296 項：信紙寫伺服器倍率（server.mjs /rates.json 讀 rates.properties）；讀不到就不顯示那段
    fetch('/rates.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(r => {
        const box = document.querySelector('#login-art-stage > .login-scroll-note .lsn-rates');
        if (!r || !box || !(r.xp > 0)) return;
        const x = v => (Math.round(v * 100) / 100) + ' 倍';
        box.querySelector('span').innerHTML = [['經驗', r.xp], ['金幣', r.adena], ['掉寶', r.drop]].filter(p => p[1] > 0).map(p => '<i>' + p[0] + ' ' + x(p[1]) + '</i>').join('');
        box.hidden = false;
    }).catch(() => {});
    // 純本機單機：只使用帳號名稱，不驗密碼、不註冊、不呼叫密碼管理員。
    const form = $('login-form');
    if (ls.get(REMEMBER_KEY) === '1') { remember.checked = true; acc.value = ls.get(ACC_KEY) || ''; }
    if (!acc.value) { acc.value = 'offline'; remember.checked = true; }
    function storeRemember() { if (remember.checked) { ls.set(REMEMBER_KEY, '1'); ls.set(ACC_KEY, acc.value.trim()); } else { ls.set(REMEMBER_KEY, '0'); ls.rm(ACC_KEY); } }
    function fillSaved() { if (remember.checked && !acc.value) acc.value = ls.get(ACC_KEY) || 'offline'; }
    remember.addEventListener('change', storeRemember);
    acc.addEventListener('input', () => { if (remember.checked) storeRemember(); });
    let resumeChar = '';
    try { resumeChar = sessionStorage.getItem('l1web_upd_char') || ''; sessionStorage.removeItem('l1web_upd_char'); } catch (e) {}
    form.addEventListener('submit', e => { e.preventDefault(); doLogin(); });
    acc.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); acc.blur(); if (form.requestSubmit) form.requestSubmit(); else doLogin(); }
    });
    function doLogin() {
        if (busy) return;
        const a = acc.value.trim() || 'offline'; acc.value = a;
        if (maintNow) { say('本機遊戲目前無法啟動，請重新啟動遊戲', true); return; }
        storeRemember(); preloadSfx(SLASH_SFX.map(x => x[1]));
        busy = true; slashDone = false; waitChars = false; complete = false;
        say('正在讀取本機存檔…', true);
        cb.login(a, '', 0x11);
    }
    function loginOk() {
        say(''); waitChars = true;
        playSlash(() => { slashDone = true; maybeSelect(); });
    }
    // 伺服器第 549 項：登入要排隊驗密碼（首次開服、重開後大家一起登入）→ 每秒告訴前面還有幾位（S_Web 42）；0＝輪到了
    function queue(pos) { if (busy && cur === 'login' && !waitChars) say(pos > 0 ? '正在準備本機存檔…' : '正在讀取本機存檔…', true); }
    function loginFailed(t, needReg) {
        busy = false; waitChars = false; show('login');
        // 註冊視窗開著：原因寫在視窗裡，紅框標出來（站長同日「這個要明顯一點，玩家以為不能玩」）；帳號那格標紅、選起來直接打新的
        say(t, true);
    }
    // 通行碼登入成功（main.js）：不播登入動畫、不顯示選角，角色收齊直接進 name 那隻（找不到才停在選角）
    let autoGo = false;
    function passOk(name, stay) { say(''); busy = true; complete = false; resumeChar = name || ''; autoGo = !stay;   // stay：選好原本那隻、不自動進（伺服器重開過）
         slashDone = true; waitChars = true; }
    function maybeSelect() {
        if (!(waitChars && slashDone && complete)) return;
        waitChars = false; busy = false; page = 0; picked = chars.length ? 0 : -1;
        const back = resumeChar ? chars.findIndex(c => c.name === resumeChar) : -1; resumeChar = '';   // 更新回來：直接進原本那隻
        const go = autoGo; autoGo = false;
        if (back >= 0 && go) { picked = back; cb.enter(chars[back]); return; }
        if (back >= 0) { picked = back; page = Math.floor(back / PAGE); }
        renderSelect(); show('select');
    }

    // ── 選角 ──
    function setChars(list, mx, done) {
        chars = list; max = mx; complete = done;
        if (waitChars) { maybeSelect(); return; }
        if (cur === 'select' && done) { if (picked >= chars.length) picked = chars.length - 1; renderSelect(); }
    }
    function pages() { return Math.max(1, Math.ceil(Math.max(max, chars.length) / PAGE)); }
    function renderSelect() {
        const grid = $('load-slot-grid'); let h = '';
        for (let k = 0; k < PAGE; k++) {
            const i = page * PAGE + k, ch = chars[i];
            if (ch) {
                const key = keyOf(ch.type, ch.sex), pending = ch.type >= 32, cls = TYPE_NAMES[pending ? ch.type - 32 : ch.type] || '';
                const n = ANIM[key][0];
                h += '<button type="button" data-i="' + i + '" data-key="' + key + '" class="load-slot-card filled' + (i === picked ? ' selected' : '') + '" title="' + esc(ch.name) + '">' +
                    '<img src="/assets/start/' + key + '/' + n + '.png" alt="" draggable="false">' +
                    '<span class="load-slot-label"><strong>' + esc(ch.name) + '</strong>Lv.' + esc(ch.level) + ' ' + esc(cls) + (pending ? '<em>7 天後刪除</em>' : '') + '</span></button>';
            } else if (i < max) {
                h += '<button type="button" data-i="' + i + '" class="load-slot-card empty" title="建立角色"><span class="load-slot-hint">(點擊建立角色)</span></button>';
            } else h += '<div></div>';   // 超過伺服器上限的拱門：不給建
        }
        grid.innerHTML = h;
        const np = pages();
        $('load-pager').classList.toggle('hidden', np <= 1);
        $('load-page').textContent = (page + 1) + ' / ' + np;
        $('load-prev').disabled = page <= 0; $('load-next').disabled = page >= np - 1;
        updateInfo();
        anim.selKey = null;
    }
    function updateInfo() {
        const ch = chars[picked], panel = $('load-info-panel');
        panel.classList.toggle('hidden', !ch || Math.floor(picked / PAGE) !== page);
        if (!ch) return;
        const set = (id, t) => { $(id).textContent = t; };
        const pending = ch.type >= 32, cls = TYPE_NAMES[pending ? ch.type - 32 : ch.type] || '';
        set('load-info-name', ch.name);
        set('load-info-sub', 'Lv.' + ch.level + '　' + cls + (pending ? '（7 天後刪除）' : ''));
        set('load-info-lv', ch.level); set('load-info-cls', cls); set('load-info-clan', ch.clan || ''); set('load-info-law', ch.lawful == null ? '' : ch.lawful);
        set('load-info-hp', ch.hp); set('load-info-mp', ch.mp); set('load-info-ac', ch.ac);
        for (const [k] of STATS) set('load-info-' + k, ch[k]);
        $('load-btn-delete').textContent = pending ? '取消刪除' : '刪除角色';
    }
    $('load-slot-grid').addEventListener('click', e => {
        const b = e.target.closest('.load-slot-card'); if (!b) return;
        const i = +b.getAttribute('data-i'), now = Date.now();
        const dbl = lastTap.i === i && now - lastTap.t <= DOUBLE_TAP_MS;
        lastTap = { i, t: now };
        if (!chars[i]) { openCreate(); return; }   // 空拱門＝直接建角
        picked = i;
        if (dbl) { enterPicked(); return; }   // 連點兩下＝進入遊戲（同單機版）
        renderSelect();
    });
    $('load-prev').addEventListener('click', () => { if (page > 0) { page--; renderSelect(); } });
    $('load-next').addEventListener('click', () => { if (page < pages() - 1) { page++; renderSelect(); } });
    $('load-back-button').addEventListener('click', () => { cb.logout(); showLogin(''); });
    $('load-btn-enter').addEventListener('click', enterPicked);
    function enterPicked() { const ch = chars[picked]; if (!ch) return; lastTap = { i: -1, t: 0 }; cb.enter(ch); }
    $('load-btn-delete').addEventListener('click', () => {
        const ch = chars[picked]; if (!ch) return;
        if (ch.type >= 32) { cb.del(ch.name); return; }   // 待刪中：再按一次＝取消（伺服器同一個封包切換）
        openDeleteDialog(ch);
    });
    // 刪除確認：打對角色名字才能按（同單機版，不用原生對話框：部分 App 內瀏覽器會擋）
    function openDeleteDialog(ch) {
        let ov = $('load-delete-dialog'); if (ov) ov.remove();
        ov = document.createElement('div'); ov.id = 'load-delete-dialog';
        const later = ch.level >= 30;
        ov.innerHTML = '<div class="ldd-box" role="dialog" aria-modal="true">' +
            '<p class="ldd-msg">即將刪除「' + esc(ch.name) + '」（' + esc(TYPE_NAMES[ch.type] || '') + ' Lv.' + esc(ch.level) + '），' + (later ? '7 天後刪除，期間可以取消。' : '刪除後無法復原。') + '</p>' +
            '<p class="ldd-msg">請輸入角色名字確認：</p>' +
            '<input class="ldd-input" type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(ch.name) + '">' +
            '<div class="ldd-actions"><button type="button" class="ldd-cancel">取消</button><button type="button" class="ldd-ok" disabled>確認刪除</button></div></div>';
        $('load-select-panel').appendChild(ov);
        const input = ov.querySelector('.ldd-input'), ok = ov.querySelector('.ldd-ok'), close = () => ov.remove();
        input.addEventListener('input', () => { ok.disabled = input.value.trim() !== ch.name; });
        input.addEventListener('keydown', e => { if (e.key === 'Enter' && !ok.disabled) ok.click(); if (e.key === 'Escape') close(); });
        ov.querySelector('.ldd-cancel').addEventListener('click', close);
        ov.addEventListener('click', e => { if (e.target === ov) close(); });
        ok.addEventListener('click', () => { if (input.value.trim() !== ch.name) return; close(); cb.del(ch.name); });
        setTimeout(() => { try { input.focus(); } catch (e) { /* */ } }, 30);
    }
    function deleted(result) {   // S_DeleteCharOK：0x05 刪掉了、0x51 30 級以上改成 7 天後刪（或取消）
        toast(result === 0x05 ? '角色已刪除。' : '已更新：30 級以上的角色 7 天後才會刪除，期間再按一次可以取消。');
        cb.refresh();
    }

    // ── 建角 ──
    const cf = { type: 0, sex: 0, add: {} };
    const statBox = $('stat-allocation');
    statBox.innerHTML = STATS.map(([k, n]) => '<div class="creation-stat-row"><span class="creation-stat-label">' + n + '</span>' +
        '<button class="creation-stat-btn minus" data-k="' + k + '" data-v="-1" type="button" aria-label="' + n + '減一"></button>' +
        '<span id="c-' + k + '" class="creation-stat-value"></span>' +
        '<button class="creation-stat-btn plus" data-k="' + k + '" data-v="1" type="button" aria-label="' + n + '加一"></button></div>').join('');
    statBox.addEventListener('click', e => {
        const b = e.target.closest('.creation-stat-btn'); if (!b) return;
        const k = b.getAttribute('data-k'), v = +b.getAttribute('data-v');
        if (v > 0 && left() > 0 && BASE[k][cf.type] + cf.add[k] < statMax(cf.type, k)) cf.add[k]++;
        else if (v < 0 && cf.add[k] > 0) cf.add[k]--;
        renderCreate();
    });
    $('creation-class-list').addEventListener('click', e => {
        const b = e.target.closest('.creation-tile'); if (!b) return;
        if (b.hasAttribute('data-type')) { cf.type = +b.getAttribute('data-type'); resetAdd(); if (cb.scene) cb.scene('create', cf.type); }
        else cf.sex = +b.getAttribute('data-sex');
        setPreview(); renderCreate();
    });
    $('creation-name').addEventListener('input', renderCreate);
    $('creation-back-button').addEventListener('click', () => { renderSelect(); show('select'); });
    $('btn-start').addEventListener('click', () => {
        if (left() !== 0) return;
        const name = $('creation-name').value.trim(), n = nameLen(name); if (n < NAME_MIN || n > NAME_MAX || ZHUYIN.test(name) || !NAME_OK.test(name)) return;
        $('btn-start').disabled = true;
        hint('建立中…');
        const o = { name, type: cf.type, sex: cf.sex };
        for (const [k] of STATS) o[k] = BASE[k][cf.type] + cf.add[k];
        cb.create(o);
    });
    function resetAdd() { for (const [k] of STATS) cf.add[k] = 0; }
    function left() { let s = 0; for (const [k] of STATS) s += cf.add[k]; return BONUS[cf.type] - s; }
    function hint(t, warn) { const h = $('creation-hint'); h.textContent = t || ''; h.classList.toggle('warn', !!warn); }
    function openCreate() {
        if (chars.length >= max) { toast('角色已經滿了。'); return; }
        cf.type = 0; cf.sex = 0; resetAdd();
        $('creation-name').value = ''; $('creation-name').classList.remove('invalid');
        setPreview(); renderCreate(); show('create');
    }
    function renderCreate() {
        document.querySelectorAll('#creation-class-list .creation-class-btn').forEach(b => b.classList.toggle('active', +b.getAttribute('data-type') === cf.type));
        document.querySelectorAll('#creation-class-list .creation-gender-btn').forEach(b => b.classList.toggle('active', +b.getAttribute('data-sex') === cf.sex));
        for (const [k] of STATS) { const a = cf.add[k]; $('c-' + k).innerHTML = (BASE[k][cf.type] + a) + (a > 0 ? '<small class="creation-stat-plus">+' + a + '</small>' : ''); }
        const l = left(), nm = $('creation-name').value.trim(), n = nameLen(nm), short = n > 0 && n < NAME_MIN, zy = ZHUYIN.test(nm), bad = !zy && !NAME_OK.test(nm);
        $('creation-pts').textContent = l;
        hint(zy ? '名字不能有注音符號' : bad ? '名字只能用中文、英文和數字' : short ? '名字至少要 ' + NAME_MIN + ' 個字' : l > 0 ? '還有 ' + l + ' 點能力值沒分配' : '');
        $('btn-start').disabled = !(l === 0 && n >= NAME_MIN && n <= NAME_MAX && !zy && !bad);
    }
    function createFailed(t) { hint(t, true); $('btn-start').disabled = false; $('creation-name').classList.add('invalid'); }
    function created(ch) {   // 伺服器建好：回選角，選中新角色（main 已把它加進列表）
        picked = chars.indexOf(ch); if (picked < 0) picked = chars.length - 1;
        page = Math.floor(picked / PAGE);
        renderSelect(); show('select');
    }

    // ── 立繪動畫：建角預覽、選角中的那隻（82ms 一張，下一張沒到就等） ──
    const anim = { key: 'prince', frame: 714, at: 0, selKey: null, selFrame: 0 };
    function setPreview() {
        const key = KEY_OF_TYPE[cf.type][cf.sex], r = ANIM[key];
        anim.key = key; anim.frame = r[0]; anim.at = 0;
        $('class-preview-img').src = '/assets/start/' + key + '/' + r[0] + '.png';
        for (let n = r[0]; n <= r[1]; n++) frame(key, n);
    }
    //   只有建角、選角畫面在跑：進遊戲（或回登入）就停，回到選角／建角再開（show 叫 animOn）。原本進了遊戲還每幀空轉
    function animOn() { if (!animRaf && (cur === 'create' || cur === 'select')) animRaf = requestAnimationFrame(tick); }
    function tick(now) {
        animRaf = 0;
        if (cur !== 'create' && cur !== 'select') return;
        animRaf = requestAnimationFrame(tick);
        if (cur === 'create' && now - anim.at >= STEP_MS) {
            const r = ANIM[anim.key], next = anim.frame >= r[1] ? r[0] : anim.frame + 1;
            if (frameReady(anim.key, next)) { anim.frame = next; $('class-preview-img').src = '/assets/start/' + anim.key + '/' + next + '.png'; anim.at = now; }
            else if (frameBroken(anim.key, next)) anim.frame = next;
        }
        if (cur === 'select' && now - anim.selAt >= STEP_MS) {
            anim.selAt = now;
            const card = document.querySelector('.load-slot-card.selected.filled'), im = card && card.querySelector('img');
            if (!im) return;
            const key = card.getAttribute('data-key'), r = ANIM[key];
            if (anim.selKey !== key) { anim.selKey = key; anim.selFrame = r[0]; for (let n = r[0]; n <= r[1]; n++) frame(key, n); return; }
            const next = anim.selFrame >= r[1] ? r[0] : anim.selFrame + 1;
            if (frameReady(key, next)) { anim.selFrame = next; im.src = '/assets/start/' + key + '/' + next + '.png'; }
            else if (frameBroken(key, next)) anim.selFrame = next;
        }
    }
    anim.selAt = 0;
    animOn();

    // ── 登錄動畫（單機版 js/00z playLoginSlash）：劍從信紙後面劈開 → 轉暗；點畫面可略過，放不出來就直接進 ──
    let slashing = false;
    function slashReady(fx) {
        if (!fx || typeof fx.animate !== 'function' || land()) return false;   // 劈開信紙是對直式底圖做的：橫式直接進選角
        try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { /* */ }
        for (const im of fx.querySelectorAll('img')) if (!(im.complete && im.naturalWidth)) return false;
        return true;
    }
    function playSlash(done) {
        const fx = stage.querySelector('.login-slash');
        if (slashing) return;
        if (!slashReady(fx)) { done(); return; }
        slashing = true;
        let finished = false;
        const q = c => fx.querySelector(c), sword = q('.ls-sword'), A = q('.ls-a'), B = q('.ls-b');
        const note = stage.querySelector(':scope > .login-scroll-note');
        [A, B].forEach(h => { const o = h.querySelector('.login-scroll-note'); if (o) o.remove(); if (note) h.appendChild(note.cloneNode(true)); });
        let black = $('login-slash-black');
        if (!black) { black = document.createElement('div'); black.id = 'login-slash-black'; document.body.appendChild(black); }
        stage.classList.add('slashing');
        const anims = [], timers = [];
        const an = (el, kf, opt) => { const x = el.animate(kf, Object.assign({ fill: 'forwards' }, opt)); anims.push(x); return x; };
        an(q('.ls-flash'), [{ opacity: 0 }, { opacity: .9, offset: .3 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' });
        an(q('.ls-dim'), [{ opacity: 0 }, { opacity: .5 }], { duration: 400, easing: 'ease-out' });
        // 劍圖跟底圖上的劍重合（旋轉中心＝紅寶石）；劈下去那一刻劍身剛好躺在裂痕上（.ls-cut 那條線）
        an(q('.ls-cover'), [{ filter: 'brightness(1)' }, { filter: 'brightness(.5)' }], { duration: 400, easing: 'ease-out' });   // 蓋在劍上的那角 logo 跟著 .ls-dim 變暗
        an(sword, [
            { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
            { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1, offset: .15, easing: 'cubic-bezier(.6,0,.9,.6)' },
            { transform: 'translate(16.54cqw,2.98cqw) rotate(-3.5deg) scale(1.05)', opacity: 1, offset: .27, easing: 'ease-out' },
            { transform: 'translate(18.8cqw,7.2cqw) rotate(-5.5deg) scale(1.05)', opacity: 1, offset: .6 },
            { transform: 'translate(20.5cqw,11cqw) rotate(-8deg) scale(1.05)', opacity: 0 }
        ], { duration: 1300 });
        an(q('.ls-trail'), [{ opacity: 0 }, { opacity: .9, offset: .6 }, { opacity: 0 }], { delay: 200, duration: 220 });
        an(q('.ls-cut'), [{ opacity: 0, transform: 'rotate(126.42deg) scaleX(0)' }, { opacity: 1, transform: 'rotate(126.42deg) scaleX(1)', offset: .3 }, { opacity: 0, transform: 'rotate(126.42deg) scaleX(1)' }],
            { delay: 330, duration: 450, easing: 'ease-out' });
        an(q('.ls-hole'), [{ opacity: 0 }, { opacity: 1 }], { delay: 330, duration: 60 });
        an(A, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: 'translate(-4cqw,-2cqw) rotate(-3deg)', opacity: 1, offset: .25 }, { transform: 'translate(-11cqw,16cqw) rotate(-9deg)', opacity: 0 }],
            { delay: 370, duration: 700, easing: 'ease-in' });
        an(B, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: 'translate(4cqw,2cqw) rotate(3deg)', opacity: 1, offset: .25 }, { transform: 'translate(12cqw,22cqw) rotate(10deg)', opacity: 0 }],
            { delay: 370, duration: 700, easing: 'ease-in' });
        anims.push(stage.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-1.2cqw,.7cqw)' }, { transform: 'translate(1cqw,-.6cqw)' }, { transform: 'translate(-.5cqw,.3cqw)' }, { transform: 'translate(0,0)' }], { delay: 330, duration: 200 }));
        const fade = an(black, [{ opacity: 0 }, { opacity: 1 }], { delay: 800, duration: 350, easing: 'ease-in' });
        for (const [ms, key, v] of SLASH_SFX) timers.push(setTimeout(() => sfx(key, v), ms));   // 點畫面略過動畫（finish 清掉 timers）就不放
        function finish() {
            if (finished) return; finished = true;
            timers.forEach(clearTimeout); fx.removeEventListener('pointerdown', finish);
            black.style.opacity = '1';
            try { done(); } catch (e) { console.warn('[登錄動畫] 進選角失敗', e); }
            anims.forEach(x => { try { x.cancel(); } catch (e) { /* */ } });
            stage.classList.remove('slashing');
            const out = black.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-out' });
            out.onfinish = () => { black.style.opacity = '0'; };
            slashing = false;
        }
        fade.onfinish = finish;
        timers.push(setTimeout(finish, 2200));   // 保險：分頁在背景時動畫事件不來也一定會進
        fx.addEventListener('pointerdown', finish);
    }

    // 登出／斷線回來：保留本機帳號名稱
    function showLogin(t) { busy = false; waitChars = false;  show('login'); say(t || '', !!t); fillSaved(); if (!acc.value) acc.value = 'offline';  }
    // 遊戲中「回選角」：伺服器接著重送角色列表，收齊就切到選角（不播登入動畫）
    function backToSelect() { busy = false; slashDone = true; complete = false; waitChars = true; }

    return {
        show, showLogin, loginOk, passOk, loginFailed, queue, setChars, deleted, createFailed, created, toast, backToSelect, maint,
        get screen() { return cur; },
    };
}
