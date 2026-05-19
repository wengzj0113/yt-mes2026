import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('batch_status_log')
export class BatchStatusLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 16 })
  batchNo: string;

  @Column({ type: 'tinyint', nullable: true })
  fromStatus: number | null;

  @Column({ type: 'tinyint' })
  toStatus: number;

  @Column({ type: 'int', nullable: true })
  changedBy: number | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  changeReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
