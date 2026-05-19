import { Test, TestingModule } from '@nestjs/testing';
import { ProcessStatusController } from './process-status.controller';
import { ProcessStatusService } from './process-status.service';

describe('ProcessStatusController', () => {
  let controller: ProcessStatusController;
  let service: jest.Mocked<ProcessStatusService>;

  beforeEach(async () => {
    const mockService = {
      getProcessStatuses: jest.fn(),
      getProcessRecords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessStatusController],
      providers: [{ provide: ProcessStatusService, useValue: mockService }],
    }).compile();

    controller = module.get<ProcessStatusController>(ProcessStatusController);
    service = module.get(ProcessStatusService) as jest.Mocked<ProcessStatusService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return process statuses for a batch', async () => {
      const result = [
        { processKey: 'batching', processName: '配料', route: 'batching', status: 'submitted', isDraft: false, recordStatus: 1, updatedAt: null },
      ];
      service.getProcessStatuses.mockResolvedValue(result as any);

      const response = await controller.getStatus('BATCH001');
      expect(response).toEqual({ data: result });
      expect(service.getProcessStatuses).toHaveBeenCalledWith('BATCH001');
    });
  });

  describe('getRecords', () => {
    it('should return process records for a batch', async () => {
      const result = {
        batching: { batchNo: 'BATCH001', positiveMaterial: 'NCM-811' },
        coating: null,
      };
      service.getProcessRecords.mockResolvedValue(result);

      const response = await controller.getRecords('BATCH001');
      expect(response).toEqual({ data: result });
      expect(service.getProcessRecords).toHaveBeenCalledWith('BATCH001');
    });
  });
});
