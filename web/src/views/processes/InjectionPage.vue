<template>
  <ProcessFormPage
    basePath="process-dynamic/injection"
    processName="注液"
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
import { useAuthStore } from '@/stores/auth'
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const authStore = useAuthStore()

const route = useRoute()
const batchNo = computed(() => props.batchNo ?? (route.params.batchNo as string))
const equipmentOptions = ref<Array<{ label: string; value: string }>>([])
const operatorOptions = ref<Array<{ label: string; value: string }>>([])
const electrolyteOptions = ref<Array<{ label: string; value: string }>>([])

const draftFields = computed<FormField[]>(() => [
  { key: 'equipmentCode', label: '设备编号', type: 'select', options: equipmentOptions.value, helpText: '注液机设备编号' },
  { key: 'electrolyteModel', label: '电解液型号', type: 'select', options: electrolyteOptions.value, helpText: '本批次使用的电解液型号' },
  { key: 'operatorName', label: '操作员', type: 'select', options: operatorOptions.value, defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
])
const qualityFields: FormField[] = [
  { key: 'injectionAmount', label: '注液量(g)', type: 'number', helpText: '每个电芯注液量' },
  { key: 'injectionHumidity', label: '注液湿度(ppm)', type: 'number', helpText: '注液房环境湿度' },
  { key: 'injectionTemperature', label: '注液温度(℃)', type: 'number', helpText: '注液房环境温度' },
  { key: 'sealingDimension', label: '封口尺寸(mm)', type: 'number', helpText: '封口后测量尺寸' },
  { key: 'cleaningRecord', label: '清洗记录', helpText: '设备清洗参数记录' },
]

async function loadOptions() {
  try {
    const [equipmentRes, operatorsRes, electrolyteRes] = await Promise.all([
      masterDataApi.equipment(),
      masterDataApi.operators(),
      materialApi.getAvailable(batchNo.value, 3),
    ])

    equipmentOptions.value = (equipmentRes.data ?? []).map((item) => ({
      label: `${item.equipmentCode} - ${item.equipmentName}`,
      value: item.equipmentCode,
    }))
    operatorOptions.value = (operatorsRes.data ?? []).map((item) => ({
      label: item.realName,
      value: item.realName,
    }))
    electrolyteOptions.value = (electrolyteRes.data ?? []).map((item: any) => ({
      label: item.supplierBatchNo ?? item.label ?? item.value,
      value: item.supplierBatchNo ?? item.value,
    }))
  } catch {
    equipmentOptions.value = []
    operatorOptions.value = []
    electrolyteOptions.value = []
  }
}

onMounted(loadOptions)
</script>
