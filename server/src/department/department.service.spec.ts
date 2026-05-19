import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentService } from './department.service';
import { Department } from './department.entity';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let repo: jest.Mocked<Partial<Repository<Department>>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        { provide: getRepositoryToken(Department), useValue: repo },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  it('returns active departments ordered by code', async () => {
    const departments = [{ id: 1, code: 'PROD', name: '生产部', isActive: true }];
    (repo.find as jest.Mock).mockResolvedValue(departments);

    const result = await service.findAll();

    expect(result).toEqual(departments);
    expect(repo.find).toHaveBeenCalledWith({
      where: { isActive: true },
      select: ['id', 'code', 'name', 'isActive'],
      order: { code: 'ASC' },
    });
  });
});
