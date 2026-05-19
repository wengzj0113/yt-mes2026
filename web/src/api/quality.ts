import { get, post } from './index'

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
  }
}
