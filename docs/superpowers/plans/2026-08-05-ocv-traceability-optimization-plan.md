﻿# OCV 与追溯链路优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不引入严格工序卡控的前提下，保证 OCV 多条记录不会导致追溯/工序查询解析失败；统一 OCV 展示顺序；将 batchNo 全链路扩展到 32 位。

**Architecture:** 不改动 OCV 上传接口的写入行为（仍以 `cell_barcode` 为电芯追溯快照）；只在“查询聚合层”对 OCV 做兼容（按批次取最新一条，避免多条导致 JSON 解析失败/Map 覆盖）；batchNo 统一通过常量 + DTO 校验 + Entity length + 迁移来保证一致性。

**Tech Stack:** NestJS, TypeORM, SQL Server, class-validator, Vue 3, Vitest, Jest.

---

## 文件结构与改动面

**后端（NestJS）**
- 修改：`server/src/processes/process-status/process-status.service.ts`
- 修改：`server/src/processes/process-status/process-status.service.spec.ts`
- 修改：一批 `*.entity.ts`（batchNo 列长度 16 → 32）
- 修改：一批 `*dto.ts`（`@MaxLength(16)` → `@MaxLength(BATCH_NO_MAX_LENGTH)`，以及补齐缺失的 batchNo 校验）
- 新增：`server/src/common/constants/field-limits.ts`
- 新增：`server/src/migrations/1781900000000-ExpandBatchNoToNvarchar32.ts`

**前端（Vue）**
- 修改：`web/src/views/cells/CellTracePage.vue`（工序顺序）

---

### Task 1: 修复 ProcessStatusService 的 OCV 多行兼容 + 顺序调整

**Files:**
- Modify: `server/src/processes/process-status/process-status.service.ts`

- [ ] **Step 1: 调整工序顺序为 grading → ocv1 → ocv2 → sorting**

把 `this.processes` 中的顺序从：

```ts
{ key: 'formation', ... },
{ key: 'ocv1', ... },
{ key: 'grading', ... },
{ key: 'ocv2', ... },
{ key: 'sorting', ... },
```

改为：

```ts
{ key: 'formation', name: '化成', route: 'formation', service: this.formationService },
{ key: 'grading', name: '分容', route: 'grading', service: this.gradingService },
{ key: 'ocv1', name: 'OCV1测试', route: 'ocv1', service: null },
{ key: 'ocv2', name: 'OCV2测试', route: 'ocv2', service: null },
{ key: 'sorting', name: '分选', route: 'sorting', service: this.sortingService },
```

- [ ] **Step 2: getProcessStatuses 对 ocv1/ocv2 改为按批次取最新一条**

把 union query 从“直接 WHERE batch_no=@0”改为“OCV 使用 TOP 1 + ORDER BY updated_at DESC”：

```ts
const unionQueries = this.processes.map((proc) => {
  const tableName = `${proc.key.replace(/-/g, '_')}_record`;
  const isOcv = proc.key === 'ocv1' || proc.key === 'ocv2';
  if (isOcv) {
    return `SELECT TOP 1 '${proc.key}' as processKey, is_draft as isDraft, record_status as recordStatus, updated_at as updatedAt FROM ${tableName} WHERE batch_no = @0 ORDER BY updated_at DESC`;
  }
  return `SELECT '${proc.key}' as processKey, is_draft as isDraft, record_status as recordStatus, updated_at as updatedAt FROM ${tableName} WHERE batch_no = @0`;
});
```

- [ ] **Step 3: OCV 不走质检：提交后直接标记为 quality_passed**

在状态计算逻辑中加入 OCV 特判（保持现有 `ProcessStatusType` 不变）：

```ts
const isOcv = proc.key === 'ocv1' || proc.key === 'ocv2';
if (recordStatus === 2) {
  status = 'voided';
} else if (!isDraft) {
  if (isOcv) {
    status = 'quality_passed';
  } else {
    const qc = qualityMap.get(proc.key);
    if (qc) status = qc.hasFailed ? 'quality_failed' : 'quality_passed';
    else status = 'pending_quality';
  }
} else {
  status = 'draft';
}
```

- [ ] **Step 4: getProcessRecords 对 ocv1/ocv2 改为按批次取最新一条（避免 JSON 解析失败）**

把子查询改为：

```ts
const queries = this.processes.map((proc) => {
  const tableName = `${proc.key.replace(/-/g, '_')}_record`;
  const isOcv = proc.key === 'ocv1' || proc.key === 'ocv2';
  if (isOcv) {
    return `SELECT '${proc.key}' as processKey, (SELECT TOP 1 * FROM ${tableName} WHERE batch_no = @0 ORDER BY updated_at DESC FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) as data`;
  }
  return `SELECT '${proc.key}' as processKey, (SELECT * FROM ${tableName} WHERE batch_no = @0 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) as data`;
});
```

- [ ] **Step 5: Commit**

```powershell
git add server/src/processes/process-status/process-status.service.ts
git commit -m "fix: stabilize ocv records query and reorder processes"
```

---

### Task 2: 更新 ProcessStatusService 单测（覆盖 OCV 多行兼容与顺序）

**Files:**
- Modify: `server/src/processes/process-status/process-status.service.spec.ts`

- [ ] **Step 1: 替换旧的“mock 各工序 Service.findByBatchNo”测试基座**

使用 `DataSource.query` 与 `QualityCheck` Repository 的 mock 作为测试入口：

```ts
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProcessStatusService } from './process-status.service';
import { QualityCheck } from '../../quality/quality-check.entity';

const dataSource = { query: jest.fn() };
const qualityRepo = { find: jest.fn() };
```

并在 `providers` 中提供 `DataSource` 与 `QualityCheck` repo：

```ts
providers: [
  ProcessStatusService,
  { provide: DataSource, useValue: dataSource },
  { provide: getRepositoryToken(QualityCheck), useValue: qualityRepo },
  { provide: BatchingService, useValue: {} },
  { provide: CoatingService, useValue: {} },
  { provide: RollerPressingService, useValue: {} },
  { provide: SlittingService, useValue: {} },
  { provide: SortingService, useValue: {} },
  { provide: ElectrodeService, useValue: {} },
  { provide: WindingService, useValue: {} },
  { provide: AssemblyService, useValue: {} },
  { provide: BakingService, useValue: {} },
  { provide: InjectionService, useValue: {} },
  { provide: WrappingService, useValue: {} },
  { provide: FormationService, useValue: {} },
  { provide: GradingService, useValue: {} },
]
```

- [ ] **Step 2: 新增用例：工序顺序包含 grading → ocv1 → ocv2 → sorting**

```ts
it('keeps process order (grading -> ocv1 -> ocv2 -> sorting)', async () => {
  dataSource.query.mockResolvedValue([]);
  qualityRepo.find.mockResolvedValue([]);
  const result = await service.getProcessStatuses('BATCH001');
  const keys = result.map((x) => x.processKey);
  expect(keys).toEqual([
    'batching', 'coating', 'roller-pressing', 'slitting',
    'electrode', 'winding', 'assembly', 'baking', 'injection',
    'wrapping', 'formation', 'grading', 'ocv1', 'ocv2', 'sorting',
  ]);
});
```

- [ ] **Step 3: 新增用例：OCV 的 SQL 使用 TOP 1，且不进入 pending_quality**

```ts
it('uses TOP 1 for ocv queries and marks ocv as quality_passed', async () => {
  dataSource.query.mockResolvedValue([
    { processKey: 'ocv1', isDraft: 0, recordStatus: 1, updatedAt: '2026-08-05T10:00:00.000Z' },
  ]);
  qualityRepo.find.mockResolvedValue([]);

  const result = await service.getProcessStatuses('BATCH001');
  const ocv1 = result.find((x) => x.processKey === 'ocv1');
  expect(ocv1?.status).toBe('quality_passed');

  const [sql] = dataSource.query.mock.calls[0];
  expect(sql).toContain("SELECT TOP 1 'ocv1'");
  expect(sql).toContain('FROM ocv1_record');
});
```

- [ ] **Step 4: 新增用例：getProcessRecords 对 ocv 使用 TOP 1 子查询（避免 WITHOUT_ARRAY_WRAPPER 多行）**

```ts
it('uses TOP 1 subquery for ocv records query', async () => {
  dataSource.query.mockResolvedValue([
    { processKey: 'ocv1', data: '{"batch_no":"BATCH001","is_draft":0}' },
  ]);

  const records = await service.getProcessRecords('BATCH001');
  expect(records.ocv1).toEqual({ batchNo: 'BATCH001', isDraft: 0 });

  const [sql] = dataSource.query.mock.calls[0];
  expect(sql).toContain('(SELECT TOP 1 * FROM ocv1_record');
  expect(sql).toContain('FOR JSON PATH, WITHOUT_ARRAY_WRAPPER');
});
```

- [ ] **Step 5: Run tests**

```powershell
cd server
npx jest src/processes/process-status/process-status.service.spec.ts --runInBand
```

Expected: PASS

- [ ] **Step 6: Commit**

```powershell
git add server/src/processes/process-status/process-status.service.spec.ts
git commit -m "test: align process-status tests with datasource queries and ocv rules"
```

---

### Task 3: 前端追溯页工序顺序同步

**Files:**
- Modify: `web/src/views/cells/CellTracePage.vue`

- [ ] **Step 1: 调整 PROCESS_ORDER**

把：

```ts
{ key: 'formation', name: '化成' },
{ key: 'ocv1', name: 'OCV1测试' },
{ key: 'grading', name: '分容' },
{ key: 'ocv2', name: 'OCV2测试' },
{ key: 'sorting', name: '分选' },
```

改为：

```ts
{ key: 'formation', name: '化成' },
{ key: 'grading', name: '分容' },
{ key: 'ocv1', name: 'OCV1测试' },
{ key: 'ocv2', name: 'OCV2测试' },
{ key: 'sorting', name: '分选' },
```

- [ ] **Step 2: Run web unit tests**

```powershell
cd web
npm test
```

Expected: PASS

- [ ] **Step 3: Commit**

```powershell
git add web/src/views/cells/CellTracePage.vue
git commit -m "ui: reorder ocv steps after grading in trace page"
```

---

### Task 4: batchNo 扩展到 32（常量 + DTO + Entity + Migration）

**Files:**
- Create: `server/src/common/constants/field-limits.ts`
- Modify: `server/src/batch/dto/create-batch.dto.ts`
- Modify: 27 个含 `@MaxLength(16)` 的 DTO（见下方清单）
- Modify: 20 个含 `length: 16` 的 Entity（见下方清单）
- Create: `server/src/migrations/1781900000000-ExpandBatchNoToNvarchar32.ts`

- [ ] **Step 1: 新增 batchNo 最大长度常量**

Create `server/src/common/constants/field-limits.ts`:

```ts
export const BATCH_NO_MAX_LENGTH = 32;
```

- [ ] **Step 2: CreateBatchDto 补齐 batchNo 校验**

Update `server/src/batch/dto/create-batch.dto.ts`：

```ts
import { IsString, IsOptional, IsInt, Min, IsDateString, MaxLength } from 'class-validator';
import { BATCH_NO_MAX_LENGTH } from '../../common/constants/field-limits';

export class CreateBatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(BATCH_NO_MAX_LENGTH)
  batchNo?: string;
  // ...
}
```

- [ ] **Step 3: 把所有 @MaxLength(16) 统一替换为 @MaxLength(BATCH_NO_MAX_LENGTH)**

这些文件需要逐个改（全部为 batchNo 入参）：

```text
server/src/cells/dto/ocv2-upload.dto.ts
server/src/cells/dto/ocv1-upload.dto.ts
server/src/cells/dto/sorter-upload.dto.ts
server/src/material/dto/create-material.dto.ts
server/src/quality/dto/create-quality-check.dto.ts
server/src/processes/batching/dto/create-draft.dto.ts
server/src/processes/coating/dto/create-draft.dto.ts
server/src/processes/roller-pressing/dto/create-draft.dto.ts
server/src/processes/slitting/dto/create-draft.dto.ts
server/src/processes/electrode/dto/create-draft.dto.ts
server/src/processes/winding/dto/create-draft.dto.ts
server/src/processes/assembly/dto/create-draft.dto.ts
server/src/processes/baking/dto/create-draft.dto.ts
server/src/processes/injection/dto/create-draft.dto.ts
server/src/processes/wrapping/dto/create-draft.dto.ts
server/src/processes/formation/dto/create-draft.dto.ts
server/src/processes/grading/dto/create-draft.dto.ts
server/src/processes/sorting/dto/create-draft.dto.ts
server/src/processes/batching/dto/submit-quality.dto.ts
server/src/processes/electrode/dto/submit-quality.dto.ts
server/src/processes/winding/dto/submit-quality.dto.ts
server/src/processes/assembly/dto/submit-quality.dto.ts
server/src/processes/baking/dto/submit-quality.dto.ts
server/src/processes/injection/dto/submit-quality.dto.ts
server/src/processes/wrapping/dto/submit-quality.dto.ts
server/src/processes/formation/dto/submit-quality.dto.ts
server/src/processes/grading/dto/submit-quality.dto.ts
```

每个文件按统一写法引入常量，例如：

```ts
import { BATCH_NO_MAX_LENGTH } from '../../../common/constants/field-limits';

@IsString()
@MaxLength(BATCH_NO_MAX_LENGTH)
batchNo: string;
```

- [ ] **Step 4: Entity 中 batchNo 列长度统一为 32**

以下文件把 `length: 16` 改成 `length: 32`：

```text
server/src/batch/batch.entity.ts
server/src/batch/batch-status-log.entity.ts
server/src/cells/cell-barcode.entity.ts
server/src/quality/quality-check.entity.ts
server/src/material/material-warehouse.entity.ts
server/src/processes/batching/batching-record.entity.ts
server/src/processes/coating/coating-record.entity.ts
server/src/processes/roller-pressing/roller-pressing-record.entity.ts
server/src/processes/slitting/slitting-record.entity.ts
server/src/processes/electrode/electrode-record.entity.ts
server/src/processes/winding/winding-record.entity.ts
server/src/processes/assembly/assembly-record.entity.ts
server/src/processes/baking/baking-record.entity.ts
server/src/processes/injection/injection-record.entity.ts
server/src/processes/wrapping/wrapping-record.entity.ts
server/src/processes/formation/formation-record.entity.ts
server/src/processes/grading/grading-record.entity.ts
server/src/processes/sorting/sorting-record.entity.ts
server/src/processes/ocv/ocv1-record.entity.ts
server/src/processes/ocv/ocv2-record.entity.ts
```

- [ ] **Step 5: 新增迁移：批次号列扩展到 NVARCHAR(32)**

Create `server/src/migrations/1781900000000-ExpandBatchNoToNvarchar32.ts`：

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandBatchNoToNvarchar321781900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('batch') AND name = 'batch_no')
      BEGIN
        ALTER TABLE batch ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('batch_status_log') AND name = 'batch_no')
      BEGIN
        ALTER TABLE batch_status_log ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'batch_no')
      BEGIN
        ALTER TABLE cell_barcode ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('quality_check') AND name = 'batch_no')
      BEGIN
        ALTER TABLE quality_check ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('material_warehouse') AND name = 'batch_no')
      BEGIN
        ALTER TABLE material_warehouse ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('batching_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE batching_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('coating_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE coating_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('roller_pressing_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE roller_pressing_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('slitting_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE slitting_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('electrode_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE electrode_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('winding_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE winding_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('assembly_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE assembly_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('baking_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE baking_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('injection_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE injection_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('wrapping_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE wrapping_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('formation_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE formation_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('grading_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE grading_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ocv1_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE ocv1_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ocv2_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE ocv2_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'batch_no')
      BEGIN
        ALTER TABLE sorting_record ALTER COLUMN batch_no NVARCHAR(32) NOT NULL;
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('batch') AND name = 'batch_no')
      BEGIN
        ALTER TABLE batch ALTER COLUMN batch_no NVARCHAR(16) NOT NULL;
      END
    `);
  }
}
```

- [ ] **Step 6: 验证（不跑生产库）**

```powershell
cd server
npm run build
npx jest --runInBand
```

```powershell
cd ..\web
npm run build
npm test
```

- [ ] **Step 7: Commit**

```powershell
git add server/src/common/constants/field-limits.ts server/src/migrations/1781900000000-ExpandBatchNoToNvarchar32.ts server/src/**/*.ts
git commit -m "chore: widen batchNo to 32 across dto/entity and add migration"
```
}

interface OcvBatchSummary {
  batchNo: string;
  cellCount: number;
  ocv1Count: number;
  ocv2Count: number;
  latestOcv1At: string | null;
  latestOcv2At: string | null;
}
```

Keep the existing `cell`, `batch`, and `processes` fields so current consumers do not break. Add `ocvHistory` to cell trace and `ocvSummary` to batch records.

- [ ] **Step 2: Make cell trace query by barcode**

For `GET /cells/:barcode/trace`, load the cell, its batch, the current batch-level process records, OCV history filtered by the exact barcode, Pack memberships, and materials/quality records needed by the current UI. Do not call a batch-only OCV query for a cell trace.

- [ ] **Step 3: Make batch trace return OCV summaries**

For `GET /processes/records/:batchNo`, keep one current row for each manual process and return OCV summaries using aggregate queries. Do not use `Map` to choose one row from `ocv1_record` or `ocv2_record`, and do not use `WITHOUT_ARRAY_WRAPPER` for multi-row data.

- [ ] **Step 4: Extend batch cell listing with snapshot flags**

Return `hasOcv1`, `hasOcv2`, `ocv1Time`, and `ocv2Time` for each cell in `GET /cells/batch/:batchNo/barcodes`. Preserve pagination and existing cell fields.

- [ ] **Step 5: Invalidate trace cache after device uploads**

After the OCV transaction commits, delete `trace:barcode:<barcode>` for every affected barcode. Add the same invalidation to sorter updates if the trace response contains sorter snapshot data. Test that a cached trace immediately reflects a new OCV upload.

- [ ] **Step 6: Add projection tests**

Test one batch containing multiple OCV rows and at least two barcodes. Assert that cell A never receives cell B's OCV data, batch summaries count distinct barcodes correctly, legacy rows with null barcode do not crash the query, and Pack trace returns the same cell trace data as direct barcode trace.

### Task 5: Centralize process display metadata and correct OCV order

**Files:**
- Create: `server/src/processes/process-status/process-catalog.ts`
- Modify: `server/src/processes/process-status/process-status.service.ts`
- Modify: `server/src/processes/process-status/process-status.module.ts`
- Modify: `server/src/seed/seed.service.ts`
- Modify: `server/src/master-data/process-dictionary/process-dictionary.entity.ts`
- Modify: `server/src/master-data/process-dictionary/process-dictionary.service.ts`
- Modify: `web/src/views/cells/CellTracePage.vue`
- Modify: `web/src/views/processes/ProcessHubPage.vue`
- Modify: `web/src/views/batch/BatchDetailPage.vue`
- Modify: `web/src/api/process-dictionary.ts`
- Test: `server/src/processes/process-status/process-status.service.spec.ts`
- Test: `web/src/views/cells/CellTracePage.spec.ts`

- [ ] **Step 1: Define the canonical order and scope**

The server catalog must contain the 15 display entries in this order:

```ts
formation,
grading,
ocv1, // scope: cell, input: external
ocv2, // scope: cell, input: external
sorting
```

Keep the preceding 10 entries unchanged. OCV entries must be marked external/read-only. They are not candidates for manual draft or quality-gate actions.

- [ ] **Step 2: Upsert OCV process dictionary rows**

Add OCV1 and OCV2 with stable process codes, names, sort orders between grading and sorting, `isActive = true`, and descriptions stating that records come from external equipment. Do this with an idempotent migration or seed upsert; do not rely on the existing “skip when any dictionary row exists” seed behavior.

- [ ] **Step 3: Update status semantics without adding gates**

For OCV status, return `not_entered` when no current measurement exists and `received` when at least one cell has a current measurement. Keep existing manual process status behavior untouched. Exclude OCV from `quality-check.service.ts` pending-quality table lists.

- [ ] **Step 4: Make the frontend display read-only OCV cards**

Update `PROCESS_ORDER` to `grading -> ocv1 -> ocv2 -> sorting`. Do not map OCV to a manual form component in `ProcessHubPage.vue`; render the status/count and leave the upload responsibility with the external endpoint. In `CellTracePage.vue`, render the current cell's OCV snapshot and history from the new trace response.

- [ ] **Step 5: Update process-status tests**

Replace stale tests that expect 13 entries or a `submitted` status from service mocks. Add assertions for 15 entries, exact order, external OCV `received` status, multiple OCV rows, and no quality-gate requirement.

### Task 6: Strengthen Pack associations for traceability

**Files:**
- Modify: `server/src/packs/pack.service.ts`
- Modify: `server/src/packs/pack-cell.entity.ts`
- Modify: `server/src/packs/pack.entity.ts`
- Modify: `server/src/packs/pack.module.ts`
- Create: `server/src/packs/pack.service.spec.ts` if missing
- Modify: `web/src/api/pack.ts`
- Modify: `web/src/views/cells/CellTracePage.vue`

- [ ] **Step 1: Validate Pack cells inside the transaction**

Before replacing an existing Pack composition, reject duplicate cell barcodes, reject missing cells, and reject a supplied `batchNo` that differs from any linked cell. If `batchNo` is omitted and all cells belong to one batch, infer and save that batch number. Preserve the existing update-by-Pack-barcode behavior.

- [ ] **Step 2: Add lookup indexes and association constraints**

Add an index on `pack.batch_no` and `pack_cell.cell_barcode`. Add a unique constraint for `(pack_id, cell_barcode)`. Do not add a global unique constraint on `cell_barcode` until the business confirms that a cell can belong to only one Pack; the service-level validation must match the confirmed rule.

- [ ] **Step 3: Test Pack-to-cell trace consistency**

Assert that a Pack with valid cells is retrievable, invalid or cross-batch cells are rejected atomically, replacing a Pack does not leave old associations, and selecting a Pack cell returns the same OCV history as direct cell trace.

### Task 7: Synchronize documentation and external API contracts

**Files:**
- Modify: `doc/YT-MES-硬件设备接口文档-v3.0.html`
- Modify: other maintained interface/user documents containing `batchNo`
- Modify: `.trae/documents/adjust_ocv_position_and_batchno_length_plan.md` or archive it in favor of the approved design and plan
- Create: `doc/sql/1781900000000-expand-batch-no-and-ocv.sql` only if production cannot run TypeORM migration

- [ ] **Step 1: Document the OCV data contract**

Document that OCV records are per-cell measurements, `barcode` is required, OCV can arrive before sorter data, history is append-only, `cell_barcode` is the latest snapshot, and `eventId` is optional idempotency support.

- [ ] **Step 2: Correct field and timestamp documentation**

Change every maintained `batchNo` limit to 32. Use an actual ISO 8601 example such as `2026-06-16T18:38:15+08:00`, or explicitly document the accepted legacy timestamp format if the device cannot change.

- [ ] **Step 3: Keep one migration source of truth**

If a manual SQL file is required, generate the same table/index operations as the TypeORM migration and include a preflight, transaction, postflight metadata checks, and a clear version header. Remove the reversed `max_length = 32 * 2` condition and the undeclared dynamic `@sql` variables from the original script.

### Task 8: Roll out and verify in controlled phases

**Files:**
- Create: `docs/superpowers/plans/2026-08-05-ocv-traceability-rollout-checklist.md`
- Test: API integration tests and Playwright trace scenarios under `web/tests/`

- [ ] **Step 1: Take a schema and data inventory**

Before deployment, export counts and max lengths for every `batch_no` column, count OCV rows with null barcode, count cells whose OCV snapshots are populated, and count Pack associations. Save the results with the deployment record.

- [ ] **Step 2: Deploy migration before application code**

Run the TypeORM migration in a maintenance window, verify `sys.columns` and `sys.indexes`, then deploy the API. Do not run the old manual SQL after the migration.

- [ ] **Step 3: Run API smoke tests**

Exercise a 32-character batch number through batch creation, OCV1 single, OCV2 bulk, batch trace, cell trace, Pack creation, and Pack trace. Assert that a 33-character value returns validation failure and that a wrong-batch cell upload returns conflict.

- [ ] **Step 4: Run data-integrity checks**

For a batch with N uploaded OCV1 and M uploaded OCV2 cells, verify history row counts, distinct barcode counts, latest snapshot values, OCV2 `kValue`, and API log entries. Verify that a retry with the same event ID does not add a duplicate history row.

- [ ] **Step 5: Run build and test gates**

Run:

```powershell
cd server
npm run build
npx jest --runInBand
cd ..\web
npm run build
npm test -- --run
npx playwright test
```

The release is complete only when the OCV integration tests, trace projection tests, migration checks, and the existing relevant suites pass. Existing unrelated failures must be recorded rather than hidden.

## Suggested commit sequence

1. `test: add batch number and traceability regression cases`
2. `feat: expand batch number columns and add ocv measurement fields`
3. `feat: persist ocv measurements with cell snapshots`
4. `feat: expose cell and batch ocv trace projections`
5. `feat: align external process display order`
6. `fix: validate pack associations for traceability`
7. `docs: update ocv and batch number contracts`

## Completion checklist

- [ ] No relevant batch-number entity, DTO, migration, or maintained document still limits the value to 16.
- [ ] OCV history rows identify the measured barcode, while old rows remain readable.
- [ ] OCV snapshot and history are committed atomically.
- [ ] Wrong-batch uploads cannot reassign an existing cell.
- [ ] Cell, batch, and Pack trace responses are typed and tested.
- [ ] OCV order is `grading -> ocv1 -> ocv2 -> sorting` everywhere it is displayed.
- [ ] OCV is informational and does not become a hidden process or quality gate.
- [ ] Migration is idempotent, rollback-safe for existing history, and verified against SQL Server.
