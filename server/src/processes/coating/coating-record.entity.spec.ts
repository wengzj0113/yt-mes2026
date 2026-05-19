import { CoatingRecord } from './coating-record.entity';

describe('CoatingRecord Entity', () => {
  it('should create a coating record with default values', () => {
    const record = new CoatingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'CT-001';
    record.coatingSpeed = 12.5;
    record.coatingThicknessPos = 150.0;
    record.coatingThicknessNeg = 148.0;
    record.arealDensityPos = 180.0;
    record.arealDensityNeg = 178.0;
    record.coatingTemperature = 85.0;
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should allow record to be voided', () => {
    const record = new CoatingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new CoatingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
