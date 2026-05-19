import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
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
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return { data: user, message: '用户创建成功' };
  }

  @Post(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    const user = await this.userService.update(id, dto);
    return { data: user, message: '用户更新成功' };
  }

  @Post(':id/delete')
  async remove(@Param('id') id: number) {
    await this.userService.remove(id);
    return { message: '用户删除成功' };
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: number) {
    await this.userService.resetPassword(id);
    return { message: '密码已重置为默认密码' };
  }
}
