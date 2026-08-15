import { Test, TestingModule } from '@nestjs/testing';
import { ProcessStatusService, ProcessStatusItem } from './process-status.service';
import { BatchingService } from '../batching/batching.service';
import { CoatingService } from '../coating/coating.service';
import { RollerPressingService } from '../roller-pressing/roller-pressing.service';
import { SlittingService } from '../slitting/slitting.service';
import { SortingService } from '../sorting/sorting.service';
import { ElectrodeService } from '../electrode/electrode.service';
import { WindingService } from '../winding/winding.service';
import { AssemblyService } from '../assembly/assembly.service';
import { BakingService } from '../baking/baking.service';
import { InjectionService } from '../injection/injection.service';
import { WrappingService } from '../wrapping/wrapping.service';
import { FormationService } from '../formation/formation.service';
import { GradingService } from '../grading/grading.service';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QualityCheck } from '../../quality/quality-check.entity';
import { ProcessParameter } from '../../process-parameters/process-parameter.entity';

describe('ProcessStatusService', () => {
  let service: ProcessStatusService;
  const mockServices: Record<string, any> = {};

  function createMockService() {
    return { findByBatchNo: jest.fn() };
  }

  beforeEach(async () => {
    // Initialize all mock services
    const providers: any[] = [
      BatchingService,
      CoatingService,
      RollerPressingService,
      SlittingService,
      SortingService,
      ElectrodeService,
      WindingService,
      AssemblyService,
      BakingService,
      InjectionService,
      WrappingService,
      FormationService,
      GradingService,
    ].map((ServiceClass) => {
      const mock = createMockService();
      const name = ServiceClass.name;
      mockServices[name] = mock;
      return { provide: ServiceClass, useValue: mock };
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessStatusService,
        { provide: DataSource, useValue: { query: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(QualityCheck), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(ProcessParameter), useValue: { find: jest.fn().mockResolvedValue([]) } },
        ...providers,
      ],
    }).compile();

    service = module.get<ProcessStatusService>(ProcessStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return 13 status items when no records exist', async () => {
    // All services return null (no record)
    Object.values(mockServices).forEach((mock: any) => {
      mock.findByBatchNo.mockResolvedValue(null);
    });

    const result = await service.getProcessStatuses('BATCH001');

    expect(result).toHaveLength(16);
    result.forEach((item) => {
      expect(item.status).toBe('not_entered');
      expect(item.isDraft).toBeNull();
      expect(item.recordStatus).toBeNull();
    });
  });

  it('should include process names in Chinese', async () => {
    Object.values(mockServices).forEach((mock: any) => {
      mock.findByBatchNo.mockResolvedValue(null);
    });

    const result = await service.getProcessStatuses('BATCH001');

    const names = result.map((r) => r.processName);
    expect(names).toContain('配料');
    expect(names).toContain('涂布');
    expect(names).toContain('辊压');
    expect(names).toContain('封口');
  });

  it('should detect draft status correctly', async () => {
    // Only batching has a draft record
    mockServices['BatchingService'].findByBatchNo.mockResolvedValue({
      isDraft: true,
      recordStatus: 1,
      updatedAt: new Date('2026-05-12T10:00:00Z'),
    });
    // All others return null
    Object.entries(mockServices).forEach(([name, mock]: [string, any]) => {
      if (name !== 'BatchingService') {
        mock.findByBatchNo.mockResolvedValue(null);
      }
    });

    const result = await service.getProcessStatuses('BATCH001');

    const batching = result.find((r) => r.processKey === 'batching');
    expect(batching?.status).toBe('saved');
    expect(batching?.isDraft).toBe(true);
    expect(batching?.recordStatus).toBe(1);
    expect(batching?.updatedAt).toBe('2026-05-12T10:00:00.000Z');

    // All others should be not_entered
    result.filter((r) => r.processKey !== 'batching').forEach((item) => {
      expect(item.status).toBe('not_entered');
    });
  });

  it('should detect submitted status correctly', async () => {
    mockServices['BatchingService'].findByBatchNo.mockResolvedValue({
      isDraft: false,
      recordStatus: 1,
      updatedAt: new Date('2026-05-12T10:00:00Z'),
    });
    Object.entries(mockServices).forEach(([name, mock]: [string, any]) => {
      if (name !== 'BatchingService') {
        mock.findByBatchNo.mockResolvedValue(null);
      }
    });

    const result = await service.getProcessStatuses('BATCH001');
    const batching = result.find((r) => r.processKey === 'batching');
    expect(batching?.status).toBe('pending_quality');
  });

  it('should detect voided status correctly', async () => {
    mockServices['BatchingService'].findByBatchNo.mockResolvedValue({
      isDraft: false,
      recordStatus: 2,
      updatedAt: new Date('2026-05-12T10:00:00Z'),
    });
    Object.entries(mockServices).forEach(([name, mock]: [string, any]) => {
      if (name !== 'BatchingService') {
        mock.findByBatchNo.mockResolvedValue(null);
      }
    });

    const result = await service.getProcessStatuses('BATCH001');
    const batching = result.find((r) => r.processKey === 'batching');
    expect(batching?.status).toBe('voided');
  });

  it('should handle mixed states correctly', async () => {
    mockServices['BatchingService'].findByBatchNo.mockResolvedValue({ isDraft: false, recordStatus: 1 }); // submitted
    mockServices['CoatingService'].findByBatchNo.mockResolvedValue({ isDraft: true, recordStatus: 1 }); // draft
    mockServices['WrappingService'].findByBatchNo.mockResolvedValue({ isDraft: false, recordStatus: 2 }); // voided
    // All others not entered
    Object.entries(mockServices).forEach(([name, mock]: [string, any]) => {
      if (!['BatchingService', 'CoatingService', 'WrappingService'].includes(name)) {
        mock.findByBatchNo.mockResolvedValue(null);
      }
    });

    const result = await service.getProcessStatuses('BATCH001');

    expect(result.find((r) => r.processKey === 'batching')?.status).toBe('pending_quality');
    expect(result.find((r) => r.processKey === 'coating')?.status).toBe('saved');
    expect(result.find((r) => r.processKey === 'wrapping')?.status).toBe('voided');
    result
      .filter((r) => !['batching', 'coating', 'wrapping'].includes(r.processKey))
      .forEach((item) => {
        expect(item.status).toBe('not_entered');
      });
  });

  it('should preserve process order', async () => {
    Object.values(mockServices).forEach((mock: any) => {
      mock.findByBatchNo.mockResolvedValue(null);
    });

    const result = await service.getProcessStatuses('BATCH001');
    const keys = result.map((r) => r.processKey);
    expect(keys).not.toContain('assembly');

    expect(keys).toEqual([
      'batching', 'coating', 'roller-pressing', 'slitting',
      'electrode', 'winding', 'casing', 'integrated-machine',
      'laser-welding', 'baking', 'injection', 'wrapping', 'formation-grading', 'ocv1', 'ocv2', 'sorting',
    ]);
  });

  it('should pass batchNo to all services', async () => {
    Object.values(mockServices).forEach((mock: any) => {
      mock.findByBatchNo.mockResolvedValue(null);
    });

    await service.getProcessStatuses('TEST_BATCH');

    Object.values(mockServices).forEach((mock: any) => {
      if (mockServices.BatchingService === mock || mockServices.CoatingService === mock || mockServices.RollerPressingService === mock || mockServices.SlittingService === mock || mockServices.SortingService === mock || mockServices.ElectrodeService === mock || mockServices.WindingService === mock || mockServices.BakingService === mock || mockServices.InjectionService === mock || mockServices.WrappingService === mock) expect(mock.findByBatchNo).toHaveBeenCalledWith('TEST_BATCH');
    });
  });

  describe('getProcessRecords', () => {
    it('should return all process records with full data', async () => {
      const batchingRecord = {
        batchNo: 'BATCH001',
        positiveMaterial: 'NCM-811',
        negativeMaterial: 'Graphite',
        operatorName: '张三',
        isDraft: true,
        recordStatus: 1,
        createdAt: new Date('2026-05-12T10:00:00Z'),
      };
      const coatingRecord = {
        batchNo: 'BATCH001',
        equipmentCode: 'E002',
        coatingSpeed: 15.5,
        operatorName: '李四',
        isDraft: false,
        recordStatus: 1,
        createdAt: new Date('2026-05-12T11:00:00Z'),
      };

      mockServices['BatchingService'].findByBatchNo.mockResolvedValue(batchingRecord);
      mockServices['CoatingService'].findByBatchNo.mockResolvedValue(coatingRecord);
      // All others return null
      Object.entries(mockServices).forEach(([name, mock]: [string, any]) => {
        if (!['BatchingService', 'CoatingService'].includes(name)) {
          mock.findByBatchNo.mockResolvedValue(null);
        }
      });

      const result = await service.getProcessRecords('BATCH001');

      expect(result.batching).toEqual(batchingRecord);
      expect(result.coating).toEqual(coatingRecord);
      expect(result['roller-pressing']).toBeNull();
      expect(Object.keys(result).length).toBe(16);
    });
  });
});
