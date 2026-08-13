import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
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
    return this.findByRole(UserRole.OPERATOR);
  }

  async findByRole(roleCode: number): Promise<Pick<User, 'id' | 'realName'>[]> {
    const users = await this.userRepo.find({
      where: { roleCode, isActive: true },
      select: ['id', 'realName'],
    });
    return users;
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      select: ['id', 'username', 'realName', 'roleCode', 'phone', 'isActive', 'createdAt'],
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
    // Explicit field assignment to prevent mass-assignment
    if (dto.realName !== undefined) user.realName = dto.realName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    // roleCode: Service-level whitelist - only ADMIN can change roles
    if (dto.roleCode !== undefined && dto.roleCode >= 1 && dto.roleCode <= 4) {
      user.roleCode = dto.roleCode;
    }
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(dto.password, salt);
    }
    return this.userRepo.save(user);
  }

  async remove(id: number, currentUserId?: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.roleCode === 4) {
      throw new BadRequestException('不能删除超级管理员账号');
    }
    if (currentUserId && user.id === currentUserId) {
      throw new BadRequestException('不能删除自己');
    }
    await this.userRepo.remove(user);
  }

  async resetPassword(id: number, password?: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const newPassword = password || this.configService.get<string>('DEFAULT_USER_PASSWORD', 'admin123');
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await this.userRepo.save(user);
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.userRepo.update(id, { password: hashedPassword });
  }

  async register(dto: any): Promise<User> {
    if (dto.roleCode === UserRole.ADMIN) {
      throw new BadRequestException('不允许注册为管理员账号');
    }

    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      username: dto.username,
      realName: dto.realName,
      password: hashedPassword,
      roleCode: dto.roleCode,
      phone: dto.phone || null,
      isActive: true, // 默认启用
    });

    return this.userRepo.save(user);
  }
}
