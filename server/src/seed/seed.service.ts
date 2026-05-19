import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/user.entity';
import { Department } from '../department/department.entity';
import { Equipment } from '../equipment/equipment.entity';
import { ProcessDictionary } from '../master-data/process-dictionary/process-dictionary.entity';
import { SystemConfig } from '../system/entities/config.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(ProcessDictionary)
    private readonly processDictRepo: Repository<ProcessDictionary>,
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepo: Repository<SystemConfig>,
    private readonly configService: ConfigService,
  ) {}

  async seed() {
    await this.seedUsers();
    await this.seedDepartments();
    await this.seedEquipment();
    await this.seedProcessDictionary();
    await this.seedSystemConfig();
    console.log('Seed completed successfully.');
  }

  private async seedSystemConfig() {
    const count = await this.systemConfigRepo.count();
    if (count > 0) {
      console.log('System Config already seeded, skipping.');
      return;
    }

    const configs = this.systemConfigRepo.create([
      { key: 'system_name', value: 'YT-MES 智能生产执行系统', description: '系统显示名称' },
      { key: 'allow_guest_login', value: 'false', description: '是否允许游客登录' },
      { key: 'max_login_attempts', value: '5', description: '最大登录尝试次数' },
      { key: 'session_timeout', value: '3600', description: '会话超时时间 (秒)' },
    ]);
    await this.systemConfigRepo.save(configs);
    console.log(`Seeded ${configs.length} system config records.`);
  }

  private async seedUsers() {
    const count = await this.userRepo.count();
    if (count > 0) {
      console.log('Users already seeded, skipping.');
      return;
    }

    const defaultPassword = this.configService.get<string>('DEFAULT_USER_PASSWORD');
    if (!defaultPassword) {
      throw new Error('DEFAULT_USER_PASSWORD environment variable is required for seeding');
    }
    const password = await bcrypt.hash(defaultPassword, 12);
    const users = this.userRepo.create([
      { username: 'admin', password, realName: '系统管理员', roleCode: UserRole.ADMIN, isActive: true },
      { username: 'operator1', password, realName: '张三', roleCode: UserRole.OPERATOR, isActive: true },
      { username: 'operator2', password, realName: '李四', roleCode: UserRole.OPERATOR, isActive: true },
      { username: 'quality1', password, realName: '王五', roleCode: UserRole.QUALITY, isActive: true },
      { username: 'warehouse1', password, realName: '赵六', roleCode: UserRole.WAREHOUSE, isActive: true },
    ]);
    await this.userRepo.save(users);
    console.log(`Seeded ${users.length} users.`);
  }

  private async seedDepartments() {
    const count = await this.departmentRepo.count();
    if (count > 0) {
      console.log('Departments already seeded, skipping.');
      return;
    }

    const departments = this.departmentRepo.create([
      { name: '生产部', code: 'PROD' },
      { name: '品质部', code: 'QA' },
      { name: '仓储部', code: 'WH' },
      { name: '管理部', code: 'ADMIN' },
    ]);
    await this.departmentRepo.save(departments);
    console.log(`Seeded ${departments.length} departments.`);
  }

  private async seedEquipment() {
    const count = await this.equipmentRepo.count();
    if (count > 0) {
      console.log('Equipment already seeded, skipping.');
      return;
    }

    const equipment = this.equipmentRepo.create([
      { equipmentCode: 'E001', equipmentName: '配料机-01', departmentCode: 'PROD' },
      { equipmentCode: 'E002', equipmentName: '涂布机-01', departmentCode: 'PROD' },
      { equipmentCode: 'E003', equipmentName: '辊压机-01', departmentCode: 'PROD' },
      { equipmentCode: 'E004', equipmentName: '分切机-01', departmentCode: 'PROD' },
    ]);
    await this.equipmentRepo.save(equipment);
    console.log(`Seeded ${equipment.length} equipment records.`);
  }

  private async seedProcessDictionary() {
    const count = await this.processDictRepo.count();
    if (count > 0) {
      console.log('Process Dictionary already seeded, skipping.');
      return;
    }

    const processes = this.processDictRepo.create([
      { processCode: 'batching', processName: '配料', sortOrder: 10, isActive: true },
      { processCode: 'coating', processName: '涂布', sortOrder: 20, isActive: true },
      { processCode: 'roller-pressing', processName: '辊压', sortOrder: 30, isActive: true },
      { processCode: 'slitting', processName: '分切', sortOrder: 40, isActive: true },
      { processCode: 'electrode', processName: '制片', sortOrder: 50, isActive: true },
      { processCode: 'winding', processName: '卷绕', sortOrder: 60, isActive: true },
      { processCode: 'assembly', processName: '装配', sortOrder: 70, isActive: true },
      { processCode: 'baking', processName: '烘烤', sortOrder: 80, isActive: true },
      { processCode: 'injection', processName: '注液', sortOrder: 90, isActive: true },
      { processCode: 'wrapping', processName: '顶封', sortOrder: 100, isActive: true },
      { processCode: 'formation', processName: '化成', sortOrder: 110, isActive: true },
      { processCode: 'grading', processName: '分容', sortOrder: 120, isActive: true },
      { processCode: 'sorting', processName: '分选', sortOrder: 130, isActive: true },
    ]);
    await this.processDictRepo.save(processes);
    console.log(`Seeded ${processes.length} process dictionary records.`);
  }
}
