<template>
  <ProcessFormPage
    base-path="process-dynamic/formation-grading"
    process-name="化成分容"
    :draft-fields="[]"
    :quality-fields="[]"
    :field-groups="fieldGroups"
    form-variant="formation-grading"
    data-testid="formation-grading-form"
    :batch-no="batchNo"
    @close="emit('close')"
  />
</template>

<script setup lang="ts">
import ProcessFormPage from './ProcessFormPage.vue'

defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()

const fieldGroups = [
  { key: 'activation', label: '活化参数', fieldKeys: ['activationDuration', 'filmColor', 'equipmentCode'] },
  { key: 'formation', label: '化成分容参数', fieldKeys: ['formationTemplate', 'formationTemperature', 'gradingTemplate', 'gradingTemperature'] },
  { key: 'grading-result', label: '分容结果参数', fieldKeys: ['postGradingVoltageRange', 'postGradingInternalResistanceRange', 'capacityGradeStandard'] },
]
</script>
