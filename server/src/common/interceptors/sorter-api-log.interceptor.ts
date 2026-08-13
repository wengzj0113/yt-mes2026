import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { SystemService } from '../../system/system.service';
import { Reflector } from '@nestjs/core';
import { API_TYPE_KEY } from '../decorators/api-type.decorator';

export type ApiType = 'sorter' | 'ocv1' | 'ocv2';

@Injectable()
export class SorterApiLogInterceptor implements NestInterceptor {
  constructor(
    private readonly systemService: SystemService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, body } = request;
    const startTime = Date.now();
    const apiType: ApiType =
      this.reflector.get<ApiType>(API_TYPE_KEY, context.getHandler()) || 'sorter';

    return next.handle().pipe(
      tap(async (resBody) => {
        const duration = Date.now() - startTime;
        try {
          await this.systemService.logSorterApi({
            apiEndpoint: url,
            method,
            requestBody: JSON.stringify(body),
            responseBody: JSON.stringify(resBody),
            statusCode: response.statusCode || 201,
            isSuccess: true,
            ip,
            duration,
            apiType,
          });
        } catch (error) {
          console.error('Failed to save sorter API success log:', error);
        }
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        const statusCode = err.status || err.statusCode || 500;
        const errorMessage = err.message || JSON.stringify(err);
        const errorResponse = err.response || { message: err.message };

        this.systemService.logSorterApi({
          apiEndpoint: url,
          method,
          requestBody: JSON.stringify(body),
          responseBody: JSON.stringify(errorResponse),
          statusCode,
          isSuccess: false,
          errorMessage,
          ip,
          duration,
          apiType,
        }).catch((error) => {
          console.error('Failed to save sorter API error log:', error);
        });

        return throwError(() => err);
      }),
    );
  }
}
