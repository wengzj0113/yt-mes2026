<template>
  <ProcessFormPage
    basePath="process-dynamic/sorting"
    processName="分选"
    :draftFields="draftFields"
    :qualityFields="qualityFields"
    :batchNo="batchNo"
    @close="emit('close')"
  />
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import ProcessFormPage from './ProcessFormPage.vue'
import { createStandardParameterFields } from './standardParameterFields'
import type { FormField } from './useProcess'

const props = defineProps<{ batchNo?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const authStore = useAuthStore()

const draftFields: FormField[] = createStandardParameterFields(authStore.user?.realName ?? '')
const qualityFields: FormField[] = []
</script>
