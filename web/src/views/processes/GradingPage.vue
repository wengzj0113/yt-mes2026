<template>
  <ProcessFormPage
    basePath="processes/grading"
    processName="分容"
    :draftFields="draftFields"
    :qualityFields="qualityFields"
    :batchNo="batchNo"
    @close="emit('close')"
  />
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const authStore = useAuthStore()

const draftFields: FormField[] = [
  { key: 'equipmentCode', label: '设备编号', helpText: '分容设备编号' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = [
  { key: 'chargeDischargeTemplate', label: '充放电模板', helpText: '分容测试模板名称' },
  { key: 'gradingTemperature', label: '分容温度(℃)', type: 'number', helpText: '分容环境温度' },
  { key: 'capacityGradeStandard', label: '容量等级标准', helpText: '容量分级标准描述' },
]
</script>
