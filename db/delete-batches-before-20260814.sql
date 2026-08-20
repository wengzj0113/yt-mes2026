/*
  YT-MES 批次历史数据清理脚本（SQL Server / SSMS）

  默认行为：只预览，不删除。
  执行前请确认：
    1. @CutoffDate 的含义是“创建时间早于 2026-08-14 00:00:00”；
    2. @IncludeInProgress = 0，即保留进行中的批次；
    3. 预览结果确实是要清理的数据。

  使用方法：
    - 第一次直接执行，查看批次清单、记录数量和关联数量；
    - 确认无误后，将 @ExecuteDelete 改为 1，再执行整段脚本；
    - 脚本在一个事务中删除，任一步失败会自动回滚。

  注意：本脚本按 batch.created_at 筛选。项目中没有“缩减批次”的专用字段，
  如果你实际想按 actual_start_date 筛选，请把下面的 WHERE 条件替换为：
    b.actual_start_date < @CutoffDate
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @CutoffDate date = '2026-08-14';
DECLARE @ExecuteDelete bit = 0;       -- 0=仅预览；1=执行删除
DECLARE @IncludeInProgress bit = 0;   -- 0=保留进行中(status=2)；1=允许删除
DECLARE @TargetBatchCount int;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('tempdb..#TargetBatches') IS NOT NULL
        DROP TABLE #TargetBatches;

    SELECT
        b.batch_no,
        b.created_at,
        b.actual_start_date,
        b.status,
        b.planned_qty,
        b.product_model,
        b.product_spec,
        b.workshop,
        b.shift
    INTO #TargetBatches
    FROM dbo.batch AS b
    WHERE b.created_at < @CutoffDate
      AND (@IncludeInProgress = 1 OR b.status <> 2);

    SELECT @TargetBatchCount = COUNT(*) FROM #TargetBatches;
    PRINT N'待处理批次数：' + CONVERT(nvarchar(30), @TargetBatchCount);

    -- 预览批次清单
    SELECT *
    FROM #TargetBatches
    ORDER BY created_at, batch_no;

    -- 检查数据库中是否还有脚本未覆盖的 batch_no 关联表。
    -- 如果这里出现业务表，请先补充删除顺序，不要直接执行删除。
    SELECT
        s.name AS schema_name,
        t.name AS table_name,
        c.name AS column_name
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
    INNER JOIN sys.columns AS c ON c.object_id = t.object_id
    WHERE c.name IN (N'batch_no', N'batchNo')
      AND t.name NOT IN (
          N'batch', N'batch_status_log', N'batching_record', N'coating_record',
          N'roller_pressing_record', N'slitting_record', N'sorting_record',
          N'electrode_record', N'winding_record', N'assembly_record',
          N'baking_record', N'injection_record', N'wrapping_record',
          N'formation_record', N'grading_record', N'ocv1_record', N'ocv2_record',
          N'quality_check', N'material_warehouse', N'cell_barcode',
          N'process_parameter', N'process_dynamic_record', N'pack', N'pack_cell'
      )
    ORDER BY s.name, t.name;

    -- 预览各类关联数据数量
    SELECT N'batch_status_log' AS table_name, COUNT_BIG(*) AS row_count
    FROM dbo.batch_status_log x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'batching_record', COUNT_BIG(*) FROM dbo.batching_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'coating_record', COUNT_BIG(*) FROM dbo.coating_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'roller_pressing_record', COUNT_BIG(*) FROM dbo.roller_pressing_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'slitting_record', COUNT_BIG(*) FROM dbo.slitting_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'sorting_record', COUNT_BIG(*) FROM dbo.sorting_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'electrode_record', COUNT_BIG(*) FROM dbo.electrode_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'winding_record', COUNT_BIG(*) FROM dbo.winding_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'assembly_record', COUNT_BIG(*) FROM dbo.assembly_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'baking_record', COUNT_BIG(*) FROM dbo.baking_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'injection_record', COUNT_BIG(*) FROM dbo.injection_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'wrapping_record', COUNT_BIG(*) FROM dbo.wrapping_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'formation_record', COUNT_BIG(*) FROM dbo.formation_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'grading_record', COUNT_BIG(*) FROM dbo.grading_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'ocv1_record', COUNT_BIG(*) FROM dbo.ocv1_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'ocv2_record', COUNT_BIG(*) FROM dbo.ocv2_record x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'quality_check', COUNT_BIG(*) FROM dbo.quality_check x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'material_warehouse', COUNT_BIG(*) FROM dbo.material_warehouse x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'cell_barcode', COUNT_BIG(*) FROM dbo.cell_barcode x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'process_parameter', COUNT_BIG(*) FROM dbo.process_parameter x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no
    UNION ALL SELECT N'pack', COUNT_BIG(*) FROM dbo.pack x INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no;

    -- process_dynamic_record 是后续版本才增加的表，旧服务器可能不存在。
    IF OBJECT_ID(N'dbo.process_dynamic_record', N'U') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            SELECT N''process_dynamic_record'' AS table_name, COUNT_BIG(*) AS row_count
            FROM dbo.process_dynamic_record x
            INNER JOIN #TargetBatches t ON t.batch_no = x.batch_no;';
    END;

    IF @ExecuteDelete = 0
    BEGIN
        PRINT N'当前为预览模式，未删除任何数据。确认后将 @ExecuteDelete 改为 1。';
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- 先删明细，再删批次。pack_cell 依赖 pack_id，必须先删除。
    DELETE pc
    FROM dbo.pack_cell AS pc
    INNER JOIN dbo.pack AS p ON p.id = pc.pack_id
    INNER JOIN #TargetBatches AS t ON t.batch_no = p.batch_no;

    DELETE x FROM dbo.batch_status_log AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.batching_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.coating_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.roller_pressing_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.slitting_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.sorting_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.electrode_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.winding_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.assembly_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.baking_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.injection_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.wrapping_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.formation_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.grading_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.ocv1_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.ocv2_record AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.quality_check AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.material_warehouse AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.cell_barcode AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.process_parameter AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    IF OBJECT_ID(N'dbo.process_dynamic_record', N'U') IS NOT NULL
    BEGIN
        EXEC sys.sp_executesql N'
            DELETE x
            FROM dbo.process_dynamic_record AS x
            INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;';
    END;
    DELETE x FROM dbo.pack AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;
    DELETE x FROM dbo.batch AS x INNER JOIN #TargetBatches AS t ON t.batch_no = x.batch_no;

    PRINT N'删除完成，删除批次数：' + CONVERT(nvarchar(30), @TargetBatchCount);
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
