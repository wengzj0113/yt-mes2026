@echo off
cd /d D:\traecode\yt-mes

echo ========================================
echo  YT-MES Dev Server Starter
echo ========================================
echo.

echo [1/3] Cleaning ports 3000, 3001, 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3001 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":5173 "') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 >nul

echo [2/3] Starting backend (port 3001)...
start "YT-MES-Backend" cmd /c "cd /d D:\traecode\yt-mes\server && npx nest start --watch"

:wait
timeout /t 2 >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 goto wait
echo   [+] Backend is ready

echo [3/3] Starting frontend (port 5173)...
start "YT-MES-Frontend" cmd /c "cd /d D:\traecode\yt-mes\web && npx vite --host --port 5173"
timeout /t 3 >nul

echo.
echo ========================================
echo  All services started
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo ========================================
echo.
pause
