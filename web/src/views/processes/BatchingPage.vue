<template>
  <ProcessFormPage
    basePath="processes/batching"
    processName="配料"
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
const operatorOptions = ref<Array<{ label: string; value: string }>>([])
const positiveMaterialOptions = ref<Array<{ label: string; value: string }>>([])
const negativeMaterialOptions = ref<Array<{ label: string; value: string }>>([])

const draftFields = computed<FormField[]>(() => [
  { key: 'positiveMaterial', label: '正极材料', type: 'select', options: positiveMaterialOptions.value },
  { key: 'negativeMaterial', label: '负极材料', type: 'select', options: negativeMaterialOptions.value },
  { key: 'operatorName', label: '操作员', type: 'select', options: operatorOptions.value },
])
const qualityFields: FormField[] = [
  { key: 'viscosityRecord', label: '粘度记录' },
]

async function loadOptions() {
  try {
    const [operatorsRes, positiveRes, negativeRes] = await Promise.all([
      masterDataApi.operators(),
      materialApi.getAvailable(batchNo.value, 1),
      materialApi.getAvailable(batchNo.value, 2),
    ])

    operatorOptions.value = (operatorsRes.data ?? []).map((item) => ({
      label: item.realName,
      value: item.realName,
    }))
    positiveMaterialOptions.value = (positiveRes.data ?? []).map((item: any) => ({
      label: item.supplierBatchNo ?? item.label ?? item.value,
      value: item.supplierBatchNo ?? item.value,
    }))
    negativeMaterialOptions.value = (negativeRes.data ?? []).map((item: any) => ({
      label: item.supplierBatchNo ?? item.label ?? item.value,
      value: item.supplierBatchNo ?? item.value,
    }))
  } catch {
    operatorOptions.value = []
    positiveMaterialOptions.value = []
    negativeMaterialOptions.value = []
  }
}

onMounted(loadOptions)
</script>
