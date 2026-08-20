# YT-MES 修复计划与方案

> 基于 review/ 目录下 5 份评审报告，按优先级和安全性分级修复。
> 基线：2026-06-03

---

## 执行批次

### 📦 第 1 批：低风险高优（安全，可直接修复）

> 共 **11 项**，预估 **0.5 人天**

| # | 问题 | 文件 | 方案 | 风险 |
|---|------|------|------|------|
| F-01 | **ProcessFormPage 重复 onMounted** | `web/.../ProcessFormPage.vue:187` | 删除第 187 行 `onMounted(() => loadRecord(batchNo.value))` | 无风险（loadRecord 已在上方 onMounted 调用） |
| F-02 | **清理前端 4 个后端依赖** | `web/package.json:17,19,20,24` | 删除 `@nestjs/cache-manager`、`cache-manager`、`cache-manager-redis-yet`、`redis` | 中风险（需确认前端代码无直接 import 这些包；删除后运行一次 `npm install` 验证） |
| F-03 | **user.findAll 加 select 兜底** | `server/.../user.service.ts:32-36` | `find()` 加 `select: ['id','username','realName','roleCode','isActive','createdAt']` | 低风险（只减少返回字段，不会破坏功能） |
| F-04 | **quality 合格率随机数 → null** | `server/.../quality-check.service.ts:90` | `95 + Math.random() * 5` → `null` | 低风险（前端需处理 null 显示 `—`，但不会崩） |
| F-05 | **seed synchronize 守卫** | `server/.../seed.module.ts:25` | `synchronize: process.env.SEED_ALLOW_SYNC === 'true'` | 低风险（默认 false 更安全） |
| F-06 | **JWT_REFRESH_SECRET 缺省抛错** | `server/.../auth.service.ts:96-104` | 删 `\|\| ...JWT_SECRET`，缺省直接 `throw` | 低风险（部署时需确保 .env 配了此变量） |
| F-07 | **api/index.ts 缩进修复** | `web/.../api/index.ts:17-46` | 3 个 `let` 提到文件顶端（line 7 附近） | 低风险（功能不变，只提位置） |
| F-08 | **attemptRefresh 删重试** | `web/.../api/index.ts:48-67` | 删 for 循环和 retries，直接 try/catch 一次 | 低风险（refresh 401 不可恢复，重试无意义） |
| F-09 | **HttpExceptionFilter code 修复** | `server/.../http-exception.filter.ts:66-72` | 抽 helper 三段 if/else 避免 spread 覆盖 | 低风险（行为变正确） |
| F-10 | **process-dictionary 调式注释** | `web/.../process-dictionary.ts:1` | 删除 `// Wait, let's check...` | 无风险 |
| F-11 | **quality-check 2N+1 → 单 SQL** | `server/.../quality-check.service.ts:77-99` | `Promise.all` + 2 次 `count` → 单条 `LEFT JOIN` query | 低风险（性能优化，不影响业务） |

**验证方法**：
```bash
# 验证 F-01
cd web && npm test
# 打开浏览器 Network 面板，进工序页确认 GET 请求 1 次

# 验证 F-02
npm install   # 应成功，无报错
npm run dev   # 应正常启动

# 验证 F-03 ~ F-11
cd server && npm run build  # 编译通过
# 或 git diff 确认改动正确
```

---

### 📦 第 2 批：中等风险（需规划部署）

> 共 **6 项**，预估 **1-2 人天**

| # | 问题 | 方案 | 风险及注意 |
|---|------|------|-----------|
| F-12 | **dashboard 假数据替换** | 删 `dashboard.service.ts:9-33` mock，调 `batch.service.ts:153 getDashboardStats()` 真实 SQL | **中**：SQL 需验证正确性；SSE 推 JSON 结构需与前端对齐 |
| F-13 | **路由加 meta.roles 守卫** | `router/index.ts` 加 `meta.roles?: number[]` + 守卫判断 | **低**：非管理员访问 `/system/*` 会被拦截，体验改变但后端已 403 |
| F-14 | **user Object.assign 改显式赋值** | `user.service.ts:57` 逐字段 `if (dto.field !== undefined) user.field = dto.field` | **中**：`roleCode` 需 service 层白名单；需检查所有调用方 |
| F-15 | **user.remove 防 ADMIN 自删** | 防 `roleCode === ADMIN` + `if (target.id === currentUser.sub)` | **低**：只是补充边界检查 |
| F-16 | **BigScreen SSE 加认证** | `EventSource` → `EventSourcePolyfill` + Authorization header | **中**：需加 npm 依赖 `event-source-polyfill` |
| F-17 | **登出调后端 + 清 pendingRequests** | `auth.ts:logout` 调 `authApi.logout()` + `pendingRequests.forEach(p => p.reject(...))` | **低**：后端需加 `/auth/logout` endpoint |

**验证方法**：
```bash
# 验证 F-12
curl http://localhost:3001/api/dashboard/stream  # 确认返回真实数据而非随机数

# 验证 F-13
# 用非管理员账号登录，尝试访问 /system/users，应被前端拦截

# 验证 F-15
# 用 admin 账号删除自己 → 应 403
```

---

### 📦 第 3 批：高业务影响（需充分测试）

> 共 **5 项**，预估 **3-5 人天**

| # | 问题 | 方案 | 风险及注意 |
|---|------|------|-----------|
| F-18 | **13 工序补 submit DTO + 事务** | 4 模块加 `submit-quality.dto.ts`；11 个 service `submitQuality` 改 `dataSource.transaction` | **高**：MES 核心流程，需逐个工序回归 |
| F-19 | **质检结果硬编码 → DTO 字段** | 13 处 `inspectionResult: 1` → 从 DTO 读；DB migration 加 `inspection_remark` 列 | **高**：需 DB 迁移；历史数据需处理 |
| F-20 | **refresh jti 黑名单** | 建 `refresh_token_jti` 表；refresh 时校验 jti 是否已撤销 | **中**：旧 token 部署后立即失效，需前端静默刷新配合 |
| F-21 | **cells 公开接口加共享密钥** | `@Public()` → `X-Sorter-Key` header + 限流 + `@ArrayMax(500)` | **中**：分选设备需同步更新 |
| F-22 | **明文密码回退删除** | 删 `auth.service.ts:29-31` 的 `dto.password === user.password` 分支 | **中**：需确保 DB 无遗留明文密码，或先跑一次 seed 脚本批量 bcrypt |

**前提条件**：
- 第 1 批全部修复完成并合入 main
- 有测试环境可跑完整流程
- 分选设备厂商（F-21）、运维（F-20）需协调

---

## 修复策略

### 每次修复的通用流程

```
1. git checkout -b fix/xxx     # 开分支
2. 修改代码                    # 按方案执行
3. npm run build               # 编译检查
4. npm test                    # 跑单测
5. 手动验证（如需要）          # 浏览器 / curl
6. git commit                  # 提交
```

### 批量策略

```
第 1 批（11 项）可 1 个 PR 全部提交：
  fix/round-1: 低风险修复合集
  ├─ F-01: 删除重复 onMounted
  ├─ F-02: 清理依赖
  ├─ F-03: user findAll select
  ├─ F-04: quality null
  ├─ F-05: seed guard
  ├─ F-06: JWT_REFRESH_SECRET throw
  ├─ F-07: 缩进修复
  ├─ F-08: 删重试
  ├─ F-09: HttpExceptionFilter
  ├─ F-10: 删注释
  └─ F-11: quality 单 SQL

第 2 批（6 项）分 2-3 个 PR
  第 2a 批（安全项）:
  fix/round-2a: 路由守卫 + 自删保护 + 登出完善
  第 2b 批（中风险）:
  fix/round-2b: dashboard 真实数据 + SSE 认证

第 3 批（5 项）每项独立 PR
  fix/round-3a: 13 工序事务 + DTO
  fix/round-3b: 质检不合格路径
  fix/round-3c: refresh jti
  fix/round-3d: cells 认证
  fix/round-3e: 删明文密码
```

---

## 各批次文件改动清单

### 第 1 批改动文件

```
web/src/views/processes/ProcessFormPage.vue        # F-01 删 1 行
web/package.json                                    # F-02 删 4 行
server/src/user/user.service.ts                    # F-03 加 select
server/src/quality/quality-check.service.ts        # F-04 改 1 行, F-11 重构
server/src/seed/seed.module.ts                     # F-05 加 SEED_ALLOW_SYNC
server/src/auth/auth.service.ts                    # F-06 改 1 行
web/src/api/index.ts                               # F-07 移 3 let, F-08 删重试
server/src/common/filters/http-exception.filter.ts # F-09 重构
web/src/api/process-dictionary.ts                  # F-10 删 1 行
```

### 第 2 批改动文件

```
server/src/dashboard/dashboard.service.ts          # F-12
server/src/dashboard/dashboard.controller.ts       # F-12
web/src/router/index.ts                            # F-13
server/src/user/user.service.ts                    # F-14, F-15
web/src/stores/auth.ts                             # F-17
web/src/views/dashboard/BigScreenPage.vue          # F-16
web/package.json                                   # F-16 加 event-source-polyfill
```

### 第 3 批改动文件

```
server/src/processes/coating/dto/submit-quality.dto.ts      # F-18 新建
server/src/processes/roller-pressing/dto/submit-quality.dto.ts  # F-18 新建
server/src/processes/slitting/dto/submit-quality.dto.ts      # F-18 新建
server/src/processes/sorting/dto/submit-quality.dto.ts       # F-18 新建
server/src/common/abstracts/base-process.service.ts          # F-18 新建
server/src/processes/*/service.ts (13 处)                    # F-18 改事务
server/src/migrations/xxx-add-inspection-remark.ts          # F-19 新建
server/src/processes/*/service.ts (13 处)                    # F-19 改 inspectionResult
server/src/auth/auth.service.ts                              # F-20, F-22
server/src/auth/entities/refresh-token-jti.entity.ts         # F-20 新建
server/src/cells/cell-barcode.controller.ts                  # F-21
server/src/cells/cell-barcode.service.ts                     # F-21
```

---

## 决策记录

| 批次 | 决策 | 理由 |
|------|------|------|
| 第 1 批 11 项合并 | 一次性提交 | 每一项改动极小（1-5 行），互不依赖，回滚成本低 |
| 第 2 批分拆 | 2-3 个 PR | F-12 涉及 SQL 正确性需验证；F-16 需加 npm 依赖 |
| 第 3 批独立 | 每项独立 PR | 高业务影响，需逐一 code review + 测试 |

---

*计划制定时间：2026-06-03*
*后续：请确认该计划，确认后开始执行第 1 批修复*
