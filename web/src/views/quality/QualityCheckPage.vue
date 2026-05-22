<template>
  <div class="quality-check-page">
    <el-card class="header-card">
      <div class="page-header">
        <h3>质量检验 - {{ batchNo }}</h3>
        <el-space>
          <el-button v-if="!props.batchNo" @click="$router.push(`/batches/${batchNo}`)">返回批次</el-button>
          <el-button type="primary" class="create-btn" @click="dialogVisible = true">创建检验</el-button>
        </el-space>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table :data="checks" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="processType" label="工序" width="100">
          <template #default="{ row }">
            {{ processTypeMap[row.processType] || row.processType }}
          </template>
        </el-table-column>
        <el-table-column prop="inspectionResult" label="检验结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.inspectionResult === 1 ? 'success' : 'danger'" size="small">
              {{ row.inspectionResult === 1 ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defectQty" label="缺陷数量" width="120" />
        <el-table-column prop="defectReason" label="缺陷原因" min-width="160" />
        <el-table-column prop="inspectorName" label="检验员" width="120" />
        <el-table-column prop="abnormalRecord" label="异常记录" min-width="200" />
        <el-table-column prop="createdAt" label="检验时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建检验记录" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" @submit.prevent>
        <el-form-item label="工序" prop="processType">
          <el-select v-model="form.processType" placeholder="请选择工序" style="width: 100%">
            <el-option v-for="(label, key) in processTypeMap" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验结果" prop="inspectionResult">
          <el-radio-group v-model="form.inspectionResult">
            <el-radio :value="1">合格</el-radio>
            <el-radio :value="2">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="缺陷数量" prop="defectQty" v-if="form.inspectionResult === 2">
          <el-input-number v-model="form.defectQty" :min="1" :max="99999" />
        </el-form-item>
        <el-form-item label="缺陷原因" prop="defectReason" v-if="form.inspectionResult === 2">
          <el-input v-model="form.defectReason" type="textarea" :rows="2" placeholder="请输入缺陷原因" />
        </el-form-item>
        <el-form-item label="检验员" prop="inspectorName">
          <el-input v-model="form.inspectorName" placeholder="请输入检验员姓名" />
        </el-form-item>
        <el-form-item label="异常记录" prop="abnormalRecord">
          <el-input v-model="form.abnormalRecord" type="textarea" :rows="2" placeholder="请输入异常记录（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="submit-btn" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { qualityApi } from '@/api/quality'
import type { FormInstance } from 'element-plus'

defineOptions({ name: 'QualityCheckPage' })

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const route = useRoute()
const batchNo = computed(() => props.batchNo || (route.params.batchNo as string))

const checks = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const processTypeMap: Record<string, string> = {
  batching: '配料',
  coating: '涂布',
  'roller-pressing': '辊压',
  slitting: '分切',
  electrode: '制片',
  winding: '卷绕',
  assembly: '装配',
  baking: '烘烤',
  injection: '注液',
  wrapping: '顶封',
  formation: '化成',
  grading: '分容',
  sorting: '分选',
}

const form = reactive({
  processType: null as string | null,
  inspectionResult: null as number | null,
  defectQty: null as number | null,
  defectReason: '',
  inspectorName: '',
  abnormalRecord: '',
})

const rules = {
  processType: [{ required: true, message: '请选择工序', trigger: 'change' }],
  inspectionResult: [{ required: true, message: '请选择检验结果', trigger: 'change' }],
  inspectorName: [{ required: true, message: '请输入检验员姓名', trigger: 'blur' }],
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadChecks() {
  loading.value = true
  try {
    const res = await qualityApi.list(batchNo.value)
    checks.value = res.data ?? []
  } catch {
    checks.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.processType = null
  form.inspectionResult = null
  form.defectQty = null
  form.defectReason = ''
  form.inspectorName = ''
  form.abnormalRecord = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload: Record<string, any> = {
      processType: form.processType,
      inspectionResult: form.inspectionResult,
      inspectorName: form.inspectorName.trim(),
      abnormalRecord: form.abnormalRecord.trim() || undefined,
    }
    if (form.inspectionResult === 2) {
      payload.defectQty = form.defectQty
      payload.defectReason = form.defectReason.trim()
    }
    await qualityApi.create(batchNo.value, payload)
    dialogVisible.value = false
    resetForm()
    await loadChecks()
  } catch {
    // Error handled by axios interceptor
  } finally {
    submitting.value = false
  }
}

onMounted(loadChecks)

defineExpose({ form, formRef, handleSubmit })
</script>

<style scoped>
.header-card { margin-bottom: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h3 { margin: 0; font-size: 18px; }
.table-card { margin-bottom: 20px; }
</style>
