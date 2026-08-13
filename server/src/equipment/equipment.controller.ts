import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async findAll() {
    const items = await this.equipmentService.findAll();
    return { data: items };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateEquipmentDto) {
    const equipment = await this.equipmentService.create(dto);
    return { data: equipment, message: '设备添加成功' };
  }

  @Post(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() dto: UpdateEquipmentDto) {
    const equipment = await this.equipmentService.update(id, dto);
    return { data: equipment, message: '设备更新成功' };
  }

  @Post(':id/delete')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    await this.equipmentService.remove(id);
    return { message: '设备删除成功' };
  }
}
