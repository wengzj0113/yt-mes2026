# 化成分容参数录入布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将化成分容参数录入改造成与分选出货一致的批次详情右侧弹出抽屉，并按业务阶段分组展示十个 Excel 参数。

**Architecture:** 新增 `FormationGradingPage.vue` 作为化成分容专用包装组件，复用现有动态表单数据加载、保存和提交逻辑；在批次详情页和直接路由中统一使用该组件。通用 `ProcessFormPage` 增加可选分组配置和布局 class，但不改变其他动态工序的数据接口。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Vue Test Utils、Vitest、Vite。

---

### Task 1: 建立化成分容专用组件和分组配置

**Files:**
- Create: `web/src/views/processes/FormationGradingPage.vue`
- Modify: `web/src/views/processes/ProcessFormPage.vue`

- [ ] **Step 1: Add a failing component test for the three groups**

在 `web/src/views/processes/FormationGradingPage.spec.ts` 创建测试，mock 动态字典接口返回十个字段，挂载页面并断言页面传入 `ProcessFormPage` 的分组映射包含：

```ts
expect(wrapper.find('[data-testid="formation-grading-form"]').exists()).toBe(true)
expect(wrapper.text()).toContain('活化参数')
expect(wrapper.text()).toContain('化成分容参数')
expect(wrapper.text()).toContain('分容结果参数')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `D:\traecode\YT-mes\web`:

```powershell
npm test -- --run src/views/processes/FormationGradingPage.spec.ts
```

Expected: FAIL because the dedicated component, group prop, and group headings do not exist.

- [ ] **Step 3: Add an optional group map to `ProcessFormPage`**

Add the prop:

```ts
fieldGroups?: Array<{ key: string; label: string; fieldKeys: string[] }>
```

Render dynamic fields by group when supplied. Each group must render an `el-divider` with its label and only the fields whose keys are in `fieldKeys`; fields not listed in a group remain in a final “其他参数” group so no Excel field is lost. Keep the existing field order within each group.

- [ ] **Step 4: Create `FormationGradingPage.vue`**

Use the existing `DynamicProcessPage`/`ProcessFormPage` pattern, passing:

```ts
const fieldGroups = [
  { key: 'activation', label: '活化参数', fieldKeys: ['activationDuration', 'filmColor', 'equipmentCode'] },
  { key: 'formation', label: '化成分容参数', fieldKeys: ['formationTemplate', 'formationTemperature', 'gradingTemplate', 'gradingTemperature'] },
  { key: 'grading-result', label: '分容结果参数', fieldKeys: ['postGradingVoltageRange', 'postGradingInternalResistanceRange', 'capacityGradeStandard'] },
]
```

The component must pass `processCode="formation-grading"`, `processName="化成分容"`, the current `batchNo`, and `data-testid="formation-grading-form"` to the form wrapper. It must emit `close` unchanged.

- [ ] **Step 5: Run the focused component test and verify it passes**

```powershell
npm test -- --run src/views/processes/FormationGradingPage.spec.ts
```

Expected: PASS, with the three group headings and all ten field keys rendered.

### Task 2: Use the new component in drawer and direct route flows

**Files:**
- Modify: `web/src/views/batch/BatchDetailPage.vue`
- Modify: `web/src/views/processes/ProcessHubPage.vue`
- Modify: `web/src/router/index.ts`
- Modify: `web/src/views/processes/FormationGradingPage.spec.ts`

- [ ] **Step 1: Add a failing mapping assertion**

Extend the batch detail component test with a mocked `FormationGradingPage` and a `formation-grading` process status item. Click that card and assert the drawer contains the mocked component.

- [ ] **Step 2: Run the test and verify the mapping failure**

```powershell
npm test -- --run src/views/batch/BatchDetailPage.spec.ts
```

Expected: FAIL if the batch detail map still points to the generic page or does not expose the new component.

- [ ] **Step 3: Replace the generic mapping**

Import `FormationGradingPage` and map `'formation-grading'` to it in both `BatchDetailPage.vue` and `ProcessHubPage.vue`. Keep `sorting` unchanged.

- [ ] **Step 4: Update the direct route**

Change the `formation-grading` route in `web/src/router/index.ts` to lazy-load `FormationGradingPage.vue`, preserving the `processCode`, `processName`, and `batchNo` props.

- [ ] **Step 5: Run drawer and route tests**

```powershell
npm test -- --run src/views/batch/BatchDetailPage.spec.ts src/views/processes/ProcessHubPage.ocv-entry.spec.ts
```

Expected: PASS; clicking “化成分容” opens the right-side drawer and direct URL routing resolves.

### Task 3: Match the sorting-style drawer layout and responsive spacing

**Files:**
- Modify: `web/src/views/processes/ProcessFormPage.vue`
- Modify: `web/src/views/processes/FormationGradingPage.vue`

- [ ] **Step 1: Add layout assertions**

Assert that the form exposes the `process-form--formation-grading` class, all three group containers, and a bottom action area containing “保存” and “提交质检”.

- [ ] **Step 2: Implement the layout styles**

Add scoped styles for the formation-grading variant:

```css
.process-form--formation-grading .field-grid { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 10px 24px; }
.process-form--formation-grading .group-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
@media (max-width: 900px) { .process-form--formation-grading .field-grid { grid-template-columns: 1fr; } }
```

Use the existing Element Plus drawer/container styles so the form fills the same right-side panel as sorting, while keeping the batch number header and close behavior.

- [ ] **Step 3: Verify layout-related tests**

```powershell
npm test -- --run src/views/processes/FormationGradingPage.spec.ts src/views/batch/BatchDetailPage.spec.ts
```

Expected: PASS.

### Task 4: Verify data behavior and build

**Files:**
- Test: `web/src/views/processes/useProcess.spec.ts`
- Test: `server/src/process-dynamic/process-dynamic.service.spec.ts`

- [ ] **Step 1: Confirm complete submission payload**

Run:

```powershell
npm test -- --run src/views/processes/useProcess.spec.ts
```

Expected: PASS, including the existing assertion that the complete `draftForm` payload is sent to `formation-grading/submit`.

- [ ] **Step 2: Confirm backend draft merge validation**

Run from `D:\traecode\YT-mes\server`:

```powershell
npx jest --runInBand process-dynamic.service.spec.ts
```

Expected: PASS, including validation against saved draft data when submit only carries quality fields.

- [ ] **Step 3: Build the frontend**

```powershell
npm run build
```

Expected: `vue-tsc -b` and Vite build complete successfully; existing chunk-size warning is acceptable.

- [ ] **Step 4: Restart the frontend and verify the local entry point**

Confirm `http://127.0.0.1:3002/` returns HTTP 200, then refresh the batch detail page and open “化成分容” from the drawer.

- [ ] **Step 5: Commit the implementation**

```powershell
git add web/src/views/processes/FormationGradingPage.vue web/src/views/processes/FormationGradingPage.spec.ts web/src/views/processes/ProcessFormPage.vue web/src/views/batch/BatchDetailPage.vue web/src/views/processes/ProcessHubPage.vue web/src/router/index.ts web/src/views/processes/useProcess.spec.ts
git commit -m "feat: redesign formation grading input drawer"
```
