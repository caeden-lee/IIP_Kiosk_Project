@echo off
setlocal
set ROOT=%~dp0
set LOG=%ROOT%logs\restart-app.log
if not exist "%ROOT%logs" mkdir "%ROOT%logs"
(
  echo [%DATE% %TIME%] Restart request received
  echo Starting application restart...
) >> "%LOG%"

cd /d "%ROOT%"
start "Kiosk App" cmd /k "node startAll.js"

(
  echo [%DATE% %TIME%] Restart command launched
) >> "%LOG%"

exit /b 0
