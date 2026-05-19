<template>
  <ProcessFormPage
    basePath="processes/winding"
    processName="卷绕"
    :draftFields="draftFields"
    :qualityFields="qualityFields"
    :batchNo="batchNo"
    @close="emit('close')"
  />
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { masterDataApi } from '@/api/master-data'
import { materialApi } from '@/api/material'
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const route = useRoute()
const batchNo = computed(() => props.batchNo ?? (route.params.batchNo as string))
const equipmentOptions = ref<Array<{ label: string; value: string }>>([])
const operatorOptions = ref<Array<{ label: string; value: string }>>([])
const separatorOptions = ref<Array<{ label: string; value: string }>>([])

const draftFields = computed<FormField[]>(() => [
  { key: 'equipmentCode', label: '设备编号', type: 'select', options: equipmentOptions.value },
  { key: 'separatorModel', label: '隔膜型号', type: 'select', options: separatorOptions.value },
  { key: 'windingSpeed', label: '卷绕速度(rpm)', type: 'number' },
  { key: 'windingTension', label: '卷绕张力(N)', type: 'number' },
  { key: 'operatorName', label: '操作员', type: 'select', options: operatorOptions.value },
])
const qualityFields: FormField[] = [
  { key: 'coreThickness', label: '电芯厚度(mm)', type: 'number' },
  { key: 'coreDiameter', label: '电芯直径(mm)', type: 'number' },
]

async function loadOptions() {
  try {
    const [equipmentRes, operatorsRes, separatorRes] = await Promise.all([
      masterDataApi.equipment(),
      masterDataApi.operators(),
      materialApi.getAvailable(batchNo.value, 4),
    ])

    equipmentOptions.value = (equipmentRes.data ?? []).map((item) => ({
      label: `${item.equipmentCode} - ${item.equipmentName}`,
      value: item.equipmentCode,
    }))
    operatorOptions.value = (operatorsRes.data ?? []).map((item) => ({
      label: item.realName,
      value: item.realName,
    }))
    separatorOptions.value = (separatorRes.data ?? []).map((item: any) => ({
      label: item.supplierBatchNo ?? item.label ?? item.value,
      value: item.supplierBatchNo ?? item.value,
    }))
  } catch {
    equipmentOptions.value = []
    operatorOptions.value = []
    separatorOptions.value = []
  }
}

onMounted(loadOptions)
</script>
