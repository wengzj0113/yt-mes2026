import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSysRole1781900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('dbo.sys_role', 'U') IS NULL
      CREATE TABLE dbo.sys_role (
        code INT NOT NULL PRIMARY KEY,
        name NVARCHAR(64) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL,
        is_system BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
      );
    `);

    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.sys_role WHERE code = 1)
      INSERT INTO dbo.sys_role (code, name, description, is_system) VALUES (1, N'操作员', N'生产线操作，工序录入', 1);
      IF NOT EXISTS (SELECT 1 FROM dbo.sys_role WHERE code = 2)
      INSERT INTO dbo.sys_role (code, name, description, is_system) VALUES (2, N'质检员', N'质量控制，巡检检验', 1);
      IF NOT EXISTS (SELECT 1 FROM dbo.sys_role WHERE code = 3)
      INSERT INTO dbo.sys_role (code, name, description, is_system) VALUES (3, N'仓管员', N'仓库管理，物料出入库', 1);
      IF NOT EXISTS (SELECT 1 FROM dbo.sys_role WHERE code = 4)
      INSERT INTO dbo.sys_role (code, name, description, is_system) VALUES (4, N'系统管理员', N'系统管理员，拥有全部权限', 1);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS dbo.sys_role;`);
  }
}