/* 四門派 CLASSES／CLASS_SKILLS 與神通資料庫 SKILL_SEED → SKILLS／SKILL_LIST、官方技能公式
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
/* 天下無雙官方四職：劍宗／戟門／詭流／幻道。人物初始屬性與職業取向以官方資料為核心，放置版另加 AI 配裝權重。 */
const CLASSES={
 劍宗:{icon:'劍',weapon:'劍',desc:'官方定位：劍術招式最多、變化最多，主要近身作戰。',attrs:{狠:12,準:10,穩:8,快:25,智:5},growth:{狠:1.5,準:1.15,穩:.9,快:2.4,智:.6},ai:{focus:'快 → 狠 → 準',weights:{狠:1.18,準:1.00,穩:.55,快:1.35,智:.30},note:'AI優先快與狠，兼顧準；劍類武器優先。'}},
 戟門:{icon:'戟',weapon:'戟',desc:'官方定位：招式範圍廣、單招破壞力強，重裝近戰。',attrs:{狠:20,準:10,穩:20,快:5,智:5},growth:{狠:2.5,準:1.1,穩:2.2,快:.6,智:.6},ai:{focus:'狠 → 穩 → 準',weights:{狠:1.32,準:.95,穩:1.28,快:.45,智:.35},note:'AI優先狠與穩，兼顧準；戟類武器與重裝防具優先。'}},
 詭流:{icon:'詭',weapon:'鏜',desc:'官方定位：使用鏜作遠距離攻擊，並搭配風水術。',attrs:{狠:5,準:25,穩:7,快:8,智:15},growth:{狠:.8,準:2.3,穩:.8,快:1.05,智:1.4},ai:{focus:'準 → 狠 → 智',weights:{狠:1.08,準:1.38,穩:.48,快:.85,智:1.00},note:'AI優先準、狠與智；鏜類武器、命中及控場神通優先。'}},
 幻道:{icon:'幻',weapon:'杖',desc:'官方定位：一般攻擊較弱，主要以咒術取勝，重視智。',attrs:{狠:2,準:3,穩:12,快:12,智:31},growth:{狠:.45,準:.55,穩:1.1,快:1.25,智:2.9},ai:{focus:'智 → 穩 → 快',weights:{狠:.42,準:.65,穩:1.08,快:.82,智:1.55},note:'AI優先智、穩與快；杖類武器及法力屬性優先。'}}
};
const CLASS_SKILLS={
 劍宗:['松','桑','竹','柳擺'],
 戟門:['狂雷落','開雲破霧','雪落無痕'],
 詭流:['牙','鷹撲','巨龍卷','鶴擊月華'],
 幻道:['擊','靈彈','木突','無相密宗']
};
/* 由官網四職技能頁＋3.0怪物掉落表整理為「可自由裝備」神通庫。數值用於本單機戰鬥平衡；技能名稱/來源保留官方語彙。 */
const SKILL_SEED={
 '松':{type:'sword',q:'white',lv:1,r:.35,mp:0,desc:'劍宗原始招式，單體快打。',src:'劍宗'},
 '桑':{type:'sword',q:'white',lv:10,r:.55,mp:4,desc:'狠系單體招式。',src:'劍宗'},
 '枫':{type:'sword',q:'green',lv:10,r:.8,mp:8,desc:'以狠為主的斬擊。',src:'劍宗'},
 '竹':{type:'sword',q:'green',lv:10,r:.9,mp:7,crit:.05,desc:'以快為主，帶必殺。',src:'劍宗'},
 '柳擺':{type:'sword',q:'green',lv:15,r:1.25,mp:12,desc:'武器狠強化型攻擊。',src:'劍宗'},
 '蓮開':{type:'sword',q:'green',lv:15,r:1.15,mp:10,crit:.04,desc:'快系攻擊。',src:'劍宗'},
 '桑枫連':{type:'sword',q:'blue',lv:18,r:1.0,mp:14,desc:'快＋狠的連擊。',src:'劍宗'},
 '蒼松':{type:'sword',q:'blue',lv:20,r:1.1,mp:12,crit:.12,desc:'快系暴擊招。',src:'劍宗'},
 '桑折':{type:'sword',q:'blue',lv:20,r:.2,mp:4,elem:'wood',bonusVs:'beast',crit:.05,desc:'木系，對獸系有150%相克加成。',src:'怪物掉落'},
 '枫舞':{type:'sword',q:'blue',lv:20,r:.2,mp:4,elem:'metal',bonusVs:'human',crit:.05,desc:'金系，對人系有150%相克加成。',src:'怪物掉落'},
 '櫻飛':{type:'sword',q:'blue',lv:25,r:1.25,mp:18,elem:'wood',bonusVs:'essence',crit:.1,desc:'木系快攻。',src:'怪物掉落'},
 '竹裂':{type:'sword',q:'purple',lv:25,r:1.45,mp:0,hpCost:.12,crit:.1,desc:'以氣血換輸出的重招。',src:'怪物掉落'},
 '松濤':{type:'sword',q:'purple',lv:25,r:1.5,mp:22,elem:'wood',bonusVs:'essence',crit:.1,desc:'木系強襲。',src:'怪物掉落'},
 '狂雷落':{type:'sword',q:'blue',lv:25,r:.4,mp:0,elem:'metal',bonusVs:'spirit',crit:.05,desc:'武器狠傷害，對靈系有相克加成。',src:'官方戟門技能'},
 '雷鸣':{type:'sword',q:'blue',lv:10,r:.2,mp:4,elem:'none',bonusVs:'beast',crit:.05,desc:'(人物狠+武器狠)×倍率，對獸系有200%相克加成。',src:'官方戟門技能'},
 '落雷':{type:'sword',q:'blue',lv:15,r:.2,mp:4,elem:'none',bonusVs:'human',crit:.05,desc:'(人物狠+武器狠)×倍率，對人系有100%相克加成。',src:'官方戟門技能'},
 '霜降':{type:'body',q:'green',lv:10,r:.25,mp:0,crit:.1,desc:'人物穩×倍率。',src:'官方戟門技能'},
 '開雲破霧':{type:'body',q:'blue',lv:30,r:.5,mp:0,crit:.05,desc:'以人物穩為傷害基礎。',src:'怪物掉落'},
 '雪落無痕':{type:'body',q:'gold',lv:60,r:.9,mp:0,elem:'water',guard:.25,crit:.2,desc:'傷害為人物狠+人物穩；對蟲系追加傷害。',src:'官方戟門技能'},
 '牙':{type:'sword',q:'white',lv:1,r:.4,mp:0,desc:'詭流原始招式。',src:'詭流'},
 '鶴啄':{type:'sword',q:'white',lv:10,r:.85,mp:6,desc:'準＋狠。',src:'詭流'},
 '鷹撲':{type:'charm',q:'green',lv:10,r:.7,mp:7,desc:'準系快速突襲。',src:'詭流'},
 '鷹衝':{type:'charm',q:'green',lv:20,r:1.2,mp:12,desc:'準系連續爆發。',src:'詭流'},
 '虎襲':{type:'sword',q:'blue',lv:20,r:1.35,mp:12,desc:'準＋狠。',src:'詭流'},
 '龍盤':{type:'charm',q:'purple',lv:30,r:1.6,mp:15,desc:'高段數攻擊。',src:'詭流'},
 '巨龍卷':{type:'charm',q:'purple',lv:30,r:2.2,mp:24,desc:'準系大範圍神通。',src:'3.0掉落'},
 '狂鷲落':{type:'charm',q:'purple',lv:30,r:1.6,mp:16,elem:'wood',bonusVs:'essence',crit:.05,desc:'木系控場斬。',src:'詭流'},
 '赤雕':{type:'charm',q:'purple',lv:30,r:1.9,mp:18,crit:.15,desc:'準系高暴擊風術。',src:'詭流'},
 '烈雁行':{type:'charm',q:'purple',lv:35,r:1.8,mp:18,elem:'wood',bonusVs:'beast',crit:.15,desc:'木系對獸特攻。',src:'詭流'},
 '猛虎襲':{type:'charm',q:'purple',lv:40,r:1.9,mp:22,elem:'earth',bonusVs:'insect',crit:.1,desc:'土系對蟲。',src:'詭流'},
 '凶雕爪':{type:'charm',q:'purple',lv:45,r:1.8,mp:20,elem:'metal',bonusVs:'monster',crit:.05,desc:'金系對怪。',src:'詭流'},
 '鳳凰舞':{type:'charm',q:'purple',lv:45,r:1.95,mp:22,elem:'metal',bonusVs:'spirit',crit:.12,desc:'金系對靈。',src:'詭流'},
 '腕狙':{type:'charm',q:'blue',lv:20,r:1.05,mp:20,stun:.55,desc:'風水術，機率令敵人暫停攻擊。',src:'詭流'},
 '影縫':{type:'charm',q:'blue',lv:15,r:.85,mp:18,stun:.4,desc:'風水術，機率定身。',src:'詭流'},
 '地滅':{type:'charm',q:'blue',lv:15,r:1.1,mp:20,stun:.3,elem:'earth',desc:'土系傷害並有控場。',src:'怪物掉落'},
 '直覺':{type:'charm',q:'green',lv:10,r:.75,mp:30,desc:'風水術，單機版轉化為命中強化。',src:'怪物掉落'},
 '天誅':{type:'charm',q:'purple',lv:30,r:1.5,mp:22,stun:.5,desc:'直接傷害並有機率不可攻擊。',src:'詭流'},
 '噩夢':{type:'charm',q:'purple',lv:45,r:1.75,mp:24,desc:'直接傷害風水術。',src:'詭流'},
 '鹤擊月華':{type:'charm',q:'gold',lv:60,r:2.7,mp:0,hpCost:.28,crit:.35,desc:'高暴擊，消耗氣血。',src:'3.0神通'},
 '鶴擊月華':{type:'charm',q:'gold',lv:60,r:2.7,mp:0,hpCost:.28,crit:.35,desc:'高暴擊，消耗氣血。',src:'3.0神通'},
 '擊':{type:'spell',q:'white',lv:1,r:.35,mp:0,desc:'幻道初始招式。',src:'幻道'},
 '靈彈':{type:'spell',q:'white',lv:8,r:1.2,mp:5,desc:'(武器智+自身智)×倍率。',src:'官方幻道技能'},
 '木突':{type:'spell',q:'green',lv:10,r:1.4,mp:7,elem:'wood',bonusVs:'beast',desc:'(武器智+自身智)×倍率，對獸系20%～80%相克加成。',src:'官方幻道技能'},
 '地鬼':{type:'spell',q:'green',lv:10,r:1.6,mp:20,elem:'earth',bonusVs:'human',desc:'(武器智+自身智)×倍率，對人系20%～80%相克加成。',src:'官方幻道技能'},
 '冰川凌風裂':{type:'spell',q:'purple',lv:55,r:2.7,mp:38,elem:'water',bonusVs:'spirit',desc:'水系高傷，對靈特攻。',src:'幻道'},
 '巨木突改':{type:'spell',q:'gold',lv:70,r:3.3,mp:45,elem:'wood',bonusVs:'beast',desc:'木系大招。',src:'幻道'},
 '無相密宗':{type:'spell',q:'gold',lv:60,r:3.6,mp:45,elem:'none',bonusVs:'insect',desc:'無屬性高傷，對蟲額外有效。',src:'3.0神通'},
 '止傷':{type:'body',q:'green',lv:15,r:.7,mp:14,guard:.18,desc:'減傷姿態。',src:'3.0掉落'},
 '谷雨':{type:'spell',q:'green',lv:25,r:1.25,mp:18,elem:'water',desc:'水系攻擊。',src:'3.0掉落'},
 '速':{type:'body',q:'green',lv:28,r:1.0,mp:14,haste:.15,desc:'提升出手速度。',src:'3.0掉落'},
 '魑':{type:'charm',q:'blue',lv:30,r:1.35,mp:18,elem:'wood',stun:.25,desc:'木系特殊傷害。',src:'3.0掉落'},
 '大雪':{type:'spell',q:'blue',lv:32,r:1.5,mp:20,elem:'water',desc:'水系術法。',src:'3.0掉落'},
 '快':{type:'body',q:'blue',lv:32,r:.85,mp:14,haste:.22,desc:'提升快與閃避。',src:'3.0掉落'},
 '連旋風':{type:'sword',q:'blue',lv:36,r:1.55,mp:18,crit:.06,desc:'多段旋風。',src:'3.0掉落'},
 '木':{type:'spell',q:'green',lv:36,r:1.3,mp:16,elem:'wood',bonusVs:'beast',desc:'純木系。',src:'3.0掉落'},
 '甘霖':{type:'body',q:'blue',lv:42,r:.8,mp:20,heal:.08,cd:5,desc:'命中後回復氣血。',src:'3.0掉落'},
 '狂松怒濤':{type:'spell',q:'purple',lv:42,r:1.8,mp:24,elem:'wood',desc:'木系強術。',src:'3.0掉落'},
 '金':{type:'spell',q:'green',lv:44,r:1.35,mp:16,elem:'metal',desc:'金系術法。',src:'3.0掉落'},
 '水':{type:'spell',q:'green',lv:44,r:1.35,mp:16,elem:'water',desc:'水系術法。',src:'3.0掉落'},
 '春風':{type:'body',q:'blue',lv:48,r:.8,mp:18,heal:.1,desc:'春風回氣。',src:'3.0掉落'},
 '火':{type:'spell',q:'blue',lv:50,r:1.55,mp:20,elem:'fire',burn:.18,desc:'火系灼燒。',src:'3.0掉落'},
 '土':{type:'spell',q:'blue',lv:50,r:1.5,mp:20,elem:'earth',desc:'土系攻擊。',src:'3.0掉落'},
 '魍':{type:'charm',q:'purple',lv:55,r:1.9,mp:24,stun:.35,desc:'控場風水術。',src:'3.0掉落'},
 '松濤':{type:'sword',q:'purple',lv:58,r:1.75,mp:22,elem:'wood',bonusVs:'essence',crit:.1,desc:'高段木系快攻。',src:'3.0掉落'},
 '櫻散':{type:'sword',q:'purple',lv:65,r:2.0,mp:25,crit:.1,desc:'高速暴擊。',src:'3.0掉落'},
 '卷浪':{type:'spell',q:'purple',lv:68,r:2.15,mp:28,elem:'water',desc:'水系高傷。',src:'3.0掉落'},
 '迅':{type:'body',q:'blue',lv:68,r:.9,mp:16,haste:.2,desc:'迅捷增益。',src:'3.0掉落'},
 '清心':{type:'body',q:'blue',lv:80,r:.8,mp:22,cleanse:true,desc:'解除異常並穩定狀態。',src:'3.0掉落'},
 '蘇生':{type:'body',q:'purple',lv:88,r:.7,mp:35,heal:.35,desc:'高回復術。',src:'3.0掉落'},
 '魅':{type:'charm',q:'purple',lv:90,r:2.1,mp:28,stun:.55,desc:'魅惑控場。',src:'3.0掉落'},
 '療傷':{type:'body',q:'gold',lv:95,r:.6,mp:35,heal:.35,desc:'高額療傷。',src:'3.0掉落'},
 '旋風焰':{type:'spell',q:'gold',lv:95,r:2.55,mp:35,elem:'fire',burn:.25,desc:'火系持續傷害。',src:'3.0掉落'},
 '狂浪潮':{type:'spell',q:'gold',lv:95,r:2.65,mp:35,elem:'water',desc:'水系終式。',src:'3.0掉落'},
 '楓葉花開':{type:'sword',q:'gold',lv:65,r:3.2,mp:38,elem:'wood',crit:.12,desc:'3.0 高階木系單體爆發。',src:'3.0'},
};

/* 官方戰鬥公式還原：只採用官網公開的「傷害基礎／倍率／相克加成／必殺率」。
   防禦減傷、暴擊倍率、隨機浮動屬於本單機原有平衡層；官網未公開完整伺服器端最終傷害公式，因此不冒充為官方。 */
const OFFICIAL_SKILL_FORMULAS={
 '桑折':{parts:[['person','快'],['weapon','狠']],ratios:[.20,.30,.40,.50,.60],crit:[.05,.05,.05,.05,.10],raceBonus:1.50,race:'獸'},
 '枫舞':{parts:[['person','快'],['weapon','狠']],ratios:[.20,.30,.40,.50,.60],crit:[.05,.05,.05,.05,.10],raceBonus:1.50,race:'人'},
 '楓舞':{parts:[['person','快'],['weapon','狠']],ratios:[.20,.30,.40,.50,.60],crit:[.05,.05,.05,.05,.10],raceBonus:1.50,race:'人'},
 '灵弹':{parts:[['weapon','智'],['person','智']],ratios:[1.20,1.50,1.80,2.10],mp:[5,5,5,5],raceBonus:0},
 '靈彈':{parts:[['weapon','智'],['person','智']],ratios:[1.20,1.50,1.80,2.10],mp:[5,5,5,5],raceBonus:0},
 '木突':{parts:[['weapon','智'],['person','智']],ratios:[1.40,1.70,2.00,2.30],mp:[7,7,7,7],raceBonusByLevel:[.20,.40,.60,.80],race:'獸'},
 '地鬼':{parts:[['weapon','智'],['person','智']],ratios:[1.60,1.90,2.20,2.60],mp:[20,20,20,20],raceBonusByLevel:[.20,.40,.60,.80],race:'人'},
 '雷鸣':{parts:[['person','狠'],['weapon','狠']],ratios:[.20,.35,.50,.60],mp:[4,4,4,4],crit:[.05,.08,.12,0],raceBonus:2.00,race:'獸'},
 '霜降':{parts:[['person','穩']],ratios:[.25,.55,.85,.85],crit:[.10,.10,.15,.20]},
 '落雷':{parts:[['person','狠'],['weapon','狠']],ratios:[.20,.30,.40,.50],mp:[4,4,4,4],crit:[.05,.10,.10,.15],raceBonus:1.00,race:'人'},
 '狂雷落':{parts:[['weapon','狠']],ratios:[.40,.60,.80,1.00,1.20],crit:[.05,.10,.10,.10,.15],raceBonusByLevel:[.60,1.00,1.40,1.80,1.80],race:'靈'},
 '開雲破霧':{parts:[['person','穩']],ratios:[.50,1.00,1.50,2.00,2.50],crit:[.05,.10,.10,.10,.15]},
 '雪落無痕':{parts:[['person','狠'],['person','穩']],ratios:[.90,1.10,1.30,1.50,1.70],crit:[.20,.25,.30,.35,.45],race:'蟲'},
};

/* 3.0 怪物資料直接驅動掉落與神通庫，未在上表出現者依掉落名稱自動建立基礎神通。 */
OFFICIAL.monsters3.forEach(row=>{
 const lv=row[1]||1;
 String(row[7]||'').split(/[、,，\s]+/).filter(Boolean).forEach(n=>{
  if(!SKILL_SEED[n])SKILL_SEED[n]={type:'spell',q:lv>=75?'gold':lv>=50?'purple':lv>=30?'blue':'green',lv,r:Math.min(3.1,.65+lv*.028),mp:Math.max(4,Math.round(lv*.32)),desc:'3.0 怪物掉落招式。',src:'3.0怪物掉落'};
 });
});
const SKILLS=Object.fromEntries(Object.entries(SKILL_SEED).map(([name,d],i)=>[name,{id:'sk'+i,name,...d,element:d.element||'none'}]));
const SKILL_LIST=Object.values(SKILLS).sort((a,b)=>a.lv-b.lv||a.name.localeCompare(b.name,'zh-Hant'));

