import { Test, TestingModule } from '@nestjs/testing';
import { QualityCheckController } from './quality-check.controller';
import { QualityCheckService } from './quality-check.service';

describe('QualityCheckController', () => {
  let controller: QualityCheckController;
  let service: jest.Mocked<Partial<QualityCheckService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    processType: 'coating',
    inspectionResult: 1,
    defectQty: null,
    defectReason: null,
    inspectorName: '李四',
    abnormalRecord: null,
    createdBy: 1,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
  };

  beforeEach(async () => {
    service = { create: jest.fn(), findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualityCheckController],
      providers: [{ provide: QualityCheckService, useValue: service }],
    }).compile();
    controller = module.get<QualityCheckController>(QualityCheckController);
  });

  it('should create quality check', async () => {
    const dto: any = { processType: 'coating', inspectionResult: 1, inspectorName: '李四' };
    (service.create as jest.Mock).mockResolvedValue(mockRecord);
    const result = await controller.create('WT26A01MA', dto, { sub: 1 } as any);
    expect(dto.batchNo).toBe('WT26A01MA');
    expect(service.create).toHaveBeenCalledWith(dto, 1);
    expect(result.data.inspectionResult).toBe(1);
  });

  it('should return all quality checks', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([mockRecord]);
    const result = await controller.findAll('WT26A01MA');
    expect(result.data).toHaveLength(1);
  });

  it('should return empty array when no checks exist', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([]);
    const result = await controller.findAll('NONEXISTENT');
    expect(result.data).toEqual([]);
  });

  it('should create quality check with defects', async () => {
    const dto: any = { processType: 'coating', inspectionResult: 2, defectQty: 50, defectReason: '不合格', inspectorName: '李四' };
    (service.create as jest.Mock).mockResolvedValue({ ...mockRecord, inspectionResult: 2, defectQty: 50, defectReason: '不合格' });
    const result = await controller.create('WT26A01MA', dto, { sub: 1 } as any);
    expect(dto.batchNo).toBe('WT26A01MA');
    expect(service.create).toHaveBeenCalledWith(dto, 1);
    expect(result.data.inspectionResult).toBe(2);
  });
});
