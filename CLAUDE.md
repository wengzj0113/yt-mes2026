# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YT-MES is a battery cell (电芯) production traceability Manufacturing Execution System. It tracks individual cells through 13 manufacturing processes with batch management, quality checks, material tracking, and barcode traceability.

## Architecture

```
├── server/         # NestJS API (port 3001)
│   └── src/
│       ├── auth/              # JWT login/refresh
│       ├── batch/             # Batch CRUD + status log
│       ├── cells/             # Cell barcode management
│       ├── common/            # Shared: decorators, enums, filters, interceptors
│       ├── config/            # TypeORM data source config
│       ├── dashboard/         # Dashboard aggregation
│       ├── department/        # Department CRUD
│       ├── equipment/         # Equipment CRUD
│       ├── health/            # Health check endpoint
│       ├── master-data/       # Process dictionary
│       ├── material/          # Material warehouse
│       ├── processes/         # 13 process modules (uniform pattern)
│       │   ├── batching/
│       │   ├── coating/
│       │   ├── roller-pressing/
│       │   ├── slitting/
│       │   ├── sorting/
│       │   ├── electrode/
│       │   ├── winding/
│       │   ├── assembly/
│       │   ├── baking/
│       │   ├── injection/
│       │   ├── wrapping/
│       │   ├── formation/
│       │   ├── grading/
│       │   └── process-status/  # Aggregated status queries
│       ├── quality/           # Quality check records
│       ├── seed/              # DB seeder
│       └── user/              # User management
├── web/             # Vue 3 + Vite frontend (port 5173, dev port 3000)
│   └── src/
│       ├── api/              # Axios HTTP client + per-module API functions
│       ├── stores/           # Pinia stores (auth)
│       ├── router/           # Vue Router config
│       ├── types/            # Shared TypeScript interfaces
│       └── views/            # Pages organized by domain
│           ├── batch/
│           ├── cells/
│           ├── dashboard/
│           ├── layout/
│           ├── login/
│           ├── master-data/
│           ├── material/
│           ├── processes/
│           ├── quality/
│           └── system/
├── client/          # Legacy Vue 3 frontend (login + dashboard only)
└── doc/             # SQL scripts, user manuals, deployment guide
```

## Key Architecture Patterns

### Server — NestJS Modular Architecture

- **Database**: SQL Server via TypeORM, snake_case naming strategy, `synchronize: true` only in development
- **All API responses** wrapped in `{ success, data, message, meta? }` envelope (see `common/interceptors/response.interceptor.ts`)
- **Global exception filter** catches all errors, returns structured `{ success: false, data: null, message, error? }`
- **JWT auth** with access + refresh token flow; `@Public()` decorator for public endpoints
- **Each process module** is identical in structure:
  - Entity extends `{ id, batchNo, recordStatus, isDraft, ...processFields, createdBy, createdAt, updatedBy, updatedAt }`
  - Two DTOs: `create-draft.dto.ts` (operator fields, class-validator decorated), `submit-quality.dto.ts` (QC fields)
  - Service methods: `createDraft` → `submitQuality` → `findByBatchNo` → `voidRecord`
  - On submit-quality, synchronously creates a `QualityCheck` record
  - Modules are self-contained: entity, DTOs, service, controller, module

### Web — Vue 3 + Pinia + Element Plus

- **State management**: Pinia composition API stores (`defineStore` with setup function)
- **API client**: Axios instance with interceptors for JWT injection, 401 auto-refresh (queues pending requests during refresh), and error toast via `ElMessage`
- **Process Hub**: Centralized UI (`ProcessHubPage.vue`) shows all 13 process statuses for a batch; clicking a process opens its form in a drawer via dynamic component
- **Reusable process composable** (`useProcess.ts`): generic `useProcessApi(basePath)` and `useProcessForm(basePath, draftFields, qualityFields)` — every process page instantiates this
- **Tests**: Vitest (`src/**/*.spec.ts`) with happy-dom, Playwright E2E (`web/e2e/`)
- **Routes prefixed with `/api` proxied** to backend at `localhost:3001`

## Database (SQL Server)

- Core tables: `batch` (PK = batch_no), `sys_user`, `sys_department`, `sys_equipment`, `process_dictionary`, `batch_status_log`
- Each process has a record table: `batching_record`, `coating_record`, etc. (see `doc/create-database.sql`)
- All `*_record` tables use `is_draft`, `record_status`, `created_by`, `updated_by` timestamp columns

## Development Commands

### Backend (server/)
```bash
cd server
npm run start:dev     # Watch mode on port 3001
npm run build         # Production build
npm run seed          # Seed initial data (users, departments, equipment, process dictionary)
npm run migration:generate  # Generate TypeORM migration
npm run migration:run       # Run pending migrations
```

### Frontend (web/)
```bash
cd web
npm run dev           # Vite dev server on port 3000 (proxies /api to :3001)
npm run build         # TypeScript check + Vite build
npm run test          # Vitest unit tests
npm run test:watch    # Vitest watch mode
```

### Full Stack (start-dev.bat)
```bash
# Starts server on :3001, waits for health check, then starts web on :5173
.\start-dev.bat
```

### E2E Tests (web/)
```bash
cd web
npx playwright test --config=e2e/playwright.config.ts
```

### Legacy Client (client/)
```bash
cd client
npm run dev           # Vite on port 5173, proxies /api to :3000
npm run build         # vue-tsc + vite build
```

## Process Directory (13 processes, in order)
1. `batching` — 配料
2. `coating` — 涂布
3. `roller-pressing` — 辊压
4. `slitting` — 分切
5. `electrode` — 制片
6. `winding` — 卷绕
7. `assembly` — 装配
8. `baking` — 烘烤
9. `injection` — 注液
10. `wrapping` — 顶封
11. `formation` — 化成
12. `grading` — 分容
13. `sorting` — 分选

## Environment Variables (server/.env)
| Key | Description |
|-----|-------------|
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | SQL Server connection |
| `PORT` | API port (default: 3001) |
| `FACTORY_CODE` | Factory prefix for batch number generation |
| `DEFAULT_USER_PASSWORD` | Password for seed users |
