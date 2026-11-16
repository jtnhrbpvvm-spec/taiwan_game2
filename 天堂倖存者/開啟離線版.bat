@echo off
setlocal
cd /d "%~dp0"
set "L1STW_ENTRY=%~f0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:L1STW_ENTRY); & ([scriptblock]::Create(($s -split '(?m)^# POWERSHELL_BOOTSTRAP\r?$',2)[1]))"
set "L1STW_EXIT=%errorlevel%"
if not "%L1STW_EXIT%"=="0" pause
exit /b %L1STW_EXIT%
# POWERSHELL_BOOTSTRAP
$ErrorActionPreference = 'Stop'
function Test-UsableNode([string]$Candidate) {
 if (!$Candidate -or !(Test-Path -LiteralPath $Candidate -PathType Leaf)) { return $false }
 try { $v = & $Candidate -p "process.versions.node" 2>$null; return ($LASTEXITCODE -eq 0 -and [string]$v -match '^v?(\d+)\.' -and [int]$Matches[1] -ge 18) } catch { return $false }
}
function Find-UsableNode {
 $paths = @(); $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
 if ($command) { $paths += $command[0].Source }
 foreach ($base in @($env:ProgramW6432,$env:ProgramFiles,${env:ProgramFiles(x86)})) { if ($base) { $paths += Join-Path $base 'nodejs\node.exe' } }
 if ($env:LOCALAPPDATA) { $paths += Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe' }
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
  $installer = Join-Path $root 'node-v26.13.1-x64.msi'
  if (!(Test-Path -LiteralPath $installer -PathType Leaf)) { throw ('Node.js is missing. Keep '+'node-v26.13.1-x64.msi'+' beside this launcher and retry. Do not use a Python installer.') }
  if ((Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash -ne '0398ced8446e119478c724d1aa37c5afd6aa1a76fceab12787eb9714c5ed8b45') { throw 'The bundled Node.js installer is damaged or has been replaced. Installation was stopped.' }
  Write-Host 'Node.js is missing or too old. Starting the bundled Windows installer...'
  Write-Host 'Allow the Windows administrator prompt. Please wait for installation to finish.'
  $process = Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\msiexec.exe') -ArgumentList @('/i',('"'+$installer+'"'),'/passive','/norestart') -Wait -PassThru
  if ($process.ExitCode -eq 1602) { throw 'Node.js installation was cancelled. Run this launcher again when ready.' }
  if ($process.ExitCode -notin @(0,3010)) { throw ('Node.js installation failed. Windows Installer code: '+$process.ExitCode) }
  $node = Find-UsableNode
  if (!$node) { if ($process.ExitCode -eq 3010) { throw 'Restart Windows to complete Node.js installation, then run this launcher again.' }; throw 'Installation finished, but Node.js 18 or newer was not found. Repair the Node.js installation and retry.' }
  if ($process.ExitCode -eq 3010) { Write-Host 'Windows recommends a restart later. Node.js is ready; continuing now.' }
 }
 Write-Host ('Using Node.js: '+$node)
 & $node (Join-Path $root 'repatch_local.cjs') '--launch'
 exit $LASTEXITCODE
} catch { Write-Host ('ERROR: '+$_.Exception.Message) -ForegroundColor Red; exit 1 }
