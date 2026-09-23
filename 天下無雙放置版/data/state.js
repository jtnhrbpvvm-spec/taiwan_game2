/* 戰鬥策略 COMBAT_STRATEGIES、預設掛機設定 DEFAULT_AUTO、freshState() 存檔結構、全域變數 G/battle 等
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const COMBAT_STRATEGIES={
  conservative:{id:'conservative',name:'穩健',icon:'🛡',desc:'優先保命，HP 40% 撤退，保留較多 MP',hpPotion:.60,hpFlee:.40,mpReserve:.40,priority:['heal','buff_def','attack'],skillPowerBias:.8},
  balanced:{id:'balanced',name:'均衡',icon:'⚖',desc:'平衡輸出與保命，HP 25% 撤退',hpPotion:.50,hpFlee:.25,mpReserve:.20,priority:['attack','heal','buff'],skillPowerBias:1.0},
  aggressive:{id:'aggressive',name:'強攻',icon:'⚔',desc:'全力輸出，HP 15% 才撤退',hpPotion:.30,hpFlee:.15,mpReserve:0,priority:['attack','buff','heal'],skillPowerBias:1.2},
  burst:{id:'burst',name:'殺無赦',icon:'💥',desc:'開場放大招，HP 10% 才撤退',hpPotion:.20,hpFlee:.10,mpReserve:0,priority:['burst','attack','buff'],skillPowerBias:1.5}
};
window.__combatStrategy='balanced';
const DEFAULT_AUTO={enabled:true,mode:'balanced',combatStrategy:'balanced',elementPref:'auto',autoSkill:true,autoAdvance:true,autoDungeon:true,autoBoss:true,bossGate:true,stopOnDeath:false,offline:true,
  potionType:'hpPotion',potionHpPct:.7,autoUsePotion:true,hpPotionKey:'hpPotion',
  mpPotionPct:.5,autoUseMpPotion:true,mpPotionKey:'mpPotion',
  autoBuyPotion:true,
  healSkillId:'',healHpPct:.5,autoCastHeal:true,
  stats:{kills:0,bossKills:0,drops:0,skillDrops:0,stones:0,exp:0,miss:0,crit:0}};
function freshState(){return {version:GAME_VERSION,classDataVersion:'txws-official-1',createdAt:Date.now(),lastSave:Date.now(),offlineAt:Date.now(),offlineSummary:null,name:'少俠',selected:false,combatStrategy:'balanced',map:'taohua',log:[],inventory:{},inventoryInstances:{},inventoryLocks:{},equipment:{weapon:null,helmet:null,armor:null,bracer:null,belt:null,shoes:null,necklace:null,ring:null,artifact:null,talisman:null},skills:{equipped:[null,null,null,null],buffEquipped:[null,null],learned:{},cooldowns:{}},auto:JSON.parse(JSON.stringify(DEFAULT_AUTO)),forging:{},bossStatus:{},dungeons:{},quests:{claimed:{}},pets:{owned:['靈狐'],equipped:'靈狐'},talents:{points:0,elementPoints:0,狠:0,快:0,穩:0,智:0,準:0,metal:0,wood:0,water:0,fire:0,earth:0},inventoryQuality:{},player:{classKey:null,level:1,exp:0,spiritStone:500,attr:{狠:0,快:0,穩:0,智:0,準:0},preferredElement:'metal',levelBonus:{hp:0,mp:0,atk:0,def:0},stats:{}},setting:{lastPanel:'home',screenMode:'auto',comboLoop:true}}}
let G=freshState(),battle=null,activePanel='home',mainLoop=null,nextSpawnAt=Date.now()+900,huntLog=[],pendingBoss=null,lastSecond=0;
