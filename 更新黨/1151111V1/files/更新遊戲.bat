@echo off
rem WebL1 offline updater: GitHub patches + webl1.com version check. Double-click to update.
rem If Python 3 is missing: installs the bundled python-manager-*.msix (if present), then downloads Python 3.
chcp 65001 >nul
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "PY="
call :findpy
if defined PY goto :run

echo.
echo  [!] Python 3 was not found on this computer.
set "MSIX="
for %%F in (python-manager-*.msix) do set "MSIX=%%F"
if not defined MSIX goto :nopy

echo      Installing the bundled Python install manager: %MSIX%
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Add-AppxPackage -Path (Get-Item '.\python-manager-*.msix' | Select-Object -First 1).FullName -ErrorAction Stop; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 goto :msixui
set "PATH=%LOCALAPPDATA%\Microsoft\WindowsApps;%PATH%"
echo.
echo      Downloading Python 3 (about 30 MB, needs internet) ...
py install 3
call :findpy
if defined PY goto :run
echo.
echo  [!] Python was installed but could not be started yet.
echo      Please close this window and double-click this file again.
goto :end

:msixui
echo.
echo  [!] Automatic install did not work. Opening the installer window instead:
echo      click "Install", wait until it finishes, then double-click this file again.
start "" "%MSIX%"
goto :end

:nopy
echo      Opening the install guide in your browser...
echo.
start "" "https://jtnhrbpvvm-spec.github.io/taiwan_game2/RO%%E5%%80%%96%%E5%%AD%%98%%E8%%80%%85/offline/#python"
goto :end

:run
rem The whole ( ) block is read before it runs, so the updater can replace this .bat file safely.
(
%PY% "tools\auto_updater.py" --menu %*
echo.
pause
exit /b
)

:end
echo.
pause
exit /b

:findpy
set "PY="
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul <nul
if not errorlevel 1 set "PY=py -3"
if defined PY exit /b 0
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul <nul
if not errorlevel 1 set "PY=python"
exit /b 0
