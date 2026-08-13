<template><DynamicProcessPage process-code="integrated-machine" process-name="一体机" :batch-no="batchNo" @close="emit('close')" /></template>
<script setup lang="ts">
import DynamicProcessPage from './DynamicProcessPage.vue'
defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
</script>
