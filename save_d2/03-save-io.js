// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════
// 第三段：裝備面板、技能面板、授予技能、背包/倉庫邏輯。
// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════


// ════════════════════════════════════════════════
//  詞綴定義
// ════════════════════════════════════════════════
// 屬性詞綴定義（v3.0.77 屬性強化系統：4 屬性 × 5 階，只能存在於武器；對齊 08-items-equip.js）
const ATTR_AFFIX = {
  fr1: { n:'火之',     ele:'fire',  tier:1 },
  fr2: { n:'爆炎',     ele:'fire',  tier:2 },
  fr3: { n:'火靈',     ele:'fire',  tier:3 },
  fr4: { n:'赤炎',     ele:'fire',  tier:4 },
  fr5: { n:'帕格里奧', ele:'fire',  tier:5 },
  wa1: { n:'水之',     ele:'water', tier:1 },
  wa2: { n:'海嘯',     ele:'water', tier:2 },
  wa3: { n:'水靈',     ele:'water', tier:3 },
  wa4: { n:'霜凍',     ele:'water', tier:4 },
  wa5: { n:'伊娃',     ele:'water', tier:5 },
  wi1: { n:'風之',     ele:'wind',  tier:1 },
  wi2: { n:'暴風',     ele:'wind',  tier:2 },
  wi3: { n:'風靈',     ele:'wind',  tier:3 },
  wi4: { n:'蒼蘭',     ele:'wind',  tier:4 },
  wi5: { n:'沙哈',     ele:'wind',  tier:5 },
  ea1: { n:'地之',     ele:'earth', tier:1 },
  ea2: { n:'崩裂',     ele:'earth', tier:2 },
  ea3: { n:'地靈',     ele:'earth', tier:3 },
  ea4: { n:'輝岩',     ele:'earth', tier:4 },
  ea5: { n:'馬普勒',   ele:'earth', tier:5 },
};
// 舊12代碼 → 新代碼（舊存檔相容用；名稱身分不變：火之→fr1、爆炎→fr2、火靈→fr3…第4/5階為新增，無舊碼對應）
const ATTR_LEGACY = {
  fire1:'fr1', fire3:'fr2', fire5:'fr3', water1:'wa1', water3:'wa2', water5:'wa3',
  wind1:'wi1', wind3:'wi2', wind5:'wi3', earth1:'ea1', earth3:'ea2', earth5:'ea3',
};
// 正規化屬性代碼（舊碼→新碼；非法值→null）
function attrCanon(attr){
  if(typeof attr !== 'string') return null;
  const c = ATTR_LEGACY[attr] || attr;
  return ATTR_AFFIX[c] ? c : null;
}

// 🔮 屬性魔法技能池（比照遊戲 08-items-equip.js 的 ATTR_MAGIC_SKILLS）：
// 只有「第5階屬性武器」（type=wpn 且屬性詞綴為五階）才能附加對應元素的技能，
// 且技能必須跟武器的屬性詞綴同一元素才算合法（比照遊戲 getAttrMagicProc 的判斷規則）。
const ATTR_MAGIC_SKILLS = {
  fire:  ['sk_meteor','sk_fire_storm','sk_blaze','sk_fireball','sk_firearrow'],
  water: ['sk_blizzard','sk_ice_lance','sk_chill','sk_icearrow','sk_poison_curse'],
  wind:  ['sk_thunder_storm','sk_tornado','sk_thunder','sk_windblade','sk_holy_dash'],
  earth: ['sk_quake','sk_earthquake','sk_rock_prison','sk_hell_fang','sk_slow'],
};
const ATTR_MAGIC_BY_SKILL = (() => {
  const out = {};
  Object.entries(ATTR_MAGIC_SKILLS).forEach(([ele, list]) => {
    list.forEach(skId => { out[skId] = ele; });
  });
  return out;
})();
// 判斷是否為「第5階屬性裝備」：必須是可裝備物品(type=wpn/arm/acc)，且屬性詞綴的階級=5
// （函式名稱沿用舊名以相容既有呼叫處，實際已放寬至所有裝備類型，不再僅限武器）
function isTier5AttrWeapon(itemId, attr){
  const db  = (typeof ITEM_DB !== 'undefined' && ITEM_DB[itemId]) || {};
  if(!['wpn','arm','acc'].includes(db.type)) return false;
  const aff = ATTR_AFFIX[attrCanon(attr)];
  return !!(aff && aff.tier === 5);
}
// 屬性魔法下拉選單 HTML（依元素分四組；cur 有值時該選項標記 selected，供表格逐列渲染用）
function attrMagicOptHTML(cur){
  const ELE_LABEL = { fire:'火', water:'水', wind:'風', earth:'地' };
  let h = `<option value="">── 無 ──</option>`;
  Object.entries(ATTR_MAGIC_SKILLS).forEach(([ele, list]) => {
    h += `<optgroup label="${ELE_LABEL[ele]}屬性">`;
    list.forEach(skId => {
      const label = (typeof SKILL_MAP !== 'undefined' && SKILL_MAP[skId]) || skId;
      h += `<option value="${skId}" ${cur===skId?'selected':''}>${label}</option>`;
    });
    h += `</optgroup>`;
  });
  return h;
}
// 屬性魔法星級（1~3）下拉選單 HTML
function starOptHTML(cur){
  const c = Math.max(1, Math.min(3, parseInt(cur) || 1));
  let h = '';
  for(let s = 1; s <= 3; s++) h += `<option value="${s}" ${c===s?'selected':''}>${s}★</option>`;
  return h;
}
function attrMagicStillValid(itemId, attr, skId){
  if(!skId) return false;
  if(!isTier5AttrWeapon(itemId, attr)) return false;
  const aff = ATTR_AFFIX[attrCanon(attr)];
  return !!(aff && ATTR_MAGIC_BY_SKILL[skId] === aff.ele);
}
// 將存檔中殘留的舊12代碼一次性改寫為新20代碼（讀檔後呼叫，零副作用地相容舊存檔）
function canonicalizeAttrCodes(){
  function fix(obj){
    if(obj && typeof obj === 'object' && obj.attr){
      const c = attrCanon(obj.attr);
      obj.attr = c || false;
    }
  }
  function walkEq(eqObj){ if(eqObj) Object.values(eqObj).forEach(fix); }
  function walkList(list){ if(Array.isArray(list)) list.forEach(fix); }
  if(G.p){
    walkEq(G.p.eq);
    walkList(G.p.inv);
    if(Array.isArray(G.p.allies)) G.p.allies.forEach(a => { if(a){ walkEq(a.eq); walkList(a.inv); } });
  }
  if(G.wh) walkList(G.wh.items);
}

const ANC_OPTIONS = [
  { v:true,          n:'遠古'  },
  { v:'eternal',     n:'永恆'  },
  { v:'immortal',    n:'不朽'  },
  { v:'primordial',  n:'太初'  },
];

const BLESS_OPTIONS = [
  { v:true,     n:'祝福的' },
  { v:'cursed', n:'詛咒的' },
];

// ════════════════════════════════════════════════
//  裝備欄位定義
// ════════════════════════════════════════════════
const EQ_SLOTS = [
  {id:'wpn',    label:'武器'     },
  {id:'offwpn', label:'副武器（雙持）' },
  {id:'helm',   label:'頭盔'     },
  {id:'armor',  label:'盔甲'     },
  {id:'shield', label:'盾牌/臂甲'},
  {id:'cloak',  label:'披風'     },
  {id:'tshirt', label:'T恤'      },
  {id:'gloves', label:'手套'     },
  {id:'boots',  label:'靴子'     },
  {id:'ring1',  label:'戒指 1'   },
  {id:'ring2',  label:'戒指 2'   },
  {id:'ring3',  label:'戒指 3'   },
  {id:'ring4',  label:'戒指 4'   },
  {id:'amulet', label:'項鍊'     },
  {id:'ear1',   label:'耳環 1'   },
  {id:'ear2',   label:'耳環 2'   },
  {id:'belt',   label:'腰帶'     },
  {id:'arrow',  label:'箭矢'     },
  {id:'pet',    label:'寵物裝備', hidden:true },
  {id:'doll',   label:'魔法娃娃' },
  {id:'_spacer_rem', label:'', spacer:true },
  {id:'rem_claw',  label:'席琳之爪', isRemains:true },
  {id:'rem_eye',   label:'席琳之眼', isRemains:true },
  {id:'rem_blood', label:'席琳之血', isRemains:true },
  {id:'rem_flesh', label:'席琳之肉', isRemains:true },
  {id:'rem_heart', label:'席琳之心', isRemains:true },
  {id:'rem_bone',  label:'席琳之骨', isRemains:true },
  {id:'rem_fang',  label:'席琳之牙', isRemains:true },
  {id:'rem_scale', label:'席琳之鱗', isRemains:true },
  // 🔽 魔眼欄位：全遊戲目前只有「地龍之魔眼」這一件對應物品，不需要完整的ID/強化/屬性詞綴等欄位，
  // 只用一個checkbox切換「是否裝備」即可。刻意放在遺骸清單最後面，避免插在遺骸群組中間打亂那邊的顯示版位。
  {id:'eye', label:'魔眼（地龍之魔眼）', isSimpleToggle:true, fixedItemId:'acc_earth_dragon_eye' },
];

// 席琳遺骸套裝效果清單
const REM_SET_NAMES = [
  '紅獅','白鳥','鐵衛','麗人','疾風','月光','學徒','魔女','暗影','幻覺','龍血','狂怒'
];

// ════════════════════════════════════════════════
//  遺物搜尋輔助：正確裝備位置標註＋遊戲內建說明文字（僅供提醒，不鎖定裝備欄位）
// ════════════════════════════════════════════════
// 對照物品的 slot 欄位 → 人看得懂的部位名稱。注意：這只是「告訴使用者這件遺物原本設計要戴哪」，
// 搜尋結果點下去還是可以選任何欄位裝備（openEquipSlotPicker 本來就沒有限制），純資訊提示。
const RELIC_SLOT_LABEL = {
  helm:'頭盔', armor:'盔甲', shield:'盾牌/臂甲', cloak:'披風', tshirt:'T恤',
  gloves:'手套', boots:'靴子', shin:'護脛（腳脛部位）', ring:'戒指', amulet:'項鍊',
  ear:'耳環', belt:'腰帶', arrow:'箭矢', petwpn:'寵物武器', petarm:'寵物防具',
  doll:'魔法娃娃', eye:'魔眼飾品',
  rem_claw:'席琳之爪', rem_eye:'席琳之眼', rem_blood:'席琳之血', rem_flesh:'席琳之肉',
  rem_heart:'席琳之心', rem_bone:'席琳之骨', rem_fang:'席琳之牙', rem_scale:'席琳之鱗',
};
function relicSlotLabel(v){
  if (v.type === 'wpn') return '武器';
  return RELIC_SLOT_LABEL[v.slot] || (v.slot ? v.slot : '未知部位');
}
// 產生遺物專屬的資訊區塊 HTML：正確裝備位置 ＋ 遊戲內建的模糊說明（d 欄位）。非遺物回傳空字串。
// 🏺 遺物「精確效果」產生器：把資料欄位轉換成接近遊戲內顯示的機制敘述，
// 資料來源：02-stats-recompute.js（屬性彙總邏輯）／03-combat-core.js（戰鬥判定邏輯），
// 每一行都對應到原始碼裡實際讀取該欄位的地方，比 d 欄位的模糊劇情文字精確。
const ATTR_LABEL_ZH = { str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神', cha:'魅力' };
const ELE_LABEL_ZH = { fire:'火', water:'水', earth:'地', wind:'風', none:'無' };
const EFF_LABEL_ZH = { cleave:'橫掃(cleave)', crush:'重擊(crush)', pierce:'穿刺(pierce)', combo:'連段(combo)', magicstrike:'魔擊(magicstrike)', magicburst:'魔爆(magicburst)', haste:'裝備時常駐加速' };
// 🪄 法杖共鳴：這不是物品本身的資料欄位，是遊戲戰鬥程式碼(03-combat-core.js)裡硬編碼的武器ID清單，
// 裝備清單內的武器一般攻擊會額外有 智力/60 機率免費施放光箭（魔擊精通改吃力量/60）。
const WAND_RESONANCE_IDS = ['wpn_oakwand','wpn_38','wpn_witchwand','wpn_manawand','wpn_crystalwand','wpn_baless','wpn_wand_rasta','wpn_red_crystalwand','wpn_laia_wand','wpn_icequeen_wand','wpn_demon_scythe','wpn_darkmage_wand','wpn_baphomet_wand','wpn_illu_wand','wpn_demon_wand_hidden','wpn_dark_crystalball','wpn_steel_manawand_blue','relic_amp_staff','relic_elder_thunder','relic_cerberus_wand','relic_evillizard_eye','relic_lightbeam_wand','relic_warlock_grimoire','relic_windking_roar','relic_rockmage_secret','wpn_onmyoji_fan','relic_sr_kyuubi_wand','relic_water_orb','relic_unsealed_baphomet_wand','wpn_angel_wand'];
function relicMechanicLines(v, id){
  const lines = [];
  const num = (n) => (n > 0 ? '+' : '') + n;
  const pct = (n) => (n > 0 ? '+' : '') + n + '%';

  if(v.ac) lines.push(`防禦(AC): ${-v.ac}`);   // 遊戲UI把ac取負號顯示（越負防禦越好，經典Lineage系慣例）
  if(v.dmgS !== undefined || v.dmgL !== undefined) lines.push(`小型傷害: ${v.dmgS ?? 0} / 大型傷害: ${v.dmgL ?? 0}`);
  if(v.hit) lines.push(`近距離命中: ${num(v.hit)}`);
  if(v.meleeHit) lines.push(`近戰命中${num(v.meleeHit)}`);
  if(v.meleeDmg) lines.push(`近戰傷害${num(v.meleeDmg)}`);
  if(v.rangedHit) lines.push(`遠程命中${num(v.rangedHit)}`);
  if(v.rangedDmg) lines.push(`遠程傷害${num(v.rangedDmg)}`);
  if(v.extraDmg) lines.push(`額外傷害${num(v.extraDmg)}（固定值，近戰遠程皆生效）`);
  if(v.extraHit) lines.push(`額外命中${num(v.extraHit)}（近戰遠程皆生效）`);
  if(v.moveSpeedPct) lines.push(`移動速度${pct(v.moveSpeedPct)}${v.moveSpeedPct < 0 ? '（負值代表變慢，影響怪物重生延遲）' : ''}`);
  if(v.comboRate) lines.push(`連段觸發機率 ${v.comboRate}%`);
  if(v.pierceChance) lines.push(`貫穿觸發機率 ${v.pierceChance}%`);
  if(v.procInstakill) lines.push(`特效：一般攻擊命中時機率觸發即死判定${v.procInstakill.maxLv ? `（僅對Lv${v.procInstakill.maxLv}以下生效）` : ''}${v.procInstakill.healPct ? '，成功即死可回復HP' : ''}`);
  if(v.armguard) lines.push(`（此防具強化不吃AC加成，強化改為提升HP）`);
  if(v.eff && EFF_LABEL_ZH[v.eff]) lines.push(`武器特殊攻擊型態：${EFF_LABEL_ZH[v.eff]}`);
  if(v.qigu) lines.push(`（武器分類：奇古獸，搭配「奇古獸精通」攻速+30%、觸發特效無視魔抗）`);
  if(v.chainsword) lines.push(`（武器分類：鎖鏈劍）`);
  if(v.oneHand) lines.push(`（雖屬弓/雙手武器分類，但視為單手武器，可搭配盾牌/臂甲）`);
  if(v.block) lines.push(`格擋觸發機率 ${v.block}%（重擊攻擊時全額觸發，一般攻擊只有30%機率）`);
  if(v.wearerEle) lines.push(`特效：裝備者化為「${ELE_LABEL_ZH[v.wearerEle] || v.wearerEle}」屬性（受剋制此屬性的傷害增加、剋制其他屬性的傷害減少）`);
  if(v.onHitEleDmg && typeof v.onHitEleDmg === 'object'){
    const oh = v.onHitEleDmg;
    lines.push(`一般攻擊命中${oh.rate ? `${oh.rate}%機率` : '必定'}附加 ${oh.dmg} 點${ELE_LABEL_ZH[oh.ele] || oh.ele}屬性固定傷害`);
  }
  if(v.mpOnHit && !v.mpOnHitAmt) lines.push(`特效：一般攻擊命中回復魔力（固定量）`);
  if(v.set) lines.push(`套裝：${v.set}`);
  if(v.fireNullify) lines.push(`特效：完全免疫火屬性傷害（每10秒最多生效1次）`);
  if(v.dmgReflect) lines.push(`特效：受一般攻擊時 ${v.dmgReflect}% 機率反射相同傷害給攻擊者，且自身免疫該次傷害`);
  if(v.resNone) lines.push(`無屬性魔法抗性${num(v.resNone)}（比照屬性抗性公式折減，只對無屬性魔法生效）`);
  if(v.magicDrNonEle) lines.push(`無屬性魔法傷害減免${num(v.magicDrNonEle)}%（⚠️效果可能已移除，已被 v3.3.29 版本的「無屬性抗性」機制取代，此欄位目前無實際作用）`);
  if(v.stoneInstakill) lines.push(`特效：一般攻擊命中「石化」狀態敵人必定即死（頭目免疫）`);
  if(v.hardSkinMult) lines.push(`特效：目標有硬皮值時，一般攻擊傷害 ×${v.hardSkinMult}`);
  if(v.fullHpMult) lines.push(`特效：對滿血敵人，一般攻擊傷害 ×${v.fullHpMult}`);
  if(v.silencedBonusDmg) lines.push(`對「沉默」狀態敵人額外固定傷害${num(v.silencedBonusDmg)}`);
  if(v.poisonedBonusDmg) lines.push(`對「中毒」狀態敵人額外固定傷害${num(v.poisonedBonusDmg)}`);
  if(v.slowedBonusDmg) lines.push(`對「緩速」狀態敵人額外固定傷害${num(v.slowedBonusDmg)}`);
  if(v.swordStr) lines.push(`特效：持單手劍/雙手劍時，力量${num(v.swordStr)}`);
  if(v.mrPerWis) lines.push(`特效：每1點最終精神(WIS)轉換為魔防 ×${v.mrPerWis}`);
  if(v.lvDmgDiv) lines.push(`特效：近戰/遠程傷害額外 +floor(等級 ÷ ${v.lvDmgDiv})（隨等級成長）`);
  if(v.lvHitDiv) lines.push(`特效：近戰/遠程命中額外 +floor(等級 ÷ ${v.lvHitDiv})（隨等級成長）`);
  if(v.allLures) lines.push(`特效：裝備時視為持有全部誘捕狀態（寵物捕捉用，卸下即失效，不會消耗）`);
  if(v.trackBoost) lines.push(`特效：追蹤（探測）成功率提升至70%`);
  if(v.counterAllEle) lines.push(`特效：一般攻擊強制剋制地/水/火/風所有屬性敵人（傷害至少 ×1.4）`);
  if(v.hurtRapidfire) lines.push(`特效：受到傷害時強制觸發連射（需搭配弓類武器）`);
  if(v.procFireSkillRate) lines.push(`攻擊時 ${v.procFireSkillRate}% 機率施放火焰系技能`);
  if(v.hpRegenFaster) lines.push(`特效：生命自然恢復間隔縮短 ${v.hpRegenFaster} 秒（每1秒=10tick，下限3秒）`);
  if(v.noEvade) lines.push(`⚠️ 特效：自身無法迴避攻擊（暗隱術等100%迴避效果不受此限）`);
  if(v.critDmgLowHp && typeof v.critDmgLowHp === 'object') lines.push(`特效：HP低於 ${v.critDmgLowHp.hp} 時，近距離爆擊傷害額外 +${v.critDmgLowHp.add}%`);
  if(v.heavyBonusDmg) lines.push(`特效：觸發重擊時額外固定傷害${num(v.heavyBonusDmg)}（倍率計算後加算）`);
  if(v.rapidMax) lines.push(`特效：連射必定觸發最大箭數`);
  if(v.bonespike) lines.push(`特效：連射額外箭矢命中時累積「骨刺」層數（上限10層，一般攻擊引爆）`);
  if(v.procPoisonPct && typeof v.procPoisonPct === 'object') lines.push(`特效：命中附加中毒（每秒造成本次傷害 ${v.procPoisonPct.pct || 50}%，持續 ${v.procPoisonPct.dur || 6} 秒）`);
  if(v.statusHealHp) lines.push(`特效：受到異常狀態影響時，回復 ${v.statusHealHp} 點HP（一次中招只觸發一次，刷新既有狀態不觸發）`);
  if(v.playerHardSkin) lines.push(`特效：裝備時獲得「硬皮值」30點（減傷用消耗池，卸下即清除）`);
  if(v.mpOnComboHit) lines.push(`特效：雙擊追擊命中時，回復魔力${num(v.mpOnComboHit)}`);
  if(v.hpOnHit) lines.push(`一般攻擊命中回復生命${num(v.hpOnHit)}（固定值）`);
  if(v.slowScaleDmg) lines.push(`特效：攻速越慢，近戰傷害越高（以攻擊間隔0.10秒為基準，每慢0.05秒近戰傷害+1）`);
  if(v.pierceMainMult) lines.push(`特效：一般攻擊對主目標傷害 ×${v.pierceMainMult}`);
  if(v.pierceSubMult) lines.push(`特效：一般攻擊波及到的次要目標傷害 ×${v.pierceSubMult}（以主目標加成前的傷害為基準）`);
  if(v.firePrisonMult) lines.push(`特效：搭配「火牢」技能時，火牢傷害 ×${v.firePrisonMult}`);
  if(v.liningChain) lines.push(`特效：搭配「防禦6以下」的輕型盔甲時，額外 AC-10、魔防+10（僅限T恤欄位生效）`);
  if(v.grazeDmgPct !== undefined) lines.push(`擦傷（挫傷）傷害覆寫為 ${v.grazeDmgPct}%（一般預設是50%）`);
  if(v.stoneEssence) lines.push(`特效：觸發「石化精髓」buff期間，魔防與減傷各額外+50（僅限頭盔欄位生效）`);
  if(v.polyAllStats) lines.push(`特效：變身狀態下，全六圍屬性各額外+${v.polyAllStats}（僅限手套欄位生效）`);
  if(v.grantSkills && Array.isArray(v.grantSkills)) lines.push(`特效：${v.grantSkillsEquipOnly ? '裝備時' : '曾裝備過即永久'}授予技能：${v.grantSkills.map(s=>s.n||s.id||s).join('、')}${v.grantSkillsEquipOnly ? '（卸下即失去）' : ''}`);
  if(v.drPerEr) lines.push(`特效：減傷額外 +floor(完整精破ER ÷ ${v.drPerEr})`);
  if(v.golemMarkDebuff) lines.push(`⚠️ 特效：受到重擊後3秒內，魔防-100（負面副作用，僅限頭盔欄位生效）`);
  if(v.dblStrikeRate) lines.push(`一般攻擊 ${v.dblStrikeRate}% 機率造成2倍傷害`);
  if(v.auraSkill && typeof v.auraSkill === 'object') lines.push(`特效：每 ${v.auraSkill.interval || 100} tick 自動免費施放技能「${v.auraSkill.skId}」`);
  if(v.traumaProc && typeof v.traumaProc === 'object') lines.push(`一般攻擊命中 ${v.traumaProc.pct || 5}% 機率使目標陷入「創傷」（受所有物理傷害+5/層，持續6秒，最多2層）`);
  if(v.procDualSkill && typeof v.procDualSkill === 'object') lines.push(`攻擊時 ${v.procDualSkill.rate || 25}% 機率施放雙屬性法術（地+火各自結算傷害，必定命中）`);
  if(v.undeadImmune && typeof v.undeadImmune === 'object') lines.push(`特效：對不死族的魔法/狀態技完全免疫（冷卻${v.undeadImmune.cdSec || 5}秒）`);
  if(v.crushTornado) lines.push(`特效：觸發重擊時，對敵方全體免費施放龍捲風`);
  if(v.relicRole) lines.push(`遺物定位：${v.relicRole}`);
  if(v.unBonus) lines.push(`對狼人及不死造成額外傷害（⚠️效果可能已移除，程式碼註解顯示 v3.5.87 版本已刪除對應運算元）`);
  if(v.vampPct) lines.push(`特效：一般攻擊傷害轉換 ${Math.round(v.vampPct*100)}% 為HP吸血`);
  if(v.onDmgHeal) lines.push(`特效：受擊時觸發自癒技能（冷卻${v.onDmgHealCd || 5}秒）`);
  if(v.eleBonusDmg && typeof v.eleBonusDmg === 'object') lines.push(`對「${ELE_LABEL_ZH[v.eleBonusDmg.ele] || v.eleBonusDmg.ele}」屬性敵人額外固定傷害${num(v.eleBonusDmg.add || 0)}`);
  if(v.procBurn && typeof v.procBurn === 'object') lines.push(`特效：一般攻擊命中${v.procBurn.rate ? `${v.procBurn.rate}%機率` : '必定'}附加灼燒（每秒${v.procBurn.dmg||10}點火傷，持續${v.procBurn.dur||6}秒）`);
  if(v.onHitCastSkill && typeof v.onHitCastSkill === 'object') lines.push(`特效：命中時觸發免費施放技能（冷卻${v.onHitCastSkill.cdSec || 5}秒）`);
  if(v.skillDmgMult && typeof v.skillDmgMult === 'object') lines.push(`特效：特定技能傷害倍率加成（${Object.entries(v.skillDmgMult).map(([k,m])=>`${k} ×${m}`).join('、')}）`);
  if(v.aggroWeight) lines.push(`仇恨值權重${num(v.aggroWeight)}（提高被攻擊機率）`);
  if(v.missGrazeRate) lines.push(`特效：一般攻擊未命中時，${v.missGrazeRate}%機率改判為擦傷（50%傷害、不會爆擊）`);
  if(v.dr) lines.push(`傷害減免${num(v.dr)}`);
  if(v.mr) lines.push(`魔防${num(v.mr)}`);
  if(v.er) lines.push(`精破${num(v.er)}`);
  if(v.resFire) lines.push(`火屬性抵抗${num(v.resFire)}`);
  if(v.resWater) lines.push(`水屬性抵抗${num(v.resWater)}`);
  if(v.resEarth) lines.push(`地屬性抵抗${num(v.resEarth)}`);
  if(v.resWind) lines.push(`風屬性抵抗${num(v.resWind)}`);
  Object.keys(ATTR_LABEL_ZH).forEach(k => { if(v[k]) lines.push(`${ATTR_LABEL_ZH[k]}${num(v[k])}`); });
  if(v.mhp) lines.push(`生命上限${num(v.mhp)}`);
  if(v.mmp) lines.push(`魔力上限${num(v.mmp)}`);
  if(v.hpR) lines.push(`生命自然恢復${num(v.hpR)}`);
  if(v.mpR) lines.push(`魔力自然恢復${num(v.mpR)}`);
  if(v.dmgBonus) lines.push(`近戰/遠程傷害${num(v.dmgBonus)}（依裝備武器類型自動判定）`);
  if(v.mdmg) lines.push(`魔法傷害${num(v.mdmg)}`);
  if(v.extraMp) lines.push(`額外魔法點數${num(v.extraMp)}`);
  if(v.ele) lines.push(`一般攻擊化為${ELE_LABEL_ZH[v.ele] || v.ele}屬性`);
  if(v.atkSpdPct) lines.push(`攻速${pct(v.atkSpdPct)}${v.atkSpdPct < 0 ? '（負值代表變慢）' : ''}`);
  if(v.meleeHaste) lines.push(`裝備近戰武器時攻速${pct(v.meleeHaste)}`);
  if(v.polyAtkSpdPct) lines.push(`變身狀態下攻速${pct(v.polyAtkSpdPct)}`);
  if(v.mcrit) lines.push(`近戰爆擊率${pct(v.mcrit)}`);
  if(v.mcritDmg) lines.push(`近戰爆擊傷害${pct(v.mcritDmg)}`);
  if(v.rcrit) lines.push(`遠程爆擊率${pct(v.rcrit)}`);
  if(v.rapidfire) lines.push(`連射觸發機率 ${v.rapidfire}%`);
  if(v.ignHardSkin) lines.push(`特效：貫穿（攻擊無視目標硬皮減傷）`);
  if(v.spellProc){
    const rateBase = v.procRateBase != null ? v.procRateBase : 1;
    const ratePerEn = v.procRatePerEn != null ? v.procRatePerEn : 1;
    const rateNote = ratePerEn ? `${rateBase}%（每強化+${ratePerEn}%）` : `${rateBase}%`;
    const sp = v.spellProc;
    lines.push(`攻擊施法 ${rateNote}（觸發${sp.skn || '未知法術'}${sp.dice ? `，${sp.dice[0]}D${sp.dice[1]}` : ''}${sp.ele ? `，${ELE_LABEL_ZH[sp.ele] || sp.ele}屬性` : ''}${sp.aoe ? '，範圍傷害' : ''}）`);
  }
  if(id && WAND_RESONANCE_IDS.includes(id)) lines.push(`特效：共鳴（一般攻擊時依智力/60機率免費施放光箭，不耗魔力；魔擊精通改吃力量/60）`);
  if(v.petSkillDmgMult) lines.push(`寵物技能傷害 ×${v.petSkillDmgMult}`);
  if(v.petMdmgAll) lines.push(`寵物魔法傷害${num(v.petMdmgAll)}`);
  if(v.petDmgAll) lines.push(`所有寵物額外傷害${num(v.petDmgAll)}（掃描玩家+傭兵全裝備欄加總）`);
  if(v.petHitAll) lines.push(`所有寵物額外命中${num(v.petHitAll)}（掃描玩家+傭兵全裝備欄加總）`);
  if(v.summonDmg) lines.push(`召喚物傷害${num(v.summonDmg)}`);
  if(v.summonHit) lines.push(`召喚物命中${num(v.summonHit)}`);
  if(v.relicDropX2) lines.push(`特效：裝備時遺物掉落機率 ×2`);
  if(v.stunResist) lines.push(`暈眩抵抗 ${v.stunResist}%（機率抵抗，跟其他來源取最高、不疊加）`);
  if(v.immStun) lines.push(`特效：完全免疫暈眩`);
  if(v.immFreeze) lines.push(`特效：完全免疫冰凍`);
  if(v.immBurn) lines.push(`特效：完全免疫燃燒`);
  if(v.immParalyze) lines.push(`特效：完全免疫麻痺`);
  if(v.immPoison) lines.push(`特效：完全免疫中毒`);
  if(v.immStone) lines.push(`特效：完全免疫石化`);
  if(v.immSlow) lines.push(`特效：完全免疫減速`);
  if(v.immSilence) lines.push(`特效：完全免疫沉默`);
  if(v.immBlind) lines.push(`特效：完全免疫致盲`);
  if(v.immParalyzeBonusDmg) lines.push(`特效：對免疫麻痺目標（頭目/免疫者）額外固定傷害${num(v.immParalyzeBonusDmg)}`);
  if(v.lowMpRegenBonus) lines.push(`特效：MP低於15%時，魔力自然恢復額外${num(v.lowMpRegenBonus)}`);
  if(v.poisonHealMult) lines.push(`特效：受到中毒持續傷害時，轉換 ×${v.poisonHealMult} 的量回復HP`);
  if(v.dotCrit) lines.push(`特效：我方持續傷害（中毒/出血等）可以爆擊`);
  if(v.eleWpnMult && typeof v.eleWpnMult === 'object') lines.push(`特效：裝備對應屬性（${v.eleWpnMult.ele}）武器時，一般攻擊傷害 ×${v.eleWpnMult.mult}`);
  if(v.highestAttrPlus) lines.push(`特效：目前數值最高的六圍屬性額外+1（並列最高皆加）`);
  if(v.hitstunReduce) lines.push(`特效：受擊硬直減免 ${v.hitstunReduce} tick`);
  if(v.thorns) lines.push(`受擊反傷${num(v.thorns)}（固定值）`);
  if(v.weightCap) lines.push(`負重上限${num(v.weightCap)}`);
  if(v.heavyRatePct) lines.push(`特效：重擊觸發機率提升（每5% = 骰值多算1面）`);
  if(v.heavyMult) lines.push(`特效：觸發重擊時傷害 ×${v.heavyMult}`);
  if(v.giantBonus) lines.push(`特效：對「巨人」種族額外造成 1d20 傷害`);
  if(v.counterEles && v.counterEles.length) lines.push(`特效：一般攻擊對「${v.counterEles.join('、')}」屬性敵人傷害 ×1.4`);
  if(v.auraDmg) lines.push(`特效：光環傷害，每 ${v.auraDmg.interval || 20} tick 對周圍造成 ${v.auraDmg.dmg || 0} 傷害`);
  if(v.counterBarrierX2) lines.push(`特效：搭配反擊屏障技能時，反擊傷害 ×2`);
  if(v.noConsume) lines.push(`特效：視同箭矢裝備，但不會被消耗`);
  if(v.weakExpose) lines.push(`特效：一般攻擊命中時，機率對目標附加「弱點曝光」層數（最多3層，鎖刃精通5層）`);
  if(v.mpOnHitAmt) lines.push(`一般攻擊命中回復魔力${num(v.mpOnHitAmt)}（固定值）`);
  if(v.wishRing) lines.push(`特效：裝備瞬間從17項能力中隨機（不重複）抽取3項祝福，之後固定不變`);
  if(v.req) lines.push(`適用職業：${reqLabel(v.req)}`);
  if(v.noEnhance) lines.push(`無法強化`);
  // 🆕 §3.4 新補完欄位（已查到邏輯，2026 session新增）
  if(v.bossEncounterPct !== undefined) lines.push(`頭目遭遇機率覆寫為 ${v.bossEncounterPct}%（一般地圖生效；同時裝備多件時取最高值，不疊加）`);
  if(v.flameDkMorph) lines.push(`特效：裝備此武器時直接變身「烈焰的死亡騎士」（若同時觸發套裝變身，套裝變身優先）`);
  if(v.critFuryHaste && typeof v.critFuryHaste === 'object') lines.push(`特效：攻擊爆擊時，攻擊速度額外 +${v.critFuryHaste.pct}%，持續 ${v.critFuryHaste.sec || 5} 秒`);
  if(v.spellbladeBuff) lines.push(`特效：消耗MP施放傷害法術後10秒內，依法術階級提升近距離傷害與命中（1階+1～10階+25），且一般攻擊變成最後施放法術的屬性`);
  if(v.comboForceCrit) lines.push(`特效：雙擊的追加攻擊必定爆擊`);
  // 🆕 §3.4 補完（原本查無來源，改從04-combat-attack.js/03-combat-core.js/10-ui-tabs.js實際判定邏輯確認）
  if(v.corrosiveJellySkin) lines.push(`特效：受到一般攻擊時，使攻擊者的一般攻擊力永久 -3，最多疊加5層（上限-15），直到該怪物死亡`);
  if(v.charmOnHit) lines.push(`特效：迷魅術變為魅惑術——自身沒有迷魅怪物時，一般攻擊命中會自動嘗試迷魅目標；對頭目無效`);
  if(v.dotMpRefund) lines.push(`受到持續傷害（中毒/燃燒/灼傷/出血）損失HP時，回復損失HP的 ${v.dotMpRefund}% 作為MP（同時裝備多件取最高值，不疊加）`);
  if(v.noBleed) lines.push(`特效：此武器明確不會觸發出血狀態（即使武器分類符合矛類出血規則）`);
  if(v.hardWear) lines.push(`一般攻擊命中時，額外削減目標 ${v.hardWear} 點硬皮值`);

  // 🆕 整批搬移：10-ui-tabs.js 官方 relicPurposeLabels()/weaponPurposeLabels()
  // （遊戲自己的「遺物用途摘要」系統，程式碼原註解：補足舊遺物只有背景敘述、玩家看不出實際用途的問題）
  // 尚未搬進來的欄位，全部逐字對照官方寫法翻譯，不自行改寫用詞，確保跟遊戲內顯示一致。
  if(v.reqAvatar) lines.push(`裝備限制（僅限${v.reqAvatar}；其他角色無法裝備）`);
  if(v.petDmgReduce) lines.push(`寵物護甲（裝備的寵物受到傷害 -${Math.round(v.petDmgReduce*100)}%）`);
  if(v.petBleed) lines.push(`寵物出血（一般攻擊命中疊加8秒出血；每層每秒造成該次傷害20%，最多5層）`);
  if(v.armguard) lines.push(`臂甲（裝於副手，可與雙手武器並用）`);   // ⚠️ armguard是雙重機制：上面已有「強化不吃AC改吃HP」，這裡補上另一半「可與雙手武器並用」
  if(v.abnormalResist) lines.push(`異常狀態抵抗+${v.abnormalResist}%`);
  if(v.fireballBurst) lines.push(`爆裂火球（將已學會的「燃燒的火球」升級為威力更強的「爆裂的火球」）`);
  if(v.summonCtrl) lines.push(`召喚控制（可指定召喚物；28～48級召喚上限由5隻提高至6隻）`);
  if(v.autoReviveScroll) lines.push(`巨靈守護（傭兵或寵物死亡時立即消耗1張復活卷軸使其復活）`);
  if(v.aggroHide) lines.push(`隱匿仇恨（較不容易成為敵人目標）`);
  if(v.aggroMin) lines.push(`被攻擊權重必定為 1（最低，無視職業與其他仇恨裝備）`);
  if(v.necroBook) lines.push(`骷髏復生（造屍術改為不消耗MP；敵人被擊敗時自動召喚1隻骷髏，全隊場上最多6隻；已達上限時完全恢復HP最低的骷髏）`);
  if(v.killTeamHealPct) lines.push(`亡者餽贈（擊殺敵人時，全體玩家、傭兵、召喚物、寵物與護衛恢復${v.killTeamHealPct}%最大HP）`);
  if(v.stealth) lines.push(`常駐隱身（不主動吸引一般怪物）`);
  if(v.fullHpMultTriple) lines.push(`滿血三重矢（首箭傷害 ×${v.fullHpMultTriple}）`);
  if(v.fullHpMpHalf) lines.push(`滿血施法（自身滿血時魔力消耗減半）`);
  if(v.lowHpPotionX2) lines.push(`瀕危急救（低HP時藥水恢復量 ×2）`);
  if(v.groupHealMult) lines.push(`團體治癒強化（體力回復術、生命的祝福恢復量 ×${v.groupHealMult}）`);
  if(v.poisonMult) lines.push(`劇毒增幅（附加劇毒傷害 ×${v.poisonMult}）`);
  if(v.softMult) lines.push(`柔軟專攻（攻擊無硬皮的敵人傷害 ×${v.softMult}）`);
  if(v.iaiCrit) lines.push(`居合必定爆擊`);
  if(v.potionBonus) lines.push(`治癒藥水恢復量${num(v.potionBonus)}%`);   // ⚠️ 原本有`&& !v.doll`排除魔法娃娃：那是照搬官方relicPurposeLabels()的邏輯（官方另有一份statsArr會無條件補顯示），但本函式身兼兩者角色，排除後魔法娃娃反而完全不會顯示此行，故移除排除條件
  if(v.hitEchoMagic && typeof v.hitEchoMagic === 'object') lines.push(`元素爆破 ${v.hitEchoMagic.rate}%（命中後追加等同本次一般攻擊傷害的${ELE_LABEL_ZH[v.hitEchoMagic.ele] || v.hitEchoMagic.ele}屬性魔法傷害）`);
  if(v.onHitWet) lines.push(`潮濕（命中後持續10秒；下一次風屬性傷害 ×2 並解除）`);
  if(v.onHitEleVuln) lines.push(`元素弱點（命中使目標受到的${ELE_LABEL_ZH[v.onHitEleVuln] || v.onHitEleVuln}屬性傷害提高）`);
  if(v.windSpellProcRate) lines.push(`風魔法共振 ${v.windSpellProcRate}%（主動施放風屬性傷害魔法時追加龍捲風）`);
  if(v.hasteStrike) lines.push(`加速突擊（加速時命中與傷害+30；命中後失去加速）`);
  if(v.selfBreakProc && typeof v.selfBreakProc === 'object') lines.push(`易碎爆發（3%造成1.5倍傷害，但自身傷害降低${v.selfBreakProc.dur || 5}秒）`);
  if(v.procHealFlat && typeof v.procHealFlat === 'object') lines.push(`命中治癒 ${v.procHealFlat.rate}%（恢復${v.procHealFlat.hp}點HP）`);
  if(v.castOnHurt && typeof v.castOnHurt === 'object') lines.push(`護身反擊 ${v.castOnHurt.rate}%（受到物理或魔法傷害時，免費施放目前設定的自動攻擊傷害法術）`);
  if(v.raceFlat && typeof v.raceFlat === 'object') lines.push(`${v.raceFlat.race}剋星（對${v.raceFlat.race}額外傷害${num(v.raceFlat.add)}）`);
  if(v.raceBonus && typeof v.raceBonus === 'object') lines.push(`${v.raceBonus.race}剋星（對${v.raceBonus.race}傷害 ×${v.raceBonus.mult}）`);
  if(v.weakHitBonus) lines.push(`弱點洞察（屬性剋制時額外傷害${num(v.weakHitBonus)}）`);
  if(v.partnerHit && typeof v.partnerHit === 'object'){
    const _partnerNames = Object.keys(v.partnerHit).map(n => `${n}命中${num(v.partnerHit[n])}`);
    if(_partnerNames.length) lines.push(`夥伴強化（${_partnerNames.join('、')}）`);
  }
  if(v.showMobEle) lines.push(`元素洞察（顯示敵人的屬性）`);
  if(v.hurtExplode) lines.push(`受擊爆裂（自己與全體敵人受到${v.hurtExplode}點火焰魔法傷害）`);
  if(v.crushDr) lines.push(`重擊防護（受到重擊傷害 -${v.crushDr}%）`);
  if(v.physDrGated) lines.push(`物理防護（一般攻擊傷害 -${v.physDrGated}%，每3秒一次）`);
  // ↓weaponPurposeLabels()搬移
  if(v.dragonStrike) lines.push(`龍的一擊 ${v.dragonStrike}%（每次一般攻擊皆判定且不論命中；對全體造成3D力量+30固定物理傷害）`);
  if(v.equipHaste) lines.push(`裝備加速（常駐加速，與加速術／自我加速藥水不重疊）`);
  if(v.mdmgEnFrom7Max3) lines.push(`魔法傷害成長（+7起魔法傷害+1，之後每強化+1，最高+3）`);
  if(v.mpRPerEn) lines.push(`MP自然恢復每強化${num(v.mpRPerEn)}`);
  if(v.procBurstPoison && typeof v.procBurstPoison === 'object'){
    const _pb = v.procBurstPoison;
    lines.push(`猛爆劇毒 ${_pb.rateBase == null ? 1 : _pb.rateBase}%＋每強化${_pb.ratePerEn == null ? 1 : _pb.ratePerEn}%（每秒100點真實傷害，持續5秒，最多1層）`);
  }
  if(v.qiguProc === 'phantom') lines.push(`幻影衝擊 1%＋每強化1%（造成基礎80～160的無屬性魔法傷害，不受MR減免）`);
  if(v.qiguProc === 'mindbreak') lines.push(`心靈破壞 1%＋每強化1%（以自身最大MP 5%為基礎魔法傷害，不消耗MP；奇古獸精通時無視MR）`);
  if(v.strawCurse && typeof v.strawCurse === 'object') lines.push(`稻草詛咒 ${v.strawCurse.rate}%（命中時附加${v.strawCurse.stacks || 3}層；後續每次受攻擊消耗1層並追加80點水屬性固定魔法傷害）`);
  if(v.stunHitBonus) lines.push(`衝擊之暈強化（暈眩命中率${num(v.stunHitBonus)}%）`);
  if(v.vanderStunHit) lines.push(`范德劍術（施放衝擊之暈時，本次近距離命中+1）`);
  if(v.shahaBow) lines.push(`沙哈之箭（裝備時自動提供不會消耗的專用箭矢，卸下弓時消失）`);
  if(v.shahaArrow) lines.push(`無限箭矢（不會消耗；卸下沙哈之弓時消失）`);

  // 🪆 §補完：魔法娃娃(doll)常用欄位，先前完全沒被本函式處理（官方對照見10-ui-tabs.js relicPurposeLabels()/統一能力區塊）
  if(v.procPoisonRate) lines.push(`一般攻擊命中 ${v.procPoisonRate}% 機率使目標中毒`);
  if(v.procBonusDmg && typeof v.procBonusDmg === 'object') lines.push(`攻擊時 ${v.procBonusDmg.rate}% 機率追加固定傷害 ${v.procBonusDmg.dmg}`);
  if(v.procDmgReduce && typeof v.procDmgReduce === 'object') lines.push(`受到攻擊時 ${v.procDmgReduce.rate}% 機率減少 ${v.procDmgReduce.amount} 點傷害`);
  if(v.procSkill){
    const _procName = (typeof SKILL_MAP !== 'undefined' && SKILL_MAP[v.procSkill]) || v.procSkill;
    const _procRate = (v.procRateBase != null ? v.procRateBase : 1) + (v.procRatePerEn || 0);
    lines.push(`${v.procOnHit ? '命中施法' : '攻擊施法'} ${_procRate}%（觸發「${_procName}」）`);
  }
  if(v.magicHit) lines.push(`魔法命中${num(v.magicHit)}`);
  if(v.expBonus) lines.push(`經驗值獲得量${pct(v.expBonus)}`);
  if(v.goldBonus) lines.push(`金幣獲得量${pct(v.goldBonus)}`);
  if(v.freezeResist) lines.push(v.freezeResist >= 100 ? `完全免疫冰凍` : `冰凍抵抗${pct(v.freezeResist)}`);

  return lines;
}
function relicInfoHTML(v, id){
  // 🪆 魔法娃娃(doll:true)本身不是relic，但同樣需要顯示能力說明；
  // 之前只判斷v.relic，導致所有魔法娃娃在搜尋結果裡完全沒有效果文字。
  const isDoll = !!(v.doll || v.slot === 'doll');
  if(!v.relic && !isDoll) return '';
  let html = `<div style="margin-top:6px; padding-top:6px; border-top:1px dashed var(--border); color:var(--relic);">`;
  if(isDoll){
    html += `🪆 魔法娃娃・裝備欄位：<b>${relicSlotLabel(v)}</b>${v.dollTier ? `（${v.dollTier}階）` : ''}`;
  } else {
    html += `🏺 遺物・正確裝備位置：<b>${relicSlotLabel(v)}</b>`;
  }
  if(v.d) html += `<div style="color:var(--text3); font-style:italic; margin-top:4px; line-height:1.5;">${v.d}</div>`;
  const mech = relicMechanicLines(v, id);
  if(mech.length){
    html += `<div style="margin-top:6px; color:var(--text2); line-height:1.7;">${mech.join('<br>')}</div>`;
  }
  html += `</div>`;
  return html;
}
// 判斷關鍵字是否為「遺物」查詢模式（輸入包含「遺物」兩字，就列出所有遺物，不管名稱有沒有真的含這兩字）
function isRelicKeyword(kw){ return kw.includes('遺物'); }

// ════════════════════════════════════════════════
//  裝備面板輔助
// ════════════════════════════════════════════════
function _setSelectVal(id, val){
  const el = document.getElementById(id);
  if(!el) return;
  const strVal = String(val);
  for(let opt of el.options) opt.selected = (opt.value === strVal);
}

function getEqDisplayName(db, eq){
  if(!db || !eq || !eq.id)
    return '<span style="color:var(--text3)">空</span>';
  let prefix = '';
  const aff = eq.attr && ATTR_AFFIX[eq.attr];
  if(aff) prefix += `<span class="attr-${eq.attr}">${aff.n} </span>`;
  const ancMap = { true:'遠古', eternal:'永恆', immortal:'不朽', primordial:'太初' };
  const ancCls = { true:'c-ancient', eternal:'c-eternal', immortal:'c-immortal', primordial:'c-primordial' };
  if(eq.anc) prefix += `<span class="${ancCls[String(eq.anc)]||'c-ancient'}">${ancMap[String(eq.anc)]||'遠古'} </span>`;
  if(eq.bless === 'cursed') prefix += `<span class="c-cursed">詛咒的 </span>`;
  else if(eq.bless)         prefix += `<span class="c-blessed">祝福的 </span>`;
  const setPrefix = eq.seteff
    ? `<span style="color:#4ade80">${String(eq.seteff).slice(0,4)}</span> `
    : '';
  const enStr  = (eq.en > 0) ? `+${eq.en} ` : '';
  const nameCls = db.legend ? 'c-legend' : '';
  let d2Prefix = '', d2Suffix = '';
  if(Array.isArray(eq.d2) && eq.d2.length && typeof d2rNameAffixes === 'function'){
    const names = d2rNameAffixes(eq);
    if(names.prefix) d2Prefix = `<span style="color:var(--accent2)">${names.prefix}</span>`;
    if(names.suffix) d2Suffix = `<span style="color:var(--accent2)">${names.suffix}</span>`;
  }
  return `${prefix}<span class="${nameCls}">${enStr}${setPrefix}${d2Prefix}${db.n}${d2Suffix}</span>`;
}

// ════════════════════════════════════════════════
//  裝備面板渲染
// ════════════════════════════════════════════════
// ── 席琳遺骸套裝進度統計（門檻 2/3/5 件）
const REM_SLOT_IDS = EQ_SLOTS.filter(sl => sl.isRemains).map(sl => sl.id);
function computeRemSetCounts(eqObj){
  const counts = {};
  if(!eqObj) return counts;
  REM_SLOT_IDS.forEach(id => {
    const seteff = eqObj[id] && eqObj[id].seteff;
    if(seteff) counts[seteff] = (counts[seteff] || 0) + 1;
  });
  return counts;
}
function remSetSummaryHTML(eqObj){
  const counts = computeRemSetCounts(eqObj);
  const names = Object.keys(counts);
  if(names.length === 0){
    return `<div class="rss-empty">尚未裝備遺骸</div>`;
  }
  names.sort((a,b) => counts[b] - counts[a]);
  return names.map(n => {
    const c = counts[n];
    const tier = c >= 5 ? 'rss-t5' : c >= 3 ? 'rss-t3' : c >= 2 ? 'rss-t2' : '';
    return `<div class="rss-line"><span class="rss-name">${n}</span><span class="rss-cnt ${tier}">${c}/5</span></div>`;
  }).join('');
}

function renderEqPanel(){
  const grid = document.getElementById('eqGrid');
  if(!grid) return;

  const attrOptHTML = `
    <option value="">── 無 ──</option>
    <optgroup label="一階（之）">
      ${['fr1','wa1','wi1','ea1'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="二階">
      ${['fr2','wa2','wi2','ea2'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="三階（靈）">
      ${['fr3','wa3','wi3','ea3'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="四階">
      ${['fr4','wa4','wi4','ea4'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>
    <optgroup label="五階（最高階）">
      ${['fr5','wa5','wi5','ea5'].map(k=>
        `<option value="${k}">${ATTR_AFFIX[k].n}（${k}）</option>`
      ).join('')}
    </optgroup>`;

  const attrMagicSelectHTML = attrMagicOptHTML();

  const ancOptHTML = `
    <option value="">── 無 ──</option>
    ${ANC_OPTIONS.map(o=>`<option value="${String(o.v)}">${o.n}</option>`).join('')}`;

  const blessOptHTML = `
    <option value="">── 無 ──</option>
    ${BLESS_OPTIONS.map(o=>`<option value="${String(o.v)}">${o.n}</option>`).join('')}`;

  const remSetOptHTML = `
    <option value="">── 無 ──</option>
    ${REM_SET_NAMES.map(n=>`<option value="${n}">${n}</option>`).join('')}`;

  grid.innerHTML = EQ_SLOTS.map(sl => {
    if(sl.hidden) return '';
    if(sl.spacer) return `<div id="remSetSummary" class="rem-set-summary">${remSetSummaryHTML(G.p.eq)}</div>`;

    const d  = (G.p.eq && G.p.eq[sl.id]) || {};

    if(sl.isSimpleToggle){
      return `
      <div class="eq-slot eq-slot-simple">
        <div class="eq-slot-title">${sl.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px">
          ID: <code>${sl.fixedItemId}</code>（固定，全遊戲僅此一件對應物品）
        </div>
        <label class="eq-flag">
          <input type="checkbox" id="eq_${sl.id}_equipped"
                 onchange="onSimpleToggleFieldChange('${sl.id}')" ${d.id?'checked':''}> 已裝備
        </label>
      </div>`;
    }

    if(sl.isRemains){
      return `
      <div class="eq-slot eq-slot-rem">
        <div class="eq-slot-title">${sl.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px">
          ID: <code>${sl.id}</code>（固定）
        </div>
        <div class="eq-slot-row">
          <label class="eq-flag">
            <input type="checkbox" id="eq_${sl.id}_equipped"
                   onchange="onRemFieldChange('${sl.id}')" ${d.id?'checked':''}> 已裝備
          </label>
          <label class="eq-flag">
            <input type="checkbox" id="eq_${sl.id}_lock"
                   onchange="onRemFieldChange('${sl.id}')" ${d.lock?'checked':''}> 鎖定
          </label>
        </div>
        <div class="affix-row">
          <span class="affix-label">套裝效果</span>
          <select class="affix-select" id="eq_${sl.id}_seteff"
                  onchange="onRemFieldChange('${sl.id}')">${remSetOptHTML}</select>
        </div>
      </div>`;
    }

    const db = (d.id && ITEM_DB[d.id]) || {};
    return `
    <div class="eq-slot">
      <div class="eq-slot-title">${sl.label}</div>
      <div style="font-size:12px;min-height:18px;margin-bottom:6px;line-height:1.4">
        ${getEqDisplayName(db, d)}
      </div>
      <div class="eq-slot-row">
        <label style="font-size:11px;color:var(--text3)">ID</label>
        <input type="text" id="eq_${sl.id}_id" value="${d.id||''}"
               style="width:130px" placeholder="物品 ID"
               onchange="onEqFieldChange('${sl.id}')">
        <label style="font-size:11px;color:var(--text3)">+</label>
        <input type="number" id="eq_${sl.id}_en" value="${d.en||0}"
               min="0" max="99" style="width:46px"
               onchange="onEqFieldChange('${sl.id}')">
      </div>
      <div id="eq_${sl.id}_sockets" style="font-size:11px;color:var(--text3);margin:2px 0 4px"
           title="唯讀，請至成長→打洞調整">${typeof socketCountText==='function'?socketCountText(d):''}</div>
      <div class="affix-row">
        <span class="affix-label">屬性詞綴</span>
        <select class="affix-select" id="eq_${sl.id}_attr"
                onchange="onEqFieldChange('${sl.id}')">${attrOptHTML}</select>
      </div>
      <div class="affix-row">
        <span class="affix-label">屬性魔法</span>
        <select class="affix-select" id="eq_${sl.id}_attrmagic"
                onchange="onEqFieldChange('${sl.id}')" title="只有五階屬性裝備才能附加，且技能元素須與屬性詞綴相同">${attrMagicSelectHTML}</select>
        <select id="eq_${sl.id}_attrmagicstar" style="width:56px;margin-left:4px"
                title="星級（1~3，同技能升星使觸發率×星數）"
                onchange="onEqFieldChange('${sl.id}')">${starOptHTML(d.attrMagicStar||1)}</select>
      </div>
      <div class="affix-row">
        <span class="affix-label">遠古詞綴</span>
        <select class="affix-select" id="eq_${sl.id}_anc"
                onchange="onEqFieldChange('${sl.id}')">${ancOptHTML}</select>
      </div>
      <div class="affix-row">
        <span class="affix-label">祝福/詛咒</span>
        <select class="affix-select" id="eq_${sl.id}_bless"
                onchange="onEqFieldChange('${sl.id}')">${blessOptHTML}</select>
      </div>
      <div class="eq-slot-row" style="margin-top:6px">
        <label class="eq-flag">
          <input type="checkbox" id="eq_${sl.id}_lock"
                 onchange="onEqFieldChange('${sl.id}')"
                 ${d.lock?'checked':''}> 鎖定
        </label>
      </div>
    </div>`;
  }).join('');

  // 補上 selected 狀態
  EQ_SLOTS.forEach(sl => {
    if(sl.hidden || sl.spacer) return;
    const d = (G.p.eq && G.p.eq[sl.id]) || {};
    if(sl.isSimpleToggle) return;   // 只有checkbox，沒有下拉選單需要同步selected狀態
    if(sl.isRemains){
      _setSelectVal(`eq_${sl.id}_seteff`, d.seteff || '');
      return;
    }
    _setSelectVal(`eq_${sl.id}_attr`,  d.attr  || '');
    _setSelectVal(`eq_${sl.id}_attrmagic`, d.attrMagic || '');
    _setSelectVal(`eq_${sl.id}_attrmagicstar`, String(d.attrMagicStar || 1));
    _setSelectVal(`eq_${sl.id}_anc`,
      d.anc === true ? 'true' : (d.anc || ''));
    _setSelectVal(`eq_${sl.id}_bless`,
      d.bless === 'cursed' ? 'cursed' : (d.bless ? 'true' : ''));
  });
}

// ── 遺骸欄位變更即時同步
function onRemFieldChange(slotId){
  if(!G.p.eq) G.p.eq = {};
  const equipped = !!document.getElementById(`eq_${slotId}_equipped`)?.checked;
  if(!equipped){
    G.p.eq[slotId] = null;
    _refreshRemSummary();
    return;
  }
  const orig   = G.p.eq[slotId] || {};
  const seteff = document.getElementById(`eq_${slotId}_seteff`)?.value || '';
  const lock   = !!document.getElementById(`eq_${slotId}_lock`)?.checked;
  G.p.eq[slotId] = Object.assign({}, orig, {
    id: slotId,
    uid: orig.uid || genUID(),
    cnt: 1,
    en: 0,
    bless: false,
    anc: false,
    attr: false,
    seteff: seteff || false,
    lock,
    junk: false,
    _ruleJunk: false,
  });
  _refreshRemSummary();
}
function _refreshRemSummary(){
  const el = document.getElementById('remSetSummary');
  if(el) el.innerHTML = remSetSummaryHTML(G.p.eq);
}

// ── 簡易切換欄位（目前只有魔眼欄位在用）：固定物品ID，只有「已裝備」一個開關，其餘屬性一律清空
function onSimpleToggleFieldChange(slotId){
  if(!G.p.eq) G.p.eq = {};
  const sl = EQ_SLOTS.find(s => s.id === slotId);
  if(!sl || !sl.fixedItemId) return;
  const equipped = !!document.getElementById(`eq_${slotId}_equipped`)?.checked;
  if(!equipped){
    G.p.eq[slotId] = null;
    return;
  }
  const orig = G.p.eq[slotId] || {};
  G.p.eq[slotId] = Object.assign({}, orig, {
    id: sl.fixedItemId,
    uid: orig.uid || genUID(),
    cnt: 1,
    en: 0,
    bless: false,
    anc: false,
    attr: false,
    lock: false,
    junk: false,
    _ruleJunk: false,
  });
}

// ── 欄位變更即時同步
function onEqFieldChange(slotId){
  const idVal = (document.getElementById(`eq_${slotId}_id`)?.value || '').trim();
  const orig  = G.p.eq[slotId] || {};

  if(!idVal){
    G.p.eq[slotId] = null;
    _refreshEqPreview(slotId, null, null);
    return;
  }

  const attrRaw  = document.getElementById(`eq_${slotId}_attr`)?.value  || '';
  const ancRaw   = document.getElementById(`eq_${slotId}_anc`)?.value   || '';
  const blessRaw = document.getElementById(`eq_${slotId}_bless`)?.value || '';

  // 🔮 屬性魔法：所有裝備欄位（席琳遺骸除外）皆適用，且必須「第5階屬性裝備」+「技能與屬性詞綴同元素」才合法
  let attrMagic = false, attrMagicStar = 1;
  {
    const magicRaw = document.getElementById(`eq_${slotId}_attrmagic`)?.value || '';
    const starRaw  = parseInt(document.getElementById(`eq_${slotId}_attrmagicstar`)?.value) || 1;
    if(magicRaw){
      if(!isTier5AttrWeapon(idVal, attrRaw)){
        toast('⚠️ 只有「五階屬性裝備」才能附加屬性魔法，已忽略此設定', 'err', 4000);
      } else if(ATTR_MAGIC_BY_SKILL[magicRaw] !== (ATTR_AFFIX[attrCanon(attrRaw)]||{}).ele){
        toast('⚠️ 屬性魔法必須跟裝備的屬性詞綴同元素，已忽略此設定', 'err', 4000);
      } else {
        attrMagic     = magicRaw;
        attrMagicStar = Math.max(1, Math.min(3, starRaw));
      }
    }
    if(!attrMagic){
      _setSelectVal(`eq_${slotId}_attrmagic`, '');
      _setSelectVal(`eq_${slotId}_attrmagicstar`, '1');
    }
  }

  G.p.eq[slotId] = Object.assign({}, orig, {
    id:     idVal,
    en:     parseInt(document.getElementById(`eq_${slotId}_en`)?.value) || 0,
    cnt:    orig.cnt   || 1,
    bless:  blessRaw === '' ? false : (blessRaw === 'true' ? true : blessRaw),
    lock:   !!(document.getElementById(`eq_${slotId}_lock`)?.checked),
    anc:    ancRaw   === '' ? false : (ancRaw   === 'true' ? true : ancRaw),
    uid:    orig.uid   || genUID(),
    attr:   attrRaw   || false,
    attrMagic,
    attrMagicStar,
    seteff: orig.seteff || false,
    junk:   orig.junk  ?? false,
  });

  const db = ITEM_DB[idVal] || {};
  _refreshEqPreview(slotId, db, G.p.eq[slotId]);
}

function _refreshEqPreview(slotId, db, eq){
  const idInput = document.getElementById(`eq_${slotId}_id`);
  if(!idInput) return;
  const slot = idInput.closest('.eq-slot');
  if(!slot) return;
  const preview = slot.querySelector('div[style*="min-height"]');
  if(preview) preview.innerHTML = getEqDisplayName(db, eq);
  const sockInput = document.getElementById(`eq_${slotId}_sockets`);
  if(sockInput && typeof socketCountText === 'function') sockInput.textContent = socketCountText(eq);
}

function saveEqToG(){
  if(!G.p.eq) G.p.eq = {};
  EQ_SLOTS.forEach(sl => {
    const inputEl = document.getElementById(`eq_${sl.id}_id`);
    // 如果裝備面板還沒被渲染出 DOM 元素，就直接跳過，保留 G.p.eq 內的原始資料
    if(!inputEl) return; 

    const idVal = (inputEl.value || '').trim();
    if(!idVal){ G.p.eq[sl.id] = null; return; }
    onEqFieldChange(sl.id);
  });
}

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

// ════════════════════════════════════════════════
//  物品搜尋輔助
// ════════════════════════════════════════════════
function getItemName(id){
  if(ITEM_DB[id] && ITEM_DB[id].n) return ITEM_DB[id].n;
  if(typeof GROWTH_RUNE_DEFS !== 'undefined' && GROWTH_RUNE_DEFS[id])
    return typeof growthRuneName === 'function' ? growthRuneName(id) : GROWTH_RUNE_DEFS[id].n;
  if(typeof GROWTH_GEM_COLORS !== 'undefined' && typeof GROWTH_GEM_RANKS !== 'undefined'){
    const m = /^gem_([a-z]+)_(\d)$/.exec(id);
    if(m && GROWTH_GEM_COLORS[m[1]] && GROWTH_GEM_RANKS[m[2]-1])
      return GROWTH_GEM_RANKS[m[2]-1].n + GROWTH_GEM_COLORS[m[1]].n + '（暗黑）';
  }
  return id;
}

function onItemSearch(input, ddId, hidId){
  const q  = input.value.trim().toLowerCase();
  const dd = document.getElementById(ddId);
  if(!q){ dd.style.display = 'none'; return; }

  const results = Object.entries(ITEM_DB)
    .filter(([id,v]) => {
      const name = (v.n||'').toLowerCase();
      return name.includes(q) || id.toLowerCase().includes(q);
    })
    .slice(0, 18);

  if(!results.length){ dd.style.display = 'none'; return; }

  dd.innerHTML = results.map(([id,v]) => `
    <div class="item-opt ${v.legend?'legend':''}"
         onclick="selectItem('${id}','${(v.n||id).replace(/'/g,"\\'")}','${ddId}','${hidId}')">
      <span class="item-opt-name">${v.n||id}</span>
      <span class="item-opt-id">${id}</span>
    </div>`).join('');
  dd.style.display = 'block';
}

function selectItem(id, name, ddId, hidId){
  document.getElementById(hidId).value = id;
  const dd = document.getElementById(ddId);
  if(dd && dd.previousElementSibling) dd.previousElementSibling.value = name;
  dd.style.display = 'none';
}

document.addEventListener('click', e => {
  document.querySelectorAll('.item-dropdown').forEach(dd => {
    if(!dd.parentElement.contains(e.target)) dd.style.display = 'none';
  });
});

// ════════════════════════════════════════════════
//  背包 / 倉庫
// ════════════════════════════════════════════════
function addItem(type){
  const selId = type === 'inv' ? 'invSelId' : 'whSelId';
  const cntId = type === 'inv' ? 'invCnt'   : 'whCnt';
  const enId  = type === 'inv' ? 'invEn'    : 'whEn';
  const id    = document.getElementById(selId).value;
  if(!id){ toast('請先選擇物品', 'err'); return; }
  const item = {
    id, uid:genUID(),
    cnt:   parseInt(document.getElementById(cntId).value) || 1,
    en:    parseInt(document.getElementById(enId).value)  || 0,
    bless: false, lock: false, junk: false,
    attr: false, anc: false, seteff: false,
    attrMagic: false, attrMagicStar: 1,
  };
  if(type === 'inv') G.p.inv.push(item);
  else               G.wh.items.push(item);
  renderItemTable(type);
  toast('已新增：' + getItemName(id), 'ok');
}

// ─── 批次刪除：勾選狀態存在 Set，不寫進資料物件 ───
const _sel = { inv: new Set(), wh: new Set() };

function _ensureFloatBtn(type){
  const id = 'floatDelBtn_' + type;
  if(document.getElementById(id)) return;
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = [
    'display:none', 'position:fixed', 'bottom:28px', 'right:28px',
    'z-index:9999', 'display:flex', 'gap:8px', 'align-items:center',
    'background:var(--bg2)', 'border:2px solid var(--red)',
    'border-radius:10px', 'padding:8px 14px', 'box-shadow:0 4px 16px rgba(0,0,0,.4)',
    'pointer-events:auto'
  ].join(';');
  el.innerHTML =
    `<span id="floatDelCount_${type}" style="color:var(--text);font-size:13px"></span>` +
    `<button class="btn btn-danger btn-sm" onclick="_delSelectedItems('${type}')">🗑 刪除勾選</button>` +
    `<button class="btn btn-sm" onclick="_clearSel('${type}')">✕ 取消</button>`;
  el.style.display = 'none'; // start hidden
  document.body.appendChild(el);
}

function _updateFloatBtn(type){
  _ensureFloatBtn(type);
  const el    = document.getElementById('floatDelBtn_' + type);
  const count = document.getElementById('floatDelCount_' + type);
  const n     = _sel[type].size;
  if(!el) return;
  el.style.display = n > 0 ? 'flex' : 'none';
  if(count) count.textContent = `已勾選 ${n} 件`;
}

function _onItemCheck(type, idx, checked){
  if(checked) _sel[type].add(idx);
  else        _sel[type].delete(idx);
  _updateFloatBtn(type);
}

function _clearSel(type){
  _sel[type].clear();
  // 取消畫面上所有勾選
  const tbody = document.getElementById(type === 'inv' ? 'invBody' : 'whBody');
  if(tbody) tbody.querySelectorAll('.item-row-chk').forEach(c=>{ c.checked = false; });
  _updateFloatBtn(type);
}

function _delSelectedItems(type){
  const idxs = Array.from(_sel[type]).sort((a,b)=>b-a); // 由大到小
  if(!idxs.length) return;
  const list = type === 'inv' ? G.p.inv : G.wh.items;
  const names = idxs.map(i=> list[i] ? getItemName(list[i].id) : '').filter(Boolean);
  const preview = names.length > 5
    ? names.slice(0,5).join('、') + `…等 ${names.length} 件`
    : names.join('、');
  if(!confirm(`確定要刪除以下 ${idxs.length} 件物品？\n\n${preview}`)) return;
  idxs.forEach(i => list.splice(i, 1)); // 從大到小 splice，不影響較小的 index
  _sel[type].clear();
  renderItemTable(type);
}

function delItem(type, idx){
  if(type === 'inv') G.p.inv.splice(idx, 1);
  else               G.wh.items.splice(idx, 1);
  _sel[type].delete(idx);
  // 被刪除後，比它大的 index 都要下移一位
  const next = new Set();
  _sel[type].forEach(i => next.add(i > idx ? i-1 : i));
  _sel[type] = next;
  renderItemTable(type);
}

function clearList(type){
  if(!confirm('確定清空？')) return;
  if(type === 'inv') G.p.inv   = [];
  else               G.wh.items = [];
  renderItemTable(type);
}

function renderItemTable(type){
  const list  = type === 'inv' ? G.p.inv : G.wh.items;
  const tbody = document.getElementById(type === 'inv' ? 'invBody' : 'whBody');
  if(!tbody) return;

  function attrOpts(cur){
    const TIER_LABEL = {1:'一階',2:'二階',3:'三階',4:'四階',5:'五階'};
    let h = `<option value="">無</option>`;
    for(let t = 1; t <= 5; t++){
      const keys = Object.keys(ATTR_AFFIX).filter(k => ATTR_AFFIX[k].tier === t);
      h += `<optgroup label="${TIER_LABEL[t]}">`;
      keys.forEach(k => {
        h += `<option value="${k}" ${cur===k?'selected':''}>${ATTR_AFFIX[k].n}</option>`;
      });
      h += `</optgroup>`;
    }
    return h;
  }

  function ancOpts(cur){
    const curStr = cur === true ? 'true' : (cur || '');
    let h = `<option value="">無</option>`;
    ANC_OPTIONS.forEach(o => {
      const vStr = String(o.v);
      h += `<option value="${vStr}" ${curStr===vStr?'selected':''}>${o.n}</option>`;
    });
    return h;
  }

  tbody.innerHTML = list.map((it, i) => {
    const db      = ITEM_DB[it.id] || {};
    const eligible = isTier5AttrWeapon(it.id, it.attr);

    // 名稱顏色與 D2R 詞綴前後綴
    const hasD2 = Array.isArray(it.d2) && it.d2.length > 0;
    let nameStyle = db.legend ? 'color:var(--legend)' : '';
    if(hasD2) nameStyle = 'color:#6ab0f5'; // 有暗黑詞綴 → 藍色
    const nameStyleAttr = nameStyle ? `style="${nameStyle}"` : '';

    let d2Prefix = '', d2Suffix = '', d2Tooltip = '';
    if(hasD2 && typeof d2rNameAffixes === 'function'){
      const names = d2rNameAffixes(it);
      if(names.prefix) d2Prefix = `<span style="color:var(--accent2)">${names.prefix}</span>`;
      if(names.suffix) d2Suffix = `<span style="color:var(--accent2)">${names.suffix}</span>`;
    }
    if(hasD2 && typeof d2rAffixText === 'function'){
      d2Tooltip = it.d2
        .map(r => d2rAffixText(r))
        .filter(Boolean)
        .join('\n');
    }
    const tooltipAttr = d2Tooltip ? `title="${d2Tooltip.replace(/"/g,'&quot;')}"` : '';

    // 孔數：短格式「目前/最大」
    function socketShort(item){
      if(typeof socketCurrentCount!=='function') return '—';
      const def = ITEM_DB[item.id];
      if(typeof equipSocketLimit!=='function') return '—';
      const cap = equipSocketLimit(def);
      if(!cap) return '—';
      const cur = socketCurrentCount(item);
      const max = typeof socketMaxSetting==='function' ? socketMaxSetting(item) : cap;
      return `${cur}/${max}`;
    }

    return `
    <tr>
      <td ${nameStyleAttr} ${tooltipAttr}>${d2Prefix}${getItemName(it.id)}${d2Suffix}</td>
      <td style="color:var(--text3);font-size:11px">${it.id}</td>
      <td><input type="number" value="${it.cnt||1}" min="1" style="width:60px"
                 onchange="updateItemField('${type}',${i},'cnt',this.value)"></td>
      <td><input type="number" value="${it.en||0}" min="0" max="99" style="width:48px"
                 onchange="updateItemField('${type}',${i},'en',this.value)"></td>
      <td style="text-align:center;color:var(--text3);font-size:12px">${socketShort(it)}</td>
      <td class="inv-attr-cell">
        <select style="font-size:12px;background:var(--bg3);border:1px solid var(--border);
                       color:var(--text);border-radius:3px;padding:2px 3px;width:72px"
                onchange="updateItemField('${type}',${i},'attr',this.value||false)">
          ${attrOpts(it.attr||'')}
        </select>
      </td>
      <td class="inv-attr-cell">
        <select style="font-size:12px;background:var(--bg3);border:1px solid var(--border);
                       color:var(--text);border-radius:3px;padding:2px 3px;width:88px"
                ${eligible?'':'disabled'} title="${eligible?'選擇屬性魔法':'只有五階屬性裝備才能附加屬性魔法'}"
                onchange="updateItemField('${type}',${i},'attrMagic',this.value||false)">
          ${attrMagicOptHTML(it.attrMagic||'')}
        </select>
        <select style="width:52px;margin-left:2px" title="星級(1~3)"
               ${eligible && it.attrMagic ? '' : 'disabled'}
               onchange="updateItemField('${type}',${i},'attrMagicStar',this.value)">
          ${starOptHTML(it.attrMagicStar||1)}
        </select>
      </td>
      <td>
        <select style="font-size:12px;background:var(--bg3);border:1px solid var(--border);
                       color:var(--text);border-radius:3px;padding:2px 3px;width:60px"
                onchange="updateItemAncField('${type}',${i},this.value)">
          ${ancOpts(it.anc)}
        </select>
      </td>
      <td><input type="checkbox" ${it.bless?'checked':''}
                 onchange="updateItemField('${type}',${i},'bless',this.checked)"></td>
      <td><input type="checkbox" ${it.lock?'checked':''}
                 onchange="updateItemField('${type}',${i},'lock',this.checked)"></td>
      <td style="text-align:center;padding:2px 6px">
        <input type="checkbox" class="item-row-chk" data-idx="${i}"
               ${_sel[type].has(i)?'checked':''}
               onchange="_onItemCheck('${type}',${i},this.checked)">
      </td>
    </tr>`;
  }).join('');

  // 把最後一欄標題改名為「刪除」，並移除舊的注入 checkbox th
  const thead = tbody.closest('table') && tbody.closest('table').querySelector('thead tr');
  if(thead){
    // 移除之前注入的 checkbox th（如果有）
    const old = thead.querySelector('.chk-th');
    if(old) old.remove();
    // 最後一欄改名為「刪除」
    const ths = thead.querySelectorAll('th');
    const lastTh = ths[ths.length - 1];
    if(lastTh && lastTh.textContent.trim() !== '刪除') lastTh.textContent = '刪除';
  }

  _ensureFloatBtn(type);
  _updateFloatBtn(type);
}

function updateItemAncField(type, idx, val){
  const list = type === 'inv' ? G.p.inv : G.wh.items;
  if(!list[idx]) return;
  list[idx].anc = val === '' ? false : (val === 'true' ? true : val);
}

function updateItemField(type, idx, field, val){
  const list = type === 'inv' ? G.p.inv : G.wh.items;
  const it = list[idx];
  if(!it) return;
  if(field === 'cnt' || field === 'en'){
    it[field] = parseInt(val) || 0;
  } else if(field === 'attr'){
    it[field] = (val === false || val === '' || val === 'false') ? false : val;
    if(it.attrMagic && !attrMagicStillValid(it.id, it.attr, it.attrMagic)){
      it.attrMagic = false;
      it.attrMagicStar = 1;
      toast('⚠️ 屬性已變更，原本附加的屬性魔法不再符合條件，已自動清除', 'warn', 4000);
      renderItemTable(type);
    } else {
      renderItemTable(type);
    }
  } else if(field === 'attrMagic'){
    if(!val || val === 'false'){
      it.attrMagic = false;
      it.attrMagicStar = 1;
    } else if(!isTier5AttrWeapon(it.id, it.attr)){
      toast('⚠️ 只有「五階屬性裝備」才能附加屬性魔法', 'err', 4000);
    } else if(ATTR_MAGIC_BY_SKILL[val] !== (ATTR_AFFIX[attrCanon(it.attr)]||{}).ele){
      toast('⚠️ 屬性魔法必須跟裝備的屬性詞綴同元素', 'err', 4000);
    } else {
      it.attrMagic = val;
      if(!it.attrMagicStar) it.attrMagicStar = 1;
    }
    renderItemTable(type);
  } else if(field === 'attrMagicStar'){
    it[field] = Math.max(1, Math.min(3, parseInt(val) || 1));
  } else {
    it[field] = val;
  }
}
