@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

set "PROJECT_DIR=%~dp0.."
set "TOOLS_DIR=%PROJECT_DIR%\tools"
set "NSSM_DIR=%TOOLS_DIR%\nssm-temp"
set "NSSM_EXE=%TOOLS_DIR%\nssm.exe"

if exist "%NSSM_EXE%" (
    echo NSSM already installed at: %NSSM_EXE%
    pause
    exit /b 0
)

if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"

echo Downloading NSSM 2.24-101 (64-bit)...
powershell -Command "& {try { Invoke-WebRequest -Uri 'https://nssm.cc/ci/nssm-2.24-101-g897c7ad.zip' -OutFile '%TOOLS_DIR%\nssm.zip' -UseBasicParsing; Write-Host 'Downloaded.' } catch { Write-Host 'ERROR:' $_.Exception.Message; exit 1 }}"

if not exist "%TOOLS_DIR%\nssm.zip" (
    echo Download failed.
    pause
    exit /b 1
)

echo Extracting...
powershell -Command "& { Expand-Archive -Path '%TOOLS_DIR%\nssm.zip' -DestinationPath '%NSSM_DIR%' -Force }"
copy /Y "%NSSM_DIR%\nssm-2.24-101-g897c7ad\win64\nssm.exe" "%NSSM_EXE%" >nul
rmdir /S /Q "%NSSM_DIR%" 2>nul
del "%TOOLS_DIR%\nssm.zip" 2>nul

if exist "%NSSM_EXE%" (
    echo.
    echo NSSM installed at: %NSSM_EXE%
    "%NSSM_EXE%" --version
) else (
    echo [ERROR] Installation failed.
)

echo.
pause