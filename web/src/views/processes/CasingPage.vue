<template><DynamicProcessPage process-code="casing" process-name="入壳" :batch-no="batchNo" @close="emit('close')" /></template>
<script setup lang="ts">
import DynamicProcessPage from './DynamicProcessPage.vue'
defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
</script>
