@echo off
rem RO Survivors offline launcher - GM mode (unofficial). Saves are separate from normal mode.
chcp 65001 >nul
cd /d "%~dp0"
set "PYTHONUTF8=1"
call :findpy
if not defined PYRUN (
  if exist install_python.ps1 powershell -NoProfile -ExecutionPolicy Bypass -File install_python.ps1
  call :findpy
)
if not defined PYRUN goto :nopy
%PYRUN% rs_offline.py --gm %*
goto :end
:nopy
echo.
echo  [!] Python 3 was not found on this computer.
echo      Opening the install guide in your browser...
echo.
start "" "https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO%%E5%%80%%96%%E5%%AD%%98%%E8%%80%%85/offline/#python"
:end
echo.
pause
exit /b

rem Find a working Python 3.7+ (stdin from nul so nothing can wait for a prompt)
:findpy
set "PYRUN="
where py >nul 2>nul
if not errorlevel 1 (
  py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" <nul >nul 2>nul
  if not errorlevel 1 (
    set "PYRUN=py -3"
    exit /b
  )
)
if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\py.exe" (
  "%LOCALAPPDATA%\Microsoft\WindowsApps\py.exe" -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" <nul >nul 2>nul
  if not errorlevel 1 (
    set PYRUN="%LOCALAPPDATA%\Microsoft\WindowsApps\py.exe" -3
    exit /b
  )
)
where python >nul 2>nul
if errorlevel 1 exit /b
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" <nul >nul 2>nul
if not errorlevel 1 set "PYRUN=python"
exit /b