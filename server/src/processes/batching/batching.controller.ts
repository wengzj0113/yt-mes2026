import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { BatchingService } from './batching.service';
import { CreateBatchingDraftDto } from './dto/create-draft.dto';
import { SubmitBatchingQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/batching')
export class BatchingController {
  constructor(private readonly batchingService: BatchingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateBatchingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.batchingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitBatchingQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.batchingService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.batchingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.batchingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
