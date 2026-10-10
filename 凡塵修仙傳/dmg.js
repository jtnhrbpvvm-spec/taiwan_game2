// 每次傷害的期望值：屬性觸發（冰火毒金雷）、命中、破甲、屬性秘典、種族剋制（「屬性與技能」頁使用）
(function () {
  const EX = /*EX*/{"title":{"bpPlat17":{"fx:法爆":0.03},"codex100":{"fx:聚財":0.02},"catArmor":{"def":1},"catAccessory":{"eva":1},"slotSword":{"metal":1},"slotBlade":{"fire":1},"slotFan":{"ice":1},"slotBow":{"thunder":1},"slotBrush":{"poison":1},"elemMetal":{"elemDmg:金":0.02},"elemWood":{"elemDmg:木":0.02},"elemWater":{"elemDmg:水":0.02},"elemFire":{"elemDmg:火":0.02},"elemEarth":{"elemDmg:土":0.02},"purple200":{"fx:法爆":0.02},"enh10":{"fx:聚財":0.01},"enh15":{"def":1},"realm2":{"fx:悟道":0.01},"realm4":{"fx:悟道":0.01},"realm7":{"fx:悟道":0.01},"realm10":{"fx:悟道":0.01},"sectOuter":{"fx:法爆":0.01},"sectInner":{"fx:悟道":0.01},"sectCore":{"fx:法爆":0.01},"sectDeacon":{"fx:聚財":0.01},"sectElder":{"fx:法爆":0.02},"karmaGood":{"fx:積德":0.05},"bounty50":{"fx:積德":0.05},"casinoStone100":{"fx:聚財":0.02},"casinoFire":{"fx:奪寶":0.1},"casinoBigWin":{"fx:聚財":0.02},"defense10":{"def":1}},"fire":{"f01":{"fire":5},"f02":{"fx:吸血":0.03},"f04":{"metal":2},"f05":{"fx:法爆":0.04},"f06":{"fire":3},"f07":{"def":2},"f08":{"fx:焚燼":0.3},"f09":{"fx:回春":0.01},"f11":{"metal":2,"fire":1},"f13":{"thunder":2,"fire":1},"f15":{"fx:丹心":0.1},"f17":{"fx:回靈":0.015},"f18":{"ice":2,"fire":1},"f19":{"ice":1,"fire":1},"f20":{"eva":1},"f23":{"fire":2},"f24":{"def":1},"f25":{"fx:獸魂":0.1},"f26":{"thunder":1,"eva":0.5},"f28":{"poison":1,"fire":1},"f31":{"ice":2},"f33":{"fire":1},"f34":{"poison":1},"f35":{"fx:丹心":0.05},"f37":{"ice":1},"f38":{"fx:蝕骨":0.05},"f40":{"thunder":1},"f44":{"eva":0.5},"f45":{"fire":0.5},"f46":{"fx:積德":0.05},"f47":{"fx:吸血":0.005},"f48":{"metal":1},"f49":{"def":0.5}},"partner":{"xiaoyan":{"fire":3,"fx:焚燼":0.3},"lindong":{"fx:吸血":0.03},"dashanren":{"eva":3,"fx:疾風":0.03},"lifeiyu":{"fx:斬殺":0.2},"hanli":{"fx:丹心":0.2},"nangongwan":{"eva":2,"fx:回靈":0.015},"chennan":{"def":3},"tangsan":{"fx:追擊":0.08,"poison":2},"hengren":{"poison":2},"wushi":{"def":3},"duande":{"fx:聚財":0.1,"eva":2},"douzhan":{"fx:疾風":0.04},"xukong":{"eva":3},"hengyu":{"def":2,"fx:丹心":0.2},"qingdi":{"fx:回春":0.015},"xihuangmu":{"def":2},"amituo":{"def":3,"fx:積德":0.2},"wanglin":{"fx:斬殺":0.3},"menghao":{"fx:丹心":0.2},"baixiaochun":{"def":3},"linlei":{"def":2},"zhangxiaofan":{"fx:吸血":0.02},"liqiye":{"fx:悟道":0.1},"leishen":{"thunder":4},"huoyuhao":{"ice":2},"guyuena":{"fx:回春":0.015},"aosika":{"fx:丹心":0.2},"mahongjun":{"fire":2,"fx:焚燼":0.2},"xiaoyixian":{"poison":3,"fx:蝕骨":0.2},"ziling":{"eva":2},"xuxin":{"fx:丹心":0.15},"qinshuang":{"ice":1},"babata":{"fx:悟道":0.03},"jinjiao":{"def":2},"moyunteng":{"poison":1}},"rootPick":{"wind":[{"fx:悟道":0.4,"wind":15},{}],"thunder":[{"fx:悟道":0.4,"thunder":20},{}],"ice":[{"fx:悟道":0.4,"ice":20,"fx:定神":0.3},{}],"dark":[{"fx:悟道":0.4,"dark":15},{"nature":"dark"}],"none":[{"fx:悟道":0.6},{}],"sun":[{"fx:悟道":0.6,"light":12},{"nature":"light"}],"moon":[{"fx:悟道":0.6,"ice":15},{}],"immortal":[{"fx:悟道":0.8,"light":8},{"nature":"light"}],"chaos":[{"fx:悟道":1},{}],"taichu":[{"fx:悟道":1},{}],"hongmeng":[{"fx:悟道":1.2},{}],"genesis":[{"fx:悟道":1},{}],"wutai":[{"fx:悟道":1},{}],"wuxing5":[{"fx:悟道":1,"metal":10,"ice":10,"fire":10,"def":5,"fx:回春":0.01},{}],"kongling":[{"fx:悟道":1.3,"eva":5},{}],"kongming":[{"fx:悟道":1,"fx:洞察":10},{}],"kongshi":[{"fx:悟道":1.1},{}]},"rootGroup":{"fake5":[{"fx:悟道":-0.25},{},0],"fake4":[{"fx:悟道":-0.15},{},0],"true3":[{},{},0.2],"true2":[{"fx:悟道":0.2},{},0.4],"heaven":[{"fx:悟道":0.5},{},1]},"aff":{"金":{"metal":15},"木":{"fx:回春":0.01},"水":{"ice":15},"火":{"fire":15},"土":{"def":5}},"phys":{"metalBody":[{"metal":12},{}],"woodBody":[{"fx:回春":0.008},{}],"waterBody":[{"ice":12},{}],"fireBody":[{"fire":12},{}],"earthBody":[{"def":5},{}],"thunderBody":[{"thunder":12},{}],"iceBody":[{"ice":12,"fx:定神":0.3},{}],"yinBody":[{"dark":8},{"nature":"dark","ambushMult":1.5}],"yangBody":[{"light":8},{"nature":"light","ambushMult":1.5}],"herbBody":[{"fx:丹心":0.5,"fx:回春":0.004},{}],"poisonBody":[{"poison":10},{"poisonImmune":1}],"chaosBody":[{"fx:悟道":0.3},{}],"holyBody":[{"def":5,"light":8},{"nature":"light"}],"daoBody":[{"fx:悟道":0.3},{"nature":"light"}],"tyrantBody":[{"fx:噬魂":0.02},{}],"doublePupil":[{"fx:洞察":12,"fx:破甲":10},{}],"supremeBone":[{"fx:法爆":0.15},{}]},"prof":{"bow":["fx:首擊",0.05],"flute":["fx:回靈",0.003],"brush":["fx:法爆",0.02]},"set":{"太乙":[[6,{"special:rage":1}]],"蒼龍":[[6,{"special:rage":1}]],"真武":[[6,{"special:rage":1}]],"祝融":[[6,{"special:rage":1}]],"盤古":[[6,{"special:rage":1}]],"神霄":[[6,{"special:echo":1}]],"太昊":[[6,{"special:echo":1}]],"玄女":[[6,{"special:echo":1}]],"羲和":[[6,{"special:echo":1}]],"黃庭":[[6,{"special:echo":1}]],"白帝":[[4,{"def":5}],[6,{"special:undying":1}]],"句芒":[[4,{"def":5}],[6,{"special:undying":1}]],"玄天":[[4,{"def":5}],[6,{"special:undying":1}]],"炎帝":[[4,{"def":5}],[6,{"special:undying":1}]],"軒轅":[[4,{"def":5}],[6,{"special:undying":1}]],"天樞":[[2,{"eva":3}],[4,{"special:dodgeStrike":1}],[6,{"eva":5}]],"瑤光":[[2,{"eva":3}],[4,{"special:dodgeStrike":1}],[6,{"eva":5}]],"洛神":[[2,{"eva":3}],[4,{"special:dodgeStrike":1}],[6,{"eva":5}]],"畢方":[[2,{"eva":3}],[4,{"special:dodgeStrike":1}],[6,{"eva":5}]],"須彌":[[2,{"eva":3}],[4,{"special:dodgeStrike":1}],[6,{"eva":5}]],"戮仙":[[2,{"metal":5}],[4,{"elemBoost:metal":0.2}],[6,{"cap:metal":10}]],"神農":[[2,{"poison":5}],[4,{"elemBoost:poison":0.2}],[6,{"cap:poison":10}]],"太陰":[[2,{"ice":5}],[4,{"elemBoost:ice":0.2}],[6,{"cap:ice":10}]],"三昧":[[2,{"fire":5}],[4,{"elemBoost:fire":0.2}],[6,{"cap:fire":10}]],"九州":[[2,{"thunder":5}],[4,{"elemBoost:thunder":0.2}],[6,{"cap:thunder":10}]],"大衍":[[2,{"fx:聚財":0.05}],[4,{"fx:悟道":0.05}],[6,{"fx:尋鐵":0.15}]],"蓬萊":[[2,{"fx:聚財":0.05}],[4,{"fx:悟道":0.05}],[6,{"fx:尋鐵":0.15}]],"歸墟":[[2,{"fx:聚財":0.05}],[4,{"fx:悟道":0.05}],[6,{"fx:尋鐵":0.15}]],"丹霄":[[2,{"fx:聚財":0.05}],[4,{"fx:悟道":0.05}],[6,{"fx:尋鐵":0.15}]],"萬壽":[[2,{"fx:聚財":0.05}],[4,{"fx:悟道":0.05}],[6,{"fx:尋鐵":0.15}]]},"tal":{"gong2":{"fx:破甲":2},"gong3":{"fx:斬殺":0.06},"gong4":{"metal":2},"gong6":{"fx:首擊":0.2,"fx:燃魂":0.05},"fa2":{"fx:法爆":0.03},"fa3":{"thunder":2},"fa4":{"ice":2},"fa5":{"fx:聚靈":0.06,"fx:回靈":0.005},"fa6":{"fx:連雷":0.3},"jin1":{"def":3},"jin2":{"mdef":3},"jin3":{"fx:回春":0.003},"jin4":{"fx:金身":0.02},"jin5":{"fx:先手盾":5},"jin6":{"fx:化勁":0.03},"jin8":{"special:undying":1},"shen1":{"eva":2},"shen2":{"hit":2},"shen3":{"fx:追擊":0.02},"shen4":{"fx:疾風":0.01},"shen5":{"fx:閃擊":0.3},"shen6":{"fx:洞察":3},"shen8":{"special:dodgeStrike":1,"fx:追擊":0.08},"ling1":{"fx:獸魂":0.05},"ling2":{"fx:反震":0.02},"ling3":{"fx:噬魂":0.01},"ling4":{"fx:吸血":0.01},"ling5":{"fx:獸魂":0.15},"ling6":{"fx:橫掃":0.05},"ling7":{"fx:獸魂":0.8},"ling8":{"special:rage":1,"fx:橫掃":0.1},"zao1":{"fx:悟道":0.02},"zao2":{"fx:聚財":0.03},"zao3":{"fx:尋鐵":0.05},"zao4":{"fx:積德":0.04},"zao5":{"fx:奪寶":0.1},"zao6":{"fx:丹心":0.1,"fx:延壽":0.05},"zao7":{"fx:悟道":0.15,"fx:聚財":0.15}},"leg":{"wanjian":{"special:echo":1,"fx:法爆":0.1},"bumie":{"special:undying":1},"jinghua":{"special:dodgeStrike":1,"eva":6},"tiangang":{"special:rage":1},"xuanlei":{"thunder":10,"fx:連雷":1},"hanyu":{"ice":10,"fx:寒徹":0.3},"yehuo":{"fire":10,"fx:焚燼":0.6},"wandu":{"poison":10,"fx:蝕骨":0.6,"fx:毒爆":1},"pojun":{"fx:破甲":20,"fx:斬殺":0.4},"tianyan":{"fx:洞察":12,"fx:追擊":0.1},"xuehai":{"fx:吸血":0.06,"fx:噬魂":0.06},"taiyi":{"fx:回春":0.02,"fx:回靈":0.02},"jingang":{"def":15,"fx:金身":0.1},"huhun":{"mdef":20,"fx:化勁":0.1},"xianfa":{"fx:首擊":0.6,"fx:燃魂":0.15},"jifeng":{"fx:疾風":0.08,"fx:追擊":0.08},"wuxing":{"fx:剋敵":0.3},"wanshou":{"fx:獸魂":0.4},"zhaocai":{"fx:聚財":0.2,"fx:奪寶":0.3},"wudao":{"fx:悟道":0.1,"fx:通玄":0.3}},"resSingle":{},"resPure":{"水":["冰共鳴",{"ice":25,"freezeResist":0.5}],"火":["炎共鳴",{"fire":25,"burnMax":4}],"金":["罡共鳴",{"metal":25}],"木":["生共鳴",{"regen":0.03}],"土":["岩共鳴",{"def":10}]},"resDual":{"金+水":{"byMain":{"水":["雷共鳴",{"thunder":25}],"金":["毒共鳴",{"poison":25}]}},"金+木":["庚共鳴",{"metal":20}],"金+火":["煉共鳴",{"metal":20}],"金+土":["鋒岩共鳴",{"def":8,"metal":15}],"木+水":["榮共鳴",{"regen":0.02}],"木+火":["焚共鳴",{"fire":20}],"木+土":["蠱共鳴",{"poison":20,"poisonMax":7}],"水+火":["既濟共鳴",{"ice":15,"fire":15}],"水+土":["瘴共鳴",{"poison":20}],"火+土":["熔共鳴",{"fire":20,"def":8}]},"fx":{"追擊":[0.08,0.3],"破甲":[10,40],"吸血":[0.03,0.15],"噬魂":[0.03,0.15],"橫掃":[0.1,0.35],"首擊":[0.25,1],"法爆":[0.05,0.3],"剋敵":[0.08,0.4],"斬殺":[0.2,0.8],"疾風":[0.05,0.2],"燃魂":[0.08,0.4],"洞察":[5,20],"聚靈":[0.08,0.4],"寒徹":[0.1,0.5],"冰封":[0.3,0.8],"焚燼":[0.2,1],"蝕骨":[0.2,1],"毒爆":[1,4],"連雷":[0.5,1.5],"反震":[0.08,0.4],"護體":[8,30],"先手盾":[10,30],"回春":[0.01,0.05],"回靈":[0.015,0.075],"定神":[0.15,0.6],"閃擊":[0.8,2.4],"金身":[0.06,0.3],"化勁":[0.06,0.3],"延壽":[0.1,0.5],"丹心":[0.15,0.6],"聚財":[0.03,0.3],"悟道":[0.02,0.2],"積德":[0.05,0.5],"奪寶":[0.1,1],"尋鐵":[0.1,1],"役使":[0.05,0.5],"獸魂":[0.1,0.6],"通玄":[0.1,0.6]},"ys":{"holyBody":["金",null,0.3],"daoBody":["木",null,0.3],"doublePupil":["水",null,0.3],"tyrantBody":["火",null,0.3],"supremeBone":["土",null,0.3],"chaosBody":[null,"thunder",0.3],"swordBody":["金",null,0.1],"bladeBody":["火",null,0.1],"fanBody":[null,"wind",0.1],"bowBody":["木",null,0.1],"fluteBody":["水",null,0.1],"brushBody":[null,"thunder",0.1]},"talis":{"def":{"kind":"pct","race":null,"key":"def","v":[1,2,3,5]},"eva":{"kind":"pct","race":null,"key":"eva","v":[1,2,3,5]},"ice":{"kind":"pct","race":null,"key":"ice","v":[1,2,3,5]},"fire":{"kind":"pct","race":null,"key":"fire","v":[1,2,3,5]},"poison":{"kind":"pct","race":null,"key":"poison","v":[1,2,3,5]},"metal":{"kind":"pct","race":null,"key":"metal","v":[1,2,3,5]},"thunder":{"kind":"pct","race":null,"key":"thunder","v":[1,2,3,5]},"rbeast":{"kind":"race","race":"beast","key":"rbeast","v":[3,6,10,15]},"rghost":{"kind":"race","race":"ghost","key":"rghost","v":[3,6,10,15]},"rdemon":{"kind":"race","race":"demon","key":"rdemon","v":[3,6,10,15]},"rheart":{"kind":"race","race":"heart","key":"rheart","v":[3,6,10,15]}},"resSup":["五行聖共鳴",{"ice":15,"fire":15,"poison":15,"metal":15,"thunder":15,"def":15,"ignoreCounter":true}],"fxTier":{"紫色":1,"橙色":1.5,"白金":2},"C":{"AFFIX_CAP":50,"METAL_BONUS":1,"THUNDER_BONUS":0.3,"BURN_RATE":0.15,"BURN_TURNS":3,"BURN_MAX_STACKS":3,"POISON_RATE":0.08,"POISON_TURNS":3,"POISON_MAX_STACKS":5,"LIGHT_BONUS":0.3,"LIGHT_DARK_COUNTER_BONUS":0.3,"WUXING_COUNTER_BONUS":0.3,"WUXING_COUNTERED_PENALTY":0.3,"RACE_TALISMAN_CAP":0.2,"RACE_DMG_CAP":0.5,"hitPer":0.08,"evaK":100,"ELEMENT_BOOK_GAIN":0.0001,"WIND_HIT_MULT":0.6,"DARK_LIFESTEAL":0.2,"comboCap":10,"comboPer":0.04,"monType":{"balanced":["均衡",0,0,0],"tank":["皮厚",15,-10,0],"agile":["敏捷",-5,0,15],"brute":["猛攻",0,0,0],"caster":["術法",-5,15,5]},"DARK_MAP_CATEGORIES":[4],"ROOT_SINGLE_COUNT":5,"ROOT_SUPREME_SETS":3,"ROOT_PURE_SETS":2,"ROOT_PURE_REST":6,"ROOT_DUAL_SETS":1,"ROOT_DUAL_REST":5,"PARTNER_LV5_PASSIVE_MULT":1.2,"RACE_TREASURE_CAP":0.15,"raceGearCap":0.09,"treasure":[0.05,0.1,0.15],"slay":{"beast":[[100,0.02],[1000,0.04],[10000,0.06]],"ghost":[[100,0.02],[1000,0.04],[10000,0.06]],"demon":[[2000,0.02],[20000,0.04],[30000,0.06]],"heart":[[50,0.02],[100,0.04],[200,0.06]]},"setQ":["紫色","橙色","白金"],"wxc":{"木":"土","土":"水","水":"火","火":"金","金":"木"}},"books":[["metal","《庚金劍典》","金","metal"],["wood","《乙木長生訣》","木",null],["water","《癸水真經》","水",null],["fire","《丙火焚天錄》","火","fire"],["earth","《戊土玄黃功》","土",null],["ice","《玄冰寒魄訣》",null,"ice"],["thunder","《九霄雷典》",null,"thunder"],["poison","《萬毒真經》",null,"poison"]],"monAttr":{"1":{"def":0,"eva":2,"affixProb":0.3,"affixChance":5},"2":{"def":5,"eva":4,"affixProb":0.5,"affixChance":10},"3":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15},"4":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15},"5":{"def":15,"eva":8,"affixProb":0.9,"affixChance":20},"6":{"def":10,"eva":6,"affixProb":0.7,"affixChance":15}},"st":{"minRealm":0,"maxRealm":10,"respawn":3,"str":30,"wave":[1,3],"rest":0.03,"variance":0.1,"critDmg":2,"defK":120,"mdefFromDef":0.6,"shieldMax":0.2,"cd":5,"skillChance":0.15,"sk":{"heavy":{"mult":1.8},"bite":{"lifesteal":0.3},"poison":{},"flame":{},"frost":{},"sunder":{"def":0.2,"turns":3},"rage":{"hpBelow":0.3,"atk":0.5},"heal":{"pct":0.1,"maxUses":2},"phantom":{"eva":20,"turns":3}},"freeze":1,"lightHeal":0.01,"affix":[0.5,10,["ice","poison","thunder"],1.5],"potions":[["凝血草",0.05,50,0],["培元丹",0.1,200,0],["九轉還魂丹",0.3,500,1]],"base":[[1323,24.23,1.232,1.012833,47.3816],[1688,26.26,2.552,1.026583,45.5032],[2103,21.32,3.872,1.040333,43.8844],[2572,20.5,5.192,1.054083,42.5547],[2922,22.15,6.512,1.067833,39.3115],[3268,23.92,7.832,1.081583,38.6262],[3629,25.81,9.152,1.095333,37.9884],[4004,27.83,10.472,1.109083,37.4728],[4394,29.98,11.792,1.122833,37.0647],[4799,32.28,13.112,1.136583,36.6792],[5099,34.74,14.432,1.150333,35.4968]],"mon":[{"id":"dragon","n":"青鱗蒼龍","w":1,"race":"beast","mag":0,"cast":0,"hp":1.1,"atk":0.814001,"def":5,"mres":5,"eva":4,"evaT":0,"crit":0.05,"sk":["frost"],"steal":0},{"id":"tiger","n":"雪紋白虎","w":1,"race":"beast","mag":0,"cast":0,"hp":0.935,"atk":0.808513,"def":5,"mres":5,"eva":4,"evaT":0,"crit":0.12,"sk":["heavy","rage"],"steal":0},{"id":"qilin","n":"焰蹄麒麟","w":1,"race":"beast","mag":0,"cast":0,"hp":1.21,"atk":0.674397,"def":20,"mres":0,"eva":4,"evaT":0,"crit":0.03,"sk":["flame","heal"],"steal":0},{"id":"fox","n":"九尾天狐","w":1,"race":"beast","mag":0,"cast":0,"hp":0.88,"atk":0.990104,"def":0,"mres":5,"eva":4,"evaT":15,"crit":0.08,"sk":["phantom"],"steal":0},{"id":"phoenix","n":"赤羽火鳳","w":1,"race":"beast","mag":1,"cast":1,"hp":0.99,"atk":1.000805,"def":0,"mres":20,"eva":4,"evaT":5,"crit":0.05,"sk":["flame"],"steal":0},{"id":"turtle","n":"玄甲靈龜","w":1,"race":"beast","mag":0,"cast":0,"hp":1.21,"atk":0.640211,"def":20,"mres":0,"eva":4,"evaT":0,"crit":0.03,"sk":["heal","frost"],"steal":0},{"id":"spider","n":"碧眼毒蛛","w":1,"race":"beast","mag":0,"cast":0,"hp":0.88,"atk":1.018665,"def":0,"mres":5,"eva":4,"evaT":15,"crit":0.08,"sk":["poison"],"steal":0},{"id":"ghostGen","n":"幽冥鬼將","w":1,"race":"ghost","mag":1,"cast":1,"hp":0.9,"atk":0.977745,"def":0,"mres":20,"eva":9,"evaT":5,"crit":0.05,"sk":["frost","sunder"],"steal":0},{"id":"yaksha","n":"青面夜叉","w":1,"race":"ghost","mag":0,"cast":0,"hp":0.85,"atk":0.990962,"def":5,"mres":5,"eva":9,"evaT":0,"crit":0.12,"sk":["bite","heavy"],"steal":0},{"id":"zombie","n":"百年殭屍","w":1,"race":"ghost","mag":0,"cast":0,"hp":1.1,"atk":0.728679,"def":20,"mres":0,"eva":9,"evaT":0,"crit":0.03,"sk":["poison","bite"],"steal":0},{"id":"wraith","n":"怨魂","w":1,"race":"ghost","mag":0,"cast":0,"hp":0.8,"atk":0.990104,"def":0,"mres":5,"eva":9,"evaT":15,"crit":0.08,"sk":["phantom"],"steal":0}],"cult":{"rep":8000,"realm":3,"p":[0.05,0.04],"mult":[1.5,3],"karma":[1000,-1000],"steal":0.1,"def":5,"eva":4},"upkeep":10000,"rewardCap":3},"xm":{"minRealm":10,"maxRealm":15,"respawn":1,"str":1,"wave":[1,3],"rest":0.03,"variance":0.1,"critDmg":2,"defK":120,"mdefFromDef":0.6,"shieldMax":0.2,"cd":5,"skillChance":0.15,"sk":{"heavy":{"mult":1.8},"bite":{"lifesteal":0.3},"poison":{},"flame":{},"frost":{},"sunder":{"def":0.2,"turns":3},"rage":{"hpBelow":0.3,"atk":0.5},"heal":{"pct":0.1,"maxUses":2},"phantom":{"eva":20,"turns":3}},"freeze":1,"lightHeal":0.01,"affix":[0.9,20,["ice","poison","thunder"],1.5],"potions":[["凝血草",0.05,50,0],["培元丹",0.1,200,0],["九轉還魂丹",0.3,500,1]],"base":[[169.9828,1.158051,14.432,1.150333,17.4537,[10,15]],[179.7647,1.245441,15.752,1.164083,17.3084,[10,15]],[189.7508,1.338675,17.072,1.177833,58.622,[40,50]],[199.9411,1.438118,18.392,1.191583,127.6678,[80,120]],[210.3355,1.54416,19.712,1.205333,176.7258,[120,160]],[220.9342,1.65721,21.032,1.219083,225.199,[160,200]]],"mon":[{"id":"dragon","n":"青鱗蒼龍","w":2,"race":"beast","mag":0,"cast":0,"hp":1.1,"atk":0.814001,"def":15,"mres":15,"eva":8,"evaT":0,"crit":0.05,"sk":["frost"],"steal":0},{"id":"phoenix","n":"赤羽火鳳","w":2,"race":"beast","mag":1,"cast":1,"hp":0.99,"atk":1.006692,"def":10,"mres":30,"eva":8,"evaT":5,"crit":0.05,"sk":["flame"],"steal":0},{"id":"qilin","n":"焰蹄麒麟","w":2,"race":"beast","mag":0,"cast":0,"hp":1.21,"atk":0.65952,"def":30,"mres":5,"eva":8,"evaT":0,"crit":0.03,"sk":["flame","heal"],"steal":0},{"id":"bloodCult","n":"血煞魔修","w":2,"race":"demon","mag":1,"cast":0,"hp":0.85,"atk":0.905535,"def":15,"mres":15,"eva":8,"evaT":0,"crit":0.12,"sk":["rage","bite"],"steal":0.1},{"id":"sorcerer","n":"魔道術士","w":2,"race":"demon","mag":1,"cast":1,"hp":0.9,"atk":1.015699,"def":10,"mres":30,"eva":8,"evaT":5,"crit":0.05,"sk":["flame","poison"],"steal":0.1},{"id":"puppet","n":"傀儡魔偶","w":2,"race":"demon","mag":1,"cast":0,"hp":1.1,"atk":0.685715,"def":30,"mres":5,"eva":8,"evaT":0,"crit":0.03,"sk":["sunder","heavy"],"steal":0.1}],"cult":{"rep":8000,"realm":3,"p":[0.05,0.04],"mult":[1.5,3],"karma":[1000,-1000],"steal":0.1,"def":15,"eva":8},"upkeep":0,"rewardCap":0},"cb":{"spell":{"metal-low-1":{"type":"single","dmgType":"phys","mpCost":60,"mult":1.6,"effect":{"type":"metal","chance":0.15}},"metal-low-2":{"type":"aoe","dmgType":"phys","mpCost":60,"mult":1.1,"effect":{"type":"metal","chance":0.15}},"metal-low-3":{"type":"control","dmgType":"phys","mpCost":60,"mult":0.8,"freeze":0.4},"metal-low-4":{"type":"buff","dmgType":"phys","mpCost":60,"mult":1.15,"duration":3},"metal-low-5":{"type":"heal","dmgType":"phys","mpCost":60,"mult":0.12},"metal-mid-1":{"type":"single","dmgType":"phys","mpCost":150,"mult":2.4,"effect":{"type":"metal","chance":0.25}},"metal-mid-2":{"type":"aoe","dmgType":"phys","mpCost":150,"mult":1.7,"effect":{"type":"metal","chance":0.25}},"metal-mid-3":{"type":"control","dmgType":"phys","mpCost":150,"mult":1.2,"freeze":0.6,"aoe":true},"metal-mid-4":{"type":"buff","dmgType":"phys","mpCost":150,"mult":1.25,"duration":3},"metal-mid-5":{"type":"heal","dmgType":"phys","mpCost":150,"mult":0.2},"metal-high-1":{"type":"single","dmgType":"phys","mpCost":300,"mult":3.4,"effect":{"type":"metal","chance":0.35}},"metal-high-2":{"type":"aoe","dmgType":"phys","mpCost":300,"mult":2.5,"effect":{"type":"metal","chance":0.35}},"metal-high-3":{"type":"control","dmgType":"phys","mpCost":300,"mult":1.6,"freeze":0.8,"aoe":true},"metal-high-4":{"type":"buff","dmgType":"phys","mpCost":300,"mult":1.4,"duration":4},"metal-high-5":{"type":"heal","dmgType":"phys","mpCost":300,"mult":0.3},"wood-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":1.6,"lifesteal":0.1},"wood-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.1,"lifesteal":0.1},"wood-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":0.8,"freeze":0.4},"wood-low-4":{"type":"buff","dmgType":"mag","mpCost":60,"mult":1.15,"duration":3},"wood-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12},"wood-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":2.4,"lifesteal":0.1},"wood-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":1.7,"lifesteal":0.1},"wood-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.2,"freeze":0.6,"aoe":true},"wood-mid-4":{"type":"buff","dmgType":"mag","mpCost":150,"mult":1.25,"duration":3},"wood-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2},"wood-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":3.4,"lifesteal":0.1},"wood-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":2.5,"lifesteal":0.1},"wood-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":1.6,"freeze":0.8,"aoe":true},"wood-high-4":{"type":"buff","dmgType":"mag","mpCost":300,"mult":1.4,"duration":4},"wood-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3},"water-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":1.6,"effect":{"type":"ice","chance":0.15}},"water-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.1,"effect":{"type":"ice","chance":0.15}},"water-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":0.8,"freeze":0.4},"water-low-4":{"type":"shield","dmgType":"mag","mpCost":60,"mult":1,"duration":3,"reduce":0.15},"water-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12},"water-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":2.4,"effect":{"type":"ice","chance":0.25}},"water-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":1.7,"effect":{"type":"ice","chance":0.25}},"water-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.2,"freeze":0.6,"aoe":true},"water-mid-4":{"type":"shield","dmgType":"mag","mpCost":150,"mult":1,"duration":3,"reduce":0.25},"water-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2},"water-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":3.4,"effect":{"type":"ice","chance":0.35}},"water-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":2.5,"effect":{"type":"ice","chance":0.35}},"water-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":1.6,"freeze":0.8,"aoe":true},"water-high-4":{"type":"shield","dmgType":"mag","mpCost":300,"mult":1,"duration":4,"reduce":0.35},"water-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3},"fire-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":1.6,"effect":{"type":"fire","chance":0.15}},"fire-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.1,"effect":{"type":"fire","chance":0.15}},"fire-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":0.8,"freeze":0.4},"fire-low-4":{"type":"buff","dmgType":"mag","mpCost":60,"mult":1.15,"duration":3},"fire-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12},"fire-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":2.4,"effect":{"type":"fire","chance":0.25}},"fire-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":1.7,"effect":{"type":"fire","chance":0.25}},"fire-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.2,"freeze":0.6,"aoe":true},"fire-mid-4":{"type":"buff","dmgType":"mag","mpCost":150,"mult":1.25,"duration":3},"fire-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2},"fire-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":3.4,"effect":{"type":"fire","chance":0.35}},"fire-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":2.5,"effect":{"type":"fire","chance":0.35}},"fire-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":1.6,"freeze":0.8,"aoe":true},"fire-high-4":{"type":"buff","dmgType":"mag","mpCost":300,"mult":1.4,"duration":4},"fire-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3},"earth-low-1":{"type":"single","dmgType":"phys","mpCost":60,"mult":1.6},"earth-low-2":{"type":"aoe","dmgType":"phys","mpCost":60,"mult":1.1},"earth-low-3":{"type":"control","dmgType":"phys","mpCost":60,"mult":0.8,"freeze":0.4},"earth-low-4":{"type":"shield","dmgType":"phys","mpCost":60,"mult":1,"duration":3,"reduce":0.15},"earth-low-5":{"type":"heal","dmgType":"phys","mpCost":60,"mult":0.12},"earth-mid-1":{"type":"single","dmgType":"phys","mpCost":150,"mult":2.4},"earth-mid-2":{"type":"aoe","dmgType":"phys","mpCost":150,"mult":1.7},"earth-mid-3":{"type":"control","dmgType":"phys","mpCost":150,"mult":1.2,"freeze":0.6,"aoe":true},"earth-mid-4":{"type":"shield","dmgType":"phys","mpCost":150,"mult":1,"duration":3,"reduce":0.25},"earth-mid-5":{"type":"heal","dmgType":"phys","mpCost":150,"mult":0.2},"earth-high-1":{"type":"single","dmgType":"phys","mpCost":300,"mult":3.4},"earth-high-2":{"type":"aoe","dmgType":"phys","mpCost":300,"mult":2.5},"earth-high-3":{"type":"control","dmgType":"phys","mpCost":300,"mult":1.6,"freeze":0.8,"aoe":true},"earth-high-4":{"type":"shield","dmgType":"phys","mpCost":300,"mult":1,"duration":4,"reduce":0.35},"earth-high-5":{"type":"heal","dmgType":"phys","mpCost":300,"mult":0.3},"thunder-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":1.6,"effect":{"type":"thunder","chance":0.15}},"thunder-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.1,"effect":{"type":"thunder","chance":0.15}},"thunder-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":0.8,"freeze":0.4},"thunder-low-4":{"type":"buff","dmgType":"mag","mpCost":60,"mult":1.15,"duration":3},"thunder-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12},"thunder-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":2.4,"effect":{"type":"thunder","chance":0.25}},"thunder-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":1.7,"effect":{"type":"thunder","chance":0.25}},"thunder-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.2,"freeze":0.6,"aoe":true},"thunder-mid-4":{"type":"buff","dmgType":"mag","mpCost":150,"mult":1.25,"duration":3},"thunder-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2},"thunder-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":3.4,"effect":{"type":"thunder","chance":0.35}},"thunder-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":2.5,"effect":{"type":"thunder","chance":0.35}},"thunder-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":1.6,"freeze":0.8,"aoe":true},"thunder-high-4":{"type":"buff","dmgType":"mag","mpCost":300,"mult":1.4,"duration":4},"thunder-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3},"ice-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":2,"effect":{"type":"ice","chance":0.15},"hpCost":0.03},"ice-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.38,"effect":{"type":"ice","chance":0.15},"hpCost":0.03},"ice-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":1,"freeze":0.4,"hpCost":0.03},"ice-low-4":{"type":"shield","dmgType":"mag","mpCost":60,"mult":1,"duration":3,"reduce":0.15,"hpCost":0.03},"ice-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12,"hpCost":0.03},"ice-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":3,"effect":{"type":"ice","chance":0.25},"hpCost":0.05},"ice-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2.13,"effect":{"type":"ice","chance":0.25},"hpCost":0.05},"ice-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.5,"freeze":0.6,"aoe":true,"hpCost":0.05},"ice-mid-4":{"type":"shield","dmgType":"mag","mpCost":150,"mult":1,"duration":3,"reduce":0.25,"hpCost":0.05},"ice-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2,"hpCost":0.05},"ice-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":4.25,"effect":{"type":"ice","chance":0.35},"hpCost":0.08},"ice-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":3.13,"effect":{"type":"ice","chance":0.35},"hpCost":0.08},"ice-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":2,"freeze":0.8,"aoe":true,"hpCost":0.08},"ice-high-4":{"type":"shield","dmgType":"mag","mpCost":300,"mult":1,"duration":4,"reduce":0.35,"hpCost":0.08},"ice-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3,"hpCost":0.08},"poison-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":2,"effect":{"type":"poison","chance":0.15},"hpCost":0.03},"poison-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.38,"effect":{"type":"poison","chance":0.15},"hpCost":0.03},"poison-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":1,"freeze":0.4,"hpCost":0.03},"poison-low-4":{"type":"buff","dmgType":"mag","mpCost":60,"mult":1.15,"duration":3,"hpCost":0.03},"poison-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12,"hpCost":0.03},"poison-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":3,"effect":{"type":"poison","chance":0.25},"hpCost":0.05},"poison-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2.13,"effect":{"type":"poison","chance":0.25},"hpCost":0.05},"poison-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.5,"freeze":0.6,"aoe":true,"hpCost":0.05},"poison-mid-4":{"type":"buff","dmgType":"mag","mpCost":150,"mult":1.25,"duration":3,"hpCost":0.05},"poison-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2,"hpCost":0.05},"poison-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":4.25,"effect":{"type":"poison","chance":0.35},"hpCost":0.08},"poison-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":3.13,"effect":{"type":"poison","chance":0.35},"hpCost":0.08},"poison-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":2,"freeze":0.8,"aoe":true,"hpCost":0.08},"poison-high-4":{"type":"buff","dmgType":"mag","mpCost":300,"mult":1.4,"duration":4,"hpCost":0.08},"poison-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3,"hpCost":0.08},"blood-low-1":{"type":"single","dmgType":"phys","mpCost":60,"mult":2,"lifesteal":0.25,"hpCost":0.03},"blood-low-2":{"type":"aoe","dmgType":"phys","mpCost":60,"mult":1.38,"lifesteal":0.25,"hpCost":0.03},"blood-low-3":{"type":"control","dmgType":"phys","mpCost":60,"mult":1,"freeze":0.4,"hpCost":0.03},"blood-low-4":{"type":"buff","dmgType":"phys","mpCost":60,"mult":1.15,"duration":3,"hpCost":0.03},"blood-low-5":{"type":"heal","dmgType":"phys","mpCost":60,"mult":0.12,"hpCost":0.03},"blood-mid-1":{"type":"single","dmgType":"phys","mpCost":150,"mult":3,"lifesteal":0.25,"hpCost":0.05},"blood-mid-2":{"type":"aoe","dmgType":"phys","mpCost":150,"mult":2.13,"lifesteal":0.25,"hpCost":0.05},"blood-mid-3":{"type":"control","dmgType":"phys","mpCost":150,"mult":1.5,"freeze":0.6,"aoe":true,"hpCost":0.05},"blood-mid-4":{"type":"buff","dmgType":"phys","mpCost":150,"mult":1.25,"duration":3,"hpCost":0.05},"blood-mid-5":{"type":"heal","dmgType":"phys","mpCost":150,"mult":0.2,"hpCost":0.05},"blood-high-1":{"type":"single","dmgType":"phys","mpCost":300,"mult":4.25,"lifesteal":0.25,"hpCost":0.08},"blood-high-2":{"type":"aoe","dmgType":"phys","mpCost":300,"mult":3.13,"lifesteal":0.25,"hpCost":0.08},"blood-high-3":{"type":"control","dmgType":"phys","mpCost":300,"mult":2,"freeze":0.8,"aoe":true,"hpCost":0.08},"blood-high-4":{"type":"buff","dmgType":"phys","mpCost":300,"mult":1.4,"duration":4,"hpCost":0.08},"blood-high-5":{"type":"heal","dmgType":"phys","mpCost":300,"mult":0.3,"hpCost":0.08},"nether-low-1":{"type":"single","dmgType":"mag","mpCost":60,"mult":2,"effect":{"type":"poison","chance":0.15},"hpCost":0.03},"nether-low-2":{"type":"aoe","dmgType":"mag","mpCost":60,"mult":1.38,"effect":{"type":"poison","chance":0.15},"hpCost":0.03},"nether-low-3":{"type":"control","dmgType":"mag","mpCost":60,"mult":1,"freeze":0.4,"hpCost":0.03},"nether-low-4":{"type":"buff","dmgType":"mag","mpCost":60,"mult":1.15,"duration":3,"hpCost":0.03},"nether-low-5":{"type":"heal","dmgType":"mag","mpCost":60,"mult":0.12,"hpCost":0.03},"nether-mid-1":{"type":"single","dmgType":"mag","mpCost":150,"mult":3,"effect":{"type":"poison","chance":0.25},"hpCost":0.05},"nether-mid-2":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2.13,"effect":{"type":"poison","chance":0.25},"hpCost":0.05},"nether-mid-3":{"type":"control","dmgType":"mag","mpCost":150,"mult":1.5,"freeze":0.6,"aoe":true,"hpCost":0.05},"nether-mid-4":{"type":"buff","dmgType":"mag","mpCost":150,"mult":1.25,"duration":3,"hpCost":0.05},"nether-mid-5":{"type":"heal","dmgType":"mag","mpCost":150,"mult":0.2,"hpCost":0.05},"nether-high-1":{"type":"single","dmgType":"mag","mpCost":300,"mult":4.25,"effect":{"type":"poison","chance":0.35},"hpCost":0.08},"nether-high-2":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":3.13,"effect":{"type":"poison","chance":0.35},"hpCost":0.08},"nether-high-3":{"type":"control","dmgType":"mag","mpCost":300,"mult":2,"freeze":0.8,"aoe":true,"hpCost":0.08},"nether-high-4":{"type":"buff","dmgType":"mag","mpCost":300,"mult":1.4,"duration":4,"hpCost":0.08},"nether-high-5":{"type":"heal","dmgType":"mag","mpCost":300,"mult":0.3,"hpCost":0.08},"law-sword":{"type":"single","dmgType":"phys","mpCost":600,"mult":5,"effect":{"type":"metal","chance":0.5}},"law-life":{"type":"heal","dmgType":"mag","mpCost":600,"mult":0.5},"law-sea":{"type":"aoe","dmgType":"mag","mpCost":600,"mult":3.8,"effect":{"type":"ice","chance":0.5}},"law-sun":{"type":"aoe","dmgType":"mag","mpCost":600,"mult":3.8,"effect":{"type":"fire","chance":0.5}},"law-earth":{"type":"shield","dmgType":"phys","mpCost":600,"mult":1,"duration":5,"reduce":0.5},"law-thunder":{"type":"aoe","dmgType":"mag","mpCost":600,"mult":3.8,"effect":{"type":"thunder","chance":0.5}},"law-time":{"type":"control","dmgType":"mag","mpCost":600,"mult":2,"freeze":1,"aoe":true},"law-space":{"type":"control","dmgType":"mag","mpCost":600,"mult":2,"freeze":1},"taboo-devour":{"type":"single","dmgType":"phys","mpCost":600,"mult":6.25,"lifesteal":0.25,"hpCost":0.12},"taboo-sacrifice":{"type":"aoe","dmgType":"phys","mpCost":600,"mult":4.75,"lifesteal":0.25,"hpCost":0.12},"taboo-banner":{"type":"aoe","dmgType":"mag","mpCost":600,"mult":4.75,"effect":{"type":"poison","chance":0.5},"hpCost":0.12},"taboo-slay":{"type":"single","dmgType":"phys","mpCost":600,"mult":6.25,"effect":{"type":"metal","chance":0.5},"hpCost":0.12},"taboo-plague":{"type":"aoe","dmgType":"mag","mpCost":600,"mult":4.75,"effect":{"type":"poison","chance":0.5},"hpCost":0.12},"taboo-silence":{"type":"control","dmgType":"mag","mpCost":600,"mult":2.5,"freeze":1,"aoe":true,"hpCost":0.12},"taboo-burnsoul":{"type":"buff","dmgType":"mag","mpCost":600,"mult":1.8,"duration":5,"hpCost":0.12},"taboo-undying":{"type":"shield","dmgType":"mag","mpCost":600,"mult":1,"duration":5,"reduce":0.5,"hpCost":0.12}},"sect":{"太極拳":{"type":"single","dmgType":"phys","mpCost":45,"mult":1.5},"純陽無極功":{"type":"single","dmgType":"mag","mpCost":60,"mult":1.5},"峨嵋劍法":{"type":"single","dmgType":"phys","mpCost":60,"mult":1.5},"清心普善咒":{"type":"aoe","dmgType":"mag","mpCost":75,"mult":1.5},"金剛伏魔":{"type":"single","dmgType":"phys","mpCost":75,"mult":1.5},"獅子吼":{"type":"aoe","dmgType":"mag","mpCost":75,"mult":1.5},"全真劍法":{"type":"single","dmgType":"phys","mpCost":60,"mult":1.5},"先天功":{"type":"single","dmgType":"mag","mpCost":75,"mult":1.5},"真龍拳":{"type":"single","dmgType":"phys","mpCost":75,"mult":1.5},"皇極經世":{"type":"aoe","dmgType":"mag","mpCost":90,"mult":1.5},"天山折梅手":{"type":"single","dmgType":"phys","mpCost":60,"mult":1.5},"逍遙扇舞":{"type":"aoe","dmgType":"mag","mpCost":75,"mult":1.5},"玉清仙法":{"type":"aoe","dmgType":"mag","mpCost":120,"mult":2},"崑崙印":{"type":"single","dmgType":"phys","mpCost":105,"mult":2},"萬劍訣":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2},"天劍":{"type":"single","dmgType":"phys","mpCost":120,"mult":2},"三昧真火":{"type":"aoe","dmgType":"mag","mpCost":135,"mult":2},"丹爐撼岳":{"type":"single","dmgType":"phys","mpCost":105,"mult":2},"獸王怒":{"type":"single","dmgType":"phys","mpCost":105,"mult":2},"萬獸奔騰":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2},"噬血斬":{"type":"single","dmgType":"phys","mpCost":105,"mult":2},"天魔解體":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2},"天音破魔曲":{"type":"aoe","dmgType":"mag","mpCost":150,"mult":2},"裂石音刃":{"type":"single","dmgType":"phys","mpCost":120,"mult":2},"太極陰陽圖":{"type":"aoe","dmgType":"mag","mpCost":240,"mult":3},"九轉金丹掌":{"type":"single","dmgType":"phys","mpCost":180,"mult":3},"翻天印":{"type":"single","dmgType":"phys","mpCost":210,"mult":3},"金光神咒":{"type":"aoe","dmgType":"mag","mpCost":240,"mult":3},"誅仙劍陣":{"type":"aoe","dmgType":"phys","mpCost":300,"mult":3},"上清雷法":{"type":"single","dmgType":"mag","mpCost":180,"mult":3},"萬界穿梭":{"type":"single","dmgType":"phys","mpCost":180,"mult":3},"諸天寂滅":{"type":"aoe","dmgType":"mag","mpCost":300,"mult":3},"九幽冥掌":{"type":"single","dmgType":"phys","mpCost":210,"mult":3},"黃泉引魂":{"type":"aoe","dmgType":"mag","mpCost":270,"mult":3},"天籟九霄":{"type":"aoe","dmgType":"mag","mpCost":270,"mult":3},"仙音斷魂":{"type":"single","dmgType":"phys","mpCost":210,"mult":3}},"prof":{"sword":[{"rank":5,"chance":0.1,"target":"aoe","dmgType":"phys","mult":1.2},{"rank":8,"chance":0.1,"target":"single","dmgType":"phys","mult":2.5,"attrs":{"metal":50}},{"rank":10,"chance":0.08,"target":"single","dmgType":"phys","mult":4,"attrs":{"metal":100}}],"blade":[{"rank":5,"chance":0.12,"target":"single","dmgType":"phys","mult":2,"attrs":{"metal":40}},{"rank":8,"chance":0.1,"target":"aoe","dmgType":"phys","mult":1.5},{"rank":10,"chance":0.08,"target":"aoe","dmgType":"phys","mult":2.5,"attrs":{"metal":60}}],"fan":[{"rank":5,"chance":0.12,"target":"aoe","dmgType":"mag","mult":1.2,"attrs":{"ice":30}},{"rank":8,"chance":0.1,"target":"aoe","dmgType":"mag","mult":1.8,"attrs":{"poison":50}},{"rank":10,"chance":0.08,"target":"aoe","dmgType":"mag","mult":2.8,"attrs":{"ice":60}}],"bow":[{"rank":5,"chance":0.12,"target":"single","dmgType":"phys","mult":1.8,"attrs":{"thunder":30}},{"rank":8,"chance":0.1,"target":"single","dmgType":"phys","mult":3,"attrs":{"thunder":60}},{"rank":10,"chance":0.08,"target":"aoe","dmgType":"phys","mult":2.2,"attrs":{"thunder":80}}],"flute":[{"rank":5,"chance":0.12,"target":"self","heal":0.08,"mpHeal":0.08},{"rank":8,"chance":0.08,"target":"aoe","dmgType":"mag","mult":1.5,"freezeAll":true},{"rank":10,"chance":0.08,"target":"aoe","dmgType":"mag","mult":2.2,"attrs":{"ice":60},"heal":0.1}],"brush":[{"rank":5,"chance":0.12,"target":"single","dmgType":"mag","mult":2,"attrs":{"fire":60}},{"rank":8,"chance":0.1,"target":"aoe","dmgType":"mag","mult":1.6,"attrs":{"poison":60}},{"rank":10,"chance":0.08,"target":"aoe","dmgType":"mag","mult":3,"attrs":{"fire":80}}]},"art":{"lb3_artifact":{"chance":0.18,"target":"aoe","dmgType":"phys","mult":2.5,"attrs":{"ice":40}},"lb3_artifact_coffin":{"chance":0.2,"target":"self","shield":{"reduce":0.5,"duration":2},"heal":0.12},"lb3_artifact_sword":{"chance":0.18,"target":"single","dmgType":"phys","mult":2.5,"attrs":{"metal":100}},"lb3_artifact_cauldron":{"chance":0.18,"target":"aoe","dmgType":"phys","mult":1.8,"attrs":{"fire":100},"heal":0.08,"mpHeal":0.08},"lb3_artifact_jar":{"chance":0.18,"target":"single","dmgType":"mag","mult":3,"attrs":{"poison":100},"lifesteal":0.3},"lb3_artifact_wushi":{"chance":0.18,"target":"single","dmgType":"mag","mult":1.5,"freezeAll":true}},"partner":{"xiaoyan":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2.6,"attrs":{"fire":100},"mp":30},"lindong":{"chance":0.17,"target":"single","dmgType":"mag","mult":2.6,"lifesteal":0.3,"mp":30},"dashanren":{"chance":0.16,"target":"aoe","dmgType":"phys","mult":2.2,"mp":25},"lifeiyu":{"chance":0.16,"target":"single","dmgType":"phys","mult":2.2,"mp":25},"hanli":{"chance":0.18,"target":"aoe","dmgType":"phys","mult":2.4,"attrs":{"thunder":100},"mp":35},"nangongwan":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2.2,"heal":0.08,"mp":30},"chennan":{"chance":0.18,"target":"single","dmgType":"phys","mult":3,"mp":35},"muchen":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2.2,"shield":{"reduce":0.3,"duration":2},"mp":30},"tangsan":{"chance":0.16,"target":"single","dmgType":"phys","mult":1.6,"freezeAll":true,"mp":25},"yefan":{"chance":0.18,"target":"single","dmgType":"phys","mult":3,"heal":0.06,"mp":35},"hengren":{"chance":0.18,"target":"single","dmgType":"mag","mult":3,"attrs":{"poison":100},"lifesteal":0.25,"mp":35},"wushi":{"chance":0.17,"target":"aoe","dmgType":"phys","mult":2.2,"shield":{"reduce":0.3,"duration":2},"mp":30},"duande":{"chance":0.16,"target":"single","dmgType":"mag","mult":2.2,"attrs":{"ice":100},"mp":25},"douzhan":{"chance":0.17,"target":"single","dmgType":"phys","mult":2.6,"mp":30},"xukong":{"chance":0.17,"target":"single","dmgType":"mag","mult":2.6,"mp":30},"hengyu":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2.2,"attrs":{"fire":100},"mp":30},"qingdi":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2.2,"heal":0.1,"mp":30},"xihuangmu":{"chance":0.17,"target":"single","dmgType":"mag","mult":2.2,"shield":{"reduce":0.4,"duration":2},"mp":30},"amituo":{"chance":0.17,"target":"self","heal":0.15,"shield":{"reduce":0.5,"duration":2},"mp":30},"luofeng":{"chance":0.18,"target":"aoe","dmgType":"phys","mult":2.5,"heal":0.1,"mp":35},"shihao":{"chance":0.18,"target":"aoe","dmgType":"phys","mult":2.4,"attrs":{"thunder":100},"mp":35},"wanglin":{"chance":0.17,"target":"single","dmgType":"mag","mult":2.6,"mp":30},"menghao":{"chance":0.17,"target":"single","dmgType":"mag","mult":2.6,"mp":30},"baixiaochun":{"chance":0.16,"target":"self","heal":0.15,"shield":{"reduce":0.4,"duration":2},"mp":25},"qinyu":{"chance":0.18,"target":"aoe","dmgType":"mag","mult":2.4,"mp":35},"linlei":{"chance":0.17,"target":"aoe","dmgType":"phys","mult":2.2,"mp":30},"zhangxiaofan":{"chance":0.16,"target":"single","dmgType":"mag","mult":2.2,"lifesteal":0.25,"mp":25},"liqiye":{"chance":0.18,"target":"single","dmgType":"mag","mult":3,"mp":35},"hong":{"chance":0.18,"target":"single","dmgType":"phys","mult":3,"mp":35},"leishen":{"chance":0.18,"target":"aoe","dmgType":"mag","mult":2.4,"attrs":{"thunder":100},"mp":35},"huoyuhao":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2,"attrs":{"ice":100},"mp":30},"tangwulin":{"chance":0.17,"target":"single","dmgType":"phys","mult":2.6,"mp":30},"guyuena":{"chance":0.17,"target":"aoe","dmgType":"mag","mult":2,"heal":0.12,"mp":30},"tangxuanyu":{"chance":0.18,"target":"aoe","dmgType":"mag","mult":2.4,"heal":0.08,"mp":35},"aosika":{"chance":0.15,"target":"self","heal":0.12,"mpHeal":0.08,"mp":20},"mahongjun":{"chance":0.15,"target":"aoe","dmgType":"mag","mult":1.6,"attrs":{"fire":100},"mp":20},"ningrongrong":{"chance":0.15,"target":"self","mpHeal":0.1,"shield":{"reduce":0.25,"duration":2},"mp":20},"xiaoyixian":{"chance":0.15,"target":"aoe","dmgType":"mag","mult":1.6,"attrs":{"poison":100},"mp":20},"ziling":{"chance":0.15,"target":"single","dmgType":"mag","mult":1.4,"freezeAll":true,"mp":20},"xuxin":{"chance":0.15,"target":"self","heal":0.1,"shield":{"reduce":0.2,"duration":2},"mp":20},"qinshuang":{"chance":0.15,"target":"single","dmgType":"phys","mult":1.8,"attrs":{"ice":100},"mp":20},"babata":{"chance":0.15,"target":"single","dmgType":"mag","mult":1.5,"mpHeal":0.06,"mp":20},"jinjiao":{"chance":0.15,"target":"aoe","dmgType":"phys","mult":1.6,"mp":20},"moyunteng":{"chance":0.15,"target":"single","dmgType":"mag","mult":1.5,"lifesteal":0.3,"mp":20}},"beast":{"c1":{"cat":"control","freeze":1,"mp":10},"c2":{"cat":"control","weaken":0.15,"turns":3,"mp":10},"c3":{"cat":"control","silence":2,"mp":15},"c4":{"cat":"control","weaken":0.25,"turns":3,"mp":15},"c5":{"cat":"control","vuln":0.2,"turns":3,"mp":20},"c6":{"cat":"control","silence":3,"mp":20},"c7":{"cat":"control","freeze":1,"aoe":true,"mp":25},"c8":{"cat":"control","freeze":2,"mp":25},"c9":{"cat":"control","weaken":0.35,"silence":2,"turns":4,"mp":30},"c10":{"cat":"control","freeze":2,"aoe":true,"vuln":0.25,"turns":3,"mp":40},"a1":{"cat":"attack","mult":0.3,"mp":10},"a2":{"cat":"attack","mult":0.18,"aoe":true,"mp":10},"a3":{"cat":"attack","mult":0.25,"poison":2,"mp":15},"a4":{"cat":"attack","mult":0.5,"mp":15},"a5":{"cat":"attack","mult":0.3,"aoe":true,"burn":1,"mp":20},"a6":{"cat":"attack","mult":0.55,"execute":true,"mp":20},"a7":{"cat":"attack","mult":0.6,"drain":0.5,"mp":25},"a8":{"cat":"attack","mult":0.45,"aoe":true,"mp":25},"a9":{"cat":"attack","mult":0.9,"burn":2,"mp":30},"a10":{"cat":"attack","mult":1.2,"splash":0.4,"mp":40},"b1":{"cat":"buff","turns":3,"effects":{"atk":1.15},"mp":10},"b2":{"cat":"buff","turns":3,"effects":{"reduce":0.15},"mp":10},"b3":{"cat":"buff","turns":3,"effects":{"eva":8},"mp":15},"b4":{"cat":"buff","turns":3,"effects":{"def":10},"mp":15},"b5":{"cat":"buff","turns":3,"effects":{"crit":10},"mp":20},"b6":{"cat":"buff","turns":3,"effects":{"combo":12},"mp":20},"b7":{"cat":"buff","turns":4,"effects":{"hit":15},"mp":25},"b8":{"cat":"buff","turns":4,"effects":{"lifesteal":0.1},"mp":25},"b9":{"cat":"buff","turns":4,"effects":{"armorPen":20},"mp":30},"b10":{"cat":"buff","turns":4,"effects":{"atk":1.3,"reduce":0.25,"crit":10},"mp":40},"h1":{"cat":"heal","heal":0.06,"mp":10},"h2":{"cat":"heal","regen":0.03,"turns":4,"mp":10},"h3":{"cat":"heal","mp_":0.1,"mp":15},"h4":{"cat":"heal","heal":0.1,"mp_":0.05,"mp":15},"h5":{"cat":"heal","regen":0.05,"turns":4,"mp":20},"h6":{"cat":"heal","heal":0.08,"emergency":0.22,"mp":20},"h7":{"cat":"heal","mpRegen":0.05,"turns":4,"mp":25},"h8":{"cat":"heal","heal":0.15,"regen":0.04,"turns":3,"mp":25},"h9":{"cat":"heal","heal":0.25,"mp":30},"h10":{"cat":"heal","heal":0.35,"mp_":0.2,"mp":40},"p1":{"cat":"cleanse","remove":["poison"],"mp":10},"p2":{"cat":"cleanse","remove":["burn"],"mp":10},"p3":{"cat":"cleanse","remove":["freeze"],"mp":15},"p4":{"cat":"cleanse","remove":["silence"],"mp":15},"p5":{"cat":"cleanse","remove":["poison","burn"],"mp":20},"p6":{"cat":"cleanse","remove":["weaken","armor"],"mp":20},"p7":{"cat":"cleanse","remove":["poison","burn"],"immune":3,"mp":25},"p8":{"cat":"cleanse","remove":["freeze","silence"],"immune":3,"mp":25},"p9":{"cat":"cleanse","remove":["poison","burn","freeze","silence","weaken","armor"],"mp":30},"p10":{"cat":"cleanse","remove":["poison","burn","freeze","silence","weaken","armor"],"immune":3,"heal":0.1,"mp":40}},"mpScale":0.1,"prefix":"sect:","pet":{"mpMax":100,"regen":5,"chance":0.3,"freezeCd":2,"max":3},"par":{"mpMax":100,"regen":4,"lv5":0.02},"cap":{"self":0.2,"pet":0.1,"par":0.1},"mpPotions":[["聚氣散",0.05,40,0],["回天靈液",0.1,150,0],["造化神髓液",0.3,350,1]]},"wb":{"rounds":30,"skill":1.3,"daily":3,"variance":0.1,"defK":120,"freeze":1,"boss":[{"n":"八岐大蛇","t":"八首噬天","icon":"🐍","race":"beast","el":"水","def":20,"eva":10,"af":"fire","afv":20,"am":1,"mag":0,"pa":{"atk":0,"def":0,"eva":0,"curse":0.05,"dot":0,"freeze":0,"burn":0,"poison":0},"sa":{"atk":0,"def":5,"eva":0,"regen":0},"aura":"八首齊噬"},{"n":"需佐能呼","t":"暴風荒神","icon":"⚡","race":"demon","el":"水","def":22,"eva":12,"af":"thunder","afv":20,"am":1,"mag":1,"pa":{"atk":0,"def":0,"eva":0,"curse":0,"dot":0,"freeze":0,"burn":0.05,"poison":0},"sa":{"atk":0,"def":5,"eva":0,"regen":0},"aura":"雷火灼身"},{"n":"六道極聖","t":"六道輪迴","icon":"☯️","race":"demon","el":"土","def":24,"eva":10,"af":"poison","afv":20,"am":1,"mag":1,"pa":{"atk":0.05,"def":0,"eva":0,"curse":0,"dot":0,"freeze":0,"burn":0,"poison":0},"sa":{"atk":0,"def":0,"eva":0,"regen":0.001},"aura":"六道威壓"},{"n":"天照大神","t":"八咫神鏡","icon":"☀️","race":"heart","el":"火","def":20,"eva":14,"af":"fire","afv":20,"am":1,"mag":1,"pa":{"atk":0,"def":0,"eva":0,"curse":0,"dot":0,"freeze":0.03,"burn":0,"poison":0},"sa":{"atk":0.05,"def":0,"eva":0,"regen":0},"aura":"天岩戶封印"},{"n":"OP王","t":"金甲武神","icon":"⚔️","race":"demon","el":"金","def":22,"eva":12,"af":"metal","afv":20,"am":1,"mag":1,"pa":{"atk":0.05,"def":0,"eva":0,"curse":0,"dot":0,"freeze":0,"burn":0,"poison":0},"sa":{"atk":0,"def":5,"eva":0,"regen":0},"aura":"金甲護體"}],"L":[[[2.31688,0.44],[2.35448,0.528],[2.3925,0.616],[2.43092,0.704],[2.46976,0.792],[2.50901,0.88],[2.54868,0.968],[2.58877,1.056],[2.62929,1.144],[2.67024,1.232]],[[2.7405,1.76],[2.7827,1.848],[2.82535,1.936],[2.86845,2.024],[2.912,2.112],[2.95601,2.2],[3.00047,2.288],[3.0454,2.376],[3.0908,2.464],[3.13666,2.552]],[[3.21585,3.08],[3.26309,3.168],[3.31082,3.256],[3.35904,3.344],[3.40775,3.432],[3.45696,3.52],[3.50668,3.608],[3.5569,3.696],[3.60764,3.784],[3.6589,3.872]],[[3.74781,4.4],[3.80056,4.488],[3.85384,4.576],[3.90766,4.664],[3.96203,4.752],[4.01694,4.84],[4.0724,4.928],[4.12842,5.016],[4.18499,5.104],[4.24214,5.192]],[[4.34164,5.72],[4.37127,5.808],[4.40109,5.896],[4.43109,5.984],[4.46129,6.072],[4.49167,6.16],[4.52224,6.248],[4.55301,6.336],[4.58396,6.424],[4.61512,6.512]],[[4.69033,7.04],[4.72209,7.128],[4.75405,7.216],[4.7862,7.304],[4.81856,7.392],[4.85112,7.48],[4.88388,7.568],[4.91685,7.656],[4.95002,7.744],[4.9834,7.832]],[[5.06305,8.36],[5.09707,8.448],[5.1313,8.536],[5.16575,8.624],[5.20041,8.712],[5.23528,8.8],[5.27038,8.888],[5.30569,8.976],[5.34122,9.064],[5.37697,9.152]],[[5.46131,9.68],[5.49774,9.768],[5.5344,9.856],[5.57128,9.944],[5.6084,10.032],[5.64574,10.12],[5.68331,10.208],[5.72112,10.296],[5.75916,10.384],[5.79744,10.472]],[[5.88674,11],[5.92574,11.088],[5.96497,11.176],[6.00446,11.264],[6.04418,11.352],[6.08415,11.44],[6.12437,11.528],[6.16483,11.616],[6.20555,11.704],[6.24651,11.792]],[[6.34105,12.32],[6.38279,12.408],[6.42477,12.496],[6.46702,12.584],[6.50952,12.672],[6.55229,12.76],[6.59532,12.848],[6.63861,12.936],[6.68217,13.024],[6.726,13.112]],[[6.82609,13.64],[6.87073,13.728],[6.91564,13.816],[6.96083,13.904],[7.00629,13.992],[7.05203,14.08],[7.09806,14.168],[7.14436,14.256],[7.19095,14.344],[7.23782,14.432]],[[7.34377,14.96],[7.3915,15.048],[7.43953,15.136],[7.48785,15.224],[7.53646,15.312],[7.58537,15.4],[7.63458,15.488],[7.68408,15.576],[7.73389,15.664],[7.78401,15.752]],[[7.89616,16.28],[7.94718,16.368],[7.99852,16.456],[8.05017,16.544],[8.10213,16.632],[8.15441,16.72],[8.20701,16.808],[8.25992,16.896],[8.31316,16.984],[8.36672,17.072]],[[8.48542,17.6],[8.53995,17.688],[8.59481,17.776],[8.65,17.864],[8.70553,17.952],[8.76139,18.04],[8.81759,18.128],[8.87413,18.216],[8.93101,18.304],[8.98824,18.392]],[[9.11387,18.92],[9.17213,19.008],[9.23073,19.096],[9.28969,19.184],[9.34901,19.272],[9.40868,19.36],[9.46872,19.448],[9.52911,19.536],[9.58987,19.624],[9.651,19.712]],[[9.78396,20.24],[9.84617,20.328],[9.90876,20.416],[9.97173,20.504],[10.03507,20.592],[10.0988,20.68],[10.16291,20.768],[10.2274,20.856],[10.29229,20.944],[10.35756,21.032]]]}}/*EX*/;
  const C = EX.C, AFF = ["ice", "fire", "poison", "metal", "thunder"], VAR = ["wind", "light", "dark"], WX = ["金", "木", "水", "火", "土"];
  const AFF_NAME = { ice: "冰（凍結）", fire: "火（燒傷）", poison: "毒（中毒）", metal: "金（重擊）", thunder: "雷（雷擊）", wind: "風（風擊）", light: "光（聖光）", dark: "暗（暗蝕）" };
  const dodge = d => { d = Math.max(0, d || 0); return d / (d + C.evaK); };

  // 你的攻擊面屬性。ctx：{ gdef(eq)→{fx,set}、elem 本命五行、agi 敏捷總值、aura 仙法光環合計、rank 職業階數、team [[夥伴id, 好感是否LV5]]、artifact(slot) 是否神器格 }
  function attrs(p, ctx) {
    const eqs = p.equipment || {}, ex = {}, from = {};
    const add = (label, b, m) => { for (const k in (b || {})) { const v = typeof b[k] === "number" ? b[k] * (m || 1) : b[k]; if (!v) continue; ex[k] = typeof v === "number" ? (ex[k] || 0) + v : v; const l = from[k] = from[k] || [], same = typeof v === "number" && l.find(x => x[0] === label); if (same) same[1] += v; else l.push([label, v]); } };
    const KI = k => AFF.includes(k) || VAR.includes(k) || k === "hit" || k === "def" || k === "eva" || k === "mdef" || /^(cap|elemDmg|elemBoost|special):/.test(k) || (k.startsWith("fx:") && EX.fx[k.slice(3)]);
    // 隨機詞條
    const subs = {}; Object.values(eqs).forEach(eq => { if (eq && Array.isArray(eq.subs)) eq.subs.forEach(s => { if (s && KI(s[0])) subs[s[0]] = (subs[s[0]] || 0) + s[1]; }); }); add("裝備詞條", subs);
    // 套裝
    const cnt = {}; Object.values(eqs).forEach(eq => { const d = eq && ctx.gdef(eq); if (d && d.set && C.setQ.includes(eq.quality)) cnt[d.set] = (cnt[d.set] || 0) + 1; });
    for (const n in cnt) (EX.set[n] || []).forEach(([pc, b]) => { if (cnt[n] >= pc) add(n + "套裝", b); });
    (p.titles || []).forEach(id => add("稱號", EX.title[id]));
    if (EX.prof[p.profession]) add("職業被動", { [EX.prof[p.profession][0]]: EX.prof[p.profession][1] * (ctx.rank || 1) });
    for (const id in (p.fireCollection || {})) if (p.fireCollection[id] > 0) add("異火收錄", EX.fire[id]);
    (ctx.team || []).forEach(([id, lv5]) => add("夥伴", EX.partner[id], lv5 ? C.PARTNER_LV5_PASSIVE_MULT : 1));
    const natures = new Set(), apt = p.aptitude; let pImm = false, ambM = 1;
    if (apt) {
      const r = apt.root;
      if (r) {
        if (EX.rootPick[r.id]) { add("先天靈根", EX.rootPick[r.id][0]); if (EX.rootPick[r.id][1].nature) natures.add(EX.rootPick[r.id][1].nature); if (EX.rootPick[r.id][1].poisonImmune) pImm = true; if (EX.rootPick[r.id][1].ambushMult) ambM *= EX.rootPick[r.id][1].ambushMult; }
        else if (EX.rootGroup[r.group]) { add("先天靈根", EX.rootGroup[r.group][0]); if (EX.rootGroup[r.group][2] > 0) (r.elems || []).forEach(e => add("先天靈根", EX.aff[e], EX.rootGroup[r.group][2])); }   // 偽靈根的五行親和是 0：不能加（add 的倍率 0 會被當成 1）
      }
      const ph = EX.phys[apt.physique];
      if (ph) { add("先天體質", ph[0]); if (ph[1].nature) natures.add(ph[1].nature); if (ph[1].poisonImmune) pImm = true; if (ph[1].ambushMult) ambM *= ph[1].ambushMult; }
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
    // 防禦：五行共鳴（單一五行 5 件的共鳴可以同時有好幾個，再加上特殊共鳴）
    const rootDef = WX.filter(e => ec[e] >= C.ROOT_SINGLE_COUNT).reduce((s, e) => s + ((EX.resSingle[e] || {}).def || 0), 0) + (root.def || 0);
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
      poisonMax: root.poisonMax || C.POISON_MAX_STACKS, rage: !!ex["special:rage"], echo: !!ex["special:echo"], undying: !!ex["special:undying"],
      bonus: { def: ex.def || 0, eva: ex.eva || 0, mdef: ex.mdef || 0 }, rootDef, rootRegen: root.regen || 0, dodgeStrike: !!ex["special:dodgeStrike"],   // 裝備本身以外的防禦／閃避／魔防（詞條、套裝、稱號、異火、夥伴、資質、天賦、傳奇威能…）與共鳴的防禦
      burnMax: root.burnMax || C.BURN_MAX_STACKS, poisonImmune: pImm, ambushMult: ambM, freezeResist: 1 - (1 - (root.freezeResist || 0)) * (1 - F("定神")) };
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
  // 時空秘境／仙魔戰場的存活模擬（o.S 指定地圖資料，預設 EX.st 時空秘境；EX.xm＝仙魔戰場，妖獸強度每隻在範圍內隨機）：
  //   照遊戲每秒一回合的流程實際打 n 場、每場最多 T 秒，回傳撐過 10 分鐘／1 小時的比例與存活時間中位數。
  //   每回合的順序和遊戲一樣：靈寵持續淨化 → 你身上的燒傷中毒 → 你出手（40% 放技能格裡的招式，否則普攻；連擊、橫掃、追擊、風擊、疾風、之怒…）
  //   → 神器技能 → 職業技能 → 夥伴絕學 → 靈寵出手 → 妖獸身上的燒傷中毒 → 回春回靈 → 清掉倒下的 → 妖獸出手（護盾、金身、反震、閃擊）
  //   I 由攻略頁的 stCalc 組出來（攻擊基數與增益池、防禦閃避、裝備特效、屬性觸發、技能清單、夥伴、靈寵、丹藥設定…），欄位見該處
  function spacetime(I, o) {
    const S = (o && o.S) || EX.st, CB = EX.cb, n = (o && o.n) || 120, T = (o && o.T) || 3600, k = ((o && o.str) || S.str) / S.str, r0 = S.minRealm || 0, B = S.base[Math.max(r0, Math.min(S.maxRealm, I.r)) - r0];
    const SR = B[5] || null, kA = k * (SR ? (SR[0] + SR[1]) / 2 : 1);   // SR＝強度範圍（每隻各擲）；野外修士用平均強度
    let seed = ((o && o.seed) || 20261006) >>> 0;
    const rnd = () => { seed = seed + 0x6D2B79F5 >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const roll = () => 1 + (rnd() * 2 - 1) * S.variance, dm = p => S.defK / (S.defK + Math.max(0, p)), tw = S.mon.reduce((s, m) => s + m.w, 0), SK = S.sk, CU = S.cult, [afP, afC, afT, afM] = S.affix;
    const F = q => I.fx[q] || 0, AF = I.aff, bk = I.book, ys = I.ys, EB = I.elemBoost || {}, RD = I.race || {}, ELS = ["金", "木", "水", "火", "土"], ELK = ["ice", "fire", "poison", "metal", "thunder"];
    const BON = C.WUXING_COUNTER_BONUS, PEN = C.WUXING_COUNTERED_PENALTY;
    // 妖獸的五行對你：[牠打你的倍率, 你打牠的倍率]
    const wxOf = el => !I.elem || I.ignoreCounter ? [1, 1] : [C.wxc[el] === I.elem ? 1 + BON : C.wxc[I.elem] === el ? 1 - PEN : 1, C.wxc[I.elem] === el ? (1 + BON) * (1 + F("剋敵")) : C.wxc[el] === I.elem ? 1 - PEN : 1];
    const skills = I.skills || [], art = I.art || null, prof = I.prof || [], pars = I.partners || [], beasts = I.beasts || [], times = [];
    const stack = (d, max, per) => d ? { s: Math.min(max, d.s + 1), t: C.BURN_TURNS, per: Math.max(d.per, per) } : { s: 1, t: C.BURN_TURNS, per };
    const R = {};   // 最近一次命中觸發了哪些效果
    let kills = 0, pots = 0, secs = 0, deaths = 0, casts = 0; const immortal = !!(o && o.immortal);
    for (let i = 0; i < n; i++) {
      let hp = I.hp, mp = I.mp, cd = 0, cdM = 0, rest = 0, es = [], t = 0, dead = false, gwr = 0, first = false, undy = false, dsr = false, sunder = 0, frozen = 0, burn = null, poison = null;
      let buffT = 0, buffM = 1, petBuffT = 0, petBuffM = 1, petShT = 0, petShR = 0, parShT = 0, parShR = 0, selfShT = 0, selfShR = 0, petRegT = 0, petRegR = 0, immT = 0, immL = null;
      const petFx = {}, bMp = beasts.map(() => CB.pet.mpMax), pMp = pars.map(() => CB.par.mpMax);
      const pv = q => { const e = petFx[q]; return e && e.t > 0 ? e.v : 0; };
      const heal = v => { hp = Math.min(I.hp, hp + v); }, healMp = v => { mp = Math.min(I.mp, mp + v); };
      const die = () => { if (hp > 0) return false; if (I.undying && !undy) { undy = true; hp = 1; return false; } if (immortal) { deaths++; hp = I.hp; return false; } return dead = true; };
      const atkOf = mag => Math.max(1, Math.round((mag ? I.mb : I.pb) * (1 + Math.max(-.9, Math.min(I.cap, (mag ? I.bm : I.bp) + (buffT > 0 && buffM ? buffM - 1 : 0) + (petBuffT > 0 && petBuffM ? petBuffM - 1 : 0))))));
      const alive = () => es.filter(e => e.hp > 0), firstAlive = () => es.find(e => e.hp > 0);
      // 單次命中（閃避 → 浮動 → 種族 → 元神 → 秘典 → 金 → 雷 → 五行 → 光 → 暗 → 暴擊 → 減傷 → 冰火毒），ov＝這一招自帶的屬性機率（和你原本的取高的）
      const hitM = (e, raw, power, mag, ov, wind) => {
        R.dodge = R.ice = R.fire = R.poison = R.metal = R.thunder = R.light = R.dark = false;
        const d0 = e.eva + (e.ph > 0 ? SK.phantom.eva : 0) - (I.hit + pv("hit")); if (d0 > 0 && rnd() < dodge(d0)) { R.dodge = true; return 0; }
        const a = q => ov && ov[q] > AF[q] ? ov[q] : AF[q];
        let d = raw * roll(); if (e.race && RD[e.race]) d *= 1 + RD[e.race];
        if (ys && ((ys[0] && I.elem === ys[0]) || (ys[1] === "wind" && wind))) d *= 1 + ys[2];
        if (I.elem) d *= 1 + (bk.wuxing[I.elem] || 0);
        if (e.fz > 0) d *= (1 + bk.ice) * (1 + F("寒徹"));
        if (a("metal") > 0 && rnd() < a("metal") / 100) { d *= (1 + C.METAL_BONUS) * (1 + bk.metal); R.metal = true; }
        const th = a("thunder") > 0 && rnd() < a("thunder") / 100; if (th) { d *= (1 + C.THUNDER_BONUS) * (1 + bk.thunder) * (ys && ys[1] === "thunder" ? 1 + ys[2] : 1); R.thunder = true; }
        d *= e.wx[1];
        if (I.nature && e.nat && I.nature !== e.nat) d *= 1 + C.LIGHT_DARK_COUNTER_BONUS;
        if (AF.light > 0 && rnd() < AF.light / 100) { d *= 1 + C.LIGHT_BONUS; R.light = true; }
        const dark = AF.dark > 0 && rnd() < AF.dark / 100; R.dark = dark;
        const cr = (mag ? I.magCrit : I.crit) + pv("crit") / 100; if (cr > 0 && rnd() < cr) d *= I.critDmg;
        if (!th && !dark) d *= 1 - Math.max(0, (mag ? e.m.mres : e.m.def) - (I.pen + pv("armorPen"))) / 100;
        if (a("ice") > 0 && rnd() < a("ice") / 100) { e.fz = Math.max(e.fz, S.freeze); R.ice = true; }
        if (a("fire") > 0 && rnd() < a("fire") / 100) { e.burn = stack(e.burn, I.burnMax, power * C.BURN_RATE * (1 + bk.fire) * (1 + F("焚燼")) * (ys && ys[0] === "火" ? 1 + ys[2] : 1)); R.fire = true; }
        if (a("poison") > 0 && e.race !== "ghost" && rnd() < a("poison") / 100) { e.poison = stack(e.poison, I.poisonMax, power * C.POISON_RATE * (1 + bk.poison) * (1 + F("蝕骨"))); R.poison = true; }
        return d;
      };
      // 你的普攻與技能格招式的每一下：首擊、燃魂、斬殺、本命五行加傷、閃避後強擊、破綻，命中後的連鎖（屬性強擊、冰封、連雷、毒爆）、聖光回血、暗蝕吸血
      const hitT = (e, dmg, power, mag, ov, wind) => {
        if (!e) return 0;
        let m = 1; if (!first) { first = true; m *= 1 + F("首擊"); }
        if (F("燃魂") && hp > I.hp * .8) m *= 1 + F("燃魂");
        if (F("斬殺") && e.hp < e.max * .2) m *= 1 + F("斬殺");
        if (I.elem && I.elemDmg) m *= 1 + I.elemDmg;
        if (dsr) { dsr = false; m *= 1.3; }
        const d = hitM(e, dmg * m * (e.vulnT > 0 ? 1 + e.vulnV : 1), power, mag, ov, wind); e.hp -= d; let dealt = d;
        const ice = R.ice, thn = R.thunder, lig = R.light, drk = R.dark;
        if (d > 0) ELK.forEach(q => { if (R[q] && EB[q]) { const x = d * EB[q]; e.hp -= x; dealt += x; } });
        if (F("冰封") && ice && rnd() < F("冰封")) { const x = es.find(y => y !== e && y.hp > 0 && !(y.fz > 0)); if (x) x.fz = Math.max(x.fz, S.freeze); }
        if (F("連雷") && thn && d > 0) { const x = es.find(y => y !== e && y.hp > 0); if (x) { x.hp -= d * F("連雷"); dealt += d * F("連雷"); } }
        if (F("毒爆") && e.poison && e.poison.s >= I.poisonMax) { const x = atkOf(0) * F("毒爆"); e.hp -= x; dealt += x; e.poison = null; }
        if (lig && hp > 0) heal(I.hp * S.lightHeal);
        if (drk && hp > 0 && d > 0) heal(d * C.DARK_LIFESTEAL);
        return dealt;
      };
      // 你這回合的出手（extra＝疾風觸發的第二次）
      const attackTurn = extra => {
        if (!extra) gwr++;
        let tot = 0, used = false; const phys = atkOf(0);
        if (skills.length && rnd() < .4) {
          const sk = skills[Math.floor(rnd() * skills.length)], cost = Math.ceil(Math.max(1, Math.ceil((sk.mpCost || 0) * CB.mpScale - 1e-9)) * (1 - F("聚靈")));
          if (mp >= cost) {
            mp -= cost; used = true; casts++;
            const mag = sk.dmgType === "mag", pw = mag ? atkOf(1) : phys, sd = pw * (sk.mult || 1) * I.skillMult, ty = sk.type;
            let ov = sk.effect ? { [sk.effect.type]: sk.effect.chance * 100 } : null, dealt = 0, hits = null;
            if (sk.hpCost) hp -= Math.min(Math.max(0, hp - 1), Math.floor(I.hp * sk.hpCost));
            if (ty === "aoe") hits = () => alive().forEach(e => { dealt += hitT(e, sd, pw, mag, ov); });
            else if (ty === "heal") heal(I.hp * sk.mult);
            else if (ty === "buff") { buffT = sk.duration; buffM = sk.mult; }
            else if (ty === "shield") { selfShR = selfShT > 0 ? Math.max(selfShR, sk.reduce) : sk.reduce; selfShT = Math.max(selfShT, sk.duration); }
            else if (ty === "control") { ov = Object.assign({}, ov, { ice: Math.max((ov && ov.ice) || 0, sk.freeze * 100) }); hits = () => (sk.aoe ? alive() : [firstAlive()]).forEach(e => { dealt += hitT(e, sd, pw, mag, ov); }); }
            else hits = () => { dealt += hitT(firstAlive(), sd, pw, mag, ov); };
            if (hits) { hits(); if (I.echo && rnd() < .15 && firstAlive()) hits(); }
            if (sk.lifesteal && dealt > 0) heal(dealt * sk.lifesteal);
            tot += dealt;
          }
        }
        if (!used) {
          const main = firstAlive(); tot += hitT(main, phys, phys, false);
          if (I.rage && rnd() < .15 && firstAlive()) alive().forEach(e => { tot += hitT(e, phys * 1.5, phys, false); });
          if (F("橫掃") && rnd() < F("橫掃")) es.forEach(e => { if (e !== main && e.hp > 0) tot += hitT(e, phys * .4, phys, false); });
          if (firstAlive() && rnd() < I.combo + pv("combo") / 100) tot += hitT(firstAlive(), phys, phys, false);
        }
        if (AF.wind > 0 && rnd() < AF.wind / 100 && firstAlive()) tot += hitT(firstAlive(), phys * C.WIND_HIT_MULT, phys, false, null, true);
        if (F("追擊") && rnd() < F("追擊") && firstAlive()) tot += hitT(firstAlive(), phys * .6, phys, false);
        if (F("吸血") && tot > 0 && hp > 0) heal(tot * F("吸血"));
        if (pv("lifesteal") && tot > 0 && hp > 0) heal(tot * pv("lifesteal"));
        if (!extra && F("疾風") && rnd() < F("疾風") && firstAlive()) attackTurn(true);
      };
      // 依機率自動發動的招式：神器技能、職業技能、夥伴絕學（不吃首擊這類特效，直接結算）
      const proc = (sk, partner) => {
        const al = alive(); if (sk.target !== "self" && !al.length) return;
        let dealt = 0;
        if (sk.target !== "self") {
          const mag = sk.dmgType === "mag", pw = atkOf(mag), dmg = pw * sk.mult;
          (sk.target === "aoe" ? al : [al[0]]).forEach(e => { const d = hitM(e, dmg, pw, mag, sk.attrs); e.hp -= d; dealt += d; });
          if (sk.freezeAll) al.forEach(e => { e.fz = Math.max(e.fz, S.freeze); });
        }
        if (sk.lifesteal && dealt > 0) heal(dealt * sk.lifesteal);
        if (sk.heal) heal(I.hp * sk.heal);
        if (sk.mpHeal) healMp(I.mp * sk.mpHeal);
        if (sk.shield) {
          if (partner) { parShR = parShT > 0 ? Math.max(parShR, sk.shield.reduce) : sk.shield.reduce; parShT = Math.max(parShT, sk.shield.duration); }
          else { selfShR = selfShT > 0 ? Math.max(selfShR, sk.shield.reduce) : sk.shield.reduce; selfShT = Math.max(selfShT, sk.shield.duration); }
        }
      };
      const hasDebuff = q => q === "poison" ? !!poison : q === "burn" ? !!burn : q === "freeze" ? frozen > 0 : false;
      const cleanse = list => list.forEach(q => { if (q === "poison") poison = null; else if (q === "burn") burn = null; else if (q === "freeze") frozen = 0; });
      const petBuff = (q, v, turns) => {
        if (q === "atk") { petBuffM = petBuffT > 0 ? Math.max(petBuffM, v) : v; petBuffT = Math.max(petBuffT, turns); }
        else if (q === "reduce") { petShR = petShT > 0 ? Math.max(petShR, v) : v; petShT = Math.max(petShT, turns); }
        else { const e = petFx[q]; petFx[q] = e && e.t > 0 ? { v: Math.max(e.v, v), t: Math.max(e.t, turns) } : { v, t: turns }; }
      };
      // 靈寵這回合：先倒數你身上的各種效果，再各自擲出手（氣血低優先補、有異狀優先淨化）
      const petTick = () => {
        if (petBuffT > 0) petBuffT--; if (petShT > 0) petShT--; if (parShT > 0) parShT--; if (selfShT > 0) selfShT--;
        if (petRegT > 0) { petRegT--; heal(I.hp * petRegR); }
        if (pv("mpRegen")) healMp(I.mp * pv("mpRegen"));
        for (const q in petFx) if (petFx[q].t > 0) petFx[q].t--;
        if (immT > 0) immT--;
        es.forEach(e => { if (e.weakT > 0) e.weakT--; if (e.vulnT > 0) e.vulnT--; if (e.fzCd > 0) e.fzCd--; });
        beasts.forEach((list, bi) => {
          bMp[bi] = Math.min(CB.pet.mpMax, bMp[bi] + CB.pet.regen);
          const learned = list.filter(s => s.mp <= bMp[bi]);
          if (!learned.length || rnd() >= CB.pet.chance) return;
          const living = alive(), hr = hp / I.hp, mr = mp / Math.max(1, I.mp), pick = a => a[Math.floor(rnd() * a.length)];
          let sk = null;
          if (hr < .5) { const h = learned.filter(s => s.cat === "heal" && (s.heal || s.regen)); if (h.length) sk = pick(h); }
          if (!sk) { const c = learned.filter(s => s.cat === "cleanse" && s.remove.some(hasDebuff)); if (c.length) sk = pick(c); }
          if (!sk) { const pool = learned.filter(s => s.cat === "cleanse" ? false : s.cat === "heal" ? ((s.heal || s.regen) && hr < .85) || ((s.mp_ || s.mpRegen) && mr < .6) : s.cat === "control" || s.cat === "attack" ? living.length > 0 : true); if (pool.length) sk = pick(pool); }
          if (!sk) return;
          bMp[bi] -= sk.mp;
          if (sk.cat === "attack") {
            const phys = atkOf(0), base = phys * (1 + F("獸魂")); let total = 0;
            const hit = (e, mult) => { let d = base * mult * (e.vulnT > 0 ? 1 + e.vulnV : 1) * roll(); if (sk.execute && e.hp < e.max * .3) d *= 2; e.hp -= d; if (sk.burn) e.burn = stack(e.burn, C.BURN_MAX_STACKS, phys * C.BURN_RATE); if (sk.poison) for (let j = 0; j < sk.poison; j++) e.poison = stack(e.poison, C.POISON_MAX_STACKS, phys * C.POISON_RATE); return d; };
            (sk.aoe ? living : [living[0]]).forEach(e => { total += hit(e, sk.mult); });
            if (sk.splash) living.forEach(e => { if (e.hp > 0) total += hit(e, sk.splash); });
            if (sk.drain && total > 0) heal(total * sk.drain);
          } else if (sk.cat === "control") {
            (sk.aoe ? living : [living[0]]).forEach(e => {
              if (sk.freeze && e.fzCd <= 0) { e.fz = Math.max(e.fz, sk.freeze); e.fzCd = sk.freeze + CB.pet.freezeCd; }
              if (sk.weaken) { e.weakV = e.weakT > 0 ? Math.max(e.weakV, sk.weaken) : sk.weaken; e.weakT = Math.max(e.weakT, sk.turns); }
              if (sk.vuln) { e.vulnV = e.vulnT > 0 ? Math.max(e.vulnV, sk.vuln) : sk.vuln; e.vulnT = Math.max(e.vulnT, sk.turns); }
            });
          } else if (sk.cat === "buff") { for (const q in sk.effects) petBuff(q, sk.effects[q], sk.turns); }
          else if (sk.cat === "heal") {
            const h = sk.emergency && hp < I.hp * .4 ? sk.emergency : sk.heal;
            if (h) heal(I.hp * h); if (sk.mp_) healMp(I.mp * sk.mp_);
            if (sk.regen) { petRegR = petRegT > 0 ? Math.max(petRegR, sk.regen) : sk.regen; petRegT = Math.max(petRegT, sk.turns); }
            if (sk.mpRegen) petBuff("mpRegen", sk.mpRegen, sk.turns);
          } else if (sk.cat === "cleanse") { cleanse(sk.remove); if (sk.immune) { immL = sk.remove; immT = Math.max(immT, sk.immune); } if (sk.heal) heal(I.hp * sk.heal); }
        });
      };
      for (; t < T && !dead; t++) {
        if (cd > 0) cd--; if (cdM > 0) cdM--; if (buffT > 0) buffT--;
        if (I.potion && cd <= 0 && hp < I.hp && hp / I.hp * 100 <= I.potion.th) { heal(I.hp * I.potion.amt); cd = S.cd; pots++; }
        if (I.mpPotion && cdM <= 0 && mp < I.mp && mp / Math.max(1, I.mp) * 100 <= I.mpPotion.th) { healMp(I.mp * I.mpPotion.amt); cdM = S.cd; }
        if (!es.length) {
          if (rest > 0) { rest--; for (let j = 0; j < bMp.length; j++) bMp[j] = Math.min(CB.pet.mpMax, bMp[j] + CB.pet.regen); for (let j = 0; j < pMp.length; j++) pMp[j] = Math.min(CB.par.mpMax, pMp[j] + CB.par.regen); heal(I.hp * S.rest); healMp(I.mp * S.rest); continue; }
          const mk = (m, h, a, eva, race) => ({ m, hp: h, max: h, atk: a, eva, race, af: null, ph: 0, heals: 0, raged: false, fz: 0, burn: null, poison: null, weakT: 0, weakV: 0, vulnT: 0, vulnV: 0, fzCd: 0, skip: false, wx: wxOf(ELS[Math.floor(rnd() * 5)]) });
          const c = S.wave[0] + Math.floor(rnd() * (S.wave[1] - S.wave[0] + 1));
          for (let j = 0; j < c; j++) {
            let x = rnd() * tw, m = S.mon[S.mon.length - 1]; for (const y of S.mon) { x -= y.w; if (x < 0) { m = y; break; } }
            const kk = SR ? k * (SR[0] + rnd() * (SR[1] - SR[0])) : k;
            const e = mk(m, B[0] * kk * m.hp, B[1] * kk * m.atk * (m.mag ? B[3] : 1), m.evaT > 0 ? Math.max(m.eva, B[2]) + m.evaT : m.eva, m.race);
            if (rnd() < afP) e.af = afT[Math.floor(rnd() * afT.length)]; else if (m.cast && rnd() < Math.min(1, afP * (afM - 1) / Math.max(.01, 1 - afP))) e.af = afT[Math.floor(rnd() * afT.length)];
            es.push(e);
          }
          // 野外修士、暗殺者（獵殺邪修解鎖後）：氣血與攻擊是這裡妖獸平均的 1.5／3 倍、術法攻擊；魔道的算魔修（會吸血、吃魔修剋制）
          [[I.cult, CU.mult[0], rnd() < .5], [I.amb, CU.mult[1], !!I.ambDemon]].forEach(([p, mu, demon]) => {
            if (!(p > 0) || rnd() >= p) return;
            const e = mk({ mag: 1, def: CU.def, mres: CU.def, crit: 0, sk: [], steal: demon ? CU.steal : 0 }, B[0] * kA * mu, B[1] * kA * mu * B[3], CU.eva, demon ? "demon" : null);
            if (rnd() < afP) e.af = afT[Math.floor(rnd() * afT.length)];
            e.nat = demon ? "dark" : "light";
            es.push(e);
          });
          gwr = 0; first = false; undy = false; dsr = false; sunder = 0; continue;
        }
        // ---- 你的回合 ----
        if (immT > 0 && immL) cleanse(immL);
        let dot = 0; [burn, poison] = [burn, poison].map(d => { if (!d) return null; dot += d.s * d.per; return --d.t <= 0 ? null : d; });
        const fz = frozen > 0; if (fz) frozen--;
        if (dot > 0) { hp -= dot; if (die()) break; }
        if (!fz) {
          attackTurn(false);
          if (art && rnd() < art.chance) proc(art, false);
          for (const sk of prof) if (rnd() < sk.chance) { proc(sk, false); break; }
          pars.forEach((p, pi) => { pMp[pi] = Math.min(CB.par.mpMax, pMp[pi] + CB.par.regen); if (rnd() >= p.chance || pMp[pi] < p.sk.mp) return; pMp[pi] -= p.sk.mp; proc(p.sk, true); });
        }
        petTick();
        // 妖獸身上的燒傷、中毒發作；被凍結的這回合不能出手
        es.forEach(e => { if (e.hp <= 0) return; ["burn", "poison"].forEach(q => { const x = e[q]; if (!x) return; e.hp -= x.s * x.per; if (--x.t <= 0) e[q] = null; }); e.skip = e.fz > 0; if (e.skip) e.fz--; });
        if (I.regen && hp > 0 && hp < I.hp) heal(I.hp * I.regen);
        if (F("回靈")) healMp(I.mp * F("回靈"));
        const before = es.length; es = es.filter(e => e.hp > 0);
        if (es.length < before) { kills += before - es.length; if (F("噬魂") && hp > 0) heal(I.hp * F("噬魂") * (before - es.length)); }
        if (!es.length) { rest = S.respawn; continue; }
        // ---- 妖獸回合 ----
        const gd = (F("護體") && hp < I.hp * .3 ? F("護體") : 0) + (F("先手盾") && gwr <= 2 ? F("先手盾") : 0) + pv("def");
        const pDef = Math.max(0, I.defSum + gd) * I.defMult * (sunder > 0 ? 1 - SK.sunder.def : 1), pMdef = Math.max(0, I.mdef + gd * S.mdefFromDef), pEva = Math.max(0, I.evaSum + pv("eva")) * I.evaMult;
        const floor = 1 - (CB.cap.self + Math.min(CB.cap.pet, petShT > 0 ? petShR : 0) + Math.min(CB.cap.par, parShT > 0 ? parShR : 0));
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
          const atk = e.atk * (e.weakT > 0 ? 1 - e.weakV : 1) * mult, d0 = pEva - B[2];
          if (d0 > 0 && rnd() < dodge(d0)) {
            if (I.dodgeStrike) dsr = true;
            if (F("閃擊") && e.hp > 0) { const ph = atkOf(0); e.hp -= hitM(e, ph * F("閃擊"), ph, false); }
            return;
          }
          let d = atk * roll(); const th = e.af === "thunder" && rnd() < afC / 100;
          if (th) d *= 1 + C.THUNDER_BONUS;
          d *= e.wx[0];
          if (I.nature && e.nat && I.nature !== e.nat) d *= 1 + C.LIGHT_DARK_COUNTER_BONUS;
          if (rnd() < e.m.crit) d *= S.critDmg;
          if (!th) d *= dm(e.m.mag ? pMdef : pDef);
          const post = d;
          if (e.af === "ice" && rnd() < afC / 100 * (1 - (I.fr || 0))) frozen = Math.max(frozen, S.freeze);
          if (e.af === "poison" && !I.poisonImmune && rnd() < afC / 100) poison = stack(poison, C.POISON_MAX_STACKS, atk * C.POISON_RATE);
          d *= 1 - (e.m.mag ? F("化勁") : F("金身"));
          if (F("反震") && d > 0) e.hp -= d * F("反震");
          if (petShT > 0) d *= 1 - petShR; if (parShT > 0) d *= 1 - parShR; if (selfShT > 0) d *= 1 - selfShR;
          if (post > 0 && d > 0) d = Math.max(d, post * floor);
          total += d;
          if (e.m.steal && e.hp > 0) e.hp = Math.min(e.max, e.hp + d * e.m.steal);
          if (use === "bite" && d > 0 && e.hp > 0) e.hp = Math.min(e.max, e.hp + d * SK.bite.lifesteal);
          if (use === "poison" && !I.poisonImmune) poison = stack(poison, C.POISON_MAX_STACKS, atk * C.POISON_RATE);
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
    return { n, T, p10: p(600), p60: p(3600), median: times[n >> 1], killsHr: secs ? kills / secs * 3600 : 0, potsHr: secs ? pots / secs * 3600 : 0, deathsHr: secs ? deaths / secs * 3600 : 0, castsHr: secs ? casts / secs * 3600 : 0 };
  }
  // 世界 Boss：照遊戲的回合規則打 n 場、每場最多 30 回合，回傳傷害的平均與分布、撐滿的比例。
  //   每回合你用物理／術法攻擊較高的 × 1.3 打一下（連擊再一下），沒有技能、靈寵、夥伴出手，也沒有吸血、回春、丹藥、金身；Boss 的攻擊跟著你的境界與階數
  //   I：{ A＝attrs() 的結果, r 境界, s 階數, hp, phys, mag, crit, magCrit, critDmg, combo, def, mdef, eva }；bi＝第幾隻 Boss
  function wboss(I, bi, o) {
    const W = EX.wb, B = W.boss[bi], A = I.A, n = (o && o.n) || 1000, lv = W.L[Math.max(0, Math.min(W.L.length - 1, I.r))][Math.max(1, Math.min(10, I.s || 1)) - 1];
    let seed = ((o && o.seed) || 20261010 + bi) >>> 0;
    const rnd = () => { seed = seed + 0x6D2B79F5 >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const roll = () => 1 + (rnd() * 2 - 1) * W.variance, dm = p => W.defK / (W.defK + Math.max(0, p)), F = k => A.fx[k] || 0, bk = A.book, af = A.aff;
    const mag = I.mag > I.phys, pAtk = Math.max(I.phys, I.mag) * W.skill * Math.max(.1, 1 - (B.pa.atk || 0)), eAtk = lv[0] * B.am * (1 + (B.sa.atk || 0));
    const eDef = B.def + (B.sa.def || 0), eEva = B.eva + (B.sa.eva || 0), pDef = Math.max(0, (B.mag ? I.mdef : I.def) - (B.pa.def || 0)), pEva = Math.max(0, I.eva - (B.pa.eva || 0));
    // 固定的倍率：種族剋制、本命五行（元神、秘典）、五行相剋
    const wxOut = !A.elem || A.ignoreCounter ? 1 : C.wxc[A.elem] === B.el ? (1 + C.WUXING_COUNTER_BONUS) * (1 + F("剋敵")) : C.wxc[B.el] === A.elem ? 1 - C.WUXING_COUNTERED_PENALTY : 1;
    const wxIn = !A.elem || A.ignoreCounter ? 1 : C.wxc[B.el] === A.elem ? 1 + C.WUXING_COUNTER_BONUS : C.wxc[A.elem] === B.el ? 1 - C.WUXING_COUNTERED_PENALTY : 1;
    const ys = A.ys, base = (1 + race(A, B.race, 0).v) * (ys && ys[0] && A.elem === ys[0] ? 1 + ys[2] : 1) * (A.elem ? 1 + (bk.wuxing[A.elem] || 0) : 1) * wxOut;
    const crit = (mag ? I.magCrit : I.crit) || 0, stack = (d, max, per) => d ? { s: Math.min(max, d.s + 1), t: C.BURN_TURNS, per: Math.max(d.per, per) } : { s: 1, t: C.BURN_TURNS, per };
    const tick = st => { let dot = 0; ["burn", "poison"].forEach(k => { const x = st[k]; if (!x) return; dot += x.s * x.per; if (--x.t <= 0) st[k] = null; }); const fz = st.fz > 0; if (fz) st.fz--; return [dot, fz]; };
    const out = [], rounds = []; let live = 0;
    for (let i = 0; i < n; i++) {
      let hp = I.hp, dealt = 0, r = 0; const P = { burn: null, poison: null, fz: 0 }, E = { burn: null, poison: null, fz: 0 };
      const strike = () => {
        const d0 = eEva - A.evaPen; if (d0 > 0 && rnd() < dodge(d0)) return;
        let d = pAtk * roll() * base; if (E.fz > 0) d *= (1 + bk.ice) * (1 + F("寒徹"));
        if (af.metal > 0 && rnd() < af.metal / 100) d *= (1 + C.METAL_BONUS) * (1 + bk.metal);
        const th = af.thunder > 0 && rnd() < af.thunder / 100; if (th) d *= (1 + C.THUNDER_BONUS) * (1 + bk.thunder) * (ys && ys[1] === "thunder" ? 1 + ys[2] : 1);
        if (af.light > 0 && rnd() < af.light / 100) d *= 1 + C.LIGHT_BONUS;
        const dark = af.dark > 0 && rnd() < af.dark / 100;
        if (crit > 0 && rnd() < crit) d *= I.critDmg || 2;
        if (!th && !dark) d *= 1 - Math.max(0, eDef - A.pen) / 100;
        if (af.ice > 0 && rnd() < af.ice / 100) E.fz = Math.max(E.fz, W.freeze);
        if (af.fire > 0 && rnd() < af.fire / 100) E.burn = stack(E.burn, A.burnMax, pAtk * C.BURN_RATE * (1 + bk.fire) * (1 + F("焚燼")) * (ys && ys[0] === "火" ? 1 + ys[2] : 1));
        if (af.poison > 0 && rnd() < af.poison / 100) E.poison = stack(E.poison, A.poisonMax, pAtk * C.POISON_RATE * (1 + bk.poison) * (1 + F("蝕骨")));
        dealt += d;
      };
      while (r < W.rounds) {
        r++;
        // 光環：每回合機率凍結你、讓你燒傷或中毒
        if (B.pa.freeze && rnd() < B.pa.freeze * (1 - A.freezeResist)) P.fz = Math.max(P.fz, W.freeze);
        if (B.pa.burn && rnd() < B.pa.burn) P.burn = stack(P.burn, C.BURN_MAX_STACKS, eAtk * C.BURN_RATE);
        if (B.pa.poison && !A.poisonImmune && rnd() < B.pa.poison) P.poison = stack(P.poison, C.POISON_MAX_STACKS, eAtk * C.POISON_RATE);
        const [dot, fz] = tick(P); hp -= dot + (B.pa.dot ? I.hp * B.pa.dot : 0); if (hp <= 0) break;
        if (!fz) { strike(); if (rnd() < (I.combo || 0)) strike(); }
        const [ed, efz] = tick(E); dealt += ed;
        if (!efz) {
          const d0 = pEva - lv[1];
          if (!(d0 > 0 && rnd() < dodge(d0))) {
            let d = eAtk * roll(); const hitAf = B.afv > 0 && rnd() < B.afv / 100;
            if (hitAf && B.af === "metal") d *= 1 + C.METAL_BONUS;
            const th = hitAf && B.af === "thunder"; if (th) d *= 1 + C.THUNDER_BONUS;
            d *= wxIn; if (!th) d *= dm(pDef);
            if (hitAf && B.af === "ice" && rnd() >= A.freezeResist) P.fz = Math.max(P.fz, W.freeze);
            if (hitAf && B.af === "fire") P.burn = stack(P.burn, C.BURN_MAX_STACKS, eAtk * C.BURN_RATE);
            if (hitAf && B.af === "poison" && !A.poisonImmune) P.poison = stack(P.poison, C.POISON_MAX_STACKS, eAtk * C.POISON_RATE);
            hp -= d * (1 + (B.pa.curse || 0));
          }
        }
        if (hp <= 0) break;
      }
      const ok = r >= W.rounds && hp > 0; if (ok) live++;
      out.push(dealt); rounds.push(r);
    }
    out.sort((a, b) => a - b);
    const q = p => out[Math.min(n - 1, Math.floor(p * n))];
    return { n, avg: out.reduce((s, x) => s + x, 0) / n, lo: q(.1), mid: q(.5), hi: q(.9), live: live / n, rounds: rounds.reduce((s, x) => s + x, 0) / n, eAtk, mag: !!B.mag, hitOne: eAtk * wxIn * dm(pDef) * (1 + (B.pa.curse || 0)), dodge: dodge(pEva - lv[1]) };
  }
  window.DMG = { EX, C, AFF, VAR, AFF_NAME, attrs, race, hit, normal, extras, dodge, spacetime, wboss };
})();
