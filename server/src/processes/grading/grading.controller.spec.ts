import { Test, TestingModule } from '@nestjs/testing';
import { GradingController } from './grading.controller';
import { GradingService } from './grading.service';

describe('GradingController', () => {
  let controller: GradingController;
  let service: jest.Mocked<Partial<GradingService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'GD-001',
    chargeDischargeTemplate: null,
    gradingTemperature: null,
    capacityGradeStandard: null,
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
      controllers: [GradingController],
      providers: [{ provide: GradingService, useValue: service }],
    }).compile();

    controller = module.get<GradingController>(GradingController);
  });

  describe('POST /api/processes/grading/draft', () => {
    it('should create draft', async () => {
      const dto = { batchNo: 'WT26A01MA', equipmentCode: 'GD-001', operatorName: '张三' };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/grading/submit', () => {
    it('should submit quality review', async () => {
      const dto = { batchNo: 'WT26A01MA', chargeDischargeTemplate: '分容工步-01', gradingTemperature: 25.0, capacityGradeStandard: 'A级标准' };
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality(dto, { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith(dto, 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/grading/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/grading/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
