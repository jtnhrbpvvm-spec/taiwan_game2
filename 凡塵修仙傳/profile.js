// 全站共用：把讀取過的角色資料暫存在這個分頁裡，讓其他攻略頁也能標出「你的進度」。
// 只存在瀏覽器的分頁工作階段（關掉分頁就清除），不會上傳到任何地方。
(function () {
  const KEY = "fcxx_profile";
  const REALMS = ["凡人", "煉氣", "築基", "金丹", "元嬰", "化神", "煉虛", "合體", "大乘", "渡劫", "仙人初境", "天仙", "真仙", "大羅金仙", "混元大羅金仙", "混沌道祖"];
  // 只保留各頁用得到的欄位（背包、僕從等不存）
  const KEEP = ["name", "gender", "realmIndex", "stage", "level", "sect", "sectSkills", "profession", "proficiency", "aptitude", "goldenCore",
    "titles", "fireCollection", "strangeFires", "fireShards", "partners", "partnerTeam", "partnerBond", "partnerShards", "beasts",
    "spells", "spellSlots", "spellShards", "equipment", "pillUsed", "studyCounts", "learnedSkills", "reincarnateBonus", "weakened",
    "zhenmo", "defenseBest", "karma", "merit", "butianStones", "raceKills", "raceTreasures", "raceTreasureSlots", "bountyKills", "reincarnations", "yuanshen", "huashenScrolls", "breakPills", "rootPills", "physiquePills", "spiritFruits", "talents", "talentRespecs", "refineStones", "craftCur", "_root", "_phy"];
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
  function banner() {
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
