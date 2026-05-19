import { get, post } from './index'
export const materialApi = {
  list(batchNo: string) { return get(`/batches/${batchNo}/materials`) },
  create(batchNo: string, data: any) { return post(`/batches/${batchNo}/materials`, data) },
  getAvailable(batchNo: string, type: number) { return get(`/batches/${batchNo}/materials/available`, { type }) },
}
