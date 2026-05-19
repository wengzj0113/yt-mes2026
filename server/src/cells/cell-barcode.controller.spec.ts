import { Test, TestingModule } from '@nestjs/testing';
import { CellBarcodeController } from './cell-barcode.controller';
import { CellBarcodeService } from './cell-barcode.service';

describe('CellBarcodeController', () => {
  let controller: CellBarcodeController;
  let service: jest.Mocked<Partial<CellBarcodeService>>;

  const mockCell = {
    id: 1,
    barcode: 'AB011SP120000001',
    batchNo: 'WT26A01MA',
    sortingRecordId: null,
    voltage: 3.9540,
    internalResistance: 21.50,
    capacity: 2050.00,
    grade: 'A',
    importSource: 'sorter',
    importedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    service = { trace: jest.fn(), findByBatch: jest.fn(), sorterUpload: jest.fn(), bulkSorterUpload: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CellBarcodeController],
      providers: [{ provide: CellBarcodeService, useValue: service }],
    }).compile();
    controller = module.get<CellBarcodeController>(CellBarcodeController);
  });

  it('should handle sorter upload', async () => {
    const dto = { batchNo: 'WT26A01MA', barcode: 'CELL001' };
    (service.sorterUpload as jest.Mock).mockResolvedValue(mockCell);
    const result = await controller.sorterUpload(dto as any);
    expect(service.sorterUpload).toHaveBeenCalledWith(dto);
    expect(result.message).toBe('分选数据接收成功');
  });

  it('should handle bulk sorter upload', async () => {
    const dto = { cells: [{ batchNo: 'WT26A01MA', barcode: 'CELL001' }] };
    (service.bulkSorterUpload as jest.Mock).mockResolvedValue([mockCell]);
    const result = await controller.bulkSorterUpload(dto as any);
    expect(service.bulkSorterUpload).toHaveBeenCalledWith(dto);
    expect(result.message).toBe('批量分选数据接收成功');
    expect(result.data).toHaveLength(1);
  });

  it('should trace a barcode', async () => {
    const traceResult = { cell: mockCell, batch: null, processes: {} };
    (service.trace as jest.Mock).mockResolvedValue(traceResult);
    const result = await controller.trace('AB011SP120000001');
    expect(result.data.cell.barcode).toBe('AB011SP120000001');
    expect(result.data.processes).toEqual({});
  });

  it('should return barcodes by batch', async () => {
    const paginatedResult = { data: [mockCell], total: 1, page: 1, pageSize: 20 };
    (service.findByBatch as jest.Mock).mockResolvedValue(paginatedResult);
    const result = await controller.findByBatch('WT26A01MA', 1, 20);
    expect(result.data).toHaveLength(1);
    expect(result.meta!.total).toBe(1);
  });

  it('should return empty when no barcodes in batch', async () => {
    const paginatedResult = { data: [], total: 0, page: 1, pageSize: 20 };
    (service.findByBatch as jest.Mock).mockResolvedValue(paginatedResult);
    const result = await controller.findByBatch('NONEXISTENT', 1, 20);
    expect(result.data).toEqual([]);
    expect(result.meta!.total).toBe(0);
  });
});
