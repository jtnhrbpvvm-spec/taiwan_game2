param([Parameter(Mandatory=$true)][string]$Version)
$ErrorActionPreference='Stop'
$py=Join-Path $env:LOCALAPPDATA 'Python\bin\python.exe'
$tools='C:\Users\a2095\Desktop\【龙族OL】VM一键单机版-隐盟整理\本機版製作\發佈工具'
& $py (Join-Path $tools 'prepare_release.py') $Version
if($LASTEXITCODE){throw '封裝失敗，未發佈'}
& $py (Join-Path $tools 'publish_release.py') $Version
if($LASTEXITCODE){throw '本機發佈失敗'}
