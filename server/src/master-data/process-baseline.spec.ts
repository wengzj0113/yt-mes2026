import { hasIncompatibleFieldDefinitions, OCV_PROCESS_FIELDS, PROCESS_BASELINE, getProcessBaseline } from './process-baseline';

describe('Excel process parameter baseline', () => {
  it('excludes superseded assembly from the active baseline', () => {
    expect(PROCESS_BASELINE.some((item) => item.processCode === 'assembly')).toBe(false);
  });

  it('defines the approved ordinary process order including the three new processes', () => {
    expect(PROCESS_BASELINE.map((item) => item.processName)).toEqual([
      '配料', '涂布', '辊压', '分切', '制片', '卷绕', '入壳',
      '一体机', '激光焊接', '烘烤', '注液', '封口', '化成分容', '分选出货（OCV3）',
    ]);
    expect(PROCESS_BASELINE.map((item) => item.sortOrder)).toEqual(
      [10, 20, 30, 40, 50, 60, 80, 90, 100, 110, 120, 130, 140, 160],
    );
    expect(getProcessBaseline('casing')?.processName).toBe('入壳');
    expect(getProcessBaseline('integrated-machine')?.processName).toBe('一体机');
    expect(getProcessBaseline('laser-welding')?.processName).toBe('激光焊接');
  });

  it('contains only Excel fields and excludes section headings', () => {
    const allFields = PROCESS_BASELINE.flatMap((item) => item.fieldDefinitions);
    expect(allFields.some((field) => field.label === '设备信息')).toBe(true);
    expect(allFields.some((field) => field.label === '操作员')).toBe(true);
    expect(getProcessBaseline('coating')?.fieldDefinitions).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '正极涂布速度', unit: 'm/min', type: 'number' }),
      expect.objectContaining({ label: '负极片涂层长度2', unit: 'mm', type: 'number' }),
    ]));
  });

  it('moves 化成分容 fields out of 封口 and maps OCV3 shipment fields to sorting', () => {
    const sealingLabels = getProcessBaseline('wrapping')?.fieldDefinitions.map((field) => field.label);
    expect(sealingLabels).toEqual(['封口肩高', '封口总高', '封口头径', '封口清洗后外观']);
    expect(getProcessBaseline('formation-grading')?.fieldDefinitions.map((field) => field.label)).toEqual(expect.arrayContaining(['化成模板', '化成温度', '分容模板', '分容温度', '容量分级标准']));
    expect(getProcessBaseline('sorting')?.fieldDefinitions.map((field) => field.label)).toEqual([
      '设备信息', '内阻范围', '内阻范围', '容量范围', '操作员',
    ]);
  });

  it('does not create duplicate field keys within a process', () => {
    for (const process of PROCESS_BASELINE) {
      const keys = process.fieldDefinitions.map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('accepts a valid range configuration for an ordinary process field', () => {
    const roller = getProcessBaseline('roller-pressing')!;
    const fields = [{
      ...roller.fieldDefinitions[0],
      type: 'range',
      minKey: 'positiveRollerThicknessMin',
      maxKey: 'positiveRollerThicknessMax',
    }];

    expect(hasIncompatibleFieldDefinitions(JSON.stringify(fields), roller.fieldDefinitions)).toBe(false);
  });

  it('matches the 260814X process structure', () => {
    expect(getProcessBaseline('wrapping')?.fieldDefinitions.map((field) => field.key)).toEqual([
      'sealingShoulderHeight', 'sealingTotalHeight', 'sealingHeadDiameter', 'sealingCleanAppearance',
    ]);
    expect(getProcessBaseline('formation-grading')?.fieldDefinitions.map((field) => field.key)).toEqual([
      'activationDuration', 'filmColor', 'equipmentCode', 'formationTemplate', 'formationTemperature',
      'gradingTemplate', 'gradingTemperature', 'postGradingVoltageRange', 'postGradingInternalResistanceRange',
      'capacityGradeStandard',
    ]);
    expect(getProcessBaseline('sorting')?.processName).toBe('分选出货（OCV3）');
    expect(OCV_PROCESS_FIELDS.map((field) => field.key)).toEqual([
      'ocvVoltageRange', 'irRange', 'capacityRange', 'equipmentCode', 'operatorName',
    ]);
  });
});
