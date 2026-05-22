import { post, get } from './index'

export interface CreatePackDto {
  packBarcode: string
  batchNo?: string
  protectionBoardBarcode?: string
  cellBarcodes: string[]
}

export interface PackCell {
  id: number
  cellBarcode: string
  packId: number
}

export interface Pack {
  id: number
  packBarcode: string
  batchNo: string
  protectionBoardBarcode: string
  operatorName: string
  cells: PackCell[]
  createdAt: string
}

export function createOrUpdatePack(data: CreatePackDto) {
  return post<Pack>('/packs', data)
}

export function getPackByBarcode(barcode: string) {
  return get<Pack>(`/packs/${barcode}`)
}

export function getPackList(page: number = 1, pageSize: number = 10) {
  return get<{ items: Pack[]; total: number }>('/packs', { page, pageSize })
}
