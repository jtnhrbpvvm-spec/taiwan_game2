// Compare extracted tables by stable ID, never by array position.
const fs=require('fs'),path=require('path');
const [oldFile,newFile]=process.argv.slice(2);
if(!oldFile||!newFile) throw Error('Usage: node tools/build_update_report.cjs OLD_DUMP NEW_DUMP');
const a=JSON.parse(fs.readFileSync(oldFile)),b=JSON.parse(fs.readFileSync(newFile));
const changes={},counts={};
for(const section of ['jobs','skills','talents','items','cards','monsters','stages','pets']) {
 const before=new Map(a[section].map(x=>[String(x.id),x]));
 const after=new Map(b[section].map(x=>[String(x.id),x]));
 const rows=[];let added=0,removed=0,changed=0;
 for(const [id,next] of after){
  const prev=before.get(id);
  if(!prev){added++;rows.push({id,name:next.name||next.nameEN||id,added:true});continue;}
  const fields=Object.keys({...prev,...next}).filter(k=>!(k==='tier' && !('tier' in prev)) && JSON.stringify(prev[k])!==JSON.stringify(next[k]));
  if(fields.length){changed++;rows.push({id,name:next.name||next.nameEN||id,fields:fields.map(key=>({key,before:prev[key]??null,after:next[key]??null}))});}
 }
 for(const [id,prev] of before)if(!after.has(id)){removed++;rows.push({id,name:prev.name||prev.nameEN||id,removed:true});}
 changes[section]=rows;counts[section]={added,removed,changed,total:after.size};
}
const deityIds=new Set([...Object.keys(a.deities.skills),...Object.keys(b.deities.skills)]);
const deities=[...deityIds].filter(id=>JSON.stringify(a.deities.skills[id])!==JSON.stringify(b.deities.skills[id]));
const report={from:a.version,to:b.version,checkedAt:b.dumpedAt,counts,deities,changes};
fs.writeFileSync(path.join(__dirname,'../wiki/data/updates.js'),'/* 由 tools/build_update_report.cjs 產生 */\nRSW.updates = '+JSON.stringify(report)+';\n');
console.log(JSON.stringify({from:report.from,to:report.to,counts,deities:deities.length},null,2));
