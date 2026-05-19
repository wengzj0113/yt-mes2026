import { SortingRecord } from './sorting-record.entity';

describe('SortingRecord Entity', () => {
  it('should create a sorting record with default values', () => {
    const record = new SortingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'SR-001';
    record.ocvVoltageRange = '3.0-3.2V';
    record.irRange = '1.5-2.0mΩ';
    record.capacityRange = '2800-3000mAh';
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should allow record to be voided', () => {
    const record = new SortingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new SortingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
