import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { OnEvent } from '@nestjs/event-emitter';
import { CellBarcode } from './cell-barcode.entity';
import { Batch } from '../batch/batch.entity';
import { ProcessStatusService } from '../processes/process-status/process-status.service';
import { SorterUploadDto } from './dto/sorter-upload.dto';
import { BulkSorterUploadDto } from './dto/bulk-sorter-upload.dto';
import { Ocv1UploadDto } from './dto/ocv1-upload.dto';
import { BulkOcv1UploadDto } from './dto/bulk-ocv1-upload.dto';
import { Ocv2UploadDto } from './dto/ocv2-upload.dto';
import { BulkOcv2UploadDto } from './dto/bulk-ocv2-upload.dto';
import { Ocv1Record } from '../processes/ocv/ocv1-record.entity';
import { Ocv2Record } from '../processes/ocv/ocv2-record.entity';

function cleanDecimal(value: number | undefined | null, max: number = 10001, min: number = 0): number | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

@Injectable()
export class CellBarcodeService {
  constructor(
    @InjectRepository(CellBarcode)
    private readonly repo: Repository<CellBarcode>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Ocv1Record)
    private readonly ocv1RecordRepo: Repository<Ocv1Record>,
    @InjectRepository(Ocv2Record)
    private readonly ocv2RecordRepo: Repository<Ocv2Record>,
    private readonly processStatusService: ProcessStatusService,
    @Inject(CACHE_MANAGER) 
    private readonly cacheManager: Cache,
  ) {}

  async sorterUpload(dto: SorterUploadDto): Promise<CellBarcode> {
    const batch = await this.batchRepo.findOne({ where: { batchNo: dto.batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${dto.batchNo} 不存在` });
    }

    const voltage = cleanDecimal(dto.voltage, 10001, 0);
    const internalResistance = cleanDecimal(dto.internalResistance ?? dto.resistance, 10001, 0);
    const kValue = cleanDecimal(dto.kValue, 10001, 0);

    let record = await this.repo.findOne({ where: { barcode: dto.barcode } });
    if (record) {
      // 如果已存在，则覆盖更新
      record.batchNo = dto.batchNo;
      record.capacity = dto.capacity ?? null;
      record.voltage = voltage;
      record.internalResistance = internalResistance;
      record.kValue = kValue;
      record.grade = dto.grade ?? null;
      record.sortingTime = dto.sortingTime ? new Date(dto.sortingTime) : null;
      record.importSource = 'sorter';
    } else {
      // 不存在则新建
      record = this.repo.create({
        barcode: dto.barcode,
        batchNo: dto.batchNo,
        capacity: dto.capacity ?? null,
        voltage: voltage,
        internalResistance: internalResistance,
        kValue: kValue,
        grade: dto.grade ?? null,
        sortingTime: dto.sortingTime ? new Date(dto.sortingTime) : null,
        importSource: 'sorter',
      });
    }

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
    // 允许与数据库中的条码重复，但输入数据内部如果存在相同的条码，我们只保留最后一条
    const uniqueCellsMap = new Map<string, SorterUploadDto>();
    dto.cells.forEach(cell => {
      uniqueCellsMap.set(cell.barcode, cell);
    });
    const uniqueCells = Array.from(uniqueCellsMap.values());
    const uniqueBarcodes = uniqueCells.map(c => c.barcode);

    // 查询数据库中已存在的记录
    const existingCells = await this.repo.find({
      where: { barcode: In(uniqueBarcodes) },
    });
    const existingCellsMap = new Map<string, CellBarcode>();
    existingCells.forEach(cell => {
      existingCellsMap.set(cell.barcode, cell);
    });

    const recordsToSave: CellBarcode[] = [];

    uniqueCells.forEach(cell => {
      const voltage = cleanDecimal(cell.voltage, 10001, 0);
      const internalResistance = cleanDecimal(cell.internalResistance ?? cell.resistance, 10001, 0);
      const kValue = cleanDecimal(cell.kValue, 10001, 0);

      let record = existingCellsMap.get(cell.barcode);
      if (record) {
        // 覆盖更新
        record.batchNo = cell.batchNo;
        record.capacity = cell.capacity ?? null;
        record.voltage = voltage;
        record.internalResistance = internalResistance;
        record.kValue = kValue;
        record.grade = cell.grade ?? null;
        record.sortingTime = cell.sortingTime ? new Date(cell.sortingTime) : null;
        record.importSource = 'sorter';
      } else {
        // 新建
        record = this.repo.create({
          barcode: cell.barcode,
          batchNo: cell.batchNo,
          capacity: cell.capacity ?? null,
          voltage: voltage,
          internalResistance: internalResistance,
          kValue: kValue,
          grade: cell.grade ?? null,
          sortingTime: cell.sortingTime ? new Date(cell.sortingTime) : null,
          importSource: 'sorter',
        });
      }
      recordsToSave.push(record);
    });

    return await this.repo.save(recordsToSave);
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

  // ============ OCV1 接口 ============

  async ocv1Upload(dto: Ocv1UploadDto): Promise<CellBarcode[]> {
    return this.processOcv1Batch([dto]);
  }

  async bulkOcv1Upload(dto: BulkOcv1UploadDto): Promise<CellBarcode[]> {
    return this.processOcv1Batch(dto.ocv1Records);
  }

  private async processOcv1Batch(records: Ocv1UploadDto[]): Promise<CellBarcode[]> {
    return this.repo.manager.transaction(async (manager: EntityManager) => {
      const batchNos = [...new Set(records.map(r => r.batchNo))];
      const existingBatches = await manager.find(Batch, {
        where: { batchNo: In(batchNos) },
        select: ['batchNo'],
      });
      if (existingBatches.length !== batchNos.length) {
        const found = existingBatches.map(b => b.batchNo);
        const missing = batchNos.filter(b => !found.includes(b));
        throw new NotFoundException({
          code: 'BATCH_NOT_FOUND',
          message: `批次 ${missing.join(', ')} 不存在`,
        });
      }

      // 数组内部去重
      const uniqueMap = new Map<string, Ocv1UploadDto>();
      records.forEach(r => uniqueMap.set(r.barcode, r));
      const unique = Array.from(uniqueMap.values());
      const barcodes = unique.map(r => r.barcode);

      const existingCells = await manager.find(CellBarcode, {
        where: { barcode: In(barcodes) },
      });
      const cellMap = new Map<string, CellBarcode>();
      existingCells.forEach(c => cellMap.set(c.barcode, c));

      const cellsToSave: CellBarcode[] = [];
      const recordsToInsert: Ocv1Record[] = [];

      unique.forEach(r => {
        let cell = cellMap.get(r.barcode);
        if (!cell) {
          cell = manager.create(CellBarcode, {
            barcode: r.barcode,
            batchNo: r.batchNo,
            ocv1Voltage: r.voltage ?? null,
            ocv1Resistance: r.internalResistance ?? r.resistance ?? null,
            ocv1Time: r.testTime ? new Date(r.testTime) : null,
            ocv1EquipmentCode: r.equipmentCode ?? null,
            importSource: 'ocv1',
          });
        } else {
          cell.batchNo = r.batchNo;
          cell.ocv1Voltage = r.voltage ?? cell.ocv1Voltage;
          cell.ocv1Resistance = r.internalResistance ?? r.resistance ?? cell.ocv1Resistance;
          cell.ocv1Time = r.testTime ? new Date(r.testTime) : cell.ocv1Time;
          cell.ocv1EquipmentCode = r.equipmentCode ?? cell.ocv1EquipmentCode;
        }
        cellsToSave.push(cell);

        recordsToInsert.push(manager.create(Ocv1Record, {
          batchNo: r.batchNo,
          ocvVoltageMin: r.voltage ?? null,
          ocvVoltageMax: r.voltage ?? null,
          equipmentCode: r.equipmentCode ?? null,
          operatorName: 'OCV设备',
          isDraft: false,
          recordStatus: 1,
        }));
      });

      const savedCells = await manager.save(CellBarcode, cellsToSave);
      await manager.save(Ocv1Record, recordsToInsert);
      return savedCells;
    });
  }

  // ============ OCV2 接口 ============

  async ocv2Upload(dto: Ocv2UploadDto): Promise<CellBarcode[]> {
    return this.processOcv2Batch([dto]);
  }

  async bulkOcv2Upload(dto: BulkOcv2UploadDto): Promise<CellBarcode[]> {
    return this.processOcv2Batch(dto.ocv2Records);
  }

  private async processOcv2Batch(records: Ocv2UploadDto[]): Promise<CellBarcode[]> {
    return this.repo.manager.transaction(async (manager: EntityManager) => {
      const batchNos = [...new Set(records.map(r => r.batchNo))];
      const existingBatches = await manager.find(Batch, {
        where: { batchNo: In(batchNos) },
        select: ['batchNo'],
      });
      if (existingBatches.length !== batchNos.length) {
        const found = existingBatches.map(b => b.batchNo);
        const missing = batchNos.filter(b => !found.includes(b));
        throw new NotFoundException({
          code: 'BATCH_NOT_FOUND',
          message: `批次 ${missing.join(', ')} 不存在`,
        });
      }

      // 数组内部去重
      const uniqueMap = new Map<string, Ocv2UploadDto>();
      records.forEach(r => uniqueMap.set(r.barcode, r));
      const unique = Array.from(uniqueMap.values());
      const barcodes = unique.map(r => r.barcode);

      const existingCells = await manager.find(CellBarcode, {
        where: { barcode: In(barcodes) },
      });
      const cellMap = new Map<string, CellBarcode>();
      existingCells.forEach(c => cellMap.set(c.barcode, c));

      const cellsToSave: CellBarcode[] = [];
      const recordsToInsert: Ocv2Record[] = [];

      unique.forEach(r => {
        let cell = cellMap.get(r.barcode);
        if (!cell) {
          cell = manager.create(CellBarcode, {
            barcode: r.barcode,
            batchNo: r.batchNo,
            ocv2Voltage: r.voltage ?? null,
            ocv2Resistance: r.internalResistance ?? r.resistance ?? null,
            ocv2Time: r.testTime ? new Date(r.testTime) : null,
            ocv2EquipmentCode: r.equipmentCode ?? null,
            kValue: null,
            importSource: 'ocv2',
          });
        } else {
          cell.batchNo = r.batchNo;
          cell.ocv2Voltage = r.voltage ?? cell.ocv2Voltage;
          cell.ocv2Resistance = r.internalResistance ?? r.resistance ?? cell.ocv2Resistance;
          cell.ocv2Time = r.testTime ? new Date(r.testTime) : cell.ocv2Time;
          cell.ocv2EquipmentCode = r.equipmentCode ?? cell.ocv2EquipmentCode;
        }
        cellsToSave.push(cell);
            // OCV2 的 K 值同步写入；后续分选机会覆盖
        cellsToSave.push(cell);

        recordsToInsert.push(manager.create(Ocv2Record, {
          batchNo: r.batchNo,
          ocvVoltageMin: r.voltage ?? null,
          ocvVoltageMax: r.voltage ?? null,
          equipmentCode: r.equipmentCode ?? null,
          operatorName: 'OCV设备',
          isDraft: false,
          recordStatus: 1,
        }));
      });

      const savedCells = await manager.save(CellBarcode, cellsToSave);
      await manager.save(Ocv2Record, recordsToInsert);
      return savedCells;
    });
  }
}
