

// ════════════════════════════════════════════════
//  技能定義
// ════════════════════════════════════════════════
// 輔助狀態（buff）技能資料庫 —— 來源：00-data.js DB.skills，篩選 type:"buff"（共 95 筆）
// n=名稱 dur=預設持續秒數 mp=MP消耗 d=屬性加成 haste=是否加速類 ele=屬性 msg=施放提示文字
const BUFF_SKILL_DB = {
  "blue": {
    "n": "藍色藥水",
    "dur": 600,
    "msg": "精神越堅定，越能從中汲取充沛魔力。"
  },
  "brave": {
    "n": "勇敢藥水",
    "dur": 300,
    "msg": "激起戰士血性的秘藥，使近身作戰者以更勇猛的步調迎敵。"
  },
  "elfcookie": {
    "n": "精靈餅乾",
    "dur": 300,
    "msg": "受精靈祝福的餅乾，妖精食用後能與風的律動同步。"
  },
  "cautious": {
    "n": "慎重藥水",
    "dur": 300,
    "msg": "使思緒沉靜澄明的秘藥，能增進施法者的魔力運行與恢復。"
  },
  "haste": {
    "n": "自我加速藥水",
    "dur": 300,
    "haste": true,
    "msg": "飲下後身體變得輕盈，戰鬥動作也隨之加快。"
  },
  "sk_berserk": {
    "n": "狂暴術",
    "dur": 1200,
    "mp": 40,
    "d": {
      "meleeDmg": 5,
      "ac": -10
    },
    "msg": "你的野性逐漸支配理智。"
  },
  "sk_bless_wpn": {
    "n": "祝福魔法武器",
    "dur": 1200,
    "mp": 20,
    "d": {
      "extraDmg": 2,
      "extraHit": 2
    },
    "msg": "你的武器暫時被注入了魔法力量。"
  },
  "sk_blizzard_storm": {
    "n": "冰雪颶風",
    "dur": 32,
    "mp": 60,
    "ele": "water",
    "msg": "冰雪颶風在你周身成形。"
  },
  "sk_counter_barrier": {
    "n": "反擊屏障",
    "dur": 64,
    "mp": 10,
    "msg": "你擺出了反擊的架式。"
  },
  "sk_dark_burn": {
    "n": "燃燒鬥志",
    "dur": 300,
    "mp": 20,
    "msg": "鬥志在你體內燃燒。"
  },
  "sk_dark_dex": {
    "n": "敏捷提升",
    "dur": 960,
    "mp": 10,
    "d": {
      "dex": 3
    },
    "msg": "你的身手更敏捷了。"
  },
  "sk_dark_dodge": {
    "n": "暗影閃避",
    "dur": 32,
    "mp": 20,
    "msg": "你能看穿魔法的軌跡。"
  },
  "sk_dark_double": {
    "n": "雙重破壞",
    "dur": 192,
    "mp": 20,
    "msg": "你的攻擊蘊含雙重之力。"
  },
  "sk_dark_erup": {
    "n": "迴避提升",
    "dur": 192,
    "mp": 20,
    "d": {
      "er": 12
    },
    "msg": "你的迴避能力提升了。"
  },
  "sk_dark_fang": {
    "n": "暗影之牙",
    "dur": 192,
    "mp": 20,
    "d": {
      "extraDmg": 5
    },
    "msg": "暗影凝聚成獠牙。"
  },
  "sk_dark_mrup": {
    "n": "影之防護",
    "dur": 960,
    "mp": 12,
    "d": {
      "mr": 5
    },
    "msg": "暗影包覆了你。"
  },
  "sk_dark_poison": {
    "n": "附加劇毒",
    "dur": 320,
    "mp": 10,
    "msg": "你的武器淬上了劇毒。"
  },
  "sk_dark_poisonres": {
    "n": "毒性抵抗",
    "dur": 320,
    "mp": 20,
    "msg": "你對毒素產生了抵抗。"
  },
  "sk_dark_stealth": {
    "n": "暗隱術",
    "dur": 32,
    "mp": 10,
    "msg": "你隱沒於暗影之中。"
  },
  "sk_dark_str": {
    "n": "力量提升",
    "dur": 960,
    "mp": 10,
    "d": {
      "str": 3
    },
    "msg": "你感到力量湧現。"
  },
  "sk_dark_walkhaste": {
    "n": "行走加速",
    "dur": 960,
    "mp": 10,
    "msg": "你的步伐如影般輕快。"
  },
  "sk_dex_up": {
    "n": "通暢氣脈術",
    "dur": 1200,
    "mp": 45,
    "d": {
      "dex": 5
    },
    "msg": "你覺得身手變得更靈活。"
  },
  "sk_dragon_armor": {
    "n": "龍之護鎧",
    "dur": 1800,
    "mp": 0,
    "d": {
      "dr": 5
    },
    "msg": "龍鱗般的護鎧覆上你的身軀。"
  },
  "sk_dragon_awaken_antares": {
    "n": "覺醒：安塔瑞斯",
    "dur": 600,
    "mp": 20,
    "d": {
      "ac": 8
    },
    "msg": "你引動安塔瑞斯之力，龍血沸騰、毒麻不侵。"
  },
  "sk_dragon_awaken_baraka": {
    "n": "覺醒：巴拉卡斯",
    "dur": 600,
    "mp": 50,
    "d": {
      "str": 3,
      "con": 3,
      "dex": 3,
      "int": 3,
      "wis": 3,
      "extraHit": 5
    },
    "msg": "你引動巴拉卡斯之力，全身充滿磅礡之力。"
  },
  "sk_dragon_awaken_falion": {
    "n": "覺醒：法利昂",
    "dur": 600,
    "mp": 30,
    "d": {
      "resFire": 15,
      "resWater": 15,
      "resEarth": 15,
      "resWind": 15
    },
    "msg": "你引動法利昂之力，魔抗與全屬性抗性大增。"
  },
  "sk_dragon_bloodlust": {
    "n": "血之渴望",
    "dur": 300,
    "mp": 0,
    "msg": "嗜血的渴望湧現，攻勢更為迅猛。"
  },
  "sk_dragon_deadlybody": {
    "n": "致命身軀",
    "dur": 300,
    "mp": 0,
    "msg": "你的身軀化為致命的反擊之刃。"
  },
  "sk_dragon_flameslash": {
    "n": "燃燒擊砍",
    "dur": 60,
    "mp": 0,
    "msg": "你的下一擊燃起烈焰。"
  },
  "sk_elf_attrfire": {
    "n": "屬性之火",
    "dur": 320,
    "mp": 20,
    "msg": "屬性之火在你的攻擊中燃燒。"
  },
  "sk_elf_blazewpn": {
    "n": "烈炎武器",
    "dur": 1200,
    "mp": 30,
    "d": {
      "meleeDmg": 5,
      "meleeHit": 5
    }
  },
  "sk_elf_dancefire": {
    "n": "舞躍之火",
    "dur": 1200,
    "mp": 30,
    "d": {
      "meleeDmg": 5
    }
  },
  "sk_elf_earthbless": {
    "n": "大地的祝福",
    "dur": 1200,
    "mp": 35,
    "d": {
      "ac": 7
    }
  },
  "sk_elf_earthguard": {
    "n": "大地防護",
    "dur": 1200,
    "mp": 15,
    "d": {
      "ac": 4
    }
  },
  "sk_elf_earthshield": {
    "n": "大地屏障",
    "dur": 8,
    "mp": 50
  },
  "sk_elf_eleres": {
    "n": "屬性防禦",
    "dur": 1200,
    "mp": 10,
    "d": {
      "resFire": 10,
      "resWater": 10,
      "resEarth": 10,
      "resWind": 10
    }
  },
  "sk_elf_energyboost": {
    "n": "能量激發",
    "dur": 960,
    "mp": 30,
    "msg": "能量激發，負重之下仍能調息。"
  },
  "sk_elf_firewpn": {
    "n": "火焰武器",
    "dur": 1200,
    "mp": 20,
    "d": {
      "meleeDmg": 3
    }
  },
  "sk_elf_flamesoul": {
    "n": "烈焰之魂",
    "dur": 1280,
    "mp": 30
  },
  "sk_elf_mirror": {
    "n": "鏡反射",
    "dur": 16,
    "mp": 10,
    "msg": "你的周身浮現一面鏡子。"
  },
  "sk_elf_mr": {
    "n": "魔法防禦",
    "dur": 1200,
    "mp": 10,
    "d": {
      "mr": 10
    }
  },
  "sk_elf_physboost": {
    "n": "體能激發",
    "dur": 960,
    "mp": 30,
    "msg": "體能激發，負重之下仍能調息。"
  },
  "sk_elf_preciseshot": {
    "n": "精準射擊",
    "dur": 64,
    "mp": 15,
    "msg": "你的目光變得無比銳利，攻擊精準無比。"
  },
  "sk_elf_purify": {
    "n": "淨化精神",
    "dur": 1200,
    "mp": 10,
    "d": {
      "wis": 3
    }
  },
  "sk_elf_singleres": {
    "n": "單屬性防禦",
    "dur": 64,
    "mp": 10
  },
  "sk_elf_steelguard": {
    "n": "鋼鐵防護",
    "dur": 1200,
    "mp": 30
  },
  "sk_elf_stormeye": {
    "n": "暴風之眼",
    "dur": 1200,
    "mp": 40,
    "d": {
      "rangedDmg": 2,
      "rangedHit": 2
    }
  },
  "sk_elf_stormshot": {
    "n": "暴風神射",
    "dur": 1200,
    "mp": 30,
    "d": {
      "rangedDmg": 6,
      "rangedHit": 3
    }
  },
  "sk_elf_watervital": {
    "n": "水之元氣",
    "dur": 64,
    "mp": 1,
    "msg": "水之元氣環繞著你。"
  },
  "sk_elf_winddash": {
    "n": "風之疾走",
    "dur": 1200,
    "mp": 20,
    "d": {
      "er": 10
    }
  },
  "sk_elf_windshot": {
    "n": "風之神射",
    "dur": 1200,
    "mp": 15,
    "d": {
      "rangedHit": 5
    }
  },
  "sk_ench_wpn": {
    "n": "擬似魔法武器",
    "dur": 1800,
    "mp": 20,
    "d": {
      "extraDmg": 2
    },
    "msg": "你的武器暫時被注入了魔法力量。"
  },
  "sk_fire_prison": {
    "n": "火牢",
    "dur": 10,
    "mp": 60,
    "ele": "fire",
    "msg": "熊熊火牢在你周身燃起。"
  },
  "sk_greater_haste": {
    "n": "強力加速術",
    "dur": 2400,
    "mp": 60,
    "haste": true,
    "msg": "你感到身體變得非常輕盈。"
  },
  "sk_haste_spell": {
    "n": "加速術",
    "dur": 1200,
    "mp": 40,
    "haste": true,
    "msg": "你感到身體變得非常輕盈。"
  },
  "sk_helm_dex1": {
    "n": "敏盔：通暢氣脈術",
    "dur": 1200,
    "mp": 25,
    "d": {
      "dex": 5
    },
    "msg": "你覺得身手變得更靈活。"
  },
  "sk_helm_dex2": {
    "n": "敏盔：加速術",
    "dur": 1200,
    "mp": 20,
    "haste": true,
    "msg": "你感到身體變得非常輕盈。"
  },
  "sk_helm_str1": {
    "n": "力盔：擬似魔法武器",
    "dur": 1800,
    "mp": 10,
    "d": {
      "extraDmg": 2
    },
    "msg": "你的武器暫時被注入了魔法力量。"
  },
  "sk_helm_str2": {
    "n": "力盔：無所遁形術",
    "dur": 180,
    "mp": 8
  },
  "sk_helm_str3": {
    "n": "力盔：體魄強健術",
    "dur": 1200,
    "mp": 25,
    "d": {
      "str": 5
    },
    "msg": "你覺得身體充滿了力量。"
  },
  "sk_holy_barrier": {
    "n": "聖結界",
    "dur": 32,
    "mp": 30,
    "msg": "一道神聖的防禦屏障保護著你。"
  },
  "sk_holy_dash": {
    "n": "神聖疾走",
    "dur": 64,
    "mp": 20,
    "d": {
      "er": 15
    },
    "msg": "你覺得身體變輕了。"
  },
  "sk_holy_wpn": {
    "n": "神聖武器",
    "dur": 1200,
    "mp": 10,
    "d": {
      "extraDmg": 1,
      "extraHit": 1
    },
    "msg": "你的武器暫時被注入了神聖力量。"
  },
  "sk_illu_avatar": {
    "n": "幻覺：化身",
    "dur": 64,
    "mp": 50,
    "d": {
      "extraDmg": 10
    },
    "msg": "你化身為幻象的存在。"
  },
  "sk_illu_cube_burn": {
    "n": "立方：燃燒",
    "dur": 20,
    "mp": 30,
    "d": {
      "resFire": 30
    },
    "msg": "燃燒立方在你周身旋轉。"
  },
  "sk_illu_cube_harmony": {
    "n": "立方：和諧",
    "dur": 20,
    "mp": 0,
    "msg": "和諧立方在你周身旋轉，引動魔力。"
  },
  "sk_illu_cube_quake": {
    "n": "立方：地裂",
    "dur": 20,
    "mp": 35,
    "d": {
      "resEarth": 30
    },
    "msg": "地裂立方在你周身旋轉。"
  },
  "sk_illu_cube_shock": {
    "n": "立方：衝擊",
    "dur": 20,
    "mp": 55,
    "d": {
      "resWind": 30
    },
    "msg": "衝擊立方在你周身旋轉。"
  },
  "sk_illu_endure": {
    "n": "耐力",
    "dur": 600,
    "mp": 25,
    "d": {
      "dr": 2
    },
    "msg": "你的意志化為堅韌的耐力。"
  },
  "sk_illu_focus": {
    "n": "專注",
    "dur": 600,
    "mp": 30,
    "d": {
      "mpR": 4
    },
    "msg": "你進入高度專注。"
  },
  "sk_illu_golem": {
    "n": "幻覺：鑽石高崙",
    "dur": 64,
    "mp": 30,
    "d": {
      "ac": 10
    },
    "msg": "你以幻覺塑造出鑽石高崙的形象。"
  },
  "sk_illu_insight": {
    "n": "洞察",
    "dur": 640,
    "mp": 60,
    "d": {
      "str": 1,
      "dex": 1,
      "con": 1,
      "int": 1,
      "wis": 1
    },
    "msg": "你的感官變得無比敏銳。"
  },
  "sk_illu_lich": {
    "n": "幻覺：巫妖",
    "dur": 64,
    "mp": 20,
    "d": {
      "magicDmg": 2
    },
    "msg": "你以幻覺塑造出巫妖的形象。"
  },
  "sk_illu_mirror": {
    "n": "鏡像",
    "dur": 1200,
    "mp": 10,
    "d": {
      "er": 25
    },
    "msg": "你分裂出無數鏡像。"
  },
  "sk_illu_ogre": {
    "n": "幻覺：歐吉",
    "dur": 64,
    "mp": 20,
    "d": {
      "extraDmg": 4,
      "extraHit": 4
    },
    "msg": "你以幻覺塑造出歐吉的形象。"
  },
  "sk_illu_pain": {
    "n": "疼痛的歡愉",
    "dur": 64,
    "mp": 0,
    "msg": "你迎向疼痛，化痛楚為反擊之力。"
  },
  "sk_invisible": {
    "n": "隱身術",
    "dur": 64,
    "mp": 45
  },
  "sk_load_up": {
    "n": "負重強化",
    "dur": 1800,
    "mp": 10,
    "msg": "感覺到身體變輕了。"
  },
  "sk_magic_shield": {
    "n": "魔法屏障",
    "dur": 16,
    "mp": 16
  },
  "sk_meditation": {
    "n": "冥想術",
    "dur": 600,
    "mp": 10,
    "d": {
      "mpR": 5
    }
  },
  "sk_reduction_armor": {
    "n": "增幅防禦",
    "dur": 1200,
    "mp": 10
  },
  "sk_reveal": {
    "n": "無所遁形術",
    "dur": 180,
    "mp": 8
  },
  "sk_royal_bravewill": {
    "n": "勇猛意志",
    "dur": 640,
    "mp": 25,
    "msg": "勇猛的意志充盈你的全身。"
  },
  "sk_royal_burnweapon": {
    "n": "灼熱武器",
    "dur": 640,
    "mp": 25,
    "d": {
      "extraDmg": 5,
      "extraHit": 5
    },
    "msg": "你的武器燃起灼熱之炎。"
  },
  "sk_royal_precise": {
    "n": "精準目標",
    "dur": 16,
    "mp": 2,
    "msg": "你鎖定全場敵人，使其露出破綻。"
  },
  "sk_royal_shield": {
    "n": "閃亮之盾",
    "dur": 640,
    "mp": 25,
    "d": {
      "ac": 8
    },
    "msg": "閃亮的護盾環繞著你。"
  },
  "sk_shield": {
    "n": "保護罩",
    "dur": 1200,
    "mp": 2,
    "d": {
      "ac": 2
    }
  },
  "sk_shield2": {
    "n": "鎧甲護持",
    "dur": 1800,
    "mp": 20,
    "d": {
      "ac": 3
    },
    "msg": "你的盔甲暫時被注入了魔法力量。"
  },
  "sk_solid_shield": {
    "n": "堅固防護",
    "dur": 180,
    "mp": 5,
    "d": {
      "er": 15
    }
  },
  "sk_soul_up": {
    "n": "靈魂昇華",
    "dur": 1200,
    "mp": 20,
    "msg": "你覺得身體充滿了活力。"
  },
  "sk_spike_armor": {
    "n": "尖刺盔甲",
    "dur": 1200,
    "mp": 10,
    "d": {
      "meleeHit": 5
    }
  },
  "sk_str_up": {
    "n": "體魄強健術",
    "dur": 1200,
    "mp": 50,
    "d": {
      "str": 5
    },
    "msg": "你覺得身體充滿了力量。"
  },
  "sk_sunlight": {
    "n": "日光術",
    "dur": 7200,
    "mp": 4,
    "msg": "你更容易被怪物發現了。"
  },
  "sk_warrior_endurance": {
    "n": "體能強化",
    "dur": 3000,
    "mp": 10,
    "msg": "你的體魄變得更加強韌。"
  },
  "sk_warrior_outlaw": {
    "n": "亡命之徒",
    "dur": 60,
    "mp": 10,
    "msg": "你豁出性命，攻勢勢在必中。"
  },
  "sk_warrior_throwaxe": {
    "n": "戰斧投擲",
    "dur": 64,
    "mp": 5,
    "msg": "你蓄勢待發，斧刃將撕裂一切阻擋。"
  },
  "sk_heal_energy_storm": {
    "n": "治癒能量風暴",
    "dur": 320,
    "mp": 20,
    "msg": "治癒的能量風暴環繞著你，生命力快速匯聚。"
  },
};;
const SKILL_MAGE = [
  {id:'sk_sunlight',n:'日光術',lv:4},{id:'sk_lightarrow',n:'光箭',lv:4},
  {id:'sk_icearrow',n:'冰箭',lv:4},{id:'sk_heal1',n:'初級治癒術',lv:4},
  {id:'sk_shield',n:'保護罩',lv:4},{id:'sk_windblade',n:'風刃',lv:4},
  {id:'sk_holy_wpn',n:'神聖武器',lv:4},{id:'sk_teleport',n:'傳送術',lv:4},
  {id:'sk_firearrow',n:'火箭',lv:8},{id:'sk_hell_fang',n:'地獄之牙',lv:8},
  {id:'sk_poison_curse',n:'毒咒',lv:8},{id:'sk_load_up',n:'負重強化',lv:8},
  {id:'sk_cold_shiver',n:'寒冷戰慄',lv:8},{id:'sk_reveal',n:'無所遁形術',lv:8},
  {id:'sk_antidote',n:'解毒術',lv:8},{id:'sk_ench_wpn',n:'擬似魔法武器',lv:8},
  {id:'sk_heal_mid',n:'中級治癒術',lv:12},{id:'sk_energy_sense',n:'能量感測',lv:12},
  {id:'sk_undead_bane',n:'起死回生術',lv:12},{id:'sk_chill',n:'寒冰氣息',lv:12},
  {id:'sk_aurora',n:'極光雷電',lv:12},{id:'sk_dark_blind',n:'闇盲咒術',lv:12},
  {id:'sk_shield2',n:'鎧甲護持',lv:12},
  {id:'sk_vampire',n:'吸血鬼之吻',lv:16},{id:'sk_rock_prison',n:'岩牢',lv:16},
  {id:'sk_meditation',n:'冥想術',lv:16},{id:'sk_dex_up',n:'通暢氣脈術',lv:16},
  {id:'sk_slow',n:'緩速術',lv:16},{id:'sk_fireball',n:'燃燒的火球',lv:16},
  {id:'sk_break',n:'壞物術',lv:16},{id:'sk_magic_shield',n:'魔法屏障',lv:16},
  {id:'sk_mummy_curse',n:'木乃伊的詛咒',lv:20},{id:'sk_ice_spike',n:'冰錐',lv:20},
  {id:'sk_charm',n:'迷魅術',lv:20},{id:'sk_heal2',n:'高級治癒術',lv:20},
  {id:'sk_dark_shadow',n:'黑闇之影',lv:20},{id:'sk_thunder',n:'極道落雷',lv:20},
  {id:'sk_holy_light',n:'聖潔之光',lv:20},{id:'sk_mana_drain',n:'魔力奪取',lv:20},
  {id:'sk_haste_spell',n:'加速術',lv:24},{id:'sk_earthquake',n:'地裂術',lv:24},
  {id:'sk_weaken',n:'弱化術',lv:24},{id:'sk_blaze',n:'烈炎術',lv:24},
  {id:'sk_bless_wpn',n:'祝福魔法武器',lv:24},{id:'sk_zombie',n:'造屍術',lv:24},
  {id:'sk_cancel',n:'魔法相消術',lv:24},{id:'sk_str_up',n:'體魄強健術',lv:24},
  {id:'sk_summon',n:'召喚術',lv:28},{id:'sk_ice_lance',n:'冰矛圍籬',lv:28},
  {id:'sk_berserk',n:'狂暴術',lv:28},{id:'sk_disease',n:'疾病術',lv:28},
  {id:'sk_holy_dash',n:'神聖疾走',lv:28},{id:'sk_greater_haste',n:'強力加速術',lv:28},
  {id:'sk_tornado',n:'龍捲風',lv:28},{id:'sk_regen',n:'體力回復術',lv:28},
  {id:'sk_fire_prison',n:'火牢',lv:32},{id:'sk_full_heal',n:'全部治癒術',lv:32},
  {id:'sk_blizzard',n:'冰雪暴',lv:32},{id:'sk_resurrection',n:'返生術',lv:32},
  {id:'sk_quake',n:'震裂術',lv:32},{id:'sk_invisible',n:'隱身術',lv:32},
  {id:'sk_seal',n:'魔法封印',lv:32},
  {id:'sk_fire_storm',n:'火風暴',lv:36},{id:'sk_sleep_mist',n:'沉睡之霧',lv:36},
  {id:'sk_holy_barrier',n:'聖結界',lv:36},{id:'sk_thunder_storm',n:'雷霆風暴',lv:36},
  {id:'sk_blizzard_storm',n:'冰雪颶風',lv:40},{id:'sk_disintegrate',n:'究極光裂術',lv:40},
  {id:'sk_meteor',n:'流星雨',lv:40},{id:'sk_abs_barrier',n:'絕對屏障',lv:40},
  {id:'sk_soul_up',n:'靈魂昇華',lv:40},
];
const SKILL_KNIGHT = [
  {id:'sk_sunlight',n:'日光術',lv:16},{id:'sk_lightarrow',n:'光箭',lv:16},
  {id:'sk_icearrow',n:'冰箭',lv:16},{id:'sk_heal1',n:'初級治癒術',lv:16},
  {id:'sk_shield',n:'保護罩',lv:16},{id:'sk_windblade',n:'風刃',lv:16},
  {id:'sk_holy_wpn',n:'神聖武器',lv:16},{id:'sk_teleport',n:'傳送術',lv:16},
  {id:'sk_counter_barrier',n:'反擊屏障',lv:30},{id:'sk_spike_armor',n:'尖刺盔甲',lv:30},
  {id:'sk_reduction_armor',n:'增幅防禦',lv:30},{id:'sk_shock_stun',n:'衝擊之暈',lv:30},
  {id:'sk_solid_shield',n:'堅固防護',lv:40},
];
const SKILL_ELF = [
  {id:'sk_sunlight',n:'日光術',lv:8},{id:'sk_lightarrow',n:'光箭',lv:8},
  {id:'sk_icearrow',n:'冰箭',lv:8},{id:'sk_heal1',n:'初級治癒術',lv:8},
  {id:'sk_shield',n:'保護罩',lv:8},{id:'sk_windblade',n:'風刃',lv:8},
  {id:'sk_holy_wpn',n:'神聖武器',lv:8},{id:'sk_teleport',n:'傳送術',lv:8},
  {id:'sk_elf_triple',n:'三重矢',lv:10},{id:'sk_elf_mind',n:'心靈轉換',lv:10},
  {id:'sk_elf_worldtree',n:'世界樹的呼喚',lv:10},{id:'sk_elf_mr',n:'魔法防禦',lv:10},
  {id:'sk_elf_purify',n:'淨化精神',lv:20},{id:'sk_elf_soul',n:'魂體轉換',lv:20},
  {id:'sk_elf_release',n:'釋放元素',lv:20},{id:'sk_elf_eleres',n:'屬性防禦',lv:20},
  {id:'sk_elf_earthguard',n:'大地防護',lv:30},{id:'sk_elf_watervital',n:'水之元氣',lv:30},
  {id:'sk_elf_firewpn',n:'火焰武器',lv:30},{id:'sk_elf_groundtrap',n:'地面障礙',lv:30},
  {id:'sk_elf_winddash',n:'風之疾走',lv:30},{id:'sk_elf_windshot',n:'風之神射',lv:30},
  {id:'sk_elf_singleres',n:'單屬性防禦',lv:30},
  {id:'sk_elf_earthbless',n:'大地的祝福',lv:40},{id:'sk_elf_earthshield',n:'大地屏障',lv:40},
  {id:'sk_elf_summon',n:'召喚屬性精靈',lv:40},{id:'sk_elf_lifespring',n:'生命之泉',lv:40},
  {id:'sk_elf_dancefire',n:'舞躍之火',lv:40},{id:'sk_elf_stormeye',n:'暴風之眼',lv:40},
  {id:'sk_elf_magicerase',n:'魔法消除',lv:40},
  {id:'sk_elf_summon2',n:'召喚強力屬性精靈',lv:50},{id:'sk_elf_lifebless',n:'生命的祝福',lv:50},
  {id:'sk_elf_seal',n:'封印禁地',lv:50},{id:'sk_elf_blazewpn',n:'烈炎武器',lv:50},
  {id:'sk_elf_flamesoul',n:'烈焰之魂',lv:50},{id:'sk_elf_energyboost',n:'能量激發',lv:50},
  {id:'sk_elf_preciseshot',n:'精準射擊',lv:50},{id:'sk_elf_stormshot',n:'暴風神射',lv:50},
  {id:'sk_elf_steelguard',n:'鋼鐵防護',lv:50},{id:'sk_elf_mirror',n:'鏡反射',lv:50},
  {id:'sk_elf_attrfire',n:'屬性之火',lv:50},{id:'sk_elf_physboost',n:'體能激發',lv:50},
];
const SKILL_DARK = [
  {id:'sk_sunlight',n:'日光術',lv:12},{id:'sk_lightarrow',n:'光箭',lv:12},
  {id:'sk_icearrow',n:'冰箭',lv:12},{id:'sk_heal1',n:'初級治癒術',lv:12},
  {id:'sk_shield',n:'保護罩',lv:12},{id:'sk_windblade',n:'風刃',lv:12},
  {id:'sk_holy_wpn',n:'神聖武器',lv:12},{id:'sk_teleport',n:'傳送術',lv:12},
  {id:'sk_dark_str',n:'力量提升',lv:15},{id:'sk_dark_poison',n:'附加劇毒',lv:15},
  {id:'sk_dark_refine',n:'提煉魔石',lv:15},{id:'sk_dark_stealth',n:'暗隱術',lv:15},
  {id:'sk_dark_mrup',n:'影之防護',lv:15},
  {id:'sk_dark_walkhaste',n:'行走加速',lv:30},{id:'sk_dark_poisonres',n:'毒性抵抗',lv:30},
  {id:'sk_dark_dex',n:'敏捷提升',lv:30},{id:'sk_dark_burn',n:'燃燒鬥志',lv:30},
  {id:'sk_dark_armorbreak',n:'破壞盔甲',lv:45},{id:'sk_dark_erup',n:'迴避提升',lv:45},
  {id:'sk_dark_fang',n:'暗影之牙',lv:45},{id:'sk_dark_dodge',n:'暗影閃避',lv:45},
  {id:'sk_dark_crit',n:'會心一擊',lv:45},{id:'sk_dark_double',n:'雙重破壞',lv:45},
];
const SKILL_ROYAL = [
  {id:'sk_sunlight',n:'日光術',lv:10},{id:'sk_lightarrow',n:'光箭',lv:10},
  {id:'sk_icearrow',n:'冰箭',lv:10},{id:'sk_heal1',n:'初級治癒術',lv:10},
  {id:'sk_shield',n:'保護罩',lv:10},{id:'sk_windblade',n:'風刃',lv:10},
  {id:'sk_holy_wpn',n:'神聖武器',lv:10},{id:'sk_teleport',n:'傳送術',lv:10},
  {id:'sk_royal_precise',n:'精準目標',lv:15},
  {id:'sk_royal_callally',n:'呼喚盟友',lv:30},
  {id:'sk_royal_burnweapon',n:'灼熱武器',lv:40},
  {id:'sk_royal_kingguard',n:'王者加護',lv:50},
  {id:'sk_royal_bravewill',n:'勇猛意志',lv:50},
  {id:'sk_royal_shield',n:'閃亮之盾',lv:50},
];
const SKILL_DRAGON = [
  {id:'sk_sunlight',n:'日光術',lv:15},{id:'sk_teleport',n:'傳送術',lv:15},
  {id:'sk_dragon_lavaspit',n:'岩漿噴吐',lv:15},{id:'sk_dragon_flameslash',n:'燃燒擊砍',lv:15},
  {id:'sk_dragon_armor',n:'龍之護鎧',lv:15},
  {id:'sk_dragon_awaken_antares',n:'覺醒：安塔瑞斯',lv:15},
  {id:'sk_dragon_guardbreak',n:'護衛毀滅',lv:15},
  {id:'sk_dragon_bloodlust',n:'血之渴望',lv:30},{id:'sk_dragon_lavabolt',n:'岩漿之箭',lv:30},
  {id:'sk_dragon_terror',n:'恐懼無助',lv:30},{id:'sk_dragon_slaughter',n:'屠宰者',lv:30},
  {id:'sk_dragon_awaken_falion',n:'覺醒：法利昂',lv:30},
  {id:'sk_dragon_deadlybody',n:'致命身軀',lv:45},
  {id:'sk_dragon_deathlightning',n:'奪命之雷',lv:45},
  {id:'sk_dragon_awaken_baraka',n:'覺醒：巴拉卡斯',lv:45},
  {id:'sk_dragon_reaper',n:'驚悚死神',lv:45},
];
const SKILL_ILLUSION = [
  {id:'sk_illu_ogre',n:'幻覺：歐吉',lv:10},{id:'sk_sunlight',n:'日光術',lv:10},
  {id:'sk_illu_cube_burn',n:'立方：燃燒',lv:10},{id:'sk_illu_crush',n:'粉碎能量',lv:10},
  {id:'sk_illu_confuse',n:'混亂',lv:10},{id:'sk_teleport',n:'傳送術',lv:10},
  {id:'sk_illu_mirror',n:'鏡像',lv:10},
  {id:'sk_illu_lich',n:'幻覺：巫妖',lv:20},{id:'sk_illu_mindbreak',n:'心靈破壞',lv:20},
  {id:'sk_illu_cube_quake',n:'立方：地裂',lv:20},{id:'sk_illu_focus',n:'專注',lv:20},
  {id:'sk_illu_skullbreak',n:'骷髏毀壞',lv:20},
  {id:'sk_illu_fantasy',n:'幻想',lv:30},{id:'sk_illu_golem',n:'幻覺：鑽石高崙',lv:30},
  {id:'sk_illu_cube_shock',n:'立方：衝擊',lv:30},{id:'sk_illu_endure',n:'耐力',lv:30},
  {id:'sk_illu_avatar',n:'幻覺：化身',lv:40},{id:'sk_illu_cube_harmony',n:'立方：和諧',lv:40},
  {id:'sk_illu_insight',n:'洞察',lv:40},{id:'sk_illu_panic',n:'恐慌',lv:40},
  {id:'sk_illu_pain',n:'疼痛的歡愉',lv:40},
];
const SKILL_WARRIOR = [
  {id:'sk_warrior_dualaxe',n:'迅猛雙斧',lv:15},{id:'sk_warrior_throwaxe',n:'戰斧投擲',lv:15},
  {id:'sk_sunlight',n:'日光術',lv:15},{id:'sk_lightarrow',n:'光箭',lv:15},
  {id:'sk_icearrow',n:'冰箭',lv:15},{id:'sk_heal1',n:'初級治癒術',lv:15},
  {id:'sk_shield',n:'保護罩',lv:15},{id:'sk_windblade',n:'風刃',lv:15},
  {id:'sk_holy_wpn',n:'神聖武器',lv:15},{id:'sk_teleport',n:'傳送術',lv:15},
  {id:'sk_warrior_roar',n:'咆哮',lv:30},{id:'sk_warrior_crush',n:'粉碎',lv:30},
  {id:'sk_warrior_armorbody',n:'護甲身軀',lv:45},
  {id:'sk_warrior_berserk',n:'狂暴',lv:50},{id:'sk_warrior_titan_rock',n:'泰坦：岩石',lv:50},
  {id:'sk_warrior_titan_magic',n:'泰坦：魔法',lv:50},
  {id:'sk_warrior_endurance',n:'體能強化',lv:50},
  {id:'sk_warrior_outlaw',n:'亡命之徒',lv:60},
  {id:'sk_warrior_titan_bullet',n:'泰坦：子彈',lv:60},
];

function makeTiers(arr){
  return [...new Set(arr.map(s=>s.lv))].sort((a,b)=>a-b).map(lv=>({
    lv, label:`Lv ${lv} 解鎖`,
    skills: arr.filter(s=>s.lv===lv)
  }));
}

const SKILL_CLASSES = [
  {cls:'mage',    name:'法師',     tiers:makeTiers(SKILL_MAGE)    },
  {cls:'knight',  name:'騎士',     tiers:makeTiers(SKILL_KNIGHT)  },
  {cls:'elf',     name:'妖精',     tiers:makeTiers(SKILL_ELF)     },
  {cls:'dark',    name:'黑暗妖精', tiers:makeTiers(SKILL_DARK)    },
  {cls:'royal',   name:'王族',     tiers:makeTiers(SKILL_ROYAL)   },
  {cls:'dragon',  name:'龍騎士',   tiers:makeTiers(SKILL_DRAGON)  },
  {cls:'illusion',name:'幻術師',   tiers:makeTiers(SKILL_ILLUSION)},
  {cls:'warrior', name:'戰士',     tiers:makeTiers(SKILL_WARRIOR) },
];

const SKILL_MAP = {};
[...SKILL_MAGE,...SKILL_KNIGHT,...SKILL_ELF,...SKILL_DARK,
 ...SKILL_ROYAL,...SKILL_DRAGON,...SKILL_ILLUSION,...SKILL_WARRIOR
].forEach(s=>{ SKILL_MAP[s.id]=s.n; });

let _skillTab = 'all';

function switchSkillTab(cls, el){
  _skillTab = cls;
  document.querySelectorAll('.skill-filter-btn').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderSkillPanel();
}

// ════════════════════════════════════════════════
//  技能面板渲染
// ════════════════════════════════════════════════
function renderSkillPanel(){
  const learned   = new Set(G.p.skills || []);
  const q         = (document.getElementById('skillSearch')?.value || '').toLowerCase().trim();
  const container = document.getElementById('skillContent');
  if(!container) return;

  const ICON = {
    mage:'🔮',knight:'🛡️',elf:'🌿',dark:'🌑',
    royal:'👑',dragon:'🐉',illusion:'🎭',warrior:'⚔️'
  };

  const classes = _skillTab === 'all'
    ? SKILL_CLASSES
    : SKILL_CLASSES.filter(c=>c.cls===_skillTab);

  let html = '';
  classes.forEach(cls => {
    let tierHtml = '';
    cls.tiers.forEach(tier => {
      const filtered = tier.skills.filter(s =>
        !q || s.n.includes(q) || s.id.toLowerCase().includes(q)
      );
      if(!filtered.length) return;
      tierHtml += `
        <div class="skill-tier-block">
          <div class="skill-tier-header">${tier.label}</div>
          <div class="skill-grid">
            ${filtered.map(s=>skillCardHTML(s,learned)).join('')}
          </div>
        </div>`;
    });
    if(!tierHtml) return;
    html += `
      <div class="skill-class-block">
        <div class="skill-class-title">${ICON[cls.cls]||''} ${cls.name}</div>
        ${tierHtml}
      </div>`;
  });

  container.innerHTML = html ||
    '<div style="color:var(--text3);padding:20px">找不到符合的技能</div>';
}

function skillCardHTML(s, learned){
  const sel = learned.has(s.id);
  return `
    <div class="skill-card ${sel?'selected':''}"
         onclick="toggleSkill(this,'${s.id}')">
      <input type="checkbox" ${sel?'checked':''}
             onclick="event.stopPropagation();toggleSkill(this.closest('.skill-card'),'${s.id}')">
      <div class="skill-card-info">
        <div class="skill-card-name">${s.n}</div>
        <div class="skill-card-id">${s.id}</div>
      </div>
    </div>`;
}

function toggleSkill(el, id){
  if(!G.p.skills) G.p.skills = [];
  const idx = G.p.skills.indexOf(id);
  if(idx === -1){
    G.p.skills.push(id);
    el.classList.add('selected');
    const cb = el.querySelector('input[type=checkbox]');
    if(cb) cb.checked = true;
  } else {
    G.p.skills.splice(idx, 1);
    el.classList.remove('selected');
    const cb = el.querySelector('input[type=checkbox]');
    if(cb) cb.checked = false;
  }
}

function skillSelectAll(){
  document.querySelectorAll('#skillContent .skill-card').forEach(card => {
    const id = card.querySelector('.skill-card-id')?.textContent;
    if(!id) return;
    if(!G.p.skills) G.p.skills = [];
    if(!G.p.skills.includes(id)) G.p.skills.push(id);
    card.classList.add('selected');
    const cb = card.querySelector('input[type=checkbox]');
    if(cb) cb.checked = true;
  });
  toast('已全選（目前分頁）', 'ok');
}

function skillClearAll(){
  document.querySelectorAll('#skillContent .skill-card').forEach(card => {
    const id = card.querySelector('.skill-card-id')?.textContent;
    if(!id) return;
    if(G.p.skills){
      const idx = G.p.skills.indexOf(id);
      if(idx !== -1) G.p.skills.splice(idx, 1);
    }
    card.classList.remove('selected');
    const cb = card.querySelector('input[type=checkbox]');
    if(cb) cb.checked = false;
  });
  toast('已全清（目前分頁）', 'info');
}

// ════════════════════════════════════════════════
//  輔助狀態（buff）面板
// ════════════════════════════════════════════════
function _buffDescribe(sk){
  const labelMap = {
    str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神', cha:'魅力',
    ac:'防禦', mhp:'最大HP', mmp:'最大MP', mpR:'MP回復',
    extraDmg:'額外傷害', extraHit:'額外命中', meleeDmg:'近戰傷害', er:'閃避'
  };
  const parts = [];
  if(sk.d){
    Object.keys(sk.d).forEach(k=>{
      const v = sk.d[k];
      const label = labelMap[k] || k;
      parts.push(`${label}${v>=0?'+':''}${v}`);
    });
  }
  if(sk.haste) parts.push('加速');
  if(sk.summon) parts.push('召喚/持續維持效果');
  let desc = parts.join('、');
  if(!desc && sk.msg) desc = sk.msg;
  return desc;
}
function renderBuffPanel(){
  const container = document.getElementById('buffContent');
  if(!container) return;
  if(!G.p.buffs) G.p.buffs = {};
  const q = (document.getElementById('buffSearch')?.value || '').toLowerCase().trim();
  const ids = Object.keys(BUFF_SKILL_DB).sort((a,b)=>BUFF_SKILL_DB[a].n.localeCompare(BUFF_SKILL_DB[b].n,'zh-Hant'));
  const filtered = ids.filter(id=>{
    if(!q) return true;
    return BUFF_SKILL_DB[id].n.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  });
  container.innerHTML = `<div class="buff-grid">${filtered.map(buffCardHTML).join('')}</div>` ||
    '<div style="color:var(--text3);padding:20px">找不到符合的輔助狀態</div>';
}
function buffCardHTML(id){
  const sk = BUFF_SKILL_DB[id];
  const cur = (G.p.buffs && G.p.buffs[id]) || 0;
  const desc = _buffDescribe(sk);
  return `
    <div class="buff-card ${cur>0?'active':''}" id="buffcard_${id}">
      <div class="buff-card-name">${sk.n}</div>
      <div class="buff-card-id">${id}　預設 ${sk.dur||0} 秒</div>
      ${desc ? `<div class="buff-card-desc">${desc}</div>` : ''}
      <div class="buff-card-row">
        <input type="number" min="0" id="buffval_${id}" value="${cur||''}" placeholder="0"
               onchange="buffValueChange('${id}',this.value)">
        <button onclick="buffApplyDefault('${id}')">套用預設</button>
        <button onclick="buffClearOne('${id}')">清除</button>
      </div>
    </div>`;
}
function buffValueChange(id, val){
  if(!G.p.buffs) G.p.buffs = {};
  const n = Math.max(0, parseInt(val) || 0);
  if(n > 0) G.p.buffs[id] = n;
  else delete G.p.buffs[id];
  const card = document.getElementById('buffcard_'+id);
  if(card) card.classList.toggle('active', n > 0);
}
function buffApplyDefault(id){
  const sk = BUFF_SKILL_DB[id];
  if(!sk) return;
  if(!G.p.buffs) G.p.buffs = {};
  G.p.buffs[id] = sk.dur || 0;
  const input = document.getElementById('buffval_'+id);
  if(input) input.value = sk.dur || 0;
  const card = document.getElementById('buffcard_'+id);
  if(card) card.classList.toggle('active', (sk.dur||0) > 0);
}
function buffClearOne(id){
  if(G.p.buffs) delete G.p.buffs[id];
  const input = document.getElementById('buffval_'+id);
  if(input) input.value = '';
  const card = document.getElementById('buffcard_'+id);
  if(card) card.classList.remove('active');
}
function buffApplyAllDefault(){
  const rawVal = (document.getElementById('buffApplyAllVal')?.value || '').trim();
  const customVal = rawVal === '' ? null : Math.max(0, parseInt(rawVal) || 0);
  const msg = customVal === null
    ? '確定將目前列出的所有輔助狀態套用「各自預設」持續時間？'
    : `確定將目前列出的所有輔助狀態都套用為 ${customVal} 秒？`;
  if(!confirm(msg)) return;
  if(!G.p.buffs) G.p.buffs = {};
  const q = (document.getElementById('buffSearch')?.value || '').toLowerCase().trim();
  Object.keys(BUFF_SKILL_DB).forEach(id=>{
    const sk = BUFF_SKILL_DB[id];
    if(q && !sk.n.toLowerCase().includes(q) && !id.toLowerCase().includes(q)) return;
    G.p.buffs[id] = customVal === null ? (sk.dur || 0) : customVal;
  });
  renderBuffPanel();
  toast(customVal === null ? '已套用預設持續時間' : `已全部套用為 ${customVal} 秒`, 'ok');
}
function buffClearAll(){
  if(!confirm('確定清除目前角色所有輔助狀態？')) return;
  G.p.buffs = {};
  renderBuffPanel();
  toast('已清除所有輔助狀態', 'info');
}

// ── 授予技能
function renderGrantedSkillList(){
  const container = document.getElementById('grantedSkillList');
  if(!container) return;
  const list = G.p.grantedSkills || [];
  container.innerHTML = list.map((id,i) => `
    <div style="display:flex;align-items:center;gap:4px;
                background:var(--bg4);border:1px solid var(--border);
                border-radius:4px;padding:3px 8px;font-size:12px">
      <span style="color:var(--accent2)">${SKILL_MAP[id]||id}</span>
      <span style="color:var(--text3);font-size:10px">${id}</span>
      <button class="btn btn-danger btn-sm" style="padding:1px 5px;font-size:11px"
              onclick="removeGrantedSkill(${i})">✕</button>
    </div>`).join('');
}

function addGrantedSkill(){
  const id = document.getElementById('grantedSkillInput')?.value.trim();
  if(!id){ toast('請輸入技能 ID', 'err'); return; }
  if(!G.p.grantedSkills) G.p.grantedSkills = [];
  if(G.p.grantedSkills.includes(id)){ toast('已存在', 'warn'); return; }
  G.p.grantedSkills.push(id);
  document.getElementById('grantedSkillInput').value = '';
  renderGrantedSkillList();
  toast('已新增授予技能：' + (SKILL_MAP[id]||id), 'ok');
}

function removeGrantedSkill(idx){
  G.p.grantedSkills.splice(idx, 1);
  renderGrantedSkillList();
}

function clearGrantedSkills(){
  G.p.grantedSkills = [];
  renderGrantedSkillList();
  toast('已清空授予技能', 'info');
}