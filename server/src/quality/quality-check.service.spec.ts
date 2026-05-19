import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityCheckService } from './quality-check.service';
import { QualityCheck, VALID_PROCESS_TYPES } from './quality-check.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Batch, BatchStatus } from '../batch/batch.entity';

describe('QualityCheckService', () => {
  let service: QualityCheckService;
  let repo: jest.Mocked<Partial<Repository<QualityCheck>>>;
  let batchRepo: jest.Mocked<Partial<Repository<any>>>;

  const mockQualityCheck: QualityCheck = {
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

  const mockBatch = {
    batchNo: 'WT26A01MA',
    status: BatchStatus.IN_PROGRESS,
  };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
    batchRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityCheckService,
        { provide: getRepositoryToken(QualityCheck), useValue: repo },
        { provide: getRepositoryToken(Batch), useValue: batchRepo },
      ],
    }).compile();

    service = module.get<QualityCheckService>(QualityCheckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto = {
      batchNo: 'WT26A01MA',
      processType: 'coating',
      inspectionResult: 1,
      inspectorName: '李四',
    };

    it('should create quality check with result=1', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockReturnValue(mockQualityCheck);
      (repo.save as jest.Mock).mockResolvedValue(mockQualityCheck);
      const result = await service.create(validDto, 1);
      expect(result.inspectionResult).toBe(1);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should create quality check with result=2 and defect info', async () => {
      const dto = { ...validDto, inspectionResult: 2, defectQty: 50, defectReason: '厚度超标' };
      const mockWithDefects = { ...mockQualityCheck, inspectionResult: 2, defectQty: 50, defectReason: '厚度超标' };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.create as jest.Mock).mockReturnValue(mockWithDefects);
      (repo.save as jest.Mock).mockResolvedValue(mockWithDefects);
      const result = await service.create(dto, 1);
      expect(result.inspectionResult).toBe(2);
      expect(result.defectQty).toBe(50);
    });

    it('should reject when batch does not exist', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.create(validDto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should reject when batch is not IN_PROGRESS', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue({ ...mockBatch, status: BatchStatus.DRAFT });
      await expect(service.create(validDto, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when result=2 and defectQty is missing', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, inspectionResult: 2 }, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when result=2 and defectReason is missing', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, inspectionResult: 2, defectQty: 50 }, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when inspectionResult is not 1 or 2', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, inspectionResult: 3 as any }, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when processType is invalid', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, processType: 'invalid-process' }, 1)).rejects.toThrow(BadRequestException);
    });

    it('should force defect fields to null when result=1', async () => {
      const dto = { ...validDto, inspectionResult: 1, defectQty: 100, defectReason: 'should be null' };
      const savedRecord = { ...mockQualityCheck, inspectionResult: 1, defectQty: null, defectReason: null };
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.create as jest.Mock).mockReturnValue(savedRecord);
      (repo.save as jest.Mock).mockResolvedValue(savedRecord);
      const result = await service.create(dto, 1);
      expect(result.defectQty).toBeNull();
      expect(result.defectReason).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all quality checks for a batch', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockQualityCheck]);
      const result = await service.findAll('WT26A01MA');
      expect(result).toHaveLength(1);
      expect(result[0].batchNo).toBe('WT26A01MA');
    });

    it('should return empty array when no checks exist', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.findAll('NONEXISTENT');
      expect(result).toEqual([]);
    });
  });
});
