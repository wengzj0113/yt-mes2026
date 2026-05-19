# YT-MES 部署指南（初学者版）

本文档面向**没有编程经验**的操作人员，每一步都详细解释"为什么要做"和"怎么做"。

---

## 准备工作：需要安装哪些东西？

### 1. 安装 Node.js（后端和前端都需要）

Node.js 是用来运行 JavaScript 代码的环境。

1. 打开浏览器，访问 https://nodejs.org
2. 下载 **LTS 版本**（左边那个，比如 20.x 或 22.x）
3. 双击安装包，一路点"下一步"直到完成
4. 验证安装是否成功：
   - 按 `Win + R`，输入 `cmd`，回车
   - 在黑窗口中输入 `node -v`，回车
   - 如果显示 `v20.x.x` 之类的版本号，说明安装成功

### 2. 安装 SQL Server（数据库）

1. 下载 SQL Server 2022 Express（免费版）：
   - 访问 https://www.microsoft.com/sql-server/sql-server-downloads
   - 点 **Express** 版本的"下载"
2. 安装时注意：
   - **功能选择**：勾选"数据库引擎服务"
   - **实例配置**：选"默认实例"
   - **服务器配置**：身份验证模式选"**混合模式**"
   - 设置 `sa` 账号的密码（务必记牢！）
3. 安装完成后，重启电脑

---

## 最终目标：三样东西都跑在一台电脑上

```
你打开浏览器访问 http://localhost:3000
        ↓
  前端界面 (web/)
        ↓ 自动转发
  后端程序 (server/)
        ↓ 读写数据
  数据库 (SQL Server)
```

---

# 第一步：把项目文件复制到新电脑

## 1.1 从哪里拿文件？

从当前开发电脑上，把整个 `YT-mes` 文件夹复制到新电脑。可以用 U 盘、网络共享、或者压缩成 zip 包传过去。

> **建议位置**：放到 `D:\YT-mes` 或 `C:\YT-mes`，路径中不要有中文和空格。

## 1.2 最终目录结构

复制完成后，新电脑上的目录应该是这样的：

```
D:\YT-mes\
├── server\          ← 后端程序（NestJS）
├── web\             ← 前端界面（Vue 3）
├── doc\             ← 文档
└── .trae\           ← 配置文件（可忽略）
```

---

# 第二步：部署后端（server 文件夹）

后端是"藏在后台的程序"，用户看不到它，但它负责处理数据和业务逻辑。

## 2.1 打开命令行

1. 按 `Win + R`，输入 `cmd`，回车
2. 输入以下命令进入项目目录（根据你的实际路径修改）：

```cmd
cd /d D:\YT-mes\server
```

> `/d` 参数用于切换到不同盘符（比如从 C: 到 D:）

## 2.2 安装依赖包（npm install）

这一步下载后端程序需要用到的大量第三方代码库。

```cmd
npm install
```

执行时会看到很多文字滚动，**不要关闭窗口**。过程可能需要 1-5 分钟，取决于网速。
看到类似下面这样就是成功了：

```
added 1234 packages in 30s
```

**如果报错怎么办？**
- 网络问题：换个网络重试
- 权限问题：右键 cmd → "以管理员身份运行"
- 如果提示 `npm 不是内部或外部命令`：说明 Node.js 没装好

## 2.3 修改配置文件（.env）

`.env` 文件是配置文件，告诉后端程序怎么连接数据库。

### 找到文件

用记事本打开 `D:\YT-mes\server\.env`

### 需要改哪些内容？

```env
# === 必须修改的内容 ===

# 数据库密码（改为你在安装 SQL Server 时设置的 sa 密码）
DB_PASSWORD=你的数据库密码

# JWT 密钥（用于登录加密，可改为任意随机字符串，长度至少32位）
JWT_SECRET=随便打一堆字母数字，比如 MyRandomKey2025!@#$%
JWT_REFRESH_SECRET=再打一堆不同的字母数字

# === 一般不用改 ===

DB_HOST=localhost                    # 数据库地址，同一台电脑就不用改
DB_PORT=1433                         # 数据库端口，默认 1433
DB_USERNAME=sa                       # 数据库账号
DB_DATABASE=YT_MES                   # 数据库名
PORT=3001                            # 后端程序的端口
NODE_ENV=development                 # 开发模式
FACTORY_CODE=WT                      # 工厂编号，决定批次号前缀（如 WT-20260512-001）
```

### 保存文件

按 `Ctrl + S` 保存，然后关闭记事本。

### 为什么 JWT_SECRET 要改？

不改的话，所有用这套系统的人都能用同一个密钥伪造登录令牌，存在安全风险。

## 2.4 构建项目（npx nest build）

将 TypeScript 代码编译成 JavaScript，让 Node.js 能直接运行。

```cmd
npx nest build
```

执行后如果没有任何错误提示（直接回到命令提示符），就说明构建成功。
此时 `server\dist\` 文件夹里会多出很多 `.js` 文件。

## 2.5 执行建库脚本

这一步在 SQL Server 中创建 YT_MES 数据库和所有表。

### 方法一：用命令行执行（不依赖 SSMS）

在 cmd 中执行：

```cmd
sqlcmd -S localhost -U sa -P 你的数据库密码 -i doc\create-database.sql
```

### 方法二：用 SSMS 图形界面执行

1. 打开 **SQL Server Management Studio (SSMS)**
2. 连接服务器：服务器名称填 `localhost`，身份验证选"SQL Server 身份验证"，用 `sa` 登录
3. 点击菜单 **文件** → **打开** → **文件**
4. 选择 `doc\create-database.sql`
5. 点击工具栏的 **!执行** 按钮（或按 F5）

执行完成后，底部消息窗口会显示"YT-MES 数据库创建完成！"

## 2.6 初始化种子数据（npm run seed）

在数据库中创建默认的用户、部门、设备数据。

```cmd
npm run seed
```

看到输出这样就是成功了：

```
Seeded 5 users.
Seeded 4 departments.
Seeded 4 equipment records.
Seed completed successfully.
```

### 默认账号有哪些？

| 用户名 | 密码 | 姓名 | 角色 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 管理员（最高权限） |
| operator1 | admin123 | 张三 | 操作员（录入工序数据） |
| operator2 | admin123 | 李四 | 操作员 |
| quality1 | admin123 | 王五 | 质检员（录入品质检查） |
| warehouse1 | admin123 | 赵六 | 仓管员（录入材料数据） |

> **生产环境务必修改默认密码！**

## 2.7 启动后端（npm run start:prod）

```cmd
npm run start:prod
```

看到以下输出表示启动成功：

```
[Nest] XXXXX  -  LOG [NestApplication] Nest application successfully started
YT-MES API running on http://localhost:3001/api
```

**验证是否启动成功**：打开浏览器，访问 http://localhost:3001/api/health
如果看到 `{"success":true,"data":{"status":"ok"}}`，说明后端启动正常。

> **注意**：这个窗口**不要关闭**，关闭后端就停了。如果必须关，请看下一步"注册为 Windows 服务"。

## 2.8 （可选）注册为 Windows 服务

这一步让后端程序在后台自动运行，即使关了 cmd 窗口也不会停。

### 先用 PM2（推荐，最简单）

```cmd
npm install -g pm2
pm2 start dist/main.js --name yt-mes-api
pm2 save
pm2 startup
```

执行 `pm2 startup` 后，会显示一行命令，复制它并执行一遍。这样以后电脑开机后后端会自动启动。

### 常用 PM2 命令

```cmd
pm2 list              # 查看所有运行的程序
pm2 logs yt-mes-api   # 查看程序日志（查错时用）
pm2 restart yt-mes-api  # 重启程序
pm2 stop yt-mes-api   # 停止程序
```

---

# 第三步：部署前端（web 文件夹）

前端是用户在浏览器里看到的界面。

## 3.1 打开新的命令行窗口

按 `Win + R`，输入 `cmd`，回车。进入前端目录：

```cmd
cd /d D:\YT-mes\web
```

> 这个窗口和后端的 cmd 窗口**互不冲突**，可以同时开着。

## 3.2 安装依赖包

```cmd
npm install
```

等待完成，看到 `added xxx packages` 就成功了。

## 3.3 配置 API 地址

这一步告诉前端程序：后端程序在哪台机器的哪个端口上运行。

用记事本打开 `D:\YT-mes\web\vite.config.ts`

找到这一段：

```typescript
server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
},
```

如果前端和后端在同一台电脑上，**不需要修改**。`http://localhost:3001` 就是指"本机的 3001 端口"。

如果不在同一台电脑，把 `localhost` 改为后端电脑的 IP 地址，例如：

```typescript
'/api': { target: 'http://192.168.1.100:3001', changeOrigin: true },
```

## 3.4 构建项目（npm run build）

把前端代码编译成浏览器能识别的静态文件（HTML、CSS、JS）。

```cmd
npm run build
```

完成后，`web\dist\` 文件夹里会出现前端的所有静态文件。

## 3.5 启动前端

### 方式一：简单测试（推荐初学者）

```cmd
npm run dev
```

看到以下输出表示启动成功：

```
VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

打开浏览器，访问 **http://localhost:3000**，应该能看到登录页面。

> 注意：这是开发模式，这个 cmd 窗口同样不能关闭。

### 方式二：生产环境部署（用 Nginx，适合正式使用）

#### 2a. 下载 Nginx

1. 访问 https://nginx.org/en/download.html
2. 下载 **Stable version** 的 Windows 版本（zip 包）
3. 解压到 `C:\nginx`（或任意无中文的路径）

#### 2b. 配置 Nginx

用记事本打开 `C:\nginx\conf\nginx.conf`，找到 `server {` 块，替换为：

```nginx
server {
    listen       80;
    server_name  localhost;

    root   D:/YT-mes/web/dist;        # 改为你前端的 dist 路径
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;   # 处理 Vue 路由
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;   # 转发到后端
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 2c. 启动 Nginx

```cmd
cd C:\nginx
start nginx
```

打开浏览器访问 **http://localhost**（注意没有端口号，因为 Nginx 默认端口是 80）。

#### 2d. 常用 Nginx 命令

```cmd
nginx -s stop      # 停止
nginx -s reload    # 重启（修改配置后执行）
nginx -s quit      # 安全退出
```

---

# 第四步：完整启动流程（速查版）

如果你已经全部部署好，每次重启电脑后的启动顺序：

```
1. 确保 SQL Server 正在运行（任务管理器 → 服务 → SQL Server (MSSQLSERVER) → 启动）

2. 启动后端：
   打开 cmd → cd /d D:\YT-mes\server → npm run start:prod
   （或用 PM2: pm2 start yt-mes-api）

3. 启动前端：
   a) 如果用了 Nginx：nginx -s reload
   b) 如果用 dev 模式：打开另一个 cmd → cd /d D:\YT-mes\web → npm run dev

4. 打开浏览器访问 http://localhost:3000 或 http://localhost
```

---

# 第五步：验证系统是否正常工作

用浏览器即可验证：

1. 打开 http://localhost:3000
2. 看到登录页面
3. 输入用户名 `admin`，密码 `admin123`
4. 点击登录，进入主界面
5. 能正常看到仪表盘、菜单，不报错

---

# 常见问题排查

### Q: 打开浏览器显示"无法访问此网站"

可能原因和解决方法：

- **后端没启动** → 检查运行后端的 cmd 窗口是否还开着
- **端口被占用** → 改 `.env` 中的 `PORT=3001` 为其他数字（如 3002），同时改 `vite.config.ts` 中的 proxy 目标
- **防火墙拦截** → Windows Defender 防火墙 → 允许 3000 和 3001 端口

### Q: 登录时提示"用户名或密码错误"

- 确认是否执行过 `npm run seed`
- 重新执行一次：`cd /d D:\YT-mes\server` → `npm run seed`

### Q: 登录后所有接口都返回 401

- 确认后端 `.env` 中的 `JWT_SECRET` 是否被修改过
- 重启后端程序（改了 .env 后需要重启才能生效）

### Q: `npm install` 卡住不动

- 按 `Ctrl + C` 取消，重新执行一次
- 或设置国内镜像源：`npm config set registry https://registry.npmmirror.com`

### Q: `npx nest build` 报错

- 可能是 TypeScript 版本问题，尝试：`npm install` 重新安装依赖
- 检查 Node.js 版本是否 >= 20.x：`node -v`

---

# 附录：常用命令速查表

| 操作 | 命令 |
|------|------|
| 进入后端目录 | `cd /d D:\YT-mes\server` |
| 进入前端目录 | `cd /d D:\YT-mes\web` |
| 安装依赖 | `npm install` |
| 构建后端 | `npx nest build` |
| 构建前端 | `npm run build` |
| 启动后端 | `npm run start:prod` |
| 启动前端（开发） | `npm run dev` |
| 启动前端（生产预览） | `npm run preview` |
| 初始化数据 | `npm run seed` |
| 查看 Node.js 版本 | `node -v` |
| 查看 npm 版本 | `npm -v` |
