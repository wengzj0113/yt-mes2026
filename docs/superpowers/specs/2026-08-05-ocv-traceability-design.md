# OCV 与追溯链路优化设计

## 1. 目标与范围

YT-MES 的首要目标是保存外部设备和人工录入的生产数据，并通过电芯码、批次号和 Pack 码完成可靠追溯。工序顺序和工序状态只作为展示信息，不作为 OCV、分选或其他设备上传的前置闸门。

本设计覆盖：

- OCV1、OCV2 单条和批量上传；
- 电芯码、批次号、Pack 码三种追溯入口；
- 批次号从 16 位扩展到 32 位；
- OCV 在追溯页面和批次页面中的展示顺序；
- TypeORM migration 和发布策略（不再维护第二套手工 SQL 迁移）。

本设计不扩大到完整工序状态机、严格前后工序校验或重构全部 13 个工序模块。现有人工工序数据模型继续保持“一个批次一条当前记录”的兼容模式。

## 2. 现状与主要问题

### 2.1 OCV 是电芯级上传，旧流程聚合是批次级

`server/src/cells/cell-barcode.service.ts` 的 OCV 上传 DTO 同时包含 `batchNo` 和 `barcode`，并且每个上传电芯都会向 `ocv1_record` 或 `ocv2_record` 插入一行。但 OCV 记录表目前没有 `barcode` 字段，导致历史明细无法直接关联到具体电芯。

`server/src/processes/process-status/process-status.service.ts` 又把所有 `_record` 表按一个批次一条记录处理：

- 同批次多条 OCV 记录进入 `Map` 后只剩不确定的一条；
- `getProcessRecords` 使用 `FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`，多条 OCV 记录不能稳定映射为一个对象；
- 电芯追溯按批次查询工序记录，不能保证展示当前电芯的 OCV 数据。

### 2.2 当前快照与历史数据职责混在一起

`cell_barcode` 保存 OCV1/OCV2 当前值，适合快速追溯，但同一电芯重复测试时只保留最后值。`ocv1_record`、`ocv2_record` 当前更接近“批次级过程表的兼容形态”，字段不完整且缺少条码，因此本次优化不把它们升级为“可按电芯追溯的历史明细表”，只解决它们与追溯查询的兼容问题（不再导致 JSON 解析失败或数据被覆盖）。

### 2.3 流程和质检列表没有 OCV

后端流程列表当前为 `ocv1 -> grading -> ocv2 -> sorting`，前端 `PROCESS_ORDER` 也是同样顺序。质检待处理列表没有 OCV。由于本系统不以严格流程控制为目标，本设计不把 OCV 强行接入人工质检闸门，而是把它标识为外部数据工序，状态只表示“未收到/已收到”。

### 2.4 batch_no 的全链路长度不一致

当前 `batch_no` 在批次、批次状态日志、全部人工工序记录、电芯、质检、物料和 OCV 表中仍是 `NVARCHAR(16)`；实体和 DTO 也存在大量 `length: 16`、`@MaxLength(16)`。原方案遗漏了 `batch_status_log` 和人工工序 DTO/实体。

### 2.5 生产 SQL 脚本不应成为第二套迁移系统

原方案中的脚本存在以下问题：

- OCV 的 `max_length = 32 * 2` 条件与“16 扩展到 32”的目标相反；
- 索引重建段使用未声明的 `@sql`；
- 已经无法存在超过 16 位数据的列不需要用“超长数据则跳过”处理；
- TypeORM migration 和手工脚本重复修改同一对象，容易造成版本状态不一致。

## 3. 领域模型

| 概念 | 语义 | 数据形态 |
| --- | --- | --- |
| Batch | 一次生产批次，是人工工序和外部设备数据的归属单位 | `batch.batch_no` |
| Cell | 具体电芯，使用电芯条码唯一标识 | `cell_barcode.barcode` |
| Batch process record | 人工录入的批次级当前工序记录 | `*_record`，一个批次一条当前记录 |
| Cell measurement | OCV/分选等设备对单个电芯产生的一次测量事件 | 按条码追加的历史记录 |
| Cell snapshot | 电芯当前最新测量值，供列表和追溯快速读取 | `cell_barcode` |
| Pack association | Pack 与电芯条码的组成关系 | `pack` + `pack_cell` |
| Trace projection | 将 Batch、Cell、工序当前记录、测量快照、历史和 Pack 关系组合后的只读结果 | API 返回模型 |

关键规则：

1. `cell_barcode` 的 OCV 字段是当前快照，不是历史唯一来源。
2. OCV 上传只能确认批次存在；如果已有电芯属于其他批次，拒绝重新归属，不允许静默改写 `cell_barcode.batch_no`。
3. OCV 上传不检查前置工序，也不因缺少分选数据而拒绝。
4. OCV 状态只表达数据是否收到；本次优化不把 OCV 接入人工质检流程。
5. OCV 追溯以 `cell_barcode` 的当前快照为主；`ocv1_record/ocv2_record` 仅用于流程页面/批次页面展示的兼容查询，不作为电芯级历史明细使用（后续如需电芯级历史，再单独设计升级）。

## 4. 推荐方案

### 4.1 OCV 持久化

保留现有接口路径：

- `POST /api/cells/ocv1-upload`
- `POST /api/cells/ocv1-upload/bulk`
- `POST /api/cells/ocv2-upload`
- `POST /api/cells/ocv2-upload/bulk`

本次优化不新增 OCV 历史明细字段，不调整现有 OCV1/OCV2 上传接口的数据写入策略，目标是“数据能完整入库 + 追溯查询稳定”：

1. `cell_barcode` 继续作为 OCV 当前快照来源（电芯追溯优先读这里）。
2. `ocv1_record/ocv2_record` 保持现有字段形态与写入行为（当前可能同批次多条），本次只保证查询端能正确处理“多条”带来的问题。
3. 重复上传覆盖规则保持现有实现：电芯快照字段以最后一次上传为准。

### 4.2 追溯查询

保留现有接口，不改变前端核心数据结构（`processKey -> object | null`），重点修复 OCV 多条记录导致的解析/覆盖问题：

- 电芯追溯：`GET /api/cells/:barcode/trace`
  - 返回人工批次工序当前记录；
  - OCV 以 `cell_barcode` 的当前快照为主（已能满足“按电芯码追溯”）；
  - 返回该电芯所属批次和 Pack 关系。
- 批次工序记录：`GET /api/processes/records/:batchNo`
  - 人工工序继续返回当前批次记录；
  - OCV 返回“最新一条记录”（`TOP 1 ORDER BY updated_at DESC`），避免多条导致 `WITHOUT_ARRAY_WRAPPER` 解析失败；
  - 如后续确实需要“按批次查看 OCV 多条明细”，再新增独立接口返回数组，避免污染当前页面结构。
- 批次电芯：`GET /api/cells/batch/:batchNo/barcodes`
  - 保持分页；
  - 增加 OCV1/OCV2 是否已有数据的字段，方便批次追溯快速筛选。
- Pack 追溯：继续通过 `GET /api/packs/:barcode` 获取 Pack 和电芯列表，再复用电芯追溯；服务端先验证 Pack 中电芯确实存在。

所有新增返回结构使用明确 TypeScript 类型，替换前端 `Record<string, any>` 的关键路径类型。

### 4.3 工序展示

统一展示顺序为：

`... formation -> grading -> ocv1 -> ocv2 -> sorting`

但不增加前置工序校验。OCV1/OCV2 在流程字典中标记为外部数据工序，批次页面只读显示“未收到/已收到”和统计信息，不能打开人工录入抽屉。OCV 不加入待质检列表，避免状态永远停在待质检。

后端使用一个明确的流程目录定义工序键、名称、排序、数据范围和输入方式；前端仍可保留展示兜底，但不再在多个页面分别维护冲突的 OCV 顺序。

### 4.4 batch_no 统一扩展

统一规则为：

- `batch`、`batch_status_log`；
- 13 个已有人工工序记录表；
- `cell_barcode`、`quality_check`、`material_warehouse`；
- `ocv1_record`、`ocv2_record`。

这些表的 `batch_no` 统一为 `NVARCHAR(32)`，实体和相关 DTO 统一为 32。`pack.batch_no` 当前已经是 `NVARCHAR(64)`，本次保持数据库兼容，不缩短；接口层仍按批次号最大 32 校验。

新增共享常量 `BATCH_NO_MAX_LENGTH = 32`，DTO 使用 `@MaxLength(BATCH_NO_MAX_LENGTH)`，减少以后再次遗漏。新建批次 DTO 也必须补上最大长度校验。

### 4.5 数据库迁移

TypeORM migration 是唯一正式变更入口。

迁移分两部分：

1. 扩展所有列到 `NVARCHAR(32)`，已是 32 或更长时跳过。
2. OCV 表结构不做额外扩展（本次仅修复查询与展示的兼容问题）。

迁移前输出表结构和行数检查；迁移后输出所有目标列的 `max_length` 和索引状态。不要无条件重建所有主键索引，字段扩展由 SQL Server 处理，只有执行计划或碎片监控证明必要时再单独维护索引。

## 5. 非目标和取舍

- 不在本次计划中重构 13 个人工工序 Service；
- 不把 OCV 改造成需要人工创建草稿、提交质检的工序；
- 不删除旧 OCV 字段和旧 API；
- 不把当前快照查询误认为完整历史查询；
- 不用“静默截断、夹紧或覆盖”替代数据校验；
- 不让生产库手工 SQL 和 TypeORM migration 各自维护一套不一致逻辑。

## 6. 验收标准

1. 32 位批次号可以创建，并可通过所有 OCV、分选、人工工序、质检、物料、批次日志和追溯接口传递；33 位请求被拒绝。
2. OCV 单条和批量上传都在同一事务中保存电芯快照；任一批次不存在或数据无效时整批回滚。
3. 同一电芯重复 OCV 测试时，电芯快照指向最新接收值。
4. 已存在电芯上传到不同批次时返回冲突，原批次关系不改变。
5. 按电芯码追溯能得到该电芯的 OCV1/OCV2 当前值；按批次号查询工序记录不会因 OCV 多条记录导致 JSON 解析失败；按 Pack 码能打开所有电芯追溯。
6. OCV 顺序在后端状态、前端追溯、批次页面和流程字典中一致，且不阻断上传。
7. OCV 上传后旧追溯缓存不会继续返回旧数据。
8. 新 migration 可在已有库和空库执行；重复执行不会破坏数据。
