import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BatchingService } from '../batching/batching.service';
import { CoatingService } from '../coating/coating.service';
import { RollerPressingService } from '../roller-pressing/roller-pressing.service';
import { SlittingService } from '../slitting/slitting.service';
import { SortingService } from '../sorting/sorting.service';
import { ElectrodeService } from '../electrode/electrode.service';
import { WindingService } from '../winding/winding.service';
import { AssemblyService } from '../assembly/assembly.service';
import { BakingService } from '../baking/baking.service';
import { InjectionService } from '../injection/injection.service';
import { WrappingService } from '../wrapping/wrapping.service';
import { FormationService } from '../formation/formation.service';
import { GradingService } from '../grading/grading.service';

export interface ProcessStatusItem {
  processKey: string;
  processName: string;
  route: string;
  status: 'not_entered' | 'draft' | 'submitted' | 'voided';
  isDraft: boolean | null;
  recordStatus: number | null;
  updatedAt: string | null;
}

interface ProcessDef {
  key: string;
  name: string;
  route: string;
  service: {
    findByBatchNo(batchNo: string): Promise<any>;
  };
}

@Injectable()
export class ProcessStatusService {
  private readonly processes: ProcessDef[];

  constructor(
    private readonly dataSource: DataSource,
    private readonly batchingService: BatchingService,
    private readonly coatingService: CoatingService,
    private readonly rollerPressingService: RollerPressingService,
    private readonly slittingService: SlittingService,
    private readonly sortingService: SortingService,
    private readonly electrodeService: ElectrodeService,
    private readonly windingService: WindingService,
    private readonly assemblyService: AssemblyService,
    private readonly bakingService: BakingService,
    private readonly injectionService: InjectionService,
    private readonly wrappingService: WrappingService,
    private readonly formationService: FormationService,
    private readonly gradingService: GradingService,
  ) {
    this.processes = [
      { key: 'batching', name: '配料', route: 'batching', service: this.batchingService },
      { key: 'coating', name: '涂布', route: 'coating', service: this.coatingService },
      { key: 'roller-pressing', name: '辊压', route: 'roller-pressing', service: this.rollerPressingService },
      { key: 'slitting', name: '分切', route: 'slitting', service: this.slittingService },
      { key: 'electrode', name: '制片', route: 'electrode', service: this.electrodeService },
      { key: 'winding', name: '卷绕', route: 'winding', service: this.windingService },
      { key: 'assembly', name: '装配', route: 'assembly', service: this.assemblyService },
      { key: 'baking', name: '烘烤', route: 'baking', service: this.bakingService },
      { key: 'injection', name: '注液', route: 'injection', service: this.injectionService },
      { key: 'wrapping', name: '顶封', route: 'wrapping', service: this.wrappingService },
      { key: 'formation', name: '化成', route: 'formation', service: this.formationService },
      { key: 'grading', name: '分容', route: 'grading', service: this.gradingService },
      { key: 'sorting', name: '分选', route: 'sorting', service: this.sortingService },
    ];
  }

  async getProcessStatuses(batchNo: string): Promise<ProcessStatusItem[]> {
    const unionQueries = this.processes.map(proc => {
      const tableName = `${proc.key.replace(/-/g, '_')}_record`;
      return `SELECT '${proc.key}' as processKey, is_draft as isDraft, record_status as recordStatus, updated_at as updatedAt FROM ${tableName} WHERE batch_no = @0`;
    });

    const fullQuery = unionQueries.join('\nUNION ALL\n');
    const dbResults: any[] = await this.dataSource.query(fullQuery, [batchNo]);
    const recordMap = new Map(dbResults.map(r => [r.processKey, r]));

    return this.processes.map(proc => {
      const record = recordMap.get(proc.key);
      let status: ProcessStatusItem['status'] = 'not_entered';
      let isDraft: boolean | null = null;
      let recordStatus: number | null = null;
      let updatedAt: string | null = null;

      if (record) {
        isDraft = record.isDraft;
        recordStatus = record.recordStatus;
        updatedAt = record.updatedAt ? new Date(record.updatedAt).toISOString() : null;

        if (recordStatus === 2) {
          status = 'voided';
        } else if (!isDraft) {
          status = 'submitted';
        } else {
          status = 'draft';
        }
      }

      return {
        processKey: proc.key,
        processName: proc.name,
        route: proc.route,
        status,
        isDraft,
        recordStatus,
        updatedAt,
      };
    });
  }

  async getProcessRecords(batchNo: string): Promise<Record<string, any>> {
    // 方案一：合并查询。利用 SQL Server 的 FOR JSON PATH 一次性获取所有记录，减少数据库往返次数
    const queries = this.processes.map(proc => {
      const tableName = `${proc.key.replace(/-/g, '_')}_record`;
      // 使用子查询和 FOR JSON PATH 将每一行数据转为 JSON 字符串
      return `SELECT '${proc.key}' as processKey, (SELECT * FROM ${tableName} WHERE batch_no = @0 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) as data`;
    });

    const fullQuery = queries.join('\nUNION ALL\n');
    const dbResults: any[] = await this.dataSource.query(fullQuery, [batchNo]);
    
    const records: Record<string, any> = {};
    for (const row of dbResults) {
      if (row.data) {
        const rawData = JSON.parse(row.data);
        records[row.processKey] = this.convertToCamelCase(rawData);
      } else {
        records[row.processKey] = null;
      }
    }
    
    return records;
  }

  /**
   * 将对象的所有键从 snake_case 转换为 camelCase
   */
  private convertToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(v => this.convertToCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.convertToCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }
}
