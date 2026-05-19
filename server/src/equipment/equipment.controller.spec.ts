import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: jest.Mocked<Partial<EquipmentService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [{ provide: EquipmentService, useValue: service }],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
  });

  it('returns active equipment', async () => {
    const items = [{ id: 1, equipmentCode: 'E001', equipmentName: '配料机-01', isActive: true }];
    (service.findAll as jest.Mock).mockResolvedValue(items);

    const result = await controller.findAll();

    expect(result).toEqual({ data: items });
  });
});
