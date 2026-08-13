import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProcessParameterTable1781830000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('process_parameter', 'U') IS NULL
      BEGIN
        CREATE TABLE process_parameter (
          id INT IDENTITY(1,1) PRIMARY KEY,
          batch_no NVARCHAR(16) NOT NULL,
          process_code NVARCHAR(16) NOT NULL,
          equipment_code NVARCHAR(64) NOT NULL,
          ocv_voltage_min DECIMAL(12,4) NOT NULL,
          ocv_voltage_max DECIMAL(12,4) NOT NULL,
          ir_min DECIMAL(12,4) NOT NULL,
          ir_max DECIMAL(12,4) NOT NULL,
          capacity_min DECIMAL(12,4) NOT NULL,
          capacity_max DECIMAL(12,4) NOT NULL,
          operator_name NVARCHAR(64) NOT NULL,
          created_by INT NULL,
          created_at DATETIME2 NOT NULL CONSTRAINT DF_process_parameter_created_at DEFAULT SYSUTCDATETIME(),
          updated_by INT NULL,
          updated_at DATETIME2 NOT NULL CONSTRAINT DF_process_parameter_updated_at DEFAULT SYSUTCDATETIME()
        );
        CREATE UNIQUE INDEX UQ_process_parameter_batch_process ON process_parameter(batch_no, process_code);
      END
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`IF OBJECT_ID('process_parameter', 'U') IS NOT NULL DROP TABLE process_parameter`);
  }
}
