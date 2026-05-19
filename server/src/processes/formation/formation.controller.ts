import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { FormationService } from './formation.service';
import { CreateFormationDraftDto } from './dto/create-draft.dto';
import { SubmitFormationQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/formation')
export class FormationController {
  constructor(private readonly formationService: FormationService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateFormationDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.formationService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitFormationQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.formationService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.formationService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.formationService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
