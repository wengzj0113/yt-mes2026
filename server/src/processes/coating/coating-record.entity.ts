import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('coating_record')
export class CoatingRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) coatingSpeed: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) coatingThicknessPos: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) coatingThicknessNeg: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) arealDensityPos: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) arealDensityNeg: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) coatingTemperature: number;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
