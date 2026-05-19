import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchingRecord } from './batching-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateBatchingDraftDto } from './dto/create-draft.dto';
import { SubmitBatchingQualityDto } from './dto/submit-quality.dto';

@Injectable()
export class BatchingService {
  constructor(
    @InjectRepository(BatchingRecord)
    private readonly repo: Repository<BatchingRecord>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(QualityCheck)
    private readonly qualityCheckRepo: Repository<QualityCheck>,
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
      // Update existing draft
      existing.positiveMaterial = dto.positiveMaterial;
      existing.negativeMaterial = dto.negativeMaterial;
      existing.operatorName = dto.operatorName;
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      positiveMaterial: dto.positiveMaterial,
      negativeMaterial: dto.negativeMaterial,
      operatorName: dto.operatorName,
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitBatchingQualityDto, userId: number): Promise<BatchingRecord> {
    await this.validateBatch(dto.batchNo);

    const record = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到配料草稿记录' });
    }
    // Verify operator fields are filled
    if (!record.positiveMaterial || !record.negativeMaterial || !record.operatorName) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    record.viscosityRecord = dto.viscosityRecord;
    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    // 同步创建质量检验记录
    await this.qualityCheckRepo.save(
      this.qualityCheckRepo.create({
        batchNo: dto.batchNo,
        processType: 'batching',
        inspectionResult: 1,
        inspectorName: record.operatorName,
        createdBy: userId,
      }),
    );

    return saved;
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
