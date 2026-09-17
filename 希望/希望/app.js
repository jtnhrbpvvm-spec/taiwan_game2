(function () {
  "use strict";

  // ---------- 常數 / 對照表 ----------
  var ELEMENT_LABEL = {
    none: "無屬性", physical: "物理", magical: "魔法",
    fire: "火", water: "水", earth: "土", tree: "木",
    dark: "闇", sun: "光", steel: "金"
  };
  var ELEMENT_CLASS = {
    none: "el-none", physical: "el-physical", magical: "el-magical",
    fire: "el-fire", water: "el-water", earth: "el-earth", tree: "el-tree",
    dark: "el-dark", sun: "el-sun", steel: "el-steel"
  };
  // 五行寶石系統（鑲到武器上，只能鑲一次，鑲了不能改）
  var GEM_ELEMENT = { 435: "fire", 436: "water", 437: "tree", 438: "steel", 439: "earth", 440: "sun", 441: "dark" };
  var ELEMENT_COUNTER = { steel: "tree", tree: "earth", earth: "water", water: "fire", fire: "steel", sun: "dark", dark: "sun" };
  var ELEMENT_GENERATE = { steel: "water", water: "tree", tree: "fire", fire: "earth", earth: "steel" };
  var ELEMENT_RELATION_MULT = {
    counter: { attack: 1.44, skill: 1.21 },
    generate: { attack: 1.2, skill: 1.1 },
    same: { attack: 0.64, skill: 0.81 },
    none: { attack: 1, skill: 1 }
  };
  var ELEMENT_RELATION_LABEL = { counter: "克制", generate: "相生", same: "同屬性", none: "無關係" };
  function elementRelation(gemEl, targetEl) {
    if (gemEl === "none" || targetEl === "none" || !gemEl || !targetEl) return "none";
    if (gemEl === targetEl) return "same";
    if (ELEMENT_COUNTER[gemEl] === targetEl) return "counter";
    if (ELEMENT_GENERATE[gemEl] === targetEl) return "generate";
    return "none";
  }
  function elementMultiplier(gemEl, targetEl, kind) {
    return ELEMENT_RELATION_MULT[elementRelation(gemEl, targetEl)][kind];
  }
  var ELEMENT_ORDER = ["fire", "water", "tree", "steel", "earth", "sun", "dark"];
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
  // blacksmith：遊戲 dropMultiplier() 是 isBlacksmith && secondJob.id !== "bomber" 才免除等級差衰減（一轉鐵匠、二轉匠師適用，爆破士不適用）
  var dropCalcState = { level: null, blacksmith: false };

  function dropCalcBar() {
    var html = '<div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;background:var(--panel-hi);border:1px solid var(--line-hi);border-radius:6px;">';
    html += '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-dim);cursor:pointer;">' +
      '<input type="checkbox" id="dropCalcBlacksmith"' + (dropCalcState.blacksmith ? " checked" : "") + '> 是否為鐵匠／匠師（二轉爆破士不適用）</label>';
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
    // 畫面已經換成寵物／副本／任務等其他頁面時，不要把舊的物品／怪物頁蓋回來
    if (!$detail.querySelector('[data-detail-of="' + currentDetail.type + ":" + currentDetail.id + '"]')) return;
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
  var DUNGEON_BY_ID = window.DUNGEON_BY_ID || {};
  var MONSTER_TO_DUNGEONS = window.MONSTER_TO_DUNGEONS || {};
  var BOX_BY_ID = window.BOX_BY_ID || {};
  var ITEM_TO_BOXES = window.ITEM_TO_BOXES || {};
  var DUNGEON_TO_BOXES = window.DUNGEON_TO_BOXES || {};
  var PET_INFO = window.PET_INFO || {};
  var PET_EVOLVE_FROM = window.PET_EVOLVE_FROM || {};
  var MAIN_QUEST_LINES = window.MAIN_QUEST_LINES || {};
  var QUEST_FLAG_INFO = window.QUEST_FLAG_INFO || {};
  var QUEST_ITEM_GIVES = window.QUEST_ITEM_GIVES || {};
  var MAP_REQS = window.MAP_REQS || {};
  var ITEM_QUEST_USES = window.ITEM_QUEST_USES || {};
  var ITEM_PET_EVOLVE_USES = window.ITEM_PET_EVOLVE_USES || {};
  var ITEM_KILL_SOURCE = window.ITEM_KILL_SOURCE || {};
  var ITEM_ORIGIN = window.ITEM_ORIGIN || {};
  var BPET_CRAFT_SOURCE = window.BPET_CRAFT_SOURCE || {};
  var LETTER_SOURCE = window.LETTER_SOURCE || {};
  var LETTER_BY_MONSTER = window.LETTER_BY_MONSTER || {};
  // 物品取得方式，三種來源合併判斷：
  // 1. ITEM_ORIGIN（掃過每個 NPC 完整對話樹得到的，比較準）：kind=npc 代表對話直接給的，
  //    kind=event 代表這棵對話樹沒有任何 NPC 認領，多半是戰鬥/狩獵事件觸發。
  // 2. ITEM_KILL_SOURCE（舊來源，只涵蓋 kill-trees.json 收錄的部分，但這個資料裡有怪物名稱）。
  // 3. BPET_CRAFT_SOURCE（戰寵相關的製作書配方，例如屬性自然石）。
  // event 類型的優先用 ITEM_KILL_SOURCE 補上怪物名稱，兩邊都查不到就不顯示，不用猜。
  function itemKillSourceText(iid) {
    var origins = ITEM_ORIGIN[String(iid)] || [];
    var killSrc = ITEM_KILL_SOURCE[String(iid)];
    var craftSrc = BPET_CRAFT_SOURCE[String(iid)];
    var npcOrigins = origins.filter(function (o) { return o.kind === "npc" && o.npcName; });
    var eventOrigins = origins.filter(function (o) { return o.kind === "event"; });
    var lines = [];
    if (npcOrigins.length) {
      lines.push("取得方式：去找 " + npcOrigins.map(function (o) {
        var needHtml = o.needItemId ? "（需先持有 " + itemChip(o.needItemId) + "）" : "";
        return "<b>" + escapeHtml(o.npcName) + "</b>" + needHtml;
      }).join("　或　") + " 取得");
    }
    if (killSrc) {
      var monsterHtml = killSrc.monsterId
        ? '<span class="name-link" data-goto-monster="' + killSrc.monsterId + '">' + escapeHtml(killSrc.monsterName) + '</span>'
        : escapeHtml(killSrc.monsterName || "未知怪物");
      var needHtml2 = killSrc.needItemId ? "（需先持有 " + itemChip(killSrc.needItemId) + "）" : "";
      lines.push("取得方式：向 " + monsterHtml + " 提出要求取得（狩獵／戰鬥觸發）" + needHtml2);
    } else if (eventOrigins.length && !npcOrigins.length) {
      lines.push("取得方式：戰鬥／狩獵事件觸發（查不到是哪隻怪物）");
    }
    if (craftSrc) {
      var matsHtml = (craftSrc.mats || []).map(function (m) { return itemChip(m[0], m[1]); }).join("");
      lines.push("取得方式：用 " + itemChip(craftSrc.bookId) + " 製作，材料：" + matsHtml +
        "，花費 " + fmtNum(craftSrc.gold) + " 金幣，成功率 " + craftSrc.ratePct + "%");
    }
    (LETTER_SOURCE[String(iid)] || []).forEach(function (ls) {
      var monsterHtml = ls.monsterId
        ? '<span class="name-link" data-goto-monster="' + ls.monsterId + '">' + escapeHtml(ls.monsterName || ("怪物#" + ls.monsterId)) + '</span>'
        : "未知怪物";
      var needHtml3 = ls.itemId ? "，並繳交 " + itemChip(ls.itemId, ls.count) : "";
      var placeHtml = ls.places && ls.places.length ? "（" + ls.places.map(escapeHtml).join("／") + "）" : "";
      var rewardParts = [];
      if (ls.fame) rewardParts.push("名聲 +" + fmtNum(ls.fame));
      if (ls.gold) rewardParts.push(fmtNum(ls.gold) + " 金幣");
      lines.push("取得方式：打倒 " + monsterHtml + " 掉落，交給 <b>" + escapeHtml(ls.npcName) + "</b>" + placeHtml + needHtml3 +
        (rewardParts.length ? "，可換 " + rewardParts.join("、") : ""));
    });
    return lines.join("<br>");
  }
  var PET_STAT_LABEL = { atk: "攻", def: "防", mag: "魔", aspd: "攻速", crit: "爆擊", eva: "迴避", mspd: "移速", hit: "命中", dmgDealtPct: "增傷" };
  // 對照真實遊戲邏輯反推：寵物要飽食度(hunger) > 0 才會有任何加成，跟成長階段(grow)無關。
  // 有 hunger 的話，每個屬性各自看：growth[屬性][grow-1] 有值就用那個（9 階段各自不同數值），
  // 沒有 growth 陣列的屬性，固定用基礎資料裡的數字，不會隨 grow 變動。
  function petStatAt(pet, statKey, grow) {
    var curve = pet.growth && pet.growth[statKey];
    if (curve && grow > 0 && curve[grow - 1] !== undefined) return curve[grow - 1];
    return (pet.stats && pet.stats[statKey]) || 0;
  }
  var CHANGELOG = window.CHANGELOG || [];
  var RATE_DIVISOR = window.RATE_DIVISOR || 1000000;
  // 鍛造時抽到基礎成品後，還有額外 3% 機率換成這裡列出的版本（見 FORGE_BY_PRODUCT 裡的 viaVariant 欄位）。
  var FORGE_VARIANT_LABEL = { g: "強化版", crit: "必殺增強型", hit: "命中增加型", speed: "攻擊速度型" };

  // ---------- 索引：先把 id 轉成陣列方便搜尋 ----------
  // 裝備能力對照：標籤跟遊戲裝備介面（bundle 的 BN 表：攻/魔/防/爆/命中/迴避/攻速/移速/增傷%/減傷%）一致，
  // 遊戲是數值 > 0 才顯示「+」，「僅查詢裝備能力」模式也只找 > 0 的。aliases 是玩家常打的其他說法。
  var EQUIP_ABILITIES = [
    { key: "atk", label: "攻擊", aliases: ["攻", "攻擊力"] },
    { key: "magic", label: "魔法", aliases: ["魔", "魔法力"] },
    { key: "def", label: "防禦", aliases: ["防", "防禦力"] },
    { key: "crit", label: "必殺", aliases: ["爆", "爆擊", "必殺率"] },
    { key: "hit", label: "命中", aliases: ["命中率"] },
    { key: "eva", label: "迴避", aliases: ["迴避率"] },
    { key: "atkSpeed", label: "攻速", aliases: ["攻擊速度"] },
    { key: "moveSpeed", label: "移速", aliases: ["移動速度"] },
    { key: "dmgDealtPct", label: "增傷", unit: "%", aliases: ["增加傷害", "傷害加成"] },
    { key: "dmgTakenPct", label: "減傷", unit: "%", aliases: ["減少傷害"] }
  ];
  var EQUIP_ABILITY_BY_KEY = {};
  EQUIP_ABILITIES.forEach(function (a) { EQUIP_ABILITY_BY_KEY[a.key] = a; });
  // 一個關鍵字對到哪些能力：完全相同的名稱優先；沒有才用部分比對（例如「傷害」同時對到增傷、減傷）
  function resolveAbilityToken(token) {
    var exact = EQUIP_ABILITIES.filter(function (a) { return a.label === token || a.aliases.indexOf(token) !== -1; });
    if (exact.length) return exact.map(function (a) { return a.key; });
    return EQUIP_ABILITIES.filter(function (a) {
      return [a.label].concat(a.aliases).some(function (name) { return name.indexOf(token) !== -1; });
    }).map(function (a) { return a.key; });
  }
  var currentAbilityFields = [];
  var currentAbilityTotal = null; // 僅查詢裝備能力模式：符合的總件數（清單只列前 ABILITY_RESULT_LIMIT 件）
  var currentAbilityConditionText = ""; // 僅查詢裝備能力模式：把解讀後的條件列在清單上方，讓玩家確認有沒有打錯
  var ABILITY_RESULT_LIMIT = 500;
  var itemList = Object.keys(ITEMS).map(function (id) {
    return { id: id, name: ITEMS[id].name };
  });
  var monsterList = Object.keys(MONSTERS).map(function (id) {
    return { id: id, name: MONSTERS[id].name, lv: MONSTERS[id].lv };
  });
  // 裝備能力搜尋：輸入這些關鍵字，會額外把「有這項能力」的裝備也列進搜尋結果，
  // 不是名稱比對，是直接看裝備資料裡對應欄位有沒有大於 0。之後如果又發現新能力欄位，
  // 在這裡加一行對照就好，不用改搜尋邏輯本身。
  var ABILITY_KEYWORDS = {
    "減傷": "dmgTakenPct", "減少傷害": "dmgTakenPct",
    "增傷": "dmgDealtPct", "增加傷害": "dmgDealtPct", "傷害加成": "dmgDealtPct"
  };
  function findAbilityField(q) {
    if (ABILITY_KEYWORDS[q]) return ABILITY_KEYWORDS[q];
    var found = null;
    Object.keys(ABILITY_KEYWORDS).forEach(function (alias) {
      if (!found && (alias.indexOf(q) !== -1 || q.indexOf(alias) !== -1)) found = ABILITY_KEYWORDS[alias];
    });
    return found;
  }

  // ---------- DOM ----------
  var $input = document.getElementById("searchInput");
  var $abilityOnly = document.getElementById("abilityOnly");
  var SEARCH_PLACEHOLDER_DEFAULT = $input ? $input.placeholder : "";
  if ($abilityOnly) {
    $abilityOnly.addEventListener("change", function () {
      $input.placeholder = $abilityOnly.checked ? "輸入裝備能力，例如：魔法、魔法力>20 攻速<=10" : SEARCH_PLACEHOLDER_DEFAULT;
      resetNavHistory();
      runSearch($input.value);
    });
  }
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
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showEnchantTable();
  });
  $hintRow.appendChild(enchantChip);

  var petChip = document.createElement("span");
  petChip.className = "hint-chip";
  petChip.style.borderColor = "var(--gold)";
  petChip.style.color = "var(--gold-hi)";
  petChip.textContent = "🐾 寵物列表";
  petChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showPetBrowser();
  });
  $hintRow.appendChild(petChip);

  var dungeonChip = document.createElement("span");
  dungeonChip.className = "hint-chip";
  dungeonChip.style.borderColor = "var(--gold)";
  dungeonChip.style.color = "var(--gold-hi)";
  dungeonChip.textContent = "🏛️ 副本";
  dungeonChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showDungeonBrowser();
  });
  $hintRow.appendChild(dungeonChip);

  var boxChip = document.createElement("span");
  boxChip.className = "hint-chip";
  boxChip.style.borderColor = "var(--gold)";
  boxChip.style.color = "var(--gold-hi)";
  boxChip.textContent = "🎁 寶箱";
  boxChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showBoxBrowser();
  });
  $hintRow.appendChild(boxChip);

  var questLineChip = document.createElement("span");
  questLineChip.className = "hint-chip";
  questLineChip.style.borderColor = "var(--gold)";
  questLineChip.style.color = "var(--gold-hi)";
  questLineChip.textContent = "📖 任務總覽";
  questLineChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showQuestLineBrowser();
  });
  $hintRow.appendChild(questLineChip);

  // ---------- 搜尋 ----------
  var currentMatches = { items: [], monsters: [] };

  // ---------- 瀏覽紀錄（上一頁）----------
  // 只有「在詳細頁裡點連結跳過去」才會記錄一筆，重新搜尋、或直接點左邊搜尋結果清單，
  // 都視為全新的瀏覽起點，會清空這份紀錄。
  var navHistory = [];
  var currentView = null; // {kind:"item"|"monster"|"pet", id}
  function resetNavHistory() { navHistory = []; currentView = null; }
  // restoreScrollY：按「上一頁」回來時捲回離開前的位置（例如從委託／書信／藍圖任務列表點進物品再回來）
  function navigateTo(kind, id, push, restoreScrollY) {
    if (push !== false && currentView) navHistory.push({ kind: currentView.kind, id: currentView.id, scrollY: window.pageYOffset });
    currentView = { kind: kind, id: id };
    if (kind === "item") {
      var it = ITEMS[id];
      $input.value = it ? it.name : "";
      currentMatches.items = [{ id: id, name: it ? it.name : "" }];
      currentMatches.monsters = [];
      renderResultList(it ? it.name : "");
      showItem(id);
    } else if (kind === "monster") {
      var mon = MONSTERS[id];
      $input.value = mon ? mon.name : "";
      currentMatches.monsters = [{ id: id, name: mon ? mon.name : "", lv: mon ? mon.lv : 0 }];
      currentMatches.items = [];
      renderResultList(mon ? mon.name : "");
      showMonster(id);
    } else if (kind === "pet") {
      showPetDetail(id);
    } else if (kind === "bpet") {
      showBattlePetDetail(id);
    } else if (kind === "questline") {
      showQuestLineDetail(id);
    } else if (kind === "questtab") {
      openQuestTab(id);
    }
    if (restoreScrollY != null) window.scrollTo(0, restoreScrollY);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBackOneView() {
    if (!navHistory.length) return;
    var prev = navHistory.pop();
    navigateTo(prev.kind, prev.id, false, prev.scrollY);
  }
  function backButtonHtml() {
    if (!navHistory.length) return "";
    return '<div style="margin-bottom:12px;"><span class="name-link" data-go-back="1" style="cursor:pointer;">← 上一頁</span></div>';
  }

  // 遊戲資料裡的測試裝備（名稱開頭「[測試用]」，數值動輒上萬），能力搜尋時不列出，免得永遠排第一
  function isTestItemName(name) { return /^\[測試用\]/.test(name || ""); }
  var ABILITY_OPS = {
    ">": function (v, n) { return v > n; }, ">=": function (v, n) { return v >= n; },
    "<": function (v, n) { return v < n; }, "<=": function (v, n) { return v <= n; },
    "=": function (v, n) { return v === n; }
  };
  var ABILITY_OP_TEXT = { ">": "＞", ">=": "≧", "<": "＜", "<=": "≦", "=": "＝" };
  // 一個條件：「魔法」「魔法>20」「攻速<=10」。回傳 { keys, op, num } 或 { error }
  function parseAbilityCondition(token) {
    var m = token.match(/^(.*?)(>=|<=|>|<|=)(.*)$/);
    if (!m) {
      var keys = resolveAbilityToken(token);
      return keys.length ? { keys: keys } : { error: "「" + token + "」不是裝備能力" };
    }
    var name = m[1], num = m[3];
    var keys2 = name ? resolveAbilityToken(name) : [];
    if (!keys2.length) return { error: "「" + token + "」" + (name ? "裡的「" + name + "」不是裝備能力" : "少了能力名稱") };
    if (!/^\d+(\.\d+)?$/.test(num)) return { error: "「" + token + "」少了數字（例如：" + name + m[2] + "20）" };
    return { keys: keys2, op: m[2], num: Number(num) };
  }

  // 「僅查詢裝備能力」模式：不比對物品／怪物名稱，只找能力數值 > 0 的裝備。
  // 可以用空白、逗號、頓號同時查多項（例如「魔法 攻速」＝兩項都要有），依第一項能力數值由高到低排。
  // 能力後面可以加大小於條件縮小範圍：> >= < <= =（全形＞＜＝≧≦也可以），例如「魔法力>20 攻速<=10」。
  // 不管有沒有加條件，數值都一定要 > 0（遊戲只把 > 0 的顯示成「+」能力）。
  function runAbilityOnlySearch(q) {
    var normalized = q.replace(/[＞]/g, ">").replace(/[＜]/g, "<").replace(/[＝]/g, "=")
      .replace(/[≧≥]/g, ">=").replace(/[≦≤]/g, "<=")
      .replace(/\s*(>=|<=|>|<|=)\s*/g, "$1");
    var tokens = normalized.split(/[\s,，、+＋]+/).filter(Boolean);
    var conds = tokens.map(parseAbilityCondition);
    var errors = conds.filter(function (c) { return c.error; }).map(function (c) { return c.error; });
    currentMatches.monsters = [];
    currentAbilityTotal = null;
    currentAbilityConditionText = "";
    if (errors.length) {
      currentMatches.items = [];
      currentAbilityFields = [];
      $resultCount.textContent = "";
      $resultList.innerHTML = '<li class="empty-note">' + escapeHtml(errors.join("；")) + '。可以查：' +
        EQUIP_ABILITIES.map(function (a) { return a.label; }).join("、") + '；可用空白同時查多項，能力後面可加 &gt; &gt;= &lt; &lt;= = 條件，例如「魔法力&gt;20」。</li>';
      showNoResult(q);
      return;
    }
    var resolved = conds.map(function (c) { return c.keys; });
    var fields = [];
    resolved.forEach(function (keys) { keys.forEach(function (k) { if (fields.indexOf(k) === -1) fields.push(k); }); });
    var primary = resolved[0];
    var primaryValue = function (eq) { return Math.max.apply(null, primary.map(function (k) { return eq[k] || 0; })); };
    var passes = function (eq, c) {
      return c.keys.some(function (k) { return eq[k] > 0 && (!c.op || ABILITY_OPS[c.op](eq[k], c.num)); });
    };
    currentAbilityConditionText = conds.map(function (c) {
      var label = c.keys.map(function (k) { return EQUIP_ABILITY_BY_KEY[k].label; }).join("或");
      return c.op ? label + " " + ABILITY_OP_TEXT[c.op] + " " + fmtNum(c.num) + (EQUIP_ABILITY_BY_KEY[c.keys[0]].unit || "") : label + " 有加成";
    }).join("、");
    var matches = itemList.filter(function (it) {
      var eq = ITEMS[it.id].equip;
      return eq && !isTestItemName(it.name) && conds.every(function (c) { return passes(eq, c); });
    }).sort(function (a, b) {
      return primaryValue(ITEMS[b.id].equip) - primaryValue(ITEMS[a.id].equip) || a.name.localeCompare(b.name, "zh-Hant");
    });
    currentAbilityFields = fields;
    currentAbilityTotal = matches.length;
    currentMatches.items = matches.slice(0, ABILITY_RESULT_LIMIT);
    if (!matches.length) {
      $resultCount.textContent = "";
      $resultList.innerHTML = '<li class="empty-note">沒有符合條件的裝備（條件：' + escapeHtml(currentAbilityConditionText) + '）。</li>';
      showNoResult(q);
      return;
    }
    renderResultList(q);
    if (currentMatches.items.length) showItem(currentMatches.items[0].id);
    else showNoResult(q);
  }

  function runSearch(qRaw) {
    var q = (qRaw || "").trim();
    currentMatches.items = [];
    currentMatches.monsters = [];
    currentAbilityTotal = null;

    if (q === "") {
      renderEmptyResults();
      showWelcome();
      return;
    }
    if ($abilityOnly && $abilityOnly.checked) { runAbilityOnlySearch(q); return; }

    currentMatches.items = itemList.filter(function (it) {
      return it.name.indexOf(q) !== -1;
    }).slice(0, 200);

    var abilityField = findAbilityField(q);
    if (abilityField) {
      var abilityMatches = itemList.filter(function (it) {
        var eq = ITEMS[it.id].equip;
        return eq && eq[abilityField] > 0 && it.name.indexOf(q) === -1; // 已經在名稱比對裡的就不重複加
      }).sort(function (a, b) {
        return (ITEMS[b.id].equip[abilityField] || 0) - (ITEMS[a.id].equip[abilityField] || 0);
      });
      currentMatches.items = currentMatches.items.concat(abilityMatches).slice(0, 200);
    }
    currentAbilityFields = abilityField ? [abilityField] : [];

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
    $resultList.innerHTML = $abilityOnly && $abilityOnly.checked
      ? '<li class="empty-note">輸入裝備能力搜尋，例如：魔法、攻速、減傷；可用空白同時查多項，能力後面可加 &gt; &gt;= &lt; &lt;= = 縮小數值範圍，例如「魔法力&gt;20 攻速&lt;=10」。</li>'
      : '<li class="empty-note">開始輸入以搜尋物品或怪物名稱。</li>';
  }

  function renderResultList(q) {
    var total = currentMatches.items.length + currentMatches.monsters.length;
    $resultCount.textContent = total ? "(" + (currentAbilityTotal != null ? currentAbilityTotal : total) + ")" : "";

    if (total === 0) {
      // 從上方功能按鈕（寵物／副本／任務…）進來時沒有關鍵字，不要顯示「找不到符合「」」
      if (!q.trim()) { renderEmptyResults(); return; }
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
      html += '<li class="empty-note" style="padding:10px 6px 2px;color:var(--gold-hi);font-size:12px;font-weight:700;">' +
        (currentAbilityTotal != null ? "裝備 (" + currentAbilityTotal + ")" : "物品 (" + currentMatches.items.length + ")") + '</li>';
      if (currentAbilityTotal != null && currentAbilityConditionText) {
        html += '<li class="empty-note" style="padding:2px 6px 4px;font-size:12px;">條件：' + escapeHtml(currentAbilityConditionText) + '</li>';
      }
      if (currentAbilityTotal != null && currentAbilityTotal > currentMatches.items.length) {
        html += '<li class="empty-note" style="padding:2px 6px 6px;font-size:12px;">只列出數值最高的 ' + currentMatches.items.length + ' 件，可以再多加一項能力縮小範圍。</li>';
      }
      currentMatches.items.forEach(function (it) {
        var count = (DROP_INDEX[it.id] || []).length;
        var shopCount = (SHOP_INDEX[it.id] || []).length;
        var radixCount = (RADIX_INDEX[it.id] || []).length;
        var questRefs = buildQuestReferences(it.id);
        var metaParts = [];
        if (count) metaParts.push(count + " 隻怪物掉落");
        var eqAb = ITEMS[it.id].equip;
        if (eqAb && currentAbilityFields.length) {
          metaParts = currentAbilityFields.filter(function (k) { return eqAb[k] > 0; }).map(function (k) {
            var a = EQUIP_ABILITY_BY_KEY[k];
            return a.label + " +" + eqAb[k] + (a.unit || "");
          }).concat(metaParts);
        }
        if (shopCount) metaParts.push("商店有賣");
        if (radixCount) metaParts.push("拉迪克斯有賣");
        if (FORGE_BY_BOOK[it.id]) metaParts.push("鍛造書");
        if (FORGE_BY_PRODUCT[it.id]) metaParts.push("可鍛造取得");
        if (COOK_BY_PRODUCT[it.id]) metaParts.push("料理成品");
        if (COOK_BY_INGREDIENT[it.id]) metaParts.push("可用於料理");
        if (ALCHEMY_BY_BOOK[it.id]) metaParts.push("煉金配方書");
        if (ALCHEMY_BY_PRODUCT[it.id]) metaParts.push("可煉金取得");
        if (BOX_BY_ID[it.id]) metaParts.push("寶箱");
        if (ITEM_TO_BOXES[it.id]) metaParts.push("可從開箱取得");
        if (ITEM_QUEST_USES[it.id]) metaParts.push("任務道具");
        if (ITEM_PET_EVOLVE_USES[it.id]) metaParts.push("寵物進化材料");
        if (ITEM_ORIGIN[it.id] || ITEM_KILL_SOURCE[it.id]) metaParts.push("可從任務取得");
        if (LETTER_SOURCE[it.id]) metaParts.push("書信任務");
        if (questRefs.quests.length && metaParts.indexOf("任務道具") === -1) metaParts.push("任務道具");
        if (questRefs.missions.length) metaParts.push("藍圖任務");
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
    resetNavHistory();
    if (item.dataset.type === "monster") { currentView = { kind: "monster", id: item.dataset.id }; showMonster(item.dataset.id); }
    else { currentView = { kind: "item", id: item.dataset.id }; showItem(item.dataset.id); }
  });

  // ---------- 詳細頁：物品 ----------
  // ---------- 任務／藍圖任務關聯 ----------
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
      else if (m.grants === idNum) role = "grants";
      else if ((m.gives || []).some(function (g) { return g.id === idNum; })) role = "gives";
      else if ((m.costs || []).some(function (c) { return c.id === idNum; })) role = "cost";
      else if (MISSION_TOKEN_ITEM_ID != null && idNum === MISSION_TOKEN_ITEM_ID && m.token) role = "token";
      if (role) missions.push({ id: mid, m: m, role: role });
    });

    return { quests: quests, missions: missions };
  }

  // ---------- 藍圖任務（missions.json，遊戲內叫「希望路線」）共用顯示 ----------
  // 規則對照 bundle：kill 要角色等級 ≥ unlockLevel 後擊殺才計數（tickMissionKill）；dungeon 進入指定副本（tickMissionDungeon）；
  // talk／exchange／craft 要到 townId 找 npc；blocked 的不計數也不能領獎（hv()）。非 kill 類的 monsterId 不是真的怪物。
  var MISSION_KIND_LABEL = { kill: "擊殺", dungeon: "副本", talk: "對話", exchange: "交換", craft: "製作" };
  function missionTokenName() {
    return MISSION_TOKEN_ITEM_ID != null && ITEMS[MISSION_TOKEN_ITEM_ID] ? ITEMS[MISSION_TOKEN_ITEM_ID].name : "R代幣";
  }
  // 列表用的簡短目標；detail=true 時補上地圖、交換材料等細節
  function missionTargetHtml(m, detail) {
    var town = m.townId != null ? townName(m.townId) : "";
    if (m.kind === "kill") {
      var mon = MONSTERS[String(m.monsterId)];
      if (!mon) return "擊殺 ？ ×" + m.need;
      return '擊殺 <span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link" data-goto-monster="' + m.monsterId + '">' + escapeHtml(mon.name) + '</span> ×' + m.need +
        (detail && mon.maps && mon.maps.length ? '<br><span style="color:var(--text-dim);font-size:12.5px;">出現地圖：' + escapeHtml(mon.maps.map(mapName).join("、")) + '</span>' : '');
    }
    if (m.kind === "dungeon") {
      var dg = m.dungeonId != null ? DUNGEON_BY_ID[String(m.dungeonId)] : null;
      return dg ? '進入副本 <span class="name-link" data-open-dungeon="' + m.dungeonId + '">' + escapeHtml(dg.name) + '</span>' : "進入副本";
    }
    if (m.kind === "talk") return "找 <b>" + escapeHtml(m.npc || "NPC") + "</b> 談話" + (town ? "（" + escapeHtml(town) + "）" : "");
    if (m.kind === "exchange") {
      return "跟 <b>" + escapeHtml(m.npc || "NPC") + "</b> 交換" + (town ? "（" + escapeHtml(town) + "）" : "") +
        (detail && (m.costs || []).length ? '<br>交出：' + m.costs.map(function (c) { return itemChip(c.id, c.count); }).join("") +
          (m.grants != null ? '<br>換到：' + itemChip(m.grants) : '') : '');
    }
    if (m.kind === "craft") {
      return "找 <b>" + escapeHtml(m.npc || "NPC") + "</b> 拿材料並精煉" + (town ? "（" + escapeHtml(town) + "）" : "") +
        (detail ? ((m.gives || []).length ? '<br>先拿到：' + m.gives.map(function (g) { return itemChip(g.id, g.count); }).join("") : '') +
          (m.refineItem != null ? '<br>再精煉：' + itemChip(m.refineItem) + '（精煉一次）' : '') : '');
    }
    return MISSION_KIND_LABEL[m.kind] || "未知類型";
  }
  function missionHowText(m) {
    if (m.blocked) return "⚠️ 這筆在遊戲裡目前無法完成（不會累積進度、也不能領獎）。";
    if (m.kind === "kill") return "不用接取：角色等級到達 Lv" + m.unlockLevel + " 之後擊殺指定怪物才會開始計數（等級不到時打的不算）。";
    if (m.kind === "dungeon") return "角色等級到達 Lv" + m.unlockLevel + " 之後進入指定副本即完成。";
    return "角色等級到達 Lv" + m.unlockLevel + " 之後，到指定城鎮找 NPC 完成。";
  }
  function missionRewardGridHtml(m) {
    return '<div class="equip-stat-grid">' +
      '<div>經驗<br><b>+' + fmtNum(m.exp || 0) + '</b></div>' +
      '<div>金幣<br><b>' + fmtNum(m.gold || 0) + '</b></div>' +
      '<div>名聲<br><b>+' + fmtNum(m.fame || 0) + '</b></div>' +
      '<div>' + escapeHtml(missionTokenName()) + '<br><b>×' + fmtNum(m.token || 0) + '</b></div>' +
      '</div>' +
      (m.reward ? '<div style="margin-top:10px;">獎勵物品：' + itemChip(m.reward, m.rewardCount || 1) + '</div>' : '');
  }

  function renderQuestRefCard(r) {
    var q = r.q;
    var page = QUEST_PAGES[String(q.pageId)] || {};
    var monN = MONSTERS[String(q.monsterId)] ? MONSTERS[String(q.monsterId)].name : ("怪物#" + q.monsterId);
    // 名聲上限要把分頁的 fameCeiling（ceilingEffect=block）一起算進去，跟遊戲接委託的判斷一致
    var noFameNote = commissionNoFameNote(page);
    var towns = (page.towns && page.towns.length) ? page.towns.join("、") : "未知";
    return '<div class="equip-box">' +
      '<div class="row1"><span class="slot">📜 任務 #' + r.id + '　' + escapeHtml(page.title || "") + '</span></div>' +
      '<div style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '內容：擊殺「' + escapeHtml(monN) + '」，繳交此物品 x' + q.count + '<br>' +
      '接取地點：<b style="color:var(--gold-hi);">' + escapeHtml(towns) + '</b><br>' +
      '需求：' + commissionLevelText(q) + '　・　名聲 ' + commissionFameText(q, page) + '<br>' +
      (noFameNote ? '⚠️ ' + noFameNote + '<br>' : '') +
      '獎勵：名聲 +' + fmtNum(q.fame) + '　經驗 +' + fmtNum(q.exp) + '　金錢 +' + fmtNum(q.gold) +
      '</div></div>';
  }

  function renderMissionRefCard(r) {
    var m = r.m;
    var roleText = { reward: "獎勵物品", token: "任務代幣", grants: "交換可得", gives: "NPC 給的材料", cost: "交換要交出" }[r.role] || "";
    return '<div class="equip-box">' +
      '<div class="row1"><span class="slot">🗺️ 藍圖任務 Lv' + m.unlockLevel + '　' + escapeHtml(roleText) + '</span></div>' +
      '<div style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '目標：' + missionTargetHtml(m, true) + '<br>' +
      escapeHtml(missionHowText(m)) +
      '</div>' +
      '<div style="margin-top:8px;">' + missionRewardGridHtml(m) + '</div>' +
      '</div>';
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

  function showItem(id) {
    id = String(id);
    var item = ITEMS[id];
    if (!item) return;
    markActive("item", id);
    currentDetail = { type: "item", id: id };

    var drops = (DROP_INDEX[id] || []).slice().sort(function (a, b) { return b.r - a.r; });

    var html = backButtonHtml();
    html += '<div class="detail-head" data-detail-of="item:' + id + '"><div>' +
      '<div class="detail-title">' + escapeHtml(item.name) + '</div>' +
      '<div class="detail-sub">物品編號 #' + id + '</div>' +
      '</div></div>';

    html += '<div class="price-row">' +
      '<span>販售價 <b>' + fmtNum(item.sell) + '</b></span>' +
      '<span>購買價 <b>' + fmtNum(item.buy) + '</b></span>' +
      '</div>';

    var questUses = ITEM_QUEST_USES[id] || [];
    var petEvolveUses = [];
    (ITEM_PET_EVOLVE_USES[id] || []).forEach(function (u) {
      if (!petEvolveUses.some(function (x) { return x.petId === u.petId; })) petEvolveUses.push(u);
    });
    var killSourceText = itemKillSourceText(id);
    if (questUses.length || petEvolveUses.length || killSourceText) {
      html += '<div style="background:rgba(201,162,75,.12);border:1px solid var(--gold);border-radius:4px;padding:12px 14px;margin-bottom:18px;">';
      if (questUses.length || petEvolveUses.length) {
        html += '<div style="color:var(--gold-hi);font-weight:700;font-size:14px;margin-bottom:6px;">⚠️ 這是特殊用途道具，不要隨便賣掉／丟掉</div>';
      }
      if (questUses.length) {
        html += '<div style="font-size:13px;color:var(--text);margin-bottom:4px;">任務道具，用於：' +
          questUses.map(function (u) {
            var label = escapeHtml(u.lineTitle) + '・' + escapeHtml(u.stepName);
            return u.lineId != null ? '<span class="name-link" data-open-questline="' + u.lineId + '">' + label + '</span>' : '<span>' + label + '</span>';
          }).join('、') +
          '</div>';
      }
      if (petEvolveUses.length) {
        html += '<div style="font-size:13px;color:var(--text);">寵物進化材料，用於進化成：' +
          petEvolveUses.map(function (u) { return '<span class="name-link" data-open-pet="' + u.petId + '">' + escapeHtml(u.petName) + '</span>'; }).join('、') +
          '</div>';
      }
      if (killSourceText) {
        html += '<div style="font-size:13px;color:var(--text);margin-top:4px;">' + killSourceText + '</div>';
      }
      html += '</div>';
    }

    if (item.equip) {
      var eq = item.equip;
      var slotName = eq.slotName || SLOT_LABEL_FALLBACK[eq.slot] || eq.slot;
      html += '<div class="equip-box">' +
        '<div class="row1"><span class="slot">裝備・' + escapeHtml(slotName) + '</span>' +
        '<span class="badge">需求等級 ' + eq.minLv + '</span></div>' +
        '<div class="equip-stat-grid">' +
        eqStat("攻擊", eq.atk) + eqStat("防禦", eq.def) + eqStat("魔法", eq.magic) +
        eqStat("攻速", eq.atkSpeed) + eqStat("必殺", eq.crit) + eqStat("命中", eq.hit) + eqStat("迴避", eq.eva) +
        eqStat("移速", eq.moveSpeed) +
        eqStatPct("增加傷害", eq.dmgDealtPct) + eqStatPct("減少傷害", eq.dmgTakenPct) +
        (eq.attrs ? attrStats(eq.attrs) : "") +
        '</div></div>';
      if (eq.noUpgrade) {
        html += '<div class="empty-note" style="padding:6px 0 0;">⚠️ 這件裝備無法發條強化。</div>';
      }
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
        var variantNote = p.viaVariant
          ? '<br><span class="rate low">' + (FORGE_VARIANT_LABEL[p.viaVariant] || "特殊版本") + '（抽到基礎款後再有 3% 機率）</span>'
          : '';
        html += itemLinkRow(p.book, '<td><span class="rate">' + p.rate + '%</span></td><td>Lv' + p.charLv + '・力量 ' + p.strMin + variantNote + '</td>');
      });
      html += '</tbody></table>';
    }

    var gemElement = GEM_ELEMENT[id];
    if (gemElement) {
      html += '<div class="section-title">五行寶石 <span class="el-chip" style="color:var(--' + ELEMENT_CLASS[gemElement] + ')">' + ELEMENT_LABEL[gemElement] + '屬性</span></div>';
      html += '<div class="empty-note" style="padding:0 0 10px;">可鑲到武器上（只能鑲武器、只能鑲一次，鑲了不能改）。鑲上後，對戰不同屬性的怪物會有不同傷害倍率：</div>';
      html += '<table class="dtable"><thead><tr><th>怪物屬性</th><th>關係</th><th>普攻倍率</th><th>技能倍率</th></tr></thead><tbody>';
      ELEMENT_ORDER.concat(["none"]).forEach(function (targetEl) {
        var rel = elementRelation(gemElement, targetEl);
        var mult = ELEMENT_RELATION_MULT[rel];
        html += '<tr>' +
          '<td><span class="el-chip" style="color:var(--' + ELEMENT_CLASS[targetEl] + ')">' + ELEMENT_LABEL[targetEl] + '</span></td>' +
          '<td>' + ELEMENT_RELATION_LABEL[rel] + '</td>' +
          '<td><span class="rate' + (mult.attack < 1 ? " low" : "") + '">×' + mult.attack.toFixed(2) + '</span></td>' +
          '<td><span class="rate' + (mult.skill < 1 ? " low" : "") + '">×' + mult.skill.toFixed(2) + '</span></td>' +
          '</tr>';
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

    var box = BOX_BY_ID[id];
    if (box) {
      html += '<div class="section-title">寶箱</div>';
      if (box.dungeonGuess) {
        html += '<div class="badge-row" style="margin-bottom:10px;">' +
          '<span class="badge" data-open-dungeon="' + box.dungeonGuess.dungeonId + '" style="cursor:pointer;">來源副本（推測）：' + escapeHtml(box.dungeonGuess.dungeonName) + '</span>' +
          '</div>';
      }
      html += '<div class="empty-note" style="padding:0 0 10px;">需要搭配鑰匙一起消耗才能打開：</div>';
      html += '<div class="map-chip-row">' + itemChip(box.keyId) + '</div>';
      box.tiers.forEach(function (tier, tIdx) {
        html += '<div class="section-title" style="margin-top:14px;">開出物品（第 ' + (tIdx + 1) + ' 組）</div>';
        html += '<table class="dtable"><thead><tr><th>物品</th><th>機率</th></tr></thead><tbody>';
        tier.slice().sort(function (a, b) { return b.pct - a.pct; }).forEach(function (t) {
          html += itemLinkRow(t.itemId, '<td><span class="rate' + (t.pct < 1 ? " low" : "") + '">' + t.pct + '%</span></td>');
        });
        html += '</tbody></table>';
      });
    }

    var boxesUsingAsKey = Object.keys(BOX_BY_ID).filter(function (bid) { return String(BOX_BY_ID[bid].keyId) === String(id); });
    if (boxesUsingAsKey.length) {
      html += '<div class="section-title">鑰匙 <span class="count">可開啟 ' + boxesUsingAsKey.length + ' 種寶箱</span></div>';
      html += '<div class="map-chip-row">' + boxesUsingAsKey.map(function (bid) { return itemChip(bid); }).join("") + '</div>';
    }

    var boxSources = (ITEM_TO_BOXES[id] || []).slice();
    if (boxSources.length) {
      html += '<div class="section-title">可從開箱取得 <span class="count">(' + boxSources.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>寶箱</th><th>鑰匙</th><th>機率</th></tr></thead><tbody>';
      boxSources.sort(function (a, b) { return b.pct - a.pct; }).forEach(function (s) {
        html += itemLinkRow(s.boxId, '<td>' + (ITEMS[s.keyId] ? escapeHtml(ITEMS[s.keyId].name) : "無資料") + '</td><td><span class="rate' + (s.pct < 1 ? " low" : "") + '">' + s.pct + '%</span></td>');
      });
      html += '</tbody></table>';
    }

    var questRefs = buildQuestReferences(id);
    html += '<div class="section-title">任務關聯 <span class="count">(' + (questRefs.quests.length + questRefs.missions.length) + ')</span></div>';
    if (!questRefs.quests.length && !questRefs.missions.length) {
      html += '<div class="empty-note">這個物品跟任務／藍圖任務系統沒有關聯。</div>';
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
    wireDropCalcBar(function () { showItem(id); });
  }

  function eqStat(label, v) {
    if (!v) return "";
    return '<div>' + label + ' <b>' + (v > 0 ? "+" : "") + v + '</b></div>';
  }
  function eqStatPct(label, v) {
    if (!v) return "";
    return '<div>' + label + ' <b>' + (v > 0 ? "+" : "") + v + '%</b></div>';
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

    var html = backButtonHtml();
    html += '<div class="detail-head" data-detail-of="monster:' + id + '"><div>' +
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
      return '<span class="map-chip" style="cursor:default;">' + escapeHtml(mapName(mid)) + '</span>';
    }).join("") + '</div>';

    if (ELEMENT_ORDER.indexOf(mon.element) !== -1) {
      html += '<div class="section-title">五行寶石加成建議</div>';
      html += '<div class="empty-note" style="padding:0 0 10px;">武器鑲上哪個屬性的寶石，對這隻怪物的傷害倍率：</div>';
      html += '<table class="dtable"><thead><tr><th>寶石屬性</th><th>關係</th><th>普攻倍率</th><th>技能倍率</th></tr></thead><tbody>';
      ELEMENT_ORDER.slice().sort(function (a, b) {
        return elementMultiplier(b, mon.element, "attack") - elementMultiplier(a, mon.element, "attack");
      }).forEach(function (gemEl) {
        var rel = elementRelation(gemEl, mon.element);
        var mult = ELEMENT_RELATION_MULT[rel];
        html += '<tr' + (rel === "counter" ? ' style="background:rgba(111,168,90,.06);"' : '') + '>' +
          '<td><span class="el-chip" style="color:var(--' + ELEMENT_CLASS[gemEl] + ')">' + ELEMENT_LABEL[gemEl] + '</span></td>' +
          '<td>' + ELEMENT_RELATION_LABEL[rel] + (rel === "counter" ? "（最佳）" : "") + '</td>' +
          '<td><span class="rate' + (mult.attack < 1 ? " low" : "") + '">×' + mult.attack.toFixed(2) + '</span></td>' +
          '<td><span class="rate' + (mult.skill < 1 ? " low" : "") + '">×' + mult.skill.toFixed(2) + '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    var letterRefs = LETTER_BY_MONSTER[id] || [];
    if (letterRefs.length) {
      html += '<div class="section-title">書信任務 <span class="count">(' + letterRefs.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>書信</th><th>繳交給</th><th>額外材料</th><th>獎勵</th></tr></thead><tbody>';
      letterRefs.forEach(function (lr) {
        var matHtml = lr.itemId ? itemChip(lr.itemId, lr.count) : "－";
        var placeHtml = lr.places && lr.places.length ? "（" + lr.places.map(escapeHtml).join("／") + "）" : "";
        var rewardParts = [];
        if (lr.fame) rewardParts.push("名聲+" + fmtNum(lr.fame));
        if (lr.gold) rewardParts.push(fmtNum(lr.gold) + "金");
        html += '<tr class="clickable" data-goto-item="' + lr.letterId + '">' +
          '<td><span class="name-link">' + escapeHtml(lr.letterName) + '</span></td>' +
          '<td>' + escapeHtml(lr.npcName) + placeHtml + '</td>' +
          '<td>' + matHtml + '</td>' +
          '<td>' + escapeHtml(rewardParts.join('、') || '－') + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    var dungeonRefs = (MONSTER_TO_DUNGEONS[id] || []).slice();
    if (dungeonRefs.length) {
      html += '<div class="section-title">出現副本 <span class="count">(' + dungeonRefs.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>副本</th><th>島嶼</th><th>身分</th></tr></thead><tbody>';
      dungeonRefs.forEach(function (r) {
        html += '<tr><td><span class="name-link" data-open-dungeon="' + r.dungeonId + '">' + escapeHtml(r.dungeonName) + '</span></td>' +
          '<td>' + escapeHtml(r.island || "-") + '</td>' +
          '<td>' + (r.isBoss ? '<span class="badge">首領</span>' : "一般怪物") + '</td></tr>';
      });
      html += '</tbody></table>';
    }

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
            ? '鐵匠／匠師不受等級差衰減影響（二轉爆破士會失去這個效果）→ ×100%'
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
    wireDropCalcBar(function () { showMonster(id); });
  }

  function statTile(label, val) {
    return '<div class="stat-tile"><div class="v">' + fmtNum(val) + '</div><div class="k">' + label + '</div></div>';
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
    resetNavHistory();
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
  function openBoxDetail(boxId) {
    var box = BOX_BY_ID[String(boxId)];
    if (!box) return;
    var html = '<div class="section-title">寶箱</div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + escapeHtml(box.name) + '</div>';
    if (box.dungeonGuess) {
      html += '<div class="badge-row" style="margin-bottom:10px;">' +
        '<span class="badge" data-open-dungeon="' + box.dungeonGuess.dungeonId + '" style="cursor:pointer;">來源副本（推測）：' + escapeHtml(box.dungeonGuess.dungeonName) + '</span>' +
        '</div>';
    } else {
      html += '<div class="empty-note" style="padding:0 0 6px;">目前猜不出這個寶箱是哪個副本掉的（名稱對不起來，不影響其他功能）。</div>';
    }
    html += '<div class="empty-note" style="padding:0 0 10px;">需要搭配鑰匙一起消耗才能打開：</div>';
    html += '<div class="map-chip-row">' + itemChip(box.keyId) + '</div>';
    box.tiers.forEach(function (tier, tIdx) {
      html += '<div class="section-title" style="margin-top:14px;">開出物品（第 ' + (tIdx + 1) + ' 組）</div>';
      html += '<table class="dtable"><thead><tr><th>物品</th><th>機率</th></tr></thead><tbody>';
      tier.slice().sort(function (a, b) { return b.pct - a.pct; }).forEach(function (t) {
        html += itemLinkRow(t.itemId, '<td><span class="rate' + (t.pct < 1 ? " low" : "") + '">' + t.pct + '%</span></td>');
      });
      html += '</tbody></table>';
    });
    $changelogBody.innerHTML = html;
    $changelogBackdrop.style.display = "flex";
  }

  function showDungeonBrowser() {
    var dungeonIds = Object.keys(DUNGEON_BY_ID);
    var html = '<h2 style="margin-top:0;">🏛️ 副本 <span class="count">(' + dungeonIds.length + ')</span></h2>';
    if (!dungeonIds.length) {
      html += '<div class="empty-note">目前沒有副本資料。</div>';
    } else {
      html += '<ul class="result-list">';
      dungeonIds.forEach(function (did) {
        var dg = DUNGEON_BY_ID[did];
        var monsterCount = dg.islands.reduce(function (s, isl) { return s + isl.monsters.length; }, 0);
        html += '<li class="result-item" data-open-dungeon="' + did + '">' +
          '<span class="rname">' + escapeHtml(dg.name) + '</span>' +
          '<span class="rmeta">Lv' + (dg.minLv || 0) + (dg.maxLv ? "~" + dg.maxLv : "+") + '　' + dg.islands.length + ' 個島嶼・' + monsterCount + ' 種怪物</span>' +
          '</li>';
      });
      html += '</ul>';
    }
    $detail.innerHTML = html;
  }

  function showBoxBrowser() {
    var boxIds = Object.keys(BOX_BY_ID);
    var html = '<h2 style="margin-top:0;">🎁 寶箱 <span class="count">(' + boxIds.length + ')</span></h2>';
    if (!boxIds.length) {
      html += '<div class="empty-note">目前沒有寶箱資料。</div>';
    } else {
      html += '<ul class="result-list">';
      boxIds.forEach(function (bid) {
        var box = BOX_BY_ID[bid];
        var itemCount = box.tiers.reduce(function (s, t) { return s + t.length; }, 0);
        html += '<li class="result-item" data-open-box="' + bid + '">' +
          '<span class="rname">' + escapeHtml(box.name) + '</span>' +
          '<span class="rmeta">' + (box.dungeonGuess ? escapeHtml(box.dungeonGuess.dungeonName) + "　" : "") + box.tiers.length + ' 組・共 ' + itemCount + ' 種物品</span>' +
          '</li>';
      });
      html += '</ul>';
    }
    $detail.innerHTML = html;
  }

  function showQuestLineBrowser() {
    var lineIds = Object.keys(MAIN_QUEST_LINES).sort(function (a, b) {
      var la = MAIN_QUEST_LINES[a], lb = MAIN_QUEST_LINES[b];
      return (lb.jobRelated - la.jobRelated) || la.title.localeCompare(lb.title, "zh-Hant");
    });
    currentDetail = null;
    currentView = { kind: "questtab", id: "main" };
    var html = backButtonHtml();
    html += questTabsHtml("main");
    html += '<h2 style="margin-top:0;">📖 主線任務 <span class="count">(' + lineIds.length + ')</span></h2>';
    html += '<div class="empty-note" style="padding:0 0 10px;">標「職業進度」的是跟轉職有關的劇情線，其他是一般劇情任務。點進去看完整流程：第幾步、要找哪個 NPC、在哪張地圖。</div>';
    if (!lineIds.length) {
      html += '<div class="empty-note">目前沒有主線任務資料。</div>';
    } else {
      html += '<ul class="result-list">';
      lineIds.forEach(function (lid) {
        var line = MAIN_QUEST_LINES[lid];
        html += '<li class="result-item" data-open-questline="' + lid + '">' +
          '<span class="rname">' + escapeHtml(line.title) + (line.jobRelated ? ' <span class="badge tag-harvest" style="margin-left:6px;">職業進度</span>' : '') + '</span>' +
          '<span class="rmeta">共 ' + line.parts.length + ' 個步驟' + (function (n) { return n ? '・已勾 ' + n : ''; })(loadQuestProgress(String(lid)).length) + '</span>' +
          '</li>';
      });
      html += '</ul>';
    }
    $detail.innerHTML = html;
  }

  // ---------- 任務分頁：主線任務／書信任務／委託任務 ----------
  function questTabsHtml(active) {
    var tabs = [["main", "📖 主線任務"], ["letter", "✉️ 書信任務"], ["commission", "📜 委託任務"], ["blueprint", "🗺️ 藍圖任務"]];
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<button type="button" data-quest-tab="' + t[0] + '" style="padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;font-family:inherit;' +
        'border:1px solid ' + (on ? "var(--gold)" : "var(--line-hi)") + ';background:' + (on ? "var(--gold)" : "var(--ink-2)") + ';color:' + (on ? "var(--ink)" : "var(--text)") + ';">' + t[1] + '</button>';
    }).join("") + '</div>';
  }
  function openQuestTab(tab) {
    if (tab === "letter") showLetterQuestBrowser();
    else if (tab === "commission") showCommissionBrowser();
    else if (tab === "blueprint") showBlueprintBrowser();
    else showQuestLineBrowser();
  }

  // 藍圖任務列表：依等級分段，只列「等級／目標／獎勵物品」，點列開彈窗看完整獎勵（經驗、金幣、名聲、代幣）
  function showBlueprintBrowser() {
    currentDetail = null;
    currentView = { kind: "questtab", id: "blueprint" };
    var ids = Object.keys(MISSIONS).sort(function (a, b) {
      return MISSIONS[a].unlockLevel - MISSIONS[b].unlockLevel || Number(a) - Number(b);
    });
    var html = backButtonHtml() + questTabsHtml("blueprint");
    html += '<h2 style="margin-top:0;">🗺️ 藍圖任務 <span class="count">(' + ids.length + ')</span></h2>';
    html += '<div class="empty-note" style="padding:0 0 10px;">不用接取，角色等級到了就能進行（擊殺類要等級到了之後打的才算）。點任一列看完整獎勵；點怪物或物品名稱可以直接查詢，查完按「← 上一頁」回來。</div>';
    if (!ids.length) {
      html += '<div class="empty-note">目前沒有藍圖任務資料。</div>';
    } else {
      html += '<table class="dtable"><thead><tr><th style="width:64px;">等級</th><th>需要擊殺的怪物／目標</th><th>裝備／物品獎勵</th></tr></thead><tbody>';
      ids.forEach(function (id) {
        var m = MISSIONS[id];
        html += '<tr class="clickable" data-mission-detail="' + id + '"' + (m.blocked ? ' style="opacity:.55;"' : '') + '>' +
          '<td style="white-space:nowrap;">Lv' + m.unlockLevel + '</td>' +
          '<td>' + missionTargetHtml(m, false) + (m.blocked ? '<br><span style="font-size:11.5px;color:var(--text-faint);">遊戲內目前無法完成</span>' : '') + '</td>' +
          '<td>' + (m.reward ? itemChip(m.reward, m.rewardCount || 1) : '<span style="color:var(--text-faint);">－</span>') + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }
    $detail.innerHTML = html;
  }
  function openMissionDetail(id) {
    var m = MISSIONS[String(id)];
    if (!m) return;
    var html = '<div class="section-title">🗺️ 藍圖任務 <span style="text-transform:none;">Lv' + m.unlockLevel + '</span>　<span class="count">' + escapeHtml(MISSION_KIND_LABEL[m.kind] || "") + '</span></div>';
    html += '<div class="section-title" style="margin-top:6px;">目標</div>';
    html += '<div style="font-size:13.5px;line-height:1.9;">' + missionTargetHtml(m, true) + '</div>';
    html += '<div class="empty-note" style="padding:6px 0 0;">' + escapeHtml(missionHowText(m)) + '</div>';
    html += '<div class="section-title">完成後可獲得</div>';
    html += missionRewardGridHtml(m);
    $changelogBody.innerHTML = html;
    $changelogBackdrop.style.display = "flex";
  }

  // 書信任務：列出所有交了有獎勵（名聲或金幣）的書信。規則對照遊戲 submitLetter()：
  // 每交 1 封書信（有額外材料的話同時交 count 個材料）算 1 份，每份給 fame 名聲 + gold 金幣。
  function showLetterQuestBrowser() {
    currentDetail = null;
    currentView = { kind: "questtab", id: "letter" };
    var rows = [];
    Object.keys(LETTER_SOURCE).forEach(function (letterId) {
      (LETTER_SOURCE[letterId] || []).forEach(function (ls) {
        if (!(ls.fame > 0) && !(ls.gold > 0)) return;
        var mon = MONSTERS[String(ls.monsterId)];
        var drop = (DROP_INDEX[letterId] || []).filter(function (d) { return String(d.m) === String(ls.monsterId); })
          .sort(function (a, b) { return b.r - a.r; })[0];
        rows.push({ letterId: letterId, ls: ls, monLv: mon ? mon.lv : 9999, drop: drop });
      });
    });
    rows.sort(function (a, b) { return a.monLv - b.monLv || Number(a.letterId) - Number(b.letterId); });

    var html = backButtonHtml() + questTabsHtml("letter");
    html += '<h2 style="margin-top:0;">✉️ 書信任務 <span class="count">(' + rows.length + ')</span></h2>';
    html += '<div class="empty-note" style="padding:0 0 10px;">打倒怪物掉落書信，拿去交給指定 NPC 換名聲／金幣；有「額外材料」的，每交 1 封要同時交出對應數量的材料。依掉落怪物的等級排序。</div>';
    if (!rows.length) {
      html += '<div class="empty-note">目前沒有書信任務資料。</div>';
    } else {
      html += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:640px;"><thead><tr><th>書信</th><th>掉落怪物</th><th>繳交給</th><th>額外材料</th><th>每份獎勵</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        var ls = r.ls;
        var monHtml = ls.monsterId != null && MONSTERS[String(ls.monsterId)]
          ? '<span class="lv-tag">Lv.' + r.monLv + '</span><span class="name-link" data-goto-monster="' + ls.monsterId + '">' + escapeHtml(MONSTERS[String(ls.monsterId)].name) + '</span>' +
            (r.drop ? '<br><span class="' + rateClass(r.drop.r) + '">' + pct(r.drop.r) + '</span>' : '')
          : escapeHtml(ls.monsterName || "未知怪物");
        var reward = [];
        if (ls.fame) reward.push("名聲 +" + fmtNum(ls.fame));
        if (ls.gold) reward.push(fmtNum(ls.gold) + " 金幣");
        html += '<tr>' +
          '<td style="white-space:nowrap;">' + itemChip(r.letterId) + '</td>' +
          '<td>' + monHtml + '</td>' +
          '<td>' + escapeHtml(ls.npcName) + (ls.places && ls.places.length ? '<br><span style="color:var(--text-faint);font-size:12px;">' + ls.places.map(escapeHtml).join("／") + '</span>' : '') + '</td>' +
          '<td style="white-space:nowrap;">' + (ls.itemId ? itemChip(ls.itemId, ls.count) : "－") + '</td>' +
          '<td>' + reward.join("<br>") + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    }
    $detail.innerHTML = html;
  }

  // 委託（quests.json）接取條件，照遊戲 Zv()：
  //   等級 < reqLevel → 太低；reqLevelMax 不是 null 且等級 > reqLevelMax → 太高
  //   名聲 < reqFameMin → 太低；名聲 > reqFameMax，或分頁 ceilingEffect=block 且名聲 > fameCeiling → 太高
  //   ceilingEffect=no_fame 的分頁：名聲超過 fameCeiling 還是能接，但完成不給名聲（Yv()/Qv()）
  function commissionFameMax(q, page) {
    var max = q.reqFameMax != null ? q.reqFameMax : null;
    if (page && page.ceilingEffect === "block" && page.fameCeiling != null) {
      max = max == null ? page.fameCeiling : Math.min(max, page.fameCeiling);
    }
    return max;
  }
  function commissionLevelText(q) {
    return "Lv" + q.reqLevel + " ~ " + (q.reqLevelMax != null ? "Lv" + q.reqLevelMax : "無上限");
  }
  function commissionFameText(q, page) {
    var max = commissionFameMax(q, page);
    return fmtNum(q.reqFameMin || 0) + " ~ " + (max != null ? fmtNum(max) : "無上限");
  }
  function commissionNoFameNote(page) {
    return page && page.ceilingEffect === "no_fame" && page.fameCeiling != null
      ? "名聲超過 " + fmtNum(page.fameCeiling) + " 後仍可接，但完成不再給名聲" : "";
  }

  function showCommissionBrowser() {
    currentDetail = null;
    currentView = { kind: "questtab", id: "commission" };
    // 依城鎮分組：同一城鎮有好幾個 NPC 發同一個分頁的委託時（例如獅子城新舊兩個秘書），只列一次
    var towns = [], townByKey = {};
    Object.keys(QUEST_PAGES).forEach(function (pid) {
      var page = QUEST_PAGES[pid];
      (page.boards || []).forEach(function (b) {
        var t = townByKey[b.townId];
        if (!t) { t = townByKey[b.townId] = { townId: b.townId, name: b.townName, order: b.order, pages: [] }; towns.push(t); }
        var pg = t.pages.filter(function (x) { return x.pageId === pid; })[0];
        if (!pg) { pg = { pageId: pid, page: page, npcs: [] }; t.pages.push(pg); }
        if (pg.npcs.indexOf(b.npc) === -1) pg.npcs.push(b.npc);
      });
    });
    towns.sort(function (a, b) { return a.order - b.order || a.townId - b.townId; });
    var questsByPage = {};
    Object.keys(QUESTS).forEach(function (qid) {
      var q = QUESTS[qid];
      (questsByPage[q.pageId] = questsByPage[q.pageId] || []).push({ id: qid, q: q });
    });
    Object.keys(questsByPage).forEach(function (pid) {
      questsByPage[pid].sort(function (a, b) { return a.q.reqLevel - b.q.reqLevel || (a.q.reqFameMin || 0) - (b.q.reqFameMin || 0) || Number(a.id) - Number(b.id); });
    });
    var levels = [], fames = [];
    Object.keys(QUESTS).forEach(function (qid) {
      var q = QUESTS[qid];
      if (levels.indexOf(q.reqLevel) === -1) levels.push(q.reqLevel);
      if (fames.indexOf(q.reqFameMin || 0) === -1) fames.push(q.reqFameMin || 0);
    });
    levels.sort(function (a, b) { return a - b; });
    fames.sort(function (a, b) { return a - b; });

    var selStyle = 'padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:3px;color:var(--text);font-family:inherit;font-size:13px;';
    var html = backButtonHtml() + questTabsHtml("commission");
    html += '<h2 style="margin-top:0;">📜 委託任務 <span class="count">(' + Object.keys(QUESTS).length + ')</span></h2>';
    html += '<div id="commissionBar" style="position:sticky;top:0;z-index:5;background:var(--panel);padding:8px 0 10px;margin-bottom:6px;border-bottom:1px solid var(--line);display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;color:var(--text-faint);">跳轉依據</label><select id="commissionJumpBy" style="' + selStyle + '">' +
      '<option value="town">依城鎮</option><option value="lv">依最低等級</option><option value="fame">依最低名聲</option></select></div>' +
      '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;color:var(--text-faint);">跳到</label><select id="commissionJumpTo" style="' + selStyle + 'min-width:130px;"></select></div>' +
      '<span id="commissionJumpStatus" style="font-size:12px;color:var(--gold-hi);"></span>' +
      '</div>';
    html += '<div class="empty-note" style="padding:0 0 8px;">等級／名聲是「可接取範圍」（最低 ~ 最高），條件照遊戲接委託時的判斷。先選跳轉依據，再從第二個選單選城鎮或數值；依等級／名聲跳轉時，所有最低值相同的委託都會標黃，並跳到第一筆。</div>';

    if (!towns.length) {
      var staleData = Object.keys(QUESTS).length > 0 && !Object.keys(QUEST_PAGES).some(function (pid) { return QUEST_PAGES[pid].boards; });
      html += '<div class="empty-note">' + (staleData
        ? "委託資料是舊版（quests.js 裡沒有各城鎮委託看板欄位），請重新執行一次 update_data.py 產生新的資料檔。"
        : "目前沒有委託資料（towns.json 裡找不到委託處 NPC，或 quests.json 沒有資料）。") + '</div>';
    }
    towns.forEach(function (t) {
      html += '<div data-commission-town="' + t.townId + '">';
      html += '<div class="section-title" style="font-size:15px;">🏘️ ' + escapeHtml(t.name) + '</div>';
      t.pages.forEach(function (pg) {
        var list = questsByPage[pg.pageId] || [];
        var note = commissionNoFameNote(pg.page);
        html += '<div class="equip-box" style="margin-bottom:12px;">';
        html += '<div class="row1"><span class="slot">' + escapeHtml(pg.page.title) + '</span><span style="color:var(--text-faint);font-size:12px;">' + pg.npcs.map(escapeHtml).join("、") + '・' + list.length + ' 個委託</span></div>';
        if (note) html += '<div class="empty-note" style="padding:0 0 6px;">⚠️ ' + note + '</div>';
        var rowAttrs = function (q) {
          return 'data-commission-row="1" data-town="' + t.townId + '" data-lv="' + q.reqLevel + '" data-fame="' + (q.reqFameMin || 0) + '"';
        };
        // 桌機：完整表格
        html += '<div class="cm-desktop" style="overflow-x:auto;"><table class="dtable" style="min-width:600px;"><thead><tr><th>繳交物品</th><th>相關怪物</th><th>可接等級</th><th>可接名聲</th><th>獎勵</th></tr></thead><tbody>';
        list.forEach(function (r) {
          var q = r.q, mon = MONSTERS[String(q.monsterId)];
          html += '<tr ' + rowAttrs(q) + '>' +
            '<td style="white-space:nowrap;">' + itemChip(q.itemId, q.count) + '</td>' +
            '<td>' + (mon ? '<span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link" data-goto-monster="' + q.monsterId + '">' + escapeHtml(mon.name) + '</span>' : "－") + '</td>' +
            '<td style="white-space:nowrap;">' + commissionLevelText(q) + '</td>' +
            '<td style="white-space:nowrap;">' + commissionFameText(q, pg.page) + '</td>' +
            '<td style="font-size:12.5px;white-space:nowrap;">名聲 +' + fmtNum(q.fame) + '<br>經驗 +' + fmtNum(q.exp) + '<br>' + fmtNum(q.gold) + ' 金幣</td>' +
            '</tr>';
        });
        html += '</tbody></table></div>';
        // 手機：只列接取 NPC + 等級／名聲範圍，點一下開視窗看要交的物品、相關怪物、獎勵
        html += '<div class="cm-mobile">';
        list.forEach(function (r) {
          var q = r.q;
          html += '<div ' + rowAttrs(q) + ' data-commission-detail="' + r.id + '" data-commission-detail-town="' + t.townId + '" role="button" tabindex="0" ' +
            'style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 6px;border-bottom:1px solid var(--line);cursor:pointer;">' +
            '<span class="name-link" style="font-size:14px;">' + pg.npcs.map(escapeHtml).join("、") + ' ›</span>' +
            '<span style="text-align:right;font-size:12.5px;line-height:1.6;color:var(--text-dim);white-space:nowrap;">' + commissionLevelText(q) + '<br>名聲 ' + commissionFameText(q, pg.page) + '</span>' +
            '</div>';
        });
        html += '</div></div>';
      });
      html += '</div>';
    });
    $detail.innerHTML = html;

    var $jumpBy = document.getElementById("commissionJumpBy");
    var $jumpTo = document.getElementById("commissionJumpTo");
    var $status = document.getElementById("commissionJumpStatus");
    var townNameById = {};
    towns.forEach(function (t) { townNameById[t.townId] = t.name; });
    // 頂部下拉列是 sticky，手機上會折成兩行（約 145px），固定的 scroll-margin 會讓目標被蓋住；
    // 改成每次依下拉列實際高度算出捲動位置
    function scrollBelowBar(el) {
      var bar = document.getElementById("commissionBar");
      var top = el.getBoundingClientRect().top + window.pageYOffset - (bar ? bar.offsetHeight : 0) - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    function highlight(rows) {
      Array.prototype.forEach.call($detail.querySelectorAll("[data-commission-row]"), function (tr) { tr.style.background = ""; });
      rows.forEach(function (tr) { tr.style.background = "rgba(201,162,75,.16)"; });
    }
    // 第二個選單的選項跟著第一個選單換：城鎮清單／所有委託出現過的最低等級／最低名聲
    function fillJumpOptions() {
      var mode = $jumpBy.value, opts;
      if (mode === "lv") {
        opts = '<option value="">選擇等級...</option>' + levels.map(function (v) { return '<option value="' + v + '">Lv' + v + '</option>'; }).join("");
      } else if (mode === "fame") {
        opts = '<option value="">選擇名聲...</option>' + fames.map(function (v) { return '<option value="' + v + '">' + fmtNum(v) + '</option>'; }).join("");
      } else {
        opts = '<option value="">選擇城鎮...</option>' + towns.map(function (t) { return '<option value="' + t.townId + '">' + escapeHtml(t.name) + '</option>'; }).join("");
      }
      $jumpTo.innerHTML = opts;
      highlight([]);
      $status.textContent = "";
    }
    function doJump() {
      var mode = $jumpBy.value, value = $jumpTo.value;
      highlight([]);
      $status.textContent = "";
      if (value === "") return;
      if (mode === "town") {
        var sec = $detail.querySelector('[data-commission-town="' + value + '"]');
        if (!sec) return;
        $status.textContent = "📍 " + (townNameById[value] || "");
        scrollBelowBar(sec);
        return;
      }
      // 桌機表格和手機清單都有同一組列，只找目前畫面上看得到的那一組（display:none 的 offsetParent 是 null）
      var rows = Array.prototype.slice.call($detail.querySelectorAll("[data-commission-row][data-" + mode + '="' + value + '"]'))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!rows.length) { $status.textContent = "沒有對應的委託"; return; }
      highlight(rows);
      var townCount = rows.map(function (r) { return r.getAttribute("data-town"); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length;
      // 手機版的列看不到城鎮名稱，所以跳完在下拉列旁邊標出目前所在城鎮
      $status.textContent = "📍 " + (townNameById[rows[0].getAttribute("data-town")] || "") +
        (rows.length > 1 ? "（共 " + rows.length + " 筆" + (townCount > 1 ? "，分布在 " + townCount + " 個城鎮" : "") + "）" : "");
      scrollBelowBar(rows[0]);
    }
    $jumpBy.addEventListener("change", fillJumpOptions);
    $jumpTo.addEventListener("change", doJump);
    fillJumpOptions();
  }

  // 委託詳細視窗（手機版點 NPC 開啟），沿用更新紀錄／寶箱共用的那個彈出視窗
  function openCommissionDetail(qid, townId) {
    var q = QUESTS[String(qid)];
    if (!q) return;
    var page = QUEST_PAGES[String(q.pageId)] || {};
    var boards = (page.boards || []).filter(function (b) { return String(b.townId) === String(townId); });
    var npcNames = boards.map(function (b) { return b.npc; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var mon = MONSTERS[String(q.monsterId)];
    var drop = (DROP_INDEX[String(q.itemId)] || []).filter(function (d) { return String(d.m) === String(q.monsterId); })
      .sort(function (a, b) { return b.r - a.r; })[0];
    var otherDroppers = (DROP_INDEX[String(q.itemId)] || []).filter(function (d) { return String(d.m) !== String(q.monsterId); })
      .map(function (d) { return d.m; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length;
    var noFameNote = commissionNoFameNote(page);

    var html = '<div class="section-title">📜 ' + escapeHtml(page.title || "委託") + '</div>';
    html += '<div class="detail-sub" style="margin-bottom:12px;">' + escapeHtml(boards.length ? boards[0].townName : "") +
      (npcNames.length ? '・' + npcNames.map(escapeHtml).join("、") : "") + '</div>';
    html += '<div class="section-title" style="margin-top:6px;">要繳交的物品</div>';
    html += '<div class="map-chip-row">' + itemChip(q.itemId, q.count) + '</div>';
    html += '<div class="section-title">相關怪物</div>';
    if (mon) {
      html += '<div style="font-size:13.5px;line-height:1.8;">' +
        '<span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link" data-goto-monster="' + q.monsterId + '">' + escapeHtml(mon.name) + '</span>' +
        (drop ? '　掉落機率 <span class="' + rateClass(drop.r) + '">' + pct(drop.r) + '</span>' : '') + '<br>' +
        '<span style="color:var(--text-dim);font-size:12.5px;">出現地圖：' + escapeHtml((mon.maps || []).map(mapName).join("、") || "－") + '</span>' +
        (otherDroppers ? '<br><span style="color:var(--text-faint);font-size:12px;">另有 ' + otherDroppers + ' 種怪物也會掉這個物品（點物品看全部）</span>' : '') +
        '</div>';
    } else {
      html += '<div class="empty-note" style="padding:0;">資料裡沒有對應的怪物。</div>';
    }
    html += '<div class="section-title">接取條件</div>';
    html += '<div style="font-size:13.5px;line-height:1.8;">等級：' + commissionLevelText(q) + '<br>名聲：' + commissionFameText(q, page) +
      (noFameNote ? '<br><span style="color:var(--gold-hi);font-size:12.5px;">⚠️ ' + noFameNote + '</span>' : '') + '</div>';
    html += '<div class="section-title">獎勵</div>';
    html += '<div class="equip-stat-grid">' +
      '<div>名聲<br><b>+' + fmtNum(q.fame) + '</b></div>' +
      '<div>經驗<br><b>+' + fmtNum(q.exp) + '</b></div>' +
      '<div>金幣<br><b>' + fmtNum(q.gold) + '</b></div>' +
      '</div>';
    $changelogBody.innerHTML = html;
    $changelogBackdrop.style.display = "flex";
  }

  // ---------- 任務攻略：進度記錄（只存在這台瀏覽器，查詢頁沒有存檔可讀，進度要玩家自己勾）----------
  var QUEST_PROGRESS_KEY = "hopeQuestProgress";
  function loadQuestProgress(lineId) {
    try {
      var all = JSON.parse(localStorage.getItem(QUEST_PROGRESS_KEY) || "{}");
      return Array.isArray(all[lineId]) ? all[lineId] : [];
    } catch (e) { return []; }
  }
  function saveQuestProgress(lineId, seqs) {
    try {
      var all = JSON.parse(localStorage.getItem(QUEST_PROGRESS_KEY) || "{}");
      all[lineId] = seqs;
      localStorage.setItem(QUEST_PROGRESS_KEY, JSON.stringify(all));
    } catch (e) { /* 無痕模式等存不了就算了，畫面照常顯示 */ }
  }

  var WEEKDAY_LABEL = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  function npcWhereText(name, mapIds, kill) {
    var maps = (mapIds || []).map(function (mid) { return townName(mid); }).join("／");
    return (kill ? "打倒／挑戰 " : "找 ") + "<b>" + escapeHtml(name || "未知 NPC") + "</b>" + (maps ? "（" + escapeHtml(maps) + "）" : "");
  }
  // 劇情旗標翻成人看得懂的前置條件
  function questFlagText(flag, currentLineId) {
    var info = QUEST_FLAG_INFO[String(flag)];
    if (!info) return "需要劇情進度 #" + flag + "（資料裡查不到是哪個對話給的）";
    if (info.lineId != null) {
      if (String(info.lineId) === String(currentLineId)) return "先完成本線 步驟 " + info.seq + "：" + escapeHtml(info.partName);
      return '先完成〔<span class="name-link" data-open-questline="' + info.lineId + '">' + escapeHtml(info.lineTitle) + '</span>〕步驟 ' + info.seq + "：" + escapeHtml(info.partName);
    }
    var who = (info.npcs || []).map(function (n) { return npcWhereText(n.name, n.mapIds, n.kill); }).join("　或　");
    var lineLinks = (info.lineIds || []).filter(function (lid) { return String(lid) !== String(currentLineId) && MAIN_QUEST_LINES[String(lid)]; })
      .map(function (lid) { return '〔<span class="name-link" data-open-questline="' + lid + '">' + escapeHtml(MAIN_QUEST_LINES[String(lid)].title) + '</span>〕'; });
    return "先" + (who || "完成前置劇情") + " 完成前置對話" + (lineLinks.length ? "（屬於 " + lineLinks.join("、") + "）" : "");
  }
  function questExtraText(e) {
    switch (e.k) {
      case "levelMax": return "等級不能超過 " + e.v;
      case "fameMax": return "名聲不能超過 " + fmtNum(e.v);
      case "hour": return "限 " + e.v + " 點整那一小時";
      case "weekday": return "限" + (WEEKDAY_LABEL[e.v] || ("星期代碼 " + e.v));
      case "sex": return e.v === "male" ? "限男性角色" : "限女性角色";
      case "anyJob": return "要已經轉職";
      case "noJob": return "要還沒轉職（初心者）";
      case "job": return "限職業：" + escapeHtml(e.v);
      case "party": return "隊伍要 " + e.v + " 人";
      case "never": return "此分支目前遊戲判定不會成立";
      default: return "";
    }
  }
  function mapReqText(mid, currentLineId) {
    var r = MAP_REQS[String(mid)];
    if (!r) return "";
    var parts = [];
    if (r.reqLevel) parts.push("Lv" + r.reqLevel);
    if (r.reqItem) parts.push("身上帶著 " + itemChip(r.reqItem));
    if (r.reqFlag) parts.push(r.reqNote ? "先" + escapeHtml(r.reqNote) : questFlagText(r.reqFlag, currentLineId));
    return parts.length ? "進入〔" + escapeHtml(mapName(mid)) + "〕需要：" + parts.join("、") : "";
  }
  function questItemSourceText(iid) {
    var lines = [];
    var gives = QUEST_ITEM_GIVES[String(iid)] || [];
    if (gives.length) {
      // 共用同一棵對話樹的 NPC 合併成一筆，列第一位，其餘寫在括號裡
      var groups = [], groupByTree = {};
      gives.forEach(function (g) {
        var key = g.treeId != null ? "t" + g.treeId : "r" + g.npcRow;
        if (groupByTree[key]) { groupByTree[key].others.push(g.npcName); return; }
        groupByTree[key] = { first: g, others: [] };
        groups.push(groupByTree[key]);
      });
      lines.push("取得方式：" + groups.map(function (grp) {
        return npcWhereText(grp.first.npcName, grp.first.mapIds, grp.first.kill) +
          (grp.others.length ? '<span style="opacity:.7;">（另有 ' + grp.others.length + " 位共用同一段對話：" + grp.others.map(escapeHtml).join("、") + "）</span>" : "");
      }).join("　或　") + " 取得");
    } else {
      var ks = itemKillSourceText(iid);
      if (ks) lines.push(ks);
    }
    var dropN = (DROP_INDEX[String(iid)] || []).length, shopN = (SHOP_INDEX[String(iid)] || []).length;
    if (dropN || shopN) {
      lines.push("另外：" + [dropN ? dropN + " 種怪物會掉落" : "", shopN ? "商店有賣" : ""].filter(Boolean).join("、") + "（點道具看詳細）");
    }
    return lines.join("<br>");
  }

  // 步驟有 flagId：多個方塊是同一個結果的不同達成方式；沒有 flagId：是這位 NPC 在本線的多段對話（遊戲 partNpcOpenFlags() 的規則），不是擇一
  function questReqsHint(part, n) {
    return part.flagId == null
      ? '這位 NPC 在本線有 ' + n + ' 段劇情對話，以下分別列出每一段的條件（順序以前置條件為準）：'
      : '以下 ' + n + ' 種方式擇一即可：';
  }

  // 含有「遊戲判定永遠不成立」條件的分支（未婚限制、職業碼 20200）不列出，只回報被略過幾筆
  function questUsableReqs(part) {
    var all = part.requirements || [];
    var list = all.filter(function (req) { return !(req.extra || []).some(function (e) { return e.k === "never"; }); });
    return { list: list, hidden: all.length - list.length };
  }
  function questHiddenNote(n) {
    return n ? '<div class="empty-note" style="padding:0 0 6px;">另有 ' + n + ' 種分支遊戲判定不會成立，未列出。</div>' : "";
  }
  // 對照遊戲 id()：有 flagId 的步驟看 flag 有沒有拿到（這裡＝玩家有沒有勾）；
  // 沒有 flagId 的步驟，只要排在它後面的某個有 flagId 步驟完成，就算完成。完成數只計算有 flagId 的步驟。
  function questProgressState(line, checked) {
    var lastFlagDoneIdx = -1;
    line.parts.forEach(function (p, idx) {
      if (p.flagId != null && checked.indexOf(p.seq) !== -1) lastFlagDoneIdx = idx;
    });
    var doneAt = line.parts.map(function (p, idx) {
      return p.flagId != null ? checked.indexOf(p.seq) !== -1 : (idx < lastFlagDoneIdx || checked.indexOf(p.seq) !== -1);
    });
    var countable = line.parts.filter(function (p) { return p.flagId != null; });
    return {
      doneAt: doneAt,
      done: countable.filter(function (p) { return checked.indexOf(p.seq) !== -1; }).length,
      countable: countable.length,
      next: line.parts.filter(function (p, idx) { return !doneAt[idx]; })[0],
      autoDone: function (idx) { return line.parts[idx].flagId == null && idx < lastFlagDoneIdx; }
    };
  }

  function showQuestLineDetail(lineId) {
    var line = MAIN_QUEST_LINES[String(lineId)];
    if (!line) return;
    currentDetail = null;
    var doneSeqs = loadQuestProgress(String(lineId));
    var progress = questProgressState(line, doneSeqs);
    var html = backButtonHtml();
    html += '<div class="section-title"><span class="name-link" id="questLineBackToList" style="cursor:pointer;">← 主線任務</span></div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + escapeHtml(line.title) +
      (line.jobRelated ? ' <span class="badge tag-harvest">職業進度</span>' : '') + '</div>';

    if (line.communityNote) {
      html += '<div style="background:rgba(90,140,201,.12);border:1px solid #5a8cc9;border-radius:4px;padding:12px 14px;margin-bottom:18px;font-size:13px;line-height:1.7;">' +
        '<div style="color:#8fb8e8;font-weight:700;margin-bottom:4px;">💡 社群攻略補充（非本站遊戲資料查到的，僅供參考）</div>' +
        escapeHtml(line.communityNote) +
        '</div>';
    }

    function renderReqBox(req) {
      var reqMapNames = (req.mapIds || []).map(function (mid) { return townName(mid); }).join("、");
      var out = '<div style="border:1px solid var(--line-hi);border-radius:4px;padding:8px 10px;margin-bottom:6px;background:rgba(255,255,255,.02);">';
      if (req.npcName || reqMapNames) {
        out += '<div style="font-size:12.5px;color:var(--gold-hi);margin-bottom:4px;">' +
          (req.npcName ? (req.kill ? "對象（戰鬥觸發）：" : "NPC：") + escapeHtml(req.npcName) : "") +
          (reqMapNames ? "　地圖：" + escapeHtml(reqMapNames) : "") +
          '</div>';
      }
      var mapReqs = (req.mapIds || []).map(function (mid) { return mapReqText(mid, lineId); }).filter(Boolean);
      mapReqs.forEach(function (t) { out += '<div class="empty-note" style="padding:0 0 4px;">🚪 ' + t + '</div>'; });
      var badges = [];
      if (req.lv) badges.push("等級 " + req.lv);
      if (req.fame) badges.push("名聲 " + fmtNum(req.fame));
      if (req.gold) badges.push("金幣 " + fmtNum(req.gold));
      if (badges.length) out += '<div class="badge-row" style="margin-bottom:6px;">' + badges.map(function (b) { return '<span class="badge">' + b + '</span>'; }).join('') + '</div>';
      var conds = (req.need || []).map(function (f) { return questFlagText(f, lineId); })
        .concat((req.extra || []).map(questExtraText).filter(Boolean));
      if (conds.length) {
        out += '<div style="font-size:12.5px;line-height:1.7;margin-bottom:4px;">' + conds.map(function (c) { return "・" + c; }).join("<br>") + '</div>';
      }
      if (req.items && req.items.length) {
        var takes = req.takes || [];
        out += '<div style="font-size:12.5px;margin:2px 0;">要帶著：</div>';
        out += '<div class="map-chip-row">' + req.items.map(function (it) {
          return itemChip(it[0], it[1]) + (takes.indexOf(it[0]) !== -1 ? '<span class="empty-note" style="padding:0 6px 0 0;">（會被收走）</span>' : '');
        }).join('') + '</div>';
        req.items.forEach(function (it) {
          var src = questItemSourceText(it[0]);
          if (src) out += '<div class="empty-note" style="padding:2px 0 0;">' + itemNamePrefix(it[0]) + src + '</div>';
        });
      }
      if (req.gives && req.gives.length) {
        out += '<div style="font-size:12.5px;margin:6px 0 2px;">完成後拿到：</div><div class="map-chip-row">' + req.gives.map(function (iid) { return itemChip(iid); }).join('') + '</div>';
      }
      out += '</div>';
      return out;
    }
    function itemNamePrefix(iid) {
      return ITEMS[iid] ? "〔" + escapeHtml(ITEMS[iid].name) + "〕" : "";
    }

    // ---- 進度 / 如何開始 ----
    var doneCount = progress.done;
    var nextPart = progress.next;
    html += '<div style="background:rgba(201,170,90,.10);border:1px solid var(--gold-hi);border-radius:4px;padding:12px 14px;margin-bottom:18px;font-size:13px;line-height:1.7;">';
    html += '<div style="font-weight:700;margin-bottom:4px;">🧭 目前進度：' + progress.done + ' / ' + progress.countable +
      (progress.countable !== line.parts.length ? '<span style="font-weight:400;color:var(--text-faint);font-size:12px;">（跟遊戲一樣只計算有劇情進度標記的步驟）</span>' : '') + '</div>';
    if (!nextPart) {
      html += '<div>這條線的步驟都勾完了 🎉</div>';
    } else if (line.chains && line.chains.length) {
      // 遊戲的 questGuide() 也不拿有 chains 的線去規劃，而是直接照各職業的 chains 步驟走，這裡同樣導去看 chains
      html += '<div>' + (doneCount === 0 ? "<b>如何開始：</b>" : "<b>下一步：</b>") + '先決定要轉哪個職業，照下方「各職業轉職流程」依序完成。</div>';
    } else {
      html += '<div style="margin-bottom:6px;">' + (doneCount === 0 ? "<b>如何開始：</b>" : "<b>下一步：</b>") +
        "步驟 " + nextPart.seq + "：" + escapeHtml(nextPart.name) +
        (nextPart.npcName ? "　→ " + npcWhereText(nextPart.npcName, nextPart.mapIds) : "") + '</div>';
      var nextUsable = questUsableReqs(nextPart);
      var nextReqs = nextUsable.list;
      if (nextReqs.length > 1) html += '<div class="empty-note" style="padding:0 0 4px;">' + questReqsHint(nextPart, nextReqs.length) + '</div>';
      nextReqs.forEach(function (req) { html += renderReqBox(req); });
      html += questHiddenNote(nextUsable.hidden);
      if (!nextReqs.length) html += '<div class="empty-note" style="padding:0;">遊戲資料沒有列出這一步的對話條件，請直接找 NPC 對話看看。</div>';
    }
    html += '<div class="empty-note" style="padding:6px 0 0;">進度是你自己在下方勾選的，只存在這台瀏覽器；本站讀不到遊戲存檔。</div>';
    html += '</div>';

    // ---- 遊戲內建的轉職流程（chains，只有轉職線有）----
    if (line.chains && line.chains.length) {
      html += '<div class="section-title">各職業轉職流程（遊戲資料）</div>';
      line.chains.forEach(function (chain) {
        html += '<div class="equip-box" style="margin-bottom:10px;"><div class="row1"><span class="slot">' + escapeHtml(chain.name) + '</span></div>';
        html += '<ol style="margin:4px 0 0 18px;padding:0;font-size:12.5px;line-height:1.8;">';
        chain.steps.forEach(function (st) {
          var bits = [st.kind === "kill" && st.monsterId != null && MONSTERS[String(st.monsterId)]
            ? '打倒／挑戰 <span class="name-link" data-goto-monster="' + st.monsterId + '">' + escapeHtml(st.name) + '</span>' +
              ((st.mapIds || []).length ? "（" + escapeHtml(st.mapIds.map(townName).join("／")) + "）" : "")
            : (st.row != null || st.name ? npcWhereText(st.name, st.mapIds, st.kind !== "npc") : "")];
          if (st.lv) bits.push("等級 " + st.lv);
          if (st.need && st.need.length) bits.push(st.need.map(function (f) { return questFlagText(f, lineId); }).join("、"));
          if (st.needs && st.needs.length) bits.push("帶著 " + st.needs.map(function (n) { return itemChip(n[0], n[1]); }).join(""));
          if (st.gives && st.gives.length) bits.push("拿到 " + st.gives.map(function (iid) { return itemChip(iid); }).join(""));
          if (st.job) bits.push("<b>完成轉職</b>");
          html += '<li>' + bits.filter(Boolean).join("　") + '</li>';
        });
        html += '</ol></div>';
      });
    }

    html += '<div class="section-title">完整流程</div>';
    html += '<div class="empty-note" style="padding:0 0 8px;">同一步驟列出多個方塊時，是不同的達成方式（遊戲會依對話分支順序判定），擇一即可。</div>';

    line.parts.forEach(function (part, partIdx) {
      var mapNames = (part.mapIds || []).map(function (mid) { return mapName(mid); }).join("、");
      var isDone = progress.doneAt[partIdx];
      var autoDone = progress.autoDone(partIdx);
      html += '<div class="equip-box" style="margin-bottom:10px;' + (isDone ? "opacity:.55;" : "") + '">';
      html += '<div class="row1"><label style="cursor:pointer;display:flex;align-items:center;gap:6px;">' +
        '<input type="checkbox" data-quest-done="' + part.seq + '"' + (isDone ? " checked" : "") + (autoDone ? " disabled" : "") + '>' +
        '<span class="slot">步驟 ' + part.seq + '：' + escapeHtml(part.name) + '</span></label>' +
        (autoDone ? '<span style="font-size:11.5px;color:var(--text-faint);">後面的步驟已完成，這步自動算完成</span>' : '') + '</div>';
      html += '<div class="empty-note" style="padding:0 0 8px;">' +
        (part.npcName ? "NPC：" + escapeHtml(part.npcName) : "") +
        (mapNames ? "　地圖：" + escapeHtml(mapNames) : "") +
        '</div>';
      var usable = questUsableReqs(part);
      var reqs = usable.list;
      html += questHiddenNote(usable.hidden);
      if (reqs.length) {

        if (line.jobRelated) {
          // 職業進度相關的線（轉職、2轉試驗）才按職業分組。分組依據只用資料確定的：
          // 1. 條件裡有限定職業（conds 的 has_job 職業碼）→「限 X」
          // 2. 對話會轉職的 NPC（update_data.py 的 CONFIRMED_JOB_BY_NPC_ROW，已用對話樹 change_job_id 核對）→「可轉職成 X」
          // 用道具名稱推測的（jobConfirmed=false）不採用
          var jobGroups = {}; var jobOrder = [];
          reqs.forEach(function (req) {
            var jobConds = (req.extra || []).filter(function (e) { return e.k === "job"; }).map(function (e) { return e.v; });
            var key = jobConds.length ? "限職業：" + jobConds.filter(function (v, i, a) { return a.indexOf(v) === i; }).join("、")
              : (req.guessedJob && req.jobConfirmed ? "可轉職成：" + req.guessedJob : "不分職業");
            if (!jobGroups[key]) { jobGroups[key] = []; jobOrder.push(key); }
            jobGroups[key].push(req);
          });
          jobOrder.forEach(function (key) {
            var group = jobGroups[key];
            if (jobOrder.length > 1 || key !== "不分職業") {
              html += '<div class="empty-note" style="padding:6px 0 4px;color:var(--text);font-weight:600;">' + escapeHtml(key) +
                (group.length > 1 ? "　（下面每一個方塊都是不同的達成方式，擇一即可）" : "") + '</div>';
            } else if (group.length > 1) {
              html += '<div class="empty-note" style="padding:4px 0 4px;">' + questReqsHint(part, group.length) + '</div>';
            }
            group.forEach(function (req) { html += renderReqBox(req); });
          });
        } else {
          // 一般劇情線：如果同一步驟有多種達成方式，只標「達成方式擇一」，不提職業
          if (reqs.length > 1) {
            html += '<div class="empty-note" style="padding:4px 0 4px;">' + questReqsHint(part, reqs.length) + '</div>';
          }
          reqs.forEach(function (req) { html += renderReqBox(req); });
        }
      }
      html += '</div>';
    });

    $detail.innerHTML = html;
    document.getElementById("questLineBackToList").addEventListener("click", showQuestLineBrowser);
    Array.prototype.forEach.call($detail.querySelectorAll("[data-quest-done]"), function (box) {
      box.addEventListener("change", function () {
        var seq = Number(box.getAttribute("data-quest-done"));
        var seqs = loadQuestProgress(String(lineId)).filter(function (s) { return s !== seq; });
        if (box.checked) seqs.push(seq);
        saveQuestProgress(String(lineId), seqs);
        showQuestLineDetail(lineId);
      });
    });
  }

  var BATTLE_PET_INFO = window.BATTLE_PET_INFO || { kinds: [], growthTypes: [], levels: {}, auras: {}, skills: [], upgrades: [], gearSlots: [], gear: [], crafts: [], stoneCrafts: [] };
  var BPET_STAT_LABEL = { hp: "HP", ap: "AP", atk: "攻擊", hit: "命中", crit: "爆擊", def: "防禦", eva: "迴避", reviveCost: "復活費用", sp: "SP", exp: "所需經驗" };
  var BPET_AURA_LABEL = { atk: "攻擊", mag: "魔法", def: "防禦", hit: "命中", eva: "迴避", aspd: "攻速", crit: "爆擊", mspd: "移速", hp: "HP", ap: "AP" };

  function showPetBrowser(tierFilter) {
    var allIds = Object.keys(PET_INFO).sort(function (a, b) {
      return (PET_INFO[a].tier - PET_INFO[b].tier) || (PET_INFO[a].lv - PET_INFO[b].lv);
    });
    var tiers = Array.from(new Set(allIds.map(function (id) { return PET_INFO[id].tier; }))).sort(function (a, b) { return a - b; });
    var petIds = tierFilter ? allIds.filter(function (id) { return PET_INFO[id].tier === tierFilter; }) : allIds;

    if (tierFilter === "bpet") {
      var html2 = '<h2 style="margin-top:0;">🐉 戰寵列表 <span class="count">(' + BATTLE_PET_INFO.kinds.length + ')</span></h2>';
      html2 += '<div style="margin-bottom:12px;">' +
        '<label style="font-size:12.5px;color:var(--text-faint);margin-right:8px;">跳到階級</label>' +
        '<select id="petTierFilter" style="padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:3px;color:var(--text);">' +
        '<option value="">全部</option>' +
        tiers.map(function (t) { return '<option value="' + t + '">' + t + ' 階</option>'; }).join('') +
        '<option value="bpet" selected>戰寵</option>' +
        '</select></div>';
      html2 += '<div class="empty-note" style="padding:0 0 10px;">戰寵是跟一般寵物完全獨立的系統，同一時間只能帶一隻出戰，可以升級、進化、裝備、學技能。點名稱看完整資料。</div>';
      html2 += '<ul class="result-list">';
      BATTLE_PET_INFO.kinds.forEach(function (k) {
        html2 += '<li class="result-item" data-open-bpet="' + k.kind + '">' +
          '<span class="rname">' + escapeHtml(k.name) + '</span>' +
          '<span class="rmeta">' + escapeHtml(ELEMENT_LABEL[k.element] || k.element) + '屬性　' + (k.stages || []).length + ' 個進化階段</span>' +
          '</li>';
      });
      html2 += '</ul>';
      $detail.innerHTML = html2;
      document.getElementById("petTierFilter").addEventListener("change", function (e) {
        showPetBrowser(e.target.value ? (e.target.value === "bpet" ? "bpet" : Number(e.target.value)) : null);
      });
      return;
    }

    var html = '<h2 style="margin-top:0;">🐾 寵物列表 <span class="count">(' + petIds.length + (tierFilter ? " / 共 " + allIds.length : "") + ')</span></h2>';
    html += '<div style="margin-bottom:12px;">' +
      '<label style="font-size:12.5px;color:var(--text-faint);margin-right:8px;">跳到階級</label>' +
      '<select id="petTierFilter" style="padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:3px;color:var(--text);">' +
      '<option value=""' + (!tierFilter ? " selected" : "") + '>全部</option>' +
      tiers.map(function (t) { return '<option value="' + t + '"' + (tierFilter === t ? " selected" : "") + '>' + t + ' 階</option>'; }).join('') +
      '<option value="bpet">戰寵</option>' +
      '</select></div>';
    html += '<div class="empty-note" style="padding:0 0 10px;">出戰中的寵物才會生效，而且飽食度(hunger)一定要大於 0，不然不管成長階段多高，加成一律歸零。點寵物名稱看牠 9 個成長階段各自提供多少能力。</div>';
    if (!petIds.length) {
      html += '<div class="empty-note">這個階級沒有寵物資料。</div>';
    } else {
      html += '<ul class="result-list">';
      petIds.forEach(function (pid) {
        var p = PET_INFO[pid];
        html += '<li class="result-item" data-open-pet="' + pid + '">' +
          '<span class="rname">' + escapeHtml(p.name) + '</span>' +
          '<span class="rmeta">' + p.tier + '階　Lv' + p.lv + '・名聲 ' + fmtNum(p.fame) + '</span>' +
          '</li>';
      });
      html += '</ul>';
    }
    $detail.innerHTML = html;
    document.getElementById("petTierFilter").addEventListener("change", function (e) {
      showPetBrowser(e.target.value ? (e.target.value === "bpet" ? "bpet" : Number(e.target.value)) : null);
    });
  }

  function showBattlePetDetail(kind, growthTypeId) {
    kind = String(kind);
    var k = BATTLE_PET_INFO.kinds.find(function (kk) { return String(kk.kind) === kind; });
    if (!k) return;
    growthTypeId = growthTypeId != null ? String(growthTypeId) : "0";

    var html = backButtonHtml();
    html += '<div class="section-title"><span class="name-link" id="bpetBackToList" style="cursor:pointer;">← 戰寵列表</span></div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + escapeHtml(k.name) + '</div>';
    html += '<div class="badge-row" style="margin-bottom:14px;">' +
      '<span class="el-chip" style="color:var(--' + (ELEMENT_CLASS[k.element] || "el-none") + ')">' + escapeHtml(ELEMENT_LABEL[k.element] || k.element) + '屬性</span>' +
      '<span class="badge">最高等級 ' + BATTLE_PET_INFO.maxLevel + '</span>' +
      '</div>';

    if (k.stages && k.stages.length) {
      html += '<div class="section-title">進化階段</div>';
      html += '<div class="map-chip-row" style="margin-bottom:14px;">' + k.stages.map(function (s, idx) { return '<span class="map-chip">' + (idx + 1) + '. ' + escapeHtml(s) + '</span>'; }).join('') + '</div>';
    }

    if (BATTLE_PET_INFO.upgrades && BATTLE_PET_INFO.upgrades.length) {
      html += '<div class="section-title">進化需求（所有戰寵共用）</div>';
      html += '<table class="dtable" style="margin-bottom:14px;"><thead><tr><th>階段</th><th>等級</th><th>材料</th><th>金幣</th><th>成功率</th></tr></thead><tbody>';
      BATTLE_PET_INFO.upgrades.forEach(function (u) {
        html += '<tr><td>' + (k.stages ? escapeHtml(k.stages[u.fromGrade] || u.fromGrade) : u.fromGrade) + ' → ' + (k.stages ? escapeHtml(k.stages[u.toGrade] || u.toGrade) : u.toGrade) + '</td>' +
          '<td>Lv' + u.level + '</td>' +
          '<td>' + itemChip(u.itemId, u.itemCount) + '</td>' +
          '<td>' + fmtNum(u.cost) + '</td>' +
          '<td><span class="rate' + (u.ratePct < 50 ? " low" : "") + '">' + u.ratePct + '%</span></td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    var growthTypes = BATTLE_PET_INFO.growthTypes || [];
    if (growthTypes.length) {
      html += '<div class="section-title">屬性成長（依天賦分級，天賦要進化到第2階段之後才會知道是哪一種）</div>';
      html += '<div style="margin-bottom:10px;">' + growthTypes.map(function (gt) {
        var active = String(gt.id) === growthTypeId;
        return '<span class="hint-chip bpet-gt-tab" data-gt="' + gt.id + '" style="cursor:pointer;margin-right:6px;' + (active ? "border-color:var(--gold);color:var(--gold-hi);" : "") + '">' + escapeHtml(gt.name) + '（機率 ' + (gt.weight / 100).toFixed(1) + '%）</span>';
      }).join('') + '</div>';

      var levelRows = (BATTLE_PET_INFO.levels[kind] || {})[growthTypeId] || [];
      var sampleLevels = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(function (lv) { return lv <= levelRows.length; });
      if (levelRows.length) {
        var statKeys = ["hp", "ap", "atk", "hit", "crit", "def", "eva", "sp", "reviveCost", "exp"];
        html += '<div class="empty-note" style="padding:0 0 8px;">下面只抽樣列出幾個等級（1/10/20.../100），不是全部100等都列出來。</div>';
        html += '<table class="dtable" style="margin-bottom:14px;"><thead><tr><th>等級</th>' + statKeys.map(function (sk) { return '<th>' + BPET_STAT_LABEL[sk] + '</th>'; }).join('') + '</tr></thead><tbody>';
        sampleLevels.forEach(function (lv) {
          var row = levelRows[lv - 1];
          html += '<tr><td>Lv' + lv + '</td>' + statKeys.map(function (sk) { return '<td>' + fmtNum(row[sk]) + '</td>'; }).join('') + '</tr>';
        });
        html += '</tbody></table>';
      }

      var auraRows = (BATTLE_PET_INFO.auras[kind] || {})[growthTypeId] || [];
      if (auraRows.length) {
        var auraKeys = Object.keys(BPET_AURA_LABEL);
        html += '<div class="section-title">給主人的加成（戰寵出戰時，主人會額外獲得這些加成）</div>';
        html += '<div class="empty-note" style="padding:0 0 8px;">一樣只抽樣列出幾個等級。</div>';
        html += '<table class="dtable" style="margin-bottom:14px;"><thead><tr><th>等級</th>' + auraKeys.map(function (ak) { return '<th>' + BPET_AURA_LABEL[ak] + '</th>'; }).join('') + '</tr></thead><tbody>';
        sampleLevels.forEach(function (lv) {
          var row = auraRows[lv - 1];
          if (!row) return;
          html += '<tr><td>Lv' + lv + '</td>' + auraKeys.map(function (ak) { return '<td>' + fmtNum(row[ak]) + '</td>'; }).join('') + '</tr>';
        });
        html += '</tbody></table>';
      }
    }

    var skills = (BATTLE_PET_INFO.skills || []).filter(function (s) { return s.pet === 0 || String(s.pet) === kind; });
    if (skills.length) {
      html += '<div class="section-title">技能 <span class="count">(' + skills.length + ')</span></div>';
      skills.forEach(function (s) {
        html += '<div class="equip-box" style="margin-bottom:10px;">';
        html += '<div class="row1"><span class="slot">' + escapeHtml(s.name) + '</span><span class="rate">開放等級 Lv' + s.unlockLevel + '</span></div>';
        html += '<div class="empty-note" style="padding:0 0 8px;">' + escapeHtml((s.levels && s.levels[0] && s.levels[0].tip) || "") + '</div>';
        if (s.levels && s.levels.length) {
          html += '<table class="dtable"><thead><tr><th>技能等級</th><th>SP</th><th>AP</th><th>威力</th><th>冷卻</th></tr></thead><tbody>';
          s.levels.forEach(function (lvl, idx) {
            html += '<tr><td>' + (idx + 1) + '</td><td>' + lvl.sp + '</td><td>' + lvl.ap + '</td><td>' + lvl.power + '</td><td>' + (lvl.cooldownMs / 1000) + '秒</td></tr>';
          });
          html += '</tbody></table>';
        }
        html += '</div>';
      });
    }

    var gearForKind = (BATTLE_PET_INFO.gear || []).filter(function (g) { return String(g.pet) === kind; });
    if (gearForKind.length) {
      html += '<div class="section-title">專屬裝備 <span class="count">(' + gearForKind.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>裝備</th><th>需求等級</th><th>攻擊</th><th>防禦</th><th>HP</th><th>AP</th></tr></thead><tbody>';
      gearForKind.sort(function (a, b) { return a.lv - b.lv; }).forEach(function (g) {
        html += itemLinkRow(g.id, '<td>Lv' + g.lv + '</td><td>' + fmtNum(g.atk) + '</td><td>' + fmtNum(g.def) + '</td><td>' + fmtNum(g.hp) + '</td><td>' + fmtNum(g.ap) + '</td>');
      });
      html += '</tbody></table>';
    }

    $detail.innerHTML = html;
    document.getElementById("bpetBackToList").addEventListener("click", function () { showPetBrowser("bpet"); });
    Array.prototype.slice.call(document.querySelectorAll(".bpet-gt-tab")).forEach(function (tab) {
      tab.addEventListener("click", function () { showBattlePetDetail(kind, tab.getAttribute("data-gt")); });
    });
  }

  function showPetDetail(petId) {
    var p = PET_INFO[String(petId)];
    if (!p) return;
    var html = backButtonHtml();
    html += '<div class="section-title"><span class="name-link" id="petBackToList" style="cursor:pointer;">← 寵物列表</span></div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + escapeHtml(p.name) + '</div>';
    html += '<div class="badge-row" style="margin-bottom:14px;">' +
      '<span class="badge">' + p.tier + ' 階</span>' +
      '<span class="badge">出戰需求 Lv' + p.lv + '</span>' +
      '<span class="badge">出戰需求名聲 ' + fmtNum(p.fame) + '</span>' +
      '<span class="badge">飽食度上限 ' + fmtNum(p.feedFull) + '</span>' +
      '</div>';
    html += '<div class="empty-note" style="padding:0 0 14px;">飽食度(hunger)必須大於 0，下面的加成才會真的套用到角色身上；沒有成長曲線的屬性，不管幾階都固定不變。</div>';

    var evolveFrom = PET_EVOLVE_FROM[String(petId)] || [];
    if (evolveFrom.length) {
      html += '<div class="section-title">進化來源 <span class="count">(從這幾隻進化過來)</span></div>';
      evolveFrom.forEach(function (f) {
        var fromPet = PET_INFO[String(f.from)];
        html += '<div class="equip-box" style="margin-bottom:10px;">' +
          '<div class="row1"><span class="slot"><span class="name-link" data-open-pet="' + f.from + '">' + escapeHtml(fromPet ? fromPet.name : "#" + f.from) + '</span></span>' +
          '<span class="rate">' + f.rate + '%</span></div>' +
          '<div class="map-chip-row">' + f.mats.map(function (mid) { return itemChip(mid); }).join('') + '</div>' +
          '</div>';
      });
    }

    if (p.evolve && p.evolve.length) {
      html += '<div class="section-title">可能進化成</div>';
      p.evolve.forEach(function (ev, idx) {
        html += '<div class="equip-box" style="margin-bottom:10px;">';
        if (p.evolve.length > 1) html += '<div class="empty-note" style="padding:0 0 6px;">材料組合 ' + (idx + 1) + '：</div>';
        html += '<div class="map-chip-row" style="margin-bottom:10px;">' + ev.mats.map(function (mid) { return itemChip(mid); }).join('') + '</div>';
        var totalRate = ev.targets.reduce(function (s, t) { return s + t.rate; }, 0);
        ev.targets.forEach(function (t) {
          var toPet = PET_INFO[String(t.to)];
          html += '<div class="row1" style="margin-bottom:4px;"><span class="slot"><span class="name-link" data-open-pet="' + t.to + '">' + escapeHtml(toPet ? toPet.name : "#" + t.to) + '</span></span>' +
            '<span class="rate">' + t.rate + '%</span></div>';
        });
        if (totalRate < 100) {
          html += '<div class="row1"><span style="color:var(--text-faint);font-size:13px;">進化失敗（掉成長階段或經驗歸零）</span>' +
            '<span class="rate low">' + (100 - totalRate) + '%</span></div>';
        }
        html += '</div>';
      });
    }

    var statKeys = Object.keys(PET_STAT_LABEL);
    html += '<table class="dtable"><thead><tr><th>成長階段</th>' + statKeys.map(function (k) { return '<th>' + PET_STAT_LABEL[k] + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var grow = 1; grow <= 9; grow++) {
      html += '<tr><td>+' + grow + '</td>' + statKeys.map(function (k) {
        var v = petStatAt(p, k, grow);
        return '<td>' + (v ? '<span class="rate">' + v + '</span>' : '<span class="rate low">-</span>') + '</td>';
      }).join('') + '</tr>';
    }
    html += '</tbody></table>';

    $detail.innerHTML = html;
    document.getElementById("petBackToList").addEventListener("click", showPetBrowser);
  }

  function openDungeonDetail(dungeonId) {
    var dg = DUNGEON_BY_ID[String(dungeonId)];
    if (!dg) return;
    var html = '<div class="section-title">副本</div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + escapeHtml(dg.name) + '</div>';
    html += '<div class="badge-row" style="margin-bottom:14px;">' +
      '<span class="badge">等級 ' + (dg.minLv || 0) + (dg.maxLv ? "~" + dg.maxLv : "+") + '</span>' +
      (dg.difficulty ? '<span class="badge">' + escapeHtml(dg.difficulty) + '</span>' : "") +
      (dg.entries ? '<span class="badge">每日 ' + dg.entries + ' 次進場</span>' : "") +
      '</div>';
    var relatedBoxes = DUNGEON_TO_BOXES[String(dungeonId)] || [];
    if (relatedBoxes.length) {
      html += '<div class="section-title">可能掉落的寶箱（推測） <span class="count">(' + relatedBoxes.length + ')</span></div>';
      html += '<div class="map-chip-row" style="margin-bottom:14px;">' + relatedBoxes.map(function (b) {
        return '<span class="map-chip" data-open-box="' + b.boxId + '">' + escapeHtml(b.boxName) + '</span>';
      }).join("") + '</div>';
    }
    dg.islands.forEach(function (isl) {
      html += '<div class="section-title" style="margin-top:14px;">' + escapeHtml(isl.name || isl.key) + '</div>';
      if (isl.boss != null) {
        html += '<div class="empty-note" style="padding:0 0 6px;">首領：</div><div class="map-chip-row" style="margin-bottom:8px;">' +
          '<span class="map-chip" data-changelog-goto="monster:' + isl.boss + '">' + escapeHtml(MONSTERS[isl.boss] ? MONSTERS[isl.boss].name : "無資料") + '</span></div>';
      }
      var others = isl.monsters.filter(function (mid) { return mid !== isl.boss; });
      if (others.length) {
        html += '<div class="empty-note" style="padding:0 0 6px;">怪物（' + others.length + '）：</div><div class="map-chip-row">' +
          others.map(function (mid) {
            return '<span class="map-chip" data-changelog-goto="monster:' + mid + '">' + escapeHtml(MONSTERS[mid] ? MONSTERS[mid].name : "無資料") + '</span>';
          }).join("") + '</div>';
      }
    });
    $changelogBody.innerHTML = html;
    $changelogBackdrop.style.display = "flex";
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
      resetNavHistory();
      if (parts[0] === "monster") { currentView = { kind: "monster", id: parts[1] }; showMonster(parts[1]); }
      else { currentView = { kind: "item", id: parts[1] }; showItem(parts[1]); }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  document.addEventListener("click", function (e) {
    // 在彈出視窗（委託詳細／寶箱）裡點物品、怪物等連結跳頁時，先把視窗關掉，不然新頁面會被蓋住
    if (e.target.closest("#changelogBackdrop") && e.target.closest("[data-goto-item],[data-goto-monster],[data-open-questline],[data-open-pet],[data-open-dungeon]")) {
      closeChangelog();
    }
    var commissionDetail = e.target.closest("[data-commission-detail]");
    if (commissionDetail) { openCommissionDetail(commissionDetail.getAttribute("data-commission-detail"), commissionDetail.getAttribute("data-commission-detail-town")); return; }
    var backLink = e.target.closest("[data-go-back]");
    if (backLink) { goBackOneView(); return; }
    var gotoItemLink = e.target.closest("[data-goto-item]");
    if (gotoItemLink) { navigateTo("item", gotoItemLink.getAttribute("data-goto-item"), true); return; }
    var gotoMonsterLink = e.target.closest("[data-goto-monster]");
    if (gotoMonsterLink) { navigateTo("monster", gotoMonsterLink.getAttribute("data-goto-monster"), true); return; }
    var petLink = e.target.closest("[data-open-pet]");
    if (petLink) { navigateTo("pet", petLink.getAttribute("data-open-pet"), true); return; }
    var bpetLink = e.target.closest("[data-open-bpet]");
    if (bpetLink) { navigateTo("bpet", bpetLink.getAttribute("data-open-bpet"), true); return; }
    var dgLink = e.target.closest("[data-open-dungeon]");
    if (dgLink) { openDungeonDetail(dgLink.getAttribute("data-open-dungeon")); return; }
    var boxLink = e.target.closest("[data-open-box]");
    if (boxLink) { openBoxDetail(boxLink.getAttribute("data-open-box")); return; }
    // 藍圖任務列：列裡的怪物／物品／副本連結在上面已經先處理掉了，點到列的其他地方才開詳細彈窗
    var missionDetail = e.target.closest("[data-mission-detail]");
    if (missionDetail) { openMissionDetail(missionDetail.getAttribute("data-mission-detail")); return; }
    var questTab = e.target.closest("[data-quest-tab]");
    if (questTab) { openQuestTab(questTab.getAttribute("data-quest-tab")); return; }
    var questLineLink = e.target.closest("[data-open-questline]");
    if (questLineLink) navigateTo("questline", questLineLink.getAttribute("data-open-questline"), true);
  });

  wireGlobalLevelField();
})();
