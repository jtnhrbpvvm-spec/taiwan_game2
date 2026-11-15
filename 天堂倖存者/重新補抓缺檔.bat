@echo off
chcp 65001 >nul
cd /d "%~dp0"
node retry_missing.cjs --output "%USERPROFILE%\Desktop\天堂倖存者\離線遊戲" --concurrency 8
pause
