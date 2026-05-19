import { InjectionRecord } from './injection-record.entity';

describe('InjectionRecord Entity', () => {
  it('should create an injection record with default values', () => {
    const record = new InjectionRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'IJ-001';
    record.operatorName = '张三';
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new InjectionRecord();
    record.injectionAmount = 5.5;
    expect(record.injectionAmount).toBe(5.5);
  });

  it('should allow record to be voided', () => {
    const record = new InjectionRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new InjectionRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
