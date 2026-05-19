import { FormationRecord } from './formation-record.entity';

describe('FormationRecord Entity', () => {
  it('should create a formation record with default values', () => {
    const record = new FormationRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'FM-001';
    record.operatorName = '张三';
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new FormationRecord();
    record.chargeDischargeTemplate = '化成工步-01';
    record.formationTemperature = 45.0;
    expect(record.chargeDischargeTemplate).toBe('化成工步-01');
    expect(record.formationTemperature).toBe(45.0);
  });

  it('should allow record to be voided', () => {
    const record = new FormationRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new FormationRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
