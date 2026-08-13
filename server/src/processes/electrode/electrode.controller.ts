import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ElectrodeService } from './electrode.service';
import { CreateElectrodeDraftDto } from './dto/create-draft.dto';
import { SubmitElectrodeQualityDto } from './dto/submit-quality.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@Controller('processes/electrode')
export class ElectrodeController {
  constructor(private readonly electrodeService: ElectrodeService) {}

  @Post('draft')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async createDraft(@Body() dto: CreateElectrodeDraftDto, @CurrentUser() user: JwtPayload) {
    const record = await this.electrodeService.createDraft(dto, user.sub);
    return { data: record, message: '草稿保存成功' };
  }

  @Post('submit')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async submitQuality(@Body() dto: SubmitElectrodeQualityDto, @CurrentUser() user: JwtPayload) {
    const record = await this.electrodeService.submitQuality(dto, user.sub);
    return { data: record, message: '提交成功' };
  }

  @Get(':batchNo')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async findByBatchNo(@Param('batchNo') batchNo: string) {
    const record = await this.electrodeService.findByBatchNo(batchNo);
    return { data: record };
  }

  @Patch(':batchNo/void')
  @Roles(UserRole.QUALITY, UserRole.ADMIN)
  async voidRecord(@Param('batchNo') batchNo: string, @CurrentUser() user: JwtPayload) {
    const record = await this.electrodeService.voidRecord(batchNo, user.sub);
    return { data: record, message: '已作废' };
  }
}
