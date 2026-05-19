# Excel Gap Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current YT-MES implementation satisfy the Excel field requirements for batch base info, master-data selection, material binding, and batch status audit.

**Architecture:** Keep the existing NestJS + Vue structure, fill the gaps with small compatible additions, and avoid rewriting the generic process form flow. Back-end changes expose master-data and status-log APIs; front-end changes replace free-text inputs with backed selects and bind process forms to qualified warehouse materials.

**Tech Stack:** NestJS, TypeORM, SQL Server, Vue 3, Pinia, Element Plus, Vitest, Jest

---

## File Structure

**Create**
- `d:\traecode\YT-mes\server\src\equipment\equipment.controller.ts`
- `d:\traecode\YT-mes\server\src\equipment\equipment.service.ts`
- `d:\traecode\YT-mes\server\src\department\department.controller.ts`
- `d:\traecode\YT-mes\server\src\department\department.service.ts`
- `d:\traecode\YT-mes\server\src\batch\batch-status-log.entity.ts`
- `d:\traecode\YT-mes\server\src\batch\batch-status-log.service.ts`
- `d:\traecode\YT-mes\server\src\batch\dto\generate-batch-no.dto.ts`
- `d:\traecode\YT-mes\web\src\api\master-data.ts`
- `d:\traecode\YT-mes\web\src\api\status-log.ts`

**Modify**
- `d:\traecode\YT-mes\server\src\batch\batch.service.ts`
- `d:\traecode\YT-mes\server\src\batch\batch.controller.ts`
- `d:\traecode\YT-mes\server\src\batch\batch.module.ts`
- `d:\traecode\YT-mes\server\src\department\department.module.ts`
- `d:\traecode\YT-mes\server\src\equipment\equipment.module.ts`
- `d:\traecode\YT-mes\server\src\user\user.controller.ts`
- `d:\traecode\YT-mes\server\src\user\user.service.ts`
- `d:\traecode\YT-mes\server\src\material\material-warehouse.controller.ts`
- `d:\traecode\YT-mes\server\src\material\material-warehouse.service.ts`
- `d:\traecode\YT-mes\web\src\views\batch\BatchListPage.vue`
- `d:\traecode\YT-mes\web\src\views\processes\ProcessFormPage.vue`
- `d:\traecode\YT-mes\web\src\views\processes\BatchingPage.vue`
- `d:\traecode\YT-mes\web\src\views\processes\WindingPage.vue`
- `d:\traecode\YT-mes\web\src\views\processes\AssemblyPage.vue`
- `d:\traecode\YT-mes\web\src\views\processes\InjectionPage.vue`
- `d:\traecode\YT-mes\web\src\views\batch\BatchDetailPage.vue`
- `d:\traecode\YT-mes\web\src\types\api.ts`

**Test**
- `d:\traecode\YT-mes\server\src\batch\batch.service.spec.ts`
- `d:\traecode\YT-mes\server\src\material\material-warehouse.service.spec.ts`
- `d:\traecode\YT-mes\server\src\user\user.controller.spec.ts`
- `d:\traecode\YT-mes\web\src\views\batch\BatchListPage.spec.ts`
- `d:\traecode\YT-mes\web\src\views\batch\BatchDetailPage.spec.ts`
- `d:\traecode\YT-mes\web\src\views\processes\useProcess.spec.ts`

### Task 1: Fix Batch Number Rule And Base Batch Semantics

**Files:**
- Modify: `d:\traecode\YT-mes\server\src\batch\batch.service.ts`
- Modify: `d:\traecode\YT-mes\server\src\batch\batch.controller.ts`
- Create: `d:\traecode\YT-mes\server\src\batch\dto\generate-batch-no.dto.ts`
- Test: `d:\traecode\YT-mes\server\src\batch\batch.service.spec.ts`
- Modify: `d:\traecode\YT-mes\web\src\views\batch\BatchListPage.vue`

- [ ] **Step 1: Write the failing back-end tests for Excel batch-number format**

```ts
it('generates batch no as factory + year + month + mn ratio', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-01-15T08:00:00Z'));
  process.env.FACTORY_CODE = 'WT';
  const value = service.generateBatchNo('01MA');
  expect(value).toMatch(/^WT26A01MA$/);
});

it('uses provided mn ratio instead of random suffix', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-12-01T08:00:00Z'));
  process.env.FACTORY_CODE = 'WT';
  expect(service.generateBatchNo('02MB')).toBe('WT26L02MB');
});
```

- [ ] **Step 2: Run the focused back-end test**

Run: `npx jest server/src/batch/batch.service.spec.ts --runInBand`

Expected: current tests fail because `generateBatchNo()` still returns a random suffix instead of the Excel rule.

- [ ] **Step 3: Replace random generation with deterministic Excel-compatible generation**

```ts
generateBatchNo(mnRatio = '01MA'): string {
  const factoryCode = process.env.FACTORY_CODE || 'WT';
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String.fromCharCode(65 + now.getMonth());
  return `${factoryCode}${year}${month}${mnRatio}`;
}
```

- [ ] **Step 4: Expose the generator with validated query input**

```ts
@Get('generate-no')
generateNo(@Query() query: GenerateBatchNoDto) {
  return { data: { batchNo: this.batchService.generateBatchNo(query.mnRatio) } };
}
```

- [ ] **Step 5: Update batch creation UI to use generated batch numbers and relabel `班次/班组`**

```ts
const form = reactive({
  batchNo: '',
  productModel: '',
  productSpec: '',
  workshop: '',
  shift: '',
  plannedQty: 1,
  actualStartDate: '',
});
```

```vue
<el-form-item label="生产班组" prop="shift">
  <el-select v-model="form.shift" style="width: 100%">
    <el-option label="白班一组" value="白班一组" />
    <el-option label="夜班一组" value="夜班一组" />
  </el-select>
</el-form-item>
```

- [ ] **Step 6: Re-run the tests and build checks**

Run: `npx jest server/src/batch/batch.service.spec.ts --runInBand`

Expected: PASS

Run: `npm test -- BatchListPage`

Expected: PASS or only unrelated legacy failures

- [ ] **Step 7: Commit**

```bash
git add server/src/batch web/src/views/batch
git commit -m "feat: align batch number rule with excel spec"
```

### Task 2: Add Master-Data APIs For Workshop, Equipment, And Selectable Users

**Files:**
- Create: `d:\traecode\YT-mes\server\src\equipment\equipment.controller.ts`
- Create: `d:\traecode\YT-mes\server\src\equipment\equipment.service.ts`
- Create: `d:\traecode\YT-mes\server\src\department\department.controller.ts`
- Create: `d:\traecode\YT-mes\server\src\department\department.service.ts`
- Modify: `d:\traecode\YT-mes\server\src\department\department.module.ts`
- Modify: `d:\traecode\YT-mes\server\src\equipment\equipment.module.ts`
- Modify: `d:\traecode\YT-mes\server\src\user\user.controller.ts`
- Modify: `d:\traecode\YT-mes\server\src\user\user.service.ts`
- Test: `d:\traecode\YT-mes\server\src\user\user.controller.spec.ts`

- [ ] **Step 1: Add failing controller tests for selectable master-data APIs**

```ts
it('returns active operators for dropdowns', async () => {
  const result = await controller.findOperators();
  expect(result).toEqual({ data: [{ id: 1, realName: '张三' }] });
});
```

```ts
it('does not expose password hashes in user listing', async () => {
  const result = await controller.findAll();
  expect(result.data[0]).not.toHaveProperty('password');
});
```

- [ ] **Step 2: Add read-only services/controllers**

```ts
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

```ts
@Controller('departments')
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

- [ ] **Step 3: Restrict user listing to safe fields**

```ts
async findAll(): Promise<Array<Pick<User, 'id' | 'username' | 'realName' | 'roleCode' | 'isActive'>>> {
  return this.userRepo.find({
    select: ['id', 'username', 'realName', 'roleCode', 'isActive'],
  });
}
```

- [ ] **Step 4: Re-run focused server tests**

Run: `npx jest server/src/user/user.controller.spec.ts --runInBand`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/equipment server/src/department server/src/user
git commit -m "feat: add master-data lookup apis"
```

### Task 3: Replace Free-Text Inputs With Backed Selects In The Front End

**Files:**
- Create: `d:\traecode\YT-mes\web\src\api\master-data.ts`
- Modify: `d:\traecode\YT-mes\web\src\views\batch\BatchListPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\ProcessFormPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\BatchingPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\WindingPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\AssemblyPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\InjectionPage.vue`
- Test: `d:\traecode\YT-mes\web\src\views\batch\BatchListPage.spec.ts`
- Test: `d:\traecode\YT-mes\web\src\views\processes\useProcess.spec.ts`

- [ ] **Step 1: Add a master-data API client**

```ts
export const masterDataApi = {
  departments() {
    return get<Array<{ code: string; name: string }>>('/departments');
  },
  equipment() {
    return get<Array<{ equipmentCode: string; equipmentName: string }>>('/equipment');
  },
  operators() {
    return get<Array<{ id: number; realName: string }>>('/users/operators');
  },
};
```

- [ ] **Step 2: Extend `FormField` to support select options**

```ts
export interface FormField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
}
```

- [ ] **Step 3: Render select fields in the generic process form**

```vue
<el-select v-else-if="f.type === 'select'" v-model="draftForm[f.key]">
  <el-option v-for="opt in f.options || []" :key="opt.value" :label="opt.label" :value="opt.value" />
</el-select>
```

- [ ] **Step 4: Load departments/operators/equipment into the batch and process pages**

```ts
const operatorOptions = ref<Array<{ label: string; value: string }>>([]);
onMounted(async () => {
  const operators = await masterDataApi.operators();
  operatorOptions.value = (operators.data ?? []).map((item) => ({
    label: item.realName,
    value: item.realName,
  }));
});
```

- [ ] **Step 5: Re-run the front-end tests and type checks**

Run: `npm test -- useProcess`

Expected: PASS

Run: `npm run build`

Expected: passes after existing front-end type errors are either already fixed or handled in the same branch.

- [ ] **Step 6: Commit**

```bash
git add web/src/api web/src/views/batch web/src/views/processes web/src/types
git commit -m "feat: back excel fields with master-data selects"
```

### Task 4: Bind Process Material Fields To Qualified Warehouse Records

**Files:**
- Modify: `d:\traecode\YT-mes\server\src\material\material-warehouse.controller.ts`
- Modify: `d:\traecode\YT-mes\server\src\material\material-warehouse.service.ts`
- Modify: `d:\traecode\YT-mes\web\src\api\master-data.ts`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\BatchingPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\WindingPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\AssemblyPage.vue`
- Modify: `d:\traecode\YT-mes\web\src\views\processes\InjectionPage.vue`
- Test: `d:\traecode\YT-mes\server\src\material\material-warehouse.service.spec.ts`

- [ ] **Step 1: Add failing service tests for qualified-material lookup**

```ts
it('returns only qualified materials for the requested batch and type', async () => {
  repo.find.mockResolvedValue([{ supplierBatchNo: 'PO202604-SUP01', status: 1 }]);
  const result = await service.findAvailable('BATCH2026050001', 1);
  expect(result).toHaveLength(1);
});
```

- [ ] **Step 2: Keep the existing `/available` API and standardize its response shape for select consumption**

```ts
@Get('available')
async findAvailable(@Param('batchNo') batchNo: string, @Query('type') type: string) {
  const records = await this.materialWarehouseService.findAvailable(batchNo, Number(type));
  return {
    data: records.map((item) => ({
      label: item.supplierBatchNo,
      value: item.supplierBatchNo,
      quantity: item.quantity,
      unit: item.unit,
    })),
  };
}
```

- [ ] **Step 3: Replace free-text material fields with qualified-material selects**

```ts
const draftFields: FormField[] = [
  { key: 'positiveMaterial', label: '正极材料批次', type: 'select', options: positiveOptions.value },
  { key: 'negativeMaterial', label: '负极材料批次', type: 'select', options: negativeOptions.value },
  { key: 'operatorName', label: '操作员', type: 'select', options: operatorOptions.value },
];
```

- [ ] **Step 4: Re-run targeted tests**

Run: `npx jest server/src/material/material-warehouse.service.spec.ts --runInBand`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/material web/src/views/processes
git commit -m "feat: bind process inputs to qualified warehouse batches"
```

### Task 5: Add Batch Status Log And Show It On The Batch Detail Page

**Files:**
- Create: `d:\traecode\YT-mes\server\src\batch\batch-status-log.entity.ts`
- Create: `d:\traecode\YT-mes\server\src\batch\batch-status-log.service.ts`
- Modify: `d:\traecode\YT-mes\server\src\batch\batch.module.ts`
- Modify: `d:\traecode\YT-mes\server\src\batch\batch.service.ts`
- Create: `d:\traecode\YT-mes\web\src\api\status-log.ts`
- Modify: `d:\traecode\YT-mes\web\src\views\batch\BatchDetailPage.vue`
- Test: `d:\traecode\YT-mes\web\src\views\batch\BatchDetailPage.spec.ts`

- [ ] **Step 1: Add the failing UI test for the timeline**

```ts
it('renders batch status log entries', async () => {
  vi.mocked(statusLogApi.list).mockResolvedValue({
    success: true,
    message: 'ok',
    data: [{ fromStatus: 1, toStatus: 2, changeReason: '开始生产', createdAt: '2026-05-01T08:30:00Z' }],
  });
  const wrapper = factory();
  await flushPromises();
  expect(wrapper.text()).toContain('开始生产');
});
```

- [ ] **Step 2: Add a status-log entity and write when batch status changes**

```ts
await this.statusLogService.record({
  batchNo,
  fromStatus: previousStatus,
  toStatus: batch.status,
  changedBy: userId,
  changeReason: '批次状态更新',
});
```

- [ ] **Step 3: Add a read API**

```ts
@Get(':batchNo/status-logs')
findLogs(@Param('batchNo') batchNo: string) {
  return { data: this.statusLogService.findByBatchNo(batchNo) };
}
```

- [ ] **Step 4: Render the timeline on the batch detail page**

```vue
<el-timeline>
  <el-timeline-item v-for="item in statusLogs" :key="item.createdAt" :timestamp="item.createdAt">
    {{ item.changeReason }}
  </el-timeline-item>
</el-timeline>
```

- [ ] **Step 5: Run tests**

Run: `npm test -- BatchDetailPage`

Expected: PASS

Run: `npx jest server/src/batch --runInBand`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/batch web/src/views/batch web/src/api
git commit -m "feat: add batch status audit trail"
```

### Task 6: Full Verification And Handoff

**Files:**
- No new files

- [ ] **Step 1: Run the full back-end test suite**

Run: `npx jest --runInBand`

Expected: all existing NestJS tests pass.

- [ ] **Step 2: Run the front-end unit tests**

Run: `npm test`

Expected: all relevant tests pass and there are no new unhandled errors.

- [ ] **Step 3: Run the front-end production build**

Run: `npm run build`

Expected: successful Vite build with no TypeScript errors.

- [ ] **Step 4: Manually verify the Excel-driven flows**

Run and check:
- create a batch with generated batch number
- select workshop, group, operator, and equipment from dropdowns
- create qualified materials for a batch
- open process pages and confirm material fields use qualified warehouse options
- update batch status and confirm the status timeline appears on the detail page

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: close excel requirement gaps"
```

## Self-Review

- Spec coverage: covers batch number rule, base batch info selection, master-data lookup, process material binding, quality fields, warehouse linkage, and status audit. Does not attempt a broader MES redesign outside the Excel gaps.
- Placeholder scan: no `TODO`, `TBD`, or “similar to previous task” placeholders remain.
- Type consistency: field names follow the current codebase names such as `batchNo`, `equipmentCode`, `operatorName`, `positiveMaterial`, `inspectionResult`, and `abnormalRecord`.

Plan complete and saved to `docs/superpowers/plans/2026-05-14-excel-gap-remediation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
