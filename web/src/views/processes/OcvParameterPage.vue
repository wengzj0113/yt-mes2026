<template>
  <ProcessFormPage
    :base-path="`processes/${mode}`"
    :process-name="`${resolvedProcessName} - 参数编辑`"
    :draft-fields="parameterFields"
    :quality-fields="[]"
    :batch-no="batchNo"
    @close="emit('close')"
  />
</template>

<script setup lang="ts">
import ProcessFormPage from './ProcessFormPage.vue'
import type { FormField } from './useProcess'
import { computed } from 'vue'

type OcvMode = 'ocv1' | 'ocv2'

const props = defineProps<{
  mode: OcvMode
  processName?: string
  batchNo?: string
}>()

const resolvedProcessName = computed(() => props.processName ?? (props.mode === 'ocv1' ? 'OCV1测试' : 'OCV2测试'))

const emit = defineEmits<{ (event: 'close'): void }>()

const parameterFields: FormField[] = [
  { key: 'equipmentCode', label: '设备编号', type: 'text', required: true },
  { key: 'ocvVoltageRange', label: 'OCV电压范围', unit: 'V', type: 'range', minKey: 'ocvVoltageMin', maxKey: 'ocvVoltageMax', required: true },
  { key: 'irRange', label: '内阻范围', unit: 'mΩ', type: 'range', minKey: 'irMin', maxKey: 'irMax', required: true },
  { key: 'capacityRange', label: '容量范围', unit: 'Ah', type: 'range', minKey: 'capacityMin', maxKey: 'capacityMax', required: true },
  { key: 'operatorName', label: '操作员', type: 'text', required: true },
]
</script>
