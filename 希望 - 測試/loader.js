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
  var ENCHANT_VALUES = {"1-1":[{"min":10,"max":25,"weight":100000,"unit":0}],"1-2":[{"min":10,"max":25,"weight":100000,"unit":0}],"1-3":[{"min":1,"max":5,"weight":100000,"unit":0}],"1-4":[{"min":1,"max":5,"weight":100000,"unit":0}],"1-5":[{"min":10,"max":25,"weight":100000,"unit":0}],"1-6":[{"min":1,"max":5,"weight":100000,"unit":0}],"1-7":[{"min":1,"max":5,"weight":100000,"unit":0}],"1-8":[{"min":1,"max":5,"weight":100000,"unit":0}],"1-9":[{"min":10,"max":50,"weight":100000,"unit":0}],"1-10":[{"min":10,"max":50,"weight":100000,"unit":0}],"1-21":[{"min":1,"max":3,"weight":100000,"unit":0}],"2-1":[{"min":25,"max":35,"weight":70000,"unit":0},{"min":35,"max":45,"weight":30000,"unit":0}],"2-2":[{"min":25,"max":35,"weight":70000,"unit":0},{"min":35,"max":45,"weight":30000,"unit":0}],"2-3":[{"min":1,"max":10,"weight":100000,"unit":0}],"2-4":[{"min":1,"max":10,"weight":100000,"unit":0}],"2-5":[{"min":25,"max":35,"weight":70000,"unit":0},{"min":35,"max":45,"weight":30000,"unit":0}],"2-6":[{"min":1,"max":10,"weight":100000,"unit":0}],"2-7":[{"min":1,"max":10,"weight":100000,"unit":0}],"2-8":[{"min":1,"max":10,"weight":100000,"unit":0}],"2-9":[{"min":50,"max":100,"weight":70000,"unit":0},{"min":100,"max":200,"weight":30000,"unit":0}],"2-10":[{"min":50,"max":100,"weight":70000,"unit":0},{"min":100,"max":200,"weight":30000,"unit":0}],"2-11":[{"min":1,"max":1,"weight":100000,"unit":0}],"2-12":[{"min":1,"max":1,"weight":100000,"unit":0}],"2-15":[{"min":10,"max":10,"weight":65000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1}],"2-16":[{"min":10,"max":10,"weight":65000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1}],"2-17":[{"min":10,"max":10,"weight":65000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1}],"2-18":[{"min":10,"max":10,"weight":65000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1}],"2-19":[{"min":50,"max":50,"weight":30000,"unit":1},{"min":48,"max":48,"weight":25000,"unit":1},{"min":46,"max":46,"weight":15000,"unit":1},{"min":44,"max":44,"weight":12500,"unit":1},{"min":42,"max":42,"weight":10000,"unit":1},{"min":40,"max":40,"weight":7500,"unit":1}],"2-20":[{"min":50,"max":50,"weight":30000,"unit":1},{"min":48,"max":48,"weight":25000,"unit":1},{"min":46,"max":46,"weight":15000,"unit":1},{"min":44,"max":44,"weight":12500,"unit":1},{"min":42,"max":42,"weight":10000,"unit":1},{"min":40,"max":40,"weight":7500,"unit":1}],"2-21":[{"min":1,"max":5,"weight":100000,"unit":0}],"2-22":[{"min":1,"max":3,"weight":100000,"unit":0}],"2-23":[{"min":1,"max":1,"weight":100000,"unit":0}],"3-1":[{"min":45,"max":55,"weight":60000,"unit":0},{"min":55,"max":65,"weight":25000,"unit":0},{"min":65,"max":75,"weight":15000,"unit":0}],"3-2":[{"min":45,"max":55,"weight":60000,"unit":0},{"min":55,"max":65,"weight":25000,"unit":0},{"min":65,"max":75,"weight":15000,"unit":0}],"3-3":[{"min":5,"max":15,"weight":100000,"unit":0}],"3-4":[{"min":5,"max":15,"weight":100000,"unit":0}],"3-5":[{"min":45,"max":55,"weight":60000,"unit":0},{"min":55,"max":65,"weight":25000,"unit":0},{"min":65,"max":75,"weight":15000,"unit":0}],"3-6":[{"min":5,"max":15,"weight":100000,"unit":0}],"3-7":[{"min":5,"max":15,"weight":100000,"unit":0}],"3-8":[{"min":5,"max":15,"weight":100000,"unit":0}],"3-9":[{"min":200,"max":300,"weight":60000,"unit":0},{"min":300,"max":400,"weight":25000,"unit":0},{"min":400,"max":500,"weight":15000,"unit":0}],"3-10":[{"min":200,"max":300,"weight":60000,"unit":0},{"min":300,"max":400,"weight":25000,"unit":0},{"min":400,"max":500,"weight":15000,"unit":0}],"3-11":[{"min":1,"max":1,"weight":80000,"unit":0},{"min":2,"max":2,"weight":20000,"unit":0}],"3-12":[{"min":1,"max":1,"weight":80000,"unit":0},{"min":2,"max":2,"weight":20000,"unit":0}],"3-13":[{"min":1,"max":1,"weight":100000,"unit":0}],"3-14":[{"min":1,"max":1,"weight":100000,"unit":0}],"3-15":[{"min":10,"max":10,"weight":55000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1},{"min":4,"max":4,"weight":10000,"unit":1}],"3-16":[{"min":10,"max":10,"weight":55000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1},{"min":4,"max":4,"weight":10000,"unit":1}],"3-17":[{"min":10,"max":10,"weight":55000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1},{"min":4,"max":4,"weight":10000,"unit":1}],"3-18":[{"min":10,"max":10,"weight":55000,"unit":1},{"min":8,"max":8,"weight":22500,"unit":1},{"min":6,"max":6,"weight":12500,"unit":1},{"min":4,"max":4,"weight":10000,"unit":1}],"3-19":[{"min":40,"max":40,"weight":45000,"unit":1},{"min":38,"max":38,"weight":20000,"unit":1},{"min":36,"max":36,"weight":12500,"unit":1},{"min":34,"max":34,"weight":10000,"unit":1},{"min":32,"max":32,"weight":7500,"unit":1},{"min":30,"max":30,"weight":5000,"unit":1}],"3-20":[{"min":40,"max":40,"weight":45000,"unit":1},{"min":38,"max":38,"weight":20000,"unit":1},{"min":36,"max":36,"weight":12500,"unit":1},{"min":34,"max":34,"weight":10000,"unit":1},{"min":32,"max":32,"weight":7500,"unit":1},{"min":30,"max":30,"weight":5000,"unit":1}],"3-21":[{"min":1,"max":10,"weight":100000,"unit":0}],"3-22":[{"min":1,"max":5,"weight":100000,"unit":0}],"3-23":[{"min":1,"max":1,"weight":100000,"unit":0}],"4-1":[{"min":75,"max":90,"weight":55500,"unit":0},{"min":90,"max":105,"weight":32500,"unit":0},{"min":105,"max":120,"weight":8500,"unit":0},{"min":120,"max":135,"weight":3500,"unit":0}],"4-2":[{"min":75,"max":90,"weight":55500,"unit":0},{"min":90,"max":105,"weight":32500,"unit":0},{"min":105,"max":120,"weight":8500,"unit":0},{"min":120,"max":135,"weight":3500,"unit":0}],"4-3":[{"min":10,"max":20,"weight":100000,"unit":0}],"4-4":[{"min":10,"max":20,"weight":100000,"unit":0}],"4-5":[{"min":75,"max":90,"weight":55500,"unit":0},{"min":90,"max":105,"weight":32500,"unit":0},{"min":105,"max":120,"weight":8500,"unit":0},{"min":120,"max":135,"weight":3500,"unit":0}],"4-6":[{"min":10,"max":20,"weight":100000,"unit":0}],"4-7":[{"min":10,"max":20,"weight":100000,"unit":0}],"4-8":[{"min":10,"max":20,"weight":100000,"unit":0}],"4-9":[{"min":500,"max":600,"weight":55500,"unit":0},{"min":600,"max":700,"weight":32500,"unit":0},{"min":800,"max":900,"weight":8500,"unit":0},{"min":900,"max":1000,"weight":3500,"unit":0}],"4-10":[{"min":500,"max":600,"weight":55500,"unit":0},{"min":600,"max":700,"weight":32500,"unit":0},{"min":800,"max":900,"weight":8500,"unit":0},{"min":900,"max":1000,"weight":3500,"unit":0}],"4-11":[{"min":1,"max":1,"weight":72000,"unit":0},{"min":2,"max":2,"weight":18000,"unit":0},{"min":3,"max":3,"weight":10000,"unit":0}],"4-12":[{"min":1,"max":1,"weight":72000,"unit":0},{"min":2,"max":2,"weight":18000,"unit":0},{"min":3,"max":3,"weight":10000,"unit":0}],"4-13":[{"min":1,"max":1,"weight":80000,"unit":0},{"min":2,"max":2,"weight":15000,"unit":0},{"min":3,"max":3,"weight":5000,"unit":0}],"4-14":[{"min":1,"max":1,"weight":80000,"unit":0},{"min":2,"max":2,"weight":15000,"unit":0},{"min":3,"max":3,"weight":5000,"unit":0}],"4-15":[{"min":10,"max":10,"weight":50000,"unit":2},{"min":8,"max":8,"weight":30000,"unit":2},{"min":6,"max":6,"weight":15000,"unit":2},{"min":4,"max":4,"weight":5000,"unit":2}],"4-16":[{"min":10,"max":10,"weight":50000,"unit":2},{"min":8,"max":8,"weight":30000,"unit":2},{"min":6,"max":6,"weight":15000,"unit":2},{"min":4,"max":4,"weight":5000,"unit":2}],"4-17":[{"min":10,"max":10,"weight":50000,"unit":2},{"min":8,"max":8,"weight":30000,"unit":2},{"min":6,"max":6,"weight":15000,"unit":2},{"min":4,"max":4,"weight":5000,"unit":2}],"4-18":[{"min":10,"max":10,"weight":50000,"unit":2},{"min":8,"max":8,"weight":30000,"unit":2},{"min":6,"max":6,"weight":15000,"unit":2},{"min":4,"max":4,"weight":5000,"unit":2}],"4-19":[{"min":30,"max":30,"weight":20000,"unit":1},{"min":28,"max":28,"weight":29000,"unit":1},{"min":26,"max":26,"weight":15000,"unit":1},{"min":24,"max":24,"weight":15000,"unit":1},{"min":22,"max":22,"weight":10000,"unit":1},{"min":20,"max":20,"weight":5000,"unit":1},{"min":18,"max":18,"weight":3750,"unit":1},{"min":15,"max":15,"weight":2250,"unit":1}],"4-20":[{"min":30,"max":30,"weight":20000,"unit":1},{"min":28,"max":28,"weight":29000,"unit":1},{"min":26,"max":26,"weight":15000,"unit":1},{"min":24,"max":24,"weight":15000,"unit":1},{"min":22,"max":22,"weight":10000,"unit":1},{"min":20,"max":20,"weight":5000,"unit":1},{"min":18,"max":18,"weight":3750,"unit":1},{"min":15,"max":15,"weight":2250,"unit":1}],"4-21":[{"min":1,"max":15,"weight":100000,"unit":0}],"4-22":[{"min":1,"max":5,"weight":75000,"unit":0},{"min":5,"max":10,"weight":25000,"unit":0}],"4-23":[{"min":1,"max":1,"weight":70000,"unit":0},{"min":2,"max":2,"weight":25000,"unit":0},{"min":3,"max":3,"weight":5000,"unit":0}],"5-1":[{"min":135,"max":150,"weight":50500,"unit":0},{"min":150,"max":165,"weight":33000,"unit":0},{"min":165,"max":180,"weight":10000,"unit":0},{"min":180,"max":195,"weight":4500,"unit":0},{"min":195,"max":210,"weight":2000,"unit":0}],"5-2":[{"min":135,"max":150,"weight":50500,"unit":0},{"min":150,"max":165,"weight":33000,"unit":0},{"min":165,"max":180,"weight":10000,"unit":0},{"min":180,"max":195,"weight":4500,"unit":0},{"min":195,"max":210,"weight":2000,"unit":0}],"5-3":[{"min":15,"max":25,"weight":100000,"unit":0}],"5-4":[{"min":15,"max":25,"weight":100000,"unit":0}],"5-5":[{"min":135,"max":150,"weight":50500,"unit":0},{"min":150,"max":165,"weight":33000,"unit":0},{"min":165,"max":180,"weight":10000,"unit":0},{"min":180,"max":195,"weight":4500,"unit":0},{"min":195,"max":210,"weight":2000,"unit":0}],"5-6":[{"min":15,"max":25,"weight":100000,"unit":0}],"5-7":[{"min":15,"max":25,"weight":100000,"unit":0}],"5-8":[{"min":15,"max":25,"weight":100000,"unit":0}],"5-9":[{"min":1000,"max":1100,"weight":50500,"unit":0},{"min":1100,"max":1200,"weight":33000,"unit":0},{"min":1200,"max":1300,"weight":10000,"unit":0},{"min":1300,"max":1400,"weight":4500,"unit":0},{"min":1400,"max":1500,"weight":2000,"unit":0}],"5-10":[{"min":1000,"max":1100,"weight":50500,"unit":0},{"min":1100,"max":1200,"weight":33000,"unit":0},{"min":1200,"max":1300,"weight":10000,"unit":0},{"min":1300,"max":1400,"weight":4500,"unit":0},{"min":1400,"max":1500,"weight":2000,"unit":0}],"5-11":[{"min":2,"max":2,"weight":72000,"unit":0},{"min":3,"max":3,"weight":18000,"unit":0},{"min":4,"max":4,"weight":10000,"unit":0}],"5-12":[{"min":2,"max":2,"weight":72000,"unit":0},{"min":3,"max":3,"weight":18000,"unit":0},{"min":4,"max":4,"weight":10000,"unit":0}],"5-13":[{"min":2,"max":2,"weight":80000,"unit":0},{"min":3,"max":3,"weight":15000,"unit":0},{"min":4,"max":4,"weight":5000,"unit":0}],"5-14":[{"min":2,"max":2,"weight":80000,"unit":0},{"min":3,"max":3,"weight":15000,"unit":0},{"min":4,"max":4,"weight":5000,"unit":0}],"5-15":[{"min":8,"max":8,"weight":50000,"unit":2},{"min":6,"max":6,"weight":30000,"unit":2},{"min":4,"max":4,"weight":15000,"unit":2},{"min":3,"max":3,"weight":5000,"unit":2}],"5-16":[{"min":8,"max":8,"weight":50000,"unit":2},{"min":6,"max":6,"weight":30000,"unit":2},{"min":4,"max":4,"weight":15000,"unit":2},{"min":3,"max":3,"weight":5000,"unit":2}],"5-17":[{"min":8,"max":8,"weight":50000,"unit":2},{"min":6,"max":6,"weight":30000,"unit":2},{"min":4,"max":4,"weight":15000,"unit":2},{"min":3,"max":3,"weight":5000,"unit":2}],"5-18":[{"min":8,"max":8,"weight":50000,"unit":2},{"min":6,"max":6,"weight":30000,"unit":2},{"min":4,"max":4,"weight":15000,"unit":2},{"min":3,"max":3,"weight":5000,"unit":2}],"5-19":[{"min":28,"max":28,"weight":20000,"unit":1},{"min":26,"max":26,"weight":29000,"unit":1},{"min":24,"max":24,"weight":15000,"unit":1},{"min":22,"max":22,"weight":15000,"unit":1},{"min":20,"max":20,"weight":10000,"unit":1},{"min":18,"max":18,"weight":5000,"unit":1},{"min":15,"max":15,"weight":3750,"unit":1},{"min":13,"max":13,"weight":2250,"unit":1}],"5-20":[{"min":28,"max":28,"weight":20000,"unit":1},{"min":26,"max":26,"weight":29000,"unit":1},{"min":24,"max":24,"weight":15000,"unit":1},{"min":22,"max":22,"weight":15000,"unit":1},{"min":20,"max":20,"weight":10000,"unit":1},{"min":18,"max":18,"weight":5000,"unit":1},{"min":15,"max":15,"weight":3750,"unit":1},{"min":13,"max":13,"weight":2250,"unit":1}],"5-21":[{"min":1,"max":20,"weight":100000,"unit":0}],"5-22":[{"min":1,"max":5,"weight":70000,"unit":0},{"min":5,"max":10,"weight":25000,"unit":0},{"min":10,"max":15,"weight":5000,"unit":0}],"5-23":[{"min":2,"max":2,"weight":70000,"unit":0},{"min":3,"max":3,"weight":25000,"unit":0},{"min":4,"max":4,"weight":5000,"unit":0}]};

  // ---------- 先清掉舊的（讓 bookmarklet 可以重複點擊 / 熱重載）----------
  var oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();
  document.querySelectorAll("[data-iw-btn]").forEach(function (el) { el.remove(); });
  var oldBackdrop = document.getElementById("iw-enhance-backdrop");
  if (oldBackdrop) oldBackdrop.remove();
  var oldAlchemyBackdrop = document.getElementById("iw-alchemy-backdrop");
  if (oldAlchemyBackdrop) oldAlchemyBackdrop.remove();
  var oldAlchemyFabWrap = document.getElementById("iw-alchemy-fab-wrap");
  if (oldAlchemyFabWrap) oldAlchemyFabWrap.remove();
  var oldAlchemyShowBtn = document.getElementById("iw-alchemy-show-btn");
  if (oldAlchemyShowBtn) oldAlchemyShowBtn.remove();
  var oldRespawnFab = document.getElementById("iw-respawn-fab");
  if (oldRespawnFab) oldRespawnFab.remove();
  window.__iwAlchemyGeneration = (window.__iwAlchemyGeneration || 0) + 1;
  var myAlchemyGeneration = window.__iwAlchemyGeneration;
  if (window.__iwEnhanceObserver) { window.__iwEnhanceObserver.disconnect(); }

  // ---------- 找到 Vue 應用程式，往下爬元件樹找 session/data/snap ----------
  // session、data、snap 分開找：session 幾乎每個畫面的元件都拿得到，data/snap 通常只有
  // 「強化」「鍊金」這類面板才會同時拿到——所以不要求三個一定要在同一個元件上，
  // 這樣書籤才能在任何畫面啟動，不用一定要先開強化頁。
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

    var foundSession = null, foundData = null, foundSnap = null;
    function walk(vnode) {
      if (!vnode) return;
      if (vnode.component) {
        var props = vnode.component.props;
        if (props) {
          if (!foundSession && props.session && typeof props.session.enhance === "function") foundSession = props.session;
          if (!foundData && props.data && props.data.itemById && typeof props.data.itemById.get === "function") foundData = props.data;
          if (!foundSnap && props.snap && typeof props.snap.gold === "number") foundSnap = props.snap;
        }
        if (foundSession && foundData && foundSnap) return;
        walk(vnode.component.subTree);
      } else if (Array.isArray(vnode.children)) {
        for (var i = 0; i < vnode.children.length; i++) {
          walk(vnode.children[i]);
          if (foundSession && foundData && foundSnap) return;
        }
      }
    }
    walk(rootComp.subTree);
    return { session: foundSession, data: foundData, snap: foundSnap };
  }

  var initialRefs = findGameRefs();
  if (!initialRefs || !initialRefs.session) {
    alert("找不到遊戲的 session（有可能頁面還沒載入完成，或是遊戲版本改版了，請回報給作者）");
    return;
  }
  var session = initialRefs.session;
  var data = initialRefs.data; // 可能是 null，等玩家開過強化/鍊金頁面才抓得到，之後會自動補上
  var liveSnap = initialRefs.snap;
  function snap() { return liveSnap; } // 每次都重新讀，確保拿到最新的即時狀態
  function tryUpgradeRefs() {
    if (data && liveSnap) return; // 已經都有了，不用再找
    var r = findGameRefs();
    if (!r) return;
    if (!data && r.data) data = r.data;
    if (!liveSnap && r.snap) liveSnap = r.snap;
  }

  // ---------- 樣式 ----------
  var style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = [
    "[id^=iw-enhance] *,[id^=iw-alchemy] *,.iw-inline-btn{box-sizing:border-box;font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;}",
    ".iw-inline-btn{background:#7c5cbf;color:#fff;border:none;border-radius:6px;padding:6px 10px;",
    "font-size:12.5px;font-weight:700;cursor:pointer;margin-right:8px;white-space:nowrap;}",
    ".iw-inline-btn:hover{background:#9270d6;}",
    "#iw-enhance-backdrop,#iw-alchemy-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999998;",
    "display:flex;align-items:center;justify-content:center;padding:16px;}",
    "#iw-enhance-modal,#iw-alchemy-modal{background:#1c1712;color:#e8e0d0;border:1px solid #3a2f22;border-radius:10px;",
    "width:100%;max-width:420px;max-height:88vh;overflow-y:auto;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.6);position:relative;}",
    "#iw-enhance-modal h2,#iw-alchemy-modal h2{margin:0 0 14px;font-size:16px;color:#e0b95c;}",
    "#iw-enhance-modal label,#iw-alchemy-modal label{display:block;font-size:12.5px;color:#b8ab90;margin:12px 0 4px;}",
    "#iw-enhance-modal select,#iw-enhance-modal input[type=number],#iw-alchemy-modal select,#iw-alchemy-modal input[type=number]{width:100%;padding:8px 9px;",
    "background:#2a231a;border:1px solid #4a3d2c;border-radius:5px;color:#e8e0d0;font-size:13.5px;}",
    "#iw-enhance-modal select:focus,#iw-enhance-modal input:focus,#iw-alchemy-modal select:focus,#iw-alchemy-modal input:focus{outline:none;border-color:#c9a24b;}",
    "#iw-enhance-modal .iw-target,#iw-alchemy-modal .iw-target{font-size:14px;color:#e8e0d0;background:#2a231a;border:1px solid #4a3d2c;",
    "border-radius:6px;padding:9px 10px;}",
    "#iw-enhance-modal .iw-warn{font-size:11.5px;color:#e0b95c;margin-top:6px;line-height:1.6;display:none;}",
    ".iw-checkrow{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:#d8cdb8;}",
    ".iw-checkrow input{width:auto;}",
    ".iw-btnrow{display:flex;gap:10px;margin-top:18px;}",
    ".iw-btn{flex:1;padding:10px;border-radius:6px;border:1px solid #4a3d2c;background:#2a231a;",
    "color:#e8e0d0;font-size:13.5px;cursor:pointer;}",
    ".iw-btn.primary{background:#c9a24b;color:#241c15;border-color:#c9a24b;font-weight:700;}",
    ".iw-btn.primary:hover{background:#ddb968;}",
    ".iw-mode-btn.active{background:#7c5cbf;border-color:#7c5cbf;color:#fff;}",
    ".iw-btn:disabled{opacity:.45;cursor:not-allowed;}",
    "#iw-enhance-log,#iw-alchemy-log{margin-top:14px;background:#141009;border:1px solid #3a2f22;border-radius:6px;",
    "padding:10px;font-size:12.5px;line-height:1.7;max-height:160px;overflow-y:auto;white-space:pre-wrap;}",
    "#iw-enhance-summary,#iw-alchemy-summary{margin-top:12px;font-size:13px;line-height:1.8;}",
    "#iw-enhance-summary b,#iw-alchemy-summary b,#iw-alchemy-status-summary b{color:#e0b95c;}",
    "#iw-enhance-close,#iw-alchemy-close{position:absolute;top:10px;right:14px;background:none;border:none;color:#b8ab90;",
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
  // 這幾種「依等級增加」屬性，數字越小代表越常加點、越好，比較方向要反過來（要 <= 而不是 >=）
  var LOWER_IS_BETTER_KINDS = { 15: true, 16: true, 17: true, 18: true, 19: true, 20: true };
  // requirements: array of { kind, mode, threshold, min, max }
  //   mode:"number" -> threshold 有值代表「要洗到符合門檻」（一般屬性是 >=，依等級增加屬性是 <=），null 代表不限數值
  //   mode:"tier"   -> min/max 有值代表「要落在這個機率區間」，null 代表不限範圍
  function reqSatisfiesValue(req, value) {
    if (req.mode === "tier") {
      if (req.min == null) return true;
      return value >= req.min && value <= req.max;
    }
    if (req.threshold == null) return true;
    return LOWER_IS_BETTER_KINDS[req.kind] ? value <= req.threshold : value >= req.threshold;
  }
  function meetsKindRequirement(entry, requirements) {
    if (!requirements || !requirements.length) return true; // 沒指定就當作沒有這個限制
    var rolled = (entry && entry.options && entry.options.options) || [];
    var used = new Array(rolled.length).fill(false);
    function backtrack(i) {
      if (i >= requirements.length) return true;
      var req = requirements[i];
      for (var j = 0; j < rolled.length; j++) {
        if (used[j]) continue;
        var r = rolled[j];
        if (r.kind !== req.kind) continue;
        if (!reqSatisfiesValue(req, r.value)) continue;
        used[j] = true;
        if (backtrack(i + 1)) return true;
        used[j] = false;
      }
      return false;
    }
    return backtrack(0);
  }
  function kindRequirementText(requirements) {
    return (requirements || []).map(function (req) {
      var name = ENCHANT_KIND_NAME[req.kind] || ("kind" + req.kind);
      if (req.mode === "tier" && req.min != null) return name + "(" + req.min + "~" + req.max + ")";
      if (req.mode !== "tier" && req.threshold != null) {
        return name + "(" + (LOWER_IS_BETTER_KINDS[req.kind] ? "≤" : "≥") + req.threshold + ")";
      }
      return name;
    }).join("、");
  }
  // groups：多組「條件組合」，只要其中任何一組完全符合（組內是 AND）就算數（組跟組之間是 OR）
  function meetsAnyGroup(entry, groups) {
    if (!groups || !groups.length) return true; // 完全沒有任何組合 = 不限制，只看階級
    return groups.some(function (g) { return meetsKindRequirement(entry, g); });
  }
  function firstSatisfiedGroupText(entry, groups) {
    if (!groups || !groups.length) return null;
    var idx = groups.findIndex(function (g) { return meetsKindRequirement(entry, g); });
    return idx === -1 ? null : "組合" + (idx + 1);
  }
  function groupsText(groups) {
    if (!groups || !groups.length) return "（無限制）";
    return groups.map(function (g, idx) { return "組合" + (idx + 1) + "[" + kindRequirementText(g) + "]"; }).join("　或　");
  }
  function valueTiersFor(grade, kind) {
    return ENCHANT_VALUES[grade + "-" + kind] || [];
  }
  function overallBoundsFor(grade, kind) {
    var tiers = valueTiersFor(grade, kind);
    if (!tiers.length) return null;
    var min = tiers[0].min, max = tiers[0].max;
    tiers.forEach(function (t) {
      if (t.min < min) min = t.min;
      if (t.max > max) max = t.max;
    });
    return { min: min, max: max };
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
      tryUpgradeRefs(); // 如果一開始沒抓到 data/snap，這裡有機會重新補上（現在畫面上如果有 .card 元素，通常代表 data 也拿得到了）
      var goButtons = document.querySelectorAll(".card:not([data-id]) > div:first-child > button.go");
      if (goButtons.length === 0) return;
      if (!data) { console.warn("[一鍵強化] 找到強化按鈕的畫面了，但還沒抓到 data，稍後畫面變動時會自動重試"); return; }
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

    var kindOptionsHtml = ENCHANT_KINDS.map(function (k) {
      return '<option value="' + k.kind + '">' + k.name + '</option>';
    }).join("");

    modal.innerHTML =
      '<button id="iw-enhance-close">✕</button>' +
      '<h2>⚡ 一鍵強化</h2>' +
      '<label>目標裝備</label>' +
      '<div class="iw-target" id="iw-f-target-display">' + item.label + '：' + item.name + '（目前 ' + gradeNameOf(curGrade) + ' 階・' + rolledKindsText(freshEntry) + '）</div>' +
      '<label>目標階級（洗到這階或更高就停）</label>' +
      '<select id="iw-f-grade">' + gradeOptions + '</select>' +
      '<div class="iw-warn" id="iw-f-warn">⚠️ 高階級的成功機率可能非常低（甚至目前材料完全洗不上去），選這個目標有可能把預算花光也到不了，請自行評估。</div>' +
      '<label>準備幾條屬性選項？（0 = 不限制，只看階級；打勾才會列入要求，沒勾的先放著備用）</label>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
      '<input type="number" id="iw-f-kind-count" min="0" max="6" value="0" style="width:64px;">' +
      '<div style="display:flex;gap:6px;">' +
      '<button type="button" class="iw-btn iw-mode-btn" id="iw-f-mode-number" style="padding:6px 12px;font-size:12.5px;">依數字</button>' +
      '<button type="button" class="iw-btn iw-mode-btn" id="iw-f-mode-tier" style="padding:6px 12px;font-size:12.5px;">依階級</button>' +
      '</div>' +
      '</div>' +
      '<div id="iw-f-kind-slots" style="display:flex;flex-direction:column;gap:6px;margin-top:8px;"></div>' +
      '<div id="iw-f-groups-wrap" style="display:none;margin-top:14px;">' +
      '<label>停止條件組合（符合其中任何一組就停；組內要同時全部出現）</label>' +
      '<div id="iw-f-groups-list" style="display:flex;flex-direction:column;gap:8px;"></div>' +
      '<button type="button" class="iw-btn" id="iw-f-add-group" style="margin-top:8px;">➕ 新增組合</button>' +
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

    var kindCountInput = document.getElementById("iw-f-kind-count");
    var kindSlotsWrap = document.getElementById("iw-f-kind-slots");

    var rangeMode = "number"; // "number" 或 "tier"
    var modeNumberBtn = document.getElementById("iw-f-mode-number");
    var modeTierBtn = document.getElementById("iw-f-mode-tier");
    function updateModeButtons() {
      modeNumberBtn.classList.toggle("active", rangeMode === "number");
      modeTierBtn.classList.toggle("active", rangeMode === "tier");
    }
    updateModeButtons();

    function rangeOptionsHtmlByNumber(grade, kind) {
      var bounds = overallBoundsFor(grade, kind);
      var html = '<option value="">（不限數值）</option>';
      if (!bounds) return html;
      var symbol = LOWER_IS_BETTER_KINDS[kind] ? "≤" : "≥";
      for (var v = bounds.min; v <= bounds.max; v++) {
        html += '<option value="' + v + '">' + symbol + ' ' + v + '</option>';
      }
      return html;
    }
    function rangeOptionsHtmlByTier(grade, kind) {
      var tiers = valueTiersFor(grade, kind);
      var total = tiers.reduce(function (s, t) { return s + t.weight; }, 0) || 1;
      var html = '<option value="">（不限範圍）</option>';
      tiers.forEach(function (t) {
        var pct = t.weight / total * 100;
        var pctText = pct >= 10 ? pct.toFixed(0) : pct.toFixed(1);
        html += '<option value="' + t.min + '|' + t.max + '">' + t.min + '~' + t.max + '（' + pctText + '%）</option>';
      });
      return html;
    }
    function rangeOptionsHtml(grade, kind) {
      return rangeMode === "tier" ? rangeOptionsHtmlByTier(grade, kind) : rangeOptionsHtmlByNumber(grade, kind);
    }
    function refreshRangeSelect(rangeSel, kindSel) {
      rangeSel.innerHTML = rangeOptionsHtml(Number(gradeSelect.value), Number(kindSel.value));
    }
    function refreshAllRangeSelects() {
      Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row")).forEach(function (row) {
        refreshRangeSelect(row.querySelector(".iw-kind-slot-range"), row.querySelector(".iw-kind-slot"));
      });
    }
    modeNumberBtn.addEventListener("click", function () { rangeMode = "number"; updateModeButtons(); refreshAllRangeSelects(); });
    modeTierBtn.addEventListener("click", function () { rangeMode = "tier"; updateModeButtons(); refreshAllRangeSelects(); });
    gradeSelect.addEventListener("change", function () { updateWarn(); refreshAllRangeSelects(); });
    updateWarn();

    // ---------- 停止條件組合（多組 AND，組跟組之間是 OR）----------
    var groupsWrap = document.getElementById("iw-f-groups-wrap");
    var groupsList = document.getElementById("iw-f-groups-list");
    var addGroupBtn = document.getElementById("iw-f-add-group");
    var groups = []; // 每個元素是長度 = 屬性數量 的布林陣列

    function currentSlotCount() {
      return kindSlotsWrap.querySelectorAll(".iw-kind-row").length;
    }
    function slotLabel(i) {
      var row = kindSlotsWrap.querySelectorAll(".iw-kind-row")[i];
      if (!row) return "";
      var kindVal = Number(row.querySelector(".iw-kind-slot").value);
      return (ENCHANT_KIND_NAME[kindVal] || "");
    }
    function renderGroups() {
      var n = currentSlotCount();
      groupsWrap.style.display = n > 0 ? "block" : "none";
      groupsList.innerHTML = "";
      groups.forEach(function (g, gIdx) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:6px 8px;background:var(--bg3,#2a231a);border-radius:5px;";
        var label = document.createElement("span");
        label.textContent = "組合" + (gIdx + 1) + "：";
        label.style.cssText = "flex:none;font-size:12.5px;color:var(--text2,#d8cdb8);";
        row.appendChild(label);
        for (var i = 0; i < n; i++) {
          var cbLabel = document.createElement("label");
          cbLabel.style.cssText = "display:flex;align-items:center;gap:3px;font-size:12.5px;font-weight:400;margin:0;";
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.style.width = "auto";
          cb.checked = !!g[i];
          (function (gArr, idx, checkbox) {
            checkbox.addEventListener("change", function () {
              if (checkbox.checked) {
                var checkedCount = gArr.filter(Boolean).length;
                if (checkedCount >= 3) {
                  checkbox.checked = false;
                  alert("同一個組合最多只能勾 3 個——遊戲每次強化固定只會洗出 3 條屬性，勾超過 3 個那個組合永遠不可能成立。");
                  return;
                }
              }
              gArr[idx] = checkbox.checked;
            });
          })(g, i, cb);
          cbLabel.appendChild(cb);
          cbLabel.appendChild(document.createTextNode("①②③④⑤⑥"[i] + (slotLabel(i) ? " " + slotLabel(i) : "")));
          row.appendChild(cbLabel);
        }
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "iw-btn";
        delBtn.textContent = "✕";
        delBtn.style.cssText = "padding:2px 8px;font-size:12px;margin-left:auto;";
        delBtn.addEventListener("click", function () {
          groups.splice(gIdx, 1);
          renderGroups();
        });
        row.appendChild(delBtn);
        groupsList.appendChild(row);
      });
    }
    function refreshGroupLabels() { renderGroups(); }
    function rebuildGroups() {
      var n = currentSlotCount();
      groups.forEach(function (g) {
        while (g.length < n) g.push(false);
        g.length = n;
      });
      renderGroups();
    }
    addGroupBtn.addEventListener("click", function () {
      var n = currentSlotCount();
      if (n === 0) { alert("請先設定至少 1 條屬性選項，才能建立組合"); return; }
      groups.push(new Array(n).fill(false));
      renderGroups();
    });

    function rebuildKindSlots() {
      var n = Math.max(0, Math.min(6, Number(kindCountInput.value) || 0));
      kindCountInput.value = String(n);
      var prevRows = Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row"));
      var prevKinds = prevRows.map(function (row) { return row.querySelector(".iw-kind-slot").value; });
      kindSlotsWrap.innerHTML = "";
      var numerals = ["①", "②", "③", "④", "⑤", "⑥"];
      for (var i = 0; i < n; i++) {
        var row = document.createElement("div");
        row.className = "iw-kind-row";
        row.style.cssText = "display:flex;gap:6px;align-items:center;";
        var numLabel = document.createElement("span");
        numLabel.textContent = numerals[i] || String(i + 1);
        numLabel.style.cssText = "flex:none;width:20px;color:var(--gold,#c9a24b);font-weight:700;";
        var kindSel = document.createElement("select");
        kindSel.className = "iw-kind-slot";
        kindSel.style.flex = "1";
        kindSel.innerHTML = kindOptionsHtml;
        if (prevKinds[i]) kindSel.value = prevKinds[i];
        var rangeSel = document.createElement("select");
        rangeSel.className = "iw-kind-slot-range";
        rangeSel.style.flex = "1";
        row.appendChild(numLabel);
        row.appendChild(kindSel);
        row.appendChild(rangeSel);
        kindSlotsWrap.appendChild(row);
        refreshRangeSelect(rangeSel, kindSel);
        kindSel.addEventListener("change", function () {
          var r = this.closest(".iw-kind-row");
          refreshRangeSelect(r.querySelector(".iw-kind-slot-range"), r.querySelector(".iw-kind-slot"));
          refreshGroupLabels();
        });
      }
      rebuildGroups(); // 屬性數量變了，組合的勾選格數量也要跟著重建
    }
    kindCountInput.addEventListener("input", rebuildKindSlots);
    rebuildKindSlots();

    document.getElementById("iw-enhance-close").addEventListener("click", closeModal);
    document.getElementById("iw-f-cancel").addEventListener("click", function () {
      if (running) { stopFlag = true; } else { closeModal(); }
    });
    document.getElementById("iw-f-start").addEventListener("click", function () {
      try {
        var targetGrade = Number(document.getElementById("iw-f-grade").value);
        var budget = Number(document.getElementById("iw-f-budget").value) || 0;
        var autoBuy = document.getElementById("iw-f-autobuy").checked;
        var slotRows = Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row"));
        function slotToReq(row) {
          var kind = Number(row.querySelector(".iw-kind-slot").value);
          var rangeVal = row.querySelector(".iw-kind-slot-range").value;
          if (rangeMode === "tier") {
            if (!rangeVal) return { kind: kind, mode: "tier", min: null, max: null };
            var parts = rangeVal.split("|");
            return { kind: kind, mode: "tier", min: Number(parts[0]), max: Number(parts[1]) };
          }
          return { kind: kind, mode: "number", threshold: rangeVal ? Number(rangeVal) : null };
        }
        // 把每個組合的勾選陣列，轉成「這個組合需要哪幾個屬性條件」，沒有任何勾選的組合直接跳過（不然會變成永遠成立）
        var matchGroups = groups
          .map(function (g) {
            return g.map(function (checked, i) { return checked ? slotRows[i] : null; })
              .filter(Boolean).map(slotToReq);
          })
          .filter(function (g) { return g.length > 0; });

        if (slotRows.length >= 4 && matchGroups.length === 0) {
          alert("你準備了 " + slotRows.length + " 條屬性選項，但沒有建立任何「停止條件組合」。\n\n遊戲每次強化固定只會洗出 3 條屬性，不可能一次全部出現——請按「➕ 新增組合」，自己勾選其中最多 3 個編號當作停止條件。");
          return;
        }

        startRun(item, targetGrade, budget, autoBuy, matchGroups);
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

  async function startRun(item, targetGrade, budget, autoBuy, matchGroups) {
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
      if (curGrade >= targetGrade && meetsAnyGroup(entry, matchGroups)) { reason = "success"; break; }

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
      var matchInfo = (matchGroups && matchGroups.length)
        ? "，需求：" + groupsText(matchGroups) + "（目前" + (meetsAnyGroup(newEntry, matchGroups) ? "已符合" : "未符合") + "）"
        : "";
      log("第 " + attempts + " 次強化：花費 " + fmt(spent) + " 金幣，結果 " + gradeNameOf(newGrade) + " 階（" + rolledKindsText(newEntry) + "）" + matchInfo);
      var targetDisplay = document.getElementById("iw-f-target-display");
      if (targetDisplay) targetDisplay.textContent = item.label + "：" + item.name + "（目前 " + gradeNameOf(newGrade) + " 階・" + rolledKindsText(newEntry) + "）";

      if (totalSpent >= budget && !(newGrade >= targetGrade && meetsAnyGroup(newEntry, matchGroups))) { reason = "budget"; break; }

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

  // ==========================================================================
  // 自動煉金 + 自動重生：兩個背景執行功能共用同一個浮動區塊，一起收合／展開。
  // ==========================================================================
  var alchemyFabWrap = document.createElement("div");
  alchemyFabWrap.id = "iw-alchemy-fab-wrap";
  alchemyFabWrap.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:999999;display:flex;flex-direction:column;gap:8px;align-items:flex-start;";

  var alchemyRow = document.createElement("div");
  alchemyRow.style.cssText = "display:flex;align-items:center;gap:6px;";

  var alchemyFab = document.createElement("button");
  alchemyFab.id = "iw-alchemy-fab";
  alchemyFab.textContent = "🧪 自動煉金";
  alchemyFab.style.cssText = "background:#4a90a4;color:#fff;" +
    "border:none;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:700;cursor:pointer;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.4);";

  var alchemyHideBtn = document.createElement("button");
  alchemyHideBtn.title = "隱藏這個區塊（不會中斷背景執行）";
  alchemyHideBtn.textContent = "×";
  alchemyHideBtn.style.cssText = "background:#2a231a;color:#b8ab90;border:none;border-radius:50%;" +
    "width:22px;height:22px;line-height:22px;padding:0;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);";

  alchemyRow.appendChild(alchemyFab);
  alchemyRow.appendChild(alchemyHideBtn);
  alchemyFabWrap.appendChild(alchemyRow);

  var respawnFab = document.createElement("button");
  respawnFab.id = "iw-respawn-fab";
  respawnFab.textContent = "🔄 自動重生：關閉";
  respawnFab.style.cssText = "background:#5a6b47;color:#fff;" +
    "border:none;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.4);opacity:.85;align-self:stretch;";
  alchemyFabWrap.appendChild(respawnFab);

  var alchemyShowBtn = document.createElement("button");
  alchemyShowBtn.id = "iw-alchemy-show-btn";
  alchemyShowBtn.title = "顯示自動煉金／自動重生按鈕";
  alchemyShowBtn.textContent = "🧪";
  alchemyShowBtn.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:999999;display:none;" +
    "background:#4a90a4;color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:17px;cursor:pointer;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.4);";

  document.body.appendChild(alchemyFabWrap);
  document.body.appendChild(alchemyShowBtn);

  // 讓收合後的圓點可以拖到畫面上任何地方（不擋到遊戲介面）。
  // 滑鼠（電腦）用 mousedown/mousemove/mouseup，觸控（手機）另外用 touchstart/touchmove/touchend，
  // 兩套事件完全分開處理，不要互相干擾；同時要能分辨「拖曳」跟「單純點一下」，
  // 不然拖完放開手會被誤判成點擊，把面板展開。
  function makeDraggable(el) {
    el.style.touchAction = "none"; // 避免手機上拖曳時，畫面跟著捲動
    var dragging = false, moved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

    function beginDrag(clientX, clientY) {
      dragging = true;
      moved = false;
      var rect = el.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      startX = clientX;
      startY = clientY;
      // 拖曳期間統一改用 left/top 定位，比較好算邊界
      el.style.left = origLeft + "px";
      el.style.top = origTop + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    }
    function moveDrag(clientX, clientY) {
      if (!dragging) return;
      var dx = clientX - startX, dy = clientY - startY;
      if (!moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) moved = true;
      if (!moved) return;
      var maxLeft = window.innerWidth - el.offsetWidth;
      var maxTop = window.innerHeight - el.offsetHeight;
      el.style.left = Math.max(0, Math.min(maxLeft, origLeft + dx)) + "px";
      el.style.top = Math.max(0, Math.min(maxTop, origTop + dy)) + "px";
    }
    function endDrag() {
      dragging = false;
    }

    // ---- 滑鼠（電腦）----
    el.addEventListener("mousedown", function (e) {
      beginDrag(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (dragging) moveDrag(e.clientX, e.clientY);
    });
    document.addEventListener("mouseup", function () { endDrag(); });

    // ---- 觸控（手機）----
    el.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      beginDrag(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
      if (moved) e.preventDefault(); // 真的在拖的時候才擋掉滾動，單純點擊不影響
    }, { passive: false });
    document.addEventListener("touchend", function () { endDrag(); });

    return { wasDragged: function () { return moved; } };
  }
  var showBtnDrag = makeDraggable(alchemyShowBtn);

  alchemyHideBtn.addEventListener("click", function () {
    alchemyFabWrap.style.display = "none";
    alchemyShowBtn.style.display = "flex";
    alchemyShowBtn.style.alignItems = "center";
    alchemyShowBtn.style.justifyContent = "center";
  });
  alchemyShowBtn.addEventListener("click", function () {
    if (showBtnDrag.wasDragged()) return; // 剛剛是拖曳放開，不是點擊，不要展開面板
    alchemyShowBtn.style.display = "none";
    alchemyFabWrap.style.display = "flex";
  });

  var alchemyBackdrop = null, alchemyModal = null;
  var alchemyRunning = false, alchemyStopFlag = false, alchemyTimer = null;
  var alchemyStats = { attempts: 0, totalSpent: 0, totalMade: 0, targetCount: 0, budget: 0, recipeId: null, recipeName: "" };

  function fmtMs(ms) {
    var s = Math.ceil(ms / 1000);
    return s <= 0 ? "0 秒" : s + " 秒";
  }

  function alchemyLog(msg) {
    var el = document.getElementById("iw-alchemy-log");
    if (!el) return;
    el.style.display = "block";
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  }

  function closeAlchemyModal() {
    if (alchemyBackdrop) { alchemyBackdrop.remove(); alchemyBackdrop = null; alchemyModal = null; }
  }

  function openAlchemyModal() {
    if (alchemyBackdrop) return;
    if (alchemyRunning) { openAlchemyStatusModal(); return; }
    var panel;
    try { panel = session.buildAlchemyPanel(); } catch (err) { panel = null; }
    if (!panel || !panel.recipes || !panel.recipes.length) {
      alert("目前拿不到任何可用的煉金配方（可能不是鐵匠職業，或是身上沒有對應的配方書/材料/技能）。");
      return;
    }

    alchemyBackdrop = document.createElement("div");
    alchemyBackdrop.id = "iw-alchemy-backdrop";
    alchemyModal = document.createElement("div");
    alchemyModal.id = "iw-alchemy-modal";

    var recipeOptions = panel.recipes.map(function (r, idx) {
      var sourceText = r.source.kind === "skill" ? "技能：" + r.source.name : "配方書：" + r.source.name;
      var costText = r.gold ? "，" + fmt(r.gold) + " 金幣" : "，免費";
      return '<option value="' + idx + '">' + r.productName + " ×" + r.count + "（" + sourceText + costText + "，成功率 " + r.rate + "%）</option>";
    }).join("");

    alchemyModal.innerHTML =
      '<button id="iw-alchemy-close">✕</button>' +
      '<h2>🧪 自動煉金</h2>' +
      '<label>選擇配方</label>' +
      '<select id="iw-a-recipe">' + recipeOptions + '</select>' +
      '<div id="iw-a-recipe-info" class="iw-target" style="margin-top:8px;"></div>' +
      '<label>要重複製作幾次？（0 = 不限制，一直做到你按停止或做不下去為止）</label>' +
      '<input type="number" id="iw-a-count" min="0" step="1" value="0">' +
      '<label>最大金幣預算（配方免費的話這欄沒作用）</label>' +
      '<input type="number" id="iw-a-budget" min="0" step="1000" value="' + fmtRaw(session.player.gold) + '">' +
      '<div class="iw-btnrow">' +
      '<button class="iw-btn" id="iw-a-cancel">取消</button>' +
      '<button class="iw-btn primary" id="iw-a-start">開始（背景執行，可離開此畫面）</button>' +
      '</div>' +
      '<div id="iw-alchemy-log" style="display:none;"></div>' +
      '<div id="iw-alchemy-summary"></div>';

    alchemyBackdrop.appendChild(alchemyModal);
    document.body.appendChild(alchemyBackdrop);

    var recipeSelect = document.getElementById("iw-a-recipe");
    var infoBox = document.getElementById("iw-a-recipe-info");
    function updateRecipeInfo() {
      var r = panel.recipes[Number(recipeSelect.value)];
      var matsText = r.mats.length ? r.mats.map(function (m) { return m.name + " ×" + m.need + "（庫存 " + m.have + "）"; }).join("、") : "無需材料";
      var cd = r.readyAtMs > Date.now() ? "，目前冷卻中，還要等 " + fmtMs(r.readyAtMs - Date.now()) : "";
      infoBox.textContent = "材料：" + matsText + cd + (r.blocked ? "（目前狀態：" + r.blocked + "）" : "");
    }
    recipeSelect.addEventListener("change", updateRecipeInfo);
    updateRecipeInfo();

    document.getElementById("iw-alchemy-close").addEventListener("click", closeAlchemyModal);
    document.getElementById("iw-a-cancel").addEventListener("click", function () {
      if (alchemyRunning) { alchemyStopFlag = true; } else { closeAlchemyModal(); }
    });
    alchemyBackdrop.addEventListener("click", function (e) { if (e.target === alchemyBackdrop && !alchemyRunning) closeAlchemyModal(); });

    document.getElementById("iw-a-start").addEventListener("click", function () {
      var chosen = panel.recipes[Number(recipeSelect.value)];
      var targetCount = Number(document.getElementById("iw-a-count").value) || 0;
      var budget = Number(document.getElementById("iw-a-budget").value) || 0;
      startAlchemyRun(chosen.id, targetCount, budget, chosen.productName);
    });
  }

  function openAlchemyStatusModal() {
    alchemyBackdrop = document.createElement("div");
    alchemyBackdrop.id = "iw-alchemy-backdrop";
    alchemyModal = document.createElement("div");
    alchemyModal.id = "iw-alchemy-modal";
    alchemyModal.innerHTML =
      '<button id="iw-alchemy-close">✕</button>' +
      '<h2>🧪 自動煉金（執行中）</h2>' +
      '<div class="iw-target">目前配方：' + escapeHtmlLite(alchemyStats.recipeName) + '</div>' +
      '<div id="iw-alchemy-status-summary" style="margin-top:12px;"></div>' +
      '<div class="iw-btnrow"><button class="iw-btn primary" id="iw-a-stop">⏹️ 停止背景執行</button></div>' +
      '<div id="iw-alchemy-log"></div>';
    document.body.appendChild(alchemyBackdrop);
    alchemyBackdrop.appendChild(alchemyModal);
    updateAlchemyStatusSummary();
    document.getElementById("iw-alchemy-close").addEventListener("click", closeAlchemyModal);
    document.getElementById("iw-a-stop").addEventListener("click", function () { alchemyStopFlag = true; });
    alchemyBackdrop.addEventListener("click", function (e) { if (e.target === alchemyBackdrop) closeAlchemyModal(); });
  }
  function updateAlchemyStatusSummary() {
    var el = document.getElementById("iw-alchemy-status-summary");
    if (!el) return;
    el.innerHTML = "已執行 <b>" + alchemyStats.attempts + "</b> 次　做出約 <b>" + alchemyStats.totalMade + "</b> 個　花費 <b>" + fmt(alchemyStats.totalSpent) + "</b> 金幣";
  }
  function escapeHtmlLite(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  function fmtRaw(n) { return Math.floor(n || 0); }

  function setAlchemyFormDisabled(disabled) {
    ["iw-a-recipe", "iw-a-count", "iw-a-budget", "iw-a-start"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
    var cancel = document.getElementById("iw-a-cancel");
    if (cancel) cancel.textContent = disabled ? "停止" : "取消";
  }

  function startAlchemyRun(recipeId, targetCount, budget, recipeName) {
    alchemyRunning = true;
    alchemyStopFlag = false;
    setAlchemyFormDisabled(true);
    alchemyFab.textContent = "🧪 煉金中...";
    alchemyStats = { attempts: 0, totalSpent: 0, totalMade: 0, targetCount: targetCount, budget: budget, recipeId: recipeId, recipeName: recipeName };
    var logEl = document.getElementById("iw-alchemy-log");
    if (logEl) logEl.textContent = "";
    var summaryEl = document.getElementById("iw-alchemy-summary");
    if (summaryEl) summaryEl.innerHTML = "";

    function findRecipe() {
      var panel = session.buildAlchemyPanel();
      if (!panel) return null;
      return panel.recipes.find(function (r) { return r.id === recipeId; }) || null;
    }

    function finish(reason) {
      alchemyRunning = false;
      setAlchemyFormDisabled(false);
      alchemyFab.textContent = "🧪 自動煉金";
      var reasonText = {
        "target": "✅ 已達成設定的重複次數。",
        "budget": "⏸️ 已達到（或即將超過）預算上限，停止。",
        "blocked": "⏸️ 這個配方目前做不下去了（材料/金幣/技能不足），停止。",
        "gone": "⚠️ 找不到這個配方了（可能配方書用完，物品已經不在配方清單裡），停止。",
        "stopped": "⏹️ 已手動停止。"
      }[reason] || reason;
      if (summaryEl) {
        summaryEl.innerHTML = "<div>" + reasonText + "</div>" +
          "<div style='margin-top:8px;'>製作次數：<b>" + alchemyStats.attempts + "</b> 次　總共做出：<b>" + alchemyStats.totalMade + "</b> 個<br>" +
          "總花費：<b>" + fmt(alchemyStats.totalSpent) + "</b> 金幣</div>";
      }
      var statusSummaryEl = document.getElementById("iw-alchemy-status-summary");
      if (statusSummaryEl) { updateAlchemyStatusSummary(); statusSummaryEl.innerHTML += "<div style='margin-top:8px;'>" + reasonText + "</div>"; }
    }

    function step() {
      if (window.__iwAlchemyGeneration !== myAlchemyGeneration) return; // 這個 loader 已經被重新載入取代，舊的迴圈自己停下來
      if (alchemyStopFlag) { finish("stopped"); return; }
      if (alchemyStats.targetCount > 0 && alchemyStats.attempts >= alchemyStats.targetCount) { finish("target"); return; }
      if (alchemyStats.budget > 0 && alchemyStats.totalSpent >= alchemyStats.budget) { finish("budget"); return; }

      var recipe = findRecipe();
      if (!recipe) { finish("gone"); return; }

      var now = Date.now();
      if (recipe.readyAtMs > now) {
        alchemyTimer = setTimeout(step, recipe.readyAtMs - now + 50);
        return;
      }
      if (recipe.blocked) { finish("blocked"); return; }
      if (alchemyStats.budget > 0 && alchemyStats.totalSpent + (recipe.gold || 0) > alchemyStats.budget) { finish("budget"); return; }

      var goldBefore = session.player.gold;
      var ok = session.craftBomb(recipeId);
      if (!ok) { finish("blocked"); return; }
      var spent = Math.max(0, goldBefore - session.player.gold);
      alchemyStats.attempts++;
      alchemyStats.totalSpent += spent;
      alchemyStats.totalMade += recipe.count || 0;
      alchemyLog("第 " + alchemyStats.attempts + " 次：花費 " + fmt(spent) + " 金幣，預期做出 " + recipe.count + " 個（成功率 " + recipe.rate + "%，失敗會扣材料但拿不到成品）");
      updateAlchemyStatusSummary();

      var cooldownMs = 1200; // 讀不到新的 readyAtMs 時，先給一個保守的預設間隔，避免無冷卻配方緊繃連打
      var afterPanel = session.buildAlchemyPanel();
      var afterRecipe = afterPanel && afterPanel.recipes.find(function (r) { return r.id === recipeId; });
      if (afterRecipe && afterRecipe.readyAtMs > Date.now()) cooldownMs = afterRecipe.readyAtMs - Date.now() + 50;
      alchemyTimer = setTimeout(step, cooldownMs);
    }

    step();
  }

  alchemyFab.addEventListener("click", function () {
    if (alchemyRunning) {
      if (alchemyBackdrop) { closeAlchemyModal(); } // 已經在跑，點按鈕只是切換要不要看視窗，不會中斷背景執行
      else openAlchemyModal();
    } else {
      openAlchemyModal();
    }
  });

  // ==========================================================================
  // 自動重生：怪物池死光時（左上角那顆重生圈圈亮起的時機）自動幫忙按下去。
  // 純粹是布林值判斷（session.canRespawnPool），不用開視窗設定，一顆開關按鈕就夠。
  // 按鈕本體已經在上面跟自動煉金共用同一個浮動區塊建立好了，這裡只接邏輯。
  // ==========================================================================
  var respawnEnabled = false, respawnTimer = null;
  window.__iwRespawnGeneration = (window.__iwRespawnGeneration || 0) + 1;
  var myRespawnGeneration = window.__iwRespawnGeneration;

  function respawnLoop() {
    if (window.__iwRespawnGeneration !== myRespawnGeneration) return; // 舊的 loader 實例，自己停下來
    if (!respawnEnabled) return;
    try {
      if (session.canRespawnPool) {
        session.respawnPool();
        console.log("[自動重生] 怪物池空了，已自動重生。");
      }
    } catch (err) {
      console.error("[自動重生] 檢查/重生時發生錯誤", err);
    }
    respawnTimer = setTimeout(respawnLoop, 1000);
  }

  respawnFab.addEventListener("click", function () {
    respawnEnabled = !respawnEnabled;
    respawnFab.textContent = "🔄 自動重生：" + (respawnEnabled ? "開啟中" : "關閉");
    respawnFab.style.background = respawnEnabled ? "#7ea45a" : "#5a6b47";
    if (respawnEnabled) respawnLoop();
    else if (respawnTimer) clearTimeout(respawnTimer);
  });

  console.log("[一鍵強化] loader 已就緒，裝備卡片上「25,000」按鈕前面應該會看到「⚡強化」按鈕。");
})();
