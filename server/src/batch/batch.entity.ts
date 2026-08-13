import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BatchStatus {
  DRAFT = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  CLOSED = 4,
  QUALITY_ISSUE = 5,
}

@Entity('batch')
export class Batch {
  @PrimaryColumn({ name: 'batch_no', length: 16 })
  batchNo: string;

  @Column({ name: 'product_model', length: 128 })
  productModel: string;

  @Column({ name: 'product_spec', type: 'nvarchar', length: 128, nullable: true })
  productSpec: string | null;

  @Column({ name: 'workshop', length: 64 })
  workshop: string;

  @Column({ name: 'shift', length: 32 })
  shift: string;

  @Column({ name: 'planned_qty', type: 'int' })
  plannedQty: number;

  @Column({ name: 'actual_start_date', type: 'date' })
  actualStartDate: Date;

  @Column({ name: 'status', type: 'tinyint', default: BatchStatus.DRAFT })
  status: number = BatchStatus.DRAFT;

  @Column({ name: 'remarks', type: 'nvarchar', length: 500, nullable: true })
  remarks: string | null;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null;
}
