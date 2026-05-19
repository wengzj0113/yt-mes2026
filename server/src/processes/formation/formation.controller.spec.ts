import { Test, TestingModule } from '@nestjs/testing';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';

describe('FormationController', () => {
  let controller: FormationController;
  let service: jest.Mocked<Partial<FormationService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'FM-001',
    chargeDischargeTemplate: null,
    formationTemperature: null,
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
      controllers: [FormationController],
      providers: [{ provide: FormationService, useValue: service }],
    }).compile();

    controller = module.get<FormationController>(FormationController);
  });

  describe('POST /api/processes/formation/draft', () => {
    it('should create draft', async () => {
      const dto = { batchNo: 'WT26A01MA', equipmentCode: 'FM-001', operatorName: '张三' };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/formation/submit', () => {
    it('should submit quality review', async () => {
      const dto = { batchNo: 'WT26A01MA', chargeDischargeTemplate: '化成工步-01', formationTemperature: 45.0 };
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality(dto, { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith(dto, 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/formation/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/formation/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
