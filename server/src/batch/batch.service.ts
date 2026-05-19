import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not, MoreThanOrEqual } from 'typeorm';
import { Batch, BatchStatus } from './batch.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { BatchQueryDto, BATCH_SORT_BY_FIELDS } from './dto/query-batch.dto';
import { BatchStatusLog } from './batch-status-log.entity';
import { CellBarcode } from '../cells/cell-barcode.entity';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(BatchStatusLog)
    private readonly batchStatusLogRepo: Repository<BatchStatusLog>,
    @InjectRepository(CellBarcode)
    private readonly cellBarcodeRepo: Repository<CellBarcode>,
  ) {}

  generateBatchNo(mnRatio = '01MA'): string {
    const factoryCode = process.env.FACTORY_CODE || 'WT';
    const year = new Date().getFullYear().toString().slice(2);
    const month = new Date().getMonth(); // 0-indexed
    const monthLetter = String.fromCharCode(65 + month); // A=Jan, B=Feb...
    return `${factoryCode}${year}${monthLetter}${mnRatio}`;
  }

  async create(dto: CreateBatchDto, userId: number): Promise<Batch> {
    const batchNo = dto.batchNo || this.generateBatchNo();

    const existing = await this.batchRepo.findOne({ where: { batchNo } });
    if (existing) {
      throw new ConflictException({ code: 'CONFLICT', message: `批次号 ${batchNo} 已存在` });
    }

    const batch = this.batchRepo.create({
      batchNo,
      productModel: dto.productModel,
      productSpec: dto.productSpec || null,
      workshop: dto.workshop,
      shift: dto.shift,
      plannedQty: dto.plannedQty,
      actualStartDate: new Date(dto.actualStartDate),
      status: BatchStatus.IN_PROGRESS,
      remarks: dto.remarks || null,
      createdBy: userId,
    });

    const savedBatch = await this.batchRepo.save(batch);
    await this.recordStatusLog(savedBatch.batchNo, null, savedBatch.status, userId, '批次创建');
    return savedBatch;
  }

  async findAll(query: BatchQueryDto) {
    const page = Number(query.page || 1);
    const pageSize = Number(query.pageSize || 20);
    const sortBy = BATCH_SORT_BY_FIELDS.includes(query.sortBy as any)
      ? query.sortBy
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    } else if (query.excludeStatus) {
      where.status = Not(query.excludeStatus);
    }
    if (query.batchNo) where.batchNo = Like(`%${query.batchNo}%`);
    if (query.workshop) where.workshop = query.workshop;
    if (query.shift) where.shift = query.shift;
    if (query.productModel) where.productModel = Like(`%${query.productModel}%`);

    const [items, total] = await this.batchRepo.findAndCount({
      where,
      order: { [sortBy as string]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findByBatchNo(batchNo: string): Promise<Batch | null> {
    return this.batchRepo.findOne({ where: { batchNo } });
  }

  async update(batchNo: string, dto: UpdateBatchDto, userId: number): Promise<Batch> {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    }

    const previousStatus = batch.status;
    if (dto.productModel !== undefined) batch.productModel = dto.productModel;
    if (dto.productSpec !== undefined) batch.productSpec = dto.productSpec;
    if (dto.workshop !== undefined) batch.workshop = dto.workshop;
    if (dto.shift !== undefined) batch.shift = dto.shift;
    if (dto.plannedQty !== undefined) batch.plannedQty = dto.plannedQty;
    if (dto.actualStartDate !== undefined) batch.actualStartDate = new Date(dto.actualStartDate);
    if (dto.remarks !== undefined) batch.remarks = dto.remarks;
    if (dto.status !== undefined) batch.status = dto.status;
    batch.updatedBy = userId;

    const savedBatch = await this.batchRepo.save(batch);
    if (dto.status !== undefined && dto.status !== previousStatus) {
      await this.recordStatusLog(batchNo, previousStatus, dto.status, userId, '批次状态更新');
    }
    return savedBatch;
  }

  async findStatusLogs(batchNo: string): Promise<BatchStatusLog[]> {
    return this.batchStatusLogRepo.find({
      where: { batchNo },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(batchNo: string): Promise<void> {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    }
    await this.batchRepo.remove(batch);
  }

  private async recordStatusLog(
    batchNo: string,
    fromStatus: number | null,
    toStatus: number,
    changedBy: number | null,
    changeReason: string,
  ) {
    const log = this.batchStatusLogRepo.create({
      batchNo,
      fromStatus,
      toStatus,
      changedBy,
      changeReason,
    });
    await this.batchStatusLogRepo.save(log);
  }

  async getDashboardStats() {
    const [totalBatches, inProgressBatches, completedBatches, totalCells] = await Promise.all([
      this.batchRepo.count(),
      this.batchRepo.count({ where: { status: BatchStatus.IN_PROGRESS } }),
      this.batchRepo.count({ where: { status: BatchStatus.COMPLETED } }),
      this.cellBarcodeRepo.count(),
    ]);

    // Calculate integrity (mock logic for now: percentage of batches that have at least one barcode)
    const batchesWithBarcodesCount = await this.batchRepo
      .createQueryBuilder('batch')
      .innerJoin('cell_barcode', 'cb', 'cb.batchNo = batch.batchNo')
      .select('COUNT(DISTINCT batch.batchNo)', 'count')
      .getRawOne();
    
    const integrity = totalBatches > 0 
      ? (Number(batchesWithBarcodesCount.count) / totalBatches) * 100 
      : 100;

    // Daily pass rate (mock logic: based on grade 'A' cells today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCells = await this.cellBarcodeRepo.count({
      where: { createdAt: MoreThanOrEqual(today) }
    });
    const todayPassCells = await this.cellBarcodeRepo.count({
      where: { createdAt: MoreThanOrEqual(today), grade: 'A' }
    });
    const dailyPassRate = todayCells > 0 ? (todayPassCells / todayCells) * 100 : 98.5;

    return {
      totalBatches,
      inProgressBatches,
      completedBatches,
      totalCells,
      integrity: parseFloat(integrity.toFixed(1)),
      dailyPassRate: parseFloat(dailyPassRate.toFixed(1)),
      abnormalCount: 0, // Placeholder
    };
  }
}
