const fs = require('fs');
const path = require('path');
const { PROCESS_BASELINE, OCV_PROCESS_FIELDS } = require('../dist/master-data/process-baseline.js');

const syncDefinitions = [
  ...PROCESS_BASELINE,
  { processCode: 'ocv1', processName: 'OCV1测试', sortOrder: 150, isActive: true, fieldDefinitions: OCV_PROCESS_FIELDS },
  { processCode: 'ocv2', processName: 'OCV2测试', sortOrder: 155, isActive: true, fieldDefinitions: OCV_PROCESS_FIELDS },
];
const baselineJson = JSON.stringify(syncDefinitions).replace(/'/g, "''");
const sql = `/*
  云通 MES：Excel 工序原始参数模板同步脚本
  说明：
  1. 仅更新 process_dictionary，并按参数 Key 合并原有配置值。
  2. 不删除历史工序记录，不删除或重建 process_parameter。
  3. process_parameter 是原有“工序参数配置”数据表，本脚本不会修改它。
  4. 可重复执行；执行前请确认 SSMS 当前数据库正确。
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'process_dictionary', N'U') IS NULL
  THROW 51000, N'缺少 process_dictionary 表，请先部署基础数据库结构。', 1;

BEGIN TRANSACTION;

IF OBJECT_ID(N'process_dynamic_record', N'U') IS NULL
BEGIN
  CREATE TABLE process_dynamic_record (
    id INT IDENTITY(1,1) PRIMARY KEY,
    batch_no NVARCHAR(16) NOT NULL,
    process_code NVARCHAR(32) NOT NULL,
    extra_data NVARCHAR(MAX) NULL,
    record_status INT NOT NULL CONSTRAINT DF_process_dynamic_record_status DEFAULT 1,
    is_draft BIT NOT NULL CONSTRAINT DF_process_dynamic_record_draft DEFAULT 1,
    created_by INT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_process_dynamic_record_created DEFAULT SYSUTCDATETIME(),
    updated_by INT NULL,
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_process_dynamic_record_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_process_dynamic_record_batch_process UNIQUE(batch_no, process_code)
  );
END;

DECLARE @Baseline NVARCHAR(MAX) = N'${baselineJson}';

;WITH Baseline AS (
  SELECT processCode, processName, sortOrder, fieldDefinitions
  FROM OPENJSON(@Baseline)
  WITH (
    processCode NVARCHAR(32) '$.processCode',
    processName NVARCHAR(100) '$.processName',
    sortOrder INT '$.sortOrder',
    fieldDefinitions NVARCHAR(MAX) '$.fieldDefinitions' AS JSON
  )
), Existing AS (
  SELECT process_code, field_definitions
  FROM process_dictionary
), Merged AS (
  SELECT
    b.processCode,
    b.processName,
    b.sortOrder,
    N'[' + COALESCE(STUFF((
      SELECT N',' + mergedField.fieldJson
      FROM (
        SELECT CASE WHEN eField.[value] IS NULL THEN field.[value] ELSE
          JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(
            eField.[value], '$.group', JSON_VALUE(field.[value], '$.group')),
            '$.key', JSON_VALUE(field.[value], '$.key')),
            '$.label', JSON_VALUE(field.[value], '$.label')),
            '$.unit', JSON_VALUE(field.[value], '$.unit')),
            '$.type', JSON_VALUE(field.[value], '$.type')),
            '$.isSystem', JSON_VALUE(field.[value], '$.isSystem'))
        END AS fieldJson, JSON_VALUE(field.[value], '$.key') AS fieldKey
        FROM OPENJSON(b.fieldDefinitions) field
        OUTER APPLY (
          SELECT TOP 1 oldField.[value]
          FROM Existing ex
          CROSS APPLY OPENJSON(ex.field_definitions) oldField
          WHERE ex.process_code = b.processCode
            AND JSON_VALUE(oldField.[value], '$.key') = JSON_VALUE(field.[value], '$.key')
        ) eField
      ) mergedField
      ORDER BY mergedField.fieldKey
      FOR XML PATH(N''), TYPE
    ).value(N'.', N'nvarchar(max)'), 1, 1, N''), N'') + N']' AS fieldDefinitions
  FROM Baseline b
)
MERGE process_dictionary AS target
USING Merged AS source
ON target.process_code = source.processCode
WHEN MATCHED THEN UPDATE SET
  process_name = source.processName,
  sort_order = source.sortOrder,
  is_active = 1,
  field_definitions = source.fieldDefinitions,
  updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT
  (process_code, process_name, sort_order, is_active, field_definitions, created_at, updated_at)
  VALUES (source.processCode, source.processName, source.sortOrder, 1, source.fieldDefinitions, SYSUTCDATETIME(), SYSUTCDATETIME());

UPDATE process_dictionary
SET is_active = 0, updated_at = SYSUTCDATETIME()
WHERE process_code IN (N'assembly', N'formation', N'grading');

COMMIT TRANSACTION;

SELECT process_code, process_name, sort_order, is_active
FROM process_dictionary
WHERE is_active = 1
ORDER BY sort_order;
`;

const output = path.resolve(__dirname, '../../doc/更新工序原始参数模板.sql');
fs.writeFileSync(output, sql, 'utf8');
console.log(output);
