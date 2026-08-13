import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BatchingRecord } from './batching-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateBatchingDraftDto } from './dto/create-draft.dto';
import { SubmitBatchingQualityDto } from './dto/submit-quality.dto';
import { mergeExtraData } from '../../common/utils/process-record.util';

const BATCHING_ENTITY_FIELDS = [
  'positiveMaterial', 'negativeMaterial', 'viscosityRecord', 'operatorName'
];

@Injectable()
export class BatchingService {
  constructor(
    @InjectRepository(BatchingRecord)
    private readonly repo: Repository<BatchingRecord>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(QualityCheck)
    private readonly qualityCheckRepo: Repository<QualityCheck>,
    private readonly dataSource: DataSource,
  ) {}

  private async validateBatch(batchNo: string) {
    const batch = await this.batchRepo.findOne({ where: { batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    }
    return batch;
  }

  async createDraft(dto: CreateBatchingDraftDto, userId: number): Promise<BatchingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      mergeExtraData(existing, dto, BATCHING_ENTITY_FIELDS);
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      createdBy: userId,
    });
    mergeExtraData(record, dto, BATCHING_ENTITY_FIELDS);
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitBatchingQualityDto, userId: number): Promise<BatchingRecord> {
    await this.validateBatch(dto.batchNo);

    return this.dataSource.transaction(async (manager) => {
      let record = await manager.findOne(BatchingRecord, { where: { batchNo: dto.batchNo } });
      if (!record) {
        record = manager.create(BatchingRecord, { batchNo: dto.batchNo, createdBy: userId });
      }
      
      mergeExtraData(record, dto, BATCHING_ENTITY_FIELDS);

      // Verify operator fields are filled
      if (!record.positiveMaterial || !record.negativeMaterial || !record.operatorName) {
        throw new BadRequestException({
          code: 'PROCESS_FIELDS_INCOMPLETE',
          message: '操作员字段未填写完整，请先保存草稿',
        });
      }

      record.isDraft = false;
      record.updatedBy = userId;
      const saved = await manager.save(record);

      return saved;
    });
  }

  async findByBatchNo(batchNo: string): Promise<BatchingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<BatchingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到配料记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
