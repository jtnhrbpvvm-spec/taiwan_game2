(function () {
  "use strict";

  var ITEMS = window.ITEMS || {};
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
  var LOCKED_PANELS = ["basic", "attrs", "equip", "inventory", "warehouse", "skills", "buffs", "pets", "potions", "records", "spot", "individuality", "advanced", "json"];

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
    { panel: "warehouse", icon: "🏦", title: "倉庫", desc: "編輯所有角色共用的倉庫金錢與物品。" },
    { panel: "skills", icon: "✨", title: "已學技能", desc: "點選新增/移除技能，設定等級，支援全選滿等。" },
    { panel: "buffs", icon: "🌟", title: "輔助狀態", desc: "點選啟用/停用輔助技能，可批次套用等級改變持續時間。" },
    { panel: "pets", icon: "🐾", title: "寵物", desc: "新增寵物、調整成長階段、經驗、飽食度。" },
    { panel: "potions", icon: "🧪", title: "藥水設定", desc: "自動回血 / 回 AP 的閾值與藥水種類。" },
    { panel: "records", icon: "📖", title: "物品紀錄", desc: "已見過物品清單、追蹤中的掉落物清單。" },
    { panel: "spot", icon: "📍", title: "目前位置", desc: "所在地圖、座標、正在打的怪物或採集點。" },
    { panel: "individuality", icon: "🌠", title: "個性化", desc: "編輯已展現屬性、階段、副屬性，含展現上限對照。" },
    { panel: "advanced", icon: "🔧", title: "進階欄位", desc: "任務進度、賣出保留清單等，格式已驗證但仍以原始 JSON 編輯。", conf: "mid" },
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

    var jobOptions = JOBS.filter(function (j) { return j.tier !== 2; }).map(function (j) { return { value: j.id, label: j.name + " (" + j.id + ")" }; })
      .concat(SECOND_JOBS.map(function (j) { return { value: j.id, label: j.name + " ・二轉 (" + j.id + ")" }; }));
    wrap.appendChild(fieldSelect("職業 Job", jobOptions, function () { return c.job; }, function (v) { c.job = v; }));

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
  function renderStackTable($tbody, stacks) {
    $tbody.innerHTML = "";
    stacks.forEach(function (stack, idx) {
      var tr = document.createElement("tr");
      var itemDef = ITEMS[String(stack.itemId)];
      var isEquip = !!(itemDef && itemDef.slot);

      var tdItem = document.createElement("td");
      tdItem.appendChild(makeItemPicker(stack.itemId, function (newId) {
        stack.itemId = newId;
        renderStackTable($tbody, stacks); // 換成裝備/非裝備時，精煉欄位要跟著顯示/隱藏
      }));
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
    box.appendChild(el("div", { style: "font-size:13.5px;color:var(--text2);margin-bottom:16px;", text: "要把這件裝備加進哪裡？" }));
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

  function renderStacks(c) {
    var $tbody = document.querySelector("#stacksTable tbody");
    renderStackTable($tbody, c.stacks);
    document.getElementById("addStackBtn").onclick = function () {
      var newId = c.nextStackId++;
      c.stacks.push({ id: newId, itemId: 1, count: 1 });
      renderStackTable($tbody, c.stacks);
    };
    setupEquipFilter("inv", function (itemId) { showAddToStackModal(itemId); });
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
    setupEquipFilter("wh", function (itemId) { showAddToStackModal(itemId); });
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

      var row = el("div", { style: "display:flex;gap:6px;" });

      var picker = el("select", { style: "flex:1;" });
      var eligible = c.stacks.filter(function (stack) {
        var it = ITEMS[String(stack.itemId)];
        if (!it || !it.slot || it.slot !== slotKey) return false;
        if ((it.minLv || 0) > (c.level || 0)) return false;
        if (equipBit !== null && it.jobs && !(it.jobs & (1 << equipBit))) return false;
        return true;
      });
      picker.appendChild(el("option", { value: "", text: eligible.length ? "從背包選擇（" + eligible.length + " 件符合）..." : "背包內沒有符合的裝備" }));
      eligible.forEach(function (stack) {
        var it = ITEMS[String(stack.itemId)];
        picker.appendChild(el("option", { value: stack.id, text: it.name + "（Stack " + stack.id + "）" }));
      });
      picker.disabled = eligible.length === 0;
      picker.addEventListener("change", function () {
        if (!picker.value) return;
        c.loadout[slotKey] = Number(picker.value);
        renderLoadout(c);
      });
      row.appendChild(picker);

      var idInput = el("input", { type: "number", value: c.loadout[slotKey] || "", placeholder: "Stack ID", style: "width:90px;" });
      idInput.addEventListener("input", function () {
        var v = idInput.valueAsNumber;
        if (!v) delete c.loadout[slotKey];
        else c.loadout[slotKey] = v;
      });
      row.appendChild(idInput);

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

    wrap.appendChild(potionItemOnlyRow("AP藥水", c.apPotionId, function (id) { c.apPotionId = id; }));

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

  // ---------- 進階（推測格式）欄位：原始 JSON ----------
  var RAW_FIELDS = [
    { key: "activeQuests", label: "進行中的任務 activeQuests", confidence: "mid", note: "任務 ID 的陣列，例如 [367]（已由真實存檔驗證，但任務名稱對照尚未做進編輯器）。" },
    { key: "sellKeep", label: "賣出時保留清單 sellKeep", confidence: "mid", note: "格式為 [[物品ID, 保留數量], ...]（已由真實存檔驗證）。保留數量的確切意義尚待進一步確認。" },
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
