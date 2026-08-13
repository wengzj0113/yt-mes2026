import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { QualityCheckService } from './quality-check.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { QueryQualityDto } from './dto/query-quality.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('quality')
export class QualityController {
  constructor(private readonly qualityCheckService: QualityCheckService) {}

  @Get('trends')
  async getQualityTrends() {
    const trends = await this.qualityCheckService.getQualityTrends();
    return { data: trends };
  }

  @Get()
  async findAllPaginated(@Query() filters: QueryQualityDto) {
    const result = await this.qualityCheckService.findAllPaginated(filters);
    return { data: result };
  }

  @Get('pending')
  async findPending(@Query('batchNo') batchNo?: string) {
    const items = await this.qualityCheckService.findPendingQuality(batchNo);
    return { data: items };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const record = await this.qualityCheckService.findOne(+id);
    return { data: record };
  }

  @Post('inspect')
  @Roles(UserRole.QUALITY, UserRole.ADMIN)
  async inspect(@Body() dto: CreateQualityCheckDto, @CurrentUser() user: JwtPayload) {
    const record = await this.qualityCheckService.inspect(dto, user.sub);
    return { data: record, message: '质检成功' };
  }

  @Patch(':id')
  @Roles(UserRole.QUALITY, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: Partial<CreateQualityCheckDto>, @CurrentUser() user: JwtPayload) {
    const record = await this.qualityCheckService.update(+id, dto, user.sub);
    return { data: record, message: '更新成功' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.qualityCheckService.remove(+id);
    return { message: '删除成功' };
  }
}
