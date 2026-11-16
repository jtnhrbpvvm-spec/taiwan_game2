#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Crawler,assertOutput}=require('./l1stw_crawler.cjs'),{defaultGameRoot,save,sha,offlineCheck}=require('./update-common.cjs');
function ensureGMLauncher(dir=__dirname){return writeLauncher(dir,'GM模式.bat','repatch_local.cjs',['--launch','--gm']);}
async function launch({dir=__dirname,gameRoot=defaultGameRoot(),run,exists=fs.existsSync,open=true,checkUpdate=true,checkAssets=true,gm=false}={}){
 const execute=run||((file,args=[])=>new Promise((resolve,reject)=>{const p=require('node:child_process').spawn(process.execPath,[path.join(dir,file),...args],{cwd:dir,windowsHide:true,stdio:'inherit'});p.once('error',reject);p.once('exit',(code,signal)=>resolve(signal?1:(code??1)));}));
 if(checkUpdate)await execute('update_client.cjs');
 if(!exists(path.join(gameRoot,'public','index.html')))throw Error('尚未下載遊戲。請先執行「更新下載.bat」。');
 if(checkAssets)await execute('retry_missing.cjs',['--startup']);
 const patched=await execute('repatch_local.cjs');if(patched!==0)throw Error('離線版準備失敗，請查看上方錯誤訊息。');
 return execute('offline_server.cjs',[...(open?['--open']:[]),...(gm?['--gm']:[])]);
}
function repatch(root=defaultGameRoot()){
 root=path.resolve(root);assertOutput(root);const reportFile=path.join(root,'download-report.json');
 if(!fs.existsSync(reportFile))throw Error('請先執行更新下載，取得桌面的遊戲原始檔。');
 const r=JSON.parse(fs.readFileSync(reportFile,'utf8')),temp=fs.mkdtempSync(path.join(root,'.patch-stage-')),pub=path.join(root,'public'),names=['index.html','cloud.js','game.js','audio.js','lg.js','offline-runtime.js','offline-gm.js','.ai-policy.json','AGENTS.md'];let applied=[];
 try{
  const c=new Crawler({output:root,concurrency:4});c.pub=path.join(temp,'new');fs.mkdirSync(c.pub);
  for(const p of ['index.html','cloud.js','game.js','audio.js','lg.js'])c.texts.set(p,fs.readFileSync(path.join(root,'source',p),'utf8'));
  c.musicMap={};for(const f of r.records){const m=/^assets\/(?:mus\/(?:music)?(\d+)\.(?:mp3|ogg|wav)|snd\/music(\d+)\.mp3)$/.exec(f.path);if(m)c.musicMap[m[1]||m[2]]=f.path;}
  c.patch();offlineCheck(c.pub);
  for(const n of names)if(fs.existsSync(path.join(pub,n)))save(path.join(temp,'backup',n),fs.readFileSync(path.join(pub,n)));
  const generated=names.map(p=>{const b=fs.readFileSync(path.join(c.pub,p));return {path:p,bytes:b.length,sha256:sha(b)};});
  for(const n of names){applied.push(n);fs.renameSync(path.join(c.pub,n),path.join(pub,n));}
  save(path.join(temp,'report.json'),JSON.stringify({...r,generated},null,2));fs.renameSync(path.join(temp,'report.json'),reportFile);console.log('已從桌面原始檔套用最新離線化程式。');return {files:names.length};
 }catch(e){for(const n of applied){const b=path.join(temp,'backup',n),p=path.join(pub,n);if(fs.existsSync(b))fs.copyFileSync(b,p);else if(fs.existsSync(p))fs.unlinkSync(p);}throw e;}
 finally{if(path.resolve(temp).startsWith(root+path.sep+'.patch-stage-'))fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={repatch,launch,ensureGMLauncher,ensureWindowsLaunchers,windowsBootstrap,installGM,gmBridge};
if(require.main===module){try{ensureWindowsLaunchers();}catch(e){console.error(e.message);process.exitCode=1;}if(process.argv.includes('--launch'))launch({gm:process.argv.includes('--gm'),open:!process.argv.includes('--no-open'),checkUpdate:!process.argv.includes('--no-update'),checkAssets:!process.argv.includes('--no-assets-check')}).then(code=>{process.exitCode=code;}).catch(e=>{console.error(e.message);process.exitCode=1;});else try{repatch();}catch(e){console.error(e.message);process.exitCode=1;}}

function windowsBootstrap(entry,args=[],installer={name:'node-v26.13.1-x64.msi',sha256:'0398ced8446e119478c724d1aa37c5afd6aa1a76fceab12787eb9714c5ed8b45'}){
 const quote=s=>"'"+String(s).replace(/'/g,"''")+"'";
 return `$ErrorActionPreference = 'Stop'
function Test-UsableNode([string]$Candidate) {
 if (!$Candidate -or !(Test-Path -LiteralPath $Candidate -PathType Leaf)) { return $false }
 try { $v = & $Candidate -p "process.versions.node" 2>$null; return ($LASTEXITCODE -eq 0 -and [string]$v -match '^v?(\\d+)\\.' -and [int]$Matches[1] -ge 18) } catch { return $false }
}
function Find-UsableNode {
 $paths = @(); $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
 if ($command) { $paths += $command[0].Source }
 foreach ($base in @($env:ProgramW6432,$env:ProgramFiles,\${env:ProgramFiles(x86)})) { if ($base) { $paths += Join-Path $base 'nodejs\\node.exe' } }
 if ($env:LOCALAPPDATA) { $paths += Join-Path $env:LOCALAPPDATA 'Programs\\nodejs\\node.exe' }
 foreach ($candidate in ($paths | Select-Object -Unique)) { if (Test-UsableNode $candidate) { return $candidate } }
 return $null
}
# RUN_BOOTSTRAP
try {
 $root = (Get-Location).ProviderPath
 $node = Find-UsableNode
 if (!$node) {
  $arch = $env:PROCESSOR_ARCHITEW6432; if (!$arch) { $arch = $env:PROCESSOR_ARCHITECTURE }
  if ($arch -ne 'AMD64') { throw 'This bundled installer requires 64-bit Intel/AMD Windows. Install Node.js 18 or newer for your CPU, then retry.' }
  $installer = Join-Path $root ${quote(installer.name)}
  if (!(Test-Path -LiteralPath $installer -PathType Leaf)) { throw ('Node.js is missing. Keep '+${quote(installer.name)}+' beside this launcher and retry. Do not use a Python installer.') }
  if ((Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash -ne ${quote(installer.sha256)}) { throw 'The bundled Node.js installer is damaged or has been replaced. Installation was stopped.' }
  Write-Host 'Node.js is missing or too old. Starting the bundled Windows installer...'
  Write-Host 'Allow the Windows administrator prompt. Please wait for installation to finish.'
  $process = Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\\msiexec.exe') -ArgumentList @('/i',('"'+$installer+'"'),'/passive','/norestart') -Wait -PassThru
  if ($process.ExitCode -eq 1602) { throw 'Node.js installation was cancelled. Run this launcher again when ready.' }
  if ($process.ExitCode -notin @(0,3010)) { throw ('Node.js installation failed. Windows Installer code: '+$process.ExitCode) }
  $node = Find-UsableNode
  if (!$node) { if ($process.ExitCode -eq 3010) { throw 'Restart Windows to complete Node.js installation, then run this launcher again.' }; throw 'Installation finished, but Node.js 18 or newer was not found. Repair the Node.js installation and retry.' }
  if ($process.ExitCode -eq 3010) { Write-Host 'Windows recommends a restart later. Node.js is ready; continuing now.' }
 }
 Write-Host ('Using Node.js: '+$node)
 & $node (Join-Path $root ${quote(entry)})${args.map(a=>' '+quote(a)).join('')}
 exit $LASTEXITCODE
} catch { Write-Host ('ERROR: '+$_.Exception.Message) -ForegroundColor Red; exit 1 }
`;
}
function writeLauncher(dir,name,entry,args){
 const pre=['@echo off','setlocal','cd /d "%~dp0"','set "L1STW_ENTRY=%~f0"',`powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:L1STW_ENTRY); & ([scriptblock]::Create(($s -split '(?m)^# POWERSHELL_BOOTSTRAP\\r?$',2)[1]))"`,'set "L1STW_EXIT=%errorlevel%"','if not "%L1STW_EXIT%"=="0" pause','exit /b %L1STW_EXIT%','# POWERSHELL_BOOTSTRAP'];
 const p=path.join(dir,name),s=(pre.join('\n')+'\n'+windowsBootstrap(entry,args)).replace(/\r?\n/g,'\r\n');if(!fs.existsSync(p)||fs.readFileSync(p,'ascii')!==s)fs.writeFileSync(p,s,'ascii');return p;
}
function ensureWindowsLaunchers(dir=__dirname){
 const entries={'開啟離線版.bat':['repatch_local.cjs',['--launch']],'GM模式.bat':['repatch_local.cjs',['--launch','--gm']],'更新下載.bat':['l1stw_crawler.cjs',[]],'重新補抓缺檔.bat':['retry_missing.cjs',['--concurrency','8']],'產生GitHub更新包.bat':['publish_update.cjs',[]],'檢查更新.bat':['update_client.cjs',['--repair']]};
 return Object.entries(entries).map(([name,[entry,args]])=>writeLauncher(dir,name,entry,args));
}

function installGM(root){
 const gameFile=path.join(root,'game.js');let game=fs.readFileSync(gameFile,'utf8');const marker=/if\(!ONLINE\)window\.__game=\{[^\r\n]+\};/;
 if(!game.includes('OFFLINE_GM_BRIDGE_V1')&&marker.test(game))game=game.replace(marker,m=>m+'\n/* OFFLINE_GM_BRIDGE_V1 */\n('+gmBridge.toString()+')();');
 fs.writeFileSync(gameFile,game);
 const index=path.join(root,'index.html');let html=fs.readFileSync(index,'utf8');if(!html.includes('src="offline-mode.js"'))html=html.replace('<script src="offline-runtime.js"></script>','<script src="offline-mode.js"></script>\n<script src="offline-runtime.js"></script>');if(!html.includes('src="offline-gm.js"'))html=html.replace(/<\/body>/i,'<script defer src="offline-gm.js"></script>\n</body>');fs.writeFileSync(index,html);fs.writeFileSync(path.join(root,'offline-gm.js'),'('+gmBrowserPanel.toString()+')();\n');
 return {bridge:game.includes('OFFLINE_GM_BRIDGE_V1')};
}

function gmBridge(){
 'use strict';
 if(!window.__L1STW_OFFLINE||!window.__L1STW_GM_MODE||ONLINE)return;
 const statKeys=['str','dex','con','wis','int','cha'],effects={speed:1,damage:1};let panelOpen=false,priorPaused=false,identity='';
 const context=()=>{const account=localStorage.getItem('l1s_acct')||'',name=localStorage.getItem('l1s_name')||'';return {account,name,key:account+'@'+name,suffix:'@'+account+'@'+name};};
 function belongs(k,c=context()){const m=/^l1s_[^@]+@([^@]+)@([\s\S]*)$/.exec(k);return !!m&&m[1]===c.account&&m[2]===c.name;}
 function ready(){const c=context(),lg=document.getElementById('lg');if(!P||!c.account||!c.name||(lg&&getComputedStyle(lg).display!=='none'))return false;return !window.L1S_API&&(!window.CLOUD||CLOUD.mode==='local');}
 function requireReady(){if(!ready())throw Error('請先登入並選擇角色進入遊戲。');}
 function number(v,min,max,label,integer=true){v=Number(v);if(!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))throw Error(label+'須介於 '+min+'～'+max);return v;}
 function synchronize(){const k=context().key;if(k!==identity){identity=k;effects.speed=1;effects.damage=1;}}
 let affectedPlayer=null,appliedDamage=1;const normalRecalc=recalc;recalc=function(){if(P&&P===affectedPlayer)P.dmgMul/=appliedDamage;synchronize();normalRecalc();if(P){P.speed*=effects.speed;P.dmgMul*=effects.damage;affectedPlayer=P;appliedDamage=effects.damage;}};
 function saveNow(){recalc();invDirty=true;saveSave();saveVill();PL.save();}
 function backupKey(){return 'l1stw_gm_backups_v1'+context().suffix;}
 function backups(){try{const list=JSON.parse(localStorage.getItem(backupKey())||'[]');return Array.isArray(list)?list.slice(-5):[];}catch{return[];}}
 function capture(label){requireReady();saveNow();const c=context(),values={};for(const k of Object.keys(localStorage))if(belongs(k,c))values[k]=localStorage.getItem(k);const row={id:Date.now()+'-'+Math.random().toString(36).slice(2,7),date:new Date().toISOString(),label,account:c.account,name:c.name,values};const list=backups();list.push(row);try{localStorage.setItem(backupKey(),JSON.stringify(list.slice(-5)));}catch{throw Error('無法建立備份，本次修改未執行。請先清理瀏覽器儲存空間。');}return row;}
 function change(label,fn){requireReady();capture(label);const result=fn();saveNow();return result;}
 function summary(){requireReady();synchronize();const c=context(),s=PL.S();return {account:c.account,name:c.name,className:window.__ck,level:s.lv,maxLevel:PL.MAXLV,hpGrowth:s.hpG||0,mpGrowth:s.mpG||0,gold:gold(),survivorCoins:countItem(49100),dollTokens:dollTok,bonus:Object.fromEntries(statKeys.map(k=>[k,pots[k]||0])),stats:{...P.st},hp:Math.round(P.hp),maxhp:P.maxhp,mp:Math.round(P.mp),maxmp:P.maxmp,baseHp:P.baseHp,baseMp:P.baseMp,battleLevel:level,effects:{...effects},over:!!over};}
 function usable(d){return d&&d.id!==41246&&d.id!==40319&&d.type!=='arrow';}
 function catalog(){return Object.values(ITEMS).filter(usable).map(d=>({id:d.id,name:d.name,kind:d.kind,type:d.type,slot:d.slot||'',safe:d.safe||0}));}
 function inventory(){requireReady();return inv.map(it=>({uid:it.u,id:it.id,name:ITEMS[it.id]?.name||String(it.id),quantity:it.n,enchant:it.ench||0,equipped:it.eq||'',locked:!!it.lk,kind:ITEMS[it.id]?.kind||'',maxStack:stackCap(it.id)?99:ITEMS[it.id]?.kind==='etc'?1000000000:1}));}
 function add(o){requireReady();const id=number(o.id,1,99999999,'道具編號'),d=ITEMS[id];if(!usable(d))throw Error('目前版本沒有這項可用道具。');const q=number(o.quantity,1,d.kind==='etc'?1000000000:50,'數量'),enchant=d.kind==='etc'?0:number(o.enchant||0,-10,30,'強化值');if(q>bagRoom(id))throw Error('背包空間不足，目前最多可新增 '+bagRoom(id)+' 個。');return change('新增 '+d.name,()=>{const before=new Set(inv.map(i=>i.u));const it=addItem(id,q);for(const i of inv)if(!before.has(i.u)&&d.kind!=='etc')i.ench=enchant;let equipped=false;if(o.equip&&it&&d.kind!=='etc')equipped=!!equipItem(it);return {quantity:q,name:d.name,equipped};});}
 function edit(o){requireReady();const it=inv.find(i=>i.u===Number(o.uid));if(!it)throw Error('找不到背包中的道具，請重新整理清單。');const d=ITEMS[it.id],n=number(o.quantity,1,d.kind==='etc'?(stackCap(it.id)?99:1000000000):1,'數量'),ench=d.kind==='etc'?0:number(o.enchant,-10,30,'強化值');if(o.equipped&&!it.eq){const error=canEquip(it);if(error)throw Error(error);}return change('修改 '+d.name,()=>{it.n=n;it.ench=ench;it.lk=!!o.locked;if(o.equipped&&!it.eq)equipItem(it);else if(!o.equipped&&it.eq)unequipItem(it);return d.name;});}
 function remove(uid){requireReady();const it=inv.find(i=>i.u===Number(uid));if(!it)throw Error('找不到選取的道具。');return change('刪除 '+ITEMS[it.id].name,()=>{inv.splice(inv.indexOf(it),1);return ITEMS[it.id].name;});}
 function resources(o){requireReady();if(GOLD_HOLD!==null)throw Error('請先結束骰子或賽狗操作。');const patch={};for(const k of ['gold','survivorCoins','dollTokens'])if(o[k]!==undefined)patch[k]=number(o[k],0,1000000000,'資源數量');for(const k of statKeys)if(o[k]!==undefined)patch[k]=number(o[k],0,99,'額外素質');if(o.level!==undefined)patch.level=number(o.level,1,PL.MAXLV,'永久等級');for(const k of ['hpGrowth','mpGrowth'])if(o[k]!==undefined)patch[k]=number(o[k],0,100000,'永久生命／護盾加成');
  for(const [key,id]of [['gold',40308],['survivorCoins',49100]])if(patch[key]!==undefined&&patch[key]>countItem(id)&&patch[key]-countItem(id)>bagRoom(id))throw Error('背包空間不足。');
  return change('修改角色與資源',()=>{for(const [key,id]of [['gold',40308],['survivorCoins',49100]])if(patch[key]!==undefined){const delta=patch[key]-countItem(id);if(delta>0)addItem(id,delta);else if(delta<0)takeItem(id,-delta);}if(patch.dollTokens!==undefined)dollTok=patch.dollTokens;for(const k of statKeys)if(patch[k]!==undefined)pots[k]=patch[k];const before=PL.hpMp(),s=PL.S();if(patch.level!==undefined){s.lv=patch.level;s.exp=0;}if(patch.hpGrowth!==undefined)s.hpG=patch.hpGrowth;if(patch.mpGrowth!==undefined)s.mpG=patch.mpGrowth;PL.save();PL.load();const after=PL.hpMp();P.baseHp+=after.hp-before.hp;P.baseMp+=after.mp-before.mp;return '已保存角色與資源';});
 }
 function battle(o){requireReady();synchronize();const speed=number(o.speed,0.25,5,'移速倍率',false),damage=number(o.damage,0.1,100,'武器傷害倍率',false),hp=number(o.baseHp,1,1000000,'本局基礎生命'),mp=number(o.baseMp,0,1000000,'本局基礎護盾');effects.speed=speed;effects.damage=damage;P.baseHp=hp;P.baseMp=mp;recalc();if(o.heal){P.hp=P.maxhp;P.mp=P.maxmp;}return summary();}
 function setOpen(v){if(v&&!panelOpen){priorPaused=!!paused;paused=true;for(const k in keys)keys[k]=false;}else if(!v&&panelOpen)paused=priorPaused;panelOpen=!!v;}
 function restore(id){requireReady();const c=context(),row=backups().find(b=>b.id===id);if(!row||row.account!==c.account||row.name!==c.name)throw Error('找不到此角色的備份。');const before=capture('還原前備份'),writeValues=values=>{for(const k of Object.keys(localStorage))if(belongs(k,c))localStorage.removeItem(k);for(const [k,v]of Object.entries(values||{}))if(belongs(k,c)&&typeof v==='string')localStorage.setItem(k,v);};try{writeValues(row.values);}catch(e){writeValues(before.values);throw Error('還原未完成，已保留還原前資料：'+e.message);}const growth=PL.hpMp();loadVill();PL.load();P.baseHp+=PL.hpMp().hp-growth.hp;P.baseMp+=PL.hpMp().mp-growth.mp;loadSave();recalc();location.reload();}
 window.__offlineGM={version:1,ready,summary,catalog,inventory,add,edit,remove,resources,battle,setOpen,get panelOpen(){return panelOpen;},backup:()=>capture('手動備份'),backups:()=>backups().map(({id,date,label})=>({id,date,label})),restore,heal(){requireReady();P.hp=P.maxhp;P.mp=P.maxmp;return '生命與護盾已回滿';},clearMonsters(){return change('清除本場怪物',()=>{for(const m of [...mons])if(!m.dead)killMon(m);return '已依遊戲規則結算怪物經驗與掉落';});},town(){requireReady();startGame();if(panelOpen)paused=true;return '已回到村莊';}};
}

function gmBrowserPanel(){
 'use strict';
 if(!window.__L1STW_OFFLINE||!window.__L1STW_GM_MODE)return;
 const host=document.createElement('div');host.id='l1stw-offline-gm';document.body.appendChild(host);const root=host.attachShadow({mode:'open'});let tab='items',selection='',catalog=[],visible=false,dirty=new Set();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),q=s=>root.querySelector(s),api=()=>{const g=window.__offlineGM;if(!g)throw Error('此遊戲版本的 GM 介面尚未就緒。');return g;};
 root.innerHTML=`<style>:host{all:initial;font:14px 'Microsoft JhengHei',sans-serif;color:#f5e9cc}*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer;border:1px solid #9d783c;border-radius:7px;background:#30271c;color:#fff0c7;padding:8px 12px}button:hover{background:#5b4525}button:disabled{opacity:.5;cursor:default}#toggle{position:fixed;right:18px;bottom:164px;z-index:2147483000;background:linear-gradient(#bc9148,#70501f);color:#fff9dc;font-weight:bold;box-shadow:0 4px 18px #0009;min-width:94px;min-height:42px}#shade{position:fixed;inset:0;background:#0009;z-index:2147483001;display:none;align-items:center;justify-content:center;padding:14px}#panel{width:min(860px,96vw);max-height:88vh;background:#181714;border:1px solid #a98346;border-radius:14px;box-shadow:0 16px 70px #000c;display:flex;flex-direction:column;overflow:hidden}header{padding:16px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #655031}h2{font-size:20px;margin:0;flex:1;color:#efd393}header small{font-size:12px;color:#c9b68e}#who{padding:10px 18px;color:#cab994;font-size:13px;background:#211e18}nav{display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid #51432c;flex-wrap:wrap}nav button[aria-selected=true]{background:#99713a;color:#fff}main{padding:16px;overflow:auto;min-height:210px}label{display:flex;flex-direction:column;gap:5px;color:#e4d2ad;margin-bottom:10px}input,select{width:100%;min-height:36px;background:#0f100e;border:1px solid #6a5739;color:#f3ead5;border-radius:6px;padding:7px}input[type=checkbox]{width:auto;min-height:0}label.check{flex-direction:row;align-items:center;margin:6px 0 12px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.muted{color:#baa98a;font-size:12px;line-height:1.65}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.items{max-height:250px;overflow:auto;border:1px solid #51432c;border-radius:8px;margin:8px 0 12px}.item{display:flex;align-items:center;gap:10px;width:100%;border:0;border-radius:0;border-bottom:1px solid #3d3527;text-align:left;background:#201e19}.item span{flex:1}.item small{color:#bba985}.item[aria-pressed=true]{background:#6b512b}#message{padding:11px 16px;min-height:40px;font-size:13px;color:#ddc99b;background:#252117;border-top:1px solid #51432c}h3{margin:8px 0 12px;font-size:15px;color:#dfbc79}.danger{border-color:#ad6c54;color:#ffcfbb}@media(max-width:600px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}header small{display:none}#toggle{bottom:110px}main{padding:12px}}</style><button id="toggle" type="button">GM 控制</button><div id="shade"><section id="panel" role="dialog" aria-modal="true" aria-label="GM 控制台"><header><h2>GM 控制台</h2><small>編輯時暫停戰鬥</small><button id="close" type="button" aria-label="關閉">✕</button></header><div id="who"></div><nav><button data-tab="items">裝備／道具</button><button data-tab="character">角色與資源</button><button data-tab="battle">戰鬥輔助</button><button data-tab="backup">備份還原</button></nav><main></main><div id="message" role="status">請先登入並選擇角色。</div></section></div>`;
 const message=(text,error=false)=>{q('#message').textContent=text;q('#message').style.color=error?'#ffc1ac':'#ddc99b';};
 const act=fn=>{try{const result=fn();message(typeof result==='string'?result:'已完成');return result;}catch(e){message(e.message,true);return null;}};
 const field=(id,label,value,min=0,max=1000000000,step=1)=>`<label>${label}<input id="${id}" data-value="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${esc(value)}"></label>`;
 const bindDirty=()=>{for(const e of root.querySelectorAll('[data-value]'))e.addEventListener('input',()=>dirty.add(e.id));};
 function itemList(){const text=(q('#search')?.value||'').trim().toLowerCase(),kind=q('#kind')?.value||'',list=catalog.filter(i=>(!kind||i.kind===kind)&&(!text||(i.name+' '+i.id+' '+i.type).toLowerCase().includes(text)));q('#catalog').innerHTML=list.slice(0,120).map(i=>`<button class="item" data-item="${i.id}" aria-pressed="${String(selection)===String(i.id)}"><span>${esc(i.name)}<small>　${esc(i.type)}</small></span><small>#${i.id}</small></button>`).join('')||'<p class="muted" style="padding:12px">沒有相符的道具。</p>';q('#count').textContent='找到 '+list.length+' 項'+(list.length>120?'，請輸入關鍵字縮小範圍':'');for(const b of root.querySelectorAll('[data-item]'))b.onclick=()=>{selection=b.dataset.item;itemList();q('#selected').textContent=catalog.find(i=>String(i.id)===selection)?.name||'';};}
 function inventory(){const rows=api().inventory();q('#inventory').innerHTML='<option value="">選擇背包中的道具</option>'+rows.map(i=>`<option value="${i.uid}">${esc((i.enchant?'+'+i.enchant+' ':'')+i.name+' ×'+i.quantity+(i.equipped?'［已裝備］':''))}</option>`).join('');q('#inventory').onchange=()=>{const it=rows.find(i=>i.uid===+q('#inventory').value);if(!it)return;q('#inv-n').value=it.quantity;q('#inv-n').max=it.maxStack;q('#inv-e').value=it.enchant;q('#inv-e').disabled=it.kind==='etc';q('#inv-eq').checked=!!it.equipped;q('#inv-lock').checked=it.locked;};}
 function render(){dirty=new Set();for(const b of root.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===tab));let s;try{s=api().summary();}catch(e){q('#who').textContent='GM 模式 · 請登入並選擇角色';q('main').innerHTML='<p class="muted">進入角色後可新增裝備與修改數值。</p>';message(e.message);return;}q('#who').textContent=s.name+' · '+s.className+' · 永久 Lv'+s.level+' · 生命 '+s.hp+'/'+s.maxhp+' · 金幣 '+s.gold.toLocaleString();
  if(tab==='items'){catalog=api().catalog();q('main').innerHTML=`<div class="grid two"><label>名稱或編號<input id="search" type="search" placeholder="例如：弓、盔甲、40010"></label><label>分類<select id="kind"><option value="">全部</option><option value="weapon">武器</option><option value="armor">防具／飾品</option><option value="etc">消耗品／材料</option></select></label></div><div id="count" class="muted"></div><div id="catalog" class="items"></div><div class="row"><strong id="selected">${esc(catalog.find(i=>String(i.id)===selection)?.name||'請先選擇道具')}</strong></div><div class="grid two">${field('add-n','新增數量',1,1,1000000000)}${field('add-e','裝備強化值',0,-10,30)}</div><label class="check"><input id="add-eq" type="checkbox">新增後嘗試裝備（依職業與裝備規則）</label><button id="add">新增到背包</button><h3 style="margin-top:22px">修改現有背包道具</h3><label>背包道具<select id="inventory"></select></label><div class="grid two">${field('inv-n','數量',1,1,1000000000)}${field('inv-e','強化值',0,-10,30)}</div><div class="row"><label class="check"><input id="inv-eq" type="checkbox">裝備中</label><label class="check"><input id="inv-lock" type="checkbox">鎖定道具</label></div><div class="row"><button id="save-item">保存道具修改</button><button id="delete-item" class="danger">刪除選取道具</button></div><p class="muted">新增與永久修改前自動保留最近 5 份角色備份。裝備單次最多新增 50 件，背包容量仍適用。</p>`;itemList();inventory();q('#search').oninput=itemList;q('#kind').onchange=itemList;q('#add').onclick=()=>act(()=>{if(!selection)throw Error('請先選擇道具。');const r=api().add({id:+selection,quantity:q('#add-n').value,enchant:q('#add-e').value,equip:q('#add-eq').checked});inventory();return '已新增 '+r.name+' ×'+r.quantity+(q('#add-eq').checked&&!r.equipped?'；此道具未能裝備':'');});q('#save-item').onclick=()=>act(()=>{const name=api().edit({uid:q('#inventory').value,quantity:q('#inv-n').value,enchant:q('#inv-e').value,equipped:q('#inv-eq').checked,locked:q('#inv-lock').checked});inventory();return '已保存 '+name;});q('#delete-item').onclick=()=>{if(confirm('刪除選取的道具？操作前會自動備份。'))act(()=>{const name=api().remove(q('#inventory').value);inventory();return '已刪除 '+name;});};}
  else if(tab==='character'){const labels={gold:'金幣',survivorCoins:'倖存者金幣',dollTokens:'娃娃代幣',level:'永久等級',hpGrowth:'永久生命加成',mpGrowth:'永久護盾加成'};q('main').innerHTML='<h3>角色與資源</h3><div class="grid">'+Object.entries(labels).map(([k,v])=>field(k,v,s[k],k==='level'?1:0,k==='level'?s.maxLevel:k.endsWith('Growth')?100000:1000000000)).join('')+'</div><h3>額外素質</h3><div class="grid">'+Object.entries({str:'力量',dex:'敏捷',con:'體質',wis:'精神',int:'智力',cha:'魅力'}).map(([k,v])=>field(k,v+'（額外加成）',s.bonus[k],0,99)).join('')+'</div><p class="muted">只保存改動過的欄位。永久等級上限依遊戲設定；生命／護盾加成會依職業上限調整。修改等級不自動重算歷次成長。</p><div class="row"><button id="save-character">保存角色與資源</button><button id="heal">回滿生命與護盾</button></div>';bindDirty();q('#save-character').onclick=()=>act(()=>{if(!dirty.size)return '尚未修改欄位。';const patch={};for(const k of dirty)patch[k]=q('#'+k).value;const r=api().resources(patch);render();return r;});q('#heal').onclick=()=>act(()=>api().heal());}
  else if(tab==='battle'){q('main').innerHTML='<h3>本次 GM 遊玩的戰鬥設定</h3><div class="grid two">'+field('speed','移速倍率',s.effects.speed,.25,5,.25)+field('damage','武器傷害倍率',s.effects.damage,.1,100,.1)+field('baseHp','本局基礎生命',Math.round(s.baseHp),1,1000000)+field('baseMp','本局基礎護盾',Math.round(s.baseMp),0,1000000)+'</div><label class="check"><input id="heal-battle" type="checkbox" checked>套用後回滿生命與護盾</label><div class="row"><button id="save-battle">套用戰鬥設定</button><button id="reset-battle">倍率還原為 1</button><button id="heal">回滿生命與護盾</button></div><p class="muted">基礎生命／護盾隨新戰局重置；倍率只在此次 GM 模式中生效，不寫入一般啟動器設定。</p><h3>場景操作</h3><div class="row"><button id="clear-monsters">結算目前怪物</button><button id="town">回到村莊</button></div><p class="muted">結算怪物會依原遊戲規則給予經驗與掉落，執行前自動備份角色。</p>';q('#save-battle').onclick=()=>act(()=>{api().battle({speed:q('#speed').value,damage:q('#damage').value,baseHp:q('#baseHp').value,baseMp:q('#baseMp').value,heal:q('#heal-battle').checked});return '戰鬥設定已套用';});q('#reset-battle').onclick=()=>act(()=>{api().battle({speed:1,damage:1,baseHp:s.baseHp,baseMp:s.baseMp,heal:false});render();return '倍率已還原';});q('#heal').onclick=()=>act(()=>api().heal());q('#clear-monsters').onclick=()=>act(()=>api().clearMonsters());q('#town').onclick=()=>act(()=>api().town());}
  else{const rows=api().backups().reverse();q('main').innerHTML='<h3>目前角色的最近 5 份備份</h3><p class="muted">只處理目前帳號與角色的資料。還原後會重新載入，請重新選擇角色。</p><button id="backup-now">立即建立備份</button><div class="items">'+(rows.map(b=>`<div class="item"><span>${esc(new Date(b.date).toLocaleString())}<br><small>${esc(b.label)}</small></span><button data-restore="${esc(b.id)}">還原</button></div>`).join('')||'<p class="muted" style="padding:12px">目前尚無備份；第一次修改前會自動建立。</p>')+'</div>';q('#backup-now').onclick=()=>act(()=>{api().backup();render();return '備份已建立';});for(const b of root.querySelectorAll('[data-restore]'))b.onclick=()=>{if(confirm('還原這份角色備份並重新載入遊戲？'))act(()=>api().restore(b.dataset.restore));};}
 }
 function toggle(v){visible=v;q('#shade').style.display=v?'flex':'none';try{api().setOpen(v);}catch(e){message(e.message,true);}if(v){render();q('#close').focus();}}
 q('#toggle').onclick=e=>{e.stopPropagation();toggle(!visible);};q('#close').onclick=()=>toggle(false);q('#shade').onclick=e=>{if(e.target===q('#shade'))toggle(false);};for(const b of root.querySelectorAll('[data-tab]'))b.onclick=()=>{tab=b.dataset.tab;render();message('永久修改前會自動備份。');};for(const type of ['pointerdown','pointerup','click'])root.addEventListener(type,e=>e.stopPropagation());root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();toggle(false);}});window.addEventListener('pagehide',()=>{try{api().setOpen(false);}catch{}});
}
