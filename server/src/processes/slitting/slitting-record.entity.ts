import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('slitting_record')
export class SlittingRecord {
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

  @Column({ name: 'electrode_width', type: 'decimal', precision: 8, scale: 2 }) 
  electrodeWidth: number;

  @Column({ name: 'electrode_length', type: 'decimal', precision: 8, scale: 2 }) 
  electrodeLength: number;

  @Column({ name: 'slitting_speed', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  slittingSpeed: number | null;

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
