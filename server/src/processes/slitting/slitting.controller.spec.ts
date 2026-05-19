import { Test, TestingModule } from '@nestjs/testing';
import { SlittingController } from './slitting.controller';
import { SlittingService } from './slitting.service';

describe('SlittingController', () => {
  let controller: SlittingController;
  let service: jest.Mocked<Partial<SlittingService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'SL-001',
    electrodeWidth: 150.0,
    electrodeLength: 3000.0,
    slittingSpeed: 10.0,
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
      controllers: [SlittingController],
      providers: [{ provide: SlittingService, useValue: service }],
    }).compile();

    controller = module.get<SlittingController>(SlittingController);
  });

  describe('POST /api/processes/slitting/draft', () => {
    it('should create draft', async () => {
      const dto = {
        batchNo: 'WT26A01MA',
        equipmentCode: 'SL-001',
        electrodeWidth: 150.0,
        electrodeLength: 3000.0,
        slittingSpeed: 10.0,
        operatorName: '张三',
      };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);

      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/slitting/submit', () => {
    it('should submit quality review', async () => {
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality('WT26A01MA', { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith('WT26A01MA', 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/slitting/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/slitting/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
