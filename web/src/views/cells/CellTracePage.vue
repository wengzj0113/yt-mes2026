<template>
  <div class="trace-page">
    <!-- ===== Compact Search Bar ===== -->
    <section class="search-bar">
      <div class="search-bar__modes">
        <button
          class="search-bar__mode"
          :class="{ active: mode === 'barcode' }"
          @click="switchMode('barcode')"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="3" height="16" rx="1"/><rect x="7" y="4" width="2" height="16" rx="1"/><rect x="11" y="4" width="2" height="16" rx="1"/><rect x="15" y="4" width="2" height="16" rx="1"/><rect x="19" y="4" width="3" height="16" rx="1"/></svg>
          电芯追溯
        </button>
        <button
          class="search-bar__mode"
          :class="{ active: mode === 'batch' }"
          @click="switchMode('batch')"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
          批次追溯
        </button>
      </div>
      <div class="search-bar__input-wrap">
        <el-input
          v-if="mode === 'barcode'"
          v-model="barcode"
          placeholder="扫描或输入电芯条码"
          clearable
          size="large"
          @keyup.enter="handleTrace"
        >
          <template #prefix>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#909399" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </template>
        </el-input>
        <el-select
          v-else
          v-model="batchQuery"
          filterable
          remote
          allow-create
          default-first-option
          reserve-keyword
          placeholder="输入批次号进行搜索或选择"
          :remote-method="searchBatches"
          :loading="batchSearchLoading"
          clearable
          size="large"
          style="width: 100%"
          @change="handleTrace"
        >
          <template #prefix>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#909399" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </template>
          <el-option
            v-for="item in batchOptions"
            :key="item.batchNo"
            :label="item.batchNo"
            :value="item.batchNo"
          >
            <span style="float: left">{{ item.batchNo }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ item.productModel }}</span>
          </el-option>
        </el-select>
        <el-button type="primary" size="large" :loading="tracing" @click="handleTrace" class="search-bar__btn">
          追溯查询
        </el-button>
      </div>
    </section>

    <!-- ===== Idle State ===== -->
    <div v-if="!result && !batchResult && !notFound && !tracing" class="idle-state">
      <div class="idle-state__graphic">
        <svg aria-hidden="true" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" stroke-width="1.2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <path d="M8 11h6" stroke-dasharray="2 2"/>
          <circle cx="11" cy="11" r="2" fill="#c0c4cc"/>
        </svg>
      </div>
      <p class="idle-state__text">{{ hintText }}</p>
      <p class="idle-state__sub">输入条码或批次号，一键追溯电芯全生命周期生产数据</p>
    </div>

    <!-- ===== Loading Skeleton ===== -->
    <div v-if="tracing" class="loading-skeleton">
      <div class="loading-skeleton__layout">
        <div class="loading-skeleton__nav">
          <div class="skeleton-block" style="height:36px;width:100%;margin-bottom:4px" />
          <div class="skeleton-block" style="height:36px;width:100%;margin-bottom:4px" />
          <div class="skeleton-block" style="height:36px;width:80%;margin-bottom:4px" />
          <div class="skeleton-block" style="height:36px;width:90%;margin-bottom:4px" />
        </div>
        <div class="loading-skeleton__content">
          <div class="skeleton-block" style="height:80px;width:100%;margin-bottom:16px" />
          <div class="skeleton-block" style="height:48px;width:100%;margin-bottom:16px" />
          <div class="skeleton-block" style="height:200px;width:100%" />
        </div>
      </div>
    </div>

    <!-- ===== Error State ===== -->
    <div v-if="notFound" class="error-state">
      <div class="error-state__icon">
        <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f56c6c" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <p class="error-state__text">{{ notFoundMsg }}</p>
      <el-button size="small" @click="resetSearch">重新搜索</el-button>
    </div>

    <!-- ===== Results ===== -->
    <template v-if="result || batchResult">
      <div class="trace-layout">
        <!-- Left: Process Navigation -->
        <aside class="process-nav">
          <div class="process-nav__header">
            <span class="process-nav__title">工序导航</span>
          </div>
          <div class="process-nav__list">
            <div
              v-for="(proc, idx) in processList"
              :key="proc.key"
              class="process-nav__item"
              :class="[
                `status-${proc.status}`,
                { active: selectedProcess === proc.key }
              ]"
              @click="selectedProcess = proc.key"
            >
              <span class="process-nav__dot" :class="`dot-${proc.status}`">
                <span v-if="proc.status === 'submitted'">&#10003;</span>
                <span v-else-if="proc.status === 'draft'">&#9998;</span>
                <span v-else-if="proc.status === 'voided'">&#10007;</span>
                <span v-else>{{ idx + 1 }}</span>
              </span>
              <span class="process-nav__name">{{ proc.name }}</span>
              <span class="process-nav__badge" :class="`badge-${proc.status}`">{{ stepLabel(proc) }}</span>
            </div>
          </div>
          <div class="process-nav__summary">
            <div class="process-nav__progress-track">
              <div class="process-nav__progress-fill" :style="{ width: progressPercent + '%' }" />
            </div>
            <div class="process-nav__progress-text">
              {{ statusSummary }}
            </div>
          </div>
        </aside>

        <!-- Right: Content -->
        <main class="trace-content">
          <!-- KPI Cards (barcode mode) -->
          <div v-if="mode === 'barcode' && result" class="kpi-cards">
            <div class="kpi-card">
              <div class="kpi-card__value">{{ result.cell.voltage?.toFixed(3) }}</div>
              <div class="kpi-card__label">电压 (V)</div>
              <div class="kpi-card__status kpi-ok">正常</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-card__value">{{ result.cell.internalResistance }}</div>
              <div class="kpi-card__label">内阻 (mΩ)</div>
              <div class="kpi-card__status kpi-ok">正常</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-card__value">{{ result.cell.capacity }}</div>
              <div class="kpi-card__label">容量 (mAh)</div>
              <div class="kpi-card__status kpi-ok">正常</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-card__value">{{ result.cell.grade || '-' }}<span class="kpi-card__unit">级</span></div>
              <div class="kpi-card__label">等级</div>
              <div class="kpi-card__status" :class="grade === 'A' ? 'kpi-ok' : grade === 'B' ? 'kpi-warn' : 'kpi-err'">
                {{ grade === 'A' ? '优质' : grade === 'B' ? '合格' : '待定' }}
              </div>
            </div>
          </div>

          <!-- Barcode display -->
          <div v-if="mode === 'barcode' && result" class="barcode-display">
            <span class="barcode-display__label">电芯条码</span>
            <span class="barcode-display__value">{{ result.cell.barcode }}</span>
            <span class="barcode-display__source">{{ result.cell.importSource }}</span>
          </div>

          <!-- Compact Pipeline Bar -->
          <div v-if="mode === 'barcode' && result" class="pipeline-bar">
            <div class="pipeline-bar__inner">
              <div
                v-for="(proc, idx) in processList"
                :key="proc.key"
                class="pipeline-bar__node"
                :class="`pipeline-${proc.status}`"
                :title="proc.name"
                @click="selectedProcess = proc.key"
              >
                <div class="pipeline-bar__dot" :class="{ 'is-active': selectedProcess === proc.key }" />
                <div v-if="idx < processList.length - 1" class="pipeline-bar__connector" :class="`conn-${proc.status}`" />
              </div>
            </div>
            <div class="pipeline-bar__labels">
              <span v-for="proc in processList" :key="proc.key" class="pipeline-bar__label">{{ proc.name }}</span>
            </div>
          </div>

          <!-- Batch Info Card -->
          <div v-if="batchInfo" class="info-card">
            <div class="info-card__header">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
              <span>批次信息</span>
              <el-tag :type="batchStatusType" size="small" effect="dark" class="info-card__tag">{{ batchStatusText }}</el-tag>
            </div>
            <div class="info-card__body">
              <div class="info-card__grid">
                <div class="info-card__item">
                  <span class="info-card__label">批次号</span>
                  <span class="info-card__value info-card__link" tabindex="0" role="button" @click="goBatchDetail(batchInfo.batchNo)" @keydown.enter.prevent="goBatchDetail(batchInfo.batchNo)">{{ batchInfo.batchNo }}</span>
                </div>
                <div class="info-card__item">
                  <span class="info-card__label">产品型号</span>
                  <span class="info-card__value">{{ batchInfo.productModel }}</span>
                </div>
                <div class="info-card__item">
                  <span class="info-card__label">产品规格</span>
                  <span class="info-card__value">{{ batchInfo.productSpec }}</span>
                </div>
                <div class="info-card__item">
                  <span class="info-card__label">计划数量</span>
                  <span class="info-card__value">{{ batchInfo.plannedQty }}</span>
                </div>
                <div class="info-card__item">
                  <span class="info-card__label">创建时间</span>
                  <span class="info-card__value">{{ formatTime(batchInfo.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Process Detail -->
          <div v-if="selectedRecord" class="detail-panel">
            <div class="detail-panel__header">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e24aa" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>{{ selectedProcessName }}</span>
              <el-tag :type="stepTag(selectedProcInfo!)" size="small" effect="dark">{{ stepLabel(selectedProcInfo!) }}</el-tag>
            </div>
            <div class="detail-panel__body">
              <div class="detail-group" v-for="(group, gIdx) in groupedFields" :key="gIdx">
                <div class="detail-group__title">{{ group.title }}</div>
                <div class="detail-group__grid">
                  <div v-for="item in group.fields" :key="item.key" class="detail-group__field">
                    <span class="detail-group__label">{{ item.label }}</span>
                    <span class="detail-group__value">{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="processList.length > 0" class="detail-panel hint-panel">
            <div class="hint-panel__body">
              <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>点击工序节点查看详细数据</span>
            </div>
          </div>

          <!-- Cell List (batch mode) -->
          <div v-if="mode === 'batch'" class="cell-table">
            <div class="cell-table__header">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00acc1" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
              <span>批次电芯列表</span>
              <span v-if="cellTotal > 0" class="cell-table__count">共 {{ cellTotal }} 个电芯</span>
            </div>
            <el-table :data="cellList" v-loading="cellLoading" stripe border empty-text="该批次暂无电芯数据" class="cell-table__grid">
              <el-table-column prop="barcode" label="条码" min-width="160" />
              <el-table-column prop="grade" label="等级" width="80">
                <template #default="{ row }">
                  <el-tag :type="gradeTag(row.grade)" size="small" effect="plain">{{ row.grade || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="voltage" label="电压(V)" width="100">
                <template #default="{ row }">{{ row.voltage?.toFixed(3) }}</template>
              </el-table-column>
              <el-table-column prop="internalResistance" label="内阻(mΩ)" width="100" />
              <el-table-column prop="capacity" label="容量(mAh)" width="100" />
              <el-table-column prop="importedAt" label="导入时间" width="180" />
            </el-table>
            <div v-if="cellTotal > pageSize" class="cell-table__pagination">
              <el-pagination
                v-model:current-page="cellPage"
                :page-size="pageSize"
                :total="cellTotal"
                layout="total, prev, pager, next"
                @current-change="loadCellList"
              />
            </div>
          </div>
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cellApi, type CellTraceResult } from '@/api/cells'
import { batchApi } from '@/api/batch'

/* ============ Process Definitions ============ */

const PROCESS_ORDER = [
  { key: 'batching', name: '配料' },
  { key: 'coating', name: '涂布' },
  { key: 'roller-pressing', name: '辊压' },
  { key: 'slitting', name: '分切' },
  { key: 'electrode', name: '制片' },
  { key: 'winding', name: '卷绕' },
  { key: 'assembly', name: '装配' },
  { key: 'baking', name: '烘烤' },
  { key: 'injection', name: '注液' },
  { key: 'wrapping', name: '顶封' },
  { key: 'formation', name: '化成' },
  { key: 'grading', name: '分容' },
  { key: 'sorting', name: '分选' },
]

/* Process field labels grouped by category */
const PROCESS_FIELD_GROUPS: Record<string, { title: string; fields: Record<string, string> }[]> = {
  batching: [
    { title: '材料参数', fields: { positiveMaterial: '正极材料', negativeMaterial: '负极材料', viscosityRecord: '粘度记录' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  coating: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', coatingSpeed: '涂布速度(m/min)', coatingTemperature: '涂布温度(℃)' } },
    { title: '工艺参数', fields: { coatingThicknessPos: '正极涂布厚度(um)', coatingThicknessNeg: '负极涂布厚度(um)', arealDensityPos: '正极面密度(g/m²)', arealDensityNeg: '负极面密度(g/m²)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  'roller-pressing': [
    { title: '设备参数', fields: { equipmentCode: '设备编号', rollerPressure: '辊压压力(T)', rollerThickness: '辊压厚度(mm)', rollerSpeed: '辊压速度(m/min)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  slitting: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', slittingSpeed: '分切速度(m/min)' } },
    { title: '工艺参数', fields: { electrodeWidth: '极片宽度(mm)', electrodeLength: '极片长度(mm)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  electrode: [
    { title: '材料参数', fields: { tabMaterialSpec: '极耳材料规格', electrodeLength: '极片长度', tabWeldingPull: '极耳焊接拉力' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  winding: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', windingSpeed: '卷绕速度(rpm)', windingTension: '卷绕张力(N)' } },
    { title: '材料参数', fields: { separatorModel: '隔膜型号' } },
    { title: '工艺参数', fields: { coreThickness: '电芯厚度(mm)', coreDiameter: '电芯直径(mm)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  assembly: [
    { title: '设备参数', fields: { casingEquipmentCode: '入壳设备编号', bottomWeldEquipment: '底焊设备' } },
    { title: '材料参数', fields: { shellModel: '壳体型号', capModel: '盖板型号' } },
    { title: '工艺参数', fields: { bottomWeldParams: '底焊参数', bottomWeldPull: '底焊拉力(N)', capWeldingPull: '盖板焊接拉力(N)', tabWeldingPull: '极耳焊接拉力(N)', grooveRecord: '滚槽记录' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  baking: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', bakingTemperature: '烘烤温度(℃)', vacuumLevel: '真空度(MPa)' } },
    { title: '工艺参数', fields: { bakingDuration: '烘烤时间(min)', moistureAfterBaking: '烘烤后水分(%)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  injection: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', injectionHumidity: '注液湿度(%)', injectionTemperature: '注液温度(℃)' } },
    { title: '材料参数', fields: { electrolyteModel: '电解液型号', injectionAmount: '注液量(g)' } },
    { title: '工艺参数', fields: { sealingDimension: '封口尺寸(mm)', cleaningRecord: '清洗记录' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  wrapping: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', shrinkTemperature: '热缩温度(℃)' } },
    { title: '材料参数', fields: { filmModel: '包装膜型号' } },
    { title: '工艺参数', fields: { appearanceCheck: '外观检查' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  formation: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', formationTemperature: '化成温度(℃)' } },
    { title: '工艺参数', fields: { chargeDischargeTemplate: '充放电模板' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  grading: [
    { title: '设备参数', fields: { equipmentCode: '设备编号', gradingTemperature: '分容温度(℃)' } },
    { title: '工艺参数', fields: { capacityGradeStandard: '容量等级标准', chargeDischargeTemplate: '充放电模板' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  sorting: [
    { title: '设备参数', fields: { equipmentCode: '设备编号' } },
    { title: '检测参数', fields: { ocvVoltageRange: 'OCV电压范围', irRange: '内阻范围', capacityRange: '容量范围' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
}

const SKIP_FIELDS = new Set(['batchNo', 'id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'recordStatus', 'isDraft'])

/* ============ State ============ */

const route = useRoute()
const router = useRouter()

const mode = ref<'barcode' | 'batch'>('barcode')
const barcode = ref((route.query.barcode as string) || '')
const batchQuery = ref((route.query.batchNo as string) || '')
const result = ref<CellTraceResult | null>(null)
const batchResult = ref<any>(null)
const processes = ref<Record<string, any>>({})
const batchInfo = ref<any>(null)
const notFound = ref(false)
const notFoundMsg = ref('')
const tracing = ref(false)
const selectedProcess = ref<string | null>(null)

// Cell list (batch mode)
const cellList = ref<any[]>([])
const cellLoading = ref(false)
const cellPage = ref(1)
const pageSize = 20
const cellTotal = ref(0)

// Batch select options
const batchOptions = ref<any[]>([])
const batchSearchLoading = ref(false)
let searchTimeout: any = null

/* ============ Computed ============ */

const grade = computed(() => result.value?.cell.grade || '')

const processList = computed(() => {
  const data = processes.value
  if (!data || Object.keys(data).length === 0) return []
  return PROCESS_ORDER.map((p) => {
    const record = data[p.key] || null
    let status = 'not_entered'
    if (record) {
      if (record.recordStatus === 2) status = 'voided'
      else if (!record.isDraft) status = 'submitted'
      else status = 'draft'
    }
    return { ...p, record, status }
  })
})

const selectedRecord = computed(() => {
  if (!selectedProcess.value) return null
  return processes.value?.[selectedProcess.value] || null
})

const selectedProcInfo = computed(() => {
  return processList.value.find((p) => p.key === selectedProcess.value) || null
})

const selectedProcessName = computed(() => {
  const p = PROCESS_ORDER.find((x) => x.key === selectedProcess.value)
  return p?.name || selectedProcess.value || ''
})

const groupedFields = computed(() => {
  const record = selectedRecord.value
  if (!record) return []
  const groups = PROCESS_FIELD_GROUPS[selectedProcess.value!]
  if (!groups) {
    // Fallback: ungrouped fields
    const fields = Object.entries(record)
      .filter(([key]) => !SKIP_FIELDS.has(key))
      .map(([key, val]) => ({ key, label: key, value: formatValue(val) }))
    return fields.length > 0 ? [{ title: '参数', fields }] : []
  }
  return groups
    .map((g) => ({
      title: g.title,
      fields: Object.entries(g.fields)
        .filter(([key]) => record[key] !== undefined && record[key] !== null)
        .map(([key, label]) => ({ key, label, value: formatValue(record[key]) })),
    }))
    .filter((g) => g.fields.length > 0)
})

const statusSummary = computed(() => {
  const list = processList.value
  const total = list.length
  const done = list.filter((p) => p.status !== 'not_entered').length
  return `已完成 ${done}/${total} 工序`
})

const progressPercent = computed(() => {
  const list = processList.value
  if (list.length === 0) return 0
  const done = list.filter((p) => p.status !== 'not_entered').length
  return Math.round((done / list.length) * 100)
})

const hintText = computed(() => {
  return mode.value === 'barcode'
    ? '扫描或输入电芯条码开始追溯'
    : '输入批次号查看完整追溯信息'
})

const batchStatusType = computed(() => {
  const s = batchInfo.value?.status
  if (s === 2) return 'primary'
  if (s === 3) return 'success'
  if (s === 4) return 'danger'
  return 'info'
})

const batchStatusText = computed(() => {
  const map: Record<number, string> = { 1: '草稿', 2: '进行中', 3: '已完成', 4: '已关闭' }
  return map[batchInfo.value?.status] || '未知'
})

/* ============ Methods ============ */

function gradeTag(g: string | null): string {
  if (g === 'A') return 'success'
  if (g === 'B') return 'warning'
  return 'info'
}

function stepTag(proc: { status: string }): string {
  return { submitted: 'success', draft: 'warning', not_entered: 'info', voided: 'danger' }[proc.status] || 'info'
}

function stepLabel(proc: { status: string }): string {
  return { submitted: '已提交', draft: '草稿', not_entered: '未录入', voided: '已作废' }[proc.status] || proc.status
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toString() : val.toFixed(2)
  }
  return String(val) || '-'
}

function formatTime(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso).getTime()
  if (isNaN(d)) return iso
  return new Date(d).toLocaleString('zh-CN', { hour12: false })
}

function switchMode(m: 'barcode' | 'batch') {
  mode.value = m
  resetSearch()
}

function resetSearch() {
  result.value = null
  batchResult.value = null
  processes.value = {}
  batchInfo.value = null
  notFound.value = false
  selectedProcess.value = null
  cellList.value = []
  cellTotal.value = 0
}

async function handleTrace() {
  if (mode.value === 'barcode') {
    const code = barcode.value.trim()
    if (!code) return
    await traceByBarcode(code)
  } else {
    const batchNo = batchQuery.value.trim()
    if (!batchNo) return
    await traceByBatch(batchNo)
  }
}

async function searchBatches(query: string) {
  if (query !== '') {
    batchSearchLoading.value = true
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
      try {
        const res = await batchApi.list({ keyword: query, pageSize: 20 })
        batchOptions.value = res.data.items
      } catch (e) {
        batchOptions.value = []
      } finally {
        batchSearchLoading.value = false
      }
    }, 300)
  } else {
    batchOptions.value = []
  }
}

async function traceByBarcode(code: string) {
  resetSearch()
  tracing.value = true
  try {
    const res = await cellApi.trace(code)
    result.value = res.data
    processes.value = res.data.processes || {}
    batchInfo.value = res.data.batch
    selectedProcess.value = null
  } catch (e: any) {
    notFound.value = true
    const status = e?.response?.status
    if (status === 404) {
      notFoundMsg.value = '未找到该电芯条码'
    } else {
      notFoundMsg.value = e?.response?.data?.message || '查询失败'
    }
  } finally {
    tracing.value = false
  }
}

async function traceByBatch(batchNo: string) {
  resetSearch()
  tracing.value = true
  try {
    const [batchRes, recordsRes] = await Promise.all([
      batchApi.getByNo(batchNo),
      batchApi.getProcessRecords(batchNo),
    ])
    batchResult.value = batchRes
    batchInfo.value = batchRes.data
    processes.value = recordsRes.data || {}
    selectedProcess.value = null
    cellPage.value = 1
    await loadCellList()
  } catch (e: any) {
    notFound.value = true
    const status = e?.response?.status
    if (status === 404) {
      notFoundMsg.value = '未找到该批次'
    } else {
      notFoundMsg.value = e?.response?.data?.message || '查询失败'
    }
  } finally {
    tracing.value = false
  }
}

async function loadCellList() {
  const batchNo = batchQuery.value.trim()
  if (!batchNo) return
  cellLoading.value = true
  try {
    const res = await cellApi.findByBatch(batchNo, cellPage.value, pageSize)
    cellList.value = res.data
    cellTotal.value = res.meta?.total ?? 0
  } catch {
    cellList.value = []
    cellTotal.value = 0
  } finally {
    cellLoading.value = false
  }
}

function goBatchDetail(batchNo: string) {
  router.push(`/batches/${batchNo}`)
}

/* ============ Lifecycle ============ */

onMounted(() => {
  if (route.query.barcode) {
    mode.value = 'barcode'
    barcode.value = route.query.barcode as string
    handleTrace()
  } else if (route.query.batchNo) {
    mode.value = 'batch'
    batchQuery.value = route.query.batchNo as string
    handleTrace()
  }
})
</script>

<style scoped>
/* ========================================
   Trace Page – Industrial MES Theme
   ======================================== */

.trace-page {
  min-height: calc(100vh - 80px);
}

/* ===== Search Bar ===== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
  margin-bottom: 20px;
}
.search-bar__modes {
  display: flex;
  gap: 2px;
  background: #f0f2f5;
  border-radius: 6px;
  padding: 2px;
  flex-shrink: 0;
}
.search-bar__mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.search-bar__mode:hover { color: #303133; }
.search-bar__mode.active {
  background: #fff;
  color: #1a237e;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
.search-bar__input-wrap {
  flex: 1;
  display: flex;
  gap: 10px;
  align-items: center;
}
.search-bar__input-wrap .el-input { flex: 1; }
.search-bar__btn { flex-shrink: 0; }

/* ===== Idle State ===== */
.idle-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}
.idle-state__graphic {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.idle-state__text {
  margin: 0;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
.idle-state__sub {
  margin: 0;
  font-size: 13px;
  color: #c0c4cc;
}

/* ===== Loading Skeleton ===== */
.loading-skeleton { margin-top: 4px; }
.loading-skeleton__layout {
  display: flex;
  gap: 20px;
}
.loading-skeleton__nav {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.loading-skeleton__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.skeleton-block {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Error State ===== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
}
.error-state__text {
  margin: 0;
  font-size: 14px;
  color: #f56c6c;
}

/* ========================================
   Two-Column Layout (results)
   ======================================== */
.trace-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* ===== Process Navigation (Left) ===== */
.process-nav {
  width: 170px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 8px;
}
.process-nav__header {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.process-nav__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.process-nav__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  cursor: pointer;
  transition: all .15s;
  border-left: 3px solid transparent;
  font-size: 13px;
}
.process-nav__item:hover {
  background: #f5f7fa;
}
.process-nav__item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
}
.process-nav__dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.dot-submitted { background: #67c23a; }
.dot-draft { background: #e6a23c; }
.dot-not_entered { background: #dcdfe6; color: #909399; }
.dot-voided { background: #f56c6c; }

.process-nav__name {
  flex: 1;
  color: #303133;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.process-nav__badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  font-weight: 500;
}
.badge-submitted { color: #67c23a; background: #f0f9eb; }
.badge-draft { color: #e6a23c; background: #fdf6ec; }
.badge-not_entered { color: #c0c4cc; background: #f5f7fa; }
.badge-voided { color: #f56c6c; background: #fef0f0; }

/* ===== Process Nav Summary ===== */
.process-nav__summary {
  padding: 10px 14px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.process-nav__progress-track {
  height: 4px;
  background: #ebeef5;
  border-radius: 2px;
  overflow: hidden;
}
.process-nav__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 2px;
  transition: width .5s ease;
}
.process-nav__progress-text {
  font-size: 11px;
  color: #909399;
  text-align: center;
}

/* ========================================
   Right Content Area
   ======================================== */
.trace-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== KPI Cards ===== */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.kpi-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: box-shadow .2s;
}
.kpi-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
.kpi-card__value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}
.kpi-card__unit {
  font-size: 14px;
  font-weight: 400;
  color: #909399;
  margin-left: 2px;
}
.kpi-card__label {
  font-size: 12px;
  color: #909399;
  letter-spacing: .3px;
}
.kpi-card__status {
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
}
.kpi-ok { color: #67c23a; }
.kpi-warn { color: #e6a23c; }
.kpi-err { color: #f56c6c; }

/* ===== Barcode Display ===== */
.barcode-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #fafbfc;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
.barcode-display__label {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}
.barcode-display__value {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #1a237e;
  letter-spacing: 1px;
}
.barcode-display__source {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

/* ===== Compact Pipeline Bar ===== */
.pipeline-bar {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px 6px;
  border: 1px solid #ebeef5;
}
.pipeline-bar__inner {
  display: flex;
  align-items: center;
}
.pipeline-bar__node {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex: 1;
}
.pipeline-bar__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform .15s, box-shadow .15s;
}
.pipeline-bar__dot.is-active {
  transform: scale(1.3);
  box-shadow: 0 0 0 3px rgba(64,158,255,.25);
}
.pipeline-submitted .pipeline-bar__dot { background: #67c23a; }
.pipeline-draft .pipeline-bar__dot { background: #e6a23c; }
.pipeline-not_entered .pipeline-bar__dot { background: #dcdfe6; }
.pipeline-voided .pipeline-bar__dot { background: #f56c6c; }

.pipeline-bar__connector {
  height: 3px;
  flex: 1;
  margin: 0 2px;
  border-radius: 2px;
}
.conn-submitted { background: #67c23a; }
.conn-draft { background: #e6a23c; }
.conn-not_entered { background: #dcdfe6; }
.conn-voided { background: #f56c6c; }

.pipeline-bar__labels {
  display: flex;
  margin-top: 6px;
}
.pipeline-bar__label {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 2px;
}

/* ===== Info Card (Batch) ===== */
.info-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.info-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.info-card__tag { margin-left: auto; }
.info-card__body { padding: 16px; }
.info-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.info-card__item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.info-card__label {
  font-size: 11px;
  color: #909399;
  letter-spacing: .3px;
}
.info-card__value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
.info-card__link {
  color: #409eff;
  cursor: pointer;
  font-weight: 600;
}
.info-card__link:hover { text-decoration: underline; }

/* ===== Detail Panel ===== */
.detail-panel {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.detail-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.detail-panel__body { padding: 0; }
.detail-group {
  border-bottom: 1px solid #f5f5f5;
}
.detail-group:last-child { border-bottom: none; }
.detail-group__title {
  padding: 10px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: .5px;
}
.detail-group__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0;
}
.detail-group__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 16px;
  border-right: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}
.detail-group__field:nth-child(even) { border-right: none; }
.detail-group__label {
  font-size: 11px;
  color: #909399;
}
.detail-group__value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* ===== Hint Panel (no process selected) ===== */
.hint-panel .hint-panel__body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 20px;
  color: #c0c4cc;
  font-size: 14px;
}

/* ===== Cell Table ===== */
.cell-table {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.cell-table__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.cell-table__count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}
.cell-table__grid { border-radius: 0 0 8px 8px; }
.cell-table__pagination {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
}

/* ========================================
   Responsive
   ======================================== */
@media (max-width: 1024px) {
  .kpi-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .process-nav {
    width: 140px;
  }
  .info-card__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  .search-bar__input-wrap {
    width: 100%;
  }
  .trace-layout {
    flex-direction: column;
  }
  .process-nav {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0;
  }
  .process-nav__header { display: none; }
  .process-nav__list {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 6px;
  }
  .process-nav__item {
    border-left: none;
    border-bottom: 2px solid transparent;
    padding: 6px 10px;
    font-size: 12px;
  }
  .process-nav__item.active {
    border-left: none;
    border-bottom-color: #409eff;
  }
  .process-nav__badge { display: none; }
  .process-nav__summary {
    width: 100%;
    flex-direction: row;
    align-items: center;
  }
  .process-nav__progress-track { flex: 1; }
  .kpi-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-card__value {
    font-size: 20px;
  }
  .pipeline-bar__label {
    font-size: 8px;
  }
  .detail-group__grid {
    grid-template-columns: 1fr;
  }
  .detail-group__field:nth-child(even) { border-right: 1px solid #f5f5f5; }
}
</style>
