import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { of, firstValueFrom } from 'rxjs';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: { getStreamData: jest.fn().mockReturnValue(of({ data: { test: 1 } })) }
        }
      ],
    }).compile();
    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should return sse stream', async () => {
    const stream$ = controller.stream();
    const event = await firstValueFrom(stream$);
    expect(event.data).toEqual({ test: 1 });
  });
});