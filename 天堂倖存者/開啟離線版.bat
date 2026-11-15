@echo off
chcp 65001 >nul
cd /d "%~dp0"
node update_client.cjs
if not exist "%USERPROFILE%\Desktop\天堂倖存者\離線遊戲\public\index.html" (
 echo 請先執行更新下載.bat
 pause
 exit /b 1
)
node repatch_local.cjs
if errorlevel 1 (
 pause
 exit /b 1
)
node offline_server.cjs --open
pause
