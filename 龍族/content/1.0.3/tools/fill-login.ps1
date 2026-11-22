# 用 Windows 無障礙介面（UI Automation，螢幕報讀軟體用的那套）把帳號、密碼填進 Chrome 裡遊戲的登入表單。
#
# 為什麼不用 DevTools／模擬鍵盤：Cloudflare 人機驗證會擋被程式控制的瀏覽器；模擬鍵盤要搶游標，打字時點到別的視窗密碼會打到別的地方。
# 這個方法是照「欄位名稱」（帳號、密碼）找到輸入框直接填值，不用搶游標，瀏覽器裡的網頁也分辨不出來（跟螢幕報讀軟體一樣）。
#
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File fill-login.ps1 -ProcessId <Chrome 主程序> -User <帳號>
#       密碼從標準輸入讀一行（不放在命令列參數，工作管理員看不到）。
# 輸出最後一行：OK、NOFORM（等太久沒看到登入表單，可能已經登入了）、ERROR <原因>
param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [Parameter(Mandatory = $true)][string]$User,
  [int]$TimeoutSec = 40
)
$ErrorActionPreference = "Stop"
try {
  $pass = [Console]::In.ReadLine()
  Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
  $A = [System.Windows.Automation.AutomationElement]
  $T = [System.Windows.Automation.TreeScope]
  $C = [System.Windows.Automation.Condition]
  $P = [System.Windows.Automation.PropertyCondition]
  $editCond = New-Object $P ($A::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)

  function Get-ChromeWindow {
    $cond = New-Object $P ($A::ProcessIdProperty, $ProcessId)
    return $A::RootElement.FindFirst($T::Children, $cond)
  }
  # 不靠欄位名稱（中文在 Windows PowerShell 會讀成亂碼，遊戲也可能改字）：
  # 密碼欄是「IsPassword」的那一格，帳號欄是網頁裡緊接在它前面的那一格（網址列不算）
  function Find-Fields($win) {
    $edits = @($win.FindAll($T::Descendants, $editCond) | Where-Object { $_.Current.ClassName -notlike "Omnibox*" })
    for ($i = 0; $i -lt $edits.Count; $i++) {
      if ($edits[$i].Current.IsPassword) {
        if ($i -ge 1) { return @($edits[$i - 1], $edits[$i]) }
        return $null
      }
    }
    return $null
  }
  function Set-Field($e, [string]$value) {
    $vp = $null
    if ($e.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$vp)) {
      $vp.SetValue($value)
      return $true
    }
    return $false
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $userBox = $null; $passBox = $null
  while ((Get-Date) -lt $deadline) {
    $win = Get-ChromeWindow
    if ($win) {
      $pair = Find-Fields $win
      if ($pair) { $userBox = $pair[0]; $passBox = $pair[1]; break }
    }
    Start-Sleep -Milliseconds 700
  }
  if (-not ($userBox -and $passBox)) { "NOFORM"; exit 0 }
  if (-not (Set-Field $userBox $User)) { "ERROR 帳號欄填不進去"; exit 0 }
  if ($pass) {
    if (-not (Set-Field $passBox $pass)) { "ERROR 密碼欄填不進去"; exit 0 }
  }
  "OK"
} catch {
  "ERROR $($_.Exception.Message)"
}
