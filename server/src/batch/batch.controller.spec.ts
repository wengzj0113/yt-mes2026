import { Test, TestingModule } from '@nestjs/testing';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';

describe('BatchController', () => {
  let controller: BatchController;
  let service: jest.Mocked<Partial<BatchService>>;

  const mockBatch = {
    batchNo: 'WT26A01MA',
    productModel: '18650/2100mAh/3.7V',
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
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByBatchNo: jest.fn(),
      update: jest.fn(),
      generateBatchNo: jest.fn(),
      findStatusLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [{ provide: BatchService, useValue: service }],
    }).compile();

    controller = module.get<BatchController>(BatchController);
  });

  describe('GET /api/batches', () => {
    it('should return paginated batch list', async () => {
      const expected = { items: [mockBatch], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } };
      (service.findAll as jest.Mock).mockResolvedValue(expected);

      const result = await controller.findAll({ page: 1, pageSize: 20 });
      expect(result).toEqual(expected);
    });
  });

  describe('GET /api/batches/:batchNo', () => {
    it('should return a single batch', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockBatch);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('POST /api/batches', () => {
    it('should create a batch', async () => {
      const dto = {
        productModel: '18650/2100mAh/3.7V',
        workshop: 'A 车间',
        shift: '早班',
        plannedQty: 10000,
        actualStartDate: '2026-05-01',
      };
      (service.create as jest.Mock).mockResolvedValue(mockBatch);

      const result = await controller.create(dto, { sub: 1 } as any);
      expect(result.data.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/batches/:batchNo', () => {
    it('should update batch fields', async () => {
      const dto = { productModel: 'Updated Model' };
      (service.update as jest.Mock).mockResolvedValue({ ...mockBatch, productModel: 'Updated Model' });

      const result = await controller.update('WT26A01MA', dto, { sub: 1 } as any);
      expect(service.update).toHaveBeenCalledWith('WT26A01MA', dto, 1);
    });
  });

  describe('GET /api/batches/generate-no', () => {
    it('should return a generated batch number', async () => {
      (service.generateBatchNo as jest.Mock).mockReturnValue('WT26A01MA');
      const result = await controller.generateNo({ mnRatio: '01MA' } as any);
      expect(result.data.batchNo).toBe('WT26A01MA');
      expect(service.generateBatchNo).toHaveBeenCalledWith('01MA');
    });
  });

  describe('GET /api/batches/:batchNo/status-logs', () => {
    it('should return batch status logs', async () => {
      const logs = [{ batchNo: 'WT26A01MA', fromStatus: 1, toStatus: 2, changeReason: '批次创建' }];
      (service.findStatusLogs as jest.Mock).mockResolvedValue(logs);

      const result = await controller.findStatusLogs('WT26A01MA');

      expect(service.findStatusLogs).toHaveBeenCalledWith('WT26A01MA');
      expect(result).toEqual({ data: logs });
    });
  });
});
