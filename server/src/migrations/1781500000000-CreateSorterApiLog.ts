import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSorterApiLog1781500000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sorter_api_log')
            CREATE TABLE sorter_api_log (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                api_endpoint    NVARCHAR(128)   NOT NULL,
                method          NVARCHAR(10)    NOT NULL,
                request_body    NVARCHAR(MAX)   NULL,
                response_body   NVARCHAR(MAX)   NULL,
                status_code     INT             NOT NULL,
                is_success      BIT             NOT NULL,
                error_message   NVARCHAR(MAX)   NULL,
                ip              NVARCHAR(64)    NULL,
                duration        INT             NULL,
                created_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sorter_api_log')
            DROP TABLE sorter_api_log
        `);
    }
}
