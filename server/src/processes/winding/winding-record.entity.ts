import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('winding_record')
export class WindingRecord {
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

  @Column({ name: 'separator_model', length: 128 }) 
  separatorModel: string;

  @Column({ name: 'winding_speed', type: 'decimal', precision: 8, scale: 2 }) 
  windingSpeed: number;

  @Column({ name: 'winding_tension', type: 'decimal', precision: 8, scale: 2 }) 
  windingTension: number;

  @Column({ name: 'core_thickness', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  coreThickness: number | null;

  @Column({ name: 'core_diameter', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  coreDiameter: number | null;

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
