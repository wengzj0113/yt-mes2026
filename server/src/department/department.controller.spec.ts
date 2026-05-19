import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let service: jest.Mocked<Partial<DepartmentService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [{ provide: DepartmentService, useValue: service }],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
  });

  it('returns active departments', async () => {
    const departments = [{ id: 1, code: 'PROD', name: '生产部', isActive: true }];
    (service.findAll as jest.Mock).mockResolvedValue(departments);

    const result = await controller.findAll();

    expect(result).toEqual({ data: departments });
  });
});
