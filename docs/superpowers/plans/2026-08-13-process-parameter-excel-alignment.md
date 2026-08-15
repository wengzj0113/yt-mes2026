# Excel Process Parameter Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ordinary MES process field definitions and process ordering match the approved Excel baseline, including three new processes after assembly, without deleting historical batch parameter data.

**Architecture:** Add a single typed baseline module containing the Excel-derived process order and field definitions. Use it from an idempotent TypeORM migration for existing databases and from seed data for new environments. Keep the existing dynamic form and OCV-specific paths intact, while updating any hard-coded process component/status maps to recognize the three new process codes.

**Tech Stack:** NestJS, TypeORM migrations, TypeScript, Vue 3, Vitest/Jest, bundled Node tooling.

---

### Task 1: Establish the Excel baseline as typed application data

**Files:**
- Create: `server/src/master-data/process-baseline.ts`
- Create: `server/src/master-data/process-baseline.spec.ts`
- Test source: `D:\traecode\YT-mes\doc\云通MES系统  工序控制参数列表260813.xlsx`

- [ ] **Step 1: Write the failing baseline test**

  Add tests that assert the approved 14 ordinary process names/order, the three new process codes, no fields for `设备信息`, preservation of `操作员`, assignment of the OCV rows to `sorting`, and retention of封口’s化成/分容 fields.

- [ ] **Step 2: Run the focused test and verify it fails for the missing module**

  Run `npm --prefix server test -- --runInBand src/master-data/process-baseline.spec.ts`.
  Expected: FAIL because `server/src/master-data/process-baseline.ts` does not exist.

- [ ] **Step 3: Implement the typed Excel-derived baseline**

  Export `PROCESS_BASELINE` with stable process codes, names, sort orders, and `fieldDefinitions` compatible with the existing `ProcessFormPage` `FormField` shape. Use deterministic camelCase keys; disambiguate duplicate Excel labels by group/unit; use numeric fields for numeric formats and text fields for text/appearance/operator fields.

- [ ] **Step 4: Run the focused test and verify it passes**

  Run the same command and expect all baseline assertions to pass.

### Task 2: Update seed data and add an idempotent migration

**Files:**
- Create: `server/src/migrations/1781860000000-AlignProcessDictionaryWithExcel.ts`
- Modify: `server/src/seed/seed.service.ts`
- Modify: `server/src/data-source.ts` if migration discovery requires it
- Test: `server/src/migrations/1781860000000-AlignProcessDictionaryWithExcel.spec.ts`

- [ ] **Step 1: Write migration behavior tests**

  Test that existing rows with matching process codes are updated in place, new `casing`, `integrated-machine`, and `laser-welding` rows are inserted once, field definitions replace obsolete ordinary fields, and unrelated historical tables/records are not deleted.

- [ ] **Step 2: Run the migration test and verify the expected failure**

  Run `npm --prefix server test -- --runInBand src/migrations/1781860000000-AlignProcessDictionaryWithExcel.spec.ts`.
  Expected: FAIL because the migration and shared baseline are not implemented.

- [ ] **Step 3: Implement the migration and seed integration**

  Implement an idempotent `up` that upserts by `process_code`, updates name/order/active/field definitions, and never deletes process rows or batch parameter records. Implement `down` conservatively so it does not destroy user data. Refactor `seedProcessDictionary()` to upsert the same baseline rather than returning early solely because any row exists.

- [ ] **Step 4: Run focused server tests**

  Run the migration test and `npm --prefix server test -- --runInBand src/process-parameters/process-parameter.service.spec.ts`; expect both to pass.

### Task 3: Register the three new process entries in frontend navigation and status flows

**Files:**
- Modify: `web/src/views/processes/ProcessHubPage.vue`
- Modify: `web/src/views/batch/BatchDetailPage.vue`
- Modify: `web/src/api/mock.ts` only if its process dictionary/status fixtures are used by affected tests
- Create or modify focused tests beside the affected components

- [ ] **Step 1: Add failing component assertions**

  Assert that `casing`, `integrated-machine`, and `laser-welding` resolve to dynamic process-form entry components and appear after `assembly` when the API returns the approved dictionary order.

- [ ] **Step 2: Run the focused frontend tests and verify failure**

  Run `npm --prefix web test -- --run src/views/processes/ProcessHubPage...` with the exact affected spec path; expect missing component-map entries/order behavior to fail.

- [ ] **Step 3: Implement the minimal component-map and fixture changes**

  Route the three new ordinary processes through the existing `ProcessFormPage` wrapper pattern, using the dictionary’s dynamic `fieldDefinitions`; remove conflicting hard-coded ordinary-process order lists where present.

- [ ] **Step 4: Run focused frontend tests and verify pass**

  Run the exact focused Vitest command again and confirm all affected tests pass.

### Task 4: Validate Excel parity, compatibility, and production builds

**Files:**
- Create: `server/scripts/verify-process-baseline.ts` or an equivalent checked-in validation test if project conventions require it
- Modify: focused tests only when a verified regression is found

- [ ] **Step 1: Add parity checks**

  Verify every Excel parameter row maps to exactly one ordinary process field, excluding section headers, and every ordinary field definition is sourced from Excel; report duplicate keys, unmapped rows, and unit/type mismatches.

- [ ] **Step 2: Run the full server test suite**

  Run `npm --prefix server test -- --runInBand` and record the exit code and failures.

- [ ] **Step 3: Run the full frontend test suite and type/build checks**

  Run `npm --prefix web test -- --run`, `npm --prefix web run type-check`, and `npm --prefix web run build` using the project’s actual scripts.

- [ ] **Step 4: Inspect the final diff and migration scope**

  Run `git diff --check`, `git status --short`, and inspect the migration/baseline diff to confirm no historical-data delete/update statements exist outside process dictionary definitions.

- [ ] **Step 5: Commit the implementation**

  Commit only the implementation files and tests on `codex/excel-process-parameters` with message `feat: align process parameters with Excel baseline`.
