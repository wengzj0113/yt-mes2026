import { Controller, Get } from '@nestjs/common';
import { QualityCheckService } from './quality-check.service';

@Controller('quality')
export class QualityController {
  constructor(private readonly qualityCheckService: QualityCheckService) {}

  @Get('trends')
  async getQualityTrends() {
    const trends = await this.qualityCheckService.getQualityTrends();
    return { data: trends };
  }
}
