# YT-MES 批次详情 500 错误一键部署脚本 (PowerShell 版)
# 适用场景: 生产机访问 /api/processes/status/<batchNo> 返回 500
# 根因    : 部署版 process-status.service.ts 仍是旧版 UNION ALL 拼接,
#           任意一张工序表缺失/列结构不一致都会触发 500.
# 修复    : 同步修复版源码 -> 重建 dist -> 重启 NSSM 服务 -> 验证接口
#
# 用法    : powershell -ExecutionPolicy Bypass -File deploy\fix-process-status-500.ps1

$ErrorActionPreference = 'Stop'

$src = 'd:\traecode\YT-mes\server\src\processes\process-status\process-status.service.ts'
$dst = 'D:\YT-MES\server\src\processes\process-status\process-status.service.ts'
$deployDir = 'D:\YT-MES\server'
$marker = 'innerSql'
$probeBatch = '260801' # 验证用批次号 (可改成实际有数据的批次)
$probeUrl = "http://192.168.1.59:8081/api/processes/status/$probeBatch"

function Step($n, $title) {
    Write-Host ""
    Write-Host "[$n/5] $title" -ForegroundColor Cyan
}

function Ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

# ---------- Step 1: 校验源文件 ----------
Step 1 "校验源文件是否包含修复标记 ($marker)"
if (-not (Test-Path $src)) { Fail "源文件不存在: $src"; exit 1 }
$srcHit = Select-String -Path $src -Pattern $marker -SimpleMatch -ErrorAction SilentlyContinue
if (-not $srcHit) { Fail "源文件未包含修复标记 $marker"; exit 1 }
Ok "源文件已是修复版"

# ---------- Step 2: 同步到部署目录 ----------
Step 2 "同步修复版源码到部署目录"
if (-not (Test-Path $dst)) {
    Fail "部署文件不存在: $dst (请确认 D:\YT-MES\server 路径)"
    exit 1
}
$dstHit = Select-String -Path $dst -Pattern $marker -SimpleMatch -ErrorAction SilentlyContinue
if ($dstHit) {
    Info "部署版已是修复版, 跳过同步"
} else {
    Info "部署版是旧版, 开始同步..."
    try {
        Copy-Item -Force $src $dst
    } catch {
        Fail "复制失败: $($_.Exception.Message)"
        exit 1
    }
    $verify = Select-String -Path $dst -Pattern $marker -SimpleMatch -ErrorAction SilentlyContinue
    if (-not $verify) { Fail "同步后仍未检测到修复标记, 请人工检查"; exit 1 }
    Ok "已同步到 $dst"
}

# ---------- Step 3: 重建 dist ----------
Step 3 "重建后端 dist"
if (-not (Test-Path (Join-Path $deployDir 'package.json'))) {
    Fail "$deployDir\package.json 不存在"
    exit 1
}
Push-Location $deployDir
try {
    $env:npm_config_progress = 'false'
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail "npm run build 失败 (exit=$LASTEXITCODE)"; Pop-Location; exit 1 }
} finally {
    Pop-Location
}
if (-not (Test-Path (Join-Path $deployDir 'dist\main.js'))) {
    Fail "构建完成但 dist\main.js 不存在"
    exit 1
}
Ok "构建成功 -> dist\main.js"

# ---------- Step 4: 重启 NSSM 服务 ----------
Step 4 "重启 YT-MES-Backend 服务"
$svc = Get-Service -Name 'YT-MES-Backend' -ErrorAction SilentlyContinue
if (-not $svc) {
    Fail "未找到 NSSM 服务 YT-MES-Backend, 请先 deploy\install-service.bat"
    exit 1
}
if ($svc.Status -eq 'Running') {
    Stop-Service -Name 'YT-MES-Backend' -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}
Start-Service -Name 'YT-MES-Backend' -ErrorAction Stop
Start-Sleep -Seconds 5
$svc = Get-Service -Name 'YT-MES-Backend'
if ($svc.Status -ne 'Running') { Fail "服务启动失败, 当前状态: $($svc.Status)"; exit 1 }
Ok "服务已启动 (Status=$($svc.Status))"

# ---------- Step 5: 验证接口 ----------
Step 5 "验证 $probeUrl"
$attempt = 0
$maxAttempts = 3
$ok = $false
while ($attempt -lt $maxAttempts -and -not $ok) {
    $attempt++
    try {
        $r = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 10
        if ($r.StatusCode -eq 200) {
            $body = $r.Content
            $preview = if ($body.Length -gt 200) { $body.Substring(0, 200) + '...' } else { $body }
            Ok "HTTP $($r.StatusCode)  Body: $preview"
            $ok = $true
        } else {
            Info "HTTP $($r.StatusCode), 第 $attempt/$maxAttempts 次重试..."
            Start-Sleep -Seconds 2
        }
    } catch {
        Info "请求异常: $($_.Exception.Message), 第 $attempt/$maxAttempts 次重试..."
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "============================================================"
if ($ok) {
    Write-Host "  部署完成, 请刷新浏览器验证批次详情" -ForegroundColor Green
    Write-Host "============================================================"
    exit 0
} else {
    Write-Host "  验证失败, 请查看后端日志:" -ForegroundColor Red
    Write-Host "    Get-Content 'D:\YT-MES\server\logs\backend-stderr.log' -Tail 80 -Encoding UTF8" -ForegroundColor Red
    Write-Host "============================================================"
    exit 1
}