<template>
  <div class="quality-manage">
    <el-card>
      <template #header>
        <span style="font-size: 18px; font-weight: 600">质检管理</span>
      </template>

      <el-tabs v-model="activeTab">
        <!-- Tab 1: 待质检工序 -->
        <el-tab-pane label="待质检工序" name="pending">
          <div style="margin-bottom: 16px; display: flex; gap: 12px">
            <el-input v-model="pendingQuery.batchNo" placeholder="批次号" clearable style="width: 200px" />
            <el-button type="primary" @click="loadPending">查询</el-button>
            <el-button @click="resetPendingQuery">重置</el-button>
          </div>
          <el-table :data="pendingItems" v-loading="pendingLoading" stripe border>
            <el-table-column prop="batchNo" label="批次号" width="160" />
            <el-table-column prop="processName" label="工序" width="100" />
            <el-table-column prop="operatorName" label="操作员" width="120" />
            <el-table-column label="提交时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.submittedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button v-if="authPerms.isQualityStaff.value" type="primary" size="small" @click="openInspect(row)">
                  检验
                </el-button>
                <span v-else style="color: #999">—</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!pendingLoading && pendingItems.length === 0" description="暂无待质检工序" />
        </el-tab-pane>

        <!-- Tab 2: 全部检验记录 -->
        <el-tab-pane label="全部检验记录" name="all">
          <!-- 筛选栏 -->
          <el-form :model="filter" inline size="default" style="margin-bottom: 16px">
            <el-form-item label="批次号">
              <el-input v-model="filter.batchNo" placeholder="批次号" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item label="工序">
              <el-select v-model="filter.processType" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="p in processOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="检验结果">
              <el-select v-model="filter.inspectionResult" placeholder="全部" clearable style="width: 120px">
                <el-option label="合格" :value="1" />
                <el-option label="不合格" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="检验员">
              <el-input v-model="filter.inspectorName" placeholder="检验员" clearable style="width: 140px" />
            </el-form-item>
            <el-form-item label="日期">
              <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAll">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 表格 -->
          <el-table :data="allItems" v-loading="allLoading" stripe border>
            <el-table-column prop="batchNo" label="批次号" width="160" />
            <el-table-column label="工序" width="90">
              <template #default="{ row }">{{ processLabel(row.processType) }}</template>
            </el-table-column>
            <el-table-column label="检验结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.inspectionResult === 1 ? 'success' : 'danger'" size="small">
                  {{ row.inspectionResult === 1 ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defectQty" label="缺陷数量" width="90" align="center" />
            <el-table-column prop="defectReason" label="缺陷原因" min-width="150" show-overflow-tooltip />
            <el-table-column prop="inspectorName" label="检验员" width="100" />
            <el-table-column label="异常记录" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.abnormalRecord || '—' }}</template>
            </el-table-column>
            <el-table-column label="检验时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewDetail(row)">详情</el-button>
                <el-button v-if="authPerms.isQualityStaff.value" size="small" @click="editRecord(row)">编辑</el-button>
                <el-popconfirm v-if="authPerms.isAdmin.value" title="确定删除此质检记录？" @confirm="handleDelete(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div style="margin-top: 16px; display: flex; justify-content: flex-end">
            <el-pagination
              v-model:current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="loadAll"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 检验 / 编辑 对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="批次号">
          <el-input v-model="form.batchNo" disabled />
        </el-form-item>
        <el-form-item label="工序" prop="processType">
          <el-select v-model="form.processType" placeholder="选择工序" style="width: 100%" :disabled="!!editingId">
            <el-option v-for="p in processOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验结果" prop="inspectionResult">
          <el-radio-group v-model="form.inspectionResult">
            <el-radio :value="1">合格</el-radio>
            <el-radio :value="2">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.inspectionResult === 2" label="缺陷数量" prop="defectQty">
          <el-input-number v-model="form.defectQty" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="form.inspectionResult === 2" label="缺陷原因" prop="defectReason">
          <el-input v-model="form.defectReason" type="textarea" :rows="2" maxlength="512" />
        </el-form-item>
        <el-form-item label="检验员" prop="inspectorName">
          <el-select v-model="form.inspectorName" placeholder="选择检验员" style="width: 100%">
            <el-option v-for="p in qualityPersonnel" :key="p.id" :label="p.realName" :value="p.realName" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常记录">
          <el-input v-model="form.abnormalRecord" type="textarea" :rows="3" maxlength="512" placeholder="设备故障、参数偏差等异常情况及处理措施" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitForm">{{ editingId ? '保存' : '提交检验' }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="质检详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="批次号">{{ detailItem.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="工序">{{ processLabel(detailItem.processType) }}</el-descriptions-item>
        <el-descriptions-item label="检验结果">
          <el-tag :type="detailItem.inspectionResult === 1 ? 'success' : 'danger'" size="small">
            {{ detailItem.inspectionResult === 1 ? '合格' : '不合格' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="缺陷数量">{{ detailItem.defectQty ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="缺陷原因">{{ detailItem.defectReason || '—' }}</el-descriptions-item>
        <el-descriptions-item label="检验员">{{ detailItem.inspectorName }}</el-descriptions-item>
        <el-descriptions-item label="异常记录">{{ detailItem.abnormalRecord || '—' }}</el-descriptions-item>
        <el-descriptions-item label="检验时间">{{ formatDateTime(detailItem.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { qualityApi } from '@/api/quality'
import { formatDateTime } from '@/composables/datetime'
import { masterDataApi } from '@/api/master-data'
import { useAuthPermissions } from '@/stores/auth'

const authPerms = useAuthPermissions()

// 工序选项
const processOptions = [
  { label: '配料', value: 'batching' }, { label: '涂布', value: 'coating' },
  { label: '辊压', value: 'roller-pressing' }, { label: '分切', value: 'slitting' },
  { label: '制片', value: 'electrode' }, { label: '卷绕', value: 'winding' },
  { label: '装配', value: 'assembly' }, { label: '烘烤', value: 'baking' },
  { label: '注液', value: 'injection' }, { label: '顶封', value: 'wrapping' },
  { label: '化成', value: 'formation' }, { label: '分容', value: 'grading' }, { label: '分选', value: 'sorting' },
]

const processLabel = (key: string) => processOptions.find(p => p.value === key)?.label || key

const activeTab = ref('pending')

// ---- Tab: 待质检 ----
const pendingQuery = reactive({ batchNo: '' })
const pendingItems = ref<any[]>([])
const pendingLoading = ref(false)

function resetPendingQuery() {
  pendingQuery.batchNo = ''
  loadPending()
}

async function loadPending() {
  pendingLoading.value = true
  try {
    const res = await qualityApi.getPending(pendingQuery.batchNo || undefined)
    pendingItems.value = res.data || []
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载待质检工序失败')
  } finally {
    pendingLoading.value = false
  }
}

// ---- Tab: 全部记录 ----
const filter = reactive({ batchNo: '', processType: '', inspectionResult: undefined as number | undefined, inspectorName: '' })
const dateRange = ref<[string, string] | null>(null)
const allItems = ref<any[]>([])
const allLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

function resetFilter() {
  filter.batchNo = ''
  filter.processType = ''
  filter.inspectionResult = undefined
  filter.inspectorName = ''
  dateRange.value = null
  page.value = 1
  loadAll()
}

async function loadAll() {
  allLoading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (filter.batchNo) params.batchNo = filter.batchNo
    if (filter.processType) params.processType = filter.processType
    if (filter.inspectionResult) params.inspectionResult = filter.inspectionResult
    if (filter.inspectorName) params.inspectorName = filter.inspectorName
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await qualityApi.listAll(params)
    allItems.value = res.data.items || []
    total.value = res.data.total || 0
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载质检记录失败')
  } finally {
    allLoading.value = false
  }
}

// ---- 检验员列表 ----
const qualityPersonnel = ref<any[]>([])
async function loadQualityPersonnel() {
  try {
    const res = await masterDataApi.qualityPersonnel()
    qualityPersonnel.value = res.data || []
  } catch {
    qualityPersonnel.value = []
  }
}

// ---- 检验/编辑对话框 ----
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<any>(null)
const form = reactive({
  batchNo: '',
  processType: '',
  inspectionResult: 1,
  defectQty: undefined as number | undefined,
  defectReason: '',
  inspectorName: '',
  abnormalRecord: '',
})

const rules = {
  processType: [{ required: true, message: '请选择工序', trigger: 'change' }],
  inspectionResult: [{ required: true, message: '请选择检验结果', trigger: 'change' }],
  inspectorName: [{ required: true, message: '请选择检验员', trigger: 'change' }],
  defectQty: [{ required: true, message: '请填写缺陷数量', trigger: 'blur' }],
  defectReason: [{ required: true, message: '请填写缺陷原因', trigger: 'blur' }],
}

function openInspect(row: any) {
  editingId.value = null
  dialogTitle.value = '质检检验'
  form.batchNo = row.batchNo
  form.processType = row.processType
  form.inspectionResult = 1
  form.defectQty = undefined
  form.defectReason = ''
  form.inspectorName = ''
  form.abnormalRecord = ''
  dialogVisible.value = true
}

function editRecord(row: any) {
  editingId.value = row.id
  dialogTitle.value = '编辑质检记录'
  form.batchNo = row.batchNo
  form.processType = row.processType
  form.inspectionResult = row.inspectionResult
  form.defectQty = row.defectQty ?? undefined
  form.defectReason = row.defectReason || ''
  form.inspectorName = row.inspectorName
  form.abnormalRecord = row.abnormalRecord || ''
  dialogVisible.value = true
}

// ---- 详情对话框 ----
const detailVisible = ref(false)
const detailItem = ref<any>({})

function viewDetail(row: any) {
  detailItem.value = row
  detailVisible.value = true
}

// ---- 提交表单 ----
async function handleSubmitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = {
      processType: form.processType,
      inspectionResult: form.inspectionResult,
      defectQty: form.inspectionResult === 2 ? form.defectQty : undefined,
      defectReason: form.inspectionResult === 2 ? form.defectReason : undefined,
      inspectorName: form.inspectorName,
      abnormalRecord: form.abnormalRecord || undefined,
    }

    if (editingId.value) {
      await qualityApi.update(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await qualityApi.inspect(form.batchNo, payload)
      ElMessage.success('质检成功')
    }
    dialogVisible.value = false
    loadPending()
    loadAll()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// ---- 删除 ----
async function handleDelete(id: number) {
  try {
    await qualityApi.remove(id)
    ElMessage.success('删除成功')
    loadAll()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

// ---- 初始化 ----
onMounted(() => {
  loadQualityPersonnel()
  loadPending()
  loadAll()
})
</script>

<style scoped>
.quality-manage {
  padding: 0;
}
</style>
