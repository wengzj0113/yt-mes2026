import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { QualityCheckService } from './quality-check.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('batches/:batchNo/quality-checks')
export class QualityCheckController {
  constructor(private readonly qualityCheckService: QualityCheckService) {}

  @Post()
  async create(@Param('batchNo') batchNo: string, @Body() dto: CreateQualityCheckDto, @CurrentUser() user: JwtPayload) {
    dto.batchNo = batchNo;
    const record = await this.qualityCheckService.create(dto, user.sub);
    return { data: record, message: '创建成功' };
  }

  @Get()
  async findAll(@Param('batchNo') batchNo: string) {
    const records = await this.qualityCheckService.findAll(batchNo);
    return { data: records };
  }
}
