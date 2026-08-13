@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0.."

echo ============================================================
echo   YT-MES 重启后 502 错误诊断脚本
echo   时间: %date% %time%
echo ============================================================
echo.

echo [1/7] 检查 SQL Server 服务状态...
sc query MSSQLSERVER 2>nul | findstr "STATE"
sc query MSSQL$* 2>nul | findstr "STATE"
echo.

echo [2/7] 检查后端 NSSM 服务状态...
sc query YT-MES-Backend 2>nul | findstr "STATE"
echo.

echo [3/7] 检查关键端口监听...
echo --- 1433 (SQL Server) ---
netstat -ano | findstr ":1433 " | findstr "LISTENING"
echo --- 3001 (Backend API) ---
netstat -ano | findstr ":3001 " | findstr "LISTENING"
echo --- 80 (Nginx 主) ---
netstat -ano | findstr ":80 " | findstr "LISTENING"
echo --- 8081 (Nginx 大屏) ---
netstat -ano | findstr ":8081 " | findstr "LISTENING"
echo.

echo [4/7] 检查 .env 配置是否存在...
if exist "server\.env" (
    echo   [OK] server\.env 存在
    findstr "DB_PASSWORD" "server\.env"
) else (
    echo   [FAIL] server\.env 不存在！请从 .env.example 复制并填写数据库密码。
)
echo.

echo [5/7] 检查后端编译产物...
if exist "server\dist\main.js" (
    echo   [OK] server\dist\main.js 存在
) else (
    echo   [FAIL] server\dist\main.js 不存在！需要重新构建: cd server ^&^& npm run build
)
echo.

echo [6/7] 查看后端日志（最近 50 行）...
if exist "server\logs\backend-stderr.log" (
    echo   --- backend-stderr.log ---
    powershell -Command "Get-Content 'server\logs\backend-stderr.log' -Tail 50 -Encoding UTF8"
) else (
    echo   [INFO] 暂无 backend-stderr.log（说明后端可能从未成功启动过）
)
if exist "server\logs\backend-stdout.log" (
    echo.
    echo   --- backend-stdout.log ---
    powershell -Command "Get-Content 'server\logs\backend-stdout.log' -Tail 30 -Encoding UTF8"
)
echo.

echo [7/7] 后端健康检查...
powershell -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 5).Content } catch { Write-Host '   [FAIL] 后端不可达:' $_.Exception.Message }"
echo.

echo ============================================================
echo   诊断完成
echo ============================================================
echo.
echo 排查建议:
echo   1) 若 SQL Server 未启动 -> net start MSSQLSERVER
echo   2) 若 3001 未监听但服务显示运行 -> 查看 backend-stderr.log
echo   3) 若 dist\main.js 不存在 -> cd server ^&^& npm run build
echo   4) 若 .env 不存在 -> 从 .env.example 复制并填写 DB_PASSWORD
echo   5) 若 SQL Server 先于后端启动 -> 需重启后端服务: deploy\start.bat
echo.
pause