import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RollerPressingRecord } from './roller-pressing-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateRollerPressingDraftDto } from './dto/create-draft.dto';

@Injectable()
export class RollerPressingService {
  constructor(
    @InjectRepository(RollerPressingRecord)
    private readonly repo: Repository<RollerPressingRecord>,
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

  async createDraft(dto: CreateRollerPressingDraftDto, userId: number): Promise<RollerPressingRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      existing.equipmentCode = dto.equipmentCode;
      existing.rollerPressure = dto.rollerPressure;
      existing.rollerThickness = dto.rollerThickness;
      if (dto.rollerSpeed !== undefined) existing.rollerSpeed = dto.rollerSpeed;
      existing.operatorName = dto.operatorName;
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      equipmentCode: dto.equipmentCode,
      rollerPressure: dto.rollerPressure,
      rollerThickness: dto.rollerThickness,
      rollerSpeed: dto.rollerSpeed,
      operatorName: dto.operatorName,
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  async submitQuality(batchNo: string, userId: number): Promise<RollerPressingRecord> {
    await this.validateBatch(batchNo);

    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到辊压草稿记录' });
    }
    if (!record.equipmentCode || !record.rollerPressure || !record.rollerThickness || !record.operatorName) {
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
        processType: 'roller-pressing',
        inspectionResult: 1,
        inspectorName: record.operatorName,
        createdBy: userId,
      }),
    );

    return saved;
  }

  async findByBatchNo(batchNo: string): Promise<RollerPressingRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<RollerPressingRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到辊压记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
