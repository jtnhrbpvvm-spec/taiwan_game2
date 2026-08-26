// ==========================================================================
// 放置希望・一鍵強化 loader.js
// 透過書籤動態載入，找到遊戲本身正在執行的 session/data/snap，
// 直接呼叫遊戲真正的 session.enhance() / session.buy()，不自己猜機率或公式。
// 按鈕直接插在每件裝備「強化」按鈕（顯示金幣費用那顆）的前面。
// ==========================================================================
(function () {
  "use strict";

  var STYLE_ID = "iw-enhance-style";
  var CLOCKWORK_ID = 26731; // 實習生的發條（強化用材料，寫死在遊戲原始碼裡）
  // 目前作者只開放到 DG（N=1,G=2,DG=3）。XG/SG 開放後，把這個數字調成 grades.length 就會全部開放。
  var MAX_SELECTABLE_GRADE_INDEX = 3;

  // 附魔屬性對照表（kind -> 名稱），來自 enchant.js
  var ENCHANT_KINDS = [{"kind":1,"name":"攻擊力"},{"kind":2,"name":"魔法力"},{"kind":3,"name":"防禦力"},{"kind":4,"name":"攻擊速度"},{"kind":5,"name":"必殺技"},{"kind":6,"name":"命中率"},{"kind":7,"name":"迴避率"},{"kind":8,"name":"移動速度"},{"kind":9,"name":"HP"},{"kind":10,"name":"AP"},{"kind":11,"name":"HP%"},{"kind":12,"name":"AP%"},{"kind":13,"name":"減少道具等級限制"},{"kind":14,"name":"經驗值獲得量"},{"kind":15,"name":"每級力量"},{"kind":16,"name":"每級敏捷"},{"kind":17,"name":"每級智力"},{"kind":18,"name":"每級幸運"},{"kind":19,"name":"每級體力"},{"kind":20,"name":"每級精神"},{"kind":21,"name":"[副本]增加傷害"},{"kind":22,"name":"增加傷害"},{"kind":23,"name":"減少傷害"}];
  var ENCHANT_KIND_NAME = {};
  ENCHANT_KINDS.forEach(function (k) { ENCHANT_KIND_NAME[k.kind] = k.name; });

  // ---------- 先清掉舊的（讓 bookmarklet 可以重複點擊 / 熱重載）----------
  var oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();
  document.querySelectorAll("[data-iw-btn]").forEach(function (el) { el.remove(); });
  var oldBackdrop = document.getElementById("iw-enhance-backdrop");
  if (oldBackdrop) oldBackdrop.remove();
  if (window.__iwEnhanceObserver) { window.__iwEnhanceObserver.disconnect(); }

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
        if (props && props.session && typeof props.session.enhance === "function" && props.snap && props.data) {
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
  function snap() { return refs.snap; } // 每次都重新讀，確保拿到最新的即時狀態

  // ---------- 樣式 ----------
  var style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    "[id^=iw-enhance] *,.iw-inline-btn{box-sizing:border-box;font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;}",
    ".iw-inline-btn{background:#7c5cbf;color:#fff;border:none;border-radius:6px;padding:6px 10px;",
    "font-size:12.5px;font-weight:700;cursor:pointer;margin-right:8px;white-space:nowrap;}",
    ".iw-inline-btn:hover{background:#9270d6;}",
    "#iw-enhance-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999998;",
    "display:flex;align-items:center;justify-content:center;padding:16px;}",
    "#iw-enhance-modal{background:#1c1712;color:#e8e0d0;border:1px solid #3a2f22;border-radius:10px;",
    "width:100%;max-width:420px;max-height:88vh;overflow-y:auto;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.6);position:relative;}",
    "#iw-enhance-modal h2{margin:0 0 14px;font-size:16px;color:#e0b95c;}",
    "#iw-enhance-modal label{display:block;font-size:12.5px;color:#b8ab90;margin:12px 0 4px;}",
    "#iw-enhance-modal select,#iw-enhance-modal input[type=number]{width:100%;padding:8px 9px;",
    "background:#2a231a;border:1px solid #4a3d2c;border-radius:5px;color:#e8e0d0;font-size:13.5px;}",
    "#iw-enhance-modal select:focus,#iw-enhance-modal input:focus{outline:none;border-color:#c9a24b;}",
    "#iw-enhance-modal .iw-target{font-size:14px;color:#e8e0d0;background:#2a231a;border:1px solid #4a3d2c;",
    "border-radius:6px;padding:9px 10px;}",
    "#iw-enhance-modal .iw-warn{font-size:11.5px;color:#e0b95c;margin-top:6px;line-height:1.6;display:none;}",
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

  // ---------- 小工具 ----------
  function gradeNameOf(grade) {
    if (!grade) return "N";
    var g = data.options && data.options.grades;
    return (g && g[grade - 1]) || String(grade);
  }
  function rolledKindsOf(entry) {
    var opts = entry && entry.options && entry.options.options;
    if (!Array.isArray(opts)) return [];
    return opts.map(function (o) { return o.kind; });
  }
  function rolledKindsText(entry) {
    var kinds = rolledKindsOf(entry);
    if (!kinds.length) return "無屬性";
    return kinds.map(function (k) { return ENCHANT_KIND_NAME[k] || ("kind" + k); }).join("、");
  }
  function countMatchedKinds(entry, selectedKinds) {
    if (!selectedKinds || !selectedKinds.length) return 0;
    var rolled = rolledKindsOf(entry);
    var set = {};
    selectedKinds.forEach(function (k) { set[k] = true; });
    var count = 0;
    rolled.forEach(function (k) { if (set[k]) count++; });
    return count;
  }
  function meetsKindRequirement(entry, selectedKinds, minMatch) {
    if (!selectedKinds || !selectedKinds.length || !minMatch) return true; // 沒選屬性或沒設下限，就當作沒有這個限制
    return countMatchedKinds(entry, selectedKinds) >= minMatch;
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
    // 讀 session.player.stacks（跟遊戲內部強化時直接修改的是同一份），
    // 不透過 snap（快照是定期才重建，會有延遲），確保拿到即時的階級結果。
    if (session.player && session.player.stacks) {
      var live = session.player.stacks.get(stackId);
      if (live) return live;
    }
    var s = snap();
    var entries = Object.entries(s.loadout || {});
    for (var i = 0; i < entries.length; i++) {
      var n = entries[i][1];
      if (n && n.stackId === stackId) return n;
    }
    return null;
  }
  function fmt(n) { return Math.round(n).toLocaleString("zh-TW"); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---------- 把「⚡強化」按鈕插到每張裝備卡片的強化費用按鈕前面 ----------
  function injectButtons() {
    try {
      var goButtons = document.querySelectorAll(".card:not([data-id]) > div:first-child > button.go");
      if (goButtons.length === 0) return;
      var items = loadoutList();
      goButtons.forEach(function (goBtn) {
        var card = goBtn.closest(".card");
        if (!card || card.querySelector("[data-iw-btn]")) return;
        var nameEl = card.querySelector("strong");
        var name = nameEl ? nameEl.textContent.trim() : "";
        var match = items.find(function (it) { return it.name === name; });
        if (!match) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "⚡強化";
        btn.title = "一鍵強化：" + match.name;
        btn.setAttribute("data-iw-btn", "1");
        btn.className = "iw-inline-btn";
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          try { openModal(match); } catch (err) {
            console.error("[一鍵強化] 開啟視窗失敗", err);
            alert("開啟視窗時發生錯誤：" + (err && err.message ? err.message : err));
          }
        });
        goBtn.parentNode.insertBefore(btn, goBtn);
      });
    } catch (err) {
      console.error("[一鍵強化] 插入按鈕時發生錯誤", err);
    }
  }

  injectButtons();
  var observer = new MutationObserver(function () {
    clearTimeout(window.__iwEnhanceDebounce);
    window.__iwEnhanceDebounce = setTimeout(injectButtons, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.__iwEnhanceObserver = observer;

  // ---------- 視窗 ----------
  var backdrop, modal, running = false, stopFlag = false;

  function openModal(item) {
    if (backdrop) return;
    var grades = (data.options && data.options.grades) || [];

    backdrop = document.createElement("div");
    backdrop.id = "iw-enhance-backdrop";
    modal = document.createElement("div");
    modal.id = "iw-enhance-modal";

    var freshEntry = findEntryByStackId(item.stackId);
    var curGrade = (freshEntry && freshEntry.options && freshEntry.options.grade) || 0;
    var defaultTarget = Math.min(curGrade + 1, grades.length, MAX_SELECTABLE_GRADE_INDEX);
    var visibleGrades = grades.slice(0, MAX_SELECTABLE_GRADE_INDEX);
    var gradeOptions = visibleGrades.map(function (g, idx) {
      return '<option value="' + (idx + 1) + '"' + ((idx + 1) === defaultTarget ? " selected" : "") + '>' + g + '</option>';
    }).join("");

    var kindChecklist = ENCHANT_KINDS.map(function (k) {
      return '<label style="display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:400;margin:0;padding:3px 0;">' +
        '<input type="checkbox" class="iw-kind-cb" value="' + k.kind + '" style="width:auto;">' + k.name + '</label>';
    }).join("");

    modal.innerHTML =
      '<button id="iw-enhance-close">✕</button>' +
      '<h2>⚡ 一鍵強化</h2>' +
      '<label>目標裝備</label>' +
      '<div class="iw-target" id="iw-f-target-display">' + item.label + '：' + item.name + '（目前 ' + gradeNameOf(curGrade) + ' 階・' + rolledKindsText(freshEntry) + '）</div>' +
      '<label>目標階級（洗到這階或更高就停）</label>' +
      '<select id="iw-f-grade">' + gradeOptions + '</select>' +
      '<div class="iw-warn" id="iw-f-warn">⚠️ 高階級的成功機率可能非常低（甚至目前材料完全洗不上去），選這個目標有可能把預算花光也到不了，請自行評估。</div>' +
      '<label>指定屬性（可複選，要洗到「其中幾條」而且階級也達標才會停）</label>' +
      '<div id="iw-f-kind-list" style="max-height:170px;overflow-y:auto;border:1px solid var(--border);border-radius:5px;padding:8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--bg3);">' + kindChecklist + '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px;color:var(--text2);">' +
      '<span>已選 <b id="iw-f-kind-selected-count" style="color:var(--text);">0</b> 條，至少要洗出</span>' +
      '<input type="number" id="iw-f-kind-min" min="0" value="0" style="width:64px;">' +
      '<span>條才停（0 = 不限制）</span>' +
      '</div>' +
      '<label style="margin-top:16px;">最大金幣預算</label>' +
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

    var gradeSelect = document.getElementById("iw-f-grade");
    var warnEl = document.getElementById("iw-f-warn");
    function updateWarn() {
      var target = Number(gradeSelect.value);
      warnEl.style.display = (target - curGrade >= 2) ? "block" : "none";
    }
    gradeSelect.addEventListener("change", updateWarn);
    updateWarn();

    var kindCheckboxes = Array.prototype.slice.call(modal.querySelectorAll(".iw-kind-cb"));
    var kindMinInput = document.getElementById("iw-f-kind-min");
    var kindSelectedCountEl = document.getElementById("iw-f-kind-selected-count");
    function updateKindSelectedCount() {
      var n = kindCheckboxes.filter(function (cb) { return cb.checked; }).length;
      kindSelectedCountEl.textContent = String(n);
      kindMinInput.max = String(n);
      if (Number(kindMinInput.value) > n) kindMinInput.value = String(n);
    }
    kindCheckboxes.forEach(function (cb) { cb.addEventListener("change", updateKindSelectedCount); });
    updateKindSelectedCount();

    document.getElementById("iw-enhance-close").addEventListener("click", closeModal);
    document.getElementById("iw-f-cancel").addEventListener("click", function () {
      if (running) { stopFlag = true; } else { closeModal(); }
    });
    document.getElementById("iw-f-start").addEventListener("click", function () {
      try {
        var targetGrade = Number(document.getElementById("iw-f-grade").value);
        var budget = Number(document.getElementById("iw-f-budget").value) || 0;
        var autoBuy = document.getElementById("iw-f-autobuy").checked;
        var selectedKinds = kindCheckboxes.filter(function (cb) { return cb.checked; }).map(function (cb) { return Number(cb.value); });
        var minMatch = Number(kindMinInput.value) || 0;
        startRun(item, targetGrade, budget, autoBuy, selectedKinds, minMatch);
      } catch (err) {
        console.error("[一鍵強化] 啟動失敗", err);
        alert("啟動時發生錯誤：" + (err && err.message ? err.message : err));
      }
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
    ["iw-f-grade", "iw-f-budget", "iw-f-autobuy", "iw-f-start"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
    var cancel = document.getElementById("iw-f-cancel");
    if (cancel) cancel.textContent = disabled ? "停止" : "取消";
  }

  async function startRun(item, targetGrade, budget, autoBuy, selectedKinds, minMatch) {
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
      if (curGrade >= targetGrade && meetsKindRequirement(entry, selectedKinds, minMatch)) { reason = "success"; break; }

      if (totalSpent >= budget) { reason = "budget"; break; }

      var have = session.usableCount(CLOCKWORK_ID, "bagAndWarehouse") || 0;
      if (have < 1) {
        if (!autoBuy) { reason = "no-material"; break; }
        if (!price) { reason = "no-price"; break; }
        if (session.player.gold < price) { reason = "no-gold-for-material"; break; }
        if (totalSpent + price > budget) { reason = "budget"; break; }
        var goldBeforeBuy = session.player.gold;
        session.buy(CLOCKWORK_ID, 1);
        var buySpent = goldBeforeBuy - session.player.gold;
        if (buySpent <= 0) {
          console.error("[一鍵強化] session.buy() 沒有扣款，診斷資訊：", {
            "session.inVillage": session.inVillage,
            "發條商店價格 price": price,
            "扣款前金幣 goldBefore": goldBeforeBuy,
            "扣款後金幣 goldAfter": session.player.gold,
            "data.shopPrice.get(26731)": data.shopPrice && data.shopPrice.get(CLOCKWORK_ID)
          });
          reason = "buy-failed";
          break;
        }
        totalSpent += buySpent;
        totalBought += 1;
        log("購買發條 ×1，花費 " + fmt(buySpent) + " 金幣");
        await sleep(20);
        continue;
      }

      var goldBefore = session.player.gold;
      var materialBefore = have;
      session.enhance(stackId, CLOCKWORK_ID);
      var spent = goldBefore - session.player.gold;
      if (spent <= 0) {
        console.error("[一鍵強化] session.enhance() 沒有扣款，診斷資訊：", {
          "session.inVillage": session.inVillage,
          "stackId": stackId,
          "扣款前金幣 goldBefore": goldBefore,
          "扣款後金幣 goldAfter": session.player.gold,
          "usableCount(26731,bagAndWarehouse)": session.usableCount(CLOCKWORK_ID, "bagAndWarehouse")
        });
        reason = "enhance-rejected";
        break;
      }
      attempts++;
      totalSpent += spent;
      totalUsed += Math.max(0, materialBefore - (session.usableCount(CLOCKWORK_ID, "bagAndWarehouse") || 0));

      var newEntry = findEntryByStackId(stackId);
      var newGrade = (newEntry && newEntry.options && newEntry.options.grade) || 0;
      var matchInfo = (selectedKinds && selectedKinds.length) ? "，符合 " + countMatchedKinds(newEntry, selectedKinds) + "/" + minMatch + " 條指定屬性" : "";
      log("第 " + attempts + " 次強化：花費 " + fmt(spent) + " 金幣，結果 " + gradeNameOf(newGrade) + " 階（" + rolledKindsText(newEntry) + "）" + matchInfo);
      var targetDisplay = document.getElementById("iw-f-target-display");
      if (targetDisplay) targetDisplay.textContent = item.label + "：" + item.name + "（目前 " + gradeNameOf(newGrade) + " 階・" + rolledKindsText(newEntry) + "）";

      if (totalSpent >= budget && !(newGrade >= targetGrade && meetsKindRequirement(newEntry, selectedKinds, minMatch))) { reason = "budget"; break; }

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
      "buy-failed": "⚠️ 購買發條沒有成功扣款，真正原因已印在 Console（按 F12 看），麻煩截圖給我看。",
      "enhance-rejected": "⚠️ 這次強化沒有成功扣款，真正原因已印在 Console（按 F12 看），麻煩截圖給我看。",
      "item-gone": "⚠️ 找不到這件裝備了（可能被拆解或移動），停止。",
      "stopped": "⏹️ 已手動停止。",
      "unknown": "發生未知狀況，停止。"
    }[reason] || reason;

    document.getElementById("iw-enhance-summary").innerHTML =
      "<div>" + reasonText + "</div>" +
      "<div style='margin-top:8px;'>" +
      item.label + "：" + item.name + " → <b>" + gradeNameOf(finalGrade) + " 階</b>　（" + rolledKindsText(finalEntry) + "）<br>" +
      "強化次數：<b>" + attempts + "</b> 次　購買發條：<b>" + totalBought + "</b> 個<br>" +
      "總花費：<b>" + fmt(totalSpent) + "</b> 金幣" +
      "</div>";
  }

  console.log("[一鍵強化] loader 已就緒，裝備卡片上「25,000」按鈕前面應該會看到「⚡強化」按鈕。");
})();
