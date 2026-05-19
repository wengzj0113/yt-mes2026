import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { firstValueFrom, take } from 'rxjs';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  it('should stream dashboard data via SSE', async () => {
    const stream$ = service.getStreamData();
    const event = await firstValueFrom(stream$.pipe(take(1)));
    expect(event.data).toHaveProperty('topMetrics');
    expect(event.data).toHaveProperty('processes');
    expect(event.data).toHaveProperty('sorterLogs');
  });
});