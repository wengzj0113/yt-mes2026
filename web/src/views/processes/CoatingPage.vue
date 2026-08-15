<template>
  <ProcessFormPage
    basePath="process-dynamic/coating"
    processName="涂布"
    :draftFields="draftFields"
    :qualityFields="qualityFields"
    :batchNo="batchNo"
    @close="emit('close')"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const authStore = useAuthStore()

const draftFields: FormField[] = [
  { key: 'equipmentCode', label: '设备编号', helpText: '涂布机设备编号' },
  { key: 'coatingSpeed', label: '涂布速度(m/min)', type: 'number', helpText: '设备运行速度' },
  { key: 'coatingThicknessPos', label: '正极涂布厚度(um)', type: 'number', helpText: '正极片涂布厚度' },
  { key: 'coatingThicknessNeg', label: '负极涂布厚度(um)', type: 'number', helpText: '负极片涂布厚度' },
  { key: 'arealDensityPos', label: '正极面密度(g/m²)', type: 'number', helpText: '正极单位面积重量' },
  { key: 'arealDensityNeg', label: '负极面密度(g/m²)', type: 'number', helpText: '负极单位面积重量' },
  { key: 'coatingTemperature', label: '涂布温度(℃)', type: 'number', helpText: '烘箱温度' },
  { key: 'operatorName', label: '操作员', defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
]
const qualityFields: FormField[] = []
</script>
