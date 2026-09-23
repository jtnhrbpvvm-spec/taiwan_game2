/* 7MA 經驗系統：EXP_TABLE、怪物階級倍率、升級所需經驗、等級差與狩獵經驗計算
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
/* ===================== 7MA 經驗系統（依使用者提供資料） =====================
   1~66 級：使用提供的官方精確「升到下一級」經驗表。
   67 級以上：依提供規則，以 66→67 的數值為基準，每級 ×1.055 並四捨五入。
   怪物經驗：
     BaseEXP = MonsterLevel × 20 × RankMultiplier
     玩家等級 - 怪物等級：
       <= 5  → 100%
       6~10  → 80%
       11~15 → 50%
       >=16  → 10%
       玩家低於怪物：每低 1 級 +5%，最高 +50%
   注意：使用者提供的規格沒有給出「普通／精英／BOSS」的數值 RankMultiplier，
   因此不臆造官方數值；系統保留可配置值，未指定的怪階使用 1.0。
   ======================================================================== */
const EXP_TABLE = [
  0,13,36,67,108,158,217,286,364,451,547,
  935,1374,1865,2407,2999,3643,4338,5084,5882,6730,
  7333,7961,8616,9296,10002,10735,11493,12276,13086,13922,
  16434,19071,21832,24718,27728,30862,34121,37505,41012,44645,
  50625,56833,63267,69928,76815,83930,91270,98838,106632,114653,
  121088,127682,134435,141347,148418,155647,163036,170583,178290,
  186155,199666,213508,227681,242187,257024,272193,287694
];
const MONSTER_RANK_EXP_MULTIPLIER = Object.freeze({
  normal:1,
  elite:1,
  boss:1
});
function getExpRequired(level){
  level=Math.max(1,Math.floor(Number(level)||1));
  if(level<EXP_TABLE.length) return EXP_TABLE[level];
  let base=EXP_TABLE[EXP_TABLE.length-1];
  for(let lv=EXP_TABLE.length;lv<=level;lv++) base=Math.round(base*1.055);
  return base;
}
function getMonsterRank(e){
  return e?.isBoss ? 'boss' : (e?.rank==='elite' ? 'elite' : 'normal');
}
function getLevelDifferenceMultiplier(playerLevel,monsterLevel){
  const diff=Number(playerLevel||1)-Number(monsterLevel||1);
  if(diff<=5){
    if(diff<0) return 1+Math.min((-diff)*0.05,0.50);
    return 1;
  }
  if(diff<=10) return 0.80;
  if(diff<=15) return 0.50;
  return 0.10;
}
function getMonsterHuntExp(monsterOrLevel,rank='normal'){
  const monsterLevel=typeof monsterOrLevel==='object'
    ? Number(monsterOrLevel.level)||1 : Number(monsterOrLevel)||1;
  const r=typeof monsterOrLevel==='object' ? getMonsterRank(monsterOrLevel) : rank;
  const rankMul=Number(MONSTER_RANK_EXP_MULTIPLIER[r])||1;
  const base=monsterLevel*20*rankMul;
  const mult=getLevelDifferenceMultiplier(G.player.level,monsterLevel);
  return Math.max(0,Math.floor(base*mult));
}

