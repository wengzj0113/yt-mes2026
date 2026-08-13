import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QualityCheck } from '../../quality/quality-check.entity';
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
import { ProcessParameter } from '../../process-parameters/process-parameter.entity';
import { resolveProcessStatus, ResolvedProcessStatus } from './process-status.resolver';

export type ProcessStatusType = ResolvedProcessStatus;

export interface ProcessStatusItem {
  processKey: string;
  processName: string;
  route: string;
  status: ProcessStatusType;
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
  } | null;
}

@Injectable()
export class ProcessStatusService {
  private readonly processes: ProcessDef[];

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(QualityCheck)
    private readonly qualityCheckRepo: Repository<QualityCheck>,
    @InjectRepository(ProcessParameter)
    private readonly processParameterRepo: Repository<ProcessParameter>,
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
      { key: 'ocv1', name: 'OCV1测试', route: 'ocv1', service: null },
      { key: 'grading', name: '分容', route: 'grading', service: this.gradingService },
      { key: 'ocv2', name: 'OCV2测试', route: 'ocv2', service: null },
      { key: 'sorting', name: '分选', route: 'sorting', service: this.sortingService },
    ];
  }

  async getProcessStatuses(batchNo: string): Promise<ProcessStatusItem[]> {
    // 用 TRY/CATCH 容错：对每张工序表单独查询，避免不同表列结构不一致导致 UNION 失败
    const results: any[] = [];
    for (const proc of this.processes) {
      const tableName = `${proc.key.replace(/-/g, '_')}_record`;
      const innerSql = `
        SELECT TOP 1
          '${proc.key}' AS processKey,
          is_draft AS isDraft,
          record_status AS recordStatus,
          updated_at AS updatedAt
        FROM ${tableName} WITH (NOLOCK)
        WHERE batch_no = @0
        ORDER BY id DESC
      `;
      try {
        const rows: any[] = await this.dataSource.query(innerSql, [batchNo]);
        if (rows.length) results.push(rows[0]);
      } catch (e: any) {
        // 表不存在或列缺失：记录空结果，标记 null
        results.push({ processKey: proc.key, isDraft: null, recordStatus: null, updatedAt: null });
      }
    }
    const dbResults = results;
    const recordMap = new Map(dbResults.map(r => [r.processKey, r]));
    let parameterMap = new Map<string, ProcessParameter>();
    try {
      const parameterRecords = await this.processParameterRepo.find({ where: { batchNo } });
      parameterMap = new Map(parameterRecords.map(record => [record.processCode, record]));
    } catch (e) {
      parameterMap = new Map();
    }

    // 批量查询所有批次的质检记录
    let qualityMap = new Map<string, { hasAny: boolean; hasFailed: boolean }>();
    try {
      const qualityRecords = await this.qualityCheckRepo.find({ where: { batchNo } });
      qualityMap = new Map(
        qualityRecords.map(q => [
          q.processType,
          { hasAny: true, hasFailed: q.inspectionResult === 2 },
        ])
      );
      // 如果有同一工序多次质检，合并：任一不合格则整体不合格
      qualityRecords.forEach(q => {
        const existing = qualityMap.get(q.processType);
        if (existing && q.inspectionResult === 2) {
          existing.hasFailed = true;
        }
      });
    } catch (e) {
      // 如果 quality_check 表不存在或查询失败，忽略质检状态
    }

    return this.processes.map(proc => {
      const resolution = resolveProcessStatus(recordMap.get(proc.key), parameterMap.get(proc.key) ?? null, qualityMap.get(proc.key) ?? null);

      return {
        processKey: proc.key,
        processName: proc.name,
        route: proc.route,
        ...resolution,
      };
    });
  }

  async getProcessRecords(batchNo: string): Promise<Record<string, any>> {
    // 利用 SQL Server 的 FOR JSON PATH 一次性获取所有记录，减少数据库往返次数
    // 使用 TOP 1 + ORDER BY id DESC 只取最新记录，避免多行导致 WITHOUT_ARRAY_WRAPPER 生成非法 JSON
    const queries = this.processes.map(proc => {
      const tableName = `${proc.key.replace(/-/g, '_')}_record`;
      return `SELECT '${proc.key}' as processKey, (SELECT TOP 1 * FROM ${tableName} WHERE batch_no = @0 ORDER BY id DESC FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) as data`;
    });

    const fullQuery = queries.join('\nUNION ALL\n');
    const dbResults: any[] = await this.dataSource.query(fullQuery, [batchNo]);

    const records: Record<string, any> = {};
    for (const row of dbResults) {
      if (row.data) {
        try {
          const rawData = JSON.parse(row.data);
          // FOR JSON PATH 可能返回数组，取第一条
          const record = Array.isArray(rawData) ? rawData[0] : rawData;
          records[row.processKey] = this.convertToCamelCase(record);
        } catch (e) {
          console.error(`Failed to parse process record for ${row.processKey}:`, e);
          records[row.processKey] = null;
        }
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
