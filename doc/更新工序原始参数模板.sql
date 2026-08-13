/*
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

DECLARE @Baseline NVARCHAR(MAX) = N'[{"processCode":"batching","processName":"配料","sortOrder":10,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"positiveActiveMaterial","label":"正极活性材料","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"positiveSlurryViscosity","label":"正极浆料粘度","unit":"cp.s","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"positiveSlurrySolids","label":"正极浆料固含","unit":"%","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeActiveMaterial","label":"负极活性材料","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeSlurryViscosity","label":"负极浆料粘度","unit":"cp.s","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeSlurrySolids","label":"负极浆料固含","unit":"%","type":"number","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"coating","processName":"涂布","sortOrder":20,"isActive":true,"fieldDefinitions":[{"group":"正极涂布机信息","key":"positiveCoatingSpeed","label":"正极涂布速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"正极涂布机信息","key":"positiveCoatingLength","label":"正极片涂层长度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"正极涂布机信息","key":"positiveGapLength","label":"正极片间隙长度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"正极涂布机信息","key":"positiveThickness","label":"正极片厚度","unit":"um","type":"number","required":true,"isSystem":true},{"group":"正极涂布机信息","key":"positiveArealDensity","label":"正极片面密度","unit":"mg/cm²","type":"number","required":true,"isSystem":true},{"group":"正极涂布机信息","key":"positiveWeightLossRatio","label":"正极片失重比","unit":"%","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeCoatingSpeed","label":"负极涂布速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeCoatingLength1","label":"负极片涂层长度1","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeGapLength1","label":"负极间隙长度1","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeCoatingLength2","label":"负极片涂层长度2","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeGapLength2","label":"负极间隙长度2","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeThickness","label":"负极片厚度","unit":"um","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeArealDensity","label":"负极片面密度","unit":"mg/cm²","type":"number","required":true,"isSystem":true},{"group":"负极涂布机信息","key":"negativeWeightLossRatio","label":"负极片失重比","unit":"%","type":"number","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"roller-pressing","processName":"辊压","sortOrder":30,"isActive":true,"fieldDefinitions":[{"group":"正极设备信息","key":"positiveRollerThickness","label":"正极片辊压厚度","unit":"um","type":"number","required":true,"isSystem":true},{"group":"正极设备信息","key":"positiveRollerSpeed","label":"正极片辊压速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"正极设备信息","key":"positiveRollerPressure","label":"正极辊压压力","unit":"kg/N","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeRollerThickness","label":"负极片辊压厚度","unit":"um","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeRollerSpeed","label":"负极片辊压速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeRollerPressure","label":"负极辊压压力","unit":"kg/N","type":"number","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"slitting","processName":"分切","sortOrder":40,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"positiveSlittingWidth","label":"正极片分切宽度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"positiveSlittingSpeed","label":"正极片分切速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"positiveSlittingAppearance","label":"正极片分切外观","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeSlittingWidth","label":"负极片分切宽度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeSlittingSpeed","label":"负极片分切速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeSlittingAppearance","label":"负极片分切外观","type":"text","required":true,"isSystem":true}]},{"processCode":"electrode","processName":"制片","sortOrder":50,"isActive":true,"fieldDefinitions":[{"group":"正极设备信息","key":"positiveTabMaterial","label":"正极耳材质","type":"text","required":true,"isSystem":true},{"group":"正极设备信息","key":"positiveTabSpec","label":"正极耳规格型号","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"正极设备信息","key":"positiveTabCutLength","label":"正极耳裁切长度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"正极设备信息","key":"positiveTabExposedLength","label":"正极耳外露尺寸","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"正极设备信息","key":"positiveTabWeldingAppearance","label":"正极儿焊接效果","type":"text","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabMaterial","label":"负极耳材质","type":"text","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabSpec","label":"负极耳规格型号","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabCutLength1","label":"负极耳裁切长度1","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabCutLength2","label":"负极耳裁切长度2","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabExposedLength1","label":"负极耳外露尺寸1","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabExposedLength2","label":"负极耳外露尺寸2","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"负极设备信息","key":"negativeTabWeldingAppearance","label":"负极耳焊接效果","type":"text","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"winding","processName":"卷绕","sortOrder":60,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"separatorSpec","label":"隔膜规格型号","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"windingNeedleOuterDiameter","label":"卷针外径","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"windingSpeed","label":"卷绕速度","unit":"m/min","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"separatorTension","label":"隔膜张力","unit":"N","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"woundCoreOuterDiameter","label":"卷芯外径","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"woundCoreAppearance","label":"卷芯外观","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"alignment","label":"包覆效果（对齐度）","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"assembly","processName":"装配","sortOrder":70,"isActive":true,"fieldDefinitions":[]},{"processCode":"casing","processName":"入壳","sortOrder":80,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"steelShellSpec","label":"钢壳规格型号","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"insulationGasketThickness","label":"绝缘垫片厚度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"casingAppearance","label":"入壳效果","type":"text","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"integrated-machine","processName":"一体机","sortOrder":90,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"weldingNeedleOuterDiameter","label":"焊针外径","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"bottomWeldPullForce","label":"点底焊接拉力","unit":"kg","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"bottomWeldAppearance","label":"点滴焊接效果","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"shortCircuitTestParameter","label":"短路测试参数","unit":"","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"shortCircuitTestAppearance","label":"短路测试效果","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"insulationTopGasketThickness","label":"绝缘上垫厚度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"grooveInnerDiameter","label":"滚槽内径","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"groovedShellOuterDiameter","label":"滚槽壳口外径","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"grooveUpperShoulderHeight","label":"滚槽后上肩高","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"grooveLowerEdgeHeight","label":"滚槽后下沿高度","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"grooveAppearance","label":"滚槽后外观","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"grooveKnifeThickness","label":"滚刀厚度","unit":"mm","type":"number","required":true,"isSystem":true}]},{"processCode":"laser-welding","processName":"激光焊接","sortOrder":100,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"capSpec","label":"盖帽规格型号","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"laserWeldPullForce","label":"焊接拉力","unit":"kg","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"laserWeldAppearance","label":"焊接外观","type":"text","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"baking","processName":"烘烤","sortOrder":110,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"cellBakingTemperature","label":"电芯烘烤温度","unit":"℃","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"bakingDuration","label":"烘烤时间","unit":"小时","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"vacuumLevel","label":"真空度","unit":"KPa","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"positiveMoisture","label":"正极片含水量","unit":"ppm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"negativeMoisture","label":"负极片含水量","unit":"ppm","type":"number","required":true,"isSystem":true}]},{"processCode":"injection","processName":"注液","sortOrder":120,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"electrolyteModel","label":"电解液型号","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"gloveboxDewPoint","label":"手套箱露点温度","unit":"℃","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"gloveboxTemperature","label":"手套箱温度","unit":"℃","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"electrolyteAmount","label":"注液量","unit":"g","type":"number","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]},{"processCode":"wrapping","processName":"封口","sortOrder":130,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"sealingShoulderHeight","label":"封口肩高","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"sealingTotalHeight","label":"封口总高","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"sealingHeadDiameter","label":"封口头径","unit":"mm","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"sealingCleanAppearance","label":"封口清洗后外观","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"activationDuration","label":"活化时间","unit":"小时","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"filmColor","label":"套膜颜色","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"formationTemplate","label":"化成模板","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"formationTemperature","label":"化成温度","unit":"℃","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"gradingTemplate","label":"分容模板","type":"text","required":true,"isSystem":true},{"group":"工艺参数","key":"gradingTemperature","label":"分容温度","unit":"℃","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"capacityGradeStandard","label":"容量分级标准","unit":"mAh","type":"number","required":true,"isSystem":true}]},{"processCode":"sorting","processName":"分选","sortOrder":140,"isActive":true,"fieldDefinitions":[{"group":"工艺参数","key":"internalResistanceRange","label":"内阻电压范围（内阻）","unit":"mΩ","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"voltageRange","label":"内阻电压范围（电压）","unit":"V","type":"number","required":true,"isSystem":true},{"group":"工艺参数","key":"capacityRange","label":"容量范围","unit":"mAh","type":"number","required":true,"isSystem":true},{"group":"操作信息","key":"operatorName","label":"操作员","type":"text","required":true,"isSystem":true}]}]';

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
        UNION ALL
        SELECT oldField.[value], JSON_VALUE(oldField.[value], '$.key')
        FROM Existing ex
        CROSS APPLY OPENJSON(ex.field_definitions) oldField
        WHERE ex.process_code = b.processCode
          AND ISNULL(JSON_VALUE(oldField.[value], '$.isSystem'), 'false') <> 'true'
          AND NOT EXISTS (
            SELECT 1 FROM OPENJSON(b.fieldDefinitions) baselineField
            WHERE JSON_VALUE(baselineField.[value], '$.key') = JSON_VALUE(oldField.[value], '$.key')
          )
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
WHERE process_code IN (N'formation', N'grading');

COMMIT TRANSACTION;

SELECT process_code, process_name, sort_order, is_active
FROM process_dictionary
WHERE is_active = 1
ORDER BY sort_order;
