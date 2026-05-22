import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ElectrodeRecord } from './electrode-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateElectrodeDraftDto } from './dto/create-draft.dto';
import { SubmitElectrodeQualityDto } from './dto/submit-quality.dto';
import { mergeExtraData } from '../../common/utils/process-record.util';

const ELECTRODE_ENTITY_FIELDS = [
  'tabMaterialSpec', 'electrodeLength', 'tabWeldingPull', 'operatorName'
];

@Injectable()
export class ElectrodeService {
  constructor(
    @InjectRepository(ElectrodeRecord)
    private readonly repo: Repository<ElectrodeRecord>,
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

  async createDraft(dto: CreateElectrodeDraftDto, userId: number): Promise<ElectrodeRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      mergeExtraData(existing, dto, ELECTRODE_ENTITY_FIELDS);
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      createdBy: userId,
    });
    mergeExtraData(record, dto, ELECTRODE_ENTITY_FIELDS);
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitElectrodeQualityDto, userId: number): Promise<ElectrodeRecord> {
    await this.validateBatch(dto.batchNo);

    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(ElectrodeRecord, { where: { batchNo: dto.batchNo } });
      if (!record) {
        throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到极片草稿记录' });
      }

      mergeExtraData(record, dto, ELECTRODE_ENTITY_FIELDS);

      if (!record.tabMaterialSpec || !record.electrodeLength || !record.operatorName) {
        throw new BadRequestException({
          code: 'PROCESS_FIELDS_INCOMPLETE',
          message: '操作员字段未填写完整，请先保存草稿',
        });
      }

      record.isDraft = false;
      record.updatedBy = userId;
      const saved = await manager.save(record);

      await manager.save(
        manager.create(QualityCheck, {
          batchNo: dto.batchNo,
          processType: 'electrode',
          inspectionResult: 1,
          inspectorName: record.operatorName,
          createdBy: userId,
        }),
      );

      return saved;
    });
  }

  async findByBatchNo(batchNo: string): Promise<ElectrodeRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<ElectrodeRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到极片记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
