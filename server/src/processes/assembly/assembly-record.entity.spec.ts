import { AssemblyRecord } from './assembly-record.entity';

describe('AssemblyRecord Entity', () => {
  it('should create an assembly record with default values', () => {
    const record = new AssemblyRecord();
    record.batchNo = 'WT26A01MA';
    record.casingEquipmentCode = 'CS-001';
    record.shellModel = 'SUS-18650';
    record.bottomWeldEquipment = 'BW-001';
    record.bottomWeldParams = '1.5kA/50ms';
    record.capModel = 'CAP-18650';
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new AssemblyRecord();
    record.bottomWeldPull = 50.0;
    expect(record.bottomWeldPull).toBe(50.0);
  });

  it('should allow record to be voided', () => {
    const record = new AssemblyRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new AssemblyRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
