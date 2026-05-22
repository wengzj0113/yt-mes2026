import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('wrapping_record')
export class WrappingRecord {
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

  @Column({ name: 'film_model', length: 128 }) 
  filmModel: string;

  @Column({ name: 'shrink_temperature', type: 'decimal', precision: 8, scale: 2 }) 
  shrinkTemperature: number;

  @Column({ name: 'appearance_check', type: 'tinyint', nullable: true }) 
  appearanceCheck: number | null;

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
