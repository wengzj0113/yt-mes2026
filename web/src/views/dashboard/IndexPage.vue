<template>
  <div class="dashboard">
    <!-- Top Stats Cards -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="stat in topStats" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ color: stat.color }">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Main Content Area -->
    <el-row :gutter="20" class="main-row">
      <!-- Left: Real-time Alerts -->
      <el-col :span="6">
        <el-card shadow="never" class="dashboard-card alerts-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Bell /></el-icon> 实时生产异常</span>
            </div>
          </template>
          <div class="alert-list">
            <div v-for="log in alertLogs" :key="log.id" class="alert-item" :class="log.action.includes('错误') ? 'error' : 'warn'">
              <div class="alert-time">{{ formatDate(log.createdAt, 'HH:mm:ss') }}</div>
              <div class="alert-content">
                <strong>{{ log.module }}</strong>: {{ log.action }}
              </div>
            </div>
            <el-empty v-if="alertLogs.length === 0" description="暂无异常告警" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <!-- Center: Data Hub Gauge -->
      <el-col :span="12">
        <el-card shadow="never" class="dashboard-card hub-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Compass /></el-icon> 追溯数据中枢</span>
            </div>
          </template>
          <div class="hub-content">
            <v-chart class="gauge-chart" :option="gaugeOption" autoresize />
            <div class="hub-info">
              <div class="hub-status">全厂数据同步正常</div>
              <div class="hub-update">上次更新: {{ lastUpdateTime }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Right: Recent Batches Progress -->
      <el-col :span="6">
        <el-card shadow="never" class="dashboard-card batches-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Box /></el-icon> 最近批次流转</span>
            </div>
          </template>
          <div class="batch-list">
            <div v-for="batch in recentBatches" :key="batch.batchNo" class="batch-item" @click="goBatchDetail(batch.batchNo)">
              <div class="batch-header">
                <span class="batch-no">{{ batch.batchNo }}</span>
                <el-tag :type="getStatusType(batch.status)" size="small">
                  {{ getStatusText(batch.status) }}
                </el-tag>
              </div>
              <div class="batch-progress">
                <el-progress 
                  :percentage="getBatchProgress(batch)" 
                  :status="batch.status === 3 ? 'success' : ''"
                  :stroke-width="8"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Bottom: Quality Trend -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :span="24">
        <el-card shadow="never" class="dashboard-card trend-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 质量合格率趋势 (最近10批次)</span>
            </div>
          </template>
          <div class="trend-content">
            <v-chart class="trend-chart" :option="trendOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { batchApi } from '@/api/batch'
import { systemApi } from '@/api/system'
import { qualityApi } from '@/api/quality'
import { formatDateTime } from '@/composables/datetime'
import type { BatchDto, LogDto } from '@/types/api'
import { 
  Monitor, Bell, Compass, Box, TrendCharts, 
  Files, Loading, CircleCheck, WarnTriangleFilled 
} from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart, LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  GaugeChart,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const router = useRouter()
const loading = ref(false)
const lastUpdateTime = ref(new Date().toLocaleTimeString())
const statsData = ref<any>({})
const alertLogs = ref<LogDto[]>([])
const recentBatches = ref<BatchDto[]>([])
const qualityTrends = ref<any[]>([])

// Top Stats Definition
const topStats = computed(() => [
  { label: '累计生产批次', value: statsData.value.totalBatches ?? '-', icon: 'Files', color: '#409eff' },
  { label: '当前在线批次', value: statsData.value.inProgressBatches ?? '-', icon: 'Loading', color: '#e6a23c' },
  { label: '当日合格率', value: (statsData.value.dailyPassRate ?? '-') + '%', icon: 'CircleCheck', color: '#67c23a' },
  { label: '异常待处理', value: statsData.value.abnormalCount ?? '0', icon: 'WarnTriangleFilled', color: '#f56c6c' },
])

// Gauge Option
const gaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 10,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 20,
          color: [
            [0.3, '#f56c6c'],
            [0.7, '#e6a23c'],
            [1, '#67c23a']
          ]
        }
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '12%',
        width: 20,
        offsetCenter: [0, '-60%'],
        itemStyle: {
          color: 'auto'
        }
      },
      axisTick: {
        length: 12,
        lineStyle: {
          color: 'auto',
          width: 2
        }
      },
      splitLine: {
        length: 20,
        lineStyle: {
          color: 'auto',
          width: 5
        }
      },
      axisLabel: {
        color: '#464646',
        fontSize: 12,
        distance: -60,
        formatter: function (value: number) {
          if (value === 90) return '良'
          if (value === 50) return '中'
          if (value === 10) return '差'
          return ''
        }
      },
      title: {
        offsetCenter: [0, '-20%'],
        fontSize: 16,
        color: '#909399'
      },
      detail: {
        fontSize: 40,
        offsetCenter: [0, '0%'],
        valueAnimation: true,
        formatter: function (value: number) {
          return Math.round(value) + '%'
        },
        color: 'auto'
      },
      data: [
        {
          value: statsData.value.integrity ?? 0,
          name: '追溯完整率'
        }
      ]
    }
  ]
}))

// Trend Option
const trendOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: qualityTrends.value.map(t => t.batchNo)
  },
  yAxis: {
    type: 'value',
    min: 80,
    max: 100,
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [
    {
      name: '合格率',
      type: 'line',
      smooth: true,
      data: qualityTrends.value.map(t => t.passRate),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0)' }
          ]
        }
      },
      lineStyle: {
        width: 3,
        color: '#409eff'
      },
      itemStyle: {
        color: '#409eff'
      }
    }
  ]
}))

// Helpers
function formatDate(dateStr: string, format: string) {
  if (!dateStr) return '-'
  if (format === 'HH:mm:ss') {
    return formatDateTime(dateStr, { withSeconds: true }).slice(11)
  }
  return formatDateTime(dateStr, { withSeconds: true })
}

function getStatusType(status: number) {
  const map: Record<number, string> = {
    1: 'info',
    2: 'primary',
    3: 'success'
  }
  return map[status] || 'info'
}

function getStatusText(status: number) {
  const map: Record<number, string> = {
    1: '草稿',
    2: '进行中',
    3: '已完成'
  }
  return map[status] || '未知'
}

function getBatchProgress(batch: BatchDto) {
  if (batch.status === 3) return 100
  if (batch.status === 1) return 0
  // Random mock progress for now
  return 20 + Math.floor(Math.random() * 60)
}

function goBatchDetail(batchNo: string) {
  router.push(`/batches/${batchNo}`)
}

// Data Fetching
async function fetchData() {
  loading.value = true
  try {
    const [stats, logs, batches, trends] = await Promise.all([
      batchApi.getStats(),
      systemApi.logs({ pageSize: 10 }),
      batchApi.list({ pageSize: 8 }),
      qualityApi.getTrends()
    ])
    statsData.value = stats.data
    alertLogs.value = logs.data.items.filter((l: any) => l.action.includes('错误') || l.action.includes('异常') || l.action.includes('失败'))
    recentBatches.value = batches.data.items
    qualityTrends.value = trends.data
    lastUpdateTime.value = new Date().toLocaleTimeString()
  } catch (err) {
    console.error('Fetch dashboard data failed:', err)
  } finally {
    loading.value = false
  }
}

let timer: any = null
onMounted(() => {
  fetchData()
  timer = setInterval(fetchData, 30000) // Refresh every 30s
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 32px;
  background: rgba(64, 158, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.dashboard-card {
  height: 100%;
  border: none;
  display: flex;
  flex-direction: column;
}

.dashboard-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.main-row {
  margin-bottom: 20px;
}

/* Alerts */
.alerts-card {
  height: 360px;
}

.alert-list {
  flex: 1;
  overflow-y: auto;
}

.alert-item {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 4px solid #eee;
}

.alert-item.error {
  background: #fff5f5;
  border-left-color: #f56c6c;
}

.alert-item.warn {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.alert-time {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.alert-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

/* Hub */
.hub-card {
  height: 360px;
}

.hub-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 280px;
}

.gauge-chart {
  height: 230px;
  width: 100%;
}

.hub-info {
  text-align: center;
  margin-top: -30px;
}

.hub-status {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.hub-update {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* Batches */
.batches-card {
  height: 360px;
}

.batch-list {
  flex: 1;
  overflow-y: auto;
}

.batch-item {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background 0.2s;
}

.batch-item:hover {
  background: #f9fafc;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.batch-no {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.batch-progress {
  width: 100%;
}

/* Trend */
.trend-card {
  height: 280px;
}

.trend-content {
  height: 200px;
}

.trend-chart {
  width: 100%;
  height: 100%;
}
</style>
