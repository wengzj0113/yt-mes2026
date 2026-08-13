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
import { useAuthStore } from '@/stores/auth'
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const authStore = useAuthStore()

const draftFields: FormField[] = [
  { key: 'equipmentCode', label: '设备编号', helpText: '辊压机设备编号' },
  { key: 'rollerPressure', label: '辊压压力(MPa)', type: 'number', helpText: '辊轮施加的压力' },
  { key: 'rollerThickness', label: '辊压厚度(mm)', type: 'number', helpText: '辊压后极片厚度' },
  { key: 'rollerSpeed', label: '辊压速度(m/min)', type: 'number', helpText: '设备运行速度' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = []
</script>
