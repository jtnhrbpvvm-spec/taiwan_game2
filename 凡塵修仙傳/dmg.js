// 每次傷害的期望值：屬性觸發（冰火毒金雷）、命中、破甲、屬性秘典、種族剋制（「屬性與技能」頁使用）
(function () {
  const EX = /*EX*/{"title":{"slotSword":{"metal":1},"slotBlade":{"fire":1},"slotFan":{"ice":1},"slotBow":{"thunder":1},"slotBrush":{"poison":1},"elemMetal":{"elemDmg:金":0.02},"elemWood":{"elemDmg:木":0.02},"elemWater":{"elemDmg:水":0.02},"elemFire":{"elemDmg:火":0.02},"elemEarth":{"elemDmg:土":0.02}},"fire":{"f01":{"fire":5},"f02":{"fx:吸血":0.03},"f04":{"metal":2},"f06":{"fire":3},"f08":{"fx:焚燼":0.3},"f09":{"fx:回春":0.01},"f11":{"metal":2,"fire":1},"f13":{"thunder":2,"fire":1},"f15":{"fx:丹心":0.1},"f18":{"ice":2,"fire":1},"f19":{"ice":1,"fire":1},"f23":{"fire":2},"f26":{"thunder":1},"f28":{"poison":1,"fire":1},"f31":{"ice":2},"f33":{"fire":1},"f34":{"poison":1},"f35":{"fx:丹心":0.05},"f37":{"ice":1},"f38":{"fx:蝕骨":0.05},"f40":{"thunder":1},"f45":{"fire":0.5},"f47":{"fx:吸血":0.005},"f48":{"metal":1}},"partner":{"xiaoyan":{"fire":3,"fx:焚燼":0.3},"lindong":{"fx:吸血":0.03},"dashanren":{"fx:疾風":0.03},"lifeiyu":{"fx:斬殺":0.2},"hanli":{"fx:丹心":0.2},"tangsan":{"fx:追擊":0.08,"poison":2},"hengren":{"poison":2},"douzhan":{"fx:疾風":0.04},"hengyu":{"fx:丹心":0.2},"qingdi":{"fx:回春":0.015},"wanglin":{"fx:斬殺":0.3},"menghao":{"fx:丹心":0.2},"zhangxiaofan":{"fx:吸血":0.02},"leishen":{"thunder":4},"huoyuhao":{"ice":2},"guyuena":{"fx:回春":0.015},"aosika":{"fx:丹心":0.2},"mahongjun":{"fire":2,"fx:焚燼":0.2},"xiaoyixian":{"poison":3,"fx:蝕骨":0.2},"xuxin":{"fx:丹心":0.15},"qinshuang":{"ice":1},"moyunteng":{"poison":1}},"rootPick":{"wind":[{"wind":15},{}],"thunder":[{"thunder":20},{}],"ice":[{"ice":20,"fx:定神":0.3},{}],"dark":[{"dark":15},{"nature":"dark"}],"sun":[{"light":12},{"nature":"light"}],"moon":[{"ice":15},{}],"immortal":[{"light":8},{"nature":"light"}],"wuxing5":[{"metal":10,"ice":10,"fire":10,"fx:回春":0.01},{}],"kongming":[{"fx:洞察":10},{}]},"rootGroup":{"true3":[{},{},0.2],"true2":[{},{},0.4],"heaven":[{},{},1]},"aff":{"金":{"metal":15},"木":{"fx:回春":0.01},"水":{"ice":15},"火":{"fire":15}},"phys":{"metalBody":[{"metal":12},{}],"woodBody":[{"fx:回春":0.008},{}],"waterBody":[{"ice":12},{}],"fireBody":[{"fire":12},{}],"thunderBody":[{"thunder":12},{}],"iceBody":[{"ice":12,"fx:定神":0.3},{}],"yinBody":[{"dark":8},{"nature":"dark"}],"yangBody":[{"light":8},{"nature":"light"}],"herbBody":[{"fx:丹心":0.5,"fx:回春":0.004},{}],"poisonBody":[{"poison":10},{"poisonImmune":1}],"holyBody":[{"light":8},{"nature":"light"}],"daoBody":[{},{"nature":"light"}],"tyrantBody":[{"fx:噬魂":0.02},{}],"doublePupil":[{"fx:洞察":12,"fx:破甲":10},{}]},"prof":{"bow":["fx:首擊",0.05]},"set":{"太乙":[[6,{"special:rage":1}]],"蒼龍":[[6,{"special:rage":1}]],"真武":[[6,{"special:rage":1}]],"祝融":[[6,{"special:rage":1}]],"盤古":[[6,{"special:rage":1}]],"神霄":[[6,{"special:echo":1}]],"太昊":[[6,{"special:echo":1}]],"玄女":[[6,{"special:echo":1}]],"羲和":[[6,{"special:echo":1}]],"黃庭":[[6,{"special:echo":1}]],"白帝":[[6,{"special:undying":1}]],"句芒":[[6,{"special:undying":1}]],"玄天":[[6,{"special:undying":1}]],"炎帝":[[6,{"special:undying":1}]],"軒轅":[[6,{"special:undying":1}]],"天樞":[[4,{"special:dodgeStrike":1}]],"瑤光":[[4,{"special:dodgeStrike":1}]],"洛神":[[4,{"special:dodgeStrike":1}]],"畢方":[[4,{"special:dodgeStrike":1}]],"須彌":[[4,{"special:dodgeStrike":1}]],"戮仙":[[2,{"metal":5}],[4,{"elemBoost:metal":0.2}],[6,{"cap:metal":10}]],"神農":[[2,{"poison":5}],[4,{"elemBoost:poison":0.2}],[6,{"cap:poison":10}]],"太陰":[[2,{"ice":5}],[4,{"elemBoost:ice":0.2}],[6,{"cap:ice":10}]],"三昧":[[2,{"fire":5}],[4,{"elemBoost:fire":0.2}],[6,{"cap:fire":10}]],"九州":[[2,{"thunder":5}],[4,{"elemBoost:thunder":0.2}],[6,{"cap:thunder":10}]]},"tal":{"gong2":{"fx:破甲":2},"gong3":{"fx:斬殺":0.06},"gong4":{"metal":2},"gong6":{"fx:首擊":0.2,"fx:燃魂":0.05},"fa3":{"thunder":2},"fa4":{"ice":2},"fa6":{"fx:連雷":0.3},"jin3":{"fx:回春":0.003},"jin4":{"fx:金身":0.02},"jin5":{"fx:先手盾":5},"jin6":{"fx:化勁":0.03},"jin8":{"special:undying":1},"shen2":{"hit":2},"shen3":{"fx:追擊":0.02},"shen4":{"fx:疾風":0.01},"shen5":{"fx:閃擊":0.3},"shen6":{"fx:洞察":3},"shen8":{"special:dodgeStrike":1,"fx:追擊":0.08},"ling2":{"fx:反震":0.02},"ling3":{"fx:噬魂":0.01},"ling4":{"fx:吸血":0.01},"ling6":{"fx:橫掃":0.05},"ling8":{"special:rage":1,"fx:橫掃":0.1},"zao6":{"fx:丹心":0.1}},"leg":{"wanjian":{"special:echo":1},"bumie":{"special:undying":1},"jinghua":{"special:dodgeStrike":1},"tiangang":{"special:rage":1},"xuanlei":{"thunder":10,"fx:連雷":1},"hanyu":{"ice":10,"fx:寒徹":0.3},"yehuo":{"fire":10,"fx:焚燼":0.6},"wandu":{"poison":10,"fx:蝕骨":0.6,"fx:毒爆":1},"pojun":{"fx:破甲":20,"fx:斬殺":0.4},"tianyan":{"fx:洞察":12,"fx:追擊":0.1},"xuehai":{"fx:吸血":0.06,"fx:噬魂":0.06},"taiyi":{"fx:回春":0.02},"jingang":{"fx:金身":0.1},"huhun":{"fx:化勁":0.1},"xianfa":{"fx:首擊":0.6,"fx:燃魂":0.15},"jifeng":{"fx:疾風":0.08,"fx:追擊":0.08},"wuxing":{"fx:剋敵":0.3},"wudao":{"fx:通玄":0.3}},"resSingle":{},"resPure":{"水":["冰共鳴",{"ice":25,"freezeResist":0.5}],"火":["炎共鳴",{"fire":25,"burnMax":4}],"金":["罡共鳴",{"metal":25}],"木":["生共鳴",{}],"土":["岩共鳴",{}]},"resDual":{"金+水":{"byMain":{"水":["雷共鳴",{"thunder":25}],"金":["毒共鳴",{"poison":25}]}},"金+木":["庚共鳴",{"metal":20}],"金+火":["煉共鳴",{"metal":20}],"金+土":["鋒岩共鳴",{"metal":15}],"木+水":["榮共鳴",{}],"木+火":["焚共鳴",{"fire":20}],"木+土":["蠱共鳴",{"poison":20,"poisonMax":7}],"水+火":["既濟共鳴",{"ice":15,"fire":15}],"水+土":["瘴共鳴",{"poison":20}],"火+土":["熔共鳴",{"fire":20}]},"fx":{"追擊":[0.08,0.3],"破甲":[10,40],"吸血":[0.03,0.15],"噬魂":[0.03,0.15],"橫掃":[0.1,0.35],"首擊":[0.25,1],"剋敵":[0.08,0.4],"斬殺":[0.2,0.8],"疾風":[0.05,0.2],"燃魂":[0.08,0.4],"洞察":[5,20],"寒徹":[0.1,0.5],"焚燼":[0.2,1],"蝕骨":[0.2,1],"毒爆":[1,4],"連雷":[0.5,1.5],"反震":[0.08,0.4],"護體":[8,30],"先手盾":[10,30],"回春":[0.01,0.05],"定神":[0.15,0.6],"閃擊":[0.8,2.4],"金身":[0.06,0.3],"化勁":[0.06,0.3],"丹心":[0.15,0.6],"通玄":[0.1,0.6]},"ys":{"holyBody":["金",null,0.3],"daoBody":["木",null,0.3],"doublePupil":["水",null,0.3],"tyrantBody":["火",null,0.3],"supremeBone":["土",null,0.3],"chaosBody":[null,"thunder",0.3],"swordBody":["金",null,0.1],"bladeBody":["火",null,0.1],"fanBody":[null,"wind",0.1],"bowBody":["木",null,0.1],"fluteBody":["水",null,0.1],"brushBody":[null,"thunder",0.1]},"talis":{"ice":{"kind":"pct","race":null,"key":"ice","v":[1,2,3,5]},"fire":{"kind":"pct","race":null,"key":"fire","v":[1,2,3,5]},"poison":{"kind":"pct","race":null,"key":"poison","v":[1,2,3,5]},"metal":{"kind":"pct","race":null,"key":"metal","v":[1,2,3,5]},"thunder":{"kind":"pct","race":null,"key":"thunder","v":[1,2,3,5]},"rbeast":{"kind":"race","race":"beast","key":"rbeast","v":[3,6,10,15]},"rghost":{"kind":"race","race":"ghost","key":"rghost","v":[3,6,10,15]},"rdemon":{"kind":"race","race":"demon","key":"rdemon","v":[3,6,10,15]},"rheart":{"kind":"race","race":"heart","key":"rheart","v":[3,6,10,15]}},"resSup":["五行聖共鳴",{"ice":15,"fire":15,"poison":15,"metal":15,"thunder":15,"ignoreCounter":true}],"fxTier":{"紫色":1,"橙色":1.5,"白金":2},"C":{"AFFIX_CAP":50,"METAL_BONUS":1,"THUNDER_BONUS":0.3,"BURN_RATE":0.15,"BURN_TURNS":3,"BURN_MAX_STACKS":3,"POISON_RATE":0.08,"POISON_TURNS":3,"POISON_MAX_STACKS":5,"LIGHT_BONUS":0.3,"LIGHT_DARK_COUNTER_BONUS":0.3,"WUXING_COUNTER_BONUS":0.3,"WUXING_COUNTERED_PENALTY":0.3,"RACE_TALISMAN_CAP":0.2,"RACE_DMG_CAP":0.5,"hitPer":0.08,"evaK":100,"ELEMENT_BOOK_GAIN":0.0001,"WIND_HIT_MULT":0.6,"DARK_LIFESTEAL":0.2,"comboCap":10,"comboPer":0.04,"monType":{"balanced":["均衡",0,0,0],"tank":["皮厚",15,-10,0],"agile":["敏捷",-5,0,15],"brute":["猛攻",0,0,0],"caster":["術法",-5,15,5]},"DARK_MAP_CATEGORIES":[4],"ROOT_SINGLE_COUNT":5,"ROOT_SUPREME_SETS":3,"ROOT_PURE_SETS":2,"ROOT_PURE_REST":6,"ROOT_DUAL_SETS":1,"ROOT_DUAL_REST":5,"PARTNER_LV5_PASSIVE_MULT":1.2,"RACE_TREASURE_CAP":0.15,"raceGearCap":0.09,"treasure":[0.05,0.1,0.15],"slay":{"beast":[[100,0.02],[1000,0.04],[10000,0.06]],"ghost":[[100,0.02],[1000,0.04],[10000,0.06]],"demon":[[2000,0.02],[20000,0.04],[30000,0.06]],"heart":[[50,0.02],[100,0.04],[200,0.06]]},"setQ":["紫色","橙色","白金"],"wxc":{"木":"土","土":"水","水":"火","火":"金","金":"木"}},"books":[["metal","《庚金劍典》","金","metal"],["wood","《乙木長生訣》","木",null],["water","《癸水真經》","水",null],["fire","《丙火焚天錄》","火","fire"],["earth","《戊土玄黃功》","土",null],["ice","《玄冰寒魄訣》",null,"ice"],["thunder","《九霄雷典》",null,"thunder"],["poison","《萬毒真經》",null,"poison"]],"monAttr":{"1":{"def":0,"eva":2,"affixProb":0.3,"affixChance":5},"2":{"def":5,"eva":4,"affixProb":0.5,"affixChance":10},"3":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15},"4":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15},"5":{"def":15,"eva":8,"affixProb":0.9,"affixChance":20},"6":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15}},"st":{"minRealm":0,"maxRealm":10,"respawn":3,"str":30,"wave":[1,3],"rest":0.03,"variance":0.1,"critDmg":2,"defK":120,"mdefFromDef":0.6,"shieldMax":0.2,"cd":5,"skillChance":0.15,"sk":{"heavy":{"mult":1.8},"bite":{"lifesteal":0.3},"poison":{},"flame":{},"frost":{},"sunder":{"def":0.2,"turns":3},"rage":{"hpBelow":0.3,"atk":0.5},"heal":{"pct":0.1,"maxUses":2},"phantom":{"eva":20,"turns":3}},"freeze":1,"lightHeal":0.01,"affix":[0.5,10,["ice","poison","thunder"],1.5],"potions":[["凝血草",0.05,50,0],["培元丹",0.1,200,0],["九轉還魂丹",0.3,500,1]],"base":[[1323,24.23,1.232,1.012833,47.3816],[1688,26.26,2.552,1.026583,45.5032],[2103,21.32,3.872,1.040333,43.8844],[2572,20.5,5.192,1.054083,42.5547],[2922,22.15,6.512,1.067833,39.3115],[3268,23.92,7.832,1.081583,38.6262],[3629,25.81,9.152,1.095333,37.9884],[4004,27.83,10.472,1.109083,37.4728],[4394,29.98,11.792,1.122833,37.0647],[4799,32.28,13.112,1.136583,36.6792],[5099,34.74,14.432,1.150333,35.4968]],"mon":[{"id":"dragon","n":"青鱗蒼龍","w":1,"race":"beast","mag":0,"cast":0,"hp":1.1,"atk":0.814001,"def":5,"mres":5,"eva":4,"evaT":0,"crit":0.05,"sk":["frost"],"steal":0},{"id":"tiger","n":"雪紋白虎","w":1,"race":"beast","mag":0,"cast":0,"hp":0.935,"atk":0.808513,"def":5,"mres":5,"eva":4,"evaT":0,"crit":0.12,"sk":["heavy","rage"],"steal":0},{"id":"qilin","n":"焰蹄麒麟","w":1,"race":"beast","mag":0,"cast":0,"hp":1.21,"atk":0.674397,"def":20,"mres":0,"eva":4,"evaT":0,"crit":0.03,"sk":["flame","heal"],"steal":0},{"id":"fox","n":"九尾天狐","w":1,"race":"beast","mag":0,"cast":0,"hp":0.88,"atk":0.990104,"def":0,"mres":5,"eva":4,"evaT":15,"crit":0.08,"sk":["phantom"],"steal":0},{"id":"phoenix","n":"赤羽火鳳","w":1,"race":"beast","mag":1,"cast":1,"hp":0.99,"atk":1.000805,"def":0,"mres":20,"eva":4,"evaT":5,"crit":0.05,"sk":["flame"],"steal":0},{"id":"turtle","n":"玄甲靈龜","w":1,"race":"beast","mag":0,"cast":0,"hp":1.21,"atk":0.640211,"def":20,"mres":0,"eva":4,"evaT":0,"crit":0.03,"sk":["heal","frost"],"steal":0},{"id":"spider","n":"碧眼毒蛛","w":1,"race":"beast","mag":0,"cast":0,"hp":0.88,"atk":1.018665,"def":0,"mres":5,"eva":4,"evaT":15,"crit":0.08,"sk":["poison"],"steal":0},{"id":"ghostGen","n":"幽冥鬼將","w":1,"race":"ghost","mag":1,"cast":1,"hp":0.9,"atk":0.977745,"def":0,"mres":20,"eva":9,"evaT":5,"crit":0.05,"sk":["frost","sunder"],"steal":0},{"id":"yaksha","n":"青面夜叉","w":1,"race":"ghost","mag":0,"cast":0,"hp":0.85,"atk":0.990962,"def":5,"mres":5,"eva":9,"evaT":0,"crit":0.12,"sk":["bite","heavy"],"steal":0},{"id":"zombie","n":"百年殭屍","w":1,"race":"ghost","mag":0,"cast":0,"hp":1.1,"atk":0.728679,"def":20,"mres":0,"eva":9,"evaT":0,"crit":0.03,"sk":["poison","bite"],"steal":0},{"id":"wraith","n":"怨魂","w":1,"race":"ghost","mag":0,"cast":0,"hp":0.8,"atk":0.990104,"def":0,"mres":5,"eva":9,"evaT":15,"crit":0.08,"sk":["phantom"],"steal":0}],"cult":{"rep":8000,"realm":3,"p":[0.05,0.04],"mult":[1.5,3],"karma":[1000,-1000],"steal":0.1,"def":5,"eva":4},"upkeep":10000,"rewardCap":3},"xm":{"minRealm":10,"maxRealm":15,"respawn":1,"str":1,"wave":[1,3],"rest":0.03,"variance":0.1,"critDmg":2,"defK":120,"mdefFromDef":0.6,"shieldMax":0.2,"cd":5,"skillChance":0.15,"sk":{"heavy":{"mult":1.8},"bite":{"lifesteal":0.3},"poison":{},"flame":{},"frost":{},"sunder":{"def":0.2,"turns":3},"rage":{"hpBelow":0.3,"atk":0.5},"heal":{"pct":0.1,"maxUses":2},"phantom":{"eva":20,"turns":3}},"freeze":1,"lightHeal":0.01,"affix":[0.9,20,["ice","poison","thunder"],1.5],"potions":[["凝血草",0.05,50,0],["培元丹",0.1,200,0],["九轉還魂丹",0.3,500,1]],"base":[[169.9828,1.158051,14.432,1.150333,17.4537,[10,15]],[179.7647,1.245441,15.752,1.164083,17.3084,[10,15]],[189.7508,1.338675,17.072,1.177833,58.622,[40,50]],[199.9411,1.438118,18.392,1.191583,127.6678,[80,120]],[210.3355,1.54416,19.712,1.205333,176.7258,[120,160]],[220.9342,1.65721,21.032,1.219083,225.199,[160,200]]],"mon":[{"id":"dragon","n":"青鱗蒼龍","w":2,"race":"beast","mag":0,"cast":0,"hp":1.1,"atk":0.814001,"def":15,"mres":15,"eva":8,"evaT":0,"crit":0.05,"sk":["frost"],"steal":0},{"id":"phoenix","n":"赤羽火鳳","w":2,"race":"beast","mag":1,"cast":1,"hp":0.99,"atk":1.006692,"def":10,"mres":30,"eva":8,"evaT":5,"crit":0.05,"sk":["flame"],"steal":0},{"id":"qilin","n":"焰蹄麒麟","w":2,"race":"beast","mag":0,"cast":0,"hp":1.21,"atk":0.65952,"def":30,"mres":5,"eva":8,"evaT":0,"crit":0.03,"sk":["flame","heal"],"steal":0},{"id":"bloodCult","n":"血煞魔修","w":2,"race":"demon","mag":1,"cast":0,"hp":0.85,"atk":0.905535,"def":15,"mres":15,"eva":8,"evaT":0,"crit":0.12,"sk":["rage","bite"],"steal":0.1},{"id":"sorcerer","n":"魔道術士","w":2,"race":"demon","mag":1,"cast":1,"hp":0.9,"atk":1.015699,"def":10,"mres":30,"eva":8,"evaT":5,"crit":0.05,"sk":["flame","poison"],"steal":0.1},{"id":"puppet","n":"傀儡魔偶","w":2,"race":"demon","mag":1,"cast":0,"hp":1.1,"atk":0.685715,"def":30,"mres":5,"eva":8,"evaT":0,"crit":0.03,"sk":["sunder","heavy"],"steal":0.1}],"cult":{"rep":8000,"realm":3,"p":[0.05,0.04],"mult":[1.5,3],"karma":[1000,-1000],"steal":0.1,"def":15,"eva":8},"upkeep":0,"rewardCap":0}}/*EX*/;
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
      elemDmg: ctx.elem ? ex["elemDmg:" + ctx.elem] || 0 : 0, elemBoost: Object.fromEntries(AFF.map(k => [k, ex["elemBoost:" + k] || 0])), raceP, resName: sp ? sp[0] : "",
      poisonMax: root.poisonMax || C.POISON_MAX_STACKS, rage: !!ex["special:rage"], echo: !!ex["special:echo"], undying: !!ex["special:undying"] };
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
    let m = 1; const a = Object.assign({}, A.aff), bk = A.book, main = o.path === "main", eb = main ? A.elemBoost : {};
    // 招式自帶的屬性效果、牽制招的定身：和你原本的觸發率取較高的
    if (o.effect && o.effect.type) a[o.effect.type] = Math.max(a[o.effect.type] || 0, o.effect.chance * 100);
    if (o.freeze) a.ice = Math.max(a.ice || 0, o.freeze * 100);
    const evaLeft = Math.max(0, (t.eva || 0) - A.evaPen - (o.petHit || 0)), pHit = 1 - dodge(evaLeft);
    if (o.ysWind && A.ys && A.ys[1] === "wind") m *= P("元神（風）", 1 + A.ys[2]);
    if (o.frozen) { const fz = (1 + bk.ice) * (1 + (A.fx["寒徹"] || 0)); m *= P("對凍結中的敵人", fz, [bk.ice ? `玄冰秘典 +${pct(bk.ice)}` : "", A.fx["寒徹"] ? `寒徹 +${pct(A.fx["寒徹"])}` : ""].filter(Boolean).join("、")); }
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
    const tdef = o.mag && typeof t.mres === "number" ? t.mres : (t.def || 0), tdefName = o.mag && typeof t.mres === "number" ? "魔抗" : "減傷";
    const pen = A.pen + (o.petPen || 0), defLeft = Math.max(0, tdef - pen), defF = 1 - defLeft / 100;
    const defNote = `${tdefName} ${+tdef.toFixed(1)}% − 你的破甲 ${+pen.toFixed(1)}`, comb = pt * tMult + (1 - pt) * (pd + (1 - pd) * defF);
    m *= P(pt || pd ? `雷擊、暗蝕與敵人${tdefName}（合併計算）` : `敵人${tdefName}`, comb,
      [pt ? `雷擊 ${pct(pt)} 觸發，該次 ×${+tMult.toFixed(3)} 且無視減傷` : "", pd ? `暗蝕 ${pct(pd)} 觸發，無視減傷` : "", pt || pd ? `其餘吃敵人的${defNote}` : defNote].filter(Boolean).join("；"));
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
    // 連鎖：雷擊時再劈另一名敵人（連雷）、中毒疊滿引爆（毒爆，平均每疊滿一次才爆一次）
    const chainT = main && (o.n || 1) > 1 && A.fx["連雷"] && pt ? direct * (pt * tMult / comb) * A.fx["連雷"] : 0;
    const burstP = main && A.fx["毒爆"] && t.race !== "ghost" ? pHit * a.poison / 100 / A.poisonMax : 0, chainB = burstP * (o.phys || o.power) * (A.fx["毒爆"] || 0);
    return { direct, dot: burn + poison, total: direct + burn + poison + chainT + chainB, parts, pHit, burn, poison, burn1, poison1, evaLeft, defLeft, chainT, chainB, aff: a };
  }
  // 一次普通攻擊：本體＋連擊、橫掃、物攻套裝的「之怒」。base＝hit() 的參數（不含 raw），phys＝物理攻擊，combo＝連擊率 0～1，n＝敵人數
  function normal(A, base, phys, combo, n, val) {
    val = val || (x => x.total);
    const H = mult => hit(A, Object.assign({}, base, { raw: phys * mult, power: phys, phys, mag: false, path: "main", n })), h = H(1), add = [];
    if (combo > 0) add.push(["連擊", combo * val(h), `${+(combo * 100).toFixed(2)}% 再打一次普通攻擊`]);
    if (A.fx["橫掃"] && n > 1) add.push(["橫掃", A.fx["橫掃"] * (n - 1) * val(H(0.4)), `${+(A.fx["橫掃"] * 100).toFixed(1)}% 波及其他 ${n - 1} 隻，各 ×0.4`]);
    if (A.rage) add.push(["物攻套裝「之怒」", 0.15 * n * val(H(1.5)), `15% 對全部 ${n} 隻各打 ×1.5`]);
    return { h, add, total: val(h) + add.reduce((s, x) => s + x[1], 0) };
  }
  // 每回合另外的追加攻擊：追擊（裝備特效）、風擊（變異屬性），回傳 [名稱, 機率, 那一下的結果]
  function extras(A, base, phys, n) {
    const H = (mult, o) => hit(A, Object.assign({}, base, { raw: phys * mult, power: phys, phys, mag: false, path: "main", n }, o || {})), out = [];
    if (A.fx["追擊"]) out.push(["追擊", A.fx["追擊"], H(0.6)]);
    if (A.aff.wind > 0) out.push(["風擊", A.aff.wind / 100, H(C.WIND_HIT_MULT, { ysWind: true })]);
    return out;
  }
  // 時空秘境／仙魔戰場的存活模擬（o.S 指定地圖資料，預設 EX.st 時空秘境；EX.xm＝仙魔戰場，妖獸強度每隻在範圍內隨機）：照遊戲每秒一回合的規則實際打 n 場、每場最多 T 秒，回傳撐過 10 分鐘／1 小時的比例與存活時間中位數。
  //   I：{ r 境界, hp, atk 每下攻擊, mag 是否術法, skill 技能期望倍率, crit, critDmg, combo, pen 破甲, hit 命中, def, mdef, eva, jin 金身, huajin 化勁,
  //        life 吸血, soul 噬魂, regen 回春, reflect 反震, shield 先手盾（防禦點）, huti 護體（防禦點）, undying 套裝不死, fr 抗凍結, light, dark, potion {th 門檻 %, amt 回復比例},
  //        cult／amb 每波混入野外修士／暗殺者的機率（0～1）, ambDemon 暗殺者是否為魔道,
  //        aff 你的屬性觸發率 %（ice 凍結、fire 燒傷、poison 中毒、metal 重擊、thunder 雷擊）, elem 有本命五行（會和妖獸互剋）, counter 剋敵, dodgeHit 閃擊 }
  //   你的招式只算單體普攻（暴擊、連擊、技能期望），群攻技能、靈寵、夥伴、首擊／橫掃／追擊這類特效都不算，所以結果偏保守
  function spacetime(I, o) {
    const S = (o && o.S) || EX.st, n = (o && o.n) || 120, T = (o && o.T) || 3600, k = ((o && o.str) || S.str) / S.str, r0 = S.minRealm || 0, B = S.base[Math.max(r0, Math.min(S.maxRealm, I.r)) - r0];
    const SR = B[5] || null, kA = k * (SR ? (SR[0] + SR[1]) / 2 : 1);   // SR＝強度範圍（每隻各擲）；野外修士用平均強度
    let seed = ((o && o.seed) || 20261006) >>> 0;
    const rnd = () => { seed = seed + 0x6D2B79F5 >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const roll = () => 1 + (rnd() * 2 - 1) * S.variance, dm = p => S.defK / (S.defK + Math.max(0, p)), tw = S.mon.reduce((s, m) => s + m.w, 0), SK = S.sk, CU = S.cult, [afP, afC, afT, afM] = S.affix;
    const AF = I.aff || {}, wx = () => { if (!I.elem) return [1, 1]; const x = rnd(); return x < .2 ? [1 + C.WUXING_COUNTER_BONUS, 1 - C.WUXING_COUNTERED_PENALTY] : x < .4 ? [1 - C.WUXING_COUNTERED_PENALTY, (1 + C.WUXING_COUNTER_BONUS) * (1 + (I.counter || 0))] : [1, 1]; };   // [牠打你, 你打牠] 的五行相剋倍率
    const jin = Math.min(S.shieldMax, I.jin || 0), hua = Math.min(S.shieldMax, I.huajin || 0), times = [];
    let kills = 0, pots = 0, secs = 0;
    for (let i = 0; i < n; i++) {
      let hp = I.hp, cd = 0, rest = 0, es = [], t = 0, dead = false, round = 0, undy = false, sunder = 0, frozen = 0, burn = null, poison = null;
      const heal = v => { hp = Math.min(I.hp, hp + v); }, stack = (d, max, per) => d ? { s: Math.min(max, d.s + 1), t: 3, per: Math.max(d.per, per) } : { s: 1, t: 3, per };
      const die = () => { if (hp > 0) return false; if (I.undying && !undy) { undy = true; hp = 1; return false; } return dead = true; };
      const strike = () => {
        const e = es.find(x => x.hp > 0); if (!e) return 0;
        const d0 = e.eva + (e.ph > 0 ? SK.phantom.eva : 0) - (I.hit || 0); if (d0 > 0 && rnd() < dodge(d0)) return 0;
        let d = I.atk * (I.skill || 1) * roll() * e.wx[1]; const dark = I.dark > 0 && rnd() < I.dark / 100, th = AF.thunder > 0 && rnd() < AF.thunder / 100;
        if (AF.metal > 0 && rnd() < AF.metal / 100) d *= 1 + C.METAL_BONUS;
        if (th) d *= 1 + C.THUNDER_BONUS;
        if (I.light > 0 && rnd() < I.light / 100) { d *= 1 + C.LIGHT_BONUS; heal(I.hp * S.lightHeal); }
        if (rnd() < (I.crit || 0)) d *= I.critDmg || S.critDmg;
        if (!dark && !th) d *= 1 - Math.max(0, (I.mag ? e.m.mres : e.m.def) - (I.pen || 0)) / 100;
        if (AF.ice > 0 && rnd() < AF.ice / 100) e.fz = 1;
        if (AF.fire > 0 && rnd() < AF.fire / 100) e.burn = stack(e.burn, C.BURN_MAX_STACKS, I.atk * C.BURN_RATE);
        if (AF.poison > 0 && e.m.race !== "ghost" && rnd() < AF.poison / 100) e.poison = stack(e.poison, C.POISON_MAX_STACKS, I.atk * C.POISON_RATE);
        e.hp -= d; if (dark) heal(d * C.DARK_LIFESTEAL); return d;
      };
      for (; t < T && !dead; t++) {
        if (cd > 0) cd--;
        if (I.potion && cd <= 0 && hp < I.hp && hp / I.hp * 100 <= I.potion.th) { heal(I.hp * I.potion.amt); cd = S.cd; pots++; }
        if (!es.length) {
          if (rest > 0) { rest--; heal(I.hp * S.rest); continue; }
          const c = S.wave[0] + Math.floor(rnd() * (S.wave[1] - S.wave[0] + 1));
          for (let j = 0; j < c; j++) {
            let x = rnd() * tw, m = S.mon[S.mon.length - 1]; for (const y of S.mon) { x -= y.w; if (x < 0) { m = y; break; } }
            const kk = SR ? k * (SR[0] + rnd() * (SR[1] - SR[0])) : k;
            const e = { m, hp: B[0] * kk * m.hp, atk: B[1] * kk * m.atk * (m.mag ? B[3] : 1), eva: m.evaT > 0 ? Math.max(m.eva, B[2]) + m.evaT : m.eva, af: null, ph: 0, heals: 0, raged: false };
            e.max = e.hp;
            if (rnd() < afP) e.af = afT[Math.floor(rnd() * afT.length)]; else if (m.cast && rnd() < Math.min(1, afP * (afM - 1) / Math.max(.01, 1 - afP))) e.af = afT[Math.floor(rnd() * afT.length)];
            e.wx = wx(); es.push(e);
          }
          // 野外修士、暗殺者（獵殺邪修解鎖後）：氣血與攻擊是這裡妖獸的 1.5／3 倍、術法攻擊；魔道的會吸血
          [[I.cult, CU.mult[0], rnd() < .5], [I.amb, CU.mult[1], !!I.ambDemon]].forEach(([p, mu, demon]) => {
            if (!(p > 0) || rnd() >= p) return;
            const e = { m: { mag: 1, def: CU.def, mres: CU.def, crit: 0, sk: [], steal: demon ? CU.steal : 0 }, hp: B[0] * kA * mu, atk: B[1] * kA * mu * B[3], eva: CU.eva, af: rnd() < afP ? afT[Math.floor(rnd() * afT.length)] : null, ph: 0, heals: 0, raged: false };
            e.max = e.hp; e.wx = wx(); es.push(e);
          });
          round = 0; undy = false; sunder = 0; continue;
        }
        // 你的回合：先結算身上的燒傷、中毒；被凍結就不能出手
        let dot = 0; [burn, poison] = [burn, poison].map(d => { if (!d) return null; dot += d.s * d.per; return --d.t <= 0 ? null : d; });
        const fz = frozen > 0; if (fz) frozen--;
        if (dot > 0) { hp -= dot; if (die()) break; }
        if (!fz) { round++; let dealt = strike(); if (rnd() < (I.combo || 0)) dealt += strike(); if (I.life && dealt > 0) heal(dealt * I.life); }
        // 妖獸身上的燒傷、中毒發作；被你凍結的這回合不能出手
        es.forEach(e => { if (e.hp <= 0) return; ["burn", "poison"].forEach(q => { const x = e[q]; if (!x) return; e.hp -= x.s * x.per; if (--x.t <= 0) e[q] = null; }); e.skip = e.fz > 0; if (e.skip) e.fz = 0; });
        if (I.regen && hp < I.hp) heal(I.hp * I.regen);
        const before = es.length; es = es.filter(e => e.hp > 0);
        if (es.length < before) { kills += before - es.length; if (I.soul) heal(I.hp * I.soul * (before - es.length)); }
        if (!es.length) { rest = S.respawn; continue; }
        // 妖獸回合
        const ex = (I.shield && round <= 2 ? I.shield : 0) + (I.huti && hp < I.hp * .3 ? I.huti : 0), sd = sunder > 0 ? 1 - SK.sunder.def : 1;
        let total = 0;
        es.forEach(e => {
          if (e.hp <= 0 || e.skip) return;
          if (e.ph > 0) e.ph--;
          let mult = 1; const sk = e.m.sk;
          if (sk.includes("rage")) { if (!e.raged && e.hp < e.max * SK.rage.hpBelow) e.raged = true; if (e.raged) mult *= 1 + SK.rage.atk; }
          const act = sk.filter(s => s !== "rage" && !(s === "heal" && e.heals >= SK.heal.maxUses)), use = act.length && rnd() < S.skillChance ? act[Math.floor(rnd() * act.length)] : null;
          if (use === "heavy") mult *= SK.heavy.mult;
          if (use === "heal") { e.hp = Math.min(e.max, e.hp + e.max * SK.heal.pct); e.heals++; }
          if (use === "phantom") e.ph = SK.phantom.turns;
          const atk = e.atk * mult, d0 = I.eva - B[2];
          if (d0 > 0 && rnd() < dodge(d0)) { if (I.dodgeHit) e.hp -= I.atk * I.dodgeHit * (1 - Math.max(0, e.m.def - (I.pen || 0)) / 100); return; }
          let d = atk * roll() * e.wx[0]; const th = e.af === "thunder" && rnd() < afC / 100;
          if (th) d *= 1 + C.THUNDER_BONUS;
          if (rnd() < e.m.crit) d *= S.critDmg;
          if (!th) d *= dm(e.m.mag ? I.mdef + ex * S.mdefFromDef : (I.def + ex) * sd);
          if (e.af === "ice" && rnd() < afC / 100 * (1 - (I.fr || 0))) frozen = Math.max(frozen, S.freeze);
          if (e.af === "poison" && rnd() < afC / 100) poison = stack(poison, C.POISON_MAX_STACKS, atk * C.POISON_RATE);
          const post = d; d *= 1 - (e.m.mag ? hua : jin);
          if (I.reflect && d > 0) e.hp -= d * I.reflect;
          d = Math.max(d, post * (1 - S.shieldMax)); total += d;
          if (e.m.steal && e.hp > 0) e.hp = Math.min(e.max, e.hp + d * e.m.steal);
          if (use === "bite" && d > 0 && e.hp > 0) e.hp = Math.min(e.max, e.hp + d * SK.bite.lifesteal);
          if (use === "poison") poison = stack(poison, C.POISON_MAX_STACKS, atk * C.POISON_RATE);
          if (use === "flame") burn = stack(burn, C.BURN_MAX_STACKS, atk * C.BURN_RATE);
          if (use === "frost" && rnd() >= (I.fr || 0)) frozen = Math.max(frozen, S.freeze);
          if (use === "sunder") sunder = SK.sunder.turns;
        });
        if (sunder > 0) sunder--;
        hp -= total; if (die()) break;
      }
      times.push(dead ? t : T); secs += dead ? t : T;
    }
    times.sort((a, b) => a - b);
    const p = s => times.filter(x => x >= Math.min(s, T)).length / n;
    return { n, T, p10: p(600), p60: p(3600), median: times[n >> 1], killsHr: secs ? kills / secs * 3600 : 0, potsHr: secs ? pots / secs * 3600 : 0 };
  }
  window.DMG = { EX, C, AFF, VAR, AFF_NAME, attrs, race, hit, normal, extras, dodge, spacetime };
})();
