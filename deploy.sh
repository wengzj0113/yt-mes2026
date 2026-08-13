#!/bin/bash
# YT-MES 自动化部署脚本 (针对阿里云 Linux 服务器)
# 目标服务器: 8.138.80.92
# 用法: bash deploy.sh

set -e

echo "==> 开始部署 YT-MES 系统..."

# ========== 1. 基础环境检查 ==========
command -v node  >/dev/null 2>&1 || { echo "[FATAL] 未安装 Node.js"; exit 1; }
command -v npm   >/dev/null 2>&1 || { echo "[FATAL] 未安装 npm"; exit 1; }
command -v pm2   >/dev/null 2>&1 || { echo "正在安装 PM2..."; npm install -g pm2; }
command -v nginx >/dev/null 2>&1 || { echo "[FATAL] 未安装 Nginx"; exit 1; }

# ========== 2. .env 必填项预检 ==========
if [ ! -f "server/.env" ]; then
  echo "[FATAL] server/.env 不存在，请先基于 .env.example 创建并填好 DB_PASSWORD / JWT_SECRET 等"
  exit 1
fi

# 加载 DB_* 变量用于日志展示
DB_VARS=$(grep -E '^DB_' server/.env || true)
if [ -n "$DB_VARS" ]; then
  echo "[ENV] 数据库配置："
  echo "$DB_VARS" | sed 's/PASSWORD=.*/PASSWORD=***/'
else
  echo "[FATAL] server/.env 中缺少 DB_* 配置"
  exit 1
fi

# ========== 3. 备份当前运行版本（便于回滚） ==========
BACKUP_DIR="/var/backups/yt-mes/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -d "/var/www/yt-mes/server/dist" ]; then
  cp -r /var/www/yt-mes/server/dist "$BACKUP_DIR/server-dist.bak"
  echo "[BACKUP] 后端已备份 -> $BACKUP_DIR/server-dist.bak"
fi
if [ -d "/var/www/yt-mes/web/dist" ]; then
  cp -r /var/www/yt-mes/web/dist "$BACKUP_DIR/web-dist.bak"
  echo "[BACKUP] 前端已备份 -> $BACKUP_DIR/web-dist.bak"
fi

# ========== 4. 拉取/更新代码 ==========
# 假设已在项目根目录且代码已 git pull 到目标版本
# git pull origin main

# ========== 5. 部署后端 (NestJS) ==========
echo "==> 编译后端服务..."
cd server
npm ci --omit=dev
npm run build

echo "==> 运行 TypeORM 迁移（首次/增量都会执行）..."
npm run migration:run

# 可选：首次部署可手动开启 seed
# read -p "是否执行数据初始化 seed？(y/N) " yn
# if [ "$yn" = "y" ]; then
#   DEFAULT_USER_PASSWORD=xxx npm run seed
# fi

cd ..

# ========== 6. 部署前端 (Vue 3) ==========
echo "==> 编译前端页面..."
cd web
npm ci --omit=dev
npm run build
cd ..

# ========== 7. 发布编译产物到运行时目录 ==========
sudo mkdir -p /var/www/yt-mes/server
sudo rsync -a --delete server/dist/       /var/www/yt-mes/server/dist/
sudo rsync -a server/package.json         /var/www/yt-mes/server/
sudo rsync -a server/.env                 /var/www/yt-mes/server/
sudo rsync -a --delete web/dist/          /var/www/yt-mes/web/dist/

# ========== 8. PM2 重启 ==========
pm2 delete yt-mes-api 2>/dev/null || true
pm2 start server/ecosystem.config.js
pm2 save

# ========== 9. Nginx 配置 ==========
echo "==> 配置 Nginx..."
sudo cp web/nginx.conf /etc/nginx/conf.d/yt-mes.conf
sudo nginx -t && sudo systemctl reload nginx

echo "------------------------------------------------"
echo " 部署完成！"
echo " 前端访问地址: http://8.138.80.92:8080"
echo " 大屏看板:    http://8.138.80.92:8081"
echo " 后端 API:    http://8.138.80.92:8080/api"
echo " 健康检查:    curl http://127.0.0.1:3001/api/health"
echo " 日志查看:    pm2 logs yt-mes-api"
echo " 回滚备份:    $BACKUP_DIR"
echo "------------------------------------------------"
