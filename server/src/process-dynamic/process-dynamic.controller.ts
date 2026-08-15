import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { ProcessDynamicService } from './process-dynamic.service';

@Controller('process-dynamic')
export class ProcessDynamicController {
  constructor(private readonly service: ProcessDynamicService) {}
  @Get(':processCode/:batchNo') @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async find(@Param('processCode') code: string, @Param('batchNo') batchNo: string) { return { data: await this.service.findByBatchNo(code, batchNo) }; }
  @Post(':processCode/draft') @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async save(@Param('processCode') code: string, @Body() body: { batchNo: string; [key: string]: unknown }, @CurrentUser() user: JwtPayload) {
    const { batchNo, ...data } = body;
    return { data: await this.service.saveDraft(code, batchNo, data, user.sub), message: '参数保存成功' };
  }
  @Post(':processCode/submit') @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async submit(@Param('processCode') code: string, @Body() body: { batchNo: string; [key: string]: unknown }, @CurrentUser() user: JwtPayload) {
    const { batchNo, ...data } = body;
    return { data: await this.service.submit(code, batchNo, data, user.sub), message: '工序参数提交成功' };
  }
}
