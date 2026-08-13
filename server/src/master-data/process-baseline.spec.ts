import { PROCESS_BASELINE, getProcessBaseline } from './process-baseline';

describe('Excel process parameter baseline', () => {
  it('defines the approved ordinary process order including the three new processes', () => {
    expect(PROCESS_BASELINE.map((item) => item.processName)).toEqual([
      '配料', '涂布', '辊压', '分切', '制片', '卷绕', '装配', '入壳',
      '一体机', '激光焊接', '烘烤', '注液', '封口', '分选',
    ]);
    expect(PROCESS_BASELINE.map((item) => item.sortOrder)).toEqual(
      Array.from({ length: 14 }, (_, index) => (index + 1) * 10),
    );
    expect(getProcessBaseline('casing')?.processName).toBe('入壳');
    expect(getProcessBaseline('integrated-machine')?.processName).toBe('一体机');
    expect(getProcessBaseline('laser-welding')?.processName).toBe('激光焊接');
  });

  it('contains only Excel fields and excludes section headings', () => {
    const allFields = PROCESS_BASELINE.flatMap((item) => item.fieldDefinitions);
    expect(allFields.some((field) => field.label === '设备信息')).toBe(false);
    expect(allFields.some((field) => field.label === '操作员')).toBe(true);
    expect(getProcessBaseline('coating')?.fieldDefinitions).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '正极涂布速度', unit: 'm/min', type: 'number' }),
      expect.objectContaining({ label: '负极片涂层长度2', unit: 'mm', type: 'number' }),
    ]));
  });

  it('keeps封口化成/分容 fields together and maps OCV shipment fields to sorting', () => {
    const sealingLabels = getProcessBaseline('wrapping')?.fieldDefinitions.map((field) => field.label);
    expect(sealingLabels).toEqual(expect.arrayContaining(['化成模板', '化成温度', '分容模板', '分容温度', '容量分级标准']));
    expect(getProcessBaseline('sorting')?.fieldDefinitions.map((field) => field.label)).toEqual([
      '内阻电压范围（内阻）', '内阻电压范围（电压）', '容量范围', '操作员',
    ]);
  });

  it('does not create duplicate field keys within a process', () => {
    for (const process of PROCESS_BASELINE) {
      const keys = process.fieldDefinitions.map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
