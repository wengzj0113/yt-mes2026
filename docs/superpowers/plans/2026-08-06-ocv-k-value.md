# OCV K 值自动计算 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在电芯追溯中显示 OCV K 值，并由数据库在 OCV1/OCV2 数据齐全后自动计算。

**Architecture:** 保留现有 `cell_barcode` 快照和 trace API；新增 SQL Server 存储过程负责单电芯计算，触发器在 OCV 字段写入后调用过程。OCV 上传不再让外部 K 值覆盖计算结果，前端直接展示已有 `cell.kValue`。

**Tech Stack:** NestJS, TypeORM, SQL Server, Vue 3, Vitest, Jest.

---

### Task 1: 数据库计算对象

**Files:**
- Create: `server/src/migrations/1781840000000-CreateOcvKValueCalculation.ts`
- Modify: `doc/create-database.sql`

- [ ] 添加幂等创建/更新 `dbo.calculate_cell_k_value` 存储过程。
- [ ] 添加 `AFTER INSERT, UPDATE` 触发器，仅在 OCV 电压或时间字段变化时调用过程。
- [ ] 使用毫秒时间差除以 `3600000.0`，并将 V 转换为 mV。
- [ ] 迁移回滚删除触发器和过程；初始化 SQL 与迁移保持一致。

### Task 2: OCV 上传规则测试与实现

**Files:**
- Test: `server/src/cells/cell-barcode.service.spec.ts`
- Modify: `server/src/cells/cell-barcode.service.ts`

- [ ] 先添加测试，证明 OCV2 上传不会用请求中的 `kValue` 覆盖数据库计算值。
- [ ] 运行对应 Jest 测试确认先失败。
- [ ] 删除 OCV1/OCV2 上传对外部 K 值的写入；保留字段兼容但忽略其值。
- [ ] 运行对应 Jest 测试确认通过。

### Task 3: 追溯页面展示

**Files:**
- Test: `web/src/views/cells/CellTracePage.spec.ts`
- Modify: `web/src/views/cells/CellTracePage.vue`

- [ ] 先添加测试，覆盖 K 值为空显示 `-`、有值显示数值。
- [ ] 运行对应 Vitest 测试确认先失败。
- [ ] 在电芯 KPI 区新增 K 值卡片，使用 `result.cell.kValue ?? '-'`。
- [ ] 运行对应 Vitest 测试确认通过。

### Task 4: 全量验证

- [ ] 运行后端相关 Jest 和全量测试。
- [ ] 运行前端 Vitest 与 `npm run build`。
- [ ] 运行后端 `npm run build`。
- [ ] 检查 `git diff`，确认只包含本需求相关改动。
