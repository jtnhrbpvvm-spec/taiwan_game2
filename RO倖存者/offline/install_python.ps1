# RO 倖存者離線版：電腦沒有 Python 時，自動下載並安裝 Python（給「開始遊戲.bat」呼叫）
# 安裝的是 Python 官方的「Python 安裝管理員」(python-manager-26.4.msix，Python Software Foundation 簽章)，
# 再用它裝最新的 Python 3。只裝在目前的使用者底下，不需要系統管理員權限。
# 結束代碼：0 = 裝好了；1 = 沒裝成功（.bat 會改開安裝教學網頁）
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Name   = 'python-manager-26.4.msix'
$Sha256 = '002CFE4F4B63E322E9C8170CEA4D7D97E3E2D18246887325F969BB75F482F4DC'
$Urls   = @(
    ('https://jtnhrbpvvm-spec.github.io/taiwan_game2/' + [uri]::EscapeDataString('RO倖存者') + '/offline/' + $Name),
    ('https://www.python.org/ftp/python/pymanager/' + $Name)
)
$Apps    = Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps'
$PyMgr   = Join-Path $Apps 'pymanager.exe'
$PyExe   = Join-Path $Apps 'py.exe'

function Say($msg, $color = 'Gray') { Write-Host $msg -ForegroundColor $color }

function Test-Python {
    # 用 py 真的跑一行 Python，確認不是空殼
    if (-not (Test-Path $PyExe)) { return $false }
    try {
        $out = & $PyExe -3 -c "import sys; print(sys.version_info[0] * 100 + sys.version_info[1])" 2>$null
        return ([int]("$out".Trim()) -ge 307)
    } catch { return $false }
}

Say ''
Say '  [!] 這台電腦還沒有安裝 Python 3（離線版需要它才能執行）。' Yellow
Say '      現在幫你自動安裝 Python 官方的「Python 安裝管理員」，只要裝一次。' Yellow
Say ''

# Windows 10 1809 以前不支援 .msix
if ([Environment]::OSVersion.Version.Build -lt 17763) {
    Say '  這台電腦的 Windows 版本太舊，沒辦法自動安裝，請照網頁上的教學手動安裝。' Red
    exit 1
}

# ---- 1. 安裝管理員（已經裝過就跳過）----
$have = $null
try { $have = Get-AppxPackage -Name 'PythonSoftwareFoundation.PythonManager' } catch { }
if (-not $have) {
    $dir  = Join-Path $env:TEMP 'rs-offline-python'
    $file = Join-Path $dir $Name
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $ok = $false
    if ((Test-Path $file) -and ((Get-FileHash $file -Algorithm SHA256).Hash -eq $Sha256)) { $ok = $true }
    foreach ($u in $Urls) {
        if ($ok) { break }
        Say ('  下載安裝檔（約 96 MB，請稍等）：' + $u)
        try {
            if (Test-Path $file) { Remove-Item $file -Force }
            $curl = Join-Path $env:SystemRoot 'System32\curl.exe'
            if (Test-Path $curl) {
                & $curl -L --fail --progress-bar -o $file $u
                if ($LASTEXITCODE -ne 0) { throw "curl $LASTEXITCODE" }
            } else {
                (New-Object Net.WebClient).DownloadFile($u, $file)
            }
            if ((Get-FileHash $file -Algorithm SHA256).Hash -eq $Sha256) { $ok = $true }
            else { Say '  下載的檔案內容對不上（可能沒下載完整），換另一個網址再試。' Yellow }
        } catch {
            Say ('  下載失敗（' + $_.Exception.Message + '），換另一個網址再試。') Yellow
        }
    }
    if (-not $ok) {
        Say '  安裝檔下載失敗，請確認網路後再試一次，或照網頁上的教學手動安裝。' Red
        exit 1
    }
    $sig = Get-AuthenticodeSignature $file
    if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch 'Python Software Foundation') {
        Say '  安裝檔的數位簽章不對，為了安全不安裝。' Red
        exit 1
    }
    Say '  安裝 Python 安裝管理員…'
    try {
        Add-AppxPackage -Path $file
    } catch {
        Say ('  安裝失敗：' + $_.Exception.Message) Red
        Say '  請照網頁上的教學手動安裝。' Red
        exit 1
    }
    Remove-Item $file -Force -ErrorAction SilentlyContinue
}

# ---- 2. 用安裝管理員裝 Python 3（已經有就跳過）----
if (-not (Test-Python)) {
    if (-not (Test-Path $PyMgr)) {
        Say '  找不到 Python 安裝管理員的指令（pymanager），請照網頁上的教學手動安裝。' Red
        exit 1
    }
    Say '  下載並安裝 Python 3…'
    & $PyMgr install --yes 3
}

if (Test-Python) {
    Say ''
    Say '  Python 安裝完成！接著開始離線版。' Green
    Say ''
    exit 0
}
Say '  Python 沒有安裝成功，請照網頁上的教學手動安裝。' Red
exit 1
