@echo off
rem RO Survivors offline launcher (unofficial). Double-click to start.
chcp 65001 >nul
cd /d "%~dp0"
set "PYTHONUTF8=1"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 rs_offline.py %*
  goto :end
)
where python >nul 2>nul
if not errorlevel 1 (
  python -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul
  if not errorlevel 1 (
    python rs_offline.py %*
    goto :end
  )
)
echo.
echo  [!] Python 3 was not found on this computer.
echo      Opening the install guide in your browser...
echo.
start "" "https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO%%E5%%80%%96%%E5%%AD%%98%%E8%%80%%85/offline/#python"
:end
echo.
pause
