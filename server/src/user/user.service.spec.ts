import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<Partial<Repository<User>>>;

  const mockUser: User = {
    id: 1,
    username: 'operator1',
    password: 'hashed_pwd',
    realName: '张三',
    roleCode: 1,
    phone: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should return a user when found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.findByUsername('operator1');
      expect(result).toEqual(mockUser);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { username: 'operator1' } });
    });

    it('should return null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findByUsername('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOperators', () => {
    it('should return active operators with selected fields', async () => {
      (repo.find as jest.Mock).mockResolvedValue([
        { id: 1, realName: '张三' },
        { id: 2, realName: '李四' },
      ]);
      const result = await service.findOperators();
      expect(result).toHaveLength(2);
      expect(repo.find).toHaveBeenCalledWith({
        where: { roleCode: 1, isActive: true },
        select: ['id', 'realName'],
      });
    });
  });

  describe('findAll', () => {
    it('should return only safe fields for user listing', async () => {
      (repo.find as jest.Mock).mockResolvedValue([
        { id: 1, username: 'admin', realName: '系统管理员', roleCode: 4, isActive: true },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        { id: 1, username: 'admin', realName: '系统管理员', roleCode: 4, isActive: true },
      ]);
      expect(repo.find).toHaveBeenCalledWith({
        select: ['id', 'username', 'realName', 'roleCode', 'isActive'],
      });
    });
  });
});
