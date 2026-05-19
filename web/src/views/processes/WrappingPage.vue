<template>
  <ProcessFormPage
    basePath="processes/wrapping"
    processName="顶封"
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
  { key: 'filmModel', label: '膜型号' },
  { key: 'shrinkTemperature', label: '收缩温度(℃)', type: 'number' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = [
  { key: 'appearanceCheck', label: '外观检查', type: 'number' },
]
</script>
