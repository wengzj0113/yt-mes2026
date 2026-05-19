import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sorting_record')
export class SortingRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ length: 500 }) ocvVoltageRange: string;
  @Column({ length: 500 }) irRange: string;
  @Column({ length: 500 }) capacityRange: string;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
