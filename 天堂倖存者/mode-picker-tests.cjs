'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {windowsBootstrap,modePickerPowerShell,ensureWindowsLaunchers}=require('./repatch_local.cjs');
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
function run(dir,script){const p=path.join(dir,'test.ps1');fs.writeFileSync(p,'\uFEFF'+script,'utf8');const r=cp.spawnSync('powershell.exe',['-STA','-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',p],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:60000});assert.equal(r.error,undefined);return r;}
test('both picker buttons launch the correct mode; closing skips all startup side effects',{skip:process.platform!=='win32'},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-picker-test-'));try{
  fs.writeFileSync(path.join(dir,'entry.cjs'),"console.log('ARGS '+JSON.stringify(process.argv.slice(2)));");
  for(const mode of ['normal','gm','cancel']){const chosen=mode==='cancel'?'return $null':'return '+q(mode),script=windowsBootstrap('entry.cjs',['--launch','--choose-mode']).replace('# RUN_BOOTSTRAP',`function Show-GameModeDialog { ${chosen} }\nfunction Find-UsableNode { ${mode==='cancel'?"throw 'Cancelled dialog must not search or install Node'":'return '+q(process.execPath)} }\n# RUN_BOOTSTRAP`);const r=run(dir,script);assert.equal(r.status,0,r.stdout+r.stderr);if(mode==='cancel')assert(!r.stdout.includes('ARGS'));else assert(r.stdout.includes('ARGS '+JSON.stringify(mode==='gm'?['--launch','--gm']:['--launch'])));}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Windows mode dialog has two functioning buttons and can be closed without selection',{skip:process.platform!=='win32'},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-picker-ui-test-'));try{
  for(const choice of ['normal','gm','cancel']){
   const setup=`$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 200
$timer.Tag = @{ Form=$form; Choice=${q(choice)} }
$timer.Add_Tick({ $this.Stop(); $f=$this.Tag.Form; if ($f.Controls.Find('ModeNormal',$true).Length -ne 1 -or $f.Controls.Find('ModeGM',$true).Length -ne 1) { $f.Tag='bad'; $f.Close() } elseif ($this.Tag.Choice -eq 'cancel') { $f.Close() } else { $f.Controls.Find($(if($this.Tag.Choice -eq 'gm'){'ModeGM'}else{'ModeNormal'}),$true)[0].PerformClick() }; $this.Dispose() })
$timer.Start()
# SHOW_MODE_DIALOG`;
   const r=run(dir,modePickerPowerShell().replace('# SHOW_MODE_DIALOG',setup)+"\n$x=Show-GameModeDialog; Write-Output ('CHOICE '+$x)");assert.equal(r.status,0,r.stdout+r.stderr);assert(r.stdout.includes('CHOICE '+(choice==='cancel'?'':choice)),r.stdout+r.stderr);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('the actual hybrid batch picker launches GM from a Chinese path',{skip:process.platform!=='win32'},()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-picker-batch-test-')),dir=path.join(base,'空白 模式');fs.mkdirSync(dir);try{ensureWindowsLaunchers(dir);const p=path.join(dir,'開啟離線版.bat');let s=fs.readFileSync(p,'ascii');s=s.replace('# SHOW_MODE_DIALOG',"$timer=New-Object System.Windows.Forms.Timer\r\n $timer.Interval=150\r\n $timer.Tag=$form\r\n $timer.Add_Tick({$this.Stop();$this.Tag.Controls.Find('ModeGM',$true)[0].PerformClick();$this.Dispose()})\r\n $timer.Start()\r\n # SHOW_MODE_DIALOG");fs.writeFileSync(p,s,'ascii');fs.writeFileSync(path.join(dir,'repatch_local.cjs'),"console.log('HYBRID_ARGS '+JSON.stringify(process.argv.slice(2)));");const r=cp.spawnSync(process.env.ComSpec||'cmd.exe',['/d','/c','開啟離線版.bat'],{cwd:dir,input:'\r\n',encoding:'utf8',windowsHide:true,timeout:60000});assert.equal(r.error,undefined);assert.equal(r.status,0,r.stdout+r.stderr);assert(r.stdout.includes('HYBRID_ARGS ["--launch","--gm"]'),r.stdout+r.stderr);}finally{fs.rmSync(base,{recursive:true,force:true});}
});
