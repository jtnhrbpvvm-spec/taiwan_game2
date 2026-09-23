/* 吃藥與自動輔助：POTION_DEF、治癒神通清單、autoSupport() 自動喝水／自動施法
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const POTION_DEF={hpPotion:{name:'凡品靈草',type:'hp',pct:.28,price:30},mpPotion:{name:'聚靈丹',type:'mp',pct:.38,price:60}};
const POTION_CD=2000;
function healSkillList(){return Object.values(SKILLS).filter(sk=>sk.type==='body'&&sk.heal>0&&G.skills.learned[sk.id])}
function autoSupport(strat){const s=G.player.stats,a=G.auto;strat=strat||COMBAT_STRATEGIES[a.combatStrategy||window.__combatStrategy]||COMBAT_STRATEGIES.balanced;const hpRate=s.hp/Math.max(1,s.maxHp),mpRate=s.mp/Math.max(1,s.maxMp);if(a.autoUsePotion&&hpRate<(Number(a.potionHpPct)||.7)){if(usePotion('hp'))return true}if(a.autoCastHeal&&a.healSkillId&&hpRate<(Number(a.healHpPct)||.5)){const sk=Object.values(SKILLS).find(x=>x.id===a.healSkillId&&x.heal>0);if(sk&&skillReady(sk)&&s.mp>=(sk.mp||0)&&castSkill(sk))return true}if(a.autoUseMpPotion&&mpRate<(Number(a.mpPotionPct)||.5)){if(usePotion('mp'))return true}if(a.enabled&&a.autoSkill&&battle?.active&&!battle.manualOnly){for(const id of (G.skills.buffEquipped||[])){const sk=id&&Object.values(SKILLS).find(x=>x.id===id);if(!sk||!G.skills.learned[sk.id]||!isBuffSkill(sk))continue;if(buffRemain(sk.haste>0?'haste':'guard')>1500)continue;if(!skillReady(sk)||s.mp<(sk.mp||0)||s.mp-(sk.mp||0)<strat.mpReserve*s.maxMp)continue;if(castSkill(sk))return true}}return false}
function potionCount(key){return G.inventory[key]||0}
function usePotion(type){const key=type==='mp'?(G.auto.mpPotionKey||'mpPotion'):(G.auto.hpPotionKey||'hpPotion');const def=POTION_DEF[key];if(!def)return false;
 const now=Date.now();G.potionCd=G.potionCd||{};if((G.potionCd[key]||0)>now)return false;
 if((G.inventory[key]||0)<=0){if(!G.auto.autoBuyPotion)return false;const cost=def.price*100;if(G.player.spiritStone<cost)return false;G.player.spiritStone-=cost;G.inventory[key]=(G.inventory[key]||0)+100;hlog(`藥品不足，自動購買 ${def.name} ×100`,'lg-drop')}
 G.inventory[key]--;G.potionCd[key]=now+POTION_CD;
 if(def.type==='hp'){G.player.stats.hp=Math.min(G.player.stats.maxHp,G.player.stats.hp+Math.round(G.player.stats.maxHp*def.pct));G.auto.stats.hpUsed=(G.auto.stats.hpUsed||0)+1;hlog(`服用${def.name}，回復氣血`,'lg-heal')}else{G.player.stats.mp=Math.min(G.player.stats.maxMp,G.player.stats.mp+Math.round(G.player.stats.maxMp*def.pct));G.auto.stats.mpUsed=(G.auto.stats.mpUsed||0)+1;hlog(`服用${def.name}，回復法力`,'lg-heal')}return true}
