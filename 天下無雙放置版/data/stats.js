/* 數值公式：ensureStats() 總屬性、戰力、五行相克、命中／暴擊、calcDamage() 傷害計算
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
function currentMap(){return maps.find(m=>m.id===G.map)||maps[0]}
function mapUnlocked(m){return G.player.level>=m.need}
function ensureStats(){const p=G.player,s=p.stats||{},c=classData()||CLASSES.劍宗,attr=p.attr||c.attrs,bonus={atk:0,def:0,hp:0,mp:0,spd:0,crit:0,hit:0,evade:0,狠:0,快:0,穩:0,智:0,準:0},elementPower={metal:0,wood:0,water:0,fire:0,earth:0},elementRes={metal:0,wood:0,water:0,fire:0,earth:0};let refinePct=0;Object.values(G.equipment).filter(Boolean).forEach(it=>{const qmul=it.qBaked?1:(QUALITY_MUL[G.inventoryQuality?.[it.name]||it.quality]||1);bonus.atk+=(it.baseAtk||0)*qmul;bonus.def+=(it.baseDef||0)*qmul;bonus.hp+=(it.hp||0)*qmul;bonus.mp+=(it.mp||0)*qmul;for(const k of Object.keys(attr))if(it.attr?.[k])bonus[k]=(bonus[k]||0)+it.attr[k]*qmul;if(it.affix?.key)bonus[it.affix.key]=(bonus[it.affix.key]||0)+it.affix.value;for(const g of (it.gems||[])){if(g==='攻擊靈石')bonus.atk+=12;if(g==='防禦靈石')bonus.def+=10;if(g==='氣血靈石')bonus.hp+=100;if(typeof g==='string'&&g.endsWith('血珀')){bonus.atk+=p.level*.8;bonus.hp+=p.level*6;bonus.def+=p.level*.4}const eg={金靈石:'metal',木靈石:'wood',水靈石:'water',火靈石:'fire',土靈石:'earth'}[g];if(eg){elementPower[eg]+=.06;elementRes[eg]+=.04}}refinePct+=it.refine||0});const refineMul=1+refinePct/100;bonus.atk*=refineMul;bonus.def*=refineMul;bonus.hp*=refineMul;bonus.mp*=refineMul;const pt=petData();if(pt){bonus.atk+=pt.atk||0;bonus.def+=pt.def||0;bonus.hp+=pt.hp||0;bonus.spd+=pt.fast||0;bonus.crit+=pt.crit||0}const a={狠:attr.狠+(bonus.狠||0)+(G.talents.狠||0),快:attr.快+(bonus.快||0)+(G.talents.快||0),穩:attr.穩+(bonus.穩||0)+(G.talents.穩||0),智:attr.智+(bonus.智||0)+(G.talents.智||0),準:attr.準+(bonus.準||0)+(G.talents.準||0)};s.atk=Math.round(18+a.狠*3.4+a.智*.8+bonus.atk+(p.levelBonus?.atk||0));s.def=Math.round(10+a.穩*2.8+a.狠*.35+bonus.def+(p.levelBonus?.def||0));s.maxHp=Math.round(260+p.level*34+a.穩*26+bonus.hp+(p.levelBonus?.hp||0));s.maxMp=Math.round(110+p.level*18+a.智*22+bonus.mp+(p.levelBonus?.mp||0));s.speed=10+a.快*1.85+(bonus.spd||0)*.3;s.critRate=clamp(.03+a.快*.002+a.狠*.0006+bonus.crit,0,.55);s.accuracy=clamp(.78+a.準*.009,0,.99);s.evasion=clamp(.03+a.快*.0045,0,.48);s.elemPower=elementPower;s.elemRes=elementRes;s.attr=a;s.hp=clamp(Number(s.hp)||s.maxHp,1,s.maxHp);s.mp=clamp(Number(s.mp)||s.maxMp,0,s.maxMp);p.stats=s}
function power(){const s=G.player.stats;return Math.round(s.atk*10+s.def*8+s.maxHp*.28+s.maxMp*.2+s.speed*14)}
function powerRate(){return G.auto.enabled?Math.max(.1,G.player.stats.atk*.12):0}
function fiveMultiplier(a,d){if(!a||!d||a==='none'||d==='none')return 1;if(FIVE[a].counters===d)return 1.2;if(FIVE[a].counteredBy===d)return .85;return 1}
function critMultiplier(){return 1.5}
function randomVariance(){return .95+Math.random()*.10}
function hitChance(att,def){return clamp(.82+(att.accuracy||.82)-(def.evasion||0)*.45,.55,.995)}
function officialPersonAttr(k){
 const base=(G.player.attr?.[k]||0)+(G.talents?.[k]||0);
 let gear=0;Object.values(G.equipment).filter(Boolean).forEach(it=>{if(it===G.equipment.weapon)return;gear+=(it.attr?.[k]||0);if(it.affix?.key===k)gear+=it.affix.value||0});
 const w=G.equipment.weapon;if(w?.affix?.key===k)gear+=w.affix.value||0;
 return base+gear;
}
function officialWeaponAttr(k){const w=G.equipment.weapon;return w?(w.attr?.[k]||0):0}
function officialSkillData(sk,level,enemy){
 const f=OFFICIAL_SKILL_FORMULAS[sk?.name]||OFFICIAL_SKILL_FORMULAS[sk?.name?.replace('灵','靈')];if(!f)return null;
 const idx=clamp(Number(level)||1,1,f.ratios.length)-1;
 const src=f.parts.reduce((sum,[scope,key])=>sum+(scope==='weapon'?officialWeaponAttr(key):officialPersonAttr(key)),0);
 const raceBonus=f.raceBonusByLevel?.[idx]??f.raceBonus??0;
 const critRate=f.crit?.[idx]??sk.crit??0;
 return {base:src*f.ratios[idx],raceMult:(f.race&&enemy?.race===f.race)?1+raceBonus:1,critRate,documented:true,ratio:f.ratios[idx],source:(f.race&&raceBonus)?`${f.race}相克 +${Math.round(raceBonus*100)}%`:''};
}
function calcDamage(att,def,ratio,elem,crit=false,baseOverride=null,extraMultiplier=1){const base=baseOverride==null?((att.atk*ratio)-(def.def*.5)):(baseOverride-(def.def*.5));const em=fiveMultiplier(elem,def.element);const gemAtt=1+((att.elemPower&&elem!=='none')?(att.elemPower[elem]||0):0);const gemDef=1-((def.elemRes&&elem!=='none')?(def.elemRes[elem]||0):0);const cm=crit?critMultiplier():1;return {damage:Math.max(1,Math.round(Math.max(1,base)*em*gemAtt*gemDef*cm*extraMultiplier*randomVariance())),elem:em}}
function elementName(k){return FIVE[k]?.name||'無'}
function typeName(t){return ({sword:'劍道',spell:'法術',body:'體魄',charm:'符印'})[t]||'神通'}
