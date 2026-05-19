import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('grading_record')
export class GradingRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ type: 'nvarchar', length: 500, nullable: true }) chargeDischargeTemplate: string | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) gradingTemperature: number | null;
  @Column({ type: 'nvarchar', length: 500, nullable: true }) capacityGradeStandard: string | null;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
