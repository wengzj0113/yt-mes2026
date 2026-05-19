import { WindingRecord } from './winding-record.entity';

describe('WindingRecord Entity', () => {
  it('should create a winding record with default values', () => {
    const record = new WindingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'WD-001';
    record.separatorModel = 'PP-20um';
    record.windingSpeed = 12.5;
    record.windingTension = 8.0;
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new WindingRecord();
    record.coreThickness = 5.5;
    expect(record.coreThickness).toBe(5.5);
  });

  it('should allow record to be voided', () => {
    const record = new WindingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new WindingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
