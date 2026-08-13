import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOcvFieldsToCellBarcode1781810000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_voltage')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv1_voltage DECIMAL(12,4) NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_resistance')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv1_resistance DECIMAL(12,2) NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_time')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv1_time DATETIME2 NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_equipment_code')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv1_equipment_code NVARCHAR(64) NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_voltage')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv2_voltage DECIMAL(12,4) NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_resistance')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv2_resistance DECIMAL(12,2) NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_time')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv2_time DATETIME2 NULL;
            END
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_equipment_code')
            BEGIN
                ALTER TABLE cell_barcode ADD ocv2_equipment_code NVARCHAR(64) NULL;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_equipment_code')
                ALTER TABLE cell_barcode DROP COLUMN ocv2_equipment_code;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_time')
                ALTER TABLE cell_barcode DROP COLUMN ocv2_time;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_resistance')
                ALTER TABLE cell_barcode DROP COLUMN ocv2_resistance;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv2_voltage')
                ALTER TABLE cell_barcode DROP COLUMN ocv2_voltage;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_equipment_code')
                ALTER TABLE cell_barcode DROP COLUMN ocv1_equipment_code;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_time')
                ALTER TABLE cell_barcode DROP COLUMN ocv1_time;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_resistance')
                ALTER TABLE cell_barcode DROP COLUMN ocv1_resistance;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'ocv1_voltage')
                ALTER TABLE cell_barcode DROP COLUMN ocv1_voltage;
        `);
    }
}