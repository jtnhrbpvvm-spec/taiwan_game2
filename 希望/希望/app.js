(function () {
  "use strict";

  // ---------- 常數 / 對照表 ----------
  var ELEMENT_LABEL = {
    none: "無屬性", physical: "物理", magical: "魔法",
    fire: "火", water: "水", earth: "地", tree: "木",
    dark: "暗", sun: "光", steel: "鋼"
  };
  var ELEMENT_CLASS = {
    none: "el-none", physical: "el-physical", magical: "el-magical",
    fire: "el-fire", water: "el-water", earth: "el-earth", tree: "el-tree",
    dark: "el-dark", sun: "el-sun", steel: "el-steel"
  };
  var SLOT_LABEL_FALLBACK = {
    weapon: "武器", shield: "盾", head: "頭部", body: "上衣", legs: "下著",
    feet: "鞋子", accessory: "飾品", earring: "耳環", necklace: "項鍊",
    bracelet: "手鐲", ring: "戒指"
  };

  var ITEMS = window.ITEMS || {};
  var MONSTERS = window.MONSTERS || {};
  var MAPS = window.MAPS || {};
  var QUESTS = window.QUESTS || {};
  var QUEST_PAGES = window.QUEST_PAGES || {};
  var MISSIONS = window.MISSIONS || {};
  var MISSION_TOKEN_ITEM_ID = window.MISSION_TOKEN_ITEM_ID || null;
  var ENCHANT_KINDS = window.ENCHANT_KINDS || [];
  // 已由玩家實測確認：這 6 種「每級XX」屬性，數字代表「每N級才加1點」，所以數字越小越強（不是每級直接加這麼多點）
  var REVERSED_PER_LEVEL_KINDS = [15, 16, 17, 18, 19, 20];
  function enchantKindLabel(kind, name) {
    return REVERSED_PER_LEVEL_KINDS.indexOf(kind) !== -1
      ? name + "（數字越小越強：每 N 級 +1 點）"
      : name;
  }
  var ENCHANT_GRADES = window.ENCHANT_GRADES || [];
  var ENCHANT_APPEARANCE = window.ENCHANT_APPEARANCE || {};
  var ENCHANT_VALUES = window.ENCHANT_VALUES || {};
  var ENCHANT_WINDERS = window.ENCHANT_WINDERS || [];

  // ---------- 等級差掉落率衰減（反推自遊戲原始程式碼，已確認生效）----------
  var DROP_DECAY_TABLE = [[55, .05], [50, .35], [45, .65], [40, .75], [35, .85], [30, .95]];
  function dropLevelMultiplier(playerLv, monsterLv) {
    var diff = playerLv - monsterLv;
    for (var i = 0; i < DROP_DECAY_TABLE.length; i++) {
      if (diff >= DROP_DECAY_TABLE[i][0]) return DROP_DECAY_TABLE[i][1];
    }
    return 1;
  }
  var DROP_WHIFF_CHANCE = 0.145; // 已由原始程式碼確認：攻擊力=0的怪物每次擊殺有14.5%機率整批掉落全部落空
  function dropWhiffMultiplier(monsterAtk) {
    return monsterAtk === 0 ? (1 - DROP_WHIFF_CHANCE) : 1;
  }
  var dropCalcState = { level: null, blacksmith: false };

  function dropCalcBar() {
    var html = '<div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;background:var(--panel-hi);border:1px solid var(--line-hi);border-radius:6px;">';
    html += '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-dim);cursor:pointer;">' +
      '<input type="checkbox" id="dropCalcBlacksmith"' + (dropCalcState.blacksmith ? " checked" : "") + '> 是否為鐵匠職業</label>';
    html += '</div>';
    return html;
  }
  function wireDropCalcBar(onChange) {
    var $bs = document.getElementById("dropCalcBlacksmith");
    if ($bs) $bs.addEventListener("change", function () {
      dropCalcState.blacksmith = $bs.checked;
      onChange();
    });
  }
  // 目前正在顯示的詳細頁（讓上方全域等級欄位變更時可以重新渲染）
  var currentDetail = null;
  function rerenderCurrentDetail() {
    if (!currentDetail) return;
    if (currentDetail.type === "monster") showMonster(currentDetail.id);
    else showItem(currentDetail.id);
  }
  function wireGlobalLevelField() {
    var $gl = document.getElementById("globalDropLevel");
    if (!$gl) return;
    if (dropCalcState.level != null) $gl.value = dropCalcState.level;
    $gl.addEventListener("change", function () {
      dropCalcState.level = $gl.value ? Number($gl.value) : null;
      rerenderCurrentDetail();
    });
  }


  // ---------- 鐵匠鑑定（跟齒輪強化是不同系統，公式反推自遊戲原始程式碼）----------
  var APPR_KIND_NAMES = { 1: "攻擊力", 2: "魔法力", 3: "防禦力", 4: "攻擊速度", 5: "必殺", 6: "命中率", 7: "迴避率", 8: "移動速度", 11: "HP%", 12: "AP%" };
  var APPR_FF = {
    weapon: [[1, 25], [4, 10], [6, 10], [5, 10], [11, 5]],
    magicWeapon: [[1, 25], [2, 25], [4, 10], [6, 10], [5, 10], [11, 5]],
    armor: [[3, 25], [4, 10], [7, 5], [11, 5], [12, 5]],
    shoes: [[3, 25], [4, 10], [7, 5], [8, 15], [11, 5], [12, 5]],
    accessory: [[1, 5], [2, 5], [3, 5], [4, 5], [6, 5], [7, 5], [5, 5], [8, 5], [11, 5], [12, 5]]
  };
  var APPR_PF = [-2, -1, 0, 1, 2, 3, 4, 5];
  var APPR_MF = {
    basic: [110000, 150000, 200000, 250000, 230000, 30000, 20000, 10000],
    advanced: [85000, 125000, 180000, 250000, 280000, 41000, 26000, 13000],
    superior: [60000, 100000, 160000, 250000, 320000, 59000, 34000, 17000]
  };
  var APPR_SKILL_REQ = { basic: 20, advanced: 215, superior: 190 };
  var APPR_EXTRA_REQ = { meticulous: 257, superMeticulous: 257 };
  var APPR_EXTRA_CHANCE = { meticulous: 0.3, superMeticulous: 0.7 };
  var APPR_THRESH = { base: 0.1, perLv: 0.0008, perRefine: 0.02, cap: 0.5 };

  function apprKindName(kind) { return APPR_KIND_NAMES[kind] || ("種類#" + kind); }
  function apprCategory(item) {
    var slot = item.equip ? item.equip.slot : null;
    var magic = item.equip ? (item.equip.magic || 0) : 0;
    var isMagicWeapon = magic > 0;
    if (slot === "weapon") return isMagicWeapon ? "magicWeapon" : "weapon";
    if (slot === "feet") return "shoes";
    if (slot === "head" || slot === "body" || slot === "legs" || slot === "shield") return "armor";
    return "accessory";
  }
  function apprThreshold(minLv, refine) {
    var n = APPR_THRESH.base + (minLv || 0) * APPR_THRESH.perLv + (refine || 0) * APPR_THRESH.perRefine;
    return Math.min(APPR_THRESH.cap, n);
  }
  function apprRollTierValue(tierName) {
    var weights = APPR_MF[tierName];
    var r = Math.random() * 1000000;
    for (var i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return APPR_PF[i];
    }
    return APPR_PF[APPR_PF.length - 1];
  }
  function apprValueRange(weight) { return { min: -2 * weight / 5, max: 5 * weight / 5 }; }
  function performAppraisalTrial(item, minLv, refine, tierName, extraChance) {
    var category = apprCategory(item);
    var candidates = APPR_FF[category] || [];
    var n = apprThreshold(minLv, refine);
    var passes = 1 + (extraChance > 0 && Math.random() < extraChance ? 1 : 0);
    var selected = {};
    for (var p = 0; p < passes; p++) {
      candidates.forEach(function (pair) { if (Math.random() < n) selected[pair[0]] = true; });
    }
    var result = [];
    candidates.forEach(function (pair) {
      var kind = pair[0], weight = pair[1];
      if (!selected[kind]) return;
      var tier = apprRollTierValue(tierName);
      if (tier !== 0) result.push({ kind: kind, value: tier * weight / 5 });
    });
    return { category: category, threshold: n, result: result };
  }

  var TOWNS = window.TOWNS || {};
  var DROP_INDEX = window.DROP_INDEX || {};
  var SHOP_INDEX = window.SHOP_INDEX || {};
  var RADIX_INDEX = window.RADIX_INDEX || {};
  var FORGE_BY_BOOK = window.FORGE_BY_BOOK || {};
  var FORGE_BY_PRODUCT = window.FORGE_BY_PRODUCT || {};
  var FORGE_PART_NAME = { weapon: "武器", armor: "防具", accessory: "配件" };
  function forgeSkillName(part) {
    return (FORGE_PART_NAME[part] || "") + "鍛造";
  }
  var COOK_BY_PRODUCT = window.COOK_BY_PRODUCT || {};
  var COOK_BY_INGREDIENT = window.COOK_BY_INGREDIENT || {};
  var COOK_TIER_NAME = { 1: "第1階", 2: "第2階", 3: "第3階" };
  var ALCHEMY_BY_BOOK = window.ALCHEMY_BY_BOOK || {};
  var ALCHEMY_BY_PRODUCT = window.ALCHEMY_BY_PRODUCT || {};
  var ALCHEMY_BOMBS = window.ALCHEMY_BOMBS || {};
  var CHANGELOG = window.CHANGELOG || [];
  var RATE_DIVISOR = window.RATE_DIVISOR || 1000000;

  // ---------- 索引：先把 id 轉成陣列方便搜尋 ----------
  var itemList = Object.keys(ITEMS).map(function (id) {
    return { id: id, name: ITEMS[id].name };
  });
  var monsterList = Object.keys(MONSTERS).map(function (id) {
    return { id: id, name: MONSTERS[id].name, lv: MONSTERS[id].lv };
  });

  // ---------- DOM ----------
  var $input = document.getElementById("searchInput");
  var $resultList = document.getElementById("resultList");
  var $resultTitle = document.getElementById("resultTitle");
  var $resultCount = document.getElementById("resultCount");
  var $detail = document.getElementById("detailPanel");
  var $hintRow = document.getElementById("hintRow");
  var $genTime = document.getElementById("genTime");

  if ($genTime && window.GENERATED_AT) {
    try {
      var d = new Date(window.GENERATED_AT);
      var pad = function (n) { return String(n).padStart(2, "0"); };
      $genTime.textContent = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() +
        " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    } catch (e) { $genTime.textContent = window.GENERATED_AT; }
  }

  // ---------- 小工具 ----------
  function pct(rate) {
    var p = (rate / RATE_DIVISOR) * 100;
    if (p >= 10) return p.toFixed(1) + "%";
    if (p >= 1) return p.toFixed(2) + "%";
    if (p >= 0.01) return p.toFixed(3) + "%";
    return p.toFixed(4) + "%";
  }
  function rateClass(rate) {
    var p = (rate / RATE_DIVISOR) * 100;
    return p < 1 ? "rate low" : "rate";
  }
  function mapName(id) { return MAPS[String(id)] || ("地圖#" + id); }
  function townName(id) {
    var t = TOWNS[String(id)];
    if (t) return t.name;
    return mapName(id);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtNum(n) {
    return Number(n).toLocaleString("zh-Hant");
  }
  // 物品編號在 ITEMS 裡查不到時（例如遊戲剛更新、資料還沒補齊），一律顯示「無資料」，
  // 不要把編號秀給玩家看；查不到的也不給點擊連結，因為點了也沒有對應頁面可以看。
  function itemChip(id, qty) {
    var it = ITEMS[id];
    if (!it) return '<span class="map-chip" style="opacity:.5;">無資料' + (qty != null ? ' ×' + qty : '') + '</span>';
    return '<span class="map-chip" data-goto-item="' + id + '">' + escapeHtml(it.name) + (qty != null ? ' ×' + qty : '') + '</span>';
  }
  function itemLinkRow(id, extraCellsHtml) {
    var it = ITEMS[id];
    if (!it) return '<tr><td><span class="name-link" style="cursor:default;opacity:.5;">無資料</span></td>' + extraCellsHtml + '</tr>';
    return '<tr class="clickable" data-goto-item="' + id + '"><td><span class="name-link">' + escapeHtml(it.name) + '</span></td>' + extraCellsHtml + '</tr>';
  }

  // 一些常見搜尋建議（挑幾個知名度高的字）
  var enchantChip = document.createElement("span");
  enchantChip.className = "hint-chip";
  enchantChip.style.borderColor = "var(--gold)";
  enchantChip.style.color = "var(--gold-hi)";
  enchantChip.textContent = "🔮 發條強化屬性表";
  enchantChip.addEventListener("click", function () {
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showEnchantTable();
  });
  $hintRow.appendChild(enchantChip);

  var apprChip = document.createElement("span");
  apprChip.className = "hint-chip";
  apprChip.style.borderColor = "var(--gold)";
  apprChip.style.color = "var(--gold-hi)";
  apprChip.textContent = "🔨 鐵匠鑑定試玩";
  apprChip.addEventListener("click", function () {
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showAppraisalTrial();
  });
  $hintRow.appendChild(apprChip);

  // ---------- 搜尋 ----------
  var currentMatches = { items: [], monsters: [] };

  function runSearch(qRaw) {
    apprTrialActive = false;
    var q = (qRaw || "").trim();
    currentMatches.items = [];
    currentMatches.monsters = [];

    if (q === "") {
      renderEmptyResults();
      showWelcome();
      return;
    }

    currentMatches.items = itemList.filter(function (it) {
      return it.name.indexOf(q) !== -1;
    }).slice(0, 200);

    currentMatches.monsters = monsterList.filter(function (m) {
      return m.name.indexOf(q) !== -1;
    }).slice(0, 200);

    renderResultList(q);

    // 自動選第一個最相關的結果
    var exactMonster = currentMatches.monsters.find(function (m) { return m.name === q; });
    var exactItem = currentMatches.items.find(function (it) { return it.name === q; });

    if (exactMonster) {
      showMonster(exactMonster.id);
    } else if (exactItem) {
      showItem(exactItem.id);
    } else if (currentMatches.monsters.length && !currentMatches.items.length) {
      showMonster(currentMatches.monsters[0].id);
    } else if (currentMatches.items.length && !currentMatches.monsters.length) {
      showItem(currentMatches.items[0].id);
    } else if (currentMatches.monsters.length) {
      showMonster(currentMatches.monsters[0].id);
    } else if (currentMatches.items.length) {
      showItem(currentMatches.items[0].id);
    } else {
      showNoResult(q);
    }
  }

  function renderEmptyResults() {
    $resultTitle.firstChild.textContent = "搜尋結果 ";
    $resultCount.textContent = "";
    $resultList.innerHTML = '<li class="empty-note">開始輸入以搜尋物品或怪物名稱。</li>';
  }

  function renderResultList(q) {
    var total = currentMatches.items.length + currentMatches.monsters.length;
    $resultCount.textContent = total ? "(" + total + ")" : "";

    if (total === 0) {
      var qLower = q.trim().toLowerCase();
      var isEgg = SEARCH_TRIGGERS.indexOf(qLower) !== -1;
      if (isEgg) {
        $resultList.innerHTML = '<li class="empty-note">找不到符合「<a href="' + EDITOR_URL +
          '" style="color:var(--gold-hi);text-decoration:underline;">希望修改器</a>」的物品或怪物。</li>';
      } else {
        $resultList.innerHTML = '<li class="empty-note">找不到符合「' + escapeHtml(q) + '」的物品或怪物。</li>';
      }
      return;
    }

    var html = "";

    if (currentMatches.monsters.length) {
      html += '<li class="empty-note" style="padding:6px 6px 2px;color:var(--gold-hi);font-size:12px;font-weight:700;">怪物 (' + currentMatches.monsters.length + ')</li>';
      currentMatches.monsters.forEach(function (m) {
        var mon = MONSTERS[m.id];
        var harvestTag = mon.isHarvest ? " ・採集" : "";
        html += '<li class="result-item" data-type="monster" data-id="' + m.id + '">' +
          '<span class="rname">' + escapeHtml(m.name) + '</span>' +
          '<span class="rmeta">Lv.' + m.lv + harvestTag + '</span></li>';
      });
    }

    if (currentMatches.items.length) {
      html += '<li class="empty-note" style="padding:10px 6px 2px;color:var(--gold-hi);font-size:12px;font-weight:700;">物品 (' + currentMatches.items.length + ')</li>';
      currentMatches.items.forEach(function (it) {
        var count = (DROP_INDEX[it.id] || []).length;
        var shopCount = (SHOP_INDEX[it.id] || []).length;
        var radixCount = (RADIX_INDEX[it.id] || []).length;
        var questRefs = buildQuestReferences(it.id);
        var metaParts = [];
        if (count) metaParts.push(count + " 隻怪物掉落");
        if (shopCount) metaParts.push("商店有賣");
        if (radixCount) metaParts.push("拉迪克斯有賣");
        if (FORGE_BY_BOOK[it.id]) metaParts.push("鍛造書");
        if (FORGE_BY_PRODUCT[it.id]) metaParts.push("可鍛造取得");
        if (COOK_BY_PRODUCT[it.id]) metaParts.push("料理成品");
        if (COOK_BY_INGREDIENT[it.id]) metaParts.push("可用於料理");
        if (ALCHEMY_BY_BOOK[it.id]) metaParts.push("煉金配方書");
        if (ALCHEMY_BY_PRODUCT[it.id]) metaParts.push("可煉金取得");
        if (questRefs.quests.length) metaParts.push("任務道具");
        if (questRefs.missions.length) metaParts.push("討伐獎勵");
        html += '<li class="result-item" data-type="item" data-id="' + it.id + '">' +
          '<span class="rname">' + escapeHtml(it.name) + '</span>' +
          '<span class="rmeta">' + (metaParts.length ? metaParts.join("・") : "無掉落／販售紀錄") + '</span></li>';
      });
    }

    $resultList.innerHTML = html;
  }

  function markActive(type, id) {
    var nodes = $resultList.querySelectorAll(".result-item");
    nodes.forEach(function (n) {
      n.classList.toggle("active", n.dataset.type === type && n.dataset.id === String(id));
    });
  }

  $resultList.addEventListener("click", function (e) {
    var item = e.target.closest(".result-item");
    if (!item) return;
    if (item.dataset.type === "monster") showMonster(item.dataset.id);
    else showItem(item.dataset.id);
  });

  // ---------- 詳細頁：物品 ----------
  // ---------- 任務／討伐任務關聯 ----------
  function buildQuestReferences(itemId) {
    var idNum = Number(itemId);
    var quests = [];
    Object.keys(QUESTS).forEach(function (qid) {
      var q = QUESTS[qid];
      if (q.itemId === idNum) quests.push({ id: qid, q: q });
    });

    var missions = [];
    Object.keys(MISSIONS).forEach(function (mid) {
      var m = MISSIONS[mid];
      var role = null;
      if (m.reward === idNum) role = "reward";
      else if (MISSION_TOKEN_ITEM_ID != null && idNum === MISSION_TOKEN_ITEM_ID && m.token) role = "token";
      if (role) missions.push({ id: mid, m: m, role: role });
    });

    return { quests: quests, missions: missions };
  }

  function renderQuestRefCard(r) {
    var q = r.q;
    var page = QUEST_PAGES[String(q.pageId)] || {};
    var monN = MONSTERS[String(q.monsterId)] ? MONSTERS[String(q.monsterId)].name : ("怪物#" + q.monsterId);
    var lvRange = "Lv" + q.reqLevel + (q.reqLevelMax != null ? " ~ Lv" + q.reqLevelMax : " 以上");
    var fameRange = (q.reqFameMin || 0) + " ~ " + (q.reqFameMax != null ? q.reqFameMax : "無上限");
    var towns = (page.towns && page.towns.length) ? page.towns.join("、") : "未知";
    return '<div class="equip-box">' +
      '<div class="row1"><span class="slot">📜 任務 #' + r.id + '　' + escapeHtml(page.title || "") + '</span></div>' +
      '<div style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '內容：擊殺「' + escapeHtml(monN) + '」，繳交此物品 x' + q.count + '<br>' +
      '接取地點：<b style="color:var(--gold-hi);">' + escapeHtml(towns) + '</b><br>' +
      '需求：' + lvRange + '　・　名聲 ' + fameRange + '<br>' +
      '獎勵：名聲 +' + fmtNum(q.fame) + '　經驗 +' + fmtNum(q.exp) + '　金錢 +' + fmtNum(q.gold) +
      '</div></div>';
  }

  function renderMissionRefCard(r) {
    var m = r.m;
    var monN = MONSTERS[String(m.monsterId)] ? MONSTERS[String(m.monsterId)].name : ("怪物#" + m.monsterId);
    var roleText = r.role === "reward" ? "討伐獎勵物品" : "討伐任務代幣";
    return '<div class="equip-box">' +
      '<div class="row1"><span class="slot">🎯 討伐任務 #' + r.id + '　' + escapeHtml(roleText) + '</span></div>' +
      '<div style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '內容：擊殺「' + escapeHtml(monN) + '」x' + m.need + '<br>' +
      '接取方式：<b style="color:var(--gold-hi);">不用找 NPC</b>，角色等級到達 Lv' + m.unlockLevel + ' 後打到指定怪物會自動開始計算進度<br>' +
      '獎勵：經驗 +' + fmtNum(m.exp) + '　金錢 +' + fmtNum(m.gold) +
      (m.token ? '　代幣 x' + m.token : '') +
      (m.reward ? '　額外物品 x' + (m.rewardCount || 1) : '') +
      '</div></div>';
  }

  function showEnchantTable(gradeIdx, winderOpen) {
    apprTrialActive = false;
    gradeIdx = gradeIdx || 0;
    var gradeNum = gradeIdx + 1; // ENCHANT_APPEARANCE / ENCHANT_VALUES 的 key 是 1-indexed (N=1)

    var html = '<h2 style="margin-top:0;">🔮 發條強化屬性表</h2>';
    html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">';
    ENCHANT_GRADES.forEach(function (g, idx) {
      var active = idx === gradeIdx;
      html += '<button class="grade-tab-btn" data-grade="' + idx + '" style="padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;' +
        'border:1px solid ' + (active ? "var(--gold)" : "var(--line)") + ';' +
        'background:' + (active ? "var(--gold)" : "var(--panel)") + ';' +
        'color:' + (active ? "var(--ink)" : "var(--text)") + ';">' + g + '</button>';
    });
    html += '<button id="winderToggleBtn" style="padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12.5px;' +
      'border:1px solid var(--line-hi);background:var(--ink-2);color:var(--text-dim);margin-left:6px;">' +
      '🔧 發條升級機率／花費 ' + (winderOpen ? "▲" : "▼") + '</button>';
    html += '</div>';

    if (winderOpen) {
      html += '<div class="section-title">發條升級機率／花費</div>';
      var realWinders = ENCHANT_WINDERS.filter(function (w) {
        return w.name.indexOf("不可交易") === -1 && w.name.indexOf("無法交易") === -1;
      });
      realWinders.forEach(function (w) {
        html += '<div class="equip-box"><div class="row1"><span class="slot">' + escapeHtml(w.name) + '</span></div>';
        html += '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.9;">';
        w.grades.forEach(function (row) {
          // 已由玩家實測驗證修正：表格裡的原始數字 0 代表「還沒強化過」，1~5 才對應 N~SG（要 -1 才是陣列索引）
          var from = row[0] === 0 ? "尚未強化過" : (ENCHANT_GRADES[row[0] - 1] || ("更高階#" + row[0]));
          var to = ENCHANT_GRADES[row[1] - 1] || ("更高階#" + row[1]);
          var rate = (row[2] / 1000).toFixed(2) + "%";
          html += escapeHtml(from) + " → " + escapeHtml(to) + "：" + rate + "<br>";
        });
        html += "</div></div>";
      });
    }

    html += '<div class="section-title">' + escapeHtml(ENCHANT_GRADES[gradeIdx] || "") + ' 等級可能開出的屬性</div>';
    var appear = ENCHANT_APPEARANCE[String(gradeNum)] || [];
    var totalWeight = appear.reduce(function (s, a) { return s + a.weight; }, 0);
    if (!appear.length) {
      html += '<div class="empty-note">這個等級沒有資料。</div>';
    } else {
      appear.slice().sort(function (a, b) { return b.weight - a.weight; }).forEach(function (a) {
        var kindDef = ENCHANT_KINDS.find(function (k) { return k.kind === a.kind; });
        var kindName = kindDef ? enchantKindLabel(a.kind, kindDef.name) : ("種類#" + a.kind);
        var pct = totalWeight ? (a.weight / totalWeight * 100).toFixed(2) + "%" : "?";
        var ranges = (ENCHANT_VALUES[gradeNum + "-" + a.kind] || []).slice();
        var isReversedKind = REVERSED_PER_LEVEL_KINDS.indexOf(a.kind) !== -1;
        ranges.sort(function (x, y) { return isReversedKind ? x.min - y.min : y.min - x.min; });
        var rangeWeightTotal = ranges.reduce(function (s, r) { return s + r.weight; }, 0);
        var rangeText = ranges.length
          ? ranges.map(function (r) {
              var label = r.min === r.max ? String(r.min) : (r.min + " ~ " + r.max);
              var subPct = rangeWeightTotal ? "（" + (r.weight / rangeWeightTotal * 100).toFixed(1) + "%）" : "";
              return label + subPct;
            }).join("、")
          : "無範圍資料";
        var isDiscrete = ranges.length > 1 && ranges.every(function (r) { return r.min === r.max; });
        html += '<div class="equip-box"><div class="row1"><span class="slot">' + escapeHtml(kindName) +
          '</span><span style="color:var(--text-dim);font-size:12px;">出現機率 ' + pct + '</span></div>' +
          '<div style="font-size:12.5px;color:var(--text-dim);">' +
          (isDiscrete ? "可能開出的固定數值：" : "可能數值：") + escapeHtml(rangeText) + '</div></div>';
      });
    }

    $detail.innerHTML = html;
    document.querySelectorAll(".grade-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { showEnchantTable(Number(btn.getAttribute("data-grade")), winderOpen); });
    });
    var toggleBtn = document.getElementById("winderToggleBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () { showEnchantTable(gradeIdx, !winderOpen); });
    }
  }

  function showAppraisalTrial() {
    apprTrialActive = true;
    var state = {
      itemId: null, level: 250, refine: 12, tier: "basic", extra: "none",
      stats: {}, history: [], rollCounter: 0, page: 0, rulesOpen: false
    };
    apprTrialOnPick = function (id) {
      state.itemId = Number(id);
      renderItemInfo();
      renderAction();
    };

    function render() {
      var canAdvanced = state.level >= APPR_SKILL_REQ.advanced;
      var canSuperior = state.level >= APPR_SKILL_REQ.superior;
      var canMeticulous = state.level >= APPR_EXTRA_REQ.meticulous;

      var html = '<h2 style="margin-top:0;">🔨 鐵匠鑑定試玩</h2>';
      html += '<div class="panel-desc" style="margin-bottom:14px;">' +
        '這是鐵匠職業「鑑定」技能的試算工具，公式反推自遊戲原始程式碼。不用登入、不會影響任何真實存檔，純粹讓你試手氣看看。' +
        '請直接用上面的「職業／裝備位置／符合的裝備」下拉選單選擇要測試的裝備。' +
        '</div>';

      html += '<button id="apprRulesToggleBtn" style="padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12.5px;' +
        'border:1px solid var(--line-hi);background:var(--ink-2);color:var(--text-dim);margin-bottom:14px;">' +
        '📖 鑑定規則 ' + (state.rulesOpen ? "▲" : "▼") + '</button>';

      if (state.rulesOpen) {
        html += '<div class="equip-box" style="margin-bottom:14px;line-height:1.9;font-size:12.5px;color:var(--text-dim);">' +
          '<div style="color:var(--gold-hi);font-weight:700;margin-bottom:8px;">以下規則反推自遊戲原始程式碼，並經玩家實測驗證</div>' +

          '<b style="color:var(--text);">① 裝備依部位分成 5 個分類，各自有固定候選屬性與權重：</b><br>' +
          '武器：攻擊力25、攻速10、命中10、必殺10、HP%5<br>' +
          '魔法武器：攻擊力25、魔法力25、攻速10、命中10、必殺10、HP%5<br>' +
          '防具（頭/身/腳/盾）：防禦力25、攻速10、迴避5、HP%5、AP%5<br>' +
          '鞋子：防禦力25、攻速10、迴避5、移速15、HP%5、AP%5<br>' +
          '飾品：攻擊/魔法/防禦/攻速/命中/迴避/必殺/移速/HP%/AP% 各5<br><br>' +

          '<b style="color:var(--text);">② 每個候選屬性各自獨立判定「這次有沒有出現」：</b><br>' +
          '出現機率 = min(50%, 10% + 裝備需求等級 × 0.08% + 精煉值 × 2%)<br>' +
          '（需求等級、精煉值越高，屬性越容易出現，上限 50%；如果有追加鑑定被動，會用同樣機率再多判定一輪，讓更多屬性有機會出現）<br><br>' +

          '<b style="color:var(--text);">③ 每條出現的屬性，再骰一次「強度等級」（-2~+5，共8階）：</b><br>' +
          '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;">' +
          '<tr style="color:var(--text);"><td>鑑定技能</td><td>-2</td><td>-1</td><td>0（不生效）</td><td>+1</td><td>+2</td><td>+3</td><td>+4</td><td>+5</td></tr>' +
          '<tr><td>鑑定道具（基礎）</td><td>11%</td><td>15%</td><td>20%</td><td>25%</td><td>23%</td><td>3%</td><td>2%</td><td>1%</td></tr>' +
          '<tr><td>高級鑑定</td><td>8.5%</td><td>12.5%</td><td>18%</td><td>25%</td><td>28%</td><td>4.1%</td><td>2.6%</td><td>1.3%</td></tr>' +
          '<tr><td>高級道具鑑定</td><td>6%</td><td>10%</td><td>16%</td><td>25%</td><td>32%</td><td>5.9%</td><td>3.4%</td><td>1.7%</td></tr>' +
          '</table><br>' +

          '<b style="color:var(--text);">④ 最終數值 = 強度等級 × 屬性權重 ÷ 5</b><br>' +
          '例如武器攻擊力（權重25）強度+3 = 3×25÷5 = <b style="color:#6fa85a;">+15</b>；防具迴避（權重5）強度-2 = -2×5÷5 = <b style="color:#e0663f;">-2</b>。<br><br>' +

          '<b style="color:var(--text);">⑤ 追加鑑定被動：</b>「縝密鑑定」30% 機率、「超縝密鑑定」70% 機率，會讓②的判定多跑一輪，增加更多屬性同時出現的機會，' +
          '不是保底多少條——理論上沒有條數上限，只是機率上很少見到超過 3 條。' +
          '</div>';
      }

      html += '<div class="section-title">角色設定</div>';
      html += '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;align-items:flex-end;">';
      html += '<div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:4px;">角色等級</label>' +
        '<input type="number" id="apprTrialLevel" value="' + state.level + '" min="1" max="999" style="width:90px;padding:8px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:3px;color:var(--text);"></div>';
      html += '<div><label style="display:block;font-size:12px;color:var(--text-dim);margin-bottom:4px;">裝備精煉值</label>' +
        '<select id="apprTrialRefine" style="padding:9px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:3px;color:var(--text);">';
      for (var rv = 0; rv <= 12; rv++) {
        html += '<option value="' + rv + '"' + (rv === state.refine ? " selected" : "") + '>+' + rv + '</option>';
      }
      html += '</select></div></div>';

      html += '<div class="section-title">鑑定技能（等級不夠會鎖住）</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-size:13px;">';
      html += radioRow("apprTrialTier", "basic", state.tier, "鑑定道具（基礎，Lv" + APPR_SKILL_REQ.basic + "）", true);
      html += radioRow("apprTrialTier", "advanced", state.tier, "高級鑑定（Lv" + APPR_SKILL_REQ.advanced + "）", canAdvanced);
      html += radioRow("apprTrialTier", "superior", state.tier, "高級道具鑑定（最佳，Lv" + APPR_SKILL_REQ.superior + "）", canSuperior);
      html += '</div>';

      html += '<div class="section-title">追加鑑定被動（等級不夠會鎖住）</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-size:13px;">';
      html += radioRow("apprTrialExtra", "none", state.extra, "無", true);
      html += radioRow("apprTrialExtra", "meticulous", state.extra, "縝密鑑定（30%，Lv" + APPR_EXTRA_REQ.meticulous + "）", canMeticulous);
      html += radioRow("apprTrialExtra", "superMeticulous", state.extra, "超縝密鑑定（70%，Lv" + APPR_EXTRA_REQ.superMeticulous + "）", canMeticulous);
      html += '</div>';

      html += '<div class="section-title">要測試鑑定的裝備</div>';
      html += '<div id="apprTrialItemInfo" style="font-size:12.5px;color:var(--text-dim);margin-bottom:14px;">尚未選擇裝備，請用上面的篩選器挑一件。</div>';

      html += '<div id="apprTrialActionBox"></div>';
      html += '<div id="apprTrialStatsBox" style="margin-top:16px;"></div>';
      html += '<div id="apprTrialHistoryBox" style="margin-top:16px;"></div>';

      $detail.innerHTML = html;
      wireEvents();
      renderItemInfo();
      renderAction();
      renderStats();
      renderHistory();
    }

    function radioRow(name, value, current, label, enabled) {
      var checked = current === value;
      return '<label style="display:flex;align-items:center;gap:8px;' + (enabled ? "cursor:pointer;" : "opacity:.4;cursor:not-allowed;") + '">' +
        '<input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + (enabled ? "" : " disabled") + '>' +
        escapeHtml(label) + '</label>';
    }

    function wireEvents() {
      document.getElementById("apprRulesToggleBtn").addEventListener("click", function () {
        state.rulesOpen = !state.rulesOpen;
        render();
      });
      document.getElementById("apprTrialLevel").addEventListener("change", function (e) {
        state.level = Math.max(1, e.target.valueAsNumber || 1);
        if (state.level < APPR_SKILL_REQ.advanced && state.tier === "advanced") state.tier = "basic";
        if (state.level < APPR_SKILL_REQ.superior && state.tier === "superior") state.tier = "basic";
        if (state.level < APPR_EXTRA_REQ.meticulous && state.extra !== "none") state.extra = "none";
        render();
      });
      document.getElementById("apprTrialRefine").addEventListener("change", function (e) { state.refine = Number(e.target.value); });
      document.querySelectorAll('input[name="apprTrialTier"]').forEach(function (r) {
        r.addEventListener("change", function () { state.tier = r.value; });
      });
      document.querySelectorAll('input[name="apprTrialExtra"]').forEach(function (r) {
        r.addEventListener("change", function () { state.extra = r.value; });
      });
    }

    function renderItemInfo() {
      var $info = document.getElementById("apprTrialItemInfo");
      if (!$info) return;
      var it = ITEMS[String(state.itemId)];
      if (!it || !it.equip) { $info.textContent = "尚未選擇裝備，請用上面的篩選器挑一件。"; return; }
      var category = apprCategory(it);
      var categoryNames = { weapon: "武器", magicWeapon: "魔法武器", armor: "防具", shoes: "鞋子", accessory: "飾品" };
      $info.textContent = "已選擇：" + it.name + "　部位：" + it.equip.slotName + "　需求等級：Lv" + it.equip.minLv + "　鑑定分類：" + (categoryNames[category] || category);
    }

    function renderAction() {
      var $box = document.getElementById("apprTrialActionBox");
      if (!$box) return;
      $box.innerHTML = "";
      var row = document.createElement("div");
      row.style.cssText = "display:flex;gap:10px;align-items:center;flex-wrap:wrap;";

      var rollBtn = makeEl("button", {}, "🎲 鑑定");
      rollBtn.style.cssText = "padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;border:1px solid var(--gold);background:var(--gold);color:var(--ink);";
      rollBtn.disabled = !state.itemId;
      if (!state.itemId) { rollBtn.style.opacity = ".4"; rollBtn.style.cursor = "not-allowed"; }
      rollBtn.addEventListener("click", function () {
        if (!state.itemId) return;
        var it = ITEMS[String(state.itemId)];
        var extraChance = state.extra === "none" ? 0 : APPR_EXTRA_CHANCE[state.extra];
        var r = performAppraisalTrial(it.equip, it.equip.minLv, state.refine, state.tier, extraChance);
        r.result.forEach(function (line) {
          var key = line.kind + ":" + line.value;
          state.stats[key] = (state.stats[key] || 0) + 1;
        });
        state.rollCounter += 1;
        state.history.unshift({ n: state.rollCounter, lines: r.result, category: r.category, threshold: r.threshold });
        if (state.history.length > 100) state.history.length = 100;
        state.page = 0;
        renderStats();
        renderHistory();
      });
      row.appendChild(rollBtn);

      var clearBtn = makeEl("button", {}, "🗑️ 清除目前統計");
      clearBtn.style.cssText = "padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12.5px;border:1px solid var(--line-hi);background:var(--panel);color:var(--text-dim);";
      clearBtn.addEventListener("click", function () {
        state.stats = {};
        state.history = [];
        state.rollCounter = 0;
        state.page = 0;
        renderStats();
        renderHistory();
      });
      row.appendChild(clearBtn);

      $box.appendChild(row);
      if (!state.itemId) {
        $box.appendChild(makeEl("div", { style: "color:var(--text-faint);font-size:12.5px;margin-top:8px;" }, "請先用上面的職業／裝備位置篩選器選擇一件裝備。"));
      }
    }

    function renderStats() {
      var $box = document.getElementById("apprTrialStatsBox");
      if (!$box) return;
      $box.innerHTML = "";
      var totalRolls = state.history.length > 0 ? state.rollCounter : 0;
      $box.appendChild(makeEl("div", { class: "section-title" }, "統計（累計鑑定 " + totalRolls + " 次）"));
      var keys = Object.keys(state.stats);
      if (!keys.length) {
        $box.appendChild(makeEl("div", { class: "empty-note" }, "還沒有任何鑑定紀錄，按上面的「鑑定」試試看。"));
        return;
      }
      var rows = keys.map(function (k) {
        var parts = k.split(":");
        return { kind: Number(parts[0]), value: Number(parts[1]), count: state.stats[k] };
      });
      rows.sort(function (a, b) { return a.kind - b.kind || a.value - b.value; });
      var grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;";
      rows.forEach(function (r) {
        var box = document.createElement("div");
        box.className = "equip-box";
        box.style.padding = "10px 12px";
        box.innerHTML = '<div style="font-size:13px;">' + escapeHtml(apprKindName(r.kind)) + ' ' +
          (r.value > 0 ? "+" : "") + r.value + '</div>' +
          '<div style="font-size:12px;color:var(--text-dim);margin-top:2px;">出現 ' + r.count + ' 次</div>';
        grid.appendChild(box);
      });
      $box.appendChild(grid);
    }

    function renderHistory() {
      var $box = document.getElementById("apprTrialHistoryBox");
      if (!$box) return;
      $box.innerHTML = "";
      if (!state.history.length) return;
      var perPage = 10;
      var totalPages = Math.ceil(state.history.length / perPage);
      if (state.page >= totalPages) state.page = totalPages - 1;
      if (state.page < 0) state.page = 0;
      var start = state.page * perPage;
      var pageItems = state.history.slice(start, start + perPage);

      $box.appendChild(makeEl("div", { class: "section-title" },
        "歷史紀錄（第 " + (state.page + 1) + " / " + totalPages + " 頁，最多保留 100 筆）"));

      pageItems.forEach(function (item) {
        var box = document.createElement("div");
        box.className = "equip-box";
        var linesText = item.lines.length
          ? item.lines.map(function (l) { return apprKindName(l.kind) + " " + (l.value > 0 ? "+" : "") + l.value; }).join("、")
          : "沒有鑑定出任何屬性";
        box.innerHTML = '<div class="row1"><span class="slot">第 ' + item.n + ' 次</span></div>' +
          '<div style="font-size:12.5px;color:var(--text-dim);">' + escapeHtml(linesText) + '</div>';
        $box.appendChild(box);
      });

      var pager = document.createElement("div");
      pager.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:center;margin-top:10px;";
      var prevBtn = makeEl("button", {}, "◀ 上一頁（較新）");
      prevBtn.style.cssText = "padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12.5px;border:1px solid var(--line-hi);background:var(--panel);color:var(--text);";
      prevBtn.disabled = state.page <= 0;
      if (prevBtn.disabled) prevBtn.style.opacity = ".4";
      prevBtn.addEventListener("click", function () { state.page--; renderHistory(); });
      var nextBtn = makeEl("button", {}, "下一頁（較舊）▶");
      nextBtn.style.cssText = prevBtn.style.cssText;
      nextBtn.disabled = state.page >= totalPages - 1;
      if (nextBtn.disabled) nextBtn.style.opacity = ".4";
      nextBtn.addEventListener("click", function () { state.page++; renderHistory(); });
      pager.appendChild(prevBtn);
      pager.appendChild(makeEl("span", { style: "font-size:12.5px;color:var(--text-dim);" }, (state.page + 1) + " / " + totalPages));
      pager.appendChild(nextBtn);
      $box.appendChild(pager);
    }

    function makeEl(tag, attrs, text) {
      var e = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      if (text != null) e.textContent = text;
      return e;
    }

    render();
  }

  function showItem(id) {
    id = String(id);
    var item = ITEMS[id];
    if (!item) return;
    markActive("item", id);
    currentDetail = { type: "item", id: id };

    var drops = (DROP_INDEX[id] || []).slice().sort(function (a, b) { return b.r - a.r; });

    var html = '<div class="detail-head"><div>' +
      '<div class="detail-title">' + escapeHtml(item.name) + '</div>' +
      '<div class="detail-sub">物品編號 #' + id + '</div>' +
      '</div></div>';

    html += '<div class="price-row">' +
      '<span>販售價 <b>' + fmtNum(item.sell) + '</b></span>' +
      '<span>購買價 <b>' + fmtNum(item.buy) + '</b></span>' +
      '</div>';

    if (item.equip) {
      var eq = item.equip;
      var slotName = eq.slotName || SLOT_LABEL_FALLBACK[eq.slot] || eq.slot;
      html += '<div class="equip-box">' +
        '<div class="row1"><span class="slot">裝備・' + escapeHtml(slotName) + '</span>' +
        '<span class="badge">需求等級 ' + eq.minLv + '</span></div>' +
        '<div class="equip-stat-grid">' +
        eqStat("攻擊", eq.atk) + eqStat("防禦", eq.def) + eqStat("魔法", eq.magic) +
        eqStat("攻速", eq.atkSpeed) + eqStat("必殺", eq.crit) + eqStat("迴避", eq.eva) +
        eqStat("移速", eq.moveSpeed) +
        (eq.attrs ? attrStats(eq.attrs) : "") +
        '</div></div>';
    }

    var shopEntries = (SHOP_INDEX[id] || []).slice().sort(function (a, b) { return a.price - b.price; });
    html += '<div class="section-title">販售商店 <span class="count">(' + shopEntries.length + ')</span></div>';
    if (!shopEntries.length) {
      html += '<div class="empty-note">沒有商店販售這個物品（可能只能靠掉落、任務或製作取得）。</div>';
    } else {
      html += '<table class="dtable"><thead><tr><th>NPC</th><th>地點</th><th>價格</th></tr></thead><tbody>';
      shopEntries.forEach(function (s) {
        html += '<tr>' +
          '<td><span class="name-link" style="cursor:default;">' + escapeHtml(s.npc) + '</span></td>' +
          '<td>' + escapeHtml(townName(s.t)) + '</td>' +
          '<td><span class="rate">' + fmtNum(s.price) + '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    var radixEntries = (RADIX_INDEX[id] || []).slice();
    if (radixEntries.length) {
      var tokenName = MISSION_TOKEN_ITEM_ID != null ? (ITEMS[MISSION_TOKEN_ITEM_ID] ? ITEMS[MISSION_TOKEN_ITEM_ID].name : "R代幣") : "R代幣";
      html += '<div class="section-title">拉迪克斯（希望路線商店） <span class="count">(' + radixEntries.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>NPC</th><th>地點</th><th>價格</th></tr></thead><tbody>';
      radixEntries.forEach(function (s) {
        html += '<tr>' +
          '<td><span class="name-link" style="cursor:default;">' + escapeHtml(s.npc) + '</span></td>' +
          '<td>' + escapeHtml(townName(s.t)) + '</td>' +
          '<td><span class="rate">' + fmtNum(s.price) + ' ' + escapeHtml(tokenName) + '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    var forgeBook = FORGE_BY_BOOK[id];
    if (forgeBook) {
      html += '<div class="section-title">鍛造書 <span class="count">可製作 ' + forgeBook.products.length + ' 種成品</span></div>';
      html += '<div class="equip-box">';
      html += '<div class="row1"><span class="slot">' + forgeSkillName(forgeBook.part) + ' Lv' + forgeBook.skillLv + '</span>' +
        '<span class="rate">成功率 ' + forgeBook.rate + '%</span></div>';
      html += '<div class="equip-stat-grid">' +
        '<div>需求等級<br><b>Lv' + forgeBook.charLv + '</b></div>' +
        '<div>力量需求<br><b>' + forgeBook.strMin + '</b></div>' +
        '<div>金幣<br><b>' + fmtNum(forgeBook.gold) + '</b></div>' +
        '<div>經驗<br><b>' + fmtNum(forgeBook.exp) + '</b></div>' +
        '</div></div>';
      html += '<div class="section-title" style="margin-top:14px;">所需材料</div>';
      html += '<div class="map-chip-row">';
      forgeBook.mats.forEach(function (m) { html += itemChip(m[0], m[1]); });
      html += '</div>';
      html += '<div class="section-title" style="margin-top:14px;">可能製作出</div>';
      html += '<div class="map-chip-row">';
      forgeBook.products.forEach(function (pid) { html += itemChip(pid); });
      html += '</div>';
    }

    var forgeProducts = (FORGE_BY_PRODUCT[id] || []).slice();
    if (forgeProducts.length) {
      html += '<div class="section-title">可透過鍛造取得 <span class="count">(' + forgeProducts.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>鍛造書</th><th>成功率</th><th>需求</th></tr></thead><tbody>';
      forgeProducts.forEach(function (p) {
        html += itemLinkRow(p.book, '<td><span class="rate">' + p.rate + '%</span></td><td>Lv' + p.charLv + '・力量 ' + p.strMin + '</td>');
      });
      html += '</tbody></table>';
    }

    var cookRecipe = COOK_BY_PRODUCT[id];
    if (cookRecipe) {
      html += '<div class="section-title">料理配方 <span class="count">' + (COOK_TIER_NAME[cookRecipe.tier] || ("第" + cookRecipe.tier + "階")) + '</span></div>';
      html += '<div class="equip-box"><div class="equip-stat-grid">' +
        '<div>需求技能等級<br><b>Lv' + cookRecipe.skillLv + '</b></div>' +
        '<div>角色等級<br><b>Lv' + cookRecipe.charLv + '</b></div>' +
        (cookRecipe.heal ? '<div>回復 HP<br><b>' + fmtNum(cookRecipe.heal) + '</b></div>' : '') +
        (cookRecipe.healAp ? '<div>回復 AP<br><b>' + fmtNum(cookRecipe.healAp) + '</b></div>' : '') +
        '</div></div>';
      if (cookRecipe.mats.length) {
        html += '<div class="section-title" style="margin-top:14px;">固定材料</div><div class="map-chip-row">';
        cookRecipe.mats.forEach(function (m) { html += itemChip(m[0], m[1]); });
        html += '</div>';
      }
      if (cookRecipe.keys.length) {
        html += '<div class="section-title" style="margin-top:14px;">任選食材 <span class="count">(任選 ' + cookRecipe.keyCount + ' 種)</span></div><div class="map-chip-row">';
        cookRecipe.keys.forEach(function (k) { html += itemChip(k[0], k[1]); });
        html += '</div>';
      }
    }

    var cookUses = (COOK_BY_INGREDIENT[id] || []).slice();
    if (cookUses.length) {
      html += '<div class="section-title">可用於料理 <span class="count">(' + cookUses.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>料理成品</th><th>用途</th><th>需求數量</th></tr></thead><tbody>';
      cookUses.forEach(function (u) {
        html += itemLinkRow(u.product, '<td>' + (u.via === "mat" ? "固定材料" : "任選食材") + '</td><td>×' + u.qty + '</td>');
      });
      html += '</tbody></table>';
    }

    var alchemyBook = ALCHEMY_BY_BOOK[id];
    if (alchemyBook) {
      var bomb = ALCHEMY_BOMBS[alchemyBook.product];
      html += '<div class="section-title">煉金配方</div>';
      html += '<div class="equip-box"><div class="equip-stat-grid">' +
        '<div>需求技能等級<br><b>Lv' + alchemyBook.skillLv + '</b></div>' +
        '<div>成功率<br><b>' + alchemyBook.rate + '%</b></div>' +
        '<div>金幣<br><b>' + fmtNum(alchemyBook.gold) + '</b></div>' +
        '<div>經驗<br><b>' + fmtNum(alchemyBook.exp) + '</b></div>' +
        '<div>製作數量<br><b>' + alchemyBook.count + '</b></div>' +
        (alchemyBook.cooldownMs ? '<div>冷卻時間<br><b>' + (alchemyBook.cooldownMs / 1000) + ' 秒</b></div>' : '') +
        '</div></div>';
      html += '<div class="section-title" style="margin-top:14px;">所需材料</div><div class="map-chip-row">';
      alchemyBook.mats.forEach(function (m) { html += itemChip(m[0], m[1]); });
      html += '</div>';
      html += '<div class="section-title" style="margin-top:14px;">製作出</div><div class="map-chip-row">';
      html += itemChip(alchemyBook.product);
      html += '</div>';
      if (bomb) {
        html += '<div class="section-title" style="margin-top:14px;">成品數值</div><div class="equip-box"><div class="equip-stat-grid">' +
          '<div>需求等級<br><b>Lv' + bomb.minLv + '</b></div>' +
          '<div>傷害<br><b>' + fmtNum(bomb.damage) + '</b></div>' +
          '<div>單價<br><b>' + fmtNum(bomb.price) + '</b></div>' +
          '</div></div>';
      }
    }

    var alchemyUses = (ALCHEMY_BY_PRODUCT[id] || []).slice();
    if (alchemyUses.length) {
      html += '<div class="section-title">可透過煉金取得 <span class="count">(' + alchemyUses.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>配方書</th><th>成功率</th><th>需求</th><th>數量</th></tr></thead><tbody>';
      alchemyUses.forEach(function (u) {
        html += itemLinkRow(u.book, '<td><span class="rate">' + u.rate + '%</span></td><td>技能 Lv' + u.skillLv + '</td><td>×' + u.count + '</td>');
      });
      html += '</tbody></table>';
    }

    var questRefs = buildQuestReferences(id);
    html += '<div class="section-title">任務關聯 <span class="count">(' + (questRefs.quests.length + questRefs.missions.length) + ')</span></div>';
    if (!questRefs.quests.length && !questRefs.missions.length) {
      html += '<div class="empty-note">這個物品跟任務／討伐任務系統沒有關聯。</div>';
    } else {
      questRefs.quests.forEach(function (r) {
        html += renderQuestRefCard(r);
      });
      questRefs.missions.forEach(function (r) {
        html += renderMissionRefCard(r);
      });
    }

    html += '<div class="section-title">會掉落此物品的怪物 <span class="count">(' + drops.length + ')</span></div>';

    if (!drops.length) {
      html += '<div class="empty-note">目前資料中沒有任何怪物掉落這個物品（可能來自商店、任務、製作或活動）。</div>';
    } else {
      html += dropCalcBar();
      var hasAnyWhiff = drops.some(function (d) { var m = MONSTERS[String(d.m)]; return m && m.atk === 0; });
      var showAdj = dropCalcState.level != null || hasAnyWhiff;
      html += '<table class="dtable"><thead><tr>' +
        '<th>怪物</th><th>出現地圖</th><th>原始機率</th>' + (showAdj ? '<th>換算後機率</th>' : '') + '</tr></thead><tbody>';
      drops.forEach(function (d) {
        var mon = MONSTERS[String(d.m)];
        if (!mon) return;
        var maps = mon.maps.map(mapName).join("、");
        var adjCell = "";
        if (showAdj) {
          var levelMult = dropCalcState.level != null
            ? (dropCalcState.blacksmith ? 1 : dropLevelMultiplier(dropCalcState.level, mon.lv))
            : 1;
          var whiffMult = dropWhiffMultiplier(mon.atk);
          var mult = levelMult * whiffMult;
          var adjRate = d.r * mult;
          adjCell = '<td><span class="' + rateClass(adjRate) + '">' + pct(adjRate) + '</span>' +
            (mult < 1 ? '<span style="color:var(--text-faint);font-size:11px;margin-left:4px;">(×' + (mult * 100).toFixed(1) + '%)</span>' : '') + '</td>';
        }
        html += '<tr class="clickable" data-goto-monster="' + d.m + '">' +
          '<td><span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link">' + escapeHtml(mon.name) + (mon.atk === 0 ? ' <span style="color:var(--text-faint);font-size:11px;">（攻0）</span>' : '') + '</span></td>' +
          '<td>' + escapeHtml(maps || "-") + '</td>' +
          '<td><span class="' + rateClass(d.r) + '">' + pct(d.r) + '</span><span class="group-tag">組' + d.g + '</span></td>' +
          adjCell +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    $detail.innerHTML = html;
    bindDetailClicks();
    wireDropCalcBar(function () { showItem(id); });
  }

  function eqStat(label, v) {
    if (!v) return "";
    return '<div>' + label + ' <b>' + (v > 0 ? "+" : "") + v + '</b></div>';
  }
  function attrStats(attrs) {
    var labels = { str: "力量", agi: "敏捷", int: "智力", sta: "體力", wis: "精神", luck: "幸運" };
    var out = "";
    Object.keys(labels).forEach(function (k) {
      if (attrs[k]) out += '<div>' + labels[k] + ' <b>+' + attrs[k] + '</b></div>';
    });
    return out;
  }

  // ---------- 詳細頁：怪物 ----------
  function showMonster(id) {
    id = String(id);
    var mon = MONSTERS[id];
    if (!mon) return;
    markActive("monster", id);
    currentDetail = { type: "monster", id: id };

    var elLabel = ELEMENT_LABEL[mon.element] || mon.element;
    var elClass = ELEMENT_CLASS[mon.element] || "el-none";

    var html = '<div class="detail-head"><div>' +
      '<div class="detail-title">' + escapeHtml(mon.name) + '</div>' +
      '<div class="detail-sub">怪物編號 #' + id + '　・　等級 ' + mon.lv + '</div>' +
      '<div class="badge-row">' +
      '<span class="el-chip" style="color:var(--' + elClass + ')">' + elLabel + '屬性</span>' +
      '<span class="badge">' + (mon.aggressive ? "主動攻擊" : "被動") + '</span>' +
      (mon.isHarvest ? '<span class="badge tag-harvest">採集點</span>' : '') +
      '</div></div></div>';

    html += '<div class="stat-grid">' +
      statTile("HP", mon.hp) + statTile("攻擊", mon.atk) + statTile("防禦", mon.def) +
      statTile("命中", mon.hit) + statTile("迴避", mon.eva) + statTile("必殺", mon.crit) +
      statTile("抗爆", mon.critRes) + statTile("經驗值", mon.exp) +
      statTile("感應範圍", mon.aggroRange) + statTile("移動速度", mon.moveSpeed) +
      statTile("重生秒數", mon.respawnSec) +
      '</div>';

    html += '<div class="section-title">出現地圖 <span class="count">(' + mon.maps.length + ')</span></div>';
    html += '<div class="map-chip-row">' + mon.maps.map(function (mid) {
      return '<span class="map-chip">' + escapeHtml(mapName(mid)) + '</span>';
    }).join("") + '</div>';

    var drops = mon.drops.slice().sort(function (a, b) { return b.r - a.r; });
    html += '<div class="section-title">掉落物品 <span class="count">(' + drops.length + ')</span></div>';

    if (!drops.length) {
      html += '<div class="empty-note">這隻怪物目前沒有紀錄任何掉落物。</div>';
    } else {
      html += dropCalcBar();
      var hasWhiff = mon.atk === 0;
      var showAdj = dropCalcState.level != null || hasWhiff;
      var levelMult = dropCalcState.level != null
        ? (dropCalcState.blacksmith ? 1 : dropLevelMultiplier(dropCalcState.level, mon.lv))
        : 1;
      var whiffMult = dropWhiffMultiplier(mon.atk);
      var mult = levelMult * whiffMult;
      html += '<table class="dtable"><thead><tr><th>物品</th><th>原始機率</th>' + (showAdj ? '<th>換算後機率</th>' : '') + '</tr></thead><tbody>';
      drops.forEach(function (d) {
        var it = ITEMS[String(d.i)];
        var name = it ? it.name : ("物品#" + d.i);
        var adjCell = "";
        if (showAdj) {
          var adjRate = d.r * mult;
          adjCell = '<td><span class="' + rateClass(adjRate) + '">' + pct(adjRate) + '</span></td>';
        }
        html += '<tr class="clickable" data-goto-item="' + d.i + '">' +
          '<td><span class="name-link">' + escapeHtml(name) + '</span></td>' +
          '<td><span class="' + rateClass(d.r) + '">' + pct(d.r) + '</span><span class="group-tag">組' + d.g + '</span></td>' +
          adjCell +
          '</tr>';
      });
      html += '</tbody></table>';
      if (showAdj) {
        var noteParts = [];
        if (dropCalcState.level != null) {
          noteParts.push(dropCalcState.blacksmith
            ? '身為鐵匠職業，不受等級差衰減影響 → ×100%'
            : '等級差 ' + (dropCalcState.level - mon.lv) + ' 級 → ×' + (levelMult * 100).toFixed(0) + '%');
        }
        if (hasWhiff) {
          noteParts.push('這隻怪物攻擊力為 0，每次擊殺有 ' + (DROP_WHIFF_CHANCE * 100).toFixed(1) + '% 機率整批掉落全部落空，換算成有效倍率 ×' + (whiffMult * 100).toFixed(1) + '%');
        }
        if (noteParts.length) {
          html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + noteParts.join('；') + '。合計換算倍率 ×' + (mult * 100).toFixed(2) + '%。</div>';
        }
      }
    }

    $detail.innerHTML = html;
    bindDetailClicks();
    wireDropCalcBar(function () { showMonster(id); });
  }

  function statTile(label, val) {
    return '<div class="stat-tile"><div class="v">' + fmtNum(val) + '</div><div class="k">' + label + '</div></div>';
  }

  function bindDetailClicks() {
    $detail.querySelectorAll("[data-goto-monster]").forEach(function (row) {
      row.addEventListener("click", function () {
        var mid = row.getAttribute("data-goto-monster");
        var mon = MONSTERS[mid];
        $input.value = mon ? mon.name : "";
        currentMatches.monsters = [{ id: mid, name: mon.name, lv: mon.lv }];
        currentMatches.items = [];
        renderResultList(mon.name);
        showMonster(mid);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    $detail.querySelectorAll("[data-goto-item]").forEach(function (row) {
      row.addEventListener("click", function () {
        var iid = row.getAttribute("data-goto-item");
        var it = ITEMS[iid];
        $input.value = it ? it.name : "";
        currentMatches.items = [{ id: iid, name: it.name }];
        currentMatches.monsters = [];
        renderResultList(it.name);
        showItem(iid);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function showNoResult(q) {
    $detail.innerHTML = '<div class="welcome"><div class="big">∅</div>' +
      '<p>找不到符合「' + escapeHtml(q) + '」的物品或怪物，換個關鍵字試試看。</p></div>';
  }

  function showWelcome() {
    $detail.innerHTML = '<div class="welcome"><div class="big">◈</div>' +
      '<p>在左上方輸入關鍵字開始查詢。<br>可以查「物品」被誰掉落，也可以查「怪物」會掉什麼。</p></div>';
  }

  // ---------- 事件 ----------
  var debounceTimer = null;
  $input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    var v = $input.value;
    debounceTimer = setTimeout(function () { runSearch(v); }, 90);
  });

  renderEmptyResults();

  // ---------- 彩蛋：跳轉到希望修改器 ----------
  var EDITOR_URL = "希望修改器.html";

  // 上上下下左右左右BA（10 秒內輸入完成）
  var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var konamiBuffer = [];
  var konamiStartTime = null;
  document.addEventListener("keydown", function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    var now = Date.now();
    if (konamiStartTime === null || now - konamiStartTime > 10000) {
      konamiBuffer = [];
      konamiStartTime = now;
    }
    konamiBuffer.push(key);
    if (konamiBuffer.length > KONAMI.length) konamiBuffer.shift();
    if (konamiBuffer.length === KONAMI.length &&
        konamiBuffer.every(function (k, i) { return k === KONAMI[i]; })) {
      window.location.href = EDITOR_URL;
    }
  });

  // 搜尋欄符合彩蛋詞時：直接跳轉（手機鍵盤有些沒有明確的確認/送出鍵，改成即時比對，一打完就跳轉，
  // 不用再按 Enter）。同時下面 renderResultList 也會把「找不到符合...」的訊息換成連結，
  // 當作備援——萬一自動跳轉那段因為某些瀏覽器限制沒有觸發，使用者還是能點連結手動跳過去。
  var SEARCH_TRIGGERS = ["how do you turn this on", "希望修改器"];
  $input.addEventListener("input", function () {
    var v = $input.value.trim().toLowerCase();
    if (SEARCH_TRIGGERS.indexOf(v) !== -1) {
      window.location.href = EDITOR_URL;
    }
  });

  // ---------- 職業 / 裝備位置 篩選 ----------
  var JOBS = window.JOBS || [];
  var EQUIP_SLOTS = window.EQUIP_SLOTS || {};

  var $filterJob = document.getElementById("filterJob");
  var $filterSlot = document.getElementById("filterSlot");
  var $filterResult = document.getElementById("filterResult");

  var primaryJobs = JOBS.filter(function (j) { return j.tier !== 2; });
  var secondJobsList = JOBS.filter(function (j) { return j.tier === 2; });

  var primaryGroup = document.createElement("optgroup");
  primaryGroup.label = "一轉";
  primaryJobs.forEach(function (j) {
    var opt = document.createElement("option");
    opt.value = j.id;
    opt.textContent = j.name;
    primaryGroup.appendChild(opt);
  });
  $filterJob.appendChild(primaryGroup);

  var secondGroup = document.createElement("optgroup");
  secondGroup.label = "二轉";
  secondJobsList.forEach(function (j) {
    var opt = document.createElement("option");
    opt.value = j.id;
    opt.textContent = j.name;
    secondGroup.appendChild(opt);
  });
  $filterJob.appendChild(secondGroup);

  Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
    var opt = document.createElement("option");
    opt.value = slotKey;
    opt.textContent = EQUIP_SLOTS[slotKey];
    $filterSlot.appendChild(opt);
  });

  function updateFilterResults() {
    var jobId = $filterJob.value;
    var slotKey = $filterSlot.value;

    if (!jobId && !slotKey) {
      $filterResult.disabled = true;
      $filterResult.innerHTML = '<option value="">請先選擇職業或裝備位置...</option>';
      return;
    }

    var job = JOBS.find(function (j) { return j.id === jobId; });
    var matches = [];
    Object.keys(ITEMS).forEach(function (id) {
      var it = ITEMS[id];
      if (!it.equip) return;
      if (slotKey && it.equip.slot !== slotKey) return;
      if (job && !(it.equip.jobs & (1 << job.equipBit))) return;
      matches.push({ id: id, name: it.name, minLv: it.equip.minLv || 0 });
    });
    matches.sort(function (a, b) { return a.name.localeCompare(b.name, "zh-Hant"); });

    $filterResult.disabled = matches.length === 0;
    if (!matches.length) {
      $filterResult.innerHTML = '<option value="">（沒有符合條件的裝備）</option>';
      return;
    }
    $filterResult.innerHTML = '<option value="">共 ' + matches.length + ' 件，請選擇...</option>' +
      matches.map(function (m) {
        return '<option value="' + m.id + '">' + escapeHtml(m.name) + '（需求 Lv' + m.minLv + '）</option>';
      }).join("");
  }

  var apprTrialActive = false;
  var apprTrialOnPick = null;

  $filterJob.addEventListener("change", updateFilterResults);
  $filterSlot.addEventListener("change", updateFilterResults);
  $filterResult.addEventListener("change", function () {
    if (!$filterResult.value) return;
    var id = $filterResult.value;
    if (apprTrialActive && apprTrialOnPick) { apprTrialOnPick(id); return; }
    var name = ITEMS[id] ? ITEMS[id].name : "";
    $input.value = name;
    currentMatches.items = [{ id: id, name: name }];
    currentMatches.monsters = [];
    renderResultList(name);
    showItem(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---------- 更新紀錄 ----------
  var $changelogBtn = document.getElementById("changelogBtn");
  var $changelogBackdrop = document.getElementById("changelogBackdrop");
  var $changelogModal = document.getElementById("changelogModal");
  var $changelogBody = document.getElementById("changelogBody");
  var $changelogClose = document.getElementById("changelogClose");

  function closeChangelog() { $changelogBackdrop.style.display = "none"; }
  function openChangelogList() {
    if (!CHANGELOG.length) {
      $changelogBody.innerHTML = '<div class="section-title">更新紀錄</div><div class="empty-note">目前還沒有紀錄到任何更新。</div>';
    } else {
      var html = '<div class="section-title">更新紀錄 <span class="count">(' + CHANGELOG.length + ' 筆)</span></div>';
      html += '<ul class="result-list">';
      CHANGELOG.forEach(function (entry, idx) {
        var total = entry.categories.reduce(function (s, c) { return s + c.entries.length; }, 0);
        var summary = entry.categories.map(function (c) { return c.label.replace(/\s*\(.+?\)/, "") + " " + c.entries.length + " 筆"; }).join("、");
        html += '<li class="result-item" data-changelog-idx="' + idx + '">' +
          '<span class="rname">' + escapeHtml(entry.date) + '</span>' +
          '<span class="rmeta">' + escapeHtml(summary) + '（共 ' + total + ' 筆）</span>' +
          '</li>';
      });
      html += '</ul>';
      $changelogBody.innerHTML = html;
    }
    $changelogBackdrop.style.display = "flex";
  }
  function openChangelogDetail(idx) {
    var entry = CHANGELOG[idx];
    if (!entry) return;
    var html = '<div class="section-title"><span class="name-link" id="changelogBackToList" style="cursor:pointer;">← 更新紀錄</span></div>';
    html += '<div class="detail-sub" style="margin-bottom:14px;">' + escapeHtml(entry.date) + '</div>';
    entry.categories.forEach(function (cat) {
      html += '<div class="section-title">' + escapeHtml(cat.label) + ' <span class="count">(' + cat.entries.length + ')</span></div>';
      html += '<div class="map-chip-row">';
      cat.entries.forEach(function (e) {
        if (cat.kind === "item" || cat.kind === "monster") {
          html += '<span class="map-chip" data-changelog-goto="' + cat.kind + ':' + e.id + '">' + escapeHtml(e.name) + '</span>';
        } else {
          html += '<span class="map-chip">' + escapeHtml(e.name) + '</span>';
        }
      });
      html += '</div>';
    });
    $changelogBody.innerHTML = html;
    document.getElementById("changelogBackToList").addEventListener("click", openChangelogList);
  }
  $changelogBtn.addEventListener("click", openChangelogList);
  $changelogClose.addEventListener("click", closeChangelog);
  $changelogBackdrop.addEventListener("click", function (e) { if (e.target === $changelogBackdrop) closeChangelog(); });
  $changelogBody.addEventListener("click", function (e) {
    var item = e.target.closest("[data-changelog-idx]");
    if (item) { openChangelogDetail(Number(item.getAttribute("data-changelog-idx"))); return; }
    var goto = e.target.closest("[data-changelog-goto]");
    if (goto) {
      var parts = goto.getAttribute("data-changelog-goto").split(":");
      closeChangelog();
      if (parts[0] === "monster") showMonster(parts[1]); else showItem(parts[1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  wireGlobalLevelField();
})();
