<template>
  <ScaleScreen>
    <div class="big-screen">
      <!-- Header -->
      <dv-decoration-5 class="header-decoration" />
      <div class="header">
        <div class="header-title">
          <h1>追溯数据神经中枢</h1>
          <span class="sub-title">Traceability Data Nerve Center</span>
        </div>
        <div class="metrics">
          <div class="metric">
            <span class="metric-label">新增追溯电芯</span>
            <dv-digital-flop :config="totalCellsConfig" class="flop-item" />
          </div>
          <div class="metric">
            <span class="metric-label">数据完整率</span>
            <dv-digital-flop :config="coverageConfig" class="flop-item" />
          </div>
          <div class="metric">
            <span class="metric-label">优质品率</span>
            <dv-digital-flop :config="goodRateConfig" class="flop-item" />
          </div>
          <div class="metric alert-metric">
            <span class="metric-label">异常待处理</span>
            <dv-digital-flop :config="abnormalConfig" class="flop-item" />
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="main">
        <!-- Left Panel -->
        <div class="left-panel">
          <dv-border-box-11 title="工序流转 WIP">
            <div class="panel-content">
              <div class="wip-list">
                <div v-for="proc in processes" :key="proc.name" class="wip-item">
                  <span class="wip-name">{{ proc.name }}</span>
                  <span class="wip-val">{{ proc.wip }}</span>
                </div>
              </div>
            </div>
          </dv-border-box-11>

          <dv-border-box-11 title="实时生产异常告警">
            <div class="panel-content">
              <div class="alert-list-container">
                <div class="alert-list" :class="{ 'scroll-animation': alertLogs.length > 4 }">
                  <div v-for="(log, idx) in displayAlertLogs" :key="log.id + '-' + idx" class="alert-item" :class="log.action.includes('错误') ? 'error' : 'warn'">
                    <div class="alert-header">
                      <span class="alert-module">{{ log.module }}</span>
                      <span class="alert-time">{{ formatTime(log.createdAt) }}</span>
                    </div>
                    <div class="alert-action">{{ log.action }}</div>
                  </div>
                  <div v-if="alertLogs.length === 0" class="no-alert">
                    <span class="success-icon">✓</span> 暂无异常告警
                  </div>
                </div>
              </div>
            </div>
          </dv-border-box-11>
        </div>

        <!-- Center Panel -->
        <div class="center-panel">
          <div class="nerve-center-container">
            <svg viewBox="0 0 800 800" class="nerve-center-svg">
              <!-- Definitions for gradients and filters -->
              <defs>
                <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00e5ff" />
                  <stop offset="100%" stop-color="#00ff88" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <!-- Connection lines to center -->
              <line v-for="node in processNodes" :key="'line-' + node.name"
                    :x1="400" :y1="400" :x2="node.x" :y2="node.y"
                    stroke="rgba(0, 229, 255, 0.08)" stroke-width="1" />

              <!-- Circular flow path -->
              <path id="flow-path" d="M 400 100 A 300 300 0 1 1 399.9 100 Z" fill="none" stroke="rgba(0, 229, 255, 0.15)" stroke-width="2" stroke-dasharray="5,5" />

              <!-- Flowing light dots -->
              <circle r="4" fill="#00e5ff">
                <animateMotion dur="12s" repeatCount="indefinite" path="M 400 100 A 300 300 0 1 1 399.9 100 Z" />
              </circle>
              <circle r="4" fill="#00ff88">
                <animateMotion dur="12s" begin="3s" repeatCount="indefinite" path="M 400 100 A 300 300 0 1 1 399.9 100 Z" />
              </circle>
              <circle r="4" fill="#00e5ff">
                <animateMotion dur="12s" begin="6s" repeatCount="indefinite" path="M 400 100 A 300 300 0 1 1 399.9 100 Z" />
              </circle>
              <circle r="4" fill="#00ff88">
                <animateMotion dur="12s" begin="9s" repeatCount="indefinite" path="M 400 100 A 300 300 0 1 1 399.9 100 Z" />
              </circle>

              <!-- Center Area -->
              <!-- Breathing background circle -->
              <circle cx="400" cy="400" r="90" fill="rgba(0, 229, 255, 0.03)" stroke="rgba(0, 229, 255, 0.1)" stroke-width="1">
                <animate attributeName="r" values="90;105;90" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
              </circle>

              <!-- Rotating dashed ring -->
              <circle cx="400" cy="400" r="150" fill="none" stroke="rgba(0, 229, 255, 0.2)" stroke-width="1.5" stroke-dasharray="8, 12">
                <animateTransform attributeName="transform" type="rotate" from="0 400 400" to="360 400 400" dur="25s" repeatCount="indefinite" />
              </circle>
              <circle cx="400" cy="400" r="155" fill="none" stroke="rgba(0, 255, 136, 0.15)" stroke-width="1" stroke-dasharray="4, 8">
                <animateTransform attributeName="transform" type="rotate" from="360 400 400" to="0 400 400" dur="20s" repeatCount="indefinite" />
              </circle>

              <!-- Progress ring background -->
              <circle cx="400" cy="400" r="120" fill="none" stroke="rgba(0, 229, 255, 0.05)" stroke-width="8" />
              <!-- Progress ring -->
              <circle cx="400" cy="400" r="120" fill="none" stroke="url(#progress-grad)" stroke-width="8"
                      stroke-dasharray="753.98" :stroke-dashoffset="753.98 * (1 - coverageRate / 100)"
                      stroke-linecap="round" transform="rotate(-90 400 400)" />

              <!-- Center Text -->
              <text x="400" y="355" text-anchor="middle" fill="#a3c1e0" font-size="14" letter-spacing="1">数据完整率</text>
              <text x="400" y="405" text-anchor="middle" fill="#00e5ff" font-size="38" font-weight="bold" filter="url(#glow)">
                {{ coverageRate }}%
              </text>
              <text x="400" y="440" text-anchor="middle" fill="#a3c1e0" font-size="14" letter-spacing="1">优质品率</text>
              <text x="400" y="475" text-anchor="middle" fill="#00ff88" font-size="24" font-weight="bold">
                {{ goodRate }}%
              </text>

              <!-- Process Nodes -->
              <g v-for="node in processNodes" :key="node.name" class="node-group">
                <!-- Outer rotating dashed ring for warning/error -->
                <circle :cx="node.x" :cy="node.y" r="28" fill="none" :stroke="node.color" stroke-width="1" stroke-dasharray="4,4" v-if="node.status !== 'normal'">
                  <animateTransform attributeName="transform" type="rotate" :from="`0 ${node.x} ${node.y}`" :to="`360 ${node.x} ${node.y}`" dur="6s" repeatCount="indefinite" />
                </circle>
                
                <!-- Main Node Circle -->
                <circle :cx="node.x" :cy="node.y" r="22"
                        :fill="node.status === 'error' ? 'rgba(255, 77, 79, 0.2)' : node.status === 'warning' ? 'rgba(255, 153, 0, 0.2)' : 'rgba(0, 229, 255, 0.1)'"
                        :stroke="node.color" stroke-width="2"
                        :filter="node.status !== 'normal' ? 'url(#node-glow)' : ''" />
                
                <!-- Node Text: Name -->
                <text :x="node.x" :y="node.y - 30" text-anchor="middle" fill="#a3c1e0" font-size="12" font-weight="bold" class="node-label">
                  {{ node.name }}
                </text>
                
                <!-- Node Text: WIP -->
                <text :x="node.x" :y="node.y + 5" text-anchor="middle" :fill="node.color" font-size="13" font-weight="bold">
                  {{ node.wip }}
                </text>
              </g>
            </svg>
            <div class="sse-status" :class="{ error: sseError }">
              <span class="status-dot"></span>
              <span>{{ sseError || '正在监听实时追溯数据流...' }}</span>
            </div>
          </div>
        </div>

        <!-- Right Panel -->
        <div class="right-panel">
          <dv-border-box-11 title="实时分选结果">
            <div class="panel-content">
              <dv-scroll-board :config="scrollBoardConfig" class="scroll-board" />
            </div>
          </dv-border-box-11>

          <dv-border-box-11 title="质量合格率趋势">
            <div class="panel-content">
              <div class="chart-container">
                <v-chart class="chart" :option="chartOption" autoresize />
              </div>
            </div>
          </dv-border-box-11>
        </div>
      </div>
    </div>
  </ScaleScreen>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import ScaleScreen from '@/components/ScaleScreen.vue';

// API imports
import { systemApi } from '@/api/system';
import { qualityApi } from '@/api/quality';
import { batchApi } from '@/api/batch';
import { formatDateTime } from '@/composables/datetime';
import type { LogDto } from '@/types/api';

// ECharts imports
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
]);

// DataV imports
import { Decoration5 as DvDecoration5, BorderBox11 as DvBorderBox11, DigitalFlop as DvDigitalFlop, ScrollBoard as DvScrollBoard } from '@kjgl77/datav-vue3';

const totalCells = ref(0);
const coverageRate = ref(0);
const goodRate = ref(0);

const totalCellsConfig = reactive({ number: [0], content: '{nt}', style: { fill: '#00e5ff', fontSize: 26, fontWeight: 'bold' } });
const coverageConfig = reactive({ number: [0], content: '{nt}%', toFixed: 1, style: { fill: '#00e5ff', fontSize: 26, fontWeight: 'bold' } });
const goodRateConfig = reactive({ number: [0], content: '{nt}%', toFixed: 1, style: { fill: '#00e5ff', fontSize: 26, fontWeight: 'bold' } });
const abnormalConfig = reactive({ number: [0], content: '{nt}', style: { fill: '#ff4d4f', fontSize: 26, fontWeight: 'bold' } });

const scrollBoardConfig = reactive({
  header: ['条码', '电压', '内阻', '档位'],
  data: [],
  rowNum: 6,
  headerBGC: 'rgba(0, 229, 255, 0.2)',
  oddRowBGC: 'rgba(15, 19, 37, 0.6)',
  evenRowBGC: 'rgba(23, 28, 51, 0.6)',
  align: ['center', 'center', 'center', 'center'],
  columnWidth: [100, 70, 70, 60]
});

const processes = ref<any[]>([]);
const alertLogs = ref<LogDto[]>([]);
const qualityTrends = ref<any[]>([]);
const abnormalCount = ref<number>(0);

let eventSource: { close: () => void } | null = null;
const sseError = ref<string | null>(null);
let pollingTimer: any = null;

// Helper functions
function formatTime(dateStr: string) {
  if (!dateStr) return '';
  return formatDateTime(dateStr, { withSeconds: true }).slice(11)
}

// Computed properties
const displayAlertLogs = computed(() => {
  if (alertLogs.value.length > 4) {
    return [...alertLogs.value, ...alertLogs.value];
  }
  return alertLogs.value;
});

const centerX = 400;
const centerY = 400;
const nodeRadius = 300;

const processNodes = computed(() => {
  const order = [
    '配料', '涂布', '辊压', '分切', '制片', '卷绕', '装配', '烘烤', '注液', '顶封', '化成', '分容', '分选'
  ];
  
  return order.map((name, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 13;
    const x = centerX + nodeRadius * Math.cos(angle);
    const y = centerY + nodeRadius * Math.sin(angle);
    
    const procData = processes.value.find(p => 
      p.name === name || 
      (name === '顶封' && p.name === '包膜') || 
      (name === '包膜' && p.name === '顶封')
    );
    const wip = procData ? procData.wip : 0;
    
    const hasAlert = alertLogs.value.some(log => 
      log.action.includes(name) || 
      (log.module && log.module.includes(name)) ||
      (name === '顶封' && (log.action.includes('包膜') || (log.module && log.module.includes('包膜'))))
    );
    
    let statusColor = '#00e5ff'; // cyan
    let statusName = 'normal';
    if (hasAlert) {
      statusColor = '#ff4d4f'; // red
      statusName = 'error';
    } else if (wip > 50) {
      statusColor = '#ff9900'; // yellow
      statusName = 'warning';
    }
    
    return {
      name,
      x,
      y,
      wip,
      color: statusColor,
      status: statusName
    };
  });
});

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 19, 37, 0.9)',
    borderColor: '#00e5ff',
    borderWidth: 1,
    textStyle: {
      color: '#fff'
    },
    formatter: (params: any) => {
      const p = params[0];
      return `${p.name}<br/>合格率: <span style="color:#00e5ff;font-weight:bold">${p.value}%</span>`;
    }
  },
  grid: {
    top: '15%',
    left: '5%',
    right: '5%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: qualityTrends.value.map(t => t.batchNo),
    axisLine: {
      lineStyle: {
        color: 'rgba(0, 229, 255, 0.2)'
      }
    },
    axisLabel: {
      color: '#a3c1e0',
      fontSize: 10,
      rotate: 30
    }
  },
  yAxis: {
    type: 'value',
    min: 80,
    max: 100,
    splitLine: {
      lineStyle: {
        color: 'rgba(0, 229, 255, 0.05)'
      }
    },
    axisLine: {
      show: false
    },
    axisLabel: {
      color: '#a3c1e0',
      fontSize: 10,
      formatter: '{value}%'
    }
  },
  series: [
    {
      name: '合格率',
      type: 'line',
      smooth: true,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: '#00e5ff'
      },
      lineStyle: {
        width: 3,
        color: '#00e5ff',
        shadowColor: 'rgba(0, 229, 255, 0.5)',
        shadowBlur: 10
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(0, 229, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(0, 229, 255, 0)'
            }
          ]
        }
      },
      data: qualityTrends.value.map(t => t.passRate)
    }
  ]
}));

async function fetchApiData() {
  try {
    const [stats, logs, trends] = await Promise.all([
      batchApi.getStats(),
      systemApi.logs({ pageSize: 10 }),
      qualityApi.getTrends()
    ]);
    abnormalCount.value = stats.data?.abnormalCount ?? 0;
    abnormalConfig.number = [abnormalCount.value];
    alertLogs.value = logs.data?.items?.filter((l: any) => 
      l.action.includes('错误') || l.action.includes('异常') || l.action.includes('失败')
    ) ?? [];
    qualityTrends.value = trends.data ?? [];
  } catch (err) {
    console.error('Fetch big screen API data failed:', err);
  }
}

onMounted(async () => {
  fetchApiData();
  pollingTimer = setInterval(fetchApiData, 30000);

  const { createAuthEventSource } = await import('@/composables/useSseWithAuth')
  eventSource = createAuthEventSource(
    '/api/dashboard/stream',
    (rawData) => {
      const res = rawData as any
      if (!res?.data) return
      const d = res.data
      totalCells.value = d.topMetrics?.totalCells ?? 0;
      coverageRate.value = d.topMetrics?.coverageRate ?? 0;
      goodRate.value = d.topMetrics?.goodRate ?? 0;

      totalCellsConfig.number = [totalCells.value]
      coverageConfig.number = [coverageRate.value]
      goodRateConfig.number = [goodRate.value]
      processes.value = d.processes ?? []
      scrollBoardConfig.data = d.sorterLogs ?? []
      sseError.value = null
    },
    (err) => {
      console.error('SSE connection error:', err)
      sseError.value = '数据连接异常，请检查认证状态'
    },
  )
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
  if (eventSource) {
    eventSource.close()
  }
})
</script>

<style scoped>
.big-screen {
  width: 100%;
  height: 100%;
  background-color: #030409;
  background-image: radial-gradient(circle at 50% 50%, #0a1024 0%, #030409 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.header-decoration {
  width: 100%;
  height: 40px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
.header {
  height: 90px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 50px 0 50px;
  position: relative;
  z-index: 2;
}
.header-title {
  display: flex;
  flex-direction: column;
}
.header-title h1 {
  color: #00e5ff;
  font-size: 30px;
  margin: 0;
  letter-spacing: 4px;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}
.sub-title {
  font-size: 12px;
  color: rgba(0, 229, 255, 0.5);
  letter-spacing: 1px;
  margin-top: 2px;
}
.metrics {
  display: flex;
  gap: 30px;
}
.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 229, 255, 0.05);
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  min-width: 120px;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.05);
}
.alert-metric {
  background: rgba(255, 77, 79, 0.05);
  border-color: rgba(255, 77, 79, 0.2);
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.05);
}
.metric-label {
  font-size: 13px;
  color: #a3c1e0;
  margin-bottom: 2px;
}
.flop-item {
  width: 120px;
  height: 35px;
}
.main {
  flex: 1;
  display: flex;
  padding: 10px 30px 20px 30px;
  gap: 20px;
  height: calc(100% - 90px);
  box-sizing: border-box;
}
.left-panel, .right-panel {
  width: 440px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}
.left-panel :deep(.dv-border-box-11),
.right-panel :deep(.dv-border-box-11) {
  flex: 1;
  height: 50%;
}
.panel-content {
  padding: 55px 20px 15px 20px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.wip-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  padding-right: 5px;
}
.wip-list::-webkit-scrollbar,
.alert-list-container::-webkit-scrollbar {
  width: 4px;
}
.wip-list::-webkit-scrollbar-thumb,
.alert-list-container::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.2);
  border-radius: 2px;
}
.wip-item {
  background: rgba(0, 229, 255, 0.05);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 3px solid #00e5ff;
  border-radius: 0 4px 4px 0;
  transition: all 0.3s ease;
}
.wip-item:hover {
  background: rgba(0, 229, 255, 0.1);
  transform: translateX(2px);
}
.wip-name {
  font-size: 13px;
  color: #a3c1e0;
}
.wip-val {
  color: #00e5ff;
  font-weight: bold;
  font-size: 15px;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
}

/* Alert List Styles */
.alert-list-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.scroll-animation {
  animation: scrollUp 20s linear infinite;
}
.scroll-animation:hover {
  animation-play-state: paused;
}
@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}
.alert-item {
  background: rgba(255, 153, 0, 0.05);
  border: 1px solid rgba(255, 153, 0, 0.2);
  border-left: 4px solid #ff9900;
  padding: 8px 12px;
  border-radius: 0 4px 4px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.alert-item.error {
  background: rgba(255, 77, 79, 0.05);
  border-color: rgba(255, 77, 79, 0.2);
  border-left-color: #ff4d4f;
}
.alert-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.alert-module {
  color: #ff9900;
  font-weight: bold;
}
.alert-item.error .alert-module {
  color: #ff4d4f;
}
.alert-time {
  color: rgba(255, 255, 255, 0.4);
}
.alert-action {
  font-size: 13px;
  color: #fff;
  word-break: break-all;
}
.no-alert {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #00ff88;
  font-size: 14px;
  gap: 8px;
}
.success-icon {
  font-size: 18px;
}

/* Center Panel Styles */
.center-panel {
  flex: 1;
  border: 1px solid rgba(0, 229, 255, 0.15);
  box-shadow: inset 0 0 30px rgba(0, 229, 255, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  background: radial-gradient(circle at 50% 50%, rgba(10, 16, 36, 0.6) 0%, rgba(3, 4, 9, 0.8) 100%),
              url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9InJnYmEoMCwyMjksMjU1LDAuMDIpIi8+PC9zdmc+') repeat;
  border-radius: 8px;
  overflow: hidden;
}
.nerve-center-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}
.nerve-center-svg {
  width: 90%;
  height: 90%;
  max-width: 750px;
  max-height: 750px;
}
.node-group {
  cursor: pointer;
}
.node-label {
  text-shadow: 0 0 5px rgba(3, 4, 9, 0.8);
}
.sse-status {
  position: absolute;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(0, 229, 255, 0.7);
  background: rgba(0, 229, 255, 0.05);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 229, 255, 0.15);
}
.sse-status.error {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.05);
  border-color: rgba(255, 77, 79, 0.15);
}
.status-dot {
  width: 8px;
  height: 8px;
  background-color: #00ff88;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff88;
  animation: blink 1.5s infinite;
}
.sse-status.error .status-dot {
  background-color: #ff4d4f;
  box-shadow: 0 0 8px #ff4d4f;
}
@keyframes blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Right Panel Styles */
.scroll-board {
  width: 100%;
  height: 100%;
  flex: 1;
}
.chart-container {
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.chart {
  width: 100%;
  height: 100%;
  min-height: 220px;
}
</style>
