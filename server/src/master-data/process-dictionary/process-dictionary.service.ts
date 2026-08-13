import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { ProcessDictionary } from './process-dictionary.entity';
import { OCV_PROCESS_FIELDS, PROCESS_BASELINE } from '../process-baseline';

@Injectable()
export class ProcessDictionaryService implements OnModuleInit {
  constructor(
    @InjectRepository(ProcessDictionary) private readonly processDictRepo: Repository<ProcessDictionary>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() { await this.syncBaseline(); }

  private async syncBaseline() {
    const processes = await this.processDictRepo.find();
    const byCode = new Map(processes.map((process) => [process.processCode, process]));
    for (const definition of PROCESS_BASELINE) {
      const existing = byCode.get(definition.processCode);
      const fields = JSON.stringify(definition.fieldDefinitions);
      if (!existing) {
        await this.processDictRepo.save(this.processDictRepo.create({ ...definition, fieldDefinitions: fields }));
        continue;
      }
      if (existing.processName !== definition.processName || existing.sortOrder !== definition.sortOrder || existing.fieldDefinitions !== fields || !existing.isActive) {
        Object.assign(existing, { ...definition, fieldDefinitions: fields });
        await this.processDictRepo.save(existing);
      }
    }
    for (const legacyCode of ['formation', 'grading']) {
      const legacy = byCode.get(legacyCode);
      if (legacy?.isActive) {
        legacy.isActive = false;
        await this.processDictRepo.save(legacy);
      }
    }
    for (const definition of [
      { processCode: 'ocv1', processName: 'OCV1测试', sortOrder: 125, isActive: true },
      { processCode: 'ocv2', processName: 'OCV2测试', sortOrder: 128, isActive: true },
    ]) {
      const existing = byCode.get(definition.processCode);
      const fieldDefinitions = JSON.stringify(OCV_PROCESS_FIELDS);
      if (!existing) await this.processDictRepo.save(this.processDictRepo.create({ ...definition, fieldDefinitions }));
      else if (existing.processName !== definition.processName || existing.sortOrder !== definition.sortOrder || existing.fieldDefinitions !== fieldDefinitions || !existing.isActive) await this.processDictRepo.save(Object.assign(existing, { ...definition, fieldDefinitions }));
    }
  }

  async findAll(query?: { keyword?: string; isActive?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (query?.keyword) where.processName = Like(`%${query.keyword}%`);
    if (query?.isActive !== undefined && query?.isActive !== '') where.isActive = query.isActive === 'true';
    const page = query?.page ? Number(query.page) : 1;
    const pageSize = query?.pageSize ? Number(query.pageSize) : 20;
    const [items, total] = await this.processDictRepo.findAndCount({ where, order: { sortOrder: 'ASC' }, skip: (page - 1) * pageSize, take: pageSize });
    return { items, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
  }

  async findOne(id: number): Promise<ProcessDictionary> {
    const process = await this.processDictRepo.findOne({ where: { id } });
    if (!process) throw new NotFoundException(`Process Dictionary with ID ${id} not found`);
    return process;
  }

  async findByCode(processCode: string): Promise<ProcessDictionary | null> { return this.processDictRepo.findOne({ where: { processCode } }); }
  async create(data: Partial<ProcessDictionary>): Promise<ProcessDictionary> { return this.processDictRepo.save(this.processDictRepo.create(data)); }
  async update(id: number, data: Partial<ProcessDictionary>): Promise<ProcessDictionary> { await this.processDictRepo.update(id, data); return this.findOne(id); }

  async remove(id: number): Promise<void> {
    const process = await this.findOne(id);
    if (!/^[a-zA-Z0-9_-]+$/.test(process.processCode)) throw new BadRequestException('无效的工序代码');
    const tableName = `${process.processCode.replace(/-/g, '_')}_record`;
    try {
      const records = await this.dataSource.query(`SELECT TOP 1 id FROM ${tableName}`);
      if (records?.length) throw new BadRequestException('该工序已有历史生产批次使用过，无法删除，建议将其停用。');
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
    }
    await this.processDictRepo.delete(id);
  }
}
