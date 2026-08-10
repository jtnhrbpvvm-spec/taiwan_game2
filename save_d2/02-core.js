// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════
// 第二段：全域狀態 + 工具函式 + 基本資料 + 屬性 + SIG1
// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════


// ════════════════════════════════════════════════
//  全域狀態
// ════════════════════════════════════════════════
let _rawSave = null;

let G = {
  p: {
    name:'', cls:'mage', lv:1, exp:0,
    hp:12, mhp:12, mp:6, mmp:6,   // mage Lv1：對齊 CLASS_HPMP_TABLE.mage 的 hpBase/mpBase（切職業時 onClassChange() 會重算）
    gold:1000, avatar:'女法師',
    classicMode:false,
    mastery:null, masteryQuest:null, masteryChangeCnt:0,
    buffs:{ haste:0, brave:0, blue:0, cautious:0, elfcookie:0, poly:0, shield:0 },
    base:    { str:25, dex:25, con:25, int:25, wis:25, cha:25 },
    panacea: { str:0,  dex:0,  con:0,  int:0,  wis:0,  cha:0  },
    alloc:   { str:0,  dex:0,  con:0,  int:0,  wis:0,  cha:0  },
    bonus:0, panaceaUsed:0,
    skills:[], grantedSkills:[], inv:[],
    equipDex:{}, cardDex:{}, miscDex:{}, relicDex:{}, junkPrefs:{},
    eq:{
      wpn:   null, helm:  null, armor: null, shield:null,
      cloak: null, tshirt:null, gloves:null, boots: null,
      ring1: null, ring2: null, ring3: null, ring4: null,
      amulet:null, ear1:  null, ear2:  null, belt:  null,
      rem_claw:null, rem_eye:null, rem_blood:null, rem_flesh:null,
      rem_heart:null, rem_bone:null, rem_fang:null, rem_scale:null,
      eye:null,
    },
    config:{
      setPot:'potion_heal', setHpPot:70, setAutoBuyPot:false,
      selAtkSkill:'', setMpAtk:50,
      selHealSkill:'', setMpHeal:50,
      selConvertSkill:'', setHpConvert:50,
      setHaste:false, setAutoBuyHaste:false,
      setBrave:false, setAutoBuyBrave:false,
      setBlue:false,  setAutoBuyBlue:false,
      setCautious:false, setAutoBuyCautious:false,
      setElfcookie:false, setAutoBuyElfcookie:false,
      setPoly:false,  setAutoBuyPoly:false,
      setMagicbarrier:false,
      setTeleport:false, setAutoBuyTeleport:false,
      autoBuffSkills:{},
    },
    siege:{
      active:false, gateKilled:false, towerKilled:false,
      endTime:0, kills:0, result:null, cooldownUntil:0,
      rewardPending:false, victoryUntil:0, accCdUntil:0,
      city:'kent', victoryCity:null,
    },
    dead:false,
    bloodPledge:null, magicShieldCd:0,
    lastMapByCat:{}, tracking:null, poly:null, allies:[], summon:null, charmed:null,
    manualCd:{}, elfEle:null,
    hots:{},
    cds:{ pot:0, atkSk:0, healSk:0, purifySk:0, convertSk:0 },
    statuses:{
      stun:0, freeze:0, stone:0, poison:0, poisonDmg:0, poisonTick:0,
      burn:0, burnDmg:0, burnTick:0, scald:0, scaldDmg:0, scaldTick:0,
      bleed:0, bleedDmg:0, bleedTick:0, sleep:0, silence:0, paralyze:0,
      magicseal:0, armorBreak:0, slowAtk:0, cleave:0, evilAura:0,
    },
    d:{
      str:0,dex:0,con:0,int:0,wis:0,cha:0,
      meleeDmg:0,meleeHit:0,meleeCrit:0,rangedDmg:0,rangedHit:0,rangedCrit:0,
      extraDmg:0,extraHit:0,magicDmg:0,magicHit:0,magicCrit:0,
      extraMp:0,mpReduce:0,meleeCritDmg:50,rangedCritDmg:50,magicCritDmg:50,
      ac:0,mr:0,er:0,dr:0,resFire:0,resWater:0,resEarth:0,resWind:0,
      hpRegenMax:0,hpR:0,mpR:0,aspd:0,crushDr:0,meleeHaste:0,atkSpdPct:0,
      hpRegenFaster:0,noEvade:false,critDmgLowHp:null,thornsDmg:0,instakillFull:0,
      onDmgHeal:null,onDmgHealCd:0,onDmgHealName:'',hurtExplode:0,fireNullify:false,
      wearerEle:'',physDrGated:0,lowMpRegenBonus:0,moveSpeedPct:0,bossEncounterPct:0,
      corrosiveJellySkin:false,charmOnHit:false,poisonHealMult:0,dotCrit:false,
      dmgReflect:0,fullHpMpHalf:false,eleWpnMult:null,equipExtraAtk:0,
      immStone:false,immPoison:false,immSilence:false,resNone:0,
      hitstun:5,hitstunReduce:0,castLock:10,supportCastLock:10,
      _cardWeightBonus:0,_equipWeightBonus:0,_miscWeightBonus:0,
      intSp:0,itemSp:0,weightPct:0,loadTier:0,aspdOff:0,
    },
    pvpOn:false, pvpRevengeList:[], socialNpcContacts:[],
    _roleEpoch:null, clanName:null, expMigV:3,
    _equipHaste:false, _setPoly:null, _sherineSetCnt:{}, _equipPetHit:0,
    _miscPotionBonus:0, _antHelperDr:0, _allLures:false,
    lastTownVisited:'', autoSellGlobal:false, guardsV2:[],
    pvpAlignLock:{}, pvpKillWhispers:[], antharasClearDay:0,
    // 套裝旗標
    _setRedLion5:false, _setWhiteBird5:false,
    _setIron3:false,    _setIron5:false,
    _setBeauty5:false,  _setGale5:false,
    _setMoon5:false,    _setApprentice5:false,
    _setWitch5:false,   _witchResCnt:0,
    _setShadow3:false,  _setShadow5:false,
    _setIllusion2:false,_setIllusion3:false, _setIllusion5:false,
    _setDragonblood2:false,_setDragonblood3:false,_setDragonblood5:false,
    _setFury5:false,
  },
  wh:{ gold:0, items:[] },
  pets:[],
  diamonds:0,   // 🔶 龍之鑽石：帳號共用資料，獨立於角色 p 之外
  // 🔶 頂層戰鬥/世界狀態：新角色沒有這些會導致遊戲讀檔異常（v3.8.19 v2 schema必要欄位）
  ms:{ current:'town_talking', mobs:[null,null,null,null,null], targetIdx:0, forceBoss:false, spawnAt:[0,0,0,0,0] },
  ticks:0,
  // 🔶 血盟資料：13-shop-save.js匯入驗證要求 clanState.modes / clanState.members 必須是真值，
  // null 會被判定「血盟資料格式不正確」而直接匯入失敗。這裡的結構對照 25-clan-system.js 的
  // _clanDefaultState()——是遊戲自己定義的「尚無血盟」空狀態，不是編造的假資料。
  // npcWorlds 維持 null：NPC血盟世界由遊戲首次tick時lazy生成，不需要在此預先造假資料。
  clanState:{ v:2, xp:0, modes:{ normal:null, classic:null }, members:{}, npcWorlds:{ normal:null, classic:null }, updatedAt:Date.now() }
};

// ════════════════════════════════════════════════
//  Toast
// ════════════════════════════════════════════════
function toast(msg, type='info', dur=2500){
  const area = document.getElementById('toastArea');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(()=>el.remove(), dur);
}

// ════════════════════════════════════════════════
//  輔助工具
// ════════════════════════════════════════════════
function setVal(id, v){
  const e = document.getElementById(id);
  if(e) e.value = (v === null || v === undefined) ? '' : v;
}
function getNum(id, def=0){
  return parseInt(document.getElementById(id)?.value) || def;
}
function getStr(id){
  return document.getElementById(id)?.value || '';
}
function getBool(id){
  return !!(document.getElementById(id)?.checked);
}
function setBool(id, v){
  const e = document.getElementById(id);
  if(e) e.checked = !!v;
}
function genUID(){
  return Math.random().toString(36).slice(2, 11);
}

// 深度合併（保留原始物件中編輯器未覆蓋的欄位）
function deepMerge(target, source){
  if(!source || typeof source !== 'object') return target;
  const out = Object.assign({}, target);
  for(const k of Object.keys(source)){
    if(source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])){
      out[k] = deepMerge(target[k] || {}, source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

// ════════════════════════════════════════════════
//  分頁切換
// ════════════════════════════════════════════════
function showPanel(id, el){
  applyAll(true);   // 🔒 切換分頁前先把目前分頁的輸入內容存回 G，避免跨分頁編輯遺失
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  el.classList.add('active');
  if(id === 'skills')     renderSkillPanel();
  if(id === 'buffs')      renderBuffPanel();
  if(id === 'jsonpanel')  syncJsonEditor();
  if(id === 'eq')         renderEqPanel();
  if(id === 'stats')      renderStatsPanel();
  if(id === 'partners')   renderPartnerList();
  if(id === 'dex')        { renderDexEquip(); renderDexCard(); }
  if(id === 'advanced')   loadAdvancedUI();
  if(id === 'growth')     { growthPanelReset(); renderGrowthPanel(); }
  if(id === 'config')     loadConfigUI();
  if(id === 'itemlookup'){
    const frame = document.getElementById('itemLookupFrame');
    if(!frame.src){ frame.src = '掉落物查詢系統.html'; } // 第一次切換到此分頁才載入，避免影響開檔速度
  }
}

// ════════════════════════════════════════════════
//  基本資料面板
// ════════════════════════════════════════════════
function gameModeToStr(classic, trad){
  if (classic && trad) return 'both';
  if (classic)          return 'classic';
  if (trad)             return 'trad';
  return 'normal';
}
function gameModeFromStr(mode){
  return { classic: (mode === 'classic' || mode === 'both'), trad: (mode === 'trad' || mode === 'both') };
}

function loadBasicUI(){
  const p = G.p;
  setVal('f_name',    p.name           || '');
  setVal('f_cls',     p.cls            || 'mage');
  setVal('f_avatar',  p.avatar         || '女法師');
  setVal('f_lv',      p.lv             || 1);
  setVal('f_exp',     p.exp            || 0);
  setVal('f_align',   p.alignmentValue ?? 0);
  setVal('f_hp',      p.hp             || 0);
  setVal('f_mhp',     p.mhp            || 0);
  setVal('f_mp',      p.mp             || 0);
  setVal('f_mmp',     p.mmp            || 0);
  setVal('f_gold',    p.gold           || 0);
  setVal('f_trial',   p.trialStage     ?? p.trial   ?? 0);
  setVal('f_flame',   p.flameAffinity  ?? p.flame   ?? 0);
  setVal('f_diamonds', G.diamonds ?? 0);
  setVal('f_enseed', p.enSeed || '(尚未產生，舊存檔會由名稱+職業推算)');
  setVal('f_lastmap', p.lastBattleMap  || p.lastmap || '');
  // 精通
  setVal('f_mastery',          p.mastery          || '');
  setVal('f_masteryChangeCnt', p.masteryChangeCnt || 0);
  setVal('f_masteryQuest',     p.masteryQuest     || '');
  // checkbox / 模式
  setVal('f_gameMode', gameModeToStr(p.classicMode || false, p.traditionalMode || p.trad || false));
  setBool('f_sherine',          p.sherineWorld    || p.sherine || false);
  setBool('f_prideBeatJenis',   p.prideBeatJenis  || false);
  setBool('f_demonTempleOpen',  p.demonTempleOpen || false);
}

function saveBasicToG(){
  const p = G.p;
  p.name             = getStr('f_name');
  p.cls              = getStr('f_cls');
  p.avatar           = getStr('f_avatar');
  p.lv               = getNum('f_lv', 1);
  p.exp              = getNum('f_exp');
  p.alignmentValue   = Math.max(-32768, Math.min(32767, getNum('f_align', 0)));
  p.hp               = getNum('f_hp');
  p.mhp              = getNum('f_mhp');
  p.mp               = getNum('f_mp');
  p.mmp              = getNum('f_mmp');
  p.gold             = getNum('f_gold');
  p.trialStage       = getNum('f_trial');
  p.flameAffinity    = getNum('f_flame');
  G.diamonds         = getNum('f_diamonds');
  p.lastBattleMap    = getStr('f_lastmap');
  // 精通
  const mVal         = getStr('f_mastery');
  p.mastery          = mVal || null;
  p.masteryChangeCnt = getNum('f_masteryChangeCnt');
  const mqVal        = getStr('f_masteryQuest');
  p.masteryQuest     = mqVal || null;
  // checkbox / 模式
  const gm = gameModeFromStr(getStr('f_gameMode'));
  p.classicMode      = gm.classic;
  p.traditionalMode  = gm.trad;
  p.sherineWorld     = getBool('f_sherine');
  p.prideBeatJenis   = getBool('f_prideBeatJenis');
  p.demonTempleOpen  = getBool('f_demonTempleOpen');
  // 向後相容欄位
  p.trial   = p.trialStage;
  p.flame   = p.flameAffinity;
  p.lastmap = p.lastBattleMap;
  p.trad    = p.traditionalMode;
  p.sherine = p.sherineWorld;
}

function fullRestore(){
  setVal('f_hp', getNum('f_mhp') || 100);
  setVal('f_mp', getNum('f_mmp') || 50);
  toast('已補滿 HP / MP', 'ok');
}

// 正義值即時驗證：範圍固定 -32768 ~ +32767（16位元整數範圍），超過就自動修正到邊界值並提示
function onAlignFieldChange(){
  const raw = getNum('f_align', 0);
  if(raw > 32767){
    setVal('f_align', 32767);
    toast('⚠️ 正義值可輸入範圍為 -32768 ~ +32767，已自動修正為 32767', 'warn', 4000);
  } else if(raw < -32768){
    setVal('f_align', -32768);
    toast('⚠️ 正義值可輸入範圍為 -32768 ~ +32767，已自動修正為 -32768', 'warn', 4000);
  }
}

// ════════════════════════════════════════════════
//  等級 / 經驗值 / HP / MP 換算公式
//  （與遊戲 00-data.js 的經驗表、02-stats-recompute.js 的職業HP/MP成長表對齊）
// ════════════════════════════════════════════════

// 經驗需求表：index = 等級。Lv1-69 沿用天堂經典版數值；Lv70-99 以 Lv69 錨點依「等級²+1」比例換算。
const EXP_REQ_CLASSIC_V2 = [0,
    3, 16, 50, 113, 245, 485, 898, 1584, 2685, 4407,
    7043, 11005, 16865, 25408, 37702, 55190, 79799, 114083, 161403, 226142,
    313974, 432193, 590100, 799479, 1075145, 1435599, 1903780, 2507936, 3282607, 4269738,
    5519907, 7093682, 9063076, 11513098, 14543375, 18269802, 22826176, 28365775, 35062787, 35413415,
    35774602, 36244146, 36854552, 37648081, 38679668, 40020732, 41764114, 44030511, 46976827, 50807038,
    55786313, 62259370, 70674343, 81613809, 95835115, 114322812, 138356819, 169601028, 210218499, 263021211,
    331664738, 420901322, 443914114, 558686964, 705596211, 893640048, 1134336160, 1442427182, 1836783691,
    2341899206, 2988263387, 3816012345, 4876863777, 6237508771, 7984011227, 10227518382, 13111678566, 16822283600, 21599812142,
    27755758602, 35693905562, 45938056458, 59168216718, 76267831350, 98385502442, 127015683653, 164104263280, 212186812421, 274569735273,
    355567807179, 460815878104, 597678193901, 775786295683, 1007746398092, 1310070317520, 1703091412776, 2214018836609, 2878224487592, 3741691833870
];
const EXP_REQ_LV69_KILLS = Math.ceil(EXP_REQ_CLASSIC_V2[69] / (69 * 69 + 1));
const EXP_REQ_CLASSIC = EXP_REQ_CLASSIC_V2.map((req, lv) =>
    (lv >= 70 && lv < 100) ? (lv * lv + 1) * EXP_REQ_LV69_KILLS : req);
// 取得「到達該等級」所需的最低經驗值（即該等級的起始經驗，也就是升上該等級當下的經驗值）
function getExpReq(lv){
  if(lv >= 100) return Infinity;   // 遊戲本身等級上限就是100級，不存在101級的門檻經驗值
  return EXP_REQ_CLASSIC[lv] || Infinity;
}
// 依經驗值反推應落在哪一等級（最高100級）
function levelFromExp(exp){
  let lv = 1;
  for(let l = 1; l < 100; l++){
    if(exp >= getExpReq(l)) lv = l + 1; else break;
  }
  return Math.min(lv, 100);
}

// 職業 Lv1 基礎值與每級固定成長量（不含體質/精神加成部分）
const CLASS_HPMP_TABLE = {
  knight:   { hpBase:16, hpInc:8.5,  mpBase:1, mpInc:1    },
  elf:      { hpBase:15, hpInc:7.3,  mpBase:5, mpInc:2.83 },
  dark:     { hpBase:12, hpInc:10.5, mpBase:3, mpInc:3    },
  illusion: { hpBase:14, hpInc:7.5,  mpBase:5, mpInc:3.2  },
  dragon:   { hpBase:16, hpInc:4.5,  mpBase:2, mpInc:0.7  },
  warrior:  { hpBase:16, hpInc:9,    mpBase:1, mpInc:0.5  },
  royal:    { hpBase:14, hpInc:10,   mpBase:2, mpInc:1.5  },
  mage:     { hpBase:12, hpInc:4.3,  mpBase:6, mpInc:4.5  }, // 其餘未列職業（法師等）沿用預設值
};
function classHpMpTable(cls){
  return CLASS_HPMP_TABLE[cls] || CLASS_HPMP_TABLE.mage;
}

// 體質(CON)/精神(WIS)對HP/MP每級成長的實際加成公式，未在提供的js檔中找到（getConGrowth/getWisGrowth
// 未出現在 00-data.js / 02-stats-recompute.js），因此改用「匯入存檔當下」的等級與最大HP/MP、
// 搭配當時的CON/WIS總和，反推出「每1點CON/WIS對應多少每級HP/MP成長」的校準比例（假設線性關係）。
// 之後不論是修改等級/經驗值，或是調整屬性欄位，都用這個校準比例＋當下的CON/WIS重新計算，
// 這樣才能讓「更改CON/WIS」確實反映在HP/MP上。Lv1存檔因分母為0無法校準，此時比例視為0
// （只用職業固定成長，直到之後有更高等級的資料可校準為止）。
function calibrateGrowth(){
  const cls = G.p?.cls || 'mage';
  const t   = classHpMpTable(cls);
  const lv  = G.p?.lv || 1;
  const mhp = G.p?.mhp ?? t.hpBase;
  const mmp = G.p?.mmp ?? t.mpBase;
  const con = statTotalFromP('con');
  const wis = statTotalFromP('wis');
  let conPerPoint = 0, wisPerPoint = 0;
  if(lv > 1){
    const totalHpGrowth = (mhp - t.hpBase) / (lv - 1);
    const totalMpGrowth = (mmp - t.mpBase) / (lv - 1);
    conPerPoint = con > 0 ? (totalHpGrowth - t.hpInc) / con : 0;
    wisPerPoint = wis > 0 ? (totalMpGrowth - t.mpInc) / wis : 0;
  }
  G._growthCalib = { hpBase:t.hpBase, mpBase:t.mpBase, hpClsInc:t.hpInc, mpClsInc:t.mpInc, conPerPoint, wisPerPoint };
}
// 讀取 G.p 裡三層屬性（base+panacea+alloc）的總和，供匯入當下校準使用（此時DOM欄位可能尚未渲染）
function statTotalFromP(k){
  return ((G.p?.base||{})[k]||0) + ((G.p?.panacea||{})[k]||0) + ((G.p?.alloc||{})[k]||0);
}
// 讀取畫面上目前三層屬性輸入框的總和（第四排「總和」的來源）
function statTotalFromUI(k){
  return ['base','panacea','alloc'].reduce((sum,tier)=>{
    const el = document.getElementById(`stat_${tier}_${k}`);
    return sum + (el ? (parseInt(el.value)||0) : 0);
  }, 0);
}

// 依目前校準比例＋畫面上的CON/WIS總和，計算指定等級的最大HP/MP
function computeHpMpForLevel(lv){
  if(!G._growthCalib) calibrateGrowth();
  const cal = G._growthCalib;
  const con = statTotalFromUI('con');
  const wis = statTotalFromUI('wis');
  const hpGrowth = cal.hpClsInc + cal.conPerPoint * con;
  const mpGrowth = cal.mpClsInc + cal.wisPerPoint * wis;
  const mhp = Math.max(1, Math.floor(cal.hpBase + (lv - 1) * hpGrowth));
  const mmp = Math.max(0, Math.floor(cal.mpBase + (lv - 1) * mpGrowth));
  return { mhp, mmp };
}

// 切換職業下拉選單時：職業會決定HP/MP的基礎值與每級成長（CLASS_HPMP_TABLE），
// 但HP/MP欄位是唯讀、只在「修改等級/經驗值」或調整CON/WIS時才會重算，
// 若切換職業時不觸發重算，畫面會停留在舊職業的HP/MP數值，跟新職業對不上。
function onClassChange(){
  if(!G.p) return;
  G.p.cls = getStr('f_cls');           // 先寫回G，calibrateGrowth()才能抓到新職業
  calibrateGrowth();
  const lv = getNum('f_lv', 1);
  const { mhp, mmp } = computeHpMpForLevel(lv);
  setVal('f_mhp', mhp);
  setVal('f_mmp', mmp);
  setVal('f_hp',  mhp);                // 換職業視同重新計算，順便補滿目前HP/MP
  setVal('f_mp',  mmp);
  toast(`已依新職業重算：最大HP=${mhp}／最大MP=${mmp}`, 'ok', 3000);
}

function openLvExpModal(){
  setVal('lvExpInput', getNum('f_lv', 1));
  document.getElementById('lvExpPreview').textContent = '';
  document.getElementById('lvExpModal').classList.add('show');
}
function closeLvExpModal(){
  document.getElementById('lvExpModal').classList.remove('show');
}

function applyLvExpChange(mode){
  const input = getNum('lvExpInput', 0);

  let newLv, newExp, wasCapped = false;
  if(mode === 'lv'){
    wasCapped = input > 100;
    newLv  = Math.max(1, Math.min(100, input));   // 遊戲等級上限就是100級
    // 填入「到達該等級所需的最低經驗值 +10」，避免剛好卡在門檻上被判定未正確升級；
    // 100級沒有「升上101級」的門檻經驗值，改用99級門檻代表已經滿級
    newExp = (newLv >= 100 ? getExpReq(99) : getExpReq(newLv)) + 10;
  } else {
    newExp = Math.max(0, input);
    newLv  = levelFromExp(newExp);
  }

  const { mhp, mmp } = computeHpMpForLevel(newLv);

  setVal('f_lv',  newLv);
  setVal('f_exp', newExp);
  setVal('f_mhp', mhp);
  setVal('f_mmp', mmp);
  setVal('f_hp',  mhp); // 一併補滿目前HP/MP
  setVal('f_mp',  mmp);

  closeLvExpModal();
  const msg = wasCapped
    ? `⚠️ 超過等級上限，遊戲最高等級為100級，系統已自行修正至100級。以套用 Lv.${newLv}（經驗值 ${newExp}），最大HP=${mhp}／最大MP=${mmp}`
    : `已套用 Lv.${newLv}（經驗值 ${newExp}），最大HP=${mhp}／最大MP=${mmp}`;
  toast(msg, wasCapped ? 'warn' : 'ok', 4000);
}

function maxAll(){
  const { mhp, mmp } = computeHpMpForLevel(100);
  setVal('f_gold', 999999999);
  setVal('f_lv',   100);
  setVal('f_exp',  getExpReq(99) + 10);
  setVal('f_mhp',  mhp);
  setVal('f_mmp',  mmp);
  fullRestore();
  toast('已最大化', 'ok');
}

// ════════════════════════════════════════════════
//  屬性面板
// ════════════════════════════════════════════════
const STAT_KEYS   = ['str','dex','con','int','wis','cha'];
const STAT_LABELS = { str:'力量', dex:'敏捷', con:'體力', int:'智力', wis:'精神', cha:'魅力' };

function renderStatsPanel(){
  ['base','panacea','alloc'].forEach(tier => {
    const grid = document.getElementById('stat-' + tier);
    if(!grid) return;
    grid.innerHTML = STAT_KEYS.map(k => {
      const v = (G.p[tier] || {})[k] || 0;
      return `
      <div class="stat-cell">
        <label>${STAT_LABELS[k]}</label>
        <input type="number" id="stat_${tier}_${k}" data-prev="${v}"
               value="${v}" min="0" max="100"
               onchange="onStatInputChange('${tier}','${k}')">
      </div>`;
    }).join('');
  });
  const totalGrid = document.getElementById('stat-total');
  if(totalGrid){
    totalGrid.innerHTML = STAT_KEYS.map(k => `
      <div class="stat-cell">
        <label>${STAT_LABELS[k]}</label>
        <input type="number" id="stat_total_${k}" value="0" readonly>
      </div>`).join('');
  }
  updateStatTotalRow();
}

// 更新第四排「總和」顯示（唯讀，= 基礎+仙丹+分配）
function updateStatTotalRow(){
  STAT_KEYS.forEach(k => {
    const el = document.getElementById('stat_total_' + k);
    if(el) el.value = statTotalFromUI(k);
  });
}

// 基礎/仙丹/分配三排任一數值變動時：檢查該屬性總和是否超過100，超過就跳回原始數值並跳窗提示；
// 未超過則更新總和列，若改到的是體質(CON)/精神(WIS)則同時重算HP/MP上限。
function onStatInputChange(tier, k){
  const el = document.getElementById(`stat_${tier}_${k}`);
  if(!el) return;
  let v = parseInt(el.value);
  if(isNaN(v) || v < 0) v = 0;
  el.value = v;

  const sum = statTotalFromUI(k);
  if(sum > 100){
    const prev = parseInt(el.dataset.prev || '0');
    el.value = prev;
    updateStatTotalRow();
    alert(`${STAT_LABELS[k]}（${tier === 'base' ? '基礎' : tier === 'panacea' ? '仙丹' : '分配'}）總和不能超過100，已還原成修改前的數值。`);
    return;
  }

  el.dataset.prev = v;
  updateStatTotalRow();

  if(k === 'con' || k === 'wis'){
    recalcHpMpFromStats();
  }
}

// 依目前等級與畫面上的CON/WIS總和重算HP/MP上限，若目前HP/MP超過新上限則一併夾住
function recalcHpMpFromStats(){
  const lv = getNum('f_lv', 1);
  const { mhp, mmp } = computeHpMpForLevel(lv);
  setVal('f_mhp', mhp);
  setVal('f_mmp', mmp);
  if(getNum('f_hp', 0) > mhp) setVal('f_hp', mhp);
  if(getNum('f_mp', 0) > mmp) setVal('f_mp', mmp);
}

function saveStatsToG(){
  ['base','panacea','alloc'].forEach(tier => {
    if(!G.p[tier]) G.p[tier] = {};
    STAT_KEYS.forEach(k => {
      const el = document.getElementById(`stat_${tier}_${k}`);
      if(el) G.p[tier][k] = parseInt(el.value) || 0;
    });
  });
}

function maxStats(tier, max){
  STAT_KEYS.forEach(k => {
    const el = document.getElementById(`stat_${tier}_${k}`);
    if(!el) return;
    const others = statTotalFromUI(k) - (parseInt(el.value) || 0); // 其餘兩排目前總和
    const capped = Math.max(0, Math.min(max, 100 - others));       // 不能讓總和超過100
    el.value = capped;
    el.dataset.prev = capped;
  });
  updateStatTotalRow();
  recalcHpMpFromStats(); // con/wis 可能也在裡面被改到，一併重算
}

// ════════════════════════════════════════════════
//  SIG1 簽章系統（與遊戲完全對齊）
// ════════════════════════════════════════════════
function _seedHash(str){
  str = String(str);
  let h = 1779033703 ^ str.length;
  for(let i = 0; i < str.length; i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

const _SAVE_SALT = 'fb5#9c3a7e1d-save-integrity-salt-do-not-edit#a1b2c3';

function _signSave(s){
  let a = _seedHash(_SAVE_SALT + '::' + s);
  let b = _seedHash(s + '::' + _SAVE_SALT + '::' + a);
  return (a >>> 0).toString(36) + '.' + (b >>> 0).toString(36) + '.' + (s.length).toString(36);
}

function buildSIG1(payloadStr){
  return 'SIG1:' + _signSave(payloadStr) + ':' + payloadStr;
}

// 🧬 角色種子（enSeed）：遊戲用它判斷「匯入的存檔是不是跟其他存檔格是同一個角色」
// （13-shop-save.js 的 importSave：enSeed 相同 → 視為重複角色，拒絕匯入），
// 也是強化成敗的決定論種子。格式比照遊戲 startGame() 建立新角色時的寫法：'es' + 隨機碼 + 隨機碼。
function _genEnSeed(){
  const rnd = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return 'es' + rnd() + rnd();
}
function reissueEnSeed(){
  const msg = '右側「換發身分證」按鈕：按下後會產生一組全新、跟任何現有角色都不會撞號的身分證。\n\n' +
              '改完存檔資料後，先按「換發身分證」換一組新的，再按「匯出存檔」，這樣匯入到別的存檔格時就不會再被判定成重複角色。\n\n' +
              '小提醒：身分證同時也是強化機率的決定論種子，換了新的之後，未來的強化成敗結果也會跟著改變。\n\n' +
              '確定要現在換發新的身分證嗎？';
  if(!confirm(msg)) return;
  if(!G.p) G.p = {};
  G.p.enSeed = _genEnSeed();
  setVal('f_enseed', G.p.enSeed);
  toast('🧬 已換發新的身分證，匯出後可視為新角色匯入不同存檔格', 'ok', 4000);
}
// 簽章演算法（_seedHash / _signSave / _SAVE_SALT）完全沒有更動，遊戲端驗證邏輯不受影響。
// 🎲 每次「換發」用的亂數欄位：只用來讓 payload 內容不同，藉此讓 SIG1 雜湊跟著改變。
function _genExportNonce(){
  const padLen = 1 + Math.floor(Math.random() * 16); // 隨機 1~16 字元，讓整份 payload 長度每次不同
  let pad = '';
  for(let i = 0; i < padLen; i++) pad += Math.floor(Math.random() * 36).toString(36);
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + '-' + pad;
}

// 🪪 目前的身分證亂數：資料編輯、一般匯出都不會改變它；
// 只有「換發身分證」（或匯入檔案本身帶有不同亂數）才會更新。
let _sig1Nonce = _genExportNonce();

// 🔶 組出目前存檔的完整基底物件（p/wh/pets/pandoraDiamonds + 頂層 v/ms/ticks/clanState）。
// 有 _rawSave（讀檔進來的既有存檔）時，v/ms/ticks/clanState 直接沿用 _rawSave 本身的值（來自玩家真實存檔，不能亂改）；
// 沒有 _rawSave（全新角色/clearAll 之後）時，才補上 G.ms/G.ticks/G.clanState 這些新角色預設值。
// ⚠️ 這是本檔案唯一一處組裝存檔基底的地方，_computeCurrentSig1/exportJson/showSig1SourceModal/syncJsonEditor
// 全部呼叫這裡，不要各自複製一份，否則又會重演「_rawSave===null分支漏改」的舊坑（見PROJECT_HANDOFF §6.5）。
function _buildSaveBase(){
  return _rawSave
    ? Object.assign({}, _rawSave, { p: G.p, wh: G.wh, pets: G.pets, pandoraDiamonds: G.diamonds })
    : { v:2, p: G.p, ms: G.ms, ticks: G.ticks, wh: G.wh, pets: G.pets, pandoraDiamonds: G.diamonds, clanState: G.clanState };
}

// 依「目前面板資料 + 目前身分證亂數」即時算出身分證，供顯示與匯出共用。
function _computeCurrentSig1(){
  const base = _buildSaveBase();
  const withNonce = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  return buildSIG1(JSON.stringify(withNonce));
}
// 只取簽章本身（不含 SIG1: 前綴、也不含後面的 JSON payload）——顯示用，僅供辨識，不影響實際簽章與匯出內容
function _sig1DisplayOnly(signed){
  const first  = signed.indexOf(':');
  if(first < 0) return signed;
  const second = signed.indexOf(':', first + 1);
  return second < 0 ? signed.slice(first + 1) : signed.slice(first + 1, second);
}
function refreshSig1Display(){
  const el = document.getElementById('f_sig1');
  if(el) el.value = _sig1DisplayOnly(_computeCurrentSig1());
}

// 🆔 換發身分證：依規則（新亂數）產生一組新的身分證，資料本身不受影響；
// 之後按「匯出存檔」就會帶著這組新身分證匯出。
function reissueSig1(){
  _sig1Nonce = _genExportNonce();
  refreshSig1Display();
  toast('🆔 已換發新身分證', 'ok');
}

function parseSIG1(raw){
  if(raw == null) throw new Error('內容為空');
  const str = String(raw).trim();
  if(str.slice(0, 5) === 'SIG1:'){
    const rest = str.slice(5);
    const i    = rest.indexOf(':');
    if(i < 0) throw new Error('SIG1 格式毀損（缺少分隔符）');
    const sig     = rest.slice(0, i);
    const payload = rest.slice(i + 1);
    if(_signSave(payload) !== sig){
      toast('⚠️ 簽章不符，資料可能已被修改，仍嘗試載入', 'warn', 4000);
    }
    return JSON.parse(payload);
  }
  return JSON.parse(str);
}

// ════════════════════════════════════════════════
//  匯入 / 匯出 / 貼上
// ════════════════════════════════════════════════
function importJsonFile(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const parsed = parseSIG1(e.target.result.trim());
      _rawSave = parsed;
      G.p    = parsed.p    || G.p;
      G.wh   = parsed.wh   || G.wh;
      G.pets = parsed.pets || G.pets;
      G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
      _sig1Nonce = parsed._exportNonce || _genExportNonce();
      canonicalizeAttrCodes();
      loadAllUI();
      toast('✅ 存檔已匯入', 'ok');
    }catch(err){
      toast('❌ 解析失敗：' + err.message, 'err', 4000);
    }
  };
  reader.readAsText(file);
  evt.target.value = '';
}

function exportJson(){
  applyAll(true);
  const base   = _buildSaveBase();
  const out     = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  const payload = JSON.stringify(out);
  const signed  = buildSIG1(payload);
  const prev    = document.getElementById('sig1Preview');
  if(prev) prev.value = signed.slice(0, 300) + '…';
  const fSig1   = document.getElementById('f_sig1');
  if(fSig1) fSig1.value = _sig1DisplayOnly(signed);
  const blob    = new Blob([signed], { type:'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = 'save_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('💾 存檔已匯出', 'ok');
}

// ════════════════════════════════════════════════
//  顯示目前存檔的 SIG1 原始碼（供手動複製使用）
// ════════════════════════════════════════════════
function showSig1SourceModal(){
  applyAll(true);
  const base   = _buildSaveBase();
  const out     = Object.assign({}, base, { _exportNonce: _sig1Nonce });
  const payload = JSON.stringify(out);
  const signed  = buildSIG1(payload);
  const fSig1   = document.getElementById('f_sig1');
  if(fSig1) fSig1.value = _sig1DisplayOnly(signed);
  const el = document.getElementById('sig1SourceOutput');
  if(el) el.value = signed;
  document.getElementById('pasteModal').classList.add('show');
}

function copySig1Source(){
  const el = document.getElementById('sig1SourceOutput');
  if(!el || !el.value){ toast('內容為空', 'err'); return; }
  el.focus();
  el.select();
  el.setSelectionRange(0, 99999);
  const done = () => toast('📋 已複製到剪貼簿', 'ok');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(el.value).then(done).catch(() => {
      try{ document.execCommand('copy'); done(); }catch(e){ toast('❌ 複製失敗，請手動選取複製', 'err'); }
    });
  } else {
    try{ document.execCommand('copy'); done(); }catch(e){ toast('❌ 複製失敗，請手動選取複製', 'err'); }
  }
}

function openPasteModal(){
  document.getElementById('pasteModal').classList.add('show');
}
function closePasteModal(){
  document.getElementById('pasteModal').classList.remove('show');
}

function loadFromPaste(){
  const raw = document.getElementById('pasteInput').value.trim();
  if(!raw){ toast('內容為空', 'err'); return; }
  try{
    const parsed = parseSIG1(raw);
    _rawSave = parsed;
    G.p    = parsed.p    || G.p;
    G.wh   = parsed.wh   || G.wh;
    G.pets = parsed.pets || G.pets;
    G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
    _sig1Nonce = parsed._exportNonce || _genExportNonce();
    canonicalizeAttrCodes();
    loadAllUI();
    closePasteModal();
    document.getElementById('pasteInput').value = '';
    toast('✅ 存檔已載入', 'ok');
  }catch(e){
    toast('❌ 解析失敗：' + e.message, 'err', 4000);
  }
}

// ════════════════════════════════════════════════
//  JSON 面板
// ════════════════════════════════════════════════
function syncJsonEditor(){
  applyAll(true);
  const out = _buildSaveBase();
  const el = document.getElementById('jsonEditor');
  if(el) el.value = JSON.stringify(out, null, 2);
}

function applyJsonEditor(){
  try{
    const parsed = JSON.parse(document.getElementById('jsonEditor').value.trim());
    _rawSave = parsed;
    G.p    = parsed.p    || G.p;
    G.wh   = parsed.wh   || G.wh;
    G.pets = parsed.pets || G.pets;
    G.diamonds = parsed.pandoraDiamonds ?? parsed.diamonds ?? parsed.sharedDiamonds ?? G.diamonds ?? 0;
    _sig1Nonce = parsed._exportNonce || _genExportNonce();
    loadAllUI();
    toast('✅ JSON 已套用', 'ok');
  }catch(e){
    toast('❌ JSON 格式錯誤：' + e.message, 'err', 4000);
  }
}

function formatJson(){
  try{
    const el = document.getElementById('jsonEditor');
    el.value = JSON.stringify(JSON.parse(el.value), null, 2);
    toast('已格式化', 'info');
  }catch(e){
    toast('JSON 格式錯誤', 'err');
  }
}

// ════════════════════════════════════════════════
//  套用全部
// ════════════════════════════════════════════════
function applyAll(silent=false){
  saveBasicToG();
  saveStatsToG();
  saveEqToG();
  saveConfigToG();
  saveAdvancedToG();
  G.wh.gold = getNum('f_whgold');
  if(!silent) toast('✅ 已套用全部變更', 'ok');
}

// ════════════════════════════════════════════════
//  載入全部 UI
// ════════════════════════════════════════════════
function loadAllUI(){
  calibrateGrowth();
  loadBasicUI();
  loadConfigUI();
  loadAdvancedUI();
  renderStatsPanel();
  renderItemTable('inv');
  renderItemTable('wh');
  renderGrantedSkillList();
  renderAutoBuffSkillList();
  renderPartnerList();
  renderPetList();
  renderDexEquip();
  renderDexCard();
  renderJunkPrefsSummary();
  setVal('f_whgold', G.wh?.gold || 0);
  if(document.getElementById('panel-skills').classList.contains('active'))
    renderSkillPanel();
  if(document.getElementById('panel-eq').classList.contains('active'))
    renderEqPanel();
  if(document.getElementById('panel-buffs').classList.contains('active'))
    renderBuffPanel();
  if(document.getElementById('panel-growth').classList.contains('active'))
    renderGrowthPanel();
}

// ════════════════════════════════════════════════
//  清除全部
// ════════════════════════════════════════════════
function clearAll(){
  if(!confirm('確定清除所有資料？')) return;
  _rawSave = null;
  G = {
    p:{
      name:'', cls:'mage', lv:1, exp:0,
      hp:12, mhp:12, mp:6, mmp:6,   // mage Lv1：對齊 CLASS_HPMP_TABLE.mage
      gold:1000, avatar:'女法師',
      classicMode:false,
      mastery:null, masteryQuest:null, masteryChangeCnt:0,
      buffs:{ haste:0, brave:0, blue:0, cautious:0, elfcookie:0, poly:0, shield:0 },
      base:{str:25,dex:25,con:25,int:25,wis:25,cha:25},
      panacea:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
      alloc:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
      bonus:0, panaceaUsed:0,
      skills:[], grantedSkills:[], inv:[],
      equipDex:{}, cardDex:{}, miscDex:{}, relicDex:{}, junkPrefs:{},
      eq:{
        wpn:null,helm:null,armor:null,shield:null,
        cloak:null,tshirt:null,gloves:null,boots:null,
        ring1:null,ring2:null,ring3:null,ring4:null,
        amulet:null,ear1:null,ear2:null,belt:null,
        rem_claw:null,rem_eye:null,rem_blood:null,rem_flesh:null,
        rem_heart:null,rem_bone:null,rem_fang:null,rem_scale:null,
        eye:null,
      },
      config:{
        setPot:'potion_heal', setHpPot:70, setAutoBuyPot:false,
        selAtkSkill:'', setMpAtk:50,
        selHealSkill:'', setMpHeal:50,
        selConvertSkill:'', setHpConvert:50,
        setHaste:false, setAutoBuyHaste:false,
        setBrave:false, setAutoBuyBrave:false,
        setBlue:false, setAutoBuyBlue:false,
        setCautious:false, setAutoBuyCautious:false,
        setElfcookie:false, setAutoBuyElfcookie:false,
        setPoly:false, setAutoBuyPoly:false,
        setMagicbarrier:false,
        setTeleport:false, setAutoBuyTeleport:false,
        autoBuffSkills:{},
      },
      siege:{
        active:false,gateKilled:false,towerKilled:false,
        endTime:0,kills:0,result:null,cooldownUntil:0,
        rewardPending:false,victoryUntil:0,accCdUntil:0,
        city:'kent',victoryCity:null,
      },
      dead:false,
      bloodPledge:null, magicShieldCd:0,
      lastMapByCat:{}, tracking:null, poly:null, allies:[], summon:null, charmed:null,
      manualCd:{}, elfEle:null,
      hots:{},
      cds:{ pot:0, atkSk:0, healSk:0, purifySk:0, convertSk:0 },
      statuses:{
        stun:0, freeze:0, stone:0, poison:0, poisonDmg:0, poisonTick:0,
        burn:0, burnDmg:0, burnTick:0, scald:0, scaldDmg:0, scaldTick:0,
        bleed:0, bleedDmg:0, bleedTick:0, sleep:0, silence:0, paralyze:0,
        magicseal:0, armorBreak:0, slowAtk:0, cleave:0, evilAura:0,
      },
      d:{
        str:0,dex:0,con:0,int:0,wis:0,cha:0,
        meleeDmg:0,meleeHit:0,meleeCrit:0,rangedDmg:0,rangedHit:0,rangedCrit:0,
        extraDmg:0,extraHit:0,magicDmg:0,magicHit:0,magicCrit:0,
        extraMp:0,mpReduce:0,meleeCritDmg:50,rangedCritDmg:50,magicCritDmg:50,
        ac:0,mr:0,er:0,dr:0,resFire:0,resWater:0,resEarth:0,resWind:0,
        hpRegenMax:0,hpR:0,mpR:0,aspd:0,crushDr:0,meleeHaste:0,atkSpdPct:0,
        hpRegenFaster:0,noEvade:false,critDmgLowHp:null,thornsDmg:0,instakillFull:0,
        onDmgHeal:null,onDmgHealCd:0,onDmgHealName:'',hurtExplode:0,fireNullify:false,
        wearerEle:'',physDrGated:0,lowMpRegenBonus:0,moveSpeedPct:0,bossEncounterPct:0,
        corrosiveJellySkin:false,charmOnHit:false,poisonHealMult:0,dotCrit:false,
        dmgReflect:0,fullHpMpHalf:false,eleWpnMult:null,equipExtraAtk:0,
        immStone:false,immPoison:false,immSilence:false,resNone:0,
        hitstun:5,hitstunReduce:0,castLock:10,supportCastLock:10,
        _cardWeightBonus:0,_equipWeightBonus:0,_miscWeightBonus:0,
        intSp:0,itemSp:0,weightPct:0,loadTier:0,aspdOff:0,
      },
      pvpOn:false, pvpRevengeList:[], socialNpcContacts:[],
      _roleEpoch:null, clanName:null, expMigV:3,
      _equipHaste:false, _setPoly:null, _sherineSetCnt:{}, _equipPetHit:0,
      _miscPotionBonus:0, _antHelperDr:0, _allLures:false,
      lastTownVisited:'', autoSellGlobal:false, guardsV2:[],
      pvpAlignLock:{}, pvpKillWhispers:[], antharasClearDay:0,
      _setRedLion5:false,_setWhiteBird5:false,
      _setIron3:false,_setIron5:false,
      _setBeauty5:false,_setGale5:false,
      _setMoon5:false,_setApprentice5:false,
      _setWitch5:false,_witchResCnt:0,
      _setShadow3:false,_setShadow5:false,
      _setIllusion2:false,_setIllusion3:false,_setIllusion5:false,
      _setDragonblood2:false,_setDragonblood3:false,_setDragonblood5:false,
      _setFury5:false,
    },
    wh:{ gold:0, items:[] },
    pets:[],
    diamonds:0,
    ms:{ current:'town_talking', mobs:[null,null,null,null,null], targetIdx:0, forceBoss:false, spawnAt:[0,0,0,0,0] },
    ticks:0,
    // 血盟：對照 25-clan-system.js 的 _clanDefaultState()，null 會被 shop-save.js 判定格式錯誤
    clanState:{ v:2, xp:0, modes:{ normal:null, classic:null }, members:{}, npcWorlds:{ normal:null, classic:null }, updatedAt:Date.now() }
  };
  _sig1Nonce = _genExportNonce();
  loadAllUI();
  toast('已清除', 'info');
}

// ════════════════════════════════════════════════
//  初始化
// ════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadAllUI();
  toast('⚔️ 暗黑版存檔修改器 V2 已就緒', 'info');
});
