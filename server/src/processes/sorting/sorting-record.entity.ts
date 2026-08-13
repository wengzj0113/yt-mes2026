import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('sorting_record')
export class SortingRecord {
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

  @Column({ name: 'ocv_voltage_range', length: 500, nullable: true })
  ocvVoltageRange: string;

  @Column({ name: 'ocv_voltage_min', type: 'decimal', precision: 10, scale: 4, nullable: true })
  ocvVoltageMin: number | null;

  @Column({ name: 'ocv_voltage_max', type: 'decimal', precision: 10, scale: 4, nullable: true })
  ocvVoltageMax: number | null;

  @Column({ name: 'ir_range', length: 500, nullable: true })
  irRange: string;

  @Column({ name: 'ir_min', type: 'decimal', precision: 10, scale: 4, nullable: true })
  irMin: number | null;

  @Column({ name: 'ir_max', type: 'decimal', precision: 10, scale: 4, nullable: true })
  irMax: number | null;

  @Column({ name: 'capacity_range', length: 500, nullable: true })
  capacityRange: string;

  @Column({ name: 'capacity_min', type: 'decimal', precision: 10, scale: 4, nullable: true })
  capacityMin: number | null;

  @Column({ name: 'capacity_max', type: 'decimal', precision: 10, scale: 4, nullable: true })
  capacityMax: number | null;

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
