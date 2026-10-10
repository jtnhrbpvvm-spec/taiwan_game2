(function () {
  "use strict";

  var ITEMS = window.ITEMS || {};
  // 次元守護者飾品（吊墜/耳環/手鐲/戒指）會成長：遊戲用連號物品 ID 表示等級（0lv 的 ID +1 = 1lv … +6 = 6lv），
  // 但匯出的 items.js 只有 0lv。缺的等級沿用 0lv 的部位/需求/職業補上，不然裝備欄會認不出來、顯示成沒裝備。
  // 能力值目前沒有資料，先用 0lv 的數值，並標 statsFromBase 讓預覽提示。
  var GROWTH_MAX_LV = 6;
  Object.keys(ITEMS).forEach(function (id) {
    var base = ITEMS[id];
    var m = /^(.*)\.0lv$/.exec(base.name || "");
    if (!m || !base.slot) return;
    for (var lv = 1; lv <= GROWTH_MAX_LV; lv++) {
      var key = String(Number(id) + lv);
      if (ITEMS[key]) break; // 撞到別的物品就停，不覆蓋真實資料
      var copy = JSON.parse(JSON.stringify(base));
      copy.name = m[1] + "." + lv + "lv";
      copy.statsFromBase = true;
      ITEMS[key] = copy;
    }
  });
  // 五行寶石系統：鑲到武器上的屬性，直接存在該武器 stack 的 element 欄位（跟 refine 平行，不是巢狀在 options 裡）
  var ELEMENT_LABEL = { fire: "火", water: "水", tree: "木", steel: "金", earth: "土", sun: "光", dark: "闇" };
  var ELEMENT_LIST = ["fire", "water", "tree", "steel", "earth", "sun", "dark"];
  var EQUIP_SLOTS = window.EQUIP_SLOTS || {};
  var JOBS = window.JOBS || [];
  var SECOND_JOBS = window.SECOND_JOBS || [];
  var MAPS = window.MAPS || {};
  var MAIN_QUEST_LINES = window.MAIN_QUEST_LINES || {};
  var PETS = window.PETS || {};
  var BATTLE_PET_INFO = window.BATTLE_PET_INFO || { kinds: [], growthTypes: [], maxLevel: 0, levels: {}, auras: {}, skills: [], upgrades: [], gearSlots: [], gear: [] };
  var SKILLS = window.SKILLS || {};

  var JOB_NAME = {};
  JOBS.forEach(function (j) { JOB_NAME[j.id] = j.name; });

  var itemArr = Object.keys(ITEMS).map(function (id) { return { id: id, name: ITEMS[id].name }; });
  var petArr = Object.keys(PETS).map(function (id) { return { id: id, name: PETS[id].name, tier: PETS[id].tier }; });

  var saveData = null;
  var currentCharIndex = 0;
  var originalFileName = "idle-seal-save.json";

  // ---------- Toast ----------
  function toast(msg, kind) {
    var area = document.getElementById("toastArea");
    var t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    area.appendChild(t);
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transition = "opacity .3s";
      setTimeout(function () { t.remove(); }, 300);
    }, 2600);
  }

  // ---------- 側邊欄面板切換 ----------
  var LOCKED_PANELS = ["basic", "attrs", "equip", "slot","inventory", "warehouse", "enchant", "appraisal", "skills", "buffs", "gems", "stones", "pets", "battlepet", "potions", "records", "spot", "individuality", "quests", "daily", "missions", "dungeon", "party", "advanced", "sellkeep", "json"];

  function showPanel(name) {
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
    document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); });
    var panel = document.getElementById("panel-" + name);
    var nav = document.querySelector('.nav-item[data-panel="' + name + '"]');
    if (panel) panel.classList.add("active");
    if (nav) nav.classList.add("active");
    if (name === "json" && saveData) syncJsonEditor();
    // 裝備欄位的下拉選單是根據「目前背包」現算的，每次點進這個面板都重新整理一次，
    // 這樣剛在背包新增的裝備才會立刻出現在選單裡，不用重新載入整個存檔。
    if (name === "equip" && saveData) renderLoadout(saveData.characters[currentCharIndex]);
    if (name === "questlines" && !document.getElementById("questLinesList").dataset.rendered) {
      renderQuestLines();
      document.getElementById("questLinesList").dataset.rendered = "1";
    }
  }

  document.querySelectorAll(".nav-item").forEach(function (nav) {
    nav.addEventListener("click", function () {
      var name = nav.getAttribute("data-panel");
      if (LOCKED_PANELS.indexOf(name) !== -1 && !saveData) {
        toast("請先在「功能總覽」載入存檔檔案", "warn");
        showPanel("overview");
        return;
      }
      showPanel(name);
    });
  });

  // 「戰寵」面板原本藏在「連點寵物五下」後面，因為當時沒有真實存檔可以驗證。
  // 2026-09-20 已經實際跑過完整流程（修改器建立 → 匯出 → 匯入遊戲，本機和線上 idle-seal 都測過）：
  // 戰寵可以正常出戰、顯示能力與技能樹，存檔重開也還在，所以改成一般功能直接顯示。

  // 主線劇情 2026-09-27 那版遊戲整套拿掉了，新資料的 questLines.js 是空的，就不顯示這個選單
  var questLinesNav = document.querySelector('.nav-item[data-panel="questlines"]');
  if (questLinesNav && !Object.keys(MAIN_QUEST_LINES).length) questLinesNav.style.display = "none";

  document.getElementById("transferShortcutBtn").addEventListener("click", function () {
    showPanel("transfer");
  });

  // ---------- 功能總覽卡片 ----------
  var CAPABILITIES = [
    { panel: "basic", icon: "👤", title: "基本資料", desc: "名稱、等級、經驗、金錢、HP、職業（一轉／二轉）、名聲。" },
    { panel: "attrs", icon: "📊", title: "屬性點數", desc: "力量 / 敏捷 / 智力 / 體力 / 精神 / 幸運六圍。" },
    { panel: "equip", icon: "🛡️", title: "裝備欄位", desc: "設定各裝備欄位指向背包裡的哪一疊物品。" },
    // 遊戲已內建存檔排序，存檔位置先隱藏
    // { panel: "slot", icon: "🔀", title: "存檔位置", desc: "把兩個角色在遊戲選角畫面上的格子互換（例如第 1 格 ↔ 第 6 格）。" },
    { panel: "inventory", icon: "🎒", title: "背包", desc: "新增 / 刪除 / 修改背包物品與數量，支援搜尋。" },
    { panel: "enchant", icon: "🔮", title: "發條強化", desc: "編輯裝備的發條強化屬性，數值旁邊附機率表算出的範圍參考。" },
    { panel: "appraisal", icon: "🔨", title: "鑑定", desc: "無限抽抽樂試手氣，或自己輸入數值（鎖定合法範圍）。" },
    { panel: "warehouse", icon: "🏦", title: "倉庫", desc: "編輯所有角色共用的倉庫金錢與物品。" },
    { panel: "skills", icon: "✨", title: "已學技能", desc: "點選新增/移除技能，設定等級，支援全選滿等。" },
    { panel: "buffs", icon: "🌟", title: "輔助狀態", desc: "點選啟用/停用輔助技能，可批次套用等級改變持續時間。" },
    { panel: "gems", icon: "💎", title: "技能寶石", desc: "開寶石位置、指定技能與寶石、新增寶石並設定每一格的強化結果。" },
    { panel: "stones", icon: "💠", title: "鑲嵌石", desc: "查看四顆石頭目前的能力，把變更次數補回上限。" },
    { panel: "pets", icon: "🐾", title: "寵物", desc: "新增寵物、調整成長階段、經驗、飽食度。" },
    { panel: "potions", icon: "🧪", title: "藥水設定", desc: "自動回血 / 回 AP 的閾值與藥水種類。" },
    { panel: "records", icon: "📖", title: "物品紀錄", desc: "已見過物品清單、追蹤中的掉落物清單。" },
    { panel: "spot", icon: "📍", title: "目前位置", desc: "所在地圖、座標、正在打的怪物或採集點。" },
    { panel: "individuality", icon: "🌠", title: "個性化", desc: "編輯已展現屬性、階段、副屬性，含展現上限對照。" },
    { panel: "quests", icon: "📜", title: "委託任務", desc: "地點/委託/內容三層選單查委託，一鍵把繳交物品補到背包。" },
    { panel: "daily", icon: "🗓️", title: "每日任務", desc: "查看/更換今天的任務卡、改進度、一鍵做完、補滿換卡次數。" },
    { panel: "missions", icon: "🎯", title: "藍圖任務", desc: "希望路線的任務清單，可改進度、勾選標記是否已完成。" },
    { panel: "dungeon", icon: "🏛️", title: "副本", desc: "查看/重置每日副本進場次數，清空副本紀錄。" },
    { panel: "party", icon: "👥", title: "隊伍", desc: "把另一個角色加入隊伍（複製對方目前的戰鬥快照）。" },
    { panel: "advanced", icon: "🔧", title: "進階欄位", desc: "離線紀錄、亂數種子等，格式已驗證但仍以原始 JSON 編輯。", conf: "mid" },
    { panel: "sellkeep", icon: "🛒", title: "自動販賣保留清單", desc: "用物品搜尋新增/刪除保留項目，設定保留數量，0 代表全數自動賣出。" },
    { panel: "json", icon: "{ }", title: "JSON 編輯器", desc: "直接編輯整份存檔的原始 JSON，萬用備援手段。" },
    { panel: "transfer", icon: "🔁", title: "轉移碼", desc: "產生/讀取遊戲內建那種六碼轉移碼，透過 Litterbox 暫存交換存檔。" }
  ];

  function renderCapGrid() {
    var grid = document.getElementById("capGrid");
    grid.innerHTML = "";
    CAPABILITIES.forEach(function (c) {
      var card = document.createElement("div");
      card.className = "cap-card";
      var confBadge = c.conf ? '<span class="conf-badge ' + c.conf + '">原始 JSON</span>' : "";
      card.innerHTML =
        '<div class="title"><span>' + c.icon + '</span><span>' + c.title + '</span>' + confBadge + '</div>' +
        '<div class="desc">' + c.desc + '</div>';
      card.addEventListener("click", function () {
        if (!saveData) { toast("請先載入存檔檔案", "warn"); return; }
        showPanel(c.panel);
      });
      grid.appendChild(card);
    });
  }
  renderCapGrid();

  // ---------- 檔案載入 ----------
  function bindDropzone(inputId, zoneId) {
    var $zone = document.getElementById(zoneId);
    var $input = document.getElementById(inputId);
    if (!$zone) return;
    $zone.addEventListener("click", function () { $input.click(); });
    $zone.addEventListener("dragover", function (e) { e.preventDefault(); $zone.classList.add("drag"); });
    $zone.addEventListener("dragleave", function () { $zone.classList.remove("drag"); });
    $zone.addEventListener("drop", function (e) {
      e.preventDefault(); $zone.classList.remove("drag");
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    $input.addEventListener("change", function () {
      if ($input.files.length) handleFile($input.files[0]);
    });
  }
  bindDropzone("fileInput2", "dropzone");
  document.getElementById("fileInput").addEventListener("change", function (e) {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    originalFileName = file.name || originalFileName;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data || !Array.isArray(data.characters)) {
          throw new Error("找不到 characters 陣列，這可能不是 idle-seal 的存檔檔案。");
        }
        saveData = data;
        currentCharIndex = 0;
        petsTouched = false;
        document.getElementById("loadStatus").textContent = "已載入：" + file.name + "（" + data.characters.length + " 位角色）";
        document.getElementById("exportBtn").disabled = false;
        document.getElementById("charSelect").disabled = false;
        document.getElementById("dupCharBtn").disabled = false;
        document.getElementById("delCharBtn").disabled = false;
        document.getElementById("defaultCharBtn").disabled = false;
        toast("存檔載入成功", "ok");
        renderAll();
        showPanel("basic");
      } catch (err) {
        toast("讀取失敗：" + err.message, "err");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  // ---------- 小工具 ----------
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function fieldNumber(label, get, set) {
    var wrap = el("div", { class: "field" });
    wrap.appendChild(el("label", { text: label }));
    var input = el("input", { type: "number" });
    input.value = get();
    input.addEventListener("input", function () { set(input.valueAsNumber || 0); });
    wrap.appendChild(input);
    return wrap;
  }
  function fieldText(label, get, set) {
    var wrap = el("div", { class: "field" });
    wrap.appendChild(el("label", { text: label }));
    var input = el("input", { type: "text" });
    input.value = get();
    input.addEventListener("input", function () { set(input.value); });
    wrap.appendChild(input);
    return wrap;
  }
  function fieldSelect(label, options, get, set) {
    var wrap = el("div", { class: "field" });
    wrap.appendChild(el("label", { text: label }));
    var select = el("select");
    options.forEach(function (o) {
      var opt = el("option", { value: o.value, text: o.label });
      if (o.value === get()) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () { set(select.value); });
    wrap.appendChild(select);
    return wrap;
  }
  function fieldCheckbox(label, get, set) {
    var wrap = el("div", { class: "field" });
    wrap.appendChild(el("label", { text: label }));
    var select = el("select");
    [{ v: "true", l: "是" }, { v: "false", l: "否" }].forEach(function (o) {
      var opt = el("option", { value: o.v, text: o.l });
      if ((o.v === "true") === !!get()) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () { set(select.value === "true"); });
    wrap.appendChild(select);
    return wrap;
  }

  function itemName(id) { return (ITEMS[String(id)] || {}).name || ("物品#" + id); }

  // ---------- 依物品編號讀寫背包總數量（用來讓某些物品像金幣一樣直接編輯數字）----------
  function getStackTotal(c, itemId) {
    var total = 0;
    (c.stacks || []).forEach(function (s) { if (s.itemId === itemId) total += s.count; });
    return total;
  }
  function setStackTotal(c, itemId, target) {
    target = Math.max(0, Math.floor(target) || 0);
    if (!Array.isArray(c.stacks)) c.stacks = [];
    var matching = c.stacks.filter(function (s) { return s.itemId === itemId; });
    if (target === 0) {
      c.stacks = c.stacks.filter(function (s) { return s.itemId !== itemId; });
      return;
    }
    if (matching.length === 0) {
      var newId = c.nextStackId || 1;
      c.nextStackId = newId + 1;
      c.stacks.push({ id: newId, itemId: itemId, count: target });
      return;
    }
    matching[0].count = target;
    for (var i = 1; i < matching.length; i++) {
      var idx = c.stacks.indexOf(matching[i]);
      if (idx !== -1) c.stacks.splice(idx, 1);
    }
  }

  // ---------- 物品能力預覽方塊（背包/倉庫/裝備欄位共用）----------
  var STAT_LABELS = { atk: "攻擊", def: "防禦", magic: "魔法", atkSpeed: "攻速", crit: "必殺", eva: "迴避", moveSpeed: "移速" };
  var ATTR_LABELS = { str: "力量", agi: "敏捷", int: "智力", sta: "體力", wis: "精神", luck: "幸運" };

  function renderItemPreview(boxId, itemId) {
    var box = document.getElementById(boxId);
    if (!box) return;
    var it = ITEMS[String(itemId)];
    if (!it) { box.innerHTML = "找不到這個物品的資料（#" + itemId + "）。"; return; }

    var html = '<div class="ip-name">' + it.name + '　<span style="color:var(--text3);font-weight:400;font-size:12px;">#' + itemId + '</span></div>';
    html += '<div class="ip-price">販售價 ' + fmtNum2(it.sell) + '　購買價 ' + fmtNum2(it.buy) + '</div>';

    if (it.slot) {
      var slotLabel = EQUIP_SLOTS[it.slot] || it.slot;
      html += '<div style="margin-bottom:8px;font-size:12.5px;color:var(--text2);">裝備部位：<b style="color:var(--text);">' + slotLabel + '</b>　需求等級：<b style="color:var(--text);">Lv' + (it.minLv || 0) + '</b></div>';
      if (it.statsFromBase) html += '<div style="margin-bottom:8px;font-size:12px;color:var(--yellow);">※ 這個等級的能力值尚未收錄，以下顯示的是 0lv 的數值。</div>';
      html += '<div class="ip-stats">';
      Object.keys(STAT_LABELS).forEach(function (k) {
        if (it[k]) html += '<div>' + STAT_LABELS[k] + ' <b>' + (it[k] > 0 ? "+" : "") + it[k] + '</b></div>';
      });
      if (it.attrs) {
        Object.keys(ATTR_LABELS).forEach(function (k) {
          if (it.attrs[k]) html += '<div>' + ATTR_LABELS[k] + ' <b>+' + it.attrs[k] + '</b></div>';
        });
      }
      html += '</div>';
    } else {
      html += '<div style="font-size:12.5px;color:var(--text3);">一般物品，沒有裝備能力。</div>';
    }
    box.innerHTML = html;
  }

  function fmtNum2(n) { return Number(n || 0).toLocaleString("zh-Hant"); }

  function petName(id) { return (PETS[String(id)] || {}).name || ("寵物#" + id); }

  // 6／7 階的分類（寵物大師「7 階進化」用）：種族・稀有度，7 階再加類型；.G 是 7 階冶煉出來的，沒有分類。
  // 天蛋沒有「一般」，資料寫 normal 的遊戲也當稀有算（bundle Ex()）。
  var PET_FAMILY_LABEL = { seed: "種子", piya: "咕咕", bird: "鳥蛋", sky: "天蛋", dragon: "黑龍", mand: "曼德拉", fox: "三尾狐" };
  var PET_RARITY_LABEL = { normal: "一般", rare: "稀有", super: "超稀有" };
  var PET_KIND_LABEL = { atk: "攻擊", mag: "魔法", mix: "綜合" };
  var PET_SMELT_RESULT = {};
  Object.keys(PETS).forEach(function (id) {
    ((PETS[id].smelt || {}).to || []).forEach(function (t) { PET_SMELT_RESULT[String(t.to)] = true; });
  });
  function petTag(id) {
    var def = PETS[String(id)] || {};
    if (PET_SMELT_RESULT[String(id)]) return "冶煉";
    var m = def.master;
    if (!m) return "";
    var rarity = m.rarity === "normal" && m.family !== "seed" && m.family !== "piya" && m.family !== "bird" ? "rare" : m.rarity;
    return (PET_FAMILY_LABEL[m.family] || m.family) + "・" + (PET_RARITY_LABEL[rarity] || rarity) + (m.kind ? "・" + (PET_KIND_LABEL[m.kind] || m.kind) : "");
  }
  // 這一階要餵多少才滿（bundle rS()）：round(feedFull × (10 + grow) / 10)
  function petExpFull(def, grow) { return Math.round((def.feedFull || 0) * (10 + grow) / 10); }

  // 依「階級」分組排序好的寵物清單，供下拉選單使用
  var petsByTier = {};
  petArr.forEach(function (p) {
    var t = p.tier || 0;
    if (!petsByTier[t]) petsByTier[t] = [];
    petsByTier[t].push(p);
  });
  var petTierKeys = Object.keys(petsByTier).map(Number).sort(function (a, b) { return a - b; });
  petTierKeys.forEach(function (t) {
    petsByTier[t].sort(function (a, b) { return a.name.localeCompare(b.name, "zh-Hant"); });
  });

  function makePetSelect(currentId, onPick) {
    var select = el("select");
    var hasCurrent = !!currentId && !!PETS[String(currentId)];
    if (!hasCurrent) {
      select.appendChild(el("option", { value: "", text: "請選擇寵物..." }));
    }
    petTierKeys.forEach(function (t) {
      var group = document.createElement("optgroup");
      group.label = "階級 " + t;
      petsByTier[t].forEach(function (p) {
        var tag = petTag(p.id);
        var opt = el("option", { value: p.id, text: p.name + (tag ? "〔" + tag + "〕" : "") });
        if (hasCurrent && String(currentId) === p.id) opt.selected = true;
        group.appendChild(opt);
      });
      select.appendChild(group);
    });
    select.addEventListener("change", function () {
      if (select.value) onPick(Number(select.value));
    });
    return select;
  }

  function makeItemPicker(currentId, onPick) {
    var wrap = el("div", { class: "item-picker" });
    var input = el("input", { type: "text", placeholder: "搜尋物品...", value: currentId ? itemName(currentId) : "" });
    var suggest = el("div", { class: "suggest" });
    input.addEventListener("input", function () {
      var q = input.value.trim();
      suggest.innerHTML = "";
      if (!q) { suggest.classList.remove("show"); return; }
      var matches = itemArr.filter(function (it) { return it.name.indexOf(q) !== -1; }).slice(0, 30);
      if (!matches.length) { suggest.classList.remove("show"); return; }
      matches.forEach(function (it) {
        var row = el("div", { text: it.name + "  #" + it.id });
        row.addEventListener("click", function () {
          input.value = it.name;
          suggest.classList.remove("show");
          onPick(Number(it.id));
        });
        suggest.appendChild(row);
      });
      suggest.classList.add("show");
    });
    input.addEventListener("blur", function () {
      setTimeout(function () { suggest.classList.remove("show"); }, 150);
    });
    wrap.appendChild(input);
    wrap.appendChild(suggest);
    return wrap;
  }

  // ---------- 角色選單（topbar）----------
  var $charSelect = document.getElementById("charSelect");
  $charSelect.addEventListener("change", function () {
    currentCharIndex = Number($charSelect.value);
    renderAll();
  });
  document.getElementById("dupCharBtn").addEventListener("click", duplicateCurrentCharacter);
  document.getElementById("delCharBtn").addEventListener("click", deleteCurrentCharacter);
  document.getElementById("defaultCharBtn").addEventListener("click", function () {
    saveData.lastPlayedId = saveData.characters[currentCharIndex].id;
    renderCharSelect();
    toast("已設為預設載入角色", "ok");
  });

  function renderCharSelect() {
    $charSelect.innerHTML = "";
    saveData.characters.forEach(function (c, idx) {
      var isDefault = c.id === saveData.lastPlayedId;
      $charSelect.appendChild(el("option", {
        value: idx, text: c.name + (isDefault ? " ★" : "") + "  Lv." + c.level
      }));
    });
    $charSelect.value = currentCharIndex;
  }

  function duplicateCurrentCharacter() {
    var src = saveData.characters[currentCharIndex];
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
    copy.name = src.name + " (複製)";
    copy.createdAt = Date.now();
    copy.savedAt = Date.now();
    saveData.characters.push(copy);
    currentCharIndex = saveData.characters.length - 1;
    toast("已複製角色「" + src.name + "」", "ok");
    renderAll();
  }

  function deleteCurrentCharacter() {
    if (saveData.characters.length <= 1) { toast("至少要保留一位角色", "warn"); return; }
    var name = saveData.characters[currentCharIndex].name;
    if (!confirm('確定要刪除角色「' + name + '」嗎？此動作無法復原。')) return;
    var removed = saveData.characters.splice(currentCharIndex, 1)[0];
    if (saveData.lastPlayedId === removed.id) {
      saveData.lastPlayedId = saveData.characters[0].id;
    }
    currentCharIndex = 0;
    toast("已刪除角色「" + name + "」", "ok");
    renderAll();
  }

  // ---------- 主渲染 ----------
  function renderAll() {
    renderCharSelect();
    var c = saveData.characters[currentCharIndex];
    renderBasic(c);
    renderSlot(c);
    renderAttrs(c);
    renderStacks(c);
    renderLoadout(c);
    renderSkillsPanel(c);
    renderBuffsPanel(c);
    renderGems(c);
    renderStones(c);
    renderPets(c);
    renderBattlePet(c);
    renderPotions(c);
    renderTagLists(c);
    renderSpot(c);
    renderIndividuality(c);
    renderQuests(c);
    renderDaily(c);
    renderMissions(c);
    renderDungeon(c);
    renderParty(c);
    renderEnchant(c);
    renderAppraisal(c);
    renderWarehouse();
    renderRawFields(c);
    if (document.getElementById("panel-json").classList.contains("active")) syncJsonEditor();
  }

  // ---------- 存檔位置（選角畫面的格子順序）----------
  // 遊戲選角畫面的排法（bundle 選角元件）：[...characters].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))，
  // 也就是照「建立時間」由舊到新，同時間再比 id；存檔裡 characters 陣列的順序完全不影響。
  // 2026-10-07 實測：只調換陣列順序，遊戲畫面沒有任何變化；互換建立時間後，Lv300 的角色從第 1 格換到第 6 格，
  // 進入角色正常（等級、金幣、每日任務都在），遊戲重新存檔後順序也維持。
  // createdAt 另外的用途：每日任務抽卡、個性化展現的亂數種子（之後抽到的結果會不同，不會壞檔）。
  function slotOrder() {
    return saveData.characters.slice().sort(function (a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id));
    });
  }
  // 互換兩個角色的格子：把「目前各格的建立時間」原樣留在格子上，換的是誰坐在哪一格。
  // 有角色建立時間一樣（舊版修改器複製出來的）時，順序本來是靠 id 排的，換了也不保證照我們要的排，
  // 所以遇到一樣的就往後 +1 毫秒，讓每一格的時間都不同。
  function swapSlots(idA, idB) {
    var order = slotOrder();
    var times = order.map(function (c) { return c.createdAt || 0; });
    var ia = -1, ib = -1;
    order.forEach(function (c, i) { if (c.id === idA) ia = i; if (c.id === idB) ib = i; });
    if (ia < 0 || ib < 0 || ia === ib) return false;
    var tmp = order[ia]; order[ia] = order[ib]; order[ib] = tmp;
    for (var k = 1; k < times.length; k++) {
      if (times[k] <= times[k - 1]) times[k] = times[k - 1] + 1;
    }
    order.forEach(function (c, k) { c.createdAt = times[k]; });
    // 遊戲裡「離開」分頁的角色清單沒有排序，是直接照存檔 characters 陣列的順序畫的（bundle ExitTab：[...characters]），
    // 所以陣列也要排成跟格子一樣的順序，不然選角畫面換了、離開那邊還是舊的。
    // 陣列順序動了，「目前編輯的角色」是用陣列位置記的，要跟著改，上方的角色選單也要重畫。
    var editing = saveData.characters[currentCharIndex];
    saveData.characters = order;
    currentCharIndex = Math.max(0, order.indexOf(editing));
    renderCharSelect();
    return true;
  }
  var slotPickA = null, slotPickB = null;   // 兩個下拉選單目前選的角色 id（重畫時保留）
  var slotForChar = null;                   // 上面的選擇是替哪個「目前編輯的角色」記的；換角色就重設回預設
  function renderSlot(c) {
    var wrap = document.getElementById("slotBody");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (slotForChar !== c.id) { slotForChar = c.id; slotPickA = null; slotPickB = null; }
    var order = slotOrder();
    if (order.length < 2) {
      wrap.appendChild(el("div", { class: "panel-desc", text: "這份存檔只有一個角色，沒有可以互換的對象。先用上方的「複製」做出另一個角色，或在遊戲裡建立新角色。" }));
      return;
    }
    var has = function (id) { return order.some(function (o) { return o.id === id; }); };
    // 左邊預設是目前正在編輯的角色，右邊預設是任意一個不是它的角色
    if (!has(slotPickA)) slotPickA = c.id;
    if (!has(slotPickB) || slotPickB === slotPickA) {
      slotPickB = order.filter(function (o) { return o.id !== slotPickA; })[0].id;
    }
    function buildSelect(current, onChange) {
      var sel = document.createElement("select");
      order.forEach(function (o, i) {
        sel.appendChild(el("option", { value: o.id, text: "第 " + (i + 1) + " 格　" + o.name + "　Lv." + o.level }));
      });
      sel.value = current;
      sel.addEventListener("change", function () { onChange(sel.value); });
      return sel;
    }
    var row = el("div", { style: "display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;" });
    var fa = el("div", { class: "field", style: "flex:1;min-width:200px;" });
    fa.appendChild(el("label", { text: "當前角色" }));
    fa.appendChild(buildSelect(slotPickA, function (v) {
      slotPickA = v;
      if (slotPickB === v) slotPickB = null;
      renderSlot(c);
    }));
    var fb = el("div", { class: "field", style: "flex:1;min-width:200px;" });
    fb.appendChild(el("label", { text: "更換檔案位置（要互換的角色）" }));
    fb.appendChild(buildSelect(slotPickB, function (v) {
      slotPickB = v;
      if (slotPickA === v) slotPickA = null;
      renderSlot(c);
    }));
    row.appendChild(fa);
    row.appendChild(el("div", { style: "font-size:20px;padding-bottom:6px;", text: "⇄" }));
    row.appendChild(fb);
    var btn = el("button", { class: "btn btn-accent", text: "🔀 互換位置" });
    btn.addEventListener("click", function () {
      var a = order.filter(function (o) { return o.id === slotPickA; })[0];
      var b = order.filter(function (o) { return o.id === slotPickB; })[0];
      if (!a || !b || a === b) { toast("請選兩個不同的角色", "warn"); return; }
      if (!swapSlots(a.id, b.id)) { toast("互換失敗", "warn"); return; }
      toast("已互換「" + a.name + "」和「" + b.name + "」的位置", "ok");
      renderSlot(c);
      if (document.getElementById("panel-json").classList.contains("active")) syncJsonEditor();
    });
    row.appendChild(btn);
    wrap.appendChild(row);

    // 目前的格子順序（遊戲選角畫面一頁 4 格）
    var list = el("div", { class: "panel-desc", style: "line-height:2;" });
    list.appendChild(el("div", { style: "font-weight:700;margin-bottom:4px;", text: "目前遊戲選角畫面的順序（一頁 4 格）：" }));
    order.forEach(function (o, i) {
      var mark = o.id === slotPickA ? "　← 當前角色" : (o.id === slotPickB ? "　← 要互換的角色" : "");
      list.appendChild(el("div", {
        style: (o.id === slotPickA || o.id === slotPickB) ? "font-weight:700;" : "",
        text: "第 " + (i + 1) + " 格（第 " + (Math.floor(i / 4) + 1) + " 頁）：" + o.name + "　Lv." + o.level + mark
      }));
    });
    wrap.appendChild(list);
  }

  function renderBasic(c) {
    var wrap = document.getElementById("basicFields");
    wrap.innerHTML = "";
    wrap.appendChild(fieldText("名稱", function () { return c.name; }, function (v) { c.name = v; renderCharSelect(); }));
    wrap.appendChild(fieldNumber("等級 Level", function () { return c.level; }, function (v) { c.level = v; renderCharSelect(); }));
    wrap.appendChild(fieldNumber("經驗值 EXP", function () { return c.exp; }, function (v) { c.exp = v; }));
    wrap.appendChild(fieldNumber("金錢 Gold", function () { return c.gold; }, function (v) { c.gold = v; }));
    wrap.appendChild(fieldNumber("HP", function () { return c.hp; }, function (v) { c.hp = v; }));
    if (MISSION_TOKEN_ITEM_ID) {
      wrap.appendChild(fieldNumber(
        (itemName(MISSION_TOKEN_ITEM_ID) || "R代幣") + "（希望路線代幣）",
        function () { return getStackTotal(c, MISSION_TOKEN_ITEM_ID); },
        function (v) { setStackTotal(c, MISSION_TOKEN_ITEM_ID, v); renderStacks(c); }
      ));
    }

    // 職業：存檔 v34 起只存一個 currentJob（一轉或二轉的職業 id），一轉職業由二轉的 from 反推（遊戲 Qf()）；
    // 舊的 job／secondJob／advanceStep 欄位遊戲早就不讀了。沒有 currentJob 代表還是初心者。
    var jobOptions = JOBS.map(function (j) {
      var fromName = j.from ? (JOB_NAME[j.from] || j.from) : "";
      return { value: j.id, label: (j.tier === 2 ? "【二轉】" + j.name + "・從 " + fromName : "【一轉】" + j.name) + " (" + j.id + ")" };
    });
    var jobField = fieldSelect("職業 currentJob", jobOptions,
      function () { return currentJobOf(c); },
      function (v) {
        c.currentJob = v;
        // 舊版殘留欄位一併清掉，免得看 JSON 時搞混
        delete c.job; delete c.secondJob; delete c.advanceStep;
        renderBasic(c);
        renderLoadout(c);
      });
    var firstJobId = firstJobOf(currentJobOf(c));
    jobField.appendChild(el("div", {
      style: "font-size:11px;color:var(--text3);margin-top:4px;line-height:1.6;",
      text: "選二轉職業時，一轉職業自動是它的來源職業（目前一轉：" + (JOB_NAME[firstJobId] || firstJobId) + "）。" +
        "遊戲在轉職時會清空技能欄與已學技能，這裡直接改不會，技能請到「已學技能」自己調整。"
    }));
    wrap.appendChild(jobField);
    wrap.appendChild(fieldCheckbox("二轉費用已付過 secondJobPaid（是＝之後換二轉免付金錢）",
      function () { return c.secondJobPaid; }, function (v) { c.secondJobPaid = v; }));
    wrap.appendChild(fieldCheckbox("已向精靈女王領過戰寵 bpetSpiritTaken（改成否可以再領一次）",
      function () { return c.bpetSpiritTaken; }, function (v) { c.bpetSpiritTaken = v; }));
    wrap.appendChild(fieldCheckbox("在村莊中 inVillage", function () { return c.inVillage; }, function (v) { c.inVillage = v; }));
    if ("townId" in c) {
      wrap.appendChild(fieldNumber("所在村莊 townId", function () { return c.townId; }, function (v) { c.townId = v; }));
    }
    wrap.appendChild(fieldNumber("名聲(目前) fame.current", function () { return c.fame.current; }, function (v) { c.fame.current = v; }));
    wrap.appendChild(fieldNumber("名聲(累計) fame.total", function () { return c.fame.total; }, function (v) { c.fame.total = v; }));
  }

  function renderAttrs(c) {
    var wrap = document.getElementById("attrFields");
    wrap.innerHTML = "";
    var labels = { str: "力量 STR", agi: "敏捷 AGI", int: "智力 INT", sta: "體力 STA", wis: "精神 WIS", luck: "幸運 LUCK" };
    Object.keys(labels).forEach(function (k) {
      wrap.appendChild(fieldNumber(labels[k], function () { return c.attributes[k]; }, function (v) { c.attributes[k] = v; }));
    });
  }

  // ---------- 物品清單表格（背包 / 倉庫共用）----------
  function renderStackTable($tbody, stacks, previewBoxId) {
    $tbody.innerHTML = "";
    stacks.forEach(function (stack, idx) {
      var tr = document.createElement("tr");
      var itemDef = ITEMS[String(stack.itemId)];
      var isEquip = !!(itemDef && itemDef.slot);

      var tdItem = document.createElement("td");
      var nameSpan = el("span", {
        text: itemDef ? itemDef.name : ("未知物品 #" + stack.itemId),
        style: "cursor:pointer;text-decoration:underline dotted;"
      });
      nameSpan.addEventListener("click", function () {
        if (previewBoxId) renderItemPreview(previewBoxId, stack.itemId);
      });
      tdItem.appendChild(nameSpan);
      tr.appendChild(tdItem);

      var tdCount = document.createElement("td");
      var countInput = el("input", { type: "number", value: stack.count });
      countInput.addEventListener("input", function () { stack.count = countInput.valueAsNumber || 0; });
      tdCount.appendChild(countInput);
      tr.appendChild(tdCount);

      var tdRefine = document.createElement("td");
      if (isEquip) {
        var refineSelect = el("select", { style: "width:70px;" });
        for (var rv = 0; rv <= 12; rv++) {
          var opt = el("option", { value: String(rv), text: "+" + rv });
          if ((stack.refine || 0) === rv) opt.selected = true;
          refineSelect.appendChild(opt);
        }
        refineSelect.addEventListener("change", function () {
          stack.refine = Number(refineSelect.value);
        });
        tdRefine.appendChild(refineSelect);
      } else {
        tdRefine.appendChild(el("span", { text: "-", style: "color:var(--text3);" }));
      }
      tr.appendChild(tdRefine);

      var tdElement = document.createElement("td");
      if (itemDef && itemDef.slot === "weapon") {
        var elementSelect = el("select", { style: "width:80px;" });
        elementSelect.appendChild(el("option", { value: "", text: "（未鑲）" }));
        ELEMENT_LIST.forEach(function (elKey) {
          var opt = el("option", { value: elKey, text: ELEMENT_LABEL[elKey] });
          if (stack.element === elKey) opt.selected = true;
          elementSelect.appendChild(opt);
        });
        elementSelect.addEventListener("change", function () {
          if (elementSelect.value) stack.element = elementSelect.value;
          else delete stack.element;
        });
        tdElement.appendChild(elementSelect);
      } else {
        tdElement.appendChild(el("span", { text: "-", style: "color:var(--text3);" }));
      }
      tr.appendChild(tdElement);

      var tdId = document.createElement("td");
      var idInput = el("input", { type: "number", value: stack.id });
      idInput.addEventListener("input", function () { stack.id = idInput.valueAsNumber || 0; });
      tdId.appendChild(idInput);
      tr.appendChild(tdId);

      var tdAct = document.createElement("td");
      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () {
        stacks.splice(idx, 1);
        renderStackTable($tbody, stacks, previewBoxId);
      });
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);

      $tbody.appendChild(tr);
    });
  }

  // ---------- 職業 / 裝備位置 篩選（背包、倉庫共用）----------
  function setupEquipFilter(prefix, onPick) {
    var $job = document.getElementById(prefix + "FilterJob");
    var $slot = document.getElementById(prefix + "FilterSlot");
    var $result = document.getElementById(prefix + "FilterResult");
    if (!$job || $job.dataset.wired) {
      // 選單已經建立過選項，只需要重新綁定 onPick（因為每次 render 都會重建，但選項不用重建）
    } else {
      $job.dataset.wired = "1";
      var primaryGroup = el("optgroup", {});
      primaryGroup.label = "一轉";
      JOBS.filter(function (j) { return j.tier !== 2; }).forEach(function (j) {
        primaryGroup.appendChild(el("option", { value: j.id, text: j.name }));
      });
      $job.appendChild(primaryGroup);

      var secondGroup = el("optgroup", {});
      secondGroup.label = "二轉";
      JOBS.filter(function (j) { return j.tier === 2; }).forEach(function (j) {
        secondGroup.appendChild(el("option", { value: j.id, text: j.name }));
      });
      $job.appendChild(secondGroup);

      Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
        var opt = el("option", { value: slotKey, text: EQUIP_SLOTS[slotKey] });
        $slot.appendChild(opt);
      });
    }

    function update() {
      var jobId = $job.value;
      var slotKey = $slot.value;
      if (!jobId && !slotKey) {
        $result.disabled = true;
        $result.innerHTML = '<option value="">請先選擇職業或裝備位置...</option>';
        return;
      }
      var job = JOBS.find(function (j) { return j.id === jobId; });
      var matches = [];
      Object.keys(ITEMS).forEach(function (id) {
        var it = ITEMS[id];
        if (!it.slot) return;
        if (slotKey && it.slot !== slotKey) return;
        if (job && !(it.jobs & (1 << job.equipBit))) return;
        matches.push({ id: id, name: it.name, minLv: it.minLv || 0 });
      });
      matches.sort(function (a, b) { return a.name.localeCompare(b.name, "zh-Hant"); });
      $result.disabled = matches.length === 0;
      if (!matches.length) {
        $result.innerHTML = '<option value="">（沒有符合條件的裝備）</option>';
        return;
      }
      $result.innerHTML = '<option value="">共 ' + matches.length + ' 件，請選擇...</option>' +
        matches.map(function (m) {
          return '<option value="' + m.id + '">' + m.name + '（需求 Lv' + m.minLv + '）</option>';
        }).join("");
    }

    $job.onchange = update;
    $slot.onchange = update;
    $result.onchange = function () {
      if (!$result.value) return;
      var itemId = Number($result.value);
      $result.value = "";
      onPick(itemId);
    };
  }

  function showAddToStackModal(itemId) {
    var old = document.getElementById("centerModalOverlay");
    if (old) old.remove();
    var name = itemName(itemId);
    var overlay = el("div", { id: "centerModalOverlay", class: "modal-overlay show" });
    var box = el("div", { class: "modal-box" });
    box.appendChild(el("div", { style: "font-weight:700;font-size:16px;color:var(--text);margin-bottom:10px;", text: "加入「" + name + "」" }));
    box.appendChild(el("div", { style: "font-size:13.5px;color:var(--text2);margin-bottom:16px;", text: "要把這件物品加進哪裡？" }));
    var row = el("div", { style: "display:flex;gap:10px;" });
    var invBtn = el("button", { class: "btn btn-accent", text: "🎒 加入背包" });
    invBtn.addEventListener("click", function () {
      var c = saveData.characters[currentCharIndex];
      var newId = c.nextStackId++;
      c.stacks.push({ id: newId, itemId: itemId, count: 1 });
      renderStacks(c);
      overlay.remove();
      toast("已加入背包：" + name, "ok");
    });
    var whBtn = el("button", { class: "btn btn-accent", text: "🏦 加入倉庫" });
    whBtn.addEventListener("click", function () {
      var newId = saveData.warehouse.nextStackId++;
      saveData.warehouse.stacks.push({ id: newId, itemId: itemId, count: 1 });
      renderWarehouse();
      overlay.remove();
      toast("已加入倉庫：" + name, "ok");
    });
    var cancelBtn = el("button", { class: "btn", text: "取消" });
    cancelBtn.addEventListener("click", function () { overlay.remove(); });
    row.appendChild(invBtn);
    row.appendChild(whBtn);
    row.appendChild(cancelBtn);
    box.appendChild(row);
    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function setupItemAddSearch(prefix) {
    var $input = document.getElementById(prefix + "NewItemInput");
    var $suggest = document.getElementById(prefix + "NewItemSuggest");
    var $btn = document.getElementById(prefix + "NewItemConfirmBtn");
    var previewBoxId = prefix + "ItemPreview";
    var matchedId = null;

    $input.oninput = function () {
      var q = $input.value.trim();
      var exact = itemArr.find(function (it) { return it.name === q; });
      matchedId = exact ? Number(exact.id) : null;
      $btn.disabled = !matchedId;
      if (matchedId) renderItemPreview(previewBoxId, matchedId);

      $suggest.innerHTML = "";
      if (!q) { $suggest.classList.remove("show"); return; }
      var matches = itemArr.filter(function (it) { return it.name.indexOf(q) !== -1; }).slice(0, 30);
      if (!matches.length) { $suggest.classList.remove("show"); return; }
      matches.forEach(function (it) {
        var row = el("div", { text: it.name + "  #" + it.id });
        row.addEventListener("click", function () {
          $input.value = it.name;
          matchedId = Number(it.id);
          $btn.disabled = false;
          $suggest.classList.remove("show");
          renderItemPreview(previewBoxId, matchedId);
        });
        $suggest.appendChild(row);
      });
      $suggest.classList.add("show");
    };
    $input.onblur = function () { setTimeout(function () { $suggest.classList.remove("show"); }, 150); };

    $btn.onclick = function () {
      if (!matchedId) return;
      showAddToStackModal(matchedId);
      $input.value = "";
      matchedId = null;
      $btn.disabled = true;
    };
  }

  function renderStacks(c) {
    var $tbody = document.querySelector("#stacksTable tbody");
    renderStackTable($tbody, c.stacks, "invItemPreview");
    setupEquipFilter("inv", function (itemId) { renderItemPreview("invItemPreview", itemId); showAddToStackModal(itemId); });
    setupItemAddSearch("inv");
  }

  function renderWarehouse() {
    document.getElementById("whGold").value = saveData.warehouse.gold;
    document.getElementById("whGold").oninput = function (e) { saveData.warehouse.gold = e.target.valueAsNumber || 0; };
    var $tbody = document.querySelector("#warehouseTable tbody");
    renderStackTable($tbody, saveData.warehouse.stacks, "whItemPreview");
    setupEquipFilter("wh", function (itemId) { renderItemPreview("whItemPreview", itemId); showAddToStackModal(itemId); });
    setupItemAddSearch("wh");
  }

  function getEquipBitForJob(jobId) {
    var job = JOBS.find(function (j) { return j.id === jobId; });
    return job ? job.equipBit : null;
  }
  // 存檔 v34 起職業只存 currentJob；沒有的話是初心者（jobs.json startingJob）
  function currentJobOf(c) { return c.currentJob || "novice"; }
  function firstJobOf(jobId) {
    var j = JOBS.find(function (x) { return x.id === jobId; });
    return j && j.from ? j.from : jobId;
  }
  // 遊戲 equipBits：一轉職業的位元，加上二轉職業的位元（有二轉、而且不同位元時）
  function equipBitsOf(c) {
    var cur = currentJobOf(c), first = firstJobOf(cur);
    var bits = [], b1 = getEquipBitForJob(first), b2 = cur !== first ? getEquipBitForJob(cur) : null;
    if (b1 != null) bits.push(b1);
    if (b2 != null && b2 !== b1) bits.push(b2);
    return bits;
  }

  function renderLoadout(c) {
    var wrap = document.getElementById("loadoutFields");
    wrap.innerHTML = "";
    var equipBits = equipBitsOf(c);

    Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
      var box = el("div", { class: "field" });
      box.appendChild(el("label", { text: EQUIP_SLOTS[slotKey] + " (" + slotKey + ")" }));

      var row = el("div", { style: "display:flex;gap:6px;flex-wrap:wrap;" });

      var currentStackId = c.loadout[slotKey];
      var currentStack = currentStackId ? c.stacks.find(function (s) { return s.id === currentStackId; }) : null;
      // 資料庫裡沒有的物品（例如遊戲新加的）也要當成「有裝備」，不能顯示成空欄位
      var currentItem = currentStack ? (ITEMS[String(currentStack.itemId)] || { name: "未知物品 #" + currentStack.itemId }) : null;

      var eligible = c.stacks.filter(function (stack) {
        if (currentStack && stack.id === currentStack.id) return false; // 目前裝備的另外顯示，不重複列出
        var it = ITEMS[String(stack.itemId)];
        if (!it || !it.slot || it.slot !== slotKey) return false;
        if ((it.minLv || 0) > (c.level || 0)) return false;
        if (equipBits.length && it.jobs != null && !equipBits.some(function (b) { return ((it.jobs >>> b) & 1) === 1; })) return false;
        return true;
      });

      var picker = el("select", { style: "flex:1;min-width:160px;" });
      if (currentStack && currentItem) {
        picker.appendChild(el("option", {
          value: String(currentStack.id),
          text: "目前裝備：" + currentItem.name + "（Stack " + currentStack.id + "）",
          selected: "selected"
        }));
        picker.appendChild(el("option", { value: "__unequip__", text: "－ 卸下這個欄位" }));
      } else {
        picker.appendChild(el("option", {
          value: "",
          text: eligible.length ? "從背包選擇（" + eligible.length + " 件符合）..." : "背包內沒有符合的裝備"
        }));
      }
      eligible.forEach(function (stack) {
        var it = ITEMS[String(stack.itemId)];
        picker.appendChild(el("option", { value: stack.id, text: it.name + "（Stack " + stack.id + "）" }));
      });
      picker.disabled = !currentStack && eligible.length === 0;
      picker.addEventListener("change", function () {
        if (!picker.value) return;
        if (picker.value === "__unequip__") {
          delete c.loadout[slotKey];
          renderLoadout(c);
          return;
        }
        c.loadout[slotKey] = Number(picker.value);
        var stack = c.stacks.find(function (s) { return s.id === Number(picker.value); });
        if (stack) renderItemPreview("equipItemPreview", stack.itemId);
        renderLoadout(c);
      });
      row.appendChild(picker);

      // 「目前裝備」本來就是選單裡預設選中的那格，不會觸發 select 的 change 事件，
      // 所以另外做一個按鈕，不管有沒有換裝備都能直接看目前這格裝備的能力說明。
      if (currentStack && currentItem) {
        var viewBtn = el("button", {
          class: "btn btn-sm", type: "button", text: "查看能力",
          style: "white-space:nowrap;"
        });
        viewBtn.addEventListener("click", function () {
          renderItemPreview("equipItemPreview", currentStack.itemId);
        });
        row.appendChild(viewBtn);
      }

      // 精煉值：只有目前這格真的裝備著東西時才顯示
      if (currentStack) {
        var refineSelect = el("select", { style: "width:64px;" });
        for (var rv = 0; rv <= 12; rv++) {
          var opt = el("option", { value: String(rv), text: "+" + rv });
          if ((currentStack.refine || 0) === rv) opt.selected = true;
          refineSelect.appendChild(opt);
        }
        refineSelect.addEventListener("change", function () {
          currentStack.refine = Number(refineSelect.value);
        });
        row.appendChild(refineSelect);
      }

      box.appendChild(row);
      wrap.appendChild(box);
    });
    renderAura(c);
  }

  // ---------- 光環的靈魂結晶（10-10 新增的系統；存檔欄位用離線版實測過）----------
  // 光環那一疊：soulSlots = 結晶欄數（遊戲在拿到的當下隨機給 AURA.slots.min~max），
  //             souls = [{itemId: 結晶, options: [{kind, value, unit: 0}]}]（鑲上去的結晶，最多 soulSlots 顆）
  // 穿著的光環是 loadout.aura = 那一疊的 id，上面「光環 (aura)」那一格就是在改它。
  var AURA = window.AURA || null;
  function renderAura(c) {
    var wrap = document.getElementById("auraFields");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!AURA || !EQUIP_SLOTS.aura) return;
    var tierIds = AURA.tiers.map(function (t) { return t[0]; });
    var colorOf = function (itemId) { return AURA.colors.filter(function (x) { return x.item === itemId; })[0]; };
    var kindLabel = function (kind) { return (AURA.kinds[String(kind)] || {}).name || ("#" + kind); };
    var rerender = function () { renderLoadout(c); };

    wrap.appendChild(el("div", { class: "section-title", text: "光環的靈魂結晶" }));
    wrap.appendChild(el("div", {
      style: "font-size:12px;color:var(--text3);line-height:1.7;margin-bottom:10px;",
      text: "列出背包裡每一件光環。可以改階級、精煉值、結晶欄數（遊戲正常是 " + AURA.slots.min + "~" + AURA.slots.max +
        " 欄），以及鑲在上面的靈魂結晶（顏色決定能選哪些屬性，每顆最多 " + AURA.maxOptions + " 條）。" +
        "數值旁邊的範圍是遊戲正常做得出來的範圍，超過也能存，但正常玩不會出現。"
    }));

    var addRow = el("div", { style: "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;" });
    tierIds.forEach(function (itemId) {
      var btn = el("button", { class: "btn btn-sm", type: "button", text: "＋ " + itemName(itemId) });
      btn.addEventListener("click", function () {
        var newId = c.nextStackId || 1;
        c.nextStackId = newId + 1;
        c.stacks.push({ id: newId, itemId: itemId, count: 1, soulSlots: AURA.slots.max });
        rerender();
        renderStacks(c);
      });
      addRow.appendChild(btn);
    });
    wrap.appendChild(addRow);

    var auras = c.stacks.filter(function (s) { return tierIds.indexOf(s.itemId) >= 0; });
    if (!auras.length) {
      wrap.appendChild(el("div", { style: "font-size:12.5px;color:var(--text3);", text: "背包裡沒有光環，可以用上面的按鈕新增一件。" }));
      return;
    }
    auras.forEach(function (stack) {
      var worn = c.loadout.aura === stack.id;
      var card = el("div", { style: "border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;" });
      var head = el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;" });
      head.appendChild(el("b", { text: itemName(stack.itemId) + (stack.refine ? " +" + stack.refine : "") }));
      head.appendChild(el("span", { style: "font-size:11.5px;color:var(--text3);", text: "Stack " + stack.id + (worn ? "・穿著中" : "") }));
      var wearBtn = el("button", { class: "btn btn-sm", type: "button", text: worn ? "卸下" : "穿上" });
      wearBtn.addEventListener("click", function () {
        if (worn) delete c.loadout.aura; else c.loadout.aura = stack.id;
        rerender();
      });
      head.appendChild(wearBtn);
      card.appendChild(head);

      var grid = el("div", { class: "grid", style: "grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:10px;" });
      grid.appendChild(fieldSelect("階級",
        tierIds.map(function (id) { return { value: String(id), label: itemName(id) }; }),
        function () { return String(stack.itemId); },
        function (v) { stack.itemId = Number(v); rerender(); renderStacks(c); }));
      var refineOpts = [];
      for (var rv = 0; rv <= 12; rv++) refineOpts.push({ value: String(rv), label: "+" + rv });
      grid.appendChild(fieldSelect("精煉值 refine", refineOpts,
        function () { return String(stack.refine || 0); },
        function (v) { stack.refine = Number(v); rerender(); renderStacks(c); }));
      var slotOpts = [];
      for (var sv = AURA.slots.min; sv <= AURA.slots.max; sv++) slotOpts.push({ value: String(sv), label: sv + " 欄" });
      // 存檔裡是範圍外的數字（例如手動改過）也要列出來，不能默默換掉
      if (stack.soulSlots != null && (stack.soulSlots < AURA.slots.min || stack.soulSlots > AURA.slots.max)) {
        slotOpts.push({ value: String(stack.soulSlots), label: stack.soulSlots + " 欄（超出正常範圍）" });
      }
      if (stack.soulSlots == null) slotOpts.unshift({ value: "", label: "（還沒決定，進遊戲時隨機）" });
      grid.appendChild(fieldSelect("結晶欄數 soulSlots", slotOpts,
        function () { return stack.soulSlots == null ? "" : String(stack.soulSlots); },
        function (v) { if (v === "") delete stack.soulSlots; else stack.soulSlots = Number(v); rerender(); }));
      card.appendChild(grid);

      var souls = stack.souls || [];
      var slotCount = stack.soulSlots == null ? AURA.slots.max : stack.soulSlots;
      souls.forEach(function (soul, soulIdx) {
        var color = colorOf(soul.itemId);
        var box = el("div", { style: "border-top:1px dashed var(--border);padding-top:10px;margin-top:10px;" });
        var top = el("div", { style: "display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;" });
        top.appendChild(el("span", { style: "font-size:12px;color:var(--text3);", text: "第 " + (soulIdx + 1) + " 欄" }));
        var colorSelect = el("select", { style: "min-width:150px;" });
        if (!color) colorSelect.appendChild(el("option", { value: String(soul.itemId), text: itemName(soul.itemId), selected: "selected" }));
        AURA.colors.forEach(function (x) {
          var opt = el("option", { value: String(x.item), text: itemName(x.item) });
          if (x.item === soul.itemId) opt.selected = true;
          colorSelect.appendChild(opt);
        });
        colorSelect.addEventListener("change", function () {
          soul.itemId = Number(colorSelect.value);
          // 換顏色之後，新顏色沒有的屬性留著也不會壞，但正常做不出來，所以拿掉
          var next = colorOf(soul.itemId);
          soul.options = (soul.options || []).filter(function (o) { return next.options.some(function (x) { return x.kind === o.kind; }); });
          rerender();
        });
        top.appendChild(colorSelect);
        var pullBtn = el("button", { class: "icon-btn", type: "button", text: "✕", title: "拔掉這顆結晶" });
        pullBtn.addEventListener("click", function () {
          souls.splice(soulIdx, 1);
          if (souls.length) stack.souls = souls; else delete stack.souls;
          rerender();
        });
        top.appendChild(pullBtn);
        box.appendChild(top);

        if (!soul.options) soul.options = [];
        soul.options.forEach(function (o, optIdx) {
          var def = color ? color.options.filter(function (x) { return x.kind === o.kind; })[0] : null;
          var pct = (AURA.kinds[String(o.kind)] || {}).pct ? "%" : "";
          var line = el("div", { style: "display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0 4px 16px;" });
          var kindSelect = el("select", { style: "min-width:140px;" });
          if (!def) kindSelect.appendChild(el("option", { value: String(o.kind), text: kindLabel(o.kind) + "（這個顏色正常沒有）", selected: "selected" }));
          (color ? color.options : []).forEach(function (x) {
            var opt = el("option", { value: String(x.kind), text: kindLabel(x.kind) });
            if (x.kind === o.kind) opt.selected = true;
            kindSelect.appendChild(opt);
          });
          kindSelect.addEventListener("change", function () {
            o.kind = Number(kindSelect.value);
            var nd = color.options.filter(function (x) { return x.kind === o.kind; })[0];
            if (nd) o.value = nd.max;
            rerender();
          });
          line.appendChild(kindSelect);
          var valueInput = el("input", { type: "number", style: "width:90px;" });
          valueInput.value = o.value;
          valueInput.addEventListener("input", function () { o.value = valueInput.valueAsNumber || 0; });
          line.appendChild(valueInput);
          line.appendChild(el("span", { style: "font-size:11.5px;color:var(--text3);", text: def ? "範圍 " + def.min + "~" + def.max + pct : pct }));
          var delBtn = el("button", { class: "icon-btn", type: "button", text: "✕", title: "刪掉這一條屬性" });
          delBtn.addEventListener("click", function () { soul.options.splice(optIdx, 1); rerender(); });
          line.appendChild(delBtn);
          box.appendChild(line);
        });
        if (color && soul.options.length < AURA.maxOptions) {
          var addOpt = el("button", { class: "btn btn-sm", type: "button", text: "＋ 屬性", style: "margin-left:16px;" });
          addOpt.addEventListener("click", function () {
            var first = color.options[0];
            soul.options.push({ kind: first.kind, value: first.max, unit: 0 });
            rerender();
          });
          box.appendChild(addOpt);
        }
        card.appendChild(box);
      });

      var foot = el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;" });
      foot.appendChild(el("span", { style: "font-size:12px;color:var(--text3);", text: "已鑲 " + souls.length + " / " + slotCount + " 欄" }));
      if (souls.length < slotCount) {
        var addSoul = el("button", { class: "btn btn-sm", type: "button", text: "＋ 鑲一顆結晶" });
        addSoul.addEventListener("click", function () {
          var first = AURA.colors[0];
          stack.souls = souls.concat([{ itemId: first.item, options: [{ kind: first.options[0].kind, value: first.options[0].max, unit: 0 }] }]);
          rerender();
        });
        foot.appendChild(addSoul);
      } else if (souls.length > slotCount) {
        foot.appendChild(el("span", { style: "font-size:12px;color:var(--red);", text: "⚠️ 鑲的結晶比欄數多，正常玩不會出現這種狀況。" }));
      }
      card.appendChild(foot);
      wrap.appendChild(card);
    });
  }

  // ---------- 已學技能 ----------
  function fmtDur(ms) {
    if (!ms) return "無持續時間";
    var totalSec = Math.round(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var parts = [];
    if (h) parts.push(h + "時");
    if (m) parts.push(m + "分");
    if (!h && s) parts.push(s + "秒");
    return parts.join("") || "0秒";
  }

  function findCharSkill(c, skillId) {
    for (var i = 0; i < c.skills.length; i++) {
      if (c.skills[i][0] === skillId) return c.skills[i];
    }
    return null;
  }
  function setCharSkillLevel(c, skillId, level, maxLv) {
    level = Math.max(1, Math.min(level, maxLv));
    var existing = findCharSkill(c, skillId);
    if (existing) existing[1] = level;
    else c.skills.push([skillId, level]);
  }
  function removeCharSkill(c, skillId) {
    c.skills = c.skills.filter(function (pair) { return pair[0] !== skillId; });
  }

  function renderSkillsPanel(c) {
    var wrap = document.getElementById("skillList");
    var $search = document.getElementById("skillSearch");

    function draw() {
      var q = ($search.value || "").trim();
      wrap.innerHTML = "";
      Object.keys(SKILLS).forEach(function (jobId) {
        var list = SKILLS[jobId].filter(function (s) { return !q || s.name.indexOf(q) !== -1; });
        if (!list.length) return;

        var group = el("div", { class: "skill-job-group" });
        group.appendChild(el("div", { class: "skill-job-title", text: (JOB_NAME[jobId] || jobId) }));
        var grid = el("div", { class: "skill-grid" });

        list.forEach(function (s) {
          var existing = findCharSkill(c, s.id);
          var card = el("label", { class: "skill-card" + (existing ? " checked" : "") });
          var cb = el("input", { type: "checkbox" });
          cb.checked = !!existing;
          var lvInput = el("input", { type: "number", class: "lv-input", min: "1", max: String(s.maxLv) });
          lvInput.value = existing ? existing[1] : s.maxLv;
          lvInput.disabled = !existing;

          cb.addEventListener("change", function () {
            if (cb.checked) {
              setCharSkillLevel(c, s.id, Number(lvInput.value) || s.maxLv, s.maxLv);
              lvInput.disabled = false;
              card.classList.add("checked");
            } else {
              removeCharSkill(c, s.id);
              lvInput.disabled = true;
              card.classList.remove("checked");
            }
          });
          lvInput.addEventListener("input", function () {
            if (cb.checked) setCharSkillLevel(c, s.id, lvInput.valueAsNumber || 1, s.maxLv);
          });

          card.appendChild(cb);
          card.appendChild(el("span", { text: s.name }));
          card.appendChild(lvInput);
          card.appendChild(el("span", { class: "dur", text: "/" + s.maxLv }));
          grid.appendChild(card);
        });

        group.appendChild(grid);
        wrap.appendChild(group);
      });
    }

    $search.oninput = draw;
    document.getElementById("skillSelectAllBtn").onclick = function () {
      Object.keys(SKILLS).forEach(function (jobId) {
        SKILLS[jobId].forEach(function (s) { setCharSkillLevel(c, s.id, s.maxLv, s.maxLv); });
      });
      draw();
    };
    document.getElementById("skillClearAllBtn").onclick = function () {
      if (!confirm("確定要清空全部已學技能嗎？")) return;
      c.skills = [];
      draw();
    };
    draw();
  }

  // ---------- 輔助狀態 ----------
  function allBuffSkills() {
    var out = [];
    Object.keys(SKILLS).forEach(function (jobId) {
      SKILLS[jobId].forEach(function (s) { if (s.buff) out.push({ jobId: jobId, skill: s }); });
    });
    return out;
  }

  function renderBuffsPanel(c) {
    var wrap = document.getElementById("buffList");
    if (!Array.isArray(c.buffSkillIds)) c.buffSkillIds = [];

    function currentDurText(s) {
      var learned = findCharSkill(c, s.id);
      var lv = learned ? learned[1] : 1;
      var ms = (s.durMs && s.durMs[lv - 1]) || 0;
      return "Lv." + lv + " → " + fmtDur(ms);
    }

    function draw() {
      wrap.innerHTML = "";
      var byJob = {};
      allBuffSkills().forEach(function (entry) {
        if (!byJob[entry.jobId]) byJob[entry.jobId] = [];
        byJob[entry.jobId].push(entry.skill);
      });

      Object.keys(byJob).forEach(function (jobId) {
        var group = el("div", { class: "skill-job-group" });
        group.appendChild(el("div", { class: "skill-job-title", text: (JOB_NAME[jobId] || jobId) }));
        var grid = el("div", { class: "skill-grid" });

        byJob[jobId].forEach(function (s) {
          var active = c.buffSkillIds.indexOf(s.id) !== -1;
          var card = el("label", { class: "skill-card" + (active ? " checked" : "") });
          var cb = el("input", { type: "checkbox" });
          cb.checked = active;
          cb.addEventListener("change", function () {
            var idx = c.buffSkillIds.indexOf(s.id);
            if (cb.checked && idx === -1) c.buffSkillIds.push(s.id);
            else if (!cb.checked && idx !== -1) c.buffSkillIds.splice(idx, 1);
            card.classList.toggle("checked", cb.checked);
          });
          card.appendChild(cb);
          card.appendChild(el("span", { text: s.name }));
          card.appendChild(el("span", { class: "dur", text: currentDurText(s) }));
          grid.appendChild(card);
        });

        group.appendChild(grid);
        wrap.appendChild(group);
      });
    }

    document.getElementById("buffSelectAllBtn").onclick = function () {
      allBuffSkills().forEach(function (entry) {
        if (c.buffSkillIds.indexOf(entry.skill.id) === -1) c.buffSkillIds.push(entry.skill.id);
      });
      draw();
    };
    document.getElementById("buffClearAllBtn").onclick = function () {
      c.buffSkillIds = [];
      draw();
    };
    document.getElementById("buffApplyLevelBtn").onclick = function () {
      var lv = document.getElementById("buffLevelInput").valueAsNumber || 1;
      allBuffSkills().forEach(function (entry) {
        setCharSkillLevel(c, entry.skill.id, lv, entry.skill.maxLv);
      });
      draw();
      renderSkillsPanel(c); // 等級連動，已學技能面板也要同步更新
    };
    draw();
  }

  // ---------- 寵物需求檢查（等級/名聲）與提醒視窗 ----------
  var petsTouched = false; // 只有玩家真的動過寵物，才會做這些檢查/跳窗

  function renderQuestLines() {
    var wrap = document.getElementById("questLinesList");
    var lineIds = Object.keys(MAIN_QUEST_LINES).sort(function (a, b) {
      var la = MAIN_QUEST_LINES[a], lb = MAIN_QUEST_LINES[b];
      return (lb.jobRelated - la.jobRelated) || la.title.localeCompare(lb.title, "zh-Hant");
    });
    if (!lineIds.length) {
      wrap.innerHTML = '<div class="panel-desc">目前沒有主線任務資料（data/questLines.js 是空的）。</div>';
      return;
    }
    wrap.innerHTML = "";
    lineIds.forEach(function (lid) {
      var line = MAIN_QUEST_LINES[lid];
      var details = el("details", { style: "margin-bottom:10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px 14px;" });
      var summary = el("summary", { style: "cursor:pointer;font-weight:700;color:var(--text);" });
      summary.textContent = line.title + (line.jobRelated ? "　🔶 職業進度" : "") + "　（共 " + line.parts.length + " 步）";
      details.appendChild(summary);
      var stepsWrap = el("div", { style: "margin-top:10px;display:flex;flex-direction:column;gap:8px;" });
      line.parts.forEach(function (part) {
        var mapNames = (part.mapIds || []).map(function (mid) { return MAPS[String(mid)] || ("地圖#" + mid); }).join("、");
        var row = el("div", { style: "padding:8px 10px;background:var(--bg3);border-radius:5px;" });
        row.appendChild(el("div", { style: "font-weight:600;color:var(--gold,#c9a24b);margin-bottom:3px;", text: "步驟 " + part.seq + "：" + part.name }));
        row.appendChild(el("div", { class: "note", text: (part.npcName ? "NPC：" + part.npcName : "") + (mapNames ? "　地圖：" + mapNames : "") }));
        var reqList = part.requirements || [];
        var multiReq = reqList.length > 1;
        reqList.forEach(function (req, rIdx) {
          var reqBits = [];
          if (req.lv) reqBits.push("等級 " + req.lv);
          if (req.fame) reqBits.push("名聲 " + req.fame);
          if (req.gold) reqBits.push("金幣 " + req.gold);
          (req.items || []).forEach(function (it) { reqBits.push(itemName(it[0]) + " ×" + it[1]); });
          if (reqBits.length) {
            row.appendChild(el("div", {
              class: "note", style: "margin-top:2px;",
              text: ((multiReq ? "方式" + (rIdx + 1) + "：" : "") + "需求：" + reqBits.join("、"))
            }));
          }
        });
        stepsWrap.appendChild(row);
      });
      details.appendChild(stepsWrap);
      wrap.appendChild(details);
    });
  }

  function checkPetRequirement(pet, c) {
    var def = PETS[String(pet.id)];
    if (!def) return { lvOk: true, fameOk: true };
    var lvOk = (c.level || 0) >= (def.lv || 0);
    // 遊戲 yy()：角色等級 ≥ 寵物 lv，而且「累計名聲」fame.total ≥ 寵物 fame
    var fameOk = ((c.fame && c.fame.total) || 0) >= (def.fame || 0);
    return { lvOk: lvOk, fameOk: fameOk, def: def };
  }

  var PET_STAT_LABEL = { atk: "攻", def: "防", mag: "魔", aspd: "攻速", crit: "爆擊", eva: "迴避", mspd: "移速", hit: "命中", dmgDealtPct: "增傷" };
  // 照遊戲 vy()：飽食度 hunger 在存檔 v39 就拿掉了（改成餵食累積 exp 升階），加成只看成長階段 grow：
  // 每個屬性各自看，grow > 0 而且 growth[屬性][grow-1] 有值就用那個；否則用寵物基礎資料的數字（grow 0 也是基礎值）。
  function petBonusAt(def, grow) {
    var out = {};
    if (!def) {
      Object.keys(PET_STAT_LABEL).forEach(function (k) { out[k] = 0; });
      return out;
    }
    Object.keys(PET_STAT_LABEL).forEach(function (k) {
      var curve = def.growth && def.growth[k];
      if (curve && grow > 0 && curve[grow - 1] !== undefined) out[k] = curve[grow - 1];
      else out[k] = (def.stats && def.stats[k]) || 0;
    });
    return out;
  }
  function petBonusText(bonus) {
    var parts = [];
    Object.keys(PET_STAT_LABEL).forEach(function (k) {
      if (bonus[k]) parts.push(PET_STAT_LABEL[k] + bonus[k]);
    });
    return parts.length ? parts.join("　") : "無任何能力";
  }

  function showCenterModal(title, message) {
    var old = document.getElementById("centerModalOverlay");
    if (old) old.remove();
    var overlay = el("div", { id: "centerModalOverlay", class: "modal-overlay show" });
    var box = el("div", { class: "modal-box" });
    box.appendChild(el("div", { style: "font-weight:700;font-size:16px;color:var(--red);margin-bottom:10px;", text: title }));
    var msgEl = el("div", { style: "font-size:13.5px;color:var(--text2);line-height:1.8;white-space:pre-line;" });
    msgEl.textContent = message;
    box.appendChild(msgEl);
    var closeBtn = el("button", { class: "btn btn-accent", style: "margin-top:16px;", text: "我知道了" });
    closeBtn.addEventListener("click", function () { overlay.remove(); });
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function warnIfPetInvalid(pet, c) {
    var r = checkPetRequirement(pet, c);
    if (r.lvOk && r.fameOk) return;
    var lines = [];
    lines.push("寵物「" + petName(pet.id) + "」尚未達到出戰條件：");
    if (!r.lvOk) lines.push("・角色等級不足：目前 " + (c.level || 0) + "，需要 " + r.def.lv);
    if (!r.fameOk) lines.push("・角色累計名聲不足：目前 " + ((c.fame && c.fame.total) || 0) + "，需要 " + r.def.fame);
    lines.push("\n請調整後再匯出存檔，否則這隻寵物在遊戲裡不會顯示出戰按鈕。");
    showCenterModal("⚠️ 寵物需求未達標", lines.join("\n"));
  }

  // ---------- 寵物鑑定（2026-09 新系統，規則照遊戲 bundle 的 appraisePet／O_／E_／A_）----------
  // 存檔欄位（跟裝備鑑定一樣的格式）：pet.unidentified（true＝未鑑定）、pet.appraisal（[{kind, value, unit:0}]）、pet.apprTries
  // 每種屬性各自擲：出現機率 10% + (階級-1)×3%；出現後抽倍率 k（權重 PET_APPR_WEIGHTS），數值 = k × 權重 ÷ 5，k=0 就不列
  // ⚠️ 種類編號用遊戲「現行」的（c_）：1攻 2魔 3命中 4迴避 5防禦 6必殺 7攻速 8移速 11 HP% 12 AP% 13增傷 14減傷
  var PET_APPR_KINDS = [[1, 25], [2, 25], [5, 25], [8, 15], [7, 10], [3, 10], [4, 10], [6, 10], [11, 10], [12, 10], [13, 5], [14, 5]];
  var PET_APPR_KIND_NAME = { 1: "攻擊力", 2: "魔法力", 3: "命中率", 4: "迴避率", 5: "防禦力", 6: "必殺技", 7: "攻擊速度", 8: "移動速度", 11: "HP%", 12: "AP%", 13: "增加傷害%", 14: "減少傷害%" };
  var PET_APPR_K = [-2, -1, 0, 1, 2, 3, 4, 5];
  var PET_APPR_WEIGHTS = [120000, 170000, 230000, 255000, 210000, 10000, 5000, 0]; // 遊戲 m_.pet
  var openPetApprUid = null; // 寵物表格目前展開鑑定編輯的那一隻

  function petApprChance(tier) { return 0.1 + Math.max(0, (tier || 1) - 1) * 0.03; }
  function petApprWeight(kind) { var p = PET_APPR_KINDS.find(function (x) { return x[0] === kind; }); return p ? p[1] : 0; }
  // 遊戲抽得到的數值（k=-2~4，k=5 權重是 0 抽不到；0 等於沒有這條）
  function petApprLegalValues(kind) {
    var w = petApprWeight(kind);
    return [-2, -1, 1, 2, 3, 4].map(function (k) { return k * w / 5; });
  }
  function petApprLineText(r) {
    var name = PET_APPR_KIND_NAME[r.kind] || ("種類#" + r.kind);
    var pct = /%$/.test(name);
    return name.replace(/%$/, "") + " " + (r.value > 0 ? "+" : "") + r.value + (pct ? "%" : "");
  }
  function petApprSummary(pet) {
    if (pet.unidentified) return "未鑑定";
    var list = pet.appraisal || [];
    if (!list.length) return "已鑑定（沒有屬性）";
    return list.map(petApprLineText).join("、");
  }
  function petApprRollK() {
    var r = Math.random() * 1000000;
    for (var i = 0; i < PET_APPR_WEIGHTS.length; i++) {
      r -= PET_APPR_WEIGHTS[i];
      if (r < 0) return PET_APPR_K[i];
    }
    return PET_APPR_K[PET_APPR_K.length - 1];
  }
  function petApprRoll(tier) {
    var chance = petApprChance(tier), out = [];
    PET_APPR_KINDS.forEach(function (pair) {
      if (Math.random() >= chance) return;
      var k = petApprRollK();
      if (k !== 0) out.push({ kind: pair[0], value: k * pair[1] / 5, unit: 0 });
    });
    return out;
  }

  function petApprEditor(c, pet, onChange) {
    var def = PETS[String(pet.id)] || {};
    var box = el("div", { style: "padding:10px 4px;font-size:13px;" });
    box.appendChild(el("div", {
      style: "color:var(--text3);margin-bottom:10px;line-height:1.6;",
      text: "「" + (def.name || "") + "」是 " + (def.tier || 1) + " 階：每種屬性出現機率 " + Math.round(petApprChance(def.tier) * 1000) / 10 +
        "%（出現後還有 23% 抽到 0 等於沒有）。遊戲裡到寵物鑑定師付「寵物賣價」鑑定一次，出戰中的那隻不能鑑定、鑑定完不能重來；這裡可以直接改。"
    }));

    function apply(list, unidentified) {
      pet.unidentified = !!unidentified;
      pet.appraisal = unidentified ? [] : list.map(function (r) { return { kind: r.kind, value: r.value, unit: 0 }; });
      pet.apprTries = Math.max(pet.apprTries || 0, unidentified ? (pet.apprTries || 0) : 1);
      petsTouched = true;
      onChange();
    }

    // 狀態
    var stateRow = el("div", { style: "display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;" });
    stateRow.appendChild(el("span", { text: "目前：" }));
    var stateText = el("b", { text: petApprSummary(pet) });
    stateRow.appendChild(stateText);
    var resetBtn = el("button", { class: "btn btn-sm", text: "↩ 改回未鑑定" });
    resetBtn.addEventListener("click", function () {
      apply([], true);
      lines = [];
      refresh();
      toast("「" + (def.name || "") + "」改回未鑑定", "ok");
    });
    stateRow.appendChild(resetBtn);
    box.appendChild(stateRow);

    // 抽
    var gachaRow = el("div", { style: "display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap;" });
    var rollBtn = el("button", { class: "btn btn-accent btn-sm", text: "🎲 照遊戲規則抽一次（不限次數）" });
    var useBtn = el("button", { class: "btn btn-sm", text: "✅ 套用這次抽到的" });
    useBtn.disabled = true;
    var rolled = null;
    var rollPreview = el("span", { style: "color:var(--text3);", text: "" });
    rollBtn.addEventListener("click", function () {
      rolled = petApprRoll(def.tier);
      useBtn.disabled = false;
      rollPreview.textContent = rolled.length ? "抽到：" + rolled.map(petApprLineText).join("、") : "抽到：這次沒有任何屬性";
    });
    useBtn.addEventListener("click", function () {
      if (!rolled) return;
      apply(rolled, false);
      lines = rolled.map(function (r) { return { kind: r.kind, value: r.value }; });
      rolled = null;
      useBtn.disabled = true;
      rollPreview.textContent = "";
      refresh();
      toast("已套用鑑定結果到「" + (def.name || "") + "」", "ok");
    });
    gachaRow.appendChild(rollBtn);
    gachaRow.appendChild(useBtn);
    gachaRow.appendChild(rollPreview);
    box.appendChild(gachaRow);

    // 手動
    box.appendChild(el("div", { style: "font-weight:700;margin:14px 0 6px;", text: "✏️ 自己挑屬性（每種最多一條，只能選遊戲抽得到的數值）" }));
    var lines = (pet.appraisal || []).map(function (r) { return { kind: r.kind, value: r.value }; });
    var linesWrap = el("div", {});
    box.appendChild(linesWrap);
    var manualBtns = el("div", { style: "display:flex;gap:8px;margin-top:6px;" });
    var addBtn = el("button", { class: "btn btn-sm", text: "➕ 加一條" });
    var saveBtn = el("button", { class: "btn btn-accent btn-sm", text: "💾 套用手動設定" });
    manualBtns.appendChild(addBtn);
    manualBtns.appendChild(saveBtn);
    box.appendChild(manualBtns);

    function usedKinds(except) {
      var s = {};
      lines.forEach(function (l, i) { if (i !== except) s[l.kind] = true; });
      return s;
    }
    function renderLines() {
      linesWrap.innerHTML = "";
      if (!lines.length) linesWrap.appendChild(el("div", { style: "color:var(--text3);", text: "（沒有任何屬性。按「加一條」新增；套用空的等於「已鑑定但沒有屬性」。）" }));
      lines.forEach(function (line, idx) {
        var row = el("div", { style: "display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap;" });
        var used = usedKinds(idx);
        var kindSel = el("select", { style: "min-width:120px;" });
        PET_APPR_KINDS.forEach(function (pair) {
          var o = el("option", { value: pair[0], text: PET_APPR_KIND_NAME[pair[0]] + (used[pair[0]] ? "（已選）" : "") });
          if (pair[0] === line.kind) o.selected = true;
          if (used[pair[0]]) o.disabled = true;
          kindSel.appendChild(o);
        });
        kindSel.addEventListener("change", function () {
          line.kind = Number(kindSel.value);
          var legal = petApprLegalValues(line.kind);
          if (legal.indexOf(line.value) === -1) line.value = legal[2]; // 換種類後數值不合法就改成 +1 檔
          renderLines();
        });
        var valSel = el("select", { style: "width:90px;" });
        var legal = petApprLegalValues(line.kind);
        if (legal.indexOf(line.value) === -1) line.value = legal[2];
        legal.forEach(function (v) {
          var o = el("option", { value: v, text: (v > 0 ? "+" : "") + v });
          if (v === line.value) o.selected = true;
          valSel.appendChild(o);
        });
        valSel.addEventListener("change", function () { line.value = Number(valSel.value); });
        var del = el("button", { class: "icon-btn", text: "✕" });
        del.addEventListener("click", function () { lines.splice(idx, 1); renderLines(); });
        row.appendChild(kindSel);
        row.appendChild(valSel);
        row.appendChild(del);
        linesWrap.appendChild(row);
      });
      addBtn.disabled = lines.length >= PET_APPR_KINDS.length;
    }
    addBtn.addEventListener("click", function () {
      var used = usedKinds(-1);
      var free = PET_APPR_KINDS.find(function (p) { return !used[p[0]]; });
      if (!free) return;
      lines.push({ kind: free[0], value: free[1] / 5 });
      renderLines();
    });
    saveBtn.addEventListener("click", function () {
      apply(lines, false);
      refresh();
      toast("已套用手動鑑定到「" + (def.name || "") + "」", "ok");
    });

    function refresh() {
      stateText.textContent = petApprSummary(pet);
      renderLines();
    }
    renderLines();
    return box;
  }

  function renderPets(c) {
    var $tbody = document.querySelector("#petsTable tbody");
    $tbody.innerHTML = "";
    c.pets.forEach(function (pet, idx) {
      var tr = document.createElement("tr");
      var reqCheck = checkPetRequirement(pet, c);
      var invalid = petsTouched && (!reqCheck.lvOk || !reqCheck.fameOk);
      if (invalid) tr.style.background = "rgba(239,83,80,.12)";

      var tdActive = document.createElement("td");
      var activeRadio = el("input", { type: "radio", name: "activePet", style: "cursor:pointer;width:18px;height:18px;" });
      activeRadio.checked = c.activePetUid === pet.uid;
      activeRadio.addEventListener("change", function () {
        c.activePetUid = pet.uid;
        petsTouched = true;
        renderPets(c);
        warnIfPetInvalid(pet, c);
      });
      tdActive.appendChild(activeRadio);
      tr.appendChild(tdActive);

      var tdPet = document.createElement("td");
      tdPet.appendChild(makePetSelect(pet.id, function (newId) {
        pet.id = newId;
        // 遊戲收養新寵物是 grow 0（用基礎能力），這裡預設 1 讓成長曲線的第一格生效
        pet.grow = 1;
        pet.exp = 0;
        delete pet.hunger; // v39 起遊戲沒有飽食度了
        petsTouched = true;
        renderPets(c);
        warnIfPetInvalid(pet, c);
      }));
      if (invalid) tdPet.style.color = "var(--red)";
      tr.appendChild(tdPet);

      ["uid", "grow", "exp"].forEach(function (field) {
        var td = document.createElement("td");
        var inpAttrs = { type: "number", value: pet[field], style: "width:100%;min-width:56px;" };
        if (field === "grow") { inpAttrs.min = "0"; inpAttrs.max = "9"; } // 成長階段最高只到 9，超過遊戲裡的加成表也查不到
        var inp = el("input", inpAttrs);
        inp.addEventListener("input", function () {
          var v = inp.valueAsNumber;
          if (field === "grow" && !isNaN(v) && v > 9) { v = 9; inp.value = "9"; }
          pet[field] = isNaN(v) ? 0 : Math.max(0, v);
          if (field === "grow") updateBonusCell();
        });
        td.appendChild(inp);
        tr.appendChild(td);
      });

      var tdLv = document.createElement("td");
      var lvDef = PETS[String(pet.id)];
      var lvInp = el("input", {
        type: "number", readonly: "readonly",
        value: lvDef ? lvDef.lv : 0,
        title: "人物等級需要達到這個數值，才能讓這隻寵物出戰（唯讀，來自寵物基礎資料，不能編輯）"
      });
      if (invalid && !reqCheck.lvOk) lvInp.style.color = "var(--red)";
      tdLv.appendChild(lvInp);
      tr.appendChild(tdLv);

      var tdFame = document.createElement("td");
      var fameDef = PETS[String(pet.id)];
      var fameInp = el("input", {
        type: "number", readonly: "readonly",
        value: fameDef ? fameDef.fame : 0,
        title: "人物名聲需要達到這個數值，才能讓這隻寵物出戰（唯讀，來自寵物基礎資料，不能編輯）"
      });
      if (invalid && !reqCheck.fameOk) fameInp.style.color = "var(--red)";
      tdFame.appendChild(fameInp);
      tr.appendChild(tdFame);

      var tdBonus = document.createElement("td");
      tdBonus.style.fontSize = "12px";
      tr.appendChild(tdBonus);
      function updateBonusCell() {
        var def = PETS[String(pet.id)];
        tdBonus.textContent = petBonusText(petBonusAt(def, pet.grow));
        tdBonus.title = "只有出戰中的寵物，這個加成才會真的套用到角色身上";
      }
      updateBonusCell();

      var tdAppr = document.createElement("td");
      tdAppr.style.fontSize = "12px";
      var apprSummary = el("div", { style: "margin-bottom:4px;line-height:1.5;", text: petApprSummary(pet) });
      var apprBtn = el("button", { class: "btn btn-sm", text: openPetApprUid === pet.uid ? "▲ 收起" : "🔍 鑑定" });
      apprBtn.disabled = !PETS[String(pet.id)];
      apprBtn.addEventListener("click", function () {
        openPetApprUid = openPetApprUid === pet.uid ? null : pet.uid;
        renderPets(c);
      });
      tdAppr.appendChild(apprSummary);
      tdAppr.appendChild(apprBtn);
      tr.appendChild(tdAppr);

      var tdAct = document.createElement("td");
      tdAct.style.whiteSpace = "nowrap";
      // 7 階進化要「+9 而且經驗 100%」的 6 階、寵物冶煉要 +9 的 7 階，一鍵養到那個狀態
      var fullBtn = el("button", { class: "btn btn-sm", text: "養滿", title: "成長階段設成 +9、經驗餵到 100%（7 階進化／寵物冶煉的條件）" });
      fullBtn.disabled = !PETS[String(pet.id)];
      fullBtn.addEventListener("click", function () {
        pet.grow = 9;
        pet.exp = petExpFull(PETS[String(pet.id)], 9);
        renderPets(c);
        toast("「" + petName(pet.id) + "」已養到 +9、經驗 100%", "ok");
      });
      tdAct.appendChild(fullBtn);
      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () {
        var wasActive = c.activePetUid === pet.uid;
        c.pets.splice(idx, 1);
        if (wasActive) c.activePetUid = c.pets.length ? c.pets[0].uid : null;
        renderPets(c);
      });
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);

      $tbody.appendChild(tr);

      if (openPetApprUid === pet.uid && PETS[String(pet.id)]) {
        var apprTr = document.createElement("tr");
        var apprTd = el("td", { colspan: "10" });
        apprTd.style.background = "var(--bg2)";
        apprTd.appendChild(petApprEditor(c, pet, function () { apprSummary.textContent = petApprSummary(pet); }));
        apprTr.appendChild(apprTd);
        $tbody.appendChild(apprTr);
      }
    });

    document.getElementById("addPetBtn").onclick = function () {
      var uid = c.nextPetUid++;
      // 新增的寵物先留空，讓玩家自己從下拉選單挑選。
      // 鑑定欄位照遊戲收養新寵物的預設（未鑑定、沒有屬性、鑑定次數 0）；少了這幾個欄位，遊戲進化／重置鑑定時會出錯。
      // 欄位照遊戲 hy()：seed 是這隻寵物自己的亂數種子（鑑定／進化會用到），evolveTries 是進化嘗試次數
      c.pets.push({ uid: uid, id: 0, grow: 0, exp: 0, seed: (Math.floor(Math.random() * 4294967295) >>> 0) || 1, evolveTries: 0,
        unidentified: true, appraisal: [], apprTries: 0 });
      // 如果角色原本沒有任何出戰寵物，新增的這隻自動設為出戰
      if (!c.activePetUid) c.activePetUid = uid;
      petsTouched = true;
      renderPets(c);
    };
  }

  // ---------- 戰寵（全新系統，跟上面的寵物完全獨立，欄位是從遊戲原始碼反推的，還沒有存檔可以驗證）----------
  function bpetKindDef(kind) {
    return (BATTLE_PET_INFO.kinds || []).find(function (k) { return k.kind === kind; });
  }
  // 🚨 skills 一定要有（就算是空陣列）：遊戲讀存檔時是直接 `battlePet.skills.map(...)`，
  // 少了這個欄位會丟 TypeError，整隻角色就進不去（畫面停在選角、Console 出現
  // 「Cannot read properties of undefined (reading 'map')」）。已實際匯入遊戲驗證過。
  // skills 的格式是 [[技能id, 等級], ...]，空的代表還沒點技能，SP 全部保留。
  // 存檔格式版本（存檔最外層的 v）。遊戲改版會搬欄位，修改器新增東西時要照載入的那份存檔的版本來寫。
  function saveVersion() {
    return saveData && typeof saveData.v === "number" ? saveData.v : 0;
  }
  function newBattlePet(kindDef) {
    var bp = {
      kind: kindDef.kind, level: 1, exp: 0, grade: 0, seed: Math.floor(Math.random() * 1000000),
      closeness: 0, closenessMs: 0, loyalty: 0, loyaltyMs: 0,
      summoned: false, downed: false, skills: [],
      gear: (BATTLE_PET_INFO.gearSlots || []).map(function () { return null; }),
      upgradeTries: 0, mode: "active", // v52 起遊戲新建的戰寵都有 mode，預設 active（v83 起存檔升級會把 support 改成 counter）
    };
    // autoRevive 在 v84 被遊戲拿掉了（存檔升級時會直接刪掉這個欄位），新版存檔不要再寫
    if (saveVersion() < 84) bp.autoRevive = false;
    return bp;
  }
  // ---------- 戰寵裝備 ----------
  // 規則照遊戲 lf()：gear.pet 是 0（通用）或要等於戰寵種類；戰寵等級要 ≥ gear.lv；忠誠度要 ≥ gear.loyalty。
  // 存檔裡的每一格放的是 {id, itemId} 物件（id 是 stack id），不是單純的物品編號——
  // 舊版存檔的數字格式會被遊戲的 v24→v25 轉檔補成物件，這裡直接照新版寫。
  function bpetGearById(itemId) {
    return (BATTLE_PET_INFO.gear || []).find(function (g) { return g.id === itemId; });
  }
  function bpetGearFor(slotIdx, kind) {
    return (BATTLE_PET_INFO.gear || []).filter(function (g) {
      return g.slot === slotIdx && (g.pet === 0 || g.pet === kind);
    }).sort(function (a, b) { return (a.lv || 0) - (b.lv || 0) || a.name.localeCompare(b.name, "zh-Hant"); });
  }
  function bpetGearItemId(entry) {
    if (entry == null) return null;
    return typeof entry === "number" ? entry : entry.itemId;
  }
  // 換裝備時沿用原本那一格的 id，沒有的話跟角色要一個新的 stack id，避免跟背包的 id 撞號
  function bpetMakeGearEntry(c, itemId, prevEntry) {
    var id = prevEntry && typeof prevEntry === "object" && prevEntry.id != null ? prevEntry.id : (c.nextStackId = (c.nextStackId || 1) + 1) - 1;
    return { id: id, itemId: itemId };
  }
  var BPET_GEAR_STATS = [
    ["atk", "攻"], ["def", "防"], ["hp", "HP"], ["ap", "AP"],
    ["dmgDealtPct", "增傷%"], ["dmgTakenPct", "減傷%"],
  ];
  function bpetGearStatText(g) {
    return BPET_GEAR_STATS.map(function (pair) {
      var v = g[pair[0]];
      return v ? pair[1] + (v > 0 ? "+" : "") + v : "";
    }).filter(Boolean).join("・");
  }
  function bpetGearReqText(g) {
    return "Lv" + (g.lv || 0) + (g.loyalty ? "・忠誠" + g.loyalty : "");
  }
  // 回傳擋住的原因（字串），可以穿就回傳空字串
  function bpetGearBlock(g, bp) {
    if (g.pet !== 0 && g.pet !== bp.kind) return "種類不符";
    if ((bp.level || 0) < (g.lv || 0)) return "等級不足（需要 Lv" + g.lv + "）";
    if ((bp.loyalty || 0) < (g.loyalty || 0)) return "忠誠度不足（需要 " + g.loyalty + "）";
    return "";
  }

  // 舊版修改器產生的戰寵沒有 skills、而且裝備格寫的是純數字（物品編號），
  // 這兩種格式現在的遊戲都不吃（少 skills 會讓角色載入失敗，裝備格是數字則整隻戰寵被丟掉），
  // 載入存檔時順手補成新格式。
  function fixBattlePetShape(bp, c) {
    if (!bp) return bp;
    if (!Array.isArray(bp.skills)) bp.skills = [];
    if (!bp.mode) bp.mode = "active";
    if (!Array.isArray(bp.gear)) bp.gear = (BATTLE_PET_INFO.gearSlots || []).map(function () { return null; });
    bp.gear = bp.gear.map(function (entry) {
      if (typeof entry !== "number") return entry;
      return { id: (c.nextStackId = (c.nextStackId || 1) + 1) - 1, itemId: entry };
    });
    return bp;
  }
  function renderBattlePet(c) {
    if (!c.warehouse) c.warehouse = { gold: 0, nextStackId: 1, stacks: [], pets: [], battlePets: [] };
    if (!Array.isArray(c.warehouse.battlePets)) c.warehouse.battlePets = [];
    fixBattlePetShape(c.battlePet, c);
    c.warehouse.battlePets.forEach(function (bp) { fixBattlePetShape(bp, c); });

    var activeBox = document.getElementById("activeBattlePetBox");
    if (!activeBox) return; // 面板還沒被打開過，DOM 還沒建立，先跳過
    activeBox.innerHTML = "";

    var bp = c.battlePet;
    if (!bp) {
      activeBox.appendChild(el("div", { class: "note", text: "目前沒有出戰中的戰寵。", style: "margin-bottom:8px;" }));
      var addBtn = el("button", { class: "btn btn-accent btn-sm", text: "➕ 設定一隻出戰戰寵" });
      addBtn.addEventListener("click", function () {
        var firstKind = BATTLE_PET_INFO.kinds[0];
        if (!firstKind) { alert("目前沒有任何戰寵種類資料，請確認 data/battlePets.js 有沒有正確載入"); return; }
        c.battlePet = newBattlePet(firstKind);
        renderBattlePet(c);
      });
      activeBox.appendChild(addBtn);
      renderWarehouseBattlePets(c);
      return;
    }

    var grid = el("div", { class: "grid" });

    var kindField = el("div", { class: "field" });
    kindField.appendChild(el("label", { text: "種類 (kind)" }));
    var kindSel = el("select");
    BATTLE_PET_INFO.kinds.forEach(function (k) {
      var opt = el("option", { value: k.kind, text: k.name });
      if (bp.kind === k.kind) opt.selected = true;
      kindSel.appendChild(opt);
    });
    kindSel.addEventListener("change", function () { bp.kind = Number(kindSel.value); renderBattlePet(c); });
    kindField.appendChild(kindSel);
    grid.appendChild(kindField);

    function numField(label, key, min) {
      var field = el("div", { class: "field" });
      field.appendChild(el("label", { text: label }));
      var inp = el("input", { type: "number", value: bp[key] });
      if (min !== undefined) inp.min = String(min);
      inp.addEventListener("input", function () { bp[key] = inp.valueAsNumber || 0; });
      field.appendChild(inp);
      return field;
    }
    grid.appendChild(numField("等級 (level)　最高 " + (BATTLE_PET_INFO.maxLevel || "?"), "level", 1));
    grid.appendChild(numField("經驗 (exp)", "exp", 0));

    var gradeField = el("div", { class: "field" });
    gradeField.appendChild(el("label", { text: "進化階段 (grade)" }));
    var gradeSel = el("select");
    var stages = (bpetKindDef(bp.kind) || {}).stages || [];
    for (var g = 0; g <= 4; g++) {
      var gOpt = el("option", { value: g, text: g + (stages[g] ? "：" + stages[g] : "") });
      if ((bp.grade || 0) === g) gOpt.selected = true;
      gradeSel.appendChild(gOpt);
    }
    gradeSel.addEventListener("change", function () { bp.grade = Number(gradeSel.value); });
    gradeField.appendChild(gradeSel);
    grid.appendChild(gradeField);

    grid.appendChild(numField("seed（決定天賦A/AA/AAA/S，進化到第2階段才看得出來）", "seed", 0));
    grid.appendChild(numField("親密度 (closeness，滿100轉忠誠度)", "closeness", 0));
    grid.appendChild(numField("親密度計時 (closenessMs)", "closenessMs", 0));
    grid.appendChild(numField("忠誠度 (loyalty)", "loyalty", 0));
    grid.appendChild(numField("忠誠度計時 (loyaltyMs)", "loyaltyMs", 0));

    function boolField(label, key) {
      var field = el("div", { class: "field" });
      var lbl = el("label", { style: "display:flex;align-items:center;gap:6px;font-weight:400;" });
      var cb = el("input", { type: "checkbox", style: "width:auto;" });
      cb.checked = !!bp[key];
      cb.addEventListener("change", function () { bp[key] = cb.checked; });
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(label));
      field.appendChild(lbl);
      return field;
    }
    grid.appendChild(boolField("summoned（目前是否召喚在場上）", "summoned"));
    grid.appendChild(boolField("downed（是否已經倒下，等待復活）", "downed"));
    // v84 起遊戲沒有 autoRevive 了，新版存檔不顯示這個開關（勾了也沒用，還會多寫一個遊戲不認得的欄位）
    if (saveVersion() < 84) grid.appendChild(boolField("autoRevive（自動復活）", "autoRevive"));

    activeBox.appendChild(grid);

    if (!Array.isArray(bp.gear)) bp.gear = [];
    activeBox.appendChild(el("div", { class: "section-title", text: "裝備欄位", style: "margin-top:14px;" }));
    activeBox.appendChild(el("div", {
      class: "note",
      text: "戰寵只能穿自己這一系的專用裝備，所以每一格只列得出來的選項——選單已經依照部位和「" +
        (bpetKindDef(bp.kind) || {}).name + "」過濾過了。括號裡是需求等級與能力加成。",
      style: "margin-bottom:8px;",
    }));
    var gearGrid = el("div", { class: "grid" });
    (BATTLE_PET_INFO.gearSlots || []).forEach(function (slotName, idx) {
      var field = el("div", { class: "field wide" });
      field.appendChild(el("label", { text: slotName }));

      var list = bpetGearFor(idx, bp.kind);
      var sel = el("select");
      sel.appendChild(el("option", { value: "", text: "（空著）" }));
      var currentId = bpetGearItemId(bp.gear[idx]);
      list.forEach(function (g) {
        var block = bpetGearBlock(g, bp);
        var opt = el("option", {
          value: g.id,
          text: (block ? "⚠ " : "") + g.name + "（" + bpetGearReqText(g) + "／" + (bpetGearStatText(g) || "無加成") + "）",
        });
        if (currentId === g.id) opt.selected = true;
        sel.appendChild(opt);
      });
      // 存檔裡放的是選單裡沒有的東西（例如手改過的 id），補一個選項免得一打開就被改掉
      if (currentId != null && !list.some(function (g) { return g.id === currentId; })) {
        var keep = el("option", { value: String(currentId), text: "（保留原本的 #" + currentId + "）" });
        keep.selected = true;
        sel.appendChild(keep);
      }
      sel.addEventListener("change", function () {
        if (!sel.value) bp.gear[idx] = null;
        else bp.gear[idx] = bpetMakeGearEntry(c, Number(sel.value), bp.gear[idx]);
        renderBattlePet(c);
      });
      field.appendChild(sel);

      var chosen = currentId != null ? bpetGearById(currentId) : null;
      if (chosen) {
        field.appendChild(el("div", {
          class: "note",
          text: "能力：" + (bpetGearStatText(chosen) || "無加成") + "　需求：" + bpetGearReqText(chosen),
          style: "margin-top:4px;",
        }));
        var block = bpetGearBlock(chosen, bp);
        if (block) {
          field.appendChild(el("div", {
            class: "note",
            text: "⚠ 以目前的戰寵" + block + "，遊戲裡這件穿不上去（存檔還是會照寫，但進遊戲不會生效）。",
            style: "margin-top:2px;color:#d98c3f;",
          }));
        }
      }
      gearGrid.appendChild(field);
    });
    activeBox.appendChild(gearGrid);

    var toWarehouseBtn = el("button", { class: "btn btn-sm", text: "📦 收到倉庫（變成沒有出戰中的戰寵）", style: "margin-top:14px;" });
    toWarehouseBtn.addEventListener("click", function () {
      c.warehouse.battlePets.push(bp);
      c.battlePet = undefined;
      renderBattlePet(c);
    });
    activeBox.appendChild(toWarehouseBtn);

    renderWarehouseBattlePets(c);
  }

  function renderWarehouseBattlePets(c) {
    var tbody = document.querySelector("#warehouseBattlePetsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    c.warehouse.battlePets.forEach(function (bp, idx) {
      var tr = document.createElement("tr");
      var kindDef = bpetKindDef(bp.kind);
      tr.appendChild(el("td", { text: kindDef ? kindDef.name : ("#" + bp.kind) }));
      tr.appendChild(el("td", { text: "Lv" + bp.level }));
      var stages = (kindDef || {}).stages || [];
      tr.appendChild(el("td", { text: bp.grade + (stages[bp.grade] ? "：" + stages[bp.grade] : "") }));
      tr.appendChild(el("td", { text: String(bp.exp) }));
      var tdAct = document.createElement("td");
      var promoteBtn = el("button", { class: "icon-btn", text: "設為出戰" });
      promoteBtn.addEventListener("click", function () {
        if (c.battlePet) c.warehouse.battlePets.push(c.battlePet);
        c.battlePet = bp;
        c.warehouse.battlePets.splice(idx, 1);
        renderBattlePet(c);
      });
      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () {
        if (!confirm("確定要刪除這隻倉庫裡的戰寵嗎？")) return;
        c.warehouse.battlePets.splice(idx, 1);
        renderBattlePet(c);
      });
      tdAct.appendChild(promoteBtn);
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });

    var addBtn = document.getElementById("addWarehouseBattlePetBtn");
    if (addBtn) {
      addBtn.onclick = function () {
        var firstKind = BATTLE_PET_INFO.kinds[0];
        if (!firstKind) { alert("目前沒有任何戰寵種類資料"); return; }
        c.warehouse.battlePets.push(newBattlePet(firstKind));
        renderWarehouseBattlePets(c);
      };
    }
  }

  function potionPercentRow(label, getPct, setPct, currentItemId, onPickItem, what) {
    var wrap = el("div", { class: "field wide" });
    wrap.appendChild(el("label", { text: label }));
    var row = el("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap;" });
    row.appendChild(el("span", { text: (what || "生命") + "剩餘" }));
    var input = el("input", { type: "number", step: "1", min: "0", max: "100", style: "width:64px;" });
    input.value = Math.round((getPct() || 0) * 100);
    input.addEventListener("input", function () {
      var pct = input.valueAsNumber;
      if (isNaN(pct)) pct = 0;
      setPct(pct / 100);
    });
    row.appendChild(input);
    row.appendChild(el("span", { text: "% 時使用" }));
    var picker = makeItemPicker(currentItemId, onPickItem);
    picker.style.flex = "1";
    picker.style.minWidth = "180px";
    row.appendChild(picker);
    wrap.appendChild(row);
    return wrap;
  }

  function potionItemOnlyRow(label, currentItemId, onPickItem) {
    var wrap = el("div", { class: "field wide" });
    wrap.appendChild(el("label", { text: label }));
    var row = el("div", { style: "display:flex;align-items:center;gap:8px;" });
    var picker = makeItemPicker(currentItemId, onPickItem);
    picker.style.flex = "1";
    picker.style.minWidth = "180px";
    row.appendChild(picker);
    wrap.appendChild(row);
    return wrap;
  }

  function renderPotions(c) {
    var wrap = document.getElementById("potionFields");
    wrap.innerHTML = "";

    if (Array.isArray(c.potionSlots)) {
      // 新版存檔（多藥水槽）：生命值剩餘多少 % 以下時，使用對應的藥水
      c.potionSlots.forEach(function (slot, idx) {
        wrap.appendChild(potionPercentRow("藥水" + (idx + 1),
          function () { return slot.threshold; },
          function (v) { slot.threshold = v; },
          slot.itemId,
          function (id) { slot.itemId = id; }));
      });
    } else if ("potionId" in c) {
      // 舊版存檔（單一藥水 + 閾值）：生命值剩餘多少 % 以下時，自動使用藥水
      wrap.appendChild(potionPercentRow("藥水",
        function () { return c.potionThreshold; },
        function (v) { c.potionThreshold = v; },
        c.potionId,
        function (id) { c.potionId = id; }));
    }

    if (Array.isArray(c.apPotionSlots)) {
      // 新版存檔：AP 藥水也是多槽（跟血量藥水同一套結構，已由真實存檔驗證）
      c.apPotionSlots.forEach(function (slot, idx) {
        wrap.appendChild(potionPercentRow("AP藥水" + (idx + 1),
          function () { return slot.threshold; },
          function (v) { slot.threshold = v; },
          slot.itemId,
          function (id) { slot.itemId = id; }, "AP"));
      });
    } else if ("apPotionId" in c) {
      // 舊版存檔：AP 藥水只有單一物品，沒有閾值設定
      wrap.appendChild(potionItemOnlyRow("AP藥水", c.apPotionId, function (id) { c.apPotionId = id; }));
    }

    // 存檔 v51 起：戰寵自己的生命／AP 藥水槽（結構跟角色的一樣）
    [["bpetPotionSlots", "戰寵藥水", "戰寵生命"], ["bpetApPotionSlots", "戰寵AP藥水", "戰寵AP"]].forEach(function (def) {
      if (!Array.isArray(c[def[0]])) return;
      c[def[0]].forEach(function (slot, idx) {
        wrap.appendChild(potionPercentRow(def[1] + (idx + 1),
          function () { return slot.threshold; },
          function (v) { slot.threshold = v; },
          slot.itemId,
          function (id) { slot.itemId = id; }, def[2]));
      });
    });

    if (Array.isArray(c.attackSlots)) {
      // 新版存檔：自動攻擊改成陣列，每一格是 {kind:"skill"等, id:技能或攻擊ID}
      c.attackSlots.forEach(function (slot, idx) {
        wrap.appendChild(fieldNumber("攻擊技能" + (idx + 1) + "（" + (slot.kind || "?") + "）",
          function () { return slot.id; },
          function (v) { slot.id = v; }));
      });
    } else if ("attackSkillId" in c) {
      wrap.appendChild(fieldNumber("自動攻擊技能 attackSkillId", function () { return c.attackSkillId; }, function (v) { c.attackSkillId = v; }));
    }
    if ("comboSeq" in c) {
      wrap.appendChild(fieldText("連段順序 comboSeq", function () { return c.comboSeq; }, function (v) { c.comboSeq = v; }));
    }
  }

  function renderTagListFor(idKey, inputId, suggestId, tagsId, c) {
    var $input = document.getElementById(inputId);
    var $suggest = document.getElementById(suggestId);
    var $tags = document.getElementById(tagsId);

    function draw() {
      $tags.innerHTML = "";
      (c[idKey] || []).forEach(function (id, idx) {
        var tag = el("span", { class: "tag" });
        tag.appendChild(document.createTextNode(itemName(id)));
        var btn = el("button", { text: "✕" });
        btn.addEventListener("click", function () { c[idKey].splice(idx, 1); draw(); });
        tag.appendChild(btn);
        $tags.appendChild(tag);
      });
    }
    draw();

    $input.oninput = function () {
      var q = $input.value.trim();
      $suggest.innerHTML = "";
      if (!q) { $suggest.classList.remove("show"); return; }
      var matches = itemArr.filter(function (it) { return it.name.indexOf(q) !== -1; }).slice(0, 30);
      matches.forEach(function (it) {
        var row = el("div", { text: it.name + " #" + it.id });
        row.addEventListener("click", function () {
          if (!c[idKey]) c[idKey] = [];
          c[idKey].push(Number(it.id));
          $input.value = ""; $suggest.classList.remove("show");
          draw();
        });
        $suggest.appendChild(row);
      });
      $suggest.classList.toggle("show", matches.length > 0);
    };
    $input.onblur = function () { setTimeout(function () { $suggest.classList.remove("show"); }, 150); };
  }

  function renderTagLists(c) {
    renderTagListFor("seenItems", "seenItemInput", "seenItemSuggest", "seenItemTags", c);
  }

  function renderSpot(c) {
    var wrap = document.getElementById("spotFields");
    wrap.innerHTML = "";
    if (!c.spot) c.spot = { mapId: 0, targetId: 0, x: 0, y: 0 };
    var mapOptions = Object.keys(MAPS).map(function (id) { return { value: id, label: MAPS[id] + " (#" + id + ")" }; });
    wrap.appendChild(fieldSelect("地圖 mapId", mapOptions,
      function () { return String(c.spot.mapId); },
      function (v) { c.spot.mapId = Number(v); }));
    wrap.appendChild(fieldNumber("目標怪物/採集點 ID targetId", function () { return c.spot.targetId; }, function (v) { c.spot.targetId = v; }));
    wrap.appendChild(fieldNumber("座標 X", function () { return c.spot.x; }, function (v) { c.spot.x = v; }));
    wrap.appendChild(fieldNumber("座標 Y", function () { return c.spot.y; }, function (v) { c.spot.y = v; }));
  }

  // ---------- 個性化 ----------
  var INDIVIDUALITY_STAGES = window.INDIVIDUALITY_STAGES || [];
  var INDIVIDUALITY_TYPES = window.INDIVIDUALITY_TYPES || [];
  var INDIVIDUALITY_ROLLS = window.INDIVIDUALITY_ROLLS || [];
  var INDIVIDUALITY_CURVES = window.INDIVIDUALITY_CURVES || [];
  var INDIVIDUALITY_INTERVAL_BASE = window.INDIVIDUALITY_INTERVAL_BASE || 35;

  // ---- 個性化數值：照遊戲 bundle（2026-09-30 版 Tu/Pu/Fu/Iu/Ou）----
  // 存檔 attrs[].base 是「原始值」，遊戲顯示的數值＝base 套上「目前階段」的成長曲線（types[].curve）：
  //   曲線單位 1＝直接加（base + v）、2＝百分比（round(base × (100 + v) / 100)）。
  // 「每 N 等級 力量 M」的 N＝intervalBase − intervalCurve 在目前階段的值。
  // base 的合法範圍只看「這個屬性第一次出現的那個階段」的 rolls（Tu 的 baseBands）；後面階段的 rolls 是換算後的顯示範圍，
  // 不能拿來填 base——舊版修改器就是填了目前階段的上限，進遊戲再乘一次曲線，數值會暴增好幾倍。
  var INDIV_CURVE_ABSOLUTE = 1, INDIV_CURVE_PERCENT = 2, INDIV_RATE_DIVISOR = 1e5;
  var indivCurveMap = {};
  INDIVIDUALITY_CURVES.forEach(function (r) { (indivCurveMap[r[0]] = indivCurveMap[r[0]] || {})[r[1]] = { unit: r[2], value: r[3] }; });
  var indivBands = {}, indivFirstStage = {}, indivKindsByStage = {};
  INDIVIDUALITY_ROLLS.forEach(function (r) {
    var stage = r[0], kind = r[1];
    (indivKindsByStage[stage] = indivKindsByStage[stage] || {})[kind] = true;
    if (indivFirstStage[kind] === undefined || stage < indivFirstStage[kind]) { indivFirstStage[kind] = stage; indivBands[kind] = {}; }
    if (indivFirstStage[kind] === stage) indivBands[kind][r[2]] = { gradePct: r[4], min: r[5], max: r[6] };
  });
  function indivType(kind) { return INDIVIDUALITY_TYPES.find(function (x) { return x.kind === kind; }); }
  function indivCurve(curveId, stage) { return (indivCurveMap[curveId] || {})[stage] || { unit: INDIV_CURVE_ABSOLUTE, value: 0 }; }
  function indivShownValue(attr, stage) {
    var t = indivType(attr.kind);
    if (!t) return attr.base;
    var cv = indivCurve(t.curve, stage);
    return cv.unit === INDIV_CURVE_PERCENT ? Math.round(attr.base * (100 + cv.value) / 100) : attr.base + cv.value;
  }
  function indivInterval(attr, stage) {
    var t = indivType(attr.kind);
    return t && t.intervalCurve ? INDIVIDUALITY_INTERVAL_BASE - indivCurve(t.intervalCurve, stage).value : undefined;
  }
  // 跟遊戲畫面一樣的效果文字，例如「每32等級 力量10」「攻擊力1300」「HP13%」
  function indivEffectText(attr, stage) {
    var t = indivType(attr.kind);
    if (!t) return String(indivShownValue(attr, stage));
    var iv = indivInterval(attr, stage), vals = iv === undefined ? [indivShownValue(attr, stage)] : [iv, indivShownValue(attr, stage)], i = 0;
    return t.name.replace(/%d/g, function () { return String(vals[i++]); }).replace(/%%/g, "%");
  }
  // 數值欄後面的預覽：這條屬性實際讓角色多多少能力。
  // 「每 N 等級 力量 M」類要乘上角色等級（遊戲 Ru()：floor(等級 ÷ N) × M）；百分比類加上 %。
  function indivPreviewText(attr, stage, charLv) {
    var t = indivType(attr.kind);
    var name = indivTypeLabel(attr.kind).replace(/^每等級\s*/, "").replace(/%$/, "");
    var shown = indivShownValue(attr, stage);
    var iv = indivInterval(attr, stage);
    if (iv !== undefined) {
      return iv > 0 ? name + " +" + fmtNum2(Math.floor(charLv / iv) * shown) + "（Lv" + charLv + "）" : name + " +0";
    }
    var pct = t && /%%/.test(t.name);
    return name + " +" + fmtNum2(shown) + (pct ? "%" : "");
  }
  function indivUpgradeChance(stageDef, fails) {
    return stageDef.upgradeRate <= 0 ? 0 : Math.min(1, (stageDef.upgradeRate + stageDef.upgradePity * fails) / INDIV_RATE_DIVISOR);
  }

  function indivTypeLabel(kind) {
    var t = indivType(kind);
    if (!t) return "種類#" + kind;
    return t.name.replace(/%d%%/g, "%").replace(/%d/g, "").trim();
  }

  function renderIndividuality(c) {
    if (!c.individuality) c.individuality = { stage: 0, fails: 0, attrs: [], minor: { str: 0, agi: 0, int: 0, sta: 0, wis: 0, luck: 0 } };
    var ind = c.individuality;

    var stageInput = document.getElementById("indivStage");
    stageInput.value = ind.stage || 0;
    stageInput.oninput = function () { ind.stage = stageInput.valueAsNumber || 0; };
    stageInput.onchange = function () { renderIndividuality(c); };

    var failsInput = document.getElementById("indivFails");
    failsInput.value = ind.fails || 0;
    failsInput.oninput = function () { ind.fails = failsInput.valueAsNumber || 0; };

    var maxStage = INDIVIDUALITY_STAGES.length - 1;
    stageInput.max = maxStage;
    var stageDef = INDIVIDUALITY_STAGES[ind.stage] || null;
    var infoBox = document.getElementById("indivStageInfo");
    if (stageDef) {
      // 遊戲 canUpgradeIndividuality()：看的是「目前階段」的 upgradeLevel／upgradeFame（不是下一階的）；
      // 成功率＝(upgradeRate + upgradePity × 失敗次數) ÷ 100000（Ou），+5 以上每失敗一次會加一點保底。
      var infoLines = ["目前 +" + ind.stage + "：同時展現 " + stageDef.slots + " 條，展現一次花 " + fmtNum2(stageDef.revealFame) + " 名聲／條"];
      if (ind.stage < maxStage) {
        var chance = indivUpgradeChance(stageDef, ind.fails || 0);
        infoLines.push("升到 +" + (ind.stage + 1) + "：角色 Lv" + stageDef.upgradeLevel + " 以上、花 " + fmtNum2(stageDef.upgradeFame) + " 名聲，" +
          "成功率 " + (Math.round(chance * 10000) / 100) + "%" +
          (stageDef.upgradePity ? "（基本 " + (stageDef.upgradeRate / 1000) + "%，每失敗一次 +" + (stageDef.upgradePity / 1000) + "%）" : ""));
      } else {
        infoLines.push("已達最高階段 +" + maxStage);
      }
      infoBox.textContent = infoLines.join("　|　");
    } else {
      infoBox.textContent = "找不到這個階段的參考資料（stage 超出範圍 0~" + maxStage + "）";
    }

    var charLv = Number(c.level) || 1;
    var typeOptions = INDIVIDUALITY_TYPES.map(function (t) {
      var first = indivFirstStage[t.kind];
      // 遊戲展現時只會從「目前階段有出現」的種類裡抽；還沒開放的種類標出幾階才會出現
      return { value: t.kind, label: indivTypeLabel(t.kind) + (first !== undefined && first > ind.stage ? "（+" + first + " 起）" : "") };
    });

    var listWrap = document.getElementById("indivAttrsList");
    listWrap.innerHTML = "";
    // 遊戲展現時同一種屬性不會重複（revealIndividuality 會排除已經有的種類）
    var kindCount = {};
    ind.attrs.forEach(function (a) { kindCount[a.kind] = (kindCount[a.kind] || 0) + 1; });
    if (stageDef && ind.attrs.length > stageDef.slots) {
      listWrap.appendChild(el("div", {
        style: "font-size:12.5px;color:var(--orange,#d35400);margin-bottom:8px;",
        text: "⚠️ 目前 +" + ind.stage + " 正常最多展現 " + stageDef.slots + " 條，這裡有 " + ind.attrs.length + " 條。遊戲會把存檔裡的每一條都算進能力（不會因為超過條數就不生效），但正常玩不會出現這種狀況。"
      }));
    }
    ind.attrs.forEach(function (attr, idx) {
      var row = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 10px;background:var(--bg2);border-radius:6px;border:1px solid var(--border);flex-wrap:wrap;" });

      var kindSelect = el("select", { style: "flex:1;min-width:140px;" });
      typeOptions.forEach(function (o) {
        var opt = el("option", { value: o.value, text: o.label });
        if (attr.kind === o.value) opt.selected = true;
        kindSelect.appendChild(opt);
      });

      // 選種類／等級時，base 填「該屬性第一次出現階段」那個等級的上限（遊戲抽到的最好結果），進遊戲再由曲線換算成目前階段的數值
      function applyRollValue() {
        var band = (indivBands[attr.kind] || {})[attr.grade];
        if (band) attr.base = band.max;
        renderIndividuality(c);
      }

      kindSelect.addEventListener("change", function () { attr.kind = Number(kindSelect.value); applyRollValue(); });
      row.appendChild(kindSelect);

      var gradeSelect = el("select", { style: "width:70px;" });
      ["S", "A", "B"].forEach(function (g) {
        var opt = el("option", { value: g, text: g });
        if (attr.grade === g) opt.selected = true;
        gradeSelect.appendChild(opt);
      });
      gradeSelect.addEventListener("change", function () { attr.grade = gradeSelect.value; applyRollValue(); });
      row.appendChild(gradeSelect);

      // base 可以在這個等級的合法範圍內自己調（遊戲抽的時候就是在這個範圍裡隨機）
      var band = (indivBands[attr.kind] || {})[attr.grade];
      var baseInput = el("input", { type: "number", style: "width:74px;", title: "存檔裡的原始值 base" });
      baseInput.value = attr.base;
      if (band) { baseInput.min = band.min; baseInput.max = band.max; }
      // 打字時就即時更新後面的預覽（只預覽，真正寫入存檔在離開欄位時，會先限制在合法範圍內）
      baseInput.addEventListener("input", function () {
        var v = baseInput.valueAsNumber;
        if (!isFinite(v)) return;
        if (band) v = Math.max(band.min, Math.min(band.max, Math.round(v)));
        preview.textContent = "→ " + indivPreviewText({ kind: attr.kind, base: v }, ind.stage, charLv);
      });
      baseInput.addEventListener("change", function () {
        var v = baseInput.valueAsNumber;
        if (!isFinite(v)) v = band ? band.max : attr.base;
        if (band) v = Math.max(band.min, Math.min(band.max, Math.round(v)));
        attr.base = v;
        renderIndividuality(c);
      });
      row.appendChild(baseInput);
      row.appendChild(el("span", {
        style: "font-size:11.5px;color:var(--text3);white-space:nowrap;",
        text: band ? "（" + attr.grade + "：" + band.min + "～" + band.max + "）" : "（查不到這個等級的範圍）"
      }));
      var preview = el("span", {
        style: "font-size:13px;font-weight:700;color:var(--green);white-space:nowrap;",
        title: "套用目前階段 +" + ind.stage + " 的成長後，這條屬性實際增加的能力",
        text: "→ " + indivPreviewText(attr, ind.stage, charLv)
      });
      row.appendChild(preview);

      var lockLabel = el("label", { style: "display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text2);white-space:nowrap;" });
      var lockCb = el("input", { type: "checkbox" });
      lockCb.checked = !!attr.locked;
      lockCb.addEventListener("change", function () { attr.locked = lockCb.checked; });
      lockLabel.appendChild(lockCb);
      lockLabel.appendChild(document.createTextNode("鎖定"));
      row.appendChild(lockLabel);

      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () { ind.attrs.splice(idx, 1); renderIndividuality(c); });
      row.appendChild(delBtn);

      // 第二行：跟遊戲畫面一樣的效果文字（套用目前階段的曲線）；實際加多少能力看數值欄後面的預覽
      var notes = ["遊戲顯示：" + indivEffectText(attr, ind.stage)];
      var warn = [];
      if (band && (attr.base < band.min || attr.base > band.max)) {
        warn.push("base " + attr.base + " 超出 " + attr.grade + " 的正常範圍 " + band.min + "～" + band.max + "（可能是舊版修改器填的，重選一次等級就會修正）");
      }
      if (kindCount[attr.kind] > 1) warn.push("同一種屬性重複了（遊戲不會展現重複的種類）");
      row.appendChild(el("div", { style: "flex-basis:100%;font-size:12px;color:var(--text2);", text: notes.join("　・　") }));
      if (warn.length) row.appendChild(el("div", { style: "flex-basis:100%;font-size:12px;color:var(--red);", text: "⚠️ " + warn.join("；") }));

      listWrap.appendChild(row);
    });

    document.getElementById("indivAddAttrBtn").onclick = function () {
      // 預設挑目前階段遊戲抽得到、而且還沒有的種類
      var have = {};
      ind.attrs.forEach(function (a) { have[a.kind] = true; });
      var avail = INDIVIDUALITY_TYPES.filter(function (t) { return (indivKindsByStage[ind.stage] || {})[t.kind] && !have[t.kind]; });
      var kind = (avail[0] || INDIVIDUALITY_TYPES[0]).kind;
      var band = (indivBands[kind] || {}).B;
      ind.attrs.push({ kind: kind, grade: "B", base: band ? band.max : 1, locked: false });
      renderIndividuality(c);
    };

    var minorWrap = document.getElementById("indivMinorFields");
    minorWrap.innerHTML = "";
    var minorLabels = { str: "力量", agi: "敏捷", int: "智力", sta: "體力", wis: "精神", luck: "幸運" };

    function minorTotal() {
      var t = 0;
      Object.keys(minorLabels).forEach(function (k) { t += Number(ind.minor[k]) || 0; });
      return t;
    }

    var minorCapBox = document.getElementById("indivMinorCap");
    function refreshMinorCap() {
      var total = minorTotal();
      var cap = stageDef ? stageDef.minorCap : null;
      if (cap === null) {
        minorCapBox.textContent = "找不到目前階段的副屬性點數上限資料";
        minorCapBox.style.color = "var(--text3)";
        return;
      }
      var over = total > cap;
      // 遊戲 addMinorPoint()：每點該能力 +3，花 minorFame 名聲；退點每點花 minorResetFame 名聲＋minorResetGold 金幣
      minorCapBox.textContent = "已使用 " + total + " / 上限 " + cap + " 點（每點該能力 +3，加一點花 " + fmtNum2(stageDef.minorFame) + " 名聲）" +
        (over ? "　⚠️ 已超過目前階段上限" : "");
      minorCapBox.style.color = over ? "var(--red)" : "var(--text2)";
    }

    Object.keys(minorLabels).forEach(function (k) {
      minorWrap.appendChild(fieldNumber(minorLabels[k],
        function () { return ind.minor[k]; },
        function (v) { ind.minor[k] = v; refreshMinorCap(); }));
    });
    refreshMinorCap();
  }

  // ---------- 任務 ----------
  var QUESTS = window.QUESTS || {};
  var QUEST_PAGES = window.QUEST_PAGES || {};
  var MONSTER_NAMES = window.MONSTER_NAMES || {};

  function monsterName(id) { return MONSTER_NAMES[String(id)] || ("怪物#" + id); }
  function questDesc(q) {
    return "擊殺「" + monsterName(q.monsterId) + "」，繳交「" + itemName(q.itemId) + "」x" + q.count;
  }

  // 委託（quests.json）：存檔 v59 起不用接取了（activeQuests 欄位被遊戲刪掉），背包有足夠的繳交物品就能直接到委託處交，
  // 所以這裡只剩查詢，不寫存檔。
  function renderQuests(c) {

    var $town = document.getElementById("questFilterTown");
    var $page = document.getElementById("questFilterPage");
    var $quest = document.getElementById("questFilterQuest");
    var $detail = document.getElementById("questDetailBox");

    if (!$town.dataset.wired) {
      $town.dataset.wired = "1";
      var townSet = {};
      Object.keys(QUEST_PAGES).forEach(function (pid) {
        QUEST_PAGES[pid].towns.forEach(function (t) { townSet[t] = true; });
      });
      Object.keys(townSet).sort().forEach(function (t) {
        $town.appendChild(el("option", { value: t, text: t }));
      });
      Object.keys(QUEST_PAGES).forEach(function (pid) {
        $page.appendChild(el("option", { value: pid, text: QUEST_PAGES[pid].title }));
      });
    }

    function updatePageOptions() {
      var townVal = $town.value;
      Array.prototype.forEach.call($page.options, function (opt) {
        if (!opt.value) return;
        var page = QUEST_PAGES[opt.value];
        opt.hidden = !!(townVal && page.towns.indexOf(townVal) === -1);
      });
      if ($page.value && $page.options[$page.selectedIndex].hidden) $page.value = "";
    }

    function updateQuestOptions() {
      var townVal = $town.value;
      var pageVal = $page.value;
      var matchIds = Object.keys(QUESTS).filter(function (qid) {
        var q = QUESTS[qid];
        if (pageVal && String(q.pageId) !== pageVal) return false;
        if (townVal && !pageVal) {
          var page = QUEST_PAGES[String(q.pageId)];
          if (!page || page.towns.indexOf(townVal) === -1) return false;
        }
        return true;
      });
      matchIds.sort(function (a, b) { return Number(a) - Number(b); });

      $quest.innerHTML = "";
      $quest.appendChild(el("option", { value: "", text: "共 " + matchIds.length + " 筆，請選擇..." }));
      matchIds.forEach(function (qid) {
        var q = QUESTS[qid];
        $quest.appendChild(el("option", { value: qid, text: "#" + qid + "　" + questDesc(q) }));
      });
    }

    function renderDetail() {
      var qid = $quest.value;
      $detail.innerHTML = "";
      if (!qid) {
        $detail.appendChild(el("div", { class: "panel-desc", text: "選擇一筆任務查看詳細內容。" }));
        return;
      }
      var q = QUESTS[qid];
      var page = QUEST_PAGES[String(q.pageId)] || {};

      var lvRange = "Lv" + q.reqLevel + (q.reqLevelMax != null ? " ~ Lv" + q.reqLevelMax : " 以上");
      var fameRange = (q.reqFameMin || 0) + " ~ " + (q.reqFameMax != null ? q.reqFameMax : "無上限");
      var ceilingMap = { block: "封頂後鎖住整個分類", no_fame: "封頂後不再提供名聲獎勵" };
      var ceilingText = ceilingMap[page.ceilingEffect] || page.ceilingEffect || "無";

      var box = el("div", { style: "background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;" });
      box.appendChild(el("div", { style: "font-weight:700;font-size:14.5px;margin-bottom:10px;", text: "#" + qid + "　" + (page.title || "") }));
      box.appendChild(el("div", { style: "font-size:13.5px;color:var(--text2);margin-bottom:6px;", text: "任務內容：" + questDesc(q) }));

      var haveCount = (c.stacks || []).reduce(function (sum, s) { return s.itemId === q.itemId ? sum + s.count : sum; }, 0);
      var progressDone = haveCount >= q.count;
      box.appendChild(el("div", {
        style: "font-size:13.5px;margin-bottom:12px;color:" + (progressDone ? "var(--green)" : "var(--text)") + ";",
        text: "目前進度（依背包裡「" + itemName(q.itemId) + "」的數量即時計算）：" + haveCount + " / " + q.count + (progressDone ? "　✅ 已備齊" : "")
      }));

      var grid = el("div", { class: "grid" });
      [
        ["需求等級", lvRange], ["需求名聲區間", fameRange],
        ["名聲獎勵", String(q.fame)], ["經驗獎勵", String(q.exp)], ["金錢獎勵", String(q.gold)],
        ["分類名聲上限", page.fameCeiling != null ? String(page.fameCeiling) : "無"],
        ["上限效果", ceilingText],
        ["可接地點", (page.towns && page.towns.length) ? page.towns.join("、") : "未知"]
      ].forEach(function (pair) {
        var f = el("div", { class: "field" });
        f.appendChild(el("label", { text: pair[0] }));
        f.appendChild(el("div", { style: "font-size:14px;color:var(--text);", text: pair[1] }));
        grid.appendChild(f);
      });
      box.appendChild(grid);

      // 想直接完成：把繳交物品補到背包就行（委託不用接取、沒有進度欄位）
      if (!progressDone) {
        var fillBtn = el("button", { class: "btn btn-sm", type: "button", text: "🎒 把「" + itemName(q.itemId) + "」補到 " + q.count + " 個", style: "margin-top:14px;" });
        fillBtn.addEventListener("click", function () {
          setStackTotal(c, q.itemId, q.count);
          renderStacks(c);
          renderDetail();
          toast("背包的「" + itemName(q.itemId) + "」已補到 " + q.count + " 個，到委託處就能交", "ok");
        });
        box.appendChild(fillBtn);
      }

      $detail.appendChild(box);
    }

    $town.onchange = function () { updatePageOptions(); updateQuestOptions(); renderDetail(); };
    $page.onchange = function () { updateQuestOptions(); renderDetail(); };
    $quest.onchange = renderDetail;

    updatePageOptions();
    updateQuestOptions();
    renderDetail();
  }

  // ---------- 藍圖任務（missions.json，遊戲內叫「希望路線」，舊稱討伐任務）----------
  var MISSIONS = window.MISSIONS || {};
  var MISSION_TOKEN_ITEM_ID = window.MISSION_TOKEN_ITEM_ID || null;
  // kind 不是 kill 的，monsterId 不是真的怪物（遊戲 missionWhat()），要照 kind 顯示目標
  function missionTargetText(m) {
    var kind = m.kind || "kill";
    var place = m.townName ? "（" + m.townName + "）" : "";
    if (kind === "kill") return "擊殺「" + monsterName(m.monsterId) + "」x" + m.need;
    if (kind === "dungeon") return "進入副本「" + (m.dungeonName || "副本") + "」";
    if (kind === "talk") return "找「" + (m.npc || "NPC") + "」談話" + place;
    if (kind === "exchange") return "跟「" + (m.npc || "NPC") + "」交換" + place;
    if (kind === "craft") return "找「" + (m.npc || "NPC") + "」拿材料並精煉" + place;
    return kind;
  }
  function missionListText(mid, m) {
    return "#" + mid + "　Lv" + m.unlockLevel + "　" + missionTargetText(m) + (m.blocked ? "（遊戲內目前無法完成）" : "");
  }

  var DUNGEON_NAMES = window.DUNGEON_NAMES || {};

  // ---------- 副本任務組（存檔 dungeonMissionSets，v75 新增）----------
  // missions.json 裡有 set 的任務屬於某個副本（set = 副本編號），要先在遊戲的副本面板「接任務」才會計數；
  // 放棄時遊戲會把那組未完成任務的進度清掉（這裡取消勾選也照做）。
  function renderDungeonMissionSets(c) {
    var box = document.getElementById("missionSetBox");
    if (!box) return;
    box.innerHTML = "";
    var sets = {};
    Object.keys(MISSIONS).forEach(function (mid) {
      var s = MISSIONS[mid].set;
      if (s != null) (sets[s] || (sets[s] = [])).push(Number(mid));
    });
    var setIds = Object.keys(sets).map(Number).sort(function (a, b) { return a - b; });
    if (!setIds.length) { box.style.display = "none"; return; }
    box.style.display = "";
    if (!Array.isArray(c.dungeonMissionSets)) {
      box.appendChild(el("div", { class: "panel-desc", text: "這個存檔還是舊版格式（沒有 dungeonMissionSets），先用新版遊戲開過一次再匯出，才能設定副本任務。" }));
      return;
    }
    box.appendChild(el("div", { class: "section-title", text: "副本任務組（dungeonMissionSets）" }));
    var row = el("div", { style: "display:flex;flex-wrap:wrap;gap:8px 18px;margin-bottom:14px;" });
    setIds.forEach(function (s) {
      var label = el("label", { style: "display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;" });
      var cb = el("input", { type: "checkbox" });
      cb.checked = c.dungeonMissionSets.indexOf(s) !== -1;
      cb.addEventListener("change", function () {
        var idx = c.dungeonMissionSets.indexOf(s);
        if (cb.checked && idx === -1) c.dungeonMissionSets.push(s);
        if (!cb.checked && idx !== -1) {
          c.dungeonMissionSets.splice(idx, 1);
          c.missionKills = c.missionKills.filter(function (r) { return sets[s].indexOf(r[0]) === -1 || c.missionsDone.indexOf(r[0]) !== -1; });
        }
        toast((cb.checked ? "已接取" : "已放棄") + "「" + (DUNGEON_NAMES[String(s)] || s) + "」的副本任務", "ok");
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode((DUNGEON_NAMES[String(s)] || ("副本#" + s)) + "（" + sets[s].length + " 筆）"));
      row.appendChild(label);
    });
    box.appendChild(row);
  }

  // ---------- 技能寶石（存檔 gems，v69 新增；資料 data/gems.js）----------
  // 存檔格式（bundle Vu()/startGemEnchant()/unlockGemSlot()/setGemSlot()）：
  //   gems.owned  = [{uid, itemId, cells:[{symbol:"sun"|"moon"|"star"|"comet", ok:true/false}], seed}]
  //   gems.slots  = [{skillId, gemUid}]（開了幾格就有幾筆，最多 GEMS.slots.length 格）
  //   gems.nextUid
  // 寶石數值 = base + 成功格子的 sun/moon/star/comet 值；技能的 gem 種類要跟寶石 type 一樣，同技能不能兩顆同 attr。
  var GEMS = window.GEMS || null;
  var GEM_TYPE_LABEL = { attack: "攻擊", heal: "恢復", support: "輔助" };
  var GEM_SYMBOLS = [["sun", "☀ 太陽"], ["moon", "☾ 月亮"], ["star", "★ 星星"], ["comet", "☄ 彗星"]];
  function gemValue(g) {
    var d = GEMS && GEMS.defs[String(g.itemId)];
    if (!d) return "?";
    return (g.cells || []).reduce(function (s, cell) { return s + (cell.ok ? (d[cell.symbol] || 0) : 0); }, d.base || 0);
  }
  function allSkillsById() {
    var out = {};
    Object.keys(SKILLS).forEach(function (jobId) { SKILLS[jobId].forEach(function (s) { out[s.id] = s; }); });
    return out;
  }
  function renderGems(c) {
    var wrap = document.getElementById("gemPanelBody");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!GEMS) { wrap.appendChild(el("div", { class: "panel-desc", text: "找不到技能寶石資料（data/gems.js），請重新執行 update_data.py。" })); return; }
    if (!c.gems || typeof c.gems !== "object") {
      wrap.appendChild(el("div", { class: "panel-desc", text: "這個存檔還沒有技能寶石欄位（舊版格式）。先用新版遊戲開過一次再匯出。" }));
      return;
    }
    var gems = c.gems;
    if (!Array.isArray(gems.owned)) gems.owned = [];
    if (!Array.isArray(gems.slots)) gems.slots = [];
    if (typeof gems.nextUid !== "number") gems.nextUid = gems.owned.reduce(function (m, g) { return Math.max(m, g.uid + 1); }, 1);
    var cellsMax = (GEMS.enchant && GEMS.enchant.cells) || 10;
    var skillById = allSkillsById();
    var gemSkills = Object.keys(skillById).map(function (k) { return skillById[k]; }).filter(function (s) { return s.gem; });

    // --- 寶石位置 ---
    wrap.appendChild(el("div", { class: "section-title", text: "寶石位置（已開 " + gems.slots.length + " / " + GEMS.slots.length + "）" }));
    var slotTable = el("table", { class: "etable" });
    slotTable.innerHTML = "<thead><tr><th>位置</th><th>開啟條件</th><th>技能</th><th>寶石</th></tr></thead>";
    var tb = el("tbody");
    gems.slots.forEach(function (slot, idx) {
      var tr = el("tr");
      var need = GEMS.slots[idx] || {};
      tr.appendChild(el("td", { text: "第 " + (idx + 1) + " 格" }));
      tr.appendChild(el("td", { text: "Lv" + (need.minLevel || "?") }));
      var skSel = el("select");
      skSel.appendChild(el("option", { value: "", text: "（未指定技能）" }));
      var learned = {};
      (c.skills || []).forEach(function (p) { learned[p[0]] = true; });
      gemSkills.slice().sort(function (a, b) { return (learned[b.id] ? 1 : 0) - (learned[a.id] ? 1 : 0); }).forEach(function (s) {
        var o = el("option", { value: s.id, text: s.name + "（" + (GEM_TYPE_LABEL[s.gem] || s.gem) + "）" + (learned[s.id] ? "" : "・未學") });
        if (slot.skillId === s.id) o.selected = true;
        skSel.appendChild(o);
      });
      skSel.addEventListener("change", function () {
        slot.skillId = skSel.value ? Number(skSel.value) : null;
        var g = gems.owned.find(function (x) { return x.uid === slot.gemUid; });
        var sk = skillById[slot.skillId];
        if (g && (!sk || (GEMS.defs[String(g.itemId)] || {}).type !== sk.gem)) slot.gemUid = null;  // 種類不合，遊戲也會卸下
        renderGems(c);
      });
      var tdS = el("td"); tdS.appendChild(skSel); tr.appendChild(tdS);
      var gemSel = el("select");
      gemSel.appendChild(el("option", { value: "", text: "（空）" }));
      var sk = skillById[slot.skillId];
      gems.owned.forEach(function (g) {
        var d = GEMS.defs[String(g.itemId)] || {};
        if (sk && d.type !== sk.gem) return;
        var usedElsewhere = gems.slots.some(function (s2, j) { return j !== idx && s2.gemUid === g.uid; });
        if (usedElsewhere) return;
        var o = el("option", { value: g.uid, text: itemName(g.itemId) + "（數值 " + gemValue(g) + "）" });
        if (slot.gemUid === g.uid) o.selected = true;
        gemSel.appendChild(o);
      });
      gemSel.disabled = !slot.skillId;
      gemSel.addEventListener("change", function () { slot.gemUid = gemSel.value ? Number(gemSel.value) : null; });
      var tdG = el("td"); tdG.appendChild(gemSel); tr.appendChild(tdG);
      tb.appendChild(tr);
    });
    slotTable.appendChild(tb);
    wrap.appendChild(slotTable);
    var slotBtns = el("div", { class: "form-row", style: "margin-top:8px;" });
    var addSlot = el("button", { class: "btn btn-sm btn-accent", text: "➕ 開一格" });
    addSlot.disabled = gems.slots.length >= GEMS.slots.length;
    addSlot.addEventListener("click", function () { gems.slots.push({ skillId: null, gemUid: null }); renderGems(c); });
    var delSlot = el("button", { class: "btn btn-sm btn-danger", text: "➖ 關掉最後一格" });
    delSlot.disabled = !gems.slots.length;
    delSlot.addEventListener("click", function () { gems.slots.pop(); renderGems(c); });
    slotBtns.appendChild(addSlot); slotBtns.appendChild(delSlot);
    wrap.appendChild(slotBtns);

    // --- 擁有的寶石 ---
    wrap.appendChild(el("div", { class: "section-title", style: "margin-top:20px;", text: "已開始強化的寶石（" + gems.owned.length + " 顆）" }));
    gems.owned.forEach(function (g) {
      var d = GEMS.defs[String(g.itemId)] || {};
      var card = el("div", { style: "background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:10px;" });
      var head = el("div", { style: "display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;" });
      head.appendChild(el("b", { text: itemName(g.itemId) }));
      head.appendChild(el("span", { class: "note", text: "uid " + g.uid + "・" + (GEM_TYPE_LABEL[d.type] || d.type || "?") + "・目前數值 " + gemValue(g) + "（基礎 " + (d.base || 0) + "）" }));
      var del = el("button", { class: "btn btn-sm btn-danger", text: "🗑 刪除" });
      del.addEventListener("click", function () {
        gems.owned = gems.owned.filter(function (x) { return x !== g; });
        gems.slots.forEach(function (s) { if (s.gemUid === g.uid) s.gemUid = null; });
        renderGems(c);
      });
      head.appendChild(del);
      card.appendChild(head);
      var cellsRow = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;" });
      if (!Array.isArray(g.cells)) g.cells = [];
      for (var i = 0; i < cellsMax; i++) {
        (function (i) {
          var cell = g.cells[i];
          var sel = el("select", { style: "width:auto;" });
          sel.appendChild(el("option", { value: "", text: (i + 1) + ". 未強化" }));
          var failsBefore = g.cells.slice(0, i).filter(function (x) { return !x.ok; }).length;
          var cometOk = failsBefore >= ((GEMS.enchant && GEMS.enchant.cometAfterFails) || cellsMax);
          GEM_SYMBOLS.forEach(function (sym) {
            if (sym[0] === "comet" && !cometOk && !(cell && cell.symbol === "comet")) return;  // 遊戲：累計失敗夠多格才能選彗星，而且必成功
            [true, false].forEach(function (ok) {
              if (sym[0] === "comet" && !ok) return;
              var v = sym[0] + ":" + (ok ? "1" : "0");
              var o = el("option", { value: v, text: (i + 1) + ". " + sym[1] + (ok ? " 成功 +" + (d[sym[0]] || 0) : " 失敗") });
              if (cell && cell.symbol === sym[0] && !!cell.ok === ok) o.selected = true;
              sel.appendChild(o);
            });
          });
          sel.disabled = i > g.cells.length;  // 只能一格一格往後填，遊戲的 cells 是依序的陣列
          sel.addEventListener("change", function () {
            if (!sel.value) { g.cells = g.cells.slice(0, i); }
            else { var p = sel.value.split(":"); g.cells[i] = { symbol: p[0], ok: p[1] === "1" }; }
            renderGems(c);
          });
          cellsRow.appendChild(sel);
        })(i);
      }
      card.appendChild(cellsRow);
      var quick = el("div", { class: "form-row", style: "margin-top:8px;" });
      var best = GEM_SYMBOLS.map(function (s) { return s[0]; }).filter(function (s) { return s !== "comet"; })
        .sort(function (a, b) { return (d[b] || 0) - (d[a] || 0); })[0];
      // 彗星要累計失敗 cometAfterFails 格才能選，所以「最高」是每格都選數值最大的太陽／月亮／星星並成功
      var maxBtn = el("button", { class: "btn btn-sm", text: "⚡ 全部填滿（" + cellsMax + " 格都選數值最高的並成功）" });
      maxBtn.addEventListener("click", function () {
        g.cells = [];
        for (var k = 0; k < cellsMax; k++) g.cells.push({ symbol: best, ok: true });
        renderGems(c);
      });
      quick.appendChild(maxBtn);
      card.appendChild(quick);
      wrap.appendChild(card);
    });
    var addRow = el("div", { class: "form-row", style: "margin-top:8px;" });
    var gemPick = el("select");
    gemPick.appendChild(el("option", { value: "", text: "選一種技能寶石新增..." }));
    Object.keys(GEMS.defs).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (id) {
      var d = GEMS.defs[id];
      gemPick.appendChild(el("option", { value: id, text: itemName(id) + "（" + (GEM_TYPE_LABEL[d.type] || d.type) + "）" }));
    });
    var addGem = el("button", { class: "btn btn-sm btn-accent", text: "➕ 新增寶石" });
    addGem.addEventListener("click", function () {
      if (!gemPick.value) { toast("請先選寶石種類", "warn"); return; }
      var newGem = { uid: gems.nextUid, itemId: Number(gemPick.value), cells: [], seed: Math.floor(Math.random() * 4294967295) };
      if (saveVersion() >= 85) newGem.locked = false; // v85 起每顆寶石都有 locked（上鎖），遊戲升級存檔時也是全部補 false
      gems.owned.push(newGem);
      gems.nextUid++;
      renderGems(c);
    });
    addRow.appendChild(gemPick); addRow.appendChild(addGem);
    wrap.appendChild(addRow);
    wrap.appendChild(el("div", { class: "note", style: "margin-top:8px;", text: "寶石本身是背包裡的道具，放進「強化」之後才會變成這裡的一顆（遊戲 startGemEnchant 會從背包扣掉一個）。這裡新增不會動到背包。seed 是遊戲用來決定之後強化結果的亂數種子。" }));
  }

  // ---------- 鑲嵌石（2026-10-08 改版新增）----------
  // 存檔 stones：四顆石頭各一筆 { attrs:[{kind,value}], changes }，changes 是「還剩幾次變更」。
  // 這個面板只顯示目前的能力，唯一會動到存檔的是把變更次數補回上限。
  var STONES = window.STONES || null;
  function stoneAttrText(a) {
    var k = (STONES.kinds || {})[String(a.kind)];
    return (k ? k.name : "能力 #" + a.kind) + " " + (a.value > 0 ? "+" : "") + a.value + (k && k.pct ? "%" : "");
  }
  function renderStones(c) {
    var wrap = document.getElementById("stonePanelBody");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!STONES) { wrap.appendChild(el("div", { class: "panel-desc", text: "找不到鑲嵌石資料（data/stones.js），請重新執行 update_data.py。" })); return; }
    if (!Array.isArray(c.stones) || !c.stones.length) {
      wrap.appendChild(el("div", { class: "panel-desc", text: "這個存檔還沒有鑲嵌石（舊版格式）。先用新版遊戲開過一次再匯出。" }));
      return;
    }
    var cap = STONES.changeCap || 300;
    var isFull = function (s) { return (s.changes || 0) >= cap; };
    var refill = function (s) { s.changes = cap; };

    var allBtn = el("button", { class: "btn", text: "🔄 四顆全部補滿變更次數" });
    allBtn.disabled = c.stones.every(isFull);
    allBtn.addEventListener("click", function () {
      c.stones.forEach(refill);
      renderStones(c);
      toast("四顆石頭的變更次數都補回 " + cap + " 次", "ok");
    });
    wrap.appendChild(allBtn);

    c.stones.forEach(function (s, idx) {
      var attrs = Array.isArray(s.attrs) ? s.attrs : [];
      var name = (STONES.names || [])[idx] || ("第 " + (idx + 1) + " 顆");
      wrap.appendChild(el("div", { class: "section-title", text: name + " +" + attrs.length }));
      if (!attrs.length) {
        wrap.appendChild(el("div", { class: "panel-desc", style: "margin:0 0 8px;", text: "還沒強化。" }));
      } else {
        var table = el("table", { class: "etable" });
        table.innerHTML = "<thead><tr><th style=\"width:70px;\">階</th><th>能力</th></tr></thead>";
        var tb = el("tbody");
        attrs.forEach(function (a, i) {
          tb.appendChild(el("tr", null, [el("td", { text: "+" + (i + 1) }), el("td", { text: stoneAttrText(a) })]));
        });
        table.appendChild(tb);
        wrap.appendChild(table);
      }
      var row = el("div", { style: "display:flex;align-items:center;gap:12px;margin-top:10px;font-size:13px;" });
      row.appendChild(el("span", { text: "變更次數　" + (s.changes || 0) + " / " + cap }));
      var btn = el("button", { class: "btn btn-sm", text: "補滿" });
      btn.disabled = isFull(s);
      btn.addEventListener("click", function () {
        refill(s);
        renderStones(c);
        toast(name + " 的變更次數補回 " + cap + " 次", "ok");
      });
      row.appendChild(btn);
      wrap.appendChild(row);
    });
  }

  function renderDungeon(c) {
    if (!c.dungeon || typeof c.dungeon !== "object") c.dungeon = { day: 0, used: {} };
    if (!c.dungeon.used || typeof c.dungeon.used !== "object") c.dungeon.used = {};
    if (!Array.isArray(c.dungeonHistory)) c.dungeonHistory = [];

    var wrap = document.getElementById("dungeonBasicFields");
    wrap.innerHTML = "";
    wrap.appendChild(fieldNumber(
      "day（進場次數計算用的天數編號）",
      function () { return c.dungeon.day || 0; },
      function (v) { c.dungeon.day = v; }
    ));
    // v44／v59 新增的副本設定（v59 把「倒下就結束」的是否改成「倒下幾次就結束」，0 = 不會因倒下結束）
    wrap.appendChild(fieldCheckbox("清完全部房間才離開 dungeonClearAll",
      function () { return c.dungeonClearAll; }, function (v) { c.dungeonClearAll = v; }));
    wrap.appendChild(fieldNumber("倒下幾次就結束 dungeonEndDowns（0＝不結束）",
      function () { return c.dungeonEndDowns || 0; }, function (v) { c.dungeonEndDowns = Math.max(0, Math.floor(v)); }));

    document.getElementById("dungeonHistoryCount").textContent = "(" + c.dungeonHistory.length + " 筆)";

    var resetBtn = document.getElementById("dungeonResetUsedBtn");
    resetBtn.onclick = function () {
      c.dungeon.used = {};
      toast("已清空今日已用的副本進場次數", "ok");
    };
    var clearBtn = document.getElementById("dungeonClearHistoryBtn");
    clearBtn.onclick = function () {
      if (!confirm("確定要清空全部副本紀錄嗎？此動作無法復原。")) return;
      c.dungeonHistory = [];
      renderDungeon(c);
      toast("已清空副本紀錄", "ok");
    };
  }

  function renderMissions(c) {
    if (!Array.isArray(c.missionsDone)) c.missionsDone = [];
    if (!Array.isArray(c.missionKills)) c.missionKills = [];
    renderDungeonMissionSets(c);

    function getKillCount(mid) {
      var entry = c.missionKills.find(function (row) { return row[0] === Number(mid); });
      return entry ? entry[1] : 0;
    }
    function setKillCount(mid, val) {
      var mNum = Number(mid);
      var entry = c.missionKills.find(function (row) { return row[0] === mNum; });
      if (val <= 0) {
        if (entry) c.missionKills.splice(c.missionKills.indexOf(entry), 1);
        return;
      }
      if (entry) entry[1] = val;
      else c.missionKills.push([mNum, val]);
    }

    var $level = document.getElementById("missionFilterLevel");
    var $monster = document.getElementById("missionFilterMonster");
    var $detail = document.getElementById("missionDetailBox");

    if (!$level.dataset.wired) {
      $level.dataset.wired = "1";
      var levelSet = {};
      Object.keys(MISSIONS).forEach(function (mid) { levelSet[MISSIONS[mid].unlockLevel] = true; });
      Object.keys(levelSet).map(Number).sort(function (a, b) { return a - b; }).forEach(function (lv) {
        $level.appendChild(el("option", { value: String(lv), text: "Lv" + lv }));
      });
    }

    function updateMonsterOptions() {
      var lvVal = $level.value;
      var matchIds = Object.keys(MISSIONS).filter(function (mid) {
        if (lvVal && String(MISSIONS[mid].unlockLevel) !== lvVal) return false;
        return true;
      });
      matchIds.sort(function (a, b) { return Number(a) - Number(b); });

      $monster.innerHTML = "";
      $monster.appendChild(el("option", { value: "", text: "共 " + matchIds.length + " 筆，請選擇..." }));
      matchIds.forEach(function (mid) {
        var m = MISSIONS[mid];
        var done = c.missionsDone.indexOf(Number(mid)) !== -1;
        $monster.appendChild(el("option", {
          value: mid, text: (done ? "✅ " : "") + missionListText(mid, m)
        }));
      });
    }

    function renderDetail() {
      var mid = $monster.value;
      $detail.innerHTML = "";
      if (!mid) {
        $detail.appendChild(el("div", { class: "panel-desc", text: "選擇一筆藍圖任務查看詳細內容。" }));
        return;
      }
      var m = MISSIONS[mid];
      var box = el("div", { style: "background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;" });
      box.appendChild(el("div", { style: "font-weight:700;font-size:14.5px;margin-bottom:10px;", text: "#" + mid }));
      box.appendChild(el("div", { style: "font-size:13.5px;color:var(--text2);margin-bottom:6px;", text: "任務內容：" + missionTargetText(m) }));
      if (m.blocked) {
        box.appendChild(el("div", { style: "font-size:13px;color:var(--red);margin-bottom:6px;", text: "⚠️ 這筆在遊戲裡目前無法完成（不計進度、不能領獎），勾成已完成也拿不到獎勵。" }));
      }

      var killRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13.5px;" });
      killRow.appendChild(el("span", { text: ((m.kind || "kill") === "kill" ? "目前擊殺進度" : "目前進度（達到需求數就算做完，可以去領獎）") + "（格式為 [[任務ID, 進度], ...]）：" }));
      var killInput = el("input", { type: "number", min: "0", max: String(m.need), style: "width:70px;" });
      killInput.value = getKillCount(mid);
      killInput.addEventListener("input", function () {
        var v = killInput.valueAsNumber;
        if (isNaN(v) || v < 0) v = 0;
        setKillCount(mid, v);
      });
      killRow.appendChild(killInput);
      killRow.appendChild(el("span", { style: "color:var(--text3);", text: " / " + m.need }));
      box.appendChild(killRow);

      var rows = [
        ["解鎖等級", "Lv" + m.unlockLevel],
        ["需求數量", String(m.need)],
        ["經驗獎勵", String(m.exp)],
        ["金錢獎勵", String(m.gold)],
      ];
      if (m.fame) rows.push(["名聲獎勵", String(m.fame)]);
      if (m.token) {
        rows.push(["代幣獎勵", (MISSION_TOKEN_ITEM_ID ? itemName(MISSION_TOKEN_ITEM_ID) : "代幣") + " x" + m.token]);
      }
      if (m.reward) {
        rows.push(["額外獎勵物品", itemName(m.reward) + " x" + (m.rewardCount || 1)]);
      }

      var grid = el("div", { class: "grid" });
      rows.forEach(function (pair) {
        var f = el("div", { class: "field" });
        f.appendChild(el("label", { text: pair[0] }));
        f.appendChild(el("div", { style: "font-size:14px;color:var(--text);", text: pair[1] }));
        grid.appendChild(f);
      });
      box.appendChild(grid);

      var checkLabel = el("label", { style: "display:flex;align-items:center;gap:8px;margin-top:16px;font-size:13.5px;cursor:pointer;" });
      var cb = el("input", { type: "checkbox" });
      cb.checked = c.missionsDone.indexOf(Number(mid)) !== -1;
      cb.addEventListener("change", function () {
        var mNum = Number(mid);
        var idx = c.missionsDone.indexOf(mNum);
        if (cb.checked && idx === -1) c.missionsDone.push(mNum);
        else if (!cb.checked && idx !== -1) c.missionsDone.splice(idx, 1);
        updateMonsterOptions();
        $monster.value = mid; // 重建選單後把目前選的這筆留住
        renderDoneList();
      });
      checkLabel.appendChild(cb);
      checkLabel.appendChild(document.createTextNode("此藍圖任務算已完成、獎勵已領（missionsDone，任務 ID 陣列）"));
      box.appendChild(checkLabel);

      $detail.appendChild(box);
    }

    function renderDoneList() {
      var $list = document.getElementById("missionDoneList");
      $list.innerHTML = "";
      if (!c.missionsDone.length) {
        $list.appendChild(el("div", { class: "panel-desc", text: "目前沒有已完成的藍圖任務。" }));
        return;
      }
      c.missionsDone.slice().sort(function (a, b) { return a - b; }).forEach(function (mNum) {
        var m = MISSIONS[String(mNum)];
        var chip = el("div", {
          style: "display:inline-flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--accent);" +
            "border-radius:20px;padding:6px 12px;margin:0 8px 8px 0;font-size:12.5px;cursor:pointer;"
        });
        chip.textContent = m ? missionListText(mNum, m) : ("#" + mNum + "（找不到資料）");
        chip.addEventListener("click", function () {
          if (!m) return;
          $level.value = "";
          updateMonsterOptions();
          $monster.value = String(mNum);
          renderDetail();
        });
        $list.appendChild(chip);
      });
    }

    $level.onchange = function () { updateMonsterOptions(); renderDetail(); };
    $monster.onchange = renderDetail;

    updateMonsterOptions();
    renderDetail();
    renderDoneList();
  }

  // ---------- 每日任務（daily.json，存檔 v53 新增 characters[].daily）----------
  // 存檔格式（遊戲 zv()／issueDaily()）：
  //   daily = { day, cards:[{questId, count, accepted, claimed}], kills, swapsLeft, milestonesClaimed, rngState }
  //   day 是「台灣時間早上 6 點換日」的天數編號（遊戲 pg()：floor((時間 - 22 小時) / 24 小時)，UTC 22:00 換日）；
  //   開遊戲時 day 不是今天就會重新發卡（上一天完成沒領的會自動領掉，day=0 代表從來沒發過、不會補領）。
  //   進度：擊殺卡 = daily.kills - card.count（接取當下記住 kills，之後打的才算）；其他卡 = card.count。
  var DAILY = window.DAILY || { rules: {}, milestones: [], quests: [] };
  var DAILY_BY_ID = {};
  DAILY.quests.forEach(function (q) { DAILY_BY_ID[q.id] = q; });
  var DAILY_TIER_NAMES = ["SSS", "SS", "S", "A", "B", "C"];
  var DAILY_KIND_LABEL = { kill: "擊殺", fish: "釣魚", feed: "餵寵物", refine: "寶石強化", smelt: "找雷分解" };
  function dailyToday() { return Math.floor((Date.now() - 22 * 36e5) / (24 * 36e5)); }
  function dailyQuestLabel(q) {
    if (!q) return "（找不到資料）";
    var what = q.kind === "kill" ? "擊殺等級差 " + ((DAILY.rules || {}).levelWindow || 25) + " 內的怪（角色 Lv" + q.minLevel + "~" + q.maxLevel + " 的卡）"
      : q.kind === "fish" && q.mapId != null ? "在〔" + (MAPS[String(q.mapId)] || ("地圖#" + q.mapId)) + "〕釣魚"
      : (DAILY_KIND_LABEL[q.kind] || q.kind);
    return "[" + (DAILY_TIER_NAMES[q.tier] || q.tier) + "] " + what + " ×" + q.need + "　→ R代幣 ×" + q.token + (q.exp ? "、經驗 " + fmtNum2(q.exp) : "");
  }
  function dailyProgress(d, card) {
    var q = DAILY_BY_ID[card.questId];
    if (!q || !card.accepted) return 0;
    var r = q.kind === "kill" ? d.kills - card.count : card.count;
    return Math.max(0, Math.min(q.need, r));
  }
  function dailySetProgress(d, card, v) {
    var q = DAILY_BY_ID[card.questId];
    if (!q) return;
    v = Math.max(0, Math.min(q.need, Math.floor(v) || 0));
    card.accepted = true;
    if (q.kind === "kill") {
      if (d.kills < v) d.kills = v;
      card.count = d.kills - v;
    } else {
      card.count = v;
    }
  }

  function renderDaily(c) {
    var wrap = document.getElementById("dailyEditor");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!DAILY.quests.length) {
      wrap.appendChild(el("div", { class: "panel-desc", text: "目前沒有每日任務資料（data/daily.js 是空的，請重新執行 update_data.py）。" }));
      return;
    }
    if (!c.daily || typeof c.daily !== "object") c.daily = { day: 0, cards: [], kills: 0, swapsLeft: 0, milestonesClaimed: 0, rngState: 0 };
    var d = c.daily;
    if (!Array.isArray(d.cards)) d.cards = [];
    var rules = DAILY.rules || {};
    var today = dailyToday();

    var info = el("div", { style: "font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.8;" });
    info.textContent = "存檔裡的天數編號 day = " + d.day + "，今天是 " + today + "。" +
      (d.day === 0 ? "（還沒發過卡，進遊戲會發今天的卡）" : d.day === today ? "（是今天的卡，改下面的內容會直接生效）"
        : "（不是今天的卡：進遊戲會先自動領掉已完成的，再發今天的新卡，所以改下面的卡沒有意義）");
    wrap.appendChild(info);

    var grid = el("div", { class: "grid" });
    grid.appendChild(fieldNumber("今天累計擊殺數 kills（擊殺卡的進度用）", function () { return d.kills || 0; },
      function (v) { d.kills = Math.max(0, Math.floor(v)); drawCards(); }));
    grid.appendChild(fieldNumber("剩餘換卡次數 swapsLeft（每天 " + (rules.swapsPerDay || 10) + " 次）", function () { return d.swapsLeft || 0; },
      function (v) { d.swapsLeft = Math.max(0, Math.floor(v)); }));
    grid.appendChild(fieldNumber("已領幾個禮物盒 milestonesClaimed（共 " + (DAILY.milestones || []).length + " 個）", function () { return d.milestonesClaimed || 0; },
      function (v) { d.milestonesClaimed = Math.max(0, Math.min((DAILY.milestones || []).length, Math.floor(v))); }));
    wrap.appendChild(grid);

    var btnRow = el("div", { class: "form-row", style: "margin:12px 0;" });
    var doneAll = el("button", { class: "btn btn-accent btn-sm", type: "button", text: "✅ 全部接取並做完（進遊戲按領取）" });
    doneAll.addEventListener("click", function () {
      d.cards.forEach(function (card) {
        var q = DAILY_BY_ID[card.questId];
        if (q && !card.claimed) dailySetProgress(d, card, q.need);
      });
      drawCards();
      toast("每張未領的卡都已接取並做完", "ok");
    });
    var swapReset = el("button", { class: "btn btn-sm", type: "button", text: "🔄 換卡次數補滿" });
    swapReset.addEventListener("click", function () {
      d.swapsLeft = rules.swapsPerDay || 10;
      renderDaily(c);
      toast("換卡次數已補滿", "ok");
    });
    var reissue = el("button", { class: "btn btn-sm", type: "button", text: "🎲 清空，讓遊戲重新發今天的卡" });
    reissue.addEventListener("click", function () {
      if (!confirm("清空目前的卡片（沒領的獎勵不會補發），進遊戲會重新發一組今天的卡。確定嗎？")) return;
      c.daily = { day: 0, cards: [], kills: 0, swapsLeft: 0, milestonesClaimed: 0, rngState: d.rngState || 0 };
      renderDaily(c);
      toast("已清空，進遊戲會重新發卡", "ok");
    });
    btnRow.appendChild(doneAll); btnRow.appendChild(swapReset); btnRow.appendChild(reissue);
    wrap.appendChild(btnRow);

    var table = el("table", { class: "etable" });
    table.innerHTML = '<thead><tr><th style="width:44%">任務卡</th><th>進度</th><th>已接取</th><th>已領獎</th></tr></thead>';
    var tbody = el("tbody");
    table.appendChild(tbody);
    wrap.appendChild(table);

    function drawCards() {
      tbody.innerHTML = "";
      if (!d.cards.length) {
        var tr0 = el("tr");
        tr0.appendChild(el("td", { colspan: "4", text: "目前沒有任務卡（進遊戲會自動發）。" }));
        tbody.appendChild(tr0);
        return;
      }
      d.cards.forEach(function (card) {
        var q = DAILY_BY_ID[card.questId];
        var tr = el("tr");

        // 換成別張卡：同種類（擊殺／雜務）的都可以選
        var tdQ = el("td");
        var sel = el("select", { style: "width:100%;" });
        DAILY.quests.filter(function (x) { return !q || (x.kind === "kill") === (q.kind === "kill"); }).forEach(function (x) {
          var opt = el("option", { value: String(x.id), text: dailyQuestLabel(x) });
          if (x.id === card.questId) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener("change", function () {
          card.questId = Number(sel.value);
          card.count = 0; card.accepted = false; card.claimed = false;
          drawCards();
        });
        tdQ.appendChild(sel);
        tr.appendChild(tdQ);

        var tdP = el("td");
        var pin = el("input", { type: "number", min: "0", max: String(q ? q.need : 0), style: "width:70px;" });
        pin.value = dailyProgress(d, card);
        pin.addEventListener("change", function () { dailySetProgress(d, card, pin.valueAsNumber); drawCards(); });
        tdP.appendChild(pin);
        tdP.appendChild(document.createTextNode(" / " + (q ? q.need : "?")));
        tr.appendChild(tdP);

        [["accepted", function (v) {
          card.accepted = v;
          if (v && q && q.kind === "kill") card.count = d.kills; // 跟遊戲接取時一樣，從現在的擊殺數開始算
          if (!v) card.count = 0;
        }], ["claimed", function (v) { card.claimed = v; }]].forEach(function (def) {
          var td = el("td");
          var cb = el("input", { type: "checkbox" });
          cb.checked = !!card[def[0]];
          cb.addEventListener("change", function () { def[1](cb.checked); drawCards(); });
          td.appendChild(cb);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    drawCards();
  }

  // ---------- 隊伍 ----------
  // 隊伍（遊戲 recruit()，存檔 v61 格式）：
  //   party    = 隊友的 sourceId（= 對方角色 id）陣列，最多 5 人
  //   allyBook = 名冊 [{snapshot, settings?}]，snapshot 是對方角色自己的 snapshot 複製一份；
  //              讀檔時 party 裡找不到名冊的 id 會被遊戲丟掉，所以兩邊要一起寫
  var PARTY_MAX = 5;
  function renderParty(c) {
    if (!Array.isArray(c.party)) c.party = [];
    if (!Array.isArray(c.allyBook)) c.allyBook = [];
    // 舊版修改器曾經把整份快照塞進 party，遊戲讀檔會丟掉；這裡順手修成 id + 名冊
    c.party = c.party.map(function (m) {
      if (m && typeof m === "object" && m.sourceId) {
        if (!c.allyBook.some(function (b) { return b.snapshot && b.snapshot.sourceId === m.sourceId; })) c.allyBook.push({ snapshot: m });
        return m.sourceId;
      }
      return m;
    }).filter(function (id, i, arr) { return typeof id === "string" && arr.indexOf(id) === i; });

    function bookEntry(id) { return c.allyBook.find(function (b) { return b.snapshot && b.snapshot.sourceId === id; }); }
    function snapJobLabel(s) { var j = s && (s.currentJobId || s.jobId); return (j && JOB_NAME[j]) || j || ""; }

    var $list = document.getElementById("partyMemberList");
    var $select = document.getElementById("partyAddSelect");
    var $btn = document.getElementById("partyAddBtn");

    $list.innerHTML = "";
    if (!c.party.length) {
      $list.appendChild(el("div", { class: "panel-desc", text: "目前隊伍是空的。" }));
    } else {
      c.party.forEach(function (id, idx) {
        var s = (bookEntry(id) || {}).snapshot;
        var row = el("div", {
          style: "display:flex;align-items:center;gap:12px;background:var(--bg2);border:1px solid var(--border);" +
            "border-radius:6px;padding:10px 14px;margin-bottom:8px;"
        });
        row.appendChild(el("div", {
          style: "flex:1;font-size:13.5px;",
          text: s ? (s.name + "　Lv" + s.level + "　" + snapJobLabel(s) + (s.stats ? "　ATK " + s.stats.atk + " / DEF " + s.stats.def : ""))
            : ("（名冊裡找不到 " + id + "，遊戲讀檔會自動移除）")
        }));
        var delBtn = el("button", { class: "icon-btn", text: "✕", title: "移出隊伍（名冊保留）" });
        delBtn.addEventListener("click", function () {
          c.party.splice(idx, 1);
          renderParty(c);
        });
        row.appendChild(delBtn);
        $list.appendChild(row);
      });
    }

    $select.innerHTML = "";
    var others = saveData.characters.filter(function (other) { return other.id !== c.id; });
    if (!others.length) {
      $select.appendChild(el("option", { value: "", text: "（存檔裡沒有其他角色）" }));
      $btn.disabled = true;
    } else {
      $select.appendChild(el("option", { value: "", text: "選擇要加入的角色..." }));
      others.forEach(function (other) {
        var jid = currentJobOf(other);
        $select.appendChild(el("option", { value: other.id, text: other.name + "　Lv" + other.level + "　" + (JOB_NAME[jid] || jid) }));
      });
      $btn.disabled = false;
    }

    $btn.onclick = function () {
      var targetId = $select.value;
      if (!targetId) { toast("請先選擇要加入隊伍的角色", "warn"); return; }
      var target = saveData.characters.find(function (ch) { return ch.id === targetId; });
      if (!target || !target.snapshot) { toast("找不到該角色的快照資料，可能還沒存過檔", "err"); return; }
      var inParty = c.party.indexOf(targetId) !== -1;
      if (!inParty && c.party.length >= PARTY_MAX) { toast("隊伍最多 " + PARTY_MAX + " 個隊友", "warn"); return; }

      var snapshotCopy = JSON.parse(JSON.stringify(target.snapshot));
      snapshotCopy.sourceId = targetId;
      var entry = bookEntry(targetId);
      if (entry) entry.snapshot = snapshotCopy; // 保留原本的 settings（隊友的藥水設定等）
      else c.allyBook.push({ snapshot: snapshotCopy });
      if (!inParty) c.party.push(targetId);
      toast(inParty ? "已更新「" + target.name + "」的快照" : "已將「" + target.name + "」加入隊伍", "ok");
      renderParty(c);
    };
  }

  // ---------- 發條強化 ----------
  var ENCHANT_KINDS = window.ENCHANT_KINDS || [];
  var ENCHANT_GRADES = window.ENCHANT_GRADES || [];
  var ENCHANT_VALUE_RANGES = window.ENCHANT_VALUE_RANGES || {};
  var ENCHANT_VALUES = window.ENCHANT_VALUES || {}; // 每個區間（含權重），用來列出「遊戲實際洗得到的數字」
  var WIND_SLOTS = window.WIND_SLOTS || [];          // 遊戲只允許這幾個部位上發條
  // 已由玩家實測確認：這 6 種「每級XX」屬性，數字代表「每N級才加點」，所以數字越小越強。
  // 加幾點看 unit：1 = 每 N 級 +1、2 = 每 N 級 +2（XG 以上的力量／敏捷／智力／幸運）
  var REVERSED_PER_LEVEL_KINDS = [15, 16, 17, 18, 19, 20];
  var ENCHANT_PERCENT_KINDS = [13, 14, 23];
  function enchantKindLabel(kind, name) {
    return REVERSED_PER_LEVEL_KINDS.indexOf(kind) !== -1 ? name + "（數字越小越強）" : name;
  }
  function enchantUnitText(kind, unit) {
    if (unit) return "每 N 級 +" + (unit === 2 ? 2 : 1);
    return ENCHANT_PERCENT_KINDS.indexOf(kind) !== -1 ? "%" : "";
  }
  // 這個階級、這種屬性遊戲會洗出來的固定數字（例如 XG 力量只會有 10/8/6/4）；是連續區間就回傳 null
  function enchantDiscreteValues(gradeStr, kind) {
    var tiers = ENCHANT_VALUES[gradeStr + "-" + kind] || [];
    if (!tiers.length || !tiers.every(function (t) { return t.min === t.max; })) return null;
    return tiers.map(function (t) { return t.min; }).sort(function (a, b) { return a - b; });
  }

  function renderEnchant(c) {
    var $slot = document.getElementById("enchantFilterSlot");
    var $item = document.getElementById("enchantFilterItem");
    var $detail = document.getElementById("enchantDetailBox");

    if (!$slot.dataset.wired) {
      $slot.dataset.wired = "1";
      Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
        var cannotWind = WIND_SLOTS.length && WIND_SLOTS.indexOf(slotKey) === -1;
        $slot.appendChild(el("option", { value: slotKey, text: EQUIP_SLOTS[slotKey] + (cannotWind ? "（遊戲不能上發條）" : "") }));
      });
    }

    function updateItemOptions() {
      var slotVal = $slot.value;
      $item.innerHTML = "";
      if (!slotVal) {
        $item.disabled = true;
        $item.appendChild(el("option", { value: "", text: "請先選擇部位..." }));
        return;
      }
      var matches = c.stacks.filter(function (stack) {
        var it = ITEMS[String(stack.itemId)];
        return it && it.slot === slotVal;
      });
      $item.disabled = matches.length === 0;
      if (!matches.length) {
        $item.appendChild(el("option", { value: "", text: "背包裡沒有這個部位的裝備" }));
        return;
      }
      $item.appendChild(el("option", { value: "", text: "共 " + matches.length + " 件，請選擇..." }));
      matches.forEach(function (stack) {
        var it = ITEMS[String(stack.itemId)];
        $item.appendChild(el("option", { value: stack.id, text: it.name + "（Stack " + stack.id + "）" }));
      });
    }

    function buildOptionRow(opt, idx, optsObj, gradeValStr) {
      var row = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;" });

      var kindSelect = el("select", { style: "flex:1;min-width:140px;" });
      ENCHANT_KINDS.forEach(function (k) {
        // 這個階級洗不出來的屬性標出來（目前選的那個就算洗不出來也保留，不然會被偷偷換掉）
        var possible = !!ENCHANT_VALUE_RANGES[gradeValStr + "-" + k.kind];
        var o = el("option", { value: k.kind, text: enchantKindLabel(k.kind, k.name) + (possible ? "" : "（這個階級洗不出來）") });
        if (!possible && opt.kind !== k.kind) o.disabled = true;
        if (opt.kind === k.kind) o.selected = true;
        kindSelect.appendChild(o);
      });
      kindSelect.addEventListener("change", function () {
        opt.kind = Number(kindSelect.value);
        var range = ENCHANT_VALUE_RANGES[gradeValStr + "-" + opt.kind];
        if (range) {
          opt.unit = range.unit;
          // 換種類後，原本的數值可能超出新種類的合法範圍，直接夾住
          opt.value = Math.max(range.min, Math.min(range.max, opt.value));
        }
        renderDetail();
      });
      row.appendChild(kindSelect);

      var range = ENCHANT_VALUE_RANGES[gradeValStr + "-" + opt.kind];
      var valueInput = el("input", {
        type: "number", value: opt.value, style: "width:90px;",
        min: range ? String(range.min) : "", max: range ? String(range.max) : ""
      });
      valueInput.addEventListener("input", function () {
        opt.value = valueInput.valueAsNumber || 0; // 打字過程先不強制夾住，避免打到一半被打斷
      });
      valueInput.addEventListener("change", function () {
        // 打完離開輸入框時，強制夾在合法範圍內（已由玩家實測回報過打出「每200級+1力量」這種離譜數值，現在直接鎖死）
        if (range) {
          var v = valueInput.valueAsNumber;
          if (isNaN(v)) v = range.min;
          v = Math.max(range.min, Math.min(range.max, v));
          opt.value = v;
          valueInput.value = v;
        }
      });
      row.appendChild(valueInput);

      var isReversed = REVERSED_PER_LEVEL_KINDS.indexOf(opt.kind) !== -1;
      // 單位跟著「這個階級」的資料走：同樣是力量，G/DG 是每 N 級 +1，XG/SG 是每 N 級 +2
      if (range && opt.unit !== range.unit) opt.unit = range.unit;
      var discrete = enchantDiscreteValues(gradeValStr, opt.kind);
      var unitText = range ? enchantUnitText(opt.kind, range.unit) : "";
      var hintSpan = el("span", { style: "font-size:12px;color:var(--text3);" });
      function refreshHint() {
        hintSpan.textContent = range
          ? ((isReversed ? "＝每 " + opt.value + " 級 +" + (range.unit === 2 ? 2 : 1) + "　" : "") +
             "許可範圍：" + range.min + " ~ " + range.max + (unitText && !isReversed ? unitText : "") +
             (isReversed ? "（數字越小越強）" : "") +
             (discrete ? "　遊戲只會洗出：" + discrete.join("、") : "") +
             "　（超過會自動修正回邊界值）")
          : "此等級查無這個屬性的範圍資料，暫不限制輸入";
      }
      refreshHint();
      valueInput.addEventListener("input", refreshHint);
      valueInput.addEventListener("change", refreshHint);
      row.appendChild(hintSpan);

      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () {
        optsObj.options.splice(idx, 1);
        renderDetail();
      });
      row.appendChild(delBtn);

      return row;
    }

    function renderDetail() {
      var stackId = $item.value;
      $detail.innerHTML = "";
      if (!stackId) {
        $detail.appendChild(el("div", { class: "panel-desc", text: "選擇一件裝備來編輯發條強化。" }));
        return;
      }
      var stack = c.stacks.find(function (s) { return s.id === Number(stackId); });
      if (!stack) return;
      var stackItem = ITEMS[String(stack.itemId)];
      if (WIND_SLOTS.length && stackItem && WIND_SLOTS.indexOf(stackItem.slot) === -1) {
        $detail.appendChild(el("div", {
          class: "panel-desc",
          style: "color:var(--yellow);margin:0 0 10px;",
          text: "⚠️ 遊戲裡這個部位不能上發條（只有 " + WIND_SLOTS.map(function (s) { return EQUIP_SLOTS[s] || s; }).join("、") +
            " 可以）。硬改的話屬性一樣會生效，但這是遊戲裡不可能出現的裝備。"
        }));
      }
      if (!stack.options) {
        // 只是打開來看，不要偷偷幫它加上發條資料；按下按鈕才真的寫進存檔
        var emptyBox = el("div", { class: "item-preview-box" });
        emptyBox.appendChild(el("div", { class: "ip-name", text: itemName(stack.itemId) + "（Stack " + stack.id + "）" }));
        emptyBox.appendChild(el("div", { style: "margin-bottom:10px;", text: "這件裝備還沒上過發條。" }));
        var startBtn = el("button", { class: "btn btn-accent btn-sm", text: "🔮 開始編輯（先設為 N 階）" });
        startBtn.addEventListener("click", function () {
          stack.options = { grade: 1, options: [] };
          renderDetail();
        });
        emptyBox.appendChild(startBtn);
        $detail.appendChild(emptyBox);
        return;
      }
      var opts = stack.options;
      if (!Array.isArray(opts.options)) opts.options = [];

      var box = el("div", { style: "background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;" });
      box.appendChild(el("div", { style: "font-weight:700;font-size:14.5px;margin-bottom:10px;", text: itemName(stack.itemId) + "（Stack " + stack.id + "）" }));

      var gradeRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:13px;" });
      gradeRow.appendChild(el("span", { text: "發條強化等級：" }));
      var gradeSelect = el("select", {});
      // 已由真實存檔驗證：options.grade 是從 1 開始數（1=N, 2=G, 3=DG, 4=XG, 5=SG），
      // 跟 ENCHANT_GRADES 陣列的索引（0開始）差了 1，這裡選單的 value 直接用「已存檔的那個數字」，
      // 不要再額外做 +1/-1 轉換，避免又搞混。
      ENCHANT_GRADES.forEach(function (g, gidx) {
        var gradeNum = gidx + 1;
        var o = el("option", { value: String(gradeNum), text: g });
        if ((opts.grade || 1) === gradeNum) o.selected = true;
        gradeSelect.appendChild(o);
      });
      gradeSelect.addEventListener("change", function () {
        opts.grade = Number(gradeSelect.value);
        // 換等級後，每條屬性的合法範圍會跟著變，既有數值要重新夾一次
        opts.options.forEach(function (opt) {
          var r = ENCHANT_VALUE_RANGES[gradeSelect.value + "-" + opt.kind];
          if (r) {
            opt.value = Math.max(r.min, Math.min(r.max, opt.value));
            // 階級換了，單位也要跟著換（例如 DG→XG 的力量從「每 N 級 +1」變「每 N 級 +2」），不然存檔會是遊戲洗不出來的組合
            opt.unit = r.unit;
          }
        });
        renderDetail();
      });
      gradeRow.appendChild(gradeSelect);
      box.appendChild(gradeRow);

      // 2026-09-22 改版：用「武爾坎努斯的發條」洗完後，舊的那組會暫存在 stack.pendingPrev，
      // 遊戲會要玩家在「新的／上一組」之間選一組，選之前不能再上發條。這裡改的是「新的」那組（stack.options），
      // 如果進遊戲選了「上一組」，這裡的修改就會被蓋掉，所以提供一鍵清掉暫存（等於直接選「新的」）。
      if (stack.pendingPrev) {
        var pendingRow = el("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;padding:8px 10px;border:1px dashed var(--border);border-radius:6px;font-size:12.5px;" });
        var prevGrade = ENCHANT_GRADES[(stack.pendingPrev.grade || 1) - 1] || stack.pendingPrev.grade;
        var prevKinds = (stack.pendingPrev.options || []).map(function (o) {
          var k = ENCHANT_KINDS.find(function (x) { return x.kind === o.kind; });
          return (k ? k.name : "kind" + o.kind) + " " + o.value;
        }).join("、") || "沒有選項";
        pendingRow.appendChild(el("span", { text: "⚠️ 這件裝備還在等遊戲裡選「新的／上一組」。上一組：" + prevGrade + "（" + prevKinds + "）。下面改的是「新的」那組。" }));
        var clearPendingBtn = el("button", { class: "btn", text: "清掉上一組（直接採用下面這組）" });
        clearPendingBtn.addEventListener("click", function () {
          delete stack.pendingPrev;
          renderDetail();
        });
        pendingRow.appendChild(clearPendingBtn);
        box.appendChild(pendingRow);
      }

      var listWrap = el("div", {});
      opts.options.forEach(function (opt, idx) {
        listWrap.appendChild(buildOptionRow(opt, idx, opts, gradeSelect.value));
      });
      box.appendChild(listWrap);

      if (opts.options.length < 3) {
        var addBtn = el("button", { class: "btn btn-accent btn-sm", text: "➕ 新增一條屬性", style: "margin-top:10px;" });
        addBtn.addEventListener("click", function () {
          var defKind = ENCHANT_KINDS[0].kind;
          var range = ENCHANT_VALUE_RANGES[gradeSelect.value + "-" + defKind];
          opts.options.push({ kind: defKind, value: range ? range.min : 0, unit: range ? range.unit : 0 });
          renderDetail();
        });
        box.appendChild(addBtn);
      } else {
        box.appendChild(el("div", { style: "font-size:12px;color:var(--text3);margin-top:6px;", text: "最多 3 條屬性（已由真實存檔驗證）。" }));
      }

      $detail.appendChild(box);
    }

    $slot.onchange = function () { updateItemOptions(); renderDetail(); };
    $item.onchange = renderDetail;


    updateItemOptions();
    renderDetail();
  }

  // ---------- 鑑定（跟發條強化是完全不同的系統，公式反推自遊戲原始程式碼）----------
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
    superior: [60000, 100000, 160000, 250000, 320000, 59000, 34000, 17000],
    reroll: [130000, 240000, 0, 310000, 270000, 20000, 20000, 10000]
  };
  var APPR_SKILL_IDS = { basic: 101, advanced: 323, superior: 324, meticulous: 352, superMeticulous: 354 };
  var APPR_EXTRA_CHANCE = { meticulous: 0.3, superMeticulous: 0.7 };
  var APPR_THRESH = { base: 0.1, perLv: 0.0008, perRefine: 0.02, cap: 0.5 };

  function apprKindName(kind) { return APPR_KIND_NAMES[kind] || ("種類#" + kind); }

  function apprCategory(item) {
    var slot = item.slot;
    // 遊戲原始碼用的是裝備自己的 magicJob 旗標判斷是不是魔法武器，我們資料裡沒有這個欄位，
    // 用「這件武器本身有沒有魔法力數值」當替代判斷依據（絕大多數情況會一致）。
    var isMagicWeapon = (item.magic || 0) > 0;
    if (slot === "weapon") return isMagicWeapon ? "magicWeapon" : "weapon";
    if (slot === "feet") return "shoes";
    if (slot === "head" || slot === "body" || slot === "legs" || slot === "shield") return "armor";
    return "accessory";
  }

  function apprThreshold(minLv, refine) {
    var n = APPR_THRESH.base + (minLv || 0) * APPR_THRESH.perLv + (refine || 0) * APPR_THRESH.perRefine;
    return Math.min(APPR_THRESH.cap, n);
  }

  function apprSkillLevel(c, skillId) {
    var found = (c.skills || []).find(function (p) { return p[0] === skillId; });
    return found ? found[1] : 0;
  }
  function apprRollTierName(c) {
    if (apprSkillLevel(c, APPR_SKILL_IDS.superior) > 0) return "superior";
    if (apprSkillLevel(c, APPR_SKILL_IDS.advanced) > 0) return "advanced";
    return "basic";
  }
  function apprExtraChance(c) {
    if (apprSkillLevel(c, APPR_SKILL_IDS.superMeticulous) > 0) return APPR_EXTRA_CHANCE.superMeticulous;
    if (apprSkillLevel(c, APPR_SKILL_IDS.meticulous) > 0) return APPR_EXTRA_CHANCE.meticulous;
    return 0;
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

  function performAppraisal(c, item, stack) {
    var category = apprCategory(item);
    var candidates = APPR_FF[category] || [];
    var n = apprThreshold(item.minLv, stack.refine);
    var tierName = apprRollTierName(c);
    var extraChance = apprExtraChance(c);
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
      if (tier !== 0) result.push({ kind: kind, value: tier * weight / 5, unit: 0 });
    });
    return result;
  }

  function renderAppraisal(c) {
    var $box = document.getElementById("apprModeBox");
    var $gachaBtn = document.getElementById("apprModeGachaBtn");
    var $manualBtn = document.getElementById("apprModeManualBtn");

    function equipStacks() {
      return c.stacks.filter(function (s) { var it = ITEMS[String(s.itemId)]; return it && it.slot; });
    }

    function applyResult(stack, result) {
      stack.appraisal = result.length > 0 ? result : undefined;
      stack.unidentified = undefined;
      stack.apprTries = (stack.apprTries || 0) + 1;
    }

    function renderGachaMode() {
      $box.innerHTML = "";
      var pickRow = el("div", { class: "equip-filter" });
      var itemField = el("div", { class: "ef-field ef-long" });
      itemField.appendChild(el("label", { text: "選擇要鑑定的裝備" }));
      var itemSelect = el("select", {});
      itemSelect.appendChild(el("option", { value: "", text: "請選擇..." }));
      equipStacks().forEach(function (s) {
        itemSelect.appendChild(el("option", { value: s.id, text: itemName(s.itemId) + "（Stack " + s.id + "）" }));
      });
      itemField.appendChild(itemSelect);
      pickRow.appendChild(itemField);
      $box.appendChild(pickRow);

      var resultBox = el("div", { style: "margin-top:14px;" });
      $box.appendChild(resultBox);

      var lastResult = null;

      function renderResult(stack, item) {
        resultBox.innerHTML = "";
        var tierName = apprRollTierName(c);
        var extraChance = apprExtraChance(c);
        var tierLabelMap = { basic: "鑑定道具（基礎）", advanced: "高級鑑定", superior: "高級道具鑑定（最佳）" };
        resultBox.appendChild(el("div", {
          style: "font-size:12.5px;color:var(--text3);margin-bottom:10px;",
          text: "目前使用的鑑定等級：" + (tierLabelMap[tierName] || tierName) +
            "　追加鑑定機率：" + (extraChance * 100).toFixed(0) + "%" +
            "　（依角色目前的鑑定技能等級自動判斷）"
        }));

        var rollBtn = el("button", { class: "btn btn-accent", text: "🎲 抽一次（不限次數）" });
        var applyBtn = el("button", { class: "btn", text: "✅ 套用這個結果", style: "margin-left:8px;" });
        applyBtn.disabled = true;
        rollBtn.addEventListener("click", function () {
          lastResult = performAppraisal(c, item, stack);
          applyBtn.disabled = false;
          renderPreview();
        });
        applyBtn.addEventListener("click", function () {
          if (!lastResult) return;
          applyResult(stack, lastResult);
          toast("已套用鑑定結果到「" + itemName(stack.itemId) + "」", "ok");
          lastResult = null;
          applyBtn.disabled = true;
          renderPreview();
        });

        var btnRow = el("div", { style: "margin-bottom:12px;" });
        btnRow.appendChild(rollBtn);
        btnRow.appendChild(applyBtn);
        resultBox.appendChild(btnRow);

        var previewBox = el("div", { id: "apprGachaPreview" });
        resultBox.appendChild(previewBox);

        function renderPreview() {
          previewBox.innerHTML = "";
          if (!lastResult) {
            previewBox.appendChild(el("div", { class: "panel-desc", text: "按上面的按鈕抽一次看看結果。" }));
            return;
          }
          if (!lastResult.length) {
            previewBox.appendChild(el("div", { style: "color:var(--text3);font-size:13px;", text: "這次沒有鑑定出任何附加屬性。" }));
            return;
          }
          lastResult.forEach(function (r) {
            previewBox.appendChild(el("div", {
              style: "background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:13.5px;",
              text: apprKindName(r.kind) + "　" + (r.value > 0 ? "+" : "") + r.value
            }));
          });
        }
        renderPreview();
      }

      itemSelect.addEventListener("change", function () {
        resultBox.innerHTML = "";
        lastResult = null;
        var stackId = itemSelect.value;
        if (!stackId) return;
        var stack = c.stacks.find(function (s) { return s.id === Number(stackId); });
        var item = ITEMS[String(stack.itemId)];
        renderResult(stack, item);
      });
    }

    function renderManualMode() {
      $box.innerHTML = "";
      var pickRow = el("div", { class: "equip-filter" });
      var itemField = el("div", { class: "ef-field ef-long" });
      itemField.appendChild(el("label", { text: "選擇要鑑定的裝備" }));
      var itemSelect = el("select", {});
      itemSelect.appendChild(el("option", { value: "", text: "請選擇..." }));
      equipStacks().forEach(function (s) {
        itemSelect.appendChild(el("option", { value: s.id, text: itemName(s.itemId) + "（Stack " + s.id + "）" }));
      });
      itemField.appendChild(itemSelect);
      pickRow.appendChild(itemField);
      $box.appendChild(pickRow);

      var editBox = el("div", { style: "margin-top:14px;" });
      $box.appendChild(editBox);

      itemSelect.addEventListener("change", function () {
        editBox.innerHTML = "";
        var stackId = itemSelect.value;
        if (!stackId) return;
        var stack = c.stacks.find(function (s) { return s.id === Number(stackId); });
        var item = ITEMS[String(stack.itemId)];
        var category = apprCategory(item);
        var candidates = APPR_FF[category] || [];

        // 同一種類不可能在真正的鑑定結果裡重複出現（遊戲用集合去選種類），這裡也用同樣的邏輯擋掉重複選項
        function usedKinds(excludeIdx) {
          var set = {};
          lines.forEach(function (l, i) { if (i !== excludeIdx) set[l.kind] = true; });
          return set;
        }
        function nextUnusedKind(excludeIdx) {
          var used = usedKinds(excludeIdx);
          var found = candidates.find(function (pair) { return !used[pair[0]]; });
          return found ? found[0] : candidates[0][0];
        }

        var lines = (stack.appraisal || []).map(function (r) { return { kind: r.kind, value: r.value }; });
        // 去重：如果既有資料本身就有重複（例如之前的 bug 產生的），載入時先清掉多餘的重複條目
        (function dedupeInitial() {
          var seen = {};
          for (var i = lines.length - 1; i >= 0; i--) {
            if (seen[lines[i].kind]) lines.splice(i, 1);
            else seen[lines[i].kind] = true;
          }
        })();
        if (!lines.length) lines.push({ kind: candidates[0][0], value: 0 });

        var countRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px;" });
        countRow.appendChild(el("span", { text: "屬性條數：" }));
        var countInput = el("input", { type: "number", min: "0", max: String(candidates.length), value: String(lines.length), style: "width:60px;" });
        countRow.appendChild(countInput);
        countRow.appendChild(el("span", { style: "color:var(--text3);", text: "（這件裝備所屬分類最多有 " + candidates.length + " 種可能屬性，同一種類不能重複選）" }));
        editBox.appendChild(countRow);

        var linesWrap = el("div", {});
        editBox.appendChild(linesWrap);

        function renderLines() {
          linesWrap.innerHTML = "";
          lines.forEach(function (line, idx) {
            var row = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;" });
            var used = usedKinds(idx); // 排除自己這一列，得到「其他列已經用掉」的種類
            var kindSelect = el("select", { style: "flex:1;min-width:120px;" });
            candidates.forEach(function (pair) {
              var isTaken = !!used[pair[0]] && pair[0] !== line.kind;
              var o = el("option", { value: pair[0], text: apprKindName(pair[0]) + (isTaken ? "（已被其他條使用）" : "") });
              if (line.kind === pair[0]) o.selected = true;
              if (isTaken) o.disabled = true;
              kindSelect.appendChild(o);
            });
            kindSelect.addEventListener("change", function () {
              line.kind = Number(kindSelect.value);
              renderLines();
            });
            row.appendChild(kindSelect);

            var curPair = candidates.find(function (p) { return p[0] === line.kind; }) || candidates[0];
            var range = apprValueRange(curPair[1]);
            var valInput = el("input", {
              type: "number", value: line.value, style: "width:80px;",
              min: String(range.min), max: String(range.max)
            });
            valInput.addEventListener("input", function () { line.value = valInput.valueAsNumber || 0; });
            valInput.addEventListener("change", function () {
              var v = valInput.valueAsNumber;
              if (isNaN(v)) v = 0;
              v = Math.max(range.min, Math.min(range.max, v));
              line.value = v;
              valInput.value = v;
            });
            row.appendChild(valInput);
            row.appendChild(el("span", { style: "font-size:12px;color:var(--text3);", text: "許可範圍：" + range.min + " ~ " + range.max }));
            var delBtn = el("button", { class: "icon-btn", text: "✕" });
            delBtn.addEventListener("click", function () {
              lines.splice(idx, 1);
              countInput.value = lines.length;
              renderLines();
            });
            row.appendChild(delBtn);
            linesWrap.appendChild(row);
          });
        }
        renderLines();

        countInput.addEventListener("change", function () {
          var target = Math.max(0, Math.min(candidates.length, countInput.valueAsNumber || 0));
          while (lines.length < target) lines.push({ kind: nextUnusedKind(-1), value: 0 });
          while (lines.length > target) lines.pop();
          countInput.value = target;
          renderLines();
        });

        var applyBtn = el("button", { class: "btn btn-accent", text: "✅ 套用到這件裝備", style: "margin-top:10px;" });
        applyBtn.addEventListener("click", function () {
          // 送出前再檢查一次有沒有重複種類（正常情況下拉選單已經擋掉了，這裡是最後一道保險）
          var seen = {};
          for (var i = 0; i < lines.length; i++) {
            if (seen[lines[i].kind]) { toast("有重複的屬性種類，請先修正", "err"); return; }
            seen[lines[i].kind] = true;
          }
          var result = lines.map(function (l) { return { kind: l.kind, value: l.value, unit: 0 }; });
          applyResult(stack, result);
          toast("已套用手動鑑定結果到「" + itemName(stack.itemId) + "」", "ok");
        });
        editBox.appendChild(applyBtn);
      });
    }

    $gachaBtn.onclick = function () {
      $gachaBtn.classList.add("btn-accent"); $manualBtn.classList.remove("btn-accent");
      renderGachaMode();
    };
    $manualBtn.onclick = function () {
      $manualBtn.classList.add("btn-accent"); $gachaBtn.classList.remove("btn-accent");
      renderManualMode();
    };
    $box.innerHTML = '<div class="panel-desc">選擇上面其中一個模式開始。</div>';
  }

  // ---------- 進階（推測格式）欄位 ----------
  var RAW_FIELDS = [
    { key: "offlineHistory", label: "離線紀錄 offlineHistory", confidence: "mid", note: "只是歷史紀錄，通常不需要編輯，格式已由真實存檔驗證。" },
    { key: "rngState", label: "亂數種子 rngState", confidence: "mid", note: "單一整數，用於決定連線後的隨機結果，建議不要隨意更動。" }
  ];

  // 自動販賣保留清單 sellKeep：陣列，每一項是 [物品ID, 保留數量]。
  // 保留數量代表「背包裡最多留這麼多個，超過的部分會自動賣掉」，輸入 0 就是這個物品全數自動賣出。
  // 不在這份清單裡的物品，代表永遠不會被自動賣掉。
  function renderSellKeepField(c) {
    var wrap = document.getElementById("sellKeepField");
    wrap.innerHTML = "";

    var box = el("div", { class: "raw-field" });
    var title = el("div", { class: "fname" });
    title.appendChild(document.createTextNode("自動販賣保留清單 sellKeep　"));
    title.appendChild(el("span", { class: "conf-badge mid", text: "格式推測" }));
    box.appendChild(title);
    box.appendChild(el("div", {
      class: "note",
      text: "清單裡的物品，背包數量超過「保留數量」的部分會被自動賣掉；輸入 0 代表這個物品全數自動賣出。不在清單裡的物品則永遠不會被自動賣掉。"
    }));

    if (!Array.isArray(c.sellKeep)) c.sellKeep = [];

    var searchInput = el("input", {
      type: "text", placeholder: "輸入關鍵字搜尋物品名稱...",
      style: "width:100%;max-width:280px;margin-bottom:12px;"
    });
    box.appendChild(searchInput);

    var list = el("div", { style: "display:flex;flex-direction:column;gap:8px;" });
    box.appendChild(list);

    function renderList() {
      var q = searchInput.value.trim();
      list.innerHTML = "";
      if (c.sellKeep.length === 0) {
        list.appendChild(el("div", { class: "note", text: "目前清單是空的（所有物品都不會被自動賣掉）。" }));
        return;
      }
      var filtered = q ? c.sellKeep.filter(function (entry) { return itemName(entry[0]).indexOf(q) !== -1; }) : c.sellKeep;
      if (filtered.length === 0) {
        list.appendChild(el("div", { class: "note", text: "沒有符合「" + q + "」的物品。" }));
        return;
      }
      filtered.forEach(function (entry) {
        var row = el("div", {
          style: "display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;flex-wrap:wrap;"
        });

        var nameSpan = el("span", { style: "flex:1;min-width:140px;font-size:13px;" });
        nameSpan.textContent = itemName(entry[0]) + "　#" + entry[0];
        row.appendChild(nameSpan);

        row.appendChild(el("span", { class: "note", text: "保留數量", style: "margin:0;" }));
        var qtyInput = el("input", {
          type: "number", min: "0", step: "1", style: "width:90px;",
          title: "輸入 0 代表這個物品全數自動賣出", placeholder: "0 = 全數自動賣出"
        });
        qtyInput.value = entry[1] < 0 ? 0 : entry[1];
        qtyInput.addEventListener("input", function () {
          var v = qtyInput.valueAsNumber;
          entry[1] = isNaN(v) || v < 0 ? 0 : Math.floor(v);
        });
        row.appendChild(qtyInput);

        var delBtn = el("button", { class: "icon-btn", text: "✕", title: "從清單移除" });
        delBtn.addEventListener("click", function () {
          c.sellKeep.splice(c.sellKeep.indexOf(entry), 1);
          renderList();
        });
        row.appendChild(delBtn);

        list.appendChild(row);
      });
    }

    searchInput.addEventListener("input", renderList);
    renderList();

    wrap.appendChild(box);
  }

  function renderRawFields(c) {
    renderSellKeepField(c);
    var wrap = document.getElementById("rawFields");
    wrap.innerHTML = "";
    RAW_FIELDS.forEach(function (f) {
      var box = el("div", { class: "raw-field" });
      var title = el("div", { class: "fname" });
      title.appendChild(document.createTextNode(f.label + "　"));
      title.appendChild(el("span", { class: "conf-badge " + f.confidence, text: f.confidence === "low" ? "格式未知" : "格式推測" }));
      box.appendChild(title);
      box.appendChild(el("div", { class: "note", text: f.note }));

      var ta = el("textarea", { class: "raw" });
      ta.value = JSON.stringify(c[f.key] !== undefined ? c[f.key] : null, null, 2);
      ta.addEventListener("change", function () {
        try {
          c[f.key] = JSON.parse(ta.value);
          ta.style.borderColor = "var(--green)";
          toast(f.label + " 已更新", "ok");
        } catch (err) {
          ta.style.borderColor = "var(--red)";
          toast(f.label + " JSON 格式錯誤", "err");
        }
      });
      box.appendChild(ta);
      wrap.appendChild(box);
    });
  }

  // ---------- JSON 編輯器面板 ----------
  function syncJsonEditor() {
    document.getElementById("jsonEditor").value = JSON.stringify(saveData, null, 2);
  }
  document.getElementById("syncJsonBtn").addEventListener("click", function () {
    if (!saveData) { toast("請先載入存檔", "warn"); return; }
    syncJsonEditor();
    toast("已從目前資料重新同步", "ok");
  });
  document.getElementById("formatJsonBtn").addEventListener("click", function () {
    var ta = document.getElementById("jsonEditor");
    try {
      var parsed = JSON.parse(ta.value);
      ta.value = JSON.stringify(parsed, null, 2);
    } catch (err) {
      toast("格式化失敗：JSON 語法錯誤", "err");
    }
  });
  document.getElementById("applyJsonBtn").addEventListener("click", function () {
    var ta = document.getElementById("jsonEditor");
    try {
      var parsed = JSON.parse(ta.value);
      if (!parsed || !Array.isArray(parsed.characters)) throw new Error("缺少 characters 陣列");
      saveData = parsed;
      if (currentCharIndex >= saveData.characters.length) currentCharIndex = 0;
      renderAll();
      toast("已套用 JSON 編輯", "ok");
    } catch (err) {
      toast("套用失敗：" + err.message, "err");
    }
  });

  // ---------- 匯出 ----------
  function findInvalidPetsAcrossAllCharacters() {
    var problems = [];
    saveData.characters.forEach(function (c) {
      (c.pets || []).forEach(function (pet) {
        var r = checkPetRequirement(pet, c);
        if (!r.lvOk || !r.fameOk) {
          var parts = [];
          if (!r.lvOk) parts.push("等級不足（目前 " + (c.level || 0) + " / 需要 " + r.def.lv + "）");
          if (!r.fameOk) parts.push("累計名聲不足（目前 " + ((c.fame && c.fame.total) || 0) + " / 需要 " + r.def.fame + "）");
          problems.push("・角色「" + c.name + "」的「" + petName(pet.id) + "」：" + parts.join("、"));
        }
      });
    });
    return problems;
  }

  function doExport() {
    saveData.characters.forEach(function (c) { c.savedAt = Date.now(); });
    var blob = new Blob([JSON.stringify(saveData)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var base = originalFileName.replace(/\.json$/i, "");
    a.href = url;
    a.download = base + "-modified.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("已匯出存檔檔案", "ok");
  }

  document.getElementById("exportBtn").addEventListener("click", function () {
    if (!saveData) return;

    if (petsTouched) {
      var problems = findInvalidPetsAcrossAllCharacters();
      if (problems.length) {
        var old = document.getElementById("centerModalOverlay");
        if (old) old.remove();
        var overlay = el("div", { id: "centerModalOverlay", class: "modal-overlay show" });
        var box = el("div", { class: "modal-box" });
        box.appendChild(el("div", { style: "font-weight:700;font-size:16px;color:var(--red);margin-bottom:10px;", text: "⚠️ 存檔內有寵物未達出戰條件" }));
        var msgEl = el("div", { style: "font-size:13px;color:var(--text2);line-height:1.8;white-space:pre-line;max-height:260px;overflow-y:auto;" });
        msgEl.textContent = problems.join("\n") + "\n\n這些寵物在遊戲裡不會顯示出戰按鈕。建議先修改後再匯出，或確認可以接受再繼續。";
        box.appendChild(msgEl);
        var row = el("div", { style: "display:flex;gap:10px;margin-top:16px;" });
        var backBtn = el("button", { class: "btn", text: "返回修改" });
        backBtn.addEventListener("click", function () { overlay.remove(); });
        var goBtn = el("button", { class: "btn btn-accent", text: "仍要匯出" });
        goBtn.addEventListener("click", function () { overlay.remove(); doExport(); });
        row.appendChild(backBtn);
        row.appendChild(goBtn);
        box.appendChild(row);
        overlay.appendChild(box);
        overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
        return;
      }
    }

    doExport();
  });

  // ---------- 轉移碼（Litterbox）----------
  var LITTERBOX_API = "https://litterbox.catbox.moe/resources/internals/api.php";
  var LITTERBOX_HOST = "https://litter.catbox.moe/"; // 注意：檔案下載主機是 litter.catbox.moe，跟上傳 API 的 litterbox.catbox.moe 不同
  var TRANSFER_EXT_CANDIDATES = ["json", "txt", "sav", ""]; // 讀取時依序嘗試的副檔名

  function fetchWithTimeout(url, options, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    options = options || {};
    options.signal = controller.signal;
    return fetch(url, options).finally(function () { clearTimeout(timer); });
  }

  document.getElementById("genTransferBtn").addEventListener("click", function () {
    if (!saveData) { toast("請先載入存檔", "warn"); return; }
    var btn = document.getElementById("genTransferBtn");
    var msg = document.getElementById("transferMsg");
    btn.disabled = true;
    msg.textContent = "上傳中...";
    msg.style.color = "";

    saveData.characters.forEach(function (c) { c.savedAt = Date.now(); });
    var blob = new Blob([JSON.stringify(saveData)], { type: "application/json" });
    var file = new File([blob], "save.json", { type: "application/json" });
    var fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("time", "72h");
    fd.append("fileToUpload", file);

    fetchWithTimeout(LITTERBOX_API, { method: "POST", body: fd }, 20000)
      .then(function (res) { return res.text(); })
      .then(function (text) {
        text = text.trim();
        if (!/^https?:\/\//.test(text)) throw new Error(text || "伺服器回應異常");
        var m = text.match(/\/([a-zA-Z0-9]+)\.[a-zA-Z0-9]+$/);
        var code = m ? m[1] : text;
        document.getElementById("transferCodeText").textContent = code;
        document.getElementById("transferCodeBox").style.display = "flex";
        msg.textContent = "已上傳，72 小時內都可以用這組碼讀回來。";
        toast("轉移碼已產生：" + code, "ok");
      })
      .catch(function (err) {
        msg.textContent = "產生轉移碼失敗：" + err.message + "（可能是網路問題或 Litterbox 服務異常，可以直接用「匯出存檔」改成手動傳檔案）";
        msg.style.color = "var(--red)";
        toast("產生轉移碼失敗", "err");
      })
      .finally(function () { btn.disabled = false; });
  });

  document.getElementById("copyTransferBtn").addEventListener("click", function () {
    var code = document.getElementById("transferCodeText").textContent;
    if (!code) return;
    navigator.clipboard.writeText(code).then(function () {
      toast("已複製轉移碼", "ok");
    }).catch(function () {
      toast("複製失敗，請手動選取複製", "err");
    });
  });

  document.getElementById("useTransferBtn").addEventListener("click", function () {
    var code = document.getElementById("transferCodeInput").value.trim();
    var msg = document.getElementById("transferMsg");
    if (!code) { toast("請輸入轉移碼", "warn"); return; }
    var btn = document.getElementById("useTransferBtn");
    btn.disabled = true;

    function tryExt(i) {
      if (i >= TRANSFER_EXT_CANDIDATES.length) {
        msg.textContent = "讀取失敗：找不到這組轉移碼對應的存檔（試過 .json/.txt/.sav/無副檔名 都失敗），請確認代碼是否正確、是否已超過 72 小時過期，或改用「匯出存檔」的檔案手動匯入。";
        msg.style.color = "var(--red)";
        toast("讀取轉移碼失敗", "err");
        btn.disabled = false;
        return;
      }
      var ext = TRANSFER_EXT_CANDIDATES[i];
      var url = LITTERBOX_HOST + code + (ext ? "." + ext : "");
      msg.textContent = "讀取中...（嘗試 " + (i + 1) + "/" + TRANSFER_EXT_CANDIDATES.length + "：" + (ext || "無副檔名") + "，最多等 8 秒）";
      msg.style.color = "";

      fetchWithTimeout(url, {}, 8000)
        .then(function (res) { if (!res.ok) throw new Error("not found"); return res.text(); })
        .then(function (text) {
          var data = JSON.parse(text);
          if (!data || !Array.isArray(data.characters)) throw new Error("格式不符");
          saveData = data;
          currentCharIndex = 0;
          petsTouched = false;
          originalFileName = "idle-seal-transfer-" + code + ".json";
          renderAll();
          document.getElementById("exportBtn").disabled = false;
          document.getElementById("charSelect").disabled = false;
          document.getElementById("dupCharBtn").disabled = false;
          document.getElementById("delCharBtn").disabled = false;
          document.getElementById("defaultCharBtn").disabled = false;
          msg.textContent = "已成功載入轉移碼存檔。";
          toast("已載入轉移碼存檔", "ok");
          showPanel("basic");
          btn.disabled = false;
        })
        .catch(function () { tryExt(i + 1); });
    }
    tryExt(0);
  });
})();
