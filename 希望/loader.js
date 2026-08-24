// ==========================================================================
// 放置希望・一鍵強化 loader.js
// 透過書籤動態載入，找到遊戲本身正在執行的 session/data/snap，
// 直接呼叫遊戲真正的 session.enhance() / session.buy()，不自己猜機率或公式。
// ==========================================================================
(function () {
  "use strict";

  var ROOT_ID = "iw-enhance-root";
  var STYLE_ID = "iw-enhance-style";
  var CLOCKWORK_ID = 26731; // 實習生的發條（強化用材料，寫死在遊戲原始碼裡）

  // ---------- 先清掉舊的（讓 bookmarklet 可以重複點擊 / 熱重載）----------
  var oldRoot = document.getElementById(ROOT_ID);
  if (oldRoot) oldRoot.remove();
  var oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();

  // ---------- 找到 Vue 應用程式，往下爬元件樹找 session/data/snap ----------
  function findGameRefs() {
    var rootEl = null;
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i]._vnode) { rootEl = all[i]; break; }
    }
    if (!rootEl) return null;
    var rootVnode = rootEl._vnode;
    var rootComp = rootVnode && rootVnode.component;
    if (!rootComp) return null;

    var found = null;
    function walk(vnode) {
      if (!vnode || found) return;
      if (vnode.component) {
        var props = vnode.component.props;
        if (props && props.session && typeof props.session.enhance === "function") {
          found = props;
          return;
        }
        walk(vnode.component.subTree);
      } else if (Array.isArray(vnode.children)) {
        for (var i = 0; i < vnode.children.length; i++) {
          walk(vnode.children[i]);
          if (found) return;
        }
      }
    }
    walk(rootComp.subTree);
    return found; // { snap, data, session }
  }

  var refs = findGameRefs();
  if (!refs) {
    alert("找不到遊戲的 session（有可能頁面還沒載入完成，或是遊戲版本改版了，請回報給作者）");
    return;
  }
  var session = refs.session;
  var data = refs.data;
  // 注意：refs.snap 是「找到當下那一刻」component 的 props.snap；
  // 每次都重新從 refs 讀（而不是快取起來一份），確保拿到最新的即時狀態。

  function snap() { return refs.snap; }

  // ---------- 樣式 ----------
  var style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    "#iw-enhance-root *{box-sizing:border-box;font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;}",
    "#iw-enhance-fab{position:fixed;right:18px;bottom:18px;z-index:999999;background:#c9a24b;color:#241c15;",
    "border:none;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:700;cursor:pointer;",
    "box-shadow:0 4px 14px rgba(0,0,0,.4);}",
    "#iw-enhance-fab:hover{background:#ddb968;}",
    "#iw-enhance-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999998;",
    "display:flex;align-items:center;justify-content:center;padding:16px;}",
    "#iw-enhance-modal{background:#1c1712;color:#e8e0d0;border:1px solid #3a2f22;border-radius:10px;",
    "width:100%;max-width:420px;max-height:88vh;overflow-y:auto;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.6);}",
    "#iw-enhance-modal h2{margin:0 0 14px;font-size:16px;color:#e0b95c;}",
    "#iw-enhance-modal label{display:block;font-size:12.5px;color:#b8ab90;margin:12px 0 4px;}",
    "#iw-enhance-modal select,#iw-enhance-modal input[type=number]{width:100%;padding:8px 9px;",
    "background:#2a231a;border:1px solid #4a3d2c;border-radius:5px;color:#e8e0d0;font-size:13.5px;}",
    "#iw-enhance-modal select:focus,#iw-enhance-modal input:focus{outline:none;border-color:#c9a24b;}",
    ".iw-checkrow{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:#d8cdb8;}",
    ".iw-checkrow input{width:auto;}",
    ".iw-btnrow{display:flex;gap:10px;margin-top:18px;}",
    ".iw-btn{flex:1;padding:10px;border-radius:6px;border:1px solid #4a3d2c;background:#2a231a;",
    "color:#e8e0d0;font-size:13.5px;cursor:pointer;}",
    ".iw-btn.primary{background:#c9a24b;color:#241c15;border-color:#c9a24b;font-weight:700;}",
    ".iw-btn.primary:hover{background:#ddb968;}",
    ".iw-btn:disabled{opacity:.45;cursor:not-allowed;}",
    "#iw-enhance-log{margin-top:14px;background:#141009;border:1px solid #3a2f22;border-radius:6px;",
    "padding:10px;font-size:12.5px;line-height:1.7;max-height:160px;overflow-y:auto;white-space:pre-wrap;}",
    "#iw-enhance-summary{margin-top:12px;font-size:13px;line-height:1.8;}",
    "#iw-enhance-summary b{color:#e0b95c;}",
    "#iw-enhance-close{position:absolute;top:10px;right:14px;background:none;border:none;color:#b8ab90;",
    "font-size:18px;cursor:pointer;}"
  ].join("");
  document.head.appendChild(style);

  // ---------- 浮動按鈕 ----------
  var root = document.createElement("div");
  root.id = ROOT_ID;
  var fab = document.createElement("button");
  fab.id = "iw-enhance-fab";
  fab.textContent = "⚡ 一鍵強化";
  root.appendChild(fab);
  document.body.appendChild(root);

  fab.addEventListener("click", openModal);

  // ---------- 小工具 ----------
  function gradeNameOf(grade) {
    if (!grade) return "N";
    var g = data.options && data.options.grades;
    return (g && g[grade - 1]) || String(grade);
  }
  function loadoutList() {
    var s = snap();
    var out = [];
    var entries = Object.entries(s.loadout || {});
    for (var i = 0; i < entries.length; i++) {
      var slot = entries[i][0], n = entries[i][1];
      if (!n || !n.item) continue;
      var grade = (n.options && n.options.grade) || 0;
      var label = (data.slotLabels && data.slotLabels[slot]) || slot;
      out.push({
        slot: slot, stackId: n.stackId, name: n.item.name,
        grade: grade, gradeName: gradeNameOf(grade), label: label
      });
    }
    return out;
  }
  function findEntryByStackId(stackId) {
    var s = snap();
    var entries = Object.entries(s.loadout || {});
    for (var i = 0; i < entries.length; i++) {
      var n = entries[i][1];
      if (n && n.stackId === stackId) return n;
    }
    return null;
  }
  function fmt(n) { return Math.round(n).toLocaleString("zh-TW"); }

  // ---------- 視窗 ----------
  var backdrop, modal, running = false, stopFlag = false;

  function openModal() {
    if (backdrop) return;
    var items = loadoutList();
    if (items.length === 0) {
      alert("身上目前沒有裝備，沒東西可以強化。");
      return;
    }
    var grades = (data.options && data.options.grades) || [];

    backdrop = document.createElement("div");
    backdrop.id = "iw-enhance-backdrop";
    modal = document.createElement("div");
    modal.id = "iw-enhance-modal";
    modal.style.position = "relative";

    var itemOptions = items.map(function (it, idx) {
      return '<option value="' + idx + '">' + it.label + '：' + it.name + '（目前 ' + it.gradeName + ' 階）</option>';
    }).join("");
    var gradeOptions = grades.map(function (g, idx) {
      return '<option value="' + (idx + 1) + '">' + g + '</option>';
    }).join("");

    modal.innerHTML =
      '<button id="iw-enhance-close">✕</button>' +
      '<h2>⚡ 一鍵強化</h2>' +
      '<label>要強化哪一件裝備</label>' +
      '<select id="iw-f-item">' + itemOptions + '</select>' +
      '<label>目標階級（洗到這階或更高就停）</label>' +
      '<select id="iw-f-grade">' + gradeOptions + '</select>' +
      '<label>最大金幣預算</label>' +
      '<input type="number" id="iw-f-budget" min="0" step="1000" value="' + Math.floor((snap().gold || 0)) + '">' +
      '<div class="iw-checkrow"><input type="checkbox" id="iw-f-autobuy"><label style="margin:0;" for="iw-f-autobuy">沒有實習生的發條時，自動花金幣購買繼續（每個 ' +
      fmt((data.shopPrice && data.shopPrice.get(CLOCKWORK_ID)) || 0) + ' 金幣）</label></div>' +
      '<div class="iw-btnrow">' +
      '<button class="iw-btn" id="iw-f-cancel">取消</button>' +
      '<button class="iw-btn primary" id="iw-f-start">開始強化</button>' +
      '</div>' +
      '<div id="iw-enhance-log" style="display:none;"></div>' +
      '<div id="iw-enhance-summary"></div>';

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    document.getElementById("iw-enhance-close").addEventListener("click", closeModal);
    document.getElementById("iw-f-cancel").addEventListener("click", function () {
      if (running) { stopFlag = true; } else { closeModal(); }
    });
    document.getElementById("iw-f-start").addEventListener("click", function () {
      var idx = Number(document.getElementById("iw-f-item").value);
      var targetGrade = Number(document.getElementById("iw-f-grade").value);
      var budget = Number(document.getElementById("iw-f-budget").value) || 0;
      var autoBuy = document.getElementById("iw-f-autobuy").checked;
      startRun(items[idx], targetGrade, budget, autoBuy);
    });

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop && !running) closeModal();
    });
  }

  function closeModal() {
    if (running) return;
    if (backdrop) { backdrop.remove(); backdrop = null; modal = null; }
  }

  function log(msg) {
    var el = document.getElementById("iw-enhance-log");
    if (!el) return;
    el.style.display = "block";
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  }

  function setFormDisabled(disabled) {
    ["iw-f-item", "iw-f-grade", "iw-f-budget", "iw-f-autobuy", "iw-f-start"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
    var cancel = document.getElementById("iw-f-cancel");
    if (cancel) cancel.textContent = disabled ? "停止" : "取消";
  }

  async function startRun(item, targetGrade, budget, autoBuy) {
    if (!snap().inVillage) {
      alert("要在村莊裡才能強化，請先回村莊再試一次。");
      return;
    }
    running = true;
    stopFlag = false;
    setFormDisabled(true);
    document.getElementById("iw-enhance-summary").innerHTML = "";
    document.getElementById("iw-enhance-log").textContent = "";

    var stackId = item.stackId;
    var price = (data.shopPrice && data.shopPrice.get(CLOCKWORK_ID)) || 0;
    var attempts = 0, totalSpent = 0, totalUsed = 0, totalBought = 0;
    var reason = "unknown";

    while (true) {
      if (stopFlag) { reason = "stopped"; break; }

      var entry = findEntryByStackId(stackId);
      if (!entry) { reason = "item-gone"; break; }
      var curGrade = (entry.options && entry.options.grade) || 0;
      if (curGrade >= targetGrade) { reason = "success"; break; }

      if (totalSpent >= budget) { reason = "budget"; break; }

      var have = snap().usableCounts.get(CLOCKWORK_ID) || 0;
      if (have < 1) {
        if (!autoBuy) { reason = "no-material"; break; }
        if (!price) { reason = "no-price"; break; }
        if (snap().gold < price) { reason = "no-gold-for-material"; break; }
        if (totalSpent + price > budget) { reason = "budget"; break; }
        var goldBeforeBuy = snap().gold;
        session.buy(CLOCKWORK_ID, 1);
        var buySpent = goldBeforeBuy - snap().gold;
        if (buySpent <= 0) { reason = "buy-failed"; break; }
        totalSpent += buySpent;
        totalBought += 1;
        log("購買發條 ×1，花費 " + fmt(buySpent) + " 金幣");
        await sleep(20);
        continue;
      }

      var goldBefore = snap().gold;
      var materialBefore = have;
      session.enhance(stackId, CLOCKWORK_ID);
      var spent = goldBefore - snap().gold;
      if (spent <= 0) { reason = "enhance-rejected"; break; }
      attempts++;
      totalSpent += spent;
      totalUsed += Math.max(0, materialBefore - (snap().usableCounts.get(CLOCKWORK_ID) || 0));

      var newEntry = findEntryByStackId(stackId);
      var newGrade = (newEntry && newEntry.options && newEntry.options.grade) || 0;
      log("第 " + attempts + " 次強化：花費 " + fmt(spent) + " 金幣，結果 " + gradeNameOf(newGrade) + " 階");

      if (totalSpent >= budget && newGrade < targetGrade) { reason = "budget"; break; }

      await sleep(25);
    }

    running = false;
    setFormDisabled(false);

    var finalEntry = findEntryByStackId(stackId);
    var finalGrade = (finalEntry && finalEntry.options && finalEntry.options.grade) || 0;
    var reasonText = {
      "success": "✅ 已達成目標階級！",
      "budget": "⏸️ 已達到（或即將超過）預算上限，停止。",
      "no-material": "⏸️ 發條用完了（沒有勾選自動購買），停止。",
      "no-gold-for-material": "⏸️ 金幣不夠買下一個發條，停止。",
      "no-price": "⚠️ 讀不到發條的商店價格，停止。",
      "buy-failed": "⚠️ 購買發條失敗（可能不在村莊），停止。",
      "enhance-rejected": "⚠️ 這次強化沒有成功執行（可能金幣不夠付這次的強化費用），停止。",
      "item-gone": "⚠️ 找不到這件裝備了（可能被拆解或移動），停止。",
      "stopped": "⏹️ 已手動停止。",
      "unknown": "發生未知狀況，停止。"
    }[reason] || reason;

    document.getElementById("iw-enhance-summary").innerHTML =
      "<div>" + reasonText + "</div>" +
      "<div style='margin-top:8px;'>" +
      item.label + "：" + item.name + " → <b>" + gradeNameOf(finalGrade) + " 階</b><br>" +
      "強化次數：<b>" + attempts + "</b> 次　購買發條：<b>" + totalBought + "</b> 個<br>" +
      "總花費：<b>" + fmt(totalSpent) + "</b> 金幣" +
      "</div>";
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  console.log("[一鍵強化] loader 已就緒，右下角應該會看到「⚡ 一鍵強化」按鈕。");
})();
