import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../batch/batch.entity';
import { getProcessBaseline } from '../master-data/process-baseline';
import { ProcessDynamicRecord } from './process-dynamic-record.entity';

@Injectable()
export class ProcessDynamicService {
  constructor(@InjectRepository(ProcessDynamicRecord) private readonly repo: Repository<ProcessDynamicRecord>, @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>) {}

  private validate(processCode: string) {
    if (!getProcessBaseline(processCode)) throw new BadRequestException({ code: 'PROCESS_UNSUPPORTED', message: '不支持的普通工序' });
  }

  async findByBatchNo(processCode: string, batchNo: string) {
    this.validate(processCode);
    return this.repo.findOne({ where: { processCode, batchNo } });
  }

  async saveDraft(processCode: string, batchNo: string, data: Record<string, unknown>, userId: number) {
    this.validate(processCode);
    if (!(await this.batchRepo.findOne({ where: { batchNo } }))) throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    let record = await this.repo.findOne({ where: { processCode, batchNo } });
    if (!record) record = this.repo.create({ processCode, batchNo, createdBy: userId });
    record.extraData = JSON.stringify(data);
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
