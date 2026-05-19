import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async findAll(): Promise<Department[]> {
    return this.departmentRepo.find({
      order: { code: 'ASC' },
    });
  }

  async create(dto: { name: string; code: string }): Promise<Department> {
    const department = this.departmentRepo.create(dto);
    return this.departmentRepo.save(department);
  }

  async update(id: number, dto: { name?: string; code?: string; isActive?: boolean }): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new Error('部门不存在');
    }
    Object.assign(department, dto);
    return this.departmentRepo.save(department);
  }

  async remove(id: number): Promise<void> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new Error('部门不存在');
    }
    await this.departmentRepo.remove(department);
  }
}
