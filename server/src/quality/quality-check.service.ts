import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { QualityCheck, VALID_PROCESS_TYPES } from './quality-check.entity';
import { Batch, BatchStatus } from '../batch/batch.entity';
import { BatchStatusLog } from '../batch/batch-status-log.entity';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { QueryQualityDto } from './dto/query-quality.dto';
import { CellBarcode } from '../cells/cell-barcode.entity';
import { PROCESS_BASELINE } from '../master-data/process-baseline';

@Injectable()
export class QualityCheckService {
  constructor(
    @InjectRepository(QualityCheck)
    private readonly repo: Repository<QualityCheck>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(BatchStatusLog)
    private readonly statusLogRepo: Repository<BatchStatusLog>,
    @InjectRepository(CellBarcode)
    private readonly cellBarcodeRepo: Repository<CellBarcode>,
  ) {}

  private async validateBatchExists(batchNo: string) {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    }
    return batch;
  }

  async create(dto: CreateQualityCheckDto, userId: number): Promise<QualityCheck> {
    if (!dto.batchNo) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '批次号不能为空' });
    }
    await this.validateBatchExists(dto.batchNo);

    if (!VALID_PROCESS_TYPES.includes(dto.processType as any)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `无效的工序类型: ${dto.processType}` });
    }

    if (dto.inspectionResult !== 1 && dto.inspectionResult !== 2) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '检验结果只能为 1(合格) 或 2(不合格)' });
    }

    let defectQty: number | null = null;
    let defectReason: string | null = null;

    if (dto.inspectionResult === 2) {
      if (dto.defectQty === undefined || dto.defectQty === null) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '不合格必须填写缺陷数量' });
      }
      if (!dto.defectReason) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '不合格必须填写缺陷原因' });
      }
      defectQty = dto.defectQty;
      defectReason = dto.defectReason;
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      processType: dto.processType,
      inspectionResult: dto.inspectionResult,
      defectQty,
      defectReason,
      inspectorName: dto.inspectorName,
      abnormalRecord: dto.abnormalRecord || null,
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  /** 质检员检验（创建记录 + 不合格时更新批次状态） */
  async inspect(dto: CreateQualityCheckDto, userId: number): Promise<QualityCheck> {
    const record = await this.create(dto, userId);
    // create 已校验 batchNo 不能为空，此处一定存在
    if (dto.inspectionResult === 2 && dto.batchNo) {
      await this.handleQualityIssue(dto.batchNo, userId);
    }
    return record;
  }

  /** 质检不合格处理：更新批次状态为 QUALITY_ISSUE 并记录日志 */
  private async handleQualityIssue(batchNo: string, userId: number) {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (batch && batch.status === BatchStatus.IN_PROGRESS) {
      batch.status = BatchStatus.QUALITY_ISSUE;
      await this.batchRepo.save(batch);
      await this.statusLogRepo.save(
        this.statusLogRepo.create({
          batchNo,
          fromStatus: BatchStatus.IN_PROGRESS,
          toStatus: BatchStatus.QUALITY_ISSUE,
          changeReason: '质检不合格',
          changedBy: userId,
        })
      );
    }
  }

  /** 分页查询所有质检记录 */
  async findAllPaginated(filters: QueryQualityDto) {
    const { batchNo, processType, inspectionResult, inspectorName, startDate, endDate, page = 1, pageSize = 20 } = filters;

    const where: any = {};

    if (batchNo) where.batchNo = Like(`%${batchNo}%`);
    if (processType) where.processType = processType;
    if (inspectionResult) where.inspectionResult = inspectionResult;
    if (inspectorName) where.inspectorName = Like(`%${inspectorName}%`);
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate + 'T23:59:59'));
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  /** 查询所有待质检的工序 */
  async findPendingQuality(batchNo?: string): Promise<any[]> {
    // 查询所有已提交（isDraft=false, recordStatus=1）的工序
    const processTables = [
      'batching', 'coating', 'roller_pressing', 'slitting', 'electrode',
      'winding', 'assembly', 'baking', 'injection', 'wrapping',
      'formation', 'grading', 'sorting',
    ];

    const processNames: Record<string, string> = {
      batching: '配料', coating: '涂布', roller_pressing: '辊压', slitting: '分切',
      electrode: '制片', winding: '卷绕', assembly: '装配', baking: '烘烤',
      injection: '注液', wrapping: '顶封', formation: '化成', grading: '分容', sorting: '分选',
    };

    const batchNoFilter = batchNo ? `AND p.batch_no LIKE '%${batchNo.replace(/'/g, "''")}%'` : '';

    // 使用 UNION ALL 查询所有已提交 but 未质检的工序
    const queries = processTables.map(table => {
      return `SELECT '${table}' as processType, p.batch_no as batchNo, p.operator_name as operatorName, p.updated_at as submittedAt
              FROM ${table}_record p
              WHERE p.is_draft = 0 AND p.record_status = 1
              AND NOT EXISTS (SELECT 1 FROM quality_check q WHERE q.batch_no = p.batch_no AND q.process_type = '${table}')
              ${batchNoFilter}`;
    });
    queries.push(`SELECT p.process_code as processType, p.batch_no as batchNo,
                         JSON_VALUE(p.extra_data, '$.operatorName') as operatorName, p.updated_at as submittedAt
                  FROM process_dynamic_record p
                  WHERE p.is_draft = 0 AND p.record_status = 1
                  AND NOT EXISTS (SELECT 1 FROM quality_check q WHERE q.batch_no = p.batch_no AND q.process_type = p.process_code)
                  ${batchNo ? `AND p.batch_no LIKE '%${batchNo.replace(/'/g, "''")}%'` : ''}`);
    for (const item of PROCESS_BASELINE) processNames[item.processCode] = item.processName;

    const results: any[] = await this.repo.query(queries.join('\nUNION ALL\n'));
    return results.map(r => ({
      processType: r.processType,
      processName: processNames[r.processType] || r.processType,
      batchNo: r.batchNo,
      operatorName: r.operatorName,
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : null,
    }));
  }

  async findOne(id: number): Promise<QualityCheck> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException({ code: 'QUALITY_NOT_FOUND', message: '质检记录不存在' });
    }
    return record;
  }

  async findAll(batchNo: string): Promise<QualityCheck[]> {
    return this.repo.find({ where: { batchNo }, order: { createdAt: 'DESC' } });
  }

  async update(id: number, dto: Partial<CreateQualityCheckDto>, userId: number): Promise<QualityCheck> {
    const record = await this.findOne(id);
    if (dto.processType !== undefined) record.processType = dto.processType;
    if (dto.inspectionResult !== undefined) record.inspectionResult = dto.inspectionResult;
    if (dto.defectQty !== undefined) record.defectQty = dto.defectQty;
    if (dto.defectReason !== undefined) record.defectReason = dto.defectReason;
    if (dto.inspectorName !== undefined) record.inspectorName = dto.inspectorName;
    if (dto.abnormalRecord !== undefined) record.abnormalRecord = dto.abnormalRecord;
    record.updatedBy = userId;
    return this.repo.save(record);
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
  }

  async getQualityTrends() {
    const batches = await this.batchRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (batches.length === 0) return [];

    const batchNos = batches.map((b) => b.batchNo);

    const results = await this.cellBarcodeRepo
      .createQueryBuilder('cb')
      .select('cb.batchNo', 'batchNo')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN cb.grade = \'A\' THEN 1 ELSE 0 END)', 'passed')
      .where('cb.batchNo IN (:...batchNos)', { batchNos })
      .groupBy('cb.batchNo')
      .getRawMany();

    const resultMap = new Map(results.map((r) => [r.batchNo, r]));

    return batches.reverse().map((batch) => {
      const row = resultMap.get(batch.batchNo);
      const total = row ? Number(row.total) : 0;
      const passed = row ? Number(row.passed) : 0;
      const rate = total > 0 ? (passed / total) * 100 : null;
      return {
        batchNo: batch.batchNo,
        passRate: rate !== null ? parseFloat(rate.toFixed(1)) : null,
      };
    });
  }
}
