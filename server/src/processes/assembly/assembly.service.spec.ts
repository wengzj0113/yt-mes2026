import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssemblyService } from './assembly.service';
import { AssemblyRecord } from './assembly-record.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchStatus } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';

describe('AssemblyService', () => {
  let service: AssemblyService;
  let repo: jest.Mocked<Partial<Repository<AssemblyRecord>>>;
  let batchRepo: jest.Mocked<Partial<Repository<any>>>;
  let qualityCheckRepo: jest.Mocked<Partial<Repository<any>>>;

  const mockRecord: AssemblyRecord = {
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
        AssemblyService,
        { provide: getRepositoryToken(AssemblyRecord), useValue: repo },
        { provide: getRepositoryToken(require('../../batch/batch.entity').Batch), useValue: batchRepo },
        { provide: getRepositoryToken(QualityCheck), useValue: qualityCheckRepo },
      ],
    }).compile();

    service = module.get<AssemblyService>(AssemblyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraft', () => {
    const draftDto = {
      batchNo: 'WT26A01MA',
      casingEquipmentCode: 'CS-001',
      shellModel: 'SUS-18650',
      bottomWeldEquipment: 'BW-001',
      bottomWeldParams: '1.5kA/50ms',
      capModel: 'CAP-18650',
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
      const existingDraft = { ...mockRecord, id: 1, casingEquipmentCode: 'Old-CS' };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(existingDraft);
      (repo.save as jest.Mock).mockResolvedValue({ ...existingDraft, casingEquipmentCode: 'CS-001' });

      const result = await service.createDraft(draftDto, 1);
      expect(result.casingEquipmentCode).toBe('CS-001');
    });
  });

  describe('submitQuality', () => {
    const qualityDto = {
      batchNo: 'WT26A01MA',
      bottomWeldPull: 55.0,
      grooveRecord: '深度 0.5mm，宽度 1.2mm',
      capWeldingPull: 40.0,
      tabWeldingPull: 45.0,
    };

    it('should submit draft with quality fields', async () => {
      const draft = { ...mockRecord, isDraft: true };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(draft);
      (repo.save as jest.Mock).mockResolvedValue({ ...draft, ...qualityDto, isDraft: false });

      const result = await service.submitQuality(qualityDto, 2);
      expect(result.isDraft).toBe(false);
      expect(result.bottomWeldPull).toBe(55.0);
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
        casingEquipmentCode: null,
        shellModel: null,
        bottomWeldEquipment: null,
        bottomWeldParams: null,
        capModel: null,
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
