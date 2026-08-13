import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApiTypeToSorterApiLog1781800000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorter_api_log') AND name = 'api_type')
            BEGIN
                ALTER TABLE sorter_api_log ADD api_type NVARCHAR(16) NULL;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('sorter_api_log') AND name = 'api_type')
            BEGIN
                ALTER TABLE sorter_api_log DROP COLUMN api_type;
            END
        `);
    }
}