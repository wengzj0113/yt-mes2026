import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('batch_status_log')
export class BatchStatusLog {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'batch_no', length: 16 })
  batchNo: string;

  @Column({ name: 'from_status', type: 'tinyint', nullable: true })
  fromStatus: number | null;

  @Column({ name: 'to_status', type: 'tinyint' })
  toStatus: number;

  @Column({ name: 'changed_by', type: 'int', nullable: true })
  changedBy: number | null;

  @Column({ name: 'change_reason', type: 'nvarchar', length: 200, nullable: true })
  changeReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
