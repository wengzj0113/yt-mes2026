import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('process_dynamic_record')
@Index(['batchNo', 'processCode'], { unique: true })
export class ProcessDynamicRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'batch_no', length: 16 }) batchNo: string;
  @Column({ name: 'process_code', length: 32 }) processCode: string;
  @Column({ name: 'extra_data', type: 'nvarchar', length: 'max', nullable: true }) extraData: string | null;
  @Column({ name: 'record_status', type: 'int', default: 1 }) recordStatus: number;
  @Column({ name: 'is_draft', default: true }) isDraft: boolean;
  @Column({ name: 'created_by', type: 'int', nullable: true }) createdBy: number | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @Column({ name: 'updated_by', type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
