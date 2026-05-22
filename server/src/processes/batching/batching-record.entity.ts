import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('batching_record')
export class BatchingRecord {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'batch_no', length: 16 })
  batchNo: string;

  @Column({ name: 'record_status', type: 'tinyint', default: 1 })
  recordStatus: number = 1;

  @Column({ name: 'is_draft', default: true })
  isDraft: boolean = true;

  @Column({ name: 'positive_material', length: 128 })
  positiveMaterial: string;

  @Column({ name: 'negative_material', length: 128 })
  negativeMaterial: string;

  @Column({ name: 'viscosity_record', type: 'nvarchar', length: 256, nullable: true })
  viscosityRecord: string | null;

  @Column({ name: 'operator_name', length: 32 })
  operatorName: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'extra_data' })
  extraData: string;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null;
}
