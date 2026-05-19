<template>
  <ProcessFormPage
    basePath="processes/baking"
    processName="烘烤"
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
  { key: 'bakingTemperature', label: '烘烤温度(℃)', type: 'number' },
  { key: 'bakingDuration', label: '烘烤时长(min)', type: 'number' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = [
  { key: 'vacuumLevel', label: '真空度(Pa)', type: 'number' },
  { key: 'moistureAfterBaking', label: '烘烤后水分(ppm)', type: 'number' },
]
</script>
