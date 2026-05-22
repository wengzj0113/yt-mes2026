import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('baking_record')
export class BakingRecord {
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

  @Column({ name: 'baking_temperature', type: 'decimal', precision: 8, scale: 2 }) 
  bakingTemperature: number;

  @Column({ name: 'baking_duration', type: 'int' }) 
  bakingDuration: number;

  @Column({ name: 'vacuum_level', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  vacuumLevel: number | null;

  @Column({ name: 'moisture_after_baking', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  moistureAfterBaking: number | null;

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
