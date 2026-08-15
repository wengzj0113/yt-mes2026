<template>
  <div class="batch-detail">
    <el-card v-if="batch" class="info-card">
      <div class="page-header">
        <h3>批次详情 - {{ batch.batchNo }}</h3>
        <el-button @click="$router.push('/batches')">返回列表</el-button>
      </div>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="批次号">{{ batch.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="产品型号">{{ batch.productModel }}</el-descriptions-item>
        <el-descriptions-item label="产品规格">{{ batch.productSpec }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ batch.plannedQty }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(batch.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="section-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="工序数据" name="processes">
          <el-row :gutter="16">
            <el-col :span="6" v-for="proc in processes" :key="proc.route">
              <el-card shadow="hover" class="proc-card" @click="navigate(proc.route, proc.processName)">
                <h4>{{ proc.processName }}</h4>
                <el-tag :type="statusTag(proc.status)" size="small">{{ statusText(proc.status) }}</el-tag>
                <p v-if="proc.updatedAt" class="proc-time">{{ formatTime(proc.updatedAt) }}</p>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="电芯列表" name="cells">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="goImportBarcode">导入电芯</el-button>
            <span class="cell-count" v-if="cellTotal > 0">共 {{ cellTotal }} 个电芯</span>
          </div>
          <el-table class="cell-table" :data="cellList" v-loading="cellLoading" stripe empty-text="暂未导入电芯">
            <el-table-column prop="barcode" label="电芯码" min-width="160" />
            <el-table-column label="OCV1">
              <el-table-column prop="ocv1Voltage" label="电压(V)" width="105">
                <template #default="{ row }">{{ formatCellNumber(row.ocv1Voltage, 3) }}</template>
              </el-table-column>
              <el-table-column prop="ocv1Resistance" label="内阻(mΩ)" width="110">
                <template #default="{ row }">{{ formatCellNumber(row.ocv1Resistance, 2) }}</template>
              </el-table-column>
              <el-table-column prop="ocv1Time" label="测试时间" width="170">
                <template #default="{ row }">{{ formatCellTime(row.ocv1Time) }}</template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="OCV2">
              <el-table-column prop="ocv2Voltage" label="电压(V)" width="105">
                <template #default="{ row }">{{ formatCellNumber(row.ocv2Voltage, 3) }}</template>
              </el-table-column>
              <el-table-column prop="ocv2Resistance" label="内阻(mΩ)" width="110">
                <template #default="{ row }">{{ formatCellNumber(row.ocv2Resistance, 2) }}</template>
              </el-table-column>
              <el-table-column prop="kValue" label="K值(mV/天)" width="125">
                <template #default="{ row }">{{ formatCellNumber(row.kValue, 4) }}</template>
              </el-table-column>
              <el-table-column prop="ocv2Time" label="测试时间" width="170">
                <template #default="{ row }">{{ formatCellTime(row.ocv2Time) }}</template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="分选">
              <el-table-column prop="voltage" label="电压(V)" width="105">
                <template #default="{ row }">{{ formatCellNumber(row.voltage, 3) }}</template>
              </el-table-column>
              <el-table-column prop="internalResistance" label="内阻(mΩ)" width="110">
                <template #default="{ row }">{{ formatCellNumber(row.internalResistance, 2) }}</template>
              </el-table-column>
              <el-table-column prop="capacity" label="容量(mAh)" width="110" />
              <el-table-column prop="grade" label="等级" width="80" />
              <el-table-column prop="sortingTime" label="分选时间" width="170">
                <template #default="{ row }">{{ formatCellTime(row.sortingTime) }}</template>
              </el-table-column>
            </el-table-column>
            <el-table-column prop="importedAt" label="导入时间" width="180" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-link type="primary" @click="goCellTrace(row.barcode)">追溯</el-link>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap" v-if="cellTotal > pageSize">
            <el-pagination
              v-model:current-page="cellPage"
              :page-size="pageSize"
              :total="cellTotal"
              layout="total, prev, pager, next"
              @current-change="loadCells"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="section-card">
      <h3 class="section-title">批次状态日志</h3>
      <el-timeline v-if="statusLogs.length > 0">
        <el-timeline-item
          v-for="item in statusLogs"
          :key="`${item.createdAt}-${item.toStatus}`"
          :timestamp="formatTime(item.createdAt)"
        >
          {{ item.changeReason || `状态变更为 ${item.toStatus}` }}
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无状态日志" />
    </el-card>

    <el-card class="section-card">
      <h3 class="section-title">相关操作</h3>
      <el-space wrap>
        <el-button type="success" @click="navigate('quality')">质量检验</el-button>
        <el-button type="warning" @click="navigate('materials')">材料仓库</el-button>
        <el-button type="primary" @click="goCellTraceByBatch">电芯追溯</el-button>
      </el-space>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      size="600px"
      destroy-on-close
      @closed="closeDrawer"
    >
      <component
        :is="currentComponent"
        :batchNo="batch?.batchNo"
        @close="drawerVisible = false"
      />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { batchApi, type ProcessStatusItem } from '@/api/batch'
import { cellApi, type CellBarcodeRecord } from '@/api/cells'
import { statusLogApi, type BatchStatusLogItem } from '@/api/status-log'
import { formatDateTime } from '@/composables/datetime'
import type { BatchDto } from '@/types/api'

// Import components for drawer
import BatchingPage from '../processes/BatchingPage.vue'
import CoatingPage from '../processes/CoatingPage.vue'
import RollerPressingPage from '../processes/RollerPressingPage.vue'
import SlittingPage from '../processes/SlittingPage.vue'
import ElectrodePage from '../processes/ElectrodePage.vue'
import WindingPage from '../processes/WindingPage.vue'
import AssemblyPage from '../processes/AssemblyPage.vue'
import BakingPage from '../processes/BakingPage.vue'
import InjectionPage from '../processes/InjectionPage.vue'
import WrappingPage from '../processes/WrappingPage.vue'
import FormationGradingPage from '../processes/FormationGradingPage.vue'
import FormationPage from '../processes/FormationPage.vue'
import GradingPage from '../processes/GradingPage.vue'
import Ocv1Page from '../processes/Ocv1Page.vue'
import Ocv2Page from '../processes/Ocv2Page.vue'
import SortingPage from '../processes/SortingPage.vue'
import CasingPage from '../processes/CasingPage.vue'
import IntegratedMachinePage from '../processes/IntegratedMachinePage.vue'
import LaserWeldingPage from '../processes/LaserWeldingPage.vue'
import QualityCheckPage from '../quality/QualityCheckPage.vue'
import MaterialWarehousePage from '../material/MaterialWarehousePage.vue'

const route = useRoute()
const router = useRouter()
const batch = ref<BatchDto | null>(null)
const processes = ref<ProcessStatusItem[]>([])
const statusLogs = ref<BatchStatusLogItem[]>([])
const activeTab = ref('processes')

// Drawer state
const drawerVisible = ref(false)
const drawerTitle = ref('')
const currentComponent = shallowRef<any>(null)

const componentMap: Record<string, any> = {
  'batching': BatchingPage,
  'coating': CoatingPage,
  'roller-pressing': RollerPressingPage,
  'slitting': SlittingPage,
  'electrode': ElectrodePage,
  'winding': WindingPage,
  'assembly': AssemblyPage,
  'casing': CasingPage,
  'integrated-machine': IntegratedMachinePage,
  'laser-welding': LaserWeldingPage,
  'baking': BakingPage,
  'injection': InjectionPage,
  'wrapping': WrappingPage,
  'formation-grading': FormationGradingPage,
  'formation': FormationPage,
  'grading': GradingPage,
  'ocv1': Ocv1Page,
  'ocv2': Ocv2Page,
  'sorting': SortingPage,
  'quality': QualityCheckPage,
  'materials': MaterialWarehousePage
}

// Cell list state
const cellList = ref<CellBarcodeRecord[]>([])
const cellLoading = ref(false)
const cellPage = ref(1)
const pageSize = 20
const cellTotal = ref(0)

function statusTag(status: string): string {
  const map: Record<string, string> = {
    not_entered: 'info',
    saved: 'success',
    draft: 'success',
    pending_quality: 'primary',
    quality_passed: 'success',
    quality_failed: 'danger',
    voided: 'danger'
  };
  return map[status] || 'info';
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    not_entered: '待录入',
    saved: '已保存',
    draft: '已保存',
    pending_quality: '待质检',
    quality_passed: '已完成',
    quality_failed: '质检不合格',
    voided: '已作废'
  };
  return map[status] || status;
}

function formatTime(dateStr: string): string {
  return formatDateTime(dateStr)
}

function formatCellNumber(value: number | null | undefined, fractionDigits: number): string {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? '-'
    : Number(value).toFixed(fractionDigits)
}

function formatCellTime(value: string | null | undefined): string {
  return value ? formatTime(value) : '-'
}

function navigate(path: string, name?: string) {
  const batchNo = batch.value?.batchNo
  if (!batchNo) return
  
  const component = componentMap[path]
  if (component) {
    currentComponent.value = component
    drawerTitle.value = name || (path === 'quality' ? '质量检验' : path === 'materials' ? '材料仓库' : '工序录入')
    drawerVisible.value = true
  } else {
    // Fallback for paths not in map (if any)
    if (path === 'quality') router.push(`/quality/${batchNo}`)
    else if (path === 'materials') router.push(`/materials/${batchNo}`)
    else router.push(`/processes/${batchNo}/${path}`)
  }
}

async function closeDrawer() {
  drawerVisible.value = false
  await loadData() // Refresh process status
}

function goImportBarcode() {
  router.push(`/cells?batchNo=${batch.value?.batchNo}`)
}

function goCellTrace(barcode: string) {
  router.push(`/trace?barcode=${barcode}`)
}

function goCellTraceByBatch() {
  router.push(`/trace?batchNo=${batch.value?.batchNo}`)
}

async function loadCells() {
  const batchNo = batch.value?.batchNo
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

async function loadData() {
  const batchNo = route.params.batchNo as string
  if (!batchNo) return

  const [batchRes, statusRes] = await Promise.all([
    batchApi.getByNo(batchNo).catch(() => null),
    batchApi.getProcessStatus(batchNo).catch(() => [] as any),
  ])

  if (batchRes) batch.value = batchRes.data
  processes.value = Array.isArray(statusRes) ? statusRes : (statusRes as any)?.data || []

  try {
    const logsRes = await statusLogApi.list(batchNo)
    statusLogs.value = logsRes.data ?? []
  } catch {
    statusLogs.value = []
  }
}

onMounted(async () => {
  await loadData()
  loadCells()
})
</script>

<style scoped>
.info-card { margin-bottom: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.section-card { margin-bottom: 20px; }
.section-title { margin: 0 0 16px; font-size: 16px; }
.proc-card { text-align: center; cursor: pointer; margin-bottom: 16px; transition: transform .2s; }
.proc-card:hover { transform: translateY(-2px); }
.proc-card h4 { margin: 0 0 8px; }
.proc-time { font-size: 12px; color: #909399; margin-top: 6px; }
.toolbar { margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
.cell-count { font-size: 13px; color: #909399; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
