<template>
  <OcvParameterPage mode="ocv1" process-name="OCV1测试" :batch-no="batchNo" @close="emit('close')" />
</template>

<script setup lang="ts">
import OcvParameterPage from './OcvParameterPage.vue'

defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (event: 'close'): void }>()
</script>
