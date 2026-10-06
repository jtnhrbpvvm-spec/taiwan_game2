// 每次傷害的期望值：屬性觸發（冰火毒金雷）、命中、破甲、屬性秘典、種族剋制（「屬性與技能」頁使用）
(function () {
  const EX = /*EX*/{"title":{"slotSword":{"metal":1},"slotBlade":{"fire":1},"slotFan":{"ice":1},"slotBow":{"thunder":1},"slotBrush":{"poison":1},"elemMetal":{"elemDmg:金":0.02},"elemWood":{"elemDmg:木":0.02},"elemWater":{"elemDmg:水":0.02},"elemFire":{"elemDmg:火":0.02},"elemEarth":{"elemDmg:土":0.02}},"fire":{"f01":{"fire":5},"f04":{"metal":2},"f06":{"fire":3},"f08":{"fx:焚燼":0.3},"f11":{"metal":2,"fire":1},"f13":{"thunder":2,"fire":1},"f18":{"ice":2,"fire":1},"f19":{"ice":1,"fire":1},"f23":{"fire":2},"f26":{"thunder":1},"f28":{"poison":1,"fire":1},"f31":{"ice":2},"f33":{"fire":1},"f34":{"poison":1},"f37":{"ice":1},"f38":{"fx:蝕骨":0.05},"f40":{"thunder":1},"f45":{"fire":0.5},"f48":{"metal":1}},"partner":{"xiaoyan":{"fire":3,"fx:焚燼":0.3},"lifeiyu":{"fx:斬殺":0.2},"tangsan":{"poison":2},"hengren":{"poison":2},"wanglin":{"fx:斬殺":0.3},"leishen":{"thunder":4},"huoyuhao":{"ice":2},"mahongjun":{"fire":2,"fx:焚燼":0.2},"xiaoyixian":{"poison":3,"fx:蝕骨":0.2},"qinshuang":{"ice":1},"moyunteng":{"poison":1}},"rootPick":{"wind":[{"wind":15},{}],"thunder":[{"thunder":20},{}],"ice":[{"ice":20},{}],"dark":[{"dark":15},{"nature":"dark"}],"sun":[{"light":12},{"nature":"light"}],"moon":[{"ice":15},{}],"immortal":[{"light":8},{"nature":"light"}],"wuxing5":[{"metal":10,"ice":10,"fire":10},{}],"kongming":[{"fx:洞察":10},{}]},"rootGroup":{"true3":[{},{},0.2],"true2":[{},{},0.4],"heaven":[{},{},1]},"aff":{"金":{"metal":15},"水":{"ice":15},"火":{"fire":15}},"phys":{"metalBody":[{"metal":12},{}],"waterBody":[{"ice":12},{}],"fireBody":[{"fire":12},{}],"thunderBody":[{"thunder":12},{}],"iceBody":[{"ice":12},{}],"yinBody":[{"dark":8},{"nature":"dark"}],"yangBody":[{"light":8},{"nature":"light"}],"poisonBody":[{"poison":10},{"poisonImmune":1}],"holyBody":[{"light":8},{"nature":"light"}],"daoBody":[{},{"nature":"light"}],"doublePupil":[{"fx:洞察":12,"fx:破甲":10},{}]},"prof":{"bow":["fx:首擊",0.05]},"set":{"太乙":[[6,{"special:rage":1}]],"蒼龍":[[6,{"special:rage":1}]],"真武":[[6,{"special:rage":1}]],"祝融":[[6,{"special:rage":1}]],"盤古":[[6,{"special:rage":1}]],"神霄":[[6,{"special:echo":1}]],"太昊":[[6,{"special:echo":1}]],"玄女":[[6,{"special:echo":1}]],"羲和":[[6,{"special:echo":1}]],"黃庭":[[6,{"special:echo":1}]],"白帝":[[6,{"special:undying":1}]],"句芒":[[6,{"special:undying":1}]],"玄天":[[6,{"special:undying":1}]],"炎帝":[[6,{"special:undying":1}]],"軒轅":[[6,{"special:undying":1}]],"天樞":[[4,{"special:dodgeStrike":1}]],"瑤光":[[4,{"special:dodgeStrike":1}]],"洛神":[[4,{"special:dodgeStrike":1}]],"畢方":[[4,{"special:dodgeStrike":1}]],"須彌":[[4,{"special:dodgeStrike":1}]],"戮仙":[[2,{"metal":5}],[4,{"elemBoost:metal":0.2}],[6,{"cap:metal":10}]],"神農":[[2,{"poison":5}],[4,{"elemBoost:poison":0.2}],[6,{"cap:poison":10}]],"太陰":[[2,{"ice":5}],[4,{"elemBoost:ice":0.2}],[6,{"cap:ice":10}]],"三昧":[[2,{"fire":5}],[4,{"elemBoost:fire":0.2}],[6,{"cap:fire":10}]],"九州":[[2,{"thunder":5}],[4,{"elemBoost:thunder":0.2}],[6,{"cap:thunder":10}]]},"tal":{"gong2":{"fx:破甲":2},"gong3":{"fx:斬殺":0.06},"gong4":{"metal":2},"gong6":{"fx:首擊":0.2,"fx:燃魂":0.05},"fa3":{"thunder":2},"fa4":{"ice":2},"jin8":{"special:undying":1},"shen2":{"hit":2},"shen6":{"fx:洞察":3},"shen8":{"special:dodgeStrike":1},"ling8":{"special:rage":1}},"leg":{"wanjian":{"special:echo":1},"bumie":{"special:undying":1},"jinghua":{"special:dodgeStrike":1},"tiangang":{"special:rage":1},"xuanlei":{"thunder":10},"hanyu":{"ice":10,"fx:寒徹":0.3},"yehuo":{"fire":10,"fx:焚燼":0.6},"wandu":{"poison":10,"fx:蝕骨":0.6},"pojun":{"fx:破甲":20,"fx:斬殺":0.4},"tianyan":{"fx:洞察":12},"xianfa":{"fx:首擊":0.6,"fx:燃魂":0.15},"wuxing":{"fx:剋敵":0.3},"wudao":{"fx:通玄":0.3}},"resSingle":{},"resPure":{"水":["冰共鳴",{"ice":25,"freezeResist":0.5}],"火":["炎共鳴",{"fire":25,"burnMax":4}],"金":["罡共鳴",{"metal":25}],"木":["生共鳴",{}],"土":["岩共鳴",{}]},"resDual":{"金+水":{"byMain":{"水":["雷共鳴",{"thunder":25}],"金":["毒共鳴",{"poison":25}]}},"金+木":["庚共鳴",{"metal":20}],"金+火":["煉共鳴",{"metal":20}],"金+土":["鋒岩共鳴",{"metal":15}],"木+水":["榮共鳴",{}],"木+火":["焚共鳴",{"fire":20}],"木+土":["蠱共鳴",{"poison":20,"poisonMax":7}],"水+火":["既濟共鳴",{"ice":15,"fire":15}],"水+土":["瘴共鳴",{"poison":20}],"火+土":["熔共鳴",{"fire":20}]},"fx":{"破甲":[10,40],"首擊":[0.25,1],"剋敵":[0.08,0.4],"斬殺":[0.2,0.8],"燃魂":[0.08,0.4],"洞察":[5,20],"寒徹":[0.1,0.5],"焚燼":[0.2,1],"蝕骨":[0.2,1],"通玄":[0.1,0.6]},"ys":{"holyBody":["金",null,0.3],"daoBody":["木",null,0.3],"doublePupil":["水",null,0.3],"tyrantBody":["火",null,0.3],"supremeBone":["土",null,0.3],"chaosBody":[null,"thunder",0.3],"swordBody":["金",null,0.1],"bladeBody":["火",null,0.1],"fanBody":[null,"wind",0.1],"bowBody":["木",null,0.1],"fluteBody":["水",null,0.1],"brushBody":[null,"thunder",0.1]},"talis":{"ice":{"kind":"pct","race":null,"key":"ice","v":[1,2,3,5]},"fire":{"kind":"pct","race":null,"key":"fire","v":[1,2,3,5]},"poison":{"kind":"pct","race":null,"key":"poison","v":[1,2,3,5]},"metal":{"kind":"pct","race":null,"key":"metal","v":[1,2,3,5]},"thunder":{"kind":"pct","race":null,"key":"thunder","v":[1,2,3,5]},"rbeast":{"kind":"race","race":"beast","key":"rbeast","v":[3,6,10,15]},"rghost":{"kind":"race","race":"ghost","key":"rghost","v":[3,6,10,15]},"rdemon":{"kind":"race","race":"demon","key":"rdemon","v":[3,6,10,15]},"rheart":{"kind":"race","race":"heart","key":"rheart","v":[3,6,10,15]}},"resSup":["五行聖共鳴",{"ice":15,"fire":15,"poison":15,"metal":15,"thunder":15,"ignoreCounter":true}],"fxTier":{"紫色":1,"橙色":1.5,"白金":2},"C":{"AFFIX_CAP":50,"METAL_BONUS":1,"THUNDER_BONUS":0.3,"BURN_RATE":0.15,"BURN_TURNS":3,"BURN_MAX_STACKS":3,"POISON_RATE":0.08,"POISON_TURNS":3,"POISON_MAX_STACKS":5,"LIGHT_BONUS":0.3,"LIGHT_DARK_COUNTER_BONUS":0.3,"WUXING_COUNTER_BONUS":0.3,"WUXING_COUNTERED_PENALTY":0.3,"RACE_TALISMAN_CAP":0.2,"RACE_DMG_CAP":0.5,"hitPer":0.08,"evaK":100,"ELEMENT_BOOK_GAIN":0.0001,"WIND_HIT_MULT":0.6,"DARK_LIFESTEAL":0.2,"DARK_MAP_CATEGORIES":[4],"ROOT_SINGLE_COUNT":5,"ROOT_SUPREME_SETS":3,"ROOT_PURE_SETS":2,"ROOT_PURE_REST":6,"ROOT_DUAL_SETS":1,"ROOT_DUAL_REST":5,"PARTNER_LV5_PASSIVE_MULT":1.2,"RACE_TREASURE_CAP":0.15,"raceGearCap":0.09,"treasure":[0.05,0.1,0.15],"slay":{"beast":[[100,0.02],[1000,0.04],[10000,0.06]],"ghost":[[100,0.02],[1000,0.04],[10000,0.06]],"demon":[[2000,0.02],[20000,0.04],[30000,0.06]],"heart":[[50,0.02],[100,0.04],[200,0.06]]},"setQ":["紫色","橙色","白金"],"wxc":{"木":"土","土":"水","水":"火","火":"金","金":"木"}},"books":[["metal","《庚金劍典》","金","metal"],["wood","《乙木長生訣》","木",null],["water","《癸水真經》","水",null],["fire","《丙火焚天錄》","火","fire"],["earth","《戊土玄黃功》","土",null],["ice","《玄冰寒魄訣》",null,"ice"],["thunder","《九霄雷典》",null,"thunder"],["poison","《萬毒真經》",null,"poison"]],"monAttr":{"1":{"def":0,"eva":2,"affixProb":0.3,"affixChance":5},"2":{"def":5,"eva":4,"affixProb":0.5,"affixChance":10},"3":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15},"4":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15},"5":{"def":15,"eva":8,"affixProb":0.9,"affixChance":20},"6":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15}}}/*EX*/;
  const C = EX.C, AFF = ["ice", "fire", "poison", "metal", "thunder"], VAR = ["wind", "light", "dark"], WX = ["金", "木", "水", "火", "土"];
  const AFF_NAME = { ice: "冰（凍結）", fire: "火（燒傷）", poison: "毒（中毒）", metal: "金（重擊）", thunder: "雷（雷擊）", wind: "風（風擊）", light: "光（聖光）", dark: "暗（暗蝕）" };
  const dodge = d => { d = Math.max(0, d || 0); return d / (d + C.evaK); };

  // 你的攻擊面屬性。ctx：{ gdef(eq)→{fx,set}、elem 本命五行、agi 敏捷總值、aura 仙法光環合計、rank 職業階數、team [[夥伴id, 好感是否LV5]]、artifact(slot) 是否神器格 }
  function attrs(p, ctx) {
    const eqs = p.equipment || {}, ex = {}, from = {};
    const add = (label, b, m) => { for (const k in (b || {})) { const v = typeof b[k] === "number" ? b[k] * (m || 1) : b[k]; if (!v) continue; ex[k] = typeof v === "number" ? (ex[k] || 0) + v : v; const l = from[k] = from[k] || [], same = typeof v === "number" && l.find(x => x[0] === label); if (same) same[1] += v; else l.push([label, v]); } };
    const KI = k => AFF.includes(k) || VAR.includes(k) || k === "hit" || /^(cap|elemDmg|elemBoost|special):/.test(k) || (k.startsWith("fx:") && EX.fx[k.slice(3)]);
    // 隨機詞條
    const subs = {}; Object.values(eqs).forEach(eq => { if (eq && Array.isArray(eq.subs)) eq.subs.forEach(s => { if (s && KI(s[0])) subs[s[0]] = (subs[s[0]] || 0) + s[1]; }); }); add("裝備詞條", subs);
    // 套裝
    const cnt = {}; Object.values(eqs).forEach(eq => { const d = eq && ctx.gdef(eq); if (d && d.set && C.setQ.includes(eq.quality)) cnt[d.set] = (cnt[d.set] || 0) + 1; });
    for (const n in cnt) (EX.set[n] || []).forEach(([pc, b]) => { if (cnt[n] >= pc) add(n + "套裝", b); });
    (p.titles || []).forEach(id => add("稱號", EX.title[id]));
    if (EX.prof[p.profession]) add("職業被動", { [EX.prof[p.profession][0]]: EX.prof[p.profession][1] * (ctx.rank || 1) });
    for (const id in (p.fireCollection || {})) if (p.fireCollection[id] > 0) add("異火收錄", EX.fire[id]);
    (ctx.team || []).forEach(([id, lv5]) => add("夥伴", EX.partner[id], lv5 ? C.PARTNER_LV5_PASSIVE_MULT : 1));
    const natures = new Set(), apt = p.aptitude;
    if (apt) {
      const r = apt.root;
      if (r) {
        if (EX.rootPick[r.id]) { add("先天靈根", EX.rootPick[r.id][0]); if (EX.rootPick[r.id][1].nature) natures.add(EX.rootPick[r.id][1].nature); }
        else if (EX.rootGroup[r.group]) (r.elems || []).forEach(e => add("先天靈根", EX.aff[e], EX.rootGroup[r.group][2]));
      }
      const ph = EX.phys[apt.physique];
      if (ph) { add("先天體質", ph[0]); if (ph[1].nature) natures.add(ph[1].nature); }
    }
    Object.values(eqs).forEach(eq => { if (eq && eq.legend) add("傳奇威能", EX.leg[eq.legend]); });
    for (const id in (p.talents || {})) { const b = EX.tal[id], n = p.talents[id] || 0; if (b && n > 0) for (const k in b) add("天賦", { [k]: b[k] * (k.startsWith("special:") ? 1 : n) }); }
    // 五行共鳴
    const ec = {}; WX.forEach(e => ec[e] = 0);
    for (const k in eqs) { const eq = eqs[k]; if (eq && !ctx.artifact(k) && ec[eq.element] !== undefined) ec[eq.element]++; }
    const sets = Math.min(...WX.map(e => ec[e])), rest = {}; WX.forEach(e => rest[e] = ec[e] - sets);
    let sp = null;
    if (sets >= C.ROOT_SUPREME_SETS) sp = EX.resSup;
    else if (sets >= C.ROOT_PURE_SETS) { const pe = WX.find(e => rest[e] >= C.ROOT_PURE_REST); if (pe) sp = EX.resPure[pe]; }
    if (!sp && sets >= C.ROOT_DUAL_SETS) { const pair = WX.filter(e => rest[e] >= C.ROOT_DUAL_REST); if (pair.length >= 2) { let d = EX.resDual[pair[0] + "+" + pair[1]]; if (d && d.byMain) d = d.byMain[rest[pair[1]] > rest[pair[0]] ? pair[1] : pair[0]]; if (d) sp = d; } }
    const root = sp ? sp[1] : {};
    // 屬性觸發率：裝備本身＋符寶＋上面各來源＋五行共鳴＋仙法光環，一起套上限
    const aff = {}, affFrom = {}, cap = {};
    AFF.forEach(k => {
      const l = []; let gear = 0, sock = 0;
      Object.values(eqs).forEach(eq => { if (!eq) return; gear += (eq.stats && +eq.stats[k]) || 0; (Array.isArray(eq.sockets) ? eq.sockets : []).forEach(s => { const t = s && EX.talis[s.type]; if (t && t.kind !== "race" && s.type === k) sock += t.v[(s.grade || 1) - 1] || 0; }); });
      if (gear) l.push(["裝備本身", gear]); if (sock) l.push(["符寶", sock]);
      (from[k] || []).forEach(x => l.push(x));
      if (root[k]) l.push([sp[0], root[k]]);
      if (ctx.aura && ctx.aura[k]) l.push(["仙法光環", ctx.aura[k]]);
      cap[k] = C.AFFIX_CAP + (ex["cap:" + k] || 0);
      const raw = l.reduce((a, x) => a + x[1], 0);
      aff[k] = Math.max(0, Math.min(cap[k], raw)); affFrom[k] = l;
    });
    VAR.forEach(k => { cap[k] = C.AFFIX_CAP + (ex["cap:" + k] || 0); aff[k] = Math.max(0, Math.min(cap[k], ex[k] || 0)); affFrom[k] = from[k] || []; });
    // 裝備特效（紫色以上生效，各自有上限），詞條等來源的同名效果另外加
    const fx = {}, fxFrom = {};
    Object.values(eqs).forEach(eq => { const d = eq && ctx.gdef(eq), m = eq && EX.fxTier[eq.quality], info = d && EX.fx[d.fx]; if (!m || !info) return; fx[d.fx] = Math.min(info[1], (fx[d.fx] || 0) + info[0] * m); });
    for (const n in fx) fxFrom[n] = [["裝備特效", fx[n]]];
    for (const k in ex) if (k.startsWith("fx:")) { const n = k.slice(3); fx[n] = (fx[n] || 0) + ex[k]; fxFrom[n] = (fxFrom[n] || []).concat(from[k]); }
    const F = n => fx[n] || 0;
    // 屬性秘典
    const study = p.elementStudy || {}, boost = 1 + F("通玄"), book = { wuxing: {}, metal: 0, fire: 0, ice: 0, thunder: 0, poison: 0 };
    EX.books.forEach(([key, , wx, eff]) => { const v = (study[key] || 0) * C.ELEMENT_BOOK_GAIN * boost; if (wx) book.wuxing[wx] = v; if (eff) book[eff] = v; });
    const ysT = p.yuanshen && EX.ys[p.yuanshen.type];
    // 種族剋制的各部分（合計上限由 race() 套用）
    const raceP = {};
    Object.keys(C.slay).forEach(k => {
      const kills = (p.raceKills || {})[k] || 0; let slay = 0, tal = 0, tr = 0, gr = 0;
      C.slay[k].forEach(([n, b]) => { if (kills >= n) slay = b; });
      Object.values(eqs).forEach(eq => { if (!eq) return; (Array.isArray(eq.sockets) ? eq.sockets : []).forEach(s => { const t = s && EX.talis[s.type]; if (t && t.kind === "race" && t.race === k) tal += (t.v[(s.grade || 1) - 1] || 0) / 100; }); if (eq.raceFx && eq.raceFx.race === k) gr += +eq.raceFx.v || 0; });
      (p.raceTreasureSlots || []).forEach(id => { const x = id != null && (p.raceTreasures || []).find(y => y.id === id); if (x && x.race === k) tr += C.treasure[x.grade] || C.treasure[0]; });
      raceP[k] = { slay, tal, tr: Math.min(C.RACE_TREASURE_CAP, tr), gr: Math.min(C.raceGearCap, gr) };
    });
    return { aff, affFrom, cap, fx, fxFrom, pen: F("破甲"), evaPen: F("洞察") + (ctx.agi || 0) * C.hitPer + (ex.hit || 0), agiHit: (ctx.agi || 0) * C.hitPer, talHit: ex.hit || 0,
      book, elem: ctx.elem || null, ys: ysT || null, nature: natures.size === 1 ? [...natures][0] : null, ignoreCounter: !!root.ignoreCounter,
      elemDmg: ctx.elem ? ex["elemDmg:" + ctx.elem] || 0 : 0, elemBoost: Object.fromEntries(AFF.map(k => [k, ex["elemBoost:" + k] || 0])), raceP, resName: sp ? sp[0] : "" };
  }
  // 對某一族的剋制加成；extraTal＝手動加的剋制符（小數），和孔位上的剋制符一起套符寶上限
  function race(A, k, extraTal) {
    const r = A.raceP[k]; if (!r) return { v: 0, parts: [] };
    const tal = Math.min(C.RACE_TALISMAN_CAP, r.tal + (extraTal || 0)), raw = r.slay + tal + r.tr + r.gr;
    return { v: Math.min(C.RACE_DMG_CAP, raw), parts: [["斬妖錄", r.slay], ["剋制符", tal], ["剋制法寶", r.tr], ["裝備種族特效", r.gr]].filter(x => x[1] > 0), capped: raw > C.RACE_DMG_CAP };
  }

  // 一次出手的平均傷害。o：{ raw 原始傷害, power 攻擊力（持續傷害的基準）, mag 是否術法, path "main"｜"proc"｜"pet", crit 暴擊率 0～1, critDmg,
  //   target { def 減傷%, eva 閃避, nature, race }, vuln 敵人受傷倍率, race 種族剋制小數, petHit, petPen, on { ranhun, shouji, zhansha } }
  function hit(A, o) {
    const parts = [], P = (label, mult, note) => { if (Math.abs(mult - 1) > 1e-9) parts.push([label, mult, note || ""]); return mult; }, pct = v => +(v * 100).toFixed(2) + "%";
    const t = o.target || { def: 0, eva: 0 }, on = o.on || {};
    if (o.path === "pet") { const m = P("敵人受到的傷害增加", o.vuln || 1, "靈寵的控場技能"); return { direct: o.raw * m, dot: 0, total: o.raw * m, parts, pHit: 1, burn: 0, poison: 0 }; }
    let m = 1; const a = A.aff, bk = A.book, main = o.path === "main", eb = main ? A.elemBoost : {};
    const evaLeft = Math.max(0, (t.eva || 0) - A.evaPen - (o.petHit || 0)), pHit = 1 - dodge(evaLeft);
    m *= P("命中率", pHit, `敵人閃避 ${+(t.eva || 0).toFixed(1)} − 你的命中 ${+(A.evaPen + (o.petHit || 0)).toFixed(1)}`);
    if (main) {
      if (on.shouji && A.fx["首擊"]) m *= P("首擊（每波第一下）", 1 + A.fx["首擊"]);
      if (on.ranhun && A.fx["燃魂"]) m *= P("燃魂（氣血高於 80%）", 1 + A.fx["燃魂"]);
      if (on.zhansha && A.fx["斬殺"]) m *= P("斬殺（目標氣血低於 20%）", 1 + A.fx["斬殺"]);
      if (A.elemDmg) m *= P(`本命五行（${A.elem}）傷害`, 1 + A.elemDmg);
      m *= P("敵人受到的傷害增加", o.vuln || 1, "靈寵的控場技能");
    }
    m *= P("種族剋制", 1 + (o.race || 0));
    if (A.ys && A.ys[0] && A.elem === A.ys[0]) m *= P(`元神（${A.ys[0]}）`, 1 + A.ys[2]);
    if (A.elem && bk.wuxing[A.elem]) m *= P(`屬性秘典：本命五行（${A.elem}）`, 1 + bk.wuxing[A.elem]);
    const pm = a.metal / 100, mMult = (1 + C.METAL_BONUS) * (1 + bk.metal) * (1 + (eb.metal || 0));
    if (pm) m *= P("金重擊", 1 + pm * (mMult - 1), `${pct(pm)} 觸發，該次 ×${+mMult.toFixed(3)}`);
    const pt = a.thunder / 100, pd = a.dark / 100, tMult = (1 + C.THUNDER_BONUS) * (1 + bk.thunder) * (A.ys && A.ys[1] === "thunder" ? 1 + A.ys[2] : 1) * (1 + (eb.thunder || 0));
    const pen = A.pen + (o.petPen || 0), defLeft = Math.max(0, (t.def || 0) - pen), defF = 1 - defLeft / 100;
    const defNote = `減傷 ${+(t.def || 0).toFixed(1)}% − 你的破甲 ${+pen.toFixed(1)}`;
    m *= P(pt || pd ? "雷擊、暗蝕與敵人減傷（合併計算）" : "敵人減傷", pt * tMult + (1 - pt) * (pd + (1 - pd) * defF),
      [pt ? `雷擊 ${pct(pt)} 觸發，該次 ×${+tMult.toFixed(3)} 且無視減傷` : "", pd ? `暗蝕 ${pct(pd)} 觸發，無視減傷` : "", pt || pd ? `其餘吃敵人${defNote}` : defNote].filter(Boolean).join("；"));
    if (A.elem && !A.ignoreCounter) { const cb = A.fx["剋敵"] || 0; m *= P("五行相剋（敵人五行隨機，取平均）", ((1 + C.WUXING_COUNTER_BONUS) * (1 + cb) + (1 - C.WUXING_COUNTERED_PENALTY) + 3) / 5, cb ? `剋敵 +${pct(cb)}` : ""); }
    if (A.nature && t.nature && A.nature !== t.nature) m *= P("光暗互剋", 1 + C.LIGHT_DARK_COUNTER_BONUS);
    if (a.light) m *= P("聖光", 1 + a.light / 100 * C.LIGHT_BONUS, `${pct(a.light / 100)} 觸發，該次 +${pct(C.LIGHT_BONUS)}`);
    if (o.crit > 0) m *= P(o.mag ? "魔法暴擊" : "暴擊", 1 + o.crit * ((o.critDmg || 2) - 1), `${pct(o.crit)} 觸發，該次 ×${+(o.critDmg || 2).toFixed(2)}`);
    ["ice", "fire", "poison"].forEach(k => { if (eb[k] && a[k] && !(k === "poison" && t.race === "ghost")) m *= P(`套裝：${AFF_NAME[k]}觸發時加傷`, 1 + a[k] / 100 * eb[k]); });
    const direct = o.raw * m;
    // 持續傷害：整段總和 ÷ 持續回合＝每回合的量，乘上觸發率與命中率
    const ysFire = A.ys && A.ys[0] === "火" ? 1 + A.ys[2] : 1;
    const burn1 = o.power * C.BURN_RATE * (1 + bk.fire) * (1 + (A.fx["焚燼"] || 0)) * ysFire, poison1 = o.power * C.POISON_RATE * (1 + bk.poison) * (1 + (A.fx["蝕骨"] || 0));
    const burn = pHit * a.fire / 100 * burn1, poison = t.race === "ghost" ? 0 : pHit * a.poison / 100 * poison1;
    return { direct, dot: burn + poison, total: direct + burn + poison, parts, pHit, burn, poison, burn1, poison1, evaLeft, defLeft };
  }
  window.DMG = { EX, C, AFF, VAR, AFF_NAME, attrs, race, hit, dodge };
})();
