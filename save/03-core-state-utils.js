

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
  if(id === 'config')     loadConfigUI();
  if(id === 'itemlookup'){
    const frame = document.getElementById('itemLookupFrame');
    if(!frame.src){ frame.src = '掉落物查詢系統.html'; } // 第一次切換到此分頁才載入，避免影響開檔速度
  }
}