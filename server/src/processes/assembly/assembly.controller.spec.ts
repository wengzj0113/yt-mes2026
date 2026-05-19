import { Test, TestingModule } from '@nestjs/testing';
import { AssemblyController } from './assembly.controller';
import { AssemblyService } from './assembly.service';

describe('AssemblyController', () => {
  let controller: AssemblyController;
  let service: jest.Mocked<Partial<AssemblyService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    casingEquipmentCode: 'CS-001',
    shellModel: 'SUS-18650',
    bottomWeldEquipment: 'BW-001',
    bottomWeldParams: '1.5kA/50ms',
    bottomWeldPull: null,
    grooveRecord: null,
    capModel: 'CAP-18650',
    capWeldingPull: null,
    tabWeldingPull: null,
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
      controllers: [AssemblyController],
      providers: [{ provide: AssemblyService, useValue: service }],
    }).compile();

    controller = module.get<AssemblyController>(AssemblyController);
  });

  describe('POST /api/processes/assembly/draft', () => {
    it('should create draft', async () => {
      const dto = { batchNo: 'WT26A01MA', casingEquipmentCode: 'CS-001', shellModel: 'SUS-18650', bottomWeldEquipment: 'BW-001', bottomWeldParams: '1.5kA/50ms', capModel: 'CAP-18650', operatorName: '张三' };
      (service.createDraft as jest.Mock).mockResolvedValue(mockRecord);

      const result = await controller.createDraft(dto, { sub: 1 } as any);
      expect(service.createDraft).toHaveBeenCalledWith(dto, 1);
      expect(result.data.isDraft).toBe(true);
    });
  });

  describe('POST /api/processes/assembly/submit', () => {
    it('should submit quality review', async () => {
      const dto = { batchNo: 'WT26A01MA', bottomWeldPull: 55.0, grooveRecord: '合格', capWeldingPull: 40.0, tabWeldingPull: 45.0 };
      (service.submitQuality as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });

      const result = await controller.submitQuality(dto, { sub: 2 } as any);
      expect(service.submitQuality).toHaveBeenCalledWith(dto, 2);
      expect(result.data.isDraft).toBe(false);
    });
  });

  describe('GET /api/processes/assembly/:batchNo', () => {
    it('should get record by batchNo', async () => {
      (service.findByBatchNo as jest.Mock).mockResolvedValue(mockRecord);
      const result = await controller.findByBatchNo('WT26A01MA');
      expect(result.data!.batchNo).toBe('WT26A01MA');
    });
  });

  describe('PATCH /api/processes/assembly/:batchNo/void', () => {
    it('should void record', async () => {
      (service.voidRecord as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      const result = await controller.voidRecord('WT26A01MA', { sub: 1 } as any);
      expect(result.data.recordStatus).toBe(2);
    });
  });
});
