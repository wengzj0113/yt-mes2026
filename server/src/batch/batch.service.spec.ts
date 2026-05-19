import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchService } from './batch.service';
import { Batch, BatchStatus } from './batch.entity';
import { ConflictException } from '@nestjs/common';
import { BatchStatusLog } from './batch-status-log.entity';

describe('BatchService', () => {
  let service: BatchService;
  let batchRepo: jest.Mocked<Partial<Repository<Batch>>>;
  let statusLogRepo: jest.Mocked<Partial<Repository<BatchStatusLog>>>;

  const mockBatch: Batch = {
    batchNo: 'WT26A01MA',
    productModel: '18650/2100mAh/3.7V',
    productSpec: null,
    workshop: 'A 车间',
    shift: '早班',
    plannedQty: 10000,
    actualStartDate: new Date('2026-05-01'),
    status: 2,
    remarks: null,
    createdBy: 1,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
  };

  beforeEach(async () => {
    batchRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    statusLogRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        { provide: getRepositoryToken(Batch), useValue: batchRepo },
        { provide: getRepositoryToken(BatchStatusLog), useValue: statusLogRepo },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateBatchNo', () => {
    afterEach(() => {
      jest.useRealTimers();
      delete process.env.FACTORY_CODE;
    });

    it('should generate a batch number as factory code + year + month + mn ratio', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-15T08:00:00Z'));
      process.env.FACTORY_CODE = 'WT';

      const batchNo = service.generateBatchNo('01MA');

      expect(batchNo).toBe('WT26A01MA');
    });

    it('should use default mnRatio if not provided', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-15T08:00:00Z'));
      process.env.FACTORY_CODE = 'WT';

      const batchNo = service.generateBatchNo();

      expect(batchNo).toBe('WT26A01MA');
    });

    it('should use the provided mnRatio instead of a random suffix', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-12-01T08:00:00Z'));
      process.env.FACTORY_CODE = 'WT';

      const batchNo = service.generateBatchNo('02MB');

      expect(batchNo).toBe('WT26L02MB');
    });
  });

  describe('create', () => {
    const createDto = {
      batchNo: 'WT26A01MA',
      productModel: '18650/2100mAh/3.7V',
      workshop: 'A 车间',
      shift: '早班',
      plannedQty: 10000,
      actualStartDate: '2026-05-01',
    };

    it('should create a batch with DRAFT status', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(null);
      (batchRepo.create as jest.Mock).mockReturnValue(mockBatch);
      (batchRepo.save as jest.Mock).mockResolvedValue(mockBatch);
      (statusLogRepo.create as jest.Mock).mockReturnValue({ batchNo: mockBatch.batchNo });
      (statusLogRepo.save as jest.Mock).mockResolvedValue({ batchNo: mockBatch.batchNo });

      const result = await service.create(createDto, 1);
      expect(result.status).toBe(2);
      expect(result.batchNo).toBe('WT26A01MA');
      expect(batchRepo.save).toHaveBeenCalled();
      expect(statusLogRepo.save).toHaveBeenCalled();
    });

    it('should reject duplicate batch number', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create(createDto, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const items = [mockBatch];
      (batchRepo.findAndCount as jest.Mock).mockResolvedValue([items, 1]);

      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      (batchRepo.findAndCount as jest.Mock).mockResolvedValue([[mockBatch], 1]);
      await service.findAll({ page: 1, pageSize: 20, status: BatchStatus.DRAFT });
      expect(batchRepo.findAndCount).toHaveBeenCalled();
    });

    it('should filter by batchNo', async () => {
      (batchRepo.findAndCount as jest.Mock).mockResolvedValue([[mockBatch], 1]);
      await service.findAll({ page: 1, pageSize: 20, batchNo: 'WT26' });
      expect(batchRepo.findAndCount).toHaveBeenCalled();
    });

    it('should use default pagination values', async () => {
      (batchRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);
      await service.findAll({});
      expect(batchRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findByBatchNo', () => {
    it('should return batch when found', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      const result = await service.findByBatchNo('WT26A01MA');
      expect(result).toEqual(mockBatch);
    });

    it('should return null when not found', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findByBatchNo('NONEXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should record a status log when status changes', async () => {
      const existingBatch = { ...mockBatch, status: BatchStatus.DRAFT };
      const savedBatch = { ...mockBatch, status: BatchStatus.IN_PROGRESS, updatedBy: 2 };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(existingBatch);
      (batchRepo.save as jest.Mock).mockResolvedValue(savedBatch);
      (statusLogRepo.create as jest.Mock).mockReturnValue({
        batchNo: mockBatch.batchNo,
        fromStatus: BatchStatus.DRAFT,
        toStatus: BatchStatus.IN_PROGRESS,
      });
      (statusLogRepo.save as jest.Mock).mockResolvedValue({
        batchNo: mockBatch.batchNo,
        fromStatus: BatchStatus.DRAFT,
        toStatus: BatchStatus.IN_PROGRESS,
      });

      const result = await service.update(mockBatch.batchNo, { status: BatchStatus.IN_PROGRESS }, 2);

      expect(result.status).toBe(BatchStatus.IN_PROGRESS);
      expect(statusLogRepo.save).toHaveBeenCalled();
    });
  });
});
