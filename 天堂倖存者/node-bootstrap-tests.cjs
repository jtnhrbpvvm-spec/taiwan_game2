'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const {windowsBootstrap}=require('./repatch_local.cjs');
const q=s=>"'"+s.replace(/'/g,"''")+"'";
test('missing Node bootstraps the bundled installer, validates it, and resumes without a new shell',{skip:process.platform!=='win32'},()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'l1stw-bootstrap-test-')),dir=path.join(base,'中文 空白 folder');fs.mkdirSync(dir);const payload=Buffer.from('TEST MSI: no installation is performed'),sha=crypto.createHash('sha256').update(payload).digest('hex');
 fs.writeFileSync(path.join(dir,'entry.cjs'),`console.log('RESUMED '+JSON.stringify(process.argv.slice(2)));`);
 function run({exit=0,file='valid',install=true,arch='AMD64',onPath=false}={}){
  const pf=path.join(dir,'mock-program-files'),installed=path.join(pf,'nodejs','node.exe');if(fs.existsSync(installed))fs.unlinkSync(installed);if(fs.existsSync(path.join(dir,'installer-called.json')))fs.unlinkSync(path.join(dir,'installer-called.json'));const msi=path.join(dir,'node-test-x64.msi');if(file==='missing'){if(fs.existsSync(msi))fs.unlinkSync(msi);}else fs.writeFileSync(msi,file==='valid'?payload:Buffer.from('CORRUPTED'));
  const setup=`$env:ProgramW6432=${q(pf)}; $env:ProgramFiles=${q(pf)}; \${env:ProgramFiles(x86)}=${q(pf)}; $env:LOCALAPPDATA=${q(pf)}; $env:PROCESSOR_ARCHITEW6432=''; $env:PROCESSOR_ARCHITECTURE=${q(arch)}
function Get-Command { ${onPath?`[pscustomobject]@{Source=${q(process.execPath)}}`:'return $null'} }
function Start-Process {
 param($FilePath,$ArgumentList,[switch]$Wait,[switch]$PassThru)
 if (!(($FilePath -like '*msiexec.exe') -and $Wait -and $PassThru -and $ArgumentList[0] -eq '/i' -and $ArgumentList[1] -eq ('"'+${q(msi)}+'"') -and $ArgumentList[2] -eq '/passive' -and $ArgumentList[3] -eq '/norestart')) { throw 'Unexpected installer command' }
 [IO.File]::WriteAllText(${q(path.join(dir,'installer-called.json'))},($ArgumentList | ConvertTo-Json))
 ${install?`[IO.Directory]::CreateDirectory(${q(path.dirname(installed))}) | Out-Null; [IO.File]::Copy(${q(process.execPath)},${q(installed)},$true)`:''}
 [pscustomobject]@{ExitCode=${exit}}
}
`;
  const s=windowsBootstrap('entry.cjs',['--launch','--gm'],{name:'node-test-x64.msi',sha256:sha}).replace('# RUN_BOOTSTRAP',setup+'\n# RUN_BOOTSTRAP');fs.writeFileSync(path.join(dir,'test.ps1'),'\uFEFF'+s,'utf8');const r=cp.spawnSync('powershell.exe',['-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(dir,'test.ps1')],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:60000});assert.equal(r.error,undefined);return {...r,called:fs.existsSync(path.join(dir,'installer-called.json'))};
 }
 try{
  let r=run();assert.equal(r.status,0,r.stdout+r.stderr);assert(r.called);assert(r.stdout.includes('RESUMED ["--launch","--gm"]'));
  r=run({onPath:true,file:'missing'});assert.equal(r.status,0,r.stdout+r.stderr);assert(!r.called);
  r=run({file:'missing'});assert.equal(r.status,1);assert(!r.called);assert(r.stdout.includes('Keep node-test-x64.msi'));
  r=run({file:'bad'});assert.equal(r.status,1);assert(!r.called);assert(r.stdout.includes('damaged or has been replaced'));
  r=run({arch:'ARM64'});assert.equal(r.status,1);assert(!r.called);assert(r.stdout.includes('requires 64-bit Intel/AMD'));
  r=run({exit:1602,install:false});assert.equal(r.status,1);assert(r.called);assert(r.stdout.includes('cancelled'));assert(!r.stdout.includes('RESUMED'));
  r=run({exit:1603,install:false});assert.equal(r.status,1);assert(r.stdout.includes('1603'));assert(!r.stdout.includes('RESUMED'));
  r=run({exit:3010});assert.equal(r.status,0,r.stdout+r.stderr);assert(r.stdout.includes('RESUMED'));assert(r.stdout.includes('restart later'));
  r=run({exit:3010,install:false});assert.equal(r.status,1);assert(r.stdout.includes('Restart Windows'));assert(!r.stdout.includes('RESUMED'));
  r=run({exit:0,install:false});assert.equal(r.status,1);assert(r.stdout.includes('was not found'));assert(!r.stdout.includes('RESUMED'));
 }finally{if(path.resolve(base).startsWith(path.resolve(os.tmpdir())+path.sep+'l1stw-bootstrap-test-'))fs.rmSync(base,{recursive:true,force:true});}
});
