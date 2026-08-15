import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const VALID_PROCESS_TYPES = [
  'batching', 'coating', 'roller-pressing', 'slitting', 'electrode',
  'winding', 'assembly', 'baking', 'injection', 'wrapping',
  'casing', 'integrated-machine', 'laser-welding', 'formation-grading',
  'formation', 'grading', 'sorting',
] as const;

@Entity('quality_check')
export class QualityCheck {
  @PrimaryGeneratedColumn({ name: 'id' }) 
  id: number;

  @Column({ name: 'batch_no', length: 16 }) 
  batchNo: string;

  @Column({ name: 'process_type', length: 32 }) 
  processType: string;

  @Column({ name: 'inspection_result', type: 'tinyint' }) 
  inspectionResult: number;

  @Column({ name: 'defect_qty', type: 'int', nullable: true }) 
  defectQty: number | null;

  @Column({ name: 'defect_reason', type: 'nvarchar', length: 512, nullable: true }) 
  defectReason: string | null;

  @Column({ name: 'inspector_name', length: 32 }) 
  inspectorName: string;

  @Column({ name: 'abnormal_record', type: 'nvarchar', length: 512, nullable: true }) 
  abnormalRecord: string | null;

  @Column({ name: 'created_by', type: 'int' }) 
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true }) 
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' }) 
  updatedAt: Date | null;
}
