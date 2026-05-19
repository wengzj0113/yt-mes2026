import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    }
    if (!user.isActive) {
      throw new UnauthorizedException({ code: 'USER_DISABLED', message: '账号已被禁用' });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException({ code: 'USER_LOCKED', message: '账号已被锁定，请稍后再试' });
    }

    const isBcryptHash = typeof user.password === 'string' && /^\$2[aby]\$\d+\$/.test(user.password);
    const valid = isBcryptHash
      ? await bcrypt.compare(dto.password, user.password)
      : dto.password === user.password;
    if (!valid) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await this.userService['userRepo'].save(user);
      throw new UnauthorizedException({ code: 'USER_PASSWORD_ERROR', message: '密码错误' });
    }

    if (!isBcryptHash) {
      user.password = await bcrypt.hash(dto.password, 12);
      await this.userService['userRepo'].save(user);
    }

    // Reset on success
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockedUntil = null;
      await this.userService['userRepo'].save(user);
    }

    const payload = {
      sub: user.id,
      username: user.username,
      roleCode: user.roleCode,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '604800s',
    });

    return {
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          roleCode: user.roleCode,
        },
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });
      const user = await this.userService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Token 无效' });
      }
      const newPayload = { sub: user.id, username: user.username, roleCode: user.roleCode };
      const accessToken = this.jwtService.sign(newPayload);
      return { data: { accessToken } };
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Refresh Token 已过期' });
    }
  }

  private getRefreshSecret(): string {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT secret environment variable is required');
    }
    return secret;
  }
}
