import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSortingRangeMinMax1779500000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 范围字段拆分为 min/max 数值列，旧字符串列保留以兼容历史数据
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ocv_voltage_min')
                ALTER TABLE sorting_record ADD ocv_voltage_min DECIMAL(10,4) NULL;
        `);
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ocv_voltage_max')
                ALTER TABLE sorting_record ADD ocv_voltage_max DECIMAL(10,4) NULL;
        `);
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ir_min')
                ALTER TABLE sorting_record ADD ir_min DECIMAL(10,4) NULL;
        `);
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ir_max')
                ALTER TABLE sorting_record ADD ir_max DECIMAL(10,4) NULL;
        `);
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'capacity_min')
                ALTER TABLE sorting_record ADD capacity_min DECIMAL(10,4) NULL;
        `);
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'capacity_max')
                ALTER TABLE sorting_record ADD capacity_max DECIMAL(10,4) NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ocv_voltage_max')
                ALTER TABLE sorting_record DROP COLUMN ocv_voltage_max;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ocv_voltage_min')
                ALTER TABLE sorting_record DROP COLUMN ocv_voltage_min;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ir_max')
                ALTER TABLE sorting_record DROP COLUMN ir_max;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'ir_min')
                ALTER TABLE sorting_record DROP COLUMN ir_min;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'capacity_max')
                ALTER TABLE sorting_record DROP COLUMN capacity_max;
        `);
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorting_record') AND name = 'capacity_min')
                ALTER TABLE sorting_record DROP COLUMN capacity_min;
        `);
    }
}
