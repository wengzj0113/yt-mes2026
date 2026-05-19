const mockApp = {
  setGlobalPrefix: jest.fn(),
  enableCors: jest.fn(),
  useGlobalPipes: jest.fn(),
  useGlobalFilters: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  getHttpAdapter: jest.fn(() => ({ adapter: true })),
  get: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
};

describe('bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses Reflector when registering ClassSerializerInterceptor', async () => {
    jest.doMock('./app.module', () => ({
      AppModule: class AppModule {},
    }));

    jest.doMock('@nestjs/core', () => {
      const actual = jest.requireActual('@nestjs/core');
      mockApp.get.mockImplementation((token: unknown) => {
        if (token === actual.Reflector) {
          return { getAllAndOverride: jest.fn() };
        }
        return undefined;
      });
      return {
        ...actual,
        NestFactory: {
          create: jest.fn().mockResolvedValue(mockApp),
        },
      };
    });

    const { Reflector } = await import('@nestjs/core');
    await import('./main');

    expect(mockApp.get).toHaveBeenCalledWith(Reflector);
  });
});
