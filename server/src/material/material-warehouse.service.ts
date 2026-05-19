import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialWarehouse, MaterialType, MaterialStatus } from './material-warehouse.entity';
import { Batch } from '../batch/batch.entity';
import { CreateMaterialDto } from './dto/create-material.dto';

const UNIT_MAP: Record<number, string> = {
  [MaterialType.POSITIVE]: 'kg',
  [MaterialType.NEGATIVE]: 'kg',
  [MaterialType.ELECTROLYTE]: 'kg',
  [MaterialType.SEPARATOR]: '卷',
  [MaterialType.SHELL_CAP]: '个',
};

@Injectable()
export class MaterialWarehouseService {
  constructor(
    @InjectRepository(MaterialWarehouse)
    private readonly repo: Repository<MaterialWarehouse>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  private async validateBatch(batchNo: string) {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    }
    return batch;
  }

  async create(dto: CreateMaterialDto, userId: number): Promise<MaterialWarehouse> {
    if (!dto.batchNo) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '批次号不能为空' });
    }
    await this.validateBatch(dto.batchNo);

    if (dto.materialType < 1 || dto.materialType > 5) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '材料类型无效，必须为 1-5' });
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '数量必须大于 0' });
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      materialType: dto.materialType,
      supplierBatchNo: dto.supplierBatchNo,
      warehousePerson: dto.warehousePerson,
      status: dto.status ?? MaterialStatus.QUALIFIED,
      quantity: dto.quantity,
      unit: dto.unit || UNIT_MAP[dto.materialType] || 'kg',
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  async findAll(batchNo: string): Promise<MaterialWarehouse[]> {
    return this.repo.find({ where: { batchNo }, order: { createdAt: 'DESC' } });
  }

  async findAvailable(batchNo: string, materialType: number): Promise<MaterialWarehouse[]> {
    return this.repo.find({
      where: { batchNo, materialType, status: MaterialStatus.QUALIFIED },
    });
  }
}
