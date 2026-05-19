import { get } from './index'

export interface CellBarcodeRecord {
  barcode: string
  batchNo: string
  voltage: number
  internalResistance: number
  capacity: number
  grade: string
  importSource: string
  importedAt: string
}

export interface CellTraceResult {
  cell: CellBarcodeRecord
  batch: {
    batchNo: string
    productModel: string
    productSpec: string
    status: number
    plannedQty: number
    createdAt: string
  } | null
  processes: Record<string, any>
}

export interface CellBarcodePageResult {
  items: CellBarcodeRecord[]
  total: number
  page: number
  pageSize: number
}

export const cellApi = {
  trace(barcode: string) {
    return get<CellTraceResult>(`/cells/${barcode}/trace`)
  },
  findByBatch(batchNo: string, page = 1, pageSize = 20) {
    return get<any>(`/cells/batch/${batchNo}/barcodes`, { page, pageSize })
  },
}
