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
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const draftFields: FormField[] = [
  { key: 'equipmentCode', label: '设备编号' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = [
  { key: 'chargeDischargeTemplate', label: '充放电模板' },
  { key: 'gradingTemperature', label: '分容温度(℃)', type: 'number' },
  { key: 'capacityGradeStandard', label: '容量等级标准' },
]
</script>
