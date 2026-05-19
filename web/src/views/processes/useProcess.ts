export interface FormField {
  key: string
  label: string
  type?: 'text' | 'number' | 'select'
  required?: boolean
  options?: Array<{ label: string; value: string | number }>
}

import { ref, reactive } from 'vue'
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
  draftFields: FormField[],
  qualityFields: FormField[],
) {
  const loading = ref(false)
  const saving = ref(false)
  const record = ref<any>(null)
  const error = ref('')

  const draftForm = reactive<Record<string, any>>({})
  draftFields.forEach((f) => { draftForm[f.key] = '' })

  const qualityForm = reactive<Record<string, any>>({})
  qualityFields.forEach((f) => { qualityForm[f.key] = '' })

  const api = useProcessApi(basePath)

  async function loadRecord(batchNo: string) {
    loading.value = true
    try {
      const res = await api.getRecord(batchNo)
      record.value = res.data
      if (res.data) {
        draftFields.forEach((f) => {
          draftForm[f.key] = (res.data as any)[f.key] ?? ''
        })
        qualityFields.forEach((f) => {
          qualityForm[f.key] = (res.data as any)[f.key] ?? ''
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
