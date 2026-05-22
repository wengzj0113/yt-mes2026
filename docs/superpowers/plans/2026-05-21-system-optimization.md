# YT-MES 系统架构优化方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升系统的原子性、查询性能和可观测性，通过事务处理、索引优化和全局日志拦截器完善核心架构。

**Architecture:** 
1. 引入 TypeORM 事务装饰器或手动管理事务，确保工序提交与质检记录生成的原子性。
2. 在所有业务记录表的 `batchNo` 字段上添加数据库索引，优化高频聚合查询。
3. 实现全局 `LoggingInterceptor`，实时记录 API 调用耗时和关键上下文。

**Tech Stack:** NestJS, TypeORM, MSSQL, RxJS

---

### Task 1: 实现事务处理 (Atomicity)

**Files:**
- Modify: `server/src/processes/batching/batching.service.ts`
- Modify: `server/src/processes/coating/coating.service.ts`
- (以及其它工序 Service...)

- [ ] **Step 1: 在 BatchingService.submitQuality 中引入事务**
- [ ] **Step 2: 在 CoatingService.submitQuality 中引入事务**

### Task 2: 数据库索引优化 (Performance)

**Files:**
- Modify: `server/src/processes/batching/batching-record.entity.ts`
- Modify: `server/src/processes/coating/coating-record.entity.ts`
- (以及其它工序 Entity...)

- [ ] **Step 1: 为所有工序记录表的 batchNo 字段添加 @Index()**

### Task 3: 可观测性增强 (Observability)

**Files:**
- Create: `server/src/common/interceptors/logging.interceptor.ts`
- Modify: `server/src/main.ts`

- [ ] **Step 1: 创建 LoggingInterceptor**
- [ ] **Step 2: 在 main.ts 中注册为全局拦截器**

### Task 4: 代码冗余优化 (DRY)

**Files:**
- Create: `server/src/common/utils/process-record.util.ts` (完善)
- Modify: 各工序 Service

- [ ] **Step 1: 提取通用的草稿保存和作废逻辑到工具类或基类**
