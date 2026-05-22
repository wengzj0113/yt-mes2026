import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { OnEvent } from '@nestjs/event-emitter';
import { CellBarcode } from './cell-barcode.entity';
import { Batch } from '../batch/batch.entity';
import { ProcessStatusService } from '../processes/process-status/process-status.service';
import { SorterUploadDto } from './dto/sorter-upload.dto';
import { BulkSorterUploadDto } from './dto/bulk-sorter-upload.dto';

@Injectable()
export class CellBarcodeService {
  constructor(
    @InjectRepository(CellBarcode)
    private readonly repo: Repository<CellBarcode>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    private readonly processStatusService: ProcessStatusService,
    @Inject(CACHE_MANAGER) 
    private readonly cacheManager: Cache,
  ) {}

  async sorterUpload(dto: SorterUploadDto): Promise<CellBarcode> {
    const batch = await this.batchRepo.findOne({ where: { batchNo: dto.batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${dto.batchNo} 不存在` });
    }

    const existing = await this.repo.findOne({ where: { barcode: dto.barcode } });
    if (existing) {
      throw new ConflictException({ code: 'CELL_BARCODE_DUPLICATE', message: `电芯码 ${dto.barcode} 已存在` });
    }

    const record = this.repo.create({
      barcode: dto.barcode,
      batchNo: dto.batchNo,
      capacity: dto.capacity ?? null,
      voltage: dto.voltage ?? null,
      internalResistance: dto.internalResistance ?? null,
      kValue: dto.kValue ?? null,
      grade: dto.grade ?? null,
      sortingTime: dto.sortingTime ? new Date(dto.sortingTime) : null,
      importSource: 'sorter',
    });

    return await this.repo.save(record);
  }

  async bulkSorterUpload(dto: BulkSorterUploadDto): Promise<CellBarcode[]> {
    const batchNos = [...new Set(dto.cells.map(c => c.batchNo))];
    const existingBatches = await this.batchRepo.find({
      where: { batchNo: In(batchNos) },
      select: ['batchNo'],
    });

    if (existingBatches.length !== batchNos.length) {
      const foundBatchNos = existingBatches.map(b => b.batchNo);
      const missingBatchNos = batchNos.filter(bn => !foundBatchNos.includes(bn));
      throw new NotFoundException({ 
        code: 'BATCH_NOT_FOUND', 
        message: `批次 ${missingBatchNos.join(', ')} 不存在` 
      });
    }

    const barcodes = dto.cells.map(c => c.barcode);
    if (new Set(barcodes).size !== barcodes.length) {
      throw new BadRequestException({ code: 'CELL_BARCODE_DUPLICATE', message: '导入数据中存在重复的电芯条码' });
    }

    const existingCells = await this.repo.find({
      where: { barcode: In(barcodes) },
      select: ['barcode'],
    });

    if (existingCells.length > 0) {
      const existingBarcodes = existingCells.map(c => c.barcode);
      throw new ConflictException({ 
        code: 'CELL_BARCODE_DUPLICATE', 
        message: `电芯码 ${existingBarcodes.join(', ')} 已存在` 
      });
    }

    const records = dto.cells.map(cell => this.repo.create({
      barcode: cell.barcode,
      batchNo: cell.batchNo,
      capacity: cell.capacity ?? null,
      voltage: cell.voltage ?? null,
      internalResistance: cell.internalResistance ?? null,
      kValue: cell.kValue ?? null,
      grade: cell.grade ?? null,
      sortingTime: cell.sortingTime ? new Date(cell.sortingTime) : null,
      importSource: 'sorter',
    }));

    return await this.repo.save(records);
  }

  async trace(barcode: string): Promise<{ cell: CellBarcode; batch: Batch | null; processes: Record<string, any> }> {
    const cacheKey = `trace:barcode:${barcode}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const cell = await this.repo.findOne({ where: { barcode } });
    if (!cell) {
      throw new NotFoundException({ code: 'CELL_BARCODE_NOT_FOUND', message: `电芯码 ${barcode} 不存在` });
    }

    const [batch, processes] = await Promise.all([
      this.batchRepo.findOne({ where: { batchNo: cell.batchNo } }),
      this.processStatusService.getProcessRecords(cell.batchNo),
    ]);

    const result = { cell, batch, processes };
    // 缓存追溯结果，1小时过期
    await this.cacheManager.set(cacheKey, result, 3600000);
    
    return result;
  }

  async findByBatch(batchNo: string, pageNum: number = 1, pageSizeNum: number = 20): Promise<{ data: CellBarcode[]; total: number; page: number; pageSize: number }> {
    const page = Number(pageNum || 1);
    const pageSize = Number(pageSizeNum || 20);
    const [data, total] = await Promise.all([
      this.repo.find({
        where: { batchNo },
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: { createdAt: 'DESC' },
      }),
      this.repo.count({ where: { batchNo } }),
    ]);
    return { data, total, page, pageSize };
  }

  /**
   * 监听工序记录更新事件，失效相关的条码追溯缓存
   */
  @OnEvent('process.record.updated')
  async handleProcessRecordUpdated(payload: { batchNo: string }) {
    const cells = await this.repo.find({
      where: { batchNo: payload.batchNo },
      select: ['barcode'],
    });

    if (cells.length > 0) {
      const keys = cells.map(c => `trace:barcode:${c.barcode}`);
      // 批量清除受影响条码的缓存
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    }
  }
}
