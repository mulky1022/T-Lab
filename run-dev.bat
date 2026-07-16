@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3000 " 2^>nul') do (
  if not "%%a"=="" taskkill /f /pid %%a >nul 2>&1
)

start "Laravel Backend" cmd /k "cd /d "%ROOT%backend" && php artisan serve --host 127.0.0.1"
start "Next.js Frontend" cmd /k "cd /d "%ROOT%frontend" && set PORT=3000 && npm run dev"

echo Started backend and frontend.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000
pause
