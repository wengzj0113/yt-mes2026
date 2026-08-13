import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QualityCheck } from '../../quality/quality-check.entity';
import { ProcessParameter } from '../../process-parameters/process-parameter.entity';
import { resolveProcessStatus, ResolvedProcessStatus } from './process-status.resolver';
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

export type ProcessStatusType = ResolvedProcessStatus;
export interface ProcessStatusItem { processKey: string; processName: string; route: string; status: ProcessStatusType; isDraft: boolean | null; recordStatus: number | null; updatedAt: string | null; }
interface ProcessDef { key: string; name: string; route: string; service?: { findByBatchNo(batchNo: string): Promise<any> }; }

@Injectable()
export class ProcessStatusService {
  private readonly processes: ProcessDef[] = [
    ['batching', '配料'], ['coating', '涂布'], ['roller-pressing', '辊压'], ['slitting', '分切'], ['electrode', '制片'], ['winding', '卷绕'], ['assembly', '装配'], ['casing', '入壳'], ['integrated-machine', '一体机'], ['laser-welding', '激光焊接'], ['baking', '烘烤'], ['injection', '注液'], ['wrapping', '封口'], ['ocv1', 'OCV1测试'], ['ocv2', 'OCV2测试'], ['sorting', '分选'],
  ].map(([key, name]) => ({ key, name, route: key }));

  constructor(private readonly dataSource: DataSource, @InjectRepository(QualityCheck) private readonly qualityCheckRepo: Repository<QualityCheck>, @InjectRepository(ProcessParameter) private readonly processParameterRepo: Repository<ProcessParameter>, private readonly batchingService: BatchingService, private readonly coatingService: CoatingService, private readonly rollerPressingService: RollerPressingService, private readonly slittingService: SlittingService, private readonly sortingService: SortingService, private readonly electrodeService: ElectrodeService, private readonly windingService: WindingService, private readonly assemblyService: AssemblyService, private readonly bakingService: BakingService, private readonly injectionService: InjectionService, private readonly wrappingService: WrappingService, private readonly formationService: FormationService, private readonly gradingService: GradingService) {
    const services = new Map<string, any>([['batching', batchingService], ['coating', coatingService], ['roller-pressing', rollerPressingService], ['slitting', slittingService], ['sorting', sortingService], ['electrode', electrodeService], ['winding', windingService], ['assembly', assemblyService], ['baking', bakingService], ['injection', injectionService], ['wrapping', wrappingService], ['formation', formationService], ['grading', gradingService]]);
    this.processes.forEach((process) => process.service = services.get(process.key));
  }

  async getProcessStatuses(batchNo: string): Promise<ProcessStatusItem[]> {
    const results: any[] = [];
    for (const proc of this.processes) {
      const dynamic = ['casing', 'integrated-machine', 'laser-welding'].includes(proc.key);
      if (proc.service) {
        const record = await proc.service.findByBatchNo(batchNo).catch(() => null);
        if (record) results.push({ processKey: proc.key, isDraft: record.isDraft, recordStatus: record.recordStatus, updatedAt: record.updatedAt });
        continue;
      }
      const table = dynamic ? 'process_dynamic_record' : `${proc.key.replace(/-/g, '_')}_record`;
      const filter = dynamic ? ` AND process_code = '${proc.key}'` : '';
      try {
        const rows = await this.dataSource.query(`SELECT TOP 1 '${proc.key}' AS processKey, is_draft AS isDraft, record_status AS recordStatus, updated_at AS updatedAt FROM ${table} WITH (NOLOCK) WHERE batch_no = @0${filter} ORDER BY id DESC`, [batchNo]);
        if (rows.length) results.push(rows[0]);
      } catch { /* missing process table means no record */ }
    }
    let parameterMap = new Map<string, ProcessParameter>();
    try { parameterMap = new Map((await this.processParameterRepo.find({ where: { batchNo } })).map((record) => [record.processCode, record])); } catch {}
    let qualityMap = new Map<string, { hasAny: boolean; hasFailed: boolean }>();
    try {
      const qualityRecords = await this.qualityCheckRepo.find({ where: { batchNo } });
      qualityMap = new Map(qualityRecords.map((record) => [record.processType, { hasAny: true, hasFailed: record.inspectionResult === 2 }]));
      for (const record of qualityRecords) if (record.inspectionResult === 2) qualityMap.get(record.processType)!.hasFailed = true;
    } catch {}
    const recordMap = new Map(results.map((record) => [record.processKey, record]));
    return this.processes.map((proc) => ({ processKey: proc.key, processName: proc.name, route: proc.route, ...resolveProcessStatus(recordMap.get(proc.key), parameterMap.get(proc.key) ?? null, qualityMap.get(proc.key) ?? null) }));
  }

  async getProcessRecords(batchNo: string): Promise<Record<string, any>> {
    const records: Record<string, any> = {};
    for (const proc of this.processes) {
      const dynamic = ['casing', 'integrated-machine', 'laser-welding'].includes(proc.key);
      if (proc.service) { records[proc.key] = await proc.service.findByBatchNo(batchNo).catch(() => null); continue; }
      const table = dynamic ? 'process_dynamic_record' : `${proc.key.replace(/-/g, '_')}_record`;
      const filter = dynamic ? ` AND process_code = '${proc.key}'` : '';
      try {
        const rows = await this.dataSource.query(`SELECT TOP 1 * FROM ${table} WHERE batch_no = @0${filter} ORDER BY id DESC`, [batchNo]);
        const row = rows[0];
        if (!row) { records[proc.key] = null; continue; }
        if (row.extra_data) Object.assign(row, JSON.parse(row.extra_data));
        delete row.extra_data;
        records[proc.key] = this.convertToCamelCase(row);
      } catch { records[proc.key] = null; }
    }
    return records;
  }

  private convertToCamelCase(obj: any): any { if (Array.isArray(obj)) return obj.map((value) => this.convertToCamelCase(value)); if (obj && obj.constructor === Object) return Object.keys(obj).reduce((result, key) => { result[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = this.convertToCamelCase(obj[key]); return result; }, {} as any); return obj; }
}
