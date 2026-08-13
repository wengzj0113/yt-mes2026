# 现场扫码录入工序状态更新问题修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复现场扫码录入页面（ProcessHubPage）和批次详情页面（BatchDetailPage）在工序保存或提交后，工序模块状态未及时更新或显示为“待录入”的问题。

**Architecture:** 
1. 修复抽屉关闭时未触发状态刷新的问题：将 `el-drawer` 的关闭事件统一绑定到 `@closed` 上，确保无论是点击组件内的“返回”按钮还是点击遮罩层/右上角关闭按钮，都能触发状态刷新。
2. 修复工序状态映射不全的问题：在前端支持后端返回的 `pending_quality`（待质检）、`quality_passed`（已完成/质检通过）、`quality_failed`（质检不合格）状态，并为其配置对应的文字和样式。

**Tech Stack:** Vue 3, Element Plus, TypeScript

---

### Task 1: 修复现场扫码录入页面 (ProcessHubPage.vue)

**Files:**
- Modify: `web/src/views/processes/ProcessHubPage.vue`

- [ ] **Step 1: 修改 el-drawer 事件绑定**
  将 `el-drawer` 的 `@closed` 绑定到 `handleDrawerClose`，并将内部组件的 `@close` 改为 `drawerVisible = false`。
  
  修改前：
  ```html
  <!-- Drawer -->
  <el-drawer v-model="drawerVisible" :title="`${currentProcess?.processName} - 数据录入`" size="600px" destroy-on-close>
    <component :is="currentComponent" :batchNo="batchInfo?.batchNo" @close="handleDrawerClose" />
  </el-drawer>
  ```
  
  修改后：
  ```html
  <!-- Drawer -->
  <el-drawer 
    v-model="drawerVisible" 
    :title="`${currentProcess?.processName} - 数据录入`" 
    size="600px" 
    destroy-on-close
    @closed="handleDrawerClose"
  >
    <component :is="currentComponent" :batchNo="batchInfo?.batchNo" @close="drawerVisible = false" />
  </el-drawer>
  ```

- [ ] **Step 2: 完善工序状态映射逻辑**
  修改 `getProcessStatus` 和 `getProcessStatusText`，支持 `pending_quality`、`quality_passed`、`quality_failed` 状态。
  
  修改前：
  ```typescript
  function getProcessStatus(key: string) {
    return `status-${getProcessStatusObj(key)}`;
  }

  function getProcessStatusText(key: string) {
    const status = getProcessStatusObj(key) as 'not_entered' | 'draft' | 'submitted' | 'voided';
    return { not_entered: '待录入', draft: '草稿中', submitted: '已完成', voided: '已作废' }[status] || '待录入';
  }
  ```
  
  修改后：
  ```typescript
  function getProcessStatus(key: string) {
    const status = getProcessStatusObj(key);
    if (status === 'pending_quality' || status === 'quality_passed') {
      return 'status-submitted';
    }
    if (status === 'quality_failed') {
      return 'status-failed';
    }
    return `status-${status}`;
  }

  function getProcessStatusText(key: string) {
    const status = getProcessStatusObj(key);
    const map: Record<string, string> = {
      not_entered: '待录入',
      draft: '草稿中',
      pending_quality: '待质检',
      quality_passed: '已完成',
      quality_failed: '质检不合格',
      voided: '已作废'
    };
    return map[status] || '待录入';
  }
  ```

- [ ] **Step 3: 添加质检不合格样式**
  在 `<style scoped>` 中添加 `.status-failed` 样式。
  
  添加代码：
  ```css
  .status-failed { background-color: #fef0f0; border-left: 4px solid #f56c6c; color: #f56c6c; }
  ```

---

### Task 2: 修复批次详情页面 (BatchDetailPage.vue)

**Files:**
- Modify: `web/src/views/batch/BatchDetailPage.vue`

- [ ] **Step 1: 修改 el-drawer 事件绑定**
  将 `el-drawer` 的 `@closed` 绑定到 `closeDrawer`，并将内部组件的 `@close` 改为 `drawerVisible = false`。
  
  修改前：
  ```html
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    size="600px"
    destroy-on-close
  >
    <component
      :is="currentComponent"
      :batchNo="batch?.batchNo"
      @close="closeDrawer"
    />
  </el-drawer>
  ```
  
  修改后：
  ```html
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    size="600px"
    destroy-on-close
    @closed="closeDrawer"
  >
    <component
      :is="currentComponent"
      :batchNo="batch?.batchNo"
      @close="drawerVisible = false"
    />
  </el-drawer>
  ```

- [ ] **Step 2: 完善工序状态映射逻辑**
  修改 `statusTag` 和 `statusText`，支持 `pending_quality`、`quality_passed`、`quality_failed` 状态。
  
  修改前：
  ```typescript
  function statusTag(status: string): string {
    return { not_entered: 'info', draft: 'warning', submitted: 'success', voided: 'danger' }[status] || 'info'
  }

  function statusText(status: string): string {
    return { not_entered: '待录入', draft: '录入完成', submitted: '已提交', voided: '已作废' }[status] || status
  }
  ```
  
  修改后：
  ```typescript
  function statusTag(status: string): string {
    const map: Record<string, string> = {
      not_entered: 'info',
      draft: 'warning',
      pending_quality: 'primary',
      quality_passed: 'success',
      quality_failed: 'danger',
      voided: 'danger'
    };
    return map[status] || 'info';
  }

  function statusText(status: string): string {
    const map: Record<string, string> = {
      not_entered: '待录入',
      draft: '草稿中',
      pending_quality: '待质检',
      quality_passed: '已完成',
      quality_failed: '质检不合格',
      voided: '已作废'
    };
    return map[status] || status;
  }
  ```

---

### Verification Steps

- [ ] **Step 1: 运行前端类型检查和编译**
  在 `web` 目录下运行 `npm run typecheck` 或 `npm run build` 确保没有 TypeScript 编译错误。
