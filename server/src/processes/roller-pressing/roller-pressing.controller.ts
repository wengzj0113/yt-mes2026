import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { RollerPressingService } from './roller-pressing.service';
import { CreateRollerPressingDraftDto } from './dto/create-draft.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/roller-pressing')
export class RollerPressingController {
  constructor(private readonly rollerPressingService: RollerPressingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateRollerPressingDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.rollerPressingService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.rollerPressingService.submitQuality(batchNo, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.rollerPressingService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.rollerPressingService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
