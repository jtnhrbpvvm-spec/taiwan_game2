/* RO Survivors 繁體中文書籤（ro-survivors.com）
   這是原始碼；實際的書籤檔 ro-zh.js 由 tools\build_zh.py 把翻譯表填進 ZH 那一行產生，不要直接改 ro-zh.js。

   做法：遊戲的翻譯函式查的是 {es:null,en:英文表}[設定的語言]。這裡在 Object.prototype 放一個 zh 的
   getter，只有遇到那張語言表時才回傳中文表，再把遊戲語言切成 zh（點語言選單裡加上的「繁體中文」）。
   中文表用西文原文當鍵；沒翻到的字退回遊戲自己的英文。
   怪物、物品、卡片、技能名是遊戲直接顯示的英文原名，不經過翻譯函式，另外在畫面文字（DOM、canvas）換成台版譯名。
   設定存檔時把 lang 存回原本的語言，沒點書籤時遊戲不會變成西文。 */
const VERSION = 'V2';
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
  for (const fn of ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString']) {
    const orig = Date.prototype[fn];
    Date.prototype[fn] = function (loc, opt) {
      return orig.call(this, isZh() && /^(es|en)-/.test(loc || '') ? 'zh-TW' : loc, opt);
    };
  }

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

  let tries = 0;
  function activate(again) {
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
  W.__roZh = { VERSION, activate, tn, dict, ZH };
  activate(true);
})();
