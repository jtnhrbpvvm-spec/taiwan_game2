// 全站共用：把讀取過的角色資料暫存在這個分頁裡，讓其他攻略頁也能標出「你的進度」。
// 只存在瀏覽器的分頁工作階段（關掉分頁就清除），不會上傳到任何地方。
(function () {
  const KEY = "fcxx_profile";
  const REALMS = ["凡人", "煉氣", "築基", "金丹", "元嬰", "化神", "煉虛", "合體", "大乘", "渡劫", "仙人初境", "天仙", "真仙", "大羅金仙", "混元大羅金仙", "混沌道祖"];
  // 只保留各頁用得到的欄位（背包、僕從等不存）
  const KEEP = ["name", "gender", "realmIndex", "stage", "level", "sect", "sectSkills", "profession", "proficiency", "aptitude", "goldenCore",
    "titles", "fireCollection", "strangeFires", "fireShards", "partners", "partnerTeam", "partnerBond", "partnerShards", "beasts",
    "spells", "spellSlots", "spellShards", "equipment", "pillUsed", "studyCounts", "learnedSkills", "reincarnateBonus", "weakened",
    "zhenmo", "defenseBest", "karma", "merit", "butianStones", "raceKills", "raceTreasures", "raceTreasureSlots", "bountyKills", "reincarnations", "yuanshen", "huashenScrolls", "breakPills", "rootPills", "physiquePills", "spiritFruits", "talents", "talentRespecs", "refineStones", "craftCur", "integrity", "_root", "_phy"];
  let store = null;
  try { store = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { store = null; }
  window.PROFILE = store && store.data ? store.data : null;
  window.PROFILE_AT = store ? store.at : 0;
  window.PROFILE_REALMS = REALMS;

  window.saveProfile = function (p) {
    const d = {};
    KEEP.forEach(k => { if (p[k] !== undefined) d[k] = p[k]; });
    window.PROFILE = d; window.PROFILE_AT = Date.now();
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: window.PROFILE_AT, data: d })); } catch (e) {}
    banner();
  };
  window.clearProfile = function () {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    window.PROFILE = null; window.PROFILE_AT = 0;
    banner();
  };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 讀到的存檔已被遊戲判定「存檔驗證異常」時，在畫面最上方用紅色閃字提醒是哪一種狀況
  function flagKind(reason) {
    const r = String(reason || "");
    if (/^修煉進度過快/.test(r)) return ["修煉進度過快", "新增的修煉進度超過「遊玩時數 × 60 倍＋2 小時」。"];
    if (/存檔代碼/.test(r)) return ["匯入的存檔代碼有問題", "匯入過被修改、或沒有簽章的存檔代碼。"];
    if (/簽章遺失/.test(r)) return ["存檔的簽章被拿掉", "本機存檔或匯入的代碼少了簽章，視同被修改。"];
    if (/存檔內容被修改/.test(r)) return ["本機存檔被改過", "存檔內容和簽章對不上。"];
    return ["原因不明", ""];
  }
  function flagBar() {
    let bar = document.getElementById("pfFlag");
    const ig = window.PROFILE && window.PROFILE.integrity;
    let hid = 0;
    try { hid = +sessionStorage.getItem(KEY + "_flagHide") || 0; } catch (e) {}
    // 按過關閉就不再顯示，直到重新讀取存檔
    if (!ig || !ig.flagged || hid === window.PROFILE_AT) { if (bar) bar.remove(); return; }
    if (!document.getElementById("pfFlagCss")) {
      const st = document.createElement("style"); st.id = "pfFlagCss";
      st.textContent = "#pfFlagX{position:absolute;top:4px;right:6px;width:32px;height:32px;border:1px solid rgba(255,255,255,.6);border-radius:6px;background:transparent;color:#fff;font-size:18px;line-height:1;cursor:pointer}#pfFlagX:hover{background:rgba(255,255,255,.18)}"
        + "#pfFlag{position:sticky;top:0;z-index:50;background:#b91c1c;color:#fff;padding:8px 46px 8px 14px;font-size:14px;line-height:1.7;text-align:center}"
        + "#pfFlag b{font-size:15px;animation:pfBlink 1s steps(1) infinite}#pfFlag a{color:#fff;text-decoration:underline}#pfFlag small{font-size:13px;opacity:.95}"
        + "@keyframes pfBlink{50%{color:#fde047}}@media (prefers-reduced-motion:reduce){#pfFlag b{animation:none}}";
      document.head.appendChild(st);
    }
    if (!bar) { bar = document.createElement("div"); bar.id = "pfFlag"; bar.setAttribute("role", "alert"); bar.setAttribute("data-noitm", ""); document.body.insertAdjacentElement("afterbegin", bar); }
    const k = flagKind(ig.reason);
    // 遊戲已放寬：2026/10/5 17:00（台灣時間）前的標記、以及舊門檻（低於 60 倍）下判的「修煉進度過快」，更新遊戲後會自動解除
    const lifted = ig.at < Date.UTC(2026, 9, 5, 9) || (/^修煉進度過快/.test(ig.reason || "") && (ig.speedMax || 10) < 60);
    bar.style.background = lifted ? "#166534" : "";
    bar.innerHTML = lifted
      ? `<b style="animation:none">✅ 這份存檔帶有舊的「存檔驗證異常」標記（${esc(k[0])}），遊戲已經放寬</b><br>`
        + `<small>把遊戲更新到最新版、開一次遊戲，標記就會自動解除，排行榜、寄售與世界 Boss 恢復使用。<br>`
        + `還沒更新前仍然無法進排行榜、無法寄售（拍賣）上架與出價。 <a href="常見問題.html#flagged">詳細說明</a></small>`
        + `<button id="pfFlagX" type="button" aria-label="關閉提醒" title="關閉提醒">✕</button>`
      : `<b>⚠️ 這份存檔已被判定「存檔驗證異常」：${esc(k[0])}</b><br>`
      + `<small>${esc(k[1])}${ig.reason ? `遊戲記錄的原因：「${esc(ig.reason)}」。` : ""}<br>`
      + `此存檔<u>無法進排行榜、無法使用寄售（拍賣）上架與出價</u>，也不能參加世界 Boss；單機遊玩不受影響。 <a href="常見問題.html#flagged">詳細說明</a></small>`
      + `<button id="pfFlagX" type="button" aria-label="關閉提醒" title="關閉提醒">✕</button>`;
    document.getElementById("pfFlagX").onclick = () => {
      try { sessionStorage.setItem(KEY + "_flagHide", String(window.PROFILE_AT)); } catch (e) {}
      bar.remove();
    };
  }
  function banner() {
    flagBar();
    const wrap = document.querySelector(".wrap");
    if (!wrap) return;
    let bar = document.getElementById("pfBar");
    const p = window.PROFILE;
    if (!p) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement("div"); bar.id = "pfBar";
      bar.style.cssText = "background:var(--card);border:1px solid var(--acc);border-radius:8px;padding:8px 12px;margin:8px 0 10px;font-size:13px;line-height:1.7;color:var(--mute);display:flex;gap:6px 14px;flex-wrap:wrap;align-items:center";
      const back = wrap.querySelector(".back");
      if (back) back.insertAdjacentElement("afterend", bar); else wrap.insertAdjacentElement("afterbegin", bar);
    }
    const t = new Date(window.PROFILE_AT), hm = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
    const onCalc = /%E5%B1%AC%E6%80%A7|屬性與技能/.test(location.pathname);
    bar.innerHTML = `<span>👤 已帶入角色：<b style="color:var(--fg)">${esc(p.name || "未命名")}</b>・${REALMS[p.realmIndex] || "?"} ${p.stage || 1} 階・Lv.${Number(p.level || 1).toLocaleString("zh-TW")}（${hm} 讀取）</span>`
      + `<span>各頁會標出你的進度；關掉這個分頁就會清除。</span>`
      + (onCalc ? "" : `<a href="屬性與技能.html">前往試算</a>`)
      + `<a href="#" id="pfClear">清除</a>`;
    document.getElementById("pfClear").onclick = e => { e.preventDefault(); window.clearProfile(); location.reload(); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", banner); else banner();
})();
