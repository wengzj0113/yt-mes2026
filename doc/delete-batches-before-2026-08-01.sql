USE [yt_mes];
GO

IF DB_NAME() <> N'yt_mes'
    THROW 51001, N'当前数据库不是 yt_mes，脚本已终止，未执行删除。', 1;

/*
  删除 2026-08-01 之前创建的实验批次及其关联数据。

  使用方式：
  1. 先在 SSMS 中确认当前数据库正确，并先完成数据库备份。
  2. 保持 @Commit = 0 执行一次，查看待删除批次和删除数量；该模式会自动回滚。
  3. 确认无误后，将 @Commit 改为 1，再执行一次正式删除。

  说明：
  - “8月1日前”按 created_at < 2026-08-01 00:00:00 处理，8月1日当天数据会保留。
  - 系统操作日志、接口日志不按 batch_no 关联，因此不会删除，便于保留审计记录。
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @CutoffDate DATETIME2(0) = '2026-08-01T00:00:00';
DECLARE @Commit BIT = 0;

IF OBJECT_ID(N'dbo.batch', N'U') IS NULL
    THROW 51000, N'找不到 dbo.batch 表，请确认 SSMS 当前数据库正确。', 1;

IF OBJECT_ID(N'tempdb..#BatchesToDelete', N'U') IS NOT NULL
    DROP TABLE #BatchesToDelete;

SELECT
    batch_no,
    created_at
INTO #BatchesToDelete
FROM dbo.batch
WHERE created_at < @CutoffDate;

IF NOT EXISTS (SELECT 1 FROM #BatchesToDelete)
BEGIN
    PRINT N'没有找到符合条件的批次，没有执行任何删除。';
    RETURN;
END;

SELECT
    batch_no,
    created_at
FROM #BatchesToDelete
ORDER BY created_at, batch_no;

SELECT COUNT(*) AS batches_to_delete
FROM #BatchesToDelete;

BEGIN TRANSACTION;

/* Pack 可能通过 pack.batch_no 或 pack_cell.cell_barcode 间接关联旧批次。 */
IF OBJECT_ID(N'dbo.pack', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.pack_cell', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'tempdb..#PacksToDelete', N'U') IS NOT NULL
        DROP TABLE #PacksToDelete;

    CREATE TABLE #PacksToDelete (
        id INT NOT NULL PRIMARY KEY
    );

    INSERT INTO #PacksToDelete (id)
    SELECT p.id
    FROM dbo.pack AS p
    INNER JOIN #BatchesToDelete AS b ON b.batch_no = p.batch_no

    UNION

    SELECT p.id
    FROM dbo.pack AS p
    INNER JOIN dbo.pack_cell AS pc ON pc.pack_id = p.id
    INNER JOIN dbo.cell_barcode AS c ON c.barcode = pc.cell_barcode
    INNER JOIN #BatchesToDelete AS b ON b.batch_no = c.batch_no;

    DELETE pc
    FROM dbo.pack_cell AS pc
    INNER JOIN #PacksToDelete AS p ON p.id = pc.pack_id;
    PRINT CONCAT(N'dbo.pack_cell 删除行数: ', @@ROWCOUNT);

    DELETE p
    FROM dbo.pack AS p
    INNER JOIN #PacksToDelete AS d ON d.id = p.id;
    PRINT CONCAT(N'dbo.pack 删除行数: ', @@ROWCOUNT);
END;

/*
  删除所有带 batch_no 的业务表。通过系统目录动态识别，兼容当前数据库已经执行过的
  OCV、动态工序等后续迁移；dbo.batch 和 pack 已单独处理。
*/
DECLARE @TableName NVARCHAR(517);
DECLARE @Sql NVARCHAR(MAX);
DECLARE @DeletedRows INT;

DECLARE batch_table_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT DISTINCT
        QUOTENAME(s.name) + N'.' + QUOTENAME(t.name)
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
    INNER JOIN sys.columns AS c ON c.object_id = t.object_id
    WHERE s.name = N'dbo'
      AND t.is_ms_shipped = 0
      AND c.name = N'batch_no'
      AND t.name NOT IN (N'batch', N'pack');

OPEN batch_table_cursor;
FETCH NEXT FROM batch_table_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = N'
        DELETE target
        FROM ' + @TableName + N' AS target
        INNER JOIN #BatchesToDelete AS b ON b.batch_no = target.batch_no;
        SET @DeletedRows = @@ROWCOUNT;';

    SET @DeletedRows = 0;
    EXEC sys.sp_executesql
        @Sql,
        N'@DeletedRows INT OUTPUT',
        @DeletedRows = @DeletedRows OUTPUT;
    PRINT CONCAT(@TableName, N' 删除行数: ', @DeletedRows);

    FETCH NEXT FROM batch_table_cursor INTO @TableName;
END;

CLOSE batch_table_cursor;
DEALLOCATE batch_table_cursor;

DELETE FROM dbo.batch
WHERE batch_no IN (SELECT batch_no FROM #BatchesToDelete);
PRINT CONCAT(N'dbo.batch 删除行数: ', @@ROWCOUNT);

IF @Commit = 1
BEGIN
    COMMIT TRANSACTION;
    PRINT N'已提交删除。';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT N'预览模式：已回滚，数据库未发生实际删除。';
END;
