import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WrappingRecord } from './wrapping-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateWrappingDraftDto } from './dto/create-draft.dto';
import { SubmitWrappingQualityDto } from './dto/submit-quality.dto';
import { mergeExtraData } from '../../common/utils/process-record.util';

const WRAPPING_ENTITY_FIELDS = [
  'equipmentCode', 'filmModel', 'shrinkTemperature', 'appearanceCheck', 'operatorName'
];

@Injectable()
export class WrappingService {
  constructor(
    @InjectRepository(WrappingRecord)
    private readonly repo: Repository<WrappingRecord>,
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

  async createDraft(dto: CreateWrappingDraftDto, userId: number): Promise<WrappingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      mergeExtraData(existing, dto, WRAPPING_ENTITY_FIELDS);
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      createdBy: userId,
    });
    mergeExtraData(record, dto, WRAPPING_ENTITY_FIELDS);
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitWrappingQualityDto, userId: number): Promise<WrappingRecord> {
    await this.validateBatch(dto.batchNo);

    let record = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (!record) {
      record = this.repo.create({ batchNo: dto.batchNo, createdBy: userId });
    }

    mergeExtraData(record, dto, WRAPPING_ENTITY_FIELDS);

    if (!record.equipmentCode || !record.filmModel || !record.shrinkTemperature || !record.operatorName) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    return saved;
  }

  async findByBatchNo(batchNo: string): Promise<WrappingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<WrappingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到包膜记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
