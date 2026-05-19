import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BakingRecord } from './baking-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateBakingDraftDto } from './dto/create-draft.dto';
import { SubmitBakingQualityDto } from './dto/submit-quality.dto';

@Injectable()
export class BakingService {
  constructor(
    @InjectRepository(BakingRecord)
    private readonly repo: Repository<BakingRecord>,
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

  async createDraft(dto: CreateBakingDraftDto, userId: number): Promise<BakingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      existing.equipmentCode = dto.equipmentCode;
      existing.bakingTemperature = dto.bakingTemperature;
      existing.bakingDuration = dto.bakingDuration;
      existing.operatorName = dto.operatorName;
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      equipmentCode: dto.equipmentCode,
      bakingTemperature: dto.bakingTemperature,
      bakingDuration: dto.bakingDuration,
      operatorName: dto.operatorName,
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitBakingQualityDto, userId: number): Promise<BakingRecord> {
    await this.validateBatch(dto.batchNo);

    const record = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到烘烤草稿记录' });
    }
    if (!record.equipmentCode || !record.bakingTemperature || !record.bakingDuration || !record.operatorName) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    record.vacuumLevel = dto.vacuumLevel;
    record.moistureAfterBaking = dto.moistureAfterBaking;
    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    await this.qualityCheckRepo.save(
      this.qualityCheckRepo.create({
        batchNo: dto.batchNo,
        processType: 'baking',
        inspectionResult: 1,
        inspectorName: record.operatorName,
        createdBy: userId,
      }),
    );

    return saved;
  }

  async findByBatchNo(batchNo: string): Promise<BakingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<BakingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到烘烤记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
