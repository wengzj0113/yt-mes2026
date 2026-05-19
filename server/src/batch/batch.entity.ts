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
}

@Entity('batch')
export class Batch {
  @PrimaryColumn({ length: 16 })
  batchNo: string;

  @Column({ length: 128 })
  productModel: string;

  @Column({ type: 'nvarchar', length: 128, nullable: true })
  productSpec: string | null;

  @Column({ length: 64 })
  workshop: string;

  @Column({ length: 32 })
  shift: string;

  @Column({ type: 'int' })
  plannedQty: number;

  @Column({ type: 'date' })
  actualStartDate: Date;

  @Column({ type: 'tinyint', default: BatchStatus.DRAFT })
  status: number = BatchStatus.DRAFT;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  remarks: string | null;

  @Column({ type: 'int' })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn()
  updatedAt: Date | null;
}
