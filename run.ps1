[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$host.UI.RawUI.WindowTitle = '遊戲自動啟動與四腳本控制面板'

$targetExe = 'Idle Lineage.exe'
$gamePath = Join-Path -Path $PSScriptRoot -ChildPath $targetExe

Write-Host '========================================================' -ForegroundColor Yellow
Write-Host ' [步驟 1/3] 檢查遊戲主程式...' -ForegroundColor Yellow
Write-Host '========================================================'
Write-Host ''

if (-not (Test-Path $gamePath)) {
    Write-Host '❌ 找不到檔名為 ''Idle Lineage.exe'' 的程式！' -ForegroundColor Red
    Write-Host '請確認本檔案是否有放在與 Idle Lineage.exe 同一個資料夾內。'
    Read-Host '按 Enter 鍵關閉視窗...'
    exit
}

Write-Host '成功找到遊戲主程式：Idle Lineage.exe' -ForegroundColor Green
Write-Host ''

Write-Host '[步驟 2/3] 正在開啟遊戲並掛載 9222 偵錯埠...' -ForegroundColor Yellow
Start-Process -FilePath $gamePath -ArgumentList '--remote-debugging-port=9222'

Write-Host ''
Write-Host '⏳ 正在等待遊戲視窗載入 (3 秒)...' -ForegroundColor Cyan
Start-Sleep -Seconds 3

function Invoke-GameScript {
    param ([string]$Action)
    
    $ErrorActionPreference = 'Stop'
    $maxRetry = 15
    $retry = 0
    $wsUrl = $null

    while ($retry -lt $maxRetry -and -not $wsUrl) {
        try {
            $res = Invoke-RestMethod -Uri 'http://localhost:9222/json' -ErrorAction Stop
            $targets = @($res) | Where-Object { $_.webSocketDebuggerUrl -and ($_.type -eq 'page' -or $_.type -eq 'other') }
            if ($targets) { $wsUrl = $targets[0].webSocketDebuggerUrl }
        } catch { 
            Start-Sleep -Seconds 1
            $retry++ 
        }
    }

    if (-not $wsUrl) {
        Write-Host '❌ 錯誤：無法連線上遊戲 9222 埠。' -ForegroundColor Red
        return
    }

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $uri = [Uri]$wsUrl
    $ws.ConnectAsync($uri, $cts.Token).Wait()

    function Eval-JS($code) {
        $payload = @{
            id = 1
            method = 'Runtime.evaluate'
            params = @{ expression = $code; returnByValue = $true }
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $ws.SendAsync([System.ArraySegment[byte]]$bytes, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buffer = New-Object Byte[] 16384
        $segment = New-Object System.ArraySegment[byte] (,$buffer)
        $result = $ws.ReceiveAsync($segment, $cts.Token).Result
        $jsonResp = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count) | ConvertFrom-Json
        return $jsonResp.result.result.value
    }

    $jc1 = '(function(){const b="https://kid0924.github.io/idle-lineage-class/",t=window.location.hostname.includes("pp771007"),c=["klh_initial.js","klh_GMShop.js","klh_mobile-perf.js","klh_perf-monitor.js","klh_Backpack.js","klh_pk.js","klh_Pandora.js"].map(x=>b+x),n=t?[...["https://kid0924.github.io/idle-lineage-class/klh_remove-banner.js"],...c]:[...["https://pp771007.github.io/idle-lineage-class/afk-lzcache.js","https://pp771007.github.io/idle-lineage-class/afk-offline.js"],...c];function s(e,t){const n=document.createElement("div");n.textContent=e,n.style.cssText="position:fixed;top:20px;right:20px;background:"+(t?"#2ecc71":"#e74c3c")+";color:white;padding:12px 24px;border-radius:8px;z-index:99999;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.5s",document.body.appendChild(n),setTimeout(()=>{n.style.opacity="0",setTimeout(()=>n.remove(),500)},2500)}function l(e){return new Promise((t,n)=>{const o=document.createElement("script");o.src=e+"?v="+Date.now(),o.onload=(()=>{t()}),o.onerror=(()=>{n(e)}),document.body.appendChild(o)})}n.reduce((e,t)=>e.then(()=>l(t)),Promise.resolve()).then(()=>{s("🎉 "+(!t?"【離線掛機 + 外掛模組】":"【外掛模組】")+"注入成功！",!0)}).catch(r=>{const f=(r&&typeof r==="string")?r.split("/").pop().split("?")[0]:"";s("❌ 載入失敗"+(f?"：" +f:"！"),!1)})})();'
    $jc2 = '(function(){var o=document.getElementById("geo-mod-loader");if(o)o.remove();var s=document.createElement("script");s.id="geo-mod-loader";s.src="https://tokey1988tw-hub.github.io/demonbaby2/geo-mod.js?t=" + Date.now();document.body.appendChild(s);})();'
    $jc3 = 'fetch("https://raw.githubusercontent.com/jack1988520-pixel/casino.js/main/casino.js").then(r=>r.text()).then(eval);'
    $jc4 = @'
(function(){
    if(!window.__cleanLogs) window.__cleanLogs = [];
    window.__doCleanLag = function(type){
        var typeName = type || "手動";
        var beforeMem = 0, afterMem = 0;
        try{
            var liveW = npcClanGetWorld(player);
            if(liveW && liveW.memberships) beforeMem = Object.keys(liveW.memberships).length;
        }catch(e){}
        try{
            var c = _clanReadState();
            if(c && c.npcWorlds && c.npcWorlds.normal){
                var w = c.npcWorlds.normal;
                var keep = {};
                Object.entries(w.memberships || {}).forEach(function(e){
                    var n = e[0], m = e[1];
                    if(m && m.leader) keep[n] = m;
                });
                w.memberships = keep;
                _clanWriteState(c);
            }
        }catch(e){}
        try{
            var liveW2 = npcClanGetWorld(player);
            if(liveW2 && liveW2.memberships){
                var liveKeep = {};
                Object.entries(liveW2.memberships).forEach(function(e){
                    var n = e[0], m = e[1];
                    if(m && m.leader) liveKeep[n] = m;
                });
                liveW2.memberships = liveKeep;
                afterMem = Object.keys(liveW2.memberships).length;
            }
        }catch(e){}
        var d = new Date();
        var now = d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes()+':'+(d.getSeconds()<10?'0':'')+d.getSeconds();
        var logEntry = '[' + now + '] (' + typeName + ') Memberships: ' + beforeMem + ' -> ' + afterMem;
        window.__cleanLogs.push(logEntry);
        if(window.__cleanLogs.length > 20) window.__cleanLogs.shift();
        return { before: beforeMem, after: afterMem };
    };
    if(!window.__lagCleanerSet){
        setInterval(function(){ window.__doCleanLag("自動"); }, 600000);
        window.__lagCleanerSet = true;
    }
})();
'@

    if ($Action -eq "ALL" -or $Action -eq "1") {
        [void](Eval-JS $jc1)
        Write-Host "➜ [1] 離線掛機+外掛模組 已發送..." -ForegroundColor Cyan
        Start-Sleep -Milliseconds 500
    }
    if ($Action -eq "ALL" -or $Action -eq "2") {
        [void](Eval-JS $jc2)
        Write-Host "➜ [2] GM商店跟各種神奇功能以及無界擂台 已發送..." -ForegroundColor Cyan
        Start-Sleep -Milliseconds 500
    }
    if ($Action -eq "ALL" -or $Action -eq "3") {
        [void](Eval-JS $jc3)
        Write-Host "➜ [3] Casino 賭場模組 已發送..." -ForegroundColor Cyan
        Start-Sleep -Milliseconds 500
    }
    if ($Action -eq "ALL" -or $Action -eq "INJECT_CLEANER") {
        [void](Eval-JS $jc4)
        Write-Host "➜ [4] 定期清理 LAG 腳本已注入！（每 10 分鐘背景自動清理）" -ForegroundColor Green
    }
    if ($Action -eq "CLEAN_NOW") {
        $res = Eval-JS "window.__doCleanLag ? window.__doCleanLag('手動') : {before:'?', after:'?'};"
        Write-Host "🧹 已執行 LAG 資料清理！" -ForegroundColor Yellow
        Write-Host "📊 Memberships 數量變化: $($res.before) ➜ $($res.after)" -ForegroundColor Cyan
    }
    if ($Action -eq "QUERY_MEM") {
        $val = Eval-JS "(function(){try{var w=npcClanGetWorld(player);return Object.keys(w.memberships||{}).length;}catch(e){return '0';}})();"
        Write-Host "📊 目前 Memberships 數量為: $val" -ForegroundColor Cyan
    }
    if ($Action -eq "QUERY_LOGS") {
        $logs = Eval-JS "(function(){return (window.__cleanLogs || []).join('#');})();"
        Write-Host "================== 📜 清理歷史紀錄 ==================" -ForegroundColor Yellow
        if ($logs) {
            $logArray = $logs -split '#'
            foreach ($item in $logArray) {
                Write-Host $item -ForegroundColor DarkCyan
            }
        } else {
            Write-Host "目前尚無清理紀錄。" -ForegroundColor Gray
        }
        Write-Host "=====================================================" -ForegroundColor Yellow
    }

    try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'Done', $cts.Token).Wait() } catch {}
}

# ✅ 修正後的寫法（只保留 ALL 即可）：
Write-Host "[步驟 3/3] 正在連線至遊戲並自動注入所有腳本..." -ForegroundColor Yellow
Invoke-GameScript -Action "ALL"

while ($true) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host "                 🛠️ 腳本手動重新注入控制面板" -ForegroundColor Yellow
    Write-Host "========================================================"
    Write-Host "  [1] 重發 腳本 1 (離線掛機 + 外掛模組)"
    Write-Host "  [2] 重發 腳本 2 (GM商店跟各種神奇功能以及無界擂台)"
    Write-Host "  [3] 重發 腳本 3 (Casino 賭場模組)"
    Write-Host "  [4] 手動執行 LAG 清理 (顯示清理前後數量比對)"
    Write-Host "  [5] 查看目前 Memberships 數量"
    Write-Host "  [6] 查看歷史清理紀錄 (包含每10分鐘背景自動清理)"
    Write-Host "  [A] 全部重新發送 (1 ~ 3 + 重新注入清理器)"
    Write-Host "  [Q] 離開程式"
    Write-Host "========================================================"
    
    $choice = Read-Host "請輸入選項 (1/2/3/4/5/6/A/Q) 後按 Enter"

    switch ($choice.ToString().ToUpper()) {
        "1" { Invoke-GameScript -Action "1" }
        "2" { Invoke-GameScript -Action "2" }
        "3" { Invoke-GameScript -Action "3" }
        "4" { Invoke-GameScript -Action "CLEAN_NOW" }
        "5" { Invoke-GameScript -Action "QUERY_MEM" }
        "6" { Invoke-GameScript -Action "QUERY_LOGS" }
        "A" { Invoke-GameScript -Action "ALL"; Invoke-GameScript -Action "INJECT_CLEANER" }
        "Q" { Write-Host "👋 程式已關閉。"; exit }
        Default { Write-Host "❌ 無效的選項，請重新輸入！" -ForegroundColor Red }
    }
}