import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ocv2_record')
export class Ocv2Record {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index()
  @Column({ name: 'batch_no', length: 16 })
  batchNo: string;

  @Column({ name: 'record_status', type: 'tinyint', default: 1 })
  recordStatus: number = 1;

  @Column({ name: 'is_draft', default: false })
  isDraft: boolean = false;

  @Column({ name: 'ocv_voltage_min', type: 'decimal', precision: 12, scale: 4, nullable: true })
  ocvVoltageMin: number | null;

  @Column({ name: 'ocv_voltage_max', type: 'decimal', precision: 12, scale: 4, nullable: true })
  ocvVoltageMax: number | null;

  @Column({ name: 'equipment_code', type: 'nvarchar', length: 64, nullable: true })
  equipmentCode: string | null;

  @Column({ name: 'operator_name', type: 'nvarchar', length: 64, nullable: true })
  operatorName: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null;
}