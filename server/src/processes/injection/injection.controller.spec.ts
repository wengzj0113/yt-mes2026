import { Test, TestingModule } from '@nestjs/testing';
import { InjectionController } from './injection.controller';
import { InjectionService } from './injection.service';

describe('InjectionController', () => {
  let controller: InjectionController;
  let service: jest.Mocked<Partial<InjectionService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'IJ-001',
    electrolyteModel: 'LB-315',
    injectionAmount: null,
    injectionHumidity: null,
    injectionTemperature: null,
    sealingDimension: null,
    cleaningRecord: null,
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
      controllers: [InjectionController],
      providers: [{ provide: InjectionService, useValue: service }],
    }).compile();

    controller = module.get<InjectionController>(InjectionController);
  });

  describe('POST /api/processes/injection/draft', () => {
    it('should create draft', async () => {
      const dto = { batchNo: 'WT26A01MA', equipmentCode: 'IJ-001', electrolyteModel: 'LB-315', operatorName: '张三' };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/injection/submit', () => {
    it('should submit quality review', async () => {
      const dto = { batchNo: 'WT26A01MA', injectionAmount: 5.5, injectionHumidity: 1.2, injectionTemperature: 25.0, sealingDimension: 18.5, cleaningRecord: '清洁正常' };
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality(dto, { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith(dto, 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/injection/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/injection/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
