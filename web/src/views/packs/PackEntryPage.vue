<template>
  <div class="pack-entry">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>Pack 录入</span>
          <el-button type="primary" @click="handleSubmit" :loading="loading">提交录入</el-button>
        </div>
      </template>

      <el-form :model="form" label-width="120px" ref="formRef">
        <el-form-item label="批次号">
          <el-input 
            v-model="form.batchNo" 
            placeholder="请扫描或输入批次号" 
            @keyup.enter="focusNext('pack')"
            ref="batchInput"
            class="industrial-input"
          />
        </el-form-item>

        <el-form-item label="Pack 条码" required>
          <el-input 
            v-model="form.packBarcode" 
            placeholder="请扫描 Pack 条码" 
            @keyup.enter="focusNext('board')"
            ref="packInput"
            class="industrial-input"
          />
        </el-form-item>

        <el-form-item label="保护板条码">
          <el-input 
            v-model="form.protectionBoardBarcode" 
            placeholder="请扫描保护板条码" 
            @keyup.enter="focusNext('cell-0')"
            ref="boardInput"
            class="industrial-input"
          />
        </el-form-item>

        <el-divider content-position="left">电芯条码列表 ({{ form.cellBarcodes.length }})</el-divider>

        <div v-for="(barcode, index) in form.cellBarcodes" :key="index" class="cell-item">
          <el-form-item :label="`电芯 ${index + 1}`">
            <div class="cell-input-group">
              <el-input 
                v-model="form.cellBarcodes[index]" 
                placeholder="请扫描电芯条码" 
                @keyup.enter="handleCellEnter(index)"
                :ref="(el: any) => setCellRef(el, index)"
              />
              <el-button 
                type="danger" 
                :icon="Delete" 
                circle 
                @click="removeCell(index)"
                :disabled="form.cellBarcodes.length === 1"
              />
            </div>
          </el-form-item>
        </div>

        <el-form-item>
          <el-button type="success" :icon="Plus" @click="addCell">添加电芯</el-button>
          <el-button @click="resetForm">重置表单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="recent-card">
      <template #header>
        <div class="card-header">
          <span>录入历史回顾 (最新 100 条)</span>
          <el-button link type="primary" @click="fetchPackList">刷新</el-button>
        </div>
      </template>
      <el-table :data="packList" size="small" v-loading="listLoading" stripe>
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="batchNo" label="批次号" width="120" />
        <el-table-column prop="packBarcode" label="Pack 条码" min-width="150">
          <template #default="{ row }">
            <span class="barcode-text">{{ row.packBarcode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="protectionBoardBarcode" label="保护板条码" min-width="150">
          <template #default="{ row }">
            <span class="barcode-text">{{ row.protectionBoardBarcode || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="电芯数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.cells?.length || 0 }} PCS</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作员" width="120" />
        <el-table-column prop="createdAt" label="录入时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row.packBarcode)">追溯</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="displayTotal"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { createOrUpdatePack, getPackList, type Pack } from '@/api/pack'
import { formatDateTime } from '@/composables/datetime'

const router = useRouter()
const loading = ref(false)
const listLoading = ref(false)
const formRef = ref()
const batchInput = ref()
const packInput = ref()
const boardInput = ref()
const cellRefs = ref<any[]>([])

const form = reactive({
  batchNo: '',
  packBarcode: '',
  protectionBoardBarcode: '',
  cellBarcodes: ['']
})

// List & Pagination State
const packList = ref<Pack[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const displayTotal = computed(() => Math.min(total.value, 100))

onMounted(() => {
  batchInput.value?.focus()
  fetchPackList()
})

const fetchPackList = async () => {
  try {
    listLoading.value = true
    const res = await getPackList(currentPage.value, pageSize.value)
    if (res.success) {
      packList.value = res.data.items
      total.value = res.data.total
    }
  } catch (err) {
    console.error('获取列表失败:', err)
  } finally {
    listLoading.value = false
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchPackList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchPackList()
}

const viewDetail = (barcode: string) => {
  router.push({
    path: '/trace',
    query: { mode: 'pack', packBarcode: barcode }
  })
}

const setCellRef = (el: any, index: number) => {
  if (el) {
    cellRefs.value[index] = el
  }
}

const addCell = () => {
  form.cellBarcodes.push('')
  nextTick(() => {
    const lastIndex = form.cellBarcodes.length - 1
    cellRefs.value[lastIndex]?.focus()
  })
}

const removeCell = (index: number) => {
  form.cellBarcodes.splice(index, 1)
}

const handleCellEnter = (index: number) => {
  if (index === form.cellBarcodes.length - 1) {
    if (form.cellBarcodes[index].trim()) {
      addCell()
    } else {
      handleSubmit()
    }
  } else {
    cellRefs.value[index + 1]?.focus()
  }
}

const focusNext = (target: string) => {
  if (target === 'pack') {
    packInput.value?.focus()
  } else if (target === 'board') {
    boardInput.value?.focus()
  } else if (target === 'cell-0') {
    cellRefs.value[0]?.focus()
  }
}

const resetForm = () => {
  form.batchNo = ''
  form.packBarcode = ''
  form.protectionBoardBarcode = ''
  form.cellBarcodes = ['']
  nextTick(() => {
    batchInput.value?.focus()
  })
}

const handleSubmit = async () => {
  if (!form.packBarcode.trim()) {
    ElMessage.warning('请输入 Pack 条码')
    packInput.value?.focus()
    return
  }

  const validCells = form.cellBarcodes.filter(b => b.trim() !== '')
  if (validCells.length === 0) {
    ElMessage.warning('请至少录入一个电芯条码')
    cellRefs.value[0]?.focus()
    return
  }

  try {
    loading.value = true
    const res = await createOrUpdatePack({
      packBarcode: form.packBarcode.trim(),
      batchNo: form.batchNo.trim(),
      protectionBoardBarcode: form.protectionBoardBarcode.trim(),
      cellBarcodes: validCells
    })

    if (res.success) {
      ElMessage.success('录入成功')
      fetchPackList()
      resetForm()
    }
  } catch (err) {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pack-entry {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 18px;
  color: #1a237e;
}

.barcode-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: #1a237e;
}

.industrial-input :deep(.el-input__wrapper) {
  background-color: #f8f9fb;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.2s;
}

.industrial-input :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #1a237e inset !important;
}

.industrial-input :deep(.el-input__inner) {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: #1a237e;
}

.cell-item {
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.cell-input-group {
  display: flex;
  gap: 12px;
  width: 100%;
}

.recent-card {
  margin-top: 30px;
  border-radius: 12px;
}

.recent-card :deep(.el-card__header) {
  background-color: #fafbfc;
  font-weight: 600;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #909399;
  background-color: #fff;
}
</style>
