import { get, post, patch } from './index'
import type { BatchDto } from '@/types/api'

export interface ProcessStatusItem {
  processKey: string
  processName: string
  route: string
  status: 'not_entered' | 'draft' | 'submitted' | 'voided'
  isDraft: boolean | null
  recordStatus: number | null
  updatedAt: string | null
}

export const batchApi = {
  list(params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
    return get<{ items: BatchDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>('/batches', params)
  },
  generateNo(mnRatio?: string) {
    return get<{ batchNo: string }>('/batches/generate-no', mnRatio ? { mnRatio } : undefined)
  },
  create(data: any) {
    return post<BatchDto>('/batches', data)
  },
  getByNo(batchNo: string) {
    return get<BatchDto>(`/batches/${batchNo}`)
  },
  getProcessStatus(batchNo: string) {
    return get<ProcessStatusItem[]>('/processes/status/' + batchNo)
  },
  getProcessRecords(batchNo: string) {
    return get<Record<string, any>>('/processes/records/' + batchNo)
  },
  update(batchNo: string, data: any) {
    return patch<BatchDto>(`/batches/${batchNo}`, data)
  },
  getStats() {
    return get<any>('/batches/stats')
  },
}
