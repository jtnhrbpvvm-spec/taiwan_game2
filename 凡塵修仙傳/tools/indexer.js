// 建立搜尋索引用：build-search.js 會把這支程式暫時掛到每個頁面上，把畫面上的內容切成一筆一筆。
// 攻略頁本身不會載入這個檔案。
(function () {
  const SKIP = "script,style,input,select,textarea,button,footer,#gs,#pfBar,#itmDlg,.back,.chips,.tabs,.empty,[hidden].empty";
  const BLOCK = "div,p,ul,ol,li,table,tr,section,article,h1,h2,h3,h4,h5,details,summary,dl,dt,dd,pre,blockquote";
  const norm = s => s.replace(/\s+/g, " ").trim();
  function txt(node) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1 || node.matches(SKIP)) return "";
    let s = ""; node.childNodes.forEach(c => { s += txt(c); });
    return node.matches("td,th,li,p,div,tr,br,h2,h3,h4,dt,dd") ? s + " " : s;
  }
  function run() {
    const root = document.querySelector(".wrap") || document.body, out = [], seen = new Set();
    let h2 = "", h3 = "";
    const emit = (title, x) => {
      x = norm(x); title = norm(title || "") || h3 || h2;
      if (x.length < 2 || !title) return;
      const k = title + "\u0001" + x; if (seen.has(k)) return; seen.add(k);
      out.push([title.slice(0, 60), x.slice(0, 420)]);
    };
    const short = s => s.length >= 2 && s.length <= 26 && !/^[\d\s.,%+\-−×～~／/]+$/.test(s);
    function table(t) {
      let hdr = [];
      t.querySelectorAll("tr").forEach(tr => {
        if (tr.closest("table") !== t) return;
        const cells = [...tr.children].filter(c => /^(TD|TH)$/.test(c.tagName));
        const tds = cells.filter(c => c.tagName === "TD");
        if (!tds.length) { hdr = cells.map(c => norm(txt(c))); return; }
        const vals = cells.map(c => norm(txt(c)));
        const b = tr.querySelector("b"), bt = b ? norm(txt(b)) : "";
        const title = short(bt) ? bt : (vals.find(short) || "");
        const useHdr = hdr.length === vals.length;
        emit(title, vals.map((v, i) => v && useHdr && i > 0 && hdr[i] ? hdr[i] + "：" + v : v).filter(Boolean).join("｜"));
      });
    }
    function walk(el) {
      let loose = "";
      const flush = () => { if (norm(loose)) emit("", loose); loose = ""; };
      el.childNodes.forEach(c => {
        if (c.nodeType === 3) { loose += c.nodeValue; return; }
        if (c.nodeType !== 1 || c.matches(SKIP)) return;
        const tag = c.tagName;
        if (!c.matches(BLOCK)) { loose += txt(c); return; }
        flush();
        if (tag === "H1") return;
        if (/^H[2-5]$/.test(tag)) {
          const t = norm(txt(c));
          if (tag === "H2") { h2 = t; h3 = ""; } else h3 = t;
          if (t) emit(t, tag === "H2" ? t : (h2 ? h2 + "・" + t : t));
          return;
        }
        if (tag === "TABLE") { table(c); return; }
        const own = c.querySelector("h2,h3,h4"), body = txt(c);
        if (!c.querySelector(BLOCK)) { emit("", body); return; }
        if ((tag === "LI" || /card|box/.test(c.className)) && norm(body).length <= 500 && !c.querySelector("table")) { emit(own ? txt(own) : "", body); return; }
        walk(c);
      });
      flush();
    }
    walk(root);
    // 有分頁的頁面：每個分頁都切過去掃一次（有些分頁點了才會產生內容），重複的會自動略過
    const tabs = [...document.querySelectorAll(".tabs button")];
    tabs.forEach(b => { b.click(); h2 = h3 = ""; walk(root); });
    if (tabs.length) tabs[0].click();
    // 清單太長、一次只列一部分的頁面：把每個篩選按鈕都按過一輪，補齊沒列出來的
    document.querySelectorAll(".chips[id]").forEach(box => {
      const n = box.querySelectorAll("button").length;
      for (let i = 0; i < n; i++) { const b = document.getElementById(box.id).querySelectorAll("button")[i]; if (!b) break; b.click(); h2 = h3 = ""; walk(root); }
      const first = document.getElementById(box.id).querySelector("button"); if (first) first.click();
    });
    const pages = [...document.querySelectorAll("#grid a.card")].map(a => [decodeURI(a.getAttribute("href")), norm(a.querySelector(".ic").textContent),
      norm(a.querySelector("h2").textContent), norm(a.querySelector("p").textContent), [...a.querySelectorAll(".tags span")].map(s => norm(s.textContent))]);
    const pre = document.createElement("pre"); pre.id = "__IDX__";
    pre.textContent = encodeURIComponent(JSON.stringify({ title: document.title, entries: out, pages }));
    document.body.appendChild(pre);
  }
  window.addEventListener("load", () => setTimeout(run, 400));
})();
