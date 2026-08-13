import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SystemLog } from './entities/log.entity';
import { SystemConfig } from './entities/config.entity';
import { SorterApiLog } from './entities/sorter-api-log.entity';
import { SystemRole } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { User } from '../user/user.entity';

const FALLBACK_ROLES = [
  { code: 1, name: '操作员', description: '生产线操作，工序录入', isSystem: true, createdAt: null },
  { code: 2, name: '质检员', description: '质量控制，巡检检验', isSystem: true, createdAt: null },
  { code: 3, name: '仓管员', description: '仓库管理，物料出入库', isSystem: true, createdAt: null },
  { code: 4, name: '系统管理员', description: '系统管理员，拥有全部权限', isSystem: true, createdAt: null },
];

@Injectable()
export class SystemService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepo: Repository<SystemLog>,
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
    @InjectRepository(SorterApiLog)
    private readonly sorterApiLogRepo: Repository<SorterApiLog>,
    @InjectRepository(SystemRole)
    private readonly roleRepo: Repository<SystemRole>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  onModuleInit() {
    // 启动时清理一次旧日志
    this.cleanOldSorterApiLogs();

    // 每12小时清理一次旧日志
    setInterval(() => {
      this.cleanOldSorterApiLogs();
    }, 12 * 60 * 60 * 1000);
  }

  async cleanOldSorterApiLogs() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    try {
      const result = await this.sorterApiLogRepo
        .createQueryBuilder()
        .delete()
        .where('createdAt < :date', { date: threeDaysAgo })
        .execute();
      console.log(`[System] Cleaned up old sorter API logs. Affected rows: ${result.affected}`);
    } catch (error) {
      console.error('[System] Failed to clean up old sorter API logs:', error);
    }
  }

  async logSorterApi(data: Partial<SorterApiLog>) {
    const log = this.sorterApiLogRepo.create(data);
    return this.sorterApiLogRepo.save(log);
  }

  async getSorterLogs(params: {
    page: number;
    pageSize: number;
    isSuccess?: boolean;
    apiEndpoint?: string;
    apiType?: string;
  }) {
    const page = Number(params.page || 1);
    const pageSize = Number(params.pageSize || 20);
    const { isSuccess, apiEndpoint, apiType } = params;

    const query = this.sorterApiLogRepo.createQueryBuilder('log');

    if (isSuccess !== undefined) {
      query.andWhere('log.isSuccess = :isSuccess', { isSuccess });
    }

    if (apiEndpoint) {
      query.andWhere('log.apiEndpoint LIKE :apiEndpoint', { apiEndpoint: `%${apiEndpoint}%` });
    }

    if (apiType) {
      query.andWhere('log.apiType = :apiType', { apiType });
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

  async listRoles(): Promise<SystemRole[]> {
    try {
      const items = await this.roleRepo.find({ order: { code: 'ASC' } });
      if (items.length > 0) return items;
      return FALLBACK_ROLES as unknown as SystemRole[];
    } catch (err) {
      console.warn('[SystemService.listRoles] fallback to static list:', (err as Error).message);
      return FALLBACK_ROLES as unknown as SystemRole[];
    }
  }

  async createRole(dto: CreateRoleDto): Promise<SystemRole> {
    const code = Number(dto.code);
    const name = (dto.name || '').trim();
    const description = dto.description?.trim() || null;

    if (!Number.isInteger(code) || code < 5) {
      throw new BadRequestException('角色编码必须为不小于5的整数');
    }
    if (!name) {
      throw new BadRequestException('角色名称不能为空');
    }

    try {
      const exists = await this.roleRepo.findOne({ where: [{ code }, { name }] });
      if (exists) {
        throw new ConflictException('角色编码或名称已存在');
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw new BadRequestException(
        '角色字典表尚未初始化，请联系管理员运行迁移后重试',
      );
    }

    const role = this.roleRepo.create({
      code,
      name,
      description,
      isSystem: false,
    });
    return this.roleRepo.save(role);
  }

  async updateRole(code: number, dto: UpdateRoleDto): Promise<SystemRole> {
    const role = await this.roleRepo.findOne({ where: { code } });
    if (!role) {
      throw new NotFoundException(`角色编码 ${code} 不存在`);
    }
    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不可编辑');
    }
    if (dto.name !== undefined) {
      const trimmed = (dto.name || '').trim();
      if (!trimmed) {
        throw new BadRequestException('角色名称不能为空');
      }
      if (trimmed !== role.name) {
        const conflict = await this.roleRepo.findOne({ where: { name: trimmed } });
        if (conflict && conflict.code !== role.code) {
          throw new ConflictException('角色名称已存在');
        }
        role.name = trimmed;
      }
    }
    if (dto.description !== undefined) {
      role.description = dto.description ? dto.description.trim() || null : null;
    }
    return this.roleRepo.save(role);
  }

  async deleteRole(code: number): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { code } });
    if (!role) {
      throw new NotFoundException(`角色编码 ${code} 不存在`);
    }
    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不可删除');
    }
    const inUse = await this.userRepo.count({ where: { roleCode: code } });
    if (inUse > 0) {
      throw new BadRequestException(`该角色已被 ${inUse} 个用户占用，无法删除`);
    }
    await this.roleRepo.delete({ code });
  }

  async rolesInUseCodes(codes: number[]): Promise<Set<number>> {
    if (!codes.length) return new Set();
    const users = await this.userRepo.find({ where: { roleCode: In(codes) }, select: ['id', 'roleCode'] });
    return new Set(users.map((u) => u.roleCode));
  }
}
