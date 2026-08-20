import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../batch/batch.entity';
import { getProcessBaseline, hasIncompatibleFieldDefinitions } from '../master-data/process-baseline';
import { ProcessDictionary } from '../master-data/process-dictionary/process-dictionary.entity';
import { ProcessDynamicRecord } from './process-dynamic-record.entity';

@Injectable()
export class ProcessDynamicService {
  constructor(
    @InjectRepository(ProcessDynamicRecord) private readonly repo: Repository<ProcessDynamicRecord>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
    @InjectRepository(ProcessDictionary) private readonly dictionaryRepo: Repository<ProcessDictionary>,
  ) {}

  private validate(processCode: string) {
    if (!getProcessBaseline(processCode)) throw new BadRequestException({ code: 'PROCESS_UNSUPPORTED', message: '不支持的普通工序' });
  }

  private async getFieldDefinitions(processCode: string) {
    const dictionary = await this.dictionaryRepo.findOne({ where: { processCode } });
    const baseline = getProcessBaseline(processCode);
    if (baseline) {
      if (hasIncompatibleFieldDefinitions(dictionary?.fieldDefinitions, baseline.fieldDefinitions)) {
        return baseline.fieldDefinitions;
      }
    }
    if (dictionary?.fieldDefinitions) {
      try {
        const fields = JSON.parse(dictionary.fieldDefinitions);
        if (Array.isArray(fields)) return fields.filter((field) => field && typeof field === 'object');
      } catch { /* use the immutable baseline when configuration is malformed */ }
    }
    return getProcessBaseline(processCode)?.fieldDefinitions ?? [];
  }

  private async validateSubmission(processCode: string, data: Record<string, unknown>) {
    const fields = await this.getFieldDefinitions(processCode);
    const missing: string[] = [];
    const invalid: string[] = [];
    for (const field of fields) {
      if (field.type === 'range' && field.minKey && field.maxKey) {
        const minValue = data[field.minKey];
        const maxValue = data[field.maxKey];
        if (field.required !== false && (minValue === undefined || minValue === null || String(minValue).trim() === '')) {
          missing.push(field.minLabel || `${field.label}最小值`);
        }
        if (field.required !== false && (maxValue === undefined || maxValue === null || String(maxValue).trim() === '')) {
          missing.push(field.maxLabel || `${field.label}最大值`);
        }
        if (minValue !== undefined && minValue !== null && String(minValue).trim() !== '' && !Number.isFinite(Number(minValue))) invalid.push(field.minLabel || `${field.label}最小值`);
        if (maxValue !== undefined && maxValue !== null && String(maxValue).trim() !== '' && !Number.isFinite(Number(maxValue))) invalid.push(field.maxLabel || `${field.label}最大值`);
        if (Number.isFinite(Number(minValue)) && Number.isFinite(Number(maxValue)) && Number(minValue) > Number(maxValue)) invalid.push(field.label);
        continue;
      }
      const value = data[field.key];
      if (field.required !== false && (value === undefined || value === null || String(value).trim() === '')) {
        missing.push(field.label || field.key);
        continue;
      }
      if (value === undefined || value === null || String(value).trim() === '') continue;
      if (field.type === 'number' && !Number.isFinite(Number(value))) invalid.push(field.label || field.key);
      const numericValue = Number(value);
      if (field.min != null && Number.isFinite(numericValue) && numericValue < Number(field.min)) invalid.push(field.label || field.key);
      if (field.max != null && Number.isFinite(numericValue) && numericValue > Number(field.max)) invalid.push(field.label || field.key);
    }
    if (missing.length) throw new BadRequestException({ code: 'PROCESS_FIELDS_INCOMPLETE', message: `以下参数未填写：${missing.join('、')}` });
    if (invalid.length) throw new BadRequestException({ code: 'PROCESS_FIELDS_INVALID', message: `以下参数不符合配置范围或类型：${[...new Set(invalid)].join('、')}` });
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

  async submit(processCode: string, batchNo: string, data: Record<string, unknown>, userId: number) {
    this.validate(processCode);
    if (!(await this.batchRepo.findOne({ where: { batchNo } }))) throw new NotFoundException({ code: 'BATCH_NOT_FOUND', message: `批次 ${batchNo} 不存在` });
    let record = await this.repo.findOne({ where: { processCode, batchNo } });
    if (!record) record = this.repo.create({ processCode, batchNo, createdBy: userId });
    let existing: Record<string, unknown> = {};
    if (record.extraData) {
      try { existing = JSON.parse(record.extraData); } catch { existing = {}; }
    }
    const mergedData = { ...existing, ...data };
    await this.validateSubmission(processCode, mergedData);
    record.extraData = JSON.stringify(mergedData);
    record.isDraft = false;
    record.recordStatus = 1;
    record.updatedBy = userId;
    return this.repo.save(record);
  }
}
