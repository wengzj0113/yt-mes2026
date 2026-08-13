import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cellApi } from './cells'
import { post } from './index'

vi.mock('./index', () => ({
  get: vi.fn(),
  post: vi.fn(),
}))

describe('cellApi OCV uploads', () => {
  beforeEach(() => {
    vi.mocked(post).mockReset()
    vi.mocked(post).mockResolvedValue({ data: null } as any)
  })

  it('uploads one OCV1 test with the device payload', async () => {
    const payload = {
      batchNo: 'BATCH-OCV-001',
      barcode: 'CELL-001',
      voltage: 3.721,
      internalResistance: 18.4,
      testTime: '2026-08-05T10:00:00.000Z',
      equipmentCode: 'OCV1-01',
    }

    await cellApi.uploadOcv1(payload)

    expect(post).toHaveBeenCalledWith('/cells/ocv1-upload', payload)
  })

  it('uploads one OCV2 test with kValue', async () => {
    const payload = {
      batchNo: 'BATCH-OCV-001',
      barcode: 'CELL-001',
      voltage: 3.718,
      internalResistance: 19.1,
      kValue: 0.42,
      testTime: '2026-08-05T10:00:00.000Z',
      equipmentCode: 'OCV2-01',
    }

    await cellApi.uploadOcv2(payload)

    expect(post).toHaveBeenCalledWith('/cells/ocv2-upload', payload)
  })

  it('uses the bulk endpoints for OCV1 and OCV2 records', async () => {
    const ocv1Records = [{ batchNo: 'B1', barcode: 'C1', voltage: 3.7, internalResistance: 18, testTime: '2026-08-05T10:00:00.000Z' }]
    const ocv2Records = [{ batchNo: 'B1', barcode: 'C1', voltage: 3.7, internalResistance: 18, kValue: 0.4, testTime: '2026-08-05T10:00:00.000Z' }]

    await cellApi.bulkUploadOcv1(ocv1Records)
    await cellApi.bulkUploadOcv2(ocv2Records)

    expect(post).toHaveBeenNthCalledWith(1, '/cells/ocv1-upload/bulk', { ocv1Records })
    expect(post).toHaveBeenNthCalledWith(2, '/cells/ocv2-upload/bulk', { ocv2Records })
  })
})
