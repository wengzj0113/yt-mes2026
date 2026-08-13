<template>
  <div class="process-page ocv-test-page">
    <el-card v-loading="saving">
      <div class="page-header">
        <div>
          <h3>{{ processName }}</h3>
          <p class="page-subtitle">按电芯码录入测试结果，保存后可继续录入下一只电芯</p>
        </div>
        <el-button @click="goBack">返回批次</el-button>
      </div>

      <div class="batch-info">
        <span class="batch-label">批次号：</span>
        <span class="batch-value">{{ batchNo || '未提供' }}</span>
      </div>

      <el-alert
        title="测试时间为设备实际测试时间；缺失或格式错误的数据不会提交。"
        type="info"
        :closable="false"
        show-icon
      />

      <el-divider content-position="left">测试数据</el-divider>
      <el-form :model="form" label-width="120px" class="ocv-form" @submit.prevent>
        <el-form-item label="电芯码" required>
          <el-input v-model="form.barcode" placeholder="请输入或扫描电芯码" autofocus clearable />
        </el-form-item>

        <el-form-item label="OCV电压" required>
          <el-input-number
            v-model="form.voltage"
            :min="0"
            :max="10"
            :precision="4"
            :step="0.0001"
            controls-position="right"
            placeholder="请输入电压"
          />
          <span class="unit-suffix">V</span>
        </el-form-item>

        <el-form-item label="内阻" required>
          <el-input-number
            v-model="form.internalResistance"
            :min="0"
            :max="100000"
            :precision="2"
            :step="0.01"
            controls-position="right"
            placeholder="请输入内阻"
          />
          <span class="unit-suffix">mΩ</span>
        </el-form-item>

        <el-form-item v-if="mode === 'ocv2'" label="K值" required>
          <el-input-number
            v-model="form.kValue"
            :precision="4"
            :step="0.0001"
            controls-position="right"
            placeholder="请输入K值"
          />
          <span class="unit-suffix">mV/h</span>
        </el-form-item>

        <el-form-item label="设备编号">
          <el-input v-model="form.equipmentCode" placeholder="可选，设备未提供时留空" clearable />
        </el-form-item>

        <el-form-item label="测试时间" required>
          <el-date-picker
            v-model="form.testTime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            placeholder="选择设备测试时间"
            style="width: 260px"
          />
        </el-form-item>

        <el-form-item>
          <el-button class="ocv-submit" type="primary" :loading="saving" :disabled="!canSubmit" @click="handleSubmit">
            上传保存
          </el-button>
          <el-button @click="resetForm">清空测试数据</el-button>
        </el-form-item>
      </el-form>

      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>

      <el-divider content-position="left">参数配置</el-divider>
      <div class="parameter-note">
        <span>本工序的设备编号、OCV电压范围、内阻范围、容量范围和操作员参数，在工序主数据中与分选保持同一配置结构。</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { cellApi, type Ocv1UploadPayload, type Ocv2UploadPayload } from '@/api/cells'

type OcvMode = 'ocv1' | 'ocv2'

const props = defineProps<{
  mode: OcvMode
  processName: string
  batchNo?: string
}>()

const emit = defineEmits<{ (event: 'close'): void }>()
const route = useRoute()
const router = useRouter()
const batchNo = computed(() => props.batchNo ?? (route.params.batchNo as string | undefined) ?? '')

const form = reactive<{
  barcode: string
  voltage: number | undefined
  internalResistance: number | undefined
  kValue: number | undefined
  equipmentCode: string
  testTime: string
}>({
  barcode: '',
  voltage: undefined,
  internalResistance: undefined,
  kValue: undefined,
  equipmentCode: '',
  testTime: '',
})

const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const canSubmit = computed(() => {
  const hasCommonValues = Boolean(
    batchNo.value.trim()
    && form.barcode.trim()
    && form.testTime
    && Number.isFinite(form.voltage)
    && Number.isFinite(form.internalResistance),
  )
  return props.mode === 'ocv2' ? hasCommonValues && Number.isFinite(form.kValue) : hasCommonValues
})

function nowAsIsoString() {
  return new Date().toISOString()
}

function resetForm() {
  form.barcode = ''
  form.voltage = undefined
  form.internalResistance = undefined
  form.kValue = undefined
  form.testTime = nowAsIsoString()
  error.value = ''
}

function getErrorMessage(exception: any) {
  return exception?.response?.data?.message || exception?.message || '上传失败，请检查数据后重试'
}

async function handleSubmit() {
  if (!canSubmit.value) {
    error.value = props.mode === 'ocv2'
      ? '请完整填写批次号、电芯码、电压、内阻、K值和测试时间'
      : '请完整填写批次号、电芯码、电压、内阻和测试时间'
    return
  }

  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    if (props.mode === 'ocv1') {
      const payload: Ocv1UploadPayload = {
        batchNo: batchNo.value.trim(),
        barcode: form.barcode.trim(),
        voltage: form.voltage!,
        internalResistance: form.internalResistance!,
        testTime: form.testTime,
        ...(form.equipmentCode.trim() ? { equipmentCode: form.equipmentCode.trim() } : {}),
      }
      await cellApi.uploadOcv1(payload)
    } else {
      const payload: Ocv2UploadPayload = {
        batchNo: batchNo.value.trim(),
        barcode: form.barcode.trim(),
        voltage: form.voltage!,
        internalResistance: form.internalResistance!,
        kValue: form.kValue!,
        testTime: form.testTime,
        ...(form.equipmentCode.trim() ? { equipmentCode: form.equipmentCode.trim() } : {}),
      }
      await cellApi.uploadOcv2(payload)
    }
    successMessage.value = `${props.processName}数据上传成功，可继续录入下一只电芯`
    ElMessage.success(successMessage.value)
    resetForm()
  } catch (exception) {
    error.value = getErrorMessage(exception)
    ElMessage.error(error.value)
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (props.batchNo) {
    emit('close')
    return
  }
  router.push(`/batches/${batchNo.value}`)
}

onMounted(() => {
  form.testTime = nowAsIsoString()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.page-header h3 { margin: 0; }
.page-subtitle { margin: 5px 0 0; color: #909399; font-size: 13px; }
.batch-info { margin: 12px 0; padding: 8px 12px; background: #f5f7fa; border-radius: 4px; font-size: 14px; }
.batch-label { color: #909399; }
.batch-value { color: #303133; font-weight: 500; }
.ocv-form { max-width: 560px; }
.unit-suffix { margin-left: 8px; color: #909399; font-size: 13px; }
.error-msg { color: #f56c6c; margin-top: 12px; }
.success-msg { color: #67c23a; margin-top: 12px; font-weight: 500; }
.parameter-note { padding: 10px 12px; color: #606266; background: #f5f7fa; border-radius: 4px; font-size: 13px; }
</style>
