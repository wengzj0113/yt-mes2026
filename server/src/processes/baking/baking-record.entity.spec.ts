import { BakingRecord } from './baking-record.entity';

describe('BakingRecord Entity', () => {
  it('should create a baking record with default values', () => {
    const record = new BakingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'BK-001';
    record.bakingTemperature = 85.0;
    record.bakingDuration = 480;
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new BakingRecord();
    record.vacuumLevel = -0.095;
    expect(record.vacuumLevel).toBe(-0.095);
  });

  it('should allow record to be voided', () => {
    const record = new BakingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new BakingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
