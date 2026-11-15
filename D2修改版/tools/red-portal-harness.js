await import('/__d2zh.js');
// Only the isolated test origin: keep the test hero alive without changing the shipped tool.
setInterval(()=>{const p=window.game?.world?.player;if(p){p.life=1e12;p.maxLife=Math.max(p.maxLife||0,1e12);}},20);
const bar=document.createElement('div');bar.style.cssText='position:fixed;top:0;left:0;z-index:2147483647;background:#111;color:white;font:13px monospace;padding:4px;max-height:220px;overflow:auto';
const status=document.createElement('pre');
function button(name,fn){let b=document.createElement('button');b.textContent=name;b.onclick=async()=>{try{let result=await fn();status.textContent=JSON.stringify(result??'done',null,2)}catch(e){status.textContent=e.stack;console.error(e)}};bar.append(b)}
button('Test state',()=>({game:!!window.game,state:window.game?.state,world:window.game&&Object.keys(game.world||{}),errors:window.__portalErrors,version:window.__D2ZH_VERSION,save:window.game?.save?.pandemonium}));
button('Open equipment creator',()=>window.__D2ED.ec.show());
button('Enter test camp',()=>game.enterCamp());
button('Inspect test hero',()=>({kit:game.kit?.id,state:game.state,items:game.save.pandemonium,terror:game.world?.terror,act:game.world?.act,time:game.world?.time,life:game.world?.player?.life,errors:window.__portalErrors}));
button('Prepare test Terror waypoint',async()=>{
 const m=await import('/assets/saveTransfer-DD04jsx8.js');const id=game.kit.id;
 game.save.heroes??={};const kept=m.nm(id);kept.run.pendingLevelUps=0;game.save.heroes[id]={kept};
 game.save.terror??={};game.save.terror[id]={open:1,best:0,cleared:0,waves:true,offers:[0,1,3].map(act=>({tier:1,act,affixes:[]}))};
 await game.enterCamp(game.kit,'terror');return {id,prepared:true};
});
button('Open test red portal',()=>{game.pendingLevelUps=0;game.state='playing';game.actCleared();return {portalOpening:true};});
button('Start normal portal test',async()=>{await game.startClass(game.kit);game.pendingLevelUps=0;return {normal:true};});
button('Restart sands with keys',()=>{game.save.pandemoniumDone=['matron','furnace'];return {resetDone:true};});
button('Open test cow portal',()=>{const p=game.world.player;game.openCowPortal(p.x+80,p.y-80);return {cowPortal:!!game.cowPortal};});
bar.append(status);document.body.append(bar);
