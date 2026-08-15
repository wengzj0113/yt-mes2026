import { get, post } from './index'

export interface Ocv1UploadPayload {
  batchNo: string
  barcode: string
  voltage: number
  internalResistance: number
  testTime: string
  equipmentCode?: string
}

export interface Ocv2UploadPayload extends Ocv1UploadPayload {
  kValue: number
}

export interface CellBarcodeRecord {
  barcode: string
  batchNo: string
  voltage: number
  internalResistance: number
  capacity: string
  grade: string
  kValue?: number | null
  importSource: string
  importedAt: string
  // OCV1 字段
  ocv1Voltage?: number | null
  ocv1Resistance?: number | null
  ocv1Time?: string | null
  ocv1EquipmentCode?: string | null
  // OCV2 字段
  ocv2Voltage?: number | null
  ocv2Resistance?: number | null
  ocv2Time?: string | null
  ocv2EquipmentCode?: string | null
  sortingTime?: string | null
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
  uploadOcv1(payload: Ocv1UploadPayload) {
    return post<CellBarcodeRecord>('/cells/ocv1-upload', payload)
  },
  bulkUploadOcv1(records: Ocv1UploadPayload[]) {
    return post<CellBarcodeRecord[]>('/cells/ocv1-upload/bulk', { ocv1Records: records })
  },
  uploadOcv2(payload: Ocv2UploadPayload) {
    return post<CellBarcodeRecord>('/cells/ocv2-upload', payload)
  },
  bulkUploadOcv2(records: Ocv2UploadPayload[]) {
    return post<CellBarcodeRecord[]>('/cells/ocv2-upload/bulk', { ocv2Records: records })
  },
}
