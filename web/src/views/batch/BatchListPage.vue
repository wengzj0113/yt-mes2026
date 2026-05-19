<template>
  <div class="batch-list">
    <el-card>
      <div class="page-header">
        <h3>批次管理</h3>
        <el-button type="primary" @click="openCreate">新建批次</el-button>
      </div>
      <div class="search-bar">
        <el-input v-model="keyword" placeholder="批次号/产品型号" style="width: 260px" clearable @clear="search" />
        <el-button type="primary" @click="search" style="margin-left: 12px">查询</el-button>
        <span style="margin-left: 16px;">
          <el-switch v-model="showClosed" @change="search" style="--el-switch-on-color: #e6a23c" />
          <span style="margin-left: 6px; color: #909399; font-size: 13px;">显示已关闭</span>
        </span>
      </div>
      <el-table :data="list" v-loading="loading" stripe @row-click="goDetail">
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="productModel" label="产品型号" width="120" />
        <el-table-column prop="productSpec" label="产品规格" width="120" />
        <el-table-column prop="plannedQty" label="计划数量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" @click.stop="goDetail(row)">详情</el-button>
            <el-button size="small" @click.stop="openEdit(row)">编辑</el-button>
            <el-popconfirm
              title="确认关闭该批次？关闭后不再显示在列表中。"
              @confirm.stop="handleClose(row)"
              v-if="row.status !== 4"
            >
              <template #reference>
                <el-button size="small" type="warning" @click.stop>关闭批次</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑批次' : '新建批次'" width="550px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" @submit.prevent>
        <el-form-item label="批次号" prop="batchNo">
          <div class="batch-no-row">
            <el-input v-model="form.batchNo" :disabled="isEdit" />
            <el-button v-if="!isEdit" :loading="generatingBatchNo" @click="handleGenerateBatchNo">生成批次号</el-button>
          </div>
        </el-form-item>
        <el-form-item label="产品型号" prop="productModel">
          <el-input v-model="form.productModel" />
        </el-form-item>
        <el-form-item label="产品规格" prop="productSpec">
          <el-input v-model="form.productSpec" />
        </el-form-item>
        <el-form-item label="生产车间" prop="workshop">
          <el-select v-model="form.workshop" placeholder="请选择生产车间" style="width: 100%">
            <el-option
              v-for="option in workshopOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产班组" prop="shift">
          <el-select v-model="form.shift" style="width: 100%">
            <el-option
              v-for="option in shiftOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" prop="plannedQty">
          <el-input-number v-model="form.plannedQty" :min="1" />
        </el-form-item>
        <el-form-item label="开工日期" prop="actualStartDate">
          <el-date-picker v-model="form.actualStartDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { batchApi } from '@/api/batch'
import { masterDataApi } from '@/api/master-data'
import type { BatchDto } from '@/types/api'

const router = useRouter()
const list = ref<BatchDto[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const showClosed = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editingBatchNo = ref('')
const saving = ref(false)
const generatingBatchNo = ref(false)
const workshopOptions = ref<Array<{ label: string; value: string }>>([])
const formRef = ref()

const form = reactive({
  batchNo: '',
  productModel: '',
  productSpec: '',
  workshop: '',
  shift: '',
  plannedQty: 1,
  actualStartDate: '',
})
const rules = {
  batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  productModel: [{ required: true, message: '请输入产品型号', trigger: 'blur' }],
  workshop: [{ required: true, message: '请选择生产车间', trigger: 'change' }],
  shift: [{ required: true, message: '请选择班次', trigger: 'change' }],
  actualStartDate: [{ required: true, message: '请选择开工日期', trigger: 'change' }],
}

const shiftOptions = computed(() => [
  { label: '白班一组', value: '白班一组' },
  { label: '中班一组', value: '中班一组' },
  { label: '夜班一组', value: '夜班一组' },
])

const statusLabel = (s: number) => ({ 1: '草稿', 2: '进行中', 3: '已完成', 4: '已关闭' }[s] || '未知')
const statusType = (s: number) => ({ 1: 'info', 2: 'primary', 3: 'success', 4: 'warning' }[s] as any || 'info')

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    if (!showClosed.value) params.excludeStatus = 4
    const res = await batchApi.list(params)
    list.value = res.data.items
    total.value = res.data.meta?.total ?? 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadMasterData() {
  try {
    const res = await masterDataApi.departments()
    workshopOptions.value = (res.data ?? []).map((item) => ({
      label: item.name,
      value: item.name,
    }))
  } catch {
    workshopOptions.value = []
  }
}

function search() { page.value = 1; loadData() }

function resetForm() {
  form.batchNo = ''
  form.productModel = ''
  form.productSpec = ''
  form.workshop = ''
  form.shift = ''
  form.plannedQty = 1
  form.actualStartDate = ''
}

function openCreate() {
  isEdit.value = false
  editingBatchNo.value = ''
  resetForm()
  showDialog.value = true
}

function openEdit(row: BatchDto) {
  isEdit.value = true
  editingBatchNo.value = row.batchNo
  form.batchNo = row.batchNo
  form.productModel = row.productModel
  form.productSpec = row.productSpec || ''
  form.workshop = ''
  form.shift = ''
  form.plannedQty = row.plannedQty
  form.actualStartDate = ''
  showDialog.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = {
      batchNo: form.batchNo.trim(),
      productModel: form.productModel.trim(),
      productSpec: form.productSpec.trim() || undefined,
      workshop: form.workshop.trim(),
      shift: form.shift.trim(),
      plannedQty: form.plannedQty,
      actualStartDate: form.actualStartDate,
    }
    if (isEdit.value) {
      await batchApi.update(editingBatchNo.value, payload)
      ElMessage.success('批次更新成功')
    } else {
      await batchApi.create(payload)
      ElMessage.success('批次创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    // Error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function handleClose(row: BatchDto) {
  try {
    await batchApi.update(row.batchNo, { status: 4 })
    ElMessage.success('批次已关闭')
    loadData()
  } catch {
    // Error handled by interceptor
  }
}

async function handleGenerateBatchNo() {
  generatingBatchNo.value = true
  try {
    const res = await batchApi.generateNo()
    form.batchNo = res.data.batchNo
  } finally {
    generatingBatchNo.value = false
  }
}

function goDetail(row: BatchDto) {
  router.push(`/batches/${row.batchNo}`)
}

onMounted(() => {
  loadData()
  loadMasterData()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.search-bar { margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.el-table { cursor: pointer; }
.batch-no-row { display: flex; gap: 8px; width: 100%; }
.batch-no-row .el-input { flex: 1; }
</style>
