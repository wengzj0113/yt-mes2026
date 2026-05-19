import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Department } from '../department/department.entity';
import { Equipment } from '../equipment/equipment.entity';
import { ProcessDictionary } from '../master-data/process-dictionary/process-dictionary.entity';
import { ConfigService } from '@nestjs/config';

describe('SeedService', () => {
  let service: SeedService;
  let processDictRepo: any;

  beforeEach(async () => {
    processDictRepo = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(User), useValue: { count: jest.fn().mockResolvedValue(1) } },
        { provide: getRepositoryToken(Department), useValue: { count: jest.fn().mockResolvedValue(1) } },
        { provide: getRepositoryToken(Equipment), useValue: { count: jest.fn().mockResolvedValue(1) } },
        { provide: getRepositoryToken(ProcessDictionary), useValue: processDictRepo },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  describe('seedProcessDictionary', () => {
    it('should skip seeding if process dictionary is not empty', async () => {
      processDictRepo.count.mockResolvedValue(5);
      
      await service.seed();
      
      expect(processDictRepo.count).toHaveBeenCalled();
      expect(processDictRepo.create).not.toHaveBeenCalled();
    });

    it('should seed 13 standard processes if process dictionary is empty', async () => {
      processDictRepo.count.mockResolvedValue(0);
      processDictRepo.create.mockImplementation((entities: any) => entities);
      
      await service.seed();
      
      expect(processDictRepo.count).toHaveBeenCalled();
      expect(processDictRepo.create).toHaveBeenCalled();
      const createArgs = processDictRepo.create.mock.calls[0][0];
      expect(createArgs).toHaveLength(13);
      expect(createArgs[0].processCode).toBe('batching');
      expect(processDictRepo.save).toHaveBeenCalledWith(createArgs);
    });
  });
});
