import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { GradingService } from './grading.service';
import { CreateGradingDraftDto } from './dto/create-draft.dto';
import { SubmitGradingQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateGradingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.gradingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitGradingQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.gradingService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.gradingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.gradingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
