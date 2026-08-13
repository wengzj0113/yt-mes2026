<template><DynamicProcessPage process-code="laser-welding" process-name="激光焊接" :batch-no="batchNo" @close="emit('close')" /></template>
<script setup lang="ts">
import DynamicProcessPage from './DynamicProcessPage.vue'
defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
</script>
