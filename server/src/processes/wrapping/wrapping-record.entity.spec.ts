import { WrappingRecord } from './wrapping-record.entity';

describe('WrappingRecord Entity', () => {
  it('should create a wrapping record with default values', () => {
    const record = new WrappingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'WP-001';
    record.filmModel = '铝塑膜-115';
    record.shrinkTemperature = 180;
    record.operatorName = '张三';
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new WrappingRecord();
    record.appearanceCheck = 1;
    expect(record.appearanceCheck).toBe(1);
  });

  it('should allow record to be voided', () => {
    const record = new WrappingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new WrappingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
