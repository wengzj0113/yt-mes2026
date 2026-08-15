<template>
  <ProcessFormPage
    basePath="process-dynamic/baking"
    processName="烘烤"
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
  { key: 'equipmentCode', label: '设备编号', helpText: '烘烤炉设备编号' },
  { key: 'bakingTemperature', label: '烘烤温度(℃)', type: 'number', helpText: '烘烤炉设定温度' },
  { key: 'bakingDuration', label: '烘烤时长(min)', type: 'number', helpText: '总烘烤时间' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = [
  { key: 'vacuumLevel', label: '真空度(Pa)', type: 'number', helpText: '烘烤时真空度' },
  { key: 'moistureAfterBaking', label: '烘烤后水分(ppm)', type: 'number', helpText: '烘烤后电芯水分测试值' },
]
</script>
