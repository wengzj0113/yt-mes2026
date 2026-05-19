import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { WrappingService } from './wrapping.service';
import { CreateWrappingDraftDto } from './dto/create-draft.dto';
import { SubmitWrappingQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/wrapping')
export class WrappingController {
  constructor(private readonly wrappingService: WrappingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateWrappingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.wrappingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitWrappingQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.wrappingService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.wrappingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.wrappingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
