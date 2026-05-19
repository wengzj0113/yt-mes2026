import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { BakingService } from './baking.service';
import { CreateBakingDraftDto } from './dto/create-draft.dto';
import { SubmitBakingQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/baking')
export class BakingController {
  constructor(private readonly bakingService: BakingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateBakingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.bakingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitBakingQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.bakingService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.bakingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.bakingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
