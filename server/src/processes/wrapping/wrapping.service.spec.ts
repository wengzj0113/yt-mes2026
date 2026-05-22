import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WrappingService } from './wrapping.service';
import { WrappingRecord } from './wrapping-record.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchStatus } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

describe('WrappingService', () => {
  let service: WrappingService;
  let repo: jest.Mocked<Partial<Repository<WrappingRecord>>>;
  let batchRepo: jest.Mocked<Partial<Repository<any>>>;
  let qualityCheckRepo: jest.Mocked<Partial<Repository<any>>>;

  const mockRecord: WrappingRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    recordStatus: 1,
    isDraft: true,
    equipmentCode: 'WP-001',
    filmModel: '铝塑膜-115',
    shrinkTemperature: 180,
    appearanceCheck: null,
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
    batchRepo = { findOne: jest.fn() };
    qualityCheckRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WrappingService,
        { provide: getRepositoryToken(WrappingRecord), useValue: repo },
        { provide: getRepositoryToken(require('../../batch/batch.entity').Batch), useValue: batchRepo },
        { provide: getRepositoryToken(QualityCheck), useValue: qualityCheckRepo },
      ],
    }).compile();

    service = module.get<WrappingService>(WrappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraft', () => {
    const draftDto = {
      batchNo: 'WT26A01MA',
      equipmentCode: 'WP-001',
      filmModel: '铝塑膜-115',
      shrinkTemperature: 180,
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
      (repo.save as jest.Mock).mockResolvedValue({ ...existingDraft, equipmentCode: 'WP-001' });
      const result = await service.createDraft(draftDto, 1);
      expect(result.equipmentCode).toBe('WP-001');
    });
  });

  describe('submitQuality', () => {
    const qualityDto = {
      batchNo: 'WT26A01MA',
      appearanceCheck: 1,
    };

    it('should submit draft with quality fields', async () => {
      const draft = { ...mockRecord, isDraft: true };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(draft);
      (repo.save as jest.Mock).mockResolvedValue({ ...draft, ...qualityDto, isDraft: false });

      const result = await service.submitQuality(qualityDto, 2);
      expect(result.isDraft).toBe(false);
      expect(result.appearanceCheck).toBe(1);
    });

    it('should reject when no draft exists', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.submitQuality(qualityDto, 2)).rejects.toThrow(NotFoundException);
    });

    it('should allow re-submitting already submitted record', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue({ ...mockRecord, isDraft: false });
      (repo.save as jest.Mock).mockResolvedValue({ ...mockRecord, ...qualityDto, isDraft: false });
      const result = await service.submitQuality(qualityDto, 2);
      expect(result.isDraft).toBe(false);
    });

    it('should reject when operator fields are empty', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...mockRecord,
        equipmentCode: null,
        filmModel: null,
        shrinkTemperature: null as any,
        operatorName: null,
      });
      await expect(service.submitQuality(qualityDto, 2)).rejects.toThrow(BadRequestException);
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
