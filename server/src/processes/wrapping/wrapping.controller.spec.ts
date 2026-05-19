import { Test, TestingModule } from '@nestjs/testing';
import { WrappingController } from './wrapping.controller';
import { WrappingService } from './wrapping.service';

describe('WrappingController', () => {
  let controller: WrappingController;
  let service: jest.Mocked<Partial<WrappingService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'WP-001',
    filmModel: '铝塑膜-115',
    shrinkTemperature: 180,
    appearanceCheck: null,
    operatorName: '张三',
    createdBy: 1,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
  };

  beforeEach(async () => {
    service = {
      createDraft: jest.fn(),
      submitQuality: jest.fn(),
      findByBatchNo: jest.fn(),
      voidRecord: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WrappingController],
      providers: [{ provide: WrappingService, useValue: service }],
    }).compile();

    controller = module.get<WrappingController>(WrappingController);
  });

  describe('POST /api/processes/wrapping/draft', () => {
    it('should create draft', async () => {
      const dto = { batchNo: 'WT26A01MA', equipmentCode: 'WP-001', filmModel: '铝塑膜-115', shrinkTemperature: 180, operatorName: '张三' };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/wrapping/submit', () => {
    it('should submit quality review', async () => {
      const dto = { batchNo: 'WT26A01MA', appearanceCheck: 1 };
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality(dto, { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith(dto, 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/wrapping/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/wrapping/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
