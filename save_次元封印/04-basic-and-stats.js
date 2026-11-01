

// ════════════════════════════════════════════════
//  基本資料面板
// ════════════════════════════════════════════════
// 傳統模式遊戲已取消（v3.0.83），只剩一般與經典
function gameModeToStr(classic){ return classic ? 'classic' : 'normal'; }
function gameModeFromStr(mode){ return { classic: mode === 'classic' }; }

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
  setVal('f_gameMode', gameModeToStr(p.classicMode || false));
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
  p.sherineWorld     = getBool('f_sherine');
  p.prideBeatJenis   = getBool('f_prideBeatJenis');
  p.demonTempleOpen  = getBool('f_demonTempleOpen');
  // 向後相容欄位
  p.trial   = p.trialStage;
  p.flame   = p.flameAffinity;
  p.lastmap = p.lastBattleMap;
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

// 等級上限跟著轉生次數走（遊戲的 __afkLvCap）：一般 100、一轉 150、二轉 200；屬性上限：轉生後 200（__afkAttrCap）
function lvCap(){ const r = Number(G.p && G.p.rebirth) || 0; return r >= 2 ? 200 : r >= 1 ? 150 : 100; }
function statCap(){ return (Number(G.p && G.p.rebirth) || 0) > 0 ? 200 : 100; }
// 經驗表是遊戲的 getExpReq：exp 是「這一級累積了多少」，累積到 getExpReq(lv) 就升級並扣掉（不是總經驗）
function getExpReq(lv){ const r = GAME_DATA.expReq[lv]; return r == null ? Infinity : r; }

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
  const cap   = lvCap();
  let newLv = getNum('f_lv', 1), newExp, note = '';
  if(mode === 'lv'){
    newLv  = Math.max(1, Math.min(cap, input));
    if(input > cap) note = `⚠️ 超過目前的等級上限 ${cap}（轉生後上限才會提高），已修正。`;
    newExp = 0;   // exp 是這一級累積的量，歸零才不會一進遊戲就又升級
  } else {
    // 只改這一級累積的經驗；滿等時遊戲會把經驗清成 0
    const req = getExpReq(newLv);
    newExp = newLv >= cap ? 0 : Math.max(0, Math.min(input, isFinite(req) ? req - 1 : input));
  }

  const { mhp, mmp } = computeHpMpForLevel(newLv);

  setVal('f_lv',  newLv);
  setVal('f_exp', newExp);
  setVal('f_mhp', mhp);
  setVal('f_mmp', mmp);
  setVal('f_hp',  mhp); // 一併補滿目前HP/MP
  setVal('f_mp',  mmp);

  closeLvExpModal();
  toast(`${note}已套用 Lv.${newLv}（經驗值 ${newExp}），最大HP=${mhp}／最大MP=${mmp}（進遊戲後會依實際公式重算）`, note ? 'warn' : 'ok', 4000);
}

function maxAll(){
  const cap = lvCap();
  const { mhp, mmp } = computeHpMpForLevel(cap);
  setVal('f_gold', 999999999);
  setVal('f_lv',   cap);
  setVal('f_exp',  0);
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
               value="${v}" min="0" max="${statCap()}"
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
  const capEl = document.getElementById('statCapLabel');
  if(capEl) capEl.textContent = statCap();
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
  if(sum > statCap()){
    const prev = parseInt(el.dataset.prev || '0');
    el.value = prev;
    updateStatTotalRow();
    alert(`${STAT_LABELS[k]}（${tier === 'base' ? '基礎' : tier === 'panacea' ? '仙丹' : '分配'}）總和不能超過${statCap()}，已還原成修改前的數值。`);
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
    const capped = Math.max(0, Math.min(max, statCap() - others));       // 不能讓總和超過上限
    el.value = capped;
    el.dataset.prev = capped;
  });
  updateStatTotalRow();
  recalcHpMpFromStats(); // con/wis 可能也在裡面被改到，一併重算
}