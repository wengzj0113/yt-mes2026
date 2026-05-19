<template>
  <ProcessFormPage
    basePath="processes/slitting"
    processName="分切"
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
  { key: 'electrodeWidth', label: '极片宽度(mm)', type: 'number' },
  { key: 'electrodeLength', label: '极片长度(mm)', type: 'number' },
  { key: 'slittingSpeed', label: '分切速度(m/min)', type: 'number' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = []
</script>
