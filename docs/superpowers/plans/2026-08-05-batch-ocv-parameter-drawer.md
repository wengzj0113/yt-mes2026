# Batch OCV Parameter Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OCV1/OCV2 cards on the batch detail page open a right-side parameter-edit drawer that matches sorting while keeping OCV test-data entry separate.

**Architecture:** Add one reusable OCV parameter wrapper around the existing `ProcessFormPage`, with thin OCV1/OCV2 entry components. Extract the sorting-style parameter defaults into a shared field factory, map the new parameter components only in `BatchDetailPage.vue`, and leave the existing `Ocv1Page.vue`/`Ocv2Page.vue` test-entry components unchanged.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vue Test Utils, Vitest, Vite.

---

## File Map

- Create: `web/src/views/processes/standardParameterFields.ts` - shared sorting/OCV parameter field factory.
- Create: `web/src/views/processes/standardParameterFields.spec.ts` - field shape and default-value tests.
- Create: `web/src/views/processes/OcvParameterPage.vue` - shared OCV parameter-edit wrapper.
- Create: `web/src/views/processes/OcvParameterPage.spec.ts` - OCV1/OCV2 wrapper contract tests.
- Create: `web/src/views/processes/Ocv1ParameterPage.vue` - OCV1 batch-detail parameter entry point.
- Create: `web/src/views/processes/Ocv2ParameterPage.vue` - OCV2 batch-detail parameter entry point.
- Modify: `web/src/views/processes/SortingPage.vue` - consume the shared parameter field factory.
- Modify: `web/src/views/batch/BatchDetailPage.vue` - map OCV cards to parameter pages and label the drawer.
- Modify: `web/src/views/batch/BatchDetailPage.spec.ts` - verify OCV cards render parameter editors.
- Modify: `web/src/api/cells.ts` - expose the existing cell snapshot K value in the frontend type.
- Modify: `web/src/views/cells/CellTracePage.vue` - render the K value KPI and format missing/zero values correctly.
- Modify: `web/src/views/cells/CellTracePage.spec.ts` - verify K value rendering.

Unrelated existing worktree changes remain untouched.

### Task 1: Share the sorting-style parameter field definition

**Files:**
- Create: `web/src/views/processes/standardParameterFields.ts`
- Create: `web/src/views/processes/standardParameterFields.spec.ts`
- Modify: `web/src/views/processes/SortingPage.vue`

- [ ] **Step 1: Write the failing field-definition test**

Create `standardParameterFields.spec.ts` with this contract:

```ts
import { describe, expect, it } from 'vitest'
import { createStandardParameterFields } from './standardParameterFields'

describe('createStandardParameterFields', () => {
  it('returns the sorting-style OCV parameter fields and operator default', () => {
    const fields = createStandardParameterFields('张三')

    expect(fields.map((field) => field.key)).toEqual([
      'equipmentCode',
      'ocvVoltageRange',
      'irRange',
      'capacityRange',
      'operatorName',
    ])
    expect(fields[1]).toMatchObject({
      type: 'range',
      minKey: 'ocvVoltageMin',
      maxKey: 'ocvVoltageMax',
      unit: 'V',
    })
    expect(fields[2]).toMatchObject({
      type: 'range',
      minKey: 'irMin',
      maxKey: 'irMax',
      unit: 'mΩ',
    })
    expect(fields[3]).toMatchObject({
      type: 'range',
      minKey: 'capacityMin',
      maxKey: 'capacityMax',
      unit: 'mAh',
    })
    expect(fields[4]).toMatchObject({
      key: 'operatorName',
      defaultValue: '张三',
    })
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `D:\traecode\YT-mes\web`:

```powershell
npm run test -- src/views/processes/standardParameterFields.spec.ts
```

Expected: FAIL because `standardParameterFields.ts` does not exist yet.

- [ ] **Step 3: Implement the shared field factory**

Create `standardParameterFields.ts`:

```ts
import type { FormField } from './useProcess'

export function createStandardParameterFields(operatorName = ''): FormField[] {
  return [
    { key: 'equipmentCode', label: '设备编号', helpText: '工序设备编号' },
    {
      key: 'ocvVoltageRange',
      label: 'OCV电压范围',
      type: 'range',
      minKey: 'ocvVoltageMin',
      maxKey: 'ocvVoltageMax',
      unit: 'V',
      helpText: '开路电压筛选范围',
    },
    {
      key: 'irRange',
      label: '内阻范围',
      type: 'range',
      minKey: 'irMin',
      maxKey: 'irMax',
      unit: 'mΩ',
      helpText: '内阻筛选范围',
    },
    {
      key: 'capacityRange',
      label: '容量范围',
      type: 'range',
      minKey: 'capacityMin',
      maxKey: 'capacityMax',
      unit: 'mAh',
      helpText: '容量分级范围',
    },
    {
      key: 'operatorName',
      label: '操作员',
      defaultValue: operatorName,
      helpText: '负责本工序的操作员',
    },
  ]
}
```

- [ ] **Step 4: Make sorting consume the shared factory**

In `SortingPage.vue`, remove its local `draftFields` array and replace it with:

```ts
import { createStandardParameterFields } from './standardParameterFields'

const authStore = useAuthStore()
const draftFields = createStandardParameterFields(authStore.user?.realName ?? '')
const qualityFields: FormField[] = []
```

Keep `ProcessFormPage` props and the `close` event unchanged.

- [ ] **Step 5: Run the focused test and the existing sorting/process tests**

Run:

```powershell
npm run test -- src/views/processes/standardParameterFields.spec.ts src/views/processes/ProcessHubPage.ocv-entry.spec.ts
```

Expected: PASS, with the existing OCV entry routing test still passing.

- [ ] **Step 6: Commit the focused field refactor**

```powershell
git add -- web/src/views/processes/standardParameterFields.ts web/src/views/processes/standardParameterFields.spec.ts web/src/views/processes/SortingPage.vue
git commit -m "refactor: share sorting-style process fields"
```

### Task 2: Add the OCV parameter-edit components

**Files:**
- Create: `web/src/views/processes/OcvParameterPage.vue`
- Create: `web/src/views/processes/OcvParameterPage.spec.ts`
- Create: `web/src/views/processes/Ocv1ParameterPage.vue`
- Create: `web/src/views/processes/Ocv2ParameterPage.vue`

- [ ] **Step 1: Write the failing wrapper contract test**

Create `OcvParameterPage.spec.ts`. Mock the existing form page so the test only checks the wrapper contract:

```ts
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OcvParameterPage from './OcvParameterPage.vue'

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { realName: '测试员' } }),
}))

vi.mock('./ProcessFormPage.vue', () => ({
  default: defineComponent({
    name: 'ProcessFormPageStub',
    props: ['basePath', 'processName', 'draftFields', 'qualityFields', 'batchNo'],
    template: '<div data-testid="process-form-stub" />',
  }),
}))

describe('OcvParameterPage', () => {
  it.each([
    ['ocv1', 'OCV1测试', 'processes/ocv1'],
    ['ocv2', 'OCV2测试', 'processes/ocv2'],
  ] as const)('configures %s as a parameter editor', (mode, processName, basePath) => {
    const wrapper = mount(OcvParameterPage, { props: { mode, batchNo: 'B1' } })
    const form = wrapper.findComponent({ name: 'ProcessFormPageStub' })

    expect(form.props('basePath')).toBe(basePath)
    expect(form.props('processName')).toBe(`${processName} - 参数编辑`)
    expect(form.props('batchNo')).toBe('B1')
    expect(form.props('qualityFields')).toEqual([])
    expect(form.props('draftFields').map((field: { key: string }) => field.key)).toEqual([
      'equipmentCode',
      'ocvVoltageRange',
      'irRange',
      'capacityRange',
      'operatorName',
    ])
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm run test -- src/views/processes/OcvParameterPage.spec.ts
```

Expected: FAIL because `OcvParameterPage.vue` does not exist yet.

- [ ] **Step 3: Implement the shared OCV parameter wrapper**

Create `OcvParameterPage.vue`:

```vue
<template>
  <ProcessFormPage
    :base-path="basePath"
    :process-name="processName"
    :draft-fields="draftFields"
    :quality-fields="qualityFields"
    :batch-no="batchNo"
    @close="emit('close')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ProcessFormPage from './ProcessFormPage.vue'
import { createStandardParameterFields } from './standardParameterFields'
import type { FormField } from './useProcess'

export type OcvParameterMode = 'ocv1' | 'ocv2'

const props = defineProps<{
  mode: OcvParameterMode
  batchNo?: string
}>()

const emit = defineEmits<{ (event: 'close'): void }>()
const authStore = useAuthStore()

const processName = computed(() => props.mode === 'ocv1' ? 'OCV1测试 - 参数编辑' : 'OCV2测试 - 参数编辑')
const basePath = computed(() => `processes/${props.mode}`)
const draftFields = createStandardParameterFields(authStore.user?.realName ?? '')
const qualityFields: FormField[] = []
const batchNo = computed(() => props.batchNo ?? '')
</script>
```

- [ ] **Step 4: Add explicit OCV1 and OCV2 entry wrappers**

Create `Ocv1ParameterPage.vue`:

```vue
<template>
  <OcvParameterPage mode="ocv1" :batch-no="batchNo" @close="emit('close')" />
</template>

<script setup lang="ts">
import OcvParameterPage from './OcvParameterPage.vue'

defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
</script>
```

Create `Ocv2ParameterPage.vue` with the same structure, replacing `mode="ocv1"` with `mode="ocv2"`.

- [ ] **Step 5: Run the wrapper tests**

Run:

```powershell
npm run test -- src/views/processes/OcvParameterPage.spec.ts
```

Expected: PASS for both OCV modes.

- [ ] **Step 6: Commit the OCV parameter components**

```powershell
git add -- web/src/views/processes/OcvParameterPage.vue web/src/views/processes/OcvParameterPage.spec.ts web/src/views/processes/Ocv1ParameterPage.vue web/src/views/processes/Ocv2ParameterPage.vue
git commit -m "feat: add OCV parameter editor components"
```

### Task 3: Wire OCV parameter editors into the batch detail drawer

**Files:**
- Modify: `web/src/views/batch/BatchDetailPage.vue`
- Modify: `web/src/views/batch/BatchDetailPage.spec.ts`

- [ ] **Step 1: Add failing batch-detail interaction tests**

In `BatchDetailPage.spec.ts`, import `defineComponent`, add component mocks before the `BatchDetailPage` import is evaluated, and include OCV statuses in the mocked `getProcessStatus` result:

```ts
vi.mock('../processes/Ocv1ParameterPage.vue', () => ({
  default: defineComponent({
    name: 'Ocv1ParameterPageStub',
    props: ['batchNo'],
    template: '<div data-testid="ocv1-parameter-editor">{{ batchNo }}</div>',
  }),
}))

vi.mock('../processes/Ocv2ParameterPage.vue', () => ({
  default: defineComponent({
    name: 'Ocv2ParameterPageStub',
    props: ['batchNo'],
    template: '<div data-testid="ocv2-parameter-editor">{{ batchNo }}</div>',
  }),
}))
```

Add these assertions to the test suite:

```ts
it('opens the OCV1 parameter editor from the batch process card', async () => {
  const wrapper = factory()
  await flushPromises()

  const card = wrapper.findAll('.proc-card').find((item) => item.text().includes('OCV1测试'))
  expect(card).toBeDefined()
  await card!.trigger('click')
  await wrapper.vm.$nextTick()

  expect((wrapper.vm as any).drawerTitle).toBe('OCV1测试 - 参数编辑')
  expect(wrapper.find('[data-testid="ocv1-parameter-editor"]').exists()).toBe(true)
})

it('opens the OCV2 parameter editor from the batch process card', async () => {
  const wrapper = factory()
  await flushPromises()

  const card = wrapper.findAll('.proc-card').find((item) => item.text().includes('OCV2测试'))
  expect(card).toBeDefined()
  await card!.trigger('click')
  await wrapper.vm.$nextTick()

  expect((wrapper.vm as any).drawerTitle).toBe('OCV2测试 - 参数编辑')
  expect(wrapper.find('[data-testid="ocv2-parameter-editor"]').exists()).toBe(true)
})
```

Run:

```powershell
npm run test -- src/views/batch/BatchDetailPage.spec.ts
```

Expected: FAIL because the OCV components are not yet mapped and the title still defaults to `工序录入`.

- [ ] **Step 2: Map OCV parameter components and make the right-side/title contract explicit**

In `BatchDetailPage.vue`, add:

```ts
import Ocv1ParameterPage from '../processes/Ocv1ParameterPage.vue'
import Ocv2ParameterPage from '../processes/Ocv2ParameterPage.vue'
```

Add to `componentMap`:

```ts
'ocv1': Ocv1ParameterPage,
'ocv2': Ocv2ParameterPage,
```

Make the drawer direction explicit:

```vue
<el-drawer
  v-model="drawerVisible"
  :title="drawerTitle"
  direction="rtl"
  size="600px"
  destroy-on-close
  @closed="closeDrawer"
>
```

Update `navigate` so OCV titles identify parameter editing:

```ts
const parameterEditPaths = new Set(['ocv1', 'ocv2'])

function navigate(path: string, name?: string) {
  const batchNo = batch.value?.batchNo
  if (!batchNo) return

  const component = componentMap[path]
  if (component) {
    currentComponent.value = component
    const baseTitle = name || (path === 'quality' ? '质量检验' : path === 'materials' ? '材料仓库' : '工序录入')
    drawerTitle.value = parameterEditPaths.has(path) ? `${baseTitle} - 参数编辑` : baseTitle
    drawerVisible.value = true
  } else {
    if (path === 'quality') router.push(`/quality/${batchNo}`)
    else if (path === 'materials') router.push(`/materials/${batchNo}`)
    else router.push(`/processes/${batchNo}/${path}`)
  }
}
```

- [ ] **Step 3: Run batch-detail and process-entry tests**

Run:

```powershell
npm run test -- src/views/batch/BatchDetailPage.spec.ts src/views/processes/OcvParameterPage.spec.ts src/views/processes/ProcessHubPage.ocv-entry.spec.ts
```

Expected: PASS, including OCV batch-detail parameter drawer tests and existing OCV test-entry tests.

- [ ] **Step 4: Commit the batch-detail integration**

```powershell
git add -- web/src/views/batch/BatchDetailPage.vue web/src/views/batch/BatchDetailPage.spec.ts
git commit -m "feat: open OCV parameter editors from batch detail"
```

### Task 4: Add K value to the cell trace KPI row

**Files:**
- Modify: `web/src/api/cells.ts`
- Modify: `web/src/views/cells/CellTracePage.vue`
- Modify: `web/src/views/cells/CellTracePage.spec.ts`

- [ ] **Step 1: Write the failing K value rendering tests**

In `CellTracePage.spec.ts`, add `kValue: 0.1234` to `mockCellTrace.data.cell`, change the KPI count assertion from `4` to `5`, and add:

```ts
it('renders the latest cell snapshot K value in the top KPI row', () => {
  expect(wrapper.find('.kpi-row .kpi-item__lab').text()).toContain('K值')
  expect(wrapper.text()).toContain('0.1234')
  expect(wrapper.text()).toContain('mV/h')
})
```

Also add a separate test fixture with `kValue: 0` and assert the row contains `0.0000`, proving zero is rendered as a valid value:

```ts
it('keeps zero K values visible instead of treating them as missing', async () => {
  vi.mocked(cellApi.trace).mockResolvedValueOnce({
    ...mockCellTrace,
    data: { ...mockCellTrace.data, cell: { ...mockCellTrace.data.cell, kValue: 0 } },
  })
  const zeroWrapper = factory()
  await zeroWrapper.find('.search-bar input').setValue('CELL001')
  await zeroWrapper.find('.search-bar__btn').trigger('click')
  await waitForApi()

  expect(zeroWrapper.text()).toContain('0.0000')
})
```

Run:

```powershell
npm run test -- src/views/cells/CellTracePage.spec.ts
```

Expected: FAIL because the API type and KPI card do not expose K value yet, and the KPI count remains four.

- [ ] **Step 2: Add the snapshot field and KPI card**

In `web/src/api/cells.ts`, add the optional snapshot field:

```ts
kValue?: number | null
```

Add the card after `放电容量` in the barcode KPI branch:

```vue
<div v-if="mode === 'barcode' && result" class="kpi-item">
  <div class="kpi-item__val">
    {{ formatKValue(result.cell.kValue) }}<small v-if="hasKValue(result.cell.kValue)">mV/h</small>
  </div>
  <div class="kpi-item__lab">K值</div>
</div>
```

Add these helpers in `CellTracePage.vue`:

```ts
function hasKValue(value: number | string | null | undefined): boolean {
  return value !== null && value !== undefined && value !== ''
}

function formatKValue(value: number | string | null | undefined): string {
  if (!hasKValue(value)) return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(4) : String(value)
}
```

Change the desktop KPI grid to five columns while preserving its existing two-column media query:

```css
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
```

- [ ] **Step 3: Run the K value tests**

Run:

```powershell
npm run test -- src/views/cells/CellTracePage.spec.ts
```

Expected: PASS, including the existing cell trace tests and the new nonzero/zero K value assertions.

- [ ] **Step 4: Commit the trace KPI change**

```powershell
git add -- web/src/api/cells.ts web/src/views/cells/CellTracePage.vue web/src/views/cells/CellTracePage.spec.ts
git commit -m "feat: show K value in cell trace summary"
```

### Task 5: Build and verify the user-facing flow

**Files:**
- No additional source changes expected. If a test exposes an implementation mismatch, fix only the files listed in Tasks 1-3 and rerun the relevant test.

- [ ] **Step 1: Run the complete focused frontend test set**

Run from `D:\traecode\YT-mes\web`:

```powershell
npm run test -- src/views/processes/standardParameterFields.spec.ts src/views/processes/OcvParameterPage.spec.ts src/views/batch/BatchDetailPage.spec.ts src/views/processes/ProcessHubPage.ocv-entry.spec.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Build the frontend**

Run:

```powershell
npm run build
```

Expected: `vue-tsc` and Vite complete successfully with exit code 0.

- [ ] **Step 3: Confirm local services**

Run from `D:\traecode\YT-mes`:

```powershell
try { (Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 5).StatusCode } catch { throw }
try { (Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 5).StatusCode } catch { throw }
```

Expected: `200` for both frontend and backend. Start only the missing service if either request fails.

- [ ] **Step 4: Verify the drawer in the in-app browser**

Open `http://127.0.0.1:3000/batches/BAT-649729` and verify:

1. Clicking `OCV1测试` opens a right-side drawer titled `OCV1测试 - 参数编辑`.
2. The drawer contains the batch number, device number, three ranges, operator, and save action.
3. It does not contain `电芯码`, `测试时间`, or `K值`.
4. Clicking `OCV2测试` produces the equivalent `OCV2测试 - 参数编辑` drawer.
5. The existing process-center OCV cards still open the OCV test-data form.

- [ ] **Step 5: Review final diff and leave unrelated changes untouched**

Run:

```powershell
git status --short
git diff -- web/src/views/batch/BatchDetailPage.vue web/src/views/batch/BatchDetailPage.spec.ts web/src/views/processes/SortingPage.vue web/src/views/processes/standardParameterFields.ts web/src/views/processes/OcvParameterPage.vue web/src/views/processes/Ocv1ParameterPage.vue web/src/views/processes/Ocv2ParameterPage.vue
```

Expected: only the planned files contain this feature's changes; existing unrelated worktree changes remain present and are not reverted.

## Plan Self-Review

- Spec coverage: the drawer direction, explicit parameter-edit labeling, OCV field parity with sorting, separate test-entry responsibility, save/refresh behavior, K value snapshot rendering, tests, build, and browser acceptance are covered by Tasks 1-5.
- Placeholder scan: no `TODO`, `TBD`, or unspecified implementation step is required; all code changes have concrete paths and snippets.
- Type consistency: `createStandardParameterFields` returns `FormField[]`; `OcvParameterPage` passes that array and an empty `FormField[]` quality list to `ProcessFormPage`; `BatchDetailPage` supplies only `batchNo` to the thin wrappers.
