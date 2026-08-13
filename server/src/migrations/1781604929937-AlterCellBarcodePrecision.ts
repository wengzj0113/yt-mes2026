import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterCellBarcodePrecision1781604929937 implements MigrationInterface {
    name = 'AlterCellBarcodePrecision1781604929937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cell_barcode" ALTER COLUMN "voltage" decimal(10,4)`);
        await queryRunner.query(`ALTER TABLE "cell_barcode" ALTER COLUMN "internal_resistance" decimal(10,2)`);
        await queryRunner.query(`ALTER TABLE "cell_barcode" ALTER COLUMN "k_value" decimal(10,4)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cell_barcode" ALTER COLUMN "k_value" decimal(6,4)`);
        await queryRunner.query(`ALTER TABLE "cell_barcode" ALTER COLUMN "internal_resistance" decimal(6,2)`);
        await queryRunner.query(`ALTER TABLE "cell_barcode" ALTER COLUMN "voltage" decimal(6,4)`);
    }

}
