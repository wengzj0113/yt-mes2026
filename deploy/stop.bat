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
    pause
    exit /b 0
)

echo Stopping YT-MES-Backend service...
"%NSSM%" stop YT-MES-Backend
if errorlevel 1 (
    echo [ERROR] Failed to stop service.
    pause
    exit /b 1
)

echo.
echo Status:
sc query YT-MES-Backend | findstr "STATE"

echo.
pause