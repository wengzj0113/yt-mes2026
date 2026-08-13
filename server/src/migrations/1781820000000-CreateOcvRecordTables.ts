import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOcvRecordTables1781820000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ocv1_record')
            CREATE TABLE ocv1_record (
                id                  INT             IDENTITY(1,1) PRIMARY KEY,
                batch_no            NVARCHAR(16)    NOT NULL,
                ocv_voltage_min     DECIMAL(12,4)   NULL,
                ocv_voltage_max     DECIMAL(12,4)   NULL,
                equipment_code      NVARCHAR(64)    NULL,
                is_draft            BIT             NOT NULL DEFAULT 1,
                record_status       TINYINT         NOT NULL DEFAULT 1,
                operator_name       NVARCHAR(64)    NULL,
                created_by          INT             NULL,
                created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_by          INT             NULL,
                updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ocv2_record')
            CREATE TABLE ocv2_record (
                id                  INT             IDENTITY(1,1) PRIMARY KEY,
                batch_no            NVARCHAR(16)    NOT NULL,
                ocv_voltage_min     DECIMAL(12,4)   NULL,
                ocv_voltage_max     DECIMAL(12,4)   NULL,
                equipment_code      NVARCHAR(64)    NULL,
                is_draft            BIT             NOT NULL DEFAULT 1,
                record_status       TINYINT         NOT NULL DEFAULT 1,
                operator_name       NVARCHAR(64)    NULL,
                created_by          INT             NULL,
                created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_by          INT             NULL,
                updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ocv1_record')
                DROP TABLE ocv1_record;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ocv2_record')
                DROP TABLE ocv2_record;
        `);
    }
}