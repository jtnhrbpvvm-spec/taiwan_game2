(function () {
  "use strict";

  var ITEMS = window.ITEMS || {};
  var EQUIP_SLOTS = window.EQUIP_SLOTS || {};
  var JOBS = window.JOBS || [];
  var SECOND_JOBS = window.SECOND_JOBS || [];
  var MAPS = window.MAPS || {};
  var PETS = window.PETS || {};

  var itemArr = Object.keys(ITEMS).map(function (id) { return { id: id, name: ITEMS[id].name }; });
  var petArr = Object.keys(PETS).map(function (id) { return { id: id, name: PETS[id].name }; });

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
  var LOCKED_PANELS = ["basic", "attrs", "equip", "inventory", "warehouse", "pets", "potions", "records", "spot", "advanced", "json"];

  function showPanel(name) {
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
    document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); });
    var panel = document.getElementById("panel-" + name);
    var nav = document.querySelector('.nav-item[data-panel="' + name + '"]');
    if (panel) panel.classList.add("active");
    if (nav) nav.classList.add("active");
    if (name === "json" && saveData) syncJsonEditor();
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

  // ---------- 功能總覽卡片 ----------
  var CAPABILITIES = [
    { panel: "basic", icon: "👤", title: "基本資料", desc: "名稱、等級、經驗、金錢、HP、職業、轉職進度、名聲、遊玩時間。" },
    { panel: "attrs", icon: "📊", title: "屬性點數", desc: "力量 / 敏捷 / 智力 / 體力 / 精神 / 幸運六圍。" },
    { panel: "equip", icon: "🛡️", title: "裝備欄位", desc: "設定各裝備欄位指向背包裡的哪一疊物品。" },
    { panel: "inventory", icon: "🎒", title: "背包", desc: "新增 / 刪除 / 修改背包物品與數量，支援搜尋。" },
    { panel: "warehouse", icon: "🏦", title: "倉庫", desc: "編輯所有角色共用的倉庫金錢與物品。" },
    { panel: "pets", icon: "🐾", title: "寵物", desc: "新增寵物、調整成長階段、經驗、飽食度。" },
    { panel: "potions", icon: "🧪", title: "藥水設定", desc: "自動回血 / 回 AP 的閾值與藥水種類。" },
    { panel: "records", icon: "📖", title: "物品紀錄", desc: "已見過物品清單、追蹤中的掉落物清單。" },
    { panel: "spot", icon: "📍", title: "目前位置", desc: "所在地圖、座標、正在打的怪物或採集點。" },
    { panel: "advanced", icon: "🔧", title: "進階欄位", desc: "技能、任務進度、個性化等，格式已驗證但仍以原始 JSON 編輯。", conf: "mid" },
    { panel: "json", icon: "{ }", title: "JSON 編輯器", desc: "直接編輯整份存檔的原始 JSON，萬用備援手段。" }
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
  function petName(id) { return (PETS[String(id)] || {}).name || ("寵物#" + id); }

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
    renderPets(c);
    renderPotions(c);
    renderTagLists(c);
    renderSpot(c);
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

    var jobOptions = JOBS.map(function (j) { return { value: j.id, label: j.name + " (" + j.id + ")" }; })
      .concat(SECOND_JOBS.map(function (j) { return { value: j.id, label: j.name + " ・二轉 (" + j.id + ")" }; }));
    wrap.appendChild(fieldSelect("職業 Job", jobOptions, function () { return c.job; }, function (v) { c.job = v; }));

    wrap.appendChild(fieldNumber("轉職進度 advanceStep", function () { return c.advanceStep; }, function (v) { c.advanceStep = v; }));
    wrap.appendChild(fieldCheckbox("在村莊中 inVillage", function () { return c.inVillage; }, function (v) { c.inVillage = v; }));
    if ("townId" in c) {
      wrap.appendChild(fieldNumber("所在村莊 townId", function () { return c.townId; }, function (v) { c.townId = v; }));
    }
    wrap.appendChild(fieldNumber("名聲(目前) fame.current", function () { return c.fame.current; }, function (v) { c.fame.current = v; }));
    wrap.appendChild(fieldNumber("名聲(累計) fame.total", function () { return c.fame.total; }, function (v) { c.fame.total = v; }));
    wrap.appendChild(fieldNumber("累計遊玩時間(ms) elapsedMs", function () { return c.elapsedMs; }, function (v) { c.elapsedMs = v; }));
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
  function renderStackTable($tbody, stacks) {
    $tbody.innerHTML = "";
    stacks.forEach(function (stack, idx) {
      var tr = document.createElement("tr");

      var tdItem = document.createElement("td");
      tdItem.appendChild(makeItemPicker(stack.itemId, function (newId) { stack.itemId = newId; }));
      tr.appendChild(tdItem);

      var tdCount = document.createElement("td");
      var countInput = el("input", { type: "number", value: stack.count });
      countInput.addEventListener("input", function () { stack.count = countInput.valueAsNumber || 0; });
      tdCount.appendChild(countInput);
      tr.appendChild(tdCount);

      var tdId = document.createElement("td");
      var idInput = el("input", { type: "number", value: stack.id });
      idInput.addEventListener("input", function () { stack.id = idInput.valueAsNumber || 0; });
      tdId.appendChild(idInput);
      tr.appendChild(tdId);

      var tdAct = document.createElement("td");
      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () {
        stacks.splice(idx, 1);
        renderStackTable($tbody, stacks);
      });
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);

      $tbody.appendChild(tr);
    });
  }

  function renderStacks(c) {
    var $tbody = document.querySelector("#stacksTable tbody");
    renderStackTable($tbody, c.stacks);
    document.getElementById("addStackBtn").onclick = function () {
      var newId = c.nextStackId++;
      c.stacks.push({ id: newId, itemId: 1, count: 1 });
      renderStackTable($tbody, c.stacks);
    };
  }

  function renderWarehouse() {
    document.getElementById("whGold").value = saveData.warehouse.gold;
    document.getElementById("whGold").oninput = function (e) { saveData.warehouse.gold = e.target.valueAsNumber || 0; };
    var $tbody = document.querySelector("#warehouseTable tbody");
    renderStackTable($tbody, saveData.warehouse.stacks);
    document.getElementById("addWhBtn").onclick = function () {
      var newId = saveData.warehouse.nextStackId++;
      saveData.warehouse.stacks.push({ id: newId, itemId: 1, count: 1 });
      renderStackTable($tbody, saveData.warehouse.stacks);
    };
  }

  function renderLoadout(c) {
    var wrap = document.getElementById("loadoutFields");
    wrap.innerHTML = "";
    Object.keys(EQUIP_SLOTS).forEach(function (slotKey) {
      wrap.appendChild(fieldNumber(EQUIP_SLOTS[slotKey] + " (" + slotKey + ")",
        function () { return c.loadout[slotKey] || ""; },
        function (v) {
          if (!v) delete c.loadout[slotKey];
          else c.loadout[slotKey] = v;
        }));
    });
  }

  function renderPets(c) {
    var $tbody = document.querySelector("#petsTable tbody");
    $tbody.innerHTML = "";
    c.pets.forEach(function (pet, idx) {
      var tr = document.createElement("tr");

      var tdPet = document.createElement("td");
      var wrap = el("div", { class: "item-picker" });
      var input = el("input", { type: "text", value: petName(pet.id) });
      var suggest = el("div", { class: "suggest" });
      input.addEventListener("input", function () {
        var q = input.value.trim();
        suggest.innerHTML = "";
        var matches = petArr.filter(function (p) { return p.name.indexOf(q) !== -1; }).slice(0, 30);
        matches.forEach(function (p) {
          var row = el("div", { text: p.name + " #" + p.id });
          row.addEventListener("click", function () {
            input.value = p.name; suggest.classList.remove("show"); pet.id = Number(p.id);
          });
          suggest.appendChild(row);
        });
        suggest.classList.toggle("show", matches.length > 0);
      });
      input.addEventListener("blur", function () { setTimeout(function () { suggest.classList.remove("show"); }, 150); });
      wrap.appendChild(input); wrap.appendChild(suggest);
      tdPet.appendChild(wrap);
      tr.appendChild(tdPet);

      ["uid", "grow", "exp", "hunger"].forEach(function (field) {
        var td = document.createElement("td");
        var inp = el("input", { type: "number", value: pet[field] });
        inp.addEventListener("input", function () { pet[field] = inp.valueAsNumber || 0; });
        td.appendChild(inp);
        tr.appendChild(td);
      });

      var tdAct = document.createElement("td");
      var delBtn = el("button", { class: "icon-btn", text: "✕" });
      delBtn.addEventListener("click", function () { c.pets.splice(idx, 1); renderPets(c); });
      tdAct.appendChild(delBtn);
      tr.appendChild(tdAct);

      $tbody.appendChild(tr);
    });

    document.getElementById("addPetBtn").onclick = function () {
      var uid = c.nextPetUid++;
      var firstPet = petArr[0];
      c.pets.push({ uid: uid, id: Number(firstPet.id), grow: 0, exp: 0, hunger: PETS[firstPet.id].feedFull });
      renderPets(c);
    };
  }

  function renderPotions(c) {
    var wrap = document.getElementById("potionFields");
    wrap.innerHTML = "";
    wrap.appendChild(fieldNumber("回血閾值 healThreshold (0~1)", function () { return c.healThreshold; }, function (v) { c.healThreshold = v; }));

    if (Array.isArray(c.potionSlots)) {
      // 新版存檔（多藥水槽）
      c.potionSlots.forEach(function (slot, idx) {
        var box = el("div", { class: "field" });
        box.appendChild(el("label", { text: "藥水槽 #" + (idx + 1) + " 閾值(0~1)" }));
        var thInput = el("input", { type: "number", step: "0.05", value: slot.threshold });
        thInput.addEventListener("input", function () { slot.threshold = thInput.valueAsNumber || 0; });
        box.appendChild(thInput);
        wrap.appendChild(box);

        var box2 = el("div", { class: "field" });
        box2.appendChild(el("label", { text: "藥水槽 #" + (idx + 1) + " 物品" }));
        box2.appendChild(makeItemPicker(slot.itemId, function (id) { slot.itemId = id; }));
        wrap.appendChild(box2);
      });
    } else if ("potionId" in c) {
      // 舊版存檔（單一藥水 + 閾值）
      var box3 = el("div", { class: "field" });
      box3.appendChild(el("label", { text: "自動喝藥閾值 potionThreshold (0~1)" }));
      var thInput2 = el("input", { type: "number", step: "0.01", value: c.potionThreshold });
      thInput2.addEventListener("input", function () { c.potionThreshold = thInput2.valueAsNumber || 0; });
      box3.appendChild(thInput2);
      wrap.appendChild(box3);

      var box4 = el("div", { class: "field" });
      box4.appendChild(el("label", { text: "自動使用藥水 potionId" }));
      box4.appendChild(makeItemPicker(c.potionId, function (id) { c.potionId = id; }));
      wrap.appendChild(box4);
    }

    var apBox = el("div", { class: "field" });
    apBox.appendChild(el("label", { text: "AP 藥水 apPotionId" }));
    apBox.appendChild(makeItemPicker(c.apPotionId, function (id) { c.apPotionId = id; }));
    wrap.appendChild(apBox);

    if ("attackSkillId" in c) {
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

  // ---------- 進階（推測格式）欄位：原始 JSON ----------
  var RAW_FIELDS = [
    { key: "skills", label: "已學技能 skills", confidence: "mid", note: "格式為 [[技能ID, 等級], ...] 的陣列（已由真實滿等存檔驗證）。要新增技能，加一組 [id, 等級] 即可。" },
    { key: "buffSkillIds", label: "啟用中的輔助技能 buffSkillIds", confidence: "mid", note: "技能 ID 的陣列，例如 [49]（已由真實存檔驗證）。" },
    { key: "activeQuests", label: "進行中的任務 activeQuests", confidence: "mid", note: "任務 ID 的陣列，例如 [367]（已由真實存檔驗證，但任務名稱對照尚未做進編輯器）。" },
    { key: "sellKeep", label: "賣出時保留清單 sellKeep", confidence: "mid", note: "格式為 [[物品ID, 保留數量], ...]（已由真實存檔驗證）。保留數量的確切意義尚待進一步確認。" },
    { key: "individuality", label: "個性化 individuality", confidence: "mid", note: "已由真實存檔驗證：stage/fails/minor 可信；attrs 內每項為 {kind, grade, base, locked}。" },
    { key: "offlineHistory", label: "離線紀錄 offlineHistory", confidence: "mid", note: "只是歷史紀錄，通常不需要編輯，格式已由真實存檔驗證。" },
    { key: "rngState", label: "亂數種子 rngState", confidence: "mid", note: "單一整數，用於決定連線後的隨機結果，建議不要隨意更動。" }
  ];

  function renderRawFields(c) {
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
      ta.value = JSON.stringify(c[f.key], null, 2);
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
  document.getElementById("exportBtn").addEventListener("click", function () {
    if (!saveData) return;
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
  });
})();
