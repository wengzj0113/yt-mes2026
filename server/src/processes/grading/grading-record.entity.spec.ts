import { GradingRecord } from './grading-record.entity';

describe('GradingRecord Entity', () => {
  it('should create a grading record with default values', () => {
    const record = new GradingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'GD-001';
    record.operatorName = '张三';
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new GradingRecord();
    record.chargeDischargeTemplate = '分容工步-01';
    record.gradingTemperature = 25.0;
    record.capacityGradeStandard = 'A级标准';
    expect(record.chargeDischargeTemplate).toBe('分容工步-01');
    expect(record.gradingTemperature).toBe(25.0);
    expect(record.capacityGradeStandard).toBe('A级标准');
  });

  it('should allow record to be voided', () => {
    const record = new GradingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new GradingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
