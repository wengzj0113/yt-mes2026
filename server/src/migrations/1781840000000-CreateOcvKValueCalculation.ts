import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOcvKValueCalculation1781840000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR ALTER PROCEDURE dbo.calculate_cell_k_value
        @barcode NVARCHAR(64)
      AS
      BEGIN
        SET NOCOUNT ON;

        UPDATE cell
        SET k_value = CASE
          WHEN cell.ocv1_voltage IS NOT NULL
            AND cell.ocv2_voltage IS NOT NULL
            AND cell.ocv1_time IS NOT NULL
            AND cell.ocv2_time IS NOT NULL
            AND DATEDIFF_BIG(MILLISECOND, cell.ocv1_time, cell.ocv2_time) > 0
          THEN CAST((
            (CAST(cell.ocv1_voltage AS DECIMAL(18,6)) * 1000.0)
            - (CAST(cell.ocv2_voltage AS DECIMAL(18,6)) * 1000.0)
          ) / (DATEDIFF_BIG(MILLISECOND, cell.ocv1_time, cell.ocv2_time) / 3600000.0) AS DECIMAL(12,4))
          ELSE NULL
        END
        FROM dbo.cell_barcode cell
        WHERE cell.barcode = @barcode;
      END
    `);

    await queryRunner.query(`
      IF OBJECT_ID('dbo.trg_cell_barcode_calculate_k_value', 'TR') IS NOT NULL
        DROP TRIGGER dbo.trg_cell_barcode_calculate_k_value;

      EXEC(N'
        CREATE TRIGGER dbo.trg_cell_barcode_calculate_k_value
        ON dbo.cell_barcode
        AFTER INSERT, UPDATE
        AS
        BEGIN
          SET NOCOUNT ON;

          IF NOT (UPDATE(ocv1_voltage) OR UPDATE(ocv1_time) OR UPDATE(ocv2_voltage) OR UPDATE(ocv2_time))
            RETURN;

          DECLARE @barcode NVARCHAR(64);
          DECLARE barcode_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT DISTINCT barcode FROM inserted WHERE barcode IS NOT NULL;

          OPEN barcode_cursor;
          FETCH NEXT FROM barcode_cursor INTO @barcode;
          WHILE @@FETCH_STATUS = 0
          BEGIN
            EXEC dbo.calculate_cell_k_value @barcode = @barcode;
            FETCH NEXT FROM barcode_cursor INTO @barcode;
          END;
          CLOSE barcode_cursor;
          DEALLOCATE barcode_cursor;
        END
      ');
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('dbo.trg_cell_barcode_calculate_k_value', 'TR') IS NOT NULL
        DROP TRIGGER dbo.trg_cell_barcode_calculate_k_value;
      IF OBJECT_ID('dbo.calculate_cell_k_value', 'P') IS NOT NULL
        DROP PROCEDURE dbo.calculate_cell_k_value;
    `);
  }
}
