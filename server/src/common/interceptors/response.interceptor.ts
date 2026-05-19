import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'success' in result) {
          return result as ApiResponse<T>;
        }
        const data = result?.data ?? result;
        const meta = result?.meta ?? undefined;
        return {
          success: true,
          data,
          message: 'ok',
          ...(meta ? { meta } : {}),
        };
      }),
    );
  }
}
