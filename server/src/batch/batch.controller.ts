import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { BatchQueryDto } from './dto/query-batch.dto';
import { GenerateBatchNoDto } from './dto/generate-batch-no.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get('generate-no')
  generateNo(@Query() query: GenerateBatchNoDto) {
    const batchNo = this.batchService.generateBatchNo(query.mnRatio);
    return { data: { batchNo } };
  }

  @Get('stats')
  async getDashboardStats() {
    const stats = await this.batchService.getDashboardStats();
    return { data: stats };
  }

  @Post()
  async create(@Body() dto: CreateBatchDto, @CurrentUser() user: JwtPayload) {
    const batch = await this.batchService.create(dto, user.sub);
    return { data: batch, message: '创建成功' };
  }

  @Get()
  async findAll(@Query() query: BatchQueryDto) {
    return this.batchService.findAll(query);
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const batch = await this.batchService.findByBatchNo(batchNo);
    return { data: batch };
  }

  @Get(':batchNo/status-logs')
  async findStatusLogs(@Param('batchNo') batchNo: string) {
    const logs = await this.batchService.findStatusLogs(batchNo);
    return { data: logs };
  }

  @Patch(':batchNo')
  async update(
    @Param('batchNo') batchNo: string,
    @Body() dto: UpdateBatchDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const batch = await this.batchService.update(batchNo, dto, user.sub);
    return { data: batch, message: '更新成功' };
  }

  @Delete(':batchNo')
  @Roles(UserRole.ADMIN)
  async remove(@Param('batchNo') batchNo: string) {
    await this.batchService.remove(batchNo);
    return { message: '删除成功' };
  }
}
