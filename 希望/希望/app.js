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
  var DAILY = window.DAILY || { rules: {}, milestones: [], quests: [] };
  var ITEM_DESC = window.ITEM_DESC || {}; // 遊戲裡的物品說明文字（item-desc.json）
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
  var DROP_FORMULA_NOTE = "機率已照遊戲的掉落計算換算：一般組 ×44%、材料組 ×12%、裝備組 ×8.3%、首領組 ×100%，同一組每隻怪最多掉一件（組內機率照資料順序累加，超過 100% 的部分不算）；攻擊力 0 的怪物已扣掉 14.5% 整批落空；〔乞討〕加成可在上方選，身上狀態給的掉落加成沒算進來。";
  // 照遊戲 El()（遊戲自己顯示掉落機率的 dropChances() 就是用它）算這隻怪每件物品的掉落機率（0~1）：
  // 每組各抽一次、最多掉一件；組內照資料順序累加 rate/1,000,000 × 掉落倍率 × 組別倍率，超過 1 的部分截掉；
  // 最後乘上 (1 − 整批落空機率)。mult＝遊戲 dropMultiplier 的等級差部分（不含技能／狀態加成）。
  // 回傳 {物品id: {p: 機率, groups: [組別...], raw: 資料原始 rate 加總}}
  // 變種（2026-09-27 06 點那版起）：怪物每次出生／重生，從「本體＋variants」平均隨機抽一種（遊戲 rollVariant()），
  // 變種只覆寫部分欄位（{...本體, ...變種}，跟遊戲 Df() 一樣）。遊戲的 dropChances() 是把每一種的機率平均，這裡照做。
  function monsterForms(mon) {
    if (!mon.variants || !mon.variants.length) return [mon];
    if (!mon._forms) {
      Object.defineProperty(mon, "_forms", {
        value: [mon].concat(mon.variants.map(function (v) { return Object.assign({}, mon, v, { variants: null }); })),
        enumerable: false
      });
    }
    return mon._forms;
  }
  function monsterDropChances(mon, mult) {
    var forms = monsterForms(mon);
    if (forms.length === 1) return monsterDropChancesOne(mon, mult);
    var out = {};
    forms.forEach(function (f) {
      var c = monsterDropChancesOne(f, mult);
      Object.keys(c).forEach(function (iid) {
        var e = out[iid] || (out[iid] = { p: 0, groups: [], raw: 0 });
        e.p += c[iid].p / forms.length;
        e.raw += c[iid].raw / forms.length;
        c[iid].groups.forEach(function (g) { if (e.groups.indexOf(g) === -1) e.groups.push(g); });
      });
    });
    return out;
  }
  function monsterDropChancesOne(mon, mult) {
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
  // 遊戲 dropMultiplier() = 等級差衰減（鐵匠／匠師免除） × (1 + 掉落率加成%)
  // 掉落率加成目前只有初心者技能〔乞討〕（skills.json #230，Lv110 可學，每級 +3%，Lv10 = +30%），
  // 另外還有 standingBuffs 的 dropRate（查詢頁無法得知玩家身上有什麼狀態，沒算進來）。
  var DROP_BEG_SKILL_LEVELS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
  function dropLevelPart(mon) {
    if (dropCalcState.level == null || dropCalcState.blacksmith) return 1;
    return dropLevelMultiplier(dropCalcState.level, mon.lv);
  }
  function dropBegBonusPct() { return dropCalcState.beg > 0 ? DROP_BEG_SKILL_LEVELS[dropCalcState.beg - 1] || 0 : 0; }
  function playerDropMultiplier(mon) {
    return dropLevelPart(mon) * (1 + dropBegBonusPct() / 100);
  }
  // 有輸入等級、或有選〔乞討〕時，掉落表才多一欄「換算後機率」
  function dropAdjActive() { return dropCalcState.level != null || dropBegBonusPct() > 0; }
  // 換算後機率的說明文字；decayMons = 這頁會被等級差衰減的怪物數（用來提醒「勾鐵匠也不會變」的情況）
  function dropAdjNote(decayMons) {
    var parts = [];
    if (dropCalcState.level != null) {
      if (dropCalcState.blacksmith) {
        parts.push(decayMons > 0
          ? "鐵匠／匠師不受等級差衰減（二轉爆破士會失去這個效果）。"
          : "已勾鐵匠，但這頁的怪物跟你 Lv" + dropCalcState.level + " 的等級差都不到 30 級，本來就沒有衰減，所以數字不會變。");
      } else {
        parts.push("依你輸入的 Lv" + dropCalcState.level + " 套用等級差衰減" +
          (decayMons > 0 ? "" : "（這頁的怪物等級差都不到 30 級，沒有衰減）") + "。");
      }
    }
    if (dropBegBonusPct() > 0) parts.push("〔乞討〕Lv" + dropCalcState.beg + "：掉落率 ×" + (100 + dropBegBonusPct()) + "%。");
    return parts.length ? "換算後機率：" + parts.join("") : "";
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
  var dropCalcState = { level: null, blacksmith: false, beg: 0 };

  function dropCalcBar() {
    var html = '<div style="display:flex;gap:10px 18px;align-items:center;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;background:var(--panel-hi);border:1px solid var(--line-hi);border-radius:6px;">';
    html += '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-dim);cursor:pointer;">' +
      '<input type="checkbox" id="dropCalcBlacksmith"' + (dropCalcState.blacksmith ? " checked" : "") + '> 是否為鐵匠／匠師（二轉爆破士不適用）</label>';
    html += '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-dim);">〔乞討〕' +
      '<select id="dropCalcBeg" style="background:var(--ink-2);color:var(--text);border:1px solid var(--line-hi);border-radius:6px;padding:3px 6px;font-size:12.5px;">' +
      '<option value="0">沒學</option>' + DROP_BEG_SKILL_LEVELS.map(function (v, i) {
        return '<option value="' + (i + 1) + '"' + (dropCalcState.beg === i + 1 ? ' selected' : '') + '>Lv' + (i + 1) + '（+' + v + '%）</option>';
      }).join('') + '</select></label>';
    // 最常見的誤會：以為勾鐵匠會「提升」掉落率，其實只是「不被等級差打折」——勾了鐵匠才顯示這段說明
    if (dropCalcState.blacksmith) {
      html += '<div style="flex-basis:100%;font-size:11.5px;color:var(--text-faint);line-height:1.6;">' +
        '💡 鐵匠不是增加掉落率，而是<b>不受等級差衰減</b>（比怪物高 30 級起掉落會打折：30 級 ×95%…55 級 ×5%）。' +
        (dropCalcState.level == null
          ? '要先在上方輸入<b>你目前的等級</b>，才會看到差別。'
          : '只有比怪物高 30 級以上的怪才會看到差別。') +
        '</div>';
    }
    html += '</div>';
    return html;
  }
  function wireDropCalcBar(onChange) {
    // 快速查看視窗和主畫面可能同時有這個勾選框（同一個 id），要在「這次畫的那一邊」找
    var inPeek = peekMode;
    var $bs = detailTarget().querySelector("#dropCalcBlacksmith");
    var $beg = detailTarget().querySelector("#dropCalcBeg");
    function rerender() {
      peekMode = inPeek;
      try { onChange(); } finally { peekMode = false; }
    }
    if ($bs) $bs.addEventListener("change", function () { dropCalcState.blacksmith = $bs.checked; rerender(); });
    if ($beg) $beg.addEventListener("change", function () { dropCalcState.beg = Number($beg.value) || 0; rerender(); });
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
    else if (currentDetail.type === "map") showMapDetail(currentDetail.id);
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
  // 種類編號照遊戲「現行」的 c_（存檔 v28 起重新編號：舊 3防 4攻速 5必殺 6命中 7迴避 → 新 3命中 4迴避 5防禦 6必殺 7攻速）。
  // 以前用舊編號，修改器寫進存檔的鑑定在遊戲裡會變成別的屬性（例如攻速變迴避）。
  var APPR_KIND_NAMES = { 1: "攻擊力", 2: "魔法力", 3: "命中率", 4: "迴避率", 5: "防禦力", 6: "必殺", 7: "攻擊速度", 8: "移動速度", 11: "HP%", 12: "AP%" };
  var APPR_FF = { // 遊戲 l_：[種類, 權重]
    weapon: [[1, 25], [7, 10], [3, 10], [6, 10], [11, 5]],
    magicWeapon: [[1, 25], [2, 25], [7, 10], [3, 10], [6, 10], [11, 5]],
    armor: [[5, 25], [7, 10], [4, 5], [11, 5], [12, 5]],
    shoes: [[5, 25], [7, 10], [4, 5], [8, 15], [11, 5], [12, 5]],
    accessory: [[1, 5], [2, 5], [5, 5], [7, 5], [3, 5], [4, 5], [6, 5], [8, 5], [11, 5], [12, 5]]
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
  // 名品館（遊戲 NPC「黑市商人」的商城頁面）：用點數計價，1 點換多少金幣每小時變動，所以跟金幣商店分開顯示。
  // update_data.py 寫在 shopIndex.js 的 MALL_INDEX = {towns: [城鎮id], items: {物品id: {points, pack?, category}}}
  var MALL_INDEX = window.MALL_INDEX || { towns: [], items: {} };
  // 名品館匯率：每個整點換一次，只跟「第幾個小時」有關（抄自遊戲 bundle 的 mallView，跟書籤 loader.js 的 mallRate 同一套）。
  // 商品金幣價＝點數×匯率。遊戲改公式時 update_data.py 的「名品館匯率公式檢查」會用紅字提醒，這裡跟 loader.js 要一起改。
  var MALL_HOUR_MS = 36e5;
  function mallRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = s + 1831565813 >>> 0;
      var e = Math.imul(s ^ s >>> 15, 1 | s);
      e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e;
      return ((e ^ e >>> 14) >>> 0) / 4294967296;
    };
  }
  function mallRate(period) {
    return 20000 + Math.floor(mallRng(Math.imul(period, 2654435761) ^ 1835101292)() * 61) * 500;
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  // 價格那格的內容（整點換價時由下面的計時器重畫）
  function mallNowHtml(points) {
    var now = new Date();
    var rate = mallRate(Math.floor(now.getTime() / MALL_HOUR_MS));
    var h = pad2(now.getHours());
    return '<div style="font-size:12px;color:var(--text-dim);margin-bottom:2px;">目前 ' + h + ':00～' + h + ':59 的價格為</div>' +
      '<span class="rate">' + fmtNum(points * rate) + ' 金幣</span>' +
      '<div style="font-size:11.5px;color:var(--text-faint);">' + fmtNum(points) + ' 點 × 1 點＝' + fmtNum(rate) + '</div>';
  }
  function mallSectionHtml(id) {
    var m = MALL_INDEX.items[String(id)];
    if (!m) return '';
    return '<div class="section-title">名品館</div>' +
      '<table class="dtable"><thead><tr><th>NPC</th><th>價格</th><th>分類</th></tr></thead><tbody><tr>' +
      '<td><span class="name-link" style="cursor:default;">黑市商人</span></td>' +
      '<td data-mall-points="' + m.points + '">' + mallNowHtml(m.points) + '</td>' +
      '<td>' + escapeHtml(m.category || "-") + (m.pack ? '<span class="group-tag">一次 ' + m.pack + ' 個</span>' : '') + '</td>' +
      '</tr></tbody></table>' +
      '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">1 點折合多少金幣每個整點換一次（' + fmtNum(20000) + '～' + fmtNum(50000) + '），價格會自動跟著更新。</div>';
  }
  // 限時加成道具（藥水／符咒／福袋）的效果：MALL_INDEX.potions = {物品id: {stat, amount, durationMs, maxLv?}}，文字照遊戲 dS()
  var POTION_STAT_LABEL = { exp: "經驗值", drop: "道具掉落率", atk: "攻擊力", mag: "魔法力", hit: "命中", aspd: "攻擊速度" };
  function potionDurationText(ms) {
    var min = Math.round(ms / 60000);
    if (min >= 1440 && min % 1440 === 0) return (min / 1440) + ' 天';
    if (min >= 60 && min % 60 === 0) return (min / 60) + ' 小時';
    return min + ' 分鐘';
  }
  function potionNoteHtml(id) {
    var p = (MALL_INDEX.potions || {})[String(id)];
    if (!p) return '';
    var timed = p.stat === "exp" || p.stat === "drop";
    return '<div class="equip-box" style="font-size:13px;line-height:1.9;margin-bottom:14px;">' +
      (timed ? '🍀 使用' : '🧪 喝下') + '後：<b>' + escapeHtml(POTION_STAT_LABEL[p.stat] || p.stat) + ' +' + p.amount + (p.stat === "aspd" ? '' : '%') + '</b>，持續 ' +
      potionDurationText(p.durationMs) + '。' +
      (p.maxLv != null ? '<br>⚠️ <b>限 Lv' + p.maxLv + ' 以下</b>的角色使用，超過就不能用。' : '') + '</div>';
  }
  // 頁面一直開著跨過整點時，把畫面上的名品館價格換成新時段的
  setInterval(function () {
    document.querySelectorAll("[data-mall-points]").forEach(function (td) {
      var html = mallNowHtml(Number(td.getAttribute("data-mall-points")));
      if (td.innerHTML !== html) td.innerHTML = html;
    });
  }, 30000);
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
  // 同一成品的全部製作書（屬性自然石有 4 本）；舊資料沒有就退回上面的單一配方
  var BPET_CRAFT_SOURCE_ALL = window.BPET_CRAFT_SOURCE_ALL || null;
  // 2026-09-28 改版新增的取得方式（update_data.py 產生）
  var EXCHANGE_OFFERS = window.EXCHANGE_OFFERS || [];
  var EXCHANGE_BY_GET = window.EXCHANGE_BY_GET || {};
  var EXCHANGE_BY_GIVE = window.EXCHANGE_BY_GIVE || {};
  var GM_DICE = window.GM_DICE || null;
  var FISHING_SOCK = window.FISHING_SOCK || null;
  var GEMS = window.GEMS || null;
  var JOB_ADVANCE = window.JOB_ADVANCE || null;
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
    var craftList = BPET_CRAFT_SOURCE_ALL && BPET_CRAFT_SOURCE_ALL[String(iid)] ? BPET_CRAFT_SOURCE_ALL[String(iid)] : (craftSrc ? [craftSrc] : []);
    craftList.forEach(function (cs) {
      var matsHtml = (cs.mats || []).map(function (m) { return itemChip(m[0], m[1]); }).join("");
      lines.push("取得方式：" + (cs.npc ? "找 <b>" + escapeHtml(cs.npc) + "</b> " : "") + "用 " + itemChip(cs.bookId) + " 製作，材料：" + matsHtml +
        "，花費 " + fmtNum(cs.gold) + " 金幣，成功率 " + cs.ratePct + "%");
    });
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
  // 照遊戲 vy()（飽食度 hunger 在存檔 v39 拿掉了）：每個屬性各自看，grow > 0 而且 growth[屬性][grow-1] 有值就用那個，
  // 沒有 growth 陣列的屬性（或 grow 0），固定用基礎資料裡的數字。
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
    if (p >= 0.0001 || p === 0) return p.toFixed(4) + "%";
    return "< 0.0001%";  // 變體平均之後有些機率小到 4 位小數顯示不出來
  }
  function rateClass(rate) {
    var p = (rate / RATE_DIVISOR) * 100;
    return p < 1 ? "rate low" : "rate";
  }
  function mapName(id) { return MAPS[String(id)] || ("地圖#" + id); }
  // 地圖進入條件（update_data.py 照 world.json 傳送門條件＋地圖 reqLevel 算的）：[{lv, fame}]，任一組達到就走得到
  var MAP_ACCESS = window.MAP_ACCESS || {};
  var gameCurrentMap = null; // 書籤從遊戲帶來的目前地圖（網址 map=），怪物頁會在那張地圖標「你在這裡」
  function mapAccessText(mid) {
    var opts = MAP_ACCESS[String(mid)];
    if (!opts || !opts.length) return "";
    return opts.map(function (o) {
      return "Lv" + o.lv + (o.fame ? "＋累計名聲 " + fmtNum(o.fame) : "");
    }).join(" 或 ") + " 才走得到";
  }
  // 廢墟地圖的名聲懲罰（maps.json penalty，遊戲 fieldPenalty）：累計名聲 < fame 時，待在這張地圖能力大幅下降
  var MAP_PENALTY = window.MAP_PENALTY || {};
  var PENALTY_STAT_LABEL = { atk: "攻擊", mag: "魔法", def: "防禦", hit: "命中", eva: "迴避", crit: "必殺", aspd: "攻速", mspd: "移速", hpPct: "HP", maxHp: "HP 上限", maxAp: "AP 上限" };
  function penaltyEffectText(p) {
    var byVal = {}, order = [];
    Object.keys(p.stats || {}).forEach(function (k) {
      var v = p.stats[k];
      if (!v) return;
      if (!byVal[v]) { byVal[v] = []; order.push(v); }
      byVal[v].push(PENALTY_STAT_LABEL[k] || k);
    });
    var parts = order.map(function (v) { return byVal[v].join("、") + " " + (v > 0 ? "+" : "") + v + "%"; });
    // taken 跟裝備的「減少傷害」同一個欄位：負的代表受到的傷害變多
    if (p.taken) parts.push("受到的傷害 " + (p.taken < 0 ? "+" + (-p.taken) : "-" + p.taken) + "%");
    if (p.dealt) parts.push("造成的傷害 " + (p.dealt > 0 ? "+" : "") + p.dealt + "%");
    return parts.join("；");
  }
  function ruinPenaltyWarningHtml(mapIds) {
    var hits = (mapIds || []).filter(function (mid) { return MAP_PENALTY[String(mid)]; });
    if (!hits.length) return "";
    var p = MAP_PENALTY[String(hits[0])];
    return '<div class="ruin-warn">' +
      '<div class="ruin-warn-title">⚠️ 廢墟地圖：累計名聲不到 ' + fmtNum(p.fame) + '，能力值會被扣 90%！</div>' +
      '<div class="ruin-warn-body">這隻怪物出現在〔' + escapeHtml(hits.map(mapName).join("、")) + '〕。' +
      '角色的<b>累計名聲</b>低於 ' + fmtNum(p.fame) + ' 時，待在這' + (hits.length > 1 ? '些' : '張') + '地圖會：' +
      escapeHtml(penaltyEffectText(p)) + '。名聲夠了就不會被扣。</div>' +
      '</div>';
  }
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
  // 物品／戰寵技能圖示：照遊戲 ItemIcon 元件的算法，從圖集（希望/iconIndex.js 的 ICON_ATLAS）切出第 n 格：
  // background-position = -(n % cols × cell) -(floor(n / cols) × cell)，再依顯示大小等比縮放。
  // 物品的格子編號是 items.js 的 ic（update_data.py 從 icons.json 對好的）；沒有圖集或對不到就不畫。
  var ICON_ATLAS = window.ICON_ATLAS || {};
  function atlasIconHtml(atlas, cell, size) {
    if (!atlas || cell == null) return '';
    var s = size / atlas.cell;
    return '<span class="game-icon' + (size > atlas.cell ? ' px' : '') + '" aria-hidden="true" style="width:' + size + 'px;height:' + size + 'px;' +
      "background-image:url('" + atlas.url + "');background-size:" + (atlas.cols * atlas.cell * s) + 'px auto;' +
      'background-position:-' + (cell % atlas.cols * atlas.cell * s) + 'px -' + (Math.floor(cell / atlas.cols) * atlas.cell * s) + 'px;"></span>';
  }
  function itemIconHtml(id, size) {
    var it = ITEMS[id];
    if (!it) return '';
    size = size || 32;
    // 一個圖示一個檔（update_data.py split_item_icons 切的，ids[格子編號] = 檔名）：畫面上顯示到才下載那一個，
    // 不用為了一個圖示下載整張 2 MB 的圖集。沒有切圖資料時退回用整張圖集。
    var atlas = ICON_ATLAS.items;
    var file = atlas && atlas.dir && atlas.ids && it.ic != null ? atlas.ids[it.ic] : null;
    if (file != null) {
      return '<img class="game-icon' + (size > atlas.cell ? ' px' : '') + '" src="' + atlas.dir + file + '.webp?v=' + atlas.v +
        '" width="' + size + '" height="' + size + '" loading="lazy" decoding="async" alt="" aria-hidden="true">';
    }
    return atlasIconHtml(atlas, it.ic, size);
  }
  function bpetSkillIconHtml(iconId, size) {
    var atlas = ICON_ATLAS["bpet-skills"];
    return atlas && atlas.index ? atlasIconHtml(atlas, atlas.index[String(iconId)], size || 32) : '';
  }
  // 怪物／戰寵外觀：每個 model 一個動態 WebP（update_data.py 從遊戲動畫表的待機動作做的，ICON_ATLAS.monsterAnim）。
  // loading="lazy"：列表很長時，捲到才下載。遊戲本身就沒有圖的 model（約 30 個）對不到，就不畫。
  function modelIconHtml(model, size) {
    var anim = ICON_ATLAS.monsterAnim;
    var ver = anim && anim.v && model ? anim.v[model] : null;
    if (!ver) return '';
    size = size || 32;
    return '<img class="game-icon" src="' + anim.dir + encodeURIComponent(model) + '.webp?v=' + ver + '" width="' + size + '" height="' + size +
      '" loading="lazy" decoding="async" alt="">';
  }
  function monsterIconHtml(monId, size) {
    var mon = MONSTERS[monId];
    return mon ? modelIconHtml(mon.model, size) : '';
  }

  function itemChip(id, qty, suffixHtml) {
    var it = ITEMS[id];
    var suffix = (qty != null ? ' ×' + qty : '') + (suffixHtml ? ' ' + suffixHtml : '');
    if (!it) return '<span class="map-chip" style="opacity:.5;">無資料' + suffix + '</span>';
    return '<span class="map-chip" data-goto-item="' + id + '">' + itemIconHtml(id, 20) + escapeHtml(it.name) + suffix + '</span>';
  }
  function itemLinkRow(id, extraCellsHtml) {
    var it = ITEMS[id];
    if (!it) return '<tr><td><span class="name-link" style="cursor:default;opacity:.5;">無資料</span></td>' + extraCellsHtml + '</tr>';
    return '<tr class="clickable" data-goto-item="' + id + '"><td>' + itemIconHtml(id, 28) + '<span class="name-link">' + escapeHtml(it.name) + '</span></td>' + extraCellsHtml + '</tr>';
  }

  // 一些常見搜尋建議（挑幾個知名度高的字）
  var enchantChip = document.createElement("span");
  enchantChip.className = "hint-chip";
  enchantChip.style.borderColor = "var(--gold)";
  enchantChip.style.color = "var(--gold-hi)";
  // 原本的「🔮 發條強化屬性表」改成「⚒️ 鐵匠相關」，裡面分成發條強化／找雷分解／強硬分解三個分頁
  enchantChip.textContent = "⚒️ 鐵匠相關";
  enchantChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    openSmithTab(smithLastTab);
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

  // 原本的「🎁 寶箱」按鈕換成「🗺️ 地圖」（寶箱還是可以從副本頁、物品頁點進去）
  var mapChip = document.createElement("span");
  mapChip.className = "hint-chip";
  mapChip.style.borderColor = "var(--gold)";
  mapChip.style.color = "var(--gold-hi)";
  mapChip.textContent = "🗺️ 地圖";
  mapChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    showMapDetail(mapBrowserLast);
    scrollToDetail();
  });
  $hintRow.appendChild(mapChip);

  var skillChip = document.createElement("span");
  skillChip.className = "hint-chip";
  skillChip.style.borderColor = "var(--gold)";
  skillChip.style.color = "var(--gold-hi)";
  skillChip.textContent = "✨ 技能";
  skillChip.addEventListener("click", function () {
    resetNavHistory();
    $input.value = "";
    currentMatches = { items: [], monsters: [] };
    renderResultList("");
    currentView = { kind: "skills", id: skillLastJob || "" };
    showSkillBrowser(skillLastJob || "");
    scrollToDetail();
  });
  $hintRow.appendChild(skillChip);

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
    openQuestTab(defaultQuestTab());
    scrollToDetail();
  });
  $hintRow.appendChild(questLineChip);

  // 鑲嵌石（2026-10-08 新增的系統）：資料檔是舊版、沒有 stoneIndex.js 時就不顯示
  if (window.STONES) {
    var stoneChip = document.createElement("span");
    stoneChip.className = "hint-chip";
    stoneChip.style.borderColor = "var(--gold)";
    stoneChip.style.color = "var(--gold-hi)";
    stoneChip.textContent = "💠 鑲嵌石";
    stoneChip.addEventListener("click", function () {
      resetNavHistory();
      $input.value = "";
      currentMatches = { items: [], monsters: [] };
      renderResultList("");
      currentView = { kind: "stones", id: "" };
      showStoneGuide();
      scrollToDetail();
    });
    $hintRow.appendChild(stoneChip);
  }

  // 上面那一排按鈕越加越多，收進一顆「其他各種功能」裡：按下去跳出彈窗，裡面就是原本那些按鈕（原封不動搬進去，功能照舊）。
  // 之後要加新功能照樣 $hintRow.appendChild(...) 寫在這段前面就會自動被收進來。
  (function () {
    var chips = Array.prototype.slice.call($hintRow.children);
    if (!chips.length) return;
    var backdrop = document.createElement("div");
    backdrop.id = "featureMenuBackdrop";
    backdrop.style.cssText = "display:none;position:fixed;inset:0;background:rgba(40,26,14,.55);z-index:999;align-items:center;justify-content:center;padding:20px;";
    backdrop.innerHTML =
      '<div style="background:var(--panel);border:2px solid var(--btn-edge);border-radius:var(--radius);width:100%;max-width:420px;max-height:82vh;overflow-y:auto;padding:22px;position:relative;">' +
      '<button type="button" data-feature-menu-close="1" style="position:absolute;top:14px;right:16px;background:none;border:none;color:var(--text-dim);font-size:20px;cursor:pointer;">✕</button>' +
      '<div class="section-title" style="margin-top:0;">其他各種功能</div>' +
      '<div id="featureMenuList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;"></div></div>';
    document.body.appendChild(backdrop);
    var list = backdrop.querySelector("#featureMenuList");
    chips.forEach(function (chip) {
      chip.style.textAlign = "center";
      chip.style.padding = "10px 12px";
      chip.style.fontSize = "14px";
      list.appendChild(chip);
    });
    function close() { backdrop.style.display = "none"; }
    // 點到任何一顆功能按鈕（它自己的動作照跑）、✕、或視窗外面都關掉彈窗
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop || e.target.closest("[data-feature-menu-close], .hint-chip")) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    var menuChip = document.createElement("span");
    menuChip.className = "hint-chip";
    menuChip.style.borderColor = "var(--gold)";
    menuChip.style.color = "var(--gold-hi)";
    menuChip.textContent = "🧰 其他各種功能，可以點進來看看歐";
    menuChip.addEventListener("click", function () { backdrop.style.display = "flex"; });
    $hintRow.appendChild(menuChip);
  })();

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
    } else if (kind === "map") {
      showMapDetail(id);
    } else if (kind === "smith") {
      openSmithTab(id);
    } else if (kind === "skills") {
      showSkillBrowser(id);
    } else if (kind === "skill") {
      showSkillDetail(id);
    } else if (kind === "questline") {
      showQuestLineDetail(id);
    } else if (kind === "questtab") {
      openQuestTab(id);
    } else if (kind === "stones") {
      showStoneGuide();
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
          '<span class="rname">' + monsterIconHtml(m.id, 32) + escapeHtml(m.name) + '</span>' +
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
        if (MALL_INDEX.items[it.id]) metaParts.push("名品館有賣");
        if (radixCount) metaParts.push("拉迪克斯有賣");
        if (FORGE_BY_BOOK[it.id]) metaParts.push("鍛造書");
        if (FORGE_BY_PRODUCT[it.id]) metaParts.push("可鍛造取得");
        if (COOK_BY_PRODUCT[it.id]) metaParts.push("料理成品");
        if (COOK_BY_INGREDIENT[it.id]) metaParts.push("可用於料理");
        if (ALCHEMY_BY_BOOK[it.id]) metaParts.push("煉金配方書");
        if (ALCHEMY_BY_PRODUCT[it.id]) metaParts.push("可煉金取得");
        if (BOX_BY_ID[it.id]) metaParts.push("寶箱");
        if (ITEM_TO_BOXES[it.id]) metaParts.push("可從開箱取得");
        if (EXCHANGE_BY_GET[it.id]) metaParts.push("可兌換取得");
        if (ITEM_QUEST_USES[it.id]) metaParts.push("任務道具");
        if (ITEM_PET_EVOLVE_USES[it.id]) metaParts.push("寵物進化材料");
        if (ITEM_ORIGIN[it.id] || ITEM_KILL_SOURCE[it.id]) metaParts.push("可從任務取得");
        if (LETTER_SOURCE[it.id]) metaParts.push("書信任務");
        if (itemLetterMaterialUses(it.id).length) metaParts.push("書信材料");
        if (BOX_KEY_TO_BOXES[String(it.id)]) metaParts.push("寶箱鑰匙");
        if (questRefs.quests.length && metaParts.indexOf("任務道具") === -1) metaParts.push("任務道具");
        if (questRefs.missions.length) metaParts.push("藍圖任務");
        html += '<li class="result-item" data-type="item" data-id="' + it.id + '">' +
          '<span class="rname">' + itemIconHtml(it.id, 32) + escapeHtml(it.name) + '</span>' +
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

  // R代幣（missions.json tokenItemId）也是每日任務的獎勵
  function renderDailyTokenCard() {
    var minT = null, maxT = 0, giftT = 0;
    DAILY.quests.forEach(function (q) {
      if (minT == null || q.token < minT) minT = q.token;
      if (q.token > maxT) maxT = q.token;
    });
    (DAILY.milestones || []).forEach(function (m) { giftT += m.token || 0; });
    return '<div class="equip-box">' +
      '<div class="row1"><span class="slot">🗓️ 每日任務　獎勵</span></div>' +
      '<div style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '每張任務卡依評級給 ×' + minT + ' ~ ×' + maxT + '，累計完成的禮物盒合計再給 ×' + giftT + '。' +
      '<span class="name-link" data-goto-questtab="daily" style="margin-left:6px;">看每日任務 →</span>' +
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

  // ---------- ✨ 技能（2026-10-02 新增）----------
  // 資料 希望/skillIndex.js（update_data.py 從 skills.json 做的，原始 1 MB 多）不在開頁時載入，第一次點「技能」才動態載入。
  // SKILL_INDEX = {jobs:[{id,name,trees:{tree:分頁名稱}}], skills:{職業id:[技能]}}；
  // 技能的 lv = {欄位: 值（每級都一樣）或 [每級的值]}、n = 總級數，欄位意義見 update_data.py 那段註解。
  var SKILL_INDEX = window.SKILL_INDEX || null;
  var skillIndexWaiting = null;
  var skillLastJob = null;
  function withSkillIndex(run) {
    if (SKILL_INDEX) { run(); return; }
    $detail.innerHTML = '<div class="empty-note">技能資料載入中…</div>';
    if (skillIndexWaiting) { skillIndexWaiting.push(run); return; }
    skillIndexWaiting = [run];
    var s = document.createElement("script");
    s.src = "希望/skillIndex.js?v=" + ((ICON_ATLAS.skillData && ICON_ATLAS.skillData.v) || "1");
    s.onload = function () {
      SKILL_INDEX = window.SKILL_INDEX || { jobs: [], skills: {} };
      var list = skillIndexWaiting; skillIndexWaiting = null;
      // 載入期間使用者可能已經點去別頁，只跑最後一個、而且還停在技能頁才畫
      if (currentView && (currentView.kind === "skills" || currentView.kind === "skill")) list[list.length - 1]();
    };
    s.onerror = function () {
      skillIndexWaiting = null;
      $detail.innerHTML = '<div class="empty-note">技能資料載入失敗，請檢查網路後再點一次「技能」。</div>';
    };
    document.head.appendChild(s);
  }
  var SKILL_KIND_LABEL = { attack: "攻擊", support: "輔助", passive: "被動", heal: "恢復", life: "生活" };
  var SKILL_ELEMENT_LABEL = { none: "無", fire: "火", water: "水", tree: "木", steel: "金", earth: "土", sun: "光", dark: "闇" };
  var SKILL_ASSOC_LABEL = { atk: "攻擊力", mag: "魔法力", magAtk: "魔法力＋攻擊力", atkMag: "攻擊力＋魔法力" };
  var SKILL_GEM_LABEL = { attack: "攻擊", heal: "恢復", support: "輔助" };
  var SKILL_STAT_LABEL = {
    atk: "攻擊", def: "防禦", hit: "命中", crit: "必殺", eva: "迴避", mag: "魔法力", maxHp: "最大 HP", maxAp: "最大 AP", atkSpeed: "攻速",
    throwSplash: "投擲濺射", meleeSplash: "普攻濺射", throwDouble: "投擲兩次", throwDamage: "投擲傷害", throwCritMult: "投擲必殺倍率",
    apShield: "AP 抵傷", skillCooldownFixed: "技能冷卻固定", comboDamage: "連續技傷害", moveSpeed: "移動速度", dodgeChance: "閃避",
    dropRate: "掉落率", apRegen: "AP 回復", shield: "護盾", invulnerable: "無敵", reflect: "反傷", counter: "反擊", reviveOnDeath: "死亡時復活"
  };
  var SKILL_STATUS_LABEL = {
    dot: "持續傷害", regen: "持續回血", apRegen: "持續回 AP", shield: "護盾", invulnerable: "無敵", reflect: "反傷", counter: "反擊",
    apDrain: "持續失去 AP", stun: "無法行動", noAttack: "無法攻擊", noMove: "無法移動", noHeal: "無法恢復", lure: "把怪引過來", revive: "死亡時復活"
  };
  var SKILL_EQUIP_LABEL = { shield: "盾牌", weapon: "武器" };
  var SKILL_TRIGGER_LABEL = { combo: "打出連續技時", hit: "被打中時", attack: "普通攻擊時", castSkill: "施放指定技能時", castElement: "施放指定屬性技能時" };
  function skillJobDef(jobId) {
    return (SKILL_INDEX.jobs || []).filter(function (j) { return j.id === jobId; })[0];
  }
  function skillFind(jobId, skillId) {
    return (SKILL_INDEX.skills[jobId] || []).filter(function (s) { return String(s.id) === String(skillId); })[0];
  }
  // 技能在第 i 級（0 起算）某個欄位的值
  function skillLvVal(s, key, i) {
    var v = s.lv ? s.lv[key] : undefined;
    return Array.isArray(v) ? v[i] : v;
  }
  function skillIconHtml(skillId, size) {
    var a = ICON_ATLAS.skills;
    size = size || 32;
    if (!a || !a.dir || (a.has || []).indexOf(Number(skillId)) < 0) return '';
    return '<img class="game-icon' + (size > 32 ? ' px' : '') + '" src="' + a.dir + skillId + '.webp?v=' + a.v + '" width="' + size + '" height="' + size +
      '" loading="lazy" decoding="async" alt="" aria-hidden="true">';
  }
  function skillLinkHtml(jobId, skillId, suffix) {
    var s = skillFind(jobId, skillId);
    if (!s) return '<span style="opacity:.6;">技能 #' + escapeHtml(String(skillId)) + '</span>';
    return '<span class="map-chip" style="cursor:pointer;" data-goto-skill="' + jobId + ':' + s.id + '">' + skillIconHtml(s.id, 20) + escapeHtml(s.name) + (suffix || '') + '</span>';
  }
  function skillSec(ms) {
    if (ms >= 60000 && ms % 60000 === 0) return (ms / 60000) + ' 分鐘';
    return (Math.round(ms / 10) / 100) + ' 秒';
  }
  // 每級的值整理成一句：全部一樣就寫一個；不一樣寫「Lv1 a → LvN b」；前面幾級沒有（null）的寫「LvK 起」
  function skillPerLevelText(arr, fmt) {
    fmt = fmt || function (v) { return String(v); };
    if (!Array.isArray(arr)) return arr == null ? '' : fmt(arr);
    var first = -1;
    for (var i = 0; i < arr.length; i++) { if (arr[i] != null) { first = i; break; } }
    if (first < 0) return '';
    var vals = arr.slice(first).filter(function (v) { return v != null; });
    var same = vals.every(function (v) { return v === vals[0]; });
    var pre = first > 0 ? '技能 Lv' + (first + 1) + ' 起：' : '';
    if (same) return pre + fmt(vals[0]);
    return pre + 'Lv' + (first + 1) + ' ' + fmt(vals[0]) + ' → Lv' + arr.length + ' ' + fmt(vals[vals.length - 1]);
  }
  function skillPct(v) { return v + '%'; }
  function skillStatusName(st) {
    if (st.kind === "stat") return (SKILL_STAT_LABEL[st.stat] || st.stat || "能力") + (st.debuff ? '下降' : '上升');
    return SKILL_STATUS_LABEL[st.kind] || st.kind;
  }
  function skillNeedText(jobId, o) {
    var parts = [];
    if (o.requiresSkill != null) parts.push('要先學 ' + skillLinkHtml(jobId, o.requiresSkill));
    if (o.requiresMark != null) parts.push('目標身上要有 ' + skillLinkHtml(jobId, o.requiresMark) + ' 留下的印記');
    if (o.requiresBuff != null) parts.push('自己身上要有 ' + skillLinkHtml(jobId, o.requiresBuff) + ' 的效果');
    return parts.length ? '（' + parts.join('、') + '）' : '';
  }
  // 技能的特殊效果，一項一行
  function skillEffectLines(jobId, s) {
    var lines = [];
    (s.buffs || []).forEach(function (b) {
      var t = '🟢 增益：<b>' + escapeHtml(SKILL_STAT_LABEL[b.stat] || b.stat) + '</b>' + (b.party ? '（全隊）' : '');
      if (b.byLevel) t += '，數值 ' + skillPerLevelText(b.byLevel, function (v) { return v + (b.pct ? '%' : ''); });
      else if (b.byPartySize) t += '，依隊伍人數（2 人起）：' + b.byPartySize.map(function (v) { return v + (b.pct ? '%' : ''); }).join(' / ');
      else if (b.fixed != null) t += '，固定 ' + b.fixed + (b.pct ? '%' : '');
      else if (b.stat !== "invulnerable") t += '，數值看下表的「效果值」' + (b.pct ? '（%）' : '');
      if (b.magScale) t += '，會隨魔法力提高';
      if (b.everyMs) t += '，每 ' + skillSec(b.everyMs) + ' 一次';
      if (b.mask) t += '（只對指定職業的隊友有效）';
      lines.push(t);
    });
    (s.selfBuffs || []).concat(s.castStatuses || []).forEach(function (b) {
      var who = b.target === "party" ? '全隊' : '自己';
      var name = b.kind && b.kind !== "stat" ? (SKILL_STATUS_LABEL[b.kind] || b.kind) : (SKILL_STAT_LABEL[b.stat] || b.stat);
      var t = '🟢 施放時' + who + '獲得 <b>' + escapeHtml(name) + '</b> ' + skillPerLevelText(b.value, function (v) { return v + (b.pct ? '%' : ''); });
      if (b.chancePct != null) t += '，機率 ' + skillPerLevelText(b.chancePct, skillPct);
      if (b.fixedDurationMs) t += '，持續 ' + skillSec(b.fixedDurationMs);
      else if (b.durationMs) t += '，持續 ' + skillPerLevelText(b.durationMs, skillSec);
      lines.push(t + skillNeedText(jobId, b));
    });
    if (s.selfBuffsOneOf) lines.push('（上面的自身增益每次只會隨機出現其中一種）');
    (s.debuffs || []).forEach(function (d) {
      var pl = d.perLevel || {};
      var t = '🔴 減益：<b>' + escapeHtml(skillStatusName({ kind: d.kind, stat: d.stat, debuff: true })) + '</b>';
      if (d.kind === "stat") t += ' ' + skillPerLevelText(pl.value != null ? pl.value : d.pct, function (v) { return Math.abs(v) + '%'; });
      if (d.kind === "dot") {
        var tick = pl.value != null ? pl.value : (d.tickAtkPct != null ? d.tickAtkPct : null);
        if (tick != null) t += ' 每 ' + skillSec(d.tickMs || 1000) + ' 造成攻擊力 ' + skillPerLevelText(tick, skillPct);
        else if (d.tickAmount != null) t += ' 每 ' + skillSec(d.tickMs || 1000) + ' ' + d.tickAmount;
      }
      t += '，機率 ' + skillPerLevelText(pl.chancePct != null ? pl.chancePct : d.chancePct, skillPct);
      var dur = pl.durationMs != null ? pl.durationMs : d.durationMs;
      if (dur && (Array.isArray(dur) || dur > 0)) t += '，持續 ' + skillPerLevelText(dur, skillSec);
      if (d.gather) t += '（會把周圍的怪聚過來）';
      lines.push(t + skillNeedText(jobId, d));
    });
    if (s.debuffsOneOf) lines.push('（上面的減益每次只會隨機出現其中一種）');
    (s.extraDamage || []).forEach(function (x) {
      lines.push('💥 追加傷害：威力 ' + skillPerLevelText(x.pct, skillPct) + '，機率 ' + skillPerLevelText(x.chancePct, skillPct) +
        (x.noBoss ? '（對 Boss 無效）' : '') + skillNeedText(jobId, x));
    });
    if (s.doubleDamage) lines.push('💥 傷害加倍：機率 ' + skillPerLevelText(s.doubleDamage.chancePct, skillPct) +
      (s.doubleDamage.noCritStack ? '（必殺時不會再加倍）' : '') + skillNeedText(jobId, s.doubleDamage));
    if (s.critMultiplier != null && s.critMultiplier !== 2) lines.push('💥 必殺時傷害 ×' + s.critMultiplier + '（一般技能是 ×2）');
    if (s.superCrit) lines.push('💥 超級必殺：機率 ' + skillPerLevelText(s.superCrit.chancePct, skillPct));
    if (s.lifestealPct) lines.push('🩸 吸血：造成傷害的 ' + skillPerLevelText(s.lifestealPct, skillPct) + ' 補回自己 HP');
    if (s.castHeal) lines.push('💚 施放時' + (s.castHeal.target === "party" ? '全隊' : '自己') + '回復 HP ' + skillPerLevelText(s.castHeal.value) +
      (s.castHeal.chancePct != null ? '，機率 ' + skillPerLevelText(s.castHeal.chancePct, skillPct) : '') + skillNeedText(jobId, s.castHeal));
    if (s.healFormula) lines.push('💚 回復量會隨' + (SKILL_STAT_LABEL[s.healFormula.stat] || s.healFormula.stat) + '提高');
    if (s.instantDeath) lines.push('☠️ 即死：機率 ' + skillPerLevelText(s.instantDeath.chancePct, skillPct));
    if (s.hpPctDamage) {
      var h = s.hpPctDamage;
      lines.push('☠️ 依目標 HP 計算傷害：' + h.successPct + '% 機率打掉 ' + h.onSuccessPct + '%，其餘打掉 ' + h.onFailPct + '%' +
        (h.capAboveHp ? '；目標 HP 超過 ' + fmtNum(h.capAboveHp) + ' 時固定 ' + fmtNum(h.cappedDamage) : ''));
    }
    if (s.mark) lines.push('🎯 打中後在目標身上留下印記' + (s.mark.chancePct != null ? '，機率 ' + skillPerLevelText(s.mark.chancePct, skillPct) : '') +
      '，持續 ' + skillPerLevelText(s.mark.durationMs, skillSec) + '（給其他技能接續用）' + skillNeedText(jobId, s.mark));
    (s.triggers || []).forEach(function (tr) {
      var t = '⚡ ' + (SKILL_TRIGGER_LABEL[tr.when] || tr.when);
      if (tr.skillIds) t += '（' + tr.skillIds.map(function (id) { return skillLinkHtml(jobId, id); }).join('') + '）';
      if (tr.element) t += '（' + (SKILL_ELEMENT_LABEL[tr.element] || tr.element) + '屬性）';
      t += '，' + skillPerLevelText(tr.chancePct, skillPct) + ' 機率';
      if (tr.heal) t += '回復 HP ' + skillPerLevelText(tr.heal);
      if (tr.damage) t += '追加傷害 ' + skillPerLevelText(tr.damage);
      if (tr.statuses) {
        t += '讓' + (tr.target === "enemy" ? '敵人' : tr.target === "party" ? '全隊' : '自己') + ' ' +
          tr.statuses.map(function (st) { return '<b>' + escapeHtml(skillStatusName(st)) + '</b>'; }).join('、');
        if (tr.pct) t += ' ' + skillPerLevelText(tr.pct, skillPct);
        if (tr.flat) t += ' ' + skillPerLevelText(tr.flat);
        if (tr.tickAtkPct) t += '（每跳攻擊力 ' + skillPerLevelText(tr.tickAtkPct, skillPct) + '）';
      }
      if (tr.durationMs) t += '，持續 ' + skillPerLevelText(tr.durationMs, skillSec);
      lines.push(t);
    });
    if (s.resetsSkill) lines.push('🔁 ' + skillPerLevelText(s.resetsSkill.chancePct, skillPct) + ' 機率重置 ' + skillLinkHtml(jobId, s.resetsSkill.skillId) + ' 的冷卻');
    if (s.noStackWith) lines.push('⚠️ 不能跟 ' + s.noStackWith.map(function (id) { return skillLinkHtml(jobId, id); }).join('') + ' 同時生效');
    if (s.requiresBuff != null) lines.push('⚠️ 自己身上要有 ' + skillLinkHtml(jobId, s.requiresBuff) + ' 的效果才能用');
    if (s.requiresEquip) lines.push('⚠️ 要裝備 ' + (s.requiresEquip.equip || []).map(function (e) { return SKILL_EQUIP_LABEL[e] || e; }).join('、') + ' 才能用');
    if (s.notForJobs) lines.push('⚠️ 對這些職業的隊友無效：' + s.notForJobs.map(function (j) { var d = skillJobDef(j); return d ? d.name : j; }).join('、'));
    if (s.rootsSelf) lines.push('⚠️ 效果期間自己不能移動');
    if (s.pickTarget) lines.push('🎯 可以指定要放在哪個隊友身上');
    if (s.xpFill) lines.push('✨ 施放後連續技量表直接集滿');
    if (s.weak) lines.push('🧩 破綻類型 ' + s.weak.join('、') + '：打到怪物對應的弱點時，破綻值累積得更快');
    return lines;
  }
  var SKILL_LEVEL_COLS = [
    ["reqLv", "角色等級"], ["pts", "SP"], ["dmg", null], ["ap", "AP"], ["cdMs", "冷卻"], ["castMs", "詠唱"], ["recMs", "收招"],
    ["durMs", "持續"], ["area", "目標數"], ["range", "射程"], ["crit", "必殺加成"], ["hate", "仇恨"], ["stagger", "破綻值"]
  ];
  function skillListKey(jobId, tree) { return jobId + (tree ? ':' + tree : ''); }
  function showSkillBrowser(key) {
    withSkillIndex(function () {
      currentDetail = null;
      var parts = String(key || "").split(":");
      var job = skillJobDef(parts[0]) || skillJobDef(skillLastJob) || (SKILL_INDEX.jobs || [])[0];
      if (!job) { $detail.innerHTML = '<div class="empty-note">沒有技能資料。</div>'; return; }
      skillLastJob = job.id;
      var all = SKILL_INDEX.skills[job.id] || [];
      var trees = Object.keys(job.trees || {}).filter(function (t) { return all.some(function (s) { return String(s.tree) === t; }); });
      var tree = trees.indexOf(parts[1]) >= 0 ? parts[1] : "";
      var tabBtn = function (attr, val, label, on) {
        return '<button type="button" ' + attr + '="' + val + '" style="padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;font-family:inherit;' +
          'border:1px solid ' + (on ? "var(--gold)" : "var(--line-hi)") + ';background:' + (on ? "var(--gold)" : "var(--ink-2)") + ';color:' + (on ? "var(--ink)" : "var(--text)") + ';">' + escapeHtml(label) + '</button>';
      };
      var html = backButtonHtml() + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
        SKILL_INDEX.jobs.map(function (j) { return tabBtn("data-skill-list", j.id, j.name, j.id === job.id); }).join("") + '</div>';
      if (trees.length > 1) {
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' + tabBtn("data-skill-list", job.id, "全部", !tree) +
          trees.map(function (t) { return tabBtn("data-skill-list", skillListKey(job.id, t), (t === "1" ? "" : "二轉・") + job.trees[t], t === tree); }).join("") + '</div>';
      }
      var list = all.filter(function (s) { return !tree || String(s.tree) === tree; }).slice().sort(function (a, b) {
        return a.tree - b.tree || (a.reqLv || 0) - (b.reqLv || 0) || a.id - b.id;
      });
      html += '<h2 style="margin-top:0;">✨ ' + escapeHtml(job.name) + '技能 <span class="count">(' + list.length + ')</span></h2>';
      html += '<div class="empty-note" style="padding:0 0 10px;">每升 1 級拿 ' + (SKILL_INDEX.spPerLevel || 0) + ' 點 SP' +
        (SKILL_INDEX.spBonus || []).map(function (b) { return '，Lv' + b.level + ' 另外多 ' + b.points + ' 點'; }).join("") + '。點技能看每一級的數值。</div>';
      html += '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>技能</th><th>類型</th><th>需求等級</th><th>最高</th><th>學滿 SP</th></tr></thead><tbody>';
      list.forEach(function (s) {
        var sp = 0;
        for (var i = 0; i < s.n; i++) sp += skillLvVal(s, "pts", i) || 0;
        html += '<tr class="clickable" data-goto-skill="' + job.id + ':' + s.id + '"><td>' + skillIconHtml(s.id, 28) + '<span class="name-link">' + escapeHtml(s.name) + '</span>' +
          (trees.length > 1 && !tree && String(s.tree) !== "1" ? ' <span class="group-tag">' + escapeHtml(job.trees[String(s.tree)] || "二轉") + '</span>' : '') + '</td>' +
          '<td>' + (SKILL_KIND_LABEL[s.kind] || s.kind) + (s.element && s.element !== "none" ? '・' + (SKILL_ELEMENT_LABEL[s.element] || s.element) : '') + '</td>' +
          '<td>Lv' + (s.reqLv || 1) + '</td><td>' + s.n + ' 級</td><td>' + sp + '</td></tr>';
      });
      html += '</tbody></table></div>';
      $detail.innerHTML = html;
    });
  }
  function showSkillDetail(key) {
    withSkillIndex(function () {
      currentDetail = null;
      var parts = String(key).split(":"), jobId = parts[0];
      var s = skillFind(jobId, parts[1]), job = skillJobDef(jobId);
      if (!s || !job) { $detail.innerHTML = backButtonHtml() + '<div class="empty-note">找不到這個技能。</div>'; return; }
      skillLastJob = jobId;
      var html = backButtonHtml();
      html += '<div class="detail-title">' + skillIconHtml(s.id, 48) + escapeHtml(s.name) + '</div>';
      html += '<div style="font-size:13px;color:var(--text-dim);margin-bottom:10px;"><span class="name-link" data-skill-list="' + skillListKey(jobId, String(s.tree)) + '">' +
        escapeHtml(job.name) + (String(s.tree) !== "1" ? '・二轉 ' + escapeHtml(job.trees[String(s.tree)] || "") : '') + '</span></div>';
      if (s.desc) html += '<div class="empty-note" style="padding:0 0 12px;font-style:italic;">' + escapeHtml(s.desc) + '</div>';
      var badges = ['類型 ' + (SKILL_KIND_LABEL[s.kind] || s.kind), '需求等級 ' + (s.reqLv || 1), '最高 ' + s.n + ' 級'];
      if (s.element && s.element !== "none") badges.push('屬性 ' + (SKILL_ELEMENT_LABEL[s.element] || s.element));
      if (s.kind === "attack" || s.kind === "heal") badges.push('看 ' + (SKILL_ASSOC_LABEL[s.assoc] || s.assoc));
      if (s.gem) badges.push('可鑲 ' + (SKILL_GEM_LABEL[s.gem] || s.gem) + '寶石');
      if (s.starter) badges.push('創角就有');
      html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' + badges.map(function (b) { return '<span class="badge">' + escapeHtml(b) + '</span>'; }).join("") + '</div>';

      // 前置技能／這個技能是誰的前置
      var pre = skillLvVal(s, "prereq", 0), preLv = skillLvVal(s, "prereqLv", 0);
      var unlocks = (SKILL_INDEX.skills[jobId] || []).filter(function (o) { return o.id !== s.id && String(skillLvVal(o, "prereq", 0)) === String(s.id); });
      if (pre != null || unlocks.length) {
        html += '<div class="equip-box" style="font-size:13px;line-height:2.1;margin-bottom:14px;">';
        if (pre != null) html += '前置技能：' + skillLinkHtml(jobId, pre, preLv ? ' <span style="color:var(--text-faint);font-size:11.5px;">Lv' + preLv + '</span>' : '') + '<br>';
        if (unlocks.length) html += '學了之後可以學：' + unlocks.map(function (o) {
          var need = skillLvVal(o, "prereqLv", 0);
          return skillLinkHtml(jobId, o.id, need ? ' <span style="color:var(--text-faint);font-size:11.5px;">要 Lv' + need + '</span>' : '');
        }).join("");
        html += '</div>';
      }

      var effects = skillEffectLines(jobId, s);
      if (effects.length) {
        html += '<div class="section-title">特殊效果</div><div class="equip-box" style="font-size:13px;line-height:2.1;margin-bottom:14px;">' + effects.join('<br>') + '</div>';
      }

      // 每級數值：整欄都是 0／沒有的欄位不顯示
      var dmgLabel = s.kind === "attack" ? "威力" : s.kind === "heal" ? "回復量" : "效果值";
      var cols = SKILL_LEVEL_COLS.filter(function (c) {
        for (var i = 0; i < s.n; i++) { if (skillLvVal(s, c[0], i)) return true; }
        return false;
      });
      if (cols.length) {
        var msCols = { cdMs: 1, castMs: 1, recMs: 1, durMs: 1 };
        var spSum = 0;
        html += '<div class="section-title">每級數值</div><div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr><th>技能等級</th>' +
          cols.map(function (c) { return '<th>' + (c[1] || dmgLabel) + '</th>'; }).join("") + '</tr></thead><tbody>';
        for (var i = 0; i < s.n; i++) {
          html += '<tr><td>Lv' + (i + 1) + '</td>' + cols.map(function (c) {
            var v = skillLvVal(s, c[0], i);
            if (v == null) return '<td>－</td>';
            if (c[0] === "pts") { spSum += v; return '<td>' + v + ' <span style="color:var(--text-faint);font-size:11.5px;">累計 ' + spSum + '</span></td>'; }
            if (c[0] === "reqLv") return '<td>Lv' + v + '</td>';
            if (c[0] === "dmg") return '<td>' + fmtNum(v) + (s.kind === "attack" ? '%' : '') + '</td>';
            if (c[0] === "crit") return '<td>+' + (Math.round(v * (i + 1) * 100) / 100) + '</td>';   // 遊戲 sC()：crit × 技能等級
            if (msCols[c[0]]) return '<td>' + (v ? skillSec(v) : '0') + '</td>';
            return '<td>' + fmtNum(v) + '</td>';
          }).join("") + '</tr>';
        }
        html += '</tbody></table></div>';
        var notes = [];
        var has = function (k) { return cols.some(function (c) { return c[0] === k; }); };
        if (has("castMs")) notes.push('<b>詠唱</b>：按下去到真的放出來要等的時間，詠唱中被打斷就放不出來。');
        if (has("recMs")) {
          var fixed = true;
          for (var k = 0; k < s.n; k++) { if (skillLvVal(s, "recMs", k) && !skillLvVal(s, "recFixed", k)) fixed = false; }
          notes.push('<b>收招</b>：放完之後不能做其他動作的時間。' + (fixed ? '這個技能的收招時間固定，不受攻速影響。'
            : '攻速越高越短：實際時間＝表上的時間 ×（1 − 0.0053 × 攻速），攻速最多算到 150（剩約 20%）。'));
        }
        if (has("hate")) notes.push('<b>仇恨</b>：打中時額外加在怪物對你的仇恨值上（平常仇恨＝造成的傷害），怪會去打仇恨最高的人。');
        if (has("crit")) notes.push('<b>必殺加成</b>：用這個技能時額外加的必殺值。');
        if (has("stagger")) notes.push('<b>破綻值</b>：打中時累積在怪物破綻量表上的量，集滿怪物會暫時無法行動、防禦下降。');
        if (notes.length) html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:8px;line-height:1.9;">' + notes.join('<br>') + '</div>';
      }
      $detail.innerHTML = html;
    });
  }

  // ---------- ⚒️ 鐵匠相關：發條強化／找雷分解（鎔解）／強硬分解 ----------
  var SMITH = window.SMITH || {};
  var smithLastTab = "enchant";
  function smithTabsHtml(active) {
    var tabs = [["enchant", "🔮 發條強化"], ["smelt", "🔥 找雷分解"]];
    if (SMITH.hardDecompose) tabs.push(["decompose", "💔 強硬分解"]);
    if (SMITH.ashtonConvert) tabs.push(["convert", "💠 艾希頓轉換"]);
    if (SMITH.sageTickets) tabs.push(["sage", "📜 賢者合成券"]);
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<button type="button" data-smith-tab="' + t[0] + '" style="padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;font-family:inherit;' +
        'border:1px solid ' + (on ? "var(--gold)" : "var(--line-hi)") + ';background:' + (on ? "var(--gold)" : "var(--ink-2)") + ';color:' + (on ? "var(--ink)" : "var(--text)") + ';">' + t[1] + '</button>';
    }).join("") + '</div>';
  }
  function openSmithTab(tab) {
    smithLastTab = tab || "enchant";
    currentView = { kind: "smith", id: smithLastTab };
    if (smithLastTab === "smelt") showSmeltPage();
    else if (smithLastTab === "decompose" && SMITH.hardDecompose) showHardDecomposePage();
    else if (smithLastTab === "convert" && SMITH.ashtonConvert) showAshtonConvertPage();
    else if (smithLastTab === "sage" && SMITH.sageTickets) showSageTicketPage();
    else { smithLastTab = "enchant"; showEnchantTable(); }
  }
  function smithNpcText(npcs) {
    return (npcs || []).map(function (n) { return escapeHtml(n.town) + '的「' + escapeHtml(n.npc) + '」'; }).join("、") || "（資料裡找不到 NPC）";
  }
  function goldHtml(n) { return bigNumHtml(n) + ' 金'; }

  // 找雷分解（鎔解）：規則照遊戲 smeltInput()／smeltRoll()，細節寫在 update_data.py 產生 smithIndex.js 那段
  var smeltPick = null;   // 目前選的裝備 id
  function smeltCost(itemId, refine) {
    var it = ITEMS[itemId];
    return Math.floor(((it && it.buy) || 0) * (5 + refine) * (10 + refine) / 50);
  }
  function smeltStoneChances(itemId, refine) {
    var sm = SMITH.smelt || {};
    var eq = ITEMS[itemId] && ITEMS[itemId].equip;
    var cut = sm.levelCut || [];
    var growth = sm.lvGrowth && sm.lvGrowth[itemId] != null ? sm.lvGrowth[itemId] : 1;
    var L = ((eq && eq.minLv) || 0) + (cut[Math.max(0, Math.min(cut.length - 1, refine))] || 0) * growth;
    var ws = (sm.stones || []).map(function (s) { return Math.max(0, s.base + s.perLevel * L + s.perRefine * refine); });
    var total = ws.reduce(function (a, b) { return a + b; }, 0);
    return { level: L, list: (sm.stones || []).map(function (s, i) { return { id: s.id, share: total > 0 ? ws[i] / total : 0 }; }) };
  }
  function showSmeltPage() {
    currentDetail = null;
    var sm = SMITH.smelt;
    var html = backButtonHtml() + smithTabsHtml("smelt");
    html += '<h2 style="margin-top:0;">🔥 找雷分解（鎔解）</h2>';
    if (!sm) {
      $detail.innerHTML = html + '<div class="empty-note">資料檔是舊版，請重新執行 update_data.py。</div>';
      return;
    }
    var succ = sm.success != null ? sm.success : 0.5;
    html += '<div class="equip-box" style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '・地點：' + smithNpcText(sm.npcs) + '（要人在村莊裡）。<br>' +
      '・只收 <b>+' + (sm.minRefine || 3) + ' 以上</b>、沒有上鎖的裝備。<br>' +
      '・費用 ＝ 裝備的購買價 ×（5＋精煉）×（10＋精煉）÷ 50，精煉越高越貴。<br>' +
      '・<b>成功率固定 ' + Math.round(succ * 100) + '%</b>；成功會得到 1 顆鎔解石，<b>失敗什麼都沒有</b>。<b>不管成功或失敗，裝備都會消失</b>、錢都會扣。<br>' +
      '・成功時拿到哪一種鎔解石，看裝備的等級和精煉值：等級越高、精煉越高，越容易出高級的鎔解石。' +
      '</div>';

    html += '<div class="section-title">試算</div>';
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">' +
      '<div class="item-picker" style="position:relative;flex:1;min-width:220px;max-width:420px;">' +
      '<input id="smeltSearch" type="text" placeholder="輸入裝備名稱，例如：艾希頓" autocomplete="off" value="' + (smeltPick && ITEMS[smeltPick] ? escapeHtml(ITEMS[smeltPick].name) : "") + '" ' +
      'style="width:100%;padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:4px;color:var(--text);font-size:14px;">' +
      '<div id="smeltSuggest" class="suggest" style="position:absolute;left:0;right:0;top:100%;z-index:20;background:var(--panel-hi);border:1px solid var(--line-hi);border-radius:4px;max-height:260px;overflow:auto;display:none;"></div>' +
      '</div></div>';
    html += '<div id="smeltResult"></div>';

    // 鎔解石的用途速查
    html += '<div class="section-title">鎔解石 <span class="count">（點名稱看用途）</span></div><div class="map-chip-row">' +
      (sm.stones || []).map(function (s) {
        var it = ITEMS[s.id];
        return itemChip(s.id, null, it ? '<span style="color:var(--text-faint);font-size:11.5px;">賣 ' + fmtNum(it.sell) + '</span>' : '');
      }).join("") + '</div>';
    $detail.innerHTML = html;

    var $s = document.getElementById("smeltSearch"), $sug = document.getElementById("smeltSuggest");
    $s.addEventListener("input", function () {
      var q = $s.value.trim();
      if (!q) { $sug.style.display = "none"; return; }
      var hits = [];
      Object.keys(ITEMS).some(function (id) {
        var it = ITEMS[id];
        if (it.equip && it.name.indexOf(q) !== -1 && !isTestItemName(it.name)) hits.push(id);
        return hits.length >= 30;
      });
      $sug.innerHTML = hits.length ? hits.map(function (id) {
        return '<div data-smelt-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:13px;">' + escapeHtml(ITEMS[id].name) +
          ' <span style="color:var(--text-faint);font-size:11.5px;">Lv' + (ITEMS[id].equip.minLv || 0) + '</span></div>';
      }).join("") : '<div style="padding:6px 10px;font-size:13px;color:var(--text-faint);">找不到這個名稱的裝備</div>';
      $sug.style.display = "block";
    });
    $sug.addEventListener("click", function (e) {
      var row = e.target.closest("[data-smelt-pick]");
      if (!row) return;
      smeltPick = row.getAttribute("data-smelt-pick");
      $s.value = ITEMS[smeltPick].name;
      $sug.style.display = "none";
      renderSmeltResult();
    });
    renderSmeltResult();
  }
  function renderSmeltResult() {
    var box = document.getElementById("smeltResult");
    if (!box) return;
    var sm = SMITH.smelt, succ = sm.success != null ? sm.success : 0.5;
    if (!smeltPick || !ITEMS[smeltPick]) {
      box.innerHTML = '<div class="empty-note" style="padding:0 0 6px;">輸入裝備名稱並從清單點選，會列出這件裝備從 +' + (sm.minRefine || 3) + ' 到 +12 鎔解的費用、各種鎔解石的機率和期望回收金額。</div>';
      return;
    }
    var it = ITEMS[smeltPick];
    var h = '<div class="equip-box"><div class="row1"><span class="slot">' + itemChip(smeltPick) + '</span>' +
      '<span class="badge">需求等級 ' + (it.equip.minLv || 0) + '</span><span class="badge">購買價 ' + fmtNum(it.buy) + '</span><span class="badge">直接賣掉 ' + fmtNum(it.sell) + ' 金</span></div>';
    var stones = sm.stones || [];
    h += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:640px;"><thead><tr><th>精煉</th><th>費用</th>' +
      stones.map(function (s) { return '<th style="text-align:center;">' + (ITEMS[s.id] ? escapeHtml(ITEMS[s.id].name) : '#' + s.id) + '</th>'; }).join("") +
      '<th>期望回收</th></tr></thead><tbody>';
    for (var r = sm.minRefine || 3; r <= 12; r++) {
      var ch = smeltStoneChances(smeltPick, r);
      var expValue = 0;
      h += '<tr><td>+' + r + '</td><td>' + goldHtml(smeltCost(smeltPick, r)) + '</td>' + ch.list.map(function (c) {
        var p = succ * c.share;
        expValue += p * ((ITEMS[c.id] && ITEMS[c.id].sell) || 0);
        return '<td style="text-align:center;"><span class="' + rateClassP(p) + '">' + (p > 0 ? pctP(p) : '－') + '</span></td>';
      }).join("") + '<td>' + fmtNum(Math.round(expValue)) + ' 金</td></tr>';
    }
    h += '</tbody></table></div>';
    h += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;line-height:1.7;">' +
      '表格的機率已經包含 ' + Math.round(succ * 100) + '% 的成功率（同一列加起來是 ' + Math.round(succ * 100) + '%，剩下的是失敗）。' +
      '「期望回收」是把鎔出的鎔解石直接賣給商店的平均收入，只供參考；鎔解石的真正價值在拿去做合成、融合材料。' +
      '裝備直接賣掉可以拿 ' + fmtNum(it.sell) + ' 金，鎔解一定會失去這件裝備。</div></div>';
    box.innerHTML = h;
  }

  // 強硬分解：規則照遊戲 decomposeInput()／decomposeStacks()
  var HARD_DEC_TIER = { 5: "一般", 10: ".G", 15: ".DG", 20: ".XG" };
  function hardDecChance(row, refine) {
    var bonus = refine > 0 && row.bonus ? (row.bonus[Math.min(refine, row.bonus.length) - 1] || 0) : 0;
    return Math.min(100, row.pct + bonus) / 100;
  }
  function showHardDecomposePage() {
    currentDetail = null;
    var hd = SMITH.hardDecompose;
    var product = hd.product, rows = hd.rows || [];
    var html = backButtonHtml() + smithTabsHtml("decompose");
    html += '<h2 style="margin-top:0;">💔 強硬分解 <span class="count">(' + rows.length + ' 件裝備)</span></h2>';
    html += '<div class="equip-box" style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '・地點：' + smithNpcText(hd.npcs) + '（要人在村莊裡）。<br>' +
      '・只收<b>艾希頓系列裝備</b>（下面的清單），上鎖的不會出現在分解清單。<br>' +
      '・每件付固定費用，有一定機率得到 1 個 ' + itemChip(product) + '；<b>失敗什麼都沒有，而且不管成功或失敗，裝備都會消失、錢都會扣</b>（遊戲畫面上沒有特別提醒）。<br>' +
      '・.XG 裝備的精煉值越高，機率越高（其他等級精煉不影響）。' +
      '</div>';

    // 依等級整理：費用、基本機率、平均要花多少錢換 1 個
    var tiers = {};
    rows.forEach(function (r) {
      var k = r.pct + "|" + r.cost;
      (tiers[k] || (tiers[k] = { pct: r.pct, cost: r.cost, rows: [], bonus: null })).rows.push(r);
      if (r.bonus) tiers[k].bonus = r.bonus;
    });
    var tierList = Object.keys(tiers).map(function (k) { return tiers[k]; }).sort(function (a, b) { return a.pct - b.pct; });
    html += '<div class="section-title">費用與機率</div>';
    html += '<table class="dtable"><thead><tr><th>裝備等級</th><th>件數</th><th>每件費用</th><th>機率</th><th>平均換到 1 個要花</th><th>平均要拆幾件</th></tr></thead><tbody>';
    tierList.forEach(function (t) {
      var p = t.pct / 100;
      html += '<tr><td>' + (HARD_DEC_TIER[t.pct] || (t.pct + "%")) + '</td><td>' + t.rows.length + '</td><td>' + goldHtml(t.cost) + '</td>' +
        '<td>' + t.pct + '%' + (t.bonus ? '（精煉加成見下表）' : '') + '</td><td>' + goldHtml(Math.round(t.cost / p)) + '</td><td>' + (1 / p).toFixed(1) + ' 件</td></tr>';
    });
    html += '</tbody></table>';

    var bonusTier = tierList.filter(function (t) { return t.bonus; })[0];
    if (bonusTier) {
      html += '<div class="section-title">' + (HARD_DEC_TIER[bonusTier.pct] || "") + ' 裝備的精煉加成</div>';
      html += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:560px;"><thead><tr><th>精煉</th><th>機率</th><th>平均換到 1 個要花</th><th>平均要拆幾件</th></tr></thead><tbody>';
      for (var rf = 0; rf <= bonusTier.bonus.length; rf++) {
        var pr = hardDecChance(bonusTier, rf);
        html += '<tr><td>+' + rf + '</td><td><span class="' + rateClassP(pr) + '">' + Math.round(pr * 100) + '%</span></td>' +
          '<td>' + goldHtml(Math.round(bonusTier.cost / pr)) + '</td><td>' + (1 / pr).toFixed(1) + ' 件</td></tr>';
      }
      html += '</tbody></table></div>';
    }

    // 凝結之魂拿來做什麼
    var uses = Object.keys(FORGE_BY_BOOK).filter(function (b) {
      return (FORGE_BY_BOOK[b].mats || []).some(function (m) { return String(m[0]) === String(product); });
    });
    if (uses.length) {
      html += '<div class="section-title">' + (ITEMS[product] ? escapeHtml(ITEMS[product].name) : "產物") + ' 的用途 <span class="count">(' + uses.length + ' 本製作書)</span></div>';
      var needs = uses.map(function (b) {
        return (FORGE_BY_BOOK[b].mats || []).filter(function (m) { return String(m[0]) === String(product); }).reduce(function (s, m) { return s + m[1]; }, 0);
      });
      html += '<div class="empty-note" style="padding:0 0 8px;">用來製作「渾沌的炙卡爾」「純白的坦柏特」系列裝備，每本製作書要 ' +
        Math.min.apply(null, needs) + (Math.max.apply(null, needs) !== Math.min.apply(null, needs) ? '～' + Math.max.apply(null, needs) : '') + ' 個。點製作書看完整材料和成功率：</div>';
      html += '<details><summary style="cursor:pointer;font-size:13px;margin-bottom:6px;">展開全部製作書</summary><div class="map-chip-row">' +
        uses.map(function (b, i) { return itemChip(b, null, '<span style="color:var(--text-faint);font-size:11.5px;">×' + needs[i] + '</span>'); }).join("") + '</div></details>';
    }

    // 全部可以分解的裝備，照系列排：一般／.G／.DG／.XG 四欄
    var series = {}, order = [];
    rows.forEach(function (r) {
      var name = ITEMS[r.item] ? ITEMS[r.item].name : ("#" + r.item);
      var base = name.replace(/\.(XG|DG|G)$/, "");
      if (!series[base]) { series[base] = {}; order.push(base); }
      series[base][r.pct] = r;
    });
    html += '<div class="section-title">可以分解的裝備 <span class="count">(' + order.length + ' 個系列)</span></div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:640px;"><thead><tr><th>裝備</th>' +
      tierList.map(function (t) { return '<th>' + (HARD_DEC_TIER[t.pct] || t.pct + "%") + '</th>'; }).join("") + '</tr></thead><tbody>';
    order.forEach(function (base) {
      html += '<tr><td>' + escapeHtml(base) + '</td>' + tierList.map(function (t) {
        var r = series[base][t.pct];
        if (!r) return '<td>－</td>';
        var it = ITEMS[r.item];
        return '<td><span class="name-link" data-goto-item="' + r.item + '">' + t.pct + '%</span>' +
          (it ? '<br><span style="font-size:11.5px;color:var(--text-faint);">直接賣 ' + fmtNum(it.sell) + ' 金</span>' : '') + '</td>';
      }).join("") + '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">點機率可以看那件裝備的詳細資料。「直接賣」是賣給商店的價錢，給你比較拆掉划不划算。</div>';
    $detail.innerHTML = html;
  }

  // 艾希頓轉換：規則照遊戲 convertInput()／convertStacks()
  function showAshtonConvertPage() {
    currentDetail = null;
    var ac = SMITH.ashtonConvert, rows = ac.rows || [];
    var html = backButtonHtml() + smithTabsHtml("convert");
    html += '<h2 style="margin-top:0;">💠 艾希頓轉換 <span class="count">(' + rows.length + ' 件裝備)</span></h2>';
    html += '<div class="equip-box" style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '・地點：' + smithNpcText(ac.npcs) + '（要人在村莊裡）。<br>' +
      '・只收 <b>.G 以上的艾希頓系列裝備</b>（下面的清單），上鎖的不會出現在清單。<br>' +
      '・每件用掉 1 張 ' + itemChip(ac.scroll) + '，<b>不用錢、必定成功</b>，換到 1 個對應等級的結晶；裝備會消失。<br>' +
      '・部分裝備有精煉門檻（下表），精煉不夠不能轉換。<br>' +
      '・同一件裝備也能拿去強硬分解換凝結之魂，兩邊只能選一邊。' +
      '</div>';

    // 依「產物 + 精煉門檻」整理
    var groups = {}, gOrder = [];
    rows.forEach(function (r) {
      var k = r.product + "|" + (r.refine || 0);
      if (!groups[k]) { groups[k] = { product: r.product, refine: r.refine || 0, rows: [] }; gOrder.push(k); }
      groups[k].rows.push(r);
    });
    var productOrder = [];
    rows.forEach(function (r) { if (productOrder.indexOf(r.product) < 0) productOrder.push(r.product); });
    gOrder.sort(function (a, b) {
      return productOrder.indexOf(groups[a].product) - productOrder.indexOf(groups[b].product) || groups[a].refine - groups[b].refine;
    });
    html += '<div class="section-title">換到什麼</div>';
    html += '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>換到</th><th>裝備精煉門檻</th><th>件數</th></tr></thead><tbody>';
    gOrder.forEach(function (k) {
      var g = groups[k];
      html += '<tr><td>' + itemChip(g.product) + '</td><td>' + (g.refine > 0 ? '+' + g.refine + ' 以上' : '不限') + '</td><td>' + g.rows.length + '</td></tr>';
    });
    html += '</tbody></table></div>';

    html += '<div class="section-title">可以轉換的裝備 <span class="count">(' + rows.length + ' 件)</span></div>';
    gOrder.forEach(function (k) {
      var g = groups[k];
      html += '<details><summary style="cursor:pointer;font-size:13px;margin-bottom:6px;">' +
        escapeHtml(ITEMS[g.product] ? ITEMS[g.product].name : "#" + g.product) + '・' + (g.refine > 0 ? '精煉 +' + g.refine + ' 以上' : '精煉不限') +
        '（' + g.rows.length + ' 件）</summary><div class="map-chip-row" style="margin-bottom:10px;">' +
        g.rows.map(function (r) { return itemChip(r.item); }).join("") + '</div></details>';
    });

    // 結晶拿來做什麼：賢者的合成券
    var sg = SMITH.sageTickets;
    if (sg) {
      html += '<div class="section-title">結晶的用途</div>';
      html += '<div class="empty-note" style="padding:0 0 8px;">拿來當「賢者的合成券」的材料，把炙卡爾／坦柏特裝備升一階：</div>';
      html += '<div class="map-chip-row">' + (sg.tickets || []).map(function (tk) {
        var need = (tk.mats || []).filter(function (m) { return productOrder.indexOf(m[0]) >= 0; });
        return itemChip(tk.item, null, need.map(function (m) {
          return '<span style="color:var(--text-faint);font-size:11.5px;">' + escapeHtml(ITEMS[m[0]] ? ITEMS[m[0]].name : "#" + m[0]) + ' ×' + m[1] + '</span>';
        }).join(" "));
      }).join("") + ' <span class="name-link" data-goto-smith="sage">看賢者合成券 →</span></div>';
    }
    $detail.innerHTML = html;
  }

  // 賢者的合成券：規則照遊戲 sageFuseInput()／sageFuse()
  function showSageTicketPage() {
    currentDetail = null;
    var sg = SMITH.sageTickets, tickets = sg.tickets || [];
    var html = backButtonHtml() + smithTabsHtml("sage");
    html += '<h2 style="margin-top:0;">📜 賢者合成券 <span class="count">(' + tickets.length + ' 種)</span></h2>';
    html += '<div class="equip-box" style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '・地點：' + smithNpcText(sg.npcs) + '（要人在村莊裡）。<br>' +
      '・只收<b>「渾沌的炙卡爾」「純白的坦柏特」系列裝備</b>，一張券把一件裝備升一階（一般 → .G → .DG → .XG）。<br>' +
      '・<b>必定成功</b>，不用鐵匠、不用合成技能；成功後<b>精煉歸零</b>。<br>' +
      '・條件：角色等級和裝備精煉都要達標，另外要付材料和金幣（下表）。' +
      '</div>';

    html += '<div class="section-title">每張券的條件與花費</div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:640px;"><thead><tr><th>合成券</th><th>角色等級</th><th>裝備精煉</th><th>材料</th><th>金幣</th><th>適用</th></tr></thead><tbody>';
    tickets.forEach(function (tk) {
      html += '<tr><td>' + itemChip(tk.item) + '</td><td>Lv' + tk.charLv + '</td><td>+' + tk.refine + ' 以上</td>' +
        '<td><div class="map-chip-row">' + (tk.mats || []).map(function (m) {
          return itemChip(m[0], null, '<span style="color:var(--text-faint);font-size:11.5px;">×' + m[1] + '</span>');
        }).join("") + '</div></td><td>' + goldHtml(tk.gold) + '</td><td>' + (tk.accepts || []).length + ' 件</td></tr>';
    });
    html += '</tbody></table></div>';

    // 每個系列一列：一般 → .G → .DG → .XG，照券的順序往上接
    var nextOf = {}, isTarget = {};
    tickets.forEach(function (tk, ti) {
      (tk.accepts || []).forEach(function (a) { nextOf[a[0]] = { to: a[1], ticket: ti }; isTarget[a[1]] = true; });
    });
    var chains = [];
    Object.keys(nextOf).forEach(function (id) {
      if (isTarget[id]) return;
      var chain = [Number(id)], cur = id;
      while (nextOf[cur] && chain.length <= tickets.length) { cur = nextOf[cur].to; chain.push(cur); }
      chains.push(chain);
    });
    chains.sort(function (a, b) { return a[0] - b[0]; });
    html += '<div class="section-title">適用的裝備 <span class="count">(' + chains.length + ' 個系列)</span></div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:640px;"><thead><tr><th>原本</th>' +
      tickets.map(function (tk) {
        return '<th>用 ' + escapeHtml(ITEMS[tk.item] ? ITEMS[tk.item].name : "#" + tk.item) + '</th>';
      }).join("") + '</tr></thead><tbody>';
    chains.forEach(function (chain) {
      html += '<tr>';
      for (var i = 0; i <= tickets.length; i++) {
        var eid = chain[i];
        html += '<td>' + (eid == null ? '－' : '<span class="name-link" data-goto-item="' + eid + '">' +
          escapeHtml(ITEMS[eid] ? ITEMS[eid].name : "#" + eid) + '</span>') + '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">點裝備名稱可以看那件裝備的詳細資料。</div>';
    $detail.innerHTML = html;
  }

  // 物品頁上的鐵匠分解提示：艾希頓裝備可以強硬分解／凝結之魂怎麼來／鎔解石怎麼來／艾希頓轉換／賢者合成券
  function smithItemNoteHtml(id) {
    var lines = [], tab = null;
    var ac = SMITH.ashtonConvert;
    if (ac) {
      var acRow = (ac.rows || []).filter(function (r) { return String(r.item) === String(id); })[0];
      if (acRow) {
        lines.push('💠 可以<b>轉換</b>：用 1 張 ' + itemChip(ac.scroll) + ' 換 1 個 ' + itemChip(acRow.product) +
          (acRow.refine > 0 ? '（要精煉 +' + acRow.refine + ' 以上）' : '') + '，必定成功，裝備消失。');
      }
      if ((ac.rows || []).some(function (r) { return String(r.product) === String(id); })) {
        lines.push('💠 取得方式：用 ' + itemChip(ac.scroll) + ' 把艾希頓系列裝備拿去<b>轉換</b>（' + smithNpcText(ac.npcs) + '）。');
      }
      if (String(ac.scroll) === String(id)) {
        lines.push('💠 用途：把 .G 以上的艾希頓系列裝備<b>轉換</b>成艾希頓的結晶（' + smithNpcText(ac.npcs) + '），一件用 1 張。');
      }
      if (lines.length) tab = "convert";
    }
    var sg = SMITH.sageTickets;
    if (sg) {
      var before = lines.length;
      (sg.tickets || []).forEach(function (tk) {
        var cost = (tk.mats || []).map(function (m) { return itemChip(m[0], null, '<span style="color:var(--text-faint);font-size:11.5px;">×' + m[1] + '</span>'); }).join("") +
          ' ＋ ' + goldHtml(tk.gold);
        if (String(tk.item) === String(id)) {
          lines.push('📜 用途：把 +' + tk.refine + ' 以上的炙卡爾／坦柏特裝備升一階（' + smithNpcText(sg.npcs) + '），角色要 Lv' + tk.charLv + '，另外要 ' + cost + '，必定成功。');
        }
        if ((tk.mats || []).some(function (m) { return String(m[0]) === String(id); })) {
          lines.push('📜 用途：' + itemChip(tk.item) + ' 的材料。');
        }
        (tk.accepts || []).forEach(function (a) {
          if (String(a[0]) === String(id)) {
            lines.push('📜 可以用 ' + itemChip(tk.item) + ' 升成 ' + itemChip(a[1]) + '：角色 Lv' + tk.charLv + '、精煉 +' + tk.refine + ' 以上，另外要 ' + cost + '，必定成功、精煉歸零。');
          }
          if (String(a[1]) === String(id)) {
            lines.push('📜 取得方式：' + itemChip(a[0]) + ' 用 ' + itemChip(tk.item) + ' 升上來（' + smithNpcText(sg.npcs) + '）。');
          }
        });
      });
      if (lines.length > before && !tab) tab = "sage";
    }
    var hd = SMITH.hardDecompose;
    if (hd) {
      var row = (hd.rows || []).filter(function (r) { return String(r.item) === String(id); })[0];
      if (row) {
        lines.push('💔 可以<b>強硬分解</b>：付 ' + goldHtml(row.cost) + '，' + row.pct + '% 機率得到 ' + itemChip(hd.product) +
          (row.bonus ? '（精煉越高機率越高，+12 可達 ' + Math.round(hardDecChance(row, 12) * 100) + '%）' : '') + '，失敗裝備一樣消失。');
      }
      if (String(hd.product) === String(id)) {
        lines.push('💔 取得方式：把艾希頓系列裝備拿去<b>強硬分解</b>（' + smithNpcText(hd.npcs) + '）。');
      }
    }
    var sm = SMITH.smelt;
    if (sm && (sm.stones || []).some(function (s) { return String(s.id) === String(id); })) {
      lines.push('🔥 取得方式：把 +' + (sm.minRefine || 3) + ' 以上的裝備拿去<b>找雷分解（鎔解）</b>（' + smithNpcText(sm.npcs) + '），裝備等級、精煉越高越容易出高級的。');
    }
    if (!lines.length) return "";
    if (!tab) tab = lines.some(function (l) { return l.indexOf("🔥") === 0; }) ? "smelt" : "decompose";
    return '<div class="equip-box" style="font-size:13px;line-height:1.9;margin-bottom:14px;">' + lines.join("<br>") +
      ' <span class="name-link" data-goto-smith="' + tab + '">看完整說明 →</span></div>';
  }

  function showEnchantTable(gradeIdx, winderOpen) {
    gradeIdx = gradeIdx || 0;
    var gradeNum = gradeIdx + 1; // ENCHANT_APPEARANCE / ENCHANT_VALUES 的 key 是 1-indexed (N=1)

    currentDetail = null;
    var html = smithTabsHtml("enchant") + '<h2 style="margin-top:0;">🔮 發條強化屬性表</h2>';
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

  // ---------- 防爆道具（艾彼雷歐系列，名品館賣）----------
  // 資料抄自遊戲 refine.json（2026-09-22 版）的 steps（失敗類型）與 guards，判斷規則照遊戲 bundle 的 yd()／xd()／Cd()：
  //   step n ＝ 從 +n 衝 +n+1；failKind 0＝只損失材料、1＝掉階、2＝碎掉、3＝一般裝備掉階／G 裝碎掉
  //   guard.when "destroy"＝這一階失敗會碎掉時才能用；"last-drop"＝這一階失敗掉階、下一階起會碎掉時才能用
  //   guard.target "special"＝只給特殊道具（合成出來的變異裝備及其 G 版）用，"plain"＝只給其他裝備用
  //   失敗時先擲 keepPct%：中了就退回 +toLevel，沒中就照這一階原本的失敗（碎掉或掉階）
  //   noStones＝不能跟鎔解石一起用
  var REFINE_FAIL_KIND = [0, 0, 0, 0, 0, 0, 1, 3, 2, 2, 2, 2]; // index ＝ step 0～11
  var REFINE_GUARDS = [
    { id: 8028, when: "last-drop", target: "plain", keepPct: 100, toLevel: 5, noStones: true },
    { id: 8027, when: "destroy", target: "plain", keepPct: 70, toLevel: 7, noStones: false },
    { id: 12362, when: "destroy", target: "special", keepPct: 80, toLevel: 6, noStones: false }
  ];
  function refineFailKind(step, gGear) {
    var k = REFINE_FAIL_KIND[step];
    return k === 2 ? "destroy" : k === 3 ? (gGear ? "destroy" : "drop") : k === 0 ? "none" : "drop";
  }
  function guardUsableAt(g, step, gGear, special) {
    if ((g.target === "special") !== special || REFINE_FAIL_KIND[step] === undefined) return false;
    var kind = refineFailKind(step, gGear);
    if (g.when === "destroy") return kind === "destroy";
    return kind === "drop" && REFINE_FAIL_KIND[step + 1] !== undefined && refineFailKind(step + 1, gGear) === "destroy";
  }
  // 能用的「目標精煉值」範圍，例如 "+9 ~ +12"
  function guardRangeText(g, gGear, special) {
    var lv = [];
    for (var s = 0; s < REFINE_FAIL_KIND.length; s++) if (guardUsableAt(g, s, gGear, special)) lv.push(s + 1);
    if (!lv.length) return "";
    return lv.length === 1 ? "+" + lv[0] : "+" + lv[0] + " ~ +" + lv[lv.length - 1];
  }
  function refineGuardHtml(id) {
    var g = REFINE_GUARDS.find(function (x) { return String(x.id) === String(id); });
    if (!g) return "";
    var where = [];
    if (g.target === "special") {
      var sp = guardRangeText(g, true, true);
      if (sp) where.push('特殊道具（合成出來的變異裝備）衝 <b>' + sp + '</b>');
    } else {
      var n = guardRangeText(g, false, false), gz = guardRangeText(g, true, false);
      if (n) where.push('一般裝備（N 裝）衝 <b>' + n + '</b>');
      if (gz) where.push('G 化／變異裝備（G 裝）衝 <b>' + gz + '</b>');
    }
    var effect = g.keepPct >= 100
      ? '失敗時 <b>100%</b> 退回 <b>+' + g.toLevel + '</b>' +
        (g.when === "destroy" ? '，裝備不會碎掉。' : '（沒用的話這一階失敗會掉更多階）。')
      : '失敗時 <b>' + g.keepPct + '%</b> 機率退回 <b>+' + g.toLevel + '</b>，其餘 ' + (100 - g.keepPct) + '% 照樣' +
        (g.when === "destroy" ? '<b>碎掉</b>' : '掉階') + '。';
    var html = '<div style="background:rgba(201,162,75,.12);border:1px solid var(--gold);border-radius:4px;padding:12px 14px;margin-bottom:18px;">' +
      '<div style="color:var(--gold-hi);font-weight:700;font-size:14px;margin-bottom:6px;">🛡️ 防爆道具（精煉失敗保護）</div>' +
      '<div style="font-size:13px;color:var(--text);line-height:1.75;">' +
      '<div>適用範圍：' + (where.length ? where.join('、') : '（目前沒有能用的精煉階段）') + '</div>' +
      '<div>防爆效果：' + effect + '</div>' +
      '<div>鎔解石：' + (g.noStones ? '<b>不能</b>一起使用' : '可以一起使用') + '</div>' +
      '<div style="color:var(--text-faint);font-size:12px;margin-top:4px;">用法：精煉時在「防爆」那欄勾選，一次消耗 1 個（成功或失敗都會用掉）。找村莊的「黑市商人」開名品館購買。</div>' +
      '</div></div>';
    return html;
  }

  // ---------- 只在特定 NPC／功能頁才有用的道具（精煉材料、鎔解石、鎔解燃料與催化劑、古代英雄碎片與兌換卷）----------
  // 資料抄自遊戲 refine.json／hero.json（2026-09-22 版），規則照遊戲 bundle：
  //   精煉 refineStack()：每一階固定吃一種寶石（steps[].material）；勾了任何鎔解石就多付 advancedCost 金幣，
  //     鎔解石只對「寶石相同」的那幾階有效（_d()），不同顏色可以一起勾、加成相加（vd()）
  //   鐵匠〔鎔解〕meltStack()：只有一轉是鐵匠才能用；+5 以上、而且精煉值 ≤ 4＋技能等級（iv()）的裝備才能熔；
  //     燃料看部位（nv()），數量＝max(1, 裝備等級÷10 取整)（rv()）；每放 1 種催化劑，每一個產出機率 +10%（sv()）
  //   鑄煉鎔解 smeltStack()：+3 以上裝備、付金幣，50% 機率拿到 1 顆鎔解石（gv()），裝備等級／精煉越高越容易出高級的
  //   古代英雄 exchangeHeroShards()／redeemHeroGear()：碎片 10 片換 5 張兌換卷；第 3 篇起 300 片換 1 個翅膀材料；
  //     兌換卷 1 張換 1 件「自己一轉職業」的古代英雄裝備，拿到就是 +8
  var REFINE_STEP_MATERIAL = [432, 432, 432, 433, 433, 433, 434, 434, 434, 3981, 3981, 3981]; // index ＝ step（從 +n 衝 +n+1）
  var REFINE_STONES = [
    { id: 3693, gem: 433, bonus: 5 }, { id: 3694, gem: 433, bonus: 20 },
    { id: 3695, gem: 434, bonus: 10 }, { id: 3696, gem: 434, bonus: 20 },
    { id: 6859, gem: 3981, bonus: 10 }
  ];
  var REFINE_ADV_COST = 10000;
  var MELT_FUELS = [
    { id: 5158, slots: "武器、盾" }, { id: 5157, slots: "頭、身體、腿、腳" }, { id: 5155, slots: "飾品等其他部位" }
  ];
  var MELT_CATALYSTS = [3643, 3644];
  var HERO_CHAPTERS = [
    { chapter: 1, shard: 20578, voucher: 20571, tier: 20, material: null },
    { chapter: 2, shard: 20579, voucher: 20572, tier: 40, material: null },
    { chapter: 3, shard: 20580, voucher: 20573, tier: 60, material: 20585 },
    { chapter: 4, shard: 20581, voucher: 20574, tier: 80, material: 20586 },
    { chapter: 5, shard: 20582, voucher: 20575, tier: 100, material: 20587 },
    { chapter: 6, shard: 20583, voucher: 20576, tier: 120, material: 20588 },
    { chapter: 7, shard: 20584, voucher: 20577, tier: 140, material: 20589 }
  ];
  var HERO_RULES = { shardsPerTrade: 10, vouchersPerTrade: 5, shardsPerMaterial: 300, gearRefine: 8 };

  // 某種寶石負責的精煉範圍，例如 432 → "+1 ~ +3"
  function refineMaterialRange(gemId) {
    var lv = [];
    REFINE_STEP_MATERIAL.forEach(function (m, step) { if (m === gemId) lv.push(step + 1); });
    if (!lv.length) return "";
    return lv.length === 1 ? "+" + lv[0] : "+" + lv[0] + " ~ +" + lv[lv.length - 1];
  }
  function npcUseBox(title, lines, foot) {
    return '<div style="background:rgba(201,162,75,.12);border:1px solid var(--gold);border-radius:4px;padding:12px 14px;margin-bottom:18px;">' +
      '<div style="color:var(--gold-hi);font-weight:700;font-size:14px;margin-bottom:6px;">' + title + '</div>' +
      '<div style="font-size:13px;color:var(--text);line-height:1.75;">' +
      lines.map(function (l) { return '<div>' + l + '</div>'; }).join('') +
      (foot ? '<div style="color:var(--text-faint);font-size:12px;margin-top:4px;">' + foot + '</div>' : '') +
      '</div></div>';
  }
  function npcItemUsesHtml(id) {
    id = Number(id);
    var html = "";

    // 精煉寶石
    var range = refineMaterialRange(id);
    if (range) {
      var stones = REFINE_STONES.filter(function (s) { return s.gem === id; });
      html += npcUseBox('🔨 精煉材料（打鐵舖・精煉）', [
        '裝備精煉衝 <b>' + range + '</b> 時，每精煉一次消耗 1 個。',
        stones.length ? '這幾階可以加的鎔解石：' + stones.map(function (s) { return itemChip(s.id) + '（成功率 +' + s.bonus + '%）'; }).join('、') : ''
      ].filter(Boolean), '鐵匠用〔鎔解〕熔掉 +5 以上的裝備也可能熔出寶石。戰寵裝備的精煉一樣吃這些寶石。');
    }

    // 鎔解石
    var stone = REFINE_STONES.find(function (s) { return s.id === id; });
    if (stone) {
      var others = REFINE_STONES.filter(function (s) { return s.gem === stone.gem && s.id !== stone.id; });
      html += npcUseBox('🔨 鎔解石（打鐵舖・精煉加成功率）', [
        '精煉衝 <b>' + refineMaterialRange(stone.gem) + '</b>（吃 ' + itemChip(stone.gem) + ' 的那幾階）時勾選，成功率 <b>+' + stone.bonus + '%</b>。',
        others.length ? '可以跟 ' + others.map(function (s) { return itemChip(s.id) + '（+' + s.bonus + '%）'; }).join('、') + ' 一起勾，加成相加。' : '',
        '只要勾了鎔解石，每次精煉多付 <b>' + fmtNum(REFINE_ADV_COST) + '</b> 金幣（進階合成費），勾幾顆都一樣。',
        '每次精煉每種鎔解石消耗 1 顆（成功或失敗都會用掉）。不能跟 ' + itemChip(8028) + ' 一起用。'
      ].filter(Boolean), '除了下面列的掉落／開箱，也可以到雪山礦村的「雷」（鑄煉鎔解）把 +3 以上的裝備拿去鑄煉，有 50% 機率得到 1 顆，裝備等級和精煉值越高越容易出高級的。');
    }

    // 鎔解燃料
    var fuel = MELT_FUELS.find(function (f) { return f.id === id; });
    if (fuel) {
      html += npcUseBox('🔥 鎔解燃料（鐵匠〔鎔解〕）', [
        '鐵匠用〔鎔解〕熔掉<b>' + fuel.slots + '</b>時的燃料。',
        '每熔一件消耗 <b>裝備等級 ÷ 10</b> 個（無條件捨去，最少 1 個），例如 Lv85 的裝備要 8 個。',
        '其他部位用的燃料：' + MELT_FUELS.filter(function (f) { return f.id !== id; }).map(function (f) { return itemChip(f.id) + '（' + f.slots + '）'; }).join('、') + '。'
      ], '只有一轉是鐵匠才能鎔解；要 +5 以上、而且精煉值不超過「4＋〔鎔解〕等級」的裝備才能熔。熔完裝備會消失，換成 ' +
        itemChip(432) + '、' + itemChip(433) + '、' + itemChip(434) + '（精煉越高越容易出高級寶石）。');
    }

    // 鎔解催化劑
    if (MELT_CATALYSTS.indexOf(id) !== -1) {
      html += npcUseBox('🔥 鎔解催化劑（鐵匠〔鎔解〕）', [
        '鐵匠用〔鎔解〕熔裝備時可以勾選，每一種產出的機率都 <b>+10%</b>。',
        '可以跟 ' + MELT_CATALYSTS.filter(function (c) { return c !== id; }).map(function (c) { return itemChip(c); }).join('、') + ' 一起放，兩種都放就是 +20%。',
        '每熔一件每種消耗 1 個。'
      ], '只有一轉是鐵匠才能鎔解。');
    }

    // 古代英雄碎片／兌換卷
    HERO_CHAPTERS.forEach(function (c) {
      if (c.shard === id) {
        html += npcUseBox('📜 古代英雄碎片（古代英雄 NPC）', [
          '<b>' + HERO_RULES.shardsPerTrade + '</b> 片換 <b>' + HERO_RULES.vouchersPerTrade + '</b> 張 ' + itemChip(c.voucher) + '。',
          c.material ? '<b>' + HERO_RULES.shardsPerMaterial + '</b> 片換 1 個 ' + itemChip(c.material) + '。' : ''
        ].filter(Boolean), '在村莊找古代英雄系列的 NPC（例如「古代英雄神話初學者」）兌換，一次可以換多組。');
      }
      if (c.voucher === id) {
        html += npcUseBox('📜 古代英雄裝備兌換卷（古代英雄 NPC）', [
          '1 張換 1 件 Lv' + c.tier + ' 的古代英雄裝備，拿到就是 <b>+' + HERO_RULES.gearRefine + '</b>。',
          '只能選<b>自己一轉職業</b>的那一套（每個職業 5 件可以挑）。',
          '由 ' + itemChip(c.shard) + ' ' + HERO_RULES.shardsPerTrade + ' 片換 ' + HERO_RULES.vouchersPerTrade + ' 張。'
        ], '在村莊找古代英雄系列的 NPC 兌換。');
      }
    });
    return html;
  }

  // ---------- G 化／變異合成（資料：希望/fusionIndex.js，規則照遊戲 fuseStack／fusionView／mg／cg）----------
  var FUSION = window.FUSION || null;
  var FUSION_KIND_ORDER = ["g", "hit", "crit", "speed"];
  var FUSION_KIND_LABEL = { g: "G 化", hit: "命中型", crit: "必殺型", speed: "攻速型" }; // 跟遊戲按鈕上的字一樣
  var FUSION_REFINE_MULT = { 5: 1, 6: 1.1, 7: 1.2, 8: 1.5, 9: 2, 10: 2.5, 11: 3, 12: 3.5 }; // 輔G裝備的精煉倍率（遊戲 og）
  var FUSION_TIER_MULT = { g: 2, dg: 4, xg: 6 };                                              // 輔G裝備的階級倍率（遊戲 ig）
  var FUSION_TIER_LABEL = { n: "N 裝", g: "G 裝", dg: "DG 裝", xg: "XG 裝", variant: "變異型（命中／必殺／攻速）" };
  // 1 PT 換多少 %：裝備等級越高越少（遊戲 pg = 100 / (43.3 + 0.3806 × 等級)）
  function fusionPtFactor(lv) { return 100 / (43.3 + 0.3806 * Math.max(0, lv || 0)); }
  // 成功率（遊戲 mg）：min(上限, (書的基礎% + PT × 換算) × (1 + 技能加成%))
  function fusionRate(base, bonusPct, pt, lv) {
    var cap = (FUSION && FUSION.cap) || 90;
    return Math.min(cap, (base + Math.max(0, pt) * fusionPtFactor(lv)) * (1 + Math.max(0, bonusPct) / 100));
  }
  // 輔G裝備的 PT（遊戲 cg）：+5 以上才有，看裝備等級、階級、精煉；最後無條件捨去到 0.5
  function fusionGearPt(tier, lv, refine) {
    var r = FUSION_REFINE_MULT[refine];
    if (r === undefined || refine < 5 || !(lv > 0)) return 0;
    var i = Math.sqrt(lv);
    var base = tier === "n" ? Math.floor(i)
      : tier === "variant" ? Math.floor(i) + 2
      : Math.floor(i * FUSION_TIER_MULT[tier] * 2) / 2;
    return Math.floor(base * r * 2) / 2;
  }
  function fusionSlotGroup(slot) {
    if (slot === "weapon") return "weapon";
    if (["head", "body", "legs", "feet", "shield"].indexOf(slot) !== -1) return "armor";
    return "accessory";
  }
  // 遊戲 wv：同種類、equipLvCap >= 裝備等級的書都能用；排序是成功率高的在前，同成功率卷數小的在前
  function fusionBooksFor(kind, minLv) {
    return ((FUSION && FUSION.books) || []).filter(function (b) {
      return b.kind === kind && b.equipLvCap >= minLv;
    }).sort(function (a, b) { return b.rate - a.rate || (a.vol == null ? 99 : a.vol) - (b.vol == null ? 99 : b.vol) || a.item - b.item; });
  }
  var fusionSourceIndex = null; // 目標裝備 id → [{from, kind}]，第一次用到才建
  function fusionSourcesOf(id) {
    if (!FUSION) return [];
    if (!fusionSourceIndex) {
      fusionSourceIndex = {};
      Object.keys(FUSION.targets).forEach(function (from) {
        var t = FUSION.targets[from];
        FUSION_KIND_ORDER.forEach(function (k) {
          if (t[k] != null) (fusionSourceIndex[t[k]] = fusionSourceIndex[t[k]] || []).push({ from: from, kind: k });
        });
      });
    }
    return fusionSourceIndex[id] || [];
  }
  // 資料裡同一種材料有時會拆成好幾筆（例如鑽石 ×1、鑽石 ×1），遊戲扣的是加總，顯示時合併
  function fusionMergedMats(mats) {
    var order = [], sum = {};
    (mats || []).forEach(function (m) {
      if (!(m[0] in sum)) { order.push(m[0]); sum[m[0]] = 0; }
      sum[m[0]] += m[1];
    });
    return order.map(function (id) { return [id, sum[id]]; });
  }
  function fusionBonusSkill(kind) { return kind === "g" ? FUSION.growSkill : FUSION.variantSkill; }

  function fusionSectionHtml(id, eq) {
    if (!FUSION) return "";
    var t = FUSION.targets[id] || {};
    var kinds = FUSION_KIND_ORDER.filter(function (k) { return t[k] != null; });
    var sources = fusionSourcesOf(id);
    if (!kinds.length && !sources.length && !t.noFuse) return "";

    var html = '<details class="fold-section"><summary class="section-title">G 化／變異合成' +
      '<span class="fold-hint">點擊展開</span></summary>';
    if (sources.length) {
      html += '<div class="empty-note" style="padding:0 0 10px;">這件可以由 ' + sources.map(function (s) {
        return itemChip(s.from, null, '<span class="group-tag">' + FUSION_KIND_LABEL[s.kind] + '</span>');
      }).join(' ') + ' 合成出來。</div>';
    }
    if (t.noFuse) {
      html += '<div class="empty-note" style="padding:0 0 10px;">⚠️ 這件裝備不能 G 化（遊戲裡會顯示「這件不能 G 化」）。</div>';
    }
    if (kinds.length && !t.noFuse) {
      var skill = FUSION.slotSkill && FUSION.slotSkill[fusionSlotGroup(eq.slot)];
      html += '<div class="empty-note" style="padding:0 0 10px;line-height:1.8;">在村莊鐵匠組合長的「G 化」分頁製作，<b>只有鐵匠職業</b>做得了，' +
        '要先學〔' + escapeHtml(skill ? skill.name : "合成") + '〕。失敗的話<b>整件裝備消失</b>；成功會變成目標裝備，但精煉值歸零。' +
        '成功率最高 ' + FUSION.cap + '%，可以放「輔 G」（精煉材料，或 +5 以上的非配件裝備）往上加，下面有試算。</div>';
      // 類型分頁（G 化／命中型／必殺型／攻速型）：一次只顯示一種的書單，下面試算的「種類」也會跟著切
      if (kinds.length > 1) {
        html += '<div class="fusion-kind-tabs" data-fusion-tabs="' + id + '">' + kinds.map(function (k, i) {
          return '<button type="button" class="hint-chip' + (i === 0 ? ' active' : '') + '" data-fusion-tab="' + k + '">' + FUSION_KIND_LABEL[k] + '</button>';
        }).join('') + '</div>';
      }
      kinds.forEach(function (k, idx) {
        var books = fusionBooksFor(k, eq.minLv);
        html += '<div class="equip-box" data-fusion-kind="' + k + '"' + (idx === 0 ? '' : ' style="display:none;"') + '>' +
          '<div class="row1"><span><span class="slot">' + FUSION_KIND_LABEL[k] + '</span>　成品：' + itemChip(t[k]) + '</span>' +
          '<span class="badge">' + books.length + ' 本書可用</span></div>';
        if (!books.length) {
          html += '<div class="empty-note">沒有等級上限夠的融合書。</div></div>';
          return;
        }
        html += '<div style="overflow-x:auto;"><table class="dtable fusion-books"><thead><tr>' +
          '<th>融合書</th><th>基礎成功率</th><th>需精煉</th><th>輔G格</th><th>費用</th></tr></thead><tbody>';
        books.forEach(function (b) {
          var req = ['角色 Lv' + b.charLv, '力量 ' + b.strMin, '〔' + (skill ? skill.name : '合成') + '〕Lv' + b.skillLv];
          // 遊戲資料裡有幾本（例如 G 篇第 18～20 卷）沒有材料、費用也是 0，看起來是作者還沒填完
          var unfinished = !b.gold && !(b.mats || []).length;
          html += '<tr class="fusion-book-row">' +
            '<td>' + itemChip(b.item) + (unfinished ? ' <span class="group-tag" title="遊戲資料裡這本沒有材料、費用也是 0，可能還沒開放">資料未填</span>' : '') + '</td>' +
            '<td><span class="rate">' + b.rate + '%</span></td>' +
            '<td>+' + b.refine + '</td>' +
            '<td>' + b.auxSlots + '</td>' +
            '<td>' + (b.gold ? bigNumHtml(b.gold) : '免費') + '</td>' +
            '</tr>' +
            '<tr class="fusion-mats-row"><td colspan="5">' +
            '<span class="fusion-req">需求：' + escapeHtml(req.join('・')) + '</span>' +
            '<span class="fusion-req">材料：</span>' + ((b.mats || []).length
              ? fusionMergedMats(b.mats).map(function (m) { return itemChip(m[0], m[1]); }).join(' ')
              : '<span class="fusion-req">（無）</span>') +
            '</td></tr>';
        });
        html += '</tbody></table></div></div>';
      });
      html += fusionSimHtml(id, eq, kinds);
    }
    html += '</details>';
    return html;
  }

  // 成功率試算：選書、技能等級、輔G，即時算出成功率（跟遊戲 G 化頁顯示的數字同一套公式）
  function fusionSimHtml(id, eq, kinds) {
    var html = '<div class="equip-box fusion-sim" data-fusion-sim="' + id + '" data-lv="' + eq.minLv + '">' +
      '<div class="row1"><span class="slot">🧮 成功率試算</span>' +
      '<span class="badge">這件 Lv' + eq.minLv + '：每 1 PT ≈ +' + fusionPtFactor(eq.minLv).toFixed(2) + '%</span></div>' +
      '<div class="fusion-sim-grid">' +
      '<label>種類<select data-f="kind">' + kinds.map(function (k) { return '<option value="' + k + '">' + FUSION_KIND_LABEL[k] + '</option>'; }).join('') + '</select></label>' +
      '<label>融合書<select data-f="book"></select></label>' +
      '<label><span data-f="skill-name"></span><select data-f="skill"></select></label>' +
      '</div>' +
      '<div data-f="aux" style="margin-top:10px;"></div>' +
      '<div data-f="result" class="fusion-sim-result"></div>' +
      '</div>';
    return html;
  }

  function wireFusionSim(root) {
    if (!FUSION || !root) return;
    root.querySelectorAll("[data-fusion-sim]").forEach(function (box) {
      var lv = Number(box.getAttribute("data-lv")) || 0;
      var $kind = box.querySelector('[data-f="kind"]');
      var $book = box.querySelector('[data-f="book"]');
      var $skill = box.querySelector('[data-f="skill"]');
      var $skillName = box.querySelector('[data-f="skill-name"]');
      var $aux = box.querySelector('[data-f="aux"]');
      var $result = box.querySelector('[data-f="result"]');
      var gemOptions = FUSION.gems.map(function (g) {
        var it = ITEMS[g.id];
        return '<option value="gem:' + g.id + '">' + escapeHtml(it ? it.name : ('#' + g.id)) + '（' + (Math.round(g.pt * 100) / 100) + ' PT）</option>';
      }).join('');
      var auxState = []; // 每一格：{type:"", "gem", "gear", gemId, tier, lv, refine}

      function currentBook() {
        var books = fusionBooksFor($kind.value, lv);
        return books.find(function (b) { return String(b.item) === $book.value; }) || books[0];
      }
      function fillBooks() {
        var books = fusionBooksFor($kind.value, lv);
        $book.innerHTML = books.map(function (b) {
          var it = ITEMS[b.item];
          return '<option value="' + b.item + '">' + escapeHtml(it ? it.name : ('#' + b.item)) + '（基礎 ' + b.rate + '%・' + b.auxSlots + ' 格）</option>';
        }).join('');
        var sk = fusionBonusSkill($kind.value);
        $skillName.textContent = '〔' + sk.name + '〕等級';
        var prev = Number($skill.value) || 0;
        $skill.innerHTML = '<option value="0">沒學（+0%）</option>' + sk.levels.map(function (v, i) {
          return '<option value="' + (i + 1) + '">Lv' + (i + 1) + '（+' + v + '%）</option>';
        }).join('');
        $skill.value = String(Math.min(prev, sk.levels.length));
      }
      function renderAux() {
        var book = currentBook();
        var slots = book ? book.auxSlots : 0;
        auxState.length = Math.min(auxState.length, slots);
        while (auxState.length < slots) auxState.push({ type: "" });
        $aux.innerHTML = '<div style="font-size:12.5px;color:var(--text-dim);margin-bottom:6px;">輔 G（這本書有 ' + slots + ' 格；配件不能當輔 G，裝備要 +5 以上）</div>' +
          auxState.map(function (a, i) {
            var html = '<div class="fusion-aux-row" data-slot="' + i + '"><span class="fusion-aux-no">' + (i + 1) + '</span>' +
              '<select data-a="pick"><option value="">（空）</option>' + gemOptions + '<option value="gear">裝備（自己填）</option></select>';
            if (a.type === "gear") {
              html += '<select data-a="tier">' + Object.keys(FUSION_TIER_LABEL).map(function (k) {
                return '<option value="' + k + '"' + (a.tier === k ? ' selected' : '') + '>' + FUSION_TIER_LABEL[k] + '</option>';
              }).join('') + '</select>' +
                '<label class="fusion-aux-lv">Lv<input type="number" data-a="lv" min="1" max="300" value="' + (a.lv || lv || 1) + '"></label>' +
                '<select data-a="refine">' + [5, 6, 7, 8, 9, 10, 11, 12].map(function (r) {
                  return '<option value="' + r + '"' + ((a.refine || 5) === r ? ' selected' : '') + '>+' + r + '</option>';
                }).join('') + '</select>';
            }
            html += '<span class="fusion-aux-pt" data-a="pt"></span></div>';
            return html;
          }).join('');
        auxState.forEach(function (a, i) {
          var row = $aux.querySelector('[data-slot="' + i + '"]');
          var pick = row.querySelector('[data-a="pick"]');
          pick.value = a.type === "gem" ? "gem:" + a.gemId : a.type === "gear" ? "gear" : "";
          pick.addEventListener("change", function () {
            if (pick.value === "gear") { a.type = "gear"; a.tier = a.tier || "n"; a.lv = a.lv || lv || 1; a.refine = a.refine || 7; }
            else if (pick.value) { a.type = "gem"; a.gemId = Number(pick.value.slice(4)); }
            else a.type = "";
            renderAux();
          });
          ["tier", "lv", "refine"].forEach(function (f) {
            var el = row.querySelector('[data-a="' + f + '"]');
            if (!el) return;
            el.addEventListener(f === "lv" ? "input" : "change", function () {
              a[f] = f === "tier" ? el.value : Number(el.value) || 0;
              compute();
            });
          });
        });
        compute();
      }
      function auxPt(a) {
        if (a.type === "gem") {
          var g = FUSION.gems.find(function (x) { return x.id === a.gemId; });
          return g ? g.pt : 0;
        }
        if (a.type === "gear") return fusionGearPt(a.tier, a.lv, a.refine);
        return 0;
      }
      function compute() {
        var book = currentBook();
        if (!book) { $result.textContent = "沒有可用的融合書"; return; }
        var sk = fusionBonusSkill($kind.value);
        var skLv = Number($skill.value) || 0;
        var bonus = skLv > 0 ? (sk.levels[skLv - 1] || 0) : 0;
        var pt = 0;
        auxState.forEach(function (a, i) {
          var p = auxPt(a);
          pt += p;
          var el = $aux.querySelector('[data-slot="' + i + '"] [data-a="pt"]');
          if (el) el.textContent = a.type ? (Math.round(p * 100) / 100) + ' PT' : '';
        });
        var rate = fusionRate(book.rate, bonus, pt, lv);
        var raw = (book.rate + pt * fusionPtFactor(lv)) * (1 + bonus / 100);
        var capped = raw > FUSION.cap;
        // 還差多少 PT 才到上限（給玩家參考要再塞多少輔G）
        var needPt = Math.max(0, (FUSION.cap / (1 + bonus / 100) - book.rate) / fusionPtFactor(lv) - pt);
        $result.innerHTML = '成功率 <b class="fusion-rate">' + (Math.round(rate * 10) / 10) + '%</b>' +
          '<span class="fusion-formula">＝（基礎 ' + book.rate + '% ＋ 輔G ' + (Math.round(pt * 100) / 100) + ' PT × ' + fusionPtFactor(lv).toFixed(3) + '%）' +
          (bonus ? ' × (1 ＋ ' + bonus + '%)' : '') + (capped ? '，超過上限以 ' + FUSION.cap + '% 計' : '') + '</span>' +
          (!capped && needPt > 0 ? '<span class="fusion-formula">要到 ' + FUSION.cap + '% 還差約 ' + (Math.ceil(needPt * 10) / 10) + ' PT</span>' : '');
      }
      // 上面的類型分頁跟試算的「種類」互相同步
      var section = box.closest("details") || root;
      function showKind(k) {
        section.querySelectorAll("[data-fusion-kind]").forEach(function (el) {
          el.style.display = el.getAttribute("data-fusion-kind") === k ? "" : "none";
        });
        section.querySelectorAll("[data-fusion-tab]").forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-fusion-tab") === k);
        });
      }
      section.querySelectorAll("[data-fusion-tab]").forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-fusion-tab");
          showKind(k);
          if ($kind.value !== k) { $kind.value = k; fillBooks(); renderAux(); }
        });
      });
      $kind.addEventListener("change", function () { showKind($kind.value); fillBooks(); renderAux(); });
      $book.addEventListener("change", renderAux);
      $skill.addEventListener("change", compute);
      fillBooks();
      renderAux();
    });
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
      '<div class="detail-title">' + itemIconHtml(id, 64) + escapeHtml(item.name) + '</div>' +
      '<div class="detail-sub">物品編號 #' + id + '</div>' +
      (ITEM_DESC[id] ? '<div class="detail-sub" style="margin-top:6px;font-style:italic;white-space:pre-line;">' + escapeHtml(ITEM_DESC[id]) + '</div>' : '') +
      '</div></div>';

    html += '<div class="price-row">' +
      '<span>販售價 <b>' + fmtNum(item.sell) + '</b></span>' +
      '<span>購買價 <b>' + fmtNum(item.buy) + '</b></span>' +
      '</div>';

    html += refineGuardHtml(id);
    html += potionNoteHtml(id);
    html += smithItemNoteHtml(id);
    html += npcItemUsesHtml(id);

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
      // 特殊用途道具：標題可以點開／收合下面的用途說明（預設收合），標題會放大再縮回一次提醒使用者
      if (special) {
        html += '<details class="special-use">' +
          '<summary><span class="special-use-title">⚠️ 這是特殊用途道具，不要隨便賣掉／丟掉</span><span class="special-use-hint"></span></summary>' +
          '<div class="special-use-body">';
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
      if (special) html += '</div></details>';
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
      html += fusionSectionHtml(id, eq);
    }

    var shopEntries = (SHOP_INDEX[id] || []).slice().sort(function (a, b) { return a.price - b.price; });
    var mallEntry = MALL_INDEX.items[id];
    html += '<div class="section-title">販售商店 <span class="count">(' + shopEntries.length + ')</span></div>';
    if (!shopEntries.length) {
      html += '<div class="empty-note">' + (mallEntry ? '一般商店沒有賣，但可以在下面的名品館（黑市商人）買。'
        : '沒有商店販售這個物品（可能只能靠掉落、任務或製作取得）。') + '</div>';
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
    html += mallSectionHtml(id);

    var radixEntries = (RADIX_INDEX[id] || []).slice();
    if (radixEntries.length) {
      var tokenName = MISSION_TOKEN_ITEM_ID != null ? (ITEMS[MISSION_TOKEN_ITEM_ID] ? ITEMS[MISSION_TOKEN_ITEM_ID].name : "R代幣") : "R代幣";
      html += '<div class="section-title">拉迪克斯（希望路線商店） <span class="count">(' + radixEntries.length + ')</span></div>';
      html += '<table class="dtable"><thead><tr><th>NPC</th><th>地點</th><th>價格</th></tr></thead><tbody>';
      radixEntries.forEach(function (s) {
        html += '<tr>' +
          '<td><span class="name-link" style="cursor:default;">' + escapeHtml(s.npc) + '</span>' +
          (s.group ? '<br><span class="group-tag" title="這一區只有穿得上成品的職業才看得到">' + escapeHtml(s.group) + '</span>' : '') + '</td>' +
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
      html += boxTiersHtml(box);
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

    html += exchangeSectionHtml(id);
    html += extraSourcesHtml(id);
    html += gemSectionHtml(id);
    html += stoneSectionHtml(id);

    var questRefs = buildQuestReferences(id);
    var isDailyToken = DAILY.quests.length > 0 && MISSION_TOKEN_ITEM_ID != null && Number(id) === MISSION_TOKEN_ITEM_ID;
    html += '<div class="section-title">任務關聯 <span class="count">(' + (questRefs.quests.length + questRefs.missions.length + (isDailyToken ? 1 : 0)) + ')</span></div>';
    if (isDailyToken) html += renderDailyTokenCard();
    if (!questRefs.quests.length && !questRefs.missions.length) {
      if (!isDailyToken) html += '<div class="empty-note">這個物品跟任務／藍圖任務系統沒有關聯。</div>';
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
      var showAdj = dropAdjActive();
      var decayMons = 0; // 這頁有幾隻怪會被等級差衰減（沒有的話，勾鐵匠本來就不會變）
      // 同一隻怪可能在好幾組都有這件物品，合併成一列（機率相加，遊戲 El() 也是這樣算）
      var dropRows = [], seenMon = {};
      drops.forEach(function (d) {
        var mon = MONSTERS[String(d.m)];
        if (!mon || seenMon[d.m]) return;
        seenMon[d.m] = true;
        var base = monsterDropChances(mon, 1)[id];
        if (!base) return;
        var adj = showAdj ? monsterDropChances(mon, playerDropMultiplier(mon))[id] : null;
        if (dropCalcState.level != null && dropLevelMultiplier(dropCalcState.level, mon.lv) < 1) decayMons++;
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
            (Math.abs(ratio - 1) > 0.0005 ? '<span style="color:var(--text-faint);font-size:11px;margin-left:4px;">(×' + (ratio * 100).toFixed(1) + '%)</span>' : '') + '</td>';
        }
        html += '<tr class="clickable" data-goto-monster="' + row.m + '">' +
          '<td>' + monsterIconHtml(row.m, 32) + '<span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link">' + escapeHtml(mon.name) + (mon.atk === 0 ? ' <span style="color:var(--text-faint);font-size:11px;">（攻0）</span>' : '') + '</span></td>' +
          '<td>' + escapeHtml(maps || "-") + '</td>' +
          '<td><span class="' + rateClassP(row.base.p) + '" title="資料原始值 ' + pct(row.base.raw) + '（未換算）">' + pctP(row.base.p) + '</span>' + dropGroupTags(row.base.groups) + '</td>' +
          adjCell +
          '</tr>';
      });
      html += '</tbody></table>';
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + escapeHtml(DROP_FORMULA_NOTE) +
        escapeHtml(showAdj ? dropAdjNote(decayMons) : "") + '</div>';
    }

    detailTarget().innerHTML = html;
    wireDropCalcBar(function () { showItem(id); });
    wireFusionSim(detailTarget());
  }

  function boxPctText(p) { return String(Math.round(p * 10000) / 10000) + "%"; }

  // ---------- NPC 兌換（towns.json offers，2026-09-28 update_data.py 產生 exchangeIndex.js）----------
  var EXCHANGE_KIND_LABEL = { trade: "兌換", upgrade: "升級", dismantle: "拆解" };
  function exchangeTownsText(o) {
    return (o.towns || []).map(function (t) { return townName(t); }).join("／");
  }
  function exchangeOfferCells(o) {
    var need = (o.give || []).map(function (g) { return itemChip(g[0], g[1]); }).join("");
    if (o.gear) {
      var ids = o.gear.ids || [];
      need = '交一件 ' + ids.slice(0, 3).map(function (g) { return itemChip(g); }).join("") +
        (ids.length > 3 ? '等 ' + ids.length + ' 種之一' : (ids.length > 1 ? '之一' : '')) +
        '（精煉 +' + (o.gear.minRefine || 0) + ' 以上）' + (need ? '<br>再加 ' + need : '');
    }
    var get = (o.get || []).map(function (g) { return itemChip(g[0], g[1]); }).join("");
    return { need: need || '－', get: get || '－' };
  }
  function exchangeRowHtml(o) {
    var c = exchangeOfferCells(o);
    return '<tr><td><b>' + escapeHtml(o.npc) + '</b><br><span style="font-size:12px;color:var(--text-faint);">' + escapeHtml(exchangeTownsText(o)) + '</span></td>' +
      '<td><span class="group-tag">' + (EXCHANGE_KIND_LABEL[o.kind] || o.kind) + '</span>' + (o.menu ? '<br><span style="font-size:12px;color:var(--text-faint);">' + escapeHtml(o.menu) + '</span>' : '') +
      (o.minLv ? '<br><span class="lv-tag">Lv' + o.minLv + '+</span>' : '') +
      (o.once ? '<br><span class="group-tag">限換一次</span>' : '') + '</td>' +
      '<td style="font-size:12.5px;">' + c.need + '</td><td style="font-size:12.5px;">' + c.get + '</td></tr>';
  }
  function exchangeTableHtml(title, idxs) {
    if (!idxs.length) return '';
    var html = '<div class="section-title">' + title + ' <span class="count">(' + idxs.length + ')</span></div>';
    html += '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>NPC</th><th>種類</th><th>要交出</th><th>換到</th></tr></thead><tbody>';
    idxs.forEach(function (i) { if (EXCHANGE_OFFERS[i]) html += exchangeRowHtml(EXCHANGE_OFFERS[i]); });
    return html + '</tbody></table></div>';
  }
  function exchangeSectionHtml(id) {
    var html = exchangeTableHtml('可跟 NPC 兌換取得', EXCHANGE_BY_GET[id] || []);
    html += exchangeTableHtml('可拿去跟 NPC 兌換', EXCHANGE_BY_GIVE[id] || []);
    if (html) html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">「升級」「拆解」要交的是那件裝備本身（精煉值要夠、不能是鎖定或穿在身上的）；有 Lv 標示的要角色等級到了才能換；「限換一次」是每個角色只能換一次。</div>';
    return html;
  }

  // ---------- 其他 2026-09-28 新增的取得方式（擲十八啦、黃金臭襪子、每日任務獎勵道具）----------
  // 艾希頓裝備強硬分解由鐵匠頁（smithItemNoteHtml）處理，這裡不重複。
  function extraSourcesHtml(id) {
    var parts = [];
    if (GM_DICE) {
      if (String(GM_DICE.prizeEgg) === id) parts.push('取得方式：帶 ' + itemChip(GM_DICE.entryEgg) + ' 找〔復活節兔子〕擲十八啦，贏了（50%）得到這個，輸了入場蛋會被收走。');
      if (String(GM_DICE.entryEgg) === id) parts.push('可以拿去跟〔復活節兔子〕擲十八啦，贏了得到 ' + itemChip(GM_DICE.prizeEgg) + '。');
    }
    if (FISHING_SOCK) {
      if (String(FISHING_SOCK.box) === id) parts.push('取得方式：用 ' + itemChip(FISHING_SOCK.bait) + ' 當魚餌，每釣到一次都會多拿到一個。');
      if (String(FISHING_SOCK.bait) === id) parts.push('當魚餌用：每釣到一次都會多拿到一個 ' + itemChip(FISHING_SOCK.box) + '。');
    }
    // 每日任務卡片完成時給的道具（daily.json quests[].item，遊戲 Gy() 會直接給）
    var dailySeen = {};
    (DAILY.quests || []).forEach(function (q) {
      if (!q.item || String(q.item[0]) !== id) return;
      var key = q.kind + ":" + q.item[1];
      if (dailySeen[key]) return;
      dailySeen[key] = true;
      parts.push('取得方式：每日任務「' + escapeHtml(DAILY_KIND_LABEL[q.kind] || q.kind) + '」卡片完成獎勵 ×' + q.item[1] +
        (q.minLevel ? '（Lv' + q.minLevel + (q.maxLevel ? '~' + q.maxLevel : '+') + '）' : ''));
    });
    if (!parts.length) return '';
    return '<div class="section-title">其他取得方式／用途</div><div style="font-size:13px;line-height:1.9;">' + parts.join('<br>') + '</div>';
  }

  // ---------- 技能寶石（gems.json，2026-09-28 新增）----------
  var GEM_TYPE_LABEL = { attack: "攻擊", heal: "恢復", support: "輔助" };
  var GEM_ATTR_LABEL = { damage: "傷害增加", cooldown: "冷卻時間減少", apCost: "技能AP減少", critChance: "致命機率增加", critMult: "致命係數增加", heal: "療癒恢復增加", duration: "持續時間增加", hit: "命中增加" };
  var GEM_TIER_LABEL = ["N", "G", "DG", "XG"];
  function gemSectionHtml(id) {
    if (!GEMS || !GEMS.defs) return '';
    var html = '';
    var def = GEMS.defs[id];
    if (def) {
      var en = GEMS.enchant || {};
      var cells = en.cells || 10;
      // 彗星要累計失敗 cometAfterFails 格才能選（bundle Gu()），所以最高值是每格都成功、選數值最大的太陽／月亮／星星
      var failsNeeded = en.cometAfterFails || cells;
      var bestNormal = Math.max(def.sun || 0, def.moon || 0, def.star || 0);
      var maxVal = def.base + Math.max(cells * bestNormal, Math.max(0, cells - failsNeeded) * (def.comet || 0));
      html += '<div class="section-title">技能寶石 <span class="count">' + (GEM_TYPE_LABEL[def.type] || def.type) + '・' + (GEM_TIER_LABEL[def.tier] || def.tier) + '</span></div>';
      html += '<div class="equip-box"><div class="equip-stat-grid">' +
        '<div>效果<br><b>' + escapeHtml(GEM_ATTR_LABEL[def.attr] || def.attr) + '</b></div>' +
        '<div>基礎值<br><b>' + def.base + '</b></div>' +
        '<div>☀ 太陽<br><b>+' + def.sun + '</b>（' + (en.sun || 0) + '%）</div>' +
        '<div>☾ 月亮<br><b>+' + def.moon + '</b>（' + (en.moon || 0) + '%）</div>' +
        '<div>★ 星星<br><b>+' + def.star + '</b>（' + (en.star || 0) + '%）</div>' +
        '<div>☄ 彗星<br><b>+' + def.comet + '</b>（必成功）</div>' +
        '<div>強化費用<br><b>' + bigNumHtml(def.enchantCost) + '</b></div>' +
        '</div></div>';
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">只能鑲在可鑲「' + (GEM_TYPE_LABEL[def.type] || def.type) + '」寶石的技能上，同一個技能不能鑲兩顆同效果的。' +
        '強化共 ' + cells + ' 格，每格選太陽／月亮／星星（括號是成功率），成功就加上那個數值；累計失敗 ' + (en.cometAfterFails || 0) + ' 格之後，剩下的格子可以選必成功的彗星。' +
        '數值 = 基礎值 + 成功格子的加總（最高 ' + maxVal + '）。</div>';
    }
    // 合成：同階 count 顆 → 抽一顆
    var composeUses = [], composeGets = [];
    (GEMS.compose || []).forEach(function (c) {
      var total = c.results.reduce(function (s, r) { return s + r[1]; }, 0) || 1;
      if (def && def.tier === c.tier) composeUses.push(c);
      c.results.forEach(function (r) { if (String(r[0]) === id) composeGets.push({ c: c, p: r[1] / total * 100 }); });
    });
    composeUses.forEach(function (c) {
      html += '<div style="font-size:13px;margin-top:8px;">合成：任意 ' + c.count + ' 顆 ' + (GEM_TIER_LABEL[c.tier] || c.tier) + ' 階技能寶石 + ' + bigNumHtml(c.cost) + ' 希望幣，隨機得到一顆（共 ' + c.results.length + ' 種）。</div>';
    });
    composeGets.forEach(function (g) {
      html += '<div style="font-size:13px;margin-top:8px;">取得方式：' + g.c.count + ' 顆 ' + (GEM_TIER_LABEL[g.c.tier] || g.c.tier) + ' 階技能寶石合成，抽到這顆的機率 ' + boxPctText(g.p) + '。</div>';
    });
    return html;
  }

  // ---------- 鑲嵌石（stones.json，2026-10-08 新增；update_data.py build_stones() 產生 stoneIndex.js）----------
  // 角色身上固定 4 顆石頭，跟上面的技能寶石是兩個系統。STONES 的欄位說明寫在 build_stones()。
  // steps[i] = [結晶, 七彩粉末, 成功率/10000, 能力組, 金幣, 變更要的結晶, 變更要的金幣]
  var STONES = window.STONES || null;
  function stonePctText(p) { return (Math.round(p * 1000000) / 10000) + "%"; }
  function stoneItemName(id) { return ITEMS[id] ? ITEMS[id].name : "無資料"; }
  function stoneYieldText(y) {
    return '×' + (y[1] === y[2] ? y[1] : y[1] + '~' + y[2]) + (y[3] < 10000 ? '（' + stonePctText(y[3] / 10000) + '）' : '');
  }
  function stoneGroupChances(group) {
    var list = STONES.groups[group] || [];
    var total = list.reduce(function (s, g) { return s + g[1]; }, 0) || 1;
    var out = {};
    list.forEach(function (g) { out[g[0]] = g[1] / total; });
    return out;
  }
  // 「紅字能力」＝這顆石頭只有某幾階抽得到的能力（遊戲 ad()：出現在某些階的能力組、但不是每一階都有）
  function stoneRareKinds(stone) {
    var count = {};
    stone.steps.forEach(function (st) {
      Object.keys(stoneGroupChances(st[3])).forEach(function (k) { count[k] = (count[k] || 0) + 1; });
    });
    var rare = {};
    Object.keys(count).forEach(function (k) { if (count[k] < stone.steps.length) rare[k] = true; });
    return rare;
  }
  function stoneStepIsRare(stone, idx) {
    var rare = stoneRareKinds(stone);
    return Object.keys(stoneGroupChances(stone.steps[idx][3])).some(function (k) { return rare[k]; });
  }
  function stoneStepsText(idxs) { return idxs.map(function (i) { return '+' + (i + 1); }).join('／'); }
  function stoneGuideLinkHtml() {
    return '<div style="margin-top:8px;"><span class="name-link" data-goto-stones="1" style="cursor:pointer;">看鑲嵌石完整說明 →</span></div>';
  }
  // 分解表：onlyItemId 有給就只列那一種產物（物品頁用）
  function stoneDecomposeTableHtml(onlyItemId) {
    var cols = [];
    STONES.decompose.forEach(function (d) { d[1].forEach(function (y) { if (cols.indexOf(y[0]) < 0) cols.push(y[0]); }); });
    if (onlyItemId != null) cols = cols.filter(function (c) { return c === onlyItemId; });
    var html = '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>打碎的寶石</th>' +
      cols.map(function (c) { return '<th><span class="name-link" data-goto-item="' + c + '">' + escapeHtml(stoneItemName(c)) + '</span></th>'; }).join('') + '</tr></thead><tbody>';
    STONES.decompose.forEach(function (d) {
      html += itemLinkRow(d[0], cols.map(function (c) {
        var y = d[1].filter(function (x) { return x[0] === c; })[0];
        return '<td>' + (y ? stoneYieldText(y) : '－') + '</td>';
      }).join(''));
    });
    return html + '</tbody></table></div>';
  }
  function stoneCostTableHtml(stone) {
    var html = '<div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr><th>階</th><th>成功率</th><th>' +
      escapeHtml(stoneItemName(STONES.crystalId)) + '</th><th>' + escapeHtml(stoneItemName(STONES.powderId)) +
      '</th><th>金幣</th><th>變更一次</th></tr></thead><tbody>';
    var sum = [0, 0, 0], avg = [0, 0, 0];
    stone.steps.forEach(function (st, i) {
      var rate = st[2] / 10000, rare = stoneStepIsRare(stone, i);
      [st[0], st[1], st[4]].forEach(function (v, k) { sum[k] += v; avg[k] += rate > 0 ? v / rate : 0; });
      html += '<tr' + (rare ? ' class="refine-step"' : '') + '><td><b>+' + (i + 1) + '</b>' + (rare ? ' <span class="group-tag">稀有</span>' : '') + '</td>' +
        '<td><span class="rate' + (rate < 0.5 ? ' low' : '') + '">' + stonePctText(rate) + '</span></td>' +
        '<td>' + st[0] + '</td><td>' + st[1] + '</td><td>' + bigNumHtml(st[4]) + '</td>' +
        '<td>' + st[5] + ' 個＋' + bigNumHtml(st[6]) + '</td></tr>';
    });
    html += '<tr><td colspan="2">一次都沒失敗</td><td>' + sum[0] + '</td><td>' + sum[1] + '</td><td>' + bigNumHtml(sum[2]) + '</td><td>－</td></tr>';
    html += '<tr><td colspan="2">照成功率平均</td><td>約 ' + Math.round(avg[0]) + '</td><td>約 ' + Math.round(avg[1]) + '</td><td>約 ' +
      bigNumHtml(Math.round(avg[2])) + '</td><td>－</td></tr>';
    return html + '</tbody></table></div>';
  }
  // 每顆石頭抽到各種能力的機率：大多數階一個機率，少數階不同的另外標出是哪幾階
  function stoneAbilityTableHtml() {
    var kinds = Object.keys(STONES.kinds).map(Number).sort(function (a, b) { return a - b; });
    var html = '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>能力</th>' +
      STONES.stones.map(function (s) { return '<th>' + escapeHtml(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    kinds.forEach(function (kind) {
      var cells = STONES.stones.map(function (s) {
        var byChance = {}; // 機率文字 → 哪幾階
        s.steps.forEach(function (st, i) {
          var p = stoneGroupChances(st[3])[kind] || 0;
          (byChance[p] = byChance[p] || []).push(i);
        });
        var ps = Object.keys(byChance).map(Number).sort(function (a, b) { return byChance[b].length - byChance[a].length; });
        if (ps.length === 1) return ps[0] > 0 ? stonePctText(ps[0]) : '<span style="color:var(--text-faint);">－</span>';
        var parts = [];
        if (ps[0] > 0) parts.push(stonePctText(ps[0]));
        ps.slice(1).forEach(function (p) {
          if (p > 0) parts.push('<span style="font-size:12px;color:' + (ps[0] > 0 ? 'var(--text-faint)' : 'var(--bad, #c0392b)') + ';">' +
            (ps[0] > 0 ? '' : '<b>') + stoneStepsText(byChance[p]) + '：' + stonePctText(p) + (ps[0] > 0 ? '' : '</b>') + '</span>');
        });
        return parts.join('<br>');
      });
      if (cells.every(function (c) { return c.indexOf('－') >= 0 && c.indexOf('%') < 0; })) return;
      html += '<tr><td><b>' + escapeHtml(STONES.kinds[kind].name) + '</b></td>' + cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
    });
    return html + '</tbody></table></div>';
  }
  function stoneBandsTableHtml() {
    var groups = [];
    Object.keys(STONES.kinds).map(Number).sort(function (a, b) { return a - b; }).forEach(function (kind) {
      var k = STONES.kinds[kind], key = JSON.stringify(k.bands) + k.pct;
      var g = groups.filter(function (x) { return x.key === key; })[0];
      if (g) g.names.push(k.name); else groups.push({ key: key, names: [k.name], k: k });
    });
    var html = '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>能力</th><th>平均</th><th>數值區間（抽到那一段的機率）</th></tr></thead><tbody>';
    groups.forEach(function (g) {
      var total = g.k.bands.reduce(function (s, b) { return s + b[2]; }, 0) || 1;
      var unit = g.k.pct ? '%' : '';
      var mean = g.k.bands.reduce(function (s, b) { return s + b[2] / total * (b[0] + b[1]) / 2; }, 0);
      html += '<tr><td><b>' + g.names.map(escapeHtml).join('<br>') + '</b></td><td>' + (Math.round(mean * 10) / 10) + unit + '</td><td style="font-size:12.5px;line-height:1.9;">' +
        g.k.bands.map(function (b) {
          return '<span style="white-space:nowrap;margin-right:10px;">' + (b[0] === b[1] ? b[0] : b[0] + '~' + b[1]) + unit +
            ' <span style="color:var(--text-faint);">(' + stonePctText(b[2] / total) + ')</span></span>';
        }).join(' ') + '</td></tr>';
    });
    return html + '</tbody></table></div>';
  }
  var STONE_TICKET_NOTE = {
    lock: function () { return '「變更」時勾選使用，每變更一次消耗 1 張：能力的種類不變，只重抽數值。沒勾就是種類跟數值一起重抽。'; },
    charge: function () {
      return '讓一顆鑲嵌石的變更次數 +' + STONES.changesPerTicket + '。加完不能超過 ' + STONES.changeCap + ' 次，所以要剩 ' +
        (STONES.changeCap - STONES.changesPerTicket) + ' 次以下才能用。';
    }
  };
  function stoneTicketsHtml() {
    var keys = Object.keys(STONES.tickets || {}).filter(function (k) { return STONE_TICKET_NOTE[k]; });
    if (!keys.length) return '';
    var html = '<table class="dtable"><thead><tr><th>道具</th><th>用途</th><th>名品館價格</th></tr></thead><tbody>';
    keys.forEach(function (k) {
      var id = STONES.tickets[k], m = MALL_INDEX.items[String(id)];
      html += itemLinkRow(id, '<td style="font-size:12.5px;">' + STONE_TICKET_NOTE[k]() + '</td>' +
        (m ? '<td data-mall-points="' + m.points + '">' + mallNowHtml(m.points) + '</td>' : '<td>－</td>'));
    });
    return html + '</tbody></table>';
  }
  function showStoneGuide() {
    currentDetail = null;
    var html = backButtonHtml() + '<h2 style="margin-top:0;">💠 鑲嵌石</h2>';
    if (!STONES || !STONES.stones) {
      $detail.innerHTML = html + '<div class="empty-note">資料檔是舊版，請重新執行 update_data.py。</div>';
      return;
    }
    var maxStep = STONES.stones[0] ? STONES.stones[0].steps.length : 0;
    var crystal = escapeHtml(stoneItemName(STONES.crystalId)), powder = escapeHtml(stoneItemName(STONES.powderId));
    html += '<div class="equip-box" style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '・位置：「角色」→「鑲嵌石」分頁。每個角色身上固定有 ' + STONES.stones.length + ' 顆石頭（' +
      STONES.stones.map(function (s) { return escapeHtml(s.name); }).join('、') + '），不是道具、不佔裝備格，跟技能寶石是兩個不同的系統。<br>' +
      '・<b>強化</b>：每顆最高 +' + maxStep + '，每成功一階就多一條隨機能力；' + STONES.stones.length + ' 顆的能力全部直接加在角色身上。<br>' +
      '・強化失敗只會扣掉材料跟金幣，<b>階數不會掉</b>。<br>' +
      '・<b>變更</b>：只能重抽「最新那一條」能力，前面幾階的改不了。每顆石頭有 ' + STONES.changeCap + ' 次變更次數，每變更一次扣 1 次。<br>' +
      '・<b>初始化</b>：整顆回到 +0 重新強化，但變更次數不會補回來。<br>' +
      '・遊戲的變更畫面可以設定「想要的能力／最低數值／最多幾次」讓它自動抽。' +
      '</div>';

    html += '<div class="section-title">材料從哪來</div>';
    html += '<div class="empty-note" style="padding:0 0 10px;">在鑲嵌石畫面的「分解」分頁把精煉用的寶石打碎（括號是出現機率，沒寫就是必定給）：</div>';
    html += stoneDecomposeTableHtml(null);
    if (STONES.dustId != null) {
      html += exchangeTableHtml(escapeHtml(stoneItemName(STONES.dustId)) + ' 可以換成 ' + crystal, (EXCHANGE_BY_GIVE[String(STONES.dustId)] || []));
    }
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">強化要「' + crystal + '＋' + powder + '＋金幣」，變更要「' + crystal + '＋金幣」。</div>';

    // 花費完全一樣的石頭合在同一張表
    var costGroups = [];
    STONES.stones.forEach(function (s) {
      var key = JSON.stringify(s.steps.map(function (st) { return [st[0], st[1], st[2], st[4], st[5], st[6]]; }));
      var g = costGroups.filter(function (x) { return x.key === key; })[0];
      if (g) g.stones.push(s); else costGroups.push({ key: key, stones: [s] });
    });
    costGroups.forEach(function (g) {
      html += '<div class="section-title">強化花費 <span class="count">' + g.stones.map(function (s) { return escapeHtml(s.name); }).join('、') + '</span></div>';
      html += stoneCostTableHtml(g.stones[0]);
    });
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">每一列是「強化到那一階」要的東西，失敗也照扣。標「稀有」的那幾階有機會抽到紅字能力（見下表）。' +
      '「變更一次」是重抽那一階能力的花費。「照成功率平均」是把失敗重試也算進去的期望值。</div>';

    html += '<div class="section-title">會抽到什麼能力</div>';
    html += stoneAbilityTableHtml();
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">格子裡是每強化成功一次（或每變更一次）抽到那種能力的機率；有標階數的代表只有那幾階是那個機率。' +
      '紅字的能力只有那幾階抽得到。同一種能力可以重複抽到，數值會加在一起。</div>';

    html += '<div class="section-title">抽到之後的數值</div>';
    html += stoneBandsTableHtml();
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">先照機率抽一段，再從那一段裡平均抽一個數字。用固定券變更時重抽的就是這個。</div>';

    var tickets = stoneTicketsHtml();
    if (tickets) {
      html += '<div class="section-title">相關的名品館道具</div>' + tickets;
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">身上沒有券的時候，遊戲會直接用當下的名品館價格扣金幣現買。</div>';
    }
    $detail.innerHTML = html;
  }
  // 物品頁：鑲嵌石的材料、可以打碎的寶石、兩張名品館的券
  function stoneSectionHtml(id) {
    if (!STONES || !STONES.stones) return '';
    var num = Number(id), body = '';
    var col = function (idx) { return STONES.stones.reduce(function (a, s) { return a.concat(s.steps.map(function (st) { return st[idx]; })); }, []); };
    var range = function (idx) { var v = col(idx); return Math.min.apply(null, v) + '~' + Math.max.apply(null, v); };
    var yieldedBy = STONES.decompose.some(function (d) { return d[1].some(function (y) { return y[0] === num; }); });
    if (num === STONES.crystalId) body += '鑲嵌石的材料：強化每一階要 ' + range(0) + ' 個，變更一次要 ' + range(5) + ' 個。';
    else if (num === STONES.powderId) body += '鑲嵌石的材料：強化每一階要 ' + range(1) + ' 個（變更不用）。';
    else if (num === STONES.dustId) body += '本身不能直接拿來強化鑲嵌石，要先找 NPC 換成 ' + itemChip(STONES.crystalId) + '（見上面的 NPC 兌換）。';
    if (yieldedBy) body += '<div style="margin:8px 0 6px;">取得方式：在鑲嵌石畫面的「分解」分頁把寶石打碎。</div>' + stoneDecomposeTableHtml(num);
    var dec = STONES.decompose.filter(function (d) { return d[0] === num; })[0];
    if (dec) {
      body += '可以在鑲嵌石畫面的「分解」分頁打碎，每打碎一顆得到：<div class="map-chip-row" style="margin-top:6px;">' +
        dec[1].map(function (y) { return itemChip(y[0], null, stoneYieldText(y)); }).join('') + '</div>';
    }
    Object.keys(STONES.tickets || {}).forEach(function (k) {
      if (STONES.tickets[k] === num && STONE_TICKET_NOTE[k]) body += STONE_TICKET_NOTE[k]();
    });
    if (!body) return '';
    return '<div class="section-title">鑲嵌石</div><div style="font-size:13px;line-height:1.9;">' + body + '</div>' + stoneGuideLinkHtml();
  }

  // ---------- 怪物變體能力表、昏厥量表（2026-09-28 新增）----------
  var VARIANT_FIELDS = [["hp", "HP"], ["atk", "攻擊"], ["def", "防禦"], ["hit", "命中"], ["eva", "迴避"], ["crit", "必殺"], ["critRes", "抗爆"], ["exp", "經驗"]];
  function monsterVariantsHtml(mon) {
    if (!mon.variants || !mon.variants.length) return '';
    var forms = monsterForms(mon);
    var html = '<div class="section-title">型態 <span class="count">(' + forms.length + ' 種，每次出現隨機一種)</span></div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr><th>型態</th><th>屬性</th>' +
      VARIANT_FIELDS.map(function (f) { return '<th>' + f[1] + '</th>'; }).join('') + '<th>掉落</th></tr></thead><tbody>';
    forms.forEach(function (f, i) {
      var v = i === 0 ? {} : mon.variants[i - 1];
      var sameDrops = i > 0 && JSON.stringify(v.drops || mon.drops) === JSON.stringify(mon.drops);
      html += '<tr><td>' + (i === 0 ? '本體' : '變體 ' + i) + '</td>' +
        '<td><span class="el-chip" style="color:var(--' + (ELEMENT_CLASS[f.element] || "el-none") + ')">' + (ELEMENT_LABEL[f.element] || f.element) + '</span></td>' +
        VARIANT_FIELDS.map(function (fl) {
          var changed = i > 0 && v[fl[0]] !== undefined && v[fl[0]] !== mon[fl[0]];
          return '<td' + (changed ? ' style="color:var(--gold-hi);font-weight:700;"' : '') + '>' + bigNumHtml(f[fl[0]]) + '</td>';
        }).join('') +
        '<td>' + (i === 0 ? '－' : (sameDrops ? '同本體' : '<span style="color:var(--gold-hi);">不同</span>')) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">金色是跟本體不一樣的數值。屬性不同時，五行寶石的最佳選擇也會跟著變（下面的建議是照本體算的）。</div>';
    return html;
  }
  // 昏厥量表（bundle Em()/Dm()）：技能打中累積，滿了不能動；弱點是每次出現隨機 1～2 種減益
  function monsterGroggyHtml(mon) {
    var g = mon.groggy;
    if (!g) return '';
    return '<div class="section-title">昏厥量表</div>' +
      '<div class="equip-box"><div class="equip-stat-grid">' +
      '<div>量表<br><b>' + bigNumHtml(g.gauge) + '</b></div>' +
      (g.durationMs ? '<div>昏厥時間<br><b>' + (g.durationMs / 1000) + ' 秒</b></div>' : '') +
      (g.defPct ? '<div>昏厥時防禦<br><b>−' + Math.abs(g.defPct) + '%</b></div>' : '') +
      (g.takenPct ? '<div>昏厥時受到傷害<br><b>+' + g.takenPct + '%</b></div>' : '') +
      (g.weakBonusPct ? '<div>打中弱點<br><b>多累積 ' + g.weakBonusPct + '%</b></div>' : '') +
      (g.growPct ? '<div>每昏厥一次量表變長<br><b>+' + g.growPct + '%（最多 +' + (g.growCapPct || 0) + '%）</b></div>' : '') +
      '</div></div>' +
      '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">技能打中會累積昏厥量表，滿了這隻怪會不能動一段時間。弱點是每次出現隨機 1～2 種減益，帶那種減益的技能打中會多累積。</div>';
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

    var html = backButtonHtml();
    html += '<div class="detail-head" data-detail-of="monster:' + id + '"><div>' +
      '<div class="detail-title">' + monsterIconHtml(id, 96) + escapeHtml(mon.name) + '</div>' +
      '<div class="detail-sub">怪物編號 #' + id + '　・　等級 ' + mon.lv + '</div>' +
      '<div class="badge-row">' +
      '<span class="el-chip" style="color:var(--' + elClass + ')">' + elLabel + '屬性</span>' +
      '<span class="badge">' + (mon.aggressive ? "主動攻擊" : "被動") + '</span>' +
      (mon.isHarvest ? '<span class="badge tag-harvest">採集點</span>' : '') +
      '</div></div></div>';
    html += ruinPenaltyWarningHtml(mapIds);

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
    html += monsterVariantsHtml(mon);
    html += monsterGroggyHtml(mon);

    var originHtml = monsterOriginsHtml(id);
    if (monsterReactions(id).length || originHtml) {
      html += '<div class="section-title">變身與召喚</div>';
      if (originHtml) html += '<div style="margin:0 0 8px;line-height:1.9;font-size:13px;">' + originHtml + '</div>';
      html += reactionListHtml(id);
      if (monsterNeverKilled(id)) {
        html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">這隻怪物血量降低時一定會變身（一擊打到 0 也一樣），不會被擊倒，所以下面的掉落表實際上拿不到，要看變身後的型態。</div>';
      }
    }

    html += '<div class="section-title">出現地圖 <span class="count">(' + mapIds.length + ')</span></div>';
    html += '<div class="map-chip-row">' + mapIds.map(function (mid) {
      var access = mapAccessText(mid);
      var here = gameCurrentMap != null && String(mid) === gameCurrentMap;
      return '<span class="map-chip" data-open-map="' + mid + '" title="看這張地圖的所有怪物和掉落"' +
        (here ? ' style="border-color:var(--gold);box-shadow:0 0 0 2px rgba(201,162,75,.35);"' : '') + '>' +
        (here ? '📍 ' : '') + escapeHtml(mapName(mid)) + (here ? ' <span style="font-size:11px;color:var(--gold-hi);">（你在這裡）</span>' : '') +
        (access ? ' <span style="font-size:11px;color:var(--text-faint);">（' + escapeHtml(access) + '）</span>' : '') +
        (MAP_PENALTY[String(mid)] ? ' <span style="font-size:11px;color:var(--danger, #c0392b);">⚠️廢墟</span>' : '') + '</span>';
    }).join("") + '</div>';
    if (mapNote) html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + mapNote + '</div>';
    if (mapIds.some(function (mid) { return MAP_ACCESS[String(mid)]; })) {
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">括號裡是從樂園鎮出發、照遊戲的傳送門條件，最低要多少等級／累計名聲才走得到那張地圖。</div>';
    }

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
      var showAdj = dropAdjActive();
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
          '<td>' + itemIconHtml(iid, 28) + '<span class="name-link">' + escapeHtml(name) + '</span></td>' +
          '<td><span class="' + rateClassP(base.p) + '" title="資料原始值 ' + pct(base.raw) + '（未換算）">' + pctP(base.p) + '</span>' + dropGroupTags(base.groups) + '</td>' +
          adjCell +
          '</tr>';
      });
      html += '</tbody></table>';
      var noteParts = [DROP_FORMULA_NOTE];
      if (mon.atk === 0) noteParts.push("這隻怪物攻擊力為 0，每次擊殺有 " + (DROP_WHIFF_CHANCE * 100).toFixed(1) + "% 機率整批掉落全部落空（已算進上面的機率）。");
      if (showAdj) {
        var monDecays = dropCalcState.level != null && dropLevelMultiplier(dropCalcState.level, mon.lv) < 1;
        noteParts.push(dropAdjNote(monDecays ? 1 : 0));
        if (dropCalcState.level != null) {
          noteParts.push("（等級差 " + (dropCalcState.level - mon.lv) + " 級，合計掉落倍率 ×" + String(Math.round(levelMult * 1000) / 10) + "%）");
        }
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
        // kind = "note"：手寫的功能更新說明（網站／修改器／書籤工具改了什麼），不是爬蟲比對出來的新增資料，單位用「項」
        var summary = entry.categories.map(function (c) { return c.label.replace(/\s*\(.+?\)/, "") + " " + c.entries.length + (c.kind === "note" ? " 項" : " 筆"); }).join("、");
        html += '<li class="result-item" data-changelog-idx="' + idx + '">' +
          '<span class="rname">' + escapeHtml(entry.date) + '</span>' +
          '<span class="rmeta">' + escapeHtml(summary) + '（共 ' + total + (entry.categories.every(function (c) { return c.kind === "note"; }) ? ' 項）' : ' 筆）') + '</span>' +
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
      if (cat.kind === "note") {
        // 功能更新說明：一項一行的文字，不做成小標籤（句子太長）
        html += '<ul style="margin:0 0 14px;padding-left:20px;font-size:13.5px;line-height:1.9;color:var(--text);">' +
          cat.entries.map(function (e) { return '<li>' + escapeHtml(e.name) + '</li>'; }).join("") + '</ul>';
        return;
      }
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
    html += boxTiersHtml(box);
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
          '<span class="rmeta">Lv' + (dg.minLv || 0) + (dg.maxLv ? "~" + dg.maxLv : "+") + '　每日 ' + (dg.entries || 0) + ' 次・' + dungeonMonsterList(dg).length + ' 種怪物' +
          (dg.requires && dg.requires.secondJob ? '・需二轉' : '') + (dg.requires && dg.requires.party ? '・需隊友' : '') + (dg.floors ? '・有名聲減益' : '') + '</span>' +
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

  // ---------- 任務分頁：每日任務／書信任務／委託任務／藍圖任務（主線任務只在舊資料還有時才顯示）----------
  // 2026-09-27 那版遊戲把主線劇情整套拿掉了（存檔 v57→58 刪掉 questFlags），新資料的 MAIN_QUEST_LINES 會是空的
  function hasMainQuestLines() { return Object.keys(MAIN_QUEST_LINES).length > 0; }
  function defaultQuestTab() { return DAILY.quests.length ? "daily" : (hasMainQuestLines() ? "main" : "commission"); }
  function questTabsHtml(active) {
    var tabs = [["daily", "🗓️ 每日任務"], ["letter", "✉️ 書信任務"], ["commission", "📜 委託任務"], ["blueprint", "🗺️ 藍圖任務"]];
    if (!DAILY.quests.length) tabs.shift();
    if (JOB_ADVANCE && JOB_ADVANCE.jobs.length) tabs.push(["job", "🎓 轉職"]);
    if (hasMainQuestLines()) tabs.unshift(["main", "📖 主線任務"]);
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
    else if (tab === "daily" && DAILY.quests.length) showDailyBrowser();
    else if (tab === "main" && hasMainQuestLines()) showQuestLineBrowser();
    else if (tab === "job" && JOB_ADVANCE && JOB_ADVANCE.jobs.length) showJobAdvanceBrowser();
    else openQuestTab(defaultQuestTab());
  }

  // ---------- 轉職（jobs.json advanceNpc／req，2026-09-26 起取代主線劇情的轉職線）----------
  // 條件照 bundle jobOffers()：一轉＝初心者、等級 ≥ advanceLevel；二轉＝從對應一轉、req 的等級／名聲／金幣（付過錢 secondJobPaid 再轉就免金幣）
  function showJobAdvanceBrowser() {
    currentDetail = null;
    currentView = { kind: "questtab", id: "job" };
    var html = backButtonHtml() + questTabsHtml("job");
    html += '<h2 style="margin-top:0;">🎓 轉職</h2>';
    var jobName = {};
    (window.JOBS || []).forEach(function (j) { jobName[j.id] = j.name; });
    html += '<div class="empty-note" style="padding:0 0 10px;">到城鎮找對應的 NPC 談話就能轉職，不用跑劇情。一轉：初心者 Lv' + (JOB_ADVANCE.advanceLevel || 10) +
      ' 以上；二轉：從對應的一轉職業、等級／名聲／金幣都要夠（二轉付過一次錢，之後重轉就不用再付）。二轉時技能與屬性點會重置。</div>';
    [1, 2].forEach(function (tier) {
      var list = JOB_ADVANCE.jobs.filter(function (j) { return j.tier === tier; });
      if (!list.length) return;
      html += '<div class="section-title">' + (tier === 1 ? '一轉' : '二轉') + ' <span class="count">(' + list.length + ')</span></div>';
      html += '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>職業</th>' + (tier === 2 ? '<th>從</th>' : '') +
        '<th>找誰</th><th>地點</th><th>等級</th>' + (tier === 2 ? '<th>名聲</th><th>金幣</th>' : '') + '</tr></thead><tbody>';
      list.forEach(function (j) {
        var req = j.req || {};
        html += '<tr><td><b>' + escapeHtml(j.name) + '</b>' + (j.desc ? '<br><span style="font-size:12px;color:var(--text-faint);">' + escapeHtml(j.desc) + '</span>' : '') + '</td>' +
          (tier === 2 ? '<td>' + escapeHtml(jobName[j.from] || j.from || "") + '</td>' : '') +
          '<td>' + escapeHtml(j.npc) + '</td><td>' + escapeHtml((j.towns || []).map(townName).join("／") || "-") + '</td>' +
          '<td>Lv' + (req.level || 0) + '</td>' +
          (tier === 2 ? '<td>' + bigNumHtml(req.fame || 0) + '</td><td>' + bigNumHtml(req.gold || 0) + '</td>' : '') + '</tr>';
      });
      html += '</tbody></table></div>';
    });
    $detail.innerHTML = html;
  }

  // ---------- 每日任務（daily.json，2026-09-27 新增）----------
  // 規則照遊戲 bundle：
  //   issueDaily()：每天換日發卡。非擊殺任務依「種類@地圖」分組，隨機挑 fixedSlots 組（不重複），每組再隨機挑一個評級；
  //                 擊殺任務從 minLevel ≤ 角色等級 ≤ maxLevel 的那 6 個評級裡隨機挑 killSlots 張（可以重複）。
  //   接取後才開始計數；擊殺只算「跟角色等級差 ≤ levelWindow」的怪（離線掛機打的也算）。
  //   未接取的擊殺卡可以換卡（每天 swapsPerDay 次，換成不同評級）；已接取未完成可以放棄（進度歸零）。
  //   每張卡給 token 個 R代幣（擊殺卡另給經驗）；milestones 是累計完成幾項的禮物盒，最後一個要全部完成才能領。
  //   換日時沒領的卡和禮物盒會自動領掉。
  var DAILY_TIER_NAMES = ["SSS", "SS", "S", "A", "B", "C"];
  var DAILY_TIER_COLORS = ["#e0564a", "#e08a3a", "#d6b13f", "#5fae5b", "#4f8fd0", "#8a8f99"];
  var DAILY_KIND_LABEL = { kill: "擊殺", fish: "釣魚", feed: "餵寵物", refine: "寶石強化", smelt: "找雷分解" };
  var DAILY_KIND_HOW = {
    fish: "釣魚每消耗 1 個魚餌算 1 次（有沒有釣到都算）",
    feed: "帶著寵物，寵物每從便當盒吃 1 次算 1 次",
    refine: "精煉（裝備或戰寵裝備）每試 1 次算 1 次，成功失敗都算",
    smelt: "找雷分解每分解 1 件算 1 次"
  };
  var dailyLevel = null; // 每日任務頁自己的等級欄，沒填過就跟上方「你目前的等級」
  function dailyTierBadge(tier) {
    return '<span style="display:inline-block;min-width:34px;text-align:center;padding:1px 6px;border-radius:4px;font-weight:800;font-size:12px;color:#fff;background:' +
      (DAILY_TIER_COLORS[tier] || "#777") + ';">' + escapeHtml(DAILY_TIER_NAMES[tier] || ("#" + tier)) + '</span>';
  }
  function dailyRules() {
    var r = DAILY.rules || {};
    return { levelWindow: r.levelWindow != null ? r.levelWindow : 25, swapsPerDay: r.swapsPerDay != null ? r.swapsPerDay : 10,
      fixedSlots: r.fixedSlots != null ? r.fixedSlots : 3, killSlots: r.killSlots != null ? r.killSlots : 5 };
  }
  // 擊殺任務的等級區段（依 minLevel 排好），每段 6 個評級
  function dailyKillBrackets() {
    var byKey = {}, list = [];
    DAILY.quests.forEach(function (q) {
      if (q.kind !== "kill") return;
      var k = q.minLevel + "-" + q.maxLevel;
      if (!byKey[k]) { byKey[k] = { minLevel: q.minLevel, maxLevel: q.maxLevel, tiers: [] }; list.push(byKey[k]); }
      byKey[k].tiers.push(q);
    });
    list.sort(function (a, b) { return a.minLevel - b.minLevel; });
    list.forEach(function (b) { b.tiers.sort(function (x, y) { return x.tier - y.tier; }); });
    return list;
  }
  // 非擊殺任務的分組（遊戲 Uv()：kind@mapId），每組 6 個評級
  function dailyFixedGroups() {
    var byKey = {}, list = [];
    DAILY.quests.forEach(function (q) {
      if (q.kind === "kill") return;
      var k = q.kind + "@" + (q.mapId != null ? q.mapId : 0);
      if (!byKey[k]) { byKey[k] = { kind: q.kind, mapId: q.mapId, tiers: [] }; list.push(byKey[k]); }
      byKey[k].tiers.push(q);
    });
    var order = { fish: 0, feed: 1, refine: 2, smelt: 3 };
    list.sort(function (a, b) {
      return (order[a.kind] != null ? order[a.kind] : 9) - (order[b.kind] != null ? order[b.kind] : 9) ||
        (a.mapId == null ? -1 : b.mapId == null ? 1 : a.mapId - b.mapId);
    });
    list.forEach(function (g) { g.tiers.sort(function (x, y) { return x.tier - y.tier; }); });
    return list;
  }
  function dailyGroupLabel(g) {
    if (g.kind === "fish") return g.mapId != null ? "在〔" + mapName(g.mapId) + "〕釣魚" : "釣魚（任何地點）";
    return DAILY_KIND_LABEL[g.kind] || g.kind;
  }
  // 某個等級能領到的組（組內每個評級的等級範圍都一樣，看第一個就好）
  function dailyGroupOpen(g, lv) { var q = g.tiers[0]; return !!q && lv >= q.minLevel && lv <= q.maxLevel; }

  function showDailyBrowser() {
    currentDetail = null;
    currentView = { kind: "questtab", id: "daily" };
    var rules = dailyRules();
    var tokenName = missionTokenName();
    var brackets = dailyKillBrackets();
    var groups = dailyFixedGroups();
    var tierCount = DAILY_TIER_NAMES.length;

    var html = backButtonHtml() + questTabsHtml("daily");
    html += '<h2 style="margin-top:0;">🗓️ 每日任務 <span class="count">(' + DAILY.quests.length + ')</span></h2>';
    html += '<div class="equip-box" style="font-size:13px;color:var(--text-dim);line-height:1.9;">' +
      '・每天<b>台灣時間早上 6 點</b>換日，發 <b>' + (rules.fixedSlots + rules.killSlots) + '</b> 張任務卡：<b>' + rules.fixedSlots + '</b> 張雜務（釣魚／餵寵物／寶石強化／找雷分解，隨機挑不同組）＋ <b>' + rules.killSlots + '</b> 張擊殺任務（依你的等級）。評級（' +
      DAILY_TIER_NAMES.join("／") + '）隨機，評級越高要做的量越多、獎勵越多。<br>' +
      '・要先<b>接取</b>才開始計數。擊殺任務只算<b>跟你等級相差 ' + rules.levelWindow + ' 級以內</b>的怪，不限哪一種（離線掛機打的也算）。<br>' +
      '・還沒接取的擊殺卡可以<b>換卡</b>，每天 ' + rules.swapsPerDay + ' 次（會換成不同評級）；已接取但還沒完成的可以放棄，進度歸零。<br>' +
      '・每張卡給 ' + escapeHtml(tokenName) + '（擊殺卡另給經驗），累計完成數量還有禮物盒。換日時沒領的卡和禮物盒會自動幫你領。' +
      '</div>';

    // 累計完成禮物盒
    var ms = DAILY.milestones || [];
    if (ms.length) {
      html += '<div class="section-title">累計完成禮物盒</div>';
      html += '<table class="dtable"><thead><tr><th>條件</th><th>獎勵</th></tr></thead><tbody>';
      var totalToken = 0, totalFame = 0;
      ms.forEach(function (m, i) {
        var parts = [];
        if (m.token) parts.push(itemChip(MISSION_TOKEN_ITEM_ID, m.token));
        if (m.fame) parts.push("名聲 +" + fmtNum(m.fame));
        totalToken += m.token || 0; totalFame += m.fame || 0;
        html += '<tr><td style="white-space:nowrap;">' + (i === ms.length - 1 ? '🎁 全部完成（' + m.done + ' 項）' : '完成 ' + m.done + ' 項') + '</td><td>' + (parts.join("　") || "－") + '</td></tr>';
      });
      html += '</tbody></table>';
      var maxCardToken = 0;
      DAILY.quests.forEach(function (q) { if (q.token > maxCardToken) maxCardToken = q.token; });
      html += '<div class="empty-note" style="padding:6px 0 0;">禮物盒合計 ' + escapeHtml(tokenName) + ' ×' + totalToken + (totalFame ? '、名聲 +' + fmtNum(totalFame) : '') +
        '；卡片全抽到 ' + DAILY_TIER_NAMES[0] + ' 時一天最多再拿 ' + escapeHtml(tokenName) + ' ×' + (maxCardToken * (rules.fixedSlots + rules.killSlots)) + '。</div>';
    }

    // 依等級看今天可能抽到什麼
    var lv = dailyLevel != null ? dailyLevel : dropCalcState.level;
    html += '<div class="section-title">依等級查看可能抽到的任務</div>';
    html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">' +
      '<label for="dailyLevelInput" style="font-size:13px;color:var(--text-dim);">你的等級</label>' +
      '<input id="dailyLevelInput" type="number" min="1" max="999" placeholder="輸入等級..." value="' + (lv != null ? lv : "") + '" ' +
      'style="width:110px;padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:4px;color:var(--text);font-size:14px;">' +
      '</div>';
    html += '<div id="dailyByLevel"></div>';

    // 全部擊殺任務一覽
    html += '<div class="section-title">擊殺任務一覽 <span class="count">（每格：要打幾隻／經驗；R代幣看評級）</span></div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" id="dailyKillTable" style="min-width:640px;"><thead><tr><th>角色等級</th>';
    for (var t = 0; t < tierCount; t++) {
      var tk = brackets.length && brackets[0].tiers[t] ? brackets[0].tiers[t].token : null;
      html += '<th style="text-align:center;">' + dailyTierBadge(t) + (tk != null ? '<br><span style="font-weight:400;">代幣 ×' + tk + '</span>' : '') + '</th>';
    }
    html += '</tr></thead><tbody>';
    brackets.forEach(function (b) {
      html += '<tr data-daily-bracket="' + b.minLevel + '-' + b.maxLevel + '"><td style="white-space:nowrap;">Lv' + b.minLevel + ' ~ ' + b.maxLevel + '</td>';
      for (var t2 = 0; t2 < tierCount; t2++) {
        var q = b.tiers[t2];
        html += '<td style="text-align:center;white-space:nowrap;">' + (q ? q.need + ' 隻<br><span style="color:var(--text-faint);font-size:12px;">' + bigNumHtml(q.exp || 0, "+") + '</span>' : '－') + '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    // 雜務一覽
    html += '<div class="section-title">雜務任務一覽 <span class="count">（每格：要做幾次）</span></div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="min-width:640px;"><thead><tr><th>任務</th><th>等級</th>';
    for (var t3 = 0; t3 < tierCount; t3++) html += '<th style="text-align:center;">' + dailyTierBadge(t3) + '</th>';
    html += '</tr></thead><tbody>';
    groups.forEach(function (g) {
      var q0 = g.tiers[0];
      html += '<tr><td>' + escapeHtml(dailyGroupLabel(g)) + '</td><td style="white-space:nowrap;">Lv' + q0.minLevel + ' ~ ' + q0.maxLevel + '</td>';
      for (var t4 = 0; t4 < tierCount; t4++) html += '<td style="text-align:center;">' + (g.tiers[t4] ? g.tiers[t4].need : '－') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="empty-note" style="padding:6px 0 0;">' + Object.keys(DAILY_KIND_HOW).map(function (k) {
      return '<b>' + escapeHtml(DAILY_KIND_LABEL[k]) + '</b>：' + escapeHtml(DAILY_KIND_HOW[k]);
    }).join('<br>') + '<br>「釣魚（任何地點）」在哪裡釣都算；指定地圖的只算在那張地圖釣的。</div>';

    $detail.innerHTML = html;

    function renderByLevel() {
      var box = document.getElementById("dailyByLevel");
      var rows = document.querySelectorAll("#dailyKillTable tr[data-daily-bracket]");
      var cur = dailyLevel != null ? dailyLevel : dropCalcState.level;
      if (cur == null || !(cur >= 1)) {
        box.innerHTML = '<div class="empty-note" style="padding:0 0 6px;">輸入等級後，會列出這個等級每天可能抽到的擊殺任務和雜務。</div>';
        Array.prototype.forEach.call(rows, function (tr) { tr.style.background = ""; });
        return;
      }
      var bracket = null;
      brackets.forEach(function (b) { if (cur >= b.minLevel && cur <= b.maxLevel) bracket = b; });
      Array.prototype.forEach.call(rows, function (tr) {
        tr.style.background = bracket && tr.getAttribute("data-daily-bracket") === bracket.minLevel + "-" + bracket.maxLevel ? "rgba(201,162,75,.18)" : "";
      });
      var h = '';
      h += '<div class="equip-box"><div class="row1"><span class="slot">⚔️ 擊殺任務（' + rules.killSlots + ' 張）</span>' +
        '<span class="badge">算得到的怪：Lv' + Math.max(1, cur - rules.levelWindow) + ' ~ ' + (cur + rules.levelWindow) + '</span></div>';
      if (!bracket) {
        h += '<div class="empty-note">這個等級沒有擊殺任務。</div>';
      } else {
        h += '<table class="dtable"><thead><tr><th>評級</th><th>擊殺數</th><th>經驗</th><th>' + escapeHtml(tokenName) + '</th></tr></thead><tbody>';
        bracket.tiers.forEach(function (q) {
          h += '<tr><td>' + dailyTierBadge(q.tier) + '</td><td>' + q.need + ' 隻</td><td>' + bigNumHtml(q.exp || 0, "+") + '</td><td>×' + q.token + '</td></tr>';
        });
        h += '</tbody></table>';
      }
      h += '</div>';
      var open = groups.filter(function (g) { return dailyGroupOpen(g, cur); });
      var closed = groups.filter(function (g) { return !dailyGroupOpen(g, cur); });
      h += '<div class="equip-box"><div class="row1"><span class="slot">🧺 雜務（' + rules.fixedSlots + ' 張）</span>' +
        '<span class="badge">從 ' + open.length + ' 組裡挑 ' + Math.min(rules.fixedSlots, open.length) + ' 組</span></div>';
      if (!open.length) {
        h += '<div class="empty-note">這個等級沒有雜務可以抽。</div>';
      } else {
        h += '<div style="font-size:13px;color:var(--text-dim);line-height:1.9;">' + open.map(function (g) {
          return '・' + escapeHtml(dailyGroupLabel(g)) + '　<span style="color:var(--text-faint);">' +
            g.tiers.map(function (q) { return DAILY_TIER_NAMES[q.tier] + ' ' + q.need; }).join("／") + '</span>';
        }).join('<br>') + '</div>';
      }
      if (closed.length) {
        h += '<div class="empty-note" style="padding:6px 0 0;">等級還不夠、抽不到：' + closed.map(function (g) {
          return escapeHtml(dailyGroupLabel(g)) + '（Lv' + g.tiers[0].minLevel + '）';
        }).join("、") + '</div>';
      }
      h += '</div>';
      box.innerHTML = h;
    }
    renderByLevel();
    document.getElementById("dailyLevelInput").addEventListener("input", function (e) {
      dailyLevel = e.target.value ? Number(e.target.value) : null;
      renderByLevel();
    });
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
    var dropN = dropMonsterCount(iid), shopN = (SHOP_INDEX[String(iid)] || []).length, mallN = MALL_INDEX.items[String(iid)] ? 1 : 0;
    if (dropN || shopN || mallN) {
      lines.push("另外：" + [dropN ? dropN + " 種怪物會掉落" : "", shopN ? "商店有賣" : "", mallN ? "名品館有賣" : ""].filter(Boolean).join("、") + "（點道具看詳細）");
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

  // 寵物的取得方式（寵物本身就是物品：ITEM_OBTAIN 是 update_data.py 照遊戲所有取得管道算的；進化來的看 PET_EVOLVE_FROM）。
  // 一階寵物（蛋／種子）幾乎都是打怪掉落，列表上直接標出來，詳細頁再列出會掉的怪。
  var OBTAIN_KIND_LABEL = {
    drop: "打怪掉落", box: "開箱", shop: "商店", gamble: "擲十八啦", fusion: "合成", forge: "鍛造", radix: "拉迪克斯",
    hero: "英雄神話", fishing: "釣魚", exchange: "NPC 兌換", cook: "料理", mission: "藍圖任務", gem: "寶石合成",
    alchemy: "煉金", smelt: "鎔解", melt: "熔解", craft: "製作", pet: "寵物", start: "初始道具", daily: "每日任務", decompose: "分解", convert: "轉換"
  };
  function petObtainKinds(petId) {
    var kinds = ((ITEM_OBTAIN || {})[String(petId)] || []).slice();
    if ((PET_EVOLVE_FROM[String(petId)] || []).length) kinds.push("evolve");
    var p = PET_INFO[String(petId)];
    if (p && p.master && p.master.kind) kinds.push("petMaster");
    if ((PET_SMELT_FROM[String(petId)] || []).length) kinds.push("petSmelt");
    return kinds;
  }
  function petObtainText(petId) {
    var kinds = petObtainKinds(petId);
    if (!kinds.length) return "查不到取得方式";
    return kinds.map(function (k) {
      if (k === "evolve") return "上一階進化";
      if (k === "petMaster") return "7 階進化（5 隻 6 階交給寵物大師）";
      if (k === "petSmelt") return "寵物冶煉（7 階吃掉指定寵物）";
      if (k === "drop") return "打怪掉落（" + dropMonsterCount(petId) + " 種怪）";
      return OBTAIN_KIND_LABEL[k] || k;
    }).join("・");
  }
  // 詳細頁「取得方式」：打怪掉落列出會掉的怪（掉率高的在前），開箱列出寶箱，擲十八啦說明規則，其他管道請到物品頁看
  function petObtainHtml(petId) {
    var id = String(petId);
    // 進化／7 階進化／冶煉在下面各有自己的區塊，這裡只列「直接拿得到」的管道
    var kinds = petObtainKinds(id).filter(function (k) { return ["evolve", "petMaster", "petSmelt"].indexOf(k) === -1; });
    if (!kinds.length) return '';
    // 怪物表可能有二、三十列，預設收起來（標題就寫出摘要），不然要捲很久才看得到下面的進化／加成
    var html = '<details class="fold-section"><summary class="section-title">取得方式：' + escapeHtml(petObtainText(id)) +
      '<span class="fold-hint">點擊展開</span></summary>';
    if (kinds.indexOf("drop") !== -1) {
      var seen = {}, rows = [];
      (DROP_INDEX[id] || []).forEach(function (d) {
        var mon = MONSTERS[String(d.m)];
        if (!mon || seen[d.m]) return;
        seen[d.m] = true;
        var c = monsterDropChances(mon, 1)[id];
        if (c) rows.push({ m: d.m, mon: mon, p: c.p });
      });
      rows.sort(function (a, b) { return b.p - a.p; });
      html += '<div class="empty-note" style="padding:0 0 8px;">打倒下面的怪物有機率掉落（共 ' + rows.length + ' 種，點怪物看牠在哪裡）：</div>';
      html += '<div style="overflow-x:auto;margin-bottom:14px;"><table class="dtable"><thead><tr><th>怪物</th><th>出現地圖</th><th>掉落機率</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        html += '<tr class="clickable" data-goto-monster="' + r.m + '"><td>' + monsterIconHtml(r.m, 32) +
          '<span class="lv-tag">Lv.' + r.mon.lv + '</span><span class="name-link">' + escapeHtml(r.mon.name) + '</span></td>' +
          '<td>' + escapeHtml(r.mon.maps.map(mapName).join("、") || "-") + '</td>' +
          '<td><span class="' + rateClassP(r.p) + '">' + pctP(r.p) + '</span></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    if (kinds.indexOf("box") !== -1) {
      html += '<div class="empty-note" style="padding:0 0 6px;">開寶箱取得：</div><div class="map-chip-row" style="margin-bottom:14px;">' +
        (ITEM_TO_BOXES[id] || []).map(function (b) { return itemChip(b.boxId, null, '<span class="rate low">' + boxPctText(b.pct) + '</span>'); }).join('') + '</div>';
    }
    if (kinds.indexOf("gamble") !== -1 && GM_DICE && String(GM_DICE.prizeEgg) === id) {
      html += '<div style="font-size:13px;margin-bottom:14px;">帶 ' + itemChip(GM_DICE.entryEgg) + ' 找〔復活節兔子〕擲十八啦，贏了（50%）得到這隻，輸了入場蛋會被收走。</div>';
    }
    var others = kinds.filter(function (k) { return ["drop", "box", "gamble"].indexOf(k) === -1; });
    if (others.length) {
      html += '<div style="font-size:13px;margin-bottom:14px;">也可以從「' + others.map(function (k) { return OBTAIN_KIND_LABEL[k] || k; }).join("、") +
        '」取得，詳細請看物品頁 ' + itemChip(id) + '。</div>';
    }
    return html + '</details>';
  }

  // ---------- 7 階寵物（2026-10-08 新增，規則照遊戲 bundle）----------
  // 6 階寵物沒有材料進化了，7 階改成兩套機制：
  //  A. 寵物大師「7 階進化」（petMasterPlan／Fx／Mx／Nx／Vx）：交出 5 隻「+9 而且經驗餵滿」的 6 階寵物＋手續費，5 隻都會消失。
  //     稀有度點數決定抽一般／稀有／超稀有，種族權重決定哪一族，類型權重決定攻擊／魔法／綜合，同一格有好幾隻就平分；
  //     抽到的「稀有度＋種族」沒有對應的 7 階寵物就是失敗。
  //  B. 寵物冶煉家「寵物冶煉」（petSmeltRows／petSmelt／SS）：7 階本體養到 +9，吃掉指定的寵物＋寵物之魂＋金幣，
  //     有機率變成 .G 寵物；失敗時本體照 PET_SMELT_FAIL 的權重掉到 +0～+9，被吃掉的寵物和材料一樣沒了。
  // 下面這幾張表寫死在遊戲程式裡（不在資料檔），遊戲改了要跟著改：xx／Sx／Cx／wx／Tx／Dx／Ox／kx／Ax／Bx。
  var PET_SMELT_FAIL = window.PET_SMELT_FAIL || [];
  var PET_SOUL_ID = window.PET_SOUL_ID;
  var PET_NPC_TOWNS = window.PET_NPC_TOWNS || {};
  var PET_FAMILY_LABEL = { seed: "種子", piya: "咕咕", bird: "鳥蛋", sky: "天蛋", dragon: "黑龍", mand: "曼德拉", fox: "三尾狐" };
  var PET_RARITY_LABEL = { normal: "一般", rare: "稀有", super: "超稀有" };
  var PET_KIND_LABEL = { atk: "攻擊", mag: "魔法", mix: "綜合" };
  var PET_MASTER_FAMILIES = ["seed", "piya", "bird", "sky", "dragon", "mand", "fox"];
  var PET_MASTER_RARITIES = ["normal", "rare", "super"];
  var PET_MASTER_KINDS = ["atk", "mag", "mix"];
  var PET_MASTER_COUNT = 5;
  var PET_MASTER_SPECIAL = { dragon: 1, mand: 1, fox: 1 };
  // 一隻 6 階提供多少「種族權重」；null＝這一族沒有一般，資料寫 normal 的也當稀有算
  var PET_MASTER_FAMILY_PT = {
    seed: { normal: 80, rare: 100, super: 120 }, piya: { normal: 60, rare: 80, super: 100 }, bird: { normal: 40, rare: 60, super: 80 },
    sky: { normal: null, rare: 60, super: 80 }, dragon: { normal: null, rare: 10, super: 20 },
    mand: { normal: null, rare: 10, super: 20 }, fox: { normal: null, rare: 10, super: 20 }
  };
  var PET_MASTER_RARITY_AT = { normal: 100, rare: 200, super: 400 }; // 稀有度點數的三條門檻
  var PET_MASTER_KIND_OWN = 20, PET_MASTER_KIND_OTHER = 2;
  var PET_MASTER_FEE = {
    seed: { normal: 2e6, rare: 4e6, super: 8e6 }, piya: { normal: 6e6, rare: 12e6, super: 24e6 }, bird: { normal: 18e6, rare: 36e6, super: 72e6 },
    sky: { normal: 36e6, rare: 36e6, super: 72e6 }, dragon: { normal: 108e6, rare: 108e6, super: 216e6 },
    mand: { normal: 108e6, rare: 108e6, super: 216e6 }, fox: { normal: 108e6, rare: 108e6, super: 216e6 }
  };
  function petMasterRarity(m) {
    return m.rarity === "normal" && PET_MASTER_FAMILY_PT[m.family].normal === null ? "rare" : m.rarity;
  }
  function petMasterRarityPt(m) {
    var r = petMasterRarity(m);
    if (PET_MASTER_SPECIAL[m.family]) return r === "super" ? 80 : 50;
    return r === "super" ? 50 : r === "rare" ? 40 : 20;
  }
  // 6 階沒有 kind 欄位，遊戲 jx() 用攻擊／魔法的基礎值判斷：只有一邊的看那邊；兩邊都有的話，一般＝綜合，稀有以上看哪邊高
  function petMasterKind(p) {
    if (p.master && p.master.kind) return p.master.kind;
    var atk = p.stats.atk, mag = p.stats.mag;
    if (mag === 0 && atk > 0) return "atk";
    if (atk === 0 && mag > 0) return "mag";
    if (p.master && petMasterRarity(p.master) === "normal") return "mix";
    return atk > mag ? "atk" : mag > atk ? "mag" : "mix";
  }
  function petMasterRarityOdds(pt) {
    var at = PET_MASTER_RARITY_AT;
    function lerp(lo, hi) { return Math.min(1, Math.max(0, (pt - lo) / (hi - lo))); }
    var t;
    if (pt >= at.rare) { t = lerp(at.rare, at.super); return { fail: 0, normal: 0, rare: 1 - t, super: t }; }
    if (pt >= at.normal) { t = lerp(at.normal, at.rare); return { fail: 0, normal: 1 - t, rare: t, super: 0 }; }
    t = lerp(0, at.normal);
    return { fail: 1 - t, normal: t, rare: 0, super: 0 };
  }
  function petMasterShare(weights, keys) {
    var total = keys.reduce(function (s, k) { return s + weights[k]; }, 0), out = {};
    keys.forEach(function (k) { out[k] = total > 0 ? weights[k] / total : 1 / keys.length; });
    return out;
  }
  var PET_MASTER_OUTPUT_IDS = Object.keys(PET_INFO).filter(function (id) { return PET_INFO[id].master && PET_INFO[id].master.kind; });
  // pets：交出去的 6 階寵物資料（PET_INFO 的項目）。回傳各種點數、手續費、失敗機率、每隻 7 階的機率（0～1）
  function petMasterOdds(pets) {
    var family = {}, kind = { atk: 0, mag: 0, mix: 0 }, rarityPt = 0, fee = 0;
    PET_MASTER_FAMILIES.forEach(function (f) { family[f] = 0; });
    pets.forEach(function (p) {
      var r = petMasterRarity(p.master), own = petMasterKind(p);
      rarityPt += petMasterRarityPt(p.master);
      family[p.master.family] += PET_MASTER_FAMILY_PT[p.master.family][r] || 0;
      PET_MASTER_KINDS.forEach(function (k) { kind[k] += k === own ? PET_MASTER_KIND_OWN : PET_MASTER_KIND_OTHER; });
      fee += PET_MASTER_FEE[p.master.family][r];
    });
    function match(r, f, k) {
      return PET_MASTER_OUTPUT_IDS.filter(function (id) {
        var m = PET_INFO[id].master;
        return petMasterRarity(m) === r && m.family === f && (k === undefined || m.kind === k);
      });
    }
    var rarity = petMasterRarityOdds(rarityPt), familyShare = petMasterShare(family, PET_MASTER_FAMILIES);
    var fail = rarity.fail, odds = {};
    PET_MASTER_RARITIES.forEach(function (r) {
      if (!(rarity[r] > 0)) return;
      PET_MASTER_FAMILIES.forEach(function (f) {
        if (!(familyShare[f] > 0)) return;
        if (!match(r, f).length) { fail += rarity[r] * familyShare[f]; return; }
        var kinds = PET_MASTER_KINDS.filter(function (k) { return match(r, f, k).length > 0; });
        var kindShare = petMasterShare(kind, kinds);
        kinds.forEach(function (k) {
          if (!(kindShare[k] > 0)) return;
          var hit = match(r, f, k);
          hit.forEach(function (id) { odds[id] = (odds[id] || 0) + rarity[r] * familyShare[f] * kindShare[k] / hit.length; });
        });
      });
    });
    return { rarityPt: rarityPt, rarity: rarity, family: family, familyShare: familyShare, kind: kind, fee: fee, fail: fail, odds: odds };
  }
  // 反查：這隻寵物可以由哪幾隻 7 階冶煉出來
  var PET_SMELT_FROM = {};
  Object.keys(PET_INFO).forEach(function (id) {
    ((PET_INFO[id].smelt || {}).to || []).forEach(function (t) {
      (PET_SMELT_FROM[String(t.to)] || (PET_SMELT_FROM[String(t.to)] = [])).push({ from: id, rate: t.rate });
    });
  });

  function pct1(p) { return (Math.round(p * 1000) / 10) + "%"; }
  function petMasterTagText(p) {
    return PET_FAMILY_LABEL[p.master.family] + "・" + PET_RARITY_LABEL[petMasterRarity(p.master)] + "・" + PET_KIND_LABEL[petMasterKind(p)];
  }
  function petNpcText(role, fallback) {
    var n = PET_NPC_TOWNS[role];
    return n ? n.towns.map(townName).join("、") + "的「" + n.name + "」" : "「" + fallback + "」";
  }
  function petLinkChip(id, suffixHtml) {
    var p = PET_INFO[String(id)];
    return '<span class="map-chip" data-open-pet="' + id + '">' + itemIconHtml(id, 20) + escapeHtml(p ? p.name : "#" + id) +
      (suffixHtml ? ' ' + suffixHtml : '') + '</span>';
  }
  // 7 階進化模擬器：選 5 隻 6 階，照遊戲公式算出每隻 7 階的機率。prefill：預先選好的寵物 id（不足 5 隻的留空）
  function petMasterSimHtml(prefill) {
    var sixIds = Object.keys(PET_INFO).filter(function (id) { return PET_INFO[id].tier === 6 && PET_INFO[id].master; });
    if (!sixIds.length) return '';
    var html = '<div class="equip-box" style="margin-bottom:14px;">' +
      '<div style="font-size:13.5px;margin-bottom:8px;">🧮 <b>7 階進化模擬器</b>：選 ' + PET_MASTER_COUNT + ' 隻要交出去的 6 階寵物（可以重複選同一種）</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">';
    for (var i = 0; i < PET_MASTER_COUNT; i++) {
      var cur = prefill && prefill[i] != null ? String(prefill[i]) : "";
      html += '<select class="pm-sim-pick" style="padding:7px 8px;max-width:100%;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:3px;color:var(--text);">' +
        '<option value="">（第 ' + (i + 1) + ' 隻）</option>';
      PET_MASTER_FAMILIES.forEach(function (f) {
        var ids = sixIds.filter(function (id) { return PET_INFO[id].master.family === f; });
        if (!ids.length) return;
        html += '<optgroup label="' + PET_FAMILY_LABEL[f] + '">' + ids.map(function (id) {
          var p = PET_INFO[id];
          return '<option value="' + id + '"' + (id === cur ? ' selected' : '') + '>' + escapeHtml(p.name) + '（' +
            PET_RARITY_LABEL[petMasterRarity(p.master)] + '・' + PET_KIND_LABEL[petMasterKind(p)] + '）</option>';
        }).join('') + '</optgroup>';
      });
      html += '</select>';
    }
    return html + '</div><div id="pmSimOut"></div></div>';
  }
  function renderPetMasterSim() {
    var out = document.getElementById("pmSimOut");
    if (!out) return;
    var pets = Array.prototype.map.call(document.querySelectorAll(".pm-sim-pick"), function (s) { return PET_INFO[s.value]; }).filter(Boolean);
    if (pets.length < PET_MASTER_COUNT) {
      out.innerHTML = '<div class="empty-note" style="padding:0;">還要再選 ' + (PET_MASTER_COUNT - pets.length) + ' 隻。</div>';
      return;
    }
    var r = petMasterOdds(pets);
    function parts(share, labels) {
      return Object.keys(labels).filter(function (k) { return share[k] > 0; })
        .map(function (k) { return labels[k] + ' <span class="rate">' + pct1(share[k]) + '</span>'; }).join('　') || '-';
    }
    var kindShare = petMasterShare(r.kind, PET_MASTER_KINDS);
    var html = '<div style="font-size:13px;line-height:1.9;margin-bottom:8px;">' +
      '稀有度點數 <b>' + r.rarityPt + '</b> → ' + parts(r.rarity, PET_RARITY_LABEL) + '<br>' +
      '種族 → ' + parts(r.familyShare, PET_FAMILY_LABEL) + '<br>' +
      '類型 → ' + parts(kindShare, PET_KIND_LABEL) + '<span style="color:var(--text-faint);">（那一族沒有的類型會剔掉再重新分配）</span><br>' +
      '手續費 ' + bigNumHtml(r.fee) + ' 希望幣　失敗（' + PET_MASTER_COUNT + ' 隻都不會回來）<span class="rate' + (r.fail > 0 ? '' : ' low') + '">' + pct1(r.fail) + '</span></div>';
    var ids = Object.keys(r.odds).filter(function (id) { return r.odds[id] > 0; }).sort(function (a, b) { return r.odds[b] - r.odds[a] || a - b; });
    html += '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>可能進化成</th><th>分類</th><th>機率</th></tr></thead><tbody>';
    ids.forEach(function (id) {
      html += '<tr class="clickable" data-open-pet="' + id + '"><td>' + itemIconHtml(id, 28) + '<span class="name-link">' + escapeHtml(PET_INFO[id].name) + '</span></td>' +
        '<td>' + petMasterTagText(PET_INFO[id]) + '</td><td><span class="' + rateClassP(r.odds[id]) + '">' + pct1(r.odds[id]) + '</span></td></tr>';
    });
    out.innerHTML = html + '</tbody></table></div>';
  }
  function bindPetMasterSim() {
    Array.prototype.forEach.call(document.querySelectorAll(".pm-sim-pick"), function (s) { s.addEventListener("change", renderPetMasterSim); });
    renderPetMasterSim();
  }
  // 7 階進化的共通規則（6 階、7 階的詳細頁和寵物列表共用）
  function petMasterRulesHtml() {
    var at = PET_MASTER_RARITY_AT;
    function row(f) {
      var pt = PET_MASTER_FAMILY_PT[f], fee = PET_MASTER_FEE[f];
      return '<tr><td>' + PET_FAMILY_LABEL[f] + '</td>' + PET_MASTER_RARITIES.map(function (r) {
        return '<td>' + (pt[r] === null ? '<span class="rate low">-</span>' : '權重 ' + pt[r] + '・點數 ' + petMasterRarityPt({ family: f, rarity: r }) +
          '・' + bigNumHtml(fee[r])) + '</td>';
      }).join('') + '</tr>';
    }
    var families = PET_MASTER_FAMILIES.filter(function (f) {
      return Object.keys(PET_INFO).some(function (id) { return PET_INFO[id].tier === 6 && PET_INFO[id].master && PET_INFO[id].master.family === f; });
    });
    return '<details class="fold-section"><summary class="section-title">7 階進化規則<span class="fold-hint">點擊展開</span></summary>' +
      '<ol style="font-size:13px;line-height:1.85;margin:0 0 10px;padding-left:20px;">' +
      '<li>到 ' + escapeHtml(petNpcText("petMaster", "寵物大師")) + '，交出 <b>' + PET_MASTER_COUNT + ' 隻 6 階寵物</b>：每隻都要 <b>+9 而且經驗餵到 100%</b>，出戰中的那隻不能交。</li>' +
      '<li>不管成功或失敗，<b>' + PET_MASTER_COUNT + ' 隻都會消失</b>，手續費（' + PET_MASTER_COUNT + ' 隻各自的金額加總）也照扣。成功拿到的是 +0、未鑑定的 7 階。</li>' +
      '<li><b>稀有度</b>：把 ' + PET_MASTER_COUNT + ' 隻的「點數」加起來。' + at.normal + ' 點＝100% 一般，' + at.rare + ' 點＝100% 稀有，' + at.super +
      ' 點＝100% 超稀有，中間照比例混（例：150 點＝一般 50%、稀有 50%；250 點＝稀有 75%、超稀有 25%）。</li>' +
      '<li><b>種族</b>：照 ' + PET_MASTER_COUNT + ' 隻的「權重」比例抽。混到別族時，如果抽中的稀有度在那一族沒有 7 階寵物，就算<b>失敗</b>。</li>' +
      '<li><b>類型</b>（攻擊／魔法／綜合）：每隻給自己的類型 ' + PET_MASTER_KIND_OWN + '、另外兩種各 ' + PET_MASTER_KIND_OTHER +
      '，照比例抽；同一格有好幾隻 7 階就平分。6 階的類型看基礎能力：只有攻擊或只有魔法的就是那一種，兩種都有的「一般」算綜合、「稀有以上」看哪個高。</li>' +
      '</ol><div style="overflow-x:auto;margin-bottom:14px;"><table class="dtable"><thead><tr><th>一隻 6 階提供</th>' +
      PET_MASTER_RARITIES.map(function (r) { return '<th>' + PET_RARITY_LABEL[r] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      families.map(row).join('') + '</tbody></table></div></details>';
  }
  function petMasterSectionHtml(petId, p) {
    if (!p.master || (p.tier !== 6 && !p.master.kind)) return '';
    var m = p.master, r = petMasterRarity(m), html = '', prefill = [];
    if (p.tier === 6) {
      html += '<div class="section-title">7 階進化 <span class="count">(' + escapeHtml(petMasterTagText(p)) + ')</span></div>' +
        '<div style="font-size:13.5px;line-height:1.8;margin-bottom:10px;">這隻沒有材料進化，要湊 <b>' + PET_MASTER_COUNT + ' 隻 +9、經驗 100% 的 6 階</b>交給' +
        escapeHtml(petNpcText("petMaster", "寵物大師")) + '，會全部被吃掉、換一隻 7 階。<br>牠交出去時算：種族〔' + PET_FAMILY_LABEL[m.family] +
        '〕權重 <span class="rate">+' + (PET_MASTER_FAMILY_PT[m.family][r] || 0) + '</span>、稀有度點數 <span class="rate">+' + petMasterRarityPt(m) +
        '</span>、類型〔' + PET_KIND_LABEL[petMasterKind(p)] + '〕、手續費 ' + bigNumHtml(PET_MASTER_FEE[m.family][r]) + '。</div>';
      for (var i = 0; i < PET_MASTER_COUNT; i++) prefill.push(petId);
    } else {
      // 預設幫忙選一組「同族、同稀有度、同類型」的 6 階，讓玩家先看到大概的機率再自己換
      var six = Object.keys(PET_INFO).filter(function (id) { var q = PET_INFO[id]; return q.tier === 6 && q.master && q.master.family === m.family; });
      var sameRarity = six.filter(function (id) { return petMasterRarity(PET_INFO[id].master) === r; });
      var sameKind = sameRarity.filter(function (id) { return petMasterKind(PET_INFO[id]) === m.kind; });
      var pool = sameKind.length ? sameKind : sameRarity.length ? sameRarity : six;
      for (var j = 0; pool.length && j < PET_MASTER_COUNT; j++) prefill.push(pool[j % pool.length]);
      html += '<div class="section-title">取得方式：7 階進化 <span class="count">(' + escapeHtml(petMasterTagText(p)) + ')</span></div>' +
        '<div style="font-size:13.5px;line-height:1.8;margin-bottom:10px;">湊 <b>' + PET_MASTER_COUNT + ' 隻 +9、經驗 100% 的 6 階</b>交給' +
        escapeHtml(petNpcText("petMaster", "寵物大師")) + '，' + PET_MASTER_COUNT + ' 隻全部被吃掉，有機率換到這隻。要抽中牠，三關都要中：' +
        '稀有度抽到〔' + PET_RARITY_LABEL[r] + '〕、種族抽到〔' + PET_FAMILY_LABEL[m.family] + '〕、類型抽到〔' + PET_KIND_LABEL[m.kind] + '〕' +
        '（同一格還有別隻就再平分）。所以盡量交〔' + PET_FAMILY_LABEL[m.family] + '〕族、類型是〔' + PET_KIND_LABEL[m.kind] + '〕的 6 階：</div>' +
        '<div class="map-chip-row" style="margin-bottom:10px;">' + six.map(function (id) {
          return petLinkChip(id, '<span class="rate low">' + PET_RARITY_LABEL[petMasterRarity(PET_INFO[id].master)] + '・' + PET_KIND_LABEL[petMasterKind(PET_INFO[id])] + '</span>');
        }).join('') + '</div>';
    }
    return html + petMasterSimHtml(prefill) + petMasterRulesHtml();
  }
  function petSmeltCondHtml(fromId, sm) {
    var needs = sm.needs.map(function (n) {
      return petLinkChip(n.id, '<span class="rate low">' + (n.grow > 0 ? '+' + n.grow + ' 以上' : '不限成長') + '</span>');
    }).join('');
    return '<div style="font-size:13px;line-height:1.8;">本體 ' + petLinkChip(fromId, '<span class="rate low">+' + sm.grow + '</span>') + '（不能是出戰中）</div>' +
      '<div style="font-size:12.5px;color:var(--text-dim);margin:6px 0;">要吃掉的寵物（共 ' + sm.needs.length + ' 隻，出戰中的不算）：</div>' +
      '<div class="map-chip-row">' + needs + '</div>' +
      '<div style="font-size:12.5px;color:var(--text-dim);margin:8px 0 6px;">另外要：</div>' +
      '<div class="map-chip-row">' + itemChip(PET_SOUL_ID, sm.soul) + '<span class="map-chip" style="cursor:default;">' + bigNumHtml(sm.gold) + ' 希望幣</span></div>';
  }
  function petSmeltFailHtml() {
    var total = PET_SMELT_FAIL.reduce(function (s, w) { return s + w; }, 0);
    if (!total) return '';
    return '<div style="font-size:12.5px;color:var(--text-faint);line-height:1.8;margin-top:8px;">失敗時：被吃掉的寵物、寵物之魂、希望幣都不會退，' +
      '本體留著但經驗歸零，成長階段重抽 → ' + PET_SMELT_FAIL.map(function (w, g) { return '+' + g + '：' + pct1(w / total); }).join('、') + '。</div>';
  }
  function petSmeltSectionHtml(petId, p) {
    var html = '';
    var from = PET_SMELT_FROM[String(petId)] || [];
    if (from.length) {
      html += '<div class="section-title">取得方式：寵物冶煉 <span class="count">(' + from.length + ' 隻 7 階可以冶煉成牠)</span></div>' +
        '<div class="empty-note" style="padding:0 0 10px;">到 ' + escapeHtml(petNpcText("petSmelt", "寵物冶煉家")) +
        '，拿下面任何一隻 7 階當本體冶煉。成功後本體直接變成這隻（+0）；機率高的排前面。</div>';
      from.slice().sort(function (a, b) { return b.rate - a.rate || a.from - b.from; }).forEach(function (f) {
        var sm = PET_INFO[f.from].smelt;
        html += '<details class="fold-section equip-box" style="margin-bottom:10px;"><summary style="font-size:13.5px;">' +
          '<span class="name-link" data-open-pet="' + f.from + '">' + escapeHtml(PET_INFO[f.from].name) + '</span> 冶煉，' +
          '<span class="rate">' + pct1(f.rate / 10000) + '</span><span class="fold-hint">看條件</span></summary>' +
          '<div style="margin-top:10px;">' + petSmeltCondHtml(f.from, sm) + '</div></details>';
      });
      html += petSmeltFailHtml();
    }
    if (p.smelt) {
      var sm2 = p.smelt, okRate = sm2.to.reduce(function (s, t) { return s + t.rate; }, 0) / 10000;
      html += '<div class="section-title">寵物冶煉 <span class="count">(成功率 ' + pct1(okRate) + ')</span></div>' +
        '<div class="equip-box" style="margin-bottom:10px;">' +
        '<div class="empty-note" style="padding:0 0 8px;">到 ' + escapeHtml(petNpcText("petSmelt", "寵物冶煉家")) + '，把這隻當本體冶煉：</div>';
      sm2.to.forEach(function (t) {
        var toPet = PET_INFO[String(t.to)];
        html += '<div style="font-size:13.5px;margin-bottom:4px;">可冶煉成 <span class="name-link" data-open-pet="' + t.to + '">' +
          escapeHtml(toPet ? toPet.name : "#" + t.to) + '</span>，<span class="rate">' + pct1(t.rate / 10000) + '</span></div>';
      });
      html += '<div style="font-size:13px;color:var(--text-faint);margin-bottom:8px;">冶煉失敗，<span class="rate low">' + pct1(1 - okRate) + '</span></div>' +
        petSmeltCondHtml(petId, sm2) + petSmeltFailHtml() + '</div>';
    }
    return html;
  }

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
          '<span class="rname">' + itemIconHtml(k.itemId, 32) + escapeHtml(k.name) + '</span>' +
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
    html += '<div class="empty-note" style="padding:0 0 10px;">出戰中的寵物才會生效（遊戲改版後已經沒有飽食度，加成只看成長階段）。點寵物名稱看牠 9 個成長階段各自提供多少能力。</div>';
    if (tierFilter === 6 || tierFilter === 7) {
      html += '<div class="empty-note" style="padding:0 0 10px;">7 階有兩種：一種是把 ' + PET_MASTER_COUNT + ' 隻 6 階交給寵物大師換來的，' +
        '另一種（名字有 .G）是拿 7 階去找寵物冶煉家、吃掉指定的寵物冶煉出來的。點寵物看牠各自的條件。</div>' +
        petMasterSimHtml([]) + petMasterRulesHtml();
    }
    if (!petIds.length) {
      html += '<div class="empty-note">這個階級沒有寵物資料。</div>';
    } else {
      html += '<ul class="result-list">';
      petIds.forEach(function (pid) {
        var p = PET_INFO[pid];
        html += '<li class="result-item" data-open-pet="' + pid + '">' +
          '<span class="rname">' + itemIconHtml(pid, 32) + '<span>' + escapeHtml(p.name) +
          '<span class="pet-obtain">取得：' + escapeHtml(petObtainText(pid)) + '</span></span></span>' +
          '<span class="rmeta">' + (p.master ? escapeHtml(petMasterTagText(p)) + '　' : '') + p.tier + '階　Lv' + p.lv + '・名聲 ' + fmtNum(p.fame) + '</span>' +
          '</li>';
      });
      html += '</ul>';
    }
    $detail.innerHTML = html;
    bindPetMasterSim();
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
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + itemIconHtml(k.itemId, 64) + escapeHtml(k.name) + '</div>';
    html += '<div class="badge-row" style="margin-bottom:14px;">' +
      '<span class="el-chip" style="color:var(--' + (ELEMENT_CLASS[k.element] || "el-none") + ')">' + escapeHtml(ELEMENT_LABEL[k.element] || k.element) + '屬性</span>' +
      '<span class="badge">最高等級 ' + BATTLE_PET_INFO.maxLevel + '</span>' +
      '</div>';

    if (k.stages && k.stages.length) {
      html += '<div class="section-title">進化階段</div>';
      // 每個階段的外觀：遊戲 buildArenaBattlePet 用 models[grade]，沒有就用 model
      html += '<div class="map-chip-row" style="margin-bottom:14px;">' + k.stages.map(function (s, idx) {
        var stageIcon = modelIconHtml((k.models && k.models[idx]) || k.model, 48);
        return '<span class="map-chip' + (stageIcon ? ' bpet-stage-chip' : '') + '">' + stageIcon + (idx + 1) + '. ' + escapeHtml(s) + '</span>';
      }).join('') + '</div>';
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
        html += '<div class="row1"><span class="slot">' + bpetSkillIconHtml(s.icon, 32) + escapeHtml(s.name) + '</span><span class="rate">開放等級 Lv' + s.unlockLevel + '</span></div>';
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

  // ---------- 寵物鑑定（2026-09 新系統，規則照遊戲 bundle 的 appraisePet／petAppraisalInput／O_／E_／A_）----------
  //   新收養的寵物都是「未鑑定」；到寵物鑑定師付「寵物賣價」的金幣鑑定一次，出戰中的那隻不能鑑定
  //   每一種屬性各自擲一次：出現機率 = 10% + (階級-1)×3%；出現了再抽倍率 k（下表），數值 = k × 權重 ÷ 5，k=0 等於沒出現
  //   只有「出戰中」那隻的鑑定屬性會加到角色身上；進化成 6 階的寵物，鑑定會清掉、變回未鑑定
  //   種類編號照遊戲現行的 c_：1攻 2魔 3命中 4迴避 5防禦 6必殺 7攻速 8移速 11 HP% 12 AP% 13增傷 14減傷
  var PET_APPR_KINDS = [[1, 25], [2, 25], [5, 25], [8, 15], [7, 10], [3, 10], [4, 10], [6, 10], [11, 10], [12, 10], [13, 5], [14, 5]];
  var PET_APPR_KIND_NAME = { 1: "攻擊力", 2: "魔法力", 3: "命中率", 4: "迴避率", 5: "防禦力", 6: "必殺技", 7: "攻擊速度", 8: "移動速度", 11: "HP", 12: "AP", 13: "增加傷害", 14: "減少傷害" };
  var PET_APPR_PCT_KINDS = { 11: 1, 12: 1, 13: 1, 14: 1 };
  var PET_APPR_ROLL = [[-2, 12], [-1, 17], [1, 25.5], [2, 21], [3, 1], [4, 0.5]]; // [倍率 k, 機率%]；另外 23% 抽到 0＝這條沒出現
  var PET_APPRAISERS = "雪山礦村、獅子城的「寵物鑑定師‧瑪亞」，努瓦村的「寵物鑑定師瑪麗」";
  function petApprChance(tier) { return 0.1 + Math.max(0, tier - 1) * 0.03; }
  function petApprValueText(kind, v) { return (v > 0 ? "+" : "") + v + (PET_APPR_PCT_KINDS[kind] ? "%" : ""); }
  function petAppraisalHtml(petId, p) {
    var chance = petApprChance(p.tier || 1);
    var item = ITEMS[String(petId)];
    var fee = item ? item.sell : null;
    var expect = PET_APPR_KINDS.length * chance * 0.77;
    var html = '<details class="fold-section" open><summary class="section-title">寵物鑑定<span class="fold-hint">點擊收合</span></summary>';
    html += '<div class="equip-box" style="margin-bottom:10px;font-size:13px;line-height:1.8;">' +
      '<div>鑑定地點：' + PET_APPRAISERS + '。</div>' +
      '<div>費用：<b>' + (fee != null ? fmtNum(fee) + '</b> 金幣（等於這隻寵物的賣價）' : '</b>這隻寵物的賣價') + '，每隻只能鑑定一次。</div>' +
      '<div>每一種屬性各自有 <b>' + Math.round(chance * 1000) / 10 + '%</b> 機率出現（' + (p.tier || 1) + ' 階；1 階 10%、每高一階 +3%），' +
      '平均每隻會鑑定出約 <b>' + Math.round(expect * 10) / 10 + '</b> 條；也可能一條都沒有。</div>' +
      '<div style="color:var(--text-faint);font-size:12px;margin-top:4px;">' +
      '・新收養的寵物都是「未鑑定」；<b>出戰中的那隻不能鑑定</b>，要先換另一隻出戰。<br>' +
      '・只有<b>出戰中</b>那隻的鑑定屬性會加到角色身上。<br>' +
      '・進化成 <b>6 階</b>寵物時鑑定會被清掉、變回未鑑定（要再付一次錢）；進化成 5 階以下會保留。<br>' +
      '・屬性可能是負的（下表紅字），鑑定完不能重來。</div>' +
      '</div>';
    html += '<div style="overflow-x:auto;"><table class="dtable" style="white-space:nowrap;"><thead><tr><th>屬性</th>' +
      PET_APPR_ROLL.map(function (r) { return '<th>' + (r[0] > 0 ? '+' : '') + r[0] + ' 檔<br><span style="font-weight:400;color:var(--text-faint);">' + r[1] + '%</span></th>'; }).join('') +
      '<th>出現率</th></tr></thead><tbody>';
    PET_APPR_KINDS.forEach(function (pair) {
      var kind = pair[0], w = pair[1];
      html += '<tr><td>' + PET_APPR_KIND_NAME[kind] + '</td>' +
        PET_APPR_ROLL.map(function (r) {
          var v = r[0] * w / 5;
          return '<td><span class="rate' + (v < 0 ? ' low" style="color:var(--red,#c0392b);' : '') + '">' + petApprValueText(kind, v) + '</span></td>';
        }).join('') +
        '<td>' + Math.round(chance * 77 * 10) / 10 + '%</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="font-size:11.5px;color:var(--text-faint);margin:6px 0 16px;">' +
      '表頭的 % 是「這條屬性出現時」落在哪一檔的機率；另外有 23% 會抽到 0 檔，等於這條沒出現，所以「出現率」＝階級機率 × 77%。' +
      '+3、+4 檔非常少見（合計 1.5%）。</div>';
    html += '</details>';
    return html;
  }

  function showPetDetail(petId) {
    var p = PET_INFO[String(petId)];
    if (!p) return;
    var html = backButtonHtml();
    html += '<div class="section-title"><span class="name-link" id="petBackToList" style="cursor:pointer;">← 寵物列表</span></div>';
    html += '<div class="detail-title" style="font-size:19px;margin-bottom:8px;">' + itemIconHtml(petId, 64) + escapeHtml(p.name) + '</div>';
    html += '<div class="badge-row" style="margin-bottom:14px;">' +
      '<span class="badge">' + p.tier + ' 階</span>' +
      '<span class="badge">出戰需求 Lv' + p.lv + '</span>' +
      '<span class="badge">出戰需求名聲 ' + fmtNum(p.fame) + '</span>' +
      '<span class="badge">升一階要餵 ' + fmtNum(p.feedFull) + ' 起（每階 +10%）</span>' +
      '</div>';
    // 遊戲 by()：第 g 階升下一階要累積 round(feedFull × (10 + g) / 10) 的餵食量；飽食度 hunger 在存檔 v39 就拿掉了
    html += '<div class="empty-note" style="padding:0 0 14px;">出戰中就會套用下面的加成（遊戲改版後已經沒有飽食度）；沒有成長曲線的屬性，不管幾階都固定不變。</div>';
    html += petObtainHtml(petId);

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

    html += petMasterSectionHtml(petId, p) + petSmeltSectionHtml(petId, p);

    html += petAppraisalHtml(petId, p);

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
    bindPetMasterSim();
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
  // 房間的首領：新資料一個房間可以有好幾隻（bosses），舊資料只有單一 boss
  function roomBosses(isl) {
    if (isl.bosses && isl.bosses.length) return isl.bosses;
    return isl.boss != null ? [isl.boss] : [];
  }
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
      var bosses = roomBosses(isl);
      bosses.forEach(function (b) { if (ids.indexOf(b) === -1) ids.push(b); });
      ids.forEach(function (mid) {
        var e = touch(mid, "spawn");
        if (bosses.indexOf(mid) !== -1) e.isBoss = true;
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
    return monsterIconHtml(mid, 32) + '<span class="lv-tag">Lv.' + mon.lv + '</span><span class="name-link" data-goto-monster="' + mid + '">' + escapeHtml(mon.name) + '</span>';
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

  // 寶箱內容。新格式（有 draws／tierMeta）照遊戲開箱規則：開一次抽 draws 次，每次先照權重抽一組、再在組內抽一件，
  // 組內機率加起來不到 100% 的部分是「什麼都沒開到」；舊格式是每組各開出一件。
  function boxTiersHtml(box) {
    var html = "";
    var isNew = !!box.tierMeta;
    if (isNew) {
      html += '<div class="empty-note" style="padding:10px 0 4px;">每開一次會抽 <b>' + (box.draws || 1) + '</b> 次；每次先抽一組' +
        (box.tiers.length > 1 ? '（各組機率寫在標題）' : '') + '，再從那一組抽一件，下面的機率是「抽到這一組之後」拿到各物品的機率。</div>';
    }
    box.tiers.forEach(function (tier, tIdx) {
      var meta = isNew ? box.tierMeta[tIdx] || {} : null;
      html += '<div class="empty-note" style="padding:10px 0 4px;">開出物品（第 ' + (tIdx + 1) + ' 組' +
        (isNew ? (box.tiers.length > 1 ? '，抽到這組 ' + meta.pct + '%' : '') : '，每組開出一件') + '）</div>';
      html += '<table class="dtable"><thead><tr><th>物品</th><th>機率</th></tr></thead><tbody>';
      tier.slice().sort(function (a, b) { return b.pct - a.pct; }).forEach(function (t) {
        html += itemLinkRow(t.itemId, '<td><span class="rate' + (t.pct < 1 ? " low" : "") + '">' + t.pct + '%</span></td>');
      });
      if (isNew && meta.nothingPct > 0) {
        html += '<tr><td style="color:var(--text-faint);">（什麼都沒開到）</td><td><span class="rate low">' + meta.nothingPct + '%</span></td></tr>';
      }
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
      (dg.maxLv ? ' ~ ' + dg.maxLv + ' 之間' : ' 以上') + '才能進入；每日進場次數每天台灣時間早上 6 點重置。</div>';

    // 進場時會被丟掉的道具（遊戲 enterDungeon() 的 forbid）
    if (dg.forbid && dg.forbid.length) {
      html += '<div class="ruin-warn" style="margin-top:12px;"><div class="ruin-warn-title">⚠️ 進入時會把身上這些道具全部丟掉</div>' +
        '<div class="ruin-warn-body">進場前記得先存到倉庫：</div><div class="map-chip-row" style="margin-top:6px;">' +
        dg.forbid.map(function (iid) { return itemChip(iid); }).join("") + '</div></div>';
    }

    // 進場條件（遊戲 dungeonBlock()）：要二轉、要有隊友
    var req = dg.requires || {};
    if (req.secondJob || req.party) {
      var reqs = [];
      if (req.secondJob) reqs.push("<b>已經二轉</b>");
      if (req.party) reqs.push("<b>隊伍裡至少要有 1 名隊友</b>");
      html += '<div class="equip-box" style="margin-top:12px;font-size:13px;line-height:1.8;">🚪 進場條件：除了等級，還要' + reqs.join("、而且") + '，不然進不去。</div>';
    }

    // 每層減益（賢者之塔Another）：每層固定的增減傷；累計名聲不到該層門檻時，再疊上名聲懲罰（遊戲 vg()／副本「減益」視窗）
    if (dg.floors && dg.floors.length) {
      var fp = dg.famePenalty || null;
      var fameGates = dg.floors.map(function (f) { return f.fame || 0; });
      var maxGate = Math.max.apply(null, fameGates);
      function signedPct(v, reverse) {
        // taken 跟裝備的「減少傷害」同一個欄位：負的代表受到的傷害變多，所以顯示時反過來
        var shown = reverse ? -v : v;
        return (shown > 0 ? "+" : "") + shown + "%";
      }
      html += '<div class="section-title">每層減益 <span class="count">（副本裡「減益」按鈕看到的同一份）</span></div>';
      if (fp) {
        html += '<div class="ruin-warn"><div class="ruin-warn-title">⚠️ 累計名聲不到該層門檻（最高 ' + fmtNum(maxGate) + '），減益會加重、掉落率 ' + (fp.dropPct || 0) + '%！</div>' +
          '<div class="ruin-warn-body">名聲不足時，除了下表的基本減益，還會再：' + escapeHtml(penaltyEffectText({ stats: fp.stats, taken: fp.taken, dealt: fp.dealt })) +
          (fp.dropPct ? '；掉落率 ' + fp.dropPct + '%' : '') + '。</div></div>';
      }
      html += '<table class="dtable"><thead><tr><th>樓層</th><th>名聲門檻</th><th>造成的傷害</th><th>受到的傷害</th>' + (fp ? '<th>名聲不足時</th>' : '') + '</tr></thead><tbody>';
      dg.floors.forEach(function (f) {
        var shortCell = "";
        if (fp) {
          shortCell = '<td style="font-size:12.5px;color:#c0392b;">造成 ' + signedPct((f.dealt || 0) + (fp.dealt || 0)) +
            '、受到 ' + signedPct((f.taken || 0) + (fp.taken || 0), true) + '</td>';
        }
        html += '<tr><td>第 ' + f.floor + ' 層</td><td>' + fmtNum(f.fame || 0) + '</td>' +
          '<td>' + signedPct(f.dealt || 0) + '</td><td>' + signedPct(f.taken || 0, true) + '</td>' + shortCell + '</tr>';
      });
      html += '</tbody></table>';
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">看的是<b>累計名聲</b>（fame.total）。名聲夠的話只有「造成／受到的傷害」那兩欄的基本減益。</div>';
    }

    // 單人加成：這趟從頭到尾沒帶隊友才有（遊戲 soloBuff）
    if (dg.soloBuffs && dg.soloBuffs.length && !req.party) {
      html += '<div class="section-title">單人挑戰加成 <span class="count">（整趟都沒帶隊友時才有）</span></div>';
      dg.soloBuffs.forEach(function (b) {
        html += '<div class="equip-box"><div class="equip-stat-grid">' +
          '<div>攻擊<br><b>+' + fmtNum(b.atk || 0) + '</b></div>' +
          '<div>魔法<br><b>+' + fmtNum(b.mag || 0) + '</b></div>' +
          '<div>防禦<br><b>+' + fmtNum(b.def || 0) + '</b></div>' +
          '<div>命中<br><b>+' + fmtNum(b.hit || 0) + '</b></div>' +
          '<div>迴避<br><b>+' + fmtNum(b.eva || 0) + '</b></div>' +
          '<div>必殺<br><b>+' + fmtNum(b.crit || 0) + '</b></div>' +
          '<div>增加傷害<br><b>+' + (b.dealtPct || 0) + '%</b></div>' +
          '<div>減少傷害<br><b>+' + (b.takenPct || 0) + '%</b></div>' +
          '</div>' + (dg.soloBuffs.length > 1 ? '<div class="empty-note" style="padding:6px 0 0;">在〔' + escapeHtml(mapName(b.mapId)) + '〕的區域</div>' : '') + '</div>';
      });
    }

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
        var bosses = roomBosses(isl);
        var hasContent = (isl.monsters || []).length || bosses.length || (isl.drops || []).length || (isl.needItems || []).length;
        if (!hasContent) { emptyCount++; return; }
        var name = isl.name || isl.key;
        var r = byName[name];
        if (!r) { r = byName[name] = { name: name, bosses: [], monsters: [], drops: [], needItems: [] }; shown.push(r); }
        bosses.forEach(function (b) { addUnique(r.bosses, b); });
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
              return '<span class="map-chip" data-goto-monster="' + b + '">' + monsterIconHtml(b, 20) + escapeHtml(bossNames[i]) + '</span>';
            }).join("") + '</div>';
        }
        if (others.length) {
          html += '<div class="empty-note" style="padding:0 0 6px;">怪物：</div><div class="map-chip-row" style="margin-bottom:8px;">' +
            others.map(function (mid) {
              var mon = MONSTERS[String(mid)];
              return '<span class="map-chip" data-goto-monster="' + mid + '">' + monsterIconHtml(mid, 20) + escapeHtml(mon ? mon.name : "無資料") + '</span>';
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

  // ---------- 地圖頁（從怪物頁的「出現地圖」點進來）----------
  // 這張地圖出生的怪物（MONSTERS[].maps）＋牠們變身／召喚出來的型態，再把所有掉落合併成一張總表。
  // 掉落機率跟怪物頁一樣：有輸入等級就套等級差衰減和〔乞討〕加成（playerDropMultiplier），沒輸入就是原始機率。
  function mapMonsterList(mid) {
    var midNum = Number(mid), seen = {}, list = [];
    Object.keys(MONSTERS).forEach(function (id) {
      if ((MONSTERS[id].maps || []).indexOf(midNum) === -1) return;
      seen[id] = true;
      list.push({ id: id, role: "spawn", from: null });
    });
    // 變身／召喚型態沒有自己的出生點，跟著來源怪物算（可能好幾層）
    for (var i = 0; i < list.length; i++) {
      monsterReactions(list[i].id).forEach(function (r) {
        var to = String(r.to);
        if (seen[to] || !MONSTERS[to]) return;
        seen[to] = true;
        list.push({ id: to, role: r.act === "summon" ? "summon" : "morph", from: list[i].id });
      });
    }
    return list;
  }

  // 地圖下拉選單的選項：有怪物出生的地圖（沒有名字的「地圖 #N」不列），依怪物最低等級排序，副本地圖另外一組
  var mapBrowserLast = null; // 上次在地圖頁選的地圖，按「🗺️ 地圖」回來時還在
  var mapOptionCache = null;
  function mapOptions() {
    if (mapOptionCache) return mapOptionCache;
    var info = {};
    Object.keys(MONSTERS).forEach(function (id) {
      var mon = MONSTERS[id];
      (mon.maps || []).forEach(function (mid) {
        var e = info[mid] || (info[mid] = { id: String(mid), count: 0, minLv: null, maxLv: null, lvs: [] });
        e.count++;
        if (mon.isHarvest) return;
        e.lvs.push(mon.lv);
        if (e.minLv == null || mon.lv < e.minLv) e.minLv = mon.lv;
        if (e.maxLv == null || mon.lv > e.maxLv) e.maxLv = mon.lv;
      });
    });
    // 排序用中位數：低等小怪常常散在很多張地圖，用最低等級排會讓高等地圖跑到前面
    Object.keys(info).forEach(function (k) {
      var l = info[k].lvs.sort(function (a, b) { return a - b; });
      info[k].midLv = l.length ? l[Math.floor(l.length / 2)] : null;
    });
    var dungeonMaps = {};
    Object.keys(DUNGEON_BY_ID).forEach(function (did) { dungeonMaps[String(DUNGEON_BY_ID[did].mapId)] = true; });
    var list = Object.keys(info).map(function (k) { return info[k]; }).filter(function (e) {
      return MAPS[e.id] && !/^地圖 ?#/.test(MAPS[e.id]);
    });
    list.forEach(function (e) { e.dungeon = !!dungeonMaps[e.id]; });
    list.sort(function (a, b) {
      return ((a.midLv == null ? 9999 : a.midLv) - (b.midLv == null ? 9999 : b.midLv)) || (Number(a.id) - Number(b.id));
    });
    mapOptionCache = list;
    return list;
  }
  function mapSelectHtml(mid) {
    var list = mapOptions();
    function opt(e) {
      var lv = e.minLv == null ? "只有採集點" : "Lv" + e.minLv + (e.maxLv !== e.minLv ? "~" + e.maxLv : "");
      return '<option value="' + e.id + '"' + (e.id === mid ? " selected" : "") + '>' + escapeHtml(MAPS[e.id]) + '（' + lv + '）' +
        (MAP_PENALTY[e.id] ? '⚠️廢墟' : '') + '</option>';
    }
    return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">' +
      '<label for="mapSelect" style="font-size:13px;color:var(--text-dim);">選擇地圖</label>' +
      '<select id="mapSelect" style="flex:1;min-width:200px;max-width:420px;padding:8px 10px;background:var(--ink-2);border:1px solid var(--line-hi);border-radius:4px;color:var(--text);font-size:14px;">' +
      '<option value="">請選擇地圖（' + list.length + ' 張，依怪物的主要等級排序）...</option>' +
      '<optgroup label="野外地圖">' + list.filter(function (e) { return !e.dungeon; }).map(opt).join("") + '</optgroup>' +
      '<optgroup label="副本地圖">' + list.filter(function (e) { return e.dungeon; }).map(opt).join("") + '</optgroup>' +
      '</select></div>';
  }
  function wireMapSelect() {
    var sel = document.getElementById("mapSelect");
    if (!sel) return;
    sel.addEventListener("change", function () {
      if (!sel.value) return;
      currentView = { kind: "map", id: sel.value };
      showMapDetail(sel.value);
    });
  }

  function showMapDetail(mid) {
    mid = mid == null ? "" : String(mid);
    currentDetail = { type: "map", id: mid };
    if (mid) mapBrowserLast = mid;
    if (!mid) {
      $detail.innerHTML = backButtonHtml() + '<h2 style="margin-top:0;" data-detail-of="map:">🗺️ 地圖</h2>' + mapSelectHtml("") +
        '<div class="empty-note">選一張地圖，會列出這張地圖出現的所有怪物，以及合併起來的掉落物品總表。' +
        '上方輸入你的等級的話，掉落機率會換算成你實際打得到的數字。</div>';
      wireMapSelect();
      return;
    }
    var monsters = mapMonsterList(mid);

    var drops = {}, dropOrder = [];
    monsters.forEach(function (m) {
      var mon = MONSTERS[m.id];
      if (!mon || monsterNeverKilled(m.id)) return;
      var chances = monsterDropChances(mon, playerDropMultiplier(mon));
      Object.keys(chances).forEach(function (iid) {
        var c = chances[iid];
        var d = drops[iid];
        if (!d) { d = drops[iid] = { id: iid, best: 0, sources: [] }; dropOrder.push(d); }
        d.sources.push({ mid: m.id, p: c.p, groups: c.groups });
        if (c.p > d.best) d.best = c.p;
      });
    });
    dropOrder.sort(function (a, b) { return (!!BOX_BY_ID[b.id] - !!BOX_BY_ID[a.id]) || (b.best - a.best); });
    dropOrder.forEach(function (d) {
      d.sources = dedupeSourcesByName(d.sources).sort(function (a, b) { return b.p - a.p; });
    });

    var spawnMons = monsters.filter(function (m) { return m.role === "spawn"; }).map(function (m) { return MONSTERS[m.id]; });
    var lvs = spawnMons.filter(function (m) { return !m.isHarvest; }).map(function (m) { return m.lv; });
    var dungeonsHere = Object.keys(DUNGEON_BY_ID).filter(function (did) { return String(DUNGEON_BY_ID[did].mapId) === mid; });

    var html = backButtonHtml() + mapSelectHtml(mid);
    html += '<div class="detail-head" data-detail-of="map:' + mid + '"><div>' +
      '<div class="detail-title">🗺️ ' + escapeHtml(mapName(mid)) + '</div>' +
      '<div class="detail-sub">地圖編號 #' + mid + '</div>' +
      '<div class="badge-row">' +
      (mapAccessText(mid) ? '<span class="badge">' + escapeHtml(mapAccessText(mid)) + '</span>' : '') +
      (MAP_PENALTY[mid] ? '<span class="badge" style="color:#c0392b;">廢墟地圖</span>' : '') +
      '</div></div></div>';
    html += ruinPenaltyWarningHtml([mid]);

    if (dungeonsHere.length) {
      html += '<div class="equip-box" style="margin-bottom:14px;font-size:13px;">這張地圖是副本：' +
        dungeonsHere.map(function (did) { return '<span class="name-link" data-open-dungeon="' + did + '">' + escapeHtml(DUNGEON_BY_ID[did].name) + '</span>'; }).join("、") +
        '（副本頁有首領、區域配置和寶箱）</div>';
    }

    html += '<div class="stat-grid">' +
      statTile("怪物種類", monsters.length) + statTile("掉落物品", dropOrder.length) +
      (lvs.length ? '<div class="stat-tile"><div class="v">Lv' + Math.min.apply(null, lvs) + '~' + Math.max.apply(null, lvs) + '</div><div class="k">怪物等級</div></div>' : '') +
      '</div>';

    // 怪物清單
    html += '<div class="section-title">出現的怪物 <span class="count">(' + monsters.length + ')</span></div>';
    if (!monsters.length) {
      html += '<div class="empty-note">資料裡沒有怪物在這張地圖出生。</div>';
    } else {
      var ordered = monsters.filter(function (m) { return m.role === "spawn"; }).sort(function (a, b) {
        var ma = MONSTERS[a.id], mb = MONSTERS[b.id];
        return (!!ma.isHarvest - !!mb.isHarvest) || (ma.lv - mb.lv);
      });
      var childrenOf = {};
      monsters.forEach(function (m) { if (m.from) (childrenOf[m.from] || (childrenOf[m.from] = [])).push(m); });
      html += '<table class="dtable"><thead><tr><th>怪物</th><th>等級</th><th>類型</th>' +
        (dropCalcState.level != null ? '<th>換算後經驗</th>' : '') + '</tr></thead><tbody>';
      function row(m, depth) {
        var mon = MONSTERS[m.id];
        var tag = mon.isHarvest ? "採集點" : m.role === "morph" ? "變身型態" : m.role === "summon" ? "召喚" : (mon.aggressive ? "主動攻擊" : "被動");
        html += '<tr class="clickable" data-goto-monster="' + m.id + '">' +
          '<td style="padding-left:' + (10 + depth * 18) + 'px;">' + (depth ? '↳ ' : '') + monsterIconHtml(m.id, 32) + '<span class="name-link">' + escapeHtml(mon.name) + '</span></td>' +
          '<td>' + mon.lv + '</td><td style="font-size:12.5px;">' + tag + '</td>' +
          (dropCalcState.level != null ? '<td>' + (mon.isHarvest ? '－' : bigNumHtml(monsterExpAt(mon, dropCalcState.level))) + '</td>' : '') +
          '</tr>';
        (childrenOf[m.id] || []).forEach(function (c) { row(c, depth + 1); });
      }
      ordered.forEach(function (m) { row(m, 0); });
      html += '</tbody></table>';
    }

    // 掉落總表
    html += '<div class="section-title">掉落物品總表 <span class="count">(' + dropOrder.length + ')</span></div>';
    if (dropOrder.length) html += dropCalcBar();
    if (!dropOrder.length) {
      html += '<div class="empty-note">這張地圖的怪物目前沒有紀錄任何掉落物。</div>';
    } else {
      html += '<div class="empty-note" style="padding:0 0 8px;">' + (dropCalcState.level != null
        ? '機率已照你輸入的 Lv' + dropCalcState.level + (dropCalcState.blacksmith ? ' 換算（鐵匠／匠師不受等級差衰減）' : ' 換算等級差衰減') +
          (dropBegBonusPct() ? '，加上〔乞討〕+' + dropBegBonusPct() + '%' : '') + '。'
        : '上方輸入你的等級，這裡會換算成你實際打得到的機率。') + '</div>';
      html += '<table class="dtable"><thead><tr><th>物品</th><th>最高機率</th><th>掉落來源</th></tr></thead><tbody>';
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
      html += '<div style="font-size:11.5px;color:var(--text-faint);margin-top:6px;">' + escapeHtml(DROP_FORMULA_NOTE) + '</div>';
    }

    $detail.innerHTML = html;
    wireMapSelect();
    wireDropCalcBar(function () { showMapDetail(mid); });
  }

  $changelogBtn.addEventListener("click", openChangelogList);

  // ---------- 使用說明（原本放在標題下方的長說明，改成按鈕點開，沿用更新紀錄的彈窗）----------
  var HELP_SECTIONS = [
    ["🔍 搜尋", "輸入物品名稱，查出會掉落它的怪物、出現地圖與掉落機率，以及哪些商店有賣；輸入怪物名稱，查出牠的能力與完整掉落表。名稱的字不用連在一起，例如「木劍」也會找到「木製劍」。"],
    ["🗂️ 分類下拉選單", "搜尋欄左邊可以選裝備部位（武器、頭部…）或物品分類（恢復、材料、任務…）。選了分類只會列物品；不輸入關鍵字時會直接列出整個分類。"],
    ["⚔️ 僅查詢裝備能力", "勾選後輸入能力名稱（例如「魔法」「攻速」「減傷」），只列出有這項能力加成的裝備並依數值排序，不比對物品名稱。可用空白同時查多項；能力後面可以加 >（大於等於）、<（小於等於）、=（等於）縮小範圍，例如「魔法力>20 攻速<10」。"],
    ["✅ 僅顯示目前可取得裝備", "搜尋結果上方的勾選框。勾選後只列出遊戲裡目前有取得管道（掉落、商店、NPC 兌換、任務、製作、合成、開箱、釣魚、分解、每日任務等）的物品。"],
    ["📈 你目前的等級", "輸入後，掉落表會多一欄「換算後機率」（你比怪物高 30 級以上，掉落會打折），怪物頁也會顯示換算後的每隻經驗。"],
    ["⚒️ 鐵匠／〔乞討〕", "掉落表上方的選項：勾「鐵匠／匠師」是不受等級差打折（不是提升掉落率，要先輸入等級、而且比怪物高 30 級以上才看得出差別）；〔乞討〕是初心者技能，直接把掉落率乘上 +3%～+30%。"],
    ["🧰 職業／裝備位置篩選", "搜尋列下方可以依職業、裝備位置列出所有符合的裝備。"],
    ["🗺️ 地圖", "用下拉選單選一張地圖，列出這張地圖的所有怪物和合併的掉落總表（有輸入等級就換算成實際機率）。怪物頁的「出現地圖」也可以直接點進去。"],
    ["⚒️ 鐵匠相關", "發條強化屬性表，以及兩種分解：找雷分解（鎔解，選裝備就能算出每個精煉值的費用、各種鎔解石機率）和強硬分解（艾希頓裝備換凝結之魂的費用、機率、精煉加成）。"],
    ["✨ 技能", "各職業（含二轉分支）的技能列表；點技能看前置技能、特殊效果，以及每一級的威力、AP、冷卻、詠唱、收招、仇恨等數值。"],
    ["📚 其他功能", "寵物列表、副本，以及任務總覽（每日、書信、委託、藍圖任務、轉職）。寶箱可以從副本頁或物品頁點進去看。物品頁會列出 NPC 兌換、技能寶石等資訊；有變體的怪物會列出各型態能力。"],
    ["💠 鑲嵌石", "角色身上四顆石頭的玩法、每一階的強化花費與成功率、會抽到哪些能力與數值機率、材料怎麼來（打碎寶石、找 NPC 兌換），以及相關的名品館道具。材料、可打碎的寶石、兩張券的物品頁也會列出用途。"]
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
    if (e.target.closest("#changelogBackdrop, #peekBackdrop") && e.target.closest("[data-open-questline],[data-open-pet],[data-open-bpet],[data-goto-questtab],[data-open-map],[data-goto-smith],[data-goto-stones]")) {
      closePeek();
      closeChangelog();
    }
    var commissionDetail = e.target.closest("[data-commission-detail]");
    if (commissionDetail) { openCommissionDetail(commissionDetail.getAttribute("data-commission-detail"), commissionDetail.getAttribute("data-commission-detail-town")); return; }
    var backLink = e.target.closest("[data-go-back]");
    if (backLink) { goBackOneView(); return; }
    // 技能頁：換職業／分支分頁不記上一頁（跟鐵匠分頁一樣），點進某個技能才記
    var skillList = e.target.closest("[data-skill-list]");
    if (skillList) {
      var listKey = skillList.getAttribute("data-skill-list");
      if (currentView && currentView.kind === "skills") { currentView.id = listKey; showSkillBrowser(listKey); }
      else navigateTo("skills", listKey, true);
      return;
    }
    var skillLink = e.target.closest("[data-goto-skill]");
    if (skillLink) { navigateTo("skill", skillLink.getAttribute("data-goto-skill"), true); return; }
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
    var smithTab = e.target.closest("[data-smith-tab]");
    if (smithTab) { openSmithTab(smithTab.getAttribute("data-smith-tab")); return; }
    var gotoSmith = e.target.closest("[data-goto-smith]");
    if (gotoSmith) { navigateTo("smith", gotoSmith.getAttribute("data-goto-smith"), true); return; }
    if (e.target.closest("[data-goto-stones]")) { navigateTo("stones", "", true); return; }
    var mapLink = e.target.closest("[data-open-map]");
    if (mapLink) { navigateTo("map", mapLink.getAttribute("data-open-map"), true); return; }
    var gotoQuestTab = e.target.closest("[data-goto-questtab]");
    if (gotoQuestTab) { navigateTo("questtab", gotoQuestTab.getAttribute("data-goto-questtab"), true); return; }
    var questLineLink = e.target.closest("[data-open-questline]");
    if (questLineLink) navigateTo("questline", questLineLink.getAttribute("data-open-questline"), true);
  });

  // ---------- 網址參數：書籤工具「📊 掉落查詢」從遊戲帶資料過來 ----------
  // ?lv=等級&smith=1(鐵匠／匠師)&beg=乞討等級&map=目前地圖&from=game，另外 q=關鍵字 可以直接搜尋
  // mon=正在打的怪物編號（野外狩獵時）、dg=正在跑的副本編號（副本裡）；開啟順序：q > mon > dg > map
  (function applyUrlParams() {
    var p;
    try { p = new URLSearchParams(location.search); } catch (e) { return; }
    var lv = Number(p.get("lv"));
    if (lv >= 1) dropCalcState.level = Math.floor(lv);
    if (p.get("smith") === "1") dropCalcState.blacksmith = true;
    var beg = Number(p.get("beg"));
    if (beg >= 1) dropCalcState.beg = Math.min(DROP_BEG_SKILL_LEVELS.length, Math.floor(beg));
    var map = p.get("map"), q = p.get("q"), mon = p.get("mon"), dg = p.get("dg");
    if (map) gameCurrentMap = String(map);
    if (mon && !MONSTERS[String(mon)]) mon = null;
    if (dg && !DUNGEON_BY_ID[String(dg)]) dg = null;
    if (p.get("from") === "game") {
      var parts = [];
      if (dropCalcState.level != null) parts.push("Lv" + dropCalcState.level);
      parts.push(dropCalcState.blacksmith ? "鐵匠／匠師（不受等級差衰減）" : "非鐵匠系");
      parts.push(dropCalcState.beg ? "〔乞討〕Lv" + dropCalcState.beg : "沒學〔乞討〕");
      if (dg) parts.push("正在副本〔" + DUNGEON_BY_ID[String(dg)].name + "〕");
      else if (map) parts.push("目前在〔" + mapName(map) + "〕");
      if (mon) parts.push("正在打〔" + MONSTERS[String(mon)].name + "〕");
      var bar = document.createElement("div");
      bar.style.cssText = "margin:8px 0 0;padding:8px 12px;border-radius:6px;background:var(--panel-hi);border:1px solid var(--gold);font-size:12.5px;color:var(--text);";
      bar.textContent = "🎮 已從遊戲帶入：" + parts.join("・") + "。想查別的東西，直接用上面的搜尋框。";
      $hintRow.parentNode.insertBefore(bar, $hintRow.nextSibling);
    }
    var opened = true;
    if (q) {
      $input.value = q;
      $input.dispatchEvent(new Event("input"));
      opened = false;
    } else if (mon) {
      // 跟點左邊清單一樣打開怪物頁（同名不同隻也分得出來，因為是用編號）；頁面上的地圖標籤可以點回整張地圖
      navigateTo("monster", String(mon), false);
    } else if (dg) {
      navigateTo("dungeon", String(dg), false);
    } else if (map && MAPS[String(map)]) {
      showMapDetail(map);
    } else {
      opened = false;
    }
    // 窄畫面（手機、或書籤開在遊戲裡的視窗比較窄時）是上下排版，詳細頁在搜尋區下面。
    // 這段在頁面還在載入時就執行了，字型／圖片載完後版面會被撐高，當下捲的位置會跑掉（看起來像停在初始畫面），
    // 所以等整頁載完再直接捲一次（不用 smooth，免得被後續的版面變動打斷）。
    if (opened && stackedLayoutQuery && stackedLayoutQuery.matches) {
      var scrollNow = function () {
        window.scrollTo(0, Math.max(0, $detail.getBoundingClientRect().top + window.pageYOffset - 8));
      };
      if (document.readyState === "complete") setTimeout(scrollNow, 50);
      else window.addEventListener("load", function () { setTimeout(scrollNow, 50); });
    }
  })();

  wireGlobalLevelField();
})();
