<template>
  <div class="process-hub">
    <!-- Search Bar -->
    <el-card class="search-card">
      <el-input
        v-model="searchBatchNo"
        placeholder="请扫码或输入批次号，回车查询"
        @keyup.enter="handleSearch"
        ref="searchInputRef"
        size="large"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </el-card>

    <!-- Batch Info & Grid -->
    <template v-if="batchInfo">
      <el-card class="info-card" style="margin-top: 20px;">
        <div class="batch-header">
          <h2>批次: {{ batchInfo.batchNo }}</h2>
          <el-tag type="success">已锁定</el-tag>
        </div>
        <p>产品型号: {{ batchInfo.productModel }} | 计划数量: {{ batchInfo.plannedQty }}</p>
      </el-card>

      <div class="process-grid" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
        <el-card 
          v-for="proc in activeProcesses" 
          :key="proc.processCode"
          class="process-card"
          :class="getProcessStatus(proc.processCode)"
          @click="openProcessDrawer(proc)"
          shadow="hover"
          style="cursor: pointer;"
        >
          <h3>{{ proc.processName }}</h3>
          <p>{{ getProcessStatusText(proc.processCode) }}</p>
        </el-card>
      </div>
    </template>

    <!-- Drawer -->
    <el-drawer 
      v-model="drawerVisible" 
      :title="`${currentProcess?.processName} - 数据录入`" 
      size="600px" 
      destroy-on-close
      @closed="handleDrawerClose"
    >
      <component :is="currentComponent" :batchNo="batchInfo?.batchNo" @close="drawerVisible = false" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, shallowRef } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { batchApi } from '@/api/batch';
import { processDictionaryApi, type ProcessDictionaryDto } from '@/api/process-dictionary';

// Import all process components
import BatchingPage from './BatchingPage.vue';
import CoatingPage from './CoatingPage.vue';
import RollerPressingPage from './RollerPressingPage.vue';
import SlittingPage from './SlittingPage.vue';
import ElectrodePage from './ElectrodePage.vue';
import WindingPage from './WindingPage.vue';
import AssemblyPage from './AssemblyPage.vue';
import BakingPage from './BakingPage.vue';
import InjectionPage from './InjectionPage.vue';
import WrappingPage from './WrappingPage.vue';
import FormationPage from './FormationPage.vue';
import GradingPage from './GradingPage.vue';
import Ocv1Page from './Ocv1Page.vue';
import Ocv2Page from './Ocv2Page.vue';
import SortingPage from './SortingPage.vue';
import CasingPage from './CasingPage.vue';
import IntegratedMachinePage from './IntegratedMachinePage.vue';
import LaserWeldingPage from './LaserWeldingPage.vue';
import DynamicProcessPage from './DynamicProcessPage.vue';
import FormationGradingPage from './FormationGradingPage.vue';

const processComponents: Record<string, any> = {
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
};

const searchInputRef = ref<any>(null);
const searchBatchNo = ref('');
const batchInfo = ref<any>(null);
const processStatuses = ref<any[]>([]);
const activeProcesses = ref<ProcessDictionaryDto[]>([]);

const drawerVisible = ref(false);
const currentProcess = ref<any>(null);
const currentComponent = shallowRef<any>(null);

onMounted(async () => {
  await loadActiveProcesses();
  nextTick(() => {
    searchInputRef.value?.focus();
  });
});

async function loadActiveProcesses() {
  try {
    const res = await processDictionaryApi.list({ isActive: true, pageSize: 100 });
    activeProcesses.value = res.data?.items || [];
  } catch (err) {
    console.error(err);
  }
}

async function handleSearch() {
  const batchNo = searchBatchNo.value.trim();
  if (!batchNo) return;

  try {
    const res = await batchApi.getByNo(batchNo);
    if (!res || !res.data) {
      ElMessage.error('未找到该批次');
      searchBatchNo.value = '';
      searchInputRef.value?.focus();
      batchInfo.value = null;
      return;
    }
    batchInfo.value = res.data;
    await loadProcessStatuses(batchNo);
  } catch (err) {
    ElMessage.error('未找到该批次');
    searchBatchNo.value = '';
    searchInputRef.value?.focus();
    batchInfo.value = null;
  }
}

async function loadProcessStatuses(batchNo: string) {
  try {
    const res = await batchApi.getProcessStatus(batchNo);
    processStatuses.value = res?.data || [];
  } catch (err) {
    console.error(err);
  }
}

function getProcessStatusObj(key: string) {
  return processStatuses.value.find(s => s.processKey === key)?.status || 'not_entered';
}

function getProcessStatus(key: string) {
  const status = getProcessStatusObj(key);
  if (status === 'saved' || status === 'pending_quality' || status === 'quality_passed') {
    return 'status-submitted';
  }
  if (status === 'quality_failed') {
    return 'status-failed';
  }
  return `status-${status}`;
}

function getProcessStatusText(key: string) {
  const status = getProcessStatusObj(key);
  const map: Record<string, string> = {
    not_entered: '待录入',
    saved: '已保存',
    draft: '已保存',
    pending_quality: '待质检',
    quality_passed: '已完成',
    quality_failed: '质检不合格',
    voided: '已作废'
  };
  return map[status] || '待录入';
}

function openProcessDrawer(proc: ProcessDictionaryDto) {
  currentProcess.value = proc;
  currentComponent.value = processComponents[proc.processCode];
  if (!currentComponent.value) {
    ElMessage.warning('该工序暂未实装录入界面');
    return;
  }
  drawerVisible.value = true;
}

async function handleDrawerClose() {
  drawerVisible.value = false;
  if (batchInfo.value) {
    await loadProcessStatuses(batchInfo.value.batchNo);
  }
}
</script>

<style scoped>
.process-hub { padding: 20px; }
.batch-header { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
.batch-header h2 { margin: 0; }
.process-card { transition: all 0.3s; }
.process-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.status-not_entered { background-color: #f5f7fa; color: #909399; }
.status-draft { background-color: #ecf5ff; border-left: 4px solid #409eff; color: #409eff; }
.status-submitted { background-color: #f0f9eb; border-left: 4px solid #67c23a; color: #67c23a; }
.status-failed { background-color: #fef0f0; border-left: 4px solid #f56c6c; color: #f56c6c; }
.status-voided { background-color: #fef0f0; border-left: 4px solid #f56c6c; color: #f56c6c; text-decoration: line-through; }
</style>
