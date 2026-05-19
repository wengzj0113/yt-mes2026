import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('GET /api/health', () => {
    it('should return ok status', () => {
      const result = controller.check();
      expect(result.data.status).toBe('ok');
      expect(result.data.timestamp).toBeDefined();
      expect(result.data.uptime).toBeGreaterThan(0);
    });
  });
});
