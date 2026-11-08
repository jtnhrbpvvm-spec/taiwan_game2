/* RO Survivors 繁體中文書籤（ro-survivors.com）
   這是原始碼；實際的書籤檔 ro-zh.js 由 tools\build_zh.py 把翻譯表填進 ZH 那一行產生，不要直接改 ro-zh.js。

   做法：遊戲的翻譯函式查的是 {es:null,en:英文表}[設定的語言]。這裡在 Object.prototype 放一個 zh 的
   getter，只有遇到那張語言表時才回傳中文表，再把遊戲語言切成 zh（點語言選單裡加上的「繁體中文」）。
   中文表用西文原文當鍵；沒翻到的字退回遊戲自己的英文。
   怪物、物品、卡片、技能名是遊戲直接顯示的英文原名，不經過翻譯函式，另外在畫面文字（DOM、canvas）換成台版譯名。
   設定存檔時把 lang 存回原本的語言，沒點書籤時遊戲不會變成西文。 */
const VERSION = 'V4';
/*ZH*/const ZH = {"ui":{},"names":{},"news":{}};/*END*/
(() => {
  const W = window;
  if (W.__roZh) { W.__roZh.activate(true); return; }

  const UI = ZH.ui, NM = ZH.names;
  const SETKEY = 'ro-survivors:settings';
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  let EN = null;
  const isZh = () => (document.documentElement.lang || '').startsWith('zh');

  /* ---------- 名稱替換（英文原名 → 台版譯名） ---------- */
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameList = Object.keys(NM).sort((a, b) => b.length - a.length);
  const NRE = nameList.length ? new RegExp('(?<![A-Za-z])(' + nameList.map(esc).join('|') + ')(?![A-Za-z])', 'g') : null;
  const cache = new Map();
  function tn(s) {
    if (!NRE || typeof s !== 'string' || !/[A-Za-z]/.test(s)) return s;
    let r = cache.get(s);
    if (r === undefined) {
      r = hasOwn(NM, s) ? NM[s] : s.replace(NRE, m => NM[m]);
      if (cache.size > 8000) cache.clear();
      cache.set(s, r);
    }
    return r;
  }

  /* ---------- 中文語言表 ---------- */
  const dict = new Proxy(Object.create(null), {
    get(_, k) {
      if (typeof k !== 'string') return undefined;
      if (hasOwn(UI, k)) return UI[k];
      if (EN && hasOwn(EN, k)) return tn(EN[k]);
      if (hasOwn(NM, k)) return NM[k];
      return undefined;
    },
    has(_, k) { return typeof k === 'string' && (hasOwn(UI, k) || (EN && hasOwn(EN, k)) || hasOwn(NM, k)); },
  });
  Object.defineProperty(Object.prototype, 'zh', {
    configurable: true, enumerable: false,
    get() {
      if (this && hasOwn(this, 'es') && hasOwn(this, 'en')) {
        if (this.es === null && this.en && typeof this.en === 'object') { EN = this.en; return dict; }
        return typeof this.en === 'string' ? tn(this.en) : this.en;   /* 其他 {es,en} 雙語資料：用英文 */
      }
      return undefined;
    },
    set(v) { Object.defineProperty(this, 'zh', { value: v, writable: true, enumerable: true, configurable: true }); },
  });

  /* ---------- 設定不要存成 zh（沒點書籤時才不會變西文） ---------- */
  let prevLang = 'en';
  try {
    const s = JSON.parse(localStorage.getItem(SETKEY) || '{}');
    if (s.lang === 'es' || s.lang === 'en') prevLang = s.lang;
  } catch (e) { /* 沒有設定 */ }
  const origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    if (k === SETKEY && typeof v === 'string' && v.indexOf('"lang":"zh"') >= 0) v = v.replace('"lang":"zh"', '"lang":"' + prevLang + '"');
    return origSet.call(this, k, v);
  };

  /* ---------- 數字、日期格式 ---------- */
  const numLoc = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function (loc, opt) {
    return numLoc.call(this, isZh() && loc === 'es-ES' ? 'en-US' : loc, opt);
  };
  /* 中文模式下遊戲顯示的時間（維修開始時間、封鎖到期日等）一律用台灣時區 */
  for (const fn of ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString']) {
    const orig = Date.prototype[fn];
    Date.prototype[fn] = function (loc, opt) {
      if (!(isZh() && /^(es|en)-/.test(loc || ''))) return orig.call(this, loc, opt);
      const o = Object.assign({}, opt);
      if (!o.timeZone) o.timeZone = TW_TZ;
      if ((o.hour || o.timeStyle) && !o.hour12 && !o.hourCycle) o.hourCycle = 'h23';
      let r = orig.call(this, 'zh-TW', o);
      if (o.timeZone === TW_TZ) r = r.replace(/\s*\[?(GMT|UTC)\+8\]?/, '（台灣時間）');
      return r;
    };
  }

  /* ---------- 維修公告：伺服器的 status.json 是自由文字「西文 || 英文」，時間寫成「22:00 (Madrid time)」。
     這裡把時間換算成台灣時間、常見句子翻成中文，改寫成「中文 || 英文」（中文模式下遊戲顯示 || 前面那段） ---------- */
  const TW_TZ = 'Asia/Taipei';
  const ZONES = [
    [/madrid|spain|españa|espana|peninsular|\bCES?T\b|hora española/i, 'Europe/Madrid'],
    [/\b(UTC|GMT)\b/i, 'UTC'],
  ];
  const partsIn = (t, tz) => {
    const p = {};
    for (const x of new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(t)) p[x.type] = +x.value;
    return p;
  };
  /* 某時區的「幾點幾分」→ 接下來第一個那樣的時刻（3 小時內剛過的也算，可能正在維修） */
  function wallToDate(h, m, tz) {
    const now = Date.now(), p = partsIn(now, tz);
    let best = null;
    for (const dd of [-1, 0, 1, 2]) {
      const guess = Date.UTC(p.year, p.month - 1, p.day + dd, h, m);
      let t = guess;
      for (let i = 0; i < 2; i++) {   /* 兩次修正夏令時間 */
        const q = partsIn(t, tz);
        t = guess - (Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute) - Math.floor(t / 60000) * 60000);
      }
      if (t > now - 3 * 3600e3 && (best === null || t < best)) best = t;
    }
    return new Date(best);
  }
  const WEEK = '日一二三四五六';
  function twTime(d) {
    const p = partsIn(d, TW_TZ), wd = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
    return `台灣時間 ${p.month}/${p.day}（${WEEK[wd]}）${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
  }
  /* 「22:00 (Madrid time)」「22h (Madrid)」「22:00 CET」→ 台灣時間 */
  const TIME_RE = /\b(\d{1,2})(?:[:.h](\d{2}))?\s*h?\s*(?:\(([^)]{2,30})\)|(CEST|CET|UTC|GMT|Madrid time|hora de Madrid|hora peninsular))/gi;
  function convTimes(s, cb) {
    return s.replace(TIME_RE, (all, h, m, paren, word) => {
      const z = paren || word, hit = ZONES.find(([re]) => re.test(z));
      if (!hit || +h > 23 || +(m || 0) > 59) return all;
      return cb(twTime(wallToDate(+h, +(m || 0), hit[1])), all);
    });
  }
  /* 常見句子（英文或西文），{T} 是換算好的台灣時間；新句型加在這裡 */
  const MAINT_SENT = [
    [/^(?:scheduled )?maintenance (?:at|starts at|begins at) \{T\}\.?$/i, '{T} 開始維修。'],
    [/^mantenimiento (?:a las|empieza a las|programado a las) \{T\}\.?$/i, '{T} 開始維修。'],
    [/^(?:scheduled )?maintenance (?:from )?\{T\} ?(?:to|until|-|–) ?\{T\}\.?$/i, '維修時間：{T} ～ {T}。'],
    [/^(?:the )?server (?:will be|is) (?:down|offline) (?:at|from) \{T\}\.?$/i, '伺服器將在 {T} 關閉維修。'],
    [/^(?:we(?:'|’)ll be|we will be) back (?:at|by|around) \{T\}\.?$/i, '預計 {T} 恢復。'],
    [/^finish your (.+?) runs? before (?:then|that)\.?$/i, '請在那之前打完{1}的遊戲局。'],
    [/^finish your (.+?) before (?:then|that)\.?$/i, '請在那之前完成{1}。'],
    [/^termina antes tus partidas de (?:la |el )?(.+?)\.?$/i, '請在那之前打完{1}的遊戲局。'],
    [/^(?:it|maintenance) (?:will|should) (?:take|last) (?:about |around )?(\d+) minutes\.?$/i, '預計維修約 {1} 分鐘。'],
    [/^(?:it|maintenance) (?:will|should) (?:take|last) (?:about |around )?(\d+) hours?\.?$/i, '預計維修約 {1} 小時。'],
    [/^thanks? (?:you )?for (?:your )?(?:patience|understanding)[.!]*$/i, '感謝耐心等候！'],
    [/^sorry for the inconvenience[.!]*$/i, '造成不便，敬請見諒。'],
  ];
  function maintZh(text) {
    const times = [];
    const s = convTimes(text, t => { times.push(t); return '{T}'; });
    return s.split(/(?<=[.!?。])\s+/).map(sen => {
      let out = null;
      for (const [re, zh] of MAINT_SENT) {
        const m = re.exec(sen.trim());
        if (m) { out = zh.replace(/\{(\d)\}/g, (_, i) => tn(m[+i]).replace(/^the /i, '')); break; }
      }
      if (out === null) out = tn(sen);   /* 沒對到的句子：保留原文，只換名稱 */
      return out.replace(/\{T\}/g, () => times.shift() || '');
    }).join(' ').replace(/([。！？]) (?=\S)/g, '$1');
  }
  function maintMsg(msg) {
    const [es, en] = msg.split('||').map(x => (x || '').trim());
    const src = en || es;
    if (!src) return msg;
    return `${maintZh(src)} || ${convTimes(src, (t, all) => `${all} [${t.replace('台灣時間', 'Taiwan')}]`)}`;
  }
  const origFetch = W.fetch;
  W.fetch = function (input, init) {
    const p = origFetch.apply(this, arguments);
    const url = typeof input === 'string' ? input : input && input.url;
    if (!url || !/(^|\/)status\.json(\?|$)/.test(String(url))) return p;
    return p.then(async r => {
      try {
        if (!r.ok) return r;
        const j = await r.clone().json();
        if (!j || typeof j.message !== 'string' || !j.message.trim()) return r;
        j.message = maintMsg(j.message);
        return new Response(JSON.stringify(j), { status: r.status, headers: { 'content-type': 'application/json' } });
      } catch (e) { return r; }
    });
  };
  /* 書籤載入前遊戲已經讀過一次 status.json：觸發遊戲重讀 */
  setTimeout(() => { if (document.visibilityState === 'visible') document.dispatchEvent(new Event('visibilitychange')); }, 0);

  /* ---------- 畫面上的英文名稱 ---------- */
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1 };
  const ATTRS = ['title', 'placeholder', 'aria-label'];
  function fixText(n) {
    const p = n.parentElement;
    if (!p || SKIP[p.tagName] || p.isContentEditable) return;
    const v = n.nodeValue, r = tn(v);
    if (r !== v) n.nodeValue = r;
  }
  function fixAttr(el, a) {
    const v = el.getAttribute(a);
    if (v) { const r = tn(v); if (r !== v) el.setAttribute(a, r); }
  }
  function walk(root) {
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    for (const a of ATTRS) if (root.hasAttribute(a)) fixAttr(root, a);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) fixText(n);
      else for (const a of ATTRS) if (n.hasAttribute(a)) fixAttr(n, a);
    }
    addOptButton(root);
  }
  /* ---------- 遊戲公告（最新消息）：遊戲顯示英文版 markdown，這裡逐段換成中文 ---------- */
  const NEWS = ZH.news || {};
  const NEWS_TAG = { new: '新增', change: '調整', better: '改善', fix: '修正', other: null };
  const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
  const escH = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const mdHtml = s => escH(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const norm = s => s.replace(/\s+/g, ' ').trim();
  function translateNews() {
    const body = document.getElementById('news-body');
    if (!body || !isZh()) return;
    for (const el of body.querySelectorAll('h2, h3, p, li')) {
      if (el.dataset.zh) continue;
      el.dataset.zh = '1';
      if (el.tagName === 'H2') {
        const m = /^(.*?)\s+[—–-]\s+([A-Z][a-z]+) (\d{1,2}), (\d{4})$/.exec(norm(el.textContent));
        if (m && MONTHS[m[2]]) el.textContent = `${m[1]} — ${m[4]} 年 ${MONTHS[m[2]]} 月 ${m[3]} 日`;
        continue;
      }
      if (el.tagName === 'P' && el.classList.contains('news-empty')) continue;
      const tag = el.tagName === 'LI' ? el.querySelector('.news-tag') : null;
      const clone = el.cloneNode(true);
      const ct = clone.querySelector('.news-tag');
      if (ct) ct.remove();
      const zh = NEWS[norm(clone.textContent)];
      if (tag) {
        const kind = (/tag-(\w+)/.exec(tag.className) || [])[1];
        if (NEWS_TAG[kind]) tag.textContent = NEWS_TAG[kind];
      }
      if (zh === undefined) { walk(el); continue; }   /* 還沒翻的段落：至少把名稱換成中文 */
      if (tag) { el.innerHTML = ''; el.appendChild(tag); el.insertAdjacentHTML('beforeend', ' ' + mdHtml(zh)); }
      else el.innerHTML = mdHtml(zh);
    }
  }
  let newsTimer = 0;
  const queueNews = () => { if (!newsTimer) newsTimer = setTimeout(() => { newsTimer = 0; translateNews(); }, 0); };

  const mo = new MutationObserver(muts => {
    if (!isZh()) { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) addOptButton(n); return; }
    for (const m of muts) {
      /* 公告區先不做名稱替換（會讓英文對不上翻譯表），交給 translateNews */
      const tgt = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (tgt && tgt.closest('#news-body')) { queueNews(); continue; }
      if (m.type === 'characterData') fixText(m.target);
      else if (m.type === 'attributes') fixAttr(m.target, m.attributeName);
      else for (const n of m.addedNodes) walk(n);
    }
  });

  /* canvas 上畫的字（Pixi 的文字） */
  const C2 = CanvasRenderingContext2D.prototype;
  for (const fn of ['fillText', 'strokeText', 'measureText']) {
    const orig = C2[fn];
    C2[fn] = function (t, ...rest) { return orig.call(this, isZh() ? tn(t) : t, ...rest); };
  }

  /* ---------- 語言選單加「繁體中文」 ---------- */
  function addOptButton(root) {
    const segs = root.querySelectorAll ? root.querySelectorAll('.opt-seg') : [];
    for (const seg of segs) {
      if (!seg.querySelector('[data-lang]') || seg.querySelector('[data-lang="zh"]')) continue;
      const b = document.createElement('button');
      b.className = 'ro-btn small' + (isZh() ? ' active' : '');
      b.dataset.lang = 'zh';
      b.textContent = '繁體中文';
      if (isZh()) for (const o of seg.querySelectorAll('[data-lang]')) o.classList.remove('active');
      seg.appendChild(b);
    }
  }
  function splashItem() {
    const ul = document.querySelector('.sp-lang-list');
    if (!ul || !ul.children.length) return null;
    let li = ul.querySelector('[data-lang="zh"]');
    if (!li) {
      li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.tabIndex = -1;
      li.dataset.lang = 'zh';
      li.innerHTML = '繁體中文<small>ZH</small>';
      ul.appendChild(li);
    }
    return li;
  }

  function onLang() {
    if (!isZh()) return;
    document.documentElement.lang = 'zh-Hant';
    translateNews();
    walk(document.body);
  }
  addEventListener('ro-lang', onLang);

  function toast(msg) {
    const d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483647;background:#2b3a67;color:#fff;' +
      'padding:8px 18px;border-radius:10px;font:600 15px/1.4 "Microsoft JhengHei",sans-serif;box-shadow:0 4px 14px #0006;pointer-events:none;transition:opacity .4s';
    document.body.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; }, 2200);
    setTimeout(() => d.remove(), 2800);
  }

  /* ---------- 天賦頁（talents.html）：遊戲原本開新分頁，新分頁沒有書籤就變回英文。
     中文模式下改成遊戲內跳窗（同網域 iframe），再把這支書籤載入 iframe 裡切成中文 ---------- */
  const SELF = import.meta.url;
  const isTalentsHref = h => /(^|\/)talents\.html([#?]|$)/.test(h || '');
  function closeTalents() {
    const ov = document.getElementById('rozh-talents');
    if (ov) ov.remove();
  }
  function openTalents(href) {
    closeTalents();
    const ov = document.createElement('div');
    ov.id = 'rozh-talents';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(20,28,56,.6);display:flex;align-items:center;justify-content:center;padding:2vh 2vw';
    const box = document.createElement('div');
    box.style.cssText = 'position:relative;width:min(1220px,100%);height:100%;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px #0008;background:#8fa8de';
    const fr = document.createElement('iframe');
    fr.style.cssText = 'width:100%;height:100%;border:0;display:block';
    fr.title = '天賦';
    const x = document.createElement('button');
    x.textContent = '✕';
    x.title = '關閉';
    x.style.cssText = 'position:absolute;top:10px;right:12px;z-index:1;width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:#3a5bb4;color:#fff;font:900 17px/1 sans-serif;cursor:pointer;box-shadow:0 2px 8px #0006';
    x.onclick = closeTalents;
    ov.addEventListener('pointerdown', e => { if (e.target === ov) closeTalents(); });
    for (const ev of ['pointerdown', 'touchstart', 'mousedown', 'wheel', 'keydown']) ov.addEventListener(ev, e => e.stopPropagation());
    fr.addEventListener('load', () => {
      try {
        const w = fr.contentWindow, d = fr.contentDocument;
        w.addEventListener('keydown', e => { if (e.key === 'Escape') closeTalents(); });
        if (w.__roZh || d.querySelector('script[data-rozh]')) return;
        const s = d.createElement('script');
        s.type = 'module'; s.src = SELF; s.dataset.rozh = '1';
        d.head.appendChild(s);
      } catch (e) { /* 不同網域就算了 */ }
    });
    fr.src = href;
    box.append(fr, x);
    ov.appendChild(box);
    document.body.appendChild(ov);
    fr.focus();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('rozh-talents')) { e.stopPropagation(); closeTalents(); } }, true);
  document.addEventListener('click', e => {
    if (!isZh() || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || !isTalentsHref(a.getAttribute('href'))) return;
    e.preventDefault(); e.stopPropagation();
    openTalents(a.href);
  }, true);
  const origOpen = W.open;
  W.open = function (url) {
    if (isZh() && isTalentsHref(String(url || ''))) { openTalents(new URL(url, location.href).href); return null; }
    return origOpen.apply(this, arguments);
  };

  /* 在天賦頁裡：加「中文」按鈕並切過去；「開始遊戲／回到遊戲」在跳窗裡就是關閉跳窗 */
  const talentsLang = () => document.querySelector('header .lang [data-l]') && document.querySelector('header .lang');
  let host = null;
  try { if (W !== W.top && W.parent.__roZh && W.parent.location.origin === location.origin) host = W.parent.__roZh; } catch (e) { /* 不是遊戲內跳窗 */ }
  if (host) {
    const st = document.createElement('style');
    st.textContent = 'header{padding-right:58px!important}';   /* 留位置給跳窗的關閉鈕 */
    document.head.appendChild(st);
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const h = a.getAttribute('href');
      if (h === './' || h === '/' || h === 'index.html' || h === './index.html') { e.preventDefault(); e.stopPropagation(); host.closeTalents(); }
      else if (!isTalentsHref(h) && !h.startsWith('#')) a.target = '_blank';   /* 其他連結開新分頁，不要把跳窗換掉 */
    }, true);
  }
  function talentsZh(again) {
    const box = talentsLang();
    let b = box.querySelector('[data-l="zh"]');
    if (!b) {
      b = document.createElement('button');
      b.dataset.l = 'zh';
      b.textContent = '中文';
      box.appendChild(b);
    }
    /* 天賦頁讀完圖示清單才掛上點擊事件，等職業列表出現再點 */
    const jobs = document.getElementById('jobs');
    if (jobs && !jobs.children.length) {
      if (++tries < 150) return void setTimeout(talentsZh, 200, again);
    }
    if (!isZh()) b.click();
    if (isZh()) { walk(document.body); if (again && !host) toast('繁體中文已啟用（' + VERSION + '）'); }
  }

  let tries = 0;
  function activate(again) {
    if (talentsLang()) return talentsZh(again);
    if (isZh()) { onLang(); if (again) toast('繁體中文已啟用（' + VERSION + '）'); return; }
    const li = splashItem();
    if (!li) {
      if (++tries < 150) return void setTimeout(activate, 200, again);
      toast('找不到語言選單，請到「選項 → 語言」點「繁體中文」');
      return;
    }
    li.click();
    if (isZh()) toast('繁體中文已啟用（' + VERSION + '）');
    else toast('請到「選項 → 語言」點「繁體中文」');
  }

  mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  addOptButton(document.body);
  W.__roZh = { VERSION, activate, tn, dict, ZH, maintMsg, openTalents, closeTalents };
  activate(true);
})();
