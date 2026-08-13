@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0.."

set "LOGFILE=%~dp0install-service.log"
echo ============================================================ > "%LOGFILE%"
echo   YT-MES Service Installer (NSSM-based) >> "%LOGFILE%"
echo   Started: %date% %time% >> "%LOGFILE%"
echo ============================================================ >> "%LOGFILE%"

REM === Tee all output to logfile as well as console ===
for /f "delims=" %%L in ('copy /z "%~f0" nul 2^>nul') do set "EMPTY=%%L"

echo.
echo ============================================================
echo   YT-MES Service Installer (NSSM-based)
echo   Runs backend as a Windows service with auto-start on boot
echo   Log file: %LOGFILE%
echo ============================================================
echo.

REM === Admin check ===
net session >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Administrator privileges required.
    echo         Right-click and "Run as administrator".
    echo. >> "%LOGFILE%"
    echo [ERROR] Administrator privileges required. >> "%LOGFILE%"
    pause
    exit /b 1
)

REM === Paths ===
set "PROJECT_DIR=%~dp0.."
set "SERVER_DIR=%PROJECT_DIR%\server"
set "WEB_DIR=%PROJECT_DIR%\web"
set "TOOLS_DIR=%PROJECT_DIR%\tools"
set "NSSM=%TOOLS_DIR%\nssm.exe"
set "LOG_DIR=%SERVER_DIR%\logs"

echo [1/8] Checking prerequisites...
echo [1/8] Checking prerequisites... >> "%LOGFILE%"

REM Check NSSM
if not exist "%NSSM%" (
    echo [ERROR] NSSM not found at: %NSSM%
    echo         Run tools\download-nssm.bat first.
    echo [ERROR] NSSM not found. >> "%LOGFILE%"
    pause
    exit /b 1
)
echo       NSSM: OK
echo       NSSM: OK >> "%LOGFILE%"

REM Check Node.js
set "NODE_EXE="
where node >nul 2>&1
for /f "delims=" %%i in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%i"
if not defined NODE_EXE if exist "D:\Program Files\nodejs\node.exe" set "NODE_EXE=D:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
if not defined NODE_EXE (
    echo [ERROR] Node.js not found.
    echo [ERROR] Node.js not found. >> "%LOGFILE%"
    pause
    exit /b 1
)
for %%F in ("!NODE_EXE!") do set "NODE_DIR=%%~dpF"
echo       Node: !NODE_EXE!
echo       Node: !NODE_EXE! >> "%LOGFILE%"

REM Check .env
if not exist "%SERVER_DIR%\.env" (
    echo [ERROR] .env not found.
    echo [ERROR] .env not found. >> "%LOGFILE%"
    pause
    exit /b 1
)
echo       .env: OK
echo       .env: OK >> "%LOGFILE%"

REM === Step 2 ===
echo.
echo [2/8] Installing dependencies (if needed)...
echo [2/8] Installing dependencies... >> "%LOGFILE%"
if not exist "%SERVER_DIR%\node_modules" (
    echo       server: npm install...
    pushd "%SERVER_DIR%"
    call npm install >> "%LOGFILE%" 2>&1
    if errorlevel 1 ( echo [ERROR] server npm install failed. >> "%LOGFILE%"; popd; pause; exit /b 1 )
    popd
)
if not exist "%WEB_DIR%\node_modules" (
    echo       web: npm install...
    pushd "%WEB_DIR%"
    call npm install >> "%LOGFILE%" 2>&1
    if errorlevel 1 ( echo [ERROR] web npm install failed. >> "%LOGFILE%"; popd; pause; exit /b 1 )
    popd
)
echo       Done.
echo       Done. >> "%LOGFILE%"

REM === Step 3 ===
echo.
echo [3/8] Building backend...
echo [3/8] Building backend... >> "%LOGFILE%"
pushd "%SERVER_DIR%"
call npm run build >> "%LOGFILE%" 2>&1
if errorlevel 1 ( echo [ERROR] backend build failed. >> "%LOGFILE%"; popd; pause; exit /b 1 )
popd
echo       Done.
echo       Done. >> "%LOGFILE%"

echo.
echo [4/8] Building frontend...
echo [4/8] Building frontend... >> "%LOGFILE%"
pushd "%WEB_DIR%"
call npm run build >> "%LOGFILE%" 2>&1
if errorlevel 1 ( echo [ERROR] frontend build failed. >> "%LOGFILE%"; popd; pause; exit /b 1 )
popd
echo       Done.
echo       Done. >> "%LOGFILE%"

REM === Step 4: Log dir ===
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM === Step 5 ===
echo.
echo [5/8] Removing existing service (if any)...
echo [5/8] Removing existing service... >> "%LOGFILE%"
"%NSSM%" stop YT-MES-Backend 2>nul
timeout /t 2 /nobreak >nul
"%NSSM%" remove YT-MES-Backend confirm 2>nul

REM === Step 6 ===
echo.
echo [6/8] Installing YT-MES-Backend service...
echo [6/8] Installing YT-MES-Backend service... >> "%LOGFILE%"
"%NSSM%" install YT-MES-Backend "!NODE_EXE!" "%SERVER_DIR%\dist\main.js"
if errorlevel 1 ( echo [ERROR] nssm install failed. >> "%LOGFILE%"; pause; exit /b 1 )

"%NSSM%" set YT-MES-Backend AppDirectory "%SERVER_DIR%"
"%NSSM%" set YT-MES-Backend DisplayName "YT-MES Backend API"
"%NSSM%" set YT-MES-Backend Description "YT-MES Backend API (port 3001)"
"%NSSM%" set YT-MES-Backend Start SERVICE_AUTO_START
"%NSSM%" set YT-MES-Backend AppStdout "%LOG_DIR%\backend-stdout.log"
"%NSSM%" set YT-MES-Backend AppStderr "%LOG_DIR%\backend-stderr.log"
"%NSSM%" set YT-MES-Backend AppRotateFiles 1
"%NSSM%" set YT-MES-Backend AppRotateBytes 10485760
"%NSSM%" set YT-MES-Backend AppRestartDelay 5000
"%NSSM%" set YT-MES-Backend AppThrottle 3000
"%NSSM%" set YT-MES-Backend AppExit Default Restart
"%NSSM%" set YT-MES-Backend AppNoConsole 1
"%NSSM%" set YT-MES-Backend AppEnvironmentExtra "NODE_ENV=production"
echo       Done.
echo       Done. >> "%LOGFILE%"

REM === Step 7 ===
echo.
echo [7/8] Starting YT-MES-Backend service...
echo [7/8] Starting service... >> "%LOGFILE%"
"%NSSM%" start YT-MES-Backend
if errorlevel 1 ( echo [ERROR] nssm start failed. >> "%LOGFILE%"; pause; exit /b 1 )
echo       Waiting 15 seconds for initialization...
timeout /t 15 /nobreak >nul

REM === Step 8 ===
echo.
echo [8/8] Verifying...
echo [8/8] Verifying... >> "%LOGFILE%"
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Port 3001 not listening yet.
    echo           Check log: %LOG_DIR%\backend-stderr.log
    echo [WARNING] Port 3001 not listening. >> "%LOGFILE%"
) else (
    echo       Port 3001: LISTENING
    echo       Port 3001: LISTENING >> "%LOGFILE%"
    echo.
    echo   Health check:
    powershell -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 5).Content } catch { Write-Host '   [FAIL]' $_.Exception.Message }"
)

echo.
echo ============================================================
echo   Installation complete!
echo ============================================================
echo.
echo   Backend service: YT-MES-Backend (auto-start on boot)
echo   Backend port:    3001
echo   Frontend port:   80  (nginx)
echo   Logs:           %LOG_DIR%\
echo   Install log:    %LOGFILE%
echo.
echo   Access:         http://192.168.1.59/
echo.
echo   Manual control (from deploy\ folder):
echo     start.bat / stop.bat / uninstall-service.bat
echo.
echo ============================================================ >> "%LOGFILE%"
echo   Installation complete! >> "%LOGFILE%"
echo ============================================================ >> "%LOGFILE%"
echo.
pause