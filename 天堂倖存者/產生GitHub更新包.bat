@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 18 or newer is required.
 pause
 exit /b 1
)
node publish_update.cjs
pause
