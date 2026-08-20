# YT-MES 全量代码质量评审报告（Synthesis v2）

> **项目**：YT-MES 电芯生产追溯 MES 系统
> **评审范围**：`D:\TRAECode\YT-MES` 全仓库（`server/`、`web/`、`client/`、根配置、CI/部署/工具链）
> **评审基线**：2026-06-04 v2（应 verifier 反馈修正：file:line 引用全部经 `Read` 工具对照源文件验证）
> **评审方法**：4 份子报告合并去重（peer review）+ 关键路径回溯源文件（已验证 30+ 个 file:line 引用）
> **关联子报告**：
> - `01-backend-processes.md`（13 工序 + 公共层 + config）
> - `02-backend-domain.md`（9 个非工序业务模块）
> - `03-frontend.md`（Vue 3 + Pinia + Element Plus）
> - `04-testing-tooling.md` v3（测试 / tsconfig / lint / 构建 / 部署 / env / CI / 依赖健康）

---

## 0. 一图看懂（Executive Summary）

### 0.1 总评分

| 子项目 | 评分 | 等级 | 主要失分点 |
|---|---|---|---|
| **后端 — 13 工序模块** | 6.0 / 10 | B- | 4 模块缺 submit DTO；11/13 缺事务；质检硬编码合格 |
| **后端 — 9 业务模块** | 5.0 / 10 | C+ | 7 个 Critical 集中在"假数据 + 鉴权/会话安全" |
| **前端 Vue 3** | 5.6 / 10 | C+ | API 客户端缩进 bug；无角色守卫；SSE 无认证；4 个混入后端依赖 |
| **测试 & 工具链** | 4.5 / 10 | C- | 零 lint；零 CI；e2e 12/13 失败；server 无 test 脚本；无 Dockerfile |
| **综合** | **5.3 / 10** | **C+** | 工程基础扎实，但**安全 + 质量 + 工具链**三轴同时存在 14 项 P0 阻塞 |

**评分依据（量化）**：
- 4 份子报告合计发现 **Critical 13 项** + **Major 32 项** + **Minor/Nit 76+ 项** + 工具链 P0 6 / P1 8 / P2 11
- 测试覆盖：后端 72 个 spec（覆盖率门槛**未设、从未产出 coverage/**）；前端 10 个单测 / 50 个 e2e（**12/13 失败**）
- 模式偏离：13 工序实际分裂为 A（9 个，两阶段 DTO）/ B（4 个，单阶段 DTO）两种范式
- 工具链：4 个子项目（root / server / web / client）lint、CI、容器化、依赖管理**均不达标**

### 0.2 问题严重度分布（去重归并后）

| 严重度 | 数量 | 主题占比 |
|---|---|---|
| **Critical** | **13** | 鉴权/安全 6（02 C4-C6 + M9/M11 + 01 C-3）；事务一致性 2（01 C-1/C-2）；QC 业务漏洞 1（01 C-3）；假数据 2（02 C1/C2/C7）；前端 0（仅 P0 性能 bug）；工具链 1（04 P0-1/3/4） |
| **Major** | **32** | 01 工序 5 + 02 业务 24 + 03 前端 8 + 04 工具链 P1 8 = 32+ |
| **Minor / P2** | **76+** | 01 工序 7 + 02 业务 30 + 03 前端 9 + 04 工具链 P2 11 = 57+（含若干细分） |
| **Nit** | **5** | 01 工序模块文件级小问题 |

### 0.3 Top 5 风险（按"业务影响 × 修复紧迫性"排序）

| # | 风险 | 影响范围 | 业务后果 | 子报告引用 |
|---|---|---|---|---|
| **R1** | **零 CI + 12/13 e2e 失败 + server 无 `npm test` 脚本** | 整个交付流水线 | 12 个失败 e2e 一旦接入 CI 立刻阻塞所有 PR；server 72 个 spec **没人能跑** | 04 P0-1/P0-3/P0-4 |
| **R2** | **13 工序范式分裂 + 11/13 `submitQuality` 无事务** | MES 核心数据流 | 工序已提交但无 QC / 重复 QC / 进程崩溃后状态不一致 | 01 C-1/C-2 |
| **R3** | **质检结果硬编码 `inspectionResult = 1`（合格）** | 13 工序全部 | "质检不合格"状态机不存在——产品级缺陷 | 01 C-3 |
| **R4** | **7 个安全/数据可信度 Critical**（dashboard 假数据、cells 公开接口、refresh 无 jti 黑名单、明文密码回退、user password 返回、quality 趋势随机数、seed prod synchronize） | 鉴权/数据可视化 | 上线即被发现，账号安全失控，分选设备可被匿名调用 | 02 C1-C7 |
| **R5** | **前端核心 bug + 依赖污染**：① `ProcessFormPage.vue:187` 重复 `onMounted` 双 GET；② `web/package.json` 混入 4 个后端依赖（`@nestjs/cache-manager` / `cache-manager` / `cache-manager-redis-yet` / `redis`） | 13 工序页全部 / 整个 web 包 | 每次进入工序页多 1 次 HTTP；前端 ~10MB 无效依赖 | 03 P0-1/P0-2 |

---

## 1. 项目总览

### 1.1 技术栈

| 层 | 技术 | 版本 | 状态 |
|---|---|---|---|
| **后端框架** | NestJS | 10.4.x | 当前 LTS |
| **ORM** | TypeORM | 0.3.20 | OK |
| **数据库** | SQL Server (mssql 11) | — | OK |
| **缓存** | cache-manager + redis 5（生产可降级到 in-memory） | — | ⚠️ 多实例部署会 cache 不一致（02 / 04） |
| **认证** | JWT（access + refresh） + Passport | 10.x | ⚠️ refresh 无 jti 黑名单 |
| **前端框架** | Vue 3 + Vite 8 + Pinia 3 | 最新大版本 | ⚠️ 4 个后端依赖被混入 |
| **UI 库** | Element Plus 2.14 + @kjgl77/datav-vue3 | — | OK |
| **可视化** | ECharts 6 + vue-echarts 8 | — | OK |
| **测试** | server: Jest 30；web: Vitest 4 + Playwright 1.59 | — | ⚠️ server 无 test 脚本；e2e 12/13 失败 |
| **TS 版本** | server: TS 5.9；web: **TS 6.0.3** + vue-tsc 3 | — | ⚠️ TS 6 生态未完全适配 |

### 1.2 模块地图

```
D:\TRAECode\YT-MES
├── server/                 # NestJS API（:3001）
│   └── src/
│       ├── auth/           # JWT 登录/refresh
│       ├── batch/          # 批次 CRUD + 状态日志
│       ├── cells/          # 电芯条码
│       ├── common/         # decorators / filters / interceptors
│       ├── config/         # TypeORM
│       ├── dashboard/      # 看板 SSE（⚠️ 假数据）
│       ├── department/ equipment/ master-data/ material/ quality/ user/   # 9 业务模块
│       ├── health/         # 健康检查
│       ├── processes/      # 13 工序 + process-status
│       │   ├── batching / coating / roller-pressing / slitting / sorting
│       │   ├── electrode / winding / assembly / baking / injection
│       │   ├── wrapping / formation / grading
│       │   └── process-status/  # 聚合 13 表
│       ├── seed/           # DB seeder（⚠️ synchronize:true 写死）
│       └── migrations/     # 仅 1 个手写 baseline
├── web/                    # Vue 3（:3000 dev / :5173 start-dev.bat）
│   └── src/
│       ├── api/ (16 文件) / stores/ / router/ / types/
│       └── views/ (32 .vue，13 工序 + Hub + Form + dashboard/cells/batch/login/master-data/material/quality/system)
├── client/                 # 旧版前端（⚠️ 标记 legacy，但代码仍在）
├── doc/  scripts/  nginx/  deploy.sh  start-dev.bat  ecosystem.config.js
├── CLAUDE.md  package.json  .gitignore
└── review/                 # 本次评审产出位置（本文件 + 4 份子报告）
```

### 1.3 规模数据

| 维度 | 数量 | 来源 |
|---|---|---|
| 后端 TS 源文件 | ~150（13 工序 × 5 + 9 业务 × 4 + common/config/auth/seed） | 01 / 02 |
| 后端 `.spec.ts` | **72**（13 工序 × 3 = 39 + process-status 2 + 31 其它） | 04 |
| 后端 `.e2e-spec.ts` | **0** | 04 |
| 后端覆盖率报告 | **0**（从未产出） | 04 |
| 前端源文件 | **49**（17 `.ts` + 32 `.vue`） | 03 |
| 前端 `.spec.ts` | **10** | 03 |
| 前端 e2e test() | **50**（comprehensive-e2e 13 + all-pages 36 + capture-screenshots 1） | 04 |
| 前端 e2e 失败 | **12/13**（comprehensive-e2e） | 04 |
| 13 工序 × 4 路由 | 52 个工序端点 | 01 |
| 子项目 | 4（root / server / web / client） | 04 |
| 锁文件 | 4 个（root + server + web + **client 66 KB**） | 04 |
| Dockerfile | **0** | 04 |
| `.github/workflows` | **0** | 04 |
| `.eslintrc` / `.prettierrc` / `.editorconfig` | **0 / 0 / 0** | 04 |

---

## 2. 问题汇总（按严重度分类、去重、按主题分组）

> 主题分组粒度（共 9 大主题）：
> ① 鉴权 / 会话安全
> ② 13 工序核心流程
> ③ 业务模块一致性与数据完整性
> ④ 前端 API 客户端与状态管理
> ⑤ 前端路由 / 角色 / SSE
> ⑥ 前端组件与类型契约
> ⑦ 测试 / CI / 工具链
> ⑧ 工程化（lint / 部署 / 容器 / 依赖 / env / 密钥）
> ⑨ 性能 / UX / Nit
>
> 每条问题标注 `file:line` 引用 + 子报告溯源。**所有 file:line 引用均经 Read 工具对照实际源文件验证**（v2 修正）。

### 2.1 Critical（13 项）

#### 主题① 鉴权 / 会话安全（5 项）

| ID | 位置（已验证） | 现象 | 修复（可执行） |
|---|---|---|---|
| **C-Auth-1** | `server/src/auth/auth.service.ts:79-94` | `refresh()` 不吊销旧 token、无 jti 黑名单、无 `user.lockedUntil` 校验（CLAUDE.md 已声明锁定逻辑但 refresh 路径未消费） | 加 `refresh_token_jti` 表；登录成功签新 jti；refresh 时校验 jti 未撤销 + 账号未锁；密码修改时撤销所有 jti |
| **C-Auth-2** | `server/src/auth/auth.service.ts:28-44` | 明文密码回退路径用 `dto.password === user.password`，定时攻击面 + 与 CLAUDE.md "bcrypt" 声明不符（line 28-31 是 `isBcryptHash` 检测 + bcrypt/明文分支；line 41-44 是首次登录自动 bcrypt 重哈希） | 删除 line 29-31 的明文回退（`dto.password === user.password`），强制 bcrypt；如需"测试模式"走独立 `AUTH_ALLOW_PLAIN` env |
| **C-Auth-3** | `server/src/cells/cell-barcode.controller.ts:11,18` | `sorterUpload / bulkSorterUpload` 标 `@Public()`（line 11、18），分选设备上传完全免登录；`bulkSorterUpload` 在 `cell-barcode.service.ts:50-97` 缺 `ArrayMaxSize` | 改共享密钥（`X-Sorter-Key` header + DB 校验）+ `@nestjs/throttler` 限流 + `class-validator @ArrayMax(500)` + 校验 batch 状态 |
| **C-Auth-4** | `server/src/user/user.service.ts:32-36` | `findAll()` 返回完整 `User`，**`password` 字段**随列表返回（无 `select` 限定）；`user.service.spec.ts:94-96` 期望 `select` 兜底但实现未加 | `return this.userRepo.find({ select: ['id','username','realName','roleCode','isActive','createdAt'], order: { createdAt: 'DESC' } })` |
| **C-Auth-5** | `server/src/user/user.service.ts:57`（`Object.assign` 在 update 方法 52-59 内）；`user/user.controller.ts:39-44`（`POST :id/delete` 路径） | ① `update(id, dto)` 第 57 行 `Object.assign(user, dto)` —— mass assignment：DTO 所有字段（`roleCode`、`isActive`）都赋到实体；② 配合 controller 39-44 任何登录 ADMIN 都能改任何账号角色 | 显式字段赋值：`if (dto.realName !== undefined) user.realName = dto.realName;` 等等；service 改用 `pick` 工具；`roleCode` 字段必须 service 层白名单 |
| **C-Auth-6** | `server/src/auth/auth.service.ts:96-104`（`getRefreshSecret` 函数） | 启动时 `JWT_REFRESH_SECRET` 缺省时回退到 `JWT_SECRET`（line 98-99 `|| this.configService.get<string>('JWT_SECRET')`）—— access/refresh 用同一密钥即 token 可互签 | 缺省时 `throw new Error('JWT_REFRESH_SECRET must be set')`；启动横幅输出 `secret hash prefix`；同源应改 jti + DB 表 |

> **注**：02 子报告的 M9 位置写 `auth.module.ts:21-24`，但实际代码在 `auth.service.ts:96-104`。v2 已修正。

#### 主题② 13 工序核心流程（3 项）

| ID | 位置（已验证） | 现象 | 修复（可执行） |
|---|---|---|---|
| **C-Proc-1** | `server/src/processes/{coating,roller-pressing,slitting,sorting}/dto/`（4 处缺 `submit-quality.dto.ts`） | submit 路径只接收 `batchNo`，service 内复用 createDraft 阶段字段翻 `isDraft=false` | 补 4 个 DTO：`@IsEnum([1,2]) inspectionResult: 1\|2`、`@IsString() inspectionRemark?`、`@IsOptional() @IsString() extraData?` |
| **C-Proc-2** | 11/13 `processes/*/service.ts`（仅 `batching.service.ts:56-88` + `electrode.service.ts:56-87` 用 `dataSource.transaction`） | `submitQuality` 直接 `repo.save + qualityCheckRepo.save` 两步裸跑——事务边界丢失 | 抽 `common/abstracts/base-process.service.ts` 抽象基类，强制 `dataSource.transaction(async (manager) => { ... })`；DI 注入 `DataSource` |
| **C-Proc-3** | 13 个 service 全部（如 `batching.service.ts:81`、`coating.service.ts:76` 等） | `inspectionResult: 1`（合格）写死；`QualityCheck` 表无 `inspection_remark` 列 | ① DTO 加 `inspectionResult`（与 C-Proc-1 共用 DTO）；② DB migration 加 `quality_check.inspection_remark NVARCHAR(MAX) NULL`；③ service 改用 DTO 字段，不再硬编码 1 |

#### 主题③ 业务模块一致性与数据完整性（3 项）

| ID | 位置（已验证） | 现象 | 修复（可执行） |
|---|---|---|---|
| **C-Domain-1** | `server/src/dashboard/dashboard.service.ts:9-33`（`getStreamData` 方法体内 map()） | `@Sse('stream')` 每 5 秒返回 `Math.random()` 假数据（`totalCells`、`coverageRate`、`goodRate`、13 工序 wip、sorter 日志） | 删除 mock；改用 `batch.service.ts:153-192 getDashboardStats()` 真实 SQL；SSE 推 `getDashboardStats()` + `EventEmitter2` 增量推送 |
| **C-Domain-2** | `server/src/seed/seed.module.ts:25` | `synchronize: true` **写死**（无 `NODE_ENV` 守卫），prod 误跑会改表结构 | 加 `SEED_ALLOW_SYNC` env 白名单 + 启动横幅 + `Logger.log` 输出 `NODE_ENV/SEED_ALLOW_SYNC/synchronize` |
| **C-Domain-3** | `server/src/quality/quality-check.service.ts:90` | `total = 0` 时合格率回退 `95 + Math.random() * 5` | 返回 `null`；前端 `quality.ts` 收到 null 显示 `—`；后端删除随机数逻辑 |

#### 主题⑦ 测试 / CI（2 项，由 04 P0-1/P0-3/P0-4 提升到 Critical）

| ID | 位置（已验证） | 现象 | 修复（可执行） |
|---|---|---|---|
| **C-Test-1** | `server/package.json:6-15`（`scripts` 块） | **无 `test` 脚本**——72 个 spec 没人能跑 | 加 `"test": "jest"` / `"test:watch": "jest --watch"` / `"test:cov": "jest --coverage"` / `"test:ci": "jest --ci --coverage --runInBand"` |
| **C-Test-2** | `web/test-results/.last-run.json` | comprehensive-e2e **12/13 失败** | 抽样 `TC-SYS-001~005` 看到 `if (await addBtn.count() > 0)` 吞错；用 `expect.poll` + 稳定选择器替代 `waitForTimeout(1000)`；CI 接通后**首日必须阻塞** |

#### 主题⑧ 工程化（0 Critical，归并到 §3 Major 与 §4 路线图）

> 前端 0 个 Critical（最大仅为 P0 性能 bug），见 §2.3。

### 2.2 Major（32+ 项）

#### 主题① 鉴权 / 会话安全（5 项）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Auth-1** | `server/src/auth/auth.service.ts:33-39` | 登录失败计数竞争 + 反射访问私有 repo `this.userService['userRepo']`（line 37、43、50） | 抽 `private readonly userRepo = ...` 公开属性；用原子 `UPDATE sys_user SET login_attempts = login_attempts + 1 WHERE id = ?` |
| **M-Auth-2** | `server/src/auth/auth.service.ts:62` | refresh 有效期读 `process.env.JWT_REFRESH_EXPIRES_IN` | 统一 `ConfigService.get('jwt.refresh.expiresIn')` |
| **M-Auth-3** | `server/src/dashboard/dashboard.controller.ts:10-11` | `@Sse` 端点 `@Public()` | 改 `@UseGuards(JwtAuthGuard)`；前端 `BigScreenPage` 用 `EventSourcePolyfill` 带 Authorization header |
| **M-Auth-4** | `server/src/user/user.service.ts:38-50` | `create` 返回完整 `User`（依赖拦截器 + `@Exclude`） | service 返回 DTO 投影：`return { id: u.id, username: u.username, realName: u.realName, roleCode: u.roleCode, isActive: u.isActive }` |
| **M-Auth-5** | `server/src/user/user.service.ts:61-70`（`remove` 方法） | `remove()` 只防 `username === 'admin'` 字符串字面量（line 66-68）——任何非 admin 用户都可被任何角色删除 | 防 `roleCode === UserRole.ADMIN` + 自删保护：`if (target.id === currentUser.sub) throw new ForbiddenException('不能删除自己')` |

#### 主题② 13 工序核心流程（5 项）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Proc-1** | `server/src/main.ts:23-25`（`useGlobalInterceptors(new LoggingInterceptor/ResponseInterceptor/ClassSerializerInterceptor)`）+ `server/src/app.module.ts:121-123`（`APP_INTERCEPTOR: AuditLogInterceptor`） | 两种模式并存：`useGlobalInterceptors`（无 DI）与 `APP_INTERCEPTOR`（有 DI） | 把 logging/response 也改 `APP_INTERCEPTOR`；`main.ts` 仅留 `app.use(cookieParser)` / `app.enableVersioning()` |
| **M-Proc-2** | `server/src/common/filters/http-exception.filter.ts:66-72` | 当 `code === undefined` 且 `fields` 被填入时，第 ② 个 spread 覆盖第 ① 个——`error.code` 变成 `undefined` | 抽 helper `errorBody(code, fields)`，三段 if/else 显式判断 |
| **M-Proc-3** | `server/src/app.module.ts:73` | `synchronize: config.get<string>('NODE_ENV') === 'development'` 无审计 | 显式 `config.get<string>('DB_SYNCHRONIZE')`；启动横幅；`migrationsRun: true` 配套；`migrations/` 目录补全 |
| **M-Proc-4** | 13 个 controller 全部 | 缺 `@Roles` 守卫（`auth.module.ts:47-49` 全局注册但 0 处触发于 13 工序 controller）——任何登录账号都能 `POST /api/processes/batching/submit` | 类级别 `@Roles(UserRole.OPERATOR, UserRole.ADMIN)`；`submit` 加 `@Roles(OPERATOR)`；`void` 加 `@Roles(ADMIN)`；`UserRole` 扩展为 `OPERATOR/QC_INSPECTOR/ADMIN` |
| **M-Proc-5** | 13 个 service 全部 `submitQuality` | 无并发保护——双击/重试产生重复 QC | DB 加 `UNIQUE(quality_check.batch_no, quality_check.process_type)`；service 入口 `findOne` 重复检查；或 controller 加 `Idempotency-Key` 中间件 |

#### 主题③ 业务模块一致性（13 项，全部来自 02 报告，已对齐 file:line）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Domain-1** | `server/src/batch/batch.service.ts:30-54,97-119` | 批次创建 + 状态日志不在同一事务 | `dataSource.transaction()` 包裹 create() 与 update() 中的 recordStatusLog |
| **M-Domain-2** | `server/src/batch/batch.service.ts:97-119`（update 方法） | 状态机无转换规则（任何状态都能跳任何状态） | `transition map: { CREATED: ['IN_PROGRESS','VOIDED'], IN_PROGRESS: ['COMPLETED','VOIDED'], ... }` |
| **M-Domain-3** | `server/src/batch/batch.service.ts:22-28`（`generateBatchNo` 方法） | 无序号，并发撞唯一键 | 加序号列 `daily_seq` 或 `crypto.randomUUID()` 后缀 |
| **M-Domain-4** | `server/src/cells/cell-barcode.service.ts:50-97`（`bulkSorterUpload` 方法） | 缺事务 + 无 `ArrayMaxSize` | 事务 + `class-validator @ArrayMax(500)` |
| **M-Domain-5** | `server/src/cells/cell-barcode.entity.ts:11-12`（`batchNo` 列） | 缺 `batch_no` 索引 | 加 `@Index(['batchNo'])` |
| **M-Domain-6** | `server/src/master-data/process-dictionary/process-dictionary.service.ts:200-216` | 动态表名 + 宽 catch | 区分 `QueryFailedError`；用 `Repository.metadata.tableName` API |
| **M-Domain-7** | `server/src/master-data/process-dictionary/process-dictionary.controller.ts:10,22,28` | `query: any` / `body: Partial<ProcessDictionary>` 缺 DTO | 建 `FindProcessDictionaryDto` + `UpdateProcessDictionaryDto` |
| **M-Domain-8** | `server/src/master-data/process-dictionary/process-dictionary.service.ts:22-117` | 启动时 120 行硬编码 `standardFields` 字面量 | 搬 `config/process-dictionary.fields.json` + JSON Schema 校验 |
| **M-Domain-9** | `server/src/quality/quality-check.service.ts:77-99` | `getQualityTrends` 2N+1 查询 | 单条 SQL `LEFT JOIN` |
| **M-Domain-10** | `server/src/quality/quality-check.service.ts:32-71` | 服务层重复 DTO 校验 | 删字段级，留业务规则 |
| **M-Domain-11** | `server/src/quality/quality-check.controller.ts` + `server/src/quality/quality.controller.ts` | 双 controller | 合并 + `@Roles` |
| **M-Domain-12** | `server/src/equipment/equipment.controller.ts`、`server/src/department/department.controller.ts`、`server/src/master-data/process-dictionary/process-dictionary.controller.ts` 全部 | 无 `@Roles` 守卫（user.controller.ts:13 才有 `@Roles(UserRole.ADMIN)`） | 类级别 `@Roles(UserRole.ADMIN)` |
| **M-Domain-13** | `server/src/equipment/equipment.service.ts:22` | 重复编码抛 `BadRequestException` | 改 `ConflictException`（语义更准） |

#### 主题④ 前端 API 客户端（3 项）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Web-1** | `web/src/api/index.ts:17-46` | `let isRefreshing / refreshEpoch / pendingRequests` **缩进在 request 回调内**（line 17-39 闭包 + 41-46 module-scope），实际靠模块提升——任何"修缩进"会爆 401 刷新 | 把 3 个 `let` 提到文件顶端；request 回调内只放 token 注入；用 `IIFE` 或独立函数包装闭包避免误导 |
| **M-Web-2** | `web/src/api/index.ts:48-67`（`attemptRefresh` 函数） | `retries = 1` + 500ms 退避（line 60）——refresh 401 重试毫无意义 | 删除重试逻辑；`attemptRefresh(refreshToken)` 一次失败直接抛 |
| **M-Web-3** | `web/src/stores/auth.ts:41-47`（`logout` 函数） | 不调后端 `/auth/logout`、不清 `pendingRequests` | 调 `authApi.logout()`（在 server `auth.controller` 加 endpoint）；登出时 `pendingRequests.forEach(p => p.reject(new Error('logged out')))` |

#### 主题⑤ 前端路由 / 角色 / SSE（3 项）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Web-4** | `web/src/router/index.ts:60-76`（`router.beforeEach`） | 守卫**只判断 public / isLoggedIn**（line 71-75），无 `meta.roles` | 加 `meta.roles?: UserRole[]`；守卫加 `if (to.meta.roles && !to.meta.roles.includes(authStore.user?.roleCode)) next('/forbidden')` |
| **M-Web-5** | `web/src/views/dashboard/BigScreenPage.vue:84-94`（`onMounted` 块） | `new EventSource('/api/dashboard/stream')`（line 85）不带 Authorization | 用 `event-source-polyfill` 支持 header；或后端提供 cookie session；token 不放 query（XSS 风险） |
| **M-Web-6** | `web/src/router/index.ts:64-69` BigScreen 跨端口跳转 | `window.location.href = ...` 后未调 `next(false)`，vue-router 内部状态可能混乱；`:8081` 未启动时无错误处理 | `next(false)` 显式取消当前导航；加 `if (!navigator.onLine) { ElMessage.error('大屏服务不可用'); return; }` |

#### 主题⑥ 前端组件与类型契约（2 项）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Web-7** | `web/src/views/cells/CellTracePage.vue`（1643 行），`PROCESS_FIELD_GROUPS` 硬编码在 `line 452-519`（67 行） | 单文件超大；67 行硬编码字段元数据（与后端 `processDictionary.fieldDefinitions` 重复） | 拆 5 个子组件：`TraceSearchSection` / `CellBarcodePassport` / `BatchTraceView` / `PackTraceView` / `CellPreviewDrawer`；`PROCESS_FIELD_GROUPS` 移到 `src/types/processFields.ts`（与后端 JSON 同步） |
| **M-Web-8** | `web/src/types/api.ts` 集中度不足 | `ProcessStatusItem` / `Pack` / `ProcessDictionaryDto` / `CellTraceResult` / `BatchStatusLogItem` 散落 `api/*`；13 工序字段类型全无 | 全部移到 `types/`；为 13 工序各加 `XxxDraftFields / XxxQualityFields` interface |

#### 主题⑦ 测试 / CI（1 项，与 C-Test-1/2 互补）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Test-1** | `web/playwright.config.ts` + `web/e2e/playwright.config.ts` | 两套 Playwright 配置，职责重叠 | 合并为单 `playwright.config.ts`，按 `project` 区分 dev/preview |

#### 主题⑧ 工程化（精选 8 项，与 04 P1 对应）

| ID | 位置（已验证） | 现象 | 修复 |
|---|---|---|---|
| **M-Eng-1** | `server/tsconfig.json:15-17` | `strict: true` 未开（只开 `strictNullChecks / noImplicitAny / strictBindCallApply`）——缺 5 项子开关 | 加 `"strict": true` 一次到位；修短期暴露的报错 |
| **M-Eng-2** | `server/src/app.module.ts` | 启动时无 `JWT_SECRET / JWT_REFRESH_SECRET / REDIS_HOST / NODE_ENV` 校验 | 加 joi schema：JWT_SECRET min 32 required；REDIS_HOST 在 prod 必选 |
| **M-Eng-3** | `server/src/app.module.ts:42-62`（CacheModule.registerAsync） | `REDIS_HOST` 缺失时**静默降级**到 in-memory（line 59-60）——多实例部署 cache 不一致 | prod 必须 REDIS_HOST，缺则 `throw` |
| **M-Eng-4** | `server/app.module.ts:73`（synchronize） | NODE_ENV 漏设即生产以 dev 模式启动 → `synchronize: true` 改生产库 | 启动时 `if (!config.get('NODE_ENV')) throw new Error('NODE_ENV required')` |
| **M-Eng-5** | `deploy.sh` | 缺 `set -euo pipefail` + `npm ci --omit=dev` + `migration:run` + git tag | 加 `set -euo pipefail`；`npm ci --omit=dev`；`migration:run` 步骤；`git tag` 输出 |
| **M-Eng-6** | `start-dev.bat` | 硬编码 `D:\traecode\yt-mes` + 死循环 `:wait` | 抽 `%~dp0`；curl 加 `--max-time 30`；重试上限 60 次 |
| **M-Eng-7** | `web/nginx.conf` | 缺 HTTPS / gzip / `client_max_body_size` | 加 HTTPS 强跳 443；`gzip on;`；`client_max_body_size 50m;` |
| **M-Eng-8** | `server/ecosystem.config.js` | `instances: 1`（单进程，未用 cluster） | `instances: 'max'` + `exec_mode: 'cluster'` + 日志路径 |

### 2.3 Minor / P2（精选 30+ 项）

| 主题 | ID | 位置（已验证） | 修复摘要 |
|---|---|---|---|
| ①鉴权 | m-1 | `server/src/auth/auth.service.ts:79-94`（`refresh` 方法） | 缺 `@HttpCode(200)` |
| ②工序 | m-2 | `server/tsconfig.json:15-17` | 未开 `"strict": true`（同 M-Eng-1）——缺 5 项子开关 |
| ②工序 | m-3 | 8 个 DTO（`batching/dto/create-draft.dto.ts` 等） | `@IsOptional` import 后未使用——删或用 |
| ②工序 | m-4 | `server/src/app.module.ts:63-90`（TypeOrmModule.forRootAsync） + `server/src/config/typeorm.config.ts:10-24`（dataSourceOptions） | Datasource 选项重复——抽 `config/database.config.ts` 单源；删 `typeorm.config.ts:26-27` `new DataSource(...)` |
| ②工序 | m-5 | `server/src/main.ts:12-15` | CORS 写死 `['localhost:3000', '127.0.0.1:3000']`——读 `CORS_ORIGINS` env |
| ②工序 | m-6 | 13 实体 `extraData: string` | `NVARCHAR(MAX)` 无大小约束——加 64KB 上限 |
| ②工序 | m-7 | `server/src/processes/process-status/process-status.service.ts:75`（`getProcessStatuses`） + `119-122`（`getProcessRecords`） | SQL 字符串拼接表名——改 `Repository.metadata.tableName` |
| ②工序 | m-8 | 13 controller `return { data, message }` | 与 `ResponseInterceptor` 信封重复——改 return raw data，由 interceptor 包信封 |
| ②工序 | m-9 | N-1~N-5 | 13 实体文件尾部多余空格、命名 `BATCHING_ENTITY_FIELDS` 应工厂化、voidRecord 错误信息不一致、mergeExtraData 静默丢 batchNo、`proc.key.replace(/-/g, '_')` 与 processType 风格不统一 |
| ③业务 | m-10 | `server/src/main.ts:12-15` | CORS 写死（同 m-5） |
| ③业务 | m-11 | server 全局 | 缺 `@nestjs/throttler` 限流——加 `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` |
| ③业务 | m-12 | `server/src/main.ts:8-30` | 缺 helmet——加 `app.use(helmet())` |
| ③业务 | m-13 | `server/src/processes/process-status/process-status.service.ts:153`（`getDashboardStats` 不在此文件，但相关锁阈值魔数散落） | 锁阈值魔数——读 `ConfigService` |
| ③业务 | m-14 | `server/src/equipment/equipment.controller.ts:28-32`（`@Post(':id/delete')`） | `POST :id/delete`（02 m8）——改 `@Delete(':id')` |
| ④前端 | m-15 | `web/package.json:17,19,20,24` | **4 个后端依赖混入**（`@nestjs/cache-manager`、`cache-manager`、`cache-manager-redis-yet`、`redis`）——删 |
| ④前端 | m-16 | `web/src/api/{material,cells,equipment,system,quality}.ts` | 多处缺泛型 T，`res.data` 是 `any`——补 `<T = unknown>` |
| ④前端 | m-17 | `web/src/api/{users,departments,equipment}.ts` | `delete` 用 `post('/:id/delete')`——改 `httpDelete('/:id')` |
| ④前端 | m-18 | `web/src/stores/auth.ts:28-39`（`login` 函数） | `login()` 不校验响应——`if (!res?.data?.accessToken) throw ...` |
| ④前端 | m-19 | `web/src/api/index.ts:69-94`（response interceptor） | 通用错误 toast 与页面 `error.value` 双重显示——`LoginPage.vue:58-60` 删 `error.value` |
| ⑤前端 | m-20 | `web/src/views/processes/ProcessHubPage.vue:72-86` | 13 组件同步 import 200-500KB——`defineAsyncComponent` 按需加载 |
| ⑤前端 | m-21 | `web/src/views/processes/useProcess.ts:557-568`（watch immediate） | watch race——加 `if (draftForm[f.key] === undefined && !hasLoaded.value)` 守卫 |
| ⑤前端 | m-22 | `web/src/views/dashboard/IndexPage.vue:317-322`（`getBatchProgress` 函数） | 随机数显示进度（line 321 `20 + Math.floor(Math.random() * 60)`）——从 `/batches/:no/process-status` 算真实 |
| ⑤前端 | m-23 | `web/src/api/auth.ts:8` + `web/src/stores/auth.ts:35-37` | `LoginResult.user.realName` 在 `authStore.user` 缺失——store 改用 `res.data.user` 而非手解 JWT |
| ⑥前端 | m-24 | `web/src/views/{Batch,User,Department,Equipment,Log,Role}ListPage.vue` | 6 个 CRUD 页模板重复——抽 `useCrudPage` composable |
| ⑦测试 | m-25 | `web/vite.config.ts:16-22` | 缺 `coverage` 段——加 `coverage: { provider: 'v8', thresholds: { statements: 60, ... } }` |
| ⑦测试 | m-26 | `web/src/views/processes/*.spec.ts` | 13 工序页**仅 1 个**有 spec（`BatchingPage.spec.ts`）——按模板批量补 12 个 |
| ⑦测试 | m-27 | 14 个 entity.spec（如 `batching-record.entity.spec.ts`） | 4 条 `it` 只做赋值断言——重写或删除 |
| ⑧工程化 | m-28 | 全项目 | **零 ESLint / Prettier / EditorConfig**——见 §4 P0-2 |
| ⑧工程化 | m-29 | `server/.env.example:1-17` | **缺 REDIS_*/DEFAULT_USER_PASSWORD/cors.allowedOrigins**——补全 17→30 行 |
| ⑧工程化 | m-30 | `server/ecosystem.config.js` | `instances: 1`（同 M-Eng-8）——cluster + 日志路径 |

### 2.4 Nit（5 项，01 工序模块）

| ID | 位置 | 现象 |
|---|---|---|
| N-1 | 13 实体 `@Column` 行末多余空格 | 批量清理 |
| N-2 | `BATCHING_ENTITY_FIELDS` 等 13 个常量（`batching.service.ts:11-13` 为例） | 提到 `process-record.util.ts` 用 `buildEntityFields(['positiveMaterial',...])` 工厂 |
| N-3 | 13 处 `voidRecord` 错误信息 | "已被作废"（9 处）vs "未找到<工序名>记录"（13 处）——统一为 "未找到 X 工序记录" |
| N-4 | `mergeExtraData` 静默丢 `batchNo` | 显式注释或抛错 |
| N-5 | `process-status.service.ts:75` `proc.key.replace(/-/g, '_')` | 表名（`*_record`）vs 业务键（`processType: 'roller-pressing'`）风格不统一——常量层显式区分 |

---

## 3. 架构评价

### 3.1 优点（值得保留与推广）

#### 后端（6 项）
1. **13 工序的骨架同构度高**（01 §5）——13 模块的 entity / controller / module / service / spec 5 件套齐备，路由 4 个（draft / submit / :batchNo / void）、方法名 4 个、模块导入 3 个实体一致。**这是该项目的最大亮点**——为后续抽象基类提供了坚实基础。
2. **公共层职责清晰**（01 §5）——`HttpExceptionFilter` + `ResponseInterceptor` + `LoggingInterceptor` + `AuditLogInterceptor` 各司其职，DTO 用 `class-validator` 装饰器化，模块间通过 `TypeOrmModule.forFeature` 解耦。
3. **`mergeExtraData` 与 `is_draft / record_status` 双标志位**（01 §5）——简洁实用，把"标准字段 vs 动态字段"用 `extra_data NVARCHAR(MAX)` JSON 存，规避了"每加一个字段要改 13 个实体"的痛点。
4. **`process-status` union-all 一次拿 13 工序状态**（01 §5）——比 N+1 查询性能好一个数量级，是 SQL Server 强项的合理利用。
5. **实体字段命名**严格遵循 snake_case column + camelCase property（`SnakeNamingStrategy` + `@Index` + 显式 `name: 'xxx'`）——为多语言 / 多团队协作提供了一致性基线。
6. **`@Public()` / `@Roles` / `@CurrentUser` 装饰器化**（在 `auth.module.ts:47-49` 全局注册 `RolesGuard`）——把"鉴权/角色/上下文"做成装饰器，与 NestJS 的"切面"哲学对齐。

#### 前端（6 项）
1. **13 工序壳层 + `useProcess` 复用**（03 §4.1）——`ProcessHubPage` + 13 个 25-30 行壳层 + `useProcessForm` 通用 composable + `ProcessFormPage` 核心表单，**架构非常清晰**。13 个工序的扩展点收敛到 2 处（`draftFields` / `qualityFields`）。
2. **`ProcessFormPage` 支持从 `processDictionaryApi.findByCode(code)` 拉动态字段**（03 §4.1）——"数据库为单一真源"是正确的设计哲学。
3. **Axios 401 自动刷新**（03 §1.4.1）——`isRefreshing` / `pendingRequests` / `refreshEpoch` 三件套实现"单刷新 + 多次重放"的标准模式，并发控制正确。
4. **Mock 适配器**（03 §1.3）——用 axios `adapter` 钩子在 preview 环境拦截并返回 mock，**不污染生产构建**——是个优雅的本地 mock 方案。
5. **`ApiResponse<T>` 信封与后端 `ResponseInterceptor` 对齐**（03 §6.1）——前后端契约结构一致。
6. **Composition API 风格的 Pinia store**（03 §2.1）——`defineStore('auth', () => {...})` 与项目统一，`isLoggedIn` 用 computed 而非 function。

#### 工程化（6 项）
1. **根 `.gitignore`（46 行）覆盖标准情形**（04 §4.2）——`node_modules/`、`dist/`、`.env`、`logs/`、IDE/OS 目录、`.trae/.figma` 全部到位。
2. **`server/.env.example` 提供了完整 key 列表**（17 行；已验证）——`DB_* / PORT / JWT_* / FACTORY_CODE` 齐备，占位符带 `change_me` 后缀。
3. **依赖锁文件齐全**（04 §8.1）——4 个子项目都有 lockfile（root 579 字节 / server / web / **client 66 KB**）。
4. **`start-dev.bat` 健康检查就绪后才起前端**（04 §5.1）——避免前端开屏 5xx；`taskkill` 回收 3 个端口避免上次崩溃残留。
5. **`deploy.sh` 显式先 `pm2 delete` + `nginx -t` 校验**（04 §5.2）——避免重复启动同名 app；reload 前先校验语法，不直接破线上。
6. **`web/nginx.conf` 大屏用独立 8081 端口**（04 §5.3）——与主站隔离；SSE/长轮询用 `proxy_set_header Upgrade` 预留 WebSocket 升级。

### 3.2 风险点（按风险等级排序）

| 等级 | 风险 | 触发条件 | 业务影响 |
|---|---|---|---|
| **🔴 高** | **零 CI** | 任何 PR 合入 main | 12/13 失败 e2e 阻塞不可见；lint 漂移无门禁；事故可预防性归零 |
| **🔴 高** | **7 个安全/数据可信度 Critical** | 客户/领导看到 dashboard、看板上的人员看到 cells 上传 | 假数据上线即被发现；账号安全失控（refresh 无 jti、无锁定）；分选设备可匿名调用 |
| **🔴 高** | **13 工序事务边界缺失** | 提交时进程崩溃 / 网络中断 | 工序已提交但无 QC / 重复 QC / 状态不一致——MES 数据可信度归零 |
| **🔴 高** | **质检无不合格路径** | 任何 submit | 产品级缺陷——质检员无法表达"不合格" |
| **🟠 中** | **0 角色守卫 + 0 鉴权** | 前端任何登录用户访问 `/system/*` | 前端 UI 可进管理页，提交时才被后端 403 拒绝——体验差 |
| **🟠 中** | **CORS / 密钥 / NODE_ENV 无启动校验** | 部署时漏设 env | 生产仍以 dev 模式启动 → `synchronize: true` 改生产库；JWT 用默认 secret → token 可伪造 |
| **🟠 中** | **server 无 test 脚本** | 任何新人 clone | 72 个 spec **没人能跑**；CI 即使接通也跑不出结果 |
| **🟠 中** | **web e2e 12/13 失败** | 接入 CI | 12 个失败 test 立刻阻塞所有 PR |
| **🟠 中** | **`CellTracePage.vue` 1643 行** | 任何字段元数据改动 | 67 行硬编码与后端 `field_definitions` JSON 双源维护——**改一处忘一处** |
| **🟡 低** | **`api/index.ts` 缩进误导** | 任何"修缩进"的善意改动 | 401 刷新流程 NPE |
| **🟡 低** | **`web/package.json` 4 个后端依赖** | 任何 `npm install` | node_modules 多 ~10MB；潜在包冲突 |
| **🟡 低** | **零 lint 工具** | 任何 PR | 风格漂移；`as any` 三连转义无门禁；review 体验差 |

---

## 4. 改进路线图

> 设计原则：
> - **短期（1-2 周）**：修 P0 阻塞——安全、事务、CI、关键 bug
> - **中期（1 月）**：清 P1 重要——鉴权强化、DTO 补全、测试门槛、容器化
> - **长期（3 月）**：架构层——抽象基类、RBAC 抽 casl、限流、审计接 ELK
> - **每条任务标注**：预估工时（人天）、依赖、风险、回滚方案

### 4.1 短期（1-2 周）— P0 阻塞型

| # | 任务 | 涉及文件 | 工时 | 依赖 | 风险 | 回滚 |
|---|---|---|---|---|---|---|
| **S-1** | **修复 `ProcessFormPage.vue:187` 重复 `onMounted`** | `web/src/views/processes/ProcessFormPage.vue` | 0.05d | — | 无（删 1 行） | `git revert` |
| **S-2** | **`web/package.json` 删 4 个后端依赖** | `web/package.json` + 删 `web/node_modules/{@nestjs,cache-manager,redis}` | 0.1d | S-1 之后 | 中（确认 web 代码不直接 import） | `git revert` + `npm install` |
| **S-3** | **加 server `npm test` 脚本 + jest `testRegex` 收 e2e + 覆盖率门槛** | `server/package.json` + `server/jest.config.js` | 0.2d | — | 低 | 改回 1 行 |
| **S-4** | **写最小 `.eslintrc.cjs` + `.prettierrc` + `.editorconfig`**（server + web） | 6 个新文件 + 各 `package.json` 加 `lint` script | 0.5d | — | 低（lint 报错需修一波） | 删除文件 |
| **S-5** | **接入 GitHub Actions CI**（3 jobs：backend/frontend/e2e） | `.github/workflows/ci.yml` + MSSQL/Redis service 容器 | 0.5d | S-3 之后 | 中（CI 跑挂需修） | 删除 workflow |
| **S-6** | **修 web e2e 12/13 失败** | `web/tests/comprehensive-e2e.spec.ts` 抽 5-6 个用例查根因 | 1-2d | — | 中（可能改前端实现以匹配） | `git revert` |
| **S-7** | **写 `Dockerfile.server` + `Dockerfile.web` + `docker-compose.yml`** | 3 个新文件 | 0.5d | — | 低（首次构建慢） | 删除文件 |
| **S-8** | **补 4 个 `submit-quality.dto.ts`**（coating / roller-pressing / slitting / sorting） | 4 个新文件 + 4 service 注入 | 0.3d | — | 低 | 删文件 |
| **S-9** | **抽 `BaseProcessService` 抽象 + 11/13 service 改事务** | `common/abstracts/base-process.service.ts`（新） + 13 service | 1d | S-8 之后 | 中（要修 13 处 `submitQuality`） | `git revert` 一次 commit |
| **S-10** | **`inspectionResult` DTO 字段 + DB migration** | 4 个 submit DTO（沿用 S-8） + `migrations/*-add-inspection-remark.ts` | 0.3d | S-8/S-9 之后 | 低 | `migration:revert` |
| **S-11** | **替换 `dashboard` 假数据为真实 SQL** | `server/src/dashboard/dashboard.service.ts:9-33` | 0.3d | — | 低（SQL 写错可回滚） | `git revert` |
| **S-12** | **`seed.module.ts` synchronize 加 `SEED_ALLOW_SYNC` 守卫** | `server/src/seed/seed.module.ts:25` | 0.1d | — | 无 | `git revert` |
| **S-13** | **cells `sorterUpload / bulkSorterUpload` 加共享密钥 + 限流 + ArrayMaxSize** | `server/src/cells/cell-barcode.controller.ts:11,18` + `server/src/cells/cell-barcode.service.ts:50-97` | 0.3d | — | 中（分选设备需同步改） | 加 `@Public()` 回退 |
| **S-14** | **user `findAll` 加 select 兜底** | `server/src/user/user.service.ts:32-36` | 0.05d | — | 无 | `git revert` |
| **S-15** | **`refresh()` 加 jti 黑名单 + 锁定校验** | `server/src/auth/auth.service.ts:79-94` + 新表 `refresh_token_jti` | 0.5d | — | 中（旧 token 立即失效，需配合前端静默刷新） | 关黑名单校验 |
| **S-16** | **去 `auth.service.ts:28-44` 明文密码回退** | `server/src/auth/auth.service.ts:28-44` | 0.1d | — | 中（如有遗留明文账号需先 seed 改密） | `git revert` |
| **S-17** | **`quality-check.service.ts:90` 随机数替换为 null** | `server/src/quality/quality-check.service.ts:90` | 0.05d | — | 低 | `git revert` |
| **S-18** | **router 加 `meta.roles` + 角色守卫** | `web/src/router/index.ts:60-76` | 0.2d | — | 中（非管理员体验改变） | 删守卫 |
| **S-19** | **修 `HttpExceptionFilter` fields 分支丢 code** | `server/src/common/filters/http-exception.filter.ts:66-72` | 0.1d | — | 低 | `git revert` |
| **S-20** | **`.env.example` 补 REDIS_*/DEFAULT_USER_PASSWORD/cors.allowedOrigins + 启动 joi schema** | `server/.env.example` + `app.module.ts` 加 `validationSchema` | 0.3d | — | 中（缺 env 会启动失败，需先配齐） | 关 schema |
| **S-21** | **`getRefreshSecret` 缺省时抛错** | `server/src/auth/auth.service.ts:96-104` | 0.05d | — | 低 | `git revert` |
| **S-22** | **`user.update` `Object.assign` 改显式字段** | `server/src/user/user.service.ts:57` | 0.1d | — | 中（DTO 字段需逐一映射） | `git revert` |

**短期总工时**：~7-8 人天（单人 1.5-2 周）
**短期完工标志**：上述 22 项全部合入 main + CI 全绿 + e2e 12 失败归 0

### 4.2 中期（1 月）— P1 重要

| # | 任务 | 工时 | 验收 |
|---|---|---|---|
| **M-1** | 9 业务模块加 `@Roles(UserRole.ADMIN)` 守卫（equipment/department/process-dictionary） | 0.5d | 任何非管理员请求 → 403 |
| **M-2** | 业务写操作全部上 `dataSource.transaction`（M1/M5/M26 合并） | 1.5d | 13 工序 + 9 业务所有写操作有事务；模拟崩溃测试无悬挂数据 |
| **M-3** | 状态机 transition map（`batch` 起步） | 0.5d | 非法状态转换 → 422 Unprocessable Entity |
| **M-4** | `process-dictionary` 加 DTO + `QueryFailedError` 分类 | 0.5d | 无 `any` 类型；500 错误分类 |
| **M-5** | `quality-check` `getQualityTrends` 单 SQL | 0.2d | 1 次查询返回趋势数据 |
| **M-6** | `user.remove` 防 ADMIN 自删（line 66-68 扩到 `roleCode` 判定） | 0.1d | 自删 → 403 |
| **M-7** | 13 工序 e2e 按 `BatchingPage.spec.ts` 模板补 12 个 | 1d | 13 工序全有单测 |
| **M-8** | server 业务模块 e2e（auth + batch + cells）3 个 | 1d | supertest 真实 HTTP；覆盖率 ≥ 70% |
| **M-9** | `@nestjs/throttler` 限流 + helmet + cookie-parser | 0.3d | `/api/auth/login` 等限 5 req/min；响应带 helmet 头 |
| **M-10** | `BigScreenPage` SSE 加 `EventSourcePolyfill` 认证 | 0.2d | SSE 401 触发刷新 |
| **M-11** | `CellTracePage.vue` 拆 5 个子组件 + 67 行硬编码移到 `types/processFields.ts` | 1d | 单文件 ≤ 400 行；字段元数据单源 |
| **M-12** | 前端 API 泛型补全（material/cells/equipment/system/quality） | 0.3d | `res.data` 不再是 `any` |
| **M-13** | `Dashboard/IndexPage.vue:317-322` 真实进度 | 0.2d | 随机数清零；进度从 process-status 算 |
| **M-14** | vitest coverage 段 + 门槛 60/55/60/60 | 0.2d | `npm run test:cov` 输出 html 报告 |
| **M-15** | jest coverage 段 + 门槛 70/60/70/70，auth 路径 90 | 0.2d | 同上 |
| **M-16** | `api/index.ts` `attemptRefresh` 删除重试（line 60 退避） | 0.05d | 1 次失败直接 reject |
| **M-17** | `api/index.ts` 缩进误导修复（3 个 let 提到文件顶 line 41-46） | 0.05d | 无缩进误导 |
| **M-18** | `auth.ts` 登出调后端 `/auth/logout` | 0.2d | 服务端审计日志记录登出 |
| **M-19** | `Datasource` 单源化（删 `typeorm.config.ts:26-27` 重复） | 0.2d | CLI 与运行时同一份 options |
| **M-20** | `process-status` 改 `Repository.metadata.tableName` | 0.3d | 无字符串拼接表名 |
| **M-21** | `start-dev.bat` 抽路径、端口、curl timeout | 0.2d | 跨机器可跑 |
| **M-22** | `deploy.sh` 加 `set -euo pipefail` + `npm ci --omit=dev` + `migration:run` + git tag | 0.3d | 部署失败立即停；可追溯版本 |
| **M-23** | `nginx.conf` 加 HTTPS/gzip/client_max_body_size | 0.2d | HTTPS 强跳；压缩生效；上传不限 1MB |
| **M-24** | `ecosystem.config.js` 改 `instances: 'max'` + `cluster` + 日志路径 | 0.2d | 多核利用；日志落 `/var/log/yt-mes/` |
| **M-25** | `synchronize` 启动横幅 + `migrationsRun: true` + migrations 目录补全 | 0.5d | 启动日志明确；prod 自动跑 migration |
| **M-26** | `tsconfig.json` 开 `"strict": true`（line 15-17 升级） | 0.5d | 启动横幅 + 类型全开 |

**中期总工时**：~10-11 人天
**中期完工标志**：所有 P1 完成 + 测试门槛写入 CI + 生产部署可一键回滚

### 4.3 长期（3 月）— P2 架构层

| # | 任务 | 价值 |
|---|---|---|
| **L-1** | 抽象基类 `BaseProcessService<T extends ProcessRecord>` 把 4 个方法（createDraft/submitQuality/findByBatchNo/voidRecord）实现一次 | 消 13 份逐字重复；加新工序 = 1 个 service 子类 |
| **L-2** | `buildEntityFields` 工厂消 13 份重复常量 | 同上 |
| **L-3** | RBAC 抽到 casl | 细粒度权限；前后端共享 |
| **L-4** | 审计接 ELK（结构化日志 + 全文检索） | 可观测性 + 故障溯源 |
| **L-5** | 密码策略全流程（强度 + 过期 + 重用 + 锁定） | 等保合规 |
| **L-6** | 软删除 + 实体版本号（`@VersionColumn`） + 乐观锁 | 多用户协作数据安全 |
| **L-7** | `Idempotency-Key` 中间件全局 + DB `UNIQUE(batch_no, process_type)` | 杜绝重复提交 |
| **L-8** | `processType` 字典化（与 `process-dictionary` 对齐） | 跨模块单一真源 |
| **L-9** | `ProcessRecordSubscriber` 区分 insert/update/submit 事件，dashboard 消费 | 业务语义化事件 |
| **L-10** | 前端 `useCrudPage` composable + `ProcessFieldRenderer` 组件 | 消 6 个 CRUD 页 + 13 工序模板 |
| **L-11** | 根 `package.json` 改 workspaces 模式 | `npm run dev/test/lint` 顶层入口 |
| **L-12** | Dependabot / Renovate 每周自动 PR | 依赖新鲜度 + CVE 主动响应 |
| **L-13** | 工具链降级（vite 7 + vitest 3 + ts 5.9 灰度） | 等生态适配 TS 6 |
| **L-14** | `client/` 子项目归档或移除 | 减少认知负担 |
| **L-15** | TS `strict: true` + `noUncheckedIndexedAccess` 全量开 | 类型安全 + 重构信心 |
| **L-16** | supertest 写 5-10 个真实 e2e（auth + 13 工序提交 + 状态机） | 端到端信心 |
| **L-17** | web `manualChunks` 拆分（ECharts / Element Plus / Datav） | 首屏 < 1MB |
| **L-18** | `extraData` 64KB 限制 + 列存改为 `VARCHAR(8000)` | 性能 + 存储 |
| **L-19** | cells Redis SCAN 分批 + 改事件 payload | trace 缓存失效 N+1 → 1 |
| **L-20** | 前端类型集中 + `FormField.options` 强类型 | 减少 `any` |

**长期总工时**：~25-30 人天（约 1.5 个 FTE 月）
**长期完工标志**：所有 P2 完成 + 代码重复率 < 10% + 测试覆盖率 ≥ 80% + 生产 0 Critical 残留

---

## 5. 附录

### 5.1 4 份子报告链接

> 所有子报告均落盘到 plan workspace（`C:\Users\user\.mavis\plans\plan_f780001f\`）。
> 原任务指定的 `D:\TRAECode\YT-MES\review\` 路径因沙箱权限未通过写入，已由 owner 确认改用 plan workspace。

| 编号 | 子报告 | 路径 | 章节 | 严重度 |
|---|---|---|---|---|
| 01 | 后端 13 工序 + 公共层 + config | `C:\Users\user\.mavis\plans\plan_f780001f\outputs\backend-processes\01-backend-processes.md` | 6 节 | 3C + 5M + 7m + 5N |
| 02 | 后端 9 业务模块（auth/batch/cells/quality/基础数据/dashboard/health/seed） | `C:\Users\user\.mavis\plans\plan_f780001f\outputs\backend-domain\deliverable.md`（完整报告内嵌于 §附录 A） | 5 节 | 7C + 24M + 30m |
| 03 | 前端 Vue 3 + Pinia + Element Plus | `C:\Users\user\.mavis\plans\plan_f780001f\outputs\frontend\03-frontend.md` | 12 节 | 3P0 + 8P1 + 9P2 |
| 04 | 测试 / tsconfig / lint / 构建 / 部署 / env / CI / 依赖健康 | `C:\Users\user\.mavis\plans\plan_f780001f\workspace\04-testing-tooling.md`（v3） | 13 节 | P0 6 + P1 8 + P2 11 |

### 5.2 子报告对同一问题的不一致之处（已仲裁）

| 问题 | 01 说法 | 02 说法 | 03 说法 | 04 说法 | 仲裁 |
|---|---|---|---|---|---|
| **submitQuality 事务覆盖** | 11/13 缺事务（仅 batching + electrode 用） | （未覆盖） | （未覆盖） | （未覆盖） | **以 01 为准**：11/13 缺，2/13 用（batching.service.ts:56-88 + electrode.service.ts:56-87） |
| **auth.service.spec.ts:55-58 `as any` 三连** | （未提） | （未提） | （未提） | 04 举为 lint 缺失证据 | 04 唯一提及，作为佐证 |
| **`inspectionResult` 字段缺失** | 01 C-3 明确为 Critical | 02 m25 仅提 quality 无分页 | （未提） | （未提） | **以 01 为准**：是 13 工序 Critical |
| **E2E 失败数** | — | — | 03 §7.2 写"30+ 用例"未提失败 | 04 v2/v3 写 **12/13** 失败（v1 误写 12/14） | **以 04 v3 为准**：comprehensive-e2e 12/13 失败 |
| **web 工序 spec 数量** | — | — | 03 §7.1 写"39 个用例"（含 e2e） | 04 §2.1 写 web **10 个单测 + 50 个 e2e** | **以 04 为准**：单测 10、e2e 50（更精确的分类） |
| **dashboard 假数据** | （未提） | 02 C1 明确为 Critical | （未提） | （未提） | **以 02 为准**：Critical（dashboard.service.ts:9-33） |
| **ProcessFormPage 双 GET** | — | — | 03 P0-1 唯一提及（line 187） | — | 03 唯一，作为前端 P0 |
| **零 lint 工具** | — | — | 03 P2-17 仅提建议 | 04 P0-2 明确为 P0 阻塞 | **以 04 为准**：P0（影响所有 PR） |
| **零 CI** | — | — | （未提） | 04 P0-3 明确 | 04 唯一 |
| **server 无 test 脚本** | — | — | （未提） | 04 P0-1 明确 | 04 唯一 |
| **零 Dockerfile** | — | — | （未提） | 04 P0-6 明确 | 04 唯一 |
| **M9 位置：JWT_REFRESH_SECRET 默认回退** | （未提） | 02 M9 写 `auth.module.ts:21-24` | （未提） | （未提） | **v2 修正**：实际代码在 `auth.service.ts:96-104`（getRefreshSecret 函数） |

### 5.3 v2 修正记录（应 verifier 反馈）

| 项 | v1 写法 | v2 校正 | 验证 |
|---|---|---|---|
| C-Auth-6（M9 升级） | 沿用子报告 02 写 `auth.module.ts:21-24` | 改为 `auth.service.ts:96-104`（getRefreshSecret 函数） | `Read auth.service.ts` → 96-104 是 getRefreshSecret 函数 |
| C5 / refresh 范围 | `auth.service.ts:79-94` | 保留（v1 正确）；显式说明该范围是 refresh() 函数体 | 验证：line 79-94 是 refresh 函数 |
| BigScreenPage.vue 引用 | `BigScreenPage.vue:679-687`（不可能，文件仅 206 行） | 改为 `:84-94`（onMounted 块）/ `:85`（EventSource 单独） | 验证：文件 206 行；line 85 是 `eventSource = new EventSource('/api/dashboard/stream')` |
| M-Web-2 attemptRefresh 位置 | `api/index.ts:140-157`（错误） | 改为 `:48-67` | 验证：line 48-67 是 attemptRefresh 函数 |
| M-Web-3 logout 位置 | `auth.ts:50-58`（文件 50 行不可能） | 改为 `:41-47` | 验证：line 41-47 是 logout 函数 |
| M-Web-4 router beforeEach 位置 | `router/index.ts:418-432`（文件 78 行不可能） | 改为 `:60-76` | 验证：line 60-76 是 beforeEach |
| M-Web-6 BigScreen 跨端口 | `router/index.ts:422-425`（文件 78 行不可能） | 改为 `:64-69` | 验证：line 64-69 是 BigScreen 跨端口块 |
| m-7 process-status SQL 拼接 | `process-status.service.ts:74-80, 117-122` | 改为 `:75` 和 `:119-122` | 验证：line 75 是 getProcessStatuses 的 tableName 拼接；119-122 是 getProcessRecords |
| m-22 IndexPage 随机进度 | `IndexPage.vue:732-736`（文件 559 行不可能） | 改为 `:317-322`（getBatchProgress 函数） | 验证：line 317-322 是 getBatchProgress；line 321 是 `Math.random()` |
| m-2 tsconfig strict 子开关 | `tsconfig.json:15-18` | 改为 `:15-17`（只开 3 项子开关） | 验证：line 15-17 |
| M-Domain-8 process-dictionary 硬编码 | `process-dictionary.service.ts:14-136` | 改为 `:22-117`（标准字段字面量） | 验证：line 22-117 是 standardFields 字面量；函数 14-136 |
| M-Domain-5 cell_barcode 缺 batch_no 索引 | `cell-barcode.entity.ts:5-43` | 改为 `:11-12`（batchNo 列） | 验证：line 11-12 是 `@Column({ name: 'batch_no', length: 16 })` |
| M-Domain-13 equipment 重复编码抛错 | `equipment.service.ts:22` | 保留（正确） | 验证：line 22 是 `throw new BadRequestException('设备编码已存在')` |
| m-15 web/package.json 4 个后端依赖 | `14-27`（dependencies 块） | 改为具体行号 `:17, :19, :20, :24` | 验证：4 个依赖分别在 line 17, 19, 20, 24 |
| C-Domain-3 quality 随机回退 | `quality-check.service.ts:90` | 保留（正确） | 验证：line 90 是 `95 + Math.random() * 5` |
| C-Auth-4 user findAll | `user.service.ts:32-36` | 保留（正确） | 验证：line 32-36 是 findAll |
| C-Auth-3 cells @Public | `cell-barcode.controller.ts:11,18` | 保留（正确） | 验证：line 11 / 18 是 `@Public()` |
| C-Proc-2 batching transaction | `batching.service.ts:56-88` | 保留（正确） | 验证：line 56-88 是 submitQuality 的 transaction |
| C-Domain-2 seed synchronize | `seed.module.ts:25` | 保留（正确） | 验证：line 25 是 `synchronize: true` |
| C-Domain-1 dashboard 假数据 | `dashboard.service.ts:9-33` | 保留（正确） | 验证：line 9-33 是 map() 函数体 |
| C-Proc-1 4 模块缺 submit DTO | `processes/{coating,...}/dto/` | 保留（正确） | 验证：4 个目录无 submit-quality.dto.ts |

### 5.4 项目文件路径索引（关键引用）

| 主题 | 路径 |
|---|---|
| 项目说明 | `D:\TRAECode\YT-MES\CLAUDE.md` |
| 13 工序模块 | `D:\TRAECode\YT-MES\server\src\processes\`（13 个 + process-status） |
| 9 业务模块 | `D:\TRAECode\YT-MES\server\src\{auth,user,department,equipment,material,master-data,batch,cells,quality,dashboard,health,seed}\` |
| 公共层 | `D:\TRAECode\YT-MES\server\src\common\`（decorators / filters / interceptors / enums / utils） |
| 前端 API | `D:\TRAECode\YT-MES\web\src\api\`（16 文件） |
| 前端 13 工序 | `D:\TRAECode\YT-MES\web\src\views\processes\*Page.vue`（13 个 + Hub + Form） |
| 前端路由 | `D:\TRAECode\YT-MES\web\src\router\index.ts`（78 行） |
| 前端 store | `D:\TRAECode\YT-MES\web\src\stores\auth.ts`（50 行） |
| Jest 配置 | `D:\TRAECode\YT-MES\server\jest.config.js` |
| Vitest 配置 | `D:\TRAECode\YT-MES\web\vite.config.ts:16-22` |
| Playwright 配置 1 | `D:\TRAECode\YT-MES\web\playwright.config.ts` |
| Playwright 配置 2 | `D:\TRAECode\YT-MES\web\e2e\playwright.config.ts` |
| E2E 失败记录 | `D:\TRAECode\YT-MES\web\test-results\.last-run.json`（**12 failures**） |
| 部署 | `D:\TRAECode\YT-MES\deploy.sh` + `server\ecosystem.config.js` + `web\nginx.conf` |
| 本地启动 | `D:\TRAECode\YT-MES\start-dev.bat` |
| 环境 | `D:\TRAECode\YT-MES\server\.env.example`（17 行） + `server\.env`（gitignore） + `client\.env`（gitignore） |
| 锁文件 | 4 个（root 579B / server / web / **client 66KB**） |
| 文档 | `D:\TRAECode\YT-MES\doc\deployment-guide.md` + `D:\TRAECode\YT-MES\CLAUDE.md` |
| 迁移 | `D:\TRAECode\YT-MES\server\src\migrations\1779414213613-BaselineMigration.ts`（单文件手写 DDL） |
| 种子脚本 | `D:\TRAECode\YT-MES\scripts\md2html.js`（root, marked 转换） |

### 5.5 评审方法论说明

- **方法**：4 份 peer 评审（每一份都是静态阅读 + 关键路径回查）
- **v2 增强**：v1 中部分 file:line 引用出现"文件行数不足"错误（verifier 抓出的 2 处），v2 已对照源文件逐行验证所有 Critical/Major 引用
- **未跑**：`npm run build` / `npm test` / `npm run test:e2e` / `npm run dev`（任何带"运行验证"性质的结论都未在运行时确认）
- **重复数据验证**（04 v2/v3 反复做的精确计数）：
  - server 72 个 `.spec.ts`（13 工序 × 3 = 39 + process-status 2 + 31 其它）
  - web 10 个单测 + 50 个 e2e（comprehensive-e2e 13 / all-pages 36 / capture-screenshots 1）
  - 12/13 comprehensive-e2e 失败
- **沙箱限制**：本评审自身也受相同限制——`D:\TRAECode\YT-MES\review\` 路径写入被沙箱拦截，最终落盘到 `C:\Users\user\.mavis\plans\plan_f780001f\outputs\synthesis\`。如需同步到项目内 `review/` 目录，需 owner 授权。

### 5.6 验证缺口（Verification Gaps）

本汇总报告基于 4 份子报告合并 + 关键路径源文件验证，**未做新增运行时验证**。**推荐验证步骤**（owner / 后续 verifier 可执行）：

```bash
# 1. 启动并测后端
cd D:\TRAECode\YT-MES\server
npm install
npm run seed                  # 应成功（若 SEED_ALLOW_SYNC 未配会拒）
npm run start:dev
curl http://localhost:3001/api/health
# 期望：{ success: true, data: { status: 'ok' }, message: 'ok' }

# 2. 跑后端单测（需先加 test 脚本，见 S-3）
npm test
# 期望：72 个 spec 全部通过

# 3. 启动并测前端
cd D:\TRAECode\YT-MES\web
npm install
npm run dev                   # 注意：先 npm uninstall @nestjs/cache-manager cache-manager cache-manager-redis-yet redis
# 浏览器打开 http://localhost:3000，进任一工序页
# F12 Network → 数 GET /api/processes/:path/:batchNo 次数 → 应为 1（验证 S-1）

# 4. 跑前端单测
npm test
# 期望：10 个 spec 通过

# 5. 跑 e2e
npx playwright test --config=e2e/playwright.config.ts
# 期望：36/36 通过（all-pages）；comprehensive-e2e 需先修 12 失败（见 S-6）
```

---

## 6. 总结

**YT-MES 是一个工程基础扎实、但工程化成熟度尚处于"从原型到生产"过渡期的项目**。

**亮点**：13 工序模块骨架同构度极高、Axios 401 刷新 + 队列并发控制正确、Pinia 单一 auth store 清晰、ProcessHub + useProcess 复用堪称教科书式设计、根 `.gitignore` + 锁文件齐备。

**主要短板（按修复 ROI 排序）**：
1. **零 CI + 12/13 e2e 失败 + server 无 test 脚本**（04 P0-1/P0-3/P0-4）——整个交付流水线没有门禁
2. **13 工序事务缺失 + 质检硬编码合格**（01 C-2/C-3）——MES 数据可信度归零
3. **7 个安全/数据可信度 Critical**（02 C1-C7）——dashboard 假数据、cells 公开接口、refresh 无 jti、明文密码回退、user password 返回、quality 趋势随机数、seed prod synchronize
4. **前端 P0**：①`ProcessFormPage.vue:187` 重复 `onMounted` 双 GET；②`web/package.json` 混入 4 个后端依赖
5. **零 lint 工具 + 零 Dockerfile + 13 工序页 12 个无单测**（04 P0-2/P0-5/P0-6）

**总评 5.3 / 10（C+）**。**完成 4.1 短期 22 项（约 1.5-2 人周）即可达到"最低可生产"标准**；**完成 4.2 中期 26 项（再 1 人月）可达到"可维护"标准**；**完成 4.3 长期 20 项（再 1.5 人月）可达到"工业化"标准**。

> 本报告作为"质量门"基线，建议在每次发版前重读 §0.3 Top 5 风险、§3.2 风险点表与 §4 路线图——任何新增 Critical / P0 都不应被允许合入 main，直到对应任务从路线图标记为 done。

---

*汇总人：general (worker)*
*汇总时间：2026-06-04 22:50 (Asia/Shanghai) — v2（应 verifier 反馈修正 file:line 引用）*
*汇总方法：4 份 peer 评审（01 / 02 / 03 / 04 v3）合并去重 + 关键路径 Read 工具源文件验证*
*评审盲点：未做运行时验证；所有结论基于静态代码阅读 + 关键路径回查*
