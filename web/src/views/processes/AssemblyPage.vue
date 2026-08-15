<template>
  <ProcessFormPage
    basePath="process-dynamic/assembly"
    processName="装配"
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
const shellOptions = ref<Array<{ label: string; value: string }>>([])
const capOptions = ref<Array<{ label: string; value: string }>>([])

const draftFields = computed<FormField[]>(() => [
  { key: 'casingEquipmentCode', label: '入壳设备编号', type: 'select', options: equipmentOptions.value, helpText: '入壳工序设备编号' },
  { key: 'shellModel', label: '壳体型号', type: 'select', options: shellOptions.value, helpText: '本批次使用的壳体型号' },
  { key: 'bottomWeldEquipment', label: '底焊设备编号', type: 'select', options: equipmentOptions.value, helpText: '底焊工序设备编号' },
  { key: 'bottomWeldParams', label: '底焊参数', helpText: '底焊焊接参数记录' },
  { key: 'capModel', label: '盖板型号', type: 'select', options: capOptions.value, helpText: '本批次使用的盖板型号' },
  { key: 'operatorName', label: '操作员', type: 'select', options: operatorOptions.value, defaultValue: authStore.user?.realName ?? '', helpText: '负责本工序的操作员' },
])
const qualityFields: FormField[] = [
  { key: 'bottomWeldPull', label: '底焊拉力(N)', type: 'number', helpText: '底焊焊接拉力测试值' },
  { key: 'grooveRecord', label: '滚槽记录', helpText: '滚槽工序参数记录' },
  { key: 'capWeldingPull', label: '盖板焊接拉力(N)', type: 'number', helpText: '盖板焊接拉力测试值' },
  { key: 'tabWeldingPull', label: '极耳焊接拉力(N)', type: 'number', helpText: '极耳焊接拉力测试值' },
]

async function loadOptions() {
  try {
    const [equipmentRes, operatorsRes, shellRes] = await Promise.all([
      masterDataApi.equipment(),
      masterDataApi.operators(),
      materialApi.getAvailable(batchNo.value, 5),
    ])

    equipmentOptions.value = (equipmentRes.data ?? []).map((item) => ({
      label: `${item.equipmentCode} - ${item.equipmentName}`,
      value: item.equipmentCode,
    }))
    operatorOptions.value = (operatorsRes.data ?? []).map((item) => ({
      label: item.realName,
      value: item.realName,
    }))
    const shellCapOptions = (shellRes.data ?? []).map((item: any) => ({
      label: item.supplierBatchNo ?? item.label ?? item.value,
      value: item.supplierBatchNo ?? item.value,
    }))
    shellOptions.value = shellCapOptions
    capOptions.value = shellCapOptions
  } catch {
    equipmentOptions.value = []
    operatorOptions.value = []
    shellOptions.value = []
    capOptions.value = []
  }
}

onMounted(loadOptions)
</script>
