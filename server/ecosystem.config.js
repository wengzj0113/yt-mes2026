module.exports = {
  apps: [
    {
      name: 'yt-mes-api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 以下数据库配置建议通过服务器环境变量设置，或者在此处补充
        // DB_HOST: 'localhost',
        // DB_PORT: 1433,
        // DB_USERNAME: 'sa',
        // DB_PASSWORD: 'your_password',
        // DB_DATABASE: 'YT_MES'
      }
    }
  ]
};
