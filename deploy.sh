#!/bin/bash

# YT-MES 自动化部署脚本 (针对阿里云 Linux 服务器)
# 目标服务器: 8.138.80.92

echo "开始部署 YT-MES 系统..."

# 1. 检查基础环境
command -v node >/dev/null 2>&1 || { echo "错误: 未安装 Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "错误: 未安装 npm"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "正在安装 PM2..."; npm install -g pm2; }
command -v nginx >/dev/null 2>&1 || { echo "错误: 未安装 Nginx"; exit 1; }

# 2. 拉取/更新代码 (假设已在项目根目录)
# git pull origin main

# 3. 部署后端 (NestJS)
echo "正在编译后端服务..."
cd server
npm install
npm run build
pm2 delete yt-mes-api 2>/dev/null
pm2 start ecosystem.config.js
cd ..

# 4. 部署前端 (Vue 3)
echo "正在编译前端页面..."
cd web
npm install
npm run build
cd ..

# 5. 配置 Nginx
echo "正在配置 Nginx..."
# 注意: 这里需要 sudo 权限
sudo cp web/nginx.conf /etc/nginx/conf.d/yt-mes.conf
sudo nginx -t && sudo systemctl restart nginx

echo "------------------------------------------------"
echo "部署完成！"
echo "前端访问地址: http://8.138.80.92:8080"
echo "后端 API 地址: http://8.138.80.92:8080/api"
echo "请确保阿里云安全组已放行 8080 端口。"
echo "------------------------------------------------"
