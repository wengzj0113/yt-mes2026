import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssemblyRecord } from './assembly-record.entity';
import { Batch } from '../../batch/batch.entity';
import { QualityCheck } from '../../quality/quality-check.entity';
import { CreateAssemblyDraftDto } from './dto/create-draft.dto';
import { SubmitAssemblyQualityDto } from './dto/submit-quality.dto';

@Injectable()
export class AssemblyService {
  constructor(
    @InjectRepository(AssemblyRecord)
    private readonly repo: Repository<AssemblyRecord>,
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

  async createDraft(dto: CreateAssemblyDraftDto, userId: number): Promise<AssemblyRecord> {
    await this.validateBatch(dto.batchNo);

    const existing = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (existing) {
      existing.casingEquipmentCode = dto.casingEquipmentCode;
      existing.shellModel = dto.shellModel;
      existing.bottomWeldEquipment = dto.bottomWeldEquipment;
      existing.bottomWeldParams = dto.bottomWeldParams;
      existing.capModel = dto.capModel;
      existing.operatorName = dto.operatorName;
      existing.updatedBy = userId;
      return this.repo.save(existing);
    }

    const record = this.repo.create({
      batchNo: dto.batchNo,
      casingEquipmentCode: dto.casingEquipmentCode,
      shellModel: dto.shellModel,
      bottomWeldEquipment: dto.bottomWeldEquipment,
      bottomWeldParams: dto.bottomWeldParams,
      capModel: dto.capModel,
      operatorName: dto.operatorName,
      createdBy: userId,
    });
    return this.repo.save(record);
  }

  async submitQuality(dto: SubmitAssemblyQualityDto, userId: number): Promise<AssemblyRecord> {
    await this.validateBatch(dto.batchNo);

    const record = await this.repo.findOne({ where: { batchNo: dto.batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到组装草稿记录' });
    }
    if (!record.casingEquipmentCode || !record.shellModel || !record.bottomWeldEquipment
      || !record.bottomWeldParams || !record.capModel || !record.operatorName) {
      throw new BadRequestException({
        code: 'PROCESS_FIELDS_INCOMPLETE',
        message: '操作员字段未填写完整，请先保存草稿',
      });
    }

    record.bottomWeldPull = dto.bottomWeldPull;
    record.grooveRecord = dto.grooveRecord;
    record.capWeldingPull = dto.capWeldingPull;
    record.tabWeldingPull = dto.tabWeldingPull;
    record.isDraft = false;
    record.updatedBy = userId;
    const saved = await this.repo.save(record);

    await this.qualityCheckRepo.save(
      this.qualityCheckRepo.create({
        batchNo: dto.batchNo,
        processType: 'assembly',
        inspectionResult: 1,
        inspectorName: record.operatorName,
        createdBy: userId,
      }),
    );

    return saved;
  }

  async findByBatchNo(batchNo: string): Promise<AssemblyRecord | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  async voidRecord(batchNo: string, userId: number): Promise<AssemblyRecord> {
    const record = await this.repo.findOne({ where: { batchNo } });
    if (!record) {
      throw new NotFoundException({ code: 'PROCESS_DRAFT_EXISTS', message: '未找到组装记录' });
    }
    if (record.recordStatus === 2) {
      throw new BadRequestException({ code: 'PROCESS_ALREADY_SUBMITTED', message: '记录已被作废' });
    }

    record.recordStatus = 2;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
