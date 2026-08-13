export type ProcessFieldType = 'text' | 'number';

export interface ProcessFieldDefinition {
  group: string;
  key: string;
  label: string;
  unit?: string;
  type: ProcessFieldType;
  required: boolean;
  isSystem: boolean;
}

export interface ProcessBaselineItem {
  processCode: string;
  processName: string;
  sortOrder: number;
  isActive: boolean;
  fieldDefinitions: ProcessFieldDefinition[];
}

const text = (key: string, label: string, group = '工艺参数'): ProcessFieldDefinition => ({
  group, key, label, type: 'text', required: true, isSystem: true,
});
const number = (key: string, label: string, unit: string, group = '工艺参数'): ProcessFieldDefinition => ({
  group, key, label, unit, type: 'number', required: true, isSystem: true,
});
const operator = (): ProcessFieldDefinition => text('operatorName', '操作员', '操作信息');

const item = (processCode: string, processName: string, sortOrder: number, fieldDefinitions: ProcessFieldDefinition[]): ProcessBaselineItem => ({
  processCode, processName, sortOrder, isActive: true, fieldDefinitions,
});

export const PROCESS_BASELINE: ProcessBaselineItem[] = [
  item('batching', '配料', 10, [
    text('positiveActiveMaterial', '正极活性材料'), number('positiveSlurryViscosity', '正极浆料粘度', 'cp.s'), number('positiveSlurrySolids', '正极浆料固含', '%'),
    text('negativeActiveMaterial', '负极活性材料'), number('negativeSlurryViscosity', '负极浆料粘度', 'cp.s'), number('negativeSlurrySolids', '负极浆料固含', '%'), operator(),
  ]),
  item('coating', '涂布', 20, [
    number('positiveCoatingSpeed', '正极涂布速度', 'm/min', '正极涂布机信息'), number('positiveCoatingLength', '正极片涂层长度', 'mm', '正极涂布机信息'), number('positiveGapLength', '正极片间隙长度', 'mm', '正极涂布机信息'), number('positiveThickness', '正极片厚度', 'um', '正极涂布机信息'), number('positiveArealDensity', '正极片面密度', 'mg/cm²', '正极涂布机信息'), number('positiveWeightLossRatio', '正极片失重比', '%', '正极涂布机信息'),
    number('negativeCoatingSpeed', '负极涂布速度', 'm/min', '负极涂布机信息'), number('negativeCoatingLength1', '负极片涂层长度1', 'mm', '负极涂布机信息'), number('negativeGapLength1', '负极间隙长度1', 'mm', '负极涂布机信息'), number('negativeCoatingLength2', '负极片涂层长度2', 'mm', '负极涂布机信息'), number('negativeGapLength2', '负极间隙长度2', 'mm', '负极涂布机信息'), number('negativeThickness', '负极片厚度', 'um', '负极涂布机信息'), number('negativeArealDensity', '负极片面密度', 'mg/cm²', '负极涂布机信息'), number('negativeWeightLossRatio', '负极片失重比', '%', '负极涂布机信息'), operator(),
  ]),
  item('roller-pressing', '辊压', 30, [
    number('positiveRollerThickness', '正极片辊压厚度', 'um', '正极设备信息'), number('positiveRollerSpeed', '正极片辊压速度', 'm/min', '正极设备信息'), number('positiveRollerPressure', '正极辊压压力', 'kg/N', '正极设备信息'), number('negativeRollerThickness', '负极片辊压厚度', 'um', '负极设备信息'), number('negativeRollerSpeed', '负极片辊压速度', 'm/min', '负极设备信息'), number('negativeRollerPressure', '负极辊压压力', 'kg/N', '负极设备信息'), operator(),
  ]),
  item('slitting', '分切', 40, [number('positiveSlittingWidth', '正极片分切宽度', 'mm'), number('positiveSlittingSpeed', '正极片分切速度', 'm/min'), text('positiveSlittingAppearance', '正极片分切外观'), number('negativeSlittingWidth', '负极片分切宽度', 'mm'), number('negativeSlittingSpeed', '负极片分切速度', 'm/min'), text('negativeSlittingAppearance', '负极片分切外观')]),
  item('electrode', '制片', 50, [text('positiveTabMaterial', '正极耳材质', '正极设备信息'), number('positiveTabSpec', '正极耳规格型号', 'mm', '正极设备信息'), number('positiveTabCutLength', '正极耳裁切长度', 'mm', '正极设备信息'), number('positiveTabExposedLength', '正极耳外露尺寸', 'mm', '正极设备信息'), text('positiveTabWeldingAppearance', '正极儿焊接效果', '正极设备信息'), text('negativeTabMaterial', '负极耳材质', '负极设备信息'), number('negativeTabSpec', '负极耳规格型号', 'mm', '负极设备信息'), number('negativeTabCutLength1', '负极耳裁切长度1', 'mm', '负极设备信息'), number('negativeTabCutLength2', '负极耳裁切长度2', 'mm', '负极设备信息'), number('negativeTabExposedLength1', '负极耳外露尺寸1', 'mm', '负极设备信息'), number('negativeTabExposedLength2', '负极耳外露尺寸2', 'mm', '负极设备信息'), text('negativeTabWeldingAppearance', '负极耳焊接效果', '负极设备信息'), operator()]),
  item('winding', '卷绕', 60, [text('separatorSpec', '隔膜规格型号'), number('windingNeedleOuterDiameter', '卷针外径', 'mm'), number('windingSpeed', '卷绕速度', 'm/min'), number('separatorTension', '隔膜张力', 'N'), number('woundCoreOuterDiameter', '卷芯外径', 'mm'), text('woundCoreAppearance', '卷芯外观'), number('alignment', '包覆效果（对齐度）', 'mm'), operator()]),
  item('assembly', '装配', 70, []),
  item('casing', '入壳', 80, [number('steelShellSpec', '钢壳规格型号', 'mm'), number('insulationGasketThickness', '绝缘垫片厚度', 'mm'), text('casingAppearance', '入壳效果'), operator()]),
  item('integrated-machine', '一体机', 90, [number('weldingNeedleOuterDiameter', '焊针外径', 'mm'), number('bottomWeldPullForce', '点底焊接拉力', 'kg'), text('bottomWeldAppearance', '点滴焊接效果'), number('shortCircuitTestParameter', '短路测试参数', ''), text('shortCircuitTestAppearance', '短路测试效果'), number('insulationTopGasketThickness', '绝缘上垫厚度', 'mm'), number('grooveInnerDiameter', '滚槽内径', 'mm'), number('groovedShellOuterDiameter', '滚槽壳口外径', 'mm'), number('grooveUpperShoulderHeight', '滚槽后上肩高', 'mm'), number('grooveLowerEdgeHeight', '滚槽后下沿高度', 'mm'), text('grooveAppearance', '滚槽后外观'), number('grooveKnifeThickness', '滚刀厚度', 'mm')]),
  item('laser-welding', '激光焊接', 100, [text('capSpec', '盖帽规格型号'), number('laserWeldPullForce', '焊接拉力', 'kg'), text('laserWeldAppearance', '焊接外观'), operator()]),
  item('baking', '烘烤', 110, [number('cellBakingTemperature', '电芯烘烤温度', '℃'), number('bakingDuration', '烘烤时间', '小时'), number('vacuumLevel', '真空度', 'KPa'), number('positiveMoisture', '正极片含水量', 'ppm'), number('negativeMoisture', '负极片含水量', 'ppm')]),
  item('injection', '注液', 120, [text('electrolyteModel', '电解液型号'), number('gloveboxDewPoint', '手套箱露点温度', '℃'), number('gloveboxTemperature', '手套箱温度', '℃'), number('electrolyteAmount', '注液量', 'g'), operator()]),
  item('wrapping', '封口', 130, [number('sealingShoulderHeight', '封口肩高', 'mm'), number('sealingTotalHeight', '封口总高', 'mm'), number('sealingHeadDiameter', '封口头径', 'mm'), text('sealingCleanAppearance', '封口清洗后外观'), number('activationDuration', '活化时间', '小时'), text('filmColor', '套膜颜色'), text('formationTemplate', '化成模板'), number('formationTemperature', '化成温度', '℃'), text('gradingTemplate', '分容模板'), number('gradingTemperature', '分容温度', '℃'), number('capacityGradeStandard', '容量分级标准', 'mAh')]),
  item('sorting', '分选', 140, [number('internalResistanceRange', '内阻电压范围（内阻）', 'mΩ'), number('voltageRange', '内阻电压范围（电压）', 'V'), number('capacityRange', '容量范围', 'mAh'), operator()]),
];

export const OCV_PROCESS_FIELDS: ProcessFieldDefinition[] = [
  text('equipmentCode', '设备编号', '基础信息'),
  { group: '工艺参数', key: 'ocvVoltageRange', label: 'OCV电压范围', unit: 'V', type: 'number', required: true, isSystem: true },
  { group: '工艺参数', key: 'irRange', label: '内阻范围', unit: 'mΩ', type: 'number', required: true, isSystem: true },
  { group: '工艺参数', key: 'capacityRange', label: '容量范围', unit: 'mAh', type: 'number', required: true, isSystem: true },
  operator(),
];

export function getProcessBaseline(processCode: string): ProcessBaselineItem | undefined {
  return PROCESS_BASELINE.find((item) => item.processCode === processCode);
}
