<template>
  <ProcessFormPage
    basePath="process-dynamic/electrode"
    processName="制片"
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
  { key: 'tabMaterialSpec', label: '极耳材料规格', helpText: '极耳材料的型号规格' },
  { key: 'electrodeLength', label: '极片长度', helpText: '制片机裁切后的极片长度' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = [
  { key: 'tabWeldingPull', label: '极耳焊接拉力(N)', type: 'number', helpText: '焊接后的拉力测试值' },
]
</script>
