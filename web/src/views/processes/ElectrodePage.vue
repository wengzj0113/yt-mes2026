<template>
  <ProcessFormPage
    basePath="processes/electrode"
    processName="制片"
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
  { key: 'tabMaterialSpec', label: '极耳材料规格' },
  { key: 'electrodeLength', label: '极片长度' },
  { key: 'operatorName', label: '操作员' },
]
const qualityFields: FormField[] = [
  { key: 'tabWeldingPull', label: '极耳焊接拉力(N)' },
]
</script>
