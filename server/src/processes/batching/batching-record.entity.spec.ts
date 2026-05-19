import { BatchingRecord } from './batching-record.entity';

describe('BatchingRecord Entity', () => {
  it('should create a batching record with default values', () => {
    const record = new BatchingRecord();
    record.batchNo = 'WT26A01MA';
    record.positiveMaterial = 'NCM-811';
    record.negativeMaterial = 'Graphite-A';
    record.operatorName = '张三';

    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.recordStatus).toBe(1);
    expect(record.isDraft).toBe(true);
  });

  it('should support quality fields', () => {
    const record = new BatchingRecord();
    record.viscosityRecord = '粘度 3200mPa·s，出料正常';

    expect(record.viscosityRecord).toBe('粘度 3200mPa·s，出料正常');
  });

  it('should allow record to be voided', () => {
    const record = new BatchingRecord();
    record.recordStatus = 2;
    expect(record.recordStatus).toBe(2);
  });

  it('should be submittable (isDraft=false)', () => {
    const record = new BatchingRecord();
    record.isDraft = false;
    expect(record.isDraft).toBe(false);
  });
});
