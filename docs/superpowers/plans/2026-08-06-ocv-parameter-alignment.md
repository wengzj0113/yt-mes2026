# OCV1/OCV2 Parameter Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the OCV1/OCV2 per-cell entry page in the batch drawer with a right-drawer parameter editor containing exactly the five configured process parameters.

**Architecture:** Add a dedicated batch process-parameter table and generic OCV parameter API so the existing per-cell OCV upload tables and endpoints remain unchanged. Reuse the existing `ProcessFormPage` renderer and the batch detail drawer flow for OCV1 and OCV2.

**Tech Stack:** NestJS, TypeORM, SQL Server migrations, Vue 3, TypeScript, Element Plus, Vitest.

---

### Task 1: Add the backend parameter model and API

**Files:**
- Create: `server/src/process-parameters/process-parameter.entity.ts`
- Create: `server/src/process-parameters/dto/save-process-parameter.dto.ts`
- Create: `server/src/process-parameters/process-parameter.service.ts`
- Create: `server/src/process-parameters/process-parameter.controller.ts`
- Create: `server/src/process-parameters/process-parameter.module.ts`
- Create: `server/src/process-parameters/process-parameter.service.spec.ts`
- Create: `server/src/migrations/1781830000000-CreateProcessParameterTable.ts`
- Modify: `server/src/app.module.ts`

- [ ] Write service tests for create/update-by-batch-and-process, lookup, and range validation.
- [ ] Run `cd server; npx jest src/process-parameters/process-parameter.service.spec.ts --runInBand` and verify the new tests fail because the module does not exist.
- [ ] Implement a `process_parameter` entity keyed uniquely by `batchNo + processCode`, with the five parameter values, audit fields, and timestamps.
- [ ] Implement `GET /api/process-parameters/:processCode/:batchNo` and `POST /api/process-parameters/:processCode/draft` for `ocv1` and `ocv2` only.
- [ ] Validate required strings, numeric ranges, and `min <= max`; upsert by `(batchNo, processCode)`.
- [ ] Register the module and migration.
- [ ] Run the focused service test and the existing backend test suite.

### Task 2: Add the shared OCV parameter form and replace both pages

**Files:**
- Create: `web/src/views/processes/OcvParameterPage.vue`
- Modify: `web/src/views/processes/Ocv1Page.vue`
- Modify: `web/src/views/processes/Ocv2Page.vue`
- Modify: `web/src/views/processes/OcvParameterPage.spec.ts`

- [ ] Add a failing component test asserting both modes render exactly `equipmentCode`, `ocvVoltageRange`, `irRange`, `capacityRange`, and `operatorName`, with no barcode, test time, K value, or measurement fields.
- [ ] Run `cd web; npx vitest run src/views/processes/OcvParameterPage.spec.ts` and verify the test fails because the component is missing or still points to the test-entry page.
- [ ] Implement `OcvParameterPage` using `ProcessFormPage`, with `basePath` `processes/ocv1` or `processes/ocv2`, the five shared fields, empty quality fields, and current-user operator default.
- [ ] Make `Ocv1Page` and `Ocv2Page` thin wrappers around `OcvParameterPage`.
- [ ] Keep `ProcessHubPage` as the owner of the existing 600px right drawer so OCV pages open and close exactly like other process pages.
- [ ] Run the focused frontend component tests.

### Task 3: Verify drawer integration and API wiring

**Files:**
- Modify: `web/src/api/index.ts` only if the generic process API needs no changes; otherwise no API file change is expected.
- Modify: `web/src/views/processes/ProcessHubPage.ocv-entry.spec.ts`

- [ ] Add or update an integration test asserting the OCV cards resolve to the parameter page components and render inside the same drawer path.
- [ ] Run the focused integration test and verify it passes.
- [ ] Start/reload the backend so the new routes are active and verify GET/POST route behavior against a test batch or mocked service boundary.

### Task 4: Full verification and cleanup

**Files:**
- Modify only files needed to resolve verified test failures.

- [ ] Run backend unit tests, frontend unit tests, type checks, and the relevant E2E test command.
- [ ] Run `git diff --check` and inspect the final diff for accidental changes to existing OCV upload behavior.
- [ ] Confirm the browser page opens from the batch process card in a right-side drawer and shows only the five parameter fields.
- [ ] Record the verification commands and results in the final handoff.
