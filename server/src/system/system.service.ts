import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { SystemConfig } from './entities/config.entity';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepo: Repository<SystemLog>,
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  async getLogs(params: { page: number; pageSize: number; module?: string }) {
    const page = Number(params.page || 1);
    const pageSize = Number(params.pageSize || 20);
    const { module } = params;
    const query = this.logRepo.createQueryBuilder('log');

    if (module) {
      query.andWhere('log.module = :module', { module });
    }

    const [items, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data: { items },
      meta: { total, page, pageSize },
    };
  }

  async getConfigs() {
    return this.configRepo.find();
  }

  async updateConfig(id: number, value: string) {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`配置项 ID ${id} 不存在`);
    }
    config.value = value;
    return this.configRepo.save(config);
  }

  async logAction(data: Partial<SystemLog>) {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }
}
