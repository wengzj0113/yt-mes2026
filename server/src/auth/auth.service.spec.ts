import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<Partial<UserService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockUser = {
    id: 1,
    username: 'operator1',
    password: bcrypt.hashSync('123456', 12),
    realName: '张三',
    roleCode: 1,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test_jwt_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Hack to mock userRepo for login attempt tracking
    (service as any)['userService']['userRepo'] = {
      save: jest.fn(),
    };
  });

  describe('login', () => {
    it('should succeed with valid credentials', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('access_token');

      const result = await service.login({ username: 'operator1', password: '123456' });
      expect(result.data.accessToken).toBe('access_token');
      expect(result.data.user.username).toBe('operator1');
    });

    it('should fail when user does not exist', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue(null);
      await expect(
        service.login({ username: 'nobody', password: '123456' }),
      ).rejects.toThrow('用户不存在');
    });

    it('should fail when user is disabled', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });
      await expect(
        service.login({ username: 'operator1', password: '123456' }),
      ).rejects.toThrow('账号已被禁用');
    });

    it('should fail when account is locked', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 3600000),
      });
      await expect(
        service.login({ username: 'operator1', password: '123456' }),
      ).rejects.toThrow('账号已被锁定');
    });

    it('should fail with wrong password', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.login({ username: 'operator1', password: 'wrong_password' }),
      ).rejects.toThrow('密码错误');
    });

    it('should fall back to JWT_SECRET when JWT_REFRESH_SECRET is missing', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test_jwt_secret';
        if (key === 'JWT_REFRESH_SECRET') return undefined;
        return undefined;
      });
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const result = await service.login({ username: 'operator1', password: '123456' });

      expect(result.data.refreshToken).toBe('refresh_token');
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 1, username: 'operator1', roleCode: 1 },
        expect.objectContaining({ secret: 'test_jwt_secret' }),
      );
    });

    it('should allow login when stored password is legacy plain text', async () => {
      (userService.findByUsername as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'admin123',
        username: 'admin',
      });
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const result = await service.login({ username: 'admin', password: 'admin123' });

      expect(result.data.user.username).toBe('admin');
      expect(result.data.accessToken).toBe('access_token');
    });
  });

  describe('refresh', () => {
    it('should issue new access token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1, username: 'operator1', roleCode: 1 });
      (userService.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('new_access_token');

      const result = await service.refresh('valid_refresh_token');
      expect(result.data.accessToken).toBe('new_access_token');
    });

    it('should fail with invalid refresh token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error(); });
      await expect(service.refresh('bad_token')).rejects.toThrow('Refresh Token 已过期');
    });
  });
});
