import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../batch/batch.entity';
import { SaveProcessParameterDto } from './dto/save-process-parameter.dto';
import { ProcessParameter } from './process-parameter.entity';

const ALLOWED_PROCESS_CODES = new Set(['ocv1', 'ocv2']);

@Injectable()
export class ProcessParameterService {
  constructor(
    @InjectRepository(ProcessParameter) private readonly repo: Repository<ProcessParameter>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
  ) {}

  private validateProcessCode(processCode: string) {
    if (!ALLOWED_PROCESS_CODES.has(processCode)) {
      throw new BadRequestException({ code: 'PROCESS_PARAMETER_UNSUPPORTED', message: '仅支持 OCV1 和 OCV2 参数' });
    }
  }

  private validateRanges(dto: SaveProcessParameterDto) {
    const ranges: Array<[string, number, number]> = [
      ['OCV电压', dto.ocvVoltageMin, dto.ocvVoltageMax],
      ['内阻', dto.irMin, dto.irMax],
      ['容量', dto.capacityMin, dto.capacityMax],
    ];
    const invalid = ranges.find(([, min, max]) => min > max);
    if (invalid) {
      throw new BadRequestException({ code: 'INVALID_PARAMETER_RANGE', message: `${invalid[0]}范围的最小值不能大于最大值` });
    }
  }

  async findByBatchNo(processCode: string, batchNo: string): Promise<ProcessParameter | null> {
    this.validateProcessCode(processCode);
    return this.repo.findOne({ where: { processCode, batchNo } });
  }

  async saveDraft(processCode: string, dto: SaveProcessParameterDto, userId: number): Promise<ProcessParameter> {
    this.validateProcessCode(processCode);
    this.validateRanges(dto);
    const batch = await this.batchRepo.findOne({ where: { batchNo: dto.batchNo } });
    if (!batch) {
      throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${dto.batchNo} 不存在` });
    }

    let record = await this.repo.findOne({ where: { processCode, batchNo: dto.batchNo } });
    if (!record) {
      record = this.repo.create({ processCode, batchNo: dto.batchNo, createdBy: userId });
    }
    Object.assign(record, dto, { processCode, updatedBy: userId });
    return this.repo.save(record);
  }
}
