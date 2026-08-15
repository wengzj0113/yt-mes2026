<template>
  <ProcessFormPage
    basePath="process-dynamic/wrapping"
    processName="顶封"
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
  { key: 'equipmentCode', label: '设备编号', helpText: '顶封机设备编号' },
  { key: 'filmModel', label: '膜型号', helpText: '热缩膜型号' },
  { key: 'shrinkTemperature', label: '收缩温度(℃)', type: 'number', helpText: '热缩膜收缩温度' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = [
  { key: 'appearanceCheck', label: '外观检查', type: 'number', helpText: '外观检查结果 1=合格 0=不合格' },
]
</script>
