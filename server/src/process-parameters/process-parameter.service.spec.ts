import { BadRequestException } from '@nestjs/common';
import { ProcessParameterService } from './process-parameter.service';

describe('ProcessParameterService', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
  } as any;
  const batchRepo = { findOne: jest.fn() } as any;
  let service: ProcessParameterService;

  const dto = {
    batchNo: 'BAT-1',
    equipmentCode: 'OCV-01',
    ocvVoltageMin: 3.1,
    ocvVoltageMax: 3.3,
    irMin: 1,
    irMax: 2,
    capacityMin: 2.8,
    capacityMax: 3,
    operatorName: '张三',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProcessParameterService(repo, batchRepo);
    batchRepo.findOne.mockResolvedValue({ batchNo: dto.batchNo });
  });

  it('upserts one parameter record per batch and OCV process', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.saveDraft('ocv1', dto as any, 7);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ batchNo: 'BAT-1', processCode: 'ocv1', createdBy: 7 }));
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ ...dto, processCode: 'ocv1', updatedBy: 7 }));
    expect(result.processCode).toBe('ocv1');
  });

  it('rejects a reversed range before saving', async () => {
    await expect(service.saveDraft('ocv2', { ...dto, irMin: 3, irMax: 2 } as any, 7))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects unsupported process codes', async () => {
    await expect(service.findByBatchNo('sorting', 'BAT-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
