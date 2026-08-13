import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CellBarcodeService } from './cell-barcode.service';
import { CellBarcode } from './cell-barcode.entity';
import { Batch } from '../batch/batch.entity';
import { ProcessStatusService } from '../processes/process-status/process-status.service';
import { Ocv1Record } from '../processes/ocv/ocv1-record.entity';
import { Ocv2Record } from '../processes/ocv/ocv2-record.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CellBarcodeService', () => {
  let service: CellBarcodeService;
  let repo: Record<string, jest.Mock> & { manager?: any };
  let batchRepo: Record<string, jest.Mock>;
  let mockProcessStatus: Record<string, jest.Mock>;
  let manager: Record<string, jest.Mock>;

  const mockCell: CellBarcode = {
    id: 1,
    barcode: 'AB011SP120000001',
    batchNo: 'WT26A01MA',
    sortingRecordId: null,
    voltage: 3.9540,
    internalResistance: 21.50,
    capacity: '2600-2650',
    grade: 'A',
    kValue: null,
    sortingTime: null,
    importSource: 'sorter',
    importedAt: new Date(),
    createdAt: new Date(),
    ocv1Voltage: null,
    ocv1Resistance: null,
    ocv1Time: null,
    ocv1EquipmentCode: null,
    ocv2Voltage: null,
    ocv2Resistance: null,
    ocv2Time: null,
    ocv2EquipmentCode: null,
  };

  const mockBatch = {
    batchNo: 'WT26A01MA',
    status: 2,
  };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn() };
    manager = { find: jest.fn(), create: jest.fn(), save: jest.fn() };
    repo.manager = { transaction: jest.fn((callback: (tx: typeof manager) => unknown) => callback(manager)) };
    batchRepo = { findOne: jest.fn(), find: jest.fn() };
    mockProcessStatus = { getProcessRecords: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CellBarcodeService,
        { provide: getRepositoryToken(CellBarcode), useValue: repo },
        { provide: getRepositoryToken(Batch), useValue: batchRepo },
        { provide: getRepositoryToken(Ocv1Record), useValue: {} },
        { provide: getRepositoryToken(Ocv2Record), useValue: {} },
        { provide: ProcessStatusService, useValue: mockProcessStatus },
        { provide: 'CACHE_MANAGER', useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    service = module.get<CellBarcodeService>(CellBarcodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sorterUpload', () => {
    const uploadDto = {
      batchNo: 'WT26A01MA',
      barcode: 'CELL001',
      capacity: 2660 as any, // 传入数值，测试自动转换
      voltage: 3.95,
      resistance: 21.5, // 传入 resistance 别名
      kValue: 0.12,
      grade: 'A',
      sortingTime: '2026-05-15T10:00:00Z',
    };

    it('should save sorter data successfully', async () => {
      batchRepo.findOne.mockResolvedValue(mockBatch);
      batchRepo.find.mockResolvedValue([{ batchNo: 'WT26A01MA' }]);
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ ...mockCell, barcode: 'CELL001', capacity: '2660', internalResistance: 21.5 });
      repo.save.mockResolvedValue({ ...mockCell, barcode: 'CELL001', capacity: '2660', internalResistance: 21.5 });

      const result = await service.sorterUpload(uploadDto);
      expect(result.barcode).toBe('CELL001');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        barcode: 'CELL001',
        internalResistance: 21.5,
        kValue: 0.12,
      }));
      expect(repo.save).toHaveBeenCalled();
    });

    it('should clamp overflow values to 10001', async () => {
      batchRepo.findOne.mockResolvedValue(mockBatch);
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      const overflowDto = {
        batchNo: 'WT26A01MA',
        barcode: 'CELL002',
        capacity: 2660 as any,
        voltage: 1000000000, // 超大数值
        resistance: 1000000000000, // 超大数值
        kValue: 1000000000, // 超大数值
        grade: '22',
        sortingTime: '2026-06-16T17:34:01Z',
      };

      const result = await service.sorterUpload(overflowDto);
      expect(result.voltage).toBe(10001);
      expect(result.internalResistance).toBe(10001);
      expect(result.kValue).toBe(10001);
    });

    it('should update existing record when barcode already exists', async () => {
      batchRepo.findOne.mockResolvedValue(mockBatch);
      const existingRecord = { ...mockCell, barcode: 'CELL001', capacity: '2000' };
      repo.findOne.mockResolvedValue(existingRecord);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.sorterUpload(uploadDto);
      expect(result.barcode).toBe('CELL001');
      expect(result.capacity).toBe(2660 as any); // 覆盖更新
      expect(repo.save).toHaveBeenCalledWith(existingRecord);
    });
  });

  describe('bulkSorterUpload', () => {
    it('should save multiple sorter records successfully', async () => {
      const dto = {
        cells: [
          { batchNo: 'WT26A01MA', barcode: 'C01', capacity: '2600-2650' },
          { batchNo: 'WT26A01MA', barcode: 'C02', capacity: '2600-2650' }
        ]
      };
      batchRepo.findOne.mockResolvedValue(mockBatch);
      batchRepo.find.mockResolvedValue([{ batchNo: 'WT26A01MA' }]);
      repo.findOne.mockResolvedValue(null);
      repo.find.mockResolvedValue([]);
      repo.create.mockImplementation((x) => x);
      repo.save.mockResolvedValue(dto.cells as any);

      const result = await service.bulkSorterUpload(dto as any);
      expect(result).toHaveLength(2);
      expect(repo.create).toHaveBeenCalledTimes(2);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('should update existing records in bulk upload', async () => {
      const dto = {
        cells: [
          { batchNo: 'WT26A01MA', barcode: 'C01', capacity: '2600-2650' },
          { batchNo: 'WT26A01MA', barcode: 'C02', capacity: '2600-2650' }
        ]
      };
      batchRepo.findOne.mockResolvedValue(mockBatch);
      batchRepo.find.mockResolvedValue([{ batchNo: 'WT26A01MA' }]);
      
      const existingCell = { ...mockCell, barcode: 'C01', capacity: '2000' };
      repo.find.mockResolvedValue([existingCell]); // C01 已存在，C02 不存在
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      const result = await service.bulkSorterUpload(dto as any);
      expect(result).toHaveLength(2);
      expect(result[0].barcode).toBe('C01');
      expect(result[0].capacity).toBe('2600-2650'); // 覆盖更新
      expect(result[1].barcode).toBe('C02');
      expect(result[1].capacity).toBe('2600-2650'); // 新建
    });
  });

  describe('trace', () => {
    it('should return cell with batch info and process records', async () => {
      const mockProcesses = {
        batching: { positiveMaterial: 'NCM-811' },
        coating: null,
      };
      repo.findOne.mockResolvedValue(mockCell);
      batchRepo.findOne.mockResolvedValue(mockBatch);
      mockProcessStatus.getProcessRecords.mockResolvedValue(mockProcesses);

      const result: any = await service.trace('AB011SP120000001');

      expect(result.cell.barcode).toBe('AB011SP120000001');
      expect(result.cell.batchNo).toBe('WT26A01MA');
      expect(result.batch.batchNo).toBe('WT26A01MA');
      expect(result.processes.batching).toEqual({ positiveMaterial: 'NCM-811' });
      expect(result.processes.coating).toBeNull();
      expect(mockProcessStatus.getProcessRecords).toHaveBeenCalledWith('WT26A01MA');
    });

    it('should throw when barcode not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.trace('NONEXISTENT')).rejects.toThrow(NotFoundException);
      expect(batchRepo.findOne).not.toHaveBeenCalled();
      expect(mockProcessStatus.getProcessRecords).not.toHaveBeenCalled();
    });

    it('should return null batch info when batch is missing', async () => {
      repo.findOne.mockResolvedValue(mockCell);
      batchRepo.findOne.mockResolvedValue(null);

      const result: any = await service.trace('AB011SP120000001');
      expect(result.cell).toEqual(mockCell);
      expect(result.batch).toBeNull();
    });
  });

  describe('OCV uploads', () => {
    it('does not accept an externally supplied OCV2 K value', async () => {
      batchRepo.findOne.mockResolvedValue(mockBatch);
      manager.find.mockResolvedValueOnce([mockBatch]).mockResolvedValueOnce([]);
      manager.create.mockImplementation((_entity: unknown, value: unknown) => value);
      manager.save.mockImplementation((_entity: unknown, value: unknown[]) => Promise.resolve(value));

      const result = await service.ocv2Upload({
        batchNo: 'WT26A01MA',
        barcode: 'CELL-OCV2',
        voltage: 3.2,
        internalResistance: 20,
        testTime: '2026-08-06T10:00:00Z',
        kValue: 999,
      });

      expect(result[0].kValue).toBeNull();
    });
  });

  describe('findByBatch', () => {
    it('should return paginated barcodes for batch', async () => {
      repo.find.mockResolvedValue([mockCell]);
      repo.count.mockResolvedValue(1);
      const result = await service.findByBatch('WT26A01MA', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should return empty result for non-existent batch', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const result = await service.findByBatch('NONEXISTENT', 1, 20);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
