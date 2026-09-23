/* 離線收益結算 applyOffline()、離線掉落 offlineDrop()
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
function applyOffline(){const now=Date.now(),last=Number(G.offlineAt)||now;const sec=clamp((now-last)/1000,0,86400);if(sec>=5&&G.selected){const beforeInv={...(G.inventory||{})};const rate=G.auto.enabled?.95:.22;const kills=Math.floor(sec/6*rate);
const pool=mapPool();
let exp=0;
for(let i=0;i<kills;i++){
  const pick=pickWeighted(pool);
  exp+=pick?getMonsterHuntExp({level:pick.level,isBoss:!!pick.isBoss,rank:pick.isBoss?'boss':'normal'}):0;
}
const stones=Math.floor(kills*(2+G.player.level*.06));G.player.exp+=exp;G.player.spiritStone+=stones;G.auto.stats.kills+=kills;G.auto.stats.exp+=exp;G.auto.stats.stones+=stones;G.player.stats.hp=1;ensureStats();G.player.stats.hp=G.player.stats.maxHp;G.player.stats.mp=G.player.stats.maxMp;for(let i=0;i<Math.floor(kills*.25);i++)offlineDrop();levelUp();const itemDrops=Object.keys(G.inventory||{}).map(name=>({name,qty:(G.inventory[name]||0)-(beforeInv[name]||0)})).filter(x=>x.qty>0);G.offlineSummary={seconds:sec,kills,exp,stones,itemDrops,at:now};G.log.unshift(`離線 ${Math.floor(sec/3600)} 小時 ${Math.floor((sec%3600)/60)} 分：獲得經驗 ${fmt(exp)}、靈石 ${fmt(stones)}、掉落 ${itemDrops.map(x=>x.name+'×'+x.qty).join('、')||'無'}`)}G.offlineAt=now}
function offlineDrop(){const m=currentMap(),pool=m.mons||[];const p=pool.length?pool[Math.floor(Math.random()*pool.length)]:['水鬼',15];grantDrops(p[0],false,true)}
