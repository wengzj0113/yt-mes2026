import { QualityCheck } from './quality-check.entity';

describe('QualityCheck Entity', () => {
  it('should create a quality check with default values', () => {
    const record = new QualityCheck();
    record.batchNo = 'WT26A01MA';
    record.processType = 'coating';
    record.inspectionResult = 1;
    record.inspectorName = '李四';
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.processType).toBe('coating');
    expect(record.inspectionResult).toBe(1);
  });

  it('should support inspectionResult=2 with defect fields', () => {
    const record = new QualityCheck();
    record.inspectionResult = 2;
    record.defectQty = 50;
    record.defectReason = '涂布厚度超标';
    expect(record.inspectionResult).toBe(2);
    expect(record.defectQty).toBe(50);
    expect(record.defectReason).toBe('涂布厚度超标');
  });

  it('should support abnormalRecord', () => {
    const record = new QualityCheck();
    record.abnormalRecord = '设备异常，已停机检修';
    expect(record.abnormalRecord).toBe('设备异常，已停机检修');
  });

  it('should track audit fields', () => {
    const record = new QualityCheck();
    record.createdBy = 1;
    record.updatedBy = 2;
    expect(record.createdBy).toBe(1);
    expect(record.updatedBy).toBe(2);
  });
});
