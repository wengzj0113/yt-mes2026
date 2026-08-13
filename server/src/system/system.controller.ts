import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../user/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@UseGuards(RolesGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN)
  async getLogs(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('module') module?: string,
  ) {
    return this.systemService.getLogs({ page, pageSize, module });
  }

  @Get('sorter-logs')
  @Roles(UserRole.ADMIN)
  async getSorterLogs(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('isSuccess') isSuccess?: string,
    @Query('apiEndpoint') apiEndpoint?: string,
    @Query('apiType') apiType?: string,
  ) {
    return this.systemService.getSorterLogs({
      page,
      pageSize,
      isSuccess: isSuccess === 'true' ? true : isSuccess === 'false' ? false : undefined,
      apiEndpoint,
      apiType,
    });
  }

  @Get('configs')
  @Roles(UserRole.ADMIN)
  async getConfigs() {
    const configs = await this.systemService.getConfigs();
    return { data: configs };
  }

  @Post('configs/:id')
  @Roles(UserRole.ADMIN)
  async updateConfig(@Param('id') id: number, @Body('value') value: string) {
    const config = await this.systemService.updateConfig(id, value);
    return { data: config, message: '更新成功' };
  }

  @Get('roles')
  async getRoles() {
    const roles = await this.systemService.listRoles();
    return { data: roles };
  }

  @Post('roles')
  @Roles(UserRole.ADMIN)
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.systemService.createRole(dto);
    return { data: role, message: '角色创建成功' };
  }

  @Post('roles/:code')
  @Roles(UserRole.ADMIN)
  async updateRole(@Param('code') code: string, @Body() dto: UpdateRoleDto) {
    const role = await this.systemService.updateRole(Number(code), dto);
    return { data: role, message: '角色更新成功' };
  }

  @Post('roles/:code/delete')
  @Roles(UserRole.ADMIN)
  async deleteRole(@Param('code') code: string) {
    await this.systemService.deleteRole(Number(code));
    return { message: '角色已删除' };
  }
}
