import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async findAll() {
    const items = await this.equipmentService.findAll();
    return { data: items };
  }

  @Post()
  async create(@Body() dto: CreateEquipmentDto) {
    const equipment = await this.equipmentService.create(dto);
    return { data: equipment, message: '设备添加成功' };
  }

  @Post(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateEquipmentDto) {
    const equipment = await this.equipmentService.update(id, dto);
    return { data: equipment, message: '设备更新成功' };
  }

  @Post(':id/delete')
  async remove(@Param('id') id: number) {
    await this.equipmentService.remove(id);
    return { message: '设备删除成功' };
  }
}
