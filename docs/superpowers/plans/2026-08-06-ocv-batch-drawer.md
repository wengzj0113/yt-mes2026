# OCV Batch Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open OCV1 and OCV2 from batch-detail process cards in the same right-side drawer interaction used by sorting.

**Architecture:** Reuse the existing `BatchDetailPage` drawer and close-refresh lifecycle. Add the two OCV page components to the batch-detail component map; no new drawer or route behavior is needed.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest, Vue Test Utils.

---

### Task 1: Add regression coverage for OCV batch-detail drawer entries

**Files:**
- Modify: `web/src/views/batch/BatchDetailPage.spec.ts`

- [ ] **Step 1: Write a failing test**

Add OCV1 and OCV2 component mocks and assert that clicking each process card renders the matching component inside the existing drawer.

- [ ] **Step 2: Run the focused test and verify it fails**

Run `npx vitest run src/views/batch/BatchDetailPage.spec.ts` from `web`. Expected failure: OCV process cards are not mapped to components.

### Task 2: Map OCV1 and OCV2 into the existing drawer

**Files:**
- Modify: `web/src/views/batch/BatchDetailPage.vue`

- [ ] **Step 1: Add OCV imports and component-map entries**

Import `Ocv1Page` and `Ocv2Page`, then map `ocv1` and `ocv2` alongside `sorting` in `componentMap`. Keep the existing 600px drawer, `destroy-on-close`, child `close` event, and `@closed="closeDrawer"` unchanged.

- [ ] **Step 2: Run the focused test and verify it passes**

Run `npx vitest run src/views/batch/BatchDetailPage.spec.ts` from `web`. Expected: all tests pass.

### Task 3: Verify the UI behavior and build

**Files:**
- Review: `web/src/views/batch/BatchDetailPage.vue`
- Review: `web/src/views/processes/SortingPage.vue`

- [ ] **Step 1: Run focused regression tests**

Run `npx vitest run src/views/batch/BatchDetailPage.spec.ts src/views/processes/ProcessHubPage.ocv-entry.spec.ts` from `web`.

- [ ] **Step 2: Run the frontend production build**

Run `npm run build` from `web` and confirm exit code 0.

- [ ] **Step 3: Confirm requirements against the implementation**

Confirm OCV1/OCV2 use the same drawer size, title binding, close event, save-triggered close, and closed-hook status refresh as sorting.
