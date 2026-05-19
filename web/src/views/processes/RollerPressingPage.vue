<template>
  <ProcessFormPage
    basePath="processes/roller-pressing"
    processName="辊压"
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
  { key: 'rollerPressure', label: '辊压压力(MPa)', type: 'number' },
  { key: 'rollerThickness', label: '辊压厚度(mm)', type: 'number' },
  { key: 'rollerSpeed', label: '辊压速度(m/min)', type: 'number' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = []
</script>
