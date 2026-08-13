# YT-MES 生产部署包

> 重新构建日期：2026-08-12（基于本轮 review 8 项必须修 + 工艺字典校验修复 + 角色 CRUD 修复）

## 1. 产物清单

| 文件 | 内容 | 大小 |
|---|---|---|
| `server/dist.zip` | NestJS API 编译产物 | ~696 KB |
| `web/dist.zip` | Vite 构建的前端静态资源 | ~716 KB |

`server/dist/` 目录结构：
```
dist/
├── main.js
├── app.module.js
├── migrations/
│   ├── 1779414213613-BaselineMigration.js
│   ├── 1781900000000-CreateSysRole.js   # 本轮新增：角色字典表
│   └── ...（共 13 个迁移文件）
├── auth/ batch/ cells/ ...             # 编译后的模块
└── common/ system/ user/ ...
```

`web/dist/` 目录结构：
```
dist/
├── index.html
├── favicon.svg
├── icons.svg
└── assets/                             # 全部页面 + chunk
```

## 2. 上传目录约定

目标服务器推荐目录结构（与 nginx.conf / ecosystem.config.js 一致）：
```
/var/www/yt-mes/
├── server/
│   ├── dist/                  ← 解压 server/dist.zip
│   ├── .env                   ← 数据库/密钥
│   ├── node_modules/          ← 仅需运行时依赖（生产环境建议 `npm ci --omit=dev`）
│   ├── package.json
│   └── ecosystem.config.js    ← pm2 启动配置
└── web/
    └── dist/                  ← 解压 web/dist.zip
```

## 3. 上传步骤

```bash
# 1) 停止现有服务（如有）
cd /var/www/yt-mes/server
pm2 stop ecosystem.config.js

# 2) 备份旧版本
mv dist dist.bak.$(date +%Y%m%d%H%M%S)
mv /var/www/yt-mes/web/dist /var/www/yt-mes/web/dist.bak.$(date +%Y%m%d%H%M%S)

# 3) 上传并解压
#    把 server/dist.zip 放到 /var/www/yt-mes/server/
#    把 web/dist.zip    放到 /var/www/yt-mes/web/
unzip -o server/dist.zip -d /var/www/yt-mes/server/dist/
unzip -o web/dist.zip    -d /var/www/yt-mes/web/dist/

# 4) 启动后端（自动迁移数据库）
cd /var/www/yt-mes/server
pm2 start ecosystem.config.js
pm2 save

# 5) nginx reload
nginx -s reload
```

## 4. 环境变量（`/var/www/yt-mes/server/.env`）

```ini
# 数据库
DB_HOST=127.0.0.1
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=你的数据库密码
DB_DATABASE=YT_MES

# 后端服务
PORT=3001
NODE_ENV=production

# JWT（务必修改）
JWT_SECRET=yt_mes_secret_key_2025_change_me
JWT_REFRESH_SECRET=yt_mes_refresh_secret_key_2025_change_me

# 业务
FACTORY_CODE=WT
```

## 5. nginx 配置

`/var/www/yt-mes/web/nginx.conf` 已存在，前端 dist 由 nginx 提供：
- 主应用端口：8080 → `/var/www/yt-mes/web/dist`
- 大屏端口：8081 → 重写到 `/big-screen`
- `/api/*` 反向代理到 `127.0.0.1:3001`

```bash
# 引用配置
ln -sf /var/www/yt-mes/web/nginx.conf /etc/nginx/conf.d/yt-mes.conf
nginx -t && nginx -s reload
```

## 6. 数据库迁移

`migrationsRun: true` 已在 app.module.ts 启用，启动后端会自动运行未执行过的迁移。

本轮新增的迁移：
- `1781900000000-CreateSysRole.ts`：建 `sys_role` 表 + 初始化 1~4 系统内置角色

## 7. 上传后冒烟

```bash
# 后端健康检查
curl http://localhost:3001/api/health
# 期望返回：{"success":true,"data":{"status":"ok",...}}

# 前端首页
curl -I http://localhost:8080/
# 期望返回：200 OK

# 登录（默认管理员）
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
# 期望返回：accessToken / refreshToken
```

浏览器打开 http://localhost:8080/ → 用 admin / admin123 登录 → 系统管理 → 角色管理（应能 CRUD）。

## 8. 故障回滚

```bash
cd /var/www/yt-mes/server
pm2 stop ecosystem.config.js
mv dist dist.bad
mv dist.bak.<timestamp> dist
pm2 start ecosystem.config.js
```

## 9. 已知改动（本轮 review）

1. 后端 16 个 controller 加 `@Roles(...)` 限权（process-parameter / 13 工艺 / system / process-dictionary / department / equipment / batch DELETE 等）
2. 全局启用 `JwtAuthGuard` + `RolesGuard`（app.module.ts APP_GUARD 注册）
3. `sys_role` 表 + 角色 CRUD（管理员可新增/编辑/删除角色，1~4 系统内置不可改）
4. 前端 `auth.user` 持久化（刷新不再丢失 roleCode）
5. 前端 `UserListPage` 角色下拉/名称动态加载 `systemApi.roles()`
6. 前端 `ProcessDictionaryPage` 参数提交自动 trim 空格 + 重复 Key 检测