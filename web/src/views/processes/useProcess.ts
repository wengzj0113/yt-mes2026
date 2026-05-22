export interface FormField {
  key: string
  label: string
  type?: 'text' | 'number' | 'select'
  required?: boolean
  options?: any // Can be string (comma separated) or array
  group?: string
  unit?: string
  min?: number | null
  max?: number | null
  defaultValue?: any
}

import { ref, reactive, watch, type Ref } from 'vue'
import { get, post } from '@/api'

export function useProcessApi(modulePath: string) {
  function getRecord(batchNo: string) {
    return get<any>(`/${modulePath}/${batchNo}`)
  }

  function createDraft(batchNo: string, data: Record<string, any>) {
    return post<any>(`/${modulePath}/draft`, { batchNo, ...data })
  }

  function submitQuality(batchNo: string, data: Record<string, any>) {
    return post<any>(`/${modulePath}/submit`, { batchNo, ...data })
  }

  return { getRecord, createDraft, submitQuality }
}

export function useProcessForm(
  basePath: string,
  draftFields: Ref<FormField[]>,
  qualityFields: Ref<FormField[]>,
) {
  const loading = ref(false)
  const saving = ref(false)
  const record = ref<any>(null)
  const error = ref('')

  const draftForm = reactive<Record<string, any>>({})
  const qualityForm = reactive<Record<string, any>>({})

  // Watch for field changes to initialize form
  watch(draftFields, (newFields) => {
    newFields.forEach((f) => {
      if (draftForm[f.key] === undefined) {
        draftForm[f.key] = ''
      }
    })
  }, { immediate: true })

  watch(qualityFields, (newFields) => {
    newFields.forEach((f) => {
      if (qualityForm[f.key] === undefined) {
        qualityForm[f.key] = ''
      }
    })
  }, { immediate: true })

  const api = useProcessApi(basePath)

  async function loadRecord(batchNo: string) {
    loading.value = true
    try {
      const res = await api.getRecord(batchNo)
      record.value = res.data
      if (res.data) {
        const allData = { ...res.data }
        if (res.data.extraData) {
          try {
            const extra = JSON.parse(res.data.extraData)
            Object.assign(allData, extra)
          } catch (e) {}
        }

        draftFields.value.forEach((f) => {
          draftForm[f.key] = allData[f.key] ?? ''
        })
        qualityFields.value.forEach((f) => {
          qualityForm[f.key] = allData[f.key] ?? ''
        })
      }
    } catch (e: any) {
      if (e?.response?.data?.code !== 'PROCESS_DRAFT_EXISTS') {
        error.value = e?.response?.data?.message || '加载失败'
      }
    } finally {
      loading.value = false
    }
  }

  async function saveDraft(batchNo: string) {
    saving.value = true
    try {
      // Split hardcoded fields and extraData
      // Note: We don't strictly know which are hardcoded in the backend here, 
      // but we can send the whole form and let the backend handle it if we update the backend.
      // Alternatively, we can pass hardcoded keys as a prop.
      // For now, let's send the whole form and update the backend to be smart.
      const res = await api.createDraft(batchNo, draftForm)
      record.value = res.data
    } catch (e: any) {
      error.value = e?.response?.data?.message || '保存草稿失败'
    } finally {
      saving.value = false
    }
  }

  async function submit(batchNo: string) {
    saving.value = true
    try {
      // First save draft to ensure extraData is updated if any
      await api.createDraft(batchNo, { ...draftForm, ...qualityForm })
      
      const res = await api.submitQuality(batchNo, qualityForm)
      record.value = res.data
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.message || '提交失败'
      return false
    } finally {
      saving.value = false
    }
  }

  return { loading, saving, error, record, draftForm, qualityForm, loadRecord, saveDraft, submit }
}
