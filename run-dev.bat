@echo off
setlocal

set ROOT=%~dp0
cd /d "%ROOT%"

start "Laravel Backend" cmd /k "cd /d "%ROOT%backend" && php artisan serve"
start "Next.js Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo Started backend and frontend.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000
pause
