import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialWarehouseService } from './material-warehouse.service';
import { MaterialWarehouse, MaterialStatus } from './material-warehouse.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MaterialWarehouseService', () => {
  let service: MaterialWarehouseService;
  let repo: jest.Mocked<Partial<Repository<MaterialWarehouse>>>;
  let batchRepo: jest.Mocked<Partial<Repository<any>>>;

  const mockMaterial: MaterialWarehouse = {
    id: 1,
    batchNo: 'WT26A01MA',
    materialType: 1,
    supplierBatchNo: 'SUP-001',
    warehousePerson: '王仓库',
    status: MaterialStatus.QUALIFIED,
    quantity: 100.5,
    unit: 'kg',
    createdBy: 1,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
  };

  const mockBatch = {
    batchNo: 'WT26A01MA',
  };

  beforeEach(async () => {
    repo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
    batchRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialWarehouseService,
        { provide: getRepositoryToken(MaterialWarehouse), useValue: repo },
        { provide: getRepositoryToken(require('../batch/batch.entity').Batch), useValue: batchRepo },
      ],
    }).compile();

    service = module.get<MaterialWarehouseService>(MaterialWarehouseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto = {
      batchNo: 'WT26A01MA',
      materialType: 1,
      supplierBatchNo: 'SUP-001',
      warehousePerson: '王仓库',
      quantity: 100.5,
    };

    it('should create material record successfully', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockReturnValue(mockMaterial);
      (repo.save as jest.Mock).mockResolvedValue(mockMaterial);
      const result = await service.create(validDto, 1);
      expect(result.quantity).toBe(100.5);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should use default unit based on material type', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      const created = { ...mockMaterial, unit: 'kg', materialType: 1 };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);
      const result = await service.create(validDto, 1);
      expect(result.unit).toBe('kg');
    });

    it('should reject when batch does not exist', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.create(validDto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should create with warehousePerson field', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      const dto = { ...validDto, warehousePerson: '测试员' };
      const created = { ...mockMaterial, warehousePerson: '测试员' };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);
      const result = await service.create(dto, 1);
      expect(result.warehousePerson).toBe('测试员');
    });

    it('should create with default status QUALIFIED when not specified', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      const dto = { ...validDto, warehousePerson: '测试员' };
      const created = { ...mockMaterial, status: MaterialStatus.QUALIFIED, warehousePerson: '测试员' };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);
      const result = await service.create(dto, 1);
      expect(result.status).toBe(MaterialStatus.QUALIFIED);
    });

    it('should create with specified status UNQUALIFIED', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      const dto = { ...validDto, warehousePerson: '测试员', status: MaterialStatus.UNQUALIFIED };
      const created = { ...mockMaterial, status: MaterialStatus.UNQUALIFIED, warehousePerson: '测试员' };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);
      const result = await service.create(dto, 1);
      expect(result.status).toBe(MaterialStatus.UNQUALIFIED);
    });

    it('should reject when materialType is invalid', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, materialType: 6 }, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when quantity is zero', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, quantity: 0 }, 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when quantity is negative', async () => {
      (batchRepo.findOne as jest.Mock).mockResolvedValue(mockBatch);
      await expect(service.create({ ...validDto, quantity: -1 }, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all materials for a batch', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockMaterial]);
      const result = await service.findAll('WT26A01MA');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no materials exist', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.findAll('NONEXISTENT');
      expect(result).toEqual([]);
    });
  });

  describe('findAvailable', () => {
    it('should return materials filtered by type and status', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockMaterial]);
      const result = await service.findAvailable('WT26A01MA', 1);
      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { batchNo: 'WT26A01MA', materialType: 1, status: MaterialStatus.QUALIFIED }
      });
    });

    it('should return empty array when no materials of type', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.findAvailable('WT26A01MA', 5);
      expect(result).toEqual([]);
    });
  });
});
