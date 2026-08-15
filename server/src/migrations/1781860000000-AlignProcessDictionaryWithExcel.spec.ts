import { AlignProcessDictionaryWithExcel1781860000000 } from './1781860000000-AlignProcessDictionaryWithExcel';

describe('AlignProcessDictionaryWithExcel migration', () => {
  it('preserves existing configuration values while syncing Excel field structure', async () => {
    const queryRunner = {
      query: jest.fn()
        .mockResolvedValueOnce([{
          process_code: 'batching',
          field_definitions: JSON.stringify([
            { key: 'positiveActiveMaterial', label: '旧名称', type: 'text', min: 1, max: 9, defaultValue: 'NCM-OLD' },
          ]),
        }])
        .mockResolvedValue([]),
    } as any;

    await new AlignProcessDictionaryWithExcel1781860000000().up(queryRunner);

    const statements: string[] = queryRunner.query.mock.calls.map(([sql]: [string]) => sql);
    const batchingStatement = statements.find((sql) => sql.includes("process_code = 'batching'"));
    expect(batchingStatement).toContain('正极活性材料');
    expect(batchingStatement).toContain('"min":1');
    expect(batchingStatement).toContain('"max":9');
    expect(batchingStatement).toContain('NCM-OLD');
    expect(statements.some((sql) => sql.includes("process_code = 'casing'"))).toBe(true);
  });

  it('does not generate obsolete ordinary fields from the existing dictionary', async () => {
    const queryRunner = {
      query: jest.fn()
        .mockResolvedValueOnce([{
          process_code: 'batching',
          field_definitions: JSON.stringify([
            { key: 'positiveActiveMaterial', label: '正极活性材料', type: 'text' },
            { key: 'equipmentCode', label: '旧设备编号', type: 'text', isSystem: true },
            { key: 'OP', label: '旧操作员', type: 'text' },
          ]),
        }])
        .mockResolvedValue([]),
    } as any;

    await new AlignProcessDictionaryWithExcel1781860000000().up(queryRunner);

    const batchingStatement = queryRunner.query.mock.calls
      .map(([sql]: [string]) => sql)
      .find((sql: string) => sql.includes("process_code = 'batching'"));
    expect(batchingStatement).not.toContain('equipmentCode');
    expect(batchingStatement).not.toContain('旧操作员');
  });
});
