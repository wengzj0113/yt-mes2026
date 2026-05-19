import { Controller, Get, Param } from '@nestjs/common';
import { ProcessStatusService } from './process-status.service';

@Controller('processes')
export class ProcessStatusController {
  constructor(private readonly processStatusService: ProcessStatusService) {}

  @Get('status/:batchNo')
  async getStatus(@Param('batchNo') batchNo: string) {
    const data = await this.processStatusService.getProcessStatuses(batchNo);
    return { data };
  }

  @Get('records/:batchNo')
  async getRecords(@Param('batchNo') batchNo: string) {
    const data = await this.processStatusService.getProcessRecords(batchNo);
    return { data };
  }
}
