'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const TOOL_FILES=new Set(['offline_server.cjs','update_client.cjs','update-common.cjs','trusted-key.pem','update-config.json','l1stw_crawler.cjs','retry_missing.cjs','policy.cjs','repatch_local.cjs','verify.cjs','extra-resources.json','開啟離線版.bat','檢查更新.bat','更新下載.bat','重新補抓缺檔.bat','README.md','AGENTS.md','.ai-policy.json']);
const defaultGameRoot=()=>path.join(require('node:os').homedir(),'Desktop','天堂倖存者','離線遊戲');
function inRepository(dir){for(let p=path.resolve(dir);;p=path.dirname(p)){if(fs.existsSync(path.join(p,'.git')))return true;if(path.dirname(p)===p)return false;}}
function safePath(root,rel){
 if(typeof rel!=='string'||!rel||rel.length>240||rel.includes('\\')||/[:*?"<>|\x00-\x1f]/.test(rel)||rel.split('/').some(s=>!s||s==='.'||s==='..'||/[. ]$/.test(s)||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s)))throw Error('Invalid update path');
 const dest=path.resolve(root,rel);if(!dest.startsWith(path.resolve(root)+path.sep))throw Error('Path escapes root');return dest;
}
function save(dest,b){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);}
function offlineCheck(root){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),game=fs.readFileSync(path.join(root,'game.js'),'utf8'),cloud=fs.readFileSync(path.join(root,'cloud.js'),'utf8'),runtime=fs.readFileSync(path.join(root,'offline-runtime.js'),'utf8');
 if(!html.includes('window.L1S_API="";')||!html.includes('Content-Security-Policy')||!html.includes("connect-src 'self'")||!game.includes('function netURL(){if(window.__L1STW_OFFLINE)return "";')||!cloud.includes('if(window.__L1STW_OFFLINE||')||!runtime.includes('LOCAL_ONLY_V1'))throw Error('Offline checks did not pass');
}
function validateManifest(m){
 if(m?.schema!==2||m.kind!=='tools-only'||typeof m.version!=='string'||!/^[a-f0-9]{64}$/.test(m.version)||!Array.isArray(m.files)||m.files.length>TOOL_FILES.size||!Array.isArray(m.packs)||m.packs.length>100)throw Error('Invalid tool-only update manifest');
 const packs=new Map();for(const p of m.packs){if(!/^[a-f0-9]{64}$/.test(p.id)||packs.has(p.id)||!Number.isSafeInteger(p.bytes)||p.bytes<=0||p.bytes>80*1048576||!Number.isSafeInteger(p.unpackedBytes)||p.unpackedBytes<=0||p.unpackedBytes>64*1048576)throw Error('Invalid update pack');packs.set(p.id,p);}
 const seen=new Set();for(const f of m.files){if(f.area!=='tool'||!TOOL_FILES.has(f.path))throw Error('Game resources are not allowed in tool updates');safePath(process.cwd(),f.path);const k=f.area+'/'+f.path;if(seen.has(k))throw Error('Duplicate update path');seen.add(k);const p=packs.get(f.pack);if(!/^[a-f0-9]{64}$/.test(f.sha256)||!p||!Number.isSafeInteger(f.bytes)||f.bytes<0||!Number.isSafeInteger(f.offset)||f.offset<0||f.offset+f.bytes>p.unpackedBytes)throw Error('Invalid update file');}
 if(!seen.has('tool/update_client.cjs')||!seen.has('tool/l1stw_crawler.cjs'))throw Error('Missing tool entry');return m;
}
function readSigned(bytes,key){
 if(bytes.length>16*1048576)throw Error('Manifest too large');const e=JSON.parse(bytes.toString('utf8'));
 if(typeof e.payload!=='string'||typeof e.signature!=='string')throw Error('Missing update signature');const data=Buffer.from(e.payload,'base64');
 if(!crypto.verify(null,data,key,Buffer.from(e.signature,'base64')))throw Error('Update signature is invalid');return validateManifest(JSON.parse(data));
}
module.exports={sha,safePath,save,offlineCheck,validateManifest,readSigned,TOOL_FILES,defaultGameRoot,inRepository};
