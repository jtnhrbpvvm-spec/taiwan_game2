

// ════════════════════════════════════════════════
//  圖鑑面板
// ════════════════════════════════════════════════
let _dexTab = 'equip';

function switchDexTab(tab, el){
  _dexTab = tab;
  document.querySelectorAll('#dexTabBar .skill-filter-btn')
    .forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('dex-equip').style.display = tab==='equip' ? '' : 'none';
  document.getElementById('dex-card').style.display  = tab==='card'  ? '' : 'none';
  document.getElementById('dex-misc').style.display  = tab==='misc'  ? '' : 'none';
  document.getElementById('dex-relic').style.display = tab==='relic' ? '' : 'none';
  if(tab==='misc')  renderDexMisc();
  if(tab==='relic') renderDexRelic();
}

// ── 裝備/遺物分類系統（來源：10-ui-tabs.js WEAPON_TAGS + 16-equip-book.js EQUIP_CATEGORIES/equipCatKey）
function isWandWeapon(d){ return !!(d && d.isWand); }
const WEAPON_TAGS = {
  "wpn_katana": [
    "單手劍",
    "武士刀"
  ],
  "wpn_siruge": [
    "單手劍",
    "武士刀"
  ],
  "wpn_golden_scepter": [
    "單手劍",
    "武士刀"
  ],
  "wpn_dagger2": [
    "匕首"
  ],
  "wpn_dagger1": [
    "匕首"
  ],
  "wpn_11": [
    "匕首"
  ],
  "wpn_33": [
    "匕首"
  ],
  "wpn_longsword": [
    "單手劍"
  ],
  "wpn_9": [
    "單手劍"
  ],
  "wpn_scimitar": [
    "單手劍"
  ],
  "wpn_26": [
    "單手劍"
  ],
  "wpn_elfsword": [
    "單手劍"
  ],
  "wpn_27": [
    "單手劍"
  ],
  "wpn_shortsword": [
    "單手劍"
  ],
  "wpn_redknight": [
    "單手劍"
  ],
  "wpn_invader": [
    "單手劍"
  ],
  "wpn_34": [
    "單手劍"
  ],
  "wpn_35": [
    "單手劍"
  ],
  "wpn_36": [
    "單手劍"
  ],
  "wpn_rapier": [
    "單手劍"
  ],
  "wpn_mailbreaker": [
    "單手劍"
  ],
  "wpn_silversword": [
    "單手劍"
  ],
  "wpn_37": [
    "單手劍"
  ],
  "wpn_21": [
    "矛"
  ],
  "wpn_24": [
    "矛"
  ],
  "wpn_25": [
    "矛"
  ],
  "wpn_28": [
    "矛"
  ],
  "wpn_39": [
    "矛"
  ],
  "wpn_40": [
    "矛"
  ],
  "wpn_41": [
    "矛"
  ],
  "wpn_17": [
    "矛"
  ],
  "wpn_4": [
    "矛"
  ],
  "wpn_halberd": [
    "矛"
  ],
  "wpn_20": [
    "單手鈍器"
  ],
  "wpn_10": [
    "單手鈍器"
  ],
  "wpn_13": [
    "單手鈍器"
  ],
  "wpn_alien": [
    "單手鈍器"
  ],
  "wpn_1": [
    "單手鈍器"
  ],
  "wpn_2": [
    "單手鈍器"
  ],
  "wpn_ancient_axe": [
    "單手鈍器"
  ],
  "wpn_warrior_trial_axe": [
    "單手鈍器"
  ],
  "wpn_master_axe": [
    "單手鈍器"
  ],
  "wpn_demon_axehead": [
    "單手鈍器"
  ],
  "wpn_iron_axehead": [
    "單手鈍器"
  ],
  "wpn_giant_axehead": [
    "單手鈍器"
  ],
  "wpn_2hsword": [
    "雙手劍"
  ],
  "wpn_dragonslayer": [
    "雙手劍"
  ],
  "wpn_official_2h": [
    "雙手劍"
  ],
  "wpn_battleaxe": [
    "雙手鈍器"
  ],
  "wpn_19": [
    "雙手鈍器"
  ],
  "wpn_23": [
    "雙手鈍器"
  ],
  "wpn_giantaxe": [
    "雙手鈍器"
  ],
  "wpn_berserker": [
    "雙手鈍器"
  ],
  "wpn_silveraxe": [
    "雙手鈍器"
  ],
  "wpn_taurus_axe": [
    "雙手鈍器"
  ],
  "wpn_claw_bronze": [
    "鋼爪"
  ],
  "wpn_claw_steel": [
    "鋼爪"
  ],
  "wpn_claw_shadow": [
    "鋼爪"
  ],
  "wpn_claw_silver": [
    "鋼爪"
  ],
  "wpn_claw_dark": [
    "鋼爪"
  ],
  "wpn_claw_gloom": [
    "鋼爪"
  ],
  "wpn_claw_damascus": [
    "鋼爪"
  ],
  "wpn_claw_abyss": [
    "鋼爪"
  ],
  "wpn_baranka_claw": [
    "鋼爪"
  ],
  "wpn_baranka_steelclaw": [
    "鋼爪"
  ],
  "wpn_blood_2hsword": [
    "雙手劍"
  ],
  "wpn_dark_sword": [
    "單手劍"
  ],
  "wpn_dk_flameblade": [
    "單手劍"
  ],
  "wpn_kurt_sword": [
    "單手劍"
  ],
  "wpn_assassin_mark": [
    "雙刀"
  ],
  "wpn_dual_bronze": [
    "雙刀"
  ],
  "wpn_dual_steel": [
    "雙刀"
  ],
  "wpn_dual_silver": [
    "雙刀"
  ],
  "wpn_dual_gloom": [
    "雙刀"
  ],
  "wpn_dual_dark": [
    "雙刀"
  ],
  "wpn_dual_shadow": [
    "雙刀"
  ],
  "wpn_dual_damascus": [
    "雙刀"
  ],
  "wpn_dual_abyss": [
    "雙刀"
  ],
  "wpn_thebes_dual": [
    "雙刀"
  ],
  "wpn_manadagger": [
    "匕首"
  ],
  "wpn_crystal_dagger": [
    "匕首"
  ],
  "wpn_chaos_thorn": [
    "匕首"
  ],
  "wpn_demonking_dual": [
    "雙刀"
  ],
  "wpn_demonking_2hsword": [
    "雙手劍"
  ],
  "wpn_small_katana": [
    "匕首"
  ],
  "wpn_dagger_rasta": [
    "匕首"
  ],
  "wpn_sword_rasta": [
    "單手劍"
  ],
  "wpn_dual_rasta": [
    "雙刀"
  ],
  "wpn_spear_rasta": [
    "矛"
  ],
  "wpn_dual_spike": [
    "雙刀"
  ],
  "wpn_official_blade": [
    "單手劍"
  ],
  "wpn_emperor_blade": [
    "雙手劍"
  ],
  "wpn_windblade_dagger": [
    "匕首"
  ],
  "wpn_redshadow_dual": [
    "雙刀"
  ],
  "wpn_beastking_claw": [
    "鋼爪"
  ],
  "wpn_mithril_dagger": [
    "匕首"
  ],
  "wpn_ori_dagger": [
    "匕首"
  ],
  "wpn_crimson_spear": [
    "矛"
  ],
  "wpn_demon_axe": [
    "雙手鈍器"
  ],
  "wpn_frost_spear": [
    "矛"
  ],
  "wpn_thunder_sword": [
    "單手劍"
  ],
  "wpn_vengeance": [
    "雙手劍"
  ],
  "wpn_blackflame_sword": [
    "單手劍",
    "武士刀"
  ],
  "wpn_hate_claw": [
    "鋼爪"
  ],
  "wpn_demon_claw": [
    "鋼爪"
  ],
  "wpn_death_finger": [
    "鋼爪"
  ],
  "wpn_demon_sword": [
    "單手劍"
  ],
  "wpn_redflame_sword": [
    "單手劍",
    "武士刀"
  ],
  "wpn_demon_dual": [
    "雙刀"
  ],
  "wpn_dual_destroy": [
    "雙刀"
  ],
  "wpn_claw_destroy": [
    "鋼爪"
  ],
  "wpn_old_sword": [
    "單手劍",
    "武士刀"
  ],
  "wpn_ancient_darkelf_sword": [
    "單手劍"
  ],
  "wpn_demon_sword_hidden": [
    "單手劍"
  ],
  "wpn_demon_claw_hidden": [
    "鋼爪"
  ],
  "wpn_pirate_dagger": [
    "匕首"
  ],
  "wpn_glory_sword": [
    "單手劍"
  ],
  "wpn_pirate_shortblade": [
    "單手劍"
  ],
  "wpn_pirate_cutlass": [
    "單手劍"
  ],
  "wpn_abyss_dualblade": [
    "雙刀"
  ],
  "wpn_thor_hammer": [
    "單手鈍器"
  ],
  "wpn_osis_hammer": [
    "單手鈍器"
  ],
  "wpn_mapler_punish": [
    "雙手鈍器"
  ],
  "wpn_pagrio_wrath": [
    "單手劍"
  ],
  "wpn_eva_scold": [
    "單手劍"
  ],
  "relic_goblin_blade": [
    "單手劍"
  ],
  "relic_gremlin_club": [
    "單手鈍器"
  ],
  "relic_husky_bone": [
    "單手鈍器"
  ],
  "relic_doberman_fang": [
    "匕首"
  ],
  "relic_gladiator_scimitar": [
    "單手劍"
  ],
  "relic_icefield_pick": [
    "單手鈍器"
  ],
  "relic_werewolf_mace": [
    "單手鈍器"
  ],
  "relic_orc_nail": [
    "匕首"
  ],
  "relic_pan_staff": [
    "矛"
  ],
  "relic_elastic_rib": [
    "雙刀"
  ],
  "relic_golem_fist": [
    "雙手鈍器"
  ],
  "relic_orc_cleaver": [
    "單手劍"
  ],
  "relic_strong_femur": [
    "單手鈍器"
  ],
  "relic_forgotten_spear": [
    "矛"
  ],
  "relic_spider_claw": [
    "鋼爪"
  ],
  "relic_hobgoblin_grinder": [
    "單手劍"
  ],
  "relic_orc_butcher": [
    "單手劍"
  ],
  "relic_orc_pole": [
    "矛"
  ],
  "relic_sparta_grudge": [
    "雙刀"
  ],
  "relic_shark_teeth": [
    "匕首"
  ],
  "relic_guard_spear": [
    "矛"
  ],
  "relic_crab_claw": [
    "鋼爪"
  ],
  "relic_venom_fang": [
    "雙手劍"
  ],
  "relic_ratman_skewer": [
    "矛"
  ],
  "relic_lizardman_cleaver": [
    "矛"
  ],
  "relic_ohm_maul": [
    "雙手鈍器"
  ],
  "relic_parrot_beak": [
    "雙手劍"
  ],
  "relic_pirate_scimitar": [
    "單手劍"
  ],
  "relic_scorpion_sting": [
    "匕首"
  ],
  "relic_harvey_claw": [
    "單手劍"
  ],
  "relic_guard_pike": [
    "矛"
  ],
  "relic_ogi_greataxe": [
    "雙手鈍器"
  ],
  "relic_darkthief_claw": [
    "鋼爪"
  ],
  "relic_fighter_axe": [
    "雙手鈍器"
  ],
  "relic_darkelf_grindblade": [
    "單手劍",
    "武士刀"
  ],
  "relic_wisp_remnant": [
    "單手劍",
    "武士刀"
  ],
  "relic_summoner_whip": [
    "單手鈍器"
  ],
  "relic_griffin_claw": [
    "鋼爪"
  ],
  "relic_croc_fang": [
    "雙手劍"
  ],
  "relic_icestone_maul": [
    "雙手鈍器"
  ],
  "relic_mutant_lamia_scale": [
    "匕首"
  ],
  "relic_thorn_needle": [
    "匕首"
  ],
  "relic_giant_toothpick": [
    "雙手劍"
  ],
  "relic_veteran_greatsword": [
    "雙手劍"
  ],
  "relic_giant_throwstone": [
    "雙手鈍器"
  ],
  "relic_armor_spareblade": [
    "雙刀"
  ],
  "relic_aruba_haste": [
    "單手鈍器"
  ],
  "relic_ashwarrior_flamesword": [
    "單手劍"
  ],
  "relic_deadgeneral_greatsword": [
    "雙手劍"
  ],
  "relic_darkscorpion_pincers": [
    "雙刀"
  ],
  "relic_medusa_stinger": [
    "單手鈍器"
  ],
  "relic_silent_venom": [
    "矛"
  ],
  "relic_axetaurus_brutalaxe": [
    "雙手鈍器"
  ],
  "relic_lizard_tongue": [
    "矛"
  ],
  "relic_killerbee_sting": [
    "匕首"
  ],
  "relic_ancient_spider_claw": [
    "單手劍",
    "武士刀"
  ],
  "relic_guardian_greatsword": [
    "雙手劍"
  ],
  "wpn_kukulkan_spear": [
    "矛"
  ],
  "relic_eto_whip": [
    "矛"
  ],
  "relic_serpent_fang": [
    "矛"
  ],
  "relic_kaira_fang": [
    "匕首"
  ],
  "relic_mud_idol": [
    "雙手鈍器"
  ],
  "relic_teo_hammer": [
    "單手鈍器"
  ],
  "relic_executor_axe": [
    "單手鈍器"
  ],
  "relic_healer_wand": [
    "單手鈍器"
  ],
  "relic_minotaur_flail": [
    "單手鈍器"
  ],
  "relic_executor_skewer": [
    "矛"
  ],
  "relic_weathered_obelisk": [
    "雙手鈍器"
  ],
  "relic_shadow_stinger": [
    "匕首"
  ],
  "relic_soulreaper_dual": [
    "雙刀"
  ],
  "relic_ghoul_fang": [
    "單手劍"
  ],
  "relic_sparto_shard": [
    "單手劍"
  ],
  "relic_pirate_dual": [
    "雙刀"
  ],
  "relic_lava_fists": [
    "單手鈍器"
  ],
  "wpn_damascus": [
    "單手劍"
  ],
  "wpn_6": [
    "矛"
  ],
  "wpn_7": [
    "矛"
  ],
  "wpn_12": [
    "矛"
  ],
  "wpn_15": [
    "矛"
  ],
  "wpn_18": [
    "矛"
  ],
  "wpn_14": [
    "矛"
  ],
  "wpn_16": [
    "矛"
  ],
  "wpn_demonking_spear": [
    "矛"
  ],
  "wpn_ancient_spear": [
    "矛"
  ],
  "relic_bk_lance": [
    "矛"
  ],
  "wpn_rond_dual": [
    "雙刀"
  ],
  "wpn_cursed_emperor_blade": [
    "單手劍",
    "武士刀"
  ],
  "wpn_uncursed_emperor_blade": [
    "單手劍",
    "武士刀"
  ],
  "relic_fireking_blast": [
    "雙手劍"
  ],
  "relic_waterking_caress": [
    "鋼爪"
  ],
  "relic_cerberus_pin": [
    "鋼爪"
  ],
  "relic_dark_metal_club": [
    "單手鈍器"
  ],
  "relic_ash_fist": [
    "單手鈍器"
  ],
  "relic_ant_pincer": [
    "單手劍",
    "武士刀"
  ],
  "relic_reaper_scythe": [
    "雙手劍"
  ],
  "relic_mage_dagger": [
    "匕首"
  ],
  "relic_sr_kettle_maul": [
    "雙手鈍器"
  ],
  "relic_sr_kama_blade": [
    "單手劍",
    "武士刀"
  ],
  "relic_sr_ushioni_horn": [
    "矛"
  ],
  "relic_earthshatter_sword": [
    "單手劍"
  ],
  "relic_gale_fistblade": [
    "鋼爪"
  ],
  "relic_hellfire_hammer": [
    "單手鈍器"
  ],
  "relic_blood_ritual_dagger": [
    "匕首"
  ],
  "relic_scorch_greatsword": [
    "雙手劍"
  ],
  "relic_bloodknight_dual": [
    "雙刀"
  ],
  "relic_elmo_spear": [
    "矛"
  ],
  "relic_crusher_hammer": [
    "雙手鈍器"
  ],
  "relic_maze_demon_glare": [
    "雙手鈍器"
  ],
  "relic_warrior_blackblade": [
    "單手劍",
    "武士刀"
  ],
  "relic_elmore_greatsword": [
    "雙手劍"
  ],
  "relic_beheading_scythe": [
    "雙手劍"
  ],
  "relic_serrated_fangs": [
    "雙刀"
  ],
  "relic_mageblade_knife": [
    "單手劍",
    "武士刀"
  ],
  "relic_true_dragonslayer": [
    "雙手劍"
  ],
  "relic_flame_dk_sword": [
    "單手劍",
    "武士刀"
  ]
};;;;;
const EQUIP_CATEGORIES = [
  {
    "key": "dagger",
    "name": "匕首",
    "group": "武器"
  },
  {
    "key": "sword1",
    "name": "單手劍",
    "group": "武器"
  },
  {
    "key": "sword2",
    "name": "雙手劍",
    "group": "武器"
  },
  {
    "key": "katana",
    "name": "武士刀",
    "group": "武器"
  },
  {
    "key": "blunt1",
    "name": "單手鈍器",
    "group": "武器"
  },
  {
    "key": "blunt2",
    "name": "雙手鈍器",
    "group": "武器"
  },
  {
    "key": "spear",
    "name": "矛",
    "group": "武器"
  },
  {
    "key": "claw",
    "name": "鋼爪",
    "group": "武器"
  },
  {
    "key": "dual",
    "name": "雙刀",
    "group": "武器"
  },
  {
    "key": "chainsword",
    "name": "鎖鏈劍",
    "group": "武器"
  },
  {
    "key": "bow",
    "name": "弓",
    "group": "武器"
  },
  {
    "key": "xbow",
    "name": "十字弓",
    "group": "武器"
  },
  {
    "key": "quiver",
    "name": "箭筒",
    "group": "武器"
  },
  {
    "key": "wand",
    "name": "魔杖",
    "group": "武器"
  },
  {
    "key": "qigu",
    "name": "奇古獸",
    "group": "武器"
  },
  {
    "key": "wpn_other",
    "name": "其他武器",
    "group": "武器"
  },
  {
    "key": "helm",
    "name": "頭盔",
    "group": "防具"
  },
  {
    "key": "armor",
    "name": "盔甲",
    "group": "防具"
  },
  {
    "key": "shin",
    "name": "脛甲",
    "group": "防具"
  },
  {
    "key": "tshirt",
    "name": "內衣",
    "group": "防具"
  },
  {
    "key": "cloak",
    "name": "斗篷",
    "group": "防具"
  },
  {
    "key": "boots",
    "name": "長靴",
    "group": "防具"
  },
  {
    "key": "gloves",
    "name": "手套",
    "group": "防具"
  },
  {
    "key": "shield",
    "name": "盾牌",
    "group": "防具"
  },
  {
    "key": "armguard",
    "name": "臂甲",
    "group": "防具"
  },
  {
    "key": "amulet",
    "name": "項鍊",
    "group": "飾品"
  },
  {
    "key": "ring",
    "name": "戒指",
    "group": "飾品"
  },
  {
    "key": "belt",
    "name": "腰帶",
    "group": "飾品"
  },
  {
    "key": "ear",
    "name": "耳環",
    "group": "飾品"
  },
  {
    "key": "pet",
    "name": "寵物裝備",
    "group": "飾品"
  },
  {
    "key": "doll",
    "name": "魔法娃娃",
    "group": "飾品"
  }
];;;
function equipCatKey(id, d) {
    if (!d) return null;
    if (d.type === 'wpn') {
        if (d.isArrow) return (typeof isRelicItem === 'function' && isRelicItem(d)) ? 'quiver' : null;   // 🏺 v3.2.0 遺物箭筒歸「箭筒」分類（供遺物收集冊）；一般箭矢＝彈藥，不收錄
        if (d.isBow) return /十字弓|弩/.test(d.n || '') ? 'xbow' : 'bow';
        if (d.qigu) return 'qigu';
        if (d.chainsword) return 'chainsword';
        if (typeof isWandWeapon === 'function' && isWandWeapon(d)) return 'wand';
        if (typeof WAND_LIGHTARROW_IDS !== 'undefined' && WAND_LIGHTARROW_IDS.indexOf(id) >= 0) return 'wand';   // 🔮 共鳴法器（惡魔鐮刀＝單手魔杖／漆黑水晶球等）歸魔杖
        let tags = (typeof getWeaponTags === 'function') ? getWeaponTags(id) : [];
        if (tags.indexOf('武士刀') >= 0) return 'katana';
        if (tags.indexOf('雙刀') >= 0) return 'dual';
        if (tags.indexOf('鋼爪') >= 0) return 'claw';
        if (tags.indexOf('匕首') >= 0) return 'dagger';
        if (tags.indexOf('雙手劍') >= 0) return 'sword2';
        if (tags.indexOf('單手劍') >= 0) return 'sword1';
        if (tags.indexOf('雙手鈍器') >= 0) return 'blunt2';
        if (tags.indexOf('單手鈍器') >= 0) return 'blunt1';
        if (tags.indexOf('矛') >= 0) return 'spear';
        // 無 tag 的武器：用 eff/名稱補分類（矛=穿透、雙手劍=切割、鈍器=重擊、共鳴法球=魔杖）
        if (/水晶球/.test(d.n || '')) return 'wand';
        if (d.eff === 'pierce') return 'spear';
        if (d.eff === 'cleave') return 'sword2';
        if (d.eff === 'crush') return d.w2h ? 'blunt2' : 'blunt1';
        return 'wpn_other';
    }
    if (d.type === 'arm') {
        if (d.armguard) return 'armguard';                           // 臂甲（slot:shield 但 armguard 旗標）
        if (d.slot === 'helm') return 'helm';
        if (d.slot === 'armor') return 'armor';
        if (d.slot === 'shin') return 'shin';   // 🦵 脛甲（盔甲下方·額外防具）
        if (d.slot === 'tshirt') return 'tshirt';   // 🏺 內衣（T恤）：供遺物 T恤 分類（一般 T恤亦一併納入裝備收集冊）
        if (d.slot === 'cloak') return 'cloak';
        if (d.slot === 'boots') return 'boots';
        if (d.slot === 'gloves') return 'gloves';
        if (d.slot === 'shield') return 'shield';
        if (d.slot === 'petarm') return 'pet';   // 🛡️ v3.2.37 寵物防具 → 寵物裝備分類
        return null;
    }
    if (d.type === 'acc') {
        if (d.slot === 'amulet') return 'amulet';
        if (d.slot === 'ring') return 'ring';
        if (d.slot === 'belt') return 'belt';
        if (d.slot === 'ear1' || d.slot === 'ear2' || d.slot === 'ear') return 'ear';
        if (d.slot === 'pet' || d.slot === 'petwpn') return 'pet';   // 🦴 v3.2.37 之牙改 slot:petwpn（寵物個別武器）
        if (d.slot === 'doll') return 'doll';
        return null;
    }
    return null;
}function getWeaponTags(id){ return WEAPON_TAGS[id] || []; }

// ---- 建立索引：部位 → [itemId,...]（裝備收集冊排除遺物；遺物另建於下方遺物圖鑑）----
const EQUIP_CAT_ITEMS = {};
const EQUIP_ITEM_CAT  = {};
let _equipIndexBuilt = false;
function _ensureEquipIndex(){
  if(_equipIndexBuilt) return;
  _equipIndexBuilt = true;
  EQUIP_CATEGORIES.forEach(c => EQUIP_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    if(!d || (d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc')) return;
    if(isRelicItem(d)) return;   // 遺物不進裝備收集冊，改進遺物收集冊
    const ck = equipCatKey(id, d);
    if(!ck || !EQUIP_CAT_ITEMS[ck]) return;
    EQUIP_CAT_ITEMS[ck].push(id);
    EQUIP_ITEM_CAT[id] = ck;
  });
  Object.keys(EQUIP_CAT_ITEMS).forEach(k => {
    EQUIP_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
}
function _equipCatOptionsHTML(){
  let lastGroup = '';
  let html = '<option value="">全部部位</option>';
  EQUIP_CATEGORIES.forEach(c => {
    if(c.group !== lastGroup){
      if(lastGroup) html += '</optgroup>';
      html += `<optgroup label="${c.group}">`;
      lastGroup = c.group;
    }
    html += `<option value="${c.key}">${c.name}</option>`;
  });
  html += '</optgroup>';
  return html;
}

// ── 裝備圖鑑（比照 16-equip-book.js：僅收錄真正裝備，依 27 部位分類，排除遺物）
function renderDexEquip(){
  _ensureEquipIndex();
  const grid = document.getElementById('dexEquipGrid');
  const cnt  = document.getElementById('dexEquipCount');
  if(!grid) return;

  const catSel = document.getElementById('dexEquipCatSel');
  if(catSel && !catSel.dataset.filled){
    catSel.innerHTML = _equipCatOptionsHTML();
    catSel.dataset.filled = '1';
  }

  const q   = (document.getElementById('dexEquipSearch')?.value||'').toLowerCase();
  const cat = catSel?.value || '';
  const owned = G.p.equipDex || {};

  let ids = cat ? (EQUIP_CAT_ITEMS[cat]||[]) : Object.keys(EQUIP_ITEM_CAT);
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = Object.keys(EQUIP_ITEM_CAT).length;
  const ownedAll = Object.keys(EQUIP_ITEM_CAT).filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已解鎖 ${ownedAll} / ${totalAll}`;

  const CAT_NAME = {}; EQUIP_CATEGORIES.forEach(c => CAT_NAME[c.key]=c.name);

  grid.innerHTML = ids.map(id=>{
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexEquip('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;${v.legend?'color:var(--legend)':''};
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_NAME[EQUIP_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexEquip(id){
  if(!G.p.equipDex) G.p.equipDex={};
  if(G.p.equipDex[id]) delete G.p.equipDex[id];
  else G.p.equipDex[id]=true;
  renderDexEquip();
}


function dexUnlockAll(type){
  if(type==='equip'){
    _ensureEquipIndex();
    if(!G.p.equipDex) G.p.equipDex = {};
    const ids = Object.keys(EQUIP_ITEM_CAT);
    ids.forEach(id=>{ G.p.equipDex[id]=true; });
    renderDexEquip();
    toast(`裝備圖鑑全部解鎖（${ids.length} 件）`,'ok');
  } else if(type==='misc'){
    _ensureMiscIndex();
    if(!G.p.miscDex) G.p.miscDex = {};
    MISC_DEX_ALL_IDS.forEach(id=>{ G.p.miscDex[id]=true; });
    renderDexMisc();
    toast(`道具圖鑑全部解鎖（${MISC_DEX_ALL_IDS.length} 件）`,'ok');
  } else if(type==='relic'){
    _ensureRelicIndex();
    if(!G.p.relicDex) G.p.relicDex = {};
    const ids = Object.keys(RELIC_ITEM_CAT);
    ids.forEach(id=>{ G.p.relicDex[id]=true; });
    renderDexRelic();
    toast(`遺物圖鑑全部解鎖（${ids.length} 件）`,'ok');
  } else {
    const cnt = parseInt(document.getElementById('dexCardCntSel')?.value)||100;
    CARD_DEX_LIST.forEach(m=>{ G.p.cardDex[m.n]=cnt; });
    renderDexCard();
    toast(`卡片圖鑑全部解鎖（數量 ${cnt}）`,'ok');
  }
}

function dexClearAll(type){
  if(!confirm('確定清除全部圖鑑？')) return;
  if(type==='equip'){
    G.p.equipDex={};
    renderDexEquip();
    toast('裝備圖鑑已全部清除','info');
  } else if(type==='misc'){
    G.p.miscDex={};
    renderDexMisc();
    toast('道具圖鑑已全部清除','info');
  } else if(type==='relic'){
    G.p.relicDex={};
    renderDexRelic();
    toast('遺物圖鑑已全部清除','info');
  } else {
    G.p.cardDex={};
    renderDexCard();
    toast('卡片圖鑑已全部清除','info');
  }
}

// ── 卡片圖鑑（怪物收集冊）
// 完整重建自 15-cards.js 的 buildCardIndex() 邏輯（掃描 CARD_REGIONS 對應地圖池 × DB.mobs，
// 排除 血盟／建築 標籤），共 409 隻卡片收集對象，非原本手動節錄的 73 隻。
const CARD_DEX_LIST = [
  {
    "n": "藏寶箱",
    "lv": 1
  },
  {
    "n": "妖魔",
    "lv": 2
  },
  {
    "n": "哥布林",
    "lv": 2
  },
  {
    "n": "地靈",
    "lv": 3
  },
  {
    "n": "污染的地精靈",
    "lv": 3
  },
  {
    "n": "妖魔弓箭手",
    "lv": 3
  },
  {
    "n": "狼",
    "lv": 4
  },
  {
    "n": "蘑菇",
    "lv": 4
  },
  {
    "n": "小獵犬",
    "lv": 5
  },
  {
    "n": "老虎",
    "lv": 5
  },
  {
    "n": "侏儒",
    "lv": 5
  },
  {
    "n": "牧羊犬",
    "lv": 5
  },
  {
    "n": "狐狸",
    "lv": 5
  },
  {
    "n": "哈士奇",
    "lv": 5
  },
  {
    "n": "柯利",
    "lv": 5
  },
  {
    "n": "浣熊",
    "lv": 5
  },
  {
    "n": "高麗幼犬",
    "lv": 5
  },
  {
    "n": "袋鼠",
    "lv": 5
  },
  {
    "n": "猴子",
    "lv": 5
  },
  {
    "n": "聖伯納犬",
    "lv": 5
  },
  {
    "n": "熊",
    "lv": 5
  },
  {
    "n": "熊貓",
    "lv": 5
  },
  {
    "n": "暴走兔",
    "lv": 5
  },
  {
    "n": "貓",
    "lv": 5
  },
  {
    "n": "人形殭屍",
    "lv": 6
  },
  {
    "n": "安普長老",
    "lv": 6
  },
  {
    "n": "污染的安特",
    "lv": 6
  },
  {
    "n": "杜賓狗",
    "lv": 6
  },
  {
    "n": "漂浮之眼",
    "lv": 7
  },
  {
    "n": "冰原狼人",
    "lv": 8
  },
  {
    "n": "妖魔鬥士",
    "lv": 8
  },
  {
    "n": "怪手",
    "lv": 8
  },
  {
    "n": "侏儒戰士",
    "lv": 9
  },
  {
    "n": "狼人",
    "lv": 9
  },
  {
    "n": "甘地妖魔",
    "lv": 10
  },
  {
    "n": "冰之女王侍女",
    "lv": 10
  },
  {
    "n": "污染的潘",
    "lv": 10
  },
  {
    "n": "妖魔殭屍",
    "lv": 10
  },
  {
    "n": "骷髏",
    "lv": 10
  },
  {
    "n": "鱷魚",
    "lv": 10
  },
  {
    "n": "巨蟻",
    "lv": 12
  },
  {
    "n": "妖魔法師",
    "lv": 12
  },
  {
    "n": "骷髏弓箭手",
    "lv": 12
  },
  {
    "n": "蟑螂人",
    "lv": 12
  },
  {
    "n": "石頭高崙",
    "lv": 13
  },
  {
    "n": "骷髏斧手",
    "lv": 13
  },
  {
    "n": "骷髏槍兵",
    "lv": 13
  },
  {
    "n": "羅孚妖魔",
    "lv": 13
  },
  {
    "n": "妖魔巡守",
    "lv": 14
  },
  {
    "n": "哈柏哥布林",
    "lv": 14
  },
  {
    "n": "夏洛伯",
    "lv": 14
  },
  {
    "n": "穴居人",
    "lv": 15
  },
  {
    "n": "阿吐巴妖魔",
    "lv": 15
  },
  {
    "n": "都達瑪拉妖魔",
    "lv": 15
  },
  {
    "n": "蜥蜴人",
    "lv": 15
  },
  {
    "n": "歐熊",
    "lv": 15
  },
  {
    "n": "人魚",
    "lv": 16
  },
  {
    "n": "史巴托",
    "lv": 16
  },
  {
    "n": "食屍鬼",
    "lv": 16
  },
  {
    "n": "黑騎士",
    "lv": 16
  },
  {
    "n": "黑騎士搜索隊",
    "lv": 16
  },
  {
    "n": "鯊魚",
    "lv": 16
  },
  {
    "n": "那魯加妖魔",
    "lv": 17
  },
  {
    "n": "萊肯",
    "lv": 17
  },
  {
    "n": "狂野之毒",
    "lv": 18
  },
  {
    "n": "狂野毒牙",
    "lv": 18
  },
  {
    "n": "楊果里恩",
    "lv": 18
  },
  {
    "n": "蟹人",
    "lv": 18
  },
  {
    "n": "歐姆",
    "lv": 19
  },
  {
    "n": "巨大兵蟻",
    "lv": 20
  },
  {
    "n": "狂野之魔",
    "lv": 20
  },
  {
    "n": "狂暴蜥蜴人",
    "lv": 20
  },
  {
    "n": "海星",
    "lv": 20
  },
  {
    "n": "鼠人",
    "lv": 20
  },
  {
    "n": "卡司特",
    "lv": 21
  },
  {
    "n": "狂暴的歐姆",
    "lv": 21
  },
  {
    "n": "長老",
    "lv": 21
  },
  {
    "n": "食人妖精",
    "lv": 22
  },
  {
    "n": "蛇女",
    "lv": 22
  },
  {
    "n": "魔蝙蝠",
    "lv": 22
  },
  {
    "n": "底比斯 曼陀羅草(白)",
    "lv": 23
  },
  {
    "n": "提卡爾艾庫阿茲特",
    "lv": 23
  },
  {
    "n": "歐姆裝甲兵",
    "lv": 23
  },
  {
    "n": "地獄犬",
    "lv": 24
  },
  {
    "n": "希爾黛斯",
    "lv": 24
  },
  {
    "n": "重裝蜥蜴人",
    "lv": 24
  },
  {
    "n": "龍龜",
    "lv": 24
  },
  {
    "n": "藍尾蜥蜴",
    "lv": 24
  },
  {
    "n": "犰狳",
    "lv": 25
  },
  {
    "n": "白螞蟻群",
    "lv": 25
  },
  {
    "n": "狂暴的歐姆裝甲兵",
    "lv": 25
  },
  {
    "n": "奇異鸚鵡",
    "lv": 25
  },
  {
    "n": "海賊骷髏",
    "lv": 25
  },
  {
    "n": "高等蜥蜴人",
    "lv": 25
  },
  {
    "n": "闇之精靈",
    "lv": 25
  },
  {
    "n": "底比斯 曼陀羅草",
    "lv": 26
  },
  {
    "n": "哈維",
    "lv": 26
  },
  {
    "n": "毒蠍",
    "lv": 26
  },
  {
    "n": "提卡爾艾庫阿茲特(黃)",
    "lv": 26
  },
  {
    "n": "黑暗妖精魔法學徒",
    "lv": 26
  },
  {
    "n": "歐姆民兵",
    "lv": 26
  },
  {
    "n": "魔熊",
    "lv": 26
  },
  {
    "n": "黑暗妖精殘兵(弓)",
    "lv": 27
  },
  {
    "n": "黑暗精靈",
    "lv": 27
  },
  {
    "n": "骷髏神射手",
    "lv": 27
  },
  {
    "n": "骷髏警衛",
    "lv": 27
  },
  {
    "n": "巨大白螞蟻",
    "lv": 28
  },
  {
    "n": "伊萊克頓",
    "lv": 28
  },
  {
    "n": "多羅",
    "lv": 28
  },
  {
    "n": "海賊骷髏士兵",
    "lv": 28
  },
  {
    "n": "紙人",
    "lv": 28
  },
  {
    "n": "強盜",
    "lv": 28
  },
  {
    "n": "雪人",
    "lv": 28
  },
  {
    "n": "黑暗妖精盜賊",
    "lv": 28
  },
  {
    "n": "歐吉",
    "lv": 28
  },
  {
    "n": "闇精靈王",
    "lv": 28
  },
  {
    "n": "底比斯 聖甲蟲",
    "lv": 29
  },
  {
    "n": "奎斯坦修",
    "lv": 29
  },
  {
    "n": "提卡爾艾庫尤卡(藍)",
    "lv": 29
  },
  {
    "n": "黑暗妖精殘兵(十字弓)",
    "lv": 29
  },
  {
    "n": "黑暗妖精殘兵(劍)",
    "lv": 29
  },
  {
    "n": "骷髏鬥士",
    "lv": 29
  },
  {
    "n": "爆彈花",
    "lv": 29
  },
  {
    "n": "巨人",
    "lv": 30
  },
  {
    "n": "冰人",
    "lv": 30
  },
  {
    "n": "艾爾摩士兵",
    "lv": 30
  },
  {
    "n": "金屬蜈蚣",
    "lv": 30
  },
  {
    "n": "食人妖精王",
    "lv": 30
  },
  {
    "n": "莫妮亞",
    "lv": 30
  },
  {
    "n": "喚獸師",
    "lv": 30
  },
  {
    "n": "黑暗妖精殘兵(法師)",
    "lv": 30
  },
  {
    "n": "夢幻之島鬼火",
    "lv": 30
  },
  {
    "n": "夢幻之島蘑菇",
    "lv": 30
  },
  {
    "n": "艾爾摩法師",
    "lv": 31
  },
  {
    "n": "格利芬",
    "lv": 31
  },
  {
    "n": "密密",
    "lv": 31
  },
  {
    "n": "強化巨蟻",
    "lv": 31
  },
  {
    "n": "巨大鱷魚",
    "lv": 32
  },
  {
    "n": "冰石高崙",
    "lv": 32
  },
  {
    "n": "底比斯 聖甲蟲(藍)",
    "lv": 32
  },
  {
    "n": "海賊骷髏刀手",
    "lv": 32
  },
  {
    "n": "海賊骷髏首領",
    "lv": 32
  },
  {
    "n": "提卡爾艾庫尤卡(白)",
    "lv": 32
  },
  {
    "n": "黑法師",
    "lv": 32
  },
  {
    "n": "變種蛇女",
    "lv": 32
  },
  {
    "n": "卡司特王",
    "lv": 33
  },
  {
    "n": "巨人長老",
    "lv": 33
  },
  {
    "n": "巨人戰士",
    "lv": 33
  },
  {
    "n": "冰原老虎",
    "lv": 33
  },
  {
    "n": "多眼怪",
    "lv": 33
  },
  {
    "n": "活鎧甲",
    "lv": 33
  },
  {
    "n": "雪怪",
    "lv": 33
  },
  {
    "n": "黑暗妖精殘兵(雙手劍)",
    "lv": 33
  },
  {
    "n": "黑暗棲林者",
    "lv": 33
  },
  {
    "n": "龍蠅",
    "lv": 33
  },
  {
    "n": "變形怪",
    "lv": 33
  },
  {
    "n": "變種楊果里恩",
    "lv": 33
  },
  {
    "n": "亞力安",
    "lv": 34
  },
  {
    "n": "強化白螞蟻群",
    "lv": 34
  },
  {
    "n": "火焰戰士",
    "lv": 35
  },
  {
    "n": "艾爾摩將軍",
    "lv": 35
  },
  {
    "n": "底比斯 凱比斯(黑)",
    "lv": 35
  },
  {
    "n": "阿魯巴",
    "lv": 35
  },
  {
    "n": "強盜頭目",
    "lv": 35
  },
  {
    "n": "提卡爾艾庫卡伊拉(藍)",
    "lv": 35
  },
  {
    "n": "鋼鐵高崙",
    "lv": 35
  },
  {
    "n": "火焰弓箭手",
    "lv": 36
  },
  {
    "n": "邪惡蜥蜴",
    "lv": 36
  },
  {
    "n": "梅杜莎",
    "lv": 36
  },
  {
    "n": "黑暗妖精警衛(十字弓)",
    "lv": 36
  },
  {
    "n": "巨大突擊螞蟻",
    "lv": 37
  },
  {
    "n": "死亡之劍",
    "lv": 37
  },
  {
    "n": "炎魔的思克巴",
    "lv": 37
  },
  {
    "n": "思克巴",
    "lv": 37
  },
  {
    "n": "恐怖的火炎蛋",
    "lv": 37
  },
  {
    "n": "火蜥蜴",
    "lv": 38
  },
  {
    "n": "邪惡密密",
    "lv": 38
  },
  {
    "n": "黑暗妖精士兵",
    "lv": 38
  },
  {
    "n": "黑暗妖精巡守",
    "lv": 38
  },
  {
    "n": "夢幻之島火蜥蜴",
    "lv": 38
  },
  {
    "n": "夢幻之島冰人",
    "lv": 38
  },
  {
    "n": "夢幻之島殺人蜂",
    "lv": 38
  },
  {
    "n": "夢幻之島暴走兔",
    "lv": 38
  },
  {
    "n": "火炎蛋",
    "lv": 39
  },
  {
    "n": "邪惡多眼怪",
    "lv": 39
  },
  {
    "n": "奇美拉",
    "lv": 39
  },
  {
    "n": "底比斯 凱比斯(紅)",
    "lv": 39
  },
  {
    "n": "提卡爾艾庫卡伊拉(黃)",
    "lv": 39
  },
  {
    "n": "殘暴的骷髏斧兵",
    "lv": 39
  },
  {
    "n": "殘暴的骷髏槍兵",
    "lv": 39
  },
  {
    "n": "夢幻之島火炎蛋",
    "lv": 39
  },
  {
    "n": "夢幻之島冰石高崙",
    "lv": 39
  },
  {
    "n": "夢幻之島閃電球",
    "lv": 39
  },
  {
    "n": "夢幻之島鎧甲守衛",
    "lv": 39
  },
  {
    "n": "水之牙",
    "lv": 40
  },
  {
    "n": "火之牙",
    "lv": 40
  },
  {
    "n": "巨大強化白螞蟻",
    "lv": 40
  },
  {
    "n": "地之牙",
    "lv": 40
  },
  {
    "n": "地獄束縛犬",
    "lv": 40
  },
  {
    "n": "拉斯塔巴德守門人",
    "lv": 40
  },
  {
    "n": "風之牙",
    "lv": 40
  },
  {
    "n": "恐怖夢魘",
    "lv": 40
  },
  {
    "n": "黑虎",
    "lv": 40
  },
  {
    "n": "黑暗妖精法師",
    "lv": 40
  },
  {
    "n": "黑暗妖精警衛(矛)",
    "lv": 40
  },
  {
    "n": "馴獸師",
    "lv": 40
  },
  {
    "n": "夢幻之島大鬼火",
    "lv": 40
  },
  {
    "n": "夢魘",
    "lv": 40
  },
  {
    "n": "獨眼巨人",
    "lv": 40
  },
  {
    "n": "魔狼",
    "lv": 40
  },
  {
    "n": "底比斯 尖碑石奴",
    "lv": 41
  },
  {
    "n": "炎魔的思克巴女皇",
    "lv": 41
  },
  {
    "n": "思克巴女皇",
    "lv": 41
  },
  {
    "n": "提卡爾艾庫巴拉",
    "lv": 41
  },
  {
    "n": "魂騎士",
    "lv": 41
  },
  {
    "n": "影魔",
    "lv": 41
  },
  {
    "n": "水元素守護者",
    "lv": 42
  },
  {
    "n": "火元素守護者",
    "lv": 42
  },
  {
    "n": "地元素守護者",
    "lv": 42
  },
  {
    "n": "西瑪",
    "lv": 42
  },
  {
    "n": "巫師",
    "lv": 42
  },
  {
    "n": "受詛咒的妖魔殭屍",
    "lv": 42
  },
  {
    "n": "拉斯塔巴德馴獸師",
    "lv": 42
  },
  {
    "n": "風元素守護者",
    "lv": 42
  },
  {
    "n": "鬼魂",
    "lv": 42
  },
  {
    "n": "殘暴的史巴托",
    "lv": 42
  },
  {
    "n": "殘暴的食屍鬼",
    "lv": 42
  },
  {
    "n": "德雷克",
    "lv": 42
  },
  {
    "n": "巴土瑟",
    "lv": 43
  },
  {
    "n": "地獄奴隸",
    "lv": 43
  },
  {
    "n": "受詛咒的馴獸師",
    "lv": 43
  },
  {
    "n": "紅鬼魂",
    "lv": 43
  },
  {
    "n": "恐怖的地獄犬",
    "lv": 43
  },
  {
    "n": "黑暗妖精將軍",
    "lv": 43
  },
  {
    "n": "夢幻之島水精靈王",
    "lv": 43
  },
  {
    "n": "夢幻之島火精靈王",
    "lv": 43
  },
  {
    "n": "夢幻之島地精靈王",
    "lv": 43
  },
  {
    "n": "夢幻之島風精靈王",
    "lv": 43
  },
  {
    "n": "熔岩高崙",
    "lv": 43
  },
  {
    "n": "獨角獸",
    "lv": 43
  },
  {
    "n": "小惡魔",
    "lv": 44
  },
  {
    "n": "火焰之魔法師",
    "lv": 44
  },
  {
    "n": "卡士柏",
    "lv": 44
  },
  {
    "n": "巨大守護螞蟻",
    "lv": 44
  },
  {
    "n": "底比斯 尖碑石奴(黑)",
    "lv": 44
  },
  {
    "n": "炎魔的小惡魔",
    "lv": 44
  },
  {
    "n": "恐怖的鋼鐵高崙",
    "lv": 44
  },
  {
    "n": "提卡爾艾庫巴拉(紅)",
    "lv": 44
  },
  {
    "n": "暗黑萊肯",
    "lv": 44
  },
  {
    "n": "水靈之主",
    "lv": 45
  },
  {
    "n": "火焰之靈魂(紅)",
    "lv": 45
  },
  {
    "n": "火靈之主",
    "lv": 45
  },
  {
    "n": "幼龍",
    "lv": 45
  },
  {
    "n": "伊弗利特",
    "lv": 45
  },
  {
    "n": "地靈之主",
    "lv": 45
  },
  {
    "n": "死神",
    "lv": 45
  },
  {
    "n": "受詛咒的艾爾摩法師",
    "lv": 45
  },
  {
    "n": "阿西塔基奧",
    "lv": 45
  },
  {
    "n": "風靈之主",
    "lv": 45
  },
  {
    "n": "馬庫爾",
    "lv": 45
  },
  {
    "n": "深淵弓箭手",
    "lv": 45
  },
  {
    "n": "深淵食屍鬼",
    "lv": 45
  },
  {
    "n": "殘暴的骷髏神射手",
    "lv": 45
  },
  {
    "n": "殘暴的骷髏鬥士",
    "lv": 45
  },
  {
    "n": "黑暗復仇者",
    "lv": 45
  },
  {
    "n": "黑暗精靈使",
    "lv": 45
  },
  {
    "n": "暗黑黑騎士",
    "lv": 45
  },
  {
    "n": "墳墓守護者",
    "lv": 45
  },
  {
    "n": "歐姆戰士",
    "lv": 45
  },
  {
    "n": "火焰之靈魂(藍)",
    "lv": 46
  },
  {
    "n": "火焰烈炎獸",
    "lv": 46
  },
  {
    "n": "血色術士",
    "lv": 46
  },
  {
    "n": "恐怖的伊弗利特",
    "lv": 46
  },
  {
    "n": "血騎士",
    "lv": 47
  },
  {
    "n": "受詛咒的艾爾摩士兵",
    "lv": 47
  },
  {
    "n": "底比斯 斯芬克斯",
    "lv": 47
  },
  {
    "n": "骨龍",
    "lv": 47
  },
  {
    "n": "提卡爾艾庫艾托",
    "lv": 47
  },
  {
    "n": "闇黑君王",
    "lv": 47
  },
  {
    "n": "冷酷冰原老虎",
    "lv": 48
  },
  {
    "n": "拉斯塔巴德近衛隊",
    "lv": 48
  },
  {
    "n": "重裝歐姆戰士",
    "lv": 48
  },
  {
    "n": "飛龍",
    "lv": 48
  },
  {
    "n": "烈炎獸",
    "lv": 48
  },
  {
    "n": "暗黑火焰弓箭手",
    "lv": 48
  },
  {
    "n": "墳墓守護者法師",
    "lv": 48
  },
  {
    "n": "西斯",
    "lv": 50
  },
  {
    "n": "受詛咒的艾爾摩將軍",
    "lv": 50
  },
  {
    "n": "底比斯 尼荷斯",
    "lv": 50
  },
  {
    "n": "底比斯 斯芬克斯(黑)",
    "lv": 50
  },
  {
    "n": "曼波兔",
    "lv": 50
  },
  {
    "n": "提卡爾艾庫艾托(枯竭)",
    "lv": 50
  },
  {
    "n": "提卡爾薩德泥偶",
    "lv": 50
  },
  {
    "n": "象牙塔石頭高崙",
    "lv": 50
  },
  {
    "n": "象牙塔紙人",
    "lv": 50
  },
  {
    "n": "象牙塔密密",
    "lv": 50
  },
  {
    "n": "黑長者",
    "lv": 50
  },
  {
    "n": "暗黑火焰戰士",
    "lv": 50
  },
  {
    "n": "墳墓守護者騎士",
    "lv": 50
  },
  {
    "n": "火焰阿西塔基奧",
    "lv": 51
  },
  {
    "n": "卡魯塔",
    "lv": 51
  },
  {
    "n": "炎魔的巴風特",
    "lv": 51
  },
  {
    "n": "長老隨從",
    "lv": 51
  },
  {
    "n": "象牙塔鋼鐵高崙",
    "lv": 51
  },
  {
    "n": "墮落的司祭(一階)",
    "lv": 51
  },
  {
    "n": "墮落的司祭(二階)",
    "lv": 51
  },
  {
    "n": "死亡的司祭(思克巴)",
    "lv": 52
  },
  {
    "n": "底比斯 尼荷斯(藍)",
    "lv": 52
  },
  {
    "n": "混沌的司祭(飛翼)",
    "lv": 52
  },
  {
    "n": "提卡爾薩德泥偶(黑)",
    "lv": 52
  },
  {
    "n": "象牙塔果凍怪",
    "lv": 52
  },
  {
    "n": "炎魔的巴列斯",
    "lv": 53
  },
  {
    "n": "象牙塔活鎧甲",
    "lv": 53
  },
  {
    "n": "傲慢的潔尼斯女王",
    "lv": 53
  },
  {
    "n": "暗黑思克巴女皇",
    "lv": 53
  },
  {
    "n": "墮落的司祭(三階)",
    "lv": 53
  },
  {
    "n": "小幻象眼魔",
    "lv": 54
  },
  {
    "n": "底比斯 阿努斯",
    "lv": 54
  },
  {
    "n": "拉斯塔巴德近衛隊隊長",
    "lv": 54
  },
  {
    "n": "提卡爾薩德司卡(紫)",
    "lv": 54
  },
  {
    "n": "墮落的司祭(四階)",
    "lv": 54
  },
  {
    "n": "死亡的司祭(巴風特)",
    "lv": 55
  },
  {
    "n": "艾莉絲",
    "lv": 55
  },
  {
    "n": "恐怖的殭屍王",
    "lv": 55
  },
  {
    "n": "深淵水靈",
    "lv": 55
  },
  {
    "n": "深淵火靈",
    "lv": 55
  },
  {
    "n": "深淵地靈",
    "lv": 55
  },
  {
    "n": "深淵風靈",
    "lv": 55
  },
  {
    "n": "混沌的司祭(野獸)",
    "lv": 55
  },
  {
    "n": "象牙塔死亡之劍",
    "lv": 55
  },
  {
    "n": "象牙塔奇美拉",
    "lv": 55
  },
  {
    "n": "象牙塔長者",
    "lv": 55
  },
  {
    "n": "象牙塔閃電球",
    "lv": 55
  },
  {
    "n": "巨大墳墓守護者",
    "lv": 56
  },
  {
    "n": "底比斯 阿努斯(黑)",
    "lv": 56
  },
  {
    "n": "馬昆斯吸血鬼",
    "lv": 56
  },
  {
    "n": "提卡爾薩德司卡(紅)",
    "lv": 56
  },
  {
    "n": "象牙塔蛇女",
    "lv": 56
  },
  {
    "n": "墮落的司祭(五階)",
    "lv": 56
  },
  {
    "n": "炎魔的分身",
    "lv": 57
  },
  {
    "n": "象牙塔黑長者",
    "lv": 57
  },
  {
    "n": "木乃伊王",
    "lv": 58
  },
  {
    "n": "底比斯 巴斯",
    "lv": 58
  },
  {
    "n": "提卡爾薩德提歐(藍)",
    "lv": 58
  },
  {
    "n": "象牙塔死神",
    "lv": 58
  },
  {
    "n": "象牙塔黑魔法師",
    "lv": 58
  },
  {
    "n": "象牙塔影魔",
    "lv": 58
  },
  {
    "n": "象牙塔炎魔的奴隸",
    "lv": 59
  },
  {
    "n": "象牙塔惡靈",
    "lv": 59
  },
  {
    "n": "土精靈王",
    "lv": 60
  },
  {
    "n": "不幸的幻象眼魔",
    "lv": 60
  },
  {
    "n": "水精靈王",
    "lv": 60
  },
  {
    "n": "火精靈王",
    "lv": 60
  },
  {
    "n": "扭曲的潔尼斯女王",
    "lv": 60
  },
  {
    "n": "底比斯 巴斯(紅)",
    "lv": 60
  },
  {
    "n": "哈汀之影",
    "lv": 60
  },
  {
    "n": "風精靈王",
    "lv": 60
  },
  {
    "n": "恐怖的吸血鬼",
    "lv": 60
  },
  {
    "n": "提卡爾薩德提歐(黃)",
    "lv": 60
  },
  {
    "n": "象牙塔小惡魔",
    "lv": 60
  },
  {
    "n": "象牙塔巴列斯之影",
    "lv": 60
  },
  {
    "n": "騎士范德",
    "lv": 60
  },
  {
    "n": "巴風特",
    "lv": 61
  },
  {
    "n": "炎魔的惡魔",
    "lv": 61
  },
  {
    "n": "象牙塔翼魔",
    "lv": 61
  },
  {
    "n": "暗殺軍王史雷佛",
    "lv": 61
  },
  {
    "n": "死亡的殭屍王",
    "lv": 62
  },
  {
    "n": "象牙塔巴風特之影",
    "lv": 62
  },
  {
    "n": "象牙塔炎魔之影",
    "lv": 63
  },
  {
    "n": "象牙塔惡魔之影",
    "lv": 63
  },
  {
    "n": "魔獸軍王巴蘭卡",
    "lv": 63
  },
  {
    "n": "不死的木乃伊王",
    "lv": 65
  },
  {
    "n": "火焰之影親衛隊(巴風特)",
    "lv": 65
  },
  {
    "n": "地獄的黑豹",
    "lv": 65
  },
  {
    "n": "克特",
    "lv": 65
  },
  {
    "n": "冷酷的艾莉絲",
    "lv": 65
  },
  {
    "n": "法令軍王蕾雅",
    "lv": 65
  },
  {
    "n": "深淵之主",
    "lv": 65
  },
  {
    "n": "變形怪首領",
    "lv": 65
  },
  {
    "n": "墮落",
    "lv": 68
  },
  {
    "n": "不死鳥",
    "lv": 69
  },
  {
    "n": "巴列斯",
    "lv": 70
  },
  {
    "n": "古代巨人",
    "lv": 70
  },
  {
    "n": "巨蟻女皇",
    "lv": 70
  },
  {
    "n": "冰魔",
    "lv": 70
  },
  {
    "n": "死亡",
    "lv": 70
  },
  {
    "n": "底比斯 阿努比斯",
    "lv": 70
  },
  {
    "n": "底比斯 賀洛斯",
    "lv": 70
  },
  {
    "n": "冥法軍王海露拜",
    "lv": 70
  },
  {
    "n": "混沌",
    "lv": 70
  },
  {
    "n": "惡魔",
    "lv": 70
  },
  {
    "n": "提卡爾杰弗雷庫(雄)",
    "lv": 70
  },
  {
    "n": "提卡爾杰弗雷庫(雌)",
    "lv": 70
  },
  {
    "n": "冰之女王",
    "lv": 75
  },
  {
    "n": "死亡騎士",
    "lv": 75
  },
  {
    "n": "闇黑的騎士范德",
    "lv": 75
  },
  {
    "n": "長老．琪娜",
    "lv": 78
  },
  {
    "n": "不滅的巫妖",
    "lv": 80
  },
  {
    "n": "邪惡的鐮刀死神",
    "lv": 80
  },
  {
    "n": "長老．艾迪爾",
    "lv": 80
  },
  {
    "n": "長老．巴塔斯",
    "lv": 85
  },
  {
    "n": "長老．巴洛斯",
    "lv": 88
  },
  {
    "n": "長老．泰瑪斯",
    "lv": 90
  },
  {
    "n": "長老．安迪斯",
    "lv": 91
  },
  {
    "n": "安塔瑞斯",
    "lv": 93
  },
  {
    "n": "法利昂",
    "lv": 93
  },
  {
    "n": "長老．拉曼斯",
    "lv": 93
  },
  {
    "n": "巴拉卡斯",
    "lv": 95
  },
  {
    "n": "長老．巴陸德",
    "lv": 96
  },
  {
    "n": "遺忘之島蜥蜴人",
    "lv": 20
  },
  {
    "n": "遺忘之島鱷魚",
    "lv": 20
  },
  {
    "n": "遺忘之島夏洛伯",
    "lv": 34
  },
  {
    "n": "遺忘之島狼人",
    "lv": 34
  },
  {
    "n": "遺忘之島黑暗精靈",
    "lv": 35
  },
  {
    "n": "遺忘之島歐熊",
    "lv": 35
  },
  {
    "n": "遺忘之島卡司特",
    "lv": 36
  },
  {
    "n": "遺忘之島巨斧牛人",
    "lv": 37
  },
  {
    "n": "遺忘之島食人妖精",
    "lv": 37
  },
  {
    "n": "遺忘之島蛇女",
    "lv": 37
  },
  {
    "n": "遺忘之島萊肯",
    "lv": 37
  },
  {
    "n": "遺忘之島楊果里恩",
    "lv": 38
  },
  {
    "n": "遺忘之島哈維",
    "lv": 41
  },
  {
    "n": "遺忘之島格利芬",
    "lv": 41
  },
  {
    "n": "遺忘之島鏈鎚牛人",
    "lv": 41
  },
  {
    "n": "遺忘之島卡司特王",
    "lv": 42
  },
  {
    "n": "遺忘之島巨大鱷魚",
    "lv": 42
  },
  {
    "n": "遺忘之島變形怪",
    "lv": 42
  },
  {
    "n": "遺忘之島多羅",
    "lv": 43
  },
  {
    "n": "遺忘之島阿魯巴",
    "lv": 45
  },
  {
    "n": "遺忘之島食人妖精王",
    "lv": 45
  },
  {
    "n": "受詛咒的黑暗妖精鬥士",
    "lv": 46
  },
  {
    "n": "遺忘之島亞力安",
    "lv": 47
  },
  {
    "n": "地獄奴隸",
    "lv": 48
  },
  {
    "n": "受詛咒的黑暗妖精法師",
    "lv": 48
  },
  {
    "n": "遺忘之島邪惡蜥蜴",
    "lv": 48
  },
  {
    "n": "牛鬼之子",
    "lv": 50
  },
  {
    "n": "受詛咒的黑暗妖精騎士",
    "lv": 50
  },
  {
    "n": "食腐獸",
    "lv": 50
  },
  {
    "n": "遺忘之島獨眼巨人",
    "lv": 50
  },
  {
    "n": "特提斯",
    "lv": 52
  },
  {
    "n": "遺忘之島巨大牛人",
    "lv": 53
  },
  {
    "n": "遺忘之島飛龍",
    "lv": 53
  },
  {
    "n": "翼龍",
    "lv": 54
  },
  {
    "n": "嗚釜",
    "lv": 65
  },
  {
    "n": "鎌鼬",
    "lv": 65
  },
  {
    "n": "唐傘小僧",
    "lv": 68
  },
  {
    "n": "轆轤首",
    "lv": 68
  },
  {
    "n": "赤鬼",
    "lv": 70
  },
  {
    "n": "河童",
    "lv": 70
  },
  {
    "n": "青鬼",
    "lv": 70
  },
  {
    "n": "憤怒的嗚釜",
    "lv": 70
  },
  {
    "n": "鎌鼬長兄",
    "lv": 70
  },
  {
    "n": "天狗",
    "lv": 72
  },
  {
    "n": "阿修羅像",
    "lv": 72
  },
  {
    "n": "鵺",
    "lv": 72
  },
  {
    "n": "白面金毛九尾狐・玉藻",
    "lv": 75
  },
  {
    "n": "牛鬼",
    "lv": 90
  },
  {
    "n": "巨大骷髏",
    "lv": 99
  },
  {
    "n": "吉爾塔斯",
    "lv": 99
  },
  {
    "n": "真‧死亡騎士 冥皇丹特斯",
    "lv": 99
  },
  {
    "n": "喀瑪南",
    "lv": 53
  },
  {
    "n": "喀瑪焰",
    "lv": 53
  },
  {
    "n": "大地荒龍",
    "lv": 62
  },
  {
    "n": "喀瑪南王",
    "lv": 62
  },
  {
    "n": "喀瑪焰王",
    "lv": 62
  },
  {
    "n": "喀瑪王",
    "lv": 70
  },
  {
    "n": "白面金毛九尾狐・九尾",
    "lv": 75
  },
  {
    "n": "白面金毛九尾狐・殺生石",
    "lv": 80
  },
  {
    "n": "被侵蝕的安塔瑞斯",
    "lv": 85
  },
  {
    "n": "林德拜爾",
    "lv": 90
  }
];;;;;

function _cardTierInfo(score){
  score = score || 0;
  if(score >= 100) return {label:'金卡（已開通）', cls:'tier-gold'};
  if(score >= 10)  return {label:'銀卡', cls:'tier-silver'};
  if(score >= 1)   return {label:'普卡', cls:'tier-bronze'};
  return {label:'未收集', cls:''};
}

function renderDexCard(){
  const grid = document.getElementById('dexCardGrid');
  const cnt  = document.getElementById('dexCardCount');
  if(!grid) return;
  const q     = (document.getElementById('dexCardSearch')?.value||'').toLowerCase();
  const owned = G.p.cardDex || {};
  const items = CARD_DEX_LIST.filter(m=>!q||m.n.toLowerCase().includes(q));

  const ownedNames = Object.keys(owned).filter(n=>owned[n]>0);
  const goldCnt   = ownedNames.filter(n=>owned[n]>=100).length;
  const silverCnt = ownedNames.filter(n=>owned[n]>=10 && owned[n]<100).length;
  const bronzeCnt = ownedNames.filter(n=>owned[n]>=1  && owned[n]<10).length;
  if(cnt) cnt.textContent =
    `已收錄 ${ownedNames.length} / ${CARD_DEX_LIST.length}　（金 ${goldCnt}／銀 ${silverCnt}／普 ${bronzeCnt}）`;

  grid.innerHTML = items.map(m=>{
    const score = owned[m.n] || 0;
    const tier  = _cardTierInfo(score);
    const safeName = m.n.replace(/'/g,"\\'");
    return `
    <div class="dex-item ${score>0?'owned':''} ${tier.cls}">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${m.n}">
          ${m.n}
        </div>
        <div style="font-size:10px;color:var(--text3)">Lv.${m.lv}　${tier.label}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end;flex-shrink:0">
        <input type="number" class="dex-card-score" min="0" max="100"
               value="${score||''}" placeholder="0"
               onchange="setDexCardScore('${safeName}', this.value)">
        <div style="display:flex;gap:2px">
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',1)">普</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',10)">銀</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',100)">金</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function setDexCardScore(name, val){
  if(!G.p.cardDex) G.p.cardDex={};
  let n = Math.max(0, Math.min(100, parseInt(val)||0));
  if(n > 0) G.p.cardDex[name] = n;
  else delete G.p.cardDex[name];
  renderDexCard();
}

// ── 道具圖鑑（miscDex）── 分類邏輯比照 18-misc-book.js 的 miscCatKey()
const MISC_CATEGORIES = [
  {
    "key": "pot",
    "name": "藥水"
  },
  {
    "key": "scroll",
    "name": "卷軸"
  },
  {
    "key": "skillbk",
    "name": "技能書"
  },
  {
    "key": "mat",
    "name": "材料"
  },
  {
    "key": "special",
    "name": "其他"
  }
];;
const MISC_BOOK_EXCLUDED = {
  new_item_bless_wpn: true, new_item_bless_arm: true, new_item_bless_acc: true,
};
function miscCatKey(id, d){
  if(!d) return null;
  if(MISC_BOOK_EXCLUDED[id]) return null;
  const t = d.type;
  if(t === 'wpn' || t === 'arm' || t === 'acc') return null;
  if(id === 'item_card_book' || id === 'item_equip_book') return null;
  if(d.eff === 'card' || id.indexOf('card_') === 0) return null;
  if(t === 'pot' || id.indexOf('potion_') === 0) return 'pot';
  if(t === 'scroll' || id.indexOf('scroll_') === 0 || (d.n && d.n.indexOf('卷軸') >= 0)) return 'scroll';
  if(t === 'skillbk' || id.indexOf('bk_') === 0 || id.indexOf('mem_') === 0) return 'skillbk';
  if(t === 'etc' || id.indexOf('mat_') === 0 || id.indexOf('new_item_') === 0) return 'mat';
  return 'special';
}
const MISC_CAT_ITEMS = {};
const MISC_ITEM_CAT  = {};
let MISC_DEX_ALL_IDS = [];
let _miscIndexBuilt = false;
function _ensureMiscIndex(){
  if(_miscIndexBuilt) return;
  _miscIndexBuilt = true;
  MISC_CATEGORIES.forEach(c => MISC_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    const ck = miscCatKey(id, d);
    if(!ck || !MISC_CAT_ITEMS[ck]) return;
    MISC_CAT_ITEMS[ck].push(id);
    MISC_ITEM_CAT[id] = ck;
  });
  Object.keys(MISC_CAT_ITEMS).forEach(k => {
    MISC_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
  MISC_DEX_ALL_IDS = Object.keys(MISC_ITEM_CAT);
}

function renderDexMisc(){
  _ensureMiscIndex();
  const grid = document.getElementById('dexMiscGrid');
  const cnt  = document.getElementById('dexMiscCount');
  if(!grid) return;
  const q   = (document.getElementById('dexMiscSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('dexMiscCatSel')?.value || '';
  const owned = G.p.miscDex || {};

  let ids = cat ? (MISC_CAT_ITEMS[cat] || []) : MISC_DEX_ALL_IDS;
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = MISC_DEX_ALL_IDS.length;
  const ownedAll = MISC_DEX_ALL_IDS.filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已收錄 ${ownedAll} / ${totalAll}`;

  const CAT_LABEL = {}; MISC_CATEGORIES.forEach(c => CAT_LABEL[c.key] = c.name);

  grid.innerHTML = ids.map(id => {
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexMisc('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_LABEL[MISC_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexMisc(id){
  if(!G.p.miscDex) G.p.miscDex = {};
  if(G.p.miscDex[id]) delete G.p.miscDex[id];
  else G.p.miscDex[id] = true;
  renderDexMisc();
}

// ── 遺物圖鑑（relicDex）── 來源：ITEM_DB 中 relic:true 的物品，分類沿用裝備圖鑑的 EQUIP_CATEGORIES/equipCatKey（21-relic-book.js）
function isRelicItem(d){ return !!(d && d.relic); }
const RELIC_CAT_ITEMS = {};
const RELIC_ITEM_CAT  = {};
let _relicIndexBuilt = false;
function _ensureRelicIndex(){
  if(_relicIndexBuilt) return;
  _relicIndexBuilt = true;
  EQUIP_CATEGORIES.forEach(c => RELIC_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    if(!isRelicItem(d)) return;
    if(d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc') return;
    const ck = equipCatKey(id, d);
    if(!ck || !RELIC_CAT_ITEMS[ck]) return;
    RELIC_CAT_ITEMS[ck].push(id);
    RELIC_ITEM_CAT[id] = ck;
  });
  Object.keys(RELIC_CAT_ITEMS).forEach(k => {
    RELIC_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
}

function renderDexRelic(){
  _ensureRelicIndex();
  const grid = document.getElementById('dexRelicGrid');
  const cnt  = document.getElementById('dexRelicCount');
  if(!grid) return;

  const catSel = document.getElementById('dexRelicCatSel');
  if(catSel && !catSel.dataset.filled){
    catSel.innerHTML = _equipCatOptionsHTML();
    catSel.dataset.filled = '1';
  }

  const q   = (document.getElementById('dexRelicSearch')?.value || '').toLowerCase();
  const cat = catSel?.value || '';
  const owned = G.p.relicDex || {};

  let ids = cat ? (RELIC_CAT_ITEMS[cat]||[]) : Object.keys(RELIC_ITEM_CAT);
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = Object.keys(RELIC_ITEM_CAT).length;
  const ownedAll = Object.keys(RELIC_ITEM_CAT).filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已收錄 ${ownedAll} / ${totalAll}`;

  const CAT_NAME = {}; EQUIP_CATEGORIES.forEach(c => CAT_NAME[c.key]=c.name);

  grid.innerHTML = ids.map(id => {
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexRelic('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:#5ec8e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_NAME[RELIC_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexRelic(id){
  if(!G.p.relicDex) G.p.relicDex = {};
  if(G.p.relicDex[id]) delete G.p.relicDex[id];
  else G.p.relicDex[id] = true;
  renderDexRelic();
}