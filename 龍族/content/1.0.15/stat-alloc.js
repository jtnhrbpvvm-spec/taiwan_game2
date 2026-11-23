// 自動配點、裝備條件判斷（主程式、設定視窗、小百科、遊戲網頁共用）。資料來自 codex-data.js。
(function (root) {
  "use strict";

  /** 已經配出去的點數＝目前能力 − 職業初始值（初始值不算自己配的）。 */
  function allocated(codex, classId, ab) {
    const cls = codex.classes.find((c) => c.id === classId);
    return codex.statKeys.map((k, i) => Math.max(0, (ab[i] || 0) - ((cls && cls.base[k]) || 0)));
  }

  /** 能力上限（跟遊戲 Fa() 一樣：職業＋轉職階段的上限）。 */
  function cap(codex, classId, dualStep, key) {
    const cls = codex.classes.find((c) => c.id === classId);
    const row = cls && cls.caps && (cls.caps[dualStep] || cls.caps[0]);
    return row && row[key] !== undefined ? row[key] : Infinity;
  }

  /**
   * 把 point 點照比例 ratio（{int:6, wsps:3, con:1}）分出去：每一點都給「目前最落後比例」的那一項，
   * 已經配超過比例的那項就先不加，一直分到點數用完或有比例的能力都到上限。
   * 回傳跟遊戲 allocate 一樣的格式：照 statKeys 順序的陣列，每格加幾點。
   */
  function plan(codex, ch, ratio) {
    const keys = codex.statKeys;
    const add = keys.map(() => 0);
    let left = Math.max(0, Math.floor(ch.point || 0));
    const have = allocated(codex, ch.classId, ch.ab || []);
    const w = keys.map((k) => Math.max(0, Number(ratio && ratio[k]) || 0));
    const room = keys.map((k, i) => cap(codex, ch.classId, ch.ds || 0, k) - (ch.ab[i] || 0));
    while (left > 0) {
      let best = -1, bestScore = Infinity;
      for (let i = 0; i < keys.length; i++) {
        if (!(w[i] > 0) || add[i] >= room[i]) continue;
        const score = (have[i] + add[i]) / w[i];
        if (score < bestScore || (score === bestScore && w[i] > w[best])) { best = i; bestScore = score; }
      }
      if (best < 0) break;
      add[best]++;
      left--;
    }
    return add;
  }

  /** 加點的說明，例如「智力 +6、魔法力量 +3、體質 +1」。 */
  function describe(codex, add) {
    return codex.statKeys.map((k, i) => (add[i] > 0 ? `${codex.statNames[k] || k} +${add[i]}` : "")).filter(Boolean).join("、");
  }

  /**
   * 這件裝備現在的角色能不能用（照遊戲 Ts()／Ds() 的判斷）。
   * ch：{ classId, level, ds, gender(1=男), nation, fame, abilities:{str,…,wsps}, skillLv:[13 個熟練等級] }
   * 回傳 [{ label, need, have, ok, short }]，全部 ok 才能用。
   */
  function check(codex, item, ch) {
    const out = [];
    const ab = ch.abilities || {};
    const need = item.need || {};
    const push = (label, n, h, ok, short) => out.push({ label, need: n, have: h, ok, ...(ok || short === undefined ? {} : { short }) });
    for (const k of ["str", "dex", "con", "endu", "cha", "mor", "movp", "luck"]) {
      if (need[k] > 0) push(codex.statNames[k], need[k], ab[k] ?? 0, (ab[k] ?? 0) >= need[k], need[k] - (ab[k] ?? 0));
    }
    if (need.wis > 0 && need.int > 0) {
      const ok = (ab.wis ?? 0) >= need.wis || (ab.int ?? 0) >= need.int;
      push("智慧或智力", `${need.wis}／${need.int}`, `${ab.wis ?? 0}／${ab.int ?? 0}`, ok, Math.min(need.wis - (ab.wis ?? 0), need.int - (ab.int ?? 0)));
    } else {
      if (need.wis > 0) push("智慧", need.wis, ab.wis ?? 0, (ab.wis ?? 0) >= need.wis, need.wis - (ab.wis ?? 0));
      if (need.int > 0) push("智力", need.int, ab.int ?? 0, (ab.int ?? 0) >= need.int, need.int - (ab.int ?? 0));
    }
    const spell = ch.classId === "priest" ? need.ps : need.ws;
    if (spell > 0) push("魔法力量", spell, ab.wsps ?? 0, (ab.wsps ?? 0) >= spell, spell - (ab.wsps ?? 0));
    if (item.skillNeed > 1 && item.skill !== undefined) {
      const lv = (ch.skillLv && ch.skillLv[item.skill]) || 1;
      push(`${codex.skills[item.skill]}熟練`, item.skillNeed, lv, lv >= item.skillNeed, item.skillNeed - lv);
    }
    if (need.gender) push("性別", need.gender === 1 ? "男" : "女", ch.gender === 1 ? "男" : "女", need.gender === (ch.gender === 1 ? 1 : 2));
    if (!item.thrown) {
      if (item.nations && ch.nation) push("國家", item.nations.map((n) => codex.nations[n] || n).join("、"), codex.nations[ch.nation] || ch.nation, item.nations.includes(ch.nation));
      if (need.fame > 0 && ch.fame !== undefined) push("名聲", need.fame, ch.fame, ch.fame >= need.fame, need.fame - ch.fame);
      if (need.level > 0) push("等級", need.level, ch.level ?? 0, (ch.level ?? 0) >= need.level, need.level - (ch.level ?? 0));
      if (need.dualStep > 0) push("轉職", `${need.dualStep} 轉`, `${ch.ds ?? 0} 轉`, (ch.ds ?? 0) >= need.dualStep);
      if (item.classes && !item.classes.includes(ch.classId)) push("職業", item.classes.map((c) => codex.classes.find((x) => x.id === c)?.name || c).join("、"), codex.classes.find((x) => x.id === ch.classId)?.name || ch.classId, false);
    }
    return out;
  }

  /**
   * 要能用這件裝備，各能力還差幾點（照 statKeys 順序的陣列，只算能力類的條件）。
   * 智慧、智力兩個都有要求時只要其中一個夠（遊戲規則），挑差比較少的那個補。
   * ch：{ classId, ds, ab:[…] }。overCap：需求超過能力上限、配點配不到的能力名稱。
   */
  function targetShort(codex, item, ch) {
    const keys = codex.statKeys;
    const ab = Object.fromEntries(keys.map((k, i) => [k, (ch.ab && ch.ab[i]) || 0]));
    const need = item.need || {};
    const want = {};
    for (const k of ["str", "dex", "con", "endu", "cha", "mor", "movp", "luck"]) if (need[k] > 0) want[k] = need[k];
    if (need.wis > 0 && need.int > 0) {
      if (ab.wis < need.wis && ab.int < need.int) {
        if (need.wis - ab.wis < need.int - ab.int) want.wis = need.wis; else want.int = need.int;
      }
    } else {
      if (need.wis > 0) want.wis = need.wis;
      if (need.int > 0) want.int = need.int;
    }
    const spell = ch.classId === "priest" ? need.ps : need.ws;
    if (spell > 0) want.wsps = Math.max(want.wsps || 0, spell);
    const overCap = [];
    const short = keys.map((k) => {
      if (!(want[k] > 0)) return 0;
      if (want[k] > cap(codex, ch.classId, ch.ds || 0, k)) overCap.push(codex.statNames[k] || k);
      return Math.max(0, want[k] - ab[k]);
    });
    return { short, total: short.reduce((a, b) => a + b, 0), overCap };
  }

  /**
   * 先把點數配到剛好能用目標裝備（點數不夠就先配一部分，每一點給還差最多的那項），
   * 剩下的點數有開比例配點才照比例分。回傳 { add, target:{short,total,overCap} }。
   */
  function planWithTarget(codex, ch, item, ratio, useRatio) {
    const keys = codex.statKeys;
    const add = keys.map(() => 0);
    let left = Math.max(0, Math.floor(ch.point || 0));
    let target = null;
    if (item) {
      target = targetShort(codex, item, ch);
      const room = keys.map((k, i) => Math.max(0, cap(codex, ch.classId, ch.ds || 0, k) - ((ch.ab && ch.ab[i]) || 0)));
      const rest = target.short.map((n, i) => Math.min(n, room[i]));
      while (left > 0) {
        let best = -1;
        for (let i = 0; i < keys.length; i++) if (rest[i] > 0 && (best < 0 || rest[i] > rest[best])) best = i;
        if (best < 0) break;
        add[best]++; rest[best]--; left--;
      }
    }
    if (useRatio && left > 0) {
      const more = plan(codex, { ...ch, ab: ch.ab.map((v, i) => v + add[i]), point: left }, ratio);
      more.forEach((n, i) => (add[i] += n));
    }
    return { add, target };
  }

  const api = { allocated, cap, plan, describe, check, targetShort, planWithTarget };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RajaStatAlloc = api;
})(globalThis);
