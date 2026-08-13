import { MigrationInterface, QueryRunner } from 'typeorm';
import { PROCESS_BASELINE } from '../master-data/process-baseline';

export class AlignProcessDictionaryWithExcel1781860000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const definition of PROCESS_BASELINE) {
      const fieldDefinitions = JSON.stringify(definition.fieldDefinitions).replace(/'/g, "''");
      const processName = definition.processName.replace(/'/g, "''");
      await queryRunner.query(`
        IF EXISTS (SELECT 1 FROM process_dictionary WHERE process_code = '${definition.processCode}')
          UPDATE process_dictionary
          SET process_name = N'${processName}', sort_order = ${definition.sortOrder}, is_active = 1,
              field_definitions = N'${fieldDefinitions}', updated_at = SYSUTCDATETIME()
          WHERE process_code = '${definition.processCode}'
        ELSE
          INSERT INTO process_dictionary (process_code, process_name, sort_order, is_active, field_definitions, created_at, updated_at)
          VALUES ('${definition.processCode}', N'${processName}', ${definition.sortOrder}, 1, N'${fieldDefinitions}', SYSUTCDATETIME(), SYSUTCDATETIME())
      `);
    }
    await queryRunner.query(`UPDATE process_dictionary SET is_active = 0, updated_at = SYSUTCDATETIME() WHERE process_code IN ('formation', 'grading')`);
  }

  async down(): Promise<void> {
    // Process definitions are user-visible configuration; reverting must not delete them or historical records.
  }
}
