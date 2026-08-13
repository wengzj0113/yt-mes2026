import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SortingRecord } from './sorting-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateSortingDraftDto } from './dto/create-draft.dto';
import { mergeExtraData } from '../../common/utils/process-record.util';

const SORTING_ENTITY_FIELDS = [
  'equipmentCode',
  'ocvVoltageMin', 'ocvVoltageMax',
  'irMin', 'irMax',
  'capacityMin', 'capacityMax',
  'operatorName',
];

function assertRange(
  fieldLabel: string,
  min: number | null | undefined,
  max: number | null | undefined,
) {
  if (min == null || max == null) return;
  if (Number(min) > Number(max)) {
    throw new BadRequestException({
      code: 'PROCESS_RANGE_INVALID',
      message: `${fieldLabel} 范围的最小值不能大于最大值`,
    });
  }
}

@Injectable()
export class SortingService {
  constructor(
    @InjectRepository(SortingRecord)
    private readonly repo: Repository<SortingRecord>,
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

  async createDraft(dto: CreateSortingDraftDto, userId: number): Promise<SortingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      mergeExtraData(existing, dto, SORTING_ENTITY_FIELDS);
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      createdBy: userId,
    });
    mergeExtraData(record, dto, SORTING_ENTITY_FIELDS);
    return this.repo.save(record);
  }

  async submitQuality(batchNo: string, userId: number): Promise<SortingRecord> {
    await this.validateBatch(batchNo);

    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到分选草稿记录' });
    }
    if (
      !record.equipmentCode ||
      record.ocvVoltageMin == null || record.ocvVoltageMax == null ||
      record.irMin == null || record.irMax == null ||
      record.capacityMin == null || record.capacityMax == null ||
      !record.operatorName
    ) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    assertRange('OCV电压', record.ocvVoltageMin, record.ocvVoltageMax);
    assertRange('内阻',   record.irMin,          record.irMax);
    assertRange('容量',   record.capacityMin,    record.capacityMax);

    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    return saved;
  }

  async findByBatchNo(batchNo: string): Promise<SortingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<SortingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到分选记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
