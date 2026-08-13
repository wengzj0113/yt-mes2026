/* OCV K 值自动计算，适用于 SQL Server */
CREATE OR ALTER PROCEDURE dbo.calculate_cell_k_value
  @barcode NVARCHAR(64)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE cell
  SET k_value = CASE
    WHEN cell.ocv1_voltage IS NOT NULL AND cell.ocv2_voltage IS NOT NULL
      AND cell.ocv1_time IS NOT NULL AND cell.ocv2_time IS NOT NULL
      AND DATEDIFF_BIG(MILLISECOND, cell.ocv1_time, cell.ocv2_time) > 0
    THEN CAST(((CAST(cell.ocv1_voltage AS DECIMAL(18,6)) * 1000.0)
      - (CAST(cell.ocv2_voltage AS DECIMAL(18,6)) * 1000.0))
      / (DATEDIFF_BIG(MILLISECOND, cell.ocv1_time, cell.ocv2_time) / 86400000.0) AS DECIMAL(12,4))
    ELSE NULL
  END
  FROM dbo.cell_barcode cell
  WHERE cell.barcode = @barcode;
END;
GO

IF OBJECT_ID('dbo.trg_cell_barcode_calculate_k_value', 'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_cell_barcode_calculate_k_value;
GO
CREATE TRIGGER dbo.trg_cell_barcode_calculate_k_value
ON dbo.cell_barcode
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT (UPDATE(ocv1_voltage) OR UPDATE(ocv1_time) OR UPDATE(ocv2_voltage) OR UPDATE(ocv2_time)) RETURN;
  DECLARE @barcode NVARCHAR(64);
  DECLARE barcode_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT DISTINCT barcode FROM inserted WHERE barcode IS NOT NULL;
  OPEN barcode_cursor;
  FETCH NEXT FROM barcode_cursor INTO @barcode;
  WHILE @@FETCH_STATUS = 0
  BEGIN
    EXEC dbo.calculate_cell_k_value @barcode = @barcode;
    FETCH NEXT FROM barcode_cursor INTO @barcode;
  END;
  CLOSE barcode_cursor;
  DEALLOCATE barcode_cursor;
END;
GO
