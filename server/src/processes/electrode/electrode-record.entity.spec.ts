import { ElectrodeRecord } from './electrode-record.entity';

describe('ElectrodeRecord Entity', () => {
  it('should create an electrode record with default values', () => {
    const record = new ElectrodeRecord();
    record.batchNo = 'WT26A01MA';
    record.tabMaterialSpec = 'Nickel-Plated Steel';
    record.electrodeLength = '500mm';
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new ElectrodeRecord();
    record.tabWeldingPull = '50N';
    expect(record.tabWeldingPull).toBe('50N');
  });

  it('should allow record to be voided', () => {
    const record = new ElectrodeRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new ElectrodeRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
