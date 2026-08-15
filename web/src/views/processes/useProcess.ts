export interface FormField {
  key: string
  label: string
  type?: 'text' | 'number' | 'select' | 'range'
  required?: boolean
  options?: any // Can be string (comma separated) or array
  group?: string
  unit?: string
  min?: number | null
  max?: number | null
  defaultValue?: any
  // 仅当 type === 'range' 时使用
  minKey?: string
  maxKey?: string
  minLabel?: string
  maxLabel?: string
  step?: number
  precision?: number
  helpText?: string
}

import { ref, reactive, watch, isRef, type Ref } from 'vue'
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
  draftFields: Ref<FormField[]> | FormField[],
  qualityFields: Ref<FormField[]> | FormField[],
) {
  const loading = ref(false)
  const saving = ref(false)
  const record = ref<any>(null)
  const error = ref('')

  const draftFieldsRef = (isRef(draftFields) ? draftFields : ref(draftFields)) as Ref<FormField[]>
  const qualityFieldsRef = (isRef(qualityFields) ? qualityFields : ref(qualityFields)) as Ref<FormField[]>

  const draftForm = reactive<Record<string, any>>({})
  const qualityForm = reactive<Record<string, any>>({})

  // Watch for field changes to initialize form
  watch(draftFieldsRef, (newFields) => {
    ;(newFields || []).forEach((f) => {
      if (!f) return
      if (f.type === 'range' && f.minKey && f.maxKey) {
        if (draftForm[f.minKey] === undefined) draftForm[f.minKey] = undefined
        if (draftForm[f.maxKey] === undefined) draftForm[f.maxKey] = undefined
        return
      }
      if (draftForm[f.key] === undefined) {
        draftForm[f.key] = ''
      }
    })
  }, { immediate: true })

  watch(qualityFieldsRef, (newFields) => {
    ;(newFields || []).forEach((f) => {
      if (!f) return
      if (qualityForm[f.key] === undefined) {
        qualityForm[f.key] = f.type === 'number' ? undefined : ''
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

        draftFieldsRef.value.forEach((f) => {
          if (f.type === 'range' && f.minKey && f.maxKey) {
            const minV = allData[f.minKey]
            const maxV = allData[f.maxKey]
            draftForm[f.minKey] = (minV === '' || minV == null) ? undefined : Number(minV)
            draftForm[f.maxKey] = (maxV === '' || maxV == null) ? undefined : Number(maxV)
            return
          }
          draftForm[f.key] = allData[f.key] ?? ''
        })
        qualityFieldsRef.value.forEach((f) => {
          const v = allData[f.key]
          if (f.type === 'number') {
            qualityForm[f.key] = (v === '' || v === null) ? undefined : v
          } else {
            qualityForm[f.key] = v ?? ''
          }
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
      error.value = ''
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.message || '保存草稿失败'
      return false
    } finally {
      saving.value = false
    }
  }

  async function submit(batchNo: string) {
    saving.value = true
    try {
      // 先保存草稿，确保 draft 实体字段入库（submit DTO 不含这些字段）
      await api.createDraft(batchNo, { ...draftForm, ...qualityForm })
      const res = await api.submitQuality(batchNo, {
        ...draftForm,
        ...qualityForm,
        operatorName: draftForm.operatorName ?? qualityForm.operatorName,
      })
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
