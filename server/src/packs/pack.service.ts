import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pack } from './pack.entity';
import { PackCell } from './pack-cell.entity';
import { CreatePackDto } from './dto/create-pack.dto';

@Injectable()
export class PackService {
  constructor(
    @InjectRepository(Pack)
    private readonly packRepo: Repository<Pack>,
    @InjectRepository(PackCell)
    private readonly packCellRepo: Repository<PackCell>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrUpdate(dto: CreatePackDto, operatorName?: string): Promise<Pack> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 检查是否已存在该 Pack
      let pack = await this.packRepo.findOne({
        where: { packBarcode: dto.packBarcode },
        relations: ['cells'],
      });

      if (pack) {
        // Update existing
        pack.batchNo = dto.batchNo || pack.batchNo;
        pack.protectionBoardBarcode = dto.protectionBoardBarcode || pack.protectionBoardBarcode;
        pack.operatorName = operatorName || pack.operatorName;
        // 先删除旧的 cells
        await queryRunner.manager.delete(PackCell, { packId: pack.id });
      } else {
        // 如果不存在，创建新的
        pack = this.packRepo.create({
          packBarcode: dto.packBarcode,
          batchNo: dto.batchNo ?? null,
          protectionBoardBarcode: dto.protectionBoardBarcode ?? null,
          operatorName: operatorName ?? null,
        });
        pack = await queryRunner.manager.save(pack);
      }

      // 创建新的 cells
      const cells = dto.cellBarcodes.map((barcode) => {
        return this.packCellRepo.create({
          cellBarcode: barcode,
          packId: pack.id,
        });
      });

      await queryRunner.manager.save(cells);
      
      await queryRunner.commitTransaction();
      
      // 返回带有 cells 的完整对象
      return this.findByBarcode(dto.packBarcode);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByBarcode(barcode: string): Promise<Pack> {
    const pack = await this.packRepo.findOne({
      where: { packBarcode: barcode },
      relations: ['cells'],
    });

    if (!pack) {
      throw new NotFoundException({
        code: 'PACK_NOT_FOUND',
        message: `Pack 条码 ${barcode} 未找到`,
      });
    }

    return pack;
  }

  async findAll(page: number = 1, pageSize: number = 10): Promise<{ items: Pack[]; total: number }> {
    const [items, total] = await this.packRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['cells'],
    });

    return { items, total };
  }
}
