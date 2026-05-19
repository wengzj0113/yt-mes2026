import { MaterialWarehouse } from './material-warehouse.entity';

describe('MaterialWarehouse Entity', () => {
  it('should create a material record with default values', () => {
    const record = new MaterialWarehouse();
    record.batchNo = 'WT26A01MA';
    record.materialType = 1;
    record.supplierBatchNo = 'SUP-001';
    record.quantity = 100.5;
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.materialType).toBe(1);
    expect(record.quantity).toBe(100.5);
    expect(record.unit).toBe('kg');
  });

  it('should support all material types 1-5', () => {
    const record = new MaterialWarehouse();
    record.materialType = 5;
    record.supplierBatchNo = 'SHELL-001';
    expect(record.materialType).toBe(5);
    expect(record.supplierBatchNo).toBe('SHELL-001');
  });

  it('should support custom unit', () => {
    const record = new MaterialWarehouse();
    record.unit = 'm';
    expect(record.unit).toBe('m');
  });

  it('should track audit fields', () => {
    const record = new MaterialWarehouse();
    record.createdBy = 1;
    record.updatedBy = 2;
    expect(record.createdBy).toBe(1);
    expect(record.updatedBy).toBe(2);
  });
});
