import { Test, TestingModule } from '@nestjs/testing';
import { MaterialWarehouseController } from './material-warehouse.controller';
import { MaterialWarehouseService } from './material-warehouse.service';

describe('MaterialWarehouseController', () => {
  let controller: MaterialWarehouseController;
  let service: jest.Mocked<Partial<MaterialWarehouseService>>;

  const mockRecord = {
    id: 1,
    batchNo: 'WT26A01MA',
    materialType: 1,
    supplierBatchNo: 'SUP-001',
    warehousePerson: '王仓库',
    status: 1,
    quantity: 100.5,
    unit: 'kg',
    createdBy: 1,
    createdAt: new Date(),
    updatedBy: null,
    updatedAt: null,
  };

  beforeEach(async () => {
    service = { create: jest.fn(), findAll: jest.fn(), findAvailable: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialWarehouseController],
      providers: [{ provide: MaterialWarehouseService, useValue: service }],
    }).compile();
    controller = module.get<MaterialWarehouseController>(MaterialWarehouseController);
  });

  it('should create material record', async () => {
    const dto: any = { materialType: 1, supplierBatchNo: 'SUP-001', warehousePerson: '王仓库', quantity: 100.5 };
    (service.create as jest.Mock).mockResolvedValue(mockRecord);
    const result = await controller.create('WT26A01MA', dto, { sub: 1 } as any);
    expect(dto.batchNo).toBe('WT26A01MA');
    expect(service.create).toHaveBeenCalledWith(dto, 1);
    expect(result.data.quantity).toBe(100.5);
  });

  it('should return all materials', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([mockRecord]);
    const result = await controller.findAll('WT26A01MA');
    expect(result.data).toHaveLength(1);
  });

  it('should return empty array when no materials', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([]);
    const result = await controller.findAll('NONEXISTENT');
    expect(result.data).toEqual([]);
  });

  it('should return available materials by type', async () => {
    (service.findAvailable as jest.Mock).mockResolvedValue([mockRecord]);
    const result = await controller.findAvailable('WT26A01MA', '1');
    expect(service.findAvailable).toHaveBeenCalledWith('WT26A01MA', 1);
    expect(result.data).toEqual([
      {
        label: 'SUP-001',
        value: 'SUP-001',
        quantity: 100.5,
        unit: 'kg',
      },
    ]);
  });
});
