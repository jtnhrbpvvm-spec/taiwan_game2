#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Crawler,assertOutput}=require('./l1stw_crawler.cjs'),{defaultGameRoot,save,sha,offlineCheck}=require('./update-common.cjs');
function ensureGMLauncher(dir=__dirname){return writeLauncher(dir,'GM模式.bat','repatch_local.cjs',['--launch','--choose-mode']);}
async function launch({dir=__dirname,gameRoot=defaultGameRoot(),run,exists=fs.existsSync,open=true,checkUpdate=true,checkAssets=true,gm=false}={}){
 const execute=run||((file,args=[])=>new Promise((resolve,reject)=>{const p=require('node:child_process').spawn(process.execPath,[path.join(dir,file),...args],{cwd:dir,windowsHide:true,stdio:'inherit'});p.once('error',reject);p.once('exit',(code,signal)=>resolve(signal?1:(code??1)));}));
 // 不在開啟前等待網路：工具更新與原站新版都在玩家登入後於背景處理（見 offline_server.cjs）。
 if(!exists(path.join(gameRoot,'public','index.html')))throw Error('尚未下載遊戲。請先執行「更新下載.bat」。');
 if(checkAssets)await execute('retry_missing.cjs',['--startup']);
 let patched=await execute('repatch_local.cjs');
 // 原站改版導致離線化失敗時，立即更新工具再試一次，避免玩家卡在無法開啟、也等不到背景更新。
 if(patched!==0&&checkUpdate){console.log('離線化失敗，正在檢查是否有修正工具…');await execute('update_client.cjs');patched=await execute('repatch_local.cjs');}
 if(patched!==0)throw Error('離線版準備失敗，請查看上方錯誤訊息。');
 return execute('offline_server.cjs',[...(open?['--open']:[]),...(gm?['--gm']:[])]);
}
function repatch(root=defaultGameRoot()){
 root=path.resolve(root);assertOutput(root);const reportFile=path.join(root,'download-report.json');
 if(!fs.existsSync(reportFile))recoverDownloadReport(root);
 const r=JSON.parse(fs.readFileSync(reportFile,'utf8')),temp=fs.mkdtempSync(path.join(root,'.patch-stage-')),pub=path.join(root,'public'),names=['index.html','cloud.js','game.js','audio.js','lg.js','offline-runtime.js','offline-gm.js','.ai-policy.json','AGENTS.md'];let applied=[];
 try{
  const c=new Crawler({output:root,concurrency:4});c.pub=path.join(temp,'new');fs.mkdirSync(c.pub);
  for(const p of ['index.html','cloud.js','game.js','audio.js','lg.js'])c.texts.set(p,fs.readFileSync(path.join(root,'source',p),'utf8'));
  c.musicMap={};for(const f of r.records){const m=/^assets\/(?:mus\/(?:music)?(\d+)\.(?:mp3|ogg|wav)|snd\/music(\d+)\.mp3)$/.exec(f.path);if(m)c.musicMap[m[1]||m[2]]=f.path;}
  c.patch();offlineCheck(c.pub);
  for(const n of names)if(fs.existsSync(path.join(pub,n)))save(path.join(temp,'backup',n),fs.readFileSync(path.join(pub,n)));
  const generated=names.map(p=>{const b=fs.readFileSync(path.join(c.pub,p));return {path:p,bytes:b.length,sha256:sha(b)};});
  for(const n of names){applied.push(n);fs.renameSync(path.join(c.pub,n),path.join(pub,n));}
  const {patchError,...cleanReport}=r;save(path.join(temp,'report.json'),JSON.stringify({...cleanReport,generated,patchStatus:'complete'},null,2));fs.renameSync(path.join(temp,'report.json'),reportFile);console.log('已從桌面原始檔套用最新離線化程式。');return {files:names.length};
 }catch(e){for(const n of applied){const b=path.join(temp,'backup',n),p=path.join(pub,n);if(fs.existsSync(b))fs.copyFileSync(b,p);else if(fs.existsSync(p))fs.unlinkSync(p);}throw e;}
 finally{if(path.resolve(temp).startsWith(root+path.sep+'.patch-stage-'))fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={repatch,launch,recoverDownloadReport,insertGameBridge,ensureGMLauncher,ensureWindowsLaunchers,windowsBootstrap,modePickerPowerShell,installGM,gmBridge,installOfflineTrades,offlineTradeBridge};
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
${args.includes('--choose-mode')?modePickerPowerShell():''}
# RUN_BOOTSTRAP
try {
 $root = (Get-Location).ProviderPath
 ${args.includes('--choose-mode')?`$launchArgs = @(${args.filter(a=>a!=='--choose-mode').map(quote).join(',')})\n $mode = Show-GameModeDialog\n if (!$mode) { exit 0 }\n if ($mode -eq 'gm') { $launchArgs += '--gm' }`:''}
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
 & $node (Join-Path $root ${quote(entry)})${args.includes('--choose-mode')?' @launchArgs':args.map(a=>' '+quote(a)).join('')}
 exit $LASTEXITCODE
} catch { Write-Host ('ERROR: '+$_.Exception.Message) -ForegroundColor Red; exit 1 }
`;
}
function modePickerPowerShell(){
 const encoded=s=>Buffer.from(s,'utf8').toString('base64'),t=s=>`([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded(s)}')))`;
 return `function Show-GameModeDialog {
 Add-Type -AssemblyName System.Windows.Forms
 Add-Type -AssemblyName System.Drawing
 [System.Windows.Forms.Application]::EnableVisualStyles()
 $form = New-Object System.Windows.Forms.Form
 $form.Text = ${t('天堂倖存者')}
 $form.ClientSize = New-Object System.Drawing.Size(438,242)
 $form.StartPosition = 'CenterScreen'
 $form.FormBorderStyle = 'FixedDialog'
 $form.MaximizeBox = $false
 $form.MinimizeBox = $false
 $form.AutoScaleMode = 'Dpi'
 $form.Font = New-Object System.Drawing.Font('Microsoft JhengHei',10)
 $form.KeyPreview = $true
 $form.Tag = $null
 $heading = New-Object System.Windows.Forms.Label
 $heading.Text = ${t('請選擇遊玩模式')}
 $heading.Location = New-Object System.Drawing.Point(24,20)
 $heading.Size = New-Object System.Drawing.Size(390,30)
 $heading.Font = New-Object System.Drawing.Font('Microsoft JhengHei',14,[System.Drawing.FontStyle]::Bold)
 $hint = New-Object System.Windows.Forms.Label
 $hint.Text = ${t('兩種模式共用角色存檔；一般模式不顯示 GM 選單。')}
 $hint.Location = New-Object System.Drawing.Point(24,59)
 $hint.Size = New-Object System.Drawing.Size(390,40)
 $normal = New-Object System.Windows.Forms.Button
 $normal.Name = 'ModeNormal'
 $normal.Text = ${t('一般模式')}
 $normal.Location = New-Object System.Drawing.Point(24,111)
 $normal.Size = New-Object System.Drawing.Size(185,55)
 $normal.TabIndex = 0
 $normal.Add_Click({ $owner = $this.FindForm(); $owner.Tag = 'normal'; $owner.Close() })
 $gm = New-Object System.Windows.Forms.Button
 $gm.Name = 'ModeGM'
 $gm.Text = ${t('GM 模式')}
 $gm.Location = New-Object System.Drawing.Point(229,111)
 $gm.Size = New-Object System.Drawing.Size(185,55)
 $gm.TabIndex = 1
 $gm.Add_Click({ $owner = $this.FindForm(); $owner.Tag = 'gm'; $owner.Close() })
 $foot = New-Object System.Windows.Forms.Label
 $foot.Text = ${t('切換模式前，請先關閉舊的遊戲與伺服器視窗。')}
 $foot.Location = New-Object System.Drawing.Point(24,187)
 $foot.Size = New-Object System.Drawing.Size(390,38)
 $form.Controls.AddRange(@($heading,$hint,$normal,$gm,$foot))
 $form.AcceptButton = $normal
 $form.Add_KeyDown({ if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Escape) { $this.Close() } })
 $form.Add_Shown({ $this.Activate() })
 # SHOW_MODE_DIALOG
 try { [void]$form.ShowDialog(); return $form.Tag } finally { $form.Dispose() }
}
`;
}
function writeLauncher(dir,name,entry,args){
 const pre=['@echo off','setlocal','cd /d "%~dp0"','set "L1STW_ENTRY=%~f0"',`powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:L1STW_ENTRY); & ([scriptblock]::Create(($s -split '(?m)^# POWERSHELL_BOOTSTRAP\\r?$',2)[1]))"`,'set "L1STW_EXIT=%errorlevel%"','if not "%L1STW_EXIT%"=="0" pause','exit /b %L1STW_EXIT%','# POWERSHELL_BOOTSTRAP'];
 const p=path.join(dir,name),s=(pre.join('\n')+'\n'+windowsBootstrap(entry,args)).replace(/\r?\n/g,'\r\n');if(!fs.existsSync(p)||fs.readFileSync(p,'ascii')!==s)fs.writeFileSync(p,s,'ascii');return p;
}
function ensureWindowsLaunchers(dir=__dirname){
 const entries={'開啟離線版.bat':['repatch_local.cjs',['--launch','--choose-mode']],'GM模式.bat':['repatch_local.cjs',['--launch','--choose-mode']],'更新下載.bat':['l1stw_crawler.cjs',[]],'重新補抓缺檔.bat':['retry_missing.cjs',['--concurrency','8']],'產生GitHub更新包.bat':['publish_update.cjs',[]],'檢查更新.bat':['update_client.cjs',['--repair']]};
 return Object.entries(entries).map(([name,[entry,args]])=>writeLauncher(dir,name,entry,args));
}

function insertGameBridge(game,code,tag){
 if(game.includes('/* '+tag+' */'))return game;
 const startup=[...game.matchAll(/^[ \t]*resetGame\s*\(\s*\)\s*;[ \t]*running\s*=\s*false\s*;/gm)];
 let at;if(startup.length===1)at=startup[0].index;
 else if(startup.length>1)throw Error('遊戲初始化位置不唯一，已停止套用以保護原始檔');
 else{const legacy=/if\(!ONLINE\)window\.__game=\{[^\r\n]+\};/.exec(game);if(!legacy)throw Error('找不到遊戲初始化位置，請保留已下載檔案並更新工具');at=legacy.index;}
 return game.slice(0,at)+'/* '+tag+' */\n'+code+'\n'+game.slice(at);
}
function recoverDownloadReport(root){
 root=path.resolve(root);const pub=path.join(root,'public'),raw=path.join(root,'source'),target=path.join(root,'download-report.json');
 for(const f of ['index.html','game.js','cloud.js','audio.js','lg.js'])if(!fs.existsSync(path.join(raw,f)))throw Error('缺少原始 '+f+'，請執行「更新下載.bat」；已下載的素材會沿用');
 console.log('找到已下載的原始檔，正在重建下載紀錄；不會重新下載素材。');
 const skipped=new Set(['offline-runtime.js','offline-gm.js','.ai-policy.json','AGENTS.md']),found=new Map();
 function walk(dir,prefer){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,prefer);else if(e.isFile()){const rel=path.relative(prefer?raw:pub,p).replaceAll('\\','/');if(skipped.has(rel))continue;if(!prefer&&found.has(rel))continue;found.set(rel,p);}}}
 walk(pub,false);walk(raw,true);const records=[];for(const [rel,p]of found){const b=fs.readFileSync(p);records.push({path:rel,bytes:b.length,sha256:sha(b),from:'recovered-local'});}
 let progress={};try{progress=JSON.parse(fs.readFileSync(path.join(root,'crawl-progress.json'),'utf8'));}catch{}
 const {annotateFailure}=require('./update-common.cjs'),failures=(progress.failed||[]).filter(f=>!found.has(f.path)).map(annotateFailure);
 const report={source:'https://l1stw.com',started:progress.time||new Date().toISOString(),finished:new Date().toISOString(),files:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),network:0,records,generated:[],requiredFailures:failures.filter(f=>!f.optional),optionalFailures:failures.filter(f=>f.optional),warnings:['Recovered from local files after an interrupted offline patch.'],patchStatus:'pending',recoveredAt:new Date().toISOString()};
 save(target+'.recover.tmp',JSON.stringify(report,null,2));fs.renameSync(target+'.recover.tmp',target);return report;
}
function installGM(root){
 const gameFile=path.join(root,'game.js');let game=fs.readFileSync(gameFile,'utf8');
 if(game.includes("b.textContent='GM測試'")&&!game.includes('OFFLINE_LEGACY_GM_GATE_V1')){
  // 以「GM測試」按鈕所在的頂層 IIFE 定位；原站新版會刪除註解，不能依賴註解標題。
  const id="b.textContent='GM測試'",at=game.indexOf(id),open=game.lastIndexOf('\n(function(){',at),lineEnd=open<0?-1:game.indexOf('\n',open+1);
  if(game.indexOf(id,at+1)>=0||open<0||lineEnd<0||lineEnd>at||game.lastIndexOf('\n})();',at)>open)throw Error('原有 GM 選單格式改變，請檢查');
  game=game.slice(0,lineEnd+1)+'  /* OFFLINE_LEGACY_GM_GATE_V1 */\n  if(window.__L1STW_OFFLINE&&!window.__L1STW_GM_MODE)return;\n'+game.slice(lineEnd+1);
 }
 game=game.replace('if(ONLINE){for(let i=VNPC.length-1','if(ONLINE||window.__L1STW_OFFLINE){for(let i=VNPC.length-1');
 game=game.replace('const gm=!!(window.CLOUD&&CLOUD.gm);for(const n of GMNPC)','const gm=window.__L1STW_OFFLINE?!!window.__L1STW_GM_MODE:!!(window.CLOUD&&CLOUD.gm);for(const n of GMNPC)');
 game=game.replace('const evOpen=()=>!ONLINE||','const evOpen=()=>window.__L1STW_OFFLINE?!!window.__L1STW_GM_MODE:!ONLINE||');
 game=game.replaceAll('(window.CLOUD&&CLOUD.gm)||!ONLINE','(window.CLOUD&&CLOUD.gm)||(window.__L1STW_OFFLINE?!!window.__L1STW_GM_MODE:!ONLINE)');
 game=game.replace("(!SRV()?'<span class=\"btn\" id=\"talBxB\">","(!SRV()&&(!window.__L1STW_OFFLINE||window.__L1STW_GM_MODE)?'<span class=\"btn\" id=\"talBxB\">");
 game=game.replace("if(!SRV())rows.push({icon:49100,name:'【離線測試】","if(!SRV()&&(!window.__L1STW_OFFLINE||window.__L1STW_GM_MODE))rows.push({icon:49100,name:'【離線測試】");
 game=insertGameBridge(game,'('+gmBridge.toString()+')();','OFFLINE_GM_BRIDGE_V1');
 fs.writeFileSync(gameFile,game);
 const index=path.join(root,'index.html');let html=fs.readFileSync(index,'utf8');if(!html.includes('src="offline-mode.js"'))html=html.replace('<script src="offline-runtime.js"></script>','<script src="offline-mode.js"></script>\n<script src="offline-runtime.js"></script>');if(!html.includes('src="offline-gm.js"'))html=html.replace(/<\/body>/i,'<script defer src="offline-gm.js"></script>\n</body>');fs.writeFileSync(index,html);fs.writeFileSync(path.join(root,'offline-gm.js'),'('+gmBrowserPanel.toString()+')();\n');
 return {bridge:game.includes('OFFLINE_GM_BRIDGE_V1')};
}

function installOfflineTrades(root){
 const p=path.join(root,'game.js');let game=fs.readFileSync(p,'utf8');if(game.includes('OFFLINE_TRADES_V1'))return;
 game=game.replace('const mkOn=()=>{if(!SRV()){','const mkOn=()=>{if(!SRV()&&!window.__L1STW_OFFLINE){');
 game=insertGameBridge(game,'('+offlineTradeBridge.toString()+')('+JSON.stringify(offlineTradeData())+','+offlineNPCBridge.toString()+');','OFFLINE_TRADES_V1');fs.writeFileSync(p,game);
}
function offlineTradeBridge(data,installNPC){
 'use strict';if(!window.__L1STW_OFFLINE||ONLINE)return;
 const good=id=>ITEMS[id]&&![40319,41246].includes(+id)&&ITEMS[id].type!=='arrow';
 const shops=Object.fromEntries(Object.entries(data.shops).map(([k,v])=>[k,v.filter(([id,p])=>good(id)&&Number.isSafeInteger(p)&&p>0)]));
 const cats=data.cats.map(c=>({...c,ids:c.ids.filter(([id,p])=>good(id)&&p>0)})).filter(c=>c.ids.length);
 const minimum={};for(const [id,p]of [...Object.values(shops).flat(),...cats.flatMap(c=>c.ids)])minimum[id]=Math.min(minimum[id]??Infinity,p);
 const defaults={40079:100000,40010:370,40011:1850,40012:4160,40013:2000,40018:3795,40100:70,40074:41000,40087:85000};
 const price=it=>{const id=+it.id;if(!good(id)||NOSELL.has(id))return 0;const base=data.sell[id]||(defaults[id]?Math.floor(defaults[id]/2):ITEMS[id].kind==='etc'?20:150);return Math.max(1,Math.min(base,minimum[id]?Math.floor(minimum[id]/2):base));};
 sellPrice=price;
 if(window.CRAFTDB){CRAFTDB.recipes=data.recipes.filter(r=>good(r.out)&&r.inputs.every(([id])=>good(id)));CRAFTDB.version='offline-cached-rules-v1';}
 chestRollLocal=function(id,rng){const rand=rng||Math.random,qty=(a,b)=>a+Math.floor(rand()*(b-a+1)),pick=rows=>{const r=rows[Math.floor(rand()*rows.length)];return [[r[0],qty(r[1],r[2])]];};if(id===49099||id===40418){let n=rand();const bonus=[40496,40519,40515,40499,40507,40045,40049,88,40048,40509].filter(good).map(id=>[id,.05]);if(id===40418)bonus.push([40087,.02],[40074,.03]);for(const [item,chance]of bonus){if(n<chance)return [[item,1]];n-=chance;}if(rand()<.7)return [[40010,qty(1,5)]];return pick([[40011,1,5],[40012,2,2],[40013,2,2],[40014,2,2],[40016,2,2],[40068,2,2],[40079,1,2]].filter(r=>good(r[0])));}const rows=pick([[40010,1,3],[40011,1,2],[40012,1,1],[40013,1,1],[40014,1,1],[40016,1,1],[40068,1,1]].filter(r=>good(r[0])));if(id===41244)rows.push([40308,qty(100,1500)]);return rows;};
 ruleGet=q=>{try{let result;
  if(q.k==='shop')result={list:shops[q.npc]||[]};else if(q.k==='sell')result={p:Object.fromEntries(Object.values(ITEMS).map(d=>[d.id,price({id:d.id})]).filter(([,p])=>p>0))};
  else if(q.k==='gearCats')result={cats:cats.filter(c=>c.kind===q.kind)};else if(q.k==='gear')result={ids:cats.find(c=>c.kind===q.kind&&c.label===q.label)?.ids||[]};
  else if(q.k==='craft')result={rows:CRAFTDB.recipes.filter(r=>r.cat===q.cat).map(r=>({...r,pl:craftPlan(r)}))};
  else if(q.k==='craftPlan'){const r=CRAFTDB.recipes.find(r=>r.out===+q.out);if(!r)throw Error('本機沒有這個配方。');result={r,pl:craftPlan(r)};}
  else throw Error('本機沒有這項商店規則。');return Promise.resolve(result);
 }catch(e){return Promise.reject(e);}};
 let busy=false,epoch=0;const who=()=>localStorage.getItem('l1s_acct')+'@'+localStorage.getItem('l1s_name');
 function ready(actor){if(!P||!village||!running||over||actor!==who())throw Error('請先進入角色的村莊再交易。');if(GOLD_HOLD!==null)throw Error('請先結束目前的下注。');}
 const inventoryShape=rows=>rows.map(i=>[i.id,i.n,i.ench||0,i.eq||null,!!i.lk]);
 function transaction(actor,fn,extra=[]){if(busy)return false;busy=true;const prior=inv.map(i=>[i,{...i}]),uid=uidN,backup={};
  try{ready(actor);for(const key of [saveKey(),...extra])backup[key]=localStorage.getItem(key);localStorage.setItem('l1stw_pending_economy_v1',JSON.stringify(backup));fn();invDirty=true;saveSave();const stored=JSON.parse(localStorage.getItem(saveKey())||'null');if(!stored||JSON.stringify(inventoryShape(stored.inv||[]))!==JSON.stringify(inventoryShape(inv)))throw Error('無法保存交易，已取消。請檢查瀏覽器儲存空間。');localStorage.removeItem('l1stw_pending_economy_v1');return true;}
  catch(e){inv.length=0;for(const [i,state]of prior){Object.assign(i,state);inv.push(i);}uidN=uid;invDirty=true;for(const [key,raw]of Object.entries(backup))try{if(raw===null)localStorage.removeItem(key);else localStorage.setItem(key,raw);}catch{}try{localStorage.removeItem('l1stw_pending_economy_v1');}catch{}addChat(e.message||'交易失敗，沒有扣除物品。','warn');return false;}
  finally{busy=false;}
 }
 function purchase(id,q,pr,actor){return transaction(actor,()=>{if(!good(id)||!Number.isSafeInteger(q)||q<1||q>100||!Number.isSafeInteger(pr)||pr<1)throw Error('商品或數量無效。');const cost=pr*q;if(gold()<cost)throw Error('金幣不足。');if(bagRoom(id)<q)throw Error('背包空間不足，交易已取消。');takeItem(40308,cost);addItem(id,q);});}
 shopBuy=function(n){const view=++epoch,actor=who(),rows=(shops[n.id]||[]).map(([id,pr])=>{const d=ITEMS[id];return {icon:id,name:d.name,info:pr+' 金幣',off:gold()<pr,tip:tipOf({id,n:1,ench:0}),fn:e=>{if(view!==epoch)return;const q=d.kind==='etc'?qtyOf(e):1;if(purchase(id,q,pr,actor)){addChat('購買 '+d.name+(q>1?' ×'+q:'')+'（花費 '+(pr*q).toLocaleString()+' 金幣）','loot');shopBuy(n);}}};});if(!rows.length)rows.push({name:'（目前沒有可購買的商品）',off:1});listWin({id:'buy',title:n.name+'：購買',rows,total:goldTxt(),hint:'Shift×10　Ctrl×100'});};
 shopSell=function(n){const view=++epoch,actor=who(),rows=inv.filter(i=>!i.eq&&!i.lk&&price(i)>0).map(it=>{const p=price(it)*it.n;return {icon:it.id,name:iname(it),info:(it.n>1?'×'+it.n+'　':'')+p+' 金幣',tip:tipOf(it),fn:()=>{if(view!==epoch)return;const nm=iname(it),num=it.n;if(transaction(actor,()=>{if(!inv.includes(it)||it.eq||it.lk||price(it)<=0)throw Error('這項物品目前不能出售。');const got=price(it)*it.n;if(!Number.isSafeInteger(got)||gold()+got>1000000000)throw Error('金幣已達上限，交易已取消。');inv.splice(inv.indexOf(it),1);addItem(40308,got);})){addChat('賣出 '+nm+(num>1?' ×'+num:'')+'（獲得 '+p.toLocaleString()+' 金幣）','loot');shopSell(n);}}};});if(!rows.length)rows.push({name:'（沒有可賣的東西）',off:1});listWin({id:'sell',title:n.name+'：賣出',rows,total:goldTxt(),hint:'點一下賣掉整疊'});};
 const detail=gearDetail;gearDetail=function(n,kind,c,id,pr,q){q=Math.max(1,Math.min(99,q));detail(n,kind,c,id,pr,q);const b=[...$id('dgB').querySelectorAll('.dgo')].find(e=>e.textContent.startsWith('購買（'));if(!b)throw Error('裝備購買按鈕格式改變');const actor=who();let used=false;b.onclick=()=>{if(used)return;if(purchase(id,q,pr,actor)){used=true;addChat('購買 '+ITEMS[id].name+(q>1?' ×'+q:'')+'（花費 '+(pr*q).toLocaleString()+' 金幣）','loot');gearList(n,kind,c);}};};
 gacha=function(n,kind){const pool=(data.pools[kind]||[]).filter(([id,w])=>good(id)&&w>0),actor=who(),view=++epoch,nm=kind==='weapon'?'隨機武器包':'隨機裝備包';
  const draw=count=>{if(view!==epoch)return;const cost=count===10?BOXCOST10:BOXCOST,got=[];if(transaction(actor,()=>{if(!pool.length)throw Error('本機沒有這種類型的隨機包。');if(gold()<cost)throw Error('金幣不足。');if(BAGN-inv.filter(i=>i.id!==40308).length<count)throw Error('背包空間不足，沒有扣除金幣。');for(let k=0;k<count;k++){let r=Math.random()*pool.reduce((s,a)=>s+a[1],0),id=pool.at(-1)[0];for(const [i,w]of pool){r-=w;if(r<0){id=i;break;}}const e=Math.random();got.push({id,ench:e<.01?3:e<.05?2:e<.2?1:0});}takeItem(40308,cost);for(const g of got){const it=addItem(g.id,1);it.ench=g.ench;}})){boxLast[kind]=got;for(const g of got)addChat('開出 '+(g.ench?'+'+g.ench+' ':'')+ITEMS[g.id].name,'loot');gacha(n,kind);}};
  const rows=[{name:'開 1 個'+nm,info:BOXCOST+' 金幣',off:gold()<BOXCOST,fn:()=>draw(1)},{name:'開 10 個'+nm,info:BOXCOST10+' 金幣',off:gold()<BOXCOST10,fn:()=>draw(10)}];if(boxLast[kind]?.length){rows.push({name:'── 剛才開出的東西 ──',off:1});for(const g of boxLast[kind])rows.push({icon:g.id,name:(g.ench?'+'+g.ench+' ':'')+ITEMS[g.id].name,off:1});}listWin({id:'box'+kind,title:n.name+'：'+nm,rows,total:goldTxt(),hint:'可能附帶強化'});
 };
 const talk=talkTo;talkTo=function(n){talk(n);if(n?.id!==70039)return;const b=$id('dgB'),leave=b.lastElementChild;for(const [text,fn]of [['武器分類',()=>upBuy(n,'weapon')],['防具分類',()=>upBuy(n,'armor')],['隨機武器包',()=>gacha(n,'weapon')],['隨機裝備包',()=>gacha(n,'armor')]]){const e=document.createElement('div');e.className='dgo';e.textContent=text;e.onclick=()=>{$id('npcdlg').classList.add('hidden');fn();};b.insertBefore(e,leave);}};
 const craft=craftDo;craftDo=function(out){if(CR.busy)return;transaction(who(),()=>craft(out));};
 if(installNPC)installNPC({transaction,who,good});
}

function offlineNPCBridge(ctx){
 'use strict';
 const SHARED='l1stw_local_npcs_v1',JOURNAL='l1stw_pending_economy_v1';
 const parse=(key,initial)=>{const s=localStorage.getItem(key);if(s===null)return structuredClone(initial);try{return JSON.parse(s);}catch{throw Error('本機資料無法讀取，請先備份瀏覽器存檔。');}};
 const write=(key,data)=>localStorage.setItem(key,JSON.stringify(data));
 try{const pending=parse(JOURNAL,null);if(pending){for(const [key,value]of Object.entries(pending))if(key===SHARED||/^l1s_(?:save2|offline_npc_v1|wh)@/.test(key)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}localStorage.removeItem(JOURNAL);}}catch(e){addChat(e.message,'warn');}
 const day=()=>new Date(Date.now()+28800000).toISOString().slice(0,10),key=()=>ckey('l1s_offline_npc_v1');
 const self=()=>({id:ctx.who(),account:localStorage.getItem('l1s_acct')||'',name:localStorage.getItem('l1s_name')||'',cls:window.__ck||'elf',lv:PL.S().lv});
 const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 function profile(){const p=parse(key(),{day:day(),metrics:{},claims:[],bonus:false,events:[]});if(p.day!==day()){p.day=day();p.metrics={};p.claims=[];p.bonus=false;}p.events=p.events||[];return p;}
 function database(){return parse(SHARED,{clans:[]});}
 const integer=(v,min,max)=>{v=Number(v);if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('數值必須介於 '+min+'～'+max+'。');return v;};
 function reward(rw){if(gold()+(rw.gold||0)>1000000000)throw Error('金幣已達上限，尚未領取。');for(const [id,n]of rw.items||[]){if(!ctx.good(id))throw Error('獎勵物品不存在。');if(bagRoom(id)<n)throw Error('背包空間不足，尚未領取。');addItem(id,n);}if(rw.gold)addItem(40308,rw.gold);}
 const taskDefs=[['k',10,'A','E','擊殺怪物',1000],['k',30,'A','E','擊殺怪物',2000],['k',60,'A','N','擊殺怪物',3000],['k',100,'A','H','擊殺怪物',5000],['b',1,'B','N','擊殺首領',5000],['e',3,'C','N','擊殺菁英',3000],['s',60,'D','E','累計戰鬥秒數',1000],['s',300,'D','N','累計戰鬥秒數',3000],['r',1,'F','E','完成至少 30 秒的戰局',2000],['r',3,'F','H','完成至少 30 秒的戰局',6000]];
 function daily(p){return {list:taskDefs.map(([m,t,cat,tier,text,gold],i)=>({i,cat,tier,text,t,p:Math.min(t,p.metrics[m]||0),done:(p.metrics[m]||0)>=t,got:p.claims.includes(i),rw:{gold:gold*10,items:tier==='H'?[[49100,10]]:[]}})),bonus:{ready:p.claims.length===10&&!p.bonus,got:p.bonus,rw:{gold:100000,items:[[49100,30]]}}};}
 function localOperation(op,a={}){
  let result;const actor=ctx.who(),me=self();
  const ok=ctx.transaction(actor,()=>{
   const db=database(),p=profile(),mine=db.clans.find(c=>c.members.some(m=>m.id===me.id));if(mine)Object.assign(mine.members.find(m=>m.id===me.id),me);
   if(op==='dqGet')result={dq:daily(p)};
   else if(op==='dqClaim'){const i=integer(a.i,0,9),q=daily(p).list[i];if(!q.done||q.got)throw Error('任務尚未完成或已領取。');reward(q.rw);p.claims.push(i);result={dq:daily(p)};}
   else if(op==='dqBonus'){if(!daily(p).bonus.ready)throw Error('尚未完成全勤或已領取。');reward(daily(p).bonus.rw);p.bonus=true;result={dq:daily(p)};}
   else if(op==='clanInfo')result={mine:mine?{...mine,members:mine.members.map(m=>({...m,leader:m.id===mine.leader}))}:null,iAmLeader:mine?.leader===me.id,cost:10000,max:30,list:db.clans.map(c=>({id:c.id,name:c.name,leader:c.members.find(m=>m.id===c.leader)?.name,n:c.members.length}))};
   else if(op==='clanCreate'){const name=String(a.name||'').trim();if(window.__ck!=='royal')throw Error('只有王子／公主可以創立血盟。');if(mine)throw Error('已加入血盟。');if(!name||name.length>12||/[\x00-\x1f]/.test(name))throw Error('血盟名稱請輸入 1～12 字。');if(db.clans.some(c=>c.name===name))throw Error('血盟名稱已使用。');if(gold()<10000)throw Error('金幣不足。');if(db.clans.length>=100)throw Error('本機血盟已達上限。');takeItem(40308,10000);db.clans.push({id:uid(),name,leader:me.id,members:[me]});result={};}
   else if(op==='clanJoin'){if(mine)throw Error('已加入血盟。');const c=db.clans.find(c=>c.id===a.id);if(!c||c.members.length>=30)throw Error('血盟不存在或已滿。');c.members.push(me);result={};}
   else if(['clanLeave','clanDisband','clanKick','clanTransfer'].includes(op)){if(!mine)throw Error('尚未加入血盟。');if(op==='clanLeave'){if(mine.leader===me.id)throw Error('盟主請先轉讓或解散血盟。');mine.members=mine.members.filter(m=>m.id!==me.id);}else{if(mine.leader!==me.id)throw Error('只有盟主可以操作。');if(op==='clanDisband')db.clans=db.clans.filter(c=>c!==mine);else{const candidates=mine.members.filter(m=>a.memberId?m.id===a.memberId:m.name===a.name),m=candidates.length===1?candidates[0]:null;if(!m||m.id===me.id)throw Error('找不到可操作的盟友，請重新選擇成員。');if(op==='clanTransfer')mine.leader=m.id;else mine.members=mine.members.filter(x=>x!==m);}}result={};}
   else if(op==='evPrizeClaim'){const rows=p.events.filter(e=>!e.claimed);if(!rows.length)throw Error('目前沒有待領獎勵。');reward({items:[[49100,rows.length]]});for(const r of rows)r.claimed=true;result={evGot:{n:rows.length,ranks:[]}};}
   else throw Error('本機 NPC 尚不支援這項操作：'+op);
   write(SHARED,db);write(key(),p);
  },[SHARED,key()]);if(!ok)throw Error('本機操作未完成，物品與金幣已保留。');return result;
 }
 srvDo=async function(op,args,ok,fail){if(SRVBUSY)return;SRVBUSY=true;try{if(op.startsWith('auction'))throw Error('拍賣場已關閉。');const task=()=>localOperation(op,args||{}),r=navigator.locks?await navigator.locks.request('l1stw-local-npcs-v1',task):task();SRVBUSY=false;if(ok)ok(r);}catch(e){SRVBUSY=false;addChat(e.message,'warn');if(fail)fail(e);}};
 const list=listWin;listWin=function(o){if(o.id==='clan'&&window.__ck!=='royal')for(const r of o.rows)if(r.name==='【創立血盟】'){r.name='僅王子／公主可以創立血盟';r.off=1;r.fn=null;}return list(o);};
 clanMenu=function(n){CLN=n;srvDo('clanInfo',{},r=>{const rows=[];if(r.mine){for(const m of r.mine.members)rows.push({name:(m.leader?'★ ':'')+m.name+'（'+m.account+'）',info:(CLSN[m.cls]||m.cls)+'　Lv'+m.lv,fn:r.iAmLeader&&!m.leader?()=>subMenu(n,'管理 '+m.name+'（'+m.account+'）',[['轉讓盟主',()=>{if(confirm('將盟主轉讓給此角色？'))srvDo('clanTransfer',{memberId:m.id},()=>clanMenu(n));}],['移出血盟',()=>{if(confirm('將此角色移出血盟？'))srvDo('clanKick',{memberId:m.id},()=>clanMenu(n));}]]):null});rows.push({name:r.iAmLeader?'解散血盟':'退出血盟',fn:()=>{if(confirm(r.iAmLeader?'確定解散血盟？':'確定退出血盟？'))srvDo(r.iAmLeader?'clanDisband':'clanLeave',{},()=>clanMenu(n));}});listWin({id:'clan',title:'血盟：'+r.mine.name,rows,total:'盟友 '+r.mine.members.length+' / '+r.max+' 人'});}else{rows.push(window.__ck==='royal'?{name:'【創立血盟】',info:r.cost.toLocaleString()+' 金幣',fn:()=>clanMakeForm(r.cost)}:{name:'僅王子／公主可以創立血盟',off:1});for(const c of r.list)rows.push({name:c.name,info:'盟主 '+c.leader+'　'+c.n+' / '+r.max+' 人',off:c.n>=r.max,fn:()=>srvDo('clanJoin',{id:c.id},()=>clanMenu(n))});listWin({id:'clan',title:'本機血盟',rows,total:'選擇血盟即可加入'});}});};
 for(const n of VNPC)if(n.kind==='auc')n.talk='拍賣場已關閉。';NPCOPTS.auc=[];aucOpen=()=>openNpc('拍賣場','<div style="padding:24px;text-align:center">拍賣場已關閉。</div>');
 const showDaily=dailyShow;dailyShow=function(n,dq){showDaily(n,dq);$id('dqst').textContent+='　固定本機每日任務；台灣時間午夜重置。';};
 dailyList=n=>srvDo('dqGet',{},r=>dailyShow(n,r.dq));
 const boardKey=()=>window.__L1STW_GM_MODE?'l1stw_best_runs_gm_v1':'l1stw_best_runs_v1';
 const boardInfo=[['clear','最快通關',(a,b)=>a.seconds-b.seconds],['best','最佳戰績',(a,b)=>(b.win-a.win)||(b.stage-a.stage)||(b.kills-a.kills)||(a.seconds-b.seconds)],['survive','最長存活',(a,b)=>b.seconds-a.seconds],['kills','最多擊殺',(a,b)=>b.kills-a.kills||b.stage-a.stage||a.seconds-b.seconds]];
 let run=null;
 function finish(win=false,home=false){if(!run||run.recorded||village)return;run.recorded=true;const me=self(),r={...me,id:run.id,actor:me.id,date:new Date().toISOString(),route:RUNROUTE||'main',win:!!win,home:!!home,seconds:Math.max(0,Math.round(time*100)/100),kills,stage:stageIdx+1,bosses:run.bosses,elites:run.elites};
  try{const b=parse(boardKey(),{});for(const [k,,sort]of boardInfo){if(k==='clear'&&!win)continue;b[k]=[...(b[k]||[]).filter(x=>x.id!==r.id),r].sort(sort).slice(0,50);}write(boardKey(),b);const p=profile();p.metrics.s=(p.metrics.s||0)+Math.floor(r.seconds);if(r.seconds>=30)p.metrics.r=(p.metrics.r||0)+1;if(r.route==='ev'&&r.seconds>=60){p.events.push({id:r.id,seconds:r.seconds,date:r.date,claimed:false});p.events=p.events.slice(-50);}write(key(),p);}catch(e){addChat('紀錄保存失敗：'+e.message,'warn');}
 }
 const start=startRun;startRun=function(...args){finish(false,true);const result=start(...args);run={id:uid(),recorded:false,bosses:0,elites:0};return result;};
 const end=endGame;endGame=function(win,home){if(!over)finish(win,home);return end(win,home);};
 const town=startGame;startGame=function(...args){finish(false,true);return town(...args);};
 const kill=killMon;killMon=function(m){const dead=!!m.dead;const result=kill(m);if(!dead&&m.dead&&run&&!run.recorded&&!village){run.bosses+=m.boss?1:0;run.elites+=m.elite?1:0;try{const p=profile();p.metrics.k=(p.metrics.k||0)+1;p.metrics.b=(p.metrics.b||0)+(m.boss?1:0);p.metrics.e=(p.metrics.e||0)+(m.elite?1:0);write(key(),p);}catch{}}return result;};
 addEventListener('pagehide',()=>finish(false,true));
 function rankView(tab='best'){const b=parse(boardKey(),{}),label=boardInfo.find(x=>x[0]===tab)?.[1]||'最佳戰績',rows=boardInfo.map(([k,t])=>({name:'【'+t+'】',info:k===tab?'目前分類':'最佳 50 筆',fn:()=>rankView(k)}));for(const [i,r]of (b[tab]||[]).entries())rows.push({name:(i+1)+'. '+r.name+'（'+r.account+'）',info:(r.win?'通關　':'')+'第 '+r.stage+' 關　擊殺 '+r.kills+'　'+r.seconds+' 秒',fn:()=>{openNpc('戰局紀錄','<div id="offlineRunDetails" style="padding:18px;white-space:pre-line;line-height:1.8"></div>');$id('offlineRunDetails').textContent='角色：'+r.name+'\n帳號：'+r.account+'\n職業：'+(CLSN[r.cls]||r.cls)+'\n日期：'+new Date(r.date).toLocaleString()+'\n路線：'+r.route+'\n結果：'+(r.win?'通關':r.home?'返回／離開':'倒下')+'\n時間：'+r.seconds+' 秒\n關卡：'+r.stage+'\n擊殺：'+r.kills+'\n首領：'+r.bosses+'　菁英：'+r.elites;}});if(!(b[tab]||[]).length)rows.push({name:'完成戰局後將自動留下紀錄',off:1});listWin({id:'offline-ranks-'+tab,title:(window.__L1STW_GM_MODE?'GM 練習':'本機')+'紀錄：'+label,rows,total:'每類保留最佳 50 筆',hint:'通關時間由短到長；點紀錄可看詳細資料'});}
 lbOpen=()=>rankView();
 Object.defineProperty(NPCOPTS,'event',{configurable:true,value:[['進入本機無限刷怪塔',()=>{EVEND=0;npcClose();startRun('ev');}],['櫻花刷錢區（每天 3 場）',()=>{if(cashLeft()<=0){addChat('今天的刷錢次數已用完。','warn');return;}cashUse();npcClose();startRun('cash');}],['領取本機活動獎勵',()=>srvDo('evPrizeClaim',{},r=>addChat('獲得倖存者金幣 ×'+r.evGot.n,'loot'))],['查看本機活動紀錄',()=>rankView('survive')]]});
 NPCOPTS.offlineEvent=NPCOPTS.event;for(const n of VNPC)if(n.kind==='event'){n.kind='offlineEvent';n.talk='本機活動：無限刷怪塔每場存活至少 60 秒，可在這裡領取 1 個倖存者金幣。櫻花刷錢區每天可進入 3 場。戰局紀錄保存在本機排行榜。';}
 const oldNews=window.PATCHNOTES||[];window.PATCHNOTES=[{d:'2026-11-16',h:'離線 NPC 與本機紀錄',v:'offline-npc-v1',pin:1,t:['商店、製作、每日任務與血盟使用本機存檔；拍賣場已關閉。','只有王子／公主可創立血盟；同一瀏覽器的不同帳號與角色可透過 NPC 加入。','每類戰局紀錄保留最佳 50 筆；GM 練習紀錄分開保存。']},...oldNews];
 const put=whIn,get=whOut;
 whIn=function(n){put(n);for(const row of LW?.o?.rows||[]){if(!row.fn)continue;const original=row.fn;let used=false;row.fn=()=>{if(used)return;const before=wh.map(w=>({...w}));if(ctx.transaction(ctx.who(),original,[whKeyA()]))used=true;else{wh=before;whIn(n);}};}};
 whOut=function(n){get(n);for(const [i,row]of (LW?.o?.rows||[]).entries()){if(!row.fn)continue;const original=row.fn,w=wh[i];let used=false;row.fn=()=>{if(used)return;const before=wh.map(w=>({...w}));if(ctx.transaction(ctx.who(),()=>{if(!w||!wh.includes(w)||bagRoom(w.id)<w.n)throw Error('背包空間不足，物品保留在倉庫。');original();},[whKeyA()]))used=true;else{wh=before;whOut(n);}};}};
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

// Minimal numeric compatibility rules recovered from the local pre-server cache.
function offlineTradeData(){const d={"shops":{"70033":[[40010,555],[40011,3000],[40012,9000],[40013,3000],[40018,56925],[40015,4500],[40014,12000],[40016,9000],[40089,30000],[40079,30000],[40074,85000],[40087,150000],[40056,1],[40065,5],[40001,10],[40002,100],[40003,30],[40315,500],[41160,2000],[40317,150]],"70039":[[40738,20],[40740,30],[24,110],[96,88],[31,3300],[40001,10]]},"sell":{"29":6500,"52":6000,"102":5500,"106":8000,"125":2500,"142":4000,"148":4000,"169":2000,"172":25,"40018":600,"40050":1000,"40051":1000,"40054":5000,"40055":5000,"40057":100,"40074":27500,"40087":50000,"40088":650,"40182":1600,"40189":3600,"40196":50000,"40208":3200,"40261":1600,"40319":60,"140074":27500,"140087":50000},"pools":{"weapon":[[172,30],[169,20],[125,15],[29,12],[47,8],[52,6],[106,4],[102,3],[142,2],[148,2]],"armor":[[20101,14],[20122,12],[20125,12],[20149,10],[20154,8],[20210,10],[20013,7],[20014,7],[20015,7],[20172,5],[20177,5],[20181,5],[20264,4],[20281,3],[20284,3],[20288,3],[21019,3],[21105,2],[21106,2]]},"cats":[{"kind":"weapon","label":"弓","ids":[[169,1700],[170,1700],[180,2700]]},{"kind":"weapon","label":"匕首","ids":[[1,2700],[2,1700],[4,80],[5,5300]]},{"kind":"weapon","label":"單手劍","ids":[[29,43000],[27,13200],[32,27500],[23,3300],[22,8700]]},{"kind":"weapon","label":"雙手劍","ids":[[52,155200]]},{"kind":"weapon","label":"雙刀","ids":[[69,21100],[70,27500],[71,31100]]},{"kind":"weapon","label":"鋼爪","ids":[[13,110100],[152,24200],[153,34800]]},{"kind":"weapon","label":"矛","ids":[[90,3900],[92,78400],[97,72700],[98,84300],[102,110000],[103,84300],[104,84300],[106,124300]]},{"kind":"weapon","label":"魔杖","ids":[[125,2700],[126,21100],[128,3300],[129,25000],[131,34800]]},{"kind":"weapon","label":"單手鈍器","ids":[[136,2200],[137,1700],[138,8700],[139,10800],[140,9900],[146,38500]]},{"kind":"weapon","label":"雙手鈍器","ids":[[141,11000],[142,180700],[143,7700],[144,189600],[145,155200],[148,143000]]},{"kind":"armor","label":"盔甲","ids":[[20089,6000],[20090,3500],[20120,8500],[20122,11000],[20124,13500],[20125,13500],[20126,8500],[20145,8500],[20147,8500],[20148,6000]]},{"kind":"armor","label":"頭盔","ids":[[20001,1000],[20002,3500],[20007,6000],[20011,7200],[20021,7500],[20043,3500],[20033,10000]]},{"kind":"armor","label":"手套","ids":[[20162,1000],[20163,3500],[20182,1000],[20191,1000]]},{"kind":"armor","label":"靴子","ids":[[20192,6000],[20193,1000],[20194,8500],[20205,6000],[20212,3500],[20213,3500]]},{"kind":"armor","label":"斗篷","ids":[[20052,1000],[20056,6500],[20063,8500],[20073,3500]]},{"kind":"armor","label":"盾牌","ids":[[20219,3500],[20221,8500],[20222,3500],[20223,6000],[20242,6000]]},{"kind":"armor","label":"脛甲","ids":[[330000,11000],[330005,11600]]}],"recipes":[[40520,"other",[[40515,1]],1,true,0,0],[172,"weapon",[[40507,1],[40502,3]],1,false,1500,1],[170,"weapon",[[40507,8],[40494,2],[40502,2],[40504,1]],1,false,15000,2],[180,"weapon",[[40521,4],[40509,1],[40495,5],[40503,5]],1,false,22000,3],[5,"weapon",[[40507,3],[40494,2]],1,false,2500,1],[22,"weapon",[[89,1],[40507,5],[40044,1],[3,1],[40503,8]],1,false,35000,3],[28,"weapon",[[19,1],[40507,3],[40494,10],[40503,8]],1,false,18000,2],[42,"weapon",[[20,1],[40521,2],[40508,10],[40049,1],[40503,6]],1,false,45000,4],[138,"weapon",[[40507,5],[40503,1]],1,false,3000,1],[143,"weapon",[[3,1],[40503,2],[40507,5],[40494,4]],1,false,12000,2],[97,"weapon",[[3,1],[40503,5],[40507,8],[40494,8]],1,false,30000,3],[99,"weapon",[[89,1],[40503,5],[40507,5]],1,true,8000,2],[104,"weapon",[[99,1],[100,1],[40503,10],[40508,20],[40049,1]],1,false,55000,5],[20097,"armor",[[40505,2],[40519,2]],1,false,2000,1],[20139,"armor",[[40504,2],[40502,5]],1,false,5000,1],[20137,"armor",[[40497,2],[40495,15]],1,false,12000,2],[20138,"armor",[[40509,4],[40495,5],[40052,1]],1,false,30000,3],[20222,"armor",[[40505,1],[40503,2],[40507,3]],1,true,3000,1],[20236,"armor",[[20222,1],[40497,1],[40503,2]],1,false,8000,2],[20035,"armor",[[40521,1],[40505,2],[40519,5],[40503,3]],1,true,6000,1],[20033,"armor",[[20035,1],[40048,1],[40050,1],[40051,1],[40318,3],[40509,2],[40495,30]],1,false,100000,5],[20191,"equip",[[40495,5],[40505,2]],1,false,1500,1],[20187,"equip",[[40504,5],[40495,8],[40513,1],[40048,1]],1,false,35000,3],[20073,"equip",[[40318,1],[40495,3],[40520,20]],1,false,5000,1],[20213,"equip",[[40505,2],[40502,3]],1,false,1500,1],[20205,"equip",[[40504,2],[40502,5]],1,false,3000,1],[40068,"arrow",[[40520,25],[40506,1],[40318,1]],1,false,0,0],[3,"other",[[40521,1],[40494,10]],1,true,0,0],[19,"other",[[40521,3],[40494,30]],1,true,0,0],[20,"other",[[40521,3],[40508,75],[40045,3]],1,true,0,0],[89,"other",[[88,2],[40494,16]],1,true,0,0],[100,"other",[[88,4],[40508,40],[40045,3]],1,true,0,0],[40494,"other",[[40496,1]],1,true,0,0],[40521,"other",[[40495,3],[40520,20]],1,true,0,0],[40508,"other",[[40494,2]],1,true,0,0],[40493,"other",[[40505,1],[40508,5]],1,false,0,0],[40378,"other",[[40506,1]],1,false,0,0],[40502,"other",[[40519,1]],1,true,0,0],[40495,"other",[[40502,1],[40494,1]],1,true,0,0],[40504,"other",[[40505,3]],1,true,0,0],[40503,"other",[[40507,2]],1,true,0,0],[40497,"other",[[40494,10],[40504,1]],1,true,0,0],[40509,"other",[[40508,15],[40504,1]],1,true,0,0],[40505,"other",[[40499,1]],1,true,0,0],[169,"weapon",[[40405,8],[40318,1]],1,false,3000,1],[1,"weapon",[[40405,5],[40318,1]],1,false,2500,1],[2,"weapon",[[40405,5]],1,false,1000,1],[4,"weapon",[[40405,5],[40318,1]],1,false,1000,1],[29,"weapon",[[40318,8],[40052,1],[40054,1]],1,false,50000,3],[27,"weapon",[[40318,3],[40048,1],[40050,1]],1,false,15000,2],[32,"weapon",[[40318,5],[40048,1],[40050,1]],1,false,30000,3],[23,"weapon",[[40405,10],[40318,1]],1,false,5000,1],[52,"weapon",[[40318,20],[40052,2],[40054,2],[40055,2]],1,false,200000,8],[69,"weapon",[[40318,3],[40048,1],[40050,1]],1,false,20000,2],[70,"weapon",[[40318,5],[40048,1],[40050,1]],1,false,35000,3],[71,"weapon",[[40318,8],[40052,1],[40054,1]],1,false,55000,3],[13,"weapon",[[40318,15],[40052,2],[40054,2],[40055,1]],1,false,180000,8],[152,"weapon",[[40318,3],[40048,1],[40050,1]],1,false,20000,2],[153,"weapon",[[40318,8],[40052,1],[40054,1]],1,false,60000,3],[90,"weapon",[[40405,12],[40318,2]],1,false,12000,2],[92,"weapon",[[40318,10],[40052,1],[40054,1]],1,false,80000,5],[98,"weapon",[[40318,10],[40052,1],[40054,1]],1,false,65000,5],[102,"weapon",[[40318,12],[40052,2],[40054,1]],1,false,100000,5],[103,"weapon",[[40318,8],[40052,1],[40054,1]],1,false,60000,3],[106,"weapon",[[40318,15],[40052,2],[40054,1],[40055,1]],1,false,150000,5],[125,"weapon",[[40405,8],[40318,1]],1,false,3000,1],[126,"weapon",[[40318,5],[40048,1],[40050,1]],1,false,25000,3],[128,"weapon",[[40405,8],[40318,1]],1,false,4000,1],[129,"weapon",[[40405,12],[40318,2]],1,false,8000,1],[131,"weapon",[[40318,10],[40052,1],[40054,1]],1,false,70000,5],[136,"weapon",[[40405,8],[40318,1]],1,false,4000,1],[137,"weapon",[[40405,8],[40318,1]],1,false,3000,1],[139,"weapon",[[40405,10],[40318,1]],1,false,6000,1],[140,"weapon",[[40405,10],[40318,2]],1,false,7000,1],[146,"weapon",[[40318,6],[40052,1],[40054,1]],1,false,45000,3],[141,"weapon",[[40405,15],[40318,3],[40049,1]],1,false,25000,2],[142,"weapon",[[40318,15],[40052,2],[40054,1],[40055,1]],1,false,150000,5],[144,"weapon",[[40318,20],[40052,2],[40054,2],[40055,2]],1,false,220000,8],[145,"weapon",[[40318,18],[40052,2],[40054,2],[40055,1]],1,false,180000,8],[148,"weapon",[[40318,15],[40052,2],[40054,2],[40055,1]],1,false,180000,8],[20089,"armor",[[40405,12],[40318,2]],1,false,8000,2],[20090,"armor",[[40405,10],[40318,1]],1,false,4000,1],[20120,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20122,"armor",[[40405,20],[40318,3],[40049,1]],1,false,30000,3],[20124,"armor",[[40405,20],[40318,4],[40048,1],[40050,1]],1,false,45000,3],[20125,"armor",[[40405,20],[40318,4],[40048,1],[40050,1]],1,false,45000,3],[20126,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20145,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20147,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20148,"armor",[[40405,12],[40318,2]],1,false,8000,2],[20001,"armor",[[40405,5]],1,false,1000,1],[20002,"armor",[[40405,10],[40318,1]],1,false,4000,1],[20007,"armor",[[40405,12],[40318,2]],1,false,8000,2],[20011,"armor",[[40405,12],[40318,2],[40049,1]],1,false,12000,2],[20021,"armor",[[40405,15],[40318,3],[40049,1]],1,false,25000,3],[20043,"armor",[[40405,10],[40318,1]],1,false,4000,1],[20162,"armor",[[40405,5]],1,false,1000,1],[20163,"armor",[[40405,10],[40318,1]],1,false,4000,1],[20182,"armor",[[40405,5]],1,false,1000,1],[20192,"armor",[[40405,12],[40318,2]],1,false,8000,2],[20193,"armor",[[40405,5]],1,false,1000,1],[20194,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20212,"armor",[[40405,10],[40318,1]],1,false,4000,1],[20052,"armor",[[40405,5]],1,false,1000,1],[20056,"armor",[[40405,12],[40318,2],[40049,1]],1,false,15000,2],[20063,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20219,"armor",[[40405,10],[40318,1]],1,false,4000,1],[20221,"armor",[[40405,15],[40318,2],[40049,1]],1,false,15000,2],[20223,"armor",[[40405,12],[40318,2]],1,false,8000,2],[20242,"armor",[[40405,12],[40318,2]],1,false,8000,2],[330000,"armor",[[40405,20],[40318,3],[40049,1]],1,false,30000,3],[330005,"armor",[[40405,20],[40318,3],[40049,1],[40050,1]],1,false,40000,3]]};d.recipes=d.recipes.map(([out,cat,inputs,yieldCount,internal,gold,coin])=>({out,cat,inputs,yield:yieldCount,internal,gold,coin,status:"本機快取配方"}));return d;}
