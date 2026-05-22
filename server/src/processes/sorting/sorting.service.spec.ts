import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SortingService } from './sorting.service';
import { SortingRecord } from './sorting-record.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchStatus } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

describe('SortingService', () => {
  let service: SortingService;
  let repo: jest.Mocked<Partial<Repository<SortingRecord>>>;
  let batchRepo: jest.Mocked<Partial<Repository<any>>>;
  let qualityCheckRepo: jest.Mocked<Partial<Repository<any>>>;

  const mockRecord: SortingRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'SR-001',
    ocvVoltageRange: '3.0-3.2V',
    irRange: '1.5-2.0mΩ',
    capacityRange: '2800-3000mAh',
    operatorName: '张三',
    createdBy: 1,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
      extraData: '',
    };

  const mockBatch = {
    batchNo: 'WT26A01MA',
    status: BatchStatus.IN_PROGRESS,
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    batchRepo = {
      findOne: jest.fn(),
    };
    qualityCheckRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SortingService,
        { provide: getRepositoryToken(SortingRecord), useValue: repo },
        { provide: getRepositoryToken(require('../../batch/batch.entity').Batch), useValue: batchRepo },
        { provide: getRepositoryToken(QualityCheck), useValue: qualityCheckRepo },
      ],
    }).compile();

    service = module.get<SortingService>(SortingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraft', () => {
    const draftDto = {
      batchNo: 'WT26A01MA',
      equipmentCode: 'SR-001',
      ocvVoltageRange: '3.0-3.2V',
      irRange: '1.5-2.0mΩ',
      capacityRange: '2800-3000mAh',
      operatorName: '张三',
    };

    it('should create draft successfully', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockReturnValue(mockRecord);
      (repo.save as jest.Mock).mockResolvedValue(mockRecord);

      const result = await service.createDraft(draftDto, 1);
      expect(result.isDraft).toBe(true);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should reject when batch does not exist', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.createDraft(draftDto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should update existing submitted record', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      (repo.save as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false, ...draftDto });
      const result = await service.createDraft(draftDto, 1);
      expect(result.isDraft).toBe(false);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should update existing draft instead of creating new', async () => {
      const existingDraft = { ...mockRecord, id: 1, equipmentCode: 'Old-Equipment' };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(existingDraft);
      (repo.save as jest.Mock).mockResolvedValue({ ...existingDraft, equipmentCode: 'SR-001' });

      const result = await service.createDraft(draftDto, 1);
      expect(result.equipmentCode).toBe('SR-001');
    });
  });

  describe('submitQuality', () => {
    it('should submit draft', async () => {
      const draft = { ...mockRecord, isDraft: true };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(draft);
      (repo.save as jest.Mock).mockResolvedValue({ ...draft, isDraft: false });

      const result = await service.submitQuality('WT26A01MA', 2);
      expect(result.isDraft).toBe(false);
    });

    it('should reject when no draft exists', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.submitQuality('WT26A01MA', 2)).rejects.toThrow(NotFoundException);
    });

    it('should allow re-submitting already submitted record', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      (repo.save as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      const result = await service.submitQuality('WT26A01MA', 2);
      expect(result.isDraft).toBe(false);
    });

    it('should reject when operator fields are empty', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...mockRecord,
        equipmentCode: null,
        ocvVoltageRange: null,
        irRange: null,
        capacityRange: null,
        operatorName: null,
      });
      await expect(service.submitQuality('WT26A01MA', 2)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByBatchNo', () => {
    it('should return record for batch', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockRecord);
      const result = await service.findByBatchNo('WT26A01MA');
      expect(result).toEqual(mockRecord);
    });

    it('should return null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findByBatchNo('NONEXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('voidRecord', () => {
    it('should void a normal record', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockRecord);
      (repo.save as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });

      const result = await service.voidRecord('WT26A01MA', 1);
      expect(result.recordStatus).toBe(2);
    });

    it('should reject voiding already voided record', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ ...mockRecord, recordStatus: 2 });
      await expect(service.voidRecord('WT26A01MA', 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when record not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.voidRecord('NONEXISTENT', 1)).rejects.toThrow(NotFoundException);
    });
  });
});
