import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { AssemblyService } from './assembly.service';
import { CreateAssemblyDraftDto } from './dto/create-draft.dto';
import { SubmitAssemblyQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('processes/assembly')
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateAssemblyDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.assemblyService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  async submitQuality(@Body() dto: SubmitAssemblyQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.assemblyService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.assemblyService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.assemblyService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
