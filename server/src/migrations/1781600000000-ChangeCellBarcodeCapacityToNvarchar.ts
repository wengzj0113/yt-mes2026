import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCellBarcodeCapacityToNvarchar1781600000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 将 cell_barcode 表的 capacity 字段类型修改为 NVARCHAR(32)
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'capacity')
            BEGIN
                -- 先修改列类型
                ALTER TABLE cell_barcode ALTER COLUMN capacity NVARCHAR(32) NULL;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 将 cell_barcode 表的 capacity 字段类型还原为 DECIMAL(8,2)
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cell_barcode') AND name = 'capacity')
            BEGIN
                ALTER TABLE cell_barcode ALTER COLUMN capacity DECIMAL(8,2) NULL;
            END
        `);
    }
}
