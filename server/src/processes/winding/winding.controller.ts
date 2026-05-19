import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { WindingService } from './winding.service';
import { CreateWindingDraftDto } from './dto/create-draft.dto';
import { SubmitWindingQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/winding')
export class WindingController {
  constructor(private readonly windingService: WindingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateWindingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.windingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitWindingQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.windingService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.windingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.windingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
