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
function Show-GameModeDialog {
 Add-Type -AssemblyName System.Windows.Forms
 Add-Type -AssemblyName System.Drawing
 [System.Windows.Forms.Application]::EnableVisualStyles()
 $form = New-Object System.Windows.Forms.Form
 $form.Text = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('5aSp5aCC5YCW5a2Y6ICF')))
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
 $heading.Text = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('6KuL6YG45pOH6YGK546p5qih5byP')))
 $heading.Location = New-Object System.Drawing.Point(24,20)
 $heading.Size = New-Object System.Drawing.Size(390,30)
 $heading.Font = New-Object System.Drawing.Font('Microsoft JhengHei',14,[System.Drawing.FontStyle]::Bold)
 $hint = New-Object System.Windows.Forms.Label
 $hint.Text = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('5YWp56iu5qih5byP5YWx55So6KeS6Imy5a2Y5qqU77yb5LiA6Iis5qih5byP5LiN6aGv56S6IEdNIOmBuOWWruOAgg==')))
 $hint.Location = New-Object System.Drawing.Point(24,59)
 $hint.Size = New-Object System.Drawing.Size(390,40)
 $normal = New-Object System.Windows.Forms.Button
 $normal.Name = 'ModeNormal'
 $normal.Text = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('5LiA6Iis5qih5byP')))
 $normal.Location = New-Object System.Drawing.Point(24,111)
 $normal.Size = New-Object System.Drawing.Size(185,55)
 $normal.TabIndex = 0
 $normal.Add_Click({ $owner = $this.FindForm(); $owner.Tag = 'normal'; $owner.Close() })
 $gm = New-Object System.Windows.Forms.Button
 $gm.Name = 'ModeGM'
 $gm.Text = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('R00g5qih5byP')))
 $gm.Location = New-Object System.Drawing.Point(229,111)
 $gm.Size = New-Object System.Drawing.Size(185,55)
 $gm.TabIndex = 1
 $gm.Add_Click({ $owner = $this.FindForm(); $owner.Tag = 'gm'; $owner.Close() })
 $foot = New-Object System.Windows.Forms.Label
 $foot.Text = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('5YiH5o+b5qih5byP5YmN77yM6KuL5YWI6Zec6ZaJ6IiK55qE6YGK5oiy6IiH5Ly65pyN5Zmo6KaW56qX44CC')))
 $foot.Location = New-Object System.Drawing.Point(24,187)
 $foot.Size = New-Object System.Drawing.Size(390,38)
 $form.Controls.AddRange(@($heading,$hint,$normal,$gm,$foot))
 $form.AcceptButton = $normal
 $form.Add_KeyDown({ if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Escape) { $this.Close() } })
 $form.Add_Shown({ $this.Activate() })
 # SHOW_MODE_DIALOG
 try { [void]$form.ShowDialog(); return $form.Tag } finally { $form.Dispose() }
}

# RUN_BOOTSTRAP
try {
 $root = (Get-Location).ProviderPath
 $launchArgs = @('--launch')
 $mode = Show-GameModeDialog
 if (!$mode) { exit 0 }
 if ($mode -eq 'gm') { $launchArgs += '--gm' }
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
 & $node (Join-Path $root 'repatch_local.cjs') @launchArgs
 exit $LASTEXITCODE
} catch { Write-Host ('ERROR: '+$_.Exception.Message) -ForegroundColor Red; exit 1 }
