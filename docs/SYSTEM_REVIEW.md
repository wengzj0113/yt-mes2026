# YT-MES 系统综合审查报告

> **审查日期**：2026-06-17
> **审查范围**：整体架构与模块划分、业务逻辑与功能完整性、性能/安全/可维护性
> **审查基线**：仓库 `d:\traecode\YT-mes` 当前代码（HEAD）
> **详细程度**：标准技术报告
> **审查方法**：静态代码逐行核对，文件含行号引用

---

## 一、项目概览

### 1.1 系统定位

YT-MES 是一套**电芯生产追溯制造执行系统**，跟踪电芯从配料到分选共 **13 道工序**的生产全流程，核心能力包括：批次管理、工序记录、质量检验、电芯条码追溯、分选机数据接入、物料/设备台账、Dashboard 与大屏展示。

### 1.2 技术栈

| 层 | 技术 | 版本 | 备注 |
|----|------|------|------|
| 后端 | NestJS | 10.4 | 模块化架构 |
| ORM | TypeORM | 0.3.20 | SnakeNamingStrategy |
| 数据库 | SQL Server | — | mssql driver 11.0 |
| 缓存 | Redis（可选）/ 内存 | — | cache-manager-redis-yet |
| 前端（主） | Vue 3.5 + Vite 8 | — | Composition API + `<script setup>` |
| 状态管理 | Pinia 3 | — | |
| UI | Element Plus 2.14 | — | |
| 图表 | ECharts 6 + vue-echarts 8 | — | 按需引入 |
| 大屏 | @kjgl77/datav-vue3 | — | |
| 测试 | Jest 30 / Vitest 4 / Playwright 1.59 | — | |
| 部署 | Nginx 1.26 + PM2 | — | Windows 优先 |

### 1.3 工程规模

- 后端模块：auth / user / department / equipment / batch / cells / quality / material / dashboard / system / packs / master-data + 13 个工序模块 + process-status 聚合
- 前端页面：batch / cells / dashboard（含大屏）/ processes（13）/ quality / system（7）/ material / packs / master-data / login
- 迁移文件：6 个（Baseline + 5 个增量）
- 既有评审产物：`review/00-final-report.md` + 4 个子报告 + `fix-plan.md`

### 1.4 13 道工序

| 序号 | 工序 | 英文标识 | 有质检 |
|------|------|----------|--------|
| 1 | 配料 | batching | ✅ |
| 2 | 涂布 | coating | ❌ |
| 3 | 辊压 | roller-pressing | ❌ |
| 4 | 分切 | slitting | ❌ |
| 5 | 制片 | electrode | ✅ |
| 6 | 卷绕 | winding | ✅ |
| 7 | 装配 | assembly | ✅ |
| 8 | 烘烤 | baking | ✅ |
| 9 | 注液 | injection | ✅ |
| 10 | 顶封 | wrapping | ✅ |
| 11 | 化成 | formation | ✅ |
| 12 | 分容 | grading | ✅ |
| 13 | 分选 | sorting | ❌ |

### 1.5 评分总览

| 维度 | 评分 | 说明 |
|------|------|------|
| 整体架构 | 6/10 | 模块化清晰但缺聚合层，13 工序高度重复 |
| 安全性 | 3/10 | 多处高危：明文密码兼容、JWT 默认密钥、RBAC 刷新失效 |
| 业务一致性 | 3/10 | 核心链路断链：submit-quality 不建 QC、批次状态机无校验 |
| 数据库设计 | 5/10 | synchronize 与 migration 共存、索引缺失、字符串拼 SQL |
| 性能 | 5/10 | 大屏假数据 + SSE 无缓存、同步导入破坏代码分割 |
| 前端质量 | 5/10 | 401 无限重试、localStorage 存 token、E2E 全面失效 |
| 测试 | 4/10 | 单测覆盖广但深度不足，E2E 选择器全部失配 |

---

## 二、整体架构与模块划分

### 2.1 后端架构

```
server/src/
├── app.module.ts          # 平铺 26+ 模块，无聚合层
├── main.ts                # 全局 pipe/filter/interceptor 注册
├── auth/                  # JWT 认证（存在多处安全问题，见 §五）
├── batch/                 # 批次核心域
├── cells/                 # 电芯条码 + 分选机上传
├── common/                # 共享：decorators / enums / filters / interceptors / utils
├── config/                # TypeORM 配置
├── dashboard/             # 大屏聚合
├── department/ equipment/ # 主数据
├── master-data/           # 工艺字典
├── material/              # 物料仓库
├── migrations/            # 6 个手写迁移
├── packs/                 # Pack 组装
├── processes/             # 13 工序 + process-status 聚合
├── quality/               # 质检
├── seed/                  # 种子数据
├── system/                # 系统配置 + 日志 + SorterApiLog
└── user/                  # 用户管理
```

### 2.2 前端架构

```
web/src/
├── main.ts                # 应用引导（缺全局错误处理）
├── api/                   # 15 个模块化 API + axios 拦截器
├── composables/           # useSseWithAuth
├── components/            # ScaleScreen
├── router/                # 路由 + 守卫
├── stores/                # Pinia auth store
├── types/                 # api.ts（类型定义不完整）
└── views/                 # 10 个业务目录
```

### 2.3 架构问题

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| A1 | 中 | [app.module.ts](file:///d:/traecode/YT-mes/server/src/app.module.ts#L97-L117) | 13 工序模块 + 9 业务模块平铺在 `imports`，无 `ProcessesModule` 聚合层；新增工序需同时改 app.module / process-status.module / process-status.service / quality-check.service 共 4 处文件，违反开闭原则 | 抽出 `ProcessesModule` 聚合层 + 工序注册表 |
| A2 | 中 | [process-status.service.ts](file:///d:/traecode/YT-mes/server/src/processes/process-status/process-status.service.ts#L44-L86) | `ProcessStatusService` 注入全部 13 个工序 Service 但**实际未使用**（最终用裸 SQL UNION ALL），造成无效耦合与循环依赖隐患 | 删除 13 个 service 注入，仅保留表名映射 |
| A3 | 中 | [processes/*](file:///d:/traecode/YT-mes/server/src/processes) | 13 套 controller/service/dto 高度重复，仅字段不同，总代码量约 4000 行可缩减 60% | 抽 `BaseProcessService<T>` + `ProcessControllerFactory` |
| A4 | 中 | [quality/](file:///d:/traecode/YT-mes/server/src/quality) | 同时存在 `quality.controller.ts` 与 `quality-check.controller.ts`，命名不统一 | 统一命名 |
| A5 | 低 | [server/](file:///d:/traecode/YT-mes/server) 根目录 | `sync-db.js`、`tmp-check-admin.js`、`tmp-check-password.js` 临时脚本与生产代码同仓未隔离 | 移入 `scripts/dev` 并 .gitignore |
| A6 | 低 | [BatchDetailPage.vue](file:///d:/traecode/YT-mes/web/src/views/batch/BatchDetailPage.vue#L112-L126)、[ProcessHubPage.vue](file:///d:/traecode/YT-mes/web/src/views/processes/ProcessHubPage.vue#L64-L76) | 15 个页面级组件同步导入，全部打包进同一 chunk，首屏需下载所有工序代码 | 改用 `shallowRef` + 动态 `import()` 按需加载 |

---

## 三、业务逻辑与功能完整性

### 3.1 批次状态机

批次状态枚举：`DRAFT=1, IN_PROGRESS=2, COMPLETED=3, CLOSED=4, QUALITY_ISSUE=5`

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B1 | 高 | [batch.entity.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.entity.ts#L9-L15) | 缺少"作废/VOID"状态。工序记录有 `recordStatus=2` 作废，批次层级无对应 | 增加 `VOIDED=6` |
| B2 | 高 | [batch.service.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.service.ts#L97-L119) | `update()` 直接 `batch.status = dto.status`，**无状态转换矩阵校验**。可从 COMPLETED 跳回 DRAFT、可写入未定义值 6/7 | 用 `Map<from, Set<to>>` 校验路径 |
| B3 | 高 | [batch.service.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.service.ts#L97-L119) | 批次完成与 13 工序进度**无耦合**。可手动标记完成而工序未跑完，破坏追溯闭环 | COMPLETED 前置校验 13 工序均 `quality_passed` |
| B4 | 高 | [batch.service.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.service.ts#L128-L134) | `remove()` 硬删除批次，不校验 cells/records/packs 子表引用，删除后 14 张表 `batchNo` 悬空 | 改软删除或删前级联校验 |
| B5 | 高 | [batch.controller.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.controller.ts#L58-L69) | `@Patch`/`@Delete` **无 `@Roles` 装饰**，任意登录用户可改状态、删批次 | 加 `@Roles(ADMIN)` |
| B6 | 中 | [batch.service.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.service.ts#L114-L117) | 状态变更与 `batch_status_log` 写入非事务，日志失败时数据不一致 | 放入 `dataSource.transaction` |
| B7 | 中 | [batch.entity.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.entity.ts#L40-L41) vs [batch.service.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.service.ts#L46) | `DRAFT` 状态为死代码，`create()` 强制 `IN_PROGRESS`，DRAFT 永不可达 | 明确语义或移除 |
| B8 | 中 | [quality-check.service.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.service.ts#L84-L99) | `QUALITY_ISSUE` 无恢复路径，只有 `IN_PROGRESS→QUALITY_ISSUE` 单向 | 增加复位规则 |

### 3.2 工序流程一致性（核心断链）

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B9 | **高** | [batching.service.ts](file:///d:/traecode/YT-mes/server/src/processes/batching/batching.service.ts#L53-L78)、[formation.service.ts](file:///d:/traecode/YT-mes/server/src/processes/formation/formation.service.ts#L52-L73)、[sorting.service.ts](file:///d:/traecode/YT-mes/server/src/processes/sorting/sorting.service.ts#L69-L98) | **submit-quality 不生成 QualityCheck**（核心断链）。三个抽查工序的 `submitQuality` 均**只置 `isDraft=false` 并保存工序记录，从不向 `quality_check` 表插入**。`qualityCheckRepo` 被注入但从未使用。业务声称的"submit-quality → 联动 QualityCheck"实际不成立。工序状态因此长期停留在 `pending_quality` | 明确语义：若应自动建 QC，在事务内 `qualityCheckRepo.save`；若是"两步法"，修正文档与前端文案 |
| B10 | 高 | [batching.service.ts](file:///d:/traecode/YT-mes/server/src/processes/batching/batching.service.ts#L56) vs [formation.service.ts](file:///d:/traecode/YT-mes/server/src/processes/formation/formation.service.ts#L52)、[sorting.service.ts](file:///d:/traecode/YT-mes/server/src/processes/sorting/sorting.service.ts#L69) | 事务使用不一致：仅 batching 用 `dataSource.transaction`，formation/sorting 的 submitQuality 非事务。13 工序原子性标准不统一 | 统一全部用事务 |
| B11 | 中 | [process-status.service.ts](file:///d:/traecode/YT-mes/server/src/processes/process-status/process-status.service.ts#L62-L76) | 13 工序列表硬编码，未读 `process_dictionary` 表。字典停用某工序后，状态聚合仍显示它 | 从 `process_dictionary`（`isActive=true`）动态加载 |
| B12 | 中 | [process-status.service.ts](file:///d:/traecode/YT-mes/server/src/processes/process-status/process-status.service.ts#L80-L86) | 状态聚合依赖裸 SQL `${key.replace(/-/g,'_')}_record` + `UNION ALL` + `FOR JSON PATH`，强耦合 SQL Server，表名映射是隐式约定 | 抽象方言层，用 `Repository.find()` 聚合 |
| B13 | 中 | [process-record.subscriber.ts](file:///d:/traecode/YT-mes/server/src/processes/process-status/process-record.subscriber.ts#L13) | `this.dataSource.subscribers.push(this)` 非标准 hack，DI 多实例会重复注册；且**无 `afterDelete`**，删除工序记录不触发缓存失效 | 用注解替代手动注册；补 `afterDelete` |
| B14 | 低 | [process-record.util.ts](file:///d:/traecode/YT-mes/server/src/common/utils/process-record.util.ts#L1-L16) | `JSON.parse(record.extraData)` 无 try/catch，历史脏数据导致整条记录保存抛 500 | 加 try/catch |
| B15 | 低 | [sorting.service.ts](file:///d:/traecode/YT-mes/server/src/processes/sorting/sorting.service.ts#L74)、[batching.service.ts](file:///d:/traecode/YT-mes/server/src/processes/batching/batching.service.ts#L87) | 错误码语义错误："未找到记录"抛 `PROCESS_DRAFT_EXISTS`，"已被作废"抛 `PROCESS_ALREADY_SUBMITTED` | 修正错误码 |

### 3.3 电芯条码与分选逻辑

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B16 | 高 | [cell-barcode.entity.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.entity.ts#L23) | `capacity` 存为 `nvarchar(32)`，无法 `SUM/AVG/ORDER BY` 数值计算。分选机接口文档声称 `decimal(8,2)`，**文档与实现不一致** | 改 `decimal(10,4)` 并迁移历史 |
| B17 | 高 | [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L12-L18) | `cleanDecimal` 超过 10001 的值**静默改为 10001**，负值夹紧到 0。掩盖分选机异常数据，污染追溯 | 超界抛 `BadRequestException` |
| B18 | 高 | [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L43-L69) | sorterUpload "先 findOne 后 save" 无锁无事务无 UPSERT，并发同 barcode 上传触发 UNIQUE 约束 500 错误 | 用 `MERGE`/UPSERT 或捕获冲突重试 |
| B19 | 高 | [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L72-L142) | 批量上传无事务，中途失败留半截数据；`BulkSorterUploadDto` 仅 `@ArrayMinSize(1)` 无 `@ArrayMaxSize` | 加事务 + `@ArrayMaxSize(500)` |
| B20 | 高 | [sorting.service.ts](file:///d:/traecode/YT-mes/server/src/processes/sorting/sorting.service.ts#L69-L98) vs [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L33-L69) | 分选范围不与电芯实测值交叉校验：`SortingRecord` 存了 `ocvVoltageMin/Max`、`irMin/Max`、`capacityMin/Max`，但上传电芯时**从不校验是否落在范围内**，超差电芯照样入库 | 上传时交叉校验，超差标记或拒绝 |
| B21 | 中 | [cell-barcode.entity.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.entity.ts#L14) vs [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L43-L67) | `sortingRecordId` 列存在但 sorterUpload**从不设置该字段**，电芯与分选工序记录的链接断裂 | 上传时关联 sorting record |
| B22 | 中 | [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L51,L63,L121,L133) | `grade` 直接落库，未校验是否为 A/B/C/D 等合法值 | 加枚举校验 |
| B23 | 中 | [cell-barcode.service.ts](file:///d:/traecode/YT-mes/server/src/cells/cell-barcode.service.ts#L43-L44) vs [分选机接口文档.md](file:///d:/traecode/YT-mes/doc/分选机接口文档.md#L101-L108) | 文档说重复条码应返回 `409 Conflict`，代码却是 upsert 覆盖。重传被静默覆盖，审计无法识别"重测" | 明确重测策略 |

### 3.4 质量管理

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B24 | 高 | [quality-check.service.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.service.ts#L32-L99) | 无抽样规则（AQL/样本量），每次 QC 都是质检员手动整批记录 | 引入抽样规则表（按工序/产品型号配置） |
| B25 | 高 | [quality-check.service.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.service.ts#L84-L99) | 不合格只对 `IN_PROGRESS` 批次生效。COMPLETED/CLOSED 批次的不合格被**静默忽略**，无日志无告警 | 无论当前态如何都应记录，COMPLETED 触发返工/让步流程 |
| B26 | 高 | [quality.controller.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.controller.ts#L51-L55)、[quality-check.service.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.service.ts#L185-L188) | 硬删 QC 记录不回滚批次状态。若该 QC 曾把批次置 `QUALITY_ISSUE`，删除后状态不一致，审计链断裂 | 改软删 + 回滚状态 |
| B27 | 中 | [quality-check.service.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.service.ts#L190-L221)、[dashboard.service.ts](file:///d:/traecode/YT-mes/server/src/dashboard/dashboard.service.ts#L25-L42) | **合格率混淆"等级"与"合格"**：以 `grade='A'` 当"通过率"。B/C 档电芯并非不合格，只是分档低。大屏良率虚低 | 区分"质检合格率"（inspectionResult=1）与"分档分布"（grade 统计） |
| B28 | 中 | [quality-check.entity.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.entity.ts#L14-L17) | QC 仅靠 `batchNo + processType` 关联工序，无 `processRecordId`。同工序多次提交/作废后无法定位 QC 对应哪次记录 | 加 `processRecordId` 外键 |
| B29 | 中 | [quality-check.service.ts](file:///d:/traecode/YT-mes/server/src/quality/quality-check.service.ts#L126-L159) | `findPendingQuality` 手拼 SQL + `batchNo.replace(/'/g, "''")` 手动转义 | 改参数化查询 |

### 3.5 物料与设备

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B30 | 高 | [material-warehouse.service.ts](file:///d:/traecode/YT-mes/server/src/material/material-warehouse.service.ts#L33-L68) | **无物料消耗扣减**。仅记录来料入库，无出库入口。工序记录存 `positiveMaterial` 批次号字符串但不校验也不扣 `quantity`。物料台账永远只增不减 | 增加出库记录表/扣减接口；工序提交时事务内校验+扣减 |
| B31 | 高 | [equipment.service.ts](file:///d:/traecode/YT-mes/server/src/equipment/equipment.service.ts#L19,L28-L34) | mass assignment：`create(dto: any)` + `Object.assign(equipment, dto)`，可覆盖 `id` 等任意字段，无 DTO 无白名单 | 引入 DTO + 字段白名单 |
| B32 | 中 | [equipment.service.ts](file:///d:/traecode/YT-mes/server/src/equipment/equipment.service.ts) | 设备无状态联动：无 running/idle/maintenance 状态字段，工序登记不校验设备存在、不更新设备状态。维修中设备可登记使用 | 增加 `status` 字段；工序登记时校验 |
| B33 | 中 | [equipment.service.ts](file:///d:/traecode/YT-mes/server/src/equipment/equipment.service.ts#L37-L43) | 硬删除设备不校验是否被工序记录引用 | 改逻辑删除或引用检查 |
| B34 | 中 | [seed.service.ts](file:///d:/traecode/YT-mes/server/src/seed/seed.service.ts#L158-L163) vs [seed-data.sql](file:///d:/traecode/YT-mes/doc/seed-data.sql#L34-L47) | 程序化 seed 4 台设备，SQL seed 13 台，两源分叉 | 统一种子数据源 |

### 3.6 Pack（电池组）追溯

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B35 | 高 | [pack.service.ts](file:///d:/traecode/YT-mes/server/src/packs/pack.service.ts#L49-L53) | `cellBarcodes.map(barcode => packCellRepo.create(...))` 直接落库，**不查 cell_barcode 表**。可把不存在的条码加入 Pack，追溯链断裂 | createOrUpdate 前用 `In(barCodes)` 查 cell_barcode 校验全部存在 |
| B36 | 高 | [pack.service.ts](file:///d:/traecode/YT-mes/server/src/packs/pack.service.ts#L18-L67) | **不校验电芯同批次**。可把不同批次电芯混装进一个 Pack，破坏批次追溯 | 校验 cells 是否都属于 `dto.batchNo` |
| B37 | 高 | [create-pack.dto.ts](file:///d:/traecode/YT-mes/server/src/packs/dto/create-pack.dto.ts#L16-L18) | `cellBarcodes: string[]` 无 `@ArrayMinSize/@ArrayMaxSize`。可建空 Pack 或塞入上千电芯 | 加 `@ArrayMinSize(1)` `@ArrayMaxSize(N)` |
| B38 | 中 | [pack-cell.entity.ts](file:///d:/traecode/YT-mes/server/src/packs/pack-cell.entity.ts#L9-L13) | PackCell 与 CellBarcode 无外键（仅字符串列），cell 被删/改后 pack 指向悬空条码 | 落 `cellId` 或加 FK |
| B39 | 中 | [pack.service.ts](file:///d:/traecode/YT-mes/server/src/packs/pack.service.ts#L49-L53) | Pack 内重复条码未去重，同一 barcode 可在同一 Pack 出现多次 | 去重 |
| B40 | 中 | [pack.entity.ts](file:///d:/traecode/YT-mes/server/src/packs/pack.entity.ts#L4-L26) | 无 `status`（组装/测试/出货）、无 `updatedBy/updatedAt`。无法跟踪 Pack 生命周期 | 增加 status 与审计字段 |

### 3.7 Dashboard 与大屏

| # | 严重 | 位置 | 问题 | 建议 |
|---|------|------|------|------|
| B41 | 高 | [dashboard.service.ts](file:///d:/traecode/YT-mes/server/src/dashboard/dashboard.service.ts#L50-L58) | **工序 WIP 全部硬编码 0**，`processes` 数组 13 项 `wip: 0` 写死，不查任何工序表。大屏"工序流转 WIP"永远为 0 | 改为查各 `_record` 表 `is_draft=0 AND record_status=1` 计数 |
| B42 | 高 | [dashboard.service.ts](file:///d:/traecode/YT-mes/server/src/dashboard/dashboard.service.ts#L59-L63) | **sorterLogs 硬编码 mock**（`['C001','3.95V','21.5mΩ','A档']`），不来自 `cell_barcode`/`sorter_api_log`。大屏滚动板显示伪造电芯 | 改查 `cell_barcode` 最近 N 条 |
| B43 | 高 | [dashboard.service.ts](file:///d:/traecode/YT-mes/server/src/dashboard/dashboard.service.ts#L67-L73) | SSE 无缓存、无多播，每客户端独立 `interval(30000).pipe(switchMap(...))`。N 个大屏 = N× 全量 COUNT/JOIN 查询，DB 压力线性放大 | 用 `CACHE_MANAGER` 缓存 30s + `share()` 多播 |
| B44 | 中 | [IndexPage.vue](file:///d:/traecode/YT-mes/web/src/views/dashboard/IndexPage.vue#L317-L322) | **批次进度使用 `Math.random()`**，每次 30s 刷新进度条跳变，严重误导生产 | 从后端获取真实进度（已完成工序数/总工序数） |
| B45 | 中 | [batch.service.ts](file:///d:/traecode/YT-mes/server/src/batch/batch.service.ts#L153-L192) | `getDashboardStats` 的 `dailyPassRate` 默认 98.5、`abnormalCount:0` 占位，注释自承"mock" | 迁出占位实现 |
| B46 |