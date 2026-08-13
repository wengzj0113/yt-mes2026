@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo ============================================================
echo   YT-MES 批次详情 500 错误一键修复脚本
echo ============================================================
echo.

set "SRC=d:\traecode\YT-mes\server\src\processes\process-status\process-status.service.ts"
set "DST=D:\YT-MES\server\src\processes\process-status\process-status.service.ts"

echo [1/5] 检查修复后的源码...
if not exist "%SRC%" goto NO_SRC
findstr /C:"innerSql" "%SRC%" >nul 2>&1
if errorlevel 1 goto OLD_SRC
echo   [OK] 源文件已是修复版
goto STEP2

:NO_SRC
echo   [FAIL] 源文件不存在: %SRC%
goto END_FAIL

:OLD_SRC
echo   [FAIL] 源文件未包含修复标记 innerSql
goto END_FAIL

:STEP2
echo.
echo [2/5] 检查部署版本...
if not exist "%DST%" goto SKIP_COPY
findstr /C:"innerSql" "%DST%" >nul 2>&1
if not errorlevel 1 goto SKIP_COPY
echo   [INFO] 部署版本是旧版，开始同步修复...
copy /Y "%SRC%" "%DST%" >nul
if errorlevel 1 goto COPY_FAIL
echo   [OK] 已同步到部署版本
goto STEP3

:COPY_FAIL
echo   [FAIL] 复制失败
goto END_FAIL

:SKIP_COPY
echo   [OK] 部署版本已是新版，跳过同步

:STEP3
echo.
echo [3/5] 重建后端 dist...
cd /d "D:\YT-MES\server"
if not exist "package.json" goto NO_PKG
call npm run build
if errorlevel 1 goto BUILD_FAIL
echo   [OK] 构建成功
goto STEP4

:NO_PKG
echo   [FAIL] package.json 不存在
goto END_FAIL

:BUILD_FAIL
echo   [FAIL] 构建失败
goto END_FAIL

:STEP4
echo.
echo [4/5] 重启 YT-MES-Backend 服务...
net stop YT-MES-Backend >nul 2>&1
timeout /t 3 /nobreak >nul
net start YT-MES-Backend
if errorlevel 1 goto START_FAIL
echo   [OK] 服务已启动
goto STEP5

:START_FAIL
echo   [FAIL] 启动失败
goto END_FAIL

:STEP5
echo.
echo [5/5] 等待 5 秒后验证接口...
timeout /t 5 /nobreak >nul
echo.
echo   测试: http://192.168.1.59:8081/api/processes/status/260801
powershell -Command "try { (Invoke-WebRequest 'http://192.168.1.59:8081/api/processes/status/260801' -UseBasicParsing -TimeoutSec 10).Content } catch { Write-Host '[FAIL]' $_.Exception.Message }"
echo.
echo ============================================================
echo   修复完成 - 请刷新浏览器验证
echo ============================================================
goto END_OK

:END_FAIL
echo.
echo   修复未完成，请把上方报错截图发我

:END_OK
echo.
pause