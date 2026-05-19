import { Test, TestingModule } from '@nestjs/testing';
import { BakingController } from './baking.controller';
import { BakingService } from './baking.service';

describe('BakingController', () => {
  let controller: BakingController;
  let service: jest.Mocked<Partial<BakingService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'BK-001',
    bakingTemperature: 85.0,
    bakingDuration: 480,
    vacuumLevel: null,
    moistureAfterBaking: null,
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
      controllers: [BakingController],
      providers: [{ provide: BakingService, useValue: service }],
    }).compile();

    controller = module.get<BakingController>(BakingController);
  });

  describe('POST /api/processes/baking/draft', () => {
    it('should create draft', async () => {
      const dto = { batchNo: 'WT26A01MA', equipmentCode: 'BK-001', bakingTemperature: 85.0, bakingDuration: 480, operatorName: '张三' };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);

      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/baking/submit', () => {
    it('should submit quality review', async () => {
      const dto = { batchNo: 'WT26A01MA', vacuumLevel: -0.095, moistureAfterBaking: 0.02 };
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });

      const result = await controller.submitQuality(dto, { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith(dto, 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/baking/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/baking/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
