import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectrodeRecord } from './electrode-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateElectrodeDraftDto } from './dto/create-draft.dto';
import { SubmitElectrodeQualityDto } from './dto/submit-quality.dto';

@Injectable()
export class ElectrodeService {
  constructor(
    @InjectRepository(ElectrodeRecord)
    private readonly repo: Repository<ElectrodeRecord>,
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

  async createDraft(dto: CreateElectrodeDraftDto, userId: number): Promise<ElectrodeRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      existing.tabMaterialSpec = dto.tabMaterialSpec;
      existing.electrodeLength = dto.electrodeLength;
      existing.operatorName = dto.operatorName;
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      tabMaterialSpec: dto.tabMaterialSpec,
      electrodeLength: dto.electrodeLength,
      operatorName: dto.operatorName,
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitElectrodeQualityDto, userId: number): Promise<ElectrodeRecord> {
    await this.validateBatch(dto.batchNo);

    const record = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到极片草稿记录' });
    }
    if (!record.tabMaterialSpec || !record.electrodeLength || !record.operatorName) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    record.tabWeldingPull = dto.tabWeldingPull;
    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    await this.qualityCheckRepo.save(
      this.qualityCheckRepo.create({
        batchNo: dto.batchNo,
        processType: 'electrode',
        inspectionResult: 1,
        inspectorName: record.operatorName,
        createdBy: userId,
      }),
    );

    return saved;
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
