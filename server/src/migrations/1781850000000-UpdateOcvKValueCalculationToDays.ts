import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOcvKValueCalculationToDays1781850000000 implements MigrationInterface {
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
          ) / (DATEDIFF_BIG(MILLISECOND, cell.ocv1_time, cell.ocv2_time) / 86400000.0) AS DECIMAL(12,4))
          ELSE NULL
        END
        FROM dbo.cell_barcode cell
        WHERE cell.barcode = @barcode;
      END
    `);

    await queryRunner.query(`
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
        ) / (DATEDIFF_BIG(MILLISECOND, cell.ocv1_time, cell.ocv2_time) / 86400000.0) AS DECIMAL(12,4))
        ELSE NULL
      END
      FROM dbo.cell_barcode cell
      WHERE cell.k_value IS NOT NULL
        OR cell.ocv1_voltage IS NOT NULL
        OR cell.ocv2_voltage IS NOT NULL
        OR cell.ocv1_time IS NOT NULL
        OR cell.ocv2_time IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
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
      WHERE cell.k_value IS NOT NULL
        OR cell.ocv1_voltage IS NOT NULL
        OR cell.ocv2_voltage IS NOT NULL
        OR cell.ocv1_time IS NOT NULL
        OR cell.ocv2_time IS NOT NULL;
    `);
  }
}

