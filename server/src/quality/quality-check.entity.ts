import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const VALID_PROCESS_TYPES = [
  'batching', 'coating', 'roller-pressing', 'slitting', 'electrode',
  'winding', 'assembly', 'baking', 'injection', 'wrapping',
  'formation', 'grading', 'sorting',
] as const;

@Entity('quality_check')
export class QualityCheck {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ length: 32 }) processType: string;
  @Column({ type: 'tinyint' }) inspectionResult: number;
  @Column({ type: 'int', nullable: true }) defectQty: number | null;
  @Column({ type: 'nvarchar', length: 512, nullable: true }) defectReason: string | null;
  @Column({ length: 32 }) inspectorName: string;
  @Column({ type: 'nvarchar', length: 512, nullable: true }) abnormalRecord: string | null;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
