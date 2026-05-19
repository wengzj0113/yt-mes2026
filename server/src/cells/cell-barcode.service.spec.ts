import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CellBarcodeService } from './cell-barcode.service';
import { CellBarcode } from './cell-barcode.entity';
import { Batch } from '../batch/batch.entity';
import { ProcessStatusService } from '../processes/process-status/process-status.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CellBarcodeService', () => {
  let service: CellBarcodeService;
  let repo: Record<string, jest.Mock>;
  let batchRepo: Record<string, jest.Mock>;
  let mockProcessStatus: Record<string, jest.Mock>;

  const mockCell: CellBarcode = {
    id: 1,
    barcode: 'AB011SP120000001',
    batchNo: 'WT26A01MA',
    sortingRecordId: null,
    voltage: 3.9540,
    internalResistance: 21.50,
    capacity: 2050.00,
    grade: 'A',
    kValue: null,
    sortingTime: null,
    importSource: 'sorter',
    importedAt: new Date(),
    createdAt: new Date(),
  };

  const mockBatch = {
    batchNo: 'WT26A01MA',
    status: 2,
  };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn() };
    batchRepo = { findOne: jest.fn() };
    mockProcessStatus = { getProcessRecords: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CellBarcodeService,
        { provide: getRepositoryToken(CellBarcode), useValue: repo },
        { provide: getRepositoryToken(Batch), useValue: batchRepo },
        { provide: ProcessStatusService, useValue: mockProcessStatus },
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
      capacity: 2000,
      voltage: 3.95,
      internalResistance: 21.5,
      kValue: 0.12,
      grade: 'A',
      sortingTime: '2026-05-15T10:00:00Z',
    };

    it('should save sorter data successfully', async () => {
      batchRepo.findOne.mockResolvedValue(mockBatch);
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ ...mockCell, barcode: 'CELL001' });
      repo.save.mockResolvedValue({ ...mockCell, barcode: 'CELL001' });

      const result = await service.sorterUpload(uploadDto);
      expect(result.barcode).toBe('CELL001');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        barcode: 'CELL001',
        kValue: 0.12,
      }));
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('bulkSorterUpload', () => {
    it('should save multiple sorter records successfully', async () => {
      const dto = {
        cells: [
          { batchNo: 'WT26A01MA', barcode: 'C01', capacity: 2000 },
          { batchNo: 'WT26A01MA', barcode: 'C02', capacity: 2010 }
        ]
      };
      batchRepo.findOne.mockResolvedValue(mockBatch);
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((x) => x);
      repo.save.mockResolvedValue(dto.cells as any);

      const result = await service.bulkSorterUpload(dto as any);
      expect(result).toHaveLength(2);
      expect(repo.create).toHaveBeenCalledTimes(2);
      expect(repo.save).toHaveBeenCalledTimes(1);
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
