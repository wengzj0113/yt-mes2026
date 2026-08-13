import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { InjectionService } from './injection.service';
import { CreateInjectionDraftDto } from './dto/create-draft.dto';
import { SubmitInjectionQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@Controller('processes/injection')
export class InjectionController {
  constructor(private readonly injectionService: InjectionService) {}

  @Post('draft')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async createDraft(@Body() dto: CreateInjectionDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.injectionService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async submitQuality(@Body() dto: SubmitInjectionQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.injectionService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.injectionService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  @Roles(UserRole.QUALITY, UserRole.ADMIN)
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.injectionService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
