<template>
  <ProcessFormPage
    basePath="process-dynamic/slitting"
    processName="分切"
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
  { key: 'equipmentCode', label: '设备编号', helpText: '分切机设备编号' },
  { key: 'electrodeWidth', label: '极片宽度(mm)', type: 'number', helpText: '分切后极片宽度' },
  { key: 'electrodeLength', label: '极片长度(mm)', type: 'number', helpText: '分切后极片长度' },
  { key: 'slittingSpeed', label: '分切速度(m/min)', type: 'number', helpText: '设备运行速度' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = []
</script>
