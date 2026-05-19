import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './equipment.entity';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  async findAll(): Promise<Equipment[]> {
    return this.equipmentRepo.find({
      order: { equipmentCode: 'ASC' },
    });
  }

  async create(dto: any): Promise<Equipment> {
    const existing = await this.equipmentRepo.findOne({ where: { equipmentCode: dto.equipmentCode } });
    if (existing) {
      throw new BadRequestException('设备编码已存在');
    }
    const equipment = this.equipmentRepo.create(dto as Partial<Equipment>);
    return this.equipmentRepo.save(equipment);
  }

  async update(id: number, dto: any): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }
    Object.assign(equipment, dto);
    return this.equipmentRepo.save(equipment);
  }

  async remove(id: number): Promise<void> {
    const equipment = await this.equipmentRepo.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('设备不存在');
    }
    await this.equipmentRepo.remove(equipment);
  }
}
