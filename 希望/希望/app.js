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
      ? name + "（每 N 級加點，數字越小越強）"
      : name;
  }
  // 發條屬性的 unit：0 = 直接加數值、1 = 每 N 級 +1、2 = 每 N 級 +2（XG 以上的力量／敏捷／智力／幸運）
  var ENCHANT_PERCENT_KINDS = [13, 14, 23]; // 遊戲裡這幾種直接加值的後面有 %
  function enchantValueText(kind, min, max, unit) {
    var range = min === max ? String(min) : (min + " ~ " + max);
    if (unit) return "每 " + range + " 級 +" + (unit === 2 ? 2 : 1);
    return range + (ENCHANT_PERCENT_KINDS.indexOf(kind) !== -1 ? "%" : "");
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
  function dropWhiffChance(mon) {
    return mon && mon.atk === 0 ? DROP_WHIFF_CHANCE : 0;
  }
  // 掉落組別倍率：bundle 的 Cl（組別代號照 xl：1 一般、2 材料、3 裝備、4 首領）
  var DROP_GROUP_MULT = { 1: 0.44, 2: 0.12, 3: 0.083, 4: 1 };
  var DROP_GROUP_LABEL = { 1: "一般", 2: "材料", 3: "裝備", 4: "首領" };
  var DROP_FORMULA_NOTE = "機率已照遊戲的掉落計算換算：一般組 ×44%、材料組 ×12%、裝備組 ×8.3%、首領組 ×100%，同一組每隻怪最多掉一件（組內機率照資料順序累加，超過 100% 的部分不算）；攻擊力 0 的怪物已扣掉 14.5% 整批落空；未含技能、狀態的掉落加成。";
  // 照遊戲 El()（遊戲自己顯示掉落機率的 dropChances() 就是用它）算這隻怪每件物品的掉落機率（0~1）：
  // 每組各抽一次、最多掉一件；組內照資料順序累加 rate/1,000,000 × 掉落倍率 × 組別倍率，超過 1 的部分截掉；
  // 最後乘上 (1 − 整批落空機率)。mult＝遊戲 dropMultiplier 的等級差部分（不含技能／狀態加成）。
  // 回傳 {物品id: {p: 機率, groups: [組別...], raw: 資料原始 rate 加總}}
  function monsterDropChances(mon, mult) {
    var keep = 1 - dropWhiffChance(mon);
    var byGroup = {}, order = [], out = {};
    (mon.drops || []).forEach(function (d) {
      if (!byGroup[d.g]) { byGroup[d.g] = []; order.push(d.g); }
      byGroup[d.g].push(d);
    });
    order.forEach(function (g) {
      var scale = (mult == null ? 1 : mult) * (DROP_GROUP_MULT[g] != null ? DROP_GROUP_MULT[g] : 1);
      var cum = 0;
      byGroup[g].forEach(function (d) {
        var before = Math.min(1, cum * scale);
        cum += d.r / RATE_DIVISOR;
        var p = (Math.min(1, cum * scale) - before) * keep;
        var e = out[d.i] || (out[d.i] = { p: 0, groups: [], raw: 0 });
        e.p += p;
        e.raw += d.r;
        if (e.groups.indexOf(d.g) === -1) e.groups.push(d.g);
      });
    });
    return out;
  }
  function playerDropMultiplier(mon) {
    if (dropCalcState.level == null || dropCalcState.blacksmith) return 1;
    return dropLevelMultiplier(dropCalcState.level, mon.lv);
  }
  // 機率（0~1）轉成顯示文字／樣式，沿用原本 pct()/rateClass() 的格式
  function pctP(p) { return pct(p * RATE_DIVISOR); }
  function rateClassP(p) { return rateClass(p * RATE_DIVISOR); }
  // DROP_INDEX 裡同一隻怪可能因為在好幾組（或同組重複）出現而有多筆，算「幾隻怪物會掉」要去重複
  function dropMonsterCount(itemId) {
    var seen = {};
    (DROP_INDEX[String(itemId)] || []).forEach(function (d) { seen[d.m] = true; });
    return Object.keys(seen).length;
  }
  function dropGroupTags(groups) {
    return groups.map(function (g) { return '<span class="group-tag">' + (DROP_GROUP_LABEL[g] || ("組" + g)) + '</span>'; }).join("");
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
    // 快速查看視窗和主畫面可能同時有這個勾選框（同一個 id），要在「這次畫的那一邊」找
    var inPeek = peekMode;
    var $bs = detailTarget().querySelector("#dropCalcBlacksmith");
    if ($bs) $bs.addEventListener("change", function () {
      dropCalcState.blacksmith = $bs.checked;
      peekMode = inPeek;
      try { onChange(); } finally { peekMode = false; }
    });
  }
  // ---------- 快速查看（彈出視窗）----------
  // 在詳細頁／彈窗裡點物品、怪物、副本連結時，不換掉主畫面，改在彈出視窗裡顯示，關掉就回到原本在看的內容。
  // peekMode 為 true 時，showItem/showMonster/showDungeonDetail 會畫進彈窗、不動左側清單與瀏覽紀錄。
  var peekMode = false;
  var $peekBody = null;
  function detailTarget() { return peekMode ? $peekBody : $detail; }
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
  // 鍛造成功後抽出某個成品的機率（%）。chances 跟 products 一一對應，是 2026-09-18 改版後才有的欄位，
  // 舊資料沒有就回傳 null，畫面上就不顯示機率。
  function forgeProductChance(book, itemId) {
    if (!book || !book.chances) return null;
    var idx = book.products.indexOf(Number(itemId));
    return idx < 0 ? null : book.chances[idx];
  }
  function forgeChanceHtml(book, itemId) {
    var c = forgeProductChance(book, itemId);
    if (c == null) return '';
    return '<span class="' + rateClassP(c / 100) + '">' + pctP(c / 100) + '</span>';
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

  // 名稱比對：-1＝不符；0＝關鍵字連續出現（原本的做法）；>0＝字依序出現但中間隔了字（例如「木劍」對「木製劍」），數字越小越接近。
  // 關鍵字裡的空白不算字。
  function nameMatchGap(name, q) {
    if (name.indexOf(q) !== -1) return 0;
    var chars = Array.from(q.replace(/\s+/g, ""));
    if (chars.length < 2) return -1;
    var pos = -1, first = -1;
    for (var i = 0; i < chars.length; i++) {
      pos = name.indexOf(chars[i], pos + 1);
      if (pos === -1) return -1;
      if (i === 0) first = pos;
    }
    return (pos - first + 1) - chars.length + 1;
  }
  // 從清單挑出符合的：連續的照原順序在前，不連續的依間隔小→大、名稱短→長排在後面，並標上 loose:true
  function matchByName(list, q, extraFilter) {
    var exact = [], loose = [];
    list.forEach(function (entry) {
      if (extraFilter && !extraFilter(entry)) return;
      var gap = nameMatchGap(entry.name, q);
      if (gap === 0) exact.push(entry);
      else if (gap > 0) loose.push({ entry: entry, gap: gap });
    });
    loose.sort(function (a, b) { return a.gap - b.gap || a.entry.name.length - b.entry.name.length; });
    return exact.concat(loose.map(function (l) {
      var copy = {};
      Object.keys(l.entry).forEach(function (k) { copy[k] = l.entry[k]; });
      copy.loose = true;
      return copy;
    }));
  }

  // 搜尋列前的分類下拉：裝備部位看 equip.slot；物品分類用 items.json 的 c（遊戲背包分頁 GL 表的名稱與順序）
  var ITEM_CATEGORY_OPTIONS = [["heal", "恢復"], ["use", "消耗"], ["material", "材料"], ["junk", "雜物"], ["box", "寶箱"], ["pet", "寵物"], ["bpet", "戰寵"], ["quest", "任務"]];
  var HAS_ITEM_CATEGORY_DATA = Object.keys(ITEMS).some(function (id) { return ITEMS[id].c; });
  var CATEGORY_BROWSE_LIMIT = 500;
  var currentBrowseTotal = null; // 沒輸入關鍵字、只選分類時：該分類的總件數（清單最多列 CATEGORY_BROWSE_LIMIT 件）
  function categoryFilterValue() {
    return $searchCategory ? $searchCategory.value : "";
  }
  function passesCategoryFilter(id) {
    var v = categoryFilterValue();
    if (!v) return true;
    var it = ITEMS[id];
    if (!it) return false;
    if (v === "equip:*") return !!it.equip || it.c === "equip";
    if (v.indexOf("equip:") === 0) return !!it.equip && it.equip.slot === v.slice(6);
    if (v === "cat:general") return !it.equip && it.c !== "equip" && it.c !== "quest";
    return it.c === v.slice(4);
  }
  function categoryFilterLabel() {
    return $searchCategory && $searchCategory.value ? $searchCategory.options[$searchCategory.selectedIndex].text : "";
  }
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
  var EQUIP_SLOTS_FOR_FILTER = window.EQUIP_SLOTS || {}; // 下方職業／部位篩選用的 EQUIP_SLOTS 變數在後面才宣告，這裡先直接讀 window
  var $searchCategory = document.getElementById("searchCategory");
  if ($searchCategory) {
    var catHtml = '<option value="">全部分類</option><optgroup label="裝備部位"><option value="equip:*">全部裝備</option>';
    var usedSlots = {};
    Object.keys(ITEMS).forEach(function (id) { if (ITEMS[id].equip) usedSlots[ITEMS[id].equip.slot] = true; });
    Object.keys(EQUIP_SLOTS_FOR_FILTER).forEach(function (slotKey) {
      if (usedSlots[slotKey]) catHtml += '<option value="equip:' + slotKey + '">' + escapeHtml(EQUIP_SLOTS_FOR_FILTER[slotKey]) + '</option>';
    });
    catHtml += '</optgroup><optgroup label="物品分類"' + (HAS_ITEM_CATEGORY_DATA ? "" : ' disabled') + '>' +
      '<option value="cat:general">一般物品（裝備、任務以外）</option>' +
      ITEM_CATEGORY_OPTIONS.map(function (c) { return '<option value="cat:' + c[0] + '">' + c[1] + '</option>'; }).join("") +
      '</optgroup>';
    $searchCategory.innerHTML = catHtml;
    if (!HAS_ITEM_CATEGORY_DATA) $searchCategory.title = "物品分類要重新執行 update_data.py 才能用（裝備部位可以用）";
    $searchCategory.addEventListener("change", function () {
      resetNavHistory();
      runSearch($input.value);
    });
  }
  var $obtainableOnly = document.getElementById("obtainableOnly");
  if ($obtainableOnly) {
    if (!window.ITEM_OBTAIN) {
      $obtainableOnly.disabled = true;
      $obtainableOnly.parentNode.title = "資料檔是舊版，請重新執行 update_data.py 才能使用";
      $obtainableOnly.parentNode.style.opacity = ".5";
    }
    $obtainableOnly.addEventListener("change", function () {
      resetNavHistory();
      runSearch($input.value);
    });
  }
  var SEARCH_PLACEHOLDER_DEFAULT = $input ? $input.placeholder : "";
  if ($abilityOnly) {
    $abilityOnly.addEventListener("change", function () {
      $input.placeholder = $abilityOnly.checked ? "輸入裝備能力，例如：魔法、魔法力>20 攻速<10" : SEARCH_PLACEHOLDER_DEFAULT;
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
  // 大數字縮寫（超過 9999）：取最大單位＋下一段的千／百位，有捨去就加「多」。
  // 例：10000→1萬、250000000→2億5千萬、452000→45萬2千、1034865→103萬4千多、4127547868864→4兆1千多億
  var NUM_UNITS = [[1e12, "兆"], [1e8, "億"], [1e4, "萬"]];
  function chineseNumAbbr(value) {
    var sign = value < 0 ? "-" : "";
    var n = Math.floor(Math.abs(value));
    for (var i = 0; i < NUM_UNITS.length; i++) {
      var unit = NUM_UNITS[i][0];
      if (n < unit) continue;
      var major = Math.floor(n / unit), rem = n - major * unit;
      var lower = i + 1 < NUM_UNITS.length ? NUM_UNITS[i + 1] : [1, ""];
      var seg = Math.floor(rem / lower[0]);
      var dropped = rem - seg * lower[0] > 0;
      var segText = "";
      if (seg >= 1000) { segText = Math.floor(seg / 1000) + "千"; dropped = dropped || seg % 1000 > 0; }
      else if (seg >= 100) { segText = Math.floor(seg / 100) + "百"; dropped = dropped || seg % 100 > 0; }
      else if (seg > 0) { dropped = true; }
      var text = sign + major + NUM_UNITS[i][1];
      if (segText) text += segText + (dropped ? "多" : "") + lower[1];
      else if (dropped) text += "多";
      return text;
    }
    return sign + fmtNum(n);
  }
  // 數值格用：≤9999 直接顯示；超過就顯示縮寫，點一下切換完整數字（document 層處理 data-num-toggle）
  function bigNumHtml(value, prefix) {
    prefix = prefix || "";
    var n = Number(value) || 0;
    if (Math.abs(n) <= 9999) return escapeHtml(prefix + fmtNum(n));
    var shortText = prefix + chineseNumAbbr(n), fullText = prefix + fmtNum(n);
    return '<span class="num-abbr" data-num-toggle="short" data-short="' + escapeHtml(shortText) + '" data-full="' + escapeHtml(fullText) +
      '" title="點一下看完整數字">' + escapeHtml(shortText) + '</span>';
  }
  // 物品編號在 ITEMS 裡查不到時（例如遊戲剛更新、資料還沒補齊），一律顯示「無資料」，
  // 不要把編號秀給玩家看；查不到的也不給點擊連結，因為點了也沒有對應頁面可以看。
  // suffixHtml：接在名稱後面的額外內容（例如鍛造成品的機率），可省略
  function itemChip(id, qty, suffixHtml) {
    var it = ITEMS[id];
    var suffix = (qty != null ? ' ×' + qty : '') + (suffixHtml ? ' ' + suffixHtml : '');
    if (!it) return '<span class="map-chip" style="opacity:.5;">無資料' + suffix + '</span>';
    return '<span class="map-chip" data-goto-item="' + id + '">' + escapeHtml(it.name) + suffix + '</span>';
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
    scrollToDetail();
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
    scrollToDetail();
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
    scrollToDetail();
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
    scrollToDetail();
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
    scrollToDetail();
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
    if (kind === "item" || kind === "monster") {
      // 左側清單會換成只剩這一筆，把上一次能力搜尋／分類瀏覽的總數清掉，不然標題會顯示舊數字
      currentAbilityTotal = null;
      currentBrowseTotal = null;
      currentAbilityFields = [];
    }
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
    } else if (kind === "dungeon") {
      showDungeonDetail(id);
    } else if (kind === "questline") {
      showQuestLineDetail(id);
    } else if (kind === "questtab") {
      openQuestTab(id);
    }
    if (restoreScrollY != null) window.scrollTo(0, restoreScrollY);
    else scrollToDetail();
  }
  // 換了詳細頁內容之後捲到看得到的位置：桌機兩欄時詳細頁就在右上，捲回頂端；
  // 手機單欄（≤820px，跟 CSS .cols 的斷點一致）時詳細頁在搜尋區和結果清單下面，捲回頂端反而看不到，改捲到詳細頁開頭。
  var stackedLayoutQuery = window.matchMedia ? window.matchMedia("(max-width:820px)") : null;
  function scrollToDetail() {
    var top = 0;
    if (stackedLayoutQuery && stackedLayoutQuery.matches) {
      top = Math.max(0, $detail.getBoundingClientRect().top + window.pageYOffset - 8);
    }
    window.scrollTo({ top: top, behavior: "smooth" });
  }
  function goBackOneView() {
    if (!navHistory.length) return;
    var prev = navHistory.pop();
    navigateTo(prev.kind, prev.id, false, prev.scrollY);
  }
  function backButtonHtml() {
    if (peekMode || !navHistory.length) return "";
    return '<div style="margin-bottom:12px;"><span class="name-link" data-go-back="1" style="cursor:pointer;">← 上一頁</span></div>';
  }

  // 遊戲資料裡的測試裝備（名稱開頭「[測試用]」，數值動輒上萬），能力搜尋時不列出，免得永遠排第一
  function isTestItemName(name) { return /^\[測試用\]/.test(name || ""); }
  // 使用者要求：鍵盤不好打 ≥ ≤，所以 > 就當 ≥、< 就當 ≤（>= <= 照樣可以用，結果相同）
  var ABILITY_OPS = {
    ">": function (v, n) { return v >= n; }, ">=": function (v, n) { return v >= n; },
    "<": function (v, n) { return v <= n; }, "<=": function (v, n) { return v <= n; },
    "=": function (v, n) { return v === n; }
  };
  var ABILITY_OP_TEXT = { ">": "≧", ">=": "≧", "<": "≦", "<=": "≦", "=": "＝" };

  // 「僅顯示目前可取得裝備」：ITEM_OBTAIN 由 update_data.py 照遊戲所有取得管道（掉落、商店、任務、製作、合成、開箱、釣魚…）算出，
  // 查不到任何管道的物品就藏起來。舊資料檔沒有 ITEM_OBTAIN 時不過濾。
  var ITEM_OBTAIN = window.ITEM_OBTAIN || null;
  function obtainFilterOn() {
    return !!(ITEM_OBTAIN && $obtainableOnly && $obtainableOnly.checked);
  }
  function passesObtainFilter(id) {
    return !obtainFilterOn() || !!ITEM_OBTAIN[String(id)];
  }
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
        EQUIP_ABILITIES.map(function (a) { return a.label; }).join("、") + '；可用空白同時查多項，能力後面可加 &gt;（大於等於）、&lt;（小於等於）、= 條件，例如「魔法力&gt;20」。</li>';
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
    }).join("、") + (categoryFilterValue() ? "（分類：" + categoryFilterLabel() + "）" : "") + (obtainFilterOn() ? "（只列可取得的裝備）" : "");
    var matches = itemList.filter(function (it) {
      var eq = ITEMS[it.id].equip;
      return eq && !isTestItemName(it.name) && passesObtainFilter(it.id) && passesCategoryFilter(it.id) && conds.every(function (c) { return passes(eq, c); });
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

  // 沒有關鍵字、只選了分類：直接列出該分類的物品（裝備依需求等級、其他依名稱排序）
  function runCategoryBrowse() {
    var v = categoryFilterValue();
    var matches = itemList.filter(function (it) { return passesCategoryFilter(it.id) && passesObtainFilter(it.id); });
    matches.sort(function (a, b) {
      var ea = ITEMS[a.id].equip, eb = ITEMS[b.id].equip;
      if (v.indexOf("equip:") === 0 && ea && eb) return (ea.minLv || 0) - (eb.minLv || 0) || a.name.localeCompare(b.name, "zh-Hant");
      return a.name.localeCompare(b.name, "zh-Hant");
    });
    currentMatches.monsters = [];
    currentAbilityFields = [];
    currentBrowseTotal = matches.length;
    currentMatches.items = matches.slice(0, CATEGORY_BROWSE_LIMIT);
    if (!matches.length) {
      $resultCount.textContent = "";
      $resultList.innerHTML = '<li class="empty-note">「' + escapeHtml(categoryFilterLabel()) + '」沒有物品' +
        (obtainFilterOn() ? "（已開啟「僅顯示目前可取得裝備」）" : "") + '。</li>';
      return;
    }
    renderResultList("");
  }

  function runSearch(qRaw) {
    var q = (qRaw || "").trim();
    currentMatches.items = [];
    currentMatches.monsters = [];
    currentAbilityTotal = null;
    currentBrowseTotal = null;

    if (q === "") {
      if (categoryFilterValue() && !($abilityOnly && $abilityOnly.checked)) { runCategoryBrowse(); return; }
      renderEmptyResults();
      showWelcome();
      return;
    }
    if ($abilityOnly && $abilityOnly.checked) { runAbilityOnlySearch(q); return; }

    var itemFilter = function (it) { return passesObtainFilter(it.id) && passesCategoryFilter(it.id); };
    currentMatches.items = matchByName(itemList, q, itemFilter).slice(0, 200);

    var abilityField = findAbilityField(q);
    if (abilityField) {
      var already = {};
      currentMatches.items.forEach(function (it) { already[it.id] = true; });
      var abilityMatches = itemList.filter(function (it) {
        var eq = ITEMS[it.id].equip;
        return eq && eq[abilityField] > 0 && !already[it.id] && itemFilter(it); // 已經在名稱比對裡的就不重複加
      }).sort(function (a, b) {
        return (ITEMS[b.id].equip[abilityField] || 0) - (ITEMS[a.id].equip[abilityField] || 0);
      });
      currentMatches.items = currentMatches.items.concat(abilityMatches).slice(0, 200);
    }
    currentAbilityFields = abilityField ? [abilityField] : [];

    // 選了物品分類時只找物品，不列怪物
    currentMatches.monsters = categoryFilterValue() ? [] : matchByName(monsterList, q).slice(0, 200);

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
      ? '<li class="empty-note">輸入裝備能力搜尋，例如：魔法、攻速、減傷；可用空白同時查多項，能力後面可加 &gt;（大於等於）、&lt;（小於等於）、=（等於）縮小數值範圍，例如「魔法力&gt;20 攻速&lt;10」。</li>'
      : '<li class="empty-note">開始輸入以搜尋物品或怪物名稱。</li>';
  }

  function renderResultList(q) {
    var total = currentMatches.items.length + currentMatches.monsters.length;
    var shownTotal = currentAbilityTotal != null ? currentAbilityTotal : (currentBrowseTotal != null ? currentBrowseTotal : total);
    $resultCount.textContent = total ? "(" + shownTotal + ")" : "";
    // 不連續字的結果前面加一行分隔，讓玩家知道下面這些是「字沒有連在一起」比對到的
    var looseDivider = function (list, idx) {
      return list[idx].loose && (idx === 0 || !list[idx - 1].loose)
        ? '<li class="empty-note" style="padding:6px 6px 2px;font-size:11.5px;">↓ 字沒有連在一起、但依序出現的結果</li>' : "";
    };

    if (total === 0) {
      // 從上方功能按鈕（寵物／副本／任務…）進來時沒有關鍵字，不要顯示「找不到符合「」」
      if (!q.trim()) { renderEmptyResults(); return; }
      var qLower = q.trim().toLowerCase();
      var isEgg = SEARCH_TRIGGERS.indexOf(qLower) !== -1;
      if (isEgg) {
        $resultList.innerHTML = '<li class="empty-note">找不到符合「<a href="' + EDITOR_URL +
          '" style="color:var(--gold-hi);text-decoration:underline;">希望修改器</a>」的物品或怪物。</li>';
      } else {
        $resultList.innerHTML = '<li class="empty-note">找不到符合「' + escapeHtml(q) + '」的' + (categoryFilterValue() ? "物品" : "物品或怪物") +
          (categoryFilterValue() ? "（分類：" + escapeHtml(categoryFilterLabel()) + "）" : "") +
          (obtainFilterOn() ? "（已開啟「僅顯示目前可取得裝備」，沒有取得管道的物品不會列出）" : "") + '。</li>';
      }
      return;
    }

    var html = "";

    if (currentMatches.monsters.length) {
      html += '<li class="empty-note" style="padding:6px 6px 2px;color:var(--gold-hi);font-size:12px;font-weight:700;">怪物 (' + currentMatches.monsters.length + ')</li>';
      currentMatches.monsters.forEach(function (m, idx) {
        var mon = MONSTERS[m.id];
        var harvestTag = mon.isHarvest ? " ・採集" : "";
        html += looseDivider(currentMatches.monsters, idx);
        html += '<li class="result-item" data-type="monster" data-id="' + m.id + '">' +
          '<span class="rname">' + escapeHtml(m.name) + '</span>' +
          '<span class="rmeta">Lv.' + m.lv + harvestTag + '</span></li>';
      });
    }

    if (currentMatches.items.length) {
      html += '<li class="empty-note" style="padding:10px 6px 2px;color:var(--gold-hi);font-size:12px;font-weight:700;">' +
        (currentAbilityTotal != null ? "裝備 (" + currentAbilityTotal + ")"
          : currentBrowseTotal != null ? escapeHtml(categoryFilterLabel()) + " (" + currentBrowseTotal + ")"
          : "物品 (" + currentMatches.items.length + ")") + '</li>';
      if (currentBrowseTotal != null && currentBrowseTotal > currentMatches.items.length) {
        html += '<li class="empty-note" style="padding:2px 6px 6px;font-size:12px;">只列出前 ' + currentMatches.items.length + ' 件，可以輸入關鍵字縮小範圍。</li>';
      }
      if (currentAbilityTotal != null && currentAbilityConditionText) {
        html += '<li class="empty-note" style="padding:2px 6px 4px;font-size:12px;">條件：' + escapeHtml(currentAbilityConditionText) + '</li>';
      }
      if (currentAbilityTotal != null && currentAbilityTotal > currentMatches.items.length) {
        html += '<li class="empty-note" style="padding:2px 6px 6px;font-size:12px;">只列出數值最高的 ' + currentMatches.items.length + ' 件，可以再多加一項能力縮小範圍。</li>';
      }
      currentMatches.items.forEach(function (it, idx) {
        html += looseDivider(currentMatches.items, idx);
        var count = dropMonsterCount(it.id);
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
        if (itemLetterMaterialUses(it.id).length) metaParts.push("書信材料");
        if (BOX_KEY_TO_BOXES[String(it.id)]) metaParts.push("寶箱鑰匙");
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
    // 手機版結果清單在詳細頁上面，點了要捲下去才看得到（桌機不動，清單還在原位可以繼續點）
    if (stackedLayoutQuery && stackedLayoutQuery.matches) scrollToDetail();
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
      // 副本裡的怪（賢者之塔、艾希頓這類）只列地圖看不出是哪個副本；變身型態連地圖都沒有，要說明怎麼出現
      var dgHtml = detail ? monsterDungeonLinksHtml(m.monsterId) : "";
      var originHtml = detail ? monsterOriginsHtml(m.monsterId) : "";
      return '擊殺 <span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link" data-goto-monster="' + m.monsterId + '">' + escapeHtml(mon.name) + '</span> ×' + m.need +
        (detail && !dgHtml && mon.maps && mon.maps.length ? '<br><span style="color:var(--text-dim);font-size:12.5px;">出現地圖：' + escapeHtml(mon.maps.map(mapName).join("、")) + '</span>' : '') +
        (dgHtml ? '<br><span style="color:var(--text-dim);font-size:12.5px;">出現副本：' + dgHtml + '</span>' : '') +
        (originHtml ? '<br><span style="color:var(--text-dim);font-size:12.5px;">' + originHtml + '</span>' : '');
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
  // 怪物出現的副本（不重複），連結可以點開副本；身分是首領／變身／召喚的標在後面
  function monsterDungeonLinksHtml(mid) {
    var seen = {}, parts = [];
    (MONSTER_TO_DUNGEONS[String(mid)] || []).forEach(function (r) {
      if (seen[r.dungeonId]) return;
      seen[r.dungeonId] = true;
      var role = r.isBoss ? "首領" : (r.role || "");
      parts.push('<span class="name-link" data-open-dungeon="' + r.dungeonId + '">' + escapeHtml(r.dungeonName) + '</span>' +
        (role ? '（' + escapeHtml(role) + '）' : ''));
    });
    return parts.join("、");
  }
  // 由哪隻怪、在什麼條件下變身／召喚出來：[{oid, r}]
  function monsterOrigins(mid) {
    var out = [];
    Object.keys(MONSTERS).forEach(function (oid) {
      (MONSTERS[oid].reactions || []).forEach(function (r) {
        if (String(r.to) === String(mid)) out.push({ oid: oid, r: r });
      });
    });
    return out;
  }
  function monsterOriginsHtml(mid) {
    return monsterOrigins(mid).map(function (f) {
      return '由 <span class="name-link" data-goto-monster="' + f.oid + '">' + escapeHtml(MONSTERS[f.oid].name) + '</span> 在「' +
        reactionCond(f.r) + '」' + (f.r.act === "morph" ? "變身而來" : "召喚出來");
    }).join("<br>");
  }
  function missionHowText(m) {
    if (m.blocked) return "⚠️ 這筆在遊戲裡目前無法完成（不會累積進度、也不能領獎）。";
    if (m.kind === "kill") return "不用接取：角色等級到達 Lv" + m.unlockLevel + " 之後擊殺指定怪物才會開始計數（等級不到時打的不算）。";
    if (m.kind === "dungeon") return "角色等級到達 Lv" + m.unlockLevel + " 之後進入指定副本即完成。";
    return "角色等級到達 Lv" + m.unlockLevel + " 之後，到指定城鎮找 NPC 完成。";
  }
  function missionRewardGridHtml(m) {
    return '<div class="equip-stat-grid">' +
      '<div>經驗<br><b>' + bigNumHtml(m.exp || 0, "+") + '</b></div>' +
      '<div>金幣<br><b>' + bigNumHtml(m.gold || 0) + '</b></div>' +
      '<div>名聲<br><b>' + bigNumHtml(m.fame || 0, "+") + '</b></div>' +
      '<div>' + escapeHtml(missionTokenName()) + '<br><b>' + bigNumHtml(m.token || 0, "×") + '</b></div>' +
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
      html += '<div class="empty-note" style="padding:0 0 8px;">「不可交易」版本的發條機率跟一般版完全一樣，這裡只列一般版。' +
        '遊戲強化頁只會顯示商店或名品館買得到的發條。</div>';
      realWinders.forEach(function (w) {
        var gradeName = function (g) { return g === 0 ? "尚未強化過" : (ENCHANT_GRADES[g - 1] || ("更高階#" + g)); };
        var maxGrade = (w.grades || []).reduce(function (m, r) { return Math.max(m, r[1]); }, 0);
        var costByGrade = {};
        (w.costs || []).forEach(function (c) { costByGrade[c[0]] = c[1]; });
        html += '<div class="equip-box"><div class="row1"><span class="slot">' + escapeHtml(w.name) + '</span>' +
          '<span style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<span class="badge">最高 ' + escapeHtml(ENCHANT_GRADES[maxGrade - 1] || String(maxGrade)) + '</span>' +
          (w.keepsPrevious ? '<span class="badge tag-harvest" title="洗完不會直接套用，可以在「新的」跟「上一組」之間選一組留下">可保留上一組</span>' : '') +
          '</span></div>';
        // 依「目前階級」分組：每一組列出升級機率，以及這個階級每次上發條要花的金幣
        var byFrom = {};
        (w.grades || []).forEach(function (row) { (byFrom[row[0]] = byFrom[row[0]] || []).push(row); });
        html += '<div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr>' +
          '<th>目前階級</th><th>洗完</th><th>機率</th><th>每次金幣</th></tr></thead><tbody>';
        Object.keys(byFrom).map(Number).sort(function (a, b) { return a - b; }).forEach(function (from) {
          var rows = byFrom[from];
          var total = rows.reduce(function (s, r) { return s + r[2]; }, 0) || 1;
          var cost = costByGrade[from];
          rows.forEach(function (row, i) {
            // 已由玩家實測驗證修正：表格裡的原始數字 0 代表「還沒強化過」，1~5 才對應 N~SG（要 -1 才是陣列索引）
            var up = row[1] > row[0];
            html += '<tr>' +
              '<td>' + (i === 0 ? escapeHtml(gradeName(from)) : '') + '</td>' +
              '<td>' + escapeHtml(gradeName(row[1])) + (up && from !== 0 ? ' <span class="group-tag">升階</span>' : '') + '</td>' +
              '<td><span class="rate' + (up ? '' : ' low') + '">' + (row[2] / total * 100).toFixed(2).replace(/\.?0+$/, "") + '%</span></td>' +
              '<td>' + (i === 0 ? (cost === undefined ? '－' : cost ? fmtNum(cost) : '不用金幣') : '') + '</td>' +
              '</tr>';
          });
        });
        html += '</tbody></table></div></div>';
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
              var label = enchantValueText(a.kind, r.min, r.max, r.unit);
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

  // 「這個物品是哪幾封書信要附的材料」：LETTER_SOURCE 是 書信→來源 的索引，這裡反過來建一份，用到時才算一次
  var letterMaterialIndex = null;
  function itemLetterMaterialUses(iid) {
    if (!letterMaterialIndex) {
      letterMaterialIndex = {};
      Object.keys(LETTER_SOURCE).forEach(function (letterId) {
        (LETTER_SOURCE[letterId] || []).forEach(function (ls) {
          if (!ls.itemId) return;
          var list = letterMaterialIndex[String(ls.itemId)] || (letterMaterialIndex[String(ls.itemId)] = []);
          if (!list.some(function (x) { return x.letterId === letterId; })) {
            list.push({ letterId: letterId, letterName: ITEMS[letterId] ? ITEMS[letterId].name : ("書信#" + letterId), count: ls.count || 1 });
          }
        });
      });
    }
    return letterMaterialIndex[String(iid)] || [];
  }
  // 藍圖任務「要精煉的道具」：buildQuestReferences 沒有收這個欄位，另外建一份 物品→任務 的對照
  var MISSIONS_REFINE_ITEMS = (function () {
    var out = {};
    Object.keys(MISSIONS).forEach(function (mid) {
      var m = MISSIONS[mid];
      if (m.refineItem == null) return;
      (out[String(m.refineItem)] || (out[String(m.refineItem)] = [])).push({ id: mid, m: m, role: "refine" });
    });
    return out;
  })();
  var MISSION_ROLE_LABEL = { cost: "交換材料", gives: "任務給的材料", refine: "要精煉的道具", token: "R代幣" };
  // 鑰匙 → 可以開的寶箱
  var BOX_KEY_TO_BOXES = (function () {
    var out = {};
    Object.keys(BOX_BY_ID).forEach(function (bid) {
      var k = BOX_BY_ID[bid].keyId;
      if (k == null) return;
      (out[String(k)] || (out[String(k)] = [])).push(bid);
    });
    return out;
  })();

  // ---------- 精煉（+1~+12）加成表 ----------
  // 規則照遊戲：
  //   攻／魔／防 = refineGain × REFINE_MULT[+N]（遊戲 _d()，倍率不是線性的，高階跳比較多）
  //   增傷／減傷％ = 只有本來就有這項能力的裝備才會加，而且 +4 以後才開始（遊戲 bd()）：
  //     武器、盾的「增加傷害」每級 +1%（+4 給 1%，一路到 +12 給 9%）
  //     其他部位的增傷、以及所有部位的「減少傷害」只在 +4／+7／+10 各跳一階（1%／2%／3%）
  var REFINE_MULT = [0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 26, 30];
  var REFINE_PCT_STEP = [0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];      // 武器／盾的增傷
  var REFINE_PCT_TIER = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3];      // 其他部位的增傷、所有減傷
  var REFINE_MAX = 12;
  function refineDmgBonus(eq, lv) {
    var weaponLike = eq.slot === "weapon" || eq.slot === "shield";
    return {
      dealt: eq.dmgDealtPct > 0 ? (weaponLike ? REFINE_PCT_STEP : REFINE_PCT_TIER)[lv] : 0,
      taken: eq.dmgTakenPct > 0 ? REFINE_PCT_TIER[lv] : 0,
    };
  }
  function refineTableHtml(eq) {
    if (eq.noUpgrade) return "";
    var gain = eq.refineGain || {};
    var cols = [
      { key: "atk", label: "攻擊" },
      { key: "def", label: "防禦" },
      { key: "magic", label: "魔法" },
    ].filter(function (c) { return gain[c.key]; });
    var hasDealt = eq.dmgDealtPct > 0, hasTaken = eq.dmgTakenPct > 0;
    if (!cols.length && !hasDealt && !hasTaken) return "";

    // 平常收起來，點標題才展開清單（<details> 原生支援鍵盤操作）
    var html = '<details class="fold-section"><summary class="section-title">精煉加成（+1 ~ +' + REFINE_MAX + '）' +
      '<span class="fold-hint">點擊展開</span></summary>';
    html += '<div class="empty-note" style="padding:0 0 8px;">每一列是精煉到那一級時，這件裝備「總共」會多出來的數值（不是每級各加多少）。' +
      (hasDealt || hasTaken ? '增傷／減傷要精煉到 +4 才會開始給，後面幾級才再跳一階——這就是為什麼某幾個強化值特別划算。' : '') + '</div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr><th>精煉</th>' +
      cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') +
      (hasDealt ? '<th>增加傷害</th>' : '') + (hasTaken ? '<th>減少傷害</th>' : '') +
      '</tr></thead><tbody>';
    for (var lv = 1; lv <= REFINE_MAX; lv++) {
      var pct = refineDmgBonus(eq, lv), prev = refineDmgBonus(eq, lv - 1);
      // 增傷／減傷跳階的那幾級標出來，一眼看得到「精煉到這裡才會多給」
      var stepUp = pct.dealt !== prev.dealt || pct.taken !== prev.taken;
      html += '<tr' + (stepUp ? ' class="refine-step"' : '') + '>' +
        '<td>+' + lv + (stepUp ? ' <span class="group-tag">跳階</span>' : '') + '</td>' +
        cols.map(function (c) {
          return '<td><span class="rate">+' + Math.floor(gain[c.key] * REFINE_MULT[lv]) + '</span></td>';
        }).join('') +
        (hasDealt ? '<td>' + (pct.dealt ? '<span class="rate">+' + pct.dealt + '%</span>' : '<span class="rate low">－</span>') + '</td>' : '') +
        (hasTaken ? '<td>' + (pct.taken ? '<span class="rate">+' + pct.taken + '%</span>' : '<span class="rate low">－</span>') + '</td>' : '') +
        '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' +
      '這些是精煉本身給的，要再加上上面那塊的基礎能力才是實際數值。' +
      (hasDealt && (eq.slot === "weapon" || eq.slot === "shield")
        ? '武器和盾的增加傷害每一級都會漲，其他部位只在 +4／+7／+10 漲。' : '') + '</div>';
    html += '</details>';
    return html;
  }

  function windSlotNames() {
    return WIND_SLOTS.map(function (s) { return EQUIP_SLOTS[s] || SLOT_LABEL_FALLBACK[s] || s; }).join("、");
  }

  function showItem(id) {
    id = String(id);
    var item = ITEMS[id];
    if (!item) return;
    if (!peekMode) {
      markActive("item", id);
      currentDetail = { type: "item", id: id };
    }

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
    // 其他「賣掉／丟掉會後悔」的用途：書信本身、交書信要附的材料、藍圖任務要交出或精煉的道具、寶箱鑰匙。
    // 這幾種原本沒有標示，但一樣是拿去換獎勵、開箱用的，丟了就要重新收集。
    var letterSubmit = LETTER_SOURCE[id] || [];
    var letterMatUses = itemLetterMaterialUses(id);
    var missionItemUses = buildQuestReferences(id).missions.filter(function (r) {
      return r.role === "cost" || r.role === "gives" || r.role === "token";
    });
    if (MISSIONS_REFINE_ITEMS[id]) missionItemUses = missionItemUses.concat(MISSIONS_REFINE_ITEMS[id]);
    var keyForBoxes = BOX_KEY_TO_BOXES[id] || [];
    var special = questUses.length || petEvolveUses.length || letterSubmit.length || letterMatUses.length ||
      missionItemUses.length || keyForBoxes.length;
    if (special || killSourceText) {
      html += '<div style="background:rgba(201,162,75,.12);border:1px solid var(--gold);border-radius:4px;padding:12px 14px;margin-bottom:18px;">';
      if (special) {
        html += '<div style="color:var(--gold-hi);font-weight:700;font-size:14px;margin-bottom:6px;">⚠️ 這是特殊用途道具，不要隨便賣掉／丟掉</div>';
      }
      // killSourceText 對書信已經會寫出「打倒誰掉落、交給誰、換到什麼」，重複寫一次只是多佔一行
      if (letterSubmit.length && !killSourceText) {
        var lr = letterSubmit[0];
        html += '<div style="font-size:13px;color:var(--text);margin-bottom:4px;">書信任務道具，交給 <b>' + escapeHtml(lr.npcName || "NPC") + '</b>' +
          (lr.places && lr.places.length ? '（' + escapeHtml(lr.places.join("／")) + '）' : '') +
          '：每封給' + (lr.fame ? ' 名聲+' + fmtNum(lr.fame) : '') + (lr.gold ? ' ' + fmtNum(lr.gold) + '金' : '') +
          (lr.itemId ? '，要一起交 ' + itemChip(lr.itemId, lr.count) : '') + '</div>';
      }
      if (letterMatUses.length) {
        html += '<div style="font-size:13px;color:var(--text);margin-bottom:4px;">交書信時要一起交出的材料，用於：' +
          letterMatUses.map(function (u) {
            return '<span class="name-link" data-goto-item="' + u.letterId + '">' + escapeHtml(u.letterName) + '</span> ×' + u.count;
          }).join('、') + '</div>';
      }
      if (missionItemUses.length) {
        html += '<div style="font-size:13px;color:var(--text);margin-bottom:4px;">藍圖任務道具，用於：' +
          missionItemUses.map(function (r) {
            var label = 'Lv' + r.m.unlockLevel + ' ' + (MISSION_ROLE_LABEL[r.role] || "");
            return '<span class="name-link" data-mission-detail="' + r.id + '">' + escapeHtml(label) + '</span>';
          }).join('、') + '</div>';
      }
      if (keyForBoxes.length) {
        html += '<div style="font-size:13px;color:var(--text);margin-bottom:4px;">寶箱鑰匙，可以打開 ' + keyForBoxes.length + ' 種寶箱：' +
          keyForBoxes.map(function (bid) { return '<span class="name-link" data-open-box="' + bid + '">' + escapeHtml(BOX_BY_ID[bid].name) + '</span>'; }).join('、') +
          '</div>';
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
      // 兩件事不要搞混：noUpgrade 擋的是「精煉」（遊戲 refineStack()）；
      // 能不能洗發條看的是部位（遊戲 enhance() 檢查 windSlots），跟 noUpgrade 無關。
      var notes = [];
      if (eq.noUpgrade) notes.push('⚠️ 這件裝備不能精煉（+1、+2…）。');
      notes.push(WIND_SLOTS.indexOf(eq.slot) === -1
        ? '⚠️ 這個部位不能洗發條：發條強化只能用在 ' + windSlotNames() + '，其他部位在強化面板會顯示「這個部位不能洗發條」，沒有按鈕。'
        : '✅ 這個部位可以洗發條（要先裝備起來，強化面板只列身上穿的裝備）。');
      html += '<div class="empty-note" style="padding:6px 0 0;">' + notes.map(escapeHtml).join('<br>') + '</div>';
      html += refineTableHtml(eq);
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
        '<div>金幣<br><b>' + bigNumHtml(forgeBook.gold) + '</b></div>' +
        '<div>經驗<br><b>' + bigNumHtml(forgeBook.exp) + '</b></div>' +
        '</div></div>';
      html += '<div class="section-title" style="margin-top:14px;">所需材料</div>';
      html += '<div class="map-chip-row">';
      forgeBook.mats.forEach(function (m) { html += itemChip(m[0], m[1]); });
      html += '</div>';
      html += '<div class="section-title" style="margin-top:14px;">可能製作出' +
        (forgeBook.chances ? ' <span class="count">（鍛造成功後抽出各成品的機率）</span>' : '') + '</div>';
      html += '<div class="map-chip-row">';
      forgeBook.products.forEach(function (pid) { html += itemChip(pid, null, forgeChanceHtml(forgeBook, pid)); });
      html += '</div>';
    }

    var forgeProducts = (FORGE_BY_PRODUCT[id] || []).slice();
    if (forgeProducts.length) {
      var showForgeChance = forgeProducts.some(function (p) { return forgeProductChance(FORGE_BY_BOOK[p.book], p.baseProduct || id) != null; });
      html += '<div class="section-title">可透過鍛造取得 <span class="count">(' + forgeProducts.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>鍛造書</th><th>成功率</th>' + (showForgeChance ? '<th>成品機率</th>' : '') + '<th>需求</th></tr></thead><tbody>';
      forgeProducts.forEach(function (p) {
        var variantNote = p.viaVariant
          ? '<br><span class="rate low">' + (FORGE_VARIANT_LABEL[p.viaVariant] || "特殊版本") + '（抽到基礎款後再有 3% 機率）</span>'
          : '';
        // 變異版本顯示的是「抽到基礎款」的機率，實際拿到變異版還要再乘上 3%
        var chanceCell = '';
        if (showForgeChance) {
          var chanceHtml = forgeChanceHtml(FORGE_BY_BOOK[p.book], p.baseProduct || id);
          chanceCell = '<td>' + (chanceHtml ? (p.viaVariant ? '<span class="rate low">基礎款 </span>' : '') + chanceHtml : '<span class="rate low">-</span>') + '</td>';
        }
        html += itemLinkRow(p.book, '<td><span class="rate">' + p.rate + '%</span></td>' + chanceCell + '<td>Lv' + p.charLv + '・力量 ' + p.strMin + variantNote + '</td>');
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
        (cookRecipe.heal ? '<div>回復 HP<br><b>' + bigNumHtml(cookRecipe.heal) + '</b></div>' : '') +
        (cookRecipe.healAp ? '<div>回復 AP<br><b>' + bigNumHtml(cookRecipe.healAp) + '</b></div>' : '') +
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
        '<div>金幣<br><b>' + bigNumHtml(alchemyBook.gold) + '</b></div>' +
        '<div>經驗<br><b>' + bigNumHtml(alchemyBook.exp) + '</b></div>' +
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
          '<div>傷害<br><b>' + bigNumHtml(bomb.damage) + '</b></div>' +
          '<div>單價<br><b>' + bigNumHtml(bomb.price) + '</b></div>' +
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
      if (box.dungeons || box.dungeonGuess) html += '<div style="margin-bottom:10px;">' + boxSourceBadges(box) + '</div>';
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

    var boxesUsingAsKey = BOX_KEY_TO_BOXES[id] || [];
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

    html += '<div class="section-title">會掉落此物品的怪物 <span class="count">(' + dropMonsterCount(id) + ')</span></div>';

    if (!drops.length) {
      html += '<div class="empty-note">目前資料中沒有任何怪物掉落這個物品（可能來自商店、任務、製作或活動）。</div>';
    } else {
      html += dropCalcBar();
      var showAdj = dropCalcState.level != null;
      // 同一隻怪可能在好幾組都有這件物品，合併成一列（機率相加，遊戲 El() 也是這樣算）
      var dropRows = [], seenMon = {};
      drops.forEach(function (d) {
        var mon = MONSTERS[String(d.m)];
        if (!mon || seenMon[d.m]) return;
        seenMon[d.m] = true;
        var base = monsterDropChances(mon, 1)[id];
        if (!base) return;
        var adj = showAdj ? monsterDropChances(mon, playerDropMultiplier(mon))[id] : null;
        dropRows.push({ m: d.m, mon: mon, base: base, adj: adj });
      });
      dropRows.sort(function (a, b) { return b.base.p - a.base.p; });
      html += '<table class="dtable"><thead><tr>' +
        '<th>怪物</th><th>出現地圖</th><th>掉落機率</th>' + (showAdj ? '<th>換算後機率</th>' : '') + '</tr></thead><tbody>';
      dropRows.forEach(function (row) {
        var mon = row.mon;
        var maps = mon.maps.map(mapName).join("、");
        var adjCell = "";
        if (showAdj) {
          var ratio = row.base.p > 0 ? row.adj.p / row.base.p : 1;
          adjCell = '<td><span class="' + rateClassP(row.adj.p) + '">' + pctP(row.adj.p) + '</span>' +
            (ratio < 0.9995 ? '<span style="color:var(--text-faint);font-size:11px;margin-left:4px;">(×' + (ratio * 100).toFixed(1) + '%)</span>' : '') + '</td>';
        }
        html += '<tr class="clickable" data-goto-monster="' + row.m + '">' +
          '<td><span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link">' + escapeHtml(mon.name) + (mon.atk === 0 ? ' <span style="color:var(--text-faint);font-size:11px;">（攻0）</span>' : '') + '</span></td>' +
          '<td>' + escapeHtml(maps || "-") + '</td>' +
          '<td><span class="' + rateClassP(row.base.p) + '" title="資料原始值 ' + pct(row.base.raw) + '（未換算）">' + pctP(row.base.p) + '</span>' + dropGroupTags(row.base.groups) + '</td>' +
          adjCell +
          '</tr>';
      });
      html += '</tbody></table>';
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + escapeHtml(DROP_FORMULA_NOTE) +
        (showAdj ? (dropCalcState.blacksmith ? "換算後機率：鐵匠／匠師不受等級差衰減（二轉爆破士會失去這個效果）。" : "換算後機率：依你輸入的 Lv" + dropCalcState.level + " 套用等級差衰減。") : "") + '</div>';
    }

    detailTarget().innerHTML = html;
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
    if (!peekMode) {
      markActive("monster", id);
      currentDetail = { type: "monster", id: id };
    }

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
      (dropCalcState.level != null ? statTile("換算後經驗", monsterExpAt(mon, dropCalcState.level)) : "") +
      statTile("感應範圍", mon.aggroRange) + statTile("移動速度", mon.moveSpeed) +
      statTile("重生秒數", mon.respawnSec) +
      '</div>';
    if (dropCalcState.level != null) {
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin:-14px 0 18px;">換算後經驗：以你輸入的 Lv' + dropCalcState.level +
        '，等級差 ' + (dropCalcState.level - mon.lv) + ' 級 → ×' + (dropLevelMultiplier(dropCalcState.level, mon.lv) * 100).toFixed(0) +
        '%（跟掉落率同一張衰減表，鐵匠也會衰減）；未含裝備的經驗加成。</div>';
    }

    // 變身／召喚：自己會變成什麼、以及是由誰變身／召喚出來的
    var originHtml = monsterOriginsHtml(id);
    if (monsterReactions(id).length || originHtml) {
      html += '<div class="section-title">變身與召喚</div>';
      if (originHtml) html += '<div style="margin:0 0 8px;line-height:1.9;font-size:13px;">' + originHtml + '</div>';
      html += reactionListHtml(id);
      if (monsterNeverKilled(id)) {
        html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">這隻怪物血量降低時一定會變身（一擊打到 0 也一樣），不會被擊倒，所以下面的掉落表實際上拿不到，要看變身後的型態。</div>';
      }
    }

    // 變身／召喚出來的型態自己沒有出生點（maps 是空的），要看牠是從哪隻怪變來的，就跟那隻同一張地圖。
    // 例如「雪之女王」有兩隻同名不同編號：一隻由冰城的雨滴兒變身、一隻由冰峰的小不點雨滴變身。
    var mapIds = mon.maps.slice(), mapNote = "";
    if (!mapIds.length) {
      var originMaps = [], originNames = [];
      monsterOrigins(id).forEach(function (f) {
        var src = MONSTERS[f.oid];
        if (originNames.indexOf(src.name) === -1) originNames.push(src.name);
        (src.maps || []).forEach(function (mid) { if (mapIds.indexOf(mid) === -1 && originMaps.indexOf(mid) === -1) originMaps.push(mid); });
      });
      mapIds = originMaps;
      if (originNames.length) {
        mapNote = '這隻自己沒有出生點，是由 ' + escapeHtml(originNames.join("、")) + ' 變身／召喚出來的，' +
          (mapIds.length ? '所以出現在牠的地圖。' : '而來源怪物也沒有出生點，請往上一層看。');
      }
    }
    html += '<div class="section-title">出現地圖 <span class="count">(' + mapIds.length + ')</span></div>';
    html += '<div class="map-chip-row">' + mapIds.map(function (mid) {
      return '<span class="map-chip" style="cursor:default;">' + escapeHtml(mapName(mid)) + '</span>';
    }).join("") + '</div>';
    if (mapNote) html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + mapNote + '</div>';

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
      html += '<table class="dtable"><thead><tr><th>副本</th><th>區域</th><th>身分</th></tr></thead><tbody>';
      dungeonRefs.forEach(function (r) {
        html += '<tr><td><span class="name-link" data-open-dungeon="' + r.dungeonId + '">' + escapeHtml(r.dungeonName) + '</span></td>' +
          '<td>' + escapeHtml(r.island || "-") + '</td>' +
          '<td>' + (r.isBoss ? '<span class="badge">首領</span>' : r.role ? '<span class="badge">' + escapeHtml(r.role) + '</span>' : "一般怪物") + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    var baseChances = monsterDropChances(mon, 1);
    var dropIds = Object.keys(baseChances).sort(function (a, b) { return baseChances[b].p - baseChances[a].p; });
    html += '<div class="section-title">掉落物品 <span class="count">(' + dropIds.length + ')</span></div>';

    if (!dropIds.length) {
      html += '<div class="empty-note">這隻怪物目前沒有紀錄任何掉落物。</div>';
    } else {
      html += dropCalcBar();
      var showAdj = dropCalcState.level != null;
      var levelMult = playerDropMultiplier(mon);
      var adjChances = showAdj ? monsterDropChances(mon, levelMult) : null;
      html += '<table class="dtable"><thead><tr><th>物品</th><th>掉落機率</th>' + (showAdj ? '<th>換算後機率</th>' : '') + '</tr></thead><tbody>';
      dropIds.forEach(function (iid) {
        var it = ITEMS[String(iid)];
        var name = it ? it.name : ("物品#" + iid);
        var base = baseChances[iid];
        var adjCell = "";
        if (showAdj) {
          adjCell = '<td><span class="' + rateClassP(adjChances[iid].p) + '">' + pctP(adjChances[iid].p) + '</span></td>';
        }
        html += '<tr class="clickable" data-goto-item="' + iid + '">' +
          '<td><span class="name-link">' + escapeHtml(name) + '</span></td>' +
          '<td><span class="' + rateClassP(base.p) + '" title="資料原始值 ' + pct(base.raw) + '（未換算）">' + pctP(base.p) + '</span>' + dropGroupTags(base.groups) + '</td>' +
          adjCell +
          '</tr>';
      });
      html += '</tbody></table>';
      var noteParts = [DROP_FORMULA_NOTE];
      if (mon.atk === 0) noteParts.push("這隻怪物攻擊力為 0，每次擊殺有 " + (DROP_WHIFF_CHANCE * 100).toFixed(1) + "% 機率整批掉落全部落空（已算進上面的機率）。");
      if (showAdj) {
        noteParts.push(dropCalcState.blacksmith
          ? "換算後機率：鐵匠／匠師不受等級差衰減影響（二轉爆破士會失去這個效果）。"
          : "換算後機率：等級差 " + (dropCalcState.level - mon.lv) + " 級 → 掉落倍率 ×" + (levelMult * 100).toFixed(0) + "%。");
      }
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + escapeHtml(noteParts.join("")) + '</div>';
    }

    detailTarget().innerHTML = html;
    wireDropCalcBar(function () { showMonster(id); });
  }

  // 每隻怪給的經驗：遊戲 expPerKill() = max(1, round(exp × 等級差倍率 × (1 + 裝備經驗加成%)))，
  // 等級差倍率跟掉落用的是同一張表（x_()），而且鐵匠沒有豁免。這裡不含裝備的經驗加成。
  function monsterExpAt(mon, playerLv) {
    return Math.max(1, Math.round(mon.exp * dropLevelMultiplier(playerLv, mon.lv)));
  }

  function statTile(label, val) {
    return '<div class="stat-tile"><div class="v">' + bigNumHtml(val) + '</div><div class="k">' + label + '</div></div>';
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
  var WIND_SLOTS = window.WIND_SLOTS || [];

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
    currentAbilityTotal = null;
    currentBrowseTotal = null;
    currentAbilityFields = [];
    currentMatches.items = [{ id: id, name: name }];
    currentMatches.monsters = [];
    renderResultList(name);
    showItem(id);
    scrollToDetail();
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
  // box.dungeons：副本怪物（含變身／召喚型態）的掉落表裡真的有這個寶箱；對不到才會有 dungeonGuess（名稱推測）
  function boxSourceBadges(box) {
    if (box.dungeons && box.dungeons.length) {
      return '<div class="badge-row">' + box.dungeons.map(function (d) {
        return '<span class="badge" data-open-dungeon="' + d.dungeonId + '" style="cursor:pointer;">來源副本：' + escapeHtml(d.dungeonName) + '</span>';
      }).join("") + '</div>';
    }
    return '<div class="badge-row"><span class="badge" data-open-dungeon="' + box.dungeonGuess.dungeonId + '" style="cursor:pointer;">來源副本（推測）：' +
      escapeHtml(box.dungeonGuess.dungeonName) + '</span></div>';
  }
  function boxSourceText(box) {
    if (box.dungeons && box.dungeons.length) return box.dungeons.map(function (d) { return d.dungeonName; }).join("、");
    return box.dungeonGuess ? box.dungeonGuess.dungeonName + "（推測）" : "";
  }

  function openBoxDetail(boxId) {
    var box = BOX_BY_ID[String(boxId)];
    if (!box) return;
    var html = '<div class="section-title">寶箱</div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + escapeHtml(box.name) + '</div>';
    if (box.dungeons || box.dungeonGuess) {
      html += '<div style="margin-bottom:10px;">' + boxSourceBadges(box) + '</div>';
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
    // 寶箱一律在快速查看視窗裡顯示（renderPeek 會開著 peekMode 呼叫進來）
    $peekBody.innerHTML = html;
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
        html += '<li class="result-item" data-open-dungeon="' + did + '">' +
          '<span class="rname">' + escapeHtml(dg.name) + '</span>' +
          '<span class="rmeta">Lv' + (dg.minLv || 0) + (dg.maxLv ? "~" + dg.maxLv : "+") + '　每日 ' + (dg.entries || 0) + ' 次・' + dungeonMonsterList(dg).length + ' 種怪物</span>' +
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
          '<span class="rmeta">' + (boxSourceText(box) ? escapeHtml(boxSourceText(box)) + "　" : "") + box.tiers.length + ' 組・共 ' + itemCount + ' 種物品</span>' +
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

  // 藍圖任務列表：用下拉選單選等級區間（每 10 級一段），下面只列那一段的任務「等級／目標／獎勵物品」，
  // 點列開彈窗看完整獎勵（經驗、金幣、名聲、代幣）
  var blueprintBand = null; // 目前選的區間起點（0、10、20…），記住上次選的，切換分頁回來還在
  function blueprintBandOf(lv) { return Math.floor(lv / 10) * 10; }
  function showBlueprintBrowser() {
    currentDetail = null;
    currentView = { kind: "questtab", id: "blueprint" };
    var ids = Object.keys(MISSIONS).sort(function (a, b) {
      return MISSIONS[a].unlockLevel - MISSIONS[b].unlockLevel || Number(a) - Number(b);
    });
    var bands = [], byBand = {};
    ids.forEach(function (id) {
      var b = blueprintBandOf(MISSIONS[id].unlockLevel);
      if (!byBand[b]) { byBand[b] = []; bands.push(b); }
      byBand[b].push(id);
    });
    // 預設：沒選過的話，挑上方「你目前的等級」所在的區間（沒有剛好的就取最接近、不超過的那段），都沒有就第一段
    if (blueprintBand == null || !byBand[blueprintBand]) {
      blueprintBand = bands[0];
      if (dropCalcState.level != null) {
        bands.forEach(function (b) { if (b <= dropCalcState.level) blueprintBand = b; });
      }
    }

    var html = backButtonHtml() + questTabsHtml("blueprint");
    html += '<h2 style="margin-top:0;">🗺️ 藍圖任務 <span class="count">(' + ids.length + ')</span></h2>';
    if (!ids.length) {
      html += '<div class="empty-note">目前沒有藍圖任務資料。</div>';
      $detail.innerHTML = html;
      return;
    }
    html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">' +
      '<label for="blueprintBandSelect" style="font-size:13px;color:var(--text-dim);">任務等級</label>' +
      '<select id="blueprintBandSelect" style="padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:4px;color:var(--text);font-size:14px;">' +
      bands.map(function (b) {
        var open = byBand[b].filter(function (id) { return !MISSIONS[id].blocked; }).length;
        return '<option value="' + b + '"' + (b === blueprintBand ? ' selected' : '') + '>Lv' + b + ' ~ ' + (b + 9) +
          '（' + byBand[b].length + ' 筆' + (open < byBand[b].length ? '，' + (byBand[b].length - open) + ' 筆未開放' : '') + '）</option>';
      }).join("") +
      '</select></div>';
    html += '<div class="empty-note" style="padding:0 0 10px;">不用接取，角色等級到了就能進行（擊殺類要等級到了之後打的才算）。點任一列看完整獎勵；點怪物或物品名稱會跳出視窗查看，關掉就能繼續看任務。</div>';
    html += '<div id="blueprintTable"></div>';
    $detail.innerHTML = html;

    function renderBand() {
      var rows = byBand[blueprintBand] || [];
      var t = '<table class="dtable"><thead><tr><th style="width:64px;">等級</th><th>需要擊殺的怪物／目標</th><th>裝備／物品獎勵</th></tr></thead><tbody>';
      rows.forEach(function (id) {
        var m = MISSIONS[id];
        t += '<tr class="clickable" data-mission-detail="' + id + '"' + (m.blocked ? ' style="opacity:.55;"' : '') + '>' +
          '<td style="white-space:nowrap;">Lv' + m.unlockLevel + '</td>' +
          '<td>' + missionTargetHtml(m, false) + (m.blocked ? '<br><span style="font-size:11.5px;color:var(--text-faint);">遊戲內目前無法完成</span>' : '') + '</td>' +
          '<td>' + (m.reward ? itemChip(m.reward, m.rewardCount || 1) : '<span style="color:var(--text-faint);">－</span>') + '</td>' +
          '</tr>';
      });
      t += '</tbody></table>';
      document.getElementById("blueprintTable").innerHTML = t;
    }
    renderBand();
    document.getElementById("blueprintBandSelect").addEventListener("change", function (e) {
      blueprintBand = Number(e.target.value);
      renderBand();
    });
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
    // 跟寶箱一樣走快速查看視窗（renderPeek 會開著 peekMode 呼叫進來），才不會被疊在物品視窗底下看不到
    $peekBody.innerHTML = html;
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
        var drop = mon ? monsterDropChances(mon, 1)[letterId] : null;
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
            (r.drop ? '<br><span class="' + rateClassP(r.drop.p) + '">' + pctP(r.drop.p) + '</span>' : '')
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
    var drop = mon ? monsterDropChances(mon, 1)[q.itemId] : null;
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
        (drop ? '　掉落機率 <span class="' + rateClassP(drop.p) + '">' + pctP(drop.p) + '</span>' : '') + '<br>' +
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
      '<div>名聲<br><b>' + bigNumHtml(q.fame, "+") + '</b></div>' +
      '<div>經驗<br><b>' + bigNumHtml(q.exp, "+") + '</b></div>' +
      '<div>金幣<br><b>' + bigNumHtml(q.gold) + '</b></div>' +
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
    var dropN = dropMonsterCount(iid), shopN = (SHOP_INDEX[String(iid)] || []).length;
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
      html += '<div style="background:var(--note-bg);border:1px solid var(--note-line);border-radius:10px;padding:12px 14px;margin-bottom:18px;font-size:13px;line-height:1.7;">' +
        '<div style="color:var(--note-ink);font-weight:700;margin-bottom:4px;">💡 社群攻略補充（非本站遊戲資料查到的，僅供參考）</div>' +
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

  // 進化要準備的材料：跟在「可進化 ○○，xx%」下一行
  function petEvolveMatsHtml(mats) {
    if (!mats || !mats.length) return '<div style="font-size:12.5px;color:var(--text-dim);margin-top:6px;">需要材料：不需要材料</div>';
    return '<div style="font-size:12.5px;color:var(--text-dim);margin-top:8px;margin-bottom:6px;">需要材料：</div>' +
      '<div class="map-chip-row">' + mats.map(function (mid) { return itemChip(mid); }).join('') + '</div>';
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
          '<div style="font-size:13.5px;margin-bottom:8px;">由 <span class="name-link" data-open-pet="' + f.from + '">' +
          escapeHtml(fromPet ? fromPet.name : "#" + f.from) + '</span> 進化而來，<span class="rate">' + f.rate + '%</span></div>' +
          petEvolveMatsHtml(f.mats) +
          '</div>';
      });
    }

    if (p.evolve && p.evolve.length) {
      html += '<div class="section-title">可能進化成</div>';
      // 一組材料可能進化出好幾種結果：先一行一行列「可進化 ○○，xx%」，下面再列這組要準備的材料
      p.evolve.forEach(function (ev, idx) {
        html += '<div class="equip-box" style="margin-bottom:10px;">';
        if (p.evolve.length > 1) html += '<div class="empty-note" style="padding:0 0 6px;">材料組合 ' + (idx + 1) + '：</div>';
        var totalRate = ev.targets.reduce(function (s, t) { return s + t.rate; }, 0);
        ev.targets.forEach(function (t) {
          var toPet = PET_INFO[String(t.to)];
          html += '<div style="font-size:13.5px;margin-bottom:4px;">可進化 <span class="name-link" data-open-pet="' + t.to + '">' +
            escapeHtml(toPet ? toPet.name : "#" + t.to) + '</span>，<span class="rate">' + t.rate + '%</span></div>';
        });
        if (totalRate < 100) {
          html += '<div style="font-size:13px;color:var(--text-faint);margin-bottom:4px;">進化失敗（掉成長階段或經驗歸零），' +
            '<span class="rate low">' + (100 - totalRate) + '%</span></div>';
        }
        html += petEvolveMatsHtml(ev.mats) + '</div>';
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

  // ---------- 副本詳細頁 ----------
  // ---------- 怪物戰鬥反應（變身／召喚）----------
  // 規則對照遊戲 bundle：tickReactions()/Xg() 判斷 hp、timer 觸發；onEnemyDown() 處理 death；
  // morphOnLethal()：有「血量變身（沒有機率）」的怪，致命一擊也會改成觸發變身，所以牠永遠不會被擊倒、不會掉落。
  // death 變身則是先照常擊倒（給經驗、掉落）再變成下一個型態。
  function monsterReactions(mid) {
    var mon = MONSTERS[String(mid)];
    return (mon && mon.reactions) || [];
  }
  function monsterNeverKilled(mid) {
    return monsterReactions(mid).some(function (r) { return r.on === "hp" && r.act === "morph" && r.chance == null; });
  }
  function fmtSec(ms) {
    var s = ms / 1000;
    return s >= 60 && s % 60 === 0 ? (s / 60) + " 分鐘" : (Math.round(s * 10) / 10) + " 秒";
  }
  // 回傳一句觸發條件＋動作的說明（HTML），例如「血量降到 80% 以下時 → 變身成 生氣變大的哈比兔(中)」
  function reactionHtml(r, withTarget) {
    var cond = reactionCond(r);
    var target = MONSTERS[String(r.to)];
    var targetHtml = !withTarget ? "" : target
      ? ' <span class="name-link" data-goto-monster="' + r.to + '">' + escapeHtml(target.name) + '</span>'
      : " 無資料";
    var act;
    if (r.act === "morph") act = "變身成" + targetHtml;
    else {
      var n = r.n || 1, nMax = r.nMax || n;
      act = "召喚" + targetHtml + " ×" + (nMax > n ? n + "~" + nMax : n);
    }
    var note = "";
    if (r.act === "morph" && r.on === "hp" && r.chance == null) note = "（這個型態不會被擊倒，不會掉落）";
    else if (r.act === "morph" && r.on === "death") note = "（會先拿到這個型態的經驗與掉落）";
    return cond + " → " + act + (note ? '<span style="color:var(--text-faint);">' + note + '</span>' : "");
  }
  function reactionCond(r) {
    var cond;
    if (r.on === "hp") {
      cond = "血量降到 " + Math.round((r.at || 0) * 1000) / 10 + "% 以下時";
      if (r.times > 1) cond += "（最多 " + r.times + " 次" + (r.ms ? "，每次間隔 " + fmtSec(r.ms) : "") + "）";
      else if (r.times == null && r.act === "summon") cond += "（不限次數" + (r.ms ? "，每次間隔 " + fmtSec(r.ms) : "") + "）";
    } else if (r.on === "timer") {
      cond = "上場後每 " + fmtSec(r.ms || 0);
      cond += r.times != null ? "（最多 " + r.times + " 次）" : "";
    } else if (r.on === "death") {
      cond = "被擊倒時";
    } else if (r.on === "roll") {
      cond = "戰鬥中隨機觸發";
    } else {
      cond = escapeHtml(r.on || "");
    }
    if (r.chance != null) cond += "，機率 " + Math.round(r.chance * 1000) / 10 + "%";
    return cond;
  }
  function reactionListHtml(mid) {
    var rs = monsterReactions(mid);
    if (!rs.length) return "";
    return '<ul style="margin:0;padding-left:18px;line-height:1.9;font-size:13px;">' +
      rs.map(function (r) { return '<li>' + reactionHtml(r, true) + '</li>'; }).join("") + '</ul>';
  }

  // 副本裡不重複的怪物：[{id, role:"spawn"|"morph"|"summon", isBoss, from, rooms:[區域名稱...]}]
  // 出生點上的怪（首領排前面、依等級）後面緊接著牠變身／召喚出來的型態
  function dungeonMonsterList(dg) {
    var byId = {}, base = [], children = {};
    (dg.islands || []).forEach(function (isl) {
      var roomName = isl.name || isl.key;
      function touch(mid, role, from) {
        var e = byId[mid];
        if (!e) {
          e = byId[mid] = { id: String(mid), role: role, isBoss: false, from: from != null ? String(from) : null, rooms: [] };
          if (role === "spawn") base.push(e);
          else (children[e.from] || (children[e.from] = [])).push(e);
        }
        if (roomName && e.rooms.indexOf(roomName) === -1) e.rooms.push(roomName);
        return e;
      }
      var ids = (isl.monsters || []).slice();
      if (isl.boss != null && ids.indexOf(isl.boss) === -1) ids.push(isl.boss);
      ids.forEach(function (mid) {
        var e = touch(mid, "spawn");
        if (isl.boss === mid) e.isBoss = true;
      });
      (isl.derived || []).forEach(function (d) {
        var r = monsterReactions(d.from).filter(function (x) { return x.to === d.id; })[0];
        touch(d.id, r && r.act === "summon" ? "summon" : "morph", d.from);
      });
    });
    base.sort(function (a, b) {
      var ma = MONSTERS[a.id], mb = MONSTERS[b.id];
      return (b.isBoss - a.isBoss) || ((ma ? ma.lv : 0) - (mb ? mb.lv : 0));
    });
    var out = [], placed = {};
    function place(e) {
      if (placed[e.id]) return;
      placed[e.id] = true;
      out.push(e);
      (children[e.id] || []).forEach(place);
    }
    base.forEach(place);
    Object.keys(byId).forEach(function (k) { place(byId[k]); });
    return out;
  }

  function dungeonRoleHtml(m) {
    var html;
    if (m.role === "morph" || m.role === "summon") {
      var src = MONSTERS[m.from];
      html = '<span class="badge" title="由 ' + escapeHtml(src ? src.name : "") + (m.role === "morph" ? ' 變身' : ' 召喚') + '">' +
        (m.role === "morph" ? "變身" : "召喚") + '</span>';
    } else if (m.isBoss) {
      html = '<span class="badge" style="color:var(--gold-hi);border-color:var(--gold);">首領</span>';
    } else {
      html = '一般';
    }
    if (monsterNeverKilled(m.id)) html += ' <span class="group-tag" style="margin-left:2px;">不掉落</span>';
    return html;
  }

  function monsterNameLink(mid) {
    var mon = MONSTERS[String(mid)];
    if (!mon) return '<span class="name-link" style="cursor:default;opacity:.5;">無資料</span>';
    return '<span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link" data-goto-monster="' + mid + '">' + escapeHtml(mon.name) + '</span>';
  }

  // 同名不同編號的怪物（例如好幾隻「[Boss]貝里教徒」）在來源清單裡只列一次，取最高機率
  function dedupeSourcesByName(sources) {
    var byName = {}, out = [];
    sources.forEach(function (s) {
      var name = MONSTERS[s.mid].name;
      var e = byName[name];
      if (!e) { byName[name] = s; out.push(s); }
      else if (s.p > e.p) { out[out.indexOf(e)] = s; byName[name] = s; }
    });
    return out.sort(function (a, b) { return b.p - a.p; });
  }

  function boxTiersHtml(box) {
    var html = "";
    box.tiers.forEach(function (tier, tIdx) {
      html += '<div class="empty-note" style="padding:10px 0 4px;">開出物品（第 ' + (tIdx + 1) + ' 組，每組開出一件）</div>';
      html += '<table class="dtable"><thead><tr><th>物品</th><th>機率</th></tr></thead><tbody>';
      tier.slice().sort(function (a, b) { return b.pct - a.pct; }).forEach(function (t) {
        html += itemLinkRow(t.itemId, '<td><span class="rate' + (t.pct < 1 ? " low" : "") + '">' + t.pct + '%</span></td>');
      });
      html += '</tbody></table>';
    });
    return html;
  }

  function showDungeonDetail(dungeonId) {
    dungeonId = String(dungeonId);
    var dg = DUNGEON_BY_ID[dungeonId];
    if (!dg) return;
    if (!peekMode) currentDetail = null;
    var monsters = dungeonMonsterList(dg);

    // 掉落彙整：{物品id: {best, sources:[{mid, p, groups}]}}；怪物的掉落裡有寶箱就歸到寶箱區
    var drops = {}, dropOrder = [];
    var boxes = {}, boxOrder = [];
    monsters.forEach(function (m) {
      var mon = MONSTERS[m.id];
      if (!mon || monsterNeverKilled(m.id)) return;
      var chances = monsterDropChances(mon, 1);
      Object.keys(chances).forEach(function (iid) {
        var c = chances[iid];
        var d = drops[iid];
        if (!d) { d = drops[iid] = { id: iid, best: 0, sources: [] }; dropOrder.push(d); }
        d.sources.push({ mid: m.id, p: c.p, groups: c.groups });
        if (c.p > d.best) d.best = c.p;
        if (BOX_BY_ID[iid]) {
          if (!boxes[iid]) { boxes[iid] = { id: iid, guess: false, sources: [] }; boxOrder.push(boxes[iid]); }
          boxes[iid].sources.push({ mid: m.id, p: c.p });
        }
      });
    });
    // 名稱比對猜出來的寶箱（怪物掉落表裡找不到的才補上，標成推測）
    (DUNGEON_TO_BOXES[dungeonId] || []).forEach(function (b) {
      var bid = String(b.boxId);
      if (!boxes[bid] && BOX_BY_ID[bid]) { boxes[bid] = { id: bid, guess: true, sources: [] }; boxOrder.push(boxes[bid]); }
    });
    dropOrder.sort(function (a, b) { return (!!BOX_BY_ID[b.id] - !!BOX_BY_ID[a.id]) || (b.best - a.best); });
    dropOrder.forEach(function (d) { d.sources = dedupeSourcesByName(d.sources); });
    boxOrder.forEach(function (bx) { bx.sources = dedupeSourcesByName(bx.sources); });

    var html = backButtonHtml();
    if (!peekMode) html += '<div class="section-title"><span class="name-link" id="dungeonBackToList" style="cursor:pointer;">← 副本列表</span></div>';
    html += '<div class="detail-head"><div>' +
      '<div class="detail-title">' + escapeHtml(dg.name) + '</div>' +
      '<div class="detail-sub">副本編號 #' + dungeonId + '</div>' +
      '<div class="badge-row">' +
      (dg.group ? '<span class="badge">' + escapeHtml(dg.group) + '系列</span>' : '') +
      (dg.difficulty ? '<span class="badge">' + escapeHtml(dg.difficulty) + '</span>' : '') +
      '</div></div></div>';

    html += '<div class="stat-grid">' +
      '<div class="stat-tile"><div class="v">Lv' + (dg.minLv || 0) + (dg.maxLv ? '~' + dg.maxLv : '+') + '</div><div class="k">等級限制</div></div>' +
      '<div class="stat-tile"><div class="v">' + (dg.entries || 0) + ' 次</div><div class="k">每日進場</div></div>' +
      statTile("怪物種類", monsters.length) + statTile("掉落物品", dropOrder.length) + statTile("寶箱", boxOrder.length) +
      '</div>';
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin:-14px 0 18px;">等級限制：角色等級需在 ' + (dg.minLv || 0) +
      (dg.maxLv ? ' ~ ' + dg.maxLv + ' 之間' : ' 以上') + '才能進入；每日進場次數每天重置。</div>';

    // 寶箱
    if (boxOrder.length) {
      html += '<div class="section-title">寶箱 <span class="count">(' + boxOrder.length + ')</span></div>';
      boxOrder.forEach(function (bx) {
        var box = BOX_BY_ID[bx.id];
        var srcText = bx.guess ? '<span class="group-tag" title="遊戲資料裡目前沒有任何怪物會掉這個寶箱，只能照名稱推測屬於這個副本">推測・目前沒有怪物會掉</span>' :
          bx.sources.map(function (s) {
            return escapeHtml(MONSTERS[s.mid].name) + ' <span class="' + rateClassP(s.p) + '">' + pctP(s.p) + '</span>';
          }).join('、');
        html += '<details class="equip-box" style="padding:10px 14px;margin-bottom:10px;">' +
          '<summary style="cursor:pointer;"><span class="slot" style="color:var(--gold-hi);font-weight:700;">' + escapeHtml(box.name) + '</span>' +
          '<span style="font-size:12px;color:var(--text-faint);margin-left:8px;">' + srcText + '</span></summary>' +
          '<div style="margin-top:10px;"><div class="empty-note" style="padding:0 0 6px;">開啟需要的鑰匙：</div>' +
          '<div class="map-chip-row">' + (box.keyId ? itemChip(box.keyId) : '<span class="map-chip" style="cursor:default;">不需要</span>') + '</div>' +
          boxTiersHtml(box) + '</div></details>';
      });
    }

    // 怪物與能力
    html += '<div class="section-title">怪物與能力 <span class="count">(' + monsters.length + ')</span></div>';
    if (!monsters.length) {
      html += '<div class="empty-note">這個副本目前沒有怪物資料。</div>';
    } else {
      var multiRoom = (dg.islands || []).length > 1;
      html += '<div class="swipe-hint">↔ 表格可以左右滑動，看 HP、攻擊等完整能力</div>';
      html += '<div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr><th>怪物</th><th>身分</th><th>屬性</th><th>HP</th><th>攻擊</th><th>防禦</th>' +
        '<th>命中</th><th>迴避</th><th>必殺</th><th>抗爆</th><th>經驗</th><th>主動</th>' + (multiRoom ? '<th>出現區域</th>' : '') + '</tr></thead><tbody>';
      monsters.forEach(function (m) {
        var mon = MONSTERS[m.id];
        if (!mon) {
          html += '<tr><td>' + monsterNameLink(m.id) + '</td><td colspan="' + (multiRoom ? 12 : 11) + '"><span class="rate low">無資料</span></td></tr>';
          return;
        }
        html += '<tr class="clickable" data-goto-monster="' + m.id + '">' +
          '<td>' + monsterNameLink(m.id) + '</td>' +
          '<td>' + dungeonRoleHtml(m) + '</td>' +
          '<td><span class="el-chip" style="color:var(--' + (ELEMENT_CLASS[mon.element] || "el-none") + ')">' + (ELEMENT_LABEL[mon.element] || mon.element) + '</span></td>' +
          '<td>' + bigNumHtml(mon.hp) + '</td><td>' + bigNumHtml(mon.atk) + '</td><td>' + bigNumHtml(mon.def) + '</td>' +
          '<td>' + bigNumHtml(mon.hit) + '</td><td>' + bigNumHtml(mon.eva) + '</td><td>' + bigNumHtml(mon.crit) + '</td>' +
          '<td>' + bigNumHtml(mon.critRes) + '</td><td>' + bigNumHtml(mon.exp) + '</td>' +
          '<td>' + (mon.aggressive ? '是' : '否') + '</td>' +
          (multiRoom ? '<td style="white-space:normal;min-width:140px;">' + escapeHtml(m.rooms.join('、')) + '</td>' : '') +
          '</tr>';
      });
      html += '</tbody></table></div>';
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">點怪物可以看完整能力、五行寶石建議，以及依你的等級換算後的掉落率／經驗。' +
        '「變身」「召喚」是戰鬥中才會出現的型態，出生點上看不到。</div>';
    }

    // 變身與召喚條件
    var reacting = monsters.filter(function (m) { return monsterReactions(m.id).length; });
    if (reacting.length) {
      html += '<div class="section-title">變身與召喚條件 <span class="count">(' + reacting.length + ')</span></div>';
      reacting.forEach(function (m) {
        html += '<div class="equip-box" style="padding:10px 14px;margin-bottom:8px;">' +
          '<div style="margin-bottom:4px;">' + monsterNameLink(m.id) + ' ' + dungeonRoleHtml(m) + '</div>' +
          reactionListHtml(m.id) + '</div>';
      });
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">血量變身時會保留當下的血量比例；' +
        '血量變身的型態就算被一擊打到 0 也會先變身，所以不會掉落，下面的掉落表已經排除這些型態。</div>';
    }

    // 區域配置（多房間的副本才列）
    var rooms = dg.islands || [];
    if (rooms.length > 1) {
      // 同名的區域（例如好幾個「第五層」「入口」）合併成一筆，怪物／道具取聯集
      var byName = {}, shown = [], emptyCount = 0;
      function addUnique(arr, v) { if (v != null && arr.indexOf(v) === -1) arr.push(v); }
      rooms.forEach(function (isl) {
        var hasContent = (isl.monsters || []).length || isl.boss != null || (isl.drops || []).length || (isl.needItems || []).length;
        if (!hasContent) { emptyCount++; return; }
        var name = isl.name || isl.key;
        var r = byName[name];
        if (!r) { r = byName[name] = { name: name, bosses: [], monsters: [], drops: [], needItems: [] }; shown.push(r); }
        addUnique(r.bosses, isl.boss);
        (isl.monsters || []).forEach(function (mid) { addUnique(r.monsters, mid); });
        (isl.drops || []).forEach(function (iid) { addUnique(r.drops, iid); });
        (isl.needItems || []).forEach(function (iid) { addUnique(r.needItems, iid); });
      });
      html += '<div class="section-title">區域配置 <span class="count">(' + shown.length + ')</span></div>';
      shown.forEach(function (isl) {
        var others = isl.monsters.filter(function (mid) { return isl.bosses.indexOf(mid) === -1; });
        var bossNames = isl.bosses.map(function (b) { return MONSTERS[String(b)] ? MONSTERS[String(b)].name : "無資料"; });
        html += '<details class="equip-box" style="padding:10px 14px;margin-bottom:8px;">' +
          '<summary style="cursor:pointer;"><span style="font-weight:700;">' + escapeHtml(isl.name) + '</span>' +
          '<span style="font-size:12px;color:var(--text-faint);margin-left:8px;">' +
          (bossNames.length ? '首領：' + escapeHtml(bossNames.join('、')) + '　' : '') + (others.length ? others.length + ' 種怪物' : '') + '</span></summary>' +
          '<div style="margin-top:10px;">';
        if (isl.bosses.length) {
          html += '<div class="empty-note" style="padding:0 0 6px;">首領：</div><div class="map-chip-row" style="margin-bottom:8px;">' +
            isl.bosses.map(function (b, i) {
              return '<span class="map-chip" data-goto-monster="' + b + '">' + escapeHtml(bossNames[i]) + '</span>';
            }).join("") + '</div>';
        }
        if (others.length) {
          html += '<div class="empty-note" style="padding:0 0 6px;">怪物：</div><div class="map-chip-row" style="margin-bottom:8px;">' +
            others.map(function (mid) {
              var mon = MONSTERS[String(mid)];
              return '<span class="map-chip" data-goto-monster="' + mid + '">' + escapeHtml(mon ? mon.name : "無資料") + '</span>';
            }).join("") + '</div>';
        }
        if ((isl.drops || []).length) {
          html += '<div class="empty-note" style="padding:0 0 6px;">這個區域會取得：</div><div class="map-chip-row" style="margin-bottom:8px;">' +
            isl.drops.map(function (iid) { return itemChip(iid); }).join("") + '</div>';
        }
        if ((isl.needItems || []).length) {
          html += '<div class="empty-note" style="padding:0 0 6px;">前往下一個區域需要：</div><div class="map-chip-row">' +
            isl.needItems.map(function (iid) { return itemChip(iid); }).join("") + '</div>';
        }
        html += '</div></details>';
      });
      if (emptyCount) html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">另有 ' + emptyCount + ' 個沒有怪物的區域（入口、通道等）未列出。</div>';
    }

    // 掉落總表
    html += '<div class="section-title">掉落物品總表 <span class="count">(' + dropOrder.length + ')</span></div>';
    if (!dropOrder.length) {
      html += '<div class="empty-note">這個副本的怪物目前沒有紀錄任何掉落物。</div>';
    } else {
      html += '<table class="dtable"><thead><tr><th>物品</th><th>最高機率</th><th>掉落來源</th></tr></thead><tbody>';
      // 列本身不設 data-goto-item：來源欄裡有怪物連結，整列可點的話會被物品連結搶走
      dropOrder.forEach(function (d) {
        var it = ITEMS[d.id];
        html += '<tr><td>' + (it ? '<span class="name-link" data-goto-item="' + d.id + '">' + escapeHtml(it.name) + '</span>'
          : '<span class="name-link" style="cursor:default;opacity:.5;">無資料</span>') + '</td>' +
          '<td><span class="' + rateClassP(d.best) + '">' + pctP(d.best) + '</span>' + (BOX_BY_ID[d.id] ? '<span class="group-tag">寶箱</span>' : '') + '</td>' +
          '<td style="font-size:12.5px;">' + d.sources.map(function (s) {
            return '<span class="name-link" data-goto-monster="' + s.mid + '">' + escapeHtml(MONSTERS[s.mid].name) + '</span> ' +
              '<span class="' + rateClassP(s.p) + '">' + pctP(s.p) + '</span>' + dropGroupTags(s.groups);
          }).join('<br>') + '</td></tr>';
      });
      html += '</tbody></table>';
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + escapeHtml(DROP_FORMULA_NOTE) +
        '這裡是未套用等級差衰減的機率，點怪物名稱可以看依你的等級換算後的數字。</div>';
    }

    detailTarget().innerHTML = html;
    if (!peekMode) document.getElementById("dungeonBackToList").addEventListener("click", function () {
      resetNavHistory();
      showDungeonBrowser();
    });
  }

  $changelogBtn.addEventListener("click", openChangelogList);

  // ---------- 使用說明（原本放在標題下方的長說明，改成按鈕點開，沿用更新紀錄的彈窗）----------
  var HELP_SECTIONS = [
    ["🔍 搜尋", "輸入物品名稱，查出會掉落它的怪物、出現地圖與掉落機率，以及哪些商店有賣；輸入怪物名稱，查出牠的能力與完整掉落表。名稱的字不用連在一起，例如「木劍」也會找到「木製劍」。"],
    ["🗂️ 分類下拉選單", "搜尋欄左邊可以選裝備部位（武器、頭部…）或物品分類（恢復、材料、任務…）。選了分類只會列物品；不輸入關鍵字時會直接列出整個分類。"],
    ["⚔️ 僅查詢裝備能力", "勾選後輸入能力名稱（例如「魔法」「攻速」「減傷」），只列出有這項能力加成的裝備並依數值排序，不比對物品名稱。可用空白同時查多項；能力後面可以加 >（大於等於）、<（小於等於）、=（等於）縮小範圍，例如「魔法力>20 攻速<10」。"],
    ["✅ 僅顯示目前可取得裝備", "搜尋結果上方的勾選框。勾選後只列出遊戲裡目前有取得管道（掉落、商店、任務、製作、合成、開箱、釣魚等）的物品。"],
    ["📈 你目前的等級", "輸入後，掉落表會多一欄「換算後機率」（套用等級差衰減，鐵匠／匠師不衰減），怪物頁也會顯示換算後的每隻經驗。"],
    ["🧰 職業／裝備位置篩選", "搜尋列下方可以依職業、裝備位置列出所有符合的裝備。"],
    ["📚 其他功能", "發條強化屬性表、寵物列表、副本、寶箱，以及任務總覽（主線、書信、委託、藍圖任務）。"]
  ];
  function openHelp() {
    var html = '<div class="section-title">使用說明</div>';
    HELP_SECTIONS.forEach(function (s) {
      html += '<div style="margin-bottom:14px;"><div style="font-weight:700;color:var(--gold-hi);margin-bottom:4px;">' + escapeHtml(s[0]) + '</div>' +
        '<div style="font-size:13.5px;color:var(--text-dim);line-height:1.8;">' + escapeHtml(s[1]) + '</div></div>';
    });
    $changelogBody.innerHTML = html;
    $changelogBackdrop.style.display = "flex";
  }
  var $helpBtn = document.getElementById("helpBtn");
  if ($helpBtn) $helpBtn.addEventListener("click", openHelp);
  // ---------- 快速查看視窗 ----------
  // 疊在所有畫面（包括寶箱／委託那個彈窗）上面；視窗裡再點連結會疊一層，可以「← 上一個」退回，
  // 關掉就回到原本的畫面，主畫面、左側清單、上一頁紀錄都不會被動到。
  var $peekBackdrop = document.createElement("div");
  $peekBackdrop.id = "peekBackdrop";
  $peekBackdrop.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center;padding:20px;";
  $peekBackdrop.innerHTML =
    '<div id="peekModal" style="background:var(--panel);border:1px solid var(--line-hi);border-radius:6px;width:100%;max-width:780px;max-height:86vh;overflow-y:auto;overscroll-behavior:contain;position:relative;">' +
    '<div style="position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:14px;padding:12px 18px;background:var(--panel);border-bottom:1px solid var(--line);">' +
    '<span class="name-link" id="peekBack" style="cursor:pointer;display:none;">← 上一個</span>' +
    '<span class="name-link" id="peekOpenFull" style="cursor:pointer;font-size:12.5px;color:var(--text-dim);">在主畫面開啟</span>' +
    '<span style="flex:1;"></span>' +
    '<button id="peekClose" style="background:none;border:none;color:var(--text-faint);font-size:20px;cursor:pointer;line-height:1;">✕</button>' +
    '</div><div id="peekBody" style="padding:18px 22px 22px;"></div></div>';
  document.body.appendChild($peekBackdrop);
  $peekBody = document.getElementById("peekBody");
  var $peekModal = document.getElementById("peekModal");
  var $peekBack = document.getElementById("peekBack");
  var peekStack = []; // [{kind, id}]，最後一筆是目前顯示的

  var PEEK_RENDER = { item: showItem, monster: showMonster, dungeon: showDungeonDetail, box: openBoxDetail, mission: openMissionDetail };
  function renderPeek() {
    var cur = peekStack[peekStack.length - 1];
    peekMode = true;
    try { PEEK_RENDER[cur.kind](cur.id); } finally { peekMode = false; }
    $peekBack.style.display = peekStack.length > 1 ? "" : "none";
    // 寶箱沒有主畫面的頁面可以開
    document.getElementById("peekOpenFull").style.display = (cur.kind === "box" || cur.kind === "mission") ? "none" : "";
    $peekModal.scrollTop = 0;
  }
  function openPeek(kind, id) {
    if (!PEEK_RENDER[kind]) return;
    var cur = peekStack[peekStack.length - 1];
    if (cur && cur.kind === kind && cur.id === String(id)) return;
    peekStack.push({ kind: kind, id: String(id) });
    $peekBackdrop.style.display = "flex";
    renderPeek();
  }
  function closePeek() {
    peekStack = [];
    $peekBackdrop.style.display = "none";
    $peekBody.innerHTML = "";
  }
  $peekBack.addEventListener("click", function () {
    if (peekStack.length > 1) { peekStack.pop(); renderPeek(); }
  });
  document.getElementById("peekOpenFull").addEventListener("click", function () {
    var cur = peekStack[peekStack.length - 1];
    closePeek();
    closeChangelog();
    if (cur) navigateTo(cur.kind, cur.id, true);
  });
  document.getElementById("peekClose").addEventListener("click", closePeek);
  $peekBackdrop.addEventListener("click", function (e) { if (e.target === $peekBackdrop) closePeek(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if ($peekBackdrop.style.display !== "none") closePeek();
    else if ($changelogBackdrop.style.display !== "none") closeChangelog();
  });

  $changelogClose.addEventListener("click", closeChangelog);
  $changelogBackdrop.addEventListener("click", function (e) { if (e.target === $changelogBackdrop) closeChangelog(); });
  $changelogBody.addEventListener("click", function (e) {
    var item = e.target.closest("[data-changelog-idx]");
    if (item) { openChangelogDetail(Number(item.getAttribute("data-changelog-idx"))); return; }
    var goto = e.target.closest("[data-changelog-goto]");
    if (goto) {
      // 更新紀錄裡的物品／怪物：用快速查看疊在上面，關掉還能繼續看更新紀錄
      var parts = goto.getAttribute("data-changelog-goto").split(":");
      openPeek(parts[0] === "monster" ? "monster" : "item", parts[1]);
    }
  });

  document.addEventListener("click", function (e) {
    // 縮寫的大數字：點一下在「4兆1千多億」和「4,127,547,868,864」之間切換
    var numToggle = e.target.closest("[data-num-toggle]");
    if (numToggle) {
      var showFull = numToggle.getAttribute("data-num-toggle") === "short";
      numToggle.textContent = numToggle.getAttribute(showFull ? "data-full" : "data-short");
      numToggle.setAttribute("data-num-toggle", showFull ? "full" : "short");
      numToggle.title = showFull ? "點一下縮短" : "點一下看完整數字";
      return;
    }
    // 在彈出視窗（委託詳細／寶箱）裡點寵物、任務線這類還是會換掉主畫面的連結時，先把視窗關掉，不然新頁面會被蓋住
    if (e.target.closest("#changelogBackdrop, #peekBackdrop") && e.target.closest("[data-open-questline],[data-open-pet],[data-open-bpet]")) {
      closePeek();
      closeChangelog();
    }
    var commissionDetail = e.target.closest("[data-commission-detail]");
    if (commissionDetail) { openCommissionDetail(commissionDetail.getAttribute("data-commission-detail"), commissionDetail.getAttribute("data-commission-detail-town")); return; }
    var backLink = e.target.closest("[data-go-back]");
    if (backLink) { goBackOneView(); return; }
    // 詳細頁／彈窗裡的物品、怪物、副本連結 → 快速查看視窗；左側清單、各種列表（.result-item）照舊換主畫面
    var peekLink = e.target.closest("[data-goto-item],[data-goto-monster],[data-open-dungeon]");
    if (peekLink && !peekLink.closest(".result-item") && peekLink.closest("#detailPanel, #peekBackdrop, #changelogBackdrop")) {
      if (peekLink.hasAttribute("data-goto-item")) openPeek("item", peekLink.getAttribute("data-goto-item"));
      else if (peekLink.hasAttribute("data-goto-monster")) openPeek("monster", peekLink.getAttribute("data-goto-monster"));
      else openPeek("dungeon", peekLink.getAttribute("data-open-dungeon"));
      return;
    }
    var gotoItemLink = e.target.closest("[data-goto-item]");
    if (gotoItemLink) { navigateTo("item", gotoItemLink.getAttribute("data-goto-item"), true); return; }
    var gotoMonsterLink = e.target.closest("[data-goto-monster]");
    if (gotoMonsterLink) { navigateTo("monster", gotoMonsterLink.getAttribute("data-goto-monster"), true); return; }
    var petLink = e.target.closest("[data-open-pet]");
    if (petLink) { navigateTo("pet", petLink.getAttribute("data-open-pet"), true); return; }
    var bpetLink = e.target.closest("[data-open-bpet]");
    if (bpetLink) { navigateTo("bpet", bpetLink.getAttribute("data-open-bpet"), true); return; }
    var dgLink = e.target.closest("[data-open-dungeon]");
    if (dgLink) { navigateTo("dungeon", dgLink.getAttribute("data-open-dungeon"), true); return; }
    var boxLink = e.target.closest("[data-open-box]");
    if (boxLink) { openPeek("box", boxLink.getAttribute("data-open-box")); return; }
    // 藍圖任務列：列裡的怪物／物品／副本連結在上面已經先處理掉了，點到列的其他地方才開詳細彈窗
    var missionDetail = e.target.closest("[data-mission-detail]");
    if (missionDetail) { openPeek("mission", missionDetail.getAttribute("data-mission-detail")); return; }
    var questTab = e.target.closest("[data-quest-tab]");
    if (questTab) { openQuestTab(questTab.getAttribute("data-quest-tab")); return; }
    var questLineLink = e.target.closest("[data-open-questline]");
    if (questLineLink) navigateTo("questline", questLineLink.getAttribute("data-open-questline"), true);
  });

  wireGlobalLevelField();
})();
