import { get } from './index'

export interface BatchStatusLogItem {
  id?: number
  batchNo?: string
  fromStatus: number | null
  toStatus: number
  changedBy?: number | null
  changeReason: string | null
  createdAt: string
}

export const statusLogApi = {
  list(batchNo: string) {
    return get<BatchStatusLogItem[]>(`/batches/${batchNo}/status-logs`)
  },
}
