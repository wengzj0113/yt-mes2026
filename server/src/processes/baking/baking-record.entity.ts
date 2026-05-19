import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('baking_record')
export class BakingRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) bakingTemperature: number;
  @Column({ type: 'int' }) bakingDuration: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) vacuumLevel: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) moistureAfterBaking: number | null;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
