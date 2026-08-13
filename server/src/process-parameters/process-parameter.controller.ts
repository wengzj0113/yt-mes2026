import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { SaveProcessParameterDto } from './dto/save-process-parameter.dto';
import { ProcessParameterService } from './process-parameter.service';

@Controller('processes')
export class ProcessParameterController {
  constructor(private readonly service: ProcessParameterService) {}

  @Get(':processCode/:batchNo')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.WAREHOUSE, UserRole.ADMIN)
  async findByBatchNo(@Param('processCode') processCode: string, @Param('batchNo') batchNo: string) {
    return { data: await this.service.findByBatchNo(processCode, batchNo) };
  }

  @Post(':processCode/draft')
  @Roles(UserRole.OPERATOR, UserRole.QUALITY, UserRole.ADMIN)
  async saveDraft(
    @Param('processCode') processCode: string,
    @Body() dto: SaveProcessParameterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return { data: await this.service.saveDraft(processCode, dto, user.sub), message: '参数保存成功' };
  }
}
