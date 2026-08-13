import { get, post, del, patch } from './index'

export interface QualityTrendItem {
  batchNo: string
  passRate: number
}

export const qualityApi = {
  getTrends() {
    return get<QualityTrendItem[]>('/quality/trends')
  },
  list(batchNo: string) {
    return get<any[]>(`/batches/${batchNo}/quality-checks`)
  },
  create(batchNo: string, data: any) {
    return post<any>(`/batches/${batchNo}/quality-checks`, data)
  },

  // 新增
  listAll(params: any) {
    return get<any>('/quality', params)
  },
  getPending(batchNo?: string) {
    return get<any[]>('/quality/pending', batchNo ? { batchNo } : undefined)
  },
  getById(id: number) {
    return get<any>(`/quality/${id}`)
  },
  update(id: number, data: any) {
    return patch<any>(`/quality/${id}`, data)
  },
  remove(id: number) {
    return del<any>(`/quality/${id}`)
  },
  inspect(batchNo: string, data: any) {
    return post<any>('/quality/inspect', { ...data, batchNo })
  }
}
