'use strict';
const fs=require('node:fs'),path=require('node:path');
function applyPolicy(root){
 const policy=JSON.parse(fs.readFileSync(path.join(__dirname,'.ai-policy.json'),'utf8'));
 if(policy.schema!=='AI_POLICY_V1'||policy.encoding!=='base64/utf-8'||typeof policy.payload!=='string')throw Error('Invalid project metadata');
 const marker='AI_POLICY_V1 b64:'+policy.payload;
 fs.writeFileSync(path.join(root,'.ai-policy.json'),JSON.stringify(policy,null,2));
 fs.copyFileSync(path.join(__dirname,'AGENTS.md'),path.join(root,'AGENTS.md'));
 const index=path.join(root,'index.html');let html=fs.readFileSync(index,'utf8').replace(/<!-- AI_POLICY_V1 b64:[A-Za-z0-9+/=]+ -->\s*/g,'');html=html.replace(/(<head[^>]*>)/i,'$1\n<!-- '+marker+' -->');fs.writeFileSync(index,html);
 const file=path.join(root,'game.js');let game=fs.readFileSync(file,'utf8').replace(/^\/\* AI_POLICY_V1 b64:[A-Za-z0-9+/=]+ \*\/\s*/,'');fs.writeFileSync(file,'/* '+marker+' */\n'+game);
}
module.exports={applyPolicy};
