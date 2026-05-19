import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { CoatingService } from './coating.service';
import { CreateCoatingDraftDto } from './dto/create-draft.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/coating')
export class CoatingController {
  constructor(private readonly coatingService: CoatingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateCoatingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.coatingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.coatingService.submitQuality(batchNo, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.coatingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.coatingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
