@echo off
chcp 65001 >nul
cd /d "%~dp0"
node publish_update.cjs
if errorlevel 1 (
 echo 更新包產生失敗，請保留目前 GitHub 上的版本。
) else (
 echo 只有工具程式的更新包已準備好。請自行在 GitHub Desktop 檢查、提交並推送。
)
pause
