<template>
  <ProcessFormPage
    basePath="processes/sorting"
    processName="分选"
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
  { key: 'ocvVoltageRange', label: 'OCV电压范围' },
  { key: 'irRange', label: '内阻范围' },
  { key: 'capacityRange', label: '容量范围' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = []
</script>
