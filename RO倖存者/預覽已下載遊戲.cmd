@echo off
setlocal
cd /d "%~dp0"
set "PYROOT=%USERPROFILE%\AppData\Local\Python"
if exist "%PYROOT%\pythoncore-3.14-64\python.exe" (
  "%PYROOT%\pythoncore-3.14-64\python.exe" -u tools\local_game_preview.py %*
) else if exist "%PYROOT%\bin\python.exe" (
  "%PYROOT%\bin\python.exe" -u tools\local_game_preview.py %*
) else (
  py -3 -u tools\local_game_preview.py %*
)
if errorlevel 1 pause
