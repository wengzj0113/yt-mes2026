<template>
  <div class="process-page">
    <el-card v-loading="loading">
      <div class="page-header">
        <h3>{{ processName }}</h3>
        <el-button @click="goBack">返回批次</el-button>
      </div>

      <el-divider content-position="left">操作员填写</el-divider>
      <el-form :model="draftForm" label-width="140px" inline @submit.prevent>
        <el-form-item
          v-for="f in dynamicDraftFields"
          :key="f.key"
          :label="f.label"
          :required="f.required !== false"
        >
          <el-input
            v-if="!f.type || f.type === 'text'"
            v-model="draftForm[f.key]"
            :placeholder="'请输入' + f.label"
          >
            <template v-if="f.unit" #suffix>{{ f.unit }}</template>
          </el-input>
          <el-select
            v-else-if="f.type === 'select'"
            v-model="draftForm[f.key]"
            :placeholder="'请选择' + f.label"
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
            v-else
            v-model="draftForm[f.key]"
            :placeholder="'请输入' + f.label"
            controls-position="right"
            :min="f.min !== null ? f.min : undefined"
            :max="f.max !== null ? f.max : undefined"
          />
          <span v-if="f.type === 'number' && f.unit" class="unit-suffix">{{ f.unit }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveDraft(batchNo)">
            保存
          </el-button>
        </el-form-item>
      </el-form>

      <template v-if="dynamicQualityFields.length > 0">
        <el-divider content-position="left">质检填写</el-divider>
        <el-form :model="qualityForm" label-width="140px" inline @submit.prevent>
          <el-form-item v-for="f in dynamicQualityFields" :key="f.key" :label="f.label">
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

      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="record?.isDraft === false" class="success-msg">该工序已提交质检完成</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProcessForm, type FormField } from './useProcess'
import { processDictionaryApi } from '@/api/process-dictionary'

const props = defineProps<{
  basePath: string
  processName: string
  draftFields: FormField[]
  qualityFields: FormField[]
  batchNo?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()
const router = useRouter()
const batchNo = computed(() => props.batchNo ?? (route.params.batchNo as string))

// Dynamic Fields
const dynamicDraftFields = ref<FormField[]>([...props.draftFields])
const dynamicQualityFields = ref<FormField[]>([...props.qualityFields])

const { loading, saving, error, record, draftForm, qualityForm, loadRecord, saveDraft, submit } = useProcessForm(
  props.basePath,
  dynamicDraftFields, // Pass as ref
  dynamicQualityFields, // Pass as ref
)

async function loadDynamicFields() {
  const code = props.basePath.split('/').pop()
  if (!code) return

  try {
    const res = await processDictionaryApi.findByCode(code)
    const process = res.data
    if (process?.fieldDefinitions) {
      const defs = JSON.parse(process.fieldDefinitions) as FormField[]
      
      // Source of truth is now the database definitions
      dynamicDraftFields.value = defs
      
      // Re-initialize form for all fields
      defs.forEach(f => {
        if (draftForm[f.key] === undefined) {
          draftForm[f.key] = f.defaultValue || ''
        }
      })
    }
  } catch (e) {
    console.error('Load dynamic fields failed', e)
    // Fallback to props if API fails
    dynamicDraftFields.value = [...props.draftFields]
  }
}

onMounted(async () => {
  await loadDynamicFields()
  await loadRecord(batchNo.value)
})

const allDraftFilled = computed(() =>
  dynamicDraftFields.value.every((f) => {
    if (f.required === false) return true
    const v = draftForm[f.key]
    return v !== '' && v !== null && v !== undefined
  }),
)

async function handleSubmit() {
  const ok = await submit(batchNo.value)
  if (ok) await loadRecord(batchNo.value)
}

function goBack() {
  if (props.batchNo) {
    emit('close')
  } else {
    router.push(`/batches/${batchNo.value}`)
  }
}

onMounted(() => loadRecord(batchNo.value))
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h3 { margin: 0; }
.error-msg { color: #f56c6c; margin-top: 12px; }
.success-msg { color: #67c23a; margin-top: 12px; font-weight: bold; }
.unit-suffix { margin-left: 8px; color: #909399; font-size: 13px; }
</style>
