@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ============================================================
echo   YT-MES Service Uninstaller
echo ============================================================
echo.

REM === Admin check ===
net session >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Administrator privileges required.
    pause
    exit /b 1
)

set "NSSM=%~dp0..\tools\nssm.exe"

sc query YT-MES-Backend >nul 2>&1
if errorlevel 1 (
    echo [INFO] Service YT-MES-Backend is not installed. Nothing to do.
    pause
    exit /b 0
)

echo Stopping YT-MES-Backend service...
"%NSSM%" stop YT-MES-Backend 2>nul
timeout /t 3 /nobreak >nul

echo Removing YT-MES-Backend service...
"%NSSM%" remove YT-MES-Backend confirm
if errorlevel 1 (
    echo [ERROR] Failed to remove service.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Service uninstalled successfully.
echo   Auto-start on boot has been disabled.
echo ============================================================
echo.
pause