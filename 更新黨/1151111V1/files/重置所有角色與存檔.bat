@echo off
rem 清空所有帳號角色與存檔資料，恢復至全新初始狀態
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================================
echo   網頁奇岩城離線版 - 重置所有角色與存檔資料
echo ========================================================
echo.
echo 正在清空本機存檔與角色數據庫...
if exist "saves\characters.json" del /q "saves\characters.json"
if exist "saves\characters_gm.json" del /q "saves\characters_gm.json"
if exist "saves\*.part" del /q "saves\*.part"

(
echo {
echo   "account": "",
echo   "chars": [],
echo   "warehouse": [],
echo   "nextItemId": 500001,
echo   "reset": true,
echo   "signin": { "next": 1, "signed": 0, "lastDay": "" }
echo }
) > "saves\characters.json"

copy /y "saves\characters.json" "saves\characters_gm.json" >nul

echo.
echo  [V] 所有角色與存檔數據已完全清空，目前已恢復為全新乾淨狀態！
echo      您可以直接發給朋友，或雙擊「開始遊戲.bat」全新創角遊玩。
echo.
pause
