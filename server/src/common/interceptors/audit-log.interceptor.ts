import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { SystemService } from '../../system/system.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly systemService: SystemService) {}

  private moduleMap: Record<string, string> = {
    '/api/users': '用户管理',
    '/api/roles': '角色管理',
    '/api/departments': '部门管理',
    '/api/equipment': '设备管理',
    '/api/batches': '批次管理',
    '/api/processes': '工序管理',
    '/api/system': '系统配置',
    '/api/master-data': '工序主数据',
    '/api/process-dictionary': '工序主数据',
    '/api/packs': 'Pack管理',
  };

  private actionMap: Record<string, string> = {
    POST: '新增',
    PUT: '修改',
    PATCH: '修改',
    DELETE: '删除',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;

    // Only log write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip auth and log queries
    if (url.includes('/api/auth') || url.includes('/api/system/logs')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const user = (request as any).user;
        if (!user) return;

        const module = this.getModule(url);
        const action = this.actionMap[method] || method;
        
        // Detailed description
        let detail = `${action}了资源: ${url}`;
        if (request.body && Object.keys(request.body).length > 0) {
          // Remove sensitive fields
          const body = { ...request.body };
          delete body.password;
          detail += `，参数: ${JSON.stringify(body).substring(0, 500)}`;
        }

        try {
          await this.systemService.logAction({
            userId: user.sub || user.id,
            username: user.username,
            module,
            action,
            detail,
            ip,
          });
        } catch (error) {
          console.error('Failed to record audit log:', error);
        }
      }),
    );
  }

  private getModule(url: string): string {
    for (const prefix in this.moduleMap) {
      if (url.startsWith(prefix)) {
        return this.moduleMap[prefix];
      }
    }
    return '其他模块';
  }
}
