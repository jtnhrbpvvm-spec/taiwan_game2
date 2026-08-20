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
  var TOWNS = window.TOWNS || {};
  var DROP_INDEX = window.DROP_INDEX || {};
  var SHOP_INDEX = window.SHOP_INDEX || {};
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

  // ---------- 搜尋 ----------
  var currentMatches = { items: [], monsters: [] };

  function runSearch(qRaw) {
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
        var questRefs = buildQuestReferences(it.id);
        var metaParts = [];
        if (count) metaParts.push(count + " 隻怪物掉落");
        if (shopCount) metaParts.push("商店有賣");
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
          var from = ENCHANT_GRADES[row[0]] != null ? ENCHANT_GRADES[row[0]] : ("更高階#" + row[0]);
          var to = ENCHANT_GRADES[row[1]] != null ? ENCHANT_GRADES[row[1]] : ("更高階#" + row[1]);
          var rate = (row[2] / 1000).toFixed(1) + "%";
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

  function showItem(id) {
    id = String(id);
    var item = ITEMS[id];
    if (!item) return;
    markActive("item", id);

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
      html += '<table class="dtable"><thead><tr>' +
        '<th>怪物</th><th>出現地圖</th><th>掉落機率</th></tr></thead><tbody>';
      drops.forEach(function (d) {
        var mon = MONSTERS[String(d.m)];
        if (!mon) return;
        var maps = mon.maps.map(mapName).join("、");
        html += '<tr class="clickable" data-goto-monster="' + d.m + '">' +
          '<td><span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link">' + escapeHtml(mon.name) + '</span></td>' +
          '<td>' + escapeHtml(maps || "-") + '</td>' +
          '<td><span class="' + rateClass(d.r) + '">' + pct(d.r) + '</span><span class="group-tag">組' + d.g + '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    $detail.innerHTML = html;
    bindDetailClicks();
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
      html += '<table class="dtable"><thead><tr><th>物品</th><th>掉落機率</th></tr></thead><tbody>';
      drops.forEach(function (d) {
        var it = ITEMS[String(d.i)];
        var name = it ? it.name : ("物品#" + d.i);
        html += '<tr class="clickable" data-goto-item="' + d.i + '">' +
          '<td><span class="name-link">' + escapeHtml(name) + '</span></td>' +
          '<td><span class="' + rateClass(d.r) + '">' + pct(d.r) + '</span><span class="group-tag">組' + d.g + '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    $detail.innerHTML = html;
    bindDetailClicks();
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

  $filterJob.addEventListener("change", updateFilterResults);
  $filterSlot.addEventListener("change", updateFilterResults);
  $filterResult.addEventListener("change", function () {
    if (!$filterResult.value) return;
    var id = $filterResult.value;
    var name = ITEMS[id] ? ITEMS[id].name : "";
    $input.value = name;
    currentMatches.items = [{ id: id, name: name }];
    currentMatches.monsters = [];
    renderResultList(name);
    showItem(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
