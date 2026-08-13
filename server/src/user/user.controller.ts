import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
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

  @Get('quality-personnel')
  async findQualityPersonnel() {
    const personnel = await this.userService.findByRole(UserRole.QUALITY);
    return { data: personnel };
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const user = await this.userService.register(dto);
    return { data: { id: user.id }, message: '注册成功，请联系管理员启用账号' };
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
  async remove(@Param('id') id: number, @Req() req: Request) {
    const currentUserId = (req.user as any)?.sub;
    await this.userService.remove(id, currentUserId);
    return { message: '用户删除成功' };
  }

  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetPassword(@Param('id') id: number, @Body('password') password?: string) {
    await this.userService.resetPassword(id, password);
    return { message: password ? '密码已重置' : '密码已重置为默认密码' };
  }
}
