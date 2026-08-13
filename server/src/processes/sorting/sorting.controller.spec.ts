import { Test, TestingModule } from '@nestjs/testing';
import { SortingController } from './sorting.controller';
import { SortingService } from './sorting.service';

describe('SortingController', () => {
  let controller: SortingController;
  let service: jest.Mocked<Partial<SortingService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'SR-001',
    ocvVoltageRange: '3.0-3.2V',
    ocvVoltageMin: 3.0,
    ocvVoltageMax: 3.2,
    irRange: '1.5-2.0mΩ',
    irMin: 1.5,
    irMax: 2.0,
    capacityRange: '2800-3000mAh',
    capacityMin: 2800,
    capacityMax: 3000,
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
      controllers: [SortingController],
      providers: [{ provide: SortingService, useValue: service }],
    }).compile();

    controller = module.get<SortingController>(SortingController);
  });

  describe('POST /api/processes/sorting/draft', () => {
    it('should create draft', async () => {
      const dto = {
        batchNo: 'WT26A01MA',
        equipmentCode: 'SR-001',
        ocvVoltageMin: 3.0,
        ocvVoltageMax: 3.2,
        irMin: 1.5,
        irMax: 2.0,
        capacityMin: 2800,
        capacityMax: 3000,
        operatorName: '张三',
      };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);

      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/sorting/submit', () => {
    it('should submit quality review', async () => {
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality('WT26A01MA', { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith('WT26A01MA', 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/sorting/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/sorting/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
