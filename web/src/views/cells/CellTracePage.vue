<template>
  <div class="trace-page" :class="{ 'is-searched': hasSearched }">
    <!-- ===== Minimalist Search Interface ===== -->
    <section class="search-container">
      <div class="search-box">
        <h1 v-if="!hasSearched" class="search-box__title">生产追溯中心</h1>
        
        <div class="search-box__tabs">
          <button 
            v-for="m in ['barcode', 'batch', 'pack']" 
            :key="m"
            class="search-tab"
            :class="{ active: mode === m }"
            @click="switchMode(m as any)"
          >
            {{ m === 'barcode' ? '电芯' : m === 'batch' ? '批次' : 'Pack' }}
          </button>
        </div>

        <div class="search-box__input-group">
          <el-input
            v-model="queryValue"
            :placeholder="placeholderText"
            clearable
            class="apple-input"
            @keyup.enter="handleTrace"
          >
            <template #prefix>
              <el-icon :size="20"><Search /></el-icon>
            </template>
          </el-input>
          <el-button 
            type="primary" 
            class="apple-button" 
            :loading="tracing" 
            @click="handleTrace"
          >
            查询
          </el-button>
        </div>

        <!-- Recent Searches (Only in Idle Mode) -->
        <div v-if="!hasSearched && recentSearches.length > 0" class="recent-searches">
          <div class="recent-searches__header">
            <span>最近查询</span>
            <el-button link type="info" size="small" @click="clearHistory">清空</el-button>
          </div>
          <div class="recent-searches__tags">
            <el-tag
              v-for="(item, idx) in recentSearches"
              :key="idx"
              closable
              round
              effect="plain"
              class="recent-tag"
              @click="redoSearch(item)"
              @close="removeHistoryItem(idx)"
            >
              {{ item.value }}
            </el-tag>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Results Content Area ===== -->
    <div v-if="hasSearched" class="results-container">
      <!-- Loading / Error States -->
      <div v-if="tracing" class="loading-overlay">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="notFound" class="not-found-state">
        <el-empty :description="notFoundMsg">
          <el-button round @click="resetSearch">返回搜索</el-button>
        </el-empty>
      </div>

      <!-- Result View -->
      <main v-else-if="result || batchResult || packResult" class="result-view">
        <!-- Pack Info Card (Minimalist) -->
        <section v-if="mode === 'pack' && packResult" class="minimal-card pack-summary">
          <div class="card-title">Pack 追溯摘要</div>
          <div class="pack-grid">
            <div class="pack-item">
              <label>批次号</label>
              <span class="highlight">{{ packResult.batchNo || '-' }}</span>
            </div>
            <div class="pack-item">
              <label>Pack 条码</label>
              <span>{{ packResult.packBarcode }}</span>
            </div>
            <div class="pack-item">
              <label>保护板条码</label>
              <span>{{ packResult.protectionBoardBarcode || '未绑定' }}</span>
            </div>
            <div class="pack-item">
              <label>操作员</label>
              <span>{{ packResult.operatorName || '系统' }}</span>
            </div>
            <div class="pack-item">
              <label>电芯总数</label>
              <span class="highlight">{{ packResult.cells?.length || 0 }} PCS</span>
            </div>
            <div class="pack-item">
              <label>录入时间</label>
              <span>{{ formatTime(packResult.createdAt) }}</span>
            </div>
          </div>
        </section>

        <!-- Cell/Batch Info KPI Row -->
        <section v-if="mode !== 'pack'" class="kpi-row">
          <div v-if="mode === 'barcode' && result" class="kpi-item grade-kpi">
            <div class="kpi-item__val large-grade" :class="`grade-${result.cell.grade}`">{{ result.cell.grade || '?' }}</div>
            <div class="kpi-item__lab">品质等级</div>
          </div>
          <div v-if="mode === 'barcode' && result" class="kpi-item">
            <div class="kpi-item__val">{{ result.cell.voltage?.toFixed(3) }}<small>V</small></div>
            <div class="kpi-item__lab">实时电压</div>
          </div>
          <div v-if="mode === 'barcode' && result" class="kpi-item">
            <div class="kpi-item__val">{{ result.cell.internalResistance }}<small>mΩ</small></div>
            <div class="kpi-item__lab">内阻</div>
          </div>
          <div v-if="mode === 'barcode' && result" class="kpi-item">
            <div class="kpi-item__val">{{ result.cell.capacity }}<small>mAh</small></div>
            <div class="kpi-item__lab">放电容量</div>
          </div>
          <div v-if="mode === 'barcode' && result" class="kpi-item">
            <div class="kpi-item__val">{{ formatKValue(result.cell.kValue) }}<small>mV/天</small></div>
            <div class="kpi-item__lab">K值</div>
          </div>
          <!-- Batch Mode KPI -->
          <div v-if="mode === 'batch' && batchInfo" class="kpi-item">
            <div class="kpi-item__val">{{ batchInfo.batchNo }}</div>
            <div class="kpi-item__lab">批次号</div>
          </div>
          <div v-if="mode === 'batch' && batchInfo" class="kpi-item">
            <div class="kpi-item__val">{{ batchInfo.productModel }}</div>
            <div class="kpi-item__lab">产品型号</div>
          </div>
          <div v-if="mode === 'batch' && batchInfo" class="kpi-item">
            <div class="kpi-item__val">{{ cellTotal }}</div>
            <div class="kpi-item__lab">已录入电芯</div>
          </div>
        </section>

        <div v-if="mode === 'barcode' && result" class="barcode-passport">
          <div class="passport-header">
            <h2 class="passport-title">电芯生产档案 (SN: {{ result.cell.barcode }})</h2>
            <div class="passport-meta">所属批次: {{ result.cell.batchNo }} | 追溯时间: {{ formatTime(new Date().toISOString()) }}</div>
          </div>

          <div class="passport-body">
            <!-- 进度条 + 模式切换 -->
            <div class="process-progress-bar">
              <div class="progress-info">
                <span class="progress-text">{{ completedSteps }}/{{ totalSteps }} 工序已完成</span>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                  <div class="progress-segments">
                    <span
                      v-for="(p, i) in processList"
                      :key="p.key"
                      class="segment-dot"
                      :class="`seg-${p.status}`"
                      :title="`${i+1}. ${p.name}`"
                    ></span>
                  </div>
                </div>
                <span class="progress-percent">{{ progressPercent }}%</span>
              </div>
              <div class="view-toggle">
                <button class="toggle-btn" :class="{ active: cardViewMode === 'overview' }" @click="switchToOverview">概览</button>
                <button class="toggle-btn" :class="{ active: cardViewMode === 'focus' }" @click="cardViewMode = 'focus'; focusedProcessKey = focusedProcessKey || visibleProcessList[0]?.key || null">聚焦</button>
              </div>
            </div>

            <!-- 横向流程卡片 -->
            <div class="process-cards-flow">
              <div
                v-for="proc in visibleProcessList"
                :key="proc.key"
                class="process-flow-card"
                :class="{
                  expanded: cardViewMode === 'focus' && focusedProcessKey === proc.key,
                  dimmed: cardViewMode === 'focus' && focusedProcessKey !== proc.key
                }"
                @click="toggleFocus(proc.key)"
              >
                <div class="flow-card-header">
                  <span class="flow-step-num">{{ PROCESS_ORDER.findIndex(x => x.key === proc.key) + 1 }}</span>
                  <span class="flow-step-name">{{ proc.name }}</span>
                  <el-tag size="small" :type="stepTag(proc)" round>{{ stepLabel(proc) }}</el-tag>
                </div>

                <!-- 概览模式：竖排参数（紧凑） -->
                <div v-if="cardViewMode !== 'focus' || focusedProcessKey !== proc.key" class="flow-card-params-compact">
                  <div v-for="field in getProcessFields(proc).slice(0, 5)" :key="field.key" class="flow-param">
                    <span class="flow-param-label">{{ field.label }}</span>
                    <span class="flow-param-value">{{ field.value }}</span>
                  </div>
                  <div v-if="getProcessFields(proc).length > 5" class="flow-param-more">
                    +{{ getProcessFields(proc).length - 5 }} 项参数
                  </div>
                </div>

                <!-- 聚焦模式：全部分组参数 -->
                <div v-else class="flow-card-params-full">
                  <template v-for="group in getProcessGroupedFields(proc)" :key="group.title">
                    <div class="flow-param-group-title">{{ group.title }}</div>
                    <div class="flow-param-group">
                      <div v-for="field in group.fields" :key="field.key" class="flow-param">
                        <span class="flow-param-label">{{ field.label }}</span>
                        <span class="flow-param-value">{{ field.value }}</span>
                      </div>
                    </div>
                  </template>
                </div>

                <div class="flow-card-footer">
                  <span>{{ proc.record.operatorName || '系统' }}</span>
                  <span>{{ formatTimeShort(proc.record.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- 原材料追溯（可折叠） -->
            <section class="minimal-card material-trace-card">
              <div class="card-header material-trace-header" @click="materialTraceCollapsed = !materialTraceCollapsed">
                <span class="card-header__title">原材料批次追溯</span>
                <el-icon class="collapse-icon" :class="{ collapsed: materialTraceCollapsed }"><ArrowDown /></el-icon>
              </div>
              <div v-show="!materialTraceCollapsed" class="material-grid">
                <div v-for="mat in materialList" :key="mat.label" class="material-item">
                  <div class="mat-icon"><el-icon><Coin /></el-icon></div>
                  <div class="mat-info">
                    <label>{{ mat.label }}</label>
                    <span class="barcode-font">{{ mat.value }}</span>
                  </div>
                </div>
                <div v-if="materialList.length === 0" class="empty-materials">
                  暂无原材料绑定记录
                </div>
              </div>
            </section>
          </div>
        </div>

        <div v-else class="main-layout" :class="{ 'is-pack-mode': mode === 'pack' }">
          <!-- Left Side: Process List (Cell/Batch) OR Cell List (Pack) -->
          <div class="process-section">
            <template v-if="mode === 'pack' && packResult">
              <div class="section-title">包含电芯列表</div>
              <div class="cell-list-container">
                <el-table 
                  :data="packResult.cells" 
                  stripe 
                  highlight-current-row
                  @current-change="handlePackCellChange"
                  style="width: 100%"
                >
                  <el-table-column prop="cellBarcode" label="电芯条码">
                    <template #default="{ row }">
                      <span class="barcode-font">{{ row.cellBarcode }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>

            <template v-else>
              <div class="section-title">工艺履历明细</div>
              <div class="process-flow">
                <div 
                  v-for="(proc, idx) in processList" 
                  :key="proc.key"
                  class="process-card"
                  :class="{ 
                    active: selectedProcess === proc.key,
                    'is-done': proc.status === 'submitted',
                    'is-pending': proc.status === 'not_entered'
                  }"
                  @click="selectedProcess = proc.key"
                >
                  <div class="process-card__header">
                    <span class="process-card__index">{{ idx + 1 }}</span>
                    <span class="process-card__name">{{ proc.name }}</span>
                    <el-icon v-if="proc.status === 'submitted'" class="status-icon"><Check /></el-icon>
                  </div>
                  <div v-if="proc.record" class="process-card__meta">
                    {{ proc.record.operatorName || '系统' }} · {{ formatTimeShort(proc.record.createdAt) }}
                  </div>
                  <div v-else class="process-card__meta pending">等待录入</div>
                </div>
              </div>
            </template>
          </div>

          <!-- Right Side: Detailed Data (Cell/Batch) OR Cell Details (Pack) -->
          <div class="detail-section">
            <template v-if="mode === 'pack'">
              <div v-if="previewLoading" class="preview-loading-box">
                <el-skeleton :rows="8" animated />
              </div>
              <div v-else-if="previewData" class="cell-passport-mini">
                <div class="mini-header">
                  <div class="mini-header__title">电芯档案: {{ previewData.cell.barcode }}</div>
                  <div class="mini-header__grade" :class="`grade-${previewData.cell.grade}`">{{ previewData.cell.grade || '?' }}级</div>
                </div>

                <div class="mini-kpis">
                  <div class="m-kpi">
                    <label>电压</label>
                    <span>{{ previewData.cell.voltage?.toFixed(3) }}<small>V</small></span>
                  </div>
                  <div class="m-kpi">
                    <label>内阻</label>
                    <span>{{ previewData.cell.internalResistance }}<small>mΩ</small></span>
                  </div>
                  <div class="m-kpi">
                    <label>容量</label>
                    <span>{{ previewData.cell.capacity }}<small>mAh</small></span>
                  </div>
                </div>

                <div class="mini-processes">
                  <div v-for="proc in getPreviewProcessList(previewData)" :key="proc.key" class="mini-proc-card">
                    <div class="mini-proc-header">
                      <span class="mini-proc-name">{{ proc.name }}</span>
                      <el-tag size="mini" :type="stepTag(proc)" round>{{ stepLabel(proc) }}</el-tag>
                    </div>
                    <div class="mini-proc-fields">
                      <div v-for="field in getProcessFields(proc)" :key="field.key" class="mini-field">
                        <label>{{ field.label }}</label>
                        <span>{{ field.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mini-footer">
                  <el-button type="primary" link @click="jumpToCellTrace(previewData.cell.barcode)">进入深度追溯</el-button>
                </div>
              </div>
              <div v-else class="empty-detail">
                <el-icon :size="48"><Pointer /></el-icon>
                <p>点击左侧列表查看电芯详情</p>
              </div>
            </template>

            <template v-else>
              <div v-if="selectedRecord" class="minimal-card detail-card">
                <div class="card-header">
                  <span class="card-header__title">{{ selectedProcessName }} · 详细参数</span>
                  <el-tag round size="small" :type="stepTag(selectedProcInfo!)">{{ stepLabel(selectedProcInfo!) }}</el-tag>
                </div>
                <div class="detail-grid">
                  <template v-for="group in groupedFields" :key="group.title">
                    <div class="detail-group-title">{{ group.title }}</div>
                    <div v-for="field in group.fields" :key="field.key" class="detail-field">
                      <label>{{ field.label }}</label>
                      <span>{{ field.value }}</span>
                    </div>
                  </template>
                </div>
              </div>
              
              <div v-else-if="mode === 'batch' && cellList.length > 0" class="minimal-card table-card">
                <div class="card-header">
                  <span class="card-header__title">批次电芯档案清单</span>
                  <div class="card-header__extra">
                    <el-tag effect="plain" round>共 {{ cellTotal }} 个电芯</el-tag>
                  </div>
                </div>
                <el-table :data="cellList" v-loading="cellLoading" stripe style="width: 100%">
                  <el-table-column type="index" label="#" width="60" align="center" />
                  <el-table-column prop="barcode" label="电芯 SN 条码" min-width="200">
                    <template #default="{ row }">
                      <span class="barcode-font">{{ row.barcode }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="grade" label="品质等级" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.grade === 'A' ? 'success' : 'warning'" size="small">{{ row.grade || '-' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="voltage" label="电压(V)" width="120">
                    <template #default="{ row }">
                      <span class="value-text">{{ row.voltage?.toFixed(3) || '-' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="internalResistance" label="内阻(mΩ)" width="120">
                    <template #default="{ row }">
                      <span class="value-text">{{ row.internalResistance || '-' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="120" align="right">
                    <template #default="{ row }">
                      <el-button link type="primary" @click="jumpToCellTrace(row.barcode)">查看档案</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="table-pagination">
                  <el-pagination
                    v-model:current-page="cellPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[20, 50, 100]"
                    layout="total, sizes, prev, pager, next"
                    :total="cellTotal"
                    @size-change="handleSizeChange"
                    @current-change="loadCellList"
                  />
                </div>
              </div>

              <div v-else class="empty-detail">
                <el-icon :size="48"><Operation /></el-icon>
                <p>选择左侧工序查看详细数据</p>
              </div>
            </template>
          </div>
        </div>
      </main>
    </div>

    <!-- ===== Cell Preview Drawer ===== -->
    <el-drawer
      v-model="previewVisible"
      :title="`电芯快速预览: ${previewBarcode}`"
      size="600px"
      destroy-on-close
      class="apple-drawer"
    >
      <div v-if="previewLoading" class="preview-loading">
        <el-skeleton :rows="10" animated />
      </div>
      <div v-else-if="previewData" class="preview-container">
        <div class="preview-kpis">
          <div class="p-kpi">
            <div class="p-kpi__val">{{ previewData.cell.voltage?.toFixed(3) || '-' }}<small>V</small></div>
            <div class="p-kpi__lab">电压</div>
          </div>
          <div class="p-kpi">
            <div class="p-kpi__val">{{ previewData.cell.internalResistance || '-' }}<small>mΩ</small></div>
            <div class="p-kpi__lab">内阻</div>
          </div>
          <div class="p-kpi">
            <div class="p-kpi__val">{{ previewData.cell.capacity || '-' }}<small>mAh</small></div>
            <div class="p-kpi__lab">容量</div>
          </div>
        </div>
        <div class="preview-timeline">
          <div class="tl-title">工序进度 ({{ previewDoneSteps }}/13)</div>
          <el-steps direction="vertical" :active="previewDoneSteps" finish-status="success">
            <el-step v-for="p in previewProcessList" :key="p.key" :title="p.name">
              <template #description>
                <div v-if="p.record" class="tl-desc">
                  {{ p.record.operatorName }} · {{ formatTime(p.record.createdAt) }}
                </div>
              </template>
            </el-step>
          </el-steps>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Box, Cpu, Calendar, Coin, Operation, Download, User, Search, Check, Pointer, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { cellApi, type CellTraceResult } from '@/api/cells'
import { batchApi } from '@/api/batch'
import { getPackByBarcode, type Pack } from '@/api/pack'
import { formatDateTime } from '@/composables/datetime'

/* ============ Constants & Types ============ */
import { processDictionaryApi } from '@/api/process-dictionary'
import { formatKValue } from './formatKValue'
import { resolveTraceProcessStatus } from './processTraceStatus'

// Dynamic Process Definitions
const processDict = ref<Record<string, any>>({})
const PROCESS_FIELD_GROUPS_DYNAMIC = ref<Record<string, any>>({})

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
  { key: 'ocv1', name: 'OCV1测试' },
  { key: 'grading', name: '分容' },
  { key: 'ocv2', name: 'OCV2测试' },
  { key: 'sorting', name: '分选' },
]

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
  ocv1: [
    { title: '设备参数', fields: { equipmentCode: '设备编号' } },
    { title: '检测参数', fields: { ocvVoltageMin: 'OCV电压', ocvVoltageMax: 'OCV电压(最大)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
  ocv2: [
    { title: '设备参数', fields: { equipmentCode: '设备编号' } },
    { title: '检测参数', fields: { ocvVoltageMin: 'OCV电压', ocvVoltageMax: 'OCV电压(最大)' } },
    { title: '操作信息', fields: { operatorName: '操作员' } },
  ],
}

const SKIP_FIELDS = new Set(['batchNo', 'id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'recordStatus', 'isDraft'])

/* ============ State ============ */

const route = useRoute()
const router = useRouter()

const mode = ref<'barcode' | 'batch' | 'pack'>('barcode')
const queryValue = ref('')
const hasSearched = ref(false)
const tracing = ref(false)
const notFound = ref(false)
const notFoundMsg = ref('')

// Results data
const result = ref<CellTraceResult | null>(null)
const batchResult = ref<any>(null)
const packResult = ref<Pack | null>(null)
const processes = ref<Record<string, any>>({})
const batchInfo = ref<any>(null)
const selectedProcess = ref<string | null>(null)

// History (LocalStorage)
const recentSearches = ref<{ mode: string; value: string }[]>([])

// Cell list (batch mode)
const cellList = ref<any[]>([])
const cellLoading = ref(false)
const cellPage = ref(1)
const pageSize = ref(20)
const cellTotal = ref(0)

// Preview Drawer
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewBarcode = ref('')
const previewData = ref<CellTraceResult | null>(null)

// 横向流程卡片状态
const cardViewMode = ref<'overview' | 'focus'>('overview')
const focusedProcessKey = ref<string | null>(null)
const materialTraceCollapsed = ref(false)

/* ============ Computed ============ */

const placeholderText = computed(() => {
  if (mode.value === 'barcode') return '输入电芯 SN 条码...'
  if (mode.value === 'batch') return '输入生产批次号...'
  return '输入 Pack 条码...'
})

const processList = computed(() => {
  const data = processes.value
  return PROCESS_ORDER.map((p) => {
    const record = data[p.key] || null
    const status = resolveTraceProcessStatus(record)
    return { ...p, record, status }
  })
})

const completedSteps = computed(() => {
  return processList.value.filter(p => p.status === 'submitted' || p.status === 'saved').length
})

const totalSteps = computed(() => PROCESS_ORDER.length)

const progressPercent = computed(() => {
  return totalSteps.value > 0 ? Math.round((completedSteps.value / totalSteps.value) * 100) : 0
})

const visibleProcessList = computed(() => {
  return processList.value.filter(p => p.status !== 'not_entered')
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
  return p?.name || ''
})

const groupedFields = computed(() => {
  const record = selectedRecord.value
  if (!record) return []
  
  // Try dynamic first, fallback to hardcoded
  let groups = PROCESS_FIELD_GROUPS_DYNAMIC.value[selectedProcess.value!]
  if (!groups || groups.length === 0) {
    groups = PROCESS_FIELD_GROUPS[selectedProcess.value!]
  }
  
  if (!groups) return []

  // Merge record fields and extraData
  const allData = { ...record }
  if (record.extraData) {
    try {
      const extra = JSON.parse(record.extraData)
      Object.assign(allData, extra)
    } catch (e) {}
  }

  return groups
    .map((g: any) => ({
      title: g.title,
      fields: (Array.isArray(g.fields) ? g.fields : Object.entries(g.fields).map(([k, l]) => ({ key: k, label: l, unit: '' })))
        .filter((f: any) => allData[f.key] !== undefined && allData[f.key] !== null)
        .map((f: any) => ({ 
          key: f.key, 
          label: f.label, 
          value: formatValue(allData[f.key]) + (f.unit ? ` ${f.unit}` : '') 
        })),
    }))
    .filter((g: any) => g.fields.length > 0)
})

const previewProcessList = computed(() => {
  const data = previewData.value?.processes || {}
  return PROCESS_ORDER.map((p) => {
    const record = data[p.key] || null
    const status = resolveTraceProcessStatus(record)
    return { ...p, record, status }
  })
})

const previewDoneSteps = computed(() => {
  return previewProcessList.value.filter(p => p.status === 'saved' || p.status === 'submitted').length
})

const materialList = computed(() => {
  if (!result.value?.processes) return []
  const mats: { label: string; value: string }[] = []
  const data = result.value.processes

  // Extract from process records based on known material fields
  if (data.batching?.positiveMaterial) mats.push({ label: '正极材料批次', value: data.batching.positiveMaterial })
  if (data.batching?.negativeMaterial) mats.push({ label: '负极材料批次', value: data.batching.negativeMaterial })
  if (data.winding?.separatorModel) mats.push({ label: '隔膜型号', value: data.winding.separatorModel })
  if (data.assembly?.shellModel) mats.push({ label: '壳体型号', value: data.assembly.shellModel })
  if (data.assembly?.capModel) mats.push({ label: '盖板型号', value: data.assembly.capModel })
  if (data.injection?.electrolyteModel) mats.push({ label: '电解液型号', value: data.injection.electrolyteModel })
  if (data.wrapping?.filmModel) mats.push({ label: '包装膜型号', value: data.wrapping.filmModel })

  return mats
})

/* ============ Methods ============ */

async function loadProcessDefinitions() {
  try {
    const res = await processDictionaryApi.list({ pageSize: 100, isActive: true })
    const items = res.data?.items || []
    
    const dict: Record<string, any> = {}
    const fieldGroups: Record<string, any> = {}
    
    items.forEach(item => {
      dict[item.processCode] = item
      if (item.fieldDefinitions) {
        try {
          const fields = JSON.parse(item.fieldDefinitions)
          // Group fields by their 'group' property
          const groups: any[] = []
          const groupMap: Record<string, any> = {}
          
          fields.forEach((f: any) => {
            const groupName = f.group || '基本参数'
            if (!groupMap[groupName]) {
              groupMap[groupName] = { title: groupName, fields: [] }
              groups.push(groupMap[groupName])
            }
            groupMap[groupName].fields.push({
              key: f.key,
              label: f.label,
              unit: f.unit
            })
          })
          fieldGroups[item.processCode] = groups
        } catch (e) {
          console.error(`Parse fields for ${item.processCode} failed`, e)
        }
      }
    })
    
    processDict.value = dict
    PROCESS_FIELD_GROUPS_DYNAMIC.value = fieldGroups
  } catch (e) {
    console.error('Load process definitions failed', e)
  }
}

function getProcessFields(proc: any) {
  const record = proc.record
  if (!record) return []
  
  // Try dynamic first, fallback to hardcoded
  let groups = PROCESS_FIELD_GROUPS_DYNAMIC.value[proc.key]
  if (!groups || groups.length === 0) {
    groups = PROCESS_FIELD_GROUPS[proc.key]
  }
  
  if (!groups) return []
  
  // Merge record fields and extraData
  const allData = { ...record }
  if (record.extraData) {
    try {
      const extra = JSON.parse(record.extraData)
      Object.assign(allData, extra)
    } catch (e) {}
  }
  
  return groups.flatMap((g: any) => 
    (Array.isArray(g.fields) ? g.fields : Object.entries(g.fields).map(([k, l]) => ({ key: k, label: l, unit: '' })))
      .filter((f: any) => allData[f.key] !== undefined && allData[f.key] !== null)
      .map((f: any) => ({ 
        key: f.key, 
        label: f.label, 
        value: formatValue(allData[f.key]) + (f.unit ? ` ${f.unit}` : '') 
      }))
  )
}

function getProcessGroupedFields(proc: any) {
  const record = proc.record
  if (!record) return []

  let groups = PROCESS_FIELD_GROUPS_DYNAMIC.value[proc.key]
  if (!groups || groups.length === 0) {
    groups = PROCESS_FIELD_GROUPS[proc.key]
  }
  if (!groups) return []

  const allData = { ...record }
  if (record.extraData) {
    try {
      const extra = JSON.parse(record.extraData)
      Object.assign(allData, extra)
    } catch (e) {}
  }

  return groups
    .map((g: any) => ({
      title: g.title,
      fields: (Array.isArray(g.fields) ? g.fields : Object.entries(g.fields).map(([k, l]) => ({ key: k, label: l, unit: '' })))
        .filter((f: any) => allData[f.key] !== undefined && allData[f.key] !== null)
        .map((f: any) => ({
          key: f.key,
          label: f.label,
          value: formatValue(allData[f.key]) + (f.unit ? ` ${f.unit}` : '')
        })),
    }))
    .filter((g: any) => g.fields.length > 0)
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'number') return Number.isInteger(val) ? val.toString() : val.toFixed(3)
  return String(val)
}

function formatTime(iso: string): string {
  const s = formatDateTime(iso, { withSeconds: true })
  return s || '-'
}

function formatTimeShort(iso: string): string {
  const s = formatDateTime(iso)
  if (!s) return '-'
  return `${s.slice(5, 10)} ${s.slice(11)}`
}

function stepTag(proc: { status: string }): any {
  return { saved: 'success', submitted: 'success', not_entered: 'info', voided: 'danger' }[proc.status] || 'info'
}

function stepLabel(proc: { status: string }): string {
  if (proc.status === 'saved') return '\u5df2\u4fdd\u5b58'
  return { submitted: '已入库', draft: '草稿', not_entered: '未开始', voided: '作废' }[proc.status] || '未知'
}

function switchMode(m: 'barcode' | 'batch' | 'pack') {
  mode.value = m
  resetSearch()
}

function toggleFocus(procKey: string) {
  if (cardViewMode.value === 'overview') {
    cardViewMode.value = 'focus'
    focusedProcessKey.value = procKey
  } else if (focusedProcessKey.value === procKey) {
    cardViewMode.value = 'overview'
    focusedProcessKey.value = null
  } else {
    focusedProcessKey.value = procKey
  }
}

function switchToOverview() {
  cardViewMode.value = 'overview'
  focusedProcessKey.value = null
}

function resetSearch() {
  hasSearched.value = false
  result.value = null
  batchResult.value = null
  packResult.value = null
  processes.value = {}
  batchInfo.value = null
  notFound.value = false
  selectedProcess.value = null
}

async function handleTrace() {
  const val = queryValue.value.trim()
  if (!val) return

  tracing.value = true
  notFound.value = false
  hasSearched.value = true

  try {
    if (mode.value === 'barcode') {
      const res = await cellApi.trace(val)
      result.value = res.data
      processes.value = res.data.processes || {}
      batchInfo.value = res.data.batch
    } else if (mode.value === 'batch') {
      const [batchRes, recordsRes] = await Promise.all([
        batchApi.getByNo(val),
        batchApi.getProcessRecords(val),
      ])
      batchResult.value = batchRes
      batchInfo.value = batchRes.data
      processes.value = recordsRes.data || {}
      await loadCellList()
    } else if (mode.value === 'pack') {
      const res = await getPackByBarcode(val)
      packResult.value = res.data
    }
    saveToHistory(mode.value, val)
  } catch (e: any) {
    notFound.value = true
    notFoundMsg.value = e?.response?.status === 404 ? '未找到对应数据' : '查询出错，请重试'
  } finally {
    tracing.value = false
  }
}

async function loadCellList() {
  cellLoading.value = true
  try {
    const val = queryValue.value.trim()
    const res = await cellApi.findByBatch(val, cellPage.value, pageSize.value)
    cellList.value = res.data
    cellTotal.value = res.meta?.total ?? 0
  } finally {
    cellLoading.value = false
  }
}

function handleSizeChange(val: number) {
  pageSize.value = val
  cellPage.value = 1
  loadCellList()
}

async function handlePackCellChange(val: any) {
  if (!val) return
  previewBarcode.value = val.cellBarcode
  previewLoading.value = true
  try {
    const res = await cellApi.trace(val.cellBarcode)
    previewData.value = res.data
  } catch (e) {
    ElMessage.error('获取电芯详情失败')
  } finally {
    previewLoading.value = false
  }
}

function getPreviewProcessList(data: CellTraceResult) {
  const processes = data.processes || {}
  return PROCESS_ORDER.map(p => {
    const record = processes[p.key] || null
    let status = record ? (record.isDraft ? 'draft' : 'submitted') : 'not_entered'
    return { ...p, record, status }
  })
}

// History logic
function saveToHistory(m: string, v: string) {
  const existing = recentSearches.value.findIndex(h => h.value === v)
  if (existing > -1) recentSearches.value.splice(existing, 1)
  recentSearches.value.unshift({ mode: m, value: v })
  if (recentSearches.value.length > 10) recentSearches.value.pop()
  localStorage.setItem('yt_mes_recent_trace', JSON.stringify(recentSearches.value))
}

function clearHistory() {
  recentSearches.value = []
  localStorage.removeItem('yt_mes_recent_trace')
}

function redoSearch(item: { mode: string; value: string }) {
  mode.value = item.mode as any
  queryValue.value = item.value
  handleTrace()
}

function removeHistoryItem(idx: number) {
  recentSearches.value.splice(idx, 1)
  localStorage.setItem('yt_mes_recent_trace', JSON.stringify(recentSearches.value))
}

async function previewCell(cellBarcode: string) {
  previewBarcode.value = cellBarcode
  previewVisible.value = true
  previewLoading.value = true
  try {
    const res = await cellApi.trace(cellBarcode)
    previewData.value = res.data
  } finally {
    previewLoading.value = false
  }
}

function jumpToCellTrace(cellBarcode: string) {
  mode.value = 'barcode'
  queryValue.value = cellBarcode
  handleTrace()
}

/* ============ Lifecycle ============ */

onMounted(() => {
  loadProcessDefinitions()
  const saved = localStorage.getItem('yt_mes_recent_trace')
  if (saved) recentSearches.value = JSON.parse(saved)

  if (route.query.barcode) {
    mode.value = 'barcode'
    queryValue.value = route.query.barcode as string
    handleTrace()
  } else if (route.query.batchNo) {
    mode.value = 'batch'
    queryValue.value = route.query.batchNo as string
    handleTrace()
  }
})
</script>

<style scoped>
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.trace-page {
  min-height: calc(100vh - 84px);
  background: #f9f9fb;
  padding: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== Search Container (Apple Style) ===== */
.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-searched .search-container {
  padding: 20px 40px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.search-box {
  width: 100%;
  max-width: 720px;
  text-align: center;
  transition: all 0.5s;
}

.is-searched .search-box {
  max-width: 1200px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.search-box__title {
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 32px;
  letter-spacing: -0.5px;
}

.search-box__tabs {
  display: inline-flex;
  background: #f2f2f7;
  padding: 3px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.is-searched .search-box__tabs {
  margin-bottom: 0;
}

.search-tab {
  border: none;
  background: transparent;
  padding: 6px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #86868b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.search-tab.active {
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.search-box__input-group {
  display: flex;
  gap: 12px;
  width: 100%;
}

.apple-input :deep(.el-input__wrapper) {
  border-radius: 14px;
  padding-left: 16px;
  background: #fff;
  box-shadow: 0 0 0 1px #d2d2d7 inset;
  height: 54px;
  font-size: 16px;
}

.is-searched .apple-input :deep(.el-input__wrapper) {
  height: 44px;
  border-radius: 10px;
}

.apple-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #0071e3 inset !important;
}

.apple-button {
  height: 54px;
  border-radius: 14px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  background: #0071e3;
  border: none;
}

.is-searched .apple-button {
  height: 44px;
  border-radius: 10px;
}

/* ===== Recent Searches ===== */
.recent-searches {
  margin-top: 24px;
  text-align: left;
}

.recent-searches__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #86868b;
  font-size: 13px;
}

.recent-searches__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recent-tag {
  cursor: pointer;
  transition: all 0.2s;
  border-color: #d2d2d7 !important;
  color: #1d1d1f !important;
}

.recent-tag:hover {
  background: #f2f2f7;
}

/* ===== Results Area ===== */
.results-container {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.kpi-item {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.kpi-item__val {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
}

.kpi-item__val small {
  font-size: 14px;
  font-weight: 400;
  color: #86868b;
  margin-left: 2px;
}

.kpi-item__lab {
  font-size: 13px;
  color: #86868b;
  margin-top: 4px;
}

/* ===== Grade Highlights ===== */
.large-grade {
  font-size: 48px !important;
  line-height: 1;
  margin-bottom: 4px;
}
.grade-A { color: #34c759 !important; }
.grade-B { color: #ff9500 !important; }
.grade-C { color: #ff3b30 !important; }

/* ===== Barcode Passport Layout ===== */
.barcode-passport {
  display: flex;
  flex-direction: column;
  gap: 32px;
  animation: slideUp 0.5s ease-out;
}

.passport-header {
  text-align: center;
  margin-bottom: 8px;
}

.passport-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.passport-meta {
  font-size: 14px;
  color: #86868b;
}

.passport-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===== 进度条 ===== */
.process-progress-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  white-space: nowrap;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: #f0f0f5;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #34c759, #0071e3);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-segments {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
}

.segment-dot {
  flex: 1;
  border-right: 1px solid rgba(255,255,255,0.3);
}
.segment-dot:last-child { border-right: none; }

.progress-percent {
  font-size: 14px;
  font-weight: 700;
  color: #0071e3;
  white-space: nowrap;
}

.view-toggle {
  display: flex;
  background: #f2f2f7;
  padding: 3px;
  border-radius: 10px;
}

.toggle-btn {
  border: none;
  background: transparent;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #86868b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

/* ===== 横向流程卡片 ===== */
.process-cards-flow {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #d2d2d7 transparent;
}

.process-cards-flow::-webkit-scrollbar {
  height: 6px;
}

.process-cards-flow::-webkit-scrollbar-track {
  background: transparent;
}

.process-cards-flow::-webkit-scrollbar-thumb {
  background: #d2d2d7;
  border-radius: 3px;
}

.process-flow-card {
  flex: 0 0 260px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.process-flow-card:hover {
  border-color: #0071e3;
  box-shadow: 0 4px 16px rgba(0,113,227,0.1);
  transform: translateY(-2px);
}

.process-flow-card.expanded {
  flex: 1 1 100%;
  min-width: 100%;
  border-color: #0071e3;
  box-shadow: 0 0 0 1px #0071e3, 0 4px 16px rgba(0,113,227,0.1);
  cursor: default;
}

.process-flow-card.dimmed {
  opacity: 0.5;
  flex: 0 0 200px;
}

.process-flow-card.dimmed:hover {
  opacity: 1;
}

.flow-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.flow-step-num {
  width: 22px;
  height: 22px;
  background: #f2f2f7;
  color: #1d1d1f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.process-flow-card.expanded .flow-step-num {
  background: #0071e3;
  color: #fff;
}

.flow-step-name {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  flex: 1;
}

.flow-card-params-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.flow-param {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-param-label {
  font-size: 10px;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.flow-param-value {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

.flow-param-more {
  font-size: 11px;
  color: #0071e3;
  margin-top: 4px;
}

.flow-card-params-full {
  flex: 1;
}

.flow-param-group-title {
  font-size: 12px;
  font-weight: 600;
  color: #86868b;
  margin-top: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f7;
}
.flow-param-group-title:first-child { margin-top: 0; }

.flow-param-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.flow-card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f5f5f7;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #86868b;
}

/* ===== 原材料折叠 ===== */
.material-trace-header {
  cursor: pointer;
  user-select: none;
}

.collapse-icon {
  transition: transform 0.3s;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

/* ===== Material Trace Card ===== */
.material-trace-card {
  margin-top: 12px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f9f9fb;
  border-radius: 10px;
}

.mat-icon {
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #0071e3;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.mat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mat-info label {
  font-size: 11px;
  color: #86868b;
}

.mat-info span {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.empty-materials {
  padding: 40px;
  text-align: center;
  color: #c7c7cc;
  font-style: italic;
}

.main-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
}

.main-layout.is-pack-mode {
  grid-template-columns: 400px 1fr;
}

.cell-list-container {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

/* ===== Cell Passport Mini (Right Side) ===== */
.cell-passport-mini {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f7;
}

.mini-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
}

.mini-header__grade {
  font-size: 20px;
  font-weight: 800;
}

.mini-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.m-kpi {
  background: #f9f9fb;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
}

.m-kpi label {
  display: block;
  font-size: 11px;
  color: #86868b;
  margin-bottom: 4px;
}

.m-kpi span {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
}

.m-kpi small {
  font-size: 11px;
  margin-left: 2px;
}

.mini-processes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mini-proc-card {
  padding: 12px;
  background: #fff;
  border: 1px solid #f5f5f7;
  border-radius: 8px;
}

.mini-proc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mini-proc-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.mini-proc-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.mini-field {
  display: flex;
  flex-direction: column;
}

.mini-field label {
  font-size: 10px;
  color: #86868b;
}

.mini-field span {
  font-size: 13px;
  color: #1d1d1f;
}

.mini-footer {
  margin-top: 12px;
  text-align: right;
}

.preview-loading-box {
  padding: 40px;
  background: #fff;
  border-radius: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== Process Flow Card Style ===== */
.process-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.process-card {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.process-card:hover {
  transform: translateX(4px);
  border-color: #d2d2d7;
}

.process-card.active {
  border-color: #0071e3;
  box-shadow: 0 0 0 1px #0071e3;
}

.process-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.process-card__index {
  font-size: 12px;
  color: #86868b;
  width: 20px;
}

.process-card__name {
  font-weight: 600;
  color: #1d1d1f;
  flex: 1;
}

.status-icon {
  color: #34c759;
  font-weight: bold;
}

.process-card__meta {
  font-size: 12px;
  color: #86868b;
  margin-left: 32px;
}

.process-card.is-pending {
  background: #f9f9fb;
  opacity: 0.7;
}

.process-card__meta.pending {
  font-style: italic;
  color: #c7c7cc;
}

/* ===== Minimal Card Common ===== */
.minimal-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.pack-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.pack-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pack-item.full-width {
  grid-column: span 2;
}

.pack-item label {
  font-size: 12px;
  color: #86868b;
  text-transform: uppercase;
}

.pack-item span {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.pack-item .highlight {
  color: #0071e3;
}

/* ===== Detail Card ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f7;
}

.card-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.detail-group-title {
  grid-column: span 2;
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
  margin-top: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f7;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-field label {
  font-size: 12px;
  color: #86868b;
}

.detail-field span {
  font-size: 15px;
  font-weight: 500;
  color: #1d1d1f;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #c7c7cc;
}

.empty-detail p {
  margin-top: 16px;
  font-size: 14px;
}

.barcode-font {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
}

.table-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ===== Preview Drawer ===== */
.p-kpi {
  text-align: center;
  padding: 20px;
  background: #f5f5f7;
  border-radius: 12px;
}

.p-kpi__val {
  font-size: 24px;
  font-weight: 700;
}

.p-kpi__lab {
  font-size: 12px;
  color: #86868b;
}

.tl-desc {
  font-size: 12px;
  color: #86868b;
}

@media (max-width: 1100px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
