// 提煉魔石（黑暗妖精 100）連續提煉（本機改動第 123 項，站長 2026-10-23；伺服器 web/WebBringStone）
//   原版：放魔法時目標＝一顆一～四級黑魔石（40320～40323），扣 1 顆、成功給下一級 1 顆（成功率看等級、精神），一次一顆。
//   這裡：點魔法 → 列出身上的一～四級 → 選一種、填次數（「最大」＝顆數；魔力不夠伺服器會站著等回滿再繼續）→「開始」送 C_Web 123（哪種、幾次），
//   伺服器一次一次照原版放（學會沒有、魔力、材料、施法間隔都在伺服器判斷），每一次回 S_Web 123（做了、成功、失敗、停下的原因）。
//   視窗關掉照樣繼續；結束時視窗沒開就跳一句。「停止」送 C_Web 123 動作 2。
//   舊伺服器（不認 123）：等 WAIT_MS 沒回 → 這次改成一顆一顆的原版封包（只放一次），之後都這樣。
//   伺服器在等魔力（S_Web 123 waitMp）：畫面顯示「等待魔力中 x/y」。
//   用法：const st = createStone({ items() → parseItem 過的背包, mp() → 目前魔力（舊伺服器一次一顆時用）, send(stone, times) / stop() / single(objId) → false＝沒送出, toast });
//         st.open(skill)；st.update(S_Web 123 的內容)；換角色、離開世界 st.reset()
import { itemIcon } from './icons.js';
import { itemById, TPL_OF } from './items.js';

export const STONES = [40320, 40321, 40322, 40323];
const MAX_TIMES = 9999, WAIT_MS = 4000;
// 伺服器 WebBringStone 的結束原因（0＝還在跑）
export const REASON = ['', '完成', '黑魔石用完了', '魔力不夠', '死亡，已停止', '移動了，已停止', '動不了，已停止', '受到攻擊，已停止',
    '先關掉 AUTO 再提煉', '已停止', '提煉不了', '還沒學會提煉魔石', '這個不能提煉', '魔力一直沒有回復，已停止'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tplOf = p => (TPL_OF.has(p.id) ? TPL_OF.get(p.id) : (p.tpl ? p.tpl.id : 0));
const fmt = n => (n || 0).toLocaleString();

// 次數上限（「最大」）：身上幾顆，最多 9999；魔力不限（不夠時伺服器站著等回滿）（純函式，測試用）
export function maxTimes(count) {
    return Math.max(0, Math.min(count, MAX_TIMES));
}
// 輸入框的字 → 要送的次數：只留數字、1～min(顆數, 9999)；不合法回 0
export function clampInput(text, count) {
    const n = parseInt(String(text || '').replace(/\D+/g, ''), 10);
    if (!(n > 0)) return 0;
    return Math.min(n, count, MAX_TIMES);
}

export function createStone(cb) {
    let win = null, skill = null, sel = 0, typed = '', run = null, waitT = 0, oldServer = false;
    // run：{ stone, times, done, ok, fail, reason（0＝還在跑）, waiting（送了開始、還沒回） }

    // 身上的一～四級：[{ tpl, name, count, p（第一顆，原版封包要物件編號）}]，一級到四級
    function stones() {
        const by = new Map();
        for (const p of cb.items()) {
            const t = tplOf(p);
            if (!STONES.includes(t)) continue;
            const o = by.get(t) || { tpl: t, name: p.base, count: 0, p };
            o.count += p.count || 1; by.set(t, o);
        }
        return STONES.filter(t => by.has(t)).map(t => by.get(t));
    }
    const countOf = t => { const s = stones().find(x => x.tpl === t); return s ? s.count : 0; };
    const nameOf = t => { const s = stones().find(x => x.tpl === t); if (s) return s.name; const b = itemById(t); return b ? b.name : ''; };
    const iconOf = t => { const s = stones().find(x => x.tpl === t); if (s) return itemIcon(s.p); const b = itemById(t); return b ? itemIcon({ name: b.name, nid: b.nid }) : ''; };
    const img = t => '<img alt="" src="' + esc(iconOf(t)) + '">';
    const cost = () => (skill && skill.mp) || 5;

    // 視窗還在畫面上（hud.closeAll 會把所有 .lmui-ov 拿掉，留著的參照就不算）
    const shown = () => !!(win && win.isConnected);
    function shell() {
        if (shown()) return;
        win = document.createElement('div'); win.id = 'lmui-stonepick'; win.className = 'lmui-ov bs-ov';
        win.innerHTML = '<div class="box"><div class="hd">提煉魔石<button type="button" data-x="1" aria-label="關閉">✕</button></div><div class="bd"></div><div class="ft"></div></div>';
        win.addEventListener('click', onClick);
        win.addEventListener('input', e => {
            if (!e.target.matches('.bs-n')) return;
            e.target.value = e.target.value.replace(/\D+/g, '').slice(0, 4); typed = e.target.value; syncStart();
        });
        win.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && e.target.matches('.bs-n')) { e.preventDefault(); start(); } });   // 數字鍵不要變快捷鍵、方向鍵不要走路
        document.body.appendChild(win);
    }
    function close() { if (win) { win.remove(); win = null; } }
    function onClick(e) {
        if (e.target === win || e.target.closest('[data-x]')) { close(); return; }
        const o = e.target.closest('.opt[data-t]');
        if (o) { sel = +o.getAttribute('data-t'); typed = ''; render(); return; }
        const a = e.target.closest('[data-a]'); if (!a || a.disabled) return;
        const k = a.getAttribute('data-a');
        if (k === 'max') { const inp = win.querySelector('.bs-n'); const m = maxTimes(countOf(sel)); if (inp && m > 0) { inp.value = String(m); typed = inp.value; syncStart(); } }
        else if (k === 'go') start();
        else if (k === 'stop') { if (cb.stop()) a.disabled = true; }
        else if (k === 'again') { run = null; render(); }
        else if (k === 'close') close();
    }

    // ── 選擇 ──
    function pickHtml(list) {
        const m = maxTimes(countOf(sel));
        const val = typed !== '' ? typed : '1';
        return '<div class="bs-note">成功升一級，失敗會損失那一顆</div>' +
            '<div class="grid bs-list">' + list.map(s => '<button type="button" class="opt' + (s.tpl === sel ? ' on' : '') + '" data-t="' + s.tpl + '">' + img(s.tpl) +
                '<span>' + esc(s.name) + '</span><small>×' + fmt(s.count) + '</small></button>').join('') + '</div>' +
            '<div class="bs-qty"><label for="bs-n">次數</label><input id="bs-n" class="bs-n" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="go" autocomplete="off" maxlength="4" value="' + esc(val) + '">' +
            '<button type="button" class="bs-max" data-a="max"' + (m > 0 ? '' : ' disabled') + '>最大</button></div>';
    }
    function syncStart() {
        if (!win) return;
        const b = win.querySelector('[data-a="go"]'), inp = win.querySelector('.bs-n');
        if (b && inp) b.disabled = !(clampInput(inp.value, countOf(sel)) > 0);
    }
    function start() {
        if (run && !run.reason) return;
        const inp = win && win.querySelector('.bs-n'); if (!inp) return;
        const n = clampInput(inp.value, countOf(sel));
        if (!n) { inp.focus(); return; }
        if (oldServer) {   // 舊伺服器：原版封包一次一顆（魔力不夠就說，伺服器不會等）；視窗留著可以再按
            if (cb.mp() < cost()) { cb.toast('魔力不夠'); return; }
            const s = stones().find(x => x.tpl === sel);
            if (s) cb.single(s.p.id);
            setTimeout(render, 300);
            return;
        }
        // 先記好「開始了」再送：單機版伺服器是同步回的（送的當下就回 S_Web 123），
        //   原本送完才記 → 伺服器馬上回的「先關掉 AUTO」等拒絕被蓋掉、4 秒後當成舊伺服器只提煉一顆、視窗自己關掉（玩家 2026-11-13 回報）
        run = { stone: sel, times: n, done: 0, ok: 0, fail: 0, reason: 0, waiting: true };
        clearTimeout(waitT);
        waitT = setTimeout(() => {
            if (!run || !run.waiting) return;
            oldServer = true; const s = stones().find(x => x.tpl === run.stone); run = null;
            cb.toast('伺服器更新中，先一次提煉一顆');
            if (s) cb.single(s.p.id);
            render();
        }, WAIT_MS);
        if (!cb.send(sel, n)) { clearTimeout(waitT); run = null; }
        render();
    }

    // ── 進行中、結束 ──
    function runHtml() {
        const r = run, next = r.stone + 1, pct = r.times ? Math.round(r.done * 100 / r.times) : 0, over = !!r.reason;
        return '<div class="bs-flow"><span class="bs-it">' + img(r.stone) + '<b>' + esc(nameOf(r.stone)) + '</b></span><i class="bs-arrow"></i>' +
                '<span class="bs-it">' + img(next) + '<b>' + esc(nameOf(next)) + '</b></span></div>' +
            '<div class="bs-bar' + (over ? ' over' : '') + '"><i style="width:' + pct + '%"></i><span>' + fmt(r.done) + ' / ' + fmt(r.times) + '</span></div>' +
            '<div class="bs-stats"><div class="ok"><small>成功</small><b>' + fmt(r.ok) + '</b></div><div class="ng"><small>失敗</small><b>' + fmt(r.fail) + '</b></div>' +
                '<div><small>剩下</small><b>' + fmt(countOf(r.stone)) + '</b></div></div>' +
            (r.ok ? '<div class="bs-got">' + img(next) + '<span>獲得 ' + esc(nameOf(next)) + '</span><b>×' + fmt(r.ok) + '</b></div>' : '') +
            (!over && r.waitMp ? '<div class="bs-wait"><span>等待魔力中</span><div class="bs-mp"><i style="width:' + (r.maxMp ? Math.round(Math.min(r.mp, r.maxMp) * 100 / r.maxMp) : 0) + '%"></i><b>' + fmt(r.mp) + ' / ' + fmt(r.maxMp) + '</b></div></div>' : '') +
            '<div class="bs-msg' + (over ? (r.reason === 1 ? ' good' : ' bad') : r.waitMp ? ' wait' : '') + '">' + (over ? esc(REASON[r.reason] || '已停止') : r.waiting ? '開始提煉…' : r.waitMp ? '魔力回滿後自動繼續' : '提煉中…') + '</div>';
    }

    function render() {
        if (!shown()) return;
        const bd = win.querySelector('.bd'), ft = win.querySelector('.ft');
        win.classList.toggle('bs-running', !!run);
        if (run) {
            bd.innerHTML = runHtml();
            ft.innerHTML = run.reason ? '<button type="button" data-a="again">再提煉</button><button type="button" data-a="close">關閉</button>'
                : '<button type="button" class="danger" data-a="stop">停止</button>';
            return;
        }
        const list = stones();
        if (!list.length) { bd.innerHTML = '<div class="bs-msg bad">身上沒有一～四級黑魔石</div>'; ft.innerHTML = '<button type="button" data-a="close">關閉</button>'; return; }
        if (!list.some(s => s.tpl === sel)) sel = list[0].tpl;
        bd.innerHTML = pickHtml(list);
        ft.innerHTML = '<button type="button" class="go" data-a="go">開始</button>';
        syncStart();
    }

    return {
        // 點了「提煉魔石」（魔法視窗、快捷列）
        open(s) {
            skill = s || skill;
            if (!run && !stones().length) { cb.toast('身上沒有一～四級黑魔石'); return; }
            if (run && run.reason) run = null;   // 上一次結束了：從選擇開始
            try { const ae = document.activeElement; if (ae && ae.blur && ae !== document.body) ae.blur(); } catch (e) { /* 收掉聊天輸入框的鍵盤 */ }
            shell(); render();
        },
        // S_Web 123
        update(d) {
            if (!d) return;
            clearTimeout(waitT); oldServer = false;
            const prev = run;
            run = { stone: d.stone, times: d.times, done: d.done, ok: d.ok, fail: d.fail, reason: d.reason, waiting: false, waitMp: !!d.waitMp, mp: d.mp || 0, maxMp: d.maxMp || 0 };
            if (d.reason && !shown()) {   // 視窗關著：結束時說一句
                cb.toast(d.done ? '提煉魔石：成功 ' + fmt(d.ok) + '、失敗 ' + fmt(d.fail) + (d.reason === 1 ? '' : '（' + REASON[d.reason] + '）') : (REASON[d.reason] || '提煉不了'));
            }
            if (d.reason && !prev && !shown()) run = null;
            render();
        },
        running: () => !!(run && !run.reason),
        reset() { clearTimeout(waitT); run = null; oldServer = false; close(); },
        close,
    };
}
