# YT-MES 部署与运维

## 文件结构

```
deploy/
├── install-service.bat    # 一键安装（管理员）-- 注册 NSSM 后端服务
├── start.bat              # 手动启动后端
├── stop.bat               # 手动停止后端
├── uninstall-service.bat  # 卸载服务（关闭开机自启）
├── change-ip.bat          # 一键修改服务器 IP
└── install-service.log    # 安装日志（自动生成）

tools/
└── nssm.exe               # NSSM 2.24-101 (64-bit)

server/
├── .env                   # 后端配置（DB 密码等）
├── dist/                  # 编译产物
└── logs/                  # 后端运行日志

nginx/nginx-1.26.1/
├── nginx.exe
└── conf/nginx.conf        # nginx 配置（IP 在这里改）
```

## 部署

1. 安装 Node.js (>= 18)
2. 安装 SQL Server，修改 `server/.env` 中的 `DB_PASSWORD`
3. 管理员运行 `deploy\install-service.bat`

服务自动：
- 开机自启
- 崩溃自启（5秒延迟）
- 日志自动轮转（10MB）

## 修改服务器 IP

```cmd
deploy\change-ip.bat
```

输入新 IP 即可。无需重新编译前端或后端。

## 常用命令

```cmd
sc query YT-MES-Backend          # 查看服务状态
net start YT-MES-Backend         # 启动
net stop YT-MES-Backend          # 停止
sc delete YT-MES-Backend         # 删除服务（先 stop）
```

## 故障排查

```cmd
curl http://127.0.0.1:3001/api/health   # 后端健康检查
type server\logs\backend-stdout.log      # 后端标准输出
type server\logs\backend-stderr.log     # 后端错误输出
type deploy\install-service.log         # 安装日志
eventvwr.msc                             # Windows 事件查看器
```

## 端口分配

| 端口 | 用途 |
|------|------|
| 80   | Nginx 主应用（前端 + API 反代） |
| 8081 | Nginx 大屏看板 |
| 3001 | 后端 API（仅本地监听，nginx 反代） |
| 1433 | SQL Server（仅本地监听） |