<template>
  <div :class="['process-page', formVariant ? `process-form--${formVariant}` : '']" :data-testid="dataTestid">
    <el-card v-loading="loading">
      <div class="page-header">
        <h3>{{ processName }}</h3>
        <el-button @click="goBack">返回批次</el-button>
      </div>
      <div class="batch-info">
        <span class="batch-label">批次号：</span>
        <span class="batch-value">{{ batchNo }}</span>
      </div>

      <el-divider content-position="left">操作员填写</el-divider>
      <el-form :model="draftForm" label-width="140px" inline @submit.prevent>
        <template v-for="group in renderedDraftGroups" :key="group.key">
          <el-divider v-if="group.label" content-position="left">{{ group.label }}</el-divider>
          <div class="field-grid">
            <el-form-item
              v-for="f in group.fields"
              :key="f.key"
              :label="f.label"
              :required="f.required !== false"
            >
          <div class="form-field-wrapper">
            <el-input
              v-if="!f.type || f.type === 'text'"
              v-model="draftForm[f.key]"
              :placeholder="'请输入' + f.label"
              :disabled="f.key === 'operatorName'"
            >
              <template v-if="f.unit" #suffix>{{ f.unit }}</template>
            </el-input>
            <el-select
              v-else-if="f.type === 'select'"
              v-model="draftForm[f.key]"
              :placeholder="'请选择' + f.label"
              :disabled="f.key === 'operatorName'"
              style="width: 220px"
            >
              <el-option
                v-for="option in (f.options && typeof f.options === 'string' ? f.options.split(',').map(o => ({ label: o.trim(), value: o.trim() })) : f.options) || []"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-input-number
              v-else-if="f.type === 'number'"
              v-model="draftForm[f.key]"
              :placeholder="'请输入' + f.label"
              controls-position="right"
              :min="f.min !== null ? f.min : undefined"
              :max="f.max !== null ? f.max : undefined"
            />
            <div v-else-if="f.type === 'range'" class="range-wrapper">
              <el-input-number
                v-model="draftForm[f.minKey!]"
                :placeholder="f.minLabel ?? '最小值'"
                :step="f.step ?? 1"
                :precision="f.precision ?? 4"
                controls-position="right"
                style="width: 140px"
              />
              <span class="range-separator">~</span>
              <el-input-number
                v-model="draftForm[f.maxKey!]"
                :placeholder="f.maxLabel ?? '最大值'"
                :step="f.step ?? 1"
                :precision="f.precision ?? 4"
                controls-position="right"
                style="width: 140px"
              />
              <span v-if="f.unit" class="unit-suffix">{{ f.unit }}</span>
              <span v-if="f.helpText" class="help-text">{{ f.helpText }}</span>
            </div>
            <span v-if="f.type === 'number' && f.unit" class="unit-suffix">{{ f.unit }}</span>
            <span v-if="f.helpText && f.type !== 'range'" class="help-text">{{ f.helpText }}</span>
          </div>
            </el-form-item>
          </div>
        </template>
        <el-form-item class="group-actions">
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存
          </el-button>
        </el-form-item>
      </el-form>

      <template v-if="dynamicQualityFields.length > 0 && props.showQualitySubmit !== false">
        <el-divider content-position="left">质检填写</el-divider>
        <el-form :model="qualityForm" label-width="140px" inline @submit.prevent>
          <el-form-item v-for="f in dynamicQualityFields" :key="f.key" :label="f.label">
            <div class="form-field-wrapper">
              <el-input
                v-if="!f.type || f.type === 'text'"
                v-model="qualityForm[f.key]"
                :placeholder="'请输入' + f.label"
              />
              <el-select
                v-else-if="f.type === 'select'"
                v-model="qualityForm[f.key]"
                :placeholder="'请选择' + f.label"
                style="width: 220px"
              >
                <el-option
                  v-for="option in f.options || []"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-input-number
                v-else
                v-model="qualityForm[f.key]"
                :placeholder="'请输入' + f.label"
                controls-position="right"
              />
              <span v-if="f.helpText" class="help-text">{{ f.helpText }}</span>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button
              type="success"
              :loading="saving"
              :disabled="!allDraftFilled"
              @click="handleSubmit"
            >
              提交质检
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-form v-if="dynamicQualityFields.length === 0 && props.showQualitySubmit !== false" :model="draftForm" inline @submit.prevent>
        <el-form-item>
          <el-button type="success" :loading="saving" :disabled="!allDraftFilled" @click="handleSubmit">
            提交质检
          </el-button>
        </el-form-item>
      </el-form>

      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="record?.isDraft === false" class="success-msg">该工序已提交质检完成</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProcessForm, type FormField } from './useProcess'
import { processDictionaryApi } from '@/api/process-dictionary'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  basePath: string
  processName: string
  draftFields: FormField[]
  qualityFields: FormField[]
  batchNo?: string
  showQualitySubmit?: boolean
  fieldGroups?: Array<{ key: string; label: string; fieldKeys: string[] }>
  formVariant?: string
  dataTestid?: string
}>()
const authStore = useAuthStore()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()
const router = useRouter()
const batchNo = computed(() => props.batchNo ?? (route.params.batchNo as string))
const isDynamicProcess = computed(() => props.basePath.startsWith('process-dynamic/'))

// Dynamic Fields
const dynamicDraftFields = ref<FormField[]>([...props.draftFields])
const dynamicQualityFields = ref<FormField[]>(isDynamicProcess.value ? [] : [...props.qualityFields])
const renderedDraftGroups = computed(() => {
  const fields = dynamicDraftFields.value
  if (!props.fieldGroups?.length) return [{ key: 'default', label: '', fields }]

  const grouped = props.fieldGroups.map((group) => ({
    ...group,
    fields: fields.filter((field) => group.fieldKeys.includes(field.key)),
  }))
  const groupedKeys = new Set(props.fieldGroups.flatMap((group) => group.fieldKeys))
  const remaining = fields.filter((field) => !groupedKeys.has(field.key))
  if (remaining.length) grouped.push({ key: 'other', label: '其他参数', fieldKeys: [], fields: remaining })
  return grouped
})

const { loading, saving, error, record, draftForm, qualityForm, loadRecord, saveDraft, submit } = useProcessForm(
  props.basePath,
  dynamicDraftFields, // Pass as ref
  dynamicQualityFields, // Pass as ref
)

async function loadDynamicFields() {
  if (!isDynamicProcess.value) return
  const code = props.basePath.split('/').pop()
  if (!code) return

  try {
    const res = await processDictionaryApi.findByCode(code)
    const process = res.data
    if (process?.fieldDefinitions) {
      let defs = JSON.parse(process.fieldDefinitions) as FormField[]
      
      // 1. 移除批次号字段（不应该是可编辑的）
      defs = defs.filter(f => f.key !== 'batchNo')
      
      // 2. 从 props 中获取默认值覆盖到动态字段（确保操作员等字段有默认值）
      const propsFieldMap = new Map(props.draftFields.map(f => [f.key, f]))
      defs = defs.map(f => {
        const propField = propsFieldMap.get(f.key)
        if (propField && propField.defaultValue) {
          return { ...f, defaultValue: propField.defaultValue }
        }
        return f
      })

      dynamicDraftFields.value = defs
      
      // 3. 初始化表单字段（空值才填充默认值）
      defs.forEach(f => {
        if (draftForm[f.key] === undefined || draftForm[f.key] === '') {
          draftForm[f.key] = f.defaultValue || ''
        }
      })
    }
  } catch (e) {
    console.error('Load dynamic fields failed', e)
    dynamicDraftFields.value = [...props.draftFields]
  }
}

onMounted(async () => {
  // 1. 加载动态字段并设置默认值
  await loadDynamicFields()
  // 2. 加载记录（只覆盖有值的字段）
  await loadRecord(batchNo.value)
  // 3. 确保操作员字段自动填入当前登录用户（在未提交或草稿状态下强制覆盖）
  if (authStore.user?.realName && (!record.value || record.value.isDraft !== false)) {
    draftForm.operatorName = authStore.user.realName
  }
})

async function handleSave() {
  const rangeError = validateRanges()
  if (rangeError) {
    ElMessage.error(rangeError)
    return
  }
  const ok = await saveDraft(batchNo.value)
  if (ok) {
    ElMessage.success({ message: '保存成功', duration: 1500 })
    setTimeout(() => goBack(), 1500)
  }
}

const allDraftFilled = computed(() =>
  dynamicDraftFields.value.every((f) => {
    if (f.required === false) return true
    if (f.type === 'range' && f.minKey && f.maxKey) {
      const minV = draftForm[f.minKey]
      const maxV = draftForm[f.maxKey]
      return minV !== '' && minV !== null && minV !== undefined
        && maxV !== '' && maxV !== null && maxV !== undefined
    }
    const v = draftForm[f.key]
    return v !== '' && v !== null && v !== undefined
  }),
)

function validateRanges(): string | null {
  for (const f of dynamicDraftFields.value) {
    if (f.type !== 'range' || !f.minKey || !f.maxKey) continue
    const minV = draftForm[f.minKey]
    const maxV = draftForm[f.maxKey]
    if (minV == null || maxV == null) continue
    if (Number(minV) > Number(maxV)) {
      return `${f.label} 范围的最小值不能大于最大值`
    }
  }
  return null
}

async function handleSubmit() {
  const ok = await submit(batchNo.value)
  if (ok) {
    ElMessage.success({ message: '质检提交成功', duration: 1500 })
    setTimeout(() => goBack(), 1500)
  }
}

function goBack() {
  if (props.batchNo) {
    emit('close')
  } else {
    router.push(`/batches/${batchNo.value}`)
  }
}

</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h3 { margin: 0; }
.batch-info {
  margin: 12px 0;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}
.batch-label { color: #909399; }
.batch-value { color: #303133; font-weight: 500; }
.form-field-wrapper { display: flex; align-items: center; gap: 8px; }
.help-text { color: #909399; font-size: 12px; white-space: nowrap; }
.error-msg { color: #f56c6c; margin-top: 12px; }
.success-msg { color: #67c23a; margin-top: 12px; font-weight: bold; }
.unit-suffix { margin-left: 8px; color: #909399; font-size: 13px; }
.range-wrapper { display: flex; align-items: center; gap: 8px; }
.range-separator { color: #909399; font-weight: 500; }
.field-grid { display: contents; }
.group-actions { margin-top: 8px; }
.process-form--formation-grading .field-grid { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 10px 24px; }
.process-form--formation-grading .group-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
@media (max-width: 900px) {
  .process-form--formation-grading .field-grid { grid-template-columns: 1fr; }
}
</style>
