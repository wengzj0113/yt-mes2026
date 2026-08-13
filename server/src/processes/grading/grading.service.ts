import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradingRecord } from './grading-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateGradingDraftDto } from './dto/create-draft.dto';
import { SubmitGradingQualityDto } from './dto/submit-quality.dto';
import { mergeExtraData } from '../../common/utils/process-record.util';

const GRADING_ENTITY_FIELDS = [
  'equipmentCode', 'chargeDischargeTemplate', 'gradingTemperature', 'capacityGradeStandard', 'operatorName'
];

@Injectable()
export class GradingService {
  constructor(
    @InjectRepository(GradingRecord)
    private readonly repo: Repository<GradingRecord>,
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

  async createDraft(dto: CreateGradingDraftDto, userId: number): Promise<GradingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      mergeExtraData(existing, dto, GRADING_ENTITY_FIELDS);
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      createdBy: userId,
    });
    mergeExtraData(record, dto, GRADING_ENTITY_FIELDS);
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitGradingQualityDto, userId: number): Promise<GradingRecord> {
    await this.validateBatch(dto.batchNo);

    let record = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (!record) {
      record = this.repo.create({ batchNo: dto.batchNo, createdBy: userId });
    }

    mergeExtraData(record, dto, GRADING_ENTITY_FIELDS);

    if (!record.equipmentCode || !record.operatorName) {
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

  async findByBatchNo(batchNo: string): Promise<GradingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<GradingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到分容记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
