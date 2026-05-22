import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { ProcessDictionary } from './process-dictionary.entity';

@Injectable()
export class ProcessDictionaryService implements OnModuleInit {
  constructor(
    @InjectRepository(ProcessDictionary)
    private readonly processDictRepo: Repository<ProcessDictionary>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.initStandardFields();
  }

  private async initStandardFields() {
    const processes = await this.processDictRepo.find();
    if (processes.length === 0) return;

    const standardFields: Record<string, any[]> = {
      batching: [
        { group: '物料信息', key: 'positiveMaterial', label: '正极材料', type: 'text', required: true, isSystem: true },
        { group: '物料信息', key: 'negativeMaterial', label: '负极材料', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'viscosityRecord', label: '粘度记录', type: 'text', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      coating: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'coatingSpeed', label: '涂布速度', unit: 'm/min', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'coatingThicknessPos', label: '正极厚度', unit: 'μm', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'coatingThicknessNeg', label: '负极厚度', unit: 'μm', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'arealDensityPos', label: '正极面密度', unit: 'g/㎡', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'arealDensityNeg', label: '负极面密度', unit: 'g/㎡', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'coatingTemperature', label: '涂布温度', unit: '℃', type: 'number', required: true, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      'roller-pressing': [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'rollerPressure', label: '辊压压力', unit: 'T', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'rollerThickness', label: '辊压厚度', unit: 'μm', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'rollerSpeed', label: '辊压速度', unit: 'm/min', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      slitting: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'electrodeWidth', label: '极片宽度', unit: 'mm', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'electrodeLength', label: '极片长度', unit: 'mm', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'slittingSpeed', label: '分切速度', unit: 'm/min', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      electrode: [
        { group: '基础信息', key: 'tabMaterialSpec', label: '极耳材料规格', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'electrodeLength', label: '极片长度', unit: 'mm', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'tabWeldingPull', label: '极耳焊接拉力', unit: 'N', type: 'text', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      winding: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '物料信息', key: 'separatorModel', label: '隔膜型号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'windingSpeed', label: '卷绕速度', unit: 'm/min', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'windingTension', label: '卷绕张力', unit: 'N', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'coreThickness', label: '电芯厚度', unit: 'mm', type: 'number', required: false, isSystem: true },
        { group: '工艺参数', key: 'coreDiameter', label: '电芯直径', unit: 'mm', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      assembly: [
        { group: '基础信息', key: 'casingEquipmentCode', label: '入壳设备编号', type: 'text', required: true, isSystem: true },
        { group: '物料信息', key: 'shellModel', label: '壳体型号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'bottomWeldPull', label: '底焊拉力', unit: 'N', type: 'number', required: false, isSystem: true },
        { group: '工艺参数', key: 'capWeldingPull', label: '盖帽焊接拉力', unit: 'N', type: 'number', required: false, isSystem: true },
        { group: '工艺参数', key: 'tabWeldingPull', label: '极耳焊接拉力', unit: 'N', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      baking: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'bakingTemperature', label: '烘烤温度', unit: '℃', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'bakingDuration', label: '烘烤时长', unit: 'min', type: 'number', required: true, isSystem: true },
        { group: '工艺参数', key: 'vacuumLevel', label: '真空度', unit: 'kPa', type: 'number', required: false, isSystem: true },
        { group: '工艺参数', key: 'moistureAfterBaking', label: '烘烤后水分', unit: 'ppm', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      injection: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '物料信息', key: 'electrolyteModel', label: '电解液型号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'injectionAmount', label: '注液量', unit: 'g', type: 'number', required: false, isSystem: true },
        { group: '工艺参数', key: 'injectionHumidity', label: '环境湿度', unit: '%', type: 'number', required: false, isSystem: true },
        { group: '工艺参数', key: 'injectionTemperature', label: '环境温度', unit: '℃', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      formation: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'chargeDischargeTemplate', label: '充放电模板', type: 'text', required: false, isSystem: true },
        { group: '工艺参数', key: 'formationTemperature', label: '化成温度', unit: '℃', type: 'number', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      grading: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'gradingTemperature', label: '分容温度', unit: '℃', type: 'number', required: false, isSystem: true },
        { group: '质量标准', key: 'capacityGradeStandard', label: '容量分级标准', type: 'text', required: false, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      sorting: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'ocvVoltageRange', label: 'OCV电压范围', unit: 'V', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'irRange', label: '内阻范围', unit: 'mΩ', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'capacityRange', label: '容量范围', unit: 'Ah', type: 'text', required: true, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ],
      wrapping: [
        { group: '基础信息', key: 'equipmentCode', label: '设备编号', type: 'text', required: true, isSystem: true },
        { group: '物料信息', key: 'filmModel', label: '包膜型号', type: 'text', required: true, isSystem: true },
        { group: '工艺参数', key: 'shrinkTemperature', label: '热缩温度', unit: '℃', type: 'number', required: true, isSystem: true },
        { group: '操作信息', key: 'operatorName', label: '操作员', type: 'text', required: true, isSystem: true },
      ]
    };

    for (const process of processes) {
      // 只有当 fieldDefinitions 为空或者不包含任何系统字段时才进行初始化
      let currentFields: any[] = [];
      try {
        currentFields = process.fieldDefinitions ? JSON.parse(process.fieldDefinitions) : [];
      } catch (e) {
        currentFields = [];
      }

      const hasSystemFields = currentFields.some(f => f.isSystem);
      if (!hasSystemFields && standardFields[process.processCode]) {
        // 合并：保留现有的自定义字段（如果有的话），加上预设的系统字段
        const newFields = [...standardFields[process.processCode], ...currentFields.filter(f => !standardFields[process.processCode].find(sf => sf.key === f.key))];
        process.fieldDefinitions = JSON.stringify(newFields);
        await this.processDictRepo.save(process);
      }
    }
  }

  async findAll(query?: { keyword?: string; isActive?: string; page?: number; pageSize?: number }) {
    const where: any = {};

    if (query?.keyword) {
      where.processName = Like(`%${query.keyword}%`);
    }

    if (query?.isActive !== undefined && query?.isActive !== '') {
      where.isActive = query.isActive === 'true';
    }

    const page = query?.page ? Number(query.page) : 1;
    const pageSize = query?.pageSize ? Number(query.pageSize) : 20;

    const [items, total] = await this.processDictRepo.findAndCount({
      where,
      order: { sortOrder: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number): Promise<ProcessDictionary> {
    const process = await this.processDictRepo.findOne({ where: { id } });
    if (!process) {
      throw new NotFoundException(`Process Dictionary with ID ${id} not found`);
    }
    return process;
  }

  async findByCode(processCode: string): Promise<ProcessDictionary | null> {
    return this.processDictRepo.findOne({ where: { processCode } });
  }

  async create(data: Partial<ProcessDictionary>): Promise<ProcessDictionary> {
    const process = this.processDictRepo.create(data);
    return this.processDictRepo.save(process);
  }

  async update(id: number, data: Partial<ProcessDictionary>): Promise<ProcessDictionary> {
    await this.processDictRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const process = await this.findOne(id);
    
    // Validate process code to prevent SQL injection
    if (!/^[a-zA-Z0-9_-]+$/.test(process.processCode)) {
      throw new BadRequestException('无效的工序代码');
    }

    // Convert process code to table name (e.g. roller-pressing -> roller_pressing_record)
    const tableName = `${process.processCode.replace(/-/g, '_')}_record`;
    
    try {
      // Try to select 1 record to see if the table has data
      const records = await this.dataSource.query(`SELECT TOP 1 id FROM ${tableName}`);
      if (records && records.length > 0) {
        throw new BadRequestException(`该工序已被历史生产批次使用过，无法删除，建议将其停用。`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If error is about missing table (e.g. Invalid object name), we can safely ignore it and proceed with deletion
    }

    await this.processDictRepo.delete(id);
  }
}
