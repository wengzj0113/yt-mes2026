@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"

set "NSSM=%~dp0..\tools\nssm.exe"

if not exist "%NSSM%" (
    echo [ERROR] NSSM not found at: %NSSM%
    pause
    exit /b 1
)

sc query YT-MES-Backend >nul 2>&1
if errorlevel 1 (
    echo [INFO] Service YT-MES-Backend is not installed.
    echo        Run install-service.bat to install it.
    pause
    exit /b 0
)

echo Starting YT-MES-Backend service...
"%NSSM%" start YT-MES-Backend
if errorlevel 1 (
    echo [ERROR] Failed to start service.
    pause
    exit /b 1
)

echo Waiting 10 seconds for initialization...
timeout /t 10 /nobreak >nul

echo.
echo Status:
sc query YT-MES-Backend | findstr "STATE"
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 echo   Port 3001: LISTENING

echo.
pause