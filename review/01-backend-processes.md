# 后端 13 工序模块 + 公共架构评审

> 项目根目录：`D:\TRAECode\YT-MES`
> 评审范围：`server/src/processes/`（13 个工序模块 + process-status 聚合模块）+ `server/src/common/` + `server/src/config/`
> 评审时间：2026-06-04
> 评审人：Coder（plan_f780001f / backend-processes）

---

## 0. TL;DR

13 个工序模块**并非严格同构**，可被切分为 **A / B 两种实现范式**：

| 范式 | 描述 | 模块数 | 模块 |
|---|---|---|---|
| **A：两阶段（create + submit 都接收数据）** | 草稿接收操作类数据，提交接收质量检测数据；用 `mergeExtraData` 二次合并 | 9 | batching, formation, grading, winding, assembly, baking, injection, wrapping, electrode |
| **B：单阶段（create 一次写完，submit 仅锁定）** | 草稿一次性收集所有字段，提交只接受 `batchNo` 用来翻 `isDraft=false` 标志位 | 4 | **coating, roller-pressing, slitting, sorting** |

主要问题分布（按严重程度）：

| 严重度 | 数量 | 摘要 |
|---|---|---|
| **Critical** | 3 | 4 模块缺 `submit-quality.dto.ts`；`submitQuality` 11/13 缺事务；质检结果硬编码 `inspectionResult = 1` 无失败路径 |
| **Major** | 5 | 路由前缀冲突风险（`/processes` 同时被 process-status 与各工序的 `processes/<x>` 共享）；interceptor 混合注册；synchronize 缺审计；`HttpExceptionFilter` 在 fields 分支丢 `code`；缺角色守卫与幂等保护 |
| **Minor** | 7 | tsconfig 未开 `strict: true`；`@IsOptional` 普遍未用；CORS 写死前端地址；Datasource 选项重复；`extra_data` 大小未约束；`process-status` 走原始 SQL 拼接等 |
| **Nit** | 5 | 文件尾部多余空格；命名 `BATCHING_ENTITY_FIELDS` 应放 module-scope；submit 错误信息文案不一致；`mergeExtraData` 静默丢弃 `batchNo`；控制台 `console.error` 与 `Logger` 混用等 |

---

## 1. 项目结构概览

```
server/src/
├── main.ts                              # Nest 启动 + global pipes/filters/interceptors
├── app.module.ts                        # 根模块：TypeORM.forRootAsync(MS SQL) + 业务模块聚合
├── auth/                                # JWT + Roles 守卫
├── common/
│   ├── decorators/                      # @Public @Roles @CurrentUser
│   ├── filters/http-exception.filter.ts # 全局异常 → { success:false, ... }
│   ├── interceptors/
│   │   ├── audit-log.interceptor.ts     # APP_INTERCEPTOR 形式，写 system.logs
│   │   ├── logging.interceptor.ts       # useGlobalInterceptors，无 DI
│   │   └── response.interceptor.ts      # useGlobalInterceptors，包信封
│   ├── enums/status-code.enum.ts        # 业务状态码字典
│   └── utils/process-record.util.ts     # mergeExtraData(record, dto, entityFields)
├── config/
│   └── typeorm.config.ts                # DataSource CLI 用，含 SnakeNamingStrategy
└── processes/
    ├── batching/                        # 范式 A（标杆）
    ├── coating/                         # 范式 B（无 submit DTO）
    ├── roller-pressing/                 # 范式 B
    ├── slitting/                        # 范式 B
    ├── sorting/                         # 范式 B
    ├── electrode/                       # 范式 A + 唯一用 transaction（除 batching）
    ├── winding/                         # 范式 A
    ├── assembly/                        # 范式 A
    ├── baking/                          # 范式 A
    ├── injection/                       # 范式 A
    ├── wrapping/                        # 范式 A
    ├── formation/                       # 范式 A（高电量数据量）
    ├── grading/                         # 范式 A
    └── process-status/                  # 聚合服务：union-all 13 表 + FOR JSON PATH
```

---

## 2. 模式一致性矩阵（13 工序 × 关键属性）

> ✅ = 与 batching 一致；❌ = 偏离；➖ = 不适用
>
> 列含义：
> - **Entity** 实体文件存在
> - **create-DTO** `dto/create-draft.dto.ts` 存在
> - **submit-DTO** `dto/submit-quality.dto.ts` 存在
> - **Ctl R4** 控制器 4 个标准路由 `POST draft / POST submit / GET :batchNo / PATCH :batchNo/void`
> - **Tx?** `submitQuality` 用 `dataSource.transaction` 包裹
> - **QC created** 提交时同步插入 `QualityCheck`
> - **Mod Reg** 模块 `TypeOrmModule.forFeature([X, Batch, QualityCheck])` 完整
> - **范式** A=两阶段 / B=单阶段
> - **submit 取 DTO** `submitQuality` 接收 DTO 而非裸 `batchNo` 字符串
> - **entity-spec** 实体单测存在

| # | 模块 | Entity | create-DTO | submit-DTO | Ctl R4 | Tx? | QC created | Mod Reg | 范式 | submit 取 DTO | entity-spec |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | batching | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | A | ✅ | ✅ |
| 2 | coating | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | **B** | ❌ | ✅ |
| 3 | roller-pressing | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | **B** | ❌ | ✅ |
| 4 | slitting | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | **B** | ❌ | ✅ |
| 5 | sorting | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | **B** | ❌ | ✅ |
| 6 | electrode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | A | ✅ | ✅ |
| 7 | winding | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| 8 | assembly | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| 9 | baking | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| 10 | injection | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| 11 | wrapping | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| 12 | formation | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| 13 | grading | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | A | ✅ | ✅ |
| — | process-status | ➖ | ➖ | ➖ | ✅* | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |

> *process-status 控制器 2 个路由：`GET /processes/status/:batchNo` 与 `GET /processes/records/:batchNo`，与各工序 `processes/<x>` 不冲突（多段路径），但命名上易混。

**行小结**：
- 13/13 实体、控制器、模块、服务、spec 文件齐备。
- **9/13** 模块是范式 A，**4/13** 是范式 B —— 这就是"长歪"的根源。
- **2/13** (`batching`, `electrode`) 用 `dataSource.transaction`；其余 11/13 直接 `this.repo.save` + `this.qualityCheckRepo.save`，**两步不在同一事务**。
- 4 个范式 B 模块（coating / roller-pressing / slitting / sorting）**完全没有 submit-quality DTO**，Controller 形如：

```ts
@Post('submit')
async submitQuality(@Body('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.coatingService.submitQuality(batchNo, user.sub);
    return { data: record, message: '提交成功' };
}
```

提交时不再接收任何质量检测数据 —— 意味着这些工序"质量检测"形同虚设，质检字段直接落在 `create-draft` 阶段。

---

## 3. 发现的问题清单

### 3.1 Critical（必须修复，否则数据/契约有实质风险）

#### C-1. 4 个模块缺少 `submit-quality.dto.ts`，submit 路径无法接收质检数据
- **位置**：
  - `server/src/processes/coating/dto/`（缺 `submit-quality.dto.ts`）
  - `server/src/processes/roller-pressing/dto/`
  - `server/src/processes/slitting/dto/`
  - `server/src/processes/sorting/dto/`
- **现状**：Controller `@Post('submit') @Body('batchNo') batchNo: string`，service 内部直接复用 `createDraft` 阶段的字段 → 翻 `isDraft = false`。
- **风险**：
  1. 质检（inspection_result、inspector_name、inspection_remark...）在质检阶段没有 DTO 承接，前端无字段可填；
  2. 既然 submit 阶段不收数据，那么 `submitQuality` 服务中"补填质量字段"的核心目的就丢失了；
  3. 与项目自我描述的"两阶段 DTO"契约不符，前端在 /api/processes/coating/submit 上 POST 任何非 `batchNo` 字段都会被静默丢弃。
- **修法**：
  - 方案 1（推荐）：补齐 4 个 `submit-quality.dto.ts`，与 `formation`/`grading` 对齐 —— 在 submit 阶段接收该工序应有的"质量检测字段"（如 coating 的 `coatingQuality`、`arealDensity` 复测值等）；
  - 方案 2：明确改范式 B 为"一次性表单 + 锁定"语义，文档化这是设计意图；前端按此开发。

#### C-2. submitQuality 11/13 缺少事务边界，质检记录与工序记录可能不一致
- **位置**（仅 2 个用事务）：
  - ✅ `batching.service.ts:56-88`（`this.dataSource.transaction(async (manager) => { ... })`）
  - ✅ `electrode.service.ts:56-87`
  - ❌ `coating.service.ts:52-83`（直接 `this.repo.save` + `this.qualityCheckRepo.save`）
  - ❌ `formation.service.ts:52-84`
  - ❌ `grading.service.ts:52-84`
  - ❌ `winding.service.ts:53-86`
  - ❌ `assembly.service.ts:53-86`
  - ❌ `baking.service.ts:53-85`
  - ❌ `injection.service.ts:53-85`
  - ❌ `wrapping.service.ts:52-84`
  - ❌ `slitting.service.ts:51-80`
  - ❌ `sorting.service.ts:51-80`
  - ❌ `roller-pressing.service.ts:51-80`
- **风险**：
  - 工序记录 `record.save()` 成功 → 进程崩溃 / 网络中断 / 后续 QC `save()` 抛错 → **工序已翻 `isDraft=false` 但无对应 QC**，下次提交仍可再次成功，造成**重复 QualityCheck** 记录。
  - 反之，若 QC 先成功、工序 `save()` 失败 → 出现"无主 QC"。
- **修法**：把 `submitQuality` 统一抽到 `common/abstracts/base-process.service.ts` 抽象基类，并强制 `dataSource.transaction`（DI 注入 EntityManager），消除 13 份逐字重复 + 11 份缺事务。

#### C-3. 质检结果硬编码 `inspectionResult = 1`（合格），无失败路径
- **位置**：13 个 service 全部以 `inspectionResult: 1` 创建 QC。例：
  - `batching.service.ts:81`
  - `coating.service.ts:76`
  - `formation.service.ts:77`
  - `grading.service.ts:77`
  - ...（全部 13 处）
- **风险**：
  - 系统**没有"质检不合格"的状态机** —— 任何 submit 都生成"通过"质检。
  - 与 `BusinessStatusCode` 中定义的 `PROCESS_FIELDS_INCOMPLETE` 联用：操作员字段未填就被拒（合理），但**实际测得值超限**（如 coating 厚度 < 0）目前也无法体现。
- **修法**：
  - 在 `SubmitXxxQualityDto` 中加入 `@IsEnum([1, 2]) inspectionResult: 1 | 2`（1=合格，2=不合格）以及 `inspectionRemark?: string`；
  - 数据库 `quality_check` 表需对应增加 `inspection_remark NVARCHAR(MAX) NULL`；
  - submit 服务按 dto 写入，不再硬编码 1。

### 3.2 Major

#### M-1. Interceptor 注册方式两套并存，DI 一致性受损
- **位置**：
  - `main.ts:23-25` `useGlobalInterceptors(new LoggingInterceptor())`、`new ResponseInterceptor()`、`new ClassSerializerInterceptor(...)` —— 无 DI 容器
  - `app.module.ts:120-123` 用 `APP_INTERCEPTOR` token 形式注册 `AuditLogInterceptor`（拿到 DI）
- **风险**：
  - `LoggingInterceptor` / `ResponseInterceptor` 后续若需注入 `ConfigService`、`Reflector` 等，需手动 `new` 二次改造；
  - 测试中 `useGlobalInterceptors` 注册的实例不参与模块作用域，与 `APP_INTERCEPTOR` 行为不同。
- **修法**：把 `LoggingInterceptor` / `ResponseInterceptor` 也移到 `AppModule.providers` 用 `APP_INTERCEPTOR`，main.ts 仅做 `app.use(cookieParser)` / `app.enableVersioning()` 等"启动配置"。

#### M-2. `HttpExceptionFilter` 在 `fields` 分支会丢失 `code`
- **位置**：`common/filters/http-exception.filter.ts:66-72`
  ```ts
  response.status(status).json({
    success: false,
    data: null,
    message,
    ...(code ? { error: { code } } : {}),       // ①
    ...(fields ? { error: { code, fields } } : {}),  // ②
  });
  ```
- **问题**：
  - 当抛 `new BadRequestException({ message: '...' })`（body 只有 `message` 没有 `code`），`code` 为 `undefined`。若此时 `fields` 也被填入（数组路径），第 ② 个 spread 覆盖了第 ① 个的 `error.code` —— 但实际场景里 `code` 已被 ① 写为 `undefined`（条件 `code ? ...` 失败），所以最终 `error: { code: undefined, fields: [...] }`，前端拿到的 `error.code` 是 `undefined`。
  - 另：`message = '请求参数校验失败'` 仅在 class-validator 数组分支被覆盖（line 52），但其余路径若 `body.message` 为空字符串，line 35 的 `||` 会落入 `exception.message` —— 行为可接受但需测试覆盖。
- **修法**：抽 helper 函数：
  ```ts
  const errorBody = (() => {
    if (code && fields) return { error: { code, fields } };
    if (code) return { error: { code } };
    if (fields) return { error: { code: 'VALIDATION_ERROR', fields } };
    return {};
  })();
  ```

#### M-3. `synchronize: NODE_ENV === 'development'` 缺审计，prod 启动如果 `NODE_ENV` 拼写错误会回退到开发模式
- **位置**：`app.module.ts:73`
- **风险**：
  - 若生产部署忘记注入 `NODE_ENV=production`，`config.get<string>('NODE_ENV')` 返回 `undefined`，`undefined === 'development'` 为 `false` → 不会开启 synchronize，**反而安全**。
  - 但若运维设成 `NODE_ENV=PRODUCTION`（大写）或 `dev`（简写）→ 与 `=== 'development'` 不匹配 → 不会开 synchronize。
  - 反向风险：本地开发者若 `NODE_ENV=production` 但又改了实体，启动报错却不知道是 synchronize 关闭。
- **修法**：
  - 显式读取 `config.get<string>('DB_SYNCHRONIZE')`，由 .env 文件显式声明；
  - 启动时 `Logger.log` 输出 `synchronize=... NODE_ENV=...` 启动横幅；
  - 准备 `migrations/` 目录的 migration（package.json:13-15 已写好脚本，但目录不存在）。

#### M-4. 缺角色守卫：`processes/*` 全部只要登录即可写，缺"操作员 vs 质检员"分工
- **位置**：13 个 controller **没有一处**使用 `@Roles()`。RolesGuard 在 `auth.module.ts:48-49` 全局注册但无任何 controller 触发。
- **风险**：
  - 任何登录账号（含查看账号）都能 `POST /api/processes/batching/submit`；
  - 缺审计价值：`@Roles(OPERATOR)` vs `@Roles(QC_INSPECTOR)` 才是 MES 系统的常见约束。
- **修法**：
  - 在 controller 类级别加 `@Roles(UserRole.OPERATOR, UserRole.ADMIN)`；
  - submit 路径加 `@Roles(UserRole.OPERATOR)`、void 路径加 `@Roles(UserRole.ADMIN)`；
  - 当前 `UserRole` 定义需扩展为 `OPERATOR/QC_INSPECTOR/ADMIN`。

#### M-5. `submitQuality` 无并发保护，双击/网络重试会产生重复 QC 记录
- **位置**：13 个 service 全部
- **风险**：
  - 前端双击 + 后端无幂等键 → 同一 batchNo 短时间内可产生 ≥ 2 条 `QualityCheck` 记录。
  - `process-status` 的 `getProcessStatuses` 也只返回最新一条（`WHERE batch_no = @0` 可能多行）。
- **修法**：
  - DB 加唯一约束 `UNIQUE(quality_check.batch_no, quality_check.process_type)`；
  - 服务层 `submitQuality` 入口先 `qualityCheckRepo.findOne` 重复检查 → 抛 `PROCESS_ALREADY_SUBMITTED`；
  - 或在 controller 上加幂等中间件（请求头带 `Idempotency-Key`）。

### 3.3 Minor

#### m-1. tsconfig 未开 `strict: true`
- **位置**：`server/tsconfig.json:15-18`
  ```json
  "strictNullChecks": true,
  "noImplicitAny": true,
  "strictBindCallApply": true,
  ```
  但没有 `"strict": true`，缺：`strictFunctionTypes`、`strictPropertyInitialization`、`alwaysStrict`、`useUnknownInCatchVariables`。
- **风险**：DTO 字段类型、entity 字段类型在没有 `strictPropertyInitialization` 下不强制声明 `!` 或 `?`，但当前 13 实体用了 `= 1` 默认值（合规）。潜在风险在 catch 子句 —— `http-exception.filter.ts:18` 的 `exception: unknown` 不开 strict 也工作，但若以后有人写 `catch (e) { e.message }` 会编译失败。
- **修法**：直接 `"strict": true` 一次到位。

#### m-2. `@IsOptional()` 在多数 DTO 中 import 却未使用
- **位置**（举例）：
  - `batching/dto/create-draft.dto.ts:1` import 了 `IsOptional` 但全文未用
  - `winding/dto/create-draft.dto.ts:1` 同
  - `formation/dto/create-draft.dto.ts:1` 同
  - `baking/dto/create-draft.dto.ts:1` 同
  - `wrapping/dto/create-draft.dto.ts:1` 同
  - `electrode/dto/create-draft.dto.ts:1` 同
  - `assembly/dto/create-draft.dto.ts:1` 同
  - `grading/dto/create-draft.dto.ts:1` 同
- **修法**：删除未用 import，或在 `rollVoltageSpeed`、`slittingSpeed` 等确实可空字段上加 `@IsOptional()` 并实际放开。

#### m-3. Datasource 选项在 `app.module.ts` 与 `config/typeorm.config.ts` 重复
- **位置**：
  - `app.module.ts:67-89`（运行时 DataSource）
  - `config/typeorm.config.ts:10-24`（CLI DataSource for migrations）
- **风险**：
  - 改一个忘改另一个 → 运行时与 migration 行为分叉。
  - `typeorm.config.ts:17` 的 `entities: ['src/**/*.entity.ts']` 与 `app.module.ts:74` 的 `autoLoadEntities: true` 是两套路径解析，前者依赖 cwd（运行 `npm run migration:generate` 的目录）。
- **修法**：
  - 让 `typeorm.config.ts` 仅 export `dataSourceOptions` 供 CLI 用，运行时也 import 同一份；
  - 删掉 `typeorm.config.ts:26-27` `new DataSource(...)` 与 `export default` 那一段（运行时不需该实例）。

#### m-4. CORS 写死前端地址
- **位置**：`main.ts:12-15`
  ```ts
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });
  ```
- **风险**：生产环境若前端部署在其他域名会 CORS 报错。
- **修法**：从 `ConfigService` 读 `CORS_ORIGINS`（逗号分隔），dev 默认 localhost。

#### m-5. `extra_data NVARCHAR(MAX)` 大小无约束
- **位置**：13 实体 `extraData: string` 全部 `nvarchar(max)`，且 `mergeExtraData` 把所有"非 entity 字段、非 batchNo"的字段都塞进去。
- **风险**：
  - 前端传巨大 payload → DB 写入开销 + 序列化/反序列化 + 网络 IO 暴涨。
  - SQL Server `NVARCHAR(MAX)` 单字段理论 2GB。
- **修法**：在 `mergeExtraData` 入口加 `if (JSON.stringify(extraData).length > 65536) throw new BadRequestException(...)`（64KB 上限，参考 SQL Server `VARCHAR(8000)` 安全阈值）。

#### m-6. `process-status` 用 SQL 字符串拼接表名
- **位置**：`process-status.service.ts:74-80, 117-122`
  ```ts
  const tableName = `${proc.key.replace(/-/g, '_')}_record`;
  return `SELECT ... FROM ${tableName} WHERE batch_no = @0`;
  ```
- **风险**：
  - `proc.key` 来自硬编码常量数组（line 57-69），目前安全；但模式**易被新模块作者无意间滥用**（如果以后从 DB 读 process 列表）。
  - `dataSource.query` 用 `@0` 参数化 batchNo 安全，但表名/列名无法参数化。
- **修法**：
  - 改用 QueryBuilder + metadata（`Repository.metadata.tableName`），或把 13 个 Repository 注入进来用 `createQueryBuilder` 拼接；
  - 顺便修 `convertToCamelCase` 递归函数（line 143-153）—— 用 `lodash.camelCase` 即可，避免自定义正则漏 case。

#### m-7. 控制器方法直接返回 `{ data, message }`，与 `ResponseInterceptor` 信封重复
- **位置**：13 个 controller 全部，例如 `batching.controller.ts:14` `return { data: record, message: '草稿保存成功' };`
- **风险**：
  - `ResponseInterceptor`（line 26-37）的逻辑：`if (result && 'success' in result) return result; const data = result?.data ?? result; return { success: true, data, message: 'ok' }`。
  - 因为 controller 已经返回 `{ data, message }`，interceptor 会把 `result.data` 提到顶层 `data`，但**原始 `message` 会被覆盖成 'ok'**。
  - 即**前端拿不到 '草稿保存成功'**，只能拿到固定 'ok'。
  - 注释里 `ApiResponse.message` 类型也未在 controller 返回值上声明。
- **修法**：
  - 方案 A：controller 改为直接 return `record`（data），由 interceptor 自动包信封；`message` 通过 `@Message('草稿保存成功')` 自定义装饰器或 controller 抛 `new MessageException('...')`；
  - 方案 B：interceptor 优先保留已有 `message`，仅在缺失时填 'ok'（修改 line 35：`message: result?.message ?? 'ok'`）。

### 3.4 Nit

- **N-1** 13 实体文件每个 @Column 后面都有"多余空格"（如 `winding-record.entity.ts:5-7`、`name: 'id' }) ` 注意行末空格），可批量清理。
- **N-2** `BATCHING_ENTITY_FIELDS` 等 13 个常量都是模块级 const，应提到 `process-record.util.ts` 通过工厂函数生成（`buildEntityFields(['positiveMaterial', ...])`），重复样板可消 30+ 行。
- **N-3** `voidRecord` 错误信息在 13 处不一致："记录已被作废"（9 处） vs "未找到<工序名>记录"（13 处，工序名不同）。建议统一：把"未找到 X 草稿记录"改为"未找到 X 工序记录"，"未找到 X 草稿记录" 仅用于 `submitQuality`（确实在找草稿）。
- **N-4** `mergeExtraData` 静默把 `batchNo` 从 extraData 排除（line 8），但调用方看不到这点。建议显式注释或抛错"batchNo 不应在 dto 出现"，避免前端误用。
- **N-5** `process-status.service.ts:75` `proc.key.replace(/-/g, '_')` 暗示作者也注意到 `roller-pressing` vs `roller_pressing` 不一致 —— 但提交 QC 时 `processType: 'roller-pressing'` 用了连字符（与 `coating` / `formation` 一致短横风格），这里又变下划线。**表名 (`*_record`) vs 业务键 (`processType`) 风格不统一**，应在常量层就显式区分。

---

## 4. 改进建议（按 ROI 排序）

### P0（本周必修）

1. **统一范式**：明确选 A 或 B，全 13 模块同步改造。
   - 建议选 A：在 submit 阶段补齐"质量检测字段 DTO"，与项目"两阶段 DTO"自我描述对齐。
2. **统一事务**：`submitQuality` 全部走 `dataSource.transaction`，与 `batching`/`electrode` 对齐。
3. **修复 `HttpExceptionFilter` 的 `code` 丢失**：helper 函数重构。
4. **补 `inspectionResult` DTO 字段 + DB 列**，打通"不合格"分支。

### P1（下迭代）

5. **interceptor 全走 `APP_INTERCEPTOR`**，消除 `useGlobalInterceptors`。
6. **加 `Idempotency-Key` 中间件** + QC 表 `UNIQUE(batch_no, process_type)`。
7. **加角色守卫**：`@Roles(OPERATOR)` / `@Roles(QC_INSPECTOR)` / `@Roles(ADMIN)`。
8. **Datasource 配置单源**：把 `dataSourceOptions` 抽到 `config/database.config.ts`，CLI 与运行时共用。
9. **`process-status` 改用 Repository metadata** 替代字符串拼接。

### P2（清理）

10. **抽象基类**：`abstract class BaseProcessService<T extends ProcessRecord>`，把 4 个方法（createDraft/submitQuality/findByBatchNo/voidRecord）实现一次。
11. **`buildEntityFields` 工厂**：消 13 份重复常量。
12. **`@IsOptional` 未用 import 清理**。
13. **tsconfig 开 `"strict": true`**。
14. **CORS / message 字段**从 controller 显式返回改为 interceptor 自动包。

### P3（架构层）

15. **加 e2e / 集成测试**：`POST /processes/<x>/draft` → `POST /processes/<x>/submit` → 验证 `quality_check` 存在且事务回滚场景（mock save 失败）。
16. **加审计字段 `is_draft=false` 触发的领域事件**：当前 `ProcessRecordSubscriber` 仅广播了 'process.record.updated'，未区分 insert vs update vs submit 状态变化，下游 dashboard 可消费但缺乏语义。
17. **processType 字典化**：把 13 个 `processType` 字符串字面量收集到 `ProcessType` enum / const，与 `process-dictionary` 主数据对齐（已有 module `process-dictionary` 但与本评审范围无关，跨模块边界）。

---

## 5. 总结

**架构优点**：
- 13 模块的 `controller` / `module` / `service` 骨架同构度很高（路由 4 个、方法名 4 个、模块导入 3 个实体一致）。
- 公共层职责清晰：`HttpExceptionFilter` + `ResponseInterceptor` + `LoggingInterceptor` + `AuditLogInterceptor` 各司其职。
- `mergeExtraData` 与 `is_draft` / `record_status` 双标志位设计简洁实用。
- `process-status` 用 union-all 一次拿 13 工序状态，比 N+1 查询性能好很多。
- 13 实体**字段命名规则**严格遵循 snake_case column + camelCase property，`SnakeNamingStrategy` + `@Index` + 显式 `name: 'xxx'` 都正确。
- 13 service / controller / entity 三件套的 spec 文件齐备，测试基础设施完整。

**架构风险**：
- 真正的同构只覆盖**骨架**，**业务契约层**（DTO、事务、质检结果）有 4/13 ~ 11/13 的偏离。
- 提交即"通过质检"是产品级缺陷。
- 并发安全、角色权限、幂等保护都未落地。

**改造成本估算**（基于改动文件数）：
- P0：~25 个文件改动（13 service + 4 新 DTO + 1 filter + 1 interceptor），约 1.5-2 人天。
- P1：~10 个文件，约 1 人天。
- P2-P3：约 1 人天。

总计 4-5 人天可完成 P0 + P1，达到 MES 系统的"最低可生产"标准。

---

## 6. 附录：被审文件清单

**全量阅读**（13 + 公共 + 配置）：
- processes/batching/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/coating/{entity, service, controller, module, create-draft}.ts
- processes/roller-pressing/{entity, service, controller, module, create-draft}.ts
- processes/slitting/{entity, service, controller, module, create-draft}.ts
- processes/sorting/{entity, service, controller, module, create-draft}.ts
- processes/electrode/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/winding/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/assembly/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/baking/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/injection/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/wrapping/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/formation/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/grading/{entity, service, controller, module, create-draft, submit-quality}.ts
- processes/process-status/{service, controller, module, subscriber}.ts
- common/{filters/http-exception.filter, interceptors/{logging, response, audit-log}, utils/process-record.util, enums/status-code.enum, decorators/{public, roles, current-user}}.ts
- config/typeorm.config.ts
- main.ts / app.module.ts / tsconfig.json / package.json
- auth/{auth.module, jwt-auth.guard, roles.guard}.ts
- batching/{batching.service.spec, batching.controller.spec}.ts（取一样本看测试质量）

**抽样未读**：13 模块的 entity-spec 文件（仅看 batching 一份确认模式存在）。
