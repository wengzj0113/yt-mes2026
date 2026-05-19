import { HttpExceptionFilter } from './http-exception.filter';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
  });

  function mockHost(exception: unknown) {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as any;
  }

  it('should format HttpException with string message', () => {
    const exception = new HttpException('自定义错误', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost(exception));

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: '自定义错误',
    });
  });

  it('should format class-validator errors with fields array', () => {
    const exception = new BadRequestException([
      {
        property: 'username',
        constraints: { isString: 'username must be a string' },
        value: 123,
      },
    ]);
    filter.catch(exception, mockHost(exception));

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: '请求参数校验失败',
      error: {
        code: 'VALIDATION_ERROR',
        fields: [
          { field: 'username', message: 'username must be a string', value: 123 },
        ],
      },
    });
  });

  it('should handle unknown errors gracefully', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    filter.catch(new Error('内部错误'), mockHost(new Error('test')));

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      data: null,
      message: '服务器内部错误',
    });
    process.env.NODE_ENV = env;
  });
});
