#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Crawler,args,assertOutput}=require('./l1stw_crawler.cjs');
async function retry(options){
 const root=path.resolve(options.output),old=JSON.parse(fs.readFileSync(path.join(root,'download-report.json'),'utf8'));
 assertOutput(root);
 const c=new Crawler(options),failures=[...old.requiredFailures,...old.optionalFailures];
 for(const r of old.records){c.records.set(r.path,r);c.seen.set(r.path,'https://l1stw.com/'+r.path);}
 for(const f of failures){c.failed.set(f.path,f);c.add(f.url,undefined,f.optional);}
 function read(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())read(p);else if(/\.(js|json|html|css)$/.test(p))c.texts.set(path.relative(c.raw,p).replaceAll('\\','/'),fs.readFileSync(p,'utf8'));}}
 read(c.raw);console.log('重新嘗試缺少資源',failures.length);await c.drain();
 c.evaluateData();c.discover();await c.drain();
 c.musicMap={};for(const id of c.musicIds||[])for(const rel of [`assets/mus/${id}.mp3`,`assets/mus/${id}.ogg`,`assets/mus/${id}.wav`,`assets/mus/music${id}.mp3`,`assets/snd/music${id}.mp3`])if(c.records.has(rel)){c.musicMap[id]=rel;break;}
 c.musicMissing=(c.musicIds||[]).filter(id=>!c.musicMap[id]);c.patch();
 c.retrySummary={started:c.started,previousMissing:failures.length,recovered:failures.filter(f=>c.records.has(f.path)).length};
 const report=c.report();report.retry=c.retrySummary;fs.writeFileSync(path.join(root,'download-report.json'),JSON.stringify(report,null,2));
 console.log('本次補回',c.retrySummary.recovered,'個；仍缺少',report.requiredFailures.length+report.optionalFailures.length,'個');return report;
}
if(require.main===module){try{const o=args(process.argv.slice(2));retry(o).catch(e=>{console.error(e);process.exitCode=1;});}catch(e){console.error(e);process.exitCode=1;}}
module.exports={retry};
