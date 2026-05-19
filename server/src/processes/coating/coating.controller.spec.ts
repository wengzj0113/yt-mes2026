import { Test, TestingModule } from '@nestjs/testing';
import { CoatingController } from './coating.controller';
import { CoatingService } from './coating.service';

describe('CoatingController', () => {
  let controller: CoatingController;
  let service: jest.Mocked<Partial<CoatingService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'CT-001',
    coatingSpeed: 12.5,
    coatingThicknessPos: 150.0,
    coatingThicknessNeg: 148.0,
    arealDensityPos: 180.0,
    arealDensityNeg: 178.0,
    coatingTemperature: 85.0,
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
      controllers: [CoatingController],
      providers: [{ provide: CoatingService, useValue: service }],
    }).compile();

    controller = module.get<CoatingController>(CoatingController);
  });

  describe('POST /api/processes/coating/draft', () => {
    it('should create draft', async () => {
      const dto = {
        batchNo: 'WT26A01MA',
        equipmentCode: 'CT-001',
        coatingSpeed: 12.5,
        coatingThicknessPos: 150.0,
        coatingThicknessNeg: 148.0,
        arealDensityPos: 180.0,
        arealDensityNeg: 178.0,
        coatingTemperature: 85.0,
        operatorName: '张三',
      };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);

      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/coating/submit', () => {
    it('should submit quality review', async () => {
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await controller.submitQuality('WT26A01MA', { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith('WT26A01MA', 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/coating/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/coating/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
