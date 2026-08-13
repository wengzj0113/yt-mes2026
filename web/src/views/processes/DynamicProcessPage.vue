<template>
  <ProcessFormPage
    :base-path="`process-dynamic/${processCode}`"
    :process-name="processName"
    :draft-fields="[]"
    :quality-fields="[]"
    :batch-no="batchNo"
    @close="emit('close')"
  />
</template>

<script setup lang="ts">
import ProcessFormPage from './ProcessFormPage.vue'

defineProps<{ processCode: string; processName: string; batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
</script>
