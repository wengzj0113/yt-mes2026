# Deliverable — backend-domain 评审任务

## Summary
完成了 `server/src` 下 9 个非工序业务模块（auth/user/department/equipment/material/process-dictionary/batch/cells/quality/dashboard/health/seed）的代码质量评审，产出 7 个 Critical、24 个 Major、30 个 Minor 问题清单，包含一致性矩阵与改进路线图。

## Changed files
- `D:\TRAECode\YT-MES\review\02-backend-domain.md`（**待用户授权写入**——见 Notes）

## Notes
1. **写入路径在 agent workspace 之外**：`D:\TRAECode\YT-MES\review\02-backend-domain.md` 不在 coder agent 的默认 workspace (`C:\Users\user\.mavis\agents\coder\workspace`) 内，Write 工具和 bash `Set-Content` 都被要求 user 授权（permission gate）。已触发一次系统通知，等待用户确认。

2. **完整评审内容**已附在本 deliverable 之后作为内嵌备份 —— 用户授权后可一键 copy 到目标路径；如用户希望直接看，参考下文 §"评审内嵌"。

3. **报告关键统计**：
   - 模块覆盖：12 个（auth/user/department/equipment/material/process-dictionary/batch/cells/quality/dashboard/health/seed）
   - Critical：7（C1-C7，集中于"假数据"和"鉴权/会话安全"）
   - Major：24（M1-M24，事务/状态机/RBAC/索引）
   - Minor：30（m1-m30，REST 风格/DTO 完整性/锁阈值魔数等）
   - 一致性矩阵：12 模块 × 8 关键属性
   - 优先级路线图：1 周 / 2 周 / 1 月 / 长期 四档

4. **未做的验证**（如后续 verifier 需要）：
   - 未运行 `npm run build`（无权写 / 无 npm 执行）；但所有问题均经 `Read` 工具直接看 `file:line` 定位，可由 verifier 抽样核对
   - 关键交叉引用（如 `user.service.spec.ts:94-96` 期望 `select` 但 `user.service.ts:33` 缺失）已用 `grep` + 多次 `read` 双向验证

5. **未涉及**（已在文档中明确划界）：
   - `processes/` 13 工序模块（01 评审范围）
   - `common/`、`config/`、`migrations/` 公共层（01 评审范围）
   - `packs/` 模块（不在本轮 prompt 列举的范围内，仅用作"事务模式"的对照参考）

---

## 评审内嵌（备份，待用户授权后复制到 `D:\TRAECode\YT-MES\review\02-backend-domain.md`）

完整 Markdown 内容见附录 A（约 13 KB）。如需立即查看：使用 `cat` 或文本编辑器打开以下临时文件（如本会话已能写入）：

```bash
# 写入目标（需 user 授权）
D:\TRAECode\YT-MES\review\02-backend-domain.md
```

---

## 附录 A：完整评审内容

> 标题：02 — 后端非工序业务模块评审（auth / batch / cells / quality / 基础数据 / dashboard / health / seed）
> 项目：YT-MES · NestJS 10 + TypeORM 0.3 + SQL Server
> 范围：server/src 下除 processes/、common/ 外的全部业务模块
> 评审日期：2026-06-04
> 关联：01-backend-processes.md（13 工序模块评审），00-final-report.md（汇总）

### 1. 项目结构概览

| 模块 | 路由前缀 | 角色 | 关键实体 |
| --- | --- | --- | --- |
| auth | /api/auth | 登录/refresh | sys_user（复用） |
| user | /api/users | 用户 CRUD | sys_user |
| department | /api/departments | 部门 CRUD | sys_department |
| equipment | /api/equipment | 设备 CRUD | sys_equipment |
| material | /api/batches/:batchNo/materials | 物料出入库 | material_warehouse |
| master-data/process-dictionary | /api/process-dictionary | 工序字典 | process_dictionary |
| batch | /api/batches | 批次 CRUD + 状态日志 | batch、batch_status_log |
| cells | /api/cells | 电芯条码 + 追溯 | cell_barcode |
| quality | /api/batches/:batchNo/quality-checks、/api/quality/trends | 质检记录 | quality_check |
| dashboard | /api/dashboard/stream | 看板 SSE | （无实体，纯 mock） |
| health | /api/health | 健康检查 | （无） |
| seed | （独立进程） | 初始数据 | 全部 |

**与 01 的关系**：13 工序模块的 service 都使用 `dataSource.transaction()` 包裹写操作；本轮覆盖的 9 个业务模块**没有一个**使用事务（除 pack.service.ts:21 用 queryRunner）。

**全局一致问题**（贯穿所有模块）：
- 全局无 `@nestjs/throttler` 限流；server/package.json 无该依赖
- 全局未挂 helmet、cookie-parser、csurf
- CORS 在 main.ts:12-15 硬编码 ['http://localhost:3000', 'http://127.0.0.1:3000']
- 全局 ClassSerializerInterceptor（main.ts:25）使 @Exclude() 生效，但仅依赖这一个机制做敏感字段过滤
- 审计日志拦截器在 POST/PUT/PATCH/DELETE 且 request.user 存在时记录，未审计失败请求

### 2. 模块一致性矩阵（12 模块 × 8 关键属性）

| 模块 | 路由规范 | DTO 校验 | Roles 守卫 | 事务 | 分页 | 软删除 | 字段过滤 | 跨表索引 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| auth | ✅ RESTful | ✅ | n/a | n/a | n/a | n/a | ⚠️ 仍含明文回退 | n/a |
| user | ❌ 用 POST 改删 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ findAll 不过滤 | ✅ username unique |
| department | ❌ 用 POST 改删 | ✅ | ❌ 无守卫 | ❌ | ❌ | ❌ | n/a | ✅ code unique |
| equipment | ❌ 用 POST 改删 | ✅ | ❌ 无守卫 | ❌ | ❌ | ❌ | n/a | ✅ equipmentCode unique |
| material | ⚠️ 嵌套资源 OK | ✅ | ❌ 无守卫 | ❌ | ❌ | ❌ | n/a | ❌ 缺复合索引 |
| process-dictionary | ✅ RESTful | ⚠️ 控制器用 any | ❌ | ❌ | ✅ | ❌ | n/a | ✅ processCode unique |
| batch | ✅ RESTful | ✅ | ❌ 无守卫 | ❌ | ✅ | ❌ | n/a | ❌ 软状态 |
| cells | ✅ RESTful | ✅ | n/a（公开） | ❌ | ✅ | ❌ | n/a | ⚠️ barcode unique，但 batch_no 缺索引 |
| quality | ⚠️ 双 controller | ⚠️ 服务层重复 | ❌ | ❌ | ❌ | ❌ | n/a | ❌ 缺 (batch_no, created_at) |
| dashboard | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a（纯 mock） |
| health | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| seed | n/a | n/a | n/a | ❌ | n/a | n/a | n/a | n/a |

### 3.1 Critical（7 项）

**C1. dashboard.service.ts 整段是 mock 假数据**（server/src/dashboard/dashboard.service.ts:9-33）
- 现象：`@Sse('stream')` 每 5 秒返回 Math.random() 假 totalCells/coverageRate/goodRate/13 工序 wip/假 sorter 日志
- 影响：客户/领导看到的是随机数；调试时无法判断真伪
- 修复：删除 mock，迁到 batch.service.ts:153 getDashboardStats() 的真实 SQL

**C2. seed.module.ts 硬编码 synchronize: true，prod 误跑会改表结构**（server/src/seed/seed.module.ts:25）
- 现象：synchronize 永远 true，没有 NODE_ENV 守卫
- 对比：app.module.ts:73 用了 NODE_ENV === 'development'
- 修复：加 SEED_ALLOW_SYNC 环境变量白名单

**C3. cells sorterUpload/bulkSorterUpload 是 @Public()，无鉴权**（cells/cell-barcode.controller.ts:11,18）
- 现象：分选设备上传接口完全无需登录；bulkSorterUpload 无 ArrayMaxSize
- 修复：改设备共享密钥（X-Sorter-Key）+ 速率限制 + batch 状态校验

**C4. user.service.ts findAll 不限制返回字段，password 一同返回**（user.service.ts:32-36）
- 现象：实际 `return this.userRepo.find({ order: { createdAt: 'DESC' } })`
- 验证：user.service.spec.ts:94-96 期望 `select: ['id', 'username', 'realName', 'roleCode', 'isActive']`，**测试会失败**
- 修复：加 select 兜底

**C5. refresh() 不吊销旧 refresh token，无黑名单机制**（auth.service.ts:79-94）
- 现象：refresh 只校验签名 + user.isActive，没有 user.lockedUntil 校验；旧 token 不会失效
- 影响：用户登出后 token 仍然有效；密码修改后旧 refresh 仍可刷到新 access；refresh token 泄露后无法撤销；被锁定的账号仍能用 refresh 续 access
- 修复：加 jti + DB 表 refresh_token_jti

**C6. auth.service.ts:30-31 明文密码回退路径用 === 比较**（auth.service.ts:28-44）
- 现象：`dto.password === user.password` 是字符串等值比较，存在定时攻击面
- 修复：去掉明文回退，强制 bcrypt

**C7. quality/quality-check.service.ts:90 合格率回退到 Math.random()**（quality/quality-check.service.ts:90）
- 现象：total = 0 时返回 95 + Math.random() * 5
- 修复：返回 null 让前端显示 "—"

### 3.2 Major（24 项）

| ID | 位置 | 现象 | 修复 |
| --- | --- | --- | --- |
| M1 | batch.service.ts:30-54,97-119 | 批次创建 + 状态日志不在同一事务 | dataSource.transaction() 包裹 |
| M2 | batch.service.ts:39-43,111 | 状态机无转换规则 | transition map |
| M3 | batch.service.ts:22-28 | generateBatchNo() 没有序号，并发撞唯一键 | 加序号或 UUID |
| M4 | process-dictionary.service.ts:200-216 | 动态表名 + 宽 catch | 区分 QueryFailedError，TypeORM metadata API |
| M5 | cell-barcode.service.ts:50-97 | bulkSorterUpload 缺事务 + 无 ArrayMaxSize | 事务 + 上限 500 |
| M6 | cell-barcode.entity.ts:5-43 | cell_barcode 缺 batch_no 索引 | 加 @Index |
| M7 | auth.service.ts:33-39 | 登录失败计数竞争 + 反射访问私有 repo | 公开方法 + 原子 UPDATE |
| M8 | auth.service.ts:62 | refresh 有效期直接读 process.env | 统一 ConfigService |
| M9 | auth.module.ts:21-24 | JWT_REFRESH_SECRET 缺省时回退到 JWT_SECRET | 改抛错 |
| M10 | user.service.ts:38-50 | create/update 返回完整 User，依赖拦截器 | service 返回 DTO 投影 |
| M11 | user.service.ts:52-59 | Object.assign(user, dto) mass assignment | 显式字段赋值 |
| M12 | user.service.ts:61-70 | remove() 只防 admin 字符串 | 防 roleCode === ADMIN + 自删保护 |
| M13 | equipment/department/process-dictionary 全控制器 | 无 @Roles 守卫 | 加 @Roles(UserRole.ADMIN) |
| M14 | equipment.service.ts:33-35 | Object.assign 同样 mass assignment | 显式赋值 |
| M15 | equipment.service.ts:22 | 重复编码抛 BadRequestException | 改 ConflictException |
| M16 | department.service.ts:27,36 | 抛 Error 而非 NotFoundException | 改 NotFoundException |
| M17 | process-dictionary.controller.ts | query:any / body: Partial 缺 DTO | 建 DTO |
| M18 | process-dictionary.service.ts:14-136 | 启动时 120 行硬编码标准字段 | 搬配置文件 + JSON Schema |
| M19 | quality-check.service.ts:77-99 | getQualityTrends 2N+1 查询 | 单条 SQL left join |
| M20 | quality-check.service.ts:32-71 | 服务层重复 DTO 校验 | 删字段级、留业务规则 |
| M21 | quality.controller.ts | 与 quality-check.controller.ts 双 controller | 合并 + @Roles |
| M22 | cell-barcode.service.ts:99-153 | trace 缓存失效拉全 batch cell | Redis SCAN 分批 + 改事件 payload |
| M23 | cell-barcode.entity.ts:38-42 | importedAt 和 createdAt 重复 | 删 importedAt |
| M24 | dashboard.controller.ts:10 | @Sse 端点 @Public() | 改 @Roles（看板上的人可看） |

### 3.3 Minor（30 项摘要）

m1 main.ts CORS 写死 / m2 缺 @nestjs/throttler / m3 缺 helmet / m4 锁阈值写死 / m5 process-dictionary query 弱类型 / m6 material 缺分页 / m7 material type NaN / m8-m10 POST 改删 / m11-m12 health 无 DB 探活 / m13 batch 硬删除 / m14 user.findAll 无分页 / m15 @Exclude 缺 toPlainOnly / m16 generateNo 无认证 / m17 plannedQty 无上界 / m18 sorter 数字无 @Min(0) / m19 material 缺 FK / m20 process-status 工序码两套真理 / m21 锁阈值不读 config / m22 fieldDefinitions 无 schema / m23 审计缺 GET / m24 审计跳过 auth / m25 quality.findAll 无分页 / m26 material create 不在事务 / m27 refresh 无 @HttpCode / m28 字段可空无默认 / m29 全局 @Body() any / m30 锁定时间魔数

### 4. 改进建议（按优先级）

**1 周内（Critical）**：
1. 替换 dashboard mock（C1）
2. seed prod guard（C2）
3. cells 接口加认证（C3）
4. user findAll select 兜底（C4）
5. refresh 校验 + jti 黑名单（C5）
6. quality 假数据替换（C7）

**2 周内（Major）**：业务写操作全部上事务（M1/M5/M26）；状态机 transition map（M2）；分模块加 @Roles（M13）；质量趋势单 SQL（M19）；user.update 显式赋值（M11）；user.remove 防 ADMIN 自删（M12）；process-dictionary 加 DTO（M17）

**1 个月内**：限流 + helmet + health terminus + cells 索引 + 软删除 + 统一 DTO

**长期**：RBAC 抽到 casl、审计接 ELK、密码策略全流程

### 5. 总结

本轮 9 个业务模块整体"够用"但有 7 个 Critical 集中在**安全 + 假数据**：dashboard（C1）和 quality trends（C7）假数据上线即被发现；seed prod guard 缺失（C2）一次手误就出事；cells 公开接口（C3）暴露外部攻击面；user password 返回 + auth 反模式（C4-C6）用户密码泄漏 / 会话失控；业务模块完全无事务，状态机无规则（M1/M2）数据一致性 + 业务规则都可被绕过。

Major 集中在**控制器风格不统一**（POST 改删）、**质量 / Roles 缺失**、**N+1 / 索引**。

整体评价：业务模块和 01 评审的 13 工序模块（事务齐、DTO 全）相比，规范度低 1-2 个档次，属于"先把功能堆出来"阶段。建议在把更多精力投到工序前先把 Critical 修掉。

### 附录：已读文件清单

auth/{service, controller, module, jwt.strategy, jwt-auth.guard, roles.guard, dto/login, service.spec}.ts
user/{entity, service, controller, module, dto/*, service.spec}.ts
department/{entity, service, controller, module, dto/*}.ts
equipment/{entity, service, controller, module, dto/*}.ts
material/{material-warehouse.entity, service, controller, module, dto/create}.ts
master-data/process-dictionary/{entity, service, controller, module}.ts
batch/{entity, service, controller, module, batch-status-log.entity, dto/*}.ts
cells/{cell-barcode.entity, service, controller, module, dto/*, service.spec}.ts
quality/{quality-check.entity, service, controllers/*, module, dto/create}.ts
dashboard/{service, controller, module}.ts
health/{controller, module}.ts
seed/{module, service, run-seed, seed-data.sql (前 50 行)}.ts
common/decorators/{public, roles, current-user}.decorator.ts
common/filters/http-exception.filter.ts
common/interceptors/{response, audit-log}.interceptor.ts
processes/process-status/{service, subscriber}.ts（对照）
system/{service, controller, entities/log, entities/config}.ts
packs/pack.service.ts（事务对照）
app.module.ts, main.ts, CLAUDE.md
server/package.json

---

（以上为完整评审内容的内嵌备份；如需复制到 D:\TRAECode\YT-MES\review\02-backend-domain.md，请先确认 user 授权。）
