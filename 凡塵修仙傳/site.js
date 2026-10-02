// 全站共用：頁面頂部的全站搜尋、物品彈窗（文字裡出現的物品名稱可以點開看取得方式與用途）。
// 每個頁面都要 <script src="site.js"></script>（放在 profile.js 後面）。
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ready = fn => { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); };
  const loadScript = (src, cb) => { const s = document.createElement("script"); s.src = src; s.onload = cb; s.onerror = cb; document.head.appendChild(s); };

  const css = `
:root{--s-get:#15803d;--s-use:#1d4ed8;--s-warn:#b91c1c;--s-mark:#fde68a;--s-shadow:0 8px 28px rgba(0,0,0,.18)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--s-get:#86efac;--s-use:#93c5fd;--s-warn:#fca5a5;--s-shadow:0 8px 28px rgba(0,0,0,.6)}}
#gs{position:relative;margin:0 0 10px;z-index:30}
#gs input{box-sizing:border-box;width:100%;font:inherit;font-size:14px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg)}
#gs input:focus{outline:2px solid var(--acc);outline-offset:0;border-color:var(--acc)}
#gsOut{position:absolute;left:0;right:0;top:100%;margin-top:4px;max-height:min(70vh,560px);overflow:auto;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:10px;box-shadow:var(--s-shadow);padding:6px;font-size:13.5px;line-height:1.6}
#gsOut .gs-h{font-size:12px;color:var(--mute);padding:8px 8px 2px;font-weight:bold}
#gsOut a.gs-r,#gsOut button.gs-r{display:block;width:100%;box-sizing:border-box;text-align:left;font:inherit;background:none;border:0;color:var(--fg);text-decoration:none;padding:6px 8px;border-radius:6px;cursor:pointer}
#gsOut .gs-r:hover,#gsOut .gs-r:focus-visible,#gsOut .gs-r.cur{background:var(--bg);outline:1px solid var(--acc)}
#gsOut .gs-r b{color:var(--acct,var(--link))}
#gsOut .gs-r small{display:block;color:var(--mute);font-size:12.5px;overflow-wrap:anywhere}
#gsOut mark,#itmDlg mark{background:var(--s-mark);color:#111;border-radius:2px}
#gsOut .gs-e{color:var(--mute);padding:14px 8px;text-align:center}
.itm{cursor:pointer;border-bottom:1px dashed currentColor;border-radius:2px}
.itm:hover,.itm:focus-visible{background:var(--acc);color:#111;outline:none;border-bottom-color:transparent}
#itmDlg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}
#itmDlg[hidden]{display:none}
#itmDlg .itm-box{background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:12px;box-shadow:var(--s-shadow);max-width:560px;width:100%;max-height:86vh;overflow:auto;padding:14px 18px;font-size:13.5px;line-height:1.7;text-align:left}
#itmDlg .itm-top{display:flex;justify-content:space-between;align-items:center;gap:10px;color:var(--mute);font-size:12.5px}
#itmDlg .itm-x{font:inherit;font-size:13px;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:6px;padding:2px 12px;cursor:pointer}
#itmDlg h3{margin:8px 0 6px;font-size:17px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#itmDlg h3 small{font-size:11.5px;font-weight:normal;padding:0 8px;border-radius:8px;border:1px solid var(--line);color:var(--mute)}
#itmDlg .itm-row{display:grid;grid-template-columns:auto 1fr;gap:8px;margin-top:4px}
#itmDlg .itm-row>b{white-space:nowrap}
#itmDlg .itm-row.g>b{color:var(--s-get)}#itmDlg .itm-row.u>b{color:var(--s-use)}
#itmDlg ul{margin:0;padding-left:18px}
#itmDlg table{border-collapse:collapse;font-size:12.5px;margin-top:4px;width:100%}
#itmDlg td,#itmDlg th{border:1px solid var(--line);padding:3px 6px;text-align:left}
#itmDlg .itm-note{color:var(--s-warn);font-size:12.5px;margin-top:6px}
#itmDlg .itm-sep{border:0;border-top:1px dashed var(--line);margin:12px 0}
#itmDlg .itm-foot{margin-top:12px;font-size:13px}
#itmDlg a{color:var(--link)}
.gs-flash{outline:3px solid var(--acc);outline-offset:3px;border-radius:4px;transition:outline-color .6s}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 物品彈窗 ----------
  let KEYMAP = null, RX = null;
  const STOP = ["符寶坊", "符寶一覽"];   // 含有物品名稱、但不是在講該物品的詞
  const NOLINK = "script,style,textarea,input,select,option,button,a,label,h1,h2,h3,.itm,#gs,#pfBar,.chips,.tabs,[data-noitm]";
  function buildKeys() {
    if (KEYMAP || !window.ITEMS) return;
    KEYMAP = {};
    window.ITEMS.forEach(it => (it.keys || []).forEach(k => (KEYMAP[k] = KEYMAP[k] || []).push(it)));
    const all = Object.keys(KEYMAP).concat(STOP).sort((a, b) => b.length - a.length);
    RX = new RegExp(all.map(reEsc).join("|"), "g");
  }
  function linkify(root) {
    if (!RX || !root) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; let n;
    while ((n = tw.nextNode())) {
      if (n.nodeValue.length < 2 || !n.parentElement || n.parentElement.closest(NOLINK)) continue;
      RX.lastIndex = 0; if (RX.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach(node => {
      const selfEl = node.parentElement.closest("[data-itm-self]"), self = selfEl && selfEl.getAttribute("data-itm-self");
      const v = node.nodeValue, frag = document.createDocumentFragment(); let last = 0, hit = false, m;
      RX.lastIndex = 0;
      while ((m = RX.exec(v))) {
        const list = KEYMAP[m[0]];
        if (!list || (self && list.every(it => it.name === self))) continue;
        if (m.index > last) frag.appendChild(document.createTextNode(v.slice(last, m.index)));
        const sp = document.createElement("span");
        sp.className = "itm"; sp.tabIndex = 0; sp.setAttribute("role", "button"); sp.dataset.k = m[0]; sp.title = "點一下看取得方式";
        if (self) sp.dataset.from = self;
        sp.textContent = m[0]; frag.appendChild(sp);
        last = m.index + m[0].length; hit = true;
      }
      if (!hit) return;
      if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  let dlg = null, lastFocus = null;
  function itemHtml(it) {
    return `<div data-itm-self="${esc(it.name)}"><h3><span>${it.icon}</span>${esc(it.name)}<small>${esc(it.cat)}</small></h3>
      <div class="itm-row g"><b>取得</b><ul>${it.get.map(x => `<li>${x}</li>`).join("")}</ul></div>
      <div class="itm-row u"><b>能力／用途</b><ul>${it.use.map(x => `<li>${x}</li>`).join("")}</ul></div>
      ${it.note ? `<div class="itm-note">${it.note}</div>` : ""}</div>`;
  }
  function openItem(key, from) {
    buildKeys();
    let list = (KEYMAP && KEYMAP[key]) || (window.ITEMS || []).filter(it => it.name === key);
    if (from && list.length > 1) list = list.filter(it => it.name !== from);
    if (!list.length) return;
    if (!dlg) {
      dlg = document.createElement("div"); dlg.id = "itmDlg"; dlg.hidden = true;
      dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-modal", "true"); dlg.setAttribute("aria-label", "物品說明");
      dlg.innerHTML = `<div class="itm-box"><div class="itm-top"><span id="itmCnt"></span><button class="itm-x" type="button">✕ 關閉</button></div><div id="itmBody"></div>
        <div class="itm-foot"><a href="物品一覽.html">🎒 到物品一覽看全部物品 →</a></div></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".itm-x")) closeItem(); });
    }
    if (dlg.hidden) lastFocus = document.activeElement;
    dlg.querySelector("#itmCnt").textContent = list.length > 1 ? `「${key}」有 ${list.length} 種，別弄混：` : "物品說明";
    const body = dlg.querySelector("#itmBody");
    body.innerHTML = list.map(itemHtml).join('<hr class="itm-sep">');
    linkify(body);
    dlg.hidden = false; dlg.querySelector(".itm-box").scrollTop = 0; dlg.querySelector(".itm-x").focus();
  }
  function closeItem() { if (dlg && !dlg.hidden) { dlg.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); } }
  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest(".itm");
    if (t) { e.preventDefault(); openItem(t.dataset.k, t.dataset.from); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeItem(); closeSearch(); }
    else if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("itm")) { e.preventDefault(); openItem(e.target.dataset.k, e.target.dataset.from); }
    else if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && gsIn) { e.preventDefault(); gsIn.focus(); }
  });
  function startLinks() {
    buildKeys(); if (!RX) return;
    const wrap = document.querySelector(".wrap") || document.body;
    linkify(wrap);
    let pend = new Set(), timer = 0;
    new MutationObserver(ms => {
      ms.forEach(m => m.addedNodes.forEach(nd => {
        if (nd.nodeType === 1) { if (!nd.classList.contains("itm")) pend.add(nd); }
        else if (nd.nodeType === 3 && nd.parentElement && !nd.parentElement.classList.contains("itm")) pend.add(nd.parentElement);
      }));
      if (pend.size && !timer) timer = setTimeout(() => { const list = [...pend]; pend = new Set(); timer = 0; list.forEach(el => { if (el.isConnected) linkify(el); }); }, 30);
    }).observe(wrap, { childList: true, subtree: true });
  }

  // ---------- 全站搜尋 ----------
  let gsIn = null, gsOut = null, idxState = 0;   // 0 未載入、1 載入中、2 完成
  function closeSearch() { if (gsOut) gsOut.hidden = true; }
  const mark = (s, terms) => {
    const rx = new RegExp("(" + terms.map(t => reEsc(esc(t))).join("|") + ")", "gi");
    return esc(s).replace(rx, "<mark>$1</mark>");
  };
  function snippet(x, terms) {
    const low = x.toLowerCase(); let at = -1;
    terms.forEach(t => { const i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; });
    if (at < 0) at = 0;
    const a = Math.max(0, at - 24), b = Math.min(x.length, at + 86);
    return (a > 0 ? "…" : "") + x.slice(a, b) + (b < x.length ? "…" : "");
  }
  function runSearch() {
    const q = gsIn.value.trim().toLowerCase();
    if (!q) { closeSearch(); return; }
    gsOut.hidden = false;
    const I = window.SEARCH_INDEX;
    if (!I) {
      if (idxState === 0) { idxState = 1; loadScript("search-index.js", () => { idxState = 2; runSearch(); }); }
      gsOut.innerHTML = `<div class="gs-e">${idxState === 2 ? "搜尋資料載入失敗，請重新整理頁面再試。" : "載入搜尋資料…"}</div>`;
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean), has = s => { s = s.toLowerCase(); return terms.every(t => s.includes(t)); };
    const strip = s => s.replace(/<[^>]+>/g, "");
    let h = "";
    buildKeys();
    const items = (window.ITEMS || []).filter(it => has(it.name + (it.keys || []).join(" ")));
    if (items.length) h += `<div class="gs-h">物品（點開看取得方式與用途）</div>` + items.slice(0, 8).map(it =>
      `<button type="button" class="gs-r" data-item="${esc(it.name)}"><b>${it.icon} ${mark(it.name, terms)}</b><small>${esc(snippet(strip(it.get.join("；")), terms))}</small></button>`).join("");
    const pages = I.p.filter(p => has(p[2] + p[3] + p[4].join(" ")));
    if (pages.length) h += `<div class="gs-h">頁面</div>` + pages.map(p =>
      `<a class="gs-r" href="${encodeURI(p[0])}"><b>${p[1]} ${mark(p[2], terms)}</b><small>${mark(p[3], terms)}</small></a>`).join("");
    // 內容：標題完全相同 > 標題包含 > 內文包含
    const hits = [];
    for (const e of I.e) {
      const inT = has(e[1]);
      if (!inT && !has(e[1] + " " + e[2])) continue;
      hits.push([inT ? (e[1].toLowerCase() === q ? 0 : 1) : 2, e]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    // 依頁面分組，每頁最多列 PER 筆（同標題同摘要的只留一筆）
    const PER = 8, by = new Map(), seen = new Set(); let more = 0;
    hits.forEach(([, e]) => {
      const body = e[2].startsWith(e[1]) && e[2].length > e[1].length ? e[2].slice(e[1].length).replace(/^[｜\s]+/, "") : e[2];
      const sn = snippet(body, terms), k =e[0] + "|" + e[1] + "|" + sn;
      if (seen.has(k) || (sn === e[1] && seen.has(e[0] + "|" + e[1]))) return;
      seen.add(k); seen.add(e[0] + "|" + e[1]);
      if (!by.has(e[0])) by.set(e[0], { list: [], n: 0 });
      const g = by.get(e[0]); g.n++;
      if (g.list.length < PER) g.list.push([e, sn]); else more++;
    });
    by.forEach((g, pi) => {
      const p = I.p[pi];
      h += `<div class="gs-h">${p[1]} ${esc(p[2])}${g.n > PER ? `（${g.n} 筆，列出前 ${PER} 筆）` : ""}</div>` + g.list.map(([e, sn]) =>
        `<a class="gs-r" href="${encodeURI(p[0])}#hl=${encodeURIComponent(e[1])}"><b>${mark(e[1], terms)}</b>${sn === e[1] ? "" : `<small>${mark(sn, terms)}</small>`}</a>`).join("");
    });
    if (more) h += `<div class="gs-e">還有 ${more} 筆沒列出，再多打幾個字縮小範圍（可用空白分隔多個關鍵字）</div>`;
    gsOut.innerHTML = h || `<div class="gs-e">找不到「${esc(gsIn.value.trim())}」。試試更短的關鍵字，或用空白分隔多個詞。</div>`;
    gsOut.scrollTop = 0;
  }
  function startSearch() {
    const wrap = document.querySelector(".wrap"); if (!wrap) return;
    const box = document.createElement("div"); box.id = "gs";
    box.innerHTML = `<input type="search" id="gsIn" autocomplete="off" aria-label="搜尋全站攻略" placeholder="🔍 搜尋全站攻略：物品、技能、地圖、夥伴、BOSS…（按 / 快速搜尋）"><div id="gsOut" hidden></div>`;
    wrap.insertAdjacentElement("afterbegin", box);
    gsIn = box.querySelector("input"); gsOut = box.querySelector("#gsOut");
    let t = 0;
    gsIn.addEventListener("input", () => { clearTimeout(t); t = setTimeout(runSearch, 120); });
    gsIn.addEventListener("focus", () => { if (gsIn.value.trim()) runSearch(); else if (idxState === 0) { idxState = 1; loadScript("search-index.js", () => { idxState = 2; }); } });
    gsIn.addEventListener("keydown", e => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") return;
      const rows = [...gsOut.querySelectorAll(".gs-r")]; if (!rows.length || gsOut.hidden) return;
      let i = rows.findIndex(r => r.classList.contains("cur"));
      if (e.key === "Enter") { (rows[i] || rows[0]).click(); e.preventDefault(); return; }
      e.preventDefault();
      if (i >= 0) rows[i].classList.remove("cur");
      i = e.key === "ArrowDown" ? (i + 1) % rows.length : (i <= 0 ? rows.length - 1 : i - 1);
      rows[i].classList.add("cur"); rows[i].scrollIntoView({ block: "nearest" });
    });
    gsOut.addEventListener("click", e => {
      const it = e.target.closest("[data-item]");
      if (it) { openItem(it.dataset.item); return; }
      if (e.target.closest("a.gs-r")) setTimeout(closeSearch, 0);
    });
    document.addEventListener("click", e => { if (!box.contains(e.target)) closeSearch(); });
  }

  // ---------- 從搜尋結果點進來：捲到該筆並標出來 ----------
  function findTarget(t) {
    const wrap = document.querySelector(".wrap") || document.body, vis = el => el.getClientRects().length > 0;
    const tw = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT); let n, hiddenHit = null;
    const ok = el => el && !el.closest("#gs,#pfBar,#itmDlg,script,style,select,option,button,label,textarea");
    while ((n = tw.nextNode())) {
      if (!n.nodeValue.includes(t) || !ok(n.parentElement)) continue;
      if (vis(n.parentElement)) return n.parentElement;
      hiddenHit = hiddenHit || n.parentElement;
    }
    // 標題被拆成好幾段（圖示＋文字、物品連結）時，改比對整個元素的文字
    const norm = s => s.replace(/\s+/g, " ").trim();
    for (const el of wrap.querySelectorAll("h2,h3,h4,td,th,b,summary,li")) {
      if (!ok(el) || norm(el.textContent) !== t) continue;
      if (vis(el)) return el;
      hiddenHit = hiddenHit || el;
    }
    return hiddenHit;
  }
  function gotoHash() {
    const m = location.hash.match(/^#hl=(.+)$/); if (!m) return;
    let t; try { t = decodeURIComponent(m[1]); } catch (e) { return; }
    let el = findTarget(t);
    if (!el) {
      // 清單太長只列一部分的頁面：把名稱填進該頁自己的搜尋框再找一次
      for (const inp of document.querySelectorAll('.wrap input[placeholder]:not(#gsIn)')) {
        if (inp.type !== "text" && inp.type !== "search") continue;
        const fire = () => inp.dispatchEvent(new Event("input", { bubbles: true }));
        const old = inp.value;
        inp.value = t; fire();
        el = findTarget(t);
        if (el) break;
        inp.value = old; fire();
      }
    }
    if (!el) return;
    if (!el.getClientRects().length) {
      // 在還沒打開的分頁裡：切到那個分頁
      const pane = el.closest("[hidden][id]");
      if (pane) {
        const btn = [...document.querySelectorAll(".tabs button")].find(b => Object.values(b.dataset).some(v => v === pane.id || pane.id === "p-" + v || pane.id === "t-" + v || pane.id.endsWith("-" + v)));
        if (btn) btn.click();
      }
      el = findTarget(t) || el;
      if (!el.getClientRects().length) return;
    }
    const box = el.closest("tr,.card,li") || el;
    box.scrollIntoView({ block: "center" });
    box.classList.add("gs-flash");
    setTimeout(() => box.classList.remove("gs-flash"), 2600);
  }

  ready(() => {
    startSearch();
    if (window.ITEMS) startLinks(); else loadScript("items.js", startLinks);
    setTimeout(gotoHash, 150);
    window.addEventListener("hashchange", gotoHash);
  });
})();
