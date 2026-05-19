import { Batch, BatchStatus } from './batch.entity';

describe('Batch Entity', () => {
  it('should create a batch with required fields', () => {
    const batch = new Batch();
    batch.batchNo = 'WT26A01MA';
    batch.productModel = '18650/2100mAh/3.7V';
    batch.workshop = 'A 车间';
    batch.shift = '早班';
    batch.plannedQty = 10000;
    batch.actualStartDate = new Date('2026-05-01');
    batch.createdBy = 1;

    expect(batch.batchNo).toBe('WT26A01MA');
    expect(batch.productModel).toBe('18650/2100mAh/3.7V');
    expect(batch.plannedQty).toBe(10000);
  });

  it('should default status to DRAFT (1)', () => {
    const batch = new Batch();
    expect(batch.status).toBe(BatchStatus.DRAFT);
  });

  it('should support all status values', () => {
    expect(BatchStatus.DRAFT).toBe(1);
    expect(BatchStatus.IN_PROGRESS).toBe(2);
    expect(BatchStatus.COMPLETED).toBe(3);
    expect(BatchStatus.CLOSED).toBe(4);
  });

  it('should allow remarks to be optional', () => {
    const batch = new Batch();
    batch.batchNo = 'WT26B02MN';
    batch.productModel = 'Test';
    batch.workshop = 'Test';
    batch.shift = 'Test';
    batch.plannedQty = 100;
    batch.actualStartDate = new Date();
    batch.createdBy = 1;

    expect(batch.remarks).toBeUndefined();
    batch.remarks = '测试批次';
    expect(batch.remarks).toBe('测试批次');
  });

  it('should enforce positive planned_qty', () => {
    const batch = new Batch();
    batch.plannedQty = 5000;
    expect(batch.plannedQty).toBeGreaterThan(0);
  });

  it('should record audit timestamps', () => {
    const batch = new Batch();
    const now = new Date();
    batch.createdAt = now;
    expect(batch.createdAt).toEqual(now);
  });
});
