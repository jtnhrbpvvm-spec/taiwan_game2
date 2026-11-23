// Check generated data, registered pages, and all item detail renderers without gameplay.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');
const context=vm.createContext({console,Intl,Date,URLSearchParams,location:{hash:''},document:{getElementById:()=>({value:''})}});
context.window=context;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(m=>m[1]);
for(const file of scripts){assert(fs.existsSync(path.join(root,file)),file);vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
const R=context.RSW;
assert(R.meta.version===R.updates.to,'Update report version mismatch');
assert(R.skills.length===199 && R.cards.length===98 && R.jobs.list.length===23,'Missing tables');
assert(R.festival.incense.chance===1 && R.festival.incense.rare.chance===.2,'Festival rates');
assert(R.festival.balls.flatMap(b=>b.cards).length===11,'Festival cards lost');
assert(R.items.every(i=>![1413,1530,2357,2410,2629,2630].includes(i.id)),'Hidden equipment leaked');
assert(R.cards.every(c=>Number.isInteger(c.tier)&&c.bonuses.length&&c.bonuses.every(Boolean)),'Card tier/effect missing');
for(const id of Object.keys(R.balanceNotes))assert(R.index().skill[id],'Broken balance skill: '+id);
let renders=0;
for(const page of R.pages){const result=page.render();assert(typeof result==='string'&&result.length,page.id);renders++;}
for(const [pageId,list] of [['skills',R.skills],['cards',R.cards],['items',R.items],['monsters',R.monsters],['stages',R.stages],['jobs',R.jobs.list]]){
 const page=R.pages.find(p=>p.id===pageId);
 for(const item of list){assert(page.render(String(item.id)).length,pageId+'/'+item.id);renders++;}
}
const updates=R.pages.find(p=>p.id==='updates').render();
assert(updates.includes('39%')&&updates.includes('44%')&&updates.includes('5%'),'Damage notes missing');
const event=R.pages.find(p=>p.id==='events').render();
assert(event.includes('裝備 71%')&&event.includes('裝備 63%')&&event.includes('裝備 38%'),'Event probabilities');
console.log(`Verified ${scripts.length} scripts, ${R.pages.length} pages, ${renders} page/detail renders; ${R.meta.version}.`);
