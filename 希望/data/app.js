(function () {
  "use strict";

  var ITEMS = window.ITEMS || {};
  // 五行寶石系統：鑲到武器上的屬性，直接存在該武器 stack 的 element 欄位（跟 refine 平行，不是巢狀在 options 裡）
  var ELEMENT_LABEL = { fire: "火", water: "水", tree: "木", steel: "金", earth: "土", sun: "光", dark: "闇" };
  var ELEMENT_LIST = ["fire", "water", "tree", "steel", "earth", "sun", "dark"];
  var EQUIP_SLOTS = window.EQUIP_SLOTS || {};
  var JOBS = window.JOBS || [];
  var SECOND_JOBS = window.SECOND_JOBS || [];
  var MAPS = window.MAPS || {};
  var PETS = window.PETS || {};
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
  var LOCKED_PANELS = ["basic", "attrs", "equip", "inventory", "warehouse", "enchant", "appraisal", "skills", "buffs", "pets", "potions", "records", "spot", "individuality", "quests", "missions", "dungeon", "party", "advanced", "sellkeep", "json"];

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

  document.getElementById("transferShortcutBtn").addEventListener("click", function () {
    showPanel("transfer");
  });

  // ---------- 功能總覽卡片 ----------
  var CAPABILITIES = [
    { panel: "basic", icon: "👤", title: "基本資料", desc: "名稱、等級、經驗、金錢、HP、職業、轉職進度、名聲、遊玩時間。" },
    { panel: "attrs", icon: "📊", title: "屬性點數", desc: "力量 / 敏捷 / 智力 / 體力 / 精神 / 幸運六圍。" },
    { panel: "equip", icon: "🛡️", title: "裝備欄位", desc: "設定各裝備欄位指向背包裡的哪一疊物品。" },
    { panel: "inventory", icon: "🎒", title: "背包", desc: "新增 / 刪除 / 修改背包物品與數量，支援搜尋。" },
    { panel: "enchant", icon: "🔮", title: "齒輪強化", desc: "編輯裝備的齒輪強化屬性，數值旁邊附機率表算出的範圍參考。" },
    // { panel: "appraisal", icon: "🔨", title: "鐵匠鑑定", desc: "無限抽抽樂試手氣，或自己輸入數值（鎖定合法範圍）。" }, // 先隱藏，之後正式開放再打開這行
    { panel: "warehouse", icon: "🏦", title: "倉庫", desc: "編輯所有角色共用的倉庫金錢與物品。" },
    { panel: "skills", icon: "✨", title: "已學技能", desc: "點選新增/移除技能，設定等級，支援全選滿等。" },
    { panel: "buffs", icon: "🌟", title: "輔助狀態", desc: "點選啟用/停用輔助技能，可批次套用等級改變持續時間。" },
    { panel: "pets", icon: "🐾", title: "寵物", desc: "新增寵物、調整成長階段、經驗、飽食度。" },
    { panel: "potions", icon: "🧪", title: "藥水設定", desc: "自動回血 / 回 AP 的閾值與藥水種類。" },
    { panel: "records", icon: "📖", title: "物品紀錄", desc: "已見過物品清單、追蹤中的掉落物清單。" },
    { panel: "spot", icon: "📍", title: "目前位置", desc: "所在地圖、座標、正在打的怪物或採集點。" },
    { panel: "individuality", icon: "🌠", title: "個性化", desc: "編輯已展現屬性、階段、副屬性，含展現上限對照。" },
    { panel: "quests", icon: "📜", title: "任務", desc: "地點/委託/內容三層選單找任務，勾選決定是否在進行中清單。" },
    { panel: "missions", icon: "🎯", title: "討伐任務", desc: "查詢討伐怪物換獎勵的清單，可勾選標記是否已完成。" },
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
        var opt = el("option", { value: p.id, text: p.name });
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
    renderAttrs(c);
    renderStacks(c);
    renderLoadout(c);
    renderSkillsPanel(c);
    renderBuffsPanel(c);
    renderPets(c);
    renderPotions(c);
    renderTagLists(c);
    renderSpot(c);
    renderIndividuality(c);
    renderQuests(c);
    renderMissions(c);
    renderDungeon(c);
    renderParty(c);
    renderEnchant(c);
    renderAppraisal(c);
    renderWarehouse();
    renderRawFields(c);
    if (document.getElementById("panel-json").classList.contains("active")) syncJsonEditor();
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

    var tier1Options = JOBS.filter(function (j) { return j.tier !== 2; }).map(function (j) { return { value: j.id, label: j.name + " (" + j.id + ")" }; });
    wrap.appendChild(fieldSelect("職業（一轉）Job", tier1Options, function () { return c.job; }, function (v) { c.job = v; renderBasic(c); }));

    var secondJobOptions = [{ value: "", label: "（尚未二轉）" }].concat(
      SECOND_JOBS.map(function (j) {
        var fromName = j.from ? (JOB_NAME[j.from] || j.from) : "";
        return { value: j.id, label: j.name + (fromName ? "・從 " + fromName : "") + " (" + j.id + ")" };
      })
    );
    var secondJobField = fieldSelect(
      "二轉職業 secondJob",
      secondJobOptions,
      function () { return c.secondJob || ""; },
      function (v) {
        if (v) {
          var chosen = SECOND_JOBS.find(function (j) { return j.id === v; });
          c.secondJob = v;
          if (chosen && chosen.from) c.job = chosen.from; // 二轉職業一定是從特定一轉職業分支出來的，一併同步，避免兩個欄位對不上
          c.advanceStep = 999; // 遊戲只判斷「advanceStep 有沒有到二轉完成的門檻」，數字多少不重要，衝到一個絕對夠大的值即可
          toast("已設定二轉職業" + (chosen && chosen.from ? "，一轉職業已同步改成 " + (JOB_NAME[chosen.from] || chosen.from) : "") + "，轉職進度已自動設為完成", "ok");
        } else {
          delete c.secondJob;
        }
        renderBasic(c);
      }
    );
    secondJobField.appendChild(el("div", {
      style: "font-size:11px;color:var(--text3);margin-top:4px;line-height:1.6;",
      text: "遊戲判斷目前職業，是看「advanceStep 有沒有到二轉完成」再決定要不要顯示 secondJob，兩個要一起設定才會生效——選這裡會自動幫你把 advanceStep 一起設好，不用再手動繞路。"
    }));
    wrap.appendChild(secondJobField);

    wrap.appendChild(fieldNumber("轉職進度 advanceStep", function () { return c.advanceStep; }, function (v) { c.advanceStep = v; }));
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

  function renderLoadout(c) {
    var wrap = document.getElementById("loadoutFields");
    wrap.innerHTML = "";
    var equipBit = getEquipBitForJob(c.job);

    Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
      var box = el("div", { class: "field" });
      box.appendChild(el("label", { text: EQUIP_SLOTS[slotKey] + " (" + slotKey + ")" }));

      var row = el("div", { style: "display:flex;gap:6px;flex-wrap:wrap;" });

      var currentStackId = c.loadout[slotKey];
      var currentStack = currentStackId ? c.stacks.find(function (s) { return s.id === currentStackId; }) : null;
      var currentItem = currentStack ? ITEMS[String(currentStack.itemId)] : null;

      var eligible = c.stacks.filter(function (stack) {
        if (currentStack && stack.id === currentStack.id) return false; // 目前裝備的另外顯示，不重複列出
        var it = ITEMS[String(stack.itemId)];
        if (!it || !it.slot || it.slot !== slotKey) return false;
        if ((it.minLv || 0) > (c.level || 0)) return false;
        if (equipBit !== null && it.jobs && !(it.jobs & (1 << equipBit))) return false;
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

  function checkPetRequirement(pet, c) {
    var def = PETS[String(pet.id)];
    if (!def) return { lvOk: true, fameOk: true };
    var lvOk = (c.level || 0) >= (def.lv || 0);
    var fameOk = ((c.fame && c.fame.current) || 0) >= (def.fame || 0);
    return { lvOk: lvOk, fameOk: fameOk, def: def };
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
    if (!r.fameOk) lines.push("・角色名聲不足：目前 " + ((c.fame && c.fame.current) || 0) + "，需要 " + r.def.fame);
    lines.push("\n請調整後再匯出存檔，否則這隻寵物在遊戲裡不會顯示出戰按鈕。");
    showCenterModal("⚠️ 寵物需求未達標", lines.join("\n"));
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
        // grow 的屬性加成陣列（growth.atk/mag/def）只有 9 格，索引方式是 grow-1，
        // 所以 grow:0 查不到任何一格資料，遊戲會顯示「無任何能力」。最低要設 1 才有基礎加成。
        pet.grow = 1;
        pet.exp = 0;
        pet.hunger = 0;
        petsTouched = true;
        renderPets(c);
        warnIfPetInvalid(pet, c);
      }));
      if (invalid) tdPet.style.color = "var(--red)";
      tr.appendChild(tdPet);

      ["uid", "grow", "exp", "hunger"].forEach(function (field) {
        var td = document.createElement("td");
        var inp = el("input", { type: "number", value: pet[field] });
        inp.addEventListener("input", function () { pet[field] = inp.valueAsNumber || 0; });
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

      var tdAct = document.createElement("td");
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
    });

    document.getElementById("addPetBtn").onclick = function () {
      var uid = c.nextPetUid++;
      // 新增的寵物先留空，讓玩家自己從下拉選單挑選
      c.pets.push({ uid: uid, id: 0, grow: 0, exp: 0, hunger: 0 });
      // 如果角色原本沒有任何出戰寵物，新增的這隻自動設為出戰
      if (!c.activePetUid) c.activePetUid = uid;
      petsTouched = true;
      renderPets(c);
    };
  }

  function potionPercentRow(label, getPct, setPct, currentItemId, onPickItem) {
    var wrap = el("div", { class: "field wide" });
    wrap.appendChild(el("label", { text: label }));
    var row = el("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap;" });
    row.appendChild(el("span", { text: "生命剩餘" }));
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
          function (id) { slot.itemId = id; }));
      });
    } else if ("apPotionId" in c) {
      // 舊版存檔：AP 藥水只有單一物品，沒有閾值設定
      wrap.appendChild(potionItemOnlyRow("AP藥水", c.apPotionId, function (id) { c.apPotionId = id; }));
    }

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
    renderTagListFor("trackedItems", "trackedItemInput", "trackedItemSuggest", "trackedItemTags", c);
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

  function indivTypeLabel(kind) {
    var t = INDIVIDUALITY_TYPES.find(function (x) { return x.kind === kind; });
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

    var stageDef = INDIVIDUALITY_STAGES[ind.stage] || null;
    var nextStageDef = INDIVIDUALITY_STAGES[ind.stage + 1] || null;
    var infoBox = document.getElementById("indivStageInfo");
    if (stageDef) {
      var infoLines = ["目前階段展現上限：" + stageDef.slots + " 條"];
      if (nextStageDef) {
        infoLines.push("升到 +" + (ind.stage + 1) + "：需要等級 " + nextStageDef.upgradeLevel + "，成功率約 " + (stageDef.upgradeRate / 1000) + "%");
      } else {
        infoLines.push("已達最高階段");
      }
      infoBox.textContent = infoLines.join("　|　");
    } else {
      infoBox.textContent = "找不到這個階段的參考資料（stage 超出範圍 0~10）";
    }

    var typeOptions = INDIVIDUALITY_TYPES.map(function (t) { return { value: t.kind, label: indivTypeLabel(t.kind) }; });

    var listWrap = document.getElementById("indivAttrsList");
    listWrap.innerHTML = "";
    ind.attrs.forEach(function (attr, idx) {
      var active = !!(stageDef && idx < stageDef.slots);
      var row = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 10px;background:var(--bg2);border-radius:6px;border:1px solid var(--border);flex-wrap:wrap;" });

      var kindSelect = el("select", { style: "flex:1;min-width:140px;" });
      typeOptions.forEach(function (o) {
        var opt = el("option", { value: o.value, text: o.label });
        if (attr.kind === o.value) opt.selected = true;
        kindSelect.appendChild(opt);
      });

      function applyRollValue() {
        var roll = INDIVIDUALITY_ROLLS.find(function (r) {
          return r[0] === ind.stage && r[1] === attr.kind && r[2] === attr.grade;
        });
        if (roll) attr.base = roll[6]; // maxVal
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

      var lockLabel = el("label", { style: "display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text2);white-space:nowrap;" });
      var lockCb = el("input", { type: "checkbox" });
      lockCb.checked = !!attr.locked;
      lockCb.addEventListener("change", function () { attr.locked = lockCb.checked; });
      lockLabel.appendChild(lockCb);
      lockLabel.appendChild(document.createTextNode("鎖定"));
      row.appendChild(lockLabel);

      row.appendChild(el("span", {
        style: "font-size:11px;padding:2px 8px;border-radius:10px;white-space:nowrap;" +
          (active ? "color:var(--green);border:1px solid var(--green);" : "color:var(--text3);border:1px solid var(--border);"),
        text: active ? "生效中" : "尚未生效"
      }));

      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () { ind.attrs.splice(idx, 1); renderIndividuality(c); });
      row.appendChild(delBtn);

      listWrap.appendChild(row);
    });

    document.getElementById("indivAddAttrBtn").onclick = function () {
      var newAttr = { kind: INDIVIDUALITY_TYPES[0].kind, grade: "B", base: 1, locked: false };
      var roll = INDIVIDUALITY_ROLLS.find(function (r) {
        return r[0] === ind.stage && r[1] === newAttr.kind && r[2] === newAttr.grade;
      });
      if (roll) newAttr.base = roll[6];
      ind.attrs.push(newAttr);
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
      minorCapBox.textContent = "已使用 " + total + " / 上限 " + cap + " 點" + (over ? "　⚠️ 已超過目前階段上限" : "");
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

  function renderQuests(c) {
    if (!Array.isArray(c.activeQuests)) c.activeQuests = [];

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
      var checked = c.activeQuests.indexOf(Number(qid)) !== -1;

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

      var checkLabel = el("label", { style: "display:flex;align-items:center;gap:8px;margin-top:16px;font-size:13.5px;cursor:pointer;" });
      var cb = el("input", { type: "checkbox" });
      cb.checked = checked;
      cb.addEventListener("change", function () {
        var qNum = Number(qid);
        var idx = c.activeQuests.indexOf(qNum);
        if (cb.checked && idx === -1) c.activeQuests.push(qNum);
        else if (!cb.checked && idx !== -1) c.activeQuests.splice(idx, 1);
        renderActiveList();
      });
      checkLabel.appendChild(cb);
      checkLabel.appendChild(document.createTextNode("此任務目前算在「進行中」清單裡"));
      box.appendChild(checkLabel);

      $detail.appendChild(box);
    }

    function renderActiveList() {
      var $list = document.getElementById("questActiveList");
      $list.innerHTML = "";
      if (!c.activeQuests.length) {
        $list.appendChild(el("div", { class: "panel-desc", text: "目前沒有進行中的任務。" }));
        return;
      }
      c.activeQuests.forEach(function (qNum) {
        var q = QUESTS[String(qNum)];
        var page = q ? QUEST_PAGES[String(q.pageId)] : null;
        var chip = el("div", {
          style: "display:inline-flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--accent);" +
            "border-radius:20px;padding:6px 12px;margin:0 8px 8px 0;font-size:12.5px;cursor:pointer;"
        });
        chip.textContent = q ? ("#" + qNum + "　" + (page ? page.title : "") + "　" + questDesc(q)) : ("#" + qNum + "（找不到資料）");
        chip.addEventListener("click", function () {
          if (!q) return;
          $town.value = "";
          updatePageOptions();
          $page.value = String(q.pageId);
          updateQuestOptions();
          $quest.value = String(qNum);
          renderDetail();
        });
        $list.appendChild(chip);
      });
    }

    $town.onchange = function () { updatePageOptions(); updateQuestOptions(); renderDetail(); };
    $page.onchange = function () { updateQuestOptions(); renderDetail(); };
    $quest.onchange = renderDetail;

    updatePageOptions();
    updateQuestOptions();
    renderDetail();
    renderActiveList();
  }

  // ---------- 討伐任務（唯讀查詢，missions.json）----------
  var MISSIONS = window.MISSIONS || {};
  var MISSION_TOKEN_ITEM_ID = window.MISSION_TOKEN_ITEM_ID || null;

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
          value: mid, text: (done ? "✅ " : "") + "#" + mid + "　Lv" + m.unlockLevel + "　擊殺「" + monsterName(m.monsterId) + "」x" + m.need
        }));
      });
    }

    function renderDetail() {
      var mid = $monster.value;
      $detail.innerHTML = "";
      if (!mid) {
        $detail.appendChild(el("div", { class: "panel-desc", text: "選擇一筆討伐任務查看詳細內容。" }));
        return;
      }
      var m = MISSIONS[mid];
      var box = el("div", { style: "background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;" });
      box.appendChild(el("div", { style: "font-weight:700;font-size:14.5px;margin-bottom:10px;", text: "#" + mid }));
      box.appendChild(el("div", { style: "font-size:13.5px;color:var(--text2);margin-bottom:6px;", text: "任務內容：擊殺「" + monsterName(m.monsterId) + "」x" + m.need }));

      var killRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13.5px;" });
      killRow.appendChild(el("span", { text: "目前擊殺進度（已由真實存檔驗證，格式為 [[任務ID, 擊殺數], ...]）：" }));
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
        ["需要擊殺數", String(m.need)],
        ["經驗獎勵", String(m.exp)],
        ["金錢獎勵", String(m.gold)],
      ];
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
      checkLabel.appendChild(document.createTextNode("此討伐任務算已完成（missionsDone，已由真實存檔驗證是任務 ID 陣列）"));
      box.appendChild(checkLabel);

      $detail.appendChild(box);
    }

    function renderDoneList() {
      var $list = document.getElementById("missionDoneList");
      $list.innerHTML = "";
      if (!c.missionsDone.length) {
        $list.appendChild(el("div", { class: "panel-desc", text: "目前沒有已完成的討伐任務。" }));
        return;
      }
      c.missionsDone.slice().sort(function (a, b) { return a - b; }).forEach(function (mNum) {
        var m = MISSIONS[String(mNum)];
        var chip = el("div", {
          style: "display:inline-flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--accent);" +
            "border-radius:20px;padding:6px 12px;margin:0 8px 8px 0;font-size:12.5px;cursor:pointer;"
        });
        chip.textContent = m ? ("#" + mNum + "　Lv" + m.unlockLevel + "　擊殺「" + monsterName(m.monsterId) + "」x" + m.need) : ("#" + mNum + "（找不到資料）");
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

  // ---------- 隊伍 ----------
  function renderParty(c) {
    if (!Array.isArray(c.party)) c.party = [];

    var $list = document.getElementById("partyMemberList");
    var $select = document.getElementById("partyAddSelect");
    var $btn = document.getElementById("partyAddBtn");

    $list.innerHTML = "";
    if (!c.party.length) {
      $list.appendChild(el("div", { class: "panel-desc", text: "目前隊伍是空的。" }));
    } else {
      c.party.forEach(function (member, idx) {
        var row = el("div", {
          style: "display:flex;align-items:center;gap:12px;background:var(--bg2);border:1px solid var(--border);" +
            "border-radius:6px;padding:10px 14px;margin-bottom:8px;"
        });
        var jobLabel = (JOB_NAME && JOB_NAME[member.jobId]) || member.jobId || "";
        row.appendChild(el("div", {
          style: "flex:1;font-size:13.5px;",
          text: member.name + "　Lv" + member.level + "　" + jobLabel +
            (member.stats ? "　ATK " + member.stats.atk + " / DEF " + member.stats.def : "")
        }));
        var delBtn = el("button", { class: "icon-btn", text: "✕" });
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
        var jobLabel = (JOB_NAME && JOB_NAME[other.job]) || other.job || "";
        $select.appendChild(el("option", { value: other.id, text: other.name + "　Lv" + other.level + "　" + jobLabel }));
      });
      $btn.disabled = false;
    }

    $btn.onclick = function () {
      var targetId = $select.value;
      if (!targetId) { toast("請先選擇要加入隊伍的角色", "warn"); return; }
      var target = saveData.characters.find(function (ch) { return ch.id === targetId; });
      if (!target || !target.snapshot) { toast("找不到該角色的快照資料，可能還沒存過檔", "err"); return; }

      var snapshotCopy = JSON.parse(JSON.stringify(target.snapshot));
      var existingIdx = c.party.findIndex(function (m) { return m.sourceId === targetId; });
      if (existingIdx !== -1) {
        c.party[existingIdx] = snapshotCopy;
        toast("已更新「" + target.name + "」在隊伍裡的快照", "ok");
      } else {
        c.party.push(snapshotCopy);
        toast("已將「" + target.name + "」加入隊伍", "ok");
      }
      renderParty(c);
    };
  }

  // ---------- 齒輪強化 ----------
  var ENCHANT_KINDS = window.ENCHANT_KINDS || [];
  var ENCHANT_GRADES = window.ENCHANT_GRADES || [];
  var ENCHANT_VALUE_RANGES = window.ENCHANT_VALUE_RANGES || {};
  // 已由玩家實測確認：這 6 種「每級XX」屬性，數字代表「每N級才加1點」，所以數字越小越強
  var REVERSED_PER_LEVEL_KINDS = [15, 16, 17, 18, 19, 20];
  function enchantKindLabel(kind, name) {
    return REVERSED_PER_LEVEL_KINDS.indexOf(kind) !== -1 ? name + "（數字越小越強）" : name;
  }

  function renderEnchant(c) {
    var $slot = document.getElementById("enchantFilterSlot");
    var $item = document.getElementById("enchantFilterItem");
    var $detail = document.getElementById("enchantDetailBox");

    if (!$slot.dataset.wired) {
      $slot.dataset.wired = "1";
      Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
        $slot.appendChild(el("option", { value: slotKey, text: EQUIP_SLOTS[slotKey] }));
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
        var o = el("option", { value: k.kind, text: enchantKindLabel(k.kind, k.name) });
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
      row.appendChild(el("span", {
        style: "font-size:12px;color:var(--text3);",
        text: range
          ? ("許可範圍：" + range.min + " ~ " + range.max + (isReversed ? "（數字越小越強，代表每N級+1點）" : "") + "　（超過會自動修正回邊界值）")
          : "此等級查無這個屬性的範圍資料，暫不限制輸入"
      }));

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
        $detail.appendChild(el("div", { class: "panel-desc", text: "選擇一件裝備來編輯齒輪強化。" }));
        return;
      }
      var stack = c.stacks.find(function (s) { return s.id === Number(stackId); });
      if (!stack) return;
      if (!stack.options) stack.options = { grade: 1, options: [] };
      var opts = stack.options;
      if (!Array.isArray(opts.options)) opts.options = [];

      var box = el("div", { style: "background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;" });
      box.appendChild(el("div", { style: "font-weight:700;font-size:14.5px;margin-bottom:10px;", text: itemName(stack.itemId) + "（Stack " + stack.id + "）" }));

      var gradeRow = el("div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:13px;" });
      gradeRow.appendChild(el("span", { text: "齒輪強化等級：" }));
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
          if (r) opt.value = Math.max(r.min, Math.min(r.max, opt.value));
        });
        renderDetail();
      });
      gradeRow.appendChild(gradeSelect);
      box.appendChild(gradeRow);

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

  // ---------- 鐵匠鑑定（跟齒輪強化是完全不同的系統，公式反推自遊戲原始程式碼）----------
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
          if (!r.fameOk) parts.push("名聲不足（目前 " + ((c.fame && c.fame.current) || 0) + " / 需要 " + r.def.fame + "）");
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
