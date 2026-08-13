/*
  YT-MES OCV traceability manual migration
  Target: SQL Server 2019+

  Usage:
    1. Open this file in SSMS and select the target YT_MES database.
    2. Review the preflight checks below.
    3. Execute the whole script in one run.

  The script is idempotent. It keeps OCV history and does not implement a
  destructive rollback. Any identifier conflict or value longer than 32
  characters aborts the transaction and rolls back all changes.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, 'Select the target YT_MES database before running this script.', 1;

IF OBJECT_ID(N'dbo.batch', N'U') IS NULL
    THROW 51001, 'Required table dbo.batch does not exist.', 1;

IF OBJECT_ID(N'dbo.cell_barcode', N'U') IS NULL
    THROW 51002, 'Required table dbo.cell_barcode does not exist.', 1;

IF OBJECT_ID(N'dbo.process_dictionary', N'U') IS NULL
    THROW 51003, 'Required table dbo.process_dictionary does not exist.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    /* Fail before normalization if a unique business identifier would merge. */
    IF EXISTS (
        SELECT 1
        FROM dbo.batch
        GROUP BY UPPER(LTRIM(RTRIM(batch_no)))
        HAVING COUNT(*) > 1
    )
        THROW 51010, 'Normalized batch_no values conflict.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.cell_barcode
        GROUP BY UPPER(LTRIM(RTRIM(barcode)))
        HAVING COUNT(*) > 1
    )
        THROW 51011, 'Normalized cell barcode values conflict.', 1;

    IF OBJECT_ID(N'dbo.pack', N'U') IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM dbo.pack
           GROUP BY UPPER(LTRIM(RTRIM(pack_barcode)))
           HAVING COUNT(*) > 1
       )
        THROW 51012, 'Normalized Pack barcode values conflict.', 1;

    /* Add the current OCV snapshot columns. Existing values are preserved. */
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv1_voltage') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv1_voltage DECIMAL(12,4) NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv1_resistance') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv1_resistance DECIMAL(12,2) NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv1_time') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv1_time DATETIME2 NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv1_equipment_code') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv1_equipment_code NVARCHAR(64) NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv2_voltage') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv2_voltage DECIMAL(12,4) NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv2_resistance') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv2_resistance DECIMAL(12,2) NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv2_k_value') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv2_k_value DECIMAL(12,4) NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv2_time') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv2_time DATETIME2 NULL;
    IF COL_LENGTH(N'dbo.cell_barcode', N'ocv2_equipment_code') IS NULL
        ALTER TABLE dbo.cell_barcode ADD ocv2_equipment_code NVARCHAR(64) NULL;

    /* Create the append-only OCV audit tables when they are absent. */
    IF OBJECT_ID(N'dbo.ocv1_record', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ocv1_record (
            id                    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            batch_no              NVARCHAR(32) NOT NULL,
            barcode               NVARCHAR(32) NULL,
            record_status         TINYINT NOT NULL CONSTRAINT DF_ocv1_record_status DEFAULT 1,
            is_draft              BIT NOT NULL CONSTRAINT DF_ocv1_is_draft DEFAULT 0,
            ocv_voltage_min       DECIMAL(12,4) NULL,
            ocv_voltage_max       DECIMAL(12,4) NULL,
            voltage               DECIMAL(12,4) NULL,
            internal_resistance   DECIMAL(12,2) NULL,
            test_time             DATETIME2 NULL,
            source_event_id       NVARCHAR(64) NULL,
            payload_hash          CHAR(64) NULL,
            raw_payload           NVARCHAR(MAX) NULL,
            received_at           DATETIME2 NULL,
            equipment_code        NVARCHAR(64) NULL,
            operator_name         NVARCHAR(64) NULL,
            created_by            INT NULL,
            created_at            DATETIME2 NOT NULL CONSTRAINT DF_ocv1_created_at DEFAULT SYSDATETIME(),
            updated_by            INT NULL,
            updated_at            DATETIME2 NULL
        );
    END;

    IF OBJECT_ID(N'dbo.ocv2_record', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ocv2_record (
            id                    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            batch_no              NVARCHAR(32) NOT NULL,
            barcode               NVARCHAR(32) NULL,
            record_status         TINYINT NOT NULL CONSTRAINT DF_ocv2_record_status DEFAULT 1,
            is_draft              BIT NOT NULL CONSTRAINT DF_ocv2_is_draft DEFAULT 0,
            ocv_voltage_min       DECIMAL(12,4) NULL,
            ocv_voltage_max       DECIMAL(12,4) NULL,
            voltage               DECIMAL(12,4) NULL,
            internal_resistance   DECIMAL(12,2) NULL,
            k_value               DECIMAL(12,4) NULL,
            test_time             DATETIME2 NULL,
            source_event_id       NVARCHAR(64) NULL,
            payload_hash          CHAR(64) NULL,
            raw_payload           NVARCHAR(MAX) NULL,
            received_at           DATETIME2 NULL,
            equipment_code        NVARCHAR(64) NULL,
            operator_name         NVARCHAR(64) NULL,
            created_by            INT NULL,
            created_at            DATETIME2 NOT NULL CONSTRAINT DF_ocv2_created_at DEFAULT SYSDATETIME(),
            updated_by            INT NULL,
            updated_at            DATETIME2 NULL
        );
    END;

    /* Extend old OCV tables without removing their existing columns or rows. */
    IF COL_LENGTH(N'dbo.ocv1_record', N'barcode') IS NULL
        ALTER TABLE dbo.ocv1_record ADD barcode NVARCHAR(32) NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'voltage') IS NULL
        ALTER TABLE dbo.ocv1_record ADD voltage DECIMAL(12,4) NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'internal_resistance') IS NULL
        ALTER TABLE dbo.ocv1_record ADD internal_resistance DECIMAL(12,2) NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'test_time') IS NULL
        ALTER TABLE dbo.ocv1_record ADD test_time DATETIME2 NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'source_event_id') IS NULL
        ALTER TABLE dbo.ocv1_record ADD source_event_id NVARCHAR(64) NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'payload_hash') IS NULL
        ALTER TABLE dbo.ocv1_record ADD payload_hash CHAR(64) NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'raw_payload') IS NULL
        ALTER TABLE dbo.ocv1_record ADD raw_payload NVARCHAR(MAX) NULL;
    IF COL_LENGTH(N'dbo.ocv1_record', N'received_at') IS NULL
        ALTER TABLE dbo.ocv1_record ADD received_at DATETIME2 NULL;

    IF COL_LENGTH(N'dbo.ocv2_record', N'barcode') IS NULL
        ALTER TABLE dbo.ocv2_record ADD barcode NVARCHAR(32) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'voltage') IS NULL
        ALTER TABLE dbo.ocv2_record ADD voltage DECIMAL(12,4) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'internal_resistance') IS NULL
        ALTER TABLE dbo.ocv2_record ADD internal_resistance DECIMAL(12,2) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'k_value') IS NULL
        ALTER TABLE dbo.ocv2_record ADD k_value DECIMAL(12,4) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'test_time') IS NULL
        ALTER TABLE dbo.ocv2_record ADD test_time DATETIME2 NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'source_event_id') IS NULL
        ALTER TABLE dbo.ocv2_record ADD source_event_id NVARCHAR(64) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'payload_hash') IS NULL
        ALTER TABLE dbo.ocv2_record ADD payload_hash CHAR(64) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'raw_payload') IS NULL
        ALTER TABLE dbo.ocv2_record ADD raw_payload NVARCHAR(MAX) NULL;
    IF COL_LENGTH(N'dbo.ocv2_record', N'received_at') IS NULL
        ALTER TABLE dbo.ocv2_record ADD received_at DATETIME2 NULL;

    /* Commit the schema phase before any statement references newly added columns. */
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    /* Match the upload API: trim event ids and treat empty values as missing. */
    UPDATE dbo.ocv1_record
       SET source_event_id = NULLIF(LTRIM(RTRIM(source_event_id)), N'')
     WHERE source_event_id IS NOT NULL;
    UPDATE dbo.ocv2_record
       SET source_event_id = NULLIF(LTRIM(RTRIM(source_event_id)), N'')
     WHERE source_event_id IS NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM dbo.ocv1_record
        WHERE source_event_id IS NOT NULL
        GROUP BY source_event_id
        HAVING COUNT(*) > 1
    )
        THROW 51013, 'Existing duplicate source_event_id values exist in ocv1_record.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.ocv2_record
        WHERE source_event_id IS NOT NULL
        GROUP BY source_event_id
        HAVING COUNT(*) > 1
    )
        THROW 51014, 'Existing duplicate source_event_id values exist in ocv2_record.', 1;

    /* Normalize every existing batch_no column and expand it to NVARCHAR(32). */
    DECLARE @batchTable sysname;
    DECLARE @batchMaxLength smallint;
    DECLARE @batchNullable bit;
    DECLARE @batchSql nvarchar(max);
    DECLARE @batchQualified nvarchar(517);

    DECLARE batch_no_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT
            QUOTENAME(s.name) + N'.' + QUOTENAME(t.name),
            c.max_length,
            c.is_nullable
        FROM sys.tables AS t
        INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
        INNER JOIN sys.columns AS c ON c.object_id = t.object_id
        WHERE s.name = N'dbo'
          AND c.name = N'batch_no';

    OPEN batch_no_cursor;
    FETCH NEXT FROM batch_no_cursor INTO @batchQualified, @batchMaxLength, @batchNullable;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @batchSql = N'
            IF EXISTS (
                SELECT 1
                FROM ' + @batchQualified + N'
                WHERE [batch_no] IS NOT NULL
                  AND LEN(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), [batch_no])))) > 32
            )
                THROW 51015, ''A batch_no value exceeds 32 characters.'', 1;';
        EXEC sys.sp_executesql @batchSql;

        SET @batchSql = N'
            UPDATE ' + @batchQualified + N'
               SET [batch_no] = UPPER(LTRIM(RTRIM([batch_no])))
             WHERE [batch_no] IS NOT NULL
               AND [batch_no] <> UPPER(LTRIM(RTRIM([batch_no])));';
        EXEC sys.sp_executesql @batchSql;

        IF @batchMaxLength <> 64
        BEGIN
            SET @batchSql = N'ALTER TABLE ' + @batchQualified
                + N' ALTER COLUMN [batch_no] NVARCHAR(32) '
                + CASE WHEN @batchNullable = 1 THEN N'NULL' ELSE N'NOT NULL' END + N';';
            EXEC sys.sp_executesql @batchSql;
        END;

        FETCH NEXT FROM batch_no_cursor INTO @batchQualified, @batchMaxLength, @batchNullable;
    END;

    CLOSE batch_no_cursor;
    DEALLOCATE batch_no_cursor;

    /* Normalize the other trace identifiers after conflict checks. */
    UPDATE dbo.cell_barcode
       SET barcode = UPPER(LTRIM(RTRIM(barcode)))
     WHERE barcode <> UPPER(LTRIM(RTRIM(barcode)));

    IF OBJECT_ID(N'dbo.pack', N'U') IS NOT NULL
        UPDATE dbo.pack
           SET pack_barcode = UPPER(LTRIM(RTRIM(pack_barcode)))
         WHERE pack_barcode <> UPPER(LTRIM(RTRIM(pack_barcode)));

    IF OBJECT_ID(N'dbo.pack_cell', N'U') IS NOT NULL
        UPDATE dbo.pack_cell
           SET cell_barcode = UPPER(LTRIM(RTRIM(cell_barcode)))
         WHERE cell_barcode <> UPPER(LTRIM(RTRIM(cell_barcode)));

    UPDATE dbo.ocv1_record
       SET barcode = UPPER(LTRIM(RTRIM(barcode)))
     WHERE barcode IS NOT NULL
       AND barcode <> UPPER(LTRIM(RTRIM(barcode)));
    UPDATE dbo.ocv2_record
       SET barcode = UPPER(LTRIM(RTRIM(barcode)))
     WHERE barcode IS NOT NULL
       AND barcode <> UPPER(LTRIM(RTRIM(barcode)));

    /* OCV audit and lookup indexes. */
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'UX_ocv1_record_source_event_id'
          AND object_id = OBJECT_ID(N'dbo.ocv1_record')
    )
        CREATE UNIQUE INDEX UX_ocv1_record_source_event_id
            ON dbo.ocv1_record(source_event_id)
            WHERE source_event_id IS NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'UX_ocv2_record_source_event_id'
          AND object_id = OBJECT_ID(N'dbo.ocv2_record')
    )
        CREATE UNIQUE INDEX UX_ocv2_record_source_event_id
            ON dbo.ocv2_record(source_event_id)
            WHERE source_event_id IS NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ocv1_record_barcode_test_time'
          AND object_id = OBJECT_ID(N'dbo.ocv1_record')
    )
        CREATE INDEX IX_ocv1_record_barcode_test_time
            ON dbo.ocv1_record(barcode, test_time, received_at, id);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ocv1_record_batch_test_time'
          AND object_id = OBJECT_ID(N'dbo.ocv1_record')
    )
        CREATE INDEX IX_ocv1_record_batch_test_time
            ON dbo.ocv1_record(batch_no, test_time, received_at, id);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ocv2_record_barcode_test_time'
          AND object_id = OBJECT_ID(N'dbo.ocv2_record')
    )
        CREATE INDEX IX_ocv2_record_barcode_test_time
            ON dbo.ocv2_record(barcode, test_time, received_at, id);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ocv2_record_batch_test_time'
          AND object_id = OBJECT_ID(N'dbo.ocv2_record')
    )
        CREATE INDEX IX_ocv2_record_batch_test_time
            ON dbo.ocv2_record(batch_no, test_time, received_at, id);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_cell_barcode_batch_ocv1_time'
          AND object_id = OBJECT_ID(N'dbo.cell_barcode')
    )
        CREATE INDEX IX_cell_barcode_batch_ocv1_time
            ON dbo.cell_barcode(batch_no, ocv1_time);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_cell_barcode_batch_ocv2_time'
          AND object_id = OBJECT_ID(N'dbo.cell_barcode')
    )
        CREATE INDEX IX_cell_barcode_batch_ocv2_time
            ON dbo.cell_barcode(batch_no, ocv2_time);

    /* Add the OCV process dictionary rows without duplicating existing rows. */
    IF NOT EXISTS (SELECT 1 FROM dbo.process_dictionary WHERE process_code = N'ocv1')
        INSERT INTO dbo.process_dictionary (process_code, process_name, sort_order, is_active)
        VALUES (N'ocv1', N'OCV1测试', 130, 1);

    IF NOT EXISTS (SELECT 1 FROM dbo.process_dictionary WHERE process_code = N'ocv2')
        INSERT INTO dbo.process_dictionary (process_code, process_name, sort_order, is_active)
        VALUES (N'ocv2', N'OCV2测试', 140, 1);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;

PRINT 'OCV traceability database migration completed.';

/* Post-run verification. */
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = N'dbo'
  AND (
        (TABLE_NAME = N'cell_barcode' AND COLUMN_NAME IN
            (N'ocv1_voltage', N'ocv1_resistance', N'ocv1_time', N'ocv1_equipment_code',
             N'ocv2_voltage', N'ocv2_resistance', N'ocv2_k_value', N'ocv2_time', N'ocv2_equipment_code'))
     OR (TABLE_NAME IN (N'ocv1_record', N'ocv2_record')
         AND COLUMN_NAME IN
            (N'batch_no', N'barcode', N'voltage', N'internal_resistance', N'k_value',
             N'test_time', N'source_event_id', N'payload_hash', N'raw_payload', N'received_at'))
      )
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT name AS index_name, OBJECT_NAME(object_id) AS table_name
FROM sys.indexes
WHERE name IN
(
    N'UX_ocv1_record_source_event_id',
    N'UX_ocv2_record_source_event_id',
    N'IX_ocv1_record_barcode_test_time',
    N'IX_ocv1_record_batch_test_time',
    N'IX_ocv2_record_barcode_test_time',
    N'IX_ocv2_record_batch_test_time',
    N'IX_cell_barcode_batch_ocv1_time',
    N'IX_cell_barcode_batch_ocv2_time'
)
ORDER BY table_name, index_name;

SELECT process_code, process_name, sort_order, is_active
FROM dbo.process_dictionary
WHERE process_code IN (N'ocv1', N'ocv2')
ORDER BY sort_order;
