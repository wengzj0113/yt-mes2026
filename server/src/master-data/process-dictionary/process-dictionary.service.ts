import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProcessDictionary } from './process-dictionary.entity';

@Injectable()
export class ProcessDictionaryService {
  constructor(
    @InjectRepository(ProcessDictionary)
    private readonly processDictRepo: Repository<ProcessDictionary>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query?: { keyword?: string; isActive?: string; page?: number; pageSize?: number }) {
    const qb = this.processDictRepo.createQueryBuilder('pd');

    if (query?.keyword) {
      qb.andWhere('(pd.processCode LIKE :keyword OR pd.processName LIKE :keyword)', { keyword: `%${query.keyword}%` });
    }

    if (query?.isActive !== undefined && query?.isActive !== '') {
      const isActiveBool = query.isActive === 'true';
      qb.andWhere('pd.isActive = :isActive', { isActive: isActiveBool });
    }

    qb.orderBy('pd.sortOrder', 'ASC');

    const page = query?.page ? Number(query.page) : 1;
    const pageSize = query?.pageSize ? Number(query.pageSize) : 20;

    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number): Promise<ProcessDictionary> {
    const process = await this.processDictRepo.findOne({ where: { id } });
    if (!process) {
      throw new NotFoundException(`Process Dictionary with ID ${id} not found`);
    }
    return process;
  }

  async create(data: Partial<ProcessDictionary>): Promise<ProcessDictionary> {
    const process = this.processDictRepo.create(data);
    return this.processDictRepo.save(process);
  }

  async update(id: number, data: Partial<ProcessDictionary>): Promise<ProcessDictionary> {
    await this.processDictRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const process = await this.findOne(id);
    
    // Convert process code to table name (e.g. roller-pressing -> roller_pressing_record)
    const tableName = `${process.processCode.replace(/-/g, '_')}_record`;
    
    try {
      // Try to select 1 record to see if the table has data
      const records = await this.dataSource.query(`SELECT TOP 1 id FROM ${tableName}`);
      if (records && records.length > 0) {
        throw new BadRequestException(`该工序已被历史生产批次使用过，无法删除，建议将其停用。`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If error is about missing table (e.g. Invalid object name), we can safely ignore it and proceed with deletion
    }

    await this.processDictRepo.delete(id);
  }
}
