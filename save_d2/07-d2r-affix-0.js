// ════════════════════════════════════════════════
//  🔮 成長（符文／寶石／寶珠）— 測試專用面板
//  資料複製自遊戲 01-drops-config.js（符文／符文之語／寶石）與 55-orb-system.js（寶珠），
//  獨立於 ITEM_DB 之外運作；僅用於編輯器內快速產生物品與寶珠狀態，供測試使用。
// ════════════════════════════════════════════════
const GROWTH_RUNE_DEFS = {rune_el:{n:"El 符文",tier:1,slot:"wpn",code:"killHp",value:2,cap:10,p:5e4,d:"擊殺時恢復 2% 最大 HP。"},rune_eld:{n:"Eld 符文",tier:1,slot:"wpn",code:"killMp",value:2,cap:10,p:5e4,d:"擊殺時恢復 2% 最大 MP。"},rune_tir:{n:"Tir 符文",tier:1,slot:"wpnhelm",code:"mpCost",value:3,cap:15,p:6e4,d:"技能 MP 消耗降低 3%。"},rune_nef:{n:"Nef 符文",tier:1,slot:"arm",code:"knock",value:3,cap:15,p:6e4,d:"受到直接攻擊時 3% 機率使攻擊者延遲行動。"},rune_eth:{n:"Eth 符文",tier:2,slot:"wpn",code:"ignoreDef",value:3,cap:15,p:12e4,d:"物理攻擊忽略目標 3% 傷害減免與硬皮。"},rune_ith:{n:"Ith 符文",tier:2,slot:"wpn",code:"bossDmg",value:3,cap:15,p:12e4,d:"對頭目的一般攻擊傷害提高 3%。"},rune_tal:{n:"Tal 符文",tier:2,slot:"arm",code:"poisonRed",value:20,cap:60,p:12e4,d:"中毒持續時間縮短 20%。"},rune_ral:{n:"Ral 符文",tier:2,slot:"arm",code:"burnRed",value:20,cap:60,p:12e4,d:"燃燒持續時間縮短 20%。"},rune_ort:{n:"Ort 符文",tier:3,slot:"arm",code:"paralyzeRed",value:20,cap:60,p:25e4,d:"麻痺持續時間縮短 20%。"},rune_thul:{n:"Thul 符文",tier:3,slot:"arm",code:"freezeRed",value:20,cap:60,p:25e4,d:"冰凍持續時間縮短 20%。"},rune_amn:{n:"Amn 符文",tier:3,slot:"wpn",code:"lifeSteal",value:2,cap:10,p:3e5,d:"一般攻擊吸取造成傷害的 2% 為 HP。"},rune_sol:{n:"Sol 符文",tier:4,slot:"arm",code:"flatDr",value:2,cap:20,p:6e5,d:"每次受到傷害固定減少 2。"},rune_dol:{n:"Dol 符文",tier:4,slot:"arm",code:"hpR",value:5,cap:20,p:8e5,d:"HP 自然恢復量 +5。"},rune_ko:{n:"Ko 符文",tier:4,slot:"all",code:"dex",value:2,cap:10,p:9e5,d:"敏捷 +2。"},rune_lem:{n:"Lem 符文",tier:4,slot:"all",code:"goldFind",value:10,cap:30,p:1e6,d:"金幣發現量 +10%。"},rune_lo:{n:"Lo 符文",tier:5,slot:"arm",code:"resWind",value:10,cap:30,p:25e5,d:"風屬性抗性 +10。"},rune_pul:{n:"Pul 符文",tier:5,slot:"wpn",code:"bossDmg",value:5,cap:20,p:28e5,d:"對頭目的一般攻擊傷害提高 5%。"},rune_um:{n:"Um 符文",tier:5,slot:"arm",code:"allRes",value:8,cap:24,p:32e5,d:"四屬性抗性 +8。"},rune_mal:{n:"Mal 符文",tier:5,slot:"wpn",code:"ignoreDef",value:5,cap:20,p:38e5,d:"物理攻擊忽略目標 5% 傷害減免與硬皮。"},rune_ist:{n:"Ist 符文",tier:5,slot:"all",code:"mf",value:5,cap:20,p:45e5,d:"物品發現率 +5%。"},rune_gul:{n:"Gul 符文",tier:6,slot:"wpn",code:"bossDmg",value:7,cap:20,p:55e5,d:"對頭目的一般攻擊傷害提高 7%。"},rune_vex:{n:"Vex 符文",tier:6,slot:"wpn",code:"killMp",value:5,cap:20,p:6e6,d:"擊殺時恢復 5% 最大 MP。"},rune_ohm:{n:"Ohm 符文",tier:6,slot:"wpn",code:"basicDmg",value:10,cap:30,p:7e6,d:"一般攻擊傷害 +10%。"},rune_ber:{n:"Ber 符文",tier:6,slot:"arm",code:"flatDr",value:5,cap:20,p:8e6,d:"每次受到傷害固定減少 5。"},rune_jah:{n:"Jah 符文",tier:7,slot:"arm",code:"hpPct",value:5,cap:15,p:15e6,d:"HP 上限 +5%。"}};
const GROWTH_RUNEWORDS = [{id:"steel",n:"鋼鐵",seq:["rune_tir","rune_el"],kind:"wpn",effects:{basicDmg:10,killHp:3},d:"一般攻擊傷害 +10%、擊殺恢復 HP +3%。"},{id:"stealth",n:"隱匿",seq:["rune_tal","rune_eth"],kind:"armor",effects:{as:5,allStatusRed:10},d:"攻擊速度 +5%、四種異常時間縮短 10%。"},{id:"ancient_pledge",n:"先祖誓言",seq:["rune_ral","rune_ort","rune_tal"],kind:"shield",effects:{allRes:15,flatDr:3},d:"四屬性抗性 +15、直接傷害減少 3。"},{id:"leaf",n:"葉子",seq:["rune_tir","rune_ral"],kind:"magicwpn",effects:{magicDmg:10,mpCost:5},d:"魔法傷害 +10、技能 MP 消耗降低 5%。"},{id:"lore",n:"知識",seq:["rune_ort","rune_sol"],kind:"helm",effects:{int:3,wis:3,mpPct:10},d:"智力 +3、精神 +3、MP 上限 +10%。"},{id:"strength",n:"力量",seq:["rune_amn","rune_tir"],kind:"meleewpn",effects:{lifeSteal:5,bossDmg:5},d:"一般攻擊吸血 +5%、對頭目一般攻擊傷害 +5%。"},{id:"rhyme",n:"韻律",seq:["rune_thul","rune_ort"],kind:"shield",effects:{block:5,freezeRed:20,paralyzeRed:20},d:"格擋率 +5%、冰凍與麻痺時間縮短 20%。"},{id:"smoke",n:"煙霧",seq:["rune_nef","rune_sol"],kind:"armor",effects:{flatDr:5,allRes:10,allResNone:10},d:"直接傷害減少 5、五屬性抗性 +10。"},{id:"malice",n:"惡意",seq:["rune_ith","rune_el","rune_eth"],kind:"meleewpn",effects:{basicDmg:15,ignoreDef:8,killHp:3},d:"一般攻擊傷害 +15%、忽略防禦 8%、擊殺恢復 HP +3%。"},{id:"zephyr",n:"和風",seq:["rune_ort","rune_eth"],kind:"rangedwpn",effects:{as:10,basicDmg:10,ignoreDef:5},d:"攻擊速度 +10%、一般攻擊傷害 +10%、忽略防禦 5%。"},{id:"radiance",n:"光輝",seq:["rune_nef","rune_sol","rune_ith"],kind:"helm",effects:{flatDr:5,bossDmg:5,allRes:10},d:"直接傷害減少 5、對頭目一般攻擊傷害 +5%、四屬性抗性 +10。"},{id:"insight",n:"洞察",seq:["rune_ral","rune_tir","rune_tal","rune_sol"],kind:"magicwpn",effects:{magicDmg:15,mpCost:10,killMp:5},d:"魔法傷害 +15、技能 MP 消耗降低 10%、擊殺恢復 MP +5%。"},{id:"spirit",n:"精神",seq:["rune_tal","rune_thul","rune_ort","rune_amn"],kind:"magicorshield",effects:{magicDmg:12,mpPct:15,allRes:10},d:"魔法傷害 +12、MP 上限 +15%、四屬性抗性 +10。"},{id:"edge",n:"邊緣",seq:["rune_tir","rune_tal","rune_amn"],kind:"rangedwpn",effects:{basicDmg:12,bossDmg:8,killMp:3},d:"一般攻擊傷害 +12%、對頭目一般攻擊傷害 +8%、擊殺恢復 MP +3%。"},{id:"kings_grace",n:"王者恩典",seq:["rune_amn","rune_ral","rune_thul"],kind:"meleewpn",effects:{basicDmg:18,lifeSteal:5,bossDmg:5},d:"一般攻擊傷害 +18%、吸血 +5%、對頭目一般攻擊傷害 +5%。"},{id:"lionheart",n:"獅心",seq:["rune_el","rune_sol","rune_ith"],kind:"armor",effects:{allRes:15,allResNone:15,flatDr:4,killHp:3},d:"五屬性抗性 +15、直接傷害減少 4、擊殺恢復 HP +3%。"},{id:"fortitude",n:"剛毅",seq:["rune_el","rune_sol","rune_dol","rune_lo"],kind:"armor",effects:{basicDmg:30,ac:10,hpPct:20,allRes:20,allResNone:20,flatDr:7},d:"一般攻擊傷害 +30%、AC -10、HP 上限 +20%、五屬性抗性 +20、直接傷害減少 7。"},{id:"enigma",n:"謎團",seq:["rune_jah","rune_ith","rune_ber"],kind:"armor",grantSkills:["sk_teleport"],effects:{ac:10,hpPct:15,allStat:5,magicDmg:10,mf:20,flatDr:5,mpCost:10},d:"可額外使用原有「傳送術」；AC -10、HP 上限 +15%、全能力 +5、魔法傷害 +10、物品發現率 +20%、直接傷害減少 5、技能 MP 消耗降低 10%。"},{id:"honor",n:"榮耀",seq:["rune_amn","rune_el","rune_ith","rune_tir","rune_sol"],kind:"meleewpn",effects:{basicDmg:25,as:5,lifeSteal:5,bossDmg:10,killHp:5,killMp:5},d:"一般攻擊傷害 +25%、攻擊速度 +5%、吸血 +5%、對頭目傷害 +10%、擊殺恢復 HP／MP +5%。"},{id:"grief",n:"悔恨",seq:["rune_eth","rune_tir","rune_lo","rune_mal","rune_ral"],kind:"meleewpn",effects:{basicDmg:40,as:15,ignoreDef:20,bossDmg:10},d:"一般攻擊傷害 +40%、攻擊速度 +15%、忽略防禦 20%、對頭目傷害 +10%。"},{id:"heart_of_the_oak",n:"橡樹之心",seq:["rune_ko","rune_vex","rune_pul","rune_thul"],kind:"magicwpn",effects:{magicDmg:25,allStat:4,mpPct:20,allRes:20,allResNone:20,mpCost:10},d:"魔法傷害 +25、全能力 +4、MP 上限 +20%、五屬性抗性 +20、技能 MP 消耗降低 10%。"},{id:"chains_of_honor",n:"榮耀之鍊",seq:["rune_dol","rune_um","rune_ber","rune_ist"],kind:"armor",effects:{allRes:30,allResNone:30,flatDr:8,hpPct:15,mf:10},d:"五屬性抗性 +30、直接傷害減少 8、HP 上限 +15%、物品發現率 +10%。"},{id:"faith",n:"信心",seq:["rune_ohm","rune_jah","rune_lem","rune_eld"],kind:"rangedwpn",effects:{as:20,basicDmg:30,bossDmg:15,allStat:3},d:"攻擊速度 +20%、一般攻擊傷害 +30%、對頭目傷害 +15%、全能力 +3。"},{id:"call_to_arms",n:"戰爭召喚",seq:["rune_amn","rune_ral","rune_mal","rune_ist","rune_ohm"],kind:"wpn",effects:{basicDmg:20,as:5,allStat:5,hpPct:15,mpPct:15},d:"一般攻擊傷害 +20%、攻擊速度 +5%、全能力 +5、HP／MP 上限 +15%。"},{id:"phoenix",n:"鳳凰",seq:["rune_vex","rune_vex","rune_lo","rune_jah"],kind:"shield",effects:{basicDmg:20,hpR:10,mpR:5,allRes:20,allResNone:20,flatDr:5},d:"一般攻擊傷害 +20%、HP 恢復 +10、MP 恢復 +5、五屬性抗性 +20、直接傷害減少 5。"},{id:"mosaic",n:"馬賽克",seq:["rune_mal","rune_gul","rune_amn"],kind:"mosaicclaw",effects:{as:10,basicDmg:15,mosaic:1},d:"黑暗妖精鋼爪／雙刀專用。雙重破壞期間普攻命中累積元素蓄能；滿 3 層後，原本會心一擊追加火、水、風三段元素終結。蓄能不消耗，但有保存時間與獨立冷卻。"}];
const GROWTH_GEM_COLORS = {red:{n:"紅寶石",icon:"🔴"},green:{n:"綠寶石",icon:"🟢"},blue:{n:"藍寶石",icon:"🔵"},white:{n:"白寶石",icon:"⚪"},yellow:{n:"黃寶石",icon:"🟡"},purple:{n:"紫寶石",icon:"🟣"}};
const GROWTH_GEM_RANKS = [{n:"碎裂"},{n:"普通"},{n:"無瑕"},{n:"完美"},{n:"皇家"}];
const GROWTH_ORB_DEFS = {orb_ember:{slot:"core",icon:"🔥",n:"熾心寶珠",color:"#fb923c",condition:"灼燒",ele:"fire",story:"灰燼裡仍有心跳。守火者說，那是第一輪日出留下的脈搏。"},orb_frost:{slot:"core",icon:"❄️",n:"寒星寶珠",color:"#7dd3fc",condition:"冰凍",ele:"water",story:"星光墜入冰湖後不曾熄滅，只是不再發出聲音。"},orb_decay:{slot:"core",icon:"☣️",n:"腐壤寶珠",color:"#86efac",condition:"中毒",ele:"earth",story:"古樹拒絕死去，便將腐朽藏進根鬚，等待下一場雨。"},orb_gale:{slot:"core",icon:"🌪️",n:"風痕寶珠",color:"#c4b5fd",condition:"流血",ele:"wind",story:"無名劍士最後一刀沒有落下，傷口卻隨風留在敵人身上。"},orb_dawn:{slot:"core",icon:"🌅",n:"曙光寶珠",color:"#fde68a",story:"第一道光不是為勝者升起，而是為仍願意踏出城門的人。"},orb_dusk:{slot:"core",icon:"🌘",n:"暮影寶珠",color:"#a5b4fc",story:"黃昏收走將熄的名字，讓最後一擊不必記住死者的臉。"},orb_cycle:{slot:"core",icon:"♻️",n:"四象寶珠",color:"#f0abfc",story:"火追逐風，風推動水，水滲入土，土又把餘燼送回火中。四象從不在同一處停留。"},orb_command:{slot:"core",icon:"👑",n:"王印寶珠",color:"#fbbf24",story:"破裂的王印沒有命令任何人。群獸卻在持有者舉手時，同時望向了城門。"},orb_void:{slot:"core",icon:"⚫",n:"虛寂寶珠",color:"#c4b5fd",story:"無光的珠心沒有倒影。被束縛者凝視它時，會忘記究竟是誰先失去了名字。"},orb_storm:{slot:"core",icon:"🌩️",n:"風暴眼寶珠",color:"#67e8f9",story:"城牆外擠滿無名的影子時，守望者看見風暴中央反而出現了一條筆直的路。"},orb_challenger:{slot:"core",icon:"⚔️",n:"逆階寶珠",color:"#fca5a5",story:"敗者把斷劍埋在高塔下。多年後，劍身只剩一道向上的缺口，像仍在挑戰看不見的敵人。"},orb_berserk:{slot:"core",icon:"🩸",n:"血怒寶珠",color:"#ef4444",story:"血液沿著劍柄流下時，戰士才發現握住自己的不是手，而是一個拒絕倒下的念頭。"},orb_solitude:{slot:"core",icon:"🗡️",n:"孤鋒寶珠",color:"#e5e7eb",story:"沒有旗幟，沒有腳步，只有一把劍在荒野留下細長的影子。黎明時，影子仍只有一條。"},orb_echo:{slot:"resonance",icon:"〽️",n:"回響寶珠",color:"#e879f9",story:"被遺忘的咒語仍在空殿回返，直到有人再次聽見。"},orb_hunter:{slot:"resonance",icon:"🜲",n:"獵魂寶珠",color:"#facc15",story:"獵人不追逐足跡；他等待戰利品的靈魂先暴露方向。"},orb_rhythm:{slot:"resonance",icon:"🎵",n:"律動寶珠",color:"#67e8f9",story:"第五次鐘聲永遠比前四次更重，因為守夜人只敲給仍醒著的人聽。"},orb_focus:{slot:"resonance",icon:"◉",n:"凝息寶珠",color:"#93c5fd",story:"法師將未曾出口的咒文封在珠心，魔力滿盈時才聽得見。"},orb_momentum:{slot:"resonance",icon:"➰",n:"追擊寶珠",color:"#fb7185",story:"第一道裂痕只是一個記號；直到第五次回返，獵物才明白自己從未逃離。"},orb_bond:{slot:"resonance",icon:"🐾",n:"羈絆寶珠",color:"#f9a8d4",story:"馴獸師的名字早已磨去，珠面仍留著一大一小、並肩向前的足印。"},orb_ebb:{slot:"resonance",icon:"🌊",n:"枯潮寶珠",color:"#60a5fa",story:"潮水退盡後，礁石才露出真正的形狀。法師說，魔力也是如此。"},orb_feint:{slot:"resonance",icon:"↝",n:"游擊寶珠",color:"#a7f3d0",story:"箭痕從不在同一面盾上停留。第三名守軍倒下時，才有人發現射手一直站在原地。"},orb_vigor:{slot:"resonance",icon:"💚",n:"盈生寶珠",color:"#6ee7b7",story:"杯中之水滿而不溢。修士說，真正的力量不是受傷後復原，而是讓第一道傷口來得更晚。"},orb_revenge:{slot:"resonance",icon:"↩️",n:"回刃寶珠",color:"#fb923c",story:"刀鋒敲在盾上的聲音沒有消失。它繞過戰場，藏進下一次揮擊裡。"},orb_patience:{slot:"resonance",icon:"⏳",n:"蓄勢寶珠",color:"#fcd34d",story:"沙漏停了兩息，巨錘才落下。旁觀者以為那是遲疑，地面卻比答案更早裂開。"},orb_iron:{slot:"guard",icon:"🛡️",n:"鐵壁寶珠",color:"#94a3b8",story:"城牆崩毀後，仍有一小塊石頭記得自己曾保護過誰。"},orb_devour:{slot:"guard",icon:"🩸",n:"噬魔寶珠",color:"#fda4af",story:"它吞食逸散的法力，卻用溫熱的血回報持有者。"},orb_recovery:{slot:"guard",icon:"🌿",n:"回生寶珠",color:"#6ee7b7",story:"被踩碎的嫩芽沒有復仇，只從足印中央重新生長。"},orb_aegis:{slot:"guard",icon:"🔷",n:"靈幕寶珠",color:"#818cf8",story:"古代術士把最後一層結界縮成珠子，留給無法回家的學徒。"},orb_bastion:{slot:"guard",icon:"🧱",n:"磐壘寶珠",color:"#d6d3d1",story:"守軍離去後，無名石匠仍砌完最後一道牆；那面牆不認得王旗，只認得迎面而來的刀。"},orb_shelter:{slot:"guard",icon:"🕯️",n:"庇護寶珠",color:"#fde68a",story:"最後一根蠟燭沒有照亮主人，只替伏在門邊等待的夥伴留住了一夜溫度。"},orb_laststand:{slot:"guard",icon:"❤️‍🩹",n:"殘命寶珠",color:"#fb7185",story:"甲冑已碎，旗幟已倒。那名士兵仍站著，因為身後還有一盞未熄的燈。"},orb_adapt:{slot:"guard",icon:"🐉",n:"蛻甲寶珠",color:"#86efac",story:"脫落的鱗片記住了殺死它的力量。下一片新生的鱗，便不再以同樣方式碎裂。"},orb_lifeline:{slot:"guard",icon:"🪶",n:"續命寶珠",color:"#fef3c7",story:"羽毛落地以前，死者又聽見一次自己的心跳。那不是復活，只是一個尚未寫完的句點。"},orb_resolve:{slot:"guard",icon:"🔔",n:"鎮魂寶珠",color:"#d8b4fe",story:"鐘聲沒有驅散詛咒，只提醒被困在黑暗裡的人：恐懼仍然有盡頭。"},orb_stillwater:{slot:"guard",icon:"💧",n:"靜水寶珠",color:"#7dd3fc",story:"湖面平靜得忘了戰爭。第一支箭落下時，水只替它帶走了一半聲音。"}};
const GROWTH_ORB_MAX_LEVEL = 5;
const GROWTH_ORB_RANK_NAME = {1:"破碎",2:"完整",3:"精製",4:"古代",5:"神話"};
const GROWTH_RUNEWORD_KIND_LABEL = {
  wpn:"武器（近戰／遠程／魔法皆可）",
  meleewpn:"近戰武器",
  magicwpn:"魔法武器",
  rangedwpn:"遠程武器",
  magicorshield:"魔法武器或盾牌",
  armor:"身體防具",
  helm:"頭盔",
  shield:"盾牌",
  mosaicclaw:"黑暗妖精鋼爪／雙刀"
};

function ggEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const RUNE_TW_NAMES = {
  rune_el:'艾爾', rune_eld:'艾德', rune_tir:'特爾', rune_nef:'那夫',
  rune_eth:'愛斯', rune_ith:'伊司', rune_tal:'塔爾', rune_ral:'拉爾',
  rune_ort:'歐特', rune_thul:'書爾', rune_amn:'安姆', rune_sol:'索爾',
  rune_dol:'多爾', rune_ko:'科', rune_lem:'藍姆', rune_lo:'羅',
  rune_pul:'普爾', rune_um:'烏姆', rune_mal:'馬爾', rune_ist:'伊司特',
  rune_gul:'古爾', rune_vex:'伐克斯', rune_ohm:'歐姆', rune_ber:'貝', rune_jah:'喬',
};

function growthRuneName(id){
  const d = GROWTH_RUNE_DEFS[id];
  if(!d) return id;
  const tw = RUNE_TW_NAMES[id];
  return tw ? `${d.n}（${tw}）` : d.n;
}
function growthGemId(color, rankIdx){ return `gem_${color}_${rankIdx+1}`; }
function growthGemName(color, rankIdx){ return GROWTH_GEM_RANKS[rankIdx].n + GROWTH_GEM_COLORS[color].n + '（暗黑）'; }
function growthItemDisplayName(id){
  if(GROWTH_RUNE_DEFS[id]) return growthRuneName(id);
  const m = /^gem_([a-z]+)_(\d)$/.exec(id);
  if(m && GROWTH_GEM_COLORS[m[1]] && GROWTH_GEM_RANKS[m[2]-1]) return growthGemName(m[1], parseInt(m[2],10)-1);
  return id;
}

function growthInvCount(id){
  return (G.p.inv||[]).filter(i=>i && i.id===id).reduce((n,i)=>n+Math.max(0, Math.floor(i.cnt||1)), 0);
}

function growthAddToInv(id, count){
  if(!Array.isArray(G.p.inv)) G.p.inv = [];
  const item = { id, uid: genUID(), cnt: Math.max(1, Math.floor(count)||1), en:0, bless:false, lock:false, junk:false, attr:false, anc:false, seteff:false, attrMagic:false, attrMagicStar:1 };
  G.p.inv.push(item);
}

function growthOrbState(){
  if(!G.p.orbs || typeof G.p.orbs !== 'object' || Array.isArray(G.p.orbs)){
    G.p.orbs = { dust:0, owned:{}, equipped:{}, presets:[{saved:false,core:'',resonance:'',guard:''},{saved:false,core:'',resonance:'',guard:''},{saved:false,core:'',resonance:'',guard:''}] };
  }
  if(typeof G.p.orbs.dust !== 'number') G.p.orbs.dust = 0;
  if(!G.p.orbs.owned || typeof G.p.orbs.owned !== 'object') G.p.orbs.owned = {};
  if(!G.p.orbs.equipped || typeof G.p.orbs.equipped !== 'object') G.p.orbs.equipped = {};
  return G.p.orbs;
}

const GROWTH_SUB_TABS = ['rune','gem','orb','affix','socket'];

function growthPanelReset(){
  GROWTH_SUB_TABS.forEach(k=>{
    const el = document.getElementById('growthSub-'+k);
    if(el) el.style.display = 'none';
    const btn = document.getElementById('growthSubBtn-'+k);
    if(btn) btn.classList.remove('active');
  });
}

function growthSubTab(name){
  GROWTH_SUB_TABS.forEach(k=>{
    const el = document.getElementById('growthSub-'+k);
    if(el) el.style.display = (k===name) ? '' : 'none';
    const btn = document.getElementById('growthSubBtn-'+k);
    if(btn) btn.classList.toggle('active', k===name);
  });
  renderGrowthPanel();
}

function renderGrowthPanel(){
  if(!Array.isArray(G.p.inv)) G.p.inv = [];

  growthRenderRuneOptions();
  growthRenderRunewordOptions();
  growthRenderGemSelects();

  const o = growthOrbState();
  const dustInput = document.getElementById('growthOrbDust');
  if(dustInput) dustInput.value = o.dust;

  const orbGrid = document.getElementById('growthOrbGrid');
  if(orbGrid){
    orbGrid.innerHTML = Object.keys(GROWTH_ORB_DEFS).map(id=>{
      const d = GROWTH_ORB_DEFS[id];
      const row = o.owned[id];
      if(row){
        let opts = '';
        for(let n=1;n<=GROWTH_ORB_MAX_LEVEL;n++){
          opts += `<option value="${n}" ${n===row.level?'selected':''}>${GROWTH_ORB_RANK_NAME[n]} Lv.${n}</option>`;
        }
        return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px">
          <b style="color:${d.color}">${d.icon} ${ggEsc(d.n)}</b>
          <div style="margin-top:6px"><select style="width:100%" onchange="growthSetOrbLevel('${id}',this.value)">${opts}</select></div>
        </div>`;
      }
      return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;opacity:.4;cursor:pointer" onclick="growthUnlockOrbConfirm('${id}')" title="點擊解鎖（測試用，不消耗資源）">
        <b style="color:var(--text3)">${d.icon} ${ggEsc(d.n)}</b>
        <div style="margin-top:6px;font-size:12px;color:var(--text3)">尚未持有・點擊解鎖</div>
      </div>`;
    }).join('');
  }

  renderGrowthAffixPanel();
  renderGrowthSocketPanel();
}

// ── 符文下拉選單 ──
function growthRenderRuneOptions(){
  const sel = document.getElementById('growthRuneSelect');
  if(!sel) return;
  const prev = sel.value;
  sel.innerHTML = Object.keys(GROWTH_RUNE_DEFS).map(id=>{
    const d = GROWTH_RUNE_DEFS[id];
    const have = growthInvCount(id);
    return `<option value="${id}">${ggEsc(d.n)}（持有 ${have}）</option>`;
  }).join('');
  if(prev && GROWTH_RUNE_DEFS[prev]) sel.value = prev;
  growthRuneSelectChange();
}

function growthRuneSelectChange(){
  const sel = document.getElementById('growthRuneSelect');
  const span = document.getElementById('growthRuneHave');
  if(!sel || !span) return;
  const id = sel.value;
  span.textContent = id ? `目前持有 ${growthInvCount(id)}` : '';
}

function growthGrantRuneFromSelect(){
  const sel = document.getElementById('growthRuneSelect');
  const qtyEl = document.getElementById('growthRuneQty');
  const id = sel && sel.value;
  if(!id) return;
  const count = Math.max(1, Math.min(999, parseInt(qtyEl && qtyEl.value, 10) || 1));
  growthAddToInv(id, count);
  toast(`已加入：${growthRuneName(id)} ×${count}`, 'ok');
  growthRenderRuneOptions();
}

// ── 符文之語下拉選單 ──
function growthRunewordNeedLines(rw){
  const need = {};
  (rw.seq||[]).forEach(id=>need[id]=(need[id]||0)+1);
  return Object.keys(need).map(id=>`${growthRuneName(id)} ×${need[id]}`).join('、');
}

function growthRenderRunewordOptions(){
  const sel = document.getElementById('growthRunewordSelect');
  if(!sel) return;
  const prev = sel.value;
  sel.innerHTML = GROWTH_RUNEWORDS.map(rw=>`<option value="${rw.id}">${ggEsc(rw.n)}</option>`).join('');
  if(prev && GROWTH_RUNEWORDS.some(r=>r.id===prev)) sel.value = prev;
  growthRunewordSelectChange();
}

function growthRunewordSelectChange(){
  const sel = document.getElementById('growthRunewordSelect');
  const box = document.getElementById('growthRunewordNeed');
  if(!sel || !box) return;
  const rw = GROWTH_RUNEWORDS.find(r=>r.id===sel.value);
  if(!rw){ box.innerHTML = ''; return; }
  const kindLabel = GROWTH_RUNEWORD_KIND_LABEL[rw.kind] || rw.kind || '未知';
  box.innerHTML = `需要：${ggEsc(growthRunewordNeedLines(rw))}<br>能力：${ggEsc(rw.d||'')}<br>裝備條件：${ggEsc(kindLabel)}・需 ${rw.seq.length} 孔`;
}

function growthAddRunewordFromSelect(){
  const sel = document.getElementById('growthRunewordSelect');
  const rw = GROWTH_RUNEWORDS.find(r=>r.id === (sel && sel.value));
  if(!rw) return;
  const need = {};
  (rw.seq||[]).forEach(id=>need[id]=(need[id]||0)+1);
  Object.keys(need).forEach(id=>growthAddToInv(id, need[id]));
  const lines = growthRunewordNeedLines(rw);
  alert(`已將符文之語「${rw.n}」所需的符文（${lines}）加入背包。`);
  growthRenderRuneOptions();
  growthRunewordSelectChange();
}

// ── 寶石下拉選單（品質＋類型）──
function growthRenderGemSelects(){
  const rankSel = document.getElementById('growthGemRankSelect');
  const colorSel = document.getElementById('growthGemColorSelect');
  if(!rankSel || !colorSel) return;
  if(!rankSel.options.length){
    rankSel.innerHTML = GROWTH_GEM_RANKS.map((r,idx)=>`<option value="${idx}">${ggEsc(r.n)}</option>`).join('');
  }
  if(!colorSel.options.length){
    colorSel.innerHTML = Object.keys(GROWTH_GEM_COLORS).map(c=>`<option value="${c}">${GROWTH_GEM_COLORS[c].icon} ${ggEsc(GROWTH_GEM_COLORS[c].n)}</option>`).join('');
  }
  growthGemSelectChange();
}

function growthGemSelectChange(){
  const rankSel = document.getElementById('growthGemRankSelect');
  const colorSel = document.getElementById('growthGemColorSelect');
  const span = document.getElementById('growthGemHave');
  if(!rankSel || !colorSel || !span) return;
  const idx = parseInt(rankSel.value, 10);
  const color = colorSel.value;
  if(isNaN(idx) || !color){ span.textContent=''; return; }
  const id = growthGemId(color, idx);
  span.textContent = `目前持有 ${growthInvCount(id)}`;
}

function growthGrantGemFromSelect(){
  const rankSel = document.getElementById('growthGemRankSelect');
  const colorSel = document.getElementById('growthGemColorSelect');
  const qtyEl = document.getElementById('growthGemQty');
  const idx = parseInt(rankSel && rankSel.value, 10);
  const color = colorSel && colorSel.value;
  if(isNaN(idx) || !color) return;
  const id = growthGemId(color, idx);
  const count = Math.max(1, Math.min(999, parseInt(qtyEl && qtyEl.value, 10) || 1));
  growthAddToInv(id, count);
  toast(`已加入：${growthGemName(color, idx)} ×${count}`, 'ok');
  growthGemSelectChange();
}

function growthUnlockOrbConfirm(id){
  const d = GROWTH_ORB_DEFS[id];
  if(!d) return;
  const o = growthOrbState();
  if(o.owned[id]) return;
  if(!confirm(`是否要解鎖寶珠「${d.n}」？（測試用，不消耗任何資源）`)) return;
  o.owned[id] = { level: 1 };
  if(!o.equipped[d.slot]) o.equipped[d.slot] = id;
  toast(`已解鎖：${d.n}`, 'ok');
  renderGrowthPanel();
}

function growthSetOrbLevel(id, level){
  const o = growthOrbState();
  const row = o.owned[id];
  if(!row) return;
  row.level = Math.max(1, Math.min(GROWTH_ORB_MAX_LEVEL, parseInt(level,10)||1));
  toast(`${GROWTH_ORB_DEFS[id].n} 等級設為 Lv.${row.level}`, 'ok');
}

function growthSetOrbDust(){
  const o = growthOrbState();
  const val = document.getElementById('growthOrbDust').value;
  o.dust = Math.max(0, Math.min(999999999, parseInt(val,10)||0));
  toast(`寶珠粉塵設為 ${o.dust}`, 'ok');
}
