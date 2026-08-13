@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0.."

set "LOGFILE=%~dp0change-ip.log"
echo ============================================================ > "%LOGFILE%"
echo   YT-MES IP Change Tool >> "%LOGFILE%"
echo   Started: %date% %time% >> "%LOGFILE%"
echo ============================================================ >> "%LOGFILE%"

echo ============================================================
echo   YT-MES IP Address Change Tool
echo   Updates nginx config (no rebuild needed)
echo   Log: %LOGFILE%
echo ============================================================
echo.
echo [INFO] Run as Administrator if nginx needs reload.

REM === Check admin (for nginx reload) ===
net session >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not running as Administrator.
    echo          nginx reload may fail. Right-click "Run as administrator".
    echo.
)

set "NGINX_CONF=%~dp0..\nginx\nginx-1.26.1\conf\nginx.conf"
set "NGINX_EXE=%~dp0..\nginx\nginx-1.26.1\nginx.exe"
set "BACKUP_CONF=%NGINX_CONF%.bak"

if not exist "%NGINX_CONF%" (
    echo [ERROR] nginx.conf not found: %NGINX_CONF%
    pause
    exit /b 1
)

echo Current server_name entries in nginx.conf:
findstr /C:"server_name" "%NGINX_CONF%" 2>nul
echo.

REM === Prompt for new IP ===
set "NEW_IP="
:ask_ip
set /p "NEW_IP=Enter new server IP address (or 'q' to quit): "
if /i "!NEW_IP!"=="q" exit /b 0
if "!NEW_IP!"=="" goto ask_ip

REM Validate IP using .NET
set "IP_OK="
for /f "delims=" %%v in ('powershell -NoProfile -Command "try { [System.Net.IPAddress]::Parse('!NEW_IP!') ^| Out-Null; 'OK' } catch { 'BAD' }"') do set "IP_OK=%%v"
if not "!IP_OK!"=="OK" (
    echo [ERROR] Invalid IP format. Must be like 192.168.1.59. Try again.
    echo.
    goto ask_ip
)

echo.
echo New IP will be: !NEW_IP!
echo.

REM === Backup original ===
echo [1/4] Backing up nginx.conf...
echo [1/4] Backing up nginx.conf... >> "%LOGFILE%"
copy /Y "%NGINX_CONF%" "%BACKUP_CONF%" >nul

REM === Replace IP ===
echo [2/4] Updating server_name entries...
echo [2/4] Updating server_name entries... >> "%LOGFILE%"
powershell -Command "$f = '%NGINX_CONF%'; $c = Get-Content $f -Raw; $c = $c -replace 'server_name\s+[\d.]+(\s+localhost)?', ('server_name  !NEW_IP! localhost'); $utf8NoBom = New-Object System.Text.UTF8Encoding($False); [System.IO.File]::WriteAllText($f, $c, $utf8NoBom)" 2>nul

if errorlevel 1 (
    echo [ERROR] Failed to update nginx.conf. Restoring backup...
    copy /Y "%BACKUP_CONF%" "%NGINX_CONF%" >nul
    pause
    exit /b 1
)

echo       Done.
echo.
echo   Updated lines:
findstr /C:"server_name" "%NGINX_CONF%"

REM === Test config ===
echo.
echo [3/4] Testing nginx configuration...
echo [3/4] Testing nginx configuration... >> "%LOGFILE%"
pushd "%NGINX_EXE%\..\.."
"%NGINX_EXE%" -t -c "%NGINX_CONF%" 2>nul
set "TEST_RC=%ERRORLEVEL%"
popd
if !TEST_RC! neq 0 (
    echo [ERROR] nginx config invalid! Restoring backup...
    pushd "%NGINX_EXE%\..\.."
    "%NGINX_EXE%" -t -c "%NGINX_CONF%"
    popd
    copy /Y "%BACKUP_CONF%" "%NGINX_CONF%" >nul
    pause
    exit /b 1
)
echo       Config OK.
echo       Config OK. >> "%LOGFILE%"

REM === Reload nginx ===
echo.
echo [4/4] Reloading nginx...
echo [4/4] Reloading nginx... >> "%LOGFILE%"

REM Find existing nginx master process
set "NGINX_PID="
for /f "tokens=2" %%p in ('tasklist /fi "imagename eq nginx.exe" /fo csv 2^>nul ^| findstr /i "nginx.exe"') do (
    if not defined NGINX_PID set "NGINX_PID=%%p"
)

if defined NGINX_PID (
    echo       Found nginx master process PID: !NGINX_PID!
    echo       Found nginx master process PID: !NGINX_PID! >> "%LOGFILE%"
    pushd "%NGINX_EXE%\..\.."
    "%NGINX_EXE%" -s reload -c "%NGINX_CONF%" 2>nul
    set "RELOAD_RC=%ERRORLEVEL%"
    popd
    if !RELOAD_RC! equ 0 (
        echo       nginx reloaded successfully.
        echo       nginx reloaded successfully. >> "%LOGFILE%"
    ) else (
        echo [WARNING] nginx reload returned error. Trying -s reopen...
        pushd "%NGINX_EXE%\..\.."
        "%NGINX_EXE%" -s reopen -c "%NGINX_CONF%" 2>nul
        popd
        echo [INFO] If page still shows old IP, run this manually:
        echo       cd /d D:\YT-MES\nginx\nginx-1.26.1
        echo       nginx -s reload
    )
) else (
    echo [INFO] nginx is not running. Starting it now...
    pushd "%NGINX_EXE%\..\.."
    start "" "%NGINX_EXE%" -c "%NGINX_CONF%"
    popd
    timeout /t 2 /nobreak >nul
    echo       nginx started.
)

echo.
echo ============================================================
echo   IP changed to !NEW_IP!
echo ============================================================
echo.
echo   Access:
echo     http://!NEW_IP!/
echo     http://!NEW_IP!:8081/
echo.
echo   IMPORTANT: Browser may need hard refresh (Ctrl+Shift+R).
echo   Backup: %BACKUP_CONF%
echo ============================================================ >> "%LOGFILE%"
echo.
pause