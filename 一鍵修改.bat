@echo off
chcp 65001 >nul
title 遊戲自動啟動與雙腳本注入器

:: 設定遊戲檔名
set "TARGET_EXE=Idle Lineage.exe"
set "GAME_PATH=%~dp0%TARGET_EXE%"

echo ========================================================
echo  [步驟 1/3] 檢查遊戲主程式...
echo ========================================================
echo.

:: 檢查同資料夾下是否有 Idle Lineage.exe
if not exist "%GAME_PATH%" (
  echo ❌ 找不到檔名為 "%TARGET_EXE%" 的程式！
  echo.
  echo 請確認：
  echo 1. 本 .bat 檔案是否有放在與 %TARGET_EXE% 同一個資料夾內？
  echo 2. 遊戲主程式的檔名是否完全叫 "%TARGET_EXE%"？
  echo.
  echo 按任意鍵關閉視窗...
  pause >nul
  exit /b
)

echo 成功找到遊戲主程式：%TARGET_EXE%
echo.

:: 2. 自動帶上 --remote-debugging-port=9222 並開啟遊戲
echo [步驟 2/3] 正在開啟遊戲並掛載 9222 偵錯埠...
start "" "%GAME_PATH%" --remote-debugging-port=9222

:: 3. 自動等待遊戲載入完畢，並注入兩個書籤腳本
echo.
echo [步驟 3/3] 正在連線至遊戲並自動注入腳本...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $maxRetry = 15; $retry = 0; $wsUrl = $null; while ($retry -lt $maxRetry -and -not $wsUrl) { try { $res = Invoke-RestMethod -Uri 'http://localhost:9222/json' -ErrorAction Stop; $targets = @($res) | Where-Object { $_.webSocketDebuggerUrl -and $_.type -eq 'page' }; if (-not $targets) { $targets = @($res) | Where-Object { $_.webSocketDebuggerUrl }; } if ($targets) { $wsUrl = $targets[0].webSocketDebuggerUrl; } } catch { Start-Sleep -Seconds 1; $retry++; } }; if ($wsUrl) { $ws = New-Object System.Net.WebSockets.ClientWebSocket; $cts = New-Object System.Threading.CancellationTokenSource; $uri = [Uri]$wsUrl; $ws.ConnectAsync($uri, $cts.Token).Wait(); $js1 = '(function(){const b=\"https://kid0924.github.io/idle-lineage-class/\",t=window.location.hostname.includes(\"pp771007\"),c=[\"klh_initial.js\",\"klh_GMShop.js\",\"klh_mobile-perf.js\",\"klh_perf-monitor.js\",\"klh_Backpack.js\",\"klh_pk.js\",\"klh_Pandora.js\"].map(x=>b+x),n=t?[...[\"https://kid0924.github.io/idle-lineage-class/klh_remove-banner.js\"],...c]:[...[\"https://pp771007.github.io/idle-lineage-class/afk-lzcache.js\",\"https://pp771007.github.io/idle-lineage-class/afk-offline.js\"],...c];function s(e,t){const n=document.createElement(\"div\");n.textContent=e,n.style.cssText=\"position:fixed;top:20px;right:20px;background:\"+(t?\"#2ecc71\":\"#e74c3c\")+\";color:white;padding:12px 24px;border-radius:8px;z-index:99999;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.5s\",document.body.appendChild(n),setTimeout(()=>{n.style.opacity=\"0\",setTimeout(()=>n.remove(),500)},2500)}function l(e){return new Promise((t,n)=>{const o=document.createElement(\"script\");o.src=e+\"?v=\"+Date.now(),o.onload=(()=>{t()}),o.onerror=(()=>{n(e)}),document.body.appendChild(o)})}n.reduce((e,t)=>e.then(()=>l(t)),Promise.resolve()).then(()=>{s(\"🎉 \"+(!t?\"【離線掛機 + 外掛模組】\":\"【外掛模組】\")+\"注入成功！\",!0)}).catch(r=>{const f=(r&&typeof r===\"string\")?r.split(\"/\").pop().split(\"?\")[0]:\"\";s(\"❌ 載入失敗\"+(f?\"：\"+f:\"！\"),!1)})})();'; $js2 = '(function(){var o=document.getElementById(\"geo-mod-loader\");if(o)o.remove();var s=document.createElement(\"script\");s.id=\"geo-mod-loader\";s.src=\"https://tokey1988tw-hub.github.io/demonbaby2/geo-mod.js?t=\" + Date.now();document.body.appendChild(s);})();'; $payload1 = @{ id = 1; method = 'Runtime.evaluate'; params = @{ expression = $js1 } } | ConvertTo-Json -Compress; $bytes1 = [System.Text.Encoding]::UTF8.GetBytes($payload1); $ws.SendAsync([System.ArraySegment[byte]]$bytes1, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait(); Write-Host '➜ [1/2] 書籤 1 已發送...' -ForegroundColor Cyan; Start-Sleep -Milliseconds 500; $payload2 = @{ id = 2; method = 'Runtime.evaluate'; params = @{ expression = $js2 } } | ConvertTo-Json -Compress; $bytes2 = [System.Text.Encoding]::UTF8.GetBytes($payload2); $ws.SendAsync([System.ArraySegment[byte]]$bytes2, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait(); Write-Host '➜ [2/2] 書籤 2 已發送...' -ForegroundColor Cyan; $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'Done', $cts.Token).Wait(); Write-Host '🎉 兩個腳本皆已順利注入完成！祝遊戲愉快！' -ForegroundColor Green; } else { Write-Host '❌ 連線逾時，無法連線上遊戲的 9222 埠。' -ForegroundColor Red; }"

echo.
echo 按任意鍵關閉視窗...
pause >nul