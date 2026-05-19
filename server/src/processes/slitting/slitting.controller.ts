import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { SlittingService } from './slitting.service';
import { CreateSlittingDraftDto } from './dto/create-draft.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/slitting')
export class SlittingController {
  constructor(private readonly slittingService: SlittingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateSlittingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.slittingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.slittingService.submitQuality(batchNo, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.slittingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.slittingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
