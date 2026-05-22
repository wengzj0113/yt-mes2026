import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.userService.findAll();
    return { data: users };
  }

  @Get('operators')
  async findOperators() {
    const operators = await this.userService.findOperators();
    return { data: operators };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return { data: user, message: '用户创建成功' };
  }

  @Post(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    const user = await this.userService.update(id, dto);
    return { data: user, message: '用户更新成功' };
  }

  @Post(':id/delete')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    await this.userService.remove(id);
    return { message: '用户删除成功' };
  }

  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetPassword(@Param('id') id: number) {
    await this.userService.resetPassword(id);
    return { message: '密码已重置为默认密码' };
  }
}
