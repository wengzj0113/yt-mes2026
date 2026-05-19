import { CellBarcode } from './cell-barcode.entity';

describe('CellBarcode Entity', () => {
  it('should create a cell barcode record', () => {
    const record = new CellBarcode();
    record.barcode = 'AB011SP120000001';
    record.batchNo = 'WT26A01MA';
    record.importSource = 'sorter';
    expect(record.barcode).toBe('AB011SP120000001');
    expect(record.batchNo).toBe('WT26A01MA');
    expect(record.importSource).toBe('sorter');
  });

  it('should support voltage, resistance, capacity fields', () => {
    const record = new CellBarcode();
    record.voltage = 3.9540;
    record.internalResistance = 21.50;
    record.capacity = 2050.00;
    expect(record.voltage).toBe(3.9540);
    expect(record.internalResistance).toBe(21.50);
    expect(record.capacity).toBe(2050.00);
  });

  it('should support grade field', () => {
    const record = new CellBarcode();
    record.grade = 'A';
    expect(record.grade).toBe('A');
  });

  it('should have importedAt timestamp', () => {
    const record = new CellBarcode();
    record.importedAt = new Date();
    expect(record.importedAt).toBeInstanceOf(Date);
  });

  it('should support kValue and sortingTime fields', () => {
    const record = new CellBarcode();
    record.kValue = 0.1234;
    record.sortingTime = new Date('2026-05-15T10:00:00Z');
    expect(record.kValue).toBe(0.1234);
    expect(record.sortingTime).toBeInstanceOf(Date);
  });
});
