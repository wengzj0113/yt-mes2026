import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipmentService } from './equipment.service';
import { Equipment } from './equipment.entity';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let repo: jest.Mocked<Partial<Repository<Equipment>>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: getRepositoryToken(Equipment), useValue: repo },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  it('returns active equipment ordered by code', async () => {
    const equipment = [{ id: 1, equipmentCode: 'E001', equipmentName: '配料机-01', isActive: true }];
    (repo.find as jest.Mock).mockResolvedValue(equipment);

    const result = await service.findAll();

    expect(result).toEqual(equipment);
    expect(repo.find).toHaveBeenCalledWith({
      where: { isActive: true },
      select: ['id', 'equipmentCode', 'equipmentName', 'model', 'departmentCode', 'isActive'],
      order: { equipmentCode: 'ASC' },
    });
  });
});
