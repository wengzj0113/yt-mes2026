import { Test, TestingModule } from '@nestjs/testing';
import { ProcessDictionaryService } from './process-dictionary.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProcessDictionary } from './process-dictionary.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getProcessBaseline } from '../process-baseline';

describe('ProcessDictionaryService', () => {
  let service: ProcessDictionaryService;
  let repo: any;
  let dataSource: any;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => data),
      update: jest.fn(),
      delete: jest.fn(),
    };

    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessDictionaryService,
        { provide: getRepositoryToken(ProcessDictionary), useValue: repo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ProcessDictionaryService>(ProcessDictionaryService);
  });

  describe('standard OCV fields', () => {
    it('merges Excel raw fields while preserving existing parameter configuration', async () => {
      const batching = getProcessBaseline('batching')!;
      const processes: any[] = [{
        processCode: 'batching',
        processName: '配料',
        sortOrder: 99,
        isActive: true,
        fieldDefinitions: JSON.stringify([
          { ...batching.fieldDefinitions[0], label: '旧正极材料', type: 'text', min: 1, max: 9, defaultValue: 'NCM-OLD' },
          { key: 'obsolete', label: '旧系统参数', type: 'number', required: false, isSystem: true, min: 0, max: 10 },
          { key: 'custom', label: '用户自定义参数', type: 'text', required: false, defaultValue: '保留' },
        ]),
      }];
      repo.find.mockResolvedValue(processes);

      await service.onModuleInit();

      const fields = JSON.parse(processes[0].fieldDefinitions);
      const positiveMaterial = fields.find((field: any) => field.key === batching.fieldDefinitions[0].key);
      expect(positiveMaterial).toEqual(expect.objectContaining({
        label: batching.fieldDefinitions[0].label,
        type: batching.fieldDefinitions[0].type,
        min: 1,
        max: 9,
        defaultValue: 'NCM-OLD',
      }));
      expect(fields.some((field: any) => field.key === 'obsolete')).toBe(false);
      expect(fields.find((field: any) => field.key === 'custom')).toEqual(expect.objectContaining({ defaultValue: '保留' }));
      expect(fields.map((field: any) => field.key)).toEqual([
        ...batching.fieldDefinitions.map((field) => field.key),
        'custom',
      ]);
    });

    it('keeps dedicated OCV fields separate from Excel-based sorting fields', async () => {
      const processes: any[] = [
        { processCode: 'sorting', fieldDefinitions: null },
        { processCode: 'ocv1', fieldDefinitions: null },
        { processCode: 'ocv2', fieldDefinitions: null },
      ];
      repo.find.mockResolvedValue(processes);

      await service.onModuleInit();

      const fieldsByCode = new Map(
        processes.map((process) => [process.processCode, JSON.parse(process.fieldDefinitions)]),
      );
      expect(fieldsByCode.get('ocv1')).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'equipmentCode', type: 'text', required: true, isSystem: true }),
        expect.objectContaining({ key: 'ocvVoltageRange', unit: 'V' }),
        expect.objectContaining({ key: 'irRange', unit: 'mΩ' }),
        expect.objectContaining({ key: 'capacityRange', unit: 'mAh' }),
        expect.objectContaining({ key: 'operatorName', type: 'text', required: true, isSystem: true }),
      ]));
      expect(fieldsByCode.get('sorting')).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'internalResistanceRange', label: '内阻电压范围（内阻）', unit: 'mΩ' }),
        expect.objectContaining({ key: 'voltageRange', label: '内阻电压范围（电压）', unit: 'V' }),
      ]));
    });

    it('creates missing OCV process definitions for an existing dictionary', async () => {
      const processes: any[] = [
        { processCode: 'sorting', fieldDefinitions: null },
      ];
      repo.find.mockResolvedValue(processes);

      await service.onModuleInit();

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        processCode: 'ocv1',
        processName: 'OCV1测试',
        sortOrder: 125,
        isActive: true,
      }));
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        processCode: 'ocv2',
        processName: 'OCV2测试',
        sortOrder: 128,
        isActive: true,
      }));
    });

    it('normalizes the built-in OCV process order', async () => {
      const processes: any[] = [
        { processCode: 'ocv1', sortOrder: 130, fieldDefinitions: null },
        { processCode: 'ocv2', sortOrder: 140, fieldDefinitions: null },
      ];
      repo.find.mockResolvedValue(processes);

      await service.onModuleInit();

      expect(processes.find(process => process.processCode === 'ocv1')?.sortOrder).toBe(125);
      expect(processes.find(process => process.processCode === 'ocv2')?.sortOrder).toBe(128);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if process not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if process has records', async () => {
      repo.findOne.mockResolvedValue({ id: 1, processCode: 'coating' });
      // Mock that the query returns some data
      dataSource.query.mockResolvedValue([{ id: 1 }]);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('coating_record'));
    });

    it('should delete process if no records found', async () => {
      repo.findOne.mockResolvedValue({ id: 1, processCode: 'coating' });
      // Mock that the query returns empty array
      dataSource.query.mockResolvedValue([]);

      await service.remove(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('should delete process if table does not exist', async () => {
      repo.findOne.mockResolvedValue({ id: 1, processCode: 'new_process' });
      // Mock that the query throws error (table not found)
      dataSource.query.mockRejectedValue(new Error('Invalid object name'));

      await service.remove(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
