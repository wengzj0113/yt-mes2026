import { RollerPressingRecord } from './roller-pressing-record.entity';

describe('RollerPressingRecord Entity', () => {
  it('should create a roller pressing record with default values', () => {
    const record = new RollerPressingRecord();
    record.batchNo = 'WT26A01MA';
    record.equipmentCode = 'RP-001';
    record.rollerPressure = 12.5;
    record.rollerThickness = 0.25;
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should allow record to be voided', () => {
    const record = new RollerPressingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new RollerPressingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
