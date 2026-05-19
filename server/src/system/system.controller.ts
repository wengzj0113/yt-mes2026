import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('logs')
  async getLogs(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('module') module?: string,
  ) {
    return this.systemService.getLogs({ page, pageSize, module });
  }

  @Get('configs')
  async getConfigs() {
    const configs = await this.systemService.getConfigs();
    return { data: configs };
  }

  @Post('configs/:id')
  async updateConfig(@Param('id') id: number, @Body('value') value: string) {
    const config = await this.systemService.updateConfig(id, value);
    return { data: config, message: '更新成功' };
  }

  @Get('roles')
  async getRoles() {
    const roles = [
      { code: 1, name: '操作员' },
      { code: 2, name: '质检员' },
      { code: 3, name: '库管员' },
      { code: 4, name: '系统管理员' },
    ];
    return { data: roles };
  }
}
