import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('coating_record')
export class CoatingRecord {
  @PrimaryGeneratedColumn({ name: 'id' }) 
  id: number;

  @Index()
  @Column({ name: 'batch_no', length: 16 }) 
  batchNo: string;

  @Column({ name: 'record_status', type: 'tinyint', default: 1 }) 
  recordStatus: number = 1;

  @Column({ name: 'is_draft', default: true }) 
  isDraft: boolean = true;

  @Column({ name: 'equipment_code', length: 16 }) 
  equipmentCode: string;

  @Column({ name: 'coating_speed', type: 'decimal', precision: 8, scale: 2 }) 
  coatingSpeed: number;

  @Column({ name: 'coating_thickness_pos', type: 'decimal', precision: 8, scale: 2 }) 
  coatingThicknessPos: number;

  @Column({ name: 'coating_thickness_neg', type: 'decimal', precision: 8, scale: 2 }) 
  coatingThicknessNeg: number;

  @Column({ name: 'areal_density_pos', type: 'decimal', precision: 8, scale: 2 }) 
  arealDensityPos: number;

  @Column({ name: 'areal_density_neg', type: 'decimal', precision: 8, scale: 2 }) 
  arealDensityNeg: number;

  @Column({ name: 'coating_temperature', type: 'decimal', precision: 8, scale: 2 }) 
  coatingTemperature: number;

  @Column({ name: 'operator_name', length: 32 }) 
  operatorName: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'extra_data' }) 
  extraData: string;

  @Column({ name: 'created_by', type: 'int' }) 
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true }) 
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' }) 
  updatedAt: Date | null;
}
