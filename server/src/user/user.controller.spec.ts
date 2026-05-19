import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<Partial<UserService>>;

  beforeEach(async () => {
    userService = {
      findAll: jest.fn(),
      findOperators: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should return all users', async () => {
    const users = [{ id: 1, username: 'admin', realName: '系统管理员', roleCode: 4, isActive: true }];
    (userService.findAll as jest.Mock).mockResolvedValue(users);
    const result = await controller.findAll();
    expect(result.data).toEqual(users);
    expect(result.data[0]).not.toHaveProperty('password');
  });

  it('should return operators list', async () => {
    const operators = [{ id: 1, realName: '张三' }];
    (userService.findOperators as jest.Mock).mockResolvedValue(operators);
    const result = await controller.findOperators();
    expect(result.data).toEqual(operators);
  });
});
