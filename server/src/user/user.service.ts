import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOperators(): Promise<Pick<User, 'id' | 'realName'>[]> {
    const users = await this.userRepo.find({
      where: { roleCode: 1, isActive: true },
      select: ['id', 'realName'],
    });
    return users;
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: any): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const userEntity = this.userRepo.create({
      ...(dto as Partial<User>),
      password: hashedPassword,
    });
    return this.userRepo.save(userEntity);
  }

  async update(id: number, dto: any): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.username === 'admin') {
      throw new BadRequestException('不能删除超级管理员账号');
    }
    await this.userRepo.remove(user);
  }

  async resetPassword(id: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const defaultPassword = this.configService.get<string>('DEFAULT_USER_PASSWORD', 'admin123');
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(defaultPassword, salt);
    await this.userRepo.save(user);
  }
}
