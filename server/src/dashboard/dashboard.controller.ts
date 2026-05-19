import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.dashboardService.getStreamData() as Observable<MessageEvent>;
  }
}