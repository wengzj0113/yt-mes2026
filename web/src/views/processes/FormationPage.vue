<template>
  <ProcessFormPage
    basePath="processes/formation"
    processName="化成"
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
  { key: 'equipmentCode', label: '设备编号', helpText: '化成设备编号' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = [
  { key: 'chargeDischargeTemplate', label: '充放电模板', helpText: '充放电测试模板名称' },
  { key: 'formationTemperature', label: '化成温度(℃)', type: 'number', helpText: '化成分容环境温度' },
]
</script>
