import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  it('should create a user with default values', () => {
    const user = new User();
    user.username = 'testuser';
    user.password = 'hashed_pwd';
    user.realName = '测试用户';

    expect(user.username).toBe('testuser');
    expect(user.realName).toBe('测试用户');
    expect(user.roleCode).toBe(UserRole.OPERATOR);
    expect(user.isActive).toBe(true);
    expect(user.loginAttempts).toBe(0);
  });

  it('should support different role codes', () => {
    const admin = new User();
    admin.roleCode = UserRole.ADMIN;
    expect(admin.roleCode).toBe(4);

    const quality = new User();
    quality.roleCode = UserRole.QUALITY;
    expect(quality.roleCode).toBe(2);
  });

  it('should track login attempts', () => {
    const user = new User();
    expect(user.loginAttempts).toBe(0);
    user.loginAttempts = 3;
    expect(user.loginAttempts).toBe(3);
  });

  it('should support account locking', () => {
    const user = new User();
    expect(user.lockedUntil).toBeNull();
    user.lockedUntil = new Date(Date.now() + 3600000);
    expect(user.lockedUntil).toBeInstanceOf(Date);
  });
});
