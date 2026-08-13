import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async findAll() {
    const departments = await this.departmentService.findAll();
    return { data: departments };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateDepartmentDto) {
    const department = await this.departmentService.create(dto);
    return { data: department, message: '创建成功' };
  }

  @Post(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() dto: UpdateDepartmentDto) {
    const department = await this.departmentService.update(id, dto);
    return { data: department, message: '更新成功' };
  }

  @Post(':id/delete')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    await this.departmentService.remove(id);
    return { message: '删除成功' };
  }
}
