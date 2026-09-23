/* 角色成長：選職業、升級、學神通、靈寵、天賦／五行天賦、任務領獎
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
function classData(){return CLASSES[G.player.classKey]||null}
function expNeed(){return getExpRequired(G.player.level)}
function levelUp(){
 while(G.player.exp>=expNeed()&&G.player.level<MAX_LEVEL_30){
   G.player.exp-=expNeed();
   G.player.level++;
   G.player.levelBonus.hp+=30;
   G.player.levelBonus.mp+=15;
   G.player.levelBonus.atk+=3;
   G.player.levelBonus.def+=2;
   const c=classData();
   for(const k of Object.keys(c.growth))G.player.attr[k]+=c.growth[k];
   G.talents.points=(G.talents.points||0)+1;
   let msg=`等級提升至 Lv.${G.player.level}，HP上限 +30、MP上限 +15、攻擊 +3、防禦 +2，天賦點 +1`;
   if(G.player.level%5===0){G.talents.elementPoints=(G.talents.elementPoints||0)+1;msg+='，五行天賦點 +1'}
   log(msg,'lg-drop');toast(`升級 Lv.${G.player.level}`);
   ensureStats();
 }
}
function chooseClass(key){const c=CLASSES[key];if(!c)return;G.player.classKey=key;G.selected=true;G.classDataVersion='txws-official-1';G.player.attr={...c.attrs};G.player.level=1;G.player.exp=0;G.name=($('startName')?.value||'少俠').slice(0,16)||'少俠';G.player.name=G.name;CLASS_SKILLS[key].forEach(n=>learnSkill(n,true));G.skills.equipped=CLASS_SKILLS[key].map(n=>SKILLS[n]?.id).filter(Boolean).slice(0,4);const starter={劍宗:['精鐵劍','青布帽','厚皮甲','青鐵護腕','皮革腰帶','青布靴','青玉項鍊','青玉戒','青玉法寶','平安護符'],戟門:['精鐵戟','青布帽','厚皮甲','青鐵護腕','皮革腰帶','青布靴','青玉項鍊','青玉戒','青玉法寶','平安護符'],詭流:['精鐵鏜','青布帽','厚皮甲','青鐵護腕','皮革腰帶','青布靴','青玉項鍊','青玉戒','青玉法寶','平安護符'],幻道:['桃木杖','青布帽','厚皮甲','青鐵護腕','皮革腰帶','青布靴','青玉項鍊','青玉戒','青玉法寶','平安護符']}[key]||[];starter.forEach(n=>G.inventory[n]=(G.inventory[n]||0)+1);save(true);$('createScreen')?.remove();toast(`建立 ${key} 角色完成`);log(`${G.name} 加入 ${key}，職業取向：${c.ai.focus}`,'lg-drop');startAuto();goPanel('character')}
function learnSkill(name,silent=false){const sk=SKILLS[name];if(!sk)return false;if(!G.skills.learned[sk.id]){G.skills.learned[sk.id]={level:1};if(!silent)toast('領悟神通：'+name);return true}return false}
function skillByName(n){return SKILLS[n]||Object.values(SKILLS).find(s=>s.name===n)}
function petData(){return PET_DB[G.pets?.equipped]||PET_DB['靈狐']}
function buyPet(name){const p=PET_DB[name];if(!p)return;if(G.pets.owned.includes(name))return equipPet(name);if(G.player.spiritStone<p.cost)return toast('靈石不足');G.player.spiritStone-=p.cost;G.pets.owned.push(name);G.pets.equipped=name;toast(`獲得靈寵：${name}`);ensureStats();save(true);renderAll()}
function equipPet(name){if(!PET_DB[name]||!G.pets.owned.includes(name))return;G.pets.equipped=name;ensureStats();toast(`出戰靈寵：${name}`);renderAll()}
function spendTalent(k,amount=1){amount=clamp(Number(amount)||1,1,10);if(!(k in G.talents)||!G.talents.points)return toast('沒有天賦點');amount=Math.min(amount,G.talents.points);G.talents.points-=amount;G.talents[k]+=amount;ensureStats();toast(`天賦 ${k} +${amount}`);save(true);renderAll()}
function spendElementTalent(k,amount=1){amount=clamp(Number(amount)||1,1,10);if(!['metal','wood','water','fire','earth'].includes(k)||!G.talents.elementPoints)return toast('沒有五行天賦點');amount=Math.min(amount,G.talents.elementPoints);G.talents.elementPoints-=amount;G.talents[k]=(G.talents[k]||0)+amount;G.player.preferredElement=k;ensureStats();toast(`五行天賦 ${FIVE[k].name} +${amount}`);save(true);renderAll()}
function questProgress(q){return Math.min(q.target,Number(G.auto.stats[q.type]||0))}
function claimQuest(id){const q=QUESTS.find(x=>x.id===id);if(!q||G.quests.claimed[id])return;if(questProgress(q)<q.target)return toast('任務尚未完成');G.quests.claimed[id]=true;G.player.spiritStone+=q.reward;toast(`任務完成：${q.name}，靈石 +${fmt(q.reward)}`);save(true);renderAll()}

