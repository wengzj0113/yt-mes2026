import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ValidationField {
  field: string;
  message: string;
  value?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code: string | undefined;
    let fields: ValidationField[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const body = res as Record<string, unknown>;
        message = (body.message as string) || exception.message;

        // class-validator error format
        if (Array.isArray(body.message)) {
          fields = (body.message as Array<{ property?: string; constraints?: Record<string, string>; value?: unknown }>).map(
            (err) => {
              const field = err.property || 'unknown';
              const errMessages = err.constraints
                ? Object.values(err.constraints)
                : ['invalid value'];
              return {
                field,
                message: errMessages[0],
                value: err.value,
              };
            },
          );
          message = '请求参数校验失败';
          code = 'VALIDATION_ERROR';
        }

        if (body.code) code = body.code as string;
      }
    } else if (exception instanceof Error) {
      console.error('Unhandled error:', exception);
      message =
        process.env.NODE_ENV === 'development'
          ? exception.message
          : '服务器内部错误';
    }

    response.status(status).json({
      success: false,
      data: null,
      message,
      ...(code ? { error: { code } } : {}),
      ...(fields ? { error: { code, fields } } : {}),
    });
  }
}
