
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
  return `${prefix}<span class="${nameCls}">${enStr}${setPrefix}${db.n}</span>`;
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