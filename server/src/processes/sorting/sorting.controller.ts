import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { SortingService } from './sorting.service';
import { CreateSortingDraftDto } from './dto/create-draft.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/sorting')
export class SortingController {
  constructor(private readonly sortingService: SortingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateSortingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.sortingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.sortingService.submitQuality(batchNo, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.sortingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.sortingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
