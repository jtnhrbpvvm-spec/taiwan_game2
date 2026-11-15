@echo off
chcp 65001 >nul
cd /d "%~dp0"
node l1stw_crawler.cjs
if errorlevel 1 echo 下載未完全成功，請查看報告並重試。
pause
