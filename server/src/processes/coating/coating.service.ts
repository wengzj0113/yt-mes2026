import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoatingRecord } from './coating-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateCoatingDraftDto } from './dto/create-draft.dto';
import { mergeExtraData } from '../../common/utils/process-record.util';

const COATING_ENTITY_FIELDS = [
  'equipmentCode', 'coatingSpeed', 'coatingThicknessPos', 'coatingThicknessNeg',
  'arealDensityPos', 'arealDensityNeg', 'coatingTemperature', 'operatorName'
];

@Injectable()
export class CoatingService {
  constructor(
    @InjectRepository(CoatingRecord)
    private readonly repo: Repository<CoatingRecord>,
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

  async createDraft(dto: CreateCoatingDraftDto, userId: number): Promise<CoatingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      mergeExtraData(existing, dto, COATING_ENTITY_FIELDS);
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      createdBy: userId,
    });
    mergeExtraData(record, dto, COATING_ENTITY_FIELDS);
    return this.repo.save(record);
  }

  async submitQuality(batchNo: string, userId: number): Promise<CoatingRecord> {
    await this.validateBatch(batchNo);

    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到涂布草稿记录' });
    }
    if (!record.equipmentCode || !record.coatingSpeed || !record.coatingThicknessPos
      || !record.coatingThicknessNeg || !record.arealDensityPos || !record.arealDensityNeg
      || !record.coatingTemperature || !record.operatorName) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    await this.qualityCheckRepo.save(
      this.qualityCheckRepo.create({
        batchNo,
        processType: 'coating',
        inspectionResult: 1,
        inspectorName: record.operatorName,
        createdBy: userId,
      }),
    );

    return saved;
  }

  async findByBatchNo(batchNo: string): Promise<CoatingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<CoatingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到涂布记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
