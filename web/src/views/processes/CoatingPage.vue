<template>
  <ProcessFormPage
    basePath="processes/coating"
    processName="涂布"
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
  { key: 'coatingSpeed', label: '涂布速度(m/min)', type: 'number' },
  { key: 'coatingThicknessPos', label: '正极涂布厚度(um)', type: 'number' },
  { key: 'coatingThicknessNeg', label: '负极涂布厚度(um)', type: 'number' },
  { key: 'arealDensityPos', label: '正极面密度(g/m²)', type: 'number' },
  { key: 'arealDensityNeg', label: '负极面密度(g/m²)', type: 'number' },
  { key: 'coatingTemperature', label: '涂布温度(℃)', type: 'number' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = []
</script>
