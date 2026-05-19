import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('batching_record')
export class BatchingRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 16 })
  batchNo: string;

  @Column({ type: 'tinyint', default: 1 })
  recordStatus: number = 1;

  @Column({ default: true })
  isDraft: boolean = true;

  @Column({ length: 128 })
  positiveMaterial: string;

  @Column({ length: 128 })
  negativeMaterial: string;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  viscosityRecord: string | null;

  @Column({ length: 32 })
  operatorName: string;

  @Column({ type: 'int' })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn()
  updatedAt: Date | null;
}
