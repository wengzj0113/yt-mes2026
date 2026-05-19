import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/login', () => {
    it('should delegate to authService.login', async () => {
      const dto = { username: 'operator1', password: '123456' };
      const expected = { data: { accessToken: 'token' } };
      (authService.login as jest.Mock).mockResolvedValue(expected);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should delegate to authService.refresh', async () => {
      (authService.refresh as jest.Mock).mockResolvedValue({ data: { accessToken: 'new_token' } });
      const result = await controller.refresh('refresh_token');
      expect(authService.refresh).toHaveBeenCalledWith('refresh_token');
      expect(result.data.accessToken).toBe('new_token');
    });
  });
});
