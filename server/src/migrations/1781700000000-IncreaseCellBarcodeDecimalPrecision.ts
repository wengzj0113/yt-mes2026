import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseCellBarcodeDecimalPrecision1781700000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 增加 cell_barcode 表中 voltage, internal_resistance, k_value 字段的精度
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'voltage')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN voltage DECIMAL(12,4) NULL;
            END
        `);

        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'internal_resistance')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN internal_resistance DECIMAL(12,2) NULL;
            END
        `);

        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'k_value')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN k_value DECIMAL(12,4) NULL;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 还原精度
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'voltage')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN voltage DECIMAL(6,4) NULL;
            END
        `);

        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'internal_resistance')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN internal_resistance DECIMAL(6,2) NULL;
            END
        `);

        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'k_value')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN k_value DECIMAL(6,4) NULL;
            END
        `);
    }
}
