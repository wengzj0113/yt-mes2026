import { SlittingRecord } from './slitting-record.entity';

describe('SlittingRecord Entity', () => {
  it('should create a slitting record with default values', () => {
    const record = new SlittingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'SL-001';
    record.electrodeWidth = 150.0;
    record.electrodeLength = 3000.0;
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should allow record to be voided', () => {
    const record = new SlittingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new SlittingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
